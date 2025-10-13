<script setup lang="ts">
// 懶載入圖表組件以提升首屏載入效能
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'DashboardRiskCenter')

import { defineAsyncComponent } from 'vue'
const RiskLevelChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/RiskLevelChart.vue')
)
const RiskTrendChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/RiskTrendChart.vue')
)
const RiskComparisonChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/RiskComparisonChart.vue')
)

import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import { useDashboardRefresh } from '@/composables/useDashboardRefresh'
import {
  useBusinessRiskAlerts,
  useRiskTrendsDaily,
  useRiskTrendForecast
} from '@/composables/queries/useBusinessHealthQueries'
import {
  useCustomerCombinedMetrics,
} from '@/composables/queries/useCustomerQueries'
import { useOrderStatusDistribution } from '@/composables/queries/useOrderQueries'
import {
  useAgentStatusDistribution,
  useConversationStatusDistribution,
} from '@/composables/queries/useSupportQueries'
import { useChartStateWithComponent } from '@/composables/useChartState'
import { computed } from 'vue'
import RiskLevelIndicator from '@/components/ui/RiskLevelIndicator.vue'
import ConfidenceProgressBar from '@/components/ui/ConfidenceProgressBar.vue'
import TrendArrow from '@/components/ui/TrendArrow.vue'
import OverviewCard from '@/components/cards/OverviewCard.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import StructuredTooltipContent from '@/components/ui/StructuredTooltipContent.vue'
import { dashboardTooltips } from '@/composables/useDashboardTooltips'
import { Rocket, CheckCircle, Search, BarChart3, Clock } from 'lucide-vue-next'
import { useBusinessFormatting } from '@/utils/businessFormatters'
// import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState.vue'

// Business formatting
const { formatDashboardValue } = useBusinessFormatting()

// 風險閾值配置（可從設定檔或 API 獲取）
const RISK_THRESHOLDS = {
  ORDER_PENDING_RATE: 15, // 訂單待處理率閾值 (%)
  SUPPORT_WAITING_RATE: 20, // 客服等待率閾值 (%)
  ORDER_CANCEL_RATE: 5, // 訂單取消率閾值 (%)
  CUSTOMER_CHURN_RATE: 0.1, // 客戶流失率閾值 (比例)
} as const

// 查詢數據
const riskAlertsQuery = useBusinessRiskAlerts()
const riskTrendsQuery = useRiskTrendsDaily()
const riskForecastQuery = useRiskTrendForecast()
const customerMetricsQuery = useCustomerCombinedMetrics()
const orderStatusQuery = useOrderStatusDistribution()
const agentStatusQuery = useAgentStatusDistribution()
const conversationStatusQuery = useConversationStatusDistribution()

// Dashboard refresh functionality
const dashboardRefresh = useDashboardRefresh('risk-center')

// 統一的刷新函數
const handleRefresh = async () => {
  await Promise.all([
    riskAlertsQuery.refetch(),
    riskTrendsQuery.refetch(),
    riskForecastQuery.refetch(),
    customerMetricsQuery.refetch(),
    orderStatusQuery.refetch(),
    agentStatusQuery.refetch(),
    conversationStatusQuery.refetch()
  ])
}

// 風險等級統計（基於實際業務數據計算，而非空的business_risk_alerts視圖）
const riskLevelStats = computed(() => {
  try {
    // 使用與風險類別對比圖表相同的數據源
    const customerRisk = customerRiskAnalysis.value
    const operationalRisk = operationalRiskAnalysis.value

    let critical = 0, medium = 0, low = 0

    // 客戶流失風險評估
    if (customerRisk.churnRisk > customerRisk.totalCustomers * 0.15) {
      critical++
    } else if (customerRisk.churnRisk > customerRisk.totalCustomers * 0.1) {
      medium++
    } else if (customerRisk.churnRisk > 0) {
      low++
    }

    // 訂單處理風險評估
    const pendingRate = parseFloat(operationalRisk.orderRisk.pendingRate) || 0
    if (pendingRate > 20) {
      critical++
    } else if (pendingRate > 10) {
      medium++
    } else if (pendingRate > 0) {
      low++
    }

    // 客服負載風險評估
    const waitingRate = parseFloat(operationalRisk.supportRisk.waitingRate) || 0
    if (waitingRate > 30) {
      critical++
    } else if (waitingRate > 15) {
      medium++
    } else if (waitingRate > 0) {
      low++
    }

    // 取消率風險評估
    const cancelRate = parseFloat(operationalRisk.orderRisk.cancelRate) || 0
    if (cancelRate > 8) {
      critical++
    } else if (cancelRate > 5) {
      medium++
    } else if (cancelRate > 0) {
      low++
    }

    return {
      critical,
      medium,
      low,
      total: critical + medium + low,
    }
  } catch (error) {
    log.error('計算風險等級統計時出錯:', error)
    return {
      critical: 0,
      medium: 0,
      low: 0,
      total: 0,
    }
  }
})

