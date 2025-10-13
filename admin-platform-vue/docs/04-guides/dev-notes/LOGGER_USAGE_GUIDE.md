# Logger 系統使用指南

## 📋 概述

本專案已實施統一的 Logger 系統，用於管理所有日誌輸出，支援環境感知的日誌控制，避免在生產環境洩漏調試資訊。

### 核心優勢

- ✅ **環境自動判斷** - 開發環境顯示詳細日誌，生產環境僅顯示錯誤
- ✅ **日誌等級控制** - DEBUG/INFO/WARN/ERROR/SILENT 五個等級
- ✅ **模組化前綴** - 自動添加模組和子模組標籤，方便追蹤來源
- ✅ **零配置使用** - 預設配置即可使用，無需額外設定
- ✅ **TypeScript 類型安全** - 完整的類型定義和 IDE 智能提示

---

## 🚀 快速開始

### 基本使用 (全域 Logger)

適用於不需要特定模組前綴的場景：

```typescript
import { logger } from '@/utils/logger'

// 調試日誌 (僅開發環境)
logger.debug('用戶資料載入完成', { userId: 123 })

// 一般資訊
logger.info('API 調用成功')

// 警告訊息
logger.warn('庫存不足', { productId: 456 })

// 錯誤訊息 (生產環境也會輸出)
logger.error('API 調用失敗', error)
```

### 模組專用 Logger

適用於需要明確標示模組來源的場景：

```typescript
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('API', 'Users')

log.debug('開始查詢用戶列表')
log.info('成功載入 50 筆用戶資料')
log.warn('查詢結果超過 1000 筆，建議添加分頁')
log.error('查詢失敗', error)
```

**輸出範例** (開發環境):
```
🔍 [14:25:30] [API:Users] 開始查詢用戶列表
🔧 [14:25:31] [API:Users] 成功載入 50 筆用戶資料
⚠️ [14:25:31] [API:Users] 查詢結果超過 1000 筆，建議添加分頁
```

---

## ⚙️ 環境變數配置

### 開發環境 (.env.local)

```bash
# 顯示所有日誌
VITE_LOG_LEVEL=debug

# 啟用路由調試
VITE_ENABLE_ROUTER_DEBUG=true
```

### 生產環境 (.env.production)

```bash
# 僅顯示錯誤
VITE_LOG_LEVEL=error

# 關閉路由調試
VITE_ENABLE_ROUTER_DEBUG=false
```

### 日誌等級說明

| 等級 | 說明 | 開發環境 | 生產環境 |
|------|------|----------|----------|
| `debug` | 詳細調試資訊 | ✅ 顯示 | ❌ 隱藏 |
| `info` | 一般操作資訊 | ✅ 顯示 | ⚠️ 按需配置 |
| `warn` | 警告訊息 | ✅ 顯示 | ⚠️ 按需配置 |
| `error` | 錯誤訊息 | ✅ 顯示 | ✅ 顯示 |
| `silent` | 完全靜默 | ❌ 不建議 | ⚠️ 按需使用 |

---

## 📚 常見使用場景

### 1. 路由守衛調試

```typescript
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Router', 'Navigation')

router.beforeEach(async (to, from, next) => {
  log.routerDebug('開始權限檢查', { path: to.path })

  if (hasPermission) {
    log.routerDebug('權限檢查通過')
    next()
  } else {
    log.warn('權限不足', { requiredPermission })
    next('/unauthorized')
  }
})
```

**特點**: `routerDebug` 方法受 `VITE_ENABLE_ROUTER_DEBUG` 控制，生產環境自動關閉。

### 2. API 調用追蹤

```typescript
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('API', 'Orders')

export async function fetchOrders() {
  log.debug('開始查詢訂單')

  try {
    const { data, error } = await supabase.from('orders').select()

    if (error) {
      log.error('訂單查詢失敗', error)
      return { success: false, error }
    }

    log.info('訂單查詢成功', { count: data.length })
    return { success: true, data }
  } catch (error) {
    log.error('訂單查詢異常', error)
    return { success: false, error }
  }
}
```

### 3. 組件生命週期調試

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Component', 'OrderList')

onMounted(() => {
  log.debug('組件已掛載，開始載入資料')
  loadOrders()
})

onUnmounted(() => {
  log.debug('組件已卸載，清理資源')
  cleanup()
})
</script>
```

### 4. 錯誤邊界處理

```typescript
import { logger } from '@/utils/logger'

