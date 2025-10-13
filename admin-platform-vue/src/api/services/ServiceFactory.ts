import type { SupabaseClient } from '@supabase/supabase-js'
import { UserApiService } from './UserApiService'
import { ProductApiService } from './ProductApiService'
import { OrderApiService } from './OrderApiService'
import { CustomerApiService } from './CustomerApiService'
import { CampaignTypeApiService } from './CampaignTypeApiService'
import { ProductAnalyticsService } from './ProductAnalyticsService'
import { OrderAnalyticsService } from './OrderAnalyticsService'
import { CustomerAnalyticsZeroExpansionService } from './CustomerAnalyticsZeroExpansionService'
import { SupportAnalyticsApiService } from './SupportAnalyticsApiService'
import { CampaignAnalyticsApiService } from './CampaignAnalyticsApiService'
import { CampaignScoringApiService } from './CampaignScoringApiService'
import { DashboardApiService } from './DashboardApiService'
import { AIPromptTemplateService } from './ai/AIPromptTemplateService'
import { AIEnhancedAlertService } from './ai/AIEnhancedAlertService'
import { BusinessHealthAnalyticsService } from './BusinessHealthAnalyticsService'
import { CustomerSegmentationService } from './CustomerSegmentationService'

/**
 * ServiceFactory - API 服務工廠
 *
 * ## 🏗️ 架構設計原則
 *
 * ### 依賴注入模式 (Dependency Injection)
 * ServiceFactory 採用依賴注入模式，不直接依賴具體的 supabase 實例，而是：
 * - 透過建構子接受 `SupabaseClient` 介面的任何實作
 * - 使用 `import type` 只導入類型定義，避免執行時依賴
 * - 允許注入不同配置的 supabase 實例（如測試環境、開發環境）
 *
 * ### 為什麼不直接使用 @/lib/supabase ？
 *
 * #### ✅ 優點：
 * 1. **測試友善**：可以注入 mock supabase 進行單元測試
 * 2. **環境隔離**：不同環境可注入不同配置的實例
 * 3. **依賴反轉**：ServiceFactory 只依賴抽象介面，不依賴具體實現
 * 4. **單一職責**：ServiceFactory 只負責管理服務實例，不負責 supabase 配置
 *
 * #### 🔄 實際使用流程：
 * ```
 * @/lib/supabase.ts (配置實例)
 *     ↓
 * services/index.ts (創建 defaultServiceFactory)
 *     ↓
 * ServiceFactory (管理服務實例)
 *     ↓
 * composables (使用服務)
 * ```
 *
 * ### 💡 使用範例
 *
 * #### 正常使用：
 * ```typescript
 * import { defaultServiceFactory } from '@/api/services'
 * const userService = defaultServiceFactory.getUserService()
 * ```
 *
 * #### 測試時：
 * ```typescript
 * import { ServiceFactory } from '@/api/services/ServiceFactory'
 * const mockSupabase = createMockSupabaseClient()
 * const testFactory = new ServiceFactory(mockSupabase)
 * const userService = testFactory.getUserService()
 * ```
 *
 * #### 自定義環境：
 * ```typescript
 * import { createClient } from '@supabase/supabase-js'
 * import { ServiceFactory } from '@/api/services/ServiceFactory'
 *
 * const customSupabase = createClient(customUrl, customKey, customOptions)
 * const customFactory = new ServiceFactory(customSupabase)
 * ```
 *
 * @class ServiceFactory
 * @description 負責建立和管理 API 服務實例，採用單例模式確保效能
 */
export class ServiceFactory {
  private supabase: SupabaseClient
  private instances: Map<string, any> = new Map()

  /**
   * 建立 ServiceFactory 實例
   *
   * @param supabase - SupabaseClient 實例，支援：
   *   - 正式環境：從 @/lib/supabase 導入的配置實例
   *   - 測試環境：Mock SupabaseClient 實例
   *   - 自定義環境：使用不同配置的 SupabaseClient
   *
   * @example
   * ```typescript
   * // 正常使用 (在 services/index.ts 中)
   * import { supabase } from '@/lib/supabase'
   * const factory = new ServiceFactory(supabase)
   *
   * // 測試使用
   * const mockSupabase = createMockSupabaseClient()
   * const testFactory = new ServiceFactory(mockSupabase)
   * ```
   */
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * 取得 UserApiService 實例（單例模式）
   */
  getUserService(): UserApiService {
    if (!this.instances.has('user')) {
      this.instances.set('user', new UserApiService(this.supabase))
    }
    return this.instances.get('user')
  }

