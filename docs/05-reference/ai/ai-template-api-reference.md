# AI Template API 參考文檔

## 概述

本文檔提供 AI 模板系統的完整 API 參考，包含所有 TypeScript 介面、類別方法、資料庫函數和配置參數的詳細說明。

## TypeScript 介面定義

### 核心資料介面

#### `AIPromptTemplate`

AI 提示詞模板的完整介面定義。

```typescript
interface AIPromptTemplate {
  id: string                      // 模板唯一識別碼 (UUID)
  template_key: string            // 模板鍵值 (如: "alert_enhancement")
  template_name: string           // 模板顯示名稱 (如: "警示增強分析")
  category: string                // 模板分類 (如: "alert_analysis")
  prompt_template: string         // 模板內容 (包含 {{variable}} 變數)
  max_tokens: number             // 最大回應 token 數 (預設: 300)
  temperature: number            // 隨機性參數 (0.0-2.0, 預設: 0.3)
  required_variables: string[]    // 必要變數陣列
  optional_variables: string[]    // 可選變數陣列
  description?: string           // 模板說明 (可選)
  version: string                // 版本號 (如: "1.0")
  is_active: boolean             // 是否啟用
  created_at: string             // 建立時間 (ISO 8601 格式)
  updated_at: string             // 最後更新時間 (ISO 8601 格式)
  created_by?: string            // 建立者 ID (可選)
}
```

#### `AIPromptProviderConfig`

AI 提供商配置介面，連接模板與提供商的關聯配置。

```typescript
interface AIPromptProviderConfig {
  id: string                           // 配置唯一識別碼
  template_id: string                  // 關聯的模板 ID
  provider_id: string                  // 關聯的提供商 ID
  provider_name: string                // 提供商名稱 (如: "ollama")
  provider_display_name: string        // 提供商顯示名稱
  provider_specific_params: Record<string, any>  // 提供商特定參數
  priority: number                     // 優先級 (數字越小優先級越高)
  performance_score?: number           // 效能評分 (0-1, 可選)
  cost_efficiency_score?: number       // 成本效率評分 (0-1, 可選)
  quality_score?: number               // 品質評分 (0-1, 可選)
  overall_score?: number               // 綜合評分 (0-1, 可選)
  is_enabled: boolean                  // 是否啟用
  created_at: string                   // 建立時間
  updated_at: string                   // 更新時間
}
```

#### `BestProviderConfig`

最佳提供商配置查詢結果介面。

```typescript
interface BestProviderConfig {
  config_id: string                           // 配置 ID
  template_id: string                         // 模板 ID
  provider_id: string                         // 提供商 ID
  provider_name: string                       // 提供商名稱
  provider_specific_params: Record<string, any>  // 特定參數
  overall_score?: number                      // 綜合評分 (可選)
}
```

#### `PromptProcessingResult`

模板處理結果介面，包含處理後的提示詞和相關資訊。

```typescript
interface PromptProcessingResult {
  processed_prompt: string                    // 處理後的提示詞
  used_variables: Record<string, any>         // 實際使用的變數
  missing_required_variables: string[]        // 缺少的必要變數
  template_info: {                           // 模板基本資訊
    template_key: string                      // 模板鍵值
    template_name: string                     // 模板名稱
    max_tokens: number                        // 最大 token 數
    temperature: number                       // 溫度參數
  }
}
```

### 業務邏輯介面

#### `AIAlertContext`

AI 警示分析的上下文資訊。

```typescript
interface AIAlertContext {
  alertType: string              // 警示類型
  metric: string                 // 指標名稱
  currentValue: number           // 當前數值
  threshold: number              // 閾值
  historicalData?: any[]         // 歷史資料 (可選)
  businessContext?: string       // 業務背景 (可選)
}
```

#### `AIAlertSuggestion`

AI 警示建議結果。

