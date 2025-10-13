# 圖表匯出系統技術規範

## 系統概述

本文檔提供圖表匯出系統的完整技術規範，包括架構設計、API 接口、使用方式和最佳實踐，供開發者複用和維護。

## 架構設計

### 系統架構圖
```
用戶組件
    ↓
SimpleExportChart (包裝組件)
    ↓
useElementExport (核心邏輯)
    ↓
瀏覽器列印 API
```

### 核心組件說明

#### 1. `useElementExport` Composable
- **位置**: `src/composables/useChartExport.ts`
- **作用**: 提供統一的 DOM 元素匯出功能
- **特色**: 零配置、智能檢測、所見即所得

#### 2. `SimpleExportChart` 組件
- **位置**: `src/components/common/SimpleExportChart.vue`
- **作用**: 包裝任意內容，提供匯出功能
- **特色**: 極簡 API、自動處理、無樣式衝突

#### 3. 匯出工具函數
- **位置**: `src/utils/export.ts`
- **作用**: 底層 PDF 生成和瀏覽器列印邏輯
- **特色**: 中文字體支援、紙張選擇、錯誤處理

## 功能特性

### 核心功能
- ✅ **所見即所得匯出**：完整保留螢幕顯示內容
- ✅ **零配置使用**：3 行程式碼即可啟用匯出
- ✅ **智能模式檢測**：自動選擇最佳匯出方式
- ✅ **多格式支援**：SVG、HTML 混合內容匯出
- ✅ **視覺無閃爍**：純 CSS 處理，無 JavaScript 樣式干擾
- ✅ **中文友好**：完整的中文字體和本地化支援

### 技術特色
- **極簡化 API**：從 47 行配置縮減為 3 行
- **統一介面**：一個 composable 處理所有匯出需求
- **智能檢測**：自動排除按鈕、自動包含控制項
- **錯誤處理**：完整的異常捕獲和用戶提示
- **效能優化**：最小化 DOM 操作，優化記憶體使用

## API 接口規範

### useElementExport Composable

#### 返回值
```typescript
interface ElementExportReturn {
  // 狀態
  exportState: ComputedRef<{
    isExporting: boolean
    hasError: boolean
    errorMessage: string | null
  }>
  isExporting: Ref<boolean>
  exportError: Ref<string | null>

  // 核心 API
  exportElement: (
    container: HTMLElement,
    config?: Partial<ExportConfig>
  ) => Promise<void>

  // 工具方法
  detectExportMode: (container: HTMLElement) => 'svg' | 'html'
  findTargetSVG: (container: HTMLElement, excludeSelectors: string[]) => SVGElement | null
  applyExportStyles: (container: HTMLElement, styles?: Record<string, string>) => () => void
  clearError: () => void
}
```

#### 配置選項
```typescript
interface ExportConfig {
  /** 檔案名稱（不含副檔名） */
  filename?: string
  /** PDF 標題 */
  title?: string
  /** 匯出模式：'auto' 自動檢測，'svg' 僅 SVG，'html' 整個容器 */
  mode?: 'auto' | 'svg' | 'html'
  /** 頁面方向 */
  orientation?: 'portrait' | 'landscape'
  /** 要排除的元素選擇器 */
  excludeSelectors?: string[]
  /** 匯出時套用的樣式 */
  exportStyles?: Record<string, string>
  /** 是否包含時間戳記 */
  includeTimestamp?: boolean
}
```

### SimpleExportChart 組件

#### Props 接口
```typescript
interface SimpleExportChartProps {
  /** 檔案名稱 */
  filename?: string
  /** PDF 標題 */
  title?: string
  /** 匯出模式：'auto' 自動檢測，'svg' 僅 SVG，'html' 整個容器 */
  mode?: 'auto' | 'svg' | 'html'
  /** 頁面方向 */
  orientation?: 'portrait' | 'landscape'
  /** 是否顯示匯出按鈕 */
  showExportButton?: boolean
  /** 按鈕位置 */
  buttonPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** 是否禁用匯出功能 */
  disabled?: boolean
  /** 要排除的元素選擇器 */
  excludeSelectors?: string[]
  /** 匯出時的特殊樣式 */
  exportStyles?: Record<string, string>
}
```

#### 預設值
```typescript
const defaultProps = {
  mode: 'auto',
  orientation: 'landscape',
  showExportButton: true,
  buttonPosition: 'top-right',
  disabled: false
}
```

#### 暴露方法
```typescript
// 透過 defineExpose 暴露給父組件
interface ExposedMethods {
  exportElement: () => Promise<void>
  exportState: ComputedRef<ExportState>
  containerRef: Ref<HTMLElement | undefined>
}
```

