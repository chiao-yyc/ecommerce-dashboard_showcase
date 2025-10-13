# 測試遷移檢核清單 (Migration Checklist)

## 📋 概述

本文檔提供測試策略重構遷移的完整檢核清單，確保每個階段的執行品質和專案穩定性。

## 🎯 執行前準備檢核

### 環境準備
- [ ] **備份當前程式碼**
  ```bash
  git checkout -b backup-before-test-rebalancing
  git push origin backup-before-test-rebalancing
  ```

- [ ] **確認 CI/CD 狀態**
  - [ ] 目前 CI/CD 管線運行正常
  - [ ] 所有環境 (dev/staging/prod) 穩定
  - [ ] 無進行中的緊急修復

- [ ] **測試環境驗證**  
  - [ ] 本地測試環境可正常執行
  - [ ] Supabase 測試資料庫連線正常
  - [ ] Playwright 瀏覽器環境就緒

- [ ] **團隊溝通**
  - [ ] 通知團隊成員測試重構時程
  - [ ] 建立測試重構專用分支策略
  - [ ] 確認 code review 責任分工

## 📅 Phase 1: 整合測試建立 (Week 1-2) 

### 1.1 API 整合測試架構建立

#### 基礎架構檢核
- [ ] **資料夾結構建立**
  ```
  tests/
  ├── integration/
  │   ├── api/
  │   ├── components/  
  │   ├── stores/
  │   └── utils/
  ```

- [ ] **測試配置更新**
  ```typescript
  // vitest.config.ts 更新
  - [ ] 新增 integration 測試匹配規則
  - [ ] 設置 Supabase 測試環境變數
  - [ ] 配置獨立的覆蓋率報告
  ```

- [ ] **測試資料庫設置**
  - [ ] Supabase 測試專案建立
  - [ ] 測試資料遷移腳本準備
  - [ ] 資料庫清理機制實作

#### 核心 API 整合測試開發
- [ ] **訂單系統整合測試** (orders/)
  - [ ] `order-crud-integration.test.ts`
    - [ ] 建立訂單 + 庫存更新整合
    - [ ] 訂單狀態變更 + 通知系統整合  
    - [ ] 付款流程 + 訂單完成整合
    - [ ] 權限驗證 + API 存取整合
  - [ ] 測試執行確認：至少 8 個測試案例通過

- [ ] **產品與庫存整合測試** (products/)
  - [ ] `product-inventory-integration.test.ts`
    - [ ] 產品建立 + 庫存初始化整合
    - [ ] 庫存更新 + 低庫存警告整合
    - [ ] 產品分類 + 篩選查詢整合
    - [ ] 批量操作 + 交易一致性整合
  - [ ] 測試執行確認：至少 6 個測試案例通過

- [ ] **客戶與通知整合測試** (customers/)
  - [ ] `customer-notification-integration.test.ts`
    - [ ] 客戶註冊 + 歡迎通知整合
    - [ ] RFM 分析 + 自動標籤整合  
    - [ ] 支援工單 + 狀態通知整合
    - [ ] 權限變更 + 存取控制整合
  - [ ] 測試執行確認：至少 6 個測試案例通過

#### 第一階段驗證檢核
- [ ] **整合測試覆蓋率**
  - [ ] 新建立整合測試達到 15% 總體覆蓋率
  - [ ] 核心 API 服務覆蓋率 ≥ 60%
  - [ ] 關鍵業務流程覆蓋率 ≥ 80%

- [ ] **執行效能確認**
  - [ ] 整合測試總執行時間 < 5 分鐘
  - [ ] 無記憶體洩漏或連線問題
  - [ ] 並發執行穩定性確認

- [ ] **文檔更新**
  - [ ] 新增整合測試執行指南
  - [ ] 更新 README 測試說明
  - [ ] 建立故障排除文檔

#### Week 2 結束 Checkpoint 1 🎯
**通過條件**:
- [ ] 至少 20 個整合測試案例建立並通過
- [ ] 整合測試覆蓋率達到 15%
- [ ] CI/CD 管線整合完成
- [ ] 無現有功能回歸問題

