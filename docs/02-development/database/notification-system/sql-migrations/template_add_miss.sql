-- ================================================================
-- 通知模板基礎優化腳本 (Phase 1)
-- 僅包含現階段可實現的模板和功能
-- ================================================================

-- 1. 新增備註欄位
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- 2. 新增常用模板標記欄位
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS is_frequently_used BOOLEAN DEFAULT FALSE;

-- 3. 新增模板使用統計欄位
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- 4. 新增最後使用時間欄位
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP;

-- ================================================================
-- Phase 1: 新增可立即實現的模板 (3個)
-- ================================================================

INSERT INTO notification_templates (
  id, type, title_template, message_template,
  default_priority, default_channels, required_entity_type,
  category, completion_strategy, is_active, completion_notes, is_frequently_used
) VALUES

-- 庫存管理 - 有完整觸發器支援
('11111111-1111-1111-1111-111111111001', 'inventory_overstock', '庫存過多警告', '商品 {product_name} 庫存過多，目前庫存：{current_stock}', 'medium', ARRAY['in_app'], 'product', 'informational', 'suggested', true, '庫存調整時建議完成 (notify_inventory_events)', false),

-- 客戶服務 - 有完整觸發器支援  
('11111111-1111-1111-1111-111111111002', 'customer_service_overdue', '客服案件逾期', '客服案件 #{ticket_id} 已逾期 {overdue_hours} 小時', 'high', ARRAY['in_app', 'email'], 'conversation', 'actionable', 'suggested', true, '案件回覆時建議完成 (notify_customer_service_events)', true),

-- 訂單管理 - 有基礎觸發器支援
('11111111-1111-1111-1111-111111111003', 'order_cancelled', '訂單取消通知', '訂單 #{order_number} 已取消', 'medium', ARRAY['in_app'], 'order', 'informational', 'auto', true, '訂單取消時自動完成 (notify_order_events)', false);

-- ================================================================
-- 更新現有模板的備註和策略
-- ================================================================

-- 更新現有模板的completion_strategy和備註
UPDATE notification_templates
SET
  completion_strategy = 'auto',
  completion_notes = '庫存補充時自動完成 (notify_inventory_events)'
WHERE type = 'inventory_out_of_stock';

UPDATE notification_templates
SET
  completion_strategy = 'suggested',
  completion_notes = '庫存補充時建議完成 (notify_inventory_events)',
  is_frequently_used = true
WHERE type = 'inventory_low_stock';

UPDATE notification_templates
SET
  completion_strategy = 'suggested',
  completion_notes = '訂單狀態變更時建議完成 (notify_order_events)',
  is_frequently_used = true
WHERE type = 'order_new';

UPDATE notification_templates
SET
  completion_strategy = 'suggested',
  completion_notes = '客服回覆時建議完成 (notify_customer_service_events)',
  is_frequently_used = true
WHERE type = 'customer_service_new_request';

-- 更新現有模板的備註
UPDATE notification_templates
SET
  completion_notes = 'VIP客戶需專人處理，確認問題解決',
  is_frequently_used = true
WHERE type = 'customer_service_urgent';

UPDATE notification_templates
SET
  completion_notes = '高價值訂單需人工審核流程',
  is_frequently_used = true
WHERE type = 'order_high_value';

UPDATE notification_templates
SET
  completion_notes = '安全相關變更需手動確認'
WHERE type = 'security_permission_changed';

UPDATE notification_templates
SET
  completion_notes = '安全警報需人工調查處理'
WHERE type = 'security_alert';

-- ================================================================
-- 建立模板使用統計更新觸發器
-- ================================================================

CREATE OR REPLACE FUNCTION update_template_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新模板使用次數和最後使用時間
  UPDATE notification_templates
  SET
    usage_count = usage_count + 1,
    last_used_at = NEW.created_at
  WHERE type = NEW.type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
DROP TRIGGER IF EXISTS template_usage_stats_trigger ON notifications;
CREATE TRIGGER template_usage_stats_trigger
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_template_usage_stats();

-- ================================================================
-- 常用模板查詢視圖
-- ================================================================

CREATE OR REPLACE VIEW frequently_used_templates AS
SELECT
  t.*,
  COALESCE(t.usage_count, 0) as actual_usage_count,
  CASE
    WHEN t.is_frequently_used THEN 100
    ELSE 0
  END +
  CASE
    WHEN t.last_used_at > NOW() - INTERVAL '7 days' THEN 50
    WHEN t.last_used_at > NOW() - INTERVAL '30 days' THEN 20
    ELSE 0
  END +
  LEAST(COALESCE(t.usage_count, 0) * 2, 50) as priority_score
FROM notification_templates t
WHERE t.is_active = true
ORDER BY priority_score DESC, t.last_used_at DESC NULLS LAST;