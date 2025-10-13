# JSONB 系統完整測試指南

## 測試目標
全面驗證 JSONB 快照系統的功能，包括 Order Items 和 Orders 表的快照功能，確保系統穩定性和資料完整性。

## 測試範圍

### Order Items 表測試
- ✅ JSONB 欄位結構和索引
- ✅ 產品快照生成函數
- ✅ 複雜促銷場景支援
- ✅ 向後相容性確保
- ✅ 效能監控

### Orders 表測試
- ✅ 客戶快照生成
- ✅ 業務規則快照
- ✅ 支付快照系統
- ✅ 自動觸發器系統
- ✅ 資料一致性驗證

## 測試環境
**Studio URL**: http://127.0.0.1:54323

---

## 完整測試清單

### 1. 表結構驗證

#### 1.1 Order Items 表結構
**路徑**: Studio → Table Editor → order_items

```sql
-- 檢查 order_items 表結構
\d order_items
```

**預期結果**：
- `product_snapshot` (jsonb)
- `promotion_data` (jsonb, default '{}')
- 現有舊欄位仍然存在（向後相容性）

#### 1.2 Orders 表結構
**路徑**: Studio → Table Editor → orders

```sql
-- 檢查 orders 表結構
\d orders
```

**預期結果**：
- `customer_snapshot` (jsonb)
- `business_rules_snapshot` (jsonb, default '{}')
- `payment_snapshot` (jsonb, default '{}')

### 2. JSONB 資料展示測試

#### 2.1 Order Items JSONB 資料
```sql
-- 查看完整的 JSONB 結構
SELECT 
  id,
  product_snapshot,
  promotion_data 
FROM order_items 
WHERE id = 1;
```

**預期結果**：
- `product_snapshot` 包含 basic_info, variant_info, pricing, metadata
- `promotion_data` 為空 `{}` 或包含完整促銷結構

#### 2.2 Orders JSONB 資料
```sql
-- 查看 Orders 快照資料
SELECT 
  id,
  customer_snapshot,
  business_rules_snapshot,
  payment_snapshot
FROM orders 
WHERE id = (SELECT id FROM orders LIMIT 1);
```

**預期結果**：
- `customer_snapshot` 包含客戶完整資訊
- `business_rules_snapshot` 包含業務規則
- `payment_snapshot` 包含支付政策

### 3. 複雜促銷場景驗證

#### 3.1 買五送一促銷
```sql
-- 查看買五送一促銷項目
SELECT 
  id,
  quantity,
  unit_price,
  total_price,
  discount_amount,
  promotion_data->>'type' as promotion_type,
  promotion_data->'rules'->>'buy_quantity' as buy_qty,
  promotion_data->'rules'->>'get_quantity' as get_qty,
  promotion_data->'applied_discount'->>'reason' as discount_reason
FROM order_items 
WHERE promotion_data->>'type' = 'buy_x_get_y';
```

**預期結果**：
- 促銷類型顯示為 'buy_x_get_y'
- 購買數量和贈送數量正確
- 折扣金額和原因明確

#### 3.2 單件促銷
```sql
-- 查看單件促銷項目
SELECT 
  id,
  promotion_data->>'type' as promotion_type,
  promotion_data->'applied_discount'->>'amount' as discount_amount,
  promotion_data->'applied_discount'->>'reason' as discount_reason
FROM order_items 
WHERE promotion_data->>'type' IN ('percentage', 'fixed_amount');
```

#### 3.3 組合包促銷
```sql
-- 查看組合包促銷
SELECT 
  id,
  promotion_data->>'type' as promotion_type,
  promotion_data->'bundle_info' as bundle_details
FROM order_items 
WHERE promotion_data->>'type' = 'bundle';
```

### 4. 快照生成函數測試

#### 4.1 產品快照生成
```sql
-- 測試產品快照生成
SELECT create_product_snapshot(
  (SELECT id FROM products LIMIT 1),
  '測試變體',
  '{"size": "L", "color": "紅色"}',
  100.00
);
```

#### 4.2 客戶快照生成
```sql
-- 測試客戶快照生成
SELECT create_customer_snapshot(
  (SELECT id FROM customers LIMIT 1)
);
```

#### 4.3 業務規則快照
```sql
-- 測試業務規則快照
SELECT create_business_rules_snapshot();
```

#### 4.4 支付快照生成
```sql
-- 測試支付快照
SELECT create_payment_snapshot();
```

### 5. 自動觸發器測試

#### 5.1 插入新訂單項目
```sql
-- 測試自動快照生成
INSERT INTO order_items (
  order_id, product_id, quantity, unit_price, total_price,
  discount_amount, discount_reason, status
) VALUES (
  (SELECT id FROM orders LIMIT 1),
  (SELECT id FROM products LIMIT 1),
  2, 50.00, 90.00,
  10.00, '觸發器測試', 'active'
);

-- 檢查是否自動生成快照
SELECT 
  id,
  product_snapshot IS NOT NULL as has_product_snapshot,
  promotion_data != '{}' as has_promotion_data
FROM order_items 
WHERE discount_reason = '觸發器測試';
```

#### 5.2 插入新訂單
```sql
-- 測試 Orders 自動快照生成
INSERT INTO orders (
  customer_id, contact_name, contact_email, 
  subtotal, total_amount, status
) VALUES (
  (SELECT id FROM customers LIMIT 1),
  '測試客戶', 'test@example.com',
  100.00, 100.00, 'pending'
);

-- 檢查是否自動生成快照
SELECT 
  id,
  customer_snapshot IS NOT NULL as has_customer_snapshot,
  business_rules_snapshot != '{}' as has_business_rules,
  payment_snapshot != '{}' as has_payment_snapshot
FROM orders 
WHERE contact_email = 'test@example.com';
```

