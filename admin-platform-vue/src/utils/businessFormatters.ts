/**
 * 業務指標格式化組合式函數
 *
 * 提供統一的業務指標格式化方法，確保整個應用的數值顯示一致性
 * 基於 BusinessMetricsFormatter 和 FORMAT_DEFAULTS 配置
 */

import { createModuleLogger } from '@/utils/logger'
import { businessFormatters } from './numbers'

const log = createModuleLogger('Utils', 'businessFormatters')

// 內建預設值，避免循環依賴
const FORMAT_DEFAULTS = {
  PERCENTAGE_DECIMALS: 1,
  SCORE_DECIMALS: 1,
  CURRENCY_DECIMALS: 0,
  RATE_DECIMALS: 1,
  COUNT_DECIMALS: 0,
  PRECISION_DECIMALS: 2,
  DEFAULT_CURRENCY: 'TWD',
  DEFAULT_LOCALE: 'zh-TW',
  LARGE_NUMBER_THRESHOLD: 10000,
  PERCENTAGE_MAX: 100,
  SCORE_MAX: 10,
  NULL_VALUE_DISPLAY: 'N/A',
  ZERO_VALUE_DISPLAY: '0',
  LOADING_DISPLAY: '載入中...'
} as const

/**
 * 業務格式化組合式函數
 * 提供統一的格式化方法和驗證邏輯
 */
export function useBusinessFormatting() {
  /**
   * 格式化 Overview Card 的數值
   */
  const formatOverviewCardValue = (
    value: number | null | undefined,
    type: 'satisfaction' | 'conversion' | 'revenue' | 'orders' | 'customers' | 'growth' | 'score' | 'rate'
  ): string => {
    switch (type) {
      case 'satisfaction':
        return businessFormatters.satisfactionScore(value)
      case 'conversion':
        return businessFormatters.conversionRate(value)
      case 'revenue':
        return businessFormatters.revenue(value)
      case 'orders':
        return businessFormatters.orderCount(value)
      case 'customers':
        return businessFormatters.customerCount(value)
      case 'growth':
        return businessFormatters.growthRate(value)
      case 'score':
        return businessFormatters.riskScore(value)
      case 'rate':
        return businessFormatters.efficiencyRate(value)
      default:
        return businessFormatters.averageValue(value)
    }
  }

  /**
   * 格式化儀表板數值
   * 統一的儀表板數值格式化接口
   */
  const formatDashboardValue = (
    value: number | null | undefined,
    metric: 'percentage' | 'currency' | 'count' | 'score' | 'rate' | 'average'
  ): string => {
    switch (metric) {
      case 'percentage':
        return businessFormatters.conversionRate(value)
      case 'currency':
        return businessFormatters.revenue(value)
      case 'count':
        return businessFormatters.orderCount(value)
      case 'score':
        return businessFormatters.satisfactionScore(value)
      case 'rate':
        return businessFormatters.efficiencyRate(value)
      case 'average':
        return businessFormatters.averageValue(value)
      default:
        return FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    }
  }

  /**
   * 驗證數值是否需要格式化
   */
  const shouldFormat = (value: unknown): value is number => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  }

  /**
   * 安全格式化 - 帶有回調機制
   */
  const safeFormat = (
    value: unknown,
    formatter: (val: number) => string,
    fallback: string = FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
  ): string => {
    if (!shouldFormat(value)) return fallback
    try {
      return formatter(value)
    } catch (error) {
      log.warn('Formatting error:', error)
      return fallback
    }
  }

  /**
   * 批量格式化 - 用於處理多個數值的場景
   */
  const batchFormat = <T extends Record<string, any>>(
    data: T,
    formatRules: Partial<Record<keyof T, (value: unknown) => string>>
  ): T => {
    const formatted = { ...data }

    for (const [key, formatter] of Object.entries(formatRules)) {
      if (key in formatted && formatter) {
        formatted[key as keyof T] = safeFormat(
          formatted[key as keyof T],
          formatter,
          FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
        ) as T[keyof T]
      }
    }

    return formatted
  }

  /**
   * 取得格式化配置
   */
  const getFormatDefaults = () => FORMAT_DEFAULTS

  /**
   * 直接存取業務格式化函數
   */
  const formatters = businessFormatters

  return {
    // 主要格式化方法
    formatOverviewCardValue,
    formatDashboardValue,

    // 輔助工具
    safeFormat,
    shouldFormat,
    batchFormat,

    // 配置和格式化器
    getFormatDefaults,
    formatters,

    // 常用別名，為了向後兼容和便利性
    formatSatisfaction: businessFormatters.satisfactionScore,
    formatConversion: businessFormatters.conversionRate,
    formatRevenue: businessFormatters.revenue,
    formatOrders: businessFormatters.orderCount,
    formatCustomers: businessFormatters.customerCount,
    formatGrowth: businessFormatters.growthRate,
    formatScore: businessFormatters.riskScore,
    formatRate: businessFormatters.efficiencyRate,
    formatAverage: businessFormatters.averageValue,
    formatStock: businessFormatters.stockQuantity
  }
}

/**
 * 格式化類型定義
 */
export type OverviewCardValueType = 'satisfaction' | 'conversion' | 'revenue' | 'orders' | 'customers' | 'growth' | 'score' | 'rate'
export type DashboardMetricType = 'percentage' | 'currency' | 'count' | 'score' | 'rate' | 'average'
export type FormatterFunction = (value: number | null | undefined) => string

/**
 * 格式化規則映射類型
 */
export type FormatRules<T> = Partial<Record<keyof T, FormatterFunction>>

/**
 * 常用格式化預設組合
 */
export const COMMON_FORMAT_RULES = {
  // Overview Cards 常用規則
  overviewCard: {
    satisfaction: businessFormatters.satisfactionScore,
    conversion: businessFormatters.conversionRate,
    revenue: businessFormatters.revenue,
    orders: businessFormatters.orderCount,
    customers: businessFormatters.customerCount,
    growth: businessFormatters.growthRate
  },

  // Dashboard 常用規則
  dashboard: {
    percentage: businessFormatters.conversionRate,
    currency: businessFormatters.revenue,
    count: businessFormatters.orderCount,
    score: businessFormatters.satisfactionScore,
    rate: businessFormatters.efficiencyRate,
    average: businessFormatters.averageValue
  },

  // 財務相關規則
  financial: {
    revenue: businessFormatters.revenue,
    cost: businessFormatters.revenue,
    profit: businessFormatters.revenue,
    margin: businessFormatters.conversionRate,
    roi: businessFormatters.conversionRate
  }
} as const