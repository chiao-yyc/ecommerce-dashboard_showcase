/**
 * 統一 Supabase Mock 工廠
 * 集中管理所有 Supabase 相關的 Mock 配置
 */

import { vi } from 'vitest'

// 基礎 Mock 響應介面
export interface MockSupabaseResponse<T = any> {
  data: T | null
  error: any | null
  count?: number | null
}

// 基礎 Mock 查詢建構器
export const createMockQueryBuilder = <T = any>(mockData: T[] = [], shouldError = false) => {
  const error = shouldError ? new Error('Mock Supabase Error') : null

  return {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: mockData[0] || null,
      error: error
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: mockData[0] || null,
      error: error
    }),
    then: vi.fn().mockResolvedValue({
      data: mockData,
      error: error,
      count: mockData.length
    })
  }
}

// Realtime Mock
export const createMockRealtimeChannel = () => ({
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockImplementation((callback) => {
    if (callback) callback('SUBSCRIBED')
    return Promise.resolve('SUBSCRIBED')
  }),
  unsubscribe: vi.fn().mockResolvedValue('OK'),
  send: vi.fn().mockResolvedValue('OK')
})

// Auth Mock
export const createMockAuth = () => ({
  getSession: vi.fn().mockResolvedValue({
    data: {
      session: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {}
        },
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      }
    },
    error: null
  }),
  getUser: vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    },
    error: null
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'mock-token' }
    },
    error: null
  }),
  signUp: vi.fn().mockResolvedValue({
    data: {
      user: { id: 'test-user-id', email: 'test@example.com' },
      session: { access_token: 'mock-token' }
    },
    error: null
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockImplementation((callback) => {
    // 模擬認證狀態變化
    setTimeout(() => {
      callback('SIGNED_IN', {
        user: { id: 'test-user-id', email: 'test@example.com' }
      })
    }, 0)
    return {
      data: { subscription: { unsubscribe: vi.fn() } },
      error: null
    }
  })
})

// Storage Mock
export const createMockStorage = () => ({
  from: vi.fn().mockReturnValue({
    upload: vi.fn().mockResolvedValue({
      data: { path: 'mock-file-path' },
      error: null
    }),
    download: vi.fn().mockResolvedValue({
      data: new Blob(['mock file content']),
      error: null
    }),
    remove: vi.fn().mockResolvedValue({
      data: null,
      error: null
    }),
    list: vi.fn().mockResolvedValue({
      data: [],
      error: null
    })
  })
})

// RPC Mock
export const createMockRpc = () => vi.fn().mockImplementation((functionName: string, params?: any) => {
  // 預設 RPC 函數響應
  const defaultResponses: Record<string, any> = {
    calculate_business_health: { score: 85, status: 'good' },
    suggest_completion: ['建議1', '建議2', '建議3'],
    get_user_permissions: ['read', 'write', 'admin'],
    refresh_materialized_view: { success: true }
  }

  return Promise.resolve({
    data: defaultResponses[functionName] || null,
    error: null
  })
})

// 主要 Supabase Client Mock
export const createMockSupabaseClient = (options: {
  mockData?: Record<string, any[]>
  shouldError?: boolean
} = {}) => {
  const { mockData = {}, shouldError = false } = options

  return {
    from: vi.fn().mockImplementation((table: string) => {
      const tableData = mockData[table] || []
      return createMockQueryBuilder(tableData, shouldError)
    }),
    auth: createMockAuth(),
    storage: createMockStorage(),
    rpc: createMockRpc(),
    channel: vi.fn().mockImplementation((name: string) => createMockRealtimeChannel()),
    removeChannel: vi.fn().mockReturnThis(),
    removeAllChannels: vi.fn().mockReturnThis(),
    getChannels: vi.fn().mockReturnValue([])
  }
}

// 標準化的 Supabase Mock 設定
export const setupSupabaseMock = (customMockData?: Record<string, any[]>) => {
  const defaultMockData = {
    orders: [
      { id: 'order-1', total_amount: 1000, status: 'completed', created_at: '2024-01-01' }
    ],
    customers: [
      { id: 'customer-1', full_name: 'Test Customer', email: 'test@example.com' }
    ],
    products: [
      { id: 'product-1', name: 'Test Product', price: 100, stock: 50 }
    ],
    notifications: [
      {
        id: 'notification-1',
        title: 'Test Notification',
        message: 'Test message',
        status: 'unread',
        created_at: '2024-01-01'
      }
    ],
    users: [
      { id: 'user-1', email: 'admin@example.com', full_name: 'Admin User' }
    ],
    roles: [
      { id: 'role-1', name: 'Admin', description: 'Administrator role' }
    ]
  }

  const mockData = { ...defaultMockData, ...customMockData }
  const mockClient = createMockSupabaseClient({ mockData })

  return vi.mock('@/lib/supabase', () => ({
    supabase: mockClient,
    default: mockClient
  }))
}

// 匯出便捷函數
export {
  createMockSupabaseClient as createSupabaseMock,
  setupSupabaseMock as mockSupabase
}