import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'ApiResource')

/**
 * 通用 API 資源管理 composable
 * 提供標準的 CRUD 操作和狀態管理
 */
export function useApiResource<T>(
  apiServiceClass: new (supabase: any) => any,
  resourceName: string,
) {
  const items = ref<T[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)

  /**
   * 獲取所有資源
   */
  const fetchAll = async (): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      const service = new apiServiceClass(supabase)
      const methodName = `fetchAll${resourceName}s`

      if (typeof service[methodName] !== 'function') {
        throw new Error(
          `Method ${methodName} not found in ${apiServiceClass.name}`,
        )
      }

      const result = await service[methodName]()

      if (!result.success) {
        throw new Error(result.error)
      }

      items.value = result.data || []
      log.debug('Fetched resources', {
        resourceName,
        count: items.value.length
      })
    } catch (err: any) {
      log.error('Error fetching resources', { resourceName, error: err })
      error.value = err
      items.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 創建新資源
   */
  const create = async (data: Partial<T>): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      const service = new apiServiceClass(supabase)
      const methodName = `create${resourceName}`

      if (typeof service[methodName] !== 'function') {
        throw new Error(
          `Method ${methodName} not found in ${apiServiceClass.name}`,
        )
      }

      const result = await service[methodName](data)

      if (!result.success) {
        throw new Error(result.error)
      }

      if (result.data) {
        await fetchAll() // 重新載入列表
        log.info('Created resource', { resourceName, data: result.data })
        return result.data
      }
      return null
    } catch (err: any) {
      log.error('Error creating resource', { resourceName, error: err })
      error.value = err
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新資源
   */
  const update = async (
    id: string | number,
    updates: Partial<T>,
  ): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      const service = new apiServiceClass(supabase)
      const methodName = `update${resourceName}`

      if (typeof service[methodName] !== 'function') {
        throw new Error(
          `Method ${methodName} not found in ${apiServiceClass.name}`,
        )
      }

      const result = await service[methodName](id, updates)

      if (!result.success) {
        throw new Error(result.error)
      }

      if (result.data) {
        await fetchAll() // 重新載入列表
        log.info('Updated resource', { resourceName, data: result.data })
        return result.data
      }
      return null
    } catch (err: any) {
      log.error('Error updating resource', { resourceName, error: err })
      error.value = err
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除資源
   */
  const remove = async (id: string | number): Promise<boolean> => {
    loading.value = true
    error.value = null
    try {
      const service = new apiServiceClass(supabase)
      const methodName = `delete${resourceName}`

      if (typeof service[methodName] !== 'function') {
        throw new Error(
          `Method ${methodName} not found in ${apiServiceClass.name}`,
        )
      }

      const result = await service[methodName](id)

      if (!result.success) {
        // 檢查是否為外鍵約束錯誤
        if (
          result.error?.includes('currently assigned') ||
          result.error?.includes('foreign key')
        ) {
          error.value = new Error(
            `${resourceName} is currently in use and cannot be deleted.`,
          )
          return false
        }
        throw new Error(result.error)
      }

      await fetchAll() // 重新載入列表
      log.info('Deleted resource', { resourceName, id })
      return true
    } catch (err: any) {
      log.error('Error deleting resource', { resourceName, error: err })
      if (!error.value) {
        error.value = err
      }
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  }
}

/**
 * 專門用於只讀資源的簡化版本
 */
export function useReadOnlyApiResource<T>(
  apiServiceClass: new (supabase: any) => any,
  resourceName: string,
) {
  const { items, loading, error, fetchAll } = useApiResource<T>(
    apiServiceClass,
    resourceName,
  )

  return {
    items,
    loading,
    error,
    fetchAll,
  }
}
