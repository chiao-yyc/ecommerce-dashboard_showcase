# E-commerce Admin Platform 架構說明（Vue 版本）

---
**文檔資訊**
- 最後更新：2025-07-27
- 版本：2.1.0
- 同步狀態：✅ 已與代碼同步 (包含最新 Analytics 與 Campaign 模組)
- 自動更新：✅ 啟用
---

> 本文件詳細說明 admin-platform-vue 專案的完整架構設計，包括企業級組件架構、服務層設計、狀態管理系統、路由權限控制等核心架構要點。

## 1. 專案概覽

### 1.1 專案規模
- **總組件數量**：139+ 個組件
- **頁面數量**：40 個頁面組件
- **業務模組**：8 個核心業務域 + 5 個專業分析模組
- **技術架構**：企業級 Vue 3 全棧架構

### 1.2 核心特性
- 🏗️ **模組化架構**：按業務域高度模組化
- 📊 **專業圖表系統**：11種圖表類型 + 3層架構
- 🔐 **完整權限系統**：RBAC 角色權限控制 + Super Admin 保護
- 🗄️ **Supabase 後端**：PostgreSQL + 即時功能 + JSONB 快照系統
- 🔔 **通知管理系統**：完整的企業級通知解決方案
- 🎯 **洞察分析平台**：4個專業分析儀表板
- 🧪 **完整測試覆蓋**：單元 + 整合 + E2E 測試

## 2. 詳細專案結構

### 2.1 頂層目錄架構
```
admin-platform-vue/
├── src/                           # 源代碼目錄
│   ├── api/                      # API 服務層 (12個服務類)
│   ├── components/               # 組件系統 (7層架構)
│   ├── composables/              # 組合式函數 (18個)
│   ├── views/                    # 頁面組件 (39個)
│   ├── layouts/                  # 佈局系統 (2個)
│   ├── router/                   # 路由系統 (複雜權限控制)
│   ├── store/                    # 狀態管理 (4個 stores)
│   ├── types/                    # TypeScript 類型系統
│   ├── lib/                      # 核心庫文件 (7個)
│   ├── utils/                    # 工具函數 (3個)
│   ├── locales/                  # 國際化支援
│   ├── plugins/                  # 插件系統
│   └── __tests__/                # 測試文件
├── tests/                        # 測試套件
│   ├── unit/                     # 單元測試
│   └── integration/              # 整合測試
├── e2e/                          # E2E 測試
├── coverage/                     # 覆蓋率報告
├── dist/                         # 構建輸出
└── docs/                         # 專案文檔
```

### 2.2 API 服務層架構
```
src/api/
├── services/                     # 服務類別目錄
│   ├── base/                    # 基礎抽象類
│   │   ├── BaseApiService.ts    # 統一 API 服務基類
│   │   ├── types.ts            # 共用類型定義
│   │   └── index.ts
│   ├── UserApiService.ts        # 用戶管理服務
│   ├── ProductApiService.ts     # 產品管理服務
│   ├── OrderApiService.ts       # 訂單管理服務
│   ├── CustomerApiService.ts    # 客戶管理服務
│   ├── ConversationApiService.ts # 對話管理服務
│   ├── AgentApiService.ts       # 客服代理服務
│   ├── RoleApiService.ts        # 角色管理服務
│   ├── NotificationApiService.ts # 通知服務 (複雜度最高)
│   ├── GroupNotificationApiService.ts # 群組通知服務
│   ├── MonitoredNotificationService.ts # 通知監控服務
│   ├── NotificationService.ts   # 通知核心服務
│   ├── ServiceFactory.ts       # 服務工廠模式
│   ├── __tests__/              # API 測試套件
│   └── index.ts                # 統一導出
├── supabase.ts                  # Supabase 客戶端
├── seedFaker.ts                 # 測試數據生成
└── index.ts                     # API 統一入口
```

