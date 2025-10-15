# 快速導航

> 精簡版文件導航 - 面試展示用的核心文件索引

## 文件結構總覽

本文件站點包含 **40 個核心文件**，分為 5 大分類，涵蓋專案概覽、系統架構、核心功能、API 參考和部署指南。

---

## 01. 專案概覽

了解專案背景、功能特性、技術選型和開發規劃。

| 文件                                      | 說明                         |
| ----------------------------------------- | ---------------------------- |
| [專案概覽](./01-project/project-overview) | 產品需求、專案目標、範圍定義 |
| [功能特性](./01-project/features)         | 完整功能列表與規格說明       |
| [開發里程碑](./01-project/milestones)     | 專案時程規劃與進度追蹤       |
| [技術棧](./01-project/tech-stack)         | 前端、後端、工具鏈技術選型   |

---

## 02. 系統架構

深入了解系統設計、資料庫架構、API 設計和安全策略。

| 文件                                                  | 說明                             |
| ----------------------------------------------------- | -------------------------------- |
| [系統架構設計](./02-architecture/system-architecture) | 整體架構、分層設計、技術選型理由 |
| [資料庫設計](./02-architecture/database-design)       | PostgreSQL schema 設計與優化     |
| [API 設計](./02-architecture/api-design)              | RESTful API 架構與規範           |
| [RLS 安全策略](./02-architecture/rls-security)        | Row Level Security 實作細節      |
| [圖表架構](./02-architecture/chart-architecture)      | 資料視覺化系統設計               |
| [Realtime 系統](./02-architecture/realtime-system)    | WebSocket 即時通訊架構           |

---

## 03. 核心功能

四大業務系統的詳細功能說明與開發指南。

### Campaign 行銷活動系統

| 文件                                                | 說明                        |
| --------------------------------------------------- | --------------------------- |
| [系統概覽](./03-core-features/campaign/overview)    | Campaign 系統介紹與核心功能 |
| [使用手冊](./03-core-features/campaign/user-manual) | 活動管理操作指南            |
| [類型配置](./03-core-features/campaign/type-config) | 活動類型與歸因層級配置      |
| [API 文件](./03-core-features/campaign/api)         | Campaign API 介面說明       |

### Analytics 分析系統

| 文件                                                        | 說明                   |
| ----------------------------------------------------------- | ---------------------- |
| [服務概覽](./03-core-features/analytics/services-overview)  | 四大分析模組介紹       |
| [訂單分析](./03-core-features/analytics/order-analytics)    | 訂單漏斗分析與趨勢預測 |
| [客戶分析](./03-core-features/analytics/customer-analytics) | RFM 分群與客戶價值評估 |
| [客服分析](./03-core-features/analytics/support-analytics)  | 工單統計與滿意度追蹤   |

### Notification 通知系統

| 文件                                                          | 說明                        |
| ------------------------------------------------------------- | --------------------------- |
| [系統概覽](./03-core-features/notification/overview)          | 通知系統介紹與架構          |
| [架構設計](./03-core-features/notification/architecture)      | 觸發器、模板、Realtime 整合 |
| [開發指南](./03-core-features/notification/development-guide) | 通知開發實作指南            |
| [API 文件](./03-core-features/notification/api)               | Notification API 介面       |

### Business Health 商業健康監控

| 文件                                                         | 說明                |
| ------------------------------------------------------------ | ------------------- |
| [系統設計](./03-core-features/business-health/system-design) | 健康指標系統架構    |
| [規則矩陣](./03-core-features/business-health/rules-matrix)  | 多維度健康檢查規則  |
| [API 文件](./03-core-features/business-health/api)           | Business Health API |

---

## 04. API 參考

Supabase 整合與業務 API 文件。

