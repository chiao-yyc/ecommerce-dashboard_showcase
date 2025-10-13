# 路由架構設計文檔

## 架構概覽

本專案採用 **標準兩層 RESTful 路由設計**，結合 **Vue Router 4** 與 **企業級權限控制系統**，實現了完整的單頁應用路由架構。

---
**文檔資訊**
- 最後更新：2025-07-22
- 版本：1.0.0
- 狀態：✅ 與代碼同步
---

## **路由架構設計**

### 1.1 整體路由結構

```
應用路由樹
├── 認證相關路由 (AuthLayout)
│   ├── /login
│   └── /login/register
├── OAuth 回調處理
│   └── /auth/callback
├── 錯誤頁面
│   ├── /unauthorized
│   └── /404 (catch-all)
└── 主應用路由 (MainLayout + 權限控制)
    ├── / (首頁)
    ├── /settings
    ├── 業務模組路由 (8個核心域)
    ├── 儀表板路由 (5個專業面板)  
    ├── 洞察分析路由 (4個分析面板)
    └── 通知系統路由 (2個功能頁面)
```

### 1.2 路由層級設計原則

#### **兩層嵌套結構**
```typescript
// 標準業務模組路由模式
{
  path: '/customers',
  meta: { breadcrumb: 'Customers 客戶', permission: ViewPermission.CUSTOMER._ },
  children: [
    {
      path: '',                    // 列表頁: /customers
      name: 'customers',
      component: () => import('@/views/CustomersView.vue')
    },
    {
      path: ':id',                 // 詳情頁: /customers/:id  
      name: 'customer-detail',
      component: () => import('@/views/CustomerDetailView.vue'),
      meta: { breadcrumb: 'Customer Detail 客戶細節' }
    }
  ]
}
```

#### **單層結構**
```typescript
// 功能性頁面
{
  path: '/settings',
  name: 'settings', 
  component: () => import('@/views/SettingsView.vue'),
  meta: { breadcrumb: 'Settings 設定' }
}
```

## 🔐 **權限控制系統**

### 2.1 權限整合模式

#### **ViewPermission 枚舉設計**
```typescript
// 基於業務域的權限枚舉
export enum ViewPermission {
  ORDER: {
    _: 'view:order',
    DETAIL: 'view:order:detail'
  },
  CUSTOMER: {
    _: 'view:customer', 
    DETAIL: 'view:customer:detail'
  },
  SETTING: {
    _: 'view:setting',
    ROLES: 'view:setting:roles',
    ROLE_PERMISSIONS: 'view:setting:role_permissions',
    ROLE_USERS: 'view:setting:role_users',
    AI_PROVIDER: 'ai_provider.view'
  },
  CAMPAIGN: {
    _: 'campaign.view',
    CREATE: 'campaign.create',
    EDIT: 'campaign.edit',
    DELETE: 'campaign.delete',
    ANALYTICS: 'campaign.analytics'
  }
}
```

#### **路由元數據權限控制**
```typescript
{
  path: '/config',
  meta: { 
    breadcrumb: '系統設定',
    permission: ViewPermission.SETTING._    // 父級權限檢查
  },
  children: [
    {
      path: 'permissions',
      name: 'role-permissions',
      component: () => import('@/views/RolePermissionsView.vue'),
      meta: {
        breadcrumb: 'Role Permissions 角色權限',
        permission: ViewPermission.SETTING.ROLE_PERMISSIONS  // 子級權限檢查
      }
    }
  ]
}
```

### 2.2 路由守衛實現

#### **多層級權限檢查流程**
```
路由守衛執行順序
1. OAuth 回調檢測 → 立即放行
2. 已認證用戶訪問登入頁 → 重導向首頁  
3. 未認證用戶訪問受保護路由 → 導向登入頁
4. Session 有效性檢查 → 自動刷新或重新認證
5. 頁面級權限檢查 → 通過/拒絕訪問
```

#### **Session 管理策略**
```typescript
// 智能 Session 檢查
if (to.meta.requiresAuth && auth.isAuthenticated) {
  const { checkAndRefreshSession } = useAuth()
  const sessionValid = await checkAndRefreshSession()
  
  if (!sessionValid) {
    auth.signOut()
    return next(`/login?redirect=${to.fullPath}`)
  }
}
```

## 🍞 **麵包屑導航系統**

### 3.1 階層式麵包屑設計

#### **自動麵包屑生成**
```typescript
// 路由 meta 配置
meta: { 
  breadcrumb: 'Customer Detail 客戶細節'  // 手動配置
}

// 自動生成麵包屑鍊
Home 首頁 > Customers 客戶 > Customer Detail 客戶細節
```

#### **動態麵包屑內容**
```vue
<!-- 支援動態參數 -->
<Breadcrumb>
  <BreadcrumbItem>{{ customer.name }}</BreadcrumbItem>
</Breadcrumb>
```

### 3.2 多語言麵包屑支援
```typescript
meta: { 
  breadcrumb: 'Orders 訂單'  // 中英文並列格式
}
```

## **OAuth 認證整合**

### 4.1 OAuth 回調處理

#### **智能回調檢測**
```typescript
// OAuth 參數檢測函數
export function hasOAuthCallbackParams(route: RouteLocationNormalized) {
  return (
    route.hash.includes('access_token') ||
    route.hash.includes('refresh_token') ||
    route.hash.includes('provider') ||
    route.query.code !== undefined
  )
}
```

