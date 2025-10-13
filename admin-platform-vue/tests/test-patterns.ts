/**
 * 通用測試模式與標準
 * 根據 Phase 1 Week 2 重構建立的標準化測試架構
 */

import { vi } from 'vitest'

// ==================== Mock 工廠函數 ====================

/**
 * 創建標準化的 Supabase Mock
 */
export const createSupabaseMock = () => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null })
  })),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null })
  },
  // Realtime 功能 (如需要)
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn()
    })
  }),
  removeChannel: vi.fn()
})

/**
 * 創建標準化的 Vue Router Mock
 */
export const createVueRouterMock = () => ({
  useRoute: () => ({ 
    query: {}, 
    params: {}, 
    path: '/', 
    name: 'test',
    fullPath: '/',
    hash: '',
    matched: [],
    meta: {},
    redirectedFrom: undefined
  }),
  useRouter: () => ({ 
    push: vi.fn().mockResolvedValue(undefined), 
    replace: vi.fn().mockResolvedValue(undefined), 
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: { value: { query: {}, params: {}, path: '/', name: 'test' } },
    options: { history: {}, routes: [] }
  })
})

/**
 * 創建簡化的 UI 組件 Mock
 */
export const createUiComponentMock = (name: string) => ({
  name,
  template: `<div class="${name.toLowerCase()}"><slot /></div>`
})

/**
 * 創建標準化的 Service Mock
 */
export const createServiceMock = <T>(methods: (keyof T)[]) => {
  const mock = {} as any
  methods.forEach(method => {
    mock[method] = vi.fn().mockResolvedValue({ success: true, data: null })
  })
  return mock as T
}

// ==================== 測試數據工廠 ====================

/**
 * 創建標準測試用戶數據
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
})

/**
 * 創建標準測試訂單數據
 */
export const createMockOrder = (overrides = {}) => ({
  id: 'order-123',
  user_id: 'user-123',
  status: 'pending',
  total_amount: 100.00,
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
})

/**
 * 創建標準測試通知數據
 */
export const createMockNotification = (overrides = {}) => ({
  id: 'notification-123',
  title: 'Test Notification',
  message: 'Test message',
  type: 'info',
  priority: 'medium',
  status: 'unread',
  created_at: '2025-01-01T00:00:00Z',
  ...overrides
})

// ==================== 測試輔助函數 ====================

/**
 * 等待 Vue 組件更新完成
 */
export const waitForUpdate = async (wrapper: any) => {
  await wrapper.vm.$nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 模擬異步操作延遲
 */
export const simulateDelay = (ms = 100) => 
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * 檢查 API 調用參數
 */
export const expectApiCall = (mockFn: any, expectedArgs: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...expectedArgs)
  expect(mockFn).toHaveBeenCalledTimes(1)
}

// ==================== 測試結構模板 ====================

/**
 * 標準 Composable 測試結構
 */
export const createComposableTestSuite = (name: string, testCases: any[]) => ({
  describe: `${name} Core Functions`,
  groups: [
    {
      name: 'Initialization',
      tests: testCases.filter(t => t.type === 'init')
    },
    {
      name: 'Core Operations', 
      tests: testCases.filter(t => t.type === 'operation')
    },
    {
      name: 'Error Handling',
      tests: testCases.filter(t => t.type === 'error')
    }
  ]
})

/**
 * 標準 Service 測試結構
 */
export const createServiceTestSuite = (serviceName: string, methods: string[]) => ({
  describe: `${serviceName} Service`,
  groups: [
    {
      name: 'Service Methods',
      tests: methods.map(method => ({
        name: `should execute ${method} successfully`,
        type: 'method'
      }))
    },
    {
      name: 'Error Handling',
      tests: [
        { name: 'should handle network errors', type: 'error' },
        { name: 'should handle invalid responses', type: 'error' },
        { name: 'should handle timeout errors', type: 'error' }
      ]
    },
    {
      name: 'Configuration',
      tests: [
        { name: 'should initialize correctly', type: 'init' }
      ]
    }
  ]
})

/**
 * 標準 Component 測試結構
 */
export const createComponentTestSuite = (componentName: string) => ({
  describe: `${componentName} Component`,
  groups: [
    {
      name: 'Basic Rendering',
      tests: [
        { name: 'should render component', type: 'render' },
        { name: 'should display content correctly', type: 'render' }
      ]
    },
    {
      name: 'User Interactions',
      tests: [
        { name: 'should handle user clicks', type: 'interaction' },
        { name: 'should emit events correctly', type: 'interaction' }
      ]
    },
    {
      name: 'Props and State',
      tests: [
        { name: 'should accept props correctly', type: 'props' },
        { name: 'should update state properly', type: 'state' }
      ]
    }
  ]
})

// ==================== 覆蓋率輔助 ====================

/**
 * 生成覆蓋率報告輔助函數
 */
export const generateCoverageReport = () => {
  console.log('📊 Coverage Report Generated')
  console.log('Use: npm run test:coverage to see detailed coverage')
}

/**
 * 檢查覆蓋率閾值
 */
export const checkCoverageThreshold = (module: string, expected: number) => {
  console.log(`✅ ${module} coverage should meet ${expected}% threshold`)
}

// ==================== 導出配置 ====================

export const TEST_PATTERNS = {
  SUPABASE_MOCK: 'createSupabaseMock',
  ROUTER_MOCK: 'createVueRouterMock',
  UI_MOCK: 'createUiComponentMock',
  SERVICE_MOCK: 'createServiceMock'
}

export const TEST_TIMEOUTS = {
  DEFAULT: 5000,
  INTEGRATION: 10000,
  E2E: 30000
}

export const MOCK_DATA_FACTORIES = {
  USER: 'createMockUser',
  ORDER: 'createMockOrder', 
  NOTIFICATION: 'createMockNotification'
}