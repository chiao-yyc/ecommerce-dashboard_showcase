/**
 * 統一 Mock 工廠入口
 * 整合所有 Mock 配置，提供便捷的設定介面
 */

// 匯出所有 Mock 工廠
export * from './supabase.mock'
export * from './router.mock'
export * from './services.mock'
export * from './composables.mock'

import { vi } from 'vitest'
import { setupSupabaseMock } from './supabase.mock'
import { setupVueRouterMock, COMMON_ROUTES } from './router.mock'
import { setupServicesMock } from './services.mock'
import { setupComposablesMocks } from './composables.mock'

// 全面 Mock 設定選項
export interface UnifiedMockOptions {
  // Supabase 設定
  supabase?: {
    customData?: Record<string, any[]>
    shouldError?: boolean
  }

  // Router 設定
  router?: {
    currentRoute?: keyof typeof COMMON_ROUTES | { path: string; name: string; params?: Record<string, string> }
  }

  // Services 設定
  services?: {
    shouldError?: boolean
  }

  // Composables 設定
  composables?: {
    shouldError?: boolean
    isAuthenticated?: boolean
    userPermissions?: string[]
  }

  // 額外 Mock
  additional?: {
    enableVueQuery?: boolean
    enableI18n?: boolean
    enableLucideIcons?: boolean
  }
}

// 一鍵設定所有 Mock
export const setupUnifiedMocks = (options: UnifiedMockOptions = {}) => {
  const mocks = []

  // 設定 Supabase Mock
  if (options.supabase !== false) {
    mocks.push(setupSupabaseMock(options.supabase?.customData))
  }

  // 設定 Router Mock
  if (options.router !== false) {
    const routeConfig = options.router?.currentRoute
    if (typeof routeConfig === 'string') {
      mocks.push(setupVueRouterMock({ currentRoute: COMMON_ROUTES[routeConfig] }))
    } else if (routeConfig && typeof routeConfig === 'object') {
      mocks.push(setupVueRouterMock({ currentRoute: routeConfig }))
    } else {
      mocks.push(setupVueRouterMock())
    }
  }

  // 設定 Services Mock
  if (options.services !== false) {
    mocks.push(setupServicesMock(options.services?.shouldError))
  }

  // 設定 Composables Mock
  if (options.composables !== false) {
    mocks.push(...setupComposablesMocks(options.composables))
  }

  // 額外 Mock
  if (options.additional?.enableVueQuery) {
    mocks.push(setupVueQueryMock())
  }

  if (options.additional?.enableI18n) {
    mocks.push(setupI18nMock())
  }

  if (options.additional?.enableLucideIcons) {
    mocks.push(setupLucideIconsMock())
  }

  return mocks
}

// Vue Query Mock
export const setupVueQueryMock = () => {
  return vi.mock('@tanstack/vue-query', () => ({
    VueQueryPlugin: {
      install: vi.fn()
    },
    useQuery: vi.fn(() => ({
      data: { value: null },
      isLoading: { value: false },
      isError: { value: false },
      error: { value: null },
      refetch: vi.fn()
    })),
    useMutation: vi.fn(() => ({
      mutate: vi.fn(),
      isLoading: { value: false },
      isError: { value: false },
      error: { value: null }
    })),
    QueryClient: vi.fn(() => ({
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
      clear: vi.fn()
    }))
  }))
}

// i18n Mock
export const setupI18nMock = () => {
  return vi.mock('vue-i18n', () => ({
    useI18n: vi.fn(() => ({
      t: vi.fn((key: string) => {
        // 常用翻譯映射
        const translations: Record<string, string> = {
          'common.confirm': '確認',
          'common.cancel': '取消',
          'common.save': '儲存',
          'common.delete': '刪除',
          'common.edit': '編輯',
          'common.loading': '載入中...',
          'systemSetting.userList.pageTitle': '使用者管理',
          'role.admin': '管理員',
          'role.user': '一般使用者',
          'status.active': '啟用',
          'status.inactive': '停用'
        }
        return translations[key] || key
      }),
      locale: { value: 'zh-TW' },
      availableLocales: ['zh-TW', 'en-US']
    })),
    createI18n: vi.fn(() => ({
      global: {
        t: vi.fn((key: string) => key)
      }
    }))
  }))
}

