> ▸ 複製此程式碼至 **Draw.io → Arrange → Insert → Advanced → PlantUML**  
> ▸ 即可得到圖形 ERD，之後匯出 `erd.png`。

> **提示**：導入 Supabase 後請 `ALTER TABLE ... ENABLE RLS;` 並套用先前 `rls-policy.md`。  
> 若需多 SKU 支援，可將 `sku` 改成獨立 `product_variants` 表並把 `inventory` FK 指向之。


> **待釐清**：
> - 新增 public.order_status_logs 表，用於追蹤每次狀態變更，以檢視付款時間、發貨時間、回購率等指標
> - 新增 view: order_with_owner，用於顯示 order 資料及 owner 資料，顯示 owner 的 role
> - 需要手動更新初始化：agent_assignments
  ```sql
  insert into agent_assignments (user_id)
  select user_id from agent_users
  on conflict (user_id) do nothing;
  ```

> - 有效訂單的條件為 status in ('paid', 'processing', 'shipped', 'delivered', 'completed')

> **supabase Edge Functions**：
> - sync-user-record: 用於同步 auth.users 資料到 public.users
> - order-summary: 用於查詢訂單統計資料。與 `order_summary_daily` view 有差異，查詢更長時間的訂單統計且整合多個指標專供前端使用
> - allocate-inventory: 用於調整商品庫存，處理 out 情況，成功調整後回傳當前商品的庫存
> - order-create: 用於建立訂單並扣除庫存

> **supabase Realtime**：
> - channel: `orders-dashboard`，用於訂單實時更新
> - 需設定 realtime on 的資料表：`orders`
> - channel: `conversation-${conversationId}`，用於客服聊天室訊息實時更新
> - channel: `conversation`，用於客服對話清單實時更新
> - 需設定 realtime on 的資料表：`conversations`, `messages`

> **supabase Postgre View**：
> - view: `user_with_roles`，用於顯示 user 資料及 role
> - view: `order_summary_daily`，用於顯示每日訂單統計
> - view: `active_products`，顯示未刪除的產品
> - view: `inventory_with_stock_detail`，顯示庫存入庫狀況（並非 logs）
> - view: `product_with_current_stock`，顯示商品詳細頁
> - view: `product_inventory_status`，顯示商品庫存狀態，FOR inventory 頁面
> - view: `conversation_details`，顯示對話詳細資訊，用於對話列表
> - view: `role_permissions_view`，顯示角色權限
> - view: `user_rfm_lifecycle_metrics`，顯示 RFM 指標、客戶生命周期、LTV

> - view: `order_status_distribution`
> - view: `product_sales_daily` 
> - view: `customer_purchase_summary_daily`
> - view: `order_metrics_hourly`
> - view: `order_amount_histogram_bins`
> - view: `revenue_by_campaign`
> - view: `revenue_ltv_distribution`

> - table: `dim_date`
> - table: `holidays`
> - table: `campaigns`

> **supabase Postgre Functions**：
> - update_updated_at_column: 更新 updated_at 欄位
> - allocate_stock_fifo: FIFO 分配庫存
> - get_product_current_stock: 取得商品目前庫存
> - create_order_with_items: 建立訂單並扣除庫存
> - calculate_order_total: 計算訂單總額
> - check_order_business_rules
> - validate_order_status_transition
> - generate_order_number
> - sync_order_status_with_payment
> - get_product_overview: 取得產品概覽
> - get_inventory_overview: 取得庫存概覽
> - get_customer_overview: 取得客戶概覽
> - get_user_rfm_overview: 取得 RFM 概覽

> - get_order_trend_analysis: 取得訂單趨勢分析
> - get_product_sales_analysis: 取得產品銷售分析
> - get_inventory_analysis: 取得庫存分析
> - get_customer_analysis: 取得客戶分析

> - trg_assign_this_conversation: 自動指派對話


> **supabase Postgre Trigger**：
> - set_updated_at_inventories: 更新 inventories 表的 updated_at 欄位
> - sync_order_status_with_payment: 同步訂單狀態
> - update_conversation_last_reply_timestamp: 更新對話的最後回覆時間




