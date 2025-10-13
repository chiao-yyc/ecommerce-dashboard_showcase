<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Charts/PerformanceTrendsChart')

import { ref, computed, watch } from 'vue'
import {
  VisXYContainer,
  VisLine,
  VisArea,
  VisScatter,
  VisAxis,
} from '@unovis/vue'
import { useChartTheme } from '@/composables/charts/useChartTheme'
import { AttributionLayer } from '@/types/campaign'
import { getAllAttributionLayerDisplayNames } from '@/constants/attribution-layer-config'

// 基於 campaign_performance_enhanced 視圖和 campaigns JOIN 的數據結構
type PerformanceTrendsDataRecord = {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  attribution_layer: string
  start_date: string
  end_date: string
  total_revenue: number
  total_orders: number
  avg_order_value: number
  attribution_weight?: number
  performance_score: number
  conversion_rate?: number
  return_on_investment: number
}

const props = defineProps<{
  data: PerformanceTrendsDataRecord[]
  width?: number
  height?: number
  selectedMetric?: 'revenue' | 'orders' | 'aov' | 'roi' | 'conversion_rate'
}>()

const emit = defineEmits<{
  metricChange: [metric: string]
}>()

// 使用圖表主題系統
const { chartColors } = useChartTheme()

// 圖例配置
const layerDisplayNames = getAllAttributionLayerDisplayNames()

// 統一的層級顏色映射
const getLayerColorIndex = (layer: string): number => {
  const layerColorMap: Record<AttributionLayer, number> = {
    [AttributionLayer.SITE_WIDE]: 0,           // chart-1
    [AttributionLayer.TARGET_ORIENTED]: 1,     // chart-2
    [AttributionLayer.CATEGORY_SPECIFIC]: 2,   // chart-3
    [AttributionLayer.GENERAL]: 3              // chart-4
  }
  return layerColorMap[layer as AttributionLayer] ?? 4
}

const legendItems = computed(() => {
  const layers = [
    AttributionLayer.SITE_WIDE,
    AttributionLayer.TARGET_ORIENTED,
    AttributionLayer.CATEGORY_SPECIFIC,
    AttributionLayer.GENERAL
  ]

  return layers.map((layer) => ({
    layer,
    displayName: layerDisplayNames[layer],
    color: chartColors.value[getLayerColorIndex(layer)],
    colorIndex: getLayerColorIndex(layer)
  }))
})

// 監控數據變化以觸發重新渲染
watch(
  () => props.data,
  () => {
    // 數據變化時的處理邏輯
  },
  { immediate: true },
)

// 當前選擇的指標
const currentMetric = ref(props.selectedMetric || 'revenue')

