/**
 * 測試環境全域設定
 * 配置測試環境的統一設定和初始化
 *
 */

import { vi, beforeEach, afterEach } from 'vitest'
import { config } from '@vue/test-utils'

// =====================================================
// 全域 Mock 設定
// =====================================================

// Mock lucide-vue-next icons - 動態 Proxy 系統
vi.mock('lucide-vue-next', () => {
  const createMockIcon = (name: string) => ({
    name,
    template: `<svg data-icon="${name}" class="lucide-icon"><title>${name}</title></svg>`,
    props: ['class', 'size', 'stroke-width', 'color', 'width', 'height'],
    emits: ['click']
  })

  // 建立動態 Proxy 來處理所有可能的圖標
  const iconProxy = new Proxy({}, {
    get: (target: any, prop: string | symbol) => {
      if (typeof prop === 'string') {
        // 如果已經存在，直接返回
        if (target[prop]) {
          return target[prop]
        }
        
        // 動態創建新圖標
        const icon = createMockIcon(prop)
        target[prop] = icon
        return icon
      }
      return undefined
    },
    
    has: () => true, // 所有圖標都"存在"
    
    ownKeys: (target) => {
      // 返回常用圖標列表，用於某些迭代場景
      return [
        'Bell', 'Clock', 'AlertTriangle', 'CheckCircle', 'Info', 'User', 'Users',
        'ShoppingCart', 'Package', 'MessageCircle', 'Shield', 'ConciergeBell',
        'RefreshCw', 'ExternalLink', 'Lightbulb', 'ChevronRight', 'ChevronDown',
        'ArrowUp', 'ArrowDown', 'Circle', 'CircleHelp', 'Wifi', 'WifiOff', 'Link2',
        'X', 'Check', 'Edit', 'Trash', 'Search', 'Plus', 'Minus', 'Download',
        'Settings', 'Home', 'FileText', 'Truck', 'CheckSquare', 'Timer', 'Square',
        'Calendar', 'Clock4', 'Star', 'Heart', 'Eye', 'EyeOff', 'Mail', 'Phone'
      ]
    }
  })

  return iconProxy
})

// 全域 Supabase Mock 設定
import { setupGlobalSupabaseMock } from './utils/supabaseMock'
const {
  mockSupabase,
  configureMockSuccess,
  configureMockError,
  resetAllMocks,
} = setupGlobalSupabaseMock()

// 統一 API Mock 工廠
import { mockApiManager } from './utils/mockApiFactory'

// 將配置工具掛載到全域，供測試使用
;(globalThis as any).__mockSupabase = mockSupabase
;(globalThis as any).__configureMockSuccess = configureMockSuccess
;(globalThis as any).__configureMockError = configureMockError
;(globalThis as any).__resetAllMocks = resetAllMocks
;(globalThis as any).__mockApiManager = mockApiManager

// Mock window.matchMedia (用於響應式設計測試)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
vi.stubGlobal('sessionStorage', sessionStorageMock)

// Mock 常用工具函數
vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>()
  return {
    ...actual,
    convertToISOString: vi.fn().mockImplementation((date: Date | string): string => {
      if (typeof date === 'string') {
        date = new Date(date)
      }
      return date instanceof Date ? date.toISOString() : ''
    }),
    formatDate: vi.fn().mockImplementation((date: Date | string, defaultValue = '') => {
      if (!date) return defaultValue
      const d = typeof date === 'string' ? new Date(date) : date
      return d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleDateString() : defaultValue
    }),
    formatDateTime: vi.fn().mockImplementation((date: Date | string, defaultValue = '') => {
      if (!date) return defaultValue
      const d = typeof date === 'string' ? new Date(date) : date
      return d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleString() : defaultValue
    }),
    formatDateOnly: vi.fn().mockImplementation((date: Date | string) => {
      if (!date) return ''
      const d = typeof date === 'string' ? new Date(date) : date
      return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : ''
    }),
  }
})

// =====================================================
// Vue Test Utils 全域配置
// =====================================================

// 全域組件 stubs
config.global.stubs = {
  // Router 相關
  'router-link': {
    template: '<a><slot /></a>',
    props: ['to'],
  },
  'router-view': true,

  // Icon 組件 (Lucide Vue Next) - 簡化為基本stub
  'lucide-vue-next': true,

  // UI 組件 (可能需要的基礎組件)
  Teleport: true,
  Transition: true,
  TransitionGroup: true,
}

// 全域 mocks
config.global.mocks = {
  $t: (key: string) => key, // i18n mock
  $tc: (key: string, count: number) => `${key} (${count})`,
  $te: (key: string) => true,
  $d: (date: Date) => date.toLocaleDateString(),
  $n: (number: number) => number.toLocaleString(),
}

// 全域 provide
config.global.provide = {}

// =====================================================
// 環境變數設定
// =====================================================

// 設定測試環境變數
process.env.NODE_ENV = 'test'
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'

// =====================================================
// 全域測試鉤子
// =====================================================

// Vue Query 測試工具
import { resetTestQueryClient } from './utils/vueQueryTestUtils'

// 每個測試前的清理
beforeEach(() => {
  // 清理 DOM
  document.body.innerHTML = ''

  // 清理 localStorage 和 sessionStorage mock
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()

  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()

  // 重設 API Mock 狀態
  mockApiManager.resetAllMocks()

  // 重設 Vue Query 測試狀態
  resetTestQueryClient()

  // 清理時間相關 mock
  vi.clearAllTimers()
})

// 每個測試後的清理
afterEach(() => {
  // 清理所有 mock
  vi.clearAllMocks()

  // 還原時間
  vi.useRealTimers()
})

// =====================================================
// 自定義匹配器 (如果需要)
// =====================================================

// 擴展 expect 匹配器
declare module 'vitest' {
  interface Assertion {
    toBeValidUUID(): any
    toBeValidISODate(): any
  }
  interface AsymmetricMatchersContaining {
    toBeValidUUID(): any
    toBeValidISODate(): any
  }
}

// UUID 驗證匹配器
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const pass = uuidRegex.test(received)

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      }
    }
  },
})

// ISO 日期驗證匹配器
expect.extend({
  toBeValidISODate(received: string) {
    const date = new Date(received)
    const pass = !isNaN(date.getTime()) && received === date.toISOString()

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid ISO date`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid ISO date`,
        pass: false,
      }
    }
  },
})

// =====================================================
// 測試輔助函數
// =====================================================

/**
 * 等待 Vue 的下一個 tick
 */
export async function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 等待指定時間
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 模擬用戶點擊事件
 */
export function mockUserClick(element: Element): void {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
}

/**
 * 模擬用戶輸入事件
 */
export function mockUserInput(element: HTMLInputElement, value: string): void {
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

// =====================================================
// Console 輸出控制
// =====================================================

// 在測試環境中抑制特定的 console 輸出
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

console.warn = (...args: any[]) => {
  // 過濾掉已知的無害警告
  const message = args[0]
  if (typeof message === 'string') {
    // 過濾 Vue 相關的無害警告
    if (message.includes('Vue warn')) {
      return
    }
    // 過濾其他已知的測試相關警告
    if (message.includes('Duplicate key')) {
      return
    }
  }

  originalConsoleWarn(...args)
}

console.error = (...args: any[]) => {
  // 過濾掉已知的無害錯誤
  const message = args[0]
  if (typeof message === 'string') {
    // 可以在這裡添加需要過濾的錯誤信息
    if (message.includes('ResizeObserver loop limit exceeded')) {
      return
    }
  }

  originalConsoleError(...args)
}

// 測試結束後恢復原始的 console 方法
afterEach(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError
})
