import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useUserPermission } from '@/composables/usePermission'
import { useAuthStore } from './auth' // 從新的 auth.ts 導入
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Store', 'Permission')

export const usePermissionStore = defineStore('permission', () => {
  const authStore = useAuthStore()
  const {
    loading,
    error,
    permissionMatrix,
    fetchUserPermissionMatrix,
    initialize,
  } = useUserPermission()

  watch(
    () => authStore.user,
    async (newUser) => {
      log.debug('用戶狀態變化', {
        hasUser: !!newUser,
        userId: newUser?.id,
        email: newUser?.email
      })

      if (newUser?.id) {
        log.debug('開始初始化權限', { userId: newUser.id })
        await initialize({ userId: newUser.id })
        log.info('初始化完成', {
          hasPermissionMatrix: !!permissionMatrix.value,
          groupsCount: permissionMatrix.value?.groups?.length || 0,
          loading: loading.value,
          error: error.value?.message
        })
      } else {
        log.debug('清除權限矩陣')
        permissionMatrix.value = null
      }
    },
    { immediate: true },
  )

  const hasPermission = computed(() => (permissionCode: string) => {
    if (!permissionMatrix.value) return false
    for (const group of permissionMatrix.value.groups) {
      if (group.permissions.some((p) => p.code === permissionCode)) {
        return true
      }
    }
    return false
  })

  return {
    loading,
    error,
    permissionMatrix,
    fetchUserPermissionMatrix,
    hasPermission,
  }
})
