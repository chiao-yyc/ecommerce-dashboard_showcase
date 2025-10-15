# CampaignApiService API 文件

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐ (行銷系統核心)

---

## 概覽

### 業務用途

CampaignApiService 是行銷活動管理的核心 API 服務，支援完整的活動生命週期管理（CRUD）和分層歸因系統。它提供活動排程、類型管理、歸因權重計算等功能，是行銷效果分析的基礎數據來源。

### 核心功能

- **活動 CRUD 管理** - 新增、查詢、更新、刪除行銷活動
- **分層歸因系統** - 支援 4 層歸因架構（site-wide, target-oriented, category-specific, general）
- **活動類型管理** - 10 種預定義活動類型（快閃特賣、季節性、會員專屬等）
- **智能搜尋與篩選** - 支援活動名稱、類型、描述的模糊搜尋
- **批量操作** - 支援批量刪除活動
- **權重與優先級** - 自動計算歸因權重和優先級分數

### 技術架構

- **繼承**: `BaseApiService<Campaign, DbCampaign>`
- **資料表**: `campaigns` (主要)
- **關聯表**: `campaign_type_configs` (活動類型配置)
- **依賴服務**: 無（獨立服務）
- **前端使用**:
  - `CampaignView.vue` - 活動列表管理頁面
  - `CampaignCalendarView.vue` - 活動日曆視圖
  - `CampaignAnalyticsView.vue` - 活動效果分析頁面

### 資料庫層 API 參考

> **Supabase 自動生成文件**
>
> 如需查詢 `campaigns` 資料表的基礎 Schema 和 PostgREST API：
>
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `campaigns` / `campaign_type_configs`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
>
> - ✅ 查詢活動資料表結構和類型配置
> - ✅ 了解活動期間的資料庫約束
> - ✅ 檢視 RLS 政策和權限控制
>
> **何時使用本文件**：
>
> - ✅ 使用 `CampaignApiService` 的分層歸因邏輯
> - ✅ 了解活動權重計算和優先級排序
> - ✅ 學習活動類型管理和批量操作
> - ✅ 查看資料映射規則和最佳實踐

---

## API 方法詳細說明

### 基礎 CRUD 方法

#### `fetchCampaignsWithPagination()` - 活動列表查詢

**用途**: 取得活動列表，支援分頁、搜尋、類型篩選和排序（⭐ 推薦使用）

**方法簽名**:

```typescript
async fetchCampaignsWithPagination(options: {
  page: number
  perPage: number
  searchTerm?: string
  campaignTypes?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiResponse<any>>
```

**參數**:

```typescript
{
  page: number                  // 頁碼 (1-based)
  perPage: number               // 每頁筆數
  searchTerm?: string           // 搜尋關鍵字（活動名稱、類型、描述）
  campaignTypes?: string[]      // 活動類型篩選 ['flash_sale', 'seasonal']
  sortBy?: string               // 排序欄位（預設：'created_at'）
  sortOrder?: 'asc' | 'desc'    // 排序方向（預設：'desc'）
}
```

**回傳值**:

```typescript
{
  success: boolean
  data: Campaign[]              // 活動列表
  page: number
  perPage: number
  totalPages: number
  error?: string
}
```

**使用範例**:

```typescript
import { defaultServiceFactory } from "@/api/services";

const campaignService = defaultServiceFactory.getCampaignService();

// 基本查詢
const result = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20,
});

// 搜尋查詢
const searchResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 10,
  searchTerm: "雙11",
});

// 類型篩選查詢
const filteredResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20,
  campaignTypes: ["flash_sale", "seasonal"],
});

// 排序查詢
const sortedResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20,
  sortBy: "startDate",
  sortOrder: "desc",
});
```

**搜尋邏輯**:

```typescript
// 搜尋關鍵字會對以下欄位執行 ILIKE 查詢（不區分大小寫）
-campaign_name - // 活動名稱
  campaign_type - // 活動類型
  description; // 活動描述
```

**注意事項**:

- ⚠️ `sortBy` 欄位使用 **camelCase** 格式，服務會自動轉換為資料庫的 snake_case
- ⚠️ 預設按 `created_at` 降序排列（最新活動在前）
- ⚠️ 預設每頁 10 筆，最大建議 100 筆

---

#### `getCampaignById()` - 單筆查詢

**用途**: 根據 ID 取得單一活動的詳細資料

**方法簽名**:

```typescript
async getCampaignById(id: string): Promise<ApiResponse<Campaign>>
```

**參數**:

- `id`: 活動的 UUID

**回傳值**:

```typescript
interface ApiResponse<Campaign> {
  success: boolean;
  data: Campaign | null;
  error?: string;
}
```

**使用範例**:

```typescript
const result = await campaignService.getCampaignById("campaign-uuid-here");

if (result.success && result.data) {
  console.log("活動名稱:", result.data.campaignName);
  console.log("活動類型:", result.data.campaignType);
  console.log("歸因層級:", result.data.attributionLayer);
} else {
  console.error("查詢失敗:", result.error);
}
```

**錯誤處理**:

- ID 不存在時: `{ success: false, error: '找不到活動' }`
- 權限不足時: `{ success: false, error: 'Permission denied' }`

---

#### `createCampaign()` - 新增活動

**用途**: 創建新的行銷活動

**方法簽名**:

```typescript
async createCampaign(campaignData: {
  campaignName: string
  startDate: string
  endDate: string
  campaignType?: CampaignTypeCode
  description?: string
  attributionLayer?: AttributionLayer
  priorityScore?: number
  attributionWeight?: number
}): Promise<ApiResponse<Campaign>>
```

**參數**:

```typescript
{
  campaignName: string              // 活動名稱（必填）
  startDate: string                 // 開始日期 "YYYY-MM-DD"（必填）
  endDate: string                   // 結束日期 "YYYY-MM-DD"（必填）
  campaignType?: CampaignTypeCode   // 活動類型（選填，預設 'general'）
  description?: string              // 活動描述（選填）
  attributionLayer?: AttributionLayer  // 歸因層級（選填，自動根據類型設定）
  priorityScore?: number            // 優先級分數（選填，自動計算）
  attributionWeight?: number        // 歸因權重（選填，自動計算）
}
```

**活動類型** (10 種):

```typescript
// Site-wide (全站活動)
"flash_sale"; // 快閃特賣
"seasonal"; // 季節性活動
"holiday"; // 節日活動
"anniversary"; // 週年慶

// Target-oriented (目標導向)
"membership"; // 會員專屬
"demographic"; // 人群定向

// Category-specific (品類特定)
"category"; // 品類促銷
"product_launch"; // 新品上市
"lifestyle"; // 生活風格

// General (一般活動)
"general"; // 一般活動
```

**使用範例**:

```typescript
// 基本新增
const newCampaign = {
  campaignName: "雙11購物節",
  startDate: "2025-11-11",
  endDate: "2025-11-11",
  campaignType: "flash_sale" as CampaignTypeCode,
  description: "全站商品限時特賣，最高折扣 50%",
};

const result = await campaignService.createCampaign(newCampaign);

if (result.success) {
  console.log("新增成功，活動 ID:", result.data.id);
  console.log("歸因層級:", result.data.attributionLayer); // 'site-wide'
}

// 自訂歸因參數
const customCampaign = {
  campaignName: "春季新品發表",
  startDate: "2025-03-01",
  endDate: "2025-03-31",
  campaignType: "product_launch" as CampaignTypeCode,
  attributionLayer: "category-specific",
  priorityScore: 8.5,
  attributionWeight: 0.25,
};

const customResult = await campaignService.createCampaign(customCampaign);
```

**驗證規則**:

- ✅ `campaignName` 必填，不可為空字串
- ✅ `startDate` 必填，格式：YYYY-MM-DD
- ✅ `endDate` 必填，格式：YYYY-MM-DD
- ⚠️ `endDate` 應大於或等於 `startDate`（前端驗證）
- ⚠️ `campaignType` 若未提供，預設為 `'general'`

**自動計算邏輯**:

```typescript
// 若未提供 attributionLayer，根據 campaignType 自動設定
flash_sale/seasonal/holiday/anniversary → 'site-wide'
membership/demographic → 'target-oriented'
category/product_launch/lifestyle → 'category-specific'
general → 'general'

// 若未提供 priorityScore，根據 campaignType 自動設定預設值
site-wide: 9.0
target-oriented: 7.5
category-specific: 6.0
general: 5.0

// 若未提供 attributionWeight，根據 campaignType 自動設定預設值
site-wide: 0.40
target-oriented: 0.30
category-specific: 0.20
general: 0.10
```

---

#### `updateCampaign()` - 更新活動

**用途**: 更新現有活動的資料

**方法簽名**:

```typescript
async updateCampaign(
  id: string,
  updates: Partial<Campaign>
): Promise<ApiResponse<Campaign>>
```

**參數**:

- `id`: 要更新的活動 UUID
- `updates`: 要更新的欄位（只需提供變更的欄位）

**使用範例**:

```typescript
// 更新活動名稱和描述
const result = await campaignService.updateCampaign("campaign-uuid", {
  campaignName: "雙11購物節（延長至11/12）",
  endDate: "2025-11-12",
});

// 更新歸因參數
const weightResult = await campaignService.updateCampaign("campaign-uuid", {
  priorityScore: 9.5,
  attributionWeight: 0.45,
});
```

**注意事項**:

- ⚠️ 只會更新提供的欄位，其他欄位保持不變
- ⚠️ `id` 和 `createdAt` 等系統欄位不可更新
- ⚠️ 活動類型變更可能影響歸因層級，需同時調整 `attributionLayer`

---

#### `deleteCampaign()` - 刪除活動

**用途**: 刪除單一活動記錄（實體刪除）

**方法簽名**:

```typescript
async deleteCampaign(id: string): Promise<ApiResponse<any>>
```

**刪除策略**:

- 🗑️ **實體刪除**：直接從資料庫移除記錄（不可復原）
- ⚠️ **關聯影響**：刪除活動會影響相關的歸因分析數據

**使用範例**:

```typescript
const result = await campaignService.deleteCampaign("campaign-uuid");

if (result.success) {
  console.log("刪除成功");
}
```

**注意事項**:

- ⚠️ 刪除操作不可復原
- ⚠️ 建議刪除前確認活動未被引用於分析報表中
- ⚠️ 已結束的活動建議保留以維持歷史數據完整性

---

#### `deleteCampaigns()` - 批量刪除活動

**用途**: 批量刪除多個活動記錄

**方法簽名**:

```typescript
async deleteCampaigns(ids: string[]): Promise<ApiResponse<any>>
```

**參數**:

- `ids`: 要刪除的活動 UUID 陣列

**使用範例**:

```typescript
const idsToDelete = ["uuid-1", "uuid-2", "uuid-3"];
const result = await campaignService.deleteCampaigns(idsToDelete);

if (result.success) {
  console.log(`成功刪除 ${idsToDelete.length} 個活動`);
}
```

**注意事項**:

- ⚠️ 批量刪除操作不可復原
- ⚠️ 建議限制單次刪除數量（如最多 50 個）避免長時間鎖定
- ⚠️ 前端應提供明確的確認對話框

---

### 業務特定方法

#### `fetchCampaignsByKeyword()` - 關鍵字快速搜尋

**用途**: 根據關鍵字快速搜尋活動，適用於下拉選單或自動完成

**方法簽名**:

```typescript
async fetchCampaignsByKeyword(
  keyword: string
): Promise<ApiResponse<Campaign[]>>
```

**參數**:

- `keyword`: 搜尋關鍵字

**回傳值**:

- 最多返回 10 筆匹配的活動（排序依據：創建時間降序）

**使用範例**:

```typescript
// 用於自動完成下拉選單
const result = await campaignService.fetchCampaignsByKeyword("雙11");

if (result.success) {
  result.data.forEach((campaign) => {
    console.log(campaign.campaignName, campaign.startDate);
  });
}
```

**與 `fetchCampaignsWithPagination()` 的差異**:
| 功能 | `fetchCampaignsByKeyword()` | `fetchCampaignsWithPagination()` |
|------|----------------------------|----------------------------------|
| 用途 | 快速搜尋、自動完成 | 完整列表查詢 |
| 分頁 | ❌ 無分頁（固定 10 筆） | ✅ 支援分頁 |
| 篩選 | ❌ 僅搜尋活動名稱 | ✅ 支援類型篩選 |
| 排序 | ❌ 固定排序 | ✅ 自訂排序 |
| 效能 | ⚡ 更快（簡化查詢） | 🐢 較慢（完整功能） |

**注意事項**:

- ⚠️ 僅搜尋 `campaign_name` 欄位（不含類型和描述）
- ⚠️ 固定返回最多 10 筆結果
- ⚠️ 適用於輕量級搜尋場景（如表單選擇器）

---

## 資料結構

### Entity 類型 (前端)

```typescript
interface Campaign {
  id: string;
  campaignName: string; // 活動名稱
  startDate: string; // 開始日期 "YYYY-MM-DD"
  endDate: string; // 結束日期 "YYYY-MM-DD"
  campaignType: CampaignTypeCode; // 活動類型代碼
  description?: string | null; // 活動描述
  createdAt: string; // 建立時間 (ISO 8601)
  attributionLayer?: AttributionLayer; // 歸因層級
  priorityScore?: number; // 優先級分數 (0-10)
  attributionWeight?: number; // 歸因權重 (0-1)
}
```

