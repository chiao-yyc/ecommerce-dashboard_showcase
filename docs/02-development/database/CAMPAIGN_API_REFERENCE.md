# 活動系統 API 參考文件

## API 概述

本文件提供活動分析系統的完整 API 參考，包括所有函數、視圖、觸發器的詳細說明和使用範例。

## 目錄

- [核心函數 API](#核心函數-api)
- [分析視圖 API](#分析視圖-api)
- [管理函數 API](#管理函數-api)
- [觸發器機制](#觸發器機制)
- [資料類型定義](#資料類型定義)
- [錯誤代碼](#錯誤代碼)

## 核心函數 API

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

**回傳值**: JSONB 格式的歸因分析結果

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
  ],
  "layer_summary": {
    "site-wide": 0.80,
    "category-specific": 0.60
  }
}
```

**使用範例**:
```sql
-- 基本使用
SELECT jsonb_pretty(calculate_campaign_attributions('2025-03-08'));

-- 指定訂單金額
SELECT jsonb_pretty(calculate_campaign_attributions('2025-03-08', 1500.00));

-- 批量計算多日歸因
SELECT 
    date,
    jsonb_pretty(calculate_campaign_attributions(date)) as attribution
FROM generate_series('2025-03-01'::date, '2025-03-07'::date, '1 day') as date;
```

**歸因強度說明**:
- `dominant`: 正規化權重 ≥ 0.7
- `significant`: 正規化權重 ≥ 0.4
- `moderate`: 正規化權重 ≥ 0.2  
- `minor`: 正規化權重 < 0.2

---

### **compare_attribution_methods()**

**描述**: 比較傳統歸因與分層歸因方法的差異

**語法**:
```sql
compare_attribution_methods(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    comparison_metric TEXT,
    traditional_value NUMERIC,
    layered_value NUMERIC,
    difference_value NUMERIC,
    difference_percentage NUMERIC
)
```

**參數**:
- `start_date` (DATE, 可選): 比較開始日期，預設為 30 天前
- `end_date` (DATE, 可選): 比較結束日期，預設為今日

**使用範例**:
```sql
-- 使用預設時間範圍
SELECT * FROM compare_attribution_methods();

-- 指定時間範圍
SELECT * FROM compare_attribution_methods('2025-03-01', '2025-03-31');
```

**回傳範例**:
```
comparison_metric   | traditional_value | layered_value | difference_value | difference_percentage
--------------------|-------------------|---------------|------------------|----------------------
Total Revenue       | 157361.13         | 157361.13     | 0.00             | 0.00
Campaign Coverage   | 8.00              | 12.00         | 4.00             | 50.00
```

---

## 分析視圖 API

### **revenue_attribution_analysis**

**描述**: 核心營收歸因分析視圖

**結構**:
```sql
CREATE VIEW revenue_attribution_analysis AS ...
```

**欄位說明**:
| 欄位名稱 | 資料類型 | 描述 |
|---------|---------|------|
| `campaign_id` | UUID | 活動唯一識別碼 |
| `campaign_name` | TEXT | 活動名稱 |
| `campaign_type` | TEXT | 活動類型 |
| `attribution_layer` | TEXT | 歸因層級 |
| `influenced_orders` | BIGINT | 影響的訂單數量 |
| `total_attributed_revenue` | NUMERIC | 總歸因營收 |
| `avg_attributed_revenue` | NUMERIC | 平均歸因營收 |
| `avg_attribution_weight` | NUMERIC | 平均歸因權重 |
| `min_attribution_weight` | NUMERIC | 最小歸因權重 |
| `max_attribution_weight` | NUMERIC | 最大歸因權重 |
| `avg_concurrent_campaigns` | NUMERIC | 平均並發活動數 |
| `exclusive_orders` | BIGINT | 獨占訂單數 |
| `collaborative_orders` | BIGINT | 協作訂單數 |
| `dominant_attributions` | BIGINT | 主導歸因次數 |
| `significant_attributions` | BIGINT | 顯著歸因次數 |
| `moderate_attributions` | BIGINT | 中等歸因次數 |
| `minor_attributions` | BIGINT | 次要歸因次數 |

**使用範例**:
```sql
-- 基本查詢
SELECT * FROM revenue_attribution_analysis 
ORDER BY total_attributed_revenue DESC;

-- 按層級聚合
SELECT 
    attribution_layer,
    COUNT(*) as campaign_count,
    SUM(total_attributed_revenue) as layer_revenue
FROM revenue_attribution_analysis
GROUP BY attribution_layer;
```

---

### **campaign_collaboration_analysis**

**描述**: 活動協作效果分析視圖

**欄位說明**:
| 欄位名稱 | 資料類型 | 描述 |
|---------|---------|------|
| `concurrent_campaigns` | INTEGER | 並發活動數量 |
| `campaign_combination` | TEXT | 活動組合描述 |
| `involved_layers` | TEXT[] | 涉及的歸因層級 |
| `occurrence_count` | BIGINT | 發生次數 |
| `combination_revenue` | NUMERIC | 組合總營收 |
| `avg_order_value` | NUMERIC | 平均訂單價值 |
| `avg_distributed_revenue` | NUMERIC | 平均分配營收 |
| `revenue_share_pct` | NUMERIC | 營收占比百分比 |
| `collaboration_type` | TEXT | 協作類型 |

**協作類型**:
- `single_campaign`: 單一活動
- `dual_collaboration`: 雙活動協作
- `multi_collaboration`: 多活動協作

**使用範例**:
```sql
-- 查看協作效果排名
SELECT * FROM campaign_collaboration_analysis
WHERE concurrent_campaigns > 1
ORDER BY combination_revenue DESC;

-- 分析協作類型分佈
SELECT 
    collaboration_type,
    COUNT(*) as combination_count,
    SUM(combination_revenue) as total_revenue
FROM campaign_collaboration_analysis
GROUP BY collaboration_type;
```

---

### **campaign_overlap_calendar**

**描述**: 活動重疊日曆視圖

**欄位說明**:
| 欄位名稱 | 資料類型 | 描述 |
|---------|---------|------|
| `date` | DATE | 日期 |
| `concurrent_campaigns` | BIGINT | 當日並發活動數 |
| `campaigns_list` | TEXT | 活動清單（用 \| 分隔） |
| `active_layers` | TEXT[] | 活躍的歸因層級 |
| `campaign_types` | TEXT[] | 活動類型陣列 |
| `avg_attribution_weight` | NUMERIC | 平均歸因權重 |
| `is_holiday` | BOOLEAN | 是否為假期 |
| `is_weekend` | BOOLEAN | 是否為週末 |
| `holiday_name` | TEXT | 假期名稱 |
| `complexity_level` | TEXT | 複雜度等級 |
| `special_flags` | TEXT | 特殊標記 |

**複雜度等級**:
- `simple`: 單一活動或無活動
- `moderate`: 2個活動並行
- `complex`: 3個以上活動並行

**特殊標記**:
- `holiday_multi_campaign`: 假期多活動
- `weekend_multi_campaign`: 週末多活動
- `high_intensity`: 高強度（3+活動）
- `normal`: 正常

**使用範例**:
```sql
-- 查看指定月份的重疊情況
SELECT * FROM campaign_overlap_calendar
WHERE date BETWEEN '2025-03-01' AND '2025-03-31'
ORDER BY concurrent_campaigns DESC, date;

-- 統計複雜度分佈
SELECT 
    complexity_level,
    COUNT(*) as day_count,
    AVG(concurrent_campaigns) as avg_campaigns
FROM campaign_overlap_calendar
GROUP BY complexity_level;
```

---

### **holiday_impact_summary**

**描述**: 假期影響分析視圖

**欄位說明**:
| 欄位名稱 | 資料類型 | 描述 |
|---------|---------|------|
| `holiday_date` | DATE | 假期日期 |
| `holiday_name` | TEXT | 假期名稱 |
| `is_weekend` | BOOLEAN | 是否為週末假期 |
| `holiday_orders` | BIGINT | 假期訂單數 |
| `holiday_revenue` | NUMERIC | 假期營收 |
| `holiday_customers` | BIGINT | 假期客戶數 |
| `holiday_avg_order_value` | NUMERIC | 假期平均訂單價值 |
| `orders_multiplier` | NUMERIC | 訂單倍數（相對平日） |
| `revenue_multiplier` | NUMERIC | 營收倍數（相對平日） |
| `customers_multiplier` | NUMERIC | 客戶倍數（相對平日） |
| `holiday_type` | TEXT | 假期類型 |

**假期類型**:
- `weekend_holiday`: 週末假期
- `weekday_holiday`: 平日假期

**使用範例**:
```sql
-- 查看假期影響排名
SELECT * FROM holiday_impact_summary
ORDER BY revenue_multiplier DESC;

-- 比較週末與平日假期
SELECT 
    holiday_type,
    COUNT(*) as holiday_count,
    AVG(revenue_multiplier) as avg_revenue_multiplier
FROM holiday_impact_summary
GROUP BY holiday_type;
```

---

## 管理函數 API

### **假期管理函數**

#### **add_holiday()**

**描述**: 新增假期並自動同步到日期維度表

**語法**:
```sql
add_holiday(holiday_date DATE, holiday_name TEXT) RETURNS TEXT
```

**參數**:
- `holiday_date` (DATE, 必需): 假期日期
- `holiday_name` (TEXT, 必需): 假期名稱

**使用範例**:
```sql
SELECT add_holiday('2025-12-25', '聖誕節');
SELECT add_holiday('2025-01-01', '元旦');
```

#### **remove_holiday()**

**描述**: 移除假期並更新日期維度表

**語法**:
```sql
remove_holiday(holiday_date DATE) RETURNS TEXT
```

**使用範例**:
```sql
SELECT remove_holiday('2025-12-25');
```

#### **sync_all_existing_holidays()**

**描述**: 同步所有現有假期到日期維度表

**語法**:
```sql
sync_all_existing_holidays() RETURNS TEXT
```

**使用範例**:
```sql
SELECT sync_all_existing_holidays();
```

### **資料完整性檢查函數**

#### **check_holiday_data_integrity()**

**描述**: 檢查假期資料的完整性

**語法**:
```sql
check_holiday_data_integrity() RETURNS TABLE(
    check_type TEXT,
    issue_count INTEGER,
    description TEXT,
    sample_dates DATE[]
)
```

**檢查類型**:
- `MISSING_HOLIDAY_FLAG`: holidays 表中的假期在 dim_date 中未標記
- `ORPHANED_HOLIDAY_FLAG`: dim_date 中標記為假期但不在 holidays 表中
- `DUPLICATE_HOLIDAYS`: holidays 表中有重複的日期

**使用範例**:
```sql
SELECT * FROM check_holiday_data_integrity();
```

#### **check_attribution_quality()**

**描述**: 檢查歸因計算的品質

**語法**:
```sql
check_attribution_quality() RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    value NUMERIC,
    description TEXT
)
```

**檢查項目**:
- `Revenue Balance`: 營收平衡檢查
- `Weight Distribution`: 權重分佈檢查

**狀態值**:
- `PASS`: 檢查通過
- `WARNING`: 警告
- `FAIL`: 檢查失敗
- `INFO`: 資訊性結果

**使用範例**:
```sql
SELECT * FROM check_attribution_quality();
```

#### **check_campaign_system_health()**

**描述**: 系統整體健康狀態檢查

**語法**:
```sql
check_campaign_system_health() RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
)
```

**使用範例**:
```sql
SELECT * FROM check_campaign_system_health();
```

### **活動管理函數**

#### **get_active_campaigns_for_date()**

**描述**: 取得指定日期的活躍活動

**語法**:
```sql
get_active_campaigns_for_date(target_date DATE) RETURNS TABLE(
    campaign_id UUID,
    campaign_name TEXT,
    campaign_type TEXT,
    start_date DATE,
    end_date DATE
)
```

**使用範例**:
```sql
SELECT * FROM get_active_campaigns_for_date('2025-03-08');
```

#### **check_campaign_overlaps()**

**描述**: 檢查活動期間重疊

**語法**:
```sql
check_campaign_overlaps(
    campaign_start DATE,
    campaign_end DATE,
    exclude_campaign_id UUID DEFAULT NULL
) RETURNS TABLE(
    overlapping_campaign_id UUID,
    overlapping_campaign_name TEXT,
    overlap_start DATE,
    overlap_end DATE
)
```

**使用範例**:
```sql
-- 檢查新活動與現有活動的重疊
SELECT * FROM check_campaign_overlaps('2025-03-01', '2025-03-15');

-- 檢查時排除特定活動
SELECT * FROM check_campaign_overlaps(
    '2025-03-01', '2025-03-15', 
    '03255639-e4ad-492a-9fb5-185bb401ae22'::UUID
);
```

---

## ⚡ 觸發器機制

### **trigger_sync_holidays**

**描述**: 假期資料自動同步觸發器

**觸發條件**: `holidays` 表的 INSERT, UPDATE, DELETE 操作

**執行函數**: `sync_holiday_to_dim_date()`

**行為**:
- **INSERT/UPDATE**: 在 `dim_date` 中標記 `is_holiday = TRUE`
- **DELETE**: 移除假期標記 `is_holiday = FALSE`
- **自動建立**: 不存在的日期自動插入 `dim_date`

### **update_campaign_in_dim_date_v2_trigger**

**描述**: 活動資料自動同步觸發器

**觸發條件**: `campaigns` 表的 INSERT, UPDATE, DELETE 操作

**執行函數**: `update_campaign_in_dim_date_v2()`

**行為**:
- **INSERT/UPDATE**: 建立活動期間的所有日期記錄，設定 `campaign_id`
- **DELETE**: 移除已刪除活動的關聯
- **假期整合**: 自動檢查並標記假期狀態

---

## 資料類型定義

### **活動類型 (campaign_type)**

| 類型 | 描述 | 預設權重 | 歸因層級 |
|------|------|----------|----------|
| `flash_sale` | 限時閃購 | 0.9 | site-wide |
| `seasonal` | 季節性活動 | 0.8 | site-wide |
| `holiday` | 假期活動 | 0.7 | site-wide |
| `anniversary` | 週年慶 | 0.6 | site-wide |
| `product_launch` | 新品發布 | 0.6 | category-specific |
| `membership` | 會員活動 | 0.5 | target-oriented |
| `category` | 品類活動 | 0.4 | category-specific |
| `lifestyle` | 生活方式 | 0.4 | category-specific |
| `demographic` | 人群活動 | 0.3 | target-oriented |

### **歸因層級 (attribution_layer)**

| 層級 | 描述 | 權重計算 |
|------|------|----------|
| `site-wide` | 全站影響活動 | 層級內正規化 |
| `target-oriented` | 目標導向活動 | 層級內正規化 |
| `category-specific` | 品類專屬活動 | 層級內正規化 |
| `general` | 一般活動 | 預設層級 |

---

## ❌ 錯誤代碼

### **函數執行錯誤**

| 錯誤代碼 | 描述 | 解決方案 |
|----------|------|----------|
| `22003` | 數值超出範圍 | 檢查日期和數值參數 |
| `22007` | 無效日期格式 | 使用正確的日期格式 'YYYY-MM-DD' |
| `23505` | 唯一約束違反 | 檢查重複的假期日期 |
| `23503` | 外鍵約束違反 | 確保引用的活動存在 |

### **常見 SQL 錯誤**

```sql
-- 錯誤: 日期格式不正確
SELECT calculate_campaign_attributions('2025/03/08');
-- 正確: 使用標準日期格式
SELECT calculate_campaign_attributions('2025-03-08');

-- 錯誤: NULL 日期參數
SELECT add_holiday(NULL, '測試假期');
-- 正確: 提供有效日期
SELECT add_holiday('2025-03-08', '測試假期');
```

---

## 相關資源

- **[技術架構文件](./CAMPAIGN_DIMENSION_ARCHITECTURE.md)**: 深入了解系統設計
- **[維護指南](./CAMPAIGN_MAINTENANCE_GUIDE.md)**: 系統維護和故障排除
- **[使用者手冊](./CAMPAIGN_USER_MANUAL.md)**: 業務人員操作指南

---

**API 版本**: v1.0  
**最後更新**: 2025-07-24  
**相容性**: PostgreSQL 14+, Supabase