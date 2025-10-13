# AI Provider 系統架構設計
> Phase 2: 多提供商支援系統完整技術規範

## 概述

AI Provider 系統是一個可擴展的多提供商 AI 服務管理平台，支援 OpenAI、Anthropic Claude、Local Ollama 等多種 AI 服務提供商。系統提供統一的 API 介面、智能選擇邏輯、成本優化和完整的監控功能。

## 系統架構

### 核心組件關係圖

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Provider System                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layer                                             │
│  ├── AIProviderManagement.vue (管理界面)                    │
│  ├── useAIProviderQueries.ts (Vue Composables)            │
│  └── ai-provider.ts (TypeScript 類型定義)                  │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ├── AIProviderService.ts (核心服務邏輯)                   │
│  ├── ServiceFactory.ts (服務工廠)                          │
│  └── queryClient.ts (查詢金鑰管理)                         │
├─────────────────────────────────────────────────────────────┤
│  Database Layer                                             │
│  ├── ai_providers (提供商配置)                              │
│  ├── ai_models (模型配置)                                   │
│  ├── ai_use_cases (使用場景)                               │
│  ├── ai_provider_credentials (加密憑證)                     │
│  └── ai_usage_logs (使用記錄)                              │
├─────────────────────────────────────────────────────────────┤
│  Function Layer                                             │
│  ├── check_ai_provider_health() (健康檢查)                 │
│  ├── select_optimal_ai_provider() (智能選擇)               │
│  ├── get_ai_usage_analytics() (使用統計)                   │
│  └── validate_ai_provider_config() (配置驗證)              │
└─────────────────────────────────────────────────────────────┘
```

### 資料庫結構設計

#### 1. 核心資料表

**ai_providers** - AI 提供商配置
```sql
CREATE TABLE ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,           -- 'openai', 'claude', 'ollama'
    display_name VARCHAR(100) NOT NULL,         -- 'OpenAI GPT', 'Anthropic Claude'
    provider_type VARCHAR(20) NOT NULL,         -- 'cloud', 'local', 'hybrid'
    base_url VARCHAR(500),                      -- API 基礎 URL
    default_model VARCHAR(100),                 -- 預設模型
    supported_models JSONB,                     -- 支援模型清單
    supports_streaming BOOLEAN DEFAULT FALSE,   -- 串流支援
    max_tokens INTEGER DEFAULT 4096,           -- 最大 token 數
    cost_per_1k_input_tokens DECIMAL(10,6),   -- 輸入成本
    cost_per_1k_output_tokens DECIMAL(10,6),  -- 輸出成本
    is_active BOOLEAN DEFAULT TRUE,            -- 啟用狀態
    is_default BOOLEAN DEFAULT FALSE,          -- 預設提供商
    health_status VARCHAR(20) DEFAULT 'unknown' -- 健康狀態
);
```

**ai_models** - AI 模型配置
```sql
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_providers(id),
    model_name VARCHAR(100) NOT NULL,          -- 'gpt-4o-mini', 'claude-3-haiku'
    display_name VARCHAR(200) NOT NULL,        -- 人類友好名稱
    context_window INTEGER,                    -- 上下文窗口大小
    max_output_tokens INTEGER,                 -- 最大輸出 token
    quality_score DECIMAL(3,2),               -- 品質評分 (0-1)
    specialties TEXT[],                       -- 專長領域
    is_active BOOLEAN DEFAULT TRUE,           -- 啟用狀態
    is_recommended BOOLEAN DEFAULT FALSE       -- 推薦使用
);
```

**ai_use_cases** - 使用場景配置
```sql
CREATE TABLE ai_use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,        -- 'alert_generation', 'business_insights'
    display_name VARCHAR(200) NOT NULL,       -- 人類友好名稱
    required_capabilities TEXT[],             -- 必要能力
    min_context_window INTEGER DEFAULT 4096,  -- 最小上下文需求
    expected_response_tokens INTEGER DEFAULT 500, -- 預期回應長度
    preferred_provider_id UUID REFERENCES ai_providers(id), -- 偏好提供商
    preferred_model_id UUID REFERENCES ai_models(id),      -- 偏好模型
    system_prompt_template TEXT,              -- 系統提示詞範本
    temperature DECIMAL(3,2) DEFAULT 0.7      -- 創造性參數
);
```

**ai_usage_logs** - 使用記錄
```sql
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID REFERENCES ai_use_cases(id),
    provider_id UUID NOT NULL REFERENCES ai_providers(id),
    model_id UUID REFERENCES ai_models(id),
    input_tokens INTEGER,                     -- 輸入 token 數
    output_tokens INTEGER,                    -- 輸出 token 數
    cost_usd DECIMAL(10,6),                  -- 成本
    response_time_ms INTEGER,                -- 回應時間
    success BOOLEAN,                         -- 成功狀態
    error_message TEXT,                      -- 錯誤訊息
    business_context JSONB,                  -- 業務上下文
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. 安全與憑證管理

