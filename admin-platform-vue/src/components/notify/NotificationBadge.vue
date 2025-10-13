<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Notify/NotificationBadge')

import { computed, ref, onMounted, onUnmounted, watch, inject } from 'vue'
import { useRouter } from 'vue-router'
import {
  Bell,
  RefreshCw,
  CheckCircle,
  // ExternalLink,
  Lightbulb,
  AlertTriangle,
  ChevronRight,
  Wifi,
  WifiOff,
  Link2,
} from 'lucide-vue-next'
import {
  getNotificationIcon,
  getPriorityIconClass,
  getPriorityBadgeClass,
  priorityText,
  // categoryClasses,
  categoryText,
} from './notifyConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotification } from '@/composables/useNotification'
import { formatRelativeTime } from '@/utils'
import type { Notification, NotificationPriority } from '@/types'
import type { ToastType } from '@/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  // DropdownMenuItem,
  // DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  userId?: string
  maxDisplayCount?: number
  refreshInterval?: number
  autoRefresh?: boolean
  position?: 'top-right' | 'top-left'
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplayCount: 10,
  refreshInterval: 30000,
  autoRefresh: true,
  position: 'top-right',
})

const emit = defineEmits<{
  notificationClick: [notification: Notification]
  refresh: []
  markAllAsRead: []
  viewAll: []
}>()

const router = useRouter()
// Toast 系統
const toast = inject<ToastType>('toast', {
  success: (msg: string) => log.debug('Success:', msg),
  error: (msg: string) => log.error('Error:', msg),
  warning: (msg: string) => log.warn('Warning:', msg),
  info: (msg: string) => log.info('Info:', msg),
})

// 使用 notification composable
const userIdRef = computed(() => props.userId || '')
const {
  notifications,
  suggestions,
  stats,
  loading,
  error,
  fetchNotifications,
  fetchStats,
  markAsRead,
  markAllAsRead: markAllNotificationsAsRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isRealtimeConnected,
  realtimeError,
} = useNotification(props.userId ? userIdRef : undefined)

// 響應式狀態
const isOpen = ref(false)
const autoRefreshTimer = ref<number | null>(null)

// 計算屬性
const hasUnread = computed(() => (stats.value?.unreadCount || 0) > 0)
const hasSuggestions = computed(() => (suggestions.value?.length || 0) > 0)
const totalCount = computed(() => notifications.value?.length || 0)

// 安全的通知圖標獲取
const getNotificationIconSafe = (type: string) => {
  try {
    return getNotificationIcon(type as any)
  } catch (_err) {
    return Bell // fallback
  }
}

// const displayCount = computed(() => {
//   const count = stats.value?.unreadCount || 0
//   return count > 99 ? '99+' : count.toString()
// })

