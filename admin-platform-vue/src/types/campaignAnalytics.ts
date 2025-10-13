// 活動分析相關型別定義
// Phase 1: 基於現有分析視圖的零資料表擴展類型

import { AttributionLayer } from './campaign'

/**
 * 活動分析總覽數據
 */
export interface CampaignAnalyticsOverview {
  totalCampaigns: number // 總活動數
  totalAttributedRevenue: number // 總歸因營收
  totalInfluencedOrders: number // 總影響訂單數
  averageOrderValue: number // 平均訂單價值
  attributionAccuracy: number // 歸因準確度 (dominant attributions %)
  collaborationIndex: number // 協作指數 (collaborative orders %)
  averageAttributionWeight: number // 平均歸因權重
  averageConcurrentCampaigns: number // 平均併發活動數
  exclusiveOrdersRate: number // 專屬訂單比例
  trendsInfo: {
    period: number // 資料期間 (天數或活動數)
    lastUpdated: string // 最後更新時間
  }
}

/**
 * 歸因分析數據 (基於 revenue_attribution_analysis 視圖)
 */
export interface AttributionAnalysis {
  campaignId: string
  campaignName: string
  campaignType: string
  attributionLayer: AttributionLayer
  influencedOrders: number // 影響的訂單數
  totalAttributedRevenue: number // 總歸因營收
  avgAttributedRevenue: number // 平均歸因營收
  avgAttributionWeight: number // 平均歸因權重
  avgConcurrentCampaigns: number // 平均併發活動數
  exclusiveOrders: number // 專屬訂單數
  collaborativeOrders: number // 協作訂單數
  dominantAttributions: number // 主導歸因數
  significantAttributions: number // 重要歸因數
  moderateAttributions: number // 中等歸因數
  minorAttributions: number // 次要歸因數
}

/**
 * 協作分析數據 (基於 campaign_collaboration_analysis 視圖)
 */
export interface CollaborationAnalysis {
  concurrentCampaigns: number // 併發活動數
  campaignCombination: string // 活動組合描述
  involvedLayers: string[] // 涉及的歸因層級
  occurrenceCount: number // 出現次數
  combinationRevenue: number // 組合營收
  avgOrderValue: number // 平均訂單價值
  avgDistributedRevenue: number // 平均分配營收
  revenueSharePct: number // 營收佔比
  collaborationType:
    | 'single_campaign'
    | 'dual_collaboration'
    | 'multi_collaboration'
}

/**
 * 重疊日曆數據 (基於 campaign_overlap_calendar 視圖)
 */
export interface OverlapCalendar {
  date: string
  concurrentCampaigns: number // 當日併發活動數
  campaignsList: string // 活動列表
  activeLayers: string[] // 活躍層級
  campaignTypes: string[] // 活動類型
  avgAttributionWeight: number // 平均歸因權重
  isHoliday: boolean // 是否假期
  isWeekend: boolean // 是否週末
  holidayName: string | null // 假期名稱
  complexityLevel: 'simple' | 'moderate' | 'complex' // 複雜度等級
  specialFlags:
    | 'normal'
    | 'holiday_multi_campaign'
    | 'weekend_multi_campaign'
    | 'high_intensity'
}

/**
 * ROI 計算結果 (基於 calculate_campaign_attributions 函數)
 */
export interface CampaignROICalculation {
  campaignId: string
  targetDate: string
  attributions: AttributionDetail[] // 歸因詳細資料
  totalAttributedRevenue: number // 總歸因營收
  attributionStrength: 'dominant' | 'significant' | 'moderate' | 'minor'
  normalizedWeight: number // 正規化權重
  competingCampaigns: number // 競爭活動數
  activeLayers: string[] // 活躍層級
}

/**
 * 歸因詳細資料
 */
export interface AttributionDetail {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  attribution_layer: string
  raw_weight: number
  normalized_weight: number
  attribution_strength: 'dominant' | 'significant' | 'moderate' | 'minor'
  period_start: string
  period_end: string
  attributed_revenue?: number // 歸因營收 (計算得出)
}

/**
 * 歸因規則總結 (Phase 1: 基於現有資料分析)
 */
export interface AttributionRulesSummary {
  totalCampaigns: number // 總活動數
  layerDistribution: Record<string, number> // 層級分佈
  typeDistribution: Record<string, number> // 類型分佈
  weightDistribution: Record<number, number> // 權重分佈
  rulesMappings: AttributionRuleMapping[] // 規則對應關係
  lastAnalyzed: string // 最後分析時間
  systemStatus: 'active' | 'maintenance' | 'error'
}

/**
 * 歸因規則對應 (Phase 1: 從現有資料推導)
 */
