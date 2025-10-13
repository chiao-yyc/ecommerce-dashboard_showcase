# API 設計

## 架構概覽

本專案採用 Supabase 作為後端服務，包含：
- **Supabase Database**: PostgreSQL 資料庫含 RPC functions
- **Supabase Auth**: 使用者認證系統
- **Edge Functions**: 自定義 API 端點
- **Real-time**: 即時資料同步

## API 層次結構

### 1. Supabase Client Layer
**位置**: `src/lib/supabase.ts`
- 基礎 Supabase 客戶端設定
- 認證 token 管理
- 環境變數配置

### 2. API Service Layer
**位置**: `src/api/`
- 各功能模組的 API 封裝
- 統一錯誤處理
- 請求/回應格式化

### 3. Composables Layer
**位置**: `src/composables/`
- 業務邏輯封裝
- 狀態管理
- 錯誤處理與 loading 狀態

### 4. Component Layer
**位置**: `src/components/`, `src/views/`
- UI 組件
- 使用者互動處理

## API 呼叫模式

### 基本模式
```typescript
// 1. API Service 定義
export const orderApi = {
  async create(orderData: CreateOrderRequest) {
    const response = await supabase
      .functions
      .invoke('order-create', { body: orderData })
    return response
  }
}

// 2. Composable 封裝
export function useOrders() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const createOrder = async (orderData: CreateOrderRequest) => {
    loading.value = true
    try {
      const result = await orderApi.create(orderData)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return { createOrder, loading, error }
}

// 3. 組件使用
const { createOrder, loading, error } = useOrders()
```

### 資料查詢模式
```typescript
// Supabase Table 查詢
export function useProductList() {
  const products = ref([])
  const loading = ref(false)
  
  const fetchProducts = async () => {
    loading.value = true
    const { data, error } = await supabase
      .from('product_with_current_stock')
      .select('*')
      .order('name')
    
    if (!error) {
      products.value = data
    }
    loading.value = false
  }
  
  return { products, fetchProducts, loading }
}
```

## 認證處理

### JWT Token 管理
```typescript
// 自動附加 Authorization header
const callEdgeFunction = async (functionName: string, payload: any) => {
  const session = await supabase.auth.getSession()
  if (!session.data.session) {
    throw new Error('未登入')
  }
  
  return supabase.functions.invoke(functionName, {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.data.session.access_token}`
    }
  })
}
```

### 使用者資料同步
```typescript
// 登入後同步使用者資料
export async function syncUserAfterAuth() {
  const { data, error } = await supabase
    .functions
    .invoke('sync-user-record')
    
  if (error) {
    console.error('使用者資料同步失敗:', error)
  }
}
```

## 錯誤處理策略

### 統一錯誤格式
```typescript
interface ApiError {
  message: string
  code?: string
  details?: any
}

// 錯誤處理 composable
export function useApiError() {
  const error = ref<ApiError | null>(null)
  
  const handleError = (err: any) => {
    if (err.message) {
      error.value = { message: err.message }
    } else {
      error.value = { message: '發生未知錯誤' }
    }
  }
  
  const clearError = () => {
    error.value = null
  }
  
  return { error, handleError, clearError }
}
```

### HTTP 狀態碼處理
- `401 Unauthorized` → 重導向至登入頁
- `403 Forbidden` → 顯示權限不足訊息
- `500 Server Error` → 顯示系統錯誤訊息
- 網路錯誤 → 顯示連線問題提示

## Real-time 訂閱

### 資料庫變更監聽
```typescript
export function useRealtimeOrders() {
  const orders = ref([])
  
  onMounted(() => {
    const subscription = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // 處理即時更新
          handleOrderChange(payload)
        }
      )
      .subscribe()
      
    onUnmounted(() => {
      subscription.unsubscribe()
    })
  })
  
  return { orders }
}
```

## 效能優化

### 1. 查詢優化
- 使用資料庫 Views 預計算複雜查詢
- 適當的 `select()` 欄位限制
- 分頁查詢避免大量資料載入

### 2. 快取策略
```typescript
// 簡單記憶體快取
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5分鐘

export async function getCachedData(key: string, fetcher: () => Promise<any>) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  const data = await fetcher()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}
```

### 3. 載入狀態管理
```typescript
// 全域載入狀態
export const useGlobalLoading = () => {
  const loadingCount = ref(0)
  
  const startLoading = () => loadingCount.value++
  const stopLoading = () => loadingCount.value--
  
  const isLoading = computed(() => loadingCount.value > 0)
  
  return { isLoading, startLoading, stopLoading }
}
```

## API 端點對應

詳細的 API 端點規格請參考 [`supabase-api-endpoints.md`](./supabase-api-endpoints.md)

### 主要端點分類
1. **Edge Functions**: 自定義業務邏輯 API
2. **Database Tables**: 直接資料表查詢
3. **Database Views**: 預計算的複雜查詢
4. **RPC Functions**: 資料庫內的業務邏輯函數

## 測試策略

### API 測試
- 使用 Vitest 進行 API service 單元測試
- Mock Supabase client 避免實際 API 呼叫
- 測試錯誤處理和邊界情況

### E2E 測試
- 使用 Playwright 測試完整的 API 流程
- 包含認證、資料 CRUD 操作
- 測試即時更新功能
