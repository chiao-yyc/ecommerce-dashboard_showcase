// ===================================
// 基礎類別和型別
// ===================================
export { BaseApiService } from './base/BaseApiService'
export type {
  QueryOptions,
  PaginationInfo,
  BaseEntity,
  QueryBuilder,
} from './base/types'

// ===================================
// 展示用服務類別（精選 3 個核心服務）
// ===================================
export { DashboardApiService } from './DashboardApiService'
export { CampaignAnalyticsApiService } from './CampaignAnalyticsApiService'
export {
  NotificationApiService,
  NotificationTemplateApiService,
  NotificationPreferenceApiService,
} from './NotificationApiService'

// ===================================
// 服務工廠（依賴注入核心）
// ===================================
export { ServiceFactory } from './ServiceFactory'

// ===================================
// 預設服務工廠實例
// 展示如何建立和使用 ServiceFactory
// ===================================
import { supabase } from '@/lib/supabase'
import { ServiceFactory } from './ServiceFactory'

export const defaultServiceFactory = new ServiceFactory(supabase)

// ===================================
// 快捷方法範例
// 展示兩種使用模式：
// 1. 工廠模式：透過 defaultServiceFactory 取得服務
// 2. 直接實例化：直接 new 服務類別
// ===================================

// 工廠模式範例
export const getDashboardService = () =>
  defaultServiceFactory.getDashboardService()

export const getCampaignAnalyticsService = () =>
  defaultServiceFactory.getCampaignAnalyticsService()

// 直接實例化範例（通知服務）
import {
  NotificationApiService,
  NotificationTemplateApiService,
  NotificationPreferenceApiService,
} from './NotificationApiService'

export const getNotificationApiService = () =>
  new NotificationApiService(supabase)

export const getNotificationTemplateApiService = () =>
  new NotificationTemplateApiService(supabase)

export const getNotificationPreferenceApiService = () =>
  new NotificationPreferenceApiService(supabase)
