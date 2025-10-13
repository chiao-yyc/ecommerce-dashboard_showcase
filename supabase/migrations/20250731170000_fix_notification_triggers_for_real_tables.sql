-- Fix notification triggers to work with actual table structures
-- Date: 2025-07-31
-- Purpose: Connect notification system to real business tables instead of mock tables

-- ================================================================================
-- Updated Notification Functions for Real Table Structures
-- ================================================================================

-- 修正訂單事件通知函數，配合實際 orders 表結構
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
        '收到高價值訂單 ID: ' || NEW.id || '，金額：$' || NEW.total_amount,
        'actionable',
        'manual', -- 高價值訂單需手動處理
        'urgent',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object(
          'order_id', NEW.id, 
          'total_amount', NEW.total_amount,
          'user_id', NEW.user_id
        ),
        (SELECT id FROM users WHERE email = 'admin@system.local' LIMIT 1)
      );
    ELSE
      -- 一般新訂單
      PERFORM create_smart_notification(
        'order_new',
        '新訂單通知',
        '收到新訂單 ID: ' || NEW.id || '，金額：$' || NEW.total_amount,
        'actionable',
        'suggested',
        'high',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object(
          'order_id', NEW.id, 
          'total_amount', NEW.total_amount,
          'user_id', NEW.user_id
        ),
        (SELECT id FROM users WHERE email = 'admin@system.local' LIMIT 1)
      );
    END IF;
  END IF;
  
  -- 訂單狀態變更通知
  IF TG_OP = 'UPDATE' THEN
    -- 訂單取消
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
      PERFORM create_smart_notification(
        'order_cancelled',
        '訂單取消通知',
        '訂單 ' || NEW.id || ' 已取消',
        'informational',
        'auto', -- 取消後自動完成通知
        'medium',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'total_amount', NEW.total_amount
        ),
        (SELECT id FROM users WHERE email = 'admin@system.local' LIMIT 1)
      );
    END IF;
    
    -- 訂單完成
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      PERFORM create_smart_notification(
        'order_completed',
        '訂單完成通知',
        '訂單 ' || NEW.id || ' 已完成，金額：$' || NEW.total_amount,
        'informational',
        'auto', -- 完成後自動標記通知完成
        'low',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'total_amount', NEW.total_amount,
          'completion_time', NEW.created_at
        ),
        (SELECT id FROM users WHERE email = 'admin@system.local' LIMIT 1)
      );
    END IF;
    
    -- 訂單付款完成
    IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
      PERFORM create_smart_notification(
        'order_paid',
        '訂單付款通知',
        '訂單 ' || NEW.id || ' 付款完成，金額：$' || NEW.total_amount,
        'actionable',
        'suggested', -- 建議標記為處理中
        'high',
        'order',
        NEW.id,
        '/orders/' || NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'total_amount', NEW.total_amount,
          'payment_time', NOW()
        ),
        (SELECT id FROM users WHERE email = 'admin@system.local' LIMIT 1)
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 修正庫存事件通知函數，配合實際 products 表結構
-- Note: products 表沒有 stock 欄位，庫存在 inventories 表中
-- 這個函數將監控 products 表的狀態變化，如產品下架等
CREATE OR REPLACE FUNCTION public.notify_inventory_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- 產品狀態變更通知
    IF NEW.status = 'inactive' AND OLD.status = 'active' THEN
      PERFORM create_smart_notification(
        'product_deactivated',
        '產品下架通知',
        '產品 "' || NEW.name || '" 已下架',
        'informational',
        'auto',
        'medium',
        'product',
        NEW.id,
        '/products/' || NEW.id,
        jsonb_build_object(
          'product_name', NEW.name, 
          'price', NEW.price,
          'sku', NEW.sku,
          'deactivation_time', NOW()
        )
      );
    END IF;
    
    -- 產品重新上架通知
    IF NEW.status = 'active' AND OLD.status = 'inactive' THEN
      PERFORM create_smart_notification(
        'product_reactivated',
        '產品重新上架通知',
        '產品 "' || NEW.name || '" 已重新上架',
        'informational',
        'auto',
        'low',
        'product',
        NEW.id,
        '/products/' || NEW.id,
        jsonb_build_object(
          'product_name', NEW.name,
          'price', NEW.price,
          'sku', NEW.sku,
          'reactivation_time', NOW()
        )
      );
    END IF;

    -- 產品價格大幅變動通知 (變動超過50%)
    IF OLD.price IS NOT NULL AND NEW.price IS NOT NULL AND NEW.price != OLD.price THEN
      DECLARE
        price_change_percent numeric;
      BEGIN
        price_change_percent := ABS((NEW.price - OLD.price) / OLD.price * 100);
        
        IF price_change_percent > 50 THEN
          PERFORM create_smart_notification(
            'product_price_major_change',
            '產品價格大幅變動',
            '產品 "' || NEW.name || '" 價格從 $' || OLD.price || ' 變更為 $' || NEW.price || ' (變動 ' || ROUND(price_change_percent, 1) || '%)',
            'informational',
            'auto',
            'medium',
            'product',
            NEW.id,
            '/products/' || NEW.id,
            jsonb_build_object(
              'product_name', NEW.name,
              'old_price', OLD.price,
              'new_price', NEW.price,
              'change_percent', ROUND(price_change_percent, 1)
            )
          );
        END IF;
      END;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 簡化的客戶服務事件通知函數 (基於現有 customers 表)
