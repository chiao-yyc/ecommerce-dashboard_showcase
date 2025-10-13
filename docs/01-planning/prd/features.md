# 功能清單

> 📌 **文檔性質說明**
> 本文檔為產品規劃階段（2025-05）的功能清單，實際實現的功能範圍已大幅擴展。
> **請以實際代碼實現和 `02-development/architecture/` 架構文檔為準。**
> 實際系統規模：40 個頁面組件、139+ 個組件、9 個業務域。

## A. 核心模組
| 模組 | 子功能 | 說明 |
|------|--------|------|
| 登入/權限 | Email 登入、角色判斷 | Supabase Auth、RLS |
| Dashboard 總覽 | KPI 卡、7‑Day 趨勢 | GMV、訂單、活躍用戶 |
| 訂單管理 | 列表、詳情、篩選 | 與庫存扣減連動 |
| 庫存管理 | 庫存列表、異動日誌 | 低庫存警示推播 |
| 顧客分析 | RFM、留存、LTV | View / Materialized View |
| 客服中心 | 即時訊息、工單 | WebSocket + tickets |
| 報表中心 | 銷售、會員、漏斗 | 可匯出 CSV |
| 系統設定 | i18n、主題、API key | 個人化 & 開發整合 |

## B. 平台增強
- Faker 測試資料按鈕  
- Onboarding Tour（react‑joyride）  
- Dark / Light Theme 切換  
- Cloud Deploy (Docker) + CI/CD Pipeline