### 6. 資料一致性驗證

#### 6.1 Order Items 完整性檢查
```sql
-- 執行完整性檢查
SELECT * FROM check_order_items_jsonb_integrity();
```

**預期結果**：
- 所有檢查項目狀態為 'PASS' 或 'INFO'
- 無 'FAIL' 或 'ERROR' 狀態

#### 6.2 Orders 完整性檢查
```sql
-- 執行 Orders 完整性檢查
SELECT * FROM check_orders_snapshot_integrity();
```

#### 6.3 資料同步測試
```sql
-- 測試 JSONB 與傳統欄位同步
UPDATE order_items 
SET product_snapshot = jsonb_set(
  product_snapshot, 
  '{basic_info,name}', 
  '"同步測試產品"'
)
WHERE id = 1;

-- 檢查傳統欄位是否同步更新
SELECT 
  id,
  product_name,
  product_snapshot->'basic_info'->>'name' as snapshot_name
FROM order_items 
WHERE id = 1;
```

### 7. 向後相容性驗證

#### 7.1 舊查詢相容性
```sql
-- 測試舊格式查詢仍然工作
SELECT 
  id, 
  product_name, 
  product_sku, 
  discount_reason
FROM order_items 
WHERE product_name LIKE '%測試%';
```

#### 7.2 相容性視圖測試
```sql
-- 測試相容性視圖
SELECT 
  id,
  product_name,
  product_sku,
  discount_reason
FROM order_items_legacy_compatible
WHERE product_name IS NOT NULL;
```

### 8. 效能測試

#### 8.1 JSONB 查詢效能
```sql
-- 測試 JSONB 查詢效能
EXPLAIN ANALYZE
SELECT 
  id,
  product_snapshot->'basic_info'->>'name' as product_name,
  promotion_data->>'type' as promotion_type
FROM order_items 
WHERE product_snapshot->'basic_info'->>'sku' LIKE 'PROD%';
```

#### 8.2 索引使用驗證
```sql
-- 檢查索引使用情況
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM order_items 
WHERE product_snapshot @> '{"basic_info": {"name": "測試產品"}}';
```

### 9. 監控函數測試

#### 9.1 系統健康檢查
```sql
-- 檢查系統整體健康狀況
SELECT * FROM get_jsonb_system_health();
```

#### 9.2 快照覆蓋率統計
```sql
-- 檢查快照覆蓋率
SELECT 
  'Order Items' as table_name,
  COUNT(*) as total_records,
  COUNT(product_snapshot) as records_with_snapshots,
  ROUND(COUNT(product_snapshot) * 100.0 / COUNT(*), 2) as coverage_percentage
FROM order_items

UNION ALL

SELECT 
  'Orders' as table_name,
  COUNT(*) as total_records,
  COUNT(customer_snapshot) as records_with_snapshots,
  ROUND(COUNT(customer_snapshot) * 100.0 / COUNT(*), 2) as coverage_percentage
FROM orders;
```

### 10. 進階功能測試

#### 10.1 複雜促銷函數
```sql
-- 測試買X送Y函數
SELECT create_buy_x_get_y_order_items(
  (SELECT id FROM orders LIMIT 1),
  (SELECT id FROM products LIMIT 1),
  5, -- 買 5
  1, -- 送 1
  80.00, -- 單價
  gen_random_uuid(), -- 活動 ID
  '{"size": "L", "color": "藍色"}'
);
```

#### 10.2 批量資料處理
```sql
-- 測試批量快照重建
SELECT rebuild_missing_snapshots();
```

---

## 測試結果驗證

### 成功標準
- [ ] 所有表結構正確
- [ ] JSONB 資料格式符合規範
- [ ] 快照生成函數正常運作
- [ ] 自動觸發器正確執行
- [ ] 資料一致性檢查通過
- [ ] 向後相容性保持
- [ ] 效能表現符合預期
- [ ] 監控系統運作正常

### 驗證清單
1. **功能完整性**: 所有核心功能正常運作
2. **資料完整性**: 資料格式正確，關聯完整
3. **效能表現**: 查詢效能符合預期
4. **穩定性**: 系統在各種操作下穩定運行
5. **相容性**: 不影響現有功能

---

## 🚨 故障排除

### 常見問題

#### 1. 快照生成失敗
**現象**: 快照欄位為 NULL 或空
**解決**: 檢查觸發器是否啟用，執行手動快照生成

#### 2. 效能問題
**現象**: JSONB 查詢過慢
**解決**: 檢查索引使用情況，優化查詢語句

#### 3. 資料不一致
**現象**: JSONB 與傳統欄位不一致
**解決**: 執行資料同步函數，檢查觸發器邏輯

### 緊急修復
```sql
-- 重建所有快照
SELECT rebuild_all_snapshots();

-- 修復資料不一致
SELECT repair_data_inconsistency();

-- 重新啟用觸發器
SELECT enable_all_jsonb_triggers();
```

---

## 測試報告範本

```
JSONB 系統測試報告
==================

測試日期: ___________
測試人員: ___________
測試環境: ___________

測試結果:
□ 表結構驗證: PASS/FAIL
□ 資料展示: PASS/FAIL  
□ 促銷場景: PASS/FAIL
□ 快照生成: PASS/FAIL
□ 觸發器測試: PASS/FAIL
□ 資料一致性: PASS/FAIL
□ 向後相容性: PASS/FAIL
□ 效能測試: PASS/FAIL

問題記錄:
1. ___________
2. ___________

建議:
1. ___________
2. ___________
```

---

**🎯 透過這個完整的測試指南，您可以全面驗證 JSONB 系統的各項功能！**

*更新日期: 2025-07-14*  
*文檔版本: 2.0*