<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Notify/NotificationList')

import { computed, ref, onMounted, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import {
  Bell,
  Search,
  RefreshCw,
  Settings,
  X,
  Lightbulb,
  // User,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckSquare,
  Info,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DataTableFacetedFilter from '@/components/data-table-common/DataTableFacetedFilter.vue'
import { useNotification } from '@/composables/useNotification'
import NotificationCard from './NotificationCard.vue'
import {
  entityTypeFilterOptions,
  matchesEntityTypeFilter,
} from '@/constants/entity-config'
import type { Notification } from '@/types'
import type { ToastType } from '@/types'

interface Props {
  userId?: string
  maxHeight?: string
  showFilters?: boolean
  showSearch?: boolean
  showStats?: boolean
  initialTab?: 'all' | 'suggestions' | 'actionable'
}

const props = withDefaults(defineProps<Props>(), {
  maxHeight: '600px',
  showFilters: true,
  showSearch: true,
  showStats: true,
  initialTab: 'all',
})

const emit = defineEmits<{
  notificationClick: [notification: Notification]
  refresh: []
}>()

// 使用路由
const route = useRoute()

// 使用 notification composable
const userIdRef = computed(() => props.userId || '')
const {
  notifications,
  suggestions,
  stats,
  loading,
  error,
  actionableNotifications: baseActionableNotifications,
  fetchNotifications,
  fetchStats,
  markAsRead,
  markAsUnread,
  markAsCompleted,
  markAsDismissed,
  acceptSuggestion,
  dismissSuggestion,
  archiveNotification,
  deleteNotification,
  searchNotifications,
} = useNotification(userIdRef)

// Toast 系統
const toast = inject<ToastType>('toast', {
  success: (msg: string) => log.debug('Success:', msg),
  error: (msg: string) => log.error('Error:', msg),
  warning: (msg: string) => log.warn('Warning:', msg),
  info: (msg: string) => log.info('Info:', msg),
})
// const toast = inject<ToastType>('toast', {
//   success: (msg: string) => log.debug('Success:', msg),
//   error: (msg: string) => log.error('Error:', msg),
// })

// 響應式狀態
const currentTab = ref<'all' | 'suggestions' | 'actionable'>(props.initialTab)
const searchQuery = ref('')
const selectedFilters = ref({
  status: [] as string[],
  priority: [] as string[],
  category: [] as string[],
  entityType: [] as string[],
})
const isRefreshing = ref(false)

// 篩選器選項配置
const filterOptions = {
  status: [
    { label: '未讀', value: 'unread', icon: Bell },
    { label: '已讀', value: 'read', icon: X },
    { label: '已完成', value: 'completed', icon: CheckCircle },
    { label: '已知悉', value: 'dismissed', icon: X },
  ],
  priority: [
    { label: '緊急', value: 'urgent', icon: AlertTriangle },
    { label: '高', value: 'high', icon: ArrowUp },
    { label: '中', value: 'medium', icon: Minus },
    { label: '低', value: 'low', icon: ArrowDown },
  ],
  category: [
    { label: '任務', value: 'actionable', icon: CheckSquare },
    { label: '通知', value: 'informational', icon: Info },
  ],
  entityType: entityTypeFilterOptions,
}

// 計算屬性
const unreadCount = computed(() => stats.value?.unreadCount || 0)
const suggestionCount = computed(() => suggestions.value?.length || 0)

const actionableNotifications = computed(() => {
  let filtered = [...(baseActionableNotifications.value || [])]

  // 搜尋過濾
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(query) ||
        (n.message || '').toLowerCase().includes(query),
    )
  }

  // 狀態過濾
  if (selectedFilters.value.status && selectedFilters.value.status.length > 0) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.status.includes(n.status),
    )
  }

  // 優先級過濾
  if (
    selectedFilters.value.priority &&
    selectedFilters.value.priority.length > 0
  ) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.priority.includes(n.priority),
    )
  }

  // 實例類型過濾 - 使用統一的匹配邏輯 (actionableNotifications)
  if (
    selectedFilters.value.entityType &&
    selectedFilters.value.entityType.length > 0
  ) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.entityType.some((filterType) =>
        matchesEntityTypeFilter(n.relatedEntityType, filterType),
      ),
    )
  }

  return filtered.sort((a, b) => {
    // 未讀優先
    if (a.status === 'unread' && b.status !== 'unread') return -1
    if (a.status !== 'unread' && b.status === 'unread') return 1

    // 優先級排序
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, normal: 2 }
    const priorityDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    if (priorityDiff !== 0) return priorityDiff

    // 時間排序（最新在前）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const actionableCount = computed(
  () => baseActionableNotifications.value?.length || 0,
)

