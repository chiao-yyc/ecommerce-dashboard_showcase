# AI 增強系統運維操作手冊

> **文件版本**: v1.0  
> **建立日期**: 2025-08-08  
> **適用對象**: 系統管理員、DevOps 工程師  
> **系統版本**: Phase 3 三表分離架構  

## 概述

本手冊說明 AI 增強系統的日常運維操作，包括 Provider 管理、模型配置、故障排除等關鍵操作。

## 系統架構概覽

### 三表分離架構
```
ai_prompt_templates         # Prompt 模板管理
    ↓ (多對多關係)
ai_prompt_provider_configs  # Provider-模板配置關係
    ↓ (外鍵關係)
ai_providers               # AI Provider 基本資訊
```

### 智慧選擇邏輯
系統會根據以下評分自動選擇最佳 Provider：
- **performance_score** (效能評分) 0-1
- **cost_efficiency_score** (成本效益評分) 0-1
- **quality_score** (品質評分) 0-1
- **overall_score** (綜合評分) = 效能40% + 成本效率30% + 品質30%

### Provider 評分機制詳解

#### 1. **評分來源與性質**
- **初始評分**: 基於各 AI 提供商特性的專家預估值，於資料庫遷移時直接定義
- **動態更新**: 可透過 `update_config_performance_score()` 函數根據實際使用數據調整
- **評分範圍**: 0.0 - 1.0 (小數點後兩位)

#### 2. **各提供商評分特性**

| 提供商 | 效能特色 | 成本效率 | 品質水平 | 使用場景 |
|--------|----------|----------|----------|----------|
| **OpenAI** | 高效能 (0.80-0.98) | 中低成本效率 (0.40-0.90) | 高品質 (0.80-0.99) | 平衡型需求 |
| **Claude** | 極高效能 (0.85-0.99) | 低成本效率 (0.30-0.80) | 最高品質 (0.85-1.0) | 高品質需求 |
| **Ollama** | 中等效能 (0.70) | 最高成本效率 (0.95) | 中等品質 (0.75) | 成本敏感需求 |

#### 3. **評分計算邏輯**

```sql
-- 綜合評分計算公式
overall_score = ROUND(
    COALESCE(performance_score * 0.4, 0) + 
    COALESCE(cost_efficiency_score * 0.3, 0) + 
    COALESCE(quality_score * 0.3, 0), 
    3
)

-- 優化策略選擇
CASE optimization_strategy
    WHEN 'performance' THEN performance_score
    WHEN 'cost' THEN cost_efficiency_score  
    WHEN 'quality' THEN quality_score
    ELSE overall_score  -- 'balanced' 預設
END
```

#### 4. **實際評分範例**

```sql
-- 查看 Alert Enhancement 模板的所有 Provider 評分
SELECT 
    ap.name as provider_name,
    ap.display_name,
    appc.performance_score,
    appc.cost_efficiency_score, 
    appc.quality_score,
    ROUND(
        COALESCE(appc.performance_score * 0.4, 0) + 
        COALESCE(appc.cost_efficiency_score * 0.3, 0) + 
        COALESCE(appc.quality_score * 0.3, 0), 3
    ) as overall_score,
    appc.priority
FROM ai_prompt_provider_configs appc
JOIN ai_providers ap ON appc.provider_id = ap.id
JOIN ai_prompt_templates apt ON appc.template_id = apt.id
WHERE apt.template_key = 'alert_enhancement'
  AND appc.is_active = true
ORDER BY overall_score DESC, priority ASC;

/*
範例輸出：
provider_name | performance_score | cost_efficiency_score | quality_score | overall_score | priority
claude        | 0.88             | 0.75                 | 0.92         | 0.845        | 20
openai        | 0.85             | 0.90                 | 0.88         | 0.869        | 10  
local         | 0.70             | 0.95                 | 0.75         | 0.780        | 30
*/
```

#### 5. **評分依據說明**

##### **效能評分 (Performance Score)**
- **評估標準**: AI 模型的回應速度、處理能力、API 穩定性
- **評分邏輯**: 
  - GPT-4o > Claude-3-Opus > GPT-4o-mini > Claude-3-Haiku > Ollama Local
  - 考慮 API 延遲、併發處理能力、服務可靠性

