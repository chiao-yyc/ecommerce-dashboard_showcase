import { createModuleLogger } from '@/utils/logger'
import { useRouter } from 'vue-router'
import { useConfirmAction } from '@/composables/useConfirmAction'
import { exportData, type ExportFormat, type ExportOptions } from '@/utils/export'

const log = createModuleLogger('Composable', 'DataTableActions')


export interface DataTableActionsConfig {
  // 路由配置
  detailRouteName?: string
  detailRouteParams?: (id: string) => Record<string, any>
  getDetailParams?: (item: any) => Record<string, any>

  // 自定義處理函數
  onDelete?: (id: string) => Promise<void> | void
  onExport?: (id: string) => Promise<void> | void
  onBatchDelete?: (ids: string[]) => Promise<void> | void
  onBatchExport?: (data: {
    ids: string[]
    type: 'list' | 'detail'
    format?: ExportFormat
  }) => Promise<void> | void

  // 回調函數配置
  onClearSelection?: () => void | Promise<void>

  // 匯出配置
  exportConfig?: {
    /** 獲取匯出資料的函數 */
    getExportData?: (ids?: string[]) => Promise<any[]> | any[]
    /** 預設匯出選項 */
    defaultOptions?: Partial<ExportOptions>
    /** 支援的匯出格式 */
    supportedFormats?: ExportFormat[]
  }

  // 確認對話框配置
  deleteConfirmTitle?: string
  deleteConfirmDescription?: string
  batchDeleteConfirmTitle?: string
  batchDeleteConfirmDescription?: (count: number) => string
  
  // 匯出確認配置
  exportConfirmTitle?: string
  exportConfirmDescription?: string | ((format: ExportFormat) => string)
  batchExportConfirmTitle?: string
  batchExportConfirmDescription?: (count: number, format: ExportFormat) => string
  enableExportConfirm?: boolean // 是否啟用匯出確認
}

