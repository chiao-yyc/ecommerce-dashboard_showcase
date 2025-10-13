/**
 * 庫存 Realtime 更新功能
 *
 * 專門處理庫存相關的即時更新，不包含產品資訊管理
 */

import { createModuleLogger } from '@/utils/logger'
import { ref, onUnmounted, getCurrentInstance } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  useRealtimeErrorTracking,
  RealtimeStatusHandlers,
} from './useRealtimeErrorTracking'

const log = createModuleLogger('Composable', 'InventoryRealtime')

interface InventoryRealtimeEvent {
  productId: string
  eventType: 'stock_update' | 'status_change'
  data: any
  timestamp: number
}

type InventoryRealtimeCallback = (event: InventoryRealtimeEvent) => void

export const useInventoryRealtime = () => {
  // 使用共用錯誤監控機制
  const errorTracker = useRealtimeErrorTracking('inventory')

  // 訂閲管理
  const inventoryChannels = new Map<string, any>()
  const callbacks = new Map<string, InventoryRealtimeCallback[]>()

  // 狀態追蹤
  const connectedInventories = ref<Set<string>>(new Set())
  const failedConnections = ref<Set<string>>(new Set())

  /**
   * 訂閱庫存更新
   */
  const subscribeToInventory = (
    productId: string,
    callback: InventoryRealtimeCallback,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // 檢查是否已經訂閱
        if (inventoryChannels.has(productId)) {
          // 添加新的回調函數
          const existingCallbacks = callbacks.get(productId) || []
          callbacks.set(productId, [...existingCallbacks, callback])
          resolve(true)
          return
        }

        log.debug(`📊 訂閱產品 ${productId} 的庫存 Realtime 更新`)

        // 訂閱庫存表更新
        const inventoryChannel = supabase
          .channel(`inventory-${productId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'inventories',
              filter: `product_id=eq.${productId}`,
            },
            (payload) => {
              log.debug(`📊 產品 ${productId} 庫存更新:`, payload.new)

              const event: InventoryRealtimeEvent = {
                productId,
                eventType: 'stock_update',
                data: payload.new,
                timestamp: Date.now(),
              }

              // 觸發回調函數
              const inventoryCallbacks = callbacks.get(productId) || []
              inventoryCallbacks.forEach((cb) => cb(event))
            },
          )
          .subscribe((status) => {
            log.debug(`📊 產品 ${productId} 庫存 Realtime 狀態:`, status)

            // 使用共用錯誤處理機制
            RealtimeStatusHandlers.handleSubscriptionStatus(
              status,
              errorTracker,
              () => {
                // 連線成功
                connectedInventories.value.add(productId)
                failedConnections.value.delete(productId)
                resolve(true)
              },
              () => {
                // 連線失敗
                connectedInventories.value.delete(productId)
                failedConnections.value.add(productId)
                resolve(false)
              },
            )
          })

        inventoryChannels.set(productId, inventoryChannel)
        callbacks.set(productId, [callback])
      } catch (error) {
        log.error(`❌ 訂閱產品 ${productId} 庫存 Realtime 失敗:`, error)

        // 使用共用錯誤處理機制
        RealtimeStatusHandlers.handleSubscriptionError(
          error,
          errorTracker,
          'subscription',
        )
        failedConnections.value.add(productId)

        resolve(false)
      }
    })
  }

  /**
   * 取消訂閱指定產品的庫存更新
   */
  const unsubscribeFromInventory = (productId: string) => {
    const channel = inventoryChannels.get(productId)
    if (channel) {
      channel.unsubscribe()
      inventoryChannels.delete(productId)
      callbacks.delete(productId)
      connectedInventories.value.delete(productId)
      failedConnections.value.delete(productId)

      log.debug(`🔕 取消訂閱產品 ${productId} 的庫存 Realtime 更新`)
    }
  }

  /**
   * 取消所有庫存訂閱
   */
  const unsubscribeAllInventories = () => {
    inventoryChannels.forEach((channel, productId) => {
      channel.unsubscribe()
      log.debug(`🔕 取消訂閱產品 ${productId} 的庫存 Realtime 更新`)
    })

    inventoryChannels.clear()
    callbacks.clear()
    connectedInventories.value.clear()
    failedConnections.value.clear()

    log.debug('🔕 已取消所有庫存 Realtime 訂閱')
  }

  /**
   * 重置錯誤統計
   */
  const resetErrorStats = () => {
    errorTracker.resetErrorStats()
    failedConnections.value.clear()
  }

  /**
   * 獲取連線狀態摘要
   */
  const getConnectionSummary = () => {
    const errorSummary = errorTracker.getErrorSummary()

    return {
      totalSubscriptions: inventoryChannels.size,
      connectedCount: connectedInventories.value.size,
      failedCount: failedConnections.value.size,
      errorCount: errorSummary.errorCount,
      lastError: errorSummary.lastError,
      errorHistory: errorSummary.errorHistory,
      isHealthy: failedConnections.value.size === 0 && errorSummary.isHealthy,
    }
  }

  // 提供手動清理方法供組件使用
  const setupAutoCleanup = () => {
    const instance = getCurrentInstance()
    if (instance) {
      onUnmounted(() => {
        unsubscribeAllInventories()
      })
    }
  }

  return {
    // 訂閱功能
    subscribeToInventory,
    unsubscribeFromInventory,
    unsubscribeAllInventories,

    // 狀態
    connectedInventories,
    failedConnections,

    // 錯誤追蹤 (來自共用機制)
    errorCount: errorTracker.errorCount,
    lastError: errorTracker.lastError,

    // 工具函數
    resetErrorStats,
    getConnectionSummary,
    setupAutoCleanup,
  }
}

// 全域庫存 Realtime 管理實例
let globalInventoryRealtime: ReturnType<typeof useInventoryRealtime> | null =
  null

/**
 * 獲取全域庫存 Realtime 實例
 */
export const getGlobalInventoryRealtime = () => {
  if (!globalInventoryRealtime) {
    globalInventoryRealtime = useInventoryRealtime()
  }
  return globalInventoryRealtime
}