##### **成本效率評分 (Cost Efficiency Score)**  
- **評估標準**: Token 成本、API 呼叫費用、基礎設施成本
- **評分邏輯**:
  - Ollama Local (1.0) - 免費本地運行
  - GPT-4o-mini (0.85-0.90) - OpenAI 經濟型模型
  - Claude-3-Haiku (0.80-0.85) - Anthropic 經濟型模型
  - GPT-4o (0.50-0.70) - OpenAI 高級模型
  - Claude-3-Opus (0.30-0.50) - Anthropic 頂級模型

##### **品質評分 (Quality Score)**
- **評估標準**: 輸出內容準確性、專業程度、中文處理能力
- **評分邏輯**:
  - Claude-3-Opus (0.99-1.0) - 最高品質商業分析
  - GPT-4o (0.95-0.98) - 平衡型高品質
  - Claude-3-Sonnet (0.90-0.95) - 高品質且經濟
  - GPT-4o-mini (0.80-0.88) - 經濟型但品質良好
  - Ollama Local (0.70-0.80) - 基本品質但足夠使用

#### 6. **最佳實踐建議**

##### **生產環境配置**
```sql
-- 推薦生產環境評分調整
-- 優先考慮穩定性和品質，成本其次

-- Claude 用於高品質分析 (Executive Summary, Business Intelligence)
UPDATE ai_prompt_provider_configs SET
    performance_score = 0.95,
    cost_efficiency_score = 0.45,
    quality_score = 0.98
WHERE provider_id = (SELECT id FROM ai_providers WHERE name = 'claude')
  AND template_id IN (
      SELECT id FROM ai_prompt_templates 
      WHERE template_key IN ('executive_summary', 'business_intelligence')
  );

-- OpenAI 用於平衡型分析 (Alert Enhancement, Trend Analysis)  
UPDATE ai_prompt_provider_configs SET
    performance_score = 0.90,
    cost_efficiency_score = 0.75,
    quality_score = 0.88
WHERE provider_id = (SELECT id FROM ai_providers WHERE name = 'openai')
  AND template_id IN (
      SELECT id FROM ai_prompt_templates
      WHERE template_key IN ('alert_enhancement', 'trend_analysis')
  );
```

##### **開發環境配置**
```sql
-- 開發環境優先使用本地 Ollama (成本最低)
UPDATE ai_prompt_provider_configs SET
    performance_score = 0.85,  -- 提升本地效能評分
    cost_efficiency_score = 1.0,  -- 本地服務無成本
    quality_score = 0.80  -- 足夠的品質用於開發
WHERE provider_id = (SELECT id FROM ai_providers WHERE name = 'local');

-- 降低外部服務評分，避免開發時產生費用
UPDATE ai_prompt_provider_configs SET  
    performance_score = performance_score * 0.8,
    cost_efficiency_score = cost_efficiency_score * 0.5,
    quality_score = quality_score * 0.9
WHERE provider_id IN (
    SELECT id FROM ai_providers WHERE name IN ('openai', 'claude')
);
```

## 常用維運操作

### 1. 檢查系統健康狀況

```sql
-- 查看系統整體健康度
SELECT ai_system_health_check();

-- 檢查活躍的 Provider 配置
SELECT 
  apt.template_key,
  ap.name as provider_name,
  appc.provider_specific_params,
  appc.performance_score,
  appc.overall_score,
  appc.is_active
FROM ai_prompt_provider_configs appc
JOIN ai_prompt_templates apt ON appc.template_id = apt.id
JOIN ai_providers ap ON appc.provider_id = ap.id
WHERE appc.is_active = TRUE
ORDER BY apt.template_key, appc.overall_score DESC;
```

### 2. Provider 啟用/停用操作

#### ✅ 啟用 Local Ollama Provider
```sql
-- 啟用本機 Ollama 服務 (適用於開發/測試環境)
UPDATE ai_prompt_provider_configs 
SET is_active = TRUE
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'local';
```

#### ❌ 停用 OpenAI Provider  
```sql
-- 停用 OpenAI 服務 (節省成本或避免外部依賴)
UPDATE ai_prompt_provider_configs 
SET is_active = FALSE
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'openai';
```

#### ❌ 停用 Claude Provider
```sql
-- 停用 Claude 服務
UPDATE ai_prompt_provider_configs 
SET is_active = FALSE
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'claude';
```

### 3. 模型配置更新