**欄位說明**:

- `id`: 活動唯一識別碼 (UUID)
- `campaignName`: 活動名稱（如：「雙 11 購物節」）
- `startDate`: 活動開始日期（格式：YYYY-MM-DD）
- `endDate`: 活動結束日期（格式：YYYY-MM-DD）
- `campaignType`: 活動類型代碼（10 種，見下方說明）
- `description`: 活動描述（選填，可為 null）
- `createdAt`: 建立時間（ISO 8601 格式）
- `attributionLayer`: 歸因層級（4 層，見下方說明）
- `priorityScore`: 優先級分數（0-10，影響歸因計算）
- `attributionWeight`: 歸因權重（0-1，總和為 1）

---

### DbEntity 類型 (資料庫)

```typescript
interface DbCampaign {
  id: string;
  campaign_name: string; // 對應 Campaign.campaignName
  start_date: string; // 對應 Campaign.startDate
  end_date: string; // 對應 Campaign.endDate
  campaign_type: CampaignTypeCode; // 對應 Campaign.campaignType
  description: string | null; // 對應 Campaign.description
  created_at: string; // 對應 Campaign.createdAt
  attribution_layer: AttributionLayer | null; // 對應 Campaign.attributionLayer
  priority_score: number | null; // 對應 Campaign.priorityScore
  attribution_weight: number | null; // 對應 Campaign.attributionWeight
}
```

**命名規則**:

- 前端使用 **camelCase**: `campaignName`, `startDate`
- 資料庫使用 **snake_case**: `campaign_name`, `start_date`

---

### 活動類型 (CampaignTypeCode)

```typescript
type CampaignTypeCode =
  // Site-wide (全站活動) - 最高優先級
  | "flash_sale" // 快閃特賣
  | "seasonal" // 季節性活動
  | "holiday" // 節日活動
  | "anniversary" // 週年慶

  // Target-oriented (目標導向) - 中高優先級
  | "membership" // 會員專屬
  | "demographic" // 人群定向

  // Category-specific (品類特定) - 中等優先級
  | "category" // 品類促銷
  | "product_launch" // 新品上市
  | "lifestyle" // 生活風格

  // General (一般活動) - 最低優先級
  | "general"; // 一般活動
```

**活動類型配置**:
| 類型代碼 | 中文名稱 | 歸因層級 | 預設權重 | 預設優先級 |
|---------|---------|---------|---------|-----------|
| flash_sale | 快閃特賣 | site-wide | 0.40 | 9.0 |
| seasonal | 季節性活動 | site-wide | 0.40 | 9.0 |
| holiday | 節日活動 | site-wide | 0.40 | 9.0 |
| anniversary | 週年慶 | site-wide | 0.40 | 9.0 |
| membership | 會員專屬 | target-oriented | 0.30 | 7.5 |
| demographic | 人群定向 | target-oriented | 0.30 | 7.5 |
| category | 品類促銷 | category-specific | 0.20 | 6.0 |
| product_launch | 新品上市 | category-specific | 0.20 | 6.0 |
| lifestyle | 生活風格 | category-specific | 0.20 | 6.0 |
| general | 一般活動 | general | 0.10 | 5.0 |

---

### 歸因層級 (AttributionLayer)

```typescript
enum AttributionLayer {
  SITE_WIDE = "site-wide", // 全站活動
  TARGET_ORIENTED = "target-oriented", // 目標導向
  CATEGORY_SPECIFIC = "category-specific", // 品類特定
  GENERAL = "general", // 一般活動
}
```

**分層歸因架構說明**:

**第一層：Site-wide (全站活動)**

- 🎯 **定義**: 影響全站所有商品和用戶的活動
- 🏆 **優先級**: 最高（9.0）
- 📊 **權重**: 40%
- 💡 **範例**: 雙 11 購物節、黑色星期五、週年慶
- 📈 **歸因邏輯**: 所有訂單都受到影響，基礎歸因貢獻

**第二層：Target-oriented (目標導向)**

- 🎯 **定義**: 針對特定用戶群體的活動
- 🏆 **優先級**: 中高（7.5）
- 📊 **權重**: 30%
- 💡 **範例**: VIP 會員專屬折扣、新客首購優惠、學生優惠
- 📈 **歸因邏輯**: 僅對目標客群產生影響

**第三層：Category-specific (品類特定)**

- 🎯 **定義**: 針對特定商品品類的活動
- 🏆 **優先級**: 中等（6.0）
- 📊 **權重**: 20%
- 💡 **範例**: 3C 產品促銷、服飾新品上市、美妝品類日
- 📈 **歸因邏輯**: 僅對相關品類產生影響