```typescript
interface AIAlertSuggestion {
  summary: string                           // 分析摘要
  severity: 'low' | 'medium' | 'high' | 'critical'  // 嚴重程度
  recommendations: string[]                 // 建議措施陣列
  nextSteps: string[]                       // 後續步驟陣列
  confidence: number                        // 可信度 (0-1)
  reasoning: string                         // 分析推理過程
}
```

#### `AIAlertAnalysis`

完整的 AI 警示分析結果。

```typescript
interface AIAlertAnalysis {
  alert: DashboardAlert             // 原始警示資料
  aiSuggestion?: AIAlertSuggestion  // AI 建議結果 (可選)
  analysisTimestamp: Date           // 分析時間戳
  aiProviderUsed?: string           // 使用的 AI 提供商 (可選)
  aiModel?: string                  // 使用的 AI 模型 (可選)
  processingTime?: number           // 處理時間 (毫秒, 可選)
}
```

## AIPromptTemplateService 類別

### 類別初始化

```typescript
class AIPromptTemplateService extends BaseApiService<AIPromptTemplate, any> {
  constructor(supabase: SupabaseClient)
}

// 使用方式
import { AIPromptTemplateService } from '@/api/services/ai/AIPromptTemplateService'
import { supabase } from '@/lib/supabase'

const service = new AIPromptTemplateService(supabase)
```

### 模板查詢方法

#### `getActiveTemplates`

取得所有活躍的模板，支援分類篩選。

```typescript
async getActiveTemplates(category?: string): Promise<AIPromptTemplate[]>
```

**參數:**
- `category` (可選): 模板分類名稱

**回傳值:**
- `Promise<AIPromptTemplate[]>`: 活躍模板陣列

**範例:**
```typescript
// 取得所有活躍模板
const allTemplates = await service.getActiveTemplates()

// 取得特定分類模板
const alertTemplates = await service.getActiveTemplates('alert_analysis')
```

**可能的錯誤:**
- 資料庫連線錯誤
- 權限不足錯誤

---

#### `getTemplateByKey`

根據 template_key 取得特定模板詳情。

```typescript
async getTemplateByKey(templateKey: string): Promise<AIPromptTemplate>
```

**參數:**
- `templateKey` (必要): 模板鍵值

**回傳值:**
- `Promise<AIPromptTemplate>`: 模板詳細資料

**範例:**
```typescript
const template = await service.getTemplateByKey('alert_enhancement')
```

**可能的錯誤:**
- 模板不存在或已停用
- 資料庫查詢錯誤

---

#### `getTemplateProviderConfigs`

取得模板的所有提供商配置。

```typescript
async getTemplateProviderConfigs(templateKey: string): Promise<AIPromptProviderConfig[]>
```

**參數:**
- `templateKey` (必要): 模板鍵值

**回傳值:**
- `Promise<AIPromptProviderConfig[]>`: 提供商配置陣列 (按優先級排序)

**範例:**
```typescript
const configs = await service.getTemplateProviderConfigs('business_intelligence')
console.log('可用配置數量:', configs.length)
```

---

#### `getBestProviderConfig`

智能選擇最佳的提供商配置。

```typescript
async getBestProviderConfig(
  templateKey: string,
  preferredProviderId?: string,
  optimizationStrategy: 'performance' | 'cost' | 'quality' | 'balanced' = 'balanced'
): Promise<BestProviderConfig | null>
```

**參數:**
- `templateKey` (必要): 模板鍵值
- `preferredProviderId` (可選): 偏好的提供商 ID
- `optimizationStrategy` (可選): 優化策略，預設為 'balanced'

**優化策略說明:**
- `'performance'`: 基於 performance_score 選擇
- `'cost'`: 基於 cost_efficiency_score 選擇
- `'quality'`: 基於 quality_score 選擇
- `'balanced'`: 綜合評分 (效能40% + 成本30% + 品質30%)

