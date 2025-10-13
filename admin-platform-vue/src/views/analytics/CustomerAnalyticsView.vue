<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'CustomerAnalytics')

import { ref, onMounted, computed, watch } from 'vue'
import { today, getLocalTimeZone } from '@internationalized/date'
import { toDate } from 'reka-ui/date'
import type { DateRange } from 'reka-ui'
// ✅ 簡化為單一架構：只使用基礎客戶分析服務
import { useCustomerAnalyticsBasic } from '@/composables/analytics/useCustomerAnalyticsBasic'
import type { CustomerAnalyticsBasicParams } from '@/types/customerAnalytics'
import {
  DEFAULT_CUSTOMER_ANALYTICS_PARAMS,
  LIFECYCLE_STAGES,
} from '@/types/customerAnalytics'
import { getSegmentStatusProps, getAllSegmentValues, getSegmentLabelsMap } from '@/constants/rfm-segments'
import { DateRangePicker } from '@/components/ui/date-picker'
import AnalyticsRefreshButton from '@/components/analytics/AnalyticsRefreshButton.vue'
import AnalyticsLoadingState from '@/components/analytics/AnalyticsLoadingState.vue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import StructuredTooltipContent from '@/components/ui/StructuredTooltipContent.vue'
// Select components imported but may not be used in template
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Export functionality
import { useAnalyticsExport } from '@/composables/analytics/useAnalyticsExport'
import AnalyticsExportButton from '@/components/analytics/AnalyticsExportButton.vue'
import AnalyticsSettingsPanel from '@/components/analytics/AnalyticsSettingsPanel.vue'
import AnalyticsTabNavigation from '@/components/analytics/AnalyticsTabNavigation.vue'
import type { ExportFormat } from '@/utils/export'
import { useCustomerAnalyticsTooltips } from '@/composables/analytics/useCustomerAnalyticsTooltips'
import { useBusinessFormatting } from '@/utils/businessFormatters'

// ✅ 擴展日期範圍：改為90天（三個月）以確保包含足夠的歷史資料進行分析
const dateRange = ref<DateRange>({
  start: today(getLocalTimeZone()).subtract({ days: 89 }), // 最近90天
  end: today(getLocalTimeZone()),
})

// 追蹤選中的預設標籤
const selectedPresetLabel = ref<string | null>(null)

// 篩選條件常數和狀態 - 必須在 analysisParams 之前定義
const availableSegments = getAllSegmentValues()
const customerSegmentLabels = getSegmentLabelsMap()
const availableLifecycleStages = Object.keys(LIFECYCLE_STAGES)

// 篩選條件狀態
const selectedSegments = ref<string[]>([...availableSegments])
const selectedLifecycleStages = ref<string[]>([...availableLifecycleStages])
const includeChurnedCustomers = ref(false)

// 分析參數（轉換為字串格式）- 修正邏輯與 OrderAnalyticsView 保持一致
const analysisParams = computed<CustomerAnalyticsBasicParams>(() => ({
  startDate: dateRange.value?.start
    ? toDate(dateRange.value.start as any).toISOString().split('T')[0]
    : DEFAULT_CUSTOMER_ANALYTICS_PARAMS.startDate,
  endDate: dateRange.value?.end
    ? toDate(dateRange.value.end as any).toISOString().split('T')[0]
    : DEFAULT_CUSTOMER_ANALYTICS_PARAMS.endDate,
  // 修正邏輯：
  // - 如果全選 (長度等於總數) → undefined (不篩選，撈取所有)
  // - 如果部分選擇 → 傳入選中的項目
  // - 如果全空 → 空陣列 (明確表示不要任何分群的資料)
  customerSegments:
    selectedSegments.value.length === availableSegments.length
      ? undefined
      : selectedSegments.value,
  lifecycleStages:
    selectedLifecycleStages.value.length === availableLifecycleStages.length
      ? undefined
      : selectedLifecycleStages.value,
  includeChurnedCustomers: includeChurnedCustomers.value,
}))

// ✅ 簡化為單一架構：直接使用客戶基礎分析服務
const {
  isLoading,
  error,
  hasAnalyticsData,
  behaviorPatterns,
  behaviorInsights,
  highRiskCustomersStats,
  topGrowthPotentialCustomers,
  urgentActionCustomers,
  segmentPerformanceOverview,
  actionRecommendationsStats,
  analyticsSummary,
  churnRisks,
  valueGrowth,
  segmentComparison,
  segmentSummary,
  actionRecommendations,
  performCustomerAnalyticsBasic,
  // exportAnalyticsData, // 未使用
  formatCurrency,
  formatPercentage,
  // getRiskLevelColor, // 未使用
  // getSegmentColor, // 未使用
} = useCustomerAnalyticsBasic()

// Business formatting for template usage
const { formatDashboardValue } = useBusinessFormatting()

// ✅ 簡化後移除複雜的數據優先級邏輯，直接使用基礎分析服務的數據
// isLoading, error, hasAnalyticsData, 等都直接來自 useCustomerAnalyticsBasic()

