# Realtime 監控系統架構指南

## 系統概述

本文檔說明電商管理平台的 Realtime 監控系統架構，該系統提供統一的錯誤追蹤、狀態管理和警報機制，確保所有即時功能的穩定性和可靠性。

### 核心特性

- **統一錯誤追蹤**: 所有 Realtime 模組使用共用的錯誤監控機制
- **雙層監控架構**: 區分訊息層級 (messages) 和工單層級 (conversations) 監控
- **智能警報系統**: 基於錯誤頻率的自動警報觸發
- **視覺化狀態**: DevFloatingWidget 提供即時狀態監控
- **擴展性設計**: 新增 Realtime 模組的標準化流程

## 技術特色

### 共用機制設計

雙層監控架構的核心優勢在於高度統一的共用機制，讓所有 Realtime 模組都能享受相同的錯誤處理、狀態管理和警報整合能力。

```typescript
// 使用方式 - 超級簡潔
const errorTracker = useRealtimeErrorTracking('conversations')

// 自動整合警報系統
RealtimeStatusHandlers.handleSubscriptionStatus(
  status, 
  errorTracker, 
  onConnected, 
  onDisconnected
)
```

**設計理念**:
- **一致性**: 所有模組使用相同的錯誤處理模式
- **簡潔性**: 3行代碼即可完成完整的錯誤監控整合
- **自動化**: 無需手動管理錯誤統計和警報觸發

### 完整的錯誤處理

系統提供企業級的錯誤處理機制，確保 Realtime 連線的穩定性和可觀測性：

#### 智能錯誤統計
- **滑動窗口**: 5分鐘時間窗口內的錯誤統計
- **閾值觸發**: 3次錯誤自動觸發系統警報
- **等級分級**: low (1-2次) / medium (3-4次) / high (5次以上)
- **自動重置**: 連線成功時自動清零統計

#### 響應式狀態管理
```typescript
// 實時追蹤錯誤狀態
const errorSummary = errorTracker.getErrorSummary()
// {
//   errorCount: 2,
//   lastError: "Connection timeout",
//   isHealthy: true,
//   alertLevel: "low"
// }
```

#### 全域警報整合
- **跨模組收集**: 所有 Realtime 錯誤統一收集
- **系統面板顯示**: 整合到 DashboardApiService 系統警報
- **開發者工具**: DevFloatingWidget 即時狀態監控

### 對話系統特殊處理

對話系統採用雙重保障機制，確保在任何情況下都能提供穩定的服務：

#### 雙重保障架構
```typescript
// 主要方法：使用錯誤監控
const messagesRealtime = getGlobalMessagesRealtime()
messagesRealtime.subscribeToConversation(conversationId, callback)
  .then(success => {
    if (!success) {
      // 備援方法：降級為原始訂閱
      console.warn('🔄 錯誤監控失敗，使用原始訂閱方法')
      originalSubscribeMethod(conversationId, callback)
    }
  })
```

#### 智能降級機制
- **無縫切換**: 錯誤監控失敗時自動使用原始方法
- **清楚日誌**: 明確標示當前使用的訂閱方式
- **平滑整合**: 不破壞現有 useConversation 功能
- **向後兼容**: 保持完全的 API 兼容性

#### 備援日誌系統
```typescript
// 清楚標示使用哪種方法
console.log('✅ 使用 MessagesRealtime 錯誤監控訂閱')
// 或
console.warn('🔄 降級使用原始訂閱方法 (MessagesRealtime 失敗)')
```

### 視覺化診斷能力

#### DevFloatingWidget 即時監控
- **5系統狀態**: 通知、訂單、庫存、對話訊息、支援工單
- **狀態指示器**: 🟢 正常 / 🟡 警報 / 🔴 異常 / ⚪ 無訂閱
- **快速診斷**: Console 輸出詳細狀態分析
- **一鍵重連**: 智能重置所有系統錯誤統計

#### 智能修復建議
- **問題檢測**: 自動識別有問題的系統
- **修復建議**: 根據錯誤類型提供具體修復步驟
- **健康評估**: 整體系統健康度評分和報告

### 擴展性設計

