# JSONB 快照系統欄位參考文件

## 概述
本文件詳細說明 `order_items` 和 `orders` 表的 JSONB 快照欄位結構，包含所有物件屬性和相關聯的 views、functions。

---

## 🛍️ Order Items 表快照結構

### 表欄位概覽
```sql
-- 傳統欄位 (保持向後相容性)
product_id, quantity, unit_price, total_price, discount_amount, discount_reason,
product_name, product_description, product_sku, product_image_url,
variant_name, variant_attributes, status

-- JSONB 快照欄位
product_snapshot jsonb,     -- 產品完整快照
promotion_data jsonb        -- 促銷資料快照
```

### 🏷️ product_snapshot 結構
```json
{
  "basic_info": {
    "name": "產品名稱",
    "sku": "產品編號", 
    "description": "產品描述",
    "image_url": "產品圖片網址",
    "category_id": "分類ID"
  },
  "variant_info": {
    "name": "變體名稱",
    "attributes": {
      "color": "顏色",
      "size": "尺寸",
      "storage": "儲存容量",
      "memory": "記憶體",
      "connectivity": "連接方式"
    }
  },
  "pricing": {
    "unit_price": 1000.00,
    "currency": "TWD",
    "cost_price": 800.00,        // 可選
    "original_price": 1200.00    // 可選，原價
  },
  "inventory": {                 // 可選
    "stock_level": 100,
    "warehouse_location": "A1-B2"
  },
  "metadata": {
    "category_id": "UUID",
    "snapshot_time": "2025-07-13T10:30:00Z",
    "snapshot_version": "1.0",
    "data_source": "products_table"
  }
}
```

### promotion_data 結構
```json
{
  "type": "促銷類型",           // buy_x_get_y, bundle, legacy_discount, quantity_discount
  "rules": {
    // buy_x_get_y 類型
    "buy_quantity": 5,
    "get_quantity": 1,
    "get_discount_rate": 1.0,
    
    // bundle 類型  
    "bundle_name": "組合包名稱",
    "bundle_items": [...],
    "bundle_discount_rate": 0.1,
    
    // quantity_discount 類型
    "tiers": [
      {"min": 10, "max": 19, "rate": 0.05},
      {"min": 20, "rate": 0.1}
    ],
    
    // legacy_discount 類型
    "discount_type": "manual",
    "original_reason": "特殊折扣"
  },
  "campaign_info": {
    "campaign_id": "UUID",
    "campaign_name": "活動名稱", 
    "start_date": "2025-07-01",
    "end_date": "2025-07-31",
    "priority": 1
  },
  "applied_discount": {
    "amount": 200.00,
    "rate": 0.2,
    "reason": "買五送一促銷",
    "calculation_detail": {
      "original_total": 5000.00,
      "discount_applied": 1000.00,
      "final_total": 4000.00,
      "applied_at": "2025-07-13T10:30:00Z"
    }
  },
  "metadata": {
    "created_at": "2025-07-13T10:30:00Z",
    "created_by": "system",
    "promotion_version": "1.0"
  }
}
```

---

## Orders 表快照結構

### 表欄位概覽
```sql
-- 傳統欄位 (保持向後相容性)
user_id, contact_name, contact_email, contact_phone,
payment_method, shipping_method, shipping_address,
shipping_fee, tax_amount, discount_amount, coupon_code, coupon_discount,
total_amount, status, notes, special_instructions

-- JSONB 快照欄位
customer_snapshot jsonb,        -- 客戶完整快照
business_rules_snapshot jsonb,  -- 業務規則快照  
payment_snapshot jsonb          -- 支付規則快照
```

