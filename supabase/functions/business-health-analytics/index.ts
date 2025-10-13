// Import
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Business Health Analytics Edge Function
// 🔐 商業邏輯保護：將業務健康度評分算法遷移至伺服器端執行

console.log('Business Health Analytics Edge Function Started')

interface BusinessHealthRequest {
  period?: '7d' | '30d' | '90d'
  includeSystemHealth?: boolean
  includeTrends?: boolean
  includeInsights?: boolean
  includeHistoricalTrends?: boolean  // Phase 3: 新增歷史趨勢查詢
  trendWeeks?: number               // Phase 3: 趨勢週數，預設 12
  includeEfficiencyTrends?: boolean  // Phase 3.5: 新增效率趨勢查詢
}

interface BusinessHealthMetrics {
  revenue: number
  satisfaction: number
  fulfillment: number
  support: number
  products: number
  marketing: number
  system: number
}

interface HealthScoreDetails {
  customerQuality: number
  operationalEfficiency: number
  supportEffectiveness: number
  overallScore: number
  rating: string
}

interface TrendAnalysis {
  direction: '上升' | '下降' | '持平'
  change: number
  description: string
  customerChange: number
  operationalChange: number
}

// Phase 3: 歷史趨勢數據類型
interface HealthTrendData {
  week: string
  customerQuality: number      // 0-100
  operationalEfficiency: number // 0-100
  supportEffectiveness: number  // 0-100
}

interface MomentumData {
  week: string
  customerQuality: number       // 週變化率 %
  operationalEfficiency: number // 週變化率 %
  supportEffectiveness: number  // 週變化率 %
}

// Phase 3.5: 效率趨勢數據類型
interface EfficiencyTrendData {
  week: string
  overallEfficiency: number    // 整體效率分數 0-100
  orderProcessing: number       // 訂單處理效率 0-100
  customerSupport: number       // 客服效率 0-100
}

interface BusinessHealthResponse {
  success: boolean
  data: {
    metrics: BusinessHealthMetrics
    scoreDetails: HealthScoreDetails
    trends?: TrendAnalysis
    insights?: any[]
    historicalTrends?: {        // Phase 3: 新增歷史趨勢數據
      trends: HealthTrendData[]
      momentum: MomentumData[]
    }
    efficiencyTrends?: EfficiencyTrendData[]  // Phase 3.5: 新增效率趨勢數據
    timestamp: string
  }
  error?: string
}

