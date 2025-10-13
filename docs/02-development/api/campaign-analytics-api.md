# CampaignAnalyticsApiService API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐ (分析系統)

---
## 概覽

### 業務用途
CampaignAnalyticsApiService 是活動分析系統的核心 API 服務，提供完整的活動效果分析、歸因分析、協作分析、重疊分析和趨勢分析功能。它基於 4 層歸因架構（site-wide, target-oriented, category-specific, general）計算活動對營收的實際貢獻度，是行銷效果評估的關鍵系統。

### 核心功能
- **活動總覽分析** - 整合 KPI (總營收、訂單數、歸因準確度、協作指數等)
- **歸因分析** - 基於 4 層歸因架構計算活動實際貢獻度
- **協作分析** - 分析多活動同時進行時的協作效果
- **重疊日曆** - 視覺化活動期間重疊情況和競爭強度
- **效果趨勢** - 活動績效評分、ROI 計算、時間序列分析
- **層級效果分析** - 按歸因層級統計營收和權重分佈
- **規則管理** - 歸因規則總結與分佈統計

### 技術架構
- **繼承**: `BaseApiService<any, any>` (特殊設計，不綁定單一表格)
- **資料來源**:
  - **Database Views** (主要分析來源):
    - `revenue_attribution_analysis` - 營收歸因分析視圖
    - `campaign_collaboration_analysis` - 活動協作分析視圖
    - `campaign_overlap_calendar` - 活動重疊日曆視圖
    - `campaign_performance_enhanced` - 活動績效增強視圖
  - **Database RPC Functions**:
    - `calculate_campaign_attributions()` - 歸因計算函數
  - **Related Tables**:
    - `campaigns` - 活動基本資訊和層級權重
- **依賴服務**: 無（獨立服務）
- **設計原則**:
  - ✅ 零資料表擴展 (Phase 1) - 完全基於現有分析視圖
  - ✅ 利用現有分層歸因系統
  - ✅ 遵循 SupportAnalyticsApiService 架構模式
- **前端使用**:
  - `CampaignAnalyticsView.vue` - 活動分析總覽頁面
  - 6 個分析標籤（總覽、歸因、協作、重疊、趨勢、規則）

### 資料庫層 API 參考
> **Supabase 資料來源參考**
>
> CampaignAnalyticsApiService 整合多個分析視圖和 RPC 函數，如需查詢基礎 Schema：
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 查看以下分析視圖：
>    - **Views**: `revenue_attribution_analysis`, `campaign_collaboration_analysis`, `campaign_overlap_calendar`, `campaign_performance_enhanced`
>    - **Tables**: `campaigns`
> 3. 查看 Database Functions (RPC)：
>    - `calculate_campaign_attributions(target_date)`
>
> **何時使用 Supabase 文件**：
> - ✅ 查詢分析視圖的欄位結構和計算邏輯
> - ✅ 了解 RPC 函數的輸入輸出格式
> - ✅ 檢視活動資料表的歸因欄位定義
>
> **何時使用本文件**：
> - ✅ 使用 `CampaignAnalyticsApiService` 的 6 大分析模組
> - ✅ 了解 4 層歸因架構的權重計算邏輯
> - ✅ 學習活動協作分析和重疊分析方法
> - ✅ 查看績效評分算法和 ROI 計算公式

---

## API 方法詳細說明

### 1. 活動總覽分析

#### `getCampaignAnalyticsOverview()` - 活動分析總覽數據

**用途**: 取得活動系統整體 KPI 數據，包含總活動數、總歸因營收、平均訂單價值、歸因準確度、協作指數等關鍵指標

