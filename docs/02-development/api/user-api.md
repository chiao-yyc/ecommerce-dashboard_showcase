# UserApiService API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐ (權限系統核心)

---
## 概覽

### 業務用途
UserApiService 是用戶管理系統的核心 API 服務，負責處理用戶的完整生命週期管理，包含用戶 CRUD 操作、角色關聯管理、搜尋查詢和權限控制。它是整個 RBAC (Role-Based Access Control) 權限系統的基礎服務。

### 核心功能
- **用戶 CRUD 操作** - 完整的用戶資料增刪改查
- **分頁查詢與搜尋** - 支援角色篩選、關鍵字搜尋、排序
- **角色關聯管理** - 用戶角色的設定與移除
- **關鍵字搜尋** - 快速搜尋用戶（支援 email 和姓名）
- **用戶詳情查詢** - 含角色資訊的完整用戶資料

### 技術架構
- **繼承**: `BaseApiService<User, DbUserDetail>`
- **資料表**:
  - `users` (主表) - 用戶基本資訊
  - `user_details` (視圖) - 用戶詳細資訊含角色關聯
  - `user_roles` (關聯表) - 用戶與角色的多對多關聯
  - `roles` (關聯表) - 角色定義
- **資料映射**: `User` ↔ `DbUser` / `DbUserDetail`
- **依賴服務**: 與 `RoleApiService` 協作
- **前端使用**:
  - `UsersView.vue` - 用戶列表管理頁面
  - `RoleUsersView.vue` - 角色用戶管理頁面
  - 各種需要用戶選擇的表單組件

### 資料庫層 API 參考
> **Supabase 自動生成文件**
>
> 如需查詢 `users` 資料表的基礎 Schema 和 PostgREST API：
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `users` / `user_details` / `user_roles`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
> - ✅ 查詢用戶資料表結構和角色關聯
> - ✅ 了解 RLS 政策和權限控制
> - ✅ 檢視用戶認證相關欄位 (auth_user_id)
>
> **何時使用本文件**：
> - ✅ 使用 `UserApiService` 的角色管理功能
> - ✅ 了解用戶搜尋和分頁查詢邏輯
> - ✅ 學習用戶資料映射規則
> - ✅ 查看與 RBAC 系統的整合方式

---

## API 方法詳細說明

### 1. 分頁查詢方法

#### `fetchUsersWithPagination()` - 用戶列表分頁查詢 ⭐ 推薦

**用途**: 取得用戶列表，支援分頁、搜尋、角色篩選和排序，是用戶管理頁面的主要查詢方法

**方法簽名**:
```typescript
async fetchUsersWithPagination(
  roles: Role[],
  options: UsersPaginationOptions
): Promise<ApiPaginationResponse>
```

**參數**:
```typescript
interface UsersPaginationOptions {
  page?: number                // 頁碼 (預設: 1)
  perPage?: number             // 每頁筆數 (預設: 10)
  searchTerm?: string          // 搜尋關鍵字 (查詢 email 和 fullName)
  roleIds?: number[]           // 角色 ID 篩選
  sortBy?: string              // 排序欄位 (預設: 'created_at')
  sortOrder?: 'asc' | 'desc'   // 排序方向 (預設: 'desc')
}

// roles 參數用於進階角色篩選（保持向後相容性）
interface Role {
  id: number
  name: string
}
```

**回傳值**:
```typescript
interface ApiPaginationResponse {
  success: boolean
  data?: User[]                // 用戶陣列
  count?: number               // 總筆數
  page?: number                // 當前頁碼
  perPage?: number             // 每頁筆數
  totalPages?: number          // 總頁數
  error?: string               // 錯誤訊息
}

interface User {
  id: string                   // 用戶 UUID
  email: string                // 電子郵件
  fullName: string             // 全名
  phone?: string               // 電話號碼
  avatarUrl?: string           // 頭像 URL
  createdAt: string            // 建立時間
  updatedAt: string            // 更新時間
  deletedAt?: string           // 軟刪除時間
  authUserId?: string          // Supabase Auth 用戶 ID
  roles: Role[]                // 用戶角色陣列
}
```