### 👤 customer_snapshot 結構
```json
{
  "customer_id": "UUID",
  "full_name": "客戶姓名",
  "email": "customer@example.com",
  "phone": "0912345678",
  "avatar_url": "頭像網址",
  "join_date": "2024-01-15T00:00:00Z",
  "email_verified": true,
  
  "statistics": {
    "total_orders": 15,
    "total_spent": 25000.00,
    "last_order_date": "2025-07-10T14:30:00Z",
    "avg_order_value": 1666.67,
    "membership_level": "GOLD"      // BRONZE, SILVER, GOLD, VIP
  },
  
  "preferences": {                  // 可選
    "language": "zh-TW",
    "currency": "TWD",
    "newsletter_subscribed": true,
    "sms_notifications": false
  },
  
  "addresses": [                    // 可選
    {
      "type": "shipping",
      "address": "台北市信義區...",
      "postal_code": "110",
      "is_default": true
    }
  ],
  
  "metadata": {
    "snapshot_time": "2025-07-13T10:30:00Z",
    "snapshot_version": "1.0", 
    "data_source": "customers_table",  // customers_table, order_inference
    "reliability": "HIGH"              // HIGH, MEDIUM, LOW (僅推斷資料)
  }
}
```

### 🏢 business_rules_snapshot 結構
```json
{
  "pricing_rules": {
    "currency": "TWD",
    "tax_rate": 0.05,
    "tax_included": true,
    "rounding_method": "round_to_cent",
    "decimal_places": 2
  },
  
  "shipping_rules": {
    "free_shipping_threshold": 1000,
    "shipping_methods": {
      "standard": {"fee": 80, "days": "3-5"},
      "express": {"fee": 120, "days": "1-2"}, 
      "premium": {"fee": 200, "days": "當日達"},
      "pickup": {"fee": 0, "days": "3-7"}
    },
    "weight_limit_kg": 30,
    "size_limit_cm": {
      "length": 60,
      "width": 40, 
      "height": 40
    }
  },
  
  "discount_rules": {
    "max_coupon_stack": 1,
    "max_member_discount_rate": 0.3,
    "min_order_amount": 100,
    "max_discount_amount": 10000,
    "coupon_combination_allowed": false
  },
  
  "return_policy": {
    "return_days": 7,
    "exchange_days": 14,
    "refund_processing_days": "3-5",
    "return_shipping_cost": 80,
    "free_return_threshold": 3000
  },
  
  "policy_version": "2025-Q3-v1.2",
  "effective_date": "2025-07-01",
  "next_review_date": "2025-10-01",
  
  "metadata": {
    "snapshot_time": "2025-07-13T10:30:00Z",
    "snapshot_version": "1.0",
    "data_source": "business_config"
  }
}
```

### 💳 payment_snapshot 結構
```json
{
  "available_methods": ["credit_card", "paypal", "bank_transfer", "cash_on_delivery"],
  
  "processing_fees": {
    "credit_card": 0.029,
    "paypal": 0.034,
    "bank_transfer": 0.01,
    "cash_on_delivery": 0
  },
  
  "payment_limits": {
    "credit_card": {"min": 100, "max": 100000},
    "paypal": {"min": 100, "max": 50000},
    "bank_transfer": {"min": 500, "max": 500000},
    "cash_on_delivery": {"min": 100, "max": 10000}
  },
  
  "refund_policies": {
    "full_refund_days": 7,
    "partial_refund_days": 30,
    "processing_time_days": "3-5",
    "refund_fee": 0,
    "auto_refund_threshold": 1000
  },
  
  "security_features": {
    "fraud_detection": true,
    "secure_payment": true,
    "encryption_level": "SSL_256",
    "pci_compliance": true
  },
  
  "third_party_config": {
    "paypal_enabled": true,
    "stripe_enabled": true,
    "ecpay_enabled": true,
    "line_pay_enabled": false
  },
  
  "metadata": {
    "snapshot_time": "2025-07-13T10:30:00Z",
    "snapshot_version": "1.0",
    "data_source": "payment_config"
  }
}
```

---

## 🔍 相關聯的 Views

