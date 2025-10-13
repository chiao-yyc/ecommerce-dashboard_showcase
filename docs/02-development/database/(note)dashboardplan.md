以終為始的方法規劃出應該有的分析圖表，從多個實務角度，寫出簡潔精簡的「最終想得到的資訊」，再一步一步往分析、資料面回推

==============================================================

# 以終為始：電商分析圖表規劃

## 1. 電商老闆視角

**最終想知道的核心問題：**
- 生意整體健康度如何？成長趨勢？
- 哪些客戶群最賺錢？投資回報如何？
- 營運效率在哪裡？瓶頸在哪？

**所需圖表 ← 分析邏輯 ← 資料需求：**

```
營收成長儀表板
├── 月營收趨勢線 ← 時間序列分析 ← 訂單金額+日期
├── 客戶價值金字塔 ← 客戶分層分析 ← LTV計算
└── ROI散佈圖 ← 投入產出比 ← 廣告費用+獲客成本

客戶資產健康度
├── RFM分群餅圖 ← 客戶行為分群 ← 交易頻率+金額+時間
├── 客戶流轉矩陣 ← 群體移動分析 ← 歷史分群資料
└── 流失預警清單 ← 風險評估模型 ← 行為特徵+預測算法
```

## 2. 行銷總監視角

**最終想知道的核心問題：**
- 哪個渠道獲客效果最好？成本最低？
- 不同客戶群需要什麼行銷策略？
- 行銷活動實際效果如何？

**所需圖表規劃：**

```
獲客效果儀表板
├── 渠道ROI排行榜 ← CAC vs LTV分析 ← 渠道成本+客戶價值
├── 漏斗轉換圖 ← 轉換路徑分析 ← 各階段轉換率
└── 同期群組留存圖 ← 留存率分析 ← 註冊日期+活躍紀錄

行銷策略地圖
├── 客戶旅程熱力圖 ← 行為路徑分析 ← 點擊+瀏覽+購買行為
├── 個人化效果對比 ← A/B測試結果 ← 實驗組+對照組數據
└── 預算分配建議圖 ← 邊際效應分析 ← 投入+產出+彈性係數
```

## 3. 銷售經理視角

**最終想知道的核心問題：**
- 哪些產品賣得好？庫存怎麼配？
- 銷售趨勢預測？下季準備什麼？
- 不同客戶群喜歡什麼產品？

**所需圖表規劃：**

```
銷售業績儀表板
├── 產品銷量排行 ← 商品表現分析 ← 銷量+營收+毛利
├── 銷售預測曲線 ← 時間序列預測 ← 歷史銷售+季節性
└── 地區業績熱力圖 ← 地理分佈分析 ← 地區+銷售額

產品策略矩陣
├── 商品生命週期圖 ← 產品階段分析 ← 上市時間+銷量變化
├── 交叉銷售網絡圖 ← 關聯規則挖掘 ← 購物籃分析
└── 價格敏感度圖 ← 需求彈性分析 ← 價格+銷量關係
```

## 4. 客服主管視角

**最終想知道的核心問題：**
- 客戶滿意度趨勢？哪裡需要改善？
- 哪些問題最常發生？如何預防？
- 服務效率如何？人力配置對嗎？

**所需圖表規劃：**

```
客戶體驗儀表板
├── NPS趨勢線 ← 滿意度變化分析 ← 客戶評分+時間
├── 問題分類樹狀圖 ← 服務需求分析 ← 工單分類+頻率
└── 解決時效分佈圖 ← 服務效率分析 ← 處理時間+複雜度

服務優化地圖
├── 客訴熱點分析 ← 問題聚類分析 ← 投訴內容+產品+流程
├── 服務負荷預測 ← 工作量預測 ← 歷史工單+季節性
└── 客戶情緒溫度計 ← 情感分析 ← 文本挖掘+情感分數
```

## 5. 營運總監視角

**最終想知道的核心問題：**
- 整體營運效率如何？哪裡卡住了？
- 成本結構合理嗎？哪裡能優化？
- 風險在哪？如何提前防範？

**所需圖表規劃：**

```
營運效率儀表板
├── 關鍵指標雷達圖 ← 多維度績效評估 ← KPI整合+標準化
├── 成本結構圓餅圖 ← 成本構成分析 ← 各項費用+佔比
└── 異常監控警示燈 ← 異常檢測分析 ← 統計過程控制

風險管控中心
├── 現金流預測圖 ← 現金流分析 ← 收支+週期+預測
├── 庫存周轉率圖 ← 庫存管理分析 ← 進銷存+周轉率
└── 供應鏈風險圖 ← 供應鏈評估 ← 供應商+交期+品質
```

## 6. 財務主管視角

**最終想知道的核心問題：**
- 財務健康度如何？現金流穩定嗎？
- 投資回報率達標嗎？哪裡最有效？
- 成本控制效果如何？預算執行狀況？

**所需圖表規劃：**

```
財務健康儀表板
├── 三大報表趨勢 ← 財務狀況分析 ← 資產負債+損益+現金流
├── 毛利率走勢圖 ← 獲利能力分析 ← 收入+成本+毛利
└── 投資回報矩陣 ← ROI分析 ← 投資額+回報+時間

預算控制中心
├── 預算執行進度條 ← 預算執行分析 ← 預算+實際+差異
├── 成本分解瀑布圖 ← 成本結構分析 ← 固定+變動+直接+間接成本
└── 財務風險警示板 ← 風險評估 ← 財務比率+預警指標
```

## 實施優先級建議

**Phase 1 - 基礎建設（1-2個月）**
- 電商老闆的營收成長儀表板
- 銷售經理的銷售業績儀表板  
- 基礎的RFM客戶分群分析

**Phase 2 - 深化分析（2-3個月）**
- 行銷總監的獲客效果分析
- 客服主管的客戶體驗分析
- 客戶流轉矩陣和預測模型

**Phase 3 - 進階應用（3-6個月）**
- 營運和財務的綜合分析
- 預測性分析和風險管控
- 跨部門整合儀表板

這樣的規劃確保每個角色都能快速獲得最關鍵的洞察，同時為企業建立完整的數據驅動決策體系。

==============================================================

# 電商老闆視角：完整分析架構

## 核心關注點
**「我的生意整體健康嗎？錢從哪來？往哪去？未來會如何？」**

---

## 圖表1：營收成長儀表板

### 1.1 月營收趨勢線圖

**最終目標：**
- 一眼看出生意是在成長、停滯還是衰退
- 識別季節性規律和異常波動
- 評估成長率是否達到預期

**分析邏輯：**
```
營收趨勢 = f(時間序列分析)
├── 基礎趨勢：移除季節性的潛在成長
├── 季節性模式：找出週期性規律
├── 同比/環比：與去年同期或上月比較
└── 成長率計算：(本期-上期)/上期 × 100%
```

**必要資料欄位：**
```sql
-- 主要資料表：orders
order_id          VARCHAR(50)    -- 訂單編號
customer_id       VARCHAR(50)    -- 客戶ID  
order_date        DATE           -- 訂單日期
order_amount      DECIMAL(10,2)  -- 訂單金額
order_status      VARCHAR(20)    -- 訂單狀態(completed/cancelled/refunded)
created_at        TIMESTAMP      -- 建立時間
```

**衍生計算欄位：**
```sql
-- 月度營收彙總表
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    SUM(CASE WHEN order_status = 'completed' THEN order_amount ELSE 0 END) as monthly_revenue,
    COUNT(CASE WHEN order_status = 'completed' THEN order_id ELSE NULL END) as monthly_orders,
    AVG(CASE WHEN order_status = 'completed' THEN order_amount ELSE NULL END) as avg_order_value
FROM orders
GROUP BY month
ORDER BY month;
```

### 1.2 關鍵指標卡片組

**最終目標：**
- 快速掌握當前業務核心數字
- 與上期對比，立即知道好壞

**分析邏輯：**
```
KPI監控 = 當期數值 + 對比基準 + 變化幅度
├── 本月營收 vs 上月營收 (環比)
├── 本月營收 vs 去年同月 (同比)  
├── 累計營收 vs 年度目標 (完成率)
└── 關鍵趨勢指標 (成長率/加速度)
```

**必要資料欄位：**
```sql
-- 績效目標表：targets
year              INT            -- 年度
month             INT            -- 月份  
revenue_target    DECIMAL(12,2)  -- 營收目標
orders_target     INT            -- 訂單目標
customer_target   INT            -- 客戶目標

-- KPI計算邏輯
WITH monthly_performance AS (
    SELECT 
        YEAR(order_date) as year,
        MONTH(order_date) as month,
        SUM(order_amount) as actual_revenue,
        COUNT(DISTINCT order_id) as actual_orders,
        COUNT(DISTINCT customer_id) as actual_customers
    FROM orders 
    WHERE order_status = 'completed'
    GROUP BY YEAR(order_date), MONTH(order_date)
)
SELECT 
    p.*,
    t.revenue_target,
    ROUND((p.actual_revenue / t.revenue_target) * 100, 1) as target_completion_rate,
    LAG(p.actual_revenue) OVER (ORDER BY p.year, p.month) as prev_month_revenue,
    ROUND(((p.actual_revenue - LAG(p.actual_revenue) OVER (ORDER BY p.year, p.month)) / 
           LAG(p.actual_revenue) OVER (ORDER BY p.year, p.month)) * 100, 1) as mom_growth_rate
FROM monthly_performance p
LEFT JOIN targets t ON p.year = t.year AND p.month = t.month;
```

---

## 圖表2：客戶價值金字塔

### 2.1 客戶分層金字塔圖

**最終目標：**
- 看清楚客戶結構：誰是大客戶？佔多少營收？
- 評估客戶健康度：是否過度依賴少數大客戶？

**分析邏輯：**
```
客戶價值分層 = 基於消費金額的客戶分群
├── VIP客戶 (Top 5%): 貢獻營收佔比
├── 重要客戶 (5-20%): 核心客戶群  
├── 一般客戶 (20-80%): 主要客戶群
└── 新客戶 (Bottom 20%): 潛力客戶群
```

**必要資料欄位：**
```sql
-- 客戶消費彙總表
WITH customer_value AS (
    SELECT 
        customer_id,
        COUNT(DISTINCT order_id) as total_orders,
        SUM(order_amount) as total_spent,
        AVG(order_amount) as avg_order_value,
        MIN(order_date) as first_order_date,
        MAX(order_date) as last_order_date,
        DATEDIFF(CURRENT_DATE, MAX(order_date)) as days_since_last_order
    FROM orders 
    WHERE order_status = 'completed'
    GROUP BY customer_id
),
customer_segments AS (
    SELECT 
        *,
        CASE 
            WHEN total_spent >= (SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_spent) FROM customer_value) 
                THEN 'VIP'
            WHEN total_spent >= (SELECT PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY total_spent) FROM customer_value) 
                THEN 'Premium'  
            WHEN total_spent >= (SELECT PERCENTILE_CONT(0.20) WITHIN GROUP (ORDER BY total_spent) FROM customer_value) 
                THEN 'Regular'
            ELSE 'Basic'
        END as customer_segment
    FROM customer_value
)
SELECT 
    customer_segment,
    COUNT(*) as customer_count,
    SUM(total_spent) as segment_revenue,
    ROUND(AVG(total_spent), 2) as avg_customer_value,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1) as customer_percentage,
    ROUND((SUM(total_spent) * 100.0 / SUM(SUM(total_spent)) OVER()), 1) as revenue_percentage
FROM customer_segments 
GROUP BY customer_segment
ORDER BY segment_revenue DESC;
```

