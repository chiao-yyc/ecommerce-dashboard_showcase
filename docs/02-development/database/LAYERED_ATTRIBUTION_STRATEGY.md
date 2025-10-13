# 分層歸因策略設計

## 核心理念

**「一筆營收可以同時歸因給多個活動，但需要明確區分不同層級的歸因關係」**

## 分層歸因架構

### **第一層：活動類型分層**

不同類型的活動可以同時進行，互不衝突：

```
📱 全站活動層 (Site-wide)
├── 季節性活動：新年大促銷、夏日狂歡節
├── 假期活動：母親節溫馨獻禮、端午佳節慶典
└── 品牌活動：品牌週年慶、限時閃購48小時

🎯 目標導向層 (Target-oriented)  
├── 會員活動：會員專屬VIP日、新會員招募季
├── 人群活動：學生專屬優惠月
└── 產品活動：春季新品上市

🛍️ 品類專屬層 (Category-specific)
├── 夏季服飾特惠週
├── 居家生活節  
└── 戶外用品促銷
```

### **第二層：影響強度分層**

```
🔴 直接影響 (Direct Attribution)
- 用戶透過活動頁面/廣告直接進入購買
- 使用活動專屬優惠碼
- 在活動商品頁面下單

🟡 間接影響 (Indirect Attribution)  
- 活動期間的自然流量購買
- 受活動氛圍影響的非活動商品購買
- 活動帶來的品牌認知提升效果

🟢 環境影響 (Environmental Attribution)
- 假期期間的自然購買增長
- 季節性需求驅動的購買
- 市場整體趨勢影響
```

### **第三層：時間視窗分層**

```
⚡ 即時歸因 (0-1天)
- 活動當日的直接轉換

📈 短期歸因 (1-7天)  
- 活動引發的延遲購買
- 比較購物後的決策

📊 長期歸因 (7-30天)
- 活動對品牌忠誠度的影響
- 復購行為的改變
```

## 具體實作策略

### **策略一：多維度歸因表設計**

```sql
-- 建立活動歸因事實表
CREATE TABLE campaign_attribution_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    order_date DATE,
    order_amount NUMERIC(10,2),
    
    -- 主要歸因活動
    primary_campaign_id UUID REFERENCES campaigns(id),
    primary_attribution_weight NUMERIC(3,2) DEFAULT 1.0,
    
    -- 次要歸因活動（JSON陣列）
    secondary_campaigns JSONB,
    
    -- 歸因層級資訊
    attribution_layer TEXT, -- 'site-wide', 'target-oriented', 'category-specific'
    attribution_strength TEXT, -- 'direct', 'indirect', 'environmental'
    attribution_confidence NUMERIC(3,2), -- 0.0-1.0 信心度分數
    
    -- 時間視窗
    time_window TEXT, -- 'immediate', 'short-term', 'long-term'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **策略二：智慧歸因演算法**

```sql
-- 歸因權重計算函數
CREATE OR REPLACE FUNCTION calculate_attribution_weights(
    order_date DATE,
    order_amount NUMERIC,
    user_id UUID
) RETURNS JSONB AS $$
DECLARE
    active_campaigns JSONB := '[]';
    campaign_record RECORD;
    total_weight NUMERIC := 0;
    result JSONB;