try {
  await performCriticalOperation()
} catch (error) {
  // 關鍵錯誤，生產環境也需要記錄
  logger.error('關鍵操作失敗', error, {
    operation: 'performCriticalOperation',
    timestamp: Date.now()
  })

  // 顯示用戶友好的錯誤訊息
  toast.error('操作失敗', '請稍後重試或聯繫技術支援')
}
```

---

## 🔧 進階功能

### 效能計時器

用於測量操作執行時間（僅開發環境）：

```typescript
import { performanceTimer } from '@/utils/logger'

async function loadHeavyData() {
  const stopTimer = performanceTimer('載入大量資料')

  await fetchHugeDataset()

  stopTimer() // 輸出: ⏱️ [Performance] 載入大量資料: 1235.45ms
}
```

### 群組日誌

用於組織相關日誌（僅開發環境）：

```typescript
import { logGroup } from '@/utils/logger'

async function processOrder(orderId: string) {
  const endGroup = logGroup(`處理訂單 ${orderId}`)

  logger.debug('驗證訂單資料')
  logger.debug('計算總金額')
  logger.debug('更新庫存')
  logger.info('訂單處理完成')

  endGroup()
}
```

**輸出範例**:
```
📦 處理訂單 ORD-2025-001
  🔍 驗證訂單資料
  🔍 計算總金額
  🔍 更新庫存
  🔧 訂單處理完成
```

### 表格日誌

用於顯示結構化資料（僅開發環境）：

```typescript
import { logTable } from '@/utils/logger'

const users = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob', role: 'User' }
]

logTable('用戶列表', users)
```

### 條件式日誌

```typescript
import { logIf } from '@/utils/logger'

// 僅在開發環境輸出
logIf(import.meta.env.DEV, 'debug', '開發專用訊息')

// 根據特定條件輸出
logIf(process.env.VITE_ENABLE_VERBOSE_LOGGING === 'true', 'info', '詳細日誌')
```

### 執行時配置更新

```typescript
import { updateLoggerConfig, getLoggerConfig } from '@/utils/logger'

// 查看當前配置
console.log(getLoggerConfig())
// {
//   level: LogLevel.DEBUG,
//   enableRouterDebug: true,
//   enableModulePrefix: true,
//   enableTimestamp: true
// }

// 臨時調整配置（如開發工具面板）
updateLoggerConfig({
  enableRouterDebug: false,
  level: LogLevel.INFO
})
```

---

## 🎯 最佳實踐

### 1. 選擇合適的日誌等級

```typescript
// ✅ 正確：調試資訊用 debug
log.debug('載入配置', config)

// ❌ 錯誤：調試資訊用 info（會在生產環境輸出）
log.info('載入配置', config)

// ✅ 正確：重要操作完成用 info
log.info('訂單建立成功', { orderId })

// ✅ 正確：潛在問題用 warn
log.warn('API 響應時間過長', { duration: 5000 })

// ✅ 正確：錯誤和異常用 error
log.error('資料庫連線失敗', error)
```

### 2. 使用有意義的模組名稱

```typescript
// ✅ 正確：清楚的模組層級
const log = createModuleLogger('API', 'OrderService')
const log = createModuleLogger('Store', 'Auth')
const log = createModuleLogger('Router', 'Navigation')
const log = createModuleLogger('Component', 'OrderList')

// ❌ 錯誤：模糊的模組名稱
const log = createModuleLogger('Utils', 'Helper')
const log = createModuleLogger('App', 'Main')
```

### 3. 適當的資料結構

```typescript
// ✅ 正確：提供結構化的附加資料
log.debug('用戶登入', {
  userId: user.id,
  email: user.email,
  timestamp: Date.now()
})

// ❌ 錯誤：將資料混入訊息字串
log.debug(`用戶 ${user.id} (${user.email}) 在 ${Date.now()} 登入`)

// ✅ 正確：錯誤物件作為第二個參數
log.error('API 調用失敗', error, { endpoint: '/api/orders' })
```

### 4. 避免敏感資訊

```typescript
// ❌ 危險：記錄密碼、Token 等敏感資訊
log.debug('用戶登入', { password: userPassword })
log.info('API 請求', { headers: { Authorization: token } })

// ✅ 安全：脫敏處理
log.debug('用戶登入', { email: user.email })
log.info('API 請求', { endpoint: '/api/orders' })
```

---

## 🔄 遷移指南

### 從 console 遷移到 logger

#### Before (舊代碼)

```typescript
console.log('載入用戶資料', userData)
console.warn('資料不完整')
console.error('載入失敗:', error)
```

#### After (新代碼)

```typescript
import { logger } from '@/utils/logger'

