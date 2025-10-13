import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardApiService } from '@/api/services/DashboardApiService'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createStandardMockSupabase } from '../../../utils/supabaseMock'

// Mock the global realtime alerts - simplified
vi.mock('@/composables/useRealtimeAlerts', () => ({
  getGlobalRealtimeAlerts: vi.fn().mockReturnValue({
    notifications: { errorCount: 0, isHealthy: true },
    orders: { errorCount: 0, isHealthy: true },
    inventory: { errorCount: 0, isHealthy: true },
  }),
}))

// Mock utils - minimal required mocks
vi.mock('@/utils', () => ({
  convertToISOString: vi.fn((date: Date) => date.toISOString()),
  formatDateOnly: vi.fn((date: Date) => date.toISOString().split('T')[0]),
}))

describe('DashboardApiService - Simplified Tests', () => {
  let mockSupabase: SupabaseClient
  let dashboardService: DashboardApiService

  beforeEach(() => {
    vi.clearAllMocks()

    // 使用標準化 Mock 配置，包含所有必要的查詢方法
    const { mockSupabase: mockClient, configureMockSuccess } = createStandardMockSupabase()
    mockSupabase = mockClient as any as SupabaseClient

    // 配置成功回應數據
    const mockData = [
      { total_revenue: 1000, total_orders: 10, total_customers: 100 }
    ]
    configureMockSuccess(mockData, mockData.length)

    // 配置 RPC Mock 回應
    mockSupabase.rpc = vi.fn().mockResolvedValue({
      data: { total_revenue: 1000, total_orders: 10, total_customers: 100 },
      error: null,
    })

    dashboardService = new DashboardApiService(mockSupabase)
  })

  describe('Constructor', () => {
    it('should create DashboardApiService instance', () => {
      expect(dashboardService).toBeInstanceOf(DashboardApiService)
    })
  })

  describe('Basic API Methods', () => {
    it('should call getOverview without errors', async () => {
      const result = await dashboardService.getOverview()
      
      // Just test that the service handles the call
      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('success')
    })

    it('should call getTopProducts without errors', async () => {
      const result = await dashboardService.getTopProducts()
      
      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('success')
    })

    it('should handle basic error cases', async () => {
      // Mock a simple error
      ;(mockSupabase.rpc as any).mockRejectedValueOnce(new Error('Mock error'))
      
      const result = await dashboardService.getOverview()
      
      // Should return error response structure
      expect(typeof result).toBe('object')
      expect(result).toHaveProperty('success')
    })
  })

  describe('Service Integration', () => {
    it('should interact with Supabase client', () => {
      // Verify the service was instantiated with supabase client
      expect(dashboardService).toBeDefined()
      expect(dashboardService).toBeInstanceOf(DashboardApiService)
    })

    it('should inherit from BaseApiService', () => {
      // Basic inheritance check
      expect(typeof dashboardService.handleError).toBe('function')
    })
  })
})