/**
 * 測試 Mock 工廠函數
 * 提供標準化的測試資料和服務 Mock
 */

import { vi, type MockedFunction } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardAlert } from '@/composables/queries/useBusinessHealthQueries'
import type {
  AIServiceConfig,
  AIGenerationResponse,
  AIServiceHealth,
} from '@/api/services/ai/BaseAIService'

// =====================================================
// Supabase Mock Factory
// =====================================================

/**
 * 建立標準化的 Supabase Mock Client
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  const mockSelect = vi.fn().mockReturnThis()
  const mockInsert = vi.fn().mockReturnThis()
  const mockUpdate = vi.fn().mockReturnThis()
  const mockDelete = vi.fn().mockReturnThis()
  const mockEq = vi.fn().mockReturnThis()
  const mockOrder = vi.fn().mockReturnThis()
  const mockLimit = vi.fn().mockReturnThis()
  const mockSingle = vi.fn()
  const mockRpc = vi.fn()

  return {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    }),
    rpc: mockRpc,
  }
}

/**
 * 配置 Supabase Mock 的成功回應
 */
export function configureMockSupabaseSuccess(
  mockSupabase: Partial<SupabaseClient>,
  data: any[] | any = [],
  count?: number,
) {
  const result = { data, error: null, count: count ?? null }

  // 配置所有鏈式方法都返回成功結果
  const mockTable = (mockSupabase.from as MockedFunction<any>)()

  mockTable.select.mockResolvedValue(result)
  mockTable.insert.mockResolvedValue(result)
  mockTable.update.mockResolvedValue(result)
  mockTable.delete.mockResolvedValue(result)
  mockTable.single.mockResolvedValue({
    data: Array.isArray(data) ? data[0] : data,
    error: null,
  })

  if (mockSupabase.rpc) {
    ;(mockSupabase.rpc as MockedFunction<any>).mockResolvedValue(result)
  }
}

/**
 * 配置 Supabase Mock 的錯誤回應
 */
export function configureMockSupabaseError(
  mockSupabase: Partial<SupabaseClient>,
  errorMessage: string = 'Mock database error',
  errorCode: string = 'MOCK_ERROR',
) {
  const result = {
    data: null,
    error: { message: errorMessage, code: errorCode, details: '', hint: '' },
  }

  const mockTable = (mockSupabase.from as MockedFunction<any>)()

  mockTable.select.mockResolvedValue(result)
  mockTable.insert.mockResolvedValue(result)
  mockTable.update.mockResolvedValue(result)
  mockTable.delete.mockResolvedValue(result)
  mockTable.single.mockResolvedValue(result)

  if (mockSupabase.rpc) {
    ;(mockSupabase.rpc as MockedFunction<any>).mockResolvedValue(result)
  }
}

// =====================================================
// AI 系統 Mock Factories
// =====================================================

/**
 * 建立 AI 服務配置 Mock
 */
export function createMockAIServiceConfig(): AIServiceConfig {
  return {
    baseUrl: 'http://localhost:11434',
    apiKey: 'mock-api-key',
    timeout: 30000,
    maxRetries: 3,
  }
}

/**
 * 建立 AI 生成回應 Mock
 */
export function createMockAIGenerationResponse(
  content: string = 'Mock AI response',
  model: string = 'mock-model',
): AIGenerationResponse {
  return {
    id: `mock-${Date.now()}`,
    model,
    created: Math.floor(Date.now() / 1000),
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  }
}

/**
 * 建立 AI 服務健康狀態 Mock
 */
export function createMockAIServiceHealth(
  status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy',
  latency: number = 500,
): AIServiceHealth {
  return {
    status,
    latency,
    last_check: new Date(),
    error_message: status !== 'healthy' ? 'Mock service error' : undefined,
    available_models: ['mock-model-1', 'mock-model-2'],
  }
}

/**
 * 建立 Mock Fetch 函數（用於測試 HTTP 請求）
 */
export function createMockFetch(
  response: any = { ok: true },
  status: number = 200,
): MockedFunction<typeof fetch> {
  const mockResponse = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
  }

  return vi.fn().mockResolvedValue(mockResponse as any)
}

