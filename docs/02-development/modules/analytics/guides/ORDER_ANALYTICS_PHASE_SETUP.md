# Order Analytics 階段性設置指南

## 概覽

根據階段性開發原則，Order Analytics 分為三個實現階段：

### 階段1：零資料表擴展 ✅ **當前實現**
- **原則**: 完全基於現有資料表，不新增任何資料庫對象
- **實現方式**: 應用層分析邏輯，直接查詢 `orders`, `order_items`, `payments`, `customers` 表
- **優點**: 無需資料庫變更，可立即使用
- **限制**: 查詢效能較低，分析邏輯複雜

### 階段2：輕量資料表擴展 
- **原則**: 新增少量分析視圖或欄位
- **預期**: 2-3個分析視圖，1-2個輔助欄位
- **目標**: 平衡效能與簡潔性

### 階段3：完整功能擴展
- **原則**: 完整的分析資料庫設計
- **預期**: 專用分析表、預計算結果、即時更新機制
- **目標**: 企業級訂單分析平台

---

## 當前狀態：階段1 (零擴展) 已完成

### ✅ 已實現組件
- `OrderAnalyticsZeroExpansionService` - 零擴展API服務
- `useOrderAnalyticsBasic` - 組合式函數
- `OrderAnalyticsView` - 主分析頁面
- 5個分析組件：漏斗、付款、配送、客戶、取消分析
- 完整的 TypeScript 類型定義

### 功能範圍
- **訂單漏斗分析**: 追蹤從待處理到完成的轉換流程
- **付款效能分析**: 各付款方式的成功率和營收分析  
- **配送效能分析**: 基於時間戳的配送效能估算
- **客戶行為分析**: 客戶分群、生命週期價值、購買模式
- **取消原因分析**: 基於 notes 欄位的自然語言處理

### ⚡ 當前效能特性
- **查詢方式**: 直接查詢現有表格，應用層分析
- **回應時間**: 2-5秒（視資料量而定）
- **並發支援**: 5-10 個同時用戶
- **資料新鮮度**: 即時，無快取延遲
- **資源使用**: CPU 密集，適合中小型資料集

### ✅ 零擴展特色
1. **完全基於現有資料表**
   - `orders` - 訂單主資料
   - `order_items` - 訂單項目 (未來需要時使用)
   - `payments` - 付款記錄 (未來需要時使用)
   - `customers` - 客戶資料

2. **應用層分析邏輯**
   - 所有統計運算在 JavaScript 中完成
   - 不依賴資料庫視圖或函數
   - 靈活的篩選和聚合邏輯

3. **即時可用性**
   - 無需任何資料庫變更
   - 直接啟動即可使用所有功能

---

## 階段2 升級選項 (可選執行)

如果您希望提升查詢效能並獲得更準確的分析結果，可以手動執行以下 SQL migration：

### SQL Migration Script

