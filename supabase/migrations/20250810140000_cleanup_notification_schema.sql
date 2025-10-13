-- This migration cleans up unused and redundant notification-related database objects.

-- 1. Remove mock tables
DROP TABLE IF EXISTS public.mock_customer_service_requests CASCADE;
DROP TABLE IF EXISTS public.mock_orders CASCADE;
DROP TABLE IF EXISTS public.mock_products CASCADE;

-- 2. Simplify trigger functions by removing mock table checks
-- Recreate notify_customer_service_events
CREATE OR REPLACE FUNCTION public.notify_customer_service_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Recreate notify_inventory_events
CREATE OR REPLACE FUNCTION public.notify_inventory_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Recreate notify_order_events
CREATE OR REPLACE FUNCTION public.notify_order_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Recreate suggest_completion
CREATE OR REPLACE FUNCTION public.suggest_completion()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 庫存補充建議
  IF TG_TABLE_NAME = 'products' THEN
    -- 庫存從低於閾值恢復到正常
    IF NEW.stock > NEW.low_stock_threshold AND OLD.stock <= OLD.low_stock_threshold THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '庫存已補充至 ' || NEW.stock || ' 件（閾值：' || NEW.low_stock_threshold || '）'
      WHERE related_entity_type = 'product' 
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('inventory_low_stock')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'suggested'
        AND suggested_complete = FALSE;
    END IF;
    
    -- 缺貨恢復（自動完成）
    IF NEW.stock > 0 AND OLD.stock = 0 THEN
      UPDATE notifications 
      SET status = 'completed',
          auto_completed_at = NOW(),
          suggestion_reason = '庫存已恢復至 ' || NEW.stock || ' 件'
      WHERE related_entity_type = 'product'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type = 'inventory_out_of_stock'
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'auto';
    END IF;
    
    -- 庫存過多問題解決
    IF NEW.stock <= NEW.overstock_threshold AND OLD.stock > OLD.overstock_threshold THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '庫存已調整至 ' || NEW.stock || ' 件（閾值：' || NEW.overstock_threshold || '）'
      WHERE related_entity_type = 'product'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type = 'inventory_overstock'
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'suggested'
        AND suggested_complete = FALSE;
    END IF;
  END IF;
  
  -- 訂單處理建議
  IF TG_TABLE_NAME = 'orders' THEN
    -- 訂單出貨建議
    IF NEW.shipping_status = 'shipped' AND (OLD.shipping_status IS NULL OR OLD.shipping_status != 'shipped') THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '訂單已出貨'
      WHERE related_entity_type = 'order'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('order_new', 'order_high_value')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'suggested'
        AND suggested_complete = FALSE;
    END IF;
    
    -- 訂單完成建議
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '訂單已完成'
      WHERE related_entity_type = 'order'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('order_new', 'order_high_value', 'order_shipping_delayed')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'suggested'
        AND suggested_complete = FALSE;
    END IF;
    
    -- 付款完成建議
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '付款已完成'
      WHERE related_entity_type = 'order'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('order_payment_overdue', 'order_payment_failed')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy IN ('suggested', 'manual')
        AND suggested_complete = FALSE;
    END IF;
    
    -- 訂單取消自動完成
    IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
      UPDATE notifications 
      SET status = 'completed',
          auto_completed_at = NOW(),
          suggestion_reason = '訂單已取消'
      WHERE related_entity_type = 'order'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('order_new', 'order_high_value', 'order_payment_overdue', 'order_payment_failed', 'order_shipping_delayed')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'auto';
    END IF;
  END IF;
  
  -- 客服處理建議
  IF TG_TABLE_NAME = 'customer_service_requests' THEN
    -- 客服請求關閉建議
    IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '客服請求已關閉'
      WHERE related_entity_type = 'conversation'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('customer_service_new_request', 'customer_service_overdue')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy = 'suggested'
        AND suggested_complete = FALSE;
    END IF;
    
    -- 客服請求解決建議
    IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
      UPDATE notifications 
      SET suggested_complete = TRUE,
          suggested_at = NOW(),
          suggestion_reason = '客服問題已解決'
      WHERE related_entity_type = 'conversation'
        AND related_entity_id = NEW.id  -- 直接使用 UUID
        AND type IN ('customer_service_new_request', 'customer_service_urgent', 'customer_service_overdue', 'customer_vip_issue')
        AND status NOT IN ('completed', 'archived', 'dismissed')
        AND completion_strategy IN ('suggested', 'manual')
        AND suggested_complete = FALSE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Remove unused create_group_notification overload (9 parameters)
-- This function is not called anywhere and is superseded by newer overloads.
DROP FUNCTION IF EXISTS public.create_group_notification(
    text, text, text, notification_target_type, jsonb, text, text, text, jsonb
);

-- 4. Remove test functions
DROP FUNCTION IF EXISTS public.test_group_notification_inheritance();
DROP FUNCTION IF EXISTS public.test_template_inheritance();

-- Optional: Add comments to the remaining create_group_notification functions for clarity
COMMENT ON FUNCTION public.create_group_notification(
    text, text, text, notification_target_type, jsonb, text, text, text, jsonb, text, uuid, text
) IS 'Creates a group notification, including category, completion strategy, and related entity details.';

COMMENT ON FUNCTION public.create_group_notification(
    text, text, text, notification_target_type, jsonb, text, jsonb, text, uuid, text
) IS 'Creates a group notification, with category and completion strategy inherited via trigger.';