// =====================================================
// 業務資料 Mock Factories
// =====================================================

/**
 * 產生 Mock 警示資料
 */
export function generateMockAlert(
  overrides: Partial<DashboardAlert> = {},
): DashboardAlert {
  const baseAlert: DashboardAlert = {
    id: `alert-${Date.now()}`,
    alert_type: 'order_high_value',
    title: 'Mock 高價值訂單警示',
    message: '檢測到高價值訂單，需要關注',
    severity: 'warning',
    source: 'system',
    is_read: false,
    detected_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_context: '電商平台訂單監控',
    current_value: 5000,
    threshold_value: 3000,
    trend_direction: 'up',
    related_entity_id: 'order-123',
    related_entity_type: 'order',
  }

  return { ...baseAlert, ...overrides }
}

/**
 * 產生批量 Mock 警示資料
 */
export function generateMockAlerts(
  count: number = 3,
  baseOverrides: Partial<DashboardAlert> = {},
): DashboardAlert[] {
  return Array.from({ length: count }, (_, index) =>
    generateMockAlert({
      ...baseOverrides,
      id: `alert-${Date.now()}-${index}`,
      title: `Mock 警示 ${index + 1}`,
      current_value: 1000 * (index + 1),
    }),
  )
}

/**
 * 產生 Mock AI 使用指標資料
 */
export function generateMockAIUsageMetrics() {
  return {
    config_id: 'config-123',
    template_key: 'alert_enhancement',
    provider_name: 'ollama',
    requests_24h: 50,
    successful_requests_24h: 45,
    success_rate_24h: 90,
    avg_response_time_24h: 2500,
    total_cost_24h: 0,
    errors_24h: 5,
    timeouts_24h: 2,
    last_used_at: new Date().toISOString(),
    stats_generated_at: new Date().toISOString(),
  }
}

// =====================================================
// Vue 測試工具
// =====================================================

/**
 * 建立標準化的 Vue 組件測試 Wrapper 選項
 */
export function createVueTestOptions(overrides: any = {}) {
  return {
    global: {
      plugins: [],
      mocks: {},
      stubs: {
        // 常用組件 stub
        'router-link': true,
        'router-view': true,
      },
      provide: {},
      ...overrides.global,
    },
    props: {},
    slots: {},
    ...overrides,
  }
}

// =====================================================
// 異步測試工具
// =====================================================

/**
 * 等待異步操作完成
 */
export async function waitForAsyncOperation(
  timeout: number = 1000,
): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

/**
 * 等待 DOM 更新完成
 */
export async function waitForDOMUpdate(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * 等待 Vue Query 更新完成
 */
export async function waitForQueryUpdate(timeout: number = 100): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, timeout))
}

// =====================================================
// 錯誤測試工具
// =====================================================

/**
 * 建立標準化的錯誤測試
 */
export function createMockError(
  message: string = 'Mock error',
  code: string = 'MOCK_ERROR',
): Error {
  const error = new Error(message)
  ;(error as any).code = code
  return error
}

/**
 * 建立網路錯誤 Mock
 */
export function createNetworkError(): Error {
  const error = new Error('NetworkError: Failed to fetch')
  ;(error as any).code = 'NETWORK_ERROR'
  return error
}

/**
 * 建立超時錯誤 Mock
 */
export function createTimeoutError(): Error {
  const error = new Error('Request timeout')
  ;(error as any).code = 'TIMEOUT'
  return error
}

// =====================================================
// UUID 和 ID 生成工具
// =====================================================

/**
 * 生成 Mock UUID
 */
export function generateMockUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * 生成 Mock ID（適用於各種實體）
 */
export function generateMockId(prefix: string = 'mock'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// =====================================================
// 測試清理工具
// =====================================================

/**
 * 清理所有 Mock
 */
export function clearAllMocks(): void {
  vi.clearAllMocks()
}

/**
 * 重置所有 Mock
 */
export function resetAllMocks(): void {
  vi.resetAllMocks()
}

/**
 * 還原所有 Mock
 */
export function restoreAllMocks(): void {
  vi.restoreAllMocks()
}