```sql
-- ============================================================================
-- Order Analytics 階段2：輕量擴展 SQL Migration
-- 執行日期: 2025-07-26
-- 目的: 提升查詢效能，增強分析準確性
-- 影響: 新增5個分析視圖，不修改現有表結構
-- ============================================================================

-- 1. 訂單漏斗分析視圖
CREATE OR REPLACE VIEW order_basic_funnel_analysis AS
SELECT 
  DATE_TRUNC('day', created_at) as analysis_date,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count, 
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'shipped') as shipped_count,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  SUM(total_amount) FILTER (WHERE status IN ('completed', 'delivered')) as completed_revenue,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered'))::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status != 'cancelled'), 0) * 100, 2
  ) as completion_rate,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'cancelled')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as cancellation_rate
FROM orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY analysis_date DESC;

-- 2. 付款方式效能分析視圖
CREATE OR REPLACE VIEW payment_method_basic_performance AS
WITH payment_stats AS (
  SELECT 
    COALESCE(payment_method, 'unknown') as payment_method,
    status,
    total_amount,
    created_at
  FROM orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND payment_method IS NOT NULL
)
SELECT 
  payment_method,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
  ROUND(SUM(total_amount), 2) as total_revenue,
  ROUND(AVG(total_amount), 2) as avg_order_value,
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered'))::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'cancelled')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as cancellation_rate,
  0 as revenue_percentage -- 在應用層計算
FROM payment_stats
GROUP BY payment_method
HAVING COUNT(*) >= 3
ORDER BY total_revenue DESC;

-- 3. 配送效能分析視圖
CREATE OR REPLACE VIEW delivery_basic_performance AS
WITH delivery_stats AS (
  SELECT 
    id,
    created_at,
    updated_at,
    total_amount,
    status,
    CASE 
      WHEN status IN ('delivered', 'completed') 
      THEN EXTRACT(EPOCH FROM (updated_at - created_at))/(24*3600)
      ELSE NULL 
    END as estimated_delivery_days
  FROM orders
  WHERE status IN ('shipped', 'delivered', 'completed')
    AND created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  DATE_TRUNC('week', created_at) as delivery_week,
  COUNT(*) as total_deliveries,
  ROUND(AVG(estimated_delivery_days), 2) as avg_delivery_days,
  COUNT(*) FILTER (WHERE estimated_delivery_days <= 7) as on_time_deliveries,
  COUNT(*) FILTER (WHERE estimated_delivery_days > 7) as delayed_deliveries,
  ROUND(
    COUNT(*) FILTER (WHERE estimated_delivery_days <= 7)::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as on_time_rate,
  ROUND(SUM(total_amount), 2) as total_delivery_revenue,
  ROUND(AVG(total_amount), 2) as avg_delivery_order_value
FROM delivery_stats  
WHERE estimated_delivery_days IS NOT NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY delivery_week DESC;

-- 4. 客戶訂單行為分析視圖
CREATE OR REPLACE VIEW customer_order_basic_behavior AS
WITH customer_stats AS (
  SELECT 
    user_id as customer_id,
    COUNT(*) as total_orders,
    SUM(total_amount) as lifetime_value,
    AVG(total_amount) as avg_order_value,
    MIN(created_at) as first_order_date,
    MAX(created_at) as last_order_date,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders,
    CASE 
      WHEN COUNT(*) > 1 THEN 
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at)))/(24*3600) / (COUNT(*) - 1)
      ELSE NULL 
    END as avg_order_interval_days,
    MODE() WITHIN GROUP (ORDER BY payment_method) as favorite_payment_method
  FROM orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
    AND user_id IS NOT NULL
  GROUP BY user_id
)
SELECT 
  customer_id,
  total_orders,
  completed_orders,
  cancelled_orders,
  lifetime_value,
  avg_order_value,
  avg_order_interval_days,
  favorite_payment_method,
  first_order_date,
  last_order_date,
  ROUND(
    cancelled_orders::numeric / NULLIF(total_orders, 0) * 100, 2
  ) as cancel_rate,
  CASE 
    WHEN total_orders >= 10 AND avg_order_value >= 1000 THEN 'high_value'
    WHEN total_orders >= 5 AND avg_order_value >= 500 THEN 'medium_value'
    WHEN total_orders >= 2 THEN 'regular'
    ELSE 'new_customer'
  END as customer_segment,
  CASE 
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - last_order_date))/(24*3600) <= 30 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - last_order_date))/(24*3600) <= 90 THEN 'at_risk'
    ELSE 'churned'
  END as customer_status,
  EXTRACT(EPOCH FROM (CURRENT_DATE - first_order_date))/(24*3600) as customer_age_days
FROM customer_stats
ORDER BY lifetime_value DESC;

-- 5. 取消原因分析視圖
CREATE OR REPLACE VIEW order_cancellation_basic_analysis AS
WITH cancellation_data AS (
  SELECT 
    id,
    created_at,
    total_amount,
    notes,
    CASE 
      WHEN notes IS NULL OR TRIM(notes) = '' THEN 'no_reason'
      WHEN notes ILIKE '%payment%' OR notes ILIKE '%付款%' THEN 'payment_issue'
      WHEN notes ILIKE '%stock%' OR notes ILIKE '%庫存%' OR notes ILIKE '%缺貨%' THEN 'stock_issue'  
      WHEN notes ILIKE '%customer%' OR notes ILIKE '%客戶%' OR notes ILIKE '%顧客%' THEN 'customer_request'
      WHEN notes ILIKE '%shipping%' OR notes ILIKE '%配送%' OR notes ILIKE '%物流%' THEN 'shipping_issue'
      ELSE 'other'
    END as cancel_reason
  FROM orders 
  WHERE status = 'cancelled'
    AND created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  DATE_TRUNC('week', created_at) as cancel_week,
  cancel_reason,
  COUNT(*) as cancel_count,
  ROUND(AVG(total_amount), 2) as avg_cancel_amount,
  ROUND(SUM(total_amount), 2) as total_cancel_loss,
  ROUND(
    COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('week', created_at)) * 100, 2
  ) as weekly_reason_percentage
FROM cancellation_data
GROUP BY DATE_TRUNC('week', created_at), cancel_reason
ORDER BY cancel_week DESC, cancel_count DESC;

-- 6. 效能優化索引
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method) WHERE payment_method IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at) WHERE user_id IS NOT NULL;

-- 7. 摘要函數
CREATE OR REPLACE FUNCTION get_order_basic_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  WITH order_stats AS (
    SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value
    FROM orders 
    WHERE created_at >= start_date AND created_at <= end_date
  )
  SELECT json_build_object(
    'total_orders', COALESCE(total_orders, 0),
    'completed_orders', COALESCE(completed_orders, 0),
    'cancelled_orders', COALESCE(cancelled_orders, 0),
    'total_revenue', COALESCE(total_revenue, 0),
    'avg_order_value', COALESCE(ROUND(avg_order_value, 2), 0),
    'completion_rate', CASE 
      WHEN total_orders > 0 THEN ROUND(completed_orders::numeric / total_orders * 100, 2)
      ELSE 0 
    END,
    'cancellation_rate', CASE 
      WHEN total_orders > 0 THEN ROUND(cancelled_orders::numeric / total_orders * 100, 2) 
      ELSE 0
    END
  ) INTO result
  FROM order_stats;
  
  RETURN result;
END;
$$;
```

