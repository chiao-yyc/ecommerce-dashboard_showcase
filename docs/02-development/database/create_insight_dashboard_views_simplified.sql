-- 洞察驅動儀表板數據庫視圖創建腳本
-- 簡化版本：僅使用確認存在的表和欄位

-- A. 業務健康度評分系統
CREATE OR REPLACE VIEW business_health_metrics AS
WITH customer_health AS (
  SELECT 
    date_trunc('week', o.created_at) as week,
    COUNT(DISTINCT o.user_id) as active_customers,
    COUNT(DISTINCT CASE WHEN (r.r_score >= 4 AND r.f_score >= 4 AND r.m_score >= 4) OR r.lifecycle_stage = 'Active' THEN o.user_id END) as high_value_customers
  FROM orders o
  LEFT JOIN customer_rfm_lifecycle_metrics r ON o.user_id = r.user_id
  GROUP BY date_trunc('week', o.created_at)
),
operational_health AS (
  SELECT 
    date_trunc('week', created_at) as week,
    COUNT(*) as total_orders,
    AVG(EXTRACT(epoch FROM (updated_at - created_at))/3600) as avg_fulfillment_hours,
    COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*)::float as completion_rate
  FROM orders
  GROUP BY date_trunc('week', created_at)
),
support_health AS (
  SELECT 
    date_trunc('week', conversation_date) as week,
    AVG(COALESCE(avg_first_response_minutes, 0)) as avg_response_time,
    SUM(COALESCE(closed_conversations, 0)) / NULLIF(SUM(COALESCE(total_conversations, 0)), 0)::float as resolution_rate
  FROM conversation_summary_daily
  GROUP BY date_trunc('week', conversation_date)
)
SELECT 
  c.week,
  c.active_customers,
  c.high_value_customers,
  CASE 
    WHEN c.active_customers > 0 THEN c.high_value_customers::float / c.active_customers 
    ELSE 0 
  END as customer_quality_ratio,
  COALESCE(o.completion_rate, 0) as completion_rate,
  COALESCE(o.avg_fulfillment_hours, 0) as avg_fulfillment_hours,
  COALESCE(s.avg_response_time, 0) as avg_response_time,
  COALESCE(s.resolution_rate, 0) as resolution_rate,
  -- 健康度評分算法
  CASE 
    WHEN (c.high_value_customers::float / NULLIF(c.active_customers, 0) > 0.3 
         AND COALESCE(o.completion_rate, 0) > 0.8 
         AND COALESCE(s.avg_response_time, 999) < 5) THEN '優秀'
    WHEN (c.high_value_customers::float / NULLIF(c.active_customers, 0) > 0.2 
         AND COALESCE(o.completion_rate, 0) > 0.7 
         AND COALESCE(s.avg_response_time, 999) < 10) THEN '良好'
    ELSE '需改善'
  END as overall_health_rating
FROM customer_health c
LEFT JOIN operational_health o ON c.week = o.week
LEFT JOIN support_health s ON c.week = s.week
ORDER BY c.week DESC;

-- B. 客戶價值行動建議引擎
CREATE OR REPLACE VIEW customer_action_recommendations AS
SELECT 
  user_id,
  full_name,
  rfm_segment,
  lifecycle_stage,
  monetary as estimated_ltv, -- 使用 monetary 作為 LTV 的代理指標
  recency_days,
  frequency,
  monetary,
  CASE 
    -- 基於RFM分數組合和生命週期階段的建議
    WHEN (r_score >= 4 AND f_score >= 4 AND m_score >= 4) OR lifecycle_stage = 'Active' THEN '提供VIP專屬服務，增加品牌忠誠度'
    WHEN (r_score >= 3 AND f_score >= 3) OR lifecycle_stage = 'Active' THEN '推薦相關產品，提升購買頻次'
    WHEN lifecycle_stage = 'At Risk' THEN '立即啟動挽回營銷，了解流失原因'
    WHEN lifecycle_stage = 'Churned' THEN '專人服務，重新激活購買意願'
    WHEN lifecycle_stage = 'New' THEN '新客培養計劃，建立購買習慣'
    ELSE '維持現狀，定期關懷'
  END as recommended_action,
  CASE 
    WHEN monetary > 2000 OR (r_score >= 4 AND f_score >= 4 AND m_score >= 4) THEN '高'
    WHEN monetary > 500 OR lifecycle_stage IN ('At Risk', 'New') THEN '中'
    ELSE '低'
  END as action_priority,
  CASE 
    WHEN recency_days > 90 THEN '流失風險'
    WHEN recency_days > 60 THEN '關注警示'
    WHEN recency_days > 30 THEN '正常監控'
    ELSE '活躍狀態'
  END as engagement_status
