# OrderApiService API 文件

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐⭐ (核心業務)

---

## 概覽

### 業務用途

OrderApiService 是訂單管理系統的核心 API 服務，負責處理訂單的完整生命週期，包含訂單建立、狀態流轉、訂單項目管理、付款追蹤、物流管理和訂單分析統計。

### 核心功能

- **訂單 CRUD** - 訂單建立、查詢、更新、狀態管理
- **訂單項目管理** - 訂單明細的新增、修改、查詢
- **訂單狀態流轉** - 9 種狀態的嚴格狀態機控制
- **付款管理** - 付款狀態追蹤、付款記錄整合
- **物流追蹤** - 運送方式、追蹤號碼、送達狀態
- **訂單統計** - 日銷售數據、趨勢分析、概覽報表

### 技術架構

- **繼承**: `BaseApiService<Order, DbOrder>`
- **資料表**:
  - `orders` (主表) - 訂單基本資訊
  - `order_items` - 訂單項目明細
  - `payments` - 付款記錄
  - `customer_details` (視圖) - 客戶資訊關聯
  - `products` - 商品資訊關聯
- **狀態機**: 9 種訂單狀態嚴格流轉控制（資料庫觸發器）
- **前端使用**:
  - `OrdersView.vue` - 訂單列表
  - `OrderDetailView.vue` - 訂單詳情
  - `DashboardOverview.vue` - 訂單統計

### 資料庫層 API 參考

> **Supabase 自動生成文件**
>
> 如需查詢 `orders` 資料表的基礎 Schema 和 PostgREST API：
>
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `orders` / `order_items` / `payments`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
>
> - ✅ 查詢資料表欄位結構和關聯關係
> - ✅ 了解訂單狀態的資料庫約束
> - ✅ 檢視 RLS 政策和觸發器
>
> **何時使用本文件**：
>
> - ✅ 使用 `OrderApiService` 的訂單狀態流轉邏輯
> - ✅ 了解訂單項目管理和付款整合
> - ✅ 學習訂單統計和分析方法
> - ✅ 查看資料映射規則和錯誤處理

---

## API 方法詳細說明

### 訂單查詢方法

#### `fetchOrdersWithPagination()` - 進階分頁查詢 ⭐ 推薦

**用途**: 訂單列表查詢，支援狀態篩選、日期範圍、排序、搜尋

**方法簽名**:

```typescript
async fetchOrdersWithPagination(options: {
  page?: number
  perPage?: number
  status?: OrderStatus[]
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  searchTerm?: string
}): Promise<ApiPaginationResponse<Order>>
```

**使用範例**:

```typescript
// 基本查詢
const result = await orderService.fetchOrdersWithPagination({
  page: 1,
  perPage: 20,
});

// 狀態篩選 - 查詢待處理訂單
const pendingOrders = await orderService.fetchOrdersWithPagination({
  status: [OrderStatus.PENDING, OrderStatus.CONFIRMED],
  sortBy: "createdAt",
  sortOrder: "desc",
});

// 日期範圍查詢 - 本月訂單
const monthlyOrders = await orderService.fetchOrdersWithPagination({
  dateFrom: "2025-10-01",
  dateTo: "2025-10-31",
  page: 1,
  perPage: 50,
});

// 搜尋訂單號
const searchResult = await orderService.fetchOrdersWithPagination({
  searchTerm: "ORD-2025",
  page: 1,
});
```

**回傳資料包含**:

- 訂單基本資訊
- 訂單項目 (order_items)
- 客戶資訊 (customer_details)
- 付款狀態 (payments)

---

#### `getOrderById()` - ID 查詢

**用途**: 根據 UUID 查詢訂單詳情

**方法簽名**:

```typescript
async getOrderById(id: string): Promise<ApiResponse<Order>>
```

**使用範例**:

