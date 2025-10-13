/**
 * 狀態徽章輔助工具
 * 提供常見業務狀態到 StatusBadge 屬性的映射
 */


// 狀態類型定義
export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'pending'

// 系統警報優先級映射
export const getAlertStatusProps = (priority: 'high' | 'medium' | 'low' | 'info') => {
  const statusMap: Record<string, { status: StatusType; showIndicator: boolean }> = {
    high: { status: 'error', showIndicator: true },
    medium: { status: 'warning', showIndicator: true },
    low: { status: 'neutral', showIndicator: true },
    info: { status: 'info', showIndicator: true },
  }
  
  return statusMap[priority] || { status: 'neutral', showIndicator: true }
}

// 訂單狀態映射
export const getOrderStatusProps = (status: string) => {
  const statusMap: Record<string, { status: StatusType; variant?: 'default' | 'solid' | 'outline' | 'subtle' }> = {
    pending: { status: 'pending', variant: 'default' },
    confirmed: { status: 'info', variant: 'default' },
    processing: { status: 'warning', variant: 'default' },
    shipped: { status: 'info', variant: 'solid' },
    delivered: { status: 'success', variant: 'solid' },
    cancelled: { status: 'error', variant: 'outline' },
    returned: { status: 'neutral', variant: 'default' },
  }
  
  return statusMap[status.toLowerCase()] || { status: 'neutral', variant: 'default' }
}

// 客戶生命週期階段映射
export const getLifecycleStatusProps = (stage: string) => {
  const statusMap: Record<string, { status: StatusType; variant?: 'default' | 'solid' | 'outline' | 'subtle' }> = {
    new: { status: 'info', variant: 'subtle' },
    active: { status: 'success', variant: 'default' },
    at_risk: { status: 'warning', variant: 'default' },
    churned: { status: 'error', variant: 'outline' },
    reactivated: { status: 'success', variant: 'solid' },
  }
  
  return statusMap[stage.toLowerCase()] || { status: 'neutral', variant: 'default' }
}

// 客戶分群映射
export const getCustomerSegmentStatusProps = (segment: string) => {
  const statusMap: Record<string, { status: StatusType; variant?: 'default' | 'solid' | 'outline' | 'subtle' }> = {
    vip: { status: 'success', variant: 'solid' },
    premium: { status: 'success', variant: 'default' },
    standard: { status: 'info', variant: 'default' },
    basic: { status: 'neutral', variant: 'default' },
    inactive: { status: 'error', variant: 'outline' },
  }
  
  return statusMap[segment.toLowerCase()] || { status: 'neutral', variant: 'default' }
}

// 庫存狀態映射
export const getInventoryStatusProps = (status: string, quantity?: number) => {
  const statusMap: Record<string, { status: StatusType; variant?: 'default' | 'solid' | 'outline' | 'subtle' }> = {
    in_stock: { status: 'success', variant: 'default' },
    low_stock: { status: 'warning', variant: 'default' },
    out_of_stock: { status: 'error', variant: 'solid' },
    discontinued: { status: 'neutral', variant: 'outline' },
  }
  
  // 基於數量的動態判斷
  if (typeof quantity === 'number') {
    if (quantity === 0) {
      return { status: 'error' as StatusType, variant: 'solid' as const }
    } else if (quantity < 10) {
      return { status: 'warning' as StatusType, variant: 'default' as const }
    } else {
      return { status: 'success' as StatusType, variant: 'default' as const }
    }
  }
  
  return statusMap[status.toLowerCase()] || { status: 'neutral', variant: 'default' }
}

// 支援工單狀態映射
export const getTicketStatusProps = (status: string, priority?: string) => {
  const statusMap: Record<string, { status: StatusType; variant?: 'default' | 'solid' | 'outline' | 'subtle' }> = {
    open: { status: 'info', variant: 'default' },
    in_progress: { status: 'warning', variant: 'default' },
    waiting: { status: 'pending', variant: 'default' },
    resolved: { status: 'success', variant: 'solid' },
    closed: { status: 'neutral', variant: 'outline' },
    escalated: { status: 'error', variant: 'solid' },
  }
  
  // 高優先級工單特殊處理
  if (priority === 'high' && status !== 'resolved' && status !== 'closed') {
    return { status: 'error' as StatusType, variant: 'default' as const, showIndicator: true }
  }
  
  return statusMap[status.toLowerCase()] || { status: 'neutral', variant: 'default' }
}

// 健康度指標映射 (0-100 分數)
export const getHealthScoreStatusProps = (score: number) => {
  if (score >= 80) {
    return { status: 'success' as StatusType, variant: 'solid' as const }
  } else if (score >= 60) {
    return { status: 'info' as StatusType, variant: 'default' as const }
  } else if (score >= 40) {
    return { status: 'warning' as StatusType, variant: 'default' as const }
  } else {
    return { status: 'error' as StatusType, variant: 'solid' as const }
  }
}

// 成長趨勢映射 (百分比字串，如 "+5.2%" 或 "-2.1%")
export const getGrowthTrendStatusProps = (trendText: string) => {
  const isPositive = trendText.includes('+')
  const isNegative = trendText.includes('-')
  const isZero = trendText.includes('0.0') || trendText === '0%'
  
  if (isPositive) {
    return { status: 'success' as StatusType, variant: 'subtle' as const }
  } else if (isNegative) {
    return { status: 'error' as StatusType, variant: 'subtle' as const }
  } else if (isZero) {
    return { status: 'neutral' as StatusType, variant: 'subtle' as const }
  } else {
    return { status: 'neutral' as StatusType, variant: 'default' as const }
  }
}

// 通用狀態文字本地化
export const getStatusText = (status: StatusType): string => {
  const textMap: Record<StatusType, string> = {
    success: '成功',
    warning: '警告', 
    error: '錯誤',
    info: '資訊',
    neutral: '正常',
    pending: '待處理',
  }
  
  return textMap[status] || '未知'
}

// 輔助函數：快速建立狀態徽章屬性
export const createStatusProps = (
  status: StatusType,
  options: {
    variant?: 'default' | 'solid' | 'outline' | 'subtle'
    size?: 'sm' | 'default' | 'lg'
    showIndicator?: boolean
    clickable?: boolean
  } = {}
) => ({
  status,
  variant: options.variant || 'default',
  size: options.size || 'default',
  showIndicator: options.showIndicator || false,
  clickable: options.clickable || false,
})

// 使用範例：
// const alertProps = getAlertStatusProps('high')  
// <StatusBadge v-bind="alertProps">高優先級警報</StatusBadge>
//
// const orderProps = getOrderStatusProps('shipped')
// <StatusBadge v-bind="orderProps">已出貨</StatusBadge>