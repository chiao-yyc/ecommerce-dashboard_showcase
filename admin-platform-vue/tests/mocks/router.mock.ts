/**
 * 統一 Vue Router Mock 工廠
 * 集中管理所有 Vue Router 相關的 Mock 配置
 */

import { vi } from 'vitest'

// 路由模擬配置介面
export interface MockRouteConfig {
  path?: string
  name?: string
  params?: Record<string, string>
  query?: Record<string, string>
  meta?: Record<string, any>
}

// 建立模擬路由物件
export const createMockRoute = (config: MockRouteConfig = {}) => ({
  path: config.path || '/',
  name: config.name || 'home',
  params: config.params || {},
  query: config.query || {},
  meta: config.meta || {},
  hash: '',
  fullPath: config.path || '/',
  matched: [],
  redirectedFrom: undefined
})

// 建立模擬路由器
export const createMockRouter = (currentRoute?: MockRouteConfig) => {
  const route = createMockRoute(currentRoute)

  return {
    currentRoute: { value: route },
    push: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    beforeEach: vi.fn(),
    beforeResolve: vi.fn(),
    afterEach: vi.fn(),
    onError: vi.fn(),
    isReady: vi.fn().mockResolvedValue(true),
    install: vi.fn(),
    addRoute: vi.fn(),
    removeRoute: vi.fn(),
    hasRoute: vi.fn().mockReturnValue(true),
    getRoutes: vi.fn().mockReturnValue([]),
    resolve: vi.fn().mockImplementation((to) => ({
      href: typeof to === 'string' ? to : to.path || '/',
      route: createMockRoute(typeof to === 'string' ? { path: to } : to)
    }))
  }
}

// 建立路由連結模擬
export const createMockRouterLink = () => ({
  name: 'RouterLink',
  template: '<a :href="to" @click="$emit(\'click\', $event)"><slot /></a>',
  props: ['to'],
  emits: ['click']
})

// useRouter 模擬
export const createMockUseRouter = (router?: ReturnType<typeof createMockRouter>) => {
  const mockRouter = router || createMockRouter()

  return vi.fn(() => mockRouter)
}

// useRoute 模擬
export const createMockUseRoute = (route?: MockRouteConfig) => {
  const mockRoute = createMockRoute(route)

  return vi.fn(() => mockRoute)
}

// 完整的 vue-router Mock 設定
export const setupVueRouterMock = (options: {
  currentRoute?: MockRouteConfig
  customRouter?: ReturnType<typeof createMockRouter>
} = {}) => {
  const router = options.customRouter || createMockRouter(options.currentRoute)
  const route = createMockRoute(options.currentRoute)

  return vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('vue-router')>()

    return {
      ...actual,
      useRouter: createMockUseRouter(router),
      useRoute: createMockUseRoute(options.currentRoute),
      RouterLink: createMockRouterLink(),
      RouterView: {
        name: 'RouterView',
        template: '<div class="router-view"><slot /></div>'
      },
      createRouter: vi.fn().mockReturnValue(router),
      createWebHistory: vi.fn(),
      createWebHashHistory: vi.fn(),
      createMemoryHistory: vi.fn()
    }
  })
}

// 常用路由場景預設
export const COMMON_ROUTES = {
  dashboard: { path: '/dashboard', name: 'dashboard' },
  orders: { path: '/orders', name: 'orders' },
  customers: { path: '/customers', name: 'customers' },
  products: { path: '/products', name: 'products' },
  notifications: { path: '/notifications', name: 'notifications' },
  roleUsers: { path: '/role-users', name: 'role-users' },
  login: { path: '/login', name: 'login' },
  orderDetail: {
    path: '/orders/:id',
    name: 'order-detail',
    params: { id: 'test-order-id' }
  },
  customerDetail: {
    path: '/customers/:id',
    name: 'customer-detail',
    params: { id: 'test-customer-id' }
  }
} as const

// 便捷函數：為特定頁面建立路由 Mock
export const mockRouterForPage = (pageName: keyof typeof COMMON_ROUTES) => {
  return setupVueRouterMock({ currentRoute: COMMON_ROUTES[pageName] })
}

// 便捷函數：模擬路由導航
export const mockRouterNavigation = () => {
  const pushMock = vi.fn().mockResolvedValue(undefined)
  const replaceMock = vi.fn().mockResolvedValue(undefined)

  const router = createMockRouter()
  router.push = pushMock
  router.replace = replaceMock

  return {
    router,
    expectNavigation: {
      toPush: (path: string) => expect(pushMock).toHaveBeenCalledWith(path),
      toReplace: (path: string) => expect(replaceMock).toHaveBeenCalledWith(path),
      toHaveBeenCalled: () => expect(pushMock).toHaveBeenCalled() || expect(replaceMock).toHaveBeenCalled()
    }
  }
}

// 匯出便捷函數
export {
  setupVueRouterMock as mockVueRouter,
  createMockRouter as createRouter,
  createMockRoute as createRoute,
  mockRouterForPage as mockPageRouter
}