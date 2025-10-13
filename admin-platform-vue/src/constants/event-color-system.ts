import type { HolidayType } from '@/types/holiday'
import type { StatusType } from '@/utils/status-helpers'
import {
  COLOR_ARRAY,
  getColorStyles,
  getHolidayStyles,
  type ColorName,
} from './color-palette'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Constants', 'EventColorSystem')

/*
靜態樣式確保區塊 - 確保 Tailwind 掃描到所有 Campaign Calendar 可能的樣式類
以下樣式類用於 Campaign Calendar 跨日事件條，基於 Badge 樣式轉換而來（保持淺色風格）：

暖色系列:
bg-red-200 text-red-800 border-red-300 hover:bg-red-300
bg-orange-200 text-orange-800 border-orange-300 hover:bg-orange-300
bg-amber-200 text-amber-800 border-amber-300 hover:bg-amber-300
bg-yellow-200 text-yellow-800 border-yellow-300 hover:bg-yellow-300

自然色系列:
bg-green-200 text-green-800 border-green-300 hover:bg-green-300
bg-emerald-200 text-emerald-800 border-emerald-300 hover:bg-emerald-300
bg-teal-200 text-teal-800 border-teal-300 hover:bg-teal-300
bg-cyan-200 text-cyan-800 border-cyan-300 hover:bg-cyan-300

冷色系列:
bg-blue-200 text-blue-800 border-blue-300 hover:bg-blue-300
bg-sky-200 text-sky-800 border-sky-300 hover:bg-sky-300
bg-indigo-200 text-indigo-800 border-indigo-300 hover:bg-indigo-300
bg-violet-200 text-violet-800 border-violet-300 hover:bg-violet-300

優雅色系列:
bg-purple-200 text-purple-800 border-purple-300 hover:bg-purple-300
bg-fuchsia-200 text-fuchsia-800 border-fuchsia-300 hover:bg-fuchsia-300
bg-pink-200 text-pink-800 border-pink-300 hover:bg-pink-300
bg-rose-200 text-rose-800 border-rose-300 hover:bg-rose-300

中性色系列:
bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300
bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300
bg-zinc-200 text-zinc-800 border-zinc-300 hover:bg-zinc-300
bg-stone-200 text-stone-800 border-stone-300 hover:bg-stone-300

額外樣式:
font-medium shadow-sm

轉換規則: Badge (100/700/200) → Calendar (200/800/300)
*/

/**
 * 統一的事件色系配置介面
 * 整合 Badge、Calendar、StatusBadge 的色系管理
 * 使用外部 class 管理而非 Badge variant
 */
export interface EventColorConfig {
  // Badge 相關 (改為直接使用 class 字串)
  badgeClass: string

  // Calendar 相關
  dotClass: string // Calendar dot 背景色
  borderClass: string // Calendar 邊框色

  // StatusBadge 相關
  statusType: StatusType

  // 語義資訊
  label: string
  description: string
  priority: number
}

/**
 * Holiday 假期色系配置
 * 使用語義化固定色彩，從 color-palette 獲取樣式
 */
export const holidayColorConfigs: Record<HolidayType, EventColorConfig> = {
  national: {
    badgeClass: getHolidayStyles('national').badge,
    dotClass: getHolidayStyles('national').dot,
    borderClass: getHolidayStyles('national').border,
    statusType: 'error',
    label: '國定假日',
    description: '政府規定的國家級假期',
    priority: 9,
  },
  company: {
    badgeClass: getHolidayStyles('company').badge,
    dotClass: getHolidayStyles('company').dot,
    borderClass: getHolidayStyles('company').border,
    statusType: 'pending',
    label: '公司假期',
    description: '公司特別安排的假期',
    priority: 4,
  },
  religious: {
    badgeClass: getHolidayStyles('religious').badge,
    dotClass: getHolidayStyles('religious').dot,
    borderClass: getHolidayStyles('religious').border,
    statusType: 'warning',
    label: '宗教節日',
    description: '宗教相關的重要節日',
    priority: 6,
  },
  cultural: {
    badgeClass: getHolidayStyles('cultural').badge,
    dotClass: getHolidayStyles('cultural').dot,
    borderClass: getHolidayStyles('cultural').border,
    statusType: 'neutral',
    label: '文化節慶',
    description: '文化傳統節慶活動',
    priority: 3,
  },
  other: {
    badgeClass: getHolidayStyles('other').badge,
    dotClass: getHolidayStyles('other').dot,
    borderClass: getHolidayStyles('other').border,
    statusType: 'neutral',
    label: '其他',
    description: '其他類型的假期安排',
    priority: 1,
  },
}

