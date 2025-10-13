/**
 * Constants 統一匯出
 *
 * 提供所有常數的統一訪問接口
 * 使用方式：import { LAYER_WEIGHTS, EXPORT_CONFIG, ANALYTICS_DEFAULTS } from '@/constants'
 */

// 活動歸因相關常數
export * from './campaignLayers'

// 匯出功能相關常數
export * from './export'

// 通用預設值和配置
export * from './defaults'

// 庫存操作相關常數
export * from './inventory'

// 運送方式相關常數
export * from './shipping'

// RFM 客戶分群相關常數
export * from './rfm-segments'