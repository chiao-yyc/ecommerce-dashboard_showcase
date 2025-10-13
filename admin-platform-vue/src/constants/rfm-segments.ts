import type { StatusType } from '@/utils/status-helpers'
import { RfmSegment } from '@/types/customer'

/**
 * RFM 客戶分群配置介面 - 語義化狀態版本
 */
export interface RfmSegmentConfig {
  value: RfmSegment
  label: string
  description: string
  status: StatusType
}

/**
 * RFM 客戶分群配置列表（完整11種分群）
 */
export const rfmSegments: RfmSegmentConfig[] = [
  {
    value: RfmSegment.CHAMPIONS,
    label: '冠軍客戶',
    description: '最近購買、購買頻率高、消費金額高',
    status: 'success'
  },
  {
    value: RfmSegment.LOYAL_CUSTOMERS,
    label: '忠誠客戶',
    description: '購買頻率高、消費金額高',
    status: 'success'
  },
  {
    value: RfmSegment.POTENTIAL_LOYALISTS,
    label: '潛在忠誠客戶',
    description: '最近購買、消費金額高',
    status: 'info'
  },
  {
    value: RfmSegment.NEW_CUSTOMERS,
    label: '新客戶',
    description: '最近購買的新客戶',
    status: 'info'
  },
  {
    value: RfmSegment.PROMISING,
    label: '有潛力客戶',
    description: '最近購買、購買頻率低',
    status: 'info'
  },
  {
    value: RfmSegment.NEED_ATTENTION,
    label: '需要關注',
    description: '購買頻率高、最近未購買',
    status: 'warning'
  },
  {
    value: RfmSegment.ABOUT_TO_SLEEP,
    label: '即將休眠',
    description: '消費金額高、最近未購買',
    status: 'warning'
  },
  {
    value: RfmSegment.AT_RISK,
    label: '流失風險',
    description: '消費金額高、購買頻率高、最近未購買',
    status: 'error'
  },
  {
    value: RfmSegment.CANNOT_LOSE_THEM,
    label: '不能失去',
    description: '消費金額高、購買頻率高、很久未購買',
    status: 'error'
  },
  {
    value: RfmSegment.HIBERNATING,
    label: '休眠客戶',
    description: '消費金額低、購買頻率低、很久未購買',
    status: 'neutral'
  },
  {
    value: RfmSegment.LOST,
    label: '流失客戶',
    description: '最低的頻次、金額和活躍度',
    status: 'error'
  }
]

/**
 * 根據 RFM 分群值取得對應的配置
 */
export function getRfmSegmentConfig(segment?: string): RfmSegmentConfig | null {
  if (!segment) return null
  return rfmSegments.find(s => s.value === segment) || null
}

/**
 * 根據分群取得 StatusBadge 屬性（簡化版）
 */
export function getSegmentStatusProps(segment: string): { status: StatusType } {
  const config = getRfmSegmentConfig(segment)
  return {
    status: config?.status || 'neutral'
  }
}

/**
 * 根據 RFM 分群值取得對應的 variant（向後相容）
 */
export function getRfmSegmentVariant(segment: string): StatusType {
  const config = getRfmSegmentConfig(segment)
  return config?.status || 'neutral'
}

/**
 * 取得所有分群的 value 清單（用於篩選器等場景）
 */
export function getAllSegmentValues(): string[] {
  return rfmSegments.map(segment => segment.value)
}

/**
 * 取得分群值對應的中文標籤映射（用於顯示場景）
 */
export function getSegmentLabelsMap(): Record<string, string> {
  return rfmSegments.reduce((acc, segment) => {
    acc[segment.value] = segment.label
    return acc
  }, {} as Record<string, string>)
}