const filteredNotifications = computed(() => {
  let filtered = [...(notifications.value || [])]

  // 搜尋過濾
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(query) ||
        (n.message || '').toLowerCase().includes(query),
    )
  }

  // 狀態過濾
  if (selectedFilters.value.status && selectedFilters.value.status.length > 0) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.status.includes(n.status),
    )
  }

  // 優先級過濾
  if (
    selectedFilters.value.priority &&
    selectedFilters.value.priority.length > 0
  ) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.priority.includes(n.priority),
    )
  }

  // 分類過濾
  if (
    selectedFilters.value.category &&
    selectedFilters.value.category.length > 0
  ) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.category.includes(n.category),
    )
  }

  // 實例類型過濾 - 使用統一的匹配邏輯 (filteredNotifications)
  if (
    selectedFilters.value.entityType &&
    selectedFilters.value.entityType.length > 0
  ) {
    filtered = filtered.filter((n) =>
      selectedFilters.value.entityType.some((filterType) =>
        matchesEntityTypeFilter(n.relatedEntityType, filterType),
      ),
    )
  }

  return filtered.sort((a, b) => {
    // 未讀優先
    if (a.status === 'unread' && b.status !== 'unread') return -1
    if (a.status !== 'unread' && b.status === 'unread') return 1

    // 優先級排序
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, normal: 2 }
    const priorityDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
    if (priorityDiff !== 0) return priorityDiff

    // 時間排序（最新在前）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

const hasActiveFilters = computed(() => {
  return (
    (selectedFilters.value.status && selectedFilters.value.status.length > 0) ||
    (selectedFilters.value.priority &&
      selectedFilters.value.priority.length > 0) ||
    (selectedFilters.value.category &&
      selectedFilters.value.category.length > 0) ||
    (selectedFilters.value.entityType &&
      selectedFilters.value.entityType.length > 0)
  )
})

// 方法
const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([fetchNotifications(), fetchStats()])
    emit('refresh')
    toast.success('刷新成功: 通知列表已更新')
  } catch (_err) {
    toast.error('刷新失敗: 無法載入通知列表')
  } finally {
    isRefreshing.value = false
  }
}

const handleNotificationClick = (notification: Notification) => {
  emit('notificationClick', notification)
}

const handleMarkAsRead = async (id: string) => {
  try {
    await markAsRead(id)
    toast.success('標記成功: 已標記為已讀')
  } catch (_err) {
    toast.error('操作失敗: 無法標記為已讀')
  }
}

const handleMarkAsUnread = async (id: string) => {
  try {
    await markAsUnread(id)
    toast.success('標記成功: 已標記為未讀')
  } catch (_err) {
    toast.error('操作失敗: 無法標記為未讀')
  }
}

const handleMarkAsCompleted = async (id: string) => {
  try {
    await markAsCompleted(id)
    toast.success('完成成功: 通知已標記為完成')
  } catch (_err) {
    toast.error('操作失敗: 無法標記為完成')
  }
}

const handleMarkAsDismissed = async (id: string) => {
  try {
    await markAsDismissed(id)
    toast.success('知悉成功: 通知已標記為知悉')
  } catch (_err) {
    toast.error('操作失敗: 無法標記為知悉')
  }
}

const handleAcceptSuggestion = async (id: string) => {
  try {
    await acceptSuggestion(id)
    toast.success('建議已接受: 智能建議已處理')
  } catch (_err) {
    toast.error('操作失敗: 無法接受建議')
  }
}

const handleDismissSuggestion = async (id: string) => {
  try {
    await dismissSuggestion(id)
    toast.success('建議已拒絕: 智能建議已拒絕')
  } catch (_err) {
    toast.error('操作失敗: 無法拒絕建議')
  }
}

const handleArchive = async (id: string) => {
  try {
    await archiveNotification(id)
    toast.success('歸檔成功: 通知已歸檔')
  } catch (_err) {
    toast.error('操作失敗: 無法歸檔通知')
  }
}

const handleDelete = async (id: string) => {
  try {
    await deleteNotification(id)
    toast.success('刪除成功: 通知已刪除')
  } catch (_err) {
    toast.error('操作失敗: 無法刪除通知')
  }
}

const clearSearch = () => {
  searchQuery.value = ''
}

const clearFilters = () => {
  selectedFilters.value = {
    status: [],
    priority: [],
    category: [],
    entityType: [],
  }
}

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await searchNotifications(searchQuery.value)
  }
}

