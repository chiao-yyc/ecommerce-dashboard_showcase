/**
 * 統一的 Mock 策略系統
 * 平衡重用性與簡潔性，避免過度複雜化
 * 
 * 設計原則：
 * 1. 最常用的 Mock 提供預設實現，減少重複
 * 2. 保持每個 Mock 的簡潔性，避免過度配置
 * 3. 提供靈活的覆寫機制，滿足特殊需求
 * 4. 分類管理，避免巨大的單一檔案
 */

import { vi, type MockedFunction } from 'vitest'
import { ref, computed } from 'vue'

// =====================================================
// UI 組件標準 Mock (最常重複的)
// =====================================================

/**
 * 標準化 UI 組件 Mock
 * 使用簡潔的模板，避免複雜的 Props 處理
 */
export const createStandardUIMocks = () => ({
  // 基礎 UI 組件 - 最常用的
  '@/components/ui/button': {
    Button: { 
      name: 'Button', 
      template: '<button><slot /></button>' 
    },
  },
  
  '@/components/ui/badge': {
    Badge: { 
      name: 'Badge', 
      template: '<span><slot /></span>' 
    },
  },
  
  '@/components/ui/skeleton': {
    Skeleton: {
      name: 'Skeleton',
      template: '<div data-testid="skeleton"></div>',
    },
  },
  
  // Dropdown 組件系列 - 第二常用
  '@/components/ui/dropdown-menu': {
    DropdownMenu: { 
      name: 'DropdownMenu', 
      template: '<div data-testid="dropdown-menu"><slot /></div>' 
    },
    DropdownMenuContent: { 
      name: 'DropdownMenuContent', 
      template: '<div data-testid="dropdown-content"><slot /></div>' 
    },
    DropdownMenuTrigger: { 
      name: 'DropdownMenuTrigger', 
      template: '<div data-testid="dropdown-trigger"><slot /></div>' 
    },
    DropdownMenuItem: {
      name: 'DropdownMenuItem',
      template: '<div data-testid="dropdown-item"><slot /></div>'
    },
  },
  
  // 其他常用組件
  '@/components/ui/card': {
    Card: { name: 'Card', template: '<div><slot /></div>' },
    CardContent: { name: 'CardContent', template: '<div><slot /></div>' },
    CardHeader: { name: 'CardHeader', template: '<div><slot /></div>' },
    CardTitle: { name: 'CardTitle', template: '<div><slot /></div>' },
  },
  
  '@/components/ui/scroll-area': {
    ScrollArea: { 
      name: 'ScrollArea', 
      template: '<div data-testid="scroll-area"><slot /></div>' 
    },
  },
  
  '@/components/ui/separator': {
    Separator: { name: 'Separator', template: '<div></div>' },
  },
})

/**
 * 標準 UI Mock 設定 - 需要在測試檔案頂層調用
 * 由於 vi.mock 需要在頂層調用，我們提供具體的 Mock 設定
 */

// 基礎 UI 組件 Mock
vi.mock('@/components/ui/button', () => ({
  Button: { 
    name: 'Button', 
    template: '<button><slot /></button>' 
  },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: { 
    name: 'Badge', 
    template: '<span><slot /></span>' 
  },
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: {
    name: 'Skeleton',
    template: '<div data-testid="skeleton"></div>',
  },
}))

// Dropdown 組件系列
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: { 
    name: 'DropdownMenu', 
    template: '<div data-testid="dropdown-menu"><slot /></div>' 
  },
  DropdownMenuContent: { 
    name: 'DropdownMenuContent', 
    template: '<div data-testid="dropdown-content"><slot /></div>' 
  },
  DropdownMenuTrigger: { 
    name: 'DropdownMenuTrigger', 
    template: '<div data-testid="dropdown-trigger"><slot /></div>' 
  },
  DropdownMenuItem: {
    name: 'DropdownMenuItem',
    template: '<div data-testid="dropdown-item"><slot /></div>'
  },
}))

