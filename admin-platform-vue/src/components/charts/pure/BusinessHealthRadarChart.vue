<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useChartTheme } from '@/composables/charts/useChartTheme'
import type { BusinessHealthMetrics } from '@/types/dashboard'
import SimpleExportChart from '@/components/common/SimpleExportChart.vue'
import { UniversalSpinner } from '@/components/common/loading'

interface Props {
  data: BusinessHealthMetrics
  loading?: boolean
  width?: number
  height?: number
  /** 是否顯示匯出按鈕 */
  showExportButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  width: 320,
  height: 200,
  showExportButton: false,
})

// i18n 支援
const { t } = useI18n()

// 圖表主題支援
const { chartColors, theme } = useChartTheme()

// 當前字體系列
const currentFontFamily = computed(() => theme.value.fontFamily || 'system-ui, -apple-system, sans-serif')

// 雷達圖配置
const config = {
  center: { x: props.width / 2, y: props.height / 2 },
  radius: Math.min(props.width, props.height) / 2 - 40,
  levels: 5, // 0, 2, 4, 6, 8, 10
  angleStep: (Math.PI * 2) / 7, // 七個維度
}

// 維度配置（國際化，使用統一圖表顏色）
const dimensions = computed(() => [
  { key: 'revenue', label: t('export.pdf.dimensions.revenue'), color: chartColors.value[0] },
  { key: 'satisfaction', label: t('export.pdf.dimensions.satisfaction'), color: chartColors.value[1] },
  { key: 'fulfillment', label: t('export.pdf.dimensions.fulfillment'), color: chartColors.value[2] },
  { key: 'support', label: t('export.pdf.dimensions.support'), color: chartColors.value[3] },
  { key: 'products', label: t('export.pdf.dimensions.products'), color: chartColors.value[4] },
  { key: 'marketing', label: t('export.pdf.dimensions.marketing'), color: chartColors.value[0] }, // 重複使用第一個顏色
  { key: 'system', label: t('export.pdf.dimensions.system'), color: chartColors.value[1] }, // 重複使用第二個顏色
] as const)

// 懸停狀態
const hoveredDimension = ref<string | null>(null)

// 匯出配置
// 極簡化匯出配置
const exportTitle = computed(() => {
  const totalScore = Object.values(props.data).reduce((sum, value) => sum + value, 0) / 7
  return `業務健康度雷達圖 (總分: ${totalScore.toFixed(1)})`
})

// 簡化的匯出配置 - 僅針對雷達圖本身
// 注意：如果需要包含指標進度條，應該使用 BusinessHealthDashboard 組件

// 計算雷達圖點位
const radarPoints = computed(() => {
  return dimensions.value.map((dim, index) => {
    const angle = index * config.angleStep - Math.PI / 2 // 從頂部開始
    const value = props.data[dim.key] || 0
    const distance = (value / 10) * config.radius

    return {
      ...dim,
      x: config.center.x + Math.cos(angle) * distance,
      y: config.center.y + Math.sin(angle) * distance,
      angle,
      value,
      // 標籤位置 (根據 SVG 大小動態調整偏移)
      labelX: config.center.x + Math.cos(angle) * (config.radius + Math.min(20, props.width * 0.08)),
      labelY: config.center.y + Math.sin(angle) * (config.radius + Math.min(20, props.width * 0.08)),
    }
  })
})

// 網格線路徑
const gridPaths = computed(() => {
  const paths = []

  // 同心圓
  for (let level = 1; level <= config.levels; level++) {
    const radius = (level / config.levels) * config.radius
    paths.push({
      type: 'circle',
      path: `M ${config.center.x + radius},${config.center.y} A ${radius},${radius} 0 1,1 ${config.center.x - radius},${config.center.y} A ${radius},${radius} 0 1,1 ${config.center.x + radius},${config.center.y}`,
      opacity: level === config.levels ? 0.3 : 0.1,
    })
  }

  // 放射線
  dimensions.value.forEach((_, index) => {
    const angle = index * config.angleStep - Math.PI / 2
    const endX = config.center.x + Math.cos(angle) * config.radius
    const endY = config.center.y + Math.sin(angle) * config.radius

    paths.push({
      type: 'line',
      path: `M ${config.center.x},${config.center.y} L ${endX},${endY}`,
      opacity: 0.2,
    })
  })

  return paths
})

// 雷達區域路徑
const radarAreaPath = computed(() => {
  if (radarPoints.value.length === 0) return ''

  const pathCommands = radarPoints.value.map((point, index) => {
    return index === 0 ? `M ${point.x},${point.y}` : `L ${point.x},${point.y}`
  })

  return pathCommands.join(' ') + ' Z'
})

// 數值標籤 (0, 2, 4, 6, 8, 10)
const valueLabels = computed(() => {
  return Array.from({ length: 6 }, (_, i) => i * 2).map((value) => ({
    value,
    y: config.center.y - (value / 10) * config.radius,
    x: config.center.x + 5,
  }))
})

// 處理懸停事件
const handleMouseEnter = (dimension: string) => {
  hoveredDimension.value = dimension
}

const handleMouseLeave = () => {
  hoveredDimension.value = null
}

