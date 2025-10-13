import type { User } from '@/types/user'

// 資料庫模型（使用 snake_case）
export interface DbOrder {
  id: string
  user_id: string
  customer_id?: string  // 新增 customer_id 支援 RPC 函數參數
  status: OrderStatus
  total_amount: number
  created_at: string
  // TODO: 可擴充欄位 order_number(訂單編號), payment_method, updated_at
  // 資料庫中通常不會直接包含關聯項目
  order_number?: string
  subtotal?: number
  shipping_fee?: number
  tax_amount?: number
  discount_amount?: number
  shipping_method?: string
  shipping_address?: string | object  // 支援字串或 JSONB 物件
  tracking_number?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  payment_method?: PaymentMethod
  payment_status?: PaymentStatus
  paid_at?: string
  notes?: string
  special_instructions?: string
  coupon_code?: string
  coupon_discount?: number
  confirmed_at?: string
  shipped_at?: string
  completed_at?: string
  delivered_at?: string
  cancelled_at?: string
  updated_at?: string
}

export interface DbOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  // TODO: 可擴充欄位 product_name, total_price(資料庫自動計算欄位(view)，新增後需要修改mapDbOrderItemToOrderItem函式&test)
  status?: OrderItemStatus
  product_name?: string
  product_description?: string
  product_image_url?: string
  product_sku?: string
  variant_name?: string
  variant_attributes?: string
  total_price?: number
  discount_amount?: number
  discount_reason?: string
  created_at?: string
  updated_at?: string
}

// 前端/UI 模型（使用 camelCase）
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// 訂單狀態轉換規則 - 基於資料庫觸發器 validate_order_status_transition
export const ORDER_TRANSITIONS = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.COMPLETED]: [], // 最終狀態
  [OrderStatus.REFUNDED]: [], // 最終狀態
} as const

// 狀態轉換所需的欄位
export const TRANSITION_REQUIRED_FIELDS = {
  [`${OrderStatus.PROCESSING}_${OrderStatus.SHIPPED}`]: ['trackingNumber'],
  [`${OrderStatus.CONFIRMED}_${OrderStatus.PAID}`]: [], // 由付款記錄處理
} as const

// 狀態的業務意義說明
export const ORDER_STATUS_DESCRIPTIONS = {
  [OrderStatus.PENDING]: '待處理 - 訂單已建立，等待確認',
  [OrderStatus.CONFIRMED]: '已確認 - 訂單已確認，等待付款',
  [OrderStatus.PAID]: '已付款 - 付款完成，準備處理',
  [OrderStatus.PROCESSING]: '處理中 - 正在準備商品',
  [OrderStatus.SHIPPED]: '已出貨 - 商品已發送',
  [OrderStatus.DELIVERED]: '已送達 - 商品已送達客戶',
  [OrderStatus.COMPLETED]: '已完成 - 交易完成',
  [OrderStatus.CANCELLED]: '已取消 - 訂單已取消',
  [OrderStatus.REFUNDED]: '已退款 - 退款已完成',
} as const

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  // productName: string;
  quantity: number
  unitPrice: number
  totalPrice: number
  status?: OrderItemStatus
  productName?: string
  productDescription?: string
  productImageUrl?: string
  productSku?: string
  variantName?: string
  variantAttributes?: string
  discountAmount?: number
  discountReason?: string
  createdAt?: string
  updatedAt?: string
}

export interface AddOrderItem {
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

enum OrderItemStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export interface Order {
  id: string
  userId?: string // 前端使用的 camelCase 版本
  // orderNumber: string;
  status: OrderStatus
  totalAmount: number // 前端使用的 camelCase 版本
  createdAt: string // 前端使用的 camelCase 版本
  orderNumber?: string
  subtotal?: number
  shippingFee?: number
  taxAmount?: number
  discountAmount?: number
  shippingMethod?: string
  shippingAddress?: string | object
  trackingNumber?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  paymentMethod?: PaymentMethod
  paymentStatus?: PaymentStatus
  paidAt?: string
  notes?: string
  specialInstructions?: string
  couponCode?: string
  couponDiscount?: number
  confirmedAt?: string
  shippedAt?: string
  completedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  updatedAt?: string
  // Others
  items?: OrderItem[]
  user?: User | null
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PeriodLabel {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_60_DAYS = 'last_60_days',
  LAST_6_MONTHS = 'last_6_months',
  LAST_1_YEAR = 'last_1_year',
}

export type OrderForm = {
  userId: string
  status: OrderStatus
  items: OrderItemForm[]
  // 聯絡資訊
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  // 運送資訊
  shippingMethod?: string
  shippingFee?: number
  shippingAddress?: string
}

export interface OrderItemForm {
  productId: string
  quantity: number
  unitPrice?: number
  totalPrice?: number
}

/**
 * 運送方式類型定義
 * 基於 constants/shipping.ts 中定義的選項
 */
export type ShippingMethodType = 'standard' | 'express' | 'convenience_store'

// TODO: 建立 postgre edge function 處理 order item，計算 totalAmount、unitPrice、totalPrice
