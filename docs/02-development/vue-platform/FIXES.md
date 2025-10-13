# 修復記錄 (Vue Platform)

記錄 Vue 3 電商管理平台的重要修復和問題解決過程。

## 2025-01-24: Order List 篩選器修復

### 問題描述

在使用 Order List 頁面的狀態篩選功能時，發現以下問題：
1. 篩選器無法正常更新訂單列表
2. Vue 控制台出現 prop 類型錯誤警告
3. DataTableFacetedFilter 組件的事件處理不正確

### 錯誤訊息

```
[Vue warn]: Invalid prop: type check failed for prop "selected". Expected Array, got Object
at <DataTableFacetedFilter key="status" selected=Ref< [] > title="訂單狀態" ... >
```

```
[Vue warn]: Extraneous non-emits event listeners (sort) were passed to component but could not be automatically inherited
```

### 問題根因分析

#### 1. 事件綁定不匹配
- **檔案**: `src/components/data-table-async/DataTableToolbar.vue`
- **問題**: 監聽錯誤的事件名稱
- **原因**: DataTableFacetedFilter 發出 `update:selected` 事件，但 DataTableToolbar 監聽 `changeFilter` 事件

#### 2. Props 類型錯誤
- **檔案**: `src/components/order/OrderList.vue`
- **問題**: 傳遞 Ref 物件而非解包後的值
- **原因**: `filter.selected` 是 computed ref，但組件期望收到 Array

#### 3. 遺漏的事件聲明
- **檔案**: `src/components/order/order-list/DataTableHeaderActions.vue`
- **問題**: 未在 emits 中聲明 `sort` 事件
- **原因**: 組件接收 sort 事件監聽器但未正確聲明

### 修復過程

#### Step 1: 修復事件綁定
```vue
<!-- 修復前 -->
<DataTableFacetedFilter
  :selected="filter.selected.value"
  :title="filter.title"
  :options="filter.options"
  @changeFilter="(value) => emit('changeFilter', { key: filter.key, value })"
/>

<!-- 修復後 -->
<DataTableFacetedFilter
  :selected="filter.selected"
  :title="filter.title"
  :options="filter.options"
  @update:selected="(value) => emit('changeFilter', { key: filter.key, value })"
/>
```

#### Step 2: 修復 computed 邏輯
```vue
<!-- 修復前 -->
const isFiltered = computed(() =>
  props.filters?.some((filter) =>
    Array.isArray(filter.selected?.value)
      ? filter.selected.value.length > 0
      : Array.isArray(filter.selected)
        ? filter.selected.length > 0
        : false,
  ),
)

<!-- 修復後 -->
const isFiltered = computed(() =>
  props.filters?.some((filter) =>
    Array.isArray(filter.selected)
      ? filter.selected.length > 0
      : false,
  ),
)
```

#### Step 3: 修復資料結構
```typescript
// 修復前
const filters = [
  {
    key: 'status',
    title: t('order.status'),
    options: statusFilterOptions,
    selected: computed(() => (status.value ? status.value.map(String) : [])),
  },
]

// 修復後
const filters = computed(() => [
  {
    key: 'status',
    title: t('order.status'),
    options: statusFilterOptions,
    selected: status.value ? status.value.map(String) : [],
  },
])
```

#### Step 4: 修復事件聲明
```typescript
// 修復前
const emit = defineEmits(['batchUpdateStatus', 'batchDelete', 'batchExport'])

// 修復後
const emit = defineEmits(['batchUpdateStatus', 'batchDelete', 'batchExport', 'sort'])
```

### 測試驗證

#### 1. 功能測試
- ✅ 狀態篩選器正常工作
- ✅ 篩選結果正確更新列表
- ✅ 重置篩選功能正常

#### 2. 控制台檢查
- ✅ 無 Vue 警告訊息
- ✅ 無類型錯誤
- ✅ 事件正確觸發

#### 3. 建置驗證
```bash
npm run build
# ✅ 建置成功，無錯誤
```

### 影響的檔案

1. **src/components/data-table-async/DataTableToolbar.vue**
   - 修復事件綁定和 props 訪問
   - 簡化 isFiltered computed 邏輯

2. **src/components/order/OrderList.vue**
   - 修改 filters 為 computed 結構
   - 確保正確的資料類型傳遞

3. **src/components/order/order-list/DataTableHeaderActions.vue**
   - 新增 sort 事件到 emits 聲明

### 學到的經驗

#### 1. 事件處理最佳實踐
- 總是檢查組件文檔確認正確的事件名稱
- 使用 TypeScript 介面定義 emit 事件
- 在 defineEmits 中聲明所有可能的事件

#### 2. 響應式資料結構
- 避免巢狀的 computed 結構
- 確保 props 類型與組件期望一致
- 使用 computed 而非 reactive 物件處理複雜資料結構

#### 3. 除錯技巧
- 使用 Vue DevTools 檢查組件狀態
- 注意控制台的類型警告
- 建置前進行完整的功能測試

### 預防措施

1. **開發流程改進**
   - 新增組件時檢查事件聲明完整性
   - 使用 TypeScript 嚴格模式捕捉類型錯誤
   - 定期運行建置驗證代碼品質

2. **代碼審查重點**
   - 檢查事件綁定的一致性
   - 確認 props 類型正確性
   - 驗證響應式資料結構合理性

3. **測試策略**
   - 新增篩選功能的單元測試
   - 建立回歸測試防止類似問題再次發生

---

## 模板：新增修復記錄

```markdown
## YYYY-MM-DD: [修復標題]

### 問題描述
[描述遇到的問題]

### 錯誤訊息
```
[貼上錯誤訊息]
```

### 問題根因分析
[分析問題的根本原因]

### 修復過程
[詳細描述修復步驟]

### 測試驗證
[說明如何驗證修復結果]

### 影響的檔案
[列出修改的檔案清單]

### 學到的經驗
[總結學到的經驗和最佳實踐]

### 預防措施
[提出預防類似問題的措施]
```