### 1. order_items_legacy_compatible
```sql
-- 向後相容性 View，確保舊查詢正常運作
SELECT 
  id, order_id, product_id, quantity, unit_price, total_price,
  
  -- 從 JSONB 提取資料，fallback 到傳統欄位
  COALESCE(product_snapshot->'basic_info'->>'name', product_name) as product_name,
  COALESCE(product_snapshot->'basic_info'->>'sku', product_sku) as product_sku,
  COALESCE(product_snapshot->'basic_info'->>'description', product_description) as product_description,
  COALESCE(product_snapshot->'basic_info'->>'image_url', product_image_url) as product_image_url,
  
  -- 促銷資訊
  COALESCE(promotion_data->'applied_discount'->>'reason', discount_reason) as discount_reason,
  promotion_data->>'type' as promotion_type,
  
  -- 快照狀態
  product_snapshot IS NOT NULL as has_product_snapshot,
  promotion_data != '{}' as has_promotion_data
FROM order_items;
```

### 2. orders_with_snapshots  
```sql
-- Orders 快照資訊展示 View
SELECT 
  o.*,
  
  -- 從客戶快照提取常用資訊
  o.customer_snapshot->>'email' as snapshot_customer_email,
  o.customer_snapshot->>'full_name' as snapshot_customer_name,
  o.customer_snapshot->'statistics'->>'membership_level' as snapshot_membership_level,
  (o.customer_snapshot->'statistics'->>'total_orders')::integer as snapshot_total_orders,
  
  -- 從業務規則快照提取常用資訊
  (o.business_rules_snapshot->'pricing_rules'->>'tax_rate')::numeric as snapshot_tax_rate,
  (o.business_rules_snapshot->'shipping_rules'->>'free_shipping_threshold')::integer as snapshot_free_shipping_threshold,
  o.business_rules_snapshot->>'policy_version' as snapshot_policy_version,
  
  -- 從支付快照提取常用資訊
  o.payment_snapshot->'available_methods' as snapshot_payment_methods,
  
  -- 快照完整性指標
  o.customer_snapshot IS NOT NULL as has_customer_snapshot,
  o.business_rules_snapshot != '{}' as has_business_rules_snapshot,
  o.payment_snapshot != '{}' as has_payment_snapshot
FROM orders o;
```

---

## ⚙️ 核心函數列表

### Order Items 相關函數

#### 快照生成函數
```sql
-- 建立產品快照
create_product_snapshot(product_id, variant_name, variant_attributes, unit_price)

-- 建立促銷資料快照  
create_promotion_data(promotion_type, rules, discount_amount, campaign_id)
```

#### 訂單項目建立函數
```sql
-- 一般訂單項目
create_order_item_with_promotion(order_id, product_id, quantity, unit_price, promotion_type, rules, discount_amount, campaign_id, variant_info)

-- 買X送Y促銷項目
create_buy_x_get_y_order_items(order_id, product_id, buy_quantity, get_quantity, unit_price, campaign_id, variant_info)

-- 組合包促銷項目
create_bundle_order_items(order_id, bundle_config)
```

#### 監控函數
```sql
-- 完整性檢查
check_order_items_jsonb_integrity()

-- 促銷效果分析
analyze_promotion_effectiveness()
```

### Orders 相關函數

#### 快照生成函數
```sql
-- 客戶快照
create_customer_snapshot(customer_id)

-- 業務規則快照
create_business_rules_snapshot()

-- 支付規則快照  
create_payment_snapshot()

-- 完整快照組合
create_complete_order_snapshots(customer_id)

-- 從訂單資料推斷快照
infer_snapshots_from_order_data(contact_name, contact_email, contact_phone, shipping_fee, tax_amount, payment_method)
```

#### 訂單建立函數
```sql
-- 增強的訂單建立 (向後相容)
create_order_with_items(order_data, items, created_by)

-- 完整快照訂單建立
create_order_with_complete_snapshots(order_data, items, created_by, force_snapshot_refresh)

-- 簡易訂單建立
create_simple_order_with_snapshots(customer_id, contact_name, contact_email, ...)
```

#### 維護函數
```sql
-- 刷新訂單快照
refresh_order_snapshots(order_id)

-- 批量更新過期快照
batch_refresh_stale_order_snapshots(age_threshold, batch_size)

-- 遷移現有訂單
migrate_existing_orders_to_snapshots()
```