```typescript
const result = await orderService.getOrderById("order-uuid");

if (result.success && result.data) {
  console.log("訂單號:", result.data.orderNumber);
  console.log("狀態:", result.data.status);
  console.log("總金額:", result.data.totalAmount);
  console.log("訂單項目:", result.data.items);
}
```

---

#### `getOrderByOrderNumber()` - 訂單號查詢

**用途**: 根據訂單編號（例如 ORD-2025-001）查詢訂單

**方法簽名**:

```typescript
async getOrderByOrderNumber(orderNumber: string): Promise<ApiResponse<Order>>
```

**使用範例**:

```typescript
const result = await orderService.getOrderByOrderNumber("ORD-2025-001");

if (result.success) {
  if (result.data) {
    console.log("找到訂單:", result.data.id);
  } else {
    console.log("查無此訂單號");
  }
}
```

**適用場景**: 客服查詢、訂單追蹤、匯入驗證

---

#### `getOrderByUserId()` - 客戶訂單查詢

**用途**: 查詢特定客戶的所有訂單

**方法簽名**:

```typescript
async getOrderByUserId(userId: string): Promise<ApiResponse<Order[]>>
```

**使用範例**:

```typescript
const result = await orderService.getOrderByUserId("customer-uuid");

if (result.success) {
  const orders = result.data;
  console.log("客戶訂單數:", orders.length);
  console.log(
    "累計消費:",
    orders.reduce((sum, o) => sum + o.totalAmount, 0)
  );
}
```

---

#### `getOrderWithItems()` - 訂單含項目查詢

**用途**: 查詢訂單及其完整訂單項目明細

**方法簽名**:

```typescript
async getOrderWithItems(orderId: string): Promise<ApiResponse<Order>>
```

**回傳資料**:

```typescript
{
  success: true,
  data: {
    id: 'uuid',
    orderNumber: 'ORD-2025-001',
    status: 'paid',
    totalAmount: 5000,
    items: [
      {
        id: 'item-uuid',
        productId: 'product-uuid',
        productName: '商品A',
        quantity: 2,
        unitPrice: 2000,
        totalPrice: 4000
      },
      // ... 更多項目
    ],
    user: {
      id: 'customer-uuid',
      fullName: '張小明',
      email: 'customer@example.com'
    }
  }
}
```

---

### 訂單建立與更新

#### `createOrderWithItems()` - 建立訂單（含項目）⭐

**用途**: 一次性建立訂單及其所有訂單項目

**方法簽名**:

```typescript
async createOrderWithItems(
  orderData: Partial<Order>,
  items: AddOrderItem[]
): Promise<ApiResponse<Order>>
```

**參數**:

```typescript
// orderData - 訂單基本資訊
{
  userId: string           // 必填 - 客戶 ID
  status: OrderStatus      // 選填 - 預設 'pending'
  totalAmount: number      // 必填 - 總金額
  subtotal?: number        // 選填 - 小計
  shippingFee?: number     // 選填 - 運費
  taxAmount?: number       // 選填 - 稅額
  discountAmount?: number  // 選填 - 折扣
  shippingMethod?: string  // 選填 - 運送方式
  shippingAddress?: string // 選填 - 運送地址
  contactName?: string     // 選填 - 聯絡人
  contactPhone?: string    // 選填 - 聯絡電話
  contactEmail?: string    // 選填 - 聯絡信箱
  paymentMethod?: string   // 選填 - 付款方式
  notes?: string           // 選填 - 備註
}

// items - 訂單項目陣列
[
  {
    productId: string  // 商品 ID
    quantity: number   // 數量
    unitPrice: number  // 單價
    totalPrice: number // 小計 (quantity * unitPrice)
  }
]
```

**使用範例**:

```typescript
const orderData = {
  userId: "customer-uuid",
  totalAmount: 5500,
  subtotal: 5000,
  shippingFee: 500,
  taxAmount: 0,
  shippingAddress: "台北市信義區信義路五段7號",
  contactName: "張小明",
  contactPhone: "0912345678",
  paymentMethod: "credit_card",
};

const items = [
  {
    productId: "product-uuid-1",
    quantity: 2,
    unitPrice: 2000,
    totalPrice: 4000,
  },
  {
    productId: "product-uuid-2",
    quantity: 1,
    unitPrice: 1000,
    totalPrice: 1000,
  },
];

const result = await orderService.createOrderWithItems(orderData, items);

if (result.success) {
  console.log("訂單建立成功");
  console.log("訂單號:", result.data.orderNumber);
  console.log("訂單 ID:", result.data.id);
}
```

**業務邏輯**:

1. 交易式處理，確保訂單和項目同時建立成功
2. 自動生成訂單號（格式: ORD-YYYY-NNNN）
3. 自動設置 `createdAt` 時間戳
4. 失敗時自動回滾，不會產生孤兒訂單

---

#### `updateOrderStatus()` - 更新訂單狀態 ⭐

**用途**: 更新訂單狀態，嚴格遵守狀態流轉規則

**方法簽名**:

```typescript
async updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  additionalData?: Record<string, any>
): Promise<ApiResponse<Order>>
```

**訂單狀態流轉規則**:

```typescript
// 允許的狀態轉換（由資料庫觸發器強制執行）
pending → confirmed | cancelled
confirmed → paid | cancelled
paid → processing | cancelled
processing → shipped | cancelled
shipped → delivered
delivered → completed
cancelled → refunded
completed → (最終狀態)
refunded → (最終狀態)
```

**使用範例**:

```typescript
// 確認訂單
await orderService.updateOrderStatus("order-uuid", OrderStatus.CONFIRMED);

// 標記已付款
await orderService.updateOrderStatus("order-uuid", OrderStatus.PAID);

// 標記已出貨（需提供追蹤號碼）
await orderService.updateOrderStatus("order-uuid", OrderStatus.SHIPPED, {
  trackingNumber: "1234567890",
});

// 取消訂單
await orderService.updateOrderStatus("order-uuid", OrderStatus.CANCELLED);
```

**狀態轉換必填欄位**:
| 轉換 | 必填欄位 |
|------|----------|
| `processing` → `shipped` | `trackingNumber` (追蹤號碼) |
| `confirmed` → `paid` | 無（由付款記錄處理） |

**錯誤處理**:

```typescript
const result = await orderService.updateOrderStatus(
  "order-uuid",
  OrderStatus.SHIPPED
);

if (!result.success) {
  // 可能的錯誤原因：
  // 1. 狀態流轉不合法 (例如: pending → shipped)
  // 2. 缺少必填欄位 (例如: 出貨未提供追蹤號碼)
  // 3. 訂單不存在
  console.error("狀態更新失敗:", result.error);
}
```

---

#### `updateOrderFields()` - 更新訂單欄位

**用途**: 更新訂單的其他欄位（非狀態）

**方法簽名**:

```typescript
async updateOrderFields(
  orderId: string,
  updates: Partial<Order>
): Promise<ApiResponse<Order>>
```

**使用範例**:

```typescript
// 更新運送資訊
await orderService.updateOrderFields("order-uuid", {
  shippingAddress: "新地址",
  contactPhone: "0987654321",
  notes: "請於上午送達",
});

// 更新追蹤號碼
await orderService.updateOrderFields("order-uuid", {
  trackingNumber: "TRACK-12345",
  shippedAt: new Date().toISOString(),
});

// 更新折扣
await orderService.updateOrderFields("order-uuid", {
  couponCode: "SAVE20",
  couponDiscount: 100,
  totalAmount: 4900, // 原價 5000 - 折扣 100
});
```

**注意事項**:

- ⚠️ 不可用於更新訂單狀態（請使用 `updateOrderStatus`）
- ⚠️ 更新 `totalAmount` 需確保與訂單項目金額一致
- ⚠️ 自動更新 `updatedAt` 時間戳

---

### 訂單項目管理

#### `fetchOrderItems()` - 查詢訂單項目

