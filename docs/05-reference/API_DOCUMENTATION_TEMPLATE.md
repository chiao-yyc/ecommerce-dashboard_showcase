# [Service名稱] API 文檔

> 📅 **最後更新**: YYYY-MM-DD
> 📝 **維護者**: 開發團隊
> 🎯 **業務重要性**: ⭐⭐⭐⭐⭐ (根據實際調整)

---

## 概覽

### 業務用途
[簡要描述此 API 服務的業務目的，解決什麼問題]

### 核心功能
- 功能 1 - 簡述
- 功能 2 - 簡述
- 功能 3 - 簡述

### 技術架構
- **繼承**: `BaseApiService<Entity, DbEntity>`
- **資料表**: `table_name` (主要) / `view_name` (查詢)
- **依賴服務**: [列出依賴的其他服務]
- **前端使用**: [哪些頁面/組件使用此服務]

---

## API 方法詳細說明

### 基礎 CRUD 方法

#### `getAll()` - 列表查詢

**用途**: 取得資料列表，支援分頁、搜尋、過濾

**方法簽名**:
```typescript
async getAll(options?: PaginationOptions): Promise<ApiPaginationResponse<Entity>>
```

**參數**:
```typescript
interface PaginationOptions {
  page?: number          // 頁碼 (預設: 1)
  limit?: number         // 每頁筆數 (預設: 10)
  search?: string        // 搜尋關鍵字
  sortBy?: string        // 排序欄位 (camelCase)
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>  // 自定義過濾條件
}
```

**回傳值**:
```typescript
interface ApiPaginationResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error?: string
}
```

**使用範例**:
```typescript
import { defaultServiceFactory } from '@/api/services'

const service = defaultServiceFactory.getCustomerService()

// 基本查詢
const result = await service.getAll({ page: 1, limit: 20 })

// 搜尋查詢
const searchResult = await service.getAll({
  search: '關鍵字',
  page: 1,
  limit: 10
})

// 排序查詢
const sortedResult = await service.getAll({
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// 過濾查詢
const filteredResult = await service.getAll({
  filters: { status: 'active' }
})
```

**注意事項**:
- ⚠️ `sortBy` 欄位使用 **camelCase** 格式，服務會自動轉換為資料庫的 snake_case
- ⚠️ 搜尋條件會對特定欄位執行 `ILIKE` 查詢 (不區分大小寫)
- ⚠️ 預設每頁 10 筆，最大 100 筆

---

#### `getById()` - 單筆查詢

**用途**: 根據 ID 取得詳細資料

**方法簽名**:
```typescript
async getById(id: string): Promise<ApiResponse<Entity>>
```

**參數**:
- `id`: 資料的 UUID

**回傳值**:
```typescript
interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: string
}
```

**使用範例**:
```typescript
const result = await service.getById('uuid-here')

if (result.success && result.data) {
  console.log('資料:', result.data)
} else {
  console.error('查詢失敗:', result.error)
}
```

**錯誤處理**:
- ID 不存在時: `{ success: false, data: null, error: 'Entity not found' }`
- 權限不足時: `{ success: false, data: null, error: 'Permission denied' }`

---

#### `create()` - 新增資料

**用途**: 創建新的資料記錄

**方法簽名**:
```typescript
async create(entity: Partial<Entity>): Promise<ApiResponse<Entity>>
```

**參數**:
```typescript
// 提供必填欄位和選填欄位
{
  field1: 'value',   // 必填
  field2: 'value',   // 必填
  field3?: 'value'   // 選填
}
```

**使用範例**:
```typescript
const newEntity = {
  name: '名稱',
  email: 'email@example.com',
  // ... 其他欄位
}

const result = await service.create(newEntity)

if (result.success) {
  console.log('新增成功，ID:', result.data.id)
}
```

**驗證規則**:
- [列出必填欄位]
- [列出格式要求，如 email 格式、長度限制等]

---

#### `update()` - 更新資料

**用途**: 更新現有資料記錄

**方法簽名**:
```typescript
async update(id: string, entity: Partial<Entity>): Promise<ApiResponse<Entity>>
```

