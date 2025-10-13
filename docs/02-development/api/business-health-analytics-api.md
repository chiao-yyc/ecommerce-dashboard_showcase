# Business Health Analytics API 規格文件

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐ (分析系統)

---
## 文件資訊

- **建立日期**: 2025-10-01
- **最後更新**: 2025-10-01
- **API 版本**: v1.0
- **Base URL**: `/functions/v1/business-health-analytics`

---

## API 概述

Business Health Analytics API 是企業級業務健康度分析引擎，提供完整的業務健康度計算、趨勢分析和智能洞察生成功能。

### 核心特性

- 🔐 **商業邏輯保護**: 關鍵演算法部署在 Edge Function，防止前端暴露
- 📊 **多維度分析**: 7 大業務維度健康度評估
- 🎯 **智能洞察**: 自動生成可執行的業務洞察和建議
- 🔄 **趨勢追蹤**: 支援週期性業務趨勢分析
- ⚡ **高效能**: 並行計算多項指標，秒級響應

### 適用場景

- 經營健康度總覽儀表板
- 業務決策支援系統
- 風險預警和監控
- 戰略規劃輔助工具

---

## API 端點

### 1. 取得完整業務健康度分析

#### 端點資訊

```
POST /functions/v1/business-health-analytics
```

#### 請求格式

**Headers**

```http
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>  (可選，Edge Function 支援匿名呼叫)
```

**Body Parameters**

```typescript
interface BusinessHealthRequest {
  period?: '7d' | '30d' | '90d'      // 分析週期 (預設: '30d')
  includeSystemHealth?: boolean       // 是否包含系統穩定度 (預設: true)
  includeTrends?: boolean             // 是否包含趨勢分析 (預設: true)
  includeInsights?: boolean           // 是否包含業務洞察 (預設: true)
}
```

**請求範例**

```http
POST /functions/v1/business-health-analytics
Content-Type: application/json

{
  "period": "30d",
  "includeSystemHealth": true,
  "includeTrends": true,
  "includeInsights": true
}
```

```bash
# cURL 範例
curl -X POST https://your-project.supabase.co/functions/v1/business-health-analytics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "period": "30d",
    "includeSystemHealth": true,
    "includeTrends": true,
    "includeInsights": true
  }'
```

```javascript
// JavaScript 範例
const { data, error } = await supabase.functions.invoke(
  'business-health-analytics',
  {
    body: {
      period: '30d',
      includeSystemHealth: true,
      includeTrends: true,
      includeInsights: true
    }
  }
)
```

#### 響應格式

**成功響應 (200 OK)**

```typescript
interface BusinessHealthResponse {
  success: true
  data: {
    metrics: BusinessHealthMetrics        // 7 維度健康度指標
    scoreDetails: HealthScoreDetails      // 綜合評分細節
    trends?: TrendAnalysis                // 趨勢分析 (可選)
    insights?: BusinessInsight[]          // 業務洞察 (可選，最多 5 個)
    timestamp: string                     // ISO 8601 格式時間戳
  }
}
```

**完整響應範例**

```json
{
  "success": true,
  "data": {
    "metrics": {
      "revenue": 7.5,
      "satisfaction": 8.2,
      "fulfillment": 9.1,
      "support": 6.8,
      "products": 7.0,
      "marketing": 0,
      "system": 8.5
    },
    "scoreDetails": {
      "customerQuality": 75.5,
      "operationalEfficiency": 85.2,
      "supportEffectiveness": 72.3,
      "overallScore": 77.7,
      "rating": "良好"
    },
    "trends": {
      "direction": "上升",
      "change": 5.2,
      "description": "業務表現持續改善",
      "customerChange": 3.5,
      "operationalChange": 6.8
    },
    "insights": [
      {
        "title": "業務成長動能強勁",
        "description": "業務指標上升 5.2%，表現優於預期",
        "type": "opportunity",
        "impact": "medium",
        "confidence": 0.9,
        "category": "成長機會",
        "actions": [
          "分析成功因素",
          "擴大優勢策略",
          "設定更高目標"
        ]
      },
      {
        "title": "客服效能待改善",
        "description": "客服健康度 6.8 分，可能影響客戶滿意度",
        "type": "info",
        "impact": "medium",
        "confidence": 0.8,
        "category": "客戶服務",
        "actions": [
          "優化回應時間",
          "培訓客服人員",
          "改善服務流程"
        ]
      }
    ],
    "timestamp": "2025-10-01T06:00:00.000Z"
  }
}
```

**錯誤響應 (4xx/5xx)**

