<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'Notify/NotificationCard')

import { computed, ref, inject } from 'vue'
import {
  // Eye,
  // EyeOff,
  // Check,
  // ListCheck,
  ListChecks,
  // ListTodo,
  // MailCheck,
  MailOpen,
  // BookOpenCheck,
  // SquareCheck,
  // ThumbsUp,
  // ThumbsDown,
  Archive,
  // MoreHorizontal,
  // ExternalLink,
  Copy,
  // Trash2,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  // Siren,
  ArrowUp,
  Users,
  // UsersRound,
  // Megaphone,
  Radio,
  // Volume2,
  // MessageSquareLock,
  MessageSquareMore,
  X,
  Info,
  ExternalLink,
} from 'lucide-vue-next'
import {
  getNotificationIcon,
  getPriorityIconClass,
  priorityText,
  categoryText,
  completionStrategyText,
  // statusClasses,
  categoryClasses,
  completionStrategyClasses,
} from './notifyConfig'
import { Button } from '@/components/ui/button'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'
import { formatRelativeTime } from '@/utils'
import type { Notification } from '@/types'
import type { ToastType } from '@/types'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getNotificationTemplateInfo } from './notificationTemplates'

interface Props {
  notification: Notification
  loading?: boolean
  displayMode?: 'list' | 'toast' | 'badge' | 'modal'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  displayMode: 'list',
})

const emit = defineEmits<{
  markAsRead: [id: string]
  markAsUnread: [id: string]
  markAsCompleted: [id: string]
  markAsDismissed: [id: string]
  acceptSuggestion: [id: string]
  dismissSuggestion: [id: string]
  archive: [id: string]
  delete: [id: string]
  cardClick: [notification: Notification]
}>()

// Toast 系統
const toast = inject<ToastType>('toast', {
  success: (msg: string) => log.debug('Success:', msg),
  error: (msg: string) => log.error('Error:', msg),
  warning: (msg: string) => log.warn('Warning:', msg),
  info: (msg: string) => log.info('Info:', msg),
})
const loading = ref(false)

// 計算屬性
const notificationIcon = computed(() => {
  return getNotificationIcon(props.notification.type as any)
})

// 通知模板資訊
const templateInfo = computed(() => {
  return getNotificationTemplateInfo(props.notification.type)
})

// 判斷是否有連結
const hasActionUrl = computed(() => {
  return !!props.notification.actionUrl && props.notification.actionUrl.trim() !== ''
})

// const statusClass = computed(() => {
//   return statusClasses[props.notification.status] || statusClasses.read
// })

// const priorityBorderClass = computed(() => {
//   return getPriorityBorderClass(props.notification.priority)
// })

// const iconClass = computed(() => {
//   return getPriorityIconClass(props.notification.priority)
// })

// const priorityBadgeClass = computed(() => {
//   return getPriorityBadgeClass(props.notification.priority)
// })

// const priorityLabel = computed(() => {
//   return priorityText[props.notification.priority]
// })

// const categoryClass = computed(() => {
//   return (
//     categoryClasses[props.notification.category] ||
//     categoryClasses.informational
//   )
// })

// const categoryLabel = computed(() => {
//   return categoryText[props.notification.category] || categoryText.informational
// })

// const strategyClass = computed(() => {
//   return completionStrategyClasses[
//     props.notification.completionStrategy || 'manual'
//   ]
// })

// const strategyLabel = computed(() => {
//   return completionStrategyText[
//     props.notification.completionStrategy || 'manual'
//   ]
// })

// 基於 displayMode 的樣式配置
const modeConfig = computed(() => {
  switch (props.displayMode) {
    case 'toast':
      return {
        containerClass: 'flex gap-2 p-2 rounded-md border max-w-sm',
        iconSize: 'h-4 w-4',
        showDetails: false,
        showActions: false,
        compact: true,
      }
    case 'badge':
      return {
        containerClass:
          'flex gap-2 p-2 rounded-lg border hover:bg-gray-50 transition-colors',
        iconSize: 'h-4 w-4',
        showDetails: false,
        showActions: false,
        compact: true,
      }
    case 'modal':
      return {
        containerClass: 'flex gap-4 p-4 rounded-lg border',
        iconSize: 'h-6 w-6',
        showDetails: true,
        showActions: true,
        compact: false,
      }
    case 'list':
    default:
      return {
        containerClass:
          'group relative flex gap-3 rounded-lg border p-4 transition-all duration-200 hover:shadow-md cursor-pointer',
        iconSize: 'h-5 w-5',
        showDetails: true,
        showActions: true,
        compact: false,
      }
  }
})

const groupTypeText = computed(() => {
  if (props.notification.isPersonal) return ''

  switch (props.notification.targetType) {
    case 'role':
      return '角色通知'
    case 'broadcast':
      return '廣播通知'
    case 'custom':
      return '群組通知'
    default:
      return '群組通知'
  }
})

// 事件處理
const handleNotificationClick = () => {
  emit('cardClick', props.notification)
}

