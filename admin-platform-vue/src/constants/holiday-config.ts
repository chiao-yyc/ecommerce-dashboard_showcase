import { HolidayType } from '@/types/holiday'
import type { StatusType } from '@/utils/status-helpers'
import { getHolidayColorConfig, getHolidayStatusProps } from './event-color-system'
import {
  CalendarDays,
  Building2,
  Church,
  Users,
  Calendar,
  type LucideIcon,
} from 'lucide-vue-next'

/**
 * 假期類型配置介面 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export interface HolidayTypeConfig {
  value: HolidayType
  label: string
  description: string
  priority?: number      // 已移至資料庫觸發器，此欄位僅供參考
  status: StatusType
  icon: LucideIcon
}

/**
 * 假期類型配置定義 - 使用統一色系配置
 * 從 event-color-system.ts 獲取顏色和狀態配置
 * 優先級由資料庫觸發器根據假期類型自動設定
 */
export const holidayTypeConfigs: HolidayTypeConfig[] = [
  {
    value: HolidayType.NATIONAL,
    label: getHolidayColorConfig(HolidayType.NATIONAL).label,
    description: getHolidayColorConfig(HolidayType.NATIONAL).description,
    status: getHolidayStatusProps(HolidayType.NATIONAL).status,
    icon: CalendarDays
  },
  {
    value: HolidayType.RELIGIOUS,
    label: getHolidayColorConfig(HolidayType.RELIGIOUS).label,
    description: getHolidayColorConfig(HolidayType.RELIGIOUS).description,
    status: getHolidayStatusProps(HolidayType.RELIGIOUS).status,
    icon: Church
  },
  {
    value: HolidayType.COMPANY,
    label: getHolidayColorConfig(HolidayType.COMPANY).label,
    description: getHolidayColorConfig(HolidayType.COMPANY).description,
    status: getHolidayStatusProps(HolidayType.COMPANY).status,
    icon: Building2
  },
  {
    value: HolidayType.CULTURAL,
    label: getHolidayColorConfig(HolidayType.CULTURAL).label,
    description: getHolidayColorConfig(HolidayType.CULTURAL).description,
    status: getHolidayStatusProps(HolidayType.CULTURAL).status,
    icon: Users
  },
  {
    value: HolidayType.OTHER,
    label: getHolidayColorConfig(HolidayType.OTHER).label,
    description: getHolidayColorConfig(HolidayType.OTHER).description,
    status: getHolidayStatusProps(HolidayType.OTHER).status,
    icon: Calendar
  }
]

// 移除複雜的 priorityConfigs，改由假期類型自動決定優先級

/**
 * 根據假期類型獲取配置
 * @param holidayType - 假期類型
 * @returns 對應的假期類型配置
 */
export function getHolidayTypeConfig(holidayType: HolidayType): HolidayTypeConfig | undefined {
  return holidayTypeConfigs.find(config => config.value === holidayType)
}

// 移除 getPriorityConfig，不再需要數字優先級配置

/**
 * 獲取假期類型標籤映射
 * @returns 假期類型值到標籤的映射
 */
export function getHolidayTypeLabelsMap(): Record<HolidayType, string> {
  return holidayTypeConfigs.reduce((acc, config) => ({
    ...acc,
    [config.value]: config.label
  }), {} as Record<HolidayType, string>)
}

/**
 * 獲取假期類型的 StatusBadge 屬性
 * @param holidayType - 假期類型
 * @returns StatusBadge 所需的屬性物件
 */
export function getHolidayTypeBadgeProps(holidayType: HolidayType) {
  const config = getHolidayTypeConfig(holidayType)
  return config ? { status: config.status } : { status: 'neutral' as StatusType }
}

// 移除 getPriorityBadgeProps，改用假期類型決定 Badge 樣式

/**
 * 假期類型選項（向後兼容）
 * 用於表單下拉選單等場景
 */
export const holidayTypeOptions = holidayTypeConfigs.map(config => ({
  value: config.value,
  label: config.label
}))

// 向後兼容的別名導出
export const HOLIDAY_TYPE_OPTIONS = holidayTypeOptions
// 移除 PRIORITY_OPTIONS，不再需要優先級選項