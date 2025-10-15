# 電商儀表板系統 - 技術展示文件

> **專業級 Vue 3 + TypeScript + Supabase 電商後台管理系統**
>
> 展示現代化全棧開發能力：企業級架構設計、複雜業務邏輯實現、完整測試覆蓋

---

## 專案亮點

### 核心技術能力

- **前端架構**: Vue 3 Composition API + TypeScript + Pinia + Vue Router
- **後端服務**: Supabase (PostgreSQL + Realtime + Edge Functions + RLS)
- **UI/UX**: Tailwind CSS + HeadlessUI + 響應式設計
- **測試策略**: Vitest + Testing Library + 470+ 單元測試
- **開發工具**: Vite + ESLint + Prettier + Husky

### 業務系統特色

1. **Campaign 行銷活動管理系統**

   - 多維度活動配置 (節日/會員/新品上市/限時搶購/品類專屬)
   - 四層歸因架構 (全站/目標導向/品類專屬/一般活動)
   - 活動評分與績效分析
   - 活動重疊分析與衝突檢測

2. **四大 Analytics 分析系統**

   - 訂單分析 (漏斗分析、趨勢預測)
   - 客戶分析 (RFM 分群、客戶價值)
   - 產品分析 (銷售排行、庫存健康)
   - 客服分析 (工單統計、滿意度追蹤)

3. **Realtime 通知系統**

   - 即時推送 (Supabase Realtime + WebSocket)
   - 群組通知與個人通知
   - 通知優先級與已讀管理

4. **Business Health 商業健康監控**
   - 多維度健康指標 (訂單/庫存/客戶/物流/支付)
   - 智能警報與異常偵測
   - 商業洞察儀表板

---

## 快速導航

### 了解專案全貌

| 文件分類         | 說明                                               | 開始閱讀                                          |
| ---------------- | -------------------------------------------------- | ------------------------------------------------- |
| **01. 專案概覽** | 產品需求、功能特性、技術棧                         | [專案概覽](./01-project/project-overview)         |
| **02. 系統架構** | 架構設計、資料庫設計、API 設計                     | [系統架構](./02-architecture/system-architecture) |
| **03. 核心功能** | Campaign、Analytics、Notification、Business Health | [核心功能](./03-core-features/campaign/overview)  |
| **04. API 參考** | Supabase API、業務 API                             | [API 參考](./04-api-reference/supabase-reference) |
| **05. 部署指南** | Docker、環境變數、部署流程                         | [部署指南](./05-deployment/DEPLOYMENT)            |

### 面試重點推薦閱讀

#### 1. 架構設計能力 (15 分鐘)

- [系統架構設計](./02-architecture/system-architecture) - 整體架構與技術選型
- [資料庫設計](./02-architecture/database-design) - PostgreSQL 設計與優化
- [RLS 安全策略](./02-architecture/rls-security) - Row Level Security 實作
- [Realtime 系統](./02-architecture/realtime-system) - WebSocket 即時通訊

#### 2. 複雜業務實現 (20 分鐘)

- [Campaign 系統](./03-core-features/campaign/overview) - 多維度活動管理
- [訂單分析系統](./03-core-features/analytics/order-analytics) - 漏斗分析與趨勢預測
- [通知系統架構](./03-core-features/notification/architecture) - 即時通知實現
- [Business Health 監控](./03-core-features/business-health/system-design) - 健康指標系統

#### 3. 問題解決能力 (5 分鐘)

- [Realtime 連線問題修復](./REALTIME_FIX_SUMMARY) - 完整問題分析與解決方案

---

## 技術亮點展示

### 前端技術

```typescript
// Composition API + TypeScript 範例
import { ref, computed } from "vue";
import type { Campaign } from "@/types";

export function useCampaign() {
  const campaigns = ref<Campaign[]>([]);
  const loading = ref(false);

  const activeCampaigns = computed(() =>
    campaigns.value.filter((c) => c.status === "active")
  );

  return { campaigns, loading, activeCampaigns };
}
```

### 後端技術 (Supabase + PostgreSQL)

```sql
-- RLS Policy 範例
CREATE POLICY "notifications_select"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  has_permission(auth.uid(), 'notification.view')
);
```

### Realtime 訂閱

```typescript
// Supabase Realtime 訂閱範例
const channel = supabase
  .channel("notifications-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${currentUserId}`, // RLS 配合
    },
    handleChange
  )
  .subscribe();
```

---

## 專案統計

| 指標       | 數據            |
| ---------- | --------------- |
| 代碼行數   | ~50,000+ lines  |
| 測試數量   | 470+ tests      |
| 測試覆蓋率 | 85%+            |
| 文件頁面   | 40 核心文件     |
| 資料表數   | 30+ tables      |
| API 端點   | 50+ endpoints   |
| Vue 組件   | 100+ components |

---

## 💡 更多技術細節與完整展示

本文件提供快速導航與核心亮點概覽。

### 深入閱讀

- 📖 [專案概覽](./01-project/project-overview.md) - 產品願景與實際成果
- 📖 [功能清單](./01-project/features.md) - 5 大核心功能模組詳解
- 📖 [技術棧](./01-project/tech-stack.md) - Vue 3 生態系統完整介紹
- 📖 [系統架構](./02-architecture/system-architecture.md) - 整體架構設計

### 完整技術展示

> 📌 **showcase 分支 README** 提供完整的技術細節：
>
> - 🔍 3 個技術挑戰解決案例（通知系統、Router 效能、ServiceFactory 架構）
> - 🏗️ 5 大核心功能模組深度解析
> - 🗄️ 資料庫與後端設計亮點（195 個 Migration、14 個 Edge Functions）
> - 🔧 DevOps 自動化工具（健康檢查、生產環境管理）
> - 📚 完整文件架構說明


> **注意**: 這是 **面試展示版本** 的精簡文件 (40 個核心文件)。
