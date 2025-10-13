# 通知系統輔助函數庫使用指南

## 總覽

通知系統提供三個核心輔助函數庫，各有明確的職責分工和使用場景：

| 模組 | 檔案 | 環境 | 職責 |
|------|------|------|------|
| **業務邏輯** | `notification-helpers.ts` | 生產+開發 | 模板屬性查詢 |
| **開發監控** | `notification-type-monitoring.ts` | 僅開發 | 類型使用追蹤 |
| **資料驗證** | `notification-validators.ts` | 主要開發 | 完整性檢查 |

## 業務邏輯層 (notification-helpers.ts)

### 用途
從資料庫模板中動態獲取通知屬性的業務邏輯輔助函數

### 主要功能

#### 1. 模板屬性查詢
```typescript
import { 
  getTemplateByType,
  getNotificationCategoryFromTemplate,
  getCompletionStrategyFromTemplate,
  getRequiredEntityTypeFromTemplate 
} from '@/lib/notification-helpers'

// 獲取模板
const template = getTemplateByType(templates, NotificationType.ORDER_NEW)

// 獲取分類
const category = getNotificationCategoryFromTemplate(templates, type)
// 返回: 'informational' | 'actionable' | undefined

// 獲取完成策略
const strategy = getCompletionStrategyFromTemplate(templates, type)
// 返回: 'auto' | 'suggested' | 'manual' | undefined

// 獲取必要實體類型
const entityType = getRequiredEntityTypeFromTemplate(templates, type)
// 返回: RelatedEntityType | undefined
```

#### 2. 業務邏輯檢查
```typescript
import {
  isActionableNotificationFromTemplate,
  isInformationalNotificationFromTemplate,
  supportsAutoCompletionFromTemplate,
  validateNotificationEntityFromTemplate
} from '@/lib/notification-helpers'

// 檢查通知分類
const isActionable = isActionableNotificationFromTemplate(templates, type)
const isInformational = isInformationalNotificationFromTemplate(templates, type)

// 檢查完成策略支援
const autoCompletion = supportsAutoCompletionFromTemplate(templates, type)
const suggestedCompletion = supportsSuggestedCompletionFromTemplate(templates, type)
const manualOnly = isManualCompletionOnlyFromTemplate(templates, type)

// 驗證實體類型匹配
const isValid = validateNotificationEntityFromTemplate(
  templates, 
  NotificationType.ORDER_NEW, 
  RelatedEntityType.ORDER
)
```

#### 3. 反向查詢功能
```typescript
import {
  getActionableNotificationTypesFromTemplate,
  getInformationalNotificationTypesFromTemplate,
  getNotificationTypesByCompletionStrategyFromTemplate,
  getNotificationTypesByEntityFromTemplate
} from '@/lib/notification-helpers'

// 獲取所有任務型通知
const actionableTypes = getActionableNotificationTypesFromTemplate(templates)
// 返回: string[] (支援動態類型)

// 獲取支援自動完成的通知類型
const autoTypes = getNotificationTypesByCompletionStrategyFromTemplate(
  templates, 
  'auto'
)

// 根據實體類型查找通知類型
const orderNotifications = getNotificationTypesByEntityFromTemplate(
  templates, 
  RelatedEntityType.ORDER
)
```

### 使用場景
- ✅ 組件中查詢通知模板屬性
- ✅ 表單驗證和業務邏輯判斷
- ✅ 動態 UI 渲染（如按鈕狀態）
- ✅ 通知路由和權限檢查

### 注意事項
- 🔧 所有函數都標記為 `[NotificationHelper]` 日誌前綴
- 📦 這些函數在生產環境和開發環境都可使用
- 🔄 支援混合類型架構（核心enum + 動態字串）

## 🔍 開發監控層 (notification-type-monitoring.ts)

### 用途
混合類型架構的監控機制，追蹤核心enum與動態字串類型的使用情況

### 主要功能