// Card 組件系列
vi.mock('@/components/ui/card', () => ({
  Card: { name: 'Card', template: '<div><slot /></div>' },
  CardContent: { name: 'CardContent', template: '<div><slot /></div>' },
  CardHeader: { name: 'CardHeader', template: '<div><slot /></div>' },
  CardTitle: { name: 'CardTitle', template: '<div><slot /></div>' },
}))

// Scroll Area
vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: { 
    name: 'ScrollArea', 
    template: '<div data-testid="scroll-area"><slot /></div>' 
  },
}))

// Separator
vi.mock('@/components/ui/separator', () => ({
  Separator: { name: 'Separator', template: '<div></div>' },
}))

/**
 * 確認標準 UI Mock 已套用
 * 這個函數現在只是確認，不執行實際 Mock
 */
export function applyStandardUIMocks() {
  // Mock 已在檔案頂層套用
  return true
}

// =====================================================
// Vue Router 標準 Mock
// =====================================================

/**
 * Vue Router 標準 Mock - 最常使用
 * 提供最常需要的方法，避免複雜配置
 */
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: { value: { path: '/', params: {}, query: {} } },
  }),
  useRoute: () => ({
    path: '/',
    params: {},
    query: {},
    matched: [],
  }),
}))

export function createStandardRouterMock() {
  // Mock 已在檔案頂層套用
  return true
}

// =====================================================
// Utility Functions 標準 Mock
// =====================================================

/**
 * 工具函數標準 Mock
 */
// @/utils 路徑 Mock
vi.mock('@/utils', () => ({
  formatRelativeTime: vi.fn().mockReturnValue('5 分鐘前'),
  convertToISOString: vi.fn().mockReturnValue('2024-01-01T00:00:00Z'),
  formatCurrency: vi.fn().mockReturnValue('$100.00'),
  formatDate: vi.fn().mockReturnValue('2024-01-01'),
}))

// @/lib/utils 路徑 Mock
vi.mock('@/lib/utils', () => ({
  formatRelativeTime: vi.fn().mockReturnValue('5 分鐘前'),
  cn: vi.fn().mockImplementation((...args: any[]) => args.filter(Boolean).join(' ')),
}))

export function createStandardUtilsMocks() {
  // Mock 已在檔案頂層套用
  return true
}

// =====================================================
// Composable 標準 Mock (最複雜但最重要的)
// =====================================================

/**
 * useNotification 標準 Mock
 * 這是最常用的 Composable，提供完整但簡潔的實現
 */
const defaultNotificationMock = {
  notifications: ref([]),
  suggestions: ref([]),
  suggestedNotifications: ref([]), // 別名支援
  stats: ref({ unreadCount: 0 }),
  loading: ref(false),
  error: ref(''),
  
  // 核心方法
  fetchNotifications: vi.fn().mockResolvedValue({ success: true, data: [] }),
  fetchStats: vi.fn().mockResolvedValue({ success: true, data: { unreadCount: 0 } }),
  markAsRead: vi.fn().mockResolvedValue({ success: true }),
  markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
  
  // Realtime 相關
  subscribeToNotifications: vi.fn(),
  unsubscribeFromNotifications: vi.fn(),
  isRealtimeConnected: ref(true),
  realtimeError: ref(null),
  
  // 載入方法 (向後兼容)
  loadNotifications: vi.fn(),
  loadStats: vi.fn(),
}

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => defaultNotificationMock,
}))

export function createStandardNotificationMock(overrides: any = {}) {
  // 合併覆寫設定
  Object.assign(defaultNotificationMock, overrides)
  return defaultNotificationMock
}

/**
 * 其他常用 Composable Mock
 */
// useAuth Mock
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref(null),
    session: ref(null),
    loading: ref(false),
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
  }),
}))

export function createStandardComposableMocks() {
  // Mock 已在檔案頂層套用
  return true
}

// =====================================================
// Icon 系統 Mock (從 setup.ts 優化而來)
// =====================================================

/**
 * Lucide Icons 標準 Mock
 * 使用 setup.ts 中的全域 Mock，這裡不重複定義
 */
export function createStandardIconMocks() {
  // Icons Mock 已在 setup.ts 中全域套用，包含所有常用圖標
  // 不需要在這裡重複定義，避免衝突
  return true
}

