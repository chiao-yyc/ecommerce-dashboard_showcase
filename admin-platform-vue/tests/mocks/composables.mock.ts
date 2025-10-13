/**
 * 統一 Composables Mock 工廠
 * 集中管理所有 Composables 相關的 Mock 配置
 */

import { vi } from 'vitest'
import { ref } from 'vue'
import { MOCK_DATA } from './services.mock'

// 基礎響應式狀態 Mock
export const createMockRef = <T>(initialValue: T) => {
  const reactiveRef = ref(initialValue)
  return {
    value: reactiveRef.value,
    // 提供修改方法供測試使用
    setValue: (newValue: T) => {
      reactiveRef.value = newValue
      return reactiveRef
    }
  }
}

// useAuth Mock
export const createMockUseAuth = (isAuthenticated = true) => ({
  user: createMockRef(isAuthenticated ? MOCK_DATA.users[0] : null),
  isAuthenticated: createMockRef(isAuthenticated),
  isLoading: createMockRef(false),
  login: vi.fn().mockResolvedValue({ success: true }),
  logout: vi.fn().mockResolvedValue({ success: true }),
  register: vi.fn().mockResolvedValue({ success: true }),
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
  changePassword: vi.fn().mockResolvedValue({ success: true })
})

// useUser Mock
export const createMockUseUser = (shouldError = false) => ({
  users: createMockRef(MOCK_DATA.users),
  loading: createMockRef(false),
  error: createMockRef(shouldError ? 'Mock error' : null),
  fetchUsersWithPagination: vi.fn().mockResolvedValue({
    success: !shouldError,
    data: shouldError ? null : MOCK_DATA.users,
    totalPages: shouldError ? 0 : 1,
    count: shouldError ? 0 : MOCK_DATA.users.length
  }),
  setUserRole: vi.fn().mockResolvedValue(!shouldError),
  removeUserRole: vi.fn().mockResolvedValue(!shouldError),
  createUser: vi.fn().mockResolvedValue(!shouldError),
  updateUser: vi.fn().mockResolvedValue(!shouldError),
  deleteUser: vi.fn().mockResolvedValue(!shouldError)
})

// useRole Mock
export const createMockUseRole = (shouldError = false) => ({
  roles: createMockRef(MOCK_DATA.roles),
  availableRoles: createMockRef(MOCK_DATA.roles),
  loading: createMockRef(false),
  loadingRoles: createMockRef(false),
  error: createMockRef(shouldError ? 'Mock error' : null),
  fetchAllRoles: vi.fn().mockResolvedValue(!shouldError),
  createRole: vi.fn().mockResolvedValue(!shouldError),
  updateRole: vi.fn().mockResolvedValue(!shouldError),
  deleteRole: vi.fn().mockResolvedValue(!shouldError)
})

// useNotification Mock
export const createMockUseNotification = (shouldError = false) => ({
  notifications: createMockRef(MOCK_DATA.notifications),
  unreadCount: createMockRef(2),
  loading: createMockRef(false),
  error: createMockRef(shouldError ? 'Mock error' : null),
  fetchNotifications: vi.fn().mockResolvedValue(!shouldError),
  markAsRead: vi.fn().mockResolvedValue(!shouldError),
  markAllAsRead: vi.fn().mockResolvedValue(!shouldError),
  deleteNotification: vi.fn().mockResolvedValue(!shouldError),
  createNotification: vi.fn().mockResolvedValue(!shouldError)
})

// useToast Mock
export const createMockUseToast = () => ({
  toast: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  dismiss: vi.fn(),
  toasts: createMockRef([])
})

// useXLSXExport Mock
export const createMockUseXLSXExport = () => ({
  exportUsers: vi.fn().mockResolvedValue({ success: true }),
  exportOrders: vi.fn().mockResolvedValue({ success: true }),
  exportCustomers: vi.fn().mockResolvedValue({ success: true }),
  exportProducts: vi.fn().mockResolvedValue({ success: true }),
  isExporting: createMockRef(false),
  exportProgress: createMockRef(0)
})

// useConfirmAction Mock
export const createMockUseConfirmAction = () => ({
  confirmDialogOpen: createMockRef(false),
  dialogConfig: createMockRef({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    variant: 'default' as const
  }),
  confirm: vi.fn().mockResolvedValue(true),
  cancel: vi.fn(),
  openConfirmDialog: vi.fn()
})

// usePermission Mock
export const createMockUsePermission = (userPermissions: string[] = ['read', 'write']) => ({
  permissions: createMockRef(userPermissions),
  loading: createMockRef(false),
  hasPermission: vi.fn().mockImplementation((permission: string) =>
    userPermissions.includes(permission)
  ),
  hasAnyPermission: vi.fn().mockImplementation((perms: string[]) =>
    perms.some(p => userPermissions.includes(p))
  ),
  hasAllPermissions: vi.fn().mockImplementation((perms: string[]) =>
    perms.every(p => userPermissions.includes(p))
  ),
  fetchUserPermissions: vi.fn().mockResolvedValue(userPermissions)
})

