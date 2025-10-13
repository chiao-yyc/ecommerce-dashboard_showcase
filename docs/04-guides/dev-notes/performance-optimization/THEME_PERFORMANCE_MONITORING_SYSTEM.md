# 主題性能監控系統

## 系統概述

主題性能監控系統提供即時的視覺效果性能評估，通過三重指標 (渲染時間、FPS、複雜度) 確保主題切換和視覺效果的最佳表現。

## 監控指標定義

### 1. 渲染時間 (Render Time)
**定義**: 主題切換觸發到 DOM 更新完成的時間間隔

**測量方法**:
```typescript
const testStart = performance.now()
// 執行主題切換操作
await themeOperations()
const renderTime = performance.now() - testStart
```

**評級標準**:
- 🟢 **≤ 16ms**: 優秀 (符合 60fps 標準)
- 🟡 **17-33ms**: 普通 (30fps 標準)  
- 🔴 **> 33ms**: 需優化 (低於 30fps)

**影響因素**:
- CSS 變數數量和複雜度
- DOM 元素數量
- 視覺效果複雜度
- 瀏覽器渲染引擎性能

### 2. FPS (每秒幀數)
**定義**: 動畫和視覺效果運行時的畫面更新頻率

**測量方法**:
```typescript
let frameCount = 0
const fpsStart = performance.now()

const countFrames = () => {
  frameCount++
  if (performance.now() - fpsStart < 1000) {
    requestAnimationFrame(countFrames)
  }
}
requestAnimationFrame(countFrames)

// 1 秒後 frameCount 即為 FPS 值
```

**評級標準**:
- 🟢 **≥ 60fps**: 流暢 (最佳使用者體驗)
- 🟡 **30-59fps**: 可用 (基本流暢)
- 🔴 **< 30fps**: 卡頓 (需要優化)

**影響因素**:
- 動畫複雜度 (CSS animations、transforms)
- GPU 加速使用情況
- 同時運行的動畫數量
- 設備硬體性能

### 3. 複雜度等級 (Complexity Level)
**定義**: 基於效果強度計算的視覺負載等級

**計算公式**:
```typescript
const avgIntensity = (glassIntensity + neonIntensity + fluidIntensity + noiseIntensity) / 4

const complexity = avgIntensity > 1.5 ? 'High' : 
                  avgIntensity > 1.0 ? 'Medium' : 'Low'
```

**等級說明**:
- 🟢 **Low**: 基礎效果，性能友好
- 🟡 **Medium**: 中等效果，平衡性能和視覺
- 🔴 **High**: 豐富效果，需注意性能

## 🧪 性能測試架構

### 三階段測試流程

#### Phase 1: 基準測試
**目的**: 建立性能基準線，排除環境干擾
```typescript
const baselineStart = performance.now()
await new Promise(resolve => requestAnimationFrame(resolve))
const baselineTime = performance.now() - baselineStart
```

#### Phase 2: 主題切換測試
**目的**: 測量實際主題切換的渲染性能
```typescript
const testStart = performance.now()

// 模擬複雜操作：快速切換多個主題
const themes = Object.keys(availableThemes.value)
for (let i = 0; i < 3; i++) {
  const randomTheme = themes[Math.floor(Math.random() * themes.length)]
  await new Promise(resolve => setTimeout(resolve, 100))
  // 模擬DOM重繪
  document.documentElement.style.setProperty('--test-var', Math.random().toString())
}

const testTime = performance.now() - testStart
const averageRenderTime = testTime / 3 // 平均每次切換時間
```

#### Phase 3: FPS 測試
**目的**: 評估動畫和視覺效果的流暢度
```typescript
let frameCount = 0
const fpsStart = performance.now()

const countFrames = () => {
  frameCount++
  if (performance.now() - fpsStart < 1000) {
    requestAnimationFrame(countFrames)
  }
}
requestAnimationFrame(countFrames)

// 等待測試完成
await new Promise(resolve => setTimeout(resolve, 1100))
const measuredFPS = frameCount
```

### 測試結果分析

#### 智能建議算法
```typescript
const generateSuggestion = (metrics) => {
  if (metrics.renderTime > 33) {
    return {
      level: 'warning',
      message: '建議降低效果強度以提升性能',
      actions: ['減少同時啟用的效果', '降低複雜效果強度', '檢查CSS優化機會']
    }
  }
  
  if (metrics.fps < 30) {
    return {
      level: 'error', 
      message: '檢測到低幀率，可能需優化動畫',
      actions: ['檢查GPU加速設定', '減少並行動畫', '簡化視覺效果']
    }
  }
  
  return {
    level: 'success',
    message: '性能表現良好！',
    actions: ['可以嘗試更豐富的效果', '當前設定已優化']
  }
}
```

## 📈 性能數據結構

### 監控數據模型
```typescript
interface PerformanceMetrics {
  renderTime: number        // 渲染時間 (ms)
  fps: number              // 幀率
  complexity: 'Low' | 'Medium' | 'High'  // 複雜度等級
  effectsCount: number     // 啟用效果數量
  isRunning: boolean       // 測試運行狀態
  lastUpdate: string       // 最後更新時間
}
```

### 歷史數據追蹤
```typescript
interface PerformanceHistory {
  timestamp: number
  metrics: PerformanceMetrics
  theme: string
  deviceInfo: {
    userAgent: string
    viewport: { width: number, height: number }
    devicePixelRatio: number
  }
}
```

