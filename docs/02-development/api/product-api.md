# ProductApiService API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐⭐ (核心業務)

---
## 概覽

### 業務用途
ProductApiService 是產品與庫存管理系統的核心 API 服務，負責產品資訊管理、庫存追蹤、庫存預警、產品分類、銷售分析和庫存狀態監控。

### 核心功能
- **產品 CRUD** - 產品建立、查詢、更新、狀態管理、刪除
- **庫存管理** - 即時庫存查詢、庫存預警、缺貨監控
- **產品搜尋** - 關鍵字搜尋、SKU 查詢、分類篩選
- **產品狀態** - 4 種產品狀態（草稿、啟用、停用、封存）
- **庫存統計** - 產品總覽、庫存概覽、銷售分析
- **批量操作** - 批量刪除、批量狀態更新

### 技術架構
- **繼承**: `BaseApiService<Product, DbProduct>`
- **資料表**:
  - `products` (主表) - 產品基本資訊
  - `product_with_current_stock` (視圖) - 產品含即時庫存資訊
  - `inventories` - 庫存記錄
  - `categories` - 產品分類
- **資料庫函數**:
  - `get_product_overview()` - 產品概覽統計
  - `get_inventory_overview()` - 庫存概覽統計
- **前端使用**:
  - `ProductsView.vue` - 產品列表
  - `ProductDetailView.vue` - 產品詳情
  - `ProductStockList.vue` - 庫存管理
  - `OrderForm.vue` - 訂單表單產品選擇

### 資料庫層 API 參考
> **Supabase 自動生成文件**
>
> 如需查詢 `products` 資料表的基礎 Schema 和 PostgREST API：
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `products` / `product_with_current_stock` / `inventories`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
> - ✅ 查詢產品資料表結構和庫存視圖
> - ✅ 了解產品分類關聯和約束
> - ✅ 檢視庫存觸發器和 RLS 政策
>
> **何時使用本文件**：
> - ✅ 使用 `ProductApiService` 的庫存預警邏輯
> - ✅ 了解產品狀態管理和批量操作
> - ✅ 學習庫存統計和銷售分析方法
> - ✅ 查看資料映射規則和最佳實踐

---

## API 方法詳細說明

### 產品查詢方法

#### `fetchProductsWithPagination()` - 進階分頁查詢 ⭐ 推薦

**用途**: 產品列表查詢，支援狀態篩選、分類篩選、庫存篩選、搜尋、排序

**方法簽名**:
```typescript
async fetchProductsWithPagination(options: {
  page?: number
  perPage?: number
  status?: string[]           // 產品狀態篩選
  categoryId?: number         // 分類篩選
  stockStatus?: string        // 庫存狀態 ('in_stock' | 'low_stock' | 'out_of_stock')
  searchTerm?: string         // 搜尋關鍵字 (名稱或 SKU)
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiPaginationResponse<Product>>
```

**使用範例**:
```typescript
// 基本查詢
const result = await productService.fetchProductsWithPagination({
  page: 1,
  perPage: 20
})

// 狀態篩選 - 只顯示啟用的產品
const activeProducts = await productService.fetchProductsWithPagination({
  status: ['active'],
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// 庫存預警 - 查詢低庫存產品
const lowStockProducts = await productService.fetchProductsWithPagination({
  stockStatus: 'low_stock',
  page: 1
})

// 分類查詢
const categoryProducts = await productService.fetchProductsWithPagination({
  categoryId: 5,
  status: ['active']
})

// 搜尋產品
const searchResult = await productService.fetchProductsWithPagination({
  searchTerm: 'iPhone',  // 搜尋名稱或 SKU
  page: 1
})
```

**回傳資料包含**:
- 產品基本資訊
- 即時庫存數量 (`totalStock`)
- 分類名稱 (`categoryName`)
- 庫存預警狀態 (`needsRestock`)

---

#### `getProductById()` - ID 查詢

**用途**: 根據 UUID 查詢產品詳情（含庫存資訊）

**方法簽名**:
```typescript
async getProductById(id: string): Promise<ApiResponse<Product>>
```

