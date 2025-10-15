# 分析服務 API 文件

> **文件版本**: v1.0
> **最後更新**: 2025-10-07
> **文件類型**: 業務邏輯層 + 自動生成 API 參考

---

## 概覽

本文件記錄電商管理平台的 **5 大分析服務**，提供：

- **業務邏輯說明**（人工撰寫）
- **技術 API 參考**（TypeDoc 自動生成）
- **使用場景範例**
- **效能與最佳實踐**

### 文件導航策略

| 何時使用本文件            | 何時使用自動生成文件      | 何時使用 Supabase Dashboard |
| ------------------------- | ------------------------- | --------------------------- |
| ✅ 了解業務邏輯與分析方法 | ✅ 查詢方法簽名與類型定義 | ✅ 查詢資料庫 Schema        |
| ✅ 學習使用場景與範例     | ✅ 瀏覽完整 API 列表      | ✅ 測試基礎 CRUD 操作       |
| ✅ 效能優化建議           | ✅ 查看參數與回傳值結構   | ✅ 查看資料表關聯           |

---

## 5 大分析服務概覽

| 服務名稱                                  | 業務用途 | 主要功能                       | 自動生成文件                                                                 |
| ----------------------------------------- | -------- | ------------------------------ | ---------------------------------------------------------------------------- |
| **OrderAnalyticsService**                 | 訂單分析 | 漏斗分析、付款效能、配送分析   | [API 參考](./auto-generated/OrderAnalyticsService/README.md)                 |
| **ProductAnalyticsService**               | 產品分析 | ABC 分析、滯銷品分析、庫存預警 | [API 參考](./auto-generated/ProductAnalyticsService/README.md)               |
| **CustomerAnalyticsZeroExpansionService** | 客戶分析 | 行為模式、流失風險、價值成長   | [API 參考](./auto-generated/CustomerAnalyticsZeroExpansionService/README.md) |
| **CustomerSegmentationService**           | 客戶分群 | RFM 分群、流失預測、價值評估   | [API 參考](./auto-generated/CustomerSegmentationService/README.md)           |
| **SupportAnalyticsApiService**            | 客服分析 | 對話統計、Agent 效能、時段分析 | [API 參考](./auto-generated/SupportAnalyticsApiService/README.md)            |

---

## 1️⃣ OrderAnalyticsService - 訂單分析服務

### 業務定位

**用途**: 提供訂單全生命週期的多維度分析，協助優化訂單流程和提升轉換率

**核心價值**:

- 🎯 **漏斗分析**: 識別訂單流程瓶頸
- 💳 **付款效能**: 優化付款方式選擇
- 🚚 **配送分析**: 改善物流效率
- 👤 **客戶行為**: 理解購買決策模式
- ❌ **取消分析**: 降低訂單取消率

### 核心方法

#### `getOrderAnalyticsBasic(params)` - 完整訂單分析

**業務邏輯**:

- 並行查詢 5 大分析模組（漏斗、付款、配送、客戶、取消）
- 即使部分模組失敗，仍返回可用數據（優雅降級）
- 自動計算總體指標和關鍵發現

**資料來源**:

- `order_basic_funnel_analysis` 視圖 - 訂單漏斗數據
- `payment_performance_analysis` 視圖 - 付款效能數據
- `delivery_performance_analysis` 視圖 - 配送效能數據

**使用場景**:

```typescript
import { defaultServiceFactory } from "@/api/services";

const orderAnalytics = defaultServiceFactory.getOrderAnalyticsService();

// 查詢最近 30 天的訂單分析
const result = await orderAnalytics.getOrderAnalyticsBasic({
  startDate: "2025-09-07",
  endDate: "2025-10-07",
});

if (result.success) {
  console.log("漏斗轉換率:", result.data.funnelSummary.conversionRate);
  console.log("平均訂單金額:", result.data.funnelSummary.avgOrderValue);
  console.log("完成率:", result.data.funnelSummary.completionRate);
}
```

