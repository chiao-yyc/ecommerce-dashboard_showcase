/**
 * 庫存操作來源配置
 *
 * 重要說明：
 * - source 欄位在資料庫中為 text 類型，無 ENUM 或 CHECK 約束限制
 * - 完全由前端應用層控制，具備完整的自定義彈性
 * - 選項分為「已在資料庫使用」和「業務邏輯擴展」兩類
 *
 * 資料庫實際使用 (基於 inventory_logs 表查詢):
 * - order_fulfillment (訂單履約出庫)
 * - manual_stock_in (手動入庫)
 * - order_reservation (訂單預留)
 * - adjustment (庫存調整)
 * - manual_outbound (手動出庫)
 * - order (一般訂單出庫)
 */

/**
 * 庫存操作類型選擇指引
 *
 * 📥 入庫 (STOCK_IN): 純粹增加庫存數量
 * - 適用：採購收貨、生產完成、客戶退貨、調撥入庫等
 * - 特點：數量只能為正數，創建新的庫存記錄
 *
 * 📤 出庫 (STOCK_OUT): 純粹減少庫存數量
 * - 適用：訂單出貨、調撥出庫、損壞報廢等
 * - 特點：數量只能為正數，按 FIFO 原則扣減現有庫存
 *
 * ⚖️ 調整 (ADJUSTMENT): 複雜的庫存修正
 * - 適用：盤點調整、系統錯誤修正、發現損耗等
 * - 特點：可正可負，支援目標型調整（盤點）和增減型調整
 */

import type {
  InventoryOperationType,
  InventorySourceOption,
} from '@/types/product'
import { INVENTORY_OPERATION_TYPES } from '@/types/product'

/**
 * 入庫來源選項
 *
 * 資料庫使用狀態：
 * ✓ manual_stock_in
 * ✗ 其他選項為業務邏輯擴展
 */
export const STOCK_IN_SOURCES: InventorySourceOption[] = [
  {
    value: 'manual_stock_in',
    label: '手動入庫',
    description: '管理員手動執行的入庫操作',
  },
  {
    value: 'supplier_delivery',
    label: '供應商交貨',
    description: '供應商直接交貨入庫',
  },
  {
    value: 'purchase_receipt',
    label: '採購收貨',
    description: '採購訂單收貨入庫',
  },
  {
    value: 'production_complete',
    label: '生產完成',
    description: '生產線完成產品入庫',
  },
  {
    value: 'return_from_customer',
    label: '客戶退貨',
    description: '客戶退回商品入庫',
  },
  {
    value: 'transfer_in',
    label: '調撥入庫',
    description: '從其他倉庫調撥入庫',
  },
  {
    value: 'other_in',
    label: '其他入庫',
    description: '其他未分類的入庫原因',
  },
]

/**
 * 出庫來源選項
 *
 * 資料庫使用狀態（按使用頻率排序）：
 * ✓ order_fulfillment
 * ✓ order_reservation
 * ✓ manual_outbound
 * ✓ order
 * ✗ 其他選項為業務邏輯擴展
 */
export const STOCK_OUT_SOURCES: InventorySourceOption[] = [
  {
    value: 'manual_outbound',
    label: '手動出庫',
    description: '管理員手動執行的出庫操作',
  },
  {
    value: 'order_fulfillment',
    label: '訂單履約出庫',
    description: '訂單完成出貨的庫存扣減',
  },
  {
    value: 'order_reservation',
    label: '訂單預留出庫',
    description: '訂單預留庫存的扣減',
  },
  {
    value: 'order',
    label: '訂單出庫',
    description: '一般訂單相關的出庫',
  },
  {
    value: 'transfer_out',
    label: '調撥出庫',
    description: '調撥至其他倉庫的出庫',
  },
  {
    value: 'damage_disposal',
    label: '損壞報廢',
    description: '商品損壞或過期的報廢處理',
  },
  {
    value: 'other_out',
    label: '其他出庫',
    description: '其他未分類的出庫原因',
  },
]