## 使用方式與範例

### 基本使用方式

#### 1. 最簡單的使用方式
```vue
<template>
  <SimpleExportChart filename="my_chart">
    <!-- 任何內容：圖表、表格、儀表板等 -->
    <div class="chart-container">
      <svg><!-- 圖表內容 --></svg>
      <div class="legend">圖例</div>
      <div class="controls">控制項</div>
    </div>
  </SimpleExportChart>
</template>
```

#### 2. 自訂配置使用
```vue
<template>
  <SimpleExportChart
    filename="business_dashboard"
    title="業務儀表板報告"
    mode="html"
    orientation="portrait"
    :show-export-button="true"
    button-position="top-right"
  >
    <BusinessDashboard :data="dashboardData" />
  </SimpleExportChart>
</template>
```

#### 3. 程式化匯出
```vue
<script setup>
import { ref } from 'vue'
import { useElementExport } from '@/composables/useChartExport'

const chartRef = ref()
const { exportElement, exportState } = useElementExport()

const handleCustomExport = async () => {
  if (chartRef.value) {
    await exportElement(chartRef.value, {
      filename: 'custom_chart',
      title: '自訂圖表',
      mode: 'html'
    })
  }
}
</script>

<template>
  <div ref="chartRef" class="chart-container">
    <!-- 圖表內容 -->
  </div>
  <button @click="handleCustomExport" :disabled="exportState.isExporting">
    匯出圖表
  </button>
</template>
```

### 進階使用範例

#### 1. 自訂排除元素
```vue
<SimpleExportChart
  filename="chart_with_controls"
  :exclude-selectors="['.edit-button', '.settings-panel', '[data-internal]']"
>
  <div class="chart-wrapper">
    <svg class="main-chart"><!-- 主要圖表 --></svg>
    <div class="legend">圖例</div>
    <button class="edit-button">編輯</button> <!-- 會被排除 -->
    <div class="settings-panel">設定面板</div> <!-- 會被排除 -->
  </div>
</SimpleExportChart>
```

#### 2. 自訂匯出樣式
```vue
<SimpleExportChart
  filename="styled_chart"
  :export-styles="{
    '.chart-title': 'font-size: 18px !important; font-weight: bold !important',
    '.chart-data': 'color: #333 !important',
    '.hidden-in-print': 'display: none !important'
  }"
>
  <div class="chart-container">
    <h3 class="chart-title">圖表標題</h3>
    <div class="chart-data">圖表數據</div>
    <div class="hidden-in-print">不列印的內容</div>
  </div>
</SimpleExportChart>
```

#### 3. 動態配置
```vue
<script setup>
import { computed } from 'vue'

const props = defineProps<{
  data: ChartData[]
  period: 'daily' | 'weekly' | 'monthly'
}>()

const exportConfig = computed(() => ({
  filename: `chart_${props.period}`,
  title: `${props.period === 'daily' ? '每日' : props.period === 'weekly' ? '每週' : '每月'}報表`,
  mode: 'auto' as const
}))
</script>

<template>
  <SimpleExportChart v-bind="exportConfig">
    <ChartComponent :data="data" :period="period" />
  </SimpleExportChart>
</template>
```

## 樣式處理指南

### CSS 媒體查詢最佳實踐
```css
/* 組件樣式檔案 */
<style scoped>
/* 螢幕顯示樣式 */
.chart-container {
  height: 400px;
  background: #f9f9f9;
}

/* 列印專用樣式 */
@media print {
  .chart-container {
    height: auto !important;
    background: white !important;
    color: #333 !important;
  }
  
  /* 隱藏不需要列印的元素 */
  .interactive-controls {
    display: none !important;
  }
  
  /* 確保文字清晰 */
  text, .text-content {
    fill: #333 !important;
    color: #333 !important;
  }
  
  /* 修復 flex 佈局 */
  .flex-container {
    height: auto !important;
    min-height: auto !important;
  }
}
</style>
```

### 動態樣式處理
```typescript
// 如果需要程式化控制樣式
const dynamicStyles = computed(() => ({
  '.chart-title': `font-size: ${titleSize.value}px !important`,
  '.chart-data': `color: ${dataColor.value} !important`
}))
```

## 常見問題與解決方案

### 1. 匯出內容不完整
**問題**: 某些元素沒有出現在 PDF 中
**原因**: 元素被自動排除規則過濾
**解決**: 檢查 `excludeSelectors` 配置，或使用 `mode="html"` 強制 HTML 模式

```vue
<!-- 解決方案 -->
<SimpleExportChart 
  mode="html" 
  :exclude-selectors="['.export-button']"
>
```

