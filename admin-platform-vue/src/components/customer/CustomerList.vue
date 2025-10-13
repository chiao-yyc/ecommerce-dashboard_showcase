<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Customer/CustomerList')

import { ref, onMounted } from 'vue'
import { fetchCustomersWithPagination } from '@/composables/useCustomer'
import { useCustomerActions } from '@/composables/data-table-actions'
import type { Customer } from '@/types'
import type { CustomerDataTableMeta } from '@/types/datatable'
import DataTable from '@/components/data-table-async/DataTable.vue'
import { columns } from '@/components/customer/customer-list/columns'
import ConfirmDialog from '@/components/composite/ConfirmDialog.vue'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global
// 使用組合式函數處理客戶操作
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
  confirm,
  cancel,
} = useCustomerActions({
  onSuccessfulDelete: loadCustomers,
  onSuccessfulBatchDelete: async () => {
    await loadCustomers()
    changeRowSelect([]) // 清空選取狀態
  },
  onClearSelection: () => changeRowSelect([]),
})

defineExpose({
  loadCustomers,
})

/** 列表選項 ---- START ---- */
const customers = ref<Customer[]>([])
const selectedIds = ref<string[]>([])

// 分頁與基本狀態
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const perPage = ref(10)
const totalPages = ref(0)
const totalCount = ref(0)
const sortBy = ref<string | undefined>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const searchKeyword = ref<string>('')

// 載入客戶資料
async function loadCustomers() {
  loading.value = true
  error.value = null

  try {
    const response = await fetchCustomersWithPagination({
      page: currentPage.value,
      perPage: perPage.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      searchTerm: searchKeyword.value,
    })

    if (response.success && response.data) {
      customers.value = response.data as Customer[]
      totalPages.value = response.totalPages || 0
      totalCount.value = response.count || 0
    } else {
      error.value = response.error?.toString() || t('errors.loadingFailed')
      customers.value = []
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.unknownError')
    customers.value = []
    log.error('CustomersList 載入錯誤:', err)
  } finally {
    loading.value = false
  }
}

// 處理頁碼變更
async function changePage(page: number) {
  if (loading.value) return // 避免重複載入
  currentPage.value = page
  await loadCustomers()
}

// 處理每頁顯示數量變更
async function changePerPage(newPerPage: number) {
  if (loading.value) return // 避免重複載入
  perPage.value = newPerPage
  currentPage.value = 1
  await loadCustomers()
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

// 處理搜尋變更
async function changeSearch(search: string) {
  if (loading.value) return // 避免重複載入
  searchKeyword.value = search
  currentPage.value = 1
  changeRowSelect([]) // 搜尋變更時清除勾選框，避免選取錯位
  await loadCustomers()
}

// 處理排序變更
function changeSort(sort: { sortBy: string; sortOrder: 'asc' | 'desc' }) {
  log.debug('changeSort', sort)
  // 確保 sortOrder 始終是字符串
  sortBy.value = sort.sortBy
  sortOrder.value = sort.sortOrder
  currentPage.value = 1
  changeRowSelect([])
  loadCustomers()
}

// 處理選取變更
function changeRowSelect(rows: string[]) {
  selectedIds.value = rows
}

// 處理點擊 row
function handleRowClick(customerId: string) {
  // 根據 ID 找到對應的客戶物件
  const customer = customers.value.find(c => c.id === customerId)
  if (customer && handleViewDetail) {
    (handleViewDetail as any)(customer)
  } else {
    log.warn(`Customer not found for ID: ${customerId}`)
  }
}

// 處理 DataTable meta.viewDetail - 根據客戶 ID 查找客戶並跳轉詳情頁
function handleViewDetailByCustomerId(customerId: string) {
  const customer = customers.value.find(c => c.id === customerId)

  if (customer && handleViewDetail) {
    (handleViewDetail as any)(customer)
  } else if (!customer) {
    log.error(`Customer not found for ID: ${customerId}`)
  } else {
    log.error('handleViewDetail function is not available')
  }
}

onMounted(() => {
  loadCustomers()
})
</script>

<template>
  <div>
    <DataTable
      :data="customers"
      :columns="columns"
      :selected-ids="selectedIds"
      :current-page="currentPage"
      :per-page="perPage"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      :total-pages="totalPages"
      :total-count="totalCount"
      :loading="loading"
      row-class="cursor-default"
      @changePage="changePage"
      @changePerPage="changePerPage"
      @changeSearch="changeSearch"
      @changeSort="changeSort"
      @changeRowSelect="changeRowSelect"
      @rowClick="handleRowClick"
      :meta="{
        changeRowSelect,
        currentSortBy: sortBy,
        currentSortOrder: sortOrder,
        deleteRow: handleDeleteRow,
        viewDetail: handleViewDetailByCustomerId,
        exportDetail: handleExportDetail,
        batchDelete: handleBatchDeleteClick,
        batchExport: handleBatchExportClick,
      } satisfies Partial<CustomerDataTableMeta>"
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
