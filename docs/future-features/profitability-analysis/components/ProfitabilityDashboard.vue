<template>
  <div class="profitability-dashboard">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-lg font-semibold text-gray-900">產品毛利分析</h3>
        <p class="text-sm text-gray-600 mt-1">分析產品獲利能力與成本結構</p>
      </div>
      <div class="flex items-center space-x-2">
        <select 
          v-model="sortBy" 
          @change="$emit('sort-change', sortBy)"
          class="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="profit">依毛利排序</option>
          <option value="revenue">依營收排序</option>
          <option value="margin">依毛利率排序</option>
          <option value="units">依銷量排序</option>
        </select>
        <button
          @click="exportData"
          class="px-3 py-2 text-xs bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          導出數據
        </button>
      </div>
    </div>

    <!-- 摘要卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" v-if="summary">
      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">總毛利</p>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(summary.totalGrossProfit) }}</p>
            <p class="text-xs text-green-600">{{ summary.overallGrossMargin.toFixed(1) }}% 毛利率</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">總營收</p>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(summary.totalRevenue) }}</p>
            <p class="text-xs text-blue-600">{{ summary.productsAnalyzed }} 個產品</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">總成本</p>
            <p class="text-lg font-semibold text-gray-900">${{ formatCurrency(summary.totalCost) }}</p>
            <p class="text-xs text-orange-600">成本分析</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500">平均毛利率</p>
            <p class="text-lg font-semibold text-gray-900">{{ averageMargin.toFixed(1) }}%</p>
            <p class="text-xs text-purple-600">產品平均</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 績效圖表 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" v-if="summary">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">毛利率分布</h4>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p class="text-sm">毛利率分布圖</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">營收 vs 毛利</h4>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p class="text-sm">散點圖</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 績效表現 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" v-if="summary">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">高獲利產品 (前5名)</h4>
        <div class="space-y-3">
          <div 
            v-for="(product, index) in summary.topPerformers" 
            :key="product.productId"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span class="text-xs font-semibold text-green-600">{{ index + 1 }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ product.productName }}</p>
                <p class="text-xs text-gray-500">{{ product.categoryName || 'No Category' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-green-600">${{ formatCurrency(product.grossProfit) }}</p>
              <p class="text-xs text-gray-500">{{ product.grossMargin.toFixed(1) }}%</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">低毛利產品 (後5名)</h4>
        <div class="space-y-3">
          <div 
            v-for="(product, index) in summary.bottomPerformers" 
            :key="product.productId"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center">
              <div class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span class="text-xs font-semibold text-red-600">{{ index + 1 }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ product.productName }}</p>
                <p class="text-xs text-gray-500">{{ product.categoryName || 'No Category' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-red-600">${{ formatCurrency(product.grossProfit) }}</p>
              <p class="text-xs text-gray-500">{{ product.grossMargin.toFixed(1) }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 詳細數據表格 -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <h4 class="text-md font-medium text-gray-900">產品毛利詳細分析</h4>
      </div>
      
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                排名
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                產品
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                營收
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                成本
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                毛利
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                毛利率
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                銷量
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                單位毛利
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="product in displayedResults" :key="product.productId" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ product.overallRank }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ product.productName }}</div>
                  <div class="text-sm text-gray-500" v-if="product.sku">{{ product.sku }}</div>
                  <div class="text-sm text-gray-500" v-if="product.categoryName">{{ product.categoryName }}</div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${{ formatCurrency(product.totalRevenue) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${{ formatCurrency(product.totalCost) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="product.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'">
                  ${{ formatCurrency(product.grossProfit) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span 
                  :class="[
                    'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                    getMarginBadgeClass(product.grossMargin)
                  ]"
                >
                  {{ product.grossMargin.toFixed(1) }}%
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ product.unitsSold }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="product.profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'">
                  ${{ formatCurrency(product.profitPerUnit) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-4 border-t border-gray-200" v-if="!displayedResults.length">
        <div class="text-center text-gray-500 py-8">
          <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <p class="text-sm">暫無毛利分析數據</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductProfitability, ProfitabilityAnalysisSummary } from '@/types/analytics'

interface Props {
  results: ProductProfitability[]
  summary: ProfitabilityAnalysisSummary | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'sort-change': [sortBy: string]
}>()

const sortBy = ref('profit')

const displayedResults = computed(() => {
  return props.results.slice(0, 50) // 顯示前50項
})

const averageMargin = computed(() => {
  if (props.results.length === 0) return 0
  const totalMargin = props.results.reduce((sum, product) => sum + product.grossMargin, 0)
  return totalMargin / props.results.length
})

function getMarginBadgeClass(margin: number): string {
  if (margin >= 30) return 'bg-green-100 text-green-800'
  if (margin >= 20) return 'bg-yellow-100 text-yellow-800'
  if (margin >= 10) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(amount))
}

function exportData() {
  if (!props.results.length) return
  
  const csvContent = [
    'Rank,Product Name,SKU,Category,Revenue,Cost,Gross Profit,Gross Margin (%),Units Sold,Profit Per Unit',
    ...props.results.map(product => 
      `${product.overallRank},"${product.productName}","${product.sku || ''}","${product.categoryName || ''}",${product.totalRevenue},${product.totalCost},${product.grossProfit},${product.grossMargin.toFixed(2)},${product.unitsSold},${product.profitPerUnit.toFixed(2)}`
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `Profitability_Analysis_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
</script>