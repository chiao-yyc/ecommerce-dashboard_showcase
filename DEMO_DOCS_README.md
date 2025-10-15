# Demo Docs Branch 說明

> **這是面試展示用的精簡文件分支 (`docs-demo`)**

## 📌 分支用途

這個分支是專為**面試展示**和**快速瀏覽**而創建的精簡版文件，從原本的 270+ 文件精簡到 **36 個核心文件**，讓面試官能夠在 30-40 分鐘內了解專案的核心技術與業務實現。

## 📊 文件對比

| 項目     | Main 分支 (完整版)               | docs-demo 分支 (展示版)      |
| -------- | -------------------------------- | ---------------------------- |
| 文件數量 | 270+ 文件                        | 36 核心文件                  |
| 目錄層級 | 5 層深度                         | 3 層深度 (精簡)              |
| 涵蓋範圍 | 所有技術細節、開發筆記、歷史記錄 | 核心功能、架構設計、API 參考 |
| 閱讀時間 | 4-6 小時                         | 30-40 分鐘                   |
| 適用對象 | 開發團隊、深度技術研究           | 面試官、技術評審、快速了解   |

## 🗂️ 文件結構

```
docs/
├── index.md                    # 面試導向首頁
├── documentation-index.md      # 文件索引
├── REALTIME_FIX_SUMMARY.md    # 問題解決案例
├── 01-project/                # 專案概覽 (4 文件)
│   ├── project-overview.md
│   ├── features.md
│   ├── milestones.md
│   └── tech-stack.md
├── 02-architecture/           # 系統架構 (6 文件)
│   ├── system-architecture.md
│   ├── database-design.md
│   ├── api-design.md
│   ├── rls-security.md
│   ├── chart-architecture.md
│   └── realtime-system.md
├── 03-core-features/          # 核心功能 (15 文件)
│   ├── campaign/             # Campaign 系統
│   ├── analytics/            # Analytics 分析
│   ├── notification/         # Notification 通知
│   └── business-health/      # Business Health 監控
├── 04-api-reference/         # API 參考 (5 文件)
│   ├── supabase-reference.md
│   ├── user-api.md
│   ├── order-api.md
│   ├── product-api.md
│   └── customer-api.md
└── 05-deployment/            # 部署指南 (3 文件)
    ├── DEPLOYMENT.md
    ├── docker-guide.md
    └── environment-variables-guide.md
```

## 🎯 推薦閱讀順序

### 面試官快速瀏覽 (30 分鐘)

1. **專案概覽** (5 分鐘)

   - `index.md` - 了解專案亮點與技術棧
   - `01-project/project-overview.md` - 產品需求與目標

2. **系統架構** (10 分鐘)

   - `02-architecture/system-architecture.md` - 整體架構設計
   - `02-architecture/database-design.md` - 資料庫設計
   - `02-architecture/rls-security.md` - RLS 安全策略

3. **核心功能** (10 分鐘)

   - `03-core-features/campaign/overview.md` - Campaign 系統
   - `03-core-features/analytics/order-analytics.md` - 訂單分析
   - `03-core-features/notification/architecture.md` - 通知系統

4. **問題解決能力** (5 分鐘)
   - `REALTIME_FIX_SUMMARY.md` - Realtime 連線問題完整分析與修復

### 技術深度評估 (額外 30 分鐘)

5. **業務複雜度**

   - `03-core-features/business-health/system-design.md` - 商業健康監控系統
   - `03-core-features/campaign/type-config.md` - 活動類型配置系統

6. **API 設計**
   - `04-api-reference/supabase-reference.md` - Supabase API 整合
   - `02-architecture/api-design.md` - API 架構設計

## 🔄 如何切換分支查看

### 查看精簡版文件 (當前分支)

```bash
git checkout docs-demo
cd docs
npm run docs:dev
```

### 查看完整版文件

```bash
git checkout main
cd docs
npm run docs:dev
```

## 📝 文件精簡原則

在創建這個精簡版時，我們遵循以下原則：

1. **保留核心架構文件** - 系統架構、資料庫設計、API 設計
2. **展示業務複雜度** - Campaign、Analytics、Notification、Business Health
3. **突出技術亮點** - RLS、Realtime、TypeScript、測試策略
4. **包含問題解決案例** - Realtime 連線問題的完整分析與修復
5. **移除開發細節** - 開發筆記、歷史記錄、實驗性功能

## 💡 為什麼需要兩個版本？

### Main 分支 (完整版)

- **用途**: 開發團隊日常使用、技術深度研究
- **特點**: 包含所有技術細節、開發筆記、API 自動生成文件、歷史決策記錄
- **適合**: 團隊協作、長期維護、技術傳承

### docs-demo 分支 (展示版)

- **用途**: 面試展示、技術評審、快速了解
- **特點**: 聚焦核心功能、突出技術亮點、精簡易讀
- **適合**: 30-40 分鐘的技術面試、對外展示

## 🚀 啟動文件網站

```bash
# 安裝依賴 (首次)
cd docs
npm install

# 開發模式
npm run docs:dev

# 構建生產版本
npm run docs:build

# 預覽生產版本
npm run docs:preview
```

訪問: http://localhost:8080

## 📧 聯繫方式

如有問題或建議，請聯繫專案維護者。

---

> **Note**: 這個分支會定期從 main 分支同步核心文件的更新，但保持精簡的結構。