**參數**:
- `id`: 要更新的資料 UUID
- `entity`: 要更新的欄位 (只需提供變更的欄位)

**使用範例**:
```typescript
const result = await service.update('uuid-here', {
  name: '新名稱',
  status: 'inactive'
})
```

**注意事項**:
- ⚠️ 只會更新提供的欄位，其他欄位保持不變
- ⚠️ `id` 和 `createdAt` 等系統欄位不可更新
- ⚠️ 更新會自動設置 `updatedAt` 為當前時間

---

#### `delete()` - 刪除資料

**用途**: 刪除資料記錄 (實體刪除或軟刪除)

**方法簽名**:
```typescript
async delete(id: string): Promise<ApiResponse<void>>
```

**刪除策略**:
- [說明是實體刪除還是軟刪除]
- [如果是軟刪除，說明 deletedAt 欄位的使用]

**使用範例**:
```typescript
const result = await service.delete('uuid-here')

if (result.success) {
  console.log('刪除成功')
}
```

**注意事項**:
- ⚠️ 刪除操作不可復原 (如果是實體刪除)
- ⚠️ 關聯資料的處理策略: [CASCADE / SET NULL / RESTRICT]

---

### 業務特定方法

#### `customMethod()` - 自定義方法名稱

**用途**: [描述業務邏輯]

**方法簽名**:
```typescript
async customMethod(param: Type): Promise<ApiResponse<ReturnType>>
```

**業務邏輯**:
[詳細說明業務規則、計算邏輯、資料處理流程]

**使用範例**:
```typescript
// 實際使用範例
```

**相關業務規則**:
- 規則 1
- 規則 2

---

## 資料結構

### Entity 類型 (前端)