**使用範例**:
```typescript
const result = await productService.getProductById('product-uuid')

if (result.success && result.data) {
  const product = result.data
  console.log('產品名稱:', product.name)
  console.log('SKU:', product.sku)
  console.log('價格:', product.price)
  console.log('庫存數量:', product.totalStock)
  console.log('需要補貨:', product.needsRestock)
}
```

**資料來源**: `product_with_current_stock` 視圖（含即時庫存）

---

#### `getProductBySKU()` - SKU 查詢

**用途**: 根據 SKU（Stock Keeping Unit）查詢產品

**方法簽名**:
```typescript
async getProductBySKU(sku: string): Promise<ApiResponse<Product>>
```

**使用範例**:
```typescript
const result = await productService.getProductBySKU('PROD-001')

if (result.success) {
  if (result.data) {
    console.log('找到產品:', result.data.name)
  } else {
    console.log('查無此 SKU')
  }
}
```

**適用場景**:
- 條碼掃描查詢
- 匯入產品資料驗證
- SKU 搜尋功能

---

#### `fetchProductsByKeyword()` - 關鍵字快速查詢

**用途**: 根據關鍵字快速查詢產品（用於下拉選單、自動完成）

**方法簽名**:
```typescript
async fetchProductsByKeyword(keyword: string): Promise<ApiResponse<Product[]>>
```

**參數**:
- `keyword`: 搜尋關鍵字（查詢產品名稱）
  - 如果為空字串，返回最近新增的 10 個產品
  - 如果提供關鍵字，返回最多 10 筆匹配結果

**回傳資料**: 簡化的產品資訊（id, name, price, imageUrl, categoryName）

**使用範例**:
```typescript
// 空關鍵字 - 返回最近產品
const recentProducts = await productService.fetchProductsByKeyword('')

// 關鍵字查詢
const products = await productService.fetchProductsByKeyword('手機')

// 用於 Vue Select 組件
const searchProducts = async (keyword: string) => {
  const result = await productService.fetchProductsByKeyword(keyword)
  return result.success ? result.data : []
}
```

**適用場景**:
- 訂單表單的產品選擇下拉選單
- 產品搜尋自動完成
- 快速產品查找

---

### 產品建立與更新

#### `createProduct()` - 建立產品

**用途**: 建立新的產品記錄

**方法簽名**:
```typescript
async createProduct(productData: {
  name: string              // 必填 - 產品名稱
  sku: string               // 必填 - SKU 編碼
  price: number             // 必填 - 價格
  categoryId?: number       // 選填 - 分類 ID
  imageUrl?: string         // 選填 - 圖片 URL
  description?: string      // 選填 - 產品描述
  stockThreshold?: number   // 選填 - 庫存警戒值 (預設: 10)
  status?: 'draft' | 'active' | 'inactive' | 'archived'  // 選填 - 狀態 (預設: 'active')
}): Promise<ApiResponse<Product>>
```

**使用範例**:
```typescript
const newProduct = {
  name: 'iPhone 15 Pro',
  sku: 'IPHONE-15-PRO-256',
  price: 36900,
  categoryId: 1,  // 手機分類
  description: 'Apple iPhone 15 Pro 256GB',
  stockThreshold: 5,  // 庫存低於 5 個時預警
  status: 'active'
}

const result = await productService.createProduct(newProduct)

if (result.success) {
  console.log('產品建立成功')
  console.log('產品 ID:', result.data.id)
  console.log('SKU:', result.data.sku)
}
```

**驗證規則**:
- `name` 必填，最小長度 2 字元
- `sku` 必填，需唯一（資料庫約束）
- `price` 必填，需大於 0
- `stockThreshold` 預設 10，建議設置為合理的補貨警戒值

---

#### `updateProduct()` - 更新產品

**用途**: 更新產品資訊（不含狀態變更）

**方法簽名**:
```typescript
async updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<ApiResponse<Product>>
```

