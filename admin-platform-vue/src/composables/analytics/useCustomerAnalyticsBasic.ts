import { ref, computed, readonly } from 'vue'
import { formatDate, convertToISOString } from '@/utils'
import { useBusinessFormatting } from '@/utils/businessFormatters'
import type {
  CustomerAnalyticsBasic,
  CustomerAnalyticsBasicParams,
  CustomerBehaviorPattern,
  CustomerBehaviorAnalysisSummary,
  CustomerChurnRisk,
  ChurnRiskAnalysisSummary,
  CustomerValueGrowth,
  ValueGrowthAnalysisSummary,
  CustomerSegmentComparison,
  SegmentComparisonSummary,
  CustomerActionRecommendation,
  ActionRecommendationsSummary,
  CustomerAnalyticsBasicState,
} from '@/types/customerAnalytics'
import { DEFAULT_CUSTOMER_ANALYTICS_PARAMS } from '@/types/customerAnalytics'
import { defaultServiceFactory } from '@/api/services'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'CustomerAnalyticsBasic')

/**
 * useCustomerAnalyticsBasic - 基礎客戶分析組合式函數
 * 階段1：完全基於現有資料表，無需新增任何欄位
 * 設計原則：與 useOrderAnalyticsBasic 和 useProductAnalytics 保持一致的架構和使用方式
 *
 * 架構更新：使用 ServiceFactory 依賴注入模式，提升測試友善性和環境隔離
 */
