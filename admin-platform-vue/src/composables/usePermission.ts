import { convertToISOString } from '@/utils'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/utils/logger'
import type {
  DbPermission,
  Permission,
  DbPermissionGroup,
  PermissionGroup,
  PermissionMatrix,
  DbRolePermission,
  RolePermission,
  DbRolePermissionView,
  RolePermissionView,
  UserPermissionView,
  ApiResponse,
} from '@/types'

const log = createModuleLogger('Composable', 'Permission')

// 獲取所有權限組
async function fetchPermissionGroups(): Promise<
  ApiResponse<PermissionGroup[]>
> {
  const { data, error } = await supabase
    .from('permission_groups')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return { success: false, error: error.message }
  const groups = (data || []).map(mapDbPermissionGroupToPermissionGroup)
  return { success: true, data: groups }
}

// 獲取所有權限
async function fetchPermissions(): Promise<ApiResponse<Permission[]>> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return { success: false, error: error.message }
  const permissions = (data || []).map(mapDbPermissionToPermission)
  return { success: true, data: permissions }
}

// 獲取角色權限
async function fetchRolePermissions(
  roleId: number,
): Promise<ApiResponse<RolePermission[]>> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .eq('role_id', roleId)

  if (error) return { success: false, error: error.message }
  const permissions = (data || []).map(mapDbRolePermissionToRolePermission)
  return { success: true, data: permissions }
}

// 刪除角色權限
async function deleteRolePermissions(
  roleId: number,
): Promise<ApiResponse<null>> {
  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)

  if (deleteError) return { success: false, error: deleteError.message }
  return { success: true, data: null }
}

// 寫入角色權限
async function insertRolePermissions(
  roleId: number,
  permissionIds: number[],
): Promise<ApiResponse<null>> {
  const rolePermissionsToInsert = permissionIds.map((permId) => ({
    role_id: roleId,
    permission_id: permId,
  }))

  const { error: insertError } = await supabase
    .from('role_permissions')
    .insert(rolePermissionsToInsert)

  if (insertError) return { success: false, error: insertError.message }
  return { success: true, data: null }
}

// 獲取角色權限視圖
async function fetchRolePermissionViews(
  roleId?: number,
): Promise<ApiResponse<RolePermissionView[]>> {
  let query = supabase.from('role_permissions_view').select('*')

  if (roleId) {
    query = query.eq('role_id', roleId)
  }

  const { data, error } = await query

  if (error) return { success: false, error: error.message }
  const rolePermissionViews = (data || []).map(
    mapDbRolePermissionViewToRolePermissionView,
  )
  return { success: true, data: rolePermissionViews }
}

export async function fetchUserPermissionViews(
  userId: string,
): Promise<ApiResponse<UserPermissionView[]>> {
  const { data, error } = await supabase
    .from('user_permission_map')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    log.error('權限查詢失敗', { errorMessage: error.message })
    return { success: false, error: error.message }
  }

  const userPermissions = (data || []).map((item) => ({
    permissionId: item.permission_id,
    permissionCode: item.permission_code,
    permissionName: item.permission_name,
    groupId: item.group_id,
    groupName: item.group_name,
    fromRoles: item.from_roles,
  }))

  return { success: true, data: userPermissions }
}

/**
 * 權限管理 Composable
 * @returns 權限管理相關狀態和方法
 */
