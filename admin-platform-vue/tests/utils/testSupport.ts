/**
 * 測試支援工具
 * 提供標準化的測試輔助函數，簡化測試編寫
 *
 */

import { vi } from 'vitest'
import {
  createStandardMockSupabase,
  createConfigurableMockSupabase,
  generateMockUUID,
  createMockUser,
  createMockProduct,
  createMockOrder,
  createMockDataArray,
  type MockSupabaseClient,
} from './supabaseMock'

// =====================================================
// 全域 Mock 存取輔助函數
// =====================================================

/**
 * 獲取全域 Supabase Mock 實例
 */
export function getGlobalMockSupabase(): MockSupabaseClient {
  return (globalThis as any).__mockSupabase
}

/**
 * 配置全域 Mock 成功回應
 */
export function configureGlobalMockSuccess(data: any, count?: number): void {
  const configureFn = (globalThis as any).__configureMockSuccess
  if (configureFn) {
    configureFn(data, count)
  }
}

/**
 * 配置全域 Mock 錯誤回應
 */
export function configureGlobalMockError(message: string, code?: string): void {
  const configureFn = (globalThis as any).__configureMockError
  if (configureFn) {
    configureFn(message, code)
  }
}

// =====================================================
// 測試專用 Mock 工廠
// =====================================================

/**
 * 為單個測試建立獨立的 Mock (不影響全域)
 */
export function createTestMockSupabase() {
  return createConfigurableMockSupabase()
}

/**
 * 快速設定測試情境
 */
export interface TestScenario {
  name: string
  mockData?: any
  errorMessage?: string
  errorCode?: string
}

export function setupTestScenario(scenario: TestScenario) {
  const { mockData, errorMessage, errorCode } = scenario

  if (mockData !== undefined) {
    configureGlobalMockSuccess(mockData)
  } else if (errorMessage) {
    configureGlobalMockError(errorMessage, errorCode)
  }
}

// =====================================================
// 常用測試資料生成器
// =====================================================

/**
 * 生成完整的使用者測試資料集
 */
export function generateUserTestData(count: number = 3) {
  return {
    users: createMockDataArray(createMockUser, count),
    singleUser: createMockUser(),
    userWithRoles: createMockUser({ roles: ['admin', 'user'] }),
    deletedUser: createMockUser({ deletedAt: new Date().toISOString() }),
  }
}

/**
 * 生成完整的產品測試資料集
 */
export function generateProductTestData(count: number = 3) {
  return {
    products: createMockDataArray(createMockProduct, count),
    singleProduct: createMockProduct(),
    outOfStockProduct: createMockProduct({
      total_stock: 0,
      needs_restock: true,
    }),
    expensiveProduct: createMockProduct({ price: 999.99 }),
  }
}

/**
 * 生成完整的訂單測試資料集
 */
export function generateOrderTestData(count: number = 3) {
  return {
    orders: createMockDataArray(createMockOrder, count),
    singleOrder: createMockOrder(),
    pendingOrder: createMockOrder({ status: 'pending' }),
    completedOrder: createMockOrder({ status: 'completed' }),
    highValueOrder: createMockOrder({ total_amount: 9999.99 }),
  }
}

// =====================================================
// 測試斷言輔助函數
// =====================================================

/**
 * 驗證 Supabase 查詢被正確調用
 */
export function expectSupabaseQuery(
  mockSupabase: MockSupabaseClient,
  tableName: string,
  operation: 'select' | 'insert' | 'update' | 'delete' = 'select',
) {
  expect(mockSupabase.from).toHaveBeenCalledWith(tableName)

  const queryBuilder = mockSupabase.from.mock.results[0]?.value
  if (queryBuilder && queryBuilder[operation]) {
    expect(queryBuilder[operation]).toHaveBeenCalled()
  }
}

/**
 * 驗證 Supabase RPC 被正確調用
 */
export function expectSupabaseRpc(
  mockSupabase: MockSupabaseClient,
  functionName: string,
  params?: any,
) {
  expect(mockSupabase.rpc).toHaveBeenCalledWith(
    functionName,
    params ? expect.objectContaining(params) : undefined,
  )
}

/**
 * 驗證 Auth 操作被正確調用
 */
export function expectAuthOperation(
  mockSupabase: MockSupabaseClient,
  operation: keyof MockSupabaseClient['auth'],
  params?: any,
) {
  const authMethod = mockSupabase.auth[operation]
  expect(authMethod).toHaveBeenCalled()

  if (params) {
    expect(authMethod).toHaveBeenCalledWith(expect.objectContaining(params))
  }
}

// =====================================================
// 錯誤測試輔助函數
// =====================================================

/**
 * 常用錯誤情境
 */