#### 更新 Ollama 模型名稱
```sql
-- 更新 local provider 使用的模型 (例如：phi4-mini:latest)
UPDATE ai_prompt_provider_configs 
SET provider_specific_params = jsonb_set(
  provider_specific_params, 
  '{model}', 
  '"phi4-mini:latest"'
)
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'local';
```

#### 更新模型參數
```sql
-- 調整溫度參數 (控制創意性)
UPDATE ai_prompt_provider_configs 
SET provider_specific_params = jsonb_set(
  provider_specific_params, 
  '{temperature}', 
  '0.3'
)
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'local';

-- 調整最大 Token 數 (控制回應長度)
UPDATE ai_prompt_provider_configs 
SET provider_specific_params = jsonb_set(
  provider_specific_params, 
  '{max_tokens}', 
  '300'
)
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'local';
```

### 4. Provider 評分調整

#### 使用專用函數更新評分
```sql
-- 使用 update_config_performance_score 函數更新評分 (推薦)
SELECT update_config_performance_score(
  'config-uuid',  -- 配置 ID
  0.95,          -- performance_score
  1.0,           -- cost_efficiency_score
  0.90           -- quality_score
);

-- 查找特定配置的 ID (新版：使用統一視圖)
SELECT id, provider_name, template_key, health_grade, actual_success_rate_24h
FROM ai_prompt_provider_details 
WHERE provider_name = 'local' 
  AND template_key = 'alert_enhancement'
  AND is_fully_active = true;
```

#### 批量調整 Provider 評分
```sql
-- 提升本機 Provider 優先級 (開發環境推薦)
UPDATE ai_prompt_provider_configs 
SET 
  performance_score = 0.85,     -- 提升效能評分
  cost_efficiency_score = 1.0,  -- 本機服務無成本
  quality_score = 0.80,         -- 開發環境足夠品質
  updated_at = NOW()
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name = 'local';

-- 降低外部 Provider 評分 (避免開發時產生費用)
UPDATE ai_prompt_provider_configs 
SET 
  performance_score = performance_score * 0.8,  -- 相對降低效能評分
  cost_efficiency_score = cost_efficiency_score * 0.5,  -- 大幅降低成本效率
  quality_score = quality_score * 0.9,  -- 略微降低品質評分
  updated_at = NOW()
FROM ai_providers ap
WHERE ai_prompt_provider_configs.provider_id = ap.id
  AND ap.name IN ('openai', 'claude');
```

#### 策略性評分調整
```sql
-- 根據業務需求調整 Provider 選擇策略
-- 場景 1: 成本優先 (開發/測試環境)
UPDATE ai_prompt_provider_configs 
SET 
  performance_score = 0.75,
  cost_efficiency_score = 1.0,   -- 最大化成本效率權重
  quality_score = 0.75
WHERE provider_id = (SELECT id FROM ai_providers WHERE name = 'local');

-- 場景 2: 品質優先 (生產環境關鍵分析)
UPDATE ai_prompt_provider_configs 
SET 
  performance_score = 0.95,
  cost_efficiency_score = 0.40,
  quality_score = 0.99           -- 最大化品質權重
WHERE provider_id = (SELECT id FROM ai_providers WHERE name = 'claude')
  AND template_id IN (
    SELECT id FROM ai_prompt_templates 
    WHERE template_key IN ('executive_summary', 'business_intelligence')
  );

-- 場景 3: 平衡型 (一般業務分析)
UPDATE ai_prompt_provider_configs 
SET 
  performance_score = 0.88,      -- 平衡各項評分
  cost_efficiency_score = 0.75,  -- 中等成本效率
  quality_score = 0.85           -- 良好品質
WHERE provider_id = (SELECT id FROM ai_providers WHERE name = 'openai')
  AND template_id IN (
    SELECT id FROM ai_prompt_templates
    WHERE template_key IN ('alert_enhancement', 'trend_analysis')
  );
```

#### 動態評分監控
```sql
-- 檢查評分調整後的 Provider 選擇結果
SELECT 
  apt.template_key,
  ap.name as selected_provider,
  appc.performance_score,
  appc.cost_efficiency_score,
  appc.quality_score,
  ROUND(
    appc.performance_score * 0.4 + 
    appc.cost_efficiency_score * 0.3 + 
    appc.quality_score * 0.3, 3
  ) as calculated_overall_score
FROM (
  SELECT DISTINCT template_key FROM ai_prompt_templates WHERE is_active = true
) templates
CROSS JOIN LATERAL (
  SELECT * FROM get_best_provider_config(templates.template_key, NULL, 'balanced')
) best_config
JOIN ai_prompt_provider_configs appc ON appc.id = best_config.config_id
JOIN ai_providers ap ON ap.id = best_config.provider_id  
JOIN ai_prompt_templates apt ON apt.id = best_config.template_id
ORDER BY apt.template_key;
```

