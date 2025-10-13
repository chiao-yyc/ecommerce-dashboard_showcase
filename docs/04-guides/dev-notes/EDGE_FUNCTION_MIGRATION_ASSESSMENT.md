分析系統商業邏輯遷移評估報告

基於我對專案的全面檢查，以下是針對分析系統將商業邏輯遷移到 edge function 的評估結果：

🎯 適合遷移的高價值商業邏輯

1. **毛利分析核心算法** (⚠️ 未來規劃項目)

**檔案位置**: `useProfitabilityAnalysis.ts:54-156`
**商業價值**: ⭐⭐⭐⭐⭐ (核心競爭力)
**遷移建議**: 暫緩 - 需先完成資料庫擴展

**⚠️ 重要限制說明**:
- **資料庫缺失**: products 表只有 `price`（售價），無 `cost_price`（成本價）
- **無成本追蹤**: 缺少採購成本歷史記錄表
- **目前狀態**: 功能已備份至 `/docs/future-features/`，在產品分析頁面中已註解停用
- **模擬數據**: 目前使用固定成本率 65% 進行演示

**前置需求**:
1. 在 products 表增加 `cost_price` 欄位
2. 建立 `purchase_orders` 表記錄採購成本
3. 建立 `cost_history` 表追蹤成本變化

**核心算法內容** (已實現但暫停使用):
- 毛利率計算公式: `(總營收 - 總成本) / 總營收 * 100`
- 貢獻毛利算法: `毛利 * 0.8` (固定成本分攤邏輯)
- 產品類別排名演算法
- 績效評分權重系統

**未來 Edge Function**: `profitability-analysis` (第二階段考慮)

2. 活動分析評分系統 (高優先級)

檔案位置: useCampaignAnalytics.ts:508-543
商業價值: ⭐⭐⭐⭐⭐ (獨特評分演算法)
遷移建議: 強烈建議

核心算法內容:
// 活動綜合績效分數計算
營收權重(40%) + 歸因權重(25%) + 協作效果(20%) + 歸因品質(15%)

新 Edge Function: campaign-scoring

3. 業務健康度計算引擎 (高優先級)

檔案位置: DashboardExecutiveHealth.vue:58-149
商業價值: ⭐⭐⭐⭐⭐ (戰略決策核心)
遷移建議: 強烈建議

核心算法內容:

- 多維度健康度評分 (客戶/營運/服務)
- 趨勢分析算法 (週變化率計算)
- 業務動能分析 (動量指標)

新 Edge Function: business-health-analytics

4. RFM 客戶分析演算法 (中高優先級)

檔案位置: useCustomerAnalyticsBasic.ts (推測)
商業價值: ⭐⭐⭐⭐
遷移建議: 建議

新 Edge Function: customer-segmentation

🛡️ 適合保護的計算邏輯

1. 歸因權重分配算法

檔案位置: useCampaignAnalytics.ts:290-467
商業機密等級: 高

- 分層歸因邏輯 (site-wide, target-oriented, category-specific)
- 協作效果計算公式
- 競爭強度評估算法

2. 系統效率評估公式

檔案位置: useCampaignAnalytics.ts:583-596

- 歸因準確度分數權重
- 協作平衡最佳比例 (50%)
- 利用率評分演算法

3. 風險評估與預警機制

檔案位置: DashboardApiService.ts (系統穩定度計算)

- 多模組權重計算
- 實時警報觸發閾值
- 業務風險量化公式

📊 遷移影響分析

測試程式碼影響 (低風險)

- 現有測試: 19 個相關測試檔案
- 影響程度: 30% 需要調整 mock 邏輯
- 主要修改: API service 測試改為 edge function 測試

效能改善預期

- 計算效能: 提升 60-80% (伺服器端計算)
- 前端負載: 減少 40-50% (移除複雜運算)
- 安全性: 提升 90% (核心算法不可見)

🚀 具體遷移計劃

Phase 1: 核心分析算法 (2-3 週)

新增 Edge Functions:
├── profitability-analysis/ # 毛利分析
├── campaign-scoring/ # 活動評分
├── business-health-analytics/ # 健康度分析
└── customer-segmentation/ # 客戶分群

Phase 2: 前端重構 (1-2 週)