export function usePermission(
  fetchPermissionGroupsImpl = fetchPermissionGroups,
  fetchPermissionsImpl = fetchPermissions,
  fetchRolePermissionsImpl = fetchRolePermissions,
  deleteRolePermissionsImpl = deleteRolePermissions,
  insertRolePermissionsImpl = insertRolePermissions,
  fetchRolePermissionViewsImpl = fetchRolePermissionViews,
) {
  // 狀態管理
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const permissionGroups = ref<PermissionGroup[]>([])
  const permissions = ref<Permission[]>([])
  const rolePermissions = ref<Record<number, number[]>>({})
  const currentRoleId = ref<number | null>(null)
  const permissionMatrix = ref<PermissionMatrix | null>(null)

  // 計算屬性
  const currentRolePermissions = computed(() => {
    if (!currentRoleId.value) return []
    return rolePermissions.value[currentRoleId.value] || []
  })

  // 錯誤處理函數
  const handleError = (err: any, message: string) => {
    log.error(message, { error: err })
    error.value = err instanceof Error ? err : new Error(String(err))
  }

  // 加載狀態管理函數
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err: any) {
      handleError(err, 'Error in operation:')
      return null
    } finally {
      loading.value = false
    }
  }

  // 獲取所有權限組
  const loadPermissionGroups = async () => {
    return withLoading(async () => {
      const response = await fetchPermissionGroupsImpl()
      if (!response.success) throw new Error(response.error as string)
      permissionGroups.value = response.data
      return response.data
    })
  }

  // 獲取所有權限
  const loadPermissions = async () => {
    return withLoading(async () => {
      const response = await fetchPermissionsImpl()
      if (!response.success) throw new Error(response.error as string)
      permissions.value = response.data
      return response.data
    })
  }

  // 獲取角色權限
  const loadRolePermissions = async (roleId: number) => {
    return withLoading(async () => {
      const response = await fetchRolePermissionsImpl(roleId)
      if (!response.success) throw new Error(response.error as string)

      // 過濾掉 null 值，確保只有有效的權限 ID
      const permissionIds = (response.data || [])
        .map((item) => item.permissionId)
        .filter((id) => id !== null && id !== undefined)

      // 更新狀態
      rolePermissions.value = {
        ...rolePermissions.value,
        [roleId]: permissionIds,
      }
      currentRoleId.value = roleId

      return permissionIds
    })
  }

  // 獲取權限矩陣
  const loadPermissionMatrix = async (roleId?: number) => {
    return withLoading(async () => {
      // 1. 確保權限組和權限已加載
      const groups =
        permissionGroups.value.length > 0
          ? permissionGroups.value
          : (await loadPermissionGroups()) || []

      const perms =
        permissions.value.length > 0
          ? permissions.value
          : (await loadPermissions()) || []

      // 2. 如果提供了角色ID，獲取該角色的權限
      if (
        roleId &&
        (!rolePermissions.value[roleId] || currentRoleId.value !== roleId)
      ) {
        await loadRolePermissions(roleId)
      }

      // 3. 構建權限矩陣
      const rolePermsMap: Record<number, number[]> = {}
      if (roleId) {
        rolePermsMap[roleId] = rolePermissions.value[roleId] || []
      }

      // 4. 分組權限
      const groupedPermissionsMap = new Map<number, Permission[]>()
      groups.forEach((group) => groupedPermissionsMap.set(group.id, []))

      // 將權限分配到正確的組
      const ungroupedPerms: Permission[] = []
      perms.forEach((perm) => {
        if (perm.groupId === null || perm.groupId === undefined) {
          ungroupedPerms.push(perm)
        } else if (groupedPermissionsMap.has(perm.groupId)) {
          const groupPerms = groupedPermissionsMap.get(perm.groupId) || []
          groupPerms.push(perm)
          groupedPermissionsMap.set(perm.groupId, groupPerms)
        } else {
          ungroupedPerms.push(perm)
        }
      })

      // 生成結果
      const groupedPermissions = groups.map((group) => ({
        ...group,
        permissions: groupedPermissionsMap.get(group.id) || [],
      }))

      // 5. 處理未分組的權限
      if (ungroupedPerms.length > 0) {
        groupedPermissions.push({
          id: -1,
          name: '其他',
          description: '未分組權限',
          sortOrder: 999,
          createdAt: convertToISOString(new Date()),
          permissions: ungroupedPerms,
        })
      }

      // 6. 更新狀態並返回結果
      const matrix = {
        groups: groupedPermissions,
        rolePermissions: rolePermsMap,
      }

      permissionMatrix.value = matrix
      return matrix
    })
  }

  // 更新角色權限
  const saveRolePermissions = async (
    roleId: number,
    permissionIds: number[],
  ) => {
    return (
      withLoading(async () => {
        // 1. 刪除該角色的所有現有權限
        const deleteResponse = await deleteRolePermissionsImpl(roleId)
        if (!deleteResponse.success)
          throw new Error(deleteResponse.error as string)

        // 2. 插入新的權限
        if (permissionIds.length > 0) {
          const insertResponse = await insertRolePermissionsImpl(
            roleId,
            permissionIds,
          )
          if (!insertResponse.success)
            throw new Error(insertResponse.error as string)
        }

        // 3. 更新本地狀態
        rolePermissions.value = {
          ...rolePermissions.value,
          [roleId]: [...permissionIds],
        }

        return true
      }) || false
    )
  }

  // 獲取角色權限視圖
  const loadRolePermissionViews = async () => {
    return withLoading(async () => {
      const response = await fetchRolePermissionViewsImpl()
      if (!response.success) throw new Error(response.error as string)
      return response.data || []
    })
  }

  // 初始化加載
  const initialize = async (roleId?: number) => {
    await loadPermissionGroups()
    await loadPermissions()
    if (roleId) {
      await loadPermissionMatrix(roleId)
    }
  }

  return {
    // 狀態
    loading,
    error,
    permissionGroups,
    permissions,
    rolePermissions,
    currentRoleId,
    permissionMatrix,
    currentRolePermissions,

    // 方法 - 使用更直觀的命名
    initialize,
    loadPermissionGroups,
    loadPermissions,
    loadRolePermissions,
    loadPermissionMatrix,
    saveRolePermissions,
    loadRolePermissionViews,

    // 向後兼容的別名
    fetchPermissionGroups: loadPermissionGroups,
    fetchPermissions: loadPermissions,
    fetchRolePermissions: loadRolePermissions,
    fetchPermissionMatrix: loadPermissionMatrix,
    updateRolePermissions: saveRolePermissions,
    fetchRolePermissionViews: loadRolePermissionViews,
  }
}

