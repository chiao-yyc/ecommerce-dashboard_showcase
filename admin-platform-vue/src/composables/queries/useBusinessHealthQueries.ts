import { useQuery } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryClient'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'BusinessHealthQueries')

/**
 * 業務健康度專用的 Query Hooks
 * 整合跨功能數據，提供戰略層面的業務洞察
 */

// 業務健康度指標類型
export interface BusinessHealthMetric {
  week: string
  active_customers: number
  high_value_customers: number
  customer_quality_ratio: number
  completion_rate: number
  avg_fulfillment_hours: number
  avg_response_time: number
  resolution_rate: number
  overall_health_rating: string
}

// 業務洞察類型
export interface BusinessInsight {
  type: 'opportunity' | 'warning' | 'info'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actions?: string[]
  confidence: number
}

// Phase 1: 業務健康度警示類型 (重命名以避免與 dashboard.ts 衝突)
export interface BusinessHealthAlert {
  id: string
  alert_type: 'threshold_breach' | 'trend_analysis' | 'anomaly_detection'
  severity: 'info' | 'warning' | 'critical'
  metric_name: string
  title: string
  message: string
  current_value: number
  threshold_value: number
  business_context: Record<string, any>
  detected_at: string
  expires_at: string
  // 添加 AI 分析組件所需的屬性
  status?: 'active' | 'acknowledged' | 'resolved'
  created_at?: string
  updated_at?: string
  metric_value?: string
  alert_condition?: 'greater_than' | 'less_than' | 'equals' | 'not_equals'
}

// 趨勢分析類型
export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable'
  change_percentage: number
  description: string
  key_drivers: string[]
}

// 風險趨勢數據類型
export interface RiskTrendData {
  date: string
  customer_risk: number
  operational_risk: number
  support_risk: number
  overall_risk: number
  at_risk_customers: number
  churned_customers: number
  total_active_customers: number
  pending_orders: number
  total_orders: number
  order_cancel_rate: number
  order_pending_rate: number
}

// 風險預測數據類型
export interface RiskForecastData {
  timeframe: string
  customer_churn_risk: string
  operational_risk: string
  overall_risk: string
  confidence: string
  forecast_method: string
  forecast_date: string
  expected_customer_risk_value: number | null
  expected_operational_risk_value: number | null
  expected_overall_risk_value: number | null
}

/**
 * 客戶價值行動建議查詢
 */
export function useCustomerActionRecommendations() {
  return useQuery({
    queryKey: queryKeys.businessHealth.customerActions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_action_recommendations')
        .select('*')
        .order('action_priority', { ascending: false })

      if (error) {
        return {
          highPriorityActions: [],
          mediumPriorityActions: [],
          riskCustomers: [],
          totalActionableCustomers: 0,
        }
      }

      const result = {
        highPriorityActions:
          data?.filter((item) => item.action_priority === '高') || [],
        mediumPriorityActions:
          data?.filter((item) => item.action_priority === '中') || [],
        riskCustomers:
          data?.filter((item) => item.engagement_status === '流失風險') || [],
        totalActionableCustomers: data?.length || 0,
      }

      return result
    },
    staleTime: 15 * 60 * 1000, // 15分鐘
  })
}

/**
 * 營運效率分析查詢
 */
export function useOperationalEfficiencyAnalysis() {
  return useQuery({
    queryKey: queryKeys.businessHealth.operationalEfficiency(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_efficiency_analysis')
        .select('*')
        .order('order_volume_rank')

      if (error) {
        return {
          hourlyEfficiency: [],
          recommendations: [],
        }
      }

      return {
        hourlyEfficiency: data || [],
        recommendations: generateOperationalRecommendations(),
      }
    },
    staleTime: 10 * 60 * 1000, // 10分鐘
  })
}

/**
 * 風險預警查詢
 */
