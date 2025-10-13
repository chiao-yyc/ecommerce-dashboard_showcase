import { createApp } from 'vue'
import './index.css'
import './styles/main.scss'
import App from './App.vue'
import { pinia } from './store'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from '@/lib/queryClient'
import router from './router'
import { i18n } from './plugins/i18n'
import ToastPlugin from './plugins/toast'
import { supabase } from '@/lib/supabase'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('App', 'Main')

import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
// import { RecycleScroller, DynamicScroller } from 'vue-virtual-scroller'

// 初始化主題系統
import { useTheme } from '@/composables/useTheme'
import { useChartTheme } from '@/composables/charts/useChartTheme'

// 初始化主題和圖表顏色系統
const initThemeSystems = () => {
  // 初始化主題系統
  const theme = useTheme()
  theme.initTheme()
  log.debug('🎨 主題系統已初始化')

  // 初始化圖表顏色系統
  const chartTheme = useChartTheme()
  chartTheme.updateUnovisColors()
  log.debug('📊 圖表主題系統已初始化')
}

// 確保 DOM 準備完成後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeSystems)
} else {
  initThemeSystems()
}

// 開發環境初始化通知類型監控
if (import.meta.env.DEV) {
  import('@/utils/notification/notification-type-monitoring').then(
    ({ setupNotificationTypeDevTools }) => {
      setupNotificationTypeDevTools()
    },
  )

  // 開發模式提示：色彩測試功能可在 Developer Tools > Campaign Color Test 中使用
  log.debug('🎨 Campaign Color Test available at: Developer Tools > Campaign Color Test')
}

const app = createApp(App)

// 全局錯誤處理
app.config.errorHandler = (error, _instance, info) => {
  log.error('全局錯誤處理', { error, info })
  // 可以在這裡添加錯誤報告邏輯
}

// 全局未處理的 Promise rejection 處理
window.addEventListener('unhandledrejection', (event) => {
  log.error('未處理的 Promise rejection', event.reason)
  // 防止控制台錯誤輸出
  event.preventDefault()
})

// 創建應用程式實例並配置插件
app
  .use(pinia)
  .use(VueQueryPlugin, { queryClient })
  .use(router)
  .use(VueVirtualScroller)
  .use(i18n)
  .use(ToastPlugin)

// 確保 Supabase 會話完全初始化後再掛載應用程式
async function initializeApp() {
  try {
    // 1. 先獲取 Supabase 會話，這會從 localStorage 恢復會話
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      log.error('Supabase 會話初始化錯誤', error)
    } else {
      log.debug('Supabase 會話初始化完成', { status: session ? '已登入' : '未登入' })
    }

    // 2. 初始化 auth store
    // 重要：必須在 getSession 之後，這樣 store 初始化時就有正確的會話狀態
    const { useAuthStore } = await import('@/store/auth')
    const authStore = useAuthStore()

    // 3. 給 auth store 一些時間完成初始化
    // 但設置最大等待時間避免無限等待
    const maxWaitTime = 3000 // 3 秒
    const startTime = Date.now()

    while (authStore.loading && Date.now() - startTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    if (authStore.loading) {
      log.warn('Auth store 初始化超時，繼續載入應用')
    } else {
      log.debug('Auth store 初始化完成')
    }
  } catch (error) {
    log.error('應用初始化失敗', error)
  } finally {
    // 無論成功或失敗，都掛載應用程式
    app.mount('#app')
  }
}

// 開始初始化
initializeApp()
