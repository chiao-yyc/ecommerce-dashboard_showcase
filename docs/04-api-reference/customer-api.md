# CustomerApiService API 文件

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐⭐ (核心業務)

---

## 概覽

### 業務用途

CustomerApiService 是客戶關係管理 (CRM) 系統的核心 API 服務，負責管理客戶的完整生命週期資料，包含基本資訊、RFM 分析、訂單行為分析、生命週期指標和 LTV (客戶終身價值) 計算。

### 核心功能

- **客戶 CRUD 操作** - 完整的客戶資料增刪改查
- **分頁查詢與搜尋** - 支援多條件過濾、關鍵字搜尋、排序
- **RFM 客戶分析** - 11 種客戶分群策略 (Champions、At Risk、Lost 等)
- **客戶概覽統計** - 總客戶數、回頭客、一次性客戶等指標
- **生命週期指標** - 客戶成長趨勢、流失率、活躍度分析
- **LTV 計算** - 客戶終身價值預測與分析
- **AOV 分析** - 平均訂單價值 (Average Order Value) 計算

### 技術架構

- **繼承**: `BaseApiService<Customer, DbCustomerDetail>`
- **資料表**:
  - `customers` (主要表) - 客戶基本資訊
  - `customer_details` (視圖) - 客戶詳細資訊含業務分析欄位
  - `customer_rfm_lifecycle_metrics` (視圖) - RFM 生命週期指標
  - `customer_ltv_metrics` (視圖) - LTV 終身價值指標
  - `customer_order_basic_behavior` (視圖) - 訂單行為分析 (AOV)
- **資料庫函數**:
  - `get_customer_analysis()` - 客戶綜合分析
  - `get_customer_rfm_overview()` - RFM 概覽統計
- **依賴服務**: 無直接依賴，被訂單、分析等服務引用
- **前端使用**:
  - `CustomersView.vue` - 客戶列表頁面
  - `CustomerDetailView.vue` - 客戶詳情頁面
  - `CustomerAnalyticsView.vue` - 客戶分析頁面
  - `OrderForm.vue` - 訂單表單的客戶選擇

### 資料庫層 API 參考

> **Supabase 自動生成文件**
>
> 如需查詢 `customers` 資料表的基礎 Schema 和 PostgREST API：
>
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `customers` / `customer_details`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
>
> - ✅ 查詢資料表欄位結構和類型
> - ✅ 了解 RLS (Row Level Security) 政策
> - ✅ 快速測試基礎 CRUD 操作
>
> **何時使用本文件**：
>
> - ✅ 使用 `CustomerApiService` 的業務邏輯方法
> - ✅ 了解 RFM 分析、LTV 計算等進階功能
> - ✅ 查看資料映射規則 (`mapDbToEntity`)
> - ✅ 學習錯誤處理和最佳實踐

---

## API 方法詳細說明

### 基礎 CRUD 方法 (繼承自 BaseApiService)

#### `getAll()` - 列表查詢

**用途**: 取得客戶列表，支援分頁、搜尋、過濾（基礎方法，建議使用 `fetchCustomersWithPagination` 獲得更完整功能）

**方法簽名**:

```typescript
async getAll(options?: PaginationOptions): Promise<ApiPaginationResponse<Customer>>
```

**參數**:

```typescript
interface PaginationOptions {
  page?: number; // 頁碼 (預設: 1)
  limit?: number; // 每頁筆數 (預設: 10)
  search?: string; // 搜尋關鍵字 (查詢 email 和 fullName)
  sortBy?: string; // 排序欄位 (camelCase)
  sortOrder?: "asc" | "desc";
}
```

**回傳值**:

```typescript
interface ApiPaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}
```

---

#### `getById()` - 單筆查詢 (建議使用 `findById`)

**用途**: 根據 UUID 取得客戶詳細資料（基礎方法，建議使用 `findById` 獲得 AOV 資料）

**方法簽名**:

```typescript
async getById(id: string): Promise<ApiResponse<Customer>>
```

---

#### `create()` - 新增客戶

**用途**: 創建新的客戶記錄

**方法簽名**:

```typescript
async create(customer: Partial<Customer>): Promise<ApiResponse<Customer>>
```

**參數**:

```typescript
{
  email: string              // 必填 - 客戶電子郵件
  fullName: string          // 必填 - 客戶姓名
  phone?: string            // 選填 - 聯絡電話
  customerNumber?: string   // 選填 - 客戶編號 (系統自動生成)
  status?: string           // 選填 - 狀態 (預設: 'active')
}
```

**使用範例**:

```typescript
const newCustomer = {
  email: "customer@example.com",
  fullName: "張小明",
  phone: "0912345678",
};

const result = await customerService.create(newCustomer);

if (result.success) {
  console.log("新客戶 ID:", result.data.id);
  console.log("客戶編號:", result.data.customerNumber);
}
```

**驗證規則**:

- `email` 必填，需符合 email 格式
- `fullName` 必填，最小長度 2 字元
- `phone` 選填，建議台灣手機格式 (09xxxxxxxx)

---

#### `update()` - 更新客戶

**用途**: 更新現有客戶資料

**方法簽名**:

```typescript
async update(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>>
```

**參數**:

- `id`: 客戶 UUID
- `customer`: 要更新的欄位 (只需提供變更的欄位)

**使用範例**:

```typescript
const result = await customerService.update("customer-uuid", {
  fullName: "張大明",
  status: "inactive",
});
```

