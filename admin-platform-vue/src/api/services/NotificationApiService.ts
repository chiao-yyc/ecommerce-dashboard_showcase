import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseApiService } from './base/BaseApiService'
import type {
  Notification,
  DbNotification,
  NotificationTemplate,
  DbNotificationTemplate,
  NotificationTemplateForm,
  NotificationPreference,
  DbNotificationPreference,
  // NotificationLog,
  // DbNotificationLog,
  NotificationStats,
  BulkNotificationAction,
  NotificationFilter,
  CreateNotificationRequest,
  // UpdateNotificationRequest,
  NotificationCategory,
  // NotificationStatus,
  // NotificationPriority,
} from '@/types'
import {
  NotificationType,
  CompletionStrategy,
  NotificationPriority,
  NotificationChannel,
} from '@/types'
import type { ApiResponse, ApiPaginationResponse } from '@/types'
import { createModuleLogger } from '@/utils/logger'
import {
  logNotificationTypeUsage,
  NotificationTypeAuditor,
} from '@/utils/notification/notification-type-monitoring'
import { isValidEntityType } from '@/constants/entity-config'
import { convertToISOString } from '@/utils'

const log = createModuleLogger('API', 'Notification')

/**
 * 通知 API 服務類別
 */
export class NotificationApiService extends BaseApiService<
  Notification,
  DbNotification
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'notifications')
  }

  /**
   * 獲取用戶的通知列表（統一數據源，包含智能建議）
   */
  async getUserNotifications(
    userId: string,
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Notification[]>> {
    try {
      // getUserNotifications called - unified data source

      // 使用統一視圖作為數據源，包含所有通知類型（含智能建議）
      let query = this.supabase
        .from('user_notifications_unified')
        .select('*')
        .eq('user_id', userId)

      // 應用篩選條件
      if (filter.status) {
        query = query.eq('status', filter.status)
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority)
      }
      if (filter.type) {
        query = query.eq('type', filter.type)
      }
      if (filter.relatedEntityType) {
        query = query.eq('related_entity_type', filter.relatedEntityType)
      }
      if (filter.dateFrom) {
        query = query.gte('created_at', filter.dateFrom)
      }
      if (filter.dateTo) {
        query = query.lte('created_at', filter.dateTo)
      }
      // 新增分類和完成策略篩選
      if (filter.category) {
        query = query.eq('category', filter.category)
      }
      if (filter.completionStrategy) {
        query = query.eq('completion_strategy', filter.completionStrategy)
      }
      if (filter.hasSuggestion !== undefined) {
        query = query.eq('suggested_complete', filter.hasSuggestion)
      }

      // 排序：未讀優先，然後按時間倒序
      query = query.order('status', { ascending: true })
      query = query.order('created_at', { ascending: false })

      // 分頁
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        log.error('❌ Database query error:', error)
        throw error
      }

      const notifications = data
        ? data.map((item) => this.mapDbToEntity(item))
        : []

      return {
        success: true,
        data: notifications,
        page,
        perPage: limit,
        count: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      } as any
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: convertToISOString(new Date()),
        })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 標記通知為未讀
   */
  async markAsUnread(
    notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({
          status: 'unread',
          read_at: null,
        })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 歸檔通知
   */
  async archiveNotification(
    notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ status: 'archived' })
        .eq('id', notificationId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量操作通知
   */
  async bulkUpdateNotifications(
    action: BulkNotificationAction,
  ): Promise<ApiResponse<boolean>> {
    try {
      let updateData: any = {}

      switch (action.action) {
        case 'mark_read':
          updateData = {
            status: 'read',
            read_at: convertToISOString(new Date()),
          }
          break
        case 'mark_unread':
          updateData = {
            status: 'unread',
            read_at: null,
          }
          break
        case 'archive':
          updateData = { status: 'archived' }
          break
        case 'delete': {
          const { error: deleteError } = await this.supabase
            .from('notifications')
            .delete()
            .in('id', action.notificationIds)

          if (deleteError) {
            throw deleteError
          }

          return {
            success: true,
            data: true,
          }
        }
      }

      const { error } = await this.supabase
        .from('notifications')
        .update(updateData)
        .in('id', action.notificationIds)

      if (error) {
        throw error
      }

      return {
        success: true,
        data: true,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 標記任務型通知為已完成
   */
  async markAsCompleted(
    notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'mark_notification_completed',
        { p_notification_id: notificationId },
      )

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('通知不存在或無法標記為已完成')
      }

      // 重新取得更新後的通知
      const { data: notification, error: fetchError } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return {
        success: true,
        data: this.mapDbToEntity(notification),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 標記資訊型通知為已知悉
   */
  async markAsDismissed(
    notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'mark_notification_dismissed',
        { p_notification_id: notificationId },
      )

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('通知不存在或無法標記為已知悉')
      }

      // 重新取得更新後的通知
      const { data: notification, error: fetchError } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return {
        success: true,
        data: this.mapDbToEntity(notification),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 接受完成建議
   */
  async acceptCompletionSuggestion(
    notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'accept_completion_suggestion',
        { p_notification_id: notificationId },
      )

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('通知不存在或沒有可接受的建議')
      }

      // 重新取得更新後的通知
      const { data: notification, error: fetchError } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return {
        success: true,
        data: this.mapDbToEntity(notification),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 拒絕完成建議
   */
  async dismissCompletionSuggestion(
    notificationId: string,
  ): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'dismiss_completion_suggestion',
        { p_notification_id: notificationId },
      )

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('通知不存在或沒有可拒絕的建議')
      }

      // 重新取得更新後的通知
      const { data: notification, error: fetchError } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return {
        success: true,
        data: this.mapDbToEntity(notification),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量接受所有建議
   */
  async acceptAllSuggestions(
    userId: string,
  ): Promise<ApiResponse<{ affectedCount: number }>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'accept_all_suggestions',
        { p_user_id: userId },
      )

      if (error) {
        throw error
      }

      return {
        success: true,
        data: { affectedCount: data || 0 },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取通知統計 (直接查詢 user_notifications_unified 視圖)
   */
  async getNotificationStats(
    userId: string,
  ): Promise<ApiResponse<NotificationStats>> {
    try {
      // 直接查詢 user_notifications_unified 視圖（與前端顯示邏輯一致）
      const { data, error } = await this.supabase
        .from('user_notifications_unified')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // 在 TypeScript 中計算統計數據
      const notifications = data || []

      // 按狀態分組計算
      const statusCounts = notifications.reduce(
        (acc, n) => {
          acc[n.status] = (acc[n.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // 按優先級分組計算
      const priorityCounts = notifications.reduce(
        (acc, n) => {
          acc[n.priority] = (acc[n.priority] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // 按分類分組計算
      const categoryCounts = notifications.reduce(
        (acc, n) => {
          const category = n.category || 'informational'
          acc[category] = (acc[category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // 按類型分組計算
      const typeCounts = notifications.reduce(
        (acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const stats: NotificationStats = {
        totalNotifications: notifications.length,
        unreadCount: statusCounts['unread'] || 0,
        readCount: statusCounts['read'] || 0,
        completedCount: statusCounts['completed'] || 0,
        actionableCount: notifications.filter(
          (n) =>
            n.category === 'actionable' &&
            !['completed', 'dismissed', 'archived'].includes(n.status),
        ).length,
        suggestionsCount: notifications.filter(
          (n) => n.suggested_complete === true,
        ).length,

        // 優先級統計
        byPriority: {
          low: priorityCounts['low'] || 0,
          medium: priorityCounts['medium'] || 0,
          normal: priorityCounts['normal'] || 0,
          high: priorityCounts['high'] || 0,
          urgent: priorityCounts['urgent'] || 0,
        },

        // 類型統計
        byType: typeCounts,

        // 頻道統計（根據現有數據結構設定預設值）
        byChannel: {
          in_app: notifications.length, // 大部分通知都是 in-app
          email: 0,
          sms: 0,
          push: 0,
          toast: 0,
        },

        // 分類統計
        byCategory: {
          informational: categoryCounts['informational'] || 0,
          actionable: categoryCounts['actionable'] || 0,
        },
      }

      return {
        success: true,
        data: stats,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量標記所有通知為已讀
   */
  async markAllAsRead(
    userId: string,
  ): Promise<ApiResponse<{ affectedCount: number }>> {
    try {
      const { data, error } = await this.supabase.rpc(
        'mark_all_notifications_read',
        { p_user_id: userId },
      )

      if (error) {
        throw error
      }

      return {
        success: true,
        data: { affectedCount: data || 0 },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取智能建議統計
   */
  async getSuggestionStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase.rpc('get_suggestion_stats', {
        p_user_id: userId,
      })

      if (error) {
        throw error
      }

      if (!data || typeof data !== 'object') {
        return {
          success: true,
          data: {
            totalSuggestions: 0,
            totalNotifications: 0,
            byType: {},
            oldestSuggestion: null,
            newestSuggestion: null,
          },
        }
      }

      // 函數現在直接回傳 JSONB 物件，不是陣列
      // 添加防禦性屬性訪問
      const safeData = data || {}
      return {
        success: true,
        data: {
          totalSuggestions: safeData.total_suggestions || 0,
          totalNotifications: safeData.total_notifications || 0,
          byType: safeData.byType || {},
          oldestSuggestion: safeData.oldestSuggestion || null,
          newestSuggestion: safeData.newestSuggestion || null,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 使用活躍通知檢視獲取用戶通知
   */
  async getUserActiveNotifications(
    userId: string,
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiPaginationResponse<Notification>> {
    try {
      let query = this.supabase
        .from('user_active_notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // 應用篩選條件
      if (filter.status) {
        query = query.eq('status', filter.status)
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority)
      }
      if (filter.type) {
        query = query.eq('type', filter.type)
      }
      if (filter.category) {
        query = query.eq('category', filter.category)
      }
      if (filter.completionStrategy) {
        query = query.eq('completion_strategy', filter.completionStrategy)
      }
      if (filter.hasSuggestion !== undefined) {
        query = query.eq('suggested_complete', filter.hasSuggestion)
      }
      if (filter.isPersonal !== undefined) {
        query = query.eq('is_personal', filter.isPersonal)
      }

      // 分頁
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      const notifications = data?.map((item) => this.mapDbToEntity(item)) || []

      return {
        success: true,
        data: notifications,
        page,
        perPage: limit,
        count: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      }
    } catch (error) {
      return this.handleError(error) as ApiPaginationResponse<Notification>
    }
  }

  /**
   * 獲取建議通知 (已廢棄 - 現在透過 getUserNotifications 統一查詢)
   * @deprecated 請使用 getUserNotifications 搭配篩選條件取得智能建議
   */
  async getSuggestedNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResponse<Notification[]>> {
    // 透過統一方法查詢智能建議通知
    return this.getUserNotifications(
      userId,
      {
        completionStrategy: CompletionStrategy.SUGGESTED,
      },
      page,
      limit,
    )
  }

  /**
   * 搜索通知
   */
  async searchNotifications(
    userId: string,
    searchTerm: string,
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiPaginationResponse<Notification>> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)

      // 應用篩選條件
      if (filter.status) {
        query = query.eq('status', filter.status)
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority)
      }
      if (filter.type) {
        query = query.eq('type', filter.type)
      }
      if (filter.category) {
        query = query.eq('category', filter.category)
      }

      // 排序和分頁
      query = query.order('created_at', { ascending: false })
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      const notifications = data?.map((item) => this.mapDbToEntity(item)) || []

      return {
        success: true,
        data: notifications,
        page,
        perPage: limit,
        count: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0,
      }
    } catch (error) {
      return this.handleError(error) as ApiPaginationResponse<Notification>
    }
  }

  /**
   * 創建新通知
   */
  async createNotification(
    request: CreateNotificationRequest,
  ): Promise<ApiResponse<Notification>> {
    try {
      // 監控通知類型使用
      logNotificationTypeUsage(
        request.type,
        'NotificationApiService.createNotification',
      )

      // 審計日誌記錄
      NotificationTypeAuditor.log({
        type: request.type,
        source: 'frontend',
        action: 'create_notification',
        context: 'API.createNotification',
      })

      const dbNotification: Partial<DbNotification> = {
        user_id: request.userId,
        type: request.type,
        title: request.title,
        message: request.message,
        priority: request.priority || NotificationPriority.MEDIUM,
        channels: request.channels || [NotificationChannel.IN_APP],
        metadata: request.metadata || {},
        related_entity_type: request.relatedEntityType,
        related_entity_id: request.relatedEntityId,
        action_url: request.actionUrl,
        expires_at: request.expiresAt,
        // category 和 completion_strategy 由資料庫 trigger 自動從模板繼承
        // 不再依賴前端傳遞，確保安全性和一致性
        suggested_complete: false,
      }

      const { data, error } = await this.supabase
        .from('notifications')
        .insert(dbNotification)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 搜尋功能實作
   */
  protected applySearch(query: any, search: string): any {
    return query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
  }

  /**
   * 資料庫實體轉換為前端實體
   */
  protected mapDbToEntity(dbEntity: DbNotification): Notification {
    return {
      id: dbEntity.id,
      userId: dbEntity.user_id,
      type: dbEntity.type,
      title: dbEntity.title,
      message: dbEntity.message,
      priority: dbEntity.priority,
      status: dbEntity.status,
      channels: dbEntity.channels,
      metadata: dbEntity.metadata,
      relatedEntityType: dbEntity.related_entity_type,
      relatedEntityId: dbEntity.related_entity_id,
      actionUrl: dbEntity.action_url,
      expiresAt: dbEntity.expires_at,
      readAt: dbEntity.read_at,
      createdAt: dbEntity.created_at,
      updatedAt: dbEntity.updated_at,
      // 新增分類和完成策略欄位
      category: dbEntity.category,
      completionStrategy: dbEntity.completion_strategy,
      suggestedComplete: dbEntity.suggested_complete,
      suggestedAt: dbEntity.suggested_at,
      suggestionReason: dbEntity.suggestion_reason,
      autoCompletedAt: dbEntity.auto_completed_at,
      // 新增群組通知欄位 (來自 joined view，可能不存在於基本表格)
      distributionId: (dbEntity as any).distribution_id,
      isPersonal: (dbEntity as any).is_personal ?? true,
      // 群組通知相關欄位 (來自 joined view)
      targetType: (dbEntity as any).target_type,
    }
  }

  /**
   * 前端實體轉換為資料庫實體
   */
  protected mapEntityToDb(
    entity: Partial<Notification>,
  ): Partial<DbNotification> {
    return {
      id: entity.id,
      user_id: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      priority: entity.priority,
      status: entity.status,
      channels: entity.channels,
      metadata: entity.metadata,
      related_entity_type: entity.relatedEntityType,
      related_entity_id: entity.relatedEntityId,
      action_url: entity.actionUrl,
      expires_at: entity.expiresAt,
      read_at: entity.readAt,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      // 新增分類和完成策略欄位
      category: entity.category,
      completion_strategy: entity.completionStrategy,
      suggested_complete: entity.suggestedComplete,
      suggested_at: entity.suggestedAt,
      suggestion_reason: entity.suggestionReason,
      auto_completed_at: entity.autoCompletedAt,
      // 群組通知相關欄位不在基本表格中，由其他服務處理
    }
  }
}

/**
 * 通知模板 API 服務類別
 */
export class NotificationTemplateApiService extends BaseApiService<
  NotificationTemplate,
  DbNotificationTemplate
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'notification_templates')
  }

  /**
   * 獲取活躍的通知模板
   */
  async getActiveTemplates(): Promise<ApiResponse<NotificationTemplate[]>> {
    return this.findMany({
      filters: { is_active: true },
      orderBy: { field: 'type', ascending: true },
    })
  }

  /**
   * 根據類型獲取模板
   */
  async getTemplateByType(
    type: NotificationType,
  ): Promise<ApiResponse<NotificationTemplate>> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  protected mapDbToEntity(
    dbEntity: DbNotificationTemplate,
  ): NotificationTemplate {
    return {
      id: dbEntity.id,
      type: dbEntity.type,
      titleTemplate: dbEntity.title_template,
      messageTemplate: dbEntity.message_template,
      defaultPriority: dbEntity.default_priority,
      defaultChannels: dbEntity.default_channels,
      isActive: dbEntity.is_active,
      metadataSchema: dbEntity.metadata_schema,
      createdAt: dbEntity.created_at,
      updatedAt: dbEntity.updated_at,
      // 新增約束欄位
      requiredEntityType: (dbEntity as any).required_entity_type,
      category: (dbEntity as any).category,
      completionStrategy: (dbEntity as any).completion_strategy,
      // 系統保護欄位
      isSystemRequired: (dbEntity as any).is_system_required,
    }
  }

  protected mapEntityToDb(
    entity: Partial<NotificationTemplate>,
  ): Partial<DbNotificationTemplate> {
    return {
      id: entity.id,
      type: entity.type,
      title_template: entity.titleTemplate,
      message_template: entity.messageTemplate,
      default_priority: entity.defaultPriority,
      default_channels: entity.defaultChannels,
      is_active: entity.isActive,
      metadata_schema: entity.metadataSchema,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      // 新增約束欄位
      required_entity_type: (entity as any).requiredEntityType,
      category: (entity as any).category,
      completion_strategy: (entity as any).completionStrategy,
    }
  }

  /**
   * 獲取所有模板（管理員使用，不過濾 is_active）
   */
  async getAllTemplatesForAdmin(): Promise<
    ApiPaginationResponse<NotificationTemplate>
  > {
    try {
      const { data, error, count } = await this.supabase
        .from('notification_templates')
        .select('*', { count: 'exact' })
        .order('type', { ascending: true })

      if (error) {
        throw error
      }

      const mappedData = data?.map((item) => this.mapDbToEntity(item)) || []

      return {
        success: true,
        data: mappedData,
        page: 1,
        perPage: mappedData.length,
        count: count || 0,
        totalPages: 1,
      }
    } catch (error) {
      return this.handleError(
        error,
      ) as ApiPaginationResponse<NotificationTemplate>
    }
  }

  /**
   * 更新模板啟用狀態
   */
  async updateTemplateStatus(
    templateId: string,
    isActive: boolean,
  ): Promise<ApiResponse<NotificationTemplate>> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .update({
          is_active: isActive,
          updated_at: convertToISOString(new Date()),
        })
        .eq('id', templateId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 批量更新模板狀態
   */
  async batchUpdateTemplateStatus(
    updates: Array<{ id: string; isActive: boolean }>,
  ): Promise<ApiResponse<{ affectedCount: number }>> {
    try {
      let affectedCount = 0

      for (const update of updates) {
        const { error } = await this.supabase
          .from('notification_templates')
          .update({
            is_active: update.isActive,
            updated_at: convertToISOString(new Date()),
          })
          .eq('id', update.id)

        if (!error) {
          affectedCount++
        }
      }

      return {
        success: true,
        data: { affectedCount },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 按分類獲取活躍模板
   */
  async getActiveTemplatesByCategory(): Promise<
    ApiResponse<{
      byCategory: Record<NotificationCategory, NotificationTemplate[]>
      byType: Record<NotificationType, NotificationTemplate>
      typeOptions: Array<{
        value: NotificationType
        label: string
        description?: string
        category: NotificationCategory
        completionStrategy: CompletionStrategy
        requiredEntityType?: string
      }>
    }>
  > {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })

      if (error) {
        throw error
      }

      const templates = data?.map((item) => this.mapDbToEntity(item)) || []

      // 按分類分組
      const byCategory: Record<NotificationCategory, NotificationTemplate[]> = {
        informational: [],
        actionable: [],
      }

      // 按類型索引
      const byType: Record<NotificationType, NotificationTemplate> = {} as any

      // 類型選項
      const typeOptions: Array<{
        value: NotificationType
        label: string
        description?: string
        category: NotificationCategory
        completionStrategy: CompletionStrategy
        requiredEntityType?: string
      }> = []

      templates.forEach((template) => {
        byCategory[template.category].push(template)
        byType[template.type as NotificationType] = template

        typeOptions.push({
          value: template.type as NotificationType,
          label: template.type,
          description: template.titleTemplate,
          category: template.category,
          completionStrategy: template.completionStrategy,
          requiredEntityType: template.requiredEntityType,
        })
      })

      return {
        success: true,
        data: {
          byCategory,
          byType,
          typeOptions,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 驗證通知類型是否有可用模板
   */
  async validateNotificationType(type: NotificationType): Promise<
    ApiResponse<{
      isValid: boolean
      template?: NotificationTemplate
      errorMessage?: string
    }>
  > {
    try {
      const templateResponse = await this.getTemplateByType(type)

      if (!templateResponse.success) {
        return {
          success: true,
          data: {
            isValid: false,
            errorMessage: `通知類型 "${type}" 沒有對應的模板`,
          },
        }
      }

      return {
        success: true,
        data: {
          isValid: true,
          template: templateResponse.data,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取分類的顯示名稱
   */
  static getCategoryDisplayName(category: NotificationCategory): string {
    return (
      NotificationTemplateApiService.CATEGORY_DISPLAY_NAMES[category] ||
      category
    )
  }

  /**
   * 新增通知模板
   */
  async createTemplate(
    templateData: NotificationTemplateForm,
  ): Promise<ApiResponse<NotificationTemplate>> {
    try {
      // 驗證 entity type
      if (
        templateData.requiredEntityType &&
        !isValidEntityType(templateData.requiredEntityType)
      ) {
        return {
          success: false,
          error: `無效的實體類型: ${templateData.requiredEntityType}`,
        }
      }

      // 檢查模板類型是否已存在
      const { data: existingTemplates, error: checkError } = await this.supabase
        .from('notification_templates')
        .select('id')
        .eq('type', templateData.type)

      if (checkError) {
        throw checkError
      }

      // 如果找到任何記錄，表示類型已存在
      if (existingTemplates && existingTemplates.length > 0) {
        return {
          success: false,
          error: `模板類型 "${templateData.type}" 已存在`,
        }
      }

      // 準備資料庫資料
      const dbData = {
        type: templateData.type,
        title_template: templateData.titleTemplate,
        message_template: templateData.messageTemplate,
        default_priority: templateData.defaultPriority,
        default_channels: templateData.defaultChannels,
        required_entity_type: templateData.requiredEntityType,
        is_active: templateData.isActive,
        category: templateData.category,
        completion_strategy: templateData.completionStrategy,
        metadata_schema: templateData.metadataSchema || {},
        created_at: convertToISOString(new Date()),
        updated_at: convertToISOString(new Date()),
      }

      const { data, error } = await this.supabase
        .from('notification_templates')
        .insert(dbData)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新通知模板
   */
  async updateTemplate(
    id: string,
    templateData: Partial<NotificationTemplateForm>,
  ): Promise<ApiResponse<NotificationTemplate>> {
    try {
      // 驗證 entity type (如果提供)
      if (
        templateData.requiredEntityType &&
        !isValidEntityType(templateData.requiredEntityType)
      ) {
        return {
          success: false,
          error: `無效的實體類型: ${templateData.requiredEntityType}`,
        }
      }

      // 如果更新 type，檢查是否已存在（排除自身）
      if (templateData.type) {
        const { data: existingTemplates, error: checkError } =
          await this.supabase
            .from('notification_templates')
            .select('id')
            .eq('type', templateData.type)
            .neq('id', id)

        if (checkError) {
          throw checkError
        }

        // 如果找到任何記錄，表示類型已存在
        if (existingTemplates && existingTemplates.length > 0) {
          return {
            success: false,
            error: `模板類型 "${templateData.type}" 已存在`,
          }
        }
      }

      // 準備更新資料
      const updateData: any = {
        updated_at: convertToISOString(new Date()),
      }

      // 只更新提供的欄位
      if (templateData.type !== undefined) updateData.type = templateData.type
      if (templateData.titleTemplate !== undefined)
        updateData.title_template = templateData.titleTemplate
      if (templateData.messageTemplate !== undefined)
        updateData.message_template = templateData.messageTemplate
      if (templateData.defaultPriority !== undefined)
        updateData.default_priority = templateData.defaultPriority
      if (templateData.defaultChannels !== undefined)
        updateData.default_channels = templateData.defaultChannels
      if (templateData.requiredEntityType !== undefined)
        updateData.required_entity_type = templateData.requiredEntityType
      if (templateData.isActive !== undefined)
        updateData.is_active = templateData.isActive
      if (templateData.category !== undefined)
        updateData.category = templateData.category
      if (templateData.completionStrategy !== undefined)
        updateData.completion_strategy = templateData.completionStrategy
      if (templateData.metadataSchema !== undefined)
        updateData.metadata_schema = templateData.metadataSchema

      const { data, error } = await this.supabase
        .from('notification_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 分類顯示名稱映射
   */
  static readonly CATEGORY_DISPLAY_NAMES: Record<NotificationCategory, string> =
    {
      informational: '資訊型',
      actionable: '任務型',
    }
}

/**
 * 通知偏好 API 服務類別
 */
export class NotificationPreferenceApiService extends BaseApiService<
  NotificationPreference,
  DbNotificationPreference
> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'notification_preferences')
  }

  /**
   * 獲取用戶的通知偏好
   */
  async getUserPreferences(
    userId: string,
  ): Promise<ApiPaginationResponse<NotificationPreference>> {
    try {
      const { data, error, count } = await this.supabase
        .from('notification_preferences')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('notification_type', { ascending: true })

      if (error) {
        throw error
      }

      const mappedData = data?.map((item) => this.mapDbToEntity(item)) || []

      return {
        success: true,
        data: mappedData,
        page: 1,
        perPage: mappedData.length,
        count: count || 0,
        totalPages: 1,
      }
    } catch (error) {
      return this.handleError(
        error,
      ) as ApiPaginationResponse<NotificationPreference>
    }
  }

  /**
   * 更新用戶的通知偏好
   */
  async updateUserPreference(
    userId: string,
    notificationType: NotificationType,
    preference: Partial<NotificationPreference>,
  ): Promise<ApiResponse<NotificationPreference>> {
    try {
      // 手動映射需要更新的欄位，避免 undefined 值覆蓋
      const upsertData: any = {
        user_id: userId,
        notification_type: notificationType,
      }

      // 只映射實際存在的欄位
      if (preference.isEnabled !== undefined) {
        upsertData.is_enabled = preference.isEnabled
      }
      if (preference.channels !== undefined) {
        upsertData.channels = preference.channels
      }
      if (preference.quietHoursStart !== undefined) {
        upsertData.quiet_hours_start = preference.quietHoursStart
      }
      if (preference.quietHoursEnd !== undefined) {
        upsertData.quiet_hours_end = preference.quietHoursEnd
      }
      if (preference.frequencyLimit !== undefined) {
        upsertData.frequency_limit = preference.frequencyLimit
      }

      const { data, error } = await this.supabase
        .from('notification_preferences')
        .upsert(upsertData, {
          onConflict: 'user_id,notification_type',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        success: true,
        data: this.mapDbToEntity(data),
      }
    } catch (error) {
      log.error('NotificationPreferenceApiService - Error:', error)
      return this.handleError(error)
    }
  }

  protected mapDbToEntity(
    dbEntity: DbNotificationPreference,
  ): NotificationPreference {
    return {
      id: dbEntity.id,
      userId: dbEntity.user_id,
      notificationType: dbEntity.notification_type,
      channels: dbEntity.channels,
      isEnabled: dbEntity.is_enabled,
      quietHoursStart: dbEntity.quiet_hours_start,
      quietHoursEnd: dbEntity.quiet_hours_end,
      frequencyLimit: dbEntity.frequency_limit,
      createdAt: dbEntity.created_at,
      updatedAt: dbEntity.updated_at,
    }
  }

  protected mapEntityToDb(
    entity: Partial<NotificationPreference>,
  ): Partial<DbNotificationPreference> {
    return {
      id: entity.id,
      user_id: entity.userId,
      notification_type: entity.notificationType,
      channels: entity.channels,
      is_enabled: entity.isEnabled,
      quiet_hours_start: entity.quietHoursStart,
      quiet_hours_end: entity.quietHoursEnd,
      frequency_limit: entity.frequencyLimit,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    }
  }
}
