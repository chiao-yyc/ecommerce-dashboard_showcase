import { ref, computed } from 'vue'
import type {
  ProductProfitability,
  ProfitabilityAnalysisParams,
  ProfitabilityAnalysisSummary
} from '@/types/analytics'
import { supabase } from '@/lib/supabase'
import { ProductApiService } from '@/api/services/ProductApiService'

export function useProfitabilityAnalysis() {
  const productService = new ProductApiService(supabase)
  
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const profitabilityResults = ref<ProductProfitability[]>([])
  const profitabilitySummary = ref<ProfitabilityAnalysisSummary | null>(null)

  /**
   * 執行毛利分析
   */
  async function analyzeProfitability(params: ProfitabilityAnalysisParams) {
    try {
      isLoading.value = true
      error.value = null

      // 獲取產品銷售和成本數據
      const salesData = await getProductSalesData(params)
      const costData = await getProductCostData(params)
      
      if (salesData.length === 0) {
        profitabilityResults.value = []
        profitabilitySummary.value = null
        return
      }

      // 計算毛利分析
      const results = calculateProfitability(salesData, costData, params)
      profitabilityResults.value = results

      // 生成摘要
      profitabilitySummary.value = generateProfitabilitySummary(results)

    } catch (err) {
      error.value = err instanceof Error ? err.message : '毛利分析失敗'
      console.error('毛利分析錯誤:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 計算產品毛利分析的核心算法
   */
  function calculateProfitability(
    salesData: any[],
    costData: any[],
    params: ProfitabilityAnalysisParams
  ): ProductProfitability[] {
    const results: ProductProfitability[] = []
    
    // 建立成本數據映射
    const costMap = new Map()
    costData.forEach(cost => {
      costMap.set(cost.productId, cost)
    })
    
    salesData.forEach(sale => {
      const cost = costMap.get(sale.productId) || { averageCost: 0, totalCost: 0 }
      
      // 計算基本毛利指標
      const totalRevenue = parseFloat(sale.totalRevenue) || 0
      const totalCost = cost.totalCost || (sale.totalQuantity * cost.averageCost) || 0
      const grossProfit = totalRevenue - totalCost
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      
      const unitsSold = parseInt(sale.totalQuantity) || 0
      const averageSellingPrice = unitsSold > 0 ? totalRevenue / unitsSold : 0
      const averageCost = cost.averageCost || 0
      const profitPerUnit = averageSellingPrice - averageCost
      
      // 貢獻毛利 = 毛利 - 分攤的固定成本（簡化為總毛利的比例）
      const contributionMargin = grossProfit * 0.8 // 假設80%為貢獻毛利
      
      results.push({
        productId: sale.productId,
        productName: sale.productName,
        sku: sale.sku,
        categoryName: sale.categoryName,
        totalRevenue,
        totalCost,
        grossProfit,
        grossMargin,
        unitsSold,
        averageSellingPrice,
        averageCost,
        profitPerUnit,
        contributionMargin,
        categoryRank: 0, // 稍後計算
        overallRank: 0   // 稍後計算
      })
    })
    
    // 排序並設置排名
    const sortBy = params.sortBy || 'profit'
    results.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue
        case 'profit':
          return b.grossProfit - a.grossProfit
        case 'margin':
          return b.grossMargin - a.grossMargin
        case 'units':
          return b.unitsSold - a.unitsSold
        default:
          return b.grossProfit - a.grossProfit
      }
    })
    
    // 設置整體排名
    results.forEach((result, index) => {
      result.overallRank = index + 1
    })
    
    // 按類別設置排名
    if (params.includeCategories) {
      const categoryGroups = new Map()
      results.forEach(result => {
        const category = result.categoryName || 'uncategorized'
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, [])
        }
        categoryGroups.get(category).push(result)
      })
      
      categoryGroups.forEach(categoryProducts => {
        categoryProducts.sort((a: ProductProfitability, b: ProductProfitability) => {
          return b.grossProfit - a.grossProfit
        })
        categoryProducts.forEach((product: ProductProfitability, index: number) => {
          product.categoryRank = index + 1
        })
      })
    }
    
    return results
  }

  /**
   * 生成毛利分析摘要
   */
  function generateProfitabilitySummary(results: ProductProfitability[]): ProfitabilityAnalysisSummary {
    const totalRevenue = results.reduce((sum, item) => sum + item.totalRevenue, 0)
    const totalCost = results.reduce((sum, item) => sum + item.totalCost, 0)
    const totalGrossProfit = totalRevenue - totalCost
    const overallGrossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0
    
    // 取前5名和後5名
    const topPerformers = results.slice(0, 5)
    const bottomPerformers = results.slice(-5).reverse()
    
    return {
      totalRevenue,
      totalCost,
      totalGrossProfit,
      overallGrossMargin,
      productsAnalyzed: results.length,
      topPerformers,
      bottomPerformers
    }
  }

  /**
   * 獲取產品銷售數據
   */
  async function getProductSalesData(params: ProfitabilityAnalysisParams) {
    try {
      const response = await productService.getProductSalesAnalysis({
        startDate: params.startDate,
        endDate: params.endDate,
        categoryId: params.categoryId
      })
      
      // 檢查是否有有效的實際數據
      if (!response || response.length === 0) {
        console.log('💰 無實際銷售數據，使用測試數據進行毛利演示')
        const { generateMockSalesData } = await import('@/utils/testAnalytics')
        return generateMockSalesData()
      }
      
      // 檢查數據品質
      const validProducts = response.filter((item: any) => 
        item.product_name && item.product_name !== 'Unknown Product'
      )
      
      if (validProducts.length === 0 || validProducts.length < response.length * 0.5) {
        console.log('💰 實際數據品質不佳（產品名稱缺失），使用測試數據進行毛利演示')
        const { generateMockSalesData } = await import('@/utils/testAnalytics')
        return generateMockSalesData()
      }
      
      console.log('💰 使用實際銷售數據進行毛利分析，共', response.length, '個產品')
      
      return response.map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name || 'Unknown Product',
        sku: item.sku || '',
        categoryId: item.category_id || null,
        categoryName: item.category_name || '',
        totalRevenue: parseFloat(item.total_revenue) || 0,
        totalQuantity: parseInt(item.total_quantity) || 0,
        orderCount: parseInt(item.order_count) || 0,
        averageOrderValue: parseFloat(item.average_order_value) || 0,
        firstOrderDate: item.first_order_date || '',
        lastOrderDate: item.last_order_date || '',
        imageUrl: item.image_url || ''
      }))
    } catch (err) {
      console.error('獲取銷售數據失敗，使用測試數據:', err)
      // 發生錯誤時也使用測試數據
      const { generateMockSalesData } = await import('@/utils/testAnalytics')
      return generateMockSalesData()
    }
  }

  /**
   * 獲取產品成本數據
   * 
   * ⚠️ 重要說明：目前資料庫中沒有成本相關欄位
   * - products表只有price（售價），沒有cost_price（成本價）
   * - 無採購成本歷史記錄表
   * - 此功能目前僅提供演示用途，使用估算成本
   * 
   * 🔧 實際使用建議：
   * 1. 在products表增加cost_price欄位
   * 2. 建立purchase_orders表記錄採購成本
   * 3. 建立cost_history表追蹤成本變化
   */
  async function getProductCostData(params: ProfitabilityAnalysisParams) {
    console.warn('⚠️ 毛利分析使用估算成本 - 資料庫中無實際成本數據')
    console.warn('建議：在products表新增cost_price欄位以提供真實毛利分析')
    
    try {
      // 目前只能使用測試數據進行演示
      const { generateMockProfitabilityData } = await import('@/utils/testAnalytics')
      const mockProfitData = generateMockProfitabilityData()
      
      console.log('📊 使用模擬成本數據進行毛利分析演示')
      
      return mockProfitData.map(item => ({
        productId: item.productId,
        averageCost: item.averageCost,
        totalCost: item.totalCost
      }))
    } catch (err) {
      console.warn('無法生成模擬成本數據，使用固定成本率估算:', err)
      
      // 最後的備用方案：使用固定成本率估算
      const salesData = await getProductSalesData(params)
      return salesData.map(sale => ({
        productId: sale.productId,
        averageCost: sale.totalRevenue * 0.65, // 假設固定成本率65%
        totalCost: sale.totalRevenue * 0.65
      }))
    }
  }

  /**
   * 按類別分析毛利
   */
  async function analyzeProfitabilityByCategory(params: ProfitabilityAnalysisParams) {
    await analyzeProfitability({ ...params, includeCategories: true })
    
    // 生成類別摘要
    const categoryMap = new Map()
    profitabilityResults.value.forEach(product => {
      const category = product.categoryName || 'uncategorized'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          categoryName: category,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          productCount: 0,
          averageMargin: 0
        })
      }
      
      const categoryData = categoryMap.get(category)
      categoryData.totalRevenue += product.totalRevenue
      categoryData.totalCost += product.totalCost
      categoryData.totalProfit += product.grossProfit
      categoryData.productCount += 1
    })
    
    // 計算類別平均毛利率
    categoryMap.forEach(categoryData => {
      categoryData.averageMargin = categoryData.totalRevenue > 0 
        ? (categoryData.totalProfit / categoryData.totalRevenue) * 100 
        : 0
    })
    
    return Array.from(categoryMap.values()).sort((a, b) => b.totalProfit - a.totalProfit)
  }

  /**
   * 獲取毛利趨勢數據
   */
  async function getProfitabilityTrend(days: number = 30) {
    // 這裡應該實現獲取指定產品的毛利趨勢
    // 按日期分組計算每日毛利
    const trendData = []
    const endDate = new Date()
    
    for (let i = days; i >= 1; i--) {
      const date = new Date(endDate)
      date.setDate(endDate.getDate() - i)
      
      // 這裡應該從實際數據計算每日毛利
      // 暫時使用模擬數據
      trendData.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.random() * 1000 + 500,
        cost: Math.random() * 600 + 300,
        profit: 0, // 將在下面計算
        margin: 0  // 將在下面計算
      })
    }
    
    // 計算毛利和毛利率
    trendData.forEach(day => {
      day.profit = day.revenue - day.cost
      day.margin = day.revenue > 0 ? (day.profit / day.revenue) * 100 : 0
    })
    
    return trendData
  }

  // 計算屬性
  const topProfitableProducts = computed(() => {
    return profitabilityResults.value
      .filter(p => p.grossProfit > 0)
      .sort((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 10)
  })

  const lowMarginProducts = computed(() => {
    return profitabilityResults.value
      .filter(p => p.grossMargin < 20) // 毛利率低於20%
      .sort((a, b) => a.grossMargin - b.grossMargin)
      .slice(0, 10)
  })

  const averageGrossMargin = computed(() => {
    if (profitabilityResults.value.length === 0) return 0
    const totalMargin = profitabilityResults.value.reduce(
      (sum, product) => sum + product.grossMargin, 0
    )
    return totalMargin / profitabilityResults.value.length
  })

  const totalRevenue = computed(() => {
    return profitabilityResults.value.reduce((sum, product) => sum + product.totalRevenue, 0)
  })

  const totalProfit = computed(() => {
    return profitabilityResults.value.reduce((sum, product) => sum + product.grossProfit, 0)
  })

  return {
    // 狀態
    isLoading,
    error,
    profitabilityResults,
    profitabilitySummary,
    
    // 方法
    analyzeProfitability,
    analyzeProfitabilityByCategory,
    getProfitabilityTrend,
    
    // 計算屬性
    topProfitableProducts,
    lowMarginProducts,
    averageGrossMargin,
    totalRevenue,
    totalProfit
  }
}