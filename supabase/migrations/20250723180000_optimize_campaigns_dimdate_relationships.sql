-- ============================================
-- 資料庫優化：campaigns, dim_date, events, holidays 關係重構
-- 建立時間：2025-07-23 18:00:00
-- 目的：修復資料完整性問題，提升效能，建立正確的關聯關係
-- ============================================

-- 第一步：備份現有資料結構
-- 建立備份表以防萬一需要回滾

-- 備份 dim_date 資料
CREATE TABLE IF NOT EXISTS dim_date_backup AS 
SELECT * FROM public.dim_date;

-- 第二步：增加缺失的外鍵約束和索引

-- 為 campaigns 表增加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_campaigns_date_range 
ON public.campaigns (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_campaigns_type 
ON public.campaigns (campaign_type);

CREATE INDEX IF NOT EXISTS idx_campaigns_active_period 
ON public.campaigns (start_date, end_date, campaign_type) 
WHERE start_date IS NOT NULL AND end_date IS NOT NULL;

-- 為 events 表增加效能索引
CREATE INDEX IF NOT EXISTS idx_events_created_at 
ON public.events (created_at);

CREATE INDEX IF NOT EXISTS idx_events_type 
ON public.events (type);

CREATE INDEX IF NOT EXISTS idx_events_user_created 
ON public.events (user_id, created_at);

-- 為 funnel_events 表增加索引（如果存在）
CREATE INDEX IF NOT EXISTS idx_funnel_events_step 
ON public.funnel_events (step);

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_step 
ON public.funnel_events (user_id, step, event_at);

-- 第三步：改善 dim_date 表結構

-- 增加 campaign_id 欄位以建立正確的外鍵關係
ALTER TABLE public.dim_date 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 建立外鍵約束
ALTER TABLE public.dim_date 
ADD CONSTRAINT fk_dim_date_campaign 
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) 
ON DELETE SET NULL;

-- 第四步：資料遷移 - 將 campaign_name 轉換為 campaign_id

-- 建立臨時函數來更新 campaign_id
CREATE OR REPLACE FUNCTION migrate_campaign_names_to_ids()
RETURNS TEXT AS $$
DECLARE
    update_count INTEGER := 0;
    error_count INTEGER := 0;
    result_text TEXT;
BEGIN
    -- 更新 dim_date 表中的 campaign_id
    UPDATE public.dim_date 
    SET campaign_id = c.id
    FROM public.campaigns c
    WHERE dim_date.campaign_name = c.campaign_name
    AND dim_date.campaign_id IS NULL;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    -- 檢查未配對的 campaign_name
    SELECT COUNT(*) INTO error_count
    FROM public.dim_date d
    WHERE d.campaign_name IS NOT NULL 
    AND d.campaign_name != ''
    AND d.campaign_id IS NULL;
    
    result_text := format(
        '資料遷移完成: %s 筆記錄已更新, %s 筆記錄未找到對應的活動',
        update_count, error_count
    );
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- 執行資料遷移
SELECT migrate_campaign_names_to_ids();

-- 第五步：建立自動化的假期同步觸發器

-- 建立假期同步函數
CREATE OR REPLACE FUNCTION sync_holidays_to_dim_date()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- 更新 dim_date 中對應日期的 is_holiday 狀態
        UPDATE public.dim_date 
        SET is_holiday = TRUE 
        WHERE date = NEW.date;
        
        -- 如果 dim_date 中不存在該日期，則插入新記錄
        INSERT INTO public.dim_date (date, is_holiday, is_weekend)
        SELECT NEW.date, TRUE, EXTRACT(DOW FROM NEW.date) IN (0, 6)
        WHERE NOT EXISTS (
            SELECT 1 FROM public.dim_date WHERE date = NEW.date
        );
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- 移除假期標記
        UPDATE public.dim_date 
        SET is_holiday = FALSE 
        WHERE date = OLD.date;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 建立假期同步觸發器
DROP TRIGGER IF EXISTS trigger_sync_holidays ON public.holidays;
CREATE TRIGGER trigger_sync_holidays
    AFTER INSERT OR UPDATE OR DELETE ON public.holidays
    FOR EACH ROW
    EXECUTE FUNCTION sync_holidays_to_dim_date();

-- 第六步：改良現有的活動觸發器

-- 建立改良版的活動更新函數
CREATE OR REPLACE FUNCTION update_campaign_in_dim_date_v2()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- 更新活動期間內的所有日期
        UPDATE public.dim_date
        SET campaign_id = NEW.id
        WHERE date BETWEEN NEW.start_date AND NEW.end_date;
        
        -- 為不存在的日期插入新記錄
        INSERT INTO public.dim_date (date, campaign_id, is_weekend, is_holiday)
        SELECT 
            generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)::date as date,
            NEW.id,
            EXTRACT(DOW FROM generate_series(NEW.start_date, NEW.end_date, '1 day'::interval)) IN (0, 6),
            COALESCE(h.date IS NOT NULL, FALSE)
        FROM generate_series(NEW.start_date, NEW.end_date, '1 day'::interval) AS date_series
        LEFT JOIN public.holidays h ON h.date = date_series::date
        WHERE NOT EXISTS (
            SELECT 1 FROM public.dim_date d WHERE d.date = date_series::date
        );
        
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        -- 移除已刪除活動的關聯
        UPDATE public.dim_date
        SET campaign_id = NULL
        WHERE campaign_id = OLD.id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 替換舊的觸發器