## 🚨 故障排除

### 問題 1：AI 分析返回 404 錯誤

**症狀**：
```
POST http://localhost:11434/api/chat 404 (Not Found)
ollama generating response: ollama POST /api/chat: HTTP 404: Not Found
```

**診斷步驟**：
1. 檢查日誌中使用的模型名稱
2. 確認該模型是否存在於 Ollama 中
3. 檢查 Provider 配置

**解決方案**：
```sql
-- 檢查當前最佳 Provider 配置
SELECT * FROM get_best_provider_config('alert_enhancement', NULL, 'balanced');

-- 如果返回不正確的 Provider，調整評分或停用不需要的 Provider
-- (參考上述 Provider 啟用/停用操作)
```

### 問題 2：系統選擇錯誤的 AI Provider

**症狀**：系統選擇了 OpenAI 但實際環境只有 Ollama

**診斷**：
```sql
-- 查看所有 Provider 的評分排序
SELECT 
  ap.name,
  appc.overall_score,
  appc.is_active,
  appc.provider_specific_params
FROM ai_prompt_provider_configs appc
JOIN ai_providers ap ON appc.provider_id = ap.id
JOIN ai_prompt_templates apt ON appc.template_id = apt.id
WHERE apt.template_key = 'alert_enhancement'
ORDER BY appc.overall_score DESC;
```

**解決方案**：
1. **方案 A（推薦）**：停用不需要的 Provider
2. **方案 B**：調整評分讓目標 Provider 獲得最高分
3. **方案 C**：在應用程序中指定 `preferredProviderId`

### 問題 3：Ollama 服務連線失敗

**症狀**：連線超時或拒絕連線

**檢查清單**：
- [ ] Ollama 服務是否正在運行？
- [ ] 防火牆設定是否正確？
- [ ] CORS 設定是否允許前端請求？

**解決步驟**：
```bash
# 檢查 Ollama 狀態
curl http://localhost:11434/api/version

# 檢查可用模型
curl http://localhost:11434/api/tags

# 測試聊天 API
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model": "phi4-mini:latest", "messages": [{"role": "user", "content": "test"}], "stream": false}'
```

## 🔄 定期維護任務

### 每週維護
- [ ] 檢查系統健康狀況
- [ ] 檢查 AI 回應品質
- [ ] 檢查各 Provider 的使用統計

### 每月維護  
- [ ] 檢查模型版本更新
- [ ] 檢查成本使用情況
- [ ] 檢查 Provider 效能評分
- [ ] 備份 AI 配置資料

### 季度維護
- [ ] 評估 Provider 配置最佳化
- [ ] 檢查 Prompt 模板效果
- [ ] 計劃模型升級

## 動態監控系統

### 使用記錄系統 (ai_usage_logs)
系統會自動記錄每次 AI 請求的詳細資訊，包括：
- **效能數據**: 回應時間、成功率、錯誤類型
- **成本資訊**: Token 使用量、預估費用
- **品質評估**: 用戶反饋、模型選擇準確性

### AI Provider 統一管理視圖 (ai_prompt_provider_details) ⭐ 新版

**重要更新 (2025-08-08)**: 統一 `ai_provider_realtime_stats` 和 `ai_prompt_provider_configs_active` 為單一視圖，提供完整的配置管理和效能監控。

#### 核心特性
- **預設 vs 實際對比**: 配置評分與實際效能的自動對比分析
- **健康度評級**: excellent/good/fair/poor/untested 自動評級系統
- **統一資料來源**: 一個視圖包含配置資訊和使用統計
- **向後相容**: 保留 `ai_prompt_provider_details_active` 視圖

#### 24 小時統計
- **請求數量**: 總請求數和成功請求數
- **成功率**: 成功請求佔總請求的百分比  
- **回應時間**: 平均和中位數回應時間
- **失敗分析**: 總失敗次數、錯誤分類、超時統計

#### 7 天統計
- **使用趨勢**: 7 天內的請求量變化
- **成本分析**: 總成本和平均每請求成本
- **Token 使用**: Token 使用量統計和趨勢

