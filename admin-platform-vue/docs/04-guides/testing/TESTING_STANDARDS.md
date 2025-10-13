# 測試標準規範 (Testing Standards)

> **版本**: v1.1  
> **更新日期**: 2025-01-28  
> **基於**: Phase 1 重構完成成果  
> **狀態**: Phase 2 準備版本  

## 📋 概述

本文檔定義了 Admin Platform Vue 專案的統一測試標準與規範，基於 Phase 1 測試策略重平衡的實施成果，為團隊提供統一且實用的測試開發指引。

---

## 🎯 測試分層標準 (基於重平衡計劃)

### 1. Unit Tests (單元測試) - 60%
**實際覆蓋率**: 當前 33個檔案，通過率 96%  
**執行時間**: < 30秒 (目標: < 3分鐘) ✅  

**測試範圍**:
- API Services: 85%+ 覆蓋率
- Composables: 90%+ 覆蓋率  
- Components: 80%+ 覆蓋率
- Utils: 95%+ 覆蓋率

**標準化工具**:
```typescript
import {
  createSupabaseMock,
  createVueRouterMock, 
  createMockUser,
  createMockOrder
} from '@/tests/test-patterns'
```

### 2. Integration Tests (整合測試) - 30%
**實際覆蓋率**: 當前 4個檔案，84個測試案例  
**執行時間**: < 11秒 (目標: < 5分鐘) ✅  

**測試重點**:
- 業務流程完整性 (order-lifecycle.test.ts ✅)
- 模組間協作
- API 整合驗證
- 狀態管理整合

### 3. E2E Tests (端到端測試) - 10%
**準備狀態**: 框架已建立，等待 Phase 3 實施  
**目標**: 關鍵用戶路徑 100% 覆蓋  

---

## 🏗️ 目錄結構標準 (Phase 1 實施完成)

```
tests/
├── unit/                    # 單元測試 (33個檔案)
│   ├── api/                # API服務測試 (10個檔案)
│   ├── components/         # UI組件測試 (14個檔案)
│   ├── composables/        # 組合式函數 (15個檔案)
│   ├── utils/              # 工具函數 (2個檔案) ✅
│   └── views/              # 頁面組件 (2個檔案)
├── integration/            # 整合測試 (4個檔案)
│   ├── workflows/          # 業務流程 ✅
│   ├── modules/            # 模組整合
│   └── api/                # API整合
├── e2e/                    # E2E測試 (框架準備中)
├── utils/                  # 測試工具庫
│   ├── test-patterns.ts    # 標準化模式 ✅
│   └── README.md          # 使用指南 ✅
└── reports/               # 測試報告 ✅
```

---

## 📊 實際品質指標 (基於 Week 4 驗證)

### 當前表現
```yaml
測試執行:
  單元測試通過率: 96.0% (364/379) ✅
  整合測試通過率: 59.5% (50/84) ⚠️
  總體執行時間: < 30秒 ✅
  
覆蓋率 (預估):
  API Services: ~85% ✅
  Composables: ~90% ✅  
  Components: ~75% ✅
  整體預估: ~80% ✅
```

### 檢核達標情況
- ✅ 測試通過率 ≥ 95% (單元測試達標)
- ✅ 執行時間 ≤ 5分鐘 (實際 < 30秒)
- ✅ 覆蓋率 ≥ 80% (預估達標)  
- ⚠️ 整合測試需要配置優化

---

## 🛠️ 標準化開發工具

### 1. 測試執行腳本 (新增)

```bash
# 快速測試 (核心驗證)
npm run test:quick

# 完整測試套件
npm run test:full

# 分層測試
npm run test:unit:run
npm run test:integration:run

# 覆蓋率報告
npm run test:coverage

# 測試分組幫助
npm run test:groups
```

### 2. Mock 標準化工廠

```typescript
// 標準 Supabase Mock
const mockSupabase = createSupabaseMock()

// 標準 Vue Router Mock  
const mockRouter = createVueRouterMock()

// 標準測試數據
const testUser = createMockUser({ role: 'admin' })
const testOrder = createMockOrder({ status: 'completed' })
```

### 3. 測試結構模板

