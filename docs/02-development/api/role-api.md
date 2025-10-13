# RoleApiService API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐ (權限系統核心)

---
## 概覽

### 業務用途
RoleApiService 是角色管理系統的核心 API 服務，負責處理角色的完整生命週期管理，包含角色 CRUD 操作、角色查詢、角色選項生成和角色存在性檢查。它是 RBAC (Role-Based Access Control) 權限系統的基礎，與 UserApiService 協作構成完整的權限控制體系。

### 核心功能
- **角色 CRUD 操作** - 完整的角色資料增刪改查
- **角色列表查詢** - 排序的角色清單
- **角色選項生成** - 為表單選擇器提供格式化選項
- **角色存在性檢查** - 避免重複建立角色
- **安全刪除檢查** - 防止刪除使用中的角色

### 技術架構
- **繼承**: `BaseApiService<Role, Role>`
- **資料表**:
  - `roles` (主表) - 角色定義
  - 關聯: `user_roles` (與用戶的多對多關聯)
  - 關聯: `role_permissions` (與權限的多對多關聯)
- **資料映射**: `Role` ↔ `Role` (1:1 映射，無欄位名稱轉換)
- **依賴服務**: 與 `UserApiService` 協作
- **前端使用**:
  - `RolesView.vue` - 角色管理頁面
  - `RoleUsersView.vue` - 角色用戶管理頁面
  - 各種需要角色選擇的表單組件

### 資料庫層 API 參考
> **Supabase 自動生成文件**
>
> 如需查詢 `roles` 資料表的基礎 Schema 和 PostgREST API：
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `roles` / `user_roles` / `role_permissions`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
> - ✅ 查詢角色資料表結構和關聯關係
> - ✅ 了解外鍵約束和級聯刪除規則
> - ✅ 檢視 RLS 政策和權限控制
>
> **何時使用本文件**：
> - ✅ 使用 `RoleApiService` 的角色管理功能
> - ✅ 了解角色刪除的安全檢查機制
> - ✅ 學習角色選項生成和存在性檢查
> - ✅ 查看與 RBAC 系統的整合方式

---

## API 方法詳細說明

### 1. 角色查詢方法

#### `fetchAllRoles()` - 取得所有角色 ⭐ 推薦

**用途**: 取得系統中的所有角色，按名稱排序，適用於角色列表顯示和選擇器

**方法簽名**:
```typescript
async fetchAllRoles(): Promise<ApiResponse<Role[]>>
```

**參數**: 無

**回傳值**:
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Role {
  id: number                  // 角色 ID
  name: string                // 角色名稱
  description?: string        // 角色描述
  sort_order?: number         // 排序順序
}
```

**排序規則**: 按 `name` 字母順序升序排列

**資料來源**: `roles` 表

**使用範例**:
```typescript
import { defaultServiceFactory } from '@/api/services'

const roleService = defaultServiceFactory.getRoleService()

// 取得所有角色
const result = await roleService.fetchAllRoles()

if (result.success) {
  console.log(`系統共有 ${result.data.length} 個角色`)
  result.data.forEach(role => {
    console.log(`${role.name}: ${role.description}`)
  })
} else {
  console.error(`錯誤: ${result.error}`)
}
```

**典型角色範例**:
```typescript
[
  { id: 1, name: 'Admin', description: '系統管理員' },
  { id: 2, name: 'Editor', description: '編輯者' },
  { id: 3, name: 'Manager', description: '管理者' },
  { id: 4, name: 'Viewer', description: '檢視者' }
]
```

---

#### `getRoleOptions()` - 取得角色選項

**用途**: 為表單選擇器生成格式化的角色選項，包含 value、label 和 description

**方法簽名**:
```typescript
async getRoleOptions(): Promise<ApiResponse<RoleOption[]>>
```

**回傳值**:
```typescript
interface RoleOption {
  value: string               // 角色名稱（用作選項值）
  label: string               // 顯示標籤（角色名稱）
  description?: string        // 角色描述（用作提示）
}
```

**使用範例**:
```typescript
// 在 Vue 組件中使用
const roleOptions = ref<RoleOption[]>([])