logger.debug('載入用戶資料', userData)
logger.warn('資料不完整')
logger.error('載入失敗', error)
```

### 批量替換建議

```bash
# 使用 VS Code 搜尋替換功能
# 搜尋: console\.log\((.*?)\)
# 替換: logger.debug($1)

# 搜尋: console\.error\((.*?),\s*(.*?)\)
# 替換: logger.error($1, $2)
```

---

## 📊 驗證與測試

### 開發環境驗證

1. **設定開發環境變數** (.env.local):
   ```bash
   VITE_LOG_LEVEL=debug
   VITE_ENABLE_ROUTER_DEBUG=true
   ```

2. **運行開發伺服器**:
   ```bash
   npm run dev
   ```

3. **檢查 Console 輸出**:
   - 應該看到帶有圖示和時間戳的日誌
   - 路由導航應顯示詳細的權限檢查日誌
   - 日誌前綴應該包含模組名稱

### 生產環境驗證

1. **設定生產環境變數** (.env.production):
   ```bash
   VITE_LOG_LEVEL=error
   VITE_ENABLE_ROUTER_DEBUG=false
   ```

2. **建置生產版本**:
   ```bash
   npm run build
   ```

3. **預覽生產版本**:
   ```bash
   npm run preview
   ```

4. **檢查 Console 輸出**:
   - 應該僅看到 ERROR 等級的日誌
   - 路由調試日誌應完全關閉
   - Debug 和 Info 日誌應不可見

### 自動化測試腳本

建立測試腳本 `scripts/test-logger.ts`:

```typescript
import { logger, createModuleLogger, getLoggerConfig } from '@/utils/logger'

console.log('=== Logger 系統測試 ===\n')

console.log('當前配置:', getLoggerConfig())
console.log('')

console.log('測試全域 Logger:')
logger.debug('這是 debug 日誌')
logger.info('這是 info 日誌')
logger.warn('這是 warn 日誌')
logger.error('這是 error 日誌', new Error('測試錯誤'))
console.log('')

console.log('測試模組 Logger:')
const log = createModuleLogger('Test', 'Module')
log.debug('模組 debug 日誌')
log.info('模組 info 日誌')
log.warn('模組 warn 日誌')
log.error('模組 error 日誌', new Error('測試錯誤'))
console.log('')

console.log('=== 測試完成 ===')
```

---

## ⚠️ 常見問題

### Q1: Logger 輸出沒有顯示？

**A**: 檢查環境變數配置：
- 確認 `VITE_LOG_LEVEL` 設定正確
- 開發環境應設為 `debug` 或 `info`
- 檢查是否正確載入 .env.local

### Q2: 生產環境仍顯示調試日誌？

**A**: 確認：
- `.env.production` 中 `VITE_LOG_LEVEL=error`
- 建置時使用正確的環境：`npm run build`
- 清除瀏覽器快取後重新測試

### Q3: 如何在生產環境臨時啟用調試？

**A**: 使用瀏覽器 Console:
```javascript
import { updateLoggerConfig } from '@/utils/logger'
updateLoggerConfig({ level: 0 }) // 0 = DEBUG
```

### Q4: 路由調試日誌無法關閉？

**A**: 確認：
- 使用 `log.routerDebug()` 而非 `log.debug()`
- `.env.production` 中設定 `VITE_ENABLE_ROUTER_DEBUG=false`
- 重新建置應用程式

---

## 📖 相關資源

- **Logger 原始碼**: `src/utils/logger.ts`
- **環境變數範例**: `.env.example`
- **遷移案例**:
  - 路由守衛: `src/router/index.ts`
  - 認證工具: `src/utils/auth.ts`
  - Auth Store: `src/store/auth.ts`

---

## 🎓 總結

### 核心要點

1. ✅ **統一使用 logger** - 禁止直接使用 console
2. ✅ **正確選擇等級** - debug/info/warn/error
3. ✅ **模組化命名** - 清楚標示來源
4. ✅ **環境感知** - 生產環境僅輸出錯誤
5. ✅ **安全第一** - 避免記錄敏感資訊

### 下一步

- [ ] 遷移剩餘的 console 使用
- [ ] 在 ESLint 中添加 no-console 規則
- [ ] 整合第三方錯誤追蹤服務 (如 Sentry)
- [ ] 建立日誌分析儀表板

---

**文檔版本**: 1.0.0
**最後更新**: 2025-10-05
**維護者**: 開發團隊