**用途**: 查詢特定訂單的所有訂單項目

**方法簽名**:

```typescript
async fetchOrderItems(orderId: string): Promise<ApiResponse<OrderItem[]>>
```

**回傳資料**:

```typescript
{
  success: true,
  data: [
    {
      id: 'item-uuid',
      orderId: 'order-uuid',
      productId: 'product-uuid',
      productName: '商品A',
      productImageUrl: 'https://...',
      quantity: 2,
      unitPrice: 2000,
      totalPrice: 4000,
      status: 'active'
    }
  ]
}
```

---

### 訂單統計分析

#### `getOrderSummary()` - 訂單概覽統計

**用途**: 取得訂單總覽數據（總訂單數、總營收、平均訂單金額等）

**方法簽名**:

```typescript
async getOrderSummary(
  dateFrom?: string,
  dateTo?: string
): Promise<ApiResponse<OrderSummary>>
```

**回傳資料**:

```typescript
interface OrderSummary {
  totalOrders: number; // 總訂單數
  totalRevenue: number; // 總營收
  averageOrderValue: number; // 平均訂單價值 (AOV)
  pendingOrders: number; // 待處理訂單
  completedOrders: number; // 已完成訂單
  cancelledOrders: number; // 已取消訂單
}
```

**使用範例**:

```typescript
// 全部訂單統計
const allTime = await orderService.getOrderSummary();

// 本月訂單統計
const thisMonth = await orderService.getOrderSummary(
  "2025-10-01",
  "2025-10-31"
);

console.log("本月營收:", thisMonth.data.totalRevenue);
console.log("本月訂單數:", thisMonth.data.totalOrders);
console.log("平均訂單金額:", thisMonth.data.averageOrderValue);
```

---

#### `getOrderTrendAnalysis()` - 訂單趨勢分析

**用途**: 取得訂單趨勢數據（用於圖表顯示）

**方法簽名**:

```typescript
async getOrderTrendAnalysis(): Promise<ApiResponse<any>>
```

**回傳資料**: 按日期分組的訂單統計（用於趨勢圖）

**使用範例**:

```typescript
const result = await orderService.getOrderTrendAnalysis();

if (result.success) {
  console.log("趨勢數據:", result.data);
  // 用於繪製訂單趨勢圖表
}
```

---

## 資料結構

### Order 類型 (前端)

```typescript
interface Order {
  // 基本資訊
  id: string; // UUID
  orderNumber?: string; // 訂單號 (ORD-2025-001)
  userId?: string; // 客戶 ID
  status: OrderStatus; // 訂單狀態
  totalAmount: number; // 總金額
  createdAt: string; // 建立時間

  // 金額細項
  subtotal?: number; // 小計
  shippingFee?: number; // 運費
  taxAmount?: number; // 稅額
  discountAmount?: number; // 折扣金額

  // 運送資訊
  shippingMethod?: string; // 運送方式
  shippingAddress?: string; // 運送地址
  trackingNumber?: string; // 追蹤號碼
  shippedAt?: string; // 出貨時間
  deliveredAt?: string; // 送達時間

  // 聯絡資訊
  contactName?: string; // 聯絡人姓名
  contactPhone?: string; // 聯絡電話
  contactEmail?: string; // 聯絡信箱

  // 付款資訊
  paymentMethod?: PaymentMethod; // 付款方式
  paymentStatus?: PaymentStatus; // 付款狀態
  paidAt?: string; // 付款時間

  // 其他資訊
  couponCode?: string; // 優惠券代碼
  couponDiscount?: number; // 優惠券折扣
  notes?: string; // 備註
  specialInstructions?: string; // 特殊指示

  // 時間戳
  confirmedAt?: string; // 確認時間
  completedAt?: string; // 完成時間
  cancelledAt?: string; // 取消時間
  updatedAt?: string; // 更新時間

  // 關聯資料
  items?: OrderItem[]; // 訂單項目
  user?: User; // 客戶資訊
}
```

---

