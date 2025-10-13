<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'CampaignAnalytics')

import { ref, onMounted, computed, watch } from 'vue'
import { today, getLocalTimeZone } from '@internationalized/date'
import { toDate } from 'reka-ui/date'
import type { DateRange } from 'reka-ui'
import type { CampaignAnalyticsPeriod } from '@/types/campaignAnalytics'
import type { ExportFormat } from '@/utils/export'
import { convertToISOString } from '@/utils/index'
import { useBusinessFormatting } from '@/utils/businessFormatters'

// Vue Query hooks
import {
  useCampaignAnalyticsOverview,
  useCampaignAttributionAnalysis,
  useCampaignCollaborationAnalysis,
  useCampaignAttributionRules,
  useCampaignLayerPerformance,
  useCampaignOverlapCalendar,
  useCampaignPerformanceTrends,
} from '@/composables/queries/useCampaignAnalyticsQueries'
import { useDashboardQueries } from '@/composables/queries/useDashboardQueries'

// Chart state management
import { useChartStateWithComponent } from '@/composables/useChartState'

// Export functionality
import { useAnalyticsExport } from '@/composables/analytics/useAnalyticsExport'
import AnalyticsExportButton from '@/components/analytics/AnalyticsExportButton.vue'
import { DateRangePicker } from '@/components/ui/date-picker'
import AnalyticsLoadingState from '@/components/analytics/AnalyticsLoadingState.vue'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState.vue'
import AnalyticsRefreshButton from '@/components/analytics/AnalyticsRefreshButton.vue'
import AnalyticsTabNavigation from '@/components/analytics/AnalyticsTabNavigation.vue'
import AnalyticsSettingsPanel from '@/components/analytics/AnalyticsSettingsPanel.vue'
// import { Button } from '@/components/ui/button' // 未使用
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
// TabsList, TabsTrigger 未使用
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  // Download, // 未使用
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  BarChart3,
  Layers,
  Zap,
  AlertCircle,
} from 'lucide-vue-next'

// 圖表組件
import AttributionChart from '@/components/charts/pure/AttributionChart.vue'
import LayerPerformanceChart from '@/components/charts/pure/LayerPerformanceChart.vue'
import CollaborationChart from '@/components/charts/pure/CollaborationChart.vue'
import OverlapCalendarChart from '@/components/charts/pure/OverlapCalendarChart.vue'
import PerformanceTrendsChart from '@/components/charts/pure/PerformanceTrendsChart.vue'
import UserBehaviorFunnelChart from '@/components/analytics/UserBehaviorFunnelChart.vue'

// 🔐 Edge Function 組件
import CampaignScoringSection from '@/components/campaign/CampaignScoringSection.vue'

// 層級常數和工具函數
import { getLayerDisplayName } from '@/constants/campaignLayers'
import { ANALYTICS_DEFAULTS } from '@/constants'

// 響應式狀態
const activeTab = ref('overview')

// 期間選擇狀態
const selectedPeriod = ref<CampaignAnalyticsPeriod>('30d')

// 日期範圍狀態 - 預設30天
const dateRange = ref<DateRange>({
  start: today(getLocalTimeZone()).subtract({ days: 29 }),
  end: today(getLocalTimeZone()),
})

// 追蹤選中的預設標籤
const selectedPresetLabel = ref<string | null>(null)

// 使用 computed 動態計算篩選器
const currentFilters = computed(() => ({
  startDate: dateRange.value?.start
    ? toDate(dateRange.value.start as any).toISOString().split('T')[0]
    : undefined,
  endDate: dateRange.value?.end
    ? toDate(dateRange.value.end as any).toISOString().split('T')[0]
    : undefined,
  layers: undefined as string[] | undefined,
  campaignTypes: undefined as string[] | undefined,
}))

// Vue Query hooks - 使用響應式篩選器
const dateFiltersForOverview = computed(() => {
  if (currentFilters.value.startDate && currentFilters.value.endDate) {
    return {
      start: currentFilters.value.startDate,
      end: currentFilters.value.endDate,
    }
  }
  return undefined
})

const dateFiltersForLayer = computed(() => {
  if (currentFilters.value.startDate && currentFilters.value.endDate) {
    return {
      startDate: currentFilters.value.startDate,
      endDate: currentFilters.value.endDate,
    }
  }
  return undefined
})

const overviewQuery = useCampaignAnalyticsOverview(dateFiltersForOverview)
const attributionQuery = useCampaignAttributionAnalysis(currentFilters)
const collaborationQuery = useCampaignCollaborationAnalysis(
  dateFiltersForOverview,
)
const rulesQuery = useCampaignAttributionRules()

// 新增的查詢 - 支援日期篩選的功能
const overlapCalendarQuery = useCampaignOverlapCalendar(dateFiltersForOverview)
const performanceTrendsQuery = useCampaignPerformanceTrends(
  undefined,
  dateFiltersForOverview,
)

// 用戶行為漏斗查詢
const { useUserBehaviorFunnel } = useDashboardQueries()
const userBehaviorFunnelQuery = useUserBehaviorFunnel(dateFiltersForOverview)

// 查詢狀態監控（生產環境下可移除）
// watch 查詢狀態用於開發階段的問題診斷