**使用範例**:
```typescript
// 更新產品基本資訊
await productService.updateProduct('product-uuid', {
  name: 'iPhone 15 Pro (更新)',
  price: 34900,  // 降價
  description: '最新價格優惠中'
})

// 更新庫存警戒值
await productService.updateProduct('product-uuid', {
  stockThreshold: 10  // 提高警戒值
})

// 更新圖片
await productService.updateProduct('product-uuid', {
  imageUrl: 'https://new-image-url.com/product.jpg'
})
```

**注意事項**:
- ⚠️ 不可用於更新產品狀態（請使用 `updateProductStatus`）
- ⚠️ SKU 更新需確保唯一性
- ⚠️ 自動更新 `updatedAt` 時間戳

---

#### `updateProductStatus()` - 更新產品狀態

**用途**: 變更產品狀態（草稿、啟用、停用、封存）

**方法簽名**:
```typescript
async updateProductStatus(
  id: string,
  status: 'draft' | 'active' | 'inactive' | 'archived'
): Promise<ApiResponse<Product>>
```

**產品狀態說明**:
- **draft** (草稿) - 產品尚未完成，不對外顯示
- **active** (啟用) - 產品上架中，可正常銷售
- **inactive** (停用) - 產品暫時下架，不可銷售
- **archived** (封存) - 產品已停產，僅保留歷史記錄

**使用範例**:
```typescript
// 啟用產品
await productService.updateProductStatus('product-uuid', 'active')

// 停用產品
await productService.updateProductStatus('product-uuid', 'inactive')

// 封存產品（停產）
await productService.updateProductStatus('product-uuid', 'archived')
```

**業務邏輯**:
- `draft` → `active`: 產品上架
- `active` → `inactive`: 暫時下架
- `inactive` → `active`: 重新上架
- 任何狀態 → `archived`: 停產封存

---

#### `deleteProduct()` - 刪除產品（軟刪除）

**用途**: 軟刪除產品（設置 `deletedAt` 時間戳）

**方法簽名**:
```typescript
async deleteProduct(id: string): Promise<ApiResponse<any>>
```

**刪除策略**:
- **軟刪除**: 設置 `deletedAt` 時間戳，不實際刪除資料
- 軟刪除的產品不會出現在一般查詢中
- 關聯的庫存記錄保持完整

**使用範例**:
```typescript
const result = await productService.deleteProduct('product-uuid')

if (result.success) {
  console.log('產品已軟刪除')
}
```

---

#### `deleteProducts()` - 批量刪除

**用途**: 一次刪除多個產品（軟刪除）

**方法簽名**:
```typescript
async deleteProducts(ids: string[]): Promise<ApiResponse<any>>
```

**使用範例**:
```typescript
const selectedIds = ['uuid-1', 'uuid-2', 'uuid-3']

const result = await productService.deleteProducts(selectedIds)

if (result.success) {
  console.log('批量刪除成功')
}
```

**適用場景**: 產品列表的批量刪除操作

---

### 統計分析方法

#### `getProductOverview()` - 產品概覽統計

**用途**: 取得產品總覽統計資料

**方法簽名**:
```typescript
async getProductOverview(): Promise<ApiResponse<ProductOverview>>
```

**回傳資料**:
```typescript
interface ProductOverview {
  totalProducts: number      // 總產品數
  activeProducts: number     // 啟用產品數
  inactiveProducts: number   // 停用產品數
  draftProducts: number      // 草稿產品數
  archivedProducts: number   // 封存產品數
  lowStockProducts: number   // 低庫存產品數
  averagePrice: number       // 平均產品價格
  totalCategories: number    // 總分類數
}
```

**使用範例**:
```typescript
const result = await productService.getProductOverview()

if (result.success) {
  const stats = result.data

  console.log('總產品數:', stats.totalProducts)
  console.log('啟用產品:', stats.activeProducts)
  console.log('低庫存預警:', stats.lowStockProducts)
  console.log('平均價格:', stats.averagePrice.toLocaleString('zh-TW'))
}
```

**資料來源**: PostgreSQL 函數 `get_product_overview()`

**適用頁面**: DashboardOverview、ProductAnalyticsView

---

#### `getInventoryOverview()` - 庫存概覽統計

**用途**: 取得庫存總覽統計

