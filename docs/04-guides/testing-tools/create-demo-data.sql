-- ===========================================
-- 建立示範資料來展示 JSONB 功能 (修正版)
-- ===========================================

-- 1. 建立測試客戶 (使用正確的欄位名稱)
INSERT INTO customers (full_name, email, phone) VALUES 
('張三', 'zhang.san@example.com', '0912345678'),
('李四', 'li.si@example.com', '0987654321'),
('王五', 'wang.wu@example.com', '0955123456');

-- 2. 建立測試產品
INSERT INTO products (name, description, price, sku, image_url, category_id, status) 
SELECT 
  name, description, price, sku, image_url, 
  (SELECT id FROM categories LIMIT 1), 
  'active'
FROM (VALUES 
  ('iPhone 15 Pro', '最新 iPhone 15 Pro 256GB', 35900.00, 'IPHONE15PRO256', 'https://example.com/iphone15pro.jpg'),
  ('MacBook Air M3', 'MacBook Air 13吋 M3晶片 8GB/256GB', 34900.00, 'MACBOOKAIR13M3', 'https://example.com/macbookair.jpg'),
  ('AirPods Pro 2', 'AirPods Pro 第二代 主動降噪', 7490.00, 'AIRPODSPRO2', 'https://example.com/airpodspro2.jpg'),
  ('iPad Air 5', 'iPad Air 第五代 64GB Wi-Fi', 18900.00, 'IPADAIR5WIFI', 'https://example.com/ipadair5.jpg'),
  ('Apple Watch Series 9', 'Apple Watch Series 9 GPS 45mm', 13900.00, 'AWSERIES9GPS45', 'https://example.com/applewatch9.jpg')
) AS t(name, description, price, sku, image_url);

-- 3. 建立一些基本訂單 (使用正確的欄位)
DO $$
DECLARE
  user_id_val uuid;
  order1_id uuid;
  order2_id uuid;
  order3_id uuid;
BEGIN
  -- 取得 user ID
  SELECT id INTO user_id_val FROM users LIMIT 1;
  
  -- 建立訂單 1 (一般訂單)
  INSERT INTO orders (
    user_id, contact_name, contact_email, contact_phone,
    payment_method, shipping_method, shipping_address,
    shipping_fee, tax_amount, discount_amount, 
    status, notes
  ) VALUES (
    user_id_val, '張三', 'zhang.san@example.com', '0912345678',
    'credit_card', 'standard', 
    '{"street": "台北市信義區信義路五段7號", "city": "台北市", "postal_code": "110"}',
    80.00, 100.00, 0.00,
    'pending', '一般購買訂單 - 展示基本 JSONB 功能'
  ) RETURNING id INTO order1_id;
  
  -- 建立訂單 2 (有折扣)
  INSERT INTO orders (
    user_id, contact_name, contact_email, contact_phone,
    payment_method, shipping_method, shipping_address,
    shipping_fee, tax_amount, discount_amount, coupon_code, coupon_discount,
    status, notes
  ) VALUES (
    user_id_val, '李四', 'li.si@example.com', '0987654321',
    'paypal', 'express',
    '{"street": "新北市板橋區文化路一段188號", "city": "新北市", "postal_code": "220"}',
    120.00, 150.00, 500.00, 'SUMMER2025', 1000.00,
    'confirmed', '折扣訂單 - 展示促銷 JSONB 結構'
  ) RETURNING id INTO order2_id;
  
  -- 建立訂單 3 (複雜促銷)
  INSERT INTO orders (
    user_id, contact_name, contact_email, contact_phone,
    payment_method, shipping_method, shipping_address,
    shipping_fee, tax_amount, discount_amount,
    status, notes
  ) VALUES (
    user_id_val, '王五', 'wang.wu@example.com', '0955123456',
    'bank_transfer', 'premium',
    '{"street": "台中市西屯區台灣大道三段99號", "city": "台中市", "postal_code": "407"}',
    0.00, 200.00, 0.00,
    'processing', '複雜促銷訂單 - 展示買X送Y等進階功能'
  ) RETURNING id INTO order3_id;
  
  -- 儲存訂單 IDs 供後續使用
  RAISE NOTICE 'Created orders: %, %, %', order1_id, order2_id, order3_id;