**第四層：General (一般活動)**

- 🎯 **定義**: 其他零散的促銷活動
- 🏆 **優先級**: 最低（5.0）
- 📊 **權重**: 10%
- 💡 **範例**: 隨機滿減、社群分享優惠
- 📈 **歸因邏輯**: 補充性歸因，避免遺漏

**多層歸因計算範例**:

```typescript
// 假設某訂單發生在以下活動期間
活動 A (site-wide, 雙11): 40% 權重
活動 B (target-oriented, VIP專屬): 30% 權重
活動 C (category-specific, 3C促銷): 20% 權重
活動 D (general, 滿千送百): 10% 權重

// 正規化後的歸因比例
總權重 = 0.40 + 0.30 + 0.20 + 0.10 = 1.00
活動 A 歸因: 40%
活動 B 歸因: 30%
活動 C 歸因: 20%
活動 D 歸因: 10%
```

---

### 資料映射邏輯

```typescript
// DbCampaign → Campaign (mapDbToEntity)
{
  id: dbCampaign.id,
  campaignName: dbCampaign.campaign_name,
  startDate: dbCampaign.start_date,
  endDate: dbCampaign.end_date,
  campaignType: dbCampaign.campaign_type,
  description: dbCampaign.description,
  createdAt: dbCampaign.created_at,
  attributionLayer: dbCampaign.attribution_layer,
  priorityScore: dbCampaign.priority_score,
  attributionWeight: dbCampaign.attribution_weight
}

// Campaign → DbCampaign (mapEntityToDb)
{
  id: campaign.id,               // 僅在更新時包含
  campaign_name: campaign.campaignName,
  start_date: campaign.startDate,
  end_date: campaign.endDate,
  campaign_type: campaign.campaignType,
  description: campaign.description,
  attribution_layer: campaign.attributionLayer,
  priority_score: campaign.priorityScore,
  attribution_weight: campaign.attributionWeight
}
```

**特殊處理**:

- 選填欄位: 資料庫 `null` ↔ 前端 `undefined` 或 `null`
- 日期格式: 統一使用 `YYYY-MM-DD` 字串格式
- ID 處理: 新增時不傳送 `id`，避免與資料庫自動生成衝突

---

## 使用範例

### 完整業務流程範例

```typescript
import { defaultServiceFactory } from "@/api/services";

// 1. 取得服務實例
const campaignService = defaultServiceFactory.getCampaignService();

// 2. 查詢活動列表
const listResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20,
});
console.log("總活動數:", listResult.totalPages * listResult.perPage);

// 3. 新增活動
const newCampaign = {
  campaignName: "雙11購物節",
  startDate: "2025-11-11",
  endDate: "2025-11-11",
  campaignType: "flash_sale" as CampaignTypeCode,
  description: "全站商品限時特賣",
};

const createResult = await campaignService.createCampaign(newCampaign);

if (createResult.success) {
  const campaignId = createResult.data.id;

  // 4. 查詢詳情
  const detailResult = await campaignService.getCampaignById(campaignId);
  console.log("歸因層級:", detailResult.data.attributionLayer); // 'site-wide'

  // 5. 更新活動
  await campaignService.updateCampaign(campaignId, {
    endDate: "2025-11-12",
    description: "雙11購物節延長至11/12",
  });

  // 6. 刪除活動（如需）
  // await campaignService.deleteCampaign(campaignId)
}
```

---

### 在 Vue 組件中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { defaultServiceFactory } from "@/api/services";
import type { Campaign } from "@/types";

const campaignService = defaultServiceFactory.getCampaignService();
const campaigns = ref<Campaign[]>([]);
const loading = ref(false);

async function loadCampaigns() {
  loading.value = true;
  try {
    const result = await campaignService.fetchCampaignsWithPagination({
      page: 1,
      perPage: 20,
    });
    if (result.success) {
      campaigns.value = result.data;
    }
  } catch (error) {
    console.error("載入失敗:", error);
  } finally {
    loading.value = false;
  }
}

async function createCampaign(campaignData: any) {
  const result = await campaignService.createCampaign(campaignData);
  if (result.success) {
    await loadCampaigns(); // 重新載入列表
  }
}

onMounted(() => {
  loadCampaigns();
});
</script>

<template>
  <div v-if="loading">載入中...</div>
  <div v-else>
    <div v-for="campaign in campaigns" :key="campaign.id">
      <h3>{{ campaign.campaignName }}</h3>
      <p>{{ campaign.startDate }} ~ {{ campaign.endDate }}</p>
      <span>{{ campaign.campaignType }}</span>
    </div>
  </div>
