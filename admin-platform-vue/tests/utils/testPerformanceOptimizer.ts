/**
 * 測試效能優化工具
 * 分析和優化測試執行效能，解決超時問題
 */

import { vi } from 'vitest'

// ============================================================================
// 效能監控工具
// ============================================================================

/**
 * 測試執行時間監控器
 */
export class TestPerformanceMonitor {
  private startTime: number = 0
  private checkpoints: Record<string, number> = {}
  
  start() {
    this.startTime = performance.now()
    this.checkpoints = {}
  }
  
  checkpoint(name: string) {
    this.checkpoints[name] = performance.now() - this.startTime
  }
  
  getReport() {
    const endTime = performance.now() - this.startTime
    return {
      totalTime: endTime,
      checkpoints: this.checkpoints,
      summary: `總執行時間: ${endTime.toFixed(2)}ms`
    }
  }
  
  /**
   * 檢查是否超過建議執行時間
   */
  checkPerformance(thresholds: {
    warning: number  // 警告閾值 (ms)
    critical: number // 嚴重閾值 (ms)
  }) {
    const totalTime = performance.now() - this.startTime
    
    if (totalTime > thresholds.critical) {
      return { level: 'critical', time: totalTime, message: '測試執行時間過長，需要優化' }
    } else if (totalTime > thresholds.warning) {
      return { level: 'warning', time: totalTime, message: '測試執行時間較長，建議優化' }
    }
    
    return { level: 'good', time: totalTime, message: '測試執行時間良好' }
  }
}

// ============================================================================
// 測試效能優化配置
// ============================================================================

/**
 * 優化的測試超時配置
 * 根據測試類型設置不同的超時時間
 */
export const optimizedTestTimeouts = {
  // 單元測試 - 快速執行
  unit: {
    testTimeout: 5000,      // 5秒
    hookTimeout: 2000,      // 2秒  
    description: '單元測試應該快速執行'
  },
  
  // 整合測試 - 中等時間
  integration: {
    testTimeout: 15000,     // 15秒
    hookTimeout: 5000,      // 5秒
    description: '整合測試可能需要較長時間'
  },
  
  // 組件測試 - 中等時間
  component: {
    testTimeout: 10000,     // 10秒
    hookTimeout: 3000,      // 3秒
    description: '組件測試包含 DOM 渲染'
  },
  
  // 效能測試 - 較長時間
  performance: {
    testTimeout: 30000,     // 30秒
    hookTimeout: 10000,     // 10秒
    description: '效能測試需要較長執行時間'
  },
  
  // E2E 測試 - 最長時間  
  e2e: {
    testTimeout: 60000,     // 60秒
    hookTimeout: 15000,     // 15秒
    description: 'E2E 測試涉及完整流程'
  }
}

/**
 * 設置測試超時時間
 */
export function setTestTimeouts(type: keyof typeof optimizedTestTimeouts) {
  const config = optimizedTestTimeouts[type]
  
  vi.setConfig({
    testTimeout: config.testTimeout,
    hookTimeout: config.hookTimeout
  })
  
  return config
}

// ============================================================================
// Mock 效能優化
// ============================================================================

/**
 * 輕量級 Mock 配置
 * 減少不必要的 Mock 複雜度
 */
export const lightweightMockConfig = {
  /**
   * 最小化的 i18n Mock
   */
  createMinimalI18nMock: () => {
    return vi.mock('vue-i18n', async () => ({
      useI18n: () => ({
        t: vi.fn((key: string) => key),
        locale: { value: 'zh-TW' }
      })
    }))
  },

  /**
   * 快速的 Router Mock
   */
  createFastRouterMock: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    currentRoute: { value: { path: '/test' } }
  }),

  /**
   * 輕量級組件 Stubs
   */
  createLightStubs: () => ({
    // 只 stub 必要的組件
    RouterView: true,
    RouterLink: true,
    
    // 避免 stub 簡單組件
    // Button: true,  // 不 stub，讓真實組件渲染
    // Input: true,   // 不 stub，讓真實組件渲染
  }),

  /**
   * 批量 Mock 優化 (暫時停用，有作用域問題)
   */
  createBatchMocks: (mockConfigs: Record<string, any>) => {
    // 批量 Mock 採用配置合併方式，避免 Vitest 作用域衝突
    // 返回合併後的配置，由調用方使用 Object.assign 應用
    return Object.assign({}, ...Object.values(mockConfigs))
  }
}

// ============================================================================
// 測試資料優化
// ============================================================================

/**
 * 測試資料生成器
 * 生成最小但有效的測試數據
 */
