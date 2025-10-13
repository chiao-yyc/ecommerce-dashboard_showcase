# 通知系統設置指南

## 概述

本專案已實現完整的通知系統，包含資料庫架構、後端服務、前端組件和測試介面。

## 資料庫設置

### 1. 執行 SQL 架構文件

按順序執行以下 SQL 文件：

```bash
# 1. 建立核心表格、索引、觸發器、RLS 政策
psql -d your_database -f notify-sql/01_notifications_core_schema.sql

# 2. 插入初始數據和預設模板
psql -d your_database -f notify-sql/02_notifications_initial_data.sql

# 3. 插入測試用假資料
psql -d your_database -f notify-sql/03_notifications_test_data.sql

# 4. 建立通知約束
psql -d your_database -f notify-sql/04_notification_constraints.sql

# 5. 建立通知分類和完成策略
psql -d your_database -f notify-sql/05_notification_categories.sql

# 6. 建立自動觸發器
psql -d your_database -f notify-sql/06_auto_triggers.sql

# 7. 建立通知功能函數
psql -d your_database -f notify-sql/07_notification_functions.sql

# 8. 建立群組通知系統
psql -d your_database -f notify-sql/08_multi_user_notifications.sql

# 9. 建立其他功能函數
psql -d your_database -f notify-sql/09_missing_functions.sql

# 10. 修復狀態欄位問題
psql -d your_database -f notify-sql/11_fix_status_column.sql
```

### 2. 建立的表格

- `notifications` - 通知主表
- `notification_templates` - 通知模板
- `notification_preferences` - 用戶通知偏好
- `notification_logs` - 通知發送記錄

## 功能特色

### 核心功能

1. **通知管理**
   - 創建和發送通知
   - 模板化通知內容
   - 優先級管理（低、中、高、緊急）
   - 多種發送管道（應用內、Email、SMS、推送）

2. **用戶偏好**
   - 個別通知類型開關
   - 自訂發送管道
   - 靜音時段設定
   - 頻率限制

3. **通知類型**
   - 訂單管理（新訂單、高價值訂單、付款逾期等）
   - 庫存管理（低庫存、缺貨警告）
   - 客戶服務（新請求、緊急案件）
   - 系統安全（異常登入、權限變更）
   - 營運分析（業績目標、客戶流失）
   - 行銷活動（活動開始、效果監控）
   - 系統維護（備份完成、更新提醒）

### 前端組件

1. **NotificationList** - 通知列表
2. **NotificationBadge** - 通知徽章（含彈出視窗）
3. **NotificationSettings** - 通知設定頁面
4. **NotificationToast** - Toast 通知

### 後端服務

1. **NotificationService** - 核心通知服務
2. **NotificationApiService** - 通知 API 服務
3. **NotificationTemplateApiService** - 模板 API 服務
4. **NotificationPreferenceApiService** - 偏好設定 API 服務

## 使用方法

### 1. 訪問測試頁面

啟動應用後，訪問 `/test/notifications` 查看完整的通知系統測試介面。

### 2. 在代碼中使用

```typescript
// 1. 使用 composable
import { useNotification } from '@/composables/useNotification'

const {
  notifications,
  stats,
  quickNotifications,
  markAsRead
} = useNotification(userId)

// 2. 創建通知
await quickNotifications.orderNew({
  order_number: 'ORD-001',
  total_amount: 1250,
  orderId: 'order-123'
})

// 3. 在組件中使用
<template>
  <NotificationBadge
    :user-id="userId"
    :show-popover="true"
    @notification-click="handleNotificationClick"
  />
</template>
```

### 3. 組件使用示例

```vue
<template>
  <!-- 通知徽章 -->
  <NotificationBadge :user-id="userId" :show-popover="true" />

  <!-- 通知列表 -->
  <NotificationList
    :user-id="userId"
    :show-actions="true"
    :limit="20"
    max-height="400px"
  />

  <!-- 通知設定 -->
  <NotificationSettings :user-id="userId" />

  <!-- Toast 通知 -->
  <NotificationToast ref="toastRef" />
</template>
```

## 架構設計

### 資料流程

1. **通知創建** → 檢查用戶偏好 → 渲染模板 → 發送到指定管道
2. **用戶互動** → 標記已讀/未讀 → 更新統計
3. **偏好設定** → 即時生效 → 影響後續通知

### 安全性

- 使用 RLS (Row Level Security) 確保用戶只能查看自己的通知
- 管理員可以查看所有通知
- 支援角色基礎的權限控制

### 效能優化

- 適當的資料庫索引
- 分頁查詢
- 快取統計數據
- 批量操作支援

## 擴展功能

### 即將支援的功能

1. **實時通知** - 使用 WebSocket 或 Server-Sent Events
2. **Email 發送** - 整合 Email 服務提供商
3. **SMS 發送** - 整合 SMS 服務提供商
4. **推送通知** - 整合 Web Push API
5. **通知分析** - 開信率、點擊率統計
6. **A/B 測試** - 通知內容測試

### 自訂通知類型

1. 在 `NotificationType` 枚舉中新增類型
2. 在 `notification_templates` 表中新增模板
3. 在 `NotificationService` 中新增快速方法
4. 在前端組件中新增圖標和樣式

## 故障排除

### 常見問題

1. **通知不顯示**
   - 檢查用戶偏好設定
   - 確認通知模板是否啟用
   - 檢查 RLS 政策

2. **性能問題**
   - 檢查資料庫索引
   - 調整查詢分頁大小
   - 使用適當的快取策略

3. **權限問題**
   - 確認 RLS 政策正確
   - 檢查用戶角色設定
   - 驗證認證狀態

### 除錯模式

在開發環境中，可以在瀏覽器控制台中查看詳細的通知處理日誌。

## 維護

### 定期任務

1. **清理過期通知**

   ```sql
   DELETE FROM notifications
   WHERE expires_at < NOW()
   AND expires_at IS NOT NULL;
   ```

2. **歸檔舊通知**

   ```sql
   UPDATE notifications
   SET status = 'archived'
   WHERE created_at < NOW() - INTERVAL '30 days'
   AND status = 'read';
   ```

3. **監控通知統計**
   - 定期檢查通知發送成功率
   - 監控用戶互動率
   - 分析通知類型分佈

### 備份建議

- 定期備份通知模板
- 備份用戶偏好設定
- 保留重要通知記錄

## 結論

通知系統已完整實現，包含完整的測試介面和文檔。系統支援多種通知類型、用戶個人化設定、優先級管理和多種發送管道。

如有任何問題或需要擴展功能，請參考本文檔或查看測試頁面的實際運行效果。