</template>
```

---

### 在 Composable 中使用

```typescript
// composables/useCampaign.ts
import { ref } from "vue";
import { defaultServiceFactory } from "@/api/services";
import type { Campaign, CampaignForm } from "@/types";

export function useCampaign() {
  const campaignService = defaultServiceFactory.getCampaignService();
  const campaigns = ref<Campaign[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCampaigns(options: {
    page: number;
    perPage: number;
    searchTerm?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await campaignService.fetchCampaignsWithPagination(
        options
      );
      if (result.success) {
        campaigns.value = result.data;
        return result;
      } else {
        error.value = result.error || "Unknown error";
        return null;
      }
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function addCampaign(campaignData: CampaignForm) {
    loading.value = true;
    error.value = null;
    try {
      const result = await campaignService.createCampaign(campaignData);
      if (result.success) {
        return result;
      } else {
        error.value = result.error || "Create failed";
        return null;
      }
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function editCampaign(id: string, updates: Partial<Campaign>) {
    loading.value = true;
    error.value = null;
    try {
      const result = await campaignService.updateCampaign(id, updates);
      if (result.success) {
        return result;
      } else {
        error.value = result.error || "Update failed";
        return null;
      }
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function removeCampaign(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const result = await campaignService.deleteCampaign(id);
      if (result.success) {
        return result;
      } else {
        error.value = result.error || "Delete failed";
        return null;
      }
    } catch (e) {
      error.value = e.message;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    addCampaign,
    editCampaign,
    removeCampaign,
  };
}
```

---

## 注意事項與最佳實踐

### 錯誤處理

**完整的錯誤處理範例**:

```typescript
// ✅ 好的做法
const result = await campaignService.getCampaignById(id);
if (result.success && result.data) {
  console.log(result.data.campaignName);
} else {
  console.error("查詢失敗:", result.error);
  showToast(result.error || "查詢活動失敗", "error");
}

// ❌ 不好的做法
const result = await campaignService.getCampaignById(id);
console.log(result.data.campaignName); // 可能 null，會報錯
```

---

### 活動日期驗證

**日期範圍檢查**:

```typescript
// ✅ 好的做法：前端驗證日期範圍
const campaignData = {
  campaignName: "春季促銷",
  startDate: "2025-03-01",
  endDate: "2025-03-31",
  campaignType: "seasonal",
};

const startDate = new Date(campaignData.startDate);
const endDate = new Date(campaignData.endDate);

if (endDate < startDate) {
  showToast("結束日期不能早於開始日期", "error");
  return;
}

const result = await campaignService.createCampaign(campaignData);

// ❌ 不好的做法：未驗證就提交
await campaignService.createCampaign({
  startDate: "2025-03-31",
  endDate: "2025-03-01", // 錯誤：結束日期早於開始日期
});
```

**日期格式處理**:

```typescript
// ✅ 確保日期格式統一為 YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const startDate = formatDate(new Date("2025-03-01"));
const endDate = formatDate(new Date("2025-03-31"));

// ❌ 避免使用當地時間格式
const badDate = new Date().toLocaleDateString(); // "3/1/2025" (格式不一致)
```

---

### 活動類型與歸因層級

**自動歸因設定**:

```typescript
// ✅ 好的做法：讓服務自動設定歸因參數
const campaign = {
  campaignName: "雙11購物節",
  startDate: "2025-11-11",
  endDate: "2025-11-11",
  campaignType: "flash_sale" as CampaignTypeCode,
  // attributionLayer, priorityScore, attributionWeight 自動設定
};

const result = await campaignService.createCampaign(campaign);
console.log(result.data.attributionLayer); // 'site-wide'
console.log(result.data.priorityScore); // 9.0
console.log(result.data.attributionWeight); // 0.40

// ⚠️ 特殊情況：需自訂歸因參數
const customCampaign = {
  campaignName: "特殊專案",
  startDate: "2025-04-01",
  endDate: "2025-04-30",
  campaignType: "general" as CampaignTypeCode,
  attributionLayer: "target-oriented", // 手動覆蓋
  priorityScore: 8.0,
  attributionWeight: 0.35,
};
```

**活動類型選擇指南**:

```typescript
// 全站活動（影響所有用戶和商品）
'flash_sale'    → 限時特賣、快閃搶購
'seasonal'      → 春季、夏季、秋季、冬季促銷
'holiday'       → 春節、中秋、聖誕節
'anniversary'   → 品牌週年慶、店慶

// 目標導向（特定用戶群）
'membership'    → VIP會員專屬、等級福利
'demographic'   → 學生優惠、銀髮族優惠、職業優惠

// 品類特定（特定商品類別）
'category'      → 3C促銷、服飾特賣、食品節
'product_launch' → 新品發表、限量首發
'lifestyle'     → 健身主題、旅遊主題、美妝主題

// 一般活動（其他促銷）
'general'       → 滿減活動、隨機優惠券
```

---

### 效能優化

**分頁查詢最佳實踐**:

```typescript
// ✅ 使用合理的分頁大小
const result = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20, // 建議 10-50 筆
});

// ❌ 避免一次載入過多資料
const badResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 1000, // 效能差，可能超時
});
```

**搜尋策略**:

```typescript
// ✅ 使用 fetchCampaignsByKeyword 進行快速搜尋
import { useDebounceFn } from "@vueuse/core";

const debouncedSearch = useDebounceFn(async (keyword: string) => {
  const result = await campaignService.fetchCampaignsByKeyword(keyword);
  // 更新搜尋結果
}, 300);

// 輸入框變更時觸發
input.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});

// ✅ 使用 fetchCampaignsWithPagination 進行完整查詢
const fullSearchResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20,
  searchTerm: "雙11",
});
```

---

### 資料一致性

**更新後重新查詢**:

```typescript
// ✅ 更新資料後重新查詢確保一致性
await campaignService.updateCampaign(id, { campaignName: "新名稱" });
const updated = await campaignService.getCampaignById(id);
console.log(updated.data.campaignName); // 確認更新成功

