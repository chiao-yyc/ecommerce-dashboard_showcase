# 通知系統約束機制說明

## 概述

這個文檔說明 NotificationType 與 RelatedEntityType 的約束機制，確保通知類型與關聯實體類型的邏輯一致性。

## 設計原則

1. **一對一對應**: 每個 NotificationType 都有唯一對應的 RelatedEntityType
2. **型別安全**: 編譯時和運行時都有約束檢查
3. **邏輯一致**: 所有同類型的通知都使用相同的實體類型
4. **維護性**: 新增通知類型時必須明確定義約束關係

## 約束關係映射

### 訂單相關 → ORDER

- `ORDER_NEW` - 新訂單通知
- `ORDER_HIGH_VALUE` - 高價值訂單警示
- `ORDER_PAYMENT_OVERDUE` - 付款逾期
- `ORDER_PAYMENT_FAILED` - 付款失敗
- `ORDER_CANCELLED` - 訂單取消
- `ORDER_SHIPPING_DELAYED` - 運送延遲

### 庫存相關 → PRODUCT

- `INVENTORY_LOW_STOCK` - 低庫存警告
- `INVENTORY_OUT_OF_STOCK` - 缺貨通知
- `INVENTORY_OVERSTOCK` - 庫存過多

### 客戶服務相關 → CONVERSATION

- `CUSTOMER_SERVICE_NEW_REQUEST` - 新客服請求
- `CUSTOMER_SERVICE_URGENT` - 緊急客服
- `CUSTOMER_SERVICE_OVERDUE` - 逾期客服
- `CUSTOMER_VIP_ISSUE` - VIP客戶問題 ⚠️ **修正**: 改為關聯到 CONVERSATION

> **說明**: VIP 問題原本關聯到 CUSTOMER，但為了保持客服問題的一致性，現在統一關聯到 CONVERSATION。VIP 狀態可透過 `metadata` 欄位區分。

### 財務金流相關 → ORDER

- `FINANCE_LARGE_TRANSACTION` - 大額交易
- `FINANCE_PAYMENT_ANOMALY` - 付款異常
- `FINANCE_REFUND_REQUEST` - 退款請求
- `FINANCE_REFUND_COMPLETED` - 退款完成

### 系統安全相關 → USER

- `SECURITY_UNUSUAL_LOGIN` - 異常登入
- `SECURITY_PERMISSION_CHANGED` - 權限變更
- `SECURITY_PASSWORD_REMINDER` - 密碼提醒
- `SECURITY_MULTIPLE_LOGIN_FAILURES` - 多次登入失敗

### 營運分析相關

- `ANALYTICS_SALES_TARGET_REACHED` → ORDER (銷售目標)
- `ANALYTICS_PERFORMANCE_DROP` → ORDER (績效下降)
- `ANALYTICS_HOT_PRODUCT` → PRODUCT (熱門產品)
- `ANALYTICS_CUSTOMER_CHURN_RISK` → CUSTOMER (客戶流失風險)

### 行銷活動相關 → USER (暫時)

- `MARKETING_CAMPAIGN_START` - 活動開始
- `MARKETING_CAMPAIGN_END` - 活動結束
- `MARKETING_CAMPAIGN_POOR_PERFORMANCE` - 活動效果不佳

### 系統維護相關 → USER (暫時)

- `SYSTEM_BACKUP_COMPLETED` - 備份完成
- `SYSTEM_UPDATE_REQUIRED` - 需要更新
- `SYSTEM_HEALTH_CHECK` - 健康檢查
- `SYSTEM_ERROR_ALERT` - 系統錯誤警告

> **注意**: 行銷和系統維護相關通知暫時關聯到 USER，未來可能需要新的實體類型如 CAMPAIGN 或 SYSTEM。

## 實施層級

### 1. TypeScript 型別層 (編譯時)

**文件**: `src/types/notification-constraints.ts`

- `NOTIFICATION_ENTITY_MAPPING`: 完整的約束映射
- `RequiredEntityType<T>`: 條件型別推斷
- `validateNotificationEntity()`: 驗證函數
- `getRequiredEntityType()`: 取得必要實體類型

