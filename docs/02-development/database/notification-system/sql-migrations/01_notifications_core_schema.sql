-- 通知系統核心架構 SQL
-- 第一階段：建立核心通知表格

-- 1. 通知主表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 通知類型枚舉
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status TEXT NOT NULL DEFAULT 'unread', -- 'unread', 'read', 'archived'
    channels TEXT[] DEFAULT '{in_app}', -- 發送管道陣列
    metadata JSONB DEFAULT '{}', -- 額外資料
    related_entity_type TEXT, -- 關聯實體類型 'order', 'product', 'customer'
    related_entity_id UUID, -- 關聯實體 ID
    action_url TEXT, -- 操作連結
    expires_at TIMESTAMP WITH TIME ZONE, -- 過期時間
    read_at TIMESTAMP WITH TIME ZONE, -- 已讀時間
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 通知模板表
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL UNIQUE, -- 通知類型
    title_template TEXT NOT NULL, -- 標題模板
    message_template TEXT NOT NULL, -- 訊息模板
    default_priority TEXT NOT NULL DEFAULT 'medium',
    default_channels TEXT[] DEFAULT '{in_app}',
    is_active BOOLEAN DEFAULT true,
    metadata_schema JSONB DEFAULT '{}', -- 元資料結構定義
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用戶通知偏好設定表
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL, -- 通知類型
    channels TEXT[] DEFAULT '{in_app}', -- 偏好的發送管道
    is_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME, -- 靜音時段開始
    quiet_hours_end TIME, -- 靜音時段結束
    frequency_limit INTEGER DEFAULT 10, -- 每小時最多通知次數
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);

-- 4. 通知發送記錄表
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel TEXT NOT NULL, -- 發送管道
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
    error_message TEXT, -- 錯誤訊息
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 建立效能優化索引
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- 通知偏好索引
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_type ON notification_preferences(notification_type);

-- 通知記錄索引
CREATE INDEX idx_notification_logs_notification_id ON notification_logs(notification_id);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- 6. 觸發器和函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為通知表格添加更新時間觸發器
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 行級安全性 (RLS) 政策
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- 通知 RLS 政策
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications"
    ON notifications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );

-- 通知偏好 RLS 政策
CREATE POLICY "Users can manage their own notification preferences"
    ON notification_preferences FOR ALL
    USING (user_id = auth.uid());

-- 通知記錄 RLS 政策（僅管理員可查看）
CREATE POLICY "Admins can view notification logs"
    ON notification_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('admin', 'super_admin')
        )
    );