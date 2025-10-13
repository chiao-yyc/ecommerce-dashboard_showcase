/**
 * 通用預設配置值
 * 用於消除專案中的 magic numbers 和硬編碼數值
 */

/**
 * 分析系統相關預設值
 */
export const ANALYTICS_DEFAULTS = {
  // 資料查詢限制
  CUSTOMER_LIMIT: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_EXPORT_ROWS: 50000,

  // 時間相關
  AVG_ORDER_INTERVAL: 45, // 平均訂單間隔（天）
  DEFAULT_ANALYSIS_DAYS: 30,
  SEASONAL_CUSTOMERS_COUNT: 320,
  TRENDING_UP_COUNT: 180,

  // 圖表尺寸
  DEFAULT_CHART_WIDTH: 800,
  DEFAULT_CHART_HEIGHT: 400,
  SMALL_CHART_WIDTH: 400,
  SMALL_CHART_HEIGHT: 300,
  CHART_MIN_HEIGHT: 300,

  // 分析閾值
  SIGNIFICANT_CHANGE_THRESHOLD: 5, // 5% 為顯著變化
  TOTAL_CUSTOMERS_ANALYZED: 1250
} as const

/**
 * API 服務相關預設值
 */
export const API_DEFAULTS = {
  // 請求超時
  DEFAULT_TIMEOUT: 30000, // 30 秒
  AI_SERVICE_TIMEOUT: 120000, // 120 秒 (AI 服務需要更長時間)
  EDGE_FUNCTION_TIMEOUT: 60000, // 60 秒

  // 重試機制
  DEFAULT_RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1 秒

  // 分頁
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const

/**
 * UI 介面相關預設值
 */
export const UI_DEFAULTS = {
  // 表單相關
  MAX_FORM_WIDTH: 440, // px
  FORM_FIELD_SPACING: 16, // px

  // 側邊欄
  SIDEBAR_WIDTH: '16rem',
  SIDEBAR_WIDTH_MOBILE: '18rem',
  SIDEBAR_WIDTH_ICON: '3rem',
  SIDEBAR_COOKIE_MAX_AGE: 604800, // 7 天 (60 * 60 * 24 * 7)

  // 動畫
  ANIMATION_DURATION: 300, // ms
  SKELETON_ANIMATION_DURATION: 1500, // ms

  // 載入動畫
  LOADING_BACKGROUND_SIZE: '800px 104px',
  LOADING_BACKGROUND_POSITION: '468px 0',

  // 日曆
  CALENDAR_MAX_WIDTH: 900 // px
} as const

/**
 * 業務邏輯相關預設值
 */
export const BUSINESS_DEFAULTS = {
  // 庫存相關
  LOW_STOCK_THRESHOLD: 10,
  OUT_OF_STOCK_THRESHOLD: 0,
  OVERSTOCK_THRESHOLD: 1000,

  // 訂單相關
  HIGH_VALUE_ORDER_THRESHOLD: 10000, // NT$
  BULK_ORDER_MIN_QUANTITY: 100,

  // 客戶分析
  VIP_CUSTOMER_THRESHOLD: 50000, // NT$ 年消費金額
  ACTIVE_CUSTOMER_DAYS: 90, // 活躍客戶定義：90 天內有交易

  // RFM 分析
  RFM_SCORE_MAX: 5,
  RFM_SCORE_MIN: 1
} as const

/**
 * 系統效能相關預設值
 */
export const PERFORMANCE_DEFAULTS = {
  // 實時更新頻率
  REALTIME_UPDATE_INTERVAL: 5000, // 5 秒
  DASHBOARD_REFRESH_INTERVAL: 30000, // 30 秒

  // 快取
  CACHE_TTL: 300000, // 5 分鐘
  CACHE_MAX_SIZE: 100,

  // 錯誤重試
  MAX_ERROR_COUNT: 3,
  ERROR_WINDOW_TIME: 300000, // 5 分鐘

  // 批次處理
  BATCH_SIZE: 100,
  MAX_CONCURRENT_REQUESTS: 5
} as const

/**
 * 開發環境相關預設值
 */
export const DEV_DEFAULTS = {
  // 除錯
  DEBUG_LOG_MAX_ENTRIES: 1000,
  DEBUG_PANEL_WIDTH: 400,

  // 測試資料
  MOCK_DATA_SIZE: 50,
  TEST_USER_COUNT: 100
} as const

/**
 * 數值格式化相關預設值
 */
export const FORMAT_DEFAULTS = {
  // 小數點位數
  PERCENTAGE_DECIMALS: 1,           // 百分比：xx.x%
  SCORE_DECIMALS: 1,               // 評分：x.x
  CURRENCY_DECIMALS: 0,            // 貨幣：整數顯示
  RATE_DECIMALS: 1,                // 比率：x.x
  COUNT_DECIMALS: 0,               // 計數：整數顯示
  PRECISION_DECIMALS: 2,           // 高精度：xx.xx

  // 貨幣格式化
  DEFAULT_CURRENCY: 'TWD',
  DEFAULT_LOCALE: 'zh-TW',

  // 閾值設定
  LARGE_NUMBER_THRESHOLD: 10000,   // 超過此數值使用 compact 格式
  PERCENTAGE_MAX: 100,             // 百分比上限
  SCORE_MAX: 10,                   // 評分上限

  // 空值處理
  NULL_VALUE_DISPLAY: 'N/A',
  ZERO_VALUE_DISPLAY: '0',
  LOADING_DISPLAY: '載入中...'
} as const

/**
 * 匯出所有預設值的類型定義
 */
export type AnalyticsDefaults = typeof ANALYTICS_DEFAULTS
export type ApiDefaults = typeof API_DEFAULTS
export type UiDefaults = typeof UI_DEFAULTS
export type BusinessDefaults = typeof BUSINESS_DEFAULTS
export type PerformanceDefaults = typeof PERFORMANCE_DEFAULTS
export type DevDefaults = typeof DEV_DEFAULTS
export type FormatDefaults = typeof FORMAT_DEFAULTS