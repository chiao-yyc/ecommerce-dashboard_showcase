-- =====================================================
-- 自動觸發器和智能建議系統 (適配群組通知)
-- =====================================================

-- 創建輔助函數：根據通知類型決定發送個人還是群組通知
CREATE OR REPLACE FUNCTION create_smart_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_category TEXT,
  p_completion_strategy TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL  -- 特定用戶ID（可選）
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
  routing_rule RECORD;
  template_active BOOLEAN;
BEGIN
  -- 檢查通知模板是否啟用
  SELECT is_active INTO template_active 
  FROM notification_templates 
  WHERE type = p_type;
  
  IF NOT COALESCE(template_active, FALSE) THEN
    RAISE LOG 'Notification type % is disabled by admin', p_type;
    RETURN NULL;
  END IF;
  
  -- 查找通知路由規則
  SELECT target_type, target_criteria, send_to_user 
  INTO routing_rule
  FROM notification_routing_rules 
  WHERE notification_type = p_type AND is_active = TRUE
  LIMIT 1;
  
  -- 如果有路由規則，使用群組通知
  IF routing_rule.target_type IS NOT NULL THEN
    -- 使用群組通知系統
    SELECT create_group_notification(
      p_type, p_title, p_message, 
      routing_rule.target_type::notification_target_type,
      routing_rule.target_criteria,
      p_priority, p_category, p_completion_strategy,
      p_metadata, p_related_entity_type, p_related_entity_id, p_action_url
    ) INTO result_id;
    
    -- 如果需要同時發送給特定用戶
    IF routing_rule.send_to_user = TRUE AND p_target_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, type, title, message, category, completion_strategy,
        priority, related_entity_type, related_entity_id, action_url, 
        metadata, status, channels, is_personal, created_at
      ) VALUES (
        p_target_user_id, p_type, p_title, p_message, p_category, p_completion_strategy,
        p_priority, p_related_entity_type, p_related_entity_id, p_action_url,
        p_metadata, 'unread', ARRAY['in_app'], TRUE, NOW()
      );
    END IF;
    
  ELSE
    -- 沒有路由規則，創建個人通知（如果指定了用戶）
    IF p_target_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id, type, title, message, category, completion_strategy,
        priority, related_entity_type, related_entity_id, action_url, 
        metadata, status, channels, is_personal, created_at
      ) VALUES (
        p_target_user_id, p_type, p_title, p_message, p_category, p_completion_strategy,
        p_priority, p_related_entity_type, p_related_entity_id, p_action_url,
        p_metadata, 'unread', ARRAY['in_app'], TRUE, NOW()
      ) RETURNING id INTO result_id;
    END IF;
  END IF;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- 先創建通知路由規則表（如果不存在）