export function useCustomerAnalyticsBasic() {
  const apiService = defaultServiceFactory.getCustomerAnalyticsService()
  const { formatDashboardValue } = useBusinessFormatting()

  // 響應式狀態
  const state = ref<CustomerAnalyticsBasicState>({
    isLoading: false,
    error: null,
    lastUpdated: null,
    analytics: null,
    hasData: false,
  })

  // 主要的分析數據
  const analytics = ref<CustomerAnalyticsBasic | null>(null)

  // 各維度的分析結果
  const behaviorPatterns = ref<CustomerBehaviorPattern[]>([])
  const behaviorSummary = ref<CustomerBehaviorAnalysisSummary | null>(null)
  const churnRisks = ref<CustomerChurnRisk[]>([])
  const churnRiskSummary = ref<ChurnRiskAnalysisSummary | null>(null)
  const valueGrowth = ref<CustomerValueGrowth[]>([])
  const valueGrowthSummary = ref<ValueGrowthAnalysisSummary | null>(null)
  const segmentComparison = ref<CustomerSegmentComparison[]>([])
  const segmentSummary = ref<SegmentComparisonSummary | null>(null)
  const actionRecommendations = ref<CustomerActionRecommendation[]>([])
  const recommendationsSummary = ref<ActionRecommendationsSummary | null>(null)

  /**
   * 執行完整的基礎客戶分析
   * 主要入口函數，類似 useOrderAnalyticsBasic 的 performOrderAnalyticsBasic
   */
  async function performCustomerAnalyticsBasic(
    params?: CustomerAnalyticsBasicParams,
  ) {
    try {
      state.value.isLoading = true
      state.value.error = null

      // 使用預設參數如果沒有提供
      const analysisParams = params || DEFAULT_CUSTOMER_ANALYTICS_PARAMS

      log.debug('開始執行基礎客戶分析', { params: analysisParams })

      // 調用 API 服務
      const response =
        await apiService.getCustomerAnalyticsBasic(analysisParams)

      if (!response.success || !response.data) {
        throw new Error((response.error as string) || '獲取客戶分析數據失敗')
      }

      // 更新所有響應式數據（使用預設值防止 undefined）
      analytics.value = response.data
      behaviorPatterns.value = response.data.behaviorPatterns || []
      behaviorSummary.value = response.data.behaviorSummary || null
      churnRisks.value = response.data.churnRisks || []
      churnRiskSummary.value = response.data.churnRiskSummary || null
      valueGrowth.value = response.data.valueGrowth || []
      valueGrowthSummary.value = response.data.valueGrowthSummary || null
      segmentComparison.value = response.data.segmentComparison || []
      segmentSummary.value = response.data.segmentSummary || null
      actionRecommendations.value = response.data.actionRecommendations || []
      recommendationsSummary.value =
        response.data.recommendationsSummary || null

      // 更新狀態
      state.value.analytics = response.data
      state.value.hasData = true
      state.value.lastUpdated = convertToISOString(new Date())

      log.info('基礎客戶分析完成', {
        behaviorPatternsCount: behaviorPatterns.value.length,
        churnRisksCount: churnRisks.value.length,
        valueGrowthCount: valueGrowth.value.length,
        segmentComparisonCount: segmentComparison.value.length,
        actionRecommendationsCount: actionRecommendations.value.length,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '客戶分析執行失敗'
      state.value.error = errorMessage
      log.error('基礎客戶分析失敗', { error: err })

      // 清空數據
      analytics.value = null
      behaviorPatterns.value = []
      behaviorSummary.value = null
      churnRisks.value = []
      churnRiskSummary.value = null
      valueGrowth.value = []
      valueGrowthSummary.value = null
      segmentComparison.value = []
      segmentSummary.value = null
      actionRecommendations.value = []
      recommendationsSummary.value = null
    } finally {
      state.value.isLoading = false
    }
  }

  /**
   * 重新載入分析數據
   * 用於刷新按鈕或定期更新
   */
  async function refreshAnalytics(params?: CustomerAnalyticsBasicParams) {
    await performCustomerAnalyticsBasic(params)
  }

  /**
   * 清空所有分析數據
   */
  function clearAnalytics() {
    analytics.value = null
    behaviorPatterns.value = []
    behaviorSummary.value = null
    churnRisks.value = []
    churnRiskSummary.value = null
    valueGrowth.value = []
    valueGrowthSummary.value = null
    segmentComparison.value = []
    segmentSummary.value = null
    actionRecommendations.value = []
    recommendationsSummary.value = null

    state.value.analytics = null
    state.value.hasData = false
    state.value.lastUpdated = null
    state.value.error = null
  }

  /**
   * 導出分析數據
   */
  async function exportAnalyticsData(params?: CustomerAnalyticsBasicParams) {
    try {
      const analysisParams = params || DEFAULT_CUSTOMER_ANALYTICS_PARAMS
      const response =
        await apiService.exportCustomerAnalyticsBasic(analysisParams)

      if (!response.success || !response.data) {
        throw new Error((response.error as string) || '導出失敗')
      }

      // 生成下載檔案
      const exportData = response.data
      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Customer_Analytics_Basic_Report_${convertToISOString(new Date()).split('T')[0]}.json`
      link.click()

      log.info('基礎客戶分析數據已導出')
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '導出失敗'
      log.error('導出客戶分析數據失敗', { error: err })
      return { success: false, error: errorMessage }
    }
  }

  // ============================================================================
  // 計算屬性 (Computed Properties)
  // 提供便於在模板中使用的衍生數據
  // ============================================================================

  /**
   * 載入狀態 - 對應 ProductAnalytics 和 OrderAnalytics 的 isLoading
   */
  const isLoading = computed(() => state.value.isLoading)

  /**
   * 錯誤訊息
   */
  const error = computed(() => state.value.error)

  /**
   * 是否有分析數據
   */
  const hasAnalyticsData = computed(() => state.value.hasData)

  /**
   * 最後更新時間
   */
  const lastUpdated = computed(() => state.value.lastUpdated)

  /**
   * 高風險客戶統計
   */
  const highRiskCustomersStats = computed(() => {
    if (!churnRiskSummary.value) return null

    return {
      criticalRisk: churnRiskSummary.value.criticalRiskCustomers,
      highRisk: churnRiskSummary.value.highRiskCustomers,
      totalAtRisk: churnRiskSummary.value.totalCustomersAtRisk,
      potentialLoss: churnRiskSummary.value.totalPotentialLoss,
      avgRetentionProbability: churnRiskSummary.value.avgRetentionProbability,
    }
  })

  /**
   * 頂級成長潛力客戶 (前10名)
   */
  const topGrowthPotentialCustomers = computed(() => {
    return valueGrowth.value.slice(0, 10).map((customer) => ({
      customerNumber: customer.customerNumber || customer.customerId,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
      currentLTV: customer.currentLTV,
      potentialLTV: customer.estimatedFutureLTV,
      growthRate: customer.ltvGrowthRate,
      growthPotential: customer.growthPotential,
      segment: customer.currentSegment,
    }))
  })

  /**
   * 最需要立即行動的客戶 (前10名)
   * 🚀 優化邏輯：確保至少有客戶顯示，避免空白區塊
   */
  const urgentActionCustomers = computed(() => {
    // 優先取得高優先級建議 (critical + high)
    const highPriorityRecs = actionRecommendations.value.filter(
      (rec) => rec.priority === 'critical' || rec.priority === 'high',
    )

    // 如果高優先級建議不足3個，補充中等優先級建議
    let finalRecommendations = [...highPriorityRecs]

    if (finalRecommendations.length < 3) {
      const mediumPriorityRecs = actionRecommendations.value
        .filter((rec) => rec.priority === 'medium')
        .slice(0, 3 - finalRecommendations.length)

      finalRecommendations = [...finalRecommendations, ...mediumPriorityRecs]
    }

    return finalRecommendations.slice(0, 10).map((rec) => ({
      customerNumber: rec.customerNumber || rec.customerId,
      customerName: rec.customerName,
      customerEmail: rec.customerEmail,
      priority: rec.priority,
      category: rec.category,
      action: rec.action,
      expectedROI: rec.estimatedROI,
      timing: rec.suggestedTiming,
    }))
  })

  /**
   * 分群效能概覽
   */
  const segmentPerformanceOverview = computed(() => {
    if (!segmentComparison.value.length) return null

    const totalCustomers = segmentComparison.value.reduce(
      (sum, segment) => sum + segment.customerCount,
      0,
    )
    const avgLTV =
      segmentComparison.value.reduce(
        (sum, segment) => sum + segment.avgLTV * segment.customerCount,
        0,
      ) / totalCustomers
    const avgRetentionRate =
      segmentComparison.value.reduce(
        (sum, segment) => sum + segment.retentionRate * segment.customerCount,
        0,
      ) / totalCustomers

    return {
      totalSegments: segmentComparison.value.length,
      totalCustomers,
      avgLTV: Math.round(avgLTV),
      avgRetentionRate: Math.round(avgRetentionRate * 100) / 100,
      bestSegment: segmentComparison.value[0]?.segmentName || 'Unknown',
      segmentDistribution: segmentComparison.value.slice(0, 5), // 前5個分群
    }
  })

  /**
   * 行動建議統計
   */
  const actionRecommendationsStats = computed(() => {
    if (!recommendationsSummary.value) return null

    return {
      totalRecommendations: recommendationsSummary.value.totalRecommendations,
      criticalActions: recommendationsSummary.value.criticalActions,
      highPriorityActions: recommendationsSummary.value.highPriorityActions,
      estimatedTotalROI: recommendationsSummary.value.estimatedTotalROI,
      topCategories: recommendationsSummary.value.topCategories,
      implementationPriority:
        recommendationsSummary.value.implementationPriority,
    }
  })

  /**
   * 行為模式洞察
   */
  const behaviorInsights = computed(() => {
    if (!behaviorSummary.value) return null

    return {
      totalCustomersAnalyzed: behaviorSummary.value.totalCustomersAnalyzed || 0,
      avgPurchaseFrequency: behaviorSummary.value.avgPurchaseFrequency || 0,
      avgOrderInterval: behaviorSummary.value.avgOrderInterval || 0,
      mostActiveHours: behaviorSummary.value.mostActiveHours || [],
      seasonalCustomers: behaviorSummary.value.seasonalCustomers || 0,
      trendingUp: behaviorSummary.value.trendingUp || 0,
      trendingDown: behaviorSummary.value.trendingDown || 0,
      highConsistencyCustomers:
        behaviorSummary.value.highConsistencyCustomers || 0,
    }
  })

  /**
   * 總體分析摘要
   */
  const analyticsSummary = computed(() => {
    if (!analytics.value || !analytics.value.overallMetrics) return null

    const metrics = analytics.value.overallMetrics

    return {
      dateRange: metrics.analysisDateRange || { start: '', end: '' },
      totalCustomers: metrics.totalCustomersAnalyzed || 0,
      activeCustomers: metrics.totalActiveCustomers || 0,
      atRiskCustomers: metrics.totalAtRiskCustomers || 0,
      potentialValue: metrics.totalPotentialValue || 0,
      keyFindings: metrics.keyFindings || [],
      actionItems: metrics.actionItems || [],
      lastUpdated: metrics.lastUpdated || null,
    }
  })

  // ============================================================================
  // 輔助方法
  // ============================================================================

  /**
   * 格式化金額顯示
   */
  function formatCurrency(amount: number): string {
    return formatDashboardValue(amount, 'currency')
  }

  /**
   * 格式化百分比顯示
   */
  function formatPercentage(value: number): string {
    return formatDashboardValue(value, 'rate')
  }

  /**
   * 獲取風險等級顏色
   */
  function getRiskLevelColor(riskLevel: string): string {
    const colors = {
      low: '#10B981', // 綠色
      medium: '#F59E0B', // 橘色
      high: '#EF4444', // 紅色
      critical: '#7C2D12', // 深紅色
    }
    return colors[riskLevel as keyof typeof colors] || '#6B7280'
  }

  /**
   * 獲取分群顏色
   */
  function getSegmentColor(segment: string): string {
    const colors = {
      Champions: '#10B981',
      'Loyal Customers': '#059669',
      'Potential Loyalists': '#0891B2',
      'New Customers': '#0284C7',
      Promising: '#3B82F6',
      'Need Attention': '#F59E0B',
      'About to Sleep': '#D97706',
      'At Risk': '#EF4444',
      'Cannot Lose Them': '#DC2626',
      Hibernating: '#9CA3AF',
      Lost: '#6B7280',
    }
    return colors[segment as keyof typeof colors] || '#6B7280'
  }

  /**
   * 篩選客戶數據
   */
  function filterCustomersByRiskLevel(riskLevel: string) {
    return churnRisks.value.filter(
      (customer) => customer.riskLevel === riskLevel,
    )
  }

  /**
   * 篩選客戶數據 - 依據分群
   */
  function filterCustomersBySegment(segment: string) {
    return valueGrowth.value.filter(
      (customer) => customer.currentSegment === segment,
    )
  }

  /**
   * 篩選行動建議 - 依據類別
   */
  function filterRecommendationsByCategory(category: string) {
    return actionRecommendations.value.filter(
      (rec) => rec.category === category,
    )
  }

  /**
   * 檢查數據是否新鮮 (在最近1小時內更新)
   */
  const isDataFresh = computed(() => {
    if (!lastUpdated.value) return false
    const updateTime = new Date(lastUpdated.value)
    const now = new Date()
    const diffMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60)
    return diffMinutes < 60 // 1小時內為新鮮數據
  })

  // ============================================================================
  // 返回公共 API
  // 遵循 useProductAnalytics 和 useOrderAnalyticsBasic 的接口設計
  // ============================================================================

  return {
    // 狀態
    isLoading,
    error,
    hasAnalyticsData,
    lastUpdated,
    isDataFresh,

    // 主要數據
    analytics,
    behaviorPatterns,
    behaviorSummary,
    churnRisks,
    churnRiskSummary,
    valueGrowth,
    valueGrowthSummary,
    segmentComparison,
    segmentSummary,
    actionRecommendations,
    recommendationsSummary,

    // 計算屬性
    highRiskCustomersStats,
    topGrowthPotentialCustomers,
    urgentActionCustomers,
    segmentPerformanceOverview,
    actionRecommendationsStats,
    behaviorInsights,
    analyticsSummary,

    // 方法
    performCustomerAnalyticsBasic,
    refreshAnalytics,
    clearAnalytics,
    exportAnalyticsData,

    // 輔助方法
    formatCurrency,
    formatPercentage,
    formatDate,
    getRiskLevelColor,
    getSegmentColor,
    filterCustomersByRiskLevel,
    filterCustomersBySegment,
    filterRecommendationsByCategory,

    // 原始狀態 (用於調試)
    state: readonly(state),
  }
}