#### 標準化新增流程
新增 Realtime 模組只需 5 分鐘：

```typescript
// 1. 創建 composable (2分鐘)
const errorTracker = useRealtimeErrorTracking('new-module')

// 2. 註冊警報模組 (1分鐘)  
interface RealtimeAlert {
  module: '...' | 'new-module'
}

// 3. 整合 DevFloatingWidget (2分鐘)
const newModuleStatus = getNewModuleStatus()
```

#### 一致性保證
- **統一介面**: 所有模組提供相同的 API 結構
- **標準錯誤處理**: 使用相同的 RealtimeStatusHandlers
- **自動清理**: 組件卸載時自動取消訂閱
- **類型安全**: 完整的 TypeScript 類型定義

## 架構設計

### 雙層監控架構

```
┌─────────────────────────────────────────────────────────────┐
│                    Realtime 監控系統                        │
├─────────────────────────────────────────────────────────────┤
│  📊 統一錯誤追蹤層                                          │
│  ├── useRealtimeErrorTracking                              │
│  ├── RealtimeStatusHandlers                                │
│  └── useRealtimeAlerts                                     │
├─────────────────────────────────────────────────────────────┤
│  🔄 業務層級監控                                            │
│  ├── 通知系統 (notifications)                              │
│  ├── 訂單系統 (orders)                                     │
│  ├── 庫存系統 (inventory)                                  │
│  ├── 訊息層級 (messages) - 監控 messages 表                │
│  └── 工單層級 (support-tickets) - 監控 conversations 表    │
└─────────────────────────────────────────────────────────────┘
```

### 核心組件

#### 1. 共用錯誤追蹤 (`useRealtimeErrorTracking`)

```typescript
// 所有 Realtime 模組的統一錯誤監控
const errorTracker = useRealtimeErrorTracking('module-name')
```

**關鍵功能**:
- 錯誤計數和時間窗口管理 (5分鐘窗口)
- 自動警報觸發機制 (3次錯誤觸發警報)
- 錯誤歷史記錄和分析
- 連線狀態標準化處理

#### 2. 狀態處理器 (`RealtimeStatusHandlers`)

```typescript
// 標準化的 Supabase Realtime 狀態處理
RealtimeStatusHandlers.handleSubscriptionStatus(
  status,
  errorTracker,
  onSuccess,
  onError
)
```

**標準化處理**:
- `SUBSCRIBED`: 連線成功
- `CHANNEL_ERROR`: 頻道錯誤  
- `TIMED_OUT`: 連線逾時
- `CLOSED`: 連線關閉

#### 3. 全域警報管理 (`useRealtimeAlerts`)

```typescript
// 跨模組的警報收集和管理
const realtimeAlertsManager = getGlobalRealtimeAlerts()
realtimeAlertsManager.recordRealtimeAlert('module-name', errorCount, lastError, errorHistory)
```

**警報等級**:
- `high`: 5次以上錯誤，15分鐘內
- `medium`: 3-4次錯誤，15分鐘內  
- `low`: 1-2次錯誤，15分鐘內

## 模組實現

### 訊息層級監控 (`useMessagesRealtime`)

**監控目標**: `messages` 表
**用途**: 單一對話內的訊息更新
**特點**: 基於 conversationId 的精確訂閱

```typescript
// 使用範例
const messagesRealtime = getGlobalMessagesRealtime()
await messagesRealtime.subscribeToConversation(conversationId, (event) => {
  console.log('訊息更新:', event)
})
```

### 工單層級監控 (`useSupportTicketsRealtime`)

**監控目標**: `conversations` 表
**用途**: 支援工單狀態變更
**特點**: 支援過濾條件的批量訂閱

```typescript
// 使用範例
const supportTicketsRealtime = getGlobalSupportTicketsRealtime()
await supportTicketsRealtime.subscribeToSupportTickets(
  `status=eq.${ConversationStatus.OPEN}`,
  (event) => {
    console.log('工單更新:', event)
  }
)
```

### 其他業務模組

- **通知系統** (`useNotification`): 用戶通知的即時推送
- **訂單系統** (`useOrderRealtime`): 訂單狀態變更監控
- **庫存系統** (`useInventoryRealtime`): 庫存數量變更追蹤

