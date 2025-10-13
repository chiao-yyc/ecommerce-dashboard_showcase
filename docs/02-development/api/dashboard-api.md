# DashboardApiService API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐⭐ (分析系統核心)

---
## 概覽

### 業務用途
DashboardApiService 是整合型 API 服務，匯集跨模組的業務數據，為管理層提供統一的營運總覽視圖。它串聯訂單、客戶、產品、客服、行銷等多個業務模組，計算關鍵績效指標（KPI）、成長率、健康度評分等高階分析數據。

### 核心功能
- **營運總覽儀表板** - 整合 9 大核心 KPI (營收、訂單、客戶、滿意度等)
- **業務健康度分析** - 7 維度雷達圖評分系統（營收/滿意度/履行/客服/產品/行銷/系統）
- **多維度營收趨勢** - 支援日/週/月三種粒度的營收、訂單、客戶趨勢分析
- **客戶價值分佈** - RFM × LTV 散點圖分析客戶分群
- **訂單履約漏斗** - 完整訂單生命週期各階段轉換率分析
- **系統警報整合** - 跨模組智能警報系統（庫存、客服、訂單、Realtime 連線）
- **即時監控面板** - 系統可用性、載入時間、線上用戶、待處理訂單

### 技術架構
- **繼承**: `BaseApiService<any, any>` (特殊設計，不綁定單一表格)
- **資料來源**:
  - **Database Functions**: `get_order_basic_summary`, `get_customer_overview`, `get_dashboard_revenue_trend`, `get_dashboard_customer_value_distribution` 等 15+ RPC 函數
  - **Database Views**: `customer_details`, `order_basic_funnel_analysis`, `conversation_summary_daily`, `product_with_current_stock`
  - **Edge Function**: `business-health-analytics` (業務健康度計算)
  - **Realtime Service**: `useRealtimeAlerts` (即時連線監控)
- **依賴服務**: `BusinessHealthAnalyticsService`, `getGlobalRealtimeAlerts()`
- **前端使用**: `DashboardOverview.vue` (主儀表板頁面)

### 資料庫層 API 參考
> **Supabase 資料來源參考**
>
> DashboardApiService 整合多個資料表和函數，如需查詢基礎 Schema：
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 查看以下資料表：
>    - **Views**: `customer_details`, `order_basic_funnel_analysis`, `conversation_summary_daily`
>    - **Tables**: `orders`, `customers`, `products`, `support_tickets`
> 3. 查看 Database Functions (RPC)：
>    - `get_order_basic_summary()`
>    - `get_customer_overview()`
>    - `get_dashboard_revenue_trend()`
>
> **何時使用 Supabase 文件**：
> - ✅ 查詢基礎資料表結構和視圖定義
> - ✅ 了解 RPC 函數的輸入輸出格式
> - ✅ 檢視資料關聯和約束
>
> **何時使用本文件**：
> - ✅ 使用 `DashboardApiService` 的整合分析方法
> - ✅ 了解業務健康度 7 維度計算邏輯
> - ✅ 學習 KPI 指標定義和成長率計算
> - ✅ 查看系統警報整合和即時監控架構

---

## API 方法詳細說明

### 核心總覽方法

#### `getOverview()` - 營運總覽數據

**用途**: 取得儀表板核心 KPI 數據，包含營收、訂單、客戶、滿意度等 9 大指標及其成長率

**方法簽名**:
```typescript
async getOverview(
  startDate?: string,  // 開始日期 (YYYY-MM-DD)
  endDate?: string     // 結束日期 (YYYY-MM-DD)
): Promise<ApiResponse<DashboardOverviewData>>
```

**參數**:
- `startDate`: 分析期間開始日期（預設：最近 30 天）
- `endDate`: 分析期間結束日期（預設：今天）

**回傳值**:
```typescript
interface DashboardOverviewData {
  // 核心 KPI 指標
  totalRevenue: number            // 總營收
  totalOrders: number             // 總訂單數
  activeCustomers: number         // 活躍客戶數
  customerSatisfaction: number    // 客戶滿意度 (0-100)

  // 成長率指標 (與前期比較)
  revenueGrowth: string           // 營收成長率 "+12.5%"
  orderGrowth: string             // 訂單成長率
  customerGrowth: string          // 客戶成長率
  satisfactionChange: string      // 滿意度變化

  // 營運效率指標
  targetAchievement: number       // 目標達成率 (%)
  conversionRate: number          // 轉換率 (%)
  customerRetention: number       // 客戶留存率 (%)
  avgResponseTime: string         // 平均回應時間 "25 分鐘"

  // 即時監控數據
  systemUptime: string            // 系統可用性 "99.9%"
  avgLoadTime: string             // 平均載入時間 "0.8s"
  onlineUsers: number             // 線上用戶數
  pendingOrders: number           // 待處理訂單數

  // 營收效率指標
  revenueEfficiency: string       // 營收效率 "85%"

  // 時間範圍
  periodStart: string
  periodEnd: string
  lastUpdated: string
}
```

**使用範例**:
```typescript
import { defaultServiceFactory } from '@/api/services'

const dashboardService = defaultServiceFactory.getDashboardService()

// 基本查詢 (預設最近 30 天)
const overview = await dashboardService.getOverview()
console.log('總營收:', overview.data.totalRevenue)
console.log('營收成長:', overview.data.revenueGrowth)

// 自訂日期範圍
const customOverview = await dashboardService.getOverview(
  '2025-01-01',
  '2025-01-31'
)
console.log('一月營收:', customOverview.data.totalRevenue)
```

**效能特性**:
- ⚡ **並行查詢優化**: 使用 `Promise.all()` 並行執行 9 個數據源查詢
- ⚡ **RPC 函數**: 資料庫層級計算，減少數據傳輸量
- ⚡ **備用方案**: 當 RPC 函數不可用時自動降級為基本查詢
- ⏱️ **平均回應時間**: 800ms-1500ms (取決於資料量)

