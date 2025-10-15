# 通知系統開發指南

## 開發指南概述

本文件為開發人員提供通知系統的具體開發指南，包括如何使用現有 API、如何擴展新功能、如何進行測試等。

## 目錄

1. [環境準備](#環境準備)
2. [已執行的 SQL 腳本](#已執行的sql腳本)
3. [API 使用指南](#api使用指南)
4. [前端開發指南](#前端開發指南)
5. [新增通知類型](#新增通知類型)
6. [測試開發](#測試開發)
7. [部署指南](#部署指南)
8. [故障排除](#故障排除)

## 環境準備

### 必要依賴

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "vue": "^3.x.x",
    "typescript": "^5.x.x"
  },
  "devDependencies": {
    "vitest": "^1.x.x",
    "@vue/test-utils": "^2.x.x"
  }
}
```

### 開發環境設置

```bash
# 1. clone 項目
git clone <repository-url>
cd admin-platform-vue

# 2. 安裝依賴
npm install

# 3. 環境配置
cp .env.example .env.local
# 配置 Supabase URL 和 Key

# 4. 開發服務器
npm run dev
```

## 🗃️ 已執行的 SQL 腳本

### 已完成的資料庫結構

基於以下已執行的 SQL 腳本：

1. **01_notifications_core_schema.sql** ✅

   - 核心通知表結構
   - 基本約束和索引
   - 用戶和偏好設定表

2. **02_notifications_initial_data.sql** ✅

   - 初始通知模板
   - 基本用戶數據
   - 預設偏好設定

3. **03_notifications_test_data.sql** ✅

   - 測試用通知數據
   - 測試用戶數據
   - 各種場景的測試案例

4. **04_notification_constraints.sql** ✅

   - 通知類型與實體類型約束
   - 數據完整性檢查
   - 約束驗證函數

5. **05_notification_categories_fixed.sql** ✅
   - 通知分類欄位（category, completion_strategy）
   - 智能建議相關欄位
   - 統計檢視和索引

### 待執行的 SQL 腳本

以下腳本需要按順序執行以完成群組通知功能：

6. **08_multi_user_notifications.sql** ⏳

   - 群組通知機制
   - 通知分發系統
   - 群組管理功能

7. **06_auto_triggers.sql** ⏳ (需要修改)

   - 自動觸發器函數
   - 業務邏輯觸發器
   - 測試觸發器

8. **07_notification_functions.sql** ⏳ (需要修改)
   - 智能建議函數
   - 完成處理函數
   - 批量操作函數

## API 使用指南

### 基礎通知 API

#### 1. 獲取用戶通知

```typescript
import { NotificationApiService } from "@/api/services/NotificationApiService";

const notificationApi = new NotificationApiService(supabase);

// 獲取用戶通知列表
const response = await notificationApi.getUserNotifications(
  userId,
  {
    category: "actionable", // 可選：篩選分類
    status: "unread", // 可選：篩選狀態
    completionStrategy: "suggested", // 可選：篩選完成策略
    hasSuggestion: true, // 可選：是否有智能建議
  },
  1, // 頁碼
  20 // 每頁數量
);

if (response.success) {
  console.log("通知列表:", response.data);
}
```

#### 2. 通知操作

```typescript
// 標記為已讀
await notificationApi.markAsRead(notificationId);

// 標記任務型通知為已完成
await notificationApi.markAsCompleted(notificationId);

// 標記資訊型通知為已知悉
await notificationApi.markAsDismissed(notificationId);

// 接受智能建議
await notificationApi.acceptCompletionSuggestion(notificationId);

// 拒絕智能建議
await notificationApi.dismissCompletionSuggestion(notificationId);

// 批量接受所有建議
await notificationApi.acceptAllSuggestions(userId);
```

### 群組通知 API

#### 1. 創建群組通知

```typescript
import { GroupNotificationApiService } from "@/api/services/GroupNotificationApiService";

const groupNotificationApi = new GroupNotificationApiService(supabase);

// 發送角色通知
await groupNotificationApi.notifyRole({
  roleName: "sales",
  type: "order_new",
  title: "新訂單待處理",
  message: "收到新訂單需要處理",
  priority: "high",
});

// 發送部門通知
await groupNotificationApi.notifyDepartment({
  departmentName: "IT",
  type: "security_alert",
  title: "安全警報",
  message: "檢測到異常登入活動",
  priority: "urgent",
});

// 廣播通知
await groupNotificationApi.notifyBroadcast({
  type: "system_maintenance",
  title: "系統維護通知",
  message: "系統將於今晚進行維護",
  priority: "medium",
});
```

#### 2. 群組通知統計

```typescript
// 獲取分發統計
const stats = await groupNotificationApi.getDistributionStats(20);

// 獲取群組通知概覽
const overview = await groupNotificationApi.getGroupNotificationStats();

// 獲取分發詳情
const details = await groupNotificationApi.getDistributionDetails(
  distributionId
);
```

### 創建通知（程式化）

#### 1. 單用戶通知

```typescript
await notificationApi.createNotification({
  userId: "user-uuid",
  type: "order_new",
  title: "新訂單通知",
  message: "您有新訂單需要處理",
  priority: "high",
  category: "actionable",
  completionStrategy: "suggested",
  relatedEntityType: "order",
  relatedEntityId: "order-123",
  actionUrl: "/admin/orders/order-123",
  metadata: {
    orderId: "order-123",
    customerName: "張三",
    amount: 1500,
  },
});
```

#### 2. 群組通知

```typescript
await groupNotificationApi.createGroupNotification({
  type: "inventory_low_stock",
  title: "庫存不足警告",
  message: "多個商品庫存不足",
  targetType: "role",
  targetCriteria: {
    roles: ["warehouse_manager", "purchasing"],
  },
  priority: "high",
  category: "actionable",
  completionStrategy: "suggested",
});
```

## 前端開發指南

### Vue Composable 使用

#### 1. 基礎用法

```vue
<template>
  <div class="notifications">
    <!-- 通知統計 -->
    <div class="notification-stats">
      <span>任務待處理: {{ actionableStats.pending }}</span>
      <span>智能建議: {{ actionableStats.suggested }}</span>
    </div>

    <!-- 分類標籤 -->
    <div class="category-tabs">
      <button @click="activeCategory = 'actionable'">
        任務 ({{ actionableNotifications.length }})
      </button>
      <button @click="activeCategory = 'informational'">
        資訊 ({{ informationalNotifications.length }})
      </button>
    </div>

    <!-- 通知列表 -->
    <div class="notification-list">
      <NotificationCard
        v-for="notification in filteredNotifications"
        :key="notification.id"
        :notification="notification"
        @complete="handleComplete"
        @dismiss="handleDismiss"
        @accept-suggestion="handleAcceptSuggestion"
        @dismiss-suggestion="handleDismissSuggestion"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useNotification } from "@/composables/useNotification";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();
const userId = computed(() => authStore.user?.id);

const {
  notifications,
  actionableNotifications,
  informationalNotifications,
  suggestedNotifications,
  actionableStats,
  informationalStats,
  markAsCompleted,
  markAsDismissed,
  acceptSuggestion,
  dismissSuggestion,
  loadNotifications,
} = useNotification(userId);

const activeCategory = ref<"actionable" | "informational">("actionable");

const filteredNotifications = computed(() => {
  return activeCategory.value === "actionable"
    ? actionableNotifications.value
    : informationalNotifications.value;
});

// 處理操作
const handleComplete = async (notificationId: string) => {
  await markAsCompleted(notificationId);
  await loadNotifications();
};

const handleDismiss = async (notificationId: string) => {
  await markAsDismissed(notificationId);
  await loadNotifications();
};

const handleAcceptSuggestion = async (notificationId: string) => {
  await acceptSuggestion(notificationId);
  await loadNotifications();
};

const handleDismissSuggestion = async (notificationId: string) => {
  await dismissSuggestion(notificationId);
  await loadNotifications();
};

// 載入通知
await loadNotifications();
</script>
```

#### 2. 進階用法

```typescript
// 帶篩選的通知加載
const { notifications, loadNotifications } = useNotification(userId);

// 載入特定類型的通知
await loadNotifications({
  category: "actionable",
  status: "unread",
  hasSuggestion: true,
});

// 實時更新通知
const { startRealtimeUpdates, stopRealtimeUpdates } = useNotification(userId);

onMounted(() => {
  startRealtimeUpdates();
});

onUnmounted(() => {
  stopRealtimeUpdates();
});
```

### 通知卡片組件

#### 1. NotificationCard.vue

```vue
<template>
  <div class="notification-card" :class="cardClasses">
    <!-- 智能建議橫幅 -->
    <div v-if="notification.suggestedComplete" class="suggestion-banner">
      <div class="suggestion-icon">🤖</div>
      <div class="suggestion-content">
        <div class="suggestion-title">建議標記為已完成</div>
        <div class="suggestion-reason">{{ notification.suggestionReason }}</div>
      </div>
      <div class="suggestion-actions">
        <button
          @click="$emit('accept-suggestion', notification.id)"
          class="btn-success-sm"
        >
          ✅ 接受
        </button>
        <button
          @click="$emit('dismiss-suggestion', notification.id)"
          class="btn-outline-sm"
        >
          ❌ 拒絕
        </button>
      </div>
    </div>

    <!-- 通知內容 -->
    <div class="notification-content">
      <div class="notification-header">
        <h4>{{ notification.title }}</h4>
        <span class="notification-priority" :class="priorityClass">
          {{ priorityText }}
        </span>
        <span class="notification-time">{{
          formatTime(notification.createdAt)
        }}</span>
      </div>
      <p class="notification-message">{{ notification.message }}</p>

      <!-- 元數據 -->
      <div v-if="notification.metadata" class="notification-metadata">
        <span
          v-for="(value, key) in notification.metadata"
          :key="key"
          class="metadata-item"
        >
          <strong>{{ key }}:</strong> {{ value }}
        </span>
      </div>
    </div>

    <!-- 操作按鈕 -->
    <div class="notification-actions">
      <!-- 資訊型操作 -->
      <template v-if="notification.category === 'informational'">
        <button @click="$emit('dismiss', notification.id)" class="btn-primary">
          ✓ 已知悉
        </button>
      </template>

      <!-- 任務型操作 -->
      <template v-else>
        <button
          v-if="notification.actionUrl"
          @click="goToAction"
          class="btn-primary"
        >
          🔗 處理
        </button>
        <button @click="$emit('complete', notification.id)" class="btn-success">
          ✅ 完成
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Notification } from "@/types/notification";

interface Props {
  notification: Notification;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  complete: [id: string];
  dismiss: [id: string];
  "accept-suggestion": [id: string];
  "dismiss-suggestion": [id: string];
}>();

const cardClasses = computed(() => ({
  "notification-card": true,
  actionable: props.notification.category === "actionable",
  informational: props.notification.category === "informational",
  suggested: props.notification.suggestedComplete,
  completed: props.notification.status === "completed",
  dismissed: props.notification.status === "dismissed",
  [`priority-${props.notification.priority}`]: true,
}));

const priorityClass = computed(() => `priority-${props.notification.priority}`);

const priorityText = computed(() => {
  const priorities = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "緊急",
  };
  return priorities[props.notification.priority] || "中";
});

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-TW");
};

const goToAction = () => {
  if (props.notification.actionUrl) {
    window.open(props.notification.actionUrl, "_blank");
  }
};
</script>

<style scoped>
.notification-card {
  @apply mb-4 overflow-hidden rounded-lg border bg-white shadow-sm;

  &.actionable {
    @apply border-l-4 border-l-orange-400;

    &.completed {
      @apply border-l-green-400 opacity-75;
    }

    &.suggested {
      @apply shadow-lg ring-2 ring-blue-200;
    }
  }

  &.informational {
    @apply border-l-4 border-l-blue-400;

    &.dismissed {
      @apply border-l-gray-400 opacity-50;
    }
  }

  &.priority-urgent {
    @apply border-red-400 bg-red-50;
  }

  &.priority-high {
    @apply border-orange-400 bg-orange-50;
  }
}

.suggestion-banner {
  @apply flex items-center gap-3 border-b border-blue-200 bg-blue-50 p-3;
}

.suggestion-icon {
  @apply text-2xl;
}

.suggestion-content {
  @apply flex-1;
}

.suggestion-title {
  @apply font-semibold text-blue-800;
}

.suggestion-reason {
  @apply text-sm text-blue-600;
}

.suggestion-actions {
  @apply flex gap-2;
}

.notification-content {
  @apply p-4;
}

.notification-header {
  @apply mb-2 flex items-center justify-between;
}

.notification-header h4 {
  @apply font-semibold text-gray-800;
}

.notification-priority {
  @apply rounded-full px-2 py-1 text-xs;

  &.priority-urgent {
    @apply bg-red-100 text-red-800;
  }

  &.priority-high {
    @apply bg-orange-100 text-orange-800;
  }

  &.priority-medium {
    @apply bg-blue-100 text-blue-800;
  }

  &.priority-low {
    @apply bg-gray-100 text-gray-800;
  }
}

.notification-time {
  @apply text-sm text-gray-500;
}

.notification-message {
  @apply mb-3 text-gray-600;
}

.notification-metadata {
  @apply mb-3 flex flex-wrap gap-2;
}

.metadata-item {
  @apply rounded bg-gray-100 px-2 py-1 text-sm;
}

.notification-actions {
  @apply flex justify-end gap-2 bg-gray-50 p-4;
}

.btn-primary {
  @apply rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600;
}

.btn-success {
  @apply rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600;
}

.btn-success-sm {
  @apply rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600;
}

.btn-outline-sm {
  @apply rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50;
}
</style>
```

## 新增通知類型

### 1. 定義通知類型

```typescript
// 在 src/types/notification.ts 中新增
export enum NotificationType {
  // 新增類型
  PAYMENT_FRAUD_DETECTED = "payment_fraud_detected",
  INVENTORY_EXPIRED = "inventory_expired",
  CUSTOMER_COMPLAINT = "customer_complaint",
  // ... 其他現有類型
}
```

### 2. 更新約束映射

```typescript
// 在 src/types/notification-constraints.ts 中新增映射
export const NOTIFICATION_ENTITY_MAPPING = {
  // 新增映射
  [NotificationType.PAYMENT_FRAUD_DETECTED]: RelatedEntityType.ORDER,
  [NotificationType.INVENTORY_EXPIRED]: RelatedEntityType.PRODUCT,
  [NotificationType.CUSTOMER_COMPLAINT]: RelatedEntityType.CONVERSATION,
  // ... 其他現有映射
} as const;
```

### 3. 更新分類配置

```typescript
// 在 src/types/notification-categories.ts 中新增分類
export const NOTIFICATION_CATEGORY_MAPPING = {
  // 新增分類
  [NotificationType.PAYMENT_FRAUD_DETECTED]: NotificationCategory.ACTIONABLE,
  [NotificationType.INVENTORY_EXPIRED]: NotificationCategory.ACTIONABLE,
  [NotificationType.CUSTOMER_COMPLAINT]: NotificationCategory.ACTIONABLE,
  // ... 其他現有分類
} as const;

export const NOTIFICATION_COMPLETION_STRATEGY = {
  // 新增完成策略
  [NotificationType.PAYMENT_FRAUD_DETECTED]: CompletionStrategy.MANUAL,
  [NotificationType.INVENTORY_EXPIRED]: CompletionStrategy.SUGGESTED,
  [NotificationType.CUSTOMER_COMPLAINT]: CompletionStrategy.MANUAL,
  // ... 其他現有策略
} as const;
```

### 4. 創建通知模板

```sql
-- 新增通知模板
INSERT INTO notification_templates (
  type, title_template, message_template,
  default_priority, default_channels,
  required_entity_type, category, completion_strategy
) VALUES
(
  'payment_fraud_detected',
  '疑似詐欺付款 - 訂單 #{order_number}',
  '訂單 #{order_number} 的付款存在異常，請立即檢查',
  'urgent',
  ARRAY['in_app', 'email'],
  'order',
  'actionable',
  'manual'
);
```

### 5. 設定路由規則

```sql
-- 新增通知路由規則
INSERT INTO notification_routing_rules (
  notification_type, target_type, target_criteria,
  send_to_user, is_active
) VALUES (
  'payment_fraud_detected',
  'role',
  '{"roles": ["finance_manager", "risk_control"]}',
  FALSE,
  TRUE
);
```

### 6. 創建觸發器（可選）

```sql
-- 創建付款詐欺檢測觸發器
CREATE OR REPLACE FUNCTION notify_payment_fraud() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fraud_score > 0.8 THEN
    PERFORM notify_role(
      'finance_manager',
      'payment_fraud_detected',
      '疑似詐欺付款 - 訂單 #' || NEW.order_number,
      '訂單 #' || NEW.order_number || ' 的付款存在異常，詐欺分數：' || NEW.fraud_score,
      'urgent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器
CREATE TRIGGER trigger_payment_fraud
  AFTER INSERT OR UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_fraud();
```

## 🧪 測試開發

### 1. 單元測試

```typescript
// tests/unit/NotificationApiService.test.ts
import { describe, it, expect, vi } from "vitest";
import { NotificationApiService } from "@/api/services/NotificationApiService";

describe("NotificationApiService", () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({
                data: [],
                error: null,
                count: 0,
              })
            ),
          })),
        })),
      })),
    })),
  };

  it("should get user notifications", async () => {
    const service = new NotificationApiService(mockSupabase as any);

    const result = await service.getUserNotifications("user-123");

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("should mark notification as completed", async () => {
    const service = new NotificationApiService(mockSupabase as any);

    // Mock RPC call
    mockSupabase.rpc = vi.fn(() =>
      Promise.resolve({ data: true, error: null })
    );
    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: "notif-123", status: "completed" },
              error: null,
            })
          ),
        })),
      })),
    }));

    const result = await service.markAsCompleted("notif-123");

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
  });
});
```

### 2. 整合測試

```typescript
// tests/integration/notification-flow.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createTestSupabaseClient } from "@/tests/utils/supabase";
import { NotificationApiService } from "@/api/services/NotificationApiService";