## 資料結構

### RealtimeErrorTracker 介面

```typescript
interface RealtimeErrorTracker {
  errorCount: Ref<number>
  lastError: Ref<string>
  errorHistory: Ref<ErrorRecord[]>
  
  recordError(error: any, type: string): void
  resetErrorStats(): void
  getErrorSummary(): ErrorSummary
}
```

### ErrorSummary 結構

```typescript
interface ErrorSummary {
  errorCount: number
  lastError: string
  errorHistory: ErrorRecord[]
  isHealthy: boolean
  alertLevel: 'none' | 'low' | 'medium' | 'high'
}
```

### 模組狀態結構

```typescript
interface ModuleStatus {
  totalSubscriptions: number
  connectedCount: number
  failedCount: number
  errorCount: number
  lastError: string
  isHealthy: boolean
}
```

## API 規格

### 全域實例獲取

```typescript
// 各模組的全域實例
const messagesRealtime = getGlobalMessagesRealtime()
const supportTicketsRealtime = getGlobalSupportTicketsRealtime()
const orderRealtime = getGlobalOrderRealtime()
const inventoryRealtime = getGlobalInventoryRealtime()
const realtimeAlerts = getGlobalRealtimeAlerts()
```

### 錯誤監控 API

```typescript
// 記錄錯誤
errorTracker.recordError(error, 'connection')

// 重置統計
errorTracker.resetErrorStats()

// 獲取摘要
const summary = errorTracker.getErrorSummary()
```

### 狀態查詢 API

```typescript
// 獲取連線摘要
const summary = moduleRealtime.getConnectionSummary()

// 檢查警報狀態  
const alertStatus = realtimeAlerts.getModuleAlertStatus('module-name')
```

## 用戶介面整合

### DevFloatingWidget 狀態顯示

```vue
<!-- 系統狀態視覺化 -->
<div class="realtime-status">
  <div v-for="(status, system) in systemStatuses" :key="system">
    <StatusIndicator 
      :isConnected="status.isConnected"
      :hasAlert="status.hasAlert"
      :hasSubscriptions="status.hasSubscriptions"
    />
    <span>{{ system }}</span>
  </div>
</div>
```

**狀態指示器顏色**:
- 🟢 綠色: 正常連線，無警報
- 🟡 黃色: 連線正常，有警報  
- 🔴 紅色: 連線異常，有活躍訂閱
- ⚪ 灰色: 已監控，無活躍訂閱

### 快速診斷功能

```typescript
// Console 診斷輸出
const performQuickDiagnosis = () => {
  console.group('🔍 Realtime 快速診斷')
  console.log('=== 各系統 Realtime 狀態總覽 ===')
  
  // 詳細狀態輸出
  Object.entries(systemStatuses.value).forEach(([system, status]) => {
    console.log(`${getSystemIcon(system)} ${system}: ${getStatusText(status)}`)
    console.log(`   - 訂閱數量: ${status.subscriptionCount}`)
    console.log(`   - 錯誤次數: ${status.errorCount}`)
  })
  
  console.groupEnd()
}
```

## 🔄 新增 Realtime 模組流程

### 1. 創建 Realtime Composable

```typescript
// src/composables/useNewModuleRealtime.ts
export const useNewModuleRealtime = () => {
  // 1. 使用共用錯誤監控
  const errorTracker = useRealtimeErrorTracking('new-module')
  
  // 2. 實現訂閱邏輯
  const subscribeToNewModule = (callback) => {
    return new Promise((resolve) => {
      try {
        const channel = supabase.channel('new-module')
          .on('postgres_changes', { /* config */ }, callback)
          .subscribe((status) => {
            RealtimeStatusHandlers.handleSubscriptionStatus(
              status, errorTracker, 
              () => resolve(true),
              () => resolve(false)
            )
          })
      } catch (error) {
        RealtimeStatusHandlers.handleSubscriptionError(error, errorTracker, 'subscription')
        resolve(false)
      }
    })
  }
  
  // 3. 返回標準 API
  return {
    subscribeToNewModule,
    unsubscribeFromNewModule,
    getConnectionSummary,
    // ... 其他標準方法
  }
}
```

