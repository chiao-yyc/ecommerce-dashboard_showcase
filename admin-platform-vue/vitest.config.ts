import path from 'path'
import {
  configDefaults,
  coverageConfigDefaults,
  defineConfig,
} from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  test: {
    // 測試檔案匹配規則 (Phase 1 Week 2 重構後)
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)', 
      'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'
    ],
    exclude: [
      ...configDefaults.exclude, 
      'packages/template/*', 
      'node_modules/**',
      // 已移除的非生產測試目錄
      'tests/examples/**',
      'tests/advanced/**', 
      'tests/docs/**'
    ],
    
    // 測試環境配置
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    
    // 超時設定 (解決測試超時問題)
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // 報告器配置 (移除已棄用的 basic reporter)
    reporters: [
      ['default', { summary: false }], // 替代 basic reporter
      'json'
    ],
    
    // 覆蓋率配置 (優化後)
    coverage: {
      // 覆蓋率提供者
      provider: 'v8', // 改為 v8，效能更好
      enabled: false, // 預設關閉，可透過 --coverage 開啟
      
      // 報告器
      reporter: ['text', 'html', 'json', 'lcov'],
      
      // 排除檔案
      exclude: [
        ...configDefaults.exclude,
        ...coverageConfigDefaults.exclude,
        // 測試檔案
        '**/*.{test,spec}.{js,ts,vue}',
        '**/tests/**',
        // 配置檔案
        '**/*.config.{js,ts}',
        '**/vitest.config.ts',
        '**/vite.config.ts',
        // 類型定義
        '**/*.d.ts',
        // 建構輸出
        '**/dist/**',
        '**/build/**',
        // 開發工具
        '**/dev/**',
        '**/docs/**',
        // Mock 檔案
        '**/__mocks__/**',
        '**/mockFactories.ts'
      ],
      
      // 覆蓋率閾值 (根據健檢報告優化)
      thresholds: {
        global: {
          branches: 75,    // 提升至 75%
          functions: 80,   // 提升至 80%
          lines: 80,       // 提升至 80%
          statements: 80   // 提升至 80%
        },
        // 核心業務模組要求更高覆蓋率
        'src/api/services/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Composables 業務邏輯要求高覆蓋率
        'src/composables/use*.ts': {
          branches: 85,
          functions: 90,
          lines: 85,
          statements: 85
        },
        // AI 系統維持最高要求
        'src/api/services/ai/**': {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90
        },
        'src/composables/useAI*.ts': {
          branches: 85,
          functions: 90,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // 全域設定
    globals: true,
    
    // 依賴優化 (替代已棄用的 deps.inline)
    deps: {
      optimizer: {
        web: {
          include: ['@vue', '@vueuse']
        }
      }
    }
  },
})
