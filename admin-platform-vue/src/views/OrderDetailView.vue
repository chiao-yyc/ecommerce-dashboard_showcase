<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'OrderDetail')

import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderByOrderNumber } from '@/composables/useOrder'
import type { Order } from '@/types'
import { MapPin, CreditCard, Package, Clock, User, Gift } from 'lucide-vue-next'
import { formatDataTableEmptyValue, formatDate, formatCurrency } from '@/utils'

import UserInfoCard from '@/components/cards/UserInfoCard.vue'
import InfoCard from '@/components/cards/InfoCard.vue'
import EditableInfoCard from '@/components/cards/EditableInfoCard.vue'
import AmountDetailsCard from '@/components/cards/AmountDetailsCard.vue'
import ItemList from '@/components/order/ItemList.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useOrderEdit } from '@/composables/useOrderEdit'
import type { EditableField } from '@/components/cards/EditableInfoCard.vue'

const route = useRoute()
const orderNumber = route.params.orderNumber as string
const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// 編輯功能
const { updateOrderFields, getShippingMethodOptions, validateEmail, validatePhone, validateTrackingNumber, isUpdating } = useOrderEdit()

const userInfo = computed(() => {
  if (!order.value?.user) return null
  return order.value.user
})

const orderSummary = computed(() => {
  if (!order.value) return []
  return [
    {
      label: 'Order Number',
      value: order.value.orderNumber || `#${order.value.id.slice(0, 8)}`,
    },
    {
      label: 'Order Status',
      value: order.value.status?.toUpperCase() || 'UNKNOWN',
    },
    {
      label: 'Total Amount',
      value: formatCurrency(order.value.totalAmount),
    },
    {
      label: 'Created At',
      value: order.value.createdAt ? formatDate(order.value.createdAt) : formatDataTableEmptyValue(null),
    },
  ]
})

const amountDetails = computed(() => {
  if (!order.value) return []
  return [
    {
      label: 'Subtotal',
      value: order.value.subtotal ? formatCurrency(order.value.subtotal) : formatDataTableEmptyValue(null),
      isHighlight: false,
    },
    {
      label: 'Shipping Fee',
      value: order.value.shippingFee ? formatCurrency(order.value.shippingFee) : formatDataTableEmptyValue(null),
      isHighlight: false,
    },
    {
      label: 'Tax Amount',
      value: order.value.taxAmount ? formatCurrency(order.value.taxAmount) : formatDataTableEmptyValue(null),
      isHighlight: false,
    },
    {
      label: 'Discount',
      value: order.value.discountAmount ? `-${formatCurrency(order.value.discountAmount)}` : formatDataTableEmptyValue(null),
      isHighlight: false,
      isDiscount: true,
    },
    {
      label: 'Total Amount',
      value: formatCurrency(order.value.totalAmount),
      isHighlight: true,
      isTotal: true,
    },
  ]
})

// 可編輯的運送資訊欄位
const editableShippingFields = computed((): EditableField[] => {
  if (!order.value) return []
  return [
    {
      key: 'shippingMethod',
      label: 'Shipping Method',
      value: order.value.shippingMethod || '',
      type: 'select',
      options: getShippingMethodOptions(),
      placeholder: '請選擇運送方式'
    },
    {
      key: 'shippingAddress',
      label: 'Shipping Address',
      value: typeof order.value.shippingAddress === 'string'
        ? order.value.shippingAddress
        : order.value.shippingAddress
        ? Object.values(order.value.shippingAddress).filter(Boolean).join(', ')
        : '',
      type: 'textarea',
      placeholder: '請輸入運送地址'
    },
    {
      key: 'trackingNumber',
      label: 'Tracking Number',
      value: order.value.trackingNumber || '',
      type: 'text',
      placeholder: '請輸入追蹤號碼（英數字、連字號、底線，3-50字元）',
      validation: validateTrackingNumber
    }
  ]
})