**回傳值:**
- `Promise<BestProviderConfig | null>`: 最佳配置或 null (如無可用配置)

**範例:**
```typescript
// 使用預設平衡策略
const config = await service.getBestProviderConfig('trend_analysis')

// 指定效能優先策略
const fastConfig = await service.getBestProviderConfig(
  'alert_enhancement_critical',
  null,
  'performance'
)

// 偏好使用特定提供商
const preferredConfig = await service.getBestProviderConfig(
  'business_intelligence',
  'claude-provider-id',
  'quality'
)
```

### 模板處理方法

#### `processPrompt`

處理模板並執行變數替換。

```typescript
async processPrompt(
  templateKey: string,
  variables: Record<string, any>
): Promise<PromptProcessingResult>
```

**參數:**
- `templateKey` (必要): 模板鍵值
- `variables` (必要): 變數物件

**變數替換規則:**
- 必要變數: 如果缺少會在 `missing_required_variables` 中回報
- 可選變數: 如果缺少會替換為空字串
- 物件變數: 自動使用 `JSON.stringify` 序列化
- 佔位符格式: `{{variable_name}}`

**回傳值:**
- `Promise<PromptProcessingResult>`: 處理結果物件

**範例:**
```typescript
const result = await service.processPrompt(
  'customer_behavior_analysis',
  {
    customer_id: 'CUST_001',
    purchase_history: [
      { date: '2024-01-01', amount: 1000 }
    ],
    analysis_period: '30天'
  }
)

console.log('處理後的提示詞:', result.processed_prompt)
console.log('缺少的變數:', result.missing_required_variables)
```

---

#### `validatePromptVariables`

驗證提供的變數是否完整和正確。

```typescript
async validatePromptVariables(
  templateKey: string,
  variables: Record<string, any>
): Promise<{
  isValid: boolean
  missingRequired: string[]
  extraVariables: string[]
}>
```

**參數:**
- `templateKey` (必要): 模板鍵值
- `variables` (必要): 要驗證的變數物件

**回傳值:**
- `isValid`: 是否通過驗證 (所有必要變數都已提供)
- `missingRequired`: 缺少的必要變數陣列
- `extraVariables`: 額外提供但模板中未定義的變數陣列

**範例:**
```typescript
const validation = await service.validatePromptVariables(
  'alert_enhancement',
  {
    alert_details: '系統警示',
    extra_field: '額外資料'  // 模板中未定義的變數
    // 缺少: business_context (必要變數)
  }
)

console.log('驗證結果:', validation)
// { isValid: false, missingRequired: ['business_context'], extraVariables: ['extra_field'] }
```

### 統計與管理方法

#### `getTemplateStatistics`

取得模板系統的整體統計資訊。

```typescript
async getTemplateStatistics(): Promise<{
  total: number
  by_category: Record<string, number>
  active_templates: number
  total_provider_configs: number
}>
```

**回傳值:**
- `total`: 總模板數量
- `by_category`: 各分類的模板數量分布
- `active_templates`: 活躍模板數量
- `total_provider_configs`: 總配置數量

**範例:**
```typescript
const stats = await service.getTemplateStatistics()
console.log('系統統計:', {
  總模板數: stats.total,
  活躍模板: stats.active_templates,
  分類分布: stats.by_category
})
```

---

#### `getProviderPerformanceStats`

取得提供商效能統計資料。

```typescript
async getProviderPerformanceStats(): Promise<any[]>
```

**回傳值:**
- 效能統計陣列，包含各模板-提供商組合的綜合評分

**範例:**
```typescript
const stats = await service.getProviderPerformanceStats()

// 找出最佳效能的配置
const topPerformers = stats
  .filter(stat => stat.overall_score > 0.8)
  .sort((a, b) => b.overall_score - a.overall_score)
```

---

#### `updateConfigPerformanceScore`

更新提供商配置的效能評分。