```typescript
interface BusinessHealthErrorResponse {
  success: false
  error: string           // 錯誤訊息
  code?: string           // 錯誤代碼 (可選)
  details?: any           // 詳細錯誤資訊 (可選)
}
```

**錯誤響應範例**

```json
{
  "success": false,
  "error": "Invalid period parameter. Must be one of: 7d, 30d, 90d",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "period",
    "provided": "60d",
    "expected": ["7d", "30d", "90d"]
  }
}
```

---

## 資料模型

### BusinessHealthMetrics

7 大業務健康度維度指標 (0-10 分)

```typescript
interface BusinessHealthMetrics {
  revenue: number       // 營收成長健康度 (0-10)
  satisfaction: number  // 客戶滿意度 (0-10)
  fulfillment: number   // 訂單履行健康度 (0-10)
  support: number       // 客服效率健康度 (0-10)
  products: number      // 產品管理健康度 (0-10)
  marketing: number     // 行銷效果健康度 (0-10) [預留]
  system: number        // 系統穩定度 (0-10)
}
```

**欄位說明**

| 欄位 | 計算依據 | 資料來源 | 健康標準 |
|------|---------|---------|---------|
| revenue | 營收趨勢與目標達成率 | `order_summary` | ≥7.0 為健康 |
| satisfaction | 客戶滿意度與解決率 | `conversation_summary` | ≥8.0 為優秀 |
| fulfillment | 訂單完成率與準時率 | `order_summary` | ≥9.0 為優秀 |
| support | 客服回應時間與解決率 | `tickets`, `conversation_summary` | ≥7.0 為健康 |
| products | 庫存健康度與產品活躍度 | `inventories`, `products` | ≥7.0 為健康 |
| marketing | 行銷活動 ROI (預留) | - | - |
| system | 系統穩定度與 Realtime 狀態 | `realtime_alerts` | ≥8.0 為優秀 |

### HealthScoreDetails

綜合評分與分類得分

```typescript
interface HealthScoreDetails {
  customerQuality: number        // 客戶品質分數 (0-100)
  operationalEfficiency: number  // 營運效率分數 (0-100)
  supportEffectiveness: number   // 客服效能分數 (0-100)
  overallScore: number           // 綜合總分 (0-100)
  rating: string                 // 評級文字
}
```

**計算公式**

```typescript
// 客戶品質 = RFM 平均分數 × 10
customerQuality = (avgRfmScore / 5) * 100

// 營運效率 = 訂單完成率 × 100
operationalEfficiency = (completedOrders / totalOrders) * 100

// 客服效能 = (解決率 × 0.7 + 回應時間分數 × 0.3) × 100
supportEffectiveness = (resolutionRate * 0.7 + responseScore * 0.3) * 100

// 綜合總分 = (三項加總) / 3
overallScore = (customerQuality + operationalEfficiency + supportEffectiveness) / 3
```

**評級對照表**

| 分數範圍 | 評級 | 說明 |
|---------|------|------|
| 90-100 | 優秀 | 業務表現卓越，持續保持 |
| 75-89 | 良好 | 業務運行順暢，有小幅改善空間 |
| 60-74 | 普通 | 業務基本穩定，需關注弱項指標 |
| 40-59 | 需改善 | 存在明顯問題，建議制定改善計劃 |
| 0-39 | 待加強 | 嚴重問題，需立即採取行動 |

### TrendAnalysis

趨勢分析資料（週對週比較）

```typescript
interface TrendAnalysis {
  direction: '上升' | '下降' | '持平'  // 趨勢方向
  change: number                      // 變化幅度 (百分比，絕對值)
  description: string                 // 趨勢描述文字
  customerChange: number              // 客戶品質變化 (百分比)
  operationalChange: number           // 營運效率變化 (百分比)
}
```

**趨勢判定邏輯**

```typescript
avgChange = (customerChange + operationalChange) / 2

if (avgChange > 2) {
  direction = '上升'
  description = '業務表現持續改善'
} else if (avgChange < -2) {
  direction = '下降'
  description = '需要關注業務指標下滑'
} else {
  direction = '持平'
  description = '業務表現穩定'
}

change = Math.abs(avgChange)
```

**趨勢範例**

```json
{
  "direction": "上升",
  "change": 5.2,
  "description": "業務表現持續改善",
  "customerChange": 3.5,
  "operationalChange": 6.8
}
```

### BusinessInsight

業務洞察資料

