# 統一載入組件系統 (Unified Loading System)

## 📋 概述

統一載入組件系統提供了一套完整的載入狀態指示器，確保整個應用程式的載入體驗一致且符合使用者期待。

### 🎯 設計目標

- **一致性**: 全應用統一的載入視覺語言
- **易用性**: 簡單直觀的 API 設計
- **彈性**: 支援多種載入場景和自訂需求
- **效能**: 優化的動畫效能，避免影響使用者體驗
- **可訪問性**: 完整的 ARIA 支援和鍵盤導航

## 🏗️ 架構設計

### 組件階層結構

```
@/components/common/loading/
├── UniversalSpinner.vue        # 基礎旋轉載入器
├── UniversalProgress.vue       # 進度條指示器  
├── UniversalLoadingState.vue   # 綜合載入狀態管理器
├── ChartSkeleton.vue          # 圖表專用骨架屏
├── TableSkeleton.vue          # 表格專用骨架屏
├── EnhancedSkeleton.vue       # 增強的骨架屏組件
└── index.ts                   # 統一匯出和使用指南
```

### 設計原則

1. **漸進式複雜度**: 從簡單的 Spinner 到複雜的 LoadingState
2. **組合優先**: 大組件由小組件組合而成
3. **預設友善**: 合理的預設值，最小化配置需求
4. **TypeScript 嚴格**: 完整的類型安全保證

## 📚 組件詳細說明

### 1. UniversalSpinner - 基礎旋轉載入器

**使用場景**: 按鈕載入、小區塊載入、表單提交

```vue
<template>
  <!-- 基本使用 -->
  <UniversalSpinner />
  
  <!-- 自訂樣式 -->
  <UniversalSpinner 
    message="載入中..." 
    size="lg" 
    icon="refresh"
    direction="vertical" 
  />
  
  <!-- 按鈕內使用 -->
  <Button :disabled="loading">
    <UniversalSpinner v-if="loading" size="xs" :message="null" />
    {{ loading ? '' : '提交' }}
  </Button>
</template>
```

**Props 配置**:
- `message?: string` - 載入狀態文字
- `icon?: 'loader' | 'refresh' | 'rotate'` - 圖示類型
- `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` - 大小預設
- `direction?: 'horizontal' | 'vertical'` - 布局方向
- `centered?: boolean` - 是否置中顯示
- `disableAnimation?: boolean` - 是否禁用動畫

### 2. UniversalProgress - 進度條指示器

**使用場景**: 檔案上傳、批量操作、資料匯出

```vue
<template>
  <!-- 確定進度 -->
  <UniversalProgress 
    :value="uploadProgress" 
    :max="100"
    message="上傳檔案中..." 
    :showPercentage="true"
    variant="default"
  />
  
  <!-- 不定進度 -->
  <UniversalProgress 
    :indeterminate="true"
    message="處理資料中..." 
    variant="warning"
  />
</template>
```

**Props 配置**:
- `value?: number` - 進度值 (0-max)
- `max?: number` - 最大值，預設 100
- `variant?: 'default' | 'success' | 'warning' | 'destructive'` - 變體樣式
- `showPercentage?: boolean` - 是否顯示百分比
- `indeterminate?: boolean` - 是否為不定進度
- `message?: string` - 載入狀態文字

### 3. UniversalLoadingState - 綜合載入狀態管理器

**使用場景**: 頁面區塊、卡片容器、模態對話框

```vue
<template>
  <!-- Spinner 模式 -->
  <UniversalLoadingState 
    type="spinner"
    message="載入資料中..."
    size="lg"
  />
  
  <!-- Skeleton 模式 -->
  <UniversalLoadingState 
    type="skeleton"
    skeletonPreset="chart"
    :showCard="false"
  />
  
  <!-- Progress 模式 -->
  <UniversalLoadingState 
    type="progress"
    :progress="{ value: 60, showPercentage: true }"
    message="匯出進度..."
  />
</template>
```

