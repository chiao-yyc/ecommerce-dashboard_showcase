// 通知模板映射表
export interface NotificationTemplateInfo {
  name: string // 模板名稱
  entityType: string // 實體類型
  description?: string // 描述
}

// 通知類型到模板資訊的映射
export const notificationTemplateMap: Record<string, NotificationTemplateInfo> = {
  // 訂單相關
  order_new: {
    name: '新訂單通知',
    entityType: '訂單',
    description: '當有新訂單建立時觸發',
  },
  order_high_value: {
    name: '高價值訂單警示',
    entityType: '訂單',
    description: '訂單金額超過閾值時觸發',
  },
  order_paid: {
    name: '訂單付款完成',
    entityType: '訂單',
    description: '客戶完成付款時觸發',
  },
  order_payment_pending: {
    name: '待付款訂單即將過期',
    entityType: '訂單',
    description: '訂單付款期限即將到期',
  },
  order_shipped: {
    name: '訂單已出貨',
    entityType: '訂單',
    description: '訂單商品已出貨',
  },
  order_completed: {
    name: '訂單完成確認',
    entityType: '訂單',
    description: '訂單已完成交易',
  },
  order_cancelled: {
    name: '訂單取消通知',
    entityType: '訂單',
    description: '訂單被取消',
  },

  // 產品相關
  product_out_of_stock: {
    name: '產品完全缺貨',
    entityType: '產品',
    description: '產品庫存為零',
  },
  product_back_in_stock: {
    name: '產品補貨通知',
    entityType: '產品',
    description: '缺貨產品已補貨',
  },
  product_deactivated: {
    name: '產品下架通知',
    entityType: '產品',
    description: '產品已停用或下架',
  },
  product_price_major_change: {
    name: '產品價格重大變更',
    entityType: '產品',
    description: '產品價格變動超過閾值',
  },

  // 庫存相關
  inventory_low_stock: {
    name: '庫存不足警告',
    entityType: '庫存',
    description: '庫存量低於安全庫存',
  },
  inventory_out_of_stock: {
    name: '庫存缺貨警告',
    entityType: '庫存',
    description: '庫存已耗盡',
  },
  inventory_overstock: {
    name: '庫存過量警告',
    entityType: '庫存',
    description: '庫存量超過最大值',
  },
  inventory_restock: {
    name: '庫存恢復通知',
    entityType: '庫存',
    description: '庫存已補貨',
  },
  inventory_restocked: {
    name: '庫存恢復通知',
    entityType: '庫存',
    description: '庫存已補貨',
  },

  // 客戶相關
  customer_new_registration: {
    name: '新客戶註冊',
    entityType: '客戶',
    description: '新客戶完成註冊',
  },
  customer_vip_upgrade: {
    name: 'VIP客戶升級',
    entityType: '客戶',
    description: '客戶升級為VIP',
  },
  customer_inactive_warning: {
    name: '客戶流失預警',
    entityType: '客戶',
    description: '客戶長時間無活動',
  },
  customer_deactivated: {
    name: '客戶帳戶停用',
    entityType: '客戶',
    description: '客戶帳戶被停用',
  },
  customer_reactivated: {
    name: '客戶帳戶重新啟用',
    entityType: '客戶',
    description: '客戶帳戶重新啟用',
  },

  // 客服相關
  customer_service_urgent: {
    name: '緊急客服請求',
    entityType: '客服',
    description: 'VIP客戶或緊急問題',
  },
  customer_service_new_request: {
    name: '新客服請求',
    entityType: '客服',
    description: '新的客服工單',
  },
  customer_service_overdue: {
    name: '客服逾期警告',
    entityType: '客服',
    description: '客服工單超時未處理',
  },

  // 系統相關
  system_maintenance: {
    name: '系統維護通知',
    entityType: '系統',
    description: '系統維護排程通知',
  },
  system_alert: {
    name: '系統警報',
    entityType: '系統',
    description: '一般系統警報',
  },
  system_security_alert: {
    name: '安全威脅警報',
    entityType: '系統',
    description: '偵測到安全威脅',
  },
  system_performance_issue: {
    name: '系統效能問題',
    entityType: '系統',
    description: '系統效能異常',
  },

  // 權限相關
  security_permission_changed: {
    name: '權限變更通知',
    entityType: '安全',
    description: '用戶權限已變更',
  },
}

// 取得通知模板資訊
export function getNotificationTemplateInfo(type: string): NotificationTemplateInfo | null {
  return notificationTemplateMap[type] || null
}

// 取得實體類型的顯示名稱
export function getEntityTypeDisplayName(entityType: string): string {
  const entityTypeMap: Record<string, string> = {
    order: '訂單',
    product: '產品',
    customer: '客戶',
    inventory: '庫存',
    system: '系統',
    security: '安全',
    conversation: '客服',
    user: '用戶',
    finance: '財務',
    analytics: '分析',
    marketing: '行銷',
  }
  return entityTypeMap[entityType] || entityType
}