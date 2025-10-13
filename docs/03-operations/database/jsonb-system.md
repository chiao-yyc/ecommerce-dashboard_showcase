# JSONB 快照系統完整指南

## 🎉 部署狀態: **成功完成**

**部署日期**: 2025-07-13  
**系統版本**: 1.0  
**狀態**: ACTIVE  

---

## 系統概覽

### 核心組件
- **✅ Order Items 表**: 100% 產品快照覆蓋率
- **✅ Orders 表**: 100% 客戶快照覆蓋率  
- **✅ 35 個函數**: 包含快照生成、維護、監控功能
- **✅ 11 個觸發器**: 自動化數據同步和驗證
- **✅ 10 個 JSONB 索引**: 優化查詢效能
- **✅ 2 個視圖**: 向後相容性保證

### 健康狀況檢查結果
```
Order Items Coverage: EXCELLENT (100% coverage)
Orders Coverage: EXCELLENT (100% coverage)  
Data Integrity: GOOD (0 high severity issues)
Snapshot Freshness: GOOD (0 stale snapshots)
```

---

## 專案目標與成果

### 達成的核心目標
1. **完整的 JSONB 結構設計**：支援產品快照和促銷資料
2. **向後相容性**：現有功能不受影響
3. **複雜促銷支援**：買X送Y、單件折扣、組合包等
4. **自動化遷移**：安全的資料轉換機制
5. **效能優化**：適當的索引和查詢優化
6. **資料完整性**：全面的約束和驗證機制

---

## 表結構設計

### Order Items 表增強

#### 新增 JSONB 欄位
```sql
-- order_items 表新增欄位
ALTER TABLE order_items 
ADD COLUMN product_snapshot jsonb,
ADD COLUMN promotion_data jsonb DEFAULT '{}';
```

#### 產品快照結構 (product_snapshot)
```json
{
  "basic_info": {
    "name": "產品名稱",
    "sku": "PROD001", 
    "description": "產品描述",
    "image_url": "https://example.com/image.jpg"
  },
  "variant_info": {
    "name": "變體名稱",
    "attributes": {"size": "L", "color": "紅色"}
  },
  "pricing": {
    "unit_price": 100.00,
    "currency": "TWD"
  },
  "metadata": {
    "category_id": "uuid",
    "snapshot_time": "2025-07-13T10:30:00Z"
  }
}
```

#### 促銷資料結構 (promotion_data)
```json
{
  "type": "buy_x_get_y",
  "rules": {
    "buy_quantity": 5,
    "get_quantity": 1
  },
  "campaign_info": {
    "campaign_id": "uuid",
    "campaign_name": "活動名稱"
  },
  "applied_discount": {
    "amount": 200.00,
    "reason": "買五送一促銷"
  }
}
```

### Orders 表增強

#### 客戶快照結構 (customer_snapshot)
```json
{
  "basic_info": {
    "customer_id": "uuid",
    "full_name": "客戶姓名",
    "email": "customer@example.com",
    "phone": "0912345678"
  },
  "statistics": {
    "total_orders": 15,
    "total_spent": 25000.00,
    "avg_order_value": 1666.67,
    "membership_level": "VIP"
  },
  "preferences": {
    "language": "zh-TW",
    "currency": "TWD",
    "newsletter_subscribed": true
  }
}
```

#### 業務規則快照 (business_rules_snapshot)
```json
{
  "pricing_rules": {
    "tax_rate": 0.05,
    "currency": "TWD",
    "rounding_method": "ROUND_HALF_UP"
  },
  "shipping_rules": {
    "free_shipping_threshold": 1000.00,
    "available_methods": ["standard", "express"],
    "weight_limit": 30.0
  },
  "discount_rules": {
    "max_discount_percentage": 0.5,
    "coupon_stacking_allowed": false
  }
}
```

#### 支付快照 (payment_snapshot)
```json
{
  "available_methods": ["credit_card", "bank_transfer", "cash_on_delivery"],
  "processing_fees": {
    "credit_card": 0.03,
    "bank_transfer": 15.00
  },
  "payment_limits": {
    "min_amount": 1.00,
    "max_amount": 100000.00
  }
}
```

---

## 實現的功能

### Order Items 表功能
- **Product Snapshots**: 完整產品資訊快照，包含變體和定價
- **Promotion Data**: 豐富的促銷資料，支援買X送Y、組合包等複雜促銷
- **向後相容性**: 所有舊查詢和應用程式無縫運行

### Orders 表功能
- **Customer Snapshots**: 客戶完整資訊快照，包含統計和會員等級
- **Business Rules Snapshots**: 業務規則版本化管理
- **Payment Snapshots**: 支付政策歷史保存
- **自動推斷機制**: 無客戶資料時智能推斷快照

### 自動化功能
- **自動快照生成**: 新訂單/項目自動填充快照
- **資料同步**: JSONB 與傳統欄位雙向同步
- **一致性驗證**: 即時資料完整性檢查
- **稽核追蹤**: 完整的變更歷史記錄

---

## 核心函數

### 快照生成函數
```sql
-- 建立產品快照
SELECT create_product_snapshot(
  product_id,
  variant_name,
  variant_attributes,
  unit_price
);

-- 建立客戶快照
SELECT create_customer_snapshot(customer_id);

-- 建立業務規則快照
SELECT create_business_rules_snapshot();
```