**注意事項**:
- ⚠️ 成長率計算基於「前期相同長度」的時間範圍
- ⚠️ 客戶滿意度暫無收集機制，顯示為 0
- ⚠️ 系統可用性基於資料庫回應時間估算

---

### 業務健康度方法

#### `getBusinessHealthMetrics()` - 業務健康度指標

**用途**: 取得 7 維度業務健康度評分，所有計算邏輯在 Edge Function 執行，確保單一真實來源

**方法簽名**:
```typescript
async getBusinessHealthMetrics(): Promise<ApiResponse<BusinessHealthMetrics>>
```

**回傳值**:
```typescript
interface BusinessHealthMetrics {
  revenue: number       // 營收成長健康度 (0-10)
  satisfaction: number  // 客戶滿意度健康度 (0-10)
  fulfillment: number   // 訂單履行健康度 (0-10)
  support: number       // 客服效率健康度 (0-10)
  products: number      // 產品管理健康度 (0-10)
  marketing: number     // 行銷效果健康度 (0-10)
  system: number        // 系統穩定度健康度 (0-10)
}
```

**健康度計算邏輯** (在 Edge Function 執行):
```typescript
// 1. 營收成長 (revenue): 基於營收成長率
營收成長率 ≥ 20% → 10 分
營收成長率 10-20% → 7-9 分
營收成長率 0-10% → 4-6 分
營收成長率 < 0% → 0-3 分

// 2. 客戶滿意度 (satisfaction): 基於客服回應時間
平均回應 < 30 分鐘 → 10 分
平均回應 30-60 分鐘 → 7-9 分
平均回應 60-120 分鐘 → 4-6 分
平均回應 > 120 分鐘 → 0-3 分

// 3. 訂單履行 (fulfillment): 基於訂單完成率
完成率 ≥ 90% → 10 分
完成率 70-90% → 7-9 分
完成率 50-70% → 4-6 分
完成率 < 50% → 0-3 分

// 4. 客服效率 (support): 基於對話解決率
解決率 ≥ 85% → 10 分
解決率 70-85% → 7-9 分
解決率 50-70% → 4-6 分
解決率 < 50% → 0-3 分

// 5. 產品管理 (products): 基於庫存健康度
缺貨率 < 2% → 10 分
缺貨率 2-5% → 7-9 分
缺貨率 5-10% → 4-6 分
缺貨率 > 10% → 0-3 分

// 6. 行銷效果 (marketing): 基於客戶獲取成本與 LTV
LTV/CAC ≥ 3.0 → 10 分
LTV/CAC 2.0-3.0 → 7-9 分
LTV/CAC 1.0-2.0 → 4-6 分
LTV/CAC < 1.0 → 0-3 分

// 7. 系統穩定度 (system): 基於 Realtime 連線狀態
無警報 → 10 分
info 級別 → 8 分
warning 級別 → 5 分
error 級別 → 2 分
```

**使用範例**:
```typescript
const healthMetrics = await dashboardService.getBusinessHealthMetrics()

console.log('營收健康度:', healthMetrics.data.revenue, '/10')
console.log('系統穩定度:', healthMetrics.data.system, '/10')

// 計算整體健康度
const overallHealth = (
  healthMetrics.data.revenue +
  healthMetrics.data.satisfaction +
  healthMetrics.data.fulfillment +
  healthMetrics.data.support +
  healthMetrics.data.products +
  healthMetrics.data.marketing +
  healthMetrics.data.system
) / 7

console.log('整體健康度:', overallHealth.toFixed(1), '/10')
```

**技術特色**:
- 🔐 **單一真實來源**: 所有商業邏輯在伺服器端執行（Edge Function）
- 🔐 **安全性**: 使用 `BusinessHealthAnalyticsService` 呼叫受保護的 Edge Function
- ⚡ **效能**: Edge Function 並行計算 7 個維度，平均 600ms 內完成

---

### 趨勢分析方法

#### `getRevenueTrend()` - 多維度營收趨勢

**用途**: 取得營收、訂單、客戶數的時間序列趨勢數據，支援日/週/月三種粒度

**方法簽名**:
```typescript
async getRevenueTrend(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<RevenueTrendData[]>>
```

**參數**:
- `period`: 時間粒度
  - `'daily'` - 每日趨勢（預設），自動顯示最近 30 天
  - `'weekly'` - 每週趨勢，自動顯示最近 12 週
  - `'monthly'` - 每月趨勢，自動顯示最近 12 個月
- `startDate`: 自訂開始日期（選填，若不提供則使用動態範圍）
- `endDate`: 自訂結束日期（選填）

**回傳值**:
```typescript
interface RevenueTrendData {
  date: string          // 日期 "2025-10-01"
  revenue: number       // 當期營收
  orders: number        // 當期訂單數
  customers: number     // 當期新客戶數
}
```

**使用範例**:
```typescript
// 每日趨勢 (最近 30 天)
const dailyTrend = await dashboardService.getRevenueTrend('daily')
dailyTrend.data.forEach(day => {
  console.log(`${day.date}: 營收 $${day.revenue}, 訂單 ${day.orders}`)
})

// 每週趨勢 (最近 12 週)
const weeklyTrend = await dashboardService.getRevenueTrend('weekly')

// 每月趨勢 (最近 12 個月)
const monthlyTrend = await dashboardService.getRevenueTrend('monthly')

// 自訂日期範圍
const customTrend = await dashboardService.getRevenueTrend(
  'daily',
  '2025-01-01',
  '2025-01-31'
)
```

**動態範圍邏輯**:
```typescript
// 當 startDate 和 endDate 未提供時，使用動態範圍
daily:   最近 30 天
weekly:  最近 12 週 (84 天)
monthly: 最近 12 個月 (365 天)
```