### 2.2 LTV vs CAC 散佈圖

**最終目標：**
- 評估獲客投資回報：花多少錢獲得的客戶值多少錢？
- 找出最有價值的獲客渠道

**分析邏輯：**
```
ROI評估 = LTV / CAC 比值分析
├── LTV計算：客戶生命週期價值預測
├── CAC計算：各渠道客戶獲取成本  
├── LTV/CAC比值：>3為健康，>5為優秀
└── 渠道ROI排名：指導預算分配
```

**必要資料欄位：**
```sql
-- 客戶來源表：customer_acquisition  
customer_id       VARCHAR(50)    -- 客戶ID
acquisition_date  DATE           -- 獲客日期
source_channel    VARCHAR(50)    -- 來源渠道(Google/Facebook/SEO/Direct)
campaign_id       VARCHAR(50)    -- 活動ID
acquisition_cost  DECIMAL(8,2)   -- 獲客成本

-- 廣告投放表：marketing_spend
date              DATE           -- 日期
channel           VARCHAR(50)    -- 渠道
campaign_id       VARCHAR(50)    -- 活動ID  
spend_amount      DECIMAL(10,2)  -- 投放金額
impressions       INT            -- 曝光數
clicks            INT            -- 點擊數
conversions       INT            -- 轉換數

-- LTV & CAC 計算
WITH customer_ltv AS (
    SELECT 
        o.customer_id,
        SUM(o.order_amount) as historical_value,
        COUNT(o.order_id) as order_frequency,
        DATEDIFF(MAX(o.order_date), MIN(o.order_date)) as customer_lifespan_days,
        -- 簡化LTV預測：歷史價值 × 預期剩餘生命週期
        SUM(o.order_amount) * (365.0 / NULLIF(DATEDIFF(MAX(o.order_date), MIN(o.order_date)), 0)) * 2 as predicted_ltv
    FROM orders o
    WHERE o.order_status = 'completed'
    GROUP BY o.customer_id
),
channel_cac AS (
    SELECT 
        ca.source_channel,
        AVG(ca.acquisition_cost) as avg_cac,
        COUNT(ca.customer_id) as customers_acquired
    FROM customer_acquisition ca
    GROUP BY ca.source_channel
)
SELECT 
    ca.source_channel,
    cc.avg_cac,
    AVG(cl.predicted_ltv) as avg_ltv,
    ROUND(AVG(cl.predicted_ltv) / cc.avg_cac, 2) as ltv_cac_ratio,
    COUNT(cl.customer_id) as sample_size
FROM customer_acquisition ca
JOIN customer_ltv cl ON ca.customer_id = cl.customer_id  
JOIN channel_cac cc ON ca.source_channel = cc.source_channel
GROUP BY ca.source_channel, cc.avg_cac
ORDER BY ltv_cac_ratio DESC;
```

---

## 圖表3：營運效率總覽

### 3.1 核心指標雷達圖

**最終目標：**
- 一張圖看懂整體營運健康度
- 快速識別哪個環節需要改善

**分析邏輯：**
```
營運健康度 = 多維度標準化評分
├── 成長性指標：營收成長率、客戶成長率
├── 效率性指標：訂單轉換率、客服回應時間
├── 獲利性指標：毛利率、客戶獲取ROI  
└── 穩定性指標：客戶留存率、退貨率
```

**必要資料欄位：**
```sql
-- 綜合指標計算表
WITH kpi_metrics AS (
    SELECT 
        -- 成長性指標
        (SELECT 
            ROUND(((SUM(CASE WHEN order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN order_amount ELSE 0 END) - 
                    SUM(CASE WHEN order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) AND order_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN order_amount ELSE 0 END)) /
                   SUM(CASE WHEN order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) AND order_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) THEN order_amount ELSE 0 END)) * 100, 2)
         FROM orders WHERE order_status = 'completed') as revenue_growth_rate,
        
        -- 效率性指標  
        (SELECT ROUND(AVG(CASE WHEN order_status = 'completed' THEN 1.0 ELSE 0.0 END) * 100, 2)
         FROM orders WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) as conversion_rate,
        
        -- 獲利性指標
        (SELECT ROUND(AVG((order_amount - cost_amount) / order_amount) * 100, 2)  
         FROM orders o JOIN order_costs oc ON o.order_id = oc.order_id 
         WHERE o.order_status = 'completed' AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) as gross_margin_rate,
        
        -- 穩定性指標
        (SELECT ROUND((COUNT(DISTINCT customer_id) - COUNT(DISTINCT CASE WHEN order_date < DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) THEN customer_id END)) / 
                      COUNT(DISTINCT CASE WHEN order_date < DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) THEN customer_id END) * 100, 2)
         FROM orders WHERE order_status = 'completed') as customer_retention_rate
)
SELECT 
    'Revenue Growth' as metric, revenue_growth_rate as value, 15.0 as target, 
    ROUND(LEAST(revenue_growth_rate / 15.0 * 100, 100), 0) as score
FROM kpi_metrics
UNION ALL
SELECT 
    'Conversion Rate' as metric, conversion_rate as value, 5.0 as target,
    ROUND(LEAST(conversion_rate / 5.0 * 100, 100), 0) as score  
FROM kpi_metrics
UNION ALL
SELECT 
    'Gross Margin' as metric, gross_margin_rate as value, 30.0 as target,
    ROUND(LEAST(gross_margin_rate / 30.0 * 100, 100), 0) as score
FROM kpi_metrics
UNION ALL  
SELECT 
    'Customer Retention' as metric, customer_retention_rate as value, 80.0 as target,
    ROUND(LEAST(customer_retention_rate / 80.0 * 100, 100), 0) as score
FROM kpi_metrics;
```

---

## 實施建議

### 資料基礎建設優先順序：

**第一階段（立即實施）：**
1. 確保 `orders` 表資料完整性
2. 建立基礎的月度營收趨勢分析
3. 設定關鍵指標監控卡片

**第二階段（1-2週內）：**
1. 完善客戶價值分層分析
2. 建立獲客成本追蹤機制
3. 整合多維度營運指標

**第三階段（1個月內）：**
1. 建立自動化報表更新機制
2. 設定異常警報機制
3. 整合預測性分析功能

這套儀表板讓老闆能在5分鐘內掌握生意全貌，快速做出數據驅動的決策。

==============================================================

# 行銷總監視角：完整分析架構

## 核心關注點
**「我的行銷預算花得值嗎？哪個渠道最有效？如何優化獲客策略？」**

---

## 圖表1：獲客效果儀表板

### 1.1 渠道ROI排行榜

**最終目標：**
- 清楚知道每個渠道的投資回報率
- 快速識別表現最佳和最差的渠道
- 指導預算重新分配決策

**分析邏輯：**
```
渠道ROI分析 = 渠道收益 / 渠道成本
├── 直接ROI：(渠道帶來的營收 - 渠道成本) / 渠道成本
├── LTV ROI：(渠道客戶預期LTV - 渠道成本) / 渠道成本  
├── 多觸點歸因：考慮客戶旅程中多個接觸點
└── 時間窗口調整：短期vs長期ROI對比
```

**必要資料欄位：**
```sql
-- 行銷活動投放表：marketing_campaigns
campaign_id       VARCHAR(50)    -- 活動ID
campaign_name     VARCHAR(100)   -- 活動名稱
channel           VARCHAR(50)    -- 渠道(Google Ads/Facebook/Email/SEO)
start_date        DATE           -- 開始日期
end_date          DATE           -- 結束日期
total_spend       DECIMAL(10,2)  -- 總投放金額
impressions       BIGINT         -- 曝光數
clicks            INT            -- 點擊數
conversions       INT            -- 轉換數

-- 客戶歸因表：customer_attribution
customer_id       VARCHAR(50)    -- 客戶ID
touchpoint_date   DATETIME       -- 接觸點時間
channel           VARCHAR(50)    -- 接觸渠道
campaign_id       VARCHAR(50)    -- 活動ID
attribution_type  VARCHAR(20)    -- 歸因類型(first_touch/last_touch/linear)
attribution_weight DECIMAL(3,2)  -- 歸因權重

-- 客戶首單歸因表：first_order_attribution  
customer_id       VARCHAR(50)    -- 客戶ID
first_order_date  DATE           -- 首單日期
attributed_channel VARCHAR(50)   -- 歸因渠道
attributed_campaign VARCHAR(50)  -- 歸因活動
acquisition_cost  DECIMAL(8,2)   -- 獲客成本
```

**ROI計算邏輯：**
```sql
-- 渠道ROI綜合分析
WITH channel_performance AS (
    SELECT 
        mc.channel,
        SUM(mc.total_spend) as total_investment,
        SUM(mc.clicks) as total_clicks,
        SUM(mc.conversions) as total_conversions,
        COUNT(DISTINCT mc.campaign_id) as campaign_count
    FROM marketing_campaigns mc
    WHERE mc.start_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    GROUP BY mc.channel
),
channel_revenue AS (
    SELECT 
        foa.attributed_channel as channel,
        COUNT(DISTINCT foa.customer_id) as customers_acquired,
        -- 30天內收益（短期ROI）
        SUM(CASE WHEN o.order_date <= DATE_ADD(foa.first_order_date, INTERVAL 30 DAY) 
                 THEN o.order_amount ELSE 0 END) as revenue_30d,
        -- 90天內收益（中期ROI）        
        SUM(CASE WHEN o.order_date <= DATE_ADD(foa.first_order_date, INTERVAL 90 DAY) 
                 THEN o.order_amount ELSE 0 END) as revenue_90d,
        -- 預測LTV
        AVG(cl.predicted_ltv) as avg_predicted_ltv
    FROM first_order_attribution foa
    JOIN orders o ON foa.customer_id = o.customer_id AND o.order_status = 'completed'
    LEFT JOIN customer_ltv cl ON foa.customer_id = cl.customer_id
    WHERE foa.first_order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    GROUP BY foa.attributed_channel
)
SELECT 
    cp.channel,
    cp.total_investment,
    cr.customers_acquired,
    ROUND(cp.total_investment / NULLIF(cr.customers_acquired, 0), 2) as cac,
    ROUND(cr.revenue_30d, 2) as revenue_30d,
    ROUND(cr.revenue_90d, 2) as revenue_90d,
    ROUND(cr.avg_predicted_ltv, 2) as avg_ltv,
    -- ROI計算
    ROUND((cr.revenue_30d - cp.total_investment) / cp.total_investment * 100, 1) as roi_30d_pct,
    ROUND((cr.revenue_90d - cp.total_investment) / cp.total_investment * 100, 1) as roi_90d_pct,
    ROUND((cr.avg_predicted_ltv * cr.customers_acquired - cp.total_investment) / cp.total_investment * 100, 1) as ltv_roi_pct,
    -- 效率指標
    ROUND(cp.total_clicks / NULLIF(cp.total_investment, 0), 2) as clicks_per_dollar,
    ROUND(cr.customers_acquired / NULLIF(cp.total_clicks, 0) * 100, 2) as click_to_conversion_rate
FROM channel_performance cp
LEFT JOIN channel_revenue cr ON cp.channel = cr.channel
ORDER BY ltv_roi_pct DESC;
```

### 1.2 漏斗轉換圖

**最終目標：**
- 識別客戶旅程中的瓶頸環節
- 量化每個步驟的轉換率
- 找出優化機會點

