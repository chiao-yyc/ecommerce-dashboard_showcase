import { convertToISOString } from '@/utils'
/**
 * Support Tickets Realtime 錯誤監控功能
 *
 * 專門處理支援工單層級的即時連線監控和錯誤追蹤
 * 監控 conversations 表的 Realtime 訂閱狀態
 */

import { ref, onUnmounted, getCurrentInstance } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  useRealtimeErrorTracking,
  RealtimeStatusHandlers,
} from './useRealtimeErrorTracking'
import { createModuleLogger } from '@/utils/logger'
// import type { RealtimeErrorTracker } from './useRealtimeErrorTracking' // 未使用

const log = createModuleLogger('Composable', 'SupportTicketsRealtime')

interface SupportTicketRealtimeEvent {
  conversationId: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
}

type SupportTicketRealtimeCallback = (event: SupportTicketRealtimeEvent) => void

interface SupportTicketConnectionInfo {
  channelName: string
  isConnected: boolean
  hasError: boolean
  connectedAt?: string
}

export const useSupportTicketsRealtime = () => {
  // 使用共用錯誤監控機制
  const errorTracker = useRealtimeErrorTracking('conversations')

  // 訂閱管理
  const supportTicketChannels = new Map<string, any>()
  const callbacks = new Map<string, SupportTicketRealtimeCallback[]>()

  // 狀態追蹤
  const connectedChannels = ref<Map<string, SupportTicketConnectionInfo>>(
    new Map(),
  )
  const failedConnections = ref<Set<string>>(new Set())

  /**
   * 訂閱 conversations 表的變更（支援工單層級）
   */
  const subscribeToSupportTickets = (
    filter?: string,
    callback?: SupportTicketRealtimeCallback,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const channelName = filter
          ? `support-tickets-${filter}`
          : 'support-tickets-all'

        // 檢查是否已經訂閱
        if (supportTicketChannels.has(channelName)) {
          if (callback) {
            // 添加新的回調函數
            const existingCallbacks = callbacks.get(channelName) || []
            callbacks.set(channelName, [...existingCallbacks, callback])
          }
          resolve(true)
          return
        }

        log.debug('訂閱支援工單 Realtime 更新', { channelName })

        // 創建 Supabase channel
        const supportTicketChannel = supabase.channel(channelName)

        // 監聽 INSERT 事件
        supportTicketChannel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'conversations',
            ...(filter && { filter }),
          },
          (payload) => {
            log.debug('新工單建立', { channelName, ticket: payload.new })

            const event: SupportTicketRealtimeEvent = {
              conversationId: payload.new?.id,
              eventType: 'INSERT',
              data: payload.new,
              timestamp: Date.now(),
            }

            // 觸發回調函數
            const channelCallbacks = callbacks.get(channelName) || []
            channelCallbacks.forEach((cb) => cb(event))
          },
        )

        // 監聽 UPDATE 事件
        supportTicketChannel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            ...(filter && { filter }),
          },
          (payload) => {
            log.debug('工單更新', { channelName, ticket: payload.new })

            const event: SupportTicketRealtimeEvent = {
              conversationId: payload.new?.id,
              eventType: 'UPDATE',
              data: payload.new,
              timestamp: Date.now(),
            }

            // 觸發回調函數
            const channelCallbacks = callbacks.get(channelName) || []
            channelCallbacks.forEach((cb) => cb(event))
          },
        )

        // 訂閱並處理連線狀態
        supportTicketChannel.subscribe((status) => {
          log.debug('支援工單 Realtime 狀態', { channelName, status })

          RealtimeStatusHandlers.handleSubscriptionStatus(
            status,
            errorTracker,
            () => {
              // 連線成功
              connectedChannels.value.set(channelName, {
                channelName,
                isConnected: true,
                hasError: false,
                connectedAt: convertToISOString(new Date()),
              })
              failedConnections.value.delete(channelName)
              resolve(true)
            },
            () => {
              // 連線失敗
              connectedChannels.value.set(channelName, {
                channelName,
                isConnected: false,
                hasError: true,
              })
              failedConnections.value.add(channelName)
              resolve(false)
            },
          )
        })

        supportTicketChannels.set(channelName, supportTicketChannel)
        if (callback) {
          callbacks.set(channelName, [callback])
        }
      } catch (error) {
        log.error('訂閱支援工單 Realtime 失敗', { error })

        // 使用共用錯誤處理
        RealtimeStatusHandlers.handleSubscriptionError(
          error,
          errorTracker,
          'subscription',
        )

        const channelName = filter
          ? `support-tickets-${filter}`
          : 'support-tickets-all'
        connectedChannels.value.set(channelName, {
          channelName,
          isConnected: false,
          hasError: true,
        })
        failedConnections.value.add(channelName)

        resolve(false)
      }
    })
  }

  /**
   * 取消訂閱指定頻道的更新
   */
  const unsubscribeFromSupportTickets = (channelName?: string) => {
    const targetChannelName = channelName || 'support-tickets-all'
    const channel = supportTicketChannels.get(targetChannelName)
    if (channel) {
      channel.unsubscribe()
      supportTicketChannels.delete(targetChannelName)
      callbacks.delete(targetChannelName)
      connectedChannels.value.delete(targetChannelName)
      failedConnections.value.delete(targetChannelName)

      log.debug('取消訂閱支援工單 Realtime 更新', { channelName: targetChannelName })
    }
  }

  /**
   * 取消所有支援工單訂閱
   */
  const unsubscribeAllSupportTickets = () => {
    supportTicketChannels.forEach((channel, channelName) => {
      channel.unsubscribe()
      log.debug('取消訂閱支援工單 Realtime 更新', { channelName })
    })

    supportTicketChannels.clear()
    callbacks.clear()
    connectedChannels.value.clear()
    failedConnections.value.clear()

    log.debug('已取消所有支援工單 Realtime 訂閱')
  }

  /**
   * 獲取連線狀態摘要
   */
  const getConnectionSummary = () => {
    const connectedCount = Array.from(connectedChannels.value.values()).filter(
      (info) => info.isConnected,
    ).length

    const errorSummary = errorTracker.getErrorSummary()

    return {
      totalSubscriptions: supportTicketChannels.size,
      connectedCount,
      failedCount: failedConnections.value.size,
      errorCount: errorSummary.errorCount,
      lastError: errorSummary.lastError,
      errorHistory: errorSummary.errorHistory,
      isHealthy: failedConnections.value.size === 0 && errorSummary.isHealthy,
      connections: Array.from(connectedChannels.value.values()),
    }
  }

  /**
   * 重新連線失敗的頻道
   */
  const reconnectFailedSupportTickets = async () => {
    log.debug('🔄 重新連線失敗的支援工單頻道...')

    const failedChannelNames = Array.from(failedConnections.value)
    if (failedChannelNames.length === 0) {
      log.debug('✅ 沒有失敗的支援工單連線需要重連')
      return
    }

    // 重置錯誤統計
    errorTracker.resetErrorStats()

    // 嘗試重新連線每個失敗的頻道
    for (const channelName of failedChannelNames) {
      const existingCallbacks = callbacks.get(channelName) || []

      log.debug('重新連線支援工單頻道', { channelName })

      // 先取消訂閱
      unsubscribeFromSupportTickets(channelName)

      // 等待一秒後重新訂閱
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 重新訂閱 (使用第一個回調函數)
      const success = await subscribeToSupportTickets(
        channelName.replace('support-tickets-', ''),
        existingCallbacks[0],
      )

      if (success) {
        log.info('支援工單頻道重新連線成功', { channelName })
        // 重新添加其他回調函數
        for (let i = 1; i < existingCallbacks.length; i++) {
          const existing = callbacks.get(channelName) || []
          callbacks.set(channelName, [...existing, existingCallbacks[i]])
        }
      } else {
        log.error('支援工單頻道重新連線失敗', { channelName })
      }
    }
  }

  // 提供手動清理方法供組件使用
  const setupAutoCleanup = () => {
    const instance = getCurrentInstance()
    if (instance) {
      onUnmounted(() => {
        unsubscribeAllSupportTickets()
      })
    }
  }

  return {
    // 訂閱功能
    subscribeToSupportTickets,
    unsubscribeFromSupportTickets,
    unsubscribeAllSupportTickets,
    reconnectFailedSupportTickets,

    // 狀態
    connectedChannels,
    failedConnections,

    // 錯誤追蹤 (來自共用機制)
    errorCount: errorTracker.errorCount,
    lastError: errorTracker.lastError,
    errorHistory: errorTracker.errorHistory,

    // 工具函數
    resetErrorStats: errorTracker.resetErrorStats,
    getConnectionSummary,
    getErrorSummary: errorTracker.getErrorSummary,
    setupAutoCleanup,
  }
}

// 全域支援工單 Realtime 管理實例
let globalSupportTicketsRealtime: ReturnType<
  typeof useSupportTicketsRealtime
> | null = null

/**
 * 獲取全域支援工單 Realtime 實例
 */
export const getGlobalSupportTicketsRealtime = () => {
  if (!globalSupportTicketsRealtime) {
    globalSupportTicketsRealtime = useSupportTicketsRealtime()
  }
  return globalSupportTicketsRealtime
}
