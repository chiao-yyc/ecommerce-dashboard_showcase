# Analytics 分析系統

## 系統概述

Analytics 分析系統是電商管理平台的核心商業智能模組，提供多維度的數據分析與視覺化功能，支援產品分析、訂單分析、客戶分析、支援分析四大專業領域。

## 文檔導航

### 系統架構文檔
- [system-architecture.md](./system-architecture.md) - 整體架構設計與模組組織

### 相關分析資源
- [分析指標綜合稽核](../../../04-guides/dev-notes/audit-reports/ANALYTICS_INDICATORS_COMPREHENSIVE_AUDIT.md) - 實際指標狀態稽核
- [實作狀態指南](../../../04-guides/dev-notes/audit-reports/IMPLEMENTATION_STATUS_GUIDE.md) - 各模組實作進度追蹤

### 開發指南連結
- [Analytics 模組架構優化](../../../04-guides/dev-notes/ANALYTICS_MODULE_ARCHITECTURE_OPTIMIZATION.md)
- [Customer Analytics 開發指南](../../../04-guides/dev-notes/CUSTOMER_ANALYTICS_DEVELOPMENT_GUIDE.md)
- [Order Analytics 開發指南](../../../04-guides/dev-notes/ORDER_ANALYTICS_DEVELOPMENT_PHASES.md)
- [Support Analytics 開發指南](../../../04-guides/dev-notes/SUPPORT_ANALYTICS_DEVELOPMENT_GUIDE.md)

## 核心功能

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
│ (5個頁面)        │    │ (7個圖表) ✅      │    │ (6個服務) 🔄     │
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

## 組件結構

### 頁面組件 (Views)
- `CustomerAnalyticsView.vue` - 客戶 RFM 分析 (46KB - 複雜儀表板)
- `OrderAnalyticsView.vue` - 訂單趨勢分析 (13KB - 中等複雜度)
- `ProductAnalyticsView.vue` - 產品 ABC 分析 (11KB - 精簡版)
- `SupportAnalyticsView.vue` - 客服效能分析 (26KB - 高複雜度)

### 分析組件 (Components)
- `ABCAnalysisChart.vue` - ABC 分類圓餅圖 ✅
- `AnalyticsDashboard.vue` - 綜合分析儀表板 ✅
- `CancellationAnalysisChart.vue` - 取消訂單分析 ✅
- `CustomerBehaviorChart.vue` - 客戶行為追蹤 ✅
- `DeliveryPerformanceChart.vue` - 配送效能分析 ✅
- `DemandForecastChart.vue` - 需求預測圖表 ✅
- `OrderFunnelChart.vue` - 訂單轉換漏斗 ✅
- `PaymentPerformanceChart.vue` - 付款效能分析 ✅

## 實作狀態

### ✅ 已完成功能
- 7個分析圖表組件全部實作完成
- 客戶分析RFM模型完整實施
- 訂單趨勢分析與漏斗轉換
- 產品ABC分析與庫存預警

### 🔄 部分實作功能
- API服務層 (6個服務，部分功能待擴展)
- 進階預測功能 (基礎框架已建立)
- 毛利分析功能 (已備份至future-features)

### 🔮 規劃中功能
- 機器學習預測模型
- 客製化報表系統
- 即時警報機制

## 相關系統

- [Campaign 活動系統](../campaign/) - 行銷活動效果分析
- [Notification 通知系統](../notification/) - 分析結果通知推送
- [Customer 客戶系統](../customer/) - 客戶資料整合分析

## 📈 資料來源分類

- **🗄️ DB**: 直接從資料庫查詢取得（已驗證存在）
- **⚙️ FE**: 前端計算處理（基於已存在資料）
- **🔄 Hybrid**: 混合模式（確認資料庫基礎數據存在）
- **📊 RPC**: 使用資料庫函數（已驗證函數存在）

## 🧪 測試與品質

### 測試覆蓋
- 分析組件單元測試
- 資料計算邏輯測試
- 視覺化渲染測試

### 效能監控
- 圖表渲染效能
- 資料查詢優化
- 記憶體使用監控

---

*本文檔整合了原有的13個分散文檔，提供統一的導航和管理入口*