**Props 配置**:
- `type?: 'spinner' | 'progress' | 'skeleton' | 'pulse' | 'dots'` - 載入類型
- `skeletonPreset?: 'text' | 'chart' | 'table' | 'card' | 'avatar' | 'custom'` - 骨架屏預設
- `progress?: ProgressConfig` - 進度條相關配置
- `showCard?: boolean` - 是否顯示卡片容器
- `minHeight?: string` - 最小高度設定

### 4. ChartSkeleton - 圖表專用骨架屏

**使用場景**: 各種圖表載入狀態

```vue
<template>
  <!-- 長條圖骨架屏 -->
  <ChartSkeleton 
    type="bar"
    :showTitle="true"
    :showLegend="true"
    :showAxes="true"
    height="300px"
  />
  
  <!-- 圓餅圖骨架屏 -->
  <ChartSkeleton 
    type="pie"
    :showLegend="true"
    :showSummary="true"
  />
</template>
```

**Props 配置**:
- `type?: ChartType` - 圖表類型 ('line' | 'bar' | 'pie' | 'area' | 'radar' | 'scatter' | 'donut' | 'heatmap' | 'funnel')
- `showTitle?: boolean` - 是否顯示標題區域
- `showLegend?: boolean` - 是否顯示圖例區域
- `showAxes?: boolean` - 是否顯示座標軸
- `showSummary?: boolean` - 是否顯示統計摘要

### 5. TableSkeleton - 表格專用骨架屏

**使用場景**: 資料表格載入狀態

```vue
<template>
  <TableSkeleton 
    :rows="5"
    :columns="4" 
    :showHeader="true"
    :showActions="true"
    :showPagination="true"
    :showToolbar="true"
    size="md"
  />
</template>
```

**Props 配置**:
- `rows?: number` - 顯示的行數
- `columns?: number` - 顯示的列數
- `showHeader?: boolean` - 是否顯示表頭
- `showActions?: boolean` - 是否顯示操作列
- `showCheckbox?: boolean` - 是否顯示選擇框列
- `showPagination?: boolean` - 是否顯示分頁
- `showToolbar?: boolean` - 是否顯示工具列
- `size?: 'sm' | 'md' | 'lg'` - 表格大小

### 6. Skeleton (Enhanced) - 增強的基礎骨架屏

**使用場景**: 基礎元素載入狀態

```vue
<template>
  <!-- 預設骨架屏 -->
  <Skeleton preset="text" />
  <Skeleton preset="title" />
  <Skeleton preset="avatar" size="lg" />
  <Skeleton preset="button" />
  
  <!-- 自訂骨架屏 -->
  <Skeleton 
    class="h-4 w-48" 
    :rounded="false"
    animation="wave"
  />
</template>
```

**Props 配置**:
- `preset?: SkeletonPreset` - 預設樣式
- `size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'` - 大小預設
- `rounded?: boolean | 'sm' | 'md' | 'lg' | 'full'` - 圓角設定
- `animation?: 'pulse' | 'wave' | 'none'` - 動畫類型

## 🎨 使用模式和最佳實踐

### 選擇指南

| 載入時間 | 推薦組件 | 使用場景 |
|---------|----------|----------|
| < 1秒 | 無需載入指示器 | 簡單操作 |
| 1-2秒 | UniversalSpinner | 按鈕、快速操作 |
| 2-5秒 | UniversalLoadingState (Spinner) | 小區塊載入 |
| 5-10秒 | UniversalLoadingState (Skeleton) | 頁面區塊、圖表 |
| > 10秒 | UniversalProgress | 檔案上傳、批量操作 |

### 專用場景