**注意事項**:

- ⚠️ 只會更新提供的欄位，其他欄位保持不變
- ⚠️ `id`, `createdAt`, `customerNumber` 等系統欄位不可更新
- ⚠️ 更新會自動設置 `updatedAt` 為當前時間

---

#### `delete()` - 刪除客戶

**用途**: 軟刪除客戶記錄 (設置 `deletedAt` 時間戳)

**方法簽名**:

```typescript
async delete(id: string): Promise<ApiResponse<void>>
```

**刪除策略**:

- **軟刪除**: 不會實際刪除資料，而是設置 `deletedAt` 時間戳
- 軟刪除的客戶不會出現在一般查詢結果中
- 相關訂單資料保持完整，不受影響

**使用範例**:

```typescript
const result = await customerService.delete("customer-uuid");

if (result.success) {
  console.log("客戶已軟刪除");
}
```

**注意事項**:

- ⚠️ 軟刪除可以透過資料庫手動恢復 (設置 `deletedAt` 為 NULL)
- ⚠️ 關聯訂單資料不會被刪除 (CASCADE 保護)

---

### 客戶特定方法

#### `fetchCustomersWithPagination()` - 進階分頁查詢 ⭐ 推薦

**用途**: 取得客戶列表，支援狀態篩選、關鍵字搜尋、多欄位排序（功能最完整的查詢方法）

**方法簽名**:

```typescript
async fetchCustomersWithPagination(
  options: CustomersPaginationOptions
): Promise<ApiPaginationResponse>
```

**參數**:

```typescript
interface CustomersPaginationOptions {
  page?: number; // 頁碼 (預設: 1)
  perPage?: number; // 每頁筆數 (預設: 10)
  searchTerm?: string; // 搜尋關鍵字 (查詢 email 和 full_name)
  status?: string[]; // 狀態篩選 (例如: ['active', 'inactive'])
  sortBy?: string; // 排序欄位 (camelCase 格式)
  sortOrder?: "asc" | "desc"; // 排序方向 (預設: 'desc')
}
```

**回傳值**:

```typescript
interface ApiPaginationResponse {
  success: boolean;
  data: Customer[];
  page: number;
  perPage: number;
  count: number; // 總筆數
  totalPages: number; // 總頁數
  error?: string;
}
```

**使用範例**:

```typescript
import { defaultServiceFactory } from "@/api/services";

const customerService = defaultServiceFactory.getCustomerService();

// 基本查詢
const result = await customerService.fetchCustomersWithPagination({
  page: 1,
  perPage: 20,
});

// 搜尋查詢
const searchResult = await customerService.fetchCustomersWithPagination({
  searchTerm: "張", // 搜尋姓名或 email 包含 "張" 的客戶
  page: 1,
  perPage: 10,
});

// 狀態篩選
const activeCustomers = await customerService.fetchCustomersWithPagination({
  status: ["active"],
  sortBy: "totalSpent",
  sortOrder: "desc", // 按消費金額降序排列
});

// 組合查詢
const complexQuery = await customerService.fetchCustomersWithPagination({
  searchTerm: "gmail",
  status: ["active", "inactive"],
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 2,
  perPage: 50,
});
```

**搜尋邏輯**:

- 搜尋條件對 `email` 和 `full_name` 欄位執行 **不區分大小寫** 的模糊查詢 (ILIKE)
- 範例: `searchTerm: '張'` 會匹配 "張小明"、"zhang@example.com" 等

**排序欄位支援**:

- `createdAt` - 註冊日期
- `updatedAt` - 最後更新時間
- `fullName` - 客戶姓名
- `customerNumber` - 客戶編號
- `totalSpent` - 累計消費金額 (需要 RFM 資料)
- `orderCount` - 訂單數量

**注意事項**:

- ⚠️ `sortBy` 欄位使用 **camelCase** 格式，服務會自動轉換為資料庫的 snake_case
- ⚠️ 預設每頁 10 筆，最大建議 100 筆 (避免效能問題)
- ⚠️ 查詢使用 `customer_details` 視圖，包含完整的業務分析欄位

---

#### `fetchCustomersByKeyword()` - 關鍵字快速查詢

**用途**: 根據關鍵字快速查詢客戶 (用於下拉選單、自動完成等場景)

**方法簽名**:

```typescript
async fetchCustomersByKeyword(keyword: string): Promise<Customer[]>
```

**參數**:

- `keyword`: 搜尋關鍵字 (查詢 email 和 full_name)
  - 如果為空字串，返回最近註冊的 10 位客戶
  - 如果提供關鍵字，返回最多 50 筆匹配結果

**回傳值**: 客戶陣列 (不包含分頁資訊)

**使用範例**:

```typescript
// 空關鍵字 - 返回最近註冊的客戶
const recentCustomers = await customerService.fetchCustomersByKeyword("");
// 返回: 最近 10 位客戶

// 關鍵字查詢
const customers = await customerService.fetchCustomersByKeyword("張");
// 返回: 姓名或 email 包含 "張" 的客戶 (最多 50 筆)

// 用於 Vue Select 組件
const searchCustomers = async (keyword: string) => {
  return await customerService.fetchCustomersByKeyword(keyword);
};
```

**適用場景**:

- 訂單表單的客戶選擇下拉選單
- 客戶搜尋自動完成 (autocomplete)
- 快速客戶查找功能

**效能最佳化**:

- 限制返回 50 筆結果避免過載
- 按 `created_at` 降序排列，優先顯示最新客戶
- 查詢失敗時返回空陣列 (不中斷 UI)

---

#### `findById()` - ID 查詢 (含 AOV) ⭐ 推薦

**用途**: 根據 UUID 取得客戶詳細資料，**包含 AOV (平均訂單價值) 分析**

**方法簽名**:

```typescript
async findById(id: string): Promise<ApiResponse<Customer>>
```

**參數**:

- `id`: 客戶 UUID

**回傳值**:

```typescript
{
  success: true,
  data: {
    id: 'uuid',
    customerNumber: 'CUST-001',
    email: 'customer@example.com',
    fullName: '張小明',
    // ... 其他基本欄位

    // RFM 業務分析欄位
    rfmSegment: 'Champions',
    lastOrderDate: '2025-10-01T12:00:00Z',
    totalSpent: 50000,
    orderCount: 15,

    // AOV 分析欄位 (特別從 customer_order_basic_behavior 查詢)
    averageOrderValue: 3333.33
  }
}
```

**資料來源**:

1. **customer_details** 視圖 - 客戶基本資訊 + RFM 指標
2. **customer_order_basic_behavior** 視圖 - AOV (平均訂單價值)

**業務邏輯**:

- 合併兩個資料來源提供完整的客戶畫像
- 即使 AOV 資料查詢失敗，仍返回基本客戶資訊 (容錯設計)
- AOV 為 null 時表示客戶尚無訂單記錄

**使用範例**:

```typescript
const result = await customerService.findById("customer-uuid");

if (result.success && result.data) {
  const customer = result.data;

  console.log("客戶:", customer.fullName);
  console.log("RFM 分群:", customer.rfmSegment);
  console.log("累計消費:", customer.totalSpent);
  console.log("平均訂單價值:", customer.averageOrderValue || "無訂單記錄");
}
```

**vs getById() 差異**:
| 方法 | 資料來源 | AOV 欄位 | 推薦場景 |
|------|----------|----------|----------|
| `getById()` | customer_details | ❌ 無 | 基本資訊查詢 |
| `findById()` | customer_details + customer_order_basic_behavior | ✅ 有 | 客戶詳情頁面、分析頁面 |

---

#### `findByCustomerNumber()` - 客戶編號查詢 (含 AOV)

**用途**: 根據客戶編號查詢客戶資料，包含 AOV 分析

**方法簽名**:

```typescript
async findByCustomerNumber(customerNumber: string): Promise<ApiResponse<Customer | null>>
```

**參數**:

- `customerNumber`: 客戶編號 (例如: `CUST-001`)

**回傳值**:

- 找到客戶: `{ success: true, data: Customer }`
- 找不到客戶: `{ success: true, data: null }` (不報錯)
- 查詢錯誤: `{ success: false, error: '錯誤訊息' }`

**使用範例**:

```typescript
const result = await customerService.findByCustomerNumber("CUST-001");

if (result.success) {
  if (result.data) {
    console.log("找到客戶:", result.data.fullName);
  } else {
    console.log("查無此客戶編號");
  }
}
```

**適用場景**:

- 客服系統根據客戶編號查詢
- 匯入訂單時驗證客戶編號
- 客戶編號搜尋功能

**錯誤處理**:

- 客戶不存在時返回 `data: null` 而非報錯 (友好設計)
- Postgres 錯誤碼 `PGRST116` (No rows found) 視為正常情況

---

### 統計分析方法

#### `getCustomerOverview()` - 客戶概覽統計

**用途**: 取得客戶總覽統計資料 (總客戶數、回頭客、一次性客戶等)

**方法簽名**:

```typescript
async getCustomerOverview(): Promise<ApiResponse<CustomerOverview>>
```

**回傳值**:

```typescript
interface CustomerOverview {
  totalCustomers: number; // 總客戶數
  customersWithEmail: number; // 有電子郵件的客戶數
  customersWithName: number; // 有姓名的客戶數
  customersWithOrders: number; // 有訂單的客戶數
  oneTimeCustomers: number; // 一次性客戶數 (只下過一次訂單)
  returningCustomers: number; // 回頭客數 (下過 2 次以上訂單)
}
```

**使用範例**:

```typescript
const result = await customerService.getCustomerOverview();

if (result.success) {
  const stats = result.data;

  console.log("總客戶數:", stats.totalCustomers);
  console.log(
    "回頭客比例:",
    ((stats.returningCustomers / stats.totalCustomers) * 100).toFixed(1) + "%"
  );
  console.log(
    "一次性客戶比例:",
    ((stats.oneTimeCustomers / stats.totalCustomers) * 100).toFixed(1) + "%"
  );
}
```

**業務指標意義**:

- **totalCustomers**: 平台累計註冊客戶總數
- **customersWithOrders**: 實際產生消費的客戶數 (轉換率指標)
- **returningCustomers**: 忠誠度指標，回頭客數量
- **oneTimeCustomers**: 流失風險客戶，只消費一次後未回購

**資料來源**: PostgreSQL 函數 `get_customer_analysis()`

**適用頁面**: DashboardOverview、CustomerAnalyticsView

---

#### `getCustomerRfmOverview()` - RFM 分析概覽

**用途**: 取得 RFM (Recency, Frequency, Monetary) 客戶分析概覽

**方法簽名**:

```typescript
async getCustomerRfmOverview(): Promise<ApiResponse<CustomerRfmOverview>>
```

