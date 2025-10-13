import { createModuleLogger } from '@/utils/logger'
import { useDataTableActions } from './useDataTableActions'
import { deleteProduct, fetchInventoriesWithPagination, getInventoryStatusById } from '@/composables/useProduct'
import { COMMON_FIELD_MAPPINGS } from '@/utils/export'
import type { ExportOptions, ExportFormat } from '@/utils/export'
import { useXLSXExport } from '@/composables/useXLSXExport'
// import { i18n } from '@/plugins/i18n' // 未使用

// const { t } = i18n.global // 未使用

const log = createModuleLogger('Composable', 'InventoryActions')


export function useInventoryActions(
  options: {
    onSuccessfulDelete?: () => Promise<void>
    onSuccessfulBatchDelete?: () => Promise<void>
    onClearSelection?: () => void | Promise<void>
  } = {},
) {
  // 使用新的 XLSX 匯出 composable
  const { exportInventory, isExporting } = useXLSXExport()
  // 庫存匯出資料獲取函數
  const getInventoryExportData = async (inventoryIds?: string[]) => {
    if (inventoryIds && inventoryIds.length > 0) {
      // 匯出特定庫存項目
      // inventoryIds 實際上是 productIds，因為庫存是以產品為基礎的
      const inventories = []
      
      for (const productId of inventoryIds) {
        const { success, data } = await getInventoryStatusById(productId)
        if (success && data) {
          inventories.push(data)
        }
      }
      return inventories
    } else {
      // 匯出全部庫存（分頁處理）
      const { success, data } = await fetchInventoriesWithPagination({
        page: 1,
        perPage: 1000, // 限制最大匯出數量
        sortBy: 'stock_status_order',
        sortOrder: 'asc'
      })
      return success ? data || [] : []
    }
  }

  // 庫存狀態顯示轉換
  const getStockStatusDisplay = (stockStatus: string): string => {
    const statusMap: Record<string, string> = {
      'in_stock': '有庫存',
      'low_stock': '庫存不足',
      'out_of_stock': '無庫存',
      'overstock': '庫存過多'
    }
    return statusMap[stockStatus] || stockStatus
  }

  // 庫存匯出選項
  const inventoryExportOptions: Partial<ExportOptions> = {
    fieldMapping: {
      ...COMMON_FIELD_MAPPINGS.product,
      stockQuantity: '庫存數量',
      stockReserved: '預留庫存',
      stockAvailable: '可用庫存',
      stockThreshold: '庫存警戒值',
      stockStatus: '庫存狀態',
      stockValue: '庫存價值',
      lastStockUpdate: '最後庫存更新'
    },
    dateFields: ['createdAt', 'updatedAt', 'lastStockUpdate'],
    currencyFields: ['price', 'stockValue'],
    preprocessor: (inventories) => {
      // 扁平化庫存資料，包含庫存相關計算
      return inventories.map(inventory => ({
        ...inventory,
        // 庫存狀態翻譯
        stockStatusDisplay: getStockStatusDisplay((inventory.stockStatus as string) || ''),
        // 計算庫存價值
        stockValue: ((inventory.stockQuantity as number) || 0) * ((inventory.price as number) || 0),
        // 庫存健康度
        stockHealthy: ((inventory.stockQuantity as number) || 0) > ((inventory.stockThreshold as number) || 0) ? '健康' : '警戒',
        // 分類顯示
        categoryDisplay: (inventory.category as any)?.name || '未分類'
      }))
    }
  }

  // 自定義 XLSX 匯出處理函數
  const handleInventoryXLSXExport = async (inventoryIds?: string[]) => {
    try {
      // 構建篩選條件
      const filters: Record<string, any> = {}
      
      if (inventoryIds && inventoryIds.length > 0) {
        // 只匯出指定的庫存項目（inventoryIds 實際上是 productIds）
        filters.inventory_ids = inventoryIds
      }

      // 調用 Edge Function 進行 XLSX 匯出
      await exportInventory(filters)
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
    confirm,
    cancel,
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    handleBatchDelete,
    handleBatchExport,
  } = useDataTableActions({
    detailRouteName: 'inventory-detail',
    getDetailParams: (item: any) => ({ sku: item.sku }),
    deleteConfirmTitle: '確認刪除庫存項目',
    deleteConfirmDescription: '您確定要刪除這個庫存項目嗎？此操作不可復原。',
    batchDeleteConfirmTitle: '確認批量刪除庫存項目',
    batchDeleteConfirmDescription: (count: number) =>
      `您確定要刪除選中的 ${count} 個庫存項目嗎？此操作不可復原。`,
    
    // 匯出確認配置
    enableExportConfirm: true,
    exportConfirmTitle: '確認匯出庫存資料',
    exportConfirmDescription: (format) => `您確定要匯出此庫存為 ${format.toUpperCase()} 格式嗎？`,
    batchExportConfirmTitle: '確認批量匯出庫存',
    batchExportConfirmDescription: (count, format) => `您確定要匯出所選的 ${count} 項庫存為 ${format.toUpperCase()} 格式嗎？`,
    
    // 匯出配置（僅用於 CSV 和 JSON）
    exportConfig: {
      getExportData: getInventoryExportData,
      defaultOptions: inventoryExportOptions,
      supportedFormats: ['csv', 'xlsx', 'json'] // 支援三種格式
    },
    
    // 回調函數配置
    onClearSelection: options.onClearSelection,
    
    onDelete: async (inventoryId: string) => {
      try {
        const result = await deleteProduct(inventoryId)
        if (result.success) {
          if (options.onSuccessfulDelete) {
            await options.onSuccessfulDelete()
          }
        } else {
          throw new Error((result.error as string) || '刪除庫存項目失敗')
        }
      } catch (error) {
        log.error('刪除庫存項目時發生錯誤:', error)
        throw error
      }
    },
    onBatchDelete: async (inventoryIds: string[]) => {
      try {
        // 批量刪除庫存項目
        const deletePromises = inventoryIds.map(id => deleteProduct(id))
        const results = await Promise.all(deletePromises)

        // 檢查是否所有刪除都成功
        const failedResults = results.filter(result => !result.success)
        if (failedResults.length > 0) {
          const errorMessages = failedResults
            .map(result => result.error)
            .join(', ')
          throw new Error(
            `部分刪除失敗 (成功: ${inventoryIds.length - failedResults.length}, 失敗: ${failedResults.length}): ${errorMessages}`
          )
        }

        if (options.onSuccessfulBatchDelete) {
          await options.onSuccessfulBatchDelete()
        }
      } catch (error) {
        log.error('批量刪除庫存項目時發生錯誤:', error)
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
        await handleInventoryXLSXExport(ids)
      } else {
        // 使用通用匯出處理 CSV 和 JSON
        const exportData = await getInventoryExportData(ids)
        const options: ExportOptions = {
          filename: `batch_inventory_${ids.length}items`,
          suffix: `${ids.length}筆`,
          ...inventoryExportOptions
        }
        const { exportData: exportDataFn } = await import('@/utils/export')
        await exportDataFn(exportData, format, options)
      }
    },
  })

  return {
    // 確認對話框狀態
    confirmDialogOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,
    // 確認對話框方法
    confirm,
    cancel,

    // 通用方法
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    // 批量方法
    handleBatchDelete,
    handleBatchExport, // 使用 useDataTableActions 的批量匯出函數（包含確認對話框）

    // XLSX 匯出狀態
    isExporting,
  }
}