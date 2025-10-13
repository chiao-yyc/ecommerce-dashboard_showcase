# Campaign API 參考文檔

## API 概述

本文檔提供 Campaign 管理系統的完整 API 參考，包括 REST API 端點、資料庫函數、分析視圖等的詳細說明和使用範例。

## 目錄

- [REST API 端點](#rest-api-端點)
- [資料庫函數 API](#資料庫函數-api)
- [分析視圖 API](#分析視圖-api)
- [資料類型定義](#資料類型定義)
- [錯誤處理](#錯誤處理)

## REST API 端點

### 基礎 CRUD 操作

#### **GET /api/campaigns**
獲取活動列表

**查詢參數**:
- `page` (number): 頁碼，預設 1
- `limit` (number): 每頁數量，預設 20
- `status` (string): 篩選狀態
- `search` (string): 搜尋關鍵字
- `start_date` (string): 開始日期篩選
- `end_date` (string): 結束日期篩選

**回應範例**:
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "uuid",
        "name": "春季新品促銷",
        "status": "active",
        "start_date": "2025-03-01",
        "end_date": "2025-03-15",
        "budget": 50000,
        "created_at": "2025-02-15T09:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 98,
      "per_page": 20
    }
  }
}
```

#### **POST /api/campaigns**
創建新活動

**請求體**:
```json
{
  "name": "夏季清倉大促",
  "description": "夏季商品清倉活動",
  "start_date": "2025-06-01",
  "end_date": "2025-06-30",
  "budget": 100000,
  "target_audience": "所有用戶",
  "campaign_type": "promotion"
}
```

#### **GET /api/campaigns/:id**
獲取單個活動詳情

**回應範例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "春季新品促銷",
    "description": "春季新品上市促銷活動",
    "status": "active",
    "start_date": "2025-03-01",
    "end_date": "2025-03-15",
    "budget": 50000,
    "attribution_layer": "category-specific",
    "priority_score": 75,
    "attribution_weight": 0.8,
    "created_at": "2025-02-15T09:00:00Z",
    "updated_at": "2025-02-20T14:30:00Z"
  }
}
```

#### **PUT /api/campaigns/:id**
更新活動資訊

**請求體**:
```json
{
  "name": "春季新品促銷 (更新版)",
  "description": "更新的活動描述",
  "budget": 60000,
  "status": "paused"
}
```

#### **DELETE /api/campaigns/:id**
刪除活動

### 批量操作

#### **POST /api/campaigns/batch**
批量操作活動

**請求體**:
```json
{
  "action": "update_status",
  "campaign_ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "status": "paused"
  }
}
```

#### **PUT /api/campaigns/bulk-status**
批量狀態更新

**請求體**:
```json
{
  "campaign_ids": ["uuid1", "uuid2"],
  "status": "active"
}
```

### 分析端點

#### **GET /api/campaigns/stats**
獲取活動統計資料

**回應範例**:
```json
{
  "success": true,
  "data": {
    "total_campaigns": 156,
    "active_campaigns": 12,
    "draft_campaigns": 8,
    "completed_campaigns": 134,
    "total_budget": 2500000,
    "active_budget": 450000
  }
}
```

#### **GET /api/campaigns/:id/metrics**
獲取活動效果指標

**回應範例**:
```json
{
  "success": true,
  "data": {
    "campaign_id": "uuid",
    "metrics": {
      "attributed_revenue": 125000,
      "attribution_days": 15,
      "avg_daily_revenue": 8333.33,
      "collaboration_campaigns": 2,
      "competition_intensity": "medium"
    },
    "daily_attribution": [
      {
        "date": "2025-03-01",
        "attributed_amount": 8500,
        "attribution_percentage": 65.5
      }
    ]
  }
}
```

## 資料庫函數 API

### **calculate_campaign_attributions()**

**描述**: 計算指定日期的活動歸因分析

**語法**:
```sql
calculate_campaign_attributions(
    target_date DATE,
    order_amount NUMERIC DEFAULT NULL
) RETURNS JSONB
```

**參數**:
- `target_date` (DATE, 必需): 要分析的目標日期
- `order_amount` (NUMERIC, 可選): 特定訂單金額，用於權重計算參考

**回傳結構**:
```json
{
  "attribution_date": "2025-03-08",
  "total_active_campaigns": 2,
  "active_layers": ["site-wide", "category-specific"],
  "attributions": [
    {
      "campaign_id": "uuid",
      "campaign_name": "春季新品上市",
      "campaign_type": "product_launch",
      "attribution_layer": "category-specific",
      "raw_weight": 0.60,
      "normalized_weight": 1.0000,
      "attribution_strength": "dominant",
      "period_start": "2025-03-01",
      "period_end": "2025-03-15"
    }
  ]
}
```

**使用範例**:
```sql
-- 基本使用
SELECT jsonb_pretty(calculate_campaign_attributions('2025-03-08'));

-- 指定訂單金額
SELECT jsonb_pretty(calculate_campaign_attributions('2025-03-08', 1500.00));
```

## 📈 分析視圖 API

### **revenue_attribution_analysis**

**描述**: 營收歸因分析視圖

**欄位說明**:
- `campaign_id`: 活動 ID
- `campaign_name`: 活動名稱
- `attribution_layer`: 歸因層級
- `analysis_date`: 分析日期
- `active_days`: 活動天數
- `total_attributed_revenue`: 總歸因營收
- `avg_attribution_weight`: 平均歸因權重

**使用範例**:
```sql
-- 查看最近30天的營收歸因
SELECT *
FROM revenue_attribution_analysis
WHERE analysis_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY total_attributed_revenue DESC;
```

### **campaign_collaboration_analysis**

**描述**: 活動協作分析視圖

**使用範例**:
```sql
-- 查看活動重疊情況
SELECT
    campaign_1_name,
    campaign_2_name,
    overlap_days,
    first_overlap_date,
    last_overlap_date
FROM campaign_collaboration_analysis
WHERE overlap_days > 5
ORDER BY overlap_days DESC;
```

### **campaign_overlap_calendar**

**描述**: 重疊日曆視圖

**使用範例**:
```sql
-- 查看高競爭強度的日期
SELECT
    date,
    active_campaign_count,
    active_campaigns,
    competition_intensity
FROM campaign_overlap_calendar
WHERE competition_intensity = 'high'
ORDER BY date;
```

## 資料類型定義

### Campaign Status
```typescript
enum CampaignStatus {
  DRAFT = 'draft',           // 草稿
  ACTIVE = 'active',         // 進行中
  PAUSED = 'paused',         // 暫停
  COMPLETED = 'completed',   // 已完成
  CANCELLED = 'cancelled'    // 已取消
}
```

### Attribution Layer
```typescript
enum AttributionLayer {
  SITE_WIDE = 'site-wide',           // 全站級活動
  TARGET_ORIENTED = 'target-oriented', // 定向活動
  CATEGORY_SPECIFIC = 'category-specific' // 類別特定活動
}
```

### Competition Intensity
```typescript
enum CompetitionIntensity {
  LOW = 'low',      // 1個活動
  MEDIUM = 'medium', // 2-3個活動
  HIGH = 'high'     // 4+個活動
}
```

## API 服務層使用

### CampaignApiService 使用範例

```typescript
import { defaultServiceFactory } from '@/api/services'

const campaignService = defaultServiceFactory.getCampaignService()

// 獲取活動列表
const campaigns = await campaignService.getAll({
  status: 'active',
  page: 1,
  limit: 20
})

// 創建新活動
const newCampaign = await campaignService.create({
  name: '新活動',
  start_date: '2025-04-01',
  end_date: '2025-04-30',
  budget: 50000
})

// 批量更新狀態
const result = await campaignService.bulkUpdateStatus(
  ['uuid1', 'uuid2'],
  'paused'
)
```

## ❌ 錯誤處理

### HTTP 狀態碼
- `200`: 成功
- `201`: 創建成功
- `400`: 請求參數錯誤
- `401`: 未授權
- `403`: 權限不足
- `404`: 資源不存在
- `422`: 資料驗證失敗
- `500`: 伺服器內部錯誤

### 錯誤回應格式
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "活動開始日期不能晚於結束日期",
    "details": {
      "field": "start_date",
      "value": "2025-04-30",
      "constraint": "must_be_before_end_date"
    }
  }
}
```

### 常見錯誤代碼
- `VALIDATION_ERROR`: 資料驗證錯誤
- `CAMPAIGN_NOT_FOUND`: 活動不存在
- `INVALID_DATE_RANGE`: 無效的日期範圍
- `ATTRIBUTION_WEIGHT_EXCEEDED`: 歸因權重超限
- `CAMPAIGN_OVERLAP_CONFLICT`: 活動重疊衝突