  /**
   * 取得 ProductApiService 實例（單例模式）
   */
  getProductService(): ProductApiService {
    if (!this.instances.has('product')) {
      this.instances.set('product', new ProductApiService(this.supabase))
    }
    return this.instances.get('product')
  }

  /**
   * 取得 OrderApiService 實例（單例模式）
   */
  getOrderService(): OrderApiService {
    if (!this.instances.has('order')) {
      this.instances.set('order', new OrderApiService(this.supabase))
    }
    return this.instances.get('order')
  }

  /**
   * 取得 CustomerApiService 實例（單例模式）
   */
  getCustomerService(): CustomerApiService {
    if (!this.instances.has('customer')) {
      this.instances.set('customer', new CustomerApiService(this.supabase))
    }
    return this.instances.get('customer')
  }

  /**
   * 取得 CampaignTypeApiService 實例（單例模式）
   * 活動類型配置管理服務，支援四層歸因架構
   */
  getCampaignTypeService(): CampaignTypeApiService {
    if (!this.instances.has('campaignType')) {
      this.instances.set(
        'campaignType',
        new CampaignTypeApiService(this.supabase),
      )
    }
    return this.instances.get('campaignType')
  }

  /**
   * 取得 ProductAnalyticsService 實例（單例模式）
   * 真實資料庫視圖版本：連接 product_abc_analysis, slow_moving_products_analysis
   */
  getProductAnalyticsService(): ProductAnalyticsService {
    if (!this.instances.has('productAnalytics')) {
      this.instances.set(
        'productAnalytics',
        new ProductAnalyticsService(this.supabase),
      )
    }
    return this.instances.get('productAnalytics')
  }

  /**
   * 取得 OrderAnalyticsService 實例（單例模式）
   * 真實資料庫視圖版本：取代 ZeroExpansionService，使用真實 views
   */
  getOrderAnalyticsService(): OrderAnalyticsService {
    if (!this.instances.has('orderAnalytics')) {
      this.instances.set(
        'orderAnalytics',
        new OrderAnalyticsService(this.supabase),
      )
    }
    return this.instances.get('orderAnalytics')
  }

  /**
   * 取得 SupportAnalyticsApiService 實例（單例模式）
   * 階段1：零擴展版本，完全基於現有分析視圖的支援分析
   */
  getSupportAnalyticsService(): SupportAnalyticsApiService {
    if (!this.instances.has('supportAnalytics')) {
      this.instances.set(
        'supportAnalytics',
        new SupportAnalyticsApiService(this.supabase),
      )
    }
    return this.instances.get('supportAnalytics')
  }

  /**
   * 取得 CampaignAnalyticsApiService 實例（單例模式）
   * 階段1：零擴展版本，完全基於現有分析視圖的活動分析
   */
  getCampaignAnalyticsService(): CampaignAnalyticsApiService {
    if (!this.instances.has('campaignAnalytics')) {
      this.instances.set(
        'campaignAnalytics',
        new CampaignAnalyticsApiService(this.supabase),
      )
    }
    return this.instances.get('campaignAnalytics')
  }

  /**
   * 取得 CampaignScoringApiService 實例（單例模式）
   * Edge Function 版本：商業邏輯已移至伺服器端保護
   */
  getCampaignScoringService(): CampaignScoringApiService {
    if (!this.instances.has('campaignScoring')) {
      this.instances.set(
        'campaignScoring',
        new CampaignScoringApiService(this.supabase),
      )
    }
    return this.instances.get('campaignScoring')
  }

