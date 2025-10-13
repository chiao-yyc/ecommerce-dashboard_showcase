// 匯出所有型別定義

// 基礎架構類型
export * from './common'
export * from './datatable'
export * from './permission'
export * from './entityTypes'
export * from './theme'
export * from './user'

// 業務領域類型
export * from './order'
export * from './customer'
export * from './campaign'
export * from './notification'

// 分析系統類型
export * from './dashboard'
export * from './analytics'
export * from './customerAnalytics'
export * from './campaignAnalytics'

// Toast 類型定義
export type ToastType = {
  success: (msg: string, options?: object) => void
  error: (msg: string, options?: object) => void
  warning: (msg: string, options?: object) => void
  info: (msg: string, options?: object) => void
}

// Holiday 類型定義（保留作為通用類型）
export interface Holiday {
  date: string
  name: string
}

// Campaign 類型定義（額外導出，保持向後相容）
export interface Campaign {
  id: string
  campaignName: string
  startDate: string
  endDate: string
  campaignType: string
  description?: string
  createdAt: string
  attributionLayer?: string
  priorityScore?: number
  attributionWeight?: number
}