const loadRoleOptions = async () => {
  const result = await roleService.getRoleOptions()
  if (result.success) {
    roleOptions.value = result.data
  }
}

// 在表單中使用
<select v-model="selectedRole">
  <option
    v-for="option in roleOptions"
    :key="option.value"
    :value="option.value"
    :title="option.description"
  >
    {{ option.label }}
  </option>
</select>
```

**與 fetchAllRoles 的差異**:
- `fetchAllRoles`: 返回完整的 `Role` 物件（含 id）
- `getRoleOptions`: 返回簡化的 `RoleOption` 物件（以 name 為 value）

---

#### `roleExists()` - 檢查角色是否存在

**用途**: 檢查指定名稱的角色是否已存在，用於避免重複建立角色

**方法簽名**:
```typescript
async roleExists(roleName: string): Promise<ApiResponse<boolean>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `roleName` | `string` | ✅ | 要檢查的角色名稱（區分大小寫） |

**回傳值**:
```typescript
{
  success: boolean
  data: boolean              // true = 角色存在, false = 角色不存在
  error?: string
}
```

**使用範例**:
```typescript
// 在建立新角色前檢查
const checkAndCreateRole = async (roleName: string) => {
  const existsResult = await roleService.roleExists(roleName)

  if (existsResult.success && existsResult.data) {
    console.warn(`角色 "${roleName}" 已存在`)
    return { success: false, error: '角色名稱重複' }
  }

  // 角色不存在，可以建立
  return await roleService.createRole({ name: roleName })
}
```

**錯誤處理**:
- `PGRST116` (no rows returned) 被視為正常情況（角色不存在）
- 其他資料庫錯誤會拋出

---

### 2. 角色 CRUD 操作

#### `createRole()` - 建立新角色

**用途**: 建立新的角色記錄

**方法簽名**:
```typescript
async createRole(newRole: {
  name: string
  description?: string
}): Promise<ApiResponse<Role>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `newRole.name` | `string` | ✅ | 角色名稱（唯一） |
| `newRole.description` | `string` | ❌ | 角色描述 |

**回傳值**: 建立成功的 `Role` 物件（含自動生成的 `id`）

**使用範例**:
```typescript
const result = await roleService.createRole({
  name: 'ContentEditor',
  description: '內容編輯者，可編輯文章和產品資訊'
})

if (result.success) {
  console.log(`角色建立成功，ID: ${result.data.id}`)
} else {
  console.error(`建立失敗: ${result.error}`)
}
```

**常見錯誤**:
- **Unique constraint violation**: 角色名稱重複
  - 錯誤訊息: `duplicate key value violates unique constraint`
  - 解決方法: 使用 `roleExists()` 預先檢查

---

#### `updateRole()` - 更新角色

**用途**: 更新現有角色的資料

**方法簽名**:
```typescript
async updateRole(
  roleId: number,
  updates: Partial<Omit<Role, 'id'>>
): Promise<ApiResponse<Role>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `roleId` | `number` | ✅ | 角色 ID |
| `updates` | `Partial<Omit<Role, 'id'>>` | ✅ | 要更新的欄位 |

**可更新欄位**:
```typescript
{
  name?: string              // 角色名稱
  description?: string       // 角色描述
  sort_order?: number        // 排序順序
}
```

**使用範例**:
```typescript
// 更新角色描述
const result = await roleService.updateRole(1, {
  description: '更新後的描述：系統超級管理員'
})

// 更新角色名稱和排序
const result = await roleService.updateRole(3, {
  name: 'SeniorEditor',
  sort_order: 5
})

if (result.success) {
  console.log('角色更新成功:', result.data)
} else {
  console.error('更新失敗:', result.error)
}
```

