<script setup lang="ts">
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('View', 'Login')

import { useRoute, useRouter } from 'vue-router'
import { onMounted, watch, ref } from 'vue'
import { useAuthStore } from '@/store/auth'
import { useI18n } from 'vue-i18n'
import LoginForm from '@/components/auth/LoginForm.vue'

const { t } = useI18n()

const props = defineProps<{
  redirect?: string
}>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// OAuth 處理狀態
const isProcessingOAuth = ref(false)

// 重定向 URL
const getRedirectUrl = () => {
  // 優先使用 props 中的 redirect，其次是 query 參數中的 redirect
  return props.redirect || (route.query.redirect as string) || '/'
}

// 處理 OAuth 回調
onMounted(async () => {
  // 使用路由元數據檢測是否是 OAuth 回調
  if (route.meta.isOAuthCallback) {
    isProcessingOAuth.value = true
    log.debug('在 LoginView 中處理 OAuth 回調，刷新會話')
    try {
      // 確保 auth.refreshSession 存在
      if (typeof auth.refreshSession === 'function') {
        await auth.refreshSession()
      } else {
        log.error('auth.refreshSession 不是一個函數')
      }
    } catch (error) {
      log.error('刷新會話失敗:', error)
    } finally {
      isProcessingOAuth.value = false
    }
  }
})

// 監聽登入狀態變化（只監聽變化，不立即執行）
watch(
  () => auth.isAuthenticated,
  (isAuthenticated, wasAuthenticated) => {
    // 只有當用戶從未認證變為已認證時才跳轉（避免頁面載入時的立即跳轉）
    if (isAuthenticated && !wasAuthenticated) {
      // 登入成功後跳轉回原頁面
      const redirectUrl = getRedirectUrl()
      log.debug('登入成功，跳轉到:', redirectUrl)
      router.push(redirectUrl)
    }
  },
  { immediate: false }, // 不立即檢查，只監聽變化
)
</script>

<template>
  <!-- OAuth 處理中的載入狀態 -->
  <div v-if="isProcessingOAuth" class="flex min-h-screen flex-col items-center justify-center">
    <div class="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
    <p class="text-muted-foreground mt-4 text-sm">
      {{ t('auth.login.processingOAuth') }}
    </p>
  </div>

  <!-- 正常登入表單 -->
  <div v-else>
    <LoginForm :redirect-url="getRedirectUrl()" />
    <!-- <div v-if="auth.error" class="mt-4">
      {{ auth.error }}
    </div> -->
  </div>
</template>