// 可編輯的聯絡資訊欄位
const editableContactFields = computed((): EditableField[] => {
  if (!order.value) return []
  return [
    {
      key: 'contactName',
      label: 'Contact Name',
      value: order.value.contactName || '',
      type: 'text',
      placeholder: '請輸入聯絡人姓名'
    },
    {
      key: 'contactPhone',
      label: 'Contact Phone',
      value: order.value.contactPhone || '',
      type: 'tel',
      placeholder: '請輸入聯絡電話',
      validation: validatePhone
    },
    {
      key: 'contactEmail',
      label: 'Contact Email',
      value: order.value.contactEmail || '',
      type: 'email',
      placeholder: '請輸入聯絡 Email',
      validation: validateEmail
    }
  ]
})


const payment = computed(() => {
  if (!order.value) return []
  return [
    {
      label: 'Payment Method',
      value: formatDataTableEmptyValue(order.value.paymentMethod || null),
    },
    {
      label: 'Paid At',
      value: order.value.paidAt ? formatDate(order.value.paidAt) : formatDataTableEmptyValue(null),
    },
    {
      label: 'Payment Status',
      value: formatDataTableEmptyValue(order.value.paymentStatus || null),
    },
  ]
})

const timelineInfo = computed(() => {
  if (!order.value) return []
  return [
    {
      label: 'Created At',
      value: order.value.createdAt ? formatDate(order.value.createdAt) : formatDataTableEmptyValue(null),
    },
    {
      label: 'Updated At',
      value: order.value.updatedAt ? formatDate(order.value.updatedAt) : formatDataTableEmptyValue(null),
    },
    {
      label: 'Confirmed At',
      value: order.value.confirmedAt ? formatDate(order.value.confirmedAt) : formatDataTableEmptyValue(null),
    },
    {
      label: 'Completed At',
      value: order.value.completedAt ? formatDate(order.value.completedAt) : formatDataTableEmptyValue(null),
    },
    {
      label: 'Cancelled At',
      value: order.value.cancelledAt ? formatDate(order.value.cancelledAt) : formatDataTableEmptyValue(null),
    },
  ]
})

// 可編輯的備註欄位
const editableNotesFields = computed((): EditableField[] => {
  if (!order.value) return []
  return [
    {
      key: 'notes',
      label: 'Notes',
      value: order.value.notes || '',
      type: 'textarea',
      placeholder: '請輸入內部備註'
    },
    {
      key: 'specialInstructions',
      label: 'Special Instructions',
      value: order.value.specialInstructions || '',
      type: 'textarea',
      placeholder: '請輸入特殊處理指示'
    }
  ]
})


async function loadOrder() {
  loading.value = true
  error.value = null
  const response = await getOrderByOrderNumber(orderNumber)
  if (response.success && response.data) {
    order.value = response.data

    // 資料完整性檢查和 console 驗證
    log.debug('訂單載入完成:', {
      orderId: order.value.id,
      orderNumber: order.value.orderNumber,
      itemsCount: order.value.items?.length || 0,
      hasUser: !!order.value.user,
      userEmail: order.value.user?.email,
      hasContactInfo: !!(order.value.contactName || order.value.contactPhone || order.value.contactEmail),
      hasShippingInfo: !!(order.value.shippingMethod || order.value.shippingAddress || order.value.trackingNumber)
    })

    // 關聯資料完整性檢查
    if (!order.value.items || order.value.items.length === 0) {
      log.warn('⚠️ 訂單沒有商品項目或項目為空')
    }

    if (!order.value.user) {
      log.warn('⚠️ 訂單沒有關聯的用戶資料')
    }
  } else {
    error.value = response.error?.toString() || '無法取得訂單資料'
    log.error('訂單載入失敗:', {
      orderNumber,
      error: response.error
    })
  }
  loading.value = false
}

