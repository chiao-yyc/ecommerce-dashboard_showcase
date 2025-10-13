# 產品與庫存管理優化計劃
# Product & Inventory Management Enhancement Plan

## 專案概覽

### 目標
基於現有電商管理平台的產品和庫存模組，透過數據驅動的方式提升商業營運效率，降低庫存成本並優化產品績效。

### Phase 1 已實現範圍 ✅
- ✅ **產品ABC分析系統** - 基於真實銷售數據的帕累托分類
- ✅ **智能庫存預警機制** - 三級預警系統 (critical/warning/info)
- ✅ **滯銷品識別與建議** - 基於庫存週轉率的風險評估
- ❌ **~~毛利分析儀表板~~** - 因缺乏成本資料已移除
- ⏳ **基礎需求預測功能** - 移至 Phase 2 實現

## 實作階段規劃

### Phase 1: 零資料表擴展 (當前實作階段)
**時程**: 2-3週  
**技術需求**: 使用現有資料庫結構  
**開發重點**: 商業邏輯與分析演算法

#### 1.1 產品ABC分析系統 ✅ **已實現**
**功能描述**: 基於真實銷售貢獻度自動分類產品，識別高價值商品

**✅ 實際資料來源**:
- `order_items` - 實際銷售交易記錄
- `orders` - 訂單狀態篩選 (paid, completed, fulfilled)
- `products` - 產品基本資料
- `categories` - 產品分類資料

**✅ 實際實作組件**:
```typescript
// 已完成檔案
src/composables/analytics/useProductAnalytics.ts  // ABC分析核心邏輯
src/views/ProductAnalyticsTestView.vue            // 測試頁面
src/types/analytics.ts                           // 類型定義
```

**✅ 實際分析公式與規則**:
```typescript
// 1. 數據聚合：按產品ID分組計算銷售指標
totalRevenue = Σ(unit_price × quantity)
totalQuantity = Σ(quantity)
orderCount = COUNT(DISTINCT order_id)
averageOrderValue = totalRevenue / orderCount

// 2. 營收貢獻度計算
revenueContribution = (產品營收 / 總營收) × 100%
cumulativeContribution = 累積營收貢獻度

// 3. ABC分類規則（帕累托原則）
if (cumulativeContribution <= 80%) → A類產品
else if (cumulativeContribution <= 95%) → B類產品
else → C類產品
```

**✅ 實際商業邏輯**:
- **A類產品**: 累積貢獻度 ≤ 80%，高價值核心產品
- **B類產品**: 累積貢獻度 80-95%，中等價值產品  
- **C類產品**: 累積貢獻度 > 95%，低價值長尾產品

#### 1.2 滯銷品識別系統 ✅ **已實現**
**功能描述**: 基於 `inventory_logs` 表分析庫存異動頻率，自動識別滯銷產品

**✅ 實際資料來源**:
- `inventory_logs` - 庫存異動記錄（重點分析 'out' 類型）
- `inventories` - 庫存基本資料
- `product_inventory_status` - 當前庫存狀態視圖
- `products` 與 `categories` - 產品基本資料

**✅ 實際分析公式與規則**:
```typescript
// 預設分析參數（可調整）
const defaultParams = {
  minDaysSinceLastSale: 30,    // 最少無銷售天數
  maxInventoryTurnover: 2,     // 最大庫存週轉率
  maxInventoryDays: 90         // 最大庫存天數
}

// 1. 庫存週轉率計算
analysisPeriodDays = params.minDaysSinceLastSale
inventoryTurnover = outboundCount / (analysisPeriodDays / 30)  // 每月週轉次數
inventoryDays = inventoryTurnover > 0 ? 30 / inventoryTurnover : 999

// 2. 最後銷售天數計算
daysSinceLastSale = (今日 - 最後出庫日期) / (1000 × 60 × 60 × 24)

// 3. 滯銷判定條件（任一成立）
isSlowMoving = daysSinceLastSale >= minDaysSinceLastSale ||
               inventoryTurnover <= maxInventoryTurnover ||
               inventoryDays >= maxInventoryDays
```

