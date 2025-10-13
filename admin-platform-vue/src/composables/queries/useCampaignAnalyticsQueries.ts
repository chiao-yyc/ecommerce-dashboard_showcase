import { useQuery } from '@tanstack/vue-query'
import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { queryKeys } from '@/lib/queryClient'
import { defaultServiceFactory } from '@/api/services'
import type {
  CampaignAnalyticsOverview,
  AttributionAnalysis,
  CollaborationAnalysis,
  OverlapCalendar,
  AttributionRulesSummary,
} from '@/types/campaignAnalytics'

/**
 * Campaign Analytics 專用的 Query Hooks
 * 使用 Vue Query 管理活動分析相關資料的快取和狀態
 * Phase 1: 基於現有分析視圖的零資料表擴展
 *
 * 架構更新：使用 ServiceFactory 依賴注入模式，提升測試友善性和環境隔離
 */

const apiService = defaultServiceFactory.getCampaignAnalyticsService()

/**
 * 獲取活動分析總覽數據
 */
export function useCampaignAnalyticsOverview(
  dateRange?: MaybeRefOrGetter<{ start: string; end: string } | undefined>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.campaignAnalytics.overview(toValue(dateRange)),
    ),
    queryFn: async (): Promise<CampaignAnalyticsOverview> => {
      const response = await apiService.getCampaignAnalyticsOverview(
        toValue(dateRange),
      )
      if (!response.success || !response.data) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取活動分析總覽失敗'
        throw new Error(errorMsg)
      }
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    refetchOnWindowFocus: false,
  })
}

/**
 * 獲取活動歸因分析數據
 */
export function useCampaignAttributionAnalysis(
  filters?: MaybeRefOrGetter<
    | {
        startDate?: string
        endDate?: string
        layers?: string[]
        campaignTypes?: string[]
      }
    | undefined
  >,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.campaignAnalytics.attribution(toValue(filters)),
    ),
    queryFn: async (): Promise<AttributionAnalysis[]> => {
      const response = await apiService.getAttributionAnalysis(toValue(filters))
      if (!response.success) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取歸因分析失敗'
        throw new Error(errorMsg)
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * 獲取活動協作效果分析
 * Phase 1 限制: 視圖沒有日期欄位，dateRange 參數被忽略，分析所有歷史資料
 */
export function useCampaignCollaborationAnalysis(
  dateRange?: MaybeRefOrGetter<{ start: string; end: string } | undefined>,
) {
  return useQuery({
    queryKey: computed(() => [
      'campaign-analytics',
      'collaboration',
      toValue(dateRange),
    ]),
    queryFn: async (): Promise<CollaborationAnalysis[]> => {
      const response = await apiService.getCollaborationAnalysis(
        toValue(dateRange),
      )
      if (!response.success) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取協作分析失敗'
        throw new Error(errorMsg)
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

/**
 * 獲取活動重疊日曆數據
 */
export function useCampaignOverlapCalendar(
  dateRange?: MaybeRefOrGetter<{ start: string; end: string } | undefined>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.campaignAnalytics.overlap(toValue(dateRange)),
    ),
    queryFn: async (): Promise<OverlapCalendar[]> => {
      const response = await apiService.getOverlapCalendar(toValue(dateRange))
      if (!response.success) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取重疊日曆分析失敗'
        throw new Error(errorMsg)
      }
      return response.data || []
    },
    staleTime: 10 * 60 * 1000, // 10分鐘，日曆數據更新頻率較低
    refetchOnWindowFocus: false,
  })
}

/**
 * 獲取歸因規則總結
 */
export function useCampaignAttributionRules() {
  return useQuery({
    queryKey: queryKeys.campaignAnalytics.rules(),
    queryFn: async (): Promise<AttributionRulesSummary> => {
      const response = await apiService.getAttributionRulesSummary()
      if (!response.success || !response.data) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取歸因規則總結失敗'
        throw new Error(errorMsg)
      }
      return response.data
    },
    staleTime: 15 * 60 * 1000, // 15分鐘，規則數據較穩定
    refetchOnWindowFocus: false,
  })
}

/**
 * 獲取活動效果趨勢數據
 */
export function useCampaignPerformanceTrends(
  campaignId?: MaybeRefOrGetter<string | undefined>,
  dateRange?: MaybeRefOrGetter<{ start: string; end: string } | undefined>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.campaignAnalytics.trends(
        toValue(campaignId),
        toValue(dateRange),
      ),
    ),
    queryFn: async (): Promise<any[]> => {
      const response = await apiService.getCampaignPerformanceTrends(
        toValue(campaignId),
        toValue(dateRange),
      )
      if (!response.success) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取活動趨勢分析失敗'
        throw new Error(errorMsg)
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // 總是啟用查詢，API 方法支持不傳 campaignId 的情況
  })
}

/**
 * 計算特定活動的 ROI
 */
export function useCampaignROICalculation(
  campaignId: string,
  targetDate?: string,
) {
  return useQuery({
    queryKey: queryKeys.campaignAnalytics.roi(campaignId, targetDate),
    queryFn: async () => {
      const response = await apiService.calculateCampaignROI(
        campaignId,
        targetDate,
      )
      if (!response.success || !response.data) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '計算活動 ROI 失敗'
        throw new Error(errorMsg)
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2分鐘，ROI 計算較為即時
    refetchOnWindowFocus: false,
    enabled: !!campaignId,
  })
}

/**
 * 獲取層級效果分析數據
 */
export function useCampaignLayerPerformance(
  filters?: MaybeRefOrGetter<
    | {
        startDate?: string
        endDate?: string
      }
    | undefined
  >,
) {
  return useQuery({
    queryKey: computed(() => [
      'campaign-analytics',
      'layer-performance',
      toValue(filters),
    ]),
    queryFn: async () => {
      const response = await apiService.getLayerPerformanceAnalysis(
        toValue(filters),
      )
      if (!response.success) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取層級效果分析失敗'
        throw new Error(errorMsg)
      }
      return response.data || []
    },
    staleTime: 5 * 60 * 1000, // 5分鐘
    refetchOnWindowFocus: false,
  })
}

/**
 * 獲取可用的歸因層級列表
 */
export function useCampaignAvailableLayers() {
  return useQuery({
    queryKey: ['campaign-analytics', 'available-layers'],
    queryFn: async () => {
      const response = await apiService.getAvailableLayers()
      if (!response.success) {
        const errorMsg =
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || '獲取可用層級列表失敗'
        throw new Error(errorMsg)
      }
      return response.data || []
    },
    staleTime: 30 * 60 * 1000, // 30分鐘，層級列表變化較少
    refetchOnWindowFocus: false,
  })
}