// 新的匯出功能
const { exportCustomerAnalytics } = useAnalyticsExport()

// 客戶分析 tooltip 定義
const { tooltips: customerTooltips } = useCustomerAnalyticsTooltips()

// 響應式數據
const activeTab = ref('overview')
const isRefreshing = ref(false)

// 日期範圍狀態和篩選條件已在前面定義


// 客戶分群選擇狀態描述
const segmentSelectionStatus = computed(() => {
  const selectedCount = selectedSegments.value.length
  const totalCount = availableSegments.length

  if (selectedCount === 0) {
    return { type: 'warning', text: '未選擇任何分群 (將回傳空結果)' }
  } else if (selectedCount === totalCount) {
    return { type: 'info', text: '已選擇所有分群 (不篩選)' }
  } else {
    return {
      type: 'success',
      text: `已選擇 ${selectedCount}/${totalCount} 個分群`,
    }
  }
})

// 生命週期階段選擇狀態描述
const lifecycleSelectionStatus = computed(() => {
  const selectedCount = selectedLifecycleStages.value.length
  const totalCount = availableLifecycleStages.length

  if (selectedCount === 0) {
    return { type: 'warning', text: '未選擇任何階段 (將回傳空結果)' }
  } else if (selectedCount === totalCount) {
    return { type: 'info', text: '已選擇所有階段 (不篩選)' }
  } else {
    return {
      type: 'success',
      text: `已選擇 ${selectedCount}/${totalCount} 個階段`,
    }
  }
})

// 分析功能標籤
const analyticsTabs = [
  { id: 'overview', name: '總覽儀表板' },
  { id: 'behavior', name: '行為模式分析' },
  { id: 'churn', name: '流失風險分析' },
  { id: 'growth', name: '價值成長分析' },
  { id: 'segments', name: '分群對比分析' },
  { id: 'actions', name: '行動建議' },
]

// 手動觸發模式
function toggleSegment(segment: string, checked: string | boolean) {
  const isChecked = checked === true || checked === 'true'
  if (isChecked) {
    if (!selectedSegments.value.includes(segment)) {
      selectedSegments.value = [...selectedSegments.value, segment]
    }
  } else {
    selectedSegments.value = selectedSegments.value.filter((s) => s !== segment)
  }
}

function toggleAllSegments(checked: string | boolean) {
  const isChecked = checked === true || checked === 'true'
  if (isChecked) {
    selectedSegments.value = [...availableSegments]
  } else {
    selectedSegments.value = []
  }
}

function toggleLifecycleStage(stage: string, checked: string | boolean) {
  const isChecked = checked === true || checked === 'true'
  if (isChecked) {
    if (!selectedLifecycleStages.value.includes(stage)) {
      selectedLifecycleStages.value = [...selectedLifecycleStages.value, stage]
    }
  } else {
    selectedLifecycleStages.value = selectedLifecycleStages.value.filter(
      (s) => s !== stage,
    )
  }
}

function toggleAllLifecycleStages(checked: string | boolean) {
  const isChecked = checked === true || checked === 'true'
  if (isChecked) {
    selectedLifecycleStages.value = [...availableLifecycleStages]
  } else {
    selectedLifecycleStages.value = []
  }
}

// ✅ 簡化重新整理方法：恢復到單一架構模式
async function refreshAllAnalytics() {
  isRefreshing.value = true

  try {
    // 開始重新載入數據

    await performCustomerAnalyticsBasic(analysisParams.value)

    // 數據重新載入完成
  } catch (err) {
    log.error('❌ 客戶分析刷新失敗:', err)
  } finally {
    isRefreshing.value = false
  }
}

// 手動分析觸發函數 - 作為備用重新獲取選項
async function applyAnalysisParams() {
  // 手動觸發分析
  await refreshAllAnalytics()
}

// 輔助函數：將 Date 轉換為 ISO 字符串
function convertToISOString(date: Date): string {
  return date.toISOString()
}