export const CommonErrors = {
  NETWORK_ERROR: {
    message: 'NetworkError: Failed to fetch',
    code: 'NETWORK_ERROR',
    details: '',
    hint: '',
  },
  UNAUTHORIZED: {
    message: 'JWT expired',
    code: 'UNAUTHORIZED',
    details: '',
    hint: '',
  },
  NOT_FOUND: {
    message: 'Resource not found',
    code: 'PGRST116',
    details: '',
    hint: '',
  },
  VALIDATION_ERROR: {
    message: 'Invalid input',
    code: 'PGRST202',
    details: '',
    hint: '',
  },
  DATABASE_ERROR: {
    message: 'Database connection failed',
    code: 'DATABASE_ERROR',
    details: '',
    hint: '',
  },
  UUID_ERROR: {
    message: 'invalid input syntax for type uuid',
    code: 'INVALID_UUID',
    details: '',
    hint: '',
  },
} as const

/**
 * 設定特定錯誤情境
 */
export function setupErrorScenario(errorType: keyof typeof CommonErrors) {
  const error = CommonErrors[errorType]
  configureGlobalMockError(error.message, error.code)
}

// =====================================================
// 測試清理輔助函數
// =====================================================

/**
 * 重置全域 Mock 狀態
 */
export function resetGlobalMocks() {
  const mockSupabase = getGlobalMockSupabase()
  if (mockSupabase) {
    // 重置所有 Mock 函數的調用記錄
    Object.values(mockSupabase.auth).forEach((mockFn) => {
      if (vi.isMockFunction(mockFn)) {
        mockFn.mockClear()
      }
    })

    mockSupabase.functions.invoke.mockClear()
    mockSupabase.from.mockClear()
    mockSupabase.rpc?.mockClear()

    if (mockSupabase.channel) {
      mockSupabase.channel.mockClear()
    }
  }

  // 重置全域 Mock 到初始成功狀態
  const resetFn = (globalThis as any).__resetAllMocks
  if (resetFn) {
    resetFn()
  }
}

// =====================================================
// 測試模式輔助函數
// =====================================================

/**
 * 網路相關測試模式
 */
export const NetworkTestModes = {
  /**
   * 模擬慢速網路
   */
  slowNetwork: () => {
    const { mockSupabase } = createTestMockSupabase()

    // 添加延遲到所有非同步操作
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    Object.values(mockSupabase.auth).forEach((mockFn) => {
      if (vi.isMockFunction(mockFn)) {
        mockFn.mockImplementation(async (...args) => {
          await delay(1000) // 1秒延遲
          return { data: null, error: null }
        })
      }
    })

    return mockSupabase
  },

  /**
   * 模擬間歇性網路故障
   */
  flakeyNetwork: () => {
    let failureCount = 0
    const { mockSupabase, configureMockSuccess, configureMockError } =
      createTestMockSupabase()

    // 每三次請求失敗一次
    const simulateFlakiness = () => {
      failureCount++
      if (failureCount % 3 === 0) {
        configureMockError('Network timeout', 'TIMEOUT')
      } else {
        configureMockSuccess([])
      }
    }

    return { mockSupabase, simulateFlakiness }
  },
}

// =====================================================
// UUID 相關測試工具 (解決現有測試問題)
// =====================================================

/**
 * 建立有效的測試 UUID
 */
export function createTestUUID(): string {
  return generateMockUUID()
}

/**
 * 驗證字串是否為有效 UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * 為現有資料添加有效 UUID
 */
export function addValidUUIDs<T extends Record<string, any>>(
  data: T[],
  idField: string = 'id',
): T[] {
  return data.map((item) => ({
    ...item,
    [idField]: isValidUUID(item[idField]) ? item[idField] : createTestUUID(),
  }))
}

// =====================================================
// 批量測試資料輔助函數
// =====================================================

/**
 * 建立完整的測試環境資料
 */
export function createFullTestEnvironment() {
  return {
    users: generateUserTestData(5),
    products: generateProductTestData(10),
    orders: generateOrderTestData(8),
    // 可以根據需要擴展更多資料集
  }
}

/**
 * 設定複雜的測試情境（包含關聯資料）
 */
export function setupComplexTestScenario() {
  const env = createFullTestEnvironment()

  // 設定資料關聯
  const userId = env.users.singleUser.id
  const productId = env.products.singleProduct.id

  // 建立包含關聯的訂單
  const orderWithItems = createMockOrder({
    user_id: userId,
    items: [
      {
        id: createTestUUID(),
        product_id: productId,
        quantity: 2,
        unit_price: env.products.singleProduct.price,
      },
    ],
  })

  return {
    ...env,
    orderWithItems,
    userId,
    productId,
  }
}
