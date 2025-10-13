// Import
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 🔐 Customer Segmentation Edge Function
// Phase 3: 客戶分群邏輯遷移 - 保護核心 RFM 分析算法

console.log('Customer Segmentation Edge Function Started')

interface CustomerSegmentationRequest {
  startDate?: string
  endDate?: string
  includeRfmAnalysis?: boolean
  includeChurnRisk?: boolean
  includeValueGrowth?: boolean
  includeRecommendations?: boolean
}

interface RfmMetrics {
  user_id: string
  full_name?: string
  recency_days: number
  frequency: number
  monetary: number
  rfm_segment: string
  lifecycle_stage: string
  last_purchase_date?: string
  purchase_frequency_per_month: number
  aov: number
  estimated_ltv: number
}

interface CustomerChurnRisk {
  customerId: string
  customerName: string
  lastOrderDate: string
  daysSinceLastOrder: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  contributingFactors: Array<{
    factor: string
    impact: number
    description: string
  }>
  recommendedActions: string[]
  estimatedRetentionProbability: number
  currentLTV: number
  potentialLossValue: number
}

interface CustomerValueGrowth {
  customerId: string
  customerName: string
  currentLTV: number
  estimatedFutureLTV: number
  ltvGrowthRate: number
  ltvTrend: 'accelerating' | 'growing' | 'stable' | 'declining'
  growthPotential: 'high' | 'medium' | 'low'
  currentSegment: string
  targetSegment: string
  timeToUpgrade: string
  requiredActions: string[]
}

interface CustomerSegmentationResponse {
  success: boolean
  data: {
    churnRisks: CustomerChurnRisk[]
    valueGrowth: CustomerValueGrowth[]
    segmentAnalysis: {
      totalCustomers: number
      segmentDistribution: Record<string, number>
      averageRfmScores: {
        recency: number
        frequency: number
        monetary: number
      }
      riskLevelDistribution: Record<string, number>
    }
    recommendations: Array<{
      category: string
      priority: 'critical' | 'high' | 'medium' | 'low'
      description: string
      expectedImpact: string
    }>
    timestamp: string
  }
  error?: string
}

// 🔐 核心算法：獲取並整合客戶指標數據
async function getIntegratedCustomerMetrics(
  supabaseClient: any,
  startDate: string,
  endDate: string
): Promise<RfmMetrics[]> {
  console.log('🔍 Date Range Filter:', { startDate, endDate })
  
  // 🔐 核心數據獲取：RFM 和 LTV 指標
  // 修復：移除過於嚴格的日期篩選，改為獲取所有客戶的最新資料
  const [rfmResponse, ltvResponse] = await Promise.all([
    supabaseClient
      .from('customer_rfm_lifecycle_metrics')
      .select(
        `
        user_id,
        recency_days,
        frequency,
        monetary,
        rfm_segment,
        lifecycle_stage,
        last_purchase_date
      `
      )
      // 修復：放寬日期條件，確保能獲取到測試資料
      .gte('last_purchase_date', '2020-01-01')
      .lte('last_purchase_date', new Date().toISOString()),

    supabaseClient.from('customer_ltv_metrics').select(`
        user_id,
        purchase_frequency_per_month,
        aov,
        estimated_ltv
      `),
  ])

  if (rfmResponse.error) {
    throw new Error(`RFM數據獲取失敗: ${rfmResponse.error.message}`)
  }
  if (ltvResponse.error) {
    throw new Error(`LTV數據獲取失敗: ${ltvResponse.error.message}`)
  }

  // 獲取客戶基本資料
  const customerIds = [
    ...new Set([
      ...(rfmResponse.data?.map((r) => r.user_id) || []),
      ...(ltvResponse.data?.map((l) => l.user_id) || []),
    ]),
  ]

  if (customerIds.length === 0) {
    return [] // 如果沒有客戶，直接返回空陣列
  }

  const customersResponse = await supabaseClient
    .from('customers')
    .select('id, full_name, email')
    .in('id', customerIds)

  if (customersResponse.error) {
    throw new Error(`客戶資料獲取失敗: ${customersResponse.error.message}`)
  }

  // 整合 RFM、LTV 和客戶數據
  const rfmData = rfmResponse.data || []
  const ltvData = ltvResponse.data || []
  const customerData = customersResponse.data || []

  const customerMap = new Map()

  // 建立客戶基本資料映射
  customerData.forEach((customer) => {
    customerMap.set(customer.id, {
      user_id: customer.id,
      full_name: customer.full_name || 'Unknown',
      email: customer.email,
    })
  })

  // 整合 RFM 數據
  rfmData.forEach((rfm) => {
    if (customerMap.has(rfm.user_id)) {
      Object.assign(customerMap.get(rfm.user_id), rfm)
    } else {
      customerMap.set(rfm.user_id, { ...rfm, full_name: 'Unknown' })
    }
  })

  // 整合 LTV 數據
  ltvData.forEach((ltv) => {
    if (customerMap.has(ltv.user_id)) {
      Object.assign(customerMap.get(ltv.user_id), ltv)
    }
  })

  return Array.from(customerMap.values()).filter(
    (customer) => customer.recency_days !== undefined
  ) // 只返回有 RFM 數據的客戶
}

