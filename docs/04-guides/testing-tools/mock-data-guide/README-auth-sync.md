# 用戶認證與智能同步機制

## 概述

本文檔詳細說明了電商系統中用戶認證與業務資料同步的優化方案。該方案解決了 Supabase Auth 與業務資料庫記錄同步的核心問題，並提供了高效的快取、重試和狀態管理機制。

## 核心設計理念

### 認證狀態與業務資料分離

```typescript
// 認證狀態 (authUser) - 來自 Supabase Auth
interface AuthUser {
  id: string
  email: string
  lastSignInAt: string
  userMetadata: {
    avatarUrl: string
    email: string
    fullName: string
    name: string
  }
}

// 業務資料 (user) - 來自 customers 表
interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  // ...其他業務欄位
}
```

**分離的好處：**
- **即時認證反饋**：`authUser` 立即可用，UI 可以立刻顯示登入狀態
- **業務資料獨立**：`user` 通過同步機制載入，不影響認證流程
- **狀態清晰**：`isAuthenticated` 基於 `authUser`，不依賴業務資料

## 智能同步機制

### 1. 同步需求檢查 (needsSync)

```typescript
async function needsSync(authUser: SupabaseUser): Promise<{
  needsSync: boolean
  reason?: string
}> {
  // 檢查客戶記錄是否存在
  const customerExists = await checkCustomerRecordExists(authUser.id)
  
  if (!customerExists) {
    return { needsSync: true, reason: 'customer_record_missing' }
  }
  
  // 檢查 user_metadata 是否有更新
  const lastSyncTime = customerRecordCache.get(`customer_exists:${authUser.id}`)?.timestamp
  const userUpdatedAt = new Date(authUser.updated_at || authUser.created_at).getTime()
  
  if (lastSyncTime && userUpdatedAt > lastSyncTime) {
    return { needsSync: true, reason: 'user_metadata_updated' }
  }
  
  return { needsSync: false }
}
```

**檢查邏輯：**
1. **客戶記錄存在性檢查**：驗證 `customers` 表中是否有對應記錄
2. **元資料更新檢查**：比較用戶元資料更新時間與上次同步時間
3. **錯誤安全**：檢查失敗時假設需要同步

### 2. 智能同步執行 (smartSync)

```typescript
async function smartSync(
  authUser: SupabaseUser,
  profile: Record<string, any> = {},
  maxRetries = 3
): Promise<ApiResponse> {
  // 1. 檢查是否需要同步
  const syncCheck = await needsSync(authUser)
  
  if (!syncCheck.needsSync) {
    console.log('同步檢查：不需要同步')
    syncState.value.status = 'success'
    return { success: true, data: null }
  }
  
  // 2. 設置同步狀態
  syncState.value.status = 'syncing'
  
  // 3. 重試邏輯（指數退避）
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await syncCustomerRecord(profile)
      
      if (result.success) {
        // 4. 更新狀態和快取
        syncState.value.status = 'success'
        syncState.value.lastSyncTime = Date.now()
        customerRecordCache.set(`customer_exists:${authUser.id}`, {
          exists: true,
          timestamp: Date.now()
        })
        return result
      }
    } catch (error) {
      // 指數退避等待
      const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  syncState.value.status = 'error'
  return { success: false, error: 'Max retries exceeded' }
}
```

**同步特點：**
- **避免重複調用**：先檢查是否需要同步
- **指數退避重試**：1s → 2s → 4s → 5s
- **狀態追踪**：同步過程中的狀態變化
- **快取更新**：成功後更新快取避免重複檢查

## 快取機制

### 1. 用戶資料快取

```typescript
const userCache = new Map<string, { user: User; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分鐘

export async function getUserIdByAuthId(authId: string): Promise<string | null> {
  const cached = userCache.get(`authId:${authId}`)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.user.id
  }
  
  // 從資料庫查詢...
}
```

### 2. 客戶記錄存在性快取