**ai_provider_credentials** - 加密憑證存儲
```sql
CREATE TABLE ai_provider_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_providers(id),
    environment VARCHAR(20) DEFAULT 'production', -- 環境區分
    api_key_encrypted TEXT,                       -- 加密的 API Key  
    organization_id VARCHAR(100),                 -- 組織 ID
    is_active BOOLEAN DEFAULT TRUE,               -- 啟用狀態
    expires_at TIMESTAMPTZ,                      -- 到期時間
    created_by UUID REFERENCES auth.users(id)
);
```

### 核心函數設計

#### 1. 智能提供商選擇

```sql
CREATE OR REPLACE FUNCTION select_optimal_ai_provider(
    use_case_name TEXT,
    fallback_enabled BOOLEAN DEFAULT true,
    performance_priority BOOLEAN DEFAULT false
)
RETURNS TABLE (
    provider_id UUID,
    provider_name TEXT, 
    model_id UUID,
    model_name TEXT,
    selection_reason TEXT,
    estimated_cost DECIMAL(10,6),
    estimated_response_time INTEGER
)
```

**選擇邏輯**：
1. 優先選擇使用場景的偏好提供商和模型
2. 檢查提供商健康狀態和可用性
3. 如果偏好不可用，使用備用提供商
4. 最後根據品質或效能自動選擇最佳可用選項

#### 2. 健康檢查機制

```sql
CREATE OR REPLACE FUNCTION check_ai_provider_health(
    provider_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    provider_id UUID,
    provider_name TEXT,
    health_status TEXT,
    response_time_ms INTEGER,
    error_message TEXT
)
```

**檢查類型**：
- **雲端服務**: 檢查 API 端點可用性
- **本地服務**: 檢查本地端點回應
- **混合服務**: 執行綜合可用性檢查

#### 3. 使用統計分析

```sql
CREATE OR REPLACE FUNCTION get_ai_usage_analytics(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW(),
    provider_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    provider_name TEXT,
    model_name TEXT,
    use_case_name TEXT,
    total_requests INTEGER,
    success_rate DECIMAL(5,2),
    avg_response_time INTEGER,
    total_cost_usd DECIMAL(10,2),
    avg_quality_rating DECIMAL(3,2)
)
```

## 功能特性

### 1. 多提供商支援

**支援的提供商類型**：
- **雲端服務** (OpenAI, Anthropic Claude)
- **本地服務** (Ollama, Local Models)  
- **混合服務** (Edge + Cloud)

**預設配置**：
```typescript
// OpenAI 配置
{
  name: 'openai',
  display_name: 'OpenAI GPT',
  provider_type: 'cloud',
  supported_models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  supports_streaming: true,
  supports_function_calling: true,
  max_tokens: 128000
}

// Claude 配置
{
  name: 'claude', 
  display_name: 'Anthropic Claude',
  provider_type: 'cloud',
  supported_models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  supports_streaming: true,
  max_tokens: 200000
}

// Ollama 配置
{
  name: 'ollama',
  display_name: 'Local Ollama',
  provider_type: 'local', 
  supported_models: ['llama3.1', 'codellama', 'mistral'],
  cost_per_1k_input_tokens: 0,
  cost_per_1k_output_tokens: 0
}
```

### 2. 智能選擇邏輯

**選擇策略**：
1. **偏好優先**: 使用場景配置的偏好提供商
2. **健康檢查**: 確保提供商處於健康狀態
3. **備援機制**: 自動切換到備用提供商
4. **效能優化**: 根據回應時間或品質自動選擇

**使用場景配置範例**：
```typescript
{
  name: 'alert_generation',
  display_name: '警示內容生成',
  required_capabilities: ['analysis', 'reasoning'],
  min_context_window: 8192,
  expected_response_tokens: 300,
  temperature: 0.3, // 較低創造性，注重準確性
  preferred_provider: 'openai',
  preferred_model: 'gpt-4o-mini'
}
```

### 3. 成本管理

**成本追蹤**：
- 每次 API 調用記錄 token 使用量和成本
- 按提供商、模型、使用場景統計
- 月度成本預測和優化建議

