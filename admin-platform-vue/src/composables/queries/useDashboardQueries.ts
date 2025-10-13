import { computed, ref, readonly, type MaybeRefOrGetter, toValue } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { defaultServiceFactory } from '@/api/services'
import type {
  DashboardOverviewData,
  TopProduct,
  SystemAlert,
  ConversionFunnelData,
  BusinessHealthMetrics,
  RevenueTrendData,
  CustomerValueDistribution,
  DashboardFilters,
  UserBehaviorSummary,
  UserBehaviorFunnelData,
  UserBehaviorFunnelSummary,
} from '@/types'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'DashboardQueries')

// Query keys for dashboard
const DASHBOARD_QUERY_KEYS = {
  overview: (filters?: DashboardFilters) => ['dashboard', 'overview', filters],
  topProducts: (limit?: number) => ['dashboard', 'top-products', limit],
  systemAlerts: () => ['dashboard', 'system-alerts'],
  conversionFunnel: () => ['dashboard', 'conversion-funnel'],
  businessHealth: () => ['dashboard', 'business-health'],
  realtimeMetrics: () => ['dashboard', 'realtime-metrics'],
  userBehaviorSummary: () => ['dashboard', 'user-behavior-summary'],
  userBehaviorFunnel: (filters?: { start?: string; end?: string }) => ['dashboard', 'user-behavior-funnel', filters],
  revenueTrend: (
    period?: 'daily' | 'weekly' | 'monthly',
    filters?: DashboardFilters,
  ) => ['dashboard', 'revenue-trend', period, filters],
  customerValueDistribution: () => ['dashboard', 'customer-value-distribution'],
} as const

// 統一快取策略配置
const DASHBOARD_CACHE_CONFIG = {
  // 核心業務數據 - 較短快取時間，較頻繁刷新
  core: {
    staleTime: 3 * 60 * 1000,      // 3分鐘快取
    refetchInterval: 5 * 60 * 1000, // 5分鐘自動刷新
  },
  // 分析數據 - 中等快取時間
  analytics: {
    staleTime: 10 * 60 * 1000,     // 10分鐘快取
    refetchInterval: false,         // 不自動刷新
  },
  // 即時監控數據 - 最短快取時間，最頻繁刷新
  realtime: {
    staleTime: 1 * 60 * 1000,      // 1分鐘快取
    refetchInterval: 2 * 60 * 1000, // 2分鐘自動刷新
  },
  // 參考數據 - 最長快取時間
  reference: {
    staleTime: 15 * 60 * 1000,     // 15分鐘快取
    refetchInterval: false,         // 不自動刷新
  },
} as const

/**
 * Dashboard 查詢相關的 composable
 * 提供儀表板頁面所需的所有數據查詢功能
 */
