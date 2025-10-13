import { ref, computed } from 'vue'
import type {
  DemandForecast,
  ForecastingParams,
  ForecastAccuracy,
  ChartDataPoint
} from '@/types/analytics'

export function useBasicForecasting() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  const forecasts = ref<DemandForecast[]>([])
  const forecastAccuracy = ref<ForecastAccuracy[]>([])

  /**
   * 基礎需求預測 - 使用移動平均法
   */
  async function generateDemandForecast(params: ForecastingParams) {
    try {
      isLoading.value = true
      error.value = null

      // 獲取歷史銷售數據
      const historicalData = await getHistoricalSalesData(params)
      
      if (historicalData.length === 0) {
        forecasts.value = []
        return
      }

      // 根據選擇的方法進行預測
      const forecastResults = await performForecasting(historicalData, params)
      forecasts.value = forecastResults

      // 計算預測準確度（如果有足夠的歷史數據）
      if (historicalData.length > params.forecastDays) {
        const accuracy = calculateForecastAccuracy(historicalData, params)
        forecastAccuracy.value = accuracy
      }

    } catch (err) {
      error.value = err instanceof Error ? err.message : '預測失敗'
      console.error('需求預測錯誤:', err)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 執行預測計算
   */
  async function performForecasting(
    historicalData: ChartDataPoint[],
    params: ForecastingParams
  ): Promise<DemandForecast[]> {
    const forecasts: DemandForecast[] = []
    const startDate = new Date()
    
    for (let i = 1; i <= params.forecastDays; i++) {
      const forecastDate = new Date(startDate)
      forecastDate.setDate(startDate.getDate() + i)
      
      let predictedDemand: number
      let confidenceLevel: number
      let trend: 'increasing' | 'decreasing' | 'stable'
      let seasonalFactor: number | undefined

      switch (params.method) {
        case 'simple_ma':
          const simpleMA = calculateSimpleMovingAverage(historicalData, 7) // 7天移動平均
          predictedDemand = Math.round(simpleMA)
          confidenceLevel = calculateConfidenceLevel(historicalData, 'simple_ma')
          trend = calculateTrend(historicalData)
          break

        case 'weighted_ma':
          const weightedMA = calculateWeightedMovingAverage(historicalData, 7)
          predictedDemand = Math.round(weightedMA)
          confidenceLevel = calculateConfidenceLevel(historicalData, 'weighted_ma')
          trend = calculateTrend(historicalData)
          break

        case 'seasonal_adjusted':
          const baselineMA = calculateSimpleMovingAverage(historicalData, 7)
          seasonalFactor = calculateSeasonalFactor(historicalData, forecastDate, params.seasonalPeriod || 30)
          predictedDemand = Math.round(baselineMA * seasonalFactor)
          confidenceLevel = calculateConfidenceLevel(historicalData, 'seasonal_adjusted')
          trend = calculateTrend(historicalData)
          break

        default:
          predictedDemand = Math.round(calculateSimpleMovingAverage(historicalData, 7))
          confidenceLevel = 0.6
          trend = 'stable'
      }

      forecasts.push({
        productId: params.productId || 'all',
        productName: 'Product Name', // 實際應該從產品數據獲取
        forecastDate: forecastDate.toISOString().split('T')[0],
        predictedDemand: Math.max(0, predictedDemand), // 確保預測值不為負
        confidenceLevel,
        method: params.method,
        historicalAverage: calculateSimpleMovingAverage(historicalData, historicalData.length),
        trend,
        seasonalFactor
      })
    }
    
    return forecasts
  }

  /**
   * 計算簡單移動平均
   */
  function calculateSimpleMovingAverage(data: ChartDataPoint[], period: number): number {
    if (data.length === 0) return 0
    
    const recentData = data.slice(-period)
    const sum = recentData.reduce((acc, point) => acc + point.value, 0)
    return sum / recentData.length
  }

  /**
   * 計算加權移動平均
   */
  function calculateWeightedMovingAverage(data: ChartDataPoint[], period: number): number {
    if (data.length === 0) return 0
    
    const recentData = data.slice(-period)
    let weightedSum = 0
    let totalWeight = 0
    
    recentData.forEach((point, index) => {
      const weight = index + 1 // 較新的數據權重更高
      weightedSum += point.value * weight
      totalWeight += weight
    })
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * 計算季節性因子
   */
  function calculateSeasonalFactor(
    data: ChartDataPoint[],
    targetDate: Date,
    seasonalPeriod: number
  ): number {
    if (data.length < seasonalPeriod * 2) return 1 // 數據不足，不做季節性調整
    
    const targetDayOfPeriod = targetDate.getDate() % seasonalPeriod
    
    // 找出歷史上同一週期位置的數據
    const samePeriodData = data.filter((point, index) => {
      const pointDate = new Date(point.date)
      return pointDate.getDate() % seasonalPeriod === targetDayOfPeriod
    })
    
    if (samePeriodData.length === 0) return 1
    
    // 計算該週期位置的平均值
    const periodAverage = samePeriodData.reduce((sum, point) => sum + point.value, 0) / samePeriodData.length
    
    // 計算整體平均值
    const overallAverage = data.reduce((sum, point) => sum + point.value, 0) / data.length
    
    // 季節性因子 = 週期平均值 / 整體平均值
    return overallAverage > 0 ? periodAverage / overallAverage : 1
  }

  /**
   * 計算趨勢方向
   */
  function calculateTrend(data: ChartDataPoint[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) return 'stable'
    
    const recentPeriod = Math.min(7, Math.floor(data.length / 2))
    const recentData = data.slice(-recentPeriod)
    const earlierData = data.slice(-(recentPeriod * 2), -recentPeriod)
    
    if (earlierData.length === 0) return 'stable'
    
    const recentAverage = recentData.reduce((sum, point) => sum + point.value, 0) / recentData.length
    const earlierAverage = earlierData.reduce((sum, point) => sum + point.value, 0) / earlierData.length
    
    const changeRate = (recentAverage - earlierAverage) / earlierAverage
    
    if (changeRate > 0.1) return 'increasing'
    if (changeRate < -0.1) return 'decreasing'
    return 'stable'
  }

  /**
   * 計算預測信心度
   */
  function calculateConfidenceLevel(data: ChartDataPoint[], method: string): number {
    if (data.length < 7) return 0.3 // 數據不足，信心度較低
    
    // 計算數據的變異係數
    const values = data.map(point => point.value)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const standardDeviation = Math.sqrt(variance)
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1
    
    // 基礎信心度（變異係數越小，信心度越高）
    let baseConfidence = Math.max(0.3, 1 - coefficientOfVariation)
    
    // 根據預測方法調整信心度
    switch (method) {
      case 'simple_ma':
        baseConfidence *= 0.8
        break
      case 'weighted_ma':
        baseConfidence *= 0.9
        break
      case 'seasonal_adjusted':
        baseConfidence *= 0.95
        break
    }
    
    // 根據數據量調整信心度
    const dataQualityFactor = Math.min(1, data.length / 30) // 30天以上的數據認為是充足的
    
    return Math.min(0.95, baseConfidence * dataQualityFactor)
  }

  /**
   * 計算預測準確度
   */
  function calculateForecastAccuracy(
    historicalData: ChartDataPoint[],
    params: ForecastingParams
  ): ForecastAccuracy[] {
    const accuracyResults: ForecastAccuracy[] = []
    
    if (params.productId) {
      // 單個產品的準確度計算
      const accuracy = calculateSingleProductAccuracy(historicalData, params)
      accuracyResults.push(accuracy)
    }
    
    return accuracyResults
  }

  /**
   * 計算單個產品的預測準確度
   */
  function calculateSingleProductAccuracy(
    data: ChartDataPoint[],
    params: ForecastingParams
  ): ForecastAccuracy {
    const testPeriod = params.forecastDays
    const trainingData = data.slice(0, -testPeriod)
    const actualData = data.slice(-testPeriod)
    
    // 使用訓練數據生成預測
    const predictions: number[] = []
    for (let i = 0; i < testPeriod; i++) {
      let prediction: number
      
      switch (params.method) {
        case 'simple_ma':
          prediction = calculateSimpleMovingAverage(trainingData, 7)
          break
        case 'weighted_ma':
          prediction = calculateWeightedMovingAverage(trainingData, 7)
          break
        case 'seasonal_adjusted':
          const baseMA = calculateSimpleMovingAverage(trainingData, 7)
          const seasonalFactor = calculateSeasonalFactor(
            trainingData,
            new Date(actualData[i].date),
            params.seasonalPeriod || 30
          )
          prediction = baseMA * seasonalFactor
          break
        default:
          prediction = calculateSimpleMovingAverage(trainingData, 7)
      }
      
      predictions.push(prediction)
    }
    
    // 計算誤差指標
    const errors = actualData.map((actual, index) => ({
      actual: actual.value,
      predicted: predictions[index],
      error: actual.value - predictions[index],
      absoluteError: Math.abs(actual.value - predictions[index]),
      percentageError: actual.value > 0 ? Math.abs((actual.value - predictions[index]) / actual.value) * 100 : 0
    }))
    
    // MAPE (Mean Absolute Percentage Error)
    const mape = errors.reduce((sum, error) => sum + error.percentageError, 0) / errors.length
    
    // MAE (Mean Absolute Error)
    const mae = errors.reduce((sum, error) => sum + error.absoluteError, 0) / errors.length
    
    // RMSE (Root Mean Square Error)
    const mse = errors.reduce((sum, error) => sum + Math.pow(error.error, 2), 0) / errors.length
    const rmse = Math.sqrt(mse)
    
    return {
      productId: params.productId || 'all',
      method: params.method,
      mape,
      mae,
      rmse,
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * 獲取歷史銷售數據
   */
  async function getHistoricalSalesData(params: ForecastingParams): Promise<ChartDataPoint[]> {
    // 這裡應該調用實際的API來獲取歷史銷售數據
    // 現在返回模擬數據用於演示
    const mockData: ChartDataPoint[] = []
    const endDate = new Date()
    
    for (let i = params.historicalDays; i >= 1; i--) {
      const date = new Date(endDate)
      date.setDate(endDate.getDate() - i)
      
      // 生成模擬的銷售數據（帶有趨勢和隨機波動）
      const baseValue = 10
      const trendValue = Math.sin(i / 10) * 2 // 簡單的週期性趨勢
      const randomValue = (Math.random() - 0.5) * 4 // 隨機波動
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        value: Math.max(0, Math.round(baseValue + trendValue + randomValue))
      })
    }
    
    return mockData
  }

  // 計算屬性
  const averageForecastConfidence = computed(() => {
    if (forecasts.value.length === 0) return 0
    const totalConfidence = forecasts.value.reduce((sum, forecast) => sum + forecast.confidenceLevel, 0)
    return totalConfidence / forecasts.value.length
  })

  const forecastTrendSummary = computed(() => {
    const trends = forecasts.value.reduce((acc, forecast) => {
      acc[forecast.trend] = (acc[forecast.trend] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return trends
  })

  const totalPredictedDemand = computed(() => {
    return forecasts.value.reduce((sum, forecast) => sum + forecast.predictedDemand, 0)
  })

  return {
    // 狀態
    isLoading,
    error,
    forecasts,
    forecastAccuracy,
    
    // 方法
    generateDemandForecast,
    
    // 計算屬性
    averageForecastConfidence,
    forecastTrendSummary,
    totalPredictedDemand
  }
}