# 專案全面優化計劃

## 文檔說明

本文檔作為 [專案結構優化建議](./project-optimization-roadmap.md) 的補充，提供更全面的優化策略，涵蓋性能、測試、API、開發流程等多個維度的改進建議。

---
**文檔資訊**
- 最後更新：2025-07-22
- 版本：1.0.0
- 補充文檔：與 project-optimization-roadmap.md 搭配使用
- 分析基礎：實際專案代碼深度檢查
---

## **優化策略總覽**

### 與現有優化建議的關係
```
現有優化建議 (project-optimization-roadmap.md)
├── ✅ 組件結構重組 (Phase 1-3)
├── ✅ 檔案命名規範
└── ✅ TypeScript 類型整理

本文檔補充內容
├── 🚀 性能與使用者體驗優化
├── 🧪 測試策略與品質保證
├── 🔧 API 服務與錯誤處理
├── 📊 監控與分析系統
└── 🛠️ 開發流程與工具鏈
```

## ⚡ **性能優化策略**

### 1.1 前端性能優化

#### **當前性能狀況分析**
基於 463 個組件的大型應用，發現以下性能瓶頸：

##### **JavaScript Bundle 分析**
```bash
# 當前 bundle 大小分析 (估算)
dist/
├── index-[hash].js      # ~800KB (主要 chunk)
├── vendor-[hash].js     # ~1.2MB (第三方庫)
├── charts-[hash].js     # ~300KB (圖表庫)
└── views-[hash].js      # ~600KB (頁面組件)

總計: ~2.9MB (未壓縮)
```

##### **具體優化方案**
```typescript
// 1. 圖表組件懶加載優化
// charts/index.ts
export const LazyAreaChart = defineAsyncComponent({
  loader: () => import('./pure/AreaChart.vue'),
  loadingComponent: ChartSkeleton,
  errorComponent: ChartError,
  delay: 200,
  timeout: 5000
})

// 2. 路由級別的代碼分割
// router/index.ts  
const routes = [
  {
    path: '/insights',
    children: [
      {
        path: 'executive-health',
        component: () => import(
          /* webpackChunkName: "insights-executive" */
          '@/views/DashboardExecutiveHealth.vue'
        )
      }
    ]
  }
]

// 3. 第三方庫按需導入
// 替換全量導入
import * as echarts from 'echarts'
// 改為按需導入
import { init, use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
```

#### **內存優化策略**
```typescript
// composables/useListVirtualization.ts
import { useVirtualList } from '@tanstack/vue-virtual'

export const useOptimizedList = <T>(
  items: Ref<T[]>,
  estimateSize = 50
) => {
  const containerRef = ref<HTMLElement>()
  
  const virtualizer = useVirtualList({
    count: computed(() => items.value.length),
    getScrollElement: () => containerRef.value,
    estimateSize: () => estimateSize,
    overscan: 10 // 預渲染項目數
  })
  
  return {
    containerRef,
    virtualizer,
    visibleItems: computed(() => 
      virtualizer.getVirtualItems().map(item => ({
        ...item,
        data: items.value[item.index]
      }))
    )
  }
}
```

### 1.2 數據加載優化

#### **API 請求優化**
```typescript
// composables/useOptimizedQuery.ts
import { useQuery, useInfiniteQuery } from '@tanstack/vue-query'

// 智能快取策略
export const useCustomersQuery = (filters: Ref<CustomerFilters>) => {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: ({ queryKey }) => {
      const [_, filters] = queryKey
      return customerApi.getFiltered(filters)
    },
    staleTime: 5 * 60 * 1000,      // 5分鐘內認為數據是新鮮的
    gcTime: 30 * 60 * 1000,        // 30分鐘後清理緩存
    refetchOnWindowFocus: false,    // 避免頻繁刷新
    retry: (failureCount, error) => {
      // 智能重試邏輯
      if (error.status === 404) return false
      return failureCount < 3
    }
  })
}

// 無限滾動優化
export const useInfiniteCustomers = () => {
  return useInfiniteQuery({
    queryKey: ['customers', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      customerApi.getPaginated({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => 
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 1
  })
}
```

