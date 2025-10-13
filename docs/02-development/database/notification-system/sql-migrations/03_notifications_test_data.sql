-- 通知系統測試數據
-- 第三階段：插入測試用假資料

-- 1. 插入一些測試通知資料（新訂單通知）
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url) 
SELECT 
    u.id,
    'order_new',
    '新訂單通知',
    '收到新訂單 #ORD-2024-001，金額：$1,250.00',
    'high',
    'unread',
    '{"order_number": "ORD-2024-001", "total_amount": 1250.00}',
    'order',
    o.id,
    '/orders/' || o.id
FROM users u
CROSS JOIN (SELECT id FROM orders LIMIT 1) o
WHERE EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 3;

-- 2. 插入高價值訂單警示
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url, created_at)
SELECT 
    u.id,
    'order_high_value',
    '高價值訂單警示',
    '收到高價值訂單 #ORD-2024-002，金額：$5,800.00',
    'urgent',
    'unread',
    '{"order_number": "ORD-2024-002", "total_amount": 5800.00}',
    'order',
    o.id,
    '/orders/' || o.id,
    NOW() - INTERVAL '30 minutes'
FROM users u
CROSS JOIN (SELECT id FROM orders LIMIT 1) o
WHERE EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 2;

-- 3. 插入低庫存警告通知
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url, created_at)
SELECT 
    u.id,
    'inventory_low_stock',
    '低庫存警告',
    '商品 ' || p.name || ' 庫存不足，目前庫存：' || p.total_stock,
    'high',
    'unread',
    jsonb_build_object('product_name', p.name, 'current_stock', p.total_stock),
    'product',
    p.id,
    '/products/' || p.id,
    NOW() - INTERVAL '1 hour'
FROM users u
CROSS JOIN product_with_current_stock p
WHERE p.total_stock < COALESCE(p.stock_threshold, 10)
AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 5;

-- 4. 插入缺貨通知
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url, created_at)
SELECT 
    u.id,
    'inventory_out_of_stock',
    '缺貨通知',
    '商品 ' || p.name || ' 已售完',
    'urgent',
    'read',
    jsonb_build_object('product_name', p.name, 'current_stock', 0),
    'product',
    p.id,
    '/products/' || p.id,
    NOW() - INTERVAL '2 hours'
FROM users u
CROSS JOIN product_with_current_stock p
WHERE p.total_stock = 0
AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 3;

-- 5. 插入客服請求通知
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url, created_at)
SELECT 
    u.id,
    'customer_service_new_request',
    '新客服請求',
    '收到新的客服請求，來自客戶：' || c.full_name,
    'medium',
    'read',
    jsonb_build_object('customer_name', c.full_name, 'customer_id', c.id),
    'conversation',
    conv.id,
    '/support/conversations/' || conv.id,
    NOW() - INTERVAL '3 hours'
FROM users u
CROSS JOIN customers c
CROSS JOIN conversations conv
WHERE conv.user_id = c.id
AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 4;

-- 6. 插入緊急客服案件通知
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url, created_at)
SELECT 
    u.id,
    'customer_service_urgent',
    '緊急客服案件',
    '緊急客服案件需要處理，優先級：高',
    'urgent',
    'unread',
    jsonb_build_object('priority', 'high', 'customer_id', c.id),
    'conversation',
    conv.id,
    '/support/conversations/' || conv.id,
    NOW() - INTERVAL '15 minutes'
FROM users u
CROSS JOIN customers c
CROSS JOIN conversations conv
WHERE conv.user_id = c.id
AND conv.priority = 'high'
AND EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 2;

-- 7. 插入權限變更通知
INSERT INTO notifications (user_id, type, title, message, priority, status, metadata, related_entity_type, related_entity_id, action_url, created_at)
SELECT 
    u.id,
    'security_permission_changed',
    '權限變更通知',
    '您的權限已被修改：新增了產品管理權限',
    'high',
    'unread',
    jsonb_build_object('change_description', '新增了產品管理權限', 'changed_by', 'admin'),
    'user',
    u.id,
    '/settings/permissions',
    NOW() - INTERVAL '6 hours'
FROM users u
WHERE EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = u.id
    AND r.name IN ('admin', 'super_admin')
)
LIMIT 1;

-- 8. 插入一些通知發送記錄
INSERT INTO notification_logs (notification_id, channel, status, sent_at, delivered_at)
SELECT 
    n.id,
    'in_app',
    'delivered',
    n.created_at + INTERVAL '1 minute',
    n.created_at + INTERVAL '2 minutes'
FROM notifications n
WHERE n.channels @> '{in_app}'
LIMIT 10;

-- 插入一些 email 發送記錄
INSERT INTO notification_logs (notification_id, channel, status, sent_at, delivered_at)
SELECT 
    n.id,
    'email',
    'sent',
    n.created_at + INTERVAL '2 minutes',
    n.created_at + INTERVAL '5 minutes'
FROM notifications n
WHERE n.channels @> '{email}'
LIMIT 5;