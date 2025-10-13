/**
 * 通用工具函數集合
 * 
 * 整合所有項目中使用的通用工具函數，包括：
 * - 樣式處理
 * - 檔案名稱處理
 * - 日期時間格式化
 * - 數字格式化
 * - 陣列操作
 * - 異步操作
 * - 貨幣格式化
 * - 通知系統輔助函數
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import type { Updater } from '@tanstack/vue-table'
import type { Ref } from 'vue'
import { i18n } from '@/plugins/i18n'
import { textCopyable } from '@/components/data-table-common/columnFormat'
import { formatCurrency as baseCurrency } from './numbers'

const { locale, t } = i18n.global

// ==================== 樣式工具 ====================

/**
 * 合併 className，支援條件樣式和 Tailwind 衝突解決
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==================== Vue 相關工具 ====================

/**
 * Vue Table 更新器輔助函數
 */
export function valueUpdater<T extends Updater<any>>(
  updaterOrValue: T,
  ref: Ref,
) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue
}

// ==================== 檔案處理工具 ====================

/**
 * 清理檔案名稱，移除特殊字符
 */
export function sanitizeFileName(name: string) {
  return name
    .replace(/\s+/g, '-') // 空白改成 dash
    .replace(/[^\w.-]/g, '') // 移除非字母數字與 dash/dot
}

// ==================== 日期時間工具 ====================

/**
 * 安全的日期轉換輔助函數
 */
const parseDate = (date: Date | string): Date | null => {
  let d: Date
  if (typeof date === 'string') {
    d = new Date(date)
  } else if (date instanceof Date) {
    d = date
  } else {
    return null
  }
  
  // 檢查是否為有效日期
  if (isNaN(d.getTime())) {
    return null
  }
  
  return d
}

export const df = new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' })

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string, defaultValue: string = '') => {
  const d = parseDate(date)
  if (!d) return defaultValue
  
  const df = new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' })
  return df.format(d)
}

/**
 * 格式化時間
 */
export const formatTime = (date: Date | string, defaultValue: string = '') => {
  const d = parseDate(date)
  if (!d) return defaultValue
  
  const tf = new Intl.DateTimeFormat(locale.value, { timeStyle: 'short' })
  return tf.format(d)
}

/**
 * 取得相對時間（如：2天前）
 */
export const getRelativeTime = (
  date: Date | string,
  emptyDefaultValue?: string,
  minuteDefaultValue?: string,
) => {
  const d = parseDate(date)
  if (!d) return emptyDefaultValue || t('ui.neverUpdated')
  
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / 1000 // 秒數差異

  const units: { unit: Intl.RelativeTimeFormatUnit; value: number }[] = [
    { unit: 'year', value: 60 * 60 * 24 * 365 },
    { unit: 'month', value: 60 * 60 * 24 * 30 },
    { unit: 'day', value: 60 * 60 * 24 },
    { unit: 'hour', value: 60 * 60 },
    { unit: 'minute', value: 60 },
    { unit: 'second', value: 1 },
  ]

  for (const { unit, value } of units) {
    const diffInUnit = diff / value
    if (Math.abs(diffInUnit) >= 1 || unit === 'second') {
      return rtf.format(Math.round(diffInUnit), unit)
    }
  }

  return minuteDefaultValue || t('ui.inMinute')
}

/**
 * 格式化相對時間（中文版本）
 */
export const formatRelativeTime = (
  date: Date | string,
  defaultValue: string = '',
) => {
  const d = parseDate(date)
  if (!d) return defaultValue

  const now = new Date()
  const diff = now.getTime() - d.getTime()

  // 轉換為秒
  const seconds = Math.floor(diff / 1000)

  if (seconds < 60) {
    return '剛剛'
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}分鐘前`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}小時前`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}天前`
  }

  const weeks = Math.floor(days / 7)
  if (weeks < 4) {
    return `${weeks}週前`
  }

  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months}個月前`
  }

  const years = Math.floor(days / 365)
  return `${years}年前`
}

