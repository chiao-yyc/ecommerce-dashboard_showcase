import { QueryClient } from '@tanstack/vue-query'

/**
 * Vue Query 配置
 * 針對 Dashboard 資料優化的快取策略
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dashboard 資料通常不會頻繁變動，設定較長的 stale time
      staleTime: 5 * 60 * 1000, // 5 分鐘
      gcTime: 10 * 60 * 1000, // 10 分鐘 (舊版的 cacheTime)

      // 啟用背景重新驗證
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,

      // 重試策略
      retry: (failureCount, error) => {
        // 如果是權限錯誤，不要重試
        if (
          error?.message?.includes('permission') ||
          error?.message?.includes('unauthorized')
        ) {
          return false
        }
        // 最多重試 2 次
        return failureCount < 2
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Mutation 的重試策略
      retry: 1,
      retryDelay: 1000,
    },
  },
})

/**
 * Query Keys 工廠函數
 * 統一管理所有 query keys，避免衝突和錯誤
 */
export const queryKeys = {
  // Customer 相關
  customer: {
    all: ['customer'] as const,
    rfmMetrics: () => [...queryKeys.customer.all, 'rfm-metrics'] as const,
    ltvMetrics: () => [...queryKeys.customer.all, 'ltv-metrics'] as const,
    combinedMetrics: () =>
      [...queryKeys.customer.all, 'combined-metrics'] as const,
    overview: () => [...queryKeys.customer.all, 'overview'] as const,
    rfmOverview: () => [...queryKeys.customer.all, 'rfm-overview'] as const,
    ltvTrend: (startDate?: string, endDate?: string, periodType?: string) =>
      [...queryKeys.customer.all, 'ltv-trend', startDate, endDate, periodType] as const,
  },

  // Order 相關
  order: {
    all: ['order'] as const,
    metrics: () => [...queryKeys.order.all, 'metrics'] as const,
    hourlyMetrics: () => [...queryKeys.order.all, 'hourly-metrics'] as const,
    statusDistribution: () =>
      [...queryKeys.order.all, 'status-distribution'] as const,
    amountHistogram: () =>
      [...queryKeys.order.all, 'amount-histogram'] as const,
    productSalesDaily: () =>
      [...queryKeys.order.all, 'product-sales-daily'] as const,
    customerPurchaseSummary: () =>
      [...queryKeys.order.all, 'customer-purchase-summary'] as const,
  },

  // Revenue 相關
  revenue: {
    all: ['revenue'] as const,
    byPeriod: (period: string) =>
      [...queryKeys.revenue.all, 'by-period', period] as const,
    byCampaign: () => [...queryKeys.revenue.all, 'by-campaign'] as const,
    ltvDistribution: () =>
      [...queryKeys.revenue.all, 'ltv-distribution'] as const,
    campaigns: () => [...queryKeys.revenue.all, 'campaigns'] as const,
    hourlyMetrics: () => [...queryKeys.revenue.all, 'hourly-metrics'] as const,
    heatmapData: () => [...queryKeys.revenue.all, 'heatmap-data'] as const,
  },

  // Support 相關
  support: {
    all: ['support'] as const,
    overview: (period?: any, filters?: any) => 
      [...queryKeys.support.all, 'overview', period, filters] as const,
    dailySummary: (period?: any) => 
      [...queryKeys.support.all, 'daily-summary', period] as const,
    hourlyHeatmap: () => 
      [...queryKeys.support.all, 'hourly-heatmap'] as const,
    agentMetrics: () => [...queryKeys.support.all, 'agent-metrics'] as const,
    responseTimePercentiles: () =>
      [...queryKeys.support.all, 'response-time-percentiles'] as const,
    agentStatusDistribution: () =>
      [...queryKeys.support.all, 'agent-status-distribution'] as const,
    conversationStatusDistribution: () =>
      [...queryKeys.support.all, 'conversation-status-distribution'] as const,
    responseTimeTrends: (period?: any) => 
      [...queryKeys.support.all, 'response-time-trends', period] as const,
    dailyConversationMetrics: () =>
      [...queryKeys.support.all, 'daily-conversation-metrics'] as const,
    conversationHeatmap: () =>
      [...queryKeys.support.all, 'conversation-heatmap'] as const,
    hourlyConversationTrend: () =>
      [...queryKeys.support.all, 'hourly-conversation-trend'] as const,
  },

  // Business Health 相關 (新增的洞察驅動查詢)
  businessHealth: {
    all: ['business-health'] as const,
    overview: () => [...queryKeys.businessHealth.all, 'overview'] as const,
    customerActions: () =>
      [...queryKeys.businessHealth.all, 'customer-actions'] as const,
    operationalEfficiency: () =>
      [...queryKeys.businessHealth.all, 'operational-efficiency'] as const,
    riskAlerts: () => [...queryKeys.businessHealth.all, 'risk-alerts'] as const,
    riskTrends: () => [...queryKeys.businessHealth.all, 'risk-trends'] as const,
    riskForecast: () => [...queryKeys.businessHealth.all, 'risk-forecast'] as const,
    revenueKPIs: () => [...queryKeys.businessHealth.all, 'revenue-kpis'] as const,
    // Phase 1: 新增警示系統查詢
    dashboardAlerts: (severity?: string) =>
      [...queryKeys.businessHealth.all, 'dashboard-alerts', severity] as const,
    alertCheck: () => [...queryKeys.businessHealth.all, 'alert-check'] as const,
    // Phase 1.5: 統合三區塊查詢
    unifiedContent: () => [...queryKeys.businessHealth.all, 'unified-content'] as const,
    refreshAlerts: () => [...queryKeys.businessHealth.all, 'refresh-alerts'] as const,
    // Phase 3: 歷史趨勢查詢
    trends: (weeks: number) => [...queryKeys.businessHealth.all, 'trends', weeks] as const,
    // Phase 3.5: 效率趨勢查詢
    efficiencyTrends: (weeks: number) => [...queryKeys.businessHealth.all, 'efficiency-trends', weeks] as const,
  },

  // Campaign Analytics 相關
  campaignAnalytics: {
    all: ['campaign-analytics'] as const,
    overview: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.campaignAnalytics.all, 'overview', dateRange] as const,
    attribution: (filters?: any) =>
      [...queryKeys.campaignAnalytics.all, 'attribution', filters] as const,
    collaboration: () =>
      [...queryKeys.campaignAnalytics.all, 'collaboration'] as const,
    overlap: (dateRange?: { start: string; end: string }) =>
      [...queryKeys.campaignAnalytics.all, 'overlap', dateRange] as const,
    rules: () => [...queryKeys.campaignAnalytics.all, 'rules'] as const,
    trends: (campaignId?: string, dateRange?: { start: string; end: string }) =>
      [
        ...queryKeys.campaignAnalytics.all,
        'trends',
        campaignId,
        dateRange,
      ] as const,
    roi: (campaignId: string, targetDate?: string) =>
      [
        ...queryKeys.campaignAnalytics.all,
        'roi',
        campaignId,
        targetDate,
      ] as const,
  },

  // Product Analytics 相關
  productAnalytics: {
    all: ['product-analytics'] as const,
    abcAnalysis: (params?: any) =>
      [...queryKeys.productAnalytics.all, 'abc-analysis', params] as const,
    slowMoving: (params?: any) =>
      [...queryKeys.productAnalytics.all, 'slow-moving', params] as const,
    stockAlerts: () =>
      [...queryKeys.productAnalytics.all, 'stock-alerts'] as const,
  },

  // AI Provider 相關 (Phase 2)
  aiProvider: {
    all: ['ai-provider'] as const,
    providers: (activeOnly?: boolean) => 
      [...queryKeys.aiProvider.all, 'providers', activeOnly] as const,
    provider: (providerId?: string) => 
      [...queryKeys.aiProvider.all, 'provider', providerId] as const,
    models: (providerId?: string, activeOnly?: boolean) => 
      [...queryKeys.aiProvider.all, 'models', providerId, activeOnly] as const,
    useCases: (activeOnly?: boolean) => 
      [...queryKeys.aiProvider.all, 'use-cases', activeOnly] as const,
    useCase: (useCaseName?: string) => 
      [...queryKeys.aiProvider.all, 'use-case', useCaseName] as const,
    healthCheck: (providerName?: string) => 
      [...queryKeys.aiProvider.all, 'health-check', providerName] as const,
    optimal: (useCaseName?: string, options?: any) => 
      [...queryKeys.aiProvider.all, 'optimal', useCaseName, options] as const,
    systemStatus: () => 
      [...queryKeys.aiProvider.all, 'system-status'] as const,
    analytics: (dateRange?: any) => 
      [...queryKeys.aiProvider.all, 'analytics', dateRange] as const,
    costOptimization: () => 
      [...queryKeys.aiProvider.all, 'cost-optimization'] as const,
    validation: (providerName?: string, environment?: string) => 
      [...queryKeys.aiProvider.all, 'validation', providerName, environment] as const,
    logs: (filters?: any, limit?: number) => 
      [...queryKeys.aiProvider.all, 'logs', filters, limit] as const,
  },
} as const

/**
 * 常用的快取失效工具函數
 */
export const queryInvalidation = {
  // 讓所有 customer 相關查詢失效
  invalidateCustomerQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customer.all })
  },

  // 讓所有 order 相關查詢失效
  invalidateOrderQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.order.all })
  },

  // 讓所有 revenue 相關查詢失效
  invalidateRevenueQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.revenue.all })
  },

  // 讓所有 support 相關查詢失效
  invalidateSupportQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.support.all })
  },

  // 讓所有 risk 相關查詢失效
  invalidateRiskQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.businessHealth.all })
  },

  // 讓所有 campaign analytics 相關查詢失效
  invalidateCampaignAnalyticsQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.campaignAnalytics.all })
  },

  // 讓所有 product analytics 相關查詢失效
  invalidateProductAnalyticsQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.productAnalytics.all })
  },

  // 讓所有 AI provider 相關查詢失效
  invalidateAIProviderQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.aiProvider.all })
  },

  // 讓所有快取失效（謹慎使用）
  invalidateAllQueries: () => {
    queryClient.invalidateQueries()
  },
}
