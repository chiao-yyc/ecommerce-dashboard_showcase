# 圖表架構文檔

## 概述

本文檔描述了解耦圖表架構的實現，以實現圖表渲染邏輯與卡片包裝功能之間的關注點分離。

## 架構設計

### 純圖表組件 (`/src/components/charts/pure/`)

純圖表組件僅處理視覺化邏輯，不包含任何外部樣式或卡片包裝依賴。

**核心特性：**

- 使用 aspect-ratio 約束實現響應式尺寸
- 通過 Vue 的 `defineExpose` 暴露圖例數據
- 接受 `width`、`height` 和 `maxHeight` props
- 專注於數據視覺化

**結構範例：**

```vue
<template>
  <div :class="`aspect-[16/9] w-full ${maxHeightClass}`">
    <SingleContainer
      :data="props.data"
      :auxiliary="auxiliary"
      :containerSize="{ width: props.width, height: props.height }"
    >
      <VisLine v-bind="chartConfig" />
    </SingleContainer>
  </div>
</template>

<script setup lang="ts">
// 僅包含圖表邏輯
defineExpose({ legendItems })
</script>
```

### 圖表卡片包裝器 (`/src/components/charts/cards/`)

卡片包裝器組件提供：

- 標題和描述顯示
- 圖例整合（標題欄或底部）
- 一致的卡片樣式
- 通過 ChartCard 基礎組件進行尺寸管理

**結構範例：**

```vue
<template>
  <ChartCard :title="title" :description="description">
    <template
      #titleLegend
      v-if="legendInHeader && chartRef?.legendItems?.length"
    >
      <VisBulletLegend :items="chartRef.legendItems" class="text-xs" />
    </template>
    <template #default="{ width, height }">
      <PureChart
        ref="chartRef"
        :data="data"
        :width="width"
        :height="height"
        :max-height="maxHeight"
      />
    </template>
  </ChartCard>
</template>
```

## 圖表類型與建議的長寬比

### 圓環圖（環形視覺化）

- **長寬比：** `aspect-square` (1:1)
- **使用場景：** 餅圖、圓環圖、環形進度指示器
- **組件：**
  - `BottleneckChart` → `BottleneckChartCard`
  - `RFMDistributionChart` → `RFMDistributionChartCard`
  - `RiskDistributionChart` → `RiskDistributionChartCard`
  - `RiskLevelChart` → `RiskLevelChartCard`

### 折線圖（趨勢視覺化）

- **長寬比：** `aspect-[16/9]` (16:9)
- **使用場景：** 時間序列、趨勢分析、多線比較
- **組件：**
  - `EfficiencyTrendChart` → `EfficiencyTrendChartCard`
  - `HealthTrendChart` → `HealthTrendChartCard`
  - `LTVTrendChart` → `LTVTrendChartCard`
  - `RiskTrendChart` → `RiskTrendChartCard`

### 條形圖（分類比較）

- **長寬比：** `aspect-[4/3]` (4:3)
- **使用場景：** 分類比較、排名視覺化
- **組件：**
  - `HourlyEfficiencyChart` → `HourlyEfficiencyChartCard`
  - `ActionPriorityChart` → `ActionPriorityChartCard`
  - `RiskComparisonChart` → `RiskComparisonChartCard`

## 與 useChartStateWithComponent 配合使用

### 基本使用模式

```typescript
const chartState = useChartStateWithComponent(
  dataQuery,
  ChartCardComponent, // 使用 ChartCard 包裝器，而非純組件
  {
    emptyMessage: 'No data available',
    errorMessage: 'Failed to load data',
    chartProps: computed(() => ({
      data: processedData.value,
      title: 'Chart Title',
      legendInHeader: false,
    })),
  },
)
```

### 關鍵要點

1. **始終使用 ChartCard 組件** 搭配 `useChartStateWithComponent`
2. **將 chartProps 包裝在 `computed()` 中** 以實現響應式
3. **使用 `.value` 訪問計算數據**（例如 `data: chartData.value`）
4. **包含 title prop** 以確保一致的標題顯示

### 模板使用

```vue
<template>
  <component :is="chartState.render" />
</template>
```

