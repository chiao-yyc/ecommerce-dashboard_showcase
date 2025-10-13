# Campaign 行銷活動管理系統

## 系統概述

Campaign 管理系統是專為電商平台設計的完整行銷活動管理解決方案，支援活動創建、管理、效果追蹤與歸因分析。

## 架構設計

### 核心組件結構
```
src/components/campaign/
├── CampaignList.vue                    # 活動列表主組件
└── campaign-list/                      # 活動列表專用組件
    ├── DataTableHeaderActions.vue     # 表格頂部操作
    ├── DataTableRowActions.vue        # 行操作選單
    ├── columns.ts                      # 表格欄位定義
    ├── data.ts                        # 資料處理邏輯
    └── field-config.ts                # 表單欄位配置
```

### API 服務層
```
src/api/services/
├── CampaignApiService.ts              # Campaign API 服務
└── base/BaseApiService.ts             # 基礎 API 服務類
```

### 狀態管理
```
src/composables/
├── useCampaign.ts                     # Campaign 狀態管理
└── data-table-actions/
    └── useCampaignActions.ts          # Campaign 表格操作
```

### 頁面組件
```
src/views/
└── CampaignView.vue                   # Campaign 管理主頁面
```

## 功能特性

### 核心功能
- **活動管理**: 創建、編輯、啟用/停用行銷活動
- **活動列表**: 支援篩選、排序、搜尋的活動管理介面
- **批量操作**: 支援批量啟用、停用、刪除操作
- **狀態管理**: 活動狀態的完整生命週期管理

### 資料表格功能
- **動態篩選**: 按狀態、日期、類型等條件篩選
- **排序功能**: 支援多欄位排序
- **分頁處理**: 大數據量的高效分頁顯示
- **行級操作**: 編輯、查看、刪除等單行操作

## 資料結構

### Campaign 實體
```typescript
interface Campaign {
  id: string
  name: string                    # 活動名稱
  description?: string            # 活動描述
  status: CampaignStatus         # 活動狀態
  start_date: Date               # 開始日期
  end_date: Date                 # 結束日期
  budget?: number                # 預算金額
  target_audience?: string       # 目標受眾
  created_at: Date               # 創建時間
  updated_at: Date               # 更新時間
}

enum CampaignStatus {
  DRAFT = 'draft',               # 草稿
  ACTIVE = 'active',             # 進行中
  PAUSED = 'paused',             # 暫停
  COMPLETED = 'completed',       # 已完成
  CANCELLED = 'cancelled'        # 已取消
}
```

## API 端點

### RESTful API
```typescript
// 基礎 CRUD 操作
GET    /api/campaigns              # 獲取活動列表
POST   /api/campaigns              # 創建新活動
GET    /api/campaigns/:id          # 獲取單個活動
PUT    /api/campaigns/:id          # 更新活動
DELETE /api/campaigns/:id          # 刪除活動

// 批量操作
POST   /api/campaigns/batch        # 批量操作
PUT    /api/campaigns/bulk-status  # 批量狀態更新

// 統計與分析
GET    /api/campaigns/stats        # 活動統計
GET    /api/campaigns/:id/metrics  # 活動效果指標
```

## 活動分析系統 (Campaign Analytics)

### 分析功能架構

Campaign Analytics 系統基於 Phase 1 零資料表擴展原則，充分利用現有資料結構提供完整的行銷活動效果分析。

#### 核心特色
- **零資料表擴展**: 完全基於現有分析視圖，無需新增資料表
- **多層級歸因**: 支援 site-wide、target-oriented、category-specific、general 四個層級
- **權重計算**: 結合層級權重與活動權重的雙重權重系統
- **Vue Query 整合**: 完整的響應式資料管理和快取策略

### 分析 API 服務

#### CampaignAnalyticsApiService 主要方法

##### 1. 活動分析總覽
```typescript
async getCampaignAnalyticsOverview(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<CampaignAnalyticsOverview>>
```
**返回數據**:
- 總活動數、總歸因營收、總影響訂單數
- 平均訂單價值、歸因準確度、協作指數
- 平均歸因權重、平均併發活動數、專屬訂單比例

##### 2. 歸因分析
```typescript
async getAttributionAnalysis(
  filters?: {
    startDate?: string
    endDate?: string
    layers?: string[]
    campaignTypes?: string[]
  }
): Promise<ApiResponse<AttributionAnalysis[]>>
```
**返回數據**: 每個活動的詳細歸因權重和影響力分析