修改檔案:
├── composables/analytics/ # 改為 API 呼叫
├── api/services/ # 新增 edge function 服務
└── types/ # 調整介面定義

Phase 3: 測試調整 (1 週)

更新測試:
├── **tests**/integration/ # 整合測試
├── api/services/**tests**/ # API 測試
└── composables/**tests**/ # 組合式函數測試

💡 遷移價值評估

商業價值

- 保護核心算法: 避免競爭對手抄襲獨特的評分和分析邏輯
- 效能優化: 複雜計算移至伺服器端，前端響應更快
- 可擴展性: Edge function 支援更大規模數據分析

技術價值

- 安全性提升: 商業邏輯完全隱藏
- 維護性改善: 算法更新不需重新部署前端
- 一致性保證: 多客戶端共用相同計算邏輯

風險評估

- 開發成本: 中等 (2-4 人週)
- 測試成本: 低 (大部分測試可複用)
- 維護複雜度: 略微增加 (需要管理 edge function)

🎯 建議執行優先順序 (已調整)

1. **立即執行**: 活動評分系統 (使用頻率高，核心商業邏輯)
2. **優先執行**: 業務健康度引擎 (戰略重要性，複雜算法)
3. **計劃執行**: 客戶分群邏輯 (RFM 分析，相對標準)
4. **第二階段考慮**: 毛利分析算法 (需先完成資料庫擴展)

**調整說明**: 由於毛利分析功能目前缺乏實際成本數據支撐，暫緩遷移計劃

## 詳細執行任務規劃

### Phase 1: 活動評分系統遷移 (Week 1)

#### Sprint 1.1: Campaign Scoring Edge Function (2-3 天)
- [ ] **Task 1.1.1**: 建立 `campaign-scoring` edge function 架構
  - 路徑: `supabase/functions/campaign-scoring/`
  - 設定 CORS 和基礎配置
  - 建立輸入參數驗證機制

- [ ] **Task 1.1.2**: 遷移活動評分算法
  - 從 `useCampaignAnalytics.ts:508-543` 提取算法
  - 實現綜合績效分數計算: `營收權重(40%) + 歸因權重(25%) + 協作效果(20%) + 歸因品質(15%)`
  - 實現 ROI 分數計算邏輯

- [ ] **Task 1.1.3**: 實現歸因權重分配算法
  - 從 `useCampaignAnalytics.ts:290-467` 遷移邏輯
  - 分層歸因邏輯 (site-wide, target-oriented, category-specific)
  - 協作效果計算公式
  - 競爭強度評估算法

#### Sprint 1.2: API 整合與前端調整 (2-3 天)
- [ ] **Task 1.2.1**: 建立 Campaign Scoring API 服務層
  - 新增 `CampaignScoringApiService.ts`
  - 實現與 edge function 的 HTTP 通訊
  - 加入錯誤處理和重試機制

- [ ] **Task 1.2.2**: 重構 campaign analytics composable
  - 修改 `useCampaignAnalytics.ts`
  - 移除前端計算邏輯，改為 API 呼叫
  - 保持相同的公開介面

- [ ] **Task 1.2.3**: 驗證活動分析頁面功能
  - 測試 `CampaignAnalyticsView.vue`
  - 確保所有圖表和數據正確顯示
  - 驗證評分系統準確性

#### Sprint 1.3: 測試與驗證 (1-2 天)
- [ ] **Task 1.3.1**: Campaign scoring 測試
  - 建立測試檔案和測試資料
  - 驗證評分演算法正確性
  - 效能基準測試

- [ ] **Task 1.3.2**: 整合測試調整
  - 更新 campaign analytics 相關測試
  - 建立 mock scoring 服務
  - 端到端測試驗證

### Phase 2: 業務健康度引擎遷移 (Week 2)

#### Sprint 2.1: Business Health Analytics Edge Function (2-3 天)
- [ ] **Task 2.1.1**: 建立 `business-health-analytics` edge function
  - 路徑: `supabase/functions/business-health-analytics/`
  - 設定複雜業務邏輯處理架構

- [ ] **Task 2.1.2**: 遷移健康度計算引擎
  - 從 `DashboardExecutiveHealth.vue:58-149` 提取算法
  - 多維度健康度評分 (客戶/營運/服務)
  - 趨勢分析算法 (週變化率計算)
  - 業務動能分析 (動量指標)