/**
 * 調整來源選項
 *
 * 資料庫使用狀態：
 * ✓ adjustment
 * ✗ 其他選項為業務邏輯擴展，將來可作為不同的 source 值儲存，提供更精確的分類
 */
export const ADJUSTMENT_SOURCES: InventorySourceOption[] = [
  {
    value: 'adjustment',
    label: '手動調整',
    description: '管理員手動執行的庫存調整（可增可減）',
    supportsDirection: true,
  },
  {
    value: 'inventory_count',
    label: '盤點調整',
    description: '定期盤點後的庫存數量修正（可增可減）',
    supportsDirection: true,
  },
  {
    value: 'damaged_goods',
    label: '商品損壞調整',
    description: '發現商品損壞的庫存調整',
  },
  {
    value: 'expired_goods',
    label: '商品過期調整',
    description: '商品過期導致的庫存調整',
  },
  {
    value: 'lost_goods',
    label: '商品遺失調整',
    description: '商品遺失或失竊的調整',
  },
  {
    value: 'quality_issue',
    label: '品質問題調整',
    description: '品質檢驗不合格的調整',
  },
  {
    value: 'system_error_fix',
    label: '系統錯誤修正',
    description: '修正系統錯誤導致的庫存偏差（可增可減）',
    supportsDirection: true,
  },
  {
    value: 'other_adjustment',
    label: '其他調整',
    description: '其他未分類的調整原因（可增可減）',
    supportsDirection: true,
  },
]

/**
 * 根據操作類型獲取對應的來源選項
 */
export const getSourcesByOperationType = (
  operationType: InventoryOperationType,
): InventorySourceOption[] => {
  switch (operationType) {
    case INVENTORY_OPERATION_TYPES.STOCK_IN:
      return STOCK_IN_SOURCES
    case INVENTORY_OPERATION_TYPES.STOCK_OUT:
      return STOCK_OUT_SOURCES
    case INVENTORY_OPERATION_TYPES.ADJUSTMENT:
      return ADJUSTMENT_SOURCES
    default:
      return []
  }
}

/**
 * 取得來源選項的標籤文字
 * 用於歷史記錄顯示和報表生成
 */
export const getSourceLabel = (source: string): string => {
  const allSources = [
    ...STOCK_IN_SOURCES,
    ...STOCK_OUT_SOURCES,
    ...ADJUSTMENT_SOURCES,
  ]
  const found = allSources.find((s) => s.value === source)
  return found?.label || source
}

// 移除 isSourceUsedInDatabase 函數，不再需要

/**
 * 檢查來源選項是否支援增減方向選擇
 */
export const isSourceSupportsDirection = (source: string): boolean => {
  const allSources = [
    ...STOCK_IN_SOURCES,
    ...STOCK_OUT_SOURCES,
    ...ADJUSTMENT_SOURCES,
  ]
  const found = allSources.find((s) => s.value === source)
  return found?.supportsDirection === true
}

/**
 * 獲取預設的來源選項
 * 根據操作類型返回合適的預設值
 */
export const getDefaultSource = (
  operationType: InventoryOperationType,
): string => {
  switch (operationType) {
    case INVENTORY_OPERATION_TYPES.STOCK_IN:
      return 'manual_stock_in' // 使用資料庫中最常用的入庫類型
    case INVENTORY_OPERATION_TYPES.STOCK_OUT:
      return 'manual_outbound' // 手動出庫作為預設
    case INVENTORY_OPERATION_TYPES.ADJUSTMENT:
      return 'adjustment' // 手動調整作為預設
    default:
      return ''
  }
}

/**
 * 庫存操作的中文名稱映射
 */
export const OPERATION_TYPE_LABELS: Record<InventoryOperationType, string> = {
  [INVENTORY_OPERATION_TYPES.STOCK_IN]: '入庫作業',
  [INVENTORY_OPERATION_TYPES.STOCK_OUT]: '出庫作業',
  [INVENTORY_OPERATION_TYPES.ADJUSTMENT]: '庫存調整',
}
