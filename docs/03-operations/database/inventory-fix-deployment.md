# 庫存模組修復 - 部署指南

## 修復總結

### 核心問題
- **問題**: `addInventory()` 只新增 `inventories` 記錄，缺少對應的 `inventory_logs` 'in' 記錄
- **影響**: `current_stock` 計算錯誤，庫存追蹤不完整
- **嚴重程度**: 🚨 **高風險** - 影響庫存業務核心功能

### 修復範圍
✅ **資料庫層面**: 觸發器、函數、約束擴展  
✅ **Edge Functions**: 新增 `stock-in` 和 `stock-adjust`  
✅ **前端修復**: 修正 `addInventory()` 和新增 `adjustInventory()`  
✅ **資料修復**: 歷史資料完整性修復工具  
✅ **FIFO 修復**: 修正庫存扣除的排序邏輯 (`ORDER BY received_at ASC NULLS LAST`)  
✅ **資料品質修復**: 修復 `received_at` 欄位 NULL 值問題，設定 NOT NULL 約束  

## 部署步驟

### Step 1: 資料庫遷移
```bash
# 切換到 supabase 目錄
cd supabase/

# 執行資料庫遷移（包含 FIFO 修復）
supabase db push

# 檢查遷移狀態
supabase migration list

# 特別確認 FIFO 和資料品質修復遷移
# 應該看到 20250730231000_cleanup_and_fix_fifo.sql
# 應該看到 20250730232000_fix_received_at_data_quality.sql
```

### Step 2: 部署 Edge Functions
```bash
# 部署 stock-in function
supabase functions deploy stock-in

# 部署 stock-adjust function  
supabase functions deploy stock-adjust

# 檢查函數狀態
supabase functions list
```

### Step 3: 前端代碼部署
```bash
# 切換到前端目錄
cd admin-platform-vue/

# 安裝依賴（如需要）
npm install

# 建置前端
npm run build

# 部署前端（根據你的部署方式）
```

## ✅ 部署後驗證

### 1. 資料庫驗證
```sql
-- 檢查 FIFO 修復是否生效
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'allocate_stock_fifo' 
  AND routine_definition LIKE '%NULLS LAST%';
-- 預期結果：應該找到包含 'NULLS LAST' 的函數定義
```

### 2. 原有資料庫驗證
```sql
-- 檢查觸發器是否正確建立
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_log_inventory_creation';

-- 檢查函數是否存在
SELECT proname FROM pg_proc WHERE proname IN (
  'log_inventory_creation',
  'adjust_inventory_stock', 
  'check_inventory_integrity',
  'repair_missing_inventory_logs'
);

-- 檢查約束是否更新
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'inventory_logs_type_check';
```

### 2. Edge Functions 驗證
```bash
# 測試 stock-in function
curl -X POST "https://your-project.supabase.co/functions/v1/stock-in" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":"test-product-id","quantity":5,"note":"測試入庫"}'

# 測試 stock-adjust function
curl -X POST "https://your-project.supabase.co/functions/v1/stock-adjust" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inventory_id":"test-inventory-id","adjust_quantity":2,"reason":"測試調整"}'
```

### 3. 前端功能驗證
- [ ] 產品管理頁面的入庫功能正常
- [ ] 庫存列表顯示正確的 `current_stock`
- [ ] 新的庫存調整功能可用
- [ ] 沒有 JavaScript 錯誤

## 資料修復

### 檢查資料完整性
```sql
-- 1. 檢查是否有問題資料
SELECT * FROM check_inventory_integrity();
```

### 執行資料修復（如有需要）
```sql
-- 2. 修復缺失的 inventory_logs 記錄
SELECT repair_missing_inventory_logs();

-- 3. 再次檢查修復結果
SELECT * FROM check_inventory_integrity();
```

## 🧪 功能測試指南

### Test Case 1: 新增庫存
```typescript
// 前端測試
const result = await addInventory('product-id', {
  quantity: 10,
  note: '測試入庫'
});

// 預期結果：
// - inventories 表有新記錄
// - inventory_logs 表有對應的 'in' 記錄  
// - current_stock 正確計算
```

### Test Case 2: 庫存調整
```typescript
// 增加庫存
const addResult = await adjustInventory(
  'inventory-id', 
  5, 
  '盤點調整'
);

// 減少庫存  
const reduceResult = await adjustInventory(
  'inventory-id',
  -3,
  '報廢處理'
);
```

### Test Case 3: 觸發器測試
```sql
-- 直接在資料庫新增 inventory
INSERT INTO inventories (product_id, quantity) 
VALUES ('test-product', 100);

-- 檢查是否自動建立 inventory_logs
SELECT COUNT(*) FROM inventory_logs 
WHERE inventory_id = (
  SELECT id FROM inventories ORDER BY created_at DESC LIMIT 1
) AND type = 'in';
-- 預期結果：1
```

### Test Case 4: FIFO 順序驗證
```sql
-- 使用提供的 FIFO_VERIFICATION_TEST.sql 腳本
-- 1. 先執行腳本找到測試產品
-- 2. 檢查庫存記錄是否按 received_at 排序
-- 3. 建立測試訂單並驗證庫存扣除順序
-- 4. 確認最老的庫存先被扣除

-- 快速檢查：看最近訂單是否遵循 FIFO
SELECT 
  il.inventory_id,
  i.received_at,
  il.quantity as allocated_qty,
  il.created_at as allocation_time
FROM inventory_logs il
JOIN inventories i ON il.inventory_id = i.id
WHERE il.type = 'out' 
  AND il.source = 'order'
  AND il.created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY il.ref_id, il.created_at;
-- 預期：同一訂單的分配應按 received_at 從早到晚
```

## 🚨 回滾計劃

如果出現問題需要回滾：

### 1. 資料庫回滾
```sql
-- 移除觸發器
DROP TRIGGER IF EXISTS trigger_log_inventory_creation ON inventories;

-- 移除函數
DROP FUNCTION IF EXISTS log_inventory_creation();
DROP FUNCTION IF EXISTS adjust_inventory_stock();

-- 回復原始約束
ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_type_check;
ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_type_check 
CHECK (type = ANY (ARRAY['in'::text, 'out'::text]));
```

### 2. 前端回滾
恢復原始的 `addInventory()` 函數（直接操作資料庫）

### 3. Edge Functions 下線
```bash
supabase functions delete stock-in
supabase functions delete stock-adjust
```

## 監控指標

部署後請監控：
- [ ] 庫存操作成功率 
- [ ] `inventory_logs` 記錄完整性
- [ ] Edge Functions 效能
- [ ] 前端庫存功能使用情況
- [ ] 錯誤日誌和異常

## 📞 支援與問題處理

如遇到問題，請按優先順序處理：

1. **P0 - 庫存計算錯誤**
   - 立即執行 `check_inventory_integrity()`
   - 必要時執行 `repair_missing_inventory_logs()`

2. **P1 - Edge Function 錯誤**
   - 檢查 Supabase Dashboard 的 Functions 日誌
   - 確認權限設定

3. **P2 - 前端功能異常**
   - 檢查瀏覽器 Console 錯誤
   - 確認 API 呼叫狀態

---

**修復版本**: v1.0  
**部署日期**: 2025-07-30  
**預估部署時間**: 30 分鐘  
**風險等級**: 低（向後相容）