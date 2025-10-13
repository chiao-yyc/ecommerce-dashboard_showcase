/**
 * 全域錯誤處理工具
 * 提供統一的錯誤處理、使用者友好訊息和錯誤追蹤
 */
import type { App } from 'vue'
import { createModuleLogger } from './logger'

const log = createModuleLogger('Utils', 'Error')

/**
 * 應用錯誤類型
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API', 
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 應用錯誤類
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code?: string
  public readonly userMessage: string
  public readonly details?: Record<string, any>
  public readonly timestamp: Date
  public readonly context?: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    userMessage?: string,
    code?: string,
    details?: Record<string, any>,
    context?: string
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.userMessage = userMessage || this.getDefaultUserMessage(type)
    this.details = details
    this.timestamp = new Date()
    this.context = context

    // 保持正確的堆疊追蹤
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: '網路連線發生問題，請檢查您的網路連線',
      [ErrorType.API]: '伺服器暫時無法處理您的請求，請稍後再試',
      [ErrorType.VALIDATION]: '輸入的資料格式不正確，請檢查後重新輸入',
      [ErrorType.AUTHENTICATION]: '您的登入狀態已過期，請重新登入',
      [ErrorType.AUTHORIZATION]: '您沒有權限執行此操作',
      [ErrorType.BUSINESS]: '操作無法完成，請檢查輸入條件',
      [ErrorType.SYSTEM]: '系統發生錯誤，我們正在處理中',
      [ErrorType.UNKNOWN]: '發生未知錯誤，請稍後再試'
    }
    return messages[type]
  }

  /**
   * 序列化錯誤為可記錄的格式
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      userMessage: this.userMessage,
      type: this.type,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    }
  }
}

/**
 * API 錯誤處理器
 */
export class APIErrorHandler {
  /**
   * 處理 HTTP 狀態碼錯誤
   */
  static handleHTTPError(status: number, statusText: string, responseData?: any): AppError {
    const context = `HTTP ${status}: ${statusText}`
    
    switch (status) {
      case 400:
        return new AppError(
          '請求參數錯誤',
          ErrorType.VALIDATION,
          '提交的資料格式不正確，請檢查後重新提交',
          'HTTP_400',
          responseData,
          context
        )
      
      case 401:
        return new AppError(
          '未授權訪問',
          ErrorType.AUTHENTICATION,
          '您的登入狀態已過期，請重新登入',
          'HTTP_401',
          responseData,
          context
        )
      
      case 403:
        return new AppError(
          '禁止訪問',
          ErrorType.AUTHORIZATION,
          '您沒有權限執行此操作',
          'HTTP_403',
          responseData,
          context
        )
      
      case 404:
        return new AppError(
          '資源不存在',
          ErrorType.API,
          '找不到請求的資源',
          'HTTP_404',
          responseData,
          context
        )
      
      case 422:
        return new AppError(
          '資料驗證失敗',
          ErrorType.VALIDATION,
          responseData?.message || '提交的資料未通過驗證',
          'HTTP_422',
          responseData,
          context
        )
      
      case 429:
        return new AppError(
          '請求過於頻繁',
          ErrorType.API,
          '您的操作太頻繁，請稍後再試',
          'HTTP_429',
          responseData,
          context
        )
      
      case 500:
        return new AppError(
          '伺服器內部錯誤',
          ErrorType.SYSTEM,
          '伺服器發生錯誤，我們正在修復中',
          'HTTP_500',
          responseData,
          context
        )
      
      case 502:
      case 503:
      case 504:
        return new AppError(
          '伺服器暫時無法使用',
          ErrorType.SYSTEM,
          '服務暫時無法使用，請稍後再試',
          `HTTP_${status}`,
          responseData,
          context
        )
      
      default:
        return new AppError(
          `HTTP錯誤 ${status}`,
          ErrorType.API,
          '網路請求發生錯誤，請稍後再試',
          `HTTP_${status}`,
          responseData,
          context
        )
    }
  }