export function useUserPermission(
  fetchPermissionGroupsImpl = fetchPermissionGroups,
  fetchPermissionsImpl = fetchPermissions,
  fetchUserPermissionViewsImpl = fetchUserPermissionViews, // Add this line
) {
  // 狀態管理
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const permissionGroups = ref<PermissionGroup[]>([])
  const permissions = ref<Permission[]>([])
  const permissionMatrix = ref<PermissionMatrix | null>(null)

  // Add user permission state
  const userPermissions = ref<UserPermissionView[]>([])
  const currentUserId = ref<string | null>(null)

  // 錯誤處理函數
  const handleError = (err: any, message: string) => {
    log.error(message, { error: err })
    error.value = err instanceof Error ? err : new Error(String(err))
  }

  // 加載狀態管理函數
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (err: any) {
      handleError(err, 'Error in operation:')
      return null
    } finally {
      loading.value = false
    }
  }

  // 獲取所有權限組
  const loadPermissionGroups = async () => {
    return withLoading(async () => {
      const response = await fetchPermissionGroupsImpl()
      if (!response.success) throw new Error(response.error as string)
      permissionGroups.value = response.data
      return response.data
    })
  }

  // 獲取所有權限
  const loadPermissions = async () => {
    return withLoading(async () => {
      const response = await fetchPermissionsImpl()
      if (!response.success) throw new Error(response.error as string)
      permissions.value = response.data
      return response.data
    })
  }

  // Add method to load user permissions
  const loadUserPermissions = async (userId: string) => {
    return withLoading(async () => {
      const response = await fetchUserPermissionViewsImpl(userId)
      if (!response.success) throw new Error(response.error as string)
      userPermissions.value = response.data
      currentUserId.value = userId
      return response.data
    })
  }

  // Add method to get permission matrix for user
  const loadUserPermissionMatrix = async (userId: string) => {
    return withLoading(async () => {
      // Load user permissions if not already loaded
      if (
        currentUserId.value !== userId ||
        userPermissions.value.length === 0
      ) {
        await loadUserPermissions(userId)
      }

      // Load all permission groups and permissions
      const groups =
        permissionGroups.value.length > 0
          ? permissionGroups.value
          : (await loadPermissionGroups()) || []

      const perms =
        permissions.value.length > 0
          ? permissions.value
          : (await loadPermissions()) || []

      // Group permissions
      const groupedPermissionsMap = new Map<number, Permission[]>()
      groups.forEach((group) => groupedPermissionsMap.set(group.id, []))

      // Add user's permissions to the groups
      const userPermIds = new Set(
        userPermissions.value.map((up) => up.permissionId),
      )
      const ungroupedPerms: Permission[] = []

      perms.forEach((perm) => {
        // Only include permissions that the user has
        if (!userPermIds.has(perm.id)) return

        if (perm.groupId === null || perm.groupId === undefined) {
          ungroupedPerms.push(perm)
        } else if (groupedPermissionsMap.has(perm.groupId)) {
          const groupPerms = groupedPermissionsMap.get(perm.groupId) || []
          groupPerms.push(perm)
          groupedPermissionsMap.set(perm.groupId, groupPerms)
        } else {
          ungroupedPerms.push(perm)
        }
      })

      // Generate result
      const groupedPermissions = groups
        .filter((group) => {
          const perms = groupedPermissionsMap.get(group.id) || []
          return perms.length > 0
        })
        .map((group) => ({
          ...group,
          permissions: groupedPermissionsMap.get(group.id) || [],
        }))

      // Add ungrouped permissions if any
      if (ungroupedPerms.length > 0) {
        groupedPermissions.push({
          id: -1,
          name: '其他',
          description: '未分組權限',
          sortOrder: 999,
          createdAt: convertToISOString(new Date()),
          permissions: ungroupedPerms,
        })
      }

      const matrix = {
        groups: groupedPermissions,
        // userPermissions: userPermissions.value
      }

      permissionMatrix.value = matrix
      return matrix
    })
  }

  // Update initialize method
  const initialize = async (options: { userId?: string } = {}) => {
    await loadPermissionGroups()
    await loadPermissions()

    if (options.userId) {
      await loadUserPermissionMatrix(options.userId)
    }
  }

  return {
    // 狀態
    loading,
    error,
    userPermissions,
    permissionMatrix,
    initialize,

    // loadUserPermissionMatrix,
    fetchUserPermissionMatrix: loadUserPermissionMatrix,
  }
}