#### `exportOrderAnalyticsBasic(params)` - 導出分析數據

**業務邏輯**:

- 提供 Excel/CSV 導出格式的數據結構
- 包含詳細的時間序列數據

**適用場景**:

- ✅ 高層管理報告
- ✅ 跨部門數據共享
- ✅ 第三方工具分析

### ⚡ 效能考量

| 數據量        | 回應時間 | 優化建議                  |
| ------------- | -------- | ------------------------- |
| < 10 萬筆訂單 | 1-2 秒   | ✅ 直接使用               |
| 10-50 萬筆    | 2-5 秒   | ⚠️ 考慮快取               |
| > 50 萬筆     | 5+ 秒    | 🔴 建議分頁或資料庫層優化 |

**優化策略**:

- 📅 縮短查詢日期範圍
- 🚀 使用快取（5 分鐘 TTL）
- 📊 背景任務預計算

### 相關資源

- **TypeDoc API 參考**: [OrderAnalyticsService 完整文件](./auto-generated/OrderAnalyticsService/classes/OrderAnalyticsService.md)
- **Supabase 資料庫視圖**:
  - `order_basic_funnel_analysis`
  - `payment_performance_analysis`
  - `delivery_performance_analysis`
- **前端組件**: `OrderAnalyticsView.vue`

---

## 2️⃣ ProductAnalyticsService - 產品分析服務

### 業務定位

**用途**: 提供產品銷售效能分析，協助優化庫存策略和產品組合

**核心價值**:

- 🎯 **ABC 分析**: 識別高價值產品（80/20 法則）
- 📉 **滯銷品分析**: 發現庫存風險
- 🔔 **庫存預警**: 防止缺貨或過量庫存

### 核心方法

#### `getProductABCAnalysis(_params)` - ABC 分類分析

**業務邏輯**:

- **A 類產品**: 貢獻 80% 營收的前 20% 產品（高價值）
- **B 類產品**: 貢獻 15% 營收的中間 30% 產品（中價值）
- **C 類產品**: 貢獻 5% 營收的最後 50% 產品（低價值）

**資料來源**:

- `get_abc_analysis_with_categories()` RPC 函數
- `product_abc_analysis` 視圖

**使用場景**:

```typescript
const productAnalytics = defaultServiceFactory.getProductAnalyticsService();

// 執行 ABC 分析
const result = await productAnalytics.getProductABCAnalysis({});

if (result.success) {
  const { categoryA, categoryB, categoryC } = result.data.summary;

  console.log(
    `A類產品: ${categoryA.count} 個，貢獻 ${categoryA.revenuePercentage}% 營收`
  );
  console.log(
    `B類產品: ${categoryB.count} 個，貢獻 ${categoryB.revenuePercentage}% 營收`
  );
  console.log(
    `C類產品: ${categoryC.count} 個，貢獻 ${categoryC.revenuePercentage}% 營收`
  );
}
```

**商業應用**:

- ✅ **A 類產品**: 重點管理，確保充足庫存
- ⚠️ **B 類產品**: 標準管理，適度庫存
- 🔴 **C 類產品**: 考慮下架或促銷清庫存

#### `getSlowMovingProducts(params)` - 滯銷品分析

**業務邏輯**:

- 識別 30 天內無銷售的產品
- 計算庫存成本與風險

**滯銷判定標準**:

- 📅 無銷售天數 > 30 天
- 📦 現有庫存 > 0
- 💰 庫存成本 > 設定閾值

**使用場景**:

```typescript
// 查詢滯銷品
const result = await productAnalytics.getSlowMovingProducts({
  minDaysNoSales: 30,
  limit: 50,
});

if (result.success) {
  result.data.products.forEach((product) => {
    if (product.riskLevel === "high") {
      console.log(
        `高風險滯銷品: ${product.productName}, 庫存成本: $${product.stockValue}`
      );
    }
  });
}
```

