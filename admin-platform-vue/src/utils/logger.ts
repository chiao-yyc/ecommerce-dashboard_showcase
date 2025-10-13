/**
 * 統一日誌管理系統
 *
 * @description 提供環境感知的日誌工具，自動控制開發/生產環境的日誌輸出
 * @usage
 *   import { logger } from '@/utils/logger'
 *   logger.debug('調試資訊', { data })
 *   logger.info('一般資訊')
 *   logger.warn('警告訊息')
 *   logger.error('錯誤訊息', error)
 *
 * @environment
 *   - 開發環境: 根據 VITE_LOG_LEVEL 控制輸出等級
 *   - 生產環境: 預設僅輸出 ERROR 等級，或根據 VITE_LOG_LEVEL 配置
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export interface LoggerConfig {
  level: LogLevel
  enableRouterDebug: boolean
  enableModulePrefix: boolean
  enableTimestamp: boolean
}

export interface LogContext {
  module?: string
  subModule?: string
  metadata?: Record<string, any>
}

/**
 * 日誌等級配置
 * 優先級: 環境變數 > 自動判斷（開發=DEBUG, 生產=ERROR）
 */
function getLogLevelFromEnv(): LogLevel {
  const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase()

  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    silent: LogLevel.SILENT,
  }

  if (envLevel && envLevel in levelMap) {
    return levelMap[envLevel]
  }

  // 自動判斷：開發環境預設 DEBUG，生產環境預設 ERROR
  return import.meta.env.MODE === 'development' ? LogLevel.DEBUG : LogLevel.ERROR
}

/**
 * 全域 Logger 配置
 */
const config: LoggerConfig = {
  level: getLogLevelFromEnv(),
  enableRouterDebug: import.meta.env.VITE_ENABLE_ROUTER_DEBUG === 'true',
  enableModulePrefix: true,
  enableTimestamp: import.meta.env.MODE === 'development',
}

/**
 * 格式化日誌訊息
 */
function formatMessage(
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
  message: string,
  context?: LogContext,
): string {
  const prefixes = {
    DEBUG: '🔍',
    INFO: '🔧',
    WARN: '⚠️',
    ERROR: '❌',
  }

  const parts: string[] = [prefixes[level]]

  // 時間戳記 (僅開發環境)
  if (config.enableTimestamp) {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    parts.push(`[${time}]`)
  }

  // 模組前綴
  if (config.enableModulePrefix && context?.module) {
    const moduleTag = context.subModule
      ? `[${context.module}:${context.subModule}]`
      : `[${context.module}]`
    parts.push(moduleTag)
  }

  parts.push(message)

  return parts.join(' ')
}

/**
 * 核心 Logger 類別
 */
class Logger {
  private context?: LogContext

  constructor(context?: LogContext) {
    this.context = context
  }

  /**
   * 調試日誌 (DEBUG)
   * 僅在開發環境或 LOG_LEVEL=debug 時輸出
   */
  debug(message: string, data?: any): void {
    if (config.level > LogLevel.DEBUG) return

    const formatted = formatMessage('DEBUG', message, this.context)
    if (data !== undefined) {
      console.debug(formatted, data)
    } else {
      console.debug(formatted)
    }
  }

  /**
   * 一般資訊日誌 (INFO)
   * 開發環境和生產環境都可能需要的資訊
   */
  info(message: string, data?: any): void {
    if (config.level > LogLevel.INFO) return

    const formatted = formatMessage('INFO', message, this.context)
    if (data !== undefined) {
      console.info(formatted, data)
    } else {
      console.info(formatted)
    }
  }

  /**
   * 警告日誌 (WARN)
   * 需要注意但不影響功能的問題
   */
  warn(message: string, data?: any): void {
    if (config.level > LogLevel.WARN) return

    const formatted = formatMessage('WARN', message, this.context)
    if (data !== undefined) {
      console.warn(formatted, data)
    } else {
      console.warn(formatted)
    }
  }

  /**
   * 錯誤日誌 (ERROR)
   * 關鍵錯誤，生產環境也需要輸出
   */
  error(message: string, error?: Error | unknown, data?: any): void {
    if (config.level > LogLevel.ERROR) return

    const formatted = formatMessage('ERROR', message, this.context)

    if (error && data) {
      console.error(formatted, error, data)
    } else if (error) {
      console.error(formatted, error)
    } else if (data) {
      console.error(formatted, data)
    } else {
      console.error(formatted)
    }

    // 生產環境可選：發送到錯誤追蹤服務
    if (import.meta.env.MODE === 'production') {
      this.sendToErrorTracking(message, error, data)
    }
  }

