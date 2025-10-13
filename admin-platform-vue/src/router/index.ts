import { createWebHistory, createRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { usePermissionStore } from '@/store/permission'
import { config } from '@/config'
import { ViewPermission } from '@/types'
import type { RouteLocationNormalized } from 'vue-router'
import {
  getCurrentSession,
  isSessionNearExpiry,
  refreshSession,
} from '@/utils/auth'
import { createModuleLogger } from '@/utils/logger'

// 建立路由專用 Logger
const log = createModuleLogger('Router', 'Navigation')

// 檢測 URL 是否包含 OAuth 回調參數的輔助函數
export function hasOAuthCallbackParams(route: RouteLocationNormalized) {
  return (
    route.hash.includes('access_token') ||
    route.hash.includes('refresh_token') ||
    route.hash.includes('provider') ||
    route.query.code !== undefined
  )
}

const routes = [
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*', // 捕獲所有未匹配的路徑
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
  },
  // OAuth 回調路由
  {
    path: config.auth.callbackPath,
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { isOAuthCallback: true },
    props: (route: RouteLocationNormalized) => ({
      redirect: route.query.redirect,
    }),
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'orders',
        meta: { breadcrumb: 'Orders 訂單', permission: ViewPermission.ORDER._ },
        children: [
          {
            path: '',
            name: 'orders',
            component: () => import('@/views/OrdersView.vue'),
          },
          {
            path: ':orderNumber',
            name: 'order-detail',
            component: () => import('@/views/OrderDetailView.vue'),
            meta: { breadcrumb: 'Order Detail 訂單細節' },
          },
        ],
      },
      {
        path: 'customers',
        meta: {
          breadcrumb: 'Customers 客戶',
          permission: ViewPermission.CUSTOMER._,
        },
        children: [
          {
            path: 'analytics',
            name: 'customer-analytics',
            component: () =>
              import('@/views/analytics/CustomerAnalyticsView.vue'),
            meta: {
              breadcrumb: 'Customer Analytics 客戶分析',
            },
          },
        ],
      },
      {
        path: 'campaigns',
        meta: {
          breadcrumb: 'Campaigns 活動管理',
          permission: ViewPermission.CAMPAIGN._,
        },
        children: [
          {
            path: 'analytics',
            name: 'campaign-analytics',
            component: () =>
              import('@/views/analytics/CampaignAnalyticsView.vue'),
            meta: {
              breadcrumb: 'Campaign Analytics 活動分析',
              permission: ViewPermission.CAMPAIGN.ANALYTICS,
            },
          },
        ],
      },
      {
        path: 'dashboard',
        meta: {
          breadcrumb: 'Dashboard 概覽',
        },
        children: [
          {
            path: '',
            name: 'dashboard-overview',
            component: () => import('@/views/dashboard/DashboardOverview.vue'),
          },
        ],
      },
      {
        path: 'insights',
        meta: {
          breadcrumb: 'Insights 洞察分析',
        },
        children: [
          {
            path: 'risk-center',
            name: 'insights-risk-center',
            component: () =>
              import('@/views/dashboard/DashboardRiskCenter.vue'),
            meta: {
              breadcrumb: 'Risk Center 風險預警中心',
            },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 簡化的路由守衛 - 基於 main.ts 中的 Supabase 會話預初始化
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()
  const permissionStore = usePermissionStore()

  // 1. 處理 OAuth 回調 - 立即允許通過
  const isOAuthCallback = hasOAuthCallbackParams(to)
  if (isOAuthCallback) {
    to.meta.isOAuthCallback = true
    log.routerDebug('檢測到 OAuth 回調，允許通過')
    return next()
  }

  // 2. 處理已認證用戶訪問登入頁的情況
  if (to.name === 'login') {
    if (auth.loading) {
      await auth.waitForAuth()
    }

    if (auth.isAuthenticated) {
      return next('/')
    }
  }

  // 3. 檢查認證要求
  if (to.meta.requiresAuth) {
    if (auth.loading) {
      await auth.waitForAuth()
    }

    if (!auth.isAuthenticated) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
    }

    // 檢查 session 是否即將過期
    try {
      const { session, error } = await getCurrentSession()

      if (error || !session) {
        log.routerDebug('Session 無效或過期，導向登入頁')
        auth.signOut()
        return next({
          name: 'login',
          query: { redirect: to.fullPath },
        })
      }

      if (isSessionNearExpiry(session, 5)) {
        log.routerDebug('Session 即將過期，嘗試刷新...')
        const refreshResult = await refreshSession()

        if (refreshResult.error) {
          log.error('刷新 session 失敗', refreshResult.error)
          auth.signOut()
          return next({
            name: 'login',
            query: { redirect: to.fullPath },
          })
        }
      }
    } catch (error) {
      log.error('檢查 session 時出錯', error)
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
    }
  }

  // 4. 檢查權限
  const requiredPermission = to.meta.permission as string | undefined
  log.routerDebug(
    `🔐 路由權限檢查 - 目標: ${to.path}, 需要權限: ${requiredPermission}`,
  )
  log.routerDebug(`🔐 認證狀態: ${auth.isAuthenticated}, 用戶: ${auth.user?.email}`)

  if (requiredPermission && auth.isAuthenticated) {
    log.routerDebug(`🔐 開始權限檢查: ${requiredPermission}`)

    // 等待權限系統完全載入：loading 為 false 且 permissionMatrix 已載入
    if (permissionStore.loading || !permissionStore.permissionMatrix) {
      log.routerDebug('🔐 等待 Permission Store 完全載入完成...')

      await new Promise<void>((resolve) => {
        const timeoutId = setTimeout(() => {
          log.warn('⚠️ Permission Store 載入等待超時（5秒），繼續檢查')
          resolve()
        }, 5000)

        const unwatch = permissionStore.$subscribe(() => {
          const isFullyLoaded =
            !permissionStore.loading && !!permissionStore.permissionMatrix

          if (isFullyLoaded) {
            log.routerDebug('✅ Permission Store 完全載入完成')
            clearTimeout(timeoutId)
            unwatch()
            resolve()
          }
        })

        // 檢查是否已經完全載入
        const isFullyLoaded =
          !permissionStore.loading && !!permissionStore.permissionMatrix
        if (isFullyLoaded) {
          log.routerDebug('✅ Permission Store 已經完全載入')
          clearTimeout(timeoutId)
          unwatch()
          resolve()
        }
      })
    }

    // 檢查權限矩陣是否已載入
    if (!permissionStore.permissionMatrix) {
      log.warn(
        `❌ Permission Matrix 仍未載入，拒絕訪問: ${requiredPermission}`,
      )
      return next('/404')
    }

    // 檢查權限矩陣是否為空（用戶沒有任何權限）
    if (
      !permissionStore.permissionMatrix.groups ||
      permissionStore.permissionMatrix.groups.length === 0
    ) {
      log.warn(`❌ 用戶沒有任何權限，拒絕訪問: ${requiredPermission}`)
      return next('/404')
    }

    // 檢查具體權限
    const hasPermissionResult =
      permissionStore.hasPermission(requiredPermission)
    log.routerDebug(
      `🔐 權限檢查結果: ${requiredPermission} = ${hasPermissionResult}`,
    )

    if (!hasPermissionResult) {
      log.warn(`❌ 權限檢查失敗: ${requiredPermission}`)
      return next('/404')
    } else {
      log.routerDebug(`✅ 權限檢查通過: ${requiredPermission}`)
    }
  } else {
    log.routerDebug(
      `🔐 跳過權限檢查 - 需要權限: ${requiredPermission}, 已認證: ${auth.isAuthenticated}`,
    )
  }

  next()
})

export default router