<!-- View: order_summary_daily -->
```sql
create or replace view order_summary_daily as
select 
    o.created_at::date as order_date,
    count(o.id) as total_orders,
    count(case when o.status = 'pending' then 1 end) as pending_orders,
    count(case when o.status = 'paid' then 1 end) as paid_orders,
    count(case when o.status = 'shipped' then 1 end) as shipped_orders,
    count(case when o.status = 'completed' then 1 end) as completed_orders,
    count(case when o.status = 'cancelled' then 1 end) as cancelled_orders,

    -- 金額統計
    coalesce(sum(o.total_amount), 0) as total_amount,

    -- 付款率 (%)
    case 
        when count(o.id) > 0 then round(count(case when o.status = 'paid' then 1 end) * 100.0 / count(o.id), 2)
        else 0
    end as paid_rate_percentage,

    -- 取消率 (%)
    case 
        when count(o.id) > 0 then round(count(case when o.status = 'cancelled' then 1 end) * 100.0 / count(o.id), 2)
        else 0
    end as cancelled_rate_percentage,

    -- 完成率 (%)
    case 
        when count(o.id) > 0 then round(count(case when o.status = 'completed' then 1 end) * 100.0 / count(o.id), 2)
        else 0
    end as completed_rate_percentage

from orders o
group by o.created_at::date;
```
<!-- SQL call view -->
```sql
SELECT *
FROM order_summary_daily
WHERE order_date = CURRENT_DATE;

---

SELECT *
FROM order_summary_daily
WHERE order_date >= CURRENT_DATE - INTERVAL '7 days'
  AND order_date <= CURRENT_DATE;

---

SELECT *
FROM order_summary_daily
WHERE order_date >= '2023-04-01' 
  AND order_date <= '2023-04-07';
```
<!-- Supabase-js call view -->
```ts
const { data, error } = await supabase
  .from('order_summary_daily')
  .select('*')
  .gte('order_date', '2023-04-01') // 這裡傳入起始日期
  .lte('order_date', '2023-04-07'); // 這裡傳入結束日期

if (error) {
  console.error(error);
} else {
  console.log(data);
}
```


<!-- View: user_with_roles -->
```sql
CREATE OR REPLACE VIEW public.user_with_roles AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.avatar_url,
  u.created_at,
  -- 取得所有角色名稱陣列
  COALESCE(
    ARRAY_AGG(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL),
    '{}'
  ) AS roles
FROM
  public.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.roles r ON r.id = ur.role_id
GROUP BY
  u.id, u.email, u.full_name, u.avatar_url, u.created_at;
```



