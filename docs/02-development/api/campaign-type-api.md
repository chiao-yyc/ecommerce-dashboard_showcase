# 活動類型 API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐ (配置管理)

---
## 概覽

活動類型 API 提供完整的活動分類管理功能，支援四層歸因架構的可配置活動類型系統。API 設計遵循 RESTful 原則，提供 CRUD 操作、驗證功能和系統健康度檢查。

### 核心特色
- **四層歸因架構**: site-wide > target-oriented > category-specific > general
- **動態配置**: 運行時配置更新，無需重新部署
- **完整驗證**: 類型安全和業務邏輯驗證
- **容錯機制**: 完善的錯誤處理和回復策略

## API 方法詳細說明

### 1. 取得所有活動類型

#### GET `/campaign-types`

取得所有啟用的活動類型清單，支援可選的非啟用類型包含。

**查詢參數**
| 參數 | 類型 | 必填 | 預設值 | 描述 |
|------|------|------|--------|------|
| `includeInactive` | boolean | ❌ | false | 是否包含非啟用的類型 |

**請求範例**
```http
GET /api/campaign-types?includeInactive=false
Accept: application/json
Authorization: Bearer <token>
```

**回應格式**
```typescript
interface CampaignTypesResponse {
  success: boolean
  data?: CampaignTypeConfig[]
  error?: string
  count?: number
}
```

**成功回應範例**
```json
{
  "success": true,
  "data": [
    {
      "type_code": "flash_sale",
      "display_name_zh": "限時搶購",
      "display_name_en": "Flash Sale",
      "attribution_layer": "site-wide",
      "default_weight": 2.5,
      "default_priority": 90,
      "color_class": "bg-red-100 text-red-800",
      "icon_name": "zap",
      "description": "短時間內的促銷活動，通常具有緊迫感",
      "is_active": true,
      "created_at": "2025-08-27T10:00:00Z",
      "updated_at": "2025-08-27T10:00:00Z"
    }
  ],
  "count": 10
}
```

### 2. 取得分組的活動類型

#### GET `/campaign-types/groups`

取得按歸因層級分組的活動類型，包含層級統計資訊。

**請求範例**
```http
GET /api/campaign-types/groups
Accept: application/json
Authorization: Bearer <token>
```

**回應格式**
```typescript
interface CampaignTypeGroupsResponse {
  success: boolean
  data?: Record<AttributionLayer, CampaignTypeGroup>
  error?: string
}

interface CampaignTypeGroup {
  layer: AttributionLayer
  display_name: string
  description: string
  types: CampaignTypeConfig[]
  total_count: number
}
```

**成功回應範例**
```json
{
  "success": true,
  "data": {
    "site-wide": {
      "layer": "site-wide",
      "display_name": "全站活動",
      "description": "影響全體使用者的重大推廣活動",
      "types": [
        {
          "type_code": "flash_sale",
          "display_name_zh": "限時搶購",
          "attribution_layer": "site-wide",
          "default_weight": 2.5,
          "default_priority": 90,
          "color_class": "bg-red-100 text-red-800",
          "is_active": true
        }
      ],
      "total_count": 3
    },
    "target-oriented": {
      "layer": "target-oriented",
      "display_name": "目標導向",
      "description": "針對特定用戶群體的精準行銷活動",
      "types": [],
      "total_count": 2
    }
  }
}
```

### 3. 建立活動類型

#### POST `/campaign-types`

建立新的活動類型配置。

**請求格式**
```typescript
interface CreateCampaignTypeRequest {
  type_code: string                    // 唯一類型代碼
  display_name_zh: string              // 中文顯示名稱
  display_name_en?: string             // 英文顯示名稱
  attribution_layer: AttributionLayer  // 歸因層級
  default_weight?: number              // 預設權重 (0.00-9.99)
  default_priority?: number            // 預設優先級 (0-100)
  color_class?: string                 // CSS 顏色類別
  icon_name?: string                   // 圖示名稱
  description?: string                 // 描述
  is_active?: boolean                  // 是否啟用
}
```

