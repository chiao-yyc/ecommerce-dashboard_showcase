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
| 超級管理員 | admin@demo.com | demo1234 | 完整系統權限、角色管理 |
| 業務經理 | manager@demo.com | demo1234 | 訂單管理、客戶分析 |
| 客服人員 | support@demo.com | demo1234 | 工單系統、通知中心 |

> 建議先用超級管理員帳號體驗完整功能，再切換其他角色查看權限控制效果

---

## ✨ 核心特色

### 技術亮點

- **ServiceFactory 依賴注入模式** - 鬆耦合架構設計，支援測試與環境隔離
- **智能通知系統** - PostgreSQL 觸發器 + Realtime 推送 + 智能建議邏輯
- **活動分層歸因分析** - 多觸點歸因權重計算，三層歸因分類（primary/secondary/tertiary）
- **RFM 客戶分群** - 基於 Recency、Frequency、Monetary 的客戶價值評估
- **即時資料訂閱** - Supabase Realtime 整合，訂單/庫存/通知即時更新
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

### 挑戰 1: 通知系統從零功能到 100% 恢復

**問題背景**:
專案繼承時發現通知系統前端完整但後端觸發器完全失效，產品和客戶通知無法觸發，影響核心業務流程。

**根因分析**:
1. 觸發器綁定到 mock 表而非實際業務表
2. 產品/客戶通知路由規則缺失
3. 通知模板實體類型約束錯誤
4. 缺少系統模板保護機制

**解決方案**（4 階段修復）:

1. **Phase 1: 重寫觸發器架構**
   - 將觸發器從 mock 表綁定到實際業務表（orders、products、customers）
   - 實作基於路由規則的通知自動插入邏輯
   - 整合智能建議邏輯：訂單狀態變更自動觸發相關通知完成建議

2. **Phase 2: 補齊路由規則**
   - 新增 7 種通知類型的角色映射規則
   - 確保不同角色看到對應的通知

3. **Phase 3: 修正模板實體類型約束**
   - 更新通知模板的 `required_entity_type` 欄位
   - 修正 product/customer/inventory 通知的實體類型

4. **Phase 4: 建立系統模板保護機制**
   - 標記 8 個核心模板為 `is_system_required`
   - 實作多層觸發器防止意外刪除或停用
   - 添加 RLS 政策限制修改權限

**查看完整實作**: `supabase/migrations/20250731170000_fix_notification_triggers_for_real_tables.sql`

**修復成果**:
- 訂單通知: 0% → 100%
- 產品通知: 0% → 100%
- 客戶通知: 0% → 100%
- 建議系統: 完整的智能完成建議邏輯
- 系統保護: 8 個核心模板受到多層保護

**相關文件**: [通知系統概述](./docs/04-guides/dev-notes/NOTIFICATION_SYSTEM_OVERVIEW.md)

---

### 挑戰 2: Router Session 效能最佳化

**問題背景**:
初始化時 `useRouterSession` 的 `computeRecentRoutes()` 計算耗時 3 秒，導致首頁載入緩慢。

**效能瓶頸分析**:

```typescript
//問題程式碼：每次都重新計算整個 sessionStorage
watch(
  () => router.currentRoute.value,
  () => {
    computeRecentRoutes()  // 3 秒耗時操作
  },
  { immediate: true }
)
```

**根因識別**:
1. **immediate: true** 導致組件掛載時立即執行
2. **sessionStorage 遍歷** - 500+ 條路由記錄完整遍歷
3. **重複計算** - 未使用快取，每次路由變更重新計算
4. **同步阻塞** - 計算過程阻塞主執行緒

**最佳化方案**:

```typescript
// ✅ 最佳化後：懶載入 + 快取策略
const recentRoutes = ref<RouteRecord[]>([])
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000  // 5 分鐘快取

function computeRecentRoutes() {
  // 快取檢查
  if (Date.now() - cacheTimestamp < CACHE_DURATION) {
    return recentRoutes.value
  }

  // 非同步計算
  requestIdleCallback(() => {
    const routes = parseSessionStorage()
    recentRoutes.value = routes.slice(0, 10)  // 只取前 10 筆
    cacheTimestamp = Date.now()
  })
}

// 移除 immediate: true，改為需要時才計算
watch(
  () => router.currentRoute.value,
  computeRecentRoutes
)
```

**最佳化成果**:
- 初始化時間: **3 秒 → 500ms** (83% 改善)
- 首頁 FCP: **4.2 秒 → 1.8 秒** (57% 改善)
- 記憶體使用: **降低 40%** (快取機制)
-使用者體驗: 明顯改善頁面響應速度