##### 3. 層級效果分析
```typescript
async getLayerPerformanceAnalysis(
  filters?: {
    startDate?: string
    endDate?: string
  }
): Promise<ApiResponse<LayerPerformance[]>>
```
**返回數據**: 按歸因層級統計的活動表現數據

##### 4. 協作分析
```typescript
async getCollaborationAnalysis(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<CollaborationAnalysis[]>>
```
**返回數據**: 活動協作效果分析，包含不同活動組合的營收表現

##### 5. 重疊日曆分析 ✅ 支援日期篩選
```typescript
async getOverlapCalendar(
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<OverlapCalendar[]>>
```
**返回數據**: 活動重疊情況的日曆視圖，包含重疊強度和複雜度分析

##### 6. 效果趨勢分析 ✅ 支援日期篩選
```typescript
async getCampaignPerformanceTrends(
  campaignId?: string,
  dateRange?: { start: string; end: string }
): Promise<ApiResponse<any[]>>
```
**返回數據**: 活動效果隨時間變化的趨勢分析

### Phase 1 限制與支援狀況

#### 日期篩選支援

| 功能 | API 方法 | 日期篩選支援 | UI 實現狀態 |
|------|----------|-------------|------------|
| 活動分析總覽 | `getCampaignAnalyticsOverview` | 🚫 不支援 | ✅ 已實現 |
| 歸因分析 | `getAttributionAnalysis` | 🚫 不支援 | ✅ 已實現 |
| 層級效果分析 | `getLayerPerformanceAnalysis` | 🚫 不支援 | ✅ 已實現 |
| 協作分析 | `getCollaborationAnalysis` | 🚫 不支援 | ✅ 已實現 |
| 重疊日曆分析 | `getOverlapCalendar` | ✅ 支援 | ✅ 已完整實現 |
| 效果趨勢分析 | `getCampaignPerformanceTrends` | ✅ 支援 | ✅ 已完整實現 |

**實現狀態 (2025-07-28)**:
- ✅ **6/6 API 方法已實現** (100%)
- ✅ **2/6 API 支援日期篩選** (33.3%)
- ✅ **6/6 UI 功能已實現** (100%)
- ✅ 重疊日曆和趨勢分析 UI 組件已完整實現

### 分析指標定義

#### 核心業務指標
- **歸因營收 (Total Attributed Revenue)**: 透過歸因算法計算的活動帶來的總營收
- **影響訂單數 (Influenced Orders)**: 受活動影響的訂單總數
- **平均訂單價值 (AOV)**: `總歸因營收 ÷ 影響訂單數`

#### 權重系統指標
```typescript
// 層級權重設定
LAYER_WEIGHTS = {
  'site-wide': 1.0,           // 全站活動 - 最高權重
  'target-oriented': 0.8,     // 目標導向 - 高權重  
  'category-specific': 0.6,   // 品類專屬 - 中權重
  'general': 0.4              // 一般活動 - 基礎權重
}

// 最終權重計算
最終權重 = 層級權重 × 活動權重
```

#### 協作效果指標
- **協作指數**: `(協作訂單數 ÷ 總影響訂單數) × 100`
- **專屬訂單比例**: `(專屬訂單數 ÷ 總影響訂單數) × 100`

### 分析方法論

#### 1. 多觸點歸因模型
- **權重分配**: 基於最終權重進行影響力分配
- **歸因強度分類**:
  - **Dominant (主導)**: 權重 > 0.6
  - **Significant (顯著)**: 權重 0.3 - 0.6
  - **Moderate (中等)**: 權重 0.1 - 0.3  
  - **Minor (輕微)**: 權重 < 0.1

#### 2. 重疊強度分析
```typescript
// 強度評分計算
function calculateIntensityScore(item) {
  let score = item.concurrentCampaigns * 10 // 基礎分數
  score += item.avgAttributionWeight * 5    // 權重加成
  // 複雜度和特殊標記加成...
  return Math.min(score, 100)
}
```

#### 3. 績效評分計算
```typescript
// 綜合績效評分 (營收40% + ROI30% + 轉換率30%)
function calculatePerformanceScore(item) {
  let score = 0
  score += (item.total_revenue / 10000) * 0.4
  score += Math.min(item.return_on_investment / 100, 1) * 0.3
  score += Math.min(item.conversion_rate / 10, 1) * 0.3
  return Math.min(score * 100, 100)
}
```

