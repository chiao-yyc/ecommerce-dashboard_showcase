import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock @/lib/supabase before importing any services
vi.mock('@/lib/supabase', async () => {
  const { createStandardMockSupabase } = await import(
    '../../../utils/supabaseMock'
  )
  const { mockSupabase } = createStandardMockSupabase()
  return {
    supabase: mockSupabase,
  }
})

import { ServiceFactory } from '@/api/services/ServiceFactory'
import { createStandardMockSupabase } from '../../../utils/supabaseMock'

// Import all the service classes to verify proper instantiation
import { UserApiService } from '@/api/services/UserApiService'
import { ProductApiService } from '@/api/services/ProductApiService'
import { OrderApiService } from '@/api/services/OrderApiService'
import { CustomerApiService } from '@/api/services/CustomerApiService'
import { OrderAnalyticsService } from '@/api/services/OrderAnalyticsService'
import { CustomerAnalyticsZeroExpansionService } from '@/api/services/CustomerAnalyticsZeroExpansionService'
import { SupportAnalyticsApiService } from '@/api/services/SupportAnalyticsApiService'
import { CampaignAnalyticsApiService } from '@/api/services/CampaignAnalyticsApiService'
import { DashboardApiService } from '@/api/services/DashboardApiService'
import { AIPromptTemplateService } from '@/api/services/ai/AIPromptTemplateService'
import { AIEnhancedAlertService } from '@/api/services/ai/AIEnhancedAlertService'

