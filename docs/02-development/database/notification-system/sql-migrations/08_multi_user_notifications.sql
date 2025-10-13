-- =====================================================
-- 群組通知系統約束問題修正 (版本4) - 完全重建函數
-- =====================================================

-- 1. 先修改 required_entity_type 欄位，允許 NULL 值
ALTER TABLE notification_templates 
ALTER COLUMN required_entity_type DROP NOT NULL;

-- 2. 為常用的群組通知類型新增模板
INSERT INTO notification_templates (
  type, title_template, message_template, 
  default_priority, default_channels, 
  required_entity_type, is_active,
  category, completion_strategy
) VALUES 
-- 系統維護通知 (無需關聯實體)
('system_maintenance', '系統維護通知', '系統維護通知：{message}', 'high', ARRAY['in_app'], NULL, TRUE, 'informational', 'manual'),
-- 公司公告 (無需關聯實體)  
('company_announcement', '公司公告', '公司公告：{message}', 'medium', ARRAY['in_app'], NULL, TRUE, 'informational', 'manual'),
-- 專案更新 (無需關聯實體)
('project_update', '專案更新', '專案更新：{message}', 'medium', ARRAY['in_app'], NULL, TRUE, 'informational', 'manual'),
-- 安全警報 (關聯到用戶)
('security_alert', '安全警報', '安全警報：{message}', 'urgent', ARRAY['in_app', 'email'], 'user', TRUE, 'actionable', 'manual'),
-- 政策更新 (無需關聯實體)
('policy_update', '政策更新', '政策更新：{message}', 'medium', ARRAY['in_app'], NULL, TRUE, 'informational', 'manual')
ON CONFLICT (type) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  default_priority = EXCLUDED.default_priority,
  default_channels = EXCLUDED.default_channels,
  required_entity_type = EXCLUDED.required_entity_type,
  category = EXCLUDED.category,
  completion_strategy = EXCLUDED.completion_strategy;

-- 3. 修正約束驗證函數，允許 NULL 的 related_entity_type
CREATE OR REPLACE FUNCTION validate_notification_entity_constraint()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果模板不存在，跳過驗證（允許動態通知類型）
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = NEW.type) THEN
    RETURN NEW;
  END IF;
  
  -- 檢查是否符合模板要求的 entity type
  IF NOT EXISTS (
    SELECT 1 FROM notification_templates nt 
    WHERE nt.type = NEW.type 
    AND (
      -- 模板要求特定實體類型，且通知提供了正確的實體類型
      (nt.required_entity_type IS NOT NULL AND nt.required_entity_type = NEW.related_entity_type) OR
      -- 模板允許 NULL 實體類型，且通知也是 NULL
      (nt.required_entity_type IS NULL AND NEW.related_entity_type IS NULL)
    )
  ) THEN
    RAISE EXCEPTION 'Invalid entity type "%" for notification type "%". Expected: "%"', 
      COALESCE(NEW.related_entity_type, 'NULL'), 
      NEW.type, 
      COALESCE((SELECT required_entity_type FROM notification_templates WHERE type = NEW.type LIMIT 1), 'NULL');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 先刪除舊的函數，避免函數簽名衝突
DROP FUNCTION IF EXISTS create_group_notification(text,text,text,notification_target_type,jsonb,text,text,text,jsonb,text,text,text);
DROP FUNCTION IF EXISTS notify_role(text,text,text,text,text);
DROP FUNCTION IF EXISTS notify_broadcast(text,text,text,text);
DROP FUNCTION IF EXISTS notify_custom_group(uuid[],text,text,text,text);