**注意事項**:
- ⚠️ `weekly` 和 `monthly` 的分組邏輯在資料庫 RPC 函數中執行
- ⚠️ 若資料稀疏，某些日期可能沒有數據點（前端需處理空值）

---

#### `getCustomerValueDistribution()` - 客戶價值分佈

**用途**: 取得 RFM × LTV 客戶分佈數據，用於散點圖分析客戶分群和價值

**方法簽名**:
```typescript
async getCustomerValueDistribution(): Promise<ApiResponse<CustomerValueDistribution[]>>
```

**回傳值**:
```typescript
interface CustomerValueDistribution {
  customerId: string
  customerName?: string
  recency: number            // R: 最近購買天數 (越小越好)
  frequency: number          // F: 購買頻率 (次數)
  monetary: number           // M: 購買金額
  ltv: number                // LTV: 客戶終身價值
  rfmScore: number           // RFM 綜合分數 (1-5)
  segment: string            // 客戶分群
  registrationDate: string
  lastOrderDate: string
  totalOrders: number
  totalSpent: number
}
```

**客戶分群類型** (8 種):
```typescript
'champions'            // 💎 冠軍客戶 - 最近購買、高頻、高額
'loyal_customers'      // 🏆 忠誠客戶 - 定期購買、高頻
'potential_loyalists'  // ⭐ 潛力忠誠 - 最近購買、中頻
'new_customers'        // 🆕 新客戶 - 最近註冊、低頻
'at_risk'              // 🚨 流失風險 - 較久未購買
'cannot_lose_them'     // 🆘 不能失去 - 高價值但久未購買
'hibernating'          // 💤 休眠客戶 - 長期未購買
'lost'                 // ❌ 已流失 - 極長時間未購買
```

**使用範例**:
```typescript
const customerValue = await dashboardService.getCustomerValueDistribution()

// 分析冠軍客戶
const champions = customerValue.data.filter(c => c.segment === 'champions')
console.log(`冠軍客戶數: ${champions.length}`)
console.log(`冠軍客戶總價值: $${champions.reduce((sum, c) => sum + c.ltv, 0)}`)

// 找出流失風險客戶
const atRisk = customerValue.data.filter(c => c.segment === 'at_risk')
console.log('流失風險客戶:', atRisk.map(c => c.customerName))

// 按 LTV 排序找出高價值客戶
const topValueCustomers = [...customerValue.data]
  .sort((a, b) => b.ltv - a.ltv)
  .slice(0, 10)
```

**技術來源**:
- **Database RPC**: `get_dashboard_customer_value_distribution`
- **關聯視圖**: `customer_details` (包含 RFM 分析結果)

---

### 轉換漏斗方法

#### `getConversionFunnel()` - 訂單履約漏斗

**用途**: 取得訂單生命週期各階段的轉換數據，分析履約流程的瓶頸

**方法簽名**:
```typescript
async getConversionFunnel(): Promise<ApiResponse<ConversionFunnelData[]>>
```

**回傳值**:
```typescript
interface ConversionFunnelData {
  stage: string          // 階段代碼
  count: number          // 該階段訂單數
  percentage: number     // 相對於總訂單數的百分比
  label: string          // 階段中文名稱
}
```

**漏斗階段** (6 階段):
```typescript
1. total_orders  → 總訂單數    100%
2. confirmed     → 已確認      ~95%
3. paid          → 已付款      ~90%
4. shipped       → 已出貨      ~85%
5. delivered     → 已送達      ~80%
6. completed     → 已完成      ~75%
```

**使用範例**:
```typescript
const funnel = await dashboardService.getConversionFunnel()

// 計算各階段轉換率
funnel.data.forEach((stage, index) => {
  if (index > 0) {
    const prevStage = funnel.data[index - 1]
    const conversionRate = (stage.count / prevStage.count * 100).toFixed(1)
    console.log(`${prevStage.label} → ${stage.label}: ${conversionRate}%`)
  }
})

// 找出最大流失環節
let maxDrop = { from: '', to: '', dropRate: 0 }
funnel.data.forEach((stage, index) => {
  if (index > 0) {
    const prevStage = funnel.data[index - 1]
    const dropRate = ((prevStage.count - stage.count) / prevStage.count * 100)
    if (dropRate > maxDrop.dropRate) {
      maxDrop = { from: prevStage.label, to: stage.label, dropRate }
    }
  }
})
console.log(`最大流失: ${maxDrop.from} → ${maxDrop.to} (${maxDrop.dropRate.toFixed(1)}%)`)
```

**數據來源**:
- **Database View**: `order_basic_funnel_analysis` (每日聚合的訂單階段統計)
- **時間範圍**: 最近 30 天聚合數據

**業務洞察**:
- 🎯 **正常轉換率**: 總訂單 → 已完成約 70-80%
- ⚠️ **警戒信號**: 任一階段流失率 > 20% 需要優化
- 🚨 **嚴重問題**: 已付款 → 已出貨流失率 > 15% (履約效率問題)

---

### 系統警報方法

#### `getSystemAlerts()` - 跨模組系統警報

**用途**: 整合庫存、客服、訂單、Realtime 連線等多個模組的警報，統一顯示在儀表板

**方法簽名**:
```typescript
async getSystemAlerts(): Promise<ApiResponse<SystemAlert[]>>
```

**回傳值**:
```typescript
interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
}
```

**警報來源** (4 大模組):
```typescript
1. 庫存警報 (Inventory Alerts)
   - 缺貨警報 (error, high)    - "緊急：5 項商品缺貨"
   - 低庫存警報 (warning, medium) - "注意：12 項商品庫存偏低"
   - 庫存健康 (success, low)    - "正常：98 項商品庫存充足"

2. 客服警報 (Support Alerts)
   - 回應時間慢 (warning, medium) - "客服回應：平均 135 分鐘"
   - 回應時間良好 (success, low)  - "客服回應：平均 25 分鐘"
   - 工作量提醒 (info, low)        - "本週處理 87 個客服對話"

3. 訂單警報 (Order Alerts)
   - 待處理訂單多 (warning, high)  - "15 筆訂單超過 2 小時未處理"
   - 每日訂單統計 (info, low)       - "今日接收 32 筆訂單"

4. Realtime 連線警報
   - 連線失敗 (error, high)         - "Realtime 連線失敗 (notifications)"
   - 連線異常 (warning, medium)     - "Realtime 連線不穩定"
   - 連線正常 (success, low)        - "Realtime 連線正常"
```