**回傳值**:

```typescript
interface CustomerRfmOverview {
  activeUsersCount: number; // 活躍客戶數
  averageMonetary: number; // 平均消費金額
  atRiskCustomersCount: number; // 風險客戶數
}
```

**使用範例**:

```typescript
const result = await customerService.getCustomerRfmOverview();

if (result.success) {
  const rfm = result.data;

  console.log("活躍客戶:", rfm.activeUsersCount);
  console.log("平均消費:", rfm.averageMonetary.toLocaleString("zh-TW"));
  console.log("風險客戶:", rfm.atRiskCustomersCount);

  // 計算風險客戶比例
  const riskRatio = (rfm.atRiskCustomersCount / rfm.activeUsersCount) * 100;
  console.log("風險客戶比例:", riskRatio.toFixed(1) + "%");
}
```

**業務指標定義**:

- **activeUsersCount**: RFM 分群為 Champions、Loyal Customers、Potential Loyalists 的客戶數
- **averageMonetary**: 所有客戶的平均累計消費金額
- **atRiskCustomersCount**: RFM 分群為 At Risk、Cannot Lose Them 的客戶數

**資料來源**: PostgreSQL 函數 `get_customer_rfm_overview()`

**適用場景**:

- 客戶健康度儀表板
- RFM 分析報告頁面
- 客戶流失預警系統

---

#### `getCustomerAnalysis()` - 客戶詳細分析

**用途**: 取得客戶完整分析資料 (包含 RFM、生命週期、行為模式等)

**方法簽名**:

```typescript
async getCustomerAnalysis(): Promise<ApiResponse<any>>
```

**回傳值**: 包含客戶綜合分析的複雜結構 (由資料庫函數返回)

**資料來源**: PostgreSQL 函數 `get_customer_analysis()`

**使用範例**:

```typescript
const result = await customerService.getCustomerAnalysis();

if (result.success) {
  console.log("客戶分析資料:", result.data);
}
```

**適用場景**: 客戶分析儀表板、高階報表

---

#### `getCustomerLifecycleMetrics()` - 生命週期指標

**用途**: 取得客戶生命週期各階段的指標資料

**方法簽名**:

```typescript
async getCustomerLifecycleMetrics(): Promise<ApiResponse<any>>
```

**回傳值**: 生命週期指標陣列

**資料來源**: `customer_rfm_lifecycle_metrics` 視圖

**業務邏輯**:

- 追蹤客戶從註冊到流失的完整生命週期
- 包含各 RFM 分群的客戶數量、成長趨勢
- 用於客戶流失率分析、成長預測

**使用範例**:

```typescript
const result = await customerService.getCustomerLifecycleMetrics();

if (result.success) {
  console.log("生命週期指標:", result.data);
}
```

---

#### `getCustomerLtvMetrics()` - LTV 終身價值指標

**用途**: 取得客戶終身價值 (Lifetime Value) 預測與分析

**方法簽名**:

```typescript
async getCustomerLtvMetrics(): Promise<ApiResponse<any>>
```

**回傳值**: LTV 指標陣列

**資料來源**: `customer_ltv_metrics` 視圖

**業務邏輯**:

- 預測客戶未來價值
- 基於歷史消費行為計算 LTV
- 用於行銷投資決策、客戶分級

**使用範例**:

```typescript
const result = await customerService.getCustomerLtvMetrics();

if (result.success) {
  console.log("LTV 指標:", result.data);
}
```

---

## 資料結構

### Customer 類型 (前端)

```typescript
interface Customer {
  // 基本資訊
  id: string; // UUID
  customerNumber?: string; // 客戶編號 (例如: CUST-001)
  email: string; // 電子郵件
  fullName: string; // 姓名
  phone?: string; // 聯絡電話
  avatarUrl?: string; // 頭像 URL

  // 系統欄位
  createdAt?: string; // 註冊時間 (ISO 8601)
  updatedAt?: string; // 最後更新時間
  deletedAt?: string; // 軟刪除時間 (選填)

  // 認證相關
  authUserId?: string; // 關聯的 auth.users ID
  providers?: string[]; // 登入供應商 (例如: ['email', 'google'])
  status?: string; // 狀態: 'active' | 'inactive' | 'banned'

  // RFM 業務分析欄位
  rfmSegment?: RfmSegmentType; // RFM 客戶分群
  lastOrderDate?: string; // 最後訂單日期
  totalSpent?: number; // 累計消費金額
  orderCount?: number; // 總訂單數

  // AOV 訂單行為分析
  averageOrderValue?: number; // 平均訂單價值
}
```

**欄位說明**:

- `id`: 客戶唯一識別碼 (UUID)
- `customerNumber`: 客戶編號，系統自動生成 (格式: CUST-XXX)
- `rfmSegment`: RFM 客戶分群 (11 種類型，見下方說明)
- `totalSpent`: 累計消費金額 (台幣)
- `averageOrderValue`: 平均訂單價值 (總消費 / 訂單數)

---

### RfmSegment 枚舉 - 11 種客戶分群