// 處理和轉換數據
const processedData = computed(() => {
  log.debug('🔍 PerformanceTrendsChart processedData 被觸發')
  log.debug('📊 Props 數據:', {
    dataType: typeof props.data,
    dataLength: Array.isArray(props.data) ? props.data.length : 'not array',
    rawData: props.data
  })

  if (!Array.isArray(props.data) || props.data.length === 0) {
    log.warn('⚠️ PerformanceTrendsChart: 無效或空數據')
    return []
  }

  log.debug('📊 PerformanceTrends 原始數據 (詳細):', props.data)

  // 轉換數據並添加計算字段
  return props.data
    .map((item) => {
      const startDateObj = new Date(item.start_date)
      const endDateObj = new Date(item.end_date)
      
      // 🔧 加強日期驗證和錯誤報告
      if (isNaN(startDateObj.getTime())) {
        log.error(`❌ Invalid start_date for campaign ${item.campaign_name}:`, item.start_date)
      }
      if (isNaN(endDateObj.getTime())) {
        log.error(`❌ Invalid end_date for campaign ${item.campaign_name}:`, item.end_date)
      }
      
      const duration = Math.ceil(
        (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
      )

      const processedItem = {
        ...item,
        startDateObj,
        endDateObj,
        duration,
        // API 已經提供了計算好的數值，直接使用
        total_revenue: item.total_revenue || 0,
        total_orders: item.total_orders || 0,
        avg_order_value: item.avg_order_value || 0,
        return_on_investment: item.return_on_investment || 0,
        conversion_rate: item.conversion_rate || 0,
        performance_score: item.performance_score || 0,
      }

      log.debug(`📊 處理活動 ${item.campaign_name}:`, {
        rawStartDate: item.start_date,
        startDateObj: startDateObj,
        isValidDate: !isNaN(startDateObj.getTime()),
        formattedDate: startDateObj.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
        revenue: processedItem.total_revenue,
        attributionLayer: item.attribution_layer
      })

      return processedItem
    })
    .filter(
      (item) =>
        !isNaN(item.startDateObj.getTime()) &&
        !isNaN(item.endDateObj.getTime()) &&
        item.total_revenue > 0 // 只顯示有營收的活動
    ) // 過濾無效日期和無營收活動
    .sort((a, b) => a.startDateObj.getTime() - b.startDateObj.getTime())
})

// 計算績效評分 (備用，API 已經計算好了)
// function calculatePerformanceScore(item: PerformanceTrendsDataRecord): number {
//   // API 已經提供計算好的 performance_score，不再需要前端計算
//   return item.performance_score || 0
// }

// 獲取指標數據
function getMetricValue(
  item: PerformanceTrendsDataRecord & {
    startDateObj: Date
    endDateObj: Date
    duration: number
    performance_score: number
  },
  metric: string,
): number {
  switch (metric) {
    case 'revenue':
      return item.total_revenue || 0
    case 'orders':
      return item.total_orders || 0
    case 'aov':
      return item.avg_order_value || 0
    case 'roi':
      return item.return_on_investment || 0
    case 'conversion_rate':
      return item.conversion_rate || 0
    case 'performance_score':
      return item.performance_score || 0
    default:
      return 0
  }
}

// 獲取指標標籤
function getMetricLabel(metric: string): string {
  const labels = {
    revenue: '營收',
    orders: '訂單數',
    aov: '平均訂單價值',
    roi: 'ROI (%)',
    conversion_rate: '轉換率 (%)',
    performance_score: '績效評分',
  }
  return labels[metric as keyof typeof labels] || metric
}

// 獲取指標顏色（使用主題系統）
const getMetricColor = computed(() => {
  const colorMap = {
    revenue: 0, // 使用 chart-1
    orders: 1, // 使用 chart-2
    aov: 2, // 使用 chart-3
    roi: 3, // 使用 chart-4
    conversion_rate: 4, // 使用 chart-5
    performance_score: 0, // 重複使用 chart-1
  }
  
  return (metric: string): string => {
    // 安全檢查：確保 chartColors.value 存在且為陣列
    if (!chartColors.value || !Array.isArray(chartColors.value) || chartColors.value.length === 0) {
      return '#6B7280' // 回退顏色
    }
    
    const colorIndex = colorMap[metric as keyof typeof colorMap]
    return chartColors.value[colorIndex] || chartColors.value[0] || '#6B7280'
  }
})

// 圖表配置
const areaConfig = computed(() => {
  const metric = currentMetric.value
  return {
    x: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => d.startDateObj.getTime(), // 轉換為時間戳記給 Unovis 使用
    y: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => getMetricValue(d, metric),
    color: getMetricColor.value(metric),
    opacity: 0.2,
  }
})

const lineConfig = computed(() => {
  const metric = currentMetric.value
  return {
    x: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => d.startDateObj.getTime(), // 轉換為時間戳記給 Unovis 使用
    y: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => getMetricValue(d, metric),
    color: getMetricColor.value(metric),
    strokeWidth: 2,
  }
})

const scatterConfig = computed(() => {
  const metric = currentMetric.value
  return {
    x: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => d.startDateObj.getTime(), // 轉換為時間戳記給 Unovis 使用
    y: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => getMetricValue(d, metric),
    color: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => {
      // 使用統一的層級顏色映射
      const colorIndex = getLayerColorIndex(d.attribution_layer)
      const baseColor = chartColors.value[colorIndex] || '#6B7280'
      
      // 將顏色轉換為帶透明度的格式
      if (baseColor.startsWith('oklch')) {
        // 如果是 oklch 格式，轉換為帶透明度的格式
        return baseColor.replace('oklch(', 'oklch(').replace(')', ' / 0.6)')
      } else {
        // 如果是 hex 格式，轉換為 rgba
        const hex = baseColor.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        return `rgba(${r}, ${g}, ${b}, 0.6)`
      }
    },
    size: (
      d: PerformanceTrendsDataRecord & {
        startDateObj: Date
        endDateObj: Date
        duration: number
        performance_score: number
      },
    ) => {
      // 根據活動持續時間和營收調整大小
      const duration = d.duration || 1
      const revenue = d.total_revenue || 0
      // 基礎大小 + 營收影響 + 持續時間影響
      const baseSize = 6
      const revenueBonus = Math.min(revenue / 20000, 1) * 4 // 最大增加4像素
      const durationBonus = Math.min(duration / 20, 1) * 2 // 最大增加2像素
      return Math.max(4, Math.min(16, baseSize + revenueBonus + durationBonus))
    },
  }
})

// log.debug('🔍 PerformanceTrends 區域配置:', areaConfig.value)
// log.debug('🔍 PerformanceTrends 線條配置:', lineConfig.value)
// log.debug('🔍 PerformanceTrends 散點配置:', scatterConfig.value)

// 容器配置
const containerConfig = computed(() => ({
  width: props.width || 800,
  height: props.height || 400,
  margin: { top: 20, right: 20, bottom: 40, left: 60 },
  xAxis: {
    type: 'time',
    tickFormat: (d: number | Date) => {
      // Unovis 可能傳入時間戳記（number）或 Date 物件
      const date = typeof d === 'number' ? new Date(d) : d
      
      // 確保輸入是有效的 Date 物件
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        log.warn('⚠️ Invalid date in xAxis tickFormat:', d)
        return 'Invalid Date'
      }
      
      // 使用更清楚的日期格式，參考 OverlapCalendarChart 成功案例
      return date.toLocaleDateString('zh-TW', {
        month: 'short',  // 使用 'short' 格式如：「1月」
        day: 'numeric',
      })
    },
    // 根據時間範圍計算合理的刻度數，而非僅基於數據點數量
    numTicks: (() => {
      const dataLength = processedData.value.length
      if (dataLength === 0) return 4
      
      // 計算時間跨度（天數）
      const dates = processedData.value.map(d => d.startDateObj.getTime())
      const minDate = Math.min(...dates)
      const maxDate = Math.max(...dates)
      const timeSpanDays = (maxDate - minDate) / (1000 * 60 * 60 * 24)
      
      // 根據時間跨度決定刻度數
      if (timeSpanDays <= 7) return 7        // 一週內：每天一個刻度
      if (timeSpanDays <= 30) return 8       // 一個月內：約每4天一個刻度
      if (timeSpanDays <= 90) return 10      // 三個月內：約每9天一個刻度
      if (timeSpanDays <= 180) return 12     // 半年內：約每15天一個刻度
      return 15                              // 更長時間：約每12天一個刻度
    })(),
  },
  yAxis: {
    label: getMetricLabel(currentMetric.value),
    tickFormat: (d: number) => {
      if (currentMetric.value === 'revenue' || currentMetric.value === 'aov') {
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
          maximumFractionDigits: 0,
        }).format(d)
      } else if (
        currentMetric.value === 'roi' ||
        currentMetric.value === 'conversion_rate'
      ) {
        return `${d.toFixed(1)}%`
      }
      return d.toLocaleString()
    },
  },
  // 暫時註釋掉 tooltip 以修復選擇器錯誤
  // tooltip: {
  //   triggers: {
  //     [Scatter.selectors.point]: (
  //       d: PerformanceTrendsDataRecord & {
  //         startDateObj: Date
  //         endDateObj: Date
  //         duration: number
  //         performance_score: number
  //       },
  //     ) => `
  //       <div class="tooltip-content">
  //         <div class="tooltip-title">${d.campaign_name}</div>
  //         <div class="tooltip-item">活動期間: ${d.start_date} ~ ${d.end_date}</div>
  //         <div class="tooltip-item">持續天數: ${d.duration} 天</div>
  //         <div class="tooltip-item">歸因層級: ${getLayerDisplayName(d.attribution_layer)}</div>
  //         <div class="tooltip-item">活動類型: ${d.campaign_type}</div>
  //         <div class="tooltip-divider"></div>
  //         <div class="tooltip-item">總營收: ${formatCurrency(d.total_revenue || 0)}</div>
  //         <div class="tooltip-item">總訂單: ${(d.total_orders || 0).toLocaleString()}</div>
  //         <div class="tooltip-item">平均訂單價值: ${formatCurrency(d.avg_order_value || 0)}</div>
  //         <div class="tooltip-item">ROI: ${(d.return_on_investment || 0).toFixed(1)}%</div>
  //         <div class="tooltip-item">轉換率: ${(d.conversion_rate || 0).toFixed(2)}%</div>
  //         <div class="tooltip-item performance">績效評分: ${d.performance_score.toFixed(1)}</div>
  //       </div>
  //     `,
  //   },
  // },
}))