```typescript
async updateConfigPerformanceScore(
  configId: string,
  scores: {
    performance_score?: number
    cost_efficiency_score?: number
    quality_score?: number
  }
): Promise<boolean>
```

**參數:**
- `configId` (必要): 配置 ID
- `scores` (必要): 評分物件 (所有評分都是可選的)

**評分範圍:**
- 所有評分都應在 0.0 到 1.0 之間
- 1.0 表示最佳表現，0.0 表示最差表現

**回傳值:**
- `Promise<boolean>`: 更新是否成功

**範例:**
```typescript
const success = await service.updateConfigPerformanceScore(
  'config-uuid-123',
  {
    performance_score: 0.92,
    cost_efficiency_score: 0.88,
    quality_score: 0.85
  }
)
```

### 模板管理方法

#### `createTemplate`

建立新的模板。

```typescript
async createTemplate(
  template: Omit<AIPromptTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<AIPromptTemplate>
```

**參數:**
- `template` (必要): 模板資料 (不包含自動產生的欄位)

**範例:**
```typescript
const newTemplate = await service.createTemplate({
  template_key: 'custom_analysis',
  template_name: '自定義分析模板',
  category: 'custom',
  description: '客製化的分析模板',
  prompt_template: '請分析 {{data}} 並提供 {{analysis_type}} 分析',
  required_variables: ['data', 'analysis_type'],
  optional_variables: ['context'],
  max_tokens: 400,
  temperature: 0.3,
  version: '1.0',
  is_active: true
})
```

---

#### `updateTemplate`

更新現有模板。

```typescript
async updateTemplate(
  templateId: string,
  updates: Partial<AIPromptTemplate>
): Promise<AIPromptTemplate>
```

**參數:**
- `templateId` (必要): 模板 ID
- `updates` (必要): 要更新的欄位

**範例:**
```typescript
const updatedTemplate = await service.updateTemplate(
  'template-uuid-123',
  {
    template_name: '更新後的模板名稱',
    max_tokens: 500,
    temperature: 0.2
  }
)
```

---

#### `cloneTemplate`

複製現有模板並建立新版本。

```typescript
async cloneTemplate(
  templateKey: string,
  newVersion: string,
  modifications?: Partial<AIPromptTemplate>
): Promise<AIPromptTemplate>
```

**參數:**
- `templateKey` (必要): 要複製的模板鍵值
- `newVersion` (必要): 新版本號
- `modifications` (可選): 要修改的欄位

**範例:**
```typescript
const clonedTemplate = await service.cloneTemplate(
  'alert_enhancement',
  '2.0',
  {
    template_name: '警示增強分析 v2.0',
    description: '新增歷史趨勢分析',
    max_tokens: 400
  }
)
```

### 系統診斷方法

#### `performSystemHealthCheck`

執行系統健康檢查。

```typescript
async performSystemHealthCheck(): Promise<any>
```

**回傳值:**
- 系統健康狀況報告

---

#### `performReadinessCheck`

執行系統就緒性檢查。

```typescript
async performReadinessCheck(): Promise<any>
```

**回傳值:**
- 系統就緒狀況報告

---

#### `testPromptProcessing`

測試模板處理功能。

```typescript
async testPromptProcessing(): Promise<any[]>
```

**回傳值:**
- 模板處理測試結果陣列

## AIEnhancedAlertService 類別

### 類別初始化

```typescript
class AIEnhancedAlertService {
  constructor(supabase: SupabaseClient)
}
```

### 主要方法

#### `useOllamaService`

設定和初始化 Ollama AI 服務。

```typescript
async useOllamaService(baseUrl = 'http://localhost:11434'): Promise<boolean>
```

**參數:**
- `baseUrl` (可選): Ollama 服務的基礎 URL，預設為 `http://localhost:11434`

**回傳值:**
- `Promise<boolean>`: 設定是否成功

