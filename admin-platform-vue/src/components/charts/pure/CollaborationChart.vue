<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'
import { ref, computed, watch } from 'vue'
import { VisScatter } from '@unovis/vue'
import { BulletShape } from '@unovis/ts'
import XYContainer from '@/components/charts/base/XYContainer.vue'

const log = createModuleLogger('Component', 'CollaborationChart')

type CollaborationDataRecord = {
  concurrentCampaigns: number
  campaignCombination: string
  occurrenceCount: number
  combinationRevenue: number
  avgOrderValue: number
  revenueSharePct: number
  collaborationType: string
}

const props = defineProps<{
  data: CollaborationDataRecord[]
  width?: number
  height?: number
}>()

// Debug: 輸出實際接收的數據
watch(
  () => props.data,
  (newData) => {
    log.debug('🔍 CollaborationChart 接收數據:', newData)
    log.debug('🔍 數據類型:', {
      type: typeof newData,
      isArray: Array.isArray(newData) ? '(Array)' : '(Not Array)'
    })
    if (Array.isArray(newData) && newData.length > 0) {
      log.debug('🔍 第一筆數據:', newData[0])
    }
  },
  { immediate: true },
)

// AOV 顏色映射函數 - 用漸變顏色表示平均訂單價值
const getAOVColor = (avgOrderValue: number): string => {
  // 根據AOV範圍映射顏色（低到高：藍色到紅色漸變）
  if (avgOrderValue <= 1000) return '#3B82F6' // 藍色 - 低AOV
  if (avgOrderValue <= 2000) return '#8B5CF6' // 紫色 - 中AOV  
  if (avgOrderValue <= 3000) return '#EF4444' // 紅色 - 高AOV
  return '#DC2626' // 深紅色 - 超高AOV
}

const chartConfig = ref({
  x: (d: CollaborationDataRecord) => d.concurrentCampaigns,
  y: (d: CollaborationDataRecord) => d.combinationRevenue,
  size: (d: CollaborationDataRecord) => Math.sqrt(d.occurrenceCount) * 8, // 根據出現次數調整大小，增加係數
  // 根據平均訂單價值設置顏色漸變
  color: (d: CollaborationDataRecord) => getAOVColor(d.avgOrderValue),
})

const auxiliary = ref({
  axis: [
    {
      type: 'x',
      position: 'bottom',
      label: '併發活動數量',
      tickFormat: (d: number) => `${d}個`,
    },
    {
      type: 'y',
      position: 'left',
      label: '組合營收 (TWD)',
      tickFormat: (d: number) => formatCurrencyShort(d),
    },
  ],
  legend: {
    items: [
      {
        name: '低AOV (≤1000)',
        shape: BulletShape.Circle,
        color: '#3B82F6'
      },
      {
        name: '中AOV (1000-2000)',
        shape: BulletShape.Circle,
        color: '#8B5CF6'
      },
      {
        name: '高AOV (2000-3000)',
        shape: BulletShape.Circle,
        color: '#EF4444'
      },
      {
        name: '超高AOV (>3000)',
        shape: BulletShape.Circle,
        color: '#DC2626'
      },
    ],
  },
  tooltip: {
    // Use template instead of triggers to avoid selector issues
    template: (d: any) => {
      const collaboration = d?.data || d
      if (!collaboration) return ''

      const aovLevel = collaboration.avgOrderValue <= 1000 ? '低AOV' :
                      collaboration.avgOrderValue <= 2000 ? '中AOV' :
                      collaboration.avgOrderValue <= 3000 ? '高AOV' : '超高AOV'

      return `
          <div class="p-3 max-w-sm">
            <div class="text-sm font-semibold mb-2">${getCollaborationTypeLabel(collaboration.collaborationType)} - ${aovLevel}</div>
            <div class="text-xs space-y-1">
              <div class="mb-2">
                <div class="font-medium text-foreground">活動組合:</div>
                <div class="text-muted-foreground text-xs leading-relaxed">${collaboration.campaignCombination}</div>
              </div>
              <div class="border-t pt-1 space-y-1">
                <div class="flex justify-between">
                  <span>併發活動:</span>
                  <span class="font-medium">${collaboration.concurrentCampaigns}個</span>
                </div>
                <div class="flex justify-between">
                  <span>出現次數:</span>
                  <span class="font-medium" style="color: ${getAOVColor(collaboration.avgOrderValue)}">${collaboration.occurrenceCount}</span>
                </div>
                <div class="flex justify-between">
                  <span>組合營收:</span>
                  <span class="font-medium text-green-600">${formatCurrency(collaboration.combinationRevenue)}</span>
                </div>
                <div class="flex justify-between">
                  <span>平均訂單價值:</span>
                  <span class="font-medium" style="color: ${getAOVColor(collaboration.avgOrderValue)}">${formatCurrency(collaboration.avgOrderValue)}</span>
                </div>
                <div class="flex justify-between">
                  <span>營收佔比:</span>
                  <span class="font-medium text-purple-600">${collaboration.revenueSharePct?.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        `
    }
  }
})

// 輔助函數
function getCollaborationTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    single_campaign: '單一活動',
    dual_collaboration: '雙活動協作',
    multi_collaboration: '多活動協作',
  }
  return typeLabels[type] || type
}

function formatCurrency(amount: number | undefined): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`
  }
  return amount.toString()
}

// 計算 legend 數據供父組件使用
const legendItems = computed(() => auxiliary.value.legend.items)

// 暴露給父組件
defineExpose({
  legendItems,
})
</script>

<template>
  <!-- 散點圖：寬螢幕比例 -->
  <!-- <div class="w-full max-w-full overflow-hidden">
    <div class="aspect-[16/10] w-full"> -->
  <XYContainer :data="props.data" :auxiliary="auxiliary" :chart-config="chartConfig" :containerSize="{
    width: props.width || 800,
    height: props.height || 400,
  }">
    <VisScatter v-bind="chartConfig" />
  </XYContainer>
  <!-- </div>
  </div> -->
</template>
