# 通知系統前端開發指南

## 概述

本指南詳細說明通知系統的前端實作，包含 Vue 組件、Composable API、樣式系統和 Realtime 整合。

📖 **相關文檔**：
- [通知系統概述](../../../../../docs/04-guides/dev-notes/NOTIFICATION_SYSTEM_OVERVIEW.md) - 系統整體架構
- [通知後端指南](../../../../../docs/02-development/database/NOTIFICATION_BACKEND_GUIDE.md) - 資料庫與觸發器

## 前端組件架構

### 組件目錄結構

```
src/components/notify/
├── NotificationCard.vue          # 通知卡片組件
├── NotificationBadge.vue         # 通知徽章組件
├── NotificationList.vue          # 通知列表組件
├── NotificationSettings.vue      # 通知設定組件
├── notificationIconConfig.ts     # 統一圖示配置
└── config.ts                     # 通知配置
```

## useNotification Composable

### API 參考

核心通知管理 composable，提供完整的通知操作功能。

```typescript
import { useNotification } from '@/composables/useNotification'

const {
  // 狀態
  notifications,      // Ref<Notification[]> - 通知列表
  stats,             // Ref<NotificationStats> - 通知統計
  loading,           // Ref<boolean> - 載入狀態
  error,             // Ref<Error | null> - 錯誤狀態

  // 方法
  loadNotifications,         // () => Promise<void> - 載入通知列表
  markAsRead,               // (id: string) => Promise<void> - 標記為已讀
  markAsCompleted,          // (id: string) => Promise<void> - 標記為完成
  createNotification,       // (type: string, data: any) => Promise<Notification>
  acceptCompletionSuggestion, // (id: string) => Promise<void> - 接受智能建議

  // 群組通知
  groupNotifications: {
    notifyRole,             // (role: string, type: string, data: any) => Promise<void>
    notifyAllAdmins,        // (type: string, data: any) => Promise<void>
    broadcast,              // (type: string, data: any) => Promise<void>
  },

  // 即時訂閱
  subscribeToNotifications,   // () => void - 啟用 Realtime 訂閱
  isRealtimeConnected,        // Ref<boolean> - Realtime 連線狀態
} = useNotification(userId)
```

### 使用範例

#### 創建通知

```typescript
// 個人通知
await createNotification('order_new', {
  order_number: 'ORD-2024-001',
  total_amount: 1250.0
})

// 群組通知 - 通知特定角色
await groupNotifications.notifyRole('admin', 'system_maintenance', {
  title: '系統維護通知',
  message: '系統將於今晚進行維護'
})

// 群組通知 - 廣播所有人
await groupNotifications.broadcast('urgent_announcement', {
  title: '緊急公告',
  message: '請注意重要訊息'
})
```

#### 通知操作

```typescript
// 標記為已讀
await markAsRead(notificationId)

// 標記任務完成
await markAsCompleted(notificationId)

// 接受智能建議
await acceptCompletionSuggestion(notificationId)
```

#### 載入與篩選

```typescript
// 載入所有通知
await loadNotifications()

// 篩選特定狀態通知
const unreadNotifications = computed(() =>
  notifications.value.filter(n => n.status === 'unread')
)

// 篩選特定類型通知
const orderNotifications = computed(() =>
  notifications.value.filter(n => n.type.startsWith('order_'))
)
```

## 組件使用指南

### NotificationCard

支援多種顯示模式的通知卡片組件。

#### Props

```typescript
interface NotificationCardProps {
  notification: Notification       // 通知資料
  displayMode?: DisplayMode       // 顯示模式：'list' | 'badge' | 'toast' | 'modal'
  showActions?: boolean           // 是否顯示操作按鈕（預設：true）
  compact?: boolean               // 緊湊模式（預設：false）
}
```

#### Events

```typescript
interface NotificationCardEvents {
  'mark-as-read': (id: string) => void         // 標記為已讀
  'mark-as-completed': (id: string) => void    // 標記為完成
  'accept-suggestion': (id: string) => void    // 接受智能建議
  'click': (notification: Notification) => void // 點擊通知
}
```

#### 使用範例