DROP TRIGGER IF EXISTS update_campaign_name_on_insert ON public.campaigns;
DROP TRIGGER IF EXISTS update_campaign_in_dim_date_trigger ON public.campaigns;

CREATE TRIGGER update_campaign_in_dim_date_v2_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_in_dim_date_v2();

-- 第七步：為 events 表增加活動關聯功能

-- 為 events 表增加 campaign_id 欄位
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 建立外鍵約束
ALTER TABLE public.events 
ADD CONSTRAINT fk_events_campaign 
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) 
ON DELETE SET NULL;

-- 為 funnel_events 表也增加活動關聯
ALTER TABLE public.funnel_events 
ADD COLUMN IF NOT EXISTS campaign_id UUID;

ALTER TABLE public.funnel_events 
ADD CONSTRAINT fk_funnel_events_campaign 
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) 
ON DELETE SET NULL;

-- 第八步：建立資料驗證約束

-- 活動日期驗證
ALTER TABLE public.campaigns 
ADD CONSTRAINT chk_campaign_date_order 
CHECK (start_date <= end_date);

-- 活動名稱不能為空
ALTER TABLE public.campaigns 
ADD CONSTRAINT chk_campaign_name_not_empty 
CHECK (length(trim(campaign_name)) > 0);

-- 第九步：建立實用的查詢函數

