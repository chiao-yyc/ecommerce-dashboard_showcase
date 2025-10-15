# 通知系統完整指南

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐ (通知系統)

---

## 系統概述

通知系統是後台管理系統的核心功能之一，專為內部員工工作協作與業務處理需求設計。

### 系統範圍

- **✅ 包含範圍**: 內部員工工作通知、系統監控警報、業務流程通知
- **❌ 不包含範圍**: 客戶端通知、行銷推播、外部系統通知

### 用戶對象

- **主要用戶**: 內部員工（管理員、銷售、客服、倉庫、IT 等）
- **次要用戶**: 系統管理員、開發人員

## 系統架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────┐
│                   通知系統架構                          │
├─────────────────────────────────────────────────────────┤
│  前端 UI 層                                             │
│  ├─ NotificationList.vue     (通知列表)                 │
│  ├─ NotificationCard.vue     (通知卡片)                 │
│  ├─ NotificationBadge.vue    (通知徽章)                 │
│  └─ GroupNotificationCard.vue (群組通知)               │
├─────────────────────────────────────────────────────────┤
│  業務邏輯層                                             │
│  ├─ useNotification.ts       (Vue Composable)          │
│  ├─ NotificationApiService.ts (API 服務)               │
│  └─ GroupNotificationApiService.ts (群組通知服務)      │
├─────────────────────────────────────────────────────────┤
│  資料處理層                                             │
│  ├─ notification-helpers.ts   (業務邏輯輔助)           │
│  ├─ notification-validators.ts (資料驗證)              │
│  └─ notification-type-monitoring.ts (類型監控)        │
├─────────────────────────────────────────────────────────┤
│  資料庫層                                               │
│  ├─ notifications            (核心通知表)              │
│  ├─ notification_templates   (通知模板)                │
│  ├─ notification_groups      (群組定義)                │
│  └─ notification_recipients  (接收者記錄)              │
└─────────────────────────────────────────────────────────┘
```

## 核心功能

### 1. 通知分類系統

- **INFORMATIONAL**: 資訊性通知（僅通知，無需操作）
- **ACTIONABLE**: 可操作通知（需要用戶響應）

### 2. 完成策略系統

- **AUTO**: 自動完成（系統自動標記完成）
- **SUGGESTED**: 建議完成（系統提供建議）
- **MANUAL**: 手動完成（用戶手動標記）

### 3. 群組通知機制

- **ROLE**: 基於角色的通知
- **DEPARTMENT**: 基於部門的通知
- **BROADCAST**: 廣播通知（全體）

## 前端實現

### Vue 組件使用

#### NotificationBadge 組件

```vue
<template>
  <NotificationBadge
    :userId="currentUser.id"
    :autoRefresh="true"
    :refreshInterval="60000"
  />
</template>

<script setup>
import { NotificationBadge } from "@/components/notify/NotificationBadge.vue";
import { useAuth } from "@/composables/useAuth";

const { currentUser } = useAuth();
</script>
```

#### NotificationList 組件

```vue
<template>
  <NotificationList
    :userId="userId"
    :limit="10"
    :showActions="true"
    @notification-read="handleRead"
    @notification-completed="handleCompleted"
  />
</template>
```

### Composable 使用

#### useNotification

```typescript
import { useNotification } from "@/composables/useNotification";

const userId = ref("user-123");
const {
  notifications,
  unreadCount,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  markAsRead,
  markAsCompleted,
  isRealtimeConnected,
  realtimeError,
} = useNotification(userId);

// 啟動 realtime 訂閱
subscribeToNotifications();
```

## API 服務層

### NotificationApiService

#### 基本操作

```typescript
import { NotificationApiService } from "@/api/services";

// 獲取通知列表
const notifications = await NotificationApiService.getNotifications({
  userId: "user-123",
  limit: 10,
  offset: 0,
});

// 標記已讀
await NotificationApiService.markAsRead("notification-id");

// 標記完成
await NotificationApiService.markAsCompleted("notification-id");

// 創建通知
await NotificationApiService.createNotification({
  type: "order_new",
  title: "新訂單通知",
  message: "收到新訂單 #12345",
  userId: "user-123",
  relatedEntityId: "order-12345",
  relatedEntityType: "order",
});
```

### GroupNotificationApiService

#### 群組通知操作

```typescript
import { GroupNotificationApiService } from "@/api/services";

// 創建群組通知
await GroupNotificationApiService.createGroupNotification({
  type: "system_maintenance",
  title: "系統維護通知",
  message: "系統將於今晚進行維護",
  groupType: "role",
  groupValue: "admin",
  scheduledFor: new Date("2024-01-20 22:00:00"),
});

// 獲取群組通知狀態
const status = await GroupNotificationApiService.getGroupNotificationStatus(
  "group-notification-id"
);
```

## 輔助函數庫

### notification-helpers.ts

#### 業務邏輯輔助函數

```typescript
import {
  getTemplateByType,
  getNotificationCategoryFromTemplate,
  getCompletionStrategyFromTemplate,
  isActionableNotificationFromTemplate,
} from "@/lib/notification-helpers";

// 獲取通知模板
const template = getTemplateByType(templates, NotificationType.ORDER_NEW);

// 獲取通知分類
const category = getNotificationCategoryFromTemplate(templates, type);
// 返回: 'informational' | 'actionable' | undefined

// 檢查是否為可操作通知
const isActionable = isActionableNotificationFromTemplate(templates, type);
```

### notification-validators.ts

#### 資料驗證函數

```typescript
import {
  validateNotificationData,
  validateNotificationTemplate,
  validateCompletionData,
} from "@/lib/notification-validators";

