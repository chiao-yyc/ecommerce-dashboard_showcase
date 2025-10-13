/**
 * 統一的 Supabase Mock 工廠
 * 整合所有現有 Mock 實現，提供標準化的測試基礎設施
 *
 * 整合 test-mocks.ts 和 mockFactories.ts
 */

import { vi, type MockedFunction } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// =====================================================
// 核心 Mock 介面定義 (從 test-mocks.ts 整合)
// =====================================================

export interface MockSupabaseAuth {
  getUser: MockedFunction<any>
  onAuthStateChange: MockedFunction<any>
  signInWithPassword: MockedFunction<any>
  signOut: MockedFunction<any>
  signUp: MockedFunction<any>
  signInWithOAuth: MockedFunction<any>
  getSession: MockedFunction<any>
  resetPasswordForEmail: MockedFunction<any>
  updateUser: MockedFunction<any>
}

export interface MockSupabaseFunctions {
  invoke: MockedFunction<any>
}

export interface MockSupabaseQueryBuilder {
  select?: MockedFunction<any>
  insert?: MockedFunction<any>
  update?: MockedFunction<any>
  delete?: MockedFunction<any>
  eq?: MockedFunction<any>
  neq?: MockedFunction<any>
  like?: MockedFunction<any>
  ilike?: MockedFunction<any>
  or?: MockedFunction<any>
  and?: MockedFunction<any>
  in?: MockedFunction<any>
  contains?: MockedFunction<any>
  order?: MockedFunction<any>
  range?: MockedFunction<any>
  limit?: MockedFunction<any>
  single?: MockedFunction<any>
  match?: MockedFunction<any>
  upsert?: MockedFunction<any>
  // 新增缺失的查詢方法
  not?: MockedFunction<any>
  gte?: MockedFunction<any>
  lte?: MockedFunction<any>
  gt?: MockedFunction<any>
  lt?: MockedFunction<any>
  filter?: MockedFunction<any>
  textSearch?: MockedFunction<any>
}

export interface MockSupabaseChannel {
  on: MockedFunction<any>
  subscribe: MockedFunction<any>
  unsubscribe?: MockedFunction<any>
}

export interface MockSupabaseClient {
  auth: MockSupabaseAuth
  functions: MockSupabaseFunctions
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder>
  channel?: MockedFunction<(name: string) => MockSupabaseChannel>
  removeChannel?: MockedFunction<any>
  rpc?: MockedFunction<any>
}

// =====================================================
// 回應類型定義
// =====================================================

export interface MockSupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export interface MockQueryResponse<T = any> {
  data: T | null
  error: MockSupabaseError | null
  count?: number
}

export interface MockAuthResponse {
  data: {
    user: any | null
    session: any | null
  }
  error: MockSupabaseError | null
}

// =====================================================
// 配置選項
// =====================================================

export interface CreateMockSupabaseClientOptions {
  authResponse?: Partial<MockAuthResponse>
  queryResponse?: MockQueryResponse
  rpcResponse?: MockQueryResponse
  functionsResponse?: MockQueryResponse
}

export interface MockConfigurationOptions {
  successData?: any
  errorMessage?: string
  errorCode?: string
  count?: number
}

// =====================================================
// 標準化 Mock 工廠 (核心函數)
// =====================================================

/**
 * 建立標準化的 Supabase Mock Client
 * 整合所有現有 Mock 功能，提供一致的介面
 */
