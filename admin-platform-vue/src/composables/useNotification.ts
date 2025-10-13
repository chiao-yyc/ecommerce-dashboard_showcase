import { ref, computed, onUnmounted, watch, unref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import {
  getNotificationService,
  getNotificationApiService,
  getNotificationPreferenceApiService,
} from '@/api/services'
import { GroupNotificationApiService } from '@/api/services/GroupNotificationApiService'
import type {
  Notification,
  NotificationStats,
  NotificationPreference,
  NotificationFilter,
  NotificationType,
  BulkNotificationAction,
} from '@/types'
import { RelatedEntityType, NotificationPriority } from '@/types'
import { supabase } from '@/lib/supabase'
// import { formatLocaleString } from '@/utils' // 未使用
import {
  useRealtimeErrorTracking,
  RealtimeStatusHandlers,
} from './useRealtimeErrorTracking'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'Notification')

/**
 * 通知系統 Composable
 */
export function useNotification(userId?: ComputedRef<string> | Ref<string>) {
  // 狀態管理
  const notifications = ref<Notification[]>([])
  const stats = ref<NotificationStats | null>(null)
  const suggestionStats = ref<any>(null)
  const preferences = ref<NotificationPreference[]>([])
  const loading = ref(false)
  const error = ref('')

  // 服務實例
  const notificationService = getNotificationService()
  const notificationApi = getNotificationApiService()
  const preferenceApi = getNotificationPreferenceApiService()
  const groupNotificationApi = new GroupNotificationApiService(supabase)

  // 計算屬性
  const unreadCount = computed(() => stats.value?.unreadCount || 0)
  const hasUnread = computed(() => unreadCount.value > 0)
  const actionableCount = computed(() => actionableNotifications.value.length)
  const suggestionsCount = computed(() => suggestedNotifications.value.length)
  const hasSuggestions = computed(() => suggestionsCount.value > 0)

  const unreadNotifications = computed(() =>
    notifications.value.filter((n) => n.status === 'unread'),
  )

  const readNotifications = computed(() =>
    notifications.value.filter((n) => n.status === 'read'),
  )

  const urgentNotifications = computed(() =>
    notifications.value.filter((n) => n.priority === 'urgent'),
  )

  const actionableNotifications = computed(() =>
    notifications.value.filter((n) => n.category === 'actionable'),
  )

  const informationalNotifications = computed(() =>
    notifications.value.filter((n) => n.category === 'informational'),
  )

  // 智能建議通知 (從統一數據源篩選)
  const suggestedNotifications = computed(() =>
    notifications.value.filter(
      (n) =>
        n.completionStrategy === 'suggested' || n.suggestedComplete === true,
    ),
  )

  const personalNotifications = computed(() =>
    notifications.value.filter((n) => n.isPersonal === true),
  )

  const groupNotificationsList = computed(() =>
    notifications.value.filter((n) => !n.isPersonal),
  )

  // 群組通知分發記錄狀態
  const groupNotifications = ref<any[]>([])
  const groupNotificationsLoading = ref(false)
  const selectedDistributionRecipients = ref<any[]>([])
  const recipientsLoading = ref(false)

  /**
   * 載入通知列表
   */
  const loadNotifications = async (
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20,
  ) => {
    try {
      loading.value = true
      error.value = ''

      const currentUserId = unref(userId)

      // 檢查 userId 是否有效
      if (
        !currentUserId ||
        currentUserId === 'undefined' ||
        currentUserId === '' ||
        currentUserId === null
      ) {
        // Invalid userId
        return { success: false, error: '無效的使用者ID' }
      }

      // Notification loading - logs removed for AI debugging

      const response = await notificationApi.getUserNotifications(
        currentUserId,
        filter,
        page,
        limit,
      )

      // API Response logged

      if (response.success) {
        notifications.value = response.data || []
        // Notifications loaded and data updated
        return response
      } else {
        error.value =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '載入通知失敗'
        log.error('❌ Load notifications failed:', error.value)
        return response
      }
    } catch (err) {
      error.value = '載入通知時發生錯誤'
      log.error('🚨 Load notifications error:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 載入通知統計
   */
  const loadStats = async () => {
    try {
      const currentUserId = unref(userId)

      // 檢查 userId 是否有效
      if (
        !currentUserId ||
        currentUserId === 'undefined' ||
        currentUserId === '' ||
        currentUserId === null
      ) {
        log.warn('🔄 loadStats - Invalid userId:', currentUserId)
        return { success: false, error: '無效的使用者ID' }
      }

      const response = await notificationApi.getNotificationStats(currentUserId)

      if (response.success) {
        stats.value = response.data!
      } else {
        log.error('Failed to load stats:', response.error)
      }

      return response
    } catch (err) {
      log.error('🚨 Load notification stats error:', err)
      return { success: false, error: '載入統計失敗' }
    }
  }

  /**
   * 載入建議通知 (已廢棄 - 現在從統一通知中自動篩選)
   * @deprecated 智能建議現在從 notifications 中自動篩選，無需額外載入
   */
  const loadSuggestedNotifications = async (
    _page: number = 1,
    _limit: number = 20,
  ) => {
    log.warn(
      '⚠️ loadSuggestedNotifications is deprecated. Suggestions are now filtered from main notifications.',
    )

    // 建議通知現在直接從主要通知列表中篩選
    // 回傳假的成功回應以保持向後兼容
    return {
      success: true,
      data: suggestedNotifications.value,
      message: 'Suggestions loaded from unified notifications',
    }
  }

  /**
   * 載入建議統計
   */
  const loadSuggestionStats = async () => {
    try {
      const currentUserId = unref(userId)
      if (!currentUserId) return
      const response = await notificationApi.getSuggestionStats(currentUserId)

      if (response.success) {
        suggestionStats.value = response.data!
      }

      return response
    } catch (err) {
      log.error('Load suggestion stats error:', err)
      return { success: false, error: '載入建議統計失敗' }
    }
  }

  /**
   * 載入群組通知分發記錄
   */
  const loadGroupNotifications = async () => {
    try {
      groupNotificationsLoading.value = true
      const currentUserId = unref(userId)

      if (!currentUserId) {
        // Invalid userId
        return { success: false, error: '無效的使用者ID' }
      }

      // 使用真實的群組通知 API 獲取分發統計
      const response = await groupNotificationApi.getDistributionStats(20)

      if (response.success) {
        // 轉換數據結構以匹配 GroupNotificationCard 組件的期望格式
        const transformedData = (response.data || []).map((stat) => ({
          id: stat.distributionId,
          distributionId: stat.distributionId,
          targetType: stat.targetType,
          targetCriteria: stat.targetCriteria,
          sentAt: stat.sentAt,
          title: stat.title, // 從資料庫視圖取得真實標題
          message: stat.message, // 從資料庫視圖取得真實內容
          category: stat.category, // 從資料庫視圖取得分類
          completionStrategy: stat.completionStrategy, // 從資料庫視圖取得完成策略
          stats: {
            totalRecipients: stat.totalRecipients,
            deliveredCount: stat.deliveredCount,
            failedCount: stat.failedCount,
            deliveryRate: stat.deliveryRate,
            notificationType: stat.notificationType, // 從資料庫視圖取得真實通知類型
            priority: stat.priority, // 從資料庫視圖取得真實優先級
          },
          recipients: [], // 可以稍後從其他 API 獲取詳細接收者資訊
        }))

        groupNotifications.value = transformedData
        return { success: true, data: groupNotifications.value }
      } else {
        // 如果資料庫表不存在，返回空數據而不是錯誤
        const errorMessage =
          typeof response.error === 'string' ? response.error : ''
        if (
          errorMessage.includes('relation') ||
          errorMessage.includes('does not exist')
        ) {
          // Group notifications table does not exist
          groupNotifications.value = []
          return { success: true, data: [] }
        }

        return { success: false, error: response.error }
      }
    } catch (err) {
      log.error('🚨 Load group notifications error:', err)
      return { success: false, error: '載入群組通知失敗' }
    } finally {
      groupNotificationsLoading.value = false
    }
  }

  /**
   * 載入特定分發的接收者列表
   */
  const loadRecipients = async (distributionId: string) => {
    try {
      recipientsLoading.value = true
      const response =
        await groupNotificationApi.getDistributionRecipients(distributionId)
      if (response.success) {
        selectedDistributionRecipients.value = response.data || []
      } else {
        // Handle error
        log.error('Failed to load recipients:', response.error)
        selectedDistributionRecipients.value = []
      }
    } catch (err) {
      log.error('Error loading recipients:', err)
    } finally {
      recipientsLoading.value = false
    }
  }

  /**
   * 載入活躍通知 (使用優化檢視)
   */
  const loadActiveNotifications = async (
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20,
  ) => {
    try {
      loading.value = true
      error.value = ''

      const currentUserId = unref(userId)
      if (!currentUserId) {
        error.value = '無效的使用者ID'
        return { success: false, error: error.value }
      }

      const response = await notificationApi.getUserActiveNotifications(
        currentUserId,
        filter,
        page,
        limit,
      )

      if (response.success) {
        notifications.value = response.data || []
        return response
      } else {
        error.value =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '載入活躍通知失敗'
        return response
      }
    } catch (err) {
      error.value = '載入活躍通知時發生錯誤'
      log.error('Load active notifications error:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索通知
   */
  const searchNotifications = async (
    searchTerm: string,
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20,
  ) => {
    try {
      loading.value = true
      error.value = ''

      const currentUserId = unref(userId)
      if (!currentUserId) {
        error.value = '無效的使用者ID'
        return { success: false, error: error.value }
      }

      const response = await notificationApi.searchNotifications(
        currentUserId,
        searchTerm,
        filter,
        page,
        limit,
      )

      if (response.success) {
        notifications.value = response.data || []
        return response
      } else {
        error.value =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '搜索通知失敗'
        return response
      }
    } catch (err) {
      error.value = '搜索通知時發生錯誤'
      log.error('Search notifications error:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 載入通知偏好設定
   */
  const loadPreferences = async () => {
    try {
      const currentUserId = unref(userId)
      // Loading preferences

      if (!currentUserId) {
        // Invalid userId
        return { success: false, error: '無效的使用者ID' }
      }

      const response = await preferenceApi.getUserPreferences(currentUserId)

      if (response.success) {
        preferences.value = response.data || []
      } else {
        log.error('API failed:', response.error)
      }

      return response
    } catch (err) {
      log.error('Load notification preferences error:', err)
      return { success: false, error: '載入偏好設定失敗' }
    }
  }

  /**
   * 創建新通知
   */
  const createNotification = async (
    type: NotificationType,
    templateData: Record<string, any> = {},
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      channels?: any[]
      relatedEntityType?: RelatedEntityType
      relatedEntityId?: string
      actionUrl?: string
      expiresAt?: string
    } = {},
  ) => {
    try {
      // 注意：約束關係驗證現在由後端API和資料庫控制
      const currentUserId = unref(userId)
      if (!currentUserId) {
        return { success: false, error: '無效的使用者ID' }
      }

      const response = await notificationService.createAndSendNotification(
        currentUserId,
        type,
        templateData,
        options,
      )

      if (response.success) {
        // 重新載入通知列表和統計
        await loadNotifications()
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Create notification error:', err)
      return { success: false, error: '創建通知失敗' }
    }
  }

  /**
   * 標記通知為已讀
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await notificationApi.markAsRead(notificationId)

      if (response.success) {
        // 更新本地狀態
        const index = notifications.value.findIndex(
          (n) => n.id === notificationId,
        )
        if (index !== -1) {
          notifications.value[index] = response.data!
        }

        // 更新統計
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Mark as read error:', err)
      return { success: false, error: '標記已讀失敗' }
    }
  }

  /**
   * 標記通知為未讀
   */
  const markAsUnread = async (notificationId: string) => {
    try {
      const response = await notificationApi.markAsUnread(notificationId)

      if (response.success) {
        // 更新本地狀態
        const index = notifications.value.findIndex(
          (n) => n.id === notificationId,
        )
        if (index !== -1) {
          notifications.value[index] = response.data!
        }

        // 更新統計
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Mark as unread error:', err)
      return { success: false, error: '標記未讀失敗' }
    }
  }

  /**
   * 歸檔通知
   */
  const archiveNotification = async (notificationId: string) => {
    try {
      const response = await notificationApi.archiveNotification(notificationId)

      if (response.success) {
        // 從列表中移除
        notifications.value = notifications.value.filter(
          (n) => n.id !== notificationId,
        )

        // 更新統計
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Archive notification error:', err)
      return { success: false, error: '歸檔失敗' }
    }
  }

  /**
   * 批量操作通知
   */
  const bulkUpdateNotifications = async (action: BulkNotificationAction) => {
    try {
      const response = await notificationApi.bulkUpdateNotifications(action)

      if (response.success) {
        // 重新載入通知列表和統計
        await loadNotifications()
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Bulk update notifications error:', err)
      return { success: false, error: '批量操作失敗' }
    }
  }

  /**
   * 標記所有通知為已讀
   */
  const markAllAsRead = async () => {
    try {
      const currentUserId = unref(userId)
      if (!currentUserId) {
        return { success: false, error: '無效的使用者ID' }
      }

      const response = await notificationApi.markAllAsRead(currentUserId)

      if (response.success) {
        // 重新載入通知列表和統計
        await loadNotifications()
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Mark all as read error:', err)
      return { success: false, error: '標記所有已讀失敗' }
    }
  }

  /**
   * 標記任務型通知為已完成
   */
  const markAsCompleted = async (notificationId: string) => {
    try {
      const response = await notificationApi.markAsCompleted(notificationId)

      if (response.success) {
        // 更新本地狀態
        const index = notifications.value.findIndex(
          (n) => n.id === notificationId,
        )
        if (index !== -1) {
          notifications.value[index] = response.data!
        }

        // 更新統計
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Mark as completed error:', err)
      return { success: false, error: '標記已完成失敗' }
    }
  }

  /**
   * 標記資訊型通知為已知悉
   */
  const markAsDismissed = async (notificationId: string) => {
    try {
      const response = await notificationApi.markAsDismissed(notificationId)

      if (response.success) {
        // 更新本地狀態
        const index = notifications.value.findIndex(
          (n) => n.id === notificationId,
        )
        if (index !== -1) {
          notifications.value[index] = response.data!
        }

        // 更新統計
        await loadStats()
      }

      return response
    } catch (err) {
      log.error('Mark as dismissed error:', err)
      return { success: false, error: '標記已知悉失敗' }
    }
  }

  /**
   * 接受完成建議
   */
  const acceptCompletionSuggestion = async (notificationId: string) => {
    try {
      const response =
        await notificationApi.acceptCompletionSuggestion(notificationId)

      if (response.success) {
        // 更新本地狀態
        const index = notifications.value.findIndex(
          (n) => n.id === notificationId,
        )
        if (index !== -1) {
          notifications.value[index] = response.data!
        }

        // 建議通知現在從主要通知中自動篩選，無需手動移除

        // 更新統計
        await loadStats()
        await loadSuggestionStats()
      }

      return response
    } catch (err) {
      log.error('Accept completion suggestion error:', err)
      return { success: false, error: '接受建議失敗' }
    }
  }

  /**
   * 拒絕完成建議
   */
  const dismissCompletionSuggestion = async (notificationId: string) => {
    try {
      const response =
        await notificationApi.dismissCompletionSuggestion(notificationId)

      if (response.success) {
        // 更新本地狀態
        const index = notifications.value.findIndex(
          (n) => n.id === notificationId,
        )
        if (index !== -1) {
          notifications.value[index] = response.data!
        }

        // 建議通知現在從主要通知中自動篩選，無需手動移除

        // 更新統計
        await loadSuggestionStats()
      }

      return response
    } catch (err) {
      log.error('Dismiss completion suggestion error:', err)
      return { success: false, error: '拒絕建議失敗' }
    }
  }

  /**
   * 批量接受所有建議
   */
  const acceptAllSuggestions = async () => {
    try {
      const currentUserId = unref(userId)
      if (!currentUserId) {
        return { success: false, error: '無效的使用者ID' }
      }

      const response = await notificationApi.acceptAllSuggestions(currentUserId)

      if (response.success) {
        // 建議通知現在從主要通知中自動篩選，重新載入通知列表即可
        await loadNotifications()
        await loadStats()
        await loadSuggestionStats()
      }

      return response
    } catch (err) {
      log.error('Accept all suggestions error:', err)
      return { success: false, error: '批量接受建議失敗' }
    }
  }

  /**
   * 更新通知偏好設定
   */
  const updatePreference = async (
    notificationType: NotificationType,
    preference: Partial<NotificationPreference>,
  ) => {
    try {
      // Updating preference
      const currentUserId = unref(userId)
      if (!currentUserId) {
        return { success: false, error: '無效的使用者ID' }
      }

      const response = await preferenceApi.updateUserPreference(
        currentUserId,
        notificationType,
        preference,
      )

      // API response received

      if (response.success) {
        // 更新本地狀態
        const index = preferences.value.findIndex(
          (p) => p.notificationType === notificationType,
        )
        if (index !== -1) {
          preferences.value[index] = response.data!
        } else {
          preferences.value.push(response.data!)
        }
      }

      return response
    } catch (err) {
      log.error('Update preference error:', err)
      return { success: false, error: '更新偏好設定失敗' }
    }
  }

  /**
   * 群組通知相關方法
   */
  const groupNotificationsMethods = {
    /**
     * 發送角色通知
     */
    async notifyRole(
      roleName: string,
      type: string,
      title: string,
      message: string,
      priority: NotificationPriority = NotificationPriority.MEDIUM,
      actionUrl?: string,
    ) {
      try {
        const response = await groupNotificationApi.notifyRole({
          roleName,
          type,
          title,
          message,
          priority,
          actionUrl,
        })
        if (response.success) {
          await loadNotifications()
        }
        return response
      } catch (error) {
        log.error('Failed to notify role:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
    /**
     * 發送廣播通知
     */
    async notifyBroadcast(
      type: string,
      title: string,
      message: string,
      priority: NotificationPriority = NotificationPriority.MEDIUM,
      actionUrl?: string,
    ) {
      try {
        const response = await groupNotificationApi.notifyBroadcast({
          type,
          title,
          message,
          priority,
          actionUrl,
        })
        if (response.success) {
          await loadNotifications()
        }
        return response
      } catch (error) {
        log.error('Failed to notify broadcast:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
    /**
     * 發送自定義群組通知
     */
    async notifyCustom(
      userIds: string[],
      type: string,
      title: string,
      message: string,
      priority: NotificationPriority = NotificationPriority.MEDIUM,
      actionUrl?: string,
    ) {
      try {
        const response = await groupNotificationApi.notifyCustomGroup(
          userIds,
          type,
          title,
          message,
          priority,
          actionUrl,
        )
        if (response.success) {
          await loadNotifications()
        }
        return response
      } catch (error) {
        log.error('Failed to notify custom group:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  }

  /**
   * Realtime 訂閱功能
   */
  let channel: any = null
  let suggestionChannel: any = null
  const isRealtimeConnected = ref(false)

  // 使用共用錯誤監控機制
  const errorTracker = useRealtimeErrorTracking('notifications')

  // 保持向後兼容的響應式引用
  const realtimeError = ref<string | null>(null)
  const realtimeErrorCount = errorTracker.errorCount
  const realtimeLastError = errorTracker.lastError
  const realtimeErrorHistory = errorTracker.errorHistory

  /**
   * 重置 Realtime 錯誤統計 (連線成功時調用)
   */
  const resetRealtimeErrorStats = errorTracker.resetErrorStats

  /**
   * 獲取連線狀態摘要 (統一架構接口)
   */
  const getConnectionSummary = () => {
    const errorSummary = errorTracker.getErrorSummary()

    // 計算訂閱狀態
    const mainChannelActive = channel !== null
    const suggestionChannelActive = suggestionChannel !== null
    const totalSubscriptions =
      (mainChannelActive ? 1 : 0) + (suggestionChannelActive ? 1 : 0)

    // 連線狀態統計
    let connectedCount = 0
    if (mainChannelActive && isRealtimeConnected.value) connectedCount++
    if (suggestionChannelActive) {
      // 假設建議通知頻道狀態良好（沒有獨立狀態追蹤）
      // 基於錯誤狀態推斷：如果有最近錯誤且主頻道正常，可能是建議頻道問題
      const hasSuggestionIssues =
        errorSummary.hasRecentErrors && isRealtimeConnected.value
      if (!hasSuggestionIssues) connectedCount++
    }

    const failedCount = totalSubscriptions - connectedCount

    return {
      totalSubscriptions,
      connectedCount,
      failedCount,
      errorCount: errorSummary.errorCount,
      lastError: errorSummary.lastError,
      errorHistory: errorSummary.errorHistory,
      isHealthy:
        connectedCount === totalSubscriptions && errorSummary.isHealthy,
      // 額外的通知系統特定狀態
      mainChannelConnected: mainChannelActive && isRealtimeConnected.value,
      suggestionChannelActive: suggestionChannelActive,
      hasActivePolling: false, // 如果有輪詢機制可以在此追蹤
    }
  }

  const subscribeToNotifications = () => {
    if (!userId?.value) return

    // 主通知訂閱
    channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        async (payload: any) => {
          await handleNotificationChange(payload)
        },
      )
      .subscribe((status: string) => {
        // Channel status updated
        isRealtimeConnected.value = status === 'SUBSCRIBED'

        // 使用共用錯誤處理機制
        RealtimeStatusHandlers.handleSubscriptionStatus(
          status,
          errorTracker,
          () => {
            // 連線成功回調
            isRealtimeConnected.value = true
            realtimeError.value = null
          },
          () => {
            // 連線失敗回調
            isRealtimeConnected.value = false
            realtimeError.value = errorTracker.lastError.value
          },
        )
      })

    // 建議通知現在從主要通知中自動篩選，無需額外訂閱
    // 註：智能建議狀態變更會透過主要 notifications 表的變更事件觸發
  }

  const unsubscribeFromNotifications = () => {
    if (channel) {
      channel.unsubscribe()
      channel = null
    }
    if (suggestionChannel) {
      suggestionChannel.unsubscribe()
      suggestionChannel = null
    }
    isRealtimeConnected.value = false
    realtimeError.value = null
  }

  /**
   * 資料庫通知映射到前端通知
   */
  const mapDbNotificationToNotification = (
    dbNotification: any,
  ): Notification => {
    return {
      id: dbNotification.id,
      userId: dbNotification.user_id,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      priority: dbNotification.priority,
      status: dbNotification.status,
      channels: dbNotification.channels || [],
      relatedEntityType: dbNotification.related_entity_type,
      relatedEntityId: dbNotification.related_entity_id,
      metadata: dbNotification.metadata,
      createdAt: dbNotification.created_at,
      updatedAt: dbNotification.updated_at,
      readAt: dbNotification.read_at,
      expiresAt: dbNotification.expires_at,
      actionUrl: dbNotification.action_url,
      // 新增遺漏的字段
      category: dbNotification.category,
      completionStrategy: dbNotification.completion_strategy,
      suggestedComplete: dbNotification.suggested_complete || false,
      suggestedAt: dbNotification.suggested_at,
      suggestionReason: dbNotification.suggestion_reason,
      autoCompletedAt: dbNotification.auto_completed_at,
      isPersonal: dbNotification.is_personal !== false, // 默認為個人通知
      distributionId: dbNotification.distribution_id,
      targetType: dbNotification.target_type,
    }
  }

  // 移除：資料庫建議通知映射函數已不需要，統一使用 mapDbNotificationToNotification

  /**
   * 處理通知變更事件
   */
  const handleNotificationChange = async (payload: any) => {
    // Realtime notification change

    if (payload.eventType === 'INSERT') {
      // 新增通知 - 添加到列表頂部
      const newNotification = mapDbNotificationToNotification(payload.new)
      notifications.value.unshift(newNotification)
      // New notification added

      // 批次更新統計（避免頻繁調用）
      await loadStats()
    } else if (payload.eventType === 'UPDATE') {
      // 更新通知 - 找到並更新
      const idx = notifications.value.findIndex((n) => n.id === payload.new.id)
      if (idx !== -1) {
        notifications.value[idx] = mapDbNotificationToNotification(payload.new)
        // Notification updated
      }

      // 批次更新統計
      await loadStats()
    } else if (payload.eventType === 'DELETE') {
      // 刪除通知 - 從列表移除
      notifications.value = notifications.value.filter(
        (n) => n.id !== payload.old.id,
      )
      // Notification deleted

      // 批次更新統計
      await loadStats()
    }
  }

  /**
   * 處理建議通知變更事件 (已廢棄 - 現在透過主要通知事件處理)
   * @deprecated 智能建議變更現在透過主要通知表的變更事件處理
   */
  // const handleSuggestedNotificationChange = async (_payload: any) => { // 未使用
  /* const __unused_handleSuggestedNotificationChange = async (_payload: any) => {
    log.warn(
      '⚠️ handleSuggestedNotificationChange is deprecated. Changes handled via main notification events.',
    )
    // 建議通知變更現在透過 handleNotificationChange 統一處理
  } */

  /**
   * 快速創建常用通知的方法
   */
  const quickNotifications = {
    // 新訂單通知
    orderNew: (orderData: {
      order_number: string
      total_amount: number
      orderId: string
    }) =>
      createNotification('order_new' as NotificationType, orderData, {
        priority: 'high',
        relatedEntityType: RelatedEntityType.ORDER,
        relatedEntityId: orderData.orderId,
        actionUrl: `/orders/${orderData.orderId}`,
      }),

    // 低庫存通知
    lowStock: (productData: {
      product_name: string
      current_stock: number
      productId: string
    }) =>
      createNotification(
        'inventory_low_stock' as NotificationType,
        productData,
        {
          priority: 'high',
          relatedEntityType: RelatedEntityType.PRODUCT,
          relatedEntityId: productData.productId,
          actionUrl: `/products/${productData.productId}`,
        },
      ),

    // 客服請求通知
    customerService: (customerData: {
      customer_name: string
      customer_id: string
      conversationId: string
    }) =>
      createNotification(
        'customer_service_new_request' as NotificationType,
        customerData,
        {
          priority: 'medium',
          relatedEntityType: RelatedEntityType.CONVERSATION,
          relatedEntityId: customerData.conversationId,
          actionUrl: `/support/conversations/${customerData.conversationId}`,
        },
      ),

    // 權限變更通知
    permissionChange: (changeData: {
      change_description: string
      changed_by: string
    }) =>
      createNotification(
        'security_permission_changed' as NotificationType,
        changeData,
        {
          priority: 'high',
          relatedEntityType: RelatedEntityType.USER,
          relatedEntityId: unref(userId) || '',
          actionUrl: '/settings/permissions',
        },
      ),
  }

  // 監聽 userId 變化
  if (userId) {
    watch(
      userId,
      async (newUserId, oldUserId) => {
        // 檢查 userId 是否有效
        if (
          !newUserId ||
          newUserId === 'undefined' ||
          newUserId === '' ||
          newUserId === null
        ) {
          // userId invalid, clearing data
          // 無效 userId，清空狀態
          notifications.value = []
          // suggestedNotifications 是計算屬性，會自動更新
          stats.value = null
          suggestionStats.value = null
          preferences.value = []
          return
        }

        // 只有在 userId 真正改變時才載入資料
        if (newUserId && newUserId !== oldUserId) {
          // userId changed

          try {
            // 重新訂閱 realtime
            unsubscribeFromNotifications()
            subscribeToNotifications()

            // 有效的新 userId，載入資料（只載入一次）
            // Loading initial data
            await Promise.all([
              loadNotifications(),
              loadStats(),
              loadPreferences(),
              loadSuggestionStats(),
              loadGroupNotifications(),
            ])
            // Initial data loaded
          } catch (err) {
            log.error('Error loading data for userId:', newUserId, err)
            error.value = '載入通知資料時發生錯誤'
          }
        }
      },
      { immediate: true },
    )
  }

  // 清理
  onUnmounted(() => {
    unsubscribeFromNotifications()
  })

  return {
    // 狀態
    notifications,
    suggestedNotifications,
    groupNotificationsData: groupNotifications,
    stats,
    suggestionStats,
    preferences,
    loading,
    error,
    selectedDistributionRecipients,
    recipientsLoading,

    // 計算屬性
    unreadCount,
    hasUnread,
    actionableCount,
    suggestionsCount,
    hasSuggestions,
    unreadNotifications,
    readNotifications,
    urgentNotifications,
    actionableNotifications,
    informationalNotifications,
    personalNotifications,
    groupNotificationsList,

    // 基本方法
    loadNotifications,
    loadActiveNotifications,
    loadGroupNotifications,
    loadRecipients,
    loadStats,
    loadSuggestionStats,
    loadPreferences,
    searchNotifications,
    createNotification,
    markAsRead,
    markAsUnread,
    archiveNotification,
    bulkUpdateNotifications,
    markAllAsRead,
    updatePreference,

    // 智能建議方法
    markAsCompleted,
    markAsDismissed,
    acceptCompletionSuggestion,
    dismissCompletionSuggestion,
    acceptAllSuggestions,

    // 群組通知方法
    groupNotifications: groupNotificationsMethods,

    // Realtime 訂閱
    subscribeToNotifications,
    unsubscribeFromNotifications,
    isRealtimeConnected,
    realtimeError,

    // Realtime 錯誤統計
    realtimeErrorCount,
    realtimeLastError,
    realtimeErrorHistory,
    resetRealtimeErrorStats,
    getConnectionSummary,

    // 快速通知
    quickNotifications,

    // 別名和兼容性方法
    suggestions: suggestedNotifications,
    fetchNotifications: loadNotifications,
    fetchSuggestions: () => {
      log.warn(
        '⚠️ fetchSuggestions is deprecated. Suggestions are now available via suggestions computed property.',
      )
      return loadSuggestedNotifications()
    },
    fetchStats: loadStats,
    fetchGroupNotifications: loadGroupNotifications,
    acceptSuggestion: acceptCompletionSuggestion,
    dismissSuggestion: dismissCompletionSuggestion,
    deleteNotification: archiveNotification,
    getNotificationsByFilter: searchNotifications,
  }
}