| 場景 | 推薦組件 | 配置建議 |
|------|----------|----------|
| 圖表載入 | ChartSkeleton | 根據圖表類型選擇 type |
| 表格載入 | TableSkeleton | 配置行列數和功能區域 |
| 卡片內容 | UniversalLoadingState | type="skeleton", showCard=false |
| 全頁載入 | UniversalLoadingState | type="spinner", size="lg" |
| 按鈕載入 | UniversalSpinner | size="xs", message=null |

### 實際應用範例

#### 1. Analytics 頁面載入

```vue
<script setup lang="ts">
import { UniversalLoadingState, ChartSkeleton } from '@/components/common/loading'

const { data, loading, error } = useAnalyticsData()
</script>

<template>
  <div class="space-y-6">
    <!-- 頁面標題區域 -->
    <UniversalLoadingState 
      v-if="loading && !data"
      type="skeleton" 
      skeletonPreset="title"
      :showCard="false"
    />
    
    <!-- 圖表區域 -->
    <ChartSkeleton 
      v-if="loading"
      type="bar"
      :showTitle="true" 
      :showLegend="true"
    />
    
    <!-- 實際內容 -->
    <AnalyticsChart v-else :data="data" />
  </div>
</template>
```

#### 2. 檔案上傳進度

```vue
<script setup lang="ts">
import { UniversalProgress } from '@/components/common/loading'

const { uploadProgress, isUploading } = useFileUpload()
</script>

<template>
  <UniversalProgress 
    v-if="isUploading"
    :value="uploadProgress"
    message="上傳檔案中..."
    :showPercentage="true"
    variant="default"
  />
</template>
```

#### 3. 資料表格整合

```vue
<script setup lang="ts">
import { TableSkeleton } from '@/components/common/loading'
import DataTable from '@/components/data-table/DataTable.vue'

const { data, loading } = useOrdersList()
</script>

<template>
  <TableSkeleton 
    v-if="loading && !data?.length"
    :rows="10" 
    :columns="5"
    :showHeader="true"
    :showActions="true"
    :showPagination="true"
  />
  
  <DataTable 
    v-else
    :data="data" 
    :columns="columns"
    :loading="loading"
  />
</template>
```

## 🔧 技術實作細節

### 效能優化

1. **CSS 動畫優先**: 使用 CSS `@keyframes` 而非 JavaScript 動畫
2. **合理的動畫時間**: 避免過快或過慢的動畫影響體驗
3. **條件渲染**: 只在需要時渲染載入組件
4. **最小DOM**: 精簡的 DOM 結構減少重繪成本

### 可訪問性 (A11y) 支援

1. **ARIA 屬性**: 正確的 `role`, `aria-label`, `aria-valuenow` 等
2. **螢幕閱讀器**: 提供有意義的載入狀態描述
3. **鍵盤導航**: 載入期間適當的焦點管理
4. **高對比度**: 支援高對比度模式顯示

### TypeScript 類型支援

```typescript
// 基礎類型定義
export type LoadingType = 'spinner' | 'progress' | 'skeleton' | 'pulse' | 'dots'
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'radar' | 'scatter' | 'donut' | 'heatmap' | 'funnel'

// 進度條配置
interface ProgressConfig {
  value?: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  showPercentage?: boolean
  indeterminate?: boolean
}
```

## 📋 遷移指南

### 從舊有實作遷移

#### 1. 替換手寫 Spinner

```vue
<!-- 舊有實作 ❌ -->
<div class="flex items-center justify-center">
  <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
  <span class="ml-2">載入中...</span>
</div>

<!-- 新統一實作 ✅ -->
<UniversalSpinner message="載入中..." size="lg" />
```

#### 2. 升級 Dashboard 載入狀態

```vue
<!-- 舊有實作 ❌ -->
<div v-if="loading" class="flex items-center justify-center py-12">
  <div class="text-center">
    <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
    <p class="text-gray-600">載入儀表板數據中...</p>
  </div>
</div>

<!-- 新統一實作 ✅ -->
<UniversalLoadingState 
  v-if="loading"
  type="spinner"
  message="載入儀表板數據中..."
  size="lg"
  :showCard="false"
/>
```

