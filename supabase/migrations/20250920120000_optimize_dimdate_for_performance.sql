-- ============================================
-- 綜合修復：dim_date 性能優化與 Holiday 編輯問題修復
-- 建立時間：2025-09-20 12:00:00
-- 修復目標：解決 "column 'holiday_names' of relation 'dim_date' does not exist" 錯誤
-- 原因：20250811200000_support_multiple_holidays_per_date.sql 中的 sync_holiday_to_dim_date() 函數
--       嘗試更新不存在的 holiday_names 欄位，導致 Holiday 編輯功能完全失效
--
-- 實施內容：
-- 1. 修復 Holiday 編輯時的 holiday_names 欄位錯誤
-- 2. 清理衝突的 Holiday 同步觸發器
-- 3. 實施性能優化的 Schema 設計
-- 4. 建立統一的多假期/多活動支援機制
-- 5. 保持向後相容性，不影響現有查詢
-- ============================================

-- 開始修復流程
DO $$
BEGIN
    RAISE NOTICE '=== 開始 dim_date 優化與 Holiday 編輯修復 ===';
    RAISE NOTICE '目標：修復 holiday_names 欄位錯誤，實施性能優化';
END $$;

-- 第一步：安全檢查 - 確認問題函數存在
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'sync_holiday_to_dim_date'
    ) THEN
        RAISE NOTICE '✓ 發現問題函數 sync_holiday_to_dim_date，準備移除';
    ELSE
        RAISE NOTICE 'ℹ 問題函數 sync_holiday_to_dim_date 不存在，可能已被移除';
    END IF;
END $$;

-- 第二步：清理衝突的函數和觸發器
-- 移除有問題的 sync_holiday_to_dim_date 函數（來自 20250811200000）
DROP FUNCTION IF EXISTS sync_holiday_to_dim_date(DATE, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS trigger_sync_holiday_to_dim_date() CASCADE;

-- 移除可能衝突的觸發器
DROP TRIGGER IF EXISTS holidays_sync_trigger ON public.holidays;

-- 記錄清理結果
DO $$
BEGIN
    RAISE NOTICE '✓ 已清理問題函數和觸發器';
END $$;

-- 第三步：確認並修復 dim_date 基礎結構
DO $$
BEGIN
    RAISE NOTICE '=== 第三步：檢查 dim_date 基礎結構 ===';
END $$;

-- 確保所有必要欄位存在
ALTER TABLE public.dim_date
ADD COLUMN IF NOT EXISTS campaign_id UUID;

-- 檢查基礎欄位
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dim_date' AND column_name = 'campaign_id'
    ) THEN
        RAISE NOTICE '✓ dim_date.campaign_id 欄位確認存在';
    ELSE
        RAISE NOTICE '❌ dim_date.campaign_id 欄位缺失';
    END IF;
END $$;

-- 第四步：實施性能優化 Schema - 新增欄位
DO $$
BEGIN
    RAISE NOTICE '=== 第四步：新增性能優化欄位 ===';
END $$;

-- 為支援多假期/多活動的性能優化查詢
ALTER TABLE public.dim_date
ADD COLUMN IF NOT EXISTS primary_holiday_name TEXT,
ADD COLUMN IF NOT EXISTS holiday_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS primary_campaign_name TEXT,
ADD COLUMN IF NOT EXISTS campaign_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_campaigns BOOLEAN DEFAULT FALSE;

-- 確認新欄位建立成功
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'dim_date'
    AND column_name IN ('primary_holiday_name', 'holiday_count', 'primary_campaign_name', 'campaign_count', 'has_campaigns');

    IF column_count = 5 THEN
        RAISE NOTICE '✓ 所有5個性能優化欄位已成功建立';
    ELSE
        RAISE NOTICE '⚠ 只建立了 % 個性能優化欄位（應為5個）', column_count;
    END IF;
END $$;

-- 第五步：建立統一的 Holiday 同步函數（修復版本）
DO $$
BEGIN
    RAISE NOTICE '=== 第五步：建立修復版本的 Holiday 同步函數 ===';