```vue
<template>
  <!-- 列表模式（完整功能） -->
  <NotificationCard
    :notification="notification"
    :display-mode="'list'"
    @mark-as-read="handleMarkAsRead"
    @click="handleNotificationClick"
  />

  <!-- 徽章模式（緊湊顯示） -->
  <NotificationCard
    :notification="notification"
    :display-mode="'badge'"
    :compact="true"
  />

  <!-- Toast 模式（彈出通知） -->
  <NotificationCard
    :notification="notification"
    :display-mode="'toast'"
    :show-actions="false"
  />
</template>

<script setup lang="ts">
const handleMarkAsRead = async (id: string) => {
  await markAsRead(id)
}

const handleNotificationClick = (notification: Notification) => {
  // 導航到相關頁面
  if (notification.entity_type === 'order') {
    router.push(`/orders/${notification.entity_id}`)
  }
}
</script>
```

#### DisplayMode 說明

| Mode | 適用場景 | 功能特性 |
|------|---------|---------|
| `list` | 通知列表頁面 | 完整資訊、所有操作按鈕 |
| `badge` | 通知徽章下拉 | 緊湊顯示、快速操作 |
| `toast` | 即時彈出通知 | 簡化資訊、自動消失 |
| `modal` | 彈窗對話框 | 詳細資訊、確認操作 |

### NotificationBadge

頁面右上角的通知徽章組件。

#### Props

```typescript
interface NotificationBadgeProps {
  userId: string                  // 使用者 ID
  autoRefresh?: boolean          // 自動刷新（預設：true）
  refreshInterval?: number       // 刷新間隔（毫秒，預設：30000）
  maxDisplayCount?: number       // 最大顯示數量（預設：5）
}
```

#### Events

```typescript
interface NotificationBadgeEvents {
  'notification-click': (notification: Notification) => void  // 點擊通知
  'view-all': () => void                                     // 查看全部
}
```

#### 使用範例

```vue
<template>
  <NotificationBadge
    :user-id="userId"
    :auto-refresh="true"
    :refresh-interval="30000"
    :max-display-count="5"
    @notification-click="handleNotificationClick"
    @view-all="goToNotificationCenter"
  />
</template>

<script setup lang="ts">
import { NotificationBadge } from '@/components/notify'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const handleNotificationClick = (notification: Notification) => {
  // 標記為已讀並導航
  markAsRead(notification.id)
  router.push(notification.action_url || '/notifications')
}

const goToNotificationCenter = () => {
  router.push('/notifications')
}
</script>
```

### NotificationList

完整的通知列表組件，支援搜尋、篩選、分頁。

#### Props

```typescript
interface NotificationListProps {
  userId: string                    // 使用者 ID
  showFilters?: boolean            // 顯示篩選器（預設：true）
  showSearch?: boolean             // 顯示搜尋欄（預設：true）
  initialTab?: string              // 初始標籤頁：'all' | 'unread' | 'actionable'
  pageSize?: number                // 每頁數量（預設：20）
}
```

#### Events

```typescript
interface NotificationListEvents {
  'notification-click': (notification: Notification) => void  // 點擊通知
  'tab-change': (tab: string) => void                        // 切換標籤
}
```

#### 使用範例

```vue
<template>
  <NotificationList
    :user-id="userId"
    :show-filters="true"
    :show-search="true"
    :initial-tab="'all'"
    :page-size="20"
    @notification-click="handleClick"
    @tab-change="handleTabChange"
  />
</template>

<script setup lang="ts">
import { NotificationList } from '@/components/notify'

const handleClick = (notification: Notification) => {
  console.log('Notification clicked:', notification)
}

const handleTabChange = (tab: string) => {
  console.log('Tab changed to:', tab)
}
</script>
```

## 通知類型系統

### 自定義通知類型

#### 步驟 1: 資料庫新增模板

```typescript
// 使用 NotificationTemplateApiService
await notificationTemplateApi.createTemplate({
  type: 'custom_notification',
  titleTemplate: '自定義通知：{{title}}',
  messageTemplate: '{{message}}',
  category: 'informational',
  completionStrategy: 'manual'
})
```

#### 步驟 2: 更新圖示配置

```typescript
// src/components/notify/notificationIconConfig.ts
import { CustomIcon } from 'lucide-vue-next'

export const notificationIcons = {
  // ... 其他圖示
  custom_notification: CustomIcon,
}

export const notificationIconClasses = {
  // ... 其他類別
  custom_notification: 'bg-purple-100 text-purple-600',
}
```