```typescript
const customerRecordCache = new Map<string, { exists: boolean; timestamp: number }>()
const CUSTOMER_RECORD_CACHE_DURATION = 10 * 60 * 1000 // 10分鐘

async function checkCustomerRecordExists(authUserId: string): Promise<boolean> {
  const cacheKey = `customer_exists:${authUserId}`
  const cached = customerRecordCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CUSTOMER_RECORD_CACHE_DURATION) {
    return cached.exists
  }
  
  // 查詢資料庫...
}
```

**快取策略：**
- **用戶資料**：5分鐘快取，常用於查詢轉換
- **存在性檢查**：10分鐘快取，減少重複的存在性查詢
- **自動過期**：基於時間戳的 TTL 機制

## 同步狀態管理

### 狀態定義

```typescript
type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface SyncState {
  status: SyncStatus
  error?: string
  lastSyncTime?: number
  retryCount: number
}
```

### 狀態流轉

```
idle (待同步)
  ↓
syncing (同步中)
  ↓
success (已同步) / error (同步失敗)
  ↓
[手動重試] → syncing
```

### UI 顯示邏輯

| 狀態 | 顯示文字 | 圖標 | 操作 |
|------|----------|-------|------|
| `idle` | 待同步 | 灰色圓點 | - |
| `syncing` | 同步中 (重試 N) | 藍色轉圈 | - |
| `success` | 已同步 | 綠色圓點 | 顯示時間 |
| `error` | 同步失敗 | 紅色圓點 | 重試按鈕 |

## 認證流程

### 1. 註冊流程

```typescript
async function signUpWithEmail(email: string, password: string) {
  // 1. Supabase Auth 註冊
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        custom: {
          avatar_url: await getRandomAvatarUrl(),
        }
      }
    }
  })
  
  // 2. 立即設置 authUser
  if (data.user) {
    authUser.value = handleSessionUserToAuthUser(data.user)
  }
  
  // 3. 自動同步將在 auth state change 中觸發
  return { success: true, session: mappedSession }
}
```

### 2. 登入流程

```typescript
async function signInWithEmail(email: string, password: string) {
  // 1. Supabase Auth 登入
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  // 2. 立即設置 authUser
  if (data.user) {
    authUser.value = handleSessionUserToAuthUser(data.user)
  }
  
  return { success: true, session: mappedSession }
}
```

### 3. 認證狀態監聽

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "SIGNED_IN" && session?.user) {
    // 1. 立即設置 authUser
    authUser.value = handleSessionUserToAuthUser(session.user)
    
    // 2. 智能同步並等待完成
    await smartSync(session.user, {})
    
    // 3. 獲取用戶資料
    const result = await handleUserSessionData(session.user, getUserIdByAuthId, getUser)
    user.value = result.user
  }
  
  if (event === "SIGNED_OUT") {
    user.value = null
    authUser.value = null
    syncState.value.status = 'idle'
  }
})
```

### 4. 頁面重新載入

```typescript
async function initAuthState() {
  const sessionValid = await checkAndRefreshSession()
  
  if (sessionValid) {
    const { data } = await supabase.auth.getSession()
    
    if (data?.session) {
      const { user: userValue, authUser: authUserValue } = await handleUserSessionData(
        data.session.user,
        getUserIdByAuthId,
        getUser
      )
      
      user.value = userValue
      authUser.value = authUserValue
      
      // 根據載入結果設置同步狀態
      if (authUserValue && userValue) {
        syncState.value.status = 'success'
        syncState.value.lastSyncTime = Date.now()
      } else if (authUserValue && !userValue) {
        syncState.value.status = 'error'
        syncState.value.error = '用戶資料載入失敗，可能需要重新同步'
      }
    }
  }
}
```

## Edge Function 優化

### sync-customer-record 功能

```typescript
// 主要功能
export default async function handler(req: Request) {
  // 1. 驗證用戶身份
  const user = await validateAuthUser(req)
  
  // 2. 檢查客戶記錄是否存在
  const existing = await findCustomerByAuthId(user.id)
  
  if (existing) {
    // 3a. 更新現有記錄
    await updateCustomerRecord(existing.id, userData)
  } else {
    // 3b. 創建新記錄
    await createCustomerRecord(userData)
  }
  
  // 4. 更新用戶 metadata
  await updateUserMetadata(user.id, { role_type: "customer" })
  
  return createSuccessResponse({ action: existing ? "updated" : "created" })
}
```

### 錯誤處理改進

- **標準化錯誤回應**：統一的錯誤格式和狀態碼
- **詳細錯誤日誌**：記錄錯誤詳情便於調試
- **優雅降級**：metadata 更新失敗不影響主要流程

## 問題解決歷程

### 1. 認證狀態不更新問題

**問題**：註冊/登入成功後 `isAuthenticated` 沒有立即變為 `true`

**原因**：Store 中的 `isAuthenticated` 基於 `user.value` 而不是 `authUser.value`

**解決**：
```typescript
// 修改前 (store/auth.ts)
const isAuthenticated = computed(() => !!user.value)

