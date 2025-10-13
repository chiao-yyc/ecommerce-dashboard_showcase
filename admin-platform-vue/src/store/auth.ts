import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Store', 'Auth')

export const useAuthStore = defineStore(
  'auth',
  () => {
    const {
      user,
      loading,
      error,
      signUpWithEmail,
      signInWithEmail,
      signInWithProvider,
      syncUserRecord,
      signOut,
      initAuthState,
      setupAuthListener,
      cleanupAuthListener,
      getJWT,
      updatePassword,
      resetPasswordForEmail,
      updateProfile,
      waitForAuth,
    } = useAuth()
    let unsubscribe: (() => void) | undefined
    let isInitialized = false

    // 序列初始化：先確保認證狀態載入完成，再設置監聽器
    const initializeAuth = async () => {
      // 避免重複初始化
      if (isInitialized) {
        log.debug('Auth store 已經初始化，跳過重複初始化')
        return
      }

      isInitialized = true

      try {
        // 只初始化狀態，不等待同步完成
        const initPromise = initAuthState()

        // 設置監聽器（不等待初始化完成）
        const listenerPromise = setupAuthListener()

        // 並行等待兩者，但有超時保護
        await Promise.race([
          Promise.all([initPromise, listenerPromise]),
          new Promise(resolve => setTimeout(resolve, 2000))
        ])

        unsubscribe = await listenerPromise
        log.info('Auth store 初始化完成')
      } catch (error) {
        log.error('認證初始化失敗', error)
        isInitialized = false // 失敗時重置標記
      }
    }
    
    // 只在 store 首次創建時初始化
    // 在新分頁場景下，Supabase 會話已經在 main.ts 中恢復
    initializeAuth()

    const isAuthenticated = computed(() => !!user.value && !!user.value.id)
    const userRoles = computed(() => user.value?.roles || [])

    // 清理函數，可以由應用程式手動調用
    function cleanup() {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = undefined
      }
    }

    async function refreshSession() {
      try {
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
          await syncUserRecord()
          return { success: true }
        }
        return { success: false }
      } catch (error) {
        log.error('刷新會話失敗', error)
        return { success: false, error }
      }
    }

    return {
      user,
      loading,
      error,
      isAuthenticated,
      userRoles,

      signUpWithEmail,
      signInWithEmail,
      signInWithProvider,
      refreshSession,
      signOut,
      initAuthState,
      cleanup,
      cleanupAuthListener,
      getJWT,
      updatePassword,
      resetPasswordForEmail,
      updateProfile,
      waitForAuth,
    }
  },
  {
    persist: true,
  },
)