// 工具函數 (使用統一配置)
function getLayerDisplayName(layer: string): string {
  return layerDisplayNames[layer as AttributionLayer] || layer
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount)
}

// 指標選擇
function selectMetric(metric: string) {
  currentMetric.value = metric as 'revenue' | 'orders' | 'aov' | 'roi' | 'conversion_rate'
  emit('metricChange', metric)
}

// 統計信息
const stats = computed(() => {
  if (!processedData.value.length) return null

  const totalCampaigns = processedData.value.length
  const totalRevenue = processedData.value.reduce(
    (sum, d) => sum + (d.total_revenue || 0),
    0,
  )
  const totalOrders = processedData.value.reduce(
    (sum, d) => sum + (d.total_orders || 0),
    0,
  )
  const avgDuration =
    processedData.value.reduce((sum, d) => sum + d.duration, 0) / totalCampaigns
  const avgPerformanceScore =
    processedData.value.reduce((sum, d) => sum + d.performance_score, 0) /
    totalCampaigns

  // 按層級統計
  const layerStats = processedData.value.reduce(
    (acc, d) => {
      const layer = d.attribution_layer
      if (!acc[layer]) {
        acc[layer] = { count: 0, revenue: 0 }
      }
      acc[layer].count++
      acc[layer].revenue += d.total_revenue || 0
      return acc
    },
    {} as Record<string, { count: number; revenue: number }>,
  )

  return {
    totalCampaigns,
    totalRevenue,
    totalOrders,
    avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    avgDuration: avgDuration.toFixed(1),
    avgPerformanceScore: avgPerformanceScore.toFixed(1),
    layerStats,
  }
})
</script>

