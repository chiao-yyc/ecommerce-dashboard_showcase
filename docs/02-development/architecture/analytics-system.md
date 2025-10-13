# Analytics 分析系統架構文檔

## 系統概述

Analytics 分析系統是電商管理平台的核心商業智能模組，提供多維度的數據分析與視覺化功能，支援產品分析、訂單分析、客戶分析、支援分析四大專業領域。

## 整體架構

### 分析模組組織
```
Analytics System (分析系統)
├── Product Analytics (產品分析)          # ABC分析、滯銷品、庫存預警
├── Order Analytics (訂單分析)            # 訂單趨勢、漏斗分析、效能統計
├── Customer Analytics (客戶分析)         # RFM模型、LTV分析、行為追蹤
└── Support Analytics (客服分析)          # 客服效能、回應時間、工作量分析
```

### 技術架構分層
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   View Layer    │    │ Component Layer │    │  Service Layer  │
│                 │    │                 │    │                 │
│ AnalyticsViews  │◄──►│ Chart Components│◄──►│ Analytics APIs  │
│ (5個頁面)        │    │ (7個圖表) ✅ **已實作**│    │ (6個服務) 🔄 **部分實作**│
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Composable Layer│    │  Types & Utils  │    │  Database Layer │
│                 │    │                 │    │                 │
│ useAnalytics    │    │ Analytics Types │    │ Supabase Views  │
│ (6個組合函數)    │    │ Chart Configs   │    │ SQL Functions   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 檔案結構詳覽

### 頁面組件 (Views)
```
src/views/
├── CustomerAnalyticsView.vue       # 客戶 RFM 分析 (46KB - 複雜儀表板)
├── OrderAnalyticsView.vue          # 訂單趨勢分析 (13KB - 中等複雜度)
├── ProductAnalyticsView.vue        # 產品 ABC 分析 (11KB - 精簡版)
├── ProductAnalyticsTestView.vue    # 產品分析測試 (16KB - 開發測試用)
└── SupportAnalyticsView.vue        # 客服效能分析 (26KB - 高複雜度)
```

### 分析組件 (Components) - ✅ 已驗證
```
src/components/analytics/
├── ABCAnalysisChart.vue            # ABC 分類圓餅圖 ✅
├── AnalyticsDashboard.vue          # 綜合分析儀表板 ✅
├── CancellationAnalysisChart.vue   # 取消訂單分析 ✅
├── CustomerBehaviorChart.vue       # 客戶行為追蹤 ✅
├── DeliveryPerformanceChart.vue    # 配送效能分析 ✅
├── DemandForecastChart.vue         # 需求預測圖表 ✅
├── OrderFunnelChart.vue            # 訂單轉換漏斗 ✅
└── PaymentPerformanceChart.vue     # 付款效能分析 ✅
```

**注意**: 
- ✅ 已確認存在 7 個分析圖表組件
- 🔄 SlowMovingProductsList.vue 和 StockAlertsPanel.vue 未在 analytics 目錄中找到
- 📦 部分功能可能分散在其他目錄或整合在主要組件中

### API 服務層 (Services)
```
src/api/services/
├── CustomerAnalyticsZeroExpansionService.ts  # 客戶分析服務
├── OrderAnalyticsZeroExpansionService.ts     # 訂單分析服務
├── ProductApiService.ts                      # 產品分析服務 (複用)
├── SupportAnalyticsApiService.ts             # 客服分析服務
├── UserApiService.ts                         # 用戶分析服務 (複用)
└── base/BaseApiService.ts                    # 基礎服務類
```

### 狀態管理層 (Composables)
```
src/composables/analytics/
├── useBasicForecasting.ts          # 基礎預測功能 (備份中)
├── useCustomerAnalyticsBasic.ts    # 客戶分析基礎功能
├── useOrderAnalyticsBasic.ts       # 訂單分析基礎功能
├── useProductAnalytics.ts          # 產品分析功能
├── useProfitabilityAnalysis.ts     # 毛利分析功能 (備份中)
└── useSupportAnalytics.ts          # 客服分析功能
```

### 類型定義 (Types)
```
src/types/
├── analytics.ts                    # 通用分析類型
├── customerAnalytics.ts            # 客戶分析類型
├── orderAnalytics.ts               # 訂單分析類型
├── productAnalytics.ts             # 產品分析類型
└── supportAnalytics.ts             # 客服分析類型
```

## 各模組功能詳述

### 1. Product Analytics (產品分析)
**核心功能**: 
- **ABC 分析**: 基於銷售額和銷量的產品分類
- **滞銷品分析**: 識別滯銷風險產品
- **庫存預警**: 低庫存和過量庫存預警

**技術實現**:
```typescript
// 主要分析指標
interface ProductAnalytics {
  abcClassification: ABCClassification[]
  slowMovingProducts: SlowMovingProduct[]
  stockAlerts: StockAlert[]
  inventoryTurnover: number
}

// ABC 分類算法
const calculateABCClassification = (products: Product[]) => {
  // Pareto 80/20 原則分類邏輯
  // A類: 銷售額前80%的產品
  // B類: 銷售額 80%-95% 的產品  
  // C類: 銷售額後5%的產品
}
```

### 2. Order Analytics (訂單分析)
**核心功能**:
- **訂單趨勢**: 時序分析與預測
- **漏斗分析**: 轉換率與流失分析
- **效能統計**: 處理時間與成功率

**視覺化組件**:
- 訂單量趨勢線圖
- 轉換漏斗圖
- 熱力圖 (時段分析)
- 散點圖 (相關性分析)