```typescript
interface BusinessInsight {
  title: string                              // 洞察標題
  description: string                        // 詳細說明 (含具體數值)
  type: 'warning' | 'info' | 'opportunity'  // 洞察類型
  impact: 'high' | 'medium' | 'low'          // 影響程度
  confidence: number                         // 信心度 (0.00-1.00)
  category: string                           // 分類標籤
  actions: string[]                          // 建議行動清單
}
```

**洞察類型說明**

| type | 圖示 | 顏色 | 適用場景 |
|------|------|------|---------|
| warning | ⚠️ | 橘色/紅色 | 發現問題或風險，需要改善 |
| info | ℹ️ | 藍色 | 一般資訊，供參考 |
| opportunity | 🚀 | 綠色 | 發現機會，建議擴大優勢 |

**洞察範例**

```json
{
  "title": "業務成長動能強勁",
  "description": "業務指標上升 5.2%，表現優於預期",
  "type": "opportunity",
  "impact": "medium",
  "confidence": 0.9,
  "category": "成長機會",
  "actions": [
    "分析成功因素",
    "擴大優勢策略",
    "設定更高目標"
  ]
}
```

---

## 使用範例

### 前端整合 (Vue 3 + TypeScript)

#### 使用 Service 層

```typescript
// services/index.ts
import { defaultServiceFactory } from '@/api/services'

// 取得 Business Health Analytics Service
const healthService = defaultServiceFactory.getBusinessHealthAnalyticsService()

// 呼叫 API
const response = await healthService.getBusinessHealthAnalysis({
  period: '30d',
  includeSystemHealth: true,
  includeTrends: true,
  includeInsights: true
})

if (response.success) {
  console.log('Overall Score:', response.data.scoreDetails.overallScore)
  console.log('Insights:', response.data.insights)
} else {
  console.error('Error:', response.error)
}
```

#### 使用 Vue Query (推薦)

```typescript
// composables/queries/useBusinessHealthQueries.ts
import { useQuery } from '@tanstack/vue-query'
import { defaultServiceFactory } from '@/api/services'

export function useCompleteDashboardHealth(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['business-health-analytics', period],
    queryFn: async () => {
      const service = defaultServiceFactory.getBusinessHealthAnalyticsService()
      return await service.getBusinessHealthAnalysis({
        period,
        includeSystemHealth: true,
        includeTrends: true,
        includeInsights: true
      })
    },
    staleTime: 5 * 60 * 1000,  // 5 分鐘內不重新請求
    gcTime: 10 * 60 * 1000,    // 10 分鐘後清除快取
    retry: 2,                   // 失敗重試 2 次
    retryDelay: 1000            // 重試延遲 1 秒
  })
}
```

#### 組件中使用

```vue
<script setup lang="ts">
import { useCompleteDashboardHealth } from '@/composables/queries/useBusinessHealthQueries'
import { computed } from 'vue'

// 取得健康度資料
const healthQuery = useCompleteDashboardHealth('30d')

// 計算屬性
const overallScore = computed(() => {
  return healthQuery.data.value?.success
    ? healthQuery.data.value.data.scoreDetails.overallScore
    : 0
})

const insights = computed(() => {
  return healthQuery.data.value?.success
    ? healthQuery.data.value.data.insights || []
    : []
})

const isLoading = computed(() => healthQuery.isLoading.value)
const error = computed(() => healthQuery.error.value)

// 手動刷新
const handleRefresh = () => {
  healthQuery.refetch()
}
</script>

<template>
  <div>
    <!-- 載入狀態 -->
    <div v-if="isLoading">載入中...</div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error">發生錯誤：{{ error.message }}</div>

    <!-- 資料展示 -->
    <div v-else>
      <h2>綜合評分: {{ overallScore }}</h2>

      <div v-for="insight in insights" :key="insight.title">
        <h3>{{ insight.title }}</h3>
        <p>{{ insight.description }}</p>
        <ul>
          <li v-for="action in insight.actions" :key="action">
            {{ action }}
          </li>
        </ul>
      </div>

      <button @click="handleRefresh">刷新</button>
    </div>
  </div>
</template>
```

### 後端整合 (Node.js / Python)

#### Node.js 範例

```javascript
// node.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getBusinessHealth() {
  const { data, error } = await supabase.functions.invoke(
    'business-health-analytics',
    {
      body: {
        period: '30d',
        includeSystemHealth: true,
        includeTrends: true,
        includeInsights: true
      }
    }
  )

  if (error) {
    console.error('Error:', error)
    return null
  }

  return data
}

// 使用
getBusinessHealth().then(result => {
  if (result?.success) {
    console.log('Overall Score:', result.data.scoreDetails.overallScore)
    console.log('Rating:', result.data.scoreDetails.rating)
    console.log('Insights Count:', result.data.insights?.length || 0)
  }
})
```