BEGIN
    -- 找出該日期所有活躍的活動
    FOR campaign_record IN 
        SELECT c.*, 
               CASE 
                   WHEN c.campaign_type = 'flash_sale' THEN 0.8
                   WHEN c.campaign_type = 'seasonal' THEN 0.6
                   WHEN c.campaign_type = 'membership' THEN 0.4
                   ELSE 0.5
               END as base_weight
        FROM campaigns c
        WHERE order_date BETWEEN c.start_date AND c.end_date
    LOOP
        -- 計算歸因權重
        active_campaigns := active_campaigns || jsonb_build_object(
            'campaign_id', campaign_record.id,
            'campaign_name', campaign_record.campaign_name,
            'campaign_type', campaign_record.campaign_type,
            'layer', CASE 
                WHEN campaign_record.campaign_type IN ('seasonal', 'holiday', 'anniversary') THEN 'site-wide'
                WHEN campaign_record.campaign_type IN ('membership', 'demographic') THEN 'target-oriented'  
                WHEN campaign_record.campaign_type IN ('category', 'product_launch') THEN 'category-specific'
                ELSE 'general'
            END,
            'weight', campaign_record.base_weight,
            'attribution_reason', '活動期間重疊'
        );
    END LOOP;
    
    RETURN active_campaigns;
END;
$$ LANGUAGE plpgsql;
```

### **策略三：歸因視圖重構**

```sql
-- 新的營收歸因視圖
CREATE OR REPLACE VIEW revenue_attribution_analysis AS
WITH order_campaigns AS (
    SELECT 
        o.id as order_id,
        o.user_id,
        o.total_amount,
        o.created_at::date as order_date,
        calculate_attribution_weights(
            o.created_at::date, 
            o.total_amount, 
            o.user_id
        ) as campaign_attributions
    FROM orders o 
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
),
expanded_attributions AS (
    SELECT 
        oc.order_id,
        oc.order_date,
        oc.total_amount,
        (attribution->>'campaign_id')::UUID as campaign_id,
        attribution->>'campaign_name' as campaign_name,
        attribution->>'campaign_type' as campaign_type,
        attribution->>'layer' as attribution_layer,
        (attribution->>'weight')::NUMERIC as attribution_weight,
        -- 計算分配的營收
        oc.total_amount * (attribution->>'weight')::NUMERIC as attributed_revenue
    FROM order_campaigns oc,
    LATERAL jsonb_array_elements(oc.campaign_attributions) as attribution
)
SELECT 
    campaign_id,
    campaign_name,
    campaign_type,
    attribution_layer,
    COUNT(DISTINCT order_id) as influenced_orders,
    SUM(attributed_revenue) as total_attributed_revenue,
    AVG(attributed_revenue) as avg_attributed_revenue,
    SUM(attribution_weight) as total_attribution_weight,
    AVG(attribution_weight) as avg_attribution_strength
FROM expanded_attributions
GROUP BY campaign_id, campaign_name, campaign_type, attribution_layer
ORDER BY total_attributed_revenue DESC;
```

## 多角度分析視圖

### **1. 活動重疊分析**

```sql
CREATE VIEW campaign_overlap_analysis AS
WITH daily_campaigns AS (
    SELECT 
        generate_series(start_date, end_date, '1 day'::interval)::date as date,
        id as campaign_id,
        campaign_name,
        campaign_type
    FROM campaigns
),
overlap_summary AS (
    SELECT 
        date,
        COUNT(*) as concurrent_campaigns,
        STRING_AGG(campaign_name, ' + ' ORDER BY campaign_type) as campaign_combination,
        ARRAY_AGG(campaign_type ORDER BY campaign_type) as campaign_types
    FROM daily_campaigns
    GROUP BY date
)
SELECT 
    date,
    concurrent_campaigns,
    campaign_combination,
    campaign_types,
    CASE 
        WHEN concurrent_campaigns = 1 THEN 'single'
        WHEN concurrent_campaigns = 2 THEN 'dual_overlap'
        WHEN concurrent_campaigns >= 3 THEN 'multi_overlap'
    END as overlap_type
