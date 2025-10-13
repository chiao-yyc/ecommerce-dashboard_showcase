/**
 * Analytics 數據格式化工具
 * 提供統一的數據格式化方法，用於所有 Analytics 模組
 */

import type { ExportFormat } from './export'
import { formatCurrency as baseCurrency, formatPercentage as basePercentage, formatNumber as baseNumber } from './numbers'
import { createModuleLogger } from './logger'

const log = createModuleLogger('Utils', 'FormatAnalytics')

// 基礎數據類型定義
export interface DateRange {
  start: string | Date
  end: string | Date
}

export interface AnalyticsDataBase {
  exportDate: string
  period?: string
  customDateRange?: DateRange
}

export interface FormattedData<T = Record<string, unknown>> {
  data: T[]
  metadata: {
    totalRecords: number
    exportTimestamp: string
    moduleType: string
    formatVersion: string
  }
}

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeMetadata?: boolean
  flattenData?: boolean
  dateFormat?: 'iso' | 'locale'
}

/**
 * 格式化貨幣數值 - 使用統一的數字格式化工具
 */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'TWD',
  locale = 'zh-TW'
): string {
  if (value == null || isNaN(value)) return 'N/A'
  return baseCurrency(value, { currency, locale, decimals: 0, maximumFractionDigits: 2 })
}

/**
 * 格式化百分比 - 使用統一的數字格式化工具
 */
export function formatPercentage(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value == null || isNaN(value)) return 'N/A'
  return basePercentage(value, decimals)
}

/**
 * 格式化數字 - 使用統一的數字格式化工具
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0,
  locale = 'zh-TW'
): string {
  if (value == null || isNaN(value)) return 'N/A'
  return baseNumber(value, { decimals, locale })
}

/**
 * 格式化日期
 */
export function formatDate(
  date: string | Date | null | undefined,
  format: 'iso' | 'locale' | 'short' | 'long' = 'locale',
  locale = 'zh-TW'
): string {
  if (!date) return 'N/A'
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return 'N/A'
  
  switch (format) {
    case 'iso':
      return dateObj.toISOString().split('T')[0]
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    case 'long':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    default:
      return dateObj.toLocaleDateString(locale)
  }
}

/**
 * 格式化時間
 */
