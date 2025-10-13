// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// 錯誤類型定義
interface SyncError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 標準化錯誤回應
function createErrorResponse(error: SyncError, status = 400): Response {
  console.error(`Sync error [${error.code}]:`, error.message, error.details);
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    }
  );
}

// 標準化成功回應
function createSuccessResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

console.log("Sync Customer Record Function loaded");

Deno.serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 驗證環境變數
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return createErrorResponse({
        code: "MISSING_ENV_VARS",
        message: "Missing required environment variables",
      }, 500);
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // 驗證授權標頭
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return createErrorResponse({
        code: "MISSING_AUTH_HEADER",
        message: "Missing or invalid Authorization header",
      }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      return createErrorResponse({
        code: "INVALID_TOKEN",
        message: "Invalid or expired token",
        details: { error: userError.message },
      }, 401);
    }

    const user = data.user;
    if (!user) {
      return createErrorResponse({
        code: "USER_NOT_FOUND",
        message: "User not found",
      }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 解析請求體
    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch (error) {
      console.warn("無法解析請求體，使用空物件:", error);
    }

    console.log("Sync request body:", body);
    console.log("User ID:", user.id);

    // 使用統一身份解析函數檢查用戶身份
    const { data: identityData, error: identityError } = await supabaseClient
      .rpc('resolve_user_identity', { auth_user_id: user.id });

    if (identityError) {
      return createErrorResponse({
        code: "IDENTITY_RESOLVE_ERROR",
        message: "Failed to resolve user identity",
        details: { error: identityError.message },
      }, 500);
    }

    console.log("User identity resolved:", identityData);

    // 檢查是否已經是管理員用戶
    if (identityData.type === 'admin') {
      return createErrorResponse({
        code: "USER_TYPE_CONFLICT",
        message: "This auth user is already registered as an admin user, cannot register as customer",
        details: { existingType: 'admin', requestedType: 'customer' },
      }, 400);
    }

    // 查詢 customers 表是否已存在記錄
    const { data: existing, error: queryError } = identityData.type === 'customer' 
      ? await supabaseClient
          .from("customers")
          .select("*")
          .eq("id", identityData.id)
          .single()
      : { data: null, error: { code: "PGRST116" } }; // 模擬 "no rows returned" 錯誤

    if (queryError && queryError.code !== "PGRST116") { // PGRST116 是 "no rows returned" 錯誤
      return createErrorResponse({
        code: "DATABASE_QUERY_ERROR",
        message: "Failed to query existing customer record",
        details: { error: queryError.message },
      }, 500);
    }

    // TODO: 不同登入方式，avatar_url 可能不同。欄位或 provider 過多時抽一個 utility function
    if (existing) {
      // 若已存在，則更新（可根據需求選擇更新哪些欄位）

      // 只更新 body 內有傳的欄位，未傳的不更新
      const updateData: Record<string, any> = {};
      // 處理 session 更新
      if (!existing.email && user.email) updateData.email = user.email;
      if (!existing.phone && user.phone) updateData.phone = user.phone;
      if (!existing.full_name && user.user_metadata?.full_name) {
        updateData.full_name = user.user_metadata.full_name;
      }
      if (!existing.avatar_url && user.user_metadata?.avatar_url) {
        updateData.avatar_url = user.user_metadata?.avatar_url;
      }
      // 處理傳參更新
      // if ("email" in body) updateData.email = body.email;
      if ("phone" in body) updateData.phone = body.phone;
      if ("full_name" in body) updateData.full_name = body.full_name;
      if ("avatar_url" in body) {
        updateData.avatar_url = body.avatar_url;
      }

      if (Object.keys(updateData).length > 0) {
        const { data, error: updateError } = await supabaseClient
          .from("customers")
          .update(updateData)
          .eq("id", existing.id);

        if (updateError) {
          return createErrorResponse({
            code: "UPDATE_CUSTOMER_ERROR",
            message: "Failed to update customer record",
            details: { error: updateError.message, updateData },
          }, 500);
        }

        // 更新用戶的 user_metadata 和 app_metadata
        const { error: sessionError } =
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              custom: { ...user.user_metadata?.custom, ...updateData },
            },
            app_metadata: {
              role_type: "customer",
            },
          });

        if (sessionError) {
          console.warn("更新用戶 metadata 失敗:", sessionError);
          // 不返回錯誤，因為主要的客戶記錄更新已成功
        }
      } else {
        // 即使沒有更新資料，也要確保設置正確的 app_metadata
        const { error: sessionError } =
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            app_metadata: {
              role_type: "customer",
            },
          });

        if (sessionError) {
          console.warn("設置用戶 app_metadata 失敗:", sessionError);
        }
      }
    } else {
      console.log("Creating new customer record for user:", user.id);
      
      // 建立新的客戶記錄
      const newCustomerData = {
        auth_user_id: user.id,
        email: user.email,
        phone: user.phone ?? null,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url:
          user.user_metadata?.custom?.avatar_url ??
          user.user_metadata?.avatar_url ??
          null,
      };

      const { data: newCustomer, error: insertError } = await supabaseClient
        .from("customers")
        .insert(newCustomerData)
        .select()
        .single();

      if (insertError) {
        return createErrorResponse({
          code: "CREATE_CUSTOMER_ERROR",
          message: "Failed to create customer record",
          details: { error: insertError.message, customerData: newCustomerData },
        }, 500);
      }

      // 設置用戶的 app_metadata
      const { error: sessionError } =
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            role_type: "customer",
          },
        });

      if (sessionError) {
        console.warn("設置新用戶 app_metadata 失敗:", sessionError);
        // 不返回錯誤，因為主要的客戶記錄創建已成功
      }

      console.log("Successfully created customer record:", newCustomer);
    }

    return createSuccessResponse({
      user_id: user.id,
      email: user.email,
      action: existing ? "updated" : "created",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected error in sync-customer-record:", error);
    return createErrorResponse({
      code: "UNEXPECTED_ERROR",
      message: "An unexpected error occurred during synchronization",
      details: { error: error.message },
    }, 500);
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sync-user-record' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