FROM customer_rfm_lifecycle_metrics 
WHERE user_id IS NOT NULL;

-- C. 營運效率優化分析
CREATE OR REPLACE VIEW operational_efficiency_analysis AS
WITH hourly_efficiency AS (
  SELECT 
    hour,
    AVG(order_count) as avg_orders_per_hour,
    AVG(total_amount) as avg_revenue_per_hour,
    AVG(avg_order_value) as avg_order_value,
    RANK() OVER (ORDER BY AVG(order_count) DESC) as order_volume_rank,
    RANK() OVER (ORDER BY AVG(total_amount) DESC) as revenue_rank
  FROM order_metrics_hourly
  GROUP BY hour
)
SELECT 
  h.hour,
  h.avg_orders_per_hour,
  h.avg_revenue_per_hour,
  h.order_volume_rank,
  h.revenue_rank,
  0 as avg_response_time, -- 簡化版本，暫時設為0
  CASE 
    WHEN h.order_volume_rank <= 8 AND h.revenue_rank <= 8 THEN '黃金時段'
    WHEN h.order_volume_rank <= 12 OR h.revenue_rank <= 12 THEN '重要時段'
    ELSE '一般時段'
  END as time_priority,
  CASE 
    WHEN h.order_volume_rank <= 6 THEN '建議增加客服人力'
    WHEN h.order_volume_rank > 18 THEN '可考慮減少人力配置'
    ELSE '維持現有配置'
  END as staffing_recommendation
FROM hourly_efficiency h
ORDER BY h.hour;

-- D. 風險預警系統（簡化版）
CREATE OR REPLACE VIEW business_risk_alerts AS
WITH customer_risks AS (
  SELECT 
    'customer_churn' as risk_type,
    '客戶流失風險增加' as risk_title,
    COUNT(*) as affected_count,
    CASE 
      WHEN COUNT(*) > 50 THEN '高'
      WHEN COUNT(*) > 20 THEN '中'
      ELSE '低'
    END as risk_level,
    '建議啟動客戶挽回計劃，提供個人化優惠' as recommended_action
  FROM customer_rfm_lifecycle_metrics 
  WHERE lifecycle_stage = 'At Risk' AND recency_days > 60
),
operational_risks AS (
  SELECT 
    'order_processing_delay' as risk_type,
    '訂單處理延遲風險' as risk_title,
    COUNT(*) as affected_count,
    CASE 
      WHEN COUNT(*) > 100 THEN '高'
      WHEN COUNT(*) > 50 THEN '中'
      ELSE '低'
    END as risk_level,
    '建議優化處理流程，增加人力配置' as recommended_action
  FROM orders 
  WHERE status = 'pending' 
    AND EXTRACT(epoch FROM (NOW() - created_at))/3600 > 24
),
all_risks AS (
  SELECT * FROM customer_risks
  WHERE affected_count > 0
  UNION ALL
  SELECT * FROM operational_risks
  WHERE affected_count > 0
)
SELECT * FROM all_risks;

-- 創建基本索引（僅針對確認存在的表）
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_customer_rfm_lifecycle_stage ON customer_rfm_lifecycle_metrics (lifecycle_stage);
CREATE INDEX IF NOT EXISTS idx_customer_rfm_recency_days ON customer_rfm_lifecycle_metrics (recency_days);

-- 確認視圖創建成功
-- 分別測試每個視圖
SELECT 
  'business_health_metrics' as view_name, 
  COUNT(*) as record_count,
  'OK' as status
FROM business_health_metrics

SELECT 
  'customer_action_recommendations' as view_name, 
  COUNT(*) as record_count,
  'OK' as status
FROM customer_action_recommendations

SELECT 
  'operational_efficiency_analysis' as view_name, 
  COUNT(*) as record_count,
  'OK' as status
FROM operational_efficiency_analysis

SELECT 
  'business_risk_alerts' as view_name, 
  COUNT(*) as record_count,
  'OK' as status
FROM business_risk_alerts;