#### Python 範例

```python
# python
from supabase import create_client, Client
import os

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)

def get_business_health():
    response = supabase.functions.invoke(
        'business-health-analytics',
        invoke_options={
            'body': {
                'period': '30d',
                'includeSystemHealth': True,
                'includeTrends': True,
                'includeInsights': True
            }
        }
    )

    return response.json()

# 使用
result = get_business_health()
if result.get('success'):
    print(f"Overall Score: {result['data']['scoreDetails']['overallScore']}")
    print(f"Rating: {result['data']['scoreDetails']['rating']}")
    print(f"Insights: {len(result['data'].get('insights', []))}")
```

---

## 錯誤處理

### 錯誤類型

#### 1. 參數驗證錯誤 (400 Bad Request)

**場景**: 提供的參數不符合規格

```json
{
  "success": false,
  "error": "Invalid period parameter. Must be one of: 7d, 30d, 90d",
  "code": "INVALID_PARAMETER",
  "details": {
    "parameter": "period",
    "provided": "60d",
    "expected": ["7d", "30d", "90d"]
  }
}
```

**處理建議**:
- 檢查 period 參數是否為 '7d', '30d', '90d' 之一
- 檢查 boolean 參數是否為 true/false

#### 2. 資料庫查詢錯誤 (500 Internal Server Error)

**場景**: 資料庫連線失敗或查詢錯誤

```json
{
  "success": false,
  "error": "Database query failed: Connection timeout",
  "code": "DB_ERROR"
}
```

**處理建議**:
- 檢查 Supabase 服務狀態
- 確認資料庫表和視圖存在
- 檢查網路連線

#### 3. 計算邏輯錯誤 (500 Internal Server Error)

**場景**: 健康度計算過程出現異常

```json
{
  "success": false,
  "error": "Health metrics calculation failed: Invalid data format",
  "code": "CALCULATION_ERROR",
  "details": {
    "stage": "calculateBusinessHealthMetrics",
    "reason": "Missing required field: order_summary"
  }
}
```

**處理建議**:
- 檢查資料庫是否有足夠的歷史資料
- 確認資料格式正確
- 聯繫技術支援

#### 4. 權限錯誤 (403 Forbidden)

**場景**: 沒有權限呼叫 Edge Function

```json
{
  "success": false,
  "error": "Insufficient permissions to access this function",
  "code": "PERMISSION_DENIED"
}
```

**處理建議**:
- 確認使用正確的 API Key
- 檢查 Edge Function 權限設定
- 確認使用者角色權限

### 錯誤處理最佳實踐

```typescript
async function fetchBusinessHealth() {
  try {
    const service = defaultServiceFactory.getBusinessHealthAnalyticsService()
    const response = await service.getBusinessHealthAnalysis({
      period: '30d',
      includeSystemHealth: true,
      includeTrends: true,
      includeInsights: true
    })

    if (!response.success) {
      // 處理業務邏輯錯誤
      console.error('Business Health Error:', response.error)

      // 根據錯誤類型提供友好訊息
      if (response.error?.includes('Invalid parameter')) {
        showToast('參數設定錯誤，請檢查輸入', 'error')
      } else if (response.error?.includes('Database')) {
        showToast('資料庫連線異常，請稍後再試', 'error')
      } else {
        showToast('系統錯誤，請聯繫技術支援', 'error')
      }

      return null
    }

    return response.data
  } catch (error) {
    // 處理網路錯誤或其他異常
    console.error('Unexpected Error:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      showToast('網路連線異常，請檢查網路設定', 'error')
    } else {
      showToast('發生未預期的錯誤', 'error')
    }

    return null
  }
}
```

---

## 效能與最佳化

### 請求效能

**典型響應時間**

| 資料量 | 不含趨勢 | 含趨勢 | 含洞察 |
|-------|---------|--------|--------|
| 小型 (<1000 筆) | 200-500ms | 300-700ms | 400-900ms |
| 中型 (1000-10000 筆) | 500-1000ms | 800-1500ms | 1000-2000ms |
| 大型 (>10000 筆) | 1000-2000ms | 1500-3000ms | 2000-4000ms |

### 快取策略

#### 前端快取 (Vue Query)

```typescript
// 推薦設定
{
  staleTime: 5 * 60 * 1000,   // 5 分鐘內不重新請求
  gcTime: 10 * 60 * 1000,     // 10 分鐘後清除快取
  retry: 2,                    // 失敗重試 2 次
  retryDelay: 1000             // 重試延遲 1 秒
}
```

