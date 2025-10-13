# Chart Composable 架構文件

## 概覽

本文件描述了圖表狀態管理的 Composable 架構，包含資料驗證、錯誤處理和狀態管理的統一解決方案。這個架構旨在簡化圖表組件的使用，提供一致的用戶體驗和開發體驗。

## 目錄

- [核心功能](#核心功能)
- [技術實作](#技術實作)
- [使用方式](#使用方式)
- [架構對比分析](#架構對比分析)
- [最佳實踐建議](#最佳實踐建議)
- [實施策略](#實施策略)
- [未來擴展可能性](#未來擴展可能性)

## 核心功能

### 1. 統一狀態管理
- **loading**: 資料載入中狀態
- **query-error**: API/網路錯誤
- **validation-error**: 資料格式/內容錯誤
- **empty**: 空資料狀態
- **success**: 資料驗證通過

### 2. 資料驗證系統
- **基礎驗證**: 存在性檢查、類型檢查、數量限制
- **欄位驗證**: 必要欄位檢查
- **自定義驗證**: 業務邏輯驗證函數
- **錯誤訊息**: 精確的錯誤描述

### 3. 錯誤處理機制
- **區分錯誤類型**: API 錯誤 vs 資料驗證錯誤
- **統一錯誤顯示**: 使用現有的 ChartError、ChartEmpty、ChartSkeleton 組件
- **重試功能**: 所有錯誤狀態都支援重試

## 技術實作

### 核心介面定義

```typescript
// 驗證選項
interface ChartDataValidationOptions {
  requiredFields?: string[]        // 必要欄位
  minItems?: number               // 最小資料數量
  maxItems?: number               // 最大資料數量
  customValidator?: (data: any) => boolean  // 自定義驗證函數
  allowEmpty?: boolean            // 是否允許空資料
}

// 驗證結果
interface ChartDataValidationResult {
  hasValidData: boolean          // 是否有有效資料
  isEmpty: boolean               // 是否為空資料
  hasError: boolean              // 是否有錯誤
  errorMessage: string | null    // 錯誤訊息
  validatedData: any[]           // 驗證過的資料
}
```

### 主要 Composable

```typescript
function useChartStateWithComponent<T>(
  query: UseQueryResult<T>,
  chartComponent: Component,
  options: {
    emptyMessage?: string
    errorMessage?: string
    chartProps?: Record<string, any>
    validation?: ChartDataValidationOptions
  } = {}
)
```

## 使用方式

### 基本使用
```vue
<template>
  <div class="col-span-6 row-span-4">
    <component :is="chartState.render" />
  </div>
</template>

<script setup>
import { useChartStateWithComponent } from '@/composables/useChartState'
import { useRevenueByCampaign } from '@/composables/queries/useRevenueQueries'
import RevenueCampaignStacked from '@/components/market/charts/RevenueCampaignStacked.vue'

const revenueByCampaignQuery = useRevenueByCampaign()
const chartState = useChartStateWithComponent(
  revenueByCampaignQuery,
  RevenueCampaignStacked,
  {
    emptyMessage: 'No campaign revenue data available'
  }
)
</script>
```

### 進階驗證配置
```typescript
const chartState = useChartStateWithComponent(
  revenueByCampaignQuery,
  RevenueCampaignStacked,
  {
    emptyMessage: 'No campaign revenue data available',
    errorMessage: 'Failed to load campaign revenue data',
    validation: {
      requiredFields: ['campaign_id', 'campaign_name', 'total_revenue'],
      minItems: 1,
      allowEmpty: false,
      customValidator: (data) => {
        // 自定義業務邏輯驗證
        return data.every(item => 
          typeof item.total_revenue === 'number' && 
          item.total_revenue >= 0 &&
          typeof item.campaign_name === 'string' &&
          item.campaign_name.trim() !== ''
        )
      }
    }
  }
)
```

## 架構對比分析

### 原有模式 vs 新模式

| 特點 | 原有模式 | 新模式 |
|------|----------|--------|
| **代碼重複** | 高 - 每個組件重複驗證邏輯 | 低 - 統一驗證邏輯 |
| **維護性** | 低 - 修改需要更新多個組件 | 高 - 集中式管理 |
| **一致性** | 低 - 容易出現不一致 | 高 - 統一標準 |
| **學習成本** | 低 - 直接使用組件 | 中 - 需要了解 composable |
| **靈活性** | 高 - 組件內自由實作 | 中 - 通過配置調整 |
| **錯誤處理** | 分散 - 各組件自行處理 | 統一 - 一致的處理方式 |

### 軟體工程原則分析

#### ✅ 新模式的優勢
- **單一責任原則**: 圖表組件專注渲染，composable 負責狀態管理
- **DRY 原則**: 避免重複的驗證邏輯
- **開放封閉原則**: 通過配置擴展，無需修改現有代碼
- **一致性**: 統一的錯誤處理和驗證標準

#### 需要注意的點
- **抽象層級**: 可能讓簡單案例變複雜
- **依賴性**: 組件與 composable 產生依賴關係
- **學習曲線**: 團隊需要時間適應

## 最佳實踐建議

### 混合模式策略
```typescript
// 80% 的標準圖表 - 使用 composable
const standardChart = useChartStateWithComponent(query, MyChart, {
  validation: { requiredFields: ['id', 'value'] }
})

// 20% 的特殊圖表 - 組件內部處理
const complexChart = useChartStateWithComponent(query, MyComplexChart, {
  // 不提供 validation，讓組件自己處理
})
```

### 分層架構建議
1. **Level 1**: 基礎狀態管理 (loading, error, empty) - 由 composable 統一處理
2. **Level 2**: 通用驗證 (requiredFields, minItems) - 由 composable 處理  
3. **Level 3**: 業務邏輯驗證 - 根據複雜度選擇處理層級

### 向後相容性
- 現有使用方式無需修改
- 驗證功能是選擇性增強
- 不提供 validation 選項時行為與之前相同

## 實施策略

### Phase 1: 觀察期 (1-2 週)
- [x] 建立基礎 composable 功能
- [x] 測試 RevenueCampaignStacked 組件
- [ ] 繼續測試更多圖表類型
- [ ] 觀察邊緣案例
- [ ] 收集團隊使用回饋

### Phase 2: 根據回饋調整
觸發條件與對應方案：
- **頻繁需要繞過驗證** → 考慮添加逃生機制
- **重複的驗證配置** → 考慮添加預設模板  
- **除錯困難** → 考慮添加開發模式增強

### Phase 3: 漸進式改進
- 根據實際需求小幅調整
- 保持 API 穩定性
- 避免破壞性變更

## 未來擴展可能性

### 1. 逃生機制 (Escape Hatch)
```typescript
// 選項 1: 簡單禁用驗證
useChartStateWithComponent(query, MyChart, {
  validation: false
})

// 選項 2: 組件自行處理
useChartStateWithComponent(query, MyChart, {
  validation: 'component-handled'
})
```

### 2. 預設驗證模板
```typescript
export const CHART_VALIDATION_PRESETS = {
  timeSeries: {
    requiredFields: ['date', 'value'],
    customValidator: (data) => data.every(item => !isNaN(new Date(item.date)))
  },
  categorical: {
    requiredFields: ['category', 'value'],
    customValidator: (data) => data.every(item => typeof item.value === 'number')
  },
  scatter: {
    requiredFields: ['x', 'y'],
    customValidator: (data) => data.every(item => 
      typeof item.x === 'number' && typeof item.y === 'number'
    )
  }
}
```

### 3. 開發模式增強
```typescript
// 開發環境除錯功能
if (process.env.NODE_ENV === 'development') {
  console.group(`Chart Validation: ${chartComponent.name}`)
  console.log('Data:', query.data.value)
  console.log('Validation Result:', validationResult.value)
  console.groupEnd()
}
```

## 結論

### 當前狀態評估 ✅
- **功能完整性**: 支援所有主要驗證需求，完整的錯誤處理機制
- **架構合理性**: 關注點分離，符合 Vue 3 composable 最佳實踐
- **實用性**: API 涵蓋 90% 使用場景，學習成本適中

### 建議方針
1. **暫時不修改**: 先用當前版本測試更多場景
2. **收集使用經驗**: 觀察實際使用中的問題
3. **保持開放態度**: 準備根據需求進行調整

這個架構在大多數情況下是更佳的做法，既能享受統一管理的好處，又保持了足夠的靈活性來處理特殊情況。