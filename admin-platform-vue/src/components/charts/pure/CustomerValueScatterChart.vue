<script setup lang="ts">
import { computed } from 'vue'
import { VisScatter, VisAxis, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { CustomerValueDistribution } from '@/types/dashboard'
import SimpleExportChart from '@/components/common/SimpleExportChart.vue'

interface Props {
  data: CustomerValueDistribution[]
  loading?: boolean
  width?: number
  height?: number
  /** 是否顯示匯出按鈕 */
  showExportButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  width: 600,
  height: 280,
  showExportButton: false,
})

// 匯出配置 - 極簡化版本
const exportTitle = computed(() => {
  return `客戶價值分佈圖 - 共 ${props.data.length} 位客戶`
})


// 轉換數據格式用於圖表
const chartData = computed(() => {
  return props.data.map((customer) => ({
    x: customer.rfmScore, // X軸：RFM分數
    y: customer.ltv, // Y軸：LTV
    size: Math.sqrt(customer.totalSpent / 1000), // 氣泡大小基於總消費金額
    segment: customer.segment,
    customerId: customer.customerId,
    customerName:
      customer.customerName || `客戶-${customer.customerId.slice(-4)}`,
    recency: customer.recency,
    frequency: customer.frequency,
    monetary: customer.monetary,
    totalOrders: customer.totalOrders,
    totalSpent: customer.totalSpent,
  }))
})

// 客戶分群顏色映射
const segmentColors = {
  champions: '#10B981', // 綠色 - 最佳客戶
  loyal_customers: '#3B82F6', // 藍色 - 忠實客戶
  potential_loyalists: '#8B5CF6', // 紫色 - 潛在忠實客戶
  new_customers: '#06B6D4', // 青色 - 新客戶
  at_risk: '#F59E0B', // 橙色 - 有流失風險
  cannot_lose_them: '#EF4444', // 紅色 - 不能失去的客戶
  hibernating: '#6B7280', // 灰色 - 休眠客戶
  lost: '#374151', // 深灰色 - 已流失客戶
}

// 分群標籤映射
const segmentLabels = {
  champions: '冠軍客戶',
  loyal_customers: '忠實客戶',
  potential_loyalists: '潛在忠實',
  new_customers: '新客戶',
  at_risk: '有流失風險',
  cannot_lose_them: '不能失去',
  hibernating: '休眠客戶',
  lost: '已流失',
}

// 獲取客戶分群顏色
const getColor = (d: any) =>
  segmentColors[d.segment as keyof typeof segmentColors] || '#6B7280'

// X軸配置 (RFM分數)
const xAxis = (d: any) => d.x

// Y軸配置 (LTV)
const yAxis = (d: any) => d.y

// 氣泡大小配置
const sizeAccessor = (d: any) => Math.max(d.size, 3) // 最小大小為3

// 格式化函數
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('zh-TW').format(value)
}

// Tooltip 內容
const tooltipTemplate = (data: any) => {
  if (!data) return ''

  return `
    <div class="bg-white p-3 rounded-lg shadow-lg border text-sm max-w-64">
      <div class="font-medium mb-2">${data.customerName}</div>
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-gray-600">分群</span>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${getColor(data)}"></div>
            <span class="font-medium">${segmentLabels[data.segment as keyof typeof segmentLabels]}</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-gray-600">RFM分數</span>
          <span class="font-medium">${data.x.toFixed(1)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-gray-600">終身價值</span>
          <span class="font-medium">${formatCurrency(data.y)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-gray-600">總消費</span>
          <span class="font-medium">${formatCurrency(data.totalSpent)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-gray-600">訂單數</span>
          <span class="font-medium">${formatNumber(data.totalOrders)}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-gray-600">最近購買</span>
          <span class="font-medium">${data.recency}天前</span>
        </div>
      </div>
    </div>
  `
}

