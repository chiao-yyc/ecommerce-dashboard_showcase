-- =====================================================
-- 群組通知統計視圖
-- 創建 notification_distribution_stats 視圖以提供群組通知分發統計
-- =====================================================

-- 先刪除現有視圖（如果存在）以避免欄位衝突
DROP VIEW IF EXISTS notification_distribution_stats;

-- 創建群組通知分發統計視圖
CREATE VIEW notification_distribution_stats AS
SELECT 
    -- 基本分發資訊
    nd.id as distribution_id,
    nd.target_type,
    nd.target_criteria,
    nd.created_at as sent_at,
    
    -- 統計數據（從 notification_recipients 聚合）
    COUNT(nr.id) as total_recipients,
    COUNT(CASE WHEN nr.status = 'delivered' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN nr.status = 'failed' THEN 1 END) as failed_count,
    ROUND(
        CASE 
            WHEN COUNT(nr.id) > 0 THEN
                COUNT(CASE WHEN nr.status = 'delivered' THEN 1 END)::numeric / COUNT(nr.id) * 100
            ELSE 0
        END, 2
    ) as delivery_rate,
    
    -- 通知內容資訊（從通知和模板取得）
    COALESCE(
        -- 優先從實際通知取得類型
        n.type,
        -- 其次從模板取得
        nt.type, 
        -- 最後使用預設值
        'system_notification'
    ) as notification_type,
    
    COALESCE(
        -- 優先從實際通知取得優先級
        n.priority,
        -- 其次從模板預設優先級
        nt.default_priority, 
        -- 最後使用預設值
        'medium'
    ) as priority,
    
    COALESCE(
        -- 優先從實際通知取得標題
        n.title,
        -- 其次從模板標題
        nt.title_template, 
        -- 最後使用預設值
        '群組通知'
    ) as title,
    
    COALESCE(
        -- 優先從實際通知取得訊息
        n.message,
        -- 其次從模板訊息
        nt.message_template, 
        -- 最後使用空字串
        ''
    ) as message,
    
    -- 模板關聯
    nd.notification_template_id,
    
    -- 分類和完成策略
    COALESCE(n.category, nt.category, 'informational') as category,
    COALESCE(n.completion_strategy, nt.completion_strategy, 'manual') as completion_strategy

FROM notification_distributions nd
LEFT JOIN notification_recipients nr ON nd.id = nr.distribution_id
LEFT JOIN notification_templates nt ON nd.notification_template_id = nt.id  
LEFT JOIN notifications n ON nr.notification_id = n.id
GROUP BY 
    nd.id, nd.target_type, nd.target_criteria, nd.created_at,
    nd.notification_template_id, nt.type, nt.default_priority, 
    nt.title_template, nt.message_template, nt.category, nt.completion_strategy,
    n.type, n.priority, n.title, n.message, n.category, n.completion_strategy
ORDER BY nd.created_at DESC;

-- 創建索引以優化查詢效能
CREATE INDEX IF NOT EXISTS idx_notification_distributions_created_at 
ON notification_distributions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_status 
ON notification_recipients(status);

-- 驗證視圖創建成功
SELECT 'notification_distribution_stats view created successfully!' as message;

-- 測試查詢範例（可選）
-- SELECT * FROM notification_distribution_stats LIMIT 5;