// Chart components with state management
const attributionChart = useChartStateWithComponent(
  attributionQuery,
  AttributionChart,
  {
    emptyMessage: '無歸因分析數據',
    errorMessage: '載入歸因分析數據失敗',
    chartProps: { width: ANALYTICS_DEFAULTS.DEFAULT_CHART_WIDTH, height: ANALYTICS_DEFAULTS.DEFAULT_CHART_HEIGHT },
  },
)

// Layer Performance 查詢 - 使用真實的 API 資料
const layerPerformanceQuery = useCampaignLayerPerformance(dateFiltersForLayer)

const layerPerformanceChart = useChartStateWithComponent(
  layerPerformanceQuery,
  LayerPerformanceChart,
  {
    emptyMessage: '無分層效果數據',
    errorMessage: '載入分層效果數據失敗',
    chartProps: { width: ANALYTICS_DEFAULTS.SMALL_CHART_WIDTH, height: ANALYTICS_DEFAULTS.SMALL_CHART_HEIGHT },
  },
)

const collaborationChart = useChartStateWithComponent(
  collaborationQuery,
  CollaborationChart,
  {
    emptyMessage: '無協作分析數據',
    errorMessage: '載入協作分析數據失敗',
    chartProps: { width: ANALYTICS_DEFAULTS.DEFAULT_CHART_WIDTH, height: ANALYTICS_DEFAULTS.DEFAULT_CHART_HEIGHT },
  },
)

// 新增的圖表組件狀態管理
const overlapCalendarChart = useChartStateWithComponent(
  overlapCalendarQuery,
  OverlapCalendarChart,
  {
    emptyMessage: '無重疊日曆數據',
    errorMessage: '載入重疊日曆數據失敗',
    chartProps: { width: ANALYTICS_DEFAULTS.DEFAULT_CHART_WIDTH, height: ANALYTICS_DEFAULTS.DEFAULT_CHART_HEIGHT },
  },
)

const performanceTrendsChart = useChartStateWithComponent(
  performanceTrendsQuery,
  PerformanceTrendsChart,
  {
    emptyMessage: '無效果趨勢數據',
    errorMessage: '載入效果趨勢數據失敗',
    chartProps: { width: ANALYTICS_DEFAULTS.DEFAULT_CHART_WIDTH, height: ANALYTICS_DEFAULTS.DEFAULT_CHART_HEIGHT },
  },
)

const userBehaviorFunnelChart = useChartStateWithComponent(
  userBehaviorFunnelQuery,
  UserBehaviorFunnelChart,
  {
    emptyMessage: '無用戶行為漏斗數據',
    errorMessage: '載入用戶行為漏斗數據失敗',
  }
)

// 活動分析功能標籤 - 統一簡潔樣式
const campaignAnalyticsTabs = [
  { id: 'overview', name: '總覽' },
  { id: 'attribution', name: '歸因分析' },
  { id: 'collaboration', name: '協作分析' },
  { id: 'competition', name: '競爭分析' },
  { id: 'overlap', name: '重疊分析' },
  { id: 'trends', name: '趨勢分析' },
  { id: 'behavior', name: '用戶行為' },
  { id: 'scoring', name: '評分系統' },
  { id: 'rules', name: '規則管理' },
]

/*
移除的配置（已註解保留供參考）:
- icon: BarChart3, Target, Users, Layers, TrendingUp, Zap, AlertCircle
- badge: '✅ 支援日期篩選' (overlap, trends) - 使用者可從頁面篩選器直接操作
- badge: 'Edge Function' (scoring) - 技術實作細節，對使用者無意義
- emoji: '🔐' (scoring) - 移除以保持一致性
原因：保持與其他 Analytics 模組的一致性，專注於內容而非裝飾元素
*/

// 計算屬性和狀態
const isLoading = computed(() => {
  // 檢查所有查詢的載入狀態
  
  return (
    overviewQuery.isLoading.value ||
    attributionQuery.isLoading.value ||
    collaborationQuery.isLoading.value ||
    layerPerformanceQuery.isLoading.value ||
    rulesQuery.isLoading.value ||
    overlapCalendarQuery.isLoading.value ||
    performanceTrendsQuery.isLoading.value ||
    userBehaviorFunnelQuery.isLoading.value
  )
})

const error = computed(
  () =>
    overviewQuery.error.value?.message ||
    attributionQuery.error.value?.message ||
    collaborationQuery.error.value?.message ||
    layerPerformanceQuery.error.value?.message ||
    rulesQuery.error.value?.message ||
    overlapCalendarQuery.error.value?.message ||
    performanceTrendsQuery.error.value?.message ||
    userBehaviorFunnelQuery.error.value?.message ||
    null,
)

const hasAnalyticsData = computed(() => {
  // 如果任何一個查詢成功且有數據，就認為有可匯出的數據
  const hasOverview = !!(overviewQuery.isSuccess.value && overviewQuery.data.value)
  const hasAttribution = !!(attributionQuery.isSuccess.value && attributionQuery.data.value && Array.isArray(attributionQuery.data.value) && attributionQuery.data.value.length > 0)
  const hasCollaboration = !!(collaborationQuery.isSuccess.value && collaborationQuery.data.value && Array.isArray(collaborationQuery.data.value) && collaborationQuery.data.value.length > 0)
  const hasLayerPerformance = !!(layerPerformanceQuery.isSuccess.value && layerPerformanceQuery.data.value && Array.isArray(layerPerformanceQuery.data.value) && layerPerformanceQuery.data.value.length > 0)
  const hasRules = !!(rulesQuery.isSuccess.value && rulesQuery.data.value)
  const hasOverlapCalendar = !!(overlapCalendarQuery.isSuccess.value && overlapCalendarQuery.data.value && Array.isArray(overlapCalendarQuery.data.value) && overlapCalendarQuery.data.value.length > 0)
  const hasPerformanceTrends = !!(performanceTrendsQuery.isSuccess.value && performanceTrendsQuery.data.value && Array.isArray(performanceTrendsQuery.data.value) && performanceTrendsQuery.data.value.length > 0)

  return hasOverview || hasAttribution || hasCollaboration || hasLayerPerformance || hasRules || hasOverlapCalendar || hasPerformanceTrends
})