**方法簽名**:
```typescript
async getCampaignAnalyticsOverview(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<CampaignAnalyticsOverview>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `dateRange` | `{ start: string; end: string }` | ❌ | 日期範圍 (YYYY-MM-DD)，⚠️ Phase 1 暫不支援（視圖無日期欄位） |

**回傳值**:
```typescript
interface CampaignAnalyticsOverview {
  totalCampaigns: number                  // 總活動數量
  totalAttributedRevenue: number          // 總歸因營收
  totalInfluencedOrders: number           // 總影響訂單數
  averageOrderValue: number               // 平均訂單價值
  attributionAccuracy: number             // 歸因準確度 (%)
  collaborationIndex: number              // 協作指數 (%)
  averageAttributionWeight: number        // 平均歸因權重
  averageConcurrentCampaigns: number      // 平均同時進行活動數
  exclusiveOrdersRate: number             // 獨佔訂單率 (%)
  trendsInfo: {
    period: number                        // 分析期間 (天)
    lastUpdated: string                   // 最後更新時間
  }
}
```

**資料來源**: `revenue_attribution_analysis` 視圖

**關鍵指標說明**:
- **歸因準確度**: `(dominant_attributions / totalAttributions) * 100`
  - 衡量活動歸因的精確程度
  - 高準確度表示大部分訂單能明確歸因到單一活動
- **協作指數**: `(collaborativeOrders / totalOrders) * 100`
  - 衡量多活動協作的普遍程度
  - 高協作指數表示多活動同時進行的效果顯著
- **獨佔訂單率**: `(exclusiveOrders / totalOrders) * 100`
  - 衡量單一活動獨立帶來訂單的比例
  - 高獨佔率表示活動能獨立創造成效

**使用範例**:
```typescript
const analyticsService = defaultServiceFactory.getCampaignAnalyticsService()

// 取得總覽數據（所有歷史資料）
const { data: overview } = await analyticsService.getCampaignAnalyticsOverview()

console.log(`總活動數: ${overview.totalCampaigns}`)
console.log(`總歸因營收: ${overview.totalAttributedRevenue}`)
console.log(`協作指數: ${overview.collaborationIndex}%`)
```

**Phase 1 限制**:
⚠️ `dateRange` 參數目前被忽略，因為 `revenue_attribution_analysis` 視圖沒有日期欄位，分析涵蓋所有歷史資料

---

### 2. 歸因分析

#### `getAttributionAnalysis()` - 活動歸因分析數據

**用途**: 取得各活動的詳細歸因分析數據，包含影響訂單數、歸因營收、歸因權重、協作情況等

**方法簽名**:
```typescript
async getAttributionAnalysis(filters?: {
  startDate?: string
  endDate?: string
  layers?: string[]           // 按層級篩選
  campaignTypes?: string[]    // 按活動類型篩選
}): Promise<ApiResponse<AttributionAnalysis[]>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `filters.startDate` | `string` | ❌ | 開始日期 (YYYY-MM-DD)，⚠️ Phase 1 暫不支援 |
| `filters.endDate` | `string` | ❌ | 結束日期 (YYYY-MM-DD)，⚠️ Phase 1 暫不支援 |
| `filters.layers` | `string[]` | ❌ | 歸因層級篩選 (`site-wide`, `target-oriented`, `category-specific`, `general`) |
| `filters.campaignTypes` | `string[]` | ❌ | 活動類型篩選 (如 `flash_sale`, `seasonal_promotion`) |

**回傳值**:
```typescript
interface AttributionAnalysis {
  campaignId: string                    // 活動 ID
  campaignName: string                  // 活動名稱
  campaignType: string                  // 活動類型
  attributionLayer: string              // 歸因層級
  influencedOrders: number              // 影響訂單數
  totalAttributedRevenue: number        // 總歸因營收
  avgAttributedRevenue: number          // 平均每訂單歸因營收
  avgAttributionWeight: number          // 平均歸因權重
  avgConcurrentCampaigns: number        // 平均同時進行活動數
  exclusiveOrders: number               // 獨佔訂單數
  collaborativeOrders: number           // 協作訂單數
  dominantAttributions: number          // 主導歸因數量
  significantAttributions: number       // 顯著歸因數量
  moderateAttributions: number          // 中等歸因數量
  minorAttributions: number             // 次要歸因數量
}
```

