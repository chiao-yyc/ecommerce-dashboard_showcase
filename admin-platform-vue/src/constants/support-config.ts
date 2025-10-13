import { TicketStatus, TicketPriority } from '@/types/support'
import type { StatusType } from '@/utils/status-helpers'

/**
 * 工單狀態配置介面 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export interface TicketStatusConfig {
  value: TicketStatus
  label: string
  description: string
  status: StatusType
}

/**
 * 工單優先級配置介面 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export interface TicketPriorityConfig {
  value: TicketPriority
  label: string
  description: string
  status: StatusType
}

/**
 * 工單狀態配置定義 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export const ticketStatusConfigs: TicketStatusConfig[] = [
  {
    value: TicketStatus.OPEN,
    label: 'Open',
    description: '工單已開啟，等待處理',
    status: 'info'
  },
  {
    value: TicketStatus.CLOSED,
    label: 'Closed',
    description: '工單已關閉，問題已解決',
    status: 'success'
  },
  {
    value: TicketStatus.PENDING,
    label: 'Pending',
    description: '工單等待中，需要額外資訊或處理',
    status: 'warning'
  }
]

/**
 * 工單優先級配置定義 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export const ticketPriorityConfigs: TicketPriorityConfig[] = [
  {
    value: TicketPriority.LOW,
    label: '低',
    description: '低優先級工單',
    status: 'neutral'
  },
  {
    value: TicketPriority.NORMAL,
    label: '一般',
    description: '一般優先級工單',
    status: 'info'
  },
  {
    value: TicketPriority.HIGH,
    label: '高',
    description: '高優先級工單，需要優先處理',
    status: 'warning'
  },
  {
    value: TicketPriority.URGENT,
    label: '緊急',
    description: '緊急工單，需要立即處理',
    status: 'error'
  }
]

/**
 * 根據工單狀態獲取配置
 * @param status - 工單狀態
 * @returns 對應的狀態配置
 */
export function getTicketStatusConfig(status: TicketStatus): TicketStatusConfig | undefined {
  return ticketStatusConfigs.find(config => config.value === status)
}

/**
 * 根據工單優先級獲取配置
 * @param priority - 工單優先級
 * @returns 對應的優先級配置
 */
export function getTicketPriorityConfig(priority: TicketPriority): TicketPriorityConfig | undefined {
  return ticketPriorityConfigs.find(config => config.value === priority)
}

/**
 * 獲取工單狀態標籤映射
 * @returns 狀態值到標籤的映射
 */
export function getTicketStatusLabelsMap(): Record<TicketStatus, string> {
  return ticketStatusConfigs.reduce((acc, config) => ({
    ...acc,
    [config.value]: config.label
  }), {} as Record<TicketStatus, string>)
}

/**
 * 獲取工單優先級標籤映射
 * @returns 優先級值到標籤的映射
 */
export function getTicketPriorityLabelsMap(): Record<TicketPriority, string> {
  return ticketPriorityConfigs.reduce((acc, config) => ({
    ...acc,
    [config.value]: config.label
  }), {} as Record<TicketPriority, string>)
}

/**
 * 獲取工單狀態的 StatusBadge 屬性
 * @param status - 工單狀態
 * @returns StatusBadge 所需的屬性物件
 */
export function getTicketStatusBadgeProps(status: TicketStatus) {
  const config = getTicketStatusConfig(status)
  return config ? { status: config.status } : { status: 'default' as StatusType }
}

/**
 * 獲取工單優先級的 StatusBadge 屬性
 * @param priority - 工單優先級
 * @returns StatusBadge 所需的屬性物件
 */
export function getTicketPriorityBadgeProps(priority: TicketPriority) {
  const config = getTicketPriorityConfig(priority)
  return config ? { status: config.status } : { status: 'default' as StatusType }
}