// const markAsRead = async () => {
//   loading.value = true
//   try {
//     emit('markAsRead', props.notification.id)
//   } finally {
//     loading.value = false
//   }
// }

// const markAsUnread = async () => {
//   loading.value = true
//   try {
//     emit('markAsUnread', props.notification.id)
//   } finally {
//     loading.value = false
//   }
// }

const markAsCompleted = async () => {
  loading.value = true
  try {
    emit('markAsCompleted', props.notification.id)
  } finally {
    loading.value = false
  }
}

const markAsDismissed = async () => {
  loading.value = true
  try {
    emit('markAsDismissed', props.notification.id)
  } finally {
    loading.value = false
  }
}

const acceptSuggestion = async () => {
  loading.value = true
  try {
    emit('acceptSuggestion', props.notification.id)
  } finally {
    loading.value = false
  }
}

const dismissSuggestion = async () => {
  loading.value = true
  try {
    emit('dismissSuggestion', props.notification.id)
  } finally {
    loading.value = false
  }
}

const archiveNotification = async () => {
  loading.value = true
  try {
    emit('archive', props.notification.id)
  } finally {
    loading.value = false
  }
}

// const deleteNotification = async () => {
//   loading.value = true
//   try {
//     emit('delete', props.notification.id)
//   } finally {
//     loading.value = false
//   }
// }

const goToAction = () => {
  if (hasActionUrl.value) {
    window.open(props.notification.actionUrl, '_blank', 'noopener,noreferrer')
  }
}

const copyNotification = async () => {
  try {
    await navigator.clipboard.writeText(
      `${props.notification.title}\n${props.notification.message}`,
    )
    toast.success('已複製: 通知內容已複製到剪貼簿')
  } catch (_err) {
    toast.error('複製失敗: 無法複製到剪貼簿')
  }
}
</script>