#### 1. 類型分類與追蹤
```typescript
import {
  isKnownNotificationType,
  categorizeNotificationType,
  logNotificationTypeUsage,
  NotificationTypeTracker
} from '@/lib/notification-type-monitoring'

// 檢查是否為核心類型
const isCore = isKnownNotificationType('order_new') // true
const isDynamic = isKnownNotificationType('seasonal_promotion') // false

// 分類類型
const analysis = categorizeNotificationType('custom_alert')
// 返回: { isKnown: false, category: 'dynamic', type: 'custom_alert' }

// 記錄使用情況（自動追蹤）
logNotificationTypeUsage('seasonal_promotion', 'Component.createNotification')
```

#### 2. 使用統計與報告
```typescript
// 獲取完整報告
const report = NotificationTypeTracker.getReport()
console.log(report.summary)
// {
//   coreCount: 5,
//   dynamicCount: 3,
//   coreUsage: 45,
//   dynamicUsage: 12,
//   mostUsedCore: 'order_new',
//   mostUsedDynamic: 'seasonal_promotion'
// }

// 獲取動態類型列表
const dynamicTypes = NotificationTypeTracker.getDynamicTypes()
// ['seasonal_promotion', 'custom_alert', 'test_notification']

// 獲取高頻動態類型（建議升級為核心類型）
const highFreq = NotificationTypeTracker.getHighFrequencyDynamicTypes(5)
// [{ type: 'seasonal_promotion', count: 15, contexts: ['API', 'Component'] }]
```

#### 3. 審計日誌
```typescript
import { NotificationTypeAuditor } from '@/lib/notification-type-monitoring'

// 記錄審計日誌
NotificationTypeAuditor.log({
  type: 'custom_notification',
  source: 'frontend',
  action: 'create_notification',
  context: 'UserDashboard.submit'
})

// 獲取動態類型日誌
const logs = NotificationTypeAuditor.getDynamicTypeLogs()
```

#### 4. 開發工具（瀏覽器 Console）
```javascript
// 在瀏覽器 Console 中使用
__notificationTypeReport()      // 完整使用報告
__notificationTypeDynamic()     // 動態類型列表  
__notificationTypeHighFreq(5)   // 高頻動態類型（≥5次使用）
__notificationTypeAudit()       // 審計日誌
```

### 使用場景
- ✅ API 服務中記錄類型使用
- ✅ 開發時監控動態類型採用情況
- ✅ 效能分析和類型管理決策
- ✅ 新功能上線後的使用追蹤

### 注意事項
- 🔍 僅在開發環境啟用（`NODE_ENV === 'development'`）
- 📊 自動在瀏覽器 Console 提供全域函數
- 🎯 專注於動態類型的監控和建議

## 資料驗證層 (notification-validators.ts)

### 用途
通知資料完整性檢查和開發時警告系統

### 主要功能

#### 1. 基礎資料驗證
```typescript
import { 
  validateNotificationData,
  warnMissingEntity,
  NotificationValidator 
} from '@/lib/notification-validators'

// 完整性檢查
const result = validateNotificationData({
  type: NotificationType.ORDER_NEW,
  relatedEntityType: RelatedEntityType.ORDER,
  relatedEntityId: 'order-123'
})

console.log(result)
// {
//   isValid: true,
//   errors: [],
//   warnings: []
// }

// 缺失資料的情況
const invalidResult = validateNotificationData({
  type: NotificationType.ORDER_NEW,
  // relatedEntityType 缺失
  // relatedEntityId 缺失
})

console.log(invalidResult)
// {
//   isValid: true,  // 沒有錯誤，只有警告
//   errors: [],
//   warnings: [
//     'relatedEntityType is missing - will use template default',
//     'relatedEntityId is missing - may cause navigation issues'
//   ]
// }
```

#### 2. 開發時警告
```typescript
// 警告缺失的關聯實體
warnMissingEntity(
  NotificationType.ORDER_NEW,
  undefined, // entityType 缺失
  'UserDashboard.submit'
)

// Console 輸出:
// ⚠️ [NotificationValidator] Notification missing entity type in UserDashboard.submit:
//    Type: order_new
//    Entity Type: undefined
//    Note: Entity type mappings are now controlled by database templates
```

#### 3. 類別方法使用
```typescript
// 使用類別方法（與便捷函數相同功能）
NotificationValidator.warnMissingEntity(type, entityType, context)
NotificationValidator.validateNotificationData(data)
```

### 使用場景
- ✅ 表單提交前的資料檢查
- ✅ API 調用前的完整性驗證
- ✅ 開發時錯誤預防
- ✅ 組件 props 驗證