**✅ 風險等級分類**:
```typescript
// 風險等級評估
if (daysSinceLastSale >= 180 || inventoryDays >= 300) → 'critical'  // 極高風險
else if (daysSinceLastSale >= 90 || inventoryDays >= 180) → 'high'  // 高風險  
else if (daysSinceLastSale >= 60 || inventoryDays >= 120) → 'medium' // 中等風險
else → 'low'  // 低風險
```

**✅ 處理建議策略**:
```typescript
// 建議處理方案
if (riskLevel === 'critical') → 'clearance'  // 清倉處理
else if (riskLevel === 'high') → 'discount'  // 折扣促銷
else if (riskLevel === 'medium') → 'bundle'  // 組合銷售
else → 'remove'  // 移除或調整
```

**✅ 實際實作組件**:
```typescript
// 已完成檔案
src/composables/analytics/useProductAnalytics.ts::analyzeSlowMovingFromDatabase()
src/views/ProductAnalyticsTestView.vue  // 滯銷品結果顯示
```

#### 1.3 庫存預警系統 ✅ **已實現**
**功能描述**: 基於 `product_inventory_status` 視圖生成智能庫存預警

**✅ 實際資料來源**:
- `product_inventory_status` - 產品庫存狀態視圖
- `free_stock` - 可用庫存數量
- `stock_threshold` - 安全庫存閾值

**✅ 實際預警規則與公式**:
```typescript
// 1. 零庫存預警 (最高優先級)
if (currentStock === 0) {
  alertType: 'out_of_stock'
  severity: 'critical'
  recommendedAction: '立即補貨 - 產品已零庫存'
}

// 2. 低庫存預警 
else if (currentStock <= threshold) {
  alertType: 'low_stock'
  severity: currentStock <= threshold * 0.5 ? 'critical' : 'warning'
  recommendedAction: `建議補貨 - 庫存低於安全水位 (${threshold})`
}

// 3. 過量庫存預警
else if (currentStock > threshold * 5 && currentStock > 100) {
  alertType: 'overstock'
  severity: 'info'
  recommendedAction: `考慮促銷 - 庫存過多，超過安全水位 ${倍數} 倍`
}
```

**✅ 嚴重程度分級**:
- **critical**: 零庫存或極低庫存 (≤ 閾值的50%)
- **warning**: 低庫存 (閾值50%-100%)  
- **info**: 過量庫存提醒

**✅ 實際實作組件**:
```typescript
// 已完成檔案
src/composables/analytics/useProductAnalytics.ts::generateStockAlertsFromDatabase()
src/views/ProductAnalyticsTestView.vue  // 預警結果顯示
```

#### 1.4 毛利分析儀表板 ❌ **已移除**
**狀態**: 因資料庫結構限制已移除此功能

**❌ 移除原因**:
> 目前資料庫結構不支援真實毛利分析：
> - `products`表僅有`price`（售價）欄位，無`cost_price`（成本價）
> - 無採購成本歷史記錄表  
> - 無法獲得真實成本數據進行有意義的毛利分析
> - 使用模擬數據違反「零資料表擴展」原則

**🔧 實現毛利分析的前置需求**:
```sql
-- 1. 擴展 products 表
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN cost_updated_at TIMESTAMPTZ;

-- 2. 建立採購成本記錄表
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  supplier_id UUID,
  unit_cost DECIMAL(10,2),
  quantity INTEGER,
  total_cost DECIMAL(10,2),
  order_date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 建立成本歷史表
CREATE TABLE cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  old_cost DECIMAL(10,2),
  new_cost DECIMAL(10,2),
  change_reason TEXT,
  effective_date TIMESTAMPTZ DEFAULT NOW()
);
```

**💡 建議替代方案**:
- **營收分析**: 基於現有銷售數據分析產品營收貢獻
- **價格分析**: 分析產品定價策略和價格彈性  
- **銷售效率分析**: 分析單位銷售的營收效率

**🚀 未來實現時的分析公式**:
```typescript
// 當成本數據可用時
grossProfit = totalRevenue - totalCost
grossMargin = (grossProfit / totalRevenue) × 100%
contributionMargin = grossProfit - allocatedFixedCosts
profitPerUnit = averageSellingPrice - averageCost
```

#### 1.5 基礎需求預測 ⏳ **未實現**
**狀態**: Phase 1 階段未包含，移至 Phase 2