/**
 * Campaign 活動色系配置 (已廢棄，改用動態色彩系統)
 * 保留作為參考，實際使用 CampaignColorManager 動態分配
 */
/*
export const campaignColorConfigs: Record<string, EventColorConfig> = {
  flash_sale: {
    badgeVariant: 'destructive-soft',
    dotClass: 'bg-destructive/80',
    borderClass: 'border-2 border-destructive',
    statusType: 'error',
    label: '限時搶購',
    description: '限時特價促銷活動',
    priority: 8
  },
  seasonal: {
    badgeVariant: 'default-soft',
    dotClass: 'bg-primary/80',
    borderClass: 'border-2 border-primary',
    statusType: 'info',
    label: '季節活動',
    description: '季節性主題活動',
    priority: 5
  },
  holiday: {
    badgeVariant: 'secondary-soft',
    dotClass: 'bg-secondary/80',
    borderClass: 'border-2 border-secondary',
    statusType: 'warning',
    label: '節慶活動',
    description: '節慶主題促銷活動',
    priority: 6
  },
  membership: {
    badgeVariant: 'outline-soft',
    dotClass: 'bg-muted-foreground/80',
    borderClass: 'border-2 border-muted-foreground',
    statusType: 'neutral',
    label: '會員活動',
    description: '會員專屬優惠活動',
    priority: 3
  },
  default: {
    badgeVariant: 'secondary-soft',
    dotClass: 'bg-secondary/80',
    borderClass: 'border-2 border-secondary',
    statusType: 'info',
    label: '一般活動',
    description: '一般促銷活動',
    priority: 2
  }
}
*/

// ===== Holiday 相關便利函數 =====

/**
 * 獲取 Holiday 完整色系配置
 */
export function getHolidayColorConfig(type: HolidayType): EventColorConfig {
  return holidayColorConfigs[type] || holidayColorConfigs.other
}

/**
 * 獲取 Holiday Badge 屬性 (返回 class 而非 variant)
 */
export function getHolidayBadgeProps(type: HolidayType): {
  class: string
  text: string
} {
  const config = getHolidayColorConfig(type)
  return {
    class: config.badgeClass,
    text: config.label,
  }
}

/**
 * 獲取 Holiday Calendar 樣式
 */
export function getHolidayCalendarStyles(type: HolidayType): {
  dotClass: string
  borderClass: string
} {
  const config = getHolidayColorConfig(type)
  return {
    dotClass: config.dotClass,
    borderClass: config.borderClass,
  }
}

/**
 * 獲取 Holiday StatusBadge 屬性
 */
export function getHolidayStatusProps(type: HolidayType): {
  status: StatusType
} {
  const config = getHolidayColorConfig(type)
  return { status: config.statusType }
}

// ===== Campaign 相關便利函數 (動態色彩系統) =====

/**
 * 獲取 Campaign 完整色系配置 (動態)
 */
export function getCampaignColorConfig(type: string): EventColorConfig {
  return campaignColorManager.getDynamicCampaignConfig(type)
}

/**
 * 獲取 Campaign Badge 屬性 (動態)
 */
export function getCampaignBadgeProps(type: string): {
  class: string
  text: string
} {
  const config = campaignColorManager.getDynamicCampaignConfig(type)
  return {
    class: config.badgeClass,
    text: config.label,
  }
}

/**
 * 獲取 Campaign Calendar 樣式 (動態)
 */
export function getCampaignCalendarStyles(type: string): {
  dotClass: string
  borderClass: string
} {
  const config = campaignColorManager.getDynamicCampaignConfig(type)
  return {
    dotClass: config.dotClass,
    borderClass: config.borderClass,
  }
}

/**
 * 獲取 Campaign Calendar 跨日事件條樣式 (動態，強調背景色區分)
 * 返回可直接用於 Calendar 跨日色塊的 className
 * 使用與 Badge 相同的 getColorStyles() 色彩來源，基於 Badge 樣式直接轉換
 */