export function useBusinessRiskAlerts() {
  return useQuery({
    queryKey: queryKeys.businessHealth.riskAlerts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_risk_alerts')
        .select('*')
        .order('risk_level', { ascending: false })

      if (error) {
        return {
          highRiskAlerts: [],
          mediumRiskAlerts: [],
          allAlerts: [],
        }
      }

      return {
        highRiskAlerts:
          data?.filter((alert) => alert.risk_level === '高') || [],
        mediumRiskAlerts:
          data?.filter((alert) => alert.risk_level === '中') || [],
        allAlerts: data || [],
      }
    },
    staleTime: 2 * 60 * 1000, // 2分鐘 (風險需要更頻繁更新)
    refetchInterval: 5 * 60 * 1000, // 自動重新整理
  })
}

/**
 * 風險趨勢歷史數據查詢
 * 從 risk_trends_daily 視圖查詢歷史趨勢數據
 */
export function useRiskTrendsDaily() {
  return useQuery({
    queryKey: queryKeys.businessHealth.riskTrends(),
    queryFn: async (): Promise<RiskTrendData[]> => {
      log.debug('Querying risk_trends_daily view')

      const { data, error } = await supabase
        .from('risk_trends_daily')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        log.error('風險趨勢歷史數據查詢失敗', { error })
        return []
      }

      log.debug('Risk trend data retrieved', { count: data?.length || 0 })
      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5分鐘 (風險趨勢相對穩定)
    retry: 1, // 只重試一次，避免過度請求
  })
}

/**
 * 風險趨勢預測查詢
 * 從 risk_forecast_trends 視圖查詢預測數據
 */
