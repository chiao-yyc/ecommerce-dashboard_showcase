<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'DataTable/DataTable')

import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

import { valueUpdater } from '@/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FlexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { ref, watch, watchEffect } from 'vue'
import DataTablePagination from '@/components/data-table-common/DataTablePagination.vue'
import DataTableToolbar from './DataTableToolbar.vue'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  selectedIds?: string[]
  searchColumns?: string[]
  searchPlaceholder?: string
  showToolbar?: boolean
  showPagination?: boolean
  loading?: boolean
  filters?: Array<{
    key: string
    title: string
    options: { label: string; value: string; icon?: any }[]
    selected: any
  }>
  meta?: Record<string, any>
}
const props = withDefaults(defineProps<DataTableProps<any>>(), {
  selectedIds: () => [],
  showToolbar: true,
  showPagination: true,
  loading: false,
})
const emit = defineEmits(['rowClick', 'changeRowSelect'])

const selectable = props.columns.some((column) => column.id === 'select')

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const globalFilter = ref('')

// 分頁狀態：使用 ref 但在初始化時設定正確的值
const pagination = ref({
  pageIndex: 0,
  pageSize: props.showPagination ? 10 : Number.MAX_SAFE_INTEGER,
})

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  meta: {
    get selectedIds() {
      return props.selectedIds
    },
    changeRowSelect: (ids: string[]) => emit('changeRowSelect', ids),
    ...props.meta,
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get pagination() {
      return pagination.value
    },
    get globalFilter() {
      return globalFilter.value
    },
  },
  enableRowSelection: true,
  enableGlobalFilter: true,
  globalFilterFn: (row, _columnId, value) => {
    // 搜尋 type 和 titleTemplate 欄位
    const type = String(row.getValue('type') || '')
    const titleTemplate = String(row.getValue('titleTemplate') || '')
    const searchValue = String(value || '').toLowerCase()

    return (
      type.toLowerCase().includes(searchValue) ||
      titleTemplate.toLowerCase().includes(searchValue)
    )
  },
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  onGlobalFilterChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, globalFilter),
  onPaginationChange: (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      pagination.value = updaterOrValue(pagination.value)
    } else {
      pagination.value = updaterOrValue
    }
  },
  manualPagination: false, // 明確指定為 client-side 分頁
  autoResetPageIndex: false, // 避免資料變更時重置分頁
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: props.showPagination ? 10 : Number.MAX_SAFE_INTEGER,
    },
  },
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})

// 監聽 showPagination 變化，動態更新分頁大小
watch(
  () => props.showPagination,
  (newValue) => {
    pagination.value.pageSize = newValue ? 10 : Number.MAX_SAFE_INTEGER
    pagination.value.pageIndex = 0 // 重置到第一頁
  },
  { immediate: true },
)

// Debug: 使用 watchEffect 在 table 初始化後驗證分頁邏輯
watchEffect(() => {
  log.debug('DataTable Pagination Debug:', {
    showPagination: props.showPagination,
    pageSize: pagination.value.pageSize,
    pageIndex: pagination.value.pageIndex,
    totalData: props.data.length,
    currentPageRows: table.getRowModel().rows.length,
    totalPages: table.getPageCount(),
    tableState: table.getState().pagination,
    manualPagination: false,
  })
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar
      v-if="showToolbar"
      :table="table"
      :searchColumns="searchColumns"
      :searchPlaceholder="props.searchPlaceholder ?? undefined"
      :filters="props.filters ?? undefined"
    />
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
              @click="emit('rowClick', row.original.id)"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              {{ t('components.dataTable.noResults') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div>
      <DataTablePagination
        v-if="showPagination"
        :current-page="(table.getState?.()?.pagination?.pageIndex ?? 0) + 1"
        :per-page="table.getState?.()?.pagination?.pageSize ?? 10"
        :total-pages="table.getPageCount?.() ?? 1"
        :total-count="props.data.length"
        :selected-row-count="props.selectedIds?.length ?? 0"
        :loading="props.loading"
        :selectable="selectable"
        @change-page="(page) => table.setPageIndex?.(page - 1)"
        @change-per-page="(perPage) => table.setPageSize?.(perPage)"
      />
    </div>
  </div>
</template>
