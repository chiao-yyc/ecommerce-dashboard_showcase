import { ref, computed, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import { useDataTableActions } from './useDataTableActions'
import { useConfirmAction } from '@/composables/useConfirmAction'
import { getNotificationTemplateApiService } from '@/api/services'
import type { NotificationTemplate } from '@/types'

export interface NotificationActionsConfig {
  onSuccessfulToggle?: () => Promise<void> | void
  onSuccessfulBatchUpdate?: () => Promise<void> | void
}

export function useNotificationActions(
  templates: Ref<NotificationTemplate[]>,
  selectedIds: Ref<string[]>,
  config: NotificationActionsConfig = {},
) {
  const templateApi = getNotificationTemplateApiService()

  // 使用基礎 DataTable actions
  const baseActions = useDataTableActions({
    // 通知模板不需要刪除功能，所以不設定相關配置
  })

  // 使用確認對話框
  const { openConfirm } = useConfirmAction()

  // 通知模板特有的狀態
  const toggleLoading = ref<Set<string>>(new Set())
  const batchLoading = ref(false)

  // 計算屬性
  const hasSelection = computed(() => selectedIds.value.length > 0)

  // 檢查是否正在切換狀態
  const checkToggleLoading = (id: string) => {
    return toggleLoading.value.has(id)
  }

  // 單個模板狀態切換
  const toggleTemplateStatus = async (payload: {
    id: string
    isActive: boolean
  }) => {
    try {
      // 添加到 loading 狀態
      toggleLoading.value.add(payload.id)

      const newStatus = !payload.isActive

      const response = await templateApi.updateTemplateStatus(
        payload.id,
        newStatus,
      )

      if (response.success) {
        // 找到並更新本地數據中對應的模板
        const template = templates.value.find((t) => t.id === payload.id)
        if (template) {
          template.isActive = newStatus
        }

        toast.success(`模板狀態已${newStatus ? '啟用' : '停用'}`)

        // 執行成功回調
        if (config.onSuccessfulToggle) {
          await config.onSuccessfulToggle()
        }
      } else {
        toast.error(response.error || '更新狀態失敗')
      }
    } catch (_err) {
      toast.error('更新狀態時發生錯誤')
    } finally {
      // 無論成功或失敗都移除 loading 狀態
      toggleLoading.value.delete(payload.id)
    }
  }

  // 執行批量操作
  const executeBatchAction = async (
    action: 'enable' | 'disable',
    ids: string[],
  ) => {
    try {
      batchLoading.value = true

      const updates = ids.map((id) => ({
        id,
        isActive: action === 'enable',
      }))

      const response = await templateApi.batchUpdateTemplateStatus(updates)

      if (response.success) {
        // 更新本地狀態
        templates.value.forEach((template) => {
          if (ids.includes(template.id)) {
            template.isActive = action === 'enable'
          }
        })

        const affectedCount = response.data?.affectedCount || ids.length
        selectedIds.value = []

        toast.success(
          `已${action === 'enable' ? '啟用' : '停用'} ${affectedCount} 個通知模板`,
        )

        // 執行成功回調
        if (config.onSuccessfulBatchUpdate) {
          await config.onSuccessfulBatchUpdate()
        }
      } else {
        toast.error('批量操作失敗')
      }
    } catch (_err) {
      toast.error('批量操作時發生錯誤')
    } finally {
      batchLoading.value = false
    }
  }

  // 批量啟用
  const handleBatchEnable = () => {
    if (selectedIds.value.length === 0) return

    openConfirm({
      type: 'confirm',
      payload: { action: 'enable', ids: selectedIds.value },
      title: '確認批量啟用通知模板',
      description: `您即將啟用 ${selectedIds.value.length} 個通知模板。啟用後，這些類型的通知將恢復正常創建。`,
      confirmText: '確認啟用',
      cancelText: '取消',
      onConfirm: async (payload: {
        action: 'enable' | 'disable'
        ids: string[]
      }) => {
        await executeBatchAction(payload.action, payload.ids)
      },
    })
  }

  // 批量停用
  const handleBatchDisable = () => {
    if (selectedIds.value.length === 0) return

    openConfirm({
      type: 'confirm',
      payload: { action: 'disable', ids: selectedIds.value },
      title: '確認批量停用通知模板',
      description: `您即將停用 ${selectedIds.value.length} 個通知模板。停用後，這些類型的通知將不會被創建。`,
      confirmText: '確認停用',
      cancelText: '取消',
      onConfirm: async (payload: {
        action: 'enable' | 'disable'
        ids: string[]
      }) => {
        await executeBatchAction(payload.action, payload.ids)
      },
    })
  }

  // 清除選取
  const clearSelection = () => {
    selectedIds.value = []
  }

  return {
    // 只返回需要的基礎 actions 的確認對話框狀態和方法
    confirmDialogOpen: baseActions.confirmDialogOpen,
    dialogType: baseActions.dialogType,
    dialogTitle: baseActions.dialogTitle,
    dialogDescription: baseActions.dialogDescription,
    dialogCancelText: baseActions.dialogCancelText,
    dialogConfirmText: baseActions.dialogConfirmText,
    confirm: baseActions.confirm,
    cancel: baseActions.cancel,

    // 通知模板特有的狀態
    toggleLoading,
    batchLoading,
    hasSelection,

    // 通知模板特有的方法
    checkToggleLoading,
    toggleTemplateStatus,
    handleBatchEnable,
    handleBatchDisable,
    clearSelection,
  }
}
