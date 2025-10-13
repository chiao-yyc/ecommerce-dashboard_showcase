-- =====================================================
-- 通知分類和完成策略擴展 (修正版)
-- =====================================================

-- 第一步：檢查並添加通知表的新欄位
DO $$
BEGIN
    -- 檢查並添加 category 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'category') THEN
        ALTER TABLE notifications ADD COLUMN category TEXT NOT NULL DEFAULT 'informational';
        RAISE NOTICE 'Added category column to notifications table';
    ELSE
        RAISE NOTICE 'Category column already exists in notifications table';
    END IF;
    
    -- 檢查並添加 completion_strategy 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'completion_strategy') THEN
        ALTER TABLE notifications ADD COLUMN completion_strategy TEXT NOT NULL DEFAULT 'manual';
        RAISE NOTICE 'Added completion_strategy column to notifications table';
    ELSE
        RAISE NOTICE 'Completion_strategy column already exists in notifications table';
    END IF;
    
    -- 檢查並添加 suggested_complete 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'suggested_complete') THEN
        ALTER TABLE notifications ADD COLUMN suggested_complete BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added suggested_complete column to notifications table';
    ELSE
        RAISE NOTICE 'Suggested_complete column already exists in notifications table';
    END IF;
    
    -- 檢查並添加 suggested_at 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'suggested_at') THEN
        ALTER TABLE notifications ADD COLUMN suggested_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added suggested_at column to notifications table';
    ELSE
        RAISE NOTICE 'Suggested_at column already exists in notifications table';
    END IF;
    
    -- 檢查並添加 suggestion_reason 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'suggestion_reason') THEN
        ALTER TABLE notifications ADD COLUMN suggestion_reason TEXT;
        RAISE NOTICE 'Added suggestion_reason column to notifications table';
    ELSE
        RAISE NOTICE 'Suggestion_reason column already exists in notifications table';
    END IF;
    
    -- 檢查並添加 auto_completed_at 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'auto_completed_at') THEN
        ALTER TABLE notifications ADD COLUMN auto_completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added auto_completed_at column to notifications table';
    ELSE
        RAISE NOTICE 'Auto_completed_at column already exists in notifications table';
    END IF;
END $$;

-- 第二步：檢查並添加模板表的新欄位
DO $$
BEGIN
    -- 檢查並添加 category 欄位到模板表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notification_templates' AND column_name = 'category') THEN
        ALTER TABLE notification_templates ADD COLUMN category TEXT NOT NULL DEFAULT 'informational';
        RAISE NOTICE 'Added category column to notification_templates table';
    ELSE
        RAISE NOTICE 'Category column already exists in notification_templates table';
    END IF;
    
    -- 檢查並添加 completion_strategy 欄位到模板表
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notification_templates' AND column_name = 'completion_strategy') THEN
        ALTER TABLE notification_templates ADD COLUMN completion_strategy TEXT NOT NULL DEFAULT 'manual';
        RAISE NOTICE 'Added completion_strategy column to notification_templates table';
    ELSE
        RAISE NOTICE 'Completion_strategy column already exists in notification_templates table';
    END IF;
END $$;

-- 第三步：創建或更新約束
DO $$
BEGIN
    -- 創建分類約束（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_notification_category' 
                   AND table_name = 'notifications') THEN
        ALTER TABLE notifications ADD CONSTRAINT check_notification_category
            CHECK (category IN ('informational', 'actionable'));
        RAISE NOTICE 'Added category constraint to notifications table';
    ELSE
        RAISE NOTICE 'Category constraint already exists on notifications table';
    END IF;
    
    -- 創建完成策略約束（如果不存在）
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_completion_strategy' 
                   AND table_name = 'notifications') THEN
        ALTER TABLE notifications ADD CONSTRAINT check_completion_strategy
            CHECK (completion_strategy IN ('auto', 'suggested', 'manual'));
        RAISE NOTICE 'Added completion_strategy constraint to notifications table';
    ELSE
        RAISE NOTICE 'Completion_strategy constraint already exists on notifications table';
    END IF;
    
    -- 創建模板表約束
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_template_category' 
                   AND table_name = 'notification_templates') THEN
        ALTER TABLE notification_templates ADD CONSTRAINT check_template_category
            CHECK (category IN ('informational', 'actionable'));
        RAISE NOTICE 'Added category constraint to notification_templates table';
    ELSE
        RAISE NOTICE 'Category constraint already exists on notification_templates table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_template_completion_strategy' 
                   AND table_name = 'notification_templates') THEN
        ALTER TABLE notification_templates ADD CONSTRAINT check_template_completion_strategy
            CHECK (completion_strategy IN ('auto', 'suggested', 'manual'));
        RAISE NOTICE 'Added completion_strategy constraint to notification_templates table';
    ELSE
        RAISE NOTICE 'Completion_strategy constraint already exists on notification_templates table';
    END IF;
