import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as XLSX from 'xlsx'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Data fetching functions
async function fetchOrders(filters: Record<string, any> = {}) {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.order_ids?.length > 0) {
    query = query.in('id', filters.order_ids)
  }

  const { data, error } = await query.limit(1000)
  
  if (error) throw error
  return data || []
}

async function fetchUsers(filters: Record<string, any> = {}) {
  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.user_ids?.length > 0) {
    query = query.in('id', filters.user_ids)
  }

  const { data, error } = await query.limit(1000)
  
  if (error) throw error
  return data || []
}


async function fetchProducts(filters: Record<string, any> = {}) {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.product_ids?.length > 0) {
    query = query.in('id', filters.product_ids)
  }

  const { data, error } = await query.limit(1000)
  
  if (error) throw error
  return data || []
}

async function fetchCustomers(filters: Record<string, any> = {}) {
  let query = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.customer_ids?.length > 0) {
    query = query.in('id', filters.customer_ids)
  }

  const { data, error } = await query.limit(1000)
  
  if (error) throw error
  return data || []
}

async function fetchInventory(filters: Record<string, any> = {}) {
  let query = supabase
    .from('product_inventory_status')
    .select('*')
    .order('product_id', { ascending: false })

  if (filters.inventory_ids?.length > 0) {
    // inventory_ids 實際上是 product_ids
    query = query.in('product_id', filters.inventory_ids)
  }

  const { data, error } = await query.limit(1000)
  
  if (error) throw error
  return data || []
}

// Data transformation functions
function transformOrders(orders: any[]) {
  return orders.map(order => ({
    '訂單ID': order.id,
    '訂單編號': order.order_number || '',
    '客戶ID': order.user_id || '',
    '訂單狀態': getOrderStatusDisplay(order.status),
    '訂單金額': order.total_amount || 0,
    '運費': order.shipping_fee || 0,
    '折扣': order.discount_amount || 0,
    '稅額': order.tax_amount || 0,
    '收貨地址': order.shipping_address || '',
    '聯絡電話': order.contact_phone || '',
    '聯絡郵箱': order.contact_email || '',
    '建立時間': formatDate(order.created_at),
    '更新時間': formatDate(order.updated_at),
  }))
}

function transformProducts(products: any[]) {
  return products.map(product => ({
    '產品ID': product.id,
    '產品名稱': product.name || '',
    'SKU': product.sku || '',
    '產品描述': product.description || '',
    '分類ID': product.category_id || '',
    '價格': product.price || 0,
    '成本': product.cost || 0,
    '是否啟用': product.is_active ? '啟用' : '停用',
    '圖片URL': product.image_url || '',
    '建立時間': formatDate(product.created_at),
    '更新時間': formatDate(product.updated_at),
  }))
}

function transformCustomers(customers: any[]) {
  return customers.map(customer => ({
    '客戶ID': customer.id,
    '姓名': customer.full_name || '',
    '郵箱': customer.email || '',
    '電話': customer.phone || '',
    '地址': customer.address || '',
    '生日': customer.birthday ? formatDate(customer.birthday) : '',
    '性別': customer.gender || '',
    '狀態': customer.is_active ? '啟用' : '停用',
    '註冊時間': formatDate(customer.created_at),
    '最後更新': formatDate(customer.updated_at),
  }))
}

function transformInventory(inventory: any[]) {
  return inventory.map(item => ({
    '產品ID': item.product_id || '',
    '產品名稱': item.name || '',
    'SKU': item.sku || '',
    '總庫存': item.total_stock || 0,
    '可用庫存': item.free_stock || 0,
    '預留數量': item.reserved_quantity || 0,
    '庫存緩衝': item.stock_buffer || 0,
    '警戒值': item.stock_threshold || 0,
    '庫存狀態': getStockStatusDisplay(item.stock_status || ''),
    '狀態排序': item.stock_status_order || 0,
  }))
}

function transformUsers(users: any[]) {
  return users.map(user => ({
    '用戶ID': user.id,
    '姓名': user.full_name || '',
    '郵箱': user.email || '',
    '電話': user.phone || '',
    '地址': user.address || '',
    '生日': user.birthday ? formatDate(user.birthday) : '',
    '性別': user.gender || '',
    '角色': Array.isArray(user.roles) ? user.roles.join(', ') : user.roles || '',
    '狀態': user.is_active ? '啟用' : '停用',
    '最後登入': user.last_login_at ? formatDate(user.last_login_at) : '從未登入',
    '註冊時間': formatDate(user.created_at),
    '最後更新': formatDate(user.updated_at),
  }))
}


// Helper functions
function getOrderStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '待處理',
    'confirmed': '已確認',
    'paid': '已付款',
    'processing': '處理中',
    'shipped': '已出貨',
    'delivered': '已送達',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunded': '已退款'
  }
  return statusMap[status] || status
}

function getStockStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'in_stock': '有庫存',
    'low_stock': '庫存不足',
    'out_of_stock': '無庫存',
    'overstock': '庫存過多'
  }
  return statusMap[status] || status
}



function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { type, filters = {} } = await req.json()

    let data: any[] = []
    let filename = ''
    let worksheetName = ''

    // Fetch data based on type
    switch (type) {
      case 'orders':
        data = transformOrders(await fetchOrders(filters))
        filename = `訂單資料_${new Date().toISOString().split('T')[0]}.xlsx`
        worksheetName = '訂單資料'
        break
      
      case 'products':
        data = transformProducts(await fetchProducts(filters))
        filename = `產品資料_${new Date().toISOString().split('T')[0]}.xlsx`
        worksheetName = '產品資料'
        break
      
      case 'customers':
        data = transformCustomers(await fetchCustomers(filters))
        filename = `客戶資料_${new Date().toISOString().split('T')[0]}.xlsx`
        worksheetName = '客戶資料'
        break
      
      case 'inventory':
        data = transformInventory(await fetchInventory(filters))
        filename = `庫存資料_${new Date().toISOString().split('T')[0]}.xlsx`
        worksheetName = '庫存資料'
        break
      
      case 'users':
        data = transformUsers(await fetchUsers(filters))
        filename = `用戶資料_${new Date().toISOString().split('T')[0]}.xlsx`
        worksheetName = '用戶資料'
        break
      
      
      case 'analytics':
        // Analytics type expects data to be provided in filters._custom_data
        if (filters._custom_data && Array.isArray(filters._custom_data)) {
          data = filters._custom_data
          filename = filters._custom_filename || `分析報表_${new Date().toISOString().split('T')[0]}.xlsx`
          worksheetName = filters._custom_sheet_name || '分析報表'
        } else {
          throw new Error('Analytics 匯出需要在 filters._custom_data 中提供資料陣列')
        }
        break
      
      default:
        throw new Error(`不支援的匯出類型: ${type}`)
    }

    if (data.length === 0) {
      return new Response(
        JSON.stringify({ error: '沒有找到要匯出的資料' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Excel workbook using SheetJS
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // 自動調整欄寬
    const headers = Object.keys(data[0])
    const colWidths = headers.map(header => ({
      wch: Math.max(
        header.length,
        ...data.slice(0, 100).map(row => String(row[header] || '').length)
      ) + 2
    }))
    worksheet['!cols'] = colWidths
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName)

    // 生成 Excel 檔案 buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Return Excel file as response
    return new Response(excelBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': excelBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('XLSX Export Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || '匯出過程中發生錯誤',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})