// 獲取維度顏色 (懸停時加深)
const getDimensionColor = (dimension: string, opacity = 1) => {
  const dim = dimensions.value.find((d) => d.key === dimension)
  if (!dim) return '#6b7280'

  if (hoveredDimension.value === dimension) {
    return (
      dim.color +
      Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')
        .slice(-2)
    )
  }

  return (
    dim.color +
    Math.round(opacity * 180)
      .toString(16)
      .padStart(2, '0')
      .slice(-2)
  )
}

</script>

<template>
  <SimpleExportChart 
    filename="business_health_radar"
    :title="exportTitle"
    mode="auto"
    :show-export-button="showExportButton" 
    :disabled="loading"
    class="flex w-full flex-col items-center justify-center" 
    style="background-color: #ffffff;">
    <!-- 載入狀態 -->
    <div v-if="loading"
      class="absolute inset-0 flex items-center justify-center rounded-lg bg-white bg-opacity-90 z-10">
      <UniversalSpinner 
        message="載入雷達圖..." 
        size="lg"
        icon="loader"
      />
    </div>

    <!-- 雷達圖 SVG -->
    <svg :width="width" :height="height" class="overflow-visible" :class="{ 'opacity-50': loading }"
      xmlns="http://www.w3.org/2000/svg" data-chart-svg="business-health-radar">
      <!-- 網格背景 -->
      <g class="grid-lines">
        <path v-for="(grid, index) in gridPaths" :key="`grid-${index}`" :d="grid.path" fill="none" stroke="#e5e7eb"
          :stroke-opacity="grid.opacity" stroke-width="1" />
      </g>

      <!-- 數值標籤 -->
      <g class="value-labels">
        <text v-for="label in valueLabels" :key="`value-${label.value}`" :x="label.x" :y="label.y"
          class="fill-gray-400 text-xs" text-anchor="start" dominant-baseline="middle" :font-family="currentFontFamily">
          {{ label.value }}
        </text>
      </g>

      <!-- 雷達區域 -->
      <g class="radar-area">
        <path :d="radarAreaPath" :fill="hoveredDimension
            ? getDimensionColor(hoveredDimension, 0.2)
            : chartColors[0]
          " :fill-opacity="hoveredDimension ? 0.3 : 0.15" :stroke="hoveredDimension
              ? getDimensionColor(hoveredDimension, 0.8)
              : chartColors[0]
            " :stroke-opacity="hoveredDimension ? 0.8 : 0.4" stroke-width="2" class="transition-all duration-300" />
      </g>

      <!-- 雷達點 -->
      <g class="radar-points">
        <circle v-for="point in radarPoints" :key="`point-${point.key}`" :cx="point.x" :cy="point.y"
          :r="hoveredDimension === point.key ? 6 : 4" :fill="getDimensionColor(point.key, 1)"
          :stroke="hoveredDimension === point.key ? '#ffffff' : 'transparent'"
          :stroke-width="hoveredDimension === point.key ? 2 : 0" class="cursor-pointer transition-all duration-200"
          @mouseenter="handleMouseEnter(point.key)" @mouseleave="handleMouseLeave" />
      </g>

      <!-- 維度標籤 -->
      <g class="dimension-labels">
        <text v-for="point in radarPoints" :key="`label-${point.key}`" :x="point.labelX" :y="point.labelY"
          class="cursor-pointer text-xs font-medium transition-all duration-200" :class="{
            'fill-gray-900': hoveredDimension === point.key,
            'fill-gray-600': hoveredDimension !== point.key,
          }" :text-anchor="point.labelX > config.center.x
              ? 'start'
              : point.labelX < config.center.x
                ? 'end'
                : 'middle'
            " dominant-baseline="middle" :font-family="currentFontFamily" @mouseenter="handleMouseEnter(point.key)"
          @mouseleave="handleMouseLeave">
          {{ point.label }}
        </text>
      </g>

      <!-- 數值顯示 (懸停時) -->
      <g v-if="hoveredDimension" class="value-display">
        <text :x="config.center.x" :y="config.center.y - 5" class="fill-gray-900 text-sm font-bold" text-anchor="middle"
          dominant-baseline="middle" :font-family="currentFontFamily">
          {{
            radarPoints
              .find((p) => p.key === hoveredDimension)
              ?.value.toFixed(1)
          }}
        </text>
        <text :x="config.center.x" :y="config.center.y + 12" class="fill-gray-600 text-xs" text-anchor="middle"
          dominant-baseline="middle" :font-family="currentFontFamily">
          {{radarPoints.find((p) => p.key === hoveredDimension)?.label}}
        </text>
      </g>
    </svg>

    <!-- 圖例 (跟隨圖表位置) -->
    <div class="mt-1 flex justify-center text-xs text-muted-foreground">
      <div class="flex items-center space-x-1">
        <div class="h-2 w-2 rounded-full opacity-60" :style="{ backgroundColor: chartColors[0] }"></div>
        <span>0-10分制</span>
      </div>
    </div>
  </SimpleExportChart>
</template>

<style scoped>
/* 提升 SVG 文字的可讀性 */
text {
  user-select: none;
  pointer-events: none;
}

.dimension-labels text {
  pointer-events: all;
}

.radar-points circle {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

/* 優化懸停動畫 */
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
