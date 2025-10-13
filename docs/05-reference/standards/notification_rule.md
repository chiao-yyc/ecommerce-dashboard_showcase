# 通知系統架構說明

## 目錄

1. [系統概述](#系統概述)
2. [資料表架構](#資料表架構)
3. [核心概念](#核心概念)
4. [常用模板系統](#常用模板系統)
5. [完成策略管理](#完成策略管理)
6. [常見問題與解決方案](#常見問題與解決方案)
7. [手動建立通知方式](#手動建立通知方式)
8. [前端整合](#前端整合)
9. [開發指南](#開發指南)
10. [最佳實務](#最佳實務)

## 系統概述

本通知系統基於 Supabase 架構，採用模板驅動的設計模式，支援多種通知類型和分發方式。系統從原本的硬編碼架構重構為完全資料庫驅動，提供靈活的通知管理和自動化處理能力。

### 主要特色

- **模板驅動**: 所有通知基於可配置的模板系統
- **分類管理**: 支援資訊型 (informational) 和任務型 (actionable) 通知
- **智能完成**: 提供自動、建議、手動三種完成策略
- **實體約束**: 通過 `required_entity_type` 確保資料一致性
- **多種分發**: 支援個人、群組、角色、廣播等分發方式

## 資料表架構

### 1. notification_templates 表

通知模板是系統的核心，定義了所有通知的基本結構和行為。

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL UNIQUE,  -- 通知類型 (與前端32種類型對應)
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  default_priority notification_priority NOT NULL DEFAULT 'medium',
  default_channels notification_channel[] NOT NULL DEFAULT '{in_app}',
  required_entity_type TEXT,  -- 必要實體類型約束
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata_schema JSONB,
  category notification_category NOT NULL,  -- 'informational' | 'actionable'
  completion_strategy completion_strategy NOT NULL,  -- 'auto' | 'suggested' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
```

#### 主要欄位說明

| 欄位                   | 類型    | 說明                                     |
| ---------------------- | ------- | ---------------------------------------- |
| `type`                 | TEXT    | 通知類型，對應前端 NotificationType 枚舉 |
| `required_entity_type` | TEXT    | 必要的關聯實體類型，用於約束驗證         |
| `category`             | ENUM    | 通知分類 (informational/actionable)      |
| `completion_strategy`  | ENUM    | 完成策略 (auto/suggested/manual)         |
| `is_active`            | BOOLEAN | 模板是否啟用                             |

### 2. notifications 表

實際的通知記錄，繼承模板設定但允許覆蓋。

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  status notification_status NOT NULL DEFAULT 'unread',
  channels notification_channel[] NOT NULL DEFAULT '{in_app}',
  metadata JSONB,
  related_entity_type TEXT NOT NULL,  -- 關聯實體類型
  related_entity_id TEXT,  -- 關聯實體ID
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  category notification_category NOT NULL,
  completion_strategy completion_strategy NOT NULL,
  suggested_complete BOOLEAN NOT NULL DEFAULT false,
  suggested_at TIMESTAMPTZ,
  suggestion_reason TEXT,
  auto_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);
```

## 核心概念

### 通知分類 (Category)

#### Informational (資訊型)

- **用途**: 資訊推送，只需知悉
- **狀態流程**: unread → read → dismissed/archived
- **典型範例**: 系統備份完成、安全登入提醒、績效報告
- **UI 表現**: 藍色標籤，閱讀後可忽略

#### Actionable (任務型)

- **用途**: 需要處理的任務
- **狀態流程**: unread → read → completed/archived
- **典型範例**: 新訂單處理、庫存不足、客戶服務請求
- **UI 表現**: 橙色標籤，需要明確完成動作

### 完成策略 (Completion Strategy)

#### Auto (自動完成)

- **適用情境**: 系統狀態變更時自動觸發
- **範例**:
  - 庫存補充後自動完成缺貨通知
  - 訂單取消後自動完成相關處理通知
  - 系統備份完成後自動標記

#### Suggested (智能建議)

- **適用情境**: 系統檢測到相關變更，建議用戶完成
- **範例**:
  - 檢測到訂單狀態變更，建議完成新訂單通知
  - 檢測到庫存回補，建議完成低庫存警告
  - 檢測到客戶回應，建議完成客服請求

#### Manual (手動完成)

- **適用情境**: 需要人工判斷和處理
- **範例**:
  - 重要客戶問題需要確認處理完成
  - 逾期付款需要人工確認收款
  - 緊急客服問題需要主管確認

## 常用模板系統

### 模板優先級計分機制

系統使用智能計分機制來決定常用模板的優先順序，避免群發通知影響真實使用頻率：

#### 計分公式

```sql
priority_score =
  手動標記權重 (0-100) +           -- is_frequently_used
  時間權重 (0-50) +               -- 最近使用優先
  使用頻率權重 (0-50)             -- usage_count，但有上限避免群發影響
```

#### 權重說明

| 權重類型     | 分數範圍 | 計算邏輯                            | 用途             |
| ------------ | -------- | ----------------------------------- | ---------------- |
| **手動標記** | 0-100    | `is_frequently_used = true` 得100分 | 業務重要性標記   |
| **時間權重** | 0-50     | 7天內50分，30天內20分，超過0分      | 確保時效性       |
| **使用頻率** | 0-50     | `usage_count * 2`，上限50分         | 避免群發通知干擾 |

#### 使用方式

```sql
-- 查詢常用模板 (前5個)
SELECT * FROM frequently_used_templates LIMIT 5;

-- 手動標記常用模板
UPDATE notification_templates
SET is_frequently_used = true
WHERE type IN ('order_new', 'inventory_low_stock', 'customer_service_urgent');

-- 查看特定模板統計
SELECT
  type,
  usage_count,
  last_used_at,
  is_frequently_used,
  priority_score
FROM frequently_used_templates
WHERE type = 'order_new';
```

### 自動統計更新

系統透過觸發器自動維護使用統計：

```sql
CREATE OR REPLACE FUNCTION update_template_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- 每次創建通知時自動更新統計
  UPDATE notification_templates
  SET
    usage_count = usage_count + 1,
    last_used_at = NEW.created_at
  WHERE type = NEW.type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 完成策略管理

### 完成策略架構設計

完成策略決定通知的生命週期管理方式，系統支援三種策略：

#### 1. Auto (自動完成)

- **觸發條件**：系統狀態變更直接對應完成條件
- **實現方式**：資料庫觸發器自動設定 `auto_completed_at`
- **適用場景**：
  - 系統事件完成（備份、更新）
  - 狀態變更確定（訂單取消、退款完成）
  - 時間性事件（活動開始/結束）

#### 2. Suggested (智能建議)

- **觸發條件**：系統檢測到相關變更，建議用戶確認完成
- **實現方式**：設定 `suggested_complete = true` 和 `suggestion_reason`
- **適用場景**：
  - 業務流程變更（訂單狀態更新、庫存變更）
  - 用戶行為觸發（客戶回應、付款確認）
  - 系統檢測但需確認（性能改善、問題解決）

#### 3. Manual (手動完成)

- **觸發條件**：完全依賴用戶判斷
- **實現方式**：用戶主動標記完成
- **適用場景**：
  - 複雜業務判斷（VIP客戶問題、財務異常）
  - 安全相關事件（異常登入、權限變更）
  - 需要人工驗證（大額交易、合規檢查）

### completion_strategy 配置規則

#### 資料庫約束

```sql
-- completion_strategy 只能是以下三個值
ALTER TABLE notification_templates
ADD CONSTRAINT check_completion_strategy
CHECK (completion_strategy IN ('auto', 'suggested', 'manual'));
```

#### 模板設定範例

```sql
-- Auto: 系統自動完成
UPDATE notification_templates
SET completion_strategy = 'auto'
WHERE type IN (
  'system_backup_completed',
  'order_cancelled',
  'finance_refund_completed'
);

-- Suggested: 智能建議完成
UPDATE notification_templates
SET completion_strategy = 'suggested'
WHERE type IN (
  'order_new',
  'inventory_low_stock',
  'customer_service_new_request'
);

-- Manual: 手動完成
UPDATE notification_templates
SET completion_strategy = 'manual'
WHERE type IN (
  'order_payment_overdue',
  'security_unusual_login',
  'customer_vip_issue'
);
```

### 備註欄位維護

每個模板的 `completion_notes` 欄位記錄完成策略的邏輯說明：

```sql
-- 更新備註說明自動化邏輯
UPDATE notification_templates
SET completion_notes = '庫存補充時自動完成 (inventory_restock_trigger)'
WHERE type = 'inventory_out_of_stock';

UPDATE notification_templates
SET completion_notes = '訂單狀態變更時建議完成 (order_status_trigger)'
WHERE type = 'order_new';

UPDATE notification_templates
SET completion_notes = '需人工跟進客戶付款狀況'
WHERE type = 'order_payment_overdue';
```

## 常見問題與解決方案

### Q1: notifications.completion_strategy 與模板的關係？

**答案**：是的，完全繼承關係

```sql
-- 創建通知時自動複製模板設定
INSERT INTO notifications (completion_strategy, ...)
SELECT template.completion_strategy, ...
FROM notification_templates template
WHERE template.type = ?
```

**設計邏輯**：

- 模板定義預設策略
- 個別通知可覆蓋策略（特殊情況）
- 確保一致性和可預測性

### Q2: 如何處理常用模板被群發通知影響？

**問題描述**：

- 公告類通知會因接收人數多而 usage_count 暴增
- 不能反映模板的真實使用頻率

**解決方案 - 智能計分制**：

```sql
-- 使用頻率權重有上限，避免群發干擾
LEAST(COALESCE(t.usage_count, 0) * 2, 50) as frequency_weight

-- 手動標記權重更高，業務驅動優先
CASE WHEN t.is_frequently_used THEN 100 ELSE 0 END as manual_weight
```

### Q3: 如何維護 completion_notes 與實際邏輯同步？

**維護策略**：

1. **開發流程整合**：新增/修改 trigger 時同步更新備註
2. **定期檢查**：每月檢查備註與實際邏輯一致性
3. **文件化規範**：標準化備註格式

**備註格式規範**：

```sql
-- Auto: 描述觸發條件和觸發器名稱
'庫存補充時自動完成 (inventory_restock_trigger)'

-- Suggested: 描述建議條件和觸發器名稱
'訂單狀態變更時建議完成 (order_status_trigger)'

-- Manual: 描述人工判斷原因
'需人工跟進客戶付款狀況'
```

### Q4: 前端程式碼期望的模板不存在怎麼辦？

**檢測方法**：

```typescript
// 前端驗證模板存在性
const { validateNotificationType } = useNotificationTypeValidation()
const validation = await validateNotificationType('order_payment_failed')

if (!validation.isValid) {
  console.error('模板不存在:', validation.error)
}
```

**解決步驟**：

1. 執行 `template_add_miss.sql` 補充缺少模板
2. 檢查前端類型定義與資料庫同步
3. 更新相關觸發器和自動化邏輯

### Q5: 如何決定新模板的 completion_strategy？

**決策流程圖**：

```
新通知類型
    ↓
系統能自動判斷完成？
    ↓ 是                     ↓ 否
  AUTO                需要用戶確認？
                        ↓ 是      ↓ 否
                    SUGGESTED   MANUAL
```

**具體判斷標準**：

| 條件                 | 策略      | 範例                   |
| -------------------- | --------- | ---------------------- |
| 系統狀態直接對應完成 | AUTO      | 備份完成、退款完成     |
| 可檢測變更但需確認   | SUGGESTED | 訂單狀態變更、庫存補充 |
| 需要複雜人工判斷     | MANUAL    | VIP問題、安全事件      |

## 階段式實現計劃

### 所有模板實現狀態

#### ✅ Phase 0: 已實現模板 (12個)

**目前資料庫中的模板**：

1. `inventory_low_stock` - ✅ 有觸發器支援
2. `inventory_out_of_stock` - ✅ 有觸發器支援
3. `order_high_value` - ✅ 有觸發器支援
4. `order_new` - ✅ 有觸發器支援
5. `security_permission_changed` - ✅ 基礎支援
6. `company_announcement` - ✅ 基礎支援
7. `customer_service_new_request` - ✅ 有觸發器支援
8. `system_maintenance` - ✅ 基礎支援
9. `project_update` - ✅ 基礎支援
10. `security_alert` - ✅ 基礎支援
11. `policy_update` - ✅ 基礎支援
12. `customer_service_urgent` - ✅ 有觸發器支援

#### Phase 1: 立即可實現 (3個)

**可透過現有觸發器實現**：

1. `inventory_overstock` - ✅ notify_inventory_events 支援
2. `customer_service_overdue` - ✅ notify_customer_service_events 支援
3. `order_cancelled` - ✅ notify_order_events 支援

#### ⏳ Phase 2: 基礎業務邏輯 (6個)

**需要簡單的業務邏輯擴展**：

1. `order_payment_overdue` - 需付款到期日檢查
2. `order_payment_failed` - 需付款失敗事件捕獲
3. `order_shipping_delayed` - 需出貨時間追蹤
4. `customer_vip_issue` - 需VIP客戶標記整合
5. `finance_refund_request` - 需退款申請流程
6. `finance_refund_completed` - 需退款完成事件

#### Phase 3: 安全監控 (3個)

**需要安全系統整合**：

1. `security_unusual_login` - 需登入行為分析
2. `security_password_reminder` - 需密碼政策整合
3. `security_multiple_login_failures` - 需登入失敗追蹤

#### 💰 Phase 4: 金融風控 (2個)

**需要風控系統開發**：

1. `finance_large_transaction` - 需交易額度監控
2. `finance_payment_anomaly` - 需異常檢測算法

#### Phase 5: 分析系統 (4個)

**需要分析引擎開發**：

1. `analytics_sales_target_reached` - 需銷售追蹤系統
2. `analytics_performance_drop` - 需效能監控系統
3. `analytics_hot_product` - 需產品趨勢分析
4. `analytics_customer_churn_risk` - 需客戶行為分析

#### 📢 Phase 6: 行銷自動化 (3個)

**需要行銷系統整合**：

1. `marketing_campaign_start` - 需活動管理系統
2. `marketing_campaign_end` - 需活動生命週期追蹤
3. `marketing_campaign_poor_performance` - 需活動效果分析

#### Phase 7: 系統運維 (3個)

**需要運維系統整合**：

1. `system_backup_completed` - 需備份系統整合
2. `system_update_required` - 需更新管理系統
3. `system_health_check` - 需健康檢查系統
4. `system_error_alert` - 需錯誤監控系統

### 前端註解指南

**建議在前端 NotificationType enum 中註解未實現的類型**：

```typescript
// types/notification.ts
export enum NotificationType {
  // ✅ Phase 0 & 1: 已實現
  ORDER_NEW = 'order_new',
  ORDER_HIGH_VALUE = 'order_high_value',
  INVENTORY_LOW_STOCK = 'inventory_low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory_out_of_stock',
  INVENTORY_OVERSTOCK = 'inventory_overstock', // Phase 1
  CUSTOMER_SERVICE_NEW_REQUEST = 'customer_service_new_request',
  CUSTOMER_SERVICE_URGENT = 'customer_service_urgent',
  CUSTOMER_SERVICE_OVERDUE = 'customer_service_overdue', // Phase 1
  ORDER_CANCELLED = 'order_cancelled', // Phase 1

  // ⏳ Phase 2: 開發中 - 基礎業務邏輯
  // ORDER_PAYMENT_OVERDUE = 'order_payment_overdue',
  // ORDER_PAYMENT_FAILED = 'order_payment_failed',
  // ORDER_SHIPPING_DELAYED = 'order_shipping_delayed',

  // 🔒 Phase 3: 未來實現 - 安全監控
  // SECURITY_UNUSUAL_LOGIN = 'security_unusual_login',
  // SECURITY_PASSWORD_REMINDER = 'security_password_reminder',
  // SECURITY_MULTIPLE_LOGIN_FAILURES = 'security_multiple_login_failures',

  // 💰 Phase 4: 未來實現 - 金融風控
  // FINANCE_LARGE_TRANSACTION = 'finance_large_transaction',
  // FINANCE_PAYMENT_ANOMALY = 'finance_payment_anomaly',

  // 📊 Phase 5: 未來實現 - 分析系統
  // ANALYTICS_SALES_TARGET_REACHED = 'analytics_sales_target_reached',
  // ANALYTICS_PERFORMANCE_DROP = 'analytics_performance_drop',
  // ANALYTICS_HOT_PRODUCT = 'analytics_hot_product',
  // ANALYTICS_CUSTOMER_CHURN_RISK = 'analytics_customer_churn_risk',

  // 📢 Phase 6: 未來實現 - 行銷自動化
  // MARKETING_CAMPAIGN_START = 'marketing_campaign_start',
  // MARKETING_CAMPAIGN_END = 'marketing_campaign_end',
  // MARKETING_CAMPAIGN_POOR_PERFORMANCE = 'marketing_campaign_poor_performance',

  // 🔧 Phase 7: 未來實現 - 系統運維
  // SYSTEM_BACKUP_COMPLETED = 'system_backup_completed',
  // SYSTEM_UPDATE_REQUIRED = 'system_update_required',
  // SYSTEM_HEALTH_CHECK = 'system_health_check',
  // SYSTEM_ERROR_ALERT = 'system_error_alert',
}
```

### 📈 實現優先級建議

1. **立即執行**: Phase 1 (3個模板) - 提升基礎功能完整性
2. **近期規劃**: Phase 2 (6個模板) - 完善核心業務流程
3. **中期目標**: Phase 3-4 (5個模板) - 強化安全和風控
4. **長期願景**: Phase 5-7 (10個模板) - 建立智能化運營

每個階段完成後，相應的前端類型定義可以解除註解並投入使用。

### 實體約束 (Entity Constraint)

透過 `required_entity_type` 和觸發器確保資料一致性：

```sql
-- 驗證函數範例
CREATE OR REPLACE FUNCTION validate_notification_entity_constraint()
RETURNS TRIGGER AS $$
BEGIN
  -- 檢查通知類型是否需要特定實體類型
  IF EXISTS (
    SELECT 1 FROM notification_templates
    WHERE type = NEW.type
    AND required_entity_type IS NOT NULL
    AND required_entity_type != NEW.related_entity_type
  ) THEN
    RAISE EXCEPTION 'Invalid entity type for notification type %', NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 手動建立通知方式

### 1. 個人通知 (Direct Notification)

直接為特定用戶創建通知，適用於精確的個別通知。

#### SQL 方式

```sql
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  related_entity_type,
  related_entity_id,
  category,
  completion_strategy
) VALUES (
  'user-uuid',
  'order_new',
  '新訂單 #ORD-2024-001',
  '您有一筆新訂單需要處理，金額：$1,250',
  'high',
  'order',
  'order-uuid',
  'actionable',
  'suggested'
);
```

#### 前端 API 調用

```typescript
import { useNotification } from '@/composables/useNotification'

const { quickNotifications } = useNotification(userId)

// 訂單相關通知
await quickNotifications.orderNew({
  order_number: 'ORD-2024-001',
  total_amount: 1250.0,
  orderId: 'order-uuid',
})
```

### 2. 群組通知 (Group Notification)

使用 `create_group_notification` 函數進行批量分發。

#### 角色通知 (Role-based)

```sql
SELECT create_group_notification(
  'role',
  'admin',  -- 角色名稱
  'system_update_required',
  '系統維護通知',
  '系統將於今晚進行維護',
  'high',
  '{"maintenance_window": "22:00-24:00"}'::jsonb
);
```

#### 廣播通知 (Broadcast)

```sql
SELECT create_group_notification(
  'broadcast',
  NULL,  -- 廣播不需要指定目標
  'company_announcement',
  '重要公告',
  '新的員工福利政策即將生效',
  'medium',
  NULL
);
```

#### 自訂群組 (Custom Group)

```sql
SELECT create_group_notification(
  'custom',
  'user1-uuid,user2-uuid,user3-uuid',  -- 逗號分隔的用戶ID
  'team_notification',
  '團隊會議',
  '明天下午2點團隊會議',
  'medium',
  '{"meeting_room": "A101", "duration": "1h"}'::jsonb
);
```

### 3. 智能通知 (Smart Notification)

結合路由規則自動決定分發方式，可同時創建群組和個人通知。

```sql
SELECT create_smart_notification(
  'customer_service_urgent',
  '緊急客服問題',
  '重要客戶反映產品問題',
  'urgent',
  '{"customer_tier": "VIP", "issue_type": "product_defect"}'::jsonb
);
```

智能路由會根據配置的規則：

- 立即通知所有客服人員 (角色通知)
- 通知相關產品經理 (個人通知)
- 如果是 VIP 客戶，額外通知客服主管

## 前端整合

### NotificationAddView.vue

主要的手動通知創建介面，包含：

- **個人通知表單**: 支援類型選擇、優先級設定、模板預覽
- **群組通知頁籤**: 分別處理角色、廣播、自訂群組通知
- **驗證機制**: 整合模板驗證和表單驗證
- **即時反饋**: Toast 通知和錯誤處理

#### 關鍵功能

```vue
<template>
  <!-- 通知類型選擇 -->
  <NotificationTypeSelect
    v-model="testForm.type"
    :options="typeOptions"
    :group-by-entity="true"
    placeholder="選擇通知類型"
    :disabled="!hasActiveTemplates"
  />

  <!-- 模板信息預覽 -->
  <div v-if="selectedTemplate" class="template-preview">
    <Badge :class="categoryBadgeClass">
      {{ selectedTemplate.category === 'actionable' ? '任務型' : '資訊型' }}
    </Badge>
    <Badge variant="outline">
      {{ selectedTemplate.completionStrategy }}
    </Badge>
  </div>
</template>
```

### API 服務

#### NotificationApiService

- `getActiveTemplatesByCategory()`: 獲取分類模板
- `validateNotificationType()`: 驗證通知類型
- `getCategoryDisplayName()`: 統一的分類名稱映射

#### RoleApiService

- `getRoleOptions()`: 獲取角色選項
- `roleExists()`: 檢查角色是否存在

### Composables

#### useNotificationTemplates

```typescript
const {
  loading,
  error,
  typeOptions,
  hasActiveTemplates,
  getTemplateByType,
  validateNotificationType,
} = useNotificationTemplates()
```

#### useNotificationTypeValidation

```typescript
const { validateAndGetTemplate } = useNotificationTypeValidation()

const validation = await validateAndGetTemplate(notificationType)
if (validation.isValid) {
  // 使用 validation.template 的資訊
}
```

### 可重複使用元件

#### NotificationTypeSelect

- 實體類型分組顯示
- 分類標籤 (資訊型/任務型)
- 模板描述預覽
- 禁用狀態處理

## 開發指南

### 添加新通知類型

#### 完整流程

新增通知類型需要同步更新前端定義、分類映射和資料庫模板：

1. **更新前端枚舉**

```typescript
// types/notification.ts
export enum NotificationType {
  // 新增類型
  NEW_FEATURE_ANNOUNCEMENT = 'new_feature_announcement',
}
```

2. **添加分類映射**

```typescript
// types/notification-categories.ts
export const NOTIFICATION_CATEGORY_MAPPING = {
  [NotificationType.NEW_FEATURE_ANNOUNCEMENT]:
    NotificationCategory.INFORMATIONAL,
  // ...
}

export const NOTIFICATION_COMPLETION_STRATEGY = {
  [NotificationType.NEW_FEATURE_ANNOUNCEMENT]: CompletionStrategy.MANUAL,
  // ...
}
```

3. **創建對應模板**

```sql
INSERT INTO notification_templates (
  type,
  title_template,
  message_template,
  default_priority,
  category,
  completion_strategy,
  required_entity_type,
  completion_notes,
  is_frequently_used
) VALUES (
  'new_feature_announcement',
  '新功能發布：{feature_name}',
  '我們很高興宣布 {feature_name} 功能正式上線！{description}',
  'medium',
  'informational',
  'manual',
  'feature',  -- 如果需要關聯實體
  '新功能發布需手動確認用戶已知悉',
  false  -- 根據預期使用頻率設定
);
```

#### 新增模板時的檢查清單

- [ ] 前端類型定義已更新
- [ ] 分類映射已配置
- [ ] completion_strategy 已根據業務邏輯選擇
- [ ] completion_notes 已填寫說明
- [ ] is_frequently_used 已根據預期設定
- [ ] required_entity_type 已正確約束
- [ ] 相關觸發器邏輯已實現（如果是 auto/suggested）

#### 測試新模板

使用 NotificationAddView.vue 測試：

1. 選擇新的通知類型
2. 檢查模板資訊預覽是否正確
3. 填寫測試資料並創建通知
4. 驗證通知顯示和完成行為

### 模板管理

#### 創建模板的考量點

1. **標題和內容模板**: 使用 `{{variable}}` 語法支援動態替換
2. **實體約束**: 根據業務邏輯設定 `required_entity_type`
3. **分類選擇**:
   - 需要用戶處理 → actionable
   - 僅供知悉 → informational
4. **完成策略**:
   - 系統可自動判斷完成 → auto
   - 可檢測變更但需確認 → suggested
   - 完全人工判斷 → manual

#### 模板測試

使用 NotificationAddView.vue 進行測試：

1. 選擇通知類型
2. 檢查模板資訊預覽
3. 填寫測試資料
4. 創建測試通知
5. 驗證通知顯示和行為

### 性能考量

1. **模板快取**: useNotificationTemplates 會快取已載入的模板
2. **分組查詢**: getActiveTemplatesByCategory 一次載入所有分類
3. **驗證優化**: 客戶端先驗證，減少伺服器請求
4. **懶載入**: 角色資料按需載入

## 最佳實務

### 模板設計原則

1. **一致性**: 同類型通知使用相似的標題格式
2. **簡潔性**: 標題控制在 50 字以內，內容控制在 200 字以內
3. **可讀性**: 使用清晰的變數名稱，如 `{{customer_name}}` 而非 `{{c_name}}`
4. **國際化**: 預留多語言支援的模板結構

### 分類選擇指南

| 情境         | 分類          | 理由         |
| ------------ | ------------- | ------------ |
| 新訂單通知   | actionable    | 需要處理訂單 |
| 付款逾期     | actionable    | 需要催收動作 |
| 庫存不足     | actionable    | 需要補貨處理 |
| 系統維護公告 | informational | 僅供知悉     |
| 生日祝福     | informational | 無需處理     |
| 安全登入提醒 | informational | 無需處理     |

### 完成策略選擇

| 策略      | 適用情境         | 範例               |
| --------- | ---------------- | ------------------ |
| auto      | 系統狀態直接對應 | 備份完成、訂單取消 |
| suggested | 可檢測但需確認   | 訂單發貨、客戶回應 |
| manual    | 需要人工判斷     | VIP 問題、財務異常 |

### 錯誤處理

1. **前端驗證**: 表單提交前驗證必要欄位
2. **類型驗證**: 檢查通知類型是否有對應模板
3. **權限檢查**: 確認用戶有權限發送群組通知
4. **優雅降級**: API 失敗時提供備用提示

### 監控和維護

#### 模板使用統計監控

```sql
-- 查看所有模板使用統計
SELECT
  type,
  usage_count,
  last_used_at,
  is_frequently_used,
  completion_strategy,
  completion_notes
FROM notification_templates
ORDER BY usage_count DESC;

-- 查看常用模板排名
SELECT
  type,
  priority_score,
  actual_usage_count,
  is_frequently_used,
  last_used_at
FROM frequently_used_templates
LIMIT 10;
```

#### 完成策略效果分析

```sql
-- 分析不同策略的完成率
SELECT
  completion_strategy,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as completion_rate
FROM notifications
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY completion_strategy;

-- 分析建議完成的接受率
SELECT
  type,
  COUNT(CASE WHEN suggested_complete = true THEN 1 END) as suggested_count,
  COUNT(CASE WHEN suggested_complete = true AND status = 'completed' THEN 1 END) as accepted_count,
  ROUND(
    COUNT(CASE WHEN suggested_complete = true AND status = 'completed' THEN 1 END) * 100.0 /
    NULLIF(COUNT(CASE WHEN suggested_complete = true THEN 1 END), 0),
    2
  ) as acceptance_rate
FROM notifications
WHERE completion_strategy = 'suggested'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY type
ORDER BY acceptance_rate DESC;
```

#### 定期維護任務

1. **每週**：
   - 檢查新增通知類型是否需要模板
   - 分析使用頻率，調整 `is_frequently_used`
   - 檢視完成率異常的通知類型

2. **每月**：
   - 更新 `completion_notes` 與實際邏輯同步
   - 分析 completion_strategy 效果，優化策略
   - 清理過期或無效的模板

3. **每季**：
   - 全面檢視通知系統效能
   - 用戶體驗反饋分析
   - 系統架構優化評估

#### 故障排除

**常見問題診斷**：

```sql
-- 檢查是否有通知使用不存在的模板
SELECT DISTINCT n.type
FROM notifications n
LEFT JOIN notification_templates t ON n.type = t.type
WHERE t.type IS NULL;

-- 檢查觸發器函數是否正常運作
SELECT
  schemaname,
  tablename,
  triggername,
  tgenabled
FROM pg_trigger pt
JOIN pg_class pc ON pt.tgrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pc.relname IN ('notifications', 'notification_templates');

-- 檢查模板統計是否正常更新
SELECT
  type,
  usage_count,
  last_used_at,
  (SELECT COUNT(*) FROM notifications WHERE type = nt.type) as actual_usage
FROM notification_templates nt
WHERE usage_count != (SELECT COUNT(*) FROM notifications WHERE type = nt.type);
```

---

## 相關文件

- [前端類型定義](../src/types/notification.ts)
- [API 服務文件](../src/api/services/NotificationApiService.ts)
- [Composable 使用指南](../src/composables/useNotificationTemplates.ts)
- [元件文件](../src/components/notify/NotificationTypeSelect.vue)
- [SQL 腳本文件](../notify-sql/)
- [完整模板補充腳本](../notify-sql/template_add_miss.sql)
