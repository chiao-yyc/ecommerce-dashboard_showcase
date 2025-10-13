import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import { formatDate, formatCurrency, sanitizeFileName, convertToISOString } from '@/utils'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Utils', 'Export')


/**
 * 支援的匯出格式
 */
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf'

/**
 * 匯出選項配置
 */
export interface ExportOptions {
  /** 檔案名稱（不含副檔名） */
  filename: string
  /** 工作表名稱（僅用於 XLSX） */
  sheetName?: string
  /** 是否包含時間戳記 */
  includeTimestamp?: boolean
  /** 自定義檔案名稱後綴 */
  suffix?: string
  /** 資料前處理函數 */
  preprocessor?: (data: Record<string, unknown>[]) => Record<string, unknown>[]
  /** 欄位映射配置 */
  fieldMapping?: Record<string, string>
  /** 需要格式化的日期欄位 */
  dateFields?: string[]
  /** 需要格式化的貨幣欄位 */
  currencyFields?: string[]
  /** 需要去敏化的敏感欄位 */
  sensitiveFields?: string[]
}

/**
 * PDF 匯出選項配置
 */
export interface PDFExportOptions {
  /** 檔案名稱（不含副檔名） */
  filename: string
  /** 頁面方向 */
  orientation?: 'portrait' | 'landscape'
  /** 頁面格式 */
  format?: 'a4' | 'letter'
  /** 向量品質 (0.1-1.0) */
  quality?: number
  /** 是否包含時間戳記 */
  includeTimestamp?: boolean
  /** 頁面邊距 */
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /** 標題 */
  title?: string
  /** 說明文字 */
  description?: string
  /** 語言環境 */
  locale?: string
  /** 圖表尺寸配置 */
  chartSize?: {
    /** 空間利用率 (0.1-1.0) */
    utilization?: number
    /** 絕對寬度 (mm) */
    width?: number
    /** 絕對高度 (mm) */
    height?: number
    /** 強制寬高比 */
    aspectRatio?: number
    /** 是否保持原始比例 */
    maintainAspectRatio?: boolean
  }
}

/**
 * 匯出錯誤類型
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly format?: ExportFormat,
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

/**
 * 用戶取消匯出的專屬錯誤類型
 */
export class UserCancelledError extends Error {
  constructor(message: string = '用戶取消操作') {
    super(message)
    this.name = 'UserCancelledError'
  }
}

/**
 * 生成匯出檔案名稱
 */
export function generateExportFilename(
  baseName: string,
  format: ExportFormat,
  options: Pick<ExportOptions, 'includeTimestamp' | 'suffix'> = {},
): string {
  const { includeTimestamp = true, suffix = '' } = options

  let filename = sanitizeFileName(baseName)

  // 加入後綴
  if (suffix) {
    filename += `_${sanitizeFileName(suffix)}`
  }

  // 加入時間戳記
  if (includeTimestamp) {
    const timestamp = convertToISOString(new Date()).slice(0, 19).replace(/[:-]/g, '')
    filename += `_${timestamp}`
  }

  // 加入副檔名
  filename += `.${format}`

  return filename
}

/**
 * 資料前處理：格式化和去敏化
 */
export function preprocessExportData(
  data: MaybeRefOrGetter<Record<string, unknown>[]>,
  options: Partial<ExportOptions> = {},
): Record<string, unknown>[] {
  const rawData = toValue(data)
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return []
  }

  let processedData = [...rawData]

  // 自定義前處理
  if (options.preprocessor) {
    processedData = options.preprocessor(processedData)
  }

  // 欄位映射和格式化
  processedData = processedData.map((item) => {
    const processedItem: Record<string, unknown> = {}

    Object.keys(item).forEach((key) => {
      // 欄位映射
      const mappedKey = options.fieldMapping?.[key] || key
      let value = item[key]

      // 敏感欄位去敏化
      if (options.sensitiveFields?.includes(key)) {
        if (typeof value === 'string' && value.length > 4) {
          value =
            value.substring(0, 2) +
            '*'.repeat(value.length - 4) +
            value.substring(value.length - 2)
        } else {
          value = '***'
        }
      }
      // 日期格式化
      else if (options.dateFields?.includes(key) && value) {
        value = formatDate(value as string | Date)
      }
      // 貨幣格式化
      else if (
        options.currencyFields?.includes(key) &&
        typeof value === 'number'
      ) {
        value = formatCurrency(value)
      }
      // 處理 null/undefined 值
      else if (value === null || value === undefined) {
        value = ''
      }

      processedItem[mappedKey] = value
    })

    return processedItem
  })

  return processedData
}

