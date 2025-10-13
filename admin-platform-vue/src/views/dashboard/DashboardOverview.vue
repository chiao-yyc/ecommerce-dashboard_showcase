<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'DashboardOverview')

import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import { useDashboardRefresh } from '@/composables/useDashboardRefresh'
import ChartCard from '@/components/charts/ChartCard.vue'
import ChartSkeleton from '@/components/charts/ChartSkeleton.vue'
import ChartError from '@/components/charts/ChartError.vue'
import ChartEmpty from '@/components/charts/ChartEmpty.vue'
// 懶加載複雜圖表組件以提升首屏載入效能
import { defineAsyncComponent, h } from 'vue'
const MultiDimensionRevenueTrendChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/MultiDimensionRevenueTrendChart.vue')
)
const CustomerValueScatterChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/CustomerValueScatterChart.vue')
)
const BusinessHealthDashboard = defineAsyncComponent(() =>
  import('@/components/dashboard/BusinessHealthDashboard.vue')
)
import {
  useCompleteDashboardData,
  useDashboardState,
  useDashboardQueries,
} from '@/composables/queries/useDashboardQueries'
import { computed, ref } from 'vue'
import OverviewCard from '@/components/cards/OverviewCard.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UniversalLoadingState } from '@/components/common/loading'
import AnalyticsErrorState from '@/components/analytics/AnalyticsErrorState.vue'
import { FileX } from 'lucide-vue-next'
import { useChartStateWithComponent } from '@/composables/useChartState'
import { StatusBadge } from '@/components/ui/status-badge'
import { getAlertStatusProps } from '@/utils/status-helpers'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import StructuredTooltipContent from '@/components/ui/StructuredTooltipContent.vue'
import { useDashboardTooltips } from '@/composables/useDashboardTooltips'
import { useBusinessFormatting } from '@/utils/businessFormatters'

// Dashboard state management
const { computedFilters } = useDashboardState()
// updateFilters 未使用

// Dashboard tooltips
const { dashboardTooltips } = useDashboardTooltips()

// Business formatting
const { formatOverviewCardValue, formatDashboardValue } = useBusinessFormatting()

// Fetch all dashboard data using real API
const {
  data: dashboardData,
  isLoading: dashboardLoading,
  error: dashboardError,
  refreshAll: refreshDashboard,
  // overview, // 未使用
  topProducts: topProductsQuery, // 啟用：用於產品銷售排行的獨立狀態管理
  // systemAlerts: systemAlertsQuery, // 未使用
  conversionFunnel: conversionFunnelQuery, // 啟用：用於訂單履約漏斗的獨立狀態管理
  businessHealth: businessHealthQuery,
  // userBehaviorSummary: userBehaviorQuery,
} = useCompleteDashboardData(computedFilters)

// Dashboard refresh functionality
const dashboardRefresh = useDashboardRefresh('overview')

// Revenue trend chart state
const { useRevenueTrend, useCustomerValueDistribution } = useDashboardQueries()
const trendPeriod = ref<'daily' | 'weekly' | 'monthly'>('daily')
// 使用空 filters 讓動態範圍邏輯生效，而不被 computedFilters 的固定日期覆蓋
const revenueTrendQuery = useRevenueTrend(trendPeriod, {})

// Customer value distribution chart state
const customerValueQuery = useCustomerValueDistribution()

// Computed values for template
const totalRevenue = computed(() => {
  const revenue = dashboardData.value?.overview?.totalRevenue || 0
  return formatOverviewCardValue(revenue, 'revenue')
})

const totalOrders = computed(() => {
  return formatOverviewCardValue(dashboardData.value?.overview?.totalOrders || 0, 'orders')
})

const activeCustomers = computed(() => {
  return formatOverviewCardValue(dashboardData.value?.overview?.activeCustomers || 0, 'customers')
})

const customerSatisfaction = computed(() => {
  const satisfaction = dashboardData.value?.overview?.customerSatisfaction || 0
  return formatOverviewCardValue(satisfaction, 'satisfaction')
})

// Growth rates from API (will show real data once implemented)
const revenueGrowth = computed(
  () => dashboardData.value?.overview?.revenueGrowth || '+0.0%',
)
const orderGrowth = computed(
  () => dashboardData.value?.overview?.orderGrowth || '+0.0%',
)
const customerGrowth = computed(
  () => dashboardData.value?.overview?.customerGrowth || '+0.0%',
)
const satisfactionChange = computed(
  () => dashboardData.value?.overview?.satisfactionChange || '+0.0',
)

