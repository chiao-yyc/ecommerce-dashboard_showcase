<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
// 型別與 schema 由父層決定，移除 Order 型別依賴

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
import { ref, watchEffect } from 'vue'
import DataTablePagination from '@/components/data-table-common/DataTablePagination.vue'
import DataTableToolbar from './DataTableToolbar.vue'
import type { AnyDataTableMeta } from '@/types/datatable'

interface DataTableProps<T> {
  columnId?: string
  columns: ColumnDef<T, any>[]
  data: T[]
  selectedIds: string[]
  searchPlaceholder?: string
  showPagination?: boolean
  currentPage: number
  perPage: number
  totalPages: number
  totalCount: number
  loading: boolean
  sortBy?: string
  sortOrder?: string
  filters?: Array<{
    key: string
    title: string
    options: { label: string; value: string | boolean; icon?: any }[]
    selected: any
  }>
  rowClass?: string
  meta?: Partial<AnyDataTableMeta>
}

const props = withDefaults(defineProps<DataTableProps<any>>(), {
  showPagination: true,
}) // 型別由父層決定
const emit = defineEmits([
  'changePage',
  'changePerPage',
  'changeSort',
  'changeFilter',
  'changeSearch',
  'changeRowSelect',
  'setRowStatus',
  'setRowRole',
  'deleteRow',
  'editRow',
  'viewDetail',
  'viewProduct',
  'exportDetail',
  'quickSetStock',
  'batchUpdateStatus',
  'batchUpdateRole',
  'batchDelete',
  'batchExport',
  'rowClick',
  'sort',
])

const selectable = props.columns.some((column) => column.id === 'select')

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})
const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})

const table = useVueTable<any>({
  meta: {
    get selectedIds() {
      return props.selectedIds
    },
    get currentSortBy() {
      return props.sortBy
    },
    get currentSortOrder() {
      return props.sortOrder as 'asc' | 'desc' | undefined
    },
    changeRowSelect: (ids: any) => emit('changeRowSelect', ids),
    // common 通用 - 可被外部 meta 覆蓋
    viewDetail: (payload: any) => emit('viewDetail', payload),
    deleteRow: (payload: any) => emit('deleteRow', payload),
    exportDetail: (payload: any) => emit('exportDetail', payload),
    setRowStatus: (payload: any) => emit('setRowStatus', payload), // TODO: 放入通用 data table action
    editRow: (payload: any) => emit('editRow', payload), // TODO: 放入通用，支援觸發 sheet & 連結他頁 sheet
    batchDelete: (ids: any) => emit('batchDelete', ids),
    batchExport: (payload: any) => emit('batchExport', payload),
    // role 角色相關
    batchUpdateRole: (role: any) => emit('batchUpdateRole', role),
    batchUpdateStatus: (status: any) => emit('batchUpdateStatus', status),
    setRowRole: (payload: any) => emit('setRowRole', payload),
    // product inventory 產品相關
    quickSetStock: (payload: any) => emit('quickSetStock', payload),
    viewProduct: (payload: any) => emit('viewProduct', payload),
    // 合併外部傳入的 meta，讓外部 meta 覆蓋預設值
    ...props.meta,
  },
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
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
  },
  manualPagination: true,
  enableRowSelection: true,
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  onPaginationChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, pagination),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})

// 同步外部分頁參數到 TanStack Table 狀態
watchEffect(() => {
  pagination.value = {
    pageIndex: props.currentPage - 1, // TanStack Table 使用 0-based index
    pageSize: props.perPage,
  }
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar
      :table="table"
      :searchPlaceholder="props.searchPlaceholder ?? undefined"
      :filters="props.filters"
      :selected-row-count="selectedIds.length"
      @changeFilter="emit('changeFilter', $event)"
      @changeSearch="emit('changeSearch', $event)"
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
                @sort="emit('changeSort', $event)"
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
              :class="rowClass"
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
              No results.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div>
      <DataTablePagination
        v-if="showPagination"
        :table="table"
        :current-page="currentPage"
        :per-page="perPage"
        :total-pages="totalPages"
        :total-count="totalCount"
        :selected-row-count="selectedIds.length"
        :selectable="selectable"
        :loading="loading"
        @changePage="emit('changePage', $event)"
        @changePerPage="emit('changePerPage', $event)"
      />
    </div>
  </div>
</template>