## 監控系統實現

### 1. 即時監控 Hook
```typescript
const usePerformanceMonitoring = () => {
  const metrics = ref<PerformanceMetrics>({
    renderTime: 0,
    fps: 60,
    complexity: 'Low',
    effectsCount: 0,
    isRunning: false,
    lastUpdate: new Date().toLocaleTimeString()
  })
  
  const startTest = async () => {
    metrics.value.isRunning = true
    // 執行三階段測試
    await runPerformanceTest()
    metrics.value.isRunning = false
  }
  
  return { metrics, startTest }
}
```

### 2. 自動監控觸發
```typescript
// 主題切換時自動更新性能指標
watch(currentThemeKey, async () => {
  if (autoMonitoring.value) {
    const start = performance.now()
    await nextTick() // 等待DOM更新
    metrics.value.renderTime = performance.now() - start
    updateComplexityLevel()
  }
})
```

### 3. 性能警告系統
```typescript
const performanceWarnings = computed(() => {
  const warnings = []
  
  if (metrics.value.renderTime > 33) {
    warnings.push({
      type: 'slow-render',
      message: '渲染時間過長',
      severity: 'high'
    })
  }
  
  if (metrics.value.fps < 45) {
    warnings.push({
      type: 'low-fps', 
      message: 'FPS 低於建議值',
      severity: 'medium'
    })
  }
  
  return warnings
})
```

## 視覺化呈現

### 1. 即時指標顯示
```vue
<!-- 三欄式指標面板 -->
<div class="grid grid-cols-3 gap-3">
  <!-- 渲染時間 -->
  <div class="text-center">
    <div class="text-lg font-bold" :class="{
      'text-green-600': renderTime <= 16,
      'text-yellow-600': renderTime > 16 && renderTime <= 33,
      'text-red-600': renderTime > 33
    }">
      {{ renderTime.toFixed(1) }}ms
    </div>
    <div class="text-xs text-muted-foreground">渲染時間</div>
    <div class="text-xs">{{ renderTimeStatus }}</div>
  </div>
  
  <!-- FPS -->
  <div class="text-center">
    <div class="text-lg font-bold" :class="fpsColorClass">
      {{ Math.round(fps) }}
    </div>
    <div class="text-xs text-muted-foreground">FPS</div>
    <div class="text-xs">{{ fpsStatus }}</div>
  </div>
  
  <!-- 複雜度 -->
  <div class="text-center">
    <Badge :variant="complexityVariant">
      {{ complexity }}
    </Badge>
    <div class="text-xs text-muted-foreground">複雜度</div>
    <div class="text-xs">{{ effectsCount }} 種效果</div>
  </div>
</div>
```

### 2. 測試進度指示
```vue
<!-- 測試狀態顯示 -->
<Badge variant="outline" class="cursor-help" :title="lastUpdate">
  {{ isRunning ? '🔄 測試中...' : '✅ 空閒' }}
</Badge>
```

### 3. 互動控制面板
```vue
<div class="flex gap-2">
  <Button 
    @click="startPerformanceTest"
    :disabled="isRunning"
    class="flex-1"
  >
    {{ isRunning ? '🔄 測試中...' : '🚀 執行效能測試' }}
  </Button>
  
  <Button 
    @click="resetMetrics" 
    variant="outline"
    title="重置指標"
  >
    🗘️
  </Button>
</div>
```

## 性能優化建議

### 1. 渲染性能優化
- **減少 CSS 重繪**: 使用 `transform` 和 `opacity` 而非 `width`、`height`
- **批量 DOM 操作**: 使用 `DocumentFragment` 或批量更新
- **避免頻繁樣式計算**: 快取計算結果

### 2. 動畫性能優化  
- **GPU 加速**: 使用 `will-change` 屬性
- **減少動畫層**: 避免同時運行過多動畫
- **優化關鍵幀**: 使用高效的動畫曲線

### 3. 效果複雜度管理
- **分級載入**: 根據設備性能動態調整效果
- **效果降級**: 低性能設備自動降級效果
- **用戶選擇**: 提供性能模式選項

## 監控數據分析

### 性能基準表
| 設備類型 | 渲染時間基準 | FPS 基準 | 建議複雜度 |
|----------|-------------|----------|-----------|
| 高端桌面 | < 8ms | > 60fps | High |
| 一般桌面 | < 16ms | > 45fps | Medium |
| 高端手機 | < 16ms | > 45fps | Medium |
| 一般手機 | < 24ms | > 30fps | Low |
| 低端設備 | < 33ms | > 24fps | Low |

### 問題診斷流程
```
性能問題 → 指標分析 → 根因識別 → 優化方案 → 效果驗證
    ↓         ↓         ↓         ↓         ↓
測試失敗 → 查看指標 → 識別瓶頸 → 調整設定 → 重新測試
```

## 未來發展方向

### Phase 1: 監控增強
- [ ] 記憶體使用量監控
- [ ] CPU 使用率追蹤
- [ ] 網路請求性能分析

### Phase 2: 智能優化
- [ ] 自動效果調整算法
- [ ] 設備性能自適應
- [ ] 機器學習優化建議

### Phase 3: 開發者工具
- [ ] 性能回歸測試
- [ ] 基準測試比較
- [ ] 性能報告生成

---

*建立日期: 2025-08-29*  
*版本: 1.0.0*