#### 步驟 3: 使用新通知類型

```typescript
await createNotification('custom_notification', {
  title: '自定義標題',
  message: '自定義訊息',
  customField: '額外資料'
})
```

## 樣式系統

### 統一圖示配置

所有通知相關的圖示都統一管理在 `notificationIconConfig.ts` 中：

```typescript
import {
  ShoppingCart,
  Package,
  MessageCircle,
  AlertTriangle,
  // ... 其他圖示
} from 'lucide-vue-next'

// 通知類型圖示
export const notificationIcons = {
  order_new: ShoppingCart,
  inventory_low_stock: Package,
  customer_service_new_request: MessageCircle,
  security_unusual_login: AlertTriangle,
  // ...
}

// 優先級樣式
export const priorityIconClasses = {
  urgent: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
  medium: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  low: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
}

// 分類樣式
export const categoryClasses = {
  actionable: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  informational: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
}
```

### 響應式設計

所有組件都支援響應式設計，自動適應不同螢幕尺寸：

```vue
<template>
  <!-- 手機版：堆疊佈局 -->
  <div class="flex flex-col space-y-2 md:flex-row md:space-x-4 md:space-y-0">
    <NotificationCard :notification="notification" />
  </div>
</template>
```

### 深色模式支援

所有組件完整支援深色模式：

```typescript
// 使用 Tailwind CSS dark: 前綴
const cardClasses = computed(() => [
  'bg-white dark:bg-gray-800',
  'text-gray-900 dark:text-gray-100',
  'border-gray-200 dark:border-gray-700'
])
```

## 即時通訊整合

### Supabase Realtime 訂閱

系統使用 Supabase Realtime 實現即時通知推送：

```typescript
// 自動訂閱通知變更
const { subscribeToNotifications, isRealtimeConnected } = useNotification(userId)

// 組件掛載時自動訂閱
onMounted(() => {
  subscribeToNotifications()
})

// 監控連線狀態
watch(isRealtimeConnected, (connected) => {
  if (!connected) {
    console.warn('Realtime disconnected, starting polling')
    startPolling()
  } else {
    console.log('Realtime connected')
    stopPolling()
  }
})

// 組件卸載時清理訂閱
onUnmounted(() => {
  unsubscribeFromNotifications()
})
```

### 備援輪詢機制

當 Realtime 連線失敗時，系統會自動啟動輪詢機制確保通知不遺漏：

```typescript
const POLLING_INTERVAL = 10000 // 10秒
let pollingTimer: NodeJS.Timeout | null = null

const startPolling = () => {
  if (pollingTimer) return

  pollingTimer = setInterval(async () => {
    await loadNotifications()
  }, POLLING_INTERVAL)
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}
```

### Realtime 事件處理

```typescript
// 監聽新通知
channel.on('INSERT', (payload) => {
  const newNotification = payload.new as Notification
  notifications.value.unshift(newNotification)

  // 顯示 Toast 通知
  toast.info(newNotification.title, {
    description: newNotification.message,
    action: {
      label: '查看',
      onClick: () => handleNotificationClick(newNotification)
    }
  })
})

// 監聽通知更新
channel.on('UPDATE', (payload) => {
  const updatedNotification = payload.new as Notification
  const index = notifications.value.findIndex(n => n.id === updatedNotification.id)

  if (index !== -1) {
    notifications.value[index] = updatedNotification
  }
})
```

## 測試指南

### 單元測試

```bash
# 執行通知組件測試
npm run test -- src/components/notify

# 執行 Composable 測試
npm run test -- src/composables/useNotification
```

### 測試範例

```typescript
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import NotificationCard from '@/components/notify/NotificationCard.vue'

describe('NotificationCard', () => {
  it('should render notification correctly', () => {
    const notification = {
      id: '1',
      title: 'Test Notification',
      message: 'Test Message',
      type: 'order_new',
      priority: 'high',
      status: 'unread'
    }

    const wrapper = mount(NotificationCard, {
      props: { notification }
    })

    expect(wrapper.text()).toContain('Test Notification')
    expect(wrapper.text()).toContain('Test Message')
  })

  it('should emit mark-as-read event', async () => {
    const notification = { id: '1', /* ... */ }
    const wrapper = mount(NotificationCard, {
      props: { notification }
    })

    await wrapper.find('[data-test="mark-read-btn"]').trigger('click')

    expect(wrapper.emitted('mark-as-read')).toBeTruthy()
    expect(wrapper.emitted('mark-as-read')?.[0]).toEqual(['1'])
  })
})
```