**功能:**
- 清除舊的服務快取
- 創建新的 Ollama 服務實例
- 驗證服務配置
- 設定預設模型為 `phi4-mini:latest`

**範例:**
```typescript
const aiService = new AIEnhancedAlertService(supabase)

// 使用預設設定
const success = await aiService.useOllamaService()

// 自定義 Ollama 服務 URL
const customSuccess = await aiService.useOllamaService('http://custom-host:11434')
```

---

#### `enhanceAlert`

對警示進行 AI 增強分析。

```typescript
async enhanceAlert(
  alert: DashboardAlert,
  context: AIAlertContext
): Promise<AIAlertAnalysis>
```

**參數:**
- `alert` (必要): 原始警示資料
- `context` (必要): AI 分析上下文

**處理流程:**
1. 根據警示嚴重程度選擇適當模板
2. 準備模板變數
3. 選擇最佳 AI 提供商配置
4. 執行 AI 分析請求
5. 解析並結構化 AI 回應

**回傳值:**
- `Promise<AIAlertAnalysis>`: 完整的分析結果

**模板選擇邏輯:**
- 嚴重程度 `'critical'`: 使用 `alert_enhancement_critical`
- 其他嚴重程度: 使用 `alert_enhancement`
- 如有豐富業務上下文: 附加使用 `insight_deepening`

**範例:**
```typescript
const analysis = await aiService.enhanceAlert(
  {
    id: 'alert_001',
    type: 'performance',
    message: 'CPU 使用率過高',
    severity: 'high',
    timestamp: new Date(),
    source: 'monitoring'
  },
  {
    alertType: 'performance_issue',
    metric: 'cpu_usage',
    currentValue: 85,
    threshold: 80,
    businessContext: '電商網站主伺服器'
  }
)

if (analysis.aiSuggestion) {
  console.log('AI 建議:', analysis.aiSuggestion.recommendations)
}
```

## 資料庫函數參考

### `get_best_provider_config`

選擇指定模板的最佳提供商配置。

```sql
get_best_provider_config(
  p_template_key VARCHAR(50),
  p_preferred_provider_id UUID DEFAULT NULL,
  p_optimization_strategy VARCHAR(20) DEFAULT 'balanced'
)
```

**參數:**
- `p_template_key`: 模板鍵值
- `p_preferred_provider_id`: 偏好提供商 ID (可選)
- `p_optimization_strategy`: 優化策略

**選擇邏輯:**
1. 如指定偏好提供商且可用，優先返回
2. 根據優化策略計算評分
3. 返回評分最高且優先級最高的配置

**回傳值:**
```typescript
{
  config_id: string
  template_id: string
  provider_id: string
  provider_name: string
  provider_specific_params: object
  overall_score: number
}
```

---

### `clone_prompt_template`

複製模板並建立新版本。

```sql
clone_prompt_template(
  p_template_key VARCHAR(50),
  p_new_version VARCHAR(20),
  p_modifications JSONB DEFAULT '{}'
)
```

**參數:**
- `p_template_key`: 源模板鍵值
- `p_new_version`: 新版本號
- `p_modifications`: 修改內容 (JSON 格式)

**功能:**
- 停用同版本的舊模板
- 複製源模板資料
- 套用指定修改
- 返回新模板 ID

---

### `update_config_performance_score`

更新配置效能評分。

```sql
update_config_performance_score(
  p_config_id UUID,
  p_performance_score DECIMAL(3,2) DEFAULT NULL,
  p_cost_efficiency_score DECIMAL(3,2) DEFAULT NULL,
  p_quality_score DECIMAL(3,2) DEFAULT NULL
)
```

**參數:**
- `p_config_id`: 配置 ID
- `p_performance_score`: 效能評分 (0-1, 可選)
- `p_cost_efficiency_score`: 成本效率評分 (0-1, 可選)
- `p_quality_score`: 品質評分 (0-1, 可選)