### 促銷支援函數
```sql
-- 建立買X送Y促銷項目
SELECT create_buy_x_get_y_order_items(
  order_id,
  product_id,
  buy_quantity,
  get_quantity,
  unit_price,
  campaign_id,
  variant_attributes
);

-- 建立單件促銷項目
SELECT create_order_item_with_promotion(
  order_id,
  product_id,
  quantity,
  unit_price,
  promotion_type,
  promotion_rules,
  discount_amount,
  campaign_id,
  variant_attributes
);
```

### 資料完整性檢查
```sql
-- 檢查 Order Items JSONB 完整性
SELECT * FROM check_order_items_jsonb_integrity();

-- 檢查 Orders 快照完整性
SELECT * FROM check_orders_snapshot_integrity();
```

---

## 📈 效能優化

### 索引策略
```sql
-- JSONB GIN 索引
CREATE INDEX idx_order_items_product_snapshot_gin 
ON order_items USING GIN (product_snapshot);

-- 特定路徑 BTREE 索引
CREATE INDEX idx_order_items_product_name 
ON order_items USING BTREE ((product_snapshot->'basic_info'->>'name'));

-- 複合索引
CREATE INDEX idx_order_items_sku_status 
ON order_items USING BTREE ((product_snapshot->'basic_info'->>'sku'), status);
```

### 查詢優化範例
```sql
-- 高效的 JSONB 查詢
SELECT 
  id,
  product_snapshot->'basic_info'->>'name' as product_name,
  promotion_data->>'type' as promotion_type
FROM order_items 
WHERE product_snapshot->'basic_info'->>'sku' = 'PROD001'
AND promotion_data != '{}';
```

---

## 🔍 監控與維護

### 健康檢查
```sql
-- 系統健康概覽
SELECT * FROM get_jsonb_system_health();

-- 快照覆蓋率檢查
SELECT 
  COUNT(*) as total_items,
  COUNT(product_snapshot) as items_with_snapshots,
  ROUND(COUNT(product_snapshot) * 100.0 / COUNT(*), 2) as coverage_percentage
FROM order_items;
```

### 資料清理
```sql
-- 清理陳舊快照
SELECT cleanup_stale_snapshots();

-- 重建缺失的快照
SELECT rebuild_missing_snapshots();
```

---

## 向後相容性

### 相容性視圖
```sql
-- Order Items 相容性視圖
CREATE VIEW order_items_legacy_compatible AS
SELECT 
  id,
  order_id,
  product_id,
  quantity,
  unit_price,
  total_price,
  discount_amount,
  status,
  created_at,
  updated_at,
  -- 從 JSONB 提取傳統欄位
  COALESCE(product_snapshot->'basic_info'->>'name', product_name) as product_name,
  COALESCE(product_snapshot->'basic_info'->>'sku', product_sku) as product_sku,
  COALESCE(promotion_data->'applied_discount'->>'reason', discount_reason) as discount_reason
FROM order_items;
```

### 遷移策略
1. **階段一**: 新增 JSONB 欄位
2. **階段二**: 遷移現有資料到 JSONB
3. **階段三**: 更新應用程式使用 JSONB
4. **階段四**: 移除舊欄位（可選）

---

## 常用操作

### 資料查詢
```sql
-- 查詢特定促銷類型的訂單項目
SELECT * FROM order_items 
WHERE promotion_data->>'type' = 'buy_x_get_y';

-- 查詢特定客戶的訂單
SELECT * FROM orders 
WHERE customer_snapshot->'basic_info'->>'email' = 'customer@example.com';
```

### 資料更新
```sql
-- 更新產品快照
UPDATE order_items 
SET product_snapshot = jsonb_set(
  product_snapshot, 
  '{basic_info,name}', 
  '"新產品名稱"'
)
WHERE id = 1;
```

### 資料分析
```sql
-- 促銷效果分析
SELECT 
  promotion_data->>'type' as promotion_type,
  COUNT(*) as usage_count,
  SUM((promotion_data->'applied_discount'->>'amount')::numeric) as total_discount
FROM order_items 
WHERE promotion_data != '{}'
GROUP BY promotion_data->>'type';
```

---

## 最佳實踐

### 1. 快照設計原則
- **完整性**: 快照應包含所有必要資訊
- **一致性**: 快照格式應標準化
- **時效性**: 定期更新快照確保資料新鮮度

### 2. 效能考量
- **索引策略**: 針對常用查詢路徑建立索引
- **查詢優化**: 使用適當的 JSONB 操作符
- **資料大小**: 避免過大的 JSONB 物件

### 3. 維護建議
- **定期監控**: 使用健康檢查函數
- **資料清理**: 定期清理陳舊資料
- **備份策略**: 確保 JSONB 資料被完整備份

---

## 📞 故障排除

### 常見問題
1. **快照不完整**: 檢查觸發器和函數是否正常
2. **效能問題**: 檢查索引使用情況
3. **資料不一致**: 執行完整性檢查函數

### 緊急修復
```sql
-- 重建所有快照
SELECT rebuild_all_snapshots();

-- 修復資料不一致
SELECT repair_data_inconsistency();
```

---

**🎉 JSONB 快照系統已完全部署並準備投入生產使用！**

*更新日期: 2025-07-14*  
*文檔版本: 2.0*