/**
 * 轉換為 ISO String
 */
export const convertToISOString = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return date instanceof Date ? date.toISOString() : ''
}

/**
 * 格式化為日期字串 (YYYY-MM-DD)
 */
export const formatDateOnly = (date: Date | string, defaultValue: string = '') => {
  const d = parseDate(date)
  if (!d) return defaultValue
  
  return d.toISOString().split('T')[0]
}

/**
 * 格式化為完整日期時間顯示
 */
export const formatDateTime = (date: Date | string, defaultValue: string = '') => {
  const d = parseDate(date)
  if (!d) return defaultValue
  
  const dtf = new Intl.DateTimeFormat(locale.value, { 
    dateStyle: 'short', 
    timeStyle: 'short' 
  })
  return dtf.format(d)
}

/**
 * 格式化為本地化字串（相容 toLocaleString）
 */
export const formatLocaleString = (date: Date | string, defaultValue: string = '') => {
  const d = parseDate(date)
  if (!d) return defaultValue
  
  return d.toLocaleString(locale.value)
}

// ==================== 資料格式化工具 ====================

/**
 * 格式化表格空值
 */
export const formatDataTableEmptyValue = (value: string | null) => {
  return value === null || value === undefined || value === '' ? '-' : value
}

/**
 * 統一的表格 ID 顯示格式化函數
 * @param id - 完整的 UUID 或 ID 字串
 * @param displayLength - 顯示長度，預設為 8 碼
 * @param className - 額外的 CSS 類別，預設為 'font-mono'
 * @returns textCopyable 元件，提供可複製的 ID 顯示
 */
/**
 * 改進的表格ID格式化函數
 * @param id - ID值
 * @param options - 配置選項
 */
export const formatTableId = (
  id: string | null | undefined, 
  options: {
    displayLength?: number  // undefined = 不截取
    className?: string
    fallbackText?: string
    withFallbackId?: string  // 當ID為空時，顯示此ID的前8碼
  } = {}
) => {
  const { displayLength, className = 'font-mono', fallbackText = '待設定', withFallbackId } = options
  
  if (!id || id.trim() === '') {
    // 使用現有的空值處理邏輯
    if (withFallbackId) {
      return `${withFallbackId.slice(0, 8)} (${fallbackText})`
    }
    return formatDataTableEmptyValue(fallbackText)
  }
  
  // 使用 textCopyable，可選擇是否截取
  return textCopyable(id, className, displayLength)
}

/**
 * 專用於訂單編號的格式化函數
 * 當訂單編號為空時顯示更有意義的訊息
 */
/**
 * 專用於訂單編號的格式化函數（向後兼容）
 */
export const formatOrderNumber = (orderNumber: string | null | undefined, orderId?: string) => {
  return formatTableId(orderNumber, {
    fallbackText: '待生成編號',
    withFallbackId: orderId
  })
}

/**
 * 統一的表格數值格式化函數
 * @param value - 要格式化的值
 * @param type - 格式化類型：'text', 'currency', 'date'
 * @param options - 額外選項
 */
export const formatTableValue = (value: unknown, type: 'text' | 'currency' | 'date' = 'text', options?: Record<string, unknown>) => {
  if (value == null || value === '') {
    return formatDataTableEmptyValue(value as any)
  }
  
  switch (type) {
    case 'currency': 
      return formatCurrency(value as number, options?.locale as string, options?.currency as string, options?.minimumFractionDigits as number)
    case 'date': 
      return formatDate(value as string | Date, options?.defaultValue as string)
    default: 
      return value
  }
}

/**
 * 格式化貨幣 - 使用統一的數字格式化工具
 */
export const formatCurrency = (
  amount: number,
  locale: string = 'zh-TW',
  currency: string = 'TWD',
  minimumFractionDigits: number = 0,
) => {
  return baseCurrency(amount, {
    locale,
    currency,
    minimumFractionDigits,
    decimals: minimumFractionDigits
  })
}