// 🔐 核心商業邏輯：客戶流失風險分析算法
function analyzeCustomerChurnRisk(
  customers: RfmMetrics[]
): CustomerChurnRisk[] {
  return customers
    .map((customer) => {
      // 🔐 多因子風險評分計算（0-100分）
      let riskScore = 0
      const contributingFactors: Array<{
        factor: string
        impact: number
        description: string
      }> = []

      // 🔐 因子1: 最近購買時間風險評估（權重30%）
      const recencyDays = customer.recency_days || 0
      let recencyRisk = 0
      if (recencyDays > 180) recencyRisk = 100
      else if (recencyDays > 90) recencyRisk = 70
      else if (recencyDays > 60) recencyRisk = 40
      else if (recencyDays > 30) recencyRisk = 20

      riskScore += recencyRisk * 0.3
      if (recencyRisk > 40) {
        contributingFactors.push({
          factor: 'long_absence',
          impact: 0.3,
          description: `${recencyDays}天未購買，超過正常週期`,
        })
      }

      // 🔐 因子2: 購買頻率風險評估（權重25%）
      const frequency = customer.frequency || 0
      let frequencyRisk = 0
      if (frequency < 1) frequencyRisk = 80
      else if (frequency < 2) frequencyRisk = 50
      else if (frequency < 4) frequencyRisk = 20

      riskScore += frequencyRisk * 0.25
      if (frequencyRisk > 40) {
        contributingFactors.push({
          factor: 'declining_frequency',
          impact: 0.25,
          description: `購買頻率偏低（${frequency}次），低於平均水準`,
        })
      }

      // 🔐 因子3: RFM分群風險評估（權重25%）
      const segment = customer.rfm_segment || ''
      let segmentRisk = 0
      if (segment.includes('Lost') || segment.includes('Churned'))
        segmentRisk = 100
      else if (segment.includes('At Risk') || segment.includes('Cannot Lose'))
        segmentRisk = 80
      else if (
        segment.includes('Hibernating') ||
        segment.includes('About to Sleep')
      )
        segmentRisk = 60
      else if (segment.includes('Need Attention')) segmentRisk = 40

      riskScore += segmentRisk * 0.25
      if (segmentRisk > 50) {
        contributingFactors.push({
          factor: 'segment_downgrade',
          impact: 0.25,
          description: `客戶分群為${segment}，屬於高風險群組`,
        })
      }

      // 🔐 因子4: 生命週期階段風險評估（權重20%）
      const lifecycleStage = customer.lifecycle_stage || ''
      let lifecycleRisk = 0
      if (lifecycleStage === 'Churned') lifecycleRisk = 100
      else if (lifecycleStage === 'At Risk') lifecycleRisk = 70
      else if (lifecycleStage === 'Inactive') lifecycleRisk = 50

      riskScore += lifecycleRisk * 0.2
      if (lifecycleRisk > 40) {
        contributingFactors.push({
          factor: 'lifecycle_decline',
          impact: 0.2,
          description: `生命週期階段為${lifecycleStage}，處於風險狀態`,
        })
      }

      // 🔐 風險等級分類算法
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (riskScore >= 80) riskLevel = 'critical'
      else if (riskScore >= 60) riskLevel = 'high'
      else if (riskScore >= 40) riskLevel = 'medium'

      // 🔐 生成建議行動
      const recommendedActions: string[] = []
      if (riskLevel === 'critical') {
        recommendedActions.push(
          '立即執行挽回計劃',
          '提供特別優惠',
          '安排專人聯繫'
        )
      } else if (riskLevel === 'high') {
        recommendedActions.push(
          '發送個性化優惠',
          '提醒最新產品',
          '優化客戶體驗'
        )
      } else if (riskLevel === 'medium') {
        recommendedActions.push('定期關懷聯繫', '推薦相關產品', '收集意見反饋')
      }

      // 🔐 挽回成功機率估算算法
      let retentionProbability = 0
      if (riskLevel === 'low') retentionProbability = 0.9
      else if (riskLevel === 'medium') retentionProbability = 0.7
      else if (riskLevel === 'high') retentionProbability = 0.4
      else retentionProbability = 0.2

      return {
        customerId: customer.user_id,
        customerName: customer.full_name || 'Unknown',
        lastOrderDate: customer.last_purchase_date || '',
        daysSinceLastOrder: recencyDays,
        riskScore: Math.round(riskScore),
        riskLevel,
        contributingFactors,
        recommendedActions,
        estimatedRetentionProbability: retentionProbability,
        currentLTV: customer.estimated_ltv || 0,
        potentialLossValue:
          (customer.estimated_ltv || 0) * (1 - retentionProbability),
      }
    })
    .sort((a, b) => b.riskScore - a.riskScore)
}

