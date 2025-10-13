# 活動資料庫優化文件

## 概述

本文件詳細說明了針對 `campaigns`、`dim_date`、`events`、`holidays` 四個核心資料表的關係重構和優化工作。本次優化解決了資料完整性問題、提升了查詢效能，並建立了更強大的分析能力。

## 問題診斷

### 原始架構問題

#### 1. **資料完整性問題**
- `dim_date` 表缺乏與 `holidays` 表的正式外鍵約束
- `campaigns` 與 `dim_date` 之間僅通過 `campaign_name` 文字欄位關聯，容易產生資料不一致
- `events` 表與活動系統完全隔離，無法進行活動效果分析

#### 2. **效能問題**
- 缺乏關鍵索引，導致複雜查詢效能低下
- 觸發器邏輯簡單，每次更新活動都需要全表掃描
- 分析視圖過於複雜，缺乏最佳化

#### 3. **資料冗餘問題**
- `campaign_name` 同時存在於 `campaigns` 和 `dim_date` 表中
- 沒有自動化機制同步假期資料到日期維度表

## 優化方案

### 第一階段：資料模型重構

#### 1. **建立正確的關聯關係**

```sql
-- 新增 campaign_id 到 dim_date 表
ALTER TABLE public.dim_date ADD COLUMN campaign_id UUID;
ALTER TABLE public.dim_date ADD CONSTRAINT fk_dim_date_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);

-- 新增 campaign_id 到 events 表
ALTER TABLE public.events ADD COLUMN campaign_id UUID;
ALTER TABLE public.events ADD CONSTRAINT fk_events_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);
```

#### 2. **效能索引優化**

```sql
-- 活動表效能索引
CREATE INDEX idx_campaigns_date_range ON public.campaigns (start_date, end_date);
CREATE INDEX idx_campaigns_type ON public.campaigns (campaign_type);

-- 事件表效能索引
CREATE INDEX idx_events_created_at ON public.events (created_at);
CREATE INDEX idx_events_type ON public.events (type);
CREATE INDEX idx_events_user_created ON public.events (user_id, created_at);
```

### 第二階段：自動化同步機制

#### 1. **假期同步觸發器**

建立自動化假期同步機制，確保 `dim_date` 表中的 `is_holiday` 欄位與 `holidays` 表保持同步：

```sql
CREATE OR REPLACE FUNCTION sync_holidays_to_dim_date() RETURNS TRIGGER AS $$
BEGIN
    -- 自動更新或插入假期資訊到日期維度表
    -- 詳細邏輯見遷移檔案
END;
$$ LANGUAGE plpgsql;
```

#### 2. **改良的活動觸發器**

優化活動觸發器，支援更複雜的業務邏輯：

```sql
CREATE OR REPLACE FUNCTION update_campaign_in_dim_date_v2() RETURNS TRIGGER AS $$
BEGIN
    -- 支援活動新增、更新、刪除的完整邏輯
    -- 自動生成缺失的日期記錄
    -- 處理假期和週末標記
END;
$$ LANGUAGE plpgsql;
```

### 第三階段：分析能力增強

#### 1. **核心分析視圖**

建立了以下關鍵分析視圖：

- **`campaign_performance_enhanced`**: 活動效果綜合分析
- **`campaign_event_analysis`**: 活動與事件整合分析
- **`holiday_impact_analysis`**: 假期影響評估
- **`campaign_funnel_analysis`**: 活動轉換漏斗分析
- **`daily_performance_timeline`**: 日績效時間軸
- **`campaign_comparison_matrix`**: 活動效果比較矩陣

#### 2. **實用管理函數**

```sql
-- 查詢特定日期的活動
SELECT * FROM get_active_campaigns_for_date('2025-07-23');

-- 檢查活動期間重疊
SELECT * FROM check_campaign_overlaps('2025-07-01', '2025-07-31');

-- 系統健康檢查
SELECT * FROM check_campaign_system_health();

-- 生成每日摘要報告
SELECT * FROM generate_campaign_summary_report();
```

## 資料表關係圖

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  campaigns  │────│  dim_date   │────│  holidays   │
│             │    │             │    │             │
│ id (PK)     │    │ date (PK)   │    │ date (PK)   │
│ name        │    │ campaign_id │    │ name        │
│ start_date  │    │ is_holiday  │    └─────────────┘
│ end_date    │    │ is_weekend  │
│ type        │    └─────────────┘
└─────────────┘           │
       │                  │
       │    ┌─────────────┐│
       └────│   events    ││
            │             ││
            │ id (PK)     ││
            │ type        ││
            │ user_id     ││
            │ campaign_id ││
            │ created_at  ││
            └─────────────┘│
                          │
            ┌─────────────┐│
            │funnel_events││
            │             ││
            │ id (PK)     ││  
            │ step        ││
            │ user_id     ││
            │ campaign_id ││
            │ event_at    ││
            └─────────────┘
