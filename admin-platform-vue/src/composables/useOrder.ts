import { ref, onBeforeUnmount } from 'vue'
import { supabase } from '@/lib/supabase'
import { OrderApiService } from '@/api/services/OrderApiService'
import type {
  Order,
  DbOrder,
  OrderItem,
  AddOrderItem,
  DbOrderItem,
  ApiResponse,
  ApiPaginationResponse,
} from '@/types'
import { convertToISOString } from '@/utils'
import {
  OrderStatus,
  ORDER_TRANSITIONS,
  TRANSITION_REQUIRED_FIELDS,
  ORDER_STATUS_DESCRIPTIONS,
  PeriodLabel,
} from '@/types'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

// get orders with pagination
export async function fetchOrdersWithPagination(options: {
  page: number
  perPage: number
  status?: OrderStatus[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}): Promise<ApiPaginationResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return (await orderApiService.fetchOrdersWithPagination(
    options,
  )) as ApiPaginationResponse
}

export async function addOrder(
  orderData: {
    userId: string
    totalAmount: number
    // 聯絡資訊
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    // 運送資訊
    shippingMethod?: string
    shippingFee?: number
    shippingAddress?: string
  },
  items: AddOrderItem[],
) {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.createOrderWithItems(orderData, items)
}

/**
 * 根據 ID 獲取訂單
 * @param id 訂單 ID
 * @returns ApiResponse<Order> 訂單資料或錯誤訊息
 */
export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.getOrderById(id)
}

/**
 * 根據訂單編號獲取訂單
 * @param orderNumber 訂單編號
 * @returns ApiResponse<Order> 訂單資料或錯誤訊息
 */
export async function getOrderByOrderNumber(orderNumber: string): Promise<ApiResponse<Order>> {
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.getOrderByOrderNumber(orderNumber)
}

export async function getOrderByUserId(
  userId: string,
): Promise<ApiResponse<Order[]>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.getOrderByUserId(userId)
}

//   update order status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<ApiResponse<Order>> {
  // 如果狀態要改為 paid，需要先創建完成付款記錄
  if (status === 'paid') {
    return await updateOrderToPaid(orderId)
  }

  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.updateOrderStatus(orderId, status)
}

// 專門處理訂單改為已付款狀態的函數
export async function updateOrderToPaid(
  orderId: string,
): Promise<ApiResponse<Order>> {
  try {
    // 首先獲取訂單資訊
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return {
        success: false,
        error: orderError?.message || t('order.errors.orderNotFound'),
      }
    }

    // 檢查是否已有完成的付款記錄（使用 maybeSingle 避免 406 錯誤）
    const { data: existingPayments, error: paymentQueryError } = await supabase
      .from('payments')
      .select('id, method')
      .eq('order_id', orderId)
      .eq('status', 'completed')

    if (paymentQueryError) {
      return {
        success: false,
        error: `${t('order.errors.statusChangeFailed')}: ${paymentQueryError.message}`,
      }
    }

    // 如果沒有完成的付款記錄，創建一個管理員手動標記的記錄
    if (!existingPayments || existingPayments.length === 0) {
      // 步驟 1: 如果訂單是 pending 狀態，先設為 confirmed（遵循狀態轉換規則）
      if (order.status === 'pending') {
        const { error: confirmError } = await supabase
          .from('orders')
          .update({
            status: 'confirmed',
            confirmed_at: convertToISOString(new Date()),
            updated_at: convertToISOString(new Date()),
          })
          .eq('id', orderId)

        if (confirmError) {
          return {
            success: false,
            error: `${t('order.errors.updateOrderFailed')}: ${confirmError.message}`,
          }
        }
      }

      // 步驟 2: 插入付款記錄，觸發器會自動將訂單狀態設為 paid
      const { error: paymentError } = await supabase.from('payments').insert({
        order_id: orderId,
        method: 'cash_on_delivery', // 使用允許的付款方式，但用 transaction_id 標示為管理員操作
        amount: order.total_amount,
        status: 'completed',
        paid_at: convertToISOString(new Date()),
        transaction_id: `ADMIN_MANUAL_${Date.now()}_${orderId.substring(0, 8)}`, // 明確標示管理員手動操作
      })

      if (paymentError) {
        return {
          success: false,
          error: `${t('order.errors.statusChangeFailed')}: ${paymentError.message}`,
        }
      }
    }

    // 獲取最新的訂單狀態（觸發器可能已經更新了狀態）
    const { data: updatedOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !updatedOrder) {
      return {
        success: false,
        error: fetchError?.message || t('order.errors.loadOrdersFailed'),
      }
    }

    return { success: true, data: updatedOrder }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : t('order.errors.statusChangeFailed')
    return { success: false, error: errorMessage }
  }
}