**成本優化建議**：
```typescript
interface CostOptimizationRecommendation {
  recommendation_type: 'cost_optimization'
  current_provider: string
  recommended_provider: string  
  potential_savings_usd: number
  potential_savings_percentage: number
  impact_on_quality: number
  recommendation_reason: string
}
```

### 4. 監控與分析

**效能指標**：
- 回應時間統計
- 成功率監控
- 品質評分追蹤
- Token 使用量分析

**健康監控**：
- 定時健康檢查 (每5分鐘)
- 自動故障切換
- 服務降級警報
- 歷史可用性統計

## 技術實現

### 前端層 (Vue 3 + TypeScript)

#### 核心 Composable

```typescript
// 使用 AI 提供商
export function useAIProviders(activeOnly = false) {
  const aiProviderService = defaultServiceFactory.getAIProviderService()
  
  return useQuery({
    queryKey: queryKeys.aiProvider.providers(activeOnly),
    queryFn: () => aiProviderService.getProviders(activeOnly),
    staleTime: 5 * 60 * 1000
  })
}

// 智能選擇提供商
export function useOptimalAIProvider(useCaseName: string, options = {}) {
  const aiProviderService = defaultServiceFactory.getAIProviderService()
  
  return useQuery({
    queryKey: queryKeys.aiProvider.optimal(useCaseName, options),
    queryFn: () => aiProviderService.selectOptimalProvider(useCaseName, options),
    enabled: computed(() => !!useCaseName)
  })
}
```

#### 管理界面組件

**AIProviderManagement.vue** - 完整的管理界面
- 系統狀態總覽
- 提供商列表和配置
- 模型管理
- 健康檢查控制
- 成本分析

### 服務層 (Service Factory Pattern)

#### AIProviderService

```typescript
export class AIProviderService extends BaseApiService {
  // 提供商管理
  async getProviders(activeOnly = false): Promise<AIProvider[]>
  async createProvider(provider: Partial<AIProvider>): Promise<AIProvider>
  async updateProvider(id: string, updates: Partial<AIProvider>): Promise<AIProvider>
  
  // 智能選擇
  async selectOptimalProvider(useCaseName: string, options = {}): Promise<AIProviderSelection>
  
  // 健康檢查
  async checkProviderHealth(providerName?: string): Promise<AIProviderHealthCheck[]>
  
  // 統計分析
  async getUsageAnalytics(startDate?, endDate?, providerFilter?): Promise<AIUsageAnalytics[]>
  async getCostOptimizationRecommendations(): Promise<AICostOptimizationRecommendation[]>
}
```

### 資料庫層 (PostgreSQL + Supabase)

#### RLS 政策

```sql
-- AI 提供商 - 認證用戶可查看
CREATE POLICY "AI providers viewable by authenticated users"
ON ai_providers FOR SELECT TO authenticated USING (true);

-- AI 憑證 - 僅超級管理員可管理
CREATE POLICY "AI credentials manageable by super admins only"  
ON ai_provider_credentials FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_details 
        WHERE user_id = auth.uid() 
        AND role_permissions->'system'->>'is_super_admin' = 'true'
    )
);

-- AI 使用記錄 - 認證用戶可查看
CREATE POLICY "AI usage logs viewable by authenticated users"
ON ai_usage_logs FOR SELECT TO authenticated USING (true);
```

#### 效能索引

```sql
-- 使用記錄效能索引
CREATE INDEX ai_usage_logs_provider_model_idx ON ai_usage_logs(provider_id, model_id);
CREATE INDEX ai_usage_logs_created_at_idx ON ai_usage_logs(created_at DESC);
CREATE INDEX ai_usage_logs_use_case_success_idx ON ai_usage_logs(use_case_id, success);

-- 提供商狀態索引
CREATE INDEX ai_providers_active_default_idx ON ai_providers(is_active, is_default);
CREATE INDEX ai_providers_health_status_idx ON ai_providers(health_status, last_health_check);
```

## 使用場景

### 1. 警示生成場景

```typescript
const alertUseCase = {
  name: 'alert_generation',
  display_name: '警示內容生成',
  system_prompt_template: `你是一個專業的業務分析師，負責解讀業務數據並生成準確的警示內容。
請保持專業、簡潔且具有可行性。`,
  user_prompt_template: `基於以下業務指標數據：{metrics_data}，
請分析異常情況並生成警示內容。
當前指標：{metric_name}，數值：{current_value}，閾值：{threshold_value}。`,
  output_format_schema: {
    title: 'string',
    message: 'string', 
    severity: 'critical|warning|info',
    recommended_action: 'string'
  },
  temperature: 0.3, // 低創造性，高準確性
  preferred_provider: 'openai',
  preferred_model: 'gpt-4o-mini'
}
```