export function useDashboardQueries() {
  const dashboardService = defaultServiceFactory.getDashboardService()

  /**
   * 儀表板總覽數據查詢
   */
  const useDashboardOverview = (
    filters: MaybeRefOrGetter<DashboardFilters> = {},
  ) => {
    return useQuery({
      queryKey: computed(() => DASHBOARD_QUERY_KEYS.overview(toValue(filters))),
      queryFn: async () => {
        const filterValue = toValue(filters)
        const response = await dashboardService.getOverview(
          filterValue.startDate,
          filterValue.endDate,
        )
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch dashboard overview'
          log.error('Dashboard Overview API Error', {
            error: response.error,
            filters: filterValue
          })
          throw new Error(errorMessage)
        }
        return response.data as DashboardOverviewData
      },
      ...DASHBOARD_CACHE_CONFIG.core,
    })
  }

  /**
   * 熱銷產品排行查詢
   */
  const useTopProducts = (limit: MaybeRefOrGetter<number> = 5) => {
    return useQuery({
      queryKey: computed(() =>
        DASHBOARD_QUERY_KEYS.topProducts(toValue(limit)),
      ),
      queryFn: async () => {
        const response = await dashboardService.getTopProducts(toValue(limit))
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch top products'
          log.error('Top Products API Error', {
            error: response.error,
            limit: toValue(limit)
          })
          throw new Error(errorMessage)
        }
        return response.data as TopProduct[]
      },
      ...DASHBOARD_CACHE_CONFIG.reference,
    })
  }

  /**
   * 系統警報查詢
   */
  const useSystemAlerts = () => {
    return useQuery({
      queryKey: DASHBOARD_QUERY_KEYS.systemAlerts(),
      queryFn: async () => {
        const response = await dashboardService.getSystemAlerts()
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch system alerts'
          log.error('System Alerts API Error', {
            error: response.error
          })
          throw new Error(errorMessage)
        }
        return response.data as SystemAlert[]
      },
      ...DASHBOARD_CACHE_CONFIG.realtime,
    })
  }

  /**
   * 訂單履約漏斗數據查詢
   */
  const useConversionFunnel = () => {
    return useQuery({
      queryKey: DASHBOARD_QUERY_KEYS.conversionFunnel(),
      queryFn: async () => {
        const response = await dashboardService.getConversionFunnel()
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch conversion funnel'
          log.error('Conversion Funnel API Error', {
            error: response.error
          })
          throw new Error(errorMessage)
        }
        return response.data as ConversionFunnelData[]
      },
      ...DASHBOARD_CACHE_CONFIG.analytics,
    })
  }

  /**
   * 用戶行為轉換摘要查詢
   */
  const useUserBehaviorSummary = () => {
    return useQuery({
      queryKey: DASHBOARD_QUERY_KEYS.userBehaviorSummary(),
      queryFn: async () => {
        const response = await dashboardService.getUserBehaviorSummary()
        if (!response.success) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch user behavior summary')
        }
        return response.data as UserBehaviorSummary
      },
      ...DASHBOARD_CACHE_CONFIG.analytics,
    })
  }

  /**
   * 用戶行為漏斗數據查詢
   */
  const useUserBehaviorFunnel = (filters?: MaybeRefOrGetter<{ start?: string; end?: string } | undefined>) => {
    const resolvedFilters = computed(() => toValue(filters))
    
    return useQuery({
      queryKey: computed(() => DASHBOARD_QUERY_KEYS.userBehaviorFunnel(resolvedFilters.value)),
      queryFn: async () => {
        const response = await dashboardService.getUserBehaviorFunnelData(
          resolvedFilters.value?.start,
          resolvedFilters.value?.end
        )
        if (!response.success) {
          throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch user behavior funnel data')
        }
        return response.data as {
          funnelData: UserBehaviorFunnelData[]
          funnelSummary: UserBehaviorFunnelSummary
        }
      },
      ...DASHBOARD_CACHE_CONFIG.analytics,
    })
  }

  /**
   * 業務健康度指標查詢
   */
  const useBusinessHealthMetrics = () => {
    return useQuery({
      queryKey: DASHBOARD_QUERY_KEYS.businessHealth(),
      queryFn: async () => {
        const response = await dashboardService.getBusinessHealthMetrics()
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch business health metrics'
          log.error('Business Health Metrics API Error', {
            error: response.error
          })
          throw new Error(errorMessage)
        }
        return response.data as BusinessHealthMetrics
      },
      ...DASHBOARD_CACHE_CONFIG.analytics,
    })
  }

  /**
   * 營收趨勢數據查詢
   */
  const useRevenueTrend = (
    period: MaybeRefOrGetter<'daily' | 'weekly' | 'monthly'> = 'daily',
    filters: MaybeRefOrGetter<DashboardFilters> = {},
  ) => {
    return useQuery({
      queryKey: computed(() =>
        DASHBOARD_QUERY_KEYS.revenueTrend(toValue(period), toValue(filters)),
      ),
      queryFn: async () => {
        const filterValue = toValue(filters)
        const periodValue = toValue(period)
        const response = await dashboardService.getRevenueTrend(
          periodValue,
          filterValue.startDate,
          filterValue.endDate,
        )
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch revenue trend'
          log.error('Revenue Trend API Error', {
            error: response.error,
            period: periodValue,
            filters: filterValue
          })
          throw new Error(errorMessage)
        }
        return response.data as RevenueTrendData[]
      },
      ...DASHBOARD_CACHE_CONFIG.core,
    })
  }

  /**
   * 客戶價值分佈數據查詢
   */
  const useCustomerValueDistribution = () => {
    return useQuery({
      queryKey: DASHBOARD_QUERY_KEYS.customerValueDistribution(),
      queryFn: async () => {
        const response = await dashboardService.getCustomerValueDistribution()
        if (!response.success) {
          const errorMessage = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to fetch customer value distribution'
          log.error('Customer Value Distribution API Error', {
            error: response.error
          })
          throw new Error(errorMessage)
        }
        return response.data as CustomerValueDistribution[]
      },
      ...DASHBOARD_CACHE_CONFIG.analytics,
    })
  }

  return {
    useDashboardOverview,
    useTopProducts,
    useSystemAlerts,
    useConversionFunnel,
    useBusinessHealthMetrics,
    useUserBehaviorSummary,
    useUserBehaviorFunnel,
    useRevenueTrend,
    useCustomerValueDistribution,
  }
}