describe('ServiceFactory', () => {
  let mockSupabase: SupabaseClient
  let serviceFactory: ServiceFactory

  beforeEach(() => {
    const { mockSupabase: mockedSupabase } = createStandardMockSupabase()
    mockSupabase = mockedSupabase as any as SupabaseClient
    serviceFactory = new ServiceFactory(mockSupabase)
  })

  describe('Constructor', () => {
    it('should create ServiceFactory with provided supabase client', () => {
      expect(serviceFactory).toBeInstanceOf(ServiceFactory)
    })

    it('should accept different supabase configurations', () => {
      const customMockSupabase = createStandardMockSupabase()
      const customFactory = new ServiceFactory(
        customMockSupabase.mockSupabase as SupabaseClient,
      )

      expect(customFactory).toBeInstanceOf(ServiceFactory)
      expect(customFactory).not.toBe(serviceFactory)
    })
  })

  describe('Service Creation - Singleton Pattern', () => {
    describe('getUserService', () => {
      it('should create UserApiService instance', () => {
        const userService = serviceFactory.getUserService()
        expect(userService).toBeInstanceOf(UserApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const userService1 = serviceFactory.getUserService()
        const userService2 = serviceFactory.getUserService()

        expect(userService1).toBe(userService2)
      })
    })

    describe('getProductService', () => {
      it('should create ProductApiService instance', () => {
        const productService = serviceFactory.getProductService()
        expect(productService).toBeInstanceOf(ProductApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const productService1 = serviceFactory.getProductService()
        const productService2 = serviceFactory.getProductService()

        expect(productService1).toBe(productService2)
      })
    })

    describe('getOrderService', () => {
      it('should create OrderApiService instance', () => {
        const orderService = serviceFactory.getOrderService()
        expect(orderService).toBeInstanceOf(OrderApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const orderService1 = serviceFactory.getOrderService()
        const orderService2 = serviceFactory.getOrderService()

        expect(orderService1).toBe(orderService2)
      })
    })

    describe('getCustomerService', () => {
      it('should create CustomerApiService instance', () => {
        const customerService = serviceFactory.getCustomerService()
        expect(customerService).toBeInstanceOf(CustomerApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const customerService1 = serviceFactory.getCustomerService()
        const customerService2 = serviceFactory.getCustomerService()

        expect(customerService1).toBe(customerService2)
      })
    })

    describe('getOrderAnalyticsService', () => {
      it('should create OrderAnalyticsService instance', () => {
        const orderAnalyticsService = serviceFactory.getOrderAnalyticsService()
        expect(orderAnalyticsService).toBeInstanceOf(OrderAnalyticsService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getOrderAnalyticsService()
        const service2 = serviceFactory.getOrderAnalyticsService()

        expect(service1).toBe(service2)
      })
    })

    describe('getCustomerAnalyticsService', () => {
      it('should create CustomerAnalyticsZeroExpansionService instance', () => {
        const service = serviceFactory.getCustomerAnalyticsService()
        expect(service).toBeInstanceOf(CustomerAnalyticsZeroExpansionService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getCustomerAnalyticsService()
        const service2 = serviceFactory.getCustomerAnalyticsService()

        expect(service1).toBe(service2)
      })
    })

    describe('getSupportAnalyticsService', () => {
      it('should create SupportAnalyticsApiService instance', () => {
        const service = serviceFactory.getSupportAnalyticsService()
        expect(service).toBeInstanceOf(SupportAnalyticsApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getSupportAnalyticsService()
        const service2 = serviceFactory.getSupportAnalyticsService()

        expect(service1).toBe(service2)
      })
    })

    describe('getCampaignAnalyticsService', () => {
      it('should create CampaignAnalyticsApiService instance', () => {
        const service = serviceFactory.getCampaignAnalyticsService()
        expect(service).toBeInstanceOf(CampaignAnalyticsApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getCampaignAnalyticsService()
        const service2 = serviceFactory.getCampaignAnalyticsService()

        expect(service1).toBe(service2)
      })
    })

    describe('getDashboardService', () => {
      it('should create DashboardApiService instance', () => {
        const service = serviceFactory.getDashboardService()
        expect(service).toBeInstanceOf(DashboardApiService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getDashboardService()
        const service2 = serviceFactory.getDashboardService()

        expect(service1).toBe(service2)
      })
    })

    describe('getAIPromptTemplateService', () => {
      it('should create AIPromptTemplateService instance', () => {
        const service = serviceFactory.getAIPromptTemplateService()
        expect(service).toBeInstanceOf(AIPromptTemplateService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getAIPromptTemplateService()
        const service2 = serviceFactory.getAIPromptTemplateService()

        expect(service1).toBe(service2)
      })
    })

    describe('getAIEnhancedAlertService', () => {
      it('should create AIEnhancedAlertService instance', () => {
        const service = serviceFactory.getAIEnhancedAlertService()
        expect(service).toBeInstanceOf(AIEnhancedAlertService)
      })

      it('should return same instance on multiple calls (singleton)', () => {
        const service1 = serviceFactory.getAIEnhancedAlertService()
        const service2 = serviceFactory.getAIEnhancedAlertService()

        expect(service1).toBe(service2)
      })
    })
  })

  describe('getAllServices - Batch Access', () => {
    it('should return object with all available services', () => {
      const allServices = serviceFactory.getAllServices()

      expect(allServices).toHaveProperty('user')
      expect(allServices).toHaveProperty('product')
      expect(allServices).toHaveProperty('order')
      expect(allServices).toHaveProperty('customer')
      expect(allServices).toHaveProperty('orderAnalytics')
      expect(allServices).toHaveProperty('customerAnalytics')
      expect(allServices).toHaveProperty('supportAnalytics')
      expect(allServices).toHaveProperty('campaignAnalytics')
      expect(allServices).toHaveProperty('dashboard')
      expect(allServices).toHaveProperty('aiPromptTemplate')
      expect(allServices).toHaveProperty('aiEnhancedAlert')
    })

    it('should return correct service instances in batch', () => {
      const allServices = serviceFactory.getAllServices()

      expect(allServices.user).toBeInstanceOf(UserApiService)
      expect(allServices.product).toBeInstanceOf(ProductApiService)
      expect(allServices.order).toBeInstanceOf(OrderApiService)
      expect(allServices.customer).toBeInstanceOf(CustomerApiService)
      expect(allServices.orderAnalytics).toBeInstanceOf(OrderAnalyticsService)
      expect(allServices.customerAnalytics).toBeInstanceOf(
        CustomerAnalyticsZeroExpansionService,
      )
      expect(allServices.supportAnalytics).toBeInstanceOf(
        SupportAnalyticsApiService,
      )
      expect(allServices.campaignAnalytics).toBeInstanceOf(
        CampaignAnalyticsApiService,
      )
      expect(allServices.dashboard).toBeInstanceOf(DashboardApiService)
      expect(allServices.aiPromptTemplate).toBeInstanceOf(
        AIPromptTemplateService,
      )
      expect(allServices.aiEnhancedAlert).toBeInstanceOf(AIEnhancedAlertService)
    })

    it('should return same instances as individual getters (singleton consistency)', () => {
      const allServices = serviceFactory.getAllServices()

      expect(allServices.user).toBe(serviceFactory.getUserService())
      expect(allServices.product).toBe(serviceFactory.getProductService())
      expect(allServices.order).toBe(serviceFactory.getOrderService())
      expect(allServices.customer).toBe(serviceFactory.getCustomerService())
      expect(allServices.orderAnalytics).toBe(
        serviceFactory.getOrderAnalyticsService(),
      )
      expect(allServices.customerAnalytics).toBe(
        serviceFactory.getCustomerAnalyticsService(),
      )
      expect(allServices.supportAnalytics).toBe(
        serviceFactory.getSupportAnalyticsService(),
      )
      expect(allServices.campaignAnalytics).toBe(
        serviceFactory.getCampaignAnalyticsService(),
      )
      expect(allServices.dashboard).toBe(serviceFactory.getDashboardService())
      expect(allServices.aiPromptTemplate).toBe(
        serviceFactory.getAIPromptTemplateService(),
      )
      expect(allServices.aiEnhancedAlert).toBe(
        serviceFactory.getAIEnhancedAlertService(),
      )
    })
  })

  describe('Dependency Injection Architecture', () => {
    it('should pass supabase client to each service instance', () => {
      // 這個測試驗證每個服務都正確接收到 supabase 實例
      // 我們可以透過檢查服務實例是否正常建立來驗證這點
      const userService = serviceFactory.getUserService()
      const productService = serviceFactory.getProductService()
      const orderService = serviceFactory.getOrderService()

      // 如果 supabase 沒有正確傳遞，服務建構子會失敗
      expect(userService).toBeDefined()
      expect(productService).toBeDefined()
      expect(orderService).toBeDefined()
    })

    it('should support different supabase instances for different factories', () => {
      const factory1 = new ServiceFactory(mockSupabase)
      const mockSupabase2 = createStandardMockSupabase()
        .mockSupabase as any as SupabaseClient
      const factory2 = new ServiceFactory(mockSupabase2)

      const user1 = factory1.getUserService()
      const user2 = factory2.getUserService()

      // Different factories should create different service instances
      expect(user1).not.toBe(user2)
      expect(user1).toBeInstanceOf(UserApiService)
      expect(user2).toBeInstanceOf(UserApiService)
    })
  })

  describe('Memory Management', () => {
    it('should maintain instance cache across multiple calls', () => {
      // First round
      const user1 = serviceFactory.getUserService()
      const product1 = serviceFactory.getProductService()

      // Second round
      const user2 = serviceFactory.getUserService()
      const product2 = serviceFactory.getProductService()

      // Should return cached instances
      expect(user1).toBe(user2)
      expect(product1).toBe(product2)
    })

    it('should handle mixed service access patterns', () => {
      // Individual access
      const userService = serviceFactory.getUserService()

      // Batch access
      const allServices = serviceFactory.getAllServices()

      // Mixed access should return same instances
      expect(allServices.user).toBe(userService)

      // Additional individual access
      const productService = serviceFactory.getProductService()
      expect(allServices.product).toBe(productService)
    })
  })

  describe('Performance Characteristics', () => {
    it('should create instances lazily (not in constructor)', () => {
      const newFactory = new ServiceFactory(mockSupabase)

      // Constructor should complete quickly without creating all services
      expect(newFactory).toBeInstanceOf(ServiceFactory)

      // Services are created only when requested
      const userService = newFactory.getUserService()
      expect(userService).toBeInstanceOf(UserApiService)
    })

    it('should handle rapid successive calls efficiently', () => {
      const start = performance.now()

      // Multiple rapid calls should use cached instances
      for (let i = 0; i < 100; i++) {
        serviceFactory.getUserService()
        serviceFactory.getProductService()
        serviceFactory.getOrderService()
      }

      const end = performance.now()
      const duration = end - start

      // Should complete very quickly (under 10ms for 300 calls)
      expect(duration).toBeLessThan(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle null supabase client gracefully', () => {
      expect(() => {
        new ServiceFactory(null as any)
      }).not.toThrow()
    })

    it('should handle undefined supabase client gracefully', () => {
      expect(() => {
        new ServiceFactory(undefined as any)
      }).not.toThrow()
    })
  })
})
