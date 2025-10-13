import type { User } from '@/types/user'

// ================================================================================
// 通知分類與策略
// ================================================================================

/**
 * 通知分類
 */
export enum NotificationCategory {
  INFORMATIONAL = 'informational', // 資訊推送：只需知悉，閱讀後可忽略
  ACTIONABLE = 'actionable', // 任務管理：需要處理，完成後可標記
}

/**
 * 完成標記策略（三層機制）
 */
export enum CompletionStrategy {
  AUTO = 'auto', // 自動完成：明確系統狀態變更
  SUGGESTED = 'suggested', // 智能建議：系統檢測變更並建議，用戶確認
  MANUAL = 'manual', // 純手動：用戶完全控制標記時機
}

// ================================================================================
// 群組通知相關類型
// ================================================================================

/**
 * 通知目標類型
 */
export enum NotificationTargetType {
  USER = 'user', // 單一用戶
  ROLE = 'role', // 角色群組
  BROADCAST = 'broadcast', // 全體廣播
  CUSTOM = 'custom', // 自定義群組
}

// 核心通知類型枚舉（編譯時類型安全）
export enum NotificationType {
  // ✅ Phase 0: 已實現模板 (資料庫中已存在)
  ORDER_NEW = 'order_new',
  ORDER_HIGH_VALUE = 'order_high_value',
  INVENTORY_LOW_STOCK = 'inventory_low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory_out_of_stock',
  CUSTOMER_SERVICE_NEW_REQUEST = 'customer_service_new_request',
  CUSTOMER_SERVICE_URGENT = 'customer_service_urgent',
  SECURITY_PERMISSION_CHANGED = 'security_permission_changed',

  // 🚀 Phase 1: 立即可實現 (有觸發器支援)
  INVENTORY_OVERSTOCK = 'inventory_overstock',
  CUSTOMER_SERVICE_OVERDUE = 'customer_service_overdue',
  ORDER_CANCELLED = 'order_cancelled',

  // ⏳ Phase 2: 基礎業務邏輯 (未來實現)
  // ORDER_PAYMENT_OVERDUE = 'order_payment_overdue',
  // ORDER_PAYMENT_FAILED = 'order_payment_failed',
  // ORDER_SHIPPING_DELAYED = 'order_shipping_delayed',
  // CUSTOMER_VIP_ISSUE = 'customer_vip_issue',
  // FINANCE_REFUND_REQUEST = 'finance_refund_request',
  // FINANCE_REFUND_COMPLETED = 'finance_refund_completed',

  // 🔒 Phase 3: 安全監控 (未來實現)
  // SECURITY_UNUSUAL_LOGIN = 'security_unusual_login',
  // SECURITY_PASSWORD_REMINDER = 'security_password_reminder',
  // SECURITY_MULTIPLE_LOGIN_FAILURES = 'security_multiple_login_failures',

  // 💰 Phase 4: 金融風控 (未來實現)
  // FINANCE_LARGE_TRANSACTION = 'finance_large_transaction',
  // FINANCE_PAYMENT_ANOMALY = 'finance_payment_anomaly',

  // 📊 Phase 5: 分析系統 (未來實現)
  // ANALYTICS_SALES_TARGET_REACHED = 'analytics_sales_target_reached',
  // ANALYTICS_PERFORMANCE_DROP = 'analytics_performance_drop',
  // ANALYTICS_HOT_PRODUCT = 'analytics_hot_product',
  // ANALYTICS_CUSTOMER_CHURN_RISK = 'analytics_customer_churn_risk',

  // 📢 Phase 6: 行銷自動化 (未來實現)
  // MARKETING_CAMPAIGN_START = 'marketing_campaign_start',
  // MARKETING_CAMPAIGN_END = 'marketing_campaign_end',
  // MARKETING_CAMPAIGN_POOR_PERFORMANCE = 'marketing_campaign_poor_performance',

  // 🔧 Phase 7: 系統運維 (未來實現)
  // SYSTEM_BACKUP_COMPLETED = 'system_backup_completed',
  // SYSTEM_UPDATE_REQUIRED = 'system_update_required',
  // SYSTEM_HEALTH_CHECK = 'system_health_check',
  // SYSTEM_ERROR_ALERT = 'system_error_alert',
}

// 混合類型：保留核心 enum + 支援動態字串
export type NotificationTypeValue = NotificationType | string

// 通知優先級
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  NORMAL = 'normal', // 添加對應資料庫實際使用的 normal
  HIGH = 'high',
  URGENT = 'urgent',
}

// 通知狀態
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  COMPLETED = 'completed', // 僅用於 ACTIONABLE
  DISMISSED = 'dismissed', // 僅用於 INFORMATIONAL
  ARCHIVED = 'archived',
}

// 通知發送方式
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  TOAST = 'toast',
}

