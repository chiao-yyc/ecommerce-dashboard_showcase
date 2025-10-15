# 技術棧說明

> 本專案採用 Vue 3 生態系統，整合 Supabase 作為 BaaS 平台，實現企業級電商後台管理系統。

---

## 前端核心

| 技術 | 版本 | 用途 |
|------|------|------|
| **Vue** | 3.5+ | Composition API、SFC、響應式系統 |
| **TypeScript** | 5.x | 嚴格模式類型檢查、類型安全 |
| **Vite** | 6.0 | 開發伺服器、HMR、生產建置優化 |
| **Vue Router** | 4.x | SPA 路由管理、導航守衛 |
| **Pinia** | 最新 | 狀態管理、模組化 Store |

**技術特色**:
- Composition API 模式提供更好的邏輯復用
- TypeScript 嚴格模式確保型別安全
- Vite 快速 HMR 提升開發效率

---

## UI/UX

| 技術 | 版本 | 用途 |
|------|------|------|
| **Tailwind CSS** | 3.x | 原子化 CSS、響應式設計 |
| **Radix Vue** | 最新 | Headless UI 組件庫（無樣式組件） |
| **Lucide Icons** | 最新 | 圖標系統 |
| **Unovis** | 最新 | 響應式資料視覺化圖表庫 |

**設計特色**:
- Headless UI 架構提供完全的樣式控制
- Tailwind CSS 實現響應式設計與深色模式
- Unovis 提供專業級圖表組件（20+ 圖表類型）

---

## 後端整合

| 技術 | 版本 | 用途 |
|------|------|------|
| **Supabase** | 最新 | BaaS 平台（Database + Auth + Realtime + Storage） |
| **PostgreSQL** | 14+ | 關聯式資料庫、JSONB 支援 |
| **Supabase Auth** | 最新 | JWT 認證、角色權限管理 |
| **Supabase Realtime** | 最新 | WebSocket 即時推送、資料庫訂閱 |
| **Edge Functions** | Deno | 無伺服器函數、TypeScript 支援 |

**技術特色**:
- PostgreSQL RLS (Row Level Security) 提供資料庫層級安全控制
- Realtime 訂閱實現即時資料更新
- Edge Functions 保護商業邏輯於伺服器端

---

## 狀態管理與資料層

| 技術 | 用途 |
|------|------|
| **Pinia** | Vue 3 狀態管理、模組化 Store |
| **Vue Query** | 伺服器狀態管理、智能快取策略 |
| **ServiceFactory** | 自訂依賴注入模式、API 服務層管理 |

**架構特色**:
- **Pinia** 管理本地 UI 狀態（主題、偏好設定）
- **Vue Query** 管理伺服器狀態（API 資料、快取、樂觀更新）
- **ServiceFactory** 提供鬆耦合的 API 服務層（8 個業務服務）

---

## 開發工具鏈

| 工具 | 用途 |
|------|------|
| **Vitest** | 單元測試框架（471 測試全部通過） |
| **Vue Test Utils** | Vue 組件測試工具 |
| **Testing Library** | 用戶行為測試工具 |
| **ESLint** | 程式碼品質檢查 |
| **Prettier** | 程式碼格式化 |
| **Husky** | Git pre-commit hooks |
| **Vue TSC** | TypeScript 類型檢查 |

**品質保證**:
- 測試覆蓋率: 85%+
- TypeScript 嚴格模式: 100% 覆蓋
- ESLint 零錯誤政策

---

## 資料視覺化

| 技術 | 用途 |
|------|------|
| **Unovis** | 專業級圖表庫（折線、柱狀、圓餅、散點、雷達等） |
| **D3.js** | Unovis 底層依賴、SVG 操作 |
| **響應式設計** | 自動適配不同螢幕尺寸 |

**圖表系統特色**:
- 20+ 圖表組件
- 3 層架構設計（Pure → Business → View）
- 完整的 TypeScript 類型定義

