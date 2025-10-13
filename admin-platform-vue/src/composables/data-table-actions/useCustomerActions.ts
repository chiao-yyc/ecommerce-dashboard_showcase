import { createModuleLogger } from '@/utils/logger'
import { useDataTableActions } from './useDataTableActions'
import { deleteCustomer } from '@/composables/useCustomer'
import { defaultServiceFactory } from '@/api/services'
import { COMMON_FIELD_MAPPINGS } from '@/utils/export'
import type { ExportOptions, ExportFormat } from '@/utils/export'
import { useXLSXExport } from '@/composables/useXLSXExport'
// import { i18n } from '@/plugins/i18n' // 未使用

// const { t } = i18n.global // 未使用

const log = createModuleLogger('Composable', 'CustomerActions')


export function useCustomerActions(
  options: {
    onSuccessfulDelete?: () => Promise<void>
    onSuccessfulBatchDelete?: () => Promise<void>
    onClearSelection?: () => void | Promise<void>
  } = {},
) {
  // 使用新的 XLSX 匯出 composable
  const { exportCustomers, isExporting } = useXLSXExport()

  // 客戶匯出資料獲取函數（用於 CSV/JSON 匯出）
  const getCustomerExportData = async (customerIds?: string[]) => {
    if (customerIds && customerIds.length > 0) {
      // 匯出特定客戶
      const customerService = defaultServiceFactory.getCustomerService()
      const customers = []
      
      for (const customerId of customerIds) {
        const { success, data } = await customerService.findById(customerId)
        if (success && data) {
          customers.push(data)
        }
      }
      return customers
    } else {
      // 匯出全部客戶（分頁處理）
      const customerService = defaultServiceFactory.getCustomerService()
      const { success, data } = await customerService.fetchCustomersWithPagination({
        page: 1,
        perPage: 1000, // 限制最大匯出數量
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      return success ? data || [] : []
    }
  }

  // 客戶匯出選項
  const customerExportOptions: Partial<ExportOptions> = {
    fieldMapping: COMMON_FIELD_MAPPINGS.customer,
    dateFields: ['createdAt', 'updatedAt', 'lastLoginAt'],
    sensitiveFields: ['email', 'phone', 'address'],
    preprocessor: (customers) => {
      // 扁平化客戶資料，包含統計和狀態資訊
      return customers.map(customer => ({
        ...customer,
        // 狀態翻譯
        statusDisplay: customer.isActive ? '啟用' : '停用',
        // 會員等級顯示
        membershipLevel: customer.membershipLevel || '一般會員',
        // 總訂單數
        totalOrders: customer.totalOrders || 0,
        // 總消費金額
        totalSpent: customer.totalSpent || 0,
        // 最後登入時間
        lastLoginDisplay: customer.lastLoginAt ? new Date(customer.lastLoginAt as string | number | Date).toLocaleDateString() : '從未登入'
      }))
    }
  }

  // 自定義 XLSX 匯出處理函數
  const handleCustomerXLSXExport = async (customerIds?: string[]) => {
    try {
      // 構建篩選條件
      const filters: Record<string, any> = {}
      
      if (customerIds && customerIds.length > 0) {
        // 只匯出指定的客戶
        filters.customer_ids = customerIds
      }

      // 調用 Edge Function 進行 XLSX 匯出
      await exportCustomers(filters)
    } catch (error) {
      log.error('XLSX 匯出失敗:', error)
      throw error
    }
  }
  // 使用通用的 DataTable 操作
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
  } = useDataTableActions({
    detailRouteName: 'customer-detail',
    getDetailParams: (customer: any) => ({ customerNumber: customer.customerNumber }),
    deleteConfirmTitle: '確認刪除客戶',
    deleteConfirmDescription: '您確定要刪除這個客戶嗎？此操作不可復原。',
    batchDeleteConfirmTitle: '確認批量刪除客戶',
    batchDeleteConfirmDescription: (count: number) =>
      `您確定要刪除選中的 ${count} 個客戶嗎？此操作不可復原。`,
    
    // 匯出確認配置
    enableExportConfirm: true,
    exportConfirmTitle: '確認匯出客戶資料',
    exportConfirmDescription: (format) => `您確定要匯出此客戶為 ${format.toUpperCase()} 格式嗎？`,
    batchExportConfirmTitle: '確認批量匯出客戶',
    batchExportConfirmDescription: (count, format) => `您確定要匯出所選的 ${count} 項客戶為 ${format.toUpperCase()} 格式嗎？`,
    
    // 匯出配置（僅用於 CSV 和 JSON）
    exportConfig: {
      getExportData: getCustomerExportData,
      defaultOptions: customerExportOptions,
      supportedFormats: ['csv', 'xlsx', 'json'] // 支援三種格式
    },
    
    // 回調函數配置
    onClearSelection: options.onClearSelection,
    
    onDelete: async (customerId: string) => {
      try {
        const result = await deleteCustomer(customerId)
        if (result.success) {
          if (options.onSuccessfulDelete) {
            await options.onSuccessfulDelete()
          }
        } else {
          throw new Error((result.error as string) || '刪除客戶失敗')
        }
      } catch (error) {
        log.error('刪除客戶時發生錯誤:', error)
        throw error
      }
    },
    onBatchDelete: async (customerIds: string[]) => {
      try {
        // 批量刪除每個客戶
        const deletePromises = customerIds.map((customerId) =>
          deleteCustomer(customerId),
        )
        const results = await Promise.all(deletePromises)

        // 檢查是否所有刪除都成功
        const failedResults = results.filter((result) => !result.success)
        if (failedResults.length > 0) {
          const errorMessages = failedResults
            .map((result) => result.error)
            .join(', ')
          throw new Error(`部分客戶刪除失敗: ${errorMessages}`)
        }

        if (options.onSuccessfulBatchDelete) {
          await options.onSuccessfulBatchDelete()
        }
      } catch (error) {
        log.error('批量刪除客戶時發生錯誤:', error)
        throw error
      }
    },
    onBatchExport: async (data: {
      ids: string[]
      type: 'list' | 'detail'
      format?: ExportFormat
    }) => {
      const { ids, format = 'xlsx' } = data

      if (format === 'xlsx') {
        // 使用 Edge Function 進行 XLSX 匯出
        const customerIds = ids && ids.length > 0 ? ids : undefined
        await handleCustomerXLSXExport(customerIds)
      } else {
        // 使用通用匯出處理 CSV 和 JSON
        const exportData = await getCustomerExportData(ids)
        const options: ExportOptions = {
          filename: `batch_customers_${ids.length}items`,
          suffix: `${ids.length}筆`,
          ...customerExportOptions
        }
        const { exportData: exportDataFn } = await import('@/utils/export')
        await exportDataFn(exportData, format, options)
      }
    },
  })

  return {
    // 狀態
    confirmDialogOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,

    // 方法
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    handleBatchDelete,
    handleBatchExport, // 使用 useDataTableActions 的批量匯出函數（包含確認對話框）

    // 確認對話框方法
    confirm,
    cancel,

    // XLSX 匯出狀態
    isExporting,
  }
}
