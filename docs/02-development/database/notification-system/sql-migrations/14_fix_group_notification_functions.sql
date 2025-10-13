-- =====================================================
-- 修復群組通知函數以正確繼承模板屬性
-- =====================================================

-- 更新 create_group_notification 函數，移除硬編碼的 category 和 completion_strategy
CREATE OR REPLACE FUNCTION create_group_notification(
  p_template_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_target_type notification_target_type,
  p_target_criteria JSONB,
  p_priority TEXT DEFAULT 'medium',
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
    -- 注意：category 和 completion_strategy 現在由 trigger 自動從模板繼承
    INSERT INTO notifications (
      user_id, type, title, message, priority,
      status, channels, metadata, related_entity_type, related_entity_id, 
      action_url, distribution_id, is_personal, created_at
    ) VALUES (
      user_record.user_id, p_template_type, p_title, p_message, p_priority,
      'unread', ARRAY['in_app'], 
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

-- 更新快捷函數，移除硬編碼的 category 和 completion_strategy
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
    p_priority,
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
    p_priority,
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
    p_priority,
    NULL, NULL, NULL, NULL
  );
END;
$$ LANGUAGE plpgsql;

-- 創建測試函數來驗證群組通知的屬性繼承
CREATE OR REPLACE FUNCTION test_group_notification_inheritance()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
) AS $$
DECLARE
  test_distribution_id UUID;
  notification_record RECORD;
  notification_count INTEGER;
BEGIN
  -- 測試群組通知是否正確繼承 security_alert 的 actionable 屬性
  RETURN QUERY
  SELECT 
    'Group Notification Test'::TEXT as test_name,
    'Starting'::TEXT as result,
    'Testing security_alert group notification'::TEXT as details;
  
  -- 發送群組安全警報通知
  SELECT notify_broadcast(
    'security_alert', 
    'Test Group Security Alert', 
    'This is a test group security alert',
    'urgent'
  ) INTO test_distribution_id;
  
  -- 檢查創建的通知數量和屬性
  SELECT COUNT(*), MIN(category), MIN(completion_strategy)
  INTO notification_count, notification_record.category, notification_record.completion_strategy
  FROM notifications 
  WHERE distribution_id = test_distribution_id;
  
  RETURN QUERY
  SELECT 
    'Group Notification Result'::TEXT as test_name,
    CASE 
      WHEN notification_count > 0 AND notification_record.category = 'actionable' THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT as result,
    format('Created %s notifications, Category: %s, Strategy: %s', 
           notification_count, notification_record.category, notification_record.completion_strategy)::TEXT as details;
  
  -- 清理測試資料
  DELETE FROM notifications WHERE distribution_id = test_distribution_id;
  DELETE FROM notification_recipients WHERE distribution_id = test_distribution_id;
  DELETE FROM notification_distributions WHERE id = test_distribution_id;
  
END;
$$ LANGUAGE plpgsql;

-- 顯示完成訊息
SELECT 'Group notification functions updated successfully!' as message;

-- 可選：運行測試函數（註解掉，需要時可以取消註解）
-- SELECT * FROM test_group_notification_inheritance();