### 2.3 組件系統架構 (7層結構)
```
src/components/
├── ui/                          # 基礎 UI 組件庫 (38個)
│   ├── button/                  # 按鈕組件
│   ├── card/                    # 卡片組件
│   ├── form/                    # 表單組件
│   ├── table/                   # 表格組件
│   └── ... (34個其他 UI 組件)
├── charts/                      # 圖表系統 (3層架構)
│   ├── pure/                    # 純圖表組件 (11個)
│   ├── cards/                   # 圖表卡片包裝 (11個)
│   ├── base/                    # 基礎容器組件
│   └── common/                  # 圖表共用組件
├── data-table-*/               # 資料表格系統 (4種類型)
│   ├── data-table/              # 基礎資料表格
│   ├── data-table-async/        # 異步資料表格
│   ├── data-table-editable/     # 可編輯資料表格
│   └── data-table-common/       # 表格共用組件
├── auth/                        # 認證組件 (3個)
├── notify/                      # 通知系統 (12個組件)
├── customer/                    # 客戶管理組件 (7個)
├── order/                       # 訂單管理組件 (9個)
├── product/                     # 產品管理組件 (8個)
├── support/                     # 客服系統組件 (8個)
├── role/                        # 角色管理組件 (3個)
├── insights/                    # 洞察分析組件 (12個)
├── dashboard/                   # 儀表板組件 (1個)
├── market/                      # 市場分析組件 (2個)
└── common/                      # 共用工具組件 (2個)
```

### 2.4 頁面系統架構
```
src/views/
├── 儀表板系統 (9個)
│   ├── DashboardOverview.vue               # 總覽儀表板
│   ├── DashboardCustomer.vue               # 客戶儀表板
│   ├── DashboardOrder.vue                  # 訂單儀表板
│   ├── DashboardRevenue.vue                # 營收儀表板
│   ├── DashboardSupport.vue                # 客服儀表板
│   ├── DashboardCustomerValue.vue          # 客戶價值儀表板
│   ├── DashboardExecutiveHealth.vue        # 經營健康度儀表板
│   ├── DashboardOperationalExcellence.vue  # 營運效率儀表板
│   └── DashboardRiskCenter.vue             # 風險預警儀表板
├── 專業分析頁面 (5個) - **新增模組**
│   ├── CustomerAnalyticsView.vue   # 客戶 RFM 分析
│   ├── OrderAnalyticsView.vue      # 訂單趨勢分析
│   ├── ProductAnalyticsView.vue    # 產品 ABC 分析
│   ├── ProductAnalyticsTestView.vue # 產品分析測試
│   └── SupportAnalyticsView.vue    # 客服效能分析
├── 業務管理頁面 (14個)
│   ├── CustomersView.vue + CustomerDetailView.vue
│   ├── OrdersView.vue + OrderDetailView.vue
│   ├── ProductsView.vue + ProductDetailView.vue
│   ├── InventoriesView.vue + InventoryDetailView.vue
│   ├── CategoryView.vue
│   ├── CampaignView.vue            # **新增** - 行銷活動管理
│   ├── SupportView.vue + SupportTicketsView.vue + SupportManageView.vue
│   └── HomeView.vue                # 主頁
├── 系統管理頁面 (4個)
│   ├── RolesView.vue
│   ├── RoleUsersView.vue
│   ├── RolePermissionsView.vue
│   └── SettingsView.vue          # 系統設定
├── 通知系統頁面 (3個)
│   ├── NotificationView.vue        # 通知列表
│   ├── NotificationAddView.vue     # 發送通知
│   └── NotificationManageView.vue  # 通知管理
└── 系統頁面 (5個)
    ├── 404.vue                   # 404 錯誤頁面
    ├── UnauthorizedView.vue      # 未授權頁面
    ├── LoginView.vue             # 登入頁面
    ├── RegisterView.vue          # 註冊頁面
    └── ForgotPassword.vue        # 忘記密碼
```

## 3. 技術選型與版本