function mapDbPermissionGroupToPermissionGroup(
  dbGroup: DbPermissionGroup,
): PermissionGroup {
  return {
    id: dbGroup.id,
    name: dbGroup.name,
    description: dbGroup.description,
    sortOrder: dbGroup.sort_order,
    createdAt: dbGroup.created_at,
  }
}

function mapDbPermissionToPermission(dbPerm: DbPermission): Permission {
  return {
    id: dbPerm.id,
    groupId: dbPerm.group_id,
    code: dbPerm.code,
    name: dbPerm.name,
    description: dbPerm.description,
    sortOrder: dbPerm.sort_order,
    createdAt: dbPerm.created_at,
  }
}

function mapDbRolePermissionToRolePermission(
  dbPerm: DbRolePermission,
): RolePermission {
  return {
    roleId: dbPerm.role_id,
    permissionId: dbPerm.permission_id,
    createdAt: dbPerm.created_at,
  }
}

function mapDbRolePermissionViewToRolePermissionView(
  dbPerm: DbRolePermissionView,
): RolePermissionView {
  return {
    roleId: dbPerm.role_id,
    roleName: dbPerm.role_name,
    permissionId: dbPerm.permission_id,
    permissionCode: dbPerm.permission_code,
    permissionName: dbPerm.permission_name,
    groupId: dbPerm.group_id,
    groupName: dbPerm.group_name,
    createdAt: dbPerm.created_at,
  }
}