export function useRiskTrendForecast() {
  return useQuery({
    queryKey: queryKeys.businessHealth.riskForecast(),
    queryFn: async (): Promise<RiskForecastData[]> => {
      log.debug('Querying risk_forecast_trends view')

      const { data, error } = await supabase
        .from('risk_forecast_trends')
        .select('*')
        .order('forecast_date', { ascending: true })

      if (error) {
        log.error('風險預測數據查詢失敗', { error })
        return []
      }

      log.debug('Risk forecast data retrieved', { count: data?.length || 0 })
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10分鐘 (預測數據更新頻率較低)
    retry: 1, // 只重試一次
  })
}

/**
 * @deprecated 已由 business-health-analytics Edge Function 完全取代
 * 此函數不再使用，保留僅供歷史參考
 * 請使用 useProtectedDashboardContent() 替代，其中包含完整的 KPI 數據
 */

/**
 * Phase 1: 儀表板警示查詢
 * 獲取當前活躍的業務警示
 */
export function useDashboardAlerts(severity?: 'info' | 'warning' | 'critical') {
  return useQuery({
    queryKey: queryKeys.businessHealth.dashboardAlerts(severity),
    queryFn: async (): Promise<BusinessHealthAlert[]> => {
      const { data, error } = await supabase.rpc(
        'get_active_dashboard_alerts',
        {
          limit_count: 20,
          severity_filter: severity || null,
        },
      )

      if (error) {
        log.warn('儀表板警示查詢失敗', { error: error.message })
        return []
      }

      // RPC 函數現在直接返回 JSONB 陣列格式 (2025-09-04 修復)
      let alertsArray: any[] = []

      if (data && Array.isArray(data)) {
        // 數據直接就是陣列格式
        alertsArray = data
      } else {
        log.warn('Unexpected data format from get_active_dashboard_alerts', {
          dataType: typeof data,
          isArray: Array.isArray(data),
          data,
        })
      }

      // 轉換資料格式並加入驗證
      const processedAlerts = alertsArray.map((alert: any, index: number) => {
        // 數據轉換前的驗證
        if (
          !alert.alert_type ||
          alert.alert_type === null ||
          alert.alert_type === undefined
        ) {
          log.error('CRITICAL: alert_type is missing in raw data', {
            index,
            alertKeys: Object.keys(alert).join(', '),
          })
        }

        // 更安全的數據轉換，避免覆蓋現有值
        const processed = {
          ...alert, // 保持所有原始欄位
          // 只轉換數值類型欄位，保持字串欄位不變
          current_value:
            typeof alert.current_value === 'number'
              ? alert.current_value
              : alert.current_value !== null &&
                  alert.current_value !== undefined
                ? Number(alert.current_value)
                : 0,
          threshold_value:
            typeof alert.threshold_value === 'number'
              ? alert.threshold_value
              : alert.threshold_value !== null &&
                  alert.threshold_value !== undefined
                ? Number(alert.threshold_value)
                : 0,
          // 確保 business_context 是物件
          business_context:
            alert.business_context && typeof alert.business_context === 'object'
              ? alert.business_context
              : {},
        }

        return processed
      })

      return processedAlerts
    },
    staleTime: 2 * 60 * 1000, // 2分鐘 (警示需要較頻繁更新)
    refetchInterval: 5 * 60 * 1000, // 每5分鐘自動重新整理
  })
}

/**
 * Phase 1: 觸發警示檢查
 * 手動觸發業務指標檢查並生成新警示
 */
export function useTriggerAlertCheck() {
  return useQuery({
    queryKey: queryKeys.businessHealth.alertCheck(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('trigger_alert_check')

      if (error) {
        log.warn('警示檢查觸發失敗', { error: error.message })
        return {
          success: false,
          error: error.message,
          alerts_generated: 0,
          alerts_resolved: 0,
        }
      }

      return data
    },
    staleTime: 0, // 每次都重新執行
    enabled: false, // 預設不啟用，需要手動觸發
  })
}

/**
 * Phase 1.5: 獲取統合的儀表板內容 (三區塊統一)
 */
export function useUnifiedDashboardContent() {
  return useQuery({
    queryKey: queryKeys.businessHealth.unifiedContent(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_unified_dashboard_content',
      )

      if (error) {
        throw new Error(`獲取統合內容失敗: ${error.message}`)
      }

      return data as {
        alerts: Array<{
          id: string
          title: string
          message: string
          severity: 'critical' | 'warning' | 'info'
          type?: 'warning' | 'info' | 'success'
          priority?: 'high' | 'medium' | 'low'
          action?: string
        }>
        insights: Array<{
          title: string
          type: 'warning' | 'info' | 'opportunity'
          description?: string
          impact?: string
          confidence?: number
          actions?: string[]
          category?: string
        }>
        recommendations: Array<{
          title: string
          category: string
          description?: string
          impact?: string
          effort?: string
          timeline?: string
        }>
        last_updated: string
      }
    },
    staleTime: 2 * 60 * 1000, // 2分鐘
    retry: 2,
  })
}

/**
 * Phase 1.5: 刷新所有警示和洞察
 */
export function useRefreshAllAlerts() {
  return useQuery({
    queryKey: queryKeys.businessHealth.refreshAlerts(),
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'refresh_all_alerts_and_insights',
      )

      if (error) {
        log.warn('刷新警示失敗', { error: error.message })
        return {
          success: false,
          error: error.message,
        }
      }

      return data
    },
    staleTime: 0, // 每次都重新執行
    enabled: false, // 預設不啟用，需要手動觸發
  })
}

/**
 * @deprecated 以下輔助函數僅供 useBusinessHealthOverview() 使用
 * 由於該函數已被 Edge Function 取代，這些輔助函數也不再需要
 * 保留僅供歷史參考
 */

/**
 * 生成營運建議
 */
function generateOperationalRecommendations() {
  return [
    {
      category: '人力配置',
      recommendation: '在14-16時增加客服人力',
      impact: '提升服務效率20%',
    },
  ]
}

// 擴展 queryKeys
declare module '@/lib/queryClient' {
  interface QueryKeys {
    businessHealth: {
      overview: () => string[]
      customerActions: () => string[]
      operationalEfficiency: () => string[]
      riskAlerts: () => string[]
      riskTrends: () => string[]
      riskForecast: () => string[]
      revenueKPIs: () => string[]
      dashboardAlerts: (severity?: string) => string[]
      alertCheck: () => string[]
    }
  }
}
