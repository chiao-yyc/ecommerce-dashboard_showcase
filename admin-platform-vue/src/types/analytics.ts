// 產品分析相關型別定義

// ABC分析相關類型
export interface ProductSalesData {
  productId: string
  productName: string
  sku?: string
  categoryId?: number
  categoryName?: string
  totalRevenue: number
  totalQuantity: number
  orderCount: number
  averageOrderValue: number
  firstOrderDate: string
  lastOrderDate: string
  imageUrl?: string
}

export interface ABCAnalysisResult {
  productId: string
  productName: string
  sku?: string
  categoryName?: string
  totalRevenue: number
  totalQuantity: number
  revenueContribution: number // 營收貢獻百分比
  cumulativeContribution: number // 累積貢獻百分比
  abcCategory: 'A' | 'B' | 'C'
  rank: number
  averageOrderValue: number
  orderCount: number
  profitMargin?: number
  imageUrl?: string
}

export interface ABCAnalysisParams {
  startDate: string
  endDate: string
  categoryId?: number
  includeInactive?: boolean
}

export interface ABCAnalysisSummary {
  totalProducts: number
  totalRevenue: number
  categoryA: {
    count: number
    percentage: number
    revenue: number
    revenuePercentage: number
  }
  categoryB: {
    count: number
    percentage: number
    revenue: number
    revenuePercentage: number
  }
  categoryC: {
    count: number
    percentage: number
    revenue: number
    revenuePercentage: number
  }
  analysisDate: string
}

// 滯銷品分析相關類型
export interface SlowMovingProduct {
  productId: string
  productName: string
  sku?: string
  categoryName?: string
  currentStock: number
  reservedQuantity: number
  freeStock: number
  lastSaleDate: string | null
  daysSinceLastSale: number
  inventoryTurnover: number // 庫存週轉率
  inventoryDays: number // 庫存天數
  totalValue: number // 庫存總價值
  recommendedAction: 'clearance' | 'discount' | 'bundle' | 'remove'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  imageUrl?: string
}

export interface SlowMovingAnalysisParams {
  minDaysSinceLastSale: number // 預設30天
  maxInventoryTurnover: number // 預設週轉率閾值
  maxInventoryDays: number // 預設庫存天數閾值 (90天)
  categoryId?: number
}

export interface SlowMovingAnalysisSummary {
  totalSlowMovingProducts: number
  totalSlowMovingValue: number
  riskDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
  recommendedActions: {
    clearance: number
    discount: number
    bundle: number
    remove: number
  }
}

// 庫存預警相關類型
export interface StockAlert {
  productId: string
  productName: string
  sku?: string
  alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'reorder_needed'
  severity: 'info' | 'warning' | 'critical'
  currentStock: number
  thresholdValue: number
  recommendedAction: string
  daysOfStock: number // 預估可銷售天數
  createdAt: string
}

export interface StockAlertSummary {
  totalAlerts: number
  criticalAlerts: number
  warningAlerts: number
  infoAlerts: number
  byType: {
    lowStock: number
    outOfStock: number
    overstock: number
    reorderNeeded: number
  }
}

// 毛利分析相關類型
export interface ProductProfitability {
  productId: string
  productName: string
  sku?: string
  categoryName?: string
  totalRevenue: number
  totalCost: number
  grossProfit: number
  grossMargin: number // 毛利率百分比
  unitsSold: number
  averageSellingPrice: number
  averageCost: number
  profitPerUnit: number
  contributionMargin: number // 貢獻毛利
  categoryRank: number
  overallRank: number
}

export interface ProfitabilityAnalysisParams {
  startDate: string
  endDate: string
  categoryId?: number
  includeCategories?: boolean
  sortBy?: 'revenue' | 'profit' | 'margin' | 'units'
}

export interface ProfitabilityAnalysisSummary {
  totalRevenue: number
  totalCost: number
  totalGrossProfit: number
  overallGrossMargin: number
  productsAnalyzed: number
  topPerformers: ProductProfitability[]
  bottomPerformers: ProductProfitability[]
}

// 基礎需求預測相關類型
export interface DemandForecast {
  productId: string
  productName: string
  forecastDate: string
  predictedDemand: number
  confidenceLevel: number // 0-1
  method: 'simple_ma' | 'weighted_ma' | 'seasonal_adjusted'
  historicalAverage: number
  trend: 'increasing' | 'decreasing' | 'stable'
  seasonalFactor?: number
}

export interface ForecastingParams {
  productId?: string
  categoryId?: number
  forecastDays: number // 預測天數
  historicalDays: number // 歷史數據天數
  method: 'simple_ma' | 'weighted_ma' | 'seasonal_adjusted'
  seasonalPeriod?: number // 季節週期（天）
}

export interface ForecastAccuracy {
  productId: string
  method: string
  mape: number // Mean Absolute Percentage Error
  mae: number // Mean Absolute Error
  rmse: number // Root Mean Square Error
  lastUpdated: string
}

// 庫存健康度相關類型
export interface InventoryHealthMetrics {
  productId: string
  productName: string
  healthScore: number // 0-100
  stockLevel: 'optimal' | 'low' | 'critical' | 'overstock'
  turnoverRate: number
  daysOfStock: number
  stockoutRisk: number // 0-1
  overstockRisk: number // 0-1
  recommendations: string[]
}

export interface InventoryHealthSummary {
  averageHealthScore: number
  totalProducts: number
  optimalStock: number
  lowStock: number
  criticalStock: number
  overstock: number
  totalInventoryValue: number
  healthyInventoryPercentage: number
}

// 產品生命週期相關類型
export interface ProductLifecycleStage {
  productId: string
  productName: string
  stage: 'introduction' | 'growth' | 'maturity' | 'decline'
  daysInCurrentStage: number
  totalProductAge: number
  salesVelocity: number
  revenueGrowthRate: number
  recommendations: string[]
  nextStageETA?: number // 預估進入下一階段的天數
}

// 共用分析參數類型
export interface BaseAnalysisParams {
  startDate: string
  endDate: string
  categoryId?: number
  productIds?: string[]
}

// API響應包裝類型
export interface AnalyticsApiResponse<T> {
  data: T
  metadata: {
    generatedAt: string
    parametersUsed: Record<string, any>
    executionTime: number
    recordCount: number
  }
}

// 儀表板數據類型
export interface ProductAnalyticsDashboard {
  abcAnalysis: ABCAnalysisSummary
  slowMovingProducts: SlowMovingAnalysisSummary
  stockAlerts: StockAlertSummary
  profitability: ProfitabilityAnalysisSummary
  inventoryHealth: InventoryHealthSummary
  lastUpdated: string
}

// 圖表數據類型
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
  category?: string
}

export interface TrendChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color?: string
    borderColor?: string
    backgroundColor?: string
  }[]
}

export interface PieChartData {
  labels: string[]
  data: number[]
  colors?: string[]
}

export interface BarChartData {
  categories: string[]
  series: {
    name: string
    data: number[]
    color?: string
  }[]
}