-- 5. 重新創建 create_group_notification 函數，使用正確的 UUID 類型
CREATE OR REPLACE FUNCTION create_group_notification(
  p_template_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_target_type notification_target_type,
  p_target_criteria JSONB,
  p_priority TEXT DEFAULT 'medium',
  p_category TEXT DEFAULT 'informational',
  p_completion_strategy TEXT DEFAULT 'manual',
  p_metadata JSONB DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  distribution_id UUID;
  template_id UUID;
  user_record RECORD;
  notification_id UUID;
  recipient_count INTEGER := 0;
  template_required_entity_type TEXT;
BEGIN
  -- 查找模板 ID 和要求的實體類型
  SELECT id, required_entity_type INTO template_id, template_required_entity_type
  FROM notification_templates 
  WHERE type = p_template_type AND is_active = TRUE
  LIMIT 1;
  
  -- 創建分發記錄
  INSERT INTO notification_distributions (
    notification_template_id, target_type, target_criteria, created_at
  ) VALUES (
    template_id, p_target_type, p_target_criteria, NOW()
  ) RETURNING id INTO distribution_id;
  
  -- 根據目標類型獲取用戶列表
  FOR user_record IN 
    SELECT DISTINCT u.id as user_id
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE 
      CASE 
        WHEN p_target_type = 'role' THEN 
          r.name = ANY(SELECT jsonb_array_elements_text(p_target_criteria->'roles'))
        WHEN p_target_type = 'broadcast' THEN 
          TRUE -- 所有用戶
        WHEN p_target_type = 'custom' THEN
          u.id = ANY(SELECT (jsonb_array_elements_text(p_target_criteria->'user_ids'))::UUID)
        ELSE FALSE
      END
      AND u.deleted_at IS NULL
  LOOP
    -- 為每個用戶創建個人通知
    INSERT INTO notifications (
      user_id, type, title, message, priority, category, completion_strategy,
      status, channels, metadata, related_entity_type, related_entity_id, 
      action_url, distribution_id, is_personal, created_at
    ) VALUES (
      user_record.user_id, p_template_type, p_title, p_message, p_priority,
      p_category, p_completion_strategy, 'unread', ARRAY['in_app'], 
      p_metadata, 
      COALESCE(p_related_entity_type, template_required_entity_type),
      p_related_entity_id,
      p_action_url,
      distribution_id, FALSE, NOW()
    ) RETURNING id INTO notification_id;
    
    -- 記錄接收者
    INSERT INTO notification_recipients (
      distribution_id, user_id, notification_id, status, delivered_at
    ) VALUES (
      distribution_id, user_record.user_id, notification_id, 'delivered', NOW()
    );
    
    recipient_count := recipient_count + 1;
  END LOOP;
  
  -- 記錄分發統計
  UPDATE notification_distributions 
  SET target_criteria = target_criteria || jsonb_build_object('recipient_count', recipient_count)
  WHERE id = distribution_id;
  
  RETURN distribution_id;
END;
$$ LANGUAGE plpgsql;

-- 6. 重新創建快捷函數
CREATE OR REPLACE FUNCTION notify_role(
  p_role_name TEXT,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium'
) RETURNS UUID AS $$
BEGIN
  RETURN create_group_notification(
    p_type, p_title, p_message, 'role'::notification_target_type,
    jsonb_build_object('roles', jsonb_build_array(p_role_name)),
    p_priority, 'informational', 'manual',
    NULL, NULL, NULL, NULL
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_broadcast(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium'
) RETURNS UUID AS $$
BEGIN
  RETURN create_group_notification(
    p_type, p_title, p_message, 'broadcast'::notification_target_type,
    jsonb_build_object('scope', 'all_users'),
    p_priority, 'informational', 'manual',
    NULL, NULL, NULL, NULL
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_custom_group(
  p_user_ids UUID[],
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_priority TEXT DEFAULT 'medium'
) RETURNS UUID AS $$
BEGIN
  RETURN create_group_notification(
    p_type, p_title, p_message, 'custom'::notification_target_type,
    jsonb_build_object('user_ids', to_jsonb(p_user_ids)),
    p_priority, 'informational', 'manual',
    NULL, NULL, NULL, NULL
  );
END;
$$ LANGUAGE plpgsql;

-- 7. 測試新的功能
SELECT 'Group notification constraints fixed (v4) - Functions rebuilt!' as message;

-- 測試範例（註解掉，執行時可以取消註解測試）
-- SELECT notify_role('admin', 'system_maintenance', '系統維護通知', '系統將於今晚進行維護，請提前保存工作。', 'high');
-- SELECT notify_broadcast('company_announcement', '公司公告', '歡迎新同事加入我們的團隊！', 'medium');