// 客戶風險分析
const customerRiskAnalysis = computed(() => {
  const customers = customerMetricsQuery.data.value || []

  if (!customers.length) {
    return {
      churnRisk: 0,
      atRiskCustomers: 0,
      churnedCustomers: 0,
      totalCustomers: 0,
      churnRiskPercentage: '0',
      riskTrend: 'stable',
    }
  }

  const atRiskCustomers = customers.filter(
    (c) => c.lifecycle_stage === 'At Risk',
  ).length
  const churnedCustomers = customers.filter(
    (c) => c.lifecycle_stage === 'Churned',
  ).length
  const highRecencyRisk = customers.filter(
    (c) => (c.recency_days || 0) > 90,
  ).length

  const churnRisk = Math.max(atRiskCustomers, highRecencyRisk)
  const totalCustomers = customers.length
  const churnRiskPercentage = totalCustomers
    ? formatDashboardValue((churnRisk / totalCustomers) * 100, 'rate')
    : '0'

  return {
    churnRisk,
    atRiskCustomers,
    churnedCustomers,
    totalCustomers,
    churnRiskPercentage,
    riskTrend:
      churnRisk > totalCustomers * 0.15
        ? 'increasing'
        : churnRisk < totalCustomers * 0.05
          ? 'decreasing'
          : 'stable',
  }
})

// 營運風險分析
const operationalRiskAnalysis = computed(() => {
  const orderStatus = orderStatusQuery.data.value || []
  const agentStatus = agentStatusQuery.data.value || []
  const conversationStatus = conversationStatusQuery.data.value || []

  // 訂單風險
  const pendingOrders =
    orderStatus.find((s) => s.status === 'pending')?.count || 0
  const cancelledOrders =
    orderStatus.find((s) => s.status === 'cancelled')?.count || 0
  const totalOrders = orderStatus.reduce((sum, s) => sum + s.count, 0)

  // 客服風險
  const busyAgents = agentStatus.find((s) => s.status === 'busy')?.count || 0
  const totalAgents = agentStatus.reduce((sum, s) => sum + s.count, 0)
  const waitingConversations =
    conversationStatus.find((s) => s.status === 'waiting')?.count || 0
  const totalConversations = conversationStatus.reduce(
    (sum, s) => sum + s.count,
    0,
  )

  return {
    orderRisk: {
      pendingRate: totalOrders
        ? formatDashboardValue((pendingOrders / totalOrders) * 100, 'rate')
        : '0',
      cancelRate: totalOrders
        ? formatDashboardValue((cancelledOrders / totalOrders) * 100, 'rate')
        : '0',
      riskLevel:
        pendingOrders > totalOrders * 0.2
          ? 'high'
          : pendingOrders > totalOrders * 0.1
            ? 'medium'
            : 'low',
    },
    supportRisk: {
      agentUtilization: totalAgents
        ? formatDashboardValue((busyAgents / totalAgents) * 100, 'rate')
        : '0',
      waitingRate: totalConversations
        ? formatDashboardValue((waitingConversations / totalConversations) * 100, 'rate')
        : '0',
      riskLevel:
        waitingConversations > totalConversations * 0.3
          ? 'high'
          : waitingConversations > totalConversations * 0.15
            ? 'medium'
            : 'low',
    },
  }
})

