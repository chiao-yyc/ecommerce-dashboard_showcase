-- ============================================
-- 分層歸因策略實作
-- 建立時間：2025-07-23 20:00:00
-- 目的：實作多維度活動歸因機制，解決重疊活動的營收歸因問題
-- ============================================

-- 第一步：暫時停用觸發器以避免衝突
DROP TRIGGER IF EXISTS update_campaign_in_dim_date_v2_trigger ON public.campaigns;

-- 擴展 campaigns 表支援分層歸因
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS attribution_layer TEXT DEFAULT 'general';

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS attribution_weight NUMERIC(3,2) DEFAULT 1.0;

-- 更新現有活動的分層資訊
UPDATE public.campaigns 
SET attribution_layer = CASE 
    WHEN campaign_type IN ('seasonal', 'holiday', 'anniversary', 'flash_sale') THEN 'site-wide'
    WHEN campaign_type IN ('membership', 'demographic') THEN 'target-oriented'  
    WHEN campaign_type IN ('category', 'product_launch', 'lifestyle') THEN 'category-specific'
    ELSE 'general'
END;

-- 設定活動權重
UPDATE public.campaigns 
SET attribution_weight = CASE 
    WHEN campaign_type = 'flash_sale' THEN 0.9
    WHEN campaign_type = 'seasonal' THEN 0.8
    WHEN campaign_type = 'holiday' THEN 0.7
    WHEN campaign_type = 'anniversary' THEN 0.6
    WHEN campaign_type = 'membership' THEN 0.5
    WHEN campaign_type = 'category' THEN 0.4
    WHEN campaign_type = 'product_launch' THEN 0.6
    WHEN campaign_type = 'lifestyle' THEN 0.4
    WHEN campaign_type = 'demographic' THEN 0.3
    ELSE 0.5
END;

-- 設定優先級分數（用於解決同等級衝突）
UPDATE public.campaigns 
SET priority_score = CASE 
    WHEN campaign_type = 'flash_sale' THEN 90
    WHEN campaign_type = 'seasonal' THEN 80
    WHEN campaign_type = 'holiday' THEN 75
    WHEN campaign_type = 'anniversary' THEN 70
    WHEN campaign_type = 'membership' THEN 60
    WHEN campaign_type = 'category' THEN 50
    WHEN campaign_type = 'product_launch' THEN 65
    WHEN campaign_type = 'lifestyle' THEN 45
    WHEN campaign_type = 'demographic' THEN 40
    ELSE 50
END;