// 驗證通知資料完整性
const isValid = validateNotificationData(notificationData);

// 驗證模板配置
const templateValid = validateNotificationTemplate(template);
```

## 類型系統

### 核心類型定義

```typescript
// 通知類型枚舉
export enum NotificationType {
  ORDER_NEW = "order_new",
  ORDER_HIGH_VALUE = "order_high_value",
  INVENTORY_LOW_STOCK = "inventory_low_stock",
  CUSTOMER_SERVICE_NEW_REQUEST = "customer_service_new_request",
  SECURITY_PERMISSION_CHANGED = "security_permission_changed",
}

// 混合類型支援
export type NotificationTypeValue = NotificationType | string;

// 通知介面
export interface NotificationData {
  id: string;
  type: NotificationTypeValue;
  title: string;
  message: string;
  category: "informational" | "actionable";
  status: "unread" | "read" | "completed";
  userId: string;
  createdAt: Date;
  relatedEntityId?: string;
  relatedEntityType?: RelatedEntityType;
}
```

### 類型選擇策略

#### 使用核心類型 (推薦)

```typescript
// ✅ 推薦：使用預定義類型
const notification = {
  type: NotificationType.ORDER_NEW, // 強類型，IDE 支援
  title: "新訂單通知",
};
```

#### 使用動態類型 (特殊情況)

```typescript
// ⚠️  特殊情況：動態類型
const customNotification = {
  type: "custom_event_2024", // 字串類型，彈性更高
  title: "自定義事件",
};
```

## 🔄 Real-time 功能

### Supabase Realtime 整合

```typescript
// 啟動即時通知訂閱
const { subscribeToNotifications } = useNotification(userId);

// 監控連線狀態
watch(isRealtimeConnected, (connected) => {
  if (connected) {
    console.log("✅ Realtime 連線成功");
  } else {
    console.log("❌ Realtime 連線失敗，啟動輪詢備援");
    startPolling(60000);
  }
});
```

### Hybrid 模式

系統採用 Realtime + 輪詢的混合模式：

1. **主要模式**: Realtime 即時推播
2. **備援模式**: 輪詢機制（60 秒間隔）
3. **容錯機制**: 自動切換和重連

## 資料庫結構

### 核心表格

#### notifications 表

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category notification_category NOT NULL,
    status notification_status NOT NULL DEFAULT 'unread',
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    related_entity_id VARCHAR(255),
    related_entity_type related_entity_type
);
```

#### notification_templates 表

```sql
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category notification_category NOT NULL,
    completion_strategy completion_strategy NOT NULL,
    required_entity_type related_entity_type,
    is_active BOOLEAN DEFAULT true
);
```

### 權限設定 (RLS)

```sql
-- 用戶只能看到自己的通知
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

-- 管理員可以創建通知
CREATE POLICY "Admins can create notifications" ON notifications
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
        AND role_name IN ('admin', 'system')
    )
);
```

## 🧪 測試策略

### 組件測試

#### NotificationCard 測試

```typescript
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import NotificationCard from "@/components/notify/NotificationCard.vue";

describe("NotificationCard", () => {
  it("should display notification content correctly", () => {
    const notification = {
      id: "1",
      title: "測試通知",
      message: "這是測試訊息",
      status: "unread",
    };

    const wrapper = mount(NotificationCard, {
      props: { notification },
    });

    expect(wrapper.text()).toContain("測試通知");
    expect(wrapper.text()).toContain("這是測試訊息");
  });
});
```

### API 測試

```typescript
describe("NotificationApiService", () => {
  it("should fetch notifications correctly", async () => {
    const notifications = await NotificationApiService.getNotifications({
      userId: "test-user",
      limit: 5,
    });

    expect(notifications).toBeDefined();
    expect(notifications.length).toBeLessThanOrEqual(5);
  });
});
```

## 部署指南

### 環境變數設定

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 通知系統配置
VITE_NOTIFICATION_REFRESH_INTERVAL=30000
VITE_MAX_NOTIFICATIONS_PER_PAGE=20
VITE_ENABLE_REAL_TIME_NOTIFICATIONS=true
```

### 資料庫部署

```bash
# 執行通知系統 SQL 遷移
cd notify-sql
psql -h your-db-host -U postgres -d postgres -f 01_notifications_core_schema.sql
psql -h your-db-host -U postgres -d postgres -f 02_notifications_initial_data.sql
# ... 其他 SQL 文件
```

## 📈 監控與除錯

### 效能監控

```typescript
import { notificationPerformanceMonitor } from "@/utils/performance";

// 取得效能報告
const report = notificationPerformanceMonitor.getPerformanceReport();
console.log("通知系統效能:", report);
```

### 除錯模式

```typescript
// 啟用 console 日誌追蹤
console.log("🔔 Notification channel status:", status);
console.log("💡 Suggestion channel status:", status);
```

## 🔍 故障排除

### 常見問題

1. **通知不顯示**

   - 檢查 Supabase 連接設定
   - 確認 RLS 政策正確
   - 驗證用戶權限

2. **即時通知失效**

   - 檢查 WebSocket 連線狀態
   - 確認防火牆設定
   - 啟用輪詢備援機制

3. **效能問題**
   - 檢查通知數量限制
   - 優化資料庫查詢
   - 啟用快取機制

## 相關文件

- [Vue 專案結構優化建議](../../../05-reference/project-optimization-roadmap.md)
- [API 服務架構](./api-services-architecture.md)
- [即時通信實現](../architecture/REALTIME_MIGRATION.md)
- [資料庫設計文件](../database/schema.sql)

---

_最後更新: $(date "+%Y-%m-%d")_
_版本: 2.0_