### 2. 匯出過程中閃爍
**問題**: 點擊匯出按鈕時圖表會閃爍
**原因**: JavaScript 動態樣式修改
**解決**: 使用 CSS `@media print` 替代動態樣式，或設定 `exportStyles: {}`

```vue
<!-- 解決方案 -->
<SimpleExportChart :export-styles="{}">
```

### 3. 圖表尺寸不正確
**問題**: PDF 中圖表大小與螢幕顯示不符
**原因**: CSS 容器尺寸限制
**解決**: 在 `@media print` 中設定正確的尺寸

```css
@media print {
  .chart-container {
    width: 100% !important;
    height: auto !important;
    max-width: none !important;
  }
}
```

### 4. 中文字體問題
**問題**: PDF 中中文顯示異常
**原因**: 瀏覽器預設字體不支援中文
**解決**: 系統已內建中文字體支援，確保使用系統字體

```css
.chart-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif;
}
```

## 🧪 測試策略

### 單元測試
```typescript
// 測試 useElementExport
describe('useElementExport', () => {
  it('should export element with correct config', async () => {
    const { exportElement } = useElementExport()
    const mockElement = document.createElement('div')
    
    await exportElement(mockElement, {
      filename: 'test',
      mode: 'html'
    })
    
    // 驗證匯出邏輯
  })
})
```

### 整合測試
```typescript
// 測試 SimpleExportChart 組件
describe('SimpleExportChart', () => {
  it('should render with export button', () => {
    const wrapper = mount(SimpleExportChart, {
      props: { showExportButton: true },
      slots: { default: '<div>Test Content</div>' }
    })
    
    expect(wrapper.find('.export-button')).toBeTruthy()
  })
})
```

### 視覺測試
- 使用 Playwright 進行 PDF 輸出測試
- 比較不同瀏覽器的匯出結果
- 驗證響應式設計在列印時的表現

## 📈 效能優化

### 最佳實踐
1. **最小化 DOM 操作**：避免頻繁的樣式修改
2. **使用 CSS 媒體查詢**：減少 JavaScript 介入
3. **延遲載入**：按需載入匯出功能
4. **記憶體管理**：及時清理事件監聽器和 DOM 引用

### 效能監控
```typescript
// 匯出效能監控
const startTime = performance.now()
await exportElement(container, config)
const endTime = performance.now()
console.log(`匯出耗時: ${endTime - startTime}ms`)
```

## 🔄 版本更新與遷移

### 從舊系統遷移

#### 舊系統 (v1.0)
```vue
<ExportableChart
  :export-config="complexConfig"
  :export-region="regionConfig"
  export-mode="html"
>
```

#### 新系統 (v2.0)
```vue
<SimpleExportChart
  filename="chart"
  mode="auto"
>
```

#### 遷移檢查清單
- [ ] 移除 `CHART_EXPORT_TEMPLATES` 引用
- [ ] 移除 `EXPORT_REGION_TEMPLATES` 引用
- [ ] 替換 `ExportableChart` 為 `SimpleExportChart`
- [ ] 簡化配置選項
- [ ] 更新相關類型定義

## 開發指南

### 新增圖表組件匯出功能
1. **包裝組件**：使用 `SimpleExportChart` 包裝
2. **配置檔名**：設定有意義的檔案名稱
3. **測試功能**：驗證匯出內容完整性
4. **樣式調整**：使用 `@media print` 優化列印樣式

```vue
<!-- 範例：新圖表組件 -->
<template>
  <SimpleExportChart
    filename="my_new_chart"
    title="新圖表"
    :show-export-button="showExportButton"
  >
    <div class="new-chart-container">
      <!-- 圖表內容 -->
    </div>
  </SimpleExportChart>
</template>

<style scoped>
@media print {
  .new-chart-container {
    /* 列印樣式 */
  }
}
</style>
```

### 擴展匯出功能
如需新增功能，修改 `useElementExport.ts`：
```typescript
// 新增新的匯出模式
export type ExportMode = 'auto' | 'svg' | 'html' | 'custom'

// 新增自訂處理邏輯
if (mode === 'custom') {
  await handleCustomExport(container, config)
}
```

## 相關文檔

- [開發筆記：圖表匯出系統開發](../dev-notes/CHART_EXPORT_SYSTEM_DEVELOPMENT.md)
- [業務健康度儀表板](./business-health-dashboard.md)
- [圖表架構設計](../architecture/CHART_ARCHITECTURE.md)
- [Vue 組件開發指南](../vue-platform/README.md)

---

**文檔版本**: v2.0  
**最後更新**: 2025-08-05  
**維護者**: 前端開發團隊  
**審核者**: 技術架構師