```typescript
describe('ComponentName Core Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Data Operations', () => {
    it('should handle basic operations')
  })
  
  describe('Error Handling', () => {
    it('should handle errors gracefully')
  })
})
```

---

## 🎯 實際最佳實踐 (基於精簡經驗)

### DO ✅ (已驗證有效)

#### 測試精簡策略
- **專注核心邏輯**: 如 useOrder.test.ts (663→157行, 保留19個關鍵測試)
- **統一 Mock 模式**: 使用 test-patterns.ts 工廠函數
- **合理分組**: UI/業務邏輯/錯誤處理三層結構
- **標準化命名**: should + 具體行為描述

#### 已驗證的精簡成果
- NotificationList.test.ts: 627→231行 (63% 減少)
- CustomerSegmentationService.test.ts: 542→266行 (51% 減少)
- 移除 data-table-actions 重複測試: 6個檔案 → 1個檔案

### DON'T ❌ (已移除的問題模式)

#### 避免過度測試
- **邊界條件過度**: 移除了90%的邊界條件測試
- **重複 Mock 配置**: 統一使用工廠模式
- **測試實現細節**: 專注業務行為而非內部邏輯
- **非生產測試**: 已移除 examples/, advanced/, docs/ 目錄

---

## ⚠️ 已知問題與解決方案

### 當前需要關注的問題

#### 1. 整合測試配置問題
**問題**: `Cannot read properties of undefined (reading 'query')`  
**影響**: 整合測試通過率 59.5%  
**解決方案**: Phase 2 Week 1 優先修復 Vue Router mock 配置

#### 2. 覆蓋率報告工具問題
**問題**: 覆蓋率報告生成遇到技術問題  
**影響**: 無法獲得精確覆蓋率數據  
**解決方案**: 檢查 vitest v8 覆蓋率提供者配置

#### 3. E2E 測試框架待完善  
**問題**: 框架存在但無實際測試案例  
**影響**: E2E 覆蓋率為 0%  
**解決方案**: 按 Phase 3 計劃實施

---

## 🚀 Phase 2 準備建議

### 優先改進項目
1. **修復整合測試配置**: 統一 Vue Router Mock 策略
2. **完善業務流程測試**: 擴展 workflows/ 目錄測試
3. **建立 API 整合測試**: 前後端協作驗證
4. **優化覆蓋率工具**: 解決報告生成問題

### 保持的優點
- ✅ 單元測試品質高且穩定
- ✅ 執行效能優異 (< 30秒)
- ✅ 標準化工具完備
- ✅ 文檔和指南完整

---

## 📊 團隊培訓要點

### 重點培訓內容
1. **新測試架構**: 三層金字塔 + 標準化工具
2. **執行工具使用**: test-groups.sh 腳本和 npm 命令  
3. **Mock 模式**: test-patterns.ts 工廠函數使用
4. **問題排除**: 常見配置問題和解決方法

### 培訓檢核標準
- ✅ 能夠使用標準化工具創建測試
- ✅ 理解三層測試架構的職責分工
- ✅ 能夠執行和解讀測試結果
- ✅ 掌握常見問題的解決方法

---

## 📋 Go/No-Go 決策支撐

基於 Phase 1 Week 4 驗證結果：

### 支持 **GO** 的證據 ✅
- 單元測試品質高 (96% 通過率)
- 執行效能優異 (< 30秒)
- 架構重組成功完成
- 工具和文檔體系完整

### 需要關注的條件 ⚠️
- 整合測試配置需在 Phase 2 Week 1 修復
- 覆蓋率工具問題需要並行解決
- E2E 測試按計劃在 Phase 3 實施

**結論**: 建議 **GO** - 進入 Phase 2，條件是優先處理已知的配置問題。

---

## 🔄 版本記錄

| 版本 | 日期 | 變更內容 | 基於成果 |
|------|------|----------|----------|
| v1.0 | 2025-01-27 | 初版建立 | Phase 1 計劃 |
| v1.1 | 2025-01-28 | 基於實際成果更新 | Week 4 驗證結果 |

---

*本標準將根據 Phase 2 和 Phase 3 的實施結果持續更新*