**分析邏輯：**
```
轉換漏斗分析 = 客戶旅程各階段轉換率
├── 曝光→點擊：廣告吸引力
├── 點擊→註冊：落地頁效果
├── 註冊→首購：產品吸引力+用戶體驗
├── 首購→復購：產品滿意度+服務品質
└── 不同渠道漏斗對比分析
```

**必要資料欄位：**
```sql
-- 用戶行為追蹤表：user_journey
session_id        VARCHAR(50)    -- 會話ID
customer_id       VARCHAR(50)    -- 客戶ID（註冊後才有）
timestamp         DATETIME       -- 時間戳
event_type        VARCHAR(30)    -- 事件類型
page_url          VARCHAR(200)   -- 頁面URL
referrer_source   VARCHAR(50)    -- 來源
campaign_id       VARCHAR(50)    -- 活動ID

-- 用戶註冊表：user_registrations
customer_id       VARCHAR(50)    -- 客戶ID
registration_date DATETIME       -- 註冊時間
registration_source VARCHAR(50)  -- 註冊來源
utm_source        VARCHAR(50)    -- UTM來源
utm_campaign      VARCHAR(50)    -- UTM活動
utm_medium        VARCHAR(50)    -- UTM媒介

-- 事件定義參考
-- event_type: 'page_view', 'product_view', 'add_to_cart', 'checkout_start', 'order_complete', 'registration'
```

**漏斗轉換計算：**
```sql
-- 全渠道轉換漏斗
WITH funnel_base AS (
    SELECT DISTINCT
        uj.session_id,
        uj.customer_id,
        uj.referrer_source as traffic_source,
        -- 各階段標記
        MAX(CASE WHEN uj.event_type = 'page_view' THEN 1 ELSE 0 END) as had_pageview,
        MAX(CASE WHEN uj.event_type = 'product_view' THEN 1 ELSE 0 END) as had_product_view,
        MAX(CASE WHEN uj.event_type = 'add_to_cart' THEN 1 ELSE 0 END) as had_add_to_cart,
        MAX(CASE WHEN uj.event_type = 'checkout_start' THEN 1 ELSE 0 END) as had_checkout_start,
        MAX(CASE WHEN uj.event_type = 'registration' THEN 1 ELSE 0 END) as had_registration,
        MAX(CASE WHEN uj.event_type = 'order_complete' THEN 1 ELSE 0 END) as had_order_complete
    FROM user_journey uj
    WHERE uj.timestamp >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY uj.session_id, uj.customer_id, uj.referrer_source
),
funnel_summary AS (
    SELECT 
        traffic_source,
        COUNT(*) as total_sessions,
        SUM(had_pageview) as step1_pageview,
        SUM(had_product_view) as step2_product_view,
        SUM(had_add_to_cart) as step3_add_to_cart,
        SUM(had_checkout_start) as step4_checkout_start,
        SUM(had_registration) as step5_registration,
        SUM(had_order_complete) as step6_order_complete
    FROM funnel_base
    GROUP BY traffic_source
)
SELECT 
    traffic_source,
    total_sessions,
    step1_pageview,
    step2_product_view,
    step3_add_to_cart,
    step4_checkout_start,
    step5_registration,
    step6_order_complete,
    -- 轉換率計算
    ROUND(step2_product_view / NULLIF(step1_pageview, 0) * 100, 2) as pageview_to_product_rate,
    ROUND(step3_add_to_cart / NULLIF(step2_product_view, 0) * 100, 2) as product_to_cart_rate,
    ROUND(step4_checkout_start / NULLIF(step3_add_to_cart, 0) * 100, 2) as cart_to_checkout_rate,
    ROUND(step5_registration / NULLIF(step4_checkout_start, 0) * 100, 2) as checkout_to_registration_rate,
    ROUND(step6_order_complete / NULLIF(step5_registration, 0) * 100, 2) as registration_to_order_rate,
    -- 整體轉換率
    ROUND(step6_order_complete / NULLIF(total_sessions, 0) * 100, 2) as overall_conversion_rate
FROM funnel_summary
ORDER BY step6_order_complete DESC;
```

### 1.3 同期群組留存圖

**最終目標：**
- 了解不同時期獲得的客戶留存情況
- 評估產品黏性和客戶忠誠度
- 預測客戶生命週期價值

**分析邏輯：**
```
同期群組分析 = 按註冊時間分組的客戶留存追蹤
├── 註冊同期群組：按週/月分組新客戶
├── 留存率計算：各時期回訪/購買的客戶比例
├── 留存曲線：觀察留存率隨時間的變化趨勢
└── 同期群組對比：不同時期獲客品質差異
```

**必要資料欄位：**
```sql
-- 客戶活躍度表：customer_activity
customer_id       VARCHAR(50)    -- 客戶ID
activity_date     DATE           -- 活躍日期
activity_type     VARCHAR(30)    -- 活躍類型(login/purchase/page_view)
order_amount      DECIMAL(10,2)  -- 訂單金額（如果是購買）

-- 客戶基本資訊（已有）
-- customer_id, registration_date, first_order_date, etc.
```

**同期群組留存分析：**
```sql
-- 同期群組留存分析
WITH customer_cohorts AS (
    SELECT 
        customer_id,
        DATE_FORMAT(registration_date, '%Y-%m') as cohort_month,
        registration_date
    FROM user_registrations
    WHERE registration_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
),
customer_activities AS (
    SELECT DISTINCT
        ca.customer_id,
        DATE_FORMAT(ca.activity_date, '%Y-%m') as activity_month,
        ca.activity_date
    FROM customer_activity ca
    WHERE ca.activity_type IN ('login', 'purchase')
    AND ca.activity_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
),
cohort_data AS (
    SELECT 
        cc.cohort_month,
        ca.activity_month,
        TIMESTAMPDIFF(MONTH, STR_TO_DATE(CONCAT(cc.cohort_month, '-01'), '%Y-%m-%d'), 
                             STR_TO_DATE(CONCAT(ca.activity_month, '-01'), '%Y-%m-%d')) as month_number,
        COUNT(DISTINCT cc.customer_id) as cohort_size,
        COUNT(DISTINCT ca.customer_id) as active_customers
    FROM customer_cohorts cc
    LEFT JOIN customer_activities ca ON cc.customer_id = ca.customer_id
    GROUP BY cc.cohort_month, ca.activity_month
),
cohort_sizes AS (
    SELECT 
        cohort_month,
        COUNT(DISTINCT customer_id) as cohort_size
    FROM customer_cohorts
    GROUP BY cohort_month
)
SELECT 
    cd.cohort_month,
    cs.cohort_size,
    cd.month_number,
    cd.active_customers,
    ROUND(cd.active_customers / cs.cohort_size * 100, 2) as retention_rate
FROM cohort_data cd
JOIN cohort_sizes cs ON cd.cohort_month = cs.cohort_month
WHERE cd.month_number IS NOT NULL
ORDER BY cd.cohort_month, cd.month_number;

-- 留存熱力圖資料格式
SELECT 
    cohort_month,
    MAX(CASE WHEN month_number = 0 THEN retention_rate END) as month_0,
    MAX(CASE WHEN month_number = 1 THEN retention_rate END) as month_1,
    MAX(CASE WHEN month_number = 2 THEN retention_rate END) as month_2,
    MAX(CASE WHEN month_number = 3 THEN retention_rate END) as month_3,
    MAX(CASE WHEN month_number = 6 THEN retention_rate END) as month_6,
    MAX(CASE WHEN month_number = 12 THEN retention_rate END) as month_12
FROM (上述查詢結果) cohort_retention
GROUP BY cohort_month
ORDER BY cohort_month;
```

---

## 圖表2：行銷策略地圖

### 2.1 客戶旅程熱力圖

**最終目標：**
- 視覺化客戶在網站/App上的行為路徑
- 識別熱門頁面和冷門區域
- 優化用戶體驗和轉換路徑

**分析邏輯：**
```
客戶旅程分析 = 頁面流量 + 行為序列 + 轉換貢獻
├── 頁面熱力圖：各頁面訪問量和停留時間
├── 路徑分析：用戶最常見的瀏覽路徑
├── 轉換貢獻：各頁面對最終轉換的貢獻度
└── 流失點分析：用戶在哪個環節最容易離開
```

**必要資料欄位：**
```sql
-- 頁面訪問記錄表：page_visits
visit_id          VARCHAR(50)    -- 訪問ID
session_id        VARCHAR(50)    -- 會話ID
customer_id       VARCHAR(50)    -- 客戶ID
page_url          VARCHAR(200)   -- 頁面URL
page_title        VARCHAR(100)   -- 頁面標題
visit_timestamp   DATETIME       -- 訪問時間
exit_timestamp    DATETIME       -- 離開時間
referrer_url      VARCHAR(200)   -- 來源頁面
utm_source        VARCHAR(50)    -- UTM來源
device_type       VARCHAR(20)    -- 設備類型

-- 頁面分類表：page_categories
page_url          VARCHAR(200)   -- 頁面URL
page_category     VARCHAR(50)    -- 頁面分類(home/product/cart/checkout)
page_type         VARCHAR(30)    -- 頁面類型
conversion_value  DECIMAL(3,2)   -- 轉換價值權重
```

**客戶旅程分析：**
```sql
-- 頁面熱力圖數據
WITH page_metrics AS (
    SELECT 
        pc.page_category,
        COUNT(*) as total_visits,
        COUNT(DISTINCT pv.session_id) as unique_sessions,
        COUNT(DISTINCT pv.customer_id) as unique_visitors,
        AVG(TIMESTAMPDIFF(SECOND, pv.visit_timestamp, pv.exit_timestamp)) as avg_time_on_page,
        -- 計算跳出率（單頁面會話比例）
        SUM(CASE WHEN session_page_count.page_count = 1 THEN 1 ELSE 0 END) / COUNT(DISTINCT pv.session_id) * 100 as bounce_rate
    FROM page_visits pv
    JOIN page_categories pc ON pv.page_url = pc.page_url
    LEFT JOIN (
        SELECT session_id, COUNT(*) as page_count
        FROM page_visits 
        GROUP BY session_id
    ) session_page_count ON pv.session_id = session_page_count.session_id
    WHERE pv.visit_timestamp >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY pc.page_category
),
conversion_contribution AS (
    SELECT 
        pc.page_category,
        -- 該頁面訪問後30分鐘內產生訂單的會話數
        COUNT(DISTINCT CASE WHEN o.order_date <= DATE_ADD(pv.visit_timestamp, INTERVAL 30 MINUTE) 
                            THEN pv.session_id END) as converting_sessions,
        SUM(CASE WHEN o.order_date <= DATE_ADD(pv.visit_timestamp, INTERVAL 30 MINUTE) 
                 THEN o.order_amount ELSE 0 END) as attributed_revenue
    FROM page_visits pv
    JOIN page_categories pc ON pv.page_url = pc.page_url
    LEFT JOIN orders o ON pv.customer_id = o.customer_id 
                       AND o.order_status = 'completed'
    WHERE pv.visit_timestamp >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY pc.page_category
)
SELECT 
    pm.page_category,
    pm.total_visits,
    pm.unique_sessions,
    pm.avg_time_on_page,
    ROUND(pm.bounce_rate, 2) as bounce_rate,
    cc.converting_sessions,
    ROUND(cc.converting_sessions / pm.unique_sessions * 100, 2) as conversion_rate,
    ROUND(cc.attributed_revenue, 2) as attributed_revenue,
    ROUND(cc.attributed_revenue / pm.unique_sessions, 2) as revenue_per_session
FROM page_metrics pm
LEFT JOIN conversion_contribution cc ON pm.page_category = cc.page_category
ORDER BY pm.total_visits DESC;
```

