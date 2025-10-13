/**
 * 統一 API Services Mock 工廠
 * 集中管理所有 API Services 相關的 Mock 配置
 */

import { vi } from 'vitest'
import type { ApiResponse } from '@/api/services/base/BaseApiService'

// 通用 API 響應模擬
export const createMockApiResponse = <T>(
  data: T,
  success = true,
  error?: string
): ApiResponse<T> => ({
  success,
  data: success ? data : null,
  error: success ? null : error || 'Mock API Error',
  message: success ? 'Success' : error || 'Mock API Error'
})

// 分頁響應模擬
export const createMockPaginatedResponse = <T>(
  items: T[],
  page = 1,
  pageSize = 10,
  totalCount?: number
) => {
  const total = totalCount || items.length
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = items.slice(startIndex, endIndex)

  return createMockApiResponse({
    data: paginatedItems,
    pagination: {
      page,
      pageSize,
      totalCount: total,
      totalPages: Math.ceil(total / pageSize)
    }
  })
}

// 基礎 Service Mock 建立器
export const createMockBaseService = <T>(mockData: T[] = [], shouldError = false) => ({
  findAll: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Find all failed')
      : createMockApiResponse(mockData)
  ),
  findById: vi.fn().mockImplementation((id: string) =>
    shouldError
      ? Promise.resolve(createMockApiResponse(null, false, 'Find by ID failed'))
      : Promise.resolve(createMockApiResponse(mockData.find((item: any) => item.id === id) || null))
  ),
  create: vi.fn().mockImplementation((data: Partial<T>) =>
    shouldError
      ? Promise.resolve(createMockApiResponse(null, false, 'Create failed'))
      : Promise.resolve(createMockApiResponse({ id: 'new-id', ...data } as T))
  ),
  update: vi.fn().mockImplementation((id: string, data: Partial<T>) =>
    shouldError
      ? Promise.resolve(createMockApiResponse(null, false, 'Update failed'))
      : Promise.resolve(createMockApiResponse({ id, ...data } as T))
  ),
  delete: vi.fn().mockImplementation((id: string) =>
    shouldError
      ? Promise.resolve(createMockApiResponse(null, false, 'Delete failed'))
      : Promise.resolve(createMockApiResponse({ id } as T))
  )
})

// 常用測試資料
export const MOCK_DATA = {
  users: [
    { id: 'user-1', email: 'admin@example.com', full_name: 'Admin User', role: 'admin' },
    { id: 'user-2', email: 'user@example.com', full_name: 'Regular User', role: 'user' },
    { id: 'user-3', email: 'user3@example.com', full_name: 'Third User', role: 'user' }
  ],
  roles: [
    { id: 'role-1', name: 'Admin', description: 'Administrator role' },
    { id: 'role-2', name: 'User', description: 'Regular user role' }
  ],
  orders: [
    {
      id: 'order-1',
      customer_id: 'customer-1',
      total_amount: 1000,
      status: 'completed',
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'order-2',
      customer_id: 'customer-2',
      total_amount: 2000,
      status: 'pending',
      created_at: '2024-01-02T00:00:00.000Z'
    }
  ],
  customers: [
    {
      id: 'customer-1',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'customer-2',
      full_name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '098-765-4321',
      created_at: '2024-01-02T00:00:00.000Z'
    }
  ],
  products: [
    {
      id: 'product-1',
      name: 'Test Product 1',
      price: 100,
      stock: 50,
      category: 'electronics',
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'product-2',
      name: 'Test Product 2',
      price: 200,
      stock: 30,
      category: 'clothing',
      created_at: '2024-01-02T00:00:00.000Z'
    }
  ],
  notifications: [
    {
      id: 'notification-1',
      title: 'Test Notification 1',
      message: 'This is a test notification',
      type: 'info',
      status: 'unread',
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'notification-2',
      title: 'Test Notification 2',
      message: 'Another test notification',
      type: 'warning',
      status: 'read',
      created_at: '2024-01-02T00:00:00.000Z'
    }
  ]
}

// UserApiService Mock
export const createMockUserService = (shouldError = false) => ({
  ...createMockBaseService(MOCK_DATA.users, shouldError),
  fetchUsersWithPagination: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Fetch users failed')
      : createMockPaginatedResponse(MOCK_DATA.users)
  ),
  setUserRole: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Set role failed')
      : createMockApiResponse({ success: true })
  ),
  removeUserRole: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Remove role failed')
      : createMockApiResponse({ success: true })
  )
})