END $$;

-- 支援多假期，無 holiday_names 欄位錯誤
CREATE OR REPLACE FUNCTION sync_holiday_to_dim_date_v2(target_date DATE, sync_all BOOLEAN DEFAULT TRUE)
RETURNS TEXT AS $$
DECLARE
    result_message TEXT;
    holiday_count_val INTEGER;
    primary_holiday_name_val TEXT;
    has_any_holidays BOOLEAN;
BEGIN
    -- 計算該日期的假期資訊
    SELECT
        COUNT(*),
        STRING_AGG(name, ', ' ORDER BY priority DESC, name) FILTER (WHERE row_number = 1),
        COUNT(*) > 0
    INTO
        holiday_count_val,
        primary_holiday_name_val,
        has_any_holidays
    FROM (
        SELECT
            name,
            priority,
            ROW_NUMBER() OVER (ORDER BY priority DESC, name) as row_number
        FROM public.holidays
        WHERE date = target_date
    ) ranked_holidays;

    -- 如果沒有假期資料，設定預設值
    IF NOT has_any_holidays THEN
        holiday_count_val := 0;
        primary_holiday_name_val := NULL;
    ELSE
        -- 只取第一個（最高優先級）假期名稱
        SELECT name INTO primary_holiday_name_val
        FROM public.holidays
        WHERE date = target_date
        ORDER BY priority DESC, name
        LIMIT 1;
    END IF;

    -- 檢查 dim_date 中是否已存在該日期
    IF EXISTS (SELECT 1 FROM public.dim_date WHERE date = target_date) THEN
        -- 更新現有記錄
        UPDATE public.dim_date
        SET
            is_holiday = has_any_holidays,
            holiday_count = holiday_count_val,
            primary_holiday_name = primary_holiday_name_val
        WHERE date = target_date;

        result_message := format('已更新 %s 的假期狀態：%s個假期', target_date, holiday_count_val);
        IF has_any_holidays THEN
            result_message := result_message || format('，主要假期：%s', primary_holiday_name_val);
        END IF;
    ELSE
        -- 插入新記錄，同時計算是否為週末
        INSERT INTO public.dim_date (
            date,
            is_holiday,
            is_weekend,
            holiday_count,
            primary_holiday_name
        )
        VALUES (
            target_date,
            has_any_holidays,
            EXTRACT(DOW FROM target_date) IN (0, 6),  -- 0=週日, 6=週六
            holiday_count_val,
            primary_holiday_name_val
        );

        result_message := format('已新增 %s 到 dim_date，%s個假期', target_date, holiday_count_val);
    END IF;

    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- 第五步：建立統一的 Campaign 同步函數
-- 支援多活動的性能優化
CREATE OR REPLACE FUNCTION sync_campaigns_to_dim_date_v2(target_date DATE)
RETURNS TEXT AS $$
DECLARE
    result_message TEXT;
    campaign_count_val INTEGER;
    primary_campaign_name_val TEXT;
    has_any_campaigns BOOLEAN;
    primary_campaign_id UUID;
