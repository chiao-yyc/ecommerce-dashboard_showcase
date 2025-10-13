# Edge Functions 概述

## 什麼是 Edge Functions？

Supabase Edge Functions 是在全球邊緣節點運行的 TypeScript/JavaScript 無伺服器函數，提供低延遲的後端邏輯執行能力。

📖 **相關文檔**：
- [Edge Functions 開發指南](./development-guide.md) - 本地開發與測試
- [Edge Functions 部署](./deployment.md) - 部署與監控策略

## 🎯 當前專案 Edge Functions 架構

### Functions 目錄結構
```
supabase/functions/
├── _shared/                    # 共用模組
│   ├── cors.ts                # CORS 設定
│   ├── supabase.ts            # Supabase Client 初始化
│   └── types.ts               # 共用類型定義
├── allocate-inventory/         # 庫存分配
├── business-health-analytics/  # 業務健康度分析 ⭐
├── campaign-scoring/           # 活動評分 ⭐
├── customer-segmentation/      # 客戶分群 ⭐
├── mock-payment/               # 模擬支付
├── order-create/               # 訂單創建
├── order-summary/              # 訂單摘要
├── stock-adjust/               # 庫存調整
├── stock-in/                   # 入庫作業
├── sync-customer-record/       # 客戶記錄同步
├── sync-user-record/           # 使用者記錄同步
├── topic-analysis/             # 主題分析
├── track-event/                # 事件追蹤
└── xlsx-export/                # XLSX 匯出
```

**統計**: 15 個 Edge Functions，涵蓋業務邏輯、資料分析、檔案處理等領域。

## 📊 Functions 分類與用途

### 1. 業務邏輯保護類
保護敏感商業邏輯不暴露在前端。

#### **business-health-analytics** ⭐
**用途**: 計算多維度業務健康度指標

**核心功能**:
- 7 維度雷達圖分析（銷售、成本、訂單、客戶、庫存、客服、系統穩定度）
- 風險預警計算
- 趨勢預測
- 指標權重與閾值管理

**技術亮點**:
```typescript
// 複雜的業務計算邏輯在後端執行
const healthScore = {
  sales: calculateSalesHealth(metrics),
  cost: calculateCostHealth(metrics),
  order: calculateOrderHealth(metrics),
  customer: calculateCustomerHealth(metrics),
  inventory: calculateInventoryHealth(metrics),
  support: calculateSupportHealth(metrics),
  system: calculateSystemHealth(realtimeAlerts)
}
```

**為什麼需要 Edge Function？**
- 敏感的計算公式不能暴露在前端
- 涉及多表 JOIN 和複雜聚合計算
- 需要集中管理業務規則變更

#### **campaign-scoring** ⭐
**用途**: 活動效果評分與排名

**核心功能**:
- 分層歸因權重計算
- ROI 與 CPA 評分
- 活動績效排名
- 自訂評分權重

**技術亮點**:
```typescript
// 複雜的歸因邏輯和評分算法
const campaignScores = campaigns.map(campaign => ({
  id: campaign.id,
  score: calculateLayeredScore({
    primary: campaign.primary_revenue,
    secondary: campaign.secondary_revenue,
    tertiary: campaign.tertiary_revenue,
    cost: campaign.cost,
    orders: campaign.orders_count
  }),
  rank: calculateRank(campaign, allCampaigns)
}))
```

**為什麼需要 Edge Function？**
- 評分公式是核心商業機密
- 需要動態調整權重而不重新部署前端
- 複雜的排序和分組邏輯

#### **customer-segmentation** ⭐
**用途**: 客戶 RFM 分群與價值評估

**核心功能**:
- RFM 模型計算（Recency、Frequency、Monetary）
- 客戶價值評分
- 流失風險預測
- 個性化推薦

**技術亮點**:
```typescript
// 機器學習風格的客戶分群
const segmentation = {
  segment: classifyCustomer(rfm),
  churnRisk: predictChurnRisk(metrics),
  lifetime_value: calculateCLV(history),
  recommendations: generateRecommendations(profile)
}
```

**為什麼需要 Edge Function？**
- RFM 閾值是業務策略，需要頻繁調整
- 涉及大量歷史資料查詢和計算
- 預測模型需要在後端執行

### 2. 資料同步與整合類
處理跨系統資料同步和第三方整合。

#### **sync-customer-record**
**用途**: 客戶資料跨表同步

**核心功能**:
- customers 表與 auth.users 表同步
- 自動更新客戶統計資訊
- 觸發相關通知

#### **sync-user-record**
**用途**: 使用者資料同步

**核心功能**:
- 認證系統與業務系統資料同步
- 使用者角色權限更新
- 初始化使用者相關資料

### 3. 訂單與庫存管理類
處理訂單生命週期和庫存操作。

#### **order-create**
**用途**: 訂單創建與驗證

**核心功能**:
- 訂單資料驗證
- 庫存檢查與預留
- 訂單編號生成
- 通知觸發