**相關文件**: [Router Session 效能最佳化詳解](./docs/04-guides/dev-notes/ROUTER_SESSION_PERFORMANCE_OPTIMIZATION.md)

---

### 挑戰 3: ServiceFactory 依賴注入架構設計

**設計目標**:
建立一個鬆耦合、可測試、支援多環境設定的 API 服務層架構。

**架構挑戰**:
1. 如何避免直接依賴 Supabase 實例？
2. 如何支援單元測試的 Mock 注入？
3. 如何管理服務實例生命週期？
4. 如何確保類型安全？

**解決方案** - ServiceFactory Pattern:

**核心設計**:
1. **依賴注入** - 透過建構子注入 SupabaseClient，而非直接導入全域實例
2. **單例管理** - 使用 Map 快取服務實例，避免重複建立
3. **類型安全** - 使用 `import type` 策略，確保無執行時依賴
4. **環境隔離** - 支援開發/測試/生產環境獨立設定
5. **Mock 注入** - 測試時可輕鬆注入 Mock Supabase Client

**架構流程**:
```
@/lib/supabase.ts (設定實例)
  ↓
services/index.ts (建立 defaultServiceFactory)
  ↓
ServiceFactory (管理 8 個服務實例)
  ↓
UserService / OrderService / NotificationService ...
```

**設計優勢**:
- ✅ 鬆耦合架構，服務層與實例化邏輯分離
- ✅ 可測試性高，輕鬆注入 Mock 進行單元測試
- ✅ 環境彈性，支援多環境設定切換
- ✅ 類型安全，避免執行時依賴問題

**查看完整實作**: `admin-platform-vue/src/api/services/ServiceFactory.ts`
**相關文件**: [ServiceFactory 架構設計詳解](./docs/04-guides/dev-notes/SERVICE_FACTORY_ARCHITECTURE.md)

---

## 🎯 核心功能模組

### 1. ServiceFactory 依賴注入架構

企業級 API 服務層設計，實作鬆耦合、可測試、環境隔離的服務管理。

**核心特性**:
- 依賴注入模式避免直接耦合 Supabase 實例
- 單例模式統一管理服務實例生命週期
- `import type` 策略確保類型安全且無執行時依賴
- 支援多環境設定（開發/測試/生產）
- 完整的單元測試支援（Mock 注入）

**架構層級**:
```
ServiceFactory
  ├── UserApiService (用戶管理)
  ├── OrderApiService (訂單管理)
  ├── ProductApiService (產品管理)
  ├── CustomerApiService (客戶管理)
  ├── NotificationApiService (通知管理)
  ├── CampaignApiService (活動分析)
  ├── SupportTicketApiService (工單系統)
  └── DashboardApiService (儀表板)
```

**詳細說明**: 參考「解決的技術挑戰 → 挑戰 3」章節完整展示

---

### 2. 智能通知系統

基於 PostgreSQL 觸發器和 Supabase Realtime 的企業級通知解決方案。

**系統架構**:
- **後端層**: PostgreSQL 觸發器自動捕獲業務事件
- **邏輯層**: 智能建議函數判斷通知完成時機
- **傳輸層**: Supabase Realtime 即時推送
- **前端層**: Vue 3 Composition API 響應式更新

**核心功能**:
- 自動通知觸發（訂單、產品、客戶、庫存）
- 智能完成建議系統（基於業務邏輯判斷）
- 角色群組路由（不同角色看到不同通知）
- 系統模板保護機制（8 個核心模板多層保護）
- 通知模板管理（支援變數插值）

**技術特色**:
- PostgreSQL 觸發器自動捕獲業務事件
- 智能建議函數判斷通知完成時機
- Supabase Realtime 即時推送
- Vue 3 Composition API 響應式更新

**詳細說明**: 參考「解決的技術挑戰 → 挑戰 1」章節完整展示
**相關文件**: [通知系統概述](./docs/04-guides/dev-notes/NOTIFICATION_SYSTEM_OVERVIEW.md)

---

### 3. 活動分層歸因分析

多觸點歸因權重計算系統，支援三層歸因分類和協作分析。

**分析維度**:
1. **總覽分析** - 活動效果統計與分層效果
2. **歸因分析** - 多維度歸因權重分析
3. **協作分析** - 活動間協作效果評估
4. **重疊分析** - 活動期間重疊情況與競爭強度
5. **趨勢分析** - 活動效果趨勢與績效評估
6. **規則管理** - 歸因規則設定與管理

