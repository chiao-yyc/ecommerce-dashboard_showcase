<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

import DataTableViewOptions from '@/components/data-table-common/DataTableViewOptions.vue'
import DataTableFacetedFilter from '@/components/data-table-common/DataTableFacetedFilter.vue'

interface FacetedFilterOption {
  label: string
  value: string | boolean
  icon?: any // 可選，若有 icon 傳入
}

interface DataTableToolbarProps<T> {
  table: Table<T>
  searchColumns?: string[]
  searchPlaceholder?: string
  filters?: Array<{
    key: string
    title: string
    options: FacetedFilterOption[]
    selected?: any
  }>
}

const props = withDefaults(defineProps<DataTableToolbarProps<any>>(), {
  searchColumns: () => [],
})

const searchValue = ref('')

function onSearchInput(val: string) {
  searchValue.value = val

  // 如果沒有指定搜尋欄位，使用全域篩選
  if (props.searchColumns.length === 0) {
    props.table.setGlobalFilter(val)
    return
  }

  // 否則使用欄位級篩選
  for (const col of props.searchColumns) {
    const column = props.table.getColumn(col)
    if (column) {
      column.setFilterValue(val)
    }
  }
}

const isFiltered = computed(() => {
  const state = props.table.getState()
  return state.columnFilters.length > 0 || state.globalFilter
})

const resetFilters = () => {
  props.table.resetColumnFilters()
  props.table.resetGlobalFilter()
}

const hasColumnHidden = computed(() => {
  return props.table
    .getAllColumns()
    .some(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    )
})
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex flex-1 items-center space-x-2">
      <Input
        :placeholder="
          props.searchPlaceholder || t('components.dataTable.filterPlaceholder')
        "
        :model-value="searchValue"
        class="h-8 w-[150px] lg:w-[250px]"
        @input="onSearchInput($event.target.value)"
      />
      <template v-for="filter in filters" :key="filter.key">
        <DataTableFacetedFilter
          :title="filter.title"
          :options="filter.options"
          :selected="(table.getColumn(filter.key)?.getFilterValue() as (string | boolean)[]) || []"
          @update:selected="table.getColumn(filter.key)?.setFilterValue($event)"
        />
      </template>

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="resetFilters"
      >
        {{ t('actions.reset') }}
        <X class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <DataTableViewOptions v-if="hasColumnHidden" :table="table" />
  </div>
</template>