END $$;

-- 第四步：更新狀態約束
DO $$
BEGIN
    -- 先刪除舊的狀態約束（如果存在）
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_notification_status' 
               AND table_name = 'notifications') THEN
        ALTER TABLE notifications DROP CONSTRAINT check_notification_status;
        RAISE NOTICE 'Dropped existing status constraint';
    END IF;
    
    -- 添加新的狀態約束
    ALTER TABLE notifications ADD CONSTRAINT check_notification_status
        CHECK (status IN ('unread', 'read', 'completed', 'dismissed', 'archived'));
    RAISE NOTICE 'Added updated status constraint with new statuses';
END $$;

-- 第五步：創建索引（僅在欄位存在時）
DO $$
BEGIN
    -- 檢查 category 欄位存在後創建索引
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
        RAISE NOTICE 'Created index on category column';
    END IF;
    
    -- 檢查 completion_strategy 欄位存在後創建索引
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' AND column_name = 'completion_strategy') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_completion_strategy ON notifications(completion_strategy);
        RAISE NOTICE 'Created index on completion_strategy column';
    END IF;
    
    -- 檢查 suggested_complete 欄位存在後創建索引
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' AND column_name = 'suggested_complete') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_suggested_complete ON notifications(suggested_complete) 
            WHERE suggested_complete = TRUE;
        RAISE NOTICE 'Created index on suggested_complete column';
    END IF;
    
    -- 創建複合索引
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'notifications' AND column_name = 'category') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_category_status ON notifications(category, status);
        RAISE NOTICE 'Created compound index on category and status columns';
    END IF;
END $$;

-- 第六步：初始化現有資料
DO $$
BEGIN
    -- 檢查是否有需要更新的資料
    IF EXISTS (SELECT 1 FROM notifications WHERE category IS NULL OR completion_strategy IS NULL) THEN
        RAISE NOTICE 'Updating existing notification data...';
        
        UPDATE notifications SET 
            category = CASE 
                WHEN type IN (
                    'order_new', 'order_high_value', 'order_payment_overdue', 'order_payment_failed', 'order_shipping_delayed',
                    'inventory_low_stock', 'inventory_out_of_stock', 'inventory_overstock',
                    'customer_service_new_request', 'customer_service_urgent', 'customer_service_overdue', 'customer_vip_issue',
                    'finance_payment_anomaly', 'finance_refund_request',
                    'analytics_customer_churn_risk',
                    'marketing_campaign_poor_performance',
                    'system_update_required', 'system_error_alert'
                ) THEN 'actionable'
                ELSE 'informational'
            END,
            completion_strategy = CASE
                -- 自動完成
                WHEN type IN ('system_backup_completed', 'inventory_out_of_stock', 'finance_refund_completed', 'order_cancelled')
                    THEN 'auto'
                -- 智能建議
                WHEN type IN (
                    'order_new', 'order_high_value', 'order_shipping_delayed',
                    'inventory_low_stock', 'inventory_overstock',
                    'customer_service_new_request', 'customer_service_overdue',
                    'finance_payment_anomaly', 'finance_refund_request',
                    'analytics_customer_churn_risk',
                    'marketing_campaign_poor_performance',
                    'system_update_required', 'system_error_alert'
                ) THEN 'suggested'
                -- 純手動
                ELSE 'manual'
            END
        WHERE category IS NULL OR completion_strategy IS NULL;
        
        RAISE NOTICE 'Updated existing notification data';
    ELSE
        RAISE NOTICE 'No existing data needs updating';
    END IF;
END $$;