const lastUpdated = computed(() => convertToISOString(new Date()))
const isDataFresh = computed(() => true) // 簡化實現

// 匯出功能
const { exportCampaignAnalytics } = useAnalyticsExport()

// 匯出報表處理函數
const handleExportReport = async (format: ExportFormat) => {
  try {
    // 調試：檢查各個查詢的狀態
    // 檢查數據狀態以進行匯出

    // 創建一個包含實際數據的扁平化陣列用於匯出
    const exportableData = []

    // 處理總覽數據 - 單一對象
    if (overviewQuery.isSuccess.value && overviewQuery.data.value) {
      const overview = overviewQuery.data.value
      exportableData.push({
        數據類型: '總覽',
        期間: selectedPeriod.value,
        總活動數: overview.totalCampaigns || 0,
        歸因營收: overview.totalAttributedRevenue || 0,
        影響訂單: overview.totalInfluencedOrders || 0,
        平均訂單價值: overview.averageOrderValue || 0,
        歸因準確度: (overview.attributionAccuracy || 0) + '%',
        協作指數: (overview.collaborationIndex || 0) + '%',
        平均並行活動數: overview.averageConcurrentCampaigns || 0,
        生成時間: convertToISOString(new Date())
      })
    }

    // 處理歸因分析數據 - 陣列
    if (attributionQuery.isSuccess.value && attributionQuery.data.value && Array.isArray(attributionQuery.data.value)) {
      attributionQuery.data.value.forEach((item, index) => {
        exportableData.push({
          數據類型: '歸因分析',
          序號: index + 1,
          活動ID: item.campaignId || '',
          活動名稱: item.campaignName || '',
          歸因層級: item.attributionLayer || '',
          歸因營收: item.totalAttributedRevenue || 0,
          獨佔訂單: item.exclusiveOrders || 0,
          協作訂單: item.collaborativeOrders || 0,
          主導歸因: item.dominantAttributions || 0,
          平均歸因營收: item.avgAttributedRevenue || 0
        })
      })
    }

    // 處理分層效果數據 - 陣列
    if (layerPerformanceQuery.isSuccess.value && layerPerformanceQuery.data.value && Array.isArray(layerPerformanceQuery.data.value)) {
      layerPerformanceQuery.data.value.forEach((item, index) => {
        exportableData.push({
          數據類型: '分層效果',
          序號: index + 1,
          層級: item.layer || '',
          活動數: item.campaigns || 0,
          營收: item.revenue || 0,
          訂單數: item.orders || 0,
          平均訂單價值: item.avgOrderValue || 0,
          協作率: (item.collaborationRate || 0) + '%'
        })
      })
    }

    // 處理協作分析數據 - 陣列
    if (collaborationQuery.isSuccess.value && collaborationQuery.data.value && Array.isArray(collaborationQuery.data.value)) {
      collaborationQuery.data.value.forEach((item, index) => {
        exportableData.push({
          數據類型: '協作分析',
          序號: index + 1,
          活動組合: item.campaignCombination || '',
          協作類型: item.collaborationType || '',
          並行活動數: item.concurrentCampaigns || 0,
          組合營收: item.combinationRevenue || 0,
          出現次數: item.occurrenceCount || 0,
          營收占比: (item.revenueSharePct || 0) + '%'
        })
      })
    }

    // 處理規則數據 - 單一對象包含子陣列
    if (rulesQuery.isSuccess.value && rulesQuery.data.value) {
      const rules = rulesQuery.data.value

      // 添加規則總覽
      exportableData.push({
        數據類型: '規則總覽',
        總活動數: rules.totalCampaigns || 0,
        歸因層級數: Object.keys(rules.layerDistribution || {}).length,
        規則類型數: (rules.rulesMappings || []).length
      })

      // 添加規則映射詳情
      if (rules.rulesMappings && Array.isArray(rules.rulesMappings)) {
        rules.rulesMappings.forEach((mapping, index) => {
          exportableData.push({
            數據類型: '規則映射',
            序號: index + 1,
            活動類型: mapping.campaign_type || '',
            歸因層級: mapping.attribution_layer || '',
            歸因權重: mapping.attribution_weight || 0,
            優先級分數: mapping.priority_score || 0,
            活動數量: mapping.count || 0
          })
        })
      }
    }

    // 處理重疊日曆數據 - 陣列
    if (overlapCalendarQuery.isSuccess.value && overlapCalendarQuery.data.value && Array.isArray(overlapCalendarQuery.data.value)) {
      overlapCalendarQuery.data.value.forEach((item, index) => {
        exportableData.push({
          數據類型: '重疊日曆',
          序號: index + 1,
          日期: item.date || '',
          重疊數量: item.concurrentCampaigns || 0,
          活動清單: item.campaignsList || '',
          競爭強度: item.complexityLevel || ''
        })
      })
    }

    // 處理效果趨勢數據 - 陣列
    if (performanceTrendsQuery.isSuccess.value && performanceTrendsQuery.data.value && Array.isArray(performanceTrendsQuery.data.value)) {
      performanceTrendsQuery.data.value.forEach((item, index) => {
        exportableData.push({
          數據類型: '效果趨勢',
          序號: index + 1,
          時間點: item.timestamp || item.date || '',
          營收: item.revenue || 0,
          訂單數: item.orders || 0,
          轉換率: (item.conversionRate || 0) + '%',
          ROI: (item.roi || 0) + '%'
        })
      })
    }

    // 如果沒有任何數據，添加元數據記錄
    if (exportableData.length === 0) {
      exportableData.push({
        數據類型: '分析設定',
        期間: selectedPeriod.value,
        歸因層級: currentFilters.value.layers?.join(',') || 'all',
        開始日期: currentFilters.value.startDate || '',
        結束日期: currentFilters.value.endDate || '',
        活動類型: currentFilters.value.campaignTypes?.join(',') || 'all',
        生成時間: convertToISOString(new Date()),
        說明: '目前沒有符合篩選條件的活動分析數據'
      })
    }

    // 準備匯出數據

    await exportCampaignAnalytics(exportableData, {
      period: selectedPeriod.value,
      attributionLayer: currentFilters.value.layers?.join(',') || 'all',
      format
    })
  } catch (error) {
    log.error('匯出活動分析報表失敗:', error)
    alert(`匯出失敗: ${(error as Error).message}`)
  }
}