**注意事項**:
- ⚠️ 更新 `name` 可能影響現有權限檢查邏輯（如果使用名稱匹配）
- ⚠️ `id` 欄位不可更新（已從類型中排除）
- ⚠️ 更新名稱時需確保不與其他角色重複

---

#### `deleteRole()` - 刪除角色

**用途**: 刪除角色記錄，含安全檢查防止刪除使用中的角色

**方法簽名**:
```typescript
async deleteRole(roleId: number): Promise<ApiResponse<boolean>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `roleId` | `number` | ✅ | 角色 ID |

**回傳值**:
```typescript
{
  success: boolean
  data: boolean              // true = 刪除成功
  error?: string             // 錯誤訊息（含特殊處理）
}
```

**安全檢查機制**:
```typescript
// 外鍵約束錯誤檢測
if (error.code === '23503') {
  return {
    success: false,
    error: 'Role is currently assigned to users and cannot be deleted.'
  }
}
```

**使用範例**:
```typescript
const result = await roleService.deleteRole(5)

if (result.success) {
  console.log('角色已刪除')
} else {
  if (result.error?.includes('currently assigned')) {
    console.error('無法刪除：角色正在使用中')
    // 建議用戶先移除用戶關聯
  } else {
    console.error('刪除失敗:', result.error)
  }
}
```

**錯誤碼說明**:
- `23503`: PostgreSQL 外鍵約束違反錯誤
  - 表示該角色仍有用戶關聯（`user_roles` 表中存在記錄）
  - 或該角色仍有權限關聯（`role_permissions` 表中存在記錄）

**刪除流程建議**:
```typescript
// 安全刪除角色的完整流程
const safeDeleteRole = async (roleId: number) => {
  // 1. 檢查角色是否有關聯用戶
  const { data: userCount } = await supabase
    .from('user_roles')
    .select('count')
    .eq('role_id', roleId)
    .single()

  if (userCount > 0) {
    return {
      success: false,
      error: `角色仍有 ${userCount} 個用戶，無法刪除`
    }
  }

  // 2. 移除權限關聯
  await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)

  // 3. 刪除角色
  return await roleService.deleteRole(roleId)
}
```

**⚠️ 重要提醒**:
- 刪除核心角色（Admin, Viewer 等）可能破壞系統功能
- 建議實施**軟刪除**或**停用機制**而非硬刪除
- 刪除前應通知系統管理員確認

---

### 3. 繼承自 BaseApiService 的方法

#### `getAll()` - 基礎列表查詢

**用途**: 使用 BaseApiService 的通用查詢方法（支援分頁、搜尋）

**方法簽名**:
```typescript
async getAll(options?: PaginationOptions): Promise<ApiPaginationResponse<Role>>
```

**參數**:
```typescript
interface PaginationOptions {
  page?: number              // 頁碼
  limit?: number             // 每頁筆數
  search?: string            // 搜尋關鍵字（查詢 name 和 description）
  sortBy?: string            // 排序欄位
  sortOrder?: 'asc' | 'desc'
}
```

**搜尋邏輯**:
```typescript
// applySearch 實現
protected applySearch(query: any, search: string): any {
  return query.or(`name.ilike.*${search}*,description.ilike.*${search}*`)
}
```

**使用範例**:
```typescript
// 搜尋包含 'admin' 的角色
const result = await roleService.getAll({
  search: 'admin',
  page: 1,
  limit: 10
})

// 取得所有角色（不分頁）
const allRoles = await roleService.getAll()
```

**與 fetchAllRoles 的差異**:
- `fetchAllRoles`: 簡化方法，僅按名稱排序，無分頁
- `getAll`: 完整功能，支援搜尋、分頁、自定義排序

---

## 資料映射與轉換

### 資料庫欄位映射

#### Role → Role (1:1 映射)
```typescript
{
  id: Number(dbRole.id),              // 轉換為 number 類型
  name: dbRole.name,                  // 角色名稱
  description: dbRole.description,    // 角色描述
  sort_order: dbRole.sort_order       // 排序順序
}
```

**特點**:
- ✅ 無 snake_case ↔ camelCase 轉換
- ✅ 僅進行類型轉換（id: string → number）
- ✅ 前端與資料庫欄位名稱一致

---

## 錯誤處理

### 統一錯誤格式

```typescript
// 成功
{
  success: true,
  data: Role | Role[] | boolean
}

