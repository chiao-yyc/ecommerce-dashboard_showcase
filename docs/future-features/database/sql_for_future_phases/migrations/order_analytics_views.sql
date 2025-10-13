-- ============================================================================
-- 訂單分析視圖 (Order Analytics Views)
-- 建立日期: 2025-07-26
-- 目的: 為訂單智能分析中心提供數據支援
-- 設計原則: 與現有 ProductAnalytics 架構保持一致
-- ============================================================================

-- 1. 訂單漏斗分析視圖
-- 分析訂單從 pending 到 completed 的轉換情況
CREATE OR REPLACE VIEW order_funnel_analysis AS
WITH daily_orders AS (
  SELECT 
    DATE_TRUNC('day', created_at) as analysis_date,
    status,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
  FROM orders 
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE_TRUNC('day', created_at), status
),
daily_funnel AS (
  SELECT 
    analysis_date,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'pending'), 0) as pending_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'confirmed'), 0) as confirmed_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'paid'), 0) as paid_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'processing'), 0) as processing_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'shipped'), 0) as shipped_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'delivered'), 0) as delivered_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'completed'), 0) as completed_count,
    COALESCE(SUM(order_count) FILTER (WHERE status = 'cancelled'), 0) as cancelled_count,
    COALESCE(SUM(total_revenue), 0) as total_revenue
  FROM daily_orders
  GROUP BY analysis_date
)
SELECT 
  analysis_date,
  pending_count,
  confirmed_count,
  paid_count,
  processing_count,
  shipped_count,
  delivered_count,
  completed_count,
  cancelled_count,
  total_revenue,
  -- 計算轉換率 (完成率)
  CASE 
    WHEN (pending_count + confirmed_count + paid_count + processing_count + 
          shipped_count + delivered_count + completed_count) > 0 
    THEN ROUND(
      (completed_count + delivered_count)::numeric / 
      NULLIF((pending_count + confirmed_count + paid_count + processing_count + 
              shipped_count + delivered_count + completed_count), 0) * 100, 2
    )
    ELSE 0 
  END as completion_rate,
  -- 計算取消率
  CASE 
    WHEN (pending_count + confirmed_count + paid_count + processing_count + 
          shipped_count + delivered_count + completed_count + cancelled_count) > 0 
    THEN ROUND(
      cancelled_count::numeric / 
      NULLIF((pending_count + confirmed_count + paid_count + processing_count + 
              shipped_count + delivered_count + completed_count + cancelled_count), 0) * 100, 2
    )
    ELSE 0 
  END as cancellation_rate
FROM daily_funnel
ORDER BY analysis_date DESC;

-- 2. 訂單取消原因分析視圖
-- 基於訂單備註分析取消原因
CREATE OR REPLACE VIEW order_cancellation_analysis AS
WITH cancellation_reasons AS (
  SELECT 
    id,
    cancelled_at,
    total_amount,
    notes,
    CASE 
      WHEN notes IS NULL OR notes = '' THEN 'no_reason'
      WHEN notes ILIKE '%payment%' OR notes ILIKE '%付款%' OR notes ILIKE '%金額%' THEN 'payment_issue'
      WHEN notes ILIKE '%stock%' OR notes ILIKE '%inventory%' OR notes ILIKE '%庫存%' OR notes ILIKE '%缺貨%' THEN 'stock_issue'
      WHEN notes ILIKE '%customer%' OR notes ILIKE '%客戶%' OR notes ILIKE '%顧客%' OR notes ILIKE '%取消%' THEN 'customer_request'
      WHEN notes ILIKE '%shipping%' OR notes ILIKE '%delivery%' OR notes ILIKE '%配送%' OR notes ILIKE '%物流%' THEN 'shipping_issue'
      ELSE 'other'
    END as cancel_reason
  FROM orders 
  WHERE status = 'cancelled' 
    AND cancelled_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  DATE_TRUNC('week', cancelled_at) as cancel_week,
  cancel_reason,
  COUNT(*) as cancel_count,
  ROUND(AVG(total_amount), 2) as avg_cancel_amount,
  SUM(total_amount) as total_cancel_amount,
  -- 計算該原因在當週的佔比
  ROUND(
    COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY DATE_TRUNC('week', cancelled_at)) * 100, 2
  ) as reason_percentage
FROM cancellation_reasons
GROUP BY DATE_TRUNC('week', cancelled_at), cancel_reason
ORDER BY cancel_week DESC, cancel_count DESC;

