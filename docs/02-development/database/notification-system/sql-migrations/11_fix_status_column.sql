-- ============================================
-- 修正 status 欄位問題
-- ============================================

-- 1. 檢查 notifications 表是否有 status 欄位
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' 
                   AND column_name = 'status' 
                   AND table_schema = 'public') THEN
        -- 如果沒有 status 欄位，添加它
        ALTER TABLE notifications ADD COLUMN status TEXT NOT NULL DEFAULT 'unread';
        
        -- 添加約束
        ALTER TABLE notifications ADD CONSTRAINT check_notification_status
            CHECK (status IN ('unread', 'read', 'completed', 'dismissed', 'archived'));
        
        -- 創建索引
        CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
        
        RAISE NOTICE 'Added status column to notifications table';
    ELSE
        RAISE NOTICE 'Status column already exists in notifications table';
    END IF;
END $$;

-- 2. 如果存在時間戳欄位，初始化 status 值
DO $$
BEGIN
    -- 檢查是否有 read_at 欄位
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' 
               AND column_name = 'read_at' 
               AND table_schema = 'public') THEN
        
        -- 根據時間戳更新 status
        UPDATE notifications SET status = 
            CASE 
                WHEN read_at IS NOT NULL AND status = 'unread' THEN 'read'
                ELSE status
            END
        WHERE status = 'unread' AND read_at IS NOT NULL;
        
        RAISE NOTICE 'Updated status based on read_at timestamp';
    END IF;
END $$;

-- 3. 重新創建 get_user_notification_stats 函數
DROP FUNCTION IF EXISTS get_user_notification_stats(UUID);

CREATE OR REPLACE FUNCTION get_user_notification_stats(p_user_id UUID)
RETURNS TABLE (
  total_notifications INTEGER,
  unread_count INTEGER,
  actionable_count INTEGER,
  suggestions_count INTEGER,
  by_priority JSONB,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_notifications,
    -- 使用 status 欄位或者 read_at 時間戳
    COALESCE(
      SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END),
      SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END)
    )::INTEGER as unread_count,
    -- 使用 category 或者 fallback 到 type 判斷
    COALESCE(
      SUM(CASE WHEN category = 'actionable' AND status NOT IN ('completed', 'dismissed', 'archived') THEN 1 ELSE 0 END),
      SUM(CASE WHEN type LIKE '%_request' OR type LIKE '%_overdue' OR type LIKE '%_failed' THEN 1 ELSE 0 END)
    )::INTEGER as actionable_count,
    -- 建議統計
    COALESCE(
      SUM(CASE WHEN suggested_complete = TRUE THEN 1 ELSE 0 END),
      0
    )::INTEGER as suggestions_count,
    -- 按優先級統計
    COALESCE(
      jsonb_object_agg(
        priority, 
        (SELECT COUNT(*) FROM notifications n2 WHERE n2.user_id = p_user_id AND n2.priority = n.priority)
      ),
      '{}'::jsonb
    ) as by_priority,
    -- 按分類統計
    COALESCE(
      jsonb_object_agg(
        COALESCE(category, 'informational'), 
        (SELECT COUNT(*) FROM notifications n2 WHERE n2.user_id = p_user_id AND COALESCE(n2.category, 'informational') = COALESCE(n.category, 'informational'))
      ),
      '{}'::jsonb
    ) as by_category
  FROM notifications n
  WHERE n.user_id = p_user_id 
    AND (status IS NULL OR status != 'archived')
  GROUP BY n.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 授予權限
GRANT EXECUTE ON FUNCTION get_user_notification_stats(UUID) TO authenticated;

-- 5. 測試函數
SELECT 'Testing get_user_notification_stats function...' as message;

-- 顯示完成消息
SELECT 'Status column and function fixes completed!' as message;