**方法簽名**:
```typescript
async getInventoryOverview(): Promise<ApiResponse<InventoryOverview>>
```

**回傳資料**:
```typescript
interface InventoryOverview {
  totalInStockProducts: number   // 有庫存的產品數
  totalStockQty: number          // 總庫存數量
  totalStockValue: number        // 總庫存價值
  lowStockProductsCount: number  // 低庫存產品數
  outOfStockProductsCount: number // 缺貨產品數
  overStockProductsCount: number // 過量庫存產品數
  averageStockPerProduct: number // 平均每產品庫存
}
```

**使用範例**:
```typescript
const result = await productService.getInventoryOverview()

if (result.success) {
  const stats = result.data

  console.log('總庫存數量:', stats.totalStockQty)
  console.log('總庫存價值:', stats.totalStockValue.toLocaleString('zh-TW'))
  console.log('缺貨產品:', stats.outOfStockProductsCount)
  console.log('低庫存預警:', stats.lowStockProductsCount)
}
```

**資料來源**: PostgreSQL 函數 `get_inventory_overview()`

---

#### `getProductSalesAnalysis()` - 產品銷售分析

**用途**: 取得產品銷售分析數據（銷量、營收等）

**方法簽名**:
```typescript
async getProductSalesAnalysis(params: {
  startDate?: string
  endDate?: string
  topN?: number  // 取前 N 名熱銷產品
}): Promise<ApiResponse<any>>
```

**使用範例**:
```typescript
// 本月銷售分析
const result = await productService.getProductSalesAnalysis({
  startDate: '2025-10-01',
  endDate: '2025-10-31',
  topN: 10  // 前 10 名熱銷產品
})

if (result.success) {
  console.log('銷售分析:', result.data)
}
```

---

#### `getProductsWithStock()` - 產品庫存列表

**用途**: 取得所有產品及其庫存狀態

**方法簽名**:
```typescript
async getProductsWithStock(): Promise<ApiResponse<ProductWithStock[]>>
```

**回傳資料**:
```typescript
interface ProductWithStock {
  productId: string
  name: string
  sku: string
  totalStock: number         // 總庫存
  reservedQuantity: number   // 已預留數量
  freeStock: number          // 可用庫存
  stockStatus: string        // 'in_stock' | 'low_stock' | 'out_of_stock'
  stockThreshold: number     // 庫存警戒值
}
```

**使用範例**:
```typescript
const result = await productService.getProductsWithStock()

if (result.success) {
  const products = result.data

  // 篩選缺貨產品
  const outOfStock = products.filter(p => p.stockStatus === 'out_of_stock')
  console.log('缺貨產品數:', outOfStock.length)

  // 篩選低庫存產品
  const lowStock = products.filter(p => p.stockStatus === 'low_stock')
  console.log('低庫存預警:', lowStock.length)
}
```

---

#### `getInventoryStatus()` - 庫存狀態報表

**用途**: 取得庫存狀態詳細報表

**方法簽名**:
```typescript
async getInventoryStatus(): Promise<ApiResponse<any[]>>
```

**使用範例**:
```typescript
const result = await productService.getInventoryStatus()

if (result.success) {
  console.log('庫存狀態報表:', result.data)
}
```

---

## 資料結構

### Product 類型 (前端)

```typescript
interface Product {
  // 基本資訊
  id: string                    // UUID
  name: string                  // 產品名稱
  sku?: string                  // SKU 編碼
  price: number                 // 價格
  description: string | null    // 產品描述
  imageUrl: string | null       // 產品圖片 URL

  // 分類資訊
  categoryId: number | null     // 分類 ID
  categoryName?: string         // 分類名稱

  // 庫存資訊
  totalStock?: number           // 即時庫存數量
  stockThreshold: number        // 庫存警戒值 (預設: 10)
  stockWarningThreshold?: number | null  // 警告閾值
  needsRestock?: boolean        // 是否需要補貨

  // 產品狀態
  status?: 'draft' | 'active' | 'inactive' | 'archived'

  // 多語言
  translations: Record<string, any> | null

  // 時間戳
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}
```

---

### 產品狀態說明