### 3.1 核心技術棧
| 技術領域 | 技術選型 | 版本 | 用途 |
|----------|----------|------|------|
| **前端框架** | Vue 3 | 3.5.13 | 響應式 SPA 框架 |
| **構建工具** | Vite | 6.3.1 | 現代化構建工具 |
| **語言** | TypeScript | 5.8.3 | 型別安全開發 |
| **路由** | Vue Router | 4.5.1 | 單頁面路由管理 |
| **狀態管理** | Pinia | 3.0.2 | 現代狀態管理 |
| **UI 框架** | Reka UI | 2.3.2 | 現代組件庫 |
| **樣式** | Tailwind CSS | 4.1.4 | 原子化 CSS 框架 |

### 3.2 專業功能庫
| 功能領域 | 技術選型 | 版本 | 用途 |
|----------|----------|------|------|
| **圖表視覺化** | @unovis/vue | 1.5.2 | 專業圖表庫 |
| **資料查詢** | @tanstack/vue-query | 5.74.6 | 伺服器狀態管理 |
| **表格** | @tanstack/vue-table | 8.21.3 | 高效能資料表格 |
| **表單驗證** | vee-validate + zod | 4.15.0 + 3.24.3 | 型別安全表單驗證 |
| **後端服務** | @supabase/supabase-js | 2.49.4 | PostgreSQL + 即時 + Auth + JSONB |
| **國際化** | vue-i18n | 11.1.9 | 多語言支援 |
| **工具庫** | @vueuse/core | 13.5.0 | Vue 組合式工具 |
| **通知** | vue-sonner | 2.0.1 | Toast 通知系統 |

### 3.3 開發工具鏈
| 工具類型 | 技術選型 | 版本 | 用途 |
|----------|----------|------|------|
| **測試框架** | Vitest | 3.1.2 | 單元測試 |
| **E2E 測試** | Playwright | 1.54.1 | 端到端測試 |
| **代碼檢查** | ESLint | 9.25.1 | 代碼品質檢查 |
| **代碼格式** | Prettier | 3.5.3 | 代碼格式化 |
| **型別檢查** | vue-tsc | 2.2.10 | TypeScript 編譯檢查 |

## 4. 架構設計原則

### 4.1 分層架構原則
```
┌─────────────────────────────────────┐
│              View Layer             │
│         (Components & Views)        │
├─────────────────────────────────────┤
│           Business Layer            │
│         (Composables & Store)       │
├─────────────────────────────────────┤
│            Service Layer            │
│          (API Services)             │
├─────────────────────────────────────┤
│             Data Layer              │
│         (Supabase & Types)          │
└─────────────────────────────────────┘
```

### 4.2 模組化設計原則
- **高內聚**：相關功能組織在同一模組內
- **低耦合**：模組間依賴關係清晰
- **可測試**：每個模組都有對應測試
- **可重用**：組件設計支持多場景復用

### 4.3 Supabase 後端架構設計

#### **核心功能整合**
```
Supabase 後端服務架構
├── 🗄️ PostgreSQL 資料庫
│   ├── 完整的電商資料模型 (15+ 主要表格)
│   ├── JSONB 快照系統 (訂單歷史資料保存)
│   ├── RLS 安全政策 (Row Level Security)
│   └── 自動 API 生成 (RESTful + GraphQL)
├── 🔐 認證與權限系統  
│   ├── Super Admin 保護機制
│   ├── RBAC 角色權限控制
│   ├── 用戶會話管理
│   └── JWT Token 驗證
├── ⚡ 即時功能
│   ├── 通知系統即時推送
│   ├── 訂單狀態即時更新
│   ├── 客服對話即時同步
│   └── 系統監控資料即時顯示
└── 🛠️ 專屬管理工具
    ├── 資料庫重置與初始化
    ├── 系統健康檢查函數
    ├── 備份與驗證腳本
    └── 開發測試資料生成
```

#### **專案特色實現**