### 2. 更新警報系統

```typescript
// 在 useRealtimeAlerts.ts 中添加新模組
interface RealtimeAlert {
  module: 'notifications' | 'orders' | 'inventory' | 'messages' | 'support-tickets' | 'new-module'
  // ...
}

const MODULE_DISPLAY_NAMES = {
  // ...
  'new-module': '新模組系統'
} as const
```

### 3. 整合到 DevFloatingWidget

```typescript
// 在 getSystemRealtimeStatuses() 中添加
const newModuleRealtime = getGlobalNewModuleRealtime()
const newModuleSummary = newModuleRealtime.getConnectionSummary()
const newModuleAlert = realtimeAlertsManager.getModuleAlertStatus('new-module')

return {
  // ...
  newModule: {
    isConnected: newModuleSummary.isHealthy,
    hasAlert: newModuleAlert.hasAlert,
    hasSubscriptions: newModuleSummary.totalSubscriptions > 0
  }
}
```

### 4. 添加視覺化狀態

```vue
<!-- 在 DevFloatingWidget.vue 模板中添加 -->
<div class="flex items-center justify-between">
  <span class="flex items-center">
    <StatusDot :status="systemStatuses.newModule" />
    新模組系統
  </span>
  <StatusText :status="systemStatuses.newModule" />
</div>
```

## 實現細節深度解析

### 共用錯誤追蹤機制

#### 時間窗口算法
```typescript
// 5分鐘滑動窗口實現
const errorWindow = 5 * 60 * 1000 // 5分鐘毫秒數
const now = new Date()
const windowStart = now.getTime() - errorWindow

const recentErrors = errorHistory.value.filter(
  entry => new Date(entry.timestamp).getTime() > windowStart
)
```

#### 智能閾值計算
- **動態調整**: 根據系統負載自動調整錯誤閾值
- **歷史學習**: 基於過去24小時的錯誤模式優化觸發邏輯
- **環境感知**: 開發/測試/生產環境使用不同的容錯標準

### 狀態處理器設計模式

#### 策略模式實現
```typescript
const statusStrategies = {
  'SUBSCRIBED': (errorTracker, onConnected) => {
    errorTracker.resetErrorStats()
    console.log('✅ Realtime 連線成功')
    onConnected?.()
  },
  'CHANNEL_ERROR': (errorTracker, onDisconnected) => {
    console.warn('⚠️ Realtime 頻道錯誤')
    errorTracker.recordError('Channel error', 'channel')
    onDisconnected?.()
  }
  // ... 其他狀態策略
}
```

#### 責任鏈模式
- **錯誤分類**: 根據錯誤類型選擇不同的處理策略
- **優先級處理**: 高優先級錯誤優先處理和上報
- **降級策略**: 多層次的錯誤處理和服務降級

### 雙重保障實現原理

#### Promise 鏈式保障
```typescript
// 主要方法嘗試
const tryPrimaryMethod = () => {
  return messagesRealtime.subscribeToConversation(conversationId, callback)
}

// 備援方法執行
const executeFallback = () => {
  console.warn('🔄 主要方法失敗，啟動備援機制')
  return originalSubscribeMethod(conversationId, callback)
}

// 鏈式保障邏輯
tryPrimaryMethod()
  .then(success => success || executeFallback())
  .catch(() => executeFallback())
```

#### 狀態同步機制
- **雙向同步**: 主要和備援方法的狀態保持一致
- **事件代理**: 統一的事件分發機制
- **資源共享**: 避免重複資源占用

### 全域實例管理

#### 單例模式優化
```typescript
// 懶初始化單例
let globalInstance: RealtimeInstance | null = null

export const getGlobalInstance = () => {
  if (!globalInstance) {
    globalInstance = createRealtimeInstance()
  }
  return globalInstance
}

// 避免循環依賴的依賴注入
const createRealtimeInstance = () => {
  const errorTracker = useRealtimeErrorTracking(moduleName)
  const alertsManager = getGlobalRealtimeAlerts()
  
  return new RealtimeInstance(errorTracker, alertsManager)
}
```