**歸因邏輯**（核心概念）:

1. **活動分層分類**
   - site-wide（全站活動）：seasonal、holiday、flash_sale
   - target-oriented（目標導向）：membership、demographic
   - category-specific（類別專屬）：category、product_launch

2. **權重正規化計算**
   - 層級內權重正規化：`normalized_weight = raw_weight / SUM(raw_weight) OVER (PARTITION BY attribution_layer)`
   - 確保同層活動權重總和為 1

3. **營收歸因分配**
   - 按正規化權重分配營收：`attributed_revenue = total_amount * normalized_weight`
   - 支援多觸點歸因分析

**技術實作**:
- PostgreSQL 視圖封裝複雜 JOIN 邏輯
- CampaignApiService 提供統一查詢介面
- Vue Query 實作智能快取策略
- Unovis 圖表庫視覺化呈現

**查看完整實作**: `supabase/migrations/20250723200000_layered_attribution_implementation.sql`
**相關文件**: [活動分析系統架構](./docs/02-development/architecture/campaign-system.md)

---

### 4. 客戶 RFM 分群分析

基於 Recency、Frequency、Monetary 模型的客戶價值評估系統。

**RFM 模型**:
- **Recency (最近購買)** - 最後一次購買距今天數
- **Frequency (購買頻率)** - 歷史購買次數
- **Monetary (購買金額)** - 累計消費金額

**客戶分群**:
- 💎 VIP 客戶 - R: 高, F: 高, M: 高
- ⭐ 忠誠客戶 - R: 中, F: 高, M: 中
- 🎯 潛力客戶 - R: 高, F: 低, M: 中
- ⚠️ 流失風險 - R: 低, F: 低, M: 低

**分析功能**:
- RFM 分群標籤視覺化
- 客戶行為追蹤圖表
- 流失風險預警系統
- 客戶價值散點圖

**計算邏輯**（核心概念）:
- **Recency 評分**: 最後購買距今天數 → 評分 0-10（越近越高）
- **Frequency 評分**: 歷史購買次數 → 評分 0-10（越多越高）
- **Monetary 評分**: 累計消費金額 → 評分 0-10（越高越高）
- **分群分類**: 基於 RFM 三維度分數組合，自動分類為 VIP/忠誠/潛力/流失風險

---

### 5. 即時資料訂閱系統

基於 Supabase Realtime 的多模組即時更新架構。

**監控模組**:
- **Notifications** - 即時通知推送（權重 1.5）
- **Orders** - 訂單狀態更新（權重 2.0，最高優先）
- **Inventory** - 庫存數量變動（權重 1.2）

**錯誤追蹤與警報**:
- 5 分鐘內超過 3 次錯誤自動觸發警報
- 根據錯誤頻率調整嚴重程度（low/medium/high/critical）
- 統一的 `useRealtimeAlerts` composable 管理跨模組警報

**系統穩定度計算**:
- 基於多模組權重計算系統健康度（0-10 分）
- 訂單系統權重最高（2.0），通知次之（1.5），庫存適中（1.2）
- 整合至業務健康度雷達圖作為第 7 維度

**技術優勢**:
- 統一的錯誤追蹤機制
- 時間窗口過濾（5 分鐘內錯誤計數）
- 權重分級系統（訂單 > 通知 > 庫存）
- 自動備援模式（連線失敗時啟動輪詢）

---

## 🗄️ 資料庫與後端

### 資料庫設計亮點

**技術成果**:
- **195 個 Migration 檔案** - 完整的資料庫演進追蹤
- **14 個 Edge Functions** - 伺服器端商業邏輯保護
- **RLS 安全策略** - 行級權限控制
- **PostgreSQL 觸發器** - 自動化業務流程

### 代表性實作

#### 1. 活動分層歸因分析視圖

**檔案**: `supabase/migrations/20250723200000_layered_attribution_implementation.sql`

**功能**:
- 多觸點歸因權重計算
- 三層歸因分類（site-wide/target-oriented/category-specific）
- 複雜 JOIN 邏輯封裝為視圖

**技術亮點**: 詳見「核心功能模組 → 3. 活動分層歸因分析」章節（Lines 300-362）完整展示

---

#### 2. 通知系統 PostgreSQL 觸發器

**檔案**: `supabase/migrations/20250731170000_fix_notification_triggers_for_real_tables.sql`

**功能**:
- 訂單狀態變更自動觸發通知
- 智能建議邏輯整合
- 8 個系統模板多層保護機制

