import { convertToISOString } from '@/utils'
/**
 * Messages Realtime 錯誤監控功能
 *
 * 專門處理訊息層級的即時連線監控和錯誤追蹤
 * 監控 messages 表的 Realtime 訂閱狀態
 */

import { ref, onUnmounted, getCurrentInstance } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  useRealtimeErrorTracking,
  RealtimeStatusHandlers,
} from './useRealtimeErrorTracking'
import { createModuleLogger } from '@/utils/logger'
// import type { RealtimeErrorTracker } from './useRealtimeErrorTracking' // 未使用

const log = createModuleLogger('Composable', 'MessagesRealtime')

interface MessageRealtimeEvent {
  conversationId: string
  messageId: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  data: any
  timestamp: number
}

type MessageRealtimeCallback = (event: MessageRealtimeEvent) => void

interface MessageConnectionInfo {
  conversationId: string
  isConnected: boolean
  hasError: boolean
  connectedAt?: string
}

export const useMessagesRealtime = () => {
  // 使用共用錯誤監控機制
  const errorTracker = useRealtimeErrorTracking('conversations')

  // 訂閱管理
  const conversationChannels = new Map<string, any>()
  const callbacks = new Map<string, MessageRealtimeCallback[]>()

  // 狀態追蹤
  const connectedConversations = ref<Map<string, MessageConnectionInfo>>(
    new Map(),
  )
  const failedConnections = ref<Set<string>>(new Set())

  /**
   * 訂閱指定對話的 messages 更新
   */
  const subscribeToConversation = (
    conversationId: string,
    callback: MessageRealtimeCallback,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // 檢查是否已經訂閱
        if (conversationChannels.has(conversationId)) {
          // 添加新的回調函數
          const existingCallbacks = callbacks.get(conversationId) || []
          callbacks.set(conversationId, [...existingCallbacks, callback])
          resolve(true)
          return
        }

        log.debug('訂閱對話的 Messages Realtime 更新', { conversationId })

        // 訂閱 messages 表更新
        const conversationChannel = supabase
          .channel(`conversation-messages-${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              log.debug('對話訊息更新', { conversationId, payload })

              const event: MessageRealtimeEvent = {
                conversationId,
                messageId: (payload.new as any)?.id || (payload.old as any)?.id,
                eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                data: payload.new || payload.old,
                timestamp: Date.now(),
              }

              // 觸發回調函數
              const conversationCallbacks = callbacks.get(conversationId) || []
              conversationCallbacks.forEach((cb) => cb(event))
            },
          )
          .subscribe((status) => {
            log.debug('對話 Messages Realtime 狀態', { conversationId, status })

            RealtimeStatusHandlers.handleSubscriptionStatus(
              status,
              errorTracker,
              () => {
                // 連線成功
                connectedConversations.value.set(conversationId, {
                  conversationId,
                  isConnected: true,
                  hasError: false,
                  connectedAt: convertToISOString(new Date()),
                })
                failedConnections.value.delete(conversationId)
                resolve(true)
              },
              () => {
                // 連線失敗
                connectedConversations.value.set(conversationId, {
                  conversationId,
                  isConnected: false,
                  hasError: true,
                })
                failedConnections.value.add(conversationId)
                resolve(false)
              },
            )
          })

        conversationChannels.set(conversationId, conversationChannel)
        callbacks.set(conversationId, [callback])
      } catch (error) {
        log.error('訂閱對話 Messages Realtime 失敗', { conversationId, error })

        // 使用共用錯誤處理
        RealtimeStatusHandlers.handleSubscriptionError(
          error,
          errorTracker,
          'subscription',
        )

        connectedConversations.value.set(conversationId, {
          conversationId,
          isConnected: false,
          hasError: true,
        })
        failedConnections.value.add(conversationId)

        resolve(false)
      }
    })
  }

  /**
   * 取消訂閱指定對話的更新
   */
  const unsubscribeFromConversation = (conversationId: string) => {
    const channel = conversationChannels.get(conversationId)
    if (channel) {
      channel.unsubscribe()
      conversationChannels.delete(conversationId)
      callbacks.delete(conversationId)
      connectedConversations.value.delete(conversationId)
      failedConnections.value.delete(conversationId)

      log.debug('取消訂閱對話的 Messages Realtime 更新', { conversationId })
    }
  }

  /**
   * 取消所有對話訂閱
   */
  const unsubscribeAllConversations = () => {
    conversationChannels.forEach((channel, conversationId) => {
      channel.unsubscribe()
      log.debug('取消訂閱對話的 Messages Realtime 更新', { conversationId })
    })

    conversationChannels.clear()
    callbacks.clear()
    connectedConversations.value.clear()
    failedConnections.value.clear()

    log.debug('已取消所有對話 Messages Realtime 訂閱')
  }

  /**
   * 獲取連線狀態摘要
   */
  const getConnectionSummary = () => {
    const connectedCount = Array.from(
      connectedConversations.value.values(),
    ).filter((info) => info.isConnected).length

    const errorSummary = errorTracker.getErrorSummary()

    return {
      totalSubscriptions: conversationChannels.size,
      connectedCount,
      failedCount: failedConnections.value.size,
      errorCount: errorSummary.errorCount,
      lastError: errorSummary.lastError,
      errorHistory: errorSummary.errorHistory,
      isHealthy: failedConnections.value.size === 0 && errorSummary.isHealthy,
      connections: Array.from(connectedConversations.value.values()),
    }
  }

  /**
   * 重新連線失敗的對話
   */
  const reconnectFailedConversations = async () => {
    log.debug('重新連線失敗的對話')

    const failedIds = Array.from(failedConnections.value)
    if (failedIds.length === 0) {
      log.debug('沒有失敗的對話連線需要重連')
      return
    }

    // 重置錯誤統計
    errorTracker.resetErrorStats()

    // 嘗試重新連線每個失敗的對話
    for (const conversationId of failedIds) {
      const existingCallbacks = callbacks.get(conversationId) || []
      if (existingCallbacks.length > 0) {
        log.debug('重新連線對話', { conversationId })

        // 先取消訂閱
        unsubscribeFromConversation(conversationId)

        // 等待一秒後重新訂閱
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // 重新訂閱 (使用第一個回調函數)
        const success = await subscribeToConversation(
          conversationId,
          existingCallbacks[0],
        )

        if (success) {
          log.info('對話重新連線成功', { conversationId })
          // 重新添加其他回調函數
          for (let i = 1; i < existingCallbacks.length; i++) {
            const existing = callbacks.get(conversationId) || []
            callbacks.set(conversationId, [...existing, existingCallbacks[i]])
          }
        } else {
          log.error('對話重新連線失敗', { conversationId })
        }
      }
    }
  }

  // 提供手動清理方法供組件使用
  const setupAutoCleanup = () => {
    const instance = getCurrentInstance()
    if (instance) {
      onUnmounted(() => {
        unsubscribeAllConversations()
      })
    }
  }

  return {
    // 訂閱功能
    subscribeToConversation,
    unsubscribeFromConversation,
    unsubscribeAllConversations,
    reconnectFailedConversations,

    // 狀態
    connectedConversations,
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

// 全域訊息 Realtime 管理實例
let globalMessagesRealtime: ReturnType<typeof useMessagesRealtime> | null = null

/**
 * 獲取全域訊息 Realtime 實例
 */
export const getGlobalMessagesRealtime = () => {
  if (!globalMessagesRealtime) {
    globalMessagesRealtime = useMessagesRealtime()
  }
  return globalMessagesRealtime
}
