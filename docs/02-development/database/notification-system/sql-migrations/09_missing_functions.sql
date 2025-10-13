-- ============================================
-- 創建缺失的數據庫函數
-- ============================================

-- 只创建真正缺失的函数，其他函数已经在 07_notification_functions_fixed.sql 中定义
-- 这里只是为了确保函数正常工作，修正一些可能的状态字段问题

-- 先删除可能存在冲突的函数
DROP FUNCTION IF EXISTS get_notification_suggestions(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_user_active_notifications(UUID, JSON, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_notifications(UUID, TEXT, JSON, INTEGER, INTEGER);

-- 1. get_user_notification_stats 函数已存在，无需重新创建

-- 2. get_notification_suggestions 函數
CREATE OR REPLACE FUNCTION get_notification_suggestions(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    priority VARCHAR(20),
    category VARCHAR(50),
    suggested_complete BOOLEAN,
    suggestion_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    is_personal BOOLEAN,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    completion_strategy VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.category,
        n.suggested_complete,
        n.suggestion_reason,
        n.created_at,
        n.read_at,
        n.completed_at,
        n.dismissed_at,
        n.archived_at,
        n.action_url,
        n.is_personal,
        n.related_entity_type,
        n.related_entity_id,
        n.expires_at,
        n.completion_strategy
    FROM notifications n
    WHERE n.user_id = p_user_id
    AND n.suggested_complete = true
    AND n.status NOT IN ('archived', 'completed', 'dismissed')
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_suggestion_stats 函数已存在，无需重新创建

-- 4. get_user_active_notifications 函數
CREATE OR REPLACE FUNCTION get_user_active_notifications(
    p_user_id UUID,
    p_filter JSON DEFAULT '{}',
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    priority VARCHAR(20),
    category VARCHAR(50),
    suggested_complete BOOLEAN,
    suggestion_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    is_personal BOOLEAN,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    completion_strategy VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.category,
        n.suggested_complete,
        n.suggestion_reason,
        n.created_at,
        n.read_at,
        n.completed_at,
        n.dismissed_at,
        n.archived_at,
        n.action_url,
        n.is_personal,
        n.related_entity_type,
        n.related_entity_id,
        n.expires_at,
        n.completion_strategy
    FROM notifications n
    WHERE n.user_id = p_user_id
    AND n.status != 'archived'
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
        -- 未讀通知
        n.status = 'unread' OR
        -- 未完成的任務型通知
        (n.category = 'actionable' AND n.status NOT IN ('completed', 'dismissed')) OR
        -- 未知悉的資訊型通知
        (n.category = 'informational' AND n.status != 'dismissed')
    )
    ORDER BY 
        CASE WHEN n.status = 'unread' THEN 0 ELSE 1 END,
        CASE n.priority 
            WHEN 'urgent' THEN 0 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            ELSE 3 
        END,
        n.created_at DESC
    LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. search_notifications 函數
CREATE OR REPLACE FUNCTION search_notifications(
    p_user_id UUID,
    p_search_term TEXT,
    p_filter JSON DEFAULT '{}',
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    priority VARCHAR(20),
    category VARCHAR(50),
    suggested_complete BOOLEAN,
    suggestion_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    is_personal BOOLEAN,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    completion_strategy VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.priority,
        n.category,
        n.suggested_complete,
        n.suggestion_reason,
        n.created_at,
        n.read_at,
        n.completed_at,
        n.dismissed_at,
        n.archived_at,
        n.action_url,
        n.is_personal,
        n.related_entity_type,
        n.related_entity_id,
        n.expires_at,
        n.completion_strategy
    FROM notifications n
    WHERE n.user_id = p_user_id
    AND n.status != 'archived'
    AND (
        LOWER(n.title) LIKE LOWER('%' || p_search_term || '%') OR
        LOWER(n.message) LIKE LOWER('%' || p_search_term || '%') OR
        LOWER(n.type) LIKE LOWER('%' || p_search_term || '%')
    )
    ORDER BY 
        CASE WHEN n.status = 'unread' THEN 0 ELSE 1 END,
        CASE n.priority 
            WHEN 'urgent' THEN 0 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            ELSE 3 
        END,
        n.created_at DESC
    LIMIT p_limit OFFSET (p_page - 1) * p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. accept_all_suggestions 函数已存在，无需重新创建

-- 7. mark_all_notifications_read 函数已存在，无需重新创建

-- 8. accept_completion_suggestion 函数已存在，无需重新创建

-- 9. dismiss_completion_suggestion 函数已存在，无需重新创建

-- 10. 添加缺失的欄位到 notifications 表 (大部分已存在)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS suggestion_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suggestion_dismissed_at TIMESTAMP WITH TIME ZONE;

-- 11. 創建索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_notifications_user_suggestions 
ON notifications(user_id, suggested_complete, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_active 
ON notifications(user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_search 
ON notifications(user_id, status) WHERE status != 'archived';

-- 12. 授予必要的權限 (为缺失的函数)
GRANT EXECUTE ON FUNCTION get_notification_suggestions(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_active_notifications(UUID, JSON, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_notifications(UUID, TEXT, JSON, INTEGER, INTEGER) TO authenticated;

-- 显示完成消息
SELECT 'Missing notification functions created successfully!' as message;