/**
 * 獲取訂單摘要統計
 * @param periodLabels 時間段標籤數組
 * @returns ApiResponse 訂單摘要統計資料或錯誤訊息
 */
export async function getOrderSummary(
  periodLabels: PeriodLabel[] = [PeriodLabel.TODAY, PeriodLabel.LAST_30_DAYS],
): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.getOrderSummary(periodLabels)
}


//  get items by order id
export async function fetchOrderItems(orderId: string): Promise<DbOrderItem[]> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  const result = await orderApiService.fetchOrderItems(orderId)
  if (!result.success) {
    throw new Error(typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to fetch order items')
  }
  return result.data || []
}

// DI for testability
export function useOrdersRealtime(
  fetchOrdersWithPaginationImpl = fetchOrdersWithPagination,
  supabaseImpl = supabase,
  mapDbOrderToOrderImpl = mapDbOrderToOrder,
): any {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // Realtime subscription
  let channel: any = null

  // Initial data loading
  async function initializeRealtimeOrders(
    perPage: number,
    status?: OrderStatus[],
  ) {
    const options = {
      perPage,
      status,
      page: 1,
      sortBy: 'created_at',
      sortOrder: 'desc' as 'asc' | 'desc',
    }
    const { data } = await fetchOrdersWithPaginationImpl(options)
    orders.value = (data || []).map(mapDbOrderToOrderImpl)
    subscribeToOrderChanges(perPage)
  }

  // Subscribe to real-time updates
  function subscribeToOrderChanges(perPage: number) {
    channel = supabaseImpl
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Add the new order to the list
            orders.value.push(mapDbOrderToOrderImpl(payload.new))

            // Update current order
            currentOrder.value = mapDbOrderToOrderImpl(payload.new)
          } else if (payload.eventType === 'UPDATE') {
            // Update the existing order
            const idx = orders.value.findIndex((o) => o.id === payload.new.id)
            if (idx !== -1) {
              orders.value[idx] = mapDbOrderToOrderImpl(payload.new)
            }

            // Update current order
            currentOrder.value = mapDbOrderToOrderImpl(payload.new)
          } else if (payload.eventType === 'DELETE') {
            // Remove the order
            orders.value = orders.value.filter((o) => o.id !== payload.old.id)

            // Update current order
            if (currentOrder.value?.id === payload.old.id) {
              currentOrder.value = null
            }
          }

          //  處理排序
          orders.value = orders.value
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, perPage)

          // 如果少於 10 筆，補最新一筆
          if (payload.eventType === 'DELETE' && orders.value.length < perPage) {
            const excludeIds = orders.value.map((o) => o.id)
            const extra = await fetchLatestOrder(excludeIds)
            if (extra) {
              orders.value.push(mapDbOrderToOrderImpl(extra))
            }
          }
        },
      )
      .subscribe()
  }

  async function fetchLatestOrder(excludeIds: string[] = []) {
    // 查詢第 11 筆（或補足缺的）
    const { data } = await supabaseImpl
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(orders.value.length, orders.value.length) // 只抓下一筆
      .not('id', 'in', `(${excludeIds.join(',')})`)
    return data && data.length > 0 ? data[0] : null
  }

  // Unsubscribe from real-time updates
  function unsubscribeFromOrderChanges() {
    if (channel) {
      supabaseImpl.removeChannel(channel)
      channel = null
    }
  }

  // Lifecycle hooks
  onBeforeUnmount(() => {
    unsubscribeFromOrderChanges()
  })

  return {
    // State
    orders,
    currentOrder,
    loading,
    error,

    // Methods
    initializeRealtimeOrders,
  }
}