// Additional computed metrics
const targetAchievement = computed(() => {
  return formatDashboardValue(dashboardData.value?.overview?.targetAchievement || 0, 'percentage')
})

const conversionRate = computed(() => {
  return formatDashboardValue(dashboardData.value?.overview?.conversionRate || 0, 'rate')
})

const customerRetention = computed(() => {
  return formatDashboardValue(dashboardData.value?.overview?.customerRetention || 0, 'percentage')
})

const avgResponseTime = computed(() => {
  return dashboardData.value?.overview?.avgResponseTime || '載入中'
})

// 用戶行為轉換數據 from API
const userConversionRate = computed(() => {
  return formatDashboardValue(dashboardData.value.userBehaviorSummary?.conversion_rate || 0, 'rate')
})

const totalUserEvents = computed(() => {
  return formatDashboardValue(dashboardData.value.userBehaviorSummary?.total_events || 0, 'count')
})

const behaviorGrowth = computed(() => {
  return dashboardData.value.userBehaviorSummary?.growth_rate || '+0.0%'
})

// const totalUsers = computed(() => {
//   return dashboardData.value.userBehaviorSummary?.total_users?.toLocaleString() || '0'
// })

// Business health metrics from API
const healthMetrics = computed(() => {
  if (!dashboardData.value?.businessHealth) {
    return null
  }

  const metrics = dashboardData.value.businessHealth

  // Check if any meaningful data exists (excluding default fulfillment: 10)
  const hasValidData =
    metrics.revenue > 0 ||
    metrics.satisfaction > 0 ||
    (metrics.fulfillment > 0 && metrics.fulfillment !== 10) ||
    metrics.support > 0 ||
    metrics.products > 0 ||
    metrics.marketing > 0 ||
    metrics.system > 0

  return hasValidData ? metrics : null
})

// Top products from independent query with formatted sales
const topProducts = computed(() => {
  const data = topProductsQuery.data.value || []
  return data.map((product) => ({
    ...product,
    salesFormatted: formatDashboardValue(product.sales, 'currency'),
  }))
})

// Top products list state management
const isTopProductsEmpty = computed(() =>
  topProductsQuery.isSuccess.value && topProducts.value.length === 0
)

// System alerts from API
const systemAlerts = computed(() => {
  return dashboardData.value?.systemAlerts || []
})

// Conversion funnel data from API
const conversionData = computed(() => {
  return dashboardData.value?.conversionFunnel || []
})

// Conversion funnel empty state check
const isConversionFunnelEmpty = computed(() => {
  if (!conversionFunnelQuery.isSuccess.value) return false

  // 檢查是否有資料結構
  if (!conversionData.value || conversionData.value.length === 0) {
    return true
  }

  // 檢查所有階段的訂單總數是否為 0
  const totalOrders = conversionData.value.reduce((sum, stage) => sum + (stage.count || 0), 0)
  return totalOrders === 0
})

// 即時監控數據 from API
const systemUptime = computed(() => {
  return dashboardData.value?.overview?.systemUptime || '載入中'
})

const avgLoadTime = computed(() => {
  return dashboardData.value?.overview?.avgLoadTime || '載入中'
})

const onlineUsers = computed(() => {
  return dashboardData.value?.overview?.onlineUsers?.toLocaleString() || '0'
})

const pendingOrders = computed(() => {
  return dashboardData.value?.overview?.pendingOrders?.toLocaleString() || '0'
})

// 營收效率數據 from API (取代 ROI)
const revenueEfficiency = computed(() => {
  return dashboardData.value?.overview?.revenueEfficiency || '載入中'
})

// Refresh function that calls real API
const handleRefresh = async () => {
  // 清除所有快取確保重新查詢
  log.debug('清除所有 Vue Query 快取...')

  dashboardRefresh.refresh()
  await refreshDashboard()
  await revenueTrendQuery.refetch()
  await customerValueQuery.refetch()
}

// Handle revenue trend period change
const handleTrendPeriodChange = (period: 'daily' | 'weekly' | 'monthly') => {
  log.debug('切換期間檢視:', period)
  trendPeriod.value = period
  // 強制重新查詢以確保使用新的動態範圍
  setTimeout(() => {
    revenueTrendQuery.refetch()
  }, 100)
}

// === 使用 useChartStateWithComponent 管理圖表狀態 ===