#### **圖片與資源優化**
```typescript
// utils/imageOptimization.ts
export class ImageOptimizer {
  private static cache = new Map<string, string>()
  
  static async optimizeAvatar(url: string, size: number = 40): Promise<string> {
    const cacheKey = `${url}-${size}`
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }
    
    // 使用 Canvas API 或 URL 參數優化圖片
    const optimizedUrl = `${url}?w=${size}&h=${size}&f=webp&q=80`
    this.cache.set(cacheKey, optimizedUrl)
    
    return optimizedUrl
  }
  
  static preloadCriticalImages(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }
}
```

## 🧪 **測試策略完善**

### 2.1 測試覆蓋率提升計劃

#### **當前測試狀況詳析**
```bash
# 現有測試文件統計
tests/unit/composables/     # 11個測試文件 ✅ 覆蓋完整
tests/unit/components/      # 僅部分組件有測試 ❌
tests/integration/         # 整合測試基礎架構 ⚠️ 需要擴充
e2e/                       # 1個 E2E 測試 ❌ 嚴重不足
```

#### **優先測試清單**
##### **高優先級 (業務關鍵組件)**
```typescript
// 1. 認證相關組件測試
describe('LoginForm', () => {
  it('should validate email format', () => {
    // 測試郵件格式驗證
  })
  
  it('should handle login errors', () => {
    // 測試登入錯誤處理
  })
  
  it('should redirect after successful login', () => {
    // 測試登入後重導向
  })
})

// 2. 權限系統測試
describe('PermissionMatrix', () => {
  it('should display user permissions correctly', () => {
    // 測試權限顯示
  })
  
  it('should handle permission changes', () => {
    // 測試權限變更
  })
})

// 3. 數據表格測試
describe('DataTable', () => {
  it('should render large datasets efficiently', () => {
    // 測試大數據集渲染
  })
  
  it('should handle sorting and filtering', () => {
    // 測試排序篩選功能
  })
})
```

