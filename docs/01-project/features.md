# 功能清單

> 本專案從簡單 Dashboard 進化為完整的企業級分析平台，實現了遠超原始規劃的功能範圍。

---

## 核心功能模組概覽

| 模組 | 子功能 | 技術亮點 |
|------|--------|---------|
| 登入/權限 | Email 登入、角色判斷、RLS | Supabase Auth、多角色權限系統 |
| Dashboard 總覽 | KPI 卡、趨勢圖表、健康度監控 | 即時資料更新、業務健康雷達圖 |
| 訂單管理 | 列表、詳情、篩選、批量操作 | 狀態機設計、樂觀更新 |
| 庫存管理 | 庫存列表、異動日誌、預警 | 即時訂閱、低庫存警示推播 |
| 客戶分析 | RFM 分群、留存分析、LTV | PostgreSQL 視圖、客戶價值評估 |
| 產品分析 | ABC 分析、滯銷品分析 | 多維度分析、庫存健康度 |
| 客服中心 | 即時訊息、工單管理 | WebSocket + Realtime 推送 |
| 通知系統 | 群組通知、智能建議 | PostgreSQL 觸發器 + 模板系統 |
| Campaign 管理 | 活動管理、歸因分析 | 多觸點歸因、三層分類 |
| 權限管理 | 角色權限、RLS 策略 | 47 個權限項目、Super Admin 保護 |

---

## 🎯 核心功能詳解

### 1. ServiceFactory 依賴注入架構

**技術定位**: 企業級 API 服務層設計

**核心特性**:
- **依賴注入模式**: 避免直接耦合 Supabase 實例，實現鬆耦合架構
- **單例管理**: 使用 Map 快取服務實例，統一管理生命週期
- **類型安全**: `import type` 策略確保無執行時依賴
- **環境隔離**: 支援開發/測試/生產環境獨立設定
- **Mock 注入**: 完整的單元測試支援

**服務架構**:
```
ServiceFactory (依賴注入容器)
  ├── UserApiService (用戶管理)
  ├── OrderApiService (訂單管理)
  ├── ProductApiService (產品管理)
  ├── CustomerApiService (客戶管理)
  ├── NotificationApiService (通知管理)
  ├── CampaignApiService (活動分析)
  ├── SupportTicketApiService (工單系統)
  └── DashboardApiService (儀表板資料)
```

**設計優勢**:
- ✅ 服務層與實例化邏輯分離
- ✅ 輕鬆注入 Mock 進行單元測試
- ✅ 多環境設定切換
- ✅ 避免執行時依賴問題

**相關文件**: [API 設計](../02-architecture/api-design.md)

---

### 2. 智能通知系統

**技術定位**: 基於 PostgreSQL 觸發器和 Supabase Realtime 的企業級通知解決方案

**系統架構**:
```
業務事件觸發 (訂單/庫存/客戶)
  ↓
PostgreSQL Triggers (自動捕獲事件)
  ↓
通知記錄插入 + 智能建議判斷
  ↓
Supabase Realtime 推送
  ↓
前端響應式更新
```

**核心功能**:
1. **自動通知觸發**
   - 訂單狀態變更 (新建、付款、完成、取消)
   - 庫存異常 (低庫存、缺貨、過庫存)
   - 產品狀態 (停用、重新啟用、價格重大變更)
   - 客戶事件 (新註冊、帳戶停用/啟用)

2. **智能完成建議系統**
   - 基於業務邏輯自動判斷通知完成時機
   - 訂單完成建議 (狀態達到 completed)
   - 庫存恢復建議 (從缺貨恢復)
   - 客戶資訊更新建議

3. **角色群組路由**
   - 不同角色看到不同通知
   - 支援群組通知與個人通知
   - 基於路由規則的自動分發

4. **系統模板保護機制**
   - 8 個核心模板多層保護
   - 資料庫約束防止刪除
   - 觸發器防止停用
   - RLS 限制修改權限

**技術實現**:
- **後端**: PostgreSQL 觸發器 + 通知模板系統
- **傳輸**: Supabase Realtime WebSocket 推送
- **前端**: Vue 3 Composition API 響應式訂閱

