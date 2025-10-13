# 錯誤處理與監控完整指南

## 概述

本文檔定義了電商儀表板平台的統一錯誤處理格式、監控系統規範和最佳實踐，確保所有模組遵循一致的錯誤處理模式。

**⚡ 系統狀態**: 已完整實現 (2025-08-12)  
**🏗️ 架構**: AppError → APIErrorHandler → GlobalErrorHandler → Toast 通知  
**📊 監控**: useErrorMonitoring composable + 開發工具面板

## 設計原則

1. **一致性**: 所有模組使用統一的錯誤格式和日誌前綴
2. **可追溯性**: 每個錯誤都能追溯到具體的模組和上下文
3. **分級管理**: 根據嚴重程度採用不同的處理策略
4. **環境感知**: 開發環境和生產環境採用適當的日誌級別
5. **用戶友好**: 用戶端顯示有意義的錯誤訊息
6. **恢復性**: 嘗試從錯誤中恢復或提供恢復指導

## 🏷️ 日誌級別與前綴標準

### 日誌級別定義

| 級別 | 圖示 | 用途 | 環境 | 範例 |
|------|------|------|------|------|
| **DEBUG** | 🔍 | 詳細調試資訊、變數值追蹤 | 僅開發 | 函數進入/退出、變數狀態 |
| **INFO** | 🔧 | 正常業務邏輯執行、重要事件 | 開發+生產 | 用戶登入、資料載入成功 |
| **WARN** | ⚠️ | 潛在問題、非預期情況 | 開發+生產 | API 返回非預期資料 |
| **ERROR** | ❌ | 錯誤資訊、影響功能 | 開發+生產 | API 請求失敗、元件渲染錯誤 |
| **FATAL** | 💥 | 致命錯誤、系統無法繼續 | 開發+生產 | 應用程式崩潰、核心服務不可用 |

### 模組前綴規範

#### 格式: `[ModuleName] 或 [ModuleName:SubModule]`

```typescript
// 推薦的前綴格式
'[Auth]'                    // 認證模組
'[Auth:Login]'              // 登入子模組
'[Customer]'                // 客戶管理
'[Customer:Profile]'        // 客戶個人資料
'[Order:Payment]'           // 訂單付款
'[Notification:Realtime]'   // 即時通知
'[Chart:Data]'              // 圖表資料處理
```

## 🔍 錯誤類型分類

### 1. 前端運行時錯誤 (Frontend Runtime Errors)
- Vue 元件渲染錯誤
- 未捕獲的異步錯誤
- JavaScript 運行時異常

### 2. API 錯誤 (API Errors)
- 網路請求失敗
- 服務器錯誤狀態碼
- 資料格式不正確

### 3. 業務邏輯錯誤 (Business Logic Errors)
- 用戶輸入驗證失敗
- 業務規則違反
- 資料一致性錯誤

### 4. 認證/授權錯誤 (Authentication/Authorization Errors)
- 登入失敗
- Session 過期
- 權限不足

## 錯誤處理實現

### Vue 3 全局錯誤處理 ✅ 已實現

**當前實現**: `src/main.ts` + `src/utils/error.ts`

```typescript
// main.ts - 實際使用的程式碼
import { setupErrorHandler } from '@/utils/error'

const app = createApp(App)

// 設置全域錯誤處理 (自動整合 toast 通知)
setupErrorHandler(app)

// utils/error.ts - 核心實現
export function setupErrorHandler(app: App) {
  // Vue 錯誤處理器 - 自動分類錯誤並顯示友好訊息
  app.config.errorHandler = async (error, instance, info) => {
    const appError = GlobalErrorHandler.handle(error, `Vue: ${info}`)
    
    // 根據錯誤類型顯示不同的 toast 通知
    const toast = await getToastHelper()
    switch (appError.type) {
      case ErrorType.AUTHENTICATION:
        toast.warning(appError.userMessage, {
          description: '請重新登入以繼續使用',
          duration: 5000
        })
        break
      // ... 其他錯誤類型處理
    }
  }

  // 未捕獲的 Promise 錯誤
  window.addEventListener('unhandledrejection', async (event) => {
    const appError = GlobalErrorHandler.handle(event.reason, 'Unhandled Promise Rejection')
    // 自動 toast 通知 + 詳細日誌
  })
}
```

### API 錯誤處理 ✅ 已實現

#### BaseApiService 錯誤處理
**當前實現**: `src/api/services/base/BaseApiService.ts`