// OrderApiService Mock
export const createMockOrderService = (shouldError = false) => ({
  ...createMockBaseService(MOCK_DATA.orders, shouldError),
  fetchOrdersWithFilters: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Fetch orders failed')
      : createMockPaginatedResponse(MOCK_DATA.orders)
  ),
  updateOrderStatus: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Update status failed')
      : createMockApiResponse({ success: true })
  )
})

// CustomerApiService Mock
export const createMockCustomerService = (shouldError = false) => ({
  ...createMockBaseService(MOCK_DATA.customers, shouldError),
  fetchCustomersWithFilters: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Fetch customers failed')
      : createMockPaginatedResponse(MOCK_DATA.customers)
  ),
  getRFMSegments: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'RFM analysis failed')
      : createMockApiResponse(['Champions', 'Loyal Customers', 'At Risk'])
  )
})

// ProductApiService Mock
export const createMockProductService = (shouldError = false) => ({
  ...createMockBaseService(MOCK_DATA.products, shouldError),
  fetchProductsWithFilters: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Fetch products failed')
      : createMockPaginatedResponse(MOCK_DATA.products)
  ),
  updateStock: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Update stock failed')
      : createMockApiResponse({ success: true })
  )
})

// NotificationApiService Mock
export const createMockNotificationService = (shouldError = false) => ({
  ...createMockBaseService(MOCK_DATA.notifications, shouldError),
  fetchNotifications: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Fetch notifications failed')
      : createMockPaginatedResponse(MOCK_DATA.notifications)
  ),
  markAsRead: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Mark as read failed')
      : createMockApiResponse({ success: true })
  ),
  getDistributionStats: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Get stats failed')
      : createMockApiResponse([
          { type: 'info', count: 10 },
          { type: 'warning', count: 5 },
          { type: 'error', count: 2 }
        ])
  )
})

// DashboardApiService Mock
export const createMockDashboardService = (shouldError = false) => ({
  getBusinessHealthMetrics: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Get metrics failed')
      : createMockApiResponse({
          sales: 85,
          customer: 90,
          inventory: 78,
          operations: 82,
          marketing: 88,
          finance: 85,
          system: 95
        })
  ),
  getRevenueAnalytics: vi.fn().mockResolvedValue(
    shouldError
      ? createMockApiResponse(null, false, 'Get revenue failed')
      : createMockApiResponse({
          total: 100000,
          growth: 15.5,
          trends: [1000, 1200, 1100, 1300, 1400]
        })
  )
})

// ServiceFactory Mock
export const createMockServiceFactory = (shouldError = false) => ({
  getUserService: vi.fn().mockReturnValue(createMockUserService(shouldError)),
  getOrderService: vi.fn().mockReturnValue(createMockOrderService(shouldError)),
  getCustomerService: vi.fn().mockReturnValue(createMockCustomerService(shouldError)),
  getProductService: vi.fn().mockReturnValue(createMockProductService(shouldError)),
  getNotificationService: vi.fn().mockReturnValue(createMockNotificationService(shouldError)),
  getDashboardService: vi.fn().mockReturnValue(createMockDashboardService(shouldError)),
  getAllServices: vi.fn().mockReturnValue({
    user: createMockUserService(shouldError),
    order: createMockOrderService(shouldError),
    customer: createMockCustomerService(shouldError),
    product: createMockProductService(shouldError),
    notification: createMockNotificationService(shouldError),
    dashboard: createMockDashboardService(shouldError)
  })
})

// 統一 Services Mock 設定
export const setupServicesMock = (shouldError = false) => {
  const mockFactory = createMockServiceFactory(shouldError)

  return vi.mock('@/api/services', () => ({
    defaultServiceFactory: mockFactory,
    ServiceFactory: vi.fn().mockImplementation(() => mockFactory)
  }))
}

// 匯出便捷函數
export {
  setupServicesMock as mockServices,
  createMockServiceFactory as createServiceFactory,
  createMockApiResponse as mockApiResponse,
  createMockPaginatedResponse as mockPaginatedResponse
}