<template>
  <div class="performance-trends-chart">
    <!-- 指標選擇器 -->
    <div class="metric-selector mb-4">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="metric in [
            'revenue',
            'orders',
            'aov',
            'roi',
            'conversion_rate',
            'performance_score',
          ]"
          :key="metric"
          @click="selectMetric(metric)"
          :class="[
            'metric-button',
            currentMetric === metric
              ? 'metric-button-active'
              : 'metric-button-inactive',
          ]"
          :style="{
            borderColor: currentMetric === metric ? getMetricColor(metric) : '',
            color: currentMetric === metric ? getMetricColor(metric) : '',
          }"
        >
          {{ getMetricLabel(metric) }}
        </button>
      </div>
    </div>

    <!-- 統計信息面板 -->
    <div v-if="stats" class="stats-panel mb-4">
      <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-5">
        <div class="stat-item">
          <div class="stat-label">總活動數</div>
          <div class="stat-value">{{ stats.totalCampaigns }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">總營收</div>
          <div class="stat-value text-success">
            {{ formatCurrency(stats.totalRevenue) }}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">總訂單</div>
          <div class="stat-value">{{ stats.totalOrders.toLocaleString() }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均持續</div>
          <div class="stat-value">{{ stats.avgDuration }} 天</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均績效</div>
          <div class="stat-value text-indigo-600">
            {{ stats.avgPerformanceScore }}
          </div>
        </div>
      </div>

      <!-- 層級統計 -->
      <div class="layer-stats mt-4 border-t border-border pt-4">
        <div class="mb-2 text-sm text-foreground">各層級表現:</div>
        <div class="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
          <div
            v-for="(stat, layer) in stats.layerStats"
            :key="layer"
            class="layer-stat"
          >
            <div class="layer-name">{{ getLayerDisplayName(layer) }}</div>
            <div class="layer-data">
              <span class="layer-count">{{ stat.count }} 個</span>
              <span class="layer-revenue">{{
                formatCurrency(stat.revenue)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 圖例說明 -->
    <div class="legend mb-4">
      <div class="flex flex-wrap gap-4 text-xs">
        <div
          v-for="item in legendItems"
          :key="item.layer"
          class="legend-item"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <span>{{ item.displayName }}</span>
        </div>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        點的大小代表活動持續時間，顏色代表歸因層級
      </div>
    </div>

    <!-- 主要圖表 -->
    <div class="chart-container">
      <div v-if="!processedData.length" class="empty-state">
        <div class="py-12 text-center">
          <div class="mb-2 text-lg text-muted-foreground">📈</div>
          <div class="text-muted-foreground">無效果趨勢數據</div>
          <div class="text-sm text-muted-foreground">請調整日期範圍或檢查數據來源</div>
        </div>
      </div>

      <VisXYContainer
        v-else
        :data="processedData"
        :width="containerConfig.width"
        :height="containerConfig.height"
        :margin="containerConfig.margin"
        :xAxis="containerConfig.xAxis"
        :yAxis="containerConfig.yAxis"
        class="performance-trends-vis"
      >
        <VisArea v-bind="areaConfig" />
        <VisLine v-bind="lineConfig" />
        <VisScatter v-bind="scatterConfig" />
        <VisAxis 
          type="x" 
          :tick-format="(d: number) => {
            const date = new Date(d)
            return date.toLocaleDateString('zh-TW', {
              month: 'short',
              day: 'numeric',
            })
          }" 
        />
        <VisAxis 
          type="y" 
          :tick-format="(d: number) => {
            if (currentMetric === 'revenue' || currentMetric === 'aov') {
              return new Intl.NumberFormat('zh-TW', {
                style: 'currency',
                currency: 'TWD',
                maximumFractionDigits: 0,
              }).format(d)
            } else if (currentMetric === 'roi' || currentMetric === 'conversion_rate') {
              return `${d.toFixed(1)}%`
            }
            return d.toLocaleString()
          }"
        />
      </VisXYContainer>
    </div>
  </div>
</template>

<style scoped>
.performance-trends-chart {
  width: 100%;
}

.metric-selector {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.metric-button {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  transition: colors 0.2s;
  cursor: pointer;
}

.metric-button-active {
  background-color: white;
  border-width: 2px;
  font-weight: 500;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.metric-button-inactive {
  background-color: white;
  border-color: #d1d5db;
  color: #6b7280;
}

.metric-button-inactive:hover {
  border-color: #9ca3af;
  color: #111827;
}

.stats-panel {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: #6b7280;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-weight: 600;
  font-size: 1.125rem;
}

.layer-stats {
  text-align: left;
}

.layer-stat {
  background-color: white;
  border-radius: 0.375rem;
  padding: 0.5rem;
}

.layer-name {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.layer-data {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.layer-count {
  color: #6b7280;
  display: block;
}

.layer-revenue {
  color: #10b981;
  font-weight: 500;
  display: block;
}

.legend {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 0.125rem;
}

.chart-container {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.empty-state {
  border: 2px dashed #d1d5db;
  border-radius: 0.5rem;
}

/* 全局 tooltip 樣式 */
:global(.vis-tooltip) {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem;
  max-width: 24rem;
}

:global(.tooltip-content) {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

:global(.tooltip-title) {
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid #f3f4f6;
}

:global(.tooltip-item) {
  font-size: 0.875rem;
  color: #374151;
}

:global(.tooltip-item.performance) {
  color: #4f46e5;
  font-weight: 500;
}

:global(.tooltip-divider) {
  border-top: 1px solid #f3f4f6;
  margin: 0.5rem 0;
}

:global(.performance-trends-vis) {
  width: 100%;
}
</style>