const groupedNotifications = computed(() => {
  const notificationsWithFlag = (notifications.value || []).map((n) => ({
    ...n,
    isSuggestion: n.completionStrategy === 'suggested' || n.suggestedComplete === true,
  }))

  let filtered = notificationsWithFlag

  // 全部通知，優先顯示未讀
  filtered = filtered.sort((a, b) => {
    if (a.status === 'unread' && b.status !== 'unread') return -1
    if (a.status !== 'unread' && b.status === 'unread') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const groups: {
    today: (Notification & { isSuggestion: boolean })[]
    yesterday: (Notification & { isSuggestion: boolean })[]
    last7Days: (Notification & { isSuggestion: boolean })[]
    last14Days: (Notification & { isSuggestion: boolean })[]
  } = {
    today: [],
    yesterday: [],
    last7Days: [],
    last14Days: [],
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const last7DaysCutoff = new Date(today)
  last7DaysCutoff.setDate(last7DaysCutoff.getDate() - 7)
  const last14DaysCutoff = new Date(today)
  last14DaysCutoff.setDate(last14DaysCutoff.getDate() - 14)

  for (const notification of filtered) {
    const notificationDate = new Date(notification.createdAt)
    if (notificationDate < last14DaysCutoff) {
      continue
    }

    const notificationDay = new Date(
      notificationDate.getFullYear(),
      notificationDate.getMonth(),
      notificationDate.getDate(),
    )

    if (notificationDay.getTime() === today.getTime()) {
      groups.today.push(notification)
    } else if (notificationDay.getTime() === yesterday.getTime()) {
      groups.yesterday.push(notification)
    } else if (notificationDate >= last7DaysCutoff) {
      groups.last7Days.push(notification)
    } else {
      groups.last14Days.push(notification)
    }
  }

  return [
    { key: 'today', label: '今天', notifications: groups.today },
    { key: 'yesterday', label: '昨天', notifications: groups.yesterday },
    { key: 'last7Days', label: '最近 7 天', notifications: groups.last7Days },
    { key: 'last14Days', label: '更早', notifications: groups.last14Days },
  ].filter((group) => group.notifications.length > 0)
})

const allGroupedNotifications = computed(() => {
  return groupedNotifications.value.flatMap((group) => group.notifications)
})

const hasMore = computed(() => {
  return totalCount.value > props.maxDisplayCount
})

const handleRefresh = async () => {
  try {
    await Promise.all([fetchNotifications(), fetchStats()])
    emit('refresh')
  } catch (_err) {
    log.error('Failed to refresh notifications:', _err)
  }
}

const handleNotificationClick = async (notification: Notification) => {
  // 如果是未讀，先標記為已讀
  if (notification.status === 'unread') {
    try {
      await markAsRead(notification.id)
    } catch (_err) {
      log.error('Failed to mark as read:', _err)
    }
  }

  emit('notificationClick', notification)

  // 如果有 actionUrl，導航到該頁面
  if (notification.actionUrl) {
    router.push(notification.actionUrl)
    setTimeout(() => {
      isOpen.value = false
    }, 300) // 等待導航動畫結束
  }
}

const markAllAsRead = async () => {
  try {
    await markAllNotificationsAsRead()
    emit('markAllAsRead')
    toast.success('標記成功: 所有通知已標記為已讀')
  } catch (_err) {
    toast.error('操作失敗: 無法標記所有通知為已讀')
  }
}

const viewAll = () => {
  emit('viewAll')
  router.push({ name: 'notify-list' })
  isOpen.value = false
}

const getIconClasses = (notification: Notification) => {
  return getPriorityIconClass(notification.priority)
}

const getPriorityClasses = (priority: NotificationPriority) => {
  return getPriorityBadgeClass(priority)
}

// const getCategoryClasses = (category: string) => {
//   return (categoryClasses as Record<string, string>)[category] || 'bg-gray-100 text-gray-800'
// }

const startAutoRefresh = () => {
  // 使用較低頻率的備援輪詢
  if (props.autoRefresh && props.refreshInterval > 0) {
    autoRefreshTimer.value = setInterval(
      handleRefresh,
      props.refreshInterval * 2,
    ) as unknown as number
  }
}

const stopAutoRefresh = () => {
  if (autoRefreshTimer.value) {
    clearInterval(autoRefreshTimer.value)
    autoRefreshTimer.value = null
  }
}

// 生命週期
onMounted(async () => {
  await handleRefresh()
  // 啟動 realtime 訂閱
  subscribeToNotifications()
  log.debug('🚀 NotificationBadge - Realtime 訂閱已啟動')
})

onUnmounted(() => {
  stopAutoRefresh()
  unsubscribeFromNotifications()
})

// 監聽 realtime 連線狀態，失敗時啟動備援輪詢
watch(isRealtimeConnected, (connected) => {
  if (connected) {
    log.debug('✅ NotificationBadge - Realtime 連線成功，停止備援輪詢')
    stopAutoRefresh()
  } else {
    log.debug('❌ NotificationBadge - Realtime 連線失敗，啟動備援輪詢')
    if (props.autoRefresh && props.refreshInterval > 0) {
      startAutoRefresh()
    }
  }
})

// 監聽 realtime 錯誤
watch(realtimeError, (error) => {
  if (error) {
    log.warn('⚠️ NotificationBadge - Realtime 錯誤:', error)
    if (props.autoRefresh && props.refreshInterval > 0) {
      startAutoRefresh()
    }
  }
})

// 監聽自動刷新設定變化
watch(
  () => props.autoRefresh,
  (newAutoRefresh) => {
    if (newAutoRefresh) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  },
)

// 監聽刷新間隔變化
watch(
  () => props.refreshInterval,
  () => {
    stopAutoRefresh()
    startAutoRefresh()
  },
)
</script>

<template>
  <DropdownMenu v-model:open="isOpen" class="relative">
    <!-- 主要圖標 -->
    <!-- <div class="relative"> -->
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="relative h-7 w-7" :disabled="loading">
        <Bell :class="loading ? 'animate-pulse' : ''" />

        <!-- 主要指示器：未讀通知數量徽章 -->
        <div v-if="hasUnread" :class="[
          'absolute -top-1 -right-1.5 flex items-center justify-center rounded-full bg-destructive text-background font-bold border-1 border-background shadow-sm',
          (stats?.unreadCount || 0) <= 9
            ? 'h-4 w-3 text-[10px]'
            : (stats?.unreadCount || 0) <= 99
              ? 'h-4 w-auto min-w-[14px] px-1 text-[9px]'
              : 'h-4 w-auto px-1.5 text-[10px]'
        ]">
          {{ stats?.unreadCount && stats.unreadCount > 99 ? '99+' : stats?.unreadCount || 0 }}
        </div>

        <!-- 次要指示器：智能建議 -->
        <div v-if="hasSuggestions && !hasUnread"
          class="absolute top-0 right-0 h-2 w-2 rounded-full bg-warning border-1 border-background" title="有智能建議等待處理" />
      </Button>
    </DropdownMenuTrigger>
    <!-- </div> -->

    <!-- 下拉式通知面板 -->
    <DropdownMenuContent :class="[
      'bg-background/80 absolute top-2 h-fit w-96 backdrop-blur-sm',
      position === 'top-left' ? '-left-4' : '-right-4'
    ]">
      <!-- 面板標題 -->
      <div class="border-b p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold">通知</h3>
            <!-- 連線狀態指示器 -->
            <div class="flex items-center gap-1" :class="{
              'text-success': isRealtimeConnected,
              'text-warning': !isRealtimeConnected,
            }" :title="isRealtimeConnected ? 'Realtime 連線正常' : 'Realtime 連線異常，使用備援輪詢模式'">
              <Wifi v-if="isRealtimeConnected" class="h-3 w-3" />
              <WifiOff v-else class="h-3 w-3" />
              <span class="text-xs">{{ isRealtimeConnected ? '即時' : '輪詢' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <Button variant="ghost" size="sm" @click="handleRefresh" :disabled="loading">
              <RefreshCw :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
            </Button>
            <Button variant="ghost" size="sm" @click="markAllAsRead" :disabled="!hasUnread || loading">
              <CheckCircle class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- 通知內容 -->
      <ScrollArea class="h-80 overflow-y-auto">
        <!-- 載入狀態 -->
        <div v-if="loading && !allGroupedNotifications.length" class="space-y-3 p-4">
          <div v-for="i in 3" :key="i" class="flex gap-3">
            <Skeleton class="h-8 w-8 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-3 w-20" />
            </div>
          </div>
        </div>

        <!-- 錯誤狀態 -->
        <div v-else-if="error" class="p-4 text-center text-destructive">
          <AlertTriangle class="mx-auto mb-2 h-8 w-8" />
          <p class="text-sm">{{ error }}</p>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="allGroupedNotifications.length === 0" class="p-6 text-center">
          <Bell class="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">目前沒有通知</p>
        </div>

        <!-- 通知列表 -->
        <div v-else class="px-1 py-3">
          <div v-for="group in groupedNotifications" :key="group.key" class="mb-2">
            <h4 class="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {{ group.label }}
            </h4>
            <TransitionGroup name="notification-list" tag="div" class="space-y-1">
              <div v-for="notification in group.notifications" :key="notification.id"
                class="w-full cursor-pointer rounded-lg p-2 transition-colors hover:bg-muted/50"
                @click="handleNotificationClick(notification)">
                <div class="relative flex gap-3">
                  <!-- 通知圖標 -->
                  <div :class="[
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                    getIconClasses(notification),
                  ]">
                    <component :is="getNotificationIconSafe(notification.type)" class="h-4 w-4" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center">
                      <!-- 標題 -->
                      <p :class="[
                        'grow truncate text-xs font-medium',
                        notification.status === 'unread'
                          ? 'text-foreground'
                          : 'text-muted-foreground',
                      ]">
                        {{ notification.title }}
                        <Link2 v-if="notification.actionUrl" class="ml-1 h-3 w-3 inline-block" />
                      </p>
                      <!-- 時間顯示 -->
                      <span class="text-xs text-muted-foreground text-nowrap ml-auto">
                        {{ formatRelativeTime(notification.createdAt) }}
                      </span>
                    </div>

                    <!-- 訊息 -->
                    <p class="mt-2 line-clamp-2 text-sm tracking-wide text-muted-foreground">
                      {{ notification.message }}
                    </p>

                    <!-- 標籤區域 -->
                    <div
                      v-if="notification.isSuggestion || notification.category === 'actionable' || (notification.priority === 'urgent' || notification.priority === 'high')"
                      class="flex items-center gap-2 pt-2">
                      <Badge v-if="notification.isSuggestion" variant="outline" class="text-xs">
                        <Lightbulb class="h-3 w-3 mr-1 text-warning" />
                        建議
                      </Badge>
                      <Badge v-if="notification.category === 'actionable'" variant="outline" class="text-xs">
                        <CheckCircle class="h-3 w-3 mr-1 text-info" />
                        {{ categoryText[notification.category] || notification.category }}
                      </Badge>
                      <Badge v-if="notification.priority === 'urgent' || notification.priority === 'high'"
                        :class="getPriorityClasses(notification.priority)" class="text-xs">
                        <AlertTriangle class="h-3 w-3 mr-1" />
                        {{ priorityText[notification.priority] }}
                      </Badge>
                    </div>
                  </div>

                  <!-- 未讀指示器 -->
                  <div v-if="notification.status === 'unread'"
                    class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-sm" />
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </ScrollArea>

      <!-- 面板底部 -->
      <div v-if="hasMore || allGroupedNotifications.length > 0" class="border-t m-2 pt-2">
        <!-- 統計資訊 -->
        <div class="flex items-center gap-4 text-sm text-muted-foreground mb-2">
          <div class="flex items-center gap-1">
            <Bell class="h-3 w-3" />
            <span>{{ stats?.unreadCount || 0 }} 未讀</span>
          </div>
          <div v-if="stats?.byCategory?.actionable" class="flex items-center gap-1">
            <CheckCircle class="h-3 w-3" />
            <span>{{ stats.byCategory.actionable }} 任務</span>
          </div>
          <div v-if="stats?.byPriority?.urgent" class="flex items-center gap-1">
            <AlertTriangle class="h-3 w-3" />
            <span>{{ stats.byPriority.urgent }} 緊急</span>
          </div>
          <div v-if="stats?.suggestionsCount" class="flex items-center gap-1">
            <Lightbulb class="h-3 w-3" />
            <span>{{ stats.suggestionsCount }} 建議</span>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-xs text-muted-foreground">
            {{ allGroupedNotifications.length }} / {{ totalCount }} 筆通知
          </p>
          <Button variant="ghost" size="sm" @click="viewAll" class="text-xs">
            查看全部
            <ChevronRight class="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<style scoped>
.notification-list-move {
  transition: transform 0.5s ease;
}

/* 
.notification-list-move,
.notification-list-enter-active,
.notification-list-leave-active {
  transition: transform 0.5s ease;
}

.notification-list-leave-active {
  transition: all 0.5s ease;
  opacity: 0;
  transform: translateX(30px);
  position: absolute;
  width: calc(100% - 8px);
}
 */
</style>