#### 3. 圖表載入狀態標準化

```vue
<!-- 舊有實作 ❌ -->
<div v-if="loading" class="h-64 flex items-center justify-center">
  <div class="animate-pulse space-y-4 w-full">
    <div class="h-4 bg-gray-300 rounded w-3/4"></div>
    <div class="h-32 bg-gray-200 rounded"></div>
    <div class="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
</div>

<!-- 新統一實作 ✅ -->
<ChartSkeleton 
  v-if="loading"
  type="bar"
  :showTitle="true"
  :showLegend="true"
/>
```

### 遷移檢查清單

- [ ] 識別所有手寫載入狀態實作
- [ ] 根據使用場景選擇適當的統一組件
- [ ] 更新 import 語句使用新的載入組件
- [ ] 驗證視覺一致性和功能正確性
- [ ] 測試可訪問性和效能影響
- [ ] 更新相關文件和測試

## 🧪 測試策略

### 單元測試

```typescript
// UniversalSpinner.test.ts
import { mount } from '@vue/test-utils'
import UniversalSpinner from '@/components/common/loading/UniversalSpinner.vue'

describe('UniversalSpinner', () => {
  it('displays message correctly', () => {
    const wrapper = mount(UniversalSpinner, {
      props: { message: '載入中...' }
    })
    expect(wrapper.text()).toContain('載入中...')
  })
  
  it('applies correct size classes', () => {
    const wrapper = mount(UniversalSpinner, {
      props: { size: 'lg' }
    })
    expect(wrapper.find('svg').classes()).toContain('h-6 w-6')
  })
})
```

### 整合測試

```typescript
// LoadingState.integration.test.ts
describe('Loading State Integration', () => {
  it('shows loading state while fetching data', async () => {
    const wrapper = mount(DataList)
    expect(wrapper.findComponent(UniversalLoadingState).exists()).toBe(true)
    
    await flushPromises()
    expect(wrapper.findComponent(UniversalLoadingState).exists()).toBe(false)
  })
})
```

### 視覺回歸測試

使用 Playwright 進行視覺測試，確保載入狀態的視覺一致性：

```typescript
// loading.visual.test.ts
test('loading components visual consistency', async ({ page }) => {
  await page.goto('/storybook/loading')
  await expect(page.locator('[data-testid="universal-spinner"]')).toHaveScreenshot()
  await expect(page.locator('[data-testid="chart-skeleton"]')).toHaveScreenshot()
})
```

## 🚀 未來擴展規劃

### Phase 2: 增強功能

1. **智慧預載入**: 根據使用者行為預測載入需求
2. **自適應載入**: 根據網路狀況調整載入策略
3. **載入分析**: 收集載入時間數據用於效能優化
4. **主題系統整合**: 深度整合設計系統的主題變數

### Phase 3: 進階特性

1. **國際化支援**: 完整的多語言載入訊息
2. **可自訂動畫**: 允許團隊自訂載入動畫
3. **載入策略模式**: 不同場景的載入策略配置
4. **效能監控**: 內建的載入效能監控和報告

## 📞 支援和回饋

### 常見問題

**Q: 如何選擇合適的載入組件？**
A: 參考「選擇指南」表格，根據載入時間和使用場景選擇。

**Q: 可以自訂載入動畫嗎？**
A: 目前支援透過 props 配置，未來版本將支援完全自訂動畫。

**Q: 如何確保可訪問性？**
A: 組件內建 ARIA 支援，使用預設配置即可滿足基本可訪問性需求。

### 問題回報

如發現問題或有改進建議，請在專案 Issue 中回報：

1. 描述具體使用場景
2. 提供復現步驟
3. 包含期望的行為描述
4. 附上相關截圖或代碼範例

---

*此文件隨系統發展持續更新，最後更新日期: 2025-08-26*