```sql
CREATE OR REPLACE FUNCTION create_order_with_items(
  order_data jsonb,
  items jsonb[],
  created_by uuid
)
RETURNS json AS $$
DECLARE
  new_order_id uuid;
  item jsonb;
  in_created_by uuid := (order_data->>'created_by')::uuid;  -- 新增：從 order_data 解析建立者
BEGIN
  -- 驗證商品清單不為空
  IF array_length(items, 1) IS NULL OR array_length(items, 1) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;
  
  -- 開始交易
  BEGIN
    -- 建立訂單
    INSERT INTO orders (
      user_id, status, total_amount,
      shipping_fee, discount_amount, coupon_discount, tax_amount
    )
    VALUES (
      (order_data->>'user_id')::uuid,
      'pending',
      COALESCE((order_data->>'total_amount')::numeric, 0),
      COALESCE((order_data->>'shipping_fee')::numeric, 0),
      COALESCE((order_data->>'discount_amount')::numeric, 0),
      COALESCE((order_data->>'coupon_discount')::numeric, 0),
      COALESCE((order_data->>'tax_amount')::numeric, 0)
    )
    RETURNING id INTO new_order_id;
    
    -- 建立每個訂單項目並執行 FIFO 庫存扣除
    FOREACH item IN ARRAY items
    LOOP
      INSERT INTO order_items (
        order_id, product_id, quantity, unit_price, total_price
      )
      VALUES (
        new_order_id,
        (item->>'product_id')::uuid,
        (item->>'quantity')::integer,
        (item->>'price')::numeric,
        ((item->>'quantity')::integer * (item->>'price')::numeric)
      );

      -- 執行 FIFO 庫存扣除
      PERFORM allocate_stock_fifo(
        in_created_by := in_created_by,
        in_product_id := (item->>'product_id')::uuid,
        in_quantity := (item->>'quantity')::integer,
        in_ref_id := new_order_id,
        in_source := 'order',
        in_created_by := created_by
      );
    END LOOP;

    -- 成功回傳
    RETURN json_build_object('order_id', new_order_id);

  EXCEPTION
    WHEN OTHERS THEN
      -- 若發生任何錯誤，則回滾並回傳錯誤訊息
      RAISE EXCEPTION 'Failed to create order: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- 1. 觸發器函數，根據 payments.status 更新 orders.status
CREATE OR REPLACE FUNCTION sync_order_status_with_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    UPDATE orders SET status = 'pending', updated_at = NOW() WHERE id = NEW.order_id;
  ELSIF NEW.status = 'completed' THEN
    UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = NEW.order_id;
  ELSIF NEW.status = 'failed' THEN
    -- 付款失敗，訂單仍維持 pending
    UPDATE orders SET status = 'pending', updated_at = NOW() WHERE id = NEW.order_id;
  ELSIF NEW.status = 'refunded' THEN
    UPDATE orders SET status = 'refunded', updated_at = NOW() WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 觸發器，新增付款時執行同步
CREATE TRIGGER trg_sync_order_status_after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION sync_order_status_with_payment();

-- 3. 觸發器，更新付款狀態時同步訂單狀態
CREATE TRIGGER trg_sync_order_status_after_payment_update
AFTER UPDATE OF status ON payments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_order_status_with_payment();
```


```sql
create or replace view public.product_inventory_status as
with inventory_stock as (
  select
    product_id,
    sum(current_stock) as total_available_stock
  from
    inventory_with_stock_detail
  group by
    product_id
),
reserved_stock as (
  select
    oi.product_id,
    sum(oi.quantity) as reserved_quantity
  from
    order_items oi
    join orders o on oi.order_id = o.id
  where
    o.status in ('pending', 'paid')
  group by
    oi.product_id
)
select
  p.id as product_id,
  p.name,
  p.sku,
  p.stock_threshold,
  coalesce(i.total_available_stock, 0) + coalesce(r.reserved_quantity, 0) as total_stock,
  coalesce(r.reserved_quantity, 0) as reserved_quantity,
  coalesce(i.total_available_stock, 0) as free_stock,
  coalesce(i.total_available_stock, 0) - coalesce(p.stock_threshold, 0) as stock_buffer,
  case
    when coalesce(i.total_available_stock, 0) = 0 then 'out_of_stock'
    when coalesce(i.total_available_stock, 0) <= coalesce(p.stock_threshold, 0) then 'low_stock'
    else 'in_stock'
  end as stock_status,
  case
    when coalesce(i.total_available_stock, 0) = 0 then 0  -- out_of_stock
    when coalesce(i.total_available_stock, 0) < coalesce(p.stock_threshold, 0) then 1  -- low_stock
    else 2  -- in_stock
  end as stock_status_order
from
  products p
  left join inventory_stock i on p.id = i.product_id
  left join reserved_stock r on p.id = r.product_id;
```

