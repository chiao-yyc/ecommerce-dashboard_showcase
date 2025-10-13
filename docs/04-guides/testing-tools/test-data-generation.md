# 測試數據生成指南

## 概述

本指南詳細說明如何使用 `front-stage-vue` 專案中的測試數據生成系統，為電商平台創建各種真實的測試場景和數據。

## 核心工具

### Faker.js 整合
專案使用 `@faker-js/faker` 作為主要的測試數據生成工具：

```typescript
import { faker } from '@faker-js/faker'

// 設定中文本地化
faker.setLocale('zh_TW')

// 設定固定種子，確保可重現的測試數據
faker.seed(12345)
```

### 數據生成服務
位於 `src/api/seedFaker.ts` 的核心數據生成服務：

```typescript
export class TestDataGenerator {
  static generateCustomers(count: number): Customer[]
  static generateProducts(count: number): Product[]
  static generateOrders(customerId: string, count: number): Order[]
  static generateConversations(customerId: string, count: number): Conversation[]
}
```

## 👥 客戶數據生成

### 基本客戶資料
```typescript
function generateCustomer(): Customer {
  const gender = faker.person.sexType()
  const firstName = faker.person.firstName(gender)
  const lastName = faker.person.lastName(gender)
  
  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }),
    name: `${firstName} ${lastName}`,
    phone: faker.phone.number('09########'),
    dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
    avatar: faker.image.avatar(),
    
    // 地址資訊
    address: {
      street: faker.location.streetAddress(),
      city: faker.helpers.arrayElement([
        '台北市', '新北市', '桃園市', '台中市', 
        '台南市', '高雄市', '新竹市', '嘉義市'
      ]),
      district: faker.location.secondaryAddress(),
      zipCode: faker.location.zipCode('###')
    },
    
    // 客戶等級
    tier: faker.helpers.weightedArrayElement([
      { weight: 60, value: 'bronze' },
      { weight: 25, value: 'silver' },
      { weight: 12, value: 'gold' },
      { weight: 3, value: 'platinum' }
    ]),
    
    // 時間戳
    createdAt: faker.date.recent({ days: 365 }),
    lastLoginAt: faker.date.recent({ days: 30 })
  }
}
```

### 客戶行為特徵
```typescript
function generateCustomerBehavior(customerId: string) {
  return {
    customerId,
    
    // 購物偏好
    preferences: {
      categories: faker.helpers.arrayElements([
        '3C電子', '服飾配件', '家居用品', '美妝保養', 
        '運動健身', '書籍文具', '食品飲料'
      ], { min: 1, max: 3 }),
      
      priceRange: faker.helpers.arrayElement([
        { min: 0, max: 1000 },
        { min: 1000, max: 3000 },
        { min: 3000, max: 10000 },
        { min: 10000, max: 50000 }
      ])
    },
    
    // 活躍度指標
    activity: {
      loginFrequency: faker.number.int({ min: 1, max: 30 }), // 每月登入次數
      avgOrderValue: faker.number.int({ min: 500, max: 8000 }), // 平均訂單金額
      purchaseFrequency: faker.number.int({ min: 1, max: 10 }) // 每月購買次數
    }
  }
}
```

## 🛍️ 商品數據生成

### 商品基本資訊
```typescript
function generateProduct(): Product {
  const category = faker.helpers.arrayElement([
    '3C電子', '服飾配件', '家居用品', '美妝保養', 
    '運動健身', '書籍文具', '食品飲料'
  ])
  
  return {
    id: faker.string.uuid(),
    name: generateProductName(category),
    description: faker.commerce.productDescription(),
    category,
    
    // 價格資訊
    price: {
      original: faker.number.int({ min: 100, max: 10000 }),
      discount: faker.number.float({ min: 0.1, max: 0.5, precision: 0.01 }),
      currency: 'TWD'
    },
    
    // 庫存資訊
    inventory: {
      quantity: faker.number.int({ min: 0, max: 999 }),
      lowStockThreshold: faker.number.int({ min: 5, max: 20 }),
      isInStock: true // 根據 quantity 動態計算
    },
    
    // 商品圖片
    images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => 
      faker.image.urlPicsumPhotos({ width: 400, height: 300 })
    ),
    
    // 規格選項
    variants: generateProductVariants(),
    
    // SEO 資訊
    seo: {
      slug: faker.helpers.slugify(faker.commerce.productName()),
      tags: faker.helpers.arrayElements([
        '熱門', '新品', '限時優惠', '免運費', '精選商品'
      ], { min: 0, max: 3 })
    },
    
    // 評價資訊
    rating: {
      average: faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
      count: faker.number.int({ min: 0, max: 500 })
    },
    
    createdAt: faker.date.recent({ days: 180 }),
    updatedAt: faker.date.recent({ days: 30 })
  }
}

function generateProductName(category: string): string {
  const nameTemplates = {
    '3C電子': () => `${faker.commerce.productAdjective()} ${faker.helpers.arrayElement([
      '智慧手機', '筆記型電腦', '無線耳機', '智能手錶', '平板電腦'
    ])}`,
    '服飾配件': () => `${faker.commerce.productAdjective()} ${faker.helpers.arrayElement([
      'T恤', '牛仔褲', '洋裝', '運動鞋', '手提包'
    ])}`,
    '家居用品': () => `${faker.commerce.productAdjective()} ${faker.helpers.arrayElement([
      '收納盒', '抱枕', '檯燈', '花瓶', '地毯'
    ])}`
    // ... 其他分類
  }
  
  return nameTemplates[category]?.() || faker.commerce.productName()
}
```