// 1. 多維度營收趨勢圖表
const revenueTrendChart = useChartStateWithComponent(
  revenueTrendQuery,
  MultiDimensionRevenueTrendChart,
  {
    emptyMessage: '暫無營收趨勢數據',
    errorMessage: '載入營收趨勢失敗',
    chartProps: computed(() => ({
      data: revenueTrendQuery.data.value || [],
      period: trendPeriod.value,
      loading: revenueTrendQuery.isPending.value,
      width: 800,
      height: 300,
      showExportButton: true,
      onPeriodChange: handleTrendPeriodChange,
    })),
  },
)

// 2. 客戶價值分佈圖表
const customerValueChart = useChartStateWithComponent(
  customerValueQuery,
  CustomerValueScatterChart,
  {
    emptyMessage: '暫無客戶價值分佈數據',
    errorMessage: '載入客戶價值分佈失敗',
    chartProps: computed(() => ({
      data: customerValueQuery.data.value || [],
      loading: customerValueQuery.isPending.value,
      width: 600,
      height: 280,
      showExportButton: true,
    })),
  },
)

// 3. 業務健康度儀表板
// 手動建立 isEmpty 邏輯，因為 healthMetrics 是物件而非陣列
const isBusinessHealthEmpty = computed(() => {
  if (!businessHealthQuery.isSuccess.value) return false
  return healthMetrics.value === null
})

const businessHealthChart = {
  render: () => {
    if (businessHealthQuery.isLoading.value) return h(ChartSkeleton)
    if (businessHealthQuery.isError.value) {
      return h(ChartError, {
        errorMessage: '載入業務健康度失敗',
        onRetry: () => businessHealthQuery.refetch(),
      })
    }
    if (isBusinessHealthEmpty.value) {
      return h(ChartEmpty, { message: '暫無業務健康度數據' })
    }
    return h(BusinessHealthDashboard, {
      data: healthMetrics.value!,  // Non-null assertion: healthMetrics is not null here
      loading: dashboardLoading.value,
      chartWidth: 300,
      chartHeight: 180,
      showExportButton: true,
    })
  },
}

</script>