CREATE TABLE IF NOT EXISTS notification_routing_rules (
  notification_type TEXT PRIMARY KEY,
  target_type notification_target_type NOT NULL,
  target_criteria JSONB NOT NULL,
  send_to_user BOOLEAN DEFAULT FALSE,  -- 是否同時發送給相關用戶
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入預設路由規則
INSERT INTO notification_routing_rules (notification_type, target_type, target_criteria, send_to_user, is_active) VALUES
('order_new', 'role', '{"roles": ["sales", "sales_manager"]}', FALSE, TRUE),
('order_high_value', 'role', '{"roles": ["sales_manager", "admin"]}', FALSE, TRUE),
('order_payment_overdue', 'role', '{"roles": ["finance", "sales_manager"]}', TRUE, TRUE),
('order_payment_failed', 'role', '{"roles": ["finance", "sales_manager"]}', TRUE, TRUE),
('order_cancelled', 'role', '{"roles": ["sales", "customer_service"]}', TRUE, TRUE),
('order_shipping_delayed', 'role', '{"roles": ["logistics", "customer_service"]}', TRUE, TRUE),
('inventory_low_stock', 'role', '{"roles": ["warehouse_manager", "purchasing"]}', FALSE, TRUE),
('inventory_out_of_stock', 'role', '{"roles": ["warehouse_manager", "purchasing", "sales_manager"]}', FALSE, TRUE),
('inventory_overstock', 'role', '{"roles": ["warehouse_manager", "purchasing"]}', FALSE, TRUE),
('customer_service_new_request', 'role', '{"roles": ["customer_service", "customer_service_manager"]}', FALSE, TRUE),
('customer_vip_issue', 'role', '{"roles": ["vip_customer_service", "customer_service_manager"]}', FALSE, TRUE),
('customer_service_overdue', 'role', '{"roles": ["customer_service_manager"]}', TRUE, TRUE),
('customer_service_urgent', 'role', '{"roles": ["customer_service_manager"]}', TRUE, TRUE)
ON CONFLICT (notification_type) DO UPDATE SET
  target_type = EXCLUDED.target_type,
  target_criteria = EXCLUDED.target_criteria,
  send_to_user = EXCLUDED.send_to_user,
  is_active = EXCLUDED.is_active;

-- 訂單相關觸發器函數
CREATE OR REPLACE FUNCTION notify_order_events() RETURNS TRIGGER AS $$
BEGIN
  -- 新訂單通知
  IF TG_OP = 'INSERT' THEN
    IF NEW.total_amount > 10000 THEN
      -- 高價值訂單警示
      PERFORM create_smart_notification(
        'order_high_value',
        '高價值訂單警示',
        '收到高價值訂單 #' || NEW.order_number || '，金額：$' || NEW.total_amount,
        'actionable',
        'manual', -- 高價值訂單需手動處理
        'urgent',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object('order_number', NEW.order_number, 'total_amount', NEW.total_amount),
        NEW.user_id
      );
    ELSE
      -- 一般新訂單
      PERFORM create_smart_notification(
        'order_new',
        '新訂單通知',
        '收到新訂單 #' || NEW.order_number || '，金額：$' || NEW.total_amount,
        'actionable',
        'suggested',
        'high',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object('order_number', NEW.order_number, 'total_amount', NEW.total_amount),
        NEW.user_id
      );
    END IF;
  END IF;
  
  -- 訂單狀態變更通知
  IF TG_OP = 'UPDATE' THEN
    -- 付款逾期
    IF NEW.payment_status = 'overdue' AND OLD.payment_status != 'overdue' THEN
      PERFORM create_smart_notification(
        'order_payment_overdue',
        '付款逾期通知',
        '訂單 #' || NEW.order_number || ' 付款已逾期',
        'actionable',
        'manual',
        'urgent',
        'order',
        NEW.id,
        '/orders/' || NEW.id || '/payment',
        jsonb_build_object('order_number', NEW.order_number, 'overdue_days', DATE_PART('day', NOW() - NEW.payment_due_date)),
        NEW.user_id
      );
    END IF;
    
    -- 付款失敗
    IF NEW.payment_status = 'failed' AND OLD.payment_status != 'failed' THEN
      PERFORM create_smart_notification(
        'order_payment_failed',
        '付款失敗通知',
        '訂單 #' || NEW.order_number || ' 付款失敗',
        'actionable',
        'manual',
        'high',
        'order',
        NEW.id,
        '/orders/' || NEW.id || '/payment',
        jsonb_build_object('order_number', NEW.order_number, 'failure_reason', NEW.payment_failure_reason),
        NEW.user_id
      );
    END IF;
    
    -- 訂單取消（自動完成）
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      PERFORM create_smart_notification(
        'order_cancelled',
        '訂單已取消',
        '訂單 #' || NEW.order_number || ' 已取消',
        'informational',
        'auto',
        'medium',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object('order_number', NEW.order_number, 'cancellation_reason', NEW.cancellation_reason),
        NEW.user_id
      );
    END IF;
    
    -- 運送延遲
    IF NEW.shipping_status = 'delayed' AND OLD.shipping_status != 'delayed' THEN
      PERFORM create_smart_notification(
        'order_shipping_delayed',
        '運送延遲通知',
        '訂單 #' || NEW.order_number || ' 運送延遲',
        'actionable',
        'suggested',
        'medium',
        'order',
        NEW.id,
        '/orders/' || NEW.id || '/shipping',
        jsonb_build_object('order_number', NEW.order_number, 'expected_delay', NEW.expected_delay_days),
        NEW.user_id
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 庫存相關觸發器函數
CREATE OR REPLACE FUNCTION notify_inventory_events() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- 低庫存警告
    IF NEW.stock <= NEW.low_stock_threshold AND OLD.stock > OLD.low_stock_threshold THEN
      PERFORM create_smart_notification(
        'inventory_low_stock',
        '低庫存警告',
        '產品 "' || NEW.name || '" 庫存不足，目前庫存：' || NEW.stock,
        'actionable',
        'suggested',
        'high',
        'product',
        NEW.id,
        '/products/' || NEW.id,
        jsonb_build_object('product_name', NEW.name, 'current_stock', NEW.stock, 'threshold', NEW.low_stock_threshold)
      );
    END IF;
    
    -- 缺貨通知
    IF NEW.stock = 0 AND OLD.stock > 0 THEN
      PERFORM create_smart_notification(
        'inventory_out_of_stock',
        '缺貨通知',
        '產品 "' || NEW.name || '" 已缺貨',
        'actionable',
        'auto', -- 庫存恢復時自動完成
        'urgent',
        'product',
        NEW.id,
        '/products/' || NEW.id,
        jsonb_build_object('product_name', NEW.name)
      );
    END IF;
    
    -- 庫存過多警告
    IF NEW.stock > NEW.overstock_threshold AND OLD.stock <= OLD.overstock_threshold THEN
      PERFORM create_smart_notification(
        'inventory_overstock',
        '庫存過多警告',
        '產品 "' || NEW.name || '" 庫存過多，目前庫存：' || NEW.stock,
        'actionable',
        'suggested',
        'medium',
        'product',
        NEW.id,
        '/products/' || NEW.id,
        jsonb_build_object('product_name', NEW.name, 'current_stock', NEW.stock, 'threshold', NEW.overstock_threshold)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 客服相關觸發器函數
CREATE OR REPLACE FUNCTION notify_customer_service_events() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 新客服請求
    PERFORM create_smart_notification(
      'customer_service_new_request',
      '新客服請求',
      '收到來自 ' || NEW.customer_name || ' 的新客服請求',
      'actionable',
      'suggested',
      CASE WHEN NEW.priority = 'urgent' THEN 'urgent' ELSE 'medium' END,
      'conversation',
      NEW.id,
      '/support/conversations/' || NEW.id,
      jsonb_build_object('customer_name', NEW.customer_name, 'customer_id', NEW.customer_id)
    );
    
    -- VIP 客戶問題（特殊處理）
    IF NEW.customer_vip_status = TRUE THEN
      PERFORM create_smart_notification(
        'customer_vip_issue',
        'VIP 客戶問題',
        'VIP 客戶 ' || NEW.customer_name || ' 需要協助',
        'actionable',
        'manual', -- VIP 問題需手動處理
        'urgent',
        'conversation',
        NEW.id,
        '/support/vip/conversations/' || NEW.id,
        jsonb_build_object('customer_name', NEW.customer_name, 'customer_id', NEW.customer_id, 'vip_level', NEW.vip_level)
      );
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    -- 客服逾期
    IF NEW.status = 'overdue' AND OLD.status != 'overdue' THEN
      PERFORM create_smart_notification(
        'customer_service_overdue',
        '客服請求逾期',
        '來自 ' || NEW.customer_name || ' 的客服請求已逾期',
        'actionable',
        'suggested',
        'high',
        'conversation',
        NEW.id,
        '/support/conversations/' || NEW.id,
        jsonb_build_object('customer_name', NEW.customer_name, 'overdue_hours', EXTRACT(HOUR FROM NOW() - NEW.created_at)),
        NEW.assigned_agent_id
      );
    END IF;
    
    -- 升級為緊急
    IF NEW.priority = 'urgent' AND OLD.priority != 'urgent' THEN
      PERFORM create_smart_notification(
        'customer_service_urgent',
        '緊急客服請求',
        '來自 ' || NEW.customer_name || ' 的請求已升級為緊急',
        'actionable',
        'manual',
        'urgent',
        'conversation',
        NEW.id,
        '/support/conversations/' || NEW.id,
        jsonb_build_object('customer_name', NEW.customer_name, 'escalation_reason', NEW.escalation_reason),
        NEW.assigned_agent_id
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 創建模擬測試表和觸發器（用於測試）
CREATE TABLE IF NOT EXISTS mock_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  shipping_status TEXT DEFAULT 'pending',
  payment_due_date TIMESTAMP WITH TIME ZONE,
  payment_failure_reason TEXT,
  cancellation_reason TEXT,
  expected_delay_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  overstock_threshold INTEGER DEFAULT 1000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mock_customer_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_vip_status BOOLEAN DEFAULT FALSE,
  vip_level TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_agent_id UUID,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 為測試表創建觸發器
DROP TRIGGER IF EXISTS trigger_mock_order_notifications ON mock_orders;
CREATE TRIGGER trigger_mock_order_notifications
  AFTER INSERT OR UPDATE ON mock_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_events();

DROP TRIGGER IF EXISTS trigger_mock_inventory_notifications ON mock_products;
CREATE TRIGGER trigger_mock_inventory_notifications
  AFTER UPDATE ON mock_products
  FOR EACH ROW
  EXECUTE FUNCTION notify_inventory_events();

DROP TRIGGER IF EXISTS trigger_mock_customer_service_notifications ON mock_customer_service_requests;
CREATE TRIGGER trigger_mock_customer_service_notifications
  AFTER INSERT OR UPDATE ON mock_customer_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_service_events();

-- 創建測試資料
INSERT INTO mock_products (name, stock, low_stock_threshold, overstock_threshold) VALUES
  ('測試產品A', 50, 10, 200),
  ('測試產品B', 5, 10, 100), -- 觸發低庫存
  ('測試產品C', 0, 10, 100)  -- 觸發缺貨
ON CONFLICT (id) DO NOTHING;

-- 註釋說明
COMMENT ON FUNCTION create_smart_notification IS '智能通知創建函數：根據路由規則決定群組或個人通知';
COMMENT ON FUNCTION notify_order_events IS '訂單事件觸發器函數：處理新訂單、狀態變更等';
COMMENT ON FUNCTION notify_inventory_events IS '庫存事件觸發器函數：處理庫存變更通知';
COMMENT ON FUNCTION notify_customer_service_events IS '客服事件觸發器函數：處理客服請求通知';
COMMENT ON TABLE notification_routing_rules IS '通知路由規則表：配置不同通知類型的分發規則';

SELECT 'Auto triggers system updated for group notifications!' as message;