# 潛在問題檢查清單

**生成時間：** 2025-08-17  
**適用範圍：** final_consolidated_migration.sql 部署後檢查  
**緊急程度分級：** 🔴 高 | 🟡 中 | 🟢 低

---

## 🔴 高優先級問題（需立即處理）

### 1. 客戶系統資料一致性
**問題描述：** 由於客戶表經歷了移除→重建的過程，可能存在資料關聯性問題。

**檢查項目：**
```sql
-- 檢查孤立的客戶訂單
SELECT COUNT(*) as orphaned_orders 
FROM orders o 
LEFT JOIN customers c ON o.user_id = c.id 
WHERE c.id IS NULL;

-- 檢查 RFM 分數中的無效客戶引用
SELECT COUNT(*) as invalid_rfm_records 
FROM rfm_scores r 
LEFT JOIN customers c ON r.user_id = c.id 
WHERE c.id IS NULL;

-- 檢查對話中的無效客戶引用
SELECT COUNT(*) as invalid_conversations 
FROM conversations conv 
LEFT JOIN customers c ON conv.customer_id = c.id 
WHERE conv.customer_id IS NOT NULL AND c.id IS NULL;
```

**修復方案：**
- 清理孤立資料
- 重新建立正確的客戶關聯
- 更新相關統計視圖

### 2. JSONB 索引效能驗證
**問題描述：** JSONB 查詢可能存在效能瓶頸，需要驗證索引效果。

**檢查項目：**
```sql
-- 檢查 JSONB 查詢計劃
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM order_items 
WHERE product_snapshot->'basic_info'->>'name' = '測試產品';

-- 檢查索引使用率
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read 
FROM pg_stat_user_indexes 
WHERE tablename IN ('order_items', 'orders') 
  AND indexname LIKE '%jsonb%';
```

**優化建議：**
- 監控慢查詢日誌
- 針對常用查詢路徑建立專用索引
- 考慮使用 jsonb_path_ops 運算符類

### 3. 外鍵約束驗證
**問題描述：** 整合過程中可能遺漏某些外鍵約束的建立。

**檢查項目：**
```sql
-- 檢查所有外鍵約束
SELECT 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 檢查參照完整性違反
SELECT 'orders.user_id' as check_point, COUNT(*) as violations
FROM orders o LEFT JOIN customers c ON o.user_id = c.id 
WHERE o.user_id IS NOT NULL AND c.id IS NULL

UNION ALL

SELECT 'order_items.product_id', COUNT(*)
FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id 
WHERE oi.product_id IS NOT NULL AND p.id IS NULL;
```

---

## 🟡 中優先級問題（建議近期處理）

### 4. 通知系統模板完整性
**問題描述：** 系統必要模板可能遺漏或配置不正確。

**檢查項目：**
```sql
-- 檢查系統必要模板是否存在
SELECT template_name, is_active, is_system_required
FROM notification_templates 
WHERE name IN (
    'order_new', 'order_high_value', 'order_paid',
    'product_deactivated', 'product_price_major_change',
    'customer_new_registration',
    'inventory_low_stock', 'inventory_out_of_stock', 'inventory_overstock'
);

-- 檢查路由規則完整性
SELECT 
    nt.name as template_name,
    COUNT(nrr.id) as routing_rules_count
FROM notification_templates nt
LEFT JOIN notification_routing_rules nrr ON nt.id = nrr.template_id
WHERE nt.is_system_required = true
GROUP BY nt.name
HAVING COUNT(nrr.id) = 0;
```

**建議修復：**
- 補齊缺失的系統模板
- 驗證路由規則配置
- 測試通知觸發流程

### 5. AI 系統配置驗證
**問題描述：** AI 提供商配置可能不完整或存在衝突。

**檢查項目：**
```sql
-- 檢查 AI 提供商配置
SELECT 
    p.name,
    p.is_enabled,
    p.is_default,
    COUNT(pc.id) as prompt_configs
FROM ai_providers p
LEFT JOIN ai_prompt_provider_configs pc ON p.id = pc.provider_id
GROUP BY p.id, p.name, p.is_enabled, p.is_default;

-- 檢查是否有預設提供商
SELECT COUNT(*) as default_providers 
FROM ai_providers 
WHERE is_default = true AND is_enabled = true;

-- 檢查提示模板是否都有對應的提供商配置
SELECT 
    pt.name as template_name,
    COUNT(pc.id) as provider_configs
FROM ai_prompt_templates pt
LEFT JOIN ai_prompt_provider_configs pc ON pt.id = pc.prompt_template_id
WHERE pt.is_active = true
GROUP BY pt.name
HAVING COUNT(pc.id) = 0;
```

### 6. 假期系統同步驗證
**問題描述：** 假期資料與 dim_date 表的同步可能不正確。