// 失敗
{
  success: false,
  error: '錯誤訊息'
}
```

### 常見錯誤場景

#### 1. 角色名稱重複
```typescript
// 建立角色時
{
  success: false,
  error: 'duplicate key value violates unique constraint "roles_name_key"'
}

// 解決方法
const exists = await roleService.roleExists('Admin')
if (!exists.data) {
  await roleService.createRole({ name: 'Admin' })
}
```

#### 2. 角色使用中無法刪除
```typescript
{
  success: false,
  error: 'Role is currently assigned to users and cannot be deleted.'
}

// 錯誤碼: 23503 (外鍵約束違反)
// 解決方法: 先移除用戶角色關聯
```

#### 3. 角色不存在
```typescript
// 更新或查詢不存在的角色
{
  success: false,
  error: 'No rows returned'
}
```

---

## ⚡ 效能考量

### 查詢優化

1. **角色數量少**
   - 系統角色通常 < 20 個
   - `fetchAllRoles()` 可直接查詢全部，無需分頁

2. **索引欄位**
   - `id`: 主鍵，查詢極快
   - `name`: 唯一索引，搜尋快速

3. **關聯查詢**
   - 避免在循環中查詢用戶關聯
   - 使用 JOIN 一次查詢完整資料

### 最佳實踐

```typescript
// ✅ 推薦: 一次查詢所有角色
const { data: roles } = await roleService.fetchAllRoles()

// ✅ 推薦: 預先檢查角色存在性
const exists = await roleService.roleExists('Admin')

// ❌ 避免: 在循環中查詢
for (const user of users) {
  const role = await roleService.getAll({ search: user.roleName })
}

// ✅ 改進: 預先載入所有角色，建立 Map
const { data: allRoles } = await roleService.fetchAllRoles()
const roleMap = new Map(allRoles.map(r => [r.name, r]))
for (const user of users) {
  const role = roleMap.get(user.roleName)
}
```

---

## 🔐 權限與安全

### RLS (Row Level Security) 政策

角色資料受 Supabase RLS 保護：

1. **查詢權限**
   - 所有已登入用戶可查詢角色列表
   - 角色資訊不含敏感資料，可公開查詢

2. **修改權限**
   - 僅管理員可建立、更新、刪除角色
   - 一般用戶僅有查詢權限

3. **級聯刪除保護**
   - 外鍵約束防止誤刪使用中的角色
   - 確保系統權限完整性

### 角色命名規範

建議遵循以下命名規範：

```typescript
// ✅ 推薦命名（英文 PascalCase）
'Admin', 'Editor', 'Viewer', 'ContentManager'

// ✅ 可接受（英文 snake_case）
'super_admin', 'content_editor', 'basic_viewer'

// ⚠️ 避免（中文或特殊字元）
'管理員', 'Admin-123', 'admin@system'
```

**理由**:
- 英文命名便於程式碼中的權限檢查
- PascalCase 與前端命名慣例一致
- 避免特殊字元防止 URL 編碼問題

---

## 使用場景範例

### 場景 1: 角色管理頁面

```typescript
// RolesView.vue
const roles = ref<Role[]>([])

const loadRoles = async () => {
  const result = await roleService.fetchAllRoles()
  if (result.success) {
    roles.value = result.data
  }
}

const handleCreateRole = async (roleName: string, description: string) => {
  // 檢查重複
  const exists = await roleService.roleExists(roleName)
  if (exists.data) {
    toast.error('角色名稱已存在')
    return
  }

  // 建立角色
  const result = await roleService.createRole({ name: roleName, description })
  if (result.success) {
    toast.success('角色建立成功')
    await loadRoles()
  }
}