-- 3. 付款方式效能分析視圖
-- 分析不同付款方式的表現
CREATE OR REPLACE VIEW payment_method_performance AS
WITH payment_stats AS (
  SELECT 
    COALESCE(o.payment_method, 'unknown') as payment_method,
    o.id,
    o.status,
    o.total_amount,
    o.created_at,
    o.paid_at,
    -- 計算付款時間 (小時)
    CASE 
      WHEN o.paid_at IS NOT NULL AND o.created_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (o.paid_at - o.created_at))/3600 
      ELSE NULL 
    END as payment_hours
  FROM orders o
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  payment_method,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status IN ('completed', 'delivered')) as completed_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
  
  -- 時間相關統計
  ROUND(AVG(payment_hours), 2) as avg_payment_hours,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY payment_hours), 2) as median_payment_hours,
  
  -- 金額相關統計
  ROUND(SUM(total_amount)::numeric, 2) as total_revenue,
  ROUND(AVG(total_amount)::numeric, 2) as avg_order_value,
  ROUND(SUM(total_amount) FILTER (WHERE status IN ('completed', 'delivered'))::numeric, 2) as completed_revenue,
  
  -- 轉換率計算
  ROUND(
    COUNT(*) FILTER (WHERE status IN ('completed', 'delivered'))::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as completion_rate,
  
  -- 取消率計算
  ROUND(
    COUNT(*) FILTER (WHERE status = 'cancelled')::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as cancellation_rate
  
FROM payment_stats
GROUP BY payment_method
HAVING COUNT(*) >= 5  -- 只顯示訂單數量 >= 5 的付款方式
ORDER BY total_revenue DESC;

-- 4. 配送效能分析視圖
-- 分析配送時間和準時率
CREATE OR REPLACE VIEW delivery_performance_analysis AS
WITH delivery_stats AS (
  SELECT 
    id,
    shipped_at,
    delivered_at,
    created_at,
    total_amount,
    -- 計算配送天數
    CASE 
      WHEN shipped_at IS NOT NULL AND delivered_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (delivered_at - shipped_at))/(24*3600) 
      ELSE NULL 
    END as delivery_days,
    -- 計算總處理天數 (下單到送達)
    CASE 
      WHEN created_at IS NOT NULL AND delivered_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (delivered_at - created_at))/(24*3600) 
      ELSE NULL 
    END as total_fulfillment_days,
    -- 假設標準配送時間為 3 天，計算是否準時
    CASE 
      WHEN shipped_at IS NOT NULL AND delivered_at IS NOT NULL 
      THEN CASE 
        WHEN EXTRACT(EPOCH FROM (delivered_at - shipped_at))/(24*3600) <= 3 THEN true 
        ELSE false 
      END
      ELSE NULL 
    END as is_on_time
  FROM orders 
  WHERE status IN ('delivered', 'completed')
    AND shipped_at IS NOT NULL 
    AND delivered_at IS NOT NULL
    AND created_at >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  DATE_TRUNC('week', delivered_at) as delivery_week,
  COUNT(*) as total_deliveries,
  ROUND(AVG(delivery_days), 2) as avg_delivery_days,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY delivery_days), 2) as median_delivery_days,
  ROUND(AVG(total_fulfillment_days), 2) as avg_total_fulfillment_days,
  
  -- 準時配送統計
  COUNT(*) FILTER (WHERE is_on_time = true) as on_time_deliveries,
  COUNT(*) FILTER (WHERE is_on_time = false) as delayed_deliveries,
  ROUND(
    COUNT(*) FILTER (WHERE is_on_time = true)::numeric / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as on_time_delivery_rate,
  
  -- 延遲統計
  ROUND(AVG(delivery_days) FILTER (WHERE is_on_time = false), 2) as avg_delay_days,
  
  -- 營收影響
  ROUND(SUM(total_amount)::numeric, 2) as total_delivery_revenue,
  ROUND(AVG(total_amount)::numeric, 2) as avg_delivery_order_value
  
FROM delivery_stats
GROUP BY DATE_TRUNC('week', delivered_at)
ORDER BY delivery_week DESC;

-- 5. 客戶訂單行為分析視圖
-- 基於 RFM 分析的客戶訂單行為
CREATE OR REPLACE VIEW customer_order_behavior_analysis AS
WITH customer_order_stats AS (
  SELECT 
    o.user_id,
    COUNT(*) as total_orders,
    SUM(o.total_amount) as lifetime_value,
    AVG(o.total_amount) as avg_order_value,
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date,
    COUNT(*) FILTER (WHERE o.status = 'cancelled') as cancelled_orders,
    COUNT(*) FILTER (WHERE o.status IN ('completed', 'delivered')) as completed_orders,
    
    -- 計算平均下單間隔
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
),
customer_segments AS (
  SELECT 
    cos.*,
    -- 計算取消率
    ROUND(
      cos.cancelled_orders::numeric / NULLIF(cos.total_orders, 0) * 100, 2
    ) as cancel_rate,
    
    -- 基於 RFM 的簡單分群 (需要與現有的 customer_rfm_lifecycle_metrics 整合)
    CASE 
      WHEN cos.total_orders >= 10 AND cos.avg_order_value >= 1000 THEN 'high_value'
      WHEN cos.total_orders >= 5 AND cos.avg_order_value >= 500 THEN 'medium_value'
      WHEN cos.total_orders >= 1 AND cos.avg_order_value >= 100 THEN 'regular'
      ELSE 'low_value'
    END as customer_segment,
    
    -- 客戶狀態判斷
    CASE 
      WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - cos.last_order_date))/(24*3600) <= 30 THEN 'active'
      WHEN EXTRACT(EPOCH FROM (CURRENT_DATE - cos.last_order_date))/(24*3600) <= 90 THEN 'at_risk'
      ELSE 'churned'
    END as customer_status
    
  FROM customer_order_stats cos
)
SELECT 
  user_id as customer_id,
  customer_segment,
  customer_status,
  total_orders,
  completed_orders,
  cancelled_orders,
  lifetime_value,
  avg_order_value,
  avg_order_interval_days,
  favorite_payment_method,
  cancel_rate,
  first_order_date,
  last_order_date,
  -- 計算客戶年齡 (天數)
  EXTRACT(EPOCH FROM (CURRENT_DATE - first_order_date))/(24*3600) as customer_age_days