  /**
   * 處理網路錯誤
   */
  static handleNetworkError(error: any): AppError {
    if (error.name === 'AbortError') {
      return new AppError(
        '請求被取消',
        ErrorType.NETWORK,
        '操作已取消',
        'REQUEST_ABORTED',
        { originalError: error.message },
        'Network Request'
      )
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return new AppError(
        '請求逾時',
        ErrorType.NETWORK,
        '請求逾時，請檢查網路連線後重試',
        'REQUEST_TIMEOUT',
        { originalError: error.message },
        'Network Request'
      )
    }

    if (error.message.includes('Network Error') || !navigator.onLine) {
      return new AppError(
        '網路連線錯誤',
        ErrorType.NETWORK,
        '無法連接到伺服器，請檢查網路連線',
        'NETWORK_ERROR',
        { originalError: error.message, online: navigator.onLine },
        'Network Request'
      )
    }

    return new AppError(
      '網路請求失敗',
      ErrorType.NETWORK,
      '網路請求發生錯誤，請稍後再試',
      'NETWORK_UNKNOWN',
      { originalError: error.message },
      'Network Request'
    )
  }

  /**
   * 處理 Supabase 錯誤
   */
  static handleSupabaseError(error: any): AppError {
    const code = error.code || error.error_description || 'SUPABASE_UNKNOWN'
    const message = error.message || error.error_description || '資料庫操作失敗'
    
    // Authentication errors
    if (code.includes('invalid_credentials') || code.includes('email_not_confirmed')) {
      return new AppError(
        message,
        ErrorType.AUTHENTICATION,
        '登入資訊不正確或帳號未驗證',
        code,
        error,
        'Supabase Auth'
      )
    }

    // RLS/Permission errors
    if (code.includes('insufficient_privilege') || message.includes('RLS')) {
      return new AppError(
        message,
        ErrorType.AUTHORIZATION,
        '您沒有權限執行此操作',
        code,
        error,
        'Supabase RLS'
      )
    }

    // Data validation errors
    if (code.includes('check_violation') || code.includes('unique_violation')) {
      return new AppError(
        message,
        ErrorType.VALIDATION,
        '資料不符合要求或已存在',
        code,
        error,
        'Supabase Validation'
      )
    }

    return new AppError(
      message,
      ErrorType.API,
      '資料庫操作失敗，請稍後再試',
      code,
      error,
      'Supabase'
    )
  }
}

/**
 * 全域錯誤處理器
 */
export class GlobalErrorHandler {
  private static errorQueue: AppError[] = []
  private static maxQueueSize = 50

  /**
   * 處理錯誤並決定如何回應使用者
   */
  static handle(error: any, context?: string): AppError {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error?.response) {
      // HTTP 錯誤
      appError = APIErrorHandler.handleHTTPError(
        error.response.status,
        error.response.statusText,
        error.response.data
      )
    } else if (error?.code || error?.error_description) {
      // Supabase 錯誤
      appError = APIErrorHandler.handleSupabaseError(error)
    } else if (error?.name === 'NetworkError' || !navigator.onLine) {
      // 網路錯誤
      appError = APIErrorHandler.handleNetworkError(error)
    } else {
      // 未知錯誤
      appError = new AppError(
        error?.message || '未知錯誤',
        ErrorType.UNKNOWN,
        '發生未知錯誤，請稍後再試',
        'UNKNOWN_ERROR',
        { originalError: error },
        context || 'Unknown'
      )
    }

    // 記錄錯誤
    this.logError(appError)