### 2. 業務洞察場景

```typescript
const insightsUseCase = {
  name: 'business_insights',
  display_name: '業務洞察分析',
  system_prompt_template: `你是一個資深的業務策略分析師，
擅長從複雜的業務數據中發現關鍵洞察和趨勢。`,
  user_prompt_template: `請分析以下業務數據：{business_data}，
識別關鍵趨勢、模式和商機。重點關注：{focus_areas}。`,
  temperature: 0.5, // 中等創造性
  expected_response_tokens: 500,
  preferred_provider: 'claude',
  preferred_model: 'claude-3-haiku-20240307'
}
```

## 部署和配置

### 1. 資料庫 Migration

```bash
# 建立 AI Provider 系統
supabase migration apply 20250807110000_create_ai_provider_system

# 建立管理函數
supabase migration apply 20250807111000_create_ai_provider_functions
```

### 2. 環境變數配置

```env
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION=your_organization_id

# Anthropic Claude 配置  
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama 本地配置
OLLAMA_BASE_URL=http://localhost:11434
```

### 3. 預設數據初始化

系統會自動建立以下預設配置：
- 3 個 AI 提供商 (OpenAI, Claude, Ollama)
- 5 個預設模型配置
- 3 個使用場景範本

## 🔄 與現有系統整合

### 警示系統整合

```typescript
// 在警示生成中使用 AI Provider
const generateSmartAlert = async (alertData) => {
  // 1. 選擇最佳提供商
  const selection = await selectOptimalProvider('alert_generation')
  
  // 2. 構建提示詞
  const prompt = buildPromptFromTemplate(alertData)
  
  // 3. 調用 AI 服務 (此部分在 Phase 3 實現)
  const response = await callAIProvider(selection, prompt)
  
  // 4. 記錄使用情況  
  await logAPICall(selection, response)
  
  return response
}
```

### 業務洞察整合

```typescript
// 現有的統合內容生成可以升級為 AI 增強
const enhanceBusinessInsights = async (businessData) => {
  const useAIEnhancement = await checkAIProviderAvailability()
  
  if (useAIEnhancement) {
    return generateAIEnhancedInsights(businessData)
  } else {
    return generateBasicInsights(businessData) // 保持向後兼容
  }
}
```

## ⚡ 效能考量

### 1. 快取策略

- **提供商配置**: 15分鐘快取
- **模型資訊**: 10分鐘快取  
- **健康檢查**: 2分鐘快取，5分鐘自動更新
- **使用統計**: 10分鐘快取

### 2. 資料庫優化

- 使用複合索引加速查詢
- 分割使用記錄表 (按月分割)
- 定期清理過期的健康檢查記錄

### 3. API 限制處理

- 智能重試機制
- 自動降級到備用提供商
- 請求頻率限制監控

## 安全考量

### 1. 憑證管理

- 使用 Supabase Vault 加密存儲 API Keys
- 分環境管理憑證 (production, staging, development)
- 定期輪替 API Keys

### 2. 權限控制

- **一般用戶**: 可查看提供商狀態和使用統計
- **AI 管理員**: 可管理提供商配置和模型設定
- **超級管理員**: 可管理敏感憑證和系統配置

### 3. 資料保護

- 不記錄敏感的業務數據在 AI 日誌中
- 實施資料保留政策
- 遵循資料隱私法規

## 📈 監控指標

### 系統健康度指標
- 提供商可用性: >= 99%
- 平均回應時間: < 2000ms
- API 成功率: >= 95%
- 成本控制: 月度預算達成率

### 業務影響指標  
- AI 增強內容品質提升: 目標 20%
- 警示準確性提升: 目標 30%
- 用戶滿意度: 目標 4.5/5

## 後續發展 (Phase 3)

Phase 2 建立了完整的多提供商基礎架構，Phase 3 將實現：

1. **外部 AI 服務串接**
   - 實際的 OpenAI API 整合
   - Anthropic Claude API 整合  
   - Ollama 本地模型串接

2. **情境感知建議生成**
   - 基於業務上下文的智能提示詞
   - 動態參數調整
   - 個性化回應生成

3. **進階功能**
   - 串流輸出支援
   - 函數呼叫能力
   - 多輪對話管理

---

**文檔版本**: Phase 2 v1.0  
**建立日期**: 2025-08-07  
**下次更新**: Phase 3 實現完成後