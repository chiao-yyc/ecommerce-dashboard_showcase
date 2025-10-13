import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryClient'

/**
 * Customer Dashboard 專用的 Query Hooks
 * 使用 Vue Query 管理 Customer 相關資料的快取和狀態
 */

// Types for RFM data
export interface RfmMetric {
  user_id: string
  full_name: string
  recency_days: number
  frequency: number
  monetary: number
  r_score: number
  f_score: number
  m_score: number
  rfm_segment: string
  rfm_segment_name: string
  lifecycle_stage: string
}

// Types for LTV data
export interface LtvMetric {
  user_id: string
  first_purchase_date: string
  last_purchase_date: string
  purchase_count: number
  total_revenue: number
  aov: number
  lifespan_months: number
  purchase_frequency_per_month: number
  estimated_ltv: number
}

// Combined data type
export interface CombinedCustomerMetric extends RfmMetric {
  // LTV 相關的額外屬性（可選）
  first_purchase_date?: string
  last_purchase_date?: string
  purchase_count?: number
  total_revenue?: number
  aov?: number
  lifespan_months?: number
  purchase_frequency_per_month?: number
  estimated_ltv?: number
}

// LTV Trend data types
export interface LtvTrendDataPoint {
  period: string
  period_start: string
  average_ltv: number
  high_value_ltv: number
  active_customers: number
  new_customers: number
  period_revenue: number
}

export interface LtvSegmentTrendDataPoint {
  period: string
  period_start: string
  champions_avg_ltv: number
  loyal_avg_ltv: number
  at_risk_avg_ltv: number
}

export interface LtvTrendAnalysisResult {
  period: {
    start: string
    end: string
    type: string
  }
  ltv_trend_data: LtvTrendDataPoint[]
  segment_trend_data: LtvSegmentTrendDataPoint[]
}

/**
 * 取得 RFM 指標資料
 */
