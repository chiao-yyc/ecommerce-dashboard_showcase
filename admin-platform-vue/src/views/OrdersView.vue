<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'Orders')

import OrderList from '@/components/order/OrderList.vue'
import OverviewCard from '@/components/cards/OverviewCard.vue'
import { Button } from '@/components/ui/button'
import { getOrderSummary } from '@/composables/useOrder'
import { ref, onMounted, computed, nextTick } from 'vue'
// import { useRouter } from 'vue-router'
import { ArrowUpRight } from 'lucide-vue-next'
import {
  orderFormFields,
  orderFormGroups,
  initialOrderValues,
  orderFormSchema,
} from '@/types/forms/orderFormConfig'
import { formatCurrency } from '@/utils'
import type { OrderForm } from '@/types/order'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { addOrder } from '@/composables/useOrder'
import DynamicForm from '@/components/forms/DynamicForm.vue'
import FormSheet from '@/components/forms/FormSheet.vue'
import { i18n } from '@/plugins/i18n'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'vue-sonner'

const { t } = i18n.global

// const router = useRouter()

// 訂單摘要資料
const orderSummary = ref<any>(null)
const summaryLoading = ref(false)
const summaryError = ref<string | null>(null)


async function getSummary() {
  summaryLoading.value = true
  summaryError.value = null
  try {
    const response = await getOrderSummary()
    if (response.success && response.data) {
      orderSummary.value = response.data
    } else {
      summaryError.value =
        response.error?.toString() || t('order.errors.loadOrdersFailed')
    }
  } catch (err) {
    summaryError.value =
      err instanceof Error ? err.message : t('order.errors.loadOrdersFailed')
  } finally {
    summaryLoading.value = false
    log.debug('orderSummary.value', orderSummary.value)
  }
}

/** Sheet 新增訂單邏輯 ---- START ---- */
// 確認表單資料是否ready for 新增表單
// const isReadyFormNew = ref(false)
// const categories = ref<any[]>([])
// 表單操作
const sheetOpen = ref(false)
const formRef = ref<{
  values: OrderForm
  errors: any
  resetForm: (data: OrderForm) => void
  validate: () => {}
} | null>(null)

const { hasUnsavedChanges, updateOriginalState, resetToOriginal } =
  useUnsavedChanges(() => {
    return formRef.value ? { ...formRef.value.values } : {}
  }, sheetOpen)

// 打開 sheet 時初始化表單並保存初始狀態
const initialValues = initialOrderValues
const totalAmount = computed(() => {
  return formRef.value?.values.items.reduce((total, item) => {
    return total + (item.totalPrice || 0)
  }, 0)
})

const openSheet = () => {
  sheetOpen.value = true
  // 使用 nextTick 確保 DOM 已更新
  nextTick(() => {
    if (formRef.value) {
      // 設置初始值（如果需要）
      formRef.value.resetForm(initialValues)
      // 更新原始狀態
      updateOriginalState()
    }
  })
}
// watch(sheetOpen, (val) => {
//   if (val) {
//     // 開啟表單後再做初始化，保證順序正確
//     nextTick(() => {
//       if (formRef.value) {
//         formRef.value.resetForm(initialValues)
//         updateOriginalState()
//       }
//     })
//   }
// })

// 處理表單提交
const onSubmit = async (values: OrderForm) => {
  /// 處理表單提交邏輯
  const result = await addOrder(
    {
      userId: values.userId,
      totalAmount: totalAmount.value ?? 0,
      // 聯絡資訊
      contactName: values.contactName,
      contactPhone: values.contactPhone,
      contactEmail: values.contactEmail,
      // 運送資訊
      shippingMethod: values.shippingMethod,
      shippingFee: values.shippingFee,
      shippingAddress: values.shippingAddress,
    },
    values.items.map((item) => ({
      ...item,
      totalPrice: item.totalPrice ?? 0,
      unitPrice: item.unitPrice ?? 0,
    })),
  )

  if (!result.success) {
    log.error(t('order.errors.createOrderFailed'), result.error)
    toast.error(t('order.errors.createOrderFailed'), {
      description: result.error
    })
    return
  }

  // 檢查返回的資料結構
  log.debug('訂單創建成功，返回結果:', result)

  // 檢查 result.data 是否存在
  if (!result.data) {
    log.error(t('order.errors.createOrderFailed'))
    toast.error(t('order.errors.createOrderFailed'))
    return
  }

  // 檢查 order_id 是否存在
  const newOrderId = result.data?.order_id

  if (!newOrderId || typeof newOrderId !== 'string') {
    log.error(t('order.errors.createOrderFailed'), {
      issue: 'Invalid order_id',
      orderId: newOrderId,
      response: result
    })
    toast.error(t('order.errors.createOrderFailed'))
    return
  }

  // 顯示成功通知 - 使用 order_id
  const displayId = result.data?.order_id || newOrderId
  const idLabel = '訂單 ID'

  toast.success(t('order.messages.createOrderSuccess'), {
    description: `${idLabel}: ${displayId}`
  })

  // 更新原始數據
  resetToOriginal((data: OrderForm) => {
    formRef.value?.resetForm(data)
  })

  sheetOpen.value = false
}