#### 生命週期管理
- **延遲清理**: 組件卸載後延遲清理全域實例
- **引用計數**: 追蹤實例使用數量，零引用時清理
- **內存監控**: 定期檢查內存使用情況

### DevFloatingWidget 診斷算法

#### 健康度評分算法
```typescript
const calculateSystemHealth = (statuses) => {
  let totalScore = 0
  let maxScore = 0
  
  Object.values(statuses).forEach(status => {
    maxScore += 100
    
    if (status.isConnected) {
      totalScore += status.hasAlert ? 70 : 100
    } else {
      totalScore += status.hasSubscriptions ? 30 : 80
    }
  })
  
  return Math.round((totalScore / maxScore) * 100)
}
```

#### 智能問題檢測
- **模式識別**: 識別常見的錯誤模式和趨勢
- **關聯分析**: 分析不同系統間的錯誤關聯性
- **預測性維護**: 基於歷史數據預測潛在問題

## 效能與優化

### 連線管理策略

1. **全域實例**: 避免重複創建 Realtime 連線
2. **懶加載**: 只在需要時建立連線
3. **自動清理**: 組件卸載時自動取消訂閱
4. **錯誤重試**: 智能重連機制

### 錯誤處理最佳實踐

```typescript
// 統一錯誤處理模式
try {
  // Realtime 操作
} catch (error) {
  console.error('Realtime 操作失敗:', error)
  RealtimeStatusHandlers.handleSubscriptionError(error, errorTracker, 'operation')
  // 不要直接拋出錯誤，而是記錄並繼續執行
}
```

### 記憶體優化

- 使用 `WeakMap` 管理回調函數
- 及時清理無用的訂閱
- 限制錯誤歷史記錄數量 (最多50條)

## 🧪 測試策略

### 單元測試

```typescript
// 測試錯誤追蹤功能
describe('useRealtimeErrorTracking', () => {
  it('should record errors correctly', () => {
    const errorTracker = useRealtimeErrorTracking('test')
    errorTracker.recordError(new Error('test'), 'connection')
    expect(errorTracker.errorCount.value).toBe(1)
  })
})
```

### 整合測試

```typescript
// 測試 Realtime 連線
describe('Realtime Integration', () => {
  it('should handle connection status correctly', async () => {
    const realtime = useMessagesRealtime()
    const success = await realtime.subscribeToConversation('test-id', jest.fn())
    expect(success).toBe(true)
  })
})
```

### E2E 測試

- 驗證 DevFloatingWidget 狀態顯示
- 測試錯誤警報觸發機制
- 確認重連功能正常運作

## 🔮 未來規劃

### Phase 1: 擴展監控覆蓋
- 添加更多業務模組監控
- 增強錯誤分析功能
- 優化警報觸發邏輯

### Phase 2: 智能診斷
- 自動診斷連線問題
- 智能建議修復方案
- 效能監控和優化建議

### Phase 3: 監控儀表板
- 獨立的監控管理介面
- 歷史數據分析
- 警報配置管理

## 故障排除

### 常見問題

#### 1. Vue 生命週期警告
```
[Vue warn]: onUnmounted is called when there is no active component instance
```

**解決方案**: 
```typescript
const instance = getCurrentInstance()
if (instance) {
  onUnmounted(() => {
    // 清理邏輯
  })
}
```

#### 2. 重複訂閱問題
```typescript
// 檢查現有訂閱
if (channels.has(channelName)) {
  return existingSubscription
}
```

#### 3. 錯誤統計不準確
- 檢查時間窗口設置 (預設5分鐘)
- 確認錯誤類型分類正確
- 驗證重置邏輯執行

### 調試工具

1. **DevFloatingWidget**: 即時狀態監控
2. **Console 診斷**: 詳細錯誤資訊
3. **Supabase Dashboard**: 連線狀態檢查
4. **Vue DevTools**: 組件狀態檢查

## 設計原則與技術決策

### 核心設計原則

#### 1. 統一性原則 (Consistency First)
所有 Realtime 模組必須使用相同的錯誤處理、狀態管理和警報機制：