**觸發器範例**: 詳見「解決的技術挑戰 → 挑戰 1」章節（Lines 190-227）完整展示

---

#### 3. RLS 安全策略設計

**檔案**: `supabase/migrations/20251002300000_add_rls_to_analytics_tables.sql`

**功能**:
- 分析資料表的行級權限控制
- SECURITY DEFINER 函數最佳化效能
- 用戶隱私保護機制

**RLS 範例**:
```sql
-- 啟用 RLS
ALTER TABLE campaign_effectiveness_metrics ENABLE ROW LEVEL SECURITY;

-- 管理員可查看所有資料
CREATE POLICY "Admins can view all campaigns"
ON campaign_effectiveness_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_name = 'admin'
  )
);

-- 業務經理只能查看自己負責的活動
CREATE POLICY "Managers can view own campaigns"
ON campaign_effectiveness_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_managers
    WHERE campaign_managers.campaign_id = campaign_effectiveness_metrics.id
    AND campaign_managers.user_id = auth.uid()
  )
);
```

---

### Edge Functions - 業務健康度計算引擎

**檔案**: `supabase/functions/business-health-analytics/index.ts`

**功能概述**: 850 行 TypeScript 實作 7 維度業務健康度評分系統

**核心算法框架**:

```typescript
// 業務健康度指標定義
interface BusinessHealthMetrics {
  revenue: number          // 營收健康度 (0-10)
  satisfaction: number     // 客戶滿意度 (0-10)
  fulfillment: number      // 履行健康度 (0-10)
  support: number          // 支援健康度 (0-10)
  products: number         // 產品健康度 (0-10)
  marketing: number        // 行銷健康度 (0-10)
  system: number           // 系統穩定度 (0-10)
}

// 核心計算引擎（伺服器端保護商業邏輯）
async function calculateBusinessHealthMetrics(
  supabase: SupabaseClient,
  period: '7d' | '30d' | '90d'
): Promise<BusinessHealthMetrics> {
  // 🔐 7 個核心評分算法在此實作
  // 避免前端暴露商業規則

  const revenue = await calculateRevenueHealth(supabase, period)
  const satisfaction = await calculateSatisfactionHealth(supabase, period)
  // ... 其他維度計算

  return { revenue, satisfaction, fulfillment, support, products, marketing, system }
}
```

**技術優勢**:
-商業邏輯伺服器端保護
-大量資料查詢在資料庫端完成
-Service Role Key 存取敏感資料
-支援多時間週期分析（7 天/30 天/90 天）

**查看完整實作**: [supabase/functions/business-health-analytics/](./supabase/functions/business-health-analytics/)

---

## 🛠️ 開發環境與工具鏈

> **📌 說明**：此為展示專案，以下內容展示完整系統的開發工具鏈設計與工作流程。

### 工具鏈架構

**前端工具鏈**:
- **Vite** - 開發伺服器與生產建置
- **TypeScript** - 嚴格模式類型檢查
- **Vitest** - 測試套件 (471 測試全部通過)
- **ESLint** - 程式碼品質檢查
- **Husky** - Git pre-commit hooks

**後端工具鏈**:
- **Docker Desktop** - 容器化開發環境
- **Supabase CLI** - 資料庫管理與 Migration
- **PostgreSQL** - 資料庫引擎
- **Edge Functions** - 無伺服器函數執行環境

### 開發流程設計

```
本地開發
  ↓ Supabase CLI (Migration 管理)
版本控制
  ↓ Git commit + Husky hooks
自動化測試
  ↓ Vitest (471 測試全部通過)
類型檢查
  ↓ TypeScript strict mode
生產建置
  ↓ Vite build + 優化
```

### DevOps 自動化

- **健康檢查**: `scripts/health-check.sh` (167 行) - Docker 環境驗證、服務狀態檢測
- **環境管理**: `scripts/prod.sh` (175 行) - 一鍵啟動/停止/重啟服務
- **CI/CD 整合**: Husky pre-commit hooks - 自動化測試與程式碼品質檢查

**相關章節**: 詳見「🔧 DevOps 自動化工具」章節完整展示

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

## 🔧 DevOps 自動化工具

### 1. 系統健康檢查工具

**檔案**: `scripts/health-check.sh`（167 行）

**功能**:
- 自動檢測 Docker 環境
- Supabase 服務狀態驗證
- 資料庫連線測試
- Realtime 訂閱測試
- 彩色輸出與診斷提示

