<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Charts/OverlapCalendarChart')

import { computed, watch } from 'vue'
import { VisXYContainer, VisLine, VisArea, VisAxis } from '@unovis/vue'
import { Line } from '@unovis/ts'

type OverlapCalendarDataRecord = {
  date: string
  concurrentCampaigns: number
  campaignsList: string
  activeLayers: string[]
  campaignTypes: string[]
  avgAttributionWeight: number
  isHoliday: boolean
  isWeekend: boolean
  holidayName: string | null
  complexityLevel: 'simple' | 'moderate' | 'complex'
  specialFlags:
    | 'normal'
    | 'holiday_multi_campaign'
    | 'weekend_multi_campaign'
    | 'high_intensity'
}

const props = defineProps<{
  data: OverlapCalendarDataRecord[]
  width?: number
  height?: number
}>()

// 監控數據變化以觸發重新渲染
watch(
  () => props.data,
  () => {
    // 數據變化時的處理邏輯
  },
  { immediate: true },
)

// 處理和轉換數據
const processedData = computed(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) {
    log.warn('⚠️ OverlapCalendarChart: 無效或空數據')
    return []
  }

  // 按日期排序並添加解析後的日期對象用於圖表
  return props.data
    .map((item) => ({
      ...item,
      dateObj: new Date(item.date),
      intensityScore: calculateIntensityScore(item),
    }))
    .filter((item) => !isNaN(item.dateObj.getTime())) // 過濾無效日期
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
})

// 計算強度評分
function calculateIntensityScore(item: OverlapCalendarDataRecord): number {
  let score = item.concurrentCampaigns * 10 // 基礎分數

  // 權重加成
  score += item.avgAttributionWeight * 5

  // 複雜度加成
  switch (item.complexityLevel) {
    case 'complex':
      score += 20
      break
    case 'moderate':
      score += 10
      break
    case 'simple':
      score += 0
      break
  }

  // 特殊標記加成
  if (item.specialFlags !== 'normal') {
    score += 15
  }

  return Math.min(score, 100) // 限制在0-100範圍內
}

// 圖表配置
const areaConfig = computed(() => ({
  x: (
    d: OverlapCalendarDataRecord & { dateObj: Date; intensityScore: number },
  ) => d.dateObj.getTime(),
  y: (
    d: OverlapCalendarDataRecord & { dateObj: Date; intensityScore: number },
  ) => d.intensityScore,
  color: '#E0E7FF',
  opacity: 0.5,
}))

const lineConfig = computed(() => ({
  x: (
    d: OverlapCalendarDataRecord & { dateObj: Date; intensityScore: number },
  ) => d.dateObj.getTime(),
  y: (
    d: OverlapCalendarDataRecord & { dateObj: Date; intensityScore: number },
  ) => d.concurrentCampaigns,
  color: (
    d: OverlapCalendarDataRecord & { dateObj: Date; intensityScore: number },
  ) => {
    // 根據特殊標記和假期狀態調整顏色
    if (d.isHoliday) return '#EF4444' // 紅色 - 假期
    if (d.isWeekend) return '#F59E0B' // 橙色 - 週末
    if (d.specialFlags === 'high_intensity') return '#DC2626' // 深紅 - 高強度
    if (d.complexityLevel === 'complex') return '#7C3AED' // 紫色 - 複雜
    return '#3B82F6' // 藍色 - 正常
  },
  strokeWidth: (
    d: OverlapCalendarDataRecord & { dateObj: Date; intensityScore: number },
  ) => {
    // 根據併發活動數量調整線條粗細
    if (d.concurrentCampaigns >= 5) return 3
    if (d.concurrentCampaigns >= 3) return 2
    return 1
  },
}))

// log.debug('🔍 OverlapCalendar 區域配置:', areaConfig.value)
// log.debug('🔍 OverlapCalendar 線條配置:', lineConfig.value)

// 容器配置
const containerConfig = computed(() => {
  const config = {
    width: props.width || 800,
    height: props.height || 400,
    margin: { top: 20, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'time',
      tickFormat: (d: Date) =>
        d.toLocaleDateString('zh-TW', {
          month: 'short',
          day: 'numeric',
        }),
      numTicks: Math.min(10, processedData.value.length),
    },
    yAxis: {
      label: '併發活動數',
      tickFormat: (d: number) => d.toString(),
    },
    tooltip: {
      triggers: {
        [Line.selectors.line]: (
          d: OverlapCalendarDataRecord & {
            dateObj: Date
            intensityScore: number
          },
        ) => `
          <div class="tooltip-content">
            <div class="tooltip-title">${d.date}</div>
            <div class="tooltip-item">併發活動數: <strong>${d.concurrentCampaigns}</strong></div>
            <div class="tooltip-item">活動列表: ${d.campaignsList}</div>
            <div class="tooltip-item">活躍層級: ${d.activeLayers.join(', ')}</div>
            <div class="tooltip-item">平均權重: ${d.avgAttributionWeight.toFixed(2)}</div>
            <div class="tooltip-item">複雜度: ${getComplexityLabel(d.complexityLevel)}</div>
            ${d.isHoliday ? `<div class="tooltip-item holiday">🎉 假期: ${d.holidayName}</div>` : ''}
            ${d.isWeekend ? `<div class="tooltip-item weekend">📅 週末</div>` : ''}
            ${d.specialFlags !== 'normal' ? `<div class="tooltip-item special">⚡ ${getSpecialFlagLabel(d.specialFlags)}</div>` : ''}
          </div>
        `,
      },
    },
  }

  return config
})

