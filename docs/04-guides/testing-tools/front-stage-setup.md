# 前台測試環境設置指南

## 概述

`front-stage-vue` 是專為支援 `admin-platform-vue` 後台管理系統而建立的前台客戶模擬專案。它提供完整的客戶端體驗測試環境，幫助開發團隊進行端到端測試和功能驗證。

### 專案定位
- **主要用途**: 模擬真實客戶行為，生成測試數據
- **輔助對象**: `admin-platform-vue` 後台管理系統
- **測試範圍**: 客戶註冊、下單、客服對話、支付流程等

## 核心功能

### 1. 客戶身份模擬
- **客戶註冊**: 使用 Faker.js 生成真實的客戶資料
- **身份認證**: 完整的登入/登出流程
- **權限管理**: 模擬不同客戶等級和權限

### 2. 測試數據生成
- **訂單數據**: 自動生成各種訂單場景
- **客服對話**: 模擬客戶服務互動
- **用戶行為**: 瀏覽、購買、評價等行為軌跡

### 3. 與後台整合
- **數據同步**: 與 Supabase 後端實時同步
- **API 共用**: 使用相同的 API 服務架構
- **狀態一致**: 確保前後台數據一致性

## 技術架構

### 核心技術棧
```typescript
{
  "framework": "Vue 3 + TypeScript",
  "build": "Vite",
  "ui": "Reka UI (shadcn/ui for Vue)",
  "styling": "Tailwind CSS",
  "state": "Pinia",
  "api": "TanStack Query + Supabase",
  "testing": "@faker-js/faker",
  "i18n": "Vue I18n"
}
```

### 專案結構
```
front-stage-vue/
├── src/
│   ├── api/                 # API 服務層
│   │   ├── services/        # 業務 API 服務
│   │   ├── seedFaker.ts     # 測試數據生成
│   │   └── supabase.ts      # Supabase 客戶端
│   ├── components/          # Vue 元件
│   │   ├── ui/              # 基礎 UI 元件
│   │   ├── support/         # 客服相關元件
│   │   └── DevFloatingWidget.vue # 開發輔助工具
│   ├── composables/         # Vue Composables
│   ├── store/              # Pinia 狀態管理
│   ├── types/              # TypeScript 類型定義
│   └── locales/            # 國際化語言包
├── package.json
└── vite.config.ts
```

## 環境設置

### 1. 系統需求
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **Git**: 版本控制

### 2. 專案初始化

#### 克隆專案
```bash
cd /Users/yangyachiao/Documents/2025/ecommerce-dashboard
# 專案已經存在於 front-stage-vue/ 目錄中
cd front-stage-vue
```

#### 安裝依賴
```bash
npm install
```

#### 環境變數設置
創建 `.env.local` 檔案：
```env
# Supabase 配置 (與後台共用)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 前台專用配置
VITE_APP_NAME=電商前台測試系統
VITE_APP_VERSION=1.0.0

# 測試數據配置
VITE_FAKER_SEED=12345
VITE_ENABLE_TEST_MODE=true

# 模擬配置
VITE_SIMULATE_DELAY=1000
VITE_ENABLE_DEBUG_MODE=true

# API 配置
VITE_API_BASE_URL=https://your-project.supabase.co/rest/v1
```

### 3. 與後台專案連接

#### 確認 Supabase 配置一致
```typescript
// 確保與 admin-platform-vue 使用相同的 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 檢查配置是否正確
console.log('Supabase URL:', supabaseUrl)
```

#### 驗證 API 連接
```bash
npm run dev
# 開啟瀏覽器到 http://localhost:5173
# 檢查開發者控制台是否有連接錯誤
```

### 4. 啟動開發環境

#### 啟動前台測試環境
```bash
npm run dev
```
預設運行在 `http://localhost:5173`

#### 同時啟動後台管理系統
```bash
# 另開一個終端視窗
cd ../admin-platform-vue
npm run dev
```
預設運行在 `http://localhost:5174`

## 開發工具

### 1. DevFloatingWidget 開發輔助工具
前台專案包含一個浮動的開發輔助工具，提供：

```vue
<template>
  <DevFloatingWidget>
    <!-- 快速測試功能 -->
    <FakerSeedButton @click="generateTestData" />
    <SyncStatusIndicator :status="syncStatus" />
    <!-- 其他開發工具 -->
  </DevFloatingWidget>
</template>
```

功能包括：
- **測試數據生成**: 一鍵生成各種測試場景數據
- **同步狀態監控**: 監控與後台的數據同步狀態
- **快速操作**: 常用的開發和測試操作