#### `getStockAlerts()` - 庫存預警

**業務邏輯**:

- **缺貨預警**: 當前庫存 < 安全庫存
- **過量預警**: 當前庫存 > 最大庫存 × 1.5
- **即將缺貨**: 基於銷售速度預測缺貨時間

**預警級別**:

- 🔴 **critical**: 立即處理（已缺貨或庫存 < 3 天）
- 🟠 **high**: 優先處理（庫存 < 7 天）
- 🟡 **medium**: 關注（庫存 < 14 天）
- 🟢 **low**: 正常監控

### ⚡ 效能考量

| 分析類型   | 資料量      | 回應時間 | 優化建議          |
| ---------- | ----------- | -------- | ----------------- |
| ABC 分析   | 1000+ 產品  | 2-3 秒   | ✅ 使用視圖預計算 |
| 滯銷品分析 | 100+ 滯銷品 | 1-2 秒   | ✅ 直接使用       |
| 庫存預警   | 500+ 產品   | 1 秒     | ✅ 實時查詢       |

### 相關資源

- **TypeDoc API 參考**: [ProductAnalyticsService 完整文件](./auto-generated/ProductAnalyticsService/classes/ProductAnalyticsService.md)
- **Supabase 資料庫視圖**: `product_abc_analysis`, `slow_moving_products_analysis`
- **前端組件**: `ProductAnalyticsView.vue`

---

## 3️⃣ CustomerAnalyticsZeroExpansionService - 客戶分析服務

### 業務定位

**用途**: 基於「零資料庫擴展」策略的客戶分析服務，提供快速功能驗證

**設計理念**:

- 🚀 **零擴展策略**: 完全基於現有資料表，無需新增 views/functions
- 💻 **應用層計算**: 業務邏輯在 TypeScript 層執行
- 🎯 **快速迭代**: 適合功能驗證和小規模數據

**適用場景**:

- ✅ 客戶數量 < 50,000
- ✅ 功能驗證與業務測試
- ✅ 回應時間要求 < 3 秒

### 核心方法

#### `getCustomerAnalyticsBasic(params)` - 完整客戶分析

**5 大分析模組**:

1. **行為模式分析** - 購買頻率、金額、偏好
2. **流失風險分析** - 基於 RFM 指標預測流失機率
3. **價值成長分析** - LTV 趨勢與成長潛力
4. **分群對比分析** - 不同客戶群體的效能比較
5. **行動建議** - AI 推薦的客戶維護策略

**使用場景**:

```typescript
const customerAnalytics = new CustomerAnalyticsZeroExpansionService();

// 分析最近 90 天的客戶行為
const result = await customerAnalytics.getCustomerAnalyticsBasic({
  startDate: "2025-07-01",
  endDate: "2025-10-01",
  limit: 100,
  offset: 0,
  orderBy: "churn_risk_desc",
});

if (result.success) {
  // 檢視高風險流失客戶
  result.data.churnRisks.forEach((customer) => {
    if (customer.riskLevel === "critical") {
      console.log(`流失風險: ${customer.customerName}`);
      console.log(`建議行動: ${customer.recommendedActions.join(", ")}`);
    }
  });
}
```

### 🔄 升級路徑

當滿足以下條件時，考慮升級到 **資料庫層分析服務**:

- 📊 客戶數量 > 50,000
- ⏱️ 查詢時間 > 3 秒
- 🔄 每小時存取 > 100 次
- 💼 功能需求穩定且有長期商業價值

### 快取機制

**內建快取策略**:

- ⏰ **TTL**: 5 分鐘
- 📦 **最大快取數**: 50 個查詢
- 🔑 **快取鍵**: 基於參數內容（日期範圍、排序、分頁）

### ⚡ 效能考量

