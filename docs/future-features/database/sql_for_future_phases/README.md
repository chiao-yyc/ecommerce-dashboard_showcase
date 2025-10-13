# Order Analytics SQL Migration Scripts

## 概覽

此目錄包含 Order Analytics 階段性擴展的 SQL migration 腳本。

## 📁 文件說明

### `order_analytics_views_phase1.sql`
**用途**: Phase 2 輕量擴展升級腳本
**適用**: 從 Phase 1 (零擴展) 升級到 Phase 2
**包含**:
- 5個基礎分析視圖
- 3個效能優化索引
- 1個摘要函數

**執行條件**:
- 現有系統使用 `OrderAnalyticsZeroExpansionService`
- 查詢效能需要提升 5-10倍
- 支援 10-50 並發用戶

### `order_analytics_views.sql`
**用途**: Phase 3 完整擴展升級腳本  
**適用**: 從 Phase 2 升級到 Phase 3，或直接從 Phase 1 跳級升級
**包含**:
- 15個進階分析視圖
- 8個高效能索引
- 2個預計算函數
- 完整的企業級分析能力

**執行條件**:
- 需要企業級效能（20-50倍提升）
- 支援 100+ 並發用戶
- 資料量超過 100,000 筆訂單

## 執行指南

### Phase 1 → Phase 2 升級
```bash
# 1. 備份資料庫
pg_dump -h localhost -U postgres -d your_database > backup_$(date +%Y%m%d).sql

# 2. 執行 Phase 2 升級
psql -h localhost -U postgres -d your_database -f order_analytics_views_phase1.sql

# 3. 驗證升級
psql -h localhost -U postgres -d your_database -c "\\dv order_*"
```

### Phase 2 → Phase 3 升級  
```bash
# 1. 備份資料庫
pg_dump -h localhost -U postgres -d your_database > backup_$(date +%Y%m%d).sql

# 2. 執行 Phase 3 升級
psql -h localhost -U postgres -d your_database -f order_analytics_views.sql

# 3. 驗證升級
psql -h localhost -U postgres -d your_database -c "\\df get_order_*"
```

### 直接升級到 Phase 3
```bash
# 如果想跳過 Phase 2 直接升級到 Phase 3
psql -h localhost -U postgres -d your_database -f order_analytics_views.sql
```

## 注意事項

### 執行前檢查
1. **資料庫版本**: PostgreSQL 12+ (支援 FILTER 語法)
2. **權限確認**: 需要 CREATE VIEW, CREATE INDEX, CREATE FUNCTION 權限
3. **儲存空間**: 確保有足夠空間用於索引建立
4. **維護窗口**: 建議在低峰時段執行

### 回滾計劃
```sql
-- 如需回滾 Phase 2 變更
DROP VIEW IF EXISTS order_basic_funnel_analysis;
DROP VIEW IF EXISTS payment_method_basic_performance;
DROP VIEW IF EXISTS delivery_basic_performance;
DROP VIEW IF EXISTS customer_order_basic_behavior;
DROP VIEW IF EXISTS order_cancellation_basic_analysis;
DROP FUNCTION IF EXISTS get_order_basic_summary;
DROP INDEX IF EXISTS idx_orders_created_at_status;
DROP INDEX IF EXISTS idx_orders_payment_method;
DROP INDEX IF EXISTS idx_orders_user_id_created_at;

-- 如需回滾 Phase 3 變更
DROP VIEW IF EXISTS order_funnel_analysis;
DROP VIEW IF EXISTS order_cancellation_analysis;
DROP VIEW IF EXISTS payment_method_performance;
DROP VIEW IF EXISTS delivery_performance_analysis;
DROP VIEW IF EXISTS customer_order_behavior_analysis;
DROP FUNCTION IF EXISTS get_order_funnel_summary;
DROP FUNCTION IF EXISTS get_cancellation_summary;
-- ... 其他索引
```

## 效能預期

### Phase 2 預期提升
- 查詢回應時間: 3-5秒 → 0.5-1秒
- CPU 使用率: 85% → 35%
- 支援併發: 5用戶 → 10-50用戶

### Phase 3 預期提升  
- 查詢回應時間: 3-5秒 → 0.1-0.3秒
- CPU 使用率: 85% → 15%
- 支援併發: 5用戶 → 100+用戶

## 🔍 驗證腳本

### 功能驗證
```sql
-- 檢查視圖是否建立成功
SELECT schemaname, viewname 
FROM pg_views 
WHERE viewname LIKE 'order_%' OR viewname LIKE '%_performance%';

-- 檢查函數是否建立成功
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname LIKE 'get_order_%';

-- 檢查索引是否建立成功
SELECT indexname, tablename 
FROM pg_indexes 
WHERE indexname LIKE 'idx_orders_%';
```

### 效能驗證
```sql
-- 測試查詢效能
EXPLAIN ANALYZE 
SELECT * FROM order_basic_funnel_analysis 
WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days';

-- 測試函數效能
EXPLAIN ANALYZE 
SELECT * FROM get_order_basic_summary(
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE
);
```

## 相關文檔

- [階段性開發指南](../../docs/04-guides/dev-notes/ORDER_ANALYTICS_DEVELOPMENT_PHASES.md)
- [Phase 2/3 擴展指南](../../docs/04-guides/dev-notes/ORDER_ANALYTICS_PHASE2_3_EXPANSION_GUIDE.md)
- [設置指南](../../docs/04-guides/dev-notes/ORDER_ANALYTICS_PHASE_SETUP.md)

---

*最後更新: 2025-07-26*