export const testDataOptimizer = {
  /**
   * 生成最小的測試使用者數據
   */
  createMinimalUser: () => ({
    id: 'u1',
    name: 'Test User',
    email: 'test@example.com'
  }),

  /**
   * 生成最小的訂單數據
   */
  createMinimalOrder: () => ({
    id: 'o1',
    total: 100,
    status: 'pending'
  }),

  /**
   * 生成最小的產品數據
   */
  createMinimalProduct: () => ({
    id: 'p1',
    name: 'Test Product',
    price: 100
  }),

  /**
   * 批量生成測試資料
   */
  generateBatch: <T>(template: T, count: number, idField = 'id'): T[] => {
    return Array.from({ length: count }, (_, index) => ({
      ...template,
      [idField]: `${(template as any)[idField]}_${index + 1}`
    }))
  },

  /**
   * 生成大量資料用於效能測試
   */
  createLargeDataset: (size: 'small' | 'medium' | 'large' = 'small') => {
    const sizes = { small: 10, medium: 100, large: 1000 }
    const count = sizes[size]
    
    return {
      users: testDataOptimizer.generateBatch(testDataOptimizer.createMinimalUser(), count),
      orders: testDataOptimizer.generateBatch(testDataOptimizer.createMinimalOrder(), count),
      products: testDataOptimizer.generateBatch(testDataOptimizer.createMinimalProduct(), count)
    }
  }
}

// ============================================================================
// 並行測試優化
// ============================================================================

/**
 * 並行測試優化工具
 */
export const parallelTestOptimizer = {
  /**
   * 創建並行測試包裝器
   */
  createParallelWrapper: <T>(
    testFunction: () => Promise<T>,
    options: {
      timeout?: number
      retries?: number
    } = {}
  ) => {
    const { timeout = 10000, retries = 1 } = options
    
    return async () => {
      let lastError: any
      
      for (let i = 0; i <= retries; i++) {
        try {
          const result = await Promise.race([
            testFunction(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Test timeout')), timeout)
            )
          ])
          return result
        } catch (error) {
          lastError = error
          if (i < retries) {
            console.warn(`測試重試 ${i + 1}/${retries}:`, error)
          }
        }
      }
      
      throw lastError
    }
  },

  /**
   * 批量並行執行測試
   */
  runInBatches: async <T>(
    tasks: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> => {
    const results: T[] = []
    
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch.map(task => task()))
      results.push(...batchResults)
    }
    
    return results
  }
}

// ============================================================================
// 記憶體優化
// ============================================================================

/**
 * 記憶體優化工具
 */
export const memoryOptimizer = {
  /**
   * 測試後清理
   */
  cleanupAfterTest: () => {
    // 清理全域變數
    if (global.gc) {
      global.gc()
    }
    
    // 清理 DOM
    if (typeof document !== 'undefined') {
      document.body.innerHTML = ''
    }
    
    // 清理 console
    vi.clearAllMocks()
  },

  /**
   * 監控記憶體使用
   */
  monitorMemoryUsage: () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage()
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
        rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      }
    }
    return null
  },

  /**
   * 創建記憶體洩漏檢測器
   */
  createMemoryLeakDetector: () => {
    let initialMemory: ReturnType<typeof memoryOptimizer.monitorMemoryUsage>
    
    return {
      start: () => {
        initialMemory = memoryOptimizer.monitorMemoryUsage()
      },
      
      check: (threshold: number = 50) => { // 50MB threshold
        const currentMemory = memoryOptimizer.monitorMemoryUsage()
        if (!initialMemory || !currentMemory) return null
        
        const diff = currentMemory.heapUsed - initialMemory.heapUsed
        
        return {
          initial: initialMemory,
          current: currentMemory,
          difference: diff,
          isPotentialLeak: diff > threshold
        }
      }
    }
  }
}

// ============================================================================
// 綜合優化配置
// ============================================================================

/**
 * 測試效能優化配置生成器
 */
export class TestPerformanceOptimizer {
  /**
   * 為不同測試類型創建優化配置
   */
  static createOptimizedConfig(testType: keyof typeof optimizedTestTimeouts) {
    return {
      // 超時設定
      timeouts: setTestTimeouts(testType),
      
      // Mock 配置
      mocks: lightweightMockConfig,
      
      // 測試資料
      testData: testDataOptimizer,
      
      // 效能監控
      monitor: new TestPerformanceMonitor(),
      
      // 記憶體優化
      memory: memoryOptimizer,
      
      // 並行優化
      parallel: parallelTestOptimizer,
      
      // 使用指南
      usage: `
        此配置已針對 ${testType} 測試優化
        - 測試超時: ${optimizedTestTimeouts[testType].testTimeout}ms
        - Hook 超時: ${optimizedTestTimeouts[testType].hookTimeout}ms
        - 說明: ${optimizedTestTimeouts[testType].description}
      `
    }
  }

  /**
   * 快速優化現有測試
   */
  static quickOptimize(options: {
    enableParallel?: boolean
    enableMemoryMonitoring?: boolean
    batchSize?: number
  } = {}) {
    const { enableParallel = true, enableMemoryMonitoring = true, batchSize = 5 } = options
    
    return {
      setup: () => {
        // 基本優化設定
        lightweightMockConfig.createMinimalI18nMock()
      },
      
      beforeEach: enableMemoryMonitoring ? () => {
        memoryOptimizer.cleanupAfterTest()
      } : undefined,
      
      afterEach: enableMemoryMonitoring ? () => {
        memoryOptimizer.cleanupAfterTest()
      } : undefined,
      
      parallelWrapper: enableParallel ? parallelTestOptimizer.createParallelWrapper : undefined,
      
      config: {
        batchSize,
        memoryMonitoring: enableMemoryMonitoring,
        parallelExecution: enableParallel
      }
    }
  }
}

export default TestPerformanceOptimizer