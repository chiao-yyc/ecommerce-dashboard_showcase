/**
 * 統一 API Mock 工廠
 * 解決不同測試中 Mock 實現不一致的問題
 */

import { vi } from 'vitest'

// 統一的 NotificationApi Mock 實現
export const createNotificationApiMock = () => ({
  getUserNotifications: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  getNotificationStats: vi.fn().mockResolvedValue({
    success: true,
    data: {
      totalCount: 0,
      unreadCount: 0,
      priorityDistribution: {},
      categoryDistribution: {},
    },
  }),
  
  getSuggestionStats: vi.fn().mockResolvedValue({
    success: true,
    data: {
      totalSuggestions: 0,
      totalNotifications: 0,
      byType: {},
      oldestSuggestion: null,
      newestSuggestion: null,
    },
  }),
  
  markAsRead: vi.fn().mockResolvedValue({ success: true }),
  markAsUnread: vi.fn().mockResolvedValue({ success: true }),
  markAsCompleted: vi.fn().mockResolvedValue({ success: true }),
  markAsDismissed: vi.fn().mockResolvedValue({ success: true }),
  archiveNotification: vi.fn().mockResolvedValue({ success: true }),
  markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
  
  getSuggestedNotifications: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  acceptCompletionSuggestion: vi.fn().mockResolvedValue({ success: true }),
  dismissCompletionSuggestion: vi.fn().mockResolvedValue({ success: true }),
  searchNotifications: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
})

// 統一的 GroupNotificationApi Mock 實現
export const createGroupNotificationApiMock = () => ({
  notifyRole: vi.fn().mockResolvedValue({ success: true }),
  notifyBroadcast: vi.fn().mockResolvedValue({ success: true }),
  notifyCustomGroup: vi.fn().mockResolvedValue({ success: true }),
  
  getDistributionStats: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
})

// 統一的 PreferenceApi Mock 實現
export const createPreferenceApiMock = () => ({
  getUserPreferences: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  updateUserPreference: vi.fn().mockResolvedValue({ success: true }),
})

// ============================================================================
// 擴展的 API Mock 實現
// ============================================================================

// 統一的 OrderApi Mock 實現
export const createOrderApiMock = () => ({
  // BaseApiService 方法
  findById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),
  
  findAll: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  create: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'order-1' },
  }),
  
  update: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'order-1' },
  }),
  
  delete: vi.fn().mockResolvedValue({
    success: true,
  }),

  // OrderApiService 特定方法
  getOrders: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  getOrderById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),
  
  createOrderWithItems: vi.fn().mockResolvedValue({
    success: true,
    data: { order_id: 'order-1' },
  }),

  getOrderStats: vi.fn().mockResolvedValue({
    success: true,
    data: {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
    },
  }),
})

// 統一的 ProductApi Mock 實現  
export const createProductApiMock = () => ({
  // BaseApiService 方法
  findById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),
  
  findAll: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  create: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'product-1' },
  }),
  
  update: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'product-1' },
  }),
  
  delete: vi.fn().mockResolvedValue({
    success: true,
  }),

  // ProductApiService 特定方法
  getProducts: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  getProductById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),

  getInventories: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),

  addInventory: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'inventory-1' },
  }),
})

// 統一的 CustomerApi Mock 實現
export const createCustomerApiMock = () => ({
  // BaseApiService 方法
  findById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),
  
  findAll: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  create: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'customer-1' },
  }),
  
  update: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'customer-1' },
  }),
  
  delete: vi.fn().mockResolvedValue({
    success: true,
  }),

  // CustomerApiService 特定方法
  fetchCustomersWithPagination: vi.fn().mockResolvedValue({
    success: true,
    data: [],
    page: 1,
    perPage: 10,
    count: 0,
    totalPages: 0,
  }),
  
  getCustomers: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  getCustomerById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),

  getCustomerStats: vi.fn().mockResolvedValue({
    success: true,
    data: {
      totalCustomers: 0,
      newCustomers: 0,
      activeCustomers: 0,
    },
  }),
})

// 統一的 DashboardApi Mock 實現
export const createDashboardApiMock = () => ({
  getBusinessHealthMetrics: vi.fn().mockResolvedValue({
    success: true,
    data: {
      revenue: 8.5,
      satisfaction: 7.2,
      fulfillment: 9.1,
      support: 6.8,
      products: 7.9,
      marketing: 8.3,
      system: 7.5
    },
  }),

  getExecutiveOverview: vi.fn().mockResolvedValue({
    success: true,
    data: {
      totalRevenue: 1250000,
      totalOrders: 850,
      totalCustomers: 420,
      averageOrderValue: 1470,
    },
  }),

  getSystemAlerts: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
})

// 統一的 UserApi Mock 實現
export const createUserApiMock = () => ({
  // BaseApiService 方法
  findById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),
  
  findAll: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  create: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'user-1' },
  }),
  
  update: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'user-1' },
  }),
  
  delete: vi.fn().mockResolvedValue({
    success: true,
  }),

  // UserApiService 特定方法
  getUsers: vi.fn().mockResolvedValue({
    success: true,
    data: [],
  }),
  
  getUserById: vi.fn().mockResolvedValue({
    success: true,
    data: null,
  }),

  getCurrentUser: vi.fn().mockResolvedValue({
    success: true,
    data: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
  }),
  
  fetchUsersByKeyword: vi.fn().mockResolvedValue([]),
})

