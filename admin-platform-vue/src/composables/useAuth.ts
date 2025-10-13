import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import type {
  AuthUser,
  DbUser,
  User,
  AuthResponse,
  OAuthResponse,
  Session,
  ApiResponse,
} from '@/types'
import type {
  User as SupabaseUser,
  Session as SBSession,
  AuthResponse as SBAuthResponse,
  OAuthResponse as SBOAuthResponse,
} from '@supabase/supabase-js'
import { config } from '@/config'
import { updateUser as _updateUser, getUser } from '@/composables/useUser'
import { createModuleLogger } from '@/utils/logger'
// import { systemToastHelper } from '@/plugins/toast'

const log = createModuleLogger('Composable', 'Auth')

// 優化：添加快取機制避免重複請求
const userCache = new Map<string, { user: User; timestamp: number }>()
// const userRecordCache = new Map<string, { user: User; timestamp: number }>() // 未使用
const CACHE_DURATION = 5 * 60 * 1000 // 5分鐘快取

// get user id by auth id (添加快取)
export async function getUserIdByAuthId(
  authId: string,
  supabaseImpl = supabase,
): Promise<string | null> {
  try {
    const cached = userCache.get(`authId:${authId}`)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.user.id
    }

    const { data, error } = await supabaseImpl
      .from('users')
      .select('*')
      .eq('auth_user_id', authId)

    if (error) {
      log.error('getUserIdByAuthId 錯誤', error)
      return null
    }

    const userId = data?.[0]?.id || null

    // 快取結果
    if (userId && data?.[0]) {
      userCache.set(`authId:${authId}`, {
        user: data[0],
        timestamp: Date.now(),
      })
    }

    return userId
  } catch (error) {
    log.error('getUserIdByAuthId 例外', error)
    return null
  }
}

// 智能同步檢查函數
function needsSync(authUser: AuthUser | null, user: User | null): boolean {
  if (!authUser || !user) return true

  // 檢查關鍵欄位是否不一致
  if (user.email !== authUser.email) return true
  if (user.fullName !== authUser.userMetadata?.fullName) return true
  if (user.avatarUrl !== authUser.userMetadata?.avatarUrl) return true

  return false
}

// 智能同步用戶記錄
async function syncUserRecord(
  profile: Record<string, any> = {},
  supabaseImpl = supabase,
): Promise<ApiResponse> {
  try {
    const { data, error: funcError } = await supabaseImpl.functions.invoke(
      'sync-user-record',
      { body: profile },
    )
    if (funcError) {
      log.error('Supabase function error', funcError)
      return {
        success: false,
        error: funcError.message || 'Supabase function error',
      }
    }
    return { success: true, data }
  } catch (e) {
    log.error('Exception in syncUserRecord', e)
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error: errorMessage }
  }
}

// 帶重試機制的同步函數
async function syncUserRecordWithRetry(
  profile: Record<string, any> = {},
  supabaseImpl = supabase,
  maxRetries = 3,
): Promise<ApiResponse> {
  let lastError: string | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await syncUserRecord(profile, supabaseImpl)
      if (result.success) {
        return result
      }
      lastError =
        typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Unknown error'

      // 指數退避
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Unknown error'
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  return { success: false, error: lastError || 'Sync failed after retries' }
}

// 其他函數保持不變...
async function resetPasswordForEmail(
  email: string,
  supabaseImpl = supabase,
): Promise<ApiResponse> {
  try {
    // 使用 config 中的 resetPasswordUrl，fallback 優先使用 SITE_URL 以確保與 Supabase 配置一致
    const redirectUrl = config.auth.resetPasswordUrl ||
      `${import.meta.env.SITE_URL || import.meta.env.VITE_BASE_URL || window.location.origin}/reset-password`
    log.debug('發送重設密碼郵件', {
      email,
      redirectTo: redirectUrl,
    })

    const { data, error: err } = await supabaseImpl.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: redirectUrl,
      },
    )
    if (err) {
      log.error('重設密碼失敗', err)
      return { success: false, error: err.message }
    }
    log.info('重設密碼成功', data)
    return { success: true, data: data || null }
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : 'Unknown error during password reset'
    log.error('重設密碼例外', e)
    return { success: false, error: errorMessage }
  }
}