### 2.2 個人化效果對比圖

**最終目標：**
- 評估個人化推薦和內容的效果
- 對比個人化 vs 非個人化的轉換表現
- 優化個人化算法和策略

**分析邏輯：**
```
個人化效果評估 = A/B測試 + 個人化算法效果
├── 個人化推薦點擊率 vs 通用推薦
├── 個人化內容轉換率 vs 標準內容
├── 不同個人化策略的效果對比
└── ROI分析：個人化投入vs收益提升
```

**必要資料欄位：**
```sql
-- 個人化實驗表：personalization_experiments
experiment_id     VARCHAR(50)    -- 實驗ID
customer_id       VARCHAR(50)    -- 客戶ID
experiment_type   VARCHAR(50)    -- 實驗類型(recommendation/content/email)
treatment_group   VARCHAR(20)    -- 實驗組(personalized/control)
start_date        DATE           -- 開始日期
end_date          DATE           -- 結束日期

-- 推薦點擊記錄表：recommendation_clicks
click_id          VARCHAR(50)    -- 點擊ID
customer_id       VARCHAR(50)    -- 客戶ID
recommendation_id VARCHAR(50)    -- 推薦ID
click_timestamp   DATETIME       -- 點擊時間
recommendation_type VARCHAR(30)  -- 推薦類型(personalized/popular/random)
product_id        VARCHAR(50)    -- 產品ID
position          INT            -- 推薦位置

-- 推薦展示記錄表：recommendation_impressions
impression_id     VARCHAR(50)    -- 展示ID
customer_id       VARCHAR(50)    -- 客戶ID
recommendation_id VARCHAR(50)    -- 推薦ID
impression_timestamp DATETIME    -- 展示時間
recommendation_type VARCHAR(30)  -- 推薦類型
products_shown    TEXT           -- 展示的產品列表
```

**個人化效果分析：**
```sql
-- 個人化推薦效果對比
WITH recommendation_performance AS (
    SELECT 
        ri.recommendation_type,
        COUNT(ri.impression_id) as total_impressions,
        COUNT(rc.click_id) as total_clicks,
        COUNT(DISTINCT rc.customer_id) as unique_clickers,
        -- 點擊率
        ROUND(COUNT(rc.click_id) / COUNT(ri.impression_id) * 100, 3) as click_through_rate,
        -- 後續轉換（點擊後24小時內下單）
        COUNT(DISTINCT CASE WHEN o.order_date <= DATE_ADD(rc.click_timestamp, INTERVAL 24 HOUR) 
                            THEN o.order_id END) as conversions,
        SUM(CASE WHEN o.order_date <= DATE_ADD(rc.click_timestamp, INTERVAL 24 HOUR) 
                 THEN o.order_amount ELSE 0 END) as conversion_revenue
    FROM recommendation_impressions ri
    LEFT JOIN recommendation_clicks rc ON ri.recommendation_id = rc.recommendation_id
    LEFT JOIN orders o ON rc.customer_id = o.customer_id AND o.order_status = 'completed'
    WHERE ri.impression_timestamp >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY ri.recommendation_type
),
personalization_lift AS (
    SELECT 
        p.recommendation_type,
        p.click_through_rate,
        p.conversions,
        p.conversion_revenue,
        ROUND(p.conversions / NULLIF(p.total_clicks, 0) * 100, 2) as conversion_rate,
        -- 與控制組對比
        LAG(p.click_through_rate) OVER (ORDER BY p.recommendation_type) as control_ctr,
        LAG(p.conversions) OVER (ORDER BY p.recommendation_type) as control_conversions,
        -- 提升度計算
        ROUND((p.click_through_rate - LAG(p.click_through_rate) OVER (ORDER BY p.recommendation_type)) / 
              LAG(p.click_through_rate) OVER (ORDER BY p.recommendation_type) * 100, 2) as ctr_lift_pct
    FROM recommendation_performance p
)
SELECT 
    recommendation_type,
    click_through_rate,
    conversion_rate,
    conversion_revenue,
    ctr_lift_pct,
    CASE 
        WHEN recommendation_type = 'personalized' THEN 'Test Group'
        WHEN recommendation_type = 'popular' THEN 'Control Group'
        ELSE 'Baseline'
    END as group_type
FROM personalization_lift
ORDER BY click_through_rate DESC;

-- 個人化郵件效果分析
WITH email_performance AS (
    SELECT 
        pe.treatment_group,
        COUNT(DISTINCT pe.customer_id) as recipients,
        -- 從郵件活動表獲取開信、點擊數據
        SUM(ec.opens) as total_opens,
        SUM(ec.clicks) as total_clicks,
        SUM(ec.conversions) as total_conversions,
        SUM(ec.revenue) as total_revenue
    FROM personalization_experiments pe
    LEFT JOIN email_campaigns ec ON pe.customer_id = ec.customer_id 
                                 AND pe.experiment_id = ec.experiment_id
    WHERE pe.experiment_type = 'email' 
    AND pe.start_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
    GROUP BY pe.treatment_group
)
SELECT 
    treatment_group,
    recipients,
    ROUND(total_opens / recipients * 100, 2) as open_rate,
    ROUND(total_clicks / total_opens * 100, 2) as click_rate,
    ROUND(total_conversions / recipients * 100, 2) as conversion_rate,
    ROUND(total_revenue / recipients, 2) as revenue_per_recipient
FROM email_performance;
```

### 2.3 預算分配建議圖

**最終目標：**
- 基於歷史ROI數據建議最優預算分配
- 預測不同預算配置下的預期回報
- 識別邊際效應遞減點

**分析邏輯：**
```
預算優化分析 = 邊際收益分析 + 預算效率曲線
├── 各渠道邊際ROI計算
├── 預算-收益彈性分析
├── 最優預算分配模型（線性規劃）
└── 預算調整影響預測
```

**必要資料欄位：**
```sql
-- 預算歷史表：budget_allocation_history
allocation_id     VARCHAR(50)    -- 分配ID
month             DATE           -- 月份
channel           VARCHAR(50)    -- 渠道
allocated_budget  DECIMAL(10,2)  -- 分配預算
actual_spend      DECIMAL(10,2)  -- 實際花費
generated_revenue DECIMAL(12,2)  -- 產生收益
new_customers     INT            -- 新客戶數

-- 渠道容量表：channel_capacity
channel           VARCHAR(50)    -- 渠道
max_monthly_spend DECIMAL(10,2)  -- 月最大投放額度
saturation_point  DECIMAL(10,2)  -- 飽和點預算
efficiency_curve  TEXT           -- 效率曲線參數(JSON)
```

**預算優化分析：**
```sql
-- 渠道歷史ROI和邊際效應分析
WITH channel_roi_analysis AS (
    SELECT 
        channel,
        month,
        allocated_budget,
        generated_revenue,
        ROUND(generated_revenue / NULLIF(allocated_budget, 0), 2) as roi_ratio,
        LAG(allocated_budget) OVER (PARTITION BY channel ORDER BY month) as prev_budget,
        LAG(generated_revenue) OVER (PARTITION BY channel ORDER BY month) as prev_revenue,
        -- 邊際ROI計算
        ROUND((generated_revenue - LAG(generated_revenue) OVER (PARTITION BY channel ORDER BY month)) / 
              NULLIF((allocated_budget - LAG(allocated_budget) OVER (PARTITION BY channel ORDER BY month)), 0), 2) as marginal_roi
    FROM budget_allocation_history
    WHERE month >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
),
channel_efficiency AS (
    SELECT 
        channel,
        AVG(roi_ratio) as avg_roi,
        AVG(marginal_roi) as avg_marginal_roi,
        STDDEV(roi_ratio) as roi_volatility,
        MAX(allocated_budget) as max_tested_budget,
        -- 效率穩定性評分
        CASE 
            WHEN STDDEV(roi_ratio) < 0.5 THEN 'Stable'
            WHEN STDDEV(roi_ratio) < 1.0 THEN 'Moderate' 
            ELSE 'Volatile'
        END as efficiency_stability
    FROM channel_roi_analysis
    WHERE marginal_roi IS NOT NULL
    GROUP BY channel
),
budget_optimization AS (
    SELECT 
        ce.channel,
        ce.avg_roi,
        ce.avg_marginal_roi,
        cc.max_monthly_spend,
        cc.saturation_point,
        -- 當前月份實際表現
        curr.allocated_budget as current_budget,
        curr.generated_revenue as current_revenue,
        -- 建議預算（基於邊際ROI排序）
        CASE 
            WHEN ce.avg_marginal_roi > 3.0 AND curr.allocated_budget < cc.saturation_point 
                THEN LEAST(curr.allocated_budget * 1.5, cc.max_monthly_spend)
            WHEN ce.avg_marginal_roi > 2.0 AND curr.allocated_budget < cc.saturation_point 
                THEN LEAST(curr.allocated_budget * 1.2, cc.max_monthly_spend)
            WHEN ce.avg_marginal_roi < 1.5 
                THEN curr.allocated_budget * 0.8
            ELSE curr.allocated_budget
        END as suggested_budget
    FROM channel_efficiency ce
    LEFT JOIN channel_capacity cc ON ce.channel = cc.channel
    LEFT JOIN (
        SELECT channel, allocated_budget, generated_revenue
        FROM budget_allocation_history 
        WHERE month = DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH,

==============================================================

# 銷售經理視角：完整分析架構

## 核心關注點
**「什麼產品賣得好？庫存怎麼配？下個月/季度的銷售策略該怎麼調整？」**

---

## 圖表1：銷售業績儀表板

### 1.1 產品銷量排行榜

**最終目標：**
- 快速識別明星產品和滯銷品
- 指導庫存配置和採購決策
- 發現產品生命週期變化

**分析邏輯：**
```
產品表現分析 = 多維度產品績效評估
├── 銷量排名：數量+金額雙重維度
├── 成長趨勢：環比+同比變化率
├── 毛利貢獻：利潤率+絕對利潤額
└── 庫存周轉：銷售速度+庫存消化
```

**必要資料欄位：**
```sql
-- 訂單明細表：order_items
order_item_id     VARCHAR(50)    -- 訂單明細ID
order_id          VARCHAR(50)    -- 訂單ID
product_id        VARCHAR(50)    -- 商品ID
product_sku       VARCHAR(50)    -- 商品SKU
quantity          INT            -- 購買數量
unit_price        DECIMAL(8,2)   -- 單價
total_amount      DECIMAL(10,2)  -- 小計金額

-- 商品主檔表：products
product_id        VARCHAR(50)    -- 商品ID
product_name      VARCHAR(200)   -- 商品名稱
category_id       VARCHAR(50)    -- 類別ID
category_name     VARCHAR(100)   -- 類別名稱
brand             VARCHAR(100)   -- 品牌
cost_price        DECIMAL(8,2)   -- 成本價
list_price        DECIMAL(8,2)   -- 定價
launch_date       DATE           -- 上市日期
status            VARCHAR(20)    -- 商品狀態(active/discontinued)

