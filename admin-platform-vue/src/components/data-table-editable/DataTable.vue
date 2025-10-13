<script setup lang="ts">
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
import { ref } from 'vue'
// import DataTablePagination from './DataTablePagination.vue'
// import DataTableToolbar from './DataTableToolbar.vue'

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  searchColumns?: string[]
  filters?: Array<{
    key: string
    title: string
    options: { label: string; value: string; icon?: any }[]
    selected: any
  }>
}
const props = defineProps<DataTableProps<any>>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
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
  },
  enableRowSelection: true,
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})

// Editable
const editingCell = ref<{ rowId: string; columnId: string } | null>(null)

function isEditing(rowId: string, columnId: string) {
  return (
    editingCell.value?.rowId === rowId &&
    editingCell.value?.columnId === columnId
  )
}

function startEdit(rowId: string, columnId: string) {
  editingCell.value = { rowId, columnId }
}

function endEdit() {
  editingCell.value = null
}
</script>

<template>
  <div class="space-y-4">
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
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :class="[
                  'w-full min-w-0 px-4 py-2 transition-colors',
                  isEditing(row.id, cell.column.id)
                    ? 'outline-ring rounded-sm outline-2 outline-offset-[-2px]'
                    : '',
                ]"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="{
                    ...cell.getContext(),
                    editing: isEditing(row.id, cell.column.id),
                    startEdit: () => startEdit(row.id, cell.column.id),
                    endEdit: () => endEdit(),
                  }"
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
  </div>
</template>
