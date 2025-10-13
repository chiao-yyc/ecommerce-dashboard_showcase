# Vue 3 應用壓力測試指南

## 概述

本指南說明如何對 Vue 3 電商平台進行全面的壓力測試，包括前端效能測試、API負載測試和資料庫壓力測試。專案包含 463+ 個元件和 8 個核心業務模組，需要系統性的效能驗證策略。

## 測試目標

### 核心效能指標
- **頁面載入時間** ≤ 3 秒
- **API 響應時間** ≤ 1 秒  
- **資料庫查詢時間** ≤ 500ms
- **即時通知延遲** ≤ 2 秒
- **併發用戶支援** ≥ 100 人

### 關鍵測試場景
1. **客戶購物流程**：註冊 → 瀏覽 → 下單 → 支付
2. **管理員操作**：訂單處理、庫存管理、客服回覆
3. **即時同步**：前後台資料即時更新
4. **JSONB 快照**：訂單快照生成效能
5. **通知系統**：WebSocket 高並發連接

## 工具選型與配置

### 1. Artillery.io - API 負載測試

#### 安裝與設置
```bash
# 全域安裝
npm install -g artillery@latest

# 檢查安裝
artillery version
```

#### 基礎配置文件
```yaml
# performance-tests/artillery.config.yml
config:
  target: 'http://localhost:5174'
  phases:
    - duration: 60  # 1分鐘
      arrivalRate: 10  # 每秒10個請求
    - duration: 120 # 2分鐘
      arrivalRate: 20  # 每秒20個請求  
    - duration: 60  # 1分鐘
      arrivalRate: 5   # 降到每秒5個請求
  processor: './test-functions.js'
  
scenarios:
  - name: "用戶註冊流程"
    weight: 30
    flow:
      - post:
          url: "/api/auth/register"
          json:
            name: "{{ $randomFullName() }}"
            email: "test-{{ $randomInt(1, 10000) }}@example.com"
            password: "TestPass123!"
          capture:
            - json: "$.user.id"
              as: "userId"
      
  - name: "商品瀏覽"
    weight: 50
    flow:
      - get:
          url: "/api/products"
          qs:
            page: "{{ $randomInt(1, 10) }}"
            limit: 20
      - think: 2
      - get:
          url: "/api/products/{{ $randomInt(1, 50) }}"
      
  - name: "訂單建立"
    weight: 20
    flow:
      - post:
          url: "/api/orders"
          json:
            customer_id: "{{ userId }}"
            items:
              - product_id: "{{ $randomInt(1, 50) }}"
                quantity: "{{ $randomInt(1, 3) }}"
          expect:
            - statusCode: 201
```

### 2. k6 - 高級負載測試

#### 安裝
```bash
# macOS
brew install k6

# 或直接下載執行檔
curl -O https://github.com/grafana/k6/releases/latest/download/k6-darwin-arm64
```

#### Vue 3 專用測試腳本
```javascript
// performance-tests/k6-vue-app.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  stages: [
    { duration: '2m', target: 20 }, // 爬升到20用戶
    { duration: '5m', target: 20 }, // 維持20用戶
    { duration: '2m', target: 50 }, // 爬升到50用戶
    { duration: '5m', target: 50 }, // 維持50用戶
    { duration: '2m', target: 0 },  // 降到0用戶
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% 請求 < 2秒
    http_req_failed: ['rate<0.1'],     // 失敗率 < 10%
  },
};

const BASE_URL = 'http://localhost:5174';

export default function () {
  // 1. 訪問首頁
  const homeResponse = http.get(`${BASE_URL}/`);
  check(homeResponse, {
    '首頁載入成功': (r) => r.status === 200,
    '首頁載入時間 < 3秒': (r) => r.timings.duration < 3000,
  });

  sleep(1);

  // 2. 訪問商品列表
  const productsResponse = http.get(`${BASE_URL}/api/products`);
  check(productsResponse, {
    '商品 API 回應成功': (r) => r.status === 200,
    '商品 API < 1秒': (r) => r.timings.duration < 1000,
  });

  // 3. 模擬用戶註冊
  const registerData = {
    name: `測試用戶${Math.random()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
  };

  const registerResponse = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(registerData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(registerResponse, {
    '註冊 API 成功': (r) => r.status === 201,
    '註冊 API < 2秒': (r) => r.timings.duration < 2000,
  });

  sleep(2);
}

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-summary.json': JSON.stringify(data),
  };
}
```

### 3. Lighthouse CI - 前端效能測試

#### 設置配置
```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5174/',           // 首頁
        'http://localhost:5174/dashboard',  // 儀表板
        'http://localhost:5174/products',   // 商品列表
        'http://localhost:5174/orders',     // 訂單管理
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

#### Package.json 腳本
```json
{
  "scripts": {
    "perf:lighthouse": "lhci autorun",
    "perf:artillery": "artillery run performance-tests/artillery.config.yml",
    "perf:k6": "k6 run performance-tests/k6-vue-app.js",
    "perf:all": "npm run perf:lighthouse && npm run perf:artillery && npm run perf:k6"
  }
}
```

## Vue 3 專用效能監控

### Vue DevTools 效能分析

#### 設置開發環境監控
```typescript
// src/utils/performance.ts
export class VuePerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  
  static startMeasure(name: string) {
    performance.mark(`${name}-start`)
  }
  
  static endMeasure(name: string) {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    
    const measure = performance.getEntriesByName(name)[0]
    this.metrics.push({
      name,
      duration: measure.duration,
      timestamp: Date.now()
    })
  }
  
  static getMetrics() {
    return this.metrics
  }
  
  static clearMetrics() {
    this.metrics = []
    performance.clearMarks()
    performance.clearMeasures()
  }
}

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}
```