```typescript
interface Entity {
  id: string
  field1: string
  field2: number
  field3?: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

**欄位說明**:
- `id`: 資料唯一識別碼 (UUID)
- `field1`: [欄位說明]
- `field2`: [欄位說明]
- `createdAt`: 建立時間 (ISO 8601 格式)
- `updatedAt`: 最後更新時間
- `deletedAt`: 軟刪除時間 (選填)

---

### DbEntity 類型 (資料庫)

```typescript
interface DbEntity {
  id: string
  field_1: string          // 對應 Entity.field1
  field_2: number          // 對應 Entity.field2
  field_3: boolean | null  // 對應 Entity.field3
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

**命名規則**:
- 前端使用 **camelCase**: `firstName`, `totalAmount`
- 資料庫使用 **snake_case**: `first_name`, `total_amount`

---

### 資料映射邏輯

```typescript
// DbEntity → Entity (mapDbToEntity)
{
  id: dbEntity.id,
  field1: dbEntity.field_1,
  field2: dbEntity.field_2,
  field3: dbEntity.field_3 ?? undefined,
  createdAt: dbEntity.created_at,
  updatedAt: dbEntity.updated_at,
  deletedAt: dbEntity.deleted_at ?? undefined
}

// Entity → DbEntity (mapEntityToDb)
{
  id: entity.id,
  field_1: entity.field1,
  field_2: entity.field2,
  field_3: entity.field3 ?? null,
  created_at: entity.createdAt,
  updated_at: entity.updatedAt,
  deleted_at: entity.deletedAt ?? null
}
```

**特殊處理**:
- 選填欄位: 資料庫 `null` ↔ 前端 `undefined`
- 日期格式: 統一使用 ISO 8601 字串格式
- [其他特殊處理邏輯]

---

## 使用範例

### 完整業務流程範例

```typescript
import { defaultServiceFactory } from '@/api/services'

// 1. 取得服務實例
const service = defaultServiceFactory.getXxxService()

// 2. 查詢列表
const listResult = await service.getAll({ page: 1, limit: 20 })
console.log('總筆數:', listResult.pagination.total)

// 3. 新增資料
const createResult = await service.create({
  field1: 'value1',
  field2: 123
})

if (createResult.success) {
  const newId = createResult.data.id

  // 4. 查詢詳情
  const detailResult = await service.getById(newId)

  // 5. 更新資料
  await service.update(newId, {
    field1: 'updated value'
  })

  // 6. 刪除資料
  await service.delete(newId)
}
```

---

### 在 Vue 組件中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { defaultServiceFactory } from '@/api/services'
import type { Entity } from '@/types'

const service = defaultServiceFactory.getXxxService()
const items = ref<Entity[]>([])
const loading = ref(false)

async function loadData() {
  loading.value = true
  try {
    const result = await service.getAll({ page: 1, limit: 10 })
    if (result.success) {
      items.value = result.data
    }
  } catch (error) {
    console.error('載入失敗:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
```

---

### 在 Composable 中使用

```typescript
// composables/useXxx.ts
import { ref } from 'vue'
import { defaultServiceFactory } from '@/api/services'
import type { Entity } from '@/types'

export function useXxx() {
  const service = defaultServiceFactory.getXxxService()
  const data = ref<Entity[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchData() {
    loading.value = true
    error.value = null
    try {
      const result = await service.getAll()
      if (result.success) {
        data.value = result.data
      } else {
        error.value = result.error || 'Unknown error'
      }
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    fetchData
  }
}
```

---

## 注意事項與最佳實踐

### 錯誤處理

```typescript
// ❌ 不好的做法
const result = await service.getById(id)
console.log(result.data.name)  // 可能 null，會報錯

// ✅ 好的做法
const result = await service.getById(id)
if (result.success && result.data) {
  console.log(result.data.name)
} else {
  console.error('查詢失敗:', result.error)
}
```

---

### 效能優化

**分頁查詢最佳實踐**:
```typescript
// ✅ 使用分頁避免一次載入大量資料
const result = await service.getAll({ page: 1, limit: 20 })

// ❌ 避免不設限制或設置過大的 limit
const badResult = await service.getAll({ limit: 10000 })
```

**搜尋最佳化**:
```typescript
// ✅ 使用防抖 (debounce) 避免頻繁查詢
import { useDebounceFn } from '@vueuse/core'

const debouncedSearch = useDebounceFn(async (keyword: string) => {
  await service.getAll({ search: keyword })
}, 300)
```

---

### 資料一致性

**更新後重新查詢**:
```typescript
// 更新資料後重新查詢確保資料一致
await service.update(id, { name: 'new name' })
const updated = await service.getById(id)
```

**樂觀更新策略**:
```typescript
// 先更新 UI，再發送 API 請求
items.value = items.value.map(item =>
  item.id === id ? { ...item, name: 'new name' } : item
)

const result = await service.update(id, { name: 'new name' })
if (!result.success) {
  // 失敗時回滾
  await loadData()
}
```

---

### 權限控制

**RLS (Row Level Security) 考量**:
- [說明此服務受到的 RLS 政策限制]
- [哪些角色可以執行哪些操作]

**前端權限檢查**:
```typescript
import { usePermissionStore } from '@/stores/permission'

const permissionStore = usePermissionStore()

if (permissionStore.can('entity:delete')) {
  await service.delete(id)
}
```

---

## 相關資源

### 相關 API 服務
- [相關服務 1] - 關聯說明
- [相關服務 2] - 關聯說明

### 相關組件
- `XxxList.vue` - 列表頁面
- `XxxDetail.vue` - 詳情頁面
- `XxxForm.vue` - 表單組件

### 相關文檔
- [資料庫 Schema](../database/schema.sql)
- [RLS 安全政策](../database/rls-policy.md)
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md)

---

## 🧪 測試

### 單元測試範例

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks'
import { XxxApiService } from './XxxApiService'

describe('XxxApiService', () => {
  let service: XxxApiService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    service = new XxxApiService(mockSupabase)
  })

  it('should fetch all entities', async () => {
    const mockData = [{ id: '1', name: 'test' }]
    mockSupabase.from().select().returns({ data: mockData, error: null })

    const result = await service.getAll()

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockData)
  })

  it('should handle errors gracefully', async () => {
    mockSupabase.from().select().returns({
      data: null,
      error: { message: 'Database error' }
    })

    const result = await service.getAll()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Database error')
  })
})
```

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|----------|------|
| YYYY-MM-DD | 1.0.0 | 初始版本 | 開發團隊 |

---

**維護提醒**: 當 API 方法有變更時，請同步更新此文檔並記錄在變更歷史中。
