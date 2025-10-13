// Customer Analytics Types - 階段1：基於現有資料表的客戶分析
// 設計原則：完全基於現有資料結構，無需新增任何欄位

import { formatDateOnly } from '@/utils'

// 基礎分析參數
export interface CustomerAnalyticsBasicParams {
  startDate: string // YYYY-MM-DD 格式
  endDate: string // YYYY-MM-DD 格式
  customerSegments?: string[] // 客戶分群篩選 (可選)
  lifecycleStages?: string[] // 生命週期階段篩選 (可選)
  includeChurnedCustomers?: boolean // 是否包含流失客戶
  // 🚀 效能優化：分頁參數
  limit?: number // 限制返回記錄數，預設 1000
  offset?: number // 偏移量，用於分頁
  orderBy?: string // 排序欄位，預設 'created_at'
  orderDirection?: 'asc' | 'desc' // 排序方向，預設 'desc'
}

// 客戶行為模式分析
export interface CustomerBehaviorPattern {
  customerId: string
  customerNumber: string // 客戶編號 (CUST-XXXX-XXXXXX)
  customerName?: string // 客戶姓名
  customerEmail?: string // 客戶 email
  analysisDate: string
  purchaseFrequency: number // 購買頻率 (次/月)
  avgDaysBetweenOrders: number // 平均訂單間隔天數
  preferredOrderHours: number[] // 偏好下單時段 (24小時制)
  seasonalityIndex: number // 季節性指數 (0-1)
  channelPreference: string // 偏好渠道
  avgOrderValue: number // 平均訂單價值
  orderValueTrend: 'increasing' | 'stable' | 'decreasing' // 訂單價值趨勢
  consistencyScore: number // 購買一致性評分 (0-100)
}

// 客戶行為分析摘要
export interface CustomerBehaviorAnalysisSummary {
  totalCustomersAnalyzed: number
  avgPurchaseFrequency: number
  avgOrderInterval: number
  mostActiveHours: number[]
  seasonalCustomers: number
  trendingUp: number // 價值成長客戶數
  trendingDown: number // 價值下降客戶數
  highConsistencyCustomers: number // 高一致性客戶數
}

// 流失風險分析
export interface CustomerChurnRisk {
  customerId: string
  customerNumber: string // 客戶編號 (CUST-XXXX-XXXXXX)
  customerName: string
  customerEmail?: string // 客戶 email
  lastOrderDate: string
  daysSinceLastOrder: number
  riskScore: number // 流失風險分數 (0-100)
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  contributingFactors: Array<{
    factor: string
    impact: number // 影響權重 (0-1)
    description: string
  }>
  recommendedActions: string[]
  estimatedRetentionProbability: number // 挽回成功率預估
  currentLTV: number
  potentialLossValue: number // 潛在流失價值
}

// 流失風險分析摘要
export interface ChurnRiskAnalysisSummary {
  totalCustomersAtRisk: number
  criticalRiskCustomers: number
  highRiskCustomers: number
  mediumRiskCustomers: number
  totalPotentialLoss: number
  avgRetentionProbability: number
  topRiskFactors: Array<{
    factor: string
    affectedCustomers: number
    avgImpact: number
  }>
}

// 客戶價值成長分析
export interface CustomerValueGrowth {
  customerId: string
  customerNumber: string // 客戶編號 (CUST-XXXX-XXXXXX)
  customerName: string
  customerEmail?: string // 客戶 email
  currentSegment: string
  previousSegment: string
  segmentChangeDate: string
  currentLTV: number
  ltvGrowthRate: number // LTV成長率 (%)
  ltvTrend: 'accelerating' | 'growing' | 'stable' | 'declining'
  potentialSegment: string // 潛在可達成的分群
  growthPotential: number // 成長潛力評分 (0-100)
  recommendedNurturingActions: string[]
  estimatedFutureLTV: number // 預估未來12個月LTV
}

// 價值成長分析摘要
export interface ValueGrowthAnalysisSummary {
  totalCustomersTracked: number
  growingValueCustomers: number
  decliningValueCustomers: number
  avgGrowthRate: number
  highPotentialCustomers: number
  totalPotentialValue: number
  segmentMigrations: Array<{
    fromSegment: string
    toSegment: string
    count: number
    avgGrowthRate: number
  }>
}

// 客戶分群對比分析
export interface CustomerSegmentComparison {
  segmentName: string
  customerCount: number
  avgLTV: number
  avgOrderValue: number
  avgPurchaseFrequency: number
  retentionRate: number
  churnRate: number
  growthRate: number
  profitabilityIndex: number // 獲利能力指數
  marketingEfficiency: number // 營銷效率指數
}

// 分群對比摘要
export interface SegmentComparisonSummary {
  totalSegments: number
  bestPerformingSegment: string
  highestGrowthSegment: string
  highestRiskSegment: string
  segmentDistribution: Array<{
    segment: string
    percentage: number
    count: number
  }>
  recommendations: string[]
}