```typescript
enum RfmSegment {
  CHAMPIONS = "Champions", // 💎 冠軍客戶 - 最近消費、高頻、高額
  LOYAL_CUSTOMERS = "Loyal Customers", // 🏆 忠誠客戶 - 定期消費、高頻
  POTENTIAL_LOYALISTS = "Potential Loyalists", // ⭐ 潛在忠誠客戶 - 最近消費、中頻
  NEW_CUSTOMERS = "New Customers", // 🆕 新客戶 - 最近註冊、低頻
  PROMISING = "Promising", // 🌟 有潛力客戶 - 最近消費、中額
  NEED_ATTENTION = "Need Attention", // ⚠️ 需要關注 - 中期未消費、曾高頻
  ABOUT_TO_SLEEP = "About to Sleep", // 😴 即將休眠 - 較久未消費、曾中頻
  AT_RISK = "At Risk", // 🚨 流失風險 - 很久未消費、曾高頻高額
  CANNOT_LOSE_THEM = "Cannot Lose Them", // 🆘 不能失去 - 很久未消費、曾是冠軍
  HIBERNATING = "Hibernating", // 💤 休眠客戶 - 很久未消費、低額
  LOST = "Lost", // ❌ 已流失 - 超久未消費
}
```

**RFM 分群業務意義**:

- **Champions**: 最有價值的客戶，應提供 VIP 服務和專屬優惠
- **At Risk**: 流失風險高，需要挽回策略 (例如: 折扣券、關懷訊息)
- **New Customers**: 新客戶培育期，提供新手優惠促進首購
- **Lost**: 已流失客戶，可考慮重新獲客活動

---

### DbCustomerDetail 類型 (資料庫)

```typescript
interface DbCustomerDetail {
  // 基本資訊 (snake_case)
  id: string;
  customer_number?: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
  auth_user_id?: string;
  providers?: string[];
  status?: string;

  // RFM 業務分析欄位 (來自 customer_rfm_lifecycle_metrics 視圖)
  rfm_segment?: string; // 對應 Customer.rfmSegment
  last_purchase_date?: string; // 對應 Customer.lastOrderDate
  total_spent?: number; // 對應 Customer.totalSpent
  order_count?: number; // 對應 Customer.orderCount

  // AOV 欄位 (來自 customer_order_basic_behavior 視圖)
  avg_order_value?: number; // 對應 Customer.averageOrderValue
}
```

**命名規則**:

- 前端使用 **camelCase**: `fullName`, `totalSpent`, `averageOrderValue`
- 資料庫使用 **snake_case**: `full_name`, `total_spent`, `avg_order_value`

---

### 資料映射邏輯

```typescript
// DbCustomerDetail → Customer (mapDbToEntity)
protected mapDbToEntity(dbCustomer: DbCustomerDetail): Customer {
  return {
    // 基本欄位映射
    id: dbCustomer.id,
    customerNumber: dbCustomer.customer_number,
    email: dbCustomer.email || '',
    fullName: dbCustomer.full_name || '',
    phone: dbCustomer.phone,
    avatarUrl: dbCustomer.avatar_url,
    createdAt: dbCustomer.created_at || '',
    updatedAt: dbCustomer.updated_at || '',
    deletedAt: dbCustomer.deleted_at || '',
    authUserId: dbCustomer.auth_user_id,
    providers: dbCustomer.providers || [],
    status: dbCustomer.status,

    // RFM 業務分析欄位映射
    rfmSegment: dbCustomer.rfm_segment as RfmSegment,
    lastOrderDate: dbCustomer.last_purchase_date,
    totalSpent: dbCustomer.total_spent,
    orderCount: dbCustomer.order_count,

    // AOV 欄位映射
    averageOrderValue: dbCustomer.avg_order_value,
  }
}
```

```typescript
// Customer → DbCustomer (mapEntityToDb)
protected mapEntityToDb(customer: Partial<Customer>): Partial<DbCustomer> {
  return {
    id: customer.id,
    customer_number: customer.customerNumber,
    email: customer.email,
    full_name: customer.fullName,
    phone: customer.phone,
    avatar_url: customer.avatarUrl,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
    deleted_at: customer.deletedAt,
    auth_user_id: customer.authUserId,
    // 注意: RFM 和 AOV 欄位為唯讀，不可直接更新
  }
}
```

**特殊處理**:

- 選填欄位: 資料庫 `null` ↔ 前端 `undefined`
- 空字串保護: `email || ''`, `fullName || ''` 避免 null 值
- 陣列預設值: `providers || []` 確保不會是 null
- **RFM 和 AOV 欄位為唯讀**: 由資料庫視圖計算，不可透過 API 直接更新

---

## 使用範例

### 完整業務流程範例