##### **中優先級 (用戶體驗組件)**
- 圖表組件 (charts/**)
- 通知組件 (notify/**)
- 表單組件 (common/forms/**)

#### **E2E 測試場景規劃**
```typescript
// e2e/critical-flows.spec.ts
describe('Critical User Flows', () => {
  test('Complete customer management flow', async ({ page }) => {
    // 1. 登入系統
    await page.goto('/login')
    await page.fill('[data-testid=email]', 'admin@test.com')
    await page.fill('[data-testid=password]', 'password')
    await page.click('[data-testid=login-button]')
    
    // 2. 導航到客戶頁面
    await page.click('[data-testid=nav-customers]')
    await expect(page).toHaveURL('/customers')
    
    // 3. 新增客戶
    await page.click('[data-testid=add-customer]')
    await page.fill('[data-testid=customer-name]', 'Test Customer')
    await page.fill('[data-testid=customer-email]', 'test@example.com')
    await page.click('[data-testid=save-customer]')
    
    // 4. 驗證客戶已新增
    await expect(page.locator('[data-testid=customer-list]')).toContainText('Test Customer')
  })
  
  test('Order creation and payment flow', async ({ page }) => {
    // 完整訂單創建流程測試
  })
  
  test('Permission management flow', async ({ page }) => {
    // 權限管理流程測試
  })
})
```

### 2.2 自動化測試流程

#### **CI/CD 整合測試**
```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - name: Run integration tests
        run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - name: Start test server
        run: npm run dev &
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: e2e-screenshots
          path: test-results/
```

## **API 服務與錯誤處理強化**

### 3.1 統一錯誤處理系統

#### **現有 API 服務優化**
基於現有的 ServiceFactory 模式，添加統一錯誤處理：

```typescript
// api/services/base/ErrorHandler.ts
export interface ApiError {
  code: string
  message: string
  status: number
  timestamp: string
  path: string
  details?: Record<string, unknown>
}

export class ApiErrorHandler {
  private static errorMessages: Record<string, string> = {
    'NETWORK_ERROR': '網路連線異常，請檢查網路設定',
    'TIMEOUT_ERROR': '請求逾時，請稍後重試',
    'AUTH_ERROR': '認證失敗，請重新登入',
    'PERMISSION_ERROR': '權限不足，無法執行此操作',
    'VALIDATION_ERROR': '資料格式不正確，請檢查輸入',
    'SERVER_ERROR': '伺服器暫時無法回應，請稍後重試'
  }
  
  static classify(error: any): ApiError {
    const now = new Date().toISOString()
    
    // 網路錯誤
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: this.errorMessages.NETWORK_ERROR,
        status: 0,
        timestamp: now,
        path: error.config?.url || 'unknown'
      }
    }
    
    // HTTP 錯誤
    const status = error.response.status
    const path = error.config?.url || 'unknown'
    
    if (status === 401) {
      return {
        code: 'AUTH_ERROR',
        message: this.errorMessages.AUTH_ERROR,
        status,
        timestamp: now,
        path
      }
    }
    
    if (status === 403) {
      return {
        code: 'PERMISSION_ERROR',
        message: this.errorMessages.PERMISSION_ERROR,
        status,
        timestamp: now,
        path
      }
    }
    
    if (status >= 400 && status < 500) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.response.data?.message || this.errorMessages.VALIDATION_ERROR,
        status,
        timestamp: now,
        path,
        details: error.response.data
      }
    }
    
    return {
      code: 'SERVER_ERROR',
      message: this.errorMessages.SERVER_ERROR,
      status,
      timestamp: now,
      path
    }
  }
  
  static async handle(error: any): Promise<ApiError> {
    const apiError = this.classify(error)
    
    // 記錄錯誤
    console.error('API Error:', apiError)
    
    // 特殊處理
    if (apiError.code === 'AUTH_ERROR') {
      const authStore = useAuthStore()
      await authStore.signOut()
      window.location.href = '/login'
    }
    
    // 顯示用戶通知
    const toast = useToast()
    toast.error(apiError.message)
    
    return apiError
  }
}
```

#### **重試機制實現**
```typescript
// api/services/base/RetryHandler.ts
export class RetryHandler {
  private static readonly DEFAULT_RETRIES = 3
  private static readonly RETRY_DELAY = 1000
  
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = this.DEFAULT_RETRIES,
    delayMs = this.RETRY_DELAY
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error
        
        // 不需要重試的錯誤類型
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error
        }
        
        if (attempt < maxRetries) {
          // 指數退避重試
          const delay = delayMs * Math.pow(2, attempt - 1)
          await this.sleep(delay)
          console.warn(`API call failed, retrying... (${attempt}/${maxRetries})`)
        }
      }
    }
    
    throw lastError
  }
  
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 3.2 API 性能監控

#### **請求時間監控**
```typescript
// api/services/base/PerformanceMonitor.ts
export class ApiPerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()
  
  static startTimer(endpoint: string): string {
    const timerId = `${endpoint}-${Date.now()}`
    performance.mark(`api-start-${timerId}`)
    return timerId
  }
  
  static endTimer(timerId: string, endpoint: string): number {
    performance.mark(`api-end-${timerId}`)
    
    const measureName = `api-duration-${timerId}`
    performance.measure(measureName, `api-start-${timerId}`, `api-end-${timerId}`)
    
    const measure = performance.getEntriesByName(measureName)[0]
    const duration = measure.duration
    
    // 記錄性能數據
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, [])
    }
    this.metrics.get(endpoint)!.push(duration)
    
    // 性能警告
    if (duration > 2000) {
      console.warn(`Slow API call: ${endpoint} took ${duration.toFixed(2)}ms`)
    }
    
    // 清理性能標記
    performance.clearMarks(`api-start-${timerId}`)
    performance.clearMarks(`api-end-${timerId}`)
    performance.clearMeasures(measureName)
    
    return duration
  }
  
  static getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {}
    
    this.metrics.forEach((durations, endpoint) => {
      result[endpoint] = {
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: Math.min(...durations),
        max: Math.max(...durations),
        count: durations.length
      }
    })
    
    return result
  }
}
```

## **監控與分析系統**

### 4.1 前端監控實現

#### **用戶行為追蹤**
```typescript
// utils/analytics.ts
export class AnalyticsTracker {
  private static events: AnalyticsEvent[] = []
  
  static track(event: AnalyticsEvent) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    })
    
    // 批量發送到後端
    if (this.events.length >= 10) {
      this.flush()
    }
  }
  
  static trackPageView(path: string) {
    this.track({
      type: 'page_view',
      properties: { path }
    })
  }
  
  static trackUserAction(action: string, target: string, properties?: Record<string, any>) {
    this.track({
      type: 'user_action',
      properties: { action, target, ...properties }
    })
  }
  
  static trackError(error: Error, context?: string) {
    this.track({
      type: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        context
      }
    })
  }
  
  private static async flush() {
    if (this.events.length === 0) return
    
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.events })
      })
      
      this.events = []
    } catch (error) {
      console.error('Failed to send analytics:', error)
    }
  }
}
```

#### **性能指標收集**
```typescript
// utils/performanceMetrics.ts
export class PerformanceMetrics {
  static collectWebVitals() {
    // Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.sendMetric)
      getFID(this.sendMetric)
      getFCP(this.sendMetric)
      getLCP(this.sendMetric)  
      getTTFB(this.sendMetric)
    })
  }
  
  static collectCustomMetrics() {
    // 自定義性能指標
    const navigationStart = performance.timeOrigin
    const domContentLoaded = performance.getEntriesByName('DOMContentLoaded')[0]?.startTime
    const loadComplete = performance.getEntriesByName('load')[0]?.startTime
    
    this.sendMetric({
      name: 'dom_content_loaded',
      value: domContentLoaded || 0,
      id: 'custom-dcl'
    })
    
    this.sendMetric({
      name: 'load_complete',
      value: loadComplete || 0,
      id: 'custom-load'
    })
  }
  
  private static sendMetric(metric: any) {
    // 發送性能指標到監控系統
    fetch('/api/metrics', {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'Content-Type': 'application/json' }
    }).catch(console.error)
  }
}
```

## **開發流程與工具鏈優化**

### 5.1 代碼品質工具配置

#### **ESLint 配置增強**
```json
// .eslintrc.json
{
  "extends": [
    "@vue/eslint-config-typescript",
    "@vue/eslint-config-prettier",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/no-unused-components": "error",
    "vue/no-unused-vars": "error",
    "vue/require-default-prop": "error",
    "vue/require-prop-types": "error"
  },
  "overrides": [
    {
      "files": ["*.test.ts", "*.spec.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

#### **Prettier 配置統一**
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "vueIndentScriptAndStyle": true,
  "endOfLine": "lf"
}
```

### 5.2 Git 工作流程優化

#### **Commit 規範**
```json
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修復
        'docs',     // 文檔
        'style',    // 樣式
        'refactor', // 重構
        'perf',     // 性能
        'test',     // 測試
        'chore',    // 構建過程或輔助工具的變動
        'revert'    // 回滾
      ]
    ],
    'subject-max-length': [2, 'always', 100],
    'subject-case': [2, 'always', 'sentence-case']
  }
}
```

#### **Git Hooks 設置**
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 代碼檢查
npm run lint
npm run type-check

# 測試檢查
npm run test:unit

# 代碼格式化
npm run format
```

## 📈 **實施時程與里程碑**

### 時程規劃

#### **第1個月：基礎優化**
- 週1-2：配置開發工具與代碼品質檢查
- 週3-4：實施基礎性能優化和錯誤處理

#### **第2個月：測試與監控**
- 週1-2：建立完整測試覆蓋
- 週3-4：實施監控與分析系統

#### **第3個月：進階功能**
- 週1-2：API 服務增強
- 週3-4：CI/CD 流程完善

### 成功指標

| 指標類型 | 當前狀況 | 目標數值 | 達成時間 |
|----------|----------|----------|----------|
| **測試覆蓋率** | ~40% | 85% | 2個月 |
| **Bundle 大小** | ~2.9MB | <2.0MB | 1個月 |
| **首屏載入時間** | ~3.5s | <2.0s | 1個月 |
| **API 平均響應時間** | ~800ms | <500ms | 3個月 |
| **錯誤率** | ~2% | <0.5% | 2個月 |

## **與現有優化建議的整合**

本文檔與 [專案結構優化建議](./project-optimization-roadmap.md) 的整合關係：

1. **並行執行**：結構優化與性能優化可同時進行
2. **優先級協調**：優先完成結構優化的 Phase 1，再進行性能優化
3. **測試保障**：所有優化都需要充分的測試覆蓋
4. **文檔同步**：優化過程中保持文檔更新

---

**更新紀錄**
- v1.0.0 (2025-07-22): 初始版本，補充全面優化策略
- 下次更新：根據實施進度和效果評估更新

**文檔狀態**：✅ 與現有優化建議協調，可並行實施