#### Edge Function 內部快取

Edge Function 本身不實施快取，所有資料均為即時計算，確保資料準確性。

### 優化建議

#### 1. 條件式請求

根據使用場景選擇性包含資料：

```typescript
// 僅需基本分數時
const response = await service.getBusinessHealthAnalysis({
  period: '30d',
  includeSystemHealth: false,  // 不需要系統穩定度
  includeTrends: false,         // 不需要趨勢分析
  includeInsights: false        // 不需要洞察
})
// 響應時間可減少 30-50%
```

#### 2. 並行請求

如需多個週期的資料，可並行請求：

```typescript
const [data7d, data30d, data90d] = await Promise.all([
  service.getBusinessHealthAnalysis({ period: '7d' }),
  service.getBusinessHealthAnalysis({ period: '30d' }),
  service.getBusinessHealthAnalysis({ period: '90d' })
])
```

#### 3. 降級策略

實施降級機制，確保核心功能可用：

```typescript
let healthData = null

try {
  // 嘗試取得完整資料
  healthData = await service.getBusinessHealthAnalysis({
    period: '30d',
    includeSystemHealth: true,
    includeTrends: true,
    includeInsights: true
  })
} catch (error) {
  console.warn('Full analysis failed, falling back to basic metrics')

  // 降級為基本指標
  healthData = await service.getBusinessHealthAnalysis({
    period: '30d',
    includeSystemHealth: false,
    includeTrends: false,
    includeInsights: false
  })
}
```

---

## 安全性

### 認證授權

- **匿名訪問**: 支援，使用 Supabase Anon Key
- **已驗證訪問**: 支援，使用 Supabase Auth Token
- **服務端訪問**: 支援，使用 Service Role Key

### 資料隱私

- **商業邏輯保護**: 關鍵演算法在 Edge Function 執行，前端無法查看
- **資料脫敏**: 敏感業務指標僅返回分數，不暴露原始數值
- **存取控制**: 基於 Supabase RLS 策略控制資料存取

### 速率限制

- **Anon Key**: 每 IP 每分鐘 60 次請求
- **Auth Token**: 每用戶每分鐘 120 次請求
- **Service Role Key**: 無限制（內部服務使用）

超過限制時返回 429 Too Many Requests：

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 60,
    "period": "1 minute",
    "retry_after": 45
  }
}
```

---

## 版本歷史

### v1.0 (2025-10-01)

**初始版本發布**

- ✅ 7 維度業務健康度計算
- ✅ 綜合評分與評級系統
- ✅ 趨勢分析功能
- ✅ 智能洞察生成 (最多 5 個)
- ✅ 系統穩定度整合

---

## 相關資源

### 文件連結

- [業務健康度洞察系統架構](../architecture/business-health-insights-system.md)
- [業務規則對照表](../../05-reference/business-health-rules-matrix.md)
- [Edge Function 開發指南](../../04-guides/edge-functions/development-guide.md)

### 程式碼位置

- **Edge Function**: `/supabase/functions/business-health-analytics/index.ts`
- **API Service**: `/admin-platform-vue/src/api/services/BusinessHealthAnalyticsService.ts`
- **Vue Query**: `/admin-platform-vue/src/composables/queries/useBusinessHealthAnalyticsQueries.ts`
- **前端組件**: `/admin-platform-vue/src/views/dashboard/DashboardExecutiveHealth.vue`

### 測試工具

- **Postman Collection**: `docs/postman/business-health-analytics.json`
- **cURL 範例**: `docs/examples/curl-examples.sh`
- **單元測試**: `tests/edge-functions/business-health-analytics.test.ts`

---

## 技術支援

### 常見問題

**Q: 為什麼 `marketing` 維度總是返回 0？**
A: 行銷效果維度為預留欄位，目前尚未實施。預計在 v2.0 實現。

**Q: 趨勢分析為何只比較週對週？**
A: 目前版本使用固定 7 天週期比較。未來版本將支援自定義比較期間。

**Q: 洞察數量為何限制在 5 個？**
A: 基於 UX 考量，避免資訊過載。5 個洞察已涵蓋最關鍵的業務要點。

**Q: 可以自定義健康度評分權重嗎？**
A: 目前版本使用固定權重。企業級客戶可聯繫技術支援取得自定義方案。

### 回報問題

- **GitHub Issues**: https://github.com/your-org/ecommerce-dashboard/issues
- **Email**: support@your-company.com
- **Discord**: https://discord.gg/your-server

---

**文件維護者**: API 團隊
**最後審閱**: 2025-10-01
**下次審閱**: 2025-11-01