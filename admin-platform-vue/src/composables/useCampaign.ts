import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { CampaignApiService } from '@/api/services/CampaignApiService'
import type { Campaign, CampaignTypeCode } from '@/types/campaign'
import type { ApiResponse, ApiPaginationResponse } from '@/types'

/**
 * 關鍵字查詢活動（查詢 id & name）
 * @param keyword 關鍵字
 * @returns ApiResponse<Campaign[]> 活動列表
 */
export async function fetchCampaignsByKeyword(
  keyword: string,
): Promise<ApiResponse<Campaign[]>> {
  const campaignApiService = new CampaignApiService(supabase)
  return await campaignApiService.fetchCampaignsByKeyword(keyword)
}

// 獲取活動列表與分頁
export async function fetchCampaignsWithPagination(options: {
  page: number
  perPage: number
  searchTerm?: string
  campaignTypes?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiPaginationResponse> {
  const campaignApiService = new CampaignApiService(supabase)
  return (await campaignApiService.fetchCampaignsWithPagination(
    options,
  )) as ApiPaginationResponse
}

/**
 * 獲取單一活動資料
 * @param id 活動ID
 * @returns ApiResponse<Campaign> 活動資料
 */
export async function getCampaignById(
  id: string,
): Promise<ApiResponse<Campaign>> {
  const campaignApiService = new CampaignApiService(supabase)
  return await campaignApiService.getCampaignById(id)
}

/**
 * 獲取活動列表
 * @returns ApiResponse 活動列表
 */
export async function getCampaigns(): Promise<ApiResponse<Campaign[]>> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('start_date', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const mappedData =
      data?.map((item) => ({
        id: item.id,
        campaignName: item.campaign_name,
        startDate: item.start_date,
        endDate: item.end_date,
        campaignType: item.campaign_type as CampaignTypeCode,
        description: item.description,
        createdAt: item.created_at,
        attributionLayer: item.attribution_layer,
        priorityScore: item.priority_score,
        attributionWeight: item.attribution_weight,
      })) || []
    return { success: true, data: mappedData }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 新增活動
 * @param campaignData 活動資料
 * @returns ApiResponse<Campaign> 新增的活動
 */
export async function createCampaign(campaignData: {
  campaignName: string
  startDate: string
  endDate: string
  campaignType?: CampaignTypeCode | string
  description?: string | null
}): Promise<ApiResponse<Campaign>> {
  const campaignApiService = new CampaignApiService(supabase)
  // Convert null to undefined for API compatibility and ensure campaignType is properly typed
  const sanitizedData = {
    ...campaignData,
    campaignType: campaignData.campaignType as CampaignTypeCode,
    description: campaignData.description ?? undefined
  }
  return await campaignApiService.createCampaign(sanitizedData)
}

/**
 * 更新活動
 * @param id 活動ID
 * @param updates 更新的資料
 * @returns ApiResponse<Campaign> 更新後的活動
 */
export async function updateCampaign(
  id: string,
  updates: Partial<Campaign>,
): Promise<ApiResponse<Campaign>> {
  const campaignApiService = new CampaignApiService(supabase)
  // Ensure campaignType is properly typed and handle null description
  const sanitizedUpdates = {
    ...updates,
    ...(updates.campaignType && { campaignType: updates.campaignType as CampaignTypeCode }),
    ...(updates.description !== undefined && { description: updates.description || undefined })
  }
  return await campaignApiService.updateCampaign(id, sanitizedUpdates)
}

/**
 * 刪除活動
 * @param id 活動ID
 * @returns ApiResponse 刪除結果
 */
export async function deleteCampaign(id: string): Promise<ApiResponse> {
  const campaignApiService = new CampaignApiService(supabase)
  return await campaignApiService.deleteCampaign(id)
}

export function useCampaign(
  getCampaignsImpl = getCampaigns,
  createCampaignImpl = createCampaign,
  updateCampaignImpl = updateCampaign,
  deleteCampaignImpl = deleteCampaign,
) {
  const campaigns = ref<Campaign[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadCampaigns() {
    loading.value = true
    error.value = null
    try {
      const response = await getCampaignsImpl()
      if (response.success && response.data) {
        campaigns.value = response.data
      } else {
        error.value = response.error?.toString() || '載入活動失敗'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入活動時發生錯誤'
    } finally {
      loading.value = false
    }
  }

  // 為 EventCalendar 提供兼容性支持
  async function fetchAllCampaigns() {
    await loadCampaigns()
  }

  async function addCampaign(campaignData: {
    campaignName: string
    startDate: string
    endDate: string
    campaignType?: CampaignTypeCode | string
    description?: string | null
  }): Promise<{ success: boolean; data?: Campaign; error?: string }> {
    loading.value = true
    error.value = null
    try {
      const response = await createCampaignImpl(campaignData)
      if (response.success && response.data) {
        // 🎯 使用與 Holiday 相同的混合策略：立即手動狀態更新 + 重新載入確保同步
        campaigns.value.push(response.data)
        // 然後重新載入以確保數據同步
        await loadCampaigns()
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.toString() || '新增活動失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '新增活動時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function editCampaign(id: string, updates: Partial<Campaign>): Promise<{ success: boolean; data?: Campaign; error?: string }> {
    loading.value = true
    error.value = null
    try {
      const response = await updateCampaignImpl(id, updates)
      if (response.success && response.data) {
        // 🎯 使用與 Holiday 相同的混合策略：立即手動狀態更新 + 重新載入確保同步
        const index = campaigns.value.findIndex(c => c.id === id)
        if (index !== -1) {
          campaigns.value[index] = response.data
        }
        // 然後重新載入以確保數據同步
        await loadCampaigns()
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.toString() || '更新活動失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新活動時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function removeCampaign(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await deleteCampaignImpl(id)
      if (response.success) {
        // 🎯 使用與 Holiday 相同的混合策略：立即手動狀態更新 + 重新載入確保同步
        campaigns.value = campaigns.value.filter(c => c.id !== id)
        // 然後重新載入以確保數據同步
        await loadCampaigns()
        return { success: true }
      } else {
        error.value = response.error?.toString() || '刪除活動失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除活動時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    addCampaign,
    editCampaign,
    removeCampaign,
    // EventCalendar 兼容性支持
    availableCampaigns: campaigns,
    fetchAllCampaigns,
  }
}
