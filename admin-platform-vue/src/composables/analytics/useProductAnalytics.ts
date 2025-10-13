import { ref, computed } from 'vue'
import { convertToISOString } from '@/utils'
import type {
  ProductSalesData,
  ABCAnalysisResult,
  ABCAnalysisParams,
  ABCAnalysisSummary,
  SlowMovingProduct,
  SlowMovingAnalysisParams,
  SlowMovingAnalysisSummary,
  StockAlert,
  StockAlertSummary,
} from '@/types/productAnalytics'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/utils/logger'
// import { ProductApiService } from '@/api/services/ProductApiService'

const log = createModuleLogger('Composable', 'ProductAnalytics')

export function useProductAnalytics() {
  // const productService = new ProductApiService(supabase)

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ABC分析功能
  const abcAnalysisResults = ref<ABCAnalysisResult[]>([])
  const abcAnalysisSummary = ref<ABCAnalysisSummary | null>(null)

  /**
   * 執行ABC分析
   * 基於帕累托原則：80%的營收來自20%的產品
   */
  async function performABCAnalysis(params: ABCAnalysisParams) {
    try {
      isLoading.value = true
      error.value = null

      // 獲取產品銷售數據
      const salesData = await getProductSalesData(params)

      if (salesData.length === 0) {
        abcAnalysisResults.value = []
        abcAnalysisSummary.value = null
        return
      }

      // 計算ABC分類
      const results = calculateABCClassification(salesData)
      abcAnalysisResults.value = results

      // 生成摘要
      abcAnalysisSummary.value = generateABCSummary(results)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '分析失敗'
      // 🚨 實際系統錯誤：ABC 分析計算失敗
      log.error('🔥 [Product Analytics] ABC分析錯誤:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 計算ABC分類的核心算法
   */
  function calculateABCClassification(
    salesData: ProductSalesData[],
  ): ABCAnalysisResult[] {
    // 1. 按營收排序（降序）
    const sortedData = [...salesData].sort(
      (a, b) => b.totalRevenue - a.totalRevenue,
    )

    // 2. 計算總營收
    const totalRevenue = sortedData.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    )

    // 3. 計算累積貢獻度並分類
    let cumulativeRevenue = 0
    const results: ABCAnalysisResult[] = []

    sortedData.forEach((item, index) => {
      cumulativeRevenue += item.totalRevenue
      const revenueContribution = (item.totalRevenue / totalRevenue) * 100
      const cumulativeContribution = (cumulativeRevenue / totalRevenue) * 100

      // ABC分類規則
      let abcCategory: 'A' | 'B' | 'C'
      if (cumulativeContribution <= 80) {
        abcCategory = 'A'
      } else if (cumulativeContribution <= 95) {
        abcCategory = 'B'
      } else {
        abcCategory = 'C'
      }

      results.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        categoryName: item.categoryName,
        totalRevenue: item.totalRevenue,
        totalQuantity: item.totalQuantity,
        revenueContribution,
        cumulativeContribution,
        abcCategory,
        rank: index + 1,
        averageOrderValue: item.averageOrderValue,
        orderCount: item.orderCount,
        imageUrl: item.imageUrl,
      })
    })

    return results
  }

  /**
   * 生成ABC分析摘要
   */
  function generateABCSummary(
    results: ABCAnalysisResult[],
  ): ABCAnalysisSummary {
    const totalProducts = results.length
    const totalRevenue = results.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    )

    const categoryA = results.filter((item) => item.abcCategory === 'A')
    const categoryB = results.filter((item) => item.abcCategory === 'B')
    const categoryC = results.filter((item) => item.abcCategory === 'C')

    return {
      totalProducts,
      totalRevenue,
      categoryA: {
        count: categoryA.length,
        percentage: (categoryA.length / totalProducts) * 100,
        revenue: categoryA.reduce((sum, item) => sum + item.totalRevenue, 0),
        revenuePercentage:
          (categoryA.reduce((sum, item) => sum + item.totalRevenue, 0) /
            totalRevenue) *
          100,
      },
      categoryB: {
        count: categoryB.length,
        percentage: (categoryB.length / totalProducts) * 100,
        revenue: categoryB.reduce((sum, item) => sum + item.totalRevenue, 0),
        revenuePercentage:
          (categoryB.reduce((sum, item) => sum + item.totalRevenue, 0) /
            totalRevenue) *
          100,
      },
      categoryC: {
        count: categoryC.length,
        percentage: (categoryC.length / totalProducts) * 100,
        revenue: categoryC.reduce((sum, item) => sum + item.totalRevenue, 0),
        revenuePercentage:
          (categoryC.reduce((sum, item) => sum + item.totalRevenue, 0) /
            totalRevenue) *
          100,
      },
      analysisDate: convertToISOString(new Date()),
    }
  }

  // 滯銷品分析功能
  const slowMovingProducts = ref<SlowMovingProduct[]>([])
  const slowMovingSummary = ref<SlowMovingAnalysisSummary | null>(null)

  /**
   * 執行滯銷品分析
   */
  async function analyzeSlowMovingProducts(params: SlowMovingAnalysisParams) {
    try {
      isLoading.value = true
      error.value = null

      // 基於真實資料庫進行滯銷品分析
      const slowMoving = await analyzeSlowMovingFromDatabase(params)

      slowMovingProducts.value = slowMoving

      // 生成摘要
      slowMovingSummary.value = generateSlowMovingSummary(slowMoving)
    } catch (err) {
      // 🚨 實際系統錯誤：滯銷品分析計算失敗
      log.error('🔥 [Product Analytics] 滯銷品分析錯誤:', err)
      error.value = err instanceof Error ? err.message : '滯銷品分析失敗'
      slowMovingProducts.value = []
      slowMovingSummary.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 識別滯銷品的核心算法
   */
  // function identifySlowMovingProducts( // 未使用
  // function _identifySlowMovingProducts( // 未使用
  /* const __unused_identifySlowMovingProducts = (
    productsWithStock: any[],
    salesHistory: any[],
    params: SlowMovingAnalysisParams,
  ): SlowMovingProduct[] => {
    const slowMoving: SlowMovingProduct[] = []
    const currentDate = new Date()

    productsWithStock.forEach((product) => {
      // 找到該產品的最後銷售記錄
      const productSales = salesHistory.filter(
        (sale) => sale.productId === product.productId,
      )
      const lastSale =
        productSales.length > 0
          ? new Date(
              Math.max(
                ...productSales.map((sale) =>
                  new Date(sale.orderDate).getTime(),
                ),
              ),
            )
          : null

      const daysSinceLastSale = lastSale
        ? Math.floor(
            (currentDate.getTime() - lastSale.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999 // 假設從未銷售

      // 計算庫存週轉率和庫存天數
      const totalSold = productSales.reduce(
        (sum, sale) => sum + sale.quantity,
        0,
      )
      const inventoryTurnover =
        totalSold > 0 ? totalSold / (product.totalStock || 1) : 0
      const inventoryDays =
        inventoryTurnover > 0 ? 365 / inventoryTurnover : 999

      // 判斷是否為滯銷品
      const isSlowMoving =
        daysSinceLastSale >= params.minDaysSinceLastSale ||
        inventoryTurnover <= params.maxInventoryTurnover ||
        inventoryDays >= params.maxInventoryDays

      if (isSlowMoving && product.totalStock > 0) {
        // 判斷風險等級
        let riskLevel: 'low' | 'medium' | 'high' | 'critical'
        if (daysSinceLastSale >= 180 || inventoryDays >= 300) {
          riskLevel = 'critical'
        } else if (daysSinceLastSale >= 90 || inventoryDays >= 180) {
          riskLevel = 'high'
        } else if (daysSinceLastSale >= 60 || inventoryDays >= 120) {
          riskLevel = 'medium'
        } else {
          riskLevel = 'low'
        }

        // 建議處理方案
        let recommendedAction: 'clearance' | 'discount' | 'bundle' | 'remove'
        if (riskLevel === 'critical') {
          recommendedAction = 'clearance'
        } else if (riskLevel === 'high') {
          recommendedAction = 'discount'
        } else if (riskLevel === 'medium') {
          recommendedAction = 'bundle'
        } else {
          recommendedAction = 'remove'
        }

        slowMoving.push({
          productId: product.productId,
          productName: product.name,
          sku: product.sku,
          categoryName: product.categoryName,
          currentStock: product.totalStock,
          reservedQuantity: product.reservedQuantity || 0,
          freeStock: product.freeStock || product.totalStock,
          lastSaleDate: lastSale?.toISOString() || null,
          daysSinceLastSale,
          inventoryTurnover,
          inventoryDays,
          totalValue: (product.totalStock || 0) * (product.price || 0),
          recommendedAction,
          riskLevel,
          imageUrl: product.imageUrl,
        })
      }
    })

    return slowMoving.sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale)
  } */

  /**
   * 生成滯銷品分析摘要
   */
  function generateSlowMovingSummary(
    slowMoving: SlowMovingProduct[],
  ): SlowMovingAnalysisSummary {
    const totalSlowMovingValue = slowMoving.reduce(
      (sum, item) => sum + item.totalValue,
      0,
    )

    return {
      totalSlowMovingProducts: slowMoving.length,
      totalSlowMovingValue,
      riskDistribution: {
        critical: slowMoving.filter((item) => item.riskLevel === 'critical')
          .length,
        high: slowMoving.filter((item) => item.riskLevel === 'high').length,
        medium: slowMoving.filter((item) => item.riskLevel === 'medium').length,
        low: slowMoving.filter((item) => item.riskLevel === 'low').length,
      },
      recommendedActions: {
        clearance: slowMoving.filter(
          (item) => item.recommendedAction === 'clearance',
        ).length,
        discount: slowMoving.filter(
          (item) => item.recommendedAction === 'discount',
        ).length,
        bundle: slowMoving.filter((item) => item.recommendedAction === 'bundle')
          .length,
        remove: slowMoving.filter((item) => item.recommendedAction === 'remove')
          .length,
      },
    }
  }

  // 庫存預警功能
  const stockAlerts = ref<StockAlert[]>([])
  const stockAlertSummary = ref<StockAlertSummary | null>(null)

  /**
   * 生成庫存預警
   */
  async function generateStockAlerts() {
    try {
      isLoading.value = true
      error.value = null

      // 基於真實資料庫進行庫存預警
      const alerts = await generateStockAlertsFromDatabase()

      stockAlerts.value = alerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })

      stockAlertSummary.value = generateStockAlertSummary(alerts)
    } catch (err) {
      // 🚨 實際系統錯誤：庫存預警生成失敗
      log.error('🔥 [Product Analytics] 庫存預警錯誤:', err)
      error.value = err instanceof Error ? err.message : '庫存預警失敗'
      stockAlerts.value = []
      stockAlertSummary.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 檢查單個產品的庫存水位
   */
  // function checkStockLevels(product: any): StockAlert[] { // 未使用
  // function _checkStockLevels(product: any): StockAlert[] { // 未使用
  /* const __unused_checkStockLevels = (product: any): StockAlert[] => {
    const alerts: StockAlert[] = []
    const currentStock = product.totalStock || 0
    const threshold = product.stockThreshold || 10
    const averageDailySales = calculateAverageDailySales(product.productId)
    const daysOfStock =
      averageDailySales > 0 ? Math.floor(currentStock / averageDailySales) : 999

    // 零庫存預警
    if (currentStock === 0) {
      alerts.push({
        productId: product.productId,
        productName: product.name,
        sku: product.sku,
        alertType: 'out_of_stock',
        severity: 'critical',
        currentStock,
        thresholdValue: 0,
        recommendedAction: '立即補貨 - 產品已零庫存',
        daysOfStock: 0,
        createdAt: convertToISOString(new Date()),
      })
    }
    // 低庫存預警
    else if (currentStock <= threshold) {
      alerts.push({
        productId: product.productId,
        productName: product.name,
        sku: product.sku,
        alertType: 'low_stock',
        severity: currentStock <= threshold * 0.5 ? 'critical' : 'warning',
        currentStock,
        thresholdValue: threshold,
        recommendedAction: `建議補貨 - 庫存低於安全水位 (${threshold})`,
        daysOfStock,
        createdAt: convertToISOString(new Date()),
      })
    }
    // 過量庫存預警（基於銷售速度）
    else if (daysOfStock > 90 && currentStock > threshold * 5) {
      alerts.push({
        productId: product.productId,
        productName: product.name,
        sku: product.sku,
        alertType: 'overstock',
        severity: 'info',
        currentStock,
        thresholdValue: threshold * 5,
        recommendedAction: `考慮促銷 - 庫存過多，預估可銷售 ${daysOfStock} 天`,
        daysOfStock,
        createdAt: convertToISOString(new Date()),
      })
    }

    return alerts
  } */

  /**
   * 計算平均日銷量（簡化版本）
   */
  /* function calculateAverageDailySales(_productId: string): number {
    // 這裡應該從歷史銷售數據計算
    // 暫時返回假設值，實際應該從資料庫查詢
    return 1 // 假設每日銷售1件
  } */

  /**
   * 生成庫存預警摘要
   */
  function generateStockAlertSummary(alerts: StockAlert[]): StockAlertSummary {
    return {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter((alert) => alert.severity === 'critical')
        .length,
      warningAlerts: alerts.filter((alert) => alert.severity === 'warning')
        .length,
      infoAlerts: alerts.filter((alert) => alert.severity === 'info').length,
      byType: {
        lowStock: alerts.filter((alert) => alert.alertType === 'low_stock')
          .length,
        outOfStock: alerts.filter((alert) => alert.alertType === 'out_of_stock')
          .length,
        overstock: alerts.filter((alert) => alert.alertType === 'overstock')
          .length,
        reorderNeeded: alerts.filter(
          (alert) => alert.alertType === 'reorder_needed',
        ).length,
      },
    }
  }

  // 輔助函數：基於真實 order_items 和 products 表獲取銷售數據
  async function getProductSalesData(
    params: ABCAnalysisParams,
  ): Promise<ProductSalesData[]> {
    try {
      // 直接查詢 order_items，關聯 orders 和 products 表
      const { data, error } = await supabase
        .from('order_items')
        .select(
          `
          product_id,
          quantity,
          unit_price,
          products!inner(
            id,
            name,
            category_id,
            categories(name)
          ),
          orders!inner(
            id,
            created_at,
            status
          )
        `,
        )
        .gte('orders.created_at', params.startDate)
        .lte('orders.created_at', params.endDate)
        .in('orders.status', ['completed', 'delivered', 'shipped', 'processing'])

      if (error) {
        // 🚨 實際系統錯誤：資料庫查詢失敗
        log.error('🔥 [Product Analytics] 銷售數據查詢失敗:', error)
        throw new Error(error.message)
      }

      if (!data || data.length === 0) {
        // 💡 正常業務狀態：查詢期間無銷售數據（非系統錯誤）
        return []
      }

      // 按產品分組聚合數據
      const productSalesMap = new Map<string, any>()

      data.forEach((item: any) => {
        const productId = item.product_id
        const product = item.products
        const order = item.orders

        if (!productSalesMap.has(productId)) {
          productSalesMap.set(productId, {
            productId,
            productName: product.name || `產品 ${productId}`,
            sku: '',
            categoryId: product.category_id,
            categoryName: product.categories?.name || '未分類',
            totalRevenue: 0,
            totalQuantity: 0,
            orderCount: new Set(),
            firstOrderDate: order.created_at,
            lastOrderDate: order.created_at,
            imageUrl: '',
          })
        }

        const productData = productSalesMap.get(productId)
        productData.totalRevenue +=
          parseFloat(item.unit_price) * parseInt(item.quantity)
        productData.totalQuantity += parseInt(item.quantity)
        productData.orderCount.add(order.id)

        // 更新日期範圍
        if (order.created_at < productData.firstOrderDate) {
          productData.firstOrderDate = order.created_at
        }
        if (order.created_at > productData.lastOrderDate) {
          productData.lastOrderDate = order.created_at
        }
      })

      // 轉換數據格式
      const results = Array.from(productSalesMap.values()).map(
        (product: any) => ({
          productId: product.productId,
          productName: product.productName,
          sku: product.sku,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          totalRevenue: product.totalRevenue,
          totalQuantity: product.totalQuantity,
          orderCount: product.orderCount.size,
          averageOrderValue:
            product.orderCount.size > 0
              ? product.totalRevenue / product.orderCount.size
              : 0,
          firstOrderDate: product.firstOrderDate,
          lastOrderDate: product.lastOrderDate,
          imageUrl: product.imageUrl,
        }),
      )

      return results
    } catch (err) {
      log.error('無法獲取真實銷售數據:', err)
      return []
    }
  }

  // 新增：基於真實資料庫的滯銷品分析
  async function analyzeSlowMovingFromDatabase(
    params: SlowMovingAnalysisParams,
  ): Promise<SlowMovingProduct[]> {
    try {
      // 查詢最近期間內的庫存異動記錄
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - params.minDaysSinceLastSale)

      // 先簡化查詢，逐步測試欄位
      const { data: inventoryLogs, error: logsError } = await supabase
        .from('inventory_logs')
        .select(
          `
          inventory_id,
          type,
          quantity,
          created_at,
          inventories!inner(
            product_id,
            products!inner(
              id,
              name,
              price,
              category_id,
              image_url,
              categories(name)
            )
          )
        `,
        )
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('type', 'out') // 只看出庫記錄

      if (logsError) {
        log.warn('查詢inventory_logs失敗，將僅基於當前庫存進行分析', { error: logsError.message })
        // 即使inventory_logs查詢失敗，仍然可以基於庫存狀態進行分析
      }

      // 獲取所有產品的當前庫存
      const { data: allProducts, error: productsError } = await supabase
        .from('product_with_current_stock')
        .select('*')

      if (productsError) {
        log.error('查詢product_with_current_stock失敗:', productsError)
        return []
      }

      if (!allProducts || allProducts.length === 0) {
        return []
      }

      // 分析每個產品的庫存週轉情況
      const productMovementMap = new Map()

      // 統計每個產品的出庫次數和數量（如果有inventory_logs數據）
      if (!logsError && inventoryLogs && inventoryLogs.length > 0) {
        inventoryLogs.forEach((log: any) => {
          const productId = log.inventories.product_id
          const product = log.inventories.products

          if (!productMovementMap.has(productId)) {
            productMovementMap.set(productId, {
              productId,
              productName: product.name,
              categoryName: product.categories?.name || '未分類',
              sku: '', // SKU欄位暫時留空，等確認inventories表結構
              price: product.price,
              imageUrl: product.image_url,
              totalOutboundQty: 0,
              outboundCount: 0,
              lastOutboundDate: null,
              currentStock: 0,
            })
          }

          const productData = productMovementMap.get(productId)
          productData.totalOutboundQty += Math.abs(log.quantity || 0)
          productData.outboundCount += 1

          if (
            !productData.lastOutboundDate ||
            log.created_at > productData.lastOutboundDate
          ) {
            productData.lastOutboundDate = log.created_at
          }
        })
      }

      // 結合當前庫存信息
      allProducts?.forEach((product: any) => {
        const productId = product.product_id

        if (!productMovementMap.has(productId)) {
          // 沒有出庫記錄的產品，可能是滯銷品
          productMovementMap.set(productId, {
            productId,
            productName: product.name,
            categoryName: product.category_name || '未分類',
            sku: '', // SKU欄位暫時留空
            price: product.price,
            imageUrl: product.image_url,
            totalOutboundQty: 0,
            outboundCount: 0,
            lastOutboundDate: null,
            currentStock: product.free_stock || 0,
          })
        } else {
          const productData = productMovementMap.get(productId)
          productData.currentStock = product.free_stock || 0
        }
      })

      // 分析滯銷品
      const slowMovingProducts: SlowMovingProduct[] = []
      const currentDate = new Date()

      productMovementMap.forEach((product: any) => {
        const daysSinceLastSale = product.lastOutboundDate
          ? Math.floor(
              (currentDate.getTime() -
                new Date(product.lastOutboundDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 999

        // 計算庫存週轉率（簡化版：出庫次數除以分析期間）
        const analysisPeriodDays = params.minDaysSinceLastSale
        const inventoryTurnover =
          product.outboundCount / (analysisPeriodDays / 30) // 每月週轉次數
        const inventoryDays =
          inventoryTurnover > 0 ? 30 / inventoryTurnover : 999

        // 判斷是否為滯銷品
        // 如果沒有庫存異動記錄，則視為長期無異動（潛在滯銷品）
        const isSlowMoving =
          daysSinceLastSale >= params.minDaysSinceLastSale ||
          inventoryTurnover <= params.maxInventoryTurnover ||
          inventoryDays >= params.maxInventoryDays ||
          (product.outboundCount === 0 && product.currentStock > 0) // 無異動且有庫存

        if (isSlowMoving && product.currentStock > 0) {
          // 風險等級評估
          let riskLevel: 'low' | 'medium' | 'high' | 'critical'
          if (daysSinceLastSale >= 180 || inventoryDays >= 300) {
            riskLevel = 'critical'
          } else if (daysSinceLastSale >= 90 || inventoryDays >= 180) {
            riskLevel = 'high'
          } else if (daysSinceLastSale >= 60 || inventoryDays >= 120) {
            riskLevel = 'medium'
          } else {
            riskLevel = 'low'
          }

          // 建議處理方案
          let recommendedAction: 'clearance' | 'discount' | 'bundle' | 'remove'
          if (riskLevel === 'critical') {
            recommendedAction = 'clearance'
          } else if (riskLevel === 'high') {
            recommendedAction = 'discount'
          } else if (riskLevel === 'medium') {
            recommendedAction = 'bundle'
          } else {
            recommendedAction = 'remove'
          }

          slowMovingProducts.push({
            productId: product.productId,
            productName: product.productName,
            sku: product.sku,
            categoryName: product.categoryName,
            currentStock: product.currentStock,
            reservedQuantity: 0,
            freeStock: product.currentStock,
            lastSaleDate: product.lastOutboundDate,
            daysSinceLastSale,
            inventoryTurnover,
            inventoryDays,
            totalValue: product.currentStock * (product.price || 0),
            recommendedAction,
            riskLevel,
            imageUrl: product.imageUrl,
          })
        }
      })

      return slowMovingProducts.sort(
        (a, b) => b.daysSinceLastSale - a.daysSinceLastSale,
      )
    } catch (err) {
      log.error('分析滯銷品失敗:', err)
      return []
    }
  }

  // 新增：基於真實資料庫的庫存預警
  async function generateStockAlertsFromDatabase(): Promise<StockAlert[]> {
    try {
      const { data: inventoryStatus, error } = await supabase
        .from('product_with_current_stock')
        .select('*')

      if (error) {
        log.error('查詢庫存狀態失敗:', error)
        return []
      }

      const alerts: StockAlert[] = []

      inventoryStatus?.forEach((product: any) => {
        const currentStock = product.free_stock || 0
        const threshold = product.stock_threshold || 10

        // 零庫存預警
        if (currentStock === 0) {
          alerts.push({
            productId: product.product_id,
            productName: product.name,
            sku: product.sku || '',
            alertType: 'out_of_stock',
            severity: 'critical',
            currentStock,
            thresholdValue: 0,
            recommendedAction: '立即補貨 - 產品已零庫存',
            daysOfStock: 0,
            createdAt: convertToISOString(new Date()),
          })
        }
        // 低庫存預警
        else if (currentStock <= threshold) {
          alerts.push({
            productId: product.product_id,
            productName: product.name,
            sku: product.sku || '',
            alertType: 'low_stock',
            severity: currentStock <= threshold * 0.5 ? 'critical' : 'warning',
            currentStock,
            thresholdValue: threshold,
            recommendedAction: `建議補貨 - 庫存低於安全水位 (${threshold})`,
            daysOfStock: currentStock, // 簡化：假設每日銷售1件
            createdAt: convertToISOString(new Date()),
          })
        }
        // 過量庫存預警（庫存超過安全水位5倍且數量較大）
        else if (currentStock > threshold * 5 && currentStock > 100) {
          alerts.push({
            productId: product.product_id,
            productName: product.name,
            sku: product.sku || '',
            alertType: 'overstock',
            severity: 'info',
            currentStock,
            thresholdValue: threshold * 5,
            recommendedAction: `考慮促銷 - 庫存過多，超過安全水位 ${(currentStock / threshold).toFixed(1)} 倍`,
            daysOfStock: currentStock, // 簡化估算
            createdAt: convertToISOString(new Date()),
          })
        }
      })

      return alerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
    } catch (err) {
      log.error('生成庫存預警失敗:', err)
      return []
    }
  }

  // 計算屬性
  const totalABCProducts = computed(() => abcAnalysisResults.value.length)
  const categoryAProducts = computed(() =>
    abcAnalysisResults.value.filter((p) => p.abcCategory === 'A'),
  )
  const categoryBProducts = computed(() =>
    abcAnalysisResults.value.filter((p) => p.abcCategory === 'B'),
  )
  const categoryProducts = computed(() =>
    abcAnalysisResults.value.filter((p) => p.abcCategory === 'C'),
  )

  const criticalStockAlerts = computed(() =>
    stockAlerts.value.filter((alert) => alert.severity === 'critical'),
  )
  const warningStockAlerts = computed(() =>
    stockAlerts.value.filter((alert) => alert.severity === 'warning'),
  )

  return {
    // 狀態
    isLoading,
    error,

    // ABC分析
    abcAnalysisResults,
    abcAnalysisSummary,
    performABCAnalysis,

    // 滯銷品分析
    slowMovingProducts,
    slowMovingSummary,
    analyzeSlowMovingProducts,

    // 庫存預警
    stockAlerts,
    stockAlertSummary,
    generateStockAlerts,

    // 計算屬性
    totalABCProducts,
    categoryAProducts,
    categoryBProducts,
    categoryProducts,
    criticalStockAlerts,
    warningStockAlerts,
  }
}
