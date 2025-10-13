-- =====================================================
-- 自動模板屬性繼承系統 (安全性增強)
-- =====================================================

-- 創建自動繼承模板屬性的觸發器函數
CREATE OR REPLACE FUNCTION auto_inherit_template_properties()
RETURNS TRIGGER AS $$
DECLARE
  template_record RECORD;
BEGIN
  -- 查找對應的模板
  SELECT 
    category, 
    completion_strategy, 
    required_entity_type,
    default_priority,
    default_channels
  INTO template_record
  FROM notification_templates nt
  WHERE nt.type = NEW.type AND nt.is_active = TRUE
  LIMIT 1;
  
  -- 如果找到模板，自動繼承屬性
  IF FOUND THEN
    -- 強制從模板繼承 category (防止前端竄改)
    NEW.category := template_record.category;
    
    -- 強制從模板繼承 completion_strategy (防止前端竄改)
    NEW.completion_strategy := template_record.completion_strategy;
    
    -- 如果沒有提供 related_entity_type，從模板繼承
    IF NEW.related_entity_type IS NULL THEN
      NEW.related_entity_type := template_record.required_entity_type;
    END IF;
    
    -- 如果沒有提供 priority，使用模板預設值
    IF NEW.priority IS NULL OR NEW.priority = '' THEN
      NEW.priority := template_record.default_priority;
    END IF;
    
    -- 如果沒有提供 channels，使用模板預設值
    IF NEW.channels IS NULL OR array_length(NEW.channels, 1) IS NULL THEN
      NEW.channels := template_record.default_channels;
    END IF;
    
    RAISE NOTICE 'Auto-inherited template properties for type "%": category=%, completion_strategy=%, entity_type=%', 
      NEW.type, NEW.category, NEW.completion_strategy, NEW.related_entity_type;
  ELSE
    -- 如果沒有找到模板，使用預設值
    NEW.category := COALESCE(NEW.category, 'informational');
    NEW.completion_strategy := COALESCE(NEW.completion_strategy, 'manual');
    NEW.priority := COALESCE(NEW.priority, 'medium');
    NEW.channels := COALESCE(NEW.channels, ARRAY['in_app']);
    
    RAISE WARNING 'No template found for notification type "%", using default values', NEW.type;
  END IF;
  
  -- 確保必要欄位不為空
  NEW.status := COALESCE(NEW.status, 'unread');
  NEW.suggested_complete := COALESCE(NEW.suggested_complete, FALSE);
  NEW.is_personal := COALESCE(NEW.is_personal, TRUE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除舊的觸發器（如果存在）
DROP TRIGGER IF EXISTS auto_inherit_template_properties_trigger ON notifications;

-- 創建新的觸發器，在插入和更新前執行
CREATE TRIGGER auto_inherit_template_properties_trigger
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_inherit_template_properties();

-- 為了確保觸發器順序正確，重新創建約束驗證觸發器
DROP TRIGGER IF EXISTS check_notification_entity_constraint ON notifications;
CREATE TRIGGER check_notification_entity_constraint
  AFTER INSERT OR UPDATE ON notifications  -- 改為 AFTER，在屬性繼承之後執行
  FOR EACH ROW
  EXECUTE FUNCTION validate_notification_entity_constraint();

-- 創建一個測試函數來驗證觸發器工作
CREATE OR REPLACE FUNCTION test_template_inheritance()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
) AS $$
DECLARE
  test_user_id UUID;
  test_notification_id UUID;
  notification_record RECORD;
BEGIN
  -- 選擇一個測試用戶
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  -- 測試 1: security_alert 應該繼承 actionable
  RETURN QUERY
  SELECT 
    'Security Alert Inheritance'::TEXT as test_name,
    'Starting'::TEXT as result,
    'Testing security_alert notification creation'::TEXT as details;
  
  -- 插入測試通知（不提供 category 和 completion_strategy）
  INSERT INTO notifications (
    user_id, type, title, message, priority
  ) VALUES (
    test_user_id, 'security_alert', 'Test Security Alert', 'This is a test', 'urgent'
  ) RETURNING id INTO test_notification_id;
  
  -- 檢查結果
  SELECT * INTO notification_record
  FROM notifications 
  WHERE id = test_notification_id;
  
  RETURN QUERY
  SELECT 
    'Security Alert Result'::TEXT as test_name,
    CASE 
      WHEN notification_record.category = 'actionable' THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT as result,
    format('Category: %s, Strategy: %s', notification_record.category, notification_record.completion_strategy)::TEXT as details;
  
  -- 清理測試資料
  DELETE FROM notifications WHERE id = test_notification_id;
  
  -- 測試 2: 不存在的模板類型
  RETURN QUERY
  SELECT 
    'Unknown Type Test'::TEXT as test_name,
    'Starting'::TEXT as result,
    'Testing unknown notification type'::TEXT as details;
  
  INSERT INTO notifications (
    user_id, type, title, message
  ) VALUES (
    test_user_id, 'unknown_type', 'Test Unknown', 'This is a test'
  ) RETURNING id INTO test_notification_id;
  
  SELECT * INTO notification_record
  FROM notifications 
  WHERE id = test_notification_id;
  
  RETURN QUERY
  SELECT 
    'Unknown Type Result'::TEXT as test_name,
    CASE 
      WHEN notification_record.category = 'informational' AND notification_record.completion_strategy = 'manual' THEN 'PASS'
      ELSE 'FAIL'
    END::TEXT as result,
    format('Category: %s, Strategy: %s', notification_record.category, notification_record.completion_strategy)::TEXT as details;
  
  -- 清理測試資料
  DELETE FROM notifications WHERE id = test_notification_id;
  
END;
$$ LANGUAGE plpgsql;

-- 顯示完成訊息
SELECT 'Auto template inheritance system created successfully!' as message;

-- 可選：運行測試函數（註解掉，需要時可以取消註解）
-- SELECT * FROM test_template_inheritance();