**資料來源**: `user_details` 視圖 (含 roles 關聯)

**使用範例**:
```typescript
import { defaultServiceFactory } from '@/api/services'

const userService = defaultServiceFactory.getUserService()

// 基本分頁查詢
const result = await userService.fetchUsersWithPagination([], {
  page: 1,
  perPage: 20,
  sortBy: 'created_at',
  sortOrder: 'desc'
})

if (result.success) {
  console.log(`找到 ${result.count} 個用戶`)
  console.log(`總頁數: ${result.totalPages}`)
  result.data?.forEach(user => {
    console.log(`${user.fullName} (${user.email})`)
  })
}

// 搜尋特定關鍵字
const searchResult = await userService.fetchUsersWithPagination([], {
  searchTerm: 'admin',
  page: 1,
  perPage: 10
})

// 按角色篩選
const adminUsers = await userService.fetchUsersWithPagination([], {
  roleIds: [1, 2],  // 管理員和編輯者角色
  page: 1,
  perPage: 50
})
```

**搜尋邏輯**:
- 使用 `ILIKE` 進行不區分大小寫的模糊搜尋
- 同時查詢 `email` 和 `full_name` 欄位
- 搜尋模式: `%searchTerm%`

**排序支援欄位**:
- `created_at` - 建立時間 (預設)
- `updated_at` - 更新時間
- `email` - 電子郵件
- `full_name` - 全名

---

### 2. 關鍵字搜尋

#### `fetchUsersByKeyword()` - 快速關鍵字搜尋

**用途**: 輕量級用戶搜尋，適用於表單選擇器、自動完成等場景，返回簡化的用戶資料

**方法簽名**:
```typescript
async fetchUsersByKeyword(keyword: string): Promise<User[]>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `keyword` | `string` | ✅ | 搜尋關鍵字，空字串則返回最近 10 個用戶 |

**回傳值**:
```typescript
User[]  // 簡化的用戶陣列 (僅含 id, fullName, email)
```

**特殊行為**:
- **空關鍵字**: 返回最近建立的 10 個用戶（預設選項）
- **有關鍵字**: 返回符合條件的最多 50 個用戶
- **錯誤處理**: 發生錯誤時返回空陣列 `[]`

**資料來源**: `users` 表 (僅查詢必要欄位)

**使用範例**:
```typescript
// 空關鍵字 - 取得最近用戶作為預設選項
const defaultUsers = await userService.fetchUsersByKeyword('')
// 返回: 最近建立的 10 個用戶

// 搜尋特定關鍵字
const searchResults = await userService.fetchUsersByKeyword('john')
// 返回: email 或 fullName 包含 'john' 的用戶（最多 50 個）

// 在 Vue 組件中使用（表單選擇器）
const handleSearch = async (query: string) => {
  const users = await userService.fetchUsersByKeyword(query)
  userOptions.value = users.map(u => ({
    label: `${u.fullName} (${u.email})`,
    value: u.id
  }))
}
```

**效能考量**:
- ✅ 僅查詢 `id`, `full_name`, `email` 三個欄位，效能優異
- ✅ 限制返回數量 (預設 10，搜尋 50)，避免大數據集
- ✅ 使用索引欄位查詢，速度快

**適用場景**:
- ✅ 表單的用戶選擇器 (Combobox / Select)
- ✅ 自動完成輸入 (Autocomplete)
- ✅ 快速查找用戶
- ❌ 不適用於需要完整用戶資料的場景（請使用 `fetchUsersWithPagination`）

---

### 3. 用戶詳情查詢

#### `getUser()` - 取得用戶詳細資料

**用途**: 根據用戶 ID 取得完整的用戶資料，包含角色關聯資訊

**方法簽名**:
```typescript
async getUser(userId: string): Promise<ApiResponse<User | null>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ✅ | 用戶 UUID |

**回傳值**:
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T                    // 用戶資料 (含角色陣列)
  error?: string              // 錯誤訊息
}
```

**資料來源**: `user_details` 視圖

**使用範例**:
```typescript
const result = await userService.getUser('user-uuid-123')

