/**
 * Vue Query 測試工具
 * 提供測試環境下 Vue Query 的設置和輔助函數
 */

import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp, ref } from 'vue'
import { vi } from 'vitest'

/**
 * 創建測試專用的 QueryClient
 * 配置快速失效和無重試，適合測試環境
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 測試環境：立即過期，無背景更新
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
      mutations: {
        // 測試環境：無重試
        retry: false,
      },
    },
    // 抑制測試中的錯誤日誌
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  })
}

/**
 * 全域測試 QueryClient 實例
 */
let testQueryClient: QueryClient | null = null

/**
 * 獲取或創建測試 QueryClient
 */
export function getTestQueryClient(): QueryClient {
  if (!testQueryClient) {
    testQueryClient = createTestQueryClient()
  }
  return testQueryClient
}

/**
 * 重置測試 QueryClient
 * 在每個測試前調用，清除所有快取
 */
export function resetTestQueryClient(): void {
  if (testQueryClient) {
    testQueryClient.clear()
  }
}

/**
 * 為 Composable 測試提供 Vue Query Context
 * 使用方式：
 * 
 * ```typescript
 * import { withQueryClient } from '@/tests/utils/vueQueryTestUtils'
 * 
 * const result = withQueryClient(() => {
 *   return useOrderActions()
 * })
 * ```
 */
export function withQueryClient<T>(fn: () => T): T {
  const queryClient = getTestQueryClient()
  
  // 創建一個臨時的 Vue 應用來提供 context
  const app = createApp({
    setup() {
      return fn()
    },
    template: '<div></div>'
  })
  
  // 安裝 Vue Query
  app.use(VueQueryPlugin, { queryClient })
  
  // 執行函數並返回結果
  let result: T
  const originalSetup = app._component.setup!
  app._component.setup = (props, ctx) => {
    result = originalSetup(props, ctx) as T
    return result
  }
  
  // Mount 但不需要實際的 DOM
  app.mount(document.createElement('div'))
  
  return result!
}

/**
 * Mock useMutation 的標準返回值
 * 用於不需要實際 Vue Query context 的測試
 */
export const mockUseMutation = () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isPending: false,
  isError: false,
  isSuccess: true,
  isIdle: true,
  error: null,
  data: null,
  reset: vi.fn(),
  variables: undefined,
  context: undefined,
  failureCount: 0,
  failureReason: null,
  status: 'idle' as const,
})

/**
 * Mock useQuery 的標準返回值  
 */
export const mockUseQuery = (data: any = null) => ({
  data: ref(data),
  error: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  isError: ref(false),
  isSuccess: ref(true),
  isStale: ref(false),
  isPending: ref(false),
  refetch: vi.fn().mockResolvedValue({ data }),
  fetchStatus: ref('idle' as const),
  status: ref('success' as const),
})

/**
 * 簡化的 Vue Query Mock
 * 為整個測試文件 mock @tanstack/vue-query
 */
export function mockVueQuery() {
  vi.mock('@tanstack/vue-query', () => ({
    QueryClient: vi.fn(() => ({
      clear: vi.fn(),
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    })),
    VueQueryPlugin: {},
    useMutation: vi.fn(() => mockUseMutation()),
    useQuery: vi.fn(() => mockUseQuery()),
    useQueryClient: vi.fn(() => ({
      clear: vi.fn(),
      invalidateQueries: vi.fn(),
      setQueryData: vi.fn(),
      getQueryData: vi.fn(),
    })),
  }))
}