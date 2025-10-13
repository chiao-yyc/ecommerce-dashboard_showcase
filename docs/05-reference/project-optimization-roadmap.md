# Vue 專案結構優化建議

## 現況分析

### 當前 admin-platform-vue 元件結構
```
src/components/
├── AgentUser.vue                    # → 建議移至 layout/
├── AppSidebar.vue                   # → 建議移至 layout/
├── BannerUser.vue                   # → 建議移至 layout/
├── BaseSheet.vue                    # → 建議移至 common/overlays/
├── ConfirmDialog.vue                # → 建議移至 common/feedback/
├── DevFloatingWidget.vue            # → 建議移至 dev-tools/
├── DynamicForm.vue                  # → 建議移至 common/forms/
├── FakerSeedButton.vue              # → 建議移至 dev-tools/
├── FileUploadInput.vue              # → 建議移至 common/forms/
├── FormSheet.vue                    # → 建議移至 common/forms/
├── InfoCard.vue                     # → 建議移至 common/data-display/
├── NavMain.vue                      # → 建議移至 layout/
├── NavUser-optimized.vue            # → 建議移至 layout/ (整合)
├── NavUser.vue                      # → 建議移至 layout/ (整合)
├── OverviewCard.vue                 # → 建議移至 common/data-display/
├── PermissionMatrix.vue             # → 建議移至 business/permission/
├── ProductInfoCard.vue              # → 建議移至 business/product/
├── RightSidebar.vue                 # → 建議移至 layout/
├── SelectSearchInput.vue            # → 建議移至 common/forms/
├── TeamSwitcher.vue                 # → 建議移至 layout/
├── UserInfoCard.vue                 # → 建議移至 business/user/
├── auth/                           # ✅ 結構良好
├── charts/                         # ✅ 結構良好
├── common/                         # ⚠️ 內容太少，需擴充
├── customer/                       # ✅ 結構良好
├── dashboard/                      # ✅ 結構良好
├── data-table-*/                   # ⚠️ 建議整合
├── insights/                       # ✅ 結構良好
├── market/                         # ✅ 結構良好
├── notify/                         # ✅ 結構良好
├── order/                          # ✅ 結構良好
├── product/                        # ✅ 結構良好
├── role/                           # ✅ 結構良好
├── support/                        # ✅ 結構良好
└── ui/                            # ✅ 結構良好
```

## 優化建議

### 1. 重新組織根層級元件

#### 建議的新結構
```
src/components/
├── layout/                 # 版面配置元件
│   ├── AppSidebar.vue
│   ├── RightSidebar.vue
│   ├── NavMain.vue
│   ├── NavUser.vue        # 合併 NavUser + NavUser-optimized
│   ├── TeamSwitcher.vue
│   ├── AgentUser.vue
│   └── BannerUser.vue
├── common/                 # 通用功能元件
│   ├── data-display/      # 資料展示
│   │   ├── InfoCard.vue
│   │   ├── OverviewCard.vue
│   │   └── ReloadButton.vue
│   ├── forms/             # 表單元件
│   │   ├── DynamicForm.vue
│   │   ├── FormSheet.vue
│   │   ├── FileUploadInput.vue
│   │   └── SelectSearchInput.vue
│   ├── feedback/          # 回饋元件
│   │   └── ConfirmDialog.vue
│   ├── overlays/          # 覆蓋層元件
│   │   └── BaseSheet.vue
│   └── dev-tools/         # 開發工具
│       ├── DevFloatingWidget.vue
│       └── FakerSeedButton.vue
├── business/              # 業務領域元件
│   ├── customer/         # (現有)
│   ├── order/            # (現有)
│   ├── product/          # (現有)
│   │   └── ProductInfoCard.vue  # 從根層級移入
│   ├── support/          # (現有)
│   ├── role/             # (現有)
│   ├── user/             # 新建
│   │   └── UserInfoCard.vue     # 從根層級移入
│   └── permission/       # 新建
│       └── PermissionMatrix.vue # 從根層級移入
├── data-table/           # 整合所有資料表元件
│   ├── base/            # 基礎元件
│   │   ├── DataTable.vue
│   │   ├── DataTableToolbar.vue
│   │   └── DataTablePagination.vue
│   ├── async/           # 非同步載入
│   ├── editable/        # 可編輯表格
│   └── common/          # 共用元件 (現有)
├── charts/              # (保持現有結構)
├── insights/            # (保持現有結構)
├── dashboard/           # (保持現有結構)
├── auth/                # (保持現有結構)
├── notify/              # (保持現有結構)
├── market/              # (保持現有結構)
└── ui/                  # (保持現有結構)
```

### 2. 檔案整合建議

#### NavUser 元件整合
```typescript
// 目標：整合 NavUser.vue 和 NavUser-optimized.vue
// 建議使用功能標籤或配置決定顯示模式

// NavUser.vue (整合後)
<script setup lang="ts">
interface Props {
  optimized?: boolean  // 控制是否使用優化版本
}
</script>
```

#### Data Table 元件整合
```
data-table/
├── base/
│   ├── DataTable.vue           # 核心表格元件
│   ├── DataTableToolbar.vue    # 工具欄元件
│   └── index.ts                # 統一匯出
├── features/
│   ├── async.ts                # 非同步載入功能
│   ├── editable.ts             # 編輯功能
│   └── common.ts               # 共用功能
└── index.ts                    # 全部匯出
```