**使用範例**:
```typescript
const alerts = await dashboardService.getSystemAlerts()

// 按嚴重程度分類
const errors = alerts.data.filter(a => a.type === 'error')
const warnings = alerts.data.filter(a => a.type === 'warning')
const info = alerts.data.filter(a => a.type === 'info')

console.log(`錯誤: ${errors.length}, 警告: ${warnings.length}, 資訊: ${info.length}`)

// 顯示最高優先級警報
const highPriorityAlerts = alerts.data.filter(a => a.priority === 'high')
highPriorityAlerts.forEach(alert => {
  console.log(`[${alert.type.toUpperCase()}] ${alert.message}`)
})
```

**警報優先級排序**:
```typescript
error (1)   → warning (2) → info (3) → success (4)
```

**警報限制**:
- 📋 最多顯示 8 個警報（避免卡片過載）
- ⏱️ 警報按優先級排序後截取前 8 個

**注意事項**:
- ⚠️ Realtime 警報透過 `getGlobalRealtimeAlerts()` 取得（即時狀態）
- ⚠️ 其他警報透過資料庫查詢取得（可能有輕微延遲）

---

### 產品排行方法

#### `getTopProducts()` - 熱銷產品排行

**用途**: 取得最近 30 天銷售排行榜，顯示產品銷售額和成長率

**方法簽名**:
```typescript
async getTopProducts(limit: number = 5): Promise<ApiResponse<TopProduct[]>>
```

**參數**:
- `limit`: 返回產品數量（預設 5，最多建議 10）

**回傳值**:
```typescript
interface TopProduct {
  id: string
  name: string
  sales: number     // 銷售額
  growth: string    // 成長率 "+15.2%"
  rank: number      // 排名 (1-based)
}
```

**使用範例**:
```typescript
// 取得 Top 5 產品
const topProducts = await dashboardService.getTopProducts(5)

topProducts.data.forEach(product => {
  console.log(`#${product.rank} ${product.name}: $${product.sales} (${product.growth})`)
})

// 取得 Top 10 產品
const top10 = await dashboardService.getTopProducts(10)
```

**排序邏輯**:
- 📊 **主要排序**: 銷售額 (descending)
- 📊 **次要排序**: 產品 ID (ascending)
- ⏱️ **時間範圍**: 最近 30 天

**數據來源**:
- **Database RPC**: `get_dashboard_top_products`
- **關聯表**: `order_items` JOIN `products`

---

### 用戶行為分析方法

#### `getUserBehaviorSummary()` - 用戶行為轉換摘要

**用途**: 取得用戶行為漏斗的摘要統計，包含總事件數、轉換率、用戶數、成長率

**方法簽名**:
```typescript
async getUserBehaviorSummary(): Promise<ApiResponse<UserBehaviorSummary>>
```

**回傳值**:
```typescript
interface UserBehaviorSummary {
  total_events: number      // 總事件數
  conversion_rate: number   // 轉換率 (%)
  total_users: number       // 總用戶數
  growth_rate: string       // 成長率 "+8.3%"
}
```

**使用範例**:
```typescript
const behavior = await dashboardService.getUserBehaviorSummary()

