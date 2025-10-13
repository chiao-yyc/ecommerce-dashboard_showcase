<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  /** 圖表類型 - 影響 skeleton 布局 */
  type?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'default'
  /** 是否顯示圖例 */
  showLegend?: boolean
  /** 容器樣式類別 */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  showLegend: true,
})

// 根據類型決定布局
const chartLayout = computed(() => {
  const layouts = {
    pie: { shape: 'rounded-full', aspectRatio: 'aspect-square', showAxes: false },
    donut: { shape: 'rounded-full', aspectRatio: 'aspect-square', showAxes: false },
    bar: { shape: 'rounded-md', aspectRatio: 'aspect-[2/1]', showAxes: true },
    line: { shape: 'rounded-md', aspectRatio: 'aspect-[2/1]', showAxes: true },
    area: { shape: 'rounded-md', aspectRatio: 'aspect-[2/1]', showAxes: true },
    scatter: { shape: 'rounded-md', aspectRatio: 'aspect-[2/1]', showAxes: true },
    default: { shape: 'rounded-md', aspectRatio: 'aspect-[2/1]', showAxes: false },
  }
  return layouts[props.type] || layouts.default
})
</script>

<template>
  <div :class="cn('flex h-full w-full flex-col space-y-3 p-4', props.class)">
    <!-- 標題骨架 (固定高度，不壓縮) -->
    <div class="flex flex-shrink-0 items-center justify-between">
      <Skeleton class="h-5 w-24 md:w-32" />
      <Skeleton v-if="showLegend" class="h-4 w-16 md:w-20" />
    </div>

    <!-- 圖表主體 (自適應高度) -->
    <div class="flex flex-1 min-h-0 items-center justify-center">
      <Skeleton
        :class="cn(
          chartLayout.shape,
          chartLayout.aspectRatio,
          'w-full max-h-full'
        )"
      />
    </div>

    <!-- 軸標籤 (固定高度，不壓縮) -->
    <div v-if="chartLayout.showAxes" class="flex flex-shrink-0 justify-between">
      <Skeleton class="h-3 w-8" v-for="i in 4" :key="i" />
    </div>
  </div>
</template>