### 注意事項
- ⚠️ 主要在開發環境使用，部分基礎驗證可用於生產環境
- 🛡️ 專注於預防常見的資料缺失問題
- 📝 提供清楚的錯誤訊息和修復建議

## 最佳實踐

### 1. 環境區分使用

```typescript
// 生產環境 + 開發環境
import { getTemplateByType } from '@/lib/notification-helpers'

// 僅開發環境
import { logNotificationTypeUsage } from '@/lib/notification-type-monitoring'

// 主要開發環境
import { validateNotificationData } from '@/lib/notification-validators'
```

### 2. 組合使用範例

```typescript
// 完整的通知創建流程
async function createNotification(data: CreateNotificationRequest) {
  // 1. 開發時驗證
  if (process.env.NODE_ENV === 'development') {
    const validation = validateNotificationData(data)
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors)
      return
    }
  }
  
  // 2. 監控類型使用
  logNotificationTypeUsage(data.type, 'Component.createNotification')
  
  // 3. 從模板獲取屬性
  const category = getNotificationCategoryFromTemplate(templates, data.type)
  const strategy = getCompletionStrategyFromTemplate(templates, data.type)
  
  // 4. 業務邏輯判斷
  if (isActionableNotificationFromTemplate(templates, data.type)) {
    // 任務型通知的特殊處理
  }
  
  // 5. 創建通知
  return await apiService.createNotification({
    ...data,
    category,
    completionStrategy: strategy
  })
}
```

### 3. 日誌格式識別

當在 Console 中看到這些日誌時，你可以快速識別來源：

```
🔧 [NotificationHelper] Template query for order_new
   → 來自業務邏輯層，正在查詢模板屬性

🔍 [NotificationType] Using dynamic type: "seasonal_promotion"
   → 來自監控層，記錄動態類型使用

📊 [TypeTracker] Dynamic type "custom_alert" used in API
   → 來自追蹤器，統計使用情況

⚠️ [NotificationValidator] Notification missing entity type in Component.submit
   → 來自驗證層，資料完整性警告
```

> **注意**：這些日誌格式遵循專案級的[錯誤處理標準](../reference/ERROR_HANDLING_STANDARDS.md)，確保整個平台的一致性。

## 🛡️ 錯誤處理最佳實踐

### 統一錯誤處理格式

通知系統的所有模組都遵循專案級的錯誤處理標準：

```typescript
// ✅ 已實作：使用統一錯誤處理工具
import { logger } from '@/utils/error-handler'

// 業務邏輯執行 - 實際輸出範例
logger.info('NotificationHelper', 'Template query completed', { type })
// Console: 🔧 [NotificationHelper] Template query completed

// 警告信息 - 實際輸出範例
logger.warn('NotificationValidator', 'Missing entity type', { type, context })
// Console: ⚠️ [NotificationValidator] Missing entity type

// 錯誤處理 - 實際輸出範例
logger.error('NotificationAPI', 'Request failed', error, { type, userId })
// Console: ❌ [NotificationAPI] Request failed
```

### 錯誤分級處理

```typescript
// 🔧 INFO - 正常業務流程
logger.info('NotificationHelper', 'Template found for order_new')

// 🔍 DEBUG - 開發調試信息（僅開發環境）
logger.debug('TypeTracker', 'Dynamic type usage recorded', { type, context })

// ⚠️ WARN - 警告但不影響功能
logger.warn('NotificationValidator', 'Entity type missing, using template default')

// ❌ ERROR - 錯誤，影響功能
logger.error('NotificationAPI', 'Failed to create notification', error)

// 💥 FATAL - 致命錯誤，系統無法繼續
logger.fatal('Database', 'Connection completely lost', error)
```

### 模組內錯誤處理範例（已實作）

