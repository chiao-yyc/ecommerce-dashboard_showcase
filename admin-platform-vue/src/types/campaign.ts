// 活動相關型別定義

// 歸因層級枚舉類型
export enum AttributionLayer {
  SITE_WIDE = 'site-wide',
  TARGET_ORIENTED = 'target-oriented',
  CATEGORY_SPECIFIC = 'category-specific',
  GENERAL = 'general'
}

// 活動類型配置介面
export interface CampaignTypeConfig {
  type_code: string
  display_name_zh: string
  display_name_en?: string
  attribution_layer: AttributionLayer
  default_weight: number
  default_priority: number
  color_class: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// 活動類型分組介面（供下拉選單使用）
export interface CampaignTypeGroup {
  layer: AttributionLayer
  display_name: string
  types: CampaignTypeConfig[]
}

// 有效的活動類型代碼
export type CampaignTypeCode = 
  | 'flash_sale' | 'seasonal' | 'holiday' | 'anniversary'     // Site-wide
  | 'membership' | 'demographic'                              // Target-oriented
  | 'category' | 'product_launch' | 'lifestyle'              // Category-specific
  | 'general'                                                 // General

// 資料庫模型（使用 snake_case）
export interface DbCampaign {
  id: string
  campaign_name: string
  start_date: string
  end_date: string
  campaign_type: CampaignTypeCode
  description?: string | null
  created_at: string
  attribution_layer?: AttributionLayer
  priority_score?: number
  attribution_weight?: number
}

// 前端/UI 模型（使用 camelCase）
export interface Campaign {
  id: string
  campaignName: string
  startDate: string
  endDate: string
  campaignType: CampaignTypeCode
  description?: string | null
  createdAt: string
  attributionLayer?: AttributionLayer
  priorityScore?: number
  attributionWeight?: number
}

// 表單用的型別定義
export type CampaignForm = {
  campaignName: string
  startDate: string
  endDate: string
  campaignType: CampaignTypeCode
  description?: string | null
}

// 編輯表單用的型別定義
export type CampaignEditForm = {
  campaignName: string
  startDate: string
  endDate: string
  campaignType: CampaignTypeCode
  description?: string | null
  attributionLayer?: AttributionLayer
  priorityScore?: number
  attributionWeight?: number
}

// 歸因計算結果介面
export interface CampaignAttribution {
  campaign_id: string
  campaign_name: string
  campaign_type: CampaignTypeCode
  attribution_layer: AttributionLayer
  raw_weight: number
  normalized_weight: number
  attribution_percentage: number
  priority_score: number
  is_fallback: boolean
  period_start: string
  period_end: string
}

// API 響應介面
export interface CampaignTypeConfigResponse {
  success: boolean
  data?: CampaignTypeConfig[]
  error?: string
}

export interface CampaignTypeGroupsResponse {
  success: boolean
  data?: Record<AttributionLayer, CampaignTypeGroup>
  error?: string
}