export function formatTime(
  seconds: number | null | undefined,
  format: 'hms' | 'human' = 'human'
): string {
  if (seconds == null || isNaN(seconds)) return 'N/A'
  
  if (format === 'hms') {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }
  }
  
  // Human readable format
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}分鐘`
  } else if (seconds < 86400) {
    return `${Math.round(seconds / 3600)}小時`
  } else {
    return `${Math.round(seconds / 86400)}天`
  }
}

/**
 * 深度扁平化物件
 */
export function flattenObject(obj: object, prefix = '', separator = '.'): Record<string, unknown> {
  const flattened: Record<string, unknown> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as any)[key]
      const newKey = prefix ? `${prefix}${separator}${key}` : key
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, flattenObject(value as object, newKey, separator))
      } else {
        flattened[newKey] = value
      }
    }
  }
  
  return flattened
}

/**
 * 格式化 Analytics 數據為匯出格式
 */
export function formatForExport<T extends AnalyticsDataBase>(
  data: T,
  moduleType: string,
  options: Partial<ExportOptions> = {}
): FormattedData {
  const {
    flattenData = false,
    includeMetadata = true,
    dateFormat = 'locale'
  } = options
  
  // 提取實際數據（排除 metadata 欄位）
  const { exportDate, period, customDateRange, ...actualData } = data
  
  // 轉換為數組格式
  const dataArray: Record<string, unknown>[] = []
  
  for (const [key, value] of Object.entries(actualData)) {
    if (Array.isArray(value)) {
      // 如果是數組，直接添加每個項目
      value.forEach(item => {
        const formattedItem = flattenData ? flattenObject(item as object) : item
        if (formattedItem && typeof formattedItem === 'object') {
          ;(formattedItem as Record<string, unknown>)._category = key
          dataArray.push(formattedItem as Record<string, unknown>)
        }
      })
    } else if (value && typeof value === 'object') {
      // 如果是物件，轉換為單個項目
      const formattedItem = flattenData ? flattenObject(value as object) : value
      if (formattedItem) {
        ;(formattedItem as Record<string, unknown>)._category = key
        dataArray.push(formattedItem as Record<string, unknown>)
      }
    } else if (value != null) {
      // 如果是基本值，包裝為物件
      dataArray.push({
        _category: key,
        value: value
      })
    }
  }
  
  // 格式化日期欄位
  if (dateFormat !== 'iso') {
    dataArray.forEach(item => {
      for (const key in item) {
        if (typeof item[key] === 'string' && isValidDate(item[key])) {
          item[key] = formatDate(item[key], dateFormat)
        }
      }
    })
  }
  
  const metadata = {
    totalRecords: dataArray.length,
    exportTimestamp: new Date().toISOString(),
    moduleType,
    formatVersion: '1.0.0',
    ...(includeMetadata && {
      period,
      customDateRange: customDateRange ? {
        start: formatDate(customDateRange.start, dateFormat),
        end: formatDate(customDateRange.end, dateFormat)
      } : null,
      exportDate: formatDate(exportDate, dateFormat)
    })
  }
  
  return {
    data: dataArray,
    metadata
  }
}

/**
 * 檢查字串是否為有效日期
 */
function isValidDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * 將格式化數據匯出為檔案
 */
export function exportFormattedData(
  formattedData: FormattedData,
  options: ExportOptions
): void {
  const {
    format,
    filename = `analytics_export_${formatDate(new Date(), 'iso')}`,
    includeMetadata = true
  } = options
  
  let content: string
  let mimeType: string
  let fileExtension: string
  
  switch (format) {
    case 'json':
      content = JSON.stringify({
        ...(includeMetadata && { metadata: formattedData.metadata }),
        data: formattedData.data
      }, null, 2)
      mimeType = 'application/json'
      fileExtension = 'json'
      break
      
    case 'csv':
      content = convertToCSV(formattedData.data)
      mimeType = 'text/csv'
      fileExtension = 'csv'
      break
      
    case 'xlsx':
      // 這裡需要實際的 XLSX 實現
      throw new Error('XLSX 格式匯出需要額外實現')
      
    default:
      throw new Error(`不支援的匯出格式: ${format}`)
  }
  
  // 建立和下載檔案
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.${fileExtension}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * 轉換數據為 CSV 格式
 */
function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  
  // 獲取所有欄位名稱
  const headers = new Set<string>()
  data.forEach(row => {
    Object.keys(row).forEach(key => headers.add(key))
  })
  
  const headerArray = Array.from(headers)
  
  // 建立 CSV 內容
  const csvContent = [
    // Headers
    headerArray.map(header => `"${header}"`).join(','),
    // Data rows
    ...data.map(row => 
      headerArray.map(header => {
        const value = row[header]
        if (value == null) return '""'
        const stringValue = String(value).replace(/"/g, '""')
        return `"${stringValue}"`
      }).join(',')
    )
  ].join('\n')
  
  // 添加 BOM 以支援中文
  return '\uFEFF' + csvContent
}

/**
 * 預定義的格式化預設
 */
export const ANALYTICS_FORMATS = {
  CURRENCY: {
    format: formatCurrency,
    options: { currency: 'TWD', locale: 'zh-TW' }
  },
  PERCENTAGE: {
    format: formatPercentage,
    options: { decimals: 1 }
  },
  NUMBER: {
    format: formatNumber,
    options: { locale: 'zh-TW' }
  },
  DATE: {
    format: formatDate,
    options: { format: 'locale', locale: 'zh-TW' }
  },
  TIME: {
    format: formatTime,
    options: { format: 'human' }
  }
} as const

/**
 * 批量格式化數據
 */
export function applyFormatsToData<T extends Record<string, unknown>>(
  data: T[],
  formatRules: Record<keyof T, { type: keyof typeof ANALYTICS_FORMATS; options?: Record<string, unknown> }>
): T[] {
  return data.map(item => {
    const formattedItem = { ...item }
    
    for (const [field, rule] of Object.entries(formatRules)) {
      if (field in formattedItem) {
        const formatter = ANALYTICS_FORMATS[rule.type]
        const options = { ...formatter.options, ...rule.options }
        const optionValues = Object.values(options || {}).filter(v => v !== undefined && v !== null)
        try {
          if (optionValues.length > 0) {
            ;(formattedItem as Record<string, unknown>)[field] = formatter.format((formattedItem as any)[field], ...optionValues as any)
          } else {
            ;(formattedItem as Record<string, unknown>)[field] = formatter.format((formattedItem as any)[field])
          }
        } catch (error) {
          // Fallback to original value if formatting fails
          log.warn(`Failed to format field ${field}`, error)
        }
      }
    }
    
    return formattedItem
  })
}