// Lucide Icons Mock
export const setupLucideIconsMock = () => {
  return vi.mock('lucide-vue-next', () => ({
    Search: { template: '<div class="mock-icon search-icon"></div>' },
    Plus: { template: '<div class="mock-icon plus-icon"></div>' },
    Edit: { template: '<div class="mock-icon edit-icon"></div>' },
    Trash: { template: '<div class="mock-icon trash-icon"></div>' },
    Download: { template: '<div class="mock-icon download-icon"></div>' },
    Upload: { template: '<div class="mock-icon upload-icon"></div>' },
    ChevronDown: { template: '<div class="mock-icon chevron-down-icon"></div>' },
    ChevronUp: { template: '<div class="mock-icon chevron-up-icon"></div>' },
    ChevronLeft: { template: '<div class="mock-icon chevron-left-icon"></div>' },
    ChevronRight: { template: '<div class="mock-icon chevron-right-icon"></div>' },
    X: { template: '<div class="mock-icon x-icon"></div>' },
    Check: { template: '<div class="mock-icon check-icon"></div>' },
    AlertCircle: { template: '<div class="mock-icon alert-circle-icon"></div>' },
    Info: { template: '<div class="mock-icon info-icon"></div>' },
    Settings: { template: '<div class="mock-icon settings-icon"></div>' },
    User: { template: '<div class="mock-icon user-icon"></div>' },
    Users: { template: '<div class="mock-icon users-icon"></div>' },
    Bell: { template: '<div class="mock-icon bell-icon"></div>' },
    Home: { template: '<div class="mock-icon home-icon"></div>' },
    BarChart: { template: '<div class="mock-icon bar-chart-icon"></div>' },
    PieChart: { template: '<div class="mock-icon pie-chart-icon"></div>' },
    TrendingUp: { template: '<div class="mock-icon trending-up-icon"></div>' },
    TrendingDown: { template: '<div class="mock-icon trending-down-icon"></div>' }
  }))
}

// 常用測試場景預設
export const TEST_SCENARIOS = {
  // 基本頁面測試
  basicPage: (pageName?: keyof typeof COMMON_ROUTES) => setupUnifiedMocks({
    router: { currentRoute: pageName || 'dashboard' },
    additional: { enableI18n: true, enableLucideIcons: true }
  }),

  // 需要認證的頁面
  authenticatedPage: (pageName?: keyof typeof COMMON_ROUTES) => setupUnifiedMocks({
    router: { currentRoute: pageName || 'dashboard' },
    composables: { isAuthenticated: true, userPermissions: ['read', 'write', 'admin'] },
    additional: { enableI18n: true, enableLucideIcons: true }
  }),

  // 無認證頁面
  unauthenticatedPage: () => setupUnifiedMocks({
    router: { currentRoute: 'login' },
    composables: { isAuthenticated: false, userPermissions: [] },
    additional: { enableI18n: true }
  }),

  // 錯誤場景測試
  errorScenario: (pageName?: keyof typeof COMMON_ROUTES) => setupUnifiedMocks({
    router: { currentRoute: pageName || 'dashboard' },
    supabase: { shouldError: true },
    services: { shouldError: true },
    composables: { shouldError: true },
    additional: { enableI18n: true, enableLucideIcons: true }
  }),

  // 資料表格頁面
  dataTablePage: (pageName?: keyof typeof COMMON_ROUTES) => setupUnifiedMocks({
    router: { currentRoute: pageName || 'roleUsers' },
    composables: {
      isAuthenticated: true,
      userPermissions: ['read', 'write', 'admin', 'export']
    },
    additional: { enableVueQuery: true, enableI18n: true, enableLucideIcons: true }
  }),

  // 最小化 Mock (真實代碼測試)
  minimal: () => setupUnifiedMocks({
    router: { currentRoute: 'dashboard' },
    composables: false,
    services: false,
    additional: { enableI18n: true }
  })
} as const

// 匯出便捷函數
export {
  setupUnifiedMocks as mockAll,
  TEST_SCENARIOS as scenarios
}