**📊 實現考量**:
- 需要足夠的歷史銷售數據進行準確預測
- 建議先完成 ABC 分析和滯銷品分析，累積業務洞察
- 預測功能需要更長的觀察期間驗證準確性

**🚀 未來實現規劃**:
- **Phase 2** 優先實現移動平均預測
- **Phase 3** 實現季節性和趨勢分析
- 整合機器學習模型提升預測準確度

### Phase 2: 輕量資料表擴展 (未來規劃)
**時程**: 3-4週  
**新增資料表**: 2-3個  
**重點功能**: 智能補貨、高級預測

#### 2.1 智能補貨點系統
**新增資料表**:
```sql
CREATE TABLE reorder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  min_stock_level INTEGER,
  max_stock_level INTEGER,
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  lead_time_days INTEGER,
  safety_stock INTEGER,
  seasonal_adjustments JSONB,
  auto_reorder_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.2 庫存預測增強
**新增資料表**:
```sql
CREATE TABLE inventory_forecasting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  forecast_date DATE,
  predicted_demand INTEGER,
  confidence_interval_lower INTEGER,
  confidence_interval_upper INTEGER,
  algorithm_used TEXT,
  accuracy_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.3 庫存預警記錄
**新增資料表**:
```sql
CREATE TABLE stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  alert_type TEXT CHECK (alert_type IN ('low_stock', 'overstock', 'reorder_needed', 'slow_moving')),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  threshold_value INTEGER,
  current_value INTEGER,
  message TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 3: 完整功能擴展 (長期規劃)
**時程**: 6-8週  
**新增資料表**: 8-10個  
**重點功能**: 變體管理、供應商整合、動態定價

#### 3.1 產品變體管理系統
**核心功能**:
- 多維度變體管理 (顏色、尺寸、規格)
- 變體獨立庫存追蹤
- 變體差異化定價
- 變體績效分析

#### 3.2 供應商管理整合
**核心功能**:
- 供應商基本資料管理
- 採購訂單自動化流程
- 供應商績效評估
- 成本分析與比價系統

#### 3.3 動態定價策略
**核心功能**:
- 競爭對手價格監控
- 價格彈性分析
- 自動調價規則引擎
- 促銷效果評估

## 預期商業效益

### Phase 1 預期效益 (3個月內)
- **庫存成本降低**: 15-20% (透過滯銷品識別和清倉)
- **決策效率提升**: 50% (透過ABC分析聚焦高價值產品)
- **缺貨率降低**: 25-30% (透過改善庫存預警機制)
- **毛利率優化**: 3-5% (透過成本可視化和定價優化)

### Phase 2 預期效益 (6個月內)
- **庫存週轉率提升**: 20-25%
- **預測準確度**: 70-80%
- **自動化程度**: 60%
- **營運成本降低**: 10-15%

### Phase 3 預期效益 (12個月內)
- **整體營運效率**: 40-50% 提升
- **供應鏈成本**: 15-20% 降低
- **產品組合優化**: 完整變體管理能力
- **競爭力提升**: 動態定價策略

## 技術實作指引

### Phase 1 開發重點

#### 1. 資料分析算法實作
```typescript
// ABC分析核心算法
export function calculateABCClassification(salesData: ProductSalesData[]): ABCAnalysisResult {
  // 1. 計算各產品營收貢獻
  // 2. 按營收排序
  // 3. 計算累積貢獻百分比
  // 4. 分類 A(0-80%), B(80-95%), C(95-100%)
  // 5. 返回分類結果
}