-- Optional: Add comments to the remaining notify_* helper functions
COMMENT ON FUNCTION public.notify_broadcast(
    text, text, text, text
) IS 'Helper function to create a broadcast notification to all users.';

COMMENT ON FUNCTION public.notify_custom_group(
    uuid[], text, text, text, text
) IS 'Helper function to create a notification for a custom list of users.';

COMMENT ON FUNCTION public.notify_role(
    text, text, text, text, text
) IS 'Helper function to create a notification for users belonging to a specific role.';

-- Optional: Add comments to the main notification creation function
COMMENT ON FUNCTION public.create_smart_notification(
    text, text, text, text, text, text, text, uuid, text, jsonb, uuid
) IS 'Intelligently creates a notification, using routing rules or direct user targeting.';

-- Optional: Add comments to the main notification management functions
COMMENT ON FUNCTION public.accept_all_suggestions(uuid) IS 'Marks all suggested notifications for a user as completed.';
COMMENT ON FUNCTION public.accept_completion_suggestion(uuid) IS 'Marks a specific suggested notification as completed.';
COMMENT ON FUNCTION public.dismiss_completion_suggestion(uuid) IS 'Dismisses a specific suggested notification.';
COMMENT ON FUNCTION public.get_notification_suggestions(uuid, integer, integer) IS 'Retrieves suggested notifications for a user.';
COMMENT ON FUNCTION public.get_suggestion_stats(uuid) IS 'Retrieves statistics about suggested notifications for a user.';
COMMENT ON FUNCTION public.get_user_active_notifications(uuid, json, integer, integer) IS 'Retrieves active notifications for a user.';
COMMENT ON FUNCTION public.get_user_notification_stats(uuid) IS 'Retrieves statistics about notifications for a user.';
COMMENT ON FUNCTION public.mark_all_notifications_read(uuid) IS 'Marks all unread notifications for a user as read.';
COMMENT ON FUNCTION public.mark_notification_completed(uuid) IS 'Marks an actionable notification as completed.';
COMMENT ON FUNCTION public.mark_notification_dismissed(uuid) IS 'Dismisses an informational notification.';
COMMENT ON FUNCTION public.mark_notification_read(uuid) IS 'Marks a specific notification as read.';
COMMENT ON FUNCTION public.search_notifications(uuid, text, json, integer, integer) IS 'Searches notifications for a user.';

-- Optional: Add comments to the trigger functions
COMMENT ON FUNCTION public.auto_inherit_template_properties() IS 'Trigger function to automatically inherit properties from notification templates.';
COMMENT ON FUNCTION public.cleanup_expired_notifications() IS 'Archives old completed or dismissed notifications.';
COMMENT ON FUNCTION public.cleanup_expired_suggestions() IS 'Clears old notification suggestions.';
COMMENT ON FUNCTION public.check_notification_constraints_integrity() IS 'Checks for data integrity issues related to notifications.';

-- Optional: Add comments to the views
COMMENT ON VIEW public.notification_category_stats IS 'Provides statistics on notifications by category.';
COMMENT ON VIEW public.notification_completion_strategy_stats IS 'Provides statistics on notifications by completion strategy and category.';
COMMENT ON VIEW public.notification_distribution_stats IS 'Provides statistics on notification distributions.';
COMMENT ON VIEW public.notification_entity_constraints IS 'Shows notification template types and their required entity types.';

-- Optional: Add comments to the tables
COMMENT ON TABLE public.notification_distributions IS 'Records how notifications are distributed to target groups.';
COMMENT ON TABLE public.notification_groups IS 'Defines reusable groups for notifications based on target criteria.';
COMMENT ON TABLE public.notification_logs IS 'Logs individual notification sending attempts and their status.';
COMMENT ON TABLE public.notification_preferences IS 'Stores user-specific notification preferences.';
COMMENT ON TABLE public.notification_recipients IS 'Links individual notifications to their recipients and distribution.';
COMMENT ON TABLE public.notification_routing_rules IS 'Defines rules for routing notifications based on type to specific targets.';
COMMENT ON TABLE public.notification_templates IS 'Stores templates for different types of notifications.';
COMMENT ON TABLE public.notifications IS 'Main table for individual notifications sent to users.';

-- Optional: Add comments to the type
COMMENT ON TYPE public.notification_target_type IS 'Defines the types of targets for notifications (user, role, broadcast, custom).';

-- Re-create triggers for real tables (if they were dropped or not created for real tables)
-- This part assumes that the triggers for real tables (products, orders, customer_service_requests) are already defined in other migrations or will be defined.
-- If not, they should be added here or in a separate migration.
-- For example, if you have a trigger for 'products' table:
-- CREATE TRIGGER trigger_inventory_notifications AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION notify_inventory_events();
-- CREATE TRIGGER trigger_product_suggestions AFTER UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION suggest_completion();

-- Ensure the triggers are correctly set up for the real tables.
-- This migration only modifies the functions, assuming the triggers are already pointing to these functions.
-- If the triggers were pointing to the old functions, they might need to be re-created to point to the new ones.
-- However, since we are using CREATE OR REPLACE FUNCTION, existing triggers should automatically use the new function definition.
-- The previous migration 20250731170000_fix_notification_triggers_for_real_tables.sql already handled dropping mock triggers and creating real ones.
-- So, no explicit trigger recreation is needed here, just function replacement.