**相關文件**: [通知系統架構](../03-core-features/notification/architecture.md)

---

### 3. 活動分層歸因分析

**技術定位**: 多觸點歸因權重計算系統

**分析維度**:
1. **總覽分析** - 活動效果統計與分層效果對比
2. **歸因分析** - 多維度歸因權重分析
3. **協作分析** - 活動間協作效果評估
4. **重疊分析** - 活動期間重疊情況與競爭強度
5. **趨勢分析** - 活動效果趨勢與績效評估
6. **規則管理** - 歸因規則設定與管理

**歸因邏輯核心概念**:

**活動分層分類**:
- **site-wide (全站活動)**: seasonal、holiday、flash_sale
- **target-oriented (目標導向)**: membership、demographic
- **category-specific (類別專屬)**: category、product_launch

**權重正規化計算**:
```sql
-- 層級內權重正規化
normalized_weight = raw_weight / SUM(raw_weight)
  OVER (PARTITION BY attribution_layer)

-- 營收歸因分配
attributed_revenue = total_amount * normalized_weight
```

**技術實現**:
- **資料庫**: PostgreSQL 視圖封裝複雜 JOIN 邏輯
- **API**: CampaignApiService 提供統一查詢介面
- **快取**: Vue Query 智能快取策略
- **視覺化**: Unovis 圖表庫多維度呈現

**相關文件**: [Campaign 系統概覽](../03-core-features/campaign/overview.md)

---

### 4. 客戶 RFM 分群分析

**技術定位**: 基於 Recency、Frequency、Monetary 模型的客戶價值評估系統

**RFM 模型**:
- **Recency (最近購買)**: 最後一次購買距今天數 → 評分 0-10
- **Frequency (購買頻率)**: 歷史購買次數 → 評分 0-10
- **Monetary (購買金額)**: 累計消費金額 → 評分 0-10

**客戶分群邏輯**:
```
💎 VIP 客戶 (R: 高, F: 高, M: 高)
  - 近期活躍、頻繁購買、高消費
  - 行銷策略: VIP 專屬優惠、優先服務

⭐ 忠誠客戶 (R: 中, F: 高, M: 中)
  - 定期購買、穩定消費
  - 行銷策略: 會員獎勵、交叉銷售

🎯 潛力客戶 (R: 高, F: 低, M: 中)
  - 最近購買、消費潛力大
  - 行銷策略: 培養忠誠度、推薦新品

⚠️ 流失風險 (R: 低, F: 低, M: 低)
  - 長期未購買、低活躍度
  - 行銷策略: 喚回活動、優惠券
```

**分析功能**:
- RFM 分群標籤視覺化
- 客戶行為追蹤圖表
- 流失風險預警系統
- 客戶價值散點圖

**技術實現**:
- **資料庫**: PostgreSQL 視圖計算 RFM 分數
- **分析**: 基於 RFM 三維度自動分類
- **視覺化**: 散點圖、雷達圖、趨勢圖

**相關文件**: [客戶分析系統](../03-core-features/analytics/customer-analytics.md)

---

### 5. 即時資料訂閱系統

**技術定位**: 基於 Supabase Realtime 的多模組即時更新架構

**監控模組與權重**:
- **Notifications** (權重 1.5) - 即時通知推送
- **Orders** (權重 2.0) - 訂單狀態更新 (最高優先)
- **Inventory** (權重 1.2) - 庫存數量變動

**錯誤追蹤與警報機制**:
```typescript
// 5 分鐘時間窗口內錯誤計數
if (errorCount > 3 in 5 minutes) {
  // 根據錯誤頻率調整嚴重程度
  severity = calculateSeverity(errorCount)
  // low → medium → high → critical
}
```

**系統穩定度計算**:
```typescript
// 基於多模組權重計算健康度 (0-10)
systemHealth = (
  notifications * 1.5 +
  orders * 2.0 +
  inventory * 1.2
) / (1.5 + 2.0 + 1.2)
```

