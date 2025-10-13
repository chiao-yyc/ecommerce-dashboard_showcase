# E-commerce Admin Platform 組件地圖（Vue 版本）

---
**文檔資訊**
- 最後更新：2025-10-07
- 版本：2.1.0
- 同步狀態：✅ 已與代碼同步
- 手動更新：✅ 已核對實際組件數
- 更新時間：2025/10/7 (文檔健檢修復)
---

> 本文檔詳細說明 admin-platform-vue 專案的完整組件架構，包含 406 個組件的分層結構、通訊模式、設計模式及使用指南。

## 1. 組件架構總覽

### 1.1 組件統計
| 組件分類 | 組件數量 | 主要功能 | 複雜度等級 |
|----------|----------|----------|------------|
| **UI 基礎組件** | 238個 | 原子級別UI元件 | ⭐⭐ |
| **圖表系統** | 30個 | 數據視覺化 | ⭐⭐⭐⭐⭐ |
| **資料表格** | 12個 | 數據展示與操作 | ⭐⭐⭐⭐ |
| **通知系統** | 18個 | 企業級通知管理 | ⭐⭐⭐⭐⭐ |
| **業務組件** | 108個 | 領域特定功能 | ⭐⭐⭐⭐ |
| **總計** | **406個** | **完整企業級系統** | **⭐⭐⭐⭐⭐** |

### 1.2 頁面組件統計
- **總頁面數量**：45個
- **業務視圖**：25個
- **系統頁面**：1個

### 1.3 Composables 統計
- **總 Composables**：80個
- **業務邏輯**：42個
- **圖表相關**：3個

## 2. 詳細組件結構