/**
 * 匯出為 CSV 格式
 */
export async function exportToCSV(
  data: MaybeRefOrGetter<any[]>,
  options: ExportOptions,
): Promise<void> {
  try {
    const processedData = preprocessExportData(data, options)

    if (processedData.length === 0) {
      throw new ExportError('沒有資料可以匯出', 'csv')
    }

    const csv = Papa.unparse(processedData, {
      header: true,
    })

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8',
    })

    const filename = generateExportFilename(options.filename, 'csv', options)
    saveAs(blob, filename)
  } catch (error) {
    if (error instanceof ExportError) {
      throw error
    }
    throw new ExportError(
      `CSV 匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
      'csv',
    )
  }
}

/**
 * 匯出為 XLSX 格式 - 透過 Edge Function 處理
 * 
 * 這個函數直接調用 Edge Function API，不依賴 Vue composables
 * 對於業務特定資料，建議在組件中使用 useXLSXExport composable
 */
export async function exportToXLSX(
  data: MaybeRefOrGetter<any[]>,
  options: ExportOptions,
): Promise<void> {
  try {
    const processedData = preprocessExportData(data, options)

    if (processedData.length === 0) {
      throw new ExportError('沒有資料可以匯出', 'xlsx')
    }

    const filename = generateExportFilename(options.filename, 'xlsx', options)

    // 獲取當前的認證 session
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY

    // 直接調用 Edge Function API，不使用 composable
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xlsx-export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        type: 'analytics',
        filters: {
          _custom_data: processedData,
          _custom_filename: filename,
          _custom_sheet_name: options.sheetName || '分析報表'
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error('❌ Edge Function 調用失敗', new Error(errorText))
      throw new Error(`匯出失敗: ${response.statusText}`)
    }

    // 檢查響應是否為 Excel 檔案
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      // 獲取檔案 blob
      const blob = await response.blob()
      
      // 觸發瀏覽器下載
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      log.debug('✅ 通用 XLSX 匯出完成，檔案已下載', { filename })
    } else {
      // 處理錯誤響應
      const errorData = await response.json()
      throw new Error(errorData.error || '匯出失敗')
    }

  } catch (error) {
    log.error('❌ XLSX 匯出失敗', error)
    
    // 如果是匯出相關錯誤，直接拋出
    if (error instanceof ExportError) {
      throw error
    }

    // 提供詳細的錯誤資訊和建議
    const suggestions = [
      '通用 XLSX 匯出遇到問題，建議使用以下方法：',
      '',
      '在 Vue 組件中使用業務特定匯出（推薦）：',
      '• 訂單：const { exportOrders } = useXLSXExport(); await exportOrders(filters)',
      '• 客戶：const { exportCustomers } = useXLSXExport(); await exportCustomers(filters)', 
      '• 產品：const { exportProducts } = useXLSXExport(); await exportProducts(filters)',
      '• 庫存：const { exportInventory } = useXLSXExport(); await exportInventory(filters)',
      '• 使用者：const { exportUsers } = useXLSXExport(); await exportUsers(filters)',
      '• 工單：const { exportTickets } = useXLSXExport(); await exportTickets(filters)',
      '',
      '或使用替代格式：',
      '• CSV 格式：await exportToCSV(data, options)',
      '• JSON 格式：await exportToJSON(data, options)',
      '',
      `錯誤詳情：${error instanceof Error ? error.message : '未知錯誤'}`,
    ].join('\n')

    throw new ExportError(suggestions, 'xlsx')
  }
}

/**
 * 匯出為 JSON 格式
 */
export async function exportToJSON(
  data: MaybeRefOrGetter<any[]>,
  options: ExportOptions,
): Promise<void> {
  try {
    const processedData = preprocessExportData(data, options)

    if (processedData.length === 0) {
      throw new ExportError('沒有資料可以匯出', 'json')
    }

    const jsonString = JSON.stringify(processedData, null, 2)
    const blob = new Blob([jsonString], {
      type: 'application/json;charset=utf-8',
    })

    const filename = generateExportFilename(options.filename, 'json', options)
    saveAs(blob, filename)
  } catch (error) {
    if (error instanceof ExportError) {
      throw error
    }
    throw new ExportError(
      `JSON 匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
      'json',
    )
  }
}

