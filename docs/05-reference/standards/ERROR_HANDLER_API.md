# 錯誤處理 API 參考文檔

## 概述

本文檔提供統一錯誤處理系統的完整 API 參考，包括所有可用的函數、類別和介面。

**檔案位置**: `src/utils/error-handler.ts`  
**狀態**: ✅ 已實作並可立即使用  
**版本**: v1.0 - 標準化錯誤處理系統  

## 基礎 API

### logger 便捷函數

最常用的日誌記錄工具，提供簡潔的 API：

```typescript
import { logger } from '@/utils/error-handler'

// 基礎用法
logger.debug(module: string, message: string, data?: any): void
logger.info(module: string, message: string, data?: any): void  
logger.warn(module: string, message: string, data?: any): void
logger.error(module: string, message: string, error?: Error, data?: any): void
logger.fatal(module: string, message: string, error?: Error, data?: any): void
```

#### 使用範例

```typescript
// 正常業務流程
logger.info('OrderAPI', 'Order created successfully', { orderId: '123' })
// 輸出: 🔧 [OrderAPI] Order created successfully

// 警告信息
logger.warn('PaymentService', 'Payment method deprecated', { method: 'old_api' })
// 輸出: ⚠️ [PaymentService] Payment method deprecated

// 錯誤處理
logger.error('DatabaseService', 'Connection failed', error, { retryCount: 3 })
// 輸出: ❌ [DatabaseService] Connection failed
```

## 進階 API

### ErrorHandler 類別

提供完整的錯誤處理控制：

```typescript
import { ErrorHandler, LogLevel, type ErrorContext } from '@/utils/error-handler'

// 完整控制的錯誤處理
ErrorHandler.debug(context: ErrorContext, message: string, data?: any): void
ErrorHandler.info(context: ErrorContext, message: string, data?: any): void
ErrorHandler.warn(context: ErrorContext, message: string, data?: any): void
ErrorHandler.error(context: ErrorContext, message: string, error?: Error, data?: any): void
ErrorHandler.fatal(context: ErrorContext, message: string, error?: Error, data?: any): void
```

#### ErrorContext 介面

```typescript
interface ErrorContext {
  module: string          // 必需：模組名稱
  subModule?: string      // 可選：子模組名稱
  action?: string         // 可選：動作名稱
  userId?: string         // 可選：用戶 ID
  metadata?: Record<string, any>  // 可選：額外元數據
}
```

#### 使用範例

```typescript
const context: ErrorContext = {
  module: 'UserService',
  subModule: 'Authentication',
  action: 'validateToken',
  userId: 'user123',
  metadata: { source: 'API' }
}

ErrorHandler.error(context, 'Token validation failed', error, { token: 'masked' })
// 輸出: ❌ [UserService:Authentication] Token validation failed
```

## 🔄 API 錯誤處理

### ApiErrorHandler 類別

統一的 API 錯誤處理機制：

```typescript
import { ApiErrorHandler, type ErrorContext } from '@/utils/error-handler'

ApiErrorHandler.handleApiCall<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<{ success: boolean; data?: T; error?: string }>
```

#### 使用範例

```typescript
// 基礎用法
const result = await ApiErrorHandler.handleApiCall(
  () => fetch('/api/users').then(r => r.json()),
  { module: 'UserService', action: 'fetchUsers' }
)

if (result.success) {
  console.log('Users:', result.data)
} else {
  showErrorToast(result.error)
}

// 進階用法 - 完整上下文
const result = await ApiErrorHandler.handleApiCall(
  () => userApi.updateProfile(userData),
  {
    module: 'ProfileComponent',
    subModule: 'Settings',
    action: 'updateProfile',
    userId: currentUser.id,
    metadata: { source: 'settings_form' }
  }
)

// 自動處理的錯誤類型:
// - NetworkError: 網路連線失敗
// - 401: 認證過期
// - 403: 權限不足  
// - 500: 伺服器錯誤
// - 其他: 未知錯誤
```

#### 錯誤類型處理

ApiErrorHandler 會自動識別並處理以下錯誤：

| 錯誤類型 | 處理方式 | 用戶訊息 |
|---------|---------|---------|
| NetworkError | WARN 級別記錄 | "網路連線失敗，請檢查網路設定後重試" |
| 401 Unauthorized | WARN 級別記錄 | "登入已過期，請重新登入" |
| 403 Forbidden | WARN 級別記錄 | "您沒有執行此操作的權限" |
| 500 Server Error | ERROR 級別記錄 | "伺服器暫時無法處理請求，請稍後重試" |
| 其他錯誤 | ERROR 級別記錄 | "發生未預期的錯誤，請聯繫技術支援" |

## 日誌級別與圖示

### LogLevel 枚舉

```typescript
enum LogLevel {
  DEBUG = 'debug',  // 🔍 開發調試信息（僅開發環境）
  INFO = 'info',    // 🔧 正常業務流程
  WARN = 'warn',    // ⚠️ 警告信息，不影響功能
  ERROR = 'error',  // ❌ 錯誤信息，影響功能
  FATAL = 'fatal'   // 💥 致命錯誤，系統無法繼續
}
```

### 環境行為

