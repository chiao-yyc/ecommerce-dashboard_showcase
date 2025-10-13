import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mapSupabaseUser, useAuth } from '@/composables/useAuth'
import type {
  User as SupabaseUser,
  Session as _SupabaseSession,
  SupabaseClient,
} from '@supabase/supabase-js'
import type { User } from '@/types'
import * as useUserModule from '@/composables/useUser'

// 使用新的標準化測試工具
import { 
  createTestUUID,
  generateUserTestData,
  getGlobalMockSupabase,
  configureGlobalMockSuccess,
  configureGlobalMockError,
  resetGlobalMocks,
  CommonErrors
} from '../../utils/testSupport'

// 避免 Vue 生命週期鉤子警告
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
    onBeforeUnmount: vi.fn(),
  }
})

// 全域 Mock 已在 setup.ts 中配置，不需要重複設定

// Mock useUser composable
vi.mock('@/composables/useUser', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/composables/useUser')>()
  return {
    ...mod,
    updateUser: vi.fn(), // Mock the updateUser function
    getUser: vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'user123',
        email: 'test@example.com',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '',
      },
    }),
    getUserIdByAuthId: vi.fn(),
  }
})

describe('mapSupabaseUser', () => {
  it('正確映射 Supabase 使用者到內部使用者格式', () => {
    const supabaseUser: SupabaseUser = {
      id: createTestUUID(),
      aud: 'authenticated',
      role: '',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      },
      app_metadata: {
        roles: ['admin'],
      },
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapSupabaseUser(supabaseUser)

    expect(result).toEqual({
      id: supabaseUser.id,
      email: 'test@example.com',
      fullName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })
  
  it('處理缺失的使用者資料', () => {
    const supabaseUser: SupabaseUser = {
      id: createTestUUID(),
      aud: 'authenticated',
      role: '',
      email: 'test@example.com',
      user_metadata: {},
      app_metadata: {},
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    const result = mapSupabaseUser(supabaseUser)

    expect(result).toEqual({
      id: supabaseUser.id,
      email: 'test@example.com',
      fullName: '',
      avatarUrl: undefined,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    })
  })
})

describe('useAuth', () => {
  let testData: ReturnType<typeof generateUserTestData>

  beforeEach(async () => {
    resetGlobalMocks()
    
    // 準備標準測試資料
    testData = generateUserTestData()
    
    // 清理 useUser mock
    vi.mocked(useUserModule.updateUser).mockClear()
    vi.mocked(useUserModule.getUser).mockClear()
    
    // 設定 useUser mock 的預設成功回應
    vi.mocked(useUserModule.updateUser).mockResolvedValue({
      success: true,
      data: testData.singleUser,
      error: null
    })
    
    vi.mocked(useUserModule.getUser).mockResolvedValue({
      success: true,
      data: testData.singleUser,
      error: null
    })
  })

  it('更新使用者個人資料', async () => {
    const mockSupabase = getGlobalMockSupabase()
    
    // 設定成功的 functions.invoke 回應
    configureGlobalMockSuccess({ success: true })
    
    const auth = useAuth(mockSupabase as unknown as SupabaseClient)
    auth.user.value = testData.singleUser

    const updatedData = {
      fullName: 'Updated User',
      phone: '1234567890',
    }

    const result = await auth.updateProfile(updatedData)

    expect(result.success).toBe(true)
    // 驗證 syncUserRecord 函數被正確調用
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'sync-user-record', 
      expect.objectContaining({
        body: {
          full_name: 'Updated User',
          phone: '1234567890'
        }
      })
    )
  })

  it('處理更新個人資料錯誤', async () => {
    const mockSupabase = getGlobalMockSupabase()
    
    // 設定 functions.invoke 錯誤回應
    configureGlobalMockError('Failed to update profile', 'UPDATE_ERROR')
    
    const auth = useAuth(mockSupabase as unknown as SupabaseClient)
    auth.user.value = testData.singleUser

    const updatedData = {
      fullName: 'Updated User',
    }

    const result = await auth.updateProfile(updatedData)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Failed to update profile')
  })

  it('處理用戶為空時的更新請求', async () => {
    const mockSupabase = getGlobalMockSupabase()
    const auth = useAuth(mockSupabase as unknown as SupabaseClient)
    auth.user.value = null // 確保用戶為空

    const result = await auth.updateProfile({ fullName: 'New Name' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('找不到使用者，請重新登入')
  })

  it('成功發送忘記密碼信件', async () => {
    const mockSupabase = getGlobalMockSupabase()

    // 設定成功的 auth.resetPasswordForEmail 回應
    configureGlobalMockSuccess({ success: true })

    const auth = useAuth(mockSupabase as unknown as SupabaseClient)
    const testEmail = 'test@example.com'

    const result = await auth.resetPasswordForEmail(testEmail)

    expect(result.success).toBe(true)
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      testEmail,
      expect.objectContaining({
        redirectTo: expect.stringContaining('/auth/reset-password')
      })
    )
  })

  it('處理忘記密碼信件發送錯誤', async () => {
    const mockSupabase = getGlobalMockSupabase()

    // 設定錯誤回應
    configureGlobalMockError('Invalid email address', 'INVALID_EMAIL')

    const auth = useAuth(mockSupabase as unknown as SupabaseClient)

    const result = await auth.resetPasswordForEmail('invalid-email')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid email address')
  })
})