// 工具函數
function getComplexityLabel(level: string): string {
  const labels = {
    simple: '簡單',
    moderate: '中等',
    complex: '複雜',
  }
  return labels[level as keyof typeof labels] || level
}

function getSpecialFlagLabel(flag: string): string {
  const labels = {
    normal: '正常',
    holiday_multi_campaign: '假期多活動',
    weekend_multi_campaign: '週末多活動',
    high_intensity: '高強度',
  }
  return labels[flag as keyof typeof labels] || flag
}

// 統計信息
const stats = computed(() => {
  if (!processedData.value.length) return null

  const totalDays = processedData.value.length
  const avgConcurrentCampaigns =
    processedData.value.reduce((sum, d) => sum + d.concurrentCampaigns, 0) /
    totalDays
  const maxConcurrentCampaigns = Math.max(
    ...processedData.value.map((d) => d.concurrentCampaigns),
  )
  const holidayDays = processedData.value.filter((d) => d.isHoliday).length
  const highIntensityDays = processedData.value.filter(
    (d) => d.specialFlags === 'high_intensity',
  ).length

  return {
    totalDays,
    avgConcurrentCampaigns: avgConcurrentCampaigns.toFixed(1),
    maxConcurrentCampaigns,
    holidayDays,
    highIntensityDays,
    complexDays: processedData.value.filter(
      (d) => d.complexityLevel === 'complex',
    ).length,
  }
})
</script>

<template>
  <div class="overlap-calendar-chart">
    <!-- 統計信息面板 -->
    <div v-if="stats" class="stats-panel mb-4">
      <div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-6">
        <div class="stat-item">
          <div class="stat-label">總天數</div>
          <div class="stat-value">{{ stats.totalDays }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">平均併發</div>
          <div class="stat-value">{{ stats.avgConcurrentCampaigns }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最高併發</div>
          <div class="stat-value">{{ stats.maxConcurrentCampaigns }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">假期天數</div>
          <div class="stat-value text-red-600">{{ stats.holidayDays }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">高強度天數</div>
          <div class="stat-value text-orange-600">
            {{ stats.highIntensityDays }}
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">複雜天數</div>
          <div class="stat-value text-purple-600">{{ stats.complexDays }}</div>
        </div>
      </div>
    </div>

    <!-- 圖例說明 -->
    <div class="legend mb-4">
      <div class="flex flex-wrap gap-4 text-xs">
        <div class="legend-item">
          <div class="legend-color bg-blue-500"></div>
          <span>正常日</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-orange-500"></div>
          <span>週末</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-red-500"></div>
          <span>假期</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-purple-600"></div>
          <span>複雜日</span>
        </div>
        <div class="legend-item">
          <div class="legend-color bg-red-700"></div>
          <span>高強度</span>
        </div>
      </div>
    </div>

    <!-- 主要圖表 -->
    <div class="chart-container">
      <div v-if="!processedData.length" class="empty-state">
        <div class="py-12 text-center">
          <div class="mb-2 text-lg text-gray-400">📅</div>
          <div class="text-gray-500">無重疊日曆數據</div>
          <div class="text-sm text-gray-400">請調整日期範圍或檢查數據來源</div>
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
        :tooltip="containerConfig.tooltip"
        class="overlap-calendar-vis"
      >
        <VisArea v-bind="areaConfig" />
        <VisLine v-bind="lineConfig" />
        <VisAxis type="x" />
        <VisAxis type="y" />
      </VisXYContainer>
    </div>
  </div>
</template>

<style scoped>
.overlap-calendar-chart {
  width: 100%;
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
  max-width: 20rem;
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

:global(.tooltip-item.holiday) {
  color: #dc2626;
  font-weight: 500;
}

:global(.tooltip-item.weekend) {
  color: #ea580c;
  font-weight: 500;
}

:global(.tooltip-item.special) {
  color: #7c3aed;
  font-weight: 500;
}

:global(.overlap-calendar-vis) {
  width: 100%;
}
</style>