// 實時風險監控
const realTimeRisks = computed(() => [
  {
    category: '客戶流失',
    current: customerRiskAnalysis.value.churnRisk,
    threshold: Math.ceil(customerRiskAnalysis.value.totalCustomers * 0.1),
    status:
      customerRiskAnalysis.value.churnRisk >
        customerRiskAnalysis.value.totalCustomers * 0.15
        ? 'critical'
        : customerRiskAnalysis.value.churnRisk >
          customerRiskAnalysis.value.totalCustomers * 0.1
          ? 'warning'
          : 'normal',
    trend: customerRiskAnalysis.value.riskTrend,
    description: `${customerRiskAnalysis.value.churnRiskPercentage}% 客戶有流失風險`,
  },
  {
    category: '訂單處理',
    current: parseFloat(operationalRiskAnalysis.value.orderRisk.pendingRate),
    threshold: RISK_THRESHOLDS.ORDER_PENDING_RATE,
    status:
      parseFloat(operationalRiskAnalysis.value.orderRisk.pendingRate) > 20
        ? 'critical'
        : parseFloat(operationalRiskAnalysis.value.orderRisk.pendingRate) > 10
          ? 'warning'
          : 'normal',
    trend: 'stable',
    description: `${operationalRiskAnalysis.value.orderRisk.pendingRate}% 訂單待處理`,
  },
  {
    category: '客服負載',
    current: parseFloat(operationalRiskAnalysis.value.supportRisk.waitingRate),
    threshold: RISK_THRESHOLDS.SUPPORT_WAITING_RATE,
    status:
      parseFloat(operationalRiskAnalysis.value.supportRisk.waitingRate) > 30
        ? 'critical'
        : parseFloat(operationalRiskAnalysis.value.supportRisk.waitingRate) > 15
          ? 'warning'
          : 'normal',
    trend: 'stable',
    description: `${operationalRiskAnalysis.value.supportRisk.waitingRate}% 對話等待中`,
  },
  {
    category: '取消率',
    current: parseFloat(operationalRiskAnalysis.value.orderRisk.cancelRate),
    threshold: RISK_THRESHOLDS.ORDER_CANCEL_RATE,
    status:
      parseFloat(operationalRiskAnalysis.value.orderRisk.cancelRate) > 8
        ? 'critical'
        : parseFloat(operationalRiskAnalysis.value.orderRisk.cancelRate) > 5
          ? 'warning'
          : 'normal',
    trend: 'stable',
    description: `${operationalRiskAnalysis.value.orderRisk.cancelRate}% 訂單取消率`,
  },
])

// 風險預警建議
const riskMitigationActions = computed(() => {
  const actions = []

  // 客戶流失風險行動
  if (
    customerRiskAnalysis.value.churnRisk >
    customerRiskAnalysis.value.totalCustomers * RISK_THRESHOLDS.CUSTOMER_CHURN_RATE
  ) {
    actions.push({
      risk: '客戶流失風險',
      urgency: 'high',
      action: '啟動客戶挽回計劃',
      steps: [
        '識別高風險客戶名單',
        '發送個人化挽回郵件',
        '提供限時優惠或福利',
        '安排專人跟進服務',
      ],
      timeline: '立即執行',
      expectedOutcome: '挽回30-40%風險客戶',
      owner: '客戶成功團隊',
    })
  }

  // 訂單處理風險行動
  if (parseFloat(operationalRiskAnalysis.value.orderRisk.pendingRate) > RISK_THRESHOLDS.ORDER_PENDING_RATE) {
    actions.push({
      risk: '訂單處理延遲',
      urgency: 'high',
      action: '優化訂單處理流程',
      steps: [
        '增加處理人力配置',
        '識別處理瓶頸環節',
        '優化處理工作流程',
        '建立處理優先級機制',
      ],
      timeline: '本週內',
      expectedOutcome: '減少處理時間50%',
      owner: '營運團隊',
    })
  }

  // 客服負載風險行動
  if (parseFloat(operationalRiskAnalysis.value.supportRisk.waitingRate) > RISK_THRESHOLDS.SUPPORT_WAITING_RATE) {
    actions.push({
      risk: '客服負載過高',
      urgency: 'medium',
      action: '增強客服支援能力',
      steps: [
        '調整客服排班計劃',
        '啟用自動回覆系統',
        '增加常見問題FAQ',
        '培訓客服處理技能',
      ],
      timeline: '1週內',
      expectedOutcome: '減少等待時間60%',
      owner: '客服團隊',
    })
  }

  return actions
})