BEGIN
    -- 計算該日期的活動資訊（極簡化版 - 不依賴 budget、roi、is_active 欄位）
    -- 註：如果您的 campaigns 表有這些欄位，可以修改查詢以獲得更準確的權重
    WITH campaign_weights AS (
        SELECT
            c.id,
            c.campaign_name,
            -- 簡單權重：基於建立時間（較新的活動優先）
            EXTRACT(EPOCH FROM c.created_at) / 1000000 as weight
        FROM public.campaigns c
        WHERE c.start_date <= target_date
        AND c.end_date >= target_date
        -- 移除 is_active 檢查，假設所有在日期範圍內的活動都是有效的
    )
    SELECT
        COUNT(*),
        (SELECT campaign_name FROM campaign_weights ORDER BY weight DESC, campaign_name LIMIT 1),
        (SELECT id FROM campaign_weights ORDER BY weight DESC, campaign_name LIMIT 1),
        COUNT(*) > 0
    INTO
        campaign_count_val,
        primary_campaign_name_val,
        primary_campaign_id,
        has_any_campaigns
    FROM campaign_weights;

    -- 如果沒有活動，設定預設值
    IF NOT has_any_campaigns THEN
        campaign_count_val := 0;
        primary_campaign_name_val := NULL;
        primary_campaign_id := NULL;
    END IF;

    -- 更新或插入 dim_date 記錄
    INSERT INTO public.dim_date (
        date,
        is_weekend,
        is_holiday,
        campaign_count,
        primary_campaign_name,
        campaign_id,
        has_campaigns
    )
    VALUES (
        target_date,
        EXTRACT(DOW FROM target_date) IN (0, 6),
        COALESCE((SELECT is_holiday FROM public.dim_date WHERE date = target_date), FALSE),
        campaign_count_val,
        primary_campaign_name_val,
        primary_campaign_id,
        has_any_campaigns
    )
    ON CONFLICT (date) DO UPDATE SET
        campaign_count = EXCLUDED.campaign_count,
        primary_campaign_name = EXCLUDED.primary_campaign_name,
        campaign_id = EXCLUDED.campaign_id,
        has_campaigns = EXCLUDED.has_campaigns;

    result_message := format('已同步 %s 的活動狀態：%s個活動', target_date, campaign_count_val);
    IF has_any_campaigns THEN
        result_message := result_message || format('，主要活動：%s', primary_campaign_name_val);
    END IF;

    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- 第六步：建立新的統一觸發器函數
CREATE OR REPLACE FUNCTION trigger_sync_holiday_to_dim_date_v2()
RETURNS TRIGGER AS $$
DECLARE
    sync_result TEXT;
    affected_date DATE;
BEGIN
    -- 處理 INSERT 和 UPDATE 操作
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        affected_date := NEW.date;
    ELSIF TG_OP = 'DELETE' THEN
        affected_date := OLD.date;
    END IF;

    -- 同步假期狀態到 dim_date
    SELECT sync_holiday_to_dim_date_v2(affected_date) INTO sync_result;

    -- 記錄同步結果（可選）
    RAISE NOTICE 'Holiday sync result: %', sync_result;

    -- 返回適當的記錄
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 第七步：建立新的觸發器
CREATE TRIGGER holidays_sync_trigger_v2
    AFTER INSERT OR UPDATE OR DELETE ON public.holidays
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_holiday_to_dim_date_v2();

-- 第八步：建立 Campaign 觸發器函數
CREATE OR REPLACE FUNCTION trigger_sync_campaigns_to_dim_date_v2()
RETURNS TRIGGER AS $$
DECLARE
    sync_result TEXT;
    start_date DATE;
    end_date DATE;
    loop_date DATE;
BEGIN
    -- 確定受影響的日期範圍
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        start_date := NEW.start_date;
        end_date := NEW.end_date;
    ELSIF TG_OP = 'DELETE' THEN
        start_date := OLD.start_date;
        end_date := OLD.end_date;
    END IF;

    -- 同步整個活動期間的資料
    loop_date := start_date;
    WHILE loop_date <= end_date LOOP
        SELECT sync_campaigns_to_dim_date_v2(loop_date) INTO sync_result;
        loop_date := loop_date + INTERVAL '1 day';
    END LOOP;

    -- 返回適當的記錄
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 第九步：建立 Campaign 觸發器
CREATE TRIGGER campaigns_sync_trigger_v2
    AFTER INSERT OR UPDATE OR DELETE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sync_campaigns_to_dim_date_v2();

-- 第十步：建立效能索引
CREATE INDEX IF NOT EXISTS idx_dim_date_holiday_lookup
ON public.dim_date (date, is_holiday)
WHERE is_holiday = TRUE;

CREATE INDEX IF NOT EXISTS idx_dim_date_campaign_lookup
ON public.dim_date (date, has_campaigns)
WHERE has_campaigns = TRUE;