END $$;

-- 4. 使用舊方式直接插入一些訂單項目來測試自動觸發器
DO $$
DECLARE
  order1_id uuid;
  order2_id uuid;
  order3_id uuid;
  iphone_id uuid;
  macbook_id uuid;
  airpods_id uuid;
  ipad_id uuid;
  watch_id uuid;
BEGIN
  -- 取得必要的 IDs
  SELECT id INTO order1_id FROM orders WHERE notes LIKE '%一般購買%';
  SELECT id INTO order2_id FROM orders WHERE notes LIKE '%折扣訂單%';
  SELECT id INTO order3_id FROM orders WHERE notes LIKE '%複雜促銷%';
  
  SELECT id INTO iphone_id FROM products WHERE sku = 'IPHONE15PRO256';
  SELECT id INTO macbook_id FROM products WHERE sku = 'MACBOOKAIR13M3';
  SELECT id INTO airpods_id FROM products WHERE sku = 'AIRPODSPRO2';
  SELECT id INTO ipad_id FROM products WHERE sku = 'IPADAIR5WIFI';
  SELECT id INTO watch_id FROM products WHERE sku = 'AWSERIES9GPS45';
  
  -- 訂單 1: 插入基本項目 (測試自動觸發器)
  INSERT INTO order_items (
    order_id, product_id, quantity, unit_price, total_price,
    discount_amount, discount_reason, status
  ) VALUES 
  (order1_id, iphone_id, 1, 35900.00, 35900.00, 0.00, NULL, 'active'),
  (order1_id, airpods_id, 2, 7490.00, 14980.00, 749.00, '第二件 9 折', 'active');
  
  -- 訂單 2: 插入有折扣的項目
  INSERT INTO order_items (
    order_id, product_id, quantity, unit_price, total_price,
    discount_amount, discount_reason, status
  ) VALUES 
  (order2_id, macbook_id, 1, 34900.00, 32900.00, 2000.00, '新品上市特價', 'active'),
  (order2_id, ipad_id, 1, 18900.00, 17010.00, 1890.00, '滿額 9 折', 'active');
  
  RAISE NOTICE 'Basic order items created, auto-triggers should populate JSONB data';
END $$;

-- 5. 使用新的 JSONB 函數測試複雜促銷
DO $$
DECLARE
  order3_id uuid;
  airpods_id uuid;
  watch_id uuid;
  result jsonb;
BEGIN
  SELECT id INTO order3_id FROM orders WHERE notes LIKE '%複雜促銷%';
  SELECT id INTO airpods_id FROM products WHERE sku = 'AIRPODSPRO2';
  SELECT id INTO watch_id FROM products WHERE sku = 'AWSERIES9GPS45';
  
  -- 測試買五送一促銷
  SELECT create_buy_x_get_y_order_items(
    order3_id,
    airpods_id,
    5, -- 買 5 個
    1, -- 送 1 個
    7490.00, -- 單價
    gen_random_uuid(), -- 活動 ID
    '{"generation": "第二代", "features": "主動降噪", "color": "白色"}'
  ) INTO result;
  
  RAISE NOTICE '買五送一促銷結果: %', result->>'status';
  RAISE NOTICE '總折扣金額: % 元', result->>'total_discount';
  
  -- 測試組合包促銷
  SELECT create_order_item_with_promotion(
    order3_id,
    watch_id,
    2, -- 數量
    13900.00, -- 單價
    'bundle', -- 促銷類型
    '{"bundle_name": "Apple Watch 雙人組", "original_total": 27800, "bundle_price": 26800}', -- 促銷規則
    1000.00, -- 折扣金額
    gen_random_uuid(), -- 活動 ID
    '{"size": "45mm", "band": "運動型錶帶", "color": "午夜色"}'
  ) INTO result;
  
  RAISE NOTICE '組合包促銷結果: %', result->>'status';
  