async function exportAllData(format: ExportFormat = 'xlsx') {
  try {
    // 開始導出數據

    // 收集所有客戶分析數據（供未來使用）

    // 調試：檢查數據內容
    // 收集客戶分析數據

    // 創建一個包含實際數據的扁平化陣列用於匯出
    const exportableData = []

    // 添加行為模式數據
    if (behaviorPatterns.value && behaviorPatterns.value.length > 0) {
      behaviorPatterns.value.forEach(pattern => {
        exportableData.push({
          type: '行為模式',
          ...pattern
        })
      })
    }

    // 添加高風險客戶數據
    if (highRiskCustomersStats.value) {
      exportableData.push({
        type: '高風險客戶統計',
        criticalRisk: highRiskCustomersStats.value.criticalRisk,
        highRisk: highRiskCustomersStats.value.highRisk,
        totalAtRisk: highRiskCustomersStats.value.totalAtRisk,
        potentialLoss: highRiskCustomersStats.value.potentialLoss,
        avgRetentionProbability: highRiskCustomersStats.value.avgRetentionProbability
      })
    }

    // 添加流失風險數據
    if (churnRisks.value && churnRisks.value.length > 0) {
      churnRisks.value.forEach(risk => {
        exportableData.push({
          type: '流失風險',
          ...risk
        })
      })
    }

    // 添加價值成長數據
    if (valueGrowth.value && valueGrowth.value.length > 0) {
      valueGrowth.value.forEach(growth => {
        exportableData.push({
          type: '價值成長',
          ...growth
        })
      })
    }

    // 如果沒有具體的客戶數據，至少匯出摘要信息
    if (exportableData.length === 0 && analyticsSummary.value) {
      exportableData.push({
        type: '分析摘要',
        ...analyticsSummary.value,
        analysisDate: convertToISOString(new Date())
      })
    }

    // 準備匯出數據

    await exportCustomerAnalytics(exportableData, {
      segment: selectedSegments.value.join(','),
      riskLevel: 'all',
      format
    })

    // 導出完成
  } catch (err) {
    log.error('❌ 導出過程發生錯誤:', err)
    // TODO: 顯示錯誤提示給用戶
  }
}

// 風險等級狀態映射
function getRiskStatusProps(riskLevel: string) {
  switch (riskLevel) {
    case 'critical':
      return { status: 'error', showIndicator: true }
    case 'high':
      return { status: 'warning', showIndicator: true }
    case 'medium':
      return { status: 'warning', showIndicator: false }
    case 'low':
      return { status: 'success', showIndicator: false }
    default:
      return { status: 'neutral', showIndicator: false }
  }
}

// 優先級狀態映射
function getPriorityStatusProps(priority: string) {
  switch (priority) {
    case 'critical':
      return { status: 'error', showIndicator: true }
    case 'high':
      return { status: 'warning', showIndicator: true }
    case 'medium':
      return { status: 'info', showIndicator: false }
    case 'low':
      return { status: 'neutral', showIndicator: false }
    default:
      return { status: 'neutral', showIndicator: false }
  }
}

// ✅ 簡化生命週期：恢復到單一架構模式
// 監聽器 - 實現自動更新，當參數變化時自動重新載入數據
watch(analysisParams, async (newParams, oldParams) => {
  // 避免初次載入時重複執行
  if (oldParams && !isRefreshing.value) {
    // 參數變化，自動重新載入
    await performCustomerAnalyticsBasic(newParams)
  }
}, { deep: true })