```typescript
// ✅ 正確：統一的錯誤處理
const errorTracker = useRealtimeErrorTracking('module-name')
RealtimeStatusHandlers.handleSubscriptionStatus(status, errorTracker, onSuccess, onError)

// ❌ 錯誤：自定義錯誤處理
const customErrorHandler = (error) => { /* 各模組不同的處理邏輯 */ }
```

#### 2. 漸進增強原則 (Progressive Enhancement)
系統必須在任何情況下都能正常工作，錯誤監控是增強功能而非必需依賴：

```typescript
// 主要功能
const success = await subscribeWithMonitoring()
if (!success) {
  // 備援功能確保系統可用
  await subscribeWithoutMonitoring()
}
```

#### 3. 可觀測性優先 (Observability First)
所有操作都必須提供完整的日誌和狀態追蹤：

```typescript
console.log('🔄 開始 Realtime 訂閱', { module, params })
console.log('✅ 訂閱成功', { subscriptionId, timestamp })
console.warn('⚠️ 訂閱失敗，啟動備援', { error, fallbackMethod })
```

### 技術決策說明

#### 為什麼選擇滑動窗口而非固定窗口？
- **平滑性**: 避免窗口邊界的突變效應
- **準確性**: 更好地反映實際錯誤頻率
- **即時性**: 錯誤恢復後能立即反映系統健康狀況

#### 為什麼採用 3 次錯誤閾值？
- **平衡性**: 在誤報和漏報之間找到最佳平衡點
- **經驗值**: 基於實際網路環境的測試結果
- **可調整**: 可根據不同環境和業務需求調整

#### 為什麼需要雙重保障機制？
- **穩定性**: 確保核心功能在任何情況下都可用
- **漸進式**: 允許系統逐步從傳統方案過渡到新架構
- **風險控制**: 降低新功能對現有系統的影響

### 架構演進策略

#### Phase 1: 基礎監控 (已完成)
- 統一錯誤追蹤機制
- 基本的警報系統
- DevFloatingWidget 狀態監控

#### Phase 2: 智能診斷 (規劃中)
- 自動問題檢測和修復建議
- 錯誤模式識別和預測
- 效能瓶頸分析和優化建議

#### Phase 3: 自動化運維 (未來)
- 自動重連和故障恢復
- 動態負載均衡
- 智能告警降噪

## 🎓 最佳實踐

### 開發建議

#### 1. 一致性實踐
所有 Realtime 模組必須遵循統一模式：

```typescript
// 標準模組結構
export const useModuleRealtime = () => {
  const errorTracker = useRealtimeErrorTracking('module')
  
  const subscribe = (params, callback) => {
    return new Promise((resolve) => {
      try {
        const channel = supabase.channel('module')
          .on('postgres_changes', config, callback)
          .subscribe((status) => {
            RealtimeStatusHandlers.handleSubscriptionStatus(
              status, errorTracker, 
              () => resolve(true),
              () => resolve(false)
            )
          })
      } catch (error) {
        RealtimeStatusHandlers.handleSubscriptionError(error, errorTracker)
        resolve(false)
      }
    })
  }
  
  return { subscribe, getConnectionSummary, setupAutoCleanup }
}
```

#### 2. 擴展性設計
新增模組時遵循標準化流程：

1. **創建 Composable** (2分鐘)
2. **註冊警報模組** (1分鐘)
3. **整合 DevFloatingWidget** (2分鐘)

#### 3. 可測試性要求
每個模組必須提供完整測試覆蓋：

```typescript
describe('useModuleRealtime', () => {
  it('should handle connection success', async () => {
    const realtime = useModuleRealtime()
    const success = await realtime.subscribe('test', jest.fn())
    expect(success).toBe(true)
  })
  
  it('should record errors on failure', async () => {
    // 測試錯誤處理邏輯
  })
})
```

#### 4. 文檔化標準

### 維護指引

1. **定期檢查**: 監控系統健康度指標
2. **錯誤分析**: 定期分析錯誤模式和趨勢
3. **效能優化**: 監控連線數和資源使用
4. **版本更新**: 跟隨 Supabase Realtime 更新

---

*本文件隨系統演進持續更新，確保架構文檔與實際實現保持一致。*