// ============================================================================
// 全域 Mock 管理器 (擴展版)
// ============================================================================

export class MockApiManager {
  private static instance: MockApiManager
  private mocks = new Map<string, any>()
  
  static getInstance() {
    if (!MockApiManager.instance) {
      MockApiManager.instance = new MockApiManager()
    }
    return MockApiManager.instance
  }
  
  // 原有 Mock 方法
  getNotificationApiMock() {
    if (!this.mocks.has('notificationApi')) {
      this.mocks.set('notificationApi', createNotificationApiMock())
    }
    return this.mocks.get('notificationApi')
  }
  
  getGroupNotificationApiMock() {
    if (!this.mocks.has('groupNotificationApi')) {
      this.mocks.set('groupNotificationApi', createGroupNotificationApiMock())
    }
    return this.mocks.get('groupNotificationApi')
  }
  
  getPreferenceApiMock() {
    if (!this.mocks.has('preferenceApi')) {
      this.mocks.set('preferenceApi', createPreferenceApiMock())
    }
    return this.mocks.get('preferenceApi')
  }

  // 新增 Mock 方法
  getOrderApiMock() {
    if (!this.mocks.has('orderApi')) {
      this.mocks.set('orderApi', createOrderApiMock())
    }
    return this.mocks.get('orderApi')
  }

  getProductApiMock() {
    if (!this.mocks.has('productApi')) {
      this.mocks.set('productApi', createProductApiMock())
    }
    return this.mocks.get('productApi')
  }

  getCustomerApiMock() {
    if (!this.mocks.has('customerApi')) {
      this.mocks.set('customerApi', createCustomerApiMock())
    }
    return this.mocks.get('customerApi')
  }

  getDashboardApiMock() {
    if (!this.mocks.has('dashboardApi')) {
      this.mocks.set('dashboardApi', createDashboardApiMock())
    }
    return this.mocks.get('dashboardApi')
  }

  getUserApiMock() {
    if (!this.mocks.has('userApi')) {
      this.mocks.set('userApi', createUserApiMock())
    }
    return this.mocks.get('userApi')
  }

  /**
   * 獲取所有可用的 API Mock
   */
  getAllApiMocks() {
    return {
      notification: this.getNotificationApiMock(),
      groupNotification: this.getGroupNotificationApiMock(),
      preference: this.getPreferenceApiMock(),
      order: this.getOrderApiMock(),
      product: this.getProductApiMock(),
      customer: this.getCustomerApiMock(),
      dashboard: this.getDashboardApiMock(),
      user: this.getUserApiMock(),
    }
  }

  /**
   * 根據名稱獲取特定的 API Mock
   */
  getApiMock(apiName: string) {
    const methodName = `get${apiName.charAt(0).toUpperCase() + apiName.slice(1)}ApiMock`
    if (typeof (this as any)[methodName] === 'function') {
      return (this as any)[methodName]()
    }
    throw new Error(`未找到 API Mock: ${apiName}`)
  }

  /**
   * 批量設置 Mock 返回值
   */
  configureMockResponses(config: Record<string, Record<string, any>>) {
    Object.entries(config).forEach(([apiName, methods]) => {
      try {
        const apiMock = this.getApiMock(apiName)
        Object.entries(methods).forEach(([methodName, response]) => {
          if (apiMock[methodName] && typeof apiMock[methodName].mockResolvedValue === 'function') {
            apiMock[methodName].mockResolvedValue(response)
          }
        })
      } catch (error) {
        console.warn(`配置 ${apiName} Mock 時發生錯誤:`, error)
      }
    })
  }
  
  // 重設所有 Mock
  resetAllMocks() {
    this.mocks.forEach((mock) => {
      if (typeof mock === 'object' && mock !== null) {
        Object.values(mock).forEach((fn) => {
          if (vi.isMockFunction(fn)) {
            fn.mockClear()
            // 重新設置預設的 mock 實現
            const defaultResponse = { success: true, data: [] }
            fn.mockResolvedValue(defaultResponse)
          }
        })
      }
    })
  }

  /**
   * 重設特定 API 的 Mock
   */
  resetApiMock(apiName: string) {
    try {
      const apiMock = this.getApiMock(apiName)
      Object.values(apiMock).forEach((fn: any) => {
        if (vi.isMockFunction(fn)) {
          fn.mockClear()
          // 重新設置預設的 mock 實現
          const defaultResponse = { success: true, data: [] }
          fn.mockResolvedValue(defaultResponse)
        }
      })
    } catch (error) {
      console.warn(`重設 ${apiName} Mock 時發生錯誤:`, error)
    }
  }
  
  // 清理所有 Mock
  clearAllMocks() {
    this.mocks.clear()
  }
}

// 導出單例實例
export const mockApiManager = MockApiManager.getInstance()