// Data Table Actions Mock
export const createMockUseDataTableActions = () => ({
  selectedIds: createMockRef([]),
  loading: createMockRef(false),
  confirmDialogOpen: createMockRef(false),
  dialogType: createMockRef(''),
  dialogTitle: createMockRef(''),
  dialogDescription: createMockRef(''),
  dialogCancelText: createMockRef('取消'),
  dialogConfirmText: createMockRef('確認'),
  handleViewDetail: vi.fn(),
  handleDeleteRow: vi.fn(),
  handleExportDetail: vi.fn(),
  handleBatchDelete: vi.fn(),
  handleBatchExport: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn()
})

// RoleUserActions Mock
export const createMockUseRoleUserActions = () => ({
  ...createMockUseDataTableActions(),
  showRoleDialog: createMockRef(false),
  selectedUserId: createMockRef(null),
  selectedRole: createMockRef([]),
  availableRoles: createMockRef(MOCK_DATA.roles),
  rolesLoading: createMockRef(false),
  openRoleDialog: vi.fn(),
  confirmChangeRole: vi.fn().mockResolvedValue(true),
  loadAllRoles: vi.fn().mockResolvedValue(true),
  isExporting: createMockRef(false)
})

// useChartState Mock
export const createMockUseChartState = () => ({
  loading: createMockRef(false),
  error: createMockRef(null),
  chartData: createMockRef(null),
  refreshChart: vi.fn(),
  setChartData: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn()
})

// useDashboardRefresh Mock
export const createMockUseDashboardRefresh = () => ({
  isRefreshing: createMockRef(false),
  lastRefresh: createMockRef(new Date()),
  refreshAll: vi.fn().mockResolvedValue(true),
  refreshSection: vi.fn().mockResolvedValue(true),
  autoRefresh: createMockRef(false),
  setAutoRefresh: vi.fn()
})

// Vue Query Related Mocks
export const createMockUseQuery = <T>(data: T, loading = false, error = null) => ({
  data: createMockRef(data),
  isLoading: createMockRef(loading),
  isError: createMockRef(!!error),
  error: createMockRef(error),
  isFetching: createMockRef(false),
  refetch: vi.fn().mockResolvedValue({ data }),
  query: {}
})

export const createMockUseRoleUsersQuery = () => ({
  users: createMockRef(MOCK_DATA.users),
  totalPages: createMockRef(1),
  totalCount: createMockRef(MOCK_DATA.users.length),
  isLoading: createMockRef(false),
  isError: createMockRef(false),
  error: createMockRef(null),
  isFetching: createMockRef(false),
  refetch: vi.fn(),
  query: {}
})

// 統一 Composables Mock 設定
export const setupComposablesMocks = (options: {
  shouldError?: boolean
  isAuthenticated?: boolean
  userPermissions?: string[]
} = {}) => {
  const { shouldError = false, isAuthenticated = true, userPermissions = ['read', 'write'] } = options

  const mocks = [
    vi.mock('@/composables/useAuth', () => ({
      useAuth: vi.fn(() => createMockUseAuth(isAuthenticated))
    })),
    vi.mock('@/composables/useUser', () => ({
      ...createMockUseUser(shouldError)
    })),
    vi.mock('@/composables/useRole', () => ({
      useRole: vi.fn(() => createMockUseRole(shouldError))
    })),
    vi.mock('@/composables/useNotification', () => ({
      useNotification: vi.fn(() => createMockUseNotification(shouldError))
    })),
    vi.mock('@/composables/useToast', () => ({
      useToast: vi.fn(() => createMockUseToast())
    })),
    vi.mock('@/composables/useXLSXExport', () => ({
      useXLSXExport: vi.fn(() => createMockUseXLSXExport())
    })),
    vi.mock('@/composables/usePermission', () => ({
      usePermission: vi.fn(() => createMockUsePermission(userPermissions))
    })),
    vi.mock('@/composables/data-table-actions/useRoleUserActions', () => ({
      useRoleUserActions: vi.fn(() => createMockUseRoleUserActions())
    })),
    vi.mock('@/composables/queries/useRoleUsersQuery', () => ({
      useRoleUsersQuery: vi.fn(() => createMockUseRoleUsersQuery())
    }))
  ]

  return mocks
}

// 匯出便捷函數
export {
  setupComposablesMocks as mockComposables,
  createMockRef as mockRef,
  createMockUseAuth as mockUseAuth,
  createMockUseUser as mockUseUser,
  createMockUseRole as mockUseRole,
  createMockUseNotification as mockUseNotification,
  createMockUseRoleUserActions as mockRoleUserActions
}