-- 庫存表：inventory
product_id        VARCHAR(50)    -- 商品ID
warehouse_id      VARCHAR(50)    -- 倉庫ID
current_stock     INT            -- 當前庫存
safety_stock      INT            -- 安全庫存
last_updated      TIMESTAMP      -- 更新時間
```

**產品績效分析查詢：**
```sql
WITH product_performance AS (
    SELECT 
        p.product_id,
        p.product_name,
        p.category_name,
        p.brand,
        -- 當月表現
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN oi.quantity ELSE 0 END) as current_month_qty,
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN oi.total_amount ELSE 0 END) as current_month_revenue,
        -- 上月表現
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) 
            AND o.order_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            THEN oi.quantity ELSE 0 END) as prev_month_qty,
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) 
            AND o.order_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            THEN oi.total_amount ELSE 0 END) as prev_month_revenue,
        -- 毛利計算
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN (oi.unit_price - p.cost_price) * oi.quantity ELSE 0 END) as current_month_profit,
        -- 平均售價
        AVG(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN oi.unit_price ELSE NULL END) as avg_selling_price
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'completed'
    WHERE p.status = 'active'
    GROUP BY p.product_id, p.product_name, p.category_name, p.brand
),
product_ranking AS (
    SELECT 
        *,
        -- 成長率計算
        CASE WHEN prev_month_qty > 0 
            THEN ROUND(((current_month_qty - prev_month_qty) / prev_month_qty) * 100, 1)
            ELSE NULL END as qty_growth_rate,
        CASE WHEN prev_month_revenue > 0 
            THEN ROUND(((current_month_revenue - prev_month_revenue) / prev_month_revenue) * 100, 1)
            ELSE NULL END as revenue_growth_rate,
        -- 毛利率
        CASE WHEN current_month_revenue > 0 
            THEN ROUND((current_month_profit / current_month_revenue) * 100, 1)
            ELSE 0 END as gross_margin_rate,
        -- 排名
        ROW_NUMBER() OVER (ORDER BY current_month_revenue DESC) as revenue_rank,
        ROW_NUMBER() OVER (ORDER BY current_month_qty DESC) as qty_rank
    FROM product_performance
)
SELECT 
    pr.*,
    i.current_stock,
    -- 庫存周轉天數估算
    CASE WHEN current_month_qty > 0 
        THEN ROUND(i.current_stock / (current_month_qty / 30.0), 1)
        ELSE NULL END as days_of_inventory,
    -- 表現分類
    CASE 
        WHEN revenue_rank <= 20 AND qty_growth_rate > 10 THEN 'Star'
        WHEN revenue_rank <= 20 AND qty_growth_rate <= 10 THEN 'Cash Cow'
        WHEN revenue_rank > 20 AND qty_growth_rate > 10 THEN 'Question Mark'
        ELSE 'Dog'
    END as product_category
FROM product_ranking pr
LEFT JOIN inventory i ON pr.product_id = i.product_id
ORDER BY current_month_revenue DESC;
```

### 1.2 銷售預測曲線

**最終目標：**
- 預測未來3個月的銷售趨勢
- 提前準備庫存和行銷活動
- 設定合理的銷售目標

**分析邏輯：**
```
銷售預測 = 歷史趨勢 + 季節性 + 外部因素
├── 基礎趨勢：移除季節性的長期趨勢
├── 季節性調整：節慶、促銷活動影響
├── 移動平均：平滑短期波動
└── 信心區間：預測的可信度範圍
```

**必要資料欄位：**
```sql
-- 促銷活動表：promotions
promotion_id      VARCHAR(50)    -- 促銷ID
promotion_name    VARCHAR(200)   -- 促銷名稱
start_date        DATE           -- 開始日期
end_date          DATE           -- 結束日期
discount_rate     DECIMAL(5,2)   -- 折扣率
promotion_type    VARCHAR(50)    -- 促銷類型(flash_sale/holiday/clearance)
target_products   TEXT           -- 目標商品(JSON格式)

-- 外部因素表：external_factors
date              DATE           -- 日期
is_holiday        BOOLEAN        -- 是否節假日
is_payday         BOOLEAN        -- 是否發薪日
weather_score     INT            -- 天氣評分(1-10)
competitor_promo  BOOLEAN        -- 競爭對手促銷
```

**銷售預測分析查詢：**
```sql
WITH daily_sales AS (
    SELECT 
        o.order_date,
        SUM(oi.total_amount) as daily_revenue,
        COUNT(DISTINCT o.order_id) as daily_orders,
        SUM(oi.quantity) as daily_quantity,
        -- 標記特殊日期
        CASE WHEN p.promotion_id IS NOT NULL THEN 1 ELSE 0 END as has_promotion,
        COALESCE(ef.is_holiday, 0) as is_holiday,
        COALESCE(ef.is_payday, 0) as is_payday
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN promotions p ON o.order_date BETWEEN p.start_date AND p.end_date
    LEFT JOIN external_factors ef ON o.order_date = ef.date
    WHERE o.order_status = 'completed' 
    AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)
    GROUP BY o.order_date, has_promotion, is_holiday, is_payday
),
sales_with_features AS (
    SELECT 
        *,
        -- 移動平均
        AVG(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma_7_revenue,
        AVG(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as ma_30_revenue,
        -- 同期對比
        LAG(daily_revenue, 7) OVER (ORDER BY order_date) as revenue_7_days_ago,
        LAG(daily_revenue, 30) OVER (ORDER BY order_date) as revenue_30_days_ago,
        -- 週幾效應
        DAYOFWEEK(order_date) as day_of_week,
        -- 月份效應
        MONTH(order_date) as month_of_year
    FROM daily_sales
),
forecast_base AS (
    SELECT 
        order_date,
        daily_revenue,
        ma_30_revenue,
        -- 季節性指數計算
        CASE WHEN ma_30_revenue > 0 
            THEN daily_revenue / ma_30_revenue 
            ELSE 1 END as seasonal_index,
        -- 趨勢計算
        (ma_30_revenue - LAG(ma_30_revenue, 30) OVER (ORDER BY order_date)) / 
        NULLIF(LAG(ma_30_revenue, 30) OVER (ORDER BY order_date), 0) as trend_rate
    FROM sales_with_features
    WHERE order_date <= CURRENT_DATE
)
-- 生成未來90天的預測
SELECT 
    forecast_date,
    ROUND(predicted_revenue, 0) as predicted_revenue,
    ROUND(predicted_revenue * 0.8, 0) as lower_bound,
    ROUND(predicted_revenue * 1.2, 0) as upper_bound,
    confidence_level
FROM (
    SELECT 
        DATE_ADD(CURRENT_DATE, INTERVAL seq DAY) as forecast_date,
        -- 簡化預測模型：基礎趨勢 + 季節性調整
        (SELECT AVG(ma_30_revenue) FROM forecast_base WHERE order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)) *
        (1 + COALESCE((SELECT AVG(trend_rate) FROM forecast_base WHERE trend_rate IS NOT NULL AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)), 0)) *
        (SELECT AVG(seasonal_index) FROM forecast_base 
         WHERE MONTH(order_date) = MONTH(DATE_ADD(CURRENT_DATE, INTERVAL seq DAY))
         AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)) as predicted_revenue,
        CASE 
            WHEN seq <= 7 THEN 95
            WHEN seq <= 30 THEN 85
            ELSE 70
        END as confidence_level
    FROM (
        SELECT 1 as seq UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION
        SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION
        SELECT 15 UNION SELECT 20 UNION SELECT 25 UNION SELECT 30 UNION
        SELECT 45 UNION SELECT 60 UNION SELECT 75 UNION SELECT 90
    ) as sequence
) forecasts
ORDER BY forecast_date;
```

### 1.3 地區業績熱力圖

**最終目標：**
- 識別高潛力和低表現地區
- 指導區域市場投入策略
- 發現地域性消費偏好

**分析邏輯：**
```
地區分析 = 地理績效 + 市場滲透率 + 增長潛力
├── 營收密度：單位面積/人口的營收貢獻
├── 市場份額：在當地市場的佔有率
├── 成長速度：各地區業績變化趨勢
└── 客戶密度：活躍客戶分布狀況
```

**必要資料欄位：**
```sql
-- 客戶地址表：customer_addresses
customer_id       VARCHAR(50)    -- 客戶ID
country           VARCHAR(50)    -- 國家
state_province    VARCHAR(100)   -- 省份/州
city              VARCHAR(100)   -- 城市
postal_code       VARCHAR(20)    -- 郵遞區號
latitude          DECIMAL(10,8)  -- 緯度
longitude         DECIMAL(11,8)  -- 經度

-- 地區市場資料表：market_data
region_code       VARCHAR(20)    -- 地區代碼
region_name       VARCHAR(100)   -- 地區名稱
population        INT            -- 人口數
gdp_per_capita    DECIMAL(12,2)  -- 人均GDP
market_size       DECIMAL(15,2)  -- 市場規模
competitors_count INT            -- 競爭對手數量
```

**地區績效分析查詢：**
```sql
WITH regional_performance AS (
    SELECT 
        ca.state_province,
        ca.city,
        COUNT(DISTINCT o.customer_id) as active_customers,
        COUNT(DISTINCT o.order_id) as total_orders,
        SUM(o.order_amount) as total_revenue,
        AVG(o.order_amount) as avg_order_value,
        -- 當月表現
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN o.order_amount ELSE 0 END) as current_month_revenue,
        -- 上月表現  
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) 
            AND o.order_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
            THEN o.order_amount ELSE 0 END) as prev_month_revenue,
        -- 去年同期
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY) 
            AND o.order_date < DATE_SUB(CURRENT_DATE, INTERVAL 335 DAY)
            THEN o.order_amount ELSE 0 END) as prev_year_revenue
    FROM orders o
    JOIN customer_addresses ca ON o.customer_id = ca.customer_id
    WHERE o.order_status = 'completed'
    AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)
    GROUP BY ca.state_province, ca.city
),
regional_metrics AS (
    SELECT 
        rp.*,
        md.population,
        md.gdp_per_capita,
        md.market_size,
        -- 績效指標計算
        ROUND(rp.total_revenue / NULLIF(md.population, 0), 2) as revenue_per_capita,
        ROUND(rp.active_customers / NULLIF(md.population, 0) * 1000, 2) as customer_penetration_rate,
        ROUND(rp.total_revenue / NULLIF(md.market_size, 0) * 100, 2) as market_share_est,
        -- 成長率
        CASE WHEN rp.prev_month_revenue > 0 
            THEN ROUND(((rp.current_month_revenue - rp.prev_month_revenue) / rp.prev_month_revenue) * 100, 1)
            ELSE NULL END as mom_growth_rate,
        CASE WHEN rp.prev_year_revenue > 0 
            THEN ROUND(((rp.current_month_revenue - rp.prev_year_revenue) / rp.prev_year_revenue) * 100, 1)
            ELSE NULL END as yoy_growth_rate
    FROM regional_performance rp
    LEFT JOIN market_data md ON rp.city = md.region_name
),
regional_ranking AS (
    SELECT 
        *,
        -- 綜合評分計算
        (COALESCE(revenue_per_capita, 0) * 0.3 + 
         COALESCE(customer_penetration_rate, 0) * 0.3 + 
         COALESCE(mom_growth_rate, 0) * 0.4) as composite_score,
        -- 地區分類
        CASE 
            WHEN current_month_revenue > 50000 AND mom_growth_rate > 10 THEN 'Star Markets'
            WHEN current_month_revenue > 50000 AND mom_growth_rate <= 10 THEN 'Cash Cow Markets'  
            WHEN current_month_revenue <= 50000 AND mom_growth_rate > 10 THEN 'Question Mark Markets'
            ELSE 'Dog Markets'
        END as market_category
    FROM regional_metrics
)
SELECT 
    state_province,
    city,
    active_customers,
    current_month_revenue,
    revenue_per_capita,
    customer_penetration_rate,
    mom_growth_rate,
    yoy_growth_rate,
    market_category,
    composite_score,
    ROW_NUMBER() OVER (ORDER BY composite_score DESC) as market_rank
