/**
 * 數字格式化工具集合
 * 
 * 提供統一的數字格式化功能，包括：
 * - 小數點格式化
 * - 百分比格式化  
 * - 貨幣格式化
 * - 本地化數字格式化
 * - 大數字格式化（K/M/B）
 * - 精確度控制
 */

export interface NumberFormatOptions {
  /** 小數點位數 */
  decimals?: number
  /** 本地化設置 */
  locale?: string
  /** 是否使用千分位符 */
  useGrouping?: boolean
  /** 最小小數位數 */
  minimumFractionDigits?: number
  /** 最大小數位數 */
  maximumFractionDigits?: number
}

export interface CurrencyFormatOptions extends NumberFormatOptions {
  /** 貨幣代碼 */
  currency?: string
  /** 貨幣顯示樣式 */
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name'
}

export interface CompactNumberOptions extends NumberFormatOptions {
  /** 緊凑顯示類型 */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
  /** 緊凑顯示樣式 */
  compactDisplay?: 'short' | 'long'
}

/**
 * 數字格式化工具類
 */
export class NumberFormatter {
  private static defaultLocale = 'zh-TW'

  /**
   * 格式化小數點位數
   */
  static toFixed(value: number | string, decimals: number = 1): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'
    return num.toFixed(decimals)
  }

  /**
   * 格式化百分比
   */
  static toPercentage(
    value: number | string, 
    decimals: number = 1, 
    options: NumberFormatOptions = {}
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0%'
    
    const { locale = this.defaultLocale } = options
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num / 100)
    } catch {
      return `${num.toFixed(decimals)}%`
    }
  }

  /**
   * 格式化貨幣
   */
  static toCurrency(
    value: number | string,
    options: CurrencyFormatOptions = {}
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '$0'
    
    const {
      locale = this.defaultLocale,
      currency = 'TWD',
      decimals = 0,
      currencyDisplay = 'symbol'
    } = options
    
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(num)
    } catch {
      return `$${num.toFixed(decimals)}`
    }
  }

  /**
   * 本地化數字格式化
   */
  static toLocaleString(
    value: number | string,
    options: NumberFormatOptions = {}
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'
    
    const {
      locale = this.defaultLocale,
      decimals,
      useGrouping = true,
      minimumFractionDigits = decimals,
      maximumFractionDigits = decimals
    } = options
    
    try {
      return new Intl.NumberFormat(locale, {
        useGrouping,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(num)
    } catch {
      return num.toLocaleString()
    }
  }

  /**
   * 大數字格式化 (K/M/B)
   */
  static toCompact(
    value: number | string,
    options: CompactNumberOptions = {}
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'
    
    const {
      locale = this.defaultLocale,
      notation = 'compact',
      compactDisplay = 'short',
      decimals = 1
    } = options
    
    try {
      return new Intl.NumberFormat(locale, {
        notation,
        compactDisplay,
        maximumFractionDigits: decimals,
      }).format(num)
    } catch {
      // 手動實現壓縮格式
      const absNum = Math.abs(num)
      const sign = num < 0 ? '-' : ''
      
      if (absNum >= 1_000_000_000) {
        return `${sign}${(absNum / 1_000_000_000).toFixed(decimals)}B`
      } else if (absNum >= 1_000_000) {
        return `${sign}${(absNum / 1_000_000).toFixed(decimals)}M`
      } else if (absNum >= 1_000) {
        return `${sign}${(absNum / 1_000).toFixed(decimals)}K`
      }
      
      return num.toString()
    }
  }

  /**
   * 範圍格式化 (min - max)
   */
  static toRange(
    min: number | string,
    max: number | string,
    options: NumberFormatOptions = {}
  ): string {
    const minNum = typeof min === 'string' ? parseFloat(min) : min
    const maxNum = typeof max === 'string' ? parseFloat(max) : max
    
    if (isNaN(minNum) || isNaN(maxNum)) return '0 - 0'
    
    const { decimals = 1 } = options
    const formattedMin = this.toFixed(minNum, decimals)
    const formattedMax = this.toFixed(maxNum, decimals)
    
    return `${formattedMin} - ${formattedMax}`
  }

  /**
   * 帶誤差範圍的數字格式化 (value ±margin)
   */
  static withMargin(
    value: number | string,
    margin: number | string,
    options: NumberFormatOptions = {}
  ): string {
    const num = typeof value === 'string' ? parseFloat(value) : value
    const marginNum = typeof margin === 'string' ? parseFloat(margin) : margin
    
    if (isNaN(num) || isNaN(marginNum)) return '0 ±0'
    
    const { decimals = 1 } = options
    const formattedValue = this.toFixed(num, decimals)
    const formattedMargin = this.toFixed(marginNum, decimals)
    
    return `${formattedValue} ±${formattedMargin}`
  }

  /**
   * 安全的數字轉換
   */
  static parseNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  /**
   * 檢查是否為有效數字
   */
  static isValidNumber(value: unknown): boolean {
    return typeof value === 'number' && !isNaN(value) && isFinite(value)
  }

  /**
   * 數字舍入到指定精度
   */
  static roundTo(value: number, precision: number): number {
    const factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
  }

  /**
   * 將數字限制在指定範圍內
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }
}

/**
 * 便利函數導出（向後兼容 + 簡化使用）
 */

/** 格式化小數點 - 替代 .toFixed() */
export const formatDecimal = NumberFormatter.toFixed

/** 格式化百分比 - 統一百分比顯示 */
export const formatPercentage = NumberFormatter.toPercentage

/** 格式化貨幣 - 統一貨幣顯示 */
export const formatCurrency = NumberFormatter.toCurrency

/** 格式化本地化數字 - 替代 .toLocaleString() */
export const formatLocaleNumber = NumberFormatter.toLocaleString

/** 格式化數字 - 統一的數字格式化 */
export const formatNumber = NumberFormatter.toLocaleString

/** 格式化大數字 - K/M/B 簡化顯示 */
export const formatCompactNumber = NumberFormatter.toCompact

/** 格式化範圍 - min-max 顯示 */
export const formatRange = NumberFormatter.toRange

/** 格式化帶誤差範圍 - value ±margin 顯示 */
export const formatWithMargin = NumberFormatter.withMargin

/** 安全數字解析 */
export const parseNumber = NumberFormatter.parseNumber

/** 數字有效性檢查 */
export const isValidNumber = NumberFormatter.isValidNumber

/** 數字舍入 */
export const roundTo = NumberFormatter.roundTo

/** 數字範圍限制 */
export const clamp = NumberFormatter.clamp

/**
 * 默認格式化選項
 */
export const defaultFormatOptions = {
  locale: 'zh-TW',
  currency: 'TWD',
  decimals: 1,
  useGrouping: true,
} as const

/**
 * 常用格式化預設
 */
export const formatPresets = {
  /** 整數格式化 */
  integer: (value: number | string) => formatDecimal(value, 0),

  /** 一位小數格式化 */
  oneDecimal: (value: number | string) => formatDecimal(value, 1),

  /** 兩位小數格式化 */
  twoDecimal: (value: number | string) => formatDecimal(value, 2),

  /** 百分比格式化（一位小數） */
  percentage: (value: number | string) => formatPercentage(value, 1),

  /** 百分比格式化（整數） */
  percentageInt: (value: number | string) => formatPercentage(value, 0),

  /** 台幣格式化 */
  twd: (value: number | string) => formatCurrency(value, { currency: 'TWD' }),

  /** 千分位數字 */
  thousands: (value: number | string) => formatLocaleNumber(value, { decimals: 0 }),

  /** 緊湊數字 K/M/B */
  compact: (value: number | string) => formatCompactNumber(value),
} as const

/**
 * 業務指標格式化工具
 * 基於內建預設值的專業業務格式化函數
 */
// 安全的預設值常數，確保在所有環境下都能正常載入
const BUSINESS_FORMAT_DEFAULTS = {
  PERCENTAGE_DECIMALS: 1,
  SCORE_DECIMALS: 1,
  CURRENCY_DECIMALS: 0,
  RATE_DECIMALS: 1,
  COUNT_DECIMALS: 0,
  PRECISION_DECIMALS: 2,
  DEFAULT_CURRENCY: 'TWD',
  DEFAULT_LOCALE: 'zh-TW',
  NULL_VALUE_DISPLAY: 'N/A',
  ZERO_VALUE_DISPLAY: '0'
} as const

export class BusinessMetricsFormatter {
  /**
   * 滿意度分數格式化 (0-10，一位小數)
   */
  static formatSatisfactionScore(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    if (value === 0) return BUSINESS_FORMAT_DEFAULTS.ZERO_VALUE_DISPLAY
    return NumberFormatter.toFixed(value, BUSINESS_FORMAT_DEFAULTS.SCORE_DECIMALS)
  }

  /**
   * 轉換率格式化 (百分比，一位小數)
   */
  static formatConversionRate(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toPercentage(value, BUSINESS_FORMAT_DEFAULTS.PERCENTAGE_DECIMALS)
  }

  /**
   * 成長率格式化 (百分比，一位小數，包含正負號)
   */
  static formatGrowthRate(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    const formatted = NumberFormatter.toPercentage(Math.abs(value), BUSINESS_FORMAT_DEFAULTS.PERCENTAGE_DECIMALS)
    const sign = value >= 0 ? '+' : '-'
    return `${sign}${formatted}`
  }

  /**
   * 營收格式化 (貨幣，無小數)
   */
  static formatRevenue(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toCurrency(value, {
      currency: BUSINESS_FORMAT_DEFAULTS.DEFAULT_CURRENCY,
      locale: BUSINESS_FORMAT_DEFAULTS.DEFAULT_LOCALE,
      decimals: BUSINESS_FORMAT_DEFAULTS.CURRENCY_DECIMALS
    })
  }

  /**
   * 訂單數量格式化 (整數，千分位)
   */
  static formatOrderCount(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toLocaleString(value, {
      locale: BUSINESS_FORMAT_DEFAULTS.DEFAULT_LOCALE,
      decimals: BUSINESS_FORMAT_DEFAULTS.COUNT_DECIMALS
    })
  }

  /**
   * 平均值格式化 (一位小數)
   */
  static formatAverageValue(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toFixed(value, BUSINESS_FORMAT_DEFAULTS.RATE_DECIMALS)
  }

  /**
   * 風險評分格式化 (0-100，一位小數)
   */
  static formatRiskScore(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toFixed(value, BUSINESS_FORMAT_DEFAULTS.SCORE_DECIMALS)
  }

  /**
   * 客戶數量格式化 (整數，千分位)
   */
  static formatCustomerCount(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toLocaleString(value, {
      locale: BUSINESS_FORMAT_DEFAULTS.DEFAULT_LOCALE,
      decimals: BUSINESS_FORMAT_DEFAULTS.COUNT_DECIMALS
    })
  }

  /**
   * 效率指標格式化 (百分比，一位小數)
   */
  static formatEfficiencyRate(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toPercentage(value, BUSINESS_FORMAT_DEFAULTS.PERCENTAGE_DECIMALS)
  }

  /**
   * 庫存數量格式化 (整數)
   */
  static formatStockQuantity(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return BUSINESS_FORMAT_DEFAULTS.NULL_VALUE_DISPLAY
    return NumberFormatter.toLocaleString(value, {
      locale: BUSINESS_FORMAT_DEFAULTS.DEFAULT_LOCALE,
      decimals: BUSINESS_FORMAT_DEFAULTS.COUNT_DECIMALS
    })
  }
}

/**
 * 業務指標格式化便利函數
 */
export const businessFormatters = {
  satisfactionScore: BusinessMetricsFormatter.formatSatisfactionScore,
  conversionRate: BusinessMetricsFormatter.formatConversionRate,
  growthRate: BusinessMetricsFormatter.formatGrowthRate,
  revenue: BusinessMetricsFormatter.formatRevenue,
  orderCount: BusinessMetricsFormatter.formatOrderCount,
  averageValue: BusinessMetricsFormatter.formatAverageValue,
  riskScore: BusinessMetricsFormatter.formatRiskScore,
  customerCount: BusinessMetricsFormatter.formatCustomerCount,
  efficiencyRate: BusinessMetricsFormatter.formatEfficiencyRate,
  stockQuantity: BusinessMetricsFormatter.formatStockQuantity
} as const