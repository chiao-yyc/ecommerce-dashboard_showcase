<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Order/OrderList')

import { ref, onMounted, computed } from 'vue'
import {
  fetchOrdersWithPagination,
  updateOrderStatus,
} from '@/composables/useOrder'
import { useOrderActions } from '@/composables/data-table-actions'
import type { Order, OrderStatus } from '@/types'
import type { OrderDataTableMeta } from '@/types/datatable'
import DataTable from '@/components/data-table-async/DataTable.vue'
import { columns } from '@/components/order/order-list/columns'
import { statuses } from '@/components/order/order-list/field-config'
import ConfirmDialog from '@/components/composite/ConfirmDialog.vue'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

// 使用組合式函數處理訂單操作
const {
  confirmDialogOpen,
  dialogType,
  dialogTitle,
  dialogDescription,
  dialogCancelText,
  dialogConfirmText,
  handleViewDetail,
  handleDeleteRow,
  handleExportDetail,
  handleBatchDelete,
  handleBatchExport,
  handleSetRowStatus: _handleSetRowStatus,
  handleBatchUpdateStatus: _handleBatchUpdateStatus,
  confirm,
  cancel,
} = useOrderActions({
  onSuccessfulDelete: loadOrders,
  onSuccessfulBatchDelete: async () => {
    await loadOrders()
    changeRowSelect([])
  },
  onSuccessfulStatusUpdate: loadOrders,
  onClearSelection: () => changeRowSelect([]),
})


const statusFilterOptions = statuses

// 分頁與基本狀態
const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const perPage = ref(10)
const totalPages = ref(0)
const totalCount = ref(0)
const status = ref<OrderStatus[] | undefined>(undefined)

// 多 filter 結構，可自行擴充更多 filter
const filters = computed(() => [
  {
    key: 'status',
    title: t('order.status'),
    options: statusFilterOptions,
    selected: status.value ? status.value.map(String) : [],
  },
  // 例如可加 payment、source 等
])
const sortBy = ref<string | undefined>(undefined)
const sortOrder = ref<'asc' | 'desc'>('asc')

const selectedIds = ref<string[]>([])

// 計算頁碼範圍
// const pageRange = computed(() => {
//   const range: number[] = []
//   const maxVisiblePages = 5
//   const halfVisible = Math.floor(maxVisiblePages / 2)

//   let startPage = Math.max(1, currentPage.value - halfVisible)
//   let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1)

//   if (endPage - startPage + 1 < maxVisiblePages) {
//     startPage = Math.max(1, endPage - maxVisiblePages + 1)
//   }

//   for (let i = startPage; i <= endPage; i++) {
//     range.push(i)
//   }

//   return range
// })

