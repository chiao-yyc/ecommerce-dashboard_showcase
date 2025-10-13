import { AttributionLayer } from '@/types/campaign'
import type { StatusType } from '@/utils/status-helpers'

/**
 * Attribution Layer 完整配置介面
 */
export interface AttributionLayerConfig {
  /** 中文顯示名稱 */
  displayName: string
  /** 詳細描述 */
  description: string
  /** StatusBadge 狀態類型 */
  status: StatusType
  /** 優先權重 (數字越高優先權越高) */
  priority: number
  /** 歸因權重 (用於計算最終歸因影響力) */
  weight: number
}

/**
 * Attribution Layer 完整配置對象
 *
 * 根據業務重要性層級設計：
 * - SITE_WIDE: 全站影響，最高重要性 (error/紅色)
 * - TARGET_ORIENTED: 目標導向，高重要性 (warning/橙色)
 * - CATEGORY_SPECIFIC: 品類專屬，中等重要性 (info/藍色)
 * - GENERAL: 一般活動，基礎重要性 (neutral/灰色)
 */
export const ATTRIBUTION_LAYER_CONFIG: Record<AttributionLayer, AttributionLayerConfig> = {
  [AttributionLayer.SITE_WIDE]: {
    displayName: '全站活動',
    description: '影響全體用戶的重大推廣活動，如週年慶、雙11等',
    status: 'error',
    priority: 4,
    weight: 1.0
  },
  [AttributionLayer.TARGET_ORIENTED]: {
    displayName: '目標導向',
    description: '針對特定用戶群體的精準行銷活動',
    status: 'warning',
    priority: 3,
    weight: 0.8
  },
  [AttributionLayer.CATEGORY_SPECIFIC]: {
    displayName: '品類專屬',
    description: '限定特定商品類別的促銷活動',
    status: 'info',
    priority: 2,
    weight: 0.6
  },
  [AttributionLayer.GENERAL]: {
    displayName: '一般活動',
    description: '日常基礎推廣活動，如新品上市、庫存清理等',
    status: 'neutral',
    priority: 1,
    weight: 0.4
  }
} as const

/**
 * 根據 Attribution Layer 取得完整配置
 *
 * @param layer - Attribution Layer enum 值
 * @returns 對應的配置對象，未知層級時返回預設配置
 */
export function getAttributionLayerConfig(layer: AttributionLayer): AttributionLayerConfig {
  return ATTRIBUTION_LAYER_CONFIG[layer] || {
    displayName: '未知層級',
    description: '未定義的歸因層級',
    status: 'neutral',
    priority: 0,
    weight: 0.5
  }
}

/**
 * 根據 Attribution Layer 取得 StatusType
 *
 * @param layer - Attribution Layer enum 值
 * @returns 對應的 StatusType
 */
export function getStatusByAttributionLayer(layer: AttributionLayer): StatusType {
  return getAttributionLayerConfig(layer).status
}

/**
 * 根據 Attribution Layer 取得顯示名稱
 *
 * @param layer - Attribution Layer enum 值
 * @returns 中文顯示名稱
 */
export function getAttributionLayerDisplayName(layer: AttributionLayer): string {
  return getAttributionLayerConfig(layer).displayName
}

/**
 * 根據 Attribution Layer 取得描述
 *
 * @param layer - Attribution Layer enum 值
 * @returns 詳細描述
 */
export function getAttributionLayerDescription(layer: AttributionLayer): string {
  return getAttributionLayerConfig(layer).description
}

/**
 * 根據 Attribution Layer 取得優先權重
 *
 * @param layer - Attribution Layer enum 值
 * @returns 優先權重數值
 */
export function getAttributionLayerPriority(layer: AttributionLayer): number {
  return getAttributionLayerConfig(layer).priority
}

/**
 * 根據 Attribution Layer 取得歸因權重
 *
 * @param layer - Attribution Layer enum 值
 * @returns 歸因權重 (0.0 - 1.0)
 */
export function getAttributionLayerWeight(layer: AttributionLayer): number {
  return getAttributionLayerConfig(layer).weight
}

/**
 * 計算最終歸因權重
 *
 * @param layer - Attribution Layer enum 值
 * @param campaignWeight - 活動權重 (預設 1.0)
 * @returns 最終歸因權重
 */
export function calculateFinalAttributionWeight(
  layer: AttributionLayer,
  campaignWeight: number = 1.0
): number {
  const layerWeight = getAttributionLayerWeight(layer)
  return layerWeight * campaignWeight
}