async function updatePassword(
  newPassword: string,
  currentPassword?: string,
  userEmail?: string,
  supabaseImpl = supabase,
): Promise<ApiResponse> {
  try {
    // 如果提供了目前密碼和 email，進行驗證
    if (currentPassword && userEmail) {
      log.debug('驗證目前密碼')

      // 第一步：用目前密碼驗證身份
      const { error: verifyError } = await supabaseImpl.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword
      })

      if (verifyError) {
        log.error('目前密碼驗證失敗', verifyError)
        return { success: false, error: '目前密碼錯誤' }
      }

      log.debug('目前密碼驗證成功')
    }

    // 第二步：更新密碼
    log.debug('更新密碼')
    const { data, error: err } = await supabaseImpl.auth.updateUser({
      password: newPassword,
    })

    if (err) {
      log.error('密碼更新失敗', err)
      return { success: false, error: err.message }
    }

    // 第三步：同步用戶記錄以更新前端狀態（包括 updated_at）
    try {
      await syncUserRecord({}, supabaseImpl)
      log.info('密碼更新成功，用戶數據已同步')
    } catch (syncError) {
      log.warn('密碼更新成功，但數據同步失敗', syncError)
      // 密碼更新成功，同步失敗不影響主要操作結果
    }

    return { success: true, data: data || null }
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : 'Unknown error during password update'
    log.error('密碼更新異常', e)
    return { success: false, error: errorMessage }
  }
}

function handleSessionUserToAuthUser(
  sessionUser: SupabaseUser | null,
): AuthUser | null {
  if (!sessionUser) return null
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    lastSignInAt: sessionUser.last_sign_in_at ?? '',
    userMetadata: {
      avatarUrl: sessionUser.user_metadata?.avatar_url ?? '',
      email: sessionUser.user_metadata?.email ?? '',
      fullName: sessionUser.user_metadata?.full_name ?? '',
      name: sessionUser.user_metadata?.name ?? '',
    },
  }
}

async function getRandomAvatarUrl(supabaseImpl = supabase): Promise<string> {
  const data = await supabaseImpl.rpc('get_random_avatar_path')
  if (data.error) {
    log.error('獲取隨機avatar失敗', data.error)
    return ''
  }
  return data.data || ''
}