describe("Notification Flow Integration", () => {
  let supabase: any;
  let notificationService: NotificationApiService;

  beforeEach(async () => {
    supabase = createTestSupabaseClient();
    notificationService = new NotificationApiService(supabase);

    // 清理測試數據
    await supabase
      .from("notifications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  });

  it("should create and process actionable notification", async () => {
    // 1. 創建通知
    const createResult = await notificationService.createNotification({
      userId: "test-user-123",
      type: "order_new",
      title: "新訂單測試",
      message: "測試訂單通知",
      priority: "high",
      category: "actionable",
      completionStrategy: "suggested",
    });

    expect(createResult.success).toBe(true);
    const notification = createResult.data;

    // 2. 標記為已讀
    const readResult = await notificationService.markAsRead(notification.id);
    expect(readResult.success).toBe(true);
    expect(readResult.data.status).toBe("read");

    // 3. 標記為已完成
    const completeResult = await notificationService.markAsCompleted(
      notification.id
    );
    expect(completeResult.success).toBe(true);
    expect(completeResult.data.status).toBe("completed");
  });
});
```

### 3. 端到端測試

```typescript
// tests/e2e/notification-workflow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Notification Workflow", () => {
  test("should handle complete notification workflow", async ({ page }) => {
    // 1. 登入系統
    await page.goto("/login");
    await page.fill('[data-testid="email"]', "test@example.com");
    await page.fill('[data-testid="password"]', "password123");
    await page.click('[data-testid="login-button"]');

    // 2. 導航到通知頁面
    await page.goto("/notifications");

    // 3. 檢查通知列表
    await expect(
      page.locator('[data-testid="notification-list"]')
    ).toBeVisible();

    // 4. 切換到任務型通知
    await page.click('[data-testid="actionable-tab"]');

    // 5. 處理智能建議
    const suggestionBanner = page
      .locator('[data-testid="suggestion-banner"]')
      .first();
    if (await suggestionBanner.isVisible()) {
      await suggestionBanner
        .locator('[data-testid="accept-suggestion"]')
        .click();
      await expect(
        page.locator('[data-testid="success-message"]')
      ).toBeVisible();
    }

    // 6. 手動完成通知
    await page.click('[data-testid="complete-button"]').first();
    await expect(
      page.locator('[data-testid="completed-notification"]')
    ).toBeVisible();
  });
});
```

## 📦 部署指南

### 1. 資料庫遷移

```bash
# 執行待處理的SQL腳本
psql -h your-host -U your-user -d your-database -f notify-sql/08_multi_user_notifications.sql
psql -h your-host -U your-user -d your-database -f notify-sql/06_auto_triggers.sql
psql -h your-host -U your-user -d your-database -f notify-sql/07_notification_functions.sql
```

### 2. 環境配置

```bash
# .env.production
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_ENVIRONMENT=production
```

### 3. 建置與部署

```bash
# 建置生產版本
npm run build

# 部署到生產環境
npm run deploy
```

### 4. 監控設置

```typescript
// 設置通知監控
import { setupNotificationMonitoring } from "@/utils/monitoring";

setupNotificationMonitoring({
  errorTracking: true,
  performanceMonitoring: true,
  businessMetrics: true,
});
```

## 🚨 故障排除

### 常見問題

#### 1. 通知不顯示

```typescript
// 檢查步驟
console.log("1. 檢查用戶ID:", userId);
console.log("2. 檢查通知數據:", notifications.value);
console.log("3. 檢查API回應:", response) -
  // 可能原因
  用戶ID不正確 -
  資料庫權限問題 -
  通知狀態被意外修改 -
  前端篩選條件過於嚴格;
```

#### 2. 智能建議不工作

```sql
-- 檢查觸發器狀態
SELECT * FROM pg_trigger WHERE tgname LIKE '%suggestion%';

-- 檢查建議數據
SELECT * FROM notifications WHERE suggested_complete = TRUE;

-- 手動觸發建議
UPDATE notifications SET suggested_complete = TRUE, suggested_at = NOW(), suggestion_reason = '測試建議' WHERE id = 'your-notification-id';
```

#### 3. 群組通知未分發

```sql
-- 檢查群組配置
SELECT * FROM notification_groups WHERE is_active = TRUE;

-- 檢查分發記錄
SELECT * FROM notification_distributions ORDER BY created_at DESC LIMIT 10;

-- 檢查接收者記錄
SELECT * FROM notification_recipients WHERE status = 'failed';
```

#### 4. 性能問題

```sql
-- 檢查慢查詢
SELECT * FROM notifications WHERE created_at < NOW() - INTERVAL '7 days';

-- 清理過期通知
DELETE FROM notifications WHERE status = 'archived' AND created_at < NOW() - INTERVAL '30 days';

-- 重建索引
REINDEX TABLE notifications;
```

### 日誌檢查

```bash
# 檢查應用日誌
tail -f /var/log/notification-system.log

# 檢查資料庫日誌
tail -f /var/log/postgresql/postgresql.log

# 檢查系統資源
top -p $(pgrep -d ',' node)
```

### 緊急修復

#### 1. 停用問題通知類型

```sql
-- 暫時停用問題通知類型
UPDATE notification_routing_rules SET is_active = FALSE WHERE notification_type = 'problem_type';

-- 停用特定觸發器
ALTER TABLE your_table DISABLE TRIGGER trigger_name;
```

#### 2. 清理異常通知

```sql
-- 清理異常通知
DELETE FROM notifications WHERE status = 'unread' AND created_at < NOW() - INTERVAL '1 hour' AND type = 'problem_type';

-- 重置建議狀態
UPDATE notifications SET suggested_complete = FALSE, suggested_at = NULL, suggestion_reason = NULL WHERE suggested_complete = TRUE;
```

## 📈 性能優化

### 1. 資料庫優化

```sql
-- 創建複合索引
CREATE INDEX CONCURRENTLY idx_notifications_user_category_status ON notifications(user_id, category, status);

-- 分區歷史數據
CREATE TABLE notifications_archive PARTITION OF notifications FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
```

### 2. 前端優化

```typescript
// 使用虛擬滾動
import { VirtualList } from "@tanstack/vue-virtual";

// 實現通知快取
const notificationCache = new Map<string, Notification[]>();

// 批量操作
const batchMarkAsRead = async (notificationIds: string[]) => {
  const promises = notificationIds.map((id) => notificationApi.markAsRead(id));
  await Promise.all(promises);
};
```

### 3. 監控指標

```typescript
// 性能監控
const performanceMetrics = {
  notificationLoadTime: 0,
  apiResponseTime: 0,
  cacheHitRate: 0,
  errorRate: 0,
};

// 業務指標
const businessMetrics = {
  notificationCompletionRate: 0,
  suggestionAcceptanceRate: 0,
  averageProcessingTime: 0,
};
```

---

## 開發檢查清單

### 新功能開發

- [ ] 定義通知類型和約束
- [ ] 更新路由規則
- [ ] 創建測試案例
- [ ] 更新 API 文件
- [ ] 進行整合測試
- [ ] 部署到測試環境
- [ ] 進行用戶接受測試
- [ ] 部署到生產環境

### 維護作業

- [ ] 定期清理過期通知
- [ ] 監控系統性能
- [ ] 檢查觸發器狀態
- [ ] 更新通知模板
- [ ] 備份重要配置
- [ ] 檢查安全性設置

### 故障響應

- [ ] 確認問題範圍
- [ ] 檢查系統日誌
- [ ] 執行基礎診斷
- [ ] 實施緊急修復
- [ ] 驗證修復效果
- [ ] 更新監控規則
- [ ] 撰寫事故報告

本開發指南提供了完整的開發流程和最佳實踐，確保通知系統的穩定性和可維護性。