// 移除假資料函數，將使用真實的 API 資料

// 格式化函數
// Use business formatting
const { formatDashboardValue } = useBusinessFormatting()

function formatCurrency(amount: number): string {
  return formatDashboardValue(amount, 'currency')
}

function formatPercentage(value: number): string {
  return formatDashboardValue(value, 'rate')
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('zh-TW')
}

// 移除 periodOptions 和 handleDateControlChange，現在使用 dateRange 的雙向綁定

// 手動分析觸發函數
const applyAnalysisParams = async () => {
  // 手動觸發分析

  // 手動觸發所有 Vue Query 的重新取得
  await Promise.all([
    overviewQuery.refetch(),
    attributionQuery.refetch(),
    collaborationQuery.refetch(),
    layerPerformanceQuery.refetch(),
    rulesQuery.refetch(),
    overlapCalendarQuery.refetch(),
    performanceTrendsQuery.refetch(),
    userBehaviorFunnelQuery.refetch(),
  ])

  // 分析刷新完成
}

// 計算屬性
const overviewMetrics = computed(() => {
  if (!overviewQuery.data.value) return []

  const overview = overviewQuery.data.value
  return [
    {
      label: '總活動數',
      value: overview.totalCampaigns.toString(),
      icon: Target,
      trend: null,
      color: 'text-blue-600',
    },
    {
      label: '歸因營收',
      value: formatCurrency(overview.totalAttributedRevenue),
      icon: BarChart3,
      trend: null,
      color: 'text-green-600',
    },
    {
      label: '影響訂單',
      value: overview.totalInfluencedOrders.toString(),
      icon: Users,
      trend: null,
      color: 'text-purple-600',
    },
    {
      label: '平均訂單價值',
      value: formatCurrency(overview.averageOrderValue),
      icon: TrendingUp,
      trend: null,
      color: 'text-orange-600',
    },
    {
      label: '歸因準確度',
      value: formatPercentage(overview.attributionAccuracy),
      icon: Zap,
      trend:
        overview.attributionAccuracy >= 70
          ? ('up' as const)
          : overview.attributionAccuracy >= 50
            ? ('stable' as const)
            : ('down' as const),
      color:
        overview.attributionAccuracy >= 70
          ? 'text-green-600'
          : overview.attributionAccuracy >= 50
            ? 'text-yellow-600'
            : 'text-red-600',
    },
    {
      label: '協作指數',
      value: formatPercentage(overview.collaborationIndex),
      icon: Layers,
      trend:
        overview.collaborationIndex >= 40
          ? ('up' as const)
          : overview.collaborationIndex >= 20
            ? ('stable' as const)
            : ('down' as const),
      color:
        overview.collaborationIndex >= 40
          ? 'text-green-600'
          : overview.collaborationIndex >= 20
            ? 'text-yellow-600'
            : 'text-red-600',
    },
  ]
})

// 層級統計資料 - 使用真實的 API 資料
const layerStats = computed(() => {
  if (!layerPerformanceQuery.data.value) return []

  return layerPerformanceQuery.data.value.map((layer) => ({
    ...layer,
    layerName: getLayerDisplayName(layer.layer),
    revenueFormatted: formatCurrency(layer.revenue),
    avgOrderValueFormatted: formatCurrency(layer.avgOrderValue),
    collaborationRateFormatted: formatPercentage(layer.collaborationRate),
  }))
})

const topCampaigns = computed(() => {
  if (!attributionQuery.data.value) return []
  return attributionQuery.data.value.slice(0, 10).map((campaign, index) => ({
    ...campaign,
    rank: index + 1,
    score: Math.round(
      campaign.totalAttributedRevenue / 1000 +
      campaign.dominantAttributions * 10,
    ),
    attributedRevenueFormatted: formatCurrency(campaign.totalAttributedRevenue),
    avgOrderValueFormatted: formatCurrency(campaign.avgAttributedRevenue),
    collaborationIndexFormatted: formatPercentage(
      (campaign.collaborativeOrders /
        (campaign.exclusiveOrders + campaign.collaborativeOrders)) *
      100,
    ),
    layer: campaign.attributionLayer,
    campaignName: campaign.campaignName,
  }))
})