#### 效能對比指標
- **performance_variance**: 實際成功率 vs 預設效能評分的差異
- **health_grade**: 自動健康度評級 (基於實際成功率)
- **actual_cost_efficiency**: 實際成本效率計算

### 關鍵指標

#### 效能指標
- **回應成功率**: 基於實際使用記錄的成功率，計算公式：`成功請求數 / 總請求數 * 100%`
- **平均回應時間**: 實時計算的回應時間統計 (僅計算成功的請求)
- **可用性**: Provider 服務正常運行的時間比例

#### 失敗分析指標 (修復版)
- **總失敗次數**: `總請求數 - 成功請求數` (包含所有失敗類型)
- **錯誤分類統計**:
  - `error` - 一般錯誤 (API 錯誤、認證錯誤、rate_limit 等)
  - `timeout` - 超時錯誤 (請求超時)
  - `cancelled` - 取消的請求 (用戶主動取消)
- **錯誤率**: `失敗請求數 / 總請求數 * 100%`
- **錯誤嚴重程度評級**:
  - `low` - <5% 錯誤率 (綠色)
  - `medium` - 5%-15% 錯誤率 (黃色)
  - `high` - 15%-30% 錯誤率 (橙色)
  - `critical` - >30% 錯誤率 (紅色)

#### 成本效率指標
- **成本效率**: 基於實際 Token 使用的成本分析
- **Provider 健康度**: 綜合錯誤率和效能的健康評分

### 監控查詢

#### 統一視圖查詢 (推薦) ⭐
```sql
-- 查看所有配置的完整資訊 (包含實際 vs 預設對比)
SELECT template_key, provider_name, 
       config_performance_score, actual_success_rate_24h, 
       health_grade, performance_variance
FROM ai_prompt_provider_details 
ORDER BY actual_success_rate_24h DESC NULLS LAST, config_performance_score DESC;

-- 查詢僅活躍配置 (替代原 ai_prompt_provider_configs_active)
SELECT * FROM ai_prompt_provider_details_active;

-- 查看特定 Provider 的效能摘要
SELECT * FROM get_ai_provider_performance_summary(24) 
WHERE provider_name = 'openai';
```

#### 詳細使用記錄查詢
```sql
-- 最近 24 小時的使用統計
SELECT 
  provider_name,
  template_key,
  COUNT(*) as total_requests,
  ROUND(AVG(response_time_ms), 0) as avg_response_time,
  COUNT(*) FILTER (WHERE status = 'success') as successful_requests,
  ROUND(COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100, 2) as success_rate
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider_name, template_key
ORDER BY total_requests DESC;

-- 錯誤分析
SELECT 
  error_code,
  COUNT(*) as error_count,
  provider_name,
  ROUND(AVG(response_time_ms), 0) as avg_failed_response_time
FROM ai_usage_logs
WHERE status = 'error' AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY error_code, provider_name
ORDER BY error_count DESC;

-- 成本分析
SELECT 
  provider_name,
  DATE_TRUNC('day', created_at) as date,
  SUM(estimated_cost) as daily_cost,
  COUNT(*) as daily_requests,
  ROUND(AVG(estimated_cost), 6) as avg_cost_per_request
FROM ai_usage_logs
WHERE estimated_cost IS NOT NULL 
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider_name, DATE_TRUNC('day', created_at)
ORDER BY date DESC, daily_cost DESC;
```

#### 效能趨勢分析
```sql
-- 每小時請求量趨勢
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as requests,
  ROUND(AVG(response_time_ms), 0) as avg_response_time,
  COUNT(*) FILTER (WHERE status = 'success') as successful
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour;

-- Provider 比較分析
SELECT 
  provider_name,
  COUNT(*) as total_usage,
  ROUND(AVG(response_time_ms) FILTER (WHERE status = 'success'), 0) as avg_response_time,
  ROUND(COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100, 2) as success_rate,
  SUM(estimated_cost) as total_cost,
  COUNT(DISTINCT template_key) as templates_used
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider_name
ORDER BY total_usage DESC;
```

### 前端監控工具

#### AI Provider Management 介面
管理介面現在顯示真實的使用數據：