### OrderStatus 枚舉 - 9 種訂單狀態

```typescript
enum OrderStatus {
  PENDING = "pending", // 📝 待處理 - 訂單已建立，等待確認
  CONFIRMED = "confirmed", // ✅ 已確認 - 訂單已確認，等待付款
  PAID = "paid", // 💳 已付款 - 付款完成，準備處理
  PROCESSING = "processing", // ⚙️ 處理中 - 正在準備商品
  SHIPPED = "shipped", // 🚚 已出貨 - 商品已發送
  DELIVERED = "delivered", // 📦 已送達 - 商品已送達客戶
  COMPLETED = "completed", // ✨ 已完成 - 交易完成
  CANCELLED = "cancelled", // ❌ 已取消 - 訂單已取消
  REFUNDED = "refunded", // 💰 已退款 - 退款已完成
}
```

**狀態流轉圖**:

```
pending → confirmed → paid → processing → shipped → delivered → completed
   ↓         ↓         ↓         ↓
cancelled ────────────────────────→ refunded
```

---

### OrderItem 類型

```typescript
interface OrderItem {
  id: string; // 項目 UUID
  orderId: string; // 訂單 ID
  productId: string; // 商品 ID
  productName?: string; // 商品名稱
  productDescription?: string; // 商品描述
  productImageUrl?: string; // 商品圖片
  productSku?: string; // 商品 SKU
  quantity: number; // 數量
  unitPrice: number; // 單價
  totalPrice: number; // 小計 (quantity × unitPrice)
  status?: OrderItemStatus; // 項目狀態
  discountAmount?: number; // 折扣金額
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 使用範例

### 完整訂單建立流程

```typescript
import { defaultServiceFactory } from "@/api/services";
import { OrderStatus } from "@/types";

const orderService = defaultServiceFactory.getOrderService();

// 1. 準備訂單資料
const orderData = {
  userId: "customer-uuid",
  totalAmount: 5500,
  subtotal: 5000,
  shippingFee: 500,
  shippingMethod: "宅配",
  shippingAddress: "台北市信義區信義路五段7號",
  contactName: "張小明",
  contactPhone: "0912345678",
  contactEmail: "customer@example.com",
  paymentMethod: "credit_card",
  notes: "請於下午送達",
};

const items = [
  { productId: "prod-1", quantity: 2, unitPrice: 2000, totalPrice: 4000 },
  { productId: "prod-2", quantity: 1, unitPrice: 1000, totalPrice: 1000 },
];

// 2. 建立訂單
const createResult = await orderService.createOrderWithItems(orderData, items);