#### **專用回調路由**
```typescript
{
  path: config.auth.callbackPath,  // 可配置回調路徑
  component: () => import('@/views/LoginView.vue'),
  meta: { isOAuthCallback: true },
  props: (route) => ({
    redirect: route.query.redirect  // 保持重導向狀態
  })
}
```

### 4.2 認證狀態管理

#### **認證載入狀態處理**
```typescript
// 避免認證競態條件
if (auth.loading) {
  await Promise.race([
    // 等待認證完成
    new Promise<void>((resolve) => {
      const checkAuth = () => {
        if (!auth.loading) resolve()
        else setTimeout(checkAuth, 10)
      }
      checkAuth()
    }),
    // 最多等待 500ms
    new Promise<void>((resolve) => setTimeout(resolve, 500))
  ])
}
```

## 📱 **佈局系統整合**

### 5.1 雙佈局架構

#### **AuthLayout - 認證頁面**
```typescript
// 簡潔認證介面
{
  path: '/login',
  component: () => import('@/layouts/AuthLayout.vue'),
  children: [
    { path: '', component: () => import('@/views/LoginView.vue') },
    { path: 'register', component: () => import('@/views/RegisterView.vue') }
  ]
}
```

#### **MainLayout - 主應用介面**
```typescript  
// 完整功能介面
{
  path: '/',
  component: () => import('@/layouts/MainLayout.vue'),
  meta: { requiresAuth: true },  // 統一認證要求
  children: [
    // 所有業務路由
  ]
}
```

### 5.2 佈局間轉換

```
認證流程佈局轉換
未認證 → AuthLayout (登入頁面)
    ↓
OAuth 驗證
    ↓  
已認證 → MainLayout (主應用)
```

## **性能優化策略**

### 6.1 懶加載實現

#### **路由級代碼分割**
```typescript
// 所有路由組件都使用動態導入
component: () => import('@/views/CustomersView.vue')

// 自動生成的 chunk
// chunk-[hash].js (每個頁面獨立 chunk)
```

#### **預加載策略**
```typescript
// 關鍵路由預加載
const CustomerView = () => import(
  /* webpackPreload: true */
  '@/views/CustomersView.vue'
)
```

### 6.2 路由守衛性能優化

#### **智能權限檢查**
```typescript
// 只在需要時檢查權限
const requiredPermission = to.meta.permission as string | undefined
if (requiredPermission && auth.isAuthenticated) {
  // 執行權限檢查
}
```

#### **競態條件處理**
```typescript
// 避免長時間等待
await Promise.race([
  permissionCheck(),
  timeout(2000)  // 最多等待2秒
])
```

## **路由結構統計**

### 7.1 路由分佈統計

| 路由分類 | 路由數量 | 主要功能 |
|----------|----------|----------|
| **認證相關** | 3個 | 登入、註冊、OAuth回調 |
| **業務模組** | 16個 | 8個核心業務域 (customers, orders, products, etc.) |
| **儀表板** | 5個 | 專業分析面板 |
| **洞察系統** | 4個 | 商業智能分析 |
| **系統管理** | 4個 | 角色權限、通知管理 |
| **功能頁面** | 4個 | 設定、測試、錯誤頁面 |
| **總計** | **36個路由** | **完整企業級應用** |

### 7.2 權限控制統計

- **權限控制路由**：30個 (83.3%)
- **公開訪問路由**：6個 (16.7%)
- **權限層級**：2層 (父子權限)
- **權限群組數量**：12個 (含 Campaign 和 AI Provider)
- **總權限項目**：47個 (新增 Campaign 5個 + AI Provider 5個)

## **開發指南**

### 8.1 新增路由最佳實踐

#### **業務模組路由模板**
```typescript
{
  path: '/your-module',
  meta: { 
    breadcrumb: 'Your Module 你的模組',
    permission: ViewPermission.YOUR_MODULE._
  },
  children: [
    {
      path: '',
      name: 'your-module-list',
      component: () => import('@/views/YourModuleView.vue')
    },
    {
      path: ':id',
      name: 'your-module-detail', 
      component: () => import('@/views/YourModuleDetailView.vue'),
      meta: { breadcrumb: 'Detail 詳情' }
    }
  ]
}
```

#### **權限配置檢查清單**
- [ ] 定義 ViewPermission 枚舉
- [ ] 配置路由 meta.permission
- [ ] 設置麵包屑 breadcrumb  
- [ ] 實現懒加載 import()
- [ ] 測試權限控制邏輯

### 8.2 路由測試策略

#### **E2E 路由測試**
```typescript
// 測試路由訪問控制
test('未認證用戶無法訪問受保護路由', async () => {
  await page.goto('/customers')
  expect(page.url()).toContain('/login')
})

// 測試權限控制
test('無權限用戶被導向 unauthorized 頁面', async () => {
  await loginAsUser('limited-user')
  await page.goto('/config/permissions')
  expect(page.url()).toContain('/unauthorized')
})
```

## **相關文檔**

- [狀態管理架構](./state-management.md) - Pinia stores 與路由整合
- [權限系統設計](./rbac-architecture.md) - RBAC 權限控制詳細設計  
- [業務模組架構](./business-modules.md) - 各業務域路由設計
- [API 服務架構](./api-services.md) - API 調用與路由關係

---

**更新紀錄**
- v1.0.0 (2025-07-22): 初始版本，完整路由架構文檔
- 下次更新：當路由結構發生重大變更時

**文檔狀態**：✅ 已與實際代碼完全同步