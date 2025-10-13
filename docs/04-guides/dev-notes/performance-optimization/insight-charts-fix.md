# Insight Charts 修正方案

## 問題分析

1. **Path問題**: insight頁面直接使用unovis組件，但沒有適當的錯誤處理
2. **缺少狀態管理**: 沒有使用`useChartStateWithComponent`進行圖表狀態管理
3. **組件結構問題**: 直接在template中組合圖表組件

## 解決方案

### 1. 創建專用圖表組件

為每個insight頁面創建專用的圖表組件，放在對應的目錄下：

```
src/components/insights/
├── health/
│   ├── HealthTrendChart.vue
│   ├── HealthComparisonChart.vue
│   └── RiskDistributionChart.vue
├── customer/
│   ├── RFMDistributionChart.vue
│   ├── LTVTrendChart.vue
│   └── ActionPriorityChart.vue
├── operational/
│   ├── HourlyEfficiencyChart.vue
│   ├── EfficiencyTrendChart.vue
│   └── BottleneckChart.vue
└── risk/
    ├── RiskLevelChart.vue
    ├── RiskTrendChart.vue
    └── RiskComparisonChart.vue
```

### 2. 圖表組件範例結構

每個圖表組件應該遵循現有模式，例如：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { VisLine } from '@unovis/vue'
import { Line, BulletShape } from '@unovis/ts'
import XYContainer from '@/components/charts/base/XYContainer.vue'
import ChartCard from '@/components/charts/ChartCard.vue'

type DataRecord = {
  week: string
  customerQuality: number
  operationalEfficiency: number
  supportEffectiveness: number
}

defineProps<{
  data: DataRecord[]
}>()

const chartConfig = ref({
  x: (d: DataRecord) => new Date(d.week + 'T00:00:00'),
  y: [
    (d: DataRecord) => d.customerQuality,
    (d: DataRecord) => d.operationalEfficiency,
    (d: DataRecord) => d.supportEffectiveness,
  ],
})

const auxiliary = ref({
  axis: [
    {
      type: 'x',
      position: 'bottom',
      tickFormat: (d: any) => new Date(d).toLocaleDateString(),
    },
    { type: 'y', position: 'left' },
  ],
  legend: {
    items: [
      { name: '客戶價值', shape: BulletShape.Circle },
      { name: '營運效率', shape: BulletShape.Square },
      { name: '客服效能', shape: BulletShape.Triangle },
    ],
  },
  tooltip: {
    triggers: {
      [Line.selectors.line]: (d: any) => `
        <div class="p-2">
          <div class="text-sm font-semibold">${new Date(d.week + 'T00:00:00').toLocaleDateString()}</div>
          <div class="text-xs mt-1">
            客戶價值: ${d.customerQuality.toFixed(1)}%<br/>
            營運效率: ${d.operationalEfficiency.toFixed(1)}%<br/>
            客服效能: ${d.supportEffectiveness.toFixed(1)}%
          </div>
        </div>
      `,
    },
  },
})
</script>

<template>
  <ChartCard title="健康度週度趨勢">
    <template #default="{ width, height }">
      <XYContainer
        :data="data"
        :auxiliary="auxiliary"
        :containerSize="{ width, height }"
      >
        <VisLine v-bind="chartConfig" />
      </XYContainer>
    </template>
  </ChartCard>
</template>
```

### 3. 在Insight頁面中使用

修正後的insight頁面應該像這樣使用：

```vue
<script setup lang="ts">
import DashboardHeader from '@/components/dashboard/DashboardHeader.vue'
import HealthTrendChart from '@/components/insights/health/HealthTrendChart.vue'
import HealthComparisonChart from '@/components/insights/health/HealthComparisonChart.vue'
import RiskDistributionChart from '@/components/insights/health/RiskDistributionChart.vue'
import { useBusinessHealthOverview } from '@/composables/queries/useBusinessHealthQueries'
import { useChartStateWithComponent } from '@/composables/useChartState'
import { useDashboardRefresh } from '@/composables/useDashboardRefresh'
import { computed } from 'vue'

// 查詢數據
const businessHealthQuery = useBusinessHealthOverview()
const dashboardRefresh = useDashboardRefresh('executive-health')

// 處理數據
const healthTrendData = computed(() => {
  const metrics = businessHealthQuery.data.value?.metrics || []
  return metrics
    .slice(0, 12)
    .reverse()
    .map((metric) => ({
      week: metric.week,
      customerQuality: (metric.customer_quality_ratio || 0) * 100,
      operationalEfficiency: (metric.completion_rate || 0) * 100,
      supportEffectiveness: Math.max(
        0,
        100 - (metric.avg_response_time || 0) * 10,
      ),
    }))
})

const healthComparisonData = computed(() => {
  const latest = businessHealthQuery.data.value?.metrics?.[0]
  if (!latest) return []

  return [
    {
      dimension: '客戶價值',
      current: (latest.customer_quality_ratio || 0) * 100,
      target: 80,
    },
    {
      dimension: '營運效率',
      current: (latest.completion_rate || 0) * 100,
      target: 85,
    },
    {
      dimension: '客服效能',
      current: Math.max(0, 100 - (latest.avg_response_time || 0) * 10),
      target: 90,
    },
  ]
})

// 使用 useChartStateWithComponent 管理圖表狀態
const healthTrendChart = useChartStateWithComponent(
  businessHealthQuery,
  HealthTrendChart,
  {
    emptyMessage: '暫無健康度趨勢數據',
    errorMessage: '載入健康度趨勢失敗',
    chartProps: {
      data: healthTrendData,
    },
  },
)

const healthComparisonChart = useChartStateWithComponent(
  businessHealthQuery,
  HealthComparisonChart,
  {
    emptyMessage: '暫無健康度對比數據',
    errorMessage: '載入健康度對比失敗',
    chartProps: {
      data: healthComparisonData,
    },
  },
)
</script>

<template>
  <div class="space-y-6">
    <!-- Dashboard Header -->
    <DashboardHeader
      title="經營健康度總覽"
      description="業務全貌洞察、戰略決策支撐和風險預警系統"
      :last-updated="dashboardRefresh.lastUpdated.value"
      :is-refreshing="
        dashboardRefresh.isRefreshing.value ||
        businessHealthQuery.isLoading.value
      "
      :on-refresh="businessHealthQuery.refetch"
    />

    <!-- 基礎圖表區塊 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 使用 ChartStateWithComponent 的結果 -->
      <component :is="healthTrendChart.renderChart" />
      <component :is="healthComparisonChart.renderChart" />
      <component :is="riskDistributionChart.renderChart" />
    </div>

    <!-- 其他現有內容... -->
  </div>
</template>
```

## 實施步驟

1. **創建圖表組件目錄結構**
2. **將每個insight頁面的圖表邏輯提取到獨立組件**
3. **更新insight頁面使用新的圖表組件**
4. **使用useChartStateWithComponent管理圖表狀態**
5. **測試所有圖表功能**

這樣修正後，insight頁面將具有：

- 適當的錯誤處理
- 載入狀態管理
- 數據驗證
- 可重用的圖表組件
- 與現有dashboard相同的代碼品質