```sql
CREATE OR REPLACE VIEW conversation_details AS
SELECT 
    c.id AS conversation_id,
    c.user_id,
    c.status,
    c.title,
    c.priority,
    c.tags,
    c.created_at AS conversation_created_at,
    c.updated_at AS conversation_updated_at,
    c.last_reply_at,
    c.assigned_to,
    
    -- 用戶信息
    -- u.id AS user_id,
    u.email AS user_email,
    u.full_name AS user_full_name,
    u.avatar_url AS user_avatar_url,
    
    -- 最新消息
    (
        SELECT m.message
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS latest_message,
    
    -- 最新消息時間
    (
        SELECT m.created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS latest_message_time,
    
    -- 未讀消息數量
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
        AND m.is_admin = false
        AND m.read_at IS NULL
    ) AS unread_count,
    
    -- 消息總數
    (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.conversation_id = c.id
    ) AS message_count
    
FROM conversations c
LEFT JOIN users u ON c.user_id = u.id;
```

```sql
-- 創建一個函數來更新對話的最後回覆時間
CREATE OR REPLACE FUNCTION update_conversation_last_reply()
RETURNS TRIGGER AS $$
BEGIN
   UPDATE conversations
   SET last_reply_at = now()
   WHERE id = NEW.conversation_id;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 messages 表添加觸發器，當新增消息時更新對話的最後回覆時間
CREATE TRIGGER update_conversation_last_reply_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_reply();
```




```sql
create function is_me(input_user_id uuid)
returns boolean
language sql
as $$
  select exists (
    select 1
    from public.users
    where id = input_user_id
      and auth_user_id = auth.uid()
  );
$$;
```


```sql
create function mark_messages_as_read(
  p_conversation_id uuid,
  p_is_admin boolean
) returns void as $$
begin
  update messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and is_admin = p_is_admin
    and read_at is null;
end;
$$ language plpgsql security definer;

```


建立角色權限相關資料表
```sql
-- 1. 權限組（功能模塊）表
CREATE TABLE IF NOT EXISTS permission_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 權限表
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  group_id INT REFERENCES permission_groups(id),
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 角色權限關聯表
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- 4. 索引以提高查詢性能
CREATE INDEX IF NOT EXISTS idx_permissions_group_id ON permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 5. 視圖以方便查詢角色權限
CREATE OR REPLACE VIEW role_permissions_view AS
SELECT 
  r.id AS role_id,
  r.name AS role_name,
  p.id AS permission_id,
  p.code AS permission_code,
  p.name AS permission_name,
  pg.id AS group_id,
  pg.name AS group_name
FROM 
  roles r
JOIN 
  role_permissions rp ON r.id = rp.role_id
JOIN 
  permissions p ON rp.permission_id = p.id
JOIN 
  permission_groups pg ON p.group_id = pg.id;

```