// 風險趨勢預測（基於統計分析）
const riskTrendForecast = computed(() => {
  // 使用真實的統計分析預測數據
  const forecastData = riskForecastQuery.data.value || []

  if (forecastData.length === 0) {
    // 預設回退邏輯
    return [
      {
        timeframe: '載入中',
        customerChurnRisk: '計算中',
        operationalRisk: '計算中',
        overallRisk: '計算中',
        confidence: '正在分析歷史數據',
        forecastMethod: undefined,
        expectedValues: undefined,
        forecastDate: null,
        daysRemaining: null,
        formattedDate: '計算中...',
        trendComparison: null,
        confidencePercent: 50,
        predictionRange: null,
      },
    ]
  }

  return forecastData.map((forecast, index) => {
    // 計算預測日期和剩餘天數
    const forecastDate = new Date(forecast.forecast_date)
    const today = new Date()
    const timeDiff = forecastDate.getTime() - today.getTime()
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))

    // 格式化日期顯示
    const formattedDate = forecastDate.toLocaleDateString('zh-TW', {
      month: 'long',
      day: 'numeric'
    })

    // 計算變化趨勢（與前一個預測比較）
    let trendComparison = null
    if (index > 0) {
      const prevForecast = forecastData[index - 1]
      const currentValue = forecast.expected_overall_risk_value
      const prevValue = prevForecast.expected_overall_risk_value

      if (currentValue !== null && prevValue !== null) {
        const change = currentValue - prevValue
        trendComparison = {
          change: change,
          direction: Math.abs(change) < 0.1 ? 'stable' : (change > 0 ? 'up' : 'down')
        }
      }
    }

    // 計算預測範圍（基於信心度）
    const confidenceMatch = forecast.confidence.match(/(\d+)%/)
    const confidencePercent = confidenceMatch ? parseInt(confidenceMatch[1]) : 50
    let errorMargin = 0

    if (forecast.expected_overall_risk_value !== null) {
      // 信心度越低，誤差範圍越大
      errorMargin = forecast.expected_overall_risk_value * (100 - confidencePercent) / 200
    }

    return {
      timeframe: forecast.timeframe,
      customerChurnRisk: forecast.customer_churn_risk,
      operationalRisk: forecast.operational_risk,
      overallRisk: forecast.overall_risk,
      confidence: forecast.confidence,
      forecastMethod: forecast.forecast_method,
      expectedValues: {
        customer: forecast.expected_customer_risk_value,
        operational: forecast.expected_operational_risk_value,
        overall: forecast.expected_overall_risk_value,
      },
      forecastDate,
      daysRemaining,
      formattedDate: daysRemaining > 0 ? `${formattedDate} (還有${daysRemaining}天)` : formattedDate,
      trendComparison,
      confidencePercent,
      predictionRange: forecast.expected_overall_risk_value !== null ? {
        min: Math.max(0, forecast.expected_overall_risk_value - errorMargin),
        max: forecast.expected_overall_risk_value + errorMargin,
        margin: errorMargin
      } : null
    }
  })
})

// === 圖表數據處理 ===

// 1. 風險等級分佈圓餅圖數據
const riskLevelDistributionData = computed(() => {
  const stats = riskLevelStats.value

  // 如果沒有風險，返回空陣列顯示 ChartEmpty
  if (stats.total === 0) {
    return []
  }

  const total = stats.total

  return [
    {
      name: '嚴重風險',
      value: stats.critical,
      percentage: (stats.critical / total) * 100,
      color: '#ef4444', // destructive red
    },
    {
      name: '中度風險',
      value: stats.medium,
      percentage: (stats.medium / total) * 100,
      color: '#f59e0b', // warning orange
    },
    {
      name: '低度風險',
      value: stats.low,
      percentage: (stats.low / total) * 100,
      color: '#3b82f6', // info blue
    },
  ].filter((item) => item.value > 0)
})

// 2. 風險趨勢線圖數據（使用真實的歷史趨勢數據）
const riskTrendData = computed(() => {
  // 使用 useRiskTrendsDaily 查詢的真實數據
  const trendsData = riskTrendsQuery.data.value || []

  // 空數據時返回空陣列
  if (trendsData.length === 0) {
    return []
  }

  // 檢查是否有任何真實的風險數據（排除資料庫視圖的硬編碼預設值）
  // risk_trends_daily 視圖在無資料時會返回 support_risk=5.0 的預設值
  const hasRealData = trendsData.some(
    (trend) =>
      (trend.customer_risk && trend.customer_risk > 0) ||
      (trend.operational_risk && trend.operational_risk > 0) ||
      (trend.at_risk_customers && trend.at_risk_customers > 0) ||
      (trend.total_orders && trend.total_orders > 0),
  )

  // 如果只有預設值沒有真實業務資料，返回空陣列顯示 ChartEmpty
  if (!hasRealData) {
    return []
  }

  // 轉換數據格式以符合圖表需求
  return trendsData.map((trend) => ({
    week: trend.date,
    customerRisk: trend.customer_risk || 0,
    operationalRisk: trend.operational_risk || 0,
    supportRisk: trend.support_risk || 0,
    overallRisk: trend.overall_risk || 0,
  }))
})