**資料來源**: `revenue_attribution_analysis` 視圖

**歸因強度分級**:
- **Dominant (主導)**: 單一活動貢獻 > 60% 的訂單營收
- **Significant (顯著)**: 活動貢獻 40-60% 的訂單營收
- **Moderate (中等)**: 活動貢獻 20-40% 的訂單營收
- **Minor (次要)**: 活動貢獻 < 20% 的訂單營收

**使用範例**:
```typescript
// 篩選特定層級的活動
const { data: attributions } = await analyticsService.getAttributionAnalysis({
  layers: ['site-wide', 'target-oriented'],
  campaignTypes: ['flash_sale', 'vip_exclusive']
})

// 按歸因營收排序（API 已自動排序）
console.table(attributions.map(a => ({
  name: a.campaignName,
  revenue: a.totalAttributedRevenue,
  orders: a.influencedOrders,
  dominant: a.dominantAttributions
})))
```

---

### 3. 協作分析

#### `getCollaborationAnalysis()` - 活動協作效果分析

**用途**: 分析多個活動同時進行時的協作效果，識別哪些活動組合能產生最佳營收

**方法簽名**:
```typescript
async getCollaborationAnalysis(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<CollaborationAnalysis[]>>
```

**回傳值**:
```typescript
interface CollaborationAnalysis {
  concurrentCampaigns: number          // 同時進行活動數量
  campaignCombination: string          // 活動組合名稱
  involvedLayers: string[]             // 涉及的歸因層級
  occurrenceCount: number              // 組合出現次數
  combinationRevenue: number           // 組合總營收
  avgOrderValue: number                // 平均訂單價值
  avgDistributedRevenue: number        // 平均分配營收
  revenueSharePct: number              // 營收佔比 (%)
  collaborationType: string            // 協作類型 (vertical/horizontal)
}
```

**資料來源**: `campaign_collaboration_analysis` 視圖

**協作類型說明**:
- **Vertical (垂直協作)**: 不同層級活動協作 (如 site-wide + category-specific)
- **Horizontal (水平協作)**: 同層級活動協作 (如 兩個 target-oriented 活動)

**使用範例**:
```typescript
const { data: collaborations } = await analyticsService.getCollaborationAnalysis()

// 找出最佳協作組合
const topCollabs = collaborations
  .sort((a, b) => b.combinationRevenue - a.combinationRevenue)
  .slice(0, 5)

console.log('Top 5 最佳協作組合:')
topCollabs.forEach(c => {
  console.log(`${c.campaignCombination}: ${c.combinationRevenue} (${c.concurrentCampaigns} 活動)`)
})
```

**Phase 1 限制**:
⚠️ `dateRange` 參數目前被忽略，視圖沒有日期欄位

---

### 4. 重疊日曆

#### `getOverlapCalendar()` - 活動重疊日曆數據

**用途**: 視覺化活動期間重疊情況，識別高競爭強度的日期和節假日影響

