/**
 * 運送方式配置
 *
 * 重要說明：
 * - shipping_method 欄位在資料庫中為 character varying(50) 類型，無 ENUM 或 CHECK 約束
 * - 驗證完全由應用層控制，具備完整的自定義彈性
 * - 選項值需與後端 OrderApiService 驗證邏輯保持一致
 */

/**
 * 運送方式選項介面
 */
export interface ShippingMethodOption {
  value: string
  label: string
  description?: string
  estimatedDays?: string
  baseFee?: number
}

/**
 * 運送方式選項配置
 *
 * 資料庫實際使用 (基於 orders 表和測試資料):
 * - standard (標準配送)
 * - express (快速配送)
 * - convenience_store (便利商店取貨)
 * - pickup (自取) - 測試資料中使用
 * - same_day (當日配送) - 測試資料中使用
 */
export const SHIPPING_METHOD_OPTIONS: ShippingMethodOption[] = [
  {
    value: 'standard',
    label: '標準配送',
    description: '一般配送服務，適合不急的訂單',
    estimatedDays: '3-5 工作天',
    baseFee: 60,
  },
  {
    value: 'express',
    label: '快速配送',
    description: '加急配送服務，隔日送達',
    estimatedDays: '1-2 工作天',
    baseFee: 120,
  },
  {
    value: 'convenience_store',
    label: '便利商店取貨',
    description: '送至指定便利商店，取貨付款',
    estimatedDays: '2-4 工作天',
    baseFee: 45,
  },
]

/**
 * 獲取運送方式的標籤文字
 * 用於訂單列表顯示和報表生成
 *
 * @param value - 運送方式值
 * @returns 對應的標籤文字
 */
export const getShippingMethodLabel = (value: string): string => {
  const found = SHIPPING_METHOD_OPTIONS.find(option => option.value === value)
  return found?.label || value
}

/**
 * 獲取運送方式的描述
 *
 * @param value - 運送方式值
 * @returns 對應的描述文字
 */
export const getShippingMethodDescription = (value: string): string => {
  const found = SHIPPING_METHOD_OPTIONS.find(option => option.value === value)
  return found?.description || ''
}

/**
 * 獲取預估配送時間
 *
 * @param value - 運送方式值
 * @returns 預估配送時間
 */
export const getEstimatedDeliveryDays = (value: string): string => {
  const found = SHIPPING_METHOD_OPTIONS.find(option => option.value === value)
  return found?.estimatedDays || '未知'
}

/**
 * 獲取基本運費
 *
 * @param value - 運送方式值
 * @returns 基本運費金額
 */
export const getBaseFee = (value: string): number => {
  const found = SHIPPING_METHOD_OPTIONS.find(option => option.value === value)
  return found?.baseFee || 0
}

/**
 * 有效的運送方式值陣列
 * 用於後端驗證
 */
export const VALID_SHIPPING_METHODS = SHIPPING_METHOD_OPTIONS.map(option => option.value)

/**
 * 檢查運送方式是否有效
 *
 * @param value - 要檢查的運送方式值
 * @returns 是否為有效的運送方式
 */
export const isValidShippingMethod = (value: string): boolean => {
  return VALID_SHIPPING_METHODS.includes(value)
}

/**
 * 獲取預設的運送方式
 *
 * @returns 預設運送方式值
 */
export const getDefaultShippingMethod = (): string => {
  return 'standard'
}

/**
 * 運送方式的中文名稱映射
 * 用於快速查詢
 */
export const SHIPPING_METHOD_LABELS: Record<string, string> = SHIPPING_METHOD_OPTIONS.reduce(
  (acc, option) => ({
    ...acc,
    [option.value]: option.label,
  }),
  {} as Record<string, string>
)