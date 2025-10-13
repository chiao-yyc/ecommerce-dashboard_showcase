-- 通知系統初始數據
-- 第二階段：插入預設模板和用戶偏好

-- 1. 插入預設通知模板
INSERT INTO notification_templates (type, title_template, message_template, default_priority, default_channels) VALUES
('order_new', '新訂單通知', '收到新訂單 #{order_number}，金額：${total_amount}', 'high', '{in_app,email}'),
('order_high_value', '高價值訂單警示', '收到高價值訂單 #{order_number}，金額：${total_amount}', 'urgent', '{in_app,email}'),
('inventory_low_stock', '低庫存警告', '商品 {product_name} 庫存不足，目前庫存：{current_stock}', 'high', '{in_app,email}'),
('inventory_out_of_stock', '缺貨通知', '商品 {product_name} 已售完', 'urgent', '{in_app,email}'),
('customer_service_new_request', '新客服請求', '收到新的客服請求，來自客戶：{customer_name}', 'medium', '{in_app}'),
('customer_service_urgent', '緊急客服案件', '緊急客服案件需要處理，優先級：{priority}', 'urgent', '{in_app,email}'),
('security_permission_changed', '權限變更通知', '您的權限已被修改：{change_description}', 'high', '{in_app,email}');

-- 2. 為所有現有用戶建立預設通知偏好
INSERT INTO notification_preferences (user_id, notification_type, channels, is_enabled)
SELECT 
    u.id,
    nt.type,
    nt.default_channels,
    true
FROM users u
CROSS JOIN notification_templates nt
WHERE nt.is_active = true
ON CONFLICT (user_id, notification_type) DO NOTHING;