| 客戶數量      | 回應時間 | 建議動作    |
| ------------- | -------- | ----------- |
| < 10,000      | 0.5-1 秒 | ✅ 最佳效能 |
| 10,000-30,000 | 1-2 秒   | ✅ 良好     |
| 30,000-50,000 | 2-3 秒   | ⚠️ 接近上限 |
| > 50,000      | 3+ 秒    | 🔴 考慮升級 |

### 相關資源

- **TypeDoc API 參考**: [CustomerAnalyticsZeroExpansionService 完整文件](./auto-generated/CustomerAnalyticsZeroExpansionService/classes/CustomerAnalyticsZeroExpansionService.md)
- **設計文件**: [零擴展服務設計哲學](../../04-guides/dev-notes/ZERO_EXPANSION_SERVICE_DESIGN_PHILOSOPHY.md)
- **開發指南**: [客戶分析開發指南](../../04-guides/dev-notes/CUSTOMER_ANALYTICS_DEVELOPMENT_GUIDE.md)

---

## 4️⃣ CustomerSegmentationService - 客戶分群服務

### 業務定位

**用途**: 基於 Edge Function 的進階客戶分群與流失預測服務

**核心價值**:

- 🎯 **RFM 分群**: Recency, Frequency, Monetary 三維度分析
- 🔮 **流失預測**: 機器學習模型預測客戶流失風險
- 📈 **價值評估**: LTV 成長趨勢與潛力分析
- 💡 **智能推薦**: AI 驅動的客戶維護建議

### 核心方法

#### `getCustomerSegmentation(request)` - 完整分群分析

**請求參數**:

```typescript
interface CustomerSegmentationRequest {
  startDate?: string; // 分析起始日期
  endDate?: string; // 分析結束日期
  includeRfmAnalysis?: boolean; // 包含 RFM 分析
  includeChurnRisk?: boolean; // 包含流失風險分析
  includeValueGrowth?: boolean; // 包含價值成長分析
  includeRecommendations?: boolean; // 包含行動建議
  includeTrends?: boolean; // 包含趨勢分析
}
```

**回應結構**:

```typescript
interface CustomerSegmentationResponse {
  churnRisks: CustomerChurnRisk[]; // 流失風險清單
  valueGrowth: CustomerValueGrowth[]; // 價值成長清單
  segmentAnalysis: SegmentAnalysis; // 分群統計
  recommendations: CustomerRecommendation[]; // 行動建議
}
```

### RFM 分群模型

**分群邏輯**:

- **Champions (冠軍客戶)**: R=5, F=5, M=5 - 最近購買、頻繁、高金額
- **Loyal Customers (忠誠客戶)**: R=4-5, F=4-5, M=3-5
- **Potential Loyalists (潛力客戶)**: R=4-5, F=2-3, M=2-3
- **At Risk (流失風險)**: R=1-2, F=3-4, M=3-4
- **Hibernating (休眠客戶)**: R=1-2, F=1-2, M=1-3

### 🔮 流失風險評分

**風險因子**:

1. 📅 **Recency** (最近購買): 權重 40%
2. 🔢 **Frequency** (購買頻率): 權重 30%
3. 💰 **Monetary** (消費金額): 權重 20%
4. 📊 **Trend** (趨勢變化): 權重 10%

**風險等級**:

- 🔴 **Critical** (90-100 分): 立即流失風險
- 🟠 **High** (70-89 分): 高度流失風險
- 🟡 **Medium** (40-69 分): 中度流失風險
- 🟢 **Low** (0-39 分): 低度流失風險

### 使用場景

```typescript
const segmentationService =
  defaultServiceFactory.getCustomerSegmentationService();

// 完整分群分析
const result = await segmentationService.getCustomerSegmentation({
  startDate: "2025-01-01",
  endDate: "2025-10-07",
  includeRfmAnalysis: true,
  includeChurnRisk: true,
  includeValueGrowth: true,
  includeRecommendations: true,
});

if (result.success) {
  // 處理高流失風險客戶
  result.data.churnRisks
    .filter((c) => c.riskLevel === "critical")
    .forEach((customer) => {
      console.log(`流失風險客戶: ${customer.customerName}`);
      console.log(`風險分數: ${customer.riskScore}`);
      console.log(`建議行動:`, customer.recommendedActions);
    });
}
```

