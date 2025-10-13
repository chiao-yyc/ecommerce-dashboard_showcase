# UI Components (客製化組件展示)

此目錄展示基於 Radix Vue 的高度客製化 UI 組件，展現從 Headless UI 基礎擴展出的業務特定需求實現。

## 🎯 核心概念

### Headless UI 擴展策略
- **Radix Vue 基礎**: 使用無樣式的 Headless UI 組件作為底層
- **業務邏輯注入**: 在 Headless UI 之上添加業務特定功能
- **完全可定制**: 使用 Tailwind CSS 實現視覺風格
- **TypeScript 類型安全**: 嚴格的類型定義確保使用正確性

## 📦 客製化組件清單

### 1. DateRangePicker (日期範圍選擇器)
**檔案**: `date-picker/DateRangePicker.vue` (457 lines)

**客製化特性**:
- ✅ 雙月份並排顯示
- ✅ 預設日期範圍快捷選項（7/30/60/90天、3/6個月、今年）
- ✅ 自動範圍匹配檢測
- ✅ 選中預設範圍顯示 Badge
- ✅ 響應式事件發送 (`update:modelValue`, `update:selectedPreset`)

**技術亮點**:
```vue
<script setup lang="ts">
// 預設範圍定義
const defaultPresets = [
  {
    label: '最近 7 天',
    range: {
      start: today(getLocalTimeZone()).subtract({ days: 6 }),
      end: today(getLocalTimeZone()),
    },
  },
  // ... 更多預設
]

// 自動檢測選中的預設範圍
function checkMatchingPreset(range: DateRange) {
  for (const preset of props.presets) {
    if (datesMatch(range, preset.range)) {
      selectedPresetLabel.value = preset.label
      emit('update:selectedPreset', preset.label)
      return
    }
  }
  selectedPresetLabel.value = null // 自定義期間
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button variant="outline">
        <Calendar class="mr-2 h-4 w-4" />
        {{ formattedDateRange }}
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <!-- 雙月份日曆 + 預設範圍側邊欄 -->
      <div class="flex">
        <RangeCalendarRoot>...</RangeCalendarRoot>
        <div class="flex flex-col space-y-2 border-l">
          <Button
            v-for="preset in presets"
            @click="selectPreset(preset)"
          >
            {{ preset.label }}
          </Button>
        </div>
      </div>
    </PopoverContent>
  </Popover>

  <!-- 顯示選中的預設標籤 -->
  <Badge v-if="displayPresetLabel">
    {{ displayPresetLabel }}
  </Badge>
</template>
```

**使用範例**:
```vue
<script setup lang="ts">
import { DateRangePicker } from '@/components/ui/date-picker'
import { ref } from 'vue'

const dateRange = ref({
  start: today(getLocalTimeZone()).subtract({ days: 29 }),
  end: today(getLocalTimeZone()),
})

const selectedPreset = ref<string | null>(null)
</script>

<template>
  <DateRangePicker
    v-model="dateRange"
    :showPresets="true"
    :showSelectedPreset="true"
    @update:selectedPreset="(label) => selectedPreset = label"
  />
</template>
```

### 2. ModuleBadge (模組徽章)
**檔案**: `module-badge/ModuleBadge.vue` (102 lines)

**客製化特性**:
- ✅ 14 種模組類型視覺識別系統
- ✅ 深色模式完整支援
- ✅ Tailwind 完整調色板應用
- ✅ 圖示支援（Lucide Icons）
- ✅ TypeScript 類型安全的模組類型定義

**技術亮點**:
```vue
<script setup lang="ts">
export type ModuleType =
  | 'system' | 'user' | 'order' | 'product'
  | 'conversation' | 'customer' | 'finance' | 'security'
  | 'analytics' | 'marketing' | 'inventory' | 'support'
  | 'campaign' | 'notification' | 'report'

interface Props {
  module?: ModuleType
  children?: string
  icon?: LucideIcon
}

// 模組色彩映射 - 完整的深色模式支援
const moduleColorMap: Record<ModuleType, string> = {
  system: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300',
  order: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300',
  customer: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300',
  // ... 14 種模組類型
}
</script>

<template>
  <span :class="[
    'inline-flex items-center justify-center rounded-md border px-1 py-1',
    'text-xs font-medium whitespace-nowrap transition-all duration-200',
    moduleColorMap[module]
  ]">
    <component v-if="icon" :is="icon" class="h-3.5 w-3.5" />
    <slot>{{ children }}</slot>
  </span>
</template>
```