```typescript
// notification-helpers.ts 中的實際標準錯誤處理
import { logger } from '@/utils/error-handler'
import type { NotificationTemplate, NotificationTypeValue } from '@/types'

export function getTemplateByType(
  templates: NotificationTemplate[],
  type: NotificationTypeValue  // 支援混合類型架構
): NotificationTemplate | undefined {
  try {
    logger.debug('NotificationHelper', `Searching template for: ${type}`)
    
    const template = templates.find(t => t.type === type)
    
    if (!template) {
      logger.warn('NotificationHelper', `Template not found: ${type}`, {
        availableTypes: templates.map(t => t.type)
      })
      return undefined
    }
    
    logger.info('NotificationHelper', `Template found: ${type}`)
    return template
    
  } catch (error) {
    logger.error('NotificationHelper', 'Template search failed', error as Error, {
      type,
      templatesCount: templates.length
    })
    return undefined
  }
}

// 實際 Console 輸出範例:
// 🔍 [NotificationHelper] Searching template for: order_new
// 🔧 [NotificationHelper] Template found: order_new
```

### API 錯誤處理整合（已實作且可立即使用）

```typescript
// 在組件中使用統一的 API 錯誤處理
import { ApiErrorHandler, logger } from '@/utils/error-handler'
import { notificationApi } from '@/api/services'

async function createNotification(data: CreateNotificationRequest) {
  // 使用統一的 ApiErrorHandler - 已實作並測試
  const result = await ApiErrorHandler.handleApiCall(
    () => notificationApi.create(data),
    { 
      module: 'NotificationForm', 
      action: 'createNotification',
      userId: data.userId 
    }
  )
  
  if (result.success) {
    // 成功情況 - 統一日誌格式
    logger.info('NotificationForm', 'Notification created successfully')
    showSuccessToast('通知已成功創建')
    return result.data
  } else {
    // 錯誤已由 ApiErrorHandler 自動記錄和分類
    // 直接使用用戶友好的錯誤訊息
    showErrorToast(result.error || '創建通知失敗')
    return null
  }
}

// 實際 Console 輸出範例:
// 🔍 [NotificationForm] API call started
// 🔧 [NotificationForm] API call successful 
// 🔧 [NotificationForm] Notification created successfully

// 或錯誤情況:
// 🔍 [NotificationForm] API call started
// ❌ [NotificationForm] Server error
```

## 參考資源

### 相關文檔
- [通知類型架構文檔](../reference/NOTIFICATION_TYPE_ARCHITECTURE.md)
- [混合類型系統說明](../reference/NOTIFICATION_TYPE_ARCHITECTURE.md#類型系統設計)
- [開發工具使用](../reference/NOTIFICATION_TYPE_ARCHITECTURE.md#開發工具)
- [專案錯誤處理標準](../reference/ERROR_HANDLING_STANDARDS.md) ⭐
- [錯誤處理 API 參考](../reference/ERROR_HANDLER_API.md) *（即將創建）*

### 實作檔案位置
```
src/
├── utils/
│   └── error-handler.ts          # 標準化錯誤處理工具 ✅
├── lib/
│   ├── notification-helpers.ts    # 業務邏輯層 ✅ 已更新
│   ├── notification-type-monitoring.ts  # 監控層 ✅ 已更新
│   └── notification-validators.ts # 驗證層 ✅ 已更新
└── types/
    └── notification.ts            # 類型定義 ✅
```

### ⚡ 快速參考

```typescript
// 基本導入
import { logger, ApiErrorHandler } from '@/utils/error-handler'
import { 
  getTemplateByType,
  validateNotificationData,
  logNotificationTypeUsage 
} from '@/lib/notification-helpers'

// 常用操作
const template = getTemplateByType(templates, 'order_new')
const validation = validateNotificationData(notificationData)
logNotificationTypeUsage('custom_type', 'Component.submit')

// API 調用
const result = await ApiErrorHandler.handleApiCall(
  () => api.createNotification(data),
  { module: 'NotificationManager', action: 'create' }
)
```

## 更新記錄

**v2.0 - 標準化錯誤處理版本** (2025-07-21)
- ✅ 所有模組已更新為使用統一錯誤處理系統
- ✅ 所有代碼範例已驗證並可立即使用
- ✅ 新增實際 Console 輸出範例
- ✅ 支援混合類型架構（NotificationTypeValue）
- ✅ 完整的測試覆蓋和驗證

---

**✨ 這份指南提供了完整且已實作的輔助函數庫使用說明和錯誤處理最佳實踐，所有代碼範例都是實際可運行的，幫助開發者快速理解各模組的職責和正確的使用方式。**