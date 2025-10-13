import { createModuleLogger } from '@/utils/logger'
import { useDataTableActions } from './useDataTableActions'
import { updateOrderStatus } from '@/composables/useOrder'
import { OrderStatus } from '@/types'
import { i18n } from '@/plugins/i18n'
import { defaultServiceFactory } from '@/api/services'
import { COMMON_FIELD_MAPPINGS } from '@/utils/export'
import type { ExportOptions, ExportFormat } from '@/utils/export'
import { useXLSXExport } from '@/composables/useXLSXExport'

const log = createModuleLogger('Composable', 'OrderActions')


const { t } = i18n.global

export function useOrderActions(
  options: {
    onSuccessfulDelete?: () => Promise<void>
    onSuccessfulBatchDelete?: () => Promise<void>
    onSuccessfulStatusUpdate?: () => Promise<void>
    onClearSelection?: () => void | Promise<void>
  } = {},
) {
  // 使用新的 XLSX 匯出 composable
  const { exportOrders, isExporting } = useXLSXExport()

  // 訂單匯出資料獲取函數（用於 CSV/JSON 匯出）
  const getOrderExportData = async (orderIds?: string[]) => {
    const orderService = defaultServiceFactory.getOrderService()
    
    if (orderIds && orderIds.length > 0) {
      // 匯出特定訂單
      const orders = []
      for (const orderId of orderIds) {
        const { success, data } = await orderService.getOrderWithItems(orderId)
        if (success && data) {
          orders.push(data)
        }
      }
      return orders
    } else {
      // 匯出全部訂單（分頁處理）
      const { success, data } = await orderService.fetchOrdersWithPagination({
        page: 1,
        perPage: 1000, // 限制最大匯出數量
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      return success ? data || [] : []
    }
  }

  // 自定義 XLSX 匯出處理函數
  const handleOrderXLSXExport = async (orderIds?: string[]) => {
    try {
      // 構建篩選條件
      const filters: Record<string, any> = {}
      
      if (orderIds && orderIds.length > 0) {
        // 只匯出指定的訂單
        filters.order_ids = orderIds
      }

      // 調用 Edge Function 進行 XLSX 匯出
      await exportOrders(filters)
    } catch (error) {
      log.error('XLSX 匯出失敗:', error)
      throw error
    }
  }

  // 訂單匯出選項
  const orderExportOptions: Partial<ExportOptions> = {
    fieldMapping: COMMON_FIELD_MAPPINGS.order,
    dateFields: ['createdAt', 'updatedAt', 'shippedAt', 'paidAt'],
    currencyFields: ['totalAmount', 'shippingFee', 'subtotal', 'taxAmount', 'discountAmount'],
    sensitiveFields: ['contactEmail', 'contactPhone', 'shippingAddress'],
    preprocessor: (orders) => {
      // 扁平化訂單資料，包含客戶和項目資訊
      return orders.map(order => ({
        ...order,
        // 客戶資訊
        customerName: (order.user as any)?.fullName || '匿名客戶',
        customerEmail: (order.user as any)?.email || '',
        customerPhone: (order.user as any)?.phone || '',
        // 項目摘要
        itemCount: (order.items as any[])?.length || 0,
        itemNames: (order.items as any[])?.map((item: any) => item.productName).join(', ') || '',
        // 狀態翻譯
        statusDisplay: getOrderStatusDisplay(order.status as any)
      }))
    }
  }

  // 訂單狀態顯示轉換
  const getOrderStatusDisplay = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING]: '待處理',
      [OrderStatus.CONFIRMED]: '已確認',
      [OrderStatus.PAID]: '已付款',
      [OrderStatus.PROCESSING]: '處理中',
      [OrderStatus.SHIPPED]: '已出貨',
      [OrderStatus.DELIVERED]: '已送達',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDED]: '已退款'
    }
    return statusMap[status] || status
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
    detailRouteName: 'order-detail',
    getDetailParams: (order: any) => {
      // 處理 order 物件，優先使用 orderNumber，否則使用 id
      return { orderNumber: order.orderNumber || order.id }
    },
    deleteConfirmTitle: t('order.actions.deleteOrder'),
    deleteConfirmDescription: t('confirmations.delete.description'),
    batchDeleteConfirmTitle: t('order.actions.batchDelete'),
    batchDeleteConfirmDescription: (count: number) =>
      t('order.bulk.confirmDelete', { count }),
    
    // 匯出確認配置
    enableExportConfirm: true,
    exportConfirmTitle: '確認匯出訂單資料',
    exportConfirmDescription: (format) => `您確定要匯出此訂單為 ${format.toUpperCase()} 格式嗎？`,
    batchExportConfirmTitle: '確認批量匯出訂單',
    batchExportConfirmDescription: (count, format) => `您確定要匯出所選的 ${count} 項訂單為 ${format.toUpperCase()} 格式嗎？`,
    
    // 匯出配置（僅用於 CSV 和 JSON）
    exportConfig: {
      getExportData: getOrderExportData,
      defaultOptions: orderExportOptions,
      supportedFormats: ['csv', 'json'] // 移除 xlsx，使用自定義處理
    },
    
    // 回調函數配置
    onClearSelection: options.onClearSelection,
    
    onDelete: async (orderId: string) => {
      try {
        // 注意：訂單通常不會真正刪除，而是將狀態設為取消
        const result = await updateOrderStatus(
          orderId,
          OrderStatus.CANCELLED,
        )
        if (result.success) {
          if (options.onSuccessfulDelete) {
            await options.onSuccessfulDelete()
          }
        } else {
          throw new Error((result.error as string) || t('order.errors.statusChangeFailed'))
        }
      } catch (error) {
        log.error(t('order.errors.statusChangeFailed'), error)
        throw error
      }
    },
    onBatchDelete: async (orderIds: string[]) => {
      try {
        // Batch cancel orders
        const updatePromises = orderIds.map((orderId) =>
          updateOrderStatus(orderId, OrderStatus.CANCELLED),
        )
        const results = await Promise.all(updatePromises)

        // Check if all updates were successful
        const failedResults = results.filter((result) => !result.success)
        if (failedResults.length > 0) {
          const errorMessages = failedResults
            .map((result) => result.error)
            .join(', ')
          throw new Error(
            `${t('order.bulk.partialSuccess', { success: orderIds.length - failedResults.length, failed: failedResults.length })}: ${errorMessages}`,
          )
        }

        if (options.onSuccessfulBatchDelete) {
          await options.onSuccessfulBatchDelete()
        }
      } catch (error) {
        log.error(t('order.errors.statusChangeFailed'), error)
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
        const orderIds = ids && ids.length > 0 ? ids : undefined
        await handleOrderXLSXExport(orderIds)
      } else {
        // 使用通用匯出處理 CSV 和 JSON
        const exportData = await getOrderExportData(ids)
        const options: ExportOptions = {
          filename: `batch_orders_${ids.length}items`,
          suffix: `${ids.length}筆`,
          ...orderExportOptions
        }
        const { exportData: exportDataFn } = await import('@/utils/export')
        await exportDataFn(exportData, format, options)
      }
    },
  })

  // Handle order status change
  const handleSetRowStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const result = await updateOrderStatus(orderId, status)
      if (result.success) {
        if (options.onSuccessfulStatusUpdate) {
          await options.onSuccessfulStatusUpdate()
        }
      } else {
        throw new Error((result.error as string) || t('order.errors.statusChangeFailed'))
      }
    } catch (error) {
      log.error(t('order.errors.statusChangeFailed'), error)
      throw error
    }
  }

  // Handle batch status change
  const handleBatchUpdateStatus = async (
    orderIds: string[],
    status: OrderStatus,
  ) => {
    try {
      // Batch update each order's status
      const updatePromises = orderIds.map((orderId) =>
        updateOrderStatus(orderId, status),
      )
      const results = await Promise.all(updatePromises)

      // Check if all updates were successful
      const failedResults = results.filter((result) => !result.success)
      if (failedResults.length > 0) {
        const errorMessages = failedResults
          .map((result) => result.error)
          .join(', ')
        throw new Error(
          `${t('order.bulk.partialSuccess', { success: orderIds.length - failedResults.length, failed: failedResults.length })}: ${errorMessages}`,
        )
      }

      if (options.onSuccessfulStatusUpdate) {
        await options.onSuccessfulStatusUpdate()
      }
    } catch (error) {
      log.error(t('order.errors.statusChangeFailed'), error)
      throw error
    }
  }


  return {
    // Generic confirmation dialog
    confirmDialogOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,
    confirm,
    cancel,

    // Generic methods
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    // Generic batch methods
    handleBatchDelete,
    handleBatchExport, // 使用統一的批量匯出函數（包含確認對話框）

    // Specific status & methods
    handleSetRowStatus,
    handleBatchUpdateStatus,

    // XLSX 匯出狀態
    isExporting,
  }
}