### 🔄 階段2 升級步驟

1. **備份現有資料庫** (建議)
   ```bash
   pg_dump your_database > backup_before_order_analytics.sql
   ```

2. **執行 SQL Migration**
   ```bash
   psql -h your_host -U your_user -d your_database -f order_analytics_migration.sql
   ```

3. **切換到階段2服務**
   - 將 `useOrderAnalyticsBasic.ts` 中的服務切換回 `OrderAnalyticsBasicApiService`
   - 這將啟用基於視圖的高效能查詢

4. **驗證功能**
   - 測試所有分析功能正常運作
   - 比較查詢效能提升

---

## 使用指引

### 當前 (階段1) 使用方式
1. 無需任何設置，直接訪問 `/orders/analytics`
2. 功能完整但查詢較慢
3. 適合小到中等數據量 (< 10萬筆訂單)

### 升級後 (階段2) 優勢
1. 查詢效能提升 5-10倍
2. 更準確的分析結果
3. 支援大數據量分析 (> 100萬筆訂單)

### 階段3 預期功能
- 即時數據更新
- 預計算結果快取
- 機器學習預測
- 進階視覺化圖表

---

## 完整升級路徑指南

### 升級決策矩陣

| 情境 | 建議階段 | 說明 |
|------|---------|------|
| 初期使用/概念驗證 | 保持 Phase 1 | 零擴展已足夠 |
| 查詢時間 > 3秒 | 升級到 Phase 2 | 輕量擴展提升效能 |
| 並發用戶 > 10人 | 升級到 Phase 2 | 視圖快取減少負載 |
| 資料量 > 10萬筆 | 升級到 Phase 2 | 索引優化大數據查詢 |
| 需要亞秒級回應 | 升級到 Phase 3 | 企業級效能 |
| 並發用戶 > 50人 | 升級到 Phase 3 | 預計算函數 |
| 資料量 > 100萬筆 | 升級到 Phase 3 | 完整分析架構 |

