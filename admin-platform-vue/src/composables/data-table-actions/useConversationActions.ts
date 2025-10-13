import { createModuleLogger } from '@/utils/logger'
import { useDataTableActions } from './useDataTableActions'
import { updateConversationStatus } from '@/composables/useConversation'
import type { ConversationStatus } from '@/types/conversation'

const log = createModuleLogger('Composable', 'ConversationActions')


export function useConversationActions(
  options: {
    onSuccessfulStatusUpdate?: () => Promise<void>
  } = {},
) {
  // 使用通用的 DataTable 操作，不包含真正的刪除功能
  const {
    confirmDialogOpen,
    dialogType,
    handleDeleteRow,
    handleBatchDelete,
    confirm,
    cancel,
  } = useDataTableActions({
    deleteConfirmTitle: '確認關閉對話',
    deleteConfirmDescription: '您確定要關閉這個對話嗎？關閉後對話將移至已關閉列表。',
    batchDeleteConfirmTitle: '確認批量關閉對話',
    batchDeleteConfirmDescription: (count: number) =>
      `您確定要關閉選中的 ${count} 個對話嗎？關閉後對話將移至已關閉列表。`,

    onDelete: async (conversationId: string) => {
      try {
        // 將對話狀態設為已關閉，而不是真正刪除
        const result = await updateConversationStatus(conversationId, 'closed' as ConversationStatus)
        if (!result.success) {
          throw new Error(
            typeof result.error === 'string'
              ? result.error
              : result.error?.message || '關閉對話失敗'
          )
        }

        log.debug('對話關閉成功:', conversationId)
        if (options.onSuccessfulStatusUpdate) {
          await options.onSuccessfulStatusUpdate()
        }
      } catch (error) {
        log.error('關閉對話失敗:', error)
        throw error
      }
    },
    onBatchDelete: async (conversationIds: string[]) => {
      try {
        // 批量將對話狀態設為已關閉
        const results = await Promise.allSettled(
          conversationIds.map(id => updateConversationStatus(id, 'closed' as ConversationStatus))
        )

        const failures = results.filter(result => result.status === 'rejected')
        if (failures.length > 0) {
          throw new Error(`${failures.length} 個對話關閉失敗`)
        }

        log.debug('批量關閉對話成功:', conversationIds)
        if (options.onSuccessfulStatusUpdate) {
          await options.onSuccessfulStatusUpdate()
        }
      } catch (error) {
        log.error('批量關閉對話失敗:', error)
        throw error
      }
    },
  })

  // 處理對話狀態變更
  const handleSetRowStatus = async (conversationId: string, status: ConversationStatus) => {
    try {
      const result = await updateConversationStatus(conversationId, status)
      if (!result.success) {
        throw new Error(
          typeof result.error === 'string'
            ? result.error
            : result.error?.message || '變更對話狀態失敗'
        )
      }

      log.debug('對話狀態變更成功:', { conversationId, status })
      if (options.onSuccessfulStatusUpdate) {
        await options.onSuccessfulStatusUpdate()
      }
    } catch (error) {
      log.error('變更對話狀態失敗:', error)
      throw error
    }
  }

  // 處理批量狀態變更
  const handleBatchUpdateStatus = async (
    conversationIds: string[],
    status: ConversationStatus,
  ) => {
    try {
      const results = await Promise.allSettled(
        conversationIds.map(id => updateConversationStatus(id, status))
      )

      const failures = results.filter(result => result.status === 'rejected')
      if (failures.length > 0) {
        throw new Error(`${failures.length} 個對話狀態變更失敗`)
      }

      log.debug('批量變更對話狀態成功:', { conversationIds, status })
      if (options.onSuccessfulStatusUpdate) {
        await options.onSuccessfulStatusUpdate()
      }
    } catch (error) {
      log.error('批量變更對話狀態失敗:', error)
      throw error
    }
  }

  return {
    // 狀態
    confirmDialogOpen,
    dialogType,

    // 方法 - 注意這些實際上是關閉操作，不是刪除
    handleDeleteRow, // 實際上是關閉對話
    handleBatchDelete, // 實際上是批量關閉對話
    handleSetRowStatus,
    handleBatchUpdateStatus,

    // 確認對話框方法
    confirm,
    cancel,
  }
}