**🔒 Super Admin 保護系統**
- 防止核心管理角色被意外刪除或修改
- 自動權限分配和修復機制
- 緊急存取恢復功能
- 詳細操作：[Super Admin 指南](../database/supabase-integration.md#super-admin-保護)

**📊 JSONB 快照系統**  
- Order Items 和 Orders 表的完整歷史快照
- 35 個管理函數 + 11 個觸發器
- 自動資料同步和驗證
- 100% 快照覆蓋率保證
- 詳細操作：[JSONB 系統指南](../database/supabase-integration.md#jsonb-快照系統)

**👥 RFM 客戶分析系統**
- 自動客戶價值分群 (10+ 分群類型)
- 即時 RFM 分析計算
- 客戶生命週期追蹤
- 商業智能整合

#### **與前端整合模式**

**API 服務層整合**
```typescript
// ServiceFactory 模式統一管理
const customerService = ServiceFactory.createCustomerService()

// TanStack Query 伺服器狀態管理
const { data: customers, isLoading } = useCustomersQuery(filters)

// Supabase 即時訂閱
const channel = supabase.channel('notifications')
  .on('postgres_changes', handleRealtimeUpdate)
```

**權限系統整合**
```typescript  
// 基於 RLS 的前端權限檢查
const { hasPermission } = usePermissionStore()
if (hasPermission('customer.edit')) {
  // 顯示編輯功能
}

// 動態路由權限控制
router.beforeEach((to) => {
  if (to.meta.permission && !hasPermission(to.meta.permission)) {
    return '/unauthorized'
  }
})
```

**狀態管理整合**
```typescript
// Pinia + Supabase Auth 整合
export const useAuthStore = defineStore('auth', () => {
  const { data: { user } } = await supabase.auth.getUser()
  const permissions = await supabase.rpc('get_user_permissions')
  
  return { user, permissions, signOut, hasPermission }
})
```

#### **運維與監控**
- **系統健康檢查**：內建健康檢查函數
- **效能監控**：JSONB 索引和查詢效能追蹤  
- **安全稽核**：權限變更日誌和存取記錄
- **備份策略**：自動備份 + 手動配置備份
- **故障恢復**：完整的災難恢復機制

> 詳細的 Supabase 操作指南和管理文檔位於 `supabase/docs/` 目錄

### 4.4 組件設計模式

#### 4.4.1 圖表系統三層架構
```
Pure Charts (純圖表)  →  Chart Cards (包裝)  →  Usage (使用)
     ↓                        ↓                    ↓
只負責視覺化              標題、圖例、樣式        業務邏輯整合
```

#### 4.3.2 資料表格系統
```
Base Table  →  Async Table  →  Editable Table  →  Business Table
    ↓             ↓              ↓                ↓
  基礎功能      異步載入         即時編輯         業務定制
```

#### 4.3.3 服務層模式
```
BaseApiService  →  Specific Service  →  Service Factory  →  Composables
      ↓               ↓                    ↓               ↓
   基礎方法         專業化服務           統一管理         業務邏輯
```

## 5. 路由系統架構

### 5.1 路由結構設計
- **多層嵌套**：最深4層路由嵌套
- **權限控制**：基於 RBAC 的路由權限
- **動態載入**：所有路由組件懶載入
- **麵包屑**：自動生成導航麵包屑

### 5.2 權限系統整合
```typescript
// 權限檢查流程
router.beforeEach(async (to, from, next) => {
  // 1. OAuth 回調處理
  // 2. 認證狀態檢查
  // 3. Session 刷新
  // 4. 權限驗證
  // 5. 路由導航
})
```

### 5.3 路由模組劃分
| 路由模組 | 路徑前綴 | 子路由數 | 權限層級 |
|----------|----------|----------|----------|
| 認證系統 | `/login` | 2 | 無需認證 |
| 儀表板 | `/dashboard` | 5 | 基礎認證 |
| 洞察分析 | `/insights` | 4 | 基礎認證 |
| 訂單管理 | `/orders` | 2 | ORDER 權限 |
| 客戶管理 | `/customers` | 2 | CUSTOMER 權限 |
| 產品管理 | `/products` | 3 | PRODUCT 權限 |
| 庫存管理 | `/inventories` | 2 | INVENTORY 權限 |
| 客服系統 | `/support` | 3 | SUPPORT 權限 |
| 系統設定 | `/config` | 4 | SETTING 權限 |
| 通知管理 | `/notify` | 2 | 基礎認證 |

## 6. 狀態管理架構

### 6.1 Store 模組設計
```
src/store/
├── index.ts              # Pinia 實例 + 持久化插件
├── auth.ts               # 認證狀態管理
├── permission.ts         # 權限矩陣管理
└── notification.ts       # 通知狀態管理
```

### 6.2 狀態管理原則
- **模組化**：按業務域劃分 Store
- **持久化**：關鍵狀態自動持久化
- **響應式**：完全響應式狀態更新
- **類型安全**：完整的 TypeScript 支援

## 7. 組合式函數架構

### 7.1 Composables 分類
```
src/composables/
├── useAuth.ts                # 認證邏輯
├── usePermission.ts          # 權限檢查
├── useNotification.ts        # 通知管理
├── charts/                   # 圖表相關
│   └── useChartTheme.ts
├── data-table-actions/       # 資料表格操作
│   ├── useCustomerActions.ts
│   ├── useOrderActions.ts
│   └── ... (6個業務操作)
└── queries/                  # 查詢管理
    ├── useCustomerQueries.ts
    ├── useOrderQueries.ts
    └── ... (5個查詢模組)
```

### 7.2 組合式設計模式
- **單一職責**：每個 composable 負責單一功能域
- **可組合性**：支持多個 composable 組合使用
- **響應式**：基於 Vue 3 響應式系統
- **可測試性**：獨立的業務邏輯，易於測試

## 8. 測試架構

### 8.1 測試覆蓋策略
```
tests/
├── unit/                     # 單元測試
│   ├── notification-*.test.ts
│   └── test-mocks.ts
├── integration/             # 整合測試
│   ├── notification-system.test.ts
│   └── useNotification.test.ts
└── e2e/                     # E2E 測試
    └── customer-login.spec.ts
```

### 8.2 測試工具配置
- **單元測試**：Vitest + @vue/test-utils
- **覆蓋率**：Istanbul + V8 雙引擎
- **E2E 測試**：Playwright
- **模擬環境**：Happy DOM

## 9. 文檔同步更新機制

### 9.1 自動同步策略
- **即時同步**：關鍵檔案變更觸發
- **定期同步**：每週自動檢查
- **版本同步**：發布時強制更新

### 9.2 同步工具鏈
- **Git Hooks**：pre-commit + post-merge
- **NPM Scripts**：自動生成工具
- **CI/CD 整合**：文檔同步檢查

### 9.3 維護週期
- **每日**：自動同步檢查
- **每週**：架構一致性報告
- **每月**：文檔品質審查
- **每季**：架構演進規劃

## 10. 效能優化策略

### 10.1 載入效能
- **懶載入**：所有路由組件懶載入
- **代碼分割**：按路由自動分割
- **資源優化**：圖片壓縮、字體優化

### 10.2 運行效能
- **虛擬滾動**：大數據表格優化
- **防抖節流**：用戶交互優化
- **記憶化**：複雜計算結果緩存

### 10.3 開發效能
- **HMR**：快速熱重載
- **TypeScript**：開發時型別檢查
- **ESLint**：實時代碼品質檢查

## 11. 部署架構

### 11.1 構建配置
```json
{
  "build": "vite build",
  "preview": "vite preview",
  "type-check": "vue-tsc --noEmit",
  "precommit-check": "npm run format && npm run lint && npm run test:run"
}
```

### 11.2 環境配置
- **開發環境**：Vite dev server
- **測試環境**：Preview mode
- **生產環境**：靜態資源部署

### 11.3 CI/CD 準備
- **Docker 化**：容器化部署準備
- **環境變數**：配置文件管理
- **健康檢查**：應用狀態監控

---

**更新日誌**
- v2.0.0 (2025-07-22): 完整重寫架構文檔，反映實際專案結構
- v1.0.0 (初始版本): 基礎架構說明

**相關文檔**
- [組件架構說明](./component-map.md)
- [API 服務架構](./api-services.md) 
- [圖表系統架構](./CHART_ARCHITECTURE.md)
- [技術堆疊詳情](../../04-guides/project-info/vue-tech-stack.md)