export function useDataTableActions(config: DataTableActionsConfig = {}) {
  const router = useRouter()

  // 確認對話框
  const {
    isOpen: confirmDialogOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,
    openConfirm,
    confirm,
    cancel,
  } = useConfirmAction()

  // 轉跳連結
  const handleLinkRouter = ({
    routeName,
    routeParams,
  }: {
    routeName?: string
    routeParams?: (id: string) => Record<string, any>
  }) => {
    if (routeName) {
      return (id: string) => {
        const params = routeParams?.(id) || { id }
        router.push({ name: routeName, params })
      }
    } else {
      log.warn('未設定 routeName，請在 config 中設定路由名稱')
    }
  }

  // 查看詳情（支援新的 getDetailParams 模式）
  const handleViewDetail = config.detailRouteName
    ? config.getDetailParams
      ? (item: any) => {
          try {
            const params = config.getDetailParams!(item)
            router.push({ name: config.detailRouteName!, params })
          } catch (error) {
            log.error('路由跳轉失敗:', error)
            throw error
          }
        }
      : handleLinkRouter({
          routeName: config.detailRouteName,
          routeParams: config.detailRouteParams,
        })
    : undefined

  // 刪除單個項目
  const handleDeleteRow = async (id: string) => {
    openConfirm({
      type: 'delete',
      payload: id,
      title: config.deleteConfirmTitle || '確認刪除',
      description:
        config.deleteConfirmDescription ||
        '您確定要刪除這個項目嗎？此操作不可復原。',
      confirmText: '確認',
      cancelText: '取消',
      onConfirm: async (id: string) => {
        if (config.onDelete) {
          await config.onDelete(id)
        } else {
          log.warn(
            '未設定 onDelete 回調函數，請在 config 中設定刪除處理函數',
          )
        }
      },
    })
  }

  // 匯出詳情
  const handleExportDetail = async (id: string, format: ExportFormat = 'xlsx') => {
    // 如果啟用匯出確認，先顯示確認對話框
    if (config.enableExportConfirm) {
      const title = config.exportConfirmTitle || '確認匯出'
      const description = typeof config.exportConfirmDescription === 'function' 
        ? config.exportConfirmDescription(format)
        : config.exportConfirmDescription || `您確定要匯出此項目為 ${format.toUpperCase()} 格式嗎？`

      openConfirm({
        type: 'confirm',
        payload: { id, format },
        title,
        description,
        confirmText: '匯出',
        cancelText: '取消',
        onConfirm: async (data: { id: string, format: ExportFormat }) => {
          await executeExportDetail(data.id, data.format)
        },
      })
      return
    }

    // 直接執行匯出
    await executeExportDetail(id, format)
  }

  // 執行匯出詳情的實際邏輯
  const executeExportDetail = async (id: string, format: ExportFormat = 'xlsx') => {
    if (config.onExport) {
      await config.onExport(id)
    } else if (config.exportConfig?.getExportData) {
      try {
        const data = await config.exportConfig.getExportData([id])
        const options: ExportOptions = {
          filename: `detail_${id}`,
          ...config.exportConfig.defaultOptions
        }
        await exportData(data, format, options)
      } catch (error) {
        log.error('匯出詳情失敗:', error)
        throw error
      }
    } else {
      log.warn('未設定 onExport 回調函數或 exportConfig，請在 config 中設定匯出處理函數')
    }
  }

  // 批量刪除
  const handleBatchDelete = async (selectedIds: string[]) => {
    if (selectedIds.length === 0) return

    openConfirm({
      type: 'delete',
      payload: selectedIds,
      title: config.batchDeleteConfirmTitle || '確認批量刪除',
      description:
        config.batchDeleteConfirmDescription?.(selectedIds.length) ||
        `您確定要刪除選中的 ${selectedIds.length} 個項目嗎？此操作不可復原。`,
      confirmText: '確認',
      cancelText: '取消',
      onConfirm: async (ids: string[]) => {
        if (config.onBatchDelete) {
          await config.onBatchDelete(ids)
        } else {
          log.warn(
            '未設定 onBatchDelete 回調函數，請在 config 中設定批量刪除處理函數',
          )
        }
      },
    })
  }

  // 批量匯出
  const handleBatchExport = async (data: {
    ids: string[]
    type: 'list' | 'detail'
    format?: ExportFormat
  }) => {
    const format = data.format || 'xlsx'
    
    // 如果啟用匯出確認，先顯示確認對話框
    if (config.enableExportConfirm && data.ids.length > 0) {
      const title = config.batchExportConfirmTitle || '確認批量匯出'
      const description = config.batchExportConfirmDescription 
        ? config.batchExportConfirmDescription(data.ids.length, format)
        : `您確定要匯出所選的 ${data.ids.length} 個項目為 ${format.toUpperCase()} 格式嗎？`

      openConfirm({
        type: 'confirm',
        payload: data,
        title,
        description,
        confirmText: '匯出',
        cancelText: '取消',
        onConfirm: async (exportData: typeof data) => {
          await executeBatchExport(exportData)
          // 清除選取狀態（僅在確認匯出後）
          if (config.onClearSelection) {
            await config.onClearSelection()
          }
        },
      })
      return
    }

    // 直接執行匯出
    await executeBatchExport(data)
    // 清除選取狀態（直接匯出時）
    if (config.onClearSelection) {
      await config.onClearSelection()
    }
  }

  // 執行批量匯出的實際邏輯
  const executeBatchExport = async (data: {
    ids: string[]
    type: 'list' | 'detail'
    format?: ExportFormat
  }) => {
    if (config.onBatchExport) {
      await config.onBatchExport(data)
    } else if (config.exportConfig?.getExportData) {
      try {
        const format = data.format || 'xlsx'
        const dataToExport = await config.exportConfig.getExportData(data.ids)
        
        const options: ExportOptions = {
          filename: `batch_${data.type}_${data.ids.length}items`,
          suffix: `${data.ids.length}筆`,
          ...config.exportConfig.defaultOptions
        }
        
        await exportData(dataToExport, format, options)
      } catch (error) {
        log.error('批量匯出失敗:', error)
        throw error
      }
    } else {
      log.warn(
        '未設定 onBatchExport 回調函數或 exportConfig，請在 config 中設定批量匯出處理函數',
      )
    }
  }

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

    // 方法
    handleLinkRouter,
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    handleBatchDelete,
    handleBatchExport,
  }
}
