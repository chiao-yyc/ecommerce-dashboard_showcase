/**
 * Dashboard 相關類型定義
 * 提供儀表板概覽頁面所需的所有類型
 */

// 基礎數據類型
export interface DashboardOverviewData {
  // 核心 KPI 指標
  totalRevenue: number
  totalOrders: number
  activeCustomers: number
  customerSatisfaction: number

  // 成長率指標
  revenueGrowth: string
  orderGrowth: string
  customerGrowth: string
  satisfactionChange: string

  // 營運效率指標
  targetAchievement: number // 目標達成率 (%)
  conversionRate: number // 轉換率 (%)
  customerRetention: number // 客戶留存率 (%)
  avgResponseTime: string // 平均回應時間

  // 即時監控數據
  systemUptime: string // 系統可用性
  avgLoadTime: string // 平均載入時間
  onlineUsers: number // 線上用戶數
  pendingOrders: number // 待處理訂單數

  // 營收效率指標
  revenueEfficiency: string // 營收效率（取代 ROI）

  // 時間範圍
  periodStart: string
  periodEnd: string
  lastUpdated: string
}

// 用戶行為轉換摘要
export interface UserBehaviorSummary {
  total_events: number
  conversion_rate: number
  total_users: number
  growth_rate?: string
}

// 用戶行為漏斗數據
export interface UserBehaviorFunnelData {
  analysisDate: string
  productViewCount: number
  addToCartCount: number
  checkoutStartCount: number
  paymentStartCount: number
  orderCompleteCount: number
  conversionRate: number // 從 product_view 到 order_complete 的轉換率
  totalRevenue: number // 該日期的總營收
  avgOrderValue: number // 平均訂單價值
}

// 用戶行為漏斗摘要
export interface UserBehaviorFunnelSummary {
  totalProductViews: number
  avgConversionRate: number
  totalUsers: number
  totalRevenue: number
  avgUserValue: number // 平均每用戶價值
  keyInsight: string // 關鍵洞察
}

// 熱銷產品
export interface TopProduct {
  id: string
  name: string
  sales: number
  growth: string
  rank: number
}

// 系統警報
export interface SystemAlert {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
}

// 儀表板警示 (擴展版本，用於 AI 分析)
export interface DashboardAlert {
  id: string
  alert_type: string
  title: string
  description?: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  metric_name?: string
  current_value?: number
  threshold_value?: number
  business_context?: Record<string, any>
  detected_at?: string
  created_at: string
  resolved_at?: string
  expires_at?: string
  is_active?: boolean
  is_resolved?: boolean
  resolved_by?: string
  resolution_notes?: string
  ai_suggestion?: string
  ai_confidence?: number
  ai_generated_at?: string
  ai_provider?: string
  insight_category?: string
  confidence_score?: number
  trend_direction?: string
  trend_period?: string
  // Additional properties for AI analysis component compatibility
  status?: string // Active/resolved status
  metric_value?: number // Alias for current_value
}

// 轉換漏斗數據
export interface ConversionFunnelData {
  stage: string
  count: number
  percentage: number
  label: string
}

// 業務健康度指標
export interface BusinessHealthMetrics {
  revenue: number // 營收成長 (0-10)
  satisfaction: number // 客戶滿意 (0-10)
  fulfillment: number // 訂單履行 (0-10)
  support: number // 客服效率 (0-10)
  products: number // 產品管理 (0-10)
  marketing: number // 行銷效果 (0-10)
  system: number // 系統穩定度 (0-10)
}

// 營收趨勢數據
export interface RevenueTrendData {
  date: string
  revenue: number
  orders: number
  customers: number
}

// 客戶價值分佈 (RFM × LTV 散點圖數據)
export interface CustomerValueDistribution {
  customerId: string
  customerName?: string
  recency: number // R: 最近購買天數 (越小越好)
  frequency: number // F: 購買頻率 (次數)
  monetary: number // M: 購買金額
  ltv: number // LTV: 客戶終身價值
  rfmScore: number // RFM 綜合分數 (1-5)
  segment:
    | 'champions'
    | 'loyal_customers'
    | 'potential_loyalists'
    | 'new_customers'
    | 'at_risk'
    | 'cannot_lose_them'
    | 'hibernating'
    | 'lost'
  registrationDate: string
  lastOrderDate: string
  totalOrders: number
  totalSpent: number
}

// 即時監控數據
export interface RealTimeMetrics {
  systemUptime: number // 系統可用性 (%)
  avgLoadTime: number // 平均載入時間 (seconds)
  onlineUsers: number // 線上用戶數
  pendingOrders: number // 待處理訂單數
}

// Dashboard API 請求參數
export interface DashboardFilters {
  startDate?: string
  endDate?: string
  period?: '7d' | '30d' | '90d' | '1y'
}

// Dashboard API 響應格式
export interface DashboardApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

// 組合型的完整儀表板數據
export interface CompleteDashboardData {
  overview: DashboardOverviewData
  topProducts: TopProduct[]
  systemAlerts: SystemAlert[]
  conversionFunnel: ConversionFunnelData[]
  businessHealth: BusinessHealthMetrics
  realtimeMetrics: RealTimeMetrics
  userBehaviorSummary: UserBehaviorSummary
}

// Vue Query keys for dashboard
export const DASHBOARD_QUERY_KEYS = {
  overview: (filters?: DashboardFilters) => ['dashboard', 'overview', filters],
  topProducts: (limit?: number) => ['dashboard', 'top-products', limit],
  systemAlerts: () => ['dashboard', 'system-alerts'],
  conversionFunnel: () => ['dashboard', 'conversion-funnel'],
  businessHealth: () => ['dashboard', 'business-health'],
  realtimeMetrics: () => ['dashboard', 'realtime-metrics'],
  userBehaviorSummary: () => ['dashboard', 'user-behavior-summary'],
} as const

// 儀表板卡片配置
export interface DashboardCardConfig {
  id: string
  title: string
  type: 'kpi' | 'chart' | 'list' | 'alert' | 'metric'
  size: 'small' | 'medium' | 'large' | 'xl'
  gridSpan: number
  refreshInterval?: number // 自動刷新間隔 (milliseconds)
  permission?: string // 權限控制
}

// KPI 卡片數據
export interface KpiCardData {
  value: string | number
  label: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  trend?: number[] // 小型趨勢圖數據
  target?: number // 目標值
}

// 圖表卡片數據
export interface ChartCardData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  data: any[]
  options?: any
  loading?: boolean
  error?: string
}

// 儀表板佈局配置
export interface DashboardLayout {
  id: string
  name: string
  description?: string
  cards: DashboardCardConfig[]
  createdAt: string
  updatedAt: string
  isDefault?: boolean
  userId?: string // 個人化配置
}

// 儀表板狀態管理
export interface DashboardState {
  currentLayout: DashboardLayout | null
  availableLayouts: DashboardLayout[]
  filters: DashboardFilters
  refreshing: boolean
  lastRefresh: string | null
  autoRefresh: boolean
  refreshInterval: number
}

// 儀表板動作
export interface DashboardActions {
  setLayout: (layout: DashboardLayout) => void
  updateFilters: (filters: Partial<DashboardFilters>) => void
  refresh: () => Promise<void>
  toggleAutoRefresh: () => void
  setRefreshInterval: (interval: number) => void
}

// All types already exported as interfaces above
