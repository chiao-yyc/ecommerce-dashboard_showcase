import { createModuleLogger } from '@/utils/logger'
import { ref, computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'

const log = createModuleLogger('Composable', 'XLSXExport')

/**
 * XLSX 匯出請求介面
 */
export interface ExportRequest {
  type: 'orders' | 'customers' | 'products' | 'inventory' | 'users' | 'analytics'
  filters?: Record<string, any>
  format?: 'xlsx' | 'csv'
  columns?: string[]
  filename?: string
  sheetName?: string
}

/**
 * XLSX 匯出響應介面
 */
export interface ExportResponse {
  success: boolean
  downloadUrl?: string
  filename?: string
  error?: string
  size?: number
  recordCount?: number
}

/**
 * XLSX 匯出 Composable
 * 使用 Supabase Edge Function 進行 XLSX 檔案生成和匯出
 */
export const useXLSXExport = () => {
  const isExporting = ref(false)
  const exportError = ref<string | null>(null)

  /**
   * 匯出資料的 mutation
   */
  const exportMutation = useMutation({
    mutationFn: async (params: ExportRequest): Promise<void> => {
      log.debug('📊 開始匯出資料:', params)

      try {
        // 獲取當前的認證 session
        const { data: { session } } = await supabase.auth.getSession()
        const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY

        // 調用 Edge Function 並直接處理 blob 響應
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xlsx-export`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          const errorText = await response.text()
          log.error('❌ Edge Function 調用失敗:', errorText)
          throw new Error(`匯出失敗: ${response.statusText}`)
        }

        // 檢查響應是否為 Excel 檔案
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          // 獲取檔案 blob 和檔名
          const blob = await response.blob()
          const contentDisposition = response.headers.get('content-disposition')
          let filename = params.filename || 'export.xlsx'
          
          if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
            if (match && match[1]) {
              filename = decodeURIComponent(match[1].replace(/['"]/g, ''))
            }
          }

          // 觸發瀏覽器下載
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)

          log.debug('✅ XLSX 檔案下載成功:', filename)
        } else {
          // 處理錯誤響應
          const errorData = await response.json()
          throw new Error(errorData.error || '匯出失敗')
        }
      } catch (error) {
        log.error('❌ XLSX 匯出失敗:', error)
        throw error
      }
    },
    onMutate: () => {
      isExporting.value = true
      exportError.value = null
    },
    onSuccess: () => {
      log.debug('🎉 XLSX 匯出流程完成')
      // 檔案已通過瀏覽器自動下載
    },
    onError: (error: any) => {
      log.error('❌ 匯出錯誤:', error)
      exportError.value = error?.message || '匯出失敗'
    },
    onSettled: () => {
      isExporting.value = false
    },
  })

  /**
   * 匯出資料
   */
  const exportData = async (params: ExportRequest): Promise<void> => {
    return exportMutation.mutateAsync(params)
  }

  /**
   * 匯出訂單資料
   */
  const exportOrders = async (filters?: Record<string, any>, columns?: string[]) => {
    return exportData({
      type: 'orders',
      filters,
      columns,
      filename: `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '訂單資料'
    })
  }

  /**
   * 匯出客戶資料
   */
  const exportCustomers = async (filters?: Record<string, any>, columns?: string[]) => {
    return exportData({
      type: 'customers',
      filters,
      columns,
      filename: `customers_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '客戶資料'
    })
  }

  /**
   * 匯出產品資料
   */
  const exportProducts = async (filters?: Record<string, any>, columns?: string[]) => {
    return exportData({
      type: 'products',
      filters,
      columns,
      filename: `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '產品資料'
    })
  }

  /**
   * 匯出庫存資料
   */
  const exportInventory = async (filters?: Record<string, any>, columns?: string[]) => {
    return exportData({
      type: 'inventory',
      filters,
      columns,
      filename: `inventory_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '庫存資料'
    })
  }

  /**
   * 匯出用戶資料
   */
  const exportUsers = async (filters?: Record<string, any>, columns?: string[]) => {
    return exportData({
      type: 'users',
      filters,
      columns,
      filename: `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: '用戶資料'
    })
  }


  /**
   * 匯出自定義分析資料
   */
  const exportAnalytics = async (
    customData: any[], 
    options: {
      filename?: string,
      sheetName?: string,
      columns?: string[]
    } = {}
  ) => {
    const { filename, sheetName, columns } = options
    return exportData({
      type: 'analytics',
      filters: {
        _custom_data: customData,
        _custom_filename: filename || `analytics_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
        _custom_sheet_name: sheetName || '分析報表'
      },
      columns,
      filename: filename || `analytics_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      sheetName: sheetName || '分析報表'
    })
  }

  return {
    // 狀態
    isExporting: computed(() => exportMutation.isPending || isExporting.value),
    exportError: computed(() => {
      const mutationError = exportMutation.error?.value
      return (mutationError instanceof Error ? mutationError.message : mutationError) || exportError.value
    }),

    // 方法
    exportData,
    exportOrders,
    exportCustomers,
    exportProducts,
    exportInventory,
    exportUsers,
    exportAnalytics,

    // 原始 mutation（供進階使用）
    exportMutation,
  }
}