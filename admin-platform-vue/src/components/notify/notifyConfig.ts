import {
  Bell,
  AlertTriangle,
  // CheckCircle, // 未使用
  // Info,
  ShoppingCart,
  Package,
  // MessageCircle,
  // Shield,
  User,
  Clock,
  ConciergeBell,
  type LucideIcon,
} from 'lucide-vue-next'

import type { NotificationType, NotificationPriority } from '@/types'

// 統一的通知圖示映射配置
export const notificationIcons: Record<
  NotificationType | 'default',
  LucideIcon
> = {
  // 訂單相關通知
  order_new: ShoppingCart,
  order_high_value: ShoppingCart,
  // order_payment_overdue: Clock, // 不存在的通知類型
  // order_payment_failed: AlertTriangle, // 不存在的通知類型
  order_cancelled: AlertTriangle,
  // order_shipping_delayed: Package, // 不存在的通知類型

  // 庫存相關通知
  inventory_low_stock: Package,
  inventory_out_of_stock: AlertTriangle,
  inventory_overstock: Package,

  // 客服相關通知
  customer_service_new_request: ConciergeBell,
  customer_service_urgent: ConciergeBell,
  customer_service_overdue: Clock,
  // customer_vip_issue: User, // 不存在的通知類型

  // 財務相關通知
  // finance_large_transaction: AlertTriangle, // 不存在的通知類型
  // finance_payment_anomaly: AlertTriangle, // 不存在的通知類型
  // finance_refund_request: AlertTriangle, // 不存在的通知類型
  // finance_refund_completed: CheckCircle, // 不存在的通知類型

  // 安全相關通知
  // security_unusual_login: AlertTriangle, // 不存在的通知類型
  security_permission_changed: User,
  // security_password_reminder: Clock, // 不存在的通知類型
  // security_multiple_login_failures: AlertTriangle, // 不存在的通知類型

  // 分析相關通知 (不存在的通知類型)
  // analytics_sales_target_reached: CheckCircle,
  // analytics_performance_drop: AlertTriangle,
  // analytics_hot_product: Package,
  // analytics_customer_churn_risk: User,

  // 行銷相關通知 (不存在的通知類型)
  // marketing_campaign_start: Bell,
  // marketing_campaign_end: Bell,
  // marketing_campaign_poor_performance: AlertTriangle,

  // 系統相關通知 (不存在的通知類型)
  // system_backup_completed: CheckCircle,
  // system_update_required: Clock,
  // system_health_check: CheckCircle,
  // system_error_alert: AlertTriangle,

  // 預設圖示
  default: Bell,
}

// 統一的優先級圖示顏色配置（語意化設計系統）
export const priorityIconClasses: Record<NotificationPriority, string> = {
  urgent: 'bg-destructive/10 text-destructive',
  high: 'bg-warning/10 text-warning',
  medium: 'bg-info/10 text-info',
  low: 'bg-secondary/10 text-secondary-foreground',
  normal: 'bg-secondary/10 text-secondary-foreground',
}

// 統一的優先級徽章顏色配置（語意化設計系統）
export const priorityBadgeClasses: Record<NotificationPriority, string> = {
  urgent: 'bg-destructive/10 text-destructive border-destructive/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  medium: 'bg-info/10 text-info border-info/20',
  low: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
  normal: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
}

// 統一的優先級邊框配置（語意化設計系統）
export const priorityBorderClasses: Record<NotificationPriority, string> = {
  urgent: 'border-l-4 border-l-destructive',
  high: 'border-l-4 border-l-warning',
  medium: 'border-l-4 border-l-info',
  low: 'border-l-4 border-l-secondary',
  normal: 'border-l-4 border-l-secondary',
}

// 統一的狀態樣式配置（語意化設計系統）
export const statusClasses = {
  unread: 'bg-card border-info/20 shadow-sm',
  read: 'bg-secondary/5 border-secondary/20',
  completed: 'bg-success/5 border-success/20',
  dismissed: 'bg-secondary/5 border-secondary/20',
} as const

// 統一的分類樣式配置（語意化設計系統）
export const categoryClasses = {
  actionable: 'bg-info/10 text-info',
  informational: 'bg-success/10 text-success',
} as const

// 統一的完成策略樣式配置（語意化設計系統）
export const completionStrategyClasses = {
  auto: 'bg-success/10 text-success',
  suggested: 'bg-warning/10 text-warning',
  manual: 'bg-info/10 text-info',
} as const

// 通知類型語意化顏色映射（使用設計系統色彩）
export const notificationTypeColors: Record<NotificationType, string> = {
  // 訂單相關 - 成功與危險
  order_new: 'bg-success/10 text-success',
  order_high_value: 'bg-destructive/10 text-destructive',
  order_cancelled: 'bg-secondary/10 text-secondary-foreground',
  
  // 庫存相關 - 警告與危險
  inventory_low_stock: 'bg-warning/10 text-warning',
  inventory_out_of_stock: 'bg-destructive/10 text-destructive',
  inventory_overstock: 'bg-warning/10 text-warning',
  
  // 客服相關 - 資訊與危險
  customer_service_new_request: 'bg-info/10 text-info',
  customer_service_urgent: 'bg-destructive/10 text-destructive',
  customer_service_overdue: 'bg-warning/10 text-warning',
  
  // 安全相關 - 資訊
  security_permission_changed: 'bg-info/10 text-info',
}

// 獲取通知圖示的輔助函數
export function getNotificationIcon(type: NotificationType): LucideIcon {
  return notificationIcons[type] || notificationIcons.default
}

// 獲取優先級圖示樣式的輔助函數
export function getPriorityIconClass(priority: NotificationPriority): string {
  return priorityIconClasses[priority]
}

// 獲取優先級徽章樣式的輔助函數
export function getPriorityBadgeClass(priority: NotificationPriority): string {
  return priorityBadgeClasses[priority]
}

// 獲取優先級邊框樣式的輔助函數
export function getPriorityBorderClass(priority: NotificationPriority): string {
  return priorityBorderClasses[priority]
}

// 獲取通知類型特定顏色的輔助函數
export function getNotificationTypeColor(type: NotificationType): string {
  return notificationTypeColors[type] || 'bg-gray-100 text-gray-600'
}

// 優先級文字映射
export const priorityText: Record<NotificationPriority, string> = {
  urgent: '緊急',
  high: '高',
  medium: '中',
  low: '低',
  normal: '正常',
}

// 分類文字映射
export const categoryText = {
  actionable: '任務', // 從「需處理」改為「任務」
  informational: '通知',
} as const

// 完成策略文字映射
export const completionStrategyText = {
  auto: '自動完成',
  suggested: '智能建議',
  manual: '手動完成',
} as const

// 向後相容的別名匯出
export const typeIcons = notificationIcons
export const typeColors = notificationTypeColors
export const priorityStyles = priorityIconClasses