```

## 使用指南

### 基本查詢範例

#### 1. **查看活動效果分析**

```sql
-- 查看所有活動的綜合效果分析
SELECT 
    campaign_name,
    campaign_type,
    total_orders,
    total_revenue,
    conversion_rate_pct,
    daily_avg_revenue
FROM campaign_performance_enhanced
ORDER BY total_revenue DESC;
```

#### 2. **分析假期對業績的影響**

```sql
-- 查看假期影響分析
SELECT 
    holiday_name,
    holiday_date,
    holiday_revenue,
    revenue_impact_multiplier,
    active_campaigns
FROM holiday_impact_analysis
WHERE holiday_date >= '2025-01-01'
ORDER BY revenue_impact_multiplier DESC;
```

#### 3. **追蹤活動轉換漏斗**

```sql
-- 查看特定活動的轉換漏斗
SELECT 
    step,
    unique_users,
    conversion_rate_from_start,
    step_conversion_rate,
    avg_step_duration_minutes
FROM campaign_funnel_analysis
WHERE campaign_name = '新年大促銷'
ORDER BY 
    CASE step
        WHEN 'page_view' THEN 1
        WHEN 'product_view' THEN 2
        WHEN 'add_to_cart' THEN 3
        WHEN 'checkout_start' THEN 4
        WHEN 'order_complete' THEN 5
        ELSE 99
    END;
```

#### 4. **每日績效監控**

```sql
-- 查看最近7天的每日績效
SELECT 
    date,
    campaign_name,
    daily_revenue,
    daily_orders,
    revenue_7day_avg,
    revenue_deviation_from_7day_avg,
    is_holiday,
    is_weekend
FROM daily_performance_timeline
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### 進階分析範例

#### 1. **活動重疊分析**

```sql
-- 分析活動期間重疊情況
SELECT 
    c1.campaign_name as campaign_1,
    c2.campaign_name as campaign_2,
    GREATEST(c1.start_date, c2.start_date) as overlap_start,
    LEAST(c1.end_date, c2.end_date) as overlap_end,
    LEAST(c1.end_date, c2.end_date) - GREATEST(c1.start_date, c2.start_date) + 1 as overlap_days
FROM campaigns c1
JOIN campaigns c2 ON c1.id < c2.id
WHERE c1.start_date <= c2.end_date 
AND c1.end_date >= c2.start_date
ORDER BY overlap_days DESC;
```

#### 2. **用戶行為分析**

```sql
-- 分析活動期間用戶行為變化
SELECT 
    campaign_name,
    event_type,
    SUM(event_count) as total_events,
    AVG(user_engagement_ratio) as avg_engagement,
    COUNT(DISTINCT event_date) as active_days
FROM campaign_event_analysis
WHERE campaign_id IS NOT NULL
GROUP BY campaign_name, event_type
ORDER BY campaign_name, total_events DESC;
```

## 效能最佳化建議

### 1. **查詢最佳化**

- 使用適當的索引提升查詢效能
- 避免在大型結果集上使用複雜的窗口函數
- 考慮使用物化視圖快取複雜的分析結果

### 2. **資料維護**

- 定期執行 `check_campaign_system_health()` 檢查系統健康狀態
- 使用 `sync_existing_holidays()` 同步假期資料
- 定期清理過時的資料和日誌

### 3. **監控指標**

建議監控以下關鍵指標：

- 每日活動數量變化
- 假期期間業績波動
- 轉換漏斗各階段轉換率
- 資料完整性檢查結果

## 遷移檢查清單

### 部署前檢查

- [ ] 確認所有相關表格存在
- [ ] 檢查外鍵約束相容性
- [ ] 驗證索引建立權限
- [ ] 測試觸發器邏輯

### 部署後驗證

- [ ] 執行 `SELECT * FROM check_campaign_system_health()`
- [ ] 測試新的分析視圖查詢
- [ ] 驗證觸發器自動執行
- [ ] 檢查資料遷移完整性

### 回滾方案

如需回滾，可執行以下步驟：

1. 恢復 `dim_date_backup` 表資料
2. 移除新增的外鍵約束
3. 刪除新增的索引
4. 恢復原始觸發器

## 維護與支援

### 常見問題

**Q: 活動期間重疊會影響分析結果嗎？**
A: 重疊期間的資料會分別計入各個活動，可使用 `check_campaign_overlaps()` 函數監控重疊情況。

**Q: 如何新增自訂的漏斗步驟？**
A: 在 `funnel_events` 表中插入新的 step 值，系統會自動在分析視圖中顯示。

**Q: 假期資料更新後需要手動同步嗎？**
A: 不需要，觸發器會自動同步。也可執行 `sync_existing_holidays()` 手動同步。

### 技術支援

如遇到問題，請提供以下資訊：

1. 錯誤訊息完整內容
2. 相關查詢SQL語句  
3. `check_campaign_system_health()` 的執行結果
4. 問題發生的時間範圍

---

**文件版本**: 1.0  
**最後更新**: 2025-07-23  
**維護人員**: Database Team