### 商品變體
```typescript
function generateProductVariants() {
  const variantTypes = ['顏色', '尺寸', '規格']
  const selectedTypes = faker.helpers.arrayElements(variantTypes, { min: 1, max: 2 })
  
  return selectedTypes.map(type => ({
    type,
    options: generateVariantOptions(type)
  }))
}

function generateVariantOptions(type: string) {
  const optionMap = {
    '顏色': ['黑色', '白色', '紅色', '藍色', '綠色'],
    '尺寸': ['S', 'M', 'L', 'XL', 'XXL'],
    '規格': ['標準版', '豪華版', '專業版']
  }
  
  return faker.helpers.arrayElements(optionMap[type], { min: 2, max: 4 })
}
```

## 📦 訂單數據生成

### 訂單基本資訊
```typescript
function generateOrder(customerId: string): Order {
  const orderItems = generateOrderItems()
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 1000 ? 0 : 100 // 滿千免運
  const total = subtotal + shipping
  
  return {
    id: faker.string.uuid(),
    orderNumber: generateOrderNumber(),
    customerId,
    
    // 訂單項目
    items: orderItems,
    
    // 金額資訊
    pricing: {
      subtotal,
      shipping,
      discount: 0,
      tax: Math.round(total * 0.05), // 5% 營業稅
      total: total + Math.round(total * 0.05)
    },
    
    // 訂單狀態
    status: faker.helpers.weightedArrayElement([
      { weight: 20, value: 'pending' },      // 待處理
      { weight: 30, value: 'processing' },   // 處理中
      { weight: 25, value: 'shipped' },      // 已出貨
      { weight: 20, value: 'delivered' },    // 已送達
      { weight: 3, value: 'cancelled' },     // 已取消
      { weight: 2, value: 'returned' }       // 已退貨
    ]),
    
    // 配送資訊
    shipping: {
      method: faker.helpers.arrayElement(['宅配', '超商取貨', '門市自取']),
      address: generateShippingAddress(),
      trackingNumber: faker.string.alphanumeric(10).toUpperCase()
    },
    
    // 付款資訊
    payment: {
      method: faker.helpers.arrayElement(['信用卡', 'ATM轉帳', '超商代碼', '貨到付款']),
      status: faker.helpers.arrayElement(['pending', 'paid', 'failed', 'refunded']),
      transactionId: faker.string.uuid()
    },
    
    // 時間戳記
    createdAt: faker.date.recent({ days: 90 }),
    updatedAt: faker.date.recent({ days: 7 }),
    
    // 備註
    notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null
  }
}

function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const randomStr = faker.string.numeric(6)
  return `ORD${dateStr}${randomStr}`
}

function generateOrderItems(): OrderItem[] {
  const itemCount = faker.number.int({ min: 1, max: 5 })
  
  return Array.from({ length: itemCount }, () => {
    const product = generateProduct() // 簡化版商品
    
    return {
      id: faker.string.uuid(),
      productId: product.id,
      productName: product.name,
      variant: faker.helpers.arrayElement(['標準', '黑色/M', '白色/L']),
      price: product.price.original,
      quantity: faker.number.int({ min: 1, max: 3 }),
      subtotal: product.price.original * faker.number.int({ min: 1, max: 3 })
    }
  })
}
```

## 💬 客服對話生成