-- 第二步：建立活動歸因計算函數
CREATE OR REPLACE FUNCTION calculate_campaign_attributions(
    target_date DATE,
    order_amount NUMERIC DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    active_campaigns JSONB := '[]';
    campaign_record RECORD;
    layer_totals JSONB := '{}';
    final_attributions JSONB := '[]';
    total_weight NUMERIC := 0;
    normalized_weight NUMERIC;
BEGIN
    -- 第一階段：找出所有活躍的活動
    FOR campaign_record IN 
        SELECT 
            c.id,
            c.campaign_name,
            c.campaign_type,
            c.attribution_layer,
            c.attribution_weight,
            c.priority_score,
            c.start_date,
            c.end_date
        FROM public.campaigns c
        WHERE target_date BETWEEN c.start_date AND c.end_date
        ORDER BY c.attribution_layer, c.priority_score DESC, c.attribution_weight DESC
    LOOP
        active_campaigns := active_campaigns || jsonb_build_object(
            'campaign_id', campaign_record.id,
            'campaign_name', campaign_record.campaign_name,
            'campaign_type', campaign_record.campaign_type,
            'attribution_layer', campaign_record.attribution_layer,
            'raw_weight', campaign_record.attribution_weight,
            'priority_score', campaign_record.priority_score,
            'period_start', campaign_record.start_date,
            'period_end', campaign_record.end_date
        );
    END LOOP;
    
    -- 第二階段：按層級正規化權重
    -- 計算每個層級的總權重
    SELECT jsonb_object_agg(
        layer,
        total_layer_weight
    ) INTO layer_totals
    FROM (
        SELECT 
            attribution->>'attribution_layer' as layer,
            SUM((attribution->>'raw_weight')::NUMERIC) as total_layer_weight
        FROM jsonb_array_elements(active_campaigns) as attribution
        GROUP BY attribution->>'attribution_layer'
    ) layer_weights;
    
    -- 第三階段：計算最終歸因權重
    FOR campaign_record IN 
        SELECT 
            attribution,
            (attribution->>'attribution_layer') as layer,
            (attribution->>'raw_weight')::NUMERIC as raw_weight
        FROM jsonb_array_elements(active_campaigns) as attribution
    LOOP
        -- 層級內正規化權重
        normalized_weight := campaign_record.raw_weight / 
            ((layer_totals->>campaign_record.layer)::NUMERIC);
        
        final_attributions := final_attributions || jsonb_build_object(
            'campaign_id', campaign_record.attribution->>'campaign_id',
            'campaign_name', campaign_record.attribution->>'campaign_name',
            'campaign_type', campaign_record.attribution->>'campaign_type',
            'attribution_layer', campaign_record.layer,
            'raw_weight', campaign_record.raw_weight,
            'normalized_weight', ROUND(normalized_weight, 4),
            'attribution_strength', CASE 
                WHEN normalized_weight >= 0.7 THEN 'dominant'
                WHEN normalized_weight >= 0.4 THEN 'significant'  
                WHEN normalized_weight >= 0.2 THEN 'moderate'
                ELSE 'minor'
            END,
            'period_start', campaign_record.attribution->>'period_start',
            'period_end', campaign_record.attribution->>'period_end'
        );
    END LOOP;
    
    RETURN jsonb_build_object(
        'attribution_date', target_date,
        'total_active_campaigns', jsonb_array_length(active_campaigns),
        'active_layers', (SELECT jsonb_agg(key) FROM jsonb_object_keys(layer_totals) AS key),
        'attributions', final_attributions,
        'layer_summary', layer_totals
    );
END;
$$ LANGUAGE plpgsql;

-- 第三步：建立營收歸因分析視圖
CREATE OR REPLACE VIEW revenue_attribution_analysis AS
WITH order_attributions AS (
    SELECT 
        o.id as order_id,
        o.user_id,
        o.total_amount,
        o.created_at::date as order_date,
        o.status,
        calculate_campaign_attributions(o.created_at::date, o.total_amount) as attribution_data
    FROM public.orders o 
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    AND o.total_amount IS NOT NULL
),
expanded_attributions AS (
    SELECT 
        oa.order_id,
        oa.order_date,
        oa.total_amount,
        oa.user_id,
        (oa.attribution_data->>'total_active_campaigns')::INTEGER as concurrent_campaigns,
        
        -- 展開每個歸因
        (attribution->>'campaign_id')::UUID as campaign_id,
        attribution->>'campaign_name' as campaign_name,
        attribution->>'campaign_type' as campaign_type,
        attribution->>'attribution_layer' as attribution_layer,
        (attribution->>'raw_weight')::NUMERIC as raw_weight,
        (attribution->>'normalized_weight')::NUMERIC as normalized_weight,
        attribution->>'attribution_strength' as attribution_strength,
        
        -- 計算分配的營收（按正規化權重）
        oa.total_amount * (attribution->>'normalized_weight')::NUMERIC as attributed_revenue
        
    FROM order_attributions oa,
    LATERAL jsonb_array_elements(oa.attribution_data->'attributions') as attribution
)
SELECT 
    campaign_id,
    campaign_name,
    campaign_type,
    attribution_layer,
    
    -- 基本統計
    COUNT(DISTINCT order_id) as influenced_orders,
    SUM(attributed_revenue) as total_attributed_revenue,
    AVG(attributed_revenue) as avg_attributed_revenue,
    
    -- 權重統計
    AVG(normalized_weight) as avg_attribution_weight,
    MIN(normalized_weight) as min_attribution_weight,
    MAX(normalized_weight) as max_attribution_weight,
    
    -- 協作統計
    AVG(concurrent_campaigns::NUMERIC) as avg_concurrent_campaigns,
    COUNT(CASE WHEN concurrent_campaigns = 1 THEN 1 END) as exclusive_orders,
    COUNT(CASE WHEN concurrent_campaigns > 1 THEN 1 END) as collaborative_orders,
    
    -- 強度分佈
    COUNT(CASE WHEN attribution_strength = 'dominant' THEN 1 END) as dominant_attributions,
    COUNT(CASE WHEN attribution_strength = 'significant' THEN 1 END) as significant_attributions,
    COUNT(CASE WHEN attribution_strength = 'moderate' THEN 1 END) as moderate_attributions,
    COUNT(CASE WHEN attribution_strength = 'minor' THEN 1 END) as minor_attributions

FROM expanded_attributions
GROUP BY campaign_id, campaign_name, campaign_type, attribution_layer
ORDER BY total_attributed_revenue DESC;

-- 第四步：建立活動協作效果分析視圖
CREATE OR REPLACE VIEW campaign_collaboration_analysis AS
WITH order_attributions AS (
    SELECT 
        o.id as order_id,
        o.user_id,
        o.total_amount,
        o.created_at::date as order_date,
        o.status,
        calculate_campaign_attributions(o.created_at::date, o.total_amount) as attribution_data
    FROM public.orders o 
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    AND o.total_amount IS NOT NULL
),
expanded_attributions AS (
    SELECT 
        oa.order_id,
        oa.order_date,
        oa.total_amount,
        oa.user_id,
        (oa.attribution_data->>'total_active_campaigns')::INTEGER as concurrent_campaigns,
        
        -- 展開每個歸因
        (attribution->>'campaign_id')::UUID as campaign_id,
        attribution->>'campaign_name' as campaign_name,
        attribution->>'campaign_type' as campaign_type,
        attribution->>'attribution_layer' as attribution_layer,
        (attribution->>'raw_weight')::NUMERIC as raw_weight,
        (attribution->>'normalized_weight')::NUMERIC as normalized_weight,
        attribution->>'attribution_strength' as attribution_strength,
        
        -- 計算分配的營收（按正規化權重）
        oa.total_amount * (attribution->>'normalized_weight')::NUMERIC as attributed_revenue
        
    FROM order_attributions oa,
    LATERAL jsonb_array_elements(oa.attribution_data->'attributions') as attribution
),
campaign_combinations AS (
    SELECT 
        order_id,
        order_date,
        total_amount,
        concurrent_campaigns,
        STRING_AGG(
            campaign_name || ' (' || ROUND(normalized_weight * 100, 1) || '%)', 
            ' + ' 
            ORDER BY normalized_weight DESC
        ) as campaign_combination,
        ARRAY_AGG(attribution_layer ORDER BY normalized_weight DESC) as involved_layers,
        SUM(attributed_revenue) as total_distributed_revenue
    FROM expanded_attributions
    GROUP BY order_id, order_date, total_amount, concurrent_campaigns
),
collaboration_metrics AS (
    SELECT 
        concurrent_campaigns,
        campaign_combination,
        involved_layers,
        COUNT(*) as occurrence_count,
        SUM(total_amount) as combination_revenue,
        AVG(total_amount) as avg_order_value,
        AVG(total_distributed_revenue) as avg_distributed_revenue
    FROM campaign_combinations
    GROUP BY concurrent_campaigns, campaign_combination, involved_layers
)
SELECT 
    concurrent_campaigns,
    campaign_combination,
    involved_layers,
    occurrence_count,
    combination_revenue,
    avg_order_value,
    avg_distributed_revenue,
    ROUND(100.0 * combination_revenue / SUM(combination_revenue) OVER (), 2) as revenue_share_pct,
    CASE 
        WHEN concurrent_campaigns = 1 THEN 'single_campaign'
        WHEN concurrent_campaigns = 2 THEN 'dual_collaboration'
        WHEN concurrent_campaigns >= 3 THEN 'multi_collaboration'
    END as collaboration_type
FROM collaboration_metrics
ORDER BY combination_revenue DESC;

-- 第五步：建立活動重疊日曆視圖
CREATE OR REPLACE VIEW campaign_overlap_calendar AS
WITH daily_campaigns AS (
    SELECT 
        generate_series(c.start_date, c.end_date, '1 day'::interval)::date as date,
        c.id as campaign_id,
        c.campaign_name,
        c.campaign_type,
        c.attribution_layer,
        c.attribution_weight,
        c.priority_score
    FROM public.campaigns c
),
daily_summary AS (
    SELECT 
        dc.date,
        COUNT(*) as concurrent_campaigns,
        STRING_AGG(dc.campaign_name, ' | ' ORDER BY dc.priority_score DESC) as campaigns_list,
        ARRAY_AGG(DISTINCT dc.attribution_layer ORDER BY dc.attribution_layer) as active_layers,
        ARRAY_AGG(dc.campaign_type ORDER BY dc.priority_score DESC) as campaign_types,
        AVG(dc.attribution_weight) as avg_attribution_weight,
        
        -- 假期資訊
        d.is_holiday,
        d.is_weekend,
        h.name as holiday_name
    FROM daily_campaigns dc
    LEFT JOIN public.dim_date d ON dc.date = d.date
    LEFT JOIN public.holidays h ON dc.date = h.date
    GROUP BY dc.date, d.is_holiday, d.is_weekend, h.name
)
SELECT 
    date,
    concurrent_campaigns,
    campaigns_list,
    active_layers,
    campaign_types,
    ROUND(avg_attribution_weight, 3) as avg_attribution_weight,
    is_holiday,
    is_weekend,
    holiday_name,
    
    -- 複雜度評分
    CASE 
        WHEN concurrent_campaigns = 1 THEN 'simple'
        WHEN concurrent_campaigns = 2 THEN 'moderate'
        WHEN concurrent_campaigns >= 3 THEN 'complex'
    END as complexity_level,
    
    -- 特殊日期標記
    CASE 
        WHEN is_holiday AND concurrent_campaigns >= 2 THEN 'holiday_multi_campaign'
        WHEN is_weekend AND concurrent_campaigns >= 2 THEN 'weekend_multi_campaign'
        WHEN concurrent_campaigns >= 3 THEN 'high_intensity'
        ELSE 'normal'
    END as special_flags

FROM daily_summary
ORDER BY date;

-- 第六步：建立歸因效果比較函數
CREATE OR REPLACE FUNCTION compare_attribution_methods(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    comparison_metric TEXT,
    traditional_value NUMERIC,
    layered_value NUMERIC,
    difference_value NUMERIC,
    difference_percentage NUMERIC
) AS $$
BEGIN
    -- 總營收比較
    RETURN QUERY
    WITH traditional_total AS (
        SELECT SUM(o.total_amount) as total_revenue
        FROM public.orders o
        WHERE o.created_at::date BETWEEN start_date AND end_date
        AND o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    ),
    layered_total AS (
        SELECT SUM(total_attributed_revenue) as total_revenue
        FROM revenue_attribution_analysis
    )
    SELECT 
        'Total Revenue' as comparison_metric,
        tt.total_revenue,
        lt.total_revenue,
        (lt.total_revenue - tt.total_revenue),
        ROUND(100.0 * (lt.total_revenue - tt.total_revenue) / NULLIF(tt.total_revenue, 0), 2)
    FROM traditional_total tt, layered_total lt;
    
    -- 活動覆蓋率比較
    RETURN QUERY
    WITH traditional_coverage AS (
        SELECT COUNT(DISTINCT c.id) as covered_campaigns
        FROM public.campaigns c
        WHERE EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.created_at::date BETWEEN c.start_date AND c.end_date
            AND o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
        )
    ),
    layered_coverage AS (
        SELECT COUNT(DISTINCT campaign_id) as covered_campaigns
        FROM revenue_attribution_analysis
        WHERE total_attributed_revenue > 0
    )
    SELECT 
        'Campaign Coverage' as comparison_metric,
        tc.covered_campaigns::NUMERIC,
        lc.covered_campaigns::NUMERIC,
        (lc.covered_campaigns - tc.covered_campaigns)::NUMERIC,
        ROUND(100.0 * (lc.covered_campaigns - tc.covered_campaigns)::NUMERIC / NULLIF(tc.covered_campaigns, 0), 2)
    FROM traditional_coverage tc, layered_coverage lc;
