# 通知系統 Realtime 遷移指南

## 概述

本文件說明如何將通知系統從輪詢模式遷移到 Supabase Realtime，以提升效能和用戶體驗。

## 實作架構

### 核心組件

1. **useNotification.ts** - 主要 composable，整合 realtime 功能
2. **NotificationBadge.vue** - 通知徽章組件，支援 realtime 更新
3. **效能監控** - 比較輪詢 vs realtime 的資源使用

### 功能特色

- ✅ 即時通知推播
- ✅ 自動重連機制
- ✅ 備援輪詢模式
- ✅ 連線狀態監控
- ✅ 效能指標追蹤

## 使用方法

### 基本用法

```typescript
import { useNotification } from '@/composables/useNotification'

const userId = ref('user-123')
const {
  notifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  isRealtimeConnected,
  realtimeError,
} = useNotification(userId)

// 啟動 realtime 訂閱
subscribeToNotifications()

// 監控連線狀態
watch(isRealtimeConnected, (connected) => {
  if (connected) {
    console.log('✅ Realtime 連線成功')
  } else {
    console.log('❌ Realtime 連線失敗')
  }
})
```

### 組件整合

```vue
<template>
  <NotificationBadge
    :userId="currentUser.id"
    :autoRefresh="true"
    :refreshInterval="60000"
  />
</template>

<script setup>
import { NotificationBadge } from '@/components/notify/NotificationBadge.vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()
</script>
```

## 技術細節

### Realtime 訂閱機制

```typescript
// 主通知訂閱
channel = supabase
  .channel('notifications-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'notifications' },
    async (payload) => {
      await handleNotificationChange(payload)
    },
  )
  .subscribe((status) => {
    isRealtimeConnected.value = status === 'SUBSCRIBED'
  })
```

### 事件處理

支援以下 PostgreSQL 事件：

- `INSERT` - 新增通知
- `UPDATE` - 更新通知狀態
- `DELETE` - 刪除通知

### Hybrid 模式

系統採用 Realtime + 輪詢的混合模式：

1. **主要模式**: Realtime 即時推播
2. **備援模式**: 輪詢機制（60秒間隔）
3. **容錯機制**: 自動切換和重連

## 效能優化

### 網路請求減少

- **輪詢模式**: 每30秒 2-3 個請求
- **Realtime模式**: 僅在資料變更時傳輸
- **節省比例**: 約50-80%網路請求

### 記憶體優化

- 智能事件處理，避免不必要的 DOM 更新
- 自動清理無效連線
- 限制通知數量避免記憶體溢出

## 監控和除錯

### 連線狀態監控

```typescript
const { isRealtimeConnected, realtimeError } = useNotification(userId)

// 監控連線狀態
watch(isRealtimeConnected, (connected) => {
  if (!connected && realtimeError.value) {
    console.error('Realtime error:', realtimeError.value)
  }
})
```

### 效能監控

```typescript
import { notificationPerformanceMonitor } from '@/utils/performance'

// 取得效能報告
const report = notificationPerformanceMonitor.getPerformanceReport()
console.log('效能報告:', report)
```

### 除錯模式

啟用 console 日誌來追蹤 realtime 事件：

```typescript
// 在 useNotification.ts 中
console.log('🔔 Notification channel status:', status)
console.log('💡 Suggestion channel status:', status)
```

## 測試

### 單元測試

執行 realtime 功能測試：

```bash
npm test -- useNotification.realtime.test.ts
```

### 效能測試

```typescript
import { runPerformanceComparison } from '@/utils/performance'

// 執行 60 秒效能比較
const result = await runPerformanceComparison(60000)
console.log('效能比較結果:', result)
```

## 遷移步驟

### 1. 準備階段

- 確保 Supabase Realtime 已啟用
- 檢查資料庫 RLS 政策
- 備份現有輪詢配置

### 2. 漸進式遷移

```typescript
// 階段 1: 啟用 hybrid 模式
subscribeToNotifications()
startPolling(60000) // 降低頻率作為備援

// 階段 2: 監控和測試
watch(isRealtimeConnected, (connected) => {
  if (connected) {
    // 可以考慮停用輪詢
    stopPolling()
  }
})

// 階段 3: 完全遷移
// 移除 startPolling() 調用
```

### 3. 回滾方案

如遇問題可快速回滾：

```typescript
// 停用 realtime
unsubscribeFromNotifications()

// 重啟輪詢
startPolling(30000)
```

## 故障排除

### 常見問題

1. **連線失敗**
   - 檢查 Supabase 配置
   - 確認 RLS 政策
   - 檢查網路防火牆設定

2. **事件丟失**
   - 確認資料庫觸發器正常
   - 檢查 channel 訂閱狀態
   - 啟用備援輪詢

3. **記憶體洩漏**
   - 確保 `onUnmounted` 清理
   - 檢查事件監聽器移除
   - 監控組件生命週期

### 性能調優

1. **連線數限制**
   - 避免重複訂閱
   - 適當的 channel 命名
   - 定期清理無效連線

2. **事件頻率控制**
   - 使用 debounce 避免頻繁更新
   - 批次處理多個事件
   - 限制並發請求數

## 最佳實踐

1. **Always 清理資源**

   ```typescript
   onUnmounted(() => {
     unsubscribeFromNotifications()
     stopPolling()
   })
   ```

2. **錯誤處理**

   ```typescript
   try {
     await handleNotificationChange(payload)
   } catch (error) {
     console.error('處理通知事件失敗:', error)
     // 啟用備援機制
     startPolling(30000)
   }
   ```

3. **狀態管理**
   ```typescript
   // 避免狀態不一致
   if (payload.eventType === 'INSERT') {
     notifications.value.unshift(newNotification)
     await loadStats() // 同步更新統計
   }
   ```

## 總結

Realtime 遷移帶來以下優勢：

- 🚀 **即時性**: 零延遲通知推播
- 📈 **效能**: 減少50-80%網路請求
- 🔋 **節能**: 降低設備電池消耗
- 🛡️ **穩定性**: Hybrid 模式提供容錯機制
- 📊 **監控**: 完整的效能追蹤和分析

遷移過程採用漸進式方法，確保系統穩定性和可回滾性。