/**
 * 在單一查詢中獲取訂單及其項目
 * @param orderId 訂單 ID
 * @returns ApiResponse<Order> 包含項目的訂單資料或錯誤訊息
 */
export async function getOrderWithItems(
  orderId: string,
): Promise<ApiResponse<Order>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const orderApiService = new OrderApiService(supabase)
  return await orderApiService.getOrderWithItems(orderId)
}

// Mapping functions for DB to frontend models
export function mapDbOrderToOrder(dbOrder: DbOrder): Order {
  return {
    id: dbOrder.id,
    userId: dbOrder.user_id,
    status: dbOrder.status,
    totalAmount: dbOrder.total_amount,
    createdAt: dbOrder.created_at,
    orderNumber: dbOrder.order_number,
    subtotal: dbOrder.subtotal,
    shippingFee: dbOrder.shipping_fee,
    taxAmount: dbOrder.tax_amount,
    discountAmount: dbOrder.discount_amount,
    shippingMethod: dbOrder.shipping_method,
    trackingNumber: dbOrder.tracking_number,
    contactName: dbOrder.contact_name,
    contactEmail: dbOrder.contact_email,
    contactPhone: dbOrder.contact_phone,
    paymentMethod: dbOrder.payment_method,
    paymentStatus: dbOrder.payment_status,
    paidAt: dbOrder.paid_at,
    notes: dbOrder.notes,
    specialInstructions: dbOrder.special_instructions,
    couponCode: dbOrder.coupon_code,
    couponDiscount: dbOrder.coupon_discount,
    confirmedAt: dbOrder.confirmed_at,
    shippedAt: dbOrder.shipped_at,
    completedAt: dbOrder.completed_at,
    deliveredAt: dbOrder.delivered_at,
    cancelledAt: dbOrder.cancelled_at,
    updatedAt: dbOrder.updated_at,
    // items: dbOrder.items,
  }
}

export function mapDbOrderItemToOrderItem(dbItem: DbOrderItem): OrderItem {
  return {
    id: dbItem.id,
    orderId: dbItem.order_id,
    productId: dbItem.product_id,
    quantity: dbItem.quantity,
    unitPrice: dbItem.unit_price,
    totalPrice: dbItem.quantity * dbItem.unit_price,
    status: dbItem.status,
    productName: dbItem.product_name,
    productDescription: dbItem.product_description,
    productImageUrl: dbItem.product_image_url,
    productSku: dbItem.product_sku,
    variantName: dbItem.variant_name,
    variantAttributes: dbItem.variant_attributes,
    discountAmount: dbItem.discount_amount,
    discountReason: dbItem.discount_reason,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  }
}

// 依據 order id 取得 order items 並加入
export async function mapDbOrderWithItemsToOrder(
  dbOrder: DbOrder,
): Promise<Order> {
  const order = mapDbOrderToOrder(dbOrder)
  const items = await fetchOrderItems(order.id)
  order.items = items.map(mapDbOrderItemToOrderItem)
  return order
}

// ============================================================================
// 狀態機思維：訂單狀態轉換輔助函數
// ============================================================================

/**
 * 取得訂單狀態的有效下個狀態
 * @param currentStatus 當前狀態
 * @returns 可轉換的狀態列表
 */
export function getValidNextStates(
  currentStatus: OrderStatus,
): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[currentStatus] || []
}

/**
 * 檢查狀態轉換是否有效
 * @param from 起始狀態
 * @param to 目標狀態
 * @returns 是否可以轉換
 */
export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  return getValidNextStates(from).includes(to)
}

/**
 * 取得狀態轉換所需的欄位
 * @param from 起始狀態
 * @param to 目標狀態
 * @returns 必填欄位列表
 */