**檢查項目：**
```sql
-- 檢查假期同步狀態
SELECT 
    h.date,
    COUNT(h.id) as holiday_count,
    d.is_holiday,
    d.holiday_names
FROM holidays h
FULL OUTER JOIN dim_date d ON h.date = d.date
WHERE h.date IS NOT NULL OR d.is_holiday = true
GROUP BY h.date, d.is_holiday, d.holiday_names
HAVING 
    (COUNT(h.id) > 0 AND (d.is_holiday IS NULL OR d.is_holiday = false)) OR
    (COUNT(h.id) = 0 AND d.is_holiday = true);

-- 檢查重複假期名稱
SELECT date, name, COUNT(*) as duplicate_count
FROM holidays 
GROUP BY date, name 
HAVING COUNT(*) > 1;
```

### 7. 庫存系統邏輯驗證
**問題描述：** 庫存可用量計算和分配邏輯可能存在問題。

**檢查項目：**
```sql
-- 檢查庫存計算一致性
SELECT 
    i.id,
    i.stock,
    i.reserved_stock,
    i.available_stock,
    (i.stock - i.reserved_stock) as calculated_available
FROM inventories i
WHERE i.available_stock != (i.stock - i.reserved_stock);

-- 檢查負庫存情況
SELECT COUNT(*) as negative_stock_items
FROM inventories 
WHERE stock < 0 OR available_stock < 0;

-- 檢查庫存日誌一致性
SELECT 
    il.inventory_id,
    SUM(il.quantity_change) as total_changes,
    i.stock as current_stock
FROM inventory_logs il
JOIN inventories i ON il.inventory_id = i.id
GROUP BY il.inventory_id, i.stock
HAVING SUM(il.quantity_change) != i.stock;
```

---

## 🟢 低優先級問題（可延後處理）

### 8. 權限系統配置檢查
**問題描述：** 權限組和角色配置可能不完整。

**檢查項目：**
```sql
-- 檢查權限組配置
SELECT name, is_active, permissions 
FROM permission_groups 
WHERE permissions = '{}' OR permissions IS NULL;

-- 檢查用戶角色分配
SELECT 
    COUNT(*) as users_without_roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL;
```

### 9. 視圖依賴關係檢查
**問題描述：** 某些視圖可能依賴已移除的欄位或表。

**檢查項目：**
```sql
-- 嘗試查詢所有視圖以檢查是否有錯誤
SELECT 
    schemaname, 
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 檢查 materialized view 狀態
SELECT 
    schemaname,
    matviewname,
    ispopulated
FROM pg_matviews 
WHERE schemaname = 'public';
```

### 10. 效能基準測試
**問題描述：** 需要建立效能基準以監控系統表現。

**測試項目：**
```sql
-- 常用查詢效能測試
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM customer_rfm_lifecycle_metrics LIMIT 100;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM order_summary_daily 
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM inventory_logs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 執行建議

### 立即執行檢查清單：

1. **部署前準備**
   ```bash
   # 備份現有資料庫
   pg_dump your_database > backup_before_migration.sql
   
   # 執行整合 migration
   psql -d your_database -f final_consolidated_migration.sql
   ```

2. **部署後驗證**
   ```sql
   -- 執行所有高優先級檢查
   -- 記錄結果並修復發現的問題
   ```

3. **監控設置**
   ```sql
   -- 啟用慢查詢日誌
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();
   
   -- 啟用統計資訊收集
   ALTER SYSTEM SET track_activities = on;
   ALTER SYSTEM SET track_counts = on;
   ```

### 定期檢查排程：

- **每日**：庫存一致性、外鍵完整性
- **每週**：效能指標、索引使用率
- **每月**：完整資料驗證、清理孤立資料

### 監控指標：

1. **效能指標**
   - 平均查詢時間
   - 索引命中率
   - 連接池使用率

2. **資料品質指標**
   - 外鍵約束違反數
   - 重複資料數量
   - 孤立記錄數

3. **業務指標**
   - 通知發送成功率
   - AI 服務響應時間
   - 庫存計算準確性

---

## ⚡ 緊急處理程序

### 如果發現嚴重問題：

1. **立即回滾**
   ```sql
   -- 停止服務
   -- 恢復備份
   psql -d your_database < backup_before_migration.sql
   ```

2. **問題分析**
   - 記錄具體錯誤訊息
   - 識別影響範圍
   - 制定修復方案

3. **修復和重部署**
   - 修復 migration 檔案
   - 測試修復效果
   - 重新執行部署

### 聯絡資訊：
- **資料庫管理員**：[聯絡資訊]
- **開發團隊**：[聯絡資訊]
- **系統管理員**：[聯絡資訊]

---

*檢查清單結束 - 請按優先級順序執行各項檢查*