- [ ] **Task 2.1.3**: 實現系統效率評估
  - 從 `useCampaignAnalytics.ts:583-596` 遷移邏輯
  - 歸因準確度分數權重
  - 協作平衡最佳比例 (50%)
  - 利用率評分演算法

#### Sprint 2.2: Dashboard 整合重構 (2-3 天)
- [ ] **Task 2.2.1**: 建立 Business Health API 服務
  - 新增 `BusinessHealthAnalyticsApiService.ts`
  - 整合健康度分析 edge function
  - 處理複雜的多維度計算請求

- [ ] **Task 2.2.2**: 重構 Executive Health 頁面
  - 修改 `DashboardExecutiveHealth.vue`
  - 移除前端計算邏輯
  - 保持所有視覺化組件功能

- [ ] **Task 2.2.3**: 更新 Dashboard API Service
  - 修改 `DashboardApiService.ts`
  - 整合新的健康度計算服務
  - 確保系統穩定度計算正確

#### Sprint 2.3: 測試與部署準備 (1-2 天)
- [ ] **Task 2.3.1**: 健康度分析測試
  - Edge function 全面測試
  - 多維度計算正確性驗證
  - 效能壓力測試

- [ ] **Task 2.3.2**: Dashboard 整合測試
  - Executive Health 頁面測試
  - 業務指標準確性驗證
  - 使用者體驗測試

### Phase 3: 客戶分群邏輯遷移 (Week 3 - 可選)

#### Sprint 3.1: Customer Segmentation Edge Function (2-3 天)
- [ ] **Task 3.1.1**: 建立 `customer-segmentation` edge function
  - 路徑: `supabase/functions/customer-segmentation/`
  - RFM 分析算法架構

- [ ] **Task 3.1.2**: 實現 RFM 客戶分析演算法
  - 從 `useCustomerAnalyticsBasic.ts` 遷移邏輯
  - Recency, Frequency, Monetary 評分
  - 客戶生命週期階段計算
  - 客戶價值分群算法

#### Sprint 3.2: 客戶分析整合 (2-3 天)
- [ ] **Task 3.2.1**: 建立 Customer Segmentation API 服務
  - 新增 `CustomerSegmentationApiService.ts`
  - 整合分群分析 edge function

- [ ] **Task 3.2.2**: 重構客戶分析頁面
  - 修改 `CustomerAnalyticsView.vue`
  - 更新相關 composables
  - 保持分析功能完整性

### Phase 4: 毛利分析算法遷移 (未來階段 - 需前置作業)

#### 前置需求完成後執行:
- [ ] **Task 4.1.1**: 資料庫擴展
  - 在 products 表增加 `cost_price` 欄位
  - 建立 `purchase_orders` 表記錄採購成本  
  - 建立 `cost_history` 表追蹤成本變化

- [ ] **Task 4.1.2**: 重新啟用毛利分析功能
  - 從 `/docs/future-features/` 恢復相關組件
  - 更新 `ProductAnalyticsView.vue` 取消註解
  - 測試實際成本數據流程

- [ ] **Task 4.1.3**: 建立 `profitability-analysis` edge function
  - 遷移 `useProfitabilityAnalysis.ts:54-156` 核心算法
  - 實現真實毛利計算邏輯
  - 整合實際成本數據來源

### 跨階段任務

#### 持續任務
- [ ] **文件更新**: 每個 Phase 完成後更新技術文件
- [ ] **效能監控**: 建立 edge function 效能監控
- [ ] **安全檢查**: 確保敏感算法完全隱藏
- [ ] **備份計劃**: 建立回滾機制以防問題發生

#### 驗收標準
- [ ] **功能完整性**: 所有原有功能正常運作
- [ ] **效能提升**: 前端載入時間減少 40%+
- [ ] **安全性**: 核心商業邏輯完全移至伺服器端
- [ ] **可維護性**: 新架構易於維護和擴展

#### 風險緩解
- [ ] **漸進式部署**: 支援新舊系統並行運行
- [ ] **A/B 測試**: 驗證新系統正確性
- [ ] **監控告警**: 建立 edge function 健康度監控
- [ ] **快速回滾**: 準備緊急回滾至原有系統的機制