**使用範例**:
```bash
./scripts/health-check.sh

# 輸出範例
系統健康檢查開始...
Docker 環境正常
Supabase 服務運行中（5/5 容器健康）
PostgreSQL 連線正常（延遲: 12ms）
Realtime 訂閱正常
系統健康檢查通過！
```

---

### 2. 生產環境管理工具

**檔案**: `scripts/prod.sh`（175 行）

**功能**:
- 一鍵啟動/停止/重啟服務
- Docker Compose 整合
- 環境變數驗證
- 日誌查看與除錯
- 內建健康檢查整合

**使用範例**:
```bash
# 啟動生產環境
./scripts/prod.sh start

# 重新建置並啟動
./scripts/prod.sh rebuild

# 查看服務日誌
./scripts/prod.sh logs

# 系統健康檢查
./scripts/prod.sh health
```

---

### 3. Supabase CLI 工作流程

**本地開發環境管理**:

```bash
# 1. 啟動完整 Supabase 本地環境
supabase start
# 啟動服務: PostgreSQL, Auth, Storage, Realtime, Edge Functions

# 2. 資料庫重置與種子資料載入
supabase db reset
# 執行所有 migrations + seed-core.sql

# 3. Migration 管理
supabase migration new add_feature_x
supabase db diff > migrations/new_changes.sql

# 4. 部署到生產環境
supabase db push --db-url="postgresql://..."
```

**DevOps 流程設計**:

```
本地開發
  ↓ Supabase CLI
開發測試
  ↓ migration 管理
版本控制
  ↓ Git commit
CI/CD 觸發
  ↓ 自動化測試
生產部署
  ↓ health-check.sh 驗證
監控告警
```

---

### 4. 自動化工具總結

| 工具 | 功能 | 行數 | 技術亮點 |
|------|------|------|----------|
| **health-check.sh** | 系統健康檢查 | 167 行 | 環境區分、彩色輸出、診斷提示 |
| **prod.sh** | 生產環境管理 | 175 行 | 錯誤處理、自動化部署、健康檢查 |
| **Supabase CLI** | 資料庫管理 | - | Migration 管理、本地開發環境 |

**DevOps 能力展示**:

- **自動化思維** - Shell 腳本簡化重複性操作
- **環境隔離** - 開發/測試/生產環境完整分離
- **錯誤處理** - 完整的異常捕獲和使用者提示
- **可維護性** - 清晰的註解和模組化設計
- **使用者體驗** - 彩色輸出和友好的診斷資訊

---

## 📚 文件架構

本專案採用 **VitePress 三層文件架構**，確保文件組織清晰、易於維護。

### 文件分層策略

```
docs/                              # 全專案文件（系統架構、API 規格）
├── 01-planning/                   # 規劃階段文件
├── 02-development/                # 開發階段文件
│   ├── architecture/              # 架構設計文件
│   └── api/                       # API 規格文件
├── 03-deployment/                 # 部署相關文件
├── 04-guides/                     # 指南與教程
│   └── dev-notes/                 # 開發筆記
└── 05-reference/                  # 參考資料

admin-platform-vue/docs/           # 前端專屬文件
├── 01-getting-started/            # 前端快速開始
├── 02-components/                 # 組件庫文件
├── 03-composables/                # Composables 使用指南
└── 04-guides/                     # 前端開發指南

supabase/docs/                     # 後端專屬文件
├── 01-getting-started/            # Supabase 本地開發
├── 02-database/                   # 資料庫設計文件
│   ├── migrations/                # Migration 管理策略
│   └── triggers/                  # 觸發器文件
└── 03-edge-functions/             # Edge Functions 開發指南
```

### 核心文件清單

| 文件 | 路徑 | 說明 |
|------|------|------|
| 通知系統概述 | `docs/04-guides/dev-notes/` | 通知系統完整架構與快速開始 |
| ServiceFactory 架構 | `docs/04-guides/dev-notes/` | 依賴注入模式設計詳解 |
| 活動分析系統 | `docs/02-development/architecture/` | 分層歸因機制架構文件 |
| Migration 策略 | `supabase/docs/02-database/migrations/` | 資料庫演進管理最佳實踐 |
| 本地開發指南 | `supabase/docs/01-getting-started/` | Supabase CLI 完整使用指南 |

**文件設計原則**:
- **現況優先** - 文件反映實際程式碼實作
- **單一真實來源** - 每類資訊只在一處維護
- **分層引用** - 高層文件引用低層文件

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
| **文件** | 261 個檔案 | ~80,000 行 | 完整技術文件 |

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