// 協作效果統計
const collaborationEffectStats = computed(() => {
  if (!collaborationQuery.data.value) {
    return {
      singleCampaignRevenue: 0,
      dualCollaborationRevenue: 0,
      multiCollaborationRevenue: 0,
      collaborationLift: 0,
      optimalCombinations: [],
    }
  }

  const data = collaborationQuery.data.value
  const singleCampaign = data.filter((item) => item.concurrentCampaigns === 1)
  const dualCollaboration = data.filter(
    (item) => item.concurrentCampaigns === 2,
  )
  const multiCollaboration = data.filter(
    (item) => item.concurrentCampaigns >= 3,
  )

  const singleRevenue = singleCampaign.reduce(
    (sum, item) => sum + item.combinationRevenue,
    0,
  )
  const dualRevenue = dualCollaboration.reduce(
    (sum, item) => sum + item.combinationRevenue,
    0,
  )
  const multiRevenue = multiCollaboration.reduce(
    (sum, item) => sum + item.combinationRevenue,
    0,
  )

  const totalCollaborationRevenue = dualRevenue + multiRevenue
  const collaborationLift =
    singleRevenue > 0
      ? ((totalCollaborationRevenue - singleRevenue) / singleRevenue) * 100
      : 0

  return {
    singleCampaignRevenue: singleRevenue,
    dualCollaborationRevenue: dualRevenue,
    multiCollaborationRevenue: multiRevenue,
    collaborationLift: collaborationLift,
    optimalCombinations: data.slice(0, 5), // 取前5個最佳組合
  }
})

// 系統效能總覽 (簡化版本)
const systemPerformanceOverview = computed(() => {
  if (!overviewQuery.data.value) return null

  const overview = overviewQuery.data.value
  return {
    attributionHealth:
      overview.attributionAccuracy >= 70
        ? 'excellent'
        : overview.attributionAccuracy >= 50
          ? 'good'
          : 'fair',
    collaborationBalance:
      overview.collaborationIndex >= 40
        ? 'excellent'
        : overview.collaborationIndex >= 20
          ? 'good'
          : 'fair',
    competitionLevel:
      overview.averageConcurrentCampaigns >= 3
        ? 'high'
        : overview.averageConcurrentCampaigns >= 2
          ? 'moderate'
          : 'low',
    systemEfficiency: Math.round(
      (overview.attributionAccuracy + overview.collaborationIndex) / 2,
    ),
    optimizationOpportunities:
      overview.attributionAccuracy < 70
        ? ['提升歸因準確度', '優化活動協作']
        : [],
  }
})

// 輔助函數 (getLayerDisplayName 已從 @/constants/campaignLayers 導入)

function getTrendIcon(trend: 'up' | 'down' | 'stable' | null) {
  switch (trend) {
    case 'up':
      return TrendingUp
    case 'down':
      return TrendingDown
    case 'stable':
      return Minus
    default:
      return Minus
  }
}

function getStatusBadgeVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'excellent':
      return 'default'
    case 'good':
      return 'secondary'
    case 'fair':
      return 'outline'
    case 'poor':
      return 'destructive'
    default:
      return 'outline'
  }
}

function getCollaborationTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    single_campaign: '單一活動',
    dual_collaboration: '雙活動協作',
    multi_collaboration: '多活動協作',
  }
  return typeLabels[type] || type
}

// 事件處理 (未使用)
// function handlePeriodChange(period: CampaignAnalyticsPeriod) {
// function _handlePeriodChange(period: CampaignAnalyticsPeriod) { // 未使用
/* const __unused_handlePeriodChange = (period: CampaignAnalyticsPeriod) => {
  selectedPeriod.value = period
  // 基於期間更新篩選器
  const now = new Date()
  const start = new Date(now)

  switch (period) {
    case '7d':
      start.setDate(now.getDate() - 7)
      break
    case '30d':
      start.setDate(now.getDate() - 30)
      break
    case '90d':
      start.setDate(now.getDate() - 90)
      break
    case '6m':
      start.setMonth(now.getMonth() - 6)
      break
    case '1y':
      start.setFullYear(now.getFullYear() - 1)
      break
  }

  // 更新篩選器，Vue Query 會自動重新執行查詢
  currentFilters.value = {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  }

  // 期間篩選更新
} */

// 舊的處理函數保留以備不時之需，但主要使用統一的 handleDateControlChange (未使用)
// function handleDateRangeChange(range: DateRange | undefined) {
// function _handleDateRangeChange(range: DateRange | undefined) { // 未使用
/* const __unused_handleDateRangeChange = (range: DateRange | undefined) => {
  if (range?.start && range?.end) {
    customDateRange.value = range
    // 更新篩選器，Vue Query 會自動重新執行查詢
    currentFilters.value = {
      startDate: toDate(range.start, getLocalTimeZone())
        .toISOString()
        .split('T')[0],
      endDate: toDate(range.end, getLocalTimeZone())
        .toISOString()
        .split('T')[0],
    }

    // 日期範圍更新
  }
} */