const handleDiscard = () => {
  resetToOriginal((data: OrderForm) => {
    formRef.value?.resetForm(data)
  })
  sheetOpen.value = false
}
// 處理表單提交
async function handleFormSubmit() {
  if (!formRef.value) return

  // 執行表單驗證
  // const _validationResult = await formRef.value.validate()
  await formRef.value.validate()
  
  // 檢查是否有驗證錯誤
  if (Object.keys(formRef.value.errors).length > 0) {
    log.debug('表單驗證失敗', formRef.value.errors)
    toast.error('表單驗證失敗', {
      description: '請檢查表單中標示錯誤的欄位'
    })
    return
  }

  const formValues = formRef.value.values
  
  // 檢查總金額是否有效
  if ((totalAmount.value || 0) <= 0) {
    log.debug('訂單總金額不得為零或負數')
    toast.error('訂單金額無效', {
      description: '訂單總金額必須大於零'
    })
    return
  }

  await onSubmit(formValues)
}
/** Sheet 新增商品邏輯 ---- END ---- */

onMounted(async () => {
  await getSummary()
})
</script>

<template>
  <ScrollArea>
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <h1 class="text-lg font-semibold tracking-tight">
          {{ t('order.views.pageTitle') }}
        </h1>
        <!-- <Button @click="router.push({ name: 'order-add' })">{{ t('order.views.addOrder') }}</Button> -->
        <Button @click="openSheet">{{ t('order.views.addOrder') }}</Button>
      </div>
      <!-- overview -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard :title="t('order.overview.totalOrders')" :value="orderSummary?.last_30_days?.total_orders || 0" :footer="t('order.overview.last30Days')"
          :loading="summaryLoading">
          <template #icon>
            <ArrowUpRight class="size-4" />
          </template>
        </OverviewCard>
        <OverviewCard :title="t('order.overview.totalAmount')" :value="orderSummary?.last_30_days?.total_amount
          ? formatCurrency(orderSummary.last_30_days.total_amount)
          : formatCurrency(0)
          " :footer="t('order.overview.last30Days')" :loading="summaryLoading">
          <template #icon>
            <ArrowUpRight class="size-4" />
          </template>
        </OverviewCard>
        <OverviewCard :title="t('order.overview.totalCancelled')" :value="orderSummary?.last_30_days?.cancelled_orders || 0"
          :footer="t('order.overview.last30Days')" :loading="summaryLoading">
          <template #icon>
            <ArrowUpRight class="size-4" />
          </template>
        </OverviewCard>
        <OverviewCard :title="t('order.overview.totalCompleted')" :value="orderSummary?.last_30_days?.completed_orders || 0"
          :footer="t('order.overview.last30Days')" :loading="summaryLoading">
          <template #icon>
            <ArrowUpRight class="size-4" />
          </template>
        </OverviewCard>
      </div>

      <!-- 訂單列表 -->
      <OrderList />
    </div>

    <!-- 新增訂單 -->
    <FormSheet v-model:open="sheetOpen" :hasUnsavedChanges="hasUnsavedChanges" :title="t('order.views.addOrder')"
      :cancelText="t('actions.cancel')" :confirmText="t('actions.add')" @submit="handleFormSubmit"
      @discard="handleDiscard">
      <template #default>
        <DynamicForm id="form" ref="formRef" :initialValues="initialValues" :schema="orderFormSchema"
          :fields="orderFormFields" :groups="orderFormGroups" @submit="handleFormSubmit" @change="() => { }" />
      </template>
    </FormSheet>

  </ScrollArea>
</template>
