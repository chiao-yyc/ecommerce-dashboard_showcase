import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseApiService } from './base/BaseApiService'
import { convertToISOString } from '@/utils'
import { formatNumberPrecision, formatPercentagePrecision, formatCurrencyPrecision } from '@/utils/numberPrecision'
import type {
  ApiResponse,
  CampaignAnalyticsOverview,
  AttributionAnalysis,
  CollaborationAnalysis,
  OverlapCalendar,
  CampaignROICalculation,
  AttributionRulesSummary,
  LayerPerformance,
} from '@/types'
import { AttributionLayer } from '@/types/campaign'
import { calculateFinalWeight } from '@/constants/campaignLayers'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('API', 'CampaignAnalytics')

/**
 * CampaignAnalyticsApiService - 活動分析 API 服務
 * Phase 1: 基於現有分析視圖提供零資料表擴展的分析功能
 *
 * 核心設計原則:
 * 1. 完全基於現有分析視圖 (revenue_attribution_analysis, campaign_collaboration_analysis, campaign_overlap_calendar)
 * 2. 利用現有分層歸因系統 (calculate_campaign_attributions 函數)
 * 3. 遵循 SupportAnalyticsApiService 的架構模式
 * 4. 為 Phase 2 規則管理擴展預留介面
 */
export class CampaignAnalyticsApiService extends BaseApiService<any, any> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'campaigns')
  }

  protected mapDbToEntity(dbEntity: any): any {
    return dbEntity
  }

  /**
   * 獲取活動分析總覽數據
   * 基於 revenue_attribution_analysis 視圖計算關鍵指標
   *
   * Phase 1 限制: 由於視圖沒有日期欄位，dateRange 參數被忽略，分析所有歷史數據
   */
  async getCampaignAnalyticsOverview(_dateRange?: {
    start: string
    end: string
  }): Promise<ApiResponse<CampaignAnalyticsOverview>> {
    try {
      log.debug(
        '🔍 CampaignAnalyticsApiService.getCampaignAnalyticsOverview 被調用，日期範圍:',
        _dateRange,
      )
      // 從 revenue_attribution_analysis 視圖獲取基礎數據
      // Note: 暫時忽略日期範圍參數，因為視圖沒有日期欄位
      const { data, error } = await this.supabase
        .from('revenue_attribution_analysis')
        .select('*')
        .order('total_attributed_revenue', { ascending: false })

      if (error) throw error

      // 計算總覽指標
      const overview = this.calculateAnalyticsOverview(data || [])

      return {
        success: true,
        data: overview,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取活動歸因分析數據
   * 直接從 revenue_attribution_analysis 視圖獲取
   *
   * Phase 1 限制: 視圖沒有日期欄位，startDate/endDate 參數被忽略，分析所有歷史數據
   */
  async getAttributionAnalysis(filters?: {
    startDate?: string
    endDate?: string
    layers?: string[]
    campaignTypes?: string[]
  }): Promise<ApiResponse<AttributionAnalysis[]>> {
    try {
      log.debug(
        '🔍 CampaignAnalyticsApiService.getAttributionAnalysis 被調用，篩選器:',
        filters,
      )

      let query = this.supabase
        .from('revenue_attribution_analysis')
        .select('*')
        .order('total_attributed_revenue', { ascending: false })

      // 應用層級篩選
      if (filters?.layers && filters.layers.length > 0) {
        query = query.in('attribution_layer', filters.layers)
      }

      // 應用活動類型篩選
      if (filters?.campaignTypes && filters.campaignTypes.length > 0) {
        query = query.in('campaign_type', filters.campaignTypes)
      }

      // Note: 暫時跳過日期篩選，因為 revenue_attribution_analysis 視圖沒有日期欄位

      const { data, error } = await query

      if (error) throw error

      const mappedData = (data || []).map(this.mapAttributionAnalysis)

      return {
        success: true,
        data: mappedData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取活動協作效果分析
   * 從 campaign_collaboration_analysis 視圖獲取
   *
   * Phase 1 限制: 視圖沒有日期欄位，dateRange 參數被忽略，分析所有歷史資料
   */
  async getCollaborationAnalysis(_dateRange?: {
    start: string
    end: string
  }): Promise<ApiResponse<CollaborationAnalysis[]>> {
    try {
      log.debug(
        '🔍 CampaignAnalyticsApiService.getCollaborationAnalysis 被調用，日期範圍忽略:',
        _dateRange,
      )

      // campaign_collaboration_analysis 視圖沒有日期欄位，僅取得所有資料
      const { data, error } = await this.supabase
        .from('campaign_collaboration_analysis')
        .select('*')
        .order('combination_revenue', { ascending: false })

      if (error) {
        log.error('🚫 協作分析查詢錯誤:', error)
        throw error
      }

      log.debug('📊 協作分析原始資料樣本:', data?.slice(0, 2))

      const mappedData = (data || []).map(this.mapCollaborationAnalysis)

      return {
        success: true,
        data: mappedData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取活動重疊日曆數據
   * 從 campaign_overlap_calendar 視圖獲取
   */
  async getOverlapCalendar(dateRange?: {
    start: string
    end: string
  }): Promise<ApiResponse<OverlapCalendar[]>> {
    try {
      let query = this.supabase
        .from('campaign_overlap_calendar')
        .select('*')
        .order('date', { ascending: true })

      // 應用日期範圍篩選
      if (dateRange) {
        query = query.gte('date', dateRange.start).lte('date', dateRange.end)
      } else {
        // 預設最近 90 天
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        query = query.gte('date', ninetyDaysAgo.toISOString().split('T')[0])
      }

      const { data, error } = await query

      if (error) throw error

      const mappedData = (data || []).map(this.mapOverlapCalendar)

      return {
        success: true,
        data: mappedData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 計算特定活動的 ROI
   * 使用 calculate_campaign_attributions RPC 函數
   */
  async calculateCampaignROI(
    campaignId: string,
    targetDate?: string,
  ): Promise<ApiResponse<CampaignROICalculation>> {
    try {
      const date = targetDate || convertToISOString(new Date()).split('T')[0]

      const { data, error } = await this.supabase.rpc(
        'calculate_campaign_attributions',
        {
          target_date: date,
        },
      )

      if (error) throw error

      // 過濾出特定活動的歸因數據
      const campaignAttributions =
        data?.attributions?.filter(
          (attr: any) => attr.campaign_id === campaignId,
        ) || []

      const roiCalculation: CampaignROICalculation = {
        campaignId,
        targetDate: date,
        attributions: campaignAttributions,
        totalAttributedRevenue: formatCurrencyPrecision(campaignAttributions.reduce(
          (sum: number, attr: any) => sum + (attr.attributed_revenue || 0),
          0,
        )),
        attributionStrength:
          campaignAttributions[0]?.attribution_strength || 'minor',
        normalizedWeight: formatNumberPrecision(campaignAttributions[0]?.normalized_weight || 0),
        competingCampaigns: data?.total_active_campaigns || 0,
        activeLayers: data?.active_layers || [],
      }

      return {
        success: true,
        data: roiCalculation,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取歸因規則總結 (基於現有資料分析)
   * Phase 1: 分析現有活動的類型分佈和規則應用
   */
  async getAttributionRulesSummary(): Promise<
    ApiResponse<AttributionRulesSummary>
  > {
    try {
      // 分析現有活動的類型分佈和規則應用
      const { data, error } = await this.supabase
        .from('campaigns')
        .select(
          'campaign_type, attribution_layer, attribution_weight, priority_score',
        )
        .not('campaign_type', 'is', null)

      if (error) throw error

      // 統計規則分佈
      const rules = this.analyzeAttributionRules(data || [])

      const summary: AttributionRulesSummary = {
        totalCampaigns: data?.length || 0,
        layerDistribution: rules.layerStats,
        typeDistribution: rules.typeStats,
        weightDistribution: rules.weightStats,
        rulesMappings: rules.mappings,
        lastAnalyzed: convertToISOString(new Date()),
        systemStatus: 'active',
      }

      return {
        success: true,
        data: summary,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取活動效果趨勢數據
   * 基於 campaign_performance_enhanced 視圖，分兩步查詢獲取完整數據
   */
  async getCampaignPerformanceTrends(
    campaignId?: string,
    dateRange?: { start: string; end: string },
  ): Promise<ApiResponse<any[]>> {
    try {
      log.debug('🔍 getCampaignPerformanceTrends 被調用:', {
        campaignId,
        dateRange
      })

      // Step 1: 查詢 campaign_performance_enhanced 視圖
      let performanceQuery = this.supabase
        .from('campaign_performance_enhanced')
        .select('*')
        .order('start_date', { ascending: true })

      // 過濾特定活動
      if (campaignId) {
        performanceQuery = performanceQuery.eq('campaign_id', campaignId)
      }

      // 應用日期範圍篩選
      if (dateRange) {
        log.debug('📅 應用日期篩選:', dateRange)
        performanceQuery = performanceQuery
          .gte('start_date', dateRange.start)
          .lte('end_date', dateRange.end)
      } else {
        log.debug('📅 未提供日期篩選，查詢所有數據')
      }

      const { data: performanceData, error: performanceError } = await performanceQuery

      if (performanceError) {
        log.error('❌ Performance 查詢錯誤:', performanceError)
        throw performanceError
      }

      log.debug('📊 Performance 查詢結果:', {
        dataLength: performanceData?.length || 0,
        sampleData: performanceData?.slice(0, 2)
      })

      if (!performanceData || performanceData.length === 0) {
        log.warn('⚠️ Performance 查詢無數據返回')
        return {
          success: true,
          data: [],
        }
      }

      // Step 2: 獲取對應的campaign詳細資訊
      const campaignIds = performanceData.map(item => item.campaign_id)
      log.debug('🔍 需要查詢的 campaign IDs:', campaignIds)

      const { data: campaignData, error: campaignError } = await this.supabase
        .from('campaigns')
        .select('id, attribution_layer, attribution_weight, priority_score')
        .in('id', campaignIds)

      if (campaignError) {
        log.warn('⚠️ 無法獲取 campaigns 詳細資訊，使用預設值:', campaignError)
      } else {
        log.debug('📊 Campaign 詳細資訊查詢結果:', campaignData)
      }

      // Step 3: 合併數據
      const campaignMap = new Map()
      campaignData?.forEach(campaign => {
        campaignMap.set(campaign.id, campaign)
      })

      // 映射數據結構
      const processedData = performanceData.map((item: any) => {
        const campaignDetail = campaignMap.get(item.campaign_id)
        
        const processed = {
          campaign_id: item.campaign_id,
          campaign_name: item.campaign_name,
          campaign_type: item.campaign_type,
          attribution_layer: campaignDetail?.attribution_layer || AttributionLayer.GENERAL,
          start_date: item.start_date,
          end_date: item.end_date,
          total_revenue: formatCurrencyPrecision(item.total_revenue),
          total_orders: item.total_orders,
          avg_order_value: formatCurrencyPrecision(item.avg_order_value),
          conversion_rate: formatPercentagePrecision(item.conversion_rate_pct),
          attribution_weight: formatNumberPrecision(campaignDetail?.attribution_weight || 1.0),
          // 計算 ROI (簡化版)
          return_on_investment: item.total_revenue && item.total_orders
            ? formatPercentagePrecision((item.total_revenue / item.total_orders / 100) * 100)
            : 0,
          // 計算綜合績效評分
          performance_score: formatNumberPrecision(this.calculatePerformanceScore({
            total_revenue: item.total_revenue || 0,
            total_orders: item.total_orders || 0,
            avg_order_value: item.avg_order_value || 0,
            conversion_rate: item.conversion_rate_pct || 0,
            campaign_days: item.campaign_days || 1,
          })),
        }

        log.debug(`📊 處理活動 ${item.campaign_name}:`, {
          originalRevenue: item.total_revenue,
          processedRevenue: processed.total_revenue,
          performanceScore: processed.performance_score
        })

        return processed
      })

      log.debug('✅ 最終處理結果:', {
        processedDataLength: processedData.length,
        sampleProcessed: processedData.slice(0, 1)
      })

      return {
        success: true,
        data: processedData,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 計算分析總覽指標
   */
  private calculateAnalyticsOverview(
    attributionData: any[],
  ): CampaignAnalyticsOverview {
    const totals = attributionData.reduce(
      (acc, item) => ({
        totalCampaigns: acc.totalCampaigns + 1,
        totalRevenue: acc.totalRevenue + (item.total_attributed_revenue || 0),
        totalOrders: acc.totalOrders + (item.influenced_orders || 0),
        exclusiveOrders: acc.exclusiveOrders + (item.exclusive_orders || 0),
        collaborativeOrders:
          acc.collaborativeOrders + (item.collaborative_orders || 0),
        dominantAttributions:
          acc.dominantAttributions + (item.dominant_attributions || 0),
        totalAttributions:
          acc.totalAttributions +
          ((item.dominant_attributions || 0) +
            (item.significant_attributions || 0) +
            (item.moderate_attributions || 0) +
            (item.minor_attributions || 0)),
        weightSum: acc.weightSum + (item.avg_attribution_weight || 0),
        collaborationSum:
          acc.collaborationSum + (item.avg_concurrent_campaigns || 0),
      }),
      {
        totalCampaigns: 0,
        totalRevenue: 0,
        totalOrders: 0,
        exclusiveOrders: 0,
        collaborativeOrders: 0,
        dominantAttributions: 0,
        totalAttributions: 0,
        weightSum: 0,
        collaborationSum: 0,
      },
    )

    return {
      totalCampaigns: totals.totalCampaigns,
      totalAttributedRevenue: formatCurrencyPrecision(totals.totalRevenue),
      totalInfluencedOrders: totals.totalOrders,
      averageOrderValue:
        totals.totalOrders > 0 ? formatCurrencyPrecision(totals.totalRevenue / totals.totalOrders) : 0,
      attributionAccuracy:
        totals.totalAttributions > 0
          ? formatPercentagePrecision((totals.dominantAttributions / totals.totalAttributions) * 100)
          : 0,
      collaborationIndex:
        totals.totalOrders > 0
          ? formatPercentagePrecision((totals.collaborativeOrders / totals.totalOrders) * 100)
          : 0,
      averageAttributionWeight:
        totals.totalCampaigns > 0
          ? formatNumberPrecision(totals.weightSum / totals.totalCampaigns)
          : 0,
      averageConcurrentCampaigns:
        totals.totalCampaigns > 0
          ? formatNumberPrecision(totals.collaborationSum / totals.totalCampaigns)
          : 0,
      exclusiveOrdersRate:
        totals.totalOrders > 0
          ? formatPercentagePrecision((totals.exclusiveOrders / totals.totalOrders) * 100)
          : 0,
      trendsInfo: {
        period: 30, // 預設 30 天期間
        lastUpdated: convertToISOString(new Date()),
      },
    }
  }

  /**
   * 計算活動綜合績效評分
   */
  private calculatePerformanceScore(metrics: {
    total_revenue: number
    total_orders: number
    avg_order_value: number
    conversion_rate: number
    campaign_days: number
  }): number {
    let score = 0
    
    // 營收權重 (40%)
    if (metrics.total_revenue > 50000) score += 40
    else if (metrics.total_revenue > 20000) score += 30
    else if (metrics.total_revenue > 10000) score += 20
    else if (metrics.total_revenue > 0) score += 10

    // 訂單數權重 (30%)
    if (metrics.total_orders > 20) score += 30
    else if (metrics.total_orders > 10) score += 20
    else if (metrics.total_orders > 5) score += 15
    else if (metrics.total_orders > 0) score += 5

    // 平均訂單價值權重 (20%)
    if (metrics.avg_order_value > 3000) score += 20
    else if (metrics.avg_order_value > 2000) score += 15
    else if (metrics.avg_order_value > 1000) score += 10
    else if (metrics.avg_order_value > 0) score += 5

    // 效率指標權重 (10%) - 基於活動天數效率
    const dailyRevenue = metrics.total_revenue / metrics.campaign_days
    if (dailyRevenue > 5000) score += 10
    else if (dailyRevenue > 2000) score += 8
    else if (dailyRevenue > 1000) score += 5
    else if (dailyRevenue > 0) score += 2

    return Math.min(100, score) // 最高100分
  }

  /**
   * 轉換歸因分析數據
   */
  private mapAttributionAnalysis(data: any): AttributionAnalysis {
    return {
      campaignId: data.campaign_id,
      campaignName: data.campaign_name,
      campaignType: data.campaign_type,
      attributionLayer: data.attribution_layer,
      influencedOrders: data.influenced_orders || 0,
      totalAttributedRevenue: formatCurrencyPrecision(data.total_attributed_revenue || 0),
      avgAttributedRevenue: formatCurrencyPrecision(data.avg_attributed_revenue || 0),
      avgAttributionWeight: formatNumberPrecision(data.avg_attribution_weight || 0),
      avgConcurrentCampaigns: formatNumberPrecision(data.avg_concurrent_campaigns || 0),
      exclusiveOrders: data.exclusive_orders || 0,
      collaborativeOrders: data.collaborative_orders || 0,
      dominantAttributions: data.dominant_attributions || 0,
      significantAttributions: data.significant_attributions || 0,
      moderateAttributions: data.moderate_attributions || 0,
      minorAttributions: data.minor_attributions || 0,
    }
  }

  /**
   * 轉換協作分析數據
   */
  private mapCollaborationAnalysis(data: any): CollaborationAnalysis {
    return {
      concurrentCampaigns: data.concurrent_campaigns,
      campaignCombination: data.campaign_combination,
      involvedLayers: data.involved_layers || [],
      occurrenceCount: data.occurrence_count || 0,
      combinationRevenue: formatCurrencyPrecision(data.combination_revenue || 0),
      avgOrderValue: formatCurrencyPrecision(data.avg_order_value || 0),
      avgDistributedRevenue: formatCurrencyPrecision(data.avg_distributed_revenue || 0),
      revenueSharePct: formatPercentagePrecision(data.revenue_share_pct || 0),
      collaborationType: data.collaboration_type,
    }
  }

  /**
   * 轉換重疊日曆數據
   */
  private mapOverlapCalendar(data: any): OverlapCalendar {
    return {
      date: data.date,
      concurrentCampaigns: data.concurrent_campaigns,
      campaignsList: data.campaigns_list || '',
      activeLayers: data.active_layers || [],
      campaignTypes: data.campaign_types || [],
      avgAttributionWeight: formatNumberPrecision(data.avg_attribution_weight || 0),
      isHoliday: data.is_holiday || false,
      isWeekend: data.is_weekend || false,
      holidayName: data.holiday_name,
      complexityLevel: data.complexity_level,
      specialFlags: data.special_flags,
    }
  }

  /**
   * 分析歸因規則 (Phase 1: 基於現有資料)
   */
  private analyzeAttributionRules(campaignData: any[]) {
    const layerStats = new Map<string, number>()
    const typeStats = new Map<string, number>()
    const weightStats = new Map<number, number>()
    const mappings = new Map<string, any>()

    campaignData.forEach((campaign) => {
      const layer = campaign.attribution_layer
      const type = campaign.campaign_type
      const weight = campaign.attribution_weight

      // 統計層級分佈
      layerStats.set(layer, (layerStats.get(layer) || 0) + 1)

      // 統計類型分佈
      typeStats.set(type, (typeStats.get(type) || 0) + 1)

      // 統計權重分佈
      weightStats.set(weight, (weightStats.get(weight) || 0) + 1)

      // 記錄類型對應規則
      if (!mappings.has(type)) {
        mappings.set(type, {
          campaign_type: type,
          attribution_layer: layer,
          attribution_weight: weight,
          priority_score: campaign.priority_score,
          count: 1,
        })
      } else {
        mappings.get(type).count++
      }
    })

    return {
      layerStats: Object.fromEntries(layerStats),
      typeStats: Object.fromEntries(typeStats),
      weightStats: Object.fromEntries(weightStats),
      mappings: Array.from(mappings.values()),
    }
  }

  /**
   * 獲取層級效果分析數據
   * 從 revenue_attribution_analysis 視圖按 attribution_layer 分組統計
   *
   * Phase 1 限制: 由於 revenue_attribution_analysis 視圖沒有日期欄位，
   * startDate 和 endDate 參數暫時被忽略，分析涵蓋所有歷史數據
   */
  async getLayerPerformanceAnalysis(filters?: {
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<LayerPerformance[]>> {
    try {
      log.debug(
        '🔍 CampaignAnalyticsApiService.getLayerPerformanceAnalysis 被調用，篩選器:',
        filters,
      )

      // 獲取歸因分析數據
      // Note: revenue_attribution_analysis 視圖目前沒有日期欄位，Phase 1 先取得所有資料
      const query = this.supabase
        .from('revenue_attribution_analysis')
        .select('*')

      const { data, error } = await query

      if (error) throw error

      // 按層級分組計算統計數據
      const layerStats = this.groupByLayer(data || [])

      return {
        success: true,
        data: layerStats,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 獲取可用的歸因層級列表
   * 從 campaigns 表的 attribution_layer 欄位去重複
   */
  async getAvailableLayers(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await this.supabase
        .from('campaigns')
        .select('attribution_layer')
        .not('attribution_layer', 'is', null)

      if (error) throw error

      // 去重複並過濾空值
      const layers = [
        ...new Set(
          (data || []).map((item) => item.attribution_layer).filter(Boolean),
        ),
      ]

      return {
        success: true,
        data: layers,
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 按層級分組計算統計數據
   * 結合層級權重和活動權重計算最終權重
   */
  private groupByLayer(data: any[]): LayerPerformance[] {
    const layerGroups = new Map<string, any[]>()

    // 按 attribution_layer 分組
    data.forEach((item) => {
      const layer = item.attribution_layer || 'unknown'
      if (!layerGroups.has(layer)) {
        layerGroups.set(layer, [])
      }
      layerGroups.get(layer)!.push(item)
    })

    // 計算每個層級的統計數據
    return Array.from(layerGroups.entries())
      .map(([layer, items]) => {
        const uniqueCampaigns = new Set(items.map((item) => item.campaign_id))
          .size
        const totalOrders = items.reduce(
          (sum, item) => sum + (item.influenced_orders || 0),
          0,
        )
        const totalRevenue = items.reduce(
          (sum, item) => sum + (item.total_attributed_revenue || 0),
          0,
        )
        const collaborativeOrders = items.reduce(
          (sum, item) => sum + (item.collaborative_orders || 0),
          0,
        )

        // 計算綜合權重
        const avgCampaignWeight =
          items.length > 0
            ? items.reduce(
                (sum, item) => sum + (item.avg_attribution_weight || 1),
                0,
              ) / items.length
            : 1
        const finalWeight = calculateFinalWeight(layer, avgCampaignWeight)

        return {
          layer: layer,
          campaigns: uniqueCampaigns,
          orders: totalOrders,
          revenue: formatCurrencyPrecision(totalRevenue),
          avgWeight: formatNumberPrecision(finalWeight),
          avgOrderValue: totalOrders > 0 ? formatCurrencyPrecision(totalRevenue / totalOrders) : 0,
          collaborationRate:
            totalOrders > 0 ? formatPercentagePrecision((collaborativeOrders / totalOrders) * 100) : 0,
        }
      })
      .sort((a, b) => b.revenue - a.revenue) // 按營收排序
  }
}