FROM overlap_summary
ORDER BY date;
```

### **2. 歸因效果比較**

```sql
CREATE VIEW attribution_effectiveness_comparison AS
WITH traditional_attribution AS (
    -- 傳統單一歸因方法的結果
    SELECT 
        c.id as campaign_id,
        c.campaign_name,
        COUNT(DISTINCT o.id) as traditional_orders,
        SUM(o.total_amount) as traditional_revenue
    FROM campaigns c
    LEFT JOIN orders o ON o.created_at::date BETWEEN c.start_date AND c.end_date
        AND o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    GROUP BY c.id, c.campaign_name
),
layered_attribution AS (
    -- 分層歸因方法的結果
    SELECT 
        campaign_id,
        campaign_name,
        influenced_orders as layered_orders,
        total_attributed_revenue as layered_revenue
    FROM revenue_attribution_analysis
)
SELECT 
    COALESCE(ta.campaign_id, la.campaign_id) as campaign_id,
    COALESCE(ta.campaign_name, la.campaign_name) as campaign_name,
    COALESCE(ta.traditional_orders, 0) as traditional_orders,
    COALESCE(ta.traditional_revenue, 0) as traditional_revenue,
    COALESCE(la.layered_orders, 0) as layered_orders,
    COALESCE(la.layered_revenue, 0) as layered_revenue,
    -- 計算差異
    (COALESCE(la.layered_revenue, 0) - COALESCE(ta.traditional_revenue, 0)) as revenue_difference,
    CASE 
        WHEN ta.traditional_revenue > 0 
        THEN ROUND(100.0 * (la.layered_revenue - ta.traditional_revenue) / ta.traditional_revenue, 2)
        ELSE NULL 
    END as revenue_difference_pct
FROM traditional_attribution ta
FULL OUTER JOIN layered_attribution la USING (campaign_id)
ORDER BY ABS(COALESCE(revenue_difference, 0)) DESC;
```

## 🎮 實際應用場景

### **場景一：春季活動組合分析**

```sql
-- 分析 2025年3月的活動組合效果
SELECT 
    oa.date,
    oa.campaign_combination,
    oa.concurrent_campaigns,
    SUM(o.total_amount) as daily_revenue,
    COUNT(DISTINCT o.id) as daily_orders
FROM campaign_overlap_analysis oa
LEFT JOIN orders o ON o.created_at::date = oa.date
WHERE oa.date BETWEEN '2025-03-01' AND '2025-03-31'
GROUP BY oa.date, oa.campaign_combination, oa.concurrent_campaigns
ORDER BY daily_revenue DESC;
```

### **場景二：活動貢獻度分析**

```sql
-- 分析每個活動在重疊期間的實際貢獻
SELECT 
    campaign_name,
    attribution_layer,
    total_attributed_revenue,
    avg_attribution_strength,
    -- 計算在重疊期間的貢獻比例
    ROUND(
        100.0 * total_attributed_revenue / 
        SUM(total_attributed_revenue) OVER (PARTITION BY attribution_layer), 
        2
    ) as layer_contribution_pct
FROM revenue_attribution_analysis
WHERE attribution_layer IS NOT NULL
ORDER BY attribution_layer, total_attributed_revenue DESC;
```

## 策略優勢

### **1. 消除重複計算**
- 每筆營收只計算一次，但可歸因給多個活動
- 使用權重分配避免總額不匹配

### **2. 保留業務洞察**
- 清楚顯示活動間的協同效應
- 量化不同類型活動的影響程度

### **3. 支援決策制定**
- 幫助識別最佳活動組合
- 優化活動排程和預算分配

### **4. 靈活擴展**
- 可輕鬆加入新的歸因維度
- 支援不同的業務歸因邏輯

## 📈 實施建議

### **階段一：基礎架構**
1. 建立歸因事實表
2. 實作權重計算演算法
3. 重構現有分析視圖

### **階段二：進階功能**  
1. 加入用戶行為追蹤
2. 實作機器學習歸因模型
3. 建立即時歸因分析

### **階段三：業務整合**
1. 整合行銷歸因平台
2. 建立自動化報告
3. 訓練業務團隊使用

這種分層歸因策略能夠真實反映複雜商業環境中的活動效果，同時保持資料分析的準確性和實用性。