if (result.success && result.data) {
  const user = result.data
  console.log(`用戶: ${user.fullName}`)
  console.log(`角色: ${user.roles.map(r => r.name).join(', ')}`)
  console.log(`建立時間: ${user.createdAt}`)
} else {
  console.error(`錯誤: ${result.error}`)
}
```

**錯誤處理**:
- 用戶不存在: `{ success: false, error: '使用者不存在' }`
- 資料庫錯誤: `{ success: false, error: error.message }`

---

### 4. 用戶 CRUD 操作

#### `create()` - 新增用戶 (繼承自 BaseApiService)

**用途**: 建立新的用戶記錄

**方法簽名**:
```typescript
async create(user: Partial<User>): Promise<ApiResponse<User>>
```

**參數範例**:
```typescript
const newUser = {
  email: 'newuser@example.com',
  fullName: '新用戶',
  phone: '+886912345678',
  authUserId: 'auth-uuid-from-supabase-auth'
}

const result = await userService.create(newUser)
```

---

#### `updateUser()` - 更新用戶資料

**用途**: 更新現有用戶的資料

**方法簽名**:
```typescript
async updateUser(
  userId: string,
  updates: Partial<DbUser>
): Promise<ApiResponse<User>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ✅ | 用戶 UUID |
| `updates` | `Partial<DbUser>` | ✅ | 要更新的欄位 (snake_case) |

**可更新欄位**:
```typescript
interface DbUser {
  email?: string
  full_name?: string
  phone?: string
  avatar_url?: string
  auth_user_id?: string
}
```

**使用範例**:
```typescript
const result = await userService.updateUser('user-uuid-123', {
  full_name: '更新後的名稱',
  phone: '+886987654321',
  avatar_url: 'https://example.com/avatar.jpg'
})

if (result.success) {
  console.log('用戶資料已更新:', result.data)
} else {
  console.error('更新失敗:', result.error)
}
```

**注意事項**:
- ⚠️ 參數使用 `snake_case` 格式 (資料庫欄位名稱)
- ⚠️ 不能直接更新 `roles`，請使用 `setUserRole()` 和 `removeUserRole()`
- ⚠️ `auth_user_id` 通常不應更新（與 Supabase Auth 關聯）

---

#### `deleteUser()` - 刪除用戶

**用途**: 刪除用戶記錄（硬刪除）

**方法簽名**:
```typescript
async deleteUser(userId: string): Promise<ApiResponse<User | null>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ✅ | 用戶 UUID |

**回傳值**:
```typescript
{
  success: true,
  data: null  // 刪除成功時返回 null
}
```

**使用範例**:
```typescript
const result = await userService.deleteUser('user-uuid-123')

if (result.success) {
  console.log('用戶已刪除')
} else {
  console.error('刪除失敗:', result.error)
}
```

**⚠️ 重要提醒**:
- 這是**硬刪除**，資料將從資料庫中永久移除
- 刪除用戶會自動級聯刪除 `user_roles` 關聯（資料庫外鍵約束）
- 建議實施**軟刪除** (更新 `deleted_at` 欄位) 而非硬刪除
- 刪除前應檢查用戶是否有關聯的業務資料（訂單、工單等）

---

### 5. 角色關聯管理

#### `setUserRole()` - 設定用戶角色

**用途**: 為用戶新增或更新角色關聯

**方法簽名**:
```typescript
async setUserRole(userId: string, roleId: number): Promise<boolean>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ✅ | 用戶 UUID |
| `roleId` | `number` | ✅ | 角色 ID |

**回傳值**:
- `true` - 設定成功
- `false` - 設定失敗 (錯誤已記錄到 console)

**資料表**: `user_roles` (使用 `upsert` 操作)

**使用範例**:
```typescript
// 為用戶設定管理員角色
const success = await userService.setUserRole('user-uuid-123', 1)

if (success) {
  console.log('角色設定成功')
} else {
  console.error('角色設定失敗，請檢查 console 錯誤日誌')
}

// 批量設定多個角色
const roleIds = [1, 2, 3]  // 管理員、編輯者、檢視者
for (const roleId of roleIds) {
  await userService.setUserRole('user-uuid-123', roleId)
}
```