console.log(`用戶轉換率: ${behavior.data.conversion_rate}%`)
console.log(`總事件數: ${behavior.data.total_events.toLocaleString()}`)
console.log(`成長率: ${behavior.data.growth_rate}`)
```

**數據來源**:
- **Database RPC**: `get_dashboard_user_behavior_summary`
- **時間範圍**: 最近 30 天

---

#### `getUserBehaviorFunnelData()` - 用戶行為漏斗數據

**用途**: 取得詳細的用戶行為漏斗時間序列數據，分析從商品瀏覽到訂單完成的各階段轉換

**方法簽名**:
```typescript
async getUserBehaviorFunnelData(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<{
  funnelData: UserBehaviorFunnelData[]
  funnelSummary: UserBehaviorFunnelSummary
}>>
```

**回傳值**:
```typescript
interface UserBehaviorFunnelData {
  analysisDate: string           // 日期
  productViewCount: number       // 商品瀏覽次數
  addToCartCount: number         // 加入購物車次數
  checkoutStartCount: number     // 開始結帳次數
  paymentStartCount: number      // 開始付款次數
  orderCompleteCount: number     // 訂單完成次數
  conversionRate: number         // 該日轉換率
  totalRevenue: number           // 該日總營收
  avgOrderValue: number          // 平均訂單價值
}

interface UserBehaviorFunnelSummary {
  totalProductViews: number      // 總瀏覽次數
  avgConversionRate: number      // 平均轉換率
  totalUsers: number             // 總用戶數
  totalRevenue: number           // 總營收
  avgUserValue: number           // 平均每用戶價值
  keyInsight: string             // 關鍵洞察
}
```

**關鍵洞察生成邏輯**:
```typescript
轉換率 ≥ 15% → "轉換表現優秀！X% 的轉換率高於行業平均水準。"
轉換率 8-15% → "轉換表現良好，X 次商品瀏覽中有 Y 次成功轉換。"
轉換率 3-8%  → "轉換率 X% 有改善空間，建議優化購物流程降低用戶流失。"
轉換率 < 3%  → "轉換率偏低，建議分析用戶行為找出流失節點並優化體驗。"
```

**使用範例**:
```typescript
const funnelResult = await dashboardService.getUserBehaviorFunnelData()

// 漏斗摘要
const summary = funnelResult.data.funnelSummary
console.log('平均轉換率:', summary.avgConversionRate, '%')
console.log('總營收:', summary.totalRevenue)
console.log('關鍵洞察:', summary.keyInsight)

// 每日漏斗數據
funnelResult.data.funnelData.forEach(day => {
  console.log(`${day.analysisDate}: 瀏覽 ${day.productViewCount} → 完成 ${day.orderCompleteCount} (${day.conversionRate}%)`)
})
```

**數據來源**:
- **Database RPC**: `get_dashboard_user_behavior_funnel`
- **關聯表**: `funnel_events` (用戶行為事件追蹤表)

---

## 資料結構

### 核心實體類型

#### DashboardOverviewData (儀表板總覽數據)

```typescript
interface DashboardOverviewData {
  // 核心 KPI 指標
  totalRevenue: number
  totalOrders: number
  activeCustomers: number
  customerSatisfaction: number

  // 成長率指標
  revenueGrowth: string           // "+12.5%"
  orderGrowth: string
  customerGrowth: string
  satisfactionChange: string

  // 營運效率指標
  targetAchievement: number       // 百分比
  conversionRate: number
  customerRetention: number
  avgResponseTime: string         // "25 分鐘"

  // 即時監控數據
  systemUptime: string            // "99.9%"
  avgLoadTime: string             // "0.8s"
  onlineUsers: number
  pendingOrders: number

  // 營收效率指標
  revenueEfficiency: string       // "85%"

  // 時間範圍
  periodStart: string
  periodEnd: string
  lastUpdated: string
}
```

---

#### BusinessHealthMetrics (業務健康度指標)

```typescript
interface BusinessHealthMetrics {
  revenue: number       // 0-10 分
  satisfaction: number  // 0-10 分
  fulfillment: number   // 0-10 分
  support: number       // 0-10 分
  products: number      // 0-10 分
  marketing: number     // 0-10 分
  system: number        // 0-10 分
}
```

**7 維度說明**:
| 維度 | 評分來源 | 計算邏輯 |
|------|----------|----------|
| revenue | 營收成長率 | ≥20% → 10分, 10-20% → 7-9分, 0-10% → 4-6分, <0% → 0-3分 |
| satisfaction | 客服回應時間 | <30分 → 10分, 30-60分 → 7-9分, 60-120分 → 4-6分, >120分 → 0-3分 |
| fulfillment | 訂單完成率 | ≥90% → 10分, 70-90% → 7-9分, 50-70% → 4-6分, <50% → 0-3分 |
| support | 對話解決率 | ≥85% → 10分, 70-85% → 7-9分, 50-70% → 4-6分, <50% → 0-3分 |
| products | 庫存健康度 | 缺貨率 <2% → 10分, 2-5% → 7-9分, 5-10% → 4-6分, >10% → 0-3分 |
| marketing | LTV/CAC 比率 | ≥3.0 → 10分, 2.0-3.0 → 7-9分, 1.0-2.0 → 4-6分, <1.0 → 0-3分 |
| system | Realtime 連線狀態 | 無警報 → 10分, info → 8分, warning → 5分, error → 2分 |

---

#### RevenueTrendData (營收趨勢數據)

```typescript
interface RevenueTrendData {
  date: string          // "2025-10-01"
  revenue: number
  orders: number
  customers: number
}
```

---

#### CustomerValueDistribution (客戶價值分佈)

```typescript
interface CustomerValueDistribution {
  customerId: string
  customerName?: string
  recency: number            // 最近購買天數
  frequency: number          // 購買頻率
  monetary: number           // 購買金額
  ltv: number                // 客戶終身價值
  rfmScore: number           // RFM 分數 (1-5)
  segment: 'champions' | 'loyal_customers' | 'potential_loyalists' |
           'new_customers' | 'at_risk' | 'cannot_lose_them' |
           'hibernating' | 'lost'
  registrationDate: string
  lastOrderDate: string
  totalOrders: number
  totalSpent: number
}
```

---

#### ConversionFunnelData (轉換漏斗數據)

```typescript
interface ConversionFunnelData {
  stage: string          // 'total_orders', 'confirmed', 'paid', etc.
  count: number
  percentage: number
  label: string          // '總訂單數', '已確認', '已付款', etc.
}
```

---

#### TopProduct (熱銷產品)

```typescript
interface TopProduct {
  id: string
  name: string
  sales: number
  growth: string        // "+15.2%"
  rank: number
}
```

---

#### SystemAlert (系統警報)

```typescript
interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
}
```

---

### 資料映射邏輯

DashboardApiService 與其他服務不同，不綁定單一資料表，因此 `mapDbToEntity()` 和 `mapEntityToDb()` 僅返回原始數據：

```typescript
protected mapDbToEntity(dbEntity: any): any {
  return dbEntity
}

protected mapEntityToDb(entity: any): any {
  return entity
}
```

實際的數據轉換邏輯分散在各個方法中，直接使用 RPC 函數返回的格式。

---

## 使用範例

### 完整業務流程範例

```typescript
import { defaultServiceFactory } from '@/api/services'

// 取得 Dashboard 服務實例
const dashboardService = defaultServiceFactory.getDashboardService()

// 1. 取得營運總覽數據
const overview = await dashboardService.getOverview()
console.log('總營收:', overview.data.totalRevenue)
console.log('營收成長:', overview.data.revenueGrowth)
console.log('訂單量:', overview.data.totalOrders)
console.log('活躍客戶:', overview.data.activeCustomers)

// 2. 取得業務健康度
const healthMetrics = await dashboardService.getBusinessHealthMetrics()
const overallHealth = (
  healthMetrics.data.revenue +
  healthMetrics.data.satisfaction +
  healthMetrics.data.fulfillment +
  healthMetrics.data.support +
  healthMetrics.data.products +
  healthMetrics.data.marketing +
  healthMetrics.data.system
) / 7
console.log('整體健康度:', overallHealth.toFixed(1), '/10')

