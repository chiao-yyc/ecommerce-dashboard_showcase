import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseApiService } from './base/BaseApiService'
import type {
  ApiResponse,
  DashboardOverviewData,
  TopProduct,
  SystemAlert,
  ConversionFunnelData,
  BusinessHealthMetrics,
  RevenueTrendData,
  CustomerValueDistribution,
  UserBehaviorSummary,
  UserBehaviorFunnelData,
  UserBehaviorFunnelSummary,
} from '@/types'
import { BusinessHealthAnalyticsService } from './BusinessHealthAnalyticsService'
import { getGlobalRealtimeAlerts } from '@/composables/useRealtimeAlerts'
import { convertToISOString } from '@/utils'
import { formatNumberPrecision, formatPercentagePrecision, formatCurrencyPrecision } from '@/utils/numberPrecision'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('API', 'Dashboard')

/**
 * Dashboard API 服務
 * 提供儀表板概覽頁面所需的各項數據
 */
export class DashboardApiService extends BaseApiService<any, any> {
  constructor(supabase: SupabaseClient) {
    // Dashboard 不需要特定表格，主要使用 functions 和 views
    super(supabase, 'orders') // 暫時使用 orders 作為主表
  }

  /**
   * 獲取儀表板總覽數據
   */
  async getOverview(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<DashboardOverviewData>> {
    try {
      const start =
        startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
      const end = endDate || convertToISOString(new Date()).split('T')[0]

      // 並行調用多個數據源
      const [orderSummary, customerOverview] = await Promise.all([
        this.getOrderSummary(start, end),
        this.getCustomerOverview(),
      ])

      if (!orderSummary.success || !customerOverview.success) {
        throw new Error('Failed to fetch dashboard data')
      }

      // 並行執行所有額外的數據查詢，顯著提升效能
      const [
        avgResponseTime,
        revenueGrowth,
        orderGrowth,
        customerGrowth,
        systemUptime,
        avgLoadTime,
        onlineUsers,
        pendingOrders,
        revenueEfficiency,
      ] = await Promise.all([
        this.getAvgResponseTime(),
        this.calculateGrowthRate('revenue', start, end),
        this.calculateGrowthRate('orders', start, end),
        this.calculateGrowthRate('customers', start, end),
        this.getSystemUptime(),
        this.getAvgLoadTime(),
        this.getOnlineUsers(),
        this.getPendingOrders(),
        this.getRevenueEfficiency(),
      ])

      const overviewData: DashboardOverviewData = {
        // 從 get_order_basic_summary 獲取的數據
        totalRevenue: orderSummary.data.total_revenue || 0,
        totalOrders: orderSummary.data.total_orders || 0,
        targetAchievement: orderSummary.data.completion_rate || 0,
        conversionRate: orderSummary.data.completion_rate || 0,

        // 從 get_customer_overview 獲取的數據
        activeCustomers: customerOverview.data.total_customers || 0,
        customerRetention: customerOverview.data.retention_rate || 0,

        // Support 系統數據，使用實際平均回應時間
        customerSatisfaction: 0, // 暫無滿意度數據收集機制
        avgResponseTime,

        // 成長率計算（基於前期比較）
        revenueGrowth,
        orderGrowth,
        customerGrowth,
        satisfactionChange: 'N/A', // 暫無滿意度數據

        // 即時監控數據
        systemUptime,
        avgLoadTime,
        onlineUsers,
        pendingOrders,

        // 營收效率指標（取代 ROI）
        revenueEfficiency,

        // 時間範圍
        periodStart: start,
        periodEnd: end,
        lastUpdated: convertToISOString(new Date()),
      }

      return {
        success: true,
        data: overviewData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取訂單基礎統計
   */
  private async getOrderSummary(startDate: string, endDate: string) {
    try {
      // 首先嘗試使用 RPC 函數
      const { data, error } = await this.supabase.rpc(
        'get_order_basic_summary',
        {
          start_date: startDate,
          end_date: endDate,
        },
      )

      if (!error && data) {
        return {
          success: true,
          data: data,
        }
      }

      // 如果 RPC 函數不存在，使用基本查詢作為備用
      log.warn(
        'get_order_basic_summary RPC not available, using basic query',
      )
      return await this.getOrderSummaryBasic(startDate, endDate)
    } catch (error) {
      log.warn('RPC failed, falling back to basic query:', error)
      return await this.getOrderSummaryBasic(startDate, endDate)
    }
  }

  /**
   * 基本訂單統計查詢（備用方案）
   */
  private async getOrderSummaryBasic(startDate: string, endDate: string) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('status, total_amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (error) throw error

      const orders = data || []
      const totalOrders = orders.length
      const totalRevenue = orders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0,
      )
      const completedOrders = orders.filter((order) =>
        ['completed', 'delivered'].includes(order.status),
      ).length
      const cancelledOrders = orders.filter(
        (order) => order.status === 'cancelled',
      ).length

      return {
        success: true,
        data: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          completion_rate:
            totalOrders > 0 ? formatPercentagePrecision((completedOrders / totalOrders) * 100) : 0,
          cancellation_rate:
            totalOrders > 0 ? formatPercentagePrecision((cancelledOrders / totalOrders) * 100) : 0,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取客戶概覽數據
   */
  private async getCustomerOverview() {
    try {
      // 首先嘗試使用 RPC 函數
      const { data, error } = await this.supabase.rpc('get_customer_overview')

      if (error) {
        log.error('get_customer_overview RPC error:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          timestamp: new Date().toISOString()
        })
        throw error
      }

      if (data) {
        log.debug('get_customer_overview RPC success:', {
          dataKeys: Object.keys(data),
          timestamp: new Date().toISOString()
        })
        return {
          success: true,
          data: data,
        }
      }

      // 如果 RPC 函數返回空數據，使用基本查詢作為備用
      log.warn('get_customer_overview RPC returned empty data, using basic query')
      return await this.getCustomerOverviewBasic()
    } catch (error) {
      log.error('get_customer_overview RPC failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
      log.warn('Falling back to basic query')
      return await this.getCustomerOverviewBasic()
    }
  }

  /**
   * 基本客戶統計查詢（備用方案）
   */
  private async getCustomerOverviewBasic() {
    try {
      // 統計總客戶數
      const { count: totalCustomers, error: customerError } =
        await this.supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })

      if (customerError) throw customerError

      // 統計最近30天有訂單的客戶數（作為活躍客戶）
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString()
      const { data: activeUserIds, error: activeError } = await this.supabase
        .from('orders')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo)
        .not('user_id', 'is', null)

      if (activeError) throw activeError

      const uniqueActiveUsers = new Set(
        activeUserIds?.map((order) => order.user_id) || [],
      )
      const activeCustomers = uniqueActiveUsers.size

      // 計算留存率（簡化計算：活躍用戶 / 總用戶）
      const retentionRate =
        totalCustomers && totalCustomers > 0
          ? formatPercentagePrecision((activeCustomers / totalCustomers) * 100)
          : 0 // 無數據時返回 0

      return {
        success: true,
        data: {
          total_customers: totalCustomers || 0,
          active_customers: activeCustomers,
          retention_rate: retentionRate,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取平均回應時間（基於 Support 分析系統）
   */
  private async getAvgResponseTime(): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_summary_daily')
        .select('avg_first_response_minutes')
        .gte(
          'conversation_date',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        )
        .not('avg_first_response_minutes', 'is', null)

      if (error) throw error

      if (!data || data.length === 0) {
        return '無數據'
      }

      // 計算平均首次回應時間
      const avgMinutes =
        data.reduce(
          (sum, day) => sum + (day.avg_first_response_minutes || 0),
          0,
        ) / data.length

      // 格式化為人類可讀的時間
      if (avgMinutes < 60) {
        return `${formatNumberPrecision(avgMinutes, 0)} 分鐘`
      } else {
        const hours = Math.floor(avgMinutes / 60)
        const minutes = formatNumberPrecision(avgMinutes % 60, 0)
        return minutes > 0 ? `${hours} 小時 ${minutes} 分鐘` : `${hours} 小時`
      }
    } catch (error) {
      log.error('Error fetching avg response time:', error)
      return '無法取得'
    }
  }

  /**
   * 獲取訂單履約漏斗數據
   * 基於 order_basic_funnel_analysis 視圖，聚合過去30天數據
   */
  async getConversionFunnel(): Promise<ApiResponse<ConversionFunnelData[]>> {
    try {
      // 計算過去30天的日期範圍，與 Overview 保持一致
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const { data, error } = await this.supabase
        .from('order_basic_funnel_analysis')
        .select('*')
        .gte('analysis_date', thirtyDaysAgo)
        .order('analysis_date', { ascending: false })

      if (error) throw error

      // 聚合過去30天的漏斗數據
      const aggregatedData = (data || []).reduce(
        (acc, row) => ({
          total_orders: acc.total_orders + (row.total_orders || 0),
          confirmed_orders: acc.confirmed_orders + (row.confirmed_orders || 0),
          paid_orders: acc.paid_orders + (row.paid_orders || 0),
          processing_orders: acc.processing_orders + (row.processing_orders || 0),
          shipped_orders: acc.shipped_orders + (row.shipped_orders || 0),
          delivered_orders: acc.delivered_orders + (row.delivered_orders || 0),
          completed_orders: acc.completed_orders + (row.completed_orders || 0),
          cancelled_orders: acc.cancelled_orders + (row.cancelled_orders || 0),
        }),
        {
          total_orders: 0,
          confirmed_orders: 0,
          paid_orders: 0,
          processing_orders: 0,
          shipped_orders: 0,
          delivered_orders: 0,
          completed_orders: 0,
          cancelled_orders: 0,
        }
      )

      // 轉換為訂單履約漏斗格式
      const funnelData: ConversionFunnelData[] = [
        {
          stage: 'total_orders',
          count: aggregatedData.total_orders || 0,
          percentage: 100,
          label: '總訂單數',
        },
        {
          stage: 'confirmed',
          count: aggregatedData.confirmed_orders || 0,
          percentage: aggregatedData.total_orders
            ? formatPercentagePrecision((aggregatedData.confirmed_orders / aggregatedData.total_orders) * 100)
            : 0,
          label: '已確認',
        },
        {
          stage: 'paid',
          count: aggregatedData.paid_orders || 0,
          percentage: aggregatedData.total_orders
            ? formatPercentagePrecision((aggregatedData.paid_orders / aggregatedData.total_orders) * 100)
            : 0,
          label: '已付款',
        },
        {
          stage: 'shipped',
          count: aggregatedData.shipped_orders || 0,
          percentage: aggregatedData.total_orders
            ? formatPercentagePrecision((aggregatedData.shipped_orders / aggregatedData.total_orders) * 100)
            : 0,
          label: '已出貨',
        },
        {
          stage: 'delivered',
          count: aggregatedData.delivered_orders || 0,
          percentage: aggregatedData.total_orders
            ? formatPercentagePrecision((aggregatedData.delivered_orders / aggregatedData.total_orders) * 100)
            : 0,
          label: '已送達',
        },
        {
          stage: 'completed',
          count: aggregatedData.completed_orders || 0,
          percentage: aggregatedData.total_orders
            ? formatPercentagePrecision((aggregatedData.completed_orders / aggregatedData.total_orders) * 100)
            : 0,
          label: '已完成',
        },
      ]

      return {
        success: true,
        data: funnelData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取用戶行為轉換率摘要
   * 基於 events 和 funnel_events 表
   */
  async getUserBehaviorSummary(): Promise<ApiResponse<UserBehaviorSummary>> {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_user_behavior_summary',
        { p_days_back: 30 },
      )

      if (error) throw error

      // RPC 函數返回單行結果，需要取第一個元素
      const summary = data?.[0] || {
        total_events: 0,
        conversion_rate: 0,
        total_users: 0,
        growth_rate: '+0.0%',
      }

      return {
        success: true,
        data: {
          total_events: summary.total_events,
          conversion_rate: summary.conversion_rate,
          total_users: summary.total_users,
          growth_rate: summary.growth_rate,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取用戶行為漏斗數據
   * 基於 funnel_events 表，分析每日的轉換漏斗情況
   */
  async getUserBehaviorFunnelData(startDate?: string, endDate?: string): Promise<ApiResponse<{
    funnelData: UserBehaviorFunnelData[]
    funnelSummary: UserBehaviorFunnelSummary
  }>> {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data: funnelData, error } = await this.supabase.rpc(
        'get_dashboard_user_behavior_funnel',
        {
          p_start_date: startDate || null,
          p_end_date: endDate || null,
        },
      )

      if (error) throw error

      // 轉換為前端格式
      const funnelDataArray: UserBehaviorFunnelData[] = (funnelData || []).map(
        (item: any) => ({
          analysisDate: item.analysis_date,
          productViewCount: item.product_view_count,
          addToCartCount: item.add_to_cart_count,
          checkoutStartCount: item.checkout_start_count,
          paymentStartCount: item.payment_start_count,
          orderCompleteCount: item.order_complete_count,
          conversionRate: item.conversion_rate,
          totalRevenue: item.total_revenue,
          avgOrderValue: item.avg_order_value,
        }),
      )

      // 計算摘要數據
      const totalProductViews = funnelDataArray.reduce((sum, day) => sum + day.productViewCount, 0)
      const totalOrderCompletes = funnelDataArray.reduce((sum, day) => sum + day.orderCompleteCount, 0)
      const totalRevenue = funnelDataArray.reduce((sum, day) => sum + day.totalRevenue, 0)
      const avgConversionRate = totalProductViews > 0
        ? formatPercentagePrecision((totalOrderCompletes / totalProductViews) * 100)
        : 0

      // 簡化的 uniqueUsers 計算（使用 totalProductViews 作為近似）
      const estimatedUniqueUsers = Math.max(Math.floor(totalProductViews / 3), 1)
      const avgUserValue = estimatedUniqueUsers > 0
        ? formatCurrencyPrecision(totalRevenue / estimatedUniqueUsers)
        : 0

      const funnelSummary: UserBehaviorFunnelSummary = {
        totalProductViews,
        avgConversionRate,
        totalUsers: estimatedUniqueUsers,
        totalRevenue: formatCurrencyPrecision(totalRevenue),
        avgUserValue,
        keyInsight: this.generateFunnelInsight(avgConversionRate, totalProductViews, totalOrderCompletes),
      }

      return {
        success: true,
        data: {
          funnelData: funnelDataArray,
          funnelSummary,
        },
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 生成漏斗分析的關鍵洞察
   */
  private generateFunnelInsight(conversionRate: number, productViews: number, orderCompletes: number): string {
    if (conversionRate >= 15) {
      return `轉換表現優秀！${formatNumberPrecision(conversionRate, 1)}% 的轉換率高於行業平均水準。`
    } else if (conversionRate >= 8) {
      return `轉換表現良好，${productViews.toLocaleString()} 次商品瀏覽中有 ${orderCompletes.toLocaleString()} 次成功轉換。`
    } else if (conversionRate >= 3) {
      return `轉換率 ${formatNumberPrecision(conversionRate, 1)}% 有改善空間，建議優化購物流程降低用戶流失。`
    } else {
      return `轉換率偏低，建議分析用戶行為找出流失節點並優化體驗。`
    }
  }

  /**
   * 獲取系統警報 (優化版本)
   */
  async getSystemAlerts(): Promise<ApiResponse<SystemAlert[]>> {
    try {
      const alerts: SystemAlert[] = []
      const timestamp = convertToISOString(new Date())

      // 並行獲取多項系統數據
      const [inventoryResult, supportResult, orderResult] =
        await Promise.allSettled([
          this.getInventoryAlerts(timestamp),
          this.getSupportAlerts(timestamp),
          this.getOrderAlerts(timestamp),
        ])

      // 整合 Realtime 警報
      const realtimeAlertsManager = getGlobalRealtimeAlerts()
      const realtimeSystemAlerts = realtimeAlertsManager.getRealtimeAlerts()
      alerts.push(...realtimeSystemAlerts)

      // 整合庫存警報
      if (inventoryResult.status === 'fulfilled') {
        alerts.push(...inventoryResult.value)
      }

      // 整合客服警報
      if (supportResult.status === 'fulfilled') {
        alerts.push(...supportResult.value)
      }

      // 整合訂單警報
      if (orderResult.status === 'fulfilled') {
        alerts.push(...orderResult.value)
      }

      // 按優先級排序：error > warning > info > success
      const priorityOrder = { error: 1, warning: 2, info: 3, success: 4 }
      alerts.sort((a, b) => {
        const priorityA =
          priorityOrder[a.type as keyof typeof priorityOrder] || 5
        const priorityB =
          priorityOrder[b.type as keyof typeof priorityOrder] || 5
        return priorityA - priorityB
      })

      // 限制顯示數量，避免卡片過載
      const limitedAlerts = alerts.slice(0, 8)

      return {
        success: true,
        data: limitedAlerts,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取庫存相關警報
   */
  private async getInventoryAlerts(timestamp: string): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = []

    try {
      const { data: inventoryData, error: inventoryError } =
        await this.supabase.rpc('get_inventory_overview')

      if (inventoryError) throw inventoryError

      // 缺貨警報 (最高優先級)
      if (inventoryData?.out_of_stock_count > 0) {
        alerts.push({
          id: 'out-of-stock-alert',
          type: 'error',
          message: `緊急：${inventoryData.out_of_stock_count} 項商品缺貨`,
          priority: 'high',
          timestamp,
        })
      }

      // 庫存不足警報
      if (inventoryData?.low_stock_count > 0) {
        alerts.push({
          id: 'low-stock-alert',
          type: 'warning',
          message: `注意：${inventoryData.low_stock_count} 項商品庫存偏低`,
          priority: 'medium',
          timestamp,
        })
      }

      // 庫存健康狀況 (較低優先級，但提供正面回饋)
      if (inventoryData?.healthy_stock_count > 0 && alerts.length === 0) {
        alerts.push({
          id: 'healthy-stock-info',
          type: 'success',
          message: `正常：${inventoryData.healthy_stock_count} 項商品庫存充足`,
          priority: 'low',
          timestamp,
        })
      }
    } catch (error) {
      log.warn('Failed to fetch inventory alerts:', error)
    }

    return alerts
  }

  /**
   * 獲取客服相關警報
   */
  private async getSupportAlerts(timestamp: string): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = []

    try {
      // 基於 conversation_summary_daily 表分析最近客服狀況
      const { data: supportData, error: supportError } = await this.supabase
        .from('conversation_summary_daily')
        .select(
          'conversation_date, total_conversations, avg_first_response_minutes',
        )
        .gte(
          'conversation_date',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        )
        .order('conversation_date', { ascending: false })
        .limit(7)

      if (supportError) throw supportError

      if (supportData && supportData.length > 0) {
        // 計算最近一週的客服指標
        const totalConversations = supportData.reduce(
          (sum, day) => sum + (day.total_conversations || 0),
          0,
        )
        const avgResponseMinutes =
          supportData
            .filter((day) => day.avg_first_response_minutes)
            .reduce(
              (sum, day) => sum + (day.avg_first_response_minutes || 0),
              0,
            ) /
          Math.max(
            supportData.filter((day) => day.avg_first_response_minutes).length,
            1,
          )

        // 回應時間警報
        if (avgResponseMinutes > 120) {
          // 超過2小時
          alerts.push({
            id: 'slow-response-alert',
            type: 'warning',
            message: `客服回應：平均 ${formatNumberPrecision(avgResponseMinutes, 0)} 分鐘`,
            priority: 'medium',
            timestamp,
          })
        } else if (avgResponseMinutes > 0 && avgResponseMinutes <= 60) {
          // 回應時間良好的正面回饋
          alerts.push({
            id: 'good-response-info',
            type: 'success',
            message: `客服回應：平均 ${formatNumberPrecision(avgResponseMinutes, 0)} 分鐘`,
            priority: 'low',
            timestamp,
          })
        }

        // 客服工作量提醒
        if (totalConversations > 0) {
          alerts.push({
            id: 'support-activity-info',
            type: 'info',
            message: `本週處理 ${totalConversations} 個客服對話`,
            priority: 'low',
            timestamp,
          })
        }
      }
    } catch (error) {
      log.warn('Failed to fetch support alerts:', error)
    }

    return alerts
  }

  /**
   * 獲取訂單相關警報
   */
  private async getOrderAlerts(timestamp: string): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = []

    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_order_alerts',
        { p_hours_threshold: 2 },
      )

      if (error) throw error

      // 轉換 RPC 結果為 SystemAlert 格式
      data?.forEach((alert: any) => {
        const priority = alert.alert_type === 'warning' ? 'high' : 'low'
        alerts.push({
          id: alert.alert_type === 'warning' ? 'pending-orders-alert' : 'daily-orders-info',
          type: alert.alert_type as 'warning' | 'info',
          message: alert.message,
          priority: priority as 'high' | 'medium' | 'low',
          timestamp,
        })
      })
    } catch (error) {
      log.warn('Failed to fetch order alerts:', error)
    }

    return alerts
  }

  /**
   * 獲取熱銷產品排行（基於真實銷售數據）
   */
  async getTopProducts(limit: number = 5): Promise<ApiResponse<TopProduct[]>> {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_top_products',
        {
          p_limit: limit,
          p_days_back: 30,
        },
      )

      if (error) throw error

      // RPC 函數已返回正確格式，直接使用
      const topProducts: TopProduct[] = (data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        sales: product.sales,
        growth: product.growth,
        rank: product.rank,
      }))

      return {
        success: true,
        data: topProducts,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 🔐 業務健康度指標計算 - 使用 Edge Function
   * 單一真實來源：所有商業邏輯在伺服器端執行
   */
  async getBusinessHealthMetrics(): Promise<
    ApiResponse<BusinessHealthMetrics>
  > {
    try {
      log.debug('🔐 DashboardApiService: 取得業務健康度指標')

      const protectedService = new BusinessHealthAnalyticsService(this.supabase)
      const protectedResult = await protectedService.getHealthMetrics('30d')

      log.debug('🔐 Protected Health Metrics Success:', protectedResult)

      return {
        success: true,
        data: protectedResult,
      }
    } catch (error) {
      log.error('🔐 Business Health Metrics Error:', error)
      return this.handleError(error)
    }
  }

  /**
   * 計算成長率（與前期相比）
   */
  private async calculateGrowthRate(
    metric: 'revenue' | 'orders' | 'customers',
    currentStart: string,
    currentEnd: string,
  ): Promise<string> {
    try {
      // 計算前期的日期範圍（相同長度）
      const currentStartDate = new Date(currentStart)
      const currentEndDate = new Date(currentEnd)
      const periodLength = currentEndDate.getTime() - currentStartDate.getTime()

      const previousEndDate = new Date(
        currentStartDate.getTime() - 24 * 60 * 60 * 1000,
      ) // 前一天
      const previousStartDate = new Date(
        previousEndDate.getTime() - periodLength,
      )

      // 獲取當前期間和前期間的數據
      const [currentData, previousData] = await Promise.all([
        this.getOrderSummary(currentStart, currentEnd),
        this.getOrderSummary(
          previousStartDate.toISOString().split('T')[0],
          previousEndDate.toISOString().split('T')[0],
        ),
      ])

      if (!currentData.success || !previousData.success) {
        return 'N/A'
      }

      let currentValue = 0
      let previousValue = 0

      // 根據指標類型取得對應數值
      switch (metric) {
        case 'revenue':
          currentValue = currentData.data.total_revenue || 0
          previousValue = previousData.data.total_revenue || 0
          break
        case 'orders':
          currentValue = currentData.data.total_orders || 0
          previousValue = previousData.data.total_orders || 0
          break
        case 'customers':
          // 客戶成長率需要特別處理，暫時使用訂單數作為代理指標
          currentValue = currentData.data.total_orders || 0
          previousValue = previousData.data.total_orders || 0
          break
      }

      if (previousValue === 0) {
        return currentValue > 0 ? '+100%' : '0%'
      }

      const growthRate = ((currentValue - previousValue) / previousValue) * 100
      const sign = growthRate >= 0 ? '+' : ''

      return `${sign}${formatNumberPrecision(growthRate, 1)}%`
    } catch (error) {
      log.error(`Error calculating ${metric} growth rate:`, error)
      return 'N/A'
    }
  }

  /**
   * 獲取系統可用性（基於資料庫連接狀況）
   */
  private async getSystemUptime(): Promise<string> {
    try {
      const startTime = Date.now()
      const { error } = await this.supabase
        .from('orders')
        .select('count', { count: 'exact', head: true })
        .limit(1)

      const responseTime = Date.now() - startTime

      if (error) {
        log.error('Database connectivity check failed:', error)
        return '無法取得' // 資料庫連接失敗時返回無法取得
      }

      // 基於回應時間計算可用性
      if (responseTime < 1000) return '99.9%'
      if (responseTime < 3000) return '99.5%'
      if (responseTime < 5000) return '98.8%'
      return '97.5%'
    } catch (error) {
      log.error('Error checking system uptime:', error)
      return '無法取得'
    }
  }

  /**
   * 獲取平均載入時間（基於資料庫查詢效能）
   */
  private async getAvgLoadTime(): Promise<string> {
    try {
      const measurements = []

      // 執行3次測試查詢來測量平均時間
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now()
        await this.supabase
          .from('orders')
          .select('count', { count: 'exact', head: true })
          .limit(1)
        measurements.push(Date.now() - startTime)
      }

      const avgTime =
        measurements.reduce((sum, time) => sum + time, 0) / measurements.length

      if (avgTime < 1000) return `${formatNumberPrecision(avgTime / 1000, 1)}s`
      return `${formatNumberPrecision(avgTime / 1000, 0)}s`
    } catch (error) {
      log.error('Error measuring load time:', error)
      return '3.0s'
    }
  }

  /**
   * 獲取線上用戶數（基於最近活動）
   */
  private async getOnlineUsers(): Promise<number> {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_online_users',
        { p_minutes_back: 15 },
      )

      if (error) throw error
      return data || 0
    } catch (error) {
      log.error('Error fetching online users:', error)
      return 0
    }
  }

  /**
   * 獲取待處理訂單數
   */
  private async getPendingOrders(): Promise<number> {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_pending_orders',
      )

      if (error) throw error
      return data || 0
    } catch (error) {
      log.error('Error fetching pending orders:', error)
      return 0
    }
  }

  /**
   * 獲取營收效率指標（基於真實可用數據）
   * 計算公式：訂單完成率 × 0.7 + 客戶留存率 × 0.3，表示營運效率
   */
  private async getRevenueEfficiency(): Promise<string> {
    try {
      // 獲取訂單統計數據
      const [orderSummary, customerOverview] = await Promise.all([
        this.getOrderSummary(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          convertToISOString(new Date()).split('T')[0],
        ),
        this.getCustomerOverview(),
      ])

      if (!orderSummary.success || !customerOverview.success) {
        return '0%' // 無數據時返回 0%
      }

      const completionRate = (orderSummary.data.completion_rate || 0) / 100 // 轉為 0-1 範圍
      const retentionRate = (customerOverview.data.retention_rate || 0) / 100 // 轉為 0-1 範圍

      // 計算營收效率：結合完成率和留存率
      const efficiency = (completionRate * 0.7 + retentionRate * 0.3) * 100

      return `${formatNumberPrecision(efficiency, 0)}%`
    } catch (error) {
      log.error('Error calculating revenue efficiency:', error)
      return '0%' // 錯誤時返回 0%
    }
  }

  /**
   * 獲取營收趨勢數據
   */
  async getRevenueTrend(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<RevenueTrendData[]>> {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_revenue_trend',
        {
          p_period: period,
          p_start_date: startDate || null,
          p_end_date: endDate || null,
        },
      )

      if (error) throw error

      // 轉換為前端格式
      const trendData: RevenueTrendData[] = (data || []).map((item: any) => ({
        date: item.date,
        revenue: item.revenue,
        orders: item.orders,
        customers: item.customers,
      }))

      return {
        success: true,
        data: trendData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取客戶價值分佈數據 (RFM × LTV 分析)
   */
  async getCustomerValueDistribution(): Promise<
    ApiResponse<CustomerValueDistribution[]>
  > {
    try {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await this.supabase.rpc(
        'get_dashboard_customer_value_distribution',
      )

      if (error) throw error

      // 轉換為前端格式
      const customerDistribution: CustomerValueDistribution[] = (data || []).map(
        (customer: any) => ({
          customerId: customer.customer_id,
          customerName: customer.customer_name,
          recency: customer.recency,
          frequency: customer.frequency,
          monetary: customer.monetary,
          ltv: customer.ltv,
          rfmScore: customer.rfm_score,
          segment: customer.segment,
          registrationDate: customer.registration_date,
          lastOrderDate: customer.last_order_date,
          totalOrders: customer.total_orders,
          totalSpent: customer.total_spent,
        }),
      )

      return {
        success: true,
        data: customerDistribution,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  // BaseApiService 必須實現的抽象方法
  protected mapDbToEntity(dbEntity: any): any {
    return dbEntity
  }

  protected mapEntityToDb(entity: any): any {
    return entity
  }
}