## 遷移指南

### 從舊架構遷移

```typescript
// 舊版 - 直接使用純組件
const chartState = useChartStateWithComponent(query, PureChartComponent, {
  chartProps: { data: chartData },
})
```

### 遷移到新架構

```typescript
// 新版 - 使用 ChartCard 包裝器
const chartState = useChartStateWithComponent(query, ChartCardComponent, {
  chartProps: computed(() => ({
    data: chartData.value,
    title: 'Chart Title',
    legendInHeader: false,
  })),
})
```

## 組件對應表

| 純組件                  | ChartCard 包裝器            | 圖表類型 | 長寬比          |
| ----------------------- | --------------------------- | -------- | --------------- |
| `BottleneckChart`       | `BottleneckChartCard`       | 圓環圖   | `aspect-square` |
| `HourlyEfficiencyChart` | `HourlyEfficiencyChartCard` | 條形圖   | `aspect-[4/3]`  |
| `EfficiencyTrendChart`  | `EfficiencyTrendChartCard`  | 折線圖   | `aspect-[16/9]` |
| `HealthTrendChart`      | `HealthTrendChartCard`      | 折線圖   | `aspect-[16/9]` |
| `RiskDistributionChart` | `RiskDistributionChartCard` | 圓環圖   | `aspect-square` |
| `RiskLevelChart`        | `RiskLevelChartCard`        | 圓環圖   | `aspect-square` |
| `RiskTrendChart`        | `RiskTrendChartCard`        | 折線圖   | `aspect-[16/9]` |
| `RiskComparisonChart`   | `RiskComparisonChartCard`   | 條形圖   | `aspect-[4/3]`  |
| `RFMDistributionChart`  | `RFMDistributionChartCard`  | 圓環圖   | `aspect-square` |
| `LTVTrendChart`         | `LTVTrendChartCard`         | 折線圖   | `aspect-[16/9]` |
| `ActionPriorityChart`   | `ActionPriorityChartCard`   | 條形圖   | `aspect-[4/3]`  |

## 優勢

### 1. **關注點分離**

- 純組件專注於視覺化
- 卡片包裝器處理展示和佈局
- 明確的責任邊界

### 2. **一致的響應式設計**

- aspect-ratio 確保在各種設備上正確縮放
- 不再有無限高度增長問題
- 可預測的尺寸行為

### 3. **改善可維護性**

- 圖表邏輯的單一真實來源
- 易於更新樣式而不影響圖表行為
- 清晰的組件層次結構

### 4. **增強可重用性**

- 純組件可以獨立使用
- 卡片包裝器提供一致的介面
- 靈活的組合模式

## 最佳實踐

### 1. **始終使用 ChartCard 包裝器**

- 搭配 `useChartStateWithComponent` 使用 ChartCard 組件
- 僅在特殊情況或直接使用時使用純組件

### 2. **響應式設計**

- 信任 aspect-ratio 約束進行尺寸調整
- 避免手動 height/width 覆蓋
- 讓網格系統處理佈局

### 3. **圖例管理**

- 大多數情況下使用 `legendInHeader: false`
- 僅在空間允許時啟用標題圖例
- 圖例數據來自純圖表組件

### 4. **數據響應式**

- 始終將 chartProps 包裝在 `computed()` 中
- 使用 `.value` 訪問響應式數據
- 確保數據在組件樹中正確流動

## 故障排除

### 常見問題

**圖表無響應：**

- 確保純組件使用正確的 aspect-ratio class
- 檢查 ChartCard 是否在適當的 flex/grid 容器中

**圖例未顯示：**

- 驗證純組件是否暴露 `legendItems`
- 檢查 `legendInHeader` prop 設置
- 確保圖例數據已填充

**數據未更新：**

- 將 chartProps 包裝在 `computed()` 中
- 訪問響應式數據時使用 `.value`
- 檢查查詢響應式鏈

**高度問題：**

- 移除任何手動高度約束
- 信任 aspect-ratio 進行尺寸調整
- 確保父容器具有適當的 flex 設置

---

_Generated with Claude Code - Chart Architecture Refactoring_
_Last Updated: $(date)_