FROM regional_ranking
WHERE current_month_revenue > 0
ORDER BY composite_score DESC;
```

---

## 圖表2：產品策略矩陣

### 2.1 商品生命週期圖

**最終目標：**
- 掌握每個商品處於哪個生命週期階段
- 及時調整產品策略和資源配置
- 預測商品淘汰和補充時機

**分析邏輯：**
```
產品生命週期 = 導入期 → 成長期 → 成熟期 → 衰退期
├── 導入期：銷量低但成長率高
├── 成長期：銷量和成長率都高
├── 成熟期：銷量高但成長率趨緩
└── 衰退期：銷量和成長率都下降
```

**生命週期分析查詢：**
```sql
WITH product_lifecycle AS (
    SELECT 
        p.product_id,
        p.product_name,
        p.launch_date,
        DATEDIFF(CURRENT_DATE, p.launch_date) as days_since_launch,
        -- 各期間銷量
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN oi.quantity ELSE 0 END) as current_month_qty,
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY) 
            AND o.order_date < DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) 
            THEN oi.quantity ELSE 0 END) as prev_month_qty,
        SUM(CASE WHEN o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY) 
            THEN oi.quantity ELSE 0 END) as last_3months_qty,
        -- 總累計銷量
        SUM(oi.quantity) as total_qty_sold,
        -- 銷售峰值
        MAX(monthly_sales.monthly_qty) as peak_monthly_qty
    FROM products p
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'completed'
    LEFT JOIN (
        SELECT 
            oi2.product_id,
            DATE_FORMAT(o2.order_date, '%Y-%m') as month,
            SUM(oi2.quantity) as monthly_qty
        FROM order_items oi2
        JOIN orders o2 ON oi2.order_id = o2.order_id
        WHERE o2.order_status = 'completed'
        GROUP BY oi2.product_id, DATE_FORMAT(o2.order_date, '%Y-%m')
    ) monthly_sales ON p.product_id = monthly_sales.product_id
    WHERE p.status = 'active'
    GROUP BY p.product_id, p.product_name, p.launch_date
),
lifecycle_classification AS (
    SELECT 
        *,
        -- 成長率計算
        CASE WHEN prev_month_qty > 0 
            THEN ROUND(((current_month_qty - prev_month_qty) / prev_month_qty) * 100, 1)
            ELSE NULL END as growth_rate,
        -- 相對銷量位置
        CASE WHEN peak_monthly_qty > 0 
            THEN ROUND((current_month_qty / peak_monthly_qty) * 100, 1)
            ELSE 0 END as current_vs_peak_pct,
        -- 生命週期階段判定
        CASE 
            WHEN days_since_launch <= 90 AND total_qty_sold < 100 THEN 'Introduction'
            WHEN days_since_launch <= 180 AND growth_rate > 20 THEN 'Growth'  
            WHEN current_vs_peak_pct >= 80 AND growth_rate BETWEEN -10 AND 10 THEN 'Maturity'
            WHEN current_vs_peak_pct < 50 AND growth_rate < -10 THEN 'Decline'
            ELSE 'Transition'
        END as lifecycle_stage
    FROM product_lifecycle
)
SELECT 
    product_id,
    product_name,
    days_since_launch,
    current_month_qty,
    growth_rate,
    current_vs_peak_pct,
    lifecycle_stage,
    -- 策略建議
    CASE lifecycle_stage
        WHEN 'Introduction' THEN 'Increase marketing investment'
        WHEN 'Growth' THEN 'Scale up inventory and promotion'
        WHEN 'Maturity' THEN 'Focus on profitability optimization'
        WHEN 'Decline' THEN 'Consider clearance or discontinuation'
        ELSE 'Monitor closely'
    END as strategy_recommendation
FROM lifecycle_classification
ORDER BY 
    CASE lifecycle_stage
        WHEN 'Growth' THEN 1
        WHEN 'Introduction' THEN 2  
        WHEN 'Maturity' THEN 3
        WHEN 'Decline' THEN 4
        ELSE 5
    END,
    current_month_qty DESC;
```

### 2.2 交叉銷售網絡圖

**最終目標：**
- 發現商品間的關聯銷售機會
- 優化商品搭配和推薦策略
- 提升客單價和購物籃大小

**分析邏輯：**
```
關聯分析 = 購物籃分析 + 關聯規則挖掘
├── 支持度：商品組合出現頻率
├── 信心度：購買A商品時購買B商品的機率
├── 提升度：關聯規則的有效性
└── 網絡強度：商品間關聯的緊密程度
```

**交叉銷售分析查詢：**
```sql
WITH order_baskets AS (
    SELECT 
        o.order_id,
        o.customer_id,
        GROUP_CONCAT(oi.product_id ORDER BY oi.product_id) as product_basket,
        COUNT(DISTINCT oi.product_id) as basket_size,
        SUM(oi.total_amount) as basket_value
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_status = 'completed'
    AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    GROUP BY o.order_id, o.customer_id
    HAVING basket_size >= 2  -- 只分析多商品訂單
),
product_pairs AS (
    SELECT 
        oi1.product_id as product_a,
        oi2.product_id as product_b,
        COUNT(DISTINCT o.order_id) as co_occurrence_count,
        COUNT(DISTINCT o.customer_id) as co_buying_customers
    FROM orders o
    JOIN order_items oi1 ON o.order_id = oi1.order_id
    JOIN order_items oi2 ON o.order_id = oi2.order_id
    WHERE o.order_status = 'completed'
    AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    AND oi1.product_id < oi2.product_id  -- 避免重複配對
    GROUP BY oi1.product_id, oi2.product_id
    HAVING co_occurrence_count >= 5  -- 至少共同出現5次
),
product_stats AS (
    SELECT 
        oi.product_id,
        COUNT(DISTINCT o.order_id) as total_orders,
        COUNT(DISTINCT o.customer_id) as total_customers
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.order_status = 'completed'
    AND o.order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    GROUP BY oi.product_id
),
association_rules AS (
    SELECT 
        pp.product_a,
        pp.product_b,
        pa.product_name as product_a_name,
        pb.product_name as product_b_name,
        pp.co_occurrence_count,
        psa.total_orders as product_a_orders,
        psb.total_orders as product_b_orders,
        (SELECT COUNT(DISTINCT order_id) FROM orders WHERE order_status = 'completed' 
         AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)) as total_orders,
        -- 關聯規則指標
        ROUND(pp.co_occurrence_count / (SELECT COUNT(DISTINCT order_id) FROM orders WHERE order_status = 'completed' 
                                       AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)) * 100, 2) as support_pct,
        ROUND(pp.co_occurrence_count / psa.total_orders * 100, 2) as confidence_a_to_b,
        ROUND(pp.co_occurrence_count / psb.total_orders * 100, 2) as confidence_b_to_a,
        ROUND((pp.co_occurrence_count / (SELECT COUNT(DISTINCT order_id) FROM orders WHERE order_status = 'completed' 
                                        AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY))) / 
              ((psa.total_orders / (SELECT COUNT(DISTINCT order_id) FROM orders WHERE order_status = 'completed' 
                                   AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY))) * 
               (psb.total_orders / (SELECT COUNT(DISTINCT order_id) FROM orders WHERE order_status = 'completed' 
                                   AND order_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)))), 2) as lift
    FROM product_pairs pp
    JOIN products pa ON pp.product_a = pa.product_id
    JOIN products pb ON pp.product_b = pb.product_id  
    JOIN product_stats psa ON pp.product_a = psa.product_id
    JOIN product_stats psb ON pp.product_b = psb.product_id
)
SELECT 
    product_a,
    product_a_name,
    product_b,
    product_b_name,
    co_occurrence_count,
    support_pct,
    confidence_a_to_b,
    confidence_b_to_a,
    lift,
    -- 關聯強度分級
    CASE 
        WHEN lift >= 2.0 AND confidence_a_to_b >= 30 THEN 'Strong'
        WHEN lift >= 1.5 AND confidence_a_to_b >= 20 THEN 'Moderate'  
        WHEN lift >= 1.2 AND confidence_a_to_b >= 10 THEN 'Weak'
        ELSE 'Very Weak'
    END as association_strength,
    -- 推薦策略
    CASE 
        WHEN confidence_a_to_b > confidence_b_to_a THEN CONCAT('Recommend ', product_b_name, ' when buying ', product_a_name)
        WHEN confidence_b_to_a > confidence_a_to_b THEN CONCAT('Recommend ', product_a_name, ' when buying ', product_b_name)
        ELSE 'Bundle promotion for both products'
    END as recommendation_strategy