#### **order-summary**
**用途**: 訂單摘要統計

**核心功能**:
- 訂單聚合統計
- 銷售趨勢分析
- 績效指標計算

#### **allocate-inventory** / **stock-adjust** / **stock-in**
**用途**: 庫存管理操作

**核心功能**:
- 庫存分配邏輯
- 庫存調整記錄
- 入庫作業處理

### 4. 支付與金流類
處理支付流程和金流整合。

#### **mock-payment**
**用途**: 模擬支付流程（開發環境）

**核心功能**:
- 模擬第三方支付回調
- 訂單狀態更新
- 支付記錄創建

### 5. 資料分析與匯出類
提供資料分析和檔案匯出功能。

#### **topic-analysis**
**用途**: 文本主題分析

**核心功能**:
- 客服對話主題分類
- 關鍵字提取
- 情緒分析

#### **xlsx-export**
**用途**: Excel 檔案匯出

**核心功能**:
- 大量資料匯出
- 自訂欄位篩選
- 格式化與樣式

### 6. 事件追蹤類
記錄使用者行為和系統事件。

#### **track-event**
**用途**: 事件追蹤與分析

**核心功能**:
- 使用者行為記錄
- 頁面瀏覽追蹤
- 事件聚合統計

## 🏗️ Edge Functions 架構模式

### 1. 共用模組模式 (_shared/)
將重複邏輯抽取為共用模組，減少代碼重複。

```typescript
// _shared/supabase.ts
export const createClient = () => {
  return createSupabaseClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// _shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

### 2. 請求驗證模式
統一處理認證和權限驗證。

```typescript
// 認證檢查
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  return new Response('Unauthorized', { status: 401 })
}

// JWT 驗證
const supabase = createClient()
const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

if (error || !user) {
  return new Response('Unauthorized', { status: 401 })
}
```

### 3. 錯誤處理模式
統一的錯誤處理和回應格式。

```typescript
try {
  // 業務邏輯
  const result = await performBusinessLogic(data)

  return new Response(
    JSON.stringify({ success: true, data: result }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
} catch (error) {
  console.error('Function error:', error)

  return new Response(
    JSON.stringify({ success: false, error: error.message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
  )
}
```

### 4. 資料庫查詢優化模式
使用 Postgres Views 和 Functions 減少查詢次數。

```typescript
// ✅ 好的範例：使用預建的視圖
const { data, error } = await supabase
  .from('business_health_metrics_view')
  .select('*')
  .single()

// ❌ 壞的範例：多次查詢和客戶端聚合
const orders = await supabase.from('orders').select('*')
const revenue = orders.reduce((sum, order) => sum + order.total, 0)
const avgOrder = revenue / orders.length
```

## 🚀 Edge Functions 開發工作流程

### 1. 本地開發
```bash
# 啟動單個 function
supabase functions serve business-health-analytics --env-file supabase/.env.local

# 啟動所有 functions
supabase functions serve --env-file supabase/.env.local
```

### 2. 測試
```bash
# 使用 curl 測試
curl -i --location --request POST 'http://localhost:54321/functions/v1/business-health-analytics' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"dateRange": {"start": "2024-01-01", "end": "2024-12-31"}}'

# 查看 function 日誌
supabase functions logs business-health-analytics
```

### 3. 部署
```bash
# 部署單個 function
supabase functions deploy business-health-analytics

# 部署所有 functions
supabase functions deploy
```

## 📊 效能考量

### 1. 冷啟動優化
- 減少 import 的模組數量
- 使用 Deno 的原生 API 而非 npm 套件
- 預熱關鍵資料（快取）

### 2. 執行時間限制
- Supabase Edge Functions 有 **150 秒**的執行時間限制
- 對於長時間運行的任務，考慮使用 PostgreSQL Functions 或 Background Jobs

### 3. 記憶體限制
- 預設記憶體限制為 **150 MB**
- 避免在 function 中載入大量資料
- 使用串流處理大型檔案

## 🔒 安全最佳實踐

### 1. 認證與授權
- 總是驗證 JWT Token
- 使用 RLS 政策進行資料存取控制
- 敏感操作使用 Service Role Key（小心使用）

### 2. 環境變數管理
```typescript
// ✅ 好的範例：從環境變數讀取敏感資訊
const apiKey = Deno.env.get('THIRD_PARTY_API_KEY')

// ❌ 壞的範例：硬編碼敏感資訊
const apiKey = 'sk_live_xxxxxxxxxxxxxxxx'
```

### 3. CORS 配置
- 生產環境限制特定域名
- 開發環境可以使用 `*`（如當前配置）

## 📚 相關資源

- [Supabase Edge Functions 官方文檔](https://supabase.com/docs/guides/functions)
- [Deno 官方文檔](https://deno.land/manual)
- [TypeScript 類型定義](https://www.typescriptlang.org/)
- [Edge Functions 開發指南](./development-guide.md)
- [Edge Functions 實作範例](./examples/)