export function createStandardMockSupabase(
  options: CreateMockSupabaseClientOptions = {},
): {
  mockSupabase: MockSupabaseClient
  configureMockSuccess: (data: any, count?: number) => void
  configureMockError: (message: string, code?: string) => void
  resetAllMocks: () => void
} {
  const {
    authResponse = { data: { user: null, session: null }, error: null },
    queryResponse = { data: null, error: null },
    rpcResponse = { data: null, error: null },
    functionsResponse = { data: null, error: null },
  } = options

  // 建立 Mock Client
  const mockSupabase: MockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue(authResponse),
      onAuthStateChange: vi.fn().mockReturnValue(() => {}),
      signInWithPassword: vi.fn().mockResolvedValue(authResponse),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue(authResponse),
      signInWithOAuth: vi.fn().mockResolvedValue(authResponse),
      getSession: vi.fn().mockResolvedValue(authResponse),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue(authResponse),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue(functionsResponse),
    },
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(queryResponse),
      match: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      // 新增缺失的查詢方法
      not: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
    })),
    channel: vi.fn().mockImplementation(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
      unsubscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue(rpcResponse),
  }

  // 配置成功回應的工具函數
  const configureMockSuccess = (data: any, count?: number) => {
    const successResponse = { data, error: null, count: count ?? null }

    // 建立可鏈式調用的查詢建構器，所有方法都支援鏈式調用和最終結果返回
    const createChainableQueryBuilder = () => {
      const queryBuilder: any = {}

      // 定義所有查詢方法
      const chainableMethods = [
        'select',
        'insert',
        'update',
        'delete',
        'eq',
        'neq',
        'like',
        'ilike',
        'or',
        'and',
        'in',
        'contains',
        'order',
        'match',
        'upsert',
        // 新增缺失的查詢方法
        'not',
        'gte',
        'lte',
        'gt',
        'lt',
        'filter',
        'textSearch',
      ]

      const terminatingMethods = ['range', 'limit', 'single']

      // 為鏈式方法建立 Mock，支援無限鏈式調用
      chainableMethods.forEach((method) => {
        queryBuilder[method] = vi.fn().mockImplementation((...args) => {
          // 返回自身以支援鏈式調用，但同時也可以作為 Promise 使用
          const chainProxy = new Proxy(queryBuilder, {
            get(target, prop) {
              // 如果是 Promise 方法，返回成功結果
              if (prop === 'then') {
                return (resolve: Function) => resolve(successResponse)
              }
              if (prop === 'catch') {
                return (reject: Function) => reject
              }
              // 其他情況返回原方法
              return target[prop]
            },
          })
          return chainProxy
        })
      })

      // 為終結方法建立 Mock，直接返回結果
      terminatingMethods.forEach((method) => {
        queryBuilder[method] = vi.fn().mockImplementation((...args) => {
          if (method === 'single') {
            return Promise.resolve({
              data: Array.isArray(data) ? data[0] : data,
              error: null,
            })
          }
          return Promise.resolve(successResponse)
        })
      })

      return queryBuilder
    }

    // 重新配置所有查詢方法返回成功結果
    mockSupabase.from.mockImplementation(() => createChainableQueryBuilder())

    // 配置 RPC 成功回應
    mockSupabase.rpc!.mockResolvedValue(successResponse)

    // 配置 Functions 成功回應
    mockSupabase.functions.invoke.mockResolvedValue(successResponse)

    // 配置 Auth 成功回應
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue(successResponse)
  }

  // 配置錯誤回應的工具函數
  const configureMockError = (message: string, code: string = 'MOCK_ERROR') => {
    const errorResponse = {
      data: null,
      error: { message, code, details: '', hint: '' },
    }

    // 建立錯誤狀態的查詢建構器
    const createErrorQueryBuilder = () => {
      const queryBuilder: any = {}

      // 定義所有查詢方法
      const chainableMethods = [
        'select',
        'insert',
        'update',
        'delete',
        'eq',
        'neq',
        'like',
        'ilike',
        'or',
        'and',
        'in',
        'contains',
        'order',
        'match',
        'upsert',
        // 新增缺失的查詢方法
        'not',
        'gte',
        'lte',
        'gt',
        'lt',
        'filter',
        'textSearch',
      ]

      const terminatingMethods = ['range', 'limit', 'single']

      // 為鏈式方法建立 Mock，支援無限鏈式調用
      chainableMethods.forEach((method) => {
        queryBuilder[method] = vi.fn().mockImplementation((...args) => {
          // 返回自身以支援鏈式調用，但最終返回錯誤結果
          const chainProxy = new Proxy(queryBuilder, {
            get(target, prop) {
              // 如果是 Promise 方法，返回錯誤結果
              if (prop === 'then') {
                return (resolve: Function) => resolve(errorResponse)
              }
              if (prop === 'catch') {
                return (reject: Function) => reject
              }
              // 其他情況返回原方法
              return target[prop]
            },
          })
          return chainProxy
        })
      })

      // 為終結方法建立 Mock，直接返回錯誤結果
      terminatingMethods.forEach((method) => {
        queryBuilder[method] = vi.fn().mockResolvedValue(errorResponse)
      })

      return queryBuilder
    }

    // 重新配置所有查詢方法返回錯誤結果
    mockSupabase.from.mockImplementation(() => createErrorQueryBuilder())

    // 配置 RPC 錯誤回應
    mockSupabase.rpc!.mockResolvedValue(errorResponse)

    // 配置 Functions 錯誤回應
    mockSupabase.functions.invoke.mockResolvedValue(errorResponse)

    // 配置 Auth 錯誤回應
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue(errorResponse)
  }

  // 重置所有 Mock
  const resetAllMocks = () => {
    Object.values(mockSupabase.auth).forEach((mockFn) => {
      if (vi.isMockFunction(mockFn)) {
        mockFn.mockReset()
      }
    })

    mockSupabase.functions.invoke.mockReset()
    mockSupabase.from.mockReset()
    mockSupabase.rpc!.mockReset()

    if (mockSupabase.channel) {
      mockSupabase.channel.mockReset()
    }
  }

  return {
    mockSupabase,
    configureMockSuccess,
    configureMockError,
    resetAllMocks,
  }
}