**請求範例**
```http
POST /api/campaign-types
Content-Type: application/json
Authorization: Bearer <token>

{
  "type_code": "summer_sale",
  "display_name_zh": "夏季特賣",
  "display_name_en": "Summer Sale",
  "attribution_layer": "seasonal",
  "default_weight": 1.8,
  "default_priority": 70,
  "color_class": "bg-yellow-100 text-yellow-800",
  "icon_name": "sun",
  "description": "夏季商品的季節性促銷活動",
  "is_active": true
}
```

**回應格式**
```typescript
interface CreateCampaignTypeResponse {
  success: boolean
  data?: CampaignTypeConfig
  error?: string
}
```

**成功回應範例**
```json
{
  "success": true,
  "data": {
    "type_code": "summer_sale",
    "display_name_zh": "夏季特賣",
    "display_name_en": "Summer Sale",
    "attribution_layer": "category-specific",
    "default_weight": 1.8,
    "default_priority": 70,
    "color_class": "bg-yellow-100 text-yellow-800",
    "icon_name": "sun",
    "description": "夏季商品的季節性促銷活動",
    "is_active": true,
    "created_at": "2025-08-27T10:00:00Z",
    "updated_at": "2025-08-27T10:00:00Z"
  }
}
```

### 4. 更新活動類型

#### PUT `/campaign-types/:type_code`

更新指定的活動類型配置。

**路徑參數**
| 參數 | 類型 | 必填 | 描述 |
|------|------|------|------|
| `type_code` | string | ✅ | 活動類型代碼 |

**請求格式**
```typescript
interface UpdateCampaignTypeRequest {
  display_name_zh?: string
  display_name_en?: string
  attribution_layer?: AttributionLayer
  default_weight?: number
  default_priority?: number
  color_class?: string
  icon_name?: string
  description?: string
  is_active?: boolean
}
```

**請求範例**
```http
PUT /api/campaign-types/summer_sale
Content-Type: application/json
Authorization: Bearer <token>

{
  "default_weight": 2.0,
  "default_priority": 75,
  "description": "更新後的夏季商品促銷活動描述"
}
```

**回應格式與建立相同**

### 5. 刪除活動類型

#### DELETE `/campaign-types/:type_code`

軟刪除指定的活動類型（設置 `is_active = false`）。

**路徑參數**
| 參數 | 類型 | 必填 | 描述 |
|------|------|------|------|
| `type_code` | string | ✅ | 活動類型代碼 |

**請求範例**
```http
DELETE /api/campaign-types/summer_sale
Authorization: Bearer <token>
```

**回應格式**
```typescript
interface DeleteCampaignTypeResponse {
  success: boolean
  error?: string
  message?: string
}
```

**成功回應範例**
```json
{
  "success": true,
  "message": "活動類型已成功停用"
}
```

### 6. 驗證活動類型

#### POST `/campaign-types/:type_code/validate`

驗證指定活動類型是否有效且啟用。

**路徑參數**
| 參數 | 類型 | 必填 | 描述 |
|------|------|------|------|
| `type_code` | string | ✅ | 活動類型代碼 |

**請求範例**
```http
POST /api/campaign-types/flash_sale/validate
Authorization: Bearer <token>
```

**回應格式**
```typescript
interface ValidateCampaignTypeResponse {
  success: boolean
  data?: {
    is_valid: boolean
    type_config?: CampaignTypeConfig
    validation_message?: string
  }
  error?: string
}
```

**成功回應範例**
```json
{
  "success": true,
  "data": {
    "is_valid": true,
    "type_config": {
      "type_code": "flash_sale",
      "display_name_zh": "限時搶購",
      "attribution_layer": "site-wide",
      "is_active": true
    },
    "validation_message": "活動類型有效且啟用中"
  }
}
```

### 7. 系統健康度檢查

#### GET `/campaign-types/health`

執行系統健康度檢查，返回配置統計和系統狀態。

**請求範例**
```http
GET /api/campaign-types/health
Authorization: Bearer <token>
```

**回應格式**
```typescript
interface SystemHealthResponse {
  success: boolean
  data?: {
    total_types: number
    active_types: number
    layers_coverage: Record<AttributionLayer, number>
    system_health_score: number
    recommendations?: string[]
  }
  error?: string
}
```