if (createResult.success) {
  const orderId = createResult.data.id;
  const orderNumber = createResult.data.orderNumber;

  console.log("訂單建立成功:", orderNumber);

  // 3. 確認訂單
  await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

  // 4. 標記付款完成（模擬付款成功）
  await orderService.updateOrderStatus(orderId, OrderStatus.PAID);

  // 5. 開始處理訂單
  await orderService.updateOrderStatus(orderId, OrderStatus.PROCESSING);

  // 6. 出貨（提供追蹤號碼）
  await orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED, {
    trackingNumber: "TRACK-123456",
  });

  // 7. 查詢訂單詳情
  const orderDetail = await orderService.getOrderWithItems(orderId);
  console.log("訂單詳情:", orderDetail.data);
}
```

---

### Vue 組件使用範例

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { defaultServiceFactory } from "@/api/services";
import { OrderStatus } from "@/types";
import type { Order } from "@/types";

const orderService = defaultServiceFactory.getOrderService();
const orders = ref<Order[]>([]);
const loading = ref(false);
const selectedStatus = ref<OrderStatus[]>([]);

// 載入訂單列表
async function loadOrders() {
  loading.value = true;
  try {
    const result = await orderService.fetchOrdersWithPagination({
      page: 1,
      perPage: 20,
      status: selectedStatus.value,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (result.success) {
      orders.value = result.data;
    }
  } finally {
    loading.value = false;
  }
}

// 更新訂單狀態
async function updateStatus(orderId: string, newStatus: OrderStatus) {
  const result = await orderService.updateOrderStatus(orderId, newStatus);

  if (result.success) {
    // 重新載入列表
    await loadOrders();
  } else {
    alert("狀態更新失敗: " + result.error);
  }
}

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <div>
    <!-- 狀態篩選 -->
    <div class="filters">
      <label>
        <input type="checkbox" value="pending" v-model="selectedStatus" />
        待處理
      </label>
      <label>
        <input type="checkbox" value="confirmed" v-model="selectedStatus" />
        已確認
      </label>
      <button @click="loadOrders">篩選</button>
    </div>

    <!-- 訂單列表 -->
    <div v-if="loading">載入中...</div>
    <table v-else>
      <thead>
        <tr>
          <th>訂單號</th>
          <th>客戶</th>
          <th>金額</th>
          <th>狀態</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>{{ order.orderNumber }}</td>
          <td>{{ order.user?.fullName }}</td>
          <td>{{ order.totalAmount.toLocaleString("zh-TW") }}</td>
          <td>{{ order.status }}</td>
          <td>
            <button
              v-if="order.status === 'pending'"
              @click="updateStatus(order.id, 'confirmed')"
            >
              確認訂單
            </button>
            <button
              v-if="order.status === 'confirmed'"
              @click="updateStatus(order.id, 'paid')"
            >
              標記付款
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

---

## 注意事項與最佳實踐

### 訂單狀態流轉

```typescript
// ✅ 正確 - 遵守狀態流轉規則
await orderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);
await orderService.updateOrderStatus(orderId, OrderStatus.PAID);
await orderService.updateOrderStatus(orderId, OrderStatus.PROCESSING);

// ❌ 錯誤 - 跳過狀態會失敗
await orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED);
// 錯誤: 無法從 pending 直接到 shipped

// ✅ 正確 - 任何狀態都可取消（除了 completed 和 refunded）
await orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED);
```

---

### 訂單金額計算

```typescript
// ✅ 正確 - 金額計算邏輯
const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
const shippingFee = 100;
const taxAmount = 0;
const discountAmount = 50;

const totalAmount = subtotal + shippingFee + taxAmount - discountAmount;

const orderData = {
  userId: "customer-uuid",
  subtotal,
  shippingFee,
  taxAmount,
  discountAmount,
  totalAmount,
};
```

---

### 錯誤處理最佳實踐

```typescript
// ✅ 完整錯誤處理
try {
  const result = await orderService.createOrderWithItems(orderData, items);

  if (result.success) {
    // 成功處理
    router.push(`/orders/${result.data.id}`);
  } else {
    // API 錯誤
    showError(result.error || "訂單建立失敗");
  }
} catch (error) {
  // 網路錯誤或其他異常
  showError("系統錯誤，請稍後再試");
  console.error(error);
}
```

---

## 相關資源

### 相關 API 服務

- [CustomerApiService](./customer-api.md) - 客戶服務
- [ProductApiService](./product-api.md) - 產品服務
- [DashboardApiService](./dashboard-api.md) - 儀表板統計

### 相關組件

- `OrdersView.vue` - 訂單列表頁面
- `OrderDetailView.vue` - 訂單詳情頁面
- `OrderForm.vue` - 訂單建立表單

### 相關文件

- [資料庫 Schema](../database/schema.sql) - orders, order_items 表結構
- [訂單狀態流轉規則](../../01-planning/prd/order-status-flow.md)
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md)

---

## 變更歷史

| 日期       | 版本  | 變更內容                 | 作者     |
| ---------- | ----- | ------------------------ | -------- |
| 2025-10-07 | 1.0.0 | 初始版本 - 完整 API 文件 | 開發團隊 |

---

**維護提醒**: 當訂單狀態流轉規則或資料庫觸發器邏輯變更時，請同步更新此文件。