// =====================================================
// 通知相關專用 Mock (領域特化)
// =====================================================

/**
 * 通知配置 Mock
 * 專門用於通知系統測試
 */
vi.mock('../notifyConfig', () => ({
  getNotificationIcon: vi.fn().mockReturnValue('Bell'),
  getPriorityIconClass: vi.fn().mockReturnValue('text-blue-500'),
  getPriorityBadgeClass: vi.fn().mockReturnValue('bg-blue-500'),
  priorityText: { 
    urgent: '緊急', 
    high: '高', 
    medium: '中', 
    low: '低' 
  },
  categoryClasses: { 
    actionable: 'bg-blue-100 text-blue-800' 
  },
  categoryText: { 
    actionable: '可操作' 
  },
}))

export function createStandardNotifyConfigMocks() {
  // Mock 已在檔案頂層套用
  return true
}

// =====================================================
// 組合式 Mock 應用函數
// =====================================================

/**
 * 應用基礎 Mock 套件
 * 適用於大多數組件測試
 */
export function applyBasicMockSuite() {
  applyStandardUIMocks()
  createStandardRouterMock()
  createStandardUtilsMocks()
  createStandardIconMocks()
}

/**
 * 應用通知系統 Mock 套件
 * 專門用於通知相關組件測試
 */
export function applyNotificationMockSuite(notificationOverrides: any = {}) {
  applyBasicMockSuite()
  createStandardNotificationMock(notificationOverrides)
  createStandardNotifyConfigMocks()
}

/**
 * 應用完整 Mock 套件
 * 適用於複雜的整合測試
 */
export function applyFullMockSuite(overrides: {
  notification?: any
  auth?: any
  [key: string]: any
} = {}) {
  applyBasicMockSuite()
  createStandardNotificationMock(overrides.notification)
  createStandardComposableMocks()
  createStandardNotifyConfigMocks()
}

// =====================================================
// Mock 清理工具
// =====================================================

/**
 * 清理所有標準 Mock
 * 在測試結束後使用
 */
export function cleanupStandardMocks() {
  vi.clearAllMocks()
  vi.resetAllMocks()
}

/**
 * 僅重置 Mock 調用記錄，保持 Mock 實現
 * 在測試之間使用
 */
export function resetStandardMockCalls() {
  vi.clearAllMocks()
}

// =====================================================
// 測試輔助類型定義
// =====================================================

export interface MockSuiteOptions {
  includeUI?: boolean
  includeRouter?: boolean
  includeUtils?: boolean
  includeIcons?: boolean
  includeNotification?: boolean
  includeAuth?: boolean
  notificationOverrides?: any
  authOverrides?: any
}

/**
 * 靈活的 Mock 套件應用器
 * 允許精細控制需要的 Mock 組件
 */
export function applyCustomMockSuite(options: MockSuiteOptions = {}) {
  const {
    includeUI = true,
    includeRouter = true,
    includeUtils = true,
    includeIcons = true,
    includeNotification = false,
    includeAuth = false,
    notificationOverrides = {},
    authOverrides = {},
  } = options
  
  if (includeUI) applyStandardUIMocks()
  if (includeRouter) createStandardRouterMock()
  if (includeUtils) createStandardUtilsMocks()
  if (includeIcons) createStandardIconMocks()
  if (includeNotification) createStandardNotificationMock(notificationOverrides)
  if (includeAuth) createStandardComposableMocks()
}

// =====================================================
// 使用範例和文檔
// =====================================================

/**
 * 使用範例：
 * 
 * // 基礎組件測試
 * import { applyBasicMockSuite } from '@/tests/utils/standardMocks'
 * applyBasicMockSuite()
 * 
 * // 通知系統測試
 * import { applyNotificationMockSuite } from '@/tests/utils/standardMocks'
 * applyNotificationMockSuite({
 *   stats: ref({ unreadCount: 5 })
 * })
 * 
 * // 自定義測試
 * import { applyCustomMockSuite } from '@/tests/utils/standardMocks'
 * applyCustomMockSuite({
 *   includeNotification: true,
 *   includeAuth: true,
 *   notificationOverrides: { loading: ref(true) }
 * })
 */