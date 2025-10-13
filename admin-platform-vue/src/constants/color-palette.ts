/**
 * 統一色彩調色板系統
 * 提供豐富的色彩選項，用於 Badge 外部樣式管理
 * 支援 Holiday 語義化固定色彩和 Campaign 動態分配
 */

/**
 * 基礎色彩調色板
 * 使用 Tailwind CSS 色彩，提供一致的視覺體驗
 * 每個色彩包含：背景、文字、邊框、懸停效果
 */
export const COLOR_PALETTE = {
  // 暖色系列
  red: 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200',
  orange:
    'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200',
  amber:
    'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200',
  yellow:
    'bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200',

  // 自然色系列
  green:
    'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200',
  emerald:
    'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200',
  teal: 'bg-teal-100 text-teal-700 border border-teal-200 hover:bg-teal-200',
  cyan: 'bg-cyan-100 text-cyan-700 border border-cyan-200 hover:bg-cyan-200',

  // 冷色系列
  blue: 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200',
  sky: 'bg-sky-100 text-sky-700 border border-sky-200 hover:bg-sky-200',
  indigo:
    'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200',
  violet:
    'bg-violet-100 text-violet-700 border border-violet-200 hover:bg-violet-200',

  // 優雅色系列
  purple:
    'bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200',
  fuchsia:
    'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 hover:bg-fuchsia-200',
  pink: 'bg-pink-100 text-pink-700 border border-pink-200 hover:bg-pink-200',
  rose: 'bg-rose-100 text-rose-700 border border-rose-200 hover:bg-rose-200',

  // 中性色系列
  gray: 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200',
  slate:
    'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200',
  zinc: 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200',
  stone:
    'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200',
} as const

/**
 * 主題感知色彩調色板
 * 支援深色模式，使用透明度實現主題適應
 */
export const THEME_AWARE_PALETTE = {
  // 暖色系列
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20',
  orange:
    'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20',
  amber:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20',
  yellow:
    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20',

  // 自然色系列
  green:
    'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20',
  emerald:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
  teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 hover:bg-teal-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20',

  // 冷色系列
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20',
  indigo:
    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20',
  violet:
    'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20',

  // 優雅色系列
  purple:
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 hover:bg-purple-500/20',
  fuchsia:
    'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/20 hover:bg-fuchsia-500/20',
  pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 hover:bg-pink-500/20',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',

  // 中性色系列
  gray: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20 hover:bg-gray-500/20',
  slate:
    'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 hover:bg-slate-500/20',
} as const

/**
 * Calendar Dot 專用色彩
 * 用於日曆上的小圓點標記，使用較高透明度
 */
export const CALENDAR_DOT_PALETTE = {
  // 暖色系列
  red: 'bg-red-500/80',
  orange: 'bg-orange-500/80',
  amber: 'bg-amber-500/80',
  yellow: 'bg-yellow-500/80',

  // 自然色系列
  green: 'bg-green-500/80',
  emerald: 'bg-emerald-500/80',
  teal: 'bg-teal-500/80',
  cyan: 'bg-cyan-500/80',

  // 冷色系列
  blue: 'bg-blue-500/80',
  sky: 'bg-sky-500/80',
  indigo: 'bg-indigo-500/80',
  violet: 'bg-violet-500/80',

  // 優雅色系列
  purple: 'bg-purple-500/80',
  fuchsia: 'bg-fuchsia-500/80',
  pink: 'bg-pink-500/80',
  rose: 'bg-rose-500/80',

  // 中性色系列
  gray: 'bg-gray-500/80',
  slate: 'bg-slate-500/80',
} as const

/**
 * Calendar Border 專用色彩
 * 用於日曆格子的邊框，使用實心顏色
 */
export const CALENDAR_BORDER_PALETTE = {
  // 暖色系列
  red: 'border-2 border-red-500',
  orange: 'border-2 border-orange-500',
  amber: 'border-2 border-amber-500',
  yellow: 'border-2 border-yellow-500',

  // 自然色系列
  green: 'border-2 border-green-500',
  emerald: 'border-2 border-emerald-500',
  teal: 'border-2 border-teal-500',
  cyan: 'border-2 border-cyan-500',

  // 冷色系列
  blue: 'border-2 border-blue-500',
  sky: 'border-2 border-sky-500',
  indigo: 'border-2 border-indigo-500',
  violet: 'border-2 border-violet-500',

  // 優雅色系列
  purple: 'border-2 border-purple-500',
  fuchsia: 'border-2 border-fuchsia-500',
  pink: 'border-2 border-pink-500',
  rose: 'border-2 border-rose-500',

  // 中性色系列
  gray: 'border-2 border-gray-500',
  slate: 'border-2 border-slate-500',
} as const

/**
 * 色彩名稱類型定義
 */
export type ColorName = keyof typeof COLOR_PALETTE

/**
 * 獲取色彩陣列（用於動態分配）
 */
export const COLOR_ARRAY = Object.keys(COLOR_PALETTE) as ColorName[]

/**
 * 主題感知色彩陣列
 */