function handleRefresh() {
  // 重新執行所有查詢
  overviewQuery.refetch()
  attributionQuery.refetch()
  collaborationQuery.refetch()
  rulesQuery.refetch()
  overlapCalendarQuery.refetch()
  performanceTrendsQuery.refetch()
  userBehaviorFunnelQuery.refetch()
}

// 監控篩選器變化
watch(
  currentFilters,
  (_newFilters) => {
    // 篩選器更新
  },
  { deep: true },
)

watch(dateFiltersForOverview, (_newDateFilters) => {
  // 日期篩選器更新 (overview)
})

watch(dateFiltersForLayer, (_newDateFilters) => {
  // 日期篩選器更新 (layer)
})

// 生命週期
onMounted(() => {
  // CampaignAnalyticsView 初始化完成
  // Vue Query 會自動執行查詢，無需手動觸發
})
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題 -->
    <div class="campaign-analytics-header">
      <!-- 標題與按鈕並排 -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">活動效益分析</h1>
          <p class="mt-1 text-sm text-gray-600">
            基於分層歸因機制的行銷活動效果分析 - Phase 1 零資料表擴展版本
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <AnalyticsExportButton :has-data="hasAnalyticsData" :loading="isLoading" text="匯出報表"
            @export="handleExportReport" />
          <AnalyticsRefreshButton :loading="isLoading" @click="handleRefresh" />
        </div>
      </div>

      <!-- Phase 1 限制說明 -->
      <div class="mb-4 rounded-md bg-amber-50 p-2 text-sm text-amber-600">
        <strong>Phase 1 限制</strong>:
        總覽、歸因、層級效果、協作分析目前分析所有歷史數據，日期篩選功能僅在「重疊分析」和「趨勢分析」頁籤中有效
      </div>

      <!-- 控制面板 -->
      <AnalyticsSettingsPanel :loading="isLoading" @apply="applyAnalysisParams">
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700">分析期間</label>
          <DateRangePicker v-model="dateRange as any" placeholder="選擇分析日期範圍" :showPresets="true"
            :showSelectedPreset="true" @update:selectedPreset="(label) => selectedPresetLabel = label" />
        </div>

        <!-- 篩選器調試信息（開發用） -->
        <div class="text-muted-foreground text-xs">
          當前篩選: {{ currentFilters.startDate }} ~ {{ currentFilters.endDate }}
        </div>
      </AnalyticsSettingsPanel>
    </div>

    <!-- 錯誤狀態 -->
    <AnalyticsErrorState v-if="error" :error="error" type="network" :show-card="false" :show-retry="true"
      @retry="handleRefresh" />

    <!-- 主要內容 -->
    <div v-else class="analytics-content space-y-6">
      <!-- 數據狀態指示器 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <Badge :variant="isDataFresh ? 'default' : 'secondary'">
            {{ isDataFresh ? '數據即時' : '數據稍舊' }}
          </Badge>
          <span class="text-muted-foreground text-sm">
            最後更新：{{ lastUpdated ? formatDate(lastUpdated) : '未知' }}
          </span>
        </div>
      </div>

      <!-- 關鍵指標總覽 -->
      <div class="metrics-overview">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="metric in overviewMetrics" :key="metric.label">
            <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle class="text-sm font-medium">{{
                metric.label
              }}</CardTitle>
              <component :is="metric.icon" :class="['h-4 w-4', metric.color]" />
            </CardHeader>
            <CardContent>
              <div class="text-2xl font-bold">{{ metric.value }}</div>
              <div v-if="metric.trend" class="flex items-center pt-1">
                <component :is="getTrendIcon(metric.trend)" class="text-muted-foreground mr-1 h-4 w-4" />
                <span class="text-muted-foreground text-xs">與上期比較</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- 主要分析面板 -->
      <!-- 使用增強的 AnalyticsTabNavigation 展示圖示和 Badge 功能 -->
      <AnalyticsTabNavigation :tabs="campaignAnalyticsTabs" v-model:activeTab="activeTab" layout="grid"
        gridCols="grid-cols-9" ariaLabel="活動分析功能導航" />

      <!-- 載入狀態 -->
      <AnalyticsLoadingState v-if="isLoading && !hasAnalyticsData" message="正在載入活動分析數據..." type="skeleton"
        :skeleton-rows="3" :skeleton-cols="2" :show-card="false" />

      <!-- 隱藏原有的 TabsList，但保留 Tabs 容器以支持現有的 TabsContent -->
      <Tabs v-else :model-value="activeTab" class="analytics-tabs">
        <!-- <TabsList class="grid w-full grid-cols-8" style="display: none;">
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="attribution">歸因分析</TabsTrigger>
          <TabsTrigger value="collaboration">協作分析</TabsTrigger>
          <TabsTrigger value="competition">競爭分析</TabsTrigger>
          <TabsTrigger value="overlap">重疊分析</TabsTrigger>
          <TabsTrigger value="trends">趨勢分析</TabsTrigger>
          <TabsTrigger value="scoring">🔐 評分系統</TabsTrigger>
          <TabsTrigger value="rules">規則管理</TabsTrigger>
        </TabsList> -->

        <!-- 總覽標籤 -->
        <TabsContent value="overview" class="space-y-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- 分層效果統計 -->
            <Card>
              <CardHeader>
                <CardTitle>分層效果統計</CardTitle>
                <CardDescription>各歸因層級的詳細數據</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div v-for="layer in layerStats" :key="layer.layer" class="layer-item">
                    <div class="mb-2 flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <Badge variant="outline">{{ layer.layerName }}</Badge>
                        <span class="text-muted-foreground text-sm">{{ layer.campaigns }} 個活動</span>
                      </div>
                      <span class="text-sm font-medium">{{
                        layer.revenueFormatted
                      }}</span>
                    </div>
                    <div class="text-muted-foreground grid grid-cols-3 gap-4 text-xs">
                      <div>訂單數: {{ layer.orders }}</div>
                      <div>平均價值: {{ layer.avgOrderValueFormatted }}</div>
                      <div>協作率: {{ layer.collaborationRateFormatted }}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- 活動排行榜 -->
            <Card>
              <CardHeader>
                <CardTitle>活動效益排行榜</CardTitle>
                <CardDescription>綜合績效最佳的前 10 個活動</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div v-for="campaign in topCampaigns" :key="campaign.campaignId" class="campaign-item">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-3">
                        <Badge variant="secondary" class="flex h-6 w-8 items-center justify-center">
                          {{ campaign.rank }}
                        </Badge>
                        <div>
                          <div class="text-sm font-medium">
                            {{ campaign.campaignName }}
                          </div>
                          <div class="text-muted-foreground text-xs">
                            {{ getLayerDisplayName(campaign.layer) }}
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-medium">
                          {{ campaign.attributedRevenueFormatted }}
                        </div>
                        <div class="text-muted-foreground text-xs">
                          分數: {{ campaign.score }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- 分層效果視覺化 -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>分層效果分析圖</CardTitle>
                <CardDescription>各層級營收分佈視覺化</CardDescription>
              </CardHeader>
              <CardContent>
                <component :is="layerPerformanceChart.render" />
              </CardContent>
            </Card>

            <!-- 空白卡片或其他內容 -->
            <div></div>
          </div>

          <!-- 系統效能總覽 -->
          <Card v-if="systemPerformanceOverview">
            <CardHeader>
              <CardTitle>系統效能總覽</CardTitle>
              <CardDescription>歸因系統的整體健康狀況與效能指標</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div class="performance-metric">
                  <div class="text-muted-foreground text-sm">歸因健康</div>
                  <Badge :variant="getStatusBadgeVariant(
                    systemPerformanceOverview.attributionHealth,
                  )
                    ">
                    {{ systemPerformanceOverview.attributionHealth }}
                  </Badge>
                </div>
                <div class="performance-metric">
                  <div class="text-muted-foreground text-sm">協作平衡</div>
                  <Badge :variant="getStatusBadgeVariant(
                    systemPerformanceOverview.collaborationBalance,
                  )
                    ">
                    {{ systemPerformanceOverview.collaborationBalance }}
                  </Badge>
                </div>
                <div class="performance-metric">
                  <div class="text-muted-foreground text-sm">競爭程度</div>
                  <Badge :variant="getStatusBadgeVariant(
                    systemPerformanceOverview.competitionLevel,
                  )
                    ">
                    {{ systemPerformanceOverview.competitionLevel }}
                  </Badge>
                </div>
                <div class="performance-metric">
                  <div class="text-muted-foreground text-sm">系統效率</div>
                  <span class="text-lg font-bold">{{ systemPerformanceOverview.systemEfficiency }}%</span>
                </div>
              </div>

              <!-- 優化建議 -->
              <div v-if="
                systemPerformanceOverview.optimizationOpportunities?.length >
                0
              " class="mt-4">
                <h4 class="mb-2 text-sm font-medium">優化建議</h4>
                <div class="space-y-1">
                  <div v-for="opportunity in systemPerformanceOverview.optimizationOpportunities" :key="opportunity"
                    class="text-muted-foreground text-xs">
                    • {{ opportunity }}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 歸因分析標籤 -->
        <TabsContent value="attribution" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>活動歸因詳細分析</CardTitle>
              <CardDescription>每個活動的歸因權重、影響訂單數和營收分配</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="attribution-chart-container">
                <component :is="attributionChart.render" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 協作分析標籤 -->
        <TabsContent value="collaboration" class="space-y-6">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- 協作效果統計 -->
            <Card>
              <CardHeader>
                <CardTitle>協作效果統計</CardTitle>
                <CardDescription>不同協作模式的營收表現</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="collaboration-stat">
                    <div class="flex items-center justify-between">
                      <span class="text-sm">單一活動營收</span>
                      <span class="font-medium">{{
                        formatCurrency(
                          collaborationEffectStats.singleCampaignRevenue,
                        )
                      }}</span>
                    </div>
                  </div>
                  <div class="collaboration-stat">
                    <div class="flex items-center justify-between">
                      <span class="text-sm">雙活動協作營收</span>
                      <span class="font-medium">{{
                        formatCurrency(
                          collaborationEffectStats.dualCollaborationRevenue,
                        )
                      }}</span>
                    </div>
                  </div>
                  <div class="collaboration-stat">
                    <div class="flex items-center justify-between">
                      <span class="text-sm">多活動協作營收</span>
                      <span class="font-medium">{{
                        formatCurrency(
                          collaborationEffectStats.multiCollaborationRevenue,
                        )
                      }}</span>
                    </div>
                  </div>
                  <div class="collaboration-stat border-t pt-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium">協作提升效果</span>
                      <Badge :variant="collaborationEffectStats.collaborationLift > 0
                        ? 'default'
                        : 'secondary'
                        ">
                        {{
                          formatPercentage(
                            collaborationEffectStats.collaborationLift,
                          )
                        }}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- 最佳協作組合 -->
            <Card>
              <CardHeader>
                <CardTitle>最佳協作組合</CardTitle>
                <CardDescription>營收表現最佳的活動組合</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div v-for="(