export function getRequiredFields(
  from: OrderStatus,
  to: OrderStatus,
): readonly string[] {
  const transitionKey =
    `${from}_${to}` as keyof typeof TRANSITION_REQUIRED_FIELDS
  return TRANSITION_REQUIRED_FIELDS[transitionKey] || []
}

/**
 * 驗證訂單狀態轉換
 * @param order 訂單資料
 * @param newStatus 新狀態
 * @returns 驗證結果
 */
export function validateTransition(
  order: Order,
  newStatus: OrderStatus,
): {
  valid: boolean
  error?: string
  missingFields?: string[]
} {
  const currentStatus = order.status

  // 檢查狀態轉換是否有效
  if (!canTransitionTo(currentStatus, newStatus)) {
    return {
      valid: false,
      error: t('order.dialogs.statusTransition.invalidTransitionDesc'),
    }
  }

  // 檢查必填欄位
  const requiredFields = getRequiredFields(currentStatus, newStatus)
  const missingFields: string[] = []

  for (const field of requiredFields) {
    if (field === 'trackingNumber' && !order.trackingNumber) {
      missingFields.push(t('order.dialogs.statusTransition.trackingNumber'))
    }
    // 可以繼續添加其他欄位檢查
  }

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: t('order.dialogs.statusTransition.missingRequiredFieldsDesc'),
      missingFields,
    }
  }

  return { valid: true }
}

/**
 * 取得狀態的顯示資訊
 * @param status 訂單狀態
 * @returns 狀態顯示資訊
 */
export function getStatusDisplayInfo(status: OrderStatus): {
  label: string
  description: string
  color: string
  icon: string
} {
  const statusMap = {
    [OrderStatus.PENDING]: {
      label: t('order.statusLabels.pending'),
      color: 'yellow',
      icon: 'CircleHelp',
    },
    [OrderStatus.CONFIRMED]: {
      label: t('order.statusLabels.confirmed'),
      color: 'blue',
      icon: 'CheckCircle',
    },
    [OrderStatus.PAID]: {
      label: t('order.statusLabels.paid'),
      color: 'green',
      icon: 'Circle',
    },
    [OrderStatus.PROCESSING]: {
      label: t('order.statusLabels.processing'),
      color: 'blue',
      icon: 'Settings',
    },
    [OrderStatus.SHIPPED]: {
      label: t('order.statusLabels.shipped'),
      color: 'purple',
      icon: 'Timer',
    },
    [OrderStatus.DELIVERED]: {
      label: t('order.statusLabels.delivered'),
      color: 'indigo',
      icon: 'CheckCircle2',
    },
    [OrderStatus.COMPLETED]: {
      label: t('order.statusLabels.completed'),
      color: 'green',
      icon: 'CircleCheck',
    },
    [OrderStatus.CANCELLED]: {
      label: t('order.statusLabels.cancelled'),
      color: 'red',
      icon: 'CircleX',
    },
    [OrderStatus.REFUNDED]: {
      label: t('order.statusLabels.refunded'),
      color: 'gray',
      icon: 'RotateCcw',
    },
  }

  const info = statusMap[status] || statusMap[OrderStatus.PENDING]

  return {
    label: info.label,
    description: ORDER_STATUS_DESCRIPTIONS[status],
    color: info.color,
    icon: info.icon,
  }
}

/**
 * 檢查訂單是否可以進行批量操作
 * @param orders 訂單列表
 * @param targetStatus 目標狀態
 * @returns 批量操作結果分析
 */
export function validateBulkTransition(
  orders: Order[],
  targetStatus: OrderStatus,
): {
  validOrders: Order[]
  invalidOrders: { order: Order; reason: string }[]
  canProceed: boolean
} {
  const validOrders: Order[] = []
  const invalidOrders: { order: Order; reason: string }[] = []

  orders.forEach((order) => {
    const validation = validateTransition(order, targetStatus)
    if (validation.valid) {
      validOrders.push(order)
    } else {
      invalidOrders.push({
        order,
        reason: validation.error || t('errors.unknownError'),
      })
    }
  })

  return {
    validOrders,
    invalidOrders,
    canProceed: validOrders.length > 0,
  }
}