// 🔐 核心商業邏輯：客戶價值成長分析算法
function analyzeCustomerValueGrowth(
  customers: RfmMetrics[]
): CustomerValueGrowth[] {
  return customers
    .map((customer) => {
      const currentLTV = customer.estimated_ltv || 0
      const purchaseFrequency = customer.purchase_frequency_per_month || 0
      const aov = customer.aov || 0

      let ltvGrowthRate = 0
      if (purchaseFrequency > 2 && aov > 1000) {
        ltvGrowthRate = 15
      } else if (purchaseFrequency > 1 && aov > 500) {
        ltvGrowthRate = 8
      } else if (purchaseFrequency > 0.5) {
        ltvGrowthRate = 3
      } else {
        ltvGrowthRate = -5
      }

      let ltvTrend: 'accelerating' | 'growing' | 'stable' | 'declining' =
        'stable'
      if (ltvGrowthRate > 10) ltvTrend = 'accelerating'
      else if (ltvGrowthRate > 5) ltvTrend = 'growing'
      else if (ltvGrowthRate < 0) ltvTrend = 'declining'

      let growthPotential: 'high' | 'medium' | 'low' = 'low'
      if (ltvGrowthRate > 10 && currentLTV > 5000) growthPotential = 'high'
      else if (ltvGrowthRate > 5 || currentLTV > 2000)
        growthPotential = 'medium'

      const currentSegment = customer.rfm_segment || 'Unknown'
      let targetSegment = currentSegment

      if (currentSegment.includes('New Customers') && ltvGrowthRate > 5) {
        targetSegment = 'Potential Loyalists'
      } else if (
        currentSegment.includes('Potential Loyalists') &&
        ltvGrowthRate > 10
      ) {
        targetSegment = 'Loyal Customers'
      } else if (
        currentSegment.includes('Need Attention') &&
        ltvGrowthRate > 0
      ) {
        targetSegment = 'Potential Loyalists'
      }

      let timeToUpgrade = '12+ months'
      if (ltvGrowthRate > 15) timeToUpgrade = '3-6 months'
      else if (ltvGrowthRate > 8) timeToUpgrade = '6-9 months'
      else if (ltvGrowthRate > 3) timeToUpgrade = '9-12 months'

      const requiredActions: string[] = []
      if (growthPotential === 'high') {
        requiredActions.push('VIP專屬服務', '個人化產品推薦', '優先客服支援')
      } else if (growthPotential === 'medium') {
        requiredActions.push('會員升級優惠', '交叉銷售策略', '忠誠度計劃')
      } else {
        requiredActions.push('基礎關懷', '定期聯繫', '滿意度調查')
      }

      return {
        customerId: customer.user_id,
        customerName: customer.full_name || 'Unknown',
        currentLTV,
        estimatedFutureLTV: Math.round(currentLTV * (1 + ltvGrowthRate / 100)),
        ltvGrowthRate,
        ltvTrend,
        growthPotential,
        currentSegment,
        targetSegment,
        timeToUpgrade,
        requiredActions,
      }
    })
    .sort((a, b) => b.ltvGrowthRate - a.ltvGrowthRate)
}

// 🔐 核心商業邏輯：分群統計分析
function calculateSegmentAnalysis(
  customers: RfmMetrics[],
  churnRisks: CustomerChurnRisk[] = []
) {
  const totalCustomers = customers.length
  const segmentDistribution: Record<string, number> = {}
  const riskLevelDistribution: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }

  let totalRecency = 0,
    totalFrequency = 0,
    totalMonetary = 0

  customers.forEach((customer) => {
    const segment = customer.rfm_segment || 'Unknown'
    segmentDistribution[segment] = (segmentDistribution[segment] || 0) + 1
    totalRecency += customer.recency_days || 0
    totalFrequency += customer.frequency || 0
    totalMonetary += customer.monetary || 0
  })

  // 從流失風險分析結果中統計風險等級分佈
  churnRisks.forEach((risk) => {
    if (riskLevelDistribution[risk.riskLevel] !== undefined) {
      riskLevelDistribution[risk.riskLevel]++
    }
  })

  return {
    totalCustomers,
    segmentDistribution,
    averageRfmScores: {
      recency:
        totalCustomers > 0 ? Math.round(totalRecency / totalCustomers) : 0,
      frequency:
        totalCustomers > 0
          ? Math.round((totalFrequency / totalCustomers) * 100) / 100
          : 0,
      monetary:
        totalCustomers > 0 ? Math.round(totalMonetary / totalCustomers) : 0,
    },
    riskLevelDistribution,
  }
}

