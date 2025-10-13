// Campaign Scoring Edge Function
// Migrated from useCampaignAnalytics.ts to protect business logic

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

// 活動歸因分析介面 (遷移自前端)
interface AttributionAnalysis {
  campaignId: string
  campaignName: string
  campaignType: string
  attributionLayer: 'site-wide' | 'target-oriented' | 'category-specific' | 'general'
  influencedOrders: number
  totalAttributedRevenue: number
  avgAttributedRevenue: number
  avgAttributionWeight: number
  avgConcurrentCampaigns: number
  exclusiveOrders: number
  collaborativeOrders: number
  dominantAttributions: number
  significantAttributions: number
  moderateAttributions: number
  minorAttributions: number
}

// 分層效果介面
interface LayerPerformance {
  layer: string
  campaigns: number
  revenue: number
  orders: number
  avgWeight: number
  avgOrderValue: number
  collaborationRate: number
}

// 活動排行榜項目介面
interface CampaignPerformanceRankingItem {
  rank: number
  campaignId: string
  campaignName: string
  campaignType: string
  layer: string
  score: number
  attributedRevenue: number
  influencedOrders: number
  avgOrderValue: number
  attributionWeight: number
  collaborationIndex: number
  roiScore: number
}

// 請求參數介面
interface ScoringRequest {
  campaigns: AttributionAnalysis[]
  scoringConfig?: {
    revenueWeight?: number // 營收權重 (預設 40%)
    attributionWeight?: number // 歸因權重 (預設 25%)
    collaborationWeight?: number // 協作效果權重 (預設 20%)
    qualityWeight?: number // 歸因品質權重 (預設 15%)
    revenueThreshold?: number // 營收滿分基準 (預設 10萬)
    volumeThreshold?: number // 規模滿分基準 (預設 100單)
  }
}

/**
 * 核心商業邏輯：計算活動綜合績效分數
 * 演算法權重：營收權重(40%) + 歸因權重(25%) + 協作效果(20%) + 歸因品質(15%)
 */
function calculateCampaignScore(
  campaign: AttributionAnalysis,
  config: Required<ScoringRequest['scoringConfig']>
): number {
  // 營收分數：基於營收閾值的百分比計算
  const revenueScore = Math.min(
    100,
    (campaign.totalAttributedRevenue / config.revenueThreshold) * 100,
  )
  
  // 歸因權重分數：直接轉換為百分比
  const weightScore = campaign.avgAttributionWeight * 100
  
  // 協作效果分數：協作訂單佔影響訂單的比例
  const collaborationScore =
    campaign.influencedOrders > 0
      ? (campaign.collaborativeOrders / campaign.influencedOrders) * 100
      : 0
  
  // 歸因品質分數：主導歸因佔影響訂單的比例
  const qualityScore =
    campaign.influencedOrders > 0
      ? (campaign.dominantAttributions / campaign.influencedOrders) * 100
      : 0

  // 加權計算最終分數
  return Math.round(
    revenueScore * config.revenueWeight +
    weightScore * config.attributionWeight +
    collaborationScore * config.collaborationWeight +
    qualityScore * config.qualityWeight,
  )
}

/**
 * ROI 分數計算：訂單價值 × 效率 × 規模因子
 */
function calculateROIScore(
  campaign: AttributionAnalysis,
  config: Required<ScoringRequest['scoringConfig']>
): number {
  const orderValue = campaign.avgAttributedRevenue
  const efficiency = campaign.avgAttributionWeight
  const volume = campaign.influencedOrders

  // 規模因子：基於預設門檻的百分比
  const scaleFactor = Math.min(1, volume / config.volumeThreshold)
  return Math.round(orderValue * efficiency * scaleFactor)
}

/**
 * 分層效果分析計算
 */