async function calculateBusinessHealthMetrics(
  supabase: any,
  period: string = '30d'
): Promise<BusinessHealthMetrics> {
  
  try {
    console.log(`🔐 Calculating business health metrics for period: ${period}`)
    
    // 🔐 核心算法 1: 營收健康度計算
    // 基於訂單完成率的營收健康度評分（使用統一的 DB 狀態函數）
    const { data: orderStats, error: orderError } = await supabase
      .rpc('get_order_stats_with_status_functions', {
        start_date: getDateRange(period).start,
        end_date: getDateRange(period).end
      })
      .single()

    if (orderError) {
      console.error('Order stats query error:', orderError)
      throw new Error(`Orders 統計查詢失敗: ${orderError.message}`)
    }

    const totalOrders = orderStats?.total_orders || 0
    const completedOrders = orderStats?.completed_orders || 0
    const cancelledOrders = orderStats?.cancelled_orders || 0
    
    console.log(`📊 Order Stats: total=${totalOrders}, completed=${completedOrders}, cancelled=${cancelledOrders}`)

    // 🔐 商業邏輯：完成率計算公式
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
    
    // 🔐 核心算法 2: 客戶留存率計算
    // 基於重複購買行為計算客戶滿意度代理指標
    // 修正：使用 user_id 而不是 customer_id，並從 customer_snapshot 取得客戶ID
    const { data: customerStats, error: customerError } = await supabase
      .from('orders')
      .select('user_id, created_at, customer_snapshot')
      .gte('created_at', getDateRange(period).start)
      .lte('created_at', getDateRange(period).end)

    if (customerError) {
      console.error('Customer stats query error:', customerError)
      throw new Error(`客戶統計查詢失敗: ${customerError.message}`)
    }

    // 從 user_id 和 customer_snapshot 中提取客戶ID
    const customerIds = customerStats?.map(o => {
      // 優先使用 user_id，如果沒有則從 customer_snapshot 中取得
      return o.user_id || (o.customer_snapshot?.customer_id) || null
    }).filter(id => id !== null) || []

    const uniqueCustomers = new Set(customerIds).size
    const repeatCustomers = calculateRepeatCustomersFromIds(customerIds)
    const retentionRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0
    
    console.log(`👥 Customer Stats: total_orders=${customerStats?.length}, unique=${uniqueCustomers}, repeat=${repeatCustomers}, retention=${retentionRate.toFixed(2)}%`)

    // 🔐 核心算法 3: 支援效率計算
    const supportScore = await calculateSupportEfficiency(supabase, period)
    
    // 🔐 核心算法 4: 庫存健康度計算  
    const inventoryScore = await calculateInventoryHealth(supabase)
    
    // 🔐 核心算法 5: 系統穩定度計算
    const systemScore = await calculateSystemStability()

    console.log(`📊 Health Scores: support=${supportScore}, inventory=${inventoryScore}, system=${systemScore}`)

    // 🔐 商業邏輯：健康度評分公式 (0-10 分制)
    return {
      // 營收健康度：基於訂單完成率
      revenue: Math.min(Math.max(completionRate / 10, 0), 10),
      
      // 客戶滿意度：基於客戶留存率
      satisfaction: Math.min(Math.max(retentionRate / 10, 0), 10),
      
      // 履行健康度：基於取消率反向計算
      fulfillment: Math.max(10 - cancellationRate / 5, 0),
      
      // 支援健康度：基於回應時間數據
      support: supportScore,
      
      // 產品健康度：基於庫存健康度
      products: inventoryScore,
      
      // 行銷健康度：基於訂單完成率和留存率的複合指標
      marketing: Math.min(Math.max((completionRate + retentionRate) / 20, 0), 10),
      
      // 系統穩定度：基於多模組健康狀態
      system: systemScore,
    }
  } catch (error) {
    console.error('Error calculating business health metrics:', error)
    // 🔐 降級保護：返回安全預設值
    return {
      revenue: 0,
      satisfaction: 0,
      fulfillment: 0,
      support: 0,
      products: 0,
      marketing: 0,
      system: 0,
    }
  }
}

async function calculateDetailedHealthScores(
  supabase: any,
  period: string = '30d'
): Promise<HealthScoreDetails> {
  
  // 🔐 核心算法：詳細健康度評分計算
  // 從 DashboardExecutiveHealth.vue:58-149 遷移的算法
  
  const { data: businessData, error } = await supabase
    .from('business_health_metrics')
    .select('*')
    .order('week', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching business_health_metrics:', error)
  }
  
  console.log('Business health data fetched:', businessData?.length, 'records')

  if (!businessData?.length) {
    return {
      customerQuality: 0,
      operationalEfficiency: 0,
      supportEffectiveness: 0,
      overallScore: 0,
      rating: '數據不足',
    }
  }

  const latest = businessData[0]

  // 🔐 商業邏輯：各維度分數計算 (0-100 分制)
  // 確保數值有效性和商業邏輯正確性
  const customerScore = Number.isFinite(latest.customer_quality_ratio)
    ? (latest.customer_quality_ratio || 0) * 100
    : 0

  const operationalScore = Number.isFinite(latest.completion_rate)
    ? (latest.completion_rate || 0) * 100
    : 0

  const responseTime = Number.isFinite(latest.avg_response_time)
    ? latest.avg_response_time || 0
    : 0
  
  // 🔐 核心公式：支援評分算法 - 回應時間越低越好
  const supportScore = Math.max(0, 100 - responseTime * 10)

  // 🔐 核心公式：綜合評分算法 - 三維度平均
  const overallScore = (customerScore + operationalScore + supportScore) / 3

  // 🔐 商業邏輯：評級判定算法
  const rating = getRatingFromScore(overallScore)

  return {
    customerQuality: Math.round(customerScore),
    operationalEfficiency: Math.round(operationalScore),
    supportEffectiveness: Math.round(supportScore),
    overallScore: Math.round(overallScore),
    rating,
  }
}