// 滯銷品識別算法
export function identifySlowMovingProducts(params: SlowMovingAnalysisParams): SlowMovingProduct[] {
  // 1. 分析銷售頻率
  // 2. 計算庫存週轉率
  // 3. 評估季節性因素
  // 4. 產生清倉建議
}
```

#### 2. 組件架構設計
```typescript
// 分析儀表板基礎組件
BaseAnalyticsCard.vue       // 分析卡片基礎組件
AnalyticsMetricDisplay.vue  // 指標顯示組件
TrendChart.vue             // 趨勢圖表組件
ComparisonChart.vue        // 比較圖表組件
```

#### 3. API服務擴展
```typescript
// 擴展現有 ProductApiService
class ProductAnalyticsService extends BaseApiService {
  async getABCAnalysis(params: AnalysisParams): Promise<ABCAnalysisResult>
  async getSlowMovingProducts(params: SlowMovingParams): Promise<SlowMovingProduct[]>
  async getProfitabilityAnalysis(params: ProfitParams): Promise<ProfitabilityData>
  async getInventoryForecast(params: ForecastParams): Promise<ForecastResult>
}
```

### 開發規範與最佳實踐

#### 1. 程式碼組織
- 所有分析相關邏輯放在 `composables/analytics/` 目錄
- UI組件統一放在 `components/analytics/` 目錄
- 類型定義新增至 `types/analytics.ts`

#### 2. 效能考量
- 大量數據分析使用 Web Workers
- 圖表渲染採用虛擬化技術
- API分頁查詢避免大量數據傳輸

#### 3. 使用者體驗
- 分析結果採用漸進式載入
- 提供數據導出功能
- 支援自定義分析參數

## 📈 成功指標與監控

### 關鍵績效指標 (KPIs)
1. **庫存相關**:
   - 庫存週轉率
   - 庫存準確率
   - 缺貨頻率
   - 過期/滯銷庫存比例

2. **產品相關**:
   - ABC分類準確性
   - 產品毛利率
   - 新品成功率
   - 產品生命週期管理效率

3. **營運相關**:
   - 決策響應時間
   - 預測準確度
   - 自動化處理比例
   - 用戶滿意度

### 監控機制
- 每日自動分析報告
- 異常指標即時通知
- 週/月/季度績效報告
- 使用者行為分析

## 🔄 風險評估與緩解策略

### 技術風險
- **風險**: 大量歷史數據分析可能影響系統效能
- **緩解**: 採用分批處理和快取機制

### 商業風險
- **風險**: 分析結果可能不符合實際業務場景
- **緩解**: 提供參數調整和人工覆蓋機制

### 資料風險
- **風險**: 歷史資料品質可能影響分析準確性
- **緩解**: 實作資料清理和驗證機制

## 實作時程規劃 ✅ **Phase 1 已完成**

### ✅ Phase 1 已完成項目 (2025-01-25)
- [x] **建立分析資料模型和類型定義** 
  - `src/types/analytics.ts` - 完整類型定義
  - 支援 ABC 分析、滯銷品分析、庫存預警的資料結構

- [x] **實作 ABC分析核心算法** 
  - 基於真實 `order_items` 資料庫查詢
  - 帕累托原則分類 (80%/95% 累積貢獻度)
  - 完整的營收貢獻度計算

- [x] **完成滯銷品識別系統**
  - 基於 `inventory_logs` 出庫記錄分析
  - 風險等級分類 (critical/high/medium/low)
  - 智能處理建議 (clearance/discount/bundle/remove)

- [x] **建立庫存預警增強功能** 
  - 基於 `product_inventory_status` 即時預警
  - 三級預警系統 (critical/warning/info)
  - 零庫存/低庫存/過量庫存檢測

- [x] **完整功能測試**
  - `src/views/ProductAnalyticsTestView.vue` - 測試介面
  - 所有分析功能整合測試
  - 真實資料庫數據驗證

### ❌ Phase 1 移除項目
- [x] **~~毛利分析功能~~** - 因缺乏成本數據移除
- [x] **~~基礎需求預測~~** - 移至 Phase 2

### Phase 2 規劃項目
- [ ] 資料表設計評估 (考慮新增成本相關表)
- [ ] 基礎需求預測實現
- [ ] 智能補貨點系統
- [ ] 商業價值驗證與效益分析

## 相關文檔

### 技術文檔
- [API 服務擴展指引](./api-service-extension.md)
- [分析算法實作規範](./analytics-algorithms.md)
- [組件開發標準](./component-development-standards.md)

### 商業文檔
- [ABC分析方法論](./abc-analysis-methodology.md)
- [庫存管理最佳實踐](./inventory-best-practices.md)
- [ROI計算方法](./roi-calculation-methods.md)

---

**文檔版本**: v1.0  
**最後更新**: 2025-01-25  
**負責人**: AI Development Team  
**審核狀態**: Draft

*此計劃將根據實作進度和商業需求持續更新*