// 處理訂單欄位更新
const handleOrderUpdate = async (updates: Record<string, string>) => {
  if (!order.value) {
    log.error('沒有訂單資料，無法更新')
    return
  }

  log.debug('準備更新訂單:', {
    orderId: order.value.id,
    updates: updates,
    originalValues: {
      trackingNumber: order.value.trackingNumber,
      shippingMethod: order.value.shippingMethod,
      shippingAddress: order.value.shippingAddress,
      contactName: order.value.contactName,
      contactPhone: order.value.contactPhone,
      contactEmail: order.value.contactEmail,
      notes: order.value.notes,
      specialInstructions: order.value.specialInstructions
    }
  })

  const result = await updateOrderFields(order.value.id, updates)

  log.debug('API 回應:', result)

  if (result.success && result.data) {
    // 保存更新前的關聯資料
    const oldOrder = { ...order.value }
    const preservedItems = order.value!.items
    const preservedUser = order.value!.user

    log.debug('更新前關聯資料檢查:', {
      itemsCount: preservedItems?.length || 0,
      hasUser: !!preservedUser,
      userId: preservedUser?.id
    })

    // 選擇性欄位更新：只更新實際修改的欄位，保留關聯資料
    Object.keys(updates).forEach(key => {
      if (result.data![key as keyof Order] !== undefined) {
        ;(order.value as any)[key] = result.data![key as keyof Order]
      }
    })

    // 確保關聯資料不丟失
    order.value!.items = preservedItems
    order.value!.user = preservedUser

    log.debug('更新後關聯資料檢查:', {
      itemsCount: order.value!.items?.length || 0,
      hasUser: !!order.value!.user,
      userId: order.value!.user?.id
    })

    log.debug('訂單更新成功:', {
      updates: updates,
      oldValues: Object.keys(updates).reduce((acc, key) => {
        acc[key] = oldOrder[key as keyof Order]
        return acc
      }, {} as Record<string, any>),
      newValues: Object.keys(updates).reduce((acc, key) => {
        acc[key] = order.value![key as keyof Order]
        return acc
      }, {} as Record<string, any>)
    })
  } else {
    log.error('訂單更新失敗:', {
      error: result.error,
      orderId: order.value.id,
      attemptedUpdates: updates
    })
    // 這裡可以加入 toast 通知
  }
}

onMounted(async () => {
  await loadOrder()
  log.debug('order.value', order.value)
  log.debug('order.value?.items', order.value?.items)
})
</script>

<template>
  <ScrollArea>
    <div class="flex flex-col gap-6">
      <!-- 第一排: 重點資訊 (2欄) -->
      <div class="grid gap-4 md:grid-cols-2">
        <InfoCard :infos="orderSummary" :loading="loading" :gridClass="'grid-cols-2'" title="Order Summary">
          <template #icon>
            <Package class="size-6" />
          </template>
        </InfoCard>
        <AmountDetailsCard :amount-details="amountDetails" :total-amount="formatCurrency(order?.totalAmount || 0)"
          :loading="loading" />
      </div>

      <!-- 第二排: 核心業務資訊 (3欄) -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UserInfoCard v-if="userInfo" :user="userInfo" :status="order?.status" :loading="loading" />
        <div v-else class="bg-muted/50 flex items-center justify-center rounded-lg border p-8">
          <span class="text-muted-foreground">User information not available</span>
        </div>
        <EditableInfoCard
          :fields="editableShippingFields"
          :loading="loading || isUpdating"
          :can-edit="true"
          title="Shipping Information"
          @save="handleOrderUpdate"
        >
          <template #icon>
            <MapPin class="size-6" />
          </template>
        </EditableInfoCard>
        <InfoCard :infos="payment" :loading="loading" :gridClass="'grid-cols-1'" title="Payment Information">
          <template #icon>
            <CreditCard class="size-6" />
          </template>
        </InfoCard>
      </div>

      <!-- 第三排: 詳細資訊 (3欄) -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <EditableInfoCard
          :fields="editableContactFields"
          :loading="loading || isUpdating"
          :can-edit="true"
          title="Contact Information"
          @save="handleOrderUpdate"
        >
          <template #icon>
            <User class="size-6" />
          </template>
        </EditableInfoCard>
        <InfoCard :infos="timelineInfo" :loading="loading" :gridClass="'grid-cols-1'" title="Order Timeline">
          <template #icon>
            <Clock class="size-6" />
          </template>
        </InfoCard>
        <EditableInfoCard
          :fields="editableNotesFields"
          :loading="loading || isUpdating"
          :can-edit="true"
          title="Notes & Instructions"
          @save="handleOrderUpdate"
        >
          <template #icon>
            <Gift class="size-6" />
          </template>
        </EditableInfoCard>
      </div>

      <!-- 訂單項目清單 -->
      <ItemList :items="order?.items || []" :loading="loading" />
    </div>
  </ScrollArea>
</template>
