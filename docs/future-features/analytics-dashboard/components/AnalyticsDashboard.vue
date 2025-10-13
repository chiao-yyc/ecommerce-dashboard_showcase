<template>
  <div class="analytics-dashboard">
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-gray-900">產品分析綜合儀表板</h3>
      <p class="text-sm text-gray-600 mt-1">整合所有分析結果的綜合視圖</p>
    </div>

    <!-- 核心指標概覽 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- ABC分析摘要 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="abcSummary">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span class="text-green-600 font-bold text-lg">A</span>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">高價值產品</p>
            <p class="text-2xl font-bold text-gray-900">{{ abcSummary.categoryA.count }}</p>
            <p class="text-xs text-green-600">
              貢獻 {{ abcSummary.categoryA.revenuePercentage.toFixed(1) }}% 營收
            </p>
          </div>
        </div>
      </div>

      <!-- 滯銷品摘要 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="slowMovingSummary">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">滯銷產品</p>
            <p class="text-2xl font-bold text-gray-900">{{ slowMovingSummary.totalSlowMovingProducts }}</p>
            <p class="text-xs text-red-600">
              價值 ${{ formatCurrency(slowMovingSummary.totalSlowMovingValue) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 庫存預警摘要 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="stockAlertSummary">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">庫存預警</p>
            <p class="text-2xl font-bold text-gray-900">{{ stockAlertSummary.totalAlerts }}</p>
            <p class="text-xs text-yellow-600">
              {{ stockAlertSummary.criticalAlerts }} 項緊急
            </p>
          </div>
        </div>
      </div>

      <!-- 毛利分析摘要 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="profitabilitySummary">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">整體毛利率</p>
            <p class="text-2xl font-bold text-gray-900">{{ profitabilitySummary.overallGrossMargin.toFixed(1) }}%</p>
            <p class="text-xs text-blue-600">
              毛利 ${{ formatCurrency(profitabilitySummary.totalGrossProfit) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分析圖表區域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- ABC分析圓餅圖 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="abcSummary">
        <h4 class="text-lg font-medium text-gray-900 mb-4">產品價值分布</h4>
        <div class="h-64 flex items-center justify-center">
          <div class="space-y-4 w-full">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span class="text-sm text-gray-700">A類產品 (高價值)</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-medium">{{ abcSummary.categoryA.count }} 個</span>
                <div class="text-xs text-gray-500">{{ abcSummary.categoryA.revenuePercentage.toFixed(1) }}% 營收</div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span class="text-sm text-gray-700">B類產品 (中等價值)</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-medium">{{ abcSummary.categoryB.count }} 個</span>
                <div class="text-xs text-gray-500">{{ abcSummary.categoryB.revenuePercentage.toFixed(1) }}% 營收</div>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span class="text-sm text-gray-700">C類產品 (低價值)</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-medium">{{ abcSummary.categoryC.count }} 個</span>
                <div class="text-xs text-gray-500">{{ abcSummary.categoryC.revenuePercentage.toFixed(1) }}% 營收</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 風險分析圖 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6" v-if="slowMovingSummary">
        <h4 class="text-lg font-medium text-gray-900 mb-4">庫存風險分布</h4>
        <div class="h-64 flex items-center justify-center">
          <div class="space-y-4 w-full">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-red-600 rounded mr-3"></div>
                <span class="text-sm text-gray-700">極高風險</span>
              </div>
              <span class="text-sm font-medium">{{ slowMovingSummary.riskDistribution.critical }} 個</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                <span class="text-sm text-gray-700">高風險</span>
              </div>
              <span class="text-sm font-medium">{{ slowMovingSummary.riskDistribution.high }} 個</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                <span class="text-sm text-gray-700">中等風險</span>
              </div>
              <span class="text-sm font-medium">{{ slowMovingSummary.riskDistribution.medium }} 個</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span class="text-sm text-gray-700">低風險</span>
              </div>
              <span class="text-sm font-medium">{{ slowMovingSummary.riskDistribution.low }} 個</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 關鍵洞察與建議 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 營收洞察 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4">營收洞察</h4>
        <div class="space-y-3">
          <div class="border-l-4 border-green-500 pl-4" v-if="abcSummary">
            <p class="text-sm font-medium text-green-800">帕累托法則驗證</p>
            <p class="text-xs text-green-600">
              {{ abcSummary.categoryA.percentage.toFixed(1) }}% 的產品貢獻了 {{ abcSummary.categoryA.revenuePercentage.toFixed(1) }}% 的營收
            </p>
          </div>
          <div class="border-l-4 border-blue-500 pl-4" v-if="profitabilitySummary">
            <p class="text-sm font-medium text-blue-800">毛利表現</p>
            <p class="text-xs text-blue-600">
              整體毛利率 {{ profitabilitySummary.overallGrossMargin.toFixed(1) }}%，
              {{ profitabilitySummary.productsAnalyzed }} 個產品參與分析
            </p>
          </div>
        </div>
      </div>

      <!-- 庫存洞察 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4">庫存洞察</h4>
        <div class="space-y-3">
          <div class="border-l-4 border-red-500 pl-4" v-if="slowMovingSummary">
            <p class="text-sm font-medium text-red-800">滯銷風險</p>
            <p class="text-xs text-red-600">
              {{ slowMovingSummary.totalSlowMovingProducts }} 個產品存在滯銷風險，
              總價值 ${{ formatCurrency(slowMovingSummary.totalSlowMovingValue) }}
            </p>
          </div>
          <div class="border-l-4 border-yellow-500 pl-4" v-if="stockAlertSummary">
            <p class="text-sm font-medium text-yellow-800">庫存預警</p>
            <p class="text-xs text-yellow-600">
              {{ stockAlertSummary.totalAlerts }} 項預警，
              其中 {{ stockAlertSummary.criticalAlerts }} 項需緊急處理
            </p>
          </div>
        </div>
      </div>

      <!-- 行動建議 -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-lg font-medium text-gray-900 mb-4">立即行動建議</h4>
        <div class="space-y-3">
          <div class="border-l-4 border-purple-500 pl-4">
            <p class="text-sm font-medium text-purple-800">優先處理</p>
            <p class="text-xs text-purple-600">
              專注於A類產品的庫存管理和營銷投入
            </p>
          </div>
          <div class="border-l-4 border-orange-500 pl-4">
            <p class="text-sm font-medium text-orange-800">清倉處理</p>
            <p class="text-xs text-orange-600">
              對極高風險滯銷品進行促銷或清倉
            </p>
          </div>
          <div class="border-l-4 border-indigo-500 pl-4">
            <p class="text-sm font-medium text-indigo-800">補貨計劃</p>
            <p class="text-xs text-indigo-600">
              及時補充緊急庫存預警的產品
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 趨勢分析 -->
    <div class="bg-white rounded-lg border border-gray-200 p-6">
      <h4 class="text-lg font-medium text-gray-900 mb-4">整體趨勢分析</h4>
      <div class="h-64 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p class="text-sm">綜合趨勢圖表</p>
          <p class="text-xs text-gray-400 mt-1">顯示所有分析維度的時間趨勢</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 
  ABCAnalysisSummary, 
  SlowMovingAnalysisSummary, 
  StockAlertSummary, 
  ProfitabilityAnalysisSummary 
} from '@/types/analytics'

interface Props {
  abcSummary: ABCAnalysisSummary | null
  slowMovingSummary: SlowMovingAnalysisSummary | null
  stockAlertSummary: StockAlertSummary | null
  profitabilitySummary: ProfitabilityAnalysisSummary | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>