combo, _index
                    ) in collaborationEffectStats.optimalCombinations" :key="combo.campaignCombination"
                    class="collaboration-combo">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="text-sm font-medium">
                          {{ combo.campaignCombination }}
                        </div>
                        <div class="text-muted-foreground mt-1 text-xs">
                          {{
                            getCollaborationTypeLabel(combo.collaborationType)
                          }}
                          • {{ combo.occurrenceCount }} 次出現
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-medium">
                          {{ formatCurrency(combo.combinationRevenue) }}
                        </div>
                        <div class="text-muted-foreground text-xs">
                          {{ formatPercentage(combo.revenueSharePct) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- 競爭分析標籤 -->
        <TabsContent value="competition" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>活動重疊與競爭分析</CardTitle>
              <CardDescription>活動期間重疊情況與競爭強度分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="competition-analysis">
                <component :is="collaborationChart.render" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 重疊分析標籤 -->
        <TabsContent value="overlap" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>活動重疊日曆分析</CardTitle>
              <CardDescription>
                活動期間重疊情況與競爭強度分析
                <Badge variant="outline" class="ml-2">✅ 支援日期篩選</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="overlap-analysis">
                <component :is="overlapCalendarChart.render" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 趨勢分析標籤 -->
        <TabsContent value="trends" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>活動效果趨勢分析</CardTitle>
              <CardDescription>
                活動的時間序列效果趨勢與績效評估
                <Badge variant="outline" class="ml-2">✅ 支援日期篩選</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="trends-analysis">
                <component :is="performanceTrendsChart.render" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 用戶行為漏斗標籤 -->
        <TabsContent value="behavior" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>用戶行為轉換漏斗分析</CardTitle>
              <CardDescription>
                基於用戶實際行為的完整轉換漏斗分析，從商品瀏覽到訂單完成
                <Badge variant="outline" class="ml-2">✅ 即時數據</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="behavior-analysis">
                <component :is="userBehaviorFunnelChart.render" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 🔐 Edge Function 評分系統標籤 -->
        <TabsContent value="scoring" class="space-y-6">
          <CampaignScoringSection :period="selectedPeriod" />
        </TabsContent>

        <!-- 規則管理標籤 -->
        <TabsContent value="rules" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>歸因規則總結</CardTitle>
              <CardDescription>當前系統中的歸因規則分佈與應用狀況</CardDescription>
            </CardHeader>
            <CardContent>
              <div v-if="rulesQuery.data.value" class="rules-summary space-y-6">
                <!-- 規則分佈統計 -->
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div class="rule-stat">
                    <div class="text-2xl font-bold">
                      {{ rulesQuery.data.value.totalCampaigns }}
                    </div>
                    <div class="text-muted-foreground text-sm">總活動數</div>
                  </div>
                  <div class="rule-stat">
                    <div class="text-2xl font-bold">
                      {{
                        Object.keys(rulesQuery.data.value.layerDistribution)
                          .length
                      }}
                    </div>
                    <div class="text-muted-foreground text-sm">歸因層級</div>
                  </div>
                  <div class="rule-stat">
                    <div class="text-2xl font-bold">
                      {{ rulesQuery.data.value.rulesMappings.length }}
                    </div>
                    <div class="text-muted-foreground text-sm">規則類型</div>
                  </div>
                </div>

                <!-- 規則對應表 -->
                <div class="rules-mapping">
                  <h4 class="mb-3 text-sm font-medium">
                    活動類型與歸因規則對應
                  </h4>
                  <div class="space-y-2">
                    <div v-for="mapping in rulesQuery.data.value.rulesMappings" :key="mapping.campaign_type"
                      class="rule-mapping-item bg-muted flex items-center justify-between rounded-lg p-3">
                      <div class="flex items-center space-x-3">
                        <Badge variant="outline">{{
                          mapping.campaign_type
                        }}</Badge>
                        <span class="text-sm">{{
                          getLayerDisplayName(mapping.attribution_layer)
                        }}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span class="text-muted-foreground text-xs">權重: {{ mapping.attribution_weight }}</span>
                        <span class="text-muted-foreground text-xs">優先級: {{ mapping.priority_score }}</span>
                        <Badge variant="secondary">{{ mapping.count }} 個活動</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Phase 1 限制提醒 -->
                <Alert>
                  <AlertCircle class="h-4 w-4" />
                  <AlertDescription>
                    <strong>Phase 1 限制：</strong>當前規則管理基於現有資料分析，無法動態調整。
                    規則修改需要透過資料庫 migration。Phase 2
                    將提供完整的規則管理介面。
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>

<style scoped>
.campaign-analytics-container {
  max-width: 1400px;
  margin: 0 auto;
}

.metrics-overview .metric-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.layer-item,
.campaign-item,
.collaboration-stat,
.collaboration-combo {
  padding: 12px 0;
}

.layer-item:not(:last-child),
.campaign-item:not(:last-child),
.collaboration-stat:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

.performance-metric {
  text-align: center;
  padding: 12px;
}

.rule-stat {
  text-align: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.rule-mapping-item {
  transition: background-color 0.2s;
}

.rule-mapping-item:hover {
  background-color: #f8fafc;
}
</style>