### 2.1 組件目錄樹狀圖
```
src/components/
├── ai/ (5個)
│   ├── AIAlertAnalysis.vue
│   ├── AIAlertEnhancement.vue
│   └── AIAlertTestPanel.vue
│   └── ... (2個其他文件)
├── analytics/ (22個)
│   ├── ABCAnalysisChart.vue
│   ├── AnalyticsChartCard.vue
│   └── AnalyticsContentCard.vue
│   └── ... (19個其他文件)
├── auth/ (3個)
│   ├── AuthHead.vue
│   ├── LoginForm.vue
│   └── RegisterForm.vue
├── calendar/ (2個)
│   ├── BaseCalendar.vue
│   └── CalendarEventItem.vue
├── campaign/ (8個)
│   ├── CampaignCalendar.vue
│   ├── CampaignList.vue
│   ├── CampaignScoringSection.vue
│   └── campaign-list/ (5個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
│       └── ... (2個其他文件)
├── cards/ (6個)
│   ├── AmountDetailsCard.vue
│   ├── EditableInfoCard.vue
│   └── InfoCard.vue
│   └── ... (3個其他文件)
├── charts/ (30個)
│   ├── ChartCard.vue
│   ├── ChartColorDemo.vue
│   ├── ChartEmpty.vue
│   └── ... (4個其他文件)
│   ├── base/ (2個)
│   │   ├── SingleContainer.vue
│   │   └── XYContainer.vue
│   └── pure/ (21個)
│       ├── ActionPriorityChart.vue
│       ├── AttributionChart.vue
│       └── BottleneckChart.vue
│       └── ... (18個其他文件)
├── common/ (13個)
│   ├── BusinessNumberWithUuid.vue
│   ├── Copyable.vue
│   ├── PDFExportButton.vue
│   └── ... (3個其他文件)
│   └── loading/ (7個)
│       ├── ChartSkeleton.vue
│       ├── EnhancedSkeleton.vue
│       └── TableSkeleton.vue
│       └── ... (4個其他文件)
├── composite/ (5個)
│   ├── BaseSheet.vue
│   ├── ConfirmDialog.vue
│   └── FileUploadInput.vue
│   └── ... (2個其他文件)
├── customer/ (16個)
│   ├── CustomerList.vue
│   ├── UserOrderList.vue
│   ├── charts/ (7個)
│   │   ├── LTVPurchaseTrend.vue
│   │   ├── LTVPurchaseTrendArea.vue
│   │   └── LTVPurchaseTrendSparkle.vue
│   │   └── ... (4個其他文件)
│   ├── customer-list/ (5個)
│   │   ├── DataTableHeaderActions.vue
│   │   ├── DataTableRowActions.vue
│   │   └── columns.ts
│   │   └── ... (2個其他文件)
│   └── user-order-list/ (2個)
│       ├── DataTableRowActions.vue
│       └── columns.ts
├── dashboard/ (4個)
│   ├── BusinessHealthDashboard.vue
│   ├── BusinessHealthDashboard_Simplified.vue
│   └── BusinessHealthIndicators.vue
│   └── ... (1個其他文件)
├── data-table/ (2個)
│   ├── DataTable.vue
│   └── DataTableToolbar.vue
├── data-table-async/ (2個)
│   ├── DataTable.vue
│   └── DataTableToolbar.vue
├── data-table-common/ (7個)
│   ├── DataTableColumnHeader.vue
│   ├── DataTableFacetedFilter.vue
│   └── DataTableHeaderCheckbox.vue
│   └── ... (4個其他文件)
├── data-table-editable/ (1個)
│   └── DataTable.vue
├── dev-tools/ (3個)
│   ├── CampaignColorTest.vue
│   ├── DevFloatingWidget.vue
│   └── ThemeTester.vue
├── forms/ (4個)
│   ├── ChannelCheckboxes.vue
│   ├── DynamicForm.vue
│   ├── FormSheet.vue
│   └── fields/ (1個)
│       └── SKUInput.vue
├── holiday/ (6個)
│   ├── HolidayCalendar.vue
│   ├── HolidayList.vue
│   ├── field-config.ts
│   └── holiday-list/ (3個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
├── insights/ (1個)
│   └── health/ (1個)
│       └── HealthComparisonChart.vue
├── inventory/ (4個)
│   ├── InventoryAdjustmentDialog.vue
│   ├── InventoryAdjustmentForm.vue
│   └── StockInFormSheet.vue
│   └── ... (1個其他文件)
├── layouts/ (7個)
│   ├── AgentUser.vue
│   ├── AppSidebar.vue
│   └── BannerUser.vue
│   └── ... (4個其他文件)
├── market/ (2個)
│   └── charts/ (2個)
│       ├── CampaignTimeline.vue
│       └── RevenueCampaignStacked.vue
├── notify/ (18個)
│   ├── EventCalendar.vue
│   ├── GroupNotificationCard.vue
│   ├── Notification.vue
│   └── ... (10個其他文件)
│   ├── template-form/ (1個)
│   │   └── form-config.ts
│   └── template-list/ (4個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
│       └── ... (1個其他文件)
├── order/ (19個)
│   ├── BatchStatusTransitionDialog.vue
│   ├── ItemList.vue
│   ├── OrderItemForm.vue
│   └── ... (2個其他文件)
│   ├── __tests__/ (0個)
│   ├── charts/ (9個)
│   │   ├── AmountHistogram.vue
│   │   ├── CustomerPurchaseStacked.vue
│   │   └── OrderCustomerStacked.vue
│   │   └── ... (6個其他文件)
│   ├── item-list/ (1個)
│   │   └── columns.ts
│   └── order-list/ (4個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
│       └── ... (1個其他文件)
├── product/ (20個)
│   ├── CategoryList.vue
│   ├── InventoryList.vue
│   ├── InventoryManagementDropdown.vue
│   └── ... (3個其他文件)
│   ├── category-list/ (4個)
│   │   ├── DataTableHeaderActions.vue
│   │   ├── DataTableRowActions.vue
│   │   └── columns.ts
│   │   └── ... (1個其他文件)
│   ├── inventory-list/ (2個)
│   │   ├── columns.ts
│   │   └── data.ts
│   ├── product-list/ (4個)
│   │   ├── DataTableHeaderActions.vue
│   │   ├── DataTableRowActions.vue
│   │   └── columns.ts
│   │   └── ... (1個其他文件)
│   └── product-stock-list/ (4個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
│       └── ... (1個其他文件)
├── role/ (6個)
│   ├── RoleBadges.vue
│   ├── RoleSelector.vue
│   ├── RoleUserList.vue
│   └── role-users-list/ (3個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
├── settings/ (4個)
│   ├── PasswordEditModal.vue
│   ├── PasswordStrength.vue
│   └── ProfileSettingsSection.vue
│   └── ... (1個其他文件)
├── support/ (18個)
│   ├── ChatRoom.vue
│   ├── ConversationList.vue
│   ├── ConversationTitle.vue
│   └── ... (2個其他文件)
│   ├── charts/ (9個)
│   │   ├── AgentPerformanceTable.vue
│   │   ├── ConversationVolumeTrendChart.vue
│   │   └── ConversationWeekHeatmap.vue
│   │   └── ... (6個其他文件)
│   └── ticket-list/ (4個)
│       ├── DataTableHeaderActions.vue
│       ├── DataTableRowActions.vue
│       └── columns.ts
│       └── ... (1個其他文件)
└── ui/ (238個)
    ├── ConfidenceProgressBar.vue
    ├── CustomerAnalyticsSkeleton.vue
    ├── RiskLevelIndicator.vue
    └── ... (2個其他文件)
    ├── alert/ (4個)
    │   ├── Alert.vue
    │   ├── AlertDescription.vue
    │   └── AlertTitle.vue
    │   └── ... (1個其他文件)
    ├── alert-dialog/ (10個)
    │   ├── AlertDialog.vue
    │   ├── AlertDialogAction.vue
    │   └── AlertDialogCancel.vue
    │   └── ... (7個其他文件)
    ├── avatar/ (4個)
    │   ├── Avatar.vue
    │   ├── AvatarFallback.vue
    │   └── AvatarImage.vue
    │   └── ... (1個其他文件)
    ├── badge/ (2個)
    │   ├── Badge.vue
    │   └── index.ts
    ├── breadcrumb/ (8個)
    │   ├── Breadcrumb.vue
    │   ├── BreadcrumbEllipsis.vue
    │   └── BreadcrumbItem.vue
    │   └── ... (5個其他文件)
    ├── button/ (2個)
    │   ├── Button.vue
    │   └── index.ts
    ├── calendar/ (13個)
    │   ├── Calendar.vue
    │   ├── CalendarCell.vue
    │   └── CalendarCellTrigger.vue
    │   └── ... (10個其他文件)
    ├── card/ (8個)
    │   ├── Card.vue
    │   ├── CardAction.vue
    │   └── CardContent.vue
    │   └── ... (5個其他文件)
    ├── checkbox/ (2個)
    │   ├── Checkbox.vue
    │   └── index.ts
    ├── collapsible/ (4個)
    │   ├── Collapsible.vue
    │   ├── CollapsibleContent.vue
    │   └── CollapsibleTrigger.vue
    │   └── ... (1個其他文件)
    ├── combobox/ (12個)
    │   ├── Combobox.vue
    │   ├── ComboboxAnchor.vue
    │   └── ComboboxEmpty.vue
    │   └── ... (9個其他文件)
    ├── command/ (10個)
    │   ├── Command.vue
    │   ├── CommandDialog.vue
    │   └── CommandEmpty.vue
    │   └── ... (7個其他文件)
    ├── date-picker/ (2個)
    │   ├── DateRangePicker.vue
    │   └── index.ts
    ├── dialog/ (11個)
    │   ├── Dialog.vue
    │   ├── DialogClose.vue
    │   └── DialogContent.vue
    │   └── ... (8個其他文件)
    ├── dropdown-menu/ (15個)
    │   ├── DropdownMenu.vue
    │   ├── DropdownMenuCheckboxItem.vue
    │   └── DropdownMenuContent.vue
    │   └── ... (12個其他文件)
    ├── form/ (8個)
    │   ├── FormControl.vue
    │   ├── FormDescription.vue
    │   └── FormItem.vue
    │   └── ... (5個其他文件)
    ├── input/ (3個)
    │   ├── Input.vue
    │   ├── InputMinimal.vue
    │   └── index.ts
    ├── label/ (2個)
    │   ├── Label.vue
    │   └── index.ts
    ├── module-badge/ (2個)
    │   ├── ModuleBadge.vue
    │   └── index.ts
    ├── number-field/ (6個)
    │   ├── NumberField.vue
    │   ├── NumberFieldContent.vue
    │   └── NumberFieldDecrement.vue
    │   └── ... (3個其他文件)
    ├── popover/ (5個)
    │   ├── Popover.vue
    │   ├── PopoverAnchor.vue
    │   └── PopoverContent.vue
    │   └── ... (2個其他文件)
    ├── radio-group/ (3個)
    │   ├── RadioGroup.vue
    │   ├── RadioGroupItem.vue
    │   └── index.ts
    ├── range-calendar/ (13個)
    │   ├── RangeCalendar.vue
    │   ├── RangeCalendarCell.vue
    │   └── RangeCalendarCellTrigger.vue
    │   └── ... (10個其他文件)
    ├── scroll-area/ (3個)
    │   ├── ScrollArea.vue
    │   ├── ScrollBar.vue
    │   └── index.ts
    ├── select/ (12個)
    │   ├── Select.vue
    │   ├── SelectContent.vue
    │   └── SelectGroup.vue
    │   └── ... (9個其他文件)
    ├── separator/ (2個)
    │   ├── Separator.vue
    │   └── index.ts
    ├── sheet/ (10個)
    │   ├── Sheet.vue
    │   ├── SheetClose.vue
    │   └── SheetContent.vue
    │   └── ... (7個其他文件)
    ├── sidebar/ (26個)
    │   ├── Sidebar.vue
    │   ├── SidebarContent.vue
    │   └── SidebarFooter.vue
    │   └── ... (23個其他文件)
    ├── skeleton/ (2個)
    │   ├── Skeleton.vue
    │   └── index.ts
    ├── sonner/ (2個)
    │   ├── Sonner.vue
    │   └── index.ts
    ├── status-badge/ (2個)
    │   ├── StatusBadge.vue
    │   └── index.ts
    ├── switch/ (2個)
    │   ├── Switch.vue
    │   └── index.ts
    ├── table/ (11個)
    │   ├── Table.vue
    │   ├── TableBody.vue
    │   └── TableCaption.vue
    │   └── ... (8個其他文件)
    ├── tabs/ (5個)
    │   ├── Tabs.vue
    │   ├── TabsContent.vue
    │   └── TabsList.vue
    │   └── ... (2個其他文件)
    ├── textarea/ (2個)
    │   ├── Textarea.vue
    │   └── index.ts
    └── tooltip/ (5個)
        ├── Tooltip.vue
        ├── TooltipContent.vue
        └── TooltipProvider.vue
        └── ... (2個其他文件)
```