<template>
  <div :class="[
    'group relative w-full overflow-hidden rounded-lg border bg-white transition-shadow duration-200 hover:shadow-lg',
    notification.status === 'unread'
      ? 'bg-blue-50/50'
      : '',
  ]" data-testid="notification-card">
    <!-- 點擊覆蓋層 -->
    <div class="absolute inset-0 z-0 cursor-pointer" @click="handleNotificationClick" />

    <!-- 內容容器 (z-index 高於覆蓋層) -->
    <div class="relative z-10 flex gap-4 p-4">
      <!-- 左側: 時間軸 & 圖標 -->
      <div class="relative z-10 flex-shrink-0">
        <!-- 時間軸線 (背景) -->
        <!-- <div class="absolute left-5 top-0 h-full w-0.5 bg-gray-200" /> -->
        <!-- 圖標 -->
        <div :class="[
          'relative mt-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white',
          getPriorityIconClass(notification.priority),
        ]">
          <component :is="notificationIcon" class="h-5 w-5" />
        </div>
      </div>

      <!-- 右側: 主要內容區 -->
      <div class="min-w-0 flex-1">
        <!-- 標頭區: 標題, 優先級, 時間, 操作 -->
        <div class="mb-2 flex items-start justify-between gap-2">
          <div class="flex align-center gap-2">
            <h3 :class="[
              'text-base font-semibold text-gray-800',
              hasActionUrl ? 'cursor-pointer hover:underline' : 'cursor-default'
            ]" @click.stop="goToAction">
              {{ notification.title }}
              <ExternalLink v-if="hasActionUrl" class="inline-block ml-1 h-3 w-3 text-gray-400" />
            </h3>
            <!-- 標籤容器 -->
            <div v-if="modeConfig.showDetails" class="flex flex-wrap items-center gap-4 ml-4">
              <!-- <span :class="[
              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              categoryClasses[notification.category] || categoryClasses.informational,
            ]">
              {{ categoryText[notification.category] || categoryText.informational }}
            </span> -->
              <!-- <span v-if="notification.category === 'actionable'" :class="[
                'inline-block rounded-full px-2 py-0.5 text-xs',
                completionStrategyClasses[notification.completionStrategy || 'manual'],
              ]">
                {{ completionStrategyText[notification.completionStrategy || 'manual'] }}
              </span> -->

              <div v-if="!notification.isPersonal" class="flex items-center gap-1">
                <Radio class="h-4.5 w-4.5 text-gray-500" />
                <Badge variant="outline" class="rounded-full px-2 py-0.5 text-xs font-normal text-gray-500">
                  Broadcast
                </Badge>
              </div>

              <div v-if="!notification.isPersonal" class="flex items-center gap-1">
                <!-- <Volume2 v-if="!notification.isPersonal" class="h-4.5 w-4.5 text-gray-500" /> -->
                <Users class="h-4.5 w-4.5 text-gray-500" />
                <Badge variant="outline" class="rounded-full px-2 py-0.5 text-xs font-normal text-gray-500">
                  {{ groupTypeText }}
                </Badge>
              </div>

              <div v-if="notification.isPersonal" class="flex items-center gap-1">
                <MessageSquareMore class="h-4.5 w-4.5 text-gray-500" />
                <Badge variant="outline" class="rounded-full px-2 py-0.5 text-xs font-normal text-gray-500">
                  個人訊息
                </Badge>
              </div>
            </div>
          </div>

          <div class="flex flex-shrink-0 items-center gap-3">
            <span v-if="notification.priority === 'urgent' || notification.priority === 'high'" :class="[
              'flex items-center gap-1 text-xs font-semibold',
              notification.priority === 'urgent' ? 'text-red-600' : 'text-amber-600',
            ]">
              <AlertTriangle v-if="notification.priority === 'urgent'" class="h-3 w-3" />
              <!-- <Siren v-if="notification.priority === 'urgent'" class="h-3 w-3" /> -->
              <ArrowUp v-else class="h-3 w-3" />
              {{ priorityText[notification.priority] }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatRelativeTime(notification.createdAt) }}
            </span>
          </div>
        </div>

        <!-- 內容區: 訊息 & 分類標籤 -->
        <div class="mb-3">
          <p class="mb-3 text-sm tracking-wide text-gray-600 max-w-xl">
            {{ notification.message }}
          </p>
          <!-- 標籤容器 -->
          <div v-if="modeConfig.showDetails" class="flex flex-wrap items-center gap-2 p-2">
            <!-- <span :class="[
              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              categoryClasses[notification.category] || categoryClasses.informational,
            ]">
              {{ categoryText[notification.category] || categoryText.informational }}
            </span> -->
            <span v-if="notification.category === 'actionable'" :class="[
              'inline-block rounded-full px-2 py-0.5 text-xs',
              completionStrategyClasses[notification.completionStrategy || 'manual'],
            ]">
              {{ completionStrategyText[notification.completionStrategy || 'manual'] }}
            </span>
            <span v-if="!notification.isPersonal"
              class="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
              {{ groupTypeText }}
            </span>
          </div>
        </div>

        <!-- 智能建議區 (新) -->
        <div v-if="notification.completionStrategy === 'suggested'"
          class="mt-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/80 p-3 shadow-inner">
          <div class="flex items-start gap-3">
            <div class="rounded-lg bg-amber-100 p-2">
              <Lightbulb class="h-5 w-5 text-amber-600" />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="font-semibold text-amber-900">智能建議</h4>
              <p class="mb-2 text-sm text-amber-800">
                {{ notification.suggestionReason }}
              </p>
              <div class="flex items-center gap-2">
                <Button size="sm" variant="default" class="bg-amber-600 text-white shadow-sm hover:bg-amber-700"
                  @click.stop="acceptSuggestion" :disabled="loading">
                  <CheckCircle class="mr-1 h-4 w-4" />
                  接受建議
                </Button>
                <Button size="sm" variant="outline" class="border-amber-300 bg-white text-amber-700 hover:bg-amber-50"
                  @click.stop="dismissSuggestion" :disabled="loading">
                  <X class="mr-1 h-4 w-4" />
                  拒絕
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作區: 按鈕 -->
        <div v-if="modeConfig.showActions" class="flex items-center justify-between border-t border-gray-200/80 pt-3">
          <div class="flex items-center gap-2">
            <!-- Primary Actions -->
            <div class="flex items-center gap-2">
              <span :class="[
                'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                categoryClasses[notification.category] || categoryClasses.informational,
              ]">
                {{ categoryText[notification.category] || categoryText.informational }}
              </span>

              <!-- 通知模板資訊 Tooltip -->
              <TooltipProvider v-if="templateInfo">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <div class="flex items-center gap-1 cursor-help">
                      <Badge variant="secondary" class="px-2 py-0.5 text-xs font-normal">
                        {{ templateInfo.entityType }}
                      </Badge>
                      <Info class="h-3 w-3 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" class="max-w-xs">
                    <div class="space-y-1 text-sm">
                      <p class="font-semibold">{{ templateInfo.name }}</p>
                      <p class="text-gray-500">類型: {{ notification.type }}</p>
                      <p class="text-gray-500">實體: {{ templateInfo.entityType }}</p>
                      <p v-if="templateInfo.description" class="text-gray-400 text-xs">
                        {{ templateInfo.description }}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button v-if="notification.category === 'actionable' && notification.status !== 'completed'"
              variant="outline" size="sm" @click.stop="markAsCompleted" :disabled="loading">
              <ListChecks class="mr-1 h-4 w-4" />
              完成
            </Button>
            <Button v-if="notification.category === 'informational' && notification.status !== 'dismissed'"
              variant="outline" size="sm" @click.stop="markAsDismissed" :disabled="loading">
              <MailOpen class="mr-1 h-4 w-4" />
              知悉
            </Button>
            <!-- Secondary Actions -->
            <Button v-if="notification.status === 'completed' || notification.status === 'dismissed'" variant="ghost"
              size="sm" @click.stop="archiveNotification" :disabled="loading">
              <Archive class="mr-1 h-4 w-4" />
              歸檔
            </Button>
          </div>

          <div class="flex items-center gap-1">
            <!-- Copy Button -->
            <Button variant="ghost" size="sm" @click.stop="copyNotification" :disabled="loading" title="複製通知內容">
              <Copy class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
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