// =====================================================
// 快捷工廠函數
// =====================================================

/**
 * 快速建立成功狀態的 Supabase Mock
 */
export function createMockSupabaseSuccess(data: any, count?: number) {
  const { mockSupabase, configureMockSuccess } = createStandardMockSupabase()
  configureMockSuccess(data, count)
  return mockSupabase as any as SupabaseClient
}

/**
 * 快速建立錯誤狀態的 Supabase Mock
 */
export function createMockSupabaseError(message: string, code?: string) {
  const { mockSupabase, configureMockError } = createStandardMockSupabase()
  configureMockError(message, code)
  return mockSupabase as any as SupabaseClient
}

/**
 * 建立可配置的 Supabase Mock (最常用)
 */
export function createConfigurableMockSupabase() {
  return createStandardMockSupabase()
}

// =====================================================
// 特殊用途 Mock 工廠
// =====================================================

/**
 * 建立 Realtime 專用的 Mock (用於通知系統測試)
 */
export function createRealtimeMockSupabase(
  channelName: string = 'test-channel',
) {
  const { mockSupabase } = createStandardMockSupabase()

  // 特化 Realtime 功能
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
    unsubscribe: vi.fn().mockReturnValue({ status: 'CLOSED' }),
  }

  mockSupabase.channel!.mockReturnValue(mockChannel)

  return {
    mockSupabase: mockSupabase as any as SupabaseClient,
    mockChannel,
    triggerRealtimeEvent: (
      table: string,
      eventType: string,
      new_record?: any,
      old_record?: any,
    ) => {
      // 模擬觸發 Realtime 事件
      const callbacks = mockChannel.on.mock.calls
      callbacks.forEach(([event, callback]) => {
        if (event === 'postgres_changes') {
          callback.call(mockChannel, {
            eventType,
            new: new_record,
            old: old_record,
            table,
          })
        }
      })
    },
  }
}

/**
 * 建立 Auth 專用的 Mock (用於認證測試)
 */
export function createAuthMockSupabase(user?: any, session?: any) {
  const authResponse = {
    data: { user: user || null, session: session || null },
    error: null,
  }

  return createStandardMockSupabase({ authResponse })
}

// =====================================================
// 資料生成工具 (從原 mockFactories.ts 整合)
// =====================================================

/**
 * 生成 Mock UUID (解決 UUID 格式問題)
 */
export function generateMockUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成 Mock ID
 */
export function generateMockId(prefix: string = 'mock'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 建立標準化錯誤
 */
export function createStandardError(
  message: string = 'Mock error',
  code: string = 'MOCK_ERROR',
): MockSupabaseError {
  return { message, code, details: '', hint: '' }
}

// =====================================================
// 測試資料工廠 (從 test-mocks.ts 整合常用的)
// =====================================================

/**
 * 創建 Mock 使用者資料
 */
export function createMockUser(overrides: any = {}): any {
  return {
    id: generateMockUUID(),
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    roles: ['user'],
    ...overrides,
  }
}

/**
 * 創建 Mock 產品資料
 */
export function createMockProduct(overrides: any = {}): any {
  return {
    id: generateMockUUID(),
    name: '測試產品',
    price: 149.99,
    category_id: 1,
    image_url: 'https://example.com/image.jpg',
    description: '測試產品描述',
    translations: { en: { name: 'Test Product' } },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: { name: '測試分類' },
    total_stock: 10,
    stock_warning_threshold: 5,
    needs_restock: false,
    ...overrides,
  }
}

/**
 * 創建 Mock 訂單資料
 */
export function createMockOrder(overrides: any = {}): any {
  return {
    id: generateMockUUID(),
    user_id: generateMockUUID(),
    total_amount: 299.99,
    status: 'pending',
    created_at: new Date().toISOString(),
    customer_id: generateMockUUID(),
    ...overrides,
  }
}

/**
 * 批量建立資料
 */
export function createMockDataArray<T>(
  factory: (overrides?: any) => T,
  count: number = 3,
  baseOverrides: any = {},
): T[] {
  return Array.from({ length: count }, (_, index) =>
    factory({
      ...baseOverrides,
      id: generateMockUUID(),
    }),
  )
}

// =====================================================
// 全域 Mock 設定工具
// =====================================================

/**
 * 設定全域 Supabase Mock (供 setup.ts 使用)
 */
export function setupGlobalSupabaseMock() {
  const {
    mockSupabase,
    configureMockSuccess,
    configureMockError,
    resetAllMocks,
  } = createStandardMockSupabase()

  // 全域 Mock 設定
  vi.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
  }))

  // 返回配置工具
  return {
    mockSupabase,
    configureMockSuccess,
    configureMockError,
    resetAllMocks,
  }
}

/**
 * 清理全域 Mock
 */
export function teardownGlobalSupabaseMock() {
  vi.unmock('@/lib/supabase')
}
