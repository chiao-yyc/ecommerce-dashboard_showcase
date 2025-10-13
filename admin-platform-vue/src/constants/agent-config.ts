import { AgentStatus } from '@/types/agent'
import type { StatusType } from '@/utils/status-helpers'
import {
  UserCheck,
  Coffee,
  AlertCircle,
  UserX,
  type LucideIcon,
} from 'lucide-vue-next'

/**
 * 客服狀態配置介面 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export interface AgentStatusConfig {
  value: AgentStatus
  label: string
  description: string
  status: StatusType
  icon: LucideIcon
}

/**
 * 客服狀態配置定義 - 純 StatusBadge 模式
 * 對齊 RFM segments 設計模式
 */
export const agentStatusConfigs: AgentStatusConfig[] = [
  {
    value: AgentStatus.ONLINE,
    label: '線上',
    description: '客服目前上線，可以接受分配',
    status: 'success',
    icon: UserCheck
  },
  {
    value: AgentStatus.IDLE,
    label: '閒置',
    description: '客服暫時離開或休息中',
    status: 'warning',
    icon: Coffee
  },
  {
    value: AgentStatus.BUSY,
    label: '忙碌',
    description: '客服負載已滿，暫時無法接受新分配',
    status: 'error',
    icon: AlertCircle
  },
  {
    value: AgentStatus.OFFLINE,
    label: '離線',
    description: '客服已下線，無法接受分配',
    status: 'neutral',
    icon: UserX
  }
]

/**
 * 根據客服狀態獲取配置
 * @param status - 客服狀態
 * @returns 對應的狀態配置
 */
export function getAgentStatusConfig(status: AgentStatus): AgentStatusConfig | undefined {
  return agentStatusConfigs.find(config => config.value === status)
}

/**
 * 獲取客服狀態標籤映射
 * @returns 狀態值到標籤的映射
 */
export function getAgentStatusLabelsMap(): Record<AgentStatus, string> {
  return agentStatusConfigs.reduce((acc, config) => ({
    ...acc,
    [config.value]: config.label
  }), {} as Record<AgentStatus, string>)
}

/**
 * 獲取客服狀態的 StatusBadge 屬性
 * @param status - 客服狀態
 * @returns StatusBadge 所需的屬性物件
 */
export function getAgentStatusBadgeProps(status: AgentStatus) {
  const config = getAgentStatusConfig(status)
  return config ? { status: config.status } : { status: 'neutral' as StatusType }
}

/**
 * 獲取客服狀態的圖示
 * @param status - 客服狀態
 * @returns 對應的 Lucide 圖示組件
 */
export function getAgentStatusIcon(status: AgentStatus): LucideIcon {
  const config = getAgentStatusConfig(status)
  return config?.icon || UserX
}

/**
 * 客服狀態篩選選項（包含 'all' 選項）
 * 用於篩選器等場景
 */
export const agentStatusFilterOptions = [
  ...agentStatusConfigs.map(config => ({
    label: config.label,
    value: config.value,
    icon: config.icon
  })),
  {
    label: '全部',
    value: 'all' as const,
    icon: UserCheck
  }
]