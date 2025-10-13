# 測試架構文檔 📋

**建立時間**: 2025-08-10  
**狀態**: Active  
**維護者**: Claude Code  

## 測試分類與架構

### 測試層級定義

#### 🔬 單元測試 (Unit Tests)
- **目標**: 測試個別函數、組件、服務的獨立功能
- **位置**: `tests/unit/` 和 `src/` 目錄內的 `__tests__/`
- **工具**: Vitest + Vue Test Utils + Happy DOM
- **覆蓋範圍**: API服務、Composables、工具函數、組件邏輯
- **執行速度**: 快速 (< 1秒/測試)

#### 整合測試 (Integration Tests)  
- **目標**: 測試模組間的協作和資料流
- **位置**: `src/__tests__/integration/`
- **範例**: 組件與API服務整合、通知系統整合
- **執行速度**: 中等 (1-5秒/測試)

#### 端對端測試 (E2E Tests)
- **目標**: 測試完整使用者流程
- **位置**: `tests/e2e/` (未來實現)
- **工具**: Playwright (規劃中)
- **執行速度**: 慢 (10-30秒/測試)

## 📁 測試檔案結構

### 當前測試檔案清單 (34個檔案)

#### API 服務層測試 (7個檔案)
```
src/api/services/__tests__/
├── ApiServices.test.ts                    # 服務工廠測試
├── GroupNotificationApiService.test.ts    # 群組通知服務
├── NotificationApiService.refactored.test.ts # 通知服務(重構版)
├── NotificationApiService.test.ts         # 通知服務(原版)
├── index.test.ts                         # 服務索引測試
```

#### Composables 測試 (14個檔案)
```
tests/unit/composables/
├── data-table-actions/                   # 資料表格操作
│   ├── useCustomerActions.test.ts
│   ├── useDataTableActions.test.ts
│   ├── useOrderActions.test.ts
│   ├── useProductActions.test.ts
│   ├── useRoleUserActions.test.ts
│   └── useTicketActions.test.ts
├── useAgent.test.ts                      # 客服代理
├── useAuth.test.ts                       # 認證(原版)
├── useAuth.refactored.test.ts            # 認證(重構版)
├── useConfirmAction.test.ts              # 確認動作
├── useConversation.test.ts               # 對話管理
├── useCustomer.test.ts                   # 客戶管理
├── useOrder.test.ts                      # 訂單管理
├── usePermission.test.ts                 # 權限管理
├── useProduct.test.ts                    # 產品管理
├── useRole.test.ts                       # 角色管理
├── useUnsavedChanges.test.ts             # 未儲存變更
└── useUser.test.ts                       # 使用者管理

src/composables/__tests__/
└── useNotification.realtime.test.ts      # 通知即時功能
```

#### 組件測試 (7個檔案)
```
src/components/notify/__tests__/
├── GroupNotificationCard.test.ts         # 群組通知卡片
├── NotificationBadge.test.ts             # 通知徽章
├── NotificationCard.test.ts              # 通知卡片
└── NotificationList.test.ts              # 通知清單

tests/unit/components/notify/
└── NotificationTypeSelect.test.ts        # 通知類型選擇器
```

#### 整合測試 (3個檔案)
```
src/__tests__/integration/
├── notification-system.test.ts           # 通知系統整合
└── useNotification.test.ts               # 通知功能整合
```

#### 工具與其他測試 (3個檔案)
```
tests/unit/
├── notification-constraints.test.ts      # 通知約束測試
├── notification-helpers.test.ts          # 通知助手函數
└── examples/StandardizedMockExample.test.ts # Mock標準化範例
```

## 模組測試覆蓋狀況

### ✅ 完整覆蓋的模組
- **通知系統** (9個測試檔案) - 完整的單元測試和整合測試
- **認證系統** (2個測試檔案) - 原版和重構版本
- **資料表格操作** (6個測試檔案) - 所有主要實體的CRUD操作

### 🟡 部分覆蓋的模組  
- **API服務層** (5個測試檔案) - 主要服務已覆蓋，但可能缺少新增的服務
- **業務Composables** (8個測試檔案) - 核心業務邏輯已覆蓋

### 🔴 缺少測試的模組
- **AI增強系統** - 缺少useAI*相關的composables測試
- **儀表板系統** - 缺少dashboard相關功能測試  
- **圖表組件** - 缺少charts/pure組件測試
- **即時通知** - 只有部分realtime功能測試

## 當前失敗的測試 (需要修復)

### 🔴 高優先級修復 (影響核心功能)
1. **useCustomerActions.test.ts** - 網路連接錯誤 (ENOTFOUND test.supabase.co)
2. **useAuth.refactored.test.ts** - 部分認證邏輯失敗
3. **integration/notification-system.test.ts** - 缺少NotificationTestView.vue檔案
4. **integration/useNotification.test.ts** - 2個computed屬性測試失敗
5. **useNotification.realtime.test.ts** - vi.mock工廠問題