export function getCampaignCalendarBarStyles(type: string): {
  className: string
  dotClass: string
} {
  const config = campaignColorManager.getDynamicCampaignConfig(type)

  // 取得色彩名稱，使用與 Badge 相同的來源
  const colorName = campaignColorManager.getColorForCampaignType(type)
  const colorStyles = getColorStyles(colorName)

  if (import.meta.env.DEV) {
    log.debug('Creating calendar bar styles', {
      type,
      colorName,
      badgeClass: config.badgeClass,
      colorStyles
    })
  }

  // 直接基於 Badge 樣式轉換為 Calendar 淺色樣式
  // Badge: bg-red-100 text-red-700 border border-red-200 hover:bg-red-200
  // Calendar: bg-red-200 text-red-800 border-red-300 hover:bg-red-300
  const badgeClass = colorStyles.badge

  let calendarBarClass = badgeClass
    .replace(/bg-(\w+)-100/, 'bg-$1-200')           // 背景色：100 → 200（保持淺色）
    .replace(/text-(\w+)-700/, 'text-$1-800')       // 文字色：700 → 800（稍深）
    .replace(/border\s+border-(\w+)-200/, 'border-$1-300')   // 邊框色：200 → 300
    .replace(/hover:bg-(\w+)-200/, 'hover:bg-$1-300') // hover：200 → 300

  // 特殊處理：黃色和琥珀色保持原有的深色文字以確保對比度
  if (colorName === 'yellow' || colorName === 'amber') {
    // 黃色系列已經有足夠的對比度，不需要特殊處理
  }

  const finalClassName = `${calendarBarClass} font-medium shadow-sm`

  if (import.meta.env.DEV) {
    log.debug('Badge to Calendar conversion', {
      badge: badgeClass,
      calendar: calendarBarClass,
      finalClass: finalClassName,
      sameColorSource: true
    })
  }

  return {
    className: finalClassName,
    dotClass: config.dotClass,
  }
}

/**
 * 獲取 Campaign StatusBadge 屬性 (動態)
 */
export function getCampaignStatusProps(type: string): { status: StatusType } {
  const config = campaignColorManager.getDynamicCampaignConfig(type)
  return { status: config.statusType }
}

/**
 * 獲取動態色彩分配統計 (用於開發調試)
 */
export function getCampaignColorDistribution() {
  return campaignColorManager.getColorDistribution()
}


// ===== Campaign 動態色彩管理系統 =====

/**
 * Campaign 動態色彩管理器
 * 使用豐富的色彩調色板，支援 20+ 種顏色
 */
class CampaignColorManager {
  private static instance: CampaignColorManager
  private typeColorMap = new Map<string, ColorName>()
  private colorUsageCount = new Map<ColorName, number>()

  // 使用完整的色彩陣列（20種顏色）
  private colorPool: ColorName[] = COLOR_ARRAY

  private constructor() {
    // 初始化色彩使用計數
    this.colorPool.forEach((color) => {
      this.colorUsageCount.set(color, 0)
    })
  }

  static getInstance(): CampaignColorManager {
    if (!CampaignColorManager.instance) {
      CampaignColorManager.instance = new CampaignColorManager()
    }
    return CampaignColorManager.instance
  }

  /**
   * 基於字串 hash 的穩定色彩分配算法
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // 轉換為 32-bit 整數
    }
    return Math.abs(hash)
  }

  /**
   * 為 Campaign 類型分配色彩
   * @param campaignType - Campaign 類型字串
   * @returns 色彩名稱
   */
  getColorForCampaignType(campaignType: string): ColorName {
    // 正規化類型名稱（移除空格、轉小寫）
    const normalizedType = campaignType.toLowerCase().trim()

    // 檢查是否已分配
    if (this.typeColorMap.has(normalizedType)) {
      return this.typeColorMap.get(normalizedType)!
    }

    // 使用 hash 算法分配色彩索引
    const hash = this.hashString(normalizedType)
    const colorIndex = hash % this.colorPool.length
    const selectedColor = this.colorPool[colorIndex]

    // 記錄分配
    this.typeColorMap.set(normalizedType, selectedColor)
    this.colorUsageCount.set(
      selectedColor,
      (this.colorUsageCount.get(selectedColor) || 0) + 1,
    )

    return selectedColor
  }

