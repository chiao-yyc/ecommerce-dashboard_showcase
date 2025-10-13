# Data Table Actions Composables

這個資料夾包含所有與 DataTable 組件相關的組合式函數，用於統一管理表格操作邏輯。

## 架構說明

### 核心組合式函數

- **`useDataTableActions.ts`** - 基礎的 DataTable 操作組合式函數
  - 提供通用的 CRUD 操作
  - 處理確認對話框邏輯
  - 支援批量操作
  - 可配置的路由導航

### 專用組合式函數

各個業務領域的專用組合式函數，都基於 `useDataTableActions`：

- **`useRoleUserActions.ts`** - 角色用戶管理操作
  - 角色指派/移除
  - 用戶角色批量管理
- **`useCustomerActions.ts`** - 客戶管理操作
  - 客戶資料 CRUD
  - 客戶資料導出
- **`useOrderActions.ts`** - 訂單管理操作
  - 訂單狀態變更
  - 訂單批量處理
- **`useProductActions.ts`** - 產品管理操作
  - 產品庫存管理
  - 產品資料維護
- **`useTicketActions.ts`** - 工單管理操作
  - 工單狀態處理
  - 客服流程管理

## 使用方式

### 基本導入

```typescript
import { useDataTableActions } from '@/composables/data-table-actions'
```

### 專用功能導入

```typescript
import {
  useRoleUserActions,
  useCustomerActions,
  useOrderActions,
  useProductActions,
  useTicketActions,
} from '@/composables/data-table-actions'
```

## 設計原則

1. **統一介面**：所有組合式函數提供一致的 API
2. **可配置性**：支援自訂回調函數和路由配置
3. **型別安全**：完整的 TypeScript 支援
4. **可重用性**：基於組合式 API 的設計模式
5. **關注點分離**：業務邏輯與 UI 邏輯分離

## 擴展指南

創建新的 DataTable 操作組合式函數時：

1. 繼承 `useDataTableActions` 的基礎功能
2. 添加業務專用的操作邏輯
3. 在 `index.ts` 中添加導出
4. 更新此 README 文件

## 最近修復和改進

### 2025-01-24: 篩選器功能修復

**問題描述**：

- DataTableFacetedFilter 組件的事件綁定不正確
- OrderList 篩選器出現 Vue prop 類型錯誤
- 篩選功能無法正常更新列表

**修復內容**：

#### 1. 事件綁定修復

- **檔案**: `src/components/data-table-async/DataTableToolbar.vue`
- **修改**: 將 `@changeFilter` 改為 `@update:selected`
- **原因**: DataTableFacetedFilter 實際發出的是 `update:selected` 事件

#### 2. Props 類型修復

- **檔案**: `src/components/order/OrderList.vue`
- **修改**: 將 `filters` 改為 computed，確保傳遞正確的陣列值
- **原因**: 組件期望收到 Array，但傳入了 Ref 物件

#### 3. Computed 邏輯簡化

- **檔案**: `src/components/data-table-async/DataTableToolbar.vue`
- **修改**: 簡化 `isFiltered` computed 的邏輯判斷
- **效果**: 提升性能和可讀性

**最佳實踐**：

1. **事件處理**：

   ```vue
   <!-- 正確的事件綁定 -->
   <DataTableFacetedFilter
     :selected="filter.selected"
     @update:selected="
       (value) => emit('changeFilter', { key: filter.key, value })
     "
   />
   ```

2. **響應式資料結構**：

   ```typescript
   // 推薦：使用 computed 確保資料結構正確
   const filters = computed(() => [
     {
       key: 'status',
       title: t('order.status'),
       options: statusFilterOptions,
       selected: status.value ? status.value.map(String) : [],
     },
   ])
   ```

3. **故障排除步驟**：
   - 檢查組件發出的事件名稱
   - 確認 props 類型與期望一致
   - 驗證響應式資料的結構

## 常見問題和解決方案

### 篩選器問題

- **症狀**: 篩選器不更新列表或出現類型錯誤
- **檢查項目**:
  1. 事件綁定是否使用正確名稱
  2. 傳遞的資料類型是否符合組件期望
  3. computed 是否正確解包響應式資料

### 效能優化

- 使用 computed 而非 reactive 物件嵌套
- 避免在模板中進行複雜計算
- 合理使用 v-memo 優化大列表渲染