權限定義資料
```sql
-- 建立權限組與權限（可根據實際需求調整）
INSERT INTO permission_groups (name, description, sort_order) VALUES
('user management', '用戶帳號、角色相關權限', 10),
('product management', '產品目錄、庫存相關權限', 20),
('order management', '訂單處理、發貨相關權限', 30),
('customer management', '客戶資料、支援相關權限', 40),
('setting management', '系統配置、參數相關權限', 50);

-- 插入基本權限
INSERT INTO permissions (group_id, code, name, description, sort_order) VALUES
-- 用戶管理權限
(1, 'user.view', '查看用戶', '允許查看用戶列表和詳情', 10),
(1, 'user.create', '建立用戶', '允許新增新用戶', 20),
(1, 'user.edit', '編輯用戶', '允許修改用戶信息', 30),
(1, 'user.delete', '刪除用戶', '允許刪除用戶', 40),
(1, 'role.view', '查看角色', '允許查看角色列表和詳情', 50),
(1, 'role.create', '建立角色', '允許新增新角色', 60),
(1, 'role.edit', '編輯角色', '允許修改角色信息', 70),
(1, 'role.delete', '刪除角色', '允許刪除角色', 80),
(1, 'role.assign', '分配角色', '允許為用戶分配角色', 90),

-- 產品管理權限
(2, 'product.view', '查看產品', '允許查看產品列表和詳情', 10),
(2, 'product.create', '建立產品', '允許新增新產品', 20),
(2, 'product.edit', '編輯產品', '允許修改產品信息', 30),
(2, 'product.delete', '刪除產品', '允許刪除產品', 40),
(2, 'inventory.view', '查看庫存', '允許查看庫存信息', 50),
(2, 'inventory.update', '更新庫存', '允許更新庫存數量', 60),

-- 訂單管理權限
(3, 'order.view', '查看訂單', '允許查看訂單列表和詳情', 10),
(3, 'order.create', '建立訂單', '允許新增新訂單', 20),
(3, 'order.edit', '編輯訂單', '允許修改訂單信息', 30),
(3, 'order.cancel', '取消訂單', '允許取消訂單', 40),
(3, 'order.process', '處理訂單', '允許處理訂單狀態', 50),

-- 客戶管理權限
(4, 'customer.view', '查看客戶', '允許查看客戶列表和詳情', 10),
(4, 'customer.create', '建立客戶', '允許新增新客戶', 20),
(4, 'customer.edit', '編輯客戶', '允許修改客戶信息', 30),
(4, 'customer.delete', '刪除客戶', '允許刪除客戶', 40),
(4, 'support.view', '查看支援', '允許查看客戶支援請求訊息', 50),
(4, 'support.respond', '回應支援', '允許回應客戶支援請求訊息', 60),

-- 系統設置權限
(5, 'settings.view', '查看設置', '允許查看系統設置', 10),
(5, 'settings.edit', '編輯設置', '允許修改系統設置', 20);


-- 為超級管理員角色分配所有權限(假設超級管理員角色ID為1)
-- 您需要調整角色ID以匹配實際情況
DO $$
DECLARE
    admin_role_id INT := 1; -- 假設超級管理員角色ID為1，請根據實際情況調整
    permission_id INT;
BEGIN
    -- 檢查角色是否存在
    IF EXISTS (SELECT 1 FROM roles WHERE id = admin_role_id) THEN
        -- 為超級管理員分配所有權限
        FOR permission_id IN SELECT id FROM permissions LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (admin_role_id, permission_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;

```


更新 - 建立新訂單 supabase funciton，新增商品快照同步欄位
（以下為全部建議方法，實際資料庫未加入 variant、discount 快照）
```sql
create or replace function public.create_order_with_items(
  order_data jsonb,
  items jsonb[],
  created_by uuid
)
returns jsonb as $$
declare
  new_order_id uuid;
  item jsonb;
  _product_name text;
  _product_description text;
  _product_image_url text;
  _product_sku text;
begin
  -- 驗證商品清單不為空
  if array_length(items, 1) is null or array_length(items, 1) = 0 then
    raise exception 'Order must contain at least one item';
  end if;

  -- 建立訂單
  insert into orders (
    user_id,
    status,
    total_amount,
    shipping_fee,
    discount_amount,
    coupon_discount,
    tax_amount
  )
  values (
    (order_data->>'user_id')::uuid,
    'pending',
    coalesce((order_data->>'total_amount')::numeric, 0),
    coalesce((order_data->>'shipping_fee')::numeric, 0),
    coalesce((order_data->>'discount_amount')::numeric, 0),
    coalesce((order_data->>'coupon_discount')::numeric, 0),
    coalesce((order_data->>'tax_amount')::numeric, 0)
  )
  returning id into new_order_id;

  -- 插入訂單項目
  foreach item in array items loop
    -- 撈取商品快照資料
    select
      name,
      description,
      image_url,
      sku
    into
      _product_name,
      _product_description,
      _product_image_url,
      _product_sku
    from products
    where id = (item->>'product_id')::uuid;

    insert into order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      product_name,
      product_description,
      product_image_url,
      product_sku,
      variant_name,
      variant_attributes,
      discount_amount,
      discount_reason,
      created_at
    )
    values (
      new_order_id,
      (item->>'product_id')::uuid,
      (item->>'quantity')::integer,
      (item->>'price')::numeric,
      ((item->>'quantity')::integer * (item->>'price')::numeric),
      _product_name,
      _product_description,
      _product_image_url,
      _product_sku,
      (item->>'variant_name')::text,
      (item->>'variant_attributes')::jsonb,
      coalesce((item->>'discount_amount')::numeric, 0),
      (item->>'discount_reason')::text,
      now()
    );

    -- FIFO 扣庫存
    perform allocate_stock_fifo(
      in_created_by := created_by,
      in_product_id := (item->>'product_id')::uuid,
      in_quantity := (item->>'quantity')::integer,
      in_ref_id := new_order_id,
      in_source := 'order'
    );
  end loop;

  -- 回傳結果
  return jsonb_build_object('order_id', new_order_id);
end;
$$ language plpgsql security definer;

```