<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <DashboardHeader data-testid="dashboard-header" title="營運總覽儀表板" description="跨模組業務洞察、核心 KPI 監控和即時營運狀況"
      :last-updated="dashboardRefresh.lastUpdated.value"
      :is-refreshing="dashboardRefresh.isRefreshing.value || dashboardLoading" :on-refresh="handleRefresh" />

    <!-- Loading State -->
    <UniversalLoadingState v-if="dashboardLoading && !dashboardData.overview" type="spinner" message="載入儀表板數據" size="lg"
      :showCard="false" class="py-12" />

    <!-- Error State -->
    <AnalyticsErrorState v-else-if="dashboardError" :error="dashboardError" type="data" :show-card="false"
      retry-text="重新載入" :suggestions="['檢查網路連線', '重新整理頁面', '聯絡技術支援']" @retry="handleRefresh" />

    <!-- Dashboard Content -->
    <div class="grid auto-rows-[50px] grid-cols-12 gap-4">
      <!-- 核心 KPI 區域 (頂部 5 個卡片) -->
      <OverviewCard class="col-span-6 row-span-3" title="總營收" :value="totalRevenue" :subValue="`${revenueGrowth} vs 上月`"
        subValueClass="text-success" :footer="`目標達成率: ${targetAchievement}`" />

      <OverviewCard class="col-span-6 row-span-3" title="訂單量" :value="totalOrders" :subValue="`${orderGrowth} vs 上月`"
        subValueClass="text-success" :footer="`轉換率: ${conversionRate}`" />

      <OverviewCard class="col-span-4 row-span-3" title="活躍客戶" :value="activeCustomers"
        :subValue="`${customerGrowth} vs 上月`" subValueClass="text-success" :footer="`留存率: ${customerRetention}`">
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
              <StructuredTooltipContent :data="dashboardTooltips.activeCustomers" />
            </TooltipContent>
          </Tooltip>
        </template>
      </OverviewCard>

      <OverviewCard class="col-span-4 row-span-3" title="客服滿意度" :value="customerSatisfaction"
        :subValue="`${satisfactionChange} vs 上月`" subValueClass="text-success" :footer="`平均回應: ${avgResponseTime}`" />

      <OverviewCard class="col-span-4 row-span-3" title="用戶轉換率" :value="userConversionRate"
        :subValue="`${behaviorGrowth} vs 上月`" subValueClass="text-success" :footer="`總事件數: ${totalUserEvents}`">
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
              <StructuredTooltipContent :data="dashboardTooltips.conversionRate" />
            </TooltipContent>
          </Tooltip>
        </template>
      </OverviewCard>

      <!-- 營運概覽區域 (左側大圖) -->
      <div class="col-span-8 row-span-6">
        <ChartCard title="多維度營收趨勢">
          <component :is="revenueTrendChart.render" />
        </ChartCard>
      </div>

      <!-- 業務健康度 (右上) -->
      <div class="col-span-4 row-span-6">
        <ChartCard title="業務健康度">
          <component :is="businessHealthChart.render" />
        </ChartCard>
      </div>

      <!-- 客戶價值分佈 -->
      <div class="col-span-8 row-span-6">
        <ChartCard title="客戶價值分佈">
          <component :is="customerValueChart.render" />
        </ChartCard>
      </div>

      <!-- 產品銷售排行 -->
      <div class="col-span-4 row-span-6">
        <ChartCard title="產品銷售排行">
          <!-- Loading 狀態 -->
          <div v-if="topProductsQuery.isLoading.value" class="flex h-full items-center justify-center">
            <ChartSkeleton />
          </div>

          <!-- Error 狀態 -->
          <div v-else-if="topProductsQuery.isError.value" class="flex h-full items-center justify-center">
            <ChartError
              errorMessage="載入產品銷售排行失敗"
              :onRetry="() => topProductsQuery.refetch()"
            />
          </div>

          <!-- 空狀態 -->
          <div v-else-if="isTopProductsEmpty"
            class="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div class="text-center">
              <div class="bg-muted rounded-full p-3 mx-auto mb-3 inline-block">
                <FileX class="text-muted-foreground h-8 w-8" />
              </div>
              <h3 class="text-foreground text-lg font-medium">No Data Available</h3>
              <p class="text-muted-foreground text-sm mt-2">暫無產品銷售數據</p>
            </div>
          </div>

          <!-- 產品列表 (Success 狀態) -->
          <ScrollArea v-else data-testid="scroll-area" class="pr-4 h-full w-full">
            <div class="space-y-3">
              <div v-for="(product, _index) in topProducts.slice(0, 5)" :key="product.id"
                class="flex items-center justify-between border-b border-border py-2 last:border-0">
                <div class="flex items-center space-x-3">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-medium text-primary-foreground">
                    {{ product.rank }}
                  </div>
                  <span class="text-sm font-medium">{{ product.name }}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold">
                    {{ product.salesFormatted }}
                  </div>
                  <div class="text-xs text-success">{{ product.growth }}</div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </ChartCard>
      </div>

      <!-- 營收效率監控 -->
      <div class="col-span-4 row-span-4">
        <ChartCard title="營收效率監控">
          <div class="flex h-full w-full flex-col justify-center">
            <div class="space-y-2 text-center">
              <div class="text-3xl font-bold text-success">
                {{ revenueEfficiency }}
              </div>
              <div class="text-sm text-muted-foreground">營收效率</div>
              <div class="mt-4 flex items-center justify-center space-x-4 text-xs">
                <div class="text-center">
                  <div class="font-semibold text-foreground">
                    {{ targetAchievement }}
                  </div>
                  <div class="text-muted-foreground">目標達成</div>
                </div>
                <div class="text-center">
                  <div class="font-semibold text-foreground">
                    {{ conversionRate }}
                  </div>
                  <div class="text-muted-foreground">
                    平均轉換率
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <!-- 系統警報面板 (優化版) -->
      <div class="col-span-4 row-span-4">
        <ChartCard title="系統警報">
          <!-- 空狀態 -->
          <div v-if="systemAlerts.length === 0"
            class="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div class="text-center">
              <div class="mb-2 text-2xl">🚨</div>
              <div>暫無系統警報</div>
            </div>
          </div>

          <!-- 有警報時顯示列表 -->
          <div v-else class="flex h-full flex-col">
            <!-- 警報列表區域 -->
            <ScrollArea class="pr-2 h-full w-full overflow-y-auto">
              <div class="space-y-1.5">
                <div v-for="alert in systemAlerts" :key="alert.id"
                  class="flex items-start space-x-3 rounded-md border bg-card p-3 text-sm transition-colors">

                  <!-- 使用 StatusBadge 顯示警報狀態 -->
                  <StatusBadge v-bind="getAlertStatusProps(alert.priority)" size="sm" class="mt-0.5">
                    {{ alert.type }}
                  </StatusBadge>

                  <!-- 警報內容 -->
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-foreground leading-tight">
                      {{ alert.message }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{
                        new Date(alert.timestamp).toLocaleTimeString('zh-TW', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <!-- 系統狀態摘要 -->
            <div v-if="systemAlerts.length > 0"
              class="mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
              <div class="flex items-center space-x-3">
                <div class="flex items-center space-x-1">
                  <div class="h-2 w-2 rounded-full bg-destructive"></div>
                  <span>{{
                    systemAlerts.filter((a) => a.type === 'error').length
                    }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="h-2 w-2 rounded-full bg-warning"></div>
                  <span>{{
                    systemAlerts.filter((a) => a.type === 'warning').length
                    }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="h-2 w-2 rounded-full bg-primary"></div>
                  <span>{{
                    systemAlerts.filter((a) => a.type === 'info').length
                    }}</span>
                </div>
                <div class="flex items-center space-x-1">
                  <div class="h-2 w-2 rounded-full bg-success"></div>
                  <span>{{
                    systemAlerts.filter((a) => a.type === 'success').length
                    }}</span>
                </div>
              </div>
              <div class="text-muted-foreground">
                {{
                  systemAlerts.length > 8
                    ? `${systemAlerts.length - 8}+ 更多`
                    : `共 ${systemAlerts.length} 項`
                }}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      <!-- 即時監控 -->
      <div class="col-span-4 row-span-4">
        <ChartCard title="即時監控">
          <div class="grid h-full grid-cols-2 place-content-around gap-2 text-center">
            <div class="rounded bg-muted">
              <div class="text-lg font-bold text-foreground">
                {{ systemUptime }}
              </div>
              <div class="text-xs text-muted-foreground">系統可用性</div>
            </div>
            <div class="rounded bg-muted">
              <div class="text-lg font-bold text-foreground">
                {{ avgLoadTime }}
              </div>
              <div class="text-xs text-muted-foreground">平均載入時間</div>
            </div>
            <div class="rounded bg-muted">
              <div class="text-lg font-bold text-foreground">
                {{ onlineUsers }}
              </div>
              <div class="text-xs text-muted-foreground">線上用戶</div>
            </div>
            <div class="rounded bg-muted">
              <div class="text-lg font-bold text-foreground">
                {{ pendingOrders }}
              </div>
              <div class="text-xs text-muted-foreground">待處理訂單</div>
            </div>
          </div>
        </ChartCard>
      </div>

      <!-- 訂單履約漏斗 (底部) -->
      <div class="col-span-12 row-span-4">
        <ChartCard title="訂單履約漏斗">
          <!-- Loading 狀態 -->
          <div v-if="conversionFunnelQuery.isLoading.value" class="flex h-full items-center justify-center">
            <ChartSkeleton />
          </div>

          <!-- Error 狀態 -->
          <div v-else-if="conversionFunnelQuery.isError.value" class="flex h-full items-center justify-center">
            <ChartError
              errorMessage="載入訂單履約漏斗失敗"
              :onRetry="() => conversionFunnelQuery.refetch()"
            />
          </div>

          <!-- 空狀態 -->
          <div v-else-if="isConversionFunnelEmpty"
            class="flex h-full items-center justify-center text-sm text-muted-foreground">
            <div class="text-center">
              <div class="bg-muted rounded-full p-3 mx-auto mb-3 inline-block">
                <FileX class="text-muted-foreground h-8 w-8" />
              </div>
              <h3 class="text-foreground text-lg font-medium">No Data Available</h3>
              <p class="text-muted-foreground text-sm mt-2">暫無訂單數據</p>
            </div>
          </div>

          <!-- 轉換漏斗數據 (Success 狀態) -->
          <div v-else>
            <div class="flex items-center justify-between space-x-4">
              <div v-for="(stage, index) in conversionData" :key="stage.stage" class="flex-1 text-center">
                <div class="relative">
                  <div
                    class="mb-2 flex h-16 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    :style="{ opacity: stage.percentage / 100 }">
                    <div class="text-sm font-semibold">
                      {{ stage.count.toLocaleString() }}
                    </div>
                  </div>
                  <div class="text-xs font-medium text-foreground">
                    {{ stage.label }}
                  </div>
                  <div class="text-xs text-muted-foreground">{{ stage.percentage }}%</div>
                  <div v-if="index < conversionData.length - 1"
                    class="absolute top-8 -right-2 translate-x-1/2 transform text-muted-foreground">
                    →
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-8 text-center text-sm text-muted-foreground">
              整體轉換率: {{ conversionRate }}% | 本月轉換改善:
              {{ revenueGrowth }}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  </div>
</template>