/**
 * 根據紙張大小和實際內容計算容器尺寸 (未使用)
 */
// function getPrintContainerDimensions(paperSize: 'a4' | 'chart', contentDimensions: { width: number; height: number }) {
/* function __unused_getPrintContainerDimensions(paperSize: 'a4' | 'chart', contentDimensions: { width: number; height: number }) {
  if (paperSize === 'a4') {
    // A4 模式：適合標準 A4 紙張的尺寸（考慮邊距）
    return {
      width: 500,      // 稍微縮小以確保不會超出 A4 寬度
      maxHeight: Math.max(600, contentDimensions.height + 100)   // 確保能包含所有內容
    }
  } else {
    // 圖表大小模式：完全基於實際內容尺寸，並添加足夠的緩衝空間
    // 特別處理：如果是寬度較大的圖表（如營收趨勢），增加高度緩衝
    const isWideChart = contentDimensions.width > 600
    const heightBuffer = isWideChart ? 120 : 60  // 寬圖表需要更多高度空間
    const minHeight = contentDimensions.height + heightBuffer
    
    return {
      width: Math.max(350, contentDimensions.width + 40),  // 確保圖表標籤不超出
      maxHeight: Math.max(isWideChart ? 500 : 400, minHeight)  // 寬圖表最小 500px 高度
    }
  }
} */

/**
 * 瀏覽器列印方案 - 最可靠的 PDF 方案
 * 利用瀏覽器原生列印功能確保 100% 視覺一致性
 */