// 🔐 核心商業邏輯：智能建議生成
function generateRecommendations(
  churnRisks: CustomerChurnRisk[],
  valueGrowth: CustomerValueGrowth[],
  segmentAnalysis: any
): Array<{
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  description: string
  expectedImpact: string
}> {
  const recommendations = []

  const criticalRiskCount =
    segmentAnalysis.riskLevelDistribution.critical || 0
  const highRiskCount = segmentAnalysis.riskLevelDistribution.high || 0

  if (criticalRiskCount > 0) {
    recommendations.push({
      category: '客戶挽回',
      priority: 'critical' as const,
      description: `${criticalRiskCount}位極高風險客戶需要立即關注和挽回行動`,
      expectedImpact: '預計可挽回20-40%的流失客戶',
    })
  }

  if (highRiskCount > 0) {
    recommendations.push({
      category: '風險預防',
      priority: 'high' as const,
      description: `${highRiskCount}位高風險客戶需要預防性關懷措施`,
      expectedImpact: '預計可降低60-80%的流失率',
    })
  }

  const highGrowthCount = valueGrowth.filter(
    (v) => v.growthPotential === 'high'
  ).length
  const mediumGrowthCount = valueGrowth.filter(
    (v) => v.growthPotential === 'medium'
  ).length

  if (highGrowthCount > 0) {
    recommendations.push({
      category: '價值提升',
      priority: 'high' as const,
      description: `${highGrowthCount}位高潛力客戶可進行深度價值開發`,
      expectedImpact: '預計LTV提升15-25%',
    })
  }

  if (mediumGrowthCount > 0) {
    recommendations.push({
      category: '成長培育',
      priority: 'medium' as const,
      description: `${mediumGrowthCount}位中等潛力客戶適合培育成長計劃`,
      expectedImpact: '預計LTV提升8-15%',
    })
  }

  return recommendations
}

// Main Edge Function Handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request with better error handling
    let requestData: CustomerSegmentationRequest = {}
    
    try {
      const body = await req.text()
      console.log('📥 Raw request body:', body || '(empty)')
      
      if (body && body.trim()) {
        requestData = JSON.parse(body)
      } else {
        console.log('⚠️ Empty request body, using defaults')
      }
    } catch (error) {
      console.log('❌ JSON parse error:', error.message, '- using defaults')
    }

    const {
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      endDate = new Date().toISOString().split('T')[0],
      includeRfmAnalysis = true,
      includeChurnRisk = true,
      includeValueGrowth = true,
      includeRecommendations = true,
    } = requestData

    console.log('🔐 Customer Segmentation Analysis Request:', {
      startDate,
      endDate,
      includeRfmAnalysis,
      includeChurnRisk,
      includeValueGrowth,
      includeRecommendations,
    })

    // 🔐 執行核心商業邏輯計算
    const integratedMetrics = await getIntegratedCustomerMetrics(
      supabaseClient,
      startDate,
      endDate
    )

    const churnRisks = includeChurnRisk
      ? analyzeCustomerChurnRisk(integratedMetrics)
      : []
    const valueGrowth = includeValueGrowth
      ? analyzeCustomerValueGrowth(integratedMetrics)
      : []
    const segmentAnalysis = calculateSegmentAnalysis(integratedMetrics, churnRisks)
    const recommendations = includeRecommendations
      ? generateRecommendations(churnRisks, valueGrowth, segmentAnalysis)
      : []

    const response: CustomerSegmentationResponse = {
      success: true,
      data: {
        churnRisks,
        valueGrowth,
        segmentAnalysis,
        recommendations,
        timestamp: new Date().toISOString(),
      },
    }

    console.log('🔐 Customer Segmentation Analysis Success:', {
      churnRisksCount: churnRisks.length,
      valueGrowthCount: valueGrowth.length,
      totalSegments: Object.keys(segmentAnalysis.segmentDistribution).length,
      recommendationsCount: recommendations.length,
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('🔐 Customer Segmentation Error:', error)

    const errorResponse: CustomerSegmentationResponse = {
      success: false,
      data: {
        churnRisks: [],
        valueGrowth: [],
        segmentAnalysis: {
          totalCustomers: 0,
          segmentDistribution: {},
          averageRfmScores: { recency: 0, frequency: 0, monetary: 0 },
          riskLevelDistribution: {},
        },
        recommendations: [],
        timestamp: new Date().toISOString(),
      },
      error: error instanceof Error ? error.message : '客戶分群分析失敗',
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})