// 3. 取得營收趨勢
const dailyTrend = await dashboardService.getRevenueTrend('daily')
const weeklyTrend = await dashboardService.getRevenueTrend('weekly')
console.log('每日趨勢:', dailyTrend.data.length, '天')
console.log('每週趨勢:', weeklyTrend.data.length, '週')

// 4. 取得客戶價值分佈
const customerValue = await dashboardService.getCustomerValueDistribution()
const champions = customerValue.data.filter(c => c.segment === 'champions')
console.log('冠軍客戶數:', champions.length)

// 5. 取得訂單履約漏斗
const funnel = await dashboardService.getConversionFunnel()
const overallConversionRate = (
  funnel.data[funnel.data.length - 1].count / funnel.data[0].count * 100
).toFixed(1)
console.log('整體訂單完成率:', overallConversionRate, '%')

// 6. 取得系統警報
const alerts = await dashboardService.getSystemAlerts()
const errors = alerts.data.filter(a => a.type === 'error')
console.log('系統錯誤警報:', errors.length, '個')

// 7. 取得熱銷產品
const topProducts = await dashboardService.getTopProducts(5)
console.log('Top 1 產品:', topProducts.data[0].name, '$', topProducts.data[0].sales)

// 8. 取得用戶行為分析
const behavior = await dashboardService.getUserBehaviorSummary()
console.log('用戶轉換率:', behavior.data.conversion_rate, '%')
```

---

### 在 Vue 組件中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { defaultServiceFactory } from '@/api/services'
import type { DashboardOverviewData } from '@/types'

const dashboardService = defaultServiceFactory.getDashboardService()
const overview = ref<DashboardOverviewData | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function loadDashboardData() {
  loading.value = true
  error.value = null
  try {
    const result = await dashboardService.getOverview()
    if (result.success) {
      overview.value = result.data
    } else {
      error.value = result.error || '載入失敗'
    }
  } catch (e) {
    error.value = '載入儀表板數據失敗'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <div v-if="loading">載入中...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else-if="overview">
    <h1>營運總覽</h1>
    <div class="kpi-cards">
      <div>總營收: {{ overview.totalRevenue.toLocaleString() }}</div>
      <div>訂單量: {{ overview.totalOrders }}</div>
      <div>活躍客戶: {{ overview.activeCustomers }}</div>
      <div>營收成長: {{ overview.revenueGrowth }}</div>
    </div>
  </div>
</template>
```

---

### 在 Composable 中使用 (Vue Query)

```typescript
// composables/useDashboardQueries.ts
import { useQuery } from '@tanstack/vue-query'
import { defaultServiceFactory } from '@/api/services'
import type { MaybeRefOrGetter } from 'vue'

export function useDashboardOverview(filters: MaybeRefOrGetter<{
  startDate?: string
  endDate?: string
}>) {
  const dashboardService = defaultServiceFactory.getDashboardService()

  return useQuery({
    queryKey: ['dashboard', 'overview', filters],
    queryFn: async () => {
      const f = toValue(filters)
      const result = await dashboardService.getOverview(f.startDate, f.endDate)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard overview')
      }
      return result.data
    },
    staleTime: 2 * 60 * 1000, // 2 分鐘快取
    refetchInterval: 5 * 60 * 1000, // 5 分鐘自動重新查詢
  })
}

export function useBusinessHealthMetrics() {
  const dashboardService = defaultServiceFactory.getDashboardService()

  return useQuery({
    queryKey: ['dashboard', 'business-health'],
    queryFn: async () => {
      const result = await dashboardService.getBusinessHealthMetrics()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch business health metrics')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 分鐘快取
  })
}

export function useRevenueTrend(
  period: MaybeRefOrGetter<'daily' | 'weekly' | 'monthly'>,
  filters: MaybeRefOrGetter<{ startDate?: string; endDate?: string }>
) {
  const dashboardService = defaultServiceFactory.getDashboardService()

  return useQuery({
    queryKey: ['dashboard', 'revenue-trend', period, filters],
    queryFn: async () => {
      const p = toValue(period)
      const f = toValue(filters)
      const result = await dashboardService.getRevenueTrend(p, f.startDate, f.endDate)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch revenue trend')
      }
      return result.data
    },
    staleTime: 3 * 60 * 1000, // 3 分鐘快取
  })
}
```

**在組件中使用 Composable**:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDashboardOverview, useBusinessHealthMetrics, useRevenueTrend } from '@/composables/queries/useDashboardQueries'

const filters = ref({ startDate: '2025-09-01', endDate: '2025-09-30' })
const trendPeriod = ref<'daily' | 'weekly' | 'monthly'>('daily')

const { data: overview, isLoading: overviewLoading } = useDashboardOverview(filters)
const { data: healthMetrics, isLoading: healthLoading } = useBusinessHealthMetrics()
const { data: revenueTrend, isLoading: trendLoading } = useRevenueTrend(trendPeriod, filters)
</script>

<template>
  <div v-if="!overviewLoading && overview">
    <h2>總營收: {{ overview.totalRevenue }}</h2>
    <p>成長率: {{ overview.revenueGrowth }}</p>
  </div>

  <div v-if="!healthLoading && healthMetrics">
    <h2>業務健康度</h2>
    <p>營收: {{ healthMetrics.revenue }}/10</p>
    <p>系統: {{ healthMetrics.system }}/10</p>
  </div>
</template>
```

---

## 注意事項與最佳實踐

### 效能優化

**並行查詢最佳實踐**:
```typescript
// ✅ 好的做法：使用 Promise.all 並行查詢
const [overview, healthMetrics, topProducts] = await Promise.all([
  dashboardService.getOverview(),
  dashboardService.getBusinessHealthMetrics(),
  dashboardService.getTopProducts()
])