async function calculateTrendAnalysis(
  supabase: any,
  period: string = '30d'
): Promise<TrendAnalysis> {
  
  // 🔐 核心算法：趨勢分析算法
  // 從 DashboardExecutiveHealth.vue:105-149 遷移的週變化率計算
  
  const { data: metrics } = await supabase
    .from('business_health_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2)

  if (!metrics || metrics.length < 2) {
    return {
      direction: '持平',
      change: 0,
      description: '數據不足',
      customerChange: 0,
      operationalChange: 0,
    }
  }

  const [current, previous] = metrics

  // 🔐 商業邏輯：變化率計算公式
  // 確保數值計算有效性和業務邏輯正確性
  const currentCustomer = Number.isFinite(current.customer_quality_ratio)
    ? current.customer_quality_ratio || 0
    : 0
  const previousCustomer = Number.isFinite(previous.customer_quality_ratio)
    ? previous.customer_quality_ratio || 0
    : 0
  const customerChange = (currentCustomer - previousCustomer) * 100

  const currentOperational = Number.isFinite(current.completion_rate)
    ? current.completion_rate || 0
    : 0
  const previousOperational = Number.isFinite(previous.completion_rate)
    ? previous.completion_rate || 0
    : 0
  const operationalChange = (currentOperational - previousOperational) * 100

  // 🔐 核心公式：平均變化率計算
  const avgChange = (customerChange + operationalChange) / 2
  const finalChange = Number.isFinite(avgChange) ? avgChange : 0

  // 🔐 商業邏輯：趨勢判定算法 (2% 為趨勢判定閾值)
  const direction = finalChange > 2 ? '上升' : finalChange < -2 ? '下降' : '持平'
  const description = getDescriptionFromChange(finalChange)

  return {
    direction,
    change: Math.abs(finalChange),
    description,
    customerChange,
    operationalChange,
  }
}

// Phase 3: 🔐 歷史趨勢數據查詢函數
async function calculateHistoricalTrends(
  supabase: any,
  weeks: number = 12
): Promise<HealthTrendData[]> {

  console.log(`🔐 Calculating historical trends for ${weeks} weeks`)

  const { data: metrics, error } = await supabase
    .from('business_health_metrics')
    .select('*')
    .order('week', { ascending: false })
    .limit(weeks)

  if (error) {
    console.error('Historical trends query error:', error)
    return []
  }

  if (!metrics?.length) {
    console.log('No historical trend data found')
    return []
  }

  // 🔐 商業邏輯：將資料庫數據轉換為前端格式
  return metrics
    .reverse() // 按時間正序排列
    .map((metric) => {
      // 確保所有數值計算都是有效的
      const customerScore = Number.isFinite(metric.customer_quality_ratio)
        ? (metric.customer_quality_ratio || 0) * 100
        : 0

      const operationalScore = Number.isFinite(metric.completion_rate)
        ? (metric.completion_rate || 0) * 100
        : 0

      const responseTime = Number.isFinite(metric.avg_response_time)
        ? metric.avg_response_time || 0
        : 0

      // 🔐 核心公式：支援評分算法 - 回應時間越低越好
      const supportScore = Math.max(0, 100 - responseTime * 10)

      return {
        week: metric.week,
        customerQuality: Math.round(customerScore),
        operationalEfficiency: Math.round(operationalScore),
        supportEffectiveness: Math.round(supportScore),
      }
    })
}

// Phase 3: 🔐 動能數據計算函數
async function calculateMomentumData(
  trends: HealthTrendData[]
): Promise<MomentumData[]> {

  if (trends.length < 2) {
    console.log('Not enough data for momentum calculation')
    return []
  }

  // 🔐 商業邏輯：週變化率計算
  return trends.slice(1).map((current, index) => {
    const previous = trends[index] // 前一週數據

    // 計算週變化率 (%)
    const customerMomentum = previous.customerQuality !== 0
      ? ((current.customerQuality - previous.customerQuality) / previous.customerQuality) * 100
      : 0

    const operationalMomentum = previous.operationalEfficiency !== 0
      ? ((current.operationalEfficiency - previous.operationalEfficiency) / previous.operationalEfficiency) * 100
      : 0

    const serviceMomentum = previous.supportEffectiveness !== 0
      ? ((current.supportEffectiveness - previous.supportEffectiveness) / previous.supportEffectiveness) * 100
      : 0

    return {
      week: current.week,
      customerQuality: Number(customerMomentum.toFixed(1)),
      operationalEfficiency: Number(operationalMomentum.toFixed(1)),
      supportEffectiveness: Number(serviceMomentum.toFixed(1)),
    }
  })
}

// Phase 3.5: 🔐 效率趨勢數據查詢函數
async function calculateEfficiencyTrends(
  supabase: any,
  weeks: number = 12
): Promise<EfficiencyTrendData[]> {

  console.log(`🔐 Calculating efficiency trends for ${weeks} weeks`)

  const { data: metrics, error } = await supabase
    .from('business_health_metrics')
    .select('week, completion_rate, avg_response_time')
    .order('week', { ascending: false })
    .limit(weeks)

  if (error) {
    console.error('Efficiency trends query error:', error)
    return []
  }

  if (!metrics?.length) {
    console.log('No efficiency trend data found')
    return []
  }

  // 🔐 商業邏輯：將資料庫數據轉換為效率分數
  return metrics
    .reverse() // 按時間正序排列
    .map((metric) => {
      // 訂單處理效率 (基於完成率)
      const orderProcessingScore = Number.isFinite(metric.completion_rate)
        ? (metric.completion_rate || 0) * 100
        : 0

      // 客服效率 (基於回應時間，分數越高越好)
      const responseTime = Number.isFinite(metric.avg_response_time)
        ? metric.avg_response_time || 0
        : 0
      const customerSupportScore = Math.max(0, 100 - responseTime * 10)

      // 整體效率 (加權平均)
      const overallEfficiencyScore = (orderProcessingScore * 0.6 + customerSupportScore * 0.4)

      return {
        week: metric.week,
        overallEfficiency: Math.round(overallEfficiencyScore),
        orderProcessing: Math.round(orderProcessingScore),
        customerSupport: Math.round(customerSupportScore),
      }
    })
}

// 🔐 輔助函數：商業邏輯計算

async function calculateSupportEfficiency(supabase: any, period: string): Promise<number> {
  // 🔐 核心算法：客服效率計算
  // 修正：使用 conversations 表替代不存在的 support_tickets 表
  const { data: conversationStats } = await supabase
    .from('conversations')
    .select('status, priority, first_response_time, created_at')
    .gte('created_at', getDateRange(period).start)
    .lte('created_at', getDateRange(period).end)

  if (!conversationStats?.length) return 0 // 無數據時返回 0

  const totalConversations = conversationStats.length
  const closedConversations = conversationStats.filter(c => c.status === 'closed').length
  
  // 計算平均首次回應時間（小時）
  const conversationsWithResponse = conversationStats.filter(c => c.first_response_time && c.created_at)
  let avgResponseTimeHours = 0
  
  if (conversationsWithResponse.length > 0) {
    const totalResponseTime = conversationsWithResponse.reduce((sum, c) => {
      const responseTime = new Date(c.first_response_time).getTime() - new Date(c.created_at).getTime()
      return sum + (responseTime / (1000 * 60 * 60)) // 轉換為小時
    }, 0)
    avgResponseTimeHours = totalResponseTime / conversationsWithResponse.length
  }

  // 🔐 商業邏輯：支援效率評分公式
  const resolutionRate = totalConversations > 0 ? closedConversations / totalConversations : 0
  const responseScore = Math.max(0, 10 - avgResponseTimeHours / 2) // 2小時為基準
  
  return Math.min((resolutionRate * 5) + (responseScore * 0.5), 10)
}

async function calculateInventoryHealth(supabase: any): Promise<number> {
  try {
    // 🔐 核心算法：庫存健康度計算
    // Join with products table to get stock_threshold
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventories')
      .select('quantity, product_id, products!inner(stock_threshold)')

    if (inventoryError) {
      console.error('Inventory query error:', inventoryError)
      return 0 // 無數據時返回 0
    }

    if (!inventory?.length) {
      console.log('No inventory data found')
      return 0
    }

    const healthyProducts = inventory.filter(item => {
      const stock = item.quantity || 0
      const threshold = item.products?.stock_threshold || 0
      // Consider inventory healthy if stock is above threshold
      // Maximum is not enforced in current schema, so we only check minimum
      const isHealthy = stock >= threshold
      console.log(`Inventory item: stock=${stock}, threshold=${threshold}, healthy=${isHealthy}`)
      return isHealthy
    }).length

    const healthScore = Math.min((healthyProducts / inventory.length) * 10, 10)
    console.log(`📦 Inventory Health: ${healthyProducts}/${inventory.length} healthy = ${healthScore.toFixed(2)}`)

    // 🔐 商業邏輯：健康庫存占比計算
    return healthScore
  } catch (error) {
    console.error('Error calculating inventory health:', error)
    return 0 // 降級保護
  }
}

async function calculateSystemStability(): Promise<number> {
  // 🔐 核心算法：系統穩定度計算
  // 從 DashboardApiService.ts:715-794 遷移的多模組權重計算邏輯
  
  try {
    // 模擬 Realtime 模組健康度檢查
    const notificationModuleWeight = 1.5 // 通知系統權重
    const orderModuleWeight = 2.0       // 訂單系統權重 (最高)
    const inventoryModuleWeight = 1.2   // 庫存系統權重
    
    // 🔐 商業邏輯：模組健康度評分算法
    // 在實際環境中，這些數據來自 useRealtimeAlerts 系統

    // 各模組的穩定度分數 (0-10) - 無真實監控數據時為 0
    const notificationStability = 0  // 通知系統穩定度
    const orderStability = 0         // 訂單系統穩定度
    const inventoryStability = 0     // 庫存系統穩定度
    
    // 🔐 核心公式：加權平均計算
    const totalWeight = notificationModuleWeight + orderModuleWeight + inventoryModuleWeight
    const weightedScore = (
      (notificationStability * notificationModuleWeight) +
      (orderStability * orderModuleWeight) +
      (inventoryStability * inventoryModuleWeight)
    ) / totalWeight
    
    // 🔐 商業邏輯：穩定度評級調整
    // 基於系統整體表現的額外調整因子
    const systemPerformanceFactor = 0.95 // 95% 系統效能因子
    const finalStability = Math.min(weightedScore * systemPerformanceFactor, 10)
    
    console.log('System Stability Calculation:', {
      notificationStability,
      orderStability, 
      inventoryStability,
      weightedScore,
      finalStability: Math.round(finalStability * 100) / 100
    })
    
    return Math.round(finalStability * 100) / 100
    
  } catch (error) {
    console.error('System stability calculation error:', error)
    // 🔐 降級保護：計算失敗時返回 0
    return 0
  }
}

function calculateRepeatCustomersFromIds(customerIds: string[]): number {
  // 🔐 商業邏輯：重複購買客戶計算（基於客戶ID陣列）
  const customerOrderCounts = customerIds.reduce((acc, customerId) => {
    acc[customerId] = (acc[customerId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.values(customerOrderCounts).filter(count => count > 1).length
}

function getRatingFromScore(score: number): string {
  // 🔐 商業邏輯：評級判定算法
  if (score >= 90) return '優秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '普通'
  if (score >= 40) return '需改善'
  return '待加強'
}

function getDescriptionFromChange(change: number): string {
  // 🔐 商業邏輯：趨勢描述算法
  if (change > 2) return '業務表現持續改善'
  if (change < -2) return '需要關注業務指標下滑'
  return '業務表現穩定'
}

function generateBusinessInsights(
  metrics: BusinessHealthMetrics,
  scoreDetails: HealthScoreDetails,
  trends: TrendAnalysis | null
): any[] {
  // 🔐 核心算法：業務洞察生成算法
  // 基於健康度指標和趨勢分析生成智能洞察
  
  const insights: any[] = []
  
  try {
    // 🔐 商業邏輯：整體健康度洞察
    if (scoreDetails.overallScore >= 90) {
      insights.push({
        title: '業務表現優異',
        description: `整體健康度達到 ${scoreDetails.overallScore} 分，系統運行狀況良好`,
        type: 'opportunity',
        impact: 'low',
        confidence: 0.95,
        category: '業務分析',
        actions: ['持續監控關鍵指標', '擴大成功策略應用']
      })
    } else if (scoreDetails.overallScore <= 60) {
      insights.push({
        title: '業務健康度需改善',
        description: `整體健康度僅 ${scoreDetails.overallScore} 分，建議優先改善關鍵指標`,
        type: 'warning', 
        impact: 'high',
        confidence: 0.9,
        category: '風險管理',
        actions: ['檢視營運流程', '改善客戶體驗', '優化支援效率']
      })
    }
    
    // 🔐 商業邏輯：系統穩定度洞察
    if (metrics.system < 7.0) {
      insights.push({
        title: '系統穩定度警告',
        description: `系統穩定度 ${metrics.system.toFixed(1)} 分低於標準，可能影響業務運行`,
        type: 'warning',
        impact: 'high', 
        confidence: 0.85,
        category: '技術監控',
        actions: ['檢查系統模組狀態', '執行故障排除', '強化監控機制']
      })
    }
    
    // 🔐 商業邏輯：趨勢分析洞察
    if (trends && trends.direction === '下降' && trends.change > 5) {
      insights.push({
        title: '業務指標下滑趨勢',
        description: `檢測到業務指標下降 ${trends.change.toFixed(1)}%，需要立即關注`,
        type: 'warning',
        impact: 'high',
        confidence: 0.88,
        category: '趨勢分析',
        actions: ['分析下降原因', '制定改善計劃', '加強監控頻率']
      })
    } else if (trends && trends.direction === '上升' && trends.change > 10) {
      insights.push({
        title: '業務成長動能強勁',
        description: `業務指標上升 ${trends.change.toFixed(1)}%，表現優於預期`,
        type: 'opportunity',
        impact: 'medium',
        confidence: 0.9,
        category: '成長機會',
        actions: ['分析成功因素', '擴大優勢策略', '設定更高目標']
      })
    }
    
    // 🔐 商業邏輯：關鍵模組效能洞察
    if (metrics.support < 5.0) {
      insights.push({
        title: '客服效能待改善',
        description: `客服健康度 ${metrics.support.toFixed(1)} 分，可能影響客戶滿意度`,
        type: 'info',
        impact: 'medium',
        confidence: 0.8,
        category: '客戶服務',
        actions: ['優化回應時間', '培訓客服人員', '改善服務流程']
      })
    }
    
    if (metrics.revenue < 6.0) {
      insights.push({
        title: '營收表現需關注', 
        description: `營收健康度 ${metrics.revenue.toFixed(1)} 分，建議檢視訂單流程`,
        type: 'warning',
        impact: 'high',
        confidence: 0.87,
        category: '財務分析',
        actions: ['分析訂單轉換率', '優化付款流程', '提升產品競爭力']
      })
    }
    
  } catch (error) {
    console.error('Business insights generation error:', error)
    // 錯誤時返回空陣列，讓前端顯示空狀態
  }

  return insights.slice(0, 5) // 限制最多5個洞察
}

function getDateRange(period: string): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  
  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case '90d':
      start.setDate(start.getDate() - 90)
      break
    default:
      start.setDate(start.getDate() - 30)
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

// Main Edge Function Handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔐 Business Health Analytics Request Started')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Use service key for admin operations
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
    )

    // Parse request with error handling
    const requestBody = await req.text()
    let parsedRequest: BusinessHealthRequest = {}
    
    if (requestBody && requestBody.trim()) {
      try {
        parsedRequest = JSON.parse(requestBody)
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message)
        throw new Error(`Invalid JSON request body: ${parseError.message}`)
      }
    }
    
    const {
      period,
      includeSystemHealth,
      includeTrends,
      includeInsights,
      includeHistoricalTrends,  // Phase 3: 新增
      trendWeeks = 12,          // Phase 3: 預設 12 週
      includeEfficiencyTrends   // Phase 3.5: 新增效率趨勢
    }: BusinessHealthRequest = parsedRequest

    console.log('Business Health Analytics Request:', {
      period: period || '30d',
      includeSystemHealth: includeSystemHealth ?? true,
      includeTrends: includeTrends ?? true,
      includeInsights: includeInsights ?? true,
      includeHistoricalTrends: includeHistoricalTrends ?? false,  // Phase 3
      includeEfficiencyTrends: includeEfficiencyTrends ?? false,  // Phase 3.5
      trendWeeks
    })

    // 🔐 執行核心商業邏輯計算
    const [metrics, scoreDetails, trends, historicalTrends, efficiencyTrends] = await Promise.all([
      calculateBusinessHealthMetrics(supabaseClient, period),
      calculateDetailedHealthScores(supabaseClient, period),
      includeTrends ? calculateTrendAnalysis(supabaseClient, period) : null,
      includeHistoricalTrends ? calculateHistoricalTrends(supabaseClient, trendWeeks) : null,  // Phase 3
      includeEfficiencyTrends ? calculateEfficiencyTrends(supabaseClient, trendWeeks) : null,  // Phase 3.5
    ])

    // Phase 3: 計算動能數據（如果有歷史趨勢）
    const momentumData = historicalTrends && historicalTrends.length > 1
      ? await calculateMomentumData(historicalTrends)
      : []

    const response: BusinessHealthResponse = {
      success: true,
      data: {
        metrics,
        scoreDetails,
        trends: trends || undefined,
        insights: includeInsights ? generateBusinessInsights(metrics, scoreDetails, trends) : undefined,
        historicalTrends: includeHistoricalTrends ? {  // Phase 3: 新增
          trends: historicalTrends || [],
          momentum: momentumData,
        } : undefined,
        efficiencyTrends: includeEfficiencyTrends ? (efficiencyTrends || []) : undefined,  // Phase 3.5: 新增
        timestamp: new Date().toISOString(),
      },
    }

    console.log('Business Health Analytics Completed:', {
      overallScore: scoreDetails.overallScore,
      systemHealth: metrics.system,
      trendsIncluded: !!trends,
      historicalTrendsIncluded: !!historicalTrends,  // Phase 3
      trendDataCount: historicalTrends?.length || 0,  // Phase 3
      momentumDataCount: momentumData?.length || 0,   // Phase 3
      efficiencyTrendsIncluded: !!efficiencyTrends,   // Phase 3.5
      efficiencyTrendCount: efficiencyTrends?.length || 0,  // Phase 3.5
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Business Health Analytics Error:', error?.message || error)
    
    const errorResponse: BusinessHealthResponse = {
      success: false,
      data: {
        metrics: {} as BusinessHealthMetrics,
        scoreDetails: {} as HealthScoreDetails,
        timestamp: new Date().toISOString(),
      },
      error: error?.message || 'Unknown error',
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})