### ⚡ 效能考量

**Edge Function 優勢**:

- ⚡ 全球 CDN 分發
- 🚀 冷啟動 < 100ms
- 🔄 自動擴展
- 💪 適合 CPU 密集計算

### 相關資源

- **TypeDoc API 參考**: [CustomerSegmentationService 完整文件](./auto-generated/CustomerSegmentationService/classes/CustomerSegmentationService.md)
- **Edge Function**: `customer-segmentation`
- **前端組件**: `CustomerAnalyticsView.vue`

---

## 5️⃣ SupportAnalyticsApiService - 客服分析服務

### 業務定位

**用途**: 提供客服系統效能分析，優化客服資源配置和服務品質

**核心價值**:

- 📊 **對話統計**: 日常對話量、解決率、平均處理時間
- 👤 **Agent 效能**: 個別 Agent 工作量與效能指標
- ⏰ **時段分析**: 熱力圖顯示高峰時段
- 📈 **趨勢分析**: 客服需求變化趨勢

### 核心方法

#### `getSupportAnalyticsOverview(dateRange)` - 客服總覽

**資料來源**:

- `conversation_summary_daily` 視圖 - 日常對話摘要

**回傳指標**:

```typescript
interface SupportAnalyticsOverview {
  totalConversations: number; // 總對話數
  resolvedConversations: number; // 已解決對話數
  resolutionRate: number; // 解決率 %
  avgResponseTime: number; // 平均回應時間（分鐘）
  avgResolutionTime: number; // 平均解決時間（小時）
  customerSatisfaction: number; // 客戶滿意度評分
}
```

#### `getAgentMetrics(dateRange)` - Agent 效能分析

**效能指標**:

- 📋 **處理量**: 處理的對話數
- ⏱️ **回應速度**: 平均首次回應時間
- ✅ **解決率**: 成功解決的對話比例
- 👍 **滿意度**: 客戶評分

#### `getConversationHourlyHeatmap(dateRange)` - 時段熱力圖

**業務應用**:

- 🎯 **人力配置**: 基於高峰時段優化排班
- 📊 **資源規劃**: 預測客服需求
- ⚡ **效率優化**: 避免資源浪費

**使用場景**:

```typescript
const supportAnalytics = defaultServiceFactory.getSupportAnalyticsService();

// 查詢最近 30 天的客服數據
const result = await supportAnalytics.getSupportAnalyticsOverview({
  start: "2025-09-07",
  end: "2025-10-07",
});

if (result.success) {
  console.log(`總對話數: ${result.data.totalConversations}`);
  console.log(`解決率: ${result.data.resolutionRate}%`);
  console.log(`平均回應時間: ${result.data.avgResponseTime} 分鐘`);
}

// 查詢 Agent 效能
const agentResult = await supportAnalytics.getAgentMetrics({
  start: "2025-09-07",
  end: "2025-10-07",
});
```

### KPI 標準

| 指標           | 優秀     | 良好      | 需改善    |
| -------------- | -------- | --------- | --------- |
| **解決率**     | > 90%    | 70-90%    | < 70%     |
| **首次回應**   | < 5 分鐘 | 5-15 分鐘 | > 15 分鐘 |
| **解決時間**   | < 2 小時 | 2-8 小時  | > 8 小時  |
| **客戶滿意度** | > 4.5    | 3.5-4.5   | < 3.5     |

### ⚡ 效能考量

**資料來源**:

- ✅ 使用預計算視圖，查詢效能優秀
- ✅ 支援日期範圍篩選
- ✅ 預設查詢最近 30 天

### 相關資源

