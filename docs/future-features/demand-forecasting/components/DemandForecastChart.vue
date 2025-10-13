<template>
  <div class="demand-forecast-chart">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">需求預測分析</h3>
        <p class="text-sm text-gray-600 mt-1">基於歷史數據預測未來需求趨勢</p>
      </div>
      <div class="flex items-center space-x-2">
        <select 
          v-model="selectedMethod" 
          @change="$emit('method-change', selectedMethod)"
          class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="simple_ma">簡單移動平均</option>
          <option value="weighted_ma">加權移動平均</option>
          <option value="seasonal_adjusted">季節性調整</option>
        </select>
        <button
          @click="exportData"
          class="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          導出預測
        </button>
      </div>
    </div>

    <!-- 預測摘要 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" v-if="forecasts.length">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">預測總需求</p>
            <p class="text-lg font-semibold text-gray-900">{{ totalPredictedDemand }}</p>
            <p class="text-xs text-blue-600">未來{{ forecastDays }}天</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">平均信心度</p>
            <p class="text-lg font-semibold text-gray-900">{{ (averageConfidence * 100).toFixed(1) }}%</p>
            <p class="text-xs text-green-600">預測準確度</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">趨勢方向</p>
            <p class="text-lg font-semibold text-gray-900">{{ dominantTrend }}</p>
            <p class="text-xs text-purple-600">整體趨勢</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">預測方法</p>
            <p class="text-lg font-semibold text-gray-900">{{ getMethodName(selectedMethod) }}</p>
            <p class="text-xs text-orange-600">算法模型</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 預測圖表 -->
    <div class="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h4 class="text-md font-medium text-gray-900 mb-4">需求趨勢預測圖</h4>
      <div class="h-80 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
          </svg>
          <p class="text-sm">預測趨勢圖表將在此顯示</p>
          <p class="text-xs text-gray-400 mt-1">包含歷史數據與未來預測</p>
        </div>
      </div>
    </div>

    <!-- 預測準確性指標 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" v-if="accuracy.length">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">預測準確性指標</h4>
        <div class="space-y-4">
          <div v-for="acc in accuracy" :key="acc.productId" class="border-b border-gray-100 pb-3 last:border-b-0">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700">{{ acc.method.toUpperCase() }}</span>
              <span class="text-xs text-gray-500">{{ formatDate(acc.lastUpdated) }}</span>
            </div>
            <div class="grid grid-cols-3 gap-3 text-sm">
              <div>
                <span class="text-gray-500">MAPE</span>
                <p class="font-semibold">{{ acc.mape.toFixed(2) }}%</p>
              </div>
              <div>
                <span class="text-gray-500">MAE</span>
                <p class="font-semibold">{{ acc.mae.toFixed(2) }}</p>
              </div>
              <div>
                <span class="text-gray-500">RMSE</span>
                <p class="font-semibold">{{ acc.rmse.toFixed(2) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">方法比較</h4>
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-900">簡單移動平均</p>
              <p class="text-xs text-gray-500">適用於穩定需求</p>
            </div>
            <div class="text-right">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                中等準確度
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-900">加權移動平均</p>
              <p class="text-xs text-gray-500">重視近期數據</p>
            </div>
            <div class="text-right">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                較高準確度
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p class="text-sm font-medium text-gray-900">季節性調整</p>
              <p class="text-xs text-gray-500">考慮季節變化</p>
            </div>
            <div class="text-right">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                最高準確度
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 預測詳細數據 -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h4 class="text-md font-medium text-gray-900">預測詳細數據</h4>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                日期
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                預測需求
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                信心度
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                趨勢
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                歷史平均
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                季節因子
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                預測方法
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="forecast in displayedForecasts" :key="forecast.forecastDate" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(forecast.forecastDate) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ forecast.predictedDemand }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span 
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    getConfidenceBadgeClass(forecast.confidenceLevel)
                  ]"
                >
                  {{ (forecast.confidenceLevel * 100).toFixed(1) }}%
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span 
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    getTrendBadgeClass(forecast.trend)
                  ]"
                >
                  {{ getTrendText(forecast.trend) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ forecast.historicalAverage.toFixed(1) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ forecast.seasonalFactor ? forecast.seasonalFactor.toFixed(2) : '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getMethodName(forecast.method) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-4 border-t border-gray-200" v-if="!displayedForecasts.length">
        <div class="text-center text-gray-500 py-8">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p class="text-sm">暫無預測數據</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DemandForecast, ForecastAccuracy } from '@/types/analytics'

interface Props {
  forecasts: DemandForecast[]
  accuracy: ForecastAccuracy[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'method-change': [method: string]
}>()

const selectedMethod = ref('weighted_ma')

const displayedForecasts = computed(() => {
  return props.forecasts.slice(0, 30) // 顯示前30天預測
})

const totalPredictedDemand = computed(() => {
  return props.forecasts.reduce((sum, forecast) => sum + forecast.predictedDemand, 0)
})

const averageConfidence = computed(() => {
  if (props.forecasts.length === 0) return 0
  const totalConfidence = props.forecasts.reduce((sum, forecast) => sum + forecast.confidenceLevel, 0)
  return totalConfidence / props.forecasts.length
})

const dominantTrend = computed(() => {
  const trendCounts = props.forecasts.reduce((acc, forecast) => {
    acc[forecast.trend] = (acc[forecast.trend] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const trends = Object.entries(trendCounts)
  if (trends.length === 0) return '穩定'
  
  const dominant = trends.reduce((max, current) => 
    current[1] > max[1] ? current : max
  )[0]
  
  return getTrendText(dominant)
})

const forecastDays = computed(() => props.forecasts.length)

function getMethodName(method: string): string {
  const map = {
    simple_ma: '簡單移動平均',
    weighted_ma: '加權移動平均',
    seasonal_adjusted: '季節性調整'
  }
  return map[method as keyof typeof map] || method
}

function getTrendText(trend: string): string {
  const map = {
    increasing: '上升',
    decreasing: '下降',
    stable: '穩定'
  }
  return map[trend as keyof typeof map] || trend
}

function getTrendBadgeClass(trend: string): string {
  switch (trend) {
    case 'increasing':
      return 'bg-green-100 text-green-800'
    case 'decreasing':
      return 'bg-red-100 text-red-800'
    case 'stable':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getConfidenceBadgeClass(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800'
  if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

function exportData() {
  if (!props.forecasts.length) return
  
  const csvContent = [
    'Date,Predicted Demand,Confidence Level,Trend,Historical Average,Seasonal Factor,Method',
    ...props.forecasts.map(forecast => 
      `"${forecast.forecastDate}",${forecast.predictedDemand},${(forecast.confidenceLevel * 100).toFixed(1)}%,"${getTrendText(forecast.trend)}",${forecast.historicalAverage.toFixed(1)},${forecast.seasonalFactor || ''},"${getMethodName(forecast.method)}"`
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Demand_Forecast_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
</script>