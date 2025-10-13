import { createModuleLogger } from '@/utils/logger'
import { ref } from 'vue'
import { setUserRole, removeUserRole, deleteUser } from '@/composables/useUser'
import { useRole } from '@/composables/useRole'
import { useDataTableActions } from './useDataTableActions'
import { defaultServiceFactory } from '@/api/services'
// import { COMMON_FIELD_MAPPINGS } from '@/utils/export' // 未使用
import type { ExportOptions, ExportFormat } from '@/utils/export'
import { useXLSXExport } from '@/composables/useXLSXExport'
import type { User, Role } from '@/types'

const log = createModuleLogger('Composable', 'RoleUserActions')


export function useRoleUserActions(
  options: {
    onSuccessfulDelete?: () => Promise<void>
    onSuccessfulBatchDelete?: () => Promise<void>
  } = {},
) {
  // 使用 XLSX 匯出 composable
  const { exportUsers, isExporting } = useXLSXExport()

  // 角色管理狀態
  const showRoleDialog = ref(false)
  const selectedUserId = ref<string | null>(null)
  const selectedRole = ref<Role[]>([])
  const loading = ref(false)

  const {
    availableRoles,
    fetchAllRoles: loadAllRoles,
    loadingRoles: rolesLoading,
  } = useRole()

  // 用戶匯出資料獲取函數（用於 CSV/JSON 匯出）
  const getUserExportData = async (userIds?: string[]) => {
    if (userIds && userIds.length > 0) {
      // 匯出特定用戶
      const userService = defaultServiceFactory.getUserService()
      const users = []
      
      for (const userId of userIds) {
        const { success, data } = await userService.findById(userId)
        if (success && data) {
          users.push(data)
        }
      }
      return users
    } else {
      // 匯出全部用戶（分頁處理）
      const userService = defaultServiceFactory.getUserService()
      const { success, data } = await userService.fetchUsersWithPagination([], {
        page: 1,
        perPage: 1000, // 限制最大匯出數量
        sortBy: 'created_at',
        sortOrder: 'desc'
      })
      return success ? data || [] : []
    }
  }

  // 用戶匯出選項
  const userExportOptions: Partial<ExportOptions> = {
    fieldMapping: {
      id: '用戶編號',
      fullName: '姓名',
      email: '電子信箱',
      phone: '電話',
      createdAt: '建立時間',
      roles: '角色',
      status: '狀態',
      permissions: '權限',
      department: '部門',
      position: '職位',
      lastLoginAt: '最後登入時間'
    },
    dateFields: ['createdAt', 'updatedAt', 'lastLoginAt', 'emailVerifiedAt'],
    sensitiveFields: ['email', 'phone'],
    preprocessor: (users) => {
      // 扁平化用戶資料，包含角色和狀態資訊
      return users.map(user => ({
        ...user,
        // 狀態翻譯
        statusDisplay: user.isActive ? '啟用' : '停用',
        // 角色顯示
        rolesDisplay: (user.roles as any[])?.join(', ') || '無角色',
        // 部門顯示
        departmentDisplay: user.department || '未設定',
        // 職位顯示
        positionDisplay: user.position || '未設定',
        // 最後登入時間
        lastLoginDisplay: user.lastLoginAt ? new Date(user.lastLoginAt as string | number | Date).toLocaleDateString() : '從未登入',
        // 信箱驗證狀態
        emailVerifiedDisplay: user.emailVerifiedAt ? '已驗證' : '未驗證'
      }))
    }
  }


  // 使用通用的 DataTable 操作
  const {
    confirmDialogOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,
    confirm,
    cancel,
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    handleBatchDelete,
    handleBatchExport,
  } = useDataTableActions({
    detailRouteName: 'role-users', // 暫時使用 role-users 路由，因為沒有 user-detail
    deleteConfirmTitle: '確認刪除用戶',
    deleteConfirmDescription: '您確定要刪除這個使用者嗎？此操作不可復原。',
    batchDeleteConfirmTitle: '確認批量刪除用戶',
    batchDeleteConfirmDescription: (count: number) =>
      `您確定要刪除選中的 ${count} 個使用者嗎？此操作不可復原。`,
    
    // 匯出確認配置
    enableExportConfirm: true,
    exportConfirmTitle: '確認匯出用戶資料',
    exportConfirmDescription: (format) => `您確定要匯出此用戶為 ${format.toUpperCase()} 格式嗎？`,
    batchExportConfirmTitle: '確認批量匯出用戶',
    batchExportConfirmDescription: (count, format) => `您確定要匯出所選的 ${count} 項用戶為 ${format.toUpperCase()} 格式嗎？`,
    
    // 匯出配置（支援三種格式）
    exportConfig: {
      getExportData: getUserExportData,
      defaultOptions: userExportOptions,
      supportedFormats: ['csv', 'xlsx', 'json'] // 支援三種格式
    },
    onDelete: async (userId: string) => {
      try {
        const result = await deleteUser(userId)
        if (result.success) {
          if (options.onSuccessfulDelete) {
            await options.onSuccessfulDelete()
          }
        } else {
          throw new Error((result.error as string) || '刪除使用者失敗')
        }
      } catch (error) {
        log.error('刪除使用者時發生錯誤:', error)
        throw error
      }
    },
    onExport: async (userId: string, format: 'csv' | 'xlsx' | 'json' = 'xlsx') => {
      if (format === 'xlsx') {
        // 使用業務特定的 XLSX 匯出
        const filters: Record<string, any> = {
          user_ids: [userId]
        }
        await exportUsers(filters)
      } else {
        // 使用通用匯出處理 CSV 和 JSON
        const data = await getUserExportData([userId])
        const options: ExportOptions = {
          filename: `user_${userId}`,
          ...userExportOptions
        }
        const { exportData } = await import('@/utils/export')
        await exportData(data, format, options)
      }
    },
    onBatchDelete: async (userIds: string[]) => {
      try {
        // 批量刪除每個使用者
        const deletePromises = userIds.map((userId) => deleteUser(userId))
        const results = await Promise.all(deletePromises)

        // 檢查是否所有刪除都成功
        const failedResults = results.filter((result) => !result.success)
        if (failedResults.length > 0) {
          const errorMessages = failedResults
            .map((result) => result.error)
            .join(', ')
          throw new Error(`部分使用者刪除失敗: ${errorMessages}`)
        }

        if (options.onSuccessfulBatchDelete) {
          await options.onSuccessfulBatchDelete()
        }
      } catch (error) {
        log.error('批量刪除使用者時發生錯誤:', error)
        throw error
      }
    },
    onBatchExport: async (data: {
      ids: string[]
      type: 'list' | 'detail'
      format?: ExportFormat
    }) => {
      const { ids, format = 'xlsx' } = data

      if (format === 'xlsx') {
        // 使用 Edge Function 進行 XLSX 匯出
        const userIds = ids && ids.length > 0 ? ids : undefined
        const filters: Record<string, any> = {}
        
        if (userIds) {
          filters.user_ids = userIds
        }

        await exportUsers(filters)
      } else {
        // 使用通用匯出處理 CSV 和 JSON
        const exportData = await getUserExportData(ids)
        const options: ExportOptions = {
          filename: `batch_users_${ids.length}items`,
          suffix: `${ids.length}筆`,
          ...userExportOptions
        }
        const { exportData: exportDataFn } = await import('@/utils/export')
        await exportDataFn(exportData, format, options)
      }
    },
  })


  // 處理修改用戶角色
  const openRoleDialog = (userId: string, users: User[]) => {
    log.debug(
      'useRoleUserActions: openRoleDialog called with userId:',
      userId,
    )
    selectedUserId.value = userId

    // 查找用戶當前角色
    const user = users.find((u) => u.id === userId)
    if (user && user.roles && user.roles.length > 0) {
      // 將角色名稱轉換為完整的角色物件
      const userRoles = availableRoles.value.filter((role) =>
        (user.roles as unknown as string[])?.includes(role.name),
      )
      selectedRole.value = [...userRoles]
    } else {
      selectedRole.value = []
    }

    // 確保 availableRoles 已經載入
    if (!availableRoles.value.length && !rolesLoading.value) {
      loadAllRoles()
    }

    showRoleDialog.value = true
  }

  // 確認修改角色
  const confirmChangeRole = async (
    users: User[],
    onSuccess: () => Promise<void>,
  ) => {
    if (!selectedUserId.value) return

    const userId = selectedUserId.value
    const newSelectedRoles = selectedRole.value || []

    // 找到用戶當前角色
    const userToUpdate = users.find((u) => u.id === userId)
    if (!userToUpdate) {
      log.error('User not found in local list for role update')
      return
    }
    const originalRoleNames = userToUpdate.roles || []

    // 將角色名稱轉換為角色物件
    const originalRoles = availableRoles.value.filter((role) =>
      (originalRoleNames as unknown as string[]).includes(role.name),
    )

    loading.value = true
    let success = true

    try {
      const newRoleIds = new Set(newSelectedRoles.map((r) => r.id))
      const originalRoleIds = new Set(originalRoles.map((r) => r.id))

      // 新增角色
      for (const role of newSelectedRoles) {
        if (!originalRoleIds.has(role.id)) {
          log.debug(
            `Adding role: ${role.name} (ID: ${role.id}) to user ${userId}`,
          )
          const addResult = await setUserRole(userId, role.id)
          if (!addResult) success = false
        }
      }

      // 移除角色
      for (const role of originalRoles) {
        if (!newRoleIds.has(role.id)) {
          log.debug(
            `Removing role: ${role.name} (ID: ${role.id}) from user ${userId}`,
          )
          const removeResult = await removeUserRole(userId, role.id)
          if (!removeResult) success = false
        }
      }

      if (success) {
        log.debug(`Roles for user ${userId} updated successfully.`)
        // 更新本地數據 - 將角色物件轉換為角色名稱
        const userIndex = users.findIndex((u) => u.id === userId)
        if (userIndex !== -1) {
          users[userIndex].roles = newSelectedRoles.map((role) => role.name) as unknown as Role[]
        }
      } else {
        log.error('One or more role operations failed.')
      }
    } catch (err) {
      success = false
      log.error('Failed to change roles:', err)
    } finally {
      loading.value = false
      showRoleDialog.value = false
      if (success) {
        await onSuccess() // 重新載入數據
      } else {
        log.error('Role update process encountered errors.')
        await onSuccess() // 仍然重新載入以獲取真實狀態
      }
    }
  }

  return {
    // 通用確認對話框
    confirmDialogOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,
    confirm,
    cancel,

    // 通用方法
    handleViewDetail,
    handleDeleteRow,
    handleExportDetail,
    // 通用 batch 方法
    handleBatchDelete,

    // 特定狀態 & 方法
    showRoleDialog,
    selectedUserId,
    selectedRole,
    loading,
    availableRoles,
    rolesLoading,
    openRoleDialog,
    confirmChangeRole,
    loadAllRoles,

    // 使用 useDataTableActions 的批量匯出（包含確認對話框）
    handleBatchExport,

    // XLSX 匯出狀態
    isExporting,
  }
}