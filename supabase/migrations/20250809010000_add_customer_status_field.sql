-- ========================================
-- Add Customer Status Field
-- 新增 customers.status 欄位，修復客戶觸發器問題
-- ========================================

-- 新增 status 欄位
ALTER TABLE customers 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

-- 新增狀態約束 (簡化為兩個核心狀態)
ALTER TABLE customers 
ADD CONSTRAINT check_customer_status 
CHECK (status IN ('active', 'inactive'));

-- 建立狀態索引 (提升查詢效能)
CREATE INDEX idx_customers_status ON customers(status);

-- 根據現有軟刪除邏輯初始化狀態
UPDATE customers SET status = 
  CASE 
    WHEN deleted_at IS NOT NULL THEN 'inactive'  -- 已軟刪除的設為停用
    ELSE 'active'                                 -- 其他都是活躍
  END;

-- 新增客戶停用/啟用通知模板
INSERT INTO notification_templates (
  type, title_template, message_template,
  default_priority, default_channels,
  required_entity_type, category, completion_strategy,
  is_active
) VALUES 
(
  'customer_deactivated',
  '客戶帳戶停用',
  '客戶 "{customer_name}" 帳戶已停用',
  'medium',
  ARRAY['in_app', 'email'],
  'customer',
  'actionable',
  'manual',
  true
),
(
  'customer_reactivated', 
  '客戶帳戶重新啟用',
  '客戶 "{customer_name}" 帳戶已重新啟用',
  'low',
  ARRAY['in_app'],
  'customer',
  'informational',
  'auto',
  true
)
ON CONFLICT (type) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  default_priority = EXCLUDED.default_priority,
  default_channels = EXCLUDED.default_channels,
  required_entity_type = EXCLUDED.required_entity_type,
  category = EXCLUDED.category,
  completion_strategy = EXCLUDED.completion_strategy,
  is_active = EXCLUDED.is_active;

-- 新增對應的路由規則
INSERT INTO notification_routing_rules (
  notification_type, target_type, target_criteria,
  send_to_user, is_active
) VALUES 
(
  'customer_deactivated',
  'role',
  '{"roles": ["customer_service", "admin"]}',
  FALSE,
  TRUE
),
(
  'customer_reactivated',
  'role', 
  '{"roles": ["customer_service"]}',
  FALSE,
  TRUE
)
ON CONFLICT (notification_type) DO UPDATE SET
  target_type = EXCLUDED.target_type,
  target_criteria = EXCLUDED.target_criteria,
  send_to_user = EXCLUDED.send_to_user,
  is_active = EXCLUDED.is_active;

-- 註解說明
COMMENT ON COLUMN customers.status IS 'Customer account status: active (normal operation) or inactive (deactivated by admin)';
COMMENT ON CONSTRAINT check_customer_status ON customers IS 'Ensures customer status is either active or inactive';
COMMENT ON INDEX idx_customers_status IS 'Index for efficient customer status queries';

/*
Migration Purpose:
- 修復 notify_customer_service_events() 函數中的 status 欄位錯誤
- 新增客戶帳戶狀態管理功能
- 支援客戶停用/重新啟用通知

Status Values:
- 'active': 正常運作的客戶帳戶 (預設)
- 'inactive': 被管理員停用的客戶帳戶

Related:
- 修復客戶觸發器 (trigger_customer_suggestions, trigger_customer_service_notifications)
- 支援智能建議系統完整運作
*/