| 文件                                                   | 說明                     |
| ------------------------------------------------------ | ------------------------ |
| [Supabase 參考](./04-api-reference/supabase-reference) | Supabase Client 使用指南 |
| [User API](./04-api-reference/user-api)                | 用戶管理 API             |
| [Order API](./04-api-reference/order-api)              | 訂單管理 API             |
| [Product API](./04-api-reference/product-api)          | 產品管理 API             |
| [Customer API](./04-api-reference/customer-api)        | 客戶管理 API             |

---

## 05. 部署指南

Docker 容器化、環境配置與部署流程。

| 文件                                                        | 說明                   |
| ----------------------------------------------------------- | ---------------------- |
| [部署說明](./05-deployment/DEPLOYMENT)                      | 完整部署流程與檢查清單 |
| [Docker 指南](./05-deployment/docker-guide)                 | Docker 容器化部署      |
| [環境變數配置](./05-deployment/environment-variables-guide) | 環境變數設定說明       |

---

## 按角色導航

### 產品經理 / 業務分析師

- [專案概覽](./01-project/project-overview) - 了解產品需求與目標
- [功能特性](./01-project/features) - 查看完整功能列表
- [開發里程碑](./01-project/milestones) - 追蹤專案進度

### 前端開發者

- [系統架構設計](./02-architecture/system-architecture) - 整體架構理解
- [圖表架構](./02-architecture/chart-architecture) - 資料視覺化實作
- [Realtime 系統](./02-architecture/realtime-system) - 即時通訊整合

### 後端開發者

- [資料庫設計](./02-architecture/database-design) - Schema 設計與優化
- [API 設計](./02-architecture/api-design) - RESTful API 規範
- [RLS 安全策略](./02-architecture/rls-security) - 資料庫層級安全

### DevOps / 運維工程師

- [部署說明](./05-deployment/DEPLOYMENT) - 完整部署流程
- [Docker 指南](./05-deployment/docker-guide) - 容器化部署
- [環境變數配置](./05-deployment/environment-variables-guide) - 環境設定

---

## 面試官推薦閱讀路徑

### 快速瀏覽 (30 分鐘)

1. **專案亮點** (5 分鐘)

   - [首頁](/) - 專案介紹、技術棧、統計數據

2. **架構設計** (10 分鐘)

   - [系統架構設計](./02-architecture/system-architecture)
   - [資料庫設計](./02-architecture/database-design)
   - [RLS 安全策略](./02-architecture/rls-security)

3. **核心功能** (10 分鐘)

   - [Campaign 系統概覽](./03-core-features/campaign/overview)
   - [訂單分析](./03-core-features/analytics/order-analytics)
   - [通知系統架構](./03-core-features/notification/architecture)

4. **問題解決** (5 分鐘)
   - [Realtime 連線問題修復](./REALTIME_FIX_SUMMARY)

### 深度評估 (額外 30 分鐘)

5. **業務複雜度**

   - [Business Health 系統設計](./03-core-features/business-health/system-design)
   - [Campaign 類型配置](./03-core-features/campaign/type-config)

6. **技術深度**
   - [Realtime 系統](./02-architecture/realtime-system)
   - [圖表架構](./02-architecture/chart-architecture)
   - [Supabase 參考](./04-api-reference/supabase-reference)

---

## 技術標籤索引

- **架構設計**: [系統架構](./02-architecture/system-architecture) · [API 設計](./02-architecture/api-design)
- **資料庫**: [資料庫設計](./02-architecture/database-design) · [RLS 策略](./02-architecture/rls-security)
- **Realtime**: [Realtime 系統](./02-architecture/realtime-system) · [通知架構](./03-core-features/notification/architecture)
- **分析系統**: [訂單分析](./03-core-features/analytics/order-analytics) · [客戶分析](./03-core-features/analytics/customer-analytics)
- **部署運維**: [Docker 指南](./05-deployment/docker-guide) · [環境配置](./05-deployment/environment-variables-guide)

---

_此文件為面試展示版本，包含 40 個核心文件。完整版文件 (270+ 文件) 請切換到 `main` 分支查看。_