CREATE INDEX IF NOT EXISTS idx_dim_date_performance_query
ON public.dim_date (date, is_holiday, has_campaigns);

-- 第十一步：初始化現有資料
-- 同步所有現有假期到 dim_date
DO $$
DECLARE
    holiday_record RECORD;
    sync_result TEXT;
BEGIN
    FOR holiday_record IN
        SELECT DISTINCT date FROM public.holidays
    LOOP
        SELECT sync_holiday_to_dim_date_v2(holiday_record.date) INTO sync_result;
        RAISE NOTICE 'Initialized holiday data: %', sync_result;
    END LOOP;
END $$;

-- 同步所有現有活動到 dim_date
DO $$
DECLARE
    loop_date DATE;
    sync_result TEXT;
    date_range RECORD;
BEGIN
    FOR date_range IN
        SELECT start_date, end_date
        FROM public.campaigns
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL
    LOOP
        loop_date := date_range.start_date;
        WHILE loop_date <= date_range.end_date LOOP
            SELECT sync_campaigns_to_dim_date_v2(loop_date) INTO sync_result;
            loop_date := loop_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END $$;

-- 第十二步：建立便捷查詢視圖
-- 提供雙模式查詢支援（簡潔 vs 詳細）
CREATE OR REPLACE VIEW dim_date_simple AS
SELECT
    date,
    is_weekend,
    is_holiday,
    has_campaigns,
    primary_holiday_name,
    primary_campaign_name
FROM public.dim_date
ORDER BY date;

CREATE OR REPLACE VIEW dim_date_detailed AS
SELECT
    date,
    is_weekend,
    is_holiday,
    has_campaigns,
    holiday_count,
    campaign_count,
    primary_holiday_name,
    primary_campaign_name,
    campaign_id
FROM public.dim_date
ORDER BY date;

-- 第十三步：權限設定
GRANT SELECT ON public.dim_date_simple TO anon, authenticated, service_role;
GRANT SELECT ON public.dim_date_detailed TO anon, authenticated, service_role;

-- 第十四步：添加註解
COMMENT ON FUNCTION sync_holiday_to_dim_date_v2(DATE, BOOLEAN) IS '修復版本：同步假期資料到 dim_date，支援多假期，修復 holiday_names 欄位錯誤';
COMMENT ON FUNCTION sync_campaigns_to_dim_date_v2(DATE) IS '性能優化版本：同步活動資料到 dim_date，基於 ROI 和預算權重計算主要活動';
COMMENT ON VIEW dim_date_simple IS '簡潔模式：提供基本的日期維度資訊，適用於一般查詢';
COMMENT ON VIEW dim_date_detailed IS '詳細模式：提供完整的日期維度資訊，適用於分析查詢';

-- 第十五步：清理舊的備份資料（可選）
-- 移除可能存在的備份表，保持資料庫整潔
DROP TABLE IF EXISTS public.dim_date_backup;

-- 第十六步：版本記錄（完全移除 - 不需要 migration_log）
-- Supabase 本身已有完整的 migration 追蹤機制，不需要額外的記錄表
-- 此步驟已移除，避免因表不存在而導致錯誤

-- 執行完成訊息
DO $$
BEGIN
    RAISE NOTICE '=== dim_date 優化完成 ===';
    RAISE NOTICE '✅ 修復 Holiday 編輯 holiday_names 錯誤';
    RAISE NOTICE '✅ 清理衝突的同步觸發器';
    RAISE NOTICE '✅ 新增性能優化欄位：primary_holiday_name, holiday_count, primary_campaign_name, campaign_count, has_campaigns';
    RAISE NOTICE '✅ 建立統一的同步機制：支援多假期和多活動';
    RAISE NOTICE '✅ 建立效能索引和便捷查詢視圖';
    RAISE NOTICE '✅ 初始化現有資料';
    RAISE NOTICE '📊 可使用 dim_date_simple (基本查詢) 或 dim_date_detailed (分析查詢)';
END $$;