FROM customer_segments
ORDER BY lifetime_value DESC;

-- 6. 建立索引以提升查詢效能
-- 為常用的查詢條件建立索引

-- 訂單日期索引 (如果尚未存在)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_cancelled_at ON orders(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at);

-- 訂單狀態和付款方式索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);

-- 複合索引用於分析查詢
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at ON orders(user_id, created_at);

-- 7. 建立用於分析的函數

-- 取得訂單漏斗摘要的函數
CREATE OR REPLACE FUNCTION get_order_funnel_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_orders', SUM(pending_count + confirmed_count + paid_count + processing_count + 
                       shipped_count + delivered_count + completed_count + cancelled_count),
    'avg_completion_rate', ROUND(AVG(completion_rate), 2),
    'total_revenue', SUM(total_revenue),
    'avg_daily_orders', ROUND(AVG(pending_count + confirmed_count + paid_count + processing_count + 
                             shipped_count + delivered_count + completed_count + cancelled_count), 2),
    'bottleneck_stage', 'processing', -- 簡化實現，實際應計算瓶頸
    'improvement_suggestion', 'Focus on reducing processing time'
  ) INTO result
  FROM order_funnel_analysis
  WHERE analysis_date BETWEEN start_date AND end_date;
  
  RETURN result;
END;
$$;

-- 取得取消原因摘要的函數  
CREATE OR REPLACE FUNCTION get_cancellation_summary(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql  
AS $$
DECLARE
  result JSON;
BEGIN
  WITH cancel_stats AS (
    SELECT 
      cancel_reason,
      SUM(cancel_count) as total_count,
      SUM(total_cancel_amount) as total_amount
    FROM order_cancellation_analysis
    WHERE cancel_week >= DATE_TRUNC('week', start_date::timestamptz)
      AND cancel_week <= DATE_TRUNC('week', end_date::timestamptz)
    GROUP BY cancel_reason
    ORDER BY total_count DESC
    LIMIT 1
  )
  SELECT json_build_object(
    'total_cancellations', COALESCE(SUM(total_count), 0),
    'top_cancel_reason', COALESCE(MAX(cancel_reason), 'no_data'),
    'cancel_loss_amount', COALESCE(SUM(total_amount), 0),
    'weekly_trend', 'stable', -- 簡化實現
    'reduction_opportunity', 'Address ' || COALESCE(MAX(cancel_reason), 'main') || ' issues'
  ) INTO result
  FROM cancel_stats;
  
  RETURN result;
END;
$$;

-- 授權視圖給相關角色 (根據現有的權限設定)
-- GRANT SELECT ON order_funnel_analysis TO authenticated;
-- GRANT SELECT ON order_cancellation_analysis TO authenticated;  
-- GRANT SELECT ON payment_method_performance TO authenticated;
-- GRANT SELECT ON delivery_performance_analysis TO authenticated;
-- GRANT SELECT ON customer_order_behavior_analysis TO authenticated;

-- ============================================================================
-- 視圖建立完成
-- 
-- 使用說明:
-- 1. order_funnel_analysis: 每日訂單漏斗轉換數據
-- 2. order_cancellation_analysis: 每週取消原因分析
-- 3. payment_method_performance: 付款方式效能比較
-- 4. delivery_performance_analysis: 每週配送效能統計  
-- 5. customer_order_behavior_analysis: 客戶訂單行為分析
-- 
-- 查詢範例:
-- SELECT * FROM order_funnel_analysis ORDER BY analysis_date DESC LIMIT 30;
-- SELECT * FROM payment_method_performance ORDER BY total_revenue DESC;
-- ============================================================================