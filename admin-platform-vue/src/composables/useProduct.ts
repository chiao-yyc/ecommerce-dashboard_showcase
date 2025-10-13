import { convertToISOString } from '@/utils'
import { businessFormatters } from '@/utils/numbers'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { ProductApiService } from '@/api/services/ProductApiService'
import { getGlobalInventoryRealtime } from './useInventoryRealtime'
import { getDefaultSource } from '@/constants/inventory'
import { INVENTORY_OPERATION_TYPES } from '@/types/product'
import { createModuleLogger } from '@/utils/logger'
import type {
  Product,
  Inventory,
  ProductWithStock,
  DbProduct,
  ApiResponse,
  ApiPaginationResponse,
  DbCategory,
} from '@/types'

const log = createModuleLogger('Composable', 'Product')

/**
 * 關鍵字查詢產品（查詢 id & name）
 * @param keyword 關鍵字
 * @returns ApiResponse<Product[]> 產品列表
 */
export async function fetchProductsByKeyword(
  keyword: string,
): Promise<ApiResponse<Product[]>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.fetchProductsByKeyword(keyword)
}

// 獲取產品列表與分頁
export async function fetchProductsWithPagination(options: {
  page: number
  perPage: number
  searchTerm?: string
  categoryIds?: number[]
  status?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiPaginationResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return (await productApiService.fetchProductsWithPagination(
    options,
  )) as ApiPaginationResponse
}

/**
 * 獲取單一產品資料
 * @param id 產品ID
 * @returns ApiResponse<Product> 產品資料
 */
export async function getProductById(
  id: string,
): Promise<ApiResponse<Product>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.getProductById(id)
}

/**
 * 根據 SKU 獲取產品
 * @param sku 產品 SKU
 * @returns ApiResponse<Product> 產品資料
 */
export async function getProductBySKU(
  sku: string,
): Promise<ApiResponse<Product>> {
  const productApiService = new ProductApiService(supabase)
  return await productApiService.getProductBySKU(sku)
}

/**
 * 新增產品
 * @param productData 產品資料
 * @returns ApiResponse<Product> 新增的產品
 */
export async function createProduct(productData: {
  name: string
  sku?: string
  price: number
  categoryId?: number | null
  imageUrl?: string | null
  description?: string | null
  translations?: Record<string, any> | null
}): Promise<ApiResponse<Product>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.createProduct(productData)
}

/**
 * 更新產品資料
 * @param id 產品ID
 * @param updates 更新的資料
 * @returns ApiResponse<Product> 更新後的產品
 */
export async function updateProduct(
  id: string,
  updates: {
    name?: string
    price?: number
    categoryId?: number | null
    imageUrl?: string | null
    description?: string | null
    translations?: Record<string, any> | null
  },
): Promise<ApiResponse<Product>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.updateProduct(id, updates)
}

/**
 * 更新產品狀態
 * @param id 產品ID
 * @param status 產品狀態
 * @returns ApiResponse 更新結果
 */
export async function updateProductStatus(
  id: string,
  status: 'draft' | 'active' | 'inactive' | 'archived'
): Promise<ApiResponse<Product>> {
  // 使用 API 服務
  const productApiService = new ProductApiService(supabase)
  return await productApiService.updateProductStatus(id, status)
}

/**
 * 假刪除產品
 * @param id 產品ID
 * @returns ApiResponse 刪除結果
 */
export async function deleteProduct(id: string): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.deleteProduct(id)
}
/**
 * 批量刪除產品
 * @param ids 產品ID列表
 * @returns ApiResponse 刪除結果
 */
export async function deleteProducts(ids: string[]): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.deleteProducts(ids)
}

/**
 * 獲取庫存列表與分頁
 * @param options 分頁選項
 * @returns ApiResponse 庫存列表
 */
