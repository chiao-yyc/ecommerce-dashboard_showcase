<script setup lang="ts">
// 完全抽象化，移除 Order 型別依賴
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { ChevronRightIcon } from 'lucide-vue-next'

import { ChevronsLeft } from 'lucide-vue-next'
import { ChevronsRight } from 'lucide-vue-next'

interface DataTablePaginationProps {
  currentPage: number
  perPage: number
  totalPages: number
  totalCount: number
  selectedRowCount: number
  selectable?: boolean
  loading: boolean
}
const props = withDefaults(defineProps<DataTablePaginationProps>(), {
  currentPage: 1,
  perPage: 10,
  totalPages: 1,
  totalCount: 0,
  selectedRowCount: 0,
  selectable: false,
  loading: false,
})
const emit = defineEmits(['changePage', 'changePerPage'])
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <div>
      <div v-if="selectable" class="text-muted-foreground flex-1 text-sm">
        {{
          $t('components.dataTable.selectedRows', {
            count: selectedRowCount,
            total: totalCount,
          })
        }}
      </div>
    </div>
    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">
          {{ $t('components.dataTable.rowsPerPage') }}
        </p>
        <Select
          :model-value="perPage"
          @update:model-value="(value) => emit('changePerPage', value)"
        >
          <SelectTrigger class="h-8 w-[70px]">
            <SelectValue :placeholder="String(perPage)" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem
              v-for="pageSize in [10, 20, 30, 40, 50]"
              :key="pageSize"
              :value="pageSize"
            >
              {{ pageSize }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex w-fit items-center justify-center text-sm font-medium">
        {{
          $t('components.dataTable.currentPage', {
            page: props.currentPage,
            total: props.totalPages,
          })
        }}
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!props.loading && props.currentPage === 1"
          @click="emit('changePage', 1)"
        >
          <span class="sr-only">Go to first page</span>
          <ChevronsLeft class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!props.loading && props.currentPage === 1"
          @click="emit('changePage', props.currentPage - 1)"
        >
          <span class="sr-only">Go to previous page</span>
          <ChevronLeftIcon class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!props.loading && props.currentPage === props.totalPages"
          @click="emit('changePage', props.currentPage + 1)"
        >
          <span class="sr-only">Go to next page</span>
          <ChevronRightIcon class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!props.loading && props.currentPage === props.totalPages"
          @click="emit('changePage', props.totalPages)"
        >
          <span class="sr-only">Go to last page</span>
          <ChevronsRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