/**
 * 合併的儀表板數據查詢
 * 一次性獲取所有必要的儀表板數據
 */
export function useCompleteDashboardData(
  filters: MaybeRefOrGetter<DashboardFilters> = {},
) {
  const {
    useDashboardOverview,
    useTopProducts,
    useSystemAlerts,
    useConversionFunnel,
    useBusinessHealthMetrics,
    useUserBehaviorSummary,
  } = useDashboardQueries()

  const overviewQuery = useDashboardOverview(filters)
  const topProductsQuery = useTopProducts(5)
  const systemAlertsQuery = useSystemAlerts()
  const conversionFunnelQuery = useConversionFunnel()
  const businessHealthQuery = useBusinessHealthMetrics()
  const userBehaviorQuery = useUserBehaviorSummary()

  // 合併載入狀態
  const isLoading = computed(
    () =>
      overviewQuery.isPending.value ||
      topProductsQuery.isPending.value ||
      systemAlertsQuery.isPending.value ||
      conversionFunnelQuery.isPending.value ||
      businessHealthQuery.isPending.value ||
      userBehaviorQuery.isPending.value,
  )

  // 合併錯誤狀態
  const error = computed(
    () =>
      overviewQuery.error.value ||
      topProductsQuery.error.value ||
      systemAlertsQuery.error.value ||
      conversionFunnelQuery.error.value ||
      businessHealthQuery.error.value ||
      userBehaviorQuery.error.value,
  )

  // 檢查是否有任何數據
  const hasData = computed(
    () =>
      overviewQuery.data.value ||
      topProductsQuery.data.value ||
      systemAlertsQuery.data.value ||
      conversionFunnelQuery.data.value ||
      businessHealthQuery.data.value ||
      userBehaviorQuery.data.value,
  )

  // 統一刷新所有查詢
  const refreshAll = async () => {
    await Promise.all([
      overviewQuery.refetch(),
      topProductsQuery.refetch(),
      systemAlertsQuery.refetch(),
      conversionFunnelQuery.refetch(),
      businessHealthQuery.refetch(),
      userBehaviorQuery.refetch(),
    ])
  }

  return {
    // 個別查詢
    overview: overviewQuery,
    topProducts: topProductsQuery,
    systemAlerts: systemAlertsQuery,
    conversionFunnel: conversionFunnelQuery,
    businessHealth: businessHealthQuery,
    userBehaviorSummary: userBehaviorQuery,

    // 合併狀態
    isLoading,
    error,
    hasData,
    refreshAll,

    // 便捷的數據存取
    data: computed(() => ({
      overview: overviewQuery.data.value,
      topProducts: topProductsQuery.data.value || [],
      systemAlerts: systemAlertsQuery.data.value || [],
      conversionFunnel: conversionFunnelQuery.data.value || [],
      businessHealth: businessHealthQuery.data.value,
      userBehaviorSummary: userBehaviorQuery.data.value,
    })),
  }
}

/**
 * 儀表板狀態管理 composable
 * 提供儀表板的狀態管理和操作功能
 */
export function useDashboardState() {
  const filters = ref<DashboardFilters>({
    period: '30d',
  })

  const autoRefresh = ref(false)
  const refreshInterval = ref(10 * 60 * 1000) // 10分鐘

  // 更新篩選條件
  const updateFilters = (newFilters: Partial<DashboardFilters>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // 根據期間設定開始和結束日期
  const computedFilters = computed(() => {
    const now = new Date()
    const period = filters.value.period

    if (period && !filters.value.startDate && !filters.value.endDate) {
      const days =
        {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365,
        }[period] || 30

      return {
        ...filters.value,
        startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        endDate: now.toISOString().split('T')[0],
      }
    }

    return filters.value
  })

  // 切換自動刷新
  const toggleAutoRefresh = () => {
    autoRefresh.value = !autoRefresh.value
  }

  // 設定刷新間隔
  const setRefreshInterval = (interval: number) => {
    refreshInterval.value = interval
  }

  // 重置篩選器
  const resetFilters = () => {
    filters.value = { period: '30d' }
  }

  return {
    filters: readonly(filters),
    computedFilters,
    autoRefresh: readonly(autoRefresh),
    refreshInterval: readonly(refreshInterval),
    updateFilters,
    toggleAutoRefresh,
    setRefreshInterval,
    resetFilters,
  }
}