export async function printElementAsPDF(
  element: HTMLElement,
  title: string = '圖表',
): Promise<void> {
  log.debug('🖨️ 開始 PDF 匯出')
  
  // 尋找最適合的列印目標：ChartCard 容器
  let printTarget = element.closest('.relative.flex.h-full.flex-col') as HTMLElement  // ChartCard 的 CSS class
  
  if (!printTarget) {
    // 如果找不到 ChartCard，則尋找其他卡片容器
    printTarget = element.closest('[class*="card"], .bg-white, .border') as HTMLElement
  }
  
  if (!printTarget) {
    // 最後退回到原始元素
    printTarget = element
    log.debug('⚠️ 找不到卡片容器，使用原始元素')
  } else {
    log.debug('✅ 找到卡片容器，將直接列印整張卡片')
  }
  
  // 保存原始樣式（只保存會被修改的屬性）
  const originalStyles = {
    maxWidth: printTarget.style.maxWidth,
    maxHeight: printTarget.style.maxHeight
  }

  try {
    // 列印準備：只設定必要的尺寸限制，避免視覺閃爍
    printTarget.style.maxWidth = 'none'
    printTarget.style.maxHeight = 'none'
    
    // 讓用戶選擇紙張大小
    const printOptions = await new Promise<{
      paperSize: 'a4' | 'chart'
      description: string
    }>((resolve, reject) => {
      const modal = document.createElement('div')
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 10000; 
        display: flex; align-items: center; justify-content: center;
      `

      modal.innerHTML = `
        <div style="
          background: white; padding: 30px; border-radius: 10px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 600px;
          font-family: ${useTheme().getCurrentFont()};
        ">
          <h3 style="margin: 0 0 20px 0; color: #333;">選擇列印設定</h3>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
            請選擇紙張大小：
          </p>
          
          <!-- 紙張大小選擇 -->
          <div style="margin: 20px 0;">
            <div style="display: flex; gap: 15px;">
              <button id="paper-a4" class="paper-option" style="
                flex: 1; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px;
                background: white; cursor: pointer; font-size: 16px; text-align: center;
              ">
                <div style="font-size: 24px; margin-bottom: 8px;">📋</div>
                <div style="font-weight: 500;">A4直式</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">標準頁面大小</div>
              </button>
              <button id="paper-chart" class="paper-option" style="
                flex: 1; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px;
                background: white; cursor: pointer; font-size: 16px; text-align: center;
              ">
                <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
                <div style="font-weight: 500;">圖表大小</div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">適應內容大小</div>
              </button>
            </div>
          </div>
          
          <!-- 預覽和確認 -->
          <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
            <div id="selection-preview" style="color: #666; font-size: 14px;">
              請選擇紙張大小
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button id="confirm-print" style="
              flex: 1; padding: 12px; background: #059669; color: white; 
              border: none; border-radius: 6px; cursor: pointer; font-size: 16px;
            " disabled>
              開始列印
            </button>
            <button id="cancel-print" style="
              padding: 12px 20px; background: transparent; color: #666; 
              border: 1px solid #ddd; border-radius: 6px; cursor: pointer;
            ">
              取消
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // 選擇狀態
      let selectedPaper: 'a4' | 'chart' | null = null

      const paperOptions = ['paper-a4', 'paper-chart']

      // 更新預覽文字
      const updatePreview = () => {
        const preview = modal.querySelector('#selection-preview')
        const confirmBtn = modal.querySelector(
          '#confirm-print',
        ) as HTMLButtonElement

        if (selectedPaper) {
          const paperText = selectedPaper === 'a4' ? 'A4直式' : '圖表大小'

          if (preview) preview.innerHTML = `已選擇：📄 ${paperText}`
          confirmBtn.disabled = false
          confirmBtn.style.background = '#059669'
        } else {
          if (preview) preview.innerHTML = '請選擇紙張大小'
          confirmBtn.disabled = true
          confirmBtn.style.background = '#9ca3af'
        }
      }

      // 紙張大小選擇
      paperOptions.forEach((optionId) => {
        const button = modal.querySelector(`#${optionId}`)
        button?.addEventListener('click', () => {
          // 清除其他選擇的樣式
          paperOptions.forEach((id) => {
            const btn = modal.querySelector(`#${id}`) as HTMLElement
            if (btn) {
              btn.style.borderColor = '#e5e7eb'
              btn.style.background = 'white'
            }
          })

          // 設置選中樣式
          const btn = button as HTMLElement
          btn.style.borderColor = '#059669'
          btn.style.background = '#ecfdf5'

          selectedPaper = optionId === 'paper-a4' ? 'a4' : 'chart'
          updatePreview()
        })
      })

      // 確認按鈕
      modal.querySelector('#confirm-print')?.addEventListener('click', () => {
        if (selectedPaper) {
          document.body.removeChild(modal)
          const paperText = selectedPaper === 'a4' ? 'A4直式' : '圖表大小'
          resolve({
            paperSize: selectedPaper,
            description: paperText,
          })
        }
      })

      // 取消按鈕
      modal.querySelector('#cancel-print')?.addEventListener('click', () => {
        document.body.removeChild(modal)
        reject(new UserCancelledError('用戶取消列印'))
      })
    })

    log.debug('📏 用戶選擇', { description: printOptions.description })
    log.debug('📦 使用卡片原始尺寸，無需複雜調整')

    // 創建隱藏的 iframe 用於列印
    const printFrame = document.createElement('iframe')
    printFrame.style.cssText = `
      position: fixed;
      top: -10000px;
      left: -10000px;
      width: 1px;
      height: 1px;
      opacity: 0;
      border: none;
    `
    document.body.appendChild(printFrame)

    const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document
    if (!printDoc) {
      document.body.removeChild(printFrame)
      throw new ExportError('無法創建列印文檔')
    }

    // 複製當前頁面的樣式
    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((style) => style.outerHTML)
      .join('\n')

    // 複製卡片內容
    const cardHTML = printTarget.outerHTML
    const isChartSize = printOptions.paperSize === 'chart'
    const currentTime = new Date().toLocaleString('zh-TW')
    
    log.debug('📄 準備列印卡片內容')

    // 計算卡片實際尺寸
    const cardRect = printTarget.getBoundingClientRect()
    
    // 智能調整頁面尺寸，避免空白頁
    const pageWidth = Math.ceil(cardRect.width + 60)
    const basePageHeight = Math.ceil(cardRect.height + 80)  // 減少從 120px 到 80px
    
    // 對於很高的卡片，限制最大高度避免分頁
    const maxSafeHeight = 800  // 最大安全高度
    const pageHeight = Math.min(basePageHeight, maxSafeHeight)
    
    log.debug('📦 卡片尺寸與頁面計算', {
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
      pageWidth: pageWidth,
      basePageHeight: basePageHeight,
      finalPageHeight: pageHeight,
      heightReduced: basePageHeight > maxSafeHeight
    })
    
    // 建立有頁頭頁尾的列印頁面內容
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          ${styles}
          <style>
            @page {
              ${
                isChartSize 
                  ? `size: ${pageWidth}px ${pageHeight}px;`
                  : 'size: A4 portrait;'
              }
              margin: 0;
            }
            
            html, body { 
              margin: 0; 
              padding: 0;
              ${
                isChartSize
                  ? `width: ${pageWidth}px; height: ${pageHeight}px;`
                  : ''
              }
              font-family: ${useTheme().getCurrentFont()};
              background: white;
              color: #1f2937;
              box-sizing: border-box;
            }
            
            .print-header {
              padding: ${isChartSize ? '8px 15px' : '15px 20px'};
              border-bottom: 1px solid #e5e7eb;
              background: #f9fafb;
              font-size: ${isChartSize ? '12px' : '14px'};
              color: #333;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .print-header .title {
              font-weight: 600;
            }
            
            .print-header .settings {
              font-size: ${isChartSize ? '10px' : '11px'};
              color: #666;
            }
            
            .print-footer {
              position: fixed;
              bottom: 8px;
              left: 15px;
              right: 15px;
              font-size: 10px;
              color: #888;
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              border-top: 1px solid #e5e7eb;
              background: white;
            }
            
            .main-content {
              padding: ${isChartSize ? '15px' : '20px'};
              display: flex;
              justify-content: center;
              align-items: flex-start;
              ${isChartSize ? `width: ${pageWidth}px; height: ${pageHeight - 60}px;` : ''}
              box-sizing: border-box;
            }
            
            /* 隱藏匯出按鈕 */
            button, [role="button"], .export-button, [class*="export"] {
              display: none !important;
            }
            
            /* 移除卡片邊框和陰影 - 無閃爍方案 */
            [data-slot="card"], 
            .relative.flex.h-full.flex-col,
            .bg-card {
              border: none !important;
              box-shadow: none !important;
              background: white !important;
            }
            
            /* 移除圓角，讓卡片與頁面完全融合 */
            .rounded-xl {
              border-radius: 0 !important;
            }
            
            /* 控制卡片在列印時的尺寸 */
            .relative.flex.h-full.flex-col {
              height: auto !important;
              page-break-inside: avoid;
              ${
                isChartSize 
                  ? `width: ${Math.ceil(cardRect.width)}px !important; max-width: ${Math.ceil(cardRect.width)}px !important; max-height: ${pageHeight - 100}px !important;`
                  : 'max-width: 600px;'
              }
              margin: 0;
              overflow: hidden;
            }
            
            /* 特殊處理 Unovis 圖表容器，防止被截斷 */
            .unovis-xy-container {
              overflow: visible !important;
              height: auto !important;
              min-height: 300px !important;
            }
            
            .unovis-xy-container svg {
              overflow: visible !important;
              height: auto !important;
              min-height: 300px !important;
            }
            
            /* 修復 flex 佈局在列印時的問題 */
            .flex.h-full.flex-col {
              height: auto !important;
              min-height: auto !important;
            }
            
            .min-h-0.flex-1 {
              height: auto !important;
              min-height: 300px !important;
              flex: none !important;
            }
            
            /* 確保文字在列印時清晰 */
            * {
              color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
            }
            
            @media print {
              body { 
                background: white !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="title">${title}</div>
            <div class="settings">${printOptions.description}</div>
          </div>
          
          <div class="main-content">
            ${cardHTML}
          </div>
          
          <div class="print-footer">
            <span>列印時間: ${currentTime}</span>
            <span>第 1 頁</span>
          </div>
        </body>
      </html>
    `

    // 將內容寫入 iframe
    printDoc.open()
    printDoc.write(htmlContent)
    printDoc.close()

    // 恢復卡片原始樣式
    printTarget.style.maxWidth = originalStyles.maxWidth
    printTarget.style.maxHeight = originalStyles.maxHeight

    // 等待內容加載完成後觸發列印（優化延遲時間）
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()
        log.debug('✅ 列印對話框已開啟')
        
        // 設定清理定時器（用戶關閉列印對話框後清理）
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame)
            log.debug('🧹 iframe 已清理')
          }
        }, 5000) // 優化：從10秒減少到5秒
        
      } catch (error) {
        log.error('列印執行失敗', error)
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame)
        }
        throw new ExportError('列印功能執行失敗')
      }
    }, 300) // 優化：從500ms減少到300ms
  } catch (error) {
    log.error('❌ 列印功能失敗', error)
    
    // 發生錯誤時也要恢復卡片樣式
    printTarget.style.maxWidth = originalStyles.maxWidth
    printTarget.style.maxHeight = originalStyles.maxHeight
    
    throw new ExportError(
      `列印功能失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    )
  }
}

/**
 * 統一圖表匯出函數 - 提供瀏覽器列印方案
 */
export async function exportSVGToPDFWithFonts(
  element: SVGElement,
  options: PDFExportOptions,
): Promise<void> {
  try {
    log.debug('🚀 開始統一圖表匯出，元素類型', { type: element.constructor.name })

    // 找到圖表容器
    let targetElement: HTMLElement | null = null

    if (element instanceof SVGElement) {
      log.debug('🔍 檢測到 SVG 元素，尋找圖表容器...')

      targetElement = element.closest('[data-chart-container]') as HTMLElement

      if (!targetElement) {
        targetElement = element.closest(
          '.chart-container, .chart-card, .chart-wrapper',
        ) as HTMLElement
      }

      if (!targetElement) {
        targetElement = element.parentElement as HTMLElement
        log.debug('⚠️ 沒有找到標記的容器，使用直接父元素')
      }

      if (!targetElement) {
        throw new ExportError('找不到 SVG 的父容器元素', 'pdf')
      }

      log.debug('🎯 找到目標容器', {
        tagName: targetElement.tagName,
        className: targetElement.className,
        dataContainer: targetElement.getAttribute('data-chart-container'),
        size: {
          width: targetElement.offsetWidth,
          height: targetElement.offsetHeight,
        },
      })
    } else {
      targetElement = element as HTMLElement
    }

    // 直接使用瀏覽器列印功能
    log.debug('🖨️ 使用瀏覽器列印功能')
    return await printElementAsPDF(
      targetElement,
      options.title || options.filename || '圖表',
    )
  } catch (error) {
    log.error('❌ 圖表匯出失敗', error)
    if (error instanceof ExportError) {
      throw error
    }
    throw new ExportError(
      `圖表匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`,
    )
  }
}

/**
 * 通用匯出函數 (資料匯出)
 */
export async function exportData(
  data: MaybeRefOrGetter<any[]>,
  format: ExportFormat,
  options: ExportOptions,
): Promise<void> {
  switch (format) {
    case 'csv':
      return exportToCSV(data, options)
    case 'xlsx':
      return exportToXLSX(data, options)
    case 'json':
      return exportToJSON(data, options)
    case 'pdf':
      throw new ExportError(
        'PDF 格式請使用 exportToPDF 函數進行圖表匯出',
        'pdf',
      )
    default:
      throw new ExportError(`不支援的匯出格式: ${format}`)
  }
}

/**
 * 預設匯出選項設定
 */
export const DEFAULT_EXPORT_OPTIONS: Partial<ExportOptions> = {
  includeTimestamp: true,
  sheetName: '資料',
}

/**
 * 常用的欄位映射
 */
export const COMMON_FIELD_MAPPINGS = {
  order: {
    id: '訂單編號',
    userId: '客戶編號',
    totalAmount: '總金額',
    status: '狀態',
    createdAt: '建立時間',
    updatedAt: '更新時間',
  },
  product: {
    id: '商品編號',
    name: '商品名稱',
    price: '價格',
    stock: '庫存',
    category: '分類',
    isActive: '啟用狀態',
  },
  customer: {
    id: '客戶編號',
    email: '電子郵件',
    fullName: '姓名',
    phone: '電話',
    createdAt: '註冊時間',
  },
} as const
