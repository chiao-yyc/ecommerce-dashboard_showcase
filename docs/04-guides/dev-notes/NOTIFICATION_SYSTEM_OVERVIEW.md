# 通知系統概述

## 系統定位

Vue 通知系統是一個功能完整的電商平台通知管理系統，支援個人通知、群組通知、即時推送、智能建議等功能。系統採用 Vue 3 + TypeScript + Supabase 架構，提供完整的通知生命週期管理。

## 核心特性

### 功能清單
- **個人通知管理**：支援個人通知的創建、讀取、標記、歸檔
- **群組通知系統**：支援角色通知、廣播通知、自定義群組通知
- **即時通知推送**：基於 Supabase Realtime 的即時通知推送
- **智能建議系統**：自動分析通知並提供完成建議
- **通知模板系統**：支援動態模板和參數替換
- **多場景顯示**：支援列表、彈窗、徽章、Toast 等多種顯示模式

### 通知分類
- **資訊型通知（informational）**：純資訊展示，使用者只需知悉
- **任務型通知（actionable）**：需要使用者處理或回應的通知

### 完成策略
- **自動完成（auto）**：系統自動標記為完成
- **智能建議（suggested）**：系統提供智能完成建議
- **手動完成（manual）**：需要使用者手動標記完成

## 系統架構

### 三層架構設計

```
┌─────────────────────────────────────────────────────────┐
│                    前端展示層 (Vue 3)                      │
│  NotificationCard, NotificationBadge, NotificationList    │
│  useNotification Composable, Realtime Integration        │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   API 服務層 (Supabase)                   │
│  REST API, Realtime Subscriptions, RLS Policies          │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  資料庫層 (PostgreSQL)                     │
│  notifications, notification_templates,                  │
│  notification_preferences, 智能建議觸發器                 │
└─────────────────────────────────────────────────────────┘
```

### 資料庫核心表結構

```sql
-- 核心通知表
notifications (
  id, user_id, type, title, message, priority, status,
  category, completion_strategy, metadata, created_at, ...
)

-- 通知模板表
notification_templates (
  id, type, title_template, message_template,
  default_priority, category, completion_strategy, ...
)

-- 使用者偏好設定
notification_preferences (
  id, user_id, notification_type, channels, is_enabled, ...
)
```

## 內建通知類型

### 訂單相關
- `order_new`：新訂單通知
- `order_payment_failed`：支付失敗通知
- `order_cancelled`：訂單取消通知
- `order_shipping_delayed`：出貨延遲通知

### 庫存相關
- `inventory_low_stock`：庫存不足通知
- `inventory_out_of_stock`：缺貨通知

### 客服相關
- `customer_service_new_request`：新客服請求
- `customer_service_urgent`：緊急客服通知

### 安全相關
- `security_unusual_login`：異常登入通知
- `security_permission_changed`：權限變更通知

## 快速開始

### 基本使用

```typescript
import { useNotification } from '@/composables/useNotification'

// 初始化
const {
  notifications,
  createNotification,
  markAsRead,
  subscribeToNotifications
} = useNotification(userId)

// 創建通知
await createNotification('order_new', {
  order_number: 'ORD-2024-001',
  total_amount: 1250.0
})

// 標記為已讀
await markAsRead(notificationId)

// 啟用即時訂閱
subscribeToNotifications()
```

### 組件使用

```vue
<template>
  <!-- 通知徽章 -->
  <NotificationBadge
    :user-id="userId"
    :auto-refresh="true"
  />

  <!-- 通知列表 -->
  <NotificationList
    :user-id="userId"
    :show-filters="true"
  />
</template>
```

## 詳細技術文檔

本概述文檔提供系統整體架構與快速開始指南。更詳細的實作細節請參考：

### 前端開發指南
📖 **[NOTIFICATION_FRONTEND_GUIDE.md](../../../admin-platform-vue/docs/04-guides/dev-notes/NOTIFICATION_FRONTEND_GUIDE.md)**
- Vue 組件完整 API 說明
- Composable 詳細使用方式
- Realtime 整合實作
- 樣式系統與響應式設計
- 前端測試指南

### 後端開發指南
📖 **[NOTIFICATION_BACKEND_GUIDE.md](../../02-development/database/NOTIFICATION_BACKEND_GUIDE.md)**
- 資料庫完整結構設計
- PostgreSQL 觸發器函數
- 智能建議系統實作
- RLS 政策與安全控制
- 效能優化與批量操作

## 安全考量

### 權限控制
- 使用者只能查看自己的通知
- 群組通知需要相應角色權限
- 管理員可查看系統通知日誌

### 資料驗證
- 所有通知資料都經過型別驗證
- 模板參數安全過濾
- SQL 注入防護

## 效能最佳化

### 快取策略
- 通知列表使用本地狀態快取
- 模板資料快取在 composable 中
- 統計資料定期更新

### 虛擬滾動
長列表自動啟用虛擬滾動，提升大量通知的渲染效能。

## 故障排除

### 常見問題

**通知沒有即時更新**
1. 檢查 Realtime 連線狀態
2. 確認使用者 ID 正確
3. 檢查 RLS 政策設定

**圖示顯示異常**
1. 確認 `notificationIconConfig.ts` 中有對應圖示
2. 檢查 Vue 組件是否正確引入
3. 確認通知類型拼寫正確

**智能建議不工作**
1. 確認通知類型為 `actionable`
2. 檢查完成策略設定為 `suggested`
3. 查看後端智能建議生成日誌

## 未來規劃

### 計劃功能
- [ ] 通知排程系統
- [ ] 多語言支援
- [ ] 通知統計分析
- [ ] 使用者通知偏好 AI 推薦
- [ ] 通知效果追蹤

### 效能改進
- [ ] 通知預載入機制
- [ ] 更智能的快取策略
- [ ] 離線通知同步

---

## 貢獻指南

如需對通知系統進行修改或新增功能，請遵循以下步驟：

1. 閱讀現有程式碼和文件
2. 在對應的測試檔案中新增測試案例
3. 實施功能並確保所有測試通過
4. 更新相關文件
5. 提交 Pull Request

## 授權

本通知系統遵循 MIT 授權條款。