#### 監控函數
```sql
-- 快照覆蓋率分析
analyze_orders_snapshots_coverage()

-- 快照新鮮度檢查
check_orders_snapshots_freshness()

-- 完整性檢查
check_orders_jsonb_integrity()

-- 快照驗證
validate_order_snapshots(order_id)

-- 快速診斷
quick_orders_jsonb_diagnosis()
```

---

## 🔄 自動觸發器

### Order Items 觸發器
```sql
-- 自動填充 JSONB 資料
auto_populate_order_items_jsonb_on_insert

-- 同步 JSONB 與傳統欄位
sync_order_items_jsonb_with_legacy_fields

-- 一致性驗證
validate_order_items_jsonb_consistency
```

### Orders 觸發器
```sql
-- 自動填充快照
auto_populate_orders_snapshots_on_insert

-- 同步快照與傳統欄位
sync_orders_snapshots_with_legacy_fields

-- 一致性驗證
validate_orders_snapshots_consistency
```

---

## 索引結構

### Order Items 索引
```sql
-- GIN 索引 (支援 JSONB 查詢)
idx_order_items_product_snapshot_gin
idx_order_items_promotion_data_gin

-- BTREE 索引 (支援特定欄位查詢)
idx_order_items_product_sku
idx_order_items_promotion_type
idx_order_items_unit_price_range
```

### Orders 索引
```sql
-- GIN 索引
idx_orders_customer_snapshot_gin
idx_orders_business_rules_snapshot_gin
idx_orders_payment_snapshot_gin

-- BTREE 索引
idx_orders_customer_email
idx_orders_customer_membership
idx_orders_policy_version
idx_orders_tax_rate
idx_orders_payment_methods

-- 複合索引
idx_orders_snapshot_coverage
idx_orders_customer_and_status
```

---

## 使用範例

### 查詢範例

#### Order Items 查詢
```sql
-- 查詢特定產品的所有促銷
SELECT * FROM order_items 
WHERE product_snapshot->'basic_info'->>'sku' = 'IPHONE15PRO';

-- 查詢買X送Y促銷
SELECT * FROM order_items 
WHERE promotion_data @> '{"type": "buy_x_get_y"}';

-- 分析促銷效果
SELECT 
  promotion_data->>'type' as promotion_type,
  COUNT(*) as usage_count,
  SUM((promotion_data->'applied_discount'->>'amount')::numeric) as total_discount
FROM order_items 
WHERE promotion_data != '{}'
GROUP BY promotion_data->>'type';
```

#### Orders 查詢
```sql
-- 查詢 VIP 客戶訂單
SELECT * FROM orders 
WHERE customer_snapshot->'statistics'->>'membership_level' = 'VIP';

-- 查詢特定政策版本訂單
SELECT * FROM orders 
WHERE business_rules_snapshot->>'policy_version' = '2025-Q3-v1.2';

-- 查詢支援特定支付方式的訂單
SELECT * FROM orders 
WHERE payment_snapshot->'available_methods' @> '["paypal"]';
```

### 維護範例
```sql
-- 檢查系統健康狀況
SELECT * FROM quick_orders_jsonb_diagnosis();

-- 更新過期快照
SELECT batch_refresh_stale_order_snapshots(interval '30 days', 50);

-- 檢查完整性
SELECT * FROM check_orders_jsonb_integrity() WHERE severity = 'HIGH';
```

---

## 注意事項

1. **資料一致性**: JSONB 快照與傳統欄位可能存在不同步情況，優先使用 JSONB 資料
2. **效能考量**: 複雜 JSONB 查詢可能影響效能，建議使用適當索引
3. **向後相容性**: 所有傳統欄位和查詢方式持續支援
4. **快照新鮮度**: 定期檢查和更新快照，特別是客戶統計資料
5. **推斷資料**: 從訂單推斷的快照標記為低可靠性，建議優先使用完整客戶資料

---

*最後更新: 2025-07-13*  
*版本: 1.0*