    return appError
  }

  /**
   * 記錄錯誤
   */
  private static logError(error: AppError) {
    // 加入錯誤佇列
    this.errorQueue.push(error)
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // 開發環境：詳細日誌
    if (import.meta.env.DEV) {
      log.error(`🚨 ${error.type} Error`, {
        message: error.message,
        userMessage: error.userMessage,
        code: error.code,
        context: error.context,
        details: error.details,
        stack: error.stack
      })
    } else {
      // 生產環境：簡潔日誌
      log.error(`[${error.type}] ${error.code || 'UNKNOWN'}: ${error.message}`)
    }

    // 未來可考慮整合錯誤追蹤服務 (如 Sentry)
  }

  /**
   * 獲取錯誤統計
   */
  static getErrorStats() {
    const stats: Record<ErrorType, number> = {} as Record<ErrorType, number>
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = 0
    })

    this.errorQueue.forEach(error => {
      stats[error.type]++
    })

    return {
      total: this.errorQueue.length,
      byType: stats,
      recent: this.errorQueue.slice(-10).map(error => ({
        type: error.type,
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      }))
    }
  }

  /**
   * 清空錯誤佇列（僅開發環境使用）
   */
  static clearErrorQueue() {
    if (import.meta.env.DEV) {
      this.errorQueue.length = 0
      log.debug('Error queue cleared (dev mode)')
    }
  }

  /**
   * 手動添加測試錯誤（僅開發環境使用）
   */
  static addTestError(type: ErrorType = ErrorType.UNKNOWN) {
    if (import.meta.env.DEV) {
      const testError = new AppError(
        `Test error for ${type}`,
        type,
        `測試 ${type} 錯誤`,
        'TEST_ERROR',
        { isTest: true },
        'Error Monitoring Test'
      )
      this.logError(testError)
      return testError
    }
  }
}

/**
 * Vue 應用錯誤處理安裝
 */
export function setupErrorHandler(app: App) {
  // 動態導入 toast 以避免循環依賴
  let toastHelper: any = null
  
  const getToastHelper = async () => {
    if (!toastHelper) {
      const { systemToastHelper } = await import('@/plugins/toast')
      toastHelper = systemToastHelper
    }
    return toastHelper
  }

  // Vue 錯誤處理器
  app.config.errorHandler = async (error, _instance, info) => {
    const appError = GlobalErrorHandler.handle(error, `Vue: ${info}`)
    
    // 避免在錯誤處理中再次拋出錯誤
    try {
      const toast = await getToastHelper()
      
      // 根據錯誤類型決定顯示方式
      switch (appError.type) {
        case ErrorType.AUTHENTICATION:
          toast.warning(appError.userMessage, {
            description: '請重新登入以繼續使用',
            duration: 5000
          })
          break
        case ErrorType.NETWORK:
          toast.error(appError.userMessage, {
            description: '請檢查網路連線',
            duration: 4000
          })
          break
        case ErrorType.VALIDATION:
          toast.warning(appError.userMessage, {
            description: '請修正輸入後重試',
            duration: 3000
          })
          break
        default:
          toast.error(appError.userMessage, {
            description: `錯誤代碼: ${appError.code || 'UNKNOWN'}`,
            duration: 4000
          })
      }
    } catch (handlerError) {
      log.error('Error handler failed', handlerError)
    }
  }

  // 未捕獲的 Promise 錯誤
  window.addEventListener('unhandledrejection', async (event) => {
    const appError = GlobalErrorHandler.handle(event.reason, 'Unhandled Promise Rejection')
    
    // 阻止預設的 console.error
    event.preventDefault()
    
    try {
      const toast = await getToastHelper()
      toast.error(appError.userMessage, {
        description: '非同步操作失敗',
        duration: 4000
      })
    } catch {
      log.error('Promise Rejection Handler failed')
    }
  })

  // 全域 JavaScript 錯誤
  window.addEventListener('error', async (event) => {
    const appError = GlobalErrorHandler.handle(event.error, 'Global JavaScript Error')
    
    try {
      const toast = await getToastHelper()
      toast.error(appError.userMessage, {
        description: '頁面運行時發生錯誤',
        duration: 4000
      })
    } catch {
      log.error('Global Error Handler failed')
    }
  })
}

/**
 * 建立特定類型的錯誤輔助函數
 */
export const createError = {
  validation: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.VALIDATION, userMessage, code),
    
  network: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.NETWORK, userMessage, code),
    
  api: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.API, userMessage, code),
    
  auth: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.AUTHENTICATION, userMessage, code),
    
  permission: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.AUTHORIZATION, userMessage, code),
    
  business: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.BUSINESS, userMessage, code),
    
  system: (message: string, userMessage?: string, code?: string) =>
    new AppError(message, ErrorType.SYSTEM, userMessage, code)
}