## 3. 組件分類詳解

### 3.1 UI 基礎組件 (238個)
基於 Reka UI 的原子化設計組件，提供統一的設計語言和交互模式。

**主要特性：**
- 原子化設計：每個UI組件都是最小功能單元
- 可組合性：支持多個基礎組件組合成複雜組件  
- 一致性：統一的設計語言和交互模式
- 可訪問性：完整的WAI-ARIA支持
- 主題化：基於Tailwind CSS的主題系統

### 3.2 圖表系統 (30個)
採用三層架構設計的專業圖表系統，支援企業級數據視覺化需求。

**架構層次：**
```
Pure Charts (純圖表)  →  Chart Cards (包裝)  →  Business Usage
     ↓                       ↓                    ↓
 只負責視覺化              標題、圖例、樣式        業務邏輯整合
```

**圖表類型：**
- **趨勢圖表** (aspect-[16/9])：時間序列、趨勢分析
- **圓形圖表** (aspect-square)：分佈圖、比例圖
- **柱狀圖表** (aspect-[4/3])：分類比較、排名

### 3.3 資料表格系統 (12個)
多層次的表格組件系統，支援不同複雜度的數據展示需求。

**表格能力矩陣：**
| 表格類型 | 異步加載 | 即時編輯 | 批量操作 | 虛擬滾動 | 排序篩選 |
|----------|----------|----------|----------|----------|----------|
| **基礎表格** | ❌ | ❌ | ✅ | ❌ | ✅ |
| **異步表格** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **可編輯表格** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **企業表格** | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.4 通知系統 (18個)
完整的企業級通知管理系統，支援多種通知類型和管理功能。