### 3. Customer Analytics (客戶分析)
**核心功能**:
- **RFM 模型**: Recency, Frequency, Monetary 客戶分群
- **LTV 分析**: 客戶生命週期價值計算
- **行為追蹤**: 購買行為模式分析

**高級功能**:
```typescript
// RFM 分群算法
interface RFMMetrics {
  recency: number      // 最近購買天數
  frequency: number    // 購買頻次
  monetary: number     // 消費金額
  rfmScore: string     // RFM 綜合評分
  segment: CustomerSegment  // 客戶分群
}

// 8種客戶分群
enum CustomerSegment {
  CHAMPIONS = 'Champions',           // 冠軍客戶
  LOYAL_CUSTOMERS = 'Loyal',         // 忠誠客戶  
  POTENTIAL_LOYALISTS = 'Potential', // 潛力客戶
  NEW_CUSTOMERS = 'New',             // 新客戶
  PROMISING = 'Promising',           // 有前景客戶
  NEED_ATTENTION = 'Need Attention', # 需關注客戶
  ABOUT_TO_SLEEP = 'About to Sleep', # 即將流失
  AT_RISK = 'At Risk'               # 流失風險
}
```

### 4. Support Analytics (客服分析)
**核心功能**:
- **回應時間分析**: 首次回應、平均回應時間統計 ✅ **已實作** 🔍 **已驗證**
- **工作負載分析**: 客服人員工作量分布 ✅ **已實作** 🔍 **已驗證**
- **滿意度追蹤**: 服務品質指標監控 📊 **規劃中** (需建立 satisfaction_score 欄位)

**關鍵指標**:
- **MTFR** (Mean Time to First Response): 平均首次回應時間 ✅ **已實作**
- **MTTR** (Mean Time to Resolution): 平均解決時間 ✅ **已實作**
- **CSAT** (Customer Satisfaction): 客戶滿意度 📊 **規劃中** (需建立滿意度調查機制)
- **工單分布**: 按緊急程度、類型的工單統計 ✅ **已實作**

## 圖表系統架構

### 三層圖表架構
```
1. Pure Charts (純圖表層)
   ├── 專注數據視覺化
   ├── 無業務邏輯
   └── 高度可重用

2. Chart Cards (卡片包裝層)  
   ├── 添加標題、描述
   ├── 載入狀態處理
   └── 錯誤狀態顯示

3. Business Containers (業務容器層)
   ├── 數據預處理
   ├── 業務邏輯整合
   └── 用戶互動處理
```

### 支援的圖表類型
- **趨勢圖**: 線圖、面積圖、柱狀圖
- **分布圖**: 圓餅圖、環形圖、散點圖  
- **比較圖**: 分組柱狀圖、雷達圖
- **關係圖**: 散點圖、氣泡圖
- **專業圖**: 漏斗圖、熱力圖、盒須圖

## 技術特性

### 效能優化
- **虛擬滾動**: 大數據量表格優化 ✅ **已實作** 🔍 **已驗證**
- **懶載入**: 圖表按需載入 ✅ **已實作** 🔍 **已驗證**
- **數據快取**: 分析結果智能快取 🔄 **部分實作** (Vue Query) ⚠️ **需驗證**
- **並行查詢**: 多圖表數據並行獲取 ✅ **已實作** 🔍 **已驗證**

### 響應式設計
- **斷點適配**: 支援桌面、平板、手機
- **圖表縮放**: 根據容器尺寸自適應
- **互動優化**: 觸控友好的操作體驗

### 數據安全
- **權限控制**: 基於角色的數據訪問控制 ✅ **已實作** 🔍 **已驗證**
- **數據脫敏**: 敏感數據的安全處理 🔄 **部分實作** ⚠️ **需驗證**
- **審計日誌**: 分析操作的完整記錄 📊 **規劃中** (未實作)

## 🧪 測試策略

### 組件測試
```bash
# 分析組件單元測試
npm run test:unit -- src/components/analytics

# 分析服務測試  
npm run test:unit -- src/api/services/*Analytics*

# 組合函數測試
npm run test:unit -- src/composables/analytics
```

### 數據準確性驗證
- **基準測試**: 與已知結果比對
- **邊界測試**: 極值情況處理
- **一致性測試**: 跨模組數據一致性

## 📈 業務價值

### 決策支援
- **實時監控**: 關鍵業務指標即時追蹤
- **趨勢識別**: 業務發展趨勢預測
- **異常檢測**: 業務異常的快速識別

### 營運優化  
- **資源配置**: 基於數據的資源優化配置
- **流程改進**: 發現並改善營運瓶頸
- **成本控制**: 精確的成本結構分析

### 用戶體驗
- **個性化服務**: 基於用戶行為的個性化推薦
- **服務品質**: 客服效能的持續優化
- **滿意度提升**: 數據驅動的用戶體驗改善

## 🔮 未來發展

### 計劃功能
- [ ] **預測分析**: 基於機器學習的業務預測
- [ ] **實時告警**: 關鍵指標異常的即時通知
- [ ] **自動化報告**: 定期業務報告自動生成
- [ ] **數據探索**: 交互式數據探索工具

### 技術演進
- [ ] **大數據支援**: 處理 TB 級數據的能力
- [ ] **實時計算**: 流式數據處理與即時分析
- [ ] **AI 整合**: 人工智能算法的深度整合
- [ ] **雲原生**: 全面雲原生架構升級

---

**最後更新**: 2025-07-29  
**版本**: 2.1.0-VERIFIED  
**狀態**: ✅ 核心功能已實現，基於實際代碼驗證  
**維護團隊**: Analytics Development Team  
**驗證說明**: 已通過實際代碼檢查和資料庫架構驗證