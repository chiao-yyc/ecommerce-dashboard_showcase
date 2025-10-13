import type { PaginationOptions } from '@/types/common'

/**
 * RFM 客戶分群枚舉（基於資料庫 calculate_rfm_segment 函數）
 * 核心業務邏輯類型，對應完整11種 RFM 分群
 */
export enum RfmSegment {
  CHAMPIONS = 'Champions',
  LOYAL_CUSTOMERS = 'Loyal Customers',
  POTENTIAL_LOYALISTS = 'Potential Loyalists',
  NEW_CUSTOMERS = 'New Customers',
  PROMISING = 'Promising',
  NEED_ATTENTION = 'Need Attention',
  ABOUT_TO_SLEEP = 'About to Sleep',
  AT_RISK = 'At Risk',
  CANNOT_LOSE_THEM = 'Cannot Lose Them',
  HIBERNATING = 'Hibernating',
  LOST = 'Lost'
}

/**
 * RFM 客戶分群類型
 */
export type RfmSegmentType = RfmSegment

// 資料庫層面的客戶類型 (snake_case)
export interface DbCustomer {
  id: string
  customer_number?: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
  deleted_at?: string
  auth_user_id?: string
}

// 客戶詳細資訊類型 (包含關聯資料和 RFM 業務分析欄位)
export interface DbCustomerDetail extends DbCustomer {
  customer_number?: string
  providers?: string[]
  status?: string
  // RFM 業務分析欄位 (來自 customer_rfm_lifecycle_metrics 視圖)
  rfm_segment?: string // 客戶分群
  last_purchase_date?: string // 最後消費日期
  total_spent?: number // 累計消費金額
  order_count?: number // 訂單數量
  // AOV 欄位 (來自 customer_order_basic_behavior 視圖)
  avg_order_value?: number // 平均訂單價值
}

// 前端/UI 客戶模型 (camelCase，無 roles)
export interface Customer {
  id: string
  customerNumber?: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
  authUserId?: string
  providers?: string[]
  status?: string // 'active' | 'inactive' | 'banned'
  
  // 業務分析欄位 (從 RFM 分析或訂單統計得出)
  rfmSegment?: RfmSegmentType
  lastOrderDate?: string // 最後訂單日期
  totalSpent?: number // 累計消費金額
  orderCount?: number // 總訂單數
  averageOrderValue?: number // 平均訂單價值
}

// 客戶分頁選項
export interface CustomersPaginationOptions extends PaginationOptions {
  // 客戶不需要角色篩選，但可以添加其他篩選條件
  status?: string[]
  searchTerm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 客戶概覽資料類型定義
 */
export interface CustomerOverview {
  /** 總客戶數 */
  totalCustomers: number
  /** 有電子郵件的客戶數 */
  customersWithEmail: number
  /** 有姓名的客戶數 */
  customersWithName: number
  /** 有訂單的客戶數 */
  customersWithOrders: number
  /** 一次性客戶數 */
  oneTimeCustomers: number
  /** 回頭客戶數 */
  returningCustomers: number
}

/**
 * 客戶RFM概覽資料類型定義
 */
export interface CustomerRfmOverview {
  activeUsersCount: number
  averageMonetary: number
  atRiskCustomersCount: number
}