**回傳值:**
- `boolean`: 更新是否成功

## 資料庫視圖

### `ai_prompt_templates_active`

活躍模板概覽視圖。

```sql
SELECT
  id, template_key, template_name, category, description,
  max_tokens, temperature, version, created_at, updated_at
FROM ai_prompt_templates
WHERE is_active = true
ORDER BY category, template_key
```

---

### `ai_prompt_provider_configs_active`

活躍配置概覽視圖。

```sql
SELECT
  ppc.id, ppc.template_id, pt.template_key, pt.template_name,
  ppc.provider_id, p.name as provider_name, p.display_name,
  ppc.provider_specific_params, ppc.priority,
  ppc.performance_score, ppc.cost_efficiency_score, ppc.quality_score,
  ppc.created_at, ppc.updated_at
FROM ai_prompt_provider_configs ppc
JOIN ai_prompt_templates pt ON ppc.template_id = pt.id
JOIN ai_providers p ON ppc.provider_id = p.id
WHERE ppc.is_active = true AND pt.is_active = true AND p.is_active = true
ORDER BY pt.template_key, ppc.priority
```

---

### `ai_prompt_provider_performance_stats`

效能統計視圖。

```sql
SELECT
  pt.template_key, pt.template_name,
  p.name as provider_name, p.display_name,
  ppc.priority, ppc.performance_score, ppc.cost_efficiency_score, ppc.quality_score,
  -- 計算綜合評分 (效能 40% + 成本效率 30% + 品質 30%)
  ROUND(
    COALESCE(ppc.performance_score * 0.4, 0) +
    COALESCE(ppc.cost_efficiency_score * 0.3, 0) +
    COALESCE(ppc.quality_score * 0.3, 0),
    3
  ) as overall_score,
  ppc.updated_at
FROM ai_prompt_provider_configs ppc
JOIN ai_prompt_templates pt ON ppc.template_id = pt.id
JOIN ai_providers p ON ppc.provider_id = p.id
WHERE ppc.is_active = true AND pt.is_active = true AND p.is_active = true
ORDER BY pt.template_key, overall_score DESC
```

## 🎛️ 設定參數

### 提供商特定參數

#### Ollama 參數

```json
{
  "model": "phi4-mini:latest",
  "temperature": 0.3,
  "max_tokens": 300,
  "ollama_specific": {
    "num_ctx": 4096,
    "num_predict": 300,
    "repeat_penalty": 1.1,
    "mirostat": 2,
    "mirostat_tau": 5.0
  }
}
```

#### OpenAI 參數

```json
{
  "model": "gpt-4o-mini",
  "temperature": 0.2,
  "max_tokens": 350,
  "openai_specific": {
    "top_p": 0.9,
    "presence_penalty": 0.1,
    "frequency_penalty": 0.1,
    "response_format": {"type": "text"},
    "seed": 42
  }
}
```

#### Claude 參數

```json
{
  "model": "claude-3-haiku",
  "temperature": 0.3,
  "max_tokens": 400,
  "claude_specific": {
    "stop_sequences": ["---", "總結："],
    "system_prompt_prefix": "你是專業的商業分析專家。"
  }
}
```

### 系統預設值

```typescript
// API 預設設定
const API_DEFAULTS = {
  AI_SERVICE_TIMEOUT: 30000,        // 30 秒逾時
  DEFAULT_MAX_TOKENS: 300,          // 預設最大 token 數
  DEFAULT_TEMPERATURE: 0.3,         // 預設溫度
  DEFAULT_MODEL: 'phi4-mini:latest', // 預設 Ollama 模型
  MAX_RETRIES: 2                    // 最大重試次數
}
```

## 相關資源

- [AI 模板系統架構](../../02-development/ai/ai-template-system.md)
- [AI 模板使用指南](../../04-guides/ai/ai-template-usage-guide.md)
- [BaseApiService 參考](../api/base-api-service.md)