```typescript
// BaseApiService.ts - 實際使用的程式碼
import { GlobalErrorHandler } from '@/utils/error'

export abstract class BaseApiService<TEntity, TDbEntity = any> {
  protected handleError(error: any): ApiResponse<any> {
    // 使用全域錯誤處理器 - 自動分類和詳細日誌
    const appError = GlobalErrorHandler.handle(error, `API Service: ${this.tableName}`)
    
    return {
      success: false,
      error: appError.userMessage, // 使用者友好訊息
      details: {
        type: appError.type,
        code: appError.code,
        context: appError.context,
        timestamp: appError.timestamp
      }
    }
  }

  // 自動處理所有 CRUD 操作中的錯誤
  async findMany(options: QueryOptions = {}): Promise<ApiResponse<TEntity[]>> {
    try {
      // ... Supabase 查詢邏輯
    } catch (error) {
      return this.handleError(error) // 統一錯誤處理
    }
  }
}
```

#### APIErrorHandler - 智能錯誤分類
**位置**: `src/utils/error.ts`

```typescript
export class APIErrorHandler {
  // HTTP 狀態碼自動處理
  static handleHTTPError(status: number, statusText: string, responseData?: any): AppError {
    switch (status) {
      case 401:
        return new AppError('未授權訪問', ErrorType.AUTHENTICATION, '您的登入狀態已過期，請重新登入')
      case 403:
        return new AppError('禁止訪問', ErrorType.AUTHORIZATION, '您沒有權限執行此操作')
      // ... 其他狀態碼處理
    }
  }

  // Supabase 錯誤自動處理
  static handleSupabaseError(error: any): AppError {
    if (error.code?.includes('invalid_credentials')) {
      return new AppError(error.message, ErrorType.AUTHENTICATION, '登入資訊不正確或帳號未驗證')
    }
    // ... 其他 Supabase 錯誤處理
  }
}
```

#### 自定義錯誤類型
```typescript
// utils/error-types.ts
export class AppError extends Error {
  public readonly type: string
  public readonly code?: string
  public readonly statusCode?: number

  constructor(message: string, type: string, code?: string, statusCode?: number) {
    super(message)
    this.type = type
    this.code = code
    this.statusCode = statusCode
    this.name = this.constructor.name
  }
}

export class ApiError extends AppError {
  constructor(message: string, code?: string, statusCode?: number) {
    super(message, 'api-error', code, statusCode)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'validation-error', field)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '認證失敗') {
    super(message, 'auth-error', 'AUTHENTICATION_FAILED', 401)
  }
}
```

### Composable 錯誤處理

```typescript
// composables/useErrorHandler.ts
import { ref } from 'vue'
import { useToast } from '@/composables/useToast'

export function useErrorHandler() {
  const { toast } = useToast()
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const handleError = (err: Error, context: string, showToast = true) => {
    console.error(`❌ [${context}]`, {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    })

    error.value = err

    if (showToast) {
      toast.error(getUserFriendlyMessage(err))
    }
  }

  const executeWithErrorHandling = async <T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T | null> => {
    isLoading.value = true
    error.value = null

    try {
      const result = await fn()
      console.log(`🔧 [${context}] Operation completed successfully`)
      return result
    } catch (err) {
      handleError(err as Error, context)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    handleError,
    executeWithErrorHandling
  }
}
```

### 用戶友好的錯誤訊息

```typescript
// utils/error-messages.ts
export function getUserFriendlyMessage(error: Error): string {
  // API 錯誤
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 401:
        return '登入已過期，請重新登入'
      case 403:
        return '您沒有權限執行此操作'
      case 404:
        return '找不到請求的資源'
      case 500:
        return '服務器暫時無法響應，請稍後重試'
      default:
        return '網路請求失敗，請檢查網路連線'
    }
  }

  // 驗證錯誤
  if (error instanceof ValidationError) {
    return `輸入資料有誤: ${error.message}`
  }

  // 認證錯誤
  if (error instanceof AuthenticationError) {
    return '認證失敗，請重新登入'
  }

  // 通用錯誤
  return '操作失敗，請稍後重試'
}
```

## 日誌記錄策略

### 日誌格式標準