// 優化後的 useAuth
export function useAuth(
  supabaseImpl = supabase,
  getUserImpl = (userId: string) => getUser(userId),
  syncUserRecordImpl = (profile: Record<string, any> = {}) =>
    syncUserRecord(profile, supabaseImpl),
  updatePasswordImpl = (password: string, currentPassword?: string, userEmail?: string) =>
    updatePassword(password, currentPassword, userEmail, supabaseImpl),
  resetPasswordForEmailImpl = (email: string) =>
    resetPasswordForEmail(email, supabaseImpl),
) {
  const authUser = ref<AuthUser | null>(null)
  const user = ref<User | null>(null)
  const loading = ref(true)
  const errorLocal = ref<string | null>(null)
  const syncInProgress = ref(false)

  // 條件性注入 toast 系統 - 避免在非組件上下文中使用 inject
  // const _toast = getCurrentInstance()
  //   ? inject<ToastType>('toast', systemToastHelper)
  //   : systemToastHelper

  // 同步狀態管理
  // const _syncStatus = ref<{
  //   status: 'idle' | 'syncing' | 'success' | 'error'
  //   error?: string
  //   lastSyncTime?: number
  //   retryCount: number
  // }>({
  //   status: 'idle',
  //   retryCount: 0,
  // })

  let authListener: { subscription: { unsubscribe: () => void } } | null = null

  // 優化：簡化和加速用戶資料處理
  async function handleUserSessionData(
    sessionUser: SupabaseUser | null,
    getUserIdByAuthIdImpl: (authId: string) => Promise<string | null>,
    getUserImpl: (userId: string) => Promise<ApiResponse<User | null>>,
  ): Promise<{ user: User | null; authUser: AuthUser | null }> {
    if (!sessionUser?.id) return { user: null, authUser: null }

    const authUserData = handleSessionUserToAuthUser(sessionUser)

    try {
      // 並行執行，加速載入
      const userId = await getUserIdByAuthIdImpl(sessionUser.id)
      if (!userId) {
        return { user: null, authUser: authUserData }
      }

      const { data } = await getUserImpl(userId)
      return { user: data ?? null, authUser: authUserData }
    } catch (error) {
      log.error('處理用戶資料時出錯', error)
      return { user: null, authUser: authUserData }
    }
  }

  async function getJWT() {
    const { data: _data } = await supabaseImpl.auth.getSession()
    // JWT debugging info available if needed
  }

  // 新增：檢查並刷新 session 的函數
  async function checkAndRefreshSession(): Promise<boolean> {
    try {
      const { data, error } = await supabaseImpl.auth.getSession()

      if (error) {
        log.error('檢查 session 時出錯', error)
        return false
      }

      if (!data?.session) {
        log.debug('沒有有效的 session')
        return false
      }

      // 檢查 session 是否即將過期（在過期前 5 分鐘）
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = data.session.expires_at || 0
      const timeUntilExpiry = expiresAt - now

      if (timeUntilExpiry <= 300) {
        // 5分鐘內過期
        log.debug('Session 即將過期，嘗試刷新')
        const refreshResult = await supabaseImpl.auth.refreshSession()

        if (refreshResult.error) {
          log.error('刷新 session 失敗', refreshResult.error)
          return false
        }

        log.info('Session 刷新成功')
        return true
      }

      return true
    } catch (e) {
      log.error('檢查 session 時發生異常', e)
      return false
    }
  }

  // 優化：初始化認證狀態
  async function initAuthState(): Promise<User | null> {
    loading.value = true
    try {
      // 使用 checkAndRefreshSession 來檢查和刷新 session
      const sessionValid = await checkAndRefreshSession()

      if (!sessionValid) {
        // Session 無效，清除狀態
        user.value = null
        authUser.value = null
        userCache.clear()
        return null
      }

      // Session 有效，獲取當前 session 資料
      const { data } = await supabaseImpl.auth.getSession()

      if (data?.session) {
        const { user: userValue, authUser: authUserValue } =
          await handleUserSessionData(
            data.session.user,
            getUserIdByAuthId,
            getUser,
          )

        user.value = userValue
        authUser.value = authUserValue
      } else {
        // 沒有 session，清除狀態
        user.value = null
        authUser.value = null
        userCache.clear()
      }
    } catch (e) {
      log.error('初始化認證狀態時出錯', e)
      // 清除可能的無效狀態
      user.value = null
      authUser.value = null
      userCache.clear()
    } finally {
      loading.value = false
    }
    return user.value
  }

  // 優化：認證監聽器
  async function setupAuthListener(): Promise<() => void> {
    // 如果已經有監聽器，返回取消訂閱函數
    if (authListener) {
      log.debug('認證監聽器已存在，跳過重複設置')
      return () => authListener?.subscription.unsubscribe()
    }

    // 初始狀態檢查 - 在新分頁中可能需要
    if (!user.value || !authUser.value) {
      try {
        const { data: userData } = await supabaseImpl.auth.getUser()
        if (userData?.user) {
          log.debug('初始化用戶資料（從監聽器設置）')
          const result = await handleUserSessionData(
            userData.user,
            getUserIdByAuthId,
            getUser,
          )
          user.value = result.user
          authUser.value = result.authUser
        }
      } catch (error) {
        log.error('設置認證監聽器時初始化用戶失敗', error)
      }
    }

    // 防止重複操作的鎖，添加超時保護
    let isProcessing = false
    let processingTimeout: number | null = null

    const { data } = supabaseImpl.auth.onAuthStateChange(
      async (event, session) => {
        // 清除之前的超時器
        if (processingTimeout) {
          clearTimeout(processingTimeout)
          processingTimeout = null
        }

        // 防止重複處理
        if (isProcessing) {
          return
        }

        isProcessing = true

        // 設置超時保護，3秒後強制釋放鎖
        processingTimeout = setTimeout(() => {
          log.warn('認證處理超時，強制釋放鎖', { event })
          isProcessing = false
          loading.value = false
          processingTimeout = null
        }, 3000) as unknown as number

        try {
          if (event === 'SIGNED_OUT') {
            // 立即清除狀態，不等待
            user.value = null
            authUser.value = null
            errorLocal.value = null
          }

          if (
            (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
            session?.user
          ) {
            // 快速路徑：如果用戶已經載入且匹配，跳過處理
            if (
              user.value &&
              authUser.value &&
              authUser.value.id === session.user.id
            ) {
              return
            }

            // 只在必要時設置loading
            if (!user.value) {
              loading.value = true
            }

            // 先更新用戶資料，確保 UI 可以立即反應
            const result = await handleUserSessionData(
              session.user,
              getUserIdByAuthId,
              getUser,
            )

            user.value = result.user
            authUser.value = result.authUser

            // 背景同步（不阻塞主流程）
            if (!syncInProgress.value) {
              syncInProgress.value = true

              // 使用 Promise 但不等待，避免阻塞
              Promise.resolve().then(async () => {
                try {
                  const sessionAuthUser = handleSessionUserToAuthUser(
                    session.user,
                  )
                  const currentUserId = await getUserIdByAuthId(session.user.id)
                  let currentUser = null

                  if (currentUserId) {
                    const { data } = await getUserImpl(currentUserId)
                    currentUser = data
                  }

                  const shouldSync = currentUser
                    ? needsSync(sessionAuthUser, currentUser)
                    : true

                  if (shouldSync) {
                    const syncResult = await syncUserRecordWithRetry({})

                    if (!syncResult.success) {
                      log.error('背景同步失敗', syncResult.error)
                    }
                  }
                } catch (error) {
                  log.error('背景同步時發生錯誤', error)
                } finally {
                  syncInProgress.value = false
                }
              })
            }
          }
        } catch (error) {
          log.error('處理認證狀態變更時出錯', error)
          errorLocal.value = '認證狀態更新失敗'
        } finally {
          // 清理超時器和鎖
          if (processingTimeout) {
            clearTimeout(processingTimeout)
            processingTimeout = null
          }
          loading.value = false
          isProcessing = false
        }
      },
    )

    authListener = data
    return () => {
      authListener?.subscription.unsubscribe()
      authListener = null
    }
  }

  async function signUpWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    loading.value = true
    errorLocal.value = null

    try {
      const { data, error: err }: SBAuthResponse =
        await supabaseImpl.auth.signUp({
          email,
          password,
          options: {
            data: {
              custom: {
                avatar_url: await getRandomAvatarUrl(supabaseImpl),
              },
            },
          },
        })

      if (err) {
        errorLocal.value = err.message
        return { success: false, session: null, error: err }
      }
      // await supabase.functions.invoke('create-admin-user', {
      //   body: {
      //     auth_user_id: data.user.id,
      //   },
      // })
      const mappedSession = mapSBSession(data.session as SBSession)
      return { success: true, session: mappedSession }
    } finally {
      loading.value = false
    }
  }

  // Email 登入
  async function signInWithEmail(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    loading.value = true
    errorLocal.value = null

    try {
      const { data, error: err }: SBAuthResponse =
        await supabaseImpl.auth.signInWithPassword({
          email,
          password,
        })

      if (err) {
        errorLocal.value = err.message
        return { success: false, session: null, error: err }
      }

      // 立即更新用戶狀態，不等待監聽器
      if (data.session?.user) {
        log.debug('登入成功，立即更新用戶狀態')
        try {
          const result = await handleUserSessionData(
            data.session.user,
            getUserIdByAuthId,
            getUserImpl,
          )
          user.value = result.user
          authUser.value = result.authUser
        } catch (error) {
          log.error('立即更新用戶狀態失敗', error)
          // 不阻止登入流程，讓監聽器作為備援
        }
      }

      const mappedSession = mapSBSession(data.session as SBSession)
      return { success: true, session: mappedSession }
    } finally {
      loading.value = false
    }
  }

  async function signInWithProvider(
    provider: 'google' | 'github',
    redirectPath?: string,
  ): Promise<OAuthResponse> {
    loading.value = true
    errorLocal.value = null

    try {
      const callbackUrl = config.auth.callbackUrl
      const finalRedirectTo = redirectPath
        ? `${callbackUrl}?redirect=${encodeURIComponent(redirectPath)}`
        : callbackUrl

      const { data, error: err }: SBOAuthResponse =
        await supabaseImpl.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: finalRedirectTo,
          },
        })

      loading.value = false

      if (err) {
        errorLocal.value = err.message
        return { provider, url: null, error: err }
        // await supabase.functions.invoke('create-admin-user', {
        //   body: {
        //     auth_user_id: data.user.id,
        //   },
        // })
      }
      return { provider, url: data.url, error: null }
    } finally {
      loading.value = false
    }
  }

  // 優化：登出函數
  async function signOut(): Promise<ApiResponse> {
    try {
      // 立即清除本地狀態，提供即時回饋
      user.value = null
      authUser.value = null
      errorLocal.value = null
      loading.value = false
      userCache.clear() // 清除快取

      // 在背景執行實際登出
      const { error: err } = await supabaseImpl.auth.signOut()

      if (err) {
        log.error('登出時發生錯誤', err)
        // 不恢復狀態，因為用戶已經被重導向
        return { success: false, error: err.message }
      }

      return { success: true, data: null }
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'Unknown error during sign out'
      log.error('登出異常', e)
      return { success: false, error: errorMessage }
    }
  }

  async function updateProfile(userData: Partial<User>): Promise<ApiResponse> {
    try {
      if (!user.value?.id) {
        return { success: false, error: '找不到使用者，請重新登入' }
      }

      loading.value = true

      // TODO: 加入篩選條件變數 const allowUpdateFields = ['phone', 'full_name', 'avatar_url']
      const updates: Partial<DbUser> = {}
      if (userData.phone) updates.phone = userData.phone
      if (userData.fullName) updates.full_name = userData.fullName
      if (userData.avatarUrl) updates.avatar_url = userData.avatarUrl

      // const res = await updateUser(user.value.id, updates, supabaseImpl)
      const res = await syncUserRecordImpl(updates)

      if (!res.success) {
        log.error('更新個人資料失敗', res.error)
        return { success: false, error: res.error }
      }

      // 清除快取並重新獲取用戶資料
      userCache.delete(`authId:${authUser.value?.id}`)
      const userId = user.value.id
      const userInfo = await getUserImpl(userId)
      user.value = userInfo.data ?? null

      return { success: true, data: user.value }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '更新個人資料時出錯'
      log.error('更新個人資料異常', e)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // 響應式等待認證完成的方法
  const waitForAuth = (): Promise<void> => {
    if (!loading.value) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('認證初始化超時'))
      }, 10000) // 10秒真正超時保護

      const unwatch = watch(
        loading,
        (isLoading) => {
          if (!isLoading) {
            clearTimeout(timeout)
            unwatch()
            resolve()
          }
        },
        { immediate: true },
      )
    })
  }

  return {
    user,
    loading,
    error: errorLocal,
    signUpWithEmail,
    signInWithEmail,
    signInWithProvider,
    syncUserRecord: syncUserRecordImpl,
    signOut,
    initAuthState,
    setupAuthListener,
    cleanupAuthListener: () => authListener?.subscription.unsubscribe(),
    getJWT,
    updatePassword: updatePasswordImpl,
    resetPasswordForEmail: resetPasswordForEmailImpl,
    updateProfile,
    checkAndRefreshSession,
    waitForAuth,
  }
}

// 轉換函數保持不變...
export function mapSupabaseUser(
  supabaseUser: SupabaseUser | null,
): User | null {
  if (!supabaseUser) return null

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: supabaseUser.user_metadata?.full_name || '',
    avatarUrl: supabaseUser.user_metadata?.avatar_url,
    createdAt: supabaseUser.created_at || '',
    updatedAt: supabaseUser.updated_at || '',
  }
}

export function mapSBSession(
  supabaseSession: SBSession | null,
): Session | null {
  if (!supabaseSession) return null

  return {
    accessToken: supabaseSession.access_token,
    refreshToken: supabaseSession.refresh_token,
    expiresAt: supabaseSession.expires_at || 0,
    user: mapSupabaseUser(supabaseSession.user) as User,
  }
}