// ❌ 不好的做法：順序查詢（慢 3 倍）
const overview = await dashboardService.getOverview()
const healthMetrics = await dashboardService.getBusinessHealthMetrics()
const topProducts = await dashboardService.getTopProducts()
```

**Vue Query 快取策略**:
```typescript
// ✅ 設定合理的 staleTime，避免頻繁重新查詢
useQuery({
  queryKey: ['dashboard', 'overview'],
  queryFn: () => dashboardService.getOverview(),
  staleTime: 2 * 60 * 1000, // 2 分鐘內使用快取
  refetchInterval: 5 * 60 * 1000, // 5 分鐘自動刷新
})

// ❌ 避免過短的 staleTime 導致不必要的查詢
useQuery({
  queryKey: ['dashboard', 'overview'],
  queryFn: () => dashboardService.getOverview(),
  staleTime: 0, // 每次都重新查詢，效能差
})
```

---

### 錯誤處理

**完整的錯誤處理範例**:
```typescript
// ✅ 好的做法：檢查 success 並處理錯誤
const result = await dashboardService.getOverview()
if (result.success && result.data) {
  console.log('總營收:', result.data.totalRevenue)
} else {
  console.error('載入失敗:', result.error)
  // 顯示使用者友好的錯誤訊息
  showToast('無法載入儀表板數據，請稍後再試', 'error')
}

// ❌ 不好的做法：未檢查 success 直接使用 data
const result = await dashboardService.getOverview()
console.log(result.data.totalRevenue) // 可能 null，會報錯
```

**Try-Catch 搭配 ApiResponse**:
```typescript
// ✅ 處理非預期錯誤
try {
  const result = await dashboardService.getOverview()
  if (result.success) {
    return result.data
  } else {
    throw new Error(result.error || 'Unknown error')
  }
} catch (error) {
  console.error('Dashboard API error:', error)
  return null
}
```

---

### 資料一致性

**刷新策略**:
```typescript
// ✅ 刷新所有相關數據確保一致性
async function refreshDashboard() {
  const queryClient = useQueryClient()

  // 清除所有 dashboard 相關快取
  queryClient.removeQueries({ queryKey: ['dashboard'] })

  // 重新查詢所有數據
  await Promise.all([
    queryClient.refetchQueries({ queryKey: ['dashboard', 'overview'] }),
    queryClient.refetchQueries({ queryKey: ['dashboard', 'business-health'] }),
    queryClient.refetchQueries({ queryKey: ['dashboard', 'top-products'] }),
  ])
}
```

**避免部分數據陳舊**:
```typescript
// ❌ 不好的做法：只刷新部分數據
await dashboardService.getOverview() // 新數據
// healthMetrics 仍使用舊快取，導致不一致

// ✅ 好的做法：統一刷新策略
const refreshAll = async () => {
  await Promise.all([
    refetchOverview(),
    refetchHealthMetrics(),
    refetchTopProducts(),
  ])
}
```

---

### 日期範圍處理

**動態範圍 vs 固定範圍**:
```typescript
// ✅ 讓 API 使用動態範圍（最佳化不同 period）
const dailyTrend = await dashboardService.getRevenueTrend('daily')
// 自動使用最近 30 天

const weeklyTrend = await dashboardService.getRevenueTrend('weekly')
// 自動使用最近 12 週

// ⚠️ 固定範圍會覆蓋動態邏輯
const customTrend = await dashboardService.getRevenueTrend(
  'daily',
  '2025-01-01',
  '2025-12-31'
)
// 使用指定範圍，不使用動態範圍
```

**時區處理**:
```typescript
// ✅ 確保日期格式統一為 YYYY-MM-DD
const startDate = new Date().toISOString().split('T')[0]
const endDate = new Date().toISOString().split('T')[0]

// ❌ 避免使用當地時間格式
const badDate = new Date().toLocaleDateString() // "10/7/2025" (格式不一致)
```

---

### 資料視覺化建議

**數字格式化**:
```typescript
// ✅ 使用一致的數字格式化
const formattedRevenue = overview.totalRevenue.toLocaleString('zh-TW', {
  style: 'currency',
  currency: 'TWD',
  minimumFractionDigits: 0,
})
// 顯示：NT$1,234,567

// ✅ 百分比格式化
const formattedRate = (overview.conversionRate / 100).toLocaleString('zh-TW', {
  style: 'percent',
  minimumFractionDigits: 1,
})
// 顯示：85.3%
```

**成長率顏色標示**:
```typescript
// ✅ 根據成長率正負顯示不同顏色
const growthClass = overview.revenueGrowth.startsWith('+')
  ? 'text-success'  // 綠色
  : overview.revenueGrowth.startsWith('-')
  ? 'text-destructive'  // 紅色
  : 'text-muted-foreground'  // 灰色
```

---

### 權限控制

**RLS 考量**:
- DashboardApiService 使用多個 RPC 函數繞過 RLS（Row Level Security）
- 確保使用者已通過 Supabase 身份驗證
- 敏感數據（如客戶詳細資訊）應在前端進一步過濾

**權限檢查範例**:
```typescript
import { usePermissionStore } from '@/stores/permission'

const permissionStore = usePermissionStore()