// 3. 風險類別對比柱狀圖數據
const riskCategoryComparisonData = computed(() => {
  const customerRisk = customerRiskAnalysis.value
  const operationalRisk = operationalRiskAnalysis.value

  // 檢查是否有任何實際風險資料（排除閾值，只看實際數值）
  const hasData =
    customerRisk.totalCustomers > 0 ||
    parseFloat(operationalRisk.orderRisk.pendingRate) > 0 ||
    parseFloat(operationalRisk.supportRisk.waitingRate) > 0 ||
    parseFloat(operationalRisk.orderRisk.cancelRate) > 0

  // 如果沒有任何資料，返回空陣列顯示 ChartEmpty
  if (!hasData) {
    return []
  }

  return [
    {
      category: '客戶流失',
      current: customerRisk.churnRisk || 0,
      threshold: Math.ceil(customerRisk.totalCustomers * RISK_THRESHOLDS.CUSTOMER_CHURN_RATE) || 10,
      severity:
        customerRisk.churnRisk === 0
          ? 'low'
          : customerRisk.churnRisk > customerRisk.totalCustomers * 0.15
            ? 'high'
            : customerRisk.churnRisk > customerRisk.totalCustomers * 0.1
              ? 'medium'
              : 'low',
    },
    {
      category: '訂單處理',
      current: parseFloat(operationalRisk.orderRisk.pendingRate) || 0,
      threshold: RISK_THRESHOLDS.ORDER_PENDING_RATE,
      severity:
        parseFloat(operationalRisk.orderRisk.pendingRate) === 0
          ? 'low'
          : parseFloat(operationalRisk.orderRisk.pendingRate) > 20
            ? 'high'
            : parseFloat(operationalRisk.orderRisk.pendingRate) > 10
              ? 'medium'
              : 'low',
    },
    {
      category: '客服負載',
      current: parseFloat(operationalRisk.supportRisk.waitingRate) || 0,
      threshold: RISK_THRESHOLDS.SUPPORT_WAITING_RATE,
      severity:
        parseFloat(operationalRisk.supportRisk.waitingRate) === 0
          ? 'low'
          : parseFloat(operationalRisk.supportRisk.waitingRate) > 30
            ? 'high'
            : parseFloat(operationalRisk.supportRisk.waitingRate) > 15
              ? 'medium'
              : 'low',
    },
    {
      category: '取消率',
      current: parseFloat(operationalRisk.orderRisk.cancelRate) || 0,
      threshold: RISK_THRESHOLDS.ORDER_CANCEL_RATE,
      severity:
        parseFloat(operationalRisk.orderRisk.cancelRate) === 0
          ? 'low'
          : parseFloat(operationalRisk.orderRisk.cancelRate) > 8
            ? 'high'
            : parseFloat(operationalRisk.orderRisk.cancelRate) > 5
              ? 'medium'
              : 'low',
    },
  ]
})

// 圖表狀態管理（使用有數據的查詢作為載入狀態依賴）
const riskLevelChartState = useChartStateWithComponent(
  customerMetricsQuery as any, // 使用有數據的查詢
  RiskLevelChart,
  {
    emptyMessage: '暫無風險等級數據',
    errorMessage: '載入風險等級失敗',
    chartProps: computed(() => ({
      data: riskLevelDistributionData.value,
      // title: '風險等級分佈',
      // legendInHeader: false,
    })),
  },
)

const riskTrendChartState = useChartStateWithComponent(
  customerMetricsQuery as any, // 使用有數據的查詢
  RiskTrendChart,
  {
    emptyMessage: '暫無風險趨勢數據',
    errorMessage: '載入風險趨勢失敗',
    chartProps: computed(() => ({
      data: riskTrendData.value,
      // title: '風險趨勢分析',
      // legendInHeader: false,
    })),
  },
)

const riskComparisonChartState = useChartStateWithComponent(
  orderStatusQuery, // 保持不變，這個已經有數據
  RiskComparisonChart,
  {
    emptyMessage: '暫無風險對比數據',
    errorMessage: '載入風險對比失敗',
    chartProps: computed(() => ({
      data: riskCategoryComparisonData.value,
      // title: '風險類別對比',
      // legendInHeader: false,
    })),
  },
)
</script>

