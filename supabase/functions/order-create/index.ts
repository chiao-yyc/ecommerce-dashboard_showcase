import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// 事件追蹤輔助函數
interface TrackOrderEventData {
  eventType: string;
  userId: string;
  orderId: string;
  orderAmount: number;
  items: any[];
  campaignId?: string;
}

async function trackOrderEvent(supabaseClient: any, eventData: TrackOrderEventData) {
  const sessionId = crypto.randomUUID();
  
  try {
    // 記錄通用事件到 events 表
    await supabaseClient
      .from('events')
      .insert({
        type: eventData.eventType,
        user_id: eventData.userId,
        campaign_id: eventData.campaignId,
        payload: {
          eventType: eventData.eventType,
          orderId: eventData.orderId,
          orderAmount: eventData.orderAmount,
          itemCount: eventData.items?.length || 0,
          items: eventData.items?.map(item => ({
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
          })),
          sessionId: sessionId,
          timestamp: new Date().toISOString(),
          source: 'order_create_function',
        },
        created_at: new Date().toISOString(),
      });

    // 記錄漏斗事件到 funnel_events 表
    await supabaseClient
      .from('funnel_events')
      .insert({
        user_id: eventData.userId,
        step: 'order_complete',
        session_id: sessionId,
        campaign_id: eventData.campaignId,
        event_at: new Date().toISOString(),
        metadata: {
          orderId: eventData.orderId,
          orderAmount: eventData.orderAmount,
          itemCount: eventData.items?.length || 0,
          source: 'order_create_function',
        },
        created_at: new Date().toISOString(),
      });

    console.log(`✅ 事件追蹤成功: ${eventData.eventType} for order ${eventData.orderId}`);
    
  } catch (error) {
    console.error(`❌ 事件追蹤失敗:`, error);
    throw error;
  }
}

// 解析用戶身份的輔助函數（使用統一身份解析函數）
async function resolveUser(supabaseClient: any, authUserId: string) {
  try {
    // 使用統一身份解析函數
    const { data: identityData, error: identityError } = await supabaseClient
      .rpc('resolve_user_identity', { auth_user_id: authUserId });

    if (identityError) {
      console.error("Identity resolution failed:", identityError);
      throw new Error(`Identity resolution failed: ${identityError.message}`);
    }

    console.log("User identity resolved:", identityData);

    // 根據身份類型返回結果
    if (identityData.type === 'customer') {
      return { id: identityData.id, type: 'customer' };
    } else if (identityData.type === 'admin') {
      return { id: identityData.id, type: 'admin' };
    } else if (identityData.type === 'not_found') {
      return null;
    } else {
      throw new Error(`Unknown user identity type: ${identityData.type}`);
    }
  } catch (error) {
    console.error("Error in resolveUser:", error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Get the session or user object
  const authHeader = req.headers.get("Authorization")!;
  const jwt = authHeader?.replace("Bearer ", "");
  const {
    data: { user: authUser },
    error,
  } = await supabaseClient.auth.getUser(jwt);

  if (!authUser) {
    return new Response("Unauthorized", { headers: corsHeaders, status: 401 });
  }

  console.log("User's ID:", authUser.id);

  // 解析用戶身份（支援 customers 和 users 兩種用戶類型）
  try {
    const localUser = await resolveUser(supabaseClient, authUser.id);
    
    if (!localUser) {
      console.log("User mapping not found in both customers and users tables");
      return new Response("User mapping not found", {
        headers: corsHeaders,
        status: 401,
      });
    }

    console.log(`User resolved as ${localUser.type} with ID: ${localUser.id}`);

    // 繼續使用 localUser.id 作為 created_by
    const createdBy = localUser.id;

    // 從 request 中取得訂單資料與項目
    const requestBody = await req.json();
    const { order_data, items } = requestBody;
    
    console.log("收到的請求資料:", JSON.stringify(requestBody, null, 2));
    console.log("order_data:", order_data);
    console.log("items:", items);
    console.log("items 類型:", typeof items, "是陣列:", Array.isArray(items));

    // 準備 RPC 參數
    // 前端經過 mapEntityToDb 轉換後傳送 snake_case 格式
    // 優先使用 customer_id，如果沒有則使用 user_id（向後兼容）
    const customerId = order_data.customer_id || order_data.user_id;
    
    if (!customerId) {
      console.error("缺少客戶 ID");
      return new Response(JSON.stringify({ error: "Customer ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    console.log("使用客戶 ID:", customerId);
    
    // 根據用戶類型準備 RPC 參數
    const rpcParams = localUser.type === 'admin' 
      ? {
          // 管理員為客戶建立訂單
          order_data: { ...order_data, customer_id: customerId },
          items: items,
          created_by: createdBy,
          created_by_type: 'user'
        }
      : {
          // 客戶自助下單
          order_data: { ...order_data, customer_id: localUser.id },
          items: items, 
          created_by: localUser.id,
          created_by_type: 'customer'
        };

    console.log("RPC 參數:", JSON.stringify(rpcParams, null, 2));

    // 呼叫 RPC 建立訂單（包含自動扣庫存）
    const { data: result, error: rpcError } = await supabaseClient.rpc(
      "create_order_with_items",
      rpcParams
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 檢查 RPC 返回值
    console.log("RPC 返回結果:", result);
    
    if (!result) {
      console.error("RPC 函數沒有返回結果");
      return new Response(JSON.stringify({ error: "No result returned from order creation" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // 檢查 order_id 是否存在
    if (!result.order_id) {
      console.error("RPC 函數沒有返回 order_id:", result);
      return new Response(JSON.stringify({ error: "Order creation failed: no order_id returned" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log("訂單創建成功，order_id:", result.order_id);

    // 查詢新建立訂單的訂單編號
    let orderNumber = null;
    try {
      const { data: orderDetails, error: orderError } = await supabaseClient
        .from('orders')
        .select('order_number')
        .eq('id', result.order_id)
        .single();

      if (orderError) {
        console.error("查詢訂單編號失敗:", orderError);
      } else {
        orderNumber = orderDetails?.order_number;
        console.log("訂單編號:", orderNumber);
      }
    } catch (queryError) {
      console.error("查詢訂單編號異常:", queryError);
    }

    // 追蹤訂單創建事件
    try {
      await trackOrderEvent(supabaseClient, {
        eventType: 'order_complete',
        userId: customerId,
        orderId: result.order_id,
        orderAmount: order_data.total_amount,
        items: items,
        campaignId: order_data.campaign_id,
      });
    } catch (eventError) {
      console.error("⚠️ 事件追蹤失敗，但不影響訂單創建:", eventError);
      // 事件追蹤失敗不應影響訂單創建的成功響應
    }

    return new Response(
      JSON.stringify({
        order_id: result.order_id,
        order_number: orderNumber,
        message: result.message || "Order created successfully",
        status: result.status || "success"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing order creation:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