// 修改後 - 使用 composable 中的正確實現
const { isAuthenticated } = useAuth() // 基於 authUser.value
```

### 2. 用戶資料不顯示問題

**問題**：`isAuthenticated` 為 `true` 但用戶 email 等資料不顯示

**原因**：同步是異步進行，但用戶資料獲取在同步完成前執行

**解決**：
```typescript
// 修改認證監聽器，等待同步完成
if (event === "SIGNED_IN" && session?.user) {
  authUser.value = handleSessionUserToAuthUser(session.user)
  
  // 等待同步完成再獲取用戶資料
  await smartSync(session.user, {})
  
  const result = await handleUserSessionData(...)
  user.value = result.user
}
```

### 3. 頁面重載顯示"未同步"問題

**問題**：登入後重新整理頁面，同步狀態顯示"未同步"

**原因**：`initAuthState` 沒有根據用戶資料載入情況設置同步狀態

**解決**：
```typescript
// 在 initAuthState 中設置正確的同步狀態
if (authUserValue && userValue) {
  syncState.value.status = 'success'
} else if (authUserValue && !userValue) {
  syncState.value.status = 'error'
}
```

## 最佳實踐

### 1. 使用建議

- **認證檢查**：使用 `isAuthenticated` 判斷登入狀態
- **資料存取**：檢查 `user.value` 是否存在再使用業務資料
- **同步狀態**：監聽 `syncState` 提供用戶回饋
- **錯誤處理**：提供重試機制給用戶

### 2. 性能優化

- **快取利用**：相同的查詢會自動使用快取
- **智能同步**：避免不必要的 API 調用
- **並行處理**：認證和資料載入分別進行

### 3. 調試建議

```typescript
// 開發時可以啟用詳細日誌
console.log('Auth State:', {
  isAuthenticated: auth.isAuthenticated,
  hasAuthUser: !!auth.authUser,
  hasUser: !!auth.user,
  syncStatus: auth.getSyncStatus()
})
```

### 4. 錯誤排查

| 症狀 | 可能原因 | 檢查項目 |
|------|----------|----------|
| 登入後不顯示已登入 | authUser 未設置 | 檢查 auth state change 監聽器 |
| 用戶資料不載入 | 同步失敗 | 檢查 sync status 和 network 請求 |
| 重複同步調用 | needsSync 邏輯錯誤 | 檢查快取和時間戳比較 |
| 同步狀態不更新 | 狀態設置時機錯誤 | 檢查各個流程中的狀態設置 |

## 相關檔案

### 核心實現
- `src/composables/useAuth.ts` - 主要認證邏輯
- `src/store/auth.ts` - Pinia store 包裝
- `src/components/SyncStatusIndicator.vue` - 同步狀態 UI
- `supabase/functions/sync-customer-record/index.ts` - 同步 Edge Function

### 測試相關
- `src/api/seedFaker.ts` - 測試資料生成
- `src/App.vue` - 開發測試介面

## 總結

這個認證與同步機制提供了：

1. **可靠的認證體驗**：認證狀態與業務資料分離，提供即時回饋
2. **高效的同步機制**：智能檢查、快取優化、自動重試
3. **清晰的狀態管理**：完整的同步狀態追踪和 UI 回饋
4. **優雅的錯誤處理**：重試機制和錯誤恢復
5. **良好的開發體驗**：詳細的日誌和調試資訊

通過這個方案，成功解決了 Supabase Auth 與業務資料庫同步的核心挑戰，為用戶提供了流暢的認證體驗。