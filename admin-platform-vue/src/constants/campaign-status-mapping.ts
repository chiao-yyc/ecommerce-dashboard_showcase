import { AttributionLayer } from '@/types/campaign'
import type { StatusType } from '@/utils/status-helpers'
import {
  getStatusByAttributionLayer as getStatusFromConfig,
} from './attribution-layer-config'

/**
 * 根據 Attribution Layer 取得對應的 StatusType
 *
 * @param layer - Attribution Layer enum 值
 * @returns 對應的 StatusType，未知層級時返回 'neutral'
 *
 * @example
 * ```typescript
 * const status = getStatusByAttributionLayer(AttributionLayer.SITE_WIDE) // 返回 'error'
 * ```
 */
export function getStatusByAttributionLayer(layer: AttributionLayer): StatusType {
  return getStatusFromConfig(layer)
}

/**
 * 取得 Attribution Layer 的顯示標題
 * 包含層級描述和英文層級名稱
 *
 * @param layer - Attribution Layer enum 值
 * @param displayName - 活動類型顯示名稱
 * @param description - 活動類型描述 (可選)
 * @returns 格式化的標題字串
 *
 * @example
 * ```typescript
 * const title = getAttributionLayerTitle(AttributionLayer.SITE_WIDE, '週年慶', '年度大型促銷活動')
 * // 返回: "年度大型促銷活動 (site-wide)"
 * ```
 */
export function getAttributionLayerTitle(
  layer: AttributionLayer,
  displayName: string,
  description?: string
): string {
  const displayText = description || displayName
  return `${displayText} (${layer})`
}