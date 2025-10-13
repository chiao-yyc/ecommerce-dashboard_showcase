import { createModuleLogger } from '@/utils/logger'
import { ref, watch } from 'vue'

const log = createModuleLogger('Composable', 'ConfirmAction')


export type ConfirmActionOptions = {
  type?: 'delete' | 'discard' | 'confirm'
  payload?: any
  title?: string
  description?: string | undefined
  cancelText?: string | undefined
  confirmText?: string | undefined
  onConfirm?: (_payload?: any) => Promise<void> | void
  onCancel?: (_payload?: any) => Promise<void> | void
}

export function useConfirmAction(initOptions?: ConfirmActionOptions) {
  const isOpen = ref(false)
  const dialogType = ref<'delete' | 'discard' | 'confirm'>('confirm')
  const payload = ref<any>(null)
  const confirmHandler = ref<((_payload?: any) => Promise<void> | void) | null>(
    null,
  )
  const cancelHandler = ref<((_payload?: any) => Promise<void> | void) | null>(
    null,
  )
  const dialogTitle = ref<string | undefined>(undefined)
  const dialogDescription = ref<string | undefined>(undefined)
  const dialogCancelText = ref<string | undefined>(undefined)
  const dialogConfirmText = ref<string | undefined>(undefined)

  const setOptions = (newOptions: ConfirmActionOptions) => {
    if (newOptions.type) dialogType.value = newOptions.type
    if (newOptions.payload) payload.value = newOptions.payload
    if (newOptions.onConfirm) confirmHandler.value = newOptions.onConfirm
    if (newOptions.onCancel) cancelHandler.value = newOptions.onCancel
    if (newOptions.title) dialogTitle.value = newOptions.title
    if (newOptions.description) dialogDescription.value = newOptions.description
    if (newOptions.cancelText) dialogCancelText.value = newOptions.cancelText
    if (newOptions.confirmText) dialogConfirmText.value = newOptions.confirmText
  }

  if (initOptions) {
    // 如果有傳入 options，則初始化對話框狀態
    setOptions(initOptions)
  }

  // Promise 相關狀態
  let resolveConfirmDialog: (_value: 'confirm' | 'cancel') => void = () => {}

  const openConfirm = (options?: ConfirmActionOptions) => {
    if (options) {
      setOptions(options)
    }

    isOpen.value = true
  }

  // Promise 模式
  const openConfirmPromise = (
    options: ConfirmActionOptions = {},
  ): Promise<'confirm' | 'cancel'> => {
    // 設定對話框狀態
    setOptions(options)

    // 開啟對話框
    isOpen.value = true

    return new Promise((resolve) => {
      resolveConfirmDialog = resolve

      // 監聽對話框關閉，處理意外關閉情況
      const unwatch = watch(isOpen, (open) => {
        if (!open) {
          unwatch()
          // 如果 Promise 還沒被解析，預設為取消
          resolve('cancel')
        }
      })
    })
  }

  const confirm = async () => {
    if (confirmHandler.value) {
      try {
        await confirmHandler.value(payload.value)
      } catch (error) {
        log.error('Error in confirm action:', error)
        return
      }
    }
    log.debug('confirm')

    // 處理 Promise 模式
    resolveConfirmDialog('confirm')

    isOpen.value = false
    reset()
  }

  const cancel = async () => {
    try {
      if (cancelHandler.value) {
        await cancelHandler.value(payload.value)
      }
    } catch (error) {
      log.error('Error in confirm action:', error)
      return
    }

    // 處理 Promise 模式
    resolveConfirmDialog('cancel')

    isOpen.value = false
    reset()
  }

  const reset = () => {
    payload.value = null
    confirmHandler.value = null
    cancelHandler.value = null
    // 重置 Promise resolver
    resolveConfirmDialog = () => {}
  }

  return {
    isOpen,
    dialogType,
    dialogTitle,
    dialogDescription,
    dialogCancelText,
    dialogConfirmText,
    openConfirm,
    openConfirmPromise,
    confirm,
    cancel,
  }
}