  /**
   * 路由專用調試日誌
   * 受 VITE_ENABLE_ROUTER_DEBUG 環境變數控制
   */
  routerDebug(message: string, data?: any): void {
    if (!config.enableRouterDebug) return
    if (config.level > LogLevel.DEBUG) return

    const formatted = formatMessage('DEBUG', message, {
      ...this.context,
      module: this.context?.module || 'Router',
    })

    if (data !== undefined) {
      console.debug(formatted, data)
    } else {
      console.debug(formatted)
    }
  }

  /**
   * 發送錯誤到追蹤系統（預留介面）
   * 實際實作根據使用的錯誤追蹤服務而定 (如 Sentry, LogRocket)
   */
  private sendToErrorTracking(
    _message: string,
    _error?: Error | unknown,
    _data?: any,
  ): void {
    // TODO: 整合 Sentry 或其他錯誤追蹤服務
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(_error, {
    //     tags: { module: this.context?.module },
    //     extra: { message: _message, data: _data }
    //   })
    // }
  }
}

/**
 * 建立模組專用 Logger
 * @param module 模組名稱 (如 'Router', 'API', 'Auth')
 * @param subModule 子模組名稱 (可選)
 * @returns Logger 實例
 *
 * @example
 * const log = createModuleLogger('Router', 'Auth')
 * log.debug('開始權限檢查', { permission: 'orders:read' })
 */
export function createModuleLogger(
  module: string,
  subModule?: string,
): Logger {
  return new Logger({ module, subModule })
}

/**
 * 預設全域 Logger 實例
 * 適用於不需要特定模組前綴的場景
 *
 * @example
 * import { logger } from '@/utils/logger'
 * logger.debug('調試資訊')
 * logger.info('操作成功')
 * logger.warn('庫存不足', { productId: 123 })
 * logger.error('API 調用失敗', error)
 */
export const logger = new Logger()

/**
 * 更新 Logger 配置（執行時動態調整）
 * @param newConfig 部分配置更新
 *
 * @example
 * // 臨時啟用路由調試
 * updateLoggerConfig({ enableRouterDebug: true })
 */
export function updateLoggerConfig(
  newConfig: Partial<LoggerConfig>,
): void {
  Object.assign(config, newConfig)
}

/**
 * 取得當前 Logger 配置（用於調試）
 */
export function getLoggerConfig(): Readonly<LoggerConfig> {
  return { ...config }
}

/**
 * 條件式日誌 (便捷函數)
 * @param condition 條件
 * @param level 日誌等級
 * @param message 訊息
 * @param data 附加資料
 *
 * @example
 * logIf(import.meta.env.DEV, 'debug', '開發專用訊息')
 */
export function logIf(
  condition: boolean,
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: any,
): void {
  if (!condition) return
  logger[level](message, data as any)
}

/**
 * 效能計時器（開發環境專用）
 * @param label 計時標籤
 * @returns 停止計時函數
 *
 * @example
 * const stopTimer = performanceTimer('API Call')
 * await fetchData()
 * stopTimer() // 輸出: ⏱️ [Performance] API Call: 235ms
 */
export function performanceTimer(label: string): () => void {
  if (import.meta.env.MODE !== 'development') {
    return () => {} // 生產環境不執行
  }

  const start = performance.now()
  return () => {
    const duration = (performance.now() - start).toFixed(2)
    logger.debug(`⏱️ [Performance] ${label}: ${duration}ms`)
  }
}

/**
 * 群組日誌（開發環境專用）
 * @param label 群組標籤
 * @param collapsed 是否預設收合
 * @returns 結束群組函數
 *
 * @example
 * const endGroup = logGroup('API 調用詳情')
 * logger.debug('請求 URL', url)
 * logger.debug('請求參數', params)
 * endGroup()
 */
export function logGroup(
  label: string,
  collapsed = false,
): () => void {
  if (config.level > LogLevel.DEBUG) {
    return () => {}
  }

  if (collapsed) {
    console.groupCollapsed(`📦 ${label}`)
  } else {
    console.group(`📦 ${label}`)
  }

  return () => console.groupEnd()
}

/**
 * 資料表格日誌（開發環境專用）
 * @param label 標籤
 * @param data 表格資料
 *
 * @example
 * logTable('用戶列表', users)
 */
export function logTable(label: string, data: any[]): void {
  if (config.level > LogLevel.DEBUG) return

  logger.debug(`📊 ${label}`)
  console.table(data)
}