export async function fetchInventoriesWithPagination(options: {
  page: number
  perPage: number
  searchTerm?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiPaginationResponse> {
  try {
    const {
      page,
      perPage,
      searchTerm,
      sortBy = 'stock_status_order',
      sortOrder = 'asc',
    } = options

    // 計算偏移量
    const offset = (page - 1) * perPage

    // 構建查詢，使用 join 一次取得產品和庫存資料
    let query = supabase
      .from('product_with_current_stock')
      .select('*', { count: 'exact' })

    // 如果有搜尋條件 - 多欄位搜尋：產品名稱、SKU
    if (searchTerm) {
      const pattern = `%${searchTerm}%`
      query = query.or(`name.ilike.${pattern},sku.ilike.${pattern}`)
    }

    // 排序與分頁
    // 將前端的駝峰式命名轉換為資料庫的下劃線命名法
    const dbSortBy = convertToDatabaseColumnName(sortBy)
    query = query
      .order(dbSortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + perPage - 1)

    // 執行查詢
    const { data, error, count } = await query

    if (error) {
      return {
        success: false,
        error: error.message,
        // page,
        // perPage,
      }
    }

    // 計算總頁數
    const totalPages = count ? Math.ceil(count / perPage) : 0

    // 將資料庫模型轉換為前端模型
    const products = data.map((item) => {
      return {
        productId: item.id,
        name: item.name,
        sku: item.sku,
        stockThreshold: item.stock_threshold,
        totalStock: item.current_stock,
        reservedQuantity: 0, // 目前視圖中尚未包含保留數量
        freeStock: item.current_stock,
        stockStatus: item.stock_status,
        stockStatusOrder: item.stock_status_order,
      }
    })

    return {
      success: true,
      data: products,
      count: count ?? undefined,
      page,
      perPage,
      totalPages,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return {
      success: false,
      error: errorMessage,
      // page: options.page,
      // perPage: options.perPage,
    }
  }
}

// 將前端的駝峰式命名轉換為資料庫的下劃線命名法
function convertToDatabaseColumnName(columnName: string): string {
  // 處理特殊情況的映射
  const specialMappings: Record<string, string> = {
    categoryId: 'category_id',
    imageUrl: 'image_url',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    stockWarningThreshold: 'stock_warning_threshold',
  }

  // 如果是特殊映射中的欄位，直接返回對應的資料庫欄位名
  if (columnName in specialMappings) {
    return specialMappings[columnName]
  }

  // 一般情況：將駝峰式轉換為下劃線命名法
  // 例如：productName -> product_name
  return columnName.replace(/([A-Z])/g, '_$1').toLowerCase()
}

/**
 * 獲取庫存狀態
 * @param productId 產品ID
 * @returns ApiResponse<DbInventory> 庫存狀態
 */
export async function getInventoryStatusById(
  productId: string,
): Promise<ApiResponse<ProductWithStock>> {
  try {
    const { data, error } = await supabase
      .from('product_with_current_stock')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // The view returns 'id' as the product id
    const inventory = {
      productId: data.id || data.product_id,
      name: data.name,
      sku: data.sku,
      stockThreshold: data.stock_threshold,
      totalStock: data.current_stock,
      reservedQuantity: data.reserved_quantity,
      freeStock: data.free_stock,
      stockStatus: data.stock_status,
      stockStatusOrder: data.stock_status_order,
    }

    return { success: true, data: inventory }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

export async function getInventoryStatusBySKU(
  sku: string,
): Promise<ApiResponse<ProductWithStock>> {
  try {
    const { data, error } = await supabase
      .from('product_with_current_stock')
      .select('*')
      .eq('sku', sku)
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // The view returns 'id' as the product id
    const inventory = {
      productId: data.id || data.product_id,
      name: data.name,
      sku: data.sku,
      stockThreshold: data.stock_threshold || 10,
      totalStock: data.current_stock || 0,
      reservedQuantity: data.reserved_quantity || 0,
      freeStock: data.free_stock || 0,
      stockStatus: data.stock_status || 'unknown',
      stockStatusOrder: data.stock_status_order || 0,
      imageUrl: data.image_url || null,
      categoryId: data.category_id || null,
      categoryName: data.category_name || null,
      status: (data.status as 'draft' | 'active' | 'inactive' | 'archived') || 'active',
      description: data.description || null,
      latestReceivedAt: data.latest_received_at || null,
      latestStockUpdateAt: data.latest_stock_update_at || null,
    }

    return { success: true, data: inventory }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 取得單一商品庫存紀錄
 * @param productId 產品ID
 * @returns ApiResponse<DbInventory> 庫存紀錄
 */
export async function getInventoriesWithStockById(
  productId: string,
): Promise<ApiResponse<Inventory[]>> {
  try {
    const { data, error } = await supabase
      .from('inventory_with_stock_detail')
      .select('*')
      .eq('product_id', productId)
    // .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const inventories = data.map(mapDbInventoryWithStockToInventory)

    return { success: true, data: inventories }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 更新庫存資訊
 * @param productId 產品ID
 * @param updates 更新的資料
 * @returns ApiResponse<DbInventory> 更新後的庫存
 */
export async function updateInventory(
  productId: string,
  updates: {
    quantity: number
    source: string
    ref_id: string
  },
): Promise<ApiResponse<Inventory>> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'allocate-inventory',
      {
        method: 'POST',
        body: {
          product_id: productId,
          quantity: updates.quantity,
          source: updates.source,
          ref_id: updates.ref_id,
        },
      },
    )

    if (error) {
      return { success: false, error: error.message }
    }

    const mappedData = mapDbInventoryWithStockToInventory(data)

    return { success: true, data: mappedData }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 新增商品庫存 - 使用 stock-in Edge Function
 * @param productId 產品ID
 * @param updates 新增的資料
 * @returns ApiResponse<Inventory> 新增後的庫存
 */
export async function addInventory(
  productId: string,
  updates: {
    quantity: number
    source?: string
    note?: string
    received_at?: Date
  },
): Promise<ApiResponse<Inventory>> {
  try {
    // 確保 received_at 總是有值，提升資料品質
    const receivedAt = updates.received_at || new Date()

    const { data, error } = await supabase.functions.invoke('stock-in', {
      body: {
        product_id: productId,
        quantity: updates.quantity,
        source: updates.source || getDefaultSource(INVENTORY_OPERATION_TYPES.STOCK_IN),
        note: updates.note || `手動入庫 ${updates.quantity} 個單位`,
        received_at: receivedAt.toISOString(),
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error || '入庫操作失敗' }
    }

    // 啟用 Realtime 更新以同步庫存變更
    const inventoryRealtime = getGlobalInventoryRealtime()
    inventoryRealtime.subscribeToInventory(productId, (event) => {
      if (event.eventType === 'stock_update' || event.eventType === 'status_change') {
        log.debug('產品入庫操作完成，庫存即時更新', {
          productId,
          eventData: event.data
        })

        // 可以在這裡觸發全域狀態更新或通知
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inventory-updated', {
            detail: {
              productId,
              type: 'stock_in',
              data: event.data
            }
          }))
        }
      }
    })

    // 回傳格式調整為符合前端期望的格式
    const inventoryData: Inventory = {
      inventoryId: data.inventory_id,
      productId: data.product_id,
      inventoryCreatedAt: convertToISOString(new Date()),
      inventoryReceivedAt: convertToISOString(new Date()),
      initialQuantity: data.quantity,
      currentStock: data.quantity, // 新建庫存的當前庫存等於初始數量
      totalOut: 0, // 新建庫存尚未出庫
    }

    return { success: true, data: inventoryData }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 統一庫存操作函數 - 使用增強的 stock-adjust Edge Function
 * @param productId 產品ID
 * @param type 操作類型：'in' | 'out' | 'adjust'
 * @param quantity 數量（總是正數）
 * @param reason 操作原因
 * @param source 操作來源
 * @param referenceId 關聯ID（可選）
 * @returns ApiResponse 操作結果
 */
export async function stockOperation(
  productId: string,
  type: 'in' | 'out' | 'adjust',
  quantity: number,
  reason: string,
  source: string = getDefaultSource(INVENTORY_OPERATION_TYPES.ADJUSTMENT),
  referenceId?: string,
): Promise<ApiResponse<any>> {
  try {
    const { data, error } = await supabase.functions.invoke('stock-adjust', {
      body: {
        product_id: productId,
        quantity: Math.abs(quantity), // 確保數量為正數
        type: type,
        reason: reason,
        source: source,
        reference_id: referenceId,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.success) {
      return { success: false, error: data.error || '庫存操作失敗' }
    }

    // 啟用 Realtime 更新以同步庫存變更
    if (data.inventory_id) {
      // 觸發全域庫存更新事件
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('inventory-updated', {
          detail: {
            inventoryId: data.inventory_id,
            type: type === 'adjust' ? 'stock_adjust' : `stock_${type}`,
            adjustQuantity: type === 'out' ? -quantity : quantity,
            newStock: data.new_available_stock,
            reason: data.reason,
            data: data
          }
        }))
      }

      log.debug('產品庫存操作完成', {
        productId,
        operationType: type,
        data
      })
    }

    return { success: true, data: data }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 調整庫存 - 向後兼容的函數（現在使用統一的庫存操作）
 * @param productId 產品ID
 * @param adjustQuantity 調整數量（正數增加，負數減少）
 * @param reason 調整原因
 * @param source 調整來源
 * @returns ApiResponse 調整結果
 */
export async function adjustInventory(
  productId: string,
  adjustQuantity: number,
  reason: string,
  source: string = getDefaultSource(INVENTORY_OPERATION_TYPES.ADJUSTMENT),
): Promise<ApiResponse<any>> {
  // 根據調整數量的正負號決定操作類型
  const operationType = adjustQuantity >= 0 ? 'in' : 'out'

  // 使用新的統一庫存操作函數
  return await stockOperation(
    productId,
    operationType,
    Math.abs(adjustQuantity), // 傳遞正數
    reason,
    source
  )
}

/**
 * 取得產品分類列表
 * @returns ApiResponse 分類列表
 */
export async function getCategories(): Promise<ApiResponse> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 新增產品分類
 * @param categoryData 分類資料
 * @returns ApiResponse<Category> 新增的分類
 */
export async function createCategory(categoryData: {
  name: string
  description?: string | null
  translations?: Record<string, any> | null
}): Promise<ApiResponse<DbCategory>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select('*')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const category = mapDbCategoryToCategory(data)
    return { success: true, data: category }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 更新產品分類
 * @param id 分類ID
 * @param updates 更新的資料
 * @returns ApiResponse<Category> 更新後的分類
 */
export async function updateCategory(
  id: number,
  updates: {
    name?: string
    description?: string | null
    translations?: Record<string, any> | null
  },
): Promise<ApiResponse<DbCategory>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    const category = mapDbCategoryToCategory(data)
    return { success: true, data: category }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

/**
 * 刪除產品分類
 * @param id 分類ID
 * @returns ApiResponse 刪除結果
 */
export async function deleteCategory(id: number): Promise<ApiResponse> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: null }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '發生未知錯誤'
    return { success: false, error: errorMessage }
  }
}

export function useCategory(
  getCategoriesImpl = getCategories,
  createCategoryImpl = createCategory,
  updateCategoryImpl = updateCategory,
  deleteCategoryImpl = deleteCategory,
) {
  const categories = ref<DbCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadCategories() {
    loading.value = true
    error.value = null
    try {
      const response = await getCategoriesImpl()
      if (response.success && response.data) {
        categories.value = response.data.map(mapDbCategoryToCategory)
      } else {
        error.value = response.error?.toString() || '載入分類失敗'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入分類時發生錯誤'
    } finally {
      loading.value = false
    }
  }

  async function addCategory(categoryData: {
    name: string
    description?: string | null
    translations?: Record<string, any> | null
  }) {
    loading.value = true
    error.value = null
    try {
      const response = await createCategoryImpl(categoryData)
      if (response.success && response.data) {
        await loadCategories() // 重新載入列表以更新 UI
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.toString() || '新增分類失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '新增分類時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function editCategory(
    id: number,
    updates: {
      name?: string
      description?: string | null
      translations?: Record<string, any> | null
    },
  ) {
    loading.value = true
    error.value = null
    try {
      const response = await updateCategoryImpl(id, updates)
      if (response.success && response.data) {
        await loadCategories() // 重新載入列表以更新 UI
        return { success: true, data: response.data }
      } else {
        error.value = response.error?.toString() || '更新分類失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新分類時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function removeCategory(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await deleteCategoryImpl(id)
      if (response.success) {
        await loadCategories() // 重新載入列表以更新 UI
        return { success: true }
      } else {
        error.value = response.error?.toString() || '刪除分類失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除分類時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    categories,
    loading,
    error,
    loadCategories,
    addCategory,
    editCategory,
    removeCategory,
  }
}

// 使用產品管理 composable
// DI for testability
export function useProduct(
  getProductByIdImpl = getProductById,
  updateProductImpl = updateProduct,
  deleteProductImpl = deleteProduct,
  updateProductStatusImpl = updateProductStatus,
  updateInventoryImpl = updateInventory,
) {
  const product = ref<Product | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 載入產品資料
  async function loadProduct(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await getProductByIdImpl(id)
      if (response.success && response.data) {
        product.value = response.data as Product
      } else {
        error.value = response.error?.toString() || '載入產品失敗'
        product.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入產品時發生錯誤'
      product.value = null
    } finally {
      loading.value = false
    }
  }

  // 根據 SKU 載入產品資料
  async function loadProductBySKU(sku: string) {
    loading.value = true
    error.value = null

    try {
      const response = await getProductBySKU(sku)
      if (response.success && response.data) {
        product.value = response.data as Product
      } else {
        error.value = response.error?.toString() || '載入產品失敗'
        product.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '載入產品時發生錯誤'
      product.value = null
    } finally {
      loading.value = false
    }
  }

  // 更新產品
  async function saveProduct(
    id: string,
    updates: {
      name?: string
      price?: number
      categoryId?: number | null // 前端統一用駝峰式
      imageUrl?: string | null
      description?: string | null
      translations?: Record<string, any> | null
    },
  ) {
    loading.value = true
    error.value = null

    try {
      // 直接傳遞 camelCase 格式，讓 ProductApiService.mapEntityToDb() 處理轉換
      const response = await updateProductImpl(id, updates)
      if (response.success && response.data) {
        product.value = response.data as Product
        return { success: true, data: product.value }
      } else {
        error.value = response.error?.toString() || '更新產品失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新產品時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 刪除產品
  async function removeProduct(id: string) {
    loading.value = true
    error.value = null

    try {
      const response = await deleteProductImpl(id)
      if (response.success) {
        if (product.value && product.value.id === id) {
          product.value = null
        }
        return { success: true }
      } else {
        error.value = response.error?.toString() || '刪除產品失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刪除產品時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新產品狀態
  async function updateProductStatusInternal(
    id: string,
    status: 'draft' | 'active' | 'inactive' | 'archived'
  ): Promise<ApiResponse<Product>> {
    loading.value = true
    error.value = null

    try {
      // 使用專門的 updateProductStatusImpl
      const response = await updateProductStatusImpl(id, status)
      if (response.success && response.data) {
        product.value = response.data as Product
        return { success: true, data: product.value }
      } else {
        error.value = response.error?.toString() || '更新產品狀態失敗'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新產品狀態時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 更新庫存
  async function updateProductInventory(
    productId: string,
    updates: {
      quantity: number
      source: string
      ref_id: string
    },
  ) {
    loading.value = true
    error.value = null

    try {
      const response = await updateInventoryImpl(productId, updates)
      if (
        response.data &&
        response.data?.productId === productId &&
        product.value
      ) {
        // 更新本地產品庫存資料
        Object.assign(product.value, {
          totalStock: response.data.currentStock,
        })

        // 啟用 Realtime 更新以同步庫存變更
        const inventoryRealtime = getGlobalInventoryRealtime()
        inventoryRealtime.subscribeToInventory(productId, (event) => {
          if (event.eventType === 'stock_update' && product.value) {
            // 即時更新產品庫存資訊
            Object.assign(product.value, {
              totalStock: event.data.current_stock || event.data.currentStock,
            })
            log.debug('產品庫存已即時更新', {
              productId,
              eventData: event.data
            })
          }
        })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新庫存時發生錯誤'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  return {
    product,
    loading,
    error,
    loadProduct,
    loadProductBySKU,
    saveProduct,
    removeProduct,
    updateProductStatus: updateProductStatusInternal,
    updateProductInventory,
  }
}

export async function getProductOverview(): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.getProductOverview()
}

export async function getInventoryOverview(): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const productApiService = new ProductApiService(supabase)
  return await productApiService.getInventoryOverview()
}

// 資料庫模型轉換為前端模型
export function mapDbProductToProduct(
  dbProduct: any,
  // inventory: DbInventory | null = null,
): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price,
    categoryId: dbProduct.category_id,
    categoryName: dbProduct.categories?.name,
    imageUrl: dbProduct.image_url,
    description: dbProduct.description,
    translations: dbProduct.translations,
    stockThreshold: dbProduct.stock_threshold || 10,
    status: dbProduct.status,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
    deletedAt: dbProduct.deleted_at,
    totalStock: dbProduct.current_stock,
    stockWarningThreshold: dbProduct.stock_warning_threshold,
    needsRestock: dbProduct.needs_restock,
  }
}

// 前端模型轉換為資料庫模型
export function mapProductToDbProduct(
  product: any,
  // inventory: DbInventory | null = null,
): Omit<DbProduct, 'id' | 'created_at'> {
  return {
    name: product.name,
    price: product.price,
    category_id: product.categoryId,
    image_url: product.imageUrl,
    description: product.description,
    translations: product.translations,
    stock_threshold: product.stockThreshold || 10,
    status: product.status || 'draft',
    updated_at: new Date().toISOString(),
  }
}

export function mapDbInventoryWithStockToInventory(
  dbInventory: any,
): Inventory {
  return {
    inventoryId: dbInventory.inventory_id,
    inventoryNumber: dbInventory.inventory_number,
    productId: dbInventory.product_id,
    inventoryCreatedAt: dbInventory.inventory_created_at,
    inventoryReceivedAt: dbInventory.received_at,
    // 原始數值（用於計算和排序）
    initialQuantity: dbInventory.initial_quantity,
    currentStock: dbInventory.current_stock,
    totalOut: dbInventory.total_out,
    // 格式化的顯示值
    initialQuantityDisplay: businessFormatters.stockQuantity(dbInventory.initial_quantity),
    currentStockDisplay: businessFormatters.stockQuantity(dbInventory.current_stock),
    totalOutDisplay: businessFormatters.stockQuantity(dbInventory.total_out),
  }
}

// 資料庫模型轉換為前端模型
export function mapDbCategoryToCategory(dbCategory: any): DbCategory {
  return {
    id: dbCategory.id,
    name: dbCategory.name,
    description: dbCategory.description,
    translations: dbCategory.translations,
  }
}

// 前端模型轉換為資料庫模型
export function mapCategoryToDbCategory(category: any): DbCategory {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    translations: category.translations,
  }
}