### 整合測試

```typescript
describe('Notification System Integration', () => {
  it('should create and display notification', async () => {
    const { result } = renderHook(() => useNotification('user-1'))

    // 創建通知
    await result.current.createNotification('order_new', {
      order_number: 'TEST-001',
      total_amount: 100
    })

    // 驗證通知已加入列表
    expect(result.current.notifications.value).toHaveLength(1)
    expect(result.current.notifications.value[0].type).toBe('order_new')
  })

  it('should mark notification as read', async () => {
    const { result } = renderHook(() => useNotification('user-1'))
    const notificationId = 'notif-1'

    await result.current.markAsRead(notificationId)

    const notification = result.current.notifications.value.find(
      n => n.id === notificationId
    )
    expect(notification?.status).toBe('read')
  })
})
```

## 效能最佳化

### 虛擬滾動

長列表自動啟用虛擬滾動，提升大量通知的渲染效能：

```vue
<template>
  <VirtualList
    :items="notifications"
    :item-height="80"
    :buffer="5"
  >
    <template #default="{ item }">
      <NotificationCard :notification="item" />
    </template>
  </VirtualList>
</template>
```

### 批量操作

```typescript
// 批量標記為已讀
const markMultipleAsRead = async (ids: string[]) => {
  await Promise.all(ids.map(id => markAsRead(id)))
}

// 批量歸檔
const archiveMultiple = async (ids: string[]) => {
  await bulkUpdateNotifications({
    action: 'archive',
    notificationIds: ids
  })
}
```

### 快取策略

```typescript
// 使用 Vue 的 computed 快取
const unreadCount = computed(() =>
  notifications.value.filter(n => n.status === 'unread').length
)

// 模板資料快取
const templateCache = new Map<string, NotificationTemplate>()

const getTemplate = async (type: string) => {
  if (templateCache.has(type)) {
    return templateCache.get(type)
  }

  const template = await fetchTemplate(type)
  templateCache.set(type, template)
  return template
}
```

## 除錯工具

### 開啟除錯模式

```typescript
// 開啟通知系統除錯模式
const { enableDebugMode } = useNotification(userId)
enableDebugMode(true)

// 查看 Realtime 連線狀態
console.log('Realtime connected:', isRealtimeConnected.value)

// 檢查通知統計
console.log('Notification stats:', stats.value)
```

### DevTools 整合

使用 Vue DevTools 檢查通知狀態：

1. 打開 Vue DevTools
2. 切換到 Pinia 標籤
3. 查看 `notification` store 的狀態

## 最佳實踐

### 1. 總是處理錯誤

```typescript
try {
  await createNotification('order_new', data)
} catch (error) {
  console.error('Failed to create notification:', error)
  toast.error('通知創建失敗，請稍後再試')
}
```

### 2. 使用 TypeScript 類型

```typescript
import type { Notification, NotificationStats } from '@/types'

const notification: Notification = {
  id: '1',
  userId: 'user-1',
  type: 'order_new',
  // ... 其他欄位
}
```

### 3. 適當的載入狀態

```vue
<template>
  <div v-if="loading">
    <LoadingSpinner />
  </div>
  <div v-else-if="error">
    <ErrorMessage :error="error" />
  </div>
  <div v-else>
    <NotificationList :notifications="notifications" />
  </div>
</template>
```

### 4. 清理副作用

```typescript
onUnmounted(() => {
  // 取消訂閱
  unsubscribeFromNotifications()

  // 清理計時器
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
```

---

## 相關資源

- [Vue 3 文檔](https://vuejs.org/)
- [TypeScript 文檔](https://www.typescriptlang.org/)
- [Supabase Realtime 文檔](https://supabase.com/docs/guides/realtime)
- [Lucide Icons](https://lucide.dev/)
