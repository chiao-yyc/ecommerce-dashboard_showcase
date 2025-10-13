import { useDataTableActions } from './useDataTableActions'
import {
  deleteProduct,
  deleteProducts,
  updateInventory,
  fetchProductsWithPagination,
} from '@/composables/useProduct'
import { defaultServiceFactory } from '@/api/services'
import { COMMON_FIELD_MAPPINGS } from '@/utils/export'
import type { ExportOptions } from '@/utils/export'
import { createModuleLogger } from '@/utils/logger'
// import { useXLSXExport } from '@/composables/useXLSXExport'
// import { i18n } from '@/plugins/i18n' // 未使用

const log = createModuleLogger('Composable', 'ProductActions')

// const { t } = i18n.global // 未使用

export function useProductActions(
  options: {
    onSuccessfulDelete?: () => Promise<void>
    onSuccessfulBatchDelete?: () => Promise<void>
    onSuccessfulStockUpdate?: () => Promise<void>
    onClearSelection?: () => void | Promise<void>
  } = {},
) {
  // 使用新的 XLSX 匯出 composable
  // const { exportProducts } = useXLSXExport()
  // isExporting 未使用

  // 產品匯出資料獲取函數（用於 CSV/JSON 匯出）
  const getProductExportData = async (productIds?: string[]) => {
    if (productIds && productIds.length > 0) {
      // 匯出特定產品
      const productService = defaultServiceFactory.getProductService()
      const products = []
      
      for (const productId of productIds) {
        const { success, data } = await productService.getProductById(productId)
        if (success && data) {
          products.push(data)
        }
      }
      return products
    } else {
      // 匯出全部產品（分頁處理）
      const { success, data } = await fetchProductsWithPagination({
        page: 1,
        perPage: 1000, // 限制最大匯出數量
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      return success ? data || [] : []
    }
  }

  // 產品狀態顯示轉換
  const getProductStatusDisplay = (isActive: boolean): string => {
    return isActive ? '啟用' : '停用'
  }

  // 產品匯出選項
  const productExportOptions: Partial<ExportOptions> = {
    fieldMapping: COMMON_FIELD_MAPPINGS.product,
    dateFields: ['createdAt', 'updatedAt'],
    currencyFields: ['price'],
    preprocessor: (products) => {
      // 扁平化產品資料，包含分類和狀態資訊
      return products.map(product => ({
        ...product,
        // 狀態翻譯
        statusDisplay: getProductStatusDisplay((product.isActive as boolean) || false),
        // 分類顯示
        categoryDisplay: (product.category as any)?.name || '未分類',
        // 庫存狀態
        stockStatusDisplay: ((product.stock as number) || 0) > 0 ? '有庫存' : '無庫存',
        // 價格區間
        priceRange: product.price ? `$${product.price}` : '未定價'
      }))
    }
  }

  // 自定義 XLSX 匯出處理函數 (未使用)
  // const handleProductXLSXExport = async (productIds?: string[]) => {
  // const _handleProductXLSXExport = async (productIds?: string[]) => { // 未使用
  /* const __unused_handleProductXLSXExport = async (productIds?: string[]) => {
    try {
      // 構建篩選條件
      const filters: Record<string, any> = {}
      
      if (productIds && productIds.length > 0) {
        // 只匯出指定的產品
        filters.product_ids = productIds
      }

      // 調用 Edge Function 進行 XLSX 匯出
      await exportProducts(filters)
    } catch (error) {
      console.error('XLSX 匯出失敗:', error)
      throw error
    }
  } */

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
    detailRouteName: 'product-detail',
    getDetailParams: (item: any) => {
      log.debug('getDetailParams received', {
        item,
        type: typeof item,
        keys: item ? Object.keys(item) : 'null/undefined'
      })

      if (!item?.sku) {
        log.error('產品缺少 SKU 欄位', { item })
        throw new Error('產品缺少 SKU 欄位，無法進行路由跳轉')
      }
      return { sku: item.sku }
    },
    deleteConfirmTitle: '確認刪除產品',
    deleteConfirmDescription: '您確定要刪除這個產品嗎？此操作不可復原。',
    batchDeleteConfirmTitle: '確認批量刪除產品',
    batchDeleteConfirmDescription: (count: number) =>
      `您確定要刪除選中的 ${count} 個產品嗎？此操作不可復原。`,
    
    // 匯出確認配置
    enableExportConfirm: true,
    exportConfirmTitle: '確認匯出產品資料',
    exportConfirmDescription: (format) => `您確定要匯出此產品為 ${format.toUpperCase()} 格式嗎？`,
    batchExportConfirmTitle: '確認批量匯出產品',
    batchExportConfirmDescription: (count, format) => `您確定要匯出所選的 ${count} 項產品為 ${format.toUpperCase()} 格式嗎？`,
    
    // 匯出配置
    exportConfig: {
      getExportData: getProductExportData,
      defaultOptions: productExportOptions,
      supportedFormats: ['csv', 'xlsx', 'json']
    },
    
    // 回調函數配置
    onClearSelection: options.onClearSelection,
    
    onDelete: async (productId: string) => {
      try {
        const result = await deleteProduct(productId)
        if (result.success) {
          if (options.onSuccessfulDelete) {
            await options.onSuccessfulDelete()
          }
        } else {
          throw new Error((result.error as string) || '刪除產品失敗')
        }
      } catch (error) {
        log.error('刪除產品時發生錯誤', { error })
        throw error
      }
    },
    onBatchDelete: async (productIds: string[]) => {
      try {
        const result = await deleteProducts(productIds)
        if (result.success) {
          if (options.onSuccessfulBatchDelete) {
            await options.onSuccessfulBatchDelete()
          }
        } else {
          throw new Error((result.error as string) || '批量刪除產品失敗')
        }
      } catch (error) {
        log.error('批量刪除產品時發生錯誤', { error })
        throw error
      }
    },
  })

  // 處理產品庫存變更
  const handleSetRowStock = async (productId: string, stock: number) => {
    try {
      const result = await updateInventory(productId, {
        quantity: stock,
        source: 'manual',
        ref_id: productId,
      })
      if (result.success) {
        if (options.onSuccessfulStockUpdate) {
          await options.onSuccessfulStockUpdate()
        }
      } else {
        throw new Error((result.error as string) || '更新產品庫存失敗')
      }
    } catch (error) {
      log.error('更新產品庫存時發生錯誤', { error })
      throw error
    }
  }

  // 處理批量庫存變更
  const handleBatchUpdateStock = async (
    productIds: string[],
    stock: number,
  ) => {
    try {
      // 批量更新每個產品的庫存
      const updatePromises = productIds.map((productId) =>
        updateInventory(productId, {
          quantity: stock,
          source: 'manual',
          ref_id: productId,
        }),
      )

      const results = await Promise.all(updatePromises)

      // 檢查是否所有更新都成功
      const failedResults = results.filter((result) => !result.success)
      if (failedResults.length > 0) {
        const errorMessages = failedResults
          .map((result) => result.error)
          .join(', ')
        throw new Error(`部分產品庫存更新失敗: ${errorMessages}`)
      }

      if (options.onSuccessfulStockUpdate) {
        await options.onSuccessfulStockUpdate()
      }
    } catch (error) {
      log.error('批量更新產品庫存時發生錯誤', { error })
      throw error
    }
  }

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
    handleBatchExport,
    handleSetRowStock,
    handleBatchUpdateStock,

    // 確認對話框方法
    confirm,
    cancel,
  }
}