// 關聯實體類型
export enum RelatedEntityType {
  ORDER = 'order',
  PRODUCT = 'product',
  CUSTOMER = 'customer',
  CONVERSATION = 'conversation',
  USER = 'user',
  FINANCE = 'finance',
  SECURITY = 'security',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  SYSTEM = 'system',
}

// 資料庫模型（使用 snake_case）
export interface DbNotification<
  T extends NotificationTypeValue = NotificationTypeValue,
> {
  id: string
  user_id: string
  type: T
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  channels: NotificationChannel[]
  metadata?: Record<string, any>
  related_entity_type: string // 動態類型時無法強制約束
  related_entity_id?: string
  action_url?: string
  expires_at?: string
  read_at?: string
  created_at: string
  updated_at?: string
  // 新增分類和完成策略欄位
  category: NotificationCategory
  completion_strategy: CompletionStrategy
  suggested_complete: boolean
  suggested_at?: string
  suggestion_reason?: string
  auto_completed_at?: string
}

export interface DbNotificationTemplate<
  T extends NotificationTypeValue = NotificationTypeValue,
> {
  id: string
  type: T
  title_template: string
  message_template: string
  default_priority: NotificationPriority
  default_channels: NotificationChannel[]
  required_entity_type: string // 動態類型時無法強制約束
  is_active: boolean
  metadata_schema?: Record<string, any>
  created_at: string
  updated_at?: string
  // 新增分類和完成策略欄位
  category: NotificationCategory
  completion_strategy: CompletionStrategy
}

export interface DbNotificationPreference {
  id: string
  user_id: string
  notification_type: NotificationTypeValue
  channels: NotificationChannel[]
  is_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  frequency_limit?: number // 每小時最多通知次數
  created_at: string
  updated_at?: string
}

export interface DbNotificationLog {
  id: string
  notification_id: string
  channel: NotificationChannel
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  error_message?: string
  sent_at?: string
  delivered_at?: string
  created_at: string
}

// 前端/UI 模型（使用 camelCase）
export interface Notification<
  T extends NotificationTypeValue = NotificationTypeValue,
> {
  id: string
  userId: string
  type: T
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  channels: NotificationChannel[]
  metadata?: Record<string, any>
  relatedEntityType: string // 動態類型時無法強制約束
  relatedEntityId?: string
  actionUrl?: string
  expiresAt?: string
  readAt?: string
  createdAt: string
  updatedAt?: string
  user?: User
  // 新增分類和完成策略欄位
  category: NotificationCategory
  completionStrategy: CompletionStrategy
  suggestedComplete: boolean
  suggestedAt?: string
  suggestionReason?: string
  autoCompletedAt?: string
  // 群組通知相關欄位
  isPersonal: boolean
  distributionId?: string
  targetType?: NotificationTargetType
}

export interface NotificationTemplate<
  T extends NotificationTypeValue = NotificationTypeValue,
> {
  id: string
  type: T
  titleTemplate: string
  messageTemplate: string
  defaultPriority: NotificationPriority
  defaultChannels: NotificationChannel[]
  requiredEntityType: string // 動態類型時無法強制約束
  isActive: boolean
  metadataSchema?: Record<string, any>
  createdAt: string
  updatedAt?: string
  // 新增分類和完成策略欄位
  category: NotificationCategory
  completionStrategy: CompletionStrategy
  // 系統保護欄位
  isSystemRequired?: boolean
}

export interface NotificationPreference {
  id: string
  userId: string
  notificationType: NotificationTypeValue
  channels: NotificationChannel[]
  isEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  frequencyLimit?: number
  createdAt: string
  updatedAt?: string
}

export interface NotificationLog {
  id: string
  notificationId: string
  channel: NotificationChannel
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  errorMessage?: string
  sentAt?: string
  deliveredAt?: string
  createdAt: string
}

// 統計和分析相關類型
export interface NotificationStats {
  totalNotifications: number
  unreadCount: number
  readCount: number
  // 添加前端實際使用的扁平欄位
  completedCount: number
  actionableCount: number
  suggestionsCount: number // 智能建議數量
  byPriority: Record<NotificationPriority, number>
  byType: Record<string, number> // 支援動態類型統計
  byChannel: Record<NotificationChannel, number>
  // 簡化分類統計結構
  byCategory: {
    informational: number
    actionable: number
  }
}

export interface NotificationAnalytics {
  deliveryRate: number
  openRate: number
  clickRate: number
  averageDeliveryTime: number
  failureRate: number
  topNotificationTypes: Array<{
    type: string // 支援動態類型
    count: number
    deliveryRate: number
  }>
}

// 表單和請求相關類型
export interface CreateNotificationRequest<
  T extends NotificationTypeValue = NotificationTypeValue,
> {
  userId: string
  type: T
  title: string
  message: string
  priority?: NotificationPriority
  channels?: NotificationChannel[]
  metadata?: Record<string, any>
  relatedEntityType: string // 動態類型時無法強制約束
  relatedEntityId?: string
  actionUrl?: string
  expiresAt?: string
  // category 和 completionStrategy 由資料庫 trigger 自動從模板繼承，不再需要前端傳遞
}