<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <DashboardHeader title="風險預警中心" description="實時風險監控、預警機制和應急響應系統" :last-updated="dashboardRefresh.lastUpdated.value"
      :is-refreshing="dashboardRefresh.isRefreshing.value || riskAlertsQuery.isLoading.value"
      :on-refresh="handleRefresh" />

    <!-- 風險等級總覽 -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
      <OverviewCard title="嚴重風險" :value="riskLevelStats.critical === 0 ? '無' : `${riskLevelStats.critical}`"
        :footer="riskLevelStats.critical === 0 ? '系統運作正常' : '需要立即處理'"
        :class="riskLevelStats.critical === 0 ? 'border-success/30 bg-success/5' : ''">
        <template #icon>
          <CheckCircle v-if="riskLevelStats.critical === 0" class="h-4 w-4 text-success" />
          <Rocket v-else class="h-4 w-4" />
        </template>
        <template #title-tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div class="flex items-center space-x-1 cursor-help">
                <svg class="h-3 w-3 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <StructuredTooltipContent :data="dashboardTooltips.criticalRisk" />
            </TooltipContent>
          </Tooltip>
        </template>
      </OverviewCard>

      <OverviewCard title="中度風險" :value="riskLevelStats.medium === 0 ? '無' : `${riskLevelStats.medium}`"
        :footer="riskLevelStats.medium === 0 ? '狀態良好' : '需要關注'"
        :class="riskLevelStats.medium === 0 ? 'border-success/30 bg-success/5' : ''">
        <template #icon>
          <CheckCircle v-if="riskLevelStats.medium === 0" class="h-4 w-4 text-success" />
          <BarChart3 v-else class="h-4 w-4" />
        </template>
        <template #title-tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div class="flex items-center space-x-1 cursor-help">
                <svg class="h-3 w-3 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <StructuredTooltipContent :data="dashboardTooltips.moderateRisk" />
            </TooltipContent>
          </Tooltip>
        </template>
      </OverviewCard>

      <OverviewCard title="低度風險" :value="riskLevelStats.low === 0 ? '無' : `${riskLevelStats.low}`"
        :footer="riskLevelStats.low === 0 ? '監控正常' : '持續監控'"
        :class="riskLevelStats.low === 0 ? 'border-success/30 bg-success/5' : ''">
        <template #icon>
          <CheckCircle v-if="riskLevelStats.low === 0" class="h-4 w-4 text-success" />
          <Search v-else class="h-4 w-4" />
        </template>
        <template #title-tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div class="flex items-center space-x-1 cursor-help">
                <svg class="h-3 w-3 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <StructuredTooltipContent :data="dashboardTooltips.lowRisk" />
            </TooltipContent>
          </Tooltip>
        </template>
      </OverviewCard>

      <OverviewCard title="系統健康度" :value="riskLevelStats.total === 0 ? '優秀' : `${riskLevelStats.total} 項風險`"
        :footer="riskLevelStats.total === 0 ? '所有指標正常運作' : '需要關注處理'"
        :class="riskLevelStats.total === 0 ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'">
        <template #icon>
          <CheckCircle v-if="riskLevelStats.total === 0" class="h-4 w-4 text-success" />
          <Clock v-else class="h-4 w-4" />
        </template>
        <template #title-tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div class="flex items-center space-x-1 cursor-help">
                <svg class="h-3 w-3 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <StructuredTooltipContent :data="dashboardTooltips.systemHealthScore" />
            </TooltipContent>
          </Tooltip>
        </template>
      </OverviewCard>
    </div>

    <!-- 系統監控狀態資訊 -->
    <div v-if="riskLevelStats.total === 0" class="rounded-lg border border-success/30 bg-success/5 p-4">
      <div class="flex items-start gap-3">
        <CheckCircle class="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <h3 class="font-semibold text-success mb-2">系統運作正常</h3>
          <div class="text-sm text-muted-foreground space-y-1">
            <div class="flex items-center gap-2">
              <Search class="h-3 w-3" />
              <span><strong>監控範圍：</strong>客戶流失風險（>60天無購買）、訂單處理延遲（>24小時）</span>
            </div>
            <div class="flex items-center gap-2">
              <BarChart3 class="h-3 w-3" />
              <span><strong>當前狀態：</strong>所有監控指標均在健康範圍內</span>
            </div>
            <div class="flex items-center gap-2">
              <Clock class="h-3 w-3" />
              <span><strong>檢查頻率：</strong>每5分鐘自動更新風險狀態</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 基礎圖表區塊 -->
    <div class="grid auto-rows-[50px] grid-cols-3 gap-6">
      <!-- 風險等級分佈圖 -->
      <div class="row-span-5">
        <ChartCard title="風險等級分佈">
          <component :is="riskLevelChartState.render" />
        </ChartCard>
      </div>

      <!-- 風險趨勢圖 -->
      <div class="row-span-5">
        <ChartCard title="風險趨勢分析">
          <component :is="riskTrendChartState.render" />
        </ChartCard>
      </div>

      <!-- 風險類別對比圖 -->
      <div class="row-span-5">
        <ChartCard title="風險類別對比">
          <component :is="riskComparisonChartState.render" />
        </ChartCard>
      </div>
    </div>

    <!-- 實時風險監控 -->
    <ChartCard title="實時風險監控">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div v-for="(risk, index) in realTimeRisks" :key="index" class="rounded-lg border p-4" :class="{
          'border-destructive/50 bg-destructive/10': risk.status === 'critical',
          'border-warning/50 bg-warning/10': risk.status === 'warning',
          'border-success/50 bg-success/10': risk.status === 'normal',
        }">
          <div class="mb-3 flex items-start justify-between">
            <h4 class="font-semibold text-foreground">{{ risk.category }}</h4>
            <div class="flex items-center gap-1">
              <div class="h-2 w-2 rounded-full" :class="{
                'bg-destructive': risk.status === 'critical',
                'bg-warning': risk.status === 'warning',
                'bg-success': risk.status === 'normal',
              }"></div>
              <span class="text-xs" :class="{
                'text-destructive': risk.trend === 'increasing',
                'text-success': risk.trend === 'decreasing',
                'text-muted-foreground': risk.trend === 'stable',
              }">
                {{
                  risk.trend === 'increasing'
                    ? '↗'
                    : risk.trend === 'decreasing'
                      ? '↘'
                      : '→'
                }}
              </span>
            </div>
          </div>

          <div class="mb-3 text-center">
            <div class="text-2xl font-bold" :class="{
              'text-destructive': risk.status === 'critical',
              'text-warning': risk.status === 'warning',
              'text-success': risk.status === 'normal',
            }">
              {{
                typeof risk.current === 'number'
                  ? formatDashboardValue(risk.current, 'rate')
                  : risk.current
              }}
            </div>
            <div class="text-xs text-muted-foreground">閾值: {{ risk.threshold }}</div>
          </div>

          <div class="text-center text-xs text-foreground">
            {{ risk.description }}
          </div>
        </div>
      </div>
    </ChartCard>

    <!-- 風險預警建議 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard title="風險應對行動">
        <div class="space-y-4">
          <div v-if="riskMitigationActions.length === 0" class="flex h-48 items-center justify-center">
            <div class="text-center">
              <CheckCircle class="w-12 h-12 mb-2 text-success mx-auto" />
              <div class="font-medium text-success">目前沒有緊急風險</div>
              <div class="mt-1 text-sm text-muted-foreground">系統運行正常</div>
            </div>
          </div>
          <div v-else class="space-y-4">
            <Alert v-for="(action, index) in riskMitigationActions" :key="index" :class="{
              'border-destructive/30': action.urgency === 'high',
              'border-warning/30': action.urgency === 'medium',
              'border-primary/30': action.urgency === 'low',
            }">
              <Rocket class="h-4 w-4" />
              <AlertTitle>{{ action.risk }}</AlertTitle>
              <AlertDescription class="mt-2">
                <Badge class="rounded-full" :class="{
                  'bg-destructive/20 text-destructive': action.urgency === 'high',
                  'bg-warning/20 text-warning':
                    action.urgency === 'medium',
                  'bg-primary/20 text-primary': action.urgency === 'low',
                }">
                  <span class="text-xs text0 font-normal">
                    {{
                      action.urgency === 'high'
                        ? '緊急'
                        : action.urgency === 'medium'
                          ? '重要'
                          : '一般'
                    }}
                  </span>
                </Badge>
                <div>行動計劃: {{ action.action }}</div>
                <div>
                  <span>執行步驟:</span>
                  <ul class="mt-1 ml-4 list-inside list-disc space-y-1">
                    <li v-for="(step, stepIndex) in action.steps" :key="stepIndex" class="text-foreground">
                      {{ step }}
                    </li>
                  </ul>
                </div>
                <div class="flex items-center justify-between gap-8 mt-2">
                  <span class="ml-2 text-xs text-muted-foreground">
                    時程: {{ action.timeline }}
                  </span>
                  <span class="ml-2 text-xs text-muted-foreground">
                    負責人: {{ action.owner }}
                  </span>
                </div>
                <div class="rounded bg-success/10 p-2 mt-4">
                  <span class="ml-1 text-sm text-success">預期成果: {{ action.expectedOutcome }}</span>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="風險趨勢預測">
        <div class="space-y-4">
          <div v-for="(forecast, index) in riskTrendForecast" :key="index" class="rounded-lg border bg-muted/10 p-4">
            <!-- 預測時間範圍和日期 -->
            <div class="flex justify-between items-start mb-3">
              <h4 class="font-semibold text-foreground">
                {{ forecast.timeframe }}
              </h4>
              <div class="text-right">
                <div class="text-sm text-muted-foreground">{{ forecast.formattedDate }}</div>
                <TrendArrow v-if="forecast.trendComparison && forecast.expectedValues?.overall"
                  :trend="forecast.trendComparison.direction" :value="forecast.expectedValues?.overall"
                  :previousValue="forecast.expectedValues?.overall - forecast.trendComparison.change" size="sm" />
              </div>
            </div>

            <!-- 風險等級展示 -->
            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">客戶風險:</span>
                <div class="flex items-center gap-2">
                  <!-- <span class="text-sm font-medium">
                    {{
                      forecast.customerChurnRisk === 'high'
                        ? '高'
                        : forecast.customerChurnRisk === 'moderate'
                          ? '中'
                          : forecast.customerChurnRisk === '需要更多數據'
                            ? '需要更多數據'
                            : '低'
                    }}
                  </span> -->
                  <RiskLevelIndicator v-if="forecast.customerChurnRisk !== '需要更多數據'" :level="forecast.customerChurnRisk"
                    :show-icon="false" size="sm" />
                  <span
                    v-if="forecast.expectedValues?.customer !== null && forecast.expectedValues?.customer !== undefined"
                    class="text-xs text-muted-foreground">
                    ({{ formatDashboardValue(forecast.expectedValues.customer, 'score') }})
                  </span>
                </div>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">營運風險:</span>
                <div class="flex items-center gap-2">
                  <!-- <span class="text-sm font-medium">
                    {{
                      forecast.operationalRisk === 'high'
                        ? '高'
                        : forecast.operationalRisk === 'moderate'
                          ? '中'
                          : forecast.operationalRisk === '需要更多數據'
                            ? '需要更多數據'
                            : '低'
                    }}
                  </span> -->
                  <RiskLevelIndicator v-if="forecast.operationalRisk !== '需要更多數據'" :level="forecast.operationalRisk"
                    :show-icon="false" size="sm" />
                  <span
                    v-if="forecast.expectedValues?.operational !== null && forecast.expectedValues?.operational !== undefined"
                    class="text-xs text-muted-foreground">
                    ({{ formatDashboardValue(forecast.expectedValues.operational, 'score') }})
                  </span>
                </div>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">整體風險:</span>
                <div class="flex items-center gap-2">
                  <!-- <span class="text-sm font-medium">
                    {{
                      forecast.overallRisk === 'high'
                        ? '高'
                        : forecast.overallRisk === 'moderate'
                          ? '中'
                          : forecast.overallRisk === '需要更多數據'
                            ? '需要更多數據'
                            : '低'
                    }}
                  </span> -->
                  <RiskLevelIndicator v-if="forecast.overallRisk !== '需要更多數據'" :level="forecast.overallRisk"
                    :show-icon="false" size="sm" />
                  <span
                    v-if="forecast.expectedValues?.overall !== null && forecast.expectedValues?.overall !== undefined"
                    class="text-xs text-muted-foreground">
                    ({{ formatDashboardValue(forecast.expectedValues.overall, 'score') }})
                  </span>
                </div>
              </div>

              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">信心度:</span>
                <div class="flex-1 ml-2">
                  <ConfidenceProgressBar :confidence="forecast.confidence" :show-percentage="false" size="sm" />
                </div>
              </div>
            </div>

            <!-- 預測範圍顯示 -->
            <div v-if="forecast.predictionRange" class="mb-3">
              <div class="text-xs text-muted-foreground mb-1">預測範圍:</div>
              <div class="text-sm text-foreground">
                {{ formatDashboardValue(forecast.predictionRange.min, 'score') }} - {{ formatDashboardValue(forecast.predictionRange.max, 'score') }}
                <span class="text-xs text-gray-500">(±{{ formatDashboardValue(forecast.predictionRange.margin, 'score') }})</span>
              </div>
            </div>

            <!-- 顯示預測方法和詳細資訊 -->
            <div v-if="forecast.forecastMethod" class="pt-3 border-t border-border">
              <div class="flex justify-between items-center text-xs">
                <span class="text-muted-foreground">
                  預測方法: {{ forecast.forecastMethod }}
                </span>
                <span class="text-primary font-medium">
                  {{ forecast.confidence }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  </div>
</template>