CREATE OR REPLACE FUNCTION public.notify_customer_service_events()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- 新客戶註冊通知
  IF TG_OP = 'INSERT' THEN
    PERFORM create_smart_notification(
      'customer_new_registration',
      '新客戶註冊',
      '新客戶 "' || NEW.full_name || '" 已註冊',
      'informational',
      'auto',
      'low',
      'customer',
      NEW.id,
      '/customers/' || NEW.id,
      jsonb_build_object(
        'customer_name', NEW.full_name,
        'email', NEW.email,
        'phone', NEW.phone,
        'registration_time', NEW.created_at
      )
    );
  END IF;

  -- 客戶狀態變更通知
  IF TG_OP = 'UPDATE' THEN
    -- 客戶被停用
    IF NEW.status = 'inactive' AND OLD.status = 'active' THEN
      PERFORM create_smart_notification(
        'customer_deactivated',
        '客戶帳戶停用',
        '客戶 "' || NEW.full_name || '" 帳戶已停用',
        'actionable',
        'manual',
        'medium',
        'customer',
        NEW.id,
        '/customers/' || NEW.id,
        jsonb_build_object(
          'customer_name', NEW.full_name,
          'email', NEW.email,
          'deactivation_time', NOW()
        )
      );
    END IF;
    
    -- 客戶重新啟用
    IF NEW.status = 'active' AND OLD.status = 'inactive' THEN
      PERFORM create_smart_notification(
        'customer_reactivated',
        '客戶帳戶重新啟用',
        '客戶 "' || NEW.full_name || '" 帳戶已重新啟用',
        'informational',
        'auto',
        'low',
        'customer',
        NEW.id,
        '/customers/' || NEW.id,
        jsonb_build_object(
          'customer_name', NEW.full_name,
          'email', NEW.email,
          'reactivation_time', NOW()
        )
      );
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- ================================================================================
-- Create Triggers for Real Business Tables
-- ================================================================================

-- 為實際的 orders 表創建觸發器
DROP TRIGGER IF EXISTS trigger_order_notifications ON public.orders;
CREATE TRIGGER trigger_order_notifications 
AFTER INSERT OR UPDATE ON public.orders 
FOR EACH ROW EXECUTE FUNCTION notify_order_events();

-- 為實際的 products 表創建觸發器  
DROP TRIGGER IF EXISTS trigger_inventory_notifications ON public.products;
CREATE TRIGGER trigger_inventory_notifications 
AFTER UPDATE ON public.products 
FOR EACH ROW EXECUTE FUNCTION notify_inventory_events();

-- 為實際的 customers 表創建觸發器
DROP TRIGGER IF EXISTS trigger_customer_service_notifications ON public.customers;
CREATE TRIGGER trigger_customer_service_notifications 
AFTER INSERT OR UPDATE ON public.customers 
FOR EACH ROW EXECUTE FUNCTION notify_customer_service_events();

-- 為實際的 orders 表創建完成建議觸發器
DROP TRIGGER IF EXISTS trigger_order_suggestions ON public.orders;
CREATE TRIGGER trigger_order_suggestions 
AFTER UPDATE ON public.orders 
FOR EACH ROW EXECUTE FUNCTION suggest_completion();

-- 為實際的 products 表創建完成建議觸發器
DROP TRIGGER IF EXISTS trigger_product_suggestions ON public.products;
CREATE TRIGGER trigger_product_suggestions 
AFTER UPDATE ON public.products 
FOR EACH ROW EXECUTE FUNCTION suggest_completion();

-- 為實際的 customers 表創建完成建議觸發器
DROP TRIGGER IF EXISTS trigger_customer_suggestions ON public.customers;
CREATE TRIGGER trigger_customer_suggestions 
AFTER UPDATE ON public.customers 
FOR EACH ROW EXECUTE FUNCTION suggest_completion();

-- ================================================================================
-- Optional: Disable Mock Table Triggers (Keep tables for testing if needed)
-- ================================================================================

-- 暫時停用 mock 表的觸發器，但保留表結構供測試使用
DROP TRIGGER IF EXISTS trigger_mock_order_notifications ON public.mock_orders;
DROP TRIGGER IF EXISTS trigger_mock_order_suggestions ON public.mock_orders;
DROP TRIGGER IF EXISTS trigger_mock_inventory_notifications ON public.mock_products;
DROP TRIGGER IF EXISTS trigger_mock_product_suggestions ON public.mock_products;
DROP TRIGGER IF EXISTS trigger_mock_customer_service_notifications ON public.mock_customer_service_requests;
DROP TRIGGER IF EXISTS trigger_mock_customer_service_suggestions ON public.mock_customer_service_requests;

-- 為 mock 表添加註釋，標記為測試用途
COMMENT ON TABLE public.mock_orders IS 'Testing table - triggers disabled, use real orders table';
COMMENT ON TABLE public.mock_products IS 'Testing table - triggers disabled, use real products table';  
COMMENT ON TABLE public.mock_customer_service_requests IS 'Testing table - triggers disabled, use real customers table';