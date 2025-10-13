-- ============================================================================
-- 訂單分析視圖 - 階段1：零資料表擴展
-- 建立日期: 2025-07-26  
-- 目的: 基於現有資料表實現基礎訂單分析，無需新增任何欄位或表格
-- 設計原則: 完全基於現有 orders, order_items, payments, customers 等表
-- ============================================================================

-- 檢查現有表結構，確保我們只使用存在的欄位
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';

-- 1. 基礎訂單漏斗分析 - 基於現有 order_summary_daily 增強
CREATE OR REPLACE VIEW order_basic_funnel_analysis AS
SELECT 
  DATE_TRUNC('day', created_at) as analysis_date,
  -- 基本計數 (使用確定存在的欄位)
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count, 
  COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
  COUNT(*) FILTER (WHERE status = 'shipped') as shipped_count,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  
  -- 金額統計
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value,
  SUM(total_amount) FILTER (WHERE status IN ('completed', 'delivered')) as completed_revenue,
  
  -- 轉換率計算
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered'))::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE status != 'cancelled'), 0) * 100, 2
  ) as completion_rate,
  
  -- 取消率計算  
  ROUND(
    COUNT(*) FILTER (WHERE status = 'cancelled')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as cancellation_rate

FROM orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY analysis_date DESC;

-- 2. 付款方式效能分析 - 基於現有 orders 和 payments 表
CREATE OR REPLACE VIEW payment_method_basic_performance AS
WITH payment_stats AS (
  SELECT 
    COALESCE(o.payment_method, 'unknown') as payment_method,
    o.status,
    o.total_amount,
    o.created_at,
    -- 只使用確定存在的時間欄位
    CASE 
      WHEN o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed') 
      THEN o.created_at  -- 簡化：使用創建時間作為付款時間的替代
      ELSE NULL 
    END as payment_time
  FROM orders o
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
    AND o.payment_method IS NOT NULL
)
SELECT 
  payment_method,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
  
  -- 金額統計
  ROUND(SUM(total_amount), 2) as total_revenue,
  ROUND(AVG(total_amount), 2) as avg_order_value,
  
  -- 成功率計算
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered'))::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as success_rate,
  
  -- 取消率計算
  ROUND(
    COUNT(*) FILTER (WHERE status = 'cancelled')::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as cancellation_rate,
  
  -- 營收佔比 (需要在應用層計算)
  0 as revenue_percentage

FROM payment_stats
GROUP BY payment_method
HAVING COUNT(*) >= 3  -- 只顯示訂單數 >= 3 的付款方式
ORDER BY total_revenue DESC;

-- 3. 基礎配送效能分析 - 使用現有時間戳記
CREATE OR REPLACE VIEW delivery_basic_performance AS
WITH delivery_stats AS (
  SELECT 
    o.id,
    o.created_at,
    o.total_amount,
    o.status,
    -- 使用現有的時間戳記欄位 (如果存在)
    CASE 
      WHEN o.status IN ('delivered', 'completed') 
      THEN EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - o.created_at))/(24*3600)
      ELSE NULL 
    END as estimated_delivery_days
  FROM orders o
  WHERE o.status IN ('shipped', 'delivered', 'completed')
    AND o.created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  DATE_TRUNC('week', created_at) as delivery_week,
  COUNT(*) as total_deliveries,
  ROUND(AVG(estimated_delivery_days), 2) as avg_delivery_days,
  
  -- 簡化的準時率計算 (假設標準配送時間為7天)
  COUNT(*) FILTER (WHERE estimated_delivery_days <= 7) as on_time_deliveries,
  COUNT(*) FILTER (WHERE estimated_delivery_days > 7) as delayed_deliveries,
  
  ROUND(
    COUNT(*) FILTER (WHERE estimated_delivery_days <= 7)::numeric /
    NULLIF(COUNT(*), 0) * 100, 2
  ) as on_time_rate,
  
  -- 營收統計
  ROUND(SUM(total_amount), 2) as total_delivery_revenue,
  ROUND(AVG(total_amount), 2) as avg_delivery_order_value

FROM delivery_stats  
WHERE estimated_delivery_days IS NOT NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY delivery_week DESC;

-- 4. 客戶訂單行為基礎分析 - 基於現有客戶資料
CREATE OR REPLACE VIEW customer_order_basic_behavior AS
WITH customer_stats AS (
  SELECT 
    o.user_id as customer_id,
    COUNT(*) as total_orders,
    SUM(o.total_amount) as lifetime_value,
    AVG(o.total_amount) as avg_order_value,
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date,
    COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
    COUNT(*) FILTER (WHERE o.status IN ('completed', 'delivered')) as completed_orders,
    
    -- 計算平均下單間隔 (簡化版)
    CASE 
      WHEN COUNT(*) > 1 THEN 
        EXTRACT(EPOCH FROM (MAX(o.created_at) - MIN(o.created_at)))/(24*3600) / (COUNT(*) - 1)
      ELSE NULL 
    END as avg_order_interval_days,
    
    -- 最常使用的付款方式
    MODE() WITHIN GROUP (ORDER BY o.payment_method) as favorite_payment_method
    
  FROM orders o
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '12 months'
    AND o.user_id IS NOT NULL
  GROUP BY o.user_id
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
  
  -- 取消率計算
  ROUND(
    cancelled_orders::numeric / NULLIF(total_orders, 0) * 100, 2
  ) as cancel_rate,
  
  -- 簡化的客戶分群
  CASE 
    WHEN total_orders >= 10 AND avg_order_value >= 1000 THEN 'high_value'
    WHEN total_orders >= 5 AND avg_order_value >= 500 THEN 'medium_value'
    WHEN total_orders >= 2 THEN 'regular'
    ELSE 'new_customer'
  END as customer_segment,
  
  -- 客戶狀態 (基於最後訂單時間)
  CASE 
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - last_order_date))/(24*3600) <= 30 THEN 'active'
    WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - last_order_date))/(24*3600) <= 90 THEN 'at_risk'
    ELSE 'churned'
  END as customer_status,
  
  -- 客戶年齡 (天數)
  EXTRACT(EPOCH FROM (CURRENT_DATE - first_order_date))/(24*3600) as customer_age_days