```sql
-- 產品概覽函數 - 僅提供基本產品數據統計
CREATE OR REPLACE FUNCTION public.get_product_overview()
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
BEGIN
    -- 基本產品摘要
    WITH product_summary AS (
        SELECT
            -- 總計數
            count(distinct p.id) filter (where p.deleted_at is null) as total_products,
            count(distinct p.category_id) filter (where p.deleted_at is null) as total_categories,
            
            -- 依狀態分類的產品數量
            count(case when p.status = 'active' and p.deleted_at is null then 1 else null end) as active_products,
            count(case when p.status = 'draft' and p.deleted_at is null then 1 else null end) as draft_products,
            count(case when p.status = 'inactive' and p.deleted_at is null then 1 else null end) as inactive_products,
            count(case when p.status = 'archived' and p.deleted_at is null then 1 else null end) as archived_products,
            
            -- 庫存水位低的產品
            count(case when p.needs_restock and p.deleted_at is null then 1 else null end) as low_stock_products,
            
            -- 平均價格
            round(avg(p.price) filter (where p.deleted_at is null), 2) as average_price
        from
            product_with_current_stock p
    )
    
    -- 直接返回摘要數據，不包含分類和銷售詳情
    SELECT row_to_json(s)
    FROM product_summary s
    INTO result;

    RETURN result;
END;
$function$;
```


```sql
// 在 src/composables/useProduct.ts 中
export async function getProductOverview(): Promise<ApiResponse> {
  try {
    const { data, error: apiError } = await supabase.functions.invoke(
      'product-overview',
      { method: 'GET' }
    )

    if (apiError) {
      return { success: false, error: apiError.message }
    }

    return { success: true, data: data.data ? data.data : data }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  }
}
```



