# 🏪 E-commerce Admin Platform

> 企業級電商管理後台系統 - 整合訂單管理、客戶分析、智能通知、活動歸因的全方位解決方案

一個採用 **Vue 3 + TypeScript + Supabase** 建立的現代化電商後台管理系統，展示企業級前端架構設計、狀態管理模式、即時通訊整合和資料分析能力。

**核心特色**: ServiceFactory 依賴注入模式 · 智能通知系統 · 活動分層歸因分析 · Realtime 訂閱 · RFM 客戶分群

---

## 🚀 Live Demo

**線上展示**: [https://ecadmin.yachiaoyang.dev/](https://ecadmin.yachiaoyang.dev) *(部署中)*

### 測試帳號

| 角色 | 帳號 | 密碼 | 權限說明 |
|------|------|------|----------|
| 超級管理員 | super@demo.com | demo1234 | 完整系統權限、角色管理、用戶管理 |
| 管理員 | admin@demo.com | demo1234 | 系統管理、數據查看、報表匯出 |
| 業務經理 | manager@demo.com | demo1234 | 訂單管理、客戶分析、活動管理 |
| 客服人員 | support@demo.com | demo1234 | 工單處理、通知查看、客戶溝通 |

> 建議先用超級管理員帳號體驗完整功能，再切換其他角色查看權限控制效果

---

## 📚 完整技術文件

**文件站點**: [技術文件中心](./docs/index.md) *(VitePress 技術文件，部署中)*

> 📖 包含 40+ 篇技術文件，涵蓋系統架構、API 規格、部署指南、開發筆記等。建議重點閱讀：

### 推薦閱讀路徑

**🏗️ 系統架構**
- [系統架構總覽](./docs/02-development/architecture/architecture.md) - 四層架構設計
- [資料庫設計](./docs/02-development/architecture/database-design.md) - ER 圖與 52 張表結構
- [ServiceFactory 依賴注入](./docs/02-development/architecture/service-factory.md) - 企業級 API 服務層

**💼 核心業務模塊**
- [通知系統完整指南](./docs/02-development/modules/notification/notification-system-complete-guide.md) - PostgreSQL 觸發器 + Realtime
- [Campaign 歸因分析](./docs/02-development/modules/campaign/attribution-analysis.md) - 三層歸因權重計算
- [Analytics 分析系統](./docs/02-development/modules/analytics/overview.md) - 四大分析模塊架構

**🔧 API 參考**
- [User API](./docs/02-development/api/user-api.md) - 47 項權限 + 12 個角色組
- [Order API](./docs/02-development/api/order-api.md) - 訂單狀態機設計
- [Customer API](./docs/02-development/api/customer-api.md) - RFM 分群邏輯詳解

**🚀 部署與運維**
- [完整部署指南](./docs/03-operations/deployment/DEPLOYMENT.md) - Docker/Vercel/Netlify 三種方案
- [RLS 安全審計](./docs/RLS_AUDIT_SUMMARY.md) - 140 條 RLS 政策，85/100 分安全評級

---

## ✨ 核心特色

### 技術亮點

- **ServiceFactory 依賴注入模式** - 鬆耦合架構設計，支援測試與環境隔離 → [架構文件](./docs/02-development/architecture/service-factory.md)
- **智能通知系統** - PostgreSQL 觸發器 + Realtime 推送 + 智能建議邏輯 → [完整指南](./docs/02-development/modules/notification/notification-system-complete-guide.md)
- **活動分層歸因分析** - 多觸點歸因權重計算，三層歸因分類 → [歸因分析文件](./docs/02-development/modules/campaign/attribution-analysis.md)
- **RFM 客戶分群** - 基於 Recency、Frequency、Monetary 的客戶價值評估 → [RFM 邏輯詳解](./docs/02-development/api/customer-api.md)
- **即時資料訂閱** - Supabase Realtime 整合，訂單/庫存/通知即時更新 → [Realtime 架構](./docs/02-development/architecture/realtime-architecture.md)
- **完整主題系統** - Dark/Light 模式，CSS 變數統一管理

### 業務功能

- **訂單管理** - 完整生命週期管理、狀態機設計、批量操作
- **客戶分析** - RFM 分群、行為追蹤、流失風險預警
- **產品管理** - ABC 分析、滯銷品分析、庫存預警
- **活動分析** - 總覽/歸因/協作/重疊/趨勢分析，6 大分析維度
- **通知系統** - 群組通知、模板管理、智能建議
- **工單系統** - 客服對話、工單追蹤、SLA 管理
- **權限管理** - 角色權限控制、RLS 行級安全策略

---

## 🛠️ 技術棧

### 前端核心

- **框架**: Vue 3.5 (Composition API)
- **語言**: TypeScript 5.x (嚴格模式)
- **建置工具**: Vite 6.0
- **狀態管理**: Pinia + Vue Query
- **路由**: Vue Router 4.x

### UI/UX

- **樣式系統**: Tailwind CSS 3.x + SCSS
- **組件庫**: Radix Vue (Headless UI)
- **圖表**: Unovis (響應式資料視覺化)
- **圖示**: Lucide Icons
- **動畫**: 自定義 CSS 動畫系統

### 後端整合

- **BaaS**: Supabase (PostgreSQL + Realtime + Auth)
- **API 層**: ServiceFactory 依賴注入模式
- **即時通訊**: Supabase Realtime Subscriptions
- **資料查詢**: Vue Query (快取策略)

### 開發工具

- **測試**: Vitest + Vue Test Utils (471 測試全部通過)
- **程式碼品質**: ESLint + Prettier
- **類型檢查**: Vue TSC
- **文件**: VitePress
- **Git Hooks**: Husky (pre-commit 檢查)

### 架構特色

- **依賴注入**: ServiceFactory Pattern
- **狀態機**: 訂單狀態機設計
- **分層架構**: View → Component → Service → Database
- **錯誤處理**: 三層錯誤處理架構

---

## 🏗️ 系統架構

### 整體架構圖

```
┌──────────────────────────────────────────────────────┐
│                    Vue 3 + TypeScript                │
├─────────────────┬────────────────┬───────────────────┤
│   Views Layer   │  Components    │   Composables     │
│  (頁面組件)      │  (業務/UI組件)  │   (業務邏輯)        │
├─────────────────┴────────────────┴───────────────────┤
│               ServiceFactory (依賴注入層)              │
│  ┌──────────────────────────────────────────────┐    │
│  │ UserService │ OrderService │ NotificationSvs │    │
│  └──────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────┤
│               Supabase Client (BaaS)                 │
│  ┌──────────────────────────────────────────────┐    │
│  │ PostgreSQL │ Realtime │ Auth │ RLS Policies  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### ServiceFactory 依賴注入模式

```
@/lib/supabase.ts (設定實例)
    ↓
services/index.ts (建立 defaultServiceFactory)
    ↓
ServiceFactory (管理服務實例)
    ↓ ↓ ↓
UserService  OrderService  NotificationService
    ↓ ↓ ↓
Composables (業務邏輯層)
    ↓ ↓ ↓
Views & Components (UI 層)
```

**設計優勢**:
- **鬆耦合** - 服務層與實例化邏輯分離
- **可測試** - 輕鬆注入 Mock 進行單元測試
- **環境隔離** - 開發/測試/生產環境獨立設定
- **單例管理** - 服務實例統一管理，避免重複建立

### 通知系統架構流程

```
業務事件觸發 (訂單/庫存/客戶)
    ↓
PostgreSQL Triggers (notify_order_events, notify_inventory_events)
    ↓
INSERT INTO notifications (通知記錄存入資料表)
    ↓
智能建議邏輯判斷 (suggest_completion 函數)
    ↓
通知模板渲染 (8 個系統必要模板)
    ↓
Supabase Realtime 推送 (訂閱 notifications 表)
    ↓
前端 NotificationBadge 更新 (useNotification composable)
```

### 活動歸因分析資料流

```
訂單與活動接觸記錄 (orders, order_items, campaigns)
    ↓
多觸點歸因邏輯判斷 (site-wide/target-oriented/category-specific 分層)
    ↓
權重計算與營收分配 (normalized_weight · attributed_revenue)
    ↓
revenue_attribution_analysis (PostgreSQL 分析視圖)
    ↓
CampaignApiService (API 層查詢)
    ↓
useCampaignAnalyticsQueries (Vue Query 快取)
    ↓
視覺化分析報表 (歸因分析 · 協作效果 · 重疊日曆 · 趨勢預測等)
```

---

## 💡 解決的技術挑戰

| 挑戰 | 問題描述 | 解決方案核心 | 成果 | 詳細文件 |
|------|---------|-------------|------|---------|
| **通知系統修復** | 前端完整但後端觸發器完全失效 | 4 階段修復：觸發器重寫 + 路由規則 + 模板保護 | 0% → 100% 功能恢復 | [完整指南](./docs/02-development/modules/notification/notification-system-complete-guide.md) |
| **Router Session 最佳化** | 初始化耗時 3 秒阻塞首頁 | 懶載入 + 快取策略 + 非同步計算 | 3 秒 → 500ms (83% 改善) | [效能最佳化詳解](./docs/04-guides/dev-notes/ROUTER_SESSION_PERFORMANCE_OPTIMIZATION.md) |
| **ServiceFactory 架構** | 服務層直接耦合 Supabase | 依賴注入 + 單例管理 + Mock 支援 | 鬆耦合、可測試、環境隔離 | [架構設計詳解](./docs/04-guides/dev-notes/SERVICE_FACTORY_ARCHITECTURE.md) |

> 💡 **深入了解**: 每個挑戰都有完整的技術文件，包含問題分析、解決方案、實作細節與測試驗證。

---

## 🎯 核心功能模組

| 模組 | 核心特性 | 技術亮點 | 完整文件 |
|------|---------|---------|---------|
| **ServiceFactory 依賴注入** | 8 個服務統一管理 | 鬆耦合 + Mock 注入 + 環境隔離 | [架構文件](./docs/02-development/architecture/service-factory.md) |
| **智能通知系統** | PostgreSQL 觸發器 + Realtime | 自動捕獲業務事件 + 智能建議 | [通知系統指南](./docs/02-development/modules/notification/notification-system-complete-guide.md) |
| **活動分層歸因** | 三層歸因分類 + 多觸點權重 | site-wide/target-oriented/category-specific | [歸因分析](./docs/02-development/modules/campaign/attribution-analysis.md) |
| **RFM 客戶分群** | Recency/Frequency/Monetary 評估 | 11 個客戶分群 + 流失預警 | [Customer API](./docs/02-development/api/customer-api.md) |
| **即時資料訂閱** | Supabase Realtime 多模組監控 | 錯誤追蹤 + 權重分級 + 自動備援 | [Realtime 架構](./docs/02-development/architecture/realtime-architecture.md) |

> 📖 **詳細說明**: 每個模組都有完整的架構設計文件、API 規格、使用範例與最佳實踐。

---

## 🗄️ 資料庫與後端

### 資料庫設計亮點

- **195 個 Migration 檔案** - 完整的資料庫演進追蹤
- **14 個 Edge Functions** - 伺服器端商業邏輯保護
- **140+ RLS 安全策略** - 行級權限控制（A 級評分 85/100）
- **PostgreSQL 觸發器** - 自動化業務流程（通知/庫存/訂單）

### 代表性實作

| 實作 | 技術亮點 | 檔案 | 文件 |
|------|---------|------|------|
| **活動分層歸因視圖** | 多觸點權重計算 + 三層分類 | `20250723200000_layered_attribution...sql` | [Campaign 架構](./docs/02-development/modules/campaign/) |
| **通知系統觸發器** | 智能建議 + 8 個系統模板保護 | `20250731170000_fix_notification...sql` | [通知系統文件](./docs/02-development/modules/notification/) |
| **RLS 安全策略** | 行級權限控制 + SECURITY DEFINER | `20251002300000_add_rls_to_analytics...sql` | [RLS 審計報告](./docs/RLS_AUDIT_SUMMARY.md) |
| **業務健康度引擎** | 7 維度評分 + 850 行 TypeScript | `business-health-analytics/index.ts` | [Edge Functions 指南](./docs/02-development/architecture/edge-functions.md) |

> 📖 **完整文件**: 所有 Migration 與 Edge Functions 的詳細說明請參考 [資料庫設計文件](./docs/02-development/architecture/database-design.md) 與 [API 參考](./docs/02-development/api/)。

---

## 🛠️ 開發環境與工具鏈

> **📌 說明**：此為展示專案，以下內容展示完整系統的開發工具鏈設計與工作流程。

**前端工具鏈**: Vite + TypeScript + Vitest (471 測試通過) + ESLint + Husky
**後端工具鏈**: Docker Desktop + Supabase CLI + PostgreSQL + Edge Functions

> 🛠️ **詳細說明**: 完整的開發流程、環境配置、DevOps 自動化腳本請參考 [部署指南](./docs/03-operations/deployment/DEPLOYMENT.md)。

---

## 📁 專案結構

```
ecommerce-admin-platform/
├── admin-platform-vue/           # 前端專案（Vue 3 + TypeScript）
│   ├── src/
│   │   ├── api/                  # API 服務層（ServiceFactory）
│   │   │   └── services/         # 8 個業務服務類
│   │   ├── components/           # 組件庫（展示核心架構）
│   │   │   ├── data-table-*/     # 資料表格系統（3 層架構）
│   │   │   ├── charts/           # Unovis 圖表組件
│   │   │   ├── notify/           # 通知系統組件
│   │   │   └── ui/               # Radix Vue 基礎組件
│   │   ├── composables/          # 組合式函數（業務邏輯抽象）
│   │   │   ├── data-table-actions/  # 表格操作邏輯
│   │   │   ├── queries/          # Vue Query 查詢
│   │   │   └── analytics/        # 分析功能
│   │   ├── views/                # 頁面組件（核心業務場景）
│   │   ├── store/                # Pinia 狀態管理
│   │   ├── router/               # Vue Router 設定
│   │   ├── utils/                # 工具函數
│   │   └── types/                # TypeScript 類型定義
│   ├── tests/                    # 測試檔案（471 測試全部通過）
│   └── docs/                     # 前端專屬文件
├── supabase/                     # 後端專案（Supabase）
│   ├── migrations/               # 資料庫遷移檔案（195 個）
│   ├── functions/                # Edge Functions（14 個）
│   │   ├── business-health-analytics/  # 業務健康度計算
│   │   ├── campaign-scoring/           # 活動評分算法
│   │   └── customer-segmentation/      # RFM 客戶分群
│   ├── seed-core.sql             # 核心種子資料
│   └── docs/                     # 後端專屬文件
├── scripts/                      # 自動化腳本
│   ├── health-check.sh           # 系統健康檢查
│   └── prod.sh                   # 生產環境管理
├── docs/                         # 全專案技術文件
│   ├── 01-planning/              # 規劃階段文件
│   ├── 02-development/           # 開發階段文件
│   ├── 03-deployment/            # 部署相關文件
│   ├── 04-guides/                # 指南與教程
│   └── 05-reference/             # 參考資料
└── README.md                     # 本文件
```

---

## 🔧 DevOps 自動化

| 工具 | 功能 | 行數 | 技術亮點 |
|------|------|------|----------|
| **health-check.sh** | 系統健康檢查 | 167 行 | Docker 驗證 + Realtime 測試 + 彩色輸出 |
| **prod.sh** | 生產環境管理 | 175 行 | 一鍵啟動/停止 + 錯誤處理 + 健康檢查 |
| **Supabase CLI** | 資料庫管理 | - | Migration 管理 + 本地開發環境 |

> 🛠️ **使用指南**: 詳細的 DevOps 工作流程與腳本使用說明請參考 [部署指南](./docs/03-operations/deployment/DEPLOYMENT.md)。

---

## 📝 文件工程化

本專案採用 **VitePress** 建立企業級技術文件站點，展示文件即程式碼（Docs as Code）的最佳實踐。

### 文件技術棧

- **VitePress 2.x** - 靜態站點生成器，基於 Vue 3 + Vite
- **自動化 Sidebar** - 檔案系統掃描自動生成導航（`.vitepress/sidebar.ts`）
- **智能折疊邏輯** - 基於目錄深度與文件數量的自動折疊策略
- **三層文件架構** - 全專案文件 / 前端專屬 / 後端專屬分層設計

### 自動化 Sidebar 生成

**技術亮點** - 檔案系統動態掃描生成導航:

```typescript
// .vitepress/sidebar.ts - 智能折疊策略
function getSidebarItemsRecursive(dir: string, depth: number = 0): SidebarItem[] {
  // 自動折疊策略：depth >= 2 或 items > 10 或特殊目錄
  const shouldCollapse = depth >= 2 || subItems.length > 10 || item === 'dev-notes'

  // 自動計算 Markdown 數量並顯示在大型目錄旁
  const count = countMarkdownFiles(fullPath)
  if (count > 15) displayName += ` (${count})`
}
```

### 文件品質指標

- **核心文件數量**: 40 個精選 Markdown 文件
- **文件總行數**: ~24,394 行技術內容
- **平均文件長度**: ~610 行/文件
- **文件覆蓋率**: 系統架構、API、部署、開發筆記 100% 覆蓋
- **最長文件**: Customer API (1,486 行) - RFM 分群邏輯詳解

**相關連結**:
- [文件索引頁](./docs/documentation-index.md) - 完整文件導航
- [VitePress 設定](./docs/.vitepress/config.mts) - 站點設定與主題
- [Sidebar 自動生成](./docs/.vitepress/sidebar.ts) - 智能導航生成邏輯

---

## 🎓 學習重點

如果您是面試官或技術審閱者，建議重點關注以下檔案：

### 1. 架構設計能力

- `admin-platform-vue/src/api/services/ServiceFactory.ts` - 依賴注入模式實作
- `admin-platform-vue/src/composables/data-table-actions/` - 可重用架構模式
- `admin-platform-vue/src/lib/queryClient.ts` - Vue Query 階層式快取管理

### 2. 前端工程化

- `admin-platform-vue/src/components/data-table-common/` - Headless UI 設計
- `admin-platform-vue/src/components/charts/pure/` - Unovis 圖表整合
- `admin-platform-vue/tests/` - 471 測試全部通過（100% 通過率）

### 3. 後端邏輯保護

- `supabase/migrations/20250723200000_layered_attribution_implementation.sql` - 複雜視圖設計
- `supabase/migrations/20250731170000_fix_notification_triggers_for_real_tables.sql` - 觸發器架構
- `supabase/functions/business-health-analytics/` - Edge Function 商業邏輯

### 4. 問題解決能力

- `docs/04-guides/dev-notes/NOTIFICATION_SYSTEM_OVERVIEW.md` - 通知系統修復記錄
- `docs/04-guides/dev-notes/ROUTER_SESSION_PERFORMANCE_OPTIMIZATION.md` - 效能最佳化案例
- `docs/04-guides/dev-notes/SERVICE_FACTORY_ARCHITECTURE.md` - 架構重構思路

### 5. DevOps 實踐

- `scripts/health-check.sh` - 系統健康檢查腳本（167 行）
- `scripts/prod.sh` - 生產環境管理腳本（175 行）
- `.github/workflows/` - CI/CD 管線設定（若部署）

---

## 📈 專案統計

> **📌 說明**：此 Repository 為精簡展示版本，聚焦核心功能與架構設計。以下統計數據反映完整系統的技術規模與複雜度。

### 程式碼規模

| 類別 | 檔案數 | 程式碼行數 | 說明 |
|------|--------|----------|------|
| **前端組件** | 400+ 個 | ~100,000 行 | 完整組件體系 |
| **Composables** | 80+ 個 | ~15,000 行 | 業務邏輯層 |
| **API Services** | 8 個 | ~2,000 行 | ServiceFactory 服務 |
| **頁面組件** | 45 個 | ~10,000 行 | 完整業務頁面 |
| **測試** | 41 個檔案 | ~12,000 行 | 471 測試（100% 通過） |
| **Migrations** | 195 個 | ~50,000 行 | 完整資料庫演進 |
| **Edge Functions** | 14 個 | ~5,000 行 | 伺服器端邏輯 |
| **技術文件** | 261 個 Markdown | ~80,000 行 | VitePress 三層架構 |
| **核心文件** | 40 個精選文件 | ~24,394 行 | 系統架構+API+部署指南 |

### 技術深度指標

- **TypeScript 覆蓋率**: 100%（所有業務程式碼）
- **測試通過率**: 100%（471/471 測試）
- **ESLint 合規**: 0 錯誤
- **文件完整度**: 核心功能 100% 覆蓋

---

## 📬 聯絡方式

**開發者**: [楊雅喬]

- 📧 Email: chiaoyyc@gmail.com
- 💼 LinkedIn: [www.linkedin.com/in/yachiaoyang](https://www.linkedin.com/in/yachiaoyang)
- 🐙 GitHub: [github.com/chiao-yyc](https://github.com/chiao-yyc)
- 🌐 個人網站: [yachiaoyang.dev/](https://yachiaoyang.dev/)