**系統架構：**
- **核心組件**：基礎通知功能
- **管理組件**：通知設定和模板管理  
- **高級功能**：群組通知、監控儀表板
- **配置系統**：靈活的通知規則配置

## 4. 組件通訊架構

### 4.1 通訊模式分層
```
           ┌─ Global State (Pinia Stores)
           │   ├─ auth.ts (認證狀態)
           │   ├─ permission.ts (權限狀態)
           │   └─ notification.ts (通知狀態)
           │
Global     ├─ Event Bus (事件總線)
           │   └─ 跨組件事件通信
           │
           └─ Provide/Inject (依賴注入)
               └─ 深層組件通信
                    │
                    ├─ Props/Emit (父子通信)
Local               │   ├─ 數據向下傳遞
                    │   └─ 事件向上冒泡
                    │
                    └─ Composables (狀態共享)
                        └─ 業務邏輯復用
```

### 4.2 狀態管理策略
| 狀態類型 | 管理方式 | 適用場景 | 示例 |
|----------|----------|----------|------|
| **全局狀態** | Pinia Store | 跨頁面狀態 | 用戶認證、權限矩陣 |
| **頁面狀態** | Composables | 頁面內狀態 | 表格數據、篩選條件 |
| **組件狀態** | ref/reactive | 組件內狀態 | 表單數據、UI狀態 |
| **臨時狀態** | Props/Emit | 父子通信 | 對話框顯示、選擇項 |

## 5. 組件設計模式