```typescript
import { defaultServiceFactory } from "@/api/services";

// 1. 取得服務實例
const customerService = defaultServiceFactory.getCustomerService();

// 2. 查詢客戶列表 (分頁 + 篩選)
const listResult = await customerService.fetchCustomersWithPagination({
  page: 1,
  perPage: 20,
  status: ["active"],
  sortBy: "totalSpent",
  sortOrder: "desc",
});

console.log("總客戶數:", listResult.count);
console.log("VIP 客戶 (前20名):", listResult.data);

// 3. 新增客戶
const createResult = await customerService.create({
  email: "newcustomer@example.com",
  fullName: "李小華",
  phone: "0923456789",
});

if (createResult.success) {
  const newCustomerId = createResult.data.id;
  const customerNumber = createResult.data.customerNumber;

  console.log("新客戶 ID:", newCustomerId);
  console.log("客戶編號:", customerNumber); // 例如: CUST-001

  // 4. 查詢客戶詳情 (含 AOV)
  const detailResult = await customerService.findById(newCustomerId);

  if (detailResult.success && detailResult.data) {
    const customer = detailResult.data;

    console.log("客戶 RFM 分群:", customer.rfmSegment);
    console.log("累計消費:", customer.totalSpent || 0);
    console.log("平均訂單價值:", customer.averageOrderValue || "尚無訂單");
  }

  // 5. 更新客戶資訊
  await customerService.update(newCustomerId, {
    fullName: "李大華",
    status: "active",
  });

  // 6. 軟刪除客戶 (測試用)
  // await customerService.delete(newCustomerId)
}

// 7. 取得客戶概覽統計
const overviewResult = await customerService.getCustomerOverview();
if (overviewResult.success) {
  const stats = overviewResult.data;
  console.log("總客戶數:", stats.totalCustomers);
  console.log(
    "回頭客比例:",
    ((stats.returningCustomers / stats.totalCustomers) * 100).toFixed(1) + "%"
  );
}

// 8. 取得 RFM 分析概覽
const rfmResult = await customerService.getCustomerRfmOverview();
if (rfmResult.success) {
  console.log("活躍客戶:", rfmResult.data.activeUsersCount);
  console.log("風險客戶:", rfmResult.data.atRiskCustomersCount);
}
```

---

### 在 Vue 組件中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { defaultServiceFactory } from "@/api/services";
import type { Customer, CustomersPaginationOptions } from "@/types";

const customerService = defaultServiceFactory.getCustomerService();
const customers = ref<Customer[]>([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
});

// 查詢選項
const queryOptions = ref<CustomersPaginationOptions>({
  page: 1,
  perPage: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
});

// 載入客戶列表
async function loadCustomers() {
  loading.value = true;
  try {
    const result = await customerService.fetchCustomersWithPagination(
      queryOptions.value
    );

    if (result.success) {
      customers.value = result.data;
      pagination.value = {
        page: result.page,
        perPage: result.perPage,
        total: result.count,
        totalPages: result.totalPages,
      };
    }
  } catch (error) {
    console.error("載入客戶失敗:", error);
  } finally {
    loading.value = false;
  }
}

// 搜尋客戶
async function searchCustomers(keyword: string) {
  queryOptions.value.searchTerm = keyword;
  queryOptions.value.page = 1; // 重置到第一頁
  await loadCustomers();
}

// 篩選狀態
async function filterByStatus(status: string[]) {
  queryOptions.value.status = status;
  queryOptions.value.page = 1;
  await loadCustomers();
}

// 換頁
async function changePage(page: number) {
  queryOptions.value.page = page;
  await loadCustomers();
}

onMounted(() => {
  loadCustomers();
});
</script>

<template>
  <div>
    <!-- 搜尋欄 -->
    <input
      type="text"
      placeholder="搜尋客戶..."
      @input="searchCustomers($event.target.value)"
    />

    <!-- 狀態篩選 -->
    <select @change="filterByStatus([$event.target.value])">
      <option value="">全部狀態</option>
      <option value="active">活躍</option>
      <option value="inactive">停用</option>
    </select>

    <!-- 客戶列表 -->
    <div v-if="loading">載入中...</div>
    <div v-else>
      <div v-for="customer in customers" :key="customer.id">
        <h3>{{ customer.fullName }}</h3>
        <p>{{ customer.email }}</p>
        <p>RFM: {{ customer.rfmSegment }}</p>
        <p>累計消費: {{ customer.totalSpent?.toLocaleString("zh-TW") || 0 }}</p>
      </div>

      <!-- 分頁控制 -->
      <div>
        <button
          @click="changePage(pagination.page - 1)"
          :disabled="pagination.page === 1"
        >
          上一頁
        </button>
        <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 頁</span>
        <button
          @click="changePage(pagination.page + 1)"
          :disabled="pagination.page === pagination.totalPages"
        >
          下一頁
        </button>
      </div>
    </div>
  </div>
</template>
```

---

### 在 Composable 中使用

```typescript
// composables/useCustomerManagement.ts
import { ref } from "vue";
import { defaultServiceFactory } from "@/api/services";
import type { Customer, CustomersPaginationOptions } from "@/types";

