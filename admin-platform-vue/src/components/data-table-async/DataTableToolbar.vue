<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

import DataTableViewOptions from '@/components/data-table-common/DataTableViewOptions.vue'
import DataTableFacetedFilter from '@/components/data-table-common/DataTableFacetedFilter.vue'

interface FacetedFilterOption {
  label: string
  value: string | boolean
  icon?: any // 可選，若有 icon 傳入
}

interface DataTableToolbarProps<T = any> {
  table: Table<T>
  search?: string
  searchPlaceholder?: string
  filters?: Array<{
    key: string
    title: string
    options: FacetedFilterOption[]
    selected: any
  }>
  selectedRowCount?: number
}

const props = defineProps<DataTableToolbarProps>()
const emit = defineEmits([
  'changeFilter',
  'changePage',
  'changePerPage',
  'changeSearch',
])

const isFiltered = computed(() =>
  props.filters?.some((filter) =>
    Array.isArray(filter.selected) ? filter.selected.length > 0 : false,
  ),
)
// const isSelected = computed(
//   () => props.selectedRowCount && props.selectedRowCount > 0,
// )

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
          props.searchPlaceholder || $t('actions.searchPlaceholder')
        "
        :model-value="search"
        class="h-8 w-[150px] lg:w-[250px]"
        @keydown.enter="emit('changeSearch', $event.target.value)"
      />
      <template v-for="filter in filters" :key="filter.key">
        <DataTableFacetedFilter
          :selected="filter.selected"
          :title="filter.title"
          :options="filter.options"
          @update:selected="
            (value) => emit('changeFilter', { key: filter.key, value })
          "
        />
      </template>

      <Button
        v-if="isFiltered"
        variant="ghost"
        class="h-8 px-2 lg:px-3"
        @click="emit('changeFilter', undefined)"
      >
        Reset
        <X class="ml-2 h-4 w-4" />
      </Button>
    </div>
    <div class="flex items-center space-x-2">
      <DataTableViewOptions
        v-if="hasColumnHidden"
        :table="table"
        @changePage="emit('changePage', $event)"
        @changePerPage="emit('changePerPage', $event)"
      />
    </div>
  </div>
</template>