**技術特色**:
- **統一錯誤追蹤**: 跨模組錯誤管理機制
- **時間窗口過濾**: 5 分鐘內錯誤計數
- **權重分級**: 訂單 > 通知 > 庫存
- **自動備援**: 連線失敗時啟動輪詢模式

**技術實現**:
- **前端**: `useRealtimeAlerts` composable 統一管理
- **傳輸**: Supabase Realtime WebSocket
- **監控**: 整合至業務健康度雷達圖 (第 7 維度)

**相關文件**: [Realtime 系統](../02-architecture/realtime-system.md)

---

## 📊 系統規模統計

### 功能模組統計
| 指標 | 數量 | 說明 |
|------|------|------|
| **頁面組件** | 40+ | 涵蓋完整業務流程 |
| **可重用組件** | 139+ | 高度模組化設計 |
| **業務域** | 9 個 | 訂單、客戶、產品、庫存、支援、通知、權限、Campaign、AI Provider |
| **API 服務** | 8 個 | ServiceFactory 管理的服務實例 |
| **通知類型** | 21 個 | 涵蓋所有業務事件 |
| **權限項目** | 47 個 | 細緻的 RBAC 權限控制 |
| **圖表組件** | 20+ | Unovis 專業級圖表 |

### 技術指標
| 指標 | 數據 | 說明 |
|------|------|------|
| **測試數量** | 471 tests | 100% 通過率 |
| **測試覆蓋率** | 85%+ | 核心業務邏輯完整覆蓋 |
| **TypeScript 覆蓋** | 100% | 所有業務代碼 |
| **Migration 檔案** | 195 個 | 完整的資料庫演進記錄 |
| **Edge Functions** | 14 個 | 伺服器端商業邏輯 |
| **Git Commits** | 334+ | 高強度開發歷程 |

---

## 🚀 進階功能

### 平台增強功能
- **測試資料生成**: Faker.js 整合，一鍵生成模擬資料
- **深色模式**: 完整的主題系統，CSS 變數統一管理
- **國際化**: i18n 支援（預留）
- **響應式設計**: 支援桌面、平板、行動端
- **效能優化**: 懶加載、虛擬化、快取策略

### 開發者工具
- **Docker 容器化**: 本地開發環境完全容器化
- **健康檢查腳本**: `health-check.sh` 自動化環境驗證
- **生產環境管理**: `prod.sh` 一鍵部署工具
- **Migration 管理**: Supabase CLI 自動化資料庫演進

---

## 🎯 與原始計劃對比

### 原始簡化目標 (2025-05 規劃)
- 多角色視圖 (Admin、Marketing、Customer Service、Ops)
- 即時訂單 & 訊息 (Supabase Realtime + WebSocket)
- 模擬資料工具 (Faker.js + Supabase Seed)
- i18n + Dark Mode (Tailwind 主題化)
- 雲端部署友善 (Docker、CI/CD)

### 實際達成 (2025-07)
✅ **遠超原始目標**
- 企業級分析平台 (4 大分析系統)
- 完整通知管理 (觸發器 + 智能建議 + 即時推送)
- 專業圖表系統 (20+ 圖表組件、3 層架構)
- Campaign 管理 (多觸點歸因分析)
- 多角色權限系統 (47 個權限項目、RBAC)

**結論**: 從 MVP 概念驗證進化為完整商業解決方案

---

## 📚 相關文件

### 架構文件
- [系統架構設計](../02-architecture/system-architecture.md)
- [資料庫設計](../02-architecture/database-design.md)
- [API 設計](../02-architecture/api-design.md)
- [RLS 安全策略](../02-architecture/rls-security.md)

### 功能文件
- [Campaign 系統](../03-core-features/campaign/overview.md)
- [Analytics 分析](../03-core-features/analytics/services-overview.md)
- [通知系統](../03-core-features/notification/overview.md)
- [Business Health](../03-core-features/business-health/system-design.md)

---

**最後更新**: 2025-10-15
**專案狀態**: 🟢 功能完備，持續優化中