// 載入訂單資料
async function loadOrders() {
  loading.value = true
  error.value = null

  try {
    const response = await fetchOrdersWithPagination({
      page: currentPage.value,
      perPage: perPage.value,
      status: status.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      search: searchKeyword.value,
    })

    if (response.success && response.data) {
      orders.value = response.data as Order[]
      totalPages.value = response.totalPages || 0
      totalCount.value = response.count || 0
    } else {
      error.value = response.error?.toString() || t('errors.loadingFailed')
      orders.value = []
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.unknownError')
    orders.value = []
  } finally {
    loading.value = false
    log.debug('orders.value', orders.value)
  }
}

// 處理訂單狀態變更
async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
  log.debug('handleStatusChange', { orderId, newStatus })
  // 使用獨立的 loading 狀態，避免影響整個列表
  const orderIndex = orders.value.findIndex((o) => o.id === orderId)
  if (orderIndex === -1) return

  try {
    const response = await updateOrderStatus(orderId, newStatus)
    if (response.success) {
      // 更新本地訂單狀態，用展開運算子產生新陣列，確保 reactivity
      orders.value = [
        ...orders.value.slice(0, orderIndex),
        { ...orders.value[orderIndex], status: newStatus },
        ...orders.value.slice(orderIndex + 1),
      ]
    } else {
      error.value = response.error?.toString() || t('errors.updateFailed')
      // 如果失敗，恢復原始狀態
      await loadOrders()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.unknownError')
    // 如果出錯，重新載入訂單
    await loadOrders()
  }
}

// 修改訂單狀態 - 包裝 handleSetRowStatus 以處理本地狀態更新
async function setRowStatus(data: { id: string; status: string }) {
  await handleStatusChange(data.id, data.status as OrderStatus)
}

// 包裝批量操作以傳遞選中的IDs
const handleBatchDeleteClick = () => {
  handleBatchDelete(selectedIds.value)
}

const handleBatchExportClick = async (data: {
  ids: string[]
  type: 'list' | 'detail'
  format?: 'csv' | 'xlsx' | 'json'
}) => {
  await handleBatchExport(data)
}

const handleBatchUpdateStatusClick = (data: {
  ids: string[]
  status: string
}) => {
  _handleBatchUpdateStatus(data.ids, data.status as OrderStatus)
  changeRowSelect([])
}

// 處理頁碼變更
async function changePage(page: number) {
  if (loading.value) return // 避免重複載入
  currentPage.value = page
  await loadOrders()
}

// 處理每頁顯示數量變更
async function changePerPage(newPerPage: number) {
  if (loading.value) return // 避免重複載入
  perPage.value = newPerPage
  currentPage.value = 1
  await loadOrders()
}

// 處理篩選變更
type FilterChange = { key: string; value: any } | undefined
function changeFilter(filterChange: FilterChange) {
  if (!filterChange) {
    // Reset all filters
    status.value = undefined
    // 若有其他 filter 也一起清空
    // payment.value = undefined
    currentPage.value = 1
    changeRowSelect([]) // 篩選重置時清除勾選框，避免選取錯位
    loadOrders()
    return
  }
  const { key, value } = filterChange
  if (key === 'status') status.value = value
  // if (key === 'payment') payment.value = value
  currentPage.value = 1
  changeRowSelect([]) // 篩選變更時清除勾選框，避免選取錯位
  loadOrders()
}

// 處理搜尋變更
const searchKeyword = ref<string>('')

async function changeSearch(search: string) {
  if (loading.value) return // 避免重複載入
  searchKeyword.value = search
  currentPage.value = 1
  changeRowSelect([]) // 搜尋變更時清除勾選框，避免選取錯位
  await loadOrders()
}

// 處理排序變更
async function changeSort(sort: {
  sortBy: string | undefined
  sortOrder: 'asc' | 'desc'
}) {
  if (loading.value) return // 避免重複載入
  log.debug('changeSort', sort)
  sortBy.value = sort.sortBy
  sortOrder.value = sort.sortOrder
  currentPage.value = 1
  changeRowSelect([])
  await loadOrders()
}

// 處理選取變更
function changeRowSelect(rows: string[]) {
  log.debug('changeRowSelect', rows)
  selectedIds.value = rows
}

// 格式化金額
// function formatCurrency(amount: number) {
//   return new Intl.NumberFormat('zh-TW', {
//     style: 'currency',
//     currency: 'TWD',
//     minimumFractionDigits: 0,
//   }).format(amount)
// }

// 處理點擊 row
function handleRowClick(orderId: string) {
  // 根據 ID 找到對應的訂單物件
  const order = orders.value.find(o => o.id === orderId)
  if (order && handleViewDetail) {
    (handleViewDetail as any)(order)
  } else {
    log.warn(`Order not found for ID: ${orderId}`)
  }
}

// 處理 DataTable meta.viewDetail - 根據訂單 ID 查找訂單並跳轉詳情頁
function handleViewDetailByOrderId(orderId: string) {
  const order = orders.value.find(o => o.id === orderId)

  if (order && handleViewDetail) {
    (handleViewDetail as any)(order)
  } else if (!order) {
    log.error(`Order not found for ID: ${orderId}`)
  } else {
    log.error('handleViewDetail function is not available')
  }
}

onMounted(async () => {
  // 載入訂單資料
  await loadOrders()
})
</script>

<template>
  <div>
    <!-- New 訂單列表 -->
    <DataTable
      :data="orders"
      :columns="columns"
      :selected-ids="selectedIds"
      :filters="filters"
      :current-page="currentPage"
      :per-page="perPage"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :total-pages="totalPages"
      :total-count="totalCount"
      :loading="loading"
      @changePage="changePage"
      @changePerPage="changePerPage"
      @changeFilter="changeFilter"
      @changeSearch="changeSearch"
      @changeSort="changeSort"
      @changeRowSelect="changeRowSelect"
      @rowClick="handleRowClick"
      :meta="{
        changeRowSelect,
        currentSortBy: sortBy,
        currentSortOrder: sortOrder,
        setRowStatus: setRowStatus,
        deleteRow: handleDeleteRow,
        viewDetail: handleViewDetailByOrderId,
        exportDetail: handleExportDetail,
        batchUpdateStatus: handleBatchUpdateStatusClick,
        batchDelete: handleBatchDeleteClick,
        batchExport: handleBatchExportClick,
      } satisfies Partial<OrderDataTableMeta>"
    />

  </div>

  <!-- 確認對話框 -->
  <ConfirmDialog
    v-model:open="confirmDialogOpen"
    :type="dialogType"
    :title="dialogTitle"
    :description="dialogDescription"
    :cancelText="dialogCancelText"
    :confirmText="dialogConfirmText"
    @cancel="cancel"
    @confirm="confirm"
  />
</template>