**Commit Strategy**:
```bash
git add tests/integration/
git commit -m "feat: establish API integration test architecture

- Add 20+ integration test cases for core business flows
- Implement Supabase test database setup
- Achieve 15% integration test coverage
- Update CI/CD pipeline for integration testing

🧪 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 1.2 Component 整合測試擴展

#### Vue Component 整合架構
- [ ] **測試工具升級**
  ```typescript
  // 安裝並配置 testing-library/vue
  - [ ] @testing-library/vue 安裝
  - [ ] 自訂 render 函數建立
  - [ ] Pinia 測試整合設置
  ```

- [ ] **父子組件整合測試**
  - [ ] `data-table-integration.test.ts`
    - [ ] DataTable + DataTableActions 協作
    - [ ] 篩選 + 排序 + 分頁整合功能
    - [ ] 批量操作 + 確認對話框整合
  - [ ] 測試執行確認：至少 5 個測試案例通過

- [ ] **頁面層級整合測試**  
  - [ ] `order-view-integration.test.ts`
    - [ ] OrdersView + OrderList + OrderActions 完整協作
    - [ ] 路由導航 + 權限檢查整合
    - [ ] 載入狀態 + 錯誤處理整合
  - [ ] 測試執行確認：至少 4 個測試案例通過

#### Component 整合驗證檢核
- [ ] **功能驗證**
  - [ ] 核心頁面載入正常
  - [ ] 使用者互動功能無異常
  - [ ] 狀態管理同步正確

- [ ] **覆蓋率提升確認**
  - [ ] Component 整合測試覆蓋率達到 5%
  - [ ] 整體整合測試覆蓋率達到 20%

## 📅 Phase 2: E2E 測試擴展 (Week 3-4)

### 2.1 Playwright E2E 框架完善

#### E2E 測試環境設置
- [ ] **Playwright 配置升級**
  ```typescript
  // playwright.config.ts 完善
  - [ ] 多瀏覽器設置 (Chrome, Firefox, Safari)
  - [ ] 視覺回歸測試配置
  - [ ] 並發執行設置
  - [ ] 報告與截圖配置
  ```

- [ ] **測試資料管理**
  - [ ] E2E 測試專用資料庫
  - [ ] 測試資料 fixture 建立
  - [ ] 資料清理自動化腳本

#### 關鍵業務流程 E2E 測試
- [ ] **訂單管理端對端流程**
  - [ ] `order-management.spec.ts`
    - [ ] 完整訂單建立流程 (產品選擇 → 購物車 → 結帳 → 付款)
    - [ ] 訂單狀態追蹤與更新流程
    - [ ] 批量訂單操作與確認流程
    - [ ] 訂單取消與退款流程
  - [ ] 測試執行確認：至少 4 個完整流程通過

- [ ] **權限與存取控制 E2E**
  - [ ] `role-permission.spec.ts`  
    - [ ] 管理員完整權限驗證
    - [ ] 一般使用者權限限制驗證
    - [ ] 角色切換與頁面存取控制
    - [ ] 登入登出流程完整性
  - [ ] 測試執行確認：至少 3 個權限場景通過

- [ ] **數據分析功能 E2E**
  - [ ] `analytics-dashboard.spec.ts`
    - [ ] Dashboard 完整載入與圖表顯示
    - [ ] 篩選條件變更與圖表更新
    - [ ] 資料匯出功能完整性
  - [ ] 測試執行確認：至少 2 個分析場景通過

#### E2E 測試品質確認
- [ ] **跨瀏覽器相容性**
  - [ ] Chrome 瀏覽器測試通過
  - [ ] Firefox 瀏覽器測試通過  
  - [ ] Safari 瀏覽器測試通過 (Mac 環境)

- [ ] **視覺回歸檢測**
  - [ ] 關鍵頁面截圖比對設置
  - [ ] 響應式設計驗證 (Desktop, Tablet, Mobile)

#### Week 4 結束 Checkpoint 2 🎯
**通過條件**:
- [ ] 至少 12 個 E2E 測試案例建立並通過
- [ ] E2E 測試覆蓋率達到 8%
- [ ] 跨瀏覽器相容性確認
- [ ] 視覺回歸測試設置完成

**Commit Strategy**:
```bash
git add tests/e2e/
git commit -m "feat: comprehensive E2E testing framework

- Implement 12+ end-to-end test scenarios
- Add cross-browser compatibility testing
- Setup visual regression testing
- Achieve 8% E2E test coverage

🧪 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 📅 Phase 3: 單元測試優化重構 (Week 5-6)

### 3.1 單元測試精簡與品質提升

#### 重複測試識別與移除
- [ ] **測試重複分析**
  ```bash
  # 執行測試重複度分析工具
  - [ ] 相同功能不同測試檔案分析
  - [ ] 過度細分測試合併評估
  - [ ] 低價值測試識別與標記
  ```

- [ ] **測試移除執行**
  - [ ] 移除重複的 composable 測試：預計減少 15 個檔案
  - [ ] 合併相似的 component 測試：預計減少 10 個檔案  
  - [ ] 刪除過時的 service 測試：預計減少 8 個檔案
  - [ ] 移除後覆蓋率仍維持 ≥ 60%

#### 單元測試品質改善
- [ ] **Mock 策略標準化**
  - [ ] 建立統一的 Mock 工廠函數
  - [ ] 實作可重複使用的測試資料 fixture
  - [ ] 標準化 API service mock 模式