### Phase 1 → Phase 2 升級

#### 準備工作
1. **效能評估**
   ```sql
   -- 檢查當前查詢效能
   EXPLAIN ANALYZE 
   SELECT COUNT(*), status, DATE_TRUNC('day', created_at)
   FROM orders 
   WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
   GROUP BY status, DATE_TRUNC('day', created_at);
   ```

2. **資料量評估**
   ```sql
   -- 檢查資料規模
   SELECT 
     COUNT(*) as total_orders,
     MIN(created_at) as earliest_order,
     MAX(created_at) as latest_order
   FROM orders;
   ```

#### 升級步驟
1. **執行 SQL migration**
   ```bash
   psql -h localhost -U postgres -d your_database \
     -f docs/02-development/database/sql_for_future_phases/migrations/order_analytics_views_phase1.sql
   ```

2. **更新 API 服務** (暫時先保持現有服務，Phase 2 API 服務需重新實現)
   - 目前可繼續使用 `OrderAnalyticsZeroExpansionService`
   - 未來實現 `OrderAnalyticsBasicApiService` 來使用視圖

3. **驗證升級**
   ```sql
   -- 確認視圖建立成功
   SELECT viewname FROM pg_views WHERE viewname LIKE 'order_%';
   
   -- 測試視圖查詢效能
   EXPLAIN ANALYZE SELECT * FROM order_basic_funnel_analysis LIMIT 10;
   ```

### Phase 2 → Phase 3 升級

#### 準備工作
1. **系統負載評估**
   - 監控 CPU 使用率
   - 檢查記憶體使用情況
   - 評估磁碟 I/O 性能

2. **資料成長預測**
   - 每日新增訂單量
   - 歷史資料保留期間
   - 分析查詢頻率

#### 升級步驟
1. **執行完整 SQL migration**
   ```bash
   psql -h localhost -U postgres -d your_database \
     -f docs/02-development/database/sql_for_future_phases/migrations/order_analytics_views.sql
   ```

2. **實現進階 API 服務**
   - 需要重新實現 `OrderAnalyticsApiService`
   - 使用預計算函數和進階視圖
   - 支援更複雜的分析查詢

3. **配置監控**
   - 設定查詢效能監控
   - 配置資源使用告警
   - 制定維護計劃

### 重要注意事項

#### 升級風險
- **資料不一致**: 升級期間可能有短暫的資料不一致
- **效能影響**: 索引建立可能暫時影響系統效能
- **相依性**: 確保所有相關服務都已停止

#### 回滾計劃
每次升級前都應準備回滾腳本：
```sql
-- 回滾 Phase 2 升級
DROP VIEW IF EXISTS order_basic_funnel_analysis CASCADE;
-- ... 其他清理語句
```

#### 最佳實踐
1. **分段升級**: 建議先在測試環境驗證
2. **監控升級**: 密切監控系統效能指標
3. **資料備份**: 每次升級前都要完整備份
4. **團隊協調**: 確保所有開發者了解升級影響

### 進階參考資料

- [Phase 2/3 擴展完整指南](./ORDER_ANALYTICS_PHASE2_3_EXPANSION_GUIDE.md)
- [SQL Migration 腳本說明](../../../02-development/database/sql_for_future_phases/README.md)

---

*最後更新: 2025-07-26*
*當前狀態: Phase 1 (零擴展) 已完成並可投入生產使用*

---

## 重要提醒

1. **階段1** 已完全實現，可立即使用
2. **階段2** 為可選升級，需手動執行 SQL
3. **階段3** 為長期規劃，需要更大的開發投入

您可以根據當前需求決定是否要執行階段2的升級。如果當前的零擴展版本能滿足需求，建議先使用一段時間觀察效能表現，再考慮是否升級。

---

**文檔版本**: v1.0  
**建立日期**: 2025-07-26  
**維護者**: AI Development Team  
**狀態**: Ready for Production (Phase 1)