**使用範例**:
```vue
<script setup lang="ts">
import { ModuleBadge } from '@/components/ui/module-badge'
import { ShoppingCart, User, Package } from 'lucide-vue-next'
</script>

<template>
  <!-- 基本使用 -->
  <ModuleBadge module="order">訂單</ModuleBadge>

  <!-- 帶圖示 -->
  <ModuleBadge module="customer" :icon="User">客戶</ModuleBadge>

  <!-- 插槽使用 -->
  <ModuleBadge module="product">
    <Package class="mr-1 h-3 w-3" />
    產品模組
  </ModuleBadge>
</template>
```

### 3. RangeCalendar (日期範圍日曆基礎組件)
**目錄**: `range-calendar/`

**說明**: DateRangePicker 的底層依賴，提供雙日期選擇的核心邏輯。

**組件結構**:
```
range-calendar/
├── RangeCalendar.vue           # 主日曆組件
├── RangeCalendarCell.vue       # 日期單元格
├── RangeCalendarCellTrigger.vue # 日期觸發器
├── RangeCalendarGrid.vue       # 日曆網格
├── RangeCalendarGridBody.vue   # 網格主體
├── RangeCalendarGridHead.vue   # 網格標題
├── RangeCalendarGridRow.vue    # 網格行
├── RangeCalendarHeadCell.vue   # 標題單元格
└── index.ts                    # 導出入口
```

## 🏗️ 客製化架構模式

### 1. Headless UI + 業務邏輯
```typescript
// 基礎: Radix Vue Headless UI
import { RangeCalendarRoot } from 'reka-ui'

// 擴展: 業務邏輯層
const customPresets = computed(() => {
  // 根據業務需求動態生成預設範圍
  return generateBusinessPresets()
})

// 狀態管理
const selectedPreset = ref<string | null>(null)

// 業務邏輯
function checkMatchingPreset(range: DateRange) {
  // 自動匹配預設範圍邏輯
}
```

### 2. TypeScript 類型系統
```typescript
// 嚴格的類型定義
export type ModuleType = 'system' | 'user' | 'order' // ...

interface DatePreset {
  label: string
  range: DateRange
}

// 類型安全的 Props
interface Props {
  modelValue?: DateRange
  placeholder?: string
  showPresets?: boolean
  presets?: DatePreset[]
}
```

### 3. 主題系統整合
```typescript
// CSS 變數驅動 + Tailwind 類名
const colorClass = computed(() => {
  // 根據模組類型動態生成 Tailwind 類名
  return `bg-${module}-50 text-${module}-700 dark:bg-${module}-900`
})
```

## 📊 客製化程度分析

| 組件 | 原始行數 | 客製化功能 | 業務價值 |
|------|---------|-----------|---------|
| **DateRangePicker** | 457 | 預設範圍、自動匹配、雙月曆 | ⭐⭐⭐⭐⭐ |
| **ModuleBadge** | 102 | 14種模組色彩系統、深色模式 | ⭐⭐⭐⭐⭐ |
| **RangeCalendar** | ~800 | 日期範圍選擇核心邏輯 | ⭐⭐⭐⭐ |

## 🎨 設計系統一致性

### 色彩系統
所有客製化組件都遵循統一的色彩系統：
- **語義化色彩**: 基於模組類型的色彩映射
- **深色模式**: 完整的 dark: 前綴支援
- **Tailwind 調色板**: 使用 50/100/200...900 的完整色階

### 間距與佈局
- **統一間距**: 使用 Tailwind 的 4px 基準間距
- **響應式設計**: 支援不同螢幕尺寸的自適應
- **視覺反饋**: 過渡動畫和互動狀態

## 🔍 Demo 展示重點

- ✅ Headless UI 擴展模式
- ✅ TypeScript 嚴格類型安全
- ✅ 業務邏輯與 UI 分離
- ✅ 主題系統完整整合
- ✅ 響應式狀態管理
- ✅ 可重用的組件設計模式

## 💡 開發經驗總結

### 為什麼客製化 DateRangePicker？
shadcn 預設的日期選擇器只提供基本的單日期或範圍選擇，無法滿足分析頁面的常見需求：
- **業務需求**: 分析頁面常用「最近30天」、「最近90天」等預設範圍
- **用戶體驗**: 用戶不想每次都手動選擇日期範圍
- **自動化**: 需要自動檢測用戶選擇的範圍是否匹配預設

### 為什麼創建 ModuleBadge？
shadcn 的 Badge 組件只有基本的 variant (default/secondary/destructive)，無法滿足模組化系統的需求：
- **視覺識別**: 14 種模組類型需要明確的視覺區分
- **一致性**: 整個系統需要統一的模組色彩標準
- **擴展性**: 支援圖示和深色模式

## 📚 相關資源

- [Radix Vue Documentation](https://www.radix-vue.com/)
- [Tailwind CSS - Customization](https://tailwindcss.com/docs/customizing-colors)
- [@internationalized/date - Date Manipulation](https://react-spectrum.adobe.com/internationalized/date/)
