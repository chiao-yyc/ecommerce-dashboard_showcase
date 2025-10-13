import { ref, computed, readonly } from 'vue'
import { convertToISOString } from '@/utils'
import type {
  CampaignAnalyticsOverview,
  AttributionAnalysis,
  CollaborationAnalysis,
  OverlapCalendar,
  AttributionRulesSummary,
  CampaignAnalyticsFilters,
  CampaignAnalyticsState,
  CampaignAnalyticsPeriod,
  LayerPerformance,
  CampaignPerformanceRankingItem,
  CompetitionAnalysisPoint,
  AttributionTrendPoint,
  CollaborationEffectStats,
} from '@/types/campaignAnalytics'
import { AttributionLayer } from '@/types/campaign'
import { defaultServiceFactory } from '@/api/services'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'CampaignAnalytics')

/**
 * useCampaignAnalytics - 活動分析組合式函數
 * Phase 1：完全基於現有分析視圖，零資料表擴展
 * 設計原則：與 useSupportAnalytics 保持一致的架構和使用方式
 *
 * 架構更新：使用 ServiceFactory 依賴注入模式，提升測試友善性和環境隔離
 */
export function useCampaignAnalytics() {
  const apiService = defaultServiceFactory.getCampaignAnalyticsService()
  // 🔐 新增：Edge Function 評分服務 (商業邏輯已移至伺服器端保護)
  const scoringService = defaultServiceFactory.getCampaignScoringService()

  // 響應式狀態
  const state = ref<CampaignAnalyticsState>({
    overview: null,
    attributionData: [],
    collaborationData: [],
    overlapData: [],
    rulesData: null,
    filters: {},
    isLoading: false,
    error: null,
    lastUpdated: null,
  })

  // 主要的分析數據
  const overview = ref<CampaignAnalyticsOverview | null>(null)
  const attributionData = ref<AttributionAnalysis[]>([])
  const collaborationData = ref<CollaborationAnalysis[]>([])
  const overlapData = ref<OverlapCalendar[]>([])
  const rulesData = ref<AttributionRulesSummary | null>(null)

  // 篩選器狀態
  const filters = ref<CampaignAnalyticsFilters>({})

  // 🔐 新增：Edge Function 評分結果 (商業邏輯保護)
  const scoringResults = ref<{
    layerPerformance: LayerPerformance[]
    campaignRanking: CampaignPerformanceRankingItem[]
    summary: any
  } | null>(null)

  /**
   * 執行完整的活動分析
   * 主要入口函數，類似 useSupportAnalytics 的 performSupportAnalytics
   */
  async function performCampaignAnalytics(
    period: CampaignAnalyticsPeriod = '30d',
    customFilters?: CampaignAnalyticsFilters,
  ) {
    try {
      state.value.isLoading = true
      state.value.error = null

      // 計算日期範圍
      const dateRange = calculateDateRange(period)
      const mergedFilters = { ...filters.value, ...customFilters, dateRange }

      log.debug('開始執行活動分析', {
        period,
        dateRange,
        filters: mergedFilters,
      })

      // 並行載入所有分析數據
      const [
        overviewResponse,
        attributionResponse,
        collaborationResponse,
        overlapResponse,
        rulesResponse,
      ] = await Promise.all([
        apiService.getCampaignAnalyticsOverview(dateRange),
        apiService.getAttributionAnalysis(mergedFilters),
        apiService.getCollaborationAnalysis(),
        apiService.getOverlapCalendar(dateRange),
        apiService.getAttributionRulesSummary(),
      ])

      // 檢查所有回應是否成功
      const responses = [
        overviewResponse,
        attributionResponse,
        collaborationResponse,
        overlapResponse,
        rulesResponse,
      ]

      const failedResponses = responses.filter((r) => !r.success)
      if (failedResponses.length > 0) {
        const errorMessages = failedResponses
          .map((r) => r.error)
          .filter(Boolean)
          .join(', ')
        throw new Error(`部分數據載入失敗: ${errorMessages}`)
      }

      // 更新所有響應式數據
      overview.value = overviewResponse.data!
      attributionData.value = attributionResponse.data!
      collaborationData.value = collaborationResponse.data!
      overlapData.value = overlapResponse.data!
      rulesData.value = rulesResponse.data!

      // 🔐 新增：呼叫 Edge Function 計算評分 (商業邏輯保護)
      if (attributionResponse.data && attributionResponse.data.length > 0) {
        log.debug('執行活動評分計算 (Edge Function)')
        const scoringResponse = await scoringService.calculateCampaignScoring(
          attributionResponse.data!
        )

        if (scoringResponse.success) {
          scoringResults.value = {
            layerPerformance: scoringResponse.data.layerPerformance,
            campaignRanking: scoringResponse.data.campaignRanking,
            summary: scoringResponse.data.summary,
          }
          log.info('活動評分計算完成', { summary: scoringResponse.data.summary })
        } else {
          // Edge Function 失敗，scoringResults 保持 null，UI 將透明處理失敗狀態
          log.warn('活動評分計算 Edge Function 執行失敗', { error: scoringResponse.error })
        }
      }

      // 更新狀態
      state.value.overview = overviewResponse.data!
      state.value.attributionData = attributionResponse.data!
      state.value.collaborationData = collaborationResponse.data!
      state.value.overlapData = overlapResponse.data!
      state.value.rulesData = rulesResponse.data!
      state.value.filters = mergedFilters
      state.value.lastUpdated = convertToISOString(new Date())

      log.info('活動分析完成', {
        overviewCampaigns: overview.value.totalCampaigns,
        attributionDataCount: attributionData.value.length,
        collaborationDataCount: collaborationData.value.length,
        overlapDays: overlapData.value.length,
        rulesAnalyzed: rulesData.value.totalCampaigns,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '活動分析執行失敗'
      state.value.error = errorMessage
      log.error('活動分析失敗', { error: err })

      // 清空數據
      clearAnalytics()
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * 重新載入分析數據
   */
  async function refreshAnalytics(period?: CampaignAnalyticsPeriod) {
    await performCampaignAnalytics(period || '30d', filters.value)
  }

  /**
   * 載入特定活動的 ROI 計算
   */
  async function loadCampaignROI(campaignId: string, targetDate?: string) {
    try {
      const response = await apiService.calculateCampaignROI(
        campaignId,
        targetDate,
      )

      if (!response.success || !response.data) {
        throw new Error((response.error as string) || '載入活動 ROI 失敗')
      }

      return response.data
    } catch (err) {
      log.error('載入活動 ROI 失敗', { error: err })
      throw err
    }
  }

  /**
   * 載入活動效果趨勢數據
   */
  async function loadPerformanceTrends(
    campaignId?: string,
    period: CampaignAnalyticsPeriod = '30d',
  ) {
    try {
      const dateRange = calculateDateRange(period)
      const response = await apiService.getCampaignPerformanceTrends(
        campaignId,
        dateRange,
      )

      if (!response.success || !response.data) {
        throw new Error((response.error as string) || '載入效果趨勢失敗')
      }

      return response.data
    } catch (err) {
      log.error('載入效果趨勢失敗', { error: err })
      throw err
    }
  }

  /**
   * 更新篩選器
   */
  function updateFilters(newFilters: Partial<CampaignAnalyticsFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    state.value.filters = filters.value
  }

  /**
   * 清空所有分析數據
   */
  function clearAnalytics() {
    overview.value = null
    attributionData.value = []
    collaborationData.value = []
    overlapData.value = []
    rulesData.value = null
    // 🔐 清空 Edge Function 評分結果
    scoringResults.value = null

    state.value.overview = null
    state.value.attributionData = []
    state.value.collaborationData = []
    state.value.overlapData = []
    state.value.rulesData = null
    state.value.lastUpdated = null
    state.value.error = null
  }

  /**
   * 計算日期範圍
   */
  function calculateDateRange(period: CampaignAnalyticsPeriod): {
    start: string
    end: string
  } {
    const end = new Date()
    const start = new Date()

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
      case '6m':
        start.setMonth(start.getMonth() - 6)
        break
      case '1y':
        start.setFullYear(start.getFullYear() - 1)
        break
      default:
        start.setDate(start.getDate() - 30)
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  // ============================================================================
  // 計算屬性 (Computed Properties)
  // 提供便於在模板中使用的衍生數據
  // ============================================================================

  /**
   * 載入狀態
   */
  const isLoading = computed(() => state.value.isLoading)

  /**
   * 錯誤訊息
   */
  const error = computed(() => state.value.error)

  /**
   * 是否有分析數據
   */
  const hasAnalyticsData = computed(() => {
    return overview.value !== null && attributionData.value.length > 0
  })

  /**
   * 最後更新時間
   */
  const lastUpdated = computed(() => state.value.lastUpdated)

  /**
   * 分層效果分析
   * 🔐 僅使用 Edge Function 結果 (商業邏輯已完全保護)
   */
  const layerPerformance = computed<LayerPerformance[]>(() => {
    // 🔐 僅使用 Edge Function 的結果 (商業邏輯保護)
    if (scoringResults.value && scoringResults.value.layerPerformance) {
      return scoringResults.value.layerPerformance
    }

    // 🚫 商業邏輯必須在 Edge Function 中執行，前端僅透明處理失敗狀態
    log.warn('Edge Function 未提供分層效果數據')
    return []

  })

  /**
   * 活動效益排行榜
   * 🔐 僅使用 Edge Function 結果 (商業邏輯已完全保護)
   */
  const campaignPerformanceRanking = computed<CampaignPerformanceRankingItem[]>(
    () => {
      // 🔐 僅使用 Edge Function 的結果 (商業邏輯保護)
      if (scoringResults.value && scoringResults.value.campaignRanking) {
        return scoringResults.value.campaignRanking
      }

      // 🚫 商業邏輯必須在 Edge Function 中執行，前端僅透明處理失敗狀態
      log.warn('Edge Function 未提供活動排行榜數據')
      return []

    },
  )

  /**
   * 歸因趨勢數據
   */
  const attributionTrends = computed<AttributionTrendPoint[]>(() => {
    if (!overlapData.value.length) return []

    return overlapData.value.map((day) => {
      // 簡化的日期匹配邏輯，實際應用中需要更精確的匹配
      const dayAttributions = attributionData.value

      const totalRevenue = dayAttributions.reduce(
        (sum, attr) => sum + attr.totalAttributedRevenue,
        0,
      )
      const avgWeight = day.avgAttributionWeight

      return {
        date: day.date,
        totalRevenue: totalRevenue,
        attributedRevenue: totalRevenue, // 在 Phase 1 中簡化
        attributionRate: 100, // 在 Phase 1 中假設完全歸因
        avgWeight: avgWeight,
        activeCampaigns: day.concurrentCampaigns,
      }
    })
  })

  /**
   * 競爭分析數據
   */
  const competitionAnalysis = computed<CompetitionAnalysisPoint[]>(() => {
    return overlapData.value.map((day) => {
      const layerCounts = day.activeLayers.reduce(
        (acc, layer) => {
          acc[layer] = (acc[layer] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      let competitionIntensity: 'low' | 'medium' | 'high' = 'low'
      if (day.concurrentCampaigns >= 5) competitionIntensity = 'high'
      else if (day.concurrentCampaigns >= 3) competitionIntensity = 'medium'

      const dominantLayer =
        Object.entries(layerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        AttributionLayer.GENERAL

      return {
        date: day.date,
        totalCampaigns: day.concurrentCampaigns,
        layerCounts,
        averageWeight: day.avgAttributionWeight,
        competitionIntensity,
        dominantLayer,
      }
    })
  })

  /**
   * 協作效果統計
   */
  const collaborationEffectStats = computed<CollaborationEffectStats>(() => {
    const singleRevenue = collaborationData.value
      .filter((c) => c.collaborationType === 'single_campaign')
      .reduce((sum, c) => sum + c.combinationRevenue, 0)

    const dualRevenue = collaborationData.value
      .filter((c) => c.collaborationType === 'dual_collaboration')
      .reduce((sum, c) => sum + c.combinationRevenue, 0)

    const multiRevenue = collaborationData.value
      .filter((c) => c.collaborationType === 'multi_collaboration')
      .reduce((sum, c) => sum + c.combinationRevenue, 0)

    // const totalRevenue = singleRevenue + dualRevenue + multiRevenue // 未使用
    const collaborationLift =
      singleRevenue > 0
        ? ((dualRevenue + multiRevenue) / singleRevenue - 1) * 100
        : 0

    // 計算層級協同效果
    const layerSynergy = layerPerformance.value.reduce(
      (acc, layer) => {
        acc[layer.layer] = layer.collaborationRate
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      singleCampaignRevenue: singleRevenue,
      dualCollaborationRevenue: dualRevenue,
      multiCollaborationRevenue: multiRevenue,
      collaborationLift,
      optimalCombinations: collaborationData.value
        .sort((a, b) => b.combinationRevenue - a.combinationRevenue)
        .slice(0, 5),
      layerSynergy,
    }
  })

  /**
   * 系統效能總覽
   */
  const systemPerformanceOverview = computed(() => {
    if (!overview.value || !rulesData.value) return null

    return {
      attributionHealth: getAttributionHealthStatus(
        overview.value.attributionAccuracy,
      ),
      collaborationBalance: getCollaborationBalanceStatus(
        overview.value.collaborationIndex,
      ),
      competitionLevel: getCompetitionLevelStatus(
        overview.value.averageConcurrentCampaigns,
      ),
      systemEfficiency: calculateSystemEfficiency(),
      rulesCompliance: calculateRulesCompliance(),
      optimizationOpportunities: identifyOptimizationOpportunities(),
    }
  })

  /**
   * 檢查數據是否新鮮 (在最近30分鐘內更新)
   */
  const isDataFresh = computed(() => {
    if (!lastUpdated.value) return false
    const updateTime = new Date(lastUpdated.value)
    const now = new Date()
    const diffMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60)
    return diffMinutes < 30 // 30分鐘內為新鮮數據
  })

  // ============================================================================
  // 輔助方法
  // ============================================================================

  /*
  // 🚫 商業邏輯函數已移除 - 這些算法已遷移至 Edge Function 保護
  
  /**
   * 計算活動綜合績效分數 - 已移至 Edge Function
   *
  function calculateCampaignScore(campaign: AttributionAnalysis): number {
    // 績效分數計算邏輯：營收權重(40%) + 歸因權重(25%) + 協作效果(20%) + 歸因品質(15%)
    const revenueScore = Math.min(
      100,
      (campaign.totalAttributedRevenue / 100000) * 100,
    ) // 基於10萬營收滿分
    const weightScore = campaign.avgAttributionWeight * 100
    const collaborationScore =
      campaign.influencedOrders > 0
        ? (campaign.collaborativeOrders / campaign.influencedOrders) * 100
        : 0
    const qualityScore =
      campaign.influencedOrders > 0
        ? (campaign.dominantAttributions / campaign.influencedOrders) * 100
        : 0

    return Math.round(
      revenueScore * 0.4 +
        weightScore * 0.25 +
        collaborationScore * 0.2 +
        qualityScore * 0.15,
    )
  }

  /**
   * 計算 ROI 分數 - 已移至 Edge Function
   *
  function calculateROIScore(campaign: AttributionAnalysis): number {
    const orderValue = campaign.avgAttributedRevenue
    const efficiency = campaign.avgAttributionWeight
    const volume = campaign.influencedOrders

    // 簡化的 ROI 計算：訂單價值 × 效率 × 規模因子
    const scaleFactor = Math.min(1, volume / 100) // 基於100單的規模因子
    return Math.round(orderValue * efficiency * scaleFactor)
  }
  */

  /**
   * 判斷歸因健康狀態
   */
  function getAttributionHealthStatus(
    accuracy: number,
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (accuracy >= 80) return 'excellent'
    if (accuracy >= 60) return 'good'
    if (accuracy >= 40) return 'fair'
    return 'poor'
  }

  /**
   * 判斷協作平衡狀態
   */
  function getCollaborationBalanceStatus(
    index: number,
  ): 'balanced' | 'over_collaborative' | 'under_collaborative' {
    if (index >= 30 && index <= 70) return 'balanced'
    if (index > 70) return 'over_collaborative'
    return 'under_collaborative'
  }

  /**
   * 判斷競爭程度
   */
  function getCompetitionLevelStatus(
    avgConcurrent: number,
  ): 'low' | 'medium' | 'high' | 'extreme' {
    if (avgConcurrent <= 2) return 'low'
    if (avgConcurrent <= 4) return 'medium'
    if (avgConcurrent <= 6) return 'high'
    return 'extreme'
  }

  /**
   * 計算系統效率
   */
  function calculateSystemEfficiency(): number {
    if (!overview.value) return 0

    const attributionScore = overview.value.attributionAccuracy
    const collaborationScore =
      100 - Math.abs(overview.value.collaborationIndex - 50) // 50% 為最佳協作比例
    const utilizationScore = Math.min(
      100,
      overview.value.averageAttributionWeight * 100,
    )

    return Math.round(
      (attributionScore + collaborationScore + utilizationScore) / 3,
    )
  }

  /**
   * 計算規則合規性
   */
  function calculateRulesCompliance(): number {
    if (!rulesData.value) return 0

    // 基於規則對應關係的一致性計算合規性
    const totalMappings = rulesData.value.rulesMappings.length
    const consistentMappings = rulesData.value.rulesMappings.filter(
      (mapping) => mapping.count > 1, // 多於一個活動使用相同規則表示一致性
    ).length

    return totalMappings > 0 ? (consistentMappings / totalMappings) * 100 : 0
  }

  /**
   * 識別優化機會
   */
  function identifyOptimizationOpportunities(): string[] {
    const opportunities: string[] = []

    if (!overview.value) return opportunities

    if (overview.value.attributionAccuracy < 60) {
      opportunities.push('歸因準確度偏低，建議檢視權重設定')
    }

    if (overview.value.collaborationIndex < 20) {
      opportunities.push('協作效果不足，考慮增加多活動協作')
    }

    if (overview.value.averageConcurrentCampaigns > 6) {
      opportunities.push('活動密度過高，建議優化排程')
    }

    if (overview.value.exclusiveOrdersRate > 80) {
      opportunities.push('活動重疊不足，錯失協作機會')
    }

    return opportunities
  }

  /**
   * 格式化數值顯示
   */
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  /**
   * 格式化百分比顯示
   */
  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
  }

  /**
   * 格式化日期顯示
   */
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW')
  }

  // ============================================================================
  // 返回公共 API
  // 遵循 useSupportAnalytics 的接口設計
  // ============================================================================

  return {
    // 狀態
    isLoading,
    error,
    hasAnalyticsData,
    lastUpdated,
    isDataFresh,

    // 主要數據
    overview,
    attributionData,
    collaborationData,
    overlapData,
    rulesData,
    filters,

    // 計算屬性
    layerPerformance,
    campaignPerformanceRanking,
    attributionTrends,
    competitionAnalysis,
    collaborationEffectStats,
    systemPerformanceOverview,

    // 方法
    performCampaignAnalytics,
    refreshAnalytics,
    loadCampaignROI,
    loadPerformanceTrends,
    updateFilters,
    clearAnalytics,

    // 輔助方法
    formatCurrency,
    formatPercentage,
    formatDate,
    calculateDateRange,

    // 原始狀態 (用於調試)
    state: readonly(state),
  }
}