**行為說明**:
- 使用 `upsert` 操作，如果關聯已存在則不會重複新增
- 衝突檢查基於 `(user_id, role_id)` 組合
- 用戶可以擁有多個角色

---

#### `removeUserRole()` - 移除用戶角色

**用途**: 移除用戶的特定角色關聯

**方法簽名**:
```typescript
async removeUserRole(userId: string, roleId: number): Promise<boolean>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ✅ | 用戶 UUID |
| `roleId` | `number` | ✅ | 角色 ID |

**回傳值**:
- `true` - 移除成功
- `false` - 移除失敗 (錯誤已記錄到 console)

**使用範例**:
```typescript
// 移除用戶的管理員角色
const success = await userService.removeUserRole('user-uuid-123', 1)

if (success) {
  console.log('角色已移除')
} else {
  console.error('移除失敗')
}
```

**注意事項**:
- ⚠️ 移除用戶的所有角色會導致用戶失去系統存取權限
- 建議至少保留一個基本角色 (如 "檢視者")
- 刪除不存在的角色關聯也會返回 `true`

---

## 資料映射與轉換

### 資料庫欄位映射

#### DbUser → User (mapDbToEntity)
```typescript
{
  id: dbUser.id,                        // UUID
  email: dbUser.email || '',            // 電子郵件
  fullName: dbUser.full_name || '',     // snake_case → camelCase
  phone: dbUser.phone,                  // 電話號碼
  avatarUrl: dbUser.avatar_url,         // snake_case → camelCase
  createdAt: dbUser.created_at || '',   // snake_case → camelCase
  updatedAt: dbUser.updated_at || '',   // snake_case → camelCase
  deletedAt: dbUser.deleted_at || '',   // snake_case → camelCase (軟刪除)
  authUserId: dbUser.auth_user_id,      // snake_case → camelCase
  roles: dbUser.roles || []             // 角色陣列 (從 user_details 視圖)
}
```

#### User → DbUser (mapEntityToDb)
```typescript
{
  id: user.id,
  email: user.email,
  full_name: user.fullName,             // camelCase → snake_case
  phone: user.phone,
  avatar_url: user.avatarUrl,           // camelCase → snake_case
  auth_user_id: user.authUserId         // camelCase → snake_case
  // 注意: roles 不在此映射，需使用 setUserRole/removeUserRole
}
```

### 搜尋邏輯實現

```typescript
// applySearch 實現
protected applySearch(query: any, search: string): any {
  const pattern = `%${search}%`
  return query.or(`email.ilike.${pattern},full_name.ilike.${pattern}`)
}
```

**特點**:
- 使用 `ILIKE` 不區分大小寫
- 同時搜尋 `email` 和 `full_name` 欄位
- 使用 `OR` 邏輯，任一欄位符合即返回

---

## 錯誤處理

### 方法返回格式

#### ApiResponse 格式
```typescript
// 成功
{
  success: true,
  data: User | User[] | null
}

// 失敗
{
  success: false,
  error: '錯誤訊息'
}
```

#### Boolean 返回格式
```typescript
// setUserRole / removeUserRole
true   // 操作成功
false  // 操作失敗 (詳細錯誤已記錄到 console)
```

### 常見錯誤場景

1. **用戶不存在**
   - 錯誤: `'使用者不存在'`
   - 解決: 檢查 userId 是否正確

2. **角色 ID 無效**
   - 錯誤: 外鍵約束失敗
   - 解決: 確保 roleId 存在於 `roles` 表

3. **Email 重複**
   - 錯誤: Unique constraint violation
   - 解決: 檢查 email 是否已被使用

4. **權限不足**
   - 錯誤: RLS policy violation
   - 解決: 確保當前用戶有操作權限

### 錯誤日誌

服務使用 `createModuleLogger` 記錄錯誤：

```typescript
const log = createModuleLogger('API', 'UserApi')