- **TypeDoc API 參考**: [SupportAnalyticsApiService 完整文件](./auto-generated/SupportAnalyticsApiService/classes/SupportAnalyticsApiService.md)
- **Supabase 資料庫視圖**: `conversation_summary_daily`
- **前端組件**: `SupportAnalyticsView.vue`

---

## 最佳實踐

### 1. 查詢優化

#### ✅ 推薦做法

```typescript
// ✅ 明確的日期範圍
const result = await service.getAnalytics({
  startDate: "2025-09-07",
  endDate: "2025-10-07",
});

// ✅ 使用分頁
const result = await service.getList({
  limit: 50,
  offset: 0,
});

// ✅ 錯誤處理
if (!result.success) {
  console.error("分析失敗:", result.error);
  // 顯示使用者友好的錯誤訊息
}
```

#### ❌ 避免做法

```typescript
// ❌ 無限日期範圍
const result = await service.getAnalytics({}); // 可能查詢所有歷史數據

// ❌ 過大的分頁
const result = await service.getList({ limit: 10000 }); // 回應時間過長

// ❌ 忽略錯誤
const result = await service.getAnalytics({});
console.log(result.data); // 可能導致 undefined 錯誤
```

### 2. 快取策略

**適合快取的場景**:

- ✅ 歷史分析數據（過去日期）
- ✅ 總覽統計（每 5-10 分鐘更新）
- ✅ 排行榜（Top 10 產品/客戶）

**不適合快取的場景**:

- ❌ 實時監控數據
- ❌ 當日數據（頻繁變動）
- ❌ 個人化數據

### 3. 效能監控

**關鍵指標**:

- ⏱️ **回應時間**: < 3 秒為優秀
- 📊 **資料量**: 單次查詢 < 10MB
- 🔄 **並發量**: < 100 QPS

---

## 延伸閱讀

### 技術文件

- [API 服務架構設計](../architecture/api-services.md)
- [ServiceFactory 使用指南](../architecture/service-factory.md)
- [BaseApiService 繼承指南](../architecture/base-api-service.md)

### 開發指南

- [零擴展服務設計哲學](../../04-guides/dev-notes/ZERO_EXPANSION_SERVICE_DESIGN_PHILOSOPHY.md)
- [客戶分析開發指南](../../04-guides/dev-notes/CUSTOMER_ANALYTICS_DEVELOPMENT_GUIDE.md)
- [模組優化開發指南](../../04-guides/dev-notes/MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md)

### 自動生成文件

- [OrderAnalyticsService API](./auto-generated/OrderAnalyticsService/README.md)
- [ProductAnalyticsService API](./auto-generated/ProductAnalyticsService/README.md)
- [CustomerAnalyticsZeroExpansionService API](./auto-generated/CustomerAnalyticsZeroExpansionService/README.md)
- [CustomerSegmentationService API](./auto-generated/CustomerSegmentationService/README.md)
- [SupportAnalyticsApiService API](./auto-generated/SupportAnalyticsApiService/README.md)

---

## 貢獻與維護

### 文件維護策略

本文件採用 **混合維護策略**:

1. **業務邏輯層**（本文件）- 人工維護

   - 業務定位與價值說明
   - 使用場景與範例
   - 最佳實踐與優化建議

2. **技術 API 參考** - 自動生成
   - 方法簽名與參數類型
   - 回傳值結構
   - 完整 API 列表

### 更新流程

1. **代碼變更時**:

   ```bash
   # 重新生成 TypeDoc 文件
   cd admin-platform-vue
   npx typedoc
   ```

2. **業務邏輯變更時**:
   - 手動更新本文件對應章節
   - 更新使用場景範例
   - 調整最佳實踐建議

---

> 💡 **提示**: 本文件結合人工撰寫的業務邏輯說明與 TypeDoc 自動生成的技術參考，提供完整的 API 使用指引。如需查詢特定方法的類型定義，請參考各服務的 TypeDoc 文件連結。