| 狀態 | 值 | 說明 | 適用場景 |
|------|-----|------|----------|
| 📝 草稿 | `draft` | 產品尚未完成 | 新產品編輯中 |
| ✅ 啟用 | `active` | 產品正常銷售中 | 上架產品 |
| ⏸️ 停用 | `inactive` | 產品暫時下架 | 臨時缺貨、促銷結束 |
| 📦 封存 | `archived` | 產品已停產 | 停產商品、歷史記錄 |

---

### 庫存狀態說明

| 狀態 | 值 | 判斷條件 |
|------|-----|----------|
| ✅ 有庫存 | `in_stock` | `totalStock > stockThreshold` |
| ⚠️ 低庫存 | `low_stock` | `0 < totalStock <= stockThreshold` |
| ❌ 缺貨 | `out_of_stock` | `totalStock = 0` |

---

### DbProduct 類型 (資料庫)

```typescript
interface DbProduct {
  id: string
  name: string
  sku: string | null
  price: number
  category_id: number | null
  image_url: string | null
  description: string | null
  translations: Record<string, any> | null
  stock_threshold: number       // 對應 Product.stockThreshold
  status: string                // 對應 Product.status
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

---

## 使用範例

### 完整產品建立與管理流程

```typescript
import { defaultServiceFactory } from '@/api/services'

const productService = defaultServiceFactory.getProductService()

// 1. 建立產品
const newProduct = {
  name: 'iPhone 15 Pro',
  sku: 'IPHONE-15-PRO-256',
  price: 36900,
  categoryId: 1,
  description: 'Apple iPhone 15 Pro 256GB 鈦金屬',
  stockThreshold: 5,
  status: 'draft'  // 先建立為草稿
}

const createResult = await productService.createProduct(newProduct)

if (createResult.success) {
  const productId = createResult.data.id

  // 2. 上傳圖片後更新
  await productService.updateProduct(productId, {
    imageUrl: 'https://cdn.example.com/iphone15pro.jpg'
  })

  // 3. 啟用產品上架
  await productService.updateProductStatus(productId, 'active')

  // 4. 查詢產品詳情（含庫存）
  const detail = await productService.getProductById(productId)
  console.log('產品詳情:', detail.data)
  console.log('當前庫存:', detail.data.totalStock)
  console.log('需要補貨:', detail.data.needsRestock)

  // 5. 價格調整
  await productService.updateProduct(productId, {
    price: 34900  // 降價促銷
  })

  // 6. 產品下架（臨時缺貨）
  await productService.updateProductStatus(productId, 'inactive')

  // 7. 重新上架
  await productService.updateProductStatus(productId, 'active')
}

// 8. 查詢產品概覽統計
const overview = await productService.getProductOverview()
console.log('總產品數:', overview.data.totalProducts)
console.log('啟用產品:', overview.data.activeProducts)
console.log('低庫存預警:', overview.data.lowStockProducts)

// 9. 查詢庫存概覽
const inventory = await productService.getInventoryOverview()
console.log('總庫存價值:', inventory.data.totalStockValue)
console.log('缺貨產品:', inventory.data.outOfStockProductsCount)
```

---

### Vue 組件使用範例

```vue
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { defaultServiceFactory } from '@/api/services'
import type { Product } from '@/types'

const productService = defaultServiceFactory.getProductService()
const products = ref<Product[]>([])
const loading = ref(false)
const stockFilter = ref<string>('')

// 載入產品列表
async function loadProducts() {
  loading.value = true
  try {
    const result = await productService.fetchProductsWithPagination({
      page: 1,
      perPage: 20,
      status: ['active'],
      stockStatus: stockFilter.value || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })

    if (result.success) {
      products.value = result.data
    }
  } finally {
    loading.value = false
  }
}

// 篩選低庫存產品
async function filterLowStock() {
  stockFilter.value = 'low_stock'
  await loadProducts()
}

// 篩選缺貨產品
async function filterOutOfStock() {
  stockFilter.value = 'out_of_stock'
  await loadProducts()
}