FROM customer_stats
ORDER BY lifetime_value DESC;

-- 5. 取消原因基礎分析 - 基於現有 notes 欄位的簡單文字分析
CREATE OR REPLACE VIEW order_cancellation_basic_analysis AS
WITH cancellation_data AS (
  SELECT 
    id,
    created_at,
    total_amount,
    notes,
    -- 簡化的取消原因分析 (基於 notes 欄位)
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
  
  -- 該原因當週佔比
  ROUND(
    COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('week', created_at)) * 100, 2
  ) as weekly_reason_percentage

FROM cancellation_data
GROUP BY DATE_TRUNC('week', created_at), cancel_reason
ORDER BY cancel_week DESC, cancel_count DESC;

-- 6. 建立基礎分析摘要函數
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

-- 為常用查詢建立索引 (如果尚未存在)
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method) WHERE payment_method IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at) WHERE user_id IS NOT NULL;

-- ============================================================================
-- 階段1基礎視圖建立完成
-- 
-- 可立即使用的分析功能:
-- 1. order_basic_funnel_analysis - 每日訂單漏斗分析
-- 2. payment_method_basic_performance - 付款方式效能
-- 3. delivery_basic_performance - 配送效能基礎分析  
-- 4. customer_order_basic_behavior - 客戶訂單行為
-- 5. order_cancellation_basic_analysis - 取消原因分析
-- 
-- 查詢範例:
-- SELECT * FROM order_basic_funnel_analysis LIMIT 30;
-- SELECT * FROM payment_method_basic_performance;
-- SELECT get_order_basic_summary();
-- ============================================================================