export interface AttributionRuleMapping {
  campaign_type: string
  attribution_layer: string
  attribution_weight: number
  priority_score: number
  count: number // 使用此規則的活動數量
}

/**
 * 活動分析篩選器
 */
export interface CampaignAnalyticsFilters {
  dateRange?: {
    start: string
    end: string
  }
  layers?: AttributionLayer[]
  campaignTypes?: string[]
  minRevenue?: number
  maxRevenue?: number
  collaborationType?: (
    | 'single_campaign'
    | 'dual_collaboration'
    | 'multi_collaboration'
  )[]
  complexityLevel?: ('simple' | 'moderate' | 'complex')[]
}

/**
 * 活動分析狀態
 */
export interface CampaignAnalyticsState {
  overview: CampaignAnalyticsOverview | null
  attributionData: AttributionAnalysis[]
  collaborationData: CollaborationAnalysis[]
  overlapData: OverlapCalendar[]
  rulesData: AttributionRulesSummary | null
  filters: CampaignAnalyticsFilters
  isLoading: boolean
  error: string | null
  lastUpdated: string | null
}

/**
 * 活動分析期間
 */
export type CampaignAnalyticsPeriod = '7d' | '30d' | '90d' | '6m' | '1y'

/**
 * 分層效果數據 (計算屬性)
 */
export interface LayerPerformance {
  layer: string
  campaigns: number // 活動數量
  revenue: number // 營收
  orders: number // 訂單數
  avgWeight: number // 平均權重
  avgOrderValue: number // 平均訂單價值
  collaborationRate: number // 協作比例
}

/**
 * 活動效益排行榜項目
 */
export interface CampaignPerformanceRankingItem {
  rank: number
  campaignId: string
  campaignName: string
  campaignType: string
  layer: string
  score: number // 綜合績效分數
  attributedRevenue: number
  influencedOrders: number
  avgOrderValue: number
  attributionWeight: number
  collaborationIndex: number
  roiScore: number
}

/**
 * 活動競爭分析數據點
 */
export interface CompetitionAnalysisPoint {
  date: string
  totalCampaigns: number
  layerCounts: Record<string, number>
  averageWeight: number
  competitionIntensity: 'low' | 'medium' | 'high'
  dominantLayer: string
}

/**
 * 歸因趨勢數據點
 */
export interface AttributionTrendPoint {
  date: string
  totalRevenue: number
  attributedRevenue: number
  attributionRate: number // 歸因覆蓋率
  avgWeight: number
  activeCampaigns: number
}

/**
 * 活動 ROI 趨勢數據
 */
export interface CampaignROITrend {
  campaignId: string
  campaignName: string
  dailyROI: {
    date: string
    revenue: number
    weight: number
    competition: number
    roi: number
  }[]
  totalROI: number
  avgDailyROI: number
  peakROI: number
  trendDirection: 'improving' | 'stable' | 'declining'
}

/**
 * 協作效果統計
 */
export interface CollaborationEffectStats {
  singleCampaignRevenue: number // 單一活動營收
  dualCollaborationRevenue: number // 雙活動協作營收
  multiCollaborationRevenue: number // 多活動協作營收
  collaborationLift: number // 協作提升效果
  optimalCombinations: CollaborationAnalysis[] // 最佳組合
  layerSynergy: Record<string, number> // 層級協同效果
}

/**
 * 活動生命週期分析
 */
export interface CampaignLifecycleAnalysis {
  campaignId: string
  campaignName: string
  phases: {
    launch: AttributionTrendPoint[] // 啟動期
    growth: AttributionTrendPoint[] // 成長期
    maturity: AttributionTrendPoint[] // 成熟期
    decline: AttributionTrendPoint[] // 衰退期
  }
  keyMetrics: {
    launchEffectiveness: number
    peakPerformance: number
    sustainabilityIndex: number
    totalLifetimeValue: number
  }
}

/**
 * 圖表數據格式
 */
export interface CampaignChartDataPoint {
  x: string | number
  y: number
  category?: string
  label?: string
  color?: string
  metadata?: Record<string, any>
}

/**
 * 熱力圖數據點
 */
export interface CampaignHeatmapDataPoint {
  date: string
  hour?: number
  day?: string
  value: number
  intensity: 'low' | 'medium' | 'high'
  campaigns: string[]
  layers: string[]
}

/**
 * API 回應格式 (擴展基礎 ApiResponse)
 */
export interface CampaignAnalyticsApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    total?: number
    page?: number
    limit?: number
    lastUpdated?: string
    cacheStatus?: 'hit' | 'miss' | 'refresh'
  }
}