-- 取得特定日期的活動資訊
CREATE OR REPLACE FUNCTION get_active_campaigns_for_date(target_date DATE)
RETURNS TABLE(
    campaign_id UUID,
    campaign_name TEXT,
    campaign_type TEXT,
    start_date DATE,
    end_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.campaign_name,
        c.campaign_type,
        c.start_date,
        c.end_date
    FROM public.campaigns c
    WHERE target_date BETWEEN c.start_date AND c.end_date
    ORDER BY c.start_date;
END;
$$ LANGUAGE plpgsql;

-- 檢查活動期間重疊的函數
CREATE OR REPLACE FUNCTION check_campaign_overlaps(
    campaign_start DATE,
    campaign_end DATE,
    exclude_campaign_id UUID DEFAULT NULL
)
RETURNS TABLE(
    overlapping_campaign_id UUID,
    overlapping_campaign_name TEXT,
    overlap_start DATE,
    overlap_end DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.campaign_name,
        GREATEST(c.start_date, campaign_start) as overlap_start,
        LEAST(c.end_date, campaign_end) as overlap_end
    FROM public.campaigns c
    WHERE c.id != COALESCE(exclude_campaign_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND c.start_date <= campaign_end
    AND c.end_date >= campaign_start
    ORDER BY c.start_date;
END;
$$ LANGUAGE plpgsql;

-- 第十步：建立改良的分析視圖

-- 活動效果分析視圖 (改良版)
CREATE OR REPLACE VIEW campaign_performance_enhanced AS
WITH campaign_metrics AS (
    SELECT 
        c.id as campaign_id,
        c.campaign_name,
        c.campaign_type,
        c.start_date,
        c.end_date,
        c.description,
        -- 計算活動期間的訂單指標
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.user_id) as unique_customers,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        -- 計算活動期間的事件指標
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT e.user_id) as unique_event_users,
        -- 計算活動持續天數
        (c.end_date - c.start_date + 1) as campaign_days
    FROM public.campaigns c
    LEFT JOIN public.orders o ON (
        o.created_at::date BETWEEN c.start_date AND c.end_date
        AND o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    )
    LEFT JOIN public.events e ON (
        e.created_at::date BETWEEN c.start_date AND c.end_date
    )
    GROUP BY c.id, c.campaign_name, c.campaign_type, 
             c.start_date, c.end_date, c.description
)
SELECT 
    *,
    -- 計算每日平均指標
    ROUND(total_revenue / GREATEST(campaign_days, 1), 2) as daily_avg_revenue,
    ROUND(total_orders::numeric / GREATEST(campaign_days, 1), 2) as daily_avg_orders,
    -- 計算轉換率
    CASE 
        WHEN unique_event_users > 0 
        THEN ROUND((unique_customers::numeric / unique_event_users) * 100, 2)
        ELSE 0 
    END as conversion_rate_pct
FROM campaign_metrics;

-- 第十一步：同步現有的假期資料

-- 建立函數來同步現有假期資料到 dim_date
CREATE OR REPLACE FUNCTION sync_existing_holidays()
RETURNS TEXT AS $$
DECLARE
    sync_count INTEGER := 0;
BEGIN
    -- 將所有現有假期同步到 dim_date
    INSERT INTO public.dim_date (date, is_holiday, is_weekend)
    SELECT 
        h.date,
        TRUE,
        EXTRACT(DOW FROM h.date) IN (0, 6)
    FROM public.holidays h
    WHERE NOT EXISTS (
        SELECT 1 FROM public.dim_date d WHERE d.date = h.date
    );
    
    GET DIAGNOSTICS sync_count = ROW_COUNT;
    
    -- 更新已存在的記錄
    UPDATE public.dim_date 
    SET is_holiday = TRUE
    FROM public.holidays h
    WHERE dim_date.date = h.date;
    
    RETURN format('假期同步完成: %s 筆新記錄已建立', sync_count);
END;
$$ LANGUAGE plpgsql;

-- 執行假期同步
SELECT sync_existing_holidays();

-- 第十二步：建立系統健康檢查函數

CREATE OR REPLACE FUNCTION check_campaign_system_health()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- 檢查 dim_date 與 campaigns 的關聯完整性
    RETURN QUERY
    SELECT 
        'Campaign ID Integrity' as check_name,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        format('%s 筆 dim_date 記錄有無效的 campaign_id', COUNT(*)) as details
    FROM public.dim_date d
    LEFT JOIN public.campaigns c ON d.campaign_id = c.id
    WHERE d.campaign_id IS NOT NULL AND c.id IS NULL;
    
    -- 檢查假期同步狀態
    RETURN QUERY
    SELECT 
        'Holiday Sync Status' as check_name,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'WARNING'
        END as status,
        format('%s 筆假期記錄尚未同步到 dim_date', COUNT(*)) as details
    FROM public.holidays h
    LEFT JOIN public.dim_date d ON h.date = d.date
    WHERE d.date IS NULL;
    
    -- 檢查活動日期重疊
    RETURN QUERY
    SELECT 
        'Campaign Overlaps' as check_name,
        CASE 
            WHEN COUNT(*) = 0 THEN 'PASS'
            ELSE 'INFO'
        END as status,
        format('%s 對活動期間有重疊', COUNT(*)/2) as details
    FROM public.campaigns c1
    JOIN public.campaigns c2 ON c1.id < c2.id
    WHERE c1.start_date <= c2.end_date 
    AND c1.end_date >= c2.start_date;
END;
$$ LANGUAGE plpgsql;

-- 第十三步：建立資料清理函數

-- 清理孤立的 campaign_name (現在已經有 campaign_id)
CREATE OR REPLACE FUNCTION cleanup_legacy_campaign_names()
RETURNS TEXT AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- 清理已經有 campaign_id 的記錄中的 campaign_name
    UPDATE public.dim_date 
    SET campaign_name = NULL
    WHERE campaign_id IS NOT NULL 
    AND campaign_name IS NOT NULL;
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    RETURN format('已清理 %s 筆過時的 campaign_name 資料', cleanup_count);
END;
$$ LANGUAGE plpgsql;

-- 執行清理（可選，保留舊資料以備不時之需）
-- SELECT cleanup_legacy_campaign_names();

-- 建立最終報告
DO $$
DECLARE
    migration_report TEXT;
BEGIN
    migration_report := format(
        E'========================================\n' ||
        E'資料庫優化遷移完成報告\n' ||
        E'執行時間：%s\n' ||
        E'========================================\n' ||
        E'✅ 已完成的優化項目：\n' ||
        E'1. 新增效能索引 (campaigns, events, funnel_events)\n' ||
        E'2. 建立正確的外鍵關係 (dim_date ↔ campaigns)\n' ||
        E'3. 實施自動化假期同步機制\n' ||
        E'4. 改良活動觸發器邏輯\n' ||
        E'5. 為 events 表增加活動關聯\n' ||
        E'6. 建立資料驗證約束\n' ||
        E'7. 建立實用查詢函數\n' ||
        E'8. 建立改良的分析視圖\n' ||
        E'========================================\n' ||
        E'🔧 可用的管理函數：\n' ||
        E'- 系統健康檢查：SELECT * FROM check_campaign_system_health();\n' ||
        E'- 查詢特定日期活動：SELECT * FROM get_active_campaigns_for_date(''2025-07-23'');\n' ||
        E'- 檢查活動重疊：SELECT * FROM check_campaign_overlaps(''2025-07-01'', ''2025-07-31'');\n' ||
        E'- 資料遷移狀態：SELECT migrate_campaign_names_to_ids();\n' ||
        E'- 假期同步：SELECT sync_existing_holidays();\n' ||
        E'========================================\n',
        NOW()
    );
    
    RAISE NOTICE '%', migration_report;
END $$;

-- 執行系統健康檢查
SELECT * FROM check_campaign_system_health();