// ✅ 列表操作後重新載入列表
await campaignService.createCampaign(newCampaign);
const listResult = await campaignService.fetchCampaignsWithPagination({
  page: 1,
  perPage: 20,
});
```

**樂觀更新策略**:

```typescript
// ✅ 樂觀更新 UI，失敗時回滾
const originalCampaign = { ...campaign };
campaign.campaignName = "新名稱"; // 立即更新 UI

const result = await campaignService.updateCampaign(campaign.id, {
  campaignName: "新名稱",
});

if (!result.success) {
  // 失敗時回滾
  Object.assign(campaign, originalCampaign);
  showToast("更新失敗", "error");
}
```

---

### 權限控制

**RLS (Row Level Security) 考量**:

- CampaignApiService 受到 RLS 政策保護
- 確保使用者已通過 Supabase 身份驗證
- 不同角色可能有不同的 CRUD 權限

**前端權限檢查範例**:

```typescript
import { usePermissionStore } from "@/stores/permission";

const permissionStore = usePermissionStore();

// 檢查新增權限
if (permissionStore.can("campaign:create")) {
  await campaignService.createCampaign(campaignData);
} else {
  showToast("權限不足：無法新增活動", "error");
}

// 檢查刪除權限
if (permissionStore.can("campaign:delete")) {
  await campaignService.deleteCampaign(id);
} else {
  showToast("權限不足：無法刪除活動", "error");
}
```

---

## 相關資源

### 相關 API 服務

- [DashboardApiService](./dashboard-api.md) - 整合活動效果統計到營運總覽
- **CampaignAnalyticsService** - 活動效果分析（歸因計算、ROI 分析）

### 相關組件

- `CampaignView.vue` - 活動列表管理頁面
- `CampaignList.vue` - 活動列表組件（含搜尋、篩選、排序）
- `CampaignCalendarView.vue` - 活動日曆視圖
- `CampaignAnalyticsView.vue` - 活動效果分析頁面
- `CampaignTimeline.vue` - 活動時間軸圖表

### 相關 Composables

- `useCampaign.ts` - 活動管理邏輯封裝
- `useCampaignTypes.ts` - 活動類型管理

### 相關文件

- [資料庫 Schema](../database/schema.sql) - campaigns 表結構定義
- [活動分層歸因系統設計](../../01-planning/prd/campaign-attribution-system.md) - 歸因計算邏輯
- [RLS 安全政策](../database/rls-policy.md) - 活動資料存取權限
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md) - 統一錯誤處理規範

---

## 🧪 測試

### 單元測試範例

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createMockSupabaseClient } from "@/tests/mocks";
import { CampaignApiService } from "./CampaignApiService";

describe("CampaignApiService", () => {
  let service: CampaignApiService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new CampaignApiService(mockSupabase);
  });

  describe("fetchCampaignsWithPagination()", () => {
    it("should fetch campaigns with pagination", async () => {
      const mockCampaigns = [
        {
          id: "1",
          campaign_name: "雙11購物節",
          start_date: "2025-11-11",
          end_date: "2025-11-11",
          campaign_type: "flash_sale",
          description: "全站特賣",
          created_at: "2025-10-01T00:00:00Z",
          attribution_layer: "site-wide",
          priority_score: 9.0,
          attribution_weight: 0.4,
        },
      ];

      mockSupabase.from().select().range().returns({
        data: mockCampaigns,
        error: null,
        count: 1,
      });

      const result = await service.fetchCampaignsWithPagination({
        page: 1,
        perPage: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].campaignName).toBe("雙11購物節");
      expect(result.data[0].attributionLayer).toBe("site-wide");
    });

    it("should apply search filter", async () => {
      mockSupabase.from().select().or().range().returns({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.fetchCampaignsWithPagination({
        page: 1,
        perPage: 20,
        searchTerm: "雙11",
      });

      expect(mockSupabase.from().select().or).toHaveBeenCalledWith(
        expect.stringContaining("campaign_name.ilike.*雙11*")
      );
    });
  });

  describe("createCampaign()", () => {
    it("should create a new campaign", async () => {
      const newCampaign = {
        campaignName: "春季促銷",
        startDate: "2025-03-01",
        endDate: "2025-03-31",
        campaignType: "seasonal" as CampaignTypeCode,
        description: "春季新品上市",
      };

      const mockCreated = {
        id: "new-uuid",
        campaign_name: "春季促銷",
        start_date: "2025-03-01",
        end_date: "2025-03-31",
        campaign_type: "seasonal",
        description: "春季新品上市",
        created_at: "2025-10-07T00:00:00Z",
        attribution_layer: "site-wide",
        priority_score: 9.0,
        attribution_weight: 0.4,
      };

      mockSupabase.from().insert().select().single().returns({
        data: mockCreated,
        error: null,
      });

      const result = await service.createCampaign(newCampaign);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe("new-uuid");
      expect(result.data.campaignName).toBe("春季促銷");
    });
  });

  describe("updateCampaign()", () => {
    it("should update campaign data", async () => {
      const updates = {
        campaignName: "春季促銷（延長）",
        endDate: "2025-04-15",
      };

      const mockUpdated = {
        id: "campaign-uuid",
        campaign_name: "春季促銷（延長）",
        start_date: "2025-03-01",
        end_date: "2025-04-15",
        campaign_type: "seasonal",
        created_at: "2025-10-01T00:00:00Z",
      };

      mockSupabase.from().update().eq().select().single().returns({
        data: mockUpdated,
        error: null,
      });

      const result = await service.updateCampaign("campaign-uuid", updates);

      expect(result.success).toBe(true);
      expect(result.data.campaignName).toBe("春季促銷（延長）");
      expect(result.data.endDate).toBe("2025-04-15");
    });
  });

  describe("deleteCampaign()", () => {
    it("should delete a campaign", async () => {
      mockSupabase.from().delete().eq().returns({
        error: null,
      });

      const result = await service.deleteCampaign("campaign-uuid");

      expect(result.success).toBe(true);
    });
  });

  describe("fetchCampaignsByKeyword()", () => {
    it("should return max 10 campaigns", async () => {
      const mockCampaigns = Array(15)
        .fill({})
        .map((_, i) => ({
          id: `${i}`,
          campaign_name: `活動 ${i}`,
          start_date: "2025-01-01",
          end_date: "2025-01-31",
          campaign_type: "general",
          created_at: "2025-01-01T00:00:00Z",
        }));

      mockSupabase
        .from()
        .select()
        .or()
        .limit()
        .returns({
          data: mockCampaigns.slice(0, 10),
          error: null,
        });

      const result = await service.fetchCampaignsByKeyword("活動");

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(10);
    });
  });
});
```

---

## 變更歷史

| 日期       | 版本  | 變更內容                                                 | 作者     |
| ---------- | ----- | -------------------------------------------------------- | -------- |
| 2025-10-07 | 1.0.0 | 初始版本：完整記錄 CampaignApiService 的 CRUD 和搜尋方法 | 開發團隊 |
| 2025-10-07 | 1.0.0 | 新增分層歸因系統 (4 層) 詳細說明                         | 開發團隊 |
| 2025-10-07 | 1.0.0 | 新增 10 種活動類型配置與自動歸因邏輯                     | 開發團隊 |

---

**維護提醒**: 當 Campaign API 方法、活動類型配置或歸因邏輯有變更時，請同步更新此文件並記錄在變更歷史中。