#### 元件效能追蹤
```vue
<script setup lang="ts">
import { VuePerformanceMonitor } from '@/utils/performance'
import { onMounted, onBeforeUnmount } from 'vue'

const componentName = 'ProductListView'

onMounted(() => {
  VuePerformanceMonitor.startMeasure(`${componentName}-mount`)
})

onBeforeUnmount(() => {
  VuePerformanceMonitor.endMeasure(`${componentName}-mount`)
  
  // 記錄效能資料
  const metrics = VuePerformanceMonitor.getMetrics()
  console.log('元件效能指標:', metrics)
})
</script>
```

### 記憶體洩漏檢測

```typescript
// src/utils/memory-monitor.ts
export class MemoryMonitor {
  private static measurements: MemoryMeasurement[] = []
  
  static measureMemory(): MemoryMeasurement {
    const memory = (performance as any).memory
    
    if (!memory) {
      console.warn('Memory API not available')
      return { usedJSHeapSize: 0, totalJSHeapSize: 0, timestamp: Date.now() }
    }
    
    const measurement = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      timestamp: Date.now()
    }
    
    this.measurements.push(measurement)
    return measurement
  }
  
  static detectMemoryLeak(): boolean {
    if (this.measurements.length < 10) return false
    
    const recent = this.measurements.slice(-10)
    const trend = this.calculateTrend(recent.map(m => m.usedJSHeapSize))
    
    // 如果記憶體使用量持續上升超過閾值，判斷為洩漏
    return trend > 1024 * 1024 // 1MB 持續增長
  }
  
  private static calculateTrend(values: number[]): number {
    const n = values.length
    const sumX = n * (n + 1) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0)
    const sumX2 = n * (n + 1) * (2 * n + 1) / 6
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  }
}

interface MemoryMeasurement {
  usedJSHeapSize: number
  totalJSHeapSize: number
  timestamp: number
}
```

## 執行壓力測試

### 測試環境準備

```bash
# 1. 啟動所有應用
cd admin-platform-vue && npm run dev &
cd ../front-stage-vue && npm run dev &
cd ../supabase && supabase start

# 2. 初始化測試資料
npm run db:reset
npm run seed:test-data

# 3. 啟動效能監控
npm run monitor:start
```

### 執行測試套件

```bash
# 輕量級測試 (開發階段)
npm run perf:dev

# 完整壓力測試 (CI/CD)
npm run perf:full

# 針對性測試
npm run perf:api      # 只測試 API
npm run perf:frontend # 只測試前端
npm run perf:db       # 只測試資料庫
```

## 📈 結果分析與報告

### 自動化報告生成

```typescript
// scripts/generate-perf-report.ts
interface PerformanceReport {
  timestamp: string
  summary: {
    passedTests: number
    failedTests: number
    averageResponseTime: number
    peakMemoryUsage: number
  }
  details: TestResult[]
  recommendations: string[]
}

class PerformanceReporter {
  static async generateReport(): Promise<PerformanceReport> {
    const lightHouseResults = await this.parseLighthouseResults()
    const artilleryResults = await this.parseArtilleryResults()
    const k6Results = await this.parseK6Results()
    
    return {
      timestamp: new Date().toISOString(),
      summary: this.calculateSummary([lightHouseResults, artilleryResults, k6Results]),
      details: [...lightHouseResults, ...artilleryResults, ...k6Results],
      recommendations: this.generateRecommendations()
    }
  }
  
  private static generateRecommendations(): string[] {
    const recommendations = []
    
    // 根據測試結果生成改進建議
    if (this.averageResponseTime > 1000) {
      recommendations.push('API 響應時間過長，考慮優化資料庫查詢或加入快取')
    }
    
    if (this.memoryUsage > 100 * 1024 * 1024) {
      recommendations.push('記憶體使用量過高，檢查是否有記憶體洩漏')
    }
    
    return recommendations
  }
}
```

## 效能基準與警報

### 效能指標基準

| 指標類別 | 目標值 | 警告閾值 | 嚴重閾值 |
|----------|--------|----------|----------|
| 頁面載入時間 | < 2秒 | 3秒 | 5秒 |
| API 響應時間 | < 500ms | 1秒 | 2秒 |
| 記憶體使用量 | < 50MB | 100MB | 200MB |
| 併發用戶數 | 100+ | 50 | 20 |
| 錯誤率 | < 1% | 5% | 10% |

### 自動化警報設置

```bash
# 設置 CI/CD 警報
# .github/workflows/performance-alert.yml
name: Performance Alert

on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小時檢查一次

jobs:
  performance-check:
    runs-on: ubuntu-latest
    steps:
      - name: Run Performance Tests
        run: npm run perf:full
        
      - name: Check Thresholds
        run: |
          if [ $(cat perf-results.json | jq '.summary.averageResponseTime') -gt 2000 ]; then
            echo "::error::Performance degradation detected!"
            exit 1
          fi
```

## 相關文檔

- [負載測試場景設計](./load-testing-scenarios.md)
- [效能監控指南](./performance-monitoring.md)
- [整合測試文檔](./integration-testing.md)
- [Vue 3 最佳實踐](../../02-development/architecture/architecture.md)

---

*最後更新: $(date "+%Y-%m-%d")*
*適用版本: Vue 3.5.x, Artillery 2.x, k6 0.46+*