### ✅ 已修復的問題
1. **國際化配置** - zh-TW.ts和en.ts中'customers'重複鍵值警告 ✅
2. **useNotification.realtime.test.ts** - vi.mock工廠問題 (部分修復) ✅

### 🔴 需要標記討論的複雜問題 (3次嘗試後仍未解決)
1. **integration/notification-system.test.ts** - 需要完整的NotificationView + Pinia store mock
2. **useNotification.realtime.test.ts** - 需要完整的API service chain mock  
3. **useCustomerActions.test.ts** - 網路連接錯誤 (ENOTFOUND test.supabase.co)
4. **useAuth.refactored.test.ts** - 複雜的認證邏輯與依賴注入問題
5. **integration/useNotification.test.ts** - 2個computed屬性測試失敗

### 🟢 低優先級 (已知問題，可延後處理)
1. **Vitest deprecation warning** - "deps.inline"已棄用警告

## 測試執行

### 基本執行指令
```bash
# 執行所有測試
npm run test

# 執行單元測試
npm run test tests/unit

# 執行整合測試  
npm run test src/__tests__/integration

# 執行特定測試檔案
npm run test tests/unit/composables/useAuth.test.ts

# 產生覆蓋率報告
npm run test -- --coverage
```

### 測試監控指令
```bash
# 監視模式執行測試
npm run test -- --watch

# 執行失敗的測試
npm run test -- --retry-failed

# 詳細輸出模式
npm run test -- --verbose
```

## 📈 品質指標與目標

### 當前狀態 (2025-08-10)
- **總測試檔案**: 37個 (實際掃描結果)
- **測試套件**: 20個失敗 | 17個通過 (37個總計)
- **測試案例**: 25個失敗 | 414個通過 (439個總計)
- **整體通過率**: 94.3% (414/439)
- **主要測試框架**: Vitest 3.2.4 + Vue Test Utils 2.4.6  
- **Mock系統**: 標準化Supabase Mock工廠

### 目標指標
- **單元測試覆蓋率**: 85%+
- **測試通過率**: 95%+
- **測試執行時間**: 所有測試 < 60秒
- **單一測試檔案**: < 3秒

### 品質標準
- 每個新功能必須包含對應的單元測試
- 所有API服務必須有95%+的覆蓋率
- 核心業務邏輯必須有90%+的覆蓋率
- 關鍵使用者流程必須有整合測試

## 測試工具與配置

### 核心工具
- **測試框架**: Vitest 3.1.2
- **Vue測試**: @vue/test-utils 2.4.6
- **DOM環境**: Happy DOM 17.4.6
- **覆蓋率**: Istanbul + V8
- **Mock工具**: 標準化Supabase Mock工廠

### Mock系統
- **位置**: `tests/utils/testSupport.ts`
- **特色**: 統一的Supabase mock、標準化測試資料生成
- **使用**: 所有新測試應使用標準化mock系統

### 配置檔案
- **主配置**: `vitest.config.ts`
- **測試設定**: `tests/setup.ts`
- **TypeScript**: `tsconfig.json` (測試相關設定)

## 維護指南

### 新增測試檔案
1. 確認測試類型和適當位置
2. 使用標準化命名慣例: `*.test.ts`
3. 引用標準化mock系統
4. 包含適當的測試覆蓋

### 修復失敗測試
1. 分析失敗原因(Mock問題、類型錯誤、邏輯錯誤)
2. 最多嘗試3次修復
3. 無法解決的標記為技術債務
4. 更新相關文檔

### 測試重構原則
1. 保持向後相容性
2. 優先修復現有測試
3. 使用標準化mock系統
4. 保持測試的獨立性

## 相關文檔

### 內部文檔
- [組件整合測試計劃](./COMPONENT_INTEGRATION_TESTS_PLAN.md) - Vue組件整合測試詳細規劃
- [標準化Mock系統文檔](../../../admin-platform-vue/tests/utils/README.md) - Supabase Mock工廠使用說明

### 進階測試文檔
- [整合測試流程](../testing-tools/integration-testing.md) - 前後台整合測試指南
- [效能測試指南](../testing-tools/performance-testing.md) - Vue 3應用壓力測試
- [負載測試場景](../testing-tools/load-testing-scenarios.md) - 關鍵業務場景負載測試
- [測試資料生成](../testing-tools/test-data-generation.md) - 自動化測試資料工具

### 外部參考
- [Vitest官方文檔](https://vitest.dev/)
- [Vue Test Utils文檔](https://test-utils.vuejs.org/)
- [Happy DOM文檔](https://github.com/capricorn86/happy-dom)

---

**重要提醒**: 此文檔反映當前專案的真實測試狀況。所有變更請即時更新此文檔以保持準確性。

**下次更新**: 當測試架構有重大變更時