### 對話數據
```typescript
function generateConversation(customerId: string): Conversation {
  const subjects = [
    '商品問題諮詢', '退換貨申請', '付款問題', 
    '配送問題', '帳號問題', '優惠活動諮詢'
  ]
  
  return {
    id: faker.string.uuid(),
    customerId,
    agentId: faker.string.uuid(),
    subject: faker.helpers.arrayElement(subjects),
    
    // 對話狀態
    status: faker.helpers.weightedArrayElement([
      { weight: 40, value: 'open' },      // 進行中
      { weight: 45, value: 'resolved' },  // 已解決
      { weight: 10, value: 'pending' },   // 待處理
      { weight: 5, value: 'closed' }      // 已關閉
    ]),
    
    // 優先級
    priority: faker.helpers.weightedArrayElement([
      { weight: 60, value: 'low' },
      { weight: 30, value: 'medium' },
      { weight: 8, value: 'high' },
      { weight: 2, value: 'urgent' }
    ]),
    
    // 對話訊息
    messages: generateConversationMessages(),
    
    // 標籤
    tags: faker.helpers.arrayElements([
      '退款', '換貨', '技術問題', '建議', '投訴'
    ], { min: 0, max: 2 }),
    
    // 滿意度評分
    rating: faker.datatype.boolean(0.7) ? 
      faker.number.int({ min: 3, max: 5 }) : null,
    
    createdAt: faker.date.recent({ days: 30 }),
    updatedAt: faker.date.recent({ days: 7 })
  }
}

function generateConversationMessages(): Message[] {
  const messageCount = faker.number.int({ min: 2, max: 8 })
  const messages: Message[] = []
  
  for (let i = 0; i < messageCount; i++) {
    const isCustomerMessage = i % 2 === 0
    
    messages.push({
      id: faker.string.uuid(),
      sender: isCustomerMessage ? 'customer' : 'agent',
      content: isCustomerMessage ? 
        generateCustomerMessage() : 
        generateAgentMessage(),
      timestamp: faker.date.recent({ days: 7 }),
      attachments: faker.datatype.boolean(0.1) ? 
        [faker.image.urlPicsumPhotos({ width: 300, height: 200 })] : []
    })
  }
  
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}
```

## 數據生成腳本

### 批量生成腳本
```typescript
// src/api/seedFaker.ts
export class BatchDataGenerator {
  /**
   * 生成完整的測試數據集
   */
  static async generateFullDataset() {
    console.log('🚀 開始生成測試數據集...')
    
    try {
      // 1. 生成客戶數據
      const customers = this.generateCustomers(50)
      await this.saveCustomers(customers)
      console.log(`✅ 已生成 ${customers.length} 位客戶`)
      
      // 2. 生成商品數據
      const products = this.generateProducts(200)
      await this.saveProducts(products)
      console.log(`✅ 已生成 ${products.length} 項商品`)
      
      // 3. 生成訂單數據
      let totalOrders = 0
      for (const customer of customers) {
        const orderCount = faker.number.int({ min: 0, max: 5 })
        const orders = this.generateOrders(customer.id, orderCount)
        await this.saveOrders(orders)
        totalOrders += orders.length
      }
      console.log(`✅ 已生成 ${totalOrders} 筆訂單`)
      
      // 4. 生成客服對話
      let totalConversations = 0
      for (const customer of customers) {
        if (faker.datatype.boolean(0.3)) { // 30% 客戶有客服記錄
          const convCount = faker.number.int({ min: 1, max: 3 })
          const conversations = this.generateConversations(customer.id, convCount)
          await this.saveConversations(conversations)
          totalConversations += conversations.length
        }
      }
      console.log(`✅ 已生成 ${totalConversations} 個客服對話`)
      
      console.log('🎉 測試數據生成完成！')
      
    } catch (error) {
      console.error('❌ 數據生成失敗:', error)
      throw error
    }
  }
  
  /**
   * 清理測試數據
   */
  static async cleanTestData() {
    console.log('🧹 開始清理測試數據...')
    
    const tables = ['conversations', 'orders', 'products', 'customers']
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 保留系統數據
      
      if (error) {
        console.error(`清理 ${table} 失敗:`, error)
      } else {
        console.log(`✅ 已清理 ${table} 表格`)
      }
    }
    
    console.log('🎉 測試數據清理完成！')
  }
}
```