// 統計資訊
const stats = computed(() => {
  if (!props.data.length) return null

  const segmentCounts = props.data.reduce(
    (acc, customer) => {
      acc[customer.segment] = (acc[customer.segment] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const totalLTV = props.data.reduce((sum, customer) => sum + customer.ltv, 0)
  const avgLTV = totalLTV / props.data.length

  const topSegments = Object.entries(segmentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([segment, count]) => ({
      segment: segment as keyof typeof segmentLabels,
      count,
      percentage: ((count / props.data.length) * 100).toFixed(1),
    }))

  return {
    totalCustomers: props.data.length,
    avgLTV: Math.round(avgLTV),
    topSegments,
  }
})
</script>

<template>
  <SimpleExportChart
    filename="customer_value_scatter"
    :title="exportTitle"
    mode="auto"
    :show-export-button="showExportButton"
    :disabled="loading"
    class="customer-value-scatter-chart h-full w-full"
    style="background-color: #ffffff;"
  >
    <!-- 載入狀態 -->
    <div v-if="loading" class="flex h-full items-center justify-center">
      <div class="text-center">
        <div
          class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"
        ></div>
        <p class="text-sm text-gray-600">載入客戶價值分析...</p>
      </div>
    </div>

    <!-- 無資料狀態 -->
    <div
      v-else-if="!data || data.length === 0"
      class="flex h-full items-center justify-center"
    >
      <div class="text-center text-gray-500">
        <div class="mb-2 text-4xl">🎯</div>
        <div class="text-sm">暫無客戶價值數據</div>
      </div>
    </div>

    <!-- 圖表內容 -->
    <div v-else class="flex h-full flex-col">
      <!-- 統計面板 -->
      <div v-if="stats" class="mb-3 flex items-center justify-between px-2">
        <div class="flex items-center space-x-4 text-xs">
          <div class="text-center">
            <div class="font-semibold text-gray-900">
              {{ formatNumber(stats.totalCustomers) }}
            </div>
            <div class="text-gray-500">總客戶數</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-gray-900">
              {{ formatCurrency(stats.avgLTV) }}
            </div>
            <div class="text-gray-500">平均LTV</div>
          </div>
        </div>
        <div class="flex items-center space-x-3 text-xs">
          <div
            v-for="item in stats.topSegments"
            :key="item.segment"
            class="flex items-center space-x-1"
          >
            <div
              class="h-2 w-2 rounded-full"
              :style="{ backgroundColor: segmentColors[item.segment] }"
            ></div>
            <span class="text-gray-600">{{ segmentLabels[item.segment] }}</span>
            <span class="font-medium">({{ item.percentage }}%)</span>
          </div>
        </div>
      </div>

      <!-- 圖表區域 -->
      <div class="min-h-0 flex-1">
        <VisXYContainer
          :data="chartData"
          :width="width"
          :height="height - 50"
          class="h-full w-full"
        >
          <!-- 散點圖 -->
          <VisScatter
            :x="xAxis"
            :y="yAxis"
            :size="sizeAccessor"
            :color="getColor"
            :opacity="0.7"
            :stroke-width="1"
            :stroke="'white'"
          />

          <!-- 座標軸 -->
          <VisAxis
            type="x"
            :tick-format="(d: number) => `RFM ${d.toFixed(1)}`"
            :grid-line="true"
          />
          <VisAxis type="y" :tick-format="formatCurrency" :grid-line="true" />

          <!-- Tooltip -->
          <VisTooltip :template="tooltipTemplate" />
        </VisXYContainer>
      </div>

      <!-- 圖例說明 -->
      <div class="mt-2 flex items-center justify-between px-2 text-xs">
        <div class="text-gray-500">
          氣泡大小 = 總消費金額 | X軸 = RFM分數 | Y軸 = 終身價值
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div class="h-2 w-2 rounded-full bg-green-500"></div>
            <span class="text-gray-600">高價值</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="h-2 w-2 rounded-full bg-blue-500"></div>
            <span class="text-gray-600">忠實客戶</span>
          </div>
          <div class="flex items-center space-x-2">
            <div class="h-2 w-2 rounded-full bg-orange-500"></div>
            <span class="text-gray-600">需關注</span>
          </div>
        </div>
      </div>
    </div>
  </SimpleExportChart>
</template>

<style scoped>
.customer-value-scatter-chart {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* 確保圖表容器正確大小 */
:deep(.unovis-xy-container) {
  width: 100% !important;
  height: 100% !important;
}

:deep(.unovis-xy-container svg) {
  width: 100% !important;
  height: 100% !important;
}
</style>