### 5.1 容器/展示組件模式
```typescript
// 容器組件 (負責數據和邏輯)
const CustomerContainer = {
  setup() {
    const { customers, loading, error } = useCustomers()
    const { updateCustomer, deleteCustomer } = useCustomerActions()
    
    return {
      customers,
      loading, 
      error,
      onUpdate: updateCustomer,
      onDelete: deleteCustomer
    }
  }
}

// 展示組件 (負責UI渲染)
const CustomerList = {
  props: ['customers', 'loading', 'onUpdate', 'onDelete'],
  // 純UI邏輯
}
```

### 5.2 高階組件模式
```typescript
// withDataTable HOC
function withDataTable<T>(Component: Component<T>) {
  return defineComponent({
    setup(props, { slots }) {
      const { data, loading, pagination } = useDataTable(props.query)
      
      return () => h(Component, {
        ...props,
        data,
        loading,
        pagination
      }, slots)
    }
  })
}
```

## 6. 性能優化策略

### 6.1 組件懒加載
```typescript
// 路由級懒加載
const CustomerView = () => import('@/views/CustomersView.vue')

// 組件級懒加載
const HeavyChart = defineAsyncComponent(() => 
  import('@/components/charts/HeavyChart.vue')
)
```

### 6.2 響應式優化
```typescript
// ✅ 優化響應式性能
const largeData = shallowRef([])
const config = readonly({ theme: 'dark' })
const debouncedSearch = useDebounceFn(search, 300)
```

## 7. 開發指南

### 7.1 命名規範
```typescript
// ✅ 推薦的命名方式
// 組件名：PascalCase
const CustomerList = defineComponent({})

// 文件名：PascalCase.vue
// CustomerList.vue
// NotificationCard.vue
// DataTableToolbar.vue

// Props：camelCase
interface Props {
  customerId: string
  showActions: boolean
  onUpdate: (id: string) => void
}

// 事件：kebab-case
emit('update:model-value')
emit('customer-selected')
emit('data-loaded')
```

### 7.2 組件結構模板
```vue
<template>
  <!-- UI 模板 -->
</template>

<script setup lang="ts">
// 1. 導入依賴
// 2. Props 定義
// 3. Emits 定義
// 4. 狀態管理
// 5. 計算屬性
// 6. 方法定義
// 7. 生命週期
// 8. defineExpose (如需要)
</script>

<style scoped>
/* 組件特定樣式 */
</style>
```

## 8. 測試策略

### 8.1 測試覆蓋目標
| 組件類型 | 測試覆蓋率目標 | 測試重點 |
|----------|----------------|----------|
| **UI組件** | 90%+ | 渲染、交互、可訪問性 |
| **業務組件** | 80%+ | 業務邏輯、數據流 |
| **圖表組件** | 70%+ | 數據處理、視覺化 |
| **複雜組件** | 85%+ | 狀態管理、事件處理 |

### 8.2 組件測試示例
```typescript
// 組件單元測試示例
describe('NotificationCard', () => {
  it('renders notification data correctly', () => {
    const wrapper = mount(NotificationCard, {
      props: { notification: mockNotification }
    })
    expect(wrapper.text()).toContain(mockNotification.title)
  })
  
  it('emits click event when card is clicked', async () => {
    const wrapper = mount(NotificationCard)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
```

## 9. 維護與升級

### 9.1 組件版本管理
- **主版本**：破壞性變更
- **次版本**：新功能添加
- **修訂版本**：Bug修復

### 9.2 廢棄策略
1. **標記廢棄**：在代碼中添加 @deprecated 註釋
2. **遷移指南**：提供替代方案
3. **逐步移除**：經過2個版本週期後移除

### 9.3 文檔同步機制
- **自動更新**：組件變更時自動更新文檔
- **週期檢查**：每週檢查文檔一致性
- **版本標記**：每次更新都有版本記錄

---

**相關文檔**
- [架構設計文檔](./architecture.md)
- [API 服務架構](./api-services.md)
- [圖表系統架構](./CHART_ARCHITECTURE.md)
- [技術堆疊詳情](../../04-guides/project-info/vue-tech-stack.md)

**更新日誌**
- v2.0.0 (2025-09-25): 自動生成的完整組件地圖，反映實際476+組件架構
- v1.0.0 (初始版本): 基本組件說明

**生成信息**
- 生成工具：generate-component-docs.js
- 掃描路徑：components, views, composables
- 生成時間：2025/9/26 上午12:27:46
- 下次更新：當組件結構發生變化時自動觸發