const handleDeleteRole = async (roleId: number) => {
  const confirmed = await confirm('確定要刪除此角色？')
  if (!confirmed) return

  const result = await roleService.deleteRole(roleId)
  if (result.success) {
    toast.success('角色已刪除')
    await loadRoles()
  } else {
    if (result.error?.includes('currently assigned')) {
      toast.error('無法刪除：角色仍有用戶使用')
    } else {
      toast.error('刪除失敗')
    }
  }
}
```

### 場景 2: 用戶角色選擇器

```typescript
// UserRoleSelector.vue
const roleOptions = ref<RoleOption[]>([])
const selectedRoles = ref<string[]>([])

onMounted(async () => {
  const result = await roleService.getRoleOptions()
  if (result.success) {
    roleOptions.value = result.data
  }
})

// 多選角色選擇器
<CheckboxGroup v-model="selectedRoles">
  <Checkbox
    v-for="option in roleOptions"
    :key="option.value"
    :value="option.value"
  >
    {{ option.label }}
    <span class="text-gray-500 text-sm">{{ option.description }}</span>
  </Checkbox>
</CheckboxGroup>
```

### 場景 3: 權限檢查

```typescript
// 在 composable 中使用
export const useRoleCheck = () => {
  const checkUserRole = async (userId: string, requiredRole: string) => {
    // 假設從 UserService 取得用戶資料
    const user = await userService.getUser(userId)

    if (!user.success) return false

    // 檢查用戶是否有指定角色
    return user.data.roles.some(role => role.name === requiredRole)
  }

  const hasAdminRole = async (userId: string) => {
    return await checkUserRole(userId, 'Admin')
  }

  return { checkUserRole, hasAdminRole }
}
```

### 場景 4: 角色初始化

```typescript
// 系統初始化時建立預設角色
const initializeDefaultRoles = async () => {
  const defaultRoles = [
    { name: 'Admin', description: '系統管理員' },
    { name: 'Manager', description: '管理者' },
    { name: 'Editor', description: '編輯者' },
    { name: 'Viewer', description: '檢視者' }
  ]

  for (const role of defaultRoles) {
    const exists = await roleService.roleExists(role.name)
    if (!exists.data) {
      await roleService.createRole(role)
      console.log(`✅ 角色 ${role.name} 已建立`)
    }
  }
}
```

---

## 相關文檔

- [UserApiService API 文檔](./user-api.md) - 用戶管理服務
- [權限系統架構設計](../architecture/permission-system.md) - RBAC 系統設計
- [角色資料表 Schema](../database/tables.md#roles) - 資料庫結構
- [權限管理指南](../guides/permission-management.md) - 權限配置指南

---

## 進階功能建議

### 角色權限整合
```typescript
// 擴展 Role 介面包含權限
interface RoleWithPermissions extends Role {
  permissions: Permission[]
}

// 查詢角色含權限
async getRoleWithPermissions(roleId: number): Promise<ApiResponse<RoleWithPermissions>> {
  const { data, error } = await this.supabase
    .from('roles')
    .select(`
      *,
      role_permissions (
        permission:permissions (*)
      )
    `)
    .eq('id', roleId)
    .single()

  // 處理資料映射...
}
```

### 角色層級系統
```typescript
// 為角色增加層級概念
interface HierarchicalRole extends Role {
  level: number              // 1=Admin, 2=Manager, 3=Editor, 4=Viewer
  parent_role_id?: number    // 父角色 ID
}

// 檢查角色層級權限
canAccessRole(userRole: HierarchicalRole, targetRole: HierarchicalRole): boolean {
  return userRole.level <= targetRole.level
}
```

---

**📌 重要提醒**:
- 角色刪除為硬刪除，建議實施軟刪除或停用機制
- 核心系統角色（Admin, Viewer）不應允許刪除
- 角色名稱變更可能影響權限檢查邏輯
- 外鍵約束提供刪除安全保護，但仍需前端二次確認