**成功回應範例**
```json
{
  "success": true,
  "data": {
    "total_types": 10,
    "active_types": 9,
    "layers_coverage": {
      "site-wide": 3,
      "target-oriented": 2,
      "category-specific": 3,
      "general": 1
    },
    "system_health_score": 85,
    "recommendations": [
      "建議在 general 層級增加更多活動類型",
      "考慮平衡各層級的活動類型數量"
    ]
  }
}
```

## 資料模型

### CampaignTypeConfig
```typescript
interface CampaignTypeConfig {
  type_code: string                    // 主鍵，活動類型代碼
  display_name_zh: string              // 中文顯示名稱
  display_name_en?: string             // 英文顯示名稱 (可選)
  attribution_layer: AttributionLayer  // 歸因層級
  default_weight: number               // 預設權重 (0.00-9.99)
  default_priority: number             // 預設優先級 (0-100)
  color_class?: string                 // CSS 顏色類別
  icon_name?: string                   // 圖示名稱
  description?: string                 // 活動類型描述
  is_active: boolean                   // 是否啟用
  created_at: string                   // 建立時間 (ISO 8601)
  updated_at: string                   // 更新時間 (ISO 8601)
}
```

### AttributionLayer
```typescript
type AttributionLayer = 
  | 'site-wide'        // 全站活動 - 最高優先級
  | 'target-oriented'  // 目標導向 - 高優先級
  | 'category-specific'// 品類專屬 - 中優先級
  | 'general'          // 一般活動 - 基礎優先級
```

### ApiResponse
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  count?: number      // 用於列表回應
  message?: string    // 用於操作確認
}
```

## 錯誤處理

### HTTP 狀態碼
| 狀態碼 | 描述 | 使用情況 |
|--------|------|----------|
| 200 | OK | 成功取得資料 |
| 201 | Created | 成功建立資源 |
| 400 | Bad Request | 請求參數錯誤 |
| 401 | Unauthorized | 未授權存取 |
| 404 | Not Found | 資源不存在 |
| 409 | Conflict | 資源衝突 (如重複的 type_code) |
| 422 | Unprocessable Entity | 業務邏輯驗證失敗 |
| 500 | Internal Server Error | 伺服器內部錯誤 |

### 錯誤回應格式
```typescript
interface ErrorResponse {
  success: false
  error: string
  error_code?: string
  details?: Record<string, any>
}
```

### 常見錯誤範例

#### 重複類型代碼
```json
{
  "success": false,
  "error": "活動類型代碼已存在",
  "error_code": "DUPLICATE_TYPE_CODE",
  "details": {
    "type_code": "flash_sale",
    "existing_config": {
      "display_name_zh": "限時搶購",
      "attribution_layer": "site-wide"
    }
  }
}
```

#### 無效歸因層級
```json
{
  "success": false,
  "error": "無效的歸因層級",
  "error_code": "INVALID_ATTRIBUTION_LAYER", 
  "details": {
    "provided_layer": "invalid_layer",
    "valid_layers": ["site-wide", "target-oriented", "category-specific", "general"]
  }
}
```

#### 權重範圍錯誤
```json
{
  "success": false,
  "error": "權重必須在 0.00 到 9.99 之間",
  "error_code": "INVALID_WEIGHT_RANGE",
  "details": {
    "provided_weight": 15.5,
    "valid_range": "0.00-9.99"
  }
}
```

## 使用範例

### JavaScript/TypeScript 客戶端

#### 基本使用
```typescript
import { getCampaignTypeService } from '@/api/services'

const campaignTypeService = getCampaignTypeService()

// 取得所有活動類型
const typesResponse = await campaignTypeService.getAllCampaignTypes()
if (typesResponse.success) {
  console.log('活動類型:', typesResponse.data)
}

// 取得分組類型
const groupsResponse = await campaignTypeService.getCampaignTypeGroups()
if (groupsResponse.success) {
  console.log('分組類型:', groupsResponse.data)
}