-- 第七步：初始化模板資料
DO $$
BEGIN
    -- 檢查是否有需要更新的模板資料
    IF EXISTS (SELECT 1 FROM notification_templates WHERE category IS NULL OR completion_strategy IS NULL) THEN
        RAISE NOTICE 'Updating existing template data...';
        
        UPDATE notification_templates SET 
            category = CASE 
                WHEN type IN (
                    'order_new', 'order_high_value', 'order_payment_overdue', 'order_payment_failed', 'order_shipping_delayed',
                    'inventory_low_stock', 'inventory_out_of_stock', 'inventory_overstock',
                    'customer_service_new_request', 'customer_service_urgent', 'customer_service_overdue', 'customer_vip_issue',
                    'finance_payment_anomaly', 'finance_refund_request',
                    'analytics_customer_churn_risk',
                    'marketing_campaign_poor_performance',
                    'system_update_required', 'system_error_alert'
                ) THEN 'actionable'
                ELSE 'informational'
            END,
            completion_strategy = CASE
                -- 自動完成
                WHEN type IN ('system_backup_completed', 'inventory_out_of_stock', 'finance_refund_completed', 'order_cancelled')
                    THEN 'auto'
                -- 智能建議
                WHEN type IN (
                    'order_new', 'order_high_value', 'order_shipping_delayed',
                    'inventory_low_stock', 'inventory_overstock',
                    'customer_service_new_request', 'customer_service_overdue',
                    'finance_payment_anomaly', 'finance_refund_request',
                    'analytics_customer_churn_risk',
                    'marketing_campaign_poor_performance',
                    'system_update_required', 'system_error_alert'
                ) THEN 'suggested'
                -- 純手動
                ELSE 'manual'
            END
        WHERE category IS NULL OR completion_strategy IS NULL;
        
        RAISE NOTICE 'Updated existing template data';
    ELSE
        RAISE NOTICE 'No existing template data needs updating';
    END IF;
END $$;

-- 第八步：創建統計檢視
CREATE OR REPLACE VIEW notification_category_stats AS
SELECT 
    user_id,
    -- 任務型統計
    SUM(CASE WHEN category = 'actionable' AND status IN ('unread', 'read') THEN 1 ELSE 0 END) as actionable_pending,
    SUM(CASE WHEN category = 'actionable' AND status = 'completed' THEN 1 ELSE 0 END) as actionable_completed,
    SUM(CASE WHEN category = 'actionable' AND suggested_complete = TRUE THEN 1 ELSE 0 END) as actionable_suggested,
    
    -- 資訊型統計
    SUM(CASE WHEN category = 'informational' AND status = 'unread' THEN 1 ELSE 0 END) as informational_unread,
    SUM(CASE WHEN category = 'informational' AND status = 'read' THEN 1 ELSE 0 END) as informational_read,
    SUM(CASE WHEN category = 'informational' AND status = 'dismissed' THEN 1 ELSE 0 END) as informational_dismissed,
    
    -- 總智能建議數
    SUM(CASE WHEN suggested_complete = TRUE THEN 1 ELSE 0 END) as total_suggestions,
    
    -- 總計
    COUNT(*) as total_notifications
FROM notifications
WHERE status != 'archived'
GROUP BY user_id;

-- 創建完成策略統計檢視
CREATE OR REPLACE VIEW notification_completion_strategy_stats AS
SELECT 
    completion_strategy,
    category,
    COUNT(*) as count,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
    SUM(CASE WHEN suggested_complete = TRUE THEN 1 ELSE 0 END) as suggested_count,
    ROUND(
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate
FROM notifications
WHERE status != 'archived'
GROUP BY completion_strategy, category
ORDER BY completion_strategy, category;

-- 添加註釋
COMMENT ON COLUMN notifications.category IS '通知分類：informational（資訊推送）或 actionable（任務管理）';
COMMENT ON COLUMN notifications.completion_strategy IS '完成策略：auto（自動）、suggested（智能建議）或 manual（手動）';
COMMENT ON COLUMN notifications.suggested_complete IS '是否有智能完成建議';
COMMENT ON COLUMN notifications.suggested_at IS '建議完成的時間';
COMMENT ON COLUMN notifications.suggestion_reason IS '建議完成的原因';
COMMENT ON COLUMN notifications.auto_completed_at IS '自動完成的時間';

COMMENT ON VIEW notification_category_stats IS '按分類統計用戶通知數量';
COMMENT ON VIEW notification_completion_strategy_stats IS '按完成策略統計通知完成率';

-- 顯示完成訊息
SELECT 'Notification categories schema update completed successfully!' as message;