export function useCustomerManagement() {
  const customerService = defaultServiceFactory.getCustomerService();
  const customers = ref<Customer[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 載入客戶列表
  async function fetchCustomers(options: CustomersPaginationOptions) {
    loading.value = true;
    error.value = null;

    try {
      const result = await customerService.fetchCustomersWithPagination(
        options
      );

      if (result.success) {
        customers.value = result.data;
        return result;
      } else {
        error.value = result.error || "載入失敗";
        return null;
      }
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 取得客戶詳情
  async function getCustomerById(id: string) {
    const result = await customerService.findById(id);
    return result.success ? result.data : null;
  }

  // 快速搜尋客戶 (用於下拉選單)
  async function searchCustomers(keyword: string) {
    return await customerService.fetchCustomersByKeyword(keyword);
  }

  // 新增客戶
  async function createCustomer(customerData: Partial<Customer>) {
    loading.value = true;
    error.value = null;

    try {
      const result = await customerService.create(customerData);

      if (result.success) {
        return result.data;
      } else {
        error.value = result.error || "新增失敗";
        return null;
      }
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 更新客戶
  async function updateCustomer(id: string, customerData: Partial<Customer>) {
    const result = await customerService.update(id, customerData);
    return result.success ? result.data : null;
  }

  // 刪除客戶
  async function deleteCustomer(id: string) {
    const result = await customerService.delete(id);
    return result.success;
  }

  return {
    // 狀態
    customers,
    loading,
    error,

    // 方法
    fetchCustomers,
    getCustomerById,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
```

---

## 注意事項與最佳實踐

### 錯誤處理

```typescript
// ❌ 不好的做法 - 未檢查 success 和 data
const result = await customerService.findById(id);
console.log(result.data.name); // 可能 null，會報錯

// ✅ 好的做法 - 完整錯誤處理
const result = await customerService.findById(id);

if (result.success && result.data) {
  console.log("客戶姓名:", result.data.fullName);
  console.log("RFM 分群:", result.data.rfmSegment || "尚無分群資料");
} else {
  console.error("查詢失敗:", result.error);
  // 顯示友好錯誤訊息給使用者
}
```

---

### 效能優化

**分頁查詢最佳實踐**:

```typescript
// ✅ 使用適當的分頁大小
const result = await customerService.fetchCustomersWithPagination({
  page: 1,
  perPage: 20, // 桌面版建議 20-50 筆
});

// ✅ 行動版使用較小的分頁
const mobileResult = await customerService.fetchCustomersWithPagination({
  page: 1,
  perPage: 10, // 行動版建議 10-20 筆
});

// ❌ 避免過大的 perPage (影響效能)
const badResult = await customerService.fetchCustomersWithPagination({
  perPage: 1000, // 太大，會造成載入緩慢
});
```

**搜尋最佳化 - 使用防抖 (debounce)**:

```typescript
import { useDebounceFn } from '@vueuse/core'

// ✅ 防抖避免頻繁查詢
const debouncedSearch = useDebounceFn(async (keyword: string) => {
  await customerService.fetchCustomersWithPagination({
    searchTerm: keyword,
    page: 1,
    perPage: 20
  })
}, 300) // 300ms 延遲

// 在 input 事件中使用
<input @input="debouncedSearch($event.target.value)" />
```

**快速查詢 vs 完整查詢**:

```typescript
// ✅ 下拉選單使用快速查詢 (無分頁，最多 50 筆)
const quickSearch = await customerService.fetchCustomersByKeyword("張");

// ✅ 列表頁面使用完整查詢 (有分頁、有總數)
const fullSearch = await customerService.fetchCustomersWithPagination({
  searchTerm: "張",
  page: 1,
  perPage: 20,
});
```

---

### 資料一致性

**更新後重新查詢**:

```typescript
// ✅ 更新資料後重新查詢確保資料一致
await customerService.update(id, { fullName: "新姓名" });
const updated = await customerService.findById(id);

// 確保取得最新的 RFM 分群和統計資料
console.log("更新後的 RFM 分群:", updated.data.rfmSegment);
```

**樂觀更新策略 (Optimistic UI)**:

```typescript
// ✅ 先更新 UI，再發送 API 請求
customers.value = customers.value.map((customer) =>
  customer.id === id ? { ...customer, fullName: "新姓名" } : customer
);

const result = await customerService.update(id, { fullName: "新姓名" });

if (!result.success) {
  // ❌ 失敗時回滾 UI
  await loadCustomers(); // 重新載入正確資料
  showError("更新失敗，請重試");
}
```

---

### RFM 分析最佳實踐

**根據 RFM 分群採取不同策略**:

```typescript
const customer = await customerService.findById(customerId);

if (customer.success && customer.data) {
  const rfm = customer.data.rfmSegment;

  switch (rfm) {
    case RfmSegment.CHAMPIONS:
      // 💎 冠軍客戶 - 提供 VIP 專屬優惠
      console.log("提供 VIP 服務和專屬折扣");
      break;

    case RfmSegment.AT_RISK:
    case RfmSegment.CANNOT_LOSE_THEM:
      // 🚨 流失風險 - 挽回策略
      console.log("發送挽回郵件、提供特別優惠");
      break;

    case RfmSegment.NEW_CUSTOMERS:
      // 🆕 新客戶 - 培育計劃
      console.log("發送歡迎郵件、新手優惠");
      break;

    case RfmSegment.LOST:
      // ❌ 已流失 - 重新獲客
      console.log("重新獲客活動、問卷調查");
      break;

    default:
      console.log("標準客戶服務");
  }
}
```

---

### 權限控制

**RLS (Row Level Security) 政策**:

- ✅ 所有客戶資料受 RLS 保護
- ✅ 一般用戶只能查看自己的客戶資料
- ✅ `customer_service` 角色可查看所有客戶
- ✅ `admin` 角色有完整權限 (包含刪除)

**前端權限檢查範例**:

```typescript
import { usePermissionStore } from "@/stores/permission";

const permissionStore = usePermissionStore();

// 檢查刪除權限
if (permissionStore.can("customer:delete")) {
  await customerService.delete(customerId);
} else {
  showError("您沒有刪除客戶的權限");
}

// 檢查編輯權限
if (permissionStore.can("customer:update")) {
  // 顯示編輯按鈕
}
```

---

## 相關資源

### 相關 API 服務

- [OrderApiService](./order-api.md) - 訂單服務 (查詢客戶訂單記錄)
- [CampaignApiService](./campaign-api.md) - 活動服務 (客戶行銷活動)
- [DashboardApiService](./dashboard-api.md) - 儀表板服務 (客戶統計指標)

### 相關組件

- `CustomersView.vue` - 客戶列表頁面 (src/views/CustomersView.vue)
- `CustomerDetailView.vue` - 客戶詳情頁面
- `CustomerAnalyticsView.vue` - 客戶分析頁面
- `OrderForm.vue` - 訂單表單的客戶選擇下拉選單

### 相關 Composables

- `useCustomerManagement.ts` - 客戶管理 composable (建議使用)
- `useCustomerQueries.ts` - 客戶查詢 (Vue Query 整合)

### 相關文件

- [資料庫 Schema](../database/schema.sql) - customers 表結構
- [RLS 安全政策](../database/rls-policy.md) - 客戶資料權限控制
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md)
- [RFM 分析指南](../../01-planning/prd/customer-rfm-analysis.md) - RFM 業務邏輯說明

---

## 🧪 測試

### 單元測試範例

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@/tests/mocks";
import { CustomerApiService } from "./CustomerApiService";
import type { DbCustomerDetail } from "@/types";

describe("CustomerApiService", () => {
  let service: CustomerApiService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new CustomerApiService(mockSupabase);
  });

  describe("fetchCustomersWithPagination", () => {
    it("should fetch customers with pagination", async () => {
      const mockData: DbCustomerDetail[] = [
        {
          id: "1",
          customer_number: "CUST-001",
          email: "test@example.com",
          full_name: "測試客戶",
          created_at: "2025-01-01T00:00:00Z",
          rfm_segment: "Champions",
          total_spent: 10000,
          order_count: 5,
        },
      ];

      mockSupabase.from().select().returns({
        data: mockData,
        error: null,
        count: 1,
      });

      const result = await service.fetchCustomersWithPagination({
        page: 1,
        perPage: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.data[0].fullName).toBe("測試客戶");
      expect(result.data[0].rfmSegment).toBe("Champions");
    });

    it("should apply search filter", async () => {
      mockSupabase.from().select().or().returns({
        data: [],
        error: null,
        count: 0,
      });

      await service.fetchCustomersWithPagination({
        searchTerm: "張",
      });

      // 驗證 ILIKE 查詢被調用
      expect(mockSupabase.from().select().or).toHaveBeenCalledWith(
        expect.stringContaining("ilike")
      );
    });

    it("should apply status filter", async () => {
      mockSupabase.from().select().in().returns({
        data: [],
        error: null,
        count: 0,
      });

      await service.fetchCustomersWithPagination({
        status: ["active", "inactive"],
      });

      expect(mockSupabase.from().select().in).toHaveBeenCalledWith("status", [
        "active",
        "inactive",
      ]);
    });
  });

  describe("findById", () => {
    it("should fetch customer with AOV data", async () => {
      const mockCustomer: DbCustomerDetail = {
        id: "1",
        email: "test@example.com",
        full_name: "測試客戶",
        created_at: "2025-01-01T00:00:00Z",
      };

      const mockBehavior = { avg_order_value: 3333.33 };

      mockSupabase
        .from("customer_details")
        .select()
        .eq()
        .single()
        .returns({ data: mockCustomer, error: null });

      mockSupabase
        .from("customer_order_basic_behavior")
        .select()
        .eq()
        .single()
        .returns({ data: mockBehavior, error: null });

      const result = await service.findById("1");

      expect(result.success).toBe(true);
      expect(result.data.averageOrderValue).toBe(3333.33);
    });

    it("should return customer even if AOV query fails", async () => {
      const mockCustomer: DbCustomerDetail = {
        id: "1",
        email: "test@example.com",
        full_name: "測試客戶",
        created_at: "2025-01-01T00:00:00Z",
      };

      mockSupabase
        .from("customer_details")
        .select()
        .eq()
        .single()
        .returns({ data: mockCustomer, error: null });

      mockSupabase
        .from("customer_order_basic_behavior")
        .select()
        .eq()
        .single()
        .returns({ data: null, error: { message: "No rows" } });

      const result = await service.findById("1");

      expect(result.success).toBe(true);
      expect(result.data.averageOrderValue).toBeNull();
    });
  });

  describe("getCustomerOverview", () => {
    it("should fetch customer overview stats", async () => {
      const mockData = {
        customer_summary: {
          totalcustomers: 1000,
          customerswithemail: 950,
          customerswithname: 980,
          customerswithorders: 600,
          onetimecustomers: 200,
          returningcustomers: 400,
        },
      };

      mockSupabase
        .rpc("get_customer_analysis")
        .returns({ data: mockData, error: null });

      const result = await service.getCustomerOverview();

      expect(result.success).toBe(true);
      expect(result.data.totalCustomers).toBe(1000);
      expect(result.data.returningCustomers).toBe(400);
    });
  });

  describe("error handling", () => {
    it("should handle database errors gracefully", async () => {
      mockSupabase
        .from()
        .select()
        .returns({
          data: null,
          error: { message: "Database connection failed" },
        });

      const result = await service.fetchCustomersWithPagination({});

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database connection failed");
    });
  });
});
```

---

## 變更歷史

| 日期       | 版本  | 變更內容                 | 作者     |
| ---------- | ----- | ------------------------ | -------- |
| 2025-10-07 | 1.0.0 | 初始版本 - 完整 API 文件 | 開發團隊 |

---

**維護提醒**:

- 當 CustomerApiService 新增方法時，請同步更新此文件
- 當 RFM 分群邏輯變更時，請更新 RfmSegment 說明
- 當資料庫視圖結構變更時，請更新資料結構章節
- 記得在變更歷史中記錄所有重要變更
