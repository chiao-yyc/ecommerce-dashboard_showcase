-- =====================================================
-- 智能建議和完成處理函數 (適配新結構)
-- =====================================================

-- 智能建議觸發器函數
CREATE OR REPLACE FUNCTION suggest_completion() RETURNS TRIGGER AS $$
BEGIN
  -- 庫存補充建議
  IF TG_TABLE_NAME = 'mock_products' OR TG_TABLE_NAME = 'products' THEN
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
  IF TG_TABLE_NAME = 'mock_orders' OR TG_TABLE_NAME = 'orders' THEN
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
  IF TG_TABLE_NAME = 'mock_customer_service_requests' OR TG_TABLE_NAME = 'customer_service_requests' THEN
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
$$ LANGUAGE plpgsql;

-- 接受完成建議函數
CREATE OR REPLACE FUNCTION accept_completion_suggestion(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'completed',
      suggested_complete = FALSE,
      updated_at = NOW()
  WHERE id = p_notification_id
    AND suggested_complete = TRUE
    AND status NOT IN ('completed', 'archived', 'dismissed');
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 拒絕完成建議函數
CREATE OR REPLACE FUNCTION dismiss_completion_suggestion(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET suggested_complete = FALSE,
      suggested_at = NULL,
      suggestion_reason = NULL,
      updated_at = NOW()
  WHERE id = p_notification_id
    AND suggested_complete = TRUE;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 批量接受建議函數
CREATE OR REPLACE FUNCTION accept_all_suggestions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'completed',
      suggested_complete = FALSE,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND suggested_complete = TRUE
    AND status NOT IN ('completed', 'archived', 'dismissed');
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 手動標記完成函數
CREATE OR REPLACE FUNCTION mark_notification_completed(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'completed',
      updated_at = NOW()
  WHERE id = p_notification_id
    AND category = 'actionable'
    AND status NOT IN ('completed', 'archived');
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 手動標記已知悉函數（資訊型通知）
CREATE OR REPLACE FUNCTION mark_notification_dismissed(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'dismissed',
      updated_at = NOW()
  WHERE id = p_notification_id
    AND category = 'informational'
    AND status NOT IN ('dismissed', 'archived');
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 標記通知為已讀函數
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'read',
      read_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id
    AND status = 'unread';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- 批量標記為已讀函數
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'read',
      read_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND status = 'unread';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 取得智能建議統計函數
CREATE OR REPLACE FUNCTION get_suggestion_stats(p_user_id UUID)
RETURNS TABLE (
  total_suggestions INTEGER,
  by_type JSONB,
  oldest_suggestion TIMESTAMP WITH TIME ZONE,
  newest_suggestion TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_suggestions,
    jsonb_object_agg(type, cnt) as by_type,
    MIN(suggested_at) as oldest_suggestion,
    MAX(suggested_at) as newest_suggestion
  FROM (
    SELECT 
      type,
      COUNT(*) as cnt,
      suggested_at
    FROM notifications 
    WHERE user_id = p_user_id 
      AND suggested_complete = TRUE
      AND status NOT IN ('completed', 'archived', 'dismissed')
    GROUP BY type, suggested_at
  ) suggestion_counts;
END;
$$ LANGUAGE plpgsql;

-- 取得用戶通知統計函數
CREATE OR REPLACE FUNCTION get_user_notification_stats(p_user_id UUID)
RETURNS TABLE (
  total_notifications INTEGER,
  unread_count INTEGER,
  actionable_count INTEGER,
  suggestions_count INTEGER,
  by_priority JSONB,
  by_category JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_notifications,
    SUM(CASE WHEN status = 'unread' THEN 1 ELSE 0 END)::INTEGER as unread_count,
    SUM(CASE WHEN category = 'actionable' AND status NOT IN ('completed', 'dismissed', 'archived') THEN 1 ELSE 0 END)::INTEGER as actionable_count,
    SUM(CASE WHEN suggested_complete = TRUE THEN 1 ELSE 0 END)::INTEGER as suggestions_count,
    jsonb_object_agg(priority, priority_count) as by_priority,
    jsonb_object_agg(category, category_count) as by_category
  FROM (
    SELECT 
      priority,
      COUNT(*) as priority_count,
      category,
      COUNT(*) as category_count
    FROM notifications 
    WHERE user_id = p_user_id 
      AND status NOT IN ('archived')
    GROUP BY priority, category
  ) stats;
END;
$$ LANGUAGE plpgsql;

-- 清理過期建議函數
CREATE OR REPLACE FUNCTION cleanup_expired_suggestions()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- 清理超過 7 天的建議
  UPDATE notifications 
  SET suggested_complete = FALSE,
      suggested_at = NULL,
      suggestion_reason = NULL
  WHERE suggested_complete = TRUE
    AND suggested_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 清理過期通知函數
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  -- 將超過 30 天的已完成/已知悉通知歸檔
  UPDATE notifications 
  SET status = 'archived'
  WHERE status IN ('completed', 'dismissed')
    AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 為測試表創建智能建議觸發器
DROP TRIGGER IF EXISTS trigger_mock_product_suggestions ON mock_products;
CREATE TRIGGER trigger_mock_product_suggestions
  AFTER UPDATE ON mock_products
  FOR EACH ROW
  EXECUTE FUNCTION suggest_completion();

DROP TRIGGER IF EXISTS trigger_mock_order_suggestions ON mock_orders;
CREATE TRIGGER trigger_mock_order_suggestions
  AFTER UPDATE ON mock_orders
  FOR EACH ROW
  EXECUTE FUNCTION suggest_completion();

DROP TRIGGER IF EXISTS trigger_mock_customer_service_suggestions ON mock_customer_service_requests;
CREATE TRIGGER trigger_mock_customer_service_suggestions
  AFTER UPDATE ON mock_customer_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION suggest_completion();

-- 創建定期清理任務（需要 pg_cron 擴展）
-- SELECT cron.schedule('cleanup_suggestions', '0 2 * * *', 'SELECT cleanup_expired_suggestions();');
-- SELECT cron.schedule('cleanup_notifications', '0 3 * * *', 'SELECT cleanup_expired_notifications();');

-- 創建通知查詢優化檢視
CREATE OR REPLACE VIEW user_active_notifications AS
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.priority,
  n.category,
  n.completion_strategy,
  n.status,
  n.suggested_complete,
  n.suggested_at,
  n.suggestion_reason,
  n.is_personal,
  n.distribution_id,
  n.created_at,
  n.read_at,
  n.action_url,
  n.metadata,
  nd.target_type,
  nd.target_criteria
FROM notifications n
LEFT JOIN notification_distributions nd ON n.distribution_id = nd.id
WHERE n.status NOT IN ('archived')
ORDER BY 
  CASE n.priority 
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  n.created_at DESC;

-- 創建建議通知檢視
CREATE OR REPLACE VIEW user_suggested_notifications AS
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.priority,
  n.category,
  n.suggested_at,
  n.suggestion_reason,
  n.created_at,
  n.action_url,
  n.metadata
FROM notifications n
WHERE n.suggested_complete = TRUE
  AND n.status NOT IN ('completed', 'archived', 'dismissed')
ORDER BY n.suggested_at DESC;

-- 註釋說明
COMMENT ON FUNCTION suggest_completion IS '智能建議觸發器：檢測業務狀態變更並建議完成通知';
COMMENT ON FUNCTION accept_completion_suggestion IS '接受單個完成建議';
COMMENT ON FUNCTION dismiss_completion_suggestion IS '拒絕單個完成建議';
COMMENT ON FUNCTION accept_all_suggestions IS '批量接受用戶的所有建議';
COMMENT ON FUNCTION mark_notification_completed IS '手動標記任務型通知為已完成';
COMMENT ON FUNCTION mark_notification_dismissed IS '手動標記資訊型通知為已知悉';
COMMENT ON FUNCTION mark_notification_read IS '標記通知為已讀';
COMMENT ON FUNCTION mark_all_notifications_read IS '批量標記所有通知為已讀';
COMMENT ON FUNCTION get_suggestion_stats IS '取得用戶的智能建議統計';
COMMENT ON FUNCTION get_user_notification_stats IS '取得用戶的通知統計';
COMMENT ON FUNCTION cleanup_expired_suggestions IS '清理過期的智能建議';
COMMENT ON FUNCTION cleanup_expired_notifications IS '清理過期的通知';
COMMENT ON VIEW user_active_notifications IS '用戶活躍通知檢視（排除已歸檔）';
COMMENT ON VIEW user_suggested_notifications IS '用戶建議通知檢視';

SELECT 'Notification functions updated for new structure!' as message;