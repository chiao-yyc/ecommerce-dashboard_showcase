<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'
// 完全抽象化，移除 Order 型別依賴
import { cn } from '@/utils'
import { Button } from '@/components/ui/button'
import { ArrowDownIcon } from 'lucide-vue-next'

import { ArrowUpIcon } from 'lucide-vue-next'
import { ChevronsUpDown } from 'lucide-vue-next'

export interface DataTableColumnHeaderProps<T = any> {
  column: Column<T, any>
  title: string
  // 外部排序狀態，用於 async table
  currentSortBy?: string
  currentSortOrder?: 'asc' | 'desc'
}

const emit = defineEmits(['sort'])

const props = defineProps<DataTableColumnHeaderProps>()

// 計算當前欄位的排序狀態
const getCurrentSortState = () => {
  if (props.currentSortBy !== props.column.id) {
    return null // 無排序
  }
  return props.currentSortOrder || 'asc'
}

// 計算下一個排序狀態
const getNextSortState = () => {
  const currentState = getCurrentSortState()
  
  if (currentState === null) {
    return { sortBy: props.column.id, sortOrder: 'asc' as const }
  } else if (currentState === 'asc') {
    return { sortBy: props.column.id, sortOrder: 'desc' as const }
  } else {
    return { sortBy: undefined, sortOrder: 'asc' as const } // 回到無排序
  }
}
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>

<template>
  <div
    v-if="column.getCanSort()"
    :class="cn('flex items-center space-x-2', $attrs.class ?? '')"
  >
    <Button
      variant="ghost"
      size="sm"
      class="data-[state=open]:bg-accent -ml-3 h-8"
      @click="
        () => {
          const nextState = getNextSortState()
          emit('sort', nextState)
        }
      "
    >
      <span>{{ title }}</span>
      <ArrowDownIcon
        v-if="getCurrentSortState() === 'desc'"
        class="ml-2 h-4 w-4"
      />
      <ArrowUpIcon
        v-else-if="getCurrentSortState() === 'asc'"
        class="ml-2 h-4 w-4"
      />
      <ChevronsUpDown v-else class="ml-2 h-4 w-4" />
    </Button>
  </div>

  <div v-else :class="$attrs.class">
    {{ title }}
  </div>
</template>