### 2. 測試數據生成器

#### 客戶數據生成
```typescript
import { faker } from '@faker-js/faker'

// 生成客戶數據
function generateCustomer() {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      zipCode: faker.location.zipCode()
    },
    createdAt: faker.date.recent({ days: 90 })
  }
}
```

#### 訂單數據生成
```typescript
// 生成訂單數據
function generateOrder(customerId: string) {
  return {
    id: faker.string.uuid(),
    customerId,
    products: generateOrderProducts(),
    total: faker.commerce.price({ min: 100, max: 5000 }),
    status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered']),
    createdAt: faker.date.recent({ days: 30 })
  }
}
```

## 資料庫整合

### 1. 與後台共用資料表
前台和後台共用相同的 Supabase 資料庫：

```sql
-- 主要共用資料表
customers       -- 客戶資料
orders          -- 訂單資料
products        -- 產品資料
conversations   -- 客服對話
notifications   -- 通知資料
```

### 2. 權限設置 (RLS)
確保前台客戶只能存取自己的資料：

```sql
-- 客戶只能查看自己的訂單
CREATE POLICY "Customers can view own orders" ON orders
FOR SELECT USING (customer_id = auth.uid());

-- 客戶只能更新自己的個人資料
CREATE POLICY "Customers can update own profile" ON customers
FOR UPDATE USING (id = auth.uid());
```

### 3. 資料同步機制
```typescript
// 使用 TanStack Query 進行資料同步
import { useQuery } from '@tanstack/vue-query'

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ['customer-orders', customerId],
    queryFn: () => OrderApiService.getCustomerOrders(customerId),
    refetchInterval: 30000 // 30秒同步一次
  })
}
```

## 🧪 測試場景

### 1. 客戶註冊流程測試
```typescript
// 測試新客戶註冊
async function testCustomerRegistration() {
  const customerData = generateCustomer()
  const result = await CustomerApiService.register(customerData)
  console.log('客戶註冊結果:', result)
}
```

### 2. 購物流程測試
```typescript
// 測試完整購物流程
async function testPurchaseFlow() {
  // 1. 客戶瀏覽商品
  const products = await ProductApiService.getProducts()
  
  // 2. 加入購物車
  const cartItems = selectRandomProducts(products, 3)
  
  // 3. 結帳
  const order = await OrderApiService.createOrder(cartItems)
  
  console.log('購物流程測試完成:', order)
}
```

### 3. 客服對話測試
```typescript
// 測試客服對話功能
async function testCustomerService() {
  const conversation = await ConversationApiService.create({
    customerId: currentCustomer.id,
    subject: '商品問題諮詢',
    message: faker.lorem.sentences(3)
  })
  
  console.log('客服對話創建:', conversation)
}
```

## 🔍 監控與除錯

### 1. 開發模式日誌
```typescript
// 開啟詳細日誌模式
if (import.meta.env.VITE_ENABLE_DEBUG_MODE) {
  console.log('🔍 前台測試環境啟用除錯模式')
  
  // 記錄 API 請求
  axios.interceptors.request.use(request => {
    console.log('📤 API 請求:', request.url)
    return request
  })
  
  // 記錄 API 響應
  axios.interceptors.response.use(response => {
    console.log('📥 API 響應:', response.status)
    return response
  })
}
```

### 2. 同步狀態監控
```typescript
// 監控與後台的數據同步狀態
export function useSyncStatus() {
  const syncStatus = ref('idle')
  
  const checkSync = async () => {
    try {
      await supabase.from('health_check').select('*').limit(1)
      syncStatus.value = 'connected'
    } catch (error) {
      syncStatus.value = 'disconnected'
    }
  }
  
  return { syncStatus, checkSync }
}
```

## 注意事項

### 1. 數據隔離
- 測試數據應該明確標記，避免與生產數據混淆
- 建議使用專門的測試資料庫或明確的數據標籤

### 2. 效能考慮
- 大量測試數據生成時注意資料庫效能
- 適時清理過期的測試數據

### 3. 安全性
- 測試環境不應包含真實的敏感資料
- 確保測試 API Key 的權限範圍適當

## 相關文檔

- [測試數據生成指南](./test-data-generation.md)
- [客戶行為模擬文檔](./customer-simulation.md)
- [整合測試流程](./integration-testing.md)
- [後台管理系統文檔](../../02-development/architecture/architecture.md)

---

*最後更新: $(date "+%Y-%m-%d")*
*適用版本: front-stage-vue v1.0.0*