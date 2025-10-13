# 數據表格系統文檔

電商管理平台的核心組件之一，提供統一的數據展示、篩選、排序和批量操作功能。

## 系統架構

### 三層表格架構

#### 1. DataTable (基礎層)
- **路徑**: `src/components/data-table/`
- **功能**: 基礎表格功能，靜態數據展示
- **適用**: 簡單的數據展示場景

#### 2. DataTableAsync (異步層)
- **路徑**: `src/components/data-table-async/`
- **功能**: 支援異步數據加載、分頁、篩選
- **適用**: 大部分業務場景
- **特色**: 與後端 API 整合的完整解決方案

#### 3. DataTableEditable (編輯層)
- **路徑**: `src/components/data-table-editable/`
- **功能**: 支援行內編輯功能
- **適用**: 需要快速編輯的場景

## 核心組件

### 主要組件

#### DataTableAsync.vue
```vue
<template>
  <DataTable
    :data="orders"
    :columns="columns"
    :selected-ids="selectedIds"
    :filters="filters"
    :current-page="currentPage"
    :per-page="perPage"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    :total-pages="totalPages"
    :total-count="totalCount"
    :loading="loading"
    @changePage="changePage"
    @changePerPage="changePerPage"
    @changeFilter="changeFilter"
    @changeSearch="changeSearch"
    @changeSort="changeSort"
    @changeRowSelect="changeRowSelect"
  />
</template>
```

#### DataTableToolbar.vue
- **功能**: 搜尋、篩選、檢視選項
- **組件**:
  - Input (搜尋)
  - DataTableFacetedFilter (篩選)
  - DataTableViewOptions (列顯示控制)

### 通用組件

#### DataTableFacetedFilter.vue
- **功能**: 多選篩選器
- **事件**: `@update:selected`
- **Props**: `selected: Array`, `options: Array`, `title: string`

#### DataTableColumnHeader.vue
- **功能**: 可排序的列標題
- **特色**: 自動顯示排序指示器

#### DataTablePagination.vue
- **功能**: 分頁導航
- **特色**: 響應式設計，支援跳頁

## 使用指南

### 創建新的數據表格頁面

#### 1. 定義表格列 (columns.ts)
```typescript
import type { ColumnDef } from '@tanstack/vue-table'
import DataTableColumnHeader from '@/components/data-table-common/DataTableColumnHeader.vue'

export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => h(DataTableColumnHeader, { 
      column, 
      title: t('order.id') 
    }),
    cell: ({ row }) => {
      const id = row.getValue('id') as string
      return textCopyable(id, 'font-mono', 8)
    },
  },
  // 更多列定義...
]
```

#### 2. 創建操作組件

**DataTableHeaderActions.vue** (批量操作)
```vue
<script setup lang="ts">
interface Props {
  isBatch: boolean
  selectedIds: string[]
}

const props = defineProps<Props>()
const emit = defineEmits(['batchDelete', 'batchExport', 'sort'])
</script>
```

**DataTableRowActions.vue** (單行操作)
```vue
<script setup lang="ts">
interface Props {
  row: any
}

const props = defineProps<Props>()
const emit = defineEmits(['deleteRow', 'viewDetail', 'editRow'])
</script>
```

#### 3. 實現頁面組件
```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import DataTable from '@/components/data-table-async/DataTable.vue'
import { columns } from './columns'
import { useOrderActions } from '@/composables/data-table-actions'

// 狀態管理
const orders = ref<Order[]>([])
const loading = ref(false)
const selectedIds = ref<string[]>([])

// 篩選和排序
const filters = computed(() => [
  {
    key: 'status',
    title: t('order.status'),
    options: statusOptions,
    selected: status.value ? status.value.map(String) : [],
  }
])

// 使用 composable 處理操作
const {
  handleDeleteRow,
  handleBatchDelete,
  // ... 其他操作
} = useOrderActions({
  onSuccessfulDelete: loadOrders,
})
</script>

<template>
  <DataTable
    :data="orders"
    :columns="columns"
    :selected-ids="selectedIds"
    :filters="filters"
    @changeFilter="changeFilter"
    @deleteRow="handleDeleteRow"
    @batchDelete="handleBatchDelete"
  />
</template>
```

## 篩選系統

### 篩選器配置
```typescript
const filters = computed(() => [
  {
    key: 'status',
    title: t('order.status'),
    options: [
      { label: '待處理', value: 'pending', icon: Clock },
      { label: '已完成', value: 'completed', icon: CheckCircle },
    ],
    selected: status.value ? status.value.map(String) : [],
  }
])
```

### 事件處理
```typescript
function changeFilter(filterChange: FilterChange) {
  if (!filterChange) {
    // 重置所有篩選
    status.value = undefined
    currentPage.value = 1
    loadData()
    return
  }
  
  const { key, value } = filterChange
  if (key === 'status') status.value = value
  currentPage.value = 1
  loadData()
}
```

## 最近修復 (2025-01-24)

### 篩選器事件綁定問題

**問題**: DataTableFacetedFilter 組件事件綁定不正確
```vue
<!-- 錯誤 -->
<DataTableFacetedFilter
  :selected="filter.selected.value"
  @changeFilter="(value) => emit('changeFilter', { key: filter.key, value })"
/>

<!-- 正確 -->
<DataTableFacetedFilter
  :selected="filter.selected"
  @update:selected="(value) => emit('changeFilter', { key: filter.key, value })"
/>
```

**修復**:
1. 事件名稱從 `@changeFilter` 改為 `@update:selected`
2. Props 從 `filter.selected.value` 改為 `filter.selected`
3. 確保 filters 使用 computed 正確解包

### 類型錯誤修復

**問題**: Vue 警告 "Invalid prop: type check failed for prop 'selected'"

**解決方案**:
```typescript
// 修復前
const filters = [
  {
    selected: computed(() => status.value ? status.value.map(String) : []),
  }
]

// 修復後
const filters = computed(() => [
  {
    selected: status.value ? status.value.map(String) : [],
  }
])
```

## 最佳實踐

### 1. 響應式資料結構
- 使用 `computed` 而非巢狀的 reactive 物件
- 確保 props 類型與組件期望一致

### 2. 事件處理
- 檢查組件文檔確認正確的事件名稱
- 使用 TypeScript 介面定義 emit 事件

### 3. 效能優化
- 大數據集使用虛擬滾動
- 合理使用 `v-memo` 優化渲染
- 避免在模板中進行複雜計算

### 4. 錯誤處理
- 提供 loading 狀態指示
- 處理空資料和錯誤狀態
- 友好的錯誤訊息提示

## 故障排除

### 常見問題

#### 1. 篩選器不工作
- 檢查事件綁定名稱
- 確認 props 類型正確
- 驗證資料結構

#### 2. 分頁問題
- 檢查 API 回傳的分頁資訊
- 確認 currentPage 狀態更新
- 驗證 totalPages 計算

#### 3. 排序問題
- 檢查 column 配置中的 enableSorting
- 確認 API 支援排序參數
- 驗證排序狀態更新

#### 4. 選取問題
- 檢查 selectedIds 狀態管理
- 確認 checkbox 組件綁定
- 驗證批量操作邏輯

### 除錯技巧
1. 使用 Vue DevTools 檢查組件狀態
2. 在 console 中追蹤事件觸發
3. 檢查 Network 面板確認 API 呼叫
4. 使用 TypeScript 嚴格模式捕捉類型錯誤