END;
$$ LANGUAGE plpgsql;

-- 第七步：建立歸因品質檢查函數
CREATE OR REPLACE FUNCTION check_attribution_quality()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    value NUMERIC,
    description TEXT
) AS $$
BEGIN
    -- 檢查歸因總和是否平衡
    RETURN QUERY
    WITH balance_check AS (
        SELECT 
            SUM(o.total_amount) as original_total,
            SUM(ea.attributed_revenue) as attributed_total
        FROM public.orders o
        JOIN (
            SELECT DISTINCT order_id, SUM(attributed_revenue) as attributed_revenue
            FROM (
                SELECT 
                    order_id,
                    total_amount * (attribution->>'normalized_weight')::NUMERIC as attributed_revenue
                FROM (
                    SELECT 
                        o2.id as order_id,
                        o2.total_amount,
                        calculate_campaign_attributions(o2.created_at::date, o2.total_amount) as attribution_data
                    FROM public.orders o2 
                    WHERE o2.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
                ) attr,
                LATERAL jsonb_array_elements(attr.attribution_data->'attributions') as attribution
            ) distributed
            GROUP BY order_id
        ) ea ON o.id = ea.order_id
    )
    SELECT 
        'Revenue Balance' as check_name,
        CASE 
            WHEN ABS(original_total - attributed_total) < 0.01 THEN 'PASS'
            WHEN ABS(original_total - attributed_total) / original_total < 0.001 THEN 'WARNING'
            ELSE 'FAIL'
        END as status,
        ABS(original_total - attributed_total) as value,
        format('原始營收: %s, 歸因營收: %s, 差異: %s', 
               original_total, attributed_total, ABS(original_total - attributed_total)) as description
    FROM balance_check;
    
    -- 檢查權重分佈合理性
    RETURN QUERY
    SELECT 
        'Weight Distribution' as check_name,
        'INFO' as status,
        AVG(normalized_weight) as value,
        format('平均歸因權重: %s', ROUND(AVG(normalized_weight), 4)) as description
    FROM (
        SELECT (attribution->>'normalized_weight')::NUMERIC as normalized_weight
        FROM (
            SELECT calculate_campaign_attributions(CURRENT_DATE) as attribution_data
        ) test,
        LATERAL jsonb_array_elements(test.attribution_data->'attributions') as attribution
    ) weights;