FROM association_rules
WHERE lift > 1.0  -- 只顯示有正向關聯的商品對
ORDER BY lift DESC, confidence_a_to_b DESC
LIMIT 50;
```

---

## 實施建議

### 資料基礎建設優先順序：

**第一階段（立即實施）：**
1. 完善 `order_items` 和 `products` 表的資料完整性
2. 建立產品銷量排行和基礎趨勢分析
3. 設定核心銷售指標監控

**第二階段（1-2週內）：**
1. 整合客戶地址資料建立地區分析


==============================================================

# 客服主管視角：完整分析架構

## 核心關注點
**「客戶滿意嗎？服務效率如何？問題在哪？如何預防？團隊負荷合理嗎？」**

---

## 圖表1：客戶體驗儀表板

### 1.1 NPS趨勢線圖

**最終目標：**
- 追蹤客戶滿意度變化趨勢
- 識別服務品質的波動原因
- 評估改善措施的實際效果

**分析邏輯：**
```
客戶滿意度趨勢 = f(時間序列 + 滿意度評分)
├── NPS計算：推薦者% - 批評者%
├── 趨勢分析：移動平均 + 季節性調整
├── 異常檢測：識別滿意度驟降時點
└── 相關性分析：滿意度 vs 業務指標關聯
```

**必要資料欄位：**
```sql
-- 客戶滿意度調查表：customer_satisfaction
survey_id         VARCHAR(50)    -- 調查ID
customer_id       VARCHAR(50)    -- 客戶ID
order_id          VARCHAR(50)    -- 相關訂單ID
survey_date       DATE           -- 調查日期
nps_score         INT            -- NPS評分(0-10)
satisfaction_score INT           -- 滿意度評分(1-5)
service_rating    INT            -- 服務評分(1-5)
product_rating    INT            -- 產品評分(1-5)
likelihood_repurchase INT        -- 再購意願(1-5)
feedback_text     TEXT           -- 文字回饋
survey_channel    VARCHAR(30)    -- 調查渠道(email/sms/app)
```

**衍生計算邏輯：**
```sql
-- NPS月度趨勢計算
WITH nps_monthly AS (
    SELECT 
        DATE_FORMAT(survey_date, '%Y-%m') as month,
        COUNT(*) as total_responses,
        
        -- NPS分類統計
        SUM(CASE WHEN nps_score >= 9 THEN 1 ELSE 0 END) as promoters,
        SUM(CASE WHEN nps_score BETWEEN 7 AND 8 THEN 1 ELSE 0 END) as passives,
        SUM(CASE WHEN nps_score <= 6 THEN 1 ELSE 0 END) as detractors,
        
        -- NPS計算
        ROUND(
            (SUM(CASE WHEN nps_score >= 9 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) -
            (SUM(CASE WHEN nps_score <= 6 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 1
        ) as nps_score,
        
        -- 其他滿意度指標
        ROUND(AVG(satisfaction_score), 2) as avg_satisfaction,
        ROUND(AVG(service_rating), 2) as avg_service_rating,
        ROUND(AVG(product_rating), 2) as avg_product_rating
        
    FROM customer_satisfaction 
    WHERE survey_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
    GROUP BY month
),
nps_with_trend AS (
    SELECT 
        *,
        LAG(nps_score) OVER (ORDER BY month) as prev_month_nps,
        AVG(nps_score) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as nps_3month_avg,
        ROUND(nps_score - LAG(nps_score) OVER (ORDER BY month), 1) as nps_change
    FROM nps_monthly
)
SELECT * FROM nps_with_trend ORDER BY month;
```

### 1.2 滿意度驅動因子分析

**最終目標：**
- 找出影響滿意度的關鍵因素
- 優先改善對滿意度影響最大的環節

**分析邏輯：**
```
滿意度驅動因子 = 相關性分析 + 回歸分析
├── 服務因子：回應速度、解決率、服務態度
├── 產品因子：品質、價格、功能滿足度
├── 流程因子：下單、配送、售後流程
└── 權重分析：各因子對整體滿意度的影響權重
```

**必要資料欄位：**
```sql
-- 服務績效表：service_performance
ticket_id         VARCHAR(50)    -- 工單ID
customer_id       VARCHAR(50)    -- 客戶ID
created_date      DATETIME       -- 建立時間
first_response_time DATETIME     -- 首次回應時間
resolved_time     DATETIME       -- 解決時間
agent_id          VARCHAR(50)    -- 客服人員ID
issue_category    VARCHAR(50)    -- 問題分類
issue_priority    VARCHAR(20)    -- 優先級(high/medium/low)
resolution_status VARCHAR(20)    -- 解決狀態
customer_effort_score INT        -- 客戶努力分數(1-5)

-- 滿意度驅動因子分析
WITH service_metrics AS (
    SELECT 
        sp.customer_id,
        sp.ticket_id,
        -- 服務效率指標
        TIMESTAMPDIFF(MINUTE, sp.created_date, sp.first_response_time) as response_time_minutes,
        TIMESTAMPDIFF(HOUR, sp.created_date, sp.resolved_time) as resolution_time_hours,
        CASE WHEN sp.resolution_status = 'resolved' THEN 1 ELSE 0 END as is_resolved,
        sp.customer_effort_score,
        
        -- 關聯滿意度評分
        cs.nps_score,
        cs.satisfaction_score,
        cs.service_rating
    FROM service_performance sp
    LEFT JOIN customer_satisfaction cs ON sp.customer_id = cs.customer_id 
        AND DATE(sp.resolved_time) = DATE(cs.survey_date)
    WHERE sp.resolved_time IS NOT NULL
),
correlation_analysis AS (
    SELECT 
        'Response Time' as factor,
        ROUND(
            (COUNT(*) * SUM(response_time_minutes * service_rating) - SUM(response_time_minutes) * SUM(service_rating)) /
            SQRT((COUNT(*) * SUM(response_time_minutes * response_time_minutes) - SUM(response_time_minutes) * SUM(response_time_minutes)) *
                 (COUNT(*) * SUM(service_rating * service_rating) - SUM(service_rating) * SUM(service_rating))), 3
        ) as correlation_coefficient
    FROM service_metrics WHERE response_time_minutes IS NOT NULL AND service_rating IS NOT NULL
    
    UNION ALL
    
    SELECT 
        'Resolution Time' as factor,
        ROUND(
            (COUNT(*) * SUM(resolution_time_hours * service_rating) - SUM(resolution_time_hours) * SUM(service_rating)) /
            SQRT((COUNT(*) * SUM(resolution_time_hours * resolution_time_hours) - SUM(resolution_time_hours) * SUM(resolution_time_hours)) *
                 (COUNT(*) * SUM(service_rating * service_rating) - SUM(service_rating) * SUM(service_rating))), 3
        ) as correlation_coefficient
    FROM service_metrics WHERE resolution_time_hours IS NOT NULL AND service_rating IS NOT NULL
    
    UNION ALL
    
    SELECT 
        'Customer Effort' as factor,
        ROUND(
            (COUNT(*) * SUM(customer_effort_score * service_rating) - SUM(customer_effort_score) * SUM(service_rating)) /
            SQRT((COUNT(*) * SUM(customer_effort_score * customer_effort_score) - SUM(customer_effort_score) * SUM(customer_effort_score)) *
                 (COUNT(*) * SUM(service_rating * service_rating) - SUM(service_rating) * SUM(service_rating))), 3
        ) as correlation_coefficient
    FROM service_metrics WHERE customer_effort_score IS NOT NULL AND service_rating IS NOT NULL
)
SELECT * FROM correlation_analysis ORDER BY ABS(correlation_coefficient) DESC;
```

### 1.3 問題分類樹狀圖

**最終目標：**
- 了解客戶最常遇到的問題類型
- 識別需要優先解決的系統性問題
- 指導FAQ和自助服務內容建設

**分析邏輯：**
```
問題分類分析 = 層級分類 + 頻率統計
├── 一級分類：訂單、產品、配送、帳戶、其他
├── 二級分類：各一級分類下的具體問題
├── 頻率排序：按發生頻率排列優先級
└── 趨勢分析：問題類型的時間變化趨勢
```

**必要資料欄位：**
```sql
-- 問題分類表：issue_categories
category_id       VARCHAR(50)    -- 分類ID
parent_category_id VARCHAR(50)   -- 父分類ID
category_name     VARCHAR(100)   -- 分類名稱
category_level    INT            -- 分類層級
is_active         BOOLEAN        -- 是否啟用

-- 工單詳細表：support_tickets
ticket_id         VARCHAR(50)    -- 工單ID
customer_id       VARCHAR(50)    -- 客戶ID
subject           VARCHAR(200)   -- 標題
description       TEXT           -- 問題描述
primary_category  VARCHAR(50)    -- 主要分類
secondary_category VARCHAR(50)   -- 次要分類
created_date      DATETIME       -- 建立時間
updated_date      DATETIME       -- 更新時間
status            VARCHAR(20)    -- 狀態
priority          VARCHAR(20)    -- 優先級
assigned_agent    VARCHAR(50)    -- 指派客服
tags              VARCHAR(200)   -- 標籤
channel           VARCHAR(30)    -- 來源渠道

-- 問題分類統計分析
WITH issue_hierarchy AS (
    SELECT 
        st.primary_category,
        st.secondary_category,
        ic1.category_name as primary_name,
        ic2.category_name as secondary_name,
        COUNT(*) as ticket_count,
        AVG(TIMESTAMPDIFF(HOUR, st.created_date, st.updated_date)) as avg_resolution_hours,
        SUM(CASE WHEN st.status = 'resolved' THEN 1 ELSE 0 END) as resolved_count,
        ROUND(SUM(CASE WHEN st.status = 'resolved' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as resolution_rate
    FROM support_tickets st
    LEFT JOIN issue_categories ic1 ON st.primary_category = ic1.category_id
    LEFT JOIN issue_categories ic2 ON st.secondary_category = ic2.category_id
    WHERE st.created_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
    GROUP BY st.primary_category, st.secondary_category, ic1.category_name, ic2.category_name
),
category_totals AS (
    SELECT 
        primary_category,
        primary_name,
        SUM(ticket_count) as total_tickets,
        ROUND(SUM(ticket_count) * 100.0 / (SELECT SUM(ticket_count) FROM issue_hierarchy), 1) as category_percentage,
        ROUND(AVG(avg_resolution_hours), 1) as avg_category_resolution_hours
    FROM issue_hierarchy
    GROUP BY primary_category, primary_name
)
SELECT 
    ih.primary_name,
    ih.secondary_name,
    ih.ticket_count,
    ROUND(ih.ticket_count * 100.0 / ct.total_tickets, 1) as subcategory_percentage,
    ih.avg_resolution_hours,
    ih.resolution_rate,
    ct.category_percentage,
    ROW_NUMBER() OVER (PARTITION BY ih.primary_category ORDER BY ih.ticket_count DESC) as rank_in_category
FROM issue_hierarchy ih
JOIN category_totals ct ON ih.primary_category = ct.primary_category
ORDER BY ct.total_tickets DESC, ih.ticket_count DESC;
```

---

## 圖表2：服務優化地圖

### 2.1 服務效率分析儀表板

**最終目標：**
- 監控團隊服務效率是否達標
- 識別效率瓶頸和改善機會
- 合理配置人力資源

**分析邏輯：**
```
服務效率評估 = 時效性 + 品質性 + 工作量
├── 時效指標：首次回應時間、解決時間、SLA達成率
├── 品質指標：一次解決率、客戶滿意度、投訴率
├── 工作量指標：處理工單數、忙碌率、超時率
└── 綜合評分：加權平均各維度表現
```

**必要資料欄位：**
```sql
-- 客服人員表：support_agents
agent_id          VARCHAR(50)    -- 客服ID
agent_name        VARCHAR(100)   -- 姓名
team_id           VARCHAR(50)    -- 團隊ID
hire_date         DATE           -- 入職日期
skill_level       VARCHAR(20)    -- 技能等級
is_active         BOOLEAN        -- 是否在職
work_schedule     VARCHAR(100)   -- 工作時間表

-- 工作時間記錄表：agent_working_hours
record_id         VARCHAR(50)    -- 記錄ID
agent_id          VARCHAR(50)    -- 客服ID
work_date         DATE           -- 工作日期
shift_start       TIME           -- 班次開始
shift_end         TIME           -- 班次結束
break_duration    INT            -- 休息時間(分鐘)
actual_work_hours DECIMAL(4,2)   -- 實際工作時間

-- SLA標準表：sla_standards
priority          VARCHAR(20)    -- 優先級
first_response_target INT        -- 首次回應目標(分鐘)
resolution_target INT            -- 解決時間目標(小時)

-- 服務效率綜合分析
WITH agent_performance AS (
    SELECT 
        sa.agent_id,
        sa.agent_name,
        sa.team_id,
        
        -- 工作量指標
        COUNT(st.ticket_id) as total_tickets,
        SUM(awh.actual_work_hours) as total_work_hours,
        ROUND(COUNT(st.ticket_id) / NULLIF(SUM(awh.actual_work_hours), 0), 1) as tickets_per_hour,
        
        -- 時效指標
        ROUND(AVG(TIMESTAMPDIFF(MINUTE, st.created_date, st.first_response_time)), 1) as avg_response_minutes,
        ROUND(AVG(TIMESTAMPDIFF(HOUR, st.created_date, st.resolved_time)), 1) as avg_resolution_hours,
        
        -- SLA達成率
        ROUND(
            SUM(CASE 
                WHEN TIMESTAMPDIFF(MINUTE, st.created_date, st.first_response_time) <= sla.first_response_target 
                THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
        ) as first_response_sla_rate,
        
        ROUND(
            SUM(CASE 
                WHEN TIMESTAMPDIFF(HOUR, st.created_date, st.resolved_time) <= sla.resolution_target 
                THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
        ) as resolution_sla_rate,
        
        -- 品質指標
        ROUND(
            SUM(CASE WHEN st.status = 'resolved' AND st.reopened_count = 0 THEN 1 ELSE 0 END) * 100.0 / 
            NULLIF(SUM(CASE WHEN st.status = 'resolved' THEN 1 ELSE 0 END), 0), 1
        ) as first_contact_resolution_rate
        
    FROM support_agents sa
    LEFT JOIN support_tickets st ON sa.agent_id = st.assigned_agent
    LEFT JOIN agent_working_hours awh ON sa.agent_id = awh.agent_id 
        AND DATE(st.created_date) = awh.work_date
    LEFT JOIN sla_standards sla ON st.priority = sla.priority
    WHERE st.created_date >= DATE_SUB(CURRENT_DATE, INTERVAL 1 MONTH)
        AND sa.is_active = TRUE
    GROUP BY sa.agent_id, sa.agent_name, sa.team_id
),
performance_scores AS (
    SELECT 
        *,
        -- 效率評分 (0-100)
        LEAST(100, GREATEST(0, 100 - (avg_response_minutes - 30) * 2)) as response_score,
        LEAST(100, GREATEST(0, 100 - (avg_resolution_hours - 24) * 5)) as resolution_score,
        first_response_sla_rate as sla_score,
        first_contact_resolution_rate as quality_score,
        
        -- 綜合評分
        ROUND(
            (LEAST(100, GREATEST(0, 100 - (avg_response_minutes - 30) * 2)) * 0.25 +
             LEAST(100, GREATEST(0, 100 - (avg_resolution_hours - 24) * 5)) * 0.25 +
             first_response_sla_rate * 0.25 +
             first_contact_resolution_rate * 0.25), 1
        ) as overall_score
    FROM agent_performance
)
SELECT * FROM performance_scores ORDER BY overall_score DESC;
```

### 2.2 客訴熱點分析

**最終目標：**
- 識別最容易引起客訴的問題點
- 分析客訴的根本原因
- 制定預防性改善措施

**分析邏輯：**
```
客訴分析 = 問題聚類 + 根因分析 + 影響評估
├── 熱點識別：高頻客訴問題分類
├── 根因分析：問題產生的源頭環節
├── 影響評估：客訴對業務的影響程度
└── 改善建議：基於分析結果的行動方案
```

**必要資料欄位：**
```sql
-- 客訴記錄表：complaints
complaint_id      VARCHAR(50)    -- 客訴ID
customer_id       VARCHAR(50)    -- 客戶ID
order_id          VARCHAR(50)    -- 相關訂單
complaint_date    DATETIME       -- 客訴時間
complaint_type    VARCHAR(50)    -- 客訴類型
complaint_source  VARCHAR(30)    -- 客訴來源
severity_level    VARCHAR(20)    -- 嚴重程度
description       TEXT           -- 問題描述
root_cause        VARCHAR(100)   -- 根本原因
responsible_dept  VARCHAR(50)    -- 責任部門
resolution_action TEXT           -- 解決方案
resolution_date   DATETIME       -- 解決時間
compensation_amount DECIMAL(8,2) -- 補償金額
customer_satisfied BOOLEAN       -- 客戶是否滿意解決方案

-- 產品信息表：products
product_id        VARCHAR(50)    -- 產品ID
product_name      VARCHAR(200)   -- 產品名稱
category_id       VARCHAR(50)    -- 產品類別
brand             VARCHAR(100)   -- 品牌
price             DECIMAL(8,2)   -- 價格

-- 客訴熱點綜合分析
WITH complaint_analysis AS (
    SELECT 
        c.complaint_type,
        c.root_cause,
        c.responsible_dept,
        c.severity_level,
        
        -- 頻率統計
        COUNT(*) as complaint_count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as complaint_percentage,
        
        -- 時效統計
        ROUND(AVG(TIMESTAMPDIFF(HOUR, c.complaint_date, c.resolution_date)), 1) as avg_resolution_hours,
        
        -- 成本統計
        ROUND(AVG(c.compensation_amount), 2) as avg_compensation,
        SUM(c.compensation_amount) as total_compensation,
        
        -- 滿意度統計
        ROUND(SUM(CASE WHEN c.customer_satisfied = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as resolution_satisfaction_rate,
        
        -- 關聯業務影響
        COUNT(DISTINCT c.customer_id) as affected_customers,
        COUNT(DISTINCT c.order_id) as affected_orders
        
    FROM complaints c
    WHERE c.complaint_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
    GROUP BY c.complaint_type, c.root_cause, c.responsible_dept, c.severity_level
),
product_complaint_analysis AS (
    SELECT 
        p.category_id,
        p.brand,
        COUNT(c.complaint_id) as product_complaints,
        ROUND(AVG(c.compensation_amount), 2) as avg_product_compensation,
        STRING_AGG(DISTINCT c.complaint_type, ', ') as common_complaint_types
    FROM complaints c
    JOIN orders o ON c.order_id = o.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN products p ON oi.product_id = p.product_id
    WHERE c.complaint_date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
    GROUP BY p.category_id, p.brand
    HAVING COUNT(c.complaint_id) > 5
)
SELECT 
    ca.*,
    -- 風險評分 (頻率 × 嚴重程度 × 解決難度)
    ROUND(
        (ca.complaint_count * 
         CASE ca.severity_level 
             WHEN 'high' THEN 3 
             WHEN 'medium' THEN 2 
             ELSE 1 END *
         CASE WHEN ca.avg_resolution_hours > 48 THEN 2 ELSE 1 END), 1
    ) as risk_score
FROM complaint_analysis ca
ORDER BY risk_score DESC, complaint_count DESC;
```

### 2.3 服務負荷預測圖

**最終目標：**
- 預測未來服務需求變化
- 合理安排人力排班
- 避免服務品質因人力不足而下降

**分析邏輯：**
```
負荷預測 = 歷史模式 + 季節性因子 + 業務增長
├── 歷史模式：分析過去工單量的時間規律
├── 季節性因子：節假日、促銷活動的影響
├── 業務增長：考慮用戶增長對服務需求的影響
└── 預測模型：時間序列預測 + 回歸分析
```

**必要資料欄位：**
```sql
-- 業務活動表：business_events
event_id          VARCHAR(50)    -- 事件ID
event_name        VARCHAR(200)   -- 事件名稱
event_type        VARCHAR(50)    -- 事件類型(promotion/holiday/product_launch)
start_date        DATE           -- 開始日期
end_date          DATE           -- 結束日期
expected_impact   VARCHAR(20)    -- 預期影響(high/medium/low)

-- 人力排班表：agent_schedule
schedule_id       VARCHAR(50)    -- 排班ID
agent_id          VARCHAR(50)    -- 客服ID
work_date         DATE           -- 工作日期
shift_type        VARCHAR(30)    -- 班次類型
planned_hours     DECIMAL(4,2)   -- 計劃工時
actual_hours      DECIMAL(4,2)   -- 實際工時

-- 服務負荷預測分析
WITH daily_workload AS (
    SELECT 
        DATE(created_date) as work_date,
        COUNT(*) as daily_tickets,
        SUM(TIMESTAMPDIFF(MINUTE, created_date, COALESCE(resolved_time, updated_date))) as total_handling_minutes,
        COUNT(DISTINCT assigned_agent) as active_agents,
        
        -- 工單類型分布
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_tickets,
        SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority_tickets,
        SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority_tickets,
        
        -- 渠道分布
        SUM(CASE WHEN channel = 'phone' THEN 1 ELSE 0 END) as phone_tickets,
        SUM(CASE WHEN channel = 'email' THEN 1 ELSE 0 END) as email_tickets,
        SUM(CASE WHEN channel = 'chat' THEN 1 ELSE 0 END) as chat_tickets
        
    FROM support_tickets
    WHERE created_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
    GROUP BY DATE(created_date)
),
capacity_analysis AS (
    SELECT 
        work_date,
        SUM(planned_hours) as total_planned_hours,
        SUM(actual_hours) as total_actual_hours,
        COUNT(DISTINCT agent_id) as scheduled_agents
    FROM agent_schedule
    WHERE work_date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
    GROUP BY work_date
),
workload_with_capacity AS (
    SELECT 
        dw.*,
        ca.total_planned_hours,
        ca.total_actual_hours,
        ca.scheduled_agents,
        
        -- 負荷率計算
        ROUND(dw.total_handling_minutes / (ca.total_actual_hours * 60), 2) as workload_ratio,
        ROUND(dw.daily_tickets / ca.scheduled_agents, 1) as tickets_per_agent,
        
        -- 週數據標識
        DAYOFWEEK(dw.work_date) as day_of_week,
        WEEK(dw.work_date) as week_of_year,
        MONTH(dw.work_date) as month_of_year,
        
        -- 是否為特殊日期
        CASE WHEN be.event_id IS NOT NULL THEN 1 ELSE 0 END as is_special_day,
        be.event_type,
        be.expected_impact
        
    FROM daily_workload dw
    LEFT JOIN capacity_analysis ca ON dw.work_date = ca.work_date
    LEFT JOIN business_events be ON dw.work_date BETWEEN be.start_date AND be.end_date
),
seasonal_patterns AS (
    SELECT 
        day_of_week,
        ROUND(AVG(daily_tickets), 1) as avg_tickets_by_day,
        ROUND(AVG(workload_ratio), 2) as avg_workload_by_day,
        ROUND(STDDEV(daily_tickets), 1) as stddev_tickets_by_day
    FROM workload_with_capacity
    GROUP BY day_of_week
),
forecast_base AS (
    SELECT 
        -- 未來30天的日期
        DATE_ADD(CURRENT_DATE, INTERVAL seq.n DAY) as forecast_date,
        DAYOFWEEK(DATE_ADD(CURRENT_DATE, INTERVAL seq.n DAY)) as forecast_day_of_week
    FROM (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION 
        SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION 
        SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION 
        SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION 
        SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION 
        SELECT 25 UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29
    ) seq
)
SELECT 
    fb.forecast_date,
    fb.forecast_day_of_week,
    sp.avg_tickets_by_day as predicted_tickets,
    sp.avg_workload_by_day as predicted_workload_ratio,
    
    -- 建議人力配置
    CEILING(sp.avg_tickets_by_day / 15) as recommended_agents,  -- 假設每人每天處理15個工單
    
    -- 預測區間
    ROUND(sp.avg_tickets_by_day - 1.96 * sp.stddev_tickets_by_day, 0) as tickets_lower_bound,
    ROUND(sp.avg_tickets_by_day + 1.96 * sp.stddev_tickets_by_day, 0) as tickets_upper_bound,
    
    -- 特殊事件標記
    CASE WHEN be.event_id IS NOT NULL THEN 
        CONCAT(be.event_name, ' (', be.expected_impact, ' impact)')
    ELSE NULL END as special_events
    
FROM forecast_base fb
LEFT JOIN seasonal_patterns sp ON fb.forecast_day_of_week = sp.day_of_week
LEFT JOIN business_events be ON fb.forecast_date BETWEEN be.start_date AND be.end_date
ORDER BY fb.forecast_date;
```

---

## 圖表3：客戶情緒與滿意度監控

### 3.1 客戶情緒溫度計

**最終目標：**
- 即時監控客戶情緒變化
- 及早發現客戶不滿情況
- 評估改善措施的情緒影響

**分析邏輯：**
```
情緒分析 = 文本挖掘