### Vue Query 整合

#### 可用的 Composable Hooks
```typescript
import {
  useCampaignAnalyticsOverview,
  useCampaignAttributionAnalysis,
  useCampaignCollaborationAnalysis,
  useCampaignOverlapCalendar,      // ✅ 支援日期篩選
  useCampaignPerformanceTrends,    // ✅ 支援日期篩選
  useCampaignLayerPerformance,
  useCampaignAvailableLayers
} from '@/composables/queries/useCampaignAnalyticsQueries'
```

#### 快取策略
| Hook | 快取時間 | 說明 |
|------|----------|------|
| useCampaignAnalyticsOverview | 5分鐘 | 總覽數據 |
| useCampaignOverlapCalendar | 10分鐘 | 日曆數據 |
| useCampaignAvailableLayers | 30分鐘 | 層級列表較穩定 |

### UI 組件實現

#### 重疊日曆分析 (`OverlapCalendarChart.vue`)
- ✅ 響應式日期篩選功能
- ✅ 活動重疊強度視覺化（面積圖 + 線圖）
- ✅ 統計面板顯示關鍵指標
- ✅ 互動 tooltip 和圖例說明

#### 效果趨勢分析 (`PerformanceTrendsChart.vue`)
- ✅ 多指標選擇器（營收、訂單數、AOV、ROI、轉換率、績效評分）
- ✅ 散點圖視覺化顯示活動效果分佈
- ✅ 統計面板顯示綜合數據
- ✅ 響應式日期篩選功能

## 用戶介面

### Campaign 列表頁面
- **表格視圖**: 活動的完整資訊列表
- **篩選側邊欄**: 多維度篩選條件
- **操作工具列**: 新增、匯出、批量操作
- **分頁控制**: 靈活的分頁與頁面大小控制

### 互動功能
- **即時搜尋**: 輸入即時搜尋活動
- **狀態切換**: 快速啟用/停用活動
- **批量選擇**: 多選操作支援
- **排序指示**: 清晰的排序狀態顯示

## 🔄 業務流程

### 活動生命週期
1. **創建階段**: 草稿 → 設定基本資訊
2. **準備階段**: 草稿 → 啟用 → 進行中
3. **執行階段**: 進行中 ↔ 暫停
4. **結束階段**: 進行中 → 已完成/已取消

### 操作權限
- **管理員**: 完整的 CRUD 權限
- **行銷人員**: 創建、編輯自己的活動
- **分析師**: 唯讀權限，可查看報表

## 效能與優化

### 資料載入優化
- **懶載入**: 表格資料按需載入
- **快取策略**: API 響應的智能快取
- **虛擬滾動**: 大列表的效能優化

### 使用者體驗
- **載入狀態**: 完整的載入與錯誤狀態處理
- **即時回饋**: 操作的即時視覺回饋
- **響應式設計**: 支援各種螢幕尺寸

## 🧪 測試策略

### 組件測試
```bash
# 單元測試
npm run test:unit -- src/components/campaign

# 整合測試  
npm run test:integration -- campaign-system
```

### E2E 測試場景
- 活動創建流程
- 批量操作功能
- 篩選與搜尋功能
- 狀態轉換測試

## 🔮 未來規劃

### Phase 2 Analytics 改進計劃
1. **✅ 已完成：UI 組件實現** (2025-07-28)
   - ✅ 重疊日曆分析 UI 組件
   - ✅ 效果趨勢分析 UI 組件
   - ✅ 新增「重疊分析」和「趨勢分析」頁籤

2. **完整日期篩選支援**
   - 擴展 `revenue_attribution_analysis` 視圖結構以包含日期欄位
   - 擴展 `campaign_collaboration_analysis` 視圖結構以包含日期欄位
   - 支援所有 API 方法的日期範圍篩選

3. **進階分析功能**
   - 機器學習整合的自動化權重優化
   - 預測分析和趨勢預測
   - 自定義權重管理介面

### 計劃功能
- [ ] A/B 測試整合
- [ ] 自動化活動觸發
- [ ] 多媒體素材管理
- [ ] 活動範本系統
- [ ] 即時分析 (WebSocket 整合)

### 技術改進
- [ ] GraphQL API 支援
- [ ] 即時協作編輯
- [ ] 進階篩選器
- [ ] 活動複製功能

---

**最後更新**: 2025-07-27  
**版本**: 1.0.0  
**狀態**: ✅ 已實現並投入使用