END;
$$ LANGUAGE plpgsql;

-- 重新啟用觸發器
CREATE TRIGGER update_campaign_in_dim_date_v2_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_in_dim_date_v2();

-- 建立完成報告
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 分層歸因策略實作完成';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ 已完成的功能：';
    RAISE NOTICE '1. 活動分層分類 (site-wide, target-oriented, category-specific)';
    RAISE NOTICE '2. 智慧歸因權重計算';
    RAISE NOTICE '3. 營收分配演算法';
    RAISE NOTICE '4. 活動協作效果分析';
    RAISE NOTICE '5. 重疊日曆視圖';
    RAISE NOTICE '';
    RAISE NOTICE '📊 新增的分析視圖：';
    RAISE NOTICE '- revenue_attribution_analysis: 核心歸因分析';
    RAISE NOTICE '- campaign_collaboration_analysis: 活動協作效果';
    RAISE NOTICE '- campaign_overlap_calendar: 活動重疊日曆';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 管理函數：';
    RAISE NOTICE '- calculate_campaign_attributions(): 計算特定日期的歸因';
    RAISE NOTICE '- compare_attribution_methods(): 比較歸因方法效果';
    RAISE NOTICE '- check_attribution_quality(): 檢查歸因品質';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 使用範例：';
    RAISE NOTICE '- 查看活動歸因：SELECT * FROM revenue_attribution_analysis;';
    RAISE NOTICE '- 分析協作效果：SELECT * FROM campaign_collaboration_analysis;';
    RAISE NOTICE '- 檢查歸因品質：SELECT * FROM check_attribution_quality();';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;