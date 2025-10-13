# 庫存創建者系統重新設計 - 部署指南

## 修復總結

### 核心問題解決
✅ **外鍵約束錯誤**: `inventory_logs_created_by_fkey` 違反問題已解決  
✅ **創建者類型支援**: 支援管理員和客戶兩種創建者類型  
✅ **未來擴展性**: 為客戶自助下單功能做好準備  
✅ **資料完整性**: 外鍵約束確保創建者 ID 有效性  

### 重新設計架構
- **新欄位**: `created_by_user` (uuid → users.id), `created_by_customer` (uuid → customers.id)
- **約束機制**: 確保只有一個創建者類型（或兩者皆為 NULL）
- **輔助視圖**: `inventory_logs_with_creator` 統一創建者資訊
- **函數更新**: 所有相關函數支援新的創建者參數格式

## 部署檔案清單

### 資料庫遷移檔案
1. **`20250730200000_redesign_inventory_logs_creators.sql`**
   - 修改 `inventory_logs` 表結構
   - 建立輔助視圖和函數
   - 更新觸發器和索引

2. **`20250730210000_fix_create_order_with_new_creator_params.sql`**
   - 修正 `create_order_with_items` 函數
   - 使用新的創建者參數格式

### Edge Functions 更新
1. **`/supabase/functions/stock-in/index.ts`**
   - 新增用戶身份解析邏輯
   - 支援管理員/客戶創建者類型

2. **`/supabase/functions/stock-adjust/index.ts`**
   - 新增用戶身份解析邏輯
   - 使用新的 RPC 參數格式

3. **`/supabase/functions/order-create/index.ts`**
   - 修正 `created_by` 參數使用管理員 ID

## 部署步驟

### Step 1: 資料庫遷移
```bash
# 執行主要遷移（重新設計創建者系統）
psql -h [你的主機] -p [端口] -U [用戶名] -d [資料庫名] -f /Users/yangyachiao/Documents/2025/ecommerce-dashboard/supabase/migrations/20250730200000_redesign_inventory_logs_creators.sql

# 執行訂單函數修正
psql -h [你的主機] -p [端口] -U [用戶名] -d [資料庫名] -f /Users/yangyachiao/Documents/2025/ecommerce-dashboard/supabase/migrations/20250730210000_fix_create_order_with_new_creator_params.sql
```

### Step 2: 部署 Edge Functions
```bash
# 重新部署所有更新的 Edge Functions
supabase functions deploy stock-in
supabase functions deploy stock-adjust
supabase functions deploy order-create
```

### Step 3: 驗證部署
```sql
-- 1. 檢查表結構
\d inventory_logs;

-- 2. 檢查約束
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'inventory_logs';

-- 3. 檢查視圖
SELECT * FROM inventory_logs_with_creator LIMIT 5;

-- 4. 檢查函數
SELECT proname FROM pg_proc WHERE proname IN (
  'log_inventory_operation',
  'allocate_stock_fifo', 
  'adjust_inventory_stock',
  'create_order_with_items'
);
```

## 🧪 功能測試

### Test Case 1: 管理員入庫操作
```bash
# 使用 stock-in Edge Function
curl -X POST "http://localhost:54321/functions/v1/stock-in" \
  -H "Authorization: Bearer [ADMIN_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-id-here",
    "quantity": 10,
    "note": "管理員手動入庫測試"
  }'
```

**預期結果**：
- ✅ `inventories` 表新增記錄
- ✅ `inventory_logs` 表新增 'in' 記錄
- ✅ `created_by_user` 欄位填入管理員 ID
- ✅ `created_by_customer` 欄位為 NULL

### Test Case 2: 管理員建立訂單
```bash
# 使用 order-create Edge Function
curl -X POST "http://localhost:54321/functions/v1/order-create" \
  -H "Authorization: Bearer [ADMIN_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "order_data": {"userId": "customer-id-here"},
    "items": [{"productId": "product-id-here", "quantity": 2, "unitPrice": 100}]
  }'
```

**預期結果**：
- ✅ `orders` 表新增記錄，`user_id` 為客戶 ID
- ✅ `inventory_logs` 表新增 'out' 記錄
- ✅ `created_by_user` 欄位填入管理員 ID
- ✅ `created_by_customer` 欄位為 NULL

### Test Case 3: 庫存調整
```bash
# 使用 stock-adjust Edge Function
curl -X POST "http://localhost:54321/functions/v1/stock-adjust" \
  -H "Authorization: Bearer [ADMIN_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "inventory_id": "inventory-id-here",
    "adjust_quantity": 5,
    "reason": "盤點調整"
  }'
```

## 🔍 驗證查詢

### 查看創建者資訊
```sql
-- 統一查看所有庫存操作記錄
SELECT 
  id, type, quantity, source, note,
  creator_type, creator_name, creator_email,
  created_at
FROM inventory_logs_with_creator 
ORDER BY created_at DESC 
LIMIT 10;
```

### 查看管理員操作記錄
```sql
-- 查看特定管理員的操作記錄
SELECT * FROM inventory_logs_with_creator 
WHERE creator_type = 'user' 
  AND created_by_user = 'admin-user-id-here'
ORDER BY created_at DESC;
```

### 檢查資料完整性
```sql
-- 檢查是否有違反約束的記錄
SELECT COUNT(*) FROM inventory_logs 
WHERE (created_by_user IS NOT NULL AND created_by_customer IS NOT NULL);
-- 應該回傳 0

-- 檢查外鍵完整性
SELECT COUNT(*) FROM inventory_logs il
LEFT JOIN users u ON il.created_by_user = u.id
LEFT JOIN customers c ON il.created_by_customer = c.id
WHERE (il.created_by_user IS NOT NULL AND u.id IS NULL)
   OR (il.created_by_customer IS NOT NULL AND c.id IS NULL);
-- 應該回傳 0
```

## 業務流程確認

### 當前支援情境
- ✅ **後台管理員手動入庫**: `created_by_user` 記錄管理員
- ✅ **後台管理員建立訂單**: `created_by_user` 記錄管理員
- ✅ **後台管理員調整庫存**: `created_by_user` 記錄管理員

### 未來支援情境（已準備就緒）
- 🔄 **客戶自助下單**: `created_by_customer` 記錄客戶
- 🔄 **客戶申請退貨**: `created_by_customer` 記錄客戶

### 系統自動操作
- ✅ **定時任務**: 兩個創建者欄位皆為 NULL

## 🚨 問題排查

### 常見問題

1. **Edge Function 401 錯誤**
   - 檢查用戶是否存在於 `users` 或 `customers` 表中
   - 檢查 `auth_user_id` 欄位是否正確設定

2. **外鍵約束錯誤**
   - 確保遷移已正確執行
   - 檢查創建者 ID 是否有效

3. **RPC 函數錯誤**
   - 檢查函數參數名稱是否正確
   - 確認函數簽名已更新

### 除錯指令
```sql
-- 檢查用戶身份映射
SELECT 'users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'customers' as table_name, count(*) as count FROM customers;

-- 檢查近期的庫存操作
SELECT * FROM inventory_logs_with_creator 
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 效能影響

- **索引優化**: 已為新的創建者欄位建立適當索引
- **查詢效能**: 輔助視圖提供統一的創建者資訊查詢
- **儲存成本**: 增加兩個 UUID 欄位，影響微小

---

**部署版本**: v2.0  
**部署日期**: 2025-07-30  
**相容性**: 完全向前相容，支援未來擴展  
**風險等級**: 低（外鍵約束保證資料完整性）