function calculateLayerPerformance(campaigns: AttributionAnalysis[]): LayerPerformance[] {
  const layers = ['site-wide', 'target-oriented', 'category-specific', 'general']
  
  return layers
    .map((layer) => {
      const layerData = campaigns.filter((item) => item.attributionLayer === layer)

      const totalRevenue = layerData.reduce(
        (sum, item) => sum + item.totalAttributedRevenue,
        0,
      )
      const totalOrders = layerData.reduce(
        (sum, item) => sum + item.influencedOrders,
        0,
      )
      const totalCollaborative = layerData.reduce(
        (sum, item) => sum + item.collaborativeOrders,
        0,
      )

      return {
        layer,
        campaigns: layerData.length,
        revenue: totalRevenue,
        orders: totalOrders,
        avgWeight:
          layerData.length > 0
            ? layerData.reduce(
                (sum, item) => sum + item.avgAttributionWeight,
                0,
              ) / layerData.length
            : 0,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        collaborationRate:
          totalOrders > 0 ? (totalCollaborative / totalOrders) * 100 : 0,
      }
    })
    .filter((layer) => layer.campaigns > 0)
}

/**
 * 活動效益排行榜計算
 */
function calculateCampaignRanking(
  campaigns: AttributionAnalysis[],
  config: Required<ScoringRequest['scoringConfig']>
): CampaignPerformanceRankingItem[] {
  return campaigns
    .map((campaign, index) => ({
      rank: index + 1,
      campaignId: campaign.campaignId,
      campaignName: campaign.campaignName,
      campaignType: campaign.campaignType,
      layer: campaign.attributionLayer,
      score: calculateCampaignScore(campaign, config),
      attributedRevenue: campaign.totalAttributedRevenue,
      influencedOrders: campaign.influencedOrders,
      avgOrderValue: campaign.avgAttributedRevenue,
      attributionWeight: campaign.avgAttributionWeight,
      collaborationIndex:
        campaign.influencedOrders > 0
          ? (campaign.collaborativeOrders / campaign.influencedOrders) * 100
          : 0,
      roiScore: calculateROIScore(campaign, config),
    }))
    .sort((a, b) => b.score - a.score)
    .map((campaign, index) => ({ ...campaign, rank: index + 1 }))
}

console.log("Campaign Scoring Edge Function Started")

Deno.serve(async (req: Request) => {
  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 驗證請求方法
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 405 
        }
      )
    }

    // 解析請求資料
    const requestBody: ScoringRequest = await req.json()
    
    // 驗證必要參數
    if (!requestBody.campaigns || !Array.isArray(requestBody.campaigns)) {
      return new Response(
        JSON.stringify({ error: 'campaigns array is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // 設定預設評分配置
    const config: Required<ScoringRequest['scoringConfig']> = {
      revenueWeight: requestBody.scoringConfig?.revenueWeight ?? 0.4,
      attributionWeight: requestBody.scoringConfig?.attributionWeight ?? 0.25,
      collaborationWeight: requestBody.scoringConfig?.collaborationWeight ?? 0.2,
      qualityWeight: requestBody.scoringConfig?.qualityWeight ?? 0.15,
      revenueThreshold: requestBody.scoringConfig?.revenueThreshold ?? 100000,
      volumeThreshold: requestBody.scoringConfig?.volumeThreshold ?? 100,
    }

    // 執行商業邏輯計算
    const layerPerformance = calculateLayerPerformance(requestBody.campaigns)
    const campaignRanking = calculateCampaignRanking(requestBody.campaigns, config)

    // 計算總體統計
    const totalRevenue = requestBody.campaigns.reduce(
      (sum, campaign) => sum + campaign.totalAttributedRevenue,
      0
    )
    const totalOrders = requestBody.campaigns.reduce(
      (sum, campaign) => sum + campaign.influencedOrders,
      0
    )

    const result = {
      success: true,
      data: {
        layerPerformance,
        campaignRanking,
        summary: {
          totalCampaigns: requestBody.campaigns.length,
          totalRevenue,
          totalOrders,
          avgScore: campaignRanking.length > 0 
            ? Math.round(campaignRanking.reduce((sum, item) => sum + item.score, 0) / campaignRanking.length)
            : 0,
          topPerformer: campaignRanking[0] || null,
        },
        config,
        timestamp: new Date().toISOString(),
      },
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Campaign scoring error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/campaign-scoring' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