---

## DevOps 與部署

| 工具 | 用途 |
|------|------|
| **Docker** | 容器化開發環境 |
| **Docker Compose** | 多容器服務編排 |
| **Supabase CLI** | 資料庫管理、Migration |
| **Shell Scripts** | 自動化工具（health-check.sh, prod.sh） |

**DevOps 特色**:
- 本地開發環境完全容器化
- Migration 管理自動化（195 個 migration 檔案）
- 健康檢查與監控腳本

---

## 核心架構模式

### 1. ServiceFactory 依賴注入模式
```typescript
// 鬆耦合的 API 服務層
ServiceFactory
  ├── UserApiService
  ├── OrderApiService
  ├── ProductApiService
  ├── CustomerApiService
  ├── NotificationApiService
  ├── CampaignApiService
  ├── SupportTicketApiService
  └── DashboardApiService
```

**設計優勢**:
- 鬆耦合架構，避免直接依賴 Supabase 實例
- 完整的單元測試支援（Mock 注入）
- 環境隔離（開發/測試/生產）

### 2. 三層組件架構
```
View Layer (頁面組件)
  ↓ 使用
Component Layer (業務/UI組件)
  ↓ 使用
Composable Layer (業務邏輯)
  ↓ 使用
Service Layer (ServiceFactory)
```

**設計優勢**:
- 清晰的職責分離
- 高度可重用的邏輯層
- 易於測試和維護

### 3. Vue Query 快取策略
```typescript
// 階層式快取管理
- 全域快取配置 (queryClient.ts)
- 業務查詢封裝 (composables/queries/)
- 樂觀更新與錯誤處理
```

**設計優勢**:
- 自動化的伺服器狀態同步
- 智能快取與背景更新
- 樂觀更新提升用戶體驗

---

## 技術決策理由

### 為什麼選擇 Vue 3?
- **Composition API**: 更好的邏輯復用與程式碼組織
- **TypeScript 支援**: 完整的型別推導與檢查
- **生態系統成熟**: Pinia、Vue Router、VueUse 等官方工具鏈
- **效能優勢**: Virtual DOM 優化、Tree-shaking 支援

### 為什麼選擇 Supabase?
- **開發效率**: 開箱即用的 Auth、Database、Realtime、Storage
- **PostgreSQL**: 企業級資料庫，支援複雜查詢與 JSONB
- **RLS 安全策略**: 資料庫層級的行級權限控制
- **Edge Functions**: Deno runtime，原生 TypeScript 支援
- **即時通訊**: WebSocket 推送，無需額外基礎設施

### 為什麼選擇 Unovis?
- **專業級圖表**: 豐富的圖表類型與高度客製化
- **TypeScript 優先**: 完整的類型定義
- **響應式設計**: 自動適配不同螢幕尺寸
- **效能優勢**: SVG 渲染，支援大數據集

---

## 技術棧對照表

| 功能需求 | 技術選擇 | 替代方案 |
|---------|---------|---------|
| UI 框架 | Vue 3 | React, Svelte |
| 狀態管理 | Pinia + Vue Query | Vuex, Redux |
| UI 組件 | Radix Vue + Tailwind | Ant Design Vue, Element Plus |
| 圖表庫 | Unovis | ECharts, Chart.js |
| BaaS 平台 | Supabase | Firebase, AWS Amplify |
| 測試框架 | Vitest | Jest, Mocha |
| 建置工具 | Vite | Webpack, Rollup |

---

## 相關文件

- **架構設計**: [系統架構設計](../02-architecture/system-architecture.md)
- **ServiceFactory**: [API 服務層](../02-architecture/api-design.md)
- **圖表系統**: [圖表架構](../02-architecture/chart-architecture.md)
- **Realtime 系統**: [即時通訊架構](../02-architecture/realtime-system.md)

---

**最後更新**: 2025-10-15
**專案狀態**: 🟢 技術棧穩定，持續優化中