```typescript
// utils/logger.ts
interface LogContext {
  userId?: string
  requestId?: string
  component?: string
  action?: string
  data?: any
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = this.getLogPrefix(level)
    
    return `${prefix} [${timestamp}] ${message} ${context ? JSON.stringify(context) : ''}`
  }

  private getLogPrefix(level: string): string {
    const prefixes = {
      DEBUG: '🔍',
      INFO: '🔧',
      WARN: '⚠️',
      ERROR: '❌',
      FATAL: '💥'
    }
    return prefixes[level] || '📝'
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('INFO', message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context))
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage('ERROR', message, context))
    
    // 生產環境發送到監控服務
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring('ERROR', message, context)
    }
  }

  fatal(message: string, context?: LogContext) {
    console.error(this.formatMessage('FATAL', message, context))
    this.sendToMonitoring('FATAL', message, context)
  }

  private sendToMonitoring(level: string, message: string, context?: LogContext) {
    // 實現監控服務集成
    // 例如: Sentry, LogRocket 等
  }
}

export const logger = new Logger()
```

### 使用範例

```typescript
// composables/useCustomer.ts
import { logger } from '@/utils/logger'

export function useCustomer() {
  const fetchCustomers = async () => {
    logger.info('[Customer] Starting to fetch customers')
    
    try {
      const customers = await CustomerApiService.getCustomers()
      logger.info('[Customer] Successfully fetched customers', { 
        count: customers.length 
      })
      return customers
    } catch (error) {
      logger.error('[Customer] Failed to fetch customers', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  return { fetchCustomers }
}
```

## 🔄 錯誤恢復策略

### 自動重試機制

```typescript
// utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`[Retry] Attempt ${attempt}/${maxRetries}`)
      return await fn()
    } catch (error) {
      lastError = error as Error
      logger.warn(`[Retry] Attempt ${attempt} failed`, { 
        error: error.message 
      })

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= 2 // 指數退避
      }
    }
  }

  logger.error('[Retry] All attempts failed', { error: lastError.message })
  throw lastError
}
```

### 網路斷線處理

```typescript
// composables/useNetworkStatus.ts
import { ref, onMounted } from 'vue'

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine)

  const handleOnline = () => {
    isOnline.value = true
    logger.info('[Network] Connection restored')
    // 重新連接 WebSocket、重試失敗的請求等
  }

  const handleOffline = () => {
    isOnline.value = false
    logger.warn('[Network] Connection lost')
    // 顯示離線提示、暫停非必要請求等
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  return { isOnline }
}
```

## 監控與分析

### 錯誤追蹤設定

```typescript
// utils/monitoring.ts
import * as Sentry from '@sentry/vue'

export function initializeMonitoring(app: App) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      app,
      dsn: process.env.VITE_SENTRY_DSN,
      integrations: [
        new Sentry.BrowserTracing(),
      ],
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
      
      // 自定義錯誤過濾
      beforeSend(event) {
        // 過濾開發相關錯誤
        if (event.exception) {
          const error = event.exception.values?.[0]
          if (error?.value?.includes('Development mode')) {
            return null
          }
        }
        return event
      }
    })
  }
}
```

### 效能監控

```typescript
// utils/performance-monitor.ts
export class PerformanceMonitor {
  static measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    
    return fn()
      .then(result => {
        const duration = performance.now() - start
        logger.info(`[Performance] ${name} completed`, { 
          duration: `${duration.toFixed(2)}ms` 
        })
        return result
      })
      .catch(error => {
        const duration = performance.now() - start
        logger.error(`[Performance] ${name} failed`, { 
          duration: `${duration.toFixed(2)}ms`,
          error: error.message 
        })
        throw error
      })
  }
}
```

## 🧪 錯誤處理測試

### 單元測試

```typescript
// tests/unit/error-handler.test.ts
import { describe, it, expect, vi } from 'vitest'
import { useErrorHandler } from '@/composables/useErrorHandler'

describe('useErrorHandler', () => {
  it('should handle API errors correctly', async () => {
    const { executeWithErrorHandling } = useErrorHandler()
    
    const failingFunction = () => Promise.reject(new ApiError('Test error'))
    
    const result = await executeWithErrorHandling(
      failingFunction,
      'TestContext'
    )
    
    expect(result).toBeNull()
  })
})
```

### 整合測試

```typescript
// tests/integration/api-error-handling.test.ts
describe('API Error Handling', () => {
  it('should handle 401 errors and redirect to login', async () => {
    // 模擬 401 錯誤響應
    mockAxios.onGet('/api/customers').reply(401)
    
    const { result } = renderHook(() => useCustomer())
    
    await expect(result.current.fetchCustomers()).rejects.toThrow(
      AuthenticationError
    )
  })
})
```

## 📈 最佳實踐

### 1. 錯誤處理層次
```
1. 元件層級: 捕獲 UI 相關錯誤
2. Composable 層級: 處理業務邏輯錯誤
3. 服務層級: 處理 API 和外部服務錯誤
4. 全局層級: 兜底處理所有未捕獲的錯誤
```

