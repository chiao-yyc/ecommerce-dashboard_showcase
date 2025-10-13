import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { queryKeys } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'OrderQueries')

/**
 * Order Dashboard 專用的 Query Hooks
 * 使用 Vue Query 管理 Order 相關資料的快取和狀態
 */

// Types for Order data
export interface OrderAmountHistogram {
  bin_start: number
  bin_end: number
  count: number
}

export interface OrderStatusDistribution {
  status: string
  count: number
  percentage: number
}

export interface ProductSalesDaily {
  order_date: string
  product_id: string
  product_name: string
  total_quantity: number
  total_sales: number
}

export interface CustomerPurchaseSummary {
  purchase_date: string
  new_customers: number
  returning_customers: number
  new_customer_revenue: number
  returning_customer_revenue: number
}

export interface OrderMetricsHourly {
  hour: number
  order_count: number
  total_amount: number
  avg_order_value: number
  new_customer_order_count: number
  returning_customer_order_count: number
  new_customer_amount: number
  returning_customer_amount: number
  is_weekend: boolean
}

export interface TopProductData {
  order_date: string
  product_id: string
  product_name: string
  total_quantity: number
  total_sales: number
}

/**
 * 取得訂單金額直方圖資料（含客戶類型分組）
 */
export function useOrderAmountHistogram() {
  return useQuery({
    queryKey: queryKeys.order.amountHistogram(),
    queryFn: async (): Promise<any[]> => {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await supabase.rpc(
        'get_dashboard_order_amount_histogram',
      )

      if (error) {
        log.error('訂單金額直方圖查詢失敗', { error })
        return []
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘
  })
}

/**
 * 取得訂單狀態分佈資料
 */
export function useOrderStatusDistribution() {
  return useQuery({
    queryKey: queryKeys.order.statusDistribution(),
    queryFn: async (): Promise<OrderStatusDistribution[]> => {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await supabase.rpc(
        'get_dashboard_order_status_distribution',
      )

      if (error) {
        log.error('訂單狀態分佈查詢失敗', { error })
        return []
      }

      return data || []
    },
    staleTime: 3 * 60 * 1000, // 3 分鐘（狀態變化較頻繁）
  })
}

/**
 * 取得產品銷售每日資料
 */
export function useProductSalesDaily() {
  return useQuery({
    queryKey: queryKeys.order.productSalesDaily(),
    queryFn: async (): Promise<ProductSalesDaily[]> => {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await supabase.rpc(
        'get_dashboard_product_sales_daily',
      )

      if (error) {
        log.error('產品銷售每日資料查詢失敗', { error })
        return []
      }

      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 分鐘（日報資料更新頻率較低）
  })
}

/**
 * 取得客戶購買摘要資料
 */
export function useCustomerPurchaseSummary() {
  return useQuery({
    queryKey: queryKeys.order.customerPurchaseSummary(),
    queryFn: async (): Promise<any[]> => {
      // 使用 RPC 函數繞過 RLS
      const { data, error } = await supabase.rpc(
        'get_dashboard_customer_purchase_summary',
      )

      if (error) {
        log.error('客戶購買摘要查詢失敗', { error })
        return []
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘
  })
}

/**
 * 取得訂單每小時指標資料
 */
export function useOrderMetricsHourly() {
  return useQuery({
    queryKey: queryKeys.order.hourlyMetrics(),
    queryFn: async (): Promise<OrderMetricsHourly[]> => {
      const { data, error } = await supabase
        .from('order_metrics_hourly')
        .select('*')
        .order('hour', { ascending: true })

      if (error) {
        log.error('訂單每小時指標查詢失敗', { error })
        return []
      }

      return data || []
    },
    staleTime: 2 * 60 * 1000, // 2 分鐘（小時指標更新較頻繁）
  })
}

/**
 * 處理熱門產品銷售趨勢資料
 */
export function useTopProductTrendData() {
  const productSalesQuery = useProductSalesDaily()

  const topProductData = computed<{
    data: TopProductData[]
    legend: Array<{
      product_id: string
      product_name: string
      total_sales: number
    }>
  }>(() => {
    if (!productSalesQuery.data.value?.length) {
      return { data: [], legend: [] }
    }

    const data = productSalesQuery.data.value

    // 計算每個產品的總銷售額
    const products = data.reduce(
      (acc, item) => {
        const existingItem = acc.find((i) => i.product_id === item.product_id)
        if (existingItem) {
          existingItem.total_sales += item.total_sales
        } else {
          acc.push({
            product_id: item.product_id,
            product_name: item.product_name,
            total_sales: item.total_sales,
          })
        }
        return acc
      },
      [] as Array<{
        product_id: string
        product_name: string
        total_sales: number
      }>,
    )

    // 取前10名產品
    const topProducts = products
      .sort((a, b) => b.total_sales - a.total_sales)
      .slice(0, 10)

    // 篩選並組織資料為扁平化結構
    const topProductsData = data.filter((item) =>
      topProducts.some((p) => p.product_id === item.product_id),
    )

    // 按日期排序
    const sortedData = topProductsData.sort(
      (a, b) =>
        new Date(a.order_date).getTime() - new Date(b.order_date).getTime(),
    )

    return {
      data: sortedData,
      legend: topProducts,
    }
  })

  return {
    data: computed(() => topProductData.value.data),
    legend: computed(() => topProductData.value.legend),
    isLoading: productSalesQuery.isLoading,
    isError: productSalesQuery.isError,
    error: productSalesQuery.error,
    isSuccess: productSalesQuery.isSuccess,
    refetch: productSalesQuery.refetch,
  }
}

/**
 * 處理每小時指標資料
 */
export function useHourlyMetricsData() {
  const orderMetricsQuery = useOrderMetricsHourly()

  const hourlyMetricsData = computed(() => {
    if (!orderMetricsQuery.data.value?.length) return []

    const data = orderMetricsQuery.data.value

    // 計算每小時的累積指標
    const hourMetricsData = data.reduce((acc, item) => {
      const existingItem = acc.find((i) => i.hour === item.hour)
      if (existingItem) {
        existingItem.order_count += item.order_count
        existingItem.total_amount += item.total_amount
        existingItem.avg_order_value += item.avg_order_value
        existingItem.new_customer_order_count += item.new_customer_order_count
        existingItem.returning_customer_order_count +=
          item.returning_customer_order_count
        existingItem.new_customer_amount += item.new_customer_amount
        existingItem.returning_customer_amount += item.returning_customer_amount
      } else {
        acc.push({ ...item })
      }
      return acc
    }, [] as OrderMetricsHourly[])

    return hourMetricsData.sort((a, b) => a.hour - b.hour)
  })

  return {
    data: hourlyMetricsData,
    isLoading: orderMetricsQuery.isLoading,
    isError: orderMetricsQuery.isError,
    error: orderMetricsQuery.error,
    isSuccess: orderMetricsQuery.isSuccess,
    refetch: orderMetricsQuery.refetch,
  }
}

/**
 * 處理週末差異趨勢資料
 */
export function useWeekendDiffTrendData() {
  const orderMetricsQuery = useOrderMetricsHourly()

  const weekendDiffData = computed(() => {
    if (!orderMetricsQuery.data.value?.length) {
      return { weekendHourMetricsData: [], weekdayHourMetricsData: [] }
    }

    const data = orderMetricsQuery.data.value

    // 分離週末和平日資料
    const weekendData = data.filter((item) => item.is_weekend)
    const weekdayData = data.filter((item) => !item.is_weekend)

    const processHourMetrics = (inputData: OrderMetricsHourly[]) => {
      const hourMetricsData = inputData.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.hour === item.hour)
        if (existingItem) {
          existingItem.order_count += item.order_count
          existingItem.total_amount += item.total_amount
          existingItem.avg_order_value += item.avg_order_value
          existingItem.new_customer_order_count += item.new_customer_order_count
          existingItem.returning_customer_order_count +=
            item.returning_customer_order_count
          existingItem.new_customer_amount += item.new_customer_amount
          existingItem.returning_customer_amount +=
            item.returning_customer_amount
        } else {
          acc.push({ ...item })
        }
        return acc
      }, [] as OrderMetricsHourly[])

      return hourMetricsData.sort((a, b) => a.hour - b.hour)
    }

    return {
      weekendHourMetricsData: processHourMetrics(weekendData),
      weekdayHourMetricsData: processHourMetrics(weekdayData),
    }
  })

  return {
    data: weekendDiffData,
    isLoading: orderMetricsQuery.isLoading,
    isError: orderMetricsQuery.isError,
    error: orderMetricsQuery.error,
    isSuccess: orderMetricsQuery.isSuccess,
    refetch: orderMetricsQuery.refetch,
  }
}