### 3. 匯入路徑最佳化

#### 建立統一匯出文件
```typescript
// src/components/index.ts
export * from './layout'
export * from './common'
export * from './business'
export * from './data-table'

// 使用範例
import { AppSidebar, NavMain } from '@/components/layout'
import { InfoCard, DynamicForm } from '@/components/common'
```

#### 路徑別名設定 (vite.config.ts)
```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@/components/layout': path.resolve(__dirname, 'src/components/layout'),
      '@/components/common': path.resolve(__dirname, 'src/components/common'),
      '@/components/business': path.resolve(__dirname, 'src/components/business'),
    },
  },
})
```

## 實施計劃

### Phase 1: 基礎重構 (高優先級)
1. **移動佈局元件**
   - [ ] 創建 `layout/` 資料夾
   - [ ] 移動相關元件
   - [ ] 更新所有匯入路徑

2. **整合通用元件**
   - [ ] 創建 `common/` 子資料夾結構
   - [ ] 分類移動元件
   - [ ] 建立統一匯出

3. **NavUser 元件整合**
   - [ ] 合併兩個 NavUser 元件
   - [ ] 使用功能開關控制顯示
   - [ ] 測試功能完整性

### Phase 2: 業務元件重組 (中優先級)
1. **建立業務資料夾**
   - [ ] 創建 `business/user/`、`business/permission/`
   - [ ] 移動對應元件
   - [ ] 更新匯入路徑

2. **Data Table 整合**
   - [ ] 分析現有 data-table-* 資料夾
   - [ ] 設計統一的表格架構
   - [ ] 漸進式重構

### Phase 3: 進階優化 (低優先級)
1. **開發工具分離**
   - [ ] 創建 `dev-tools/` 資料夾
   - [ ] 移動開發相關元件
   - [ ] 設定條件式載入

2. **建立匯出系統**
   - [ ] 創建各資料夾的 index.ts
   - [ ] 設定路徑別名
   - [ ] 更新全專案匯入

## 匯入路徑對比

### 現況
```typescript
// 現在的匯入方式
import AppSidebar from '@/components/AppSidebar.vue'
import NavMain from '@/components/NavMain.vue'
import InfoCard from '@/components/InfoCard.vue'
import DynamicForm from '@/components/DynamicForm.vue'
```

### 優化後
```typescript
// 優化後的匯入方式
import { AppSidebar, NavMain } from '@/components/layout'
import { InfoCard } from '@/components/common/data-display'
import { DynamicForm } from '@/components/common/forms'

// 或者統一匯入
import {
  AppSidebar,
  NavMain,
  InfoCard,
  DynamicForm
} from '@/components'
```

## 檔案命名規範

### 統一命名規則
1. **元件檔案**: PascalCase (CustomerList.vue)
2. **資料夾**: kebab-case (data-table, common-forms)
3. **匯出檔案**: index.ts
4. **類型定義**: types.ts

### 範例
```
business/
├── customer/
│   ├── CustomerList.vue
│   ├── CustomerCard.vue
│   ├── index.ts         # 匯出檔案
│   └── types.ts         # 類型定義
└── order/
    ├── OrderList.vue
    ├── OrderForm.vue
    ├── index.ts
    └── types.ts
```

## TypeScript 類型整理

### 建立統一類型匯出
```typescript
// src/components/types.ts
export * from './layout/types'
export * from './common/types'
export * from './business/types'

// 使用範例
import type { 
  SidebarProps, 
  FormProps, 
  CustomerCardProps 
} from '@/components/types'
```

## 效益評估

### 短期效益
- **開發效率**: 更容易找到需要的元件
- **程式碼維護**: 邏輯分組，相關元件集中
- **匯入管理**: 路徑更清晰，減少錯誤

### 長期效益
- **擴展性**: 新功能更容易添加到正確位置
- **團隊協作**: 新成員更容易理解專案結構
- **重構安全**: 結構化的組織降低重構風險

## 風險評估

### 潛在風險
1. **短期開發中斷**: 重構期間需要更新大量匯入路徑
2. **測試覆蓋**: 需要確保移動後功能完整
3. **Git 歷史**: 檔案移動可能影響版本控制歷史

### 風險緩解
1. **分階段執行**: 分批次進行，降低影響
2. **自動化工具**: 使用 IDE 重構工具批量更新路徑
3. **全面測試**: 每階段完成後進行完整測試

## 總結

這個優化計劃將顯著改善專案的可維護性和開發體驗。建議按階段執行，確保每個階段都經過充分測試後再進行下一階段。

## 相關文檔

- [錯誤處理與監控指南](../standards/error-handling-guide.md)
- [通知系統完整指南](../../02-development/api/notification-system.md)
- [Vue 元件架構文檔](../../02-development/architecture/CHART_ARCHITECTURE.md)
- [React 技術差異對比](../../01-planning/react-appendix.md)

---

*建立日期: $(date "+%Y-%m-%d")*
*優先級: 高 (Phase 1) → 中 (Phase 2) → 低 (Phase 3)*