| 級別 | 開發環境 | 生產環境 | 說明 |
|------|---------|---------|------|
| **DEBUG** | ✅ Console | ❌ 不輸出 | 僅用於開發調試 |
| **INFO** | ✅ Console | ✅ Console | 正常業務流程記錄 |
| **WARN** | ✅ Console | ✅ Console + 監控 | 警告信息，會發送到監控系統 |
| **ERROR** | ✅ Console | ✅ Console + 錯誤追蹤 | 錯誤信息，會發送到錯誤追蹤系統 |
| **FATAL** | ✅ Console | ✅ Console + 錯誤追蹤 + 緊急警報 | 致命錯誤，會觸發緊急警報機制 |

## 實際使用模式

### 1. 通知系統中的使用

```typescript
// notification-helpers.ts 中的實際應用
import { logger } from '@/utils/error-handler'

export function getTemplateByType(
  templates: NotificationTemplate[],
  type: NotificationTypeValue
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
```

### 2. Vue 組件中的使用

```typescript
// 在 Vue 組件中使用
<script setup lang="ts">
import { ApiErrorHandler, logger } from '@/utils/error-handler'
import { notificationApi } from '@/api/services'

const createNotification = async (data: CreateNotificationRequest) => {
  logger.info('NotificationForm', 'Starting notification creation')
  
  const result = await ApiErrorHandler.handleApiCall(
    () => notificationApi.create(data),
    { 
      module: 'NotificationForm', 
      action: 'createNotification',
      userId: data.userId,
      metadata: { formVersion: '2.0' }
    }
  )
  
  if (result.success) {
    logger.info('NotificationForm', 'Notification created successfully')
    toast.success('通知已成功創建')
    await router.push('/notifications')
  } else {
    // 錯誤已被自動記錄，只需處理 UI
    toast.error(result.error || '創建通知失敗')
  }
}
</script>
```

### 3. 服務層中的使用

```typescript
// API 服務層
import { logger, ErrorHandler } from '@/utils/error-handler'

export class NotificationService {
  async processNotification(notification: Notification) {
    const context = {
      module: 'NotificationService',
      action: 'processNotification',
      metadata: { 
        notificationId: notification.id,
        type: notification.type 
      }
    }
    
    try {
      ErrorHandler.debug(context, 'Starting notification processing')
      
      // 業務邏輯處理
      const result = await this.sendNotification(notification)
      
      if (result.success) {
        ErrorHandler.info(context, 'Notification processed successfully')
        return result
      } else {
        ErrorHandler.warn(context, 'Notification processing partially failed', {
          warnings: result.warnings
        })
        return result
      }
      
    } catch (error) {
      ErrorHandler.error(context, 'Notification processing failed', error as Error)
      throw error
    }
  }
}
```

## ⚡ 效能考量

### 開發環境 vs 生產環境

```typescript
// DEBUG 級別僅在開發環境輸出
logger.debug('Module', 'Debug info', largeDataObject)  // 只有開發環境會處理

// 生產環境會跳過 DEBUG 級別的處理，不影響效能
if (process.env.NODE_ENV === 'development') {
  // 只在開發環境執行
}
```

### 資料序列化建議

```typescript
// ❌ 不建議 - 大型物件可能影響效能
logger.info('Service', 'Data processed', {
  fullData: massiveDataObject,  // 避免傳入大型物件
  allUsers: usersList           // 避免傳入長列表
})

// ✅ 建議 - 傳入關鍵資訊
logger.info('Service', 'Data processed', {
  dataSize: massiveDataObject.length,
  userCount: usersList.length,
  processingTime: Date.now() - startTime
})
```

## 安全考量

### 敏感資訊保護

```typescript
// ❌ 避免記錄敏感資訊
logger.error('AuthService', 'Login failed', error, {
  password: user.password,     // 永遠不要記錄密碼
  token: user.accessToken,     // 永遠不要記錄完整 token
  creditCard: user.cardNumber  // 永遠不要記錄信用卡號
})

// ✅ 安全的記錄方式
logger.error('AuthService', 'Login failed', error, {
  userId: user.id,
  email: user.email,
  tokenLastFour: user.accessToken?.slice(-4), // 只記錄後四位
  attemptCount: loginAttempts
})
```

## 🧪 測試中的使用

### 測試環境配置

```typescript
// 在測試中模擬錯誤處理
import { logger } from '@/utils/error-handler'

describe('Error handling', () => {
  let consoleSpy: vi.SpyInstance
  
  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'warn')
  })
  
  afterEach(() => {
    consoleSpy.mockRestore()
  })
  
  it('should log warning when template not found', () => {
    const result = getTemplateByType([], 'unknown_type')
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '⚠️ [NotificationHelper] Template not found: unknown_type',
      expect.objectContaining({
        availableTypes: []
      })
    )
    expect(result).toBeUndefined()
  })
})
```

## 相關資源

- [專案錯誤處理標準](./ERROR_HANDLING_STANDARDS.md)
- [通知系統輔助函數庫使用指南](../dev-notes/NOTIFICATION_LIB_USAGE_GUIDE.md)
- [通知類型架構與監控系統](./NOTIFICATION_TYPE_ARCHITECTURE.md)

---

**版本**: v1.0  
**最後更新**: 2025-07-21  
**狀態**: ✅ 已實作完成並可立即使用  
**維護者**: 通知系統開發團隊