export const THEME_AWARE_COLOR_ARRAY = Object.keys(
  THEME_AWARE_PALETTE,
) as ColorName[]

/**
 * 工具函數：從色彩名稱獲取所有相關樣式
 */
export function getColorStyles(colorName: ColorName, useThemeAware = false) {
  return {
    badge: useThemeAware
      ? THEME_AWARE_PALETTE[colorName as keyof typeof THEME_AWARE_PALETTE]
      : COLOR_PALETTE[colorName as keyof typeof COLOR_PALETTE],
    dot: CALENDAR_DOT_PALETTE[colorName as keyof typeof CALENDAR_DOT_PALETTE] || CALENDAR_DOT_PALETTE.gray,
    border: CALENDAR_BORDER_PALETTE[colorName as keyof typeof CALENDAR_BORDER_PALETTE] || CALENDAR_BORDER_PALETTE.gray,
  }
}

/**
 * 預設 Holiday 色彩映射
 * 語義化的固定色彩分配 - 統一使用橙色系建立一致的假期視覺語言
 */
export const HOLIDAY_COLOR_MAP = {
  national: 'orange' as ColorName, // 國定假日 - 橙色（節慶）
  company: 'blue' as ColorName, // 公司假日 - 藍色（企業）
  religious: 'purple' as ColorName, // 宗教假日 - 紫色（神聖）
  cultural: 'orange' as ColorName, // 文化假日 - 橙色（傳統節慶）
  other: 'orange' as ColorName, // 其他假日 - 橙色（一般假期）
} as const

/**
 * Campaign 導向的 Holiday 分層配置
 * 基於對 Campaign 營運影響程度分類，減少視覺雜訊
 */
export const CAMPAIGN_HOLIDAY_TIERS = {
  // 關鍵層級：直接影響 Campaign 營運的假期類型
  critical: ['national', 'company'] as const,
  // 資訊層級：參考性質，對 Campaign 影響較小的假期類型
  informational: ['religious', 'cultural', 'other'] as const,
} as const

/**
 * Campaign Calendar 專用的 Holiday 樣式
 * 簡化為兩層顯示：critical (橙色) / informational (灰色)
 * 支援多筆 Holiday 的層級優先策略：有任何 critical 就顯示橙色
 */
export function getCampaignHolidayBorderStyle(
  holidayType: keyof typeof HOLIDAY_COLOR_MAP,
): string {
  const isCritical = CAMPAIGN_HOLIDAY_TIERS.critical.includes(
    holidayType as any,
  )

  if (isCritical) {
    // 關鍵假期：使用橙色邊框（國定假日、公司假日）
    return 'border-2 border-orange-500'
  } else {
    // 資訊假期：使用淺灰色邊框（宗教、文化、其他）
    return 'border-2 border-gray-300'
  }
}

/**
 * Campaign Calendar 專用的多筆 Holiday 樣式處理
 * 層級優先策略：有任何 critical Holiday 就顯示橙色邊框
 * @param holidayEvents - 該日期的所有 Holiday 事件陣列
 * @returns 邊框樣式類名
 */
export function getCampaignHolidayBorderStyleForEvents(
  holidayEvents: Array<{ holidayType: keyof typeof HOLIDAY_COLOR_MAP }>,
): string {
  if (holidayEvents.length === 0) {
    return ''
  }

  // 檢查是否有任何 critical 層級的 Holiday
  const hasCritical = holidayEvents.some((holiday) =>
    CAMPAIGN_HOLIDAY_TIERS.critical.includes(holiday.holidayType as any),
  )

  if (hasCritical) {
    // 有 critical Holiday：優先使用橙色邊框
    return 'border-2 border-orange-200'
  } else {
    // 僅有 informational Holiday：使用灰色邊框
    return 'border-2 border-gray-300'
  }
}

/**
 * 取得 Holiday 的 Campaign 相關性層級標示
 * @param holidayType - Holiday 類型
 * @returns 層級資訊物件
 */
export function getHolidayCampaignTier(
  holidayType: keyof typeof HOLIDAY_COLOR_MAP,
): {
  tier: 'critical' | 'informational'
  label: string
  emoji: string
  description: string
} {
  const isCritical = CAMPAIGN_HOLIDAY_TIERS.critical.includes(
    holidayType as any,
  )

  if (isCritical) {
    return {
      tier: 'critical',
      label: '關鍵假期',
      emoji: '🚨',
      description: '直接影響 Campaign 營運',
    }
  } else {
    return {
      tier: 'informational',
      label: '資訊假期',
      emoji: 'ℹ️',
      description: '參考性質，影響較小',
    }
  }
}

/**
 * 獲取 Holiday 專用樣式（保持原有功能，用於其他組件）
 */
export function getHolidayStyles(
  holidayType: keyof typeof HOLIDAY_COLOR_MAP,
  useThemeAware = false,
) {
  const colorName = HOLIDAY_COLOR_MAP[holidayType] || HOLIDAY_COLOR_MAP.other
  return getColorStyles(colorName, useThemeAware)
}