**文件**: `src/types/notification.ts`

- 介面支援泛型約束: `CreateNotificationRequest<T>`, `Notification<T>`, etc.
- `relatedEntityType` 從可選改為必要欄位

### 2. 應用層 (運行時)

**文件**: `src/api/services/NotificationService.ts`

- 自動設定正確的 `relatedEntityType`
- 驗證約束關係，拒絕無效組合
- 詳細的錯誤訊息

**文件**: `src/composables/useNotification.ts`

- 開發模式約束警告
- 型別安全的參數定義

### 3. 驗證工具層

**文件**: `src/lib/notification-validators.ts`

- `NotificationValidator` 類別提供完整的驗證工具
- 開發模式警告和自動修復
- 系統完整性檢查
- 約束文檔生成

### 4. 資料庫層 (強制約束)

**文件**: `notify-sql/04_notification_constraints.sql`

- `notification_templates` 表新增 `required_entity_type` 欄位
- 觸發器 `validate_notification_entity_constraint()` 強制約束
- 完整性檢查函數 `check_notification_constraints_integrity()`
- 約束關係檢視 `notification_entity_constraints`

## 使用範例

### 正確用法

```typescript
// ✅ 自動設定正確的 relatedEntityType
await createNotification('order_new', {
  order_number: 'ORD-001',
  total_amount: 1250,
})

// ✅ 明確指定正確的約束
await createNotification(
  'inventory_low_stock',
  {
    product_name: '商品A',
    current_stock: 3,
  },
  {
    relatedEntityType: RelatedEntityType.PRODUCT,
    relatedEntityId: 'product-123',
  },
)

// ✅ 使用快速方法 (已內建正確約束)
await quickNotifications.orderNew({
  order_number: 'ORD-002',
  total_amount: 2500,
  orderId: 'order-456',
})
```

### 錯誤用法 (會被阻止)

```typescript
// ❌ 錯誤：order_new 不能使用 PRODUCT
await createNotification('order_new', data, {
  relatedEntityType: RelatedEntityType.PRODUCT, // 錯誤！
})
// 返回: { success: false, error: 'Invalid entity type...' }

// ❌ 錯誤：inventory_low_stock 不能使用 ORDER
await createNotification('inventory_low_stock', data, {
  relatedEntityType: RelatedEntityType.ORDER, // 錯誤！
})
// 返回: { success: false, error: 'Invalid entity type...' }
```

## 測試

**文件**: `src/tests/unit/notification-constraints.test.ts`

- 完整的約束驗證測試
- 邊界情況和錯誤處理
- 系統完整性驗證
- 約束映射完整性檢查

## 維護指南

### 新增通知類型時

1. 在 `NotificationType` 枚舉中添加新類型
2. 在 `NOTIFICATION_ENTITY_MAPPING` 中添加對應關係
3. 更新資料庫模板資料
4. 添加相應的測試案例

### 新增實體類型時

1. 在 `RelatedEntityType` 枚舉中添加新類型
2. 更新相關通知類型的映射
3. 更新資料庫約束和檢查函數
4. 更新測試和文檔

## 資料庫維護

### 應用約束

```sql
-- 執行約束機制設定
\i notify-sql/04_notification_constraints.sql
```

### 檢查系統完整性

```sql
-- 執行完整性檢查
SELECT * FROM check_notification_constraints_integrity();
```

### 查看約束關係

```sql
-- 查看所有約束關係
SELECT * FROM notification_entity_constraints;
```

## 故障排除

### 常見錯誤

1. **Invalid entity type**: 檢查約束映射是否正確
2. **Missing template**: 確保資料庫中有對應的通知模板
3. **Constraint violation**: 檢查現有資料是否符合新約束

### 除錯工具

```typescript
// 檢查系統完整性
import { checkNotificationSystemIntegrity } from '@/utils/notification-validators'
const result = checkNotificationSystemIntegrity()
console.log(result)

// 生成約束文檔
import { generateConstraintDocs } from '@/utils/notification-validators'
console.log(generateConstraintDocs())
```