// 個性化行動建議
export interface CustomerActionRecommendation {
  customerId: string
  customerNumber: string // 客戶編號 (CUST-XXXX-XXXXXX)
  customerName: string
  customerEmail?: string // 客戶 email
  priority: 'critical' | 'high' | 'medium' | 'low'
  category:
    | 'retention'
    | 'upsell'
    | 'cross_sell'
    | 'winback'
    | 'nurture'
    | 'vip_care'
  action: string
  reasoning: string
  expectedImpact: string
  suggestedTiming: string
  estimatedROI: number
  confidence: number // 建議信心度 (0-100)
  implementationDifficulty: 'easy' | 'medium' | 'hard'
  estimatedCost: number
  measurableMetrics: string[]
}

// 行動建議摘要
export interface ActionRecommendationsSummary {
  totalRecommendations: number
  criticalActions: number
  highPriorityActions: number
  estimatedTotalROI: number
  topCategories: Array<{
    category: string
    count: number
    avgROI: number
  }>
  implementationPriority: CustomerActionRecommendation[] // 前10個優先建議
}

// 主要分析結果 - 基礎版
export interface CustomerAnalyticsBasic {
  // 行為分析
  behaviorPatterns: CustomerBehaviorPattern[]
  behaviorSummary: CustomerBehaviorAnalysisSummary

  // 流失風險分析
  churnRisks: CustomerChurnRisk[]
  churnRiskSummary: ChurnRiskAnalysisSummary

  // 價值成長分析
  valueGrowth: CustomerValueGrowth[]
  valueGrowthSummary: ValueGrowthAnalysisSummary

  // 分群對比分析
  segmentComparison: CustomerSegmentComparison[]
  segmentSummary: SegmentComparisonSummary

  // 行動建議
  actionRecommendations: CustomerActionRecommendation[]
  recommendationsSummary: ActionRecommendationsSummary

  // 綜合指標
  overallMetrics: {
    analysisDateRange: string
    totalCustomersAnalyzed: number
    totalActiveCustomers: number
    totalAtRiskCustomers: number
    totalPotentialValue: number
    keyFindings: string[]
    actionItems: string[]
    lastUpdated: string
  }
}

// 導出數據結構
export interface CustomerAnalyticsBasicExportData {
  parameters: CustomerAnalyticsBasicParams
  analytics: CustomerAnalyticsBasic
  exportDate: string
  reportTitle: string
  summary: string
}

// 圖表顯示選項
export interface CustomerAnalyticsChartOptions {
  showTrends: boolean // 顯示趨勢線
  groupBy: 'day' | 'week' | 'month'
  chartType: 'bar' | 'line' | 'area' | 'scatter' | 'heatmap'
  compareSegments: boolean // 分群對比模式
  includeProjections: boolean // 包含預測數據
}

// 服務狀態
export interface CustomerAnalyticsBasicState {
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
  analytics: CustomerAnalyticsBasic | null
  hasData: boolean
}

// 預設的分析參數
export const DEFAULT_CUSTOMER_ANALYTICS_PARAMS: CustomerAnalyticsBasicParams = {
  startDate: formatDateOnly(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)), // 90天前，支援RFM長期行為分析
  endDate: formatDateOnly(new Date()), // 今天
  customerSegments: undefined, // 預設為所有分群
  lifecycleStages: undefined, // 預設為所有階段
  includeChurnedCustomers: false, // 預設不包含已流失客戶
}

// 風險因子的中文映射
export const CHURN_RISK_FACTORS: Record<string, string> = {
  long_absence: '長期未購買',
  declining_frequency: '購買頻率下降',
  declining_value: '訂單價值下降',
  segment_downgrade: '客戶分群降級',
  seasonal_absence: '季節性缺席',
  support_issues: '客服問題增加',
  payment_failures: '付款失敗次數',
}

// 行動建議類別的中文映射
export const ACTION_CATEGORIES: Record<string, string> = {
  retention: '客戶挽留',
  upsell: '向上銷售',
  cross_sell: '交叉銷售',
  winback: '流失挽回',
  nurture: '客戶培育',
  vip_care: 'VIP關懷',
}

// 客戶分群的中文映射已遷移至 @/constants/rfm-segments.ts
// 請使用 getSegmentLabelsMap() 函數取得分群標籤映射

// 生命週期階段的中文映射
export const LIFECYCLE_STAGES: Record<string, string> = {
  New: '新客戶',
  Active: '活躍客戶',
  'At Risk': '風險客戶',
  Inactive: '非活躍客戶',
  Churned: '已流失客戶',
}

// 分析時段選項
export const ANALYSIS_PERIODS = [
  { label: '最近30天', days: 30 },
  { label: '最近60天', days: 60 },
  { label: '最近90天', days: 90 },
  { label: '最近6個月', days: 180 },
  { label: '最近12個月', days: 365 },
] as const

// 風險等級配色方案
export const RISK_LEVEL_COLORS = {
  low: '#10B981', // 綠色
  medium: '#F59E0B', // 橘色
  high: '#EF4444', // 紅色
  critical: '#7C2D12', // 深紅色
} as const

// 分群顏色方案已遷移至 @/constants/rfm-segments.ts
// 請使用 rfmSegments 陣列中的 class 屬性取得完整的 UI 配置
// 包含顏色、樣式變體等完整設定