// 處理路由參數篩選
const applyEntityTypeFilter = (entityType: string | undefined) => {
  if (entityType && typeof entityType === 'string') {
    selectedFilters.value.entityType = [entityType]
  } else {
    // 如果沒有 entityType 參數，清除該篩選條件
    selectedFilters.value.entityType = []
  }
}

// 生命週期
onMounted(async () => {
  // 檢查路由參數中是否有 entityType 篩選條件
  applyEntityTypeFilter(route.query.entityType as string)

  if (userIdRef.value) {
    await handleRefresh()
  }
})

// 監聽路由變化，處理同頁篩選切換
watch(
  () => route.query.entityType,
  (newEntityType) => {
    applyEntityTypeFilter(newEntityType as string)
  },
  { immediate: false },
)

// 監聽搜尋
watch(searchQuery, (newQuery) => {
  if (newQuery.length > 2) {
    handleSearch()
  }
})
</script>

<template>
  <div class="w-full" data-testid="notification-list">
    <!-- 標題和統計 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Bell class="h-5 w-5" />
        <h3 class="text-lg font-semibold">通知中心</h3>
        <Badge v-if="stats?.unreadCount && stats.unreadCount > 0" variant="secondary">{{ stats.unreadCount }}</Badge>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="sm" @click="handleRefresh" :disabled="loading || isRefreshing" data-testid="refresh-btn">
          <RefreshCw :class="['h-4 w-4', loading || isRefreshing ? 'animate-spin' : '']" />
        </Button>
        <Button variant="ghost" size="sm">
          <Settings class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 搜尋和過濾器 -->
    <div v-if="showSearch || showFilters" class="mb-4 space-y-3">
      <!-- 搜尋框 -->
      <div v-if="showSearch" class="relative">
        <Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
        <Input v-model="searchQuery" placeholder="搜尋通知..." class="pr-9 pl-9" @keyup.enter="handleSearch" data-testid="search-input" />
        <Button v-if="searchQuery" variant="ghost" size="sm"
          class="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0" @click="clearSearch" data-testid="clear-search-btn">
          <X class="h-3 w-3" />
        </Button>
      </div>

      <!-- 過濾器 -->
      <div v-if="showFilters" class="flex flex-wrap items-center gap-2">
        <DataTableFacetedFilter title="狀態" :options="filterOptions.status" :selected="selectedFilters.status"
          @update:selected="selectedFilters.status = $event || []" />

        <DataTableFacetedFilter title="優先級" :options="filterOptions.priority" :selected="selectedFilters.priority"
          @update:selected="selectedFilters.priority = $event || []" />

        <DataTableFacetedFilter title="分類" :options="filterOptions.category" :selected="selectedFilters.category"
          @update:selected="selectedFilters.category = $event || []" />

        <DataTableFacetedFilter title="實例類型" :options="filterOptions.entityType" :selected="selectedFilters.entityType"
          @update:selected="selectedFilters.entityType = $event || []" />

        <Button v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearFilters" data-testid="clear-filters-btn">
          <X class="mr-1 h-4 w-4" />
          清除過濾器
        </Button>
      </div>
    </div>

    <!-- 分頁標籤 -->
    <Tabs v-model="currentTab" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="all" class="flex items-center gap-2" data-testid="tab-all">
          <Bell class="h-4 w-4" />
          全部通知
          <Badge v-if="unreadCount > 0" variant="secondary">{{
            unreadCount
          }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="actionable" class="flex items-center gap-2" data-testid="tab-actionable">
          <CheckSquare class="h-4 w-4" />
          任務
          <Badge v-if="actionableCount > 0" variant="secondary">{{
            actionableCount
          }}</Badge>
        </TabsTrigger>
        <TabsTrigger value="suggestions" class="flex items-center gap-2" data-testid="tab-suggestions">
          <Lightbulb class="h-4 w-4" />
          智能建議
          <Badge v-if="suggestionCount > 0" variant="secondary">{{
            suggestionCount
          }}</Badge>
        </TabsTrigger>
      </TabsList>

      <!-- 全部通知 -->
      <TabsContent value="all" class="mt-4">
        <!-- 載入狀態 -->
        <div v-if="loading" class="space-y-3" data-testid="loading-skeleton">
          <div v-for="i in 5" :key="i" class="flex gap-3">
            <Skeleton class="h-10 w-10 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-3 w-20" />
            </div>
          </div>
        </div>

        <!-- 錯誤狀態 -->
        <div v-else-if="error" class="py-8 text-center text-red-500">
          {{ error }}
        </div>

        <!-- 空狀態 -->
        <div v-else-if="filteredNotifications.length === 0" class="py-8 text-center">
          <Bell class="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p class="mb-2 text-gray-600">
            {{
              searchQuery || hasActiveFilters
                ? '沒有符合條件的通知'
                : '目前沒有通知'
            }}
          </p>
          <p class="text-sm text-gray-500">
            {{
              searchQuery || hasActiveFilters
                ? '請嘗試調整搜尋或過濾條件'
                : '新通知會在這裡顯示'
            }}
          </p>
        </div>

        <!-- 通知列表 -->
        <ScrollArea v-else :style="{ height: maxHeight }" data-testid="scroll-area">
          <div class="space-y-3">
            <NotificationCard v-for="notification in filteredNotifications" :key="notification.id"
              :notification="notification" :loading="loading" @card-click="handleNotificationClick"
              @mark-as-read="handleMarkAsRead" @mark-as-unread="handleMarkAsUnread"
              @mark-as-completed="handleMarkAsCompleted" @mark-as-dismissed="handleMarkAsDismissed"
              @accept-suggestion="handleAcceptSuggestion" @dismiss-suggestion="handleDismissSuggestion"
              @archive="handleArchive" @delete="handleDelete" />
          </div>
        </ScrollArea>
      </TabsContent>

      <!-- 任務通知 -->
      <TabsContent value="actionable" class="mt-4">
        <!-- 載入狀態 -->
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="flex gap-3">
            <Skeleton class="h-10 w-10 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-3 w-20" />
            </div>
          </div>
        </div>

        <!-- 錯誤狀態 -->
        <div v-else-if="error" class="py-8 text-center text-red-500">
          {{ error }}
        </div>

        <!-- 空狀態 -->
        <div v-else-if="actionableNotifications.length === 0" class="py-8 text-center">
          <CheckSquare class="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p class="mb-2 text-gray-600">
            {{
              searchQuery || hasActiveFilters
                ? '沒有符合條件的任務'
                : '目前沒有任務'
            }}
          </p>
          <p class="text-sm text-gray-500">
            {{
              searchQuery || hasActiveFilters
                ? '請嘗試調整搜尋或過濾條件'
                : '需要處理的任務會在這裡顯示'
            }}
          </p>
        </div>

        <!-- 任務列表 -->
        <ScrollArea v-else :style="{ height: maxHeight }">
          <div class="space-y-3">
            <NotificationCard v-for="notification in actionableNotifications" :key="notification.id"
              :notification="notification" :loading="loading" @card-click="handleNotificationClick"
              @mark-as-read="handleMarkAsRead" @mark-as-unread="handleMarkAsUnread"
              @mark-as-completed="handleMarkAsCompleted" @mark-as-dismissed="handleMarkAsDismissed"
              @accept-suggestion="handleAcceptSuggestion" @dismiss-suggestion="handleDismissSuggestion"
              @archive="handleArchive" @delete="handleDelete" />
          </div>
        </ScrollArea>
      </TabsContent>

      <!-- 智能建議 -->
      <TabsContent value="suggestions" class="mt-4">
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="flex gap-3">
            <Skeleton class="h-10 w-10 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-3 w-20" />
            </div>
          </div>
        </div>
        <div v-else-if="suggestions && suggestions.length > 0">
          <!-- 批量操作按鈕 -->
          <div class="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3">
            <p class="text-sm font-medium text-amber-800">批量操作所有 {{ suggestions.length }} 項建議</p>
            <div class="flex items-center gap-2">
              <Button
                size="sm"
                @click="() => suggestions.forEach(s => handleAcceptSuggestion(s.id))"
                :disabled="loading"
              >
                <CheckCircle class="mr-1 h-4 w-4" />
                全部接受
              </Button>
              <Button
                size="sm"
                variant="outline"
                @click="() => suggestions.forEach(s => handleDismissSuggestion(s.id))"
                :disabled="loading"
              >
                <X class="mr-1 h-4 w-4" />
                全部拒絕
              </Button>
            </div>
          </div>
          <!-- 建議列表 -->
          <div class="space-y-3">
            <NotificationCard
              v-for="suggestion in suggestions"
              :key="suggestion.id"
              :notification="suggestion"
              :loading="loading"
              @accept-suggestion="handleAcceptSuggestion"
              @dismiss-suggestion="handleDismissSuggestion"
              @card-click="handleNotificationClick"
            />
          </div>
        </div>
        <div v-else class="py-8 text-center">
          <Lightbulb class="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p class="mb-2 text-gray-600">目前沒有智能建議</p>
          <p class="text-sm text-gray-500">系統會為您推薦可以自動完成的通知</p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