- [ ] **測試效能優化**
  - [ ] 識別執行時間過長的測試 (> 500ms)
  - [ ] 優化或拆分複雜測試案例
  - [ ] 減少不必要的 DOM 渲染操作

#### 單元測試精簡驗證
- [ ] **覆蓋率目標確認**
  - [ ] 單元測試覆蓋率從 85% 降至 60%
  - [ ] 保持關鍵業務邏輯 100% 覆蓋
  - [ ] 移除低價值測試後功能無回歸

- [ ] **執行效能改善**
  - [ ] 單元測試總執行時間從目前減少 30%
  - [ ] 個別測試檔案執行時間 < 10 秒
  - [ ] 測試並發執行穩定性確認

#### Week 6 結束 Checkpoint 3 🎯
**通過條件**:
- [ ] 移除 30+ 個冗餘或低價值測試檔案
- [ ] 單元測試覆蓋率穩定在 60%
- [ ] 測試執行時間減少 30%
- [ ] 所有現有功能正常運作

**Final Commit Strategy**:
```bash
git add .
git commit -m "refactor: optimize unit test suite for balanced coverage

- Remove 30+ redundant and low-value test files
- Achieve balanced test pyramid: 60% unit, 30% integration, 10% E2E
- Improve test execution performance by 30%
- Maintain 80%+ overall coverage with better test quality

🧪 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com)"
```

## 🛡️ 風險緩解檢核

### 每週風險評估
- [ ] **Week 1-2 風險控制**
  - [ ] 監控整合測試是否影響 CI/CD 效能
  - [ ] 確認新增測試不影響現有功能
  - [ ] 測試資料庫容量與連線數監控

- [ ] **Week 3-4 風險控制** 
  - [ ] E2E 測試執行時間控制在 10 分鐘內
  - [ ] 瀏覽器資源使用監控
  - [ ] 測試環境穩定性確認

- [ ] **Week 5-6 風險控制**
  - [ ] 單元測試移除前完整功能驗證
  - [ ] 覆蓋率下降但品質提升確認
  - [ ] 回歸測試完整執行

### 緊急回滾計劃
- [ ] **回滾觸發條件**
  - [ ] 覆蓋率掉到 75% 以下
  - [ ] CI/CD 管線執行時間超過 15 分鐘
  - [ ] 發現關鍵功能回歸問題

- [ ] **回滾執行步驟**
  ```bash
  # 緊急回滾指令
  git checkout backup-before-test-rebalancing
  git checkout -b emergency-rollback
  git push origin emergency-rollback
  
  # 通知團隊並評估問題
  ```

## ✅ 專案完成驗收檢核

### 最終品質標準
- [ ] **覆蓋率目標達成**
  - [ ] 總體測試覆蓋率 ≥ 80%
  - [ ] 單元測試: 60% (±5%)
  - [ ] 整合測試: 30% (±5%)  
  - [ ] E2E 測試: 10% (±3%)

- [ ] **效能標準達成**
  - [ ] 單元測試執行時間 < 2 分鐘
  - [ ] 整合測試執行時間 < 5 分鐘
  - [ ] E2E 測試執行時間 < 10 分鐘
  - [ ] CI/CD 總執行時間 < 15 分鐘

- [ ] **功能完整性確認**
  - [ ] 所有現有功能正常運作
  - [ ] 無關鍵業務流程回歸
  - [ ] 新測試能捕獲已知問題

### 文檔與交付物檢核  
- [ ] **技術文檔完善**
  - [ ] 更新 README 測試執行說明
  - [ ] 建立測試最佳實踐指南
  - [ ] 完成 API 測試文檔

- [ ] **團隊知識轉移**
  - [ ] 測試策略變更說明會
  - [ ] 新測試工具與流程培訓
  - [ ] 維護責任與流程確立

### 長期監控設置
- [ ] **自動化監控**
  - [ ] 測試覆蓋率趨勢監控
  - [ ] 測試執行效能監控  
  - [ ] 失敗率與穩定性監控

- [ ] **定期檢視機制**
  - [ ] 每月測試品質檢視會議
  - [ ] 每季測試策略評估
  - [ ] 年度測試架構審查

## 🎯 檢核清單使用指南

### 日常使用
1. **開始每個 Phase 前**: 完成該 Phase 的所有準備檢核
2. **每日開發後**: 檢查當日相關檢核項目完成狀況  
3. **每週結束時**: 完成該週的 Checkpoint 檢核
4. **遇到問題時**: 參照風險緩解檢核執行對應措施

### 檢核責任分工
- **技術負責人**: 架構與策略檢核項目
- **開發人員**: 具體測試開發與執行檢核
- **QA 人員**: 品質標準與驗收檢核
- **DevOps**: CI/CD 與效能檢核

---

*此檢核清單將隨執行進度動態更新，確保專案品質與進度控制*