onMounted(async () => {
  // CustomerAnalyticsView 初始化完成
  await refreshAllAnalytics()
})
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題和控制項 -->
    <div class="mb-8">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">客戶數據分析中心</h1>
          <p class="mt-1 text-sm text-muted-foreground">
            深度分析客戶行為模式，優化客戶價值與體驗
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <AnalyticsExportButton :has-data="hasAnalyticsData" :loading="isLoading" text="導出分析報告"
            @export="exportAllData" />
          <AnalyticsRefreshButton :loading="isRefreshing" @click="refreshAllAnalytics" />
        </div>
      </div>

      <!-- 分析參數設定 -->
      <AnalyticsSettingsPanel :loading="isRefreshing" @apply="applyAnalysisParams">
        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">分析期間</label>
          <DateRangePicker v-model="dateRange as any" placeholder="選擇分析日期範圍" :showPresets="true"
            :showSelectedPreset="true" @update:selectedPreset="(label) => selectedPresetLabel = label" />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">客戶分群</label>
          <div class="flex flex-wrap gap-x-6 gap-y-4 pt-2">
            <div class="flex items-center space-x-2">
              <Checkbox id="all-segments" :model-value="selectedSegments.length === availableSegments.length
                " @update:model-value="toggleAllSegments" />
              <label for="all-segments"
                class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                所有分群
              </label>
            </div>
            <div v-for="segment in availableSegments" :key="segment" class="flex items-center space-x-2">
              <Checkbox :id="segment" :model-value="selectedSegments.includes(segment)" @update:model-value="
                (checked) => toggleSegment(segment, checked)
              " />
              <label :for="segment"
                class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ customerSegmentLabels[segment] }}
              </label>
            </div>
          </div>

          <!-- 客戶分群選擇狀態提示 -->
          <div class="mt-2">
            <StatusBadge
              :status="(segmentSelectionStatus.type === 'warning' ? 'warning' : segmentSelectionStatus.type === 'info' ? 'info' : 'success') as any"
              size="sm">
              {{ segmentSelectionStatus.text }}
            </StatusBadge>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-foreground">生命週期階段</label>
          <div class="flex flex-wrap gap-x-6 gap-y-4 pt-2">
            <div class="flex items-center space-x-2">
              <Checkbox id="all-stages" :model-value="selectedLifecycleStages.length ===
                availableLifecycleStages.length
                " @update:model-value="toggleAllLifecycleStages" />
              <label for="all-stages"
                class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                所有階段
              </label>
            </div>
            <div v-for="stage in availableLifecycleStages" :key="stage" class="flex items-center space-x-2">
              <Checkbox :id="stage" :model-value="selectedLifecycleStages.includes(stage)" @update:model-value="
                (checked) => toggleLifecycleStage(stage, checked)
              " />
              <label :for="stage"
                class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {{ LIFECYCLE_STAGES[stage] }}
              </label>
            </div>
          </div>

          <!-- 生命週期階段選擇狀態提示 -->
          <div class="mt-2">
            <StatusBadge
              :status="(lifecycleSelectionStatus.type === 'warning' ? 'warning' : lifecycleSelectionStatus.type === 'info' ? 'info' : 'success') as any"
              size="sm">
              {{ lifecycleSelectionStatus.text }}
            </StatusBadge>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <Checkbox id="include-churned" v-model="includeChurnedCustomers" />
          <label for="include-churned"
            class="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            包含已流失客戶
          </label>
        </div>

      </AnalyticsSettingsPanel>
    </div>

    <!-- 錯誤顯示 -->
    <div v-if="error" class="mb-6 rounded-md border border-destructive/20 bg-destructive/10 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-destructive-foreground">分析錯誤</h3>
          <div class="mt-2 text-sm text-destructive">
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析標籤導航 -->
    <AnalyticsTabNavigation :tabs="analyticsTabs" v-model:activeTab="activeTab" layout="grid" gridCols="grid-cols-6" />

    <!-- 分析內容區域 -->
    <div class="space-y-6">
      <!-- 總覽儀表板 -->
      <div v-show="activeTab === 'overview'" class="space-y-6">
        <AnalyticsLoadingState v-if="isLoading && !hasAnalyticsData" message="正在載入客戶分析數據..." type="skeleton"
          :skeleton-rows="3" :skeleton-cols="2" :show-card="true" />
        <div v-else-if="!hasAnalyticsData && !isLoading" class="py-12 text-center">
          <p class="text-muted-foreground">點擊「開始分析」來載入客戶分析數據</p>
        </div>

        <div v-else-if="hasAnalyticsData" class="space-y-6">
          <!-- 關鍵指標卡片 -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card v-if="analyticsSummary">
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      總客戶數
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.totalCustomers" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl">{{
                  analyticsSummary.totalCustomers.toLocaleString()
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">
                  活躍客戶: {{ analyticsSummary.activeCustomers }}
                </p>
              </CardContent>
            </Card>

            <Card v-if="highRiskCustomersStats">
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      高風險客戶
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.highRiskCustomers" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-destructive">{{
                  highRiskCustomersStats.totalAtRisk
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">
                  極高風險: {{ highRiskCustomersStats.criticalRisk }}
                </p>
              </CardContent>
            </Card>

            <Card v-if="highRiskCustomersStats">
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      潛在損失價值
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.potentialLoss" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-warning">{{
                  formatCurrency(highRiskCustomersStats.potentialLoss)
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      平均挽回率:
                      {{
                        formatPercentage(
                          highRiskCustomersStats.avgRetentionProbability * 100,
                        )
                      }}
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.avgRetentionProbability" />
                    </TooltipContent>
                  </Tooltip>
                </p>
              </CardContent>
            </Card>

            <Card v-if="actionRecommendationsStats">
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      行動建議
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.actionRecommendations" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-primary">{{
                  actionRecommendationsStats.totalRecommendations
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">
                  緊急處理: {{ actionRecommendationsStats.criticalActions }}
                </p>
              </CardContent>
            </Card>
          </div>

          <!-- 重要客戶清單 -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- 高成長潛力客戶 -->
            <Card v-if="
              topGrowthPotentialCustomers &&
              topGrowthPotentialCustomers.length
            ">
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  高成長潛力客戶
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.growthPotentialCustomers" />
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CardDescription>前10名最具價值成長潛力的客戶</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div v-for="customer in topGrowthPotentialCustomers.slice(0, 5)" :key="customer.customerNumber"
                    class="flex items-center justify-between rounded-lg bg-muted/10 p-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <p class="font-medium">{{ customer.customerNumber }}</p>
                          <p class="text-sm text-muted-foreground">
                            {{ customer.customerName || 'Unknown' }}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ customer.customerEmail || 'N/A' }}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div class="text-right">
                      <p class="font-medium text-success">
                        +{{ formatPercentage(customer.growthRate) }}
                      </p>
                      <p class="text-sm text-muted-foreground">
                        {{ formatCurrency(customer.potentialLTV) }}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- 緊急行動客戶 -->
            <Card>
              <CardHeader>
                <CardTitle>緊急行動客戶</CardTitle>
                <CardDescription>需要立即關注的高優先級客戶</CardDescription>
              </CardHeader>
              <CardContent>
                <!-- 有資料時顯示客戶列表 -->
                <div v-if="urgentActionCustomers && urgentActionCustomers.length" class="space-y-3">
                  <div v-for="customer in urgentActionCustomers.slice(0, 5)" :key="customer.customerNumber"
                    class="flex items-center justify-between rounded-lg bg-muted/10 p-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <p class="font-medium">{{ customer.customerNumber }}</p>
                          <p class="text-sm text-muted-foreground">
                            {{ customer.customerName || 'Unknown' }}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{{ customer.customerEmail || 'N/A' }}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div>
                      <StatusBadge v-bind="getPriorityStatusProps(customer.priority) as any" size="sm">{{
                        customer.priority }}
                      </StatusBadge>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">{{ customer.timing }}</p>
                      <p class="text-sm text-muted-foreground">
                        ROI: {{ formatCurrency(customer.expectedROI) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- 無資料時顯示友好的空狀態 -->
                <div v-else class="flex flex-col items-center justify-center py-8 text-center">
                  <svg class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm text-muted-foreground font-medium">目前沒有需要緊急處理的客戶</p>
                  <p class="text-xs text-muted-foreground mt-1">
                    這表示您的客戶關係維護良好
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- 行為模式分析標籤 -->
      <div v-show="activeTab === 'behavior'" class="space-y-6">
        <!-- 空狀態提示 -->
        <div v-if="!behaviorPatterns || behaviorPatterns.length === 0" class="py-16 text-center">
          <div class="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">暫無行為模式數據</h3>
          <p class="mt-2 text-muted-foreground">請調整篩選條件或確保已有客戶訂單數據，然後點擊「重新載入」</p>
        </div>
        <!-- 有數據時顯示內容 -->
        <div v-else-if="behaviorPatterns && behaviorPatterns.length" class="space-y-6">
          <!-- 行為模式總覽 -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" v-if="behaviorInsights">
            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      平均購買頻率
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.avgPurchaseFrequency" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl">{{
                  formatDashboardValue(behaviorInsights.avgPurchaseFrequency, 'rate')
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">次/月</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      平均訂單間隔
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.avgDaysBetweenOrders" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl">{{
                  behaviorInsights.avgOrderInterval
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">天</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      季節性客戶
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.seasonalCustomers" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-primary">{{
                  behaviorInsights.seasonalCustomers
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">具明顯季節性</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      高一致性客戶
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.highConsistencyCustomers" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-success">{{
                  behaviorInsights.highConsistencyCustomers
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">購買行為穩定</p>
              </CardContent>
            </Card>
          </div>

          <!-- 行為模式詳細分析 -->
          <div class="rounded-lg border border-border bg-card">
            <div class="border-b border-border px-6 py-4 flex items-center justify-between">
              <h4 class="text-md font-medium text-foreground">客戶行為模式詳細分析</h4>
              <p class="text-sm text-muted-foreground">基於購買歷史的行為模式識別與分析</p>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-muted/10">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      客戶編號
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger class="cursor-help">
                          購買頻率
                          <svg
                            class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <circle cx="12" cy="17" r="1" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent asChild>
                          <StructuredTooltipContent :data="customerTooltips.purchaseFrequency" />
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger class="cursor-help">
                          平均間隔
                          <svg
                            class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <circle cx="12" cy="17" r="1" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent asChild>
                          <StructuredTooltipContent :data="customerTooltips.avgDaysBetweenOrders" />
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger class="cursor-help">
                          季節性
                          <svg
                            class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <circle cx="12" cy="17" r="1" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent asChild>
                          <StructuredTooltipContent :data="customerTooltips.seasonalityIndex" />
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger class="cursor-help">
                          一致性
                          <svg
                            class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <circle cx="12" cy="17" r="1" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent asChild>
                          <StructuredTooltipContent :data="customerTooltips.consistencyScore" />
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger class="cursor-help">
                          趨勢
                          <svg
                            class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <circle cx="12" cy="17" r="1" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent asChild>
                          <StructuredTooltipContent :data="customerTooltips.orderValueTrend" />
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      <Tooltip>
                        <TooltipTrigger class="cursor-help">
                          活躍時段
                          <svg
                            class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                            <circle cx="12" cy="17" r="1" />
                          </svg>
                        </TooltipTrigger>
                        <TooltipContent asChild>
                          <StructuredTooltipContent :data="customerTooltips.preferredOrderHours" />
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-card">
                  <tr v-for="pattern in behaviorPatterns.slice(0, 20)" :key="pattern.customerId"
                    class="hover:bg-muted/10">
                    <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <div class="text-sm font-medium text-foreground">
                              {{ pattern.customerNumber || pattern.customerId }}
                            </div>
                            <div class="text-sm text-muted-foreground">
                              {{ pattern.customerName || 'Unknown' }}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ pattern.customerEmail || 'N/A' }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                      {{ formatDashboardValue(pattern.purchaseFrequency, 'rate') }} 次/月
                    </td>
                    <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                      {{ pattern.avgDaysBetweenOrders }} 天
                    </td>
                    <td class="px-6 py-4 text-sm whitespace-nowrap">
                      <span :class="pattern.seasonalityIndex > 0.7
                        ? 'font-medium text-primary'
                        : 'text-muted-foreground'
                        ">
                        {{ formatPercentage(pattern.seasonalityIndex * 100) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm whitespace-nowrap">
                      <span :class="pattern.consistencyScore > 70
                        ? 'font-medium text-success'
                        : 'text-muted-foreground'
                        ">
                        {{ formatDashboardValue(pattern.consistencyScore, 'score') }}%
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm whitespace-nowrap">
                      <span :class="pattern.orderValueTrend === 'increasing'
                        ? 'text-success'
                        : pattern.orderValueTrend === 'decreasing'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                        ">
                        {{
                          pattern.orderValueTrend === 'increasing'
                            ? '上升'
                            : pattern.orderValueTrend === 'decreasing'
                              ? '下降'
                              : '穩定'
                        }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                      {{ pattern.preferredOrderHours.join(', ') }}時
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- 流失風險分析標籤 -->
      <div v-show="activeTab === 'churn'" class="space-y-6">
        <!-- 空狀態提示 -->
        <div v-if="!churnRisks || churnRisks.length === 0" class="py-16 text-center">
          <div class="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">暫無流失風險數據</h3>
          <p class="mt-2 text-muted-foreground">請調整篩選條件或確保已有足夠的客戶歷史數據，然後點擊「重新載入」</p>
        </div>
        <!-- 有數據時顯示內容 -->
        <div v-else-if="churnRisks && churnRisks.length" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>客戶流失風險分析</CardTitle>
              <CardDescription>基於RFM分析和購買行為的流失風險評估</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-lg bg-destructive/10 p-4 text-center" v-if="highRiskCustomersStats">
                  <div class="text-2xl font-bold text-destructive">
                    {{ highRiskCustomersStats.criticalRisk }}
                  </div>
                  <div class="text-sm text-muted-foreground">極高風險</div>
                </div>
                <div class="rounded-lg bg-warning/10 p-4 text-center" v-if="highRiskCustomersStats">
                  <div class="text-2xl font-bold text-warning">
                    {{ highRiskCustomersStats.highRisk }}
                  </div>
                  <div class="text-sm text-muted-foreground">高風險</div>
                </div>
                <div class="rounded-lg bg-warning/10 p-4 text-center" v-if="highRiskCustomersStats">
                  <div class="text-2xl font-bold text-warning">
                    {{
                      highRiskCustomersStats.totalAtRisk -
                      highRiskCustomersStats.criticalRisk -
                      highRiskCustomersStats.highRisk
                    }}
                  </div>
                  <div class="text-sm text-muted-foreground">中等風險</div>
                </div>
                <div class="rounded-lg bg-primary/10 p-4 text-center" v-if="highRiskCustomersStats">
                  <div class="text-2xl font-bold text-primary">
                    {{ formatCurrency(highRiskCustomersStats.potentialLoss) }}
                  </div>
                  <div class="text-sm text-muted-foreground">潛在損失</div>
                </div>
              </div>

              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-muted/10">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        客戶編號
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            風險等級
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.riskLevel" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            風險分數
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.riskScore" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            天數
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.daysSinceLastOrder" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            當前LTV
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.currentLTV" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            挽回機率
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.estimatedRetentionProbability" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-card">
                    <tr v-for="customer in churnRisks.slice(0, 20)" :key="customer.customerId"
                      class="hover:bg-muted/10">
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <div class="text-sm font-medium text-foreground">
                                {{ customer.customerNumber }}
                              </div>
                              <div class="text-sm text-muted-foreground">
                                {{ customer.customerName || 'Unknown' }}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{{ customer.customerEmail || 'N/A' }}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        <StatusBadge v-bind="getRiskStatusProps(customer.riskLevel) as any" size="sm">{{
                          customer.riskLevel
                        }}</StatusBadge>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ customer.riskScore }}/100
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ customer.daysSinceLastOrder }} 天
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ formatCurrency(customer.currentLTV) }}
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{
                          formatPercentage(
                            customer.estimatedRetentionProbability * 100,
                          )
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- 價值成長分析標籤 -->
      <div v-show="activeTab === 'growth'" class="space-y-6">
        <!-- 空狀態提示 -->
        <div v-if="!valueGrowth || valueGrowth.length === 0" class="py-16 text-center">
          <div class="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">暫無價值成長數據</h3>
          <p class="mt-2 text-muted-foreground">請調整篩選條件或確保已有客戶重複購買數據，然後點擊「重新載入」</p>
        </div>
        <!-- 有數據時顯示內容 -->
        <div v-else-if="valueGrowth && valueGrowth.length" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>客戶價值成長追蹤</CardTitle>
              <CardDescription>分析客戶LTV成長趨勢和潛力評估</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-muted/10">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        客戶編號
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            當前分群
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.currentSegment" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            當前LTV
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.currentLTV" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            成長率
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.ltvGrowthRate" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            成長潛力
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.growthPotential" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            預估LTV
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.estimatedFutureLTV" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-card">
                    <tr v-for="customer in valueGrowth.slice(0, 20)" :key="customer.customerId"
                      class="hover:bg-muted/10">
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <div class="text-sm font-medium text-foreground">
                                {{ customer.customerNumber }}
                              </div>
                              <div class="text-sm text-muted-foreground">
                                {{ customer.customerName || 'Unknown' }}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{{ customer.customerEmail || 'N/A' }}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        <StatusBadge
                          :status="getSegmentStatusProps(customer.currentSegment).status"
                          size="sm">
                          {{
                            customerSegmentLabels[customer.currentSegment] ||
                            customer.currentSegment
                          }}
                        </StatusBadge>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ formatCurrency(customer.currentLTV) }}
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap">
                        <span :class="customer.ltvGrowthRate > 0
                          ? 'text-success'
                          : 'text-destructive'
                          ">
                          {{ customer.ltvGrowthRate > 0 ? '+' : ''
                          }}{{ formatPercentage(customer.ltvGrowthRate) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ customer.growthPotential }}/100
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ formatCurrency(customer.estimatedFutureLTV) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- 分群對比分析標籤 -->
      <div v-show="activeTab === 'segments'" class="space-y-6">
        <!-- 空狀態提示 -->
        <div v-if="!segmentComparison || segmentComparison.length === 0" class="py-16 text-center">
          <div class="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">暫無分群對比數據</h3>
          <p class="mt-2 text-muted-foreground">請調整篩選條件或確保已有多個客戶分群，然後點擊「重新載入」</p>
        </div>
        <!-- 有數據時顯示內容 -->
        <div v-else-if="segmentComparison && segmentComparison.length" class="space-y-6">
          <!-- 分群效能總覽 -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" v-if="segmentPerformanceOverview">
            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      總分群數
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.totalSegments" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl">{{
                  segmentPerformanceOverview.totalSegments
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      個活躍分群
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.activeSegments" />
                    </TooltipContent>
                  </Tooltip>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      分析客戶總數
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.totalCustomers" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl">{{
                  segmentPerformanceOverview.totalCustomers.toLocaleString()
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">位客戶</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      平均客戶價值
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.avgLTV" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-primary">{{
                  formatCurrency(segmentPerformanceOverview.avgLTV)
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">全分群平均LTV</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader class="pb-2">
                <CardDescription>
                  <Tooltip>
                    <TooltipTrigger class="cursor-help">
                      平均留存率
                      <svg
                        class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <circle cx="12" cy="17" r="1" />
                      </svg>
                    </TooltipTrigger>
                    <TooltipContent asChild>
                      <StructuredTooltipContent :data="customerTooltips.avgRetentionRate" />
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
                <CardTitle class="text-2xl text-success">{{
                  formatPercentage(segmentPerformanceOverview.avgRetentionRate)
                }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p class="text-muted-foreground text-xs">全分群平均留存</p>
              </CardContent>
            </Card>
          </div>

          <!-- 分群對比詳細表格 -->
          <Card>
            <CardHeader>
              <CardTitle>RFM 分群效能對比分析</CardTitle>
              <CardDescription>各客戶分群的詳細效能指標與對比</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-muted/10">
                    <tr>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        分群名稱
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            客戶數量
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.customerCount" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            佔比
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.segmentPercentage" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            平均LTV
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.avgLTV" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            留存率
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.retentionRate" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            購買頻率
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.avgPurchaseFrequency" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            平均訂單金額
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.avgOrderValue" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                      <th
                        class="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                        <Tooltip>
                          <TooltipTrigger class="cursor-help">
                            成長趨勢
                            <svg
                              class="inline-block ml-1 h-3 w-3 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                              <circle cx="12" cy="17" r="1" />
                            </svg>
                          </TooltipTrigger>
                          <TooltipContent asChild>
                            <StructuredTooltipContent :data="customerTooltips.growthRate" />
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-card">
                    <tr v-for="segment in segmentComparison" :key="segment.segmentName" class="hover:bg-muted/10">
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        <div class="flex items-center">
                          <StatusBadge
                            :status="getSegmentStatusProps(segment.segmentName).status"
                            size="sm"
                            class="mr-2">
                            {{
                              customerSegmentLabels[segment.segmentName] ||
                              segment.segmentName
                            }}
                          </StatusBadge>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ segment.customerCount.toLocaleString() }}
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{
                          formatPercentage(
                            (segment.customerCount /
                              (segmentPerformanceOverview?.totalCustomers ||
                                1)) *
                            100,
                          )
                        }}
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ formatCurrency(segment.avgLTV) }}
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap">
                        <span :class="segment.retentionRate > 0.8
                          ? 'font-medium text-success'
                          : segment.retentionRate > 0.6
                            ? 'text-warning'
                            : 'text-destructive'
                          ">
                          {{ formatPercentage(segment.retentionRate * 100) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ formatDashboardValue(segment.avgPurchaseFrequency, 'rate') }} 次/月
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                        {{ formatCurrency(segment.avgOrderValue) }}
                      </td>
                      <td class="px-6 py-4 text-sm whitespace-nowrap">
                        <span :class="segment.growthRate > 0
                          ? 'text-success'
                          : segment.growthRate < 0
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                          ">
                          {{
                            segment.growthRate > 0
                              ? '成長'
                              : segment.growthRate < 0 ? '下降' : '穩定' }} </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <!-- 分群洞察與建議 -->
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2" v-if="segmentSummary">
            <Card>
              <CardHeader>
                <CardTitle>最優分群</CardTitle>
                <CardDescription>表現最佳的客戶分群</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="flex items-center justify-between rounded-lg bg-success/10 p-3">
                    <div>
                      <p class="font-medium">
                        {{
                          customerSegmentLabels[
                          segmentSummary.bestPerformingSegment
                          ] || segmentSummary.bestPerformingSegment
                        }}
                      </p>
                      <p class="text-sm text-muted-foreground">最佳表現分群</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-success">冠軍</p>
                      <p class="text-sm text-muted-foreground">效能最優</p>
                    </div>
                  </div>
                  <div class="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                    <div>
                      <p class="font-medium">
                        {{
                          customerSegmentLabels[
                          segmentSummary.highestGrowthSegment
                          ] || segmentSummary.highestGrowthSegment
                        }}
                      </p>
                      <p class="text-sm text-muted-foreground">最高成長分群</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-primary">成長</p>
                      <p class="text-sm text-muted-foreground">成長最快</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>需關注分群</CardTitle>
                <CardDescription>需要重點關注的分群</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="flex items-center justify-between rounded-lg bg-warning/10 p-3">
                    <div>
                      <p class="font-medium">
                        {{
                          customerSegmentLabels[
                          segmentSummary.highestRiskSegment
                          ] || segmentSummary.highestRiskSegment
                        }}
                      </p>
                      <p class="text-sm text-muted-foreground">高風險分群</p>
                    </div>
                    <div class="text-right">
                      <p class="font-medium text-warning">風險</p>
                      <p class="text-sm text-muted-foreground">需要關注</p>
                    </div>
                  </div>
                  <div v-for="recommendation in segmentSummary.recommendations.slice(
                    0,
                    2,
                  )" :key="recommendation" class="flex items-start rounded-lg bg-muted/10 p-3">
                    <div>
                      <p class="text-sm text-foreground">
                        {{ recommendation }}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- 行動建議標籤 -->
      <div v-show="activeTab === 'actions'" class="space-y-6">
        <!-- 空狀態提示 -->
        <div v-if="!actionRecommendations || actionRecommendations.length === 0" class="py-16 text-center">
          <div class="mx-auto h-12 w-12 text-muted-foreground">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 class="mt-4 text-lg font-medium text-foreground">暫無行動建議</h3>
          <p class="mt-2 text-muted-foreground">請調整篩選條件或確保已完成客戶分析，然後點擊「重新載入」生成個性化建議</p>
        </div>
        <!-- 有數據時顯示內容 -->
        <div v-else-if="actionRecommendations && actionRecommendations.length" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>個性化行動建議</CardTitle>
              <CardDescription>基於客戶分析生成的具體行動建議</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div v-for="recommendation in actionRecommendations.slice(0, 15)"
                  :key="`${recommendation.customerId}-${recommendation.category}`"
                  class="rounded-lg border border-border p-4">
                  <div class="mb-2 flex items-start justify-between">
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <h4 class="font-medium text-foreground">
                              {{ recommendation.customerNumber || recommendation.customerId }}
                            </h4>
                            <p class="text-sm text-muted-foreground">
                              {{ recommendation.customerName || 'Unknown' }}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ recommendation.customerEmail || 'N/A' }}</p>
                        </TooltipContent>
                      </Tooltip>
                      <div class="mt-1 flex items-center space-x-2">
                        <StatusBadge v-bind="getPriorityStatusProps(recommendation.priority) as any" size="sm">{{
                          recommendation.priority }}</StatusBadge>
                        <span class="text-sm text-muted-foreground">{{
                          recommendation.category
                        }}</span>
                      </div>
                    </div>
                    <div class="text-right text-sm">
                      <div class="font-medium text-success">
                        ROI: {{ formatCurrency(recommendation.estimatedROI) }}
                      </div>
                      <div class="text-muted-foreground">
                        {{ recommendation.suggestedTiming }}
                      </div>
                    </div>
                  </div>

                  <div class="mb-2">
                    <p class="text-sm font-medium text-foreground">
                      {{ recommendation.action }}
                    </p>
                  </div>

                  <div class="mb-2 text-sm text-muted-foreground">
                    <strong>原因:</strong> {{ recommendation.reasoning }}
                  </div>

                  <div class="text-sm text-muted-foreground">
                    <strong>預期效果:</strong>
                    {{ recommendation.expectedImpact }}
                  </div>

                  <div class="mt-2 border-t border-border/50 pt-2">
                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                      <span>信心度: {{ recommendation.confidence }}%</span>
                      <span>實施難度:
                        {{ recommendation.implementationDifficulty }}</span>
                      <span>預估成本:
                        {{ formatCurrency(recommendation.estimatedCost) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
