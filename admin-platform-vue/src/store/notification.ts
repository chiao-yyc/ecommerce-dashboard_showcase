import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useAuthStore } from '@/store/auth'

export const useNotificationStore = defineStore('notification', () => {
  const authStore = useAuthStore()

  // 傳遞 computed userId 給 composable
  const userId = computed(() => authStore.user?.id || '')

  // 直接使用 useNotification composable，讓它處理響應式
  const {
    notifications,
    stats,
    preferences,
    loading,
    error,
    unreadCount,
    hasUnread,
    unreadNotifications,
    readNotifications,
    urgentNotifications,
    loadNotifications,
    loadStats,
    loadPreferences,
    createNotification,
    markAsRead,
    markAsUnread,
    archiveNotification,
    bulkUpdateNotifications,
    markAllAsRead,
    updatePreference,
    quickNotifications,
  } = useNotification(userId)

  // 用戶資訊
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  return {
    // 狀態
    notifications,
    stats,
    preferences,
    loading,
    error,

    // 計算屬性
    unreadCount,
    hasUnread,
    unreadNotifications,
    readNotifications,
    urgentNotifications,

    // 方法
    loadNotifications,
    loadStats,
    loadPreferences,
    createNotification,
    markAsRead,
    markAsUnread,
    archiveNotification,
    bulkUpdateNotifications,
    markAllAsRead,
    updatePreference,

    // 快速通知
    quickNotifications,

    // 用戶資訊
    userId,
    isAuthenticated,
  }
})