export interface UpdateNotificationRequest {
  status?: NotificationStatus
  readAt?: string
}

export interface NotificationPreferenceForm {
  notificationType: NotificationTypeValue
  channels: NotificationChannel[]
  isEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  frequencyLimit?: number
}

export interface NotificationTemplateForm<
  T extends NotificationTypeValue = NotificationTypeValue,
> {
  type: T
  titleTemplate: string
  messageTemplate: string
  defaultPriority: NotificationPriority
  defaultChannels: NotificationChannel[]
  requiredEntityType: string // 動態類型時無法強制約束
  isActive: boolean
  metadataSchema?: Record<string, any>
  // 新增分類和完成策略欄位
  category: NotificationCategory
  completionStrategy: CompletionStrategy
}

// 批量操作相關類型
export interface BulkNotificationAction {
  notificationIds: string[]
  action: 'mark_read' | 'mark_unread' | 'archive' | 'delete'
}

export interface NotificationFilter {
  status?: NotificationStatus
  priority?: NotificationPriority
  type?: NotificationTypeValue
  channels?: NotificationChannel[]
  dateFrom?: string
  dateTo?: string
  relatedEntityType?: RelatedEntityType
  userId?: string
  // 新增分類和完成策略篩選
  category?: NotificationCategory
  completionStrategy?: CompletionStrategy
  hasSuggestion?: boolean
  isPersonal?: boolean
}

// 實時通知相關類型
export interface RealtimeNotificationEvent {
  type: 'notification_created' | 'notification_updated' | 'notification_deleted'
  notification: Notification
  userId: string
}

// 通知設置相關類型
export interface NotificationSettings {
  globalEnabled: boolean
  defaultChannels: NotificationChannel[]
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
  maxNotificationsPerHour: number
  preferences: NotificationPreference[]
}

// ================================================================================
// 群組通知系統
// ================================================================================

/**
 * 通知群組定義
 */
export interface NotificationGroup {
  id: string
  name: string
  description?: string
  targetType: NotificationTargetType
  targetCriteria: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

/**
 * 通知分發記錄
 */
export interface NotificationDistribution {
  id: string
  notificationTemplateId?: string
  targetType: NotificationTargetType
  targetId?: string
  targetCriteria: Record<string, any>
  createdAt: string
}

/**
 * 通知接收者記錄
 */
export interface NotificationRecipient {
  id: string
  distributionId: string
  userId: string
  notificationId?: string
  status: 'pending' | 'delivered' | 'failed'
  deliveredAt?: string
  errorMessage?: string
  createdAt: string
}

/**
 * 群組通知創建請求
 */
export interface CreateGroupNotificationRequest {
  type: NotificationTypeValue
  title: string
  message: string
  targetType: NotificationTargetType
  targetCriteria: Record<string, any>
  priority?: NotificationPriority
  category?: NotificationCategory
  completionStrategy?: CompletionStrategy
  metadata?: Record<string, any>
  channels?: NotificationChannel[]
  actionUrl?: string
  expiresAt?: string
}

/**
 * 群組通知統計
 */
export interface NotificationDistributionStats {
  distributionId: string
  targetType: NotificationTargetType
  targetCriteria: Record<string, any>
  totalRecipients: number
  deliveredCount: number
  failedCount: number
  deliveryRate: number
  sentAt: string
  notificationType: NotificationTypeValue
  priority: NotificationPriority
  title?: string
  message?: string
  category?: NotificationCategory
  completionStrategy?: CompletionStrategy
}

/**
 * 統一通知檢視（包含個人和群組通知）
 */
export interface UnifiedNotification {
  id: string
  userId: string
  type: NotificationTypeValue
  title: string
  message: string
  priority: NotificationPriority
  status: NotificationStatus
  category: NotificationCategory
  completionStrategy: CompletionStrategy
  suggestedComplete: boolean
  isPersonal: boolean
  distributionId?: string
  notificationSource: 'personal' | 'role' | 'broadcast' | 'custom' | 'unknown'
  createdAt: string
  readAt?: string
}

/**
 * 角色通知快捷請求
 */
export interface RoleNotificationRequest {
  roleName: string
  type: NotificationTypeValue
  title: string
  message: string
  priority?: NotificationPriority
  actionUrl?: string
}

/**
 * 廣播通知請求
 */
export interface BroadcastNotificationRequest {
  type: NotificationTypeValue
  title: string
  message: string
  priority?: NotificationPriority
  actionUrl?: string
}

/**
 * 群組通知統計概覽
 */
export interface GroupNotificationStats {
  totalDistributions: number
  totalRecipients: number
  averageDeliveryRate: number
  byTargetType: Record<
    NotificationTargetType,
    {
      count: number
      deliveryRate: number
    }
  >
  recentDistributions: NotificationDistributionStats[]
}
