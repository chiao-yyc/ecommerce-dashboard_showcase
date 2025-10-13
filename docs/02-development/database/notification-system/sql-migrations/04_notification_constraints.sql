-- 通知系統約束機制 SQL
-- 建立 NotificationType 與 RelatedEntityType 的資料庫層約束

-- 1. 為 notification_templates 表新增必要的約束欄位
ALTER TABLE notification_templates 
ADD COLUMN IF NOT EXISTS required_entity_type TEXT NOT NULL DEFAULT 'user';

-- 2. 建立約束檢查函數
CREATE OR REPLACE FUNCTION validate_notification_entity_constraint()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查是否符合模板要求的 entity type
  IF NOT EXISTS (
    SELECT 1 FROM notification_templates nt 
    WHERE nt.type = NEW.type 
    AND nt.required_entity_type = NEW.related_entity_type
  ) THEN
    RAISE EXCEPTION 'Invalid entity type "%" for notification type "%". Expected: "%"', 
      NEW.related_entity_type, 
      NEW.type, 
      (SELECT required_entity_type FROM notification_templates WHERE type = NEW.type LIMIT 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 在 notifications 表上建立觸發器
DROP TRIGGER IF EXISTS check_notification_entity_constraint ON notifications;
CREATE TRIGGER check_notification_entity_constraint
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION validate_notification_entity_constraint();

-- 4. 更新現有模板資料設定正確的 required_entity_type
-- 訂單相關 → 'order'
UPDATE notification_templates 
SET required_entity_type = 'order' 
WHERE type IN (
  'order_new', 'order_high_value', 'order_payment_overdue', 
  'order_payment_failed', 'order_cancelled', 'order_shipping_delayed'
);

-- 庫存相關 → 'product'
UPDATE notification_templates 
SET required_entity_type = 'product' 
WHERE type IN (
  'inventory_low_stock', 'inventory_out_of_stock', 'inventory_overstock'
);

-- 客戶服務相關 → 'conversation' (包括 VIP 問題)
UPDATE notification_templates 
SET required_entity_type = 'conversation' 
WHERE type IN (
  'customer_service_new_request', 'customer_service_urgent', 
  'customer_service_overdue', 'customer_vip_issue'
);

-- 財務金流相關 → 'order'
UPDATE notification_templates 
SET required_entity_type = 'order' 
WHERE type IN (
  'finance_large_transaction', 'finance_payment_anomaly', 
  'finance_refund_request', 'finance_refund_completed'
);

-- 系統安全相關 → 'user'
UPDATE notification_templates 
SET required_entity_type = 'user' 
WHERE type IN (
  'security_unusual_login', 'security_permission_changed', 
  'security_password_reminder', 'security_multiple_login_failures'
);

-- 營運分析相關 → 根據分析對象
UPDATE notification_templates SET required_entity_type = 'order' WHERE type = 'analytics_sales_target_reached';
UPDATE notification_templates SET required_entity_type = 'order' WHERE type = 'analytics_performance_drop';
UPDATE notification_templates SET required_entity_type = 'product' WHERE type = 'analytics_hot_product';
UPDATE notification_templates SET required_entity_type = 'customer' WHERE type = 'analytics_customer_churn_risk';

-- 行銷活動相關 → 'user' (暫時，可能需要新的 'campaign' 實體類型)
UPDATE notification_templates 
SET required_entity_type = 'user' 
WHERE type IN (
  'marketing_campaign_start', 'marketing_campaign_end', 
  'marketing_campaign_poor_performance'
);

-- 系統維護相關 → 'user' (暫時，可能需要新的 'system' 實體類型)
UPDATE notification_templates 
SET required_entity_type = 'user' 
WHERE type IN (
  'system_backup_completed', 'system_update_required', 
  'system_health_check', 'system_error_alert'
);

-- 5. 建立索引以提升約束檢查效能
CREATE INDEX IF NOT EXISTS idx_notification_templates_type_entity 
ON notification_templates(type, required_entity_type);

-- 6. 建立檢查函數來驗證系統完整性
CREATE OR REPLACE FUNCTION check_notification_constraints_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- 檢查是否有通知沒有對應的模板
  RETURN QUERY
  SELECT 
    'Missing Templates'::TEXT as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    CASE WHEN COUNT(*) = 0 
         THEN 'All notification types have templates'
         ELSE 'Notification types without templates: ' || string_agg(DISTINCT type, ', ')
    END as details
  FROM notifications n
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_templates nt WHERE nt.type = n.type
  );

  -- 檢查是否有模板沒有設定 required_entity_type
  RETURN QUERY
  SELECT 
    'Missing Entity Types'::TEXT as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    CASE WHEN COUNT(*) = 0 
         THEN 'All templates have required_entity_type'
         ELSE 'Templates without entity type: ' || string_agg(type, ', ')
    END as details
  FROM notification_templates
  WHERE required_entity_type IS NULL OR required_entity_type = '';

  -- 檢查是否有通知違反約束
  RETURN QUERY
  SELECT 
    'Constraint Violations'::TEXT as check_name,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    CASE WHEN COUNT(*) = 0 
         THEN 'No constraint violations found'
         ELSE COUNT(*)::TEXT || ' notifications violate constraints'
    END as details
  FROM notifications n
  LEFT JOIN notification_templates nt ON n.type = nt.type
  WHERE nt.required_entity_type IS NOT NULL 
    AND n.related_entity_type != nt.required_entity_type;
END;
$$ LANGUAGE plpgsql;

-- 7. 建立便利的檢視來查看約束關係
CREATE OR REPLACE VIEW notification_entity_constraints AS
SELECT 
  nt.type as notification_type,
  nt.required_entity_type,
  nt.title_template,
  nt.default_priority,
  nt.is_active,
  COUNT(n.id) as usage_count
FROM notification_templates nt
LEFT JOIN notifications n ON nt.type = n.type
GROUP BY nt.id, nt.type, nt.required_entity_type, nt.title_template, nt.default_priority, nt.is_active
ORDER BY nt.type;

-- 執行完整性檢查
SELECT * FROM check_notification_constraints_integrity();