/**
 * 取得所有 Attribution Layer 的顯示名稱映射 (靜態配置版本)
 *
 * @returns 以 enum 為 key 的顯示名稱對象
 */
export function getAllAttributionLayerDisplayNames(): Record<AttributionLayer, string> {
  return {
    [AttributionLayer.SITE_WIDE]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.SITE_WIDE].displayName,
    [AttributionLayer.TARGET_ORIENTED]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.TARGET_ORIENTED].displayName,
    [AttributionLayer.CATEGORY_SPECIFIC]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.CATEGORY_SPECIFIC].displayName,
    [AttributionLayer.GENERAL]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.GENERAL].displayName
  }
}

/**
 * 取得所有 Attribution Layer 的描述映射 (靜態配置版本)
 *
 * @returns 以 enum 為 key 的描述對象
 */
export function getAllAttributionLayerDescriptions(): Record<AttributionLayer, string> {
  return {
    [AttributionLayer.SITE_WIDE]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.SITE_WIDE].description,
    [AttributionLayer.TARGET_ORIENTED]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.TARGET_ORIENTED].description,
    [AttributionLayer.CATEGORY_SPECIFIC]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.CATEGORY_SPECIFIC].description,
    [AttributionLayer.GENERAL]: ATTRIBUTION_LAYER_CONFIG[AttributionLayer.GENERAL].description
  }
}

/**
 * 混合配置策略：使用動態資料優先，靜態配置作為 fallback
 *
 * @param layer - Attribution Layer enum 值
 * @param dynamicDisplayName - 來自資料庫的顯示名稱 (可選)
 * @param dynamicDescription - 來自資料庫的描述 (可選)
 * @returns 完整的層級配置，優先使用動態資料
 */
export function getHybridAttributionLayerConfig(
  layer: AttributionLayer,
  dynamicDisplayName?: string,
  dynamicDescription?: string
): AttributionLayerConfig {
  const staticConfig = getAttributionLayerConfig(layer)

  return {
    ...staticConfig,
    displayName: dynamicDisplayName || staticConfig.displayName,
    description: dynamicDescription || staticConfig.description
  }
}

/**
 * 從活動類型配置陣列建立動態顯示名稱映射
 *
 * @param campaignTypes - 活動類型配置陣列 (來自資料庫)
 * @returns 動態的顯示名稱映射，以靜態配置為 fallback
 */
export function createDynamicLayerDisplayNames(
  campaignTypes: Array<{ attribution_layer: AttributionLayer; display_name_zh?: string }>
): Record<AttributionLayer, string> {
  const staticNames = getAllAttributionLayerDisplayNames()
  const dynamicNames = { ...staticNames }

  // 從活動類型配置中提取層級對應的顯示名稱
  const layerDisplayMap: Partial<Record<AttributionLayer, string>> = {}

  campaignTypes.forEach(type => {
    if (type.display_name_zh && !layerDisplayMap[type.attribution_layer]) {
      // 只使用每個層級的第一個顯示名稱作為層級代表名稱
      layerDisplayMap[type.attribution_layer] = type.display_name_zh
    }
  })

  // 將動態資料覆蓋到靜態配置上
  Object.entries(layerDisplayMap).forEach(([layer, displayName]) => {
    if (displayName) {
      dynamicNames[layer as AttributionLayer] = displayName
    }
  })

  return dynamicNames
}

/**
 * 歸因層級系統說明定義
 * 用於 StructuredTooltipContent 的完整系統說明
 */
export const ATTRIBUTION_LAYER_SYSTEM_DEFINITION = {
  title: '活動歸因層級系統',
  formula: '四層歸因架構：全站(4) > 目標(3) > 品類(2) > 一般(1)',
  benchmark: '全站活動：最高影響力 | 目標導向：精準行銷 | 品類專屬：類別促銷 | 一般活動：基礎推廣',
  businessRule: '多活動重疊時，按層級權重進行歸因計算，同層級活動依活動類型優先級分配',
  dataSource: '歸因層級配置與資料庫 campaign_type_config 表',
  updateFrequency: '即時 (建立活動時依據活動類型自動分配層級)',
  notes: '歸因層級影響訂單歸因計算、效果分析權重，以及活動間協作效果評估。系統使用複雜的歸因演算法確保公平且精準的效果歸屬。'
}