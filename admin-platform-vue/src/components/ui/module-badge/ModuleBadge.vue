<script setup lang="ts">
import type { LucideIcon } from 'lucide-vue-next'

/**
 * 模組類型定義 - 支援完整的模組分類系統
 */
export type ModuleType =
  | 'system'
  | 'user'
  | 'order'
  | 'product'
  | 'conversation'
  | 'customer'
  | 'finance'
  | 'security'
  | 'analytics'
  | 'marketing'
  | 'inventory'
  | 'support'
  | 'campaign'
  | 'notification'
  | 'report'

interface Props {
  /**
   * 模組類型
   */
  module?: ModuleType

  /**
   * 徽章文字內容
   */
  children?: string

  /**
   * 自定義 CSS 類名
   */
  class?: string

  /**
   * 圖示組件（可選）
   */
  icon?: LucideIcon
}

const props = withDefaults(defineProps<Props>(), {
  module: 'system',
})

/**
 * 模組色彩映射 - 使用 Tailwind 完整調色板
 * 每個模組都有專屬的視覺識別，支援主題切換
 */
const moduleColorMap: Record<ModuleType, string> = {
  // 核心系統模組
  system: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
  user: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700',

  // 業務核心模組
  order: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700',
  product: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
  customer: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700',
  inventory: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900 dark:text-teal-300 dark:border-teal-700',

  // 服務支援模組
  conversation: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
  support: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700',
  notification: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900 dark:text-violet-300 dark:border-violet-700',

  // 營運管理模組
  finance: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700',
  security: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700',

  // 分析行銷模組
  analytics: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:border-emerald-700',
  marketing: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900 dark:text-pink-300 dark:border-pink-700',
  campaign: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900 dark:text-fuchsia-300 dark:border-fuchsia-700',
  report: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900 dark:text-lime-300 dark:border-lime-700',
}

const colorClass = moduleColorMap[props.module] || moduleColorMap.system
</script>

<template>
  <span :class="[
    // 基礎樣式
    'inline-flex items-center justify-center rounded-md border px-1 py-1 text-xs font-medium text-center',
    'whitespace-nowrap shrink-0 transition-all duration-200 ease-in-out',

    // 模組專屬顏色
    colorClass,

    // 用戶自定義類名
    props.class
  ]">
    <!-- 圖示（如果提供） -->
    <component v-if="props.icon" :is="props.icon" class="h-3.5 w-3.5 shrink-0" />

    <!-- 內容區 -->
    <slot>{{ children }}</slot>
  </span>
</template>