export function useCustomerRfmMetrics() {
  return useQuery({
    queryKey: queryKeys.customer.rfmMetrics(),
    queryFn: async (): Promise<RfmMetric[]> => {
      // 使用 RPC 函數或手動JOIN查詢
      const { error } = await supabase.from('customer_rfm_lifecycle_metrics')
        .select(`
          user_id,
          full_name,
          recency_days,
          frequency,
          monetary,
          r_score,
          f_score,
          m_score,
          rfm_segment,
          lifecycle_stage
        `)

      if (error) {
        throw new Error(`Failed to fetch RFM metrics: ${error.message}`)
      }

      // 現在直接使用新視圖，不需要額外查詢 mapping 表
      const { data: dataWithSegmentName, error: segmentError } =
        await supabase.from('customer_rfm_with_segment_name').select(`
          user_id, full_name, email, recency_days, frequency, monetary,
          r_score, f_score, m_score, rfm_segment, rfm_segment_name,
          first_purchase_date, last_purchase_date, lifecycle_stage, customer_number
        `)

      if (segmentError) {
        throw new Error(
          `Failed to fetch RFM data with segments: ${segmentError.message}`,
        )
      }

      const transformedData = dataWithSegmentName || []

      return transformedData
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘
  })
}

/**
 * 取得 LTV 指標資料
 */
export function useCustomerLtvMetrics() {
  return useQuery({
    queryKey: queryKeys.customer.ltvMetrics(),
    queryFn: async (): Promise<LtvMetric[]> => {
      const { data, error } = await supabase.from('customer_ltv_metrics')
        .select(`
          user_id,
          first_purchase_date,
          last_purchase_date,
          purchase_count,
          total_revenue,
          aov,
          lifespan_months,
          purchase_frequency_per_month,
          estimated_ltv
        `)

      if (error) {
        throw new Error(`Failed to fetch LTV metrics: ${error.message}`)
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘
  })
}

/**
 * 取得合併的 Customer 指標資料
 * 組合 RFM 和 LTV 資料，提供統一的資料結構
 */
export function useCustomerCombinedMetrics() {
  const rfmQuery = useCustomerRfmMetrics()
  const ltvQuery = useCustomerLtvMetrics()

  const combinedData = computed<CombinedCustomerMetric[]>(() => {
    if (!rfmQuery.data.value || !ltvQuery.data.value) {
      return []
    }

    // 建立 LTV 資料的 Map 以提高查詢效率
    const ltvMap = new Map(ltvQuery.data.value.map((ltv) => [ltv.user_id, ltv]))

    // 合併 RFM 和 LTV 資料
    return rfmQuery.data.value.map((rfm) => ({
      ...rfm,
      ...ltvMap.get(rfm.user_id),
    }))
  })

  return {
    data: combinedData,
    isLoading: computed(
      () => rfmQuery.isLoading.value || ltvQuery.isLoading.value,
    ),
    isError: computed(() => rfmQuery.isError.value || ltvQuery.isError.value),
    error: computed(() => rfmQuery.error.value || ltvQuery.error.value),
    isSuccess: computed(
      () => rfmQuery.isSuccess.value && ltvQuery.isSuccess.value,
    ),
    refetch: () => {
      rfmQuery.refetch()
      ltvQuery.refetch()
    },
  }
}

/**
 * RFM 生命週期階段資料處理
 */
export function useRfmStageData() {
  const { data: combinedData, ...rest } = useCustomerCombinedMetrics()

  const rfmStageData = computed(() => {
    if (!combinedData.value?.length) return []

    const groupData = combinedData.value.reduce(
      (acc, item) => {
        if (!acc[item.lifecycle_stage]) {
          acc[item.lifecycle_stage] = 0
        }
        acc[item.lifecycle_stage]++
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(groupData).map(([key, value]) => ({
      name: key,
      value,
    }))
  })

  return {
    data: rfmStageData,
    ...rest,
  }
}

/**
 * RFM 分段圓餅圖資料處理
 */
export function useRfmSegmentDonutData() {
  const { data: combinedData, ...rest } = useCustomerCombinedMetrics()

  const rfmSegDonutData = computed(() => {
    if (!combinedData.value?.length) return []

    const groupData = combinedData.value.reduce(
      (acc, item) => {
        const segmentName = item.rfm_segment_name || item.rfm_segment
        if (!acc[segmentName]) {
          acc[segmentName] = 0
        }
        acc[segmentName]++
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(groupData).map(([key, value]) => ({
      name: key,
      value,
    }))
  })

  return {
    data: rfmSegDonutData,
    ...rest,
  }
}

/**
 * 購買趨勢線圖資料處理
 */
export function usePurchaseTrendData() {
  const { data: combinedData, ...rest } = useCustomerCombinedMetrics()

  const purchaseLineData = computed(() => {
    if (!combinedData.value?.length) return []

    const dateMap = new Map<string, boolean>()
    const firstPurchaseCount: Record<string, number> = {}
    const lastPurchaseCount: Record<string, number> = {}

    // 處理資料
    combinedData.value.forEach((item) => {
      // 處理首次購買日期
      const firstDate = item.first_purchase_date?.split('T')[0]
      if (firstDate) {
        dateMap.set(firstDate, true)
        firstPurchaseCount[firstDate] = (firstPurchaseCount[firstDate] || 0) + 1
      }

      // 處理最後購買日期
      const lastDate = item.last_purchase_date?.split('T')[0]
      if (lastDate) {
        dateMap.set(lastDate, true)
        lastPurchaseCount[lastDate] = (lastPurchaseCount[lastDate] || 0) + 1
      }
    })

    // 排序日期並建立資料點
    const allDates = [...dateMap.keys()].sort()

    return allDates.map((date) => ({
      date,
      first_purchase_date: firstPurchaseCount[date] || 0,
      last_purchase_date: lastPurchaseCount[date] || 0,
    }))
  })

  return {
    data: purchaseLineData,
    ...rest,
  }
}

/**
 * 購買次數柱狀圖資料處理
 */
export function usePurchaseCountData() {
  const { data: combinedData, ...rest } = useCustomerCombinedMetrics()

  const purchaseBarData = computed(() => {
    if (!combinedData.value?.length) return []

    const groupData = combinedData.value.reduce(
      (acc, item) => {
        const count = item.purchase_count || 0
        if (!acc[count]) {
          acc[count] = 0
        }
        acc[count]++
        return acc
      },
      {} as Record<number, number>,
    )

    return Object.entries(groupData).map(([key, value]) => ({
      name: key,
      value,
    }))
  })

  return {
    data: purchaseBarData,
    ...rest,
  }
}

/**
 * RFM vs LTV 散點圖資料處理
 */
export function useRfmLtvScatterData() {
  const { data: combinedData, ...rest } = useCustomerCombinedMetrics()

  const rfmLtvScatterData = computed(() => {
    if (!combinedData.value?.length) return []

    return combinedData.value
      .filter((item) => item.estimated_ltv) // 只包含有 LTV 資料的項目
      .map((item) => ({
        x: item.estimated_ltv || 0,
        y: (item.r_score || 0) + (item.f_score || 0) + (item.m_score || 0),
        rfm_segment: item.rfm_segment_name || item.rfm_segment,
        lifecycle_stage: item.lifecycle_stage,
        full_name: item.full_name,
      }))
  })

  return {
    data: rfmLtvScatterData,
    ...rest,
  }
}

/**
 * LTV 趨勢分析資料
 * 基於真實訂單歷史計算 LTV 趨勢
 */
export function useLtvTrendData(
  startDate?: string,
  endDate?: string,
  periodType: 'weekly' | 'monthly' = 'weekly',
) {
  return useQuery({
    queryKey: queryKeys.customer.ltvTrend(startDate, endDate, periodType),
    queryFn: async (): Promise<LtvTrendAnalysisResult> => {
      const { data, error } = await supabase.rpc('get_ltv_trend_analysis', {
        start_date: startDate || null,
        end_date: endDate || null,
        period_type: periodType,
      })

      if (error) {
        throw new Error(`Failed to fetch LTV trend analysis: ${error.message}`)
      }

      return data as LtvTrendAnalysisResult
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘
    enabled: true, // 總是啟用，使用預設時間範圍
  })
}