```sql
CREATE OR REPLACE VIEW public.user_rfm_lifecycle_metrics AS
WITH user_purchase_data AS (
    SELECT
        o.user_id AS user_id,
        MIN(o.created_at) AS first_purchase_date,
        MAX(o.created_at) AS last_purchase_date,
        COUNT(DISTINCT o.id) AS frequency,
        SUM(o.total_amount) AS monetary,
        COUNT(DISTINCT CASE WHEN o.created_at >= (CURRENT_DATE - INTERVAL '12 months') THEN o.id END) AS purchase_count_last_12m,
        SUM(CASE WHEN o.created_at >= (CURRENT_DATE - INTERVAL '12 months') THEN o.total_amount ELSE 0 END) AS ltv_last_12m
    FROM
        orders o
    WHERE
        o.status = 'paid' -- 只計算已付款訂單
    GROUP BY
        o.user_id
),
recency_calc AS (
    SELECT
        user_id,
        first_purchase_date,
        last_purchase_date,
        frequency,
        monetary,
        purchase_count_last_12m,
        ltv_last_12m,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_purchase_date)) AS recency_days,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - first_purchase_date)) AS days_since_first_purchase,
        EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_purchase_date)) AS days_since_last_purchase
    FROM
        user_purchase_data
),
rfm_scores AS (
    SELECT
        rc.*,
        -- Recency score: 1 (老), 2, 3, 4, 5 (最新)
        CASE
            WHEN recency_days <= 7 THEN 5
            WHEN recency_days <= 14 THEN 4
            WHEN recency_days <= 30 THEN 3
            WHEN recency_days <= 60 THEN 2
            ELSE 1
        END AS r_score,
        
        -- Frequency score: 1 (低) 到 5 (高)
        CASE
            WHEN frequency >= 10 THEN 5
            WHEN frequency >= 5 THEN 4
            WHEN frequency >= 3 THEN 3
            WHEN frequency >= 2 THEN 2
            ELSE 1
        END AS f_score,
        
        -- Monetary score: 1 (低) 到 5 (高)
        CASE
            WHEN monetary >= 5000 THEN 5
            WHEN monetary >= 3000 THEN 4
            WHEN monetary >= 1000 THEN 3
            WHEN monetary >= 500 THEN 2
            ELSE 1
        END AS m_score
    FROM
        recency_calc rc
),
rfm_segment AS (
    SELECT
        *,
        (r_score::text || f_score::text || m_score::text) AS rfm_segment,
        
        -- Lifecycle Stage 定義（範例邏輯，可調整）
        CASE
            WHEN recency_days <= 30 AND frequency >= 2 THEN 'Active'
            WHEN recency_days BETWEEN 31 AND 90 AND frequency >= 2 THEN 'At Risk'
            WHEN recency_days > 90 AND frequency >= 2 THEN 'Churned'
            WHEN frequency = 1 AND recency_days <= 90 THEN 'New'
            WHEN frequency = 1 AND recency_days > 90 THEN 'One-time Past'
            ELSE 'Other'
        END AS lifecycle_stage
    FROM
        rfm_scores
)
SELECT
    rfm.user_id,
    u.full_name,
    u.email,
    rfm.recency_days,
    rfm.frequency,
    rfm.monetary,
    rfm.r_score,
    rfm.f_score,
    rfm.m_score,
    rfm.rfm_segment,
    rfm.first_purchase_date,
    rfm.last_purchase_date,
    rfm.days_since_first_purchase,
    rfm.days_since_last_purchase,
    rfm.purchase_count_last_12m,
    rfm.ltv_last_12m,
    rfm.monetary AS ltv_total,
    rfm.lifecycle_stage
FROM
    rfm_segment rfm
JOIN
    users u ON rfm.user_id = u.id;

```


```sql
CREATE OR REPLACE FUNCTION public.get_user_rfm_overview(role text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
    result jsonb;
    active_users_count integer;
    vip_users_count integer;
    avg_ltv numeric;
    at_risk_users_count integer;
    user_ids uuid[];
BEGIN
    -- 如果指定了角色，先獲取符合該角色的用戶ID
    IF role IS NOT NULL THEN
        SELECT array_agg(u.id)
        INTO user_ids
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = role;
    END IF;
    
    -- 活躍用戶數 (lifecycle_stage = 'Active')
    SELECT COUNT(*)
    INTO active_users_count
    FROM public.user_rfm_lifecycle_metrics rfm
    WHERE lifecycle_stage = 'Active'
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- VIP客戶數 (使用 segment_name = 'VIP' 識別，只要符合就計算)
    SELECT COUNT(DISTINCT rfm.user_id)
    INTO vip_users_count
    FROM public.user_rfm_lifecycle_metrics rfm
    JOIN public.rfm_segment_mapping map ON 
        rfm.rfm_segment SIMILAR TO REPLACE(REPLACE(map.rfm_pattern, 'X', '_'), '_', '[1-5]')
    WHERE map.segment_name = 'VIP'
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- 平均LTV
    SELECT COALESCE(ROUND(AVG(ltv_total), 2), 0)
    INTO avg_ltv
    FROM public.user_rfm_lifecycle_metrics rfm
    WHERE ltv_total > 0
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- At Risk 客戶數 (lifecycle_stage = 'At Risk')
    SELECT COUNT(*)
    INTO at_risk_users_count
    FROM public.user_rfm_lifecycle_metrics rfm
    WHERE lifecycle_stage = 'At Risk'
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- 組裝結果
    SELECT jsonb_build_object(
        'active_users_count', active_users_count,
        'vip_users_count', vip_users_count,
        'average_ltv', avg_ltv,
        'at_risk_users_count', at_risk_users_count
    ) INTO result;

    RETURN result;
END;
$function$;
```