  /**
   * 獲取動態 Campaign 色彩配置
   */
  getDynamicCampaignConfig(campaignType: string): EventColorConfig {
    const colorName = this.getColorForCampaignType(campaignType)
    const colorStyles = getColorStyles(colorName)

    return {
      badgeClass: colorStyles.badge,
      dotClass: colorStyles.dot,
      borderClass: colorStyles.border,
      statusType: this.getStatusTypeFromColor(colorName),
      label: this.formatCampaignLabel(campaignType),
      description: `${campaignType} 類型活動`,
      priority: 5, // 動態分配的活動使用中等優先級
    }
  }

  /**
   * 根據色彩名稱獲取對應的狀態類型
   */
  private getStatusTypeFromColor(colorName: ColorName): StatusType {
    // 根據色彩語義映射到狀態類型
    const colorStatusMap: Record<string, StatusType> = {
      red: 'error',
      orange: 'warning',
      yellow: 'warning',
      green: 'success',
      blue: 'info',
      purple: 'info',
      gray: 'neutral',
      // 其他顏色預設為 info
    }

    return colorStatusMap[colorName] || 'info'
  }

  /**
   * 格式化 Campaign 標籤顯示
   */
  private formatCampaignLabel(campaignType: string): string {
    // 將英文類型轉換為中文標籤，如需要可擴展映射表
    const labelMap: Record<string, string> = {
      flash_sale: '限時搶購',
      seasonal: '季節活動',
      holiday: '節慶活動',
      membership: '會員活動',
      default: '一般活動',
    }

    return labelMap[campaignType.toLowerCase()] || campaignType
  }

  /**
   * 獲取色彩分配統計
   */
  getColorDistribution(): { color: string; usage: number }[] {
    return Array.from(this.colorUsageCount.entries())
      .map(([color, usage]) => ({ color, usage }))
      .filter((item) => item.usage > 0)
      .sort((a, b) => b.usage - a.usage)
  }
}

// 全域實例
const campaignColorManager = CampaignColorManager.getInstance()

// ===== 通用便利函數 =====

/**
 * 根據事件類型獲取顏色配置 (通用版本)
 */
export function getEventColorConfig(
  eventType: 'holiday' | 'campaign',
  subType: string,
): EventColorConfig {
  if (eventType === 'holiday') {
    return getHolidayColorConfig(subType as HolidayType)
  } else {
    return campaignColorManager.getDynamicCampaignConfig(subType)
  }
}

/**
 * 獲取所有 Holiday 類型的選項列表
 */
export function getHolidayTypeOptions() {
  return Object.entries(holidayColorConfigs).map(([value, config]) => ({
    value: value as HolidayType,
    label: config.label,
    description: config.description,
  }))
}

/**
 * 獲取所有 Campaign 類型的選項列表 (動態生成)
 */
export function getCampaignTypeOptions() {
  // 常見的 Campaign 類型，動態生成配置
  const commonTypes = ['flash_sale', 'seasonal', 'holiday', 'membership']

  return commonTypes.map((type) => {
    const config = campaignColorManager.getDynamicCampaignConfig(type)
    return {
      value: type,
      label: config.label,
      description: config.description,
    }
  })
}

// ===== EventCalendar 專用色彩配置 =====

/**
 * EventCalendar 專用色彩配置
 * 統一管理 EventCalendar 中的 dot 和 icon 顏色
 */
export const EVENT_CALENDAR_COLORS = {
  campaign: {
    dot: 'bg-blue-500',
    icon: 'text-blue-500'
  },
  holiday: {
    dot: 'bg-orange-500',
    icon: 'text-orange-500'
  }
} as const

/**
 * 獲取 EventCalendar 顏色配置的便利函數
 * @param eventType - 事件類型 ('campaign' | 'holiday')
 * @returns 對應的顏色配置物件
 */
export function getEventCalendarColors(eventType: 'campaign' | 'holiday'): {
  dot: string;
  icon: string;
} {
  return EVENT_CALENDAR_COLORS[eventType]
}