1. **總覽標籤**
   - 24小時請求數統計
   - 整體成功率和回應時間
   - 總成本和失敗次數 (修復版：包含所有失敗類型)
   - 活躍的 Provider 和模板數量
   - **詳細失敗分析** (新增): 當有失敗請求時顯示
     - 一般錯誤數量 (紅色標示)
     - 超時錯誤數量 (橙色標示)
     - 取消請求數量 (灰色標示)

2. **配置標籤**  
   - 每個配置的實際回應時間
   - 基於使用記錄的成功率
   - 動態更新的效能指標

3. **自動刷新**
   - 每30秒自動更新統計
   - 即時反映系統狀態變化

#### 使用指標 API
```typescript
// 使用 useAIUsageMetrics composable
const aiMetrics = useAIUsageMetrics({
  refetchInterval: 30000,  // 30秒刷新
  providerName: 'openai',  // 過濾特定 Provider
  templateKey: 'alert_enhancement'  // 過濾特定模板
})

// 獲取總體統計
console.log(aiMetrics.overallStats.value)
// {
//   totalRequests24h: 1250,
//   avgSuccessRate24h: 98.5,
//   avgResponseTime24h: 1200,
//   totalCost24h: 2.45,
//   totalErrors24h: 18
// }

// 獲取特定配置統計
const configStats = aiMetrics.getConfigStats('config-uuid')
console.log(configStats?.success_rate_24h) // 98.5
```

## 變更記錄模板

### 變更 Provider 配置時的記錄格式
```
日期: 2025-08-08
操作人員: [姓名]
變更類型: Provider 配置調整
變更內容: 
- 停用 OpenAI Provider (節省成本)
- 啟用 Local Ollama Provider 
- 模型更新為 phi4-mini:latest
影響範圍: AI 警示分析功能
測試狀態: ✅ 已驗證
回滾計劃: 重新啟用 OpenAI Provider (如需要)
```

## 🆘 緊急聯絡資訊

### 故障升級流程
1. **Level 1**: 系統管理員 - 基本配置調整
2. **Level 2**: 開發團隊 - 程式碼層級問題  
3. **Level 3**: 架構師 - 系統架構變更

### 重要備注
- 生產環境的 Provider 變更需要經過測試環境驗證
- 模型更新可能影響 AI 分析品質，需要測試驗證
- 成本相關的 Provider 變更需要成本中心批准

## 系統修復記錄

### 2025-08-08: 錯誤次數計算邏輯修復
- **問題識別**: 前端顯示的「錯誤次數」與成功率計算邏輯不一致
  - 成功率計算: `成功請求 / 總請求` (包含所有失敗類型)
  - 錯誤次數計算: 只計算 `status = 'error'` (不包含 timeout, cancelled)
- **實際影響**: 成功率顯示 75%，但錯誤次數顯示 0，造成管理員困惑
- **解決方案**: 
  - ✅ 修改前端邏輯: `失敗次數 = 總請求數 - 成功請求數`
  - ✅ 新增詳細失敗分類: 分別顯示 error/timeout/cancelled 數量  
  - ✅ 統一術語: 「錯誤次數」改為「失敗次數」
  - ✅ 新增錯誤嚴重程度評級和格式化函數
- **修復成果**: 
  - 邏輯一致性：失敗次數與成功率計算基準統一
  - 詳細錯誤分析：提供準確的問題診斷資訊
  - 用戶體驗改善：清楚的視覺化錯誤分類顯示

---

## 系統修復記錄

### 2025-08-08: AI 表格統一優化
- **問題**: `ai_provider_realtime_stats` 與 `ai_prompt_provider_configs_active` 兩表欄位重疊，前端查詢複雜
- **解決**: 建立 `ai_prompt_provider_details` 統一視圖，整合配置和統計資料
- **影響**: 
  - 前端 `AIProviderManagement.vue` 查詢來源統一
  - 新增健康度評級和效能對比分析
  - 查詢效能提升：單次查詢 <3ms
- **向後相容**: 保留 `ai_prompt_provider_details_active` 視圖

### 2025-08-08: 錯誤計算邏輯修復
- **問題**: 前端錯誤次數計算不一致，成功率75%但顯示錯誤次數0
- **根因**: 錯誤次數只計算 'error' 狀態，未包含 'timeout' 和 'cancelled'
- **修復**: 改為 `totalErrors24h = totalRequests24h - totalSuccessfulRequests24h`
- **增強**: 新增詳細錯誤分類顯示 (一般錯誤、超時錯誤、取消請求)

---

*此手冊將隨系統演進持續更新*