if (permissionStore.can('dashboard:view')) {
  const overview = await dashboardService.getOverview()
} else {
  console.error('權限不足：無法查看儀表板')
}
```

---

## 相關資源

### 相關 API 服務
- [CustomerApiService](./customer-api.md) - 客戶數據來源（RFM 分析、LTV 計算）
- [OrderApiService](./order-api.md) - 訂單數據來源（履約漏斗、營收計算）
- [ProductApiService](./product-api.md) - 產品數據來源（庫存警報、熱銷產品）
- **BusinessHealthAnalyticsService** - 業務健康度計算（Edge Function 呼叫）

### 相關組件
- `DashboardOverview.vue` - 主儀表板頁面
- `BusinessHealthDashboard.vue` - 業務健康度雷達圖組件
- `MultiDimensionRevenueTrendChart.vue` - 營收趨勢圖表
- `CustomerValueScatterChart.vue` - 客戶價值散點圖
- `OverviewCard.vue` - KPI 卡片組件

### 相關 Composables
- `useDashboardQueries.ts` - Vue Query 封裝（推薦使用）
- `useDashboardRefresh.ts` - 儀表板刷新邏輯
- `useDashboardState.ts` - 儀表板狀態管理
- `useRealtimeAlerts.ts` - Realtime 連線警報管理

### 相關文檔
- [資料庫 Schema](../database/schema.sql) - RPC 函數定義和視圖結構
- [Edge Function 文檔](../edge-functions/business-health-analytics.md) - 業務健康度計算邏輯
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md) - 統一錯誤處理規範

---

## 🧪 測試

### 單元測試範例

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks'
import { DashboardApiService } from './DashboardApiService'

describe('DashboardApiService', () => {
  let service: DashboardApiService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    service = new DashboardApiService(mockSupabase)
  })

  describe('getOverview()', () => {
    it('should fetch dashboard overview data', async () => {
      const mockOrderSummary = {
        total_orders: 100,
        total_revenue: 50000,
        completion_rate: 85,
      }
      const mockCustomerOverview = {
        total_customers: 200,
        retention_rate: 75,
      }

      mockSupabase.rpc.mockImplementation((funcName) => {
        if (funcName === 'get_order_basic_summary') {
          return Promise.resolve({ data: mockOrderSummary, error: null })
        }
        if (funcName === 'get_customer_overview') {
          return Promise.resolve({ data: mockCustomerOverview, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      })

      const result = await service.getOverview()

      expect(result.success).toBe(true)
      expect(result.data?.totalRevenue).toBe(50000)
      expect(result.data?.totalOrders).toBe(100)
      expect(result.data?.activeCustomers).toBe(200)
    })

    it('should handle RPC function errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await service.getOverview()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Database error')
    })
  })

  describe('getBusinessHealthMetrics()', () => {
    it('should fetch business health metrics from Edge Function', async () => {
      const mockHealthMetrics = {
        revenue: 8.5,
        satisfaction: 7.2,
        fulfillment: 9.0,
        support: 6.8,
        products: 8.0,
        marketing: 7.5,
        system: 9.5,
      }

      vi.spyOn(service as any, 'getBusinessHealthMetrics').mockResolvedValue({
        success: true,
        data: mockHealthMetrics,
      })

      const result = await service.getBusinessHealthMetrics()

      expect(result.success).toBe(true)
      expect(result.data?.revenue).toBeGreaterThan(0)
      expect(result.data?.system).toBeGreaterThan(0)
    })
  })

  describe('getTopProducts()', () => {
    it('should fetch top products with limit', async () => {
      const mockTopProducts = [
        { id: '1', name: 'Product A', sales: 10000, growth: '+15%', rank: 1 },
        { id: '2', name: 'Product B', sales: 8000, growth: '+12%', rank: 2 },
        { id: '3', name: 'Product C', sales: 6000, growth: '+8%', rank: 3 },
      ]

      mockSupabase.rpc.mockResolvedValue({
        data: mockTopProducts,
        error: null,
      })

      const result = await service.getTopProducts(3)

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(3)
      expect(result.data?.[0].rank).toBe(1)
    })
  })

  describe('getSystemAlerts()', () => {
    it('should integrate alerts from multiple sources', async () => {
      const mockInventoryAlerts = [
        { id: 'inv-1', type: 'error', message: '5 項商品缺貨', priority: 'high', timestamp: new Date().toISOString() },
      ]
      const mockSupportAlerts = [
        { id: 'sup-1', type: 'warning', message: '平均回應時間 135 分鐘', priority: 'medium', timestamp: new Date().toISOString() },
      ]

      vi.spyOn(service as any, 'getInventoryAlerts').mockResolvedValue(mockInventoryAlerts)
      vi.spyOn(service as any, 'getSupportAlerts').mockResolvedValue(mockSupportAlerts)
      vi.spyOn(service as any, 'getOrderAlerts').mockResolvedValue([])

      const result = await service.getSystemAlerts()

      expect(result.success).toBe(true)
      expect(result.data?.length).toBeGreaterThan(0)
      expect(result.data?.[0].type).toBe('error') // 最高優先級排在前面
    })
  })
})
```

### 整合測試建議

**測試 Vue Query 整合**:
```typescript
import { describe, it, expect } from 'vitest'
import { useCompleteDashboardData } from '@/composables/queries/useDashboardQueries'
import { flushPromises } from '@vue/test-utils'

describe('useDashboardQueries Integration', () => {
  it('should fetch complete dashboard data', async () => {
    const filters = ref({ startDate: '2025-09-01', endDate: '2025-09-30' })
    const { data, isLoading } = useCompleteDashboardData(filters)

    await flushPromises()

    expect(isLoading.value).toBe(false)
    expect(data.value.overview).toBeDefined()
    expect(data.value.businessHealth).toBeDefined()
    expect(data.value.topProducts).toBeInstanceOf(Array)
  })
})
```

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|----------|------|
| 2025-10-07 | 1.0.0 | 初始版本：完整記錄 DashboardApiService 的 15+ API 方法 | 開發團隊 |
| 2025-10-07 | 1.0.0 | 新增業務健康度 7 維度評分邏輯說明 | 開發團隊 |
| 2025-10-07 | 1.0.0 | 新增系統警報整合機制（跨 4 大模組） | 開發團隊 |

---

**維護提醒**: 當 Dashboard API 方法、業務健康度計算邏輯或警報機制有變更時，請同步更新此文檔並記錄在變更歷史中。