### 2. 日誌記錄原則
- **開發環境**: 詳細日誌，包含 DEBUG 級別
- **生產環境**: 重要日誌，過濾敏感資訊
- **錯誤上下文**: 始終記錄足夠的上下文資訊

### 3. 用戶體驗
- 提供有意義的錯誤訊息
- 避免顯示技術細節
- 提供恢復操作建議

### 4. 監控告警
- 設置關鍵錯誤的告警閾值
- 定期審查錯誤日誌和趨勢
- 建立錯誤處理的 SLA

## 🔍 錯誤監控與診斷系統 ⚡ 新功能

### 實時錯誤監控 `useErrorMonitoring`
**位置**: `src/composables/useErrorMonitoring.ts`

```typescript
import { useErrorMonitoring } from '@/composables/useErrorMonitoring'

// 在任意組件中使用
const errorMonitoring = useErrorMonitoring()

// 系統健康度監控 (0-100分)
const healthScore = errorMonitoring.healthScore.value
const severity = errorMonitoring.errorSeverity.value // low/medium/high/critical

// 錯誤統計
const metrics = errorMonitoring.errorMetrics.value
console.log(`總錯誤數: ${metrics.totalErrors}`)
console.log(`錯誤類型分布:`, metrics.errorsByType)
console.log(`最近錯誤:`, metrics.recentErrors)

// 智能優化建議
const recommendations = errorMonitoring.getRecommendations()
console.log('系統建議:', recommendations)
```

### 開發工具整合
**位置**: DevFloatingWidget → 錯誤監控標籤

#### 功能特色
- 📊 **錯誤統計總覽**: 總數、錯誤率、嚴重程度指示器
- 🎯 **系統健康度**: 0-100分數評分系統
- 📈 **錯誤類型分布**: 各類錯誤的詳細統計
- 🔧 **開發工具**: 測試錯誤生成、統計重置
- 💡 **智能建議**: 基於錯誤模式的自動化建議
- 📋 **監控狀態**: 實時監控開關和狀態顯示

#### 使用方式
1. 開啟 DevFloatingWidget (開發模式自動顯示)
2. 點擊「錯誤監控」標籤
3. 查看實時錯誤統計和健康度
4. 使用「生成測試錯誤」按鈕測試系統回應
5. 點擊「重置統計」清空錯誤記錄

### 錯誤分類智能化
**8種錯誤類型自動識別**:

1. **NETWORK** 🌐 - 連線問題、逾時、離線
2. **API** 🔗 - 伺服器回應問題、HTTP錯誤
3. **VALIDATION** ⚠️ - 資料驗證、格式錯誤
4. **AUTHENTICATION** 🔐 - 登入狀態、認證失敗
5. **AUTHORIZATION** 🚫 - 權限不足、存取受限
6. **BUSINESS** 💼 - 業務規則違反
7. **SYSTEM** ⚙️ - 系統級錯誤、組件故障
8. **UNKNOWN** ❓ - 未分類錯誤

### 健康度評分算法
```typescript
// 系統健康度計算 (0-100分)
let score = 100

// 系統錯誤扣分最嚴重 (10分/次)
score -= systemErrors * 10

// 認證錯誤次之 (8分/次)  
score -= authErrors * 8

// 其他錯誤較輕 (2分/次)
score -= (totalErrors - systemErrors - authErrors) * 2

// 近期錯誤趨勢調整
if (recentErrorCount > 5) {
  score -= (recentErrorCount - 5) * 3
}

return Math.max(0, Math.min(100, score))
```

### 自動化建議系統
根據錯誤模式提供智能建議：

- 網路錯誤過多 → 建議檢查連線、增加重試機制
- 系統錯誤頻繁 → 建議聯繫技術支援、檢查日誌
- 認證錯誤增加 → 建議檢查登入狀態、清理快取
- 驗證錯誤集中 → 建議檢查資料格式、更新驗證邏輯

## 相關文檔

- [API 服務架構](../../02-development/api/api-services-architecture.md)
- [Vue 專案結構優化](./project-optimization-roadmap.md)
- [測試策略文檔](../../03-operations/testing/testing-strategy.md)
- [監控與部署指南](../../03-operations/deployment/DEPLOYMENT.md)
- [錯誤處理核心實現](../../../admin-platform-vue/src/utils/error.ts)
- [錯誤監控 Composable](../../../admin-platform-vue/src/composables/useErrorMonitoring.ts)

---

*最後更新: 2025-08-12*
*版本: 3.0 (完整實現版)*
*包含: 全域錯誤處理系統 + 實時監控面板*