**方法簽名**:
```typescript
async getOverlapCalendar(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<OverlapCalendar[]>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `dateRange` | `{ start: string; end: string }` | ❌ | 日期範圍，預設最近 90 天 |

**回傳值**:
```typescript
interface OverlapCalendar {
  date: string                         // 日期 (YYYY-MM-DD)
  concurrentCampaigns: number          // 當日同時進行活動數
  campaignsList: string                // 活動名稱列表 (逗號分隔)
  activeLayers: string[]               // 活躍的歸因層級
  campaignTypes: string[]              // 活動類型列表
  avgAttributionWeight: number         // 平均歸因權重
  isHoliday: boolean                   // 是否為節假日
  isWeekend: boolean                   // 是否為週末
  holidayName?: string                 // 節假日名稱
  complexityLevel: string              // 複雜度等級 (low/medium/high/extreme)
  specialFlags?: string[]              // 特殊標記
}
```

**資料來源**: `campaign_overlap_calendar` 視圖

**複雜度等級**:
- **Low**: 1-2 個活動同時進行
- **Medium**: 3-4 個活動同時進行
- **High**: 5-6 個活動同時進行
- **Extreme**: 7+ 個活動同時進行

**使用範例**:
```typescript
// 查詢近 30 天的重疊情況
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const { data: calendar } = await analyticsService.getOverlapCalendar({
  start: thirtyDaysAgo.toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

// 找出競爭最激烈的日期
const highCompetitionDays = calendar.filter(day => day.concurrentCampaigns >= 5)
console.log(`高競爭日期數: ${highCompetitionDays.length}`)
```

---

### 5. 活動效果趨勢

#### `getCampaignPerformanceTrends()` - 活動績效趨勢數據

**用途**: 取得活動的時間序列績效數據，包含營收、訂單數、轉換率、ROI 和綜合評分

**方法簽名**:
```typescript
async getCampaignPerformanceTrends(
  campaignId?: string,
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<CampaignPerformanceTrend[]>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `campaignId` | `string` | ❌ | 特定活動 ID，不提供則查詢所有活動 |
| `dateRange` | `{ start: string; end: string }` | ❌ | 活動開始/結束日期範圍 |

**回傳值**:
```typescript
interface CampaignPerformanceTrend {
  campaign_id: string
  campaign_name: string
  campaign_type: string
  attribution_layer: string
  start_date: string
  end_date: string
  total_revenue: number                // 總營收
  total_orders: number                 // 總訂單數
  avg_order_value: number              // 平均訂單價值
  conversion_rate: number              // 轉換率 (%)
  attribution_weight: number           // 歸因權重
  return_on_investment: number         // ROI (%)
  performance_score: number            // 綜合績效評分 (0-100)
}
```

**資料來源**: `campaign_performance_enhanced` 視圖 + `campaigns` 表

**績效評分算法** (0-100 分):
```typescript
// 營收權重 (40%)
if (total_revenue > 50000) score += 40
else if (total_revenue > 20000) score += 30
else if (total_revenue > 10000) score += 20
else if (total_revenue > 0) score += 10

// 訂單數權重 (30%)
if (total_orders > 20) score += 30
else if (total_orders > 10) score += 20
else if (total_orders > 5) score += 15
else if (total_orders > 0) score += 5

// 平均訂單價值權重 (20%)
if (avg_order_value > 3000) score += 20
else if (avg_order_value > 2000) score += 15
else if (avg_order_value > 1000) score += 10
else if (avg_order_value > 0) score += 5

// 效率指標權重 (10%) - 每日營收
const dailyRevenue = total_revenue / campaign_days
if (dailyRevenue > 5000) score += 10
else if (dailyRevenue > 2000) score += 8
else if (dailyRevenue > 1000) score += 5
else if (dailyRevenue > 0) score += 2
```

**使用範例**:
```typescript
// 查詢特定活動的趨勢
const { data: trends } = await analyticsService.getCampaignPerformanceTrends(
  'campaign-id-123'
)

// 分析績效評分
const avgScore = trends.reduce((sum, t) => sum + t.performance_score, 0) / trends.length
console.log(`平均績效評分: ${avgScore.toFixed(1)}`)

// 識別高績效活動
const topPerformers = trends.filter(t => t.performance_score >= 70)
```

---

### 6. ROI 計算

#### `calculateCampaignROI()` - 計算活動 ROI

**用途**: 使用分層歸因系統計算特定活動在指定日期的 ROI 和歸因詳情

**方法簽名**:
```typescript
async calculateCampaignROI(
  campaignId: string,
  targetDate?: string
): Promise<ApiResponse<CampaignROICalculation>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `campaignId` | `string` | ✅ | 活動 ID |
| `targetDate` | `string` | ❌ | 目標日期 (YYYY-MM-DD)，預設今日 |

**回傳值**:
```typescript
interface CampaignROICalculation {
  campaignId: string
  targetDate: string
  attributions: any[]                  // 歸因詳情陣列
  totalAttributedRevenue: number       // 總歸因營收
  attributionStrength: string          // 歸因強度 (dominant/significant/moderate/minor)
  normalizedWeight: number             // 正規化權重
  competingCampaigns: number           // 競爭活動數量
  activeLayers: string[]               // 活躍層級
}
```

**資料來源**: `calculate_campaign_attributions` RPC 函數

**使用範例**:
```typescript
const { data: roi } = await analyticsService.calculateCampaignROI(
  'campaign-id-123',
  '2025-10-07'
)

console.log(`歸因營收: ${roi.totalAttributedRevenue}`)
console.log(`歸因強度: ${roi.attributionStrength}`)
console.log(`競爭活動數: ${roi.competingCampaigns}`)
```

---

### 7. 層級效果分析

#### `getLayerPerformanceAnalysis()` - 層級績效分析

**用途**: 按歸因層級統計活動數、訂單數、營收和權重分佈

**方法簽名**:
```typescript
async getLayerPerformanceAnalysis(filters?: {
  startDate?: string
  endDate?: string
}): Promise<ApiResponse<LayerPerformance[]>>
```

**回傳值**:
```typescript
interface LayerPerformance {
  layer: string                        // 歸因層級
  campaigns: number                    // 該層級活動數
  orders: number                       // 影響訂單數
  revenue: number                      // 總營收
  avgWeight: number                    // 平均最終權重
  avgOrderValue: number                // 平均訂單價值
  collaborationRate: number            // 協作率 (%)
}
```

**歸因層級** (由高到低):
1. **site-wide**: 全站級活動 (如 雙十一、黑五)
2. **target-oriented**: 目標導向活動 (如 VIP 專屬、新客優惠)
3. **category-specific**: 類別專屬活動 (如 3C 折扣、服飾特賣)
4. **general**: 一般活動 (如 常態促銷)

**最終權重計算**:
```typescript
finalWeight = layerBaseWeight * campaignWeight

// 層級基礎權重
site-wide: 2.5
target-oriented: 2.0
category-specific: 1.5
general: 1.0
```

**使用範例**:
```typescript
const { data: layers } = await analyticsService.getLayerPerformanceAnalysis()

// 按營收排序（API 已自動排序）
console.table(layers.map(l => ({
  layer: l.layer,
  campaigns: l.campaigns,
  revenue: l.revenue,
  avgWeight: l.avgWeight
})))
```

**Phase 1 限制**:
⚠️ `dateRange` 參數目前被忽略，分析涵蓋所有歷史資料

---

### 8. 歸因規則管理

#### `getAttributionRulesSummary()` - 歸因規則總結

**用途**: 分析現有活動的歸因規則分佈和類型對應關係

**方法簽名**:
```typescript
async getAttributionRulesSummary(): Promise<ApiResponse<AttributionRulesSummary>>
```

**回傳值**:
```typescript
interface AttributionRulesSummary {
  totalCampaigns: number                           // 總活動數
  layerDistribution: Record<string, number>        // 層級分佈統計
  typeDistribution: Record<string, number>         // 類型分佈統計
  weightDistribution: Record<number, number>       // 權重分佈統計
  rulesMappings: Array<{                          // 規則對應關係
    campaign_type: string
    attribution_layer: string
    attribution_weight: number
    priority_score: number
    count: number                                  // 使用此規則的活動數
  }>
  lastAnalyzed: string                            // 最後分析時間
  systemStatus: string                            // 系統狀態 (active/maintenance)
}
```

**資料來源**: `campaigns` 表

**使用範例**:
```typescript
const { data: rules } = await analyticsService.getAttributionRulesSummary()

console.log(`總活動數: ${rules.totalCampaigns}`)
console.log('層級分佈:', rules.layerDistribution)
console.log('類型分佈:', rules.typeDistribution)

// 找出最常用的規則
const topRule = rules.rulesMappings
  .sort((a, b) => b.count - a.count)[0]
console.log(`最常用規則: ${topRule.campaign_type} → ${topRule.attribution_layer}`)
```

---

### 9. 可用層級查詢

#### `getAvailableLayers()` - 取得可用歸因層級

**用途**: 從 campaigns 表查詢系統中實際使用的歸因層級列表

**方法簽名**:
```typescript
async getAvailableLayers(): Promise<ApiResponse<string[]>>
```

**回傳值**:
```typescript
string[]  // 歸因層級陣列，如 ['site-wide', 'target-oriented', 'category-specific', 'general']
```

**使用範例**:
```typescript
const { data: layers } = await analyticsService.getAvailableLayers()
console.log('可用層級:', layers)  // ['site-wide', 'target-oriented', ...]
```

---

## 資料映射與轉換

### 精度控制
本服務使用統一的數字精度控制工具：

```typescript
import {
  formatCurrencyPrecision,    // 貨幣精度 (2 位小數)
  formatPercentagePrecision,  // 百分比精度 (2 位小數)
  formatNumberPrecision       // 一般數字精度 (4 位小數)
} from '@/utils/numberPrecision'
```

**應用場景**:
- **營收數據**: `formatCurrencyPrecision()` - 確保金額顯示一致性
- **百分比**: `formatPercentagePrecision()` - 轉換率、協作率、ROI
- **權重/評分**: `formatNumberPrecision()` - 歸因權重、績效評分

---

## 錯誤處理

### 統一錯誤處理
所有方法使用 `handleError()` 統一處理錯誤：

```typescript
return {
  success: false,
  error: '錯誤訊息',
  code: '錯誤代碼'
}
```

### 常見錯誤場景
1. **視圖查詢失敗**: 檢查資料庫視圖是否存在
2. **RPC 函數錯誤**: 檢查 `calculate_campaign_attributions` 函數
3. **資料為空**: 可能尚無活動或訂單資料
4. **日期範圍無效**: Phase 1 暫不支援日期篩選

---

## ⚡ 效能考量

### 查詢優化
1. **分析視圖**: 已預先聚合計算，查詢效能高
2. **資料排序**: API 層已自動排序（按營收/時間）
3. **分頁支援**: 目前尚未實現，建議 Phase 2 加入

### 最佳實踐
```typescript
// ✅ 推薦: 使用層級篩選減少資料量
const { data } = await analyticsService.getAttributionAnalysis({
  layers: ['site-wide', 'target-oriented']
})

// ⚠️ 注意: 取得全部資料可能較慢
const { data } = await analyticsService.getAttributionAnalysis()
```

---

## Phase 2 規劃

### 待實現功能
1. **日期範圍支援**: 為分析視圖增加日期欄位
2. **分頁查詢**: 大數據集的分頁支援
3. **規則管理 CRUD**: 歸因規則的新增、修改、刪除
4. **即時 ROI 計算**: WebSocket 推送即時 ROI 變化
5. **匯出功能**: Excel/CSV 匯出分析報表

---

## 相關文檔

- [CampaignApiService API 文檔](./campaign-api.md) - 活動 CRUD 管理
- [活動系統架構設計](../architecture/campaign-system.md) - 完整系統設計
- [4 層歸因架構說明](../architecture/campaign-system.md#歸因系統架構) - 歸因邏輯詳解
- [分析視圖 Schema](../database/views.md) - 資料庫視圖定義

---

**📌 重要提醒**:
- Phase 1 版本基於零資料表擴展原則，部分進階功能（如日期篩選）將在 Phase 2 實現
- 所有分析數據來自預先計算的視圖，確保查詢效能
- 績效評分算法可根據業務需求調整權重配置