  /**
   * 取得 CustomerAnalyticsZeroExpansionService 實例（單例模式）
   * 
   * 📊 Phase 1: ApplicationService (應用層計算版本)
   * 採用零擴展策略，完全基於現有資料表的客戶分析，適合中小型數據量
   * 
   * 🎯 設計決策：保持現狀的理由
   * - 當前功能運作正常，效能可接受
   * - 客戶數量尚未達到升級閾值 (< 50K)
   * - 查詢時間在可接受範圍內 (< 3 秒)
   * - 節省資料庫最佳化的開發成本
   * 
   * ⬆️ 未來升級路徑：CustomerAnalyticsDatabaseService
   * 當客戶數量、查詢頻率或效能需求超過閾值時升級
   */
  getCustomerAnalyticsService(): CustomerAnalyticsZeroExpansionService {
    if (!this.instances.has('customerAnalytics')) {
      this.instances.set(
        'customerAnalytics',
        new CustomerAnalyticsZeroExpansionService(),
      )
    }
    return this.instances.get('customerAnalytics')
  }

  /**
   * 取得 DashboardApiService 實例（單例模式）
   * 提供儀表板概覽頁面所需的各項數據
   */
  getDashboardService(): DashboardApiService {
    if (!this.instances.has('dashboard')) {
      this.instances.set('dashboard', new DashboardApiService(this.supabase))
    }
    return this.instances.get('dashboard')
  }

  /**
   * 取得 AIPromptTemplateService 實例（單例模式）
   * Phase 3: Prompt 模板管理和三表分離架構
   */
  getAIPromptTemplateService(): AIPromptTemplateService {
    if (!this.instances.has('aiPromptTemplate')) {
      this.instances.set(
        'aiPromptTemplate',
        new AIPromptTemplateService(this.supabase),
      )
    }
    return this.instances.get('aiPromptTemplate')
  }

  /**
   * 取得 AIEnhancedAlertService 實例（單例模式）
   * Phase 3: AI 增強警示服務，使用三表分離架構
   */
  getAIEnhancedAlertService(): AIEnhancedAlertService {
    if (!this.instances.has('aiEnhancedAlert')) {
      this.instances.set(
        'aiEnhancedAlert',
        new AIEnhancedAlertService(this.supabase),
      )
    }
    return this.instances.get('aiEnhancedAlert')
  }

  /**
   * 取得 BusinessHealthAnalyticsService 實例（單例模式）
   * Phase 2: 業務健康度引擎，連接 business-health-analytics Edge Function
   */
  getBusinessHealthAnalyticsService(): BusinessHealthAnalyticsService {
    if (!this.instances.has('businessHealthAnalytics')) {
      this.instances.set(
        'businessHealthAnalytics',
        new BusinessHealthAnalyticsService(this.supabase),
      )
    }
    return this.instances.get('businessHealthAnalytics')
  }

  /**
   * 取得 CustomerSegmentationService 實例（單例模式）
   * Phase 3: 客戶分群引擎，連接 customer-segmentation Edge Function
   */
  getCustomerSegmentationService(): CustomerSegmentationService {
    if (!this.instances.has('customerSegmentation')) {
      this.instances.set(
        'customerSegmentation',
        new CustomerSegmentationService(this.supabase),
      )
    }
    return this.instances.get('customerSegmentation')
  }

  /**
   * 清除所有快取的服務實例
   */
  clearCache(): void {
    this.instances.clear()
  }

  /**
   * 取得所有服務實例（用於測試或除錯）
   */
  getAllServices() {
    return {
      user: this.getUserService(),
      product: this.getProductService(),
      order: this.getOrderService(),
      customer: this.getCustomerService(),
      campaignType: this.getCampaignTypeService(),
      productAnalytics: this.getProductAnalyticsService(),
      orderAnalytics: this.getOrderAnalyticsService(),
      customerAnalytics: this.getCustomerAnalyticsService(),
      supportAnalytics: this.getSupportAnalyticsService(),
      campaignAnalytics: this.getCampaignAnalyticsService(),
      campaignScoring: this.getCampaignScoringService(),
      dashboard: this.getDashboardService(),
      aiPromptTemplate: this.getAIPromptTemplateService(),
      aiEnhancedAlert: this.getAIEnhancedAlertService(),
      businessHealthAnalytics: this.getBusinessHealthAnalyticsService(),
      customerSegmentation: this.getCustomerSegmentationService(),
    }
  }
}
