/**
 * Realtime 系統警報管理器
 *
 * 提供全域的 Realtime 錯誤收集和警報管理功能
 * 支援多個模組：Notifications、Orders、Inventory
 * 與 DashboardApiService 整合，將 Realtime 問題顯示在系統警報面板中
 */

import { createModuleLogger } from '@/utils/logger'
import { ref, readonly } from 'vue'
import type { SystemAlert } from '@/types'
import { convertToISOString } from '@/utils'

const log = createModuleLogger('Composable', 'RealtimeAlerts')

interface RealtimeAlert {
  id: string
  module:
    | 'notifications'
    | 'orders'
    | 'inventory'
    | 'messages'
    | 'conversations'
    | 'support-tickets'
  errorCount: number
  lastError: string
  errorHistory: Array<{ timestamp: string; error: string; type: string }>
  firstOccurrence: string
  severity: 'high' | 'medium' | 'low'
}

// 模組顯示名稱映射
const MODULE_DISPLAY_NAMES = {
  notifications: '通知系統',
  orders: '訂單系統',
  inventory: '庫存系統',
  messages: '對話訊息',
  conversations: '對話系統',
  'support-tickets': '支援工單',
} as const

// 全域狀態
const realtimeAlerts = ref<RealtimeAlert[]>([])

/**
 * Realtime 警報管理器
 */
export const useRealtimeAlerts = () => {
  /**
   * 記錄 Realtime 警報
   */
  const recordRealtimeAlert = (
    module:
      | 'notifications'
      | 'orders'
      | 'inventory'
      | 'messages'
      | 'conversations'
      | 'support-tickets',
    errorCount: number,
    lastError: string,
    errorHistory: Array<{ timestamp: string; error: string; type: string }>,
  ) => {
    const now = convertToISOString(new Date())
    const alertId = `realtime-${module}-issues`

    // 尋找現有警報或創建新的
    const existingIndex = realtimeAlerts.value.findIndex(
      (alert) => alert.id === alertId,
    )

    // 根據錯誤次數判斷嚴重程度
    const severity: 'high' | 'medium' | 'low' =
      errorCount >= 5 ? 'high' : errorCount >= 3 ? 'medium' : 'low'

    const alertData: RealtimeAlert = {
      id: alertId,
      module,
      errorCount,
      lastError,
      errorHistory,
      firstOccurrence:
        existingIndex >= 0
          ? realtimeAlerts.value[existingIndex].firstOccurrence
          : now,
      severity,
    }

    if (existingIndex >= 0) {
      // 更新現有警報
      realtimeAlerts.value[existingIndex] = alertData
    } else {
      // 新增警報
      realtimeAlerts.value.push(alertData)
    }

    log.debug(
      `📢 ${MODULE_DISPLAY_NAMES[module]} Realtime 警報已記錄:`,
      alertData,
    )
  }

  /**
   * 清除指定模組的 Realtime 警報 (連線恢復時調用)
   */
  const clearRealtimeAlert = (
    module: 'notifications' | 'orders' | 'inventory' | 'conversations',
  ) => {
    const alertId = `realtime-${module}-issues`
    realtimeAlerts.value = realtimeAlerts.value.filter(
      (alert) => alert.id !== alertId,
    )
    log.debug(`✅ ${MODULE_DISPLAY_NAMES[module]} Realtime 警報已清除`)
  }

  /**
   * 清除所有 Realtime 警報
   */
  const clearAllRealtimeAlerts = () => {
    realtimeAlerts.value = []
    log.debug('✅ 所有 Realtime 警報已清除')
  }

  /**
   * 獲取當前所有 Realtime 警報
   */
  const getRealtimeAlerts = (): SystemAlert[] => {
    return realtimeAlerts.value.map((alert) => {
      const now = new Date()
      const firstOccur = new Date(alert.firstOccurrence)
      const durationMinutes = Math.floor(
        (now.getTime() - firstOccur.getTime()) / (1000 * 60),
      )

      // 根據嚴重程度和持續時間決定類型
      const type: 'warning' | 'error' =
        alert.severity === 'high' ? 'error' : 'warning'
      const priority = alert.severity

      // 構建警報消息
      const moduleName = MODULE_DISPLAY_NAMES[alert.module]
      const message =
        alert.errorCount >= 5
          ? `${moduleName} Realtime 連線持續異常 (${alert.errorCount} 次錯誤，持續 ${durationMinutes} 分鐘)`
          : `${moduleName} Realtime 連線不穩定 (${alert.errorCount} 次錯誤)`

      return {
        id: alert.id,
        type,
        message,
        priority,
        timestamp: alert.firstOccurrence,
      }
    })
  }

  /**
   * 檢查是否有活躍的 Realtime 警報
   */
  const hasActiveRealtimeAlerts = () => {
    return realtimeAlerts.value.length > 0
  }

  /**
   * 獲取指定模組的警報狀態
   */
  const getModuleAlertStatus = (
    module:
      | 'notifications'
      | 'orders'
      | 'inventory'
      | 'messages'
      | 'support-tickets',
  ) => {
    const alert = realtimeAlerts.value.find((alert) => alert.module === module)
    return alert
      ? {
          hasAlert: true,
          severity: alert.severity,
          errorCount: alert.errorCount,
          lastError: alert.lastError,
          firstOccurrence: alert.firstOccurrence,
        }
      : {
          hasAlert: false,
          severity: 'low' as const,
          errorCount: 0,
          lastError: null,
          firstOccurrence: null,
        }
  }

  /**
   * 獲取系統整體 Realtime 健康狀態
   */
  const getSystemRealtimeHealth = () => {
    if (realtimeAlerts.value.length === 0) {
      return { status: 'healthy', score: 10 }
    }

    // 根據警報嚴重程度計算健康分數
    const totalAlerts = realtimeAlerts.value.length
    const highSeverityAlerts = realtimeAlerts.value.filter(
      (alert) => alert.severity === 'high',
    ).length
    const mediumSeverityAlerts = realtimeAlerts.value.filter(
      (alert) => alert.severity === 'medium',
    ).length

    // 分數計算：高嚴重性-4分，中等嚴重性-2分，低嚴重性-1分
    const penaltyScore =
      highSeverityAlerts * 4 +
      mediumSeverityAlerts * 2 +
      (totalAlerts - highSeverityAlerts - mediumSeverityAlerts)
    const score = Math.max(0, 10 - penaltyScore)

    const status = score >= 8 ? 'healthy' : score >= 6 ? 'warning' : 'critical'

    return { status, score }
  }

  return {
    recordRealtimeAlert,
    clearRealtimeAlert,
    clearAllRealtimeAlerts,
    getRealtimeAlerts,
    hasActiveRealtimeAlerts,
    getModuleAlertStatus,
    getSystemRealtimeHealth,
    realtimeAlerts: readonly(realtimeAlerts),
  }
}

// 全域實例
let globalRealtimeAlerts: ReturnType<typeof useRealtimeAlerts> | null = null

/**
 * 獲取全域 Realtime 警報管理器實例
 */
export const getGlobalRealtimeAlerts = () => {
  if (!globalRealtimeAlerts) {
    globalRealtimeAlerts = useRealtimeAlerts()
  }
  return globalRealtimeAlerts
}