### Vue 元件中的使用
```vue
<template>
  <div class="faker-controls">
    <h3>測試數據生成工具</h3>
    
    <div class="control-group">
      <button @click="generateCustomers" :disabled="loading">
        生成客戶數據 ({{ customerCount }} 位)
      </button>
      <input v-model.number="customerCount" type="number" min="1" max="100" />
    </div>
    
    <div class="control-group">
      <button @click="generateProducts" :disabled="loading">
        生成商品數據 ({{ productCount }} 項)
      </button>
      <input v-model.number="productCount" type="number" min="1" max="500" />
    </div>
    
    <div class="control-group">
      <button @click="generateFullDataset" :disabled="loading" class="primary">
        🚀 生成完整數據集
      </button>
      <button @click="cleanAllData" :disabled="loading" class="danger">
        🧹 清理所有測試數據
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      生成中... {{ progress }}%
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BatchDataGenerator } from '@/api/seedFaker'

const loading = ref(false)
const progress = ref(0)
const customerCount = ref(20)
const productCount = ref(100)

const generateCustomers = async () => {
  loading.value = true
  try {
    const customers = BatchDataGenerator.generateCustomers(customerCount.value)
    await BatchDataGenerator.saveCustomers(customers)
  } finally {
    loading.value = false
  }
}

const generateFullDataset = async () => {
  loading.value = true
  try {
    await BatchDataGenerator.generateFullDataset()
  } finally {
    loading.value = false
  }
}

const cleanAllData = async () => {
  if (confirm('確定要清理所有測試數據？此操作無法復原！')) {
    loading.value = true
    try {
      await BatchDataGenerator.cleanTestData()
    } finally {
      loading.value = false
    }
  }
}
</script>
```

## 數據品質控制

### 數據驗證
```typescript
interface DataValidation {
  validateCustomer(customer: Customer): boolean
  validateProduct(product: Product): boolean
  validateOrder(order: Order): boolean
}

export const dataValidator: DataValidation = {
  validateCustomer(customer) {
    return !!(
      customer.id &&
      customer.email &&
      customer.name &&
      customer.email.includes('@') &&
      customer.phone.match(/^09\d{8}$/)
    )
  },
  
  validateProduct(product) {
    return !!(
      product.id &&
      product.name &&
      product.category &&
      product.price.original > 0 &&
      product.inventory.quantity >= 0
    )
  },
  
  validateOrder(order) {
    return !!(
      order.id &&
      order.customerId &&
      order.items.length > 0 &&
      order.pricing.total > 0 &&
      ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].includes(order.status)
    )
  }
}
```

### 數據一致性檢查
```typescript
export class DataConsistencyChecker {
  /**
   * 檢查訂單與客戶的一致性
   */
  static async checkOrderCustomerConsistency() {
    const { data: orders } = await supabase.from('orders').select('*')
    const { data: customers } = await supabase.from('customers').select('id')
    
    const customerIds = new Set(customers?.map(c => c.id))
    const inconsistentOrders = orders?.filter(order => 
      !customerIds.has(order.customerId)
    )
    
    if (inconsistentOrders?.length) {
      console.warn('發現不一致的訂單數據:', inconsistentOrders)
    }
    
    return inconsistentOrders || []
  }
}
```

## 高級功能

### 數據關聯性
```typescript
// 確保生成的數據之間有正確的關聯性
class RelationalDataGenerator {
  static generateCustomerWithHistory(customerId: string) {
    // 先生成客戶基本資料
    const customer = generateCustomer()
    customer.id = customerId
    
    // 根據客戶等級生成對應的訂單歷史
    const orderCount = {
      'bronze': faker.number.int({ min: 1, max: 3 }),
      'silver': faker.number.int({ min: 3, max: 8 }),
      'gold': faker.number.int({ min: 8, max: 15 }),
      'platinum': faker.number.int({ min: 15, max: 30 })
    }[customer.tier]
    
    const orders = Array.from({ length: orderCount }, () => {
      const order = generateOrder(customerId)
      // 根據客戶等級調整訂單金額
      order.pricing.total *= {
        'bronze': 1,
        'silver': 1.2,
        'gold': 1.5,
        'platinum': 2
      }[customer.tier]
      
      return order
    })
    
    return { customer, orders }
  }
}
```

### 時間序列數據
```typescript
// 生成具有時間序列特徵的數據
function generateTimeSeriesOrders(customerId: string, months: number = 12) {
  const orders: Order[] = []
  const baseDate = new Date()
  
  for (let month = 0; month < months; month++) {
    const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - month, 1)
    const ordersInMonth = faker.number.int({ min: 0, max: 4 })
    
    for (let i = 0; i < ordersInMonth; i++) {
      const order = generateOrder(customerId)
      order.createdAt = faker.date.between({
        from: monthDate,
        to: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      })
      orders.push(order)
    }
  }
  
  return orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}
```

## 相關文檔

- [前台測試環境設置](./front-stage-setup.md)
- [客戶行為模擬文檔](./customer-simulation.md)
- [整合測試流程](./integration-testing.md)
- [後台數據管理系統](../../02-development/database/dashboard-analysis.md)

---

*最後更新: $(date "+%Y-%m-%d")*
*適用版本: front-stage-vue v1.0.0*