// ==================== 通知系統工具 ====================

import type { NotificationPriority, NotificationType } from '@/types'

/**
 * Toast 變體類型
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

/**
 * 根據通知優先級和類型映射對應的 Toast 變體
 */
export function getToastVariant(notification: {
  priority: NotificationPriority
  type: NotificationType
}): ToastVariant {
  // 優先級映射 - 緊急通知直接顯示為錯誤
  if (notification.priority === 'urgent') {
    return 'error'
  }

  // 語義化類型映射 - 僅包含可用的通知類型
  const errorTypes: string[] = ['INVENTORY_OUT_OF_STOCK']

  const warningTypes: string[] = [
    'INVENTORY_LOW_STOCK',
    'CUSTOMER_SERVICE_URGENT',
    'CUSTOMER_SERVICE_OVERDUE',
  ]

  const successTypes: string[] = [
    'ORDER_NEW',
    'ORDER_CANCELLED',
    'INVENTORY_OVERSTOCK',
  ]

  // 檢查類型映射
  if (errorTypes.includes(notification.type)) return 'error'
  if (warningTypes.includes(notification.type)) return 'warning'
  if (successTypes.includes(notification.type)) return 'success'

  // 根據優先級的默認映射
  switch (notification.priority) {
    case 'high':
      return 'warning'
    case 'medium':
    case 'low':
    default:
      return 'info'
  }
}

/**
 * 獲取 Toast 變體的顯示文字
 */
export function getToastVariantLabel(variant: ToastVariant): string {
  const labels: Record<ToastVariant, string> = {
    success: '成功',
    error: '錯誤',
    warning: '警告',
    info: '資訊',
  }

  return labels[variant]
}

/**
 * 根據通知內容生成 Toast 訊息
 */
export function generateToastMessage(notification: {
  title: string
  message: string
  priority: NotificationPriority
  type: NotificationType
}): {
  variant: ToastVariant
  title: string
  message: string
} {
  const variant = getToastVariant(notification)
  const variantLabel = getToastVariantLabel(variant)

  return {
    variant,
    title: `[${variantLabel}] ${notification.title}`,
    message: notification.message,
  }
}

// ==================== Lodash 整合層 ====================

/**
 * Lodash-es 函數統一匯出
 * 優先使用成熟穩定的 lodash 實現，避免重複造輪子
 */

// 陣列操作 - 使用 lodash-es
export {
  groupBy,
  uniq as unique,
  chunk,
  sortBy,
  flatten,
  isEmpty,
  uniqBy,
  orderBy,
  partition,
  zip,
  difference,
  intersection,
  union,
  compact,
  reverse,
  shuffle,
  sample
} from 'lodash-es'

// 異步控制 - 使用 lodash-es
export {
  debounce,
  throttle,
  delay
} from 'lodash-es'

// 物件操作 - 使用 lodash-es
export {
  pick,
  omit,
  get,
  set,
  has,
  merge,
  cloneDeep,
  isEqual,
  isObject,
  isArray,
  isString,
  isNumber,
  isFunction,
  isUndefined,
  isNull,
  isDate
} from 'lodash-es'

// 函數工具 - 使用 lodash-es
export {
  once,
  memoize,
  curry,
  partial
} from 'lodash-es'

// ==================== 業務特化工具匯出 ====================

// 數字格式化工具 (業務特化，lodash 未提供)
export * from './numbers'

// 業務指標格式化組合式函數 (統一數值格式化)
export * from './businessFormatters'

// 業務陣列操作工具 (統計、分頁、樹狀結構等業務邏輯)
export * from './arrays'

// 業務異步操作工具 (Vue 整合、定時器管理、錯誤處理等)
export * from './async'

// 延遲清除工具 (UX 特化功能)
export * from './delayedClear'

// 顏色處理工具
export * from './colors'