// 建立新類型
const newType = await campaignTypeService.createCampaignType({
  type_code: 'winter_sale',
  display_name_zh: '冬季特賣',
  attribution_layer: 'category-specific',
  default_weight: 1.5
})
```

#### Vue Composable 使用
```typescript
import { useCampaignTypes } from '@/composables/useCampaignTypes'

export default {
  setup() {
    const {
      campaignTypes,
      campaignTypeOptions,
      campaignTypesByLayer,
      loading,
      error,
      loadCampaignTypes,
      createCampaignType
    } = useCampaignTypes()

    // 載入類型資料
    onMounted(async () => {
      await loadCampaignTypes()
    })

    // 建立新類型
    const handleCreateType = async (typeData) => {
      const result = await createCampaignType(typeData)
      if (result) {
        console.log('建立成功:', result)
      }
    }

    return {
      campaignTypes,
      campaignTypeOptions,
      loading,
      error,
      handleCreateType
    }
  }
}
```

### cURL 範例

#### 取得所有類型
```bash
curl -X GET "https://api.yourdomain.com/campaign-types" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"
```

#### 建立新類型
```bash
curl -X POST "https://api.yourdomain.com/campaign-types" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type_code": "back_to_school",
    "display_name_zh": "開學季",
    "attribution_layer": "category-specific",
    "default_weight": 1.6,
    "default_priority": 65,
    "color_class": "bg-blue-100 text-blue-800"
  }'
```

## 效能考量

### 快取策略
- **客戶端快取**: 使用 Vue Query 或類似的狀態管理庫快取 API 回應
- **伺服器快取**: 實施 Redis 或記憶體快取減少資料庫查詢
- **CDN 快取**: 靜態配置資料可透過 CDN 快取

### 查詢優化
```sql
-- 建議的資料庫索引
CREATE INDEX idx_campaign_type_config_layer_active 
ON campaign_type_config(attribution_layer, is_active);

CREATE INDEX idx_campaign_type_config_priority 
ON campaign_type_config(default_priority DESC);
```

### 分頁和限制
```typescript
// 對於大量類型配置，支援分頁
interface PaginatedRequest {
  page?: number      // 頁碼，預設 1
  per_page?: number  // 每頁數量，預設 50，最大 200
  sort_by?: string   // 排序欄位
  sort_order?: 'asc' | 'desc'
}
```

## 安全考量

### 授權檢查
- 所有 API 端點需要有效的 Bearer Token
- 建立、更新、刪除操作需要管理員權限
- 讀取操作可開放給已驗證使用者

### 輸入驗證
```typescript
// 輸入清理和驗證
const validateTypeCode = (code: string): boolean => {
  return /^[a-z][a-z0-9_]*$/.test(code) && code.length <= 50
}

const validateWeight = (weight: number): boolean => {
  return weight >= 0 && weight <= 9.99
}

const validatePriority = (priority: number): boolean => {
  return Number.isInteger(priority) && priority >= 0 && priority <= 100
}
```

### SQL 注入防護
- 所有資料庫查詢使用參數化查詢
- 透過 Supabase RLS (Row Level Security) 實施存取控制
- 輸入資料進行清理和轉義

## 版本控制

### API 版本化
```http
# 使用 Accept header 指定版本
Accept: application/vnd.api+json;version=1.0

# 或使用 URL 路徑版本化
GET /api/v1/campaign-types
```

### 向下相容性
- 新增欄位採用可選設計，不破壞現有客戶端
- 廢棄功能提供充足的過渡期和警告
- 維護詳細的變更記錄和遷移指南

---

## 相關資源

- [活動類型管理系統架構](../architecture/campaign-type-management-system.md)
- [資料庫設計文檔](../database/CAMPAIGN_TYPE_CONFIG_SYSTEM.md)
- [開發指南](../../04-guides/dev-notes/CAMPAIGN_TYPE_CONFIG_DEVELOPMENT_GUIDE.md)

## 更新記錄

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| 1.0.0 | 2025-08-27 | 初始版本，完整 CRUD API |

---

*最後更新：2025-08-27*
*文檔版本：v1.0.0*