END $$;

-- 6. 執行資料遷移函數確保一致性
SELECT migrate_existing_order_items_to_jsonb();

-- 7. 驗證創建的資料
SELECT 
  'DEMO DATA SUMMARY' as summary_type,
  (SELECT COUNT(*) FROM customers) as customers_count,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM order_items) as order_items_count,
  (SELECT COUNT(*) FROM order_items WHERE product_snapshot IS NOT NULL) as items_with_snapshots,
  (SELECT COUNT(*) FROM order_items WHERE promotion_data != '{}') as items_with_promotions;

-- 8. 顯示範例 JSONB 資料結構
SELECT 
  '=== 基本 JSONB 資料展示 ===' as section_title,
  id,
  quantity,
  unit_price,
  total_price,
  discount_amount,
  product_snapshot->'basic_info'->>'name' as product_name,
  product_snapshot->'basic_info'->>'sku' as product_sku,
  promotion_data->>'type' as promotion_type,
  promotion_data->'applied_discount'->>'reason' as discount_reason
FROM order_items
ORDER BY id;

-- 9. 展示複雜的 JSONB 查詢和統計
SELECT 
  '=== 促銷類型統計 ===' as analysis_title,
  promotion_data->>'type' as promotion_type,
  COUNT(*) as usage_count,
  SUM((promotion_data->'applied_discount'->>'amount')::numeric) as total_discount,
  AVG((promotion_data->'applied_discount'->>'amount')::numeric) as avg_discount
FROM order_items
WHERE promotion_data != '{}'
GROUP BY promotion_data->>'type'
ORDER BY usage_count DESC;

-- 10. 展示產品變體分析
SELECT 
  '=== 產品變體分析 ===' as analysis_title,
  product_snapshot->'basic_info'->>'name' as product_name,
  product_snapshot->'variant_info'->>'name' as variant_name,
  product_snapshot->'variant_info'->'attributes' as variant_attributes,
  COUNT(*) as sales_count,
  SUM(total_price) as total_revenue
FROM order_items
WHERE product_snapshot->'variant_info' IS NOT NULL
GROUP BY 
  product_snapshot->'basic_info'->>'name',
  product_snapshot->'variant_info'->>'name',
  product_snapshot->'variant_info'->'attributes'
ORDER BY total_revenue DESC;

-- 11. 測試向後相容性 View
SELECT 
  '=== 向後相容性驗證 ===' as compatibility_check,
  id,
  product_name,
  product_sku,
  discount_reason,
  (product_snapshot IS NOT NULL) as has_jsonb_data
FROM order_items_legacy_compatible
ORDER BY id
LIMIT 5;

-- 12. 執行資料完整性檢查
SELECT * FROM check_order_items_jsonb_integrity();

DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'DEMO DATA CREATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Studio URL: http://127.0.0.1:54323';
  RAISE NOTICE '';
  RAISE NOTICE 'Key features to explore in Studio:';
  RAISE NOTICE '1. Table Editor: Browse order_items to see JSONB columns';
  RAISE NOTICE '2. SQL Editor: Run complex JSONB queries';
  RAISE NOTICE '3. Test promotional functions';
  RAISE NOTICE '4. Verify data consistency';
  RAISE NOTICE '';
  RAISE NOTICE 'Example queries to try:';
  RAISE NOTICE '- SELECT product_snapshot FROM order_items WHERE id = 1;';
  RAISE NOTICE '- SELECT * FROM order_items WHERE promotion_data @> ''{\"type\": \"buy_x_get_y\"}'';';
  RAISE NOTICE '- SELECT create_buy_x_get_y_order_items(...);';
  RAISE NOTICE '==================================================';
END $$;