// 更新產品狀態
async function updateStatus(productId: string, newStatus: string) {
  const result = await productService.updateProductStatus(productId, newStatus)

  if (result.success) {
    await loadProducts()  // 重新載入
  }
}

// 庫存預警統計
const stockAlerts = computed(() => {
  return {
    low: products.value.filter(p => p.needsRestock).length,
    out: products.value.filter(p => p.totalStock === 0).length
  }
})

onMounted(() => {
  loadProducts()
})
</script>

<template>
  <div>
    <!-- 庫存預警提示 -->
    <div class="alerts">
      <div v-if="stockAlerts.low > 0" class="alert warning">
        ⚠️ {{ stockAlerts.low }} 個產品庫存不足
      </div>
      <div v-if="stockAlerts.out > 0" class="alert danger">
        ❌ {{ stockAlerts.out }} 個產品缺貨
      </div>
    </div>

    <!-- 篩選按鈕 -->
    <div class="filters">
      <button @click="loadProducts">全部產品</button>
      <button @click="filterLowStock">低庫存預警</button>
      <button @click="filterOutOfStock">缺貨產品</button>
    </div>

    <!-- 產品列表 -->
    <div v-if="loading">載入中...</div>
    <div v-else class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <img :src="product.imageUrl || '/placeholder.jpg'" :alt="product.name" />
        <h3>{{ product.name }}</h3>
        <p class="price">${{ product.price.toLocaleString('zh-TW') }}</p>
        <p class="stock">
          庫存: {{ product.totalStock || 0 }}
          <span v-if="product.needsRestock" class="badge warning">補貨中</span>
        </p>
        <p class="status">{{ product.status }}</p>

        <!-- 操作按鈕 -->
        <div class="actions">
          <button
            v-if="product.status === 'active'"
            @click="updateStatus(product.id, 'inactive')"
          >
            停用
          </button>
          <button
            v-if="product.status === 'inactive'"
            @click="updateStatus(product.id, 'active')"
          >
            啟用
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

## 注意事項與最佳實踐

### SKU 唯一性

```typescript
// ✅ 正確 - 建立前檢查 SKU 是否存在
const checkResult = await productService.getProductBySKU('PROD-001')

if (checkResult.success && checkResult.data) {
  console.error('SKU 已存在')
} else {
  // SKU 不存在，可以建立
  await productService.createProduct({ sku: 'PROD-001', ... })
}
```

---

### 庫存預警處理

```typescript
// ✅ 正確 - 定期檢查低庫存產品
const result = await productService.fetchProductsWithPagination({
  stockStatus: 'low_stock',
  page: 1,
  perPage: 50
})

if (result.success) {
  const lowStockProducts = result.data

  // 發送補貨通知
  lowStockProducts.forEach(product => {
    sendRestockAlert(product.name, product.totalStock)
  })
}
```

---

### 產品狀態管理最佳實踐

```typescript
// ✅ 正確 - 根據業務邏輯變更狀態
async function handleProductLifecycle(productId: string) {
  // 新產品: draft → active (上架)
  await productService.updateProductStatus(productId, 'active')

  // 臨時缺貨: active → inactive (下架)
  await productService.updateProductStatus(productId, 'inactive')

  // 補貨後: inactive → active (重新上架)
  await productService.updateProductStatus(productId, 'active')

  // 停產: active → archived (封存)
  await productService.updateProductStatus(productId, 'archived')
}
```

---

## 相關資源

### 相關 API 服務
- [OrderApiService](./order-api.md) - 訂單服務（產品銷售）
- [CustomerApiService](./customer-api.md) - 客戶服務
- [DashboardApiService](./dashboard-api.md) - 儀表板統計

### 相關組件
- `ProductsView.vue` - 產品列表頁面
- `ProductDetailView.vue` - 產品詳情頁面
- `ProductStockList.vue` - 庫存管理頁面

### 相關文檔
- [資料庫 Schema](../database/schema.sql) - products, inventories 表結構
- [庫存管理指南](../../03-operations/inventory-management.md)
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md)

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|----------|------|
| 2025-10-07 | 1.0.0 | 初始版本 - 完整 API 文檔 | 開發團隊 |