// 錯誤會記錄到 console
log.error('Error setting user role', { error, userId, roleId })
```

---

## ⚡ 效能考量

### 查詢優化

1. **使用 user_details 視圖**
   - ✅ 預先 JOIN roles 資料，減少查詢次數
   - ✅ 一次查詢取得完整用戶資訊

2. **索引欄位**
   - `email` - 有唯一索引，搜尋快速
   - `created_at` - 有索引，排序效能佳
   - `id` - 主鍵，查詢效能最佳

3. **限制返回數量**
   - `fetchUsersByKeyword`: 預設 10，搜尋 50
   - `fetchUsersWithPagination`: 使用分頁，每頁 10-100

### 最佳實踐

```typescript
// ✅ 推薦: 使用分頁查詢
const result = await userService.fetchUsersWithPagination([], {
  page: 1,
  perPage: 20
})

// ✅ 推薦: 輕量級搜尋使用 fetchUsersByKeyword
const users = await userService.fetchUsersByKeyword('john')

// ❌ 避免: 不使用分頁查詢全部用戶
// 應使用 fetchUsersWithPagination 並迭代所有頁面
```

---

## 🔐 權限與安全

### RLS (Row Level Security) 政策

用戶資料受 Supabase RLS 保護：

1. **查詢權限**
   - 用戶可查詢自己的資料
   - 管理員可查詢所有用戶

2. **修改權限**
   - 用戶可修改自己的部分欄位 (fullName, phone, avatarUrl)
   - 管理員可修改所有用戶資料

3. **刪除權限**
   - 僅管理員可刪除用戶
   - 用戶不能刪除自己

### 敏感資料處理

```typescript
// ⚠️ 注意: 不要在前端暴露敏感資料
// fetchUsersByKeyword 僅返回 id, fullName, email
// 避免返回 phone, authUserId 等敏感資訊
```

---

## 使用場景範例

### 場景 1: 用戶管理頁面

```typescript
// UsersView.vue
const loadUsers = async () => {
  loading.value = true

  const result = await userService.fetchUsersWithPagination([], {
    page: currentPage.value,
    perPage: 20,
    searchTerm: searchQuery.value,
    roleIds: selectedRoles.value,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  if (result.success) {
    users.value = result.data || []
    totalPages.value = result.totalPages || 0
  }

  loading.value = false
}
```

### 場景 2: 角色管理

```typescript
// 為用戶設定多個角色
const assignRolesToUser = async (userId: string, roleIds: number[]) => {
  const results = await Promise.all(
    roleIds.map(roleId => userService.setUserRole(userId, roleId))
  )

  const allSuccess = results.every(r => r === true)

  if (allSuccess) {
    toast.success('角色設定成功')
  } else {
    toast.error('部分角色設定失敗')
  }
}
```

### 場景 3: 用戶選擇器

```typescript
// UserSelector.vue
const searchUsers = async (query: string) => {
  const users = await userService.fetchUsersByKeyword(query)

  options.value = users.map(user => ({
    label: `${user.fullName} (${user.email})`,
    value: user.id
  }))
}

// 初始載入預設選項
onMounted(async () => {
  options.value = await userService.fetchUsersByKeyword('')
})
```

### 場景 4: 用戶詳情頁面

```typescript
// UserDetailView.vue
const loadUserDetail = async (userId: string) => {
  const result = await userService.getUser(userId)

  if (result.success && result.data) {
    user.value = result.data
    userRoles.value = result.data.roles
  } else {
    router.push('/users')
    toast.error('用戶不存在')
  }
}
```

---

## 相關文檔

- [RoleApiService API 文檔](./role-api.md) - 角色管理服務
- [權限系統架構設計](../architecture/permission-system.md) - RBAC 系統設計
- [用戶資料表 Schema](../database/tables.md#users) - 資料庫結構
- [Supabase Auth 整合](../guides/supabase-auth.md) - 認證系統整合

---

**📌 重要提醒**:
- 用戶刪除操作為硬刪除，建議實施軟刪除機制
- 角色變更後需重新載入用戶權限（前端需刷新 session）
- `fetchUsersByKeyword` 為輕量級搜尋，不適用於需要完整資料的場景
- RLS 政策確保資料安全，前端需正確處理權限不足的錯誤
