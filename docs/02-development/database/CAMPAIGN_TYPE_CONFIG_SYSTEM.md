# 活動類型配置系統 - 資料庫文檔

## 系統概述

活動類型配置系統的資料庫層實現四層歸因架構的可配置活動分類管理，透過 PostgreSQL 的 ENUM 類型、外鍵約束和 RPC 函數提供完整的型別安全和業務邏輯驗證。

### 核心設計原則
- **型別安全**: 使用 PostgreSQL ENUM 確保歸因層級的一致性
- **完整性保證**: 外鍵約束確保活動類型的有效性
- **效能優化**: 索引策略和視圖優化查詢效能
- **可擴展性**: 支援動態配置和未來功能擴展

## 資料庫結構設計

### 1. attribution_layer ENUM 類型

#### 定義
```sql
CREATE TYPE attribution_layer AS ENUM (
    'site-wide',        -- 全站活動：影響全體用戶的重大推廣
    'target-oriented',  -- 目標導向：針對特定群體的精準行銷  
    'category-specific',-- 品類專屬：限定商品類別的促銷
    'general'          -- 一般活動：日常基礎推廣活動
);
```

#### 層級權重與優先級
| 層級 | 中文名稱 | 基礎權重 | 優先級範圍 | 業務描述 |
|------|----------|----------|------------|----------|
| `site-wide` | 全站活動 | 2.0-5.0 | 80-100 | 雙11、週年慶等重大促銷 |
| `target-oriented` | 目標導向 | 1.5-3.0 | 60-80 | 會員專屬、VIP 活動 |
| `category-specific` | 品類專屬 | 1.0-2.5 | 40-60 | 服飾、3C 產品專區促銷 |
| `general` | 一般活動 | 0.5-2.0 | 0-40 | 日常折扣、新品上市 |

#### ENUM 操作指令
```sql
-- 新增層級（需要謹慎評估影響）
ALTER TYPE attribution_layer ADD VALUE 'special-events';

-- 查看所有可用值
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'attribution_layer'::regtype
ORDER BY enumsortorder;

-- 檢查 ENUM 使用情況
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE udt_name = 'attribution_layer';
```

### 2. campaign_type_config 主配置表

#### 表結構定義
```sql
CREATE TABLE public.campaign_type_config (
    -- 主鍵與識別
    type_code TEXT PRIMARY KEY,                    -- 活動類型代碼
    
    -- 顯示資訊
    display_name_zh TEXT NOT NULL,               -- 中文顯示名稱
    display_name_en TEXT,                         -- 英文顯示名稱
    description TEXT,                             -- 詳細描述
    
    -- 歸因配置
    attribution_layer attribution_layer NOT NULL, -- 歸因層級
    default_weight NUMERIC(3,2) DEFAULT 1.0      -- 預設權重 (0.00-9.99)
        CHECK (default_weight >= 0.00 AND default_weight <= 9.99),
    default_priority INTEGER DEFAULT 50          -- 預設優先級 (0-100)  
        CHECK (default_priority >= 0 AND default_priority <= 100),
    
    -- 顯示配置
    color_class TEXT,                            -- CSS 顏色類別
    icon_name TEXT,                              -- 圖示名稱
    
    -- 狀態管理
    is_active BOOLEAN DEFAULT TRUE,              -- 是否啟用
    
    -- 時間戳記
    created_at TIMESTAMPTZ DEFAULT NOW(),        -- 建立時間
    updated_at TIMESTAMPTZ DEFAULT NOW()         -- 更新時間
);
```

#### 約束與索引
```sql
-- 唯一性約束
ALTER TABLE campaign_type_config 
ADD CONSTRAINT uk_campaign_type_display_name_zh 
UNIQUE (display_name_zh);

-- 複合索引：歸因層級 + 啟用狀態
CREATE INDEX idx_campaign_type_config_layer_active 
ON campaign_type_config(attribution_layer, is_active);

-- 優先級索引：影響排序效能
CREATE INDEX idx_campaign_type_config_priority 
ON campaign_type_config(default_priority DESC);

-- 權重索引：用於歸因計算
CREATE INDEX idx_campaign_type_config_weight 
ON campaign_type_config(default_weight DESC) 
WHERE is_active = TRUE;

-- 複合索引：全文搜尋支援
CREATE INDEX idx_campaign_type_config_search 
ON campaign_type_config USING gin(
    to_tsvector('chinese', display_name_zh || ' ' || COALESCE(description, ''))
);
```

#### 觸發器系統
```sql
-- 自動更新時間戳記觸發器
CREATE OR REPLACE FUNCTION update_campaign_type_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_type_config_updated_at
    BEFORE UPDATE ON campaign_type_config
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_type_config_updated_at();

-- 資料驗證觸發器
CREATE OR REPLACE FUNCTION validate_campaign_type_config()
RETURNS TRIGGER AS $$
BEGIN
    -- 驗證類型代碼格式
    IF NEW.type_code !~ '^[a-z][a-z0-9_]*$' THEN
        RAISE EXCEPTION '活動類型代碼格式無效：%。必須以小寫字母開頭，只能包含小寫字母、數字和底線', NEW.type_code;
    END IF;
    
    -- 驗證類型代碼長度
    IF LENGTH(NEW.type_code) > 50 THEN
        RAISE EXCEPTION '活動類型代碼過長：%。最多50個字符', NEW.type_code;
    END IF;
    
    -- 根據歸因層級驗證權重範圍
    CASE NEW.attribution_layer
        WHEN 'site-wide' THEN
            IF NEW.default_weight < 2.0 OR NEW.default_weight > 5.0 THEN
                RAISE WARNING '全站活動建議權重範圍：2.0-5.0，目前：%', NEW.default_weight;
            END IF;
        WHEN 'target-oriented' THEN
            IF NEW.default_weight < 1.5 OR NEW.default_weight > 3.0 THEN
                RAISE WARNING '目標導向活動建議權重範圍：1.5-3.0，目前：%', NEW.default_weight;
            END IF;
        WHEN 'category-specific' THEN
            IF NEW.default_weight < 1.0 OR NEW.default_weight > 2.5 THEN
                RAISE WARNING '品類專屬活動建議權重範圍：1.0-2.5，目前：%', NEW.default_weight;
            END IF;
        WHEN 'general' THEN
            IF NEW.default_weight < 0.5 OR NEW.default_weight > 2.0 THEN
                RAISE WARNING '一般活動建議權重範圍：0.5-2.0，目前：%', NEW.default_weight;
            END IF;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_campaign_type_config
    BEFORE INSERT OR UPDATE ON campaign_type_config
    FOR EACH ROW
    EXECUTE FUNCTION validate_campaign_type_config();
```

### 3. campaigns 表整合

#### 外鍵約束設定
```sql
-- 新增外鍵約束到 campaigns 表
ALTER TABLE campaigns 
ADD CONSTRAINT fk_campaigns_campaign_type 
FOREIGN KEY (campaign_type) REFERENCES campaign_type_config(type_code)
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- 新增索引提升 JOIN 效能
CREATE INDEX idx_campaigns_campaign_type 
ON campaigns(campaign_type) 
WHERE campaign_type IS NOT NULL;
```

#### 歸因計算增強（campaigns 表整合）

**權重覆蓋機制架構**
```sql
-- 三層權重決策優先級（由高到低）
COALESCE(
    campaigns.attribution_weight,    -- 🎯 第1級：活動特定權重覆蓋
    config.default_weight,          -- 📋 第2級：活動類型預設權重  
    1.0                            -- 🛡️ 第3級：系統保底權重
)
```

**層級係數對照與計算**
```sql
-- 四層歸因架構的層級影響力係數
CASE attribution_layer
    WHEN 'site-wide' THEN base_weight * 3.0        -- 🔥 全站影響（最高）
    WHEN 'target-oriented' THEN base_weight * 2.0  -- 🎯 精準鎖定（高）
    WHEN 'category-specific' THEN base_weight * 1.5 -- 📦 品類聚焦（中）
    WHEN 'general' THEN base_weight * 1.0           -- 📄 基礎覆蓋（基礎）
END
```

**增強版歸因計算函數**
```sql
CREATE OR REPLACE FUNCTION calculate_campaign_attributions_enhanced(
    target_date DATE,
    order_amount NUMERIC DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    active_campaigns JSONB := '[]';
    campaign_record RECORD;
    layer_totals JSONB := '{}';
    final_attributions JSONB := '[]';
    normalized_weight NUMERIC;
BEGIN
    -- 增強查詢：整合 campaigns 表權重覆蓋機制
    FOR campaign_record IN 
        SELECT 
            c.id,
            c.campaign_name,
            c.campaign_type,
            c.attribution_layer,
            COALESCE(
                c.attribution_weight,           -- 🎯 活動特定權重覆蓋
                ctc.default_weight,             -- 📋 配置表預設權重
                1.0                             -- 🛡️ 系統保底權重
            ) as final_weight,
            COALESCE(ctc.default_priority, 50) as priority_score,
            c.start_date,
            c.end_date,
            CASE 
                WHEN c.attribution_weight IS NOT NULL THEN 'custom'
                WHEN ctc.type_code IS NOT NULL THEN 'config'
                ELSE 'fallback'
            END as weight_source
        FROM public.campaigns c
        LEFT JOIN public.campaign_type_config ctc ON (
            c.campaign_type = ctc.type_code 
            AND ctc.is_active = TRUE
        )
        WHERE target_date BETWEEN c.start_date AND c.end_date
          AND c.status = 'active'
        ORDER BY 
            CASE c.attribution_layer
                WHEN 'site-wide' THEN 1
                WHEN 'target-oriented' THEN 2
                WHEN 'category-specific' THEN 3
                WHEN 'general' THEN 4
                ELSE 5
            END,
            COALESCE(ctc.default_priority, 50) DESC,
            COALESCE(c.attribution_weight, ctc.default_weight, 1.0) DESC
    LOOP
        active_campaigns := active_campaigns || jsonb_build_object(
            'campaign_id', campaign_record.id,
            'campaign_name', campaign_record.campaign_name,
            'campaign_type', campaign_record.campaign_type,
            'attribution_layer', campaign_record.attribution_layer,
            'final_weight', campaign_record.final_weight,
            'priority_score', campaign_record.priority_score,
            'weight_source', campaign_record.weight_source,  -- 權重來源追蹤
            'period_start', campaign_record.start_date,
            'period_end', campaign_record.end_date
        );
    END LOOP;
    
    -- 計算每層級總權重
    SELECT jsonb_object_agg(layer, total_weight)
    INTO layer_totals
    FROM (
        SELECT 
            campaign->>'attribution_layer' as layer,
            SUM((campaign->>'final_weight')::NUMERIC) as total_weight
        FROM jsonb_array_elements(active_campaigns) as campaign
        GROUP BY campaign->>'attribution_layer'
    ) layer_stats;

    -- 正規化權重分配（層級內總和 = 100%）
    FOR campaign_record IN
        SELECT 
            campaign,
            (campaign->>'attribution_layer') as layer,
            (campaign->>'final_weight')::NUMERIC as final_weight
        FROM jsonb_array_elements(active_campaigns) as campaign
    LOOP
        normalized_weight := campaign_record.final_weight / 
            GREATEST((layer_totals->>campaign_record.layer)::NUMERIC, 0.1);
        
        final_attributions := final_attributions || (
            campaign_record.campaign || jsonb_build_object(
                'normalized_weight', normalized_weight,
                'attribution_percentage', ROUND(normalized_weight * 100, 2)
            )
        );
    END LOOP;
    
    RETURN COALESCE(final_attributions, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
```

#### 權重計算實例

**範例情境：多活動同時進行的權重分配**
```sql
-- 活動 A: 雙11購物節
-- campaign_type: 'holiday' (site-wide, 權重 3.0)
-- campaigns.attribution_weight: NULL (使用配置預設)
-- 最終權重: 3.0 × 3.0 (層級係數) = 9.0

-- 活動 B: VIP會員專屬  
-- campaign_type: 'membership' (target-oriented, 權重 2.0)
-- campaigns.attribution_weight: 2.5 (活動特定覆蓋)
-- 最終權重: 2.5 × 2.0 (層級係數) = 5.0

-- 活動 C: 3C品類促銷
-- campaign_type: 'category' (category-specific, 權重 1.5)
-- campaigns.attribution_weight: NULL (使用配置預設)
-- 最終權重: 1.5 × 1.5 (層級係數) = 2.25

-- 正規化結果：
-- 活動 A: 9.0/9.0 = 100% (該層級唯一活動)
-- 活動 B: 5.0/5.0 = 100% (該層級唯一活動)  
-- 活動 C: 2.25/2.25 = 100% (該層級唯一活動)
```

## 管理視圖與 RPC 函數

### 1. 分組管理視圖

#### campaign_type_groups_view
```sql
CREATE VIEW campaign_type_groups_view AS
SELECT 
    attribution_layer as layer,
    CASE attribution_layer
        WHEN 'site-wide' THEN '全站活動'
        WHEN 'target-oriented' THEN '目標導向'
        WHEN 'category-specific' THEN '品類專屬' 
        WHEN 'general' THEN '一般活動'
    END as display_name,
    CASE attribution_layer
        WHEN 'site-wide' THEN '影響全體用戶的重大推廣活動，如週年慶、雙11等'
        WHEN 'target-oriented' THEN '針對特定用戶群體的精準行銷活動'
        WHEN 'category-specific' THEN '限定特定商品類別的促銷活動'
        WHEN 'general' THEN '日常基礎推廣活動，如新品上市、庫存清理等'
    END as description,
    json_agg(
        json_build_object(
            'type_code', type_code,
            'display_name_zh', display_name_zh,
            'display_name_en', display_name_en,
            'default_weight', default_weight,
            'default_priority', default_priority,
            'color_class', color_class,
            'icon_name', icon_name,
            'description', description,
            'is_active', is_active,
            'created_at', created_at,
            'updated_at', updated_at
        ) ORDER BY default_priority DESC, display_name_zh
    ) as types,
    count(*) as total_count,
    count(*) FILTER (WHERE is_active = TRUE) as active_count,
    avg(default_weight) as avg_weight,
    max(default_priority) as max_priority,
    min(default_priority) as min_priority
FROM campaign_type_config
GROUP BY attribution_layer
ORDER BY 
    CASE attribution_layer
        WHEN 'site-wide' THEN 1
        WHEN 'target-oriented' THEN 2
        WHEN 'category-specific' THEN 3
        WHEN 'general' THEN 4
    END;
```

### 2. RPC 函數

#### get_campaign_type_groups()
```sql
CREATE OR REPLACE FUNCTION get_campaign_type_groups()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_object_agg(
        layer,
        json_build_object(
            'layer', layer,
            'display_name', display_name,
            'description', description,
            'types', types,
            'total_count', total_count,
            'active_count', active_count,
            'avg_weight', round(avg_weight, 2),
            'max_priority', max_priority,
            'min_priority', min_priority
        )
    )
    INTO result
    FROM campaign_type_groups_view;
    
    RETURN COALESCE(result, '{}'::json);
END;
$$;
```

#### validate_campaign_type(type_code)
```sql
CREATE OR REPLACE FUNCTION validate_campaign_type(p_type_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    config_record RECORD;
    result JSON;
BEGIN
    SELECT 
        type_code,
        display_name_zh,
        attribution_layer,
        default_weight,
        default_priority,
        is_active,
        created_at,
        updated_at
    INTO config_record
    FROM campaign_type_config
    WHERE type_code = p_type_code;
    
    IF NOT FOUND THEN
        result := json_build_object(
            'is_valid', FALSE,
            'error_code', 'TYPE_NOT_FOUND',
            'message', FORMAT('活動類型 "%s" 不存在', p_type_code),
            'type_config', NULL
        );
    ELSIF NOT config_record.is_active THEN
        result := json_build_object(
            'is_valid', FALSE,
            'error_code', 'TYPE_INACTIVE',
            'message', FORMAT('活動類型 "%s" 已停用', p_type_code),
            'type_config', row_to_json(config_record)
        );
    ELSE
        result := json_build_object(
            'is_valid', TRUE,
            'error_code', NULL,
            'message', '活動類型有效且啟用中',
            'type_config', row_to_json(config_record)
        );
    END IF;
    
    RETURN result;
END;
$$;
```

#### validate_campaign_system()
```sql
CREATE OR REPLACE FUNCTION validate_campaign_system()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats RECORD;
    health_score INTEGER;
    recommendations TEXT[];
    result JSON;
BEGIN
    -- 收集系統統計
    SELECT 
        COUNT(*) as total_types,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_types,
        COUNT(DISTINCT attribution_layer) as layer_coverage,
        json_object_agg(
            attribution_layer, 
            COUNT(*) FILTER (WHERE is_active = TRUE)
        ) as layer_distribution,
        AVG(default_weight) as avg_weight,
        AVG(default_priority) as avg_priority
    INTO stats
    FROM campaign_type_config;
    
    -- 計算健康度分數 (0-100)
    health_score := GREATEST(0, LEAST(100, 
        (stats.active_types * 10) +                     -- 每個啟用類型 +10 分
        (stats.layer_coverage * 20) +                   -- 每個涵蓋層級 +20 分
        CASE WHEN stats.avg_weight BETWEEN 1.0 AND 2.5  -- 權重適中 +20 分
             THEN 20 ELSE 10 END +
        CASE WHEN stats.avg_priority BETWEEN 30 AND 70  -- 優先級分佈均衡 +10 分
             THEN 10 ELSE 5 END
    ));
    
    -- 生成建議
    recommendations := ARRAY[]::TEXT[];
    
    IF stats.layer_coverage < 4 THEN
        recommendations := array_append(recommendations, 
            FORMAT('建議補齊所有4個歸因層級的活動類型，目前只有 %s 個層級', stats.layer_coverage));
    END IF;
    
    IF stats.active_types < 8 THEN
        recommendations := array_append(recommendations,
            FORMAT('建議至少配置8種活動類型，目前只有 %s 種啟用', stats.active_types));
    END IF;
    
    IF stats.avg_weight > 3.0 THEN
        recommendations := array_append(recommendations,
            FORMAT('平均權重過高 (%.2f)，建議調整以避免歸因計算偏差', stats.avg_weight));
    END IF;
    
    IF array_length(recommendations, 1) IS NULL THEN
        recommendations := ARRAY['系統配置健康，無需特別調整'];
    END IF;
    
    -- 構建結果
    result := json_build_object(
        'system_health_score', health_score,
        'total_types', stats.total_types,
        'active_types', stats.active_types,
        'layer_coverage', stats.layer_coverage,
        'layer_distribution', stats.layer_distribution,
        'avg_weight', round(stats.avg_weight, 2),
        'avg_priority', round(stats.avg_priority, 1),
        'recommendations', array_to_json(recommendations),
        'last_check', NOW()
    );
    
    RETURN result;
END;
$$;
```

## 初始資料與種子資料

### 預設活動類型配置
```sql
INSERT INTO campaign_type_config (
    type_code, display_name_zh, display_name_en, attribution_layer,
    default_weight, default_priority, color_class, icon_name, description
) VALUES 
-- 全站活動 (site-wide)
('flash_sale', '限時搶購', 'Flash Sale', 'site-wide', 
 2.50, 90, 'bg-red-100 text-red-800', 'zap',
 '短時間內的促銷活動，通常具有緊迫感和稀缺性'),
('seasonal', '季節活動', 'Seasonal Sale', 'site-wide',
 2.20, 85, 'bg-green-100 text-green-800', 'calendar',
 '配合季節變化的大型促銷活動'),
('holiday', '節慶活動', 'Holiday Sale', 'site-wide',
 3.00, 95, 'bg-yellow-100 text-yellow-800', 'gift',
 '重大節慶如雙11、聖誕節的特殊促銷'),

-- 目標導向 (target-oriented)  
('anniversary', '週年慶', 'Anniversary Sale', 'target-oriented',
 2.80, 88, 'bg-purple-100 text-purple-800', 'crown',
 '品牌或平台週年慶典活動'),
('membership', '會員活動', 'Member Exclusive', 'target-oriented', 
 2.00, 75, 'bg-blue-100 text-blue-800', 'users',
 '針對會員群體的專屬優惠活動'),
('demographic', '分群活動', 'Demographic Campaign', 'target-oriented',
 1.80, 65, 'bg-indigo-100 text-indigo-800', 'target',
 '基於用戶特徵分群的精準行銷活動'),

-- 品類專屬 (category-specific)
('category', '品類活動', 'Category Sale', 'category-specific',
 1.50, 60, 'bg-orange-100 text-orange-800', 'tag',
 '特定商品類別的專題促銷活動'),
('product_launch', '新品上市', 'Product Launch', 'category-specific',
 1.70, 55, 'bg-cyan-100 text-cyan-800', 'star', 
 '新產品發佈的推廣活動'),
('lifestyle', '生活風格', 'Lifestyle Campaign', 'category-specific',
 1.40, 50, 'bg-pink-100 text-pink-800', 'heart',
 '針對特定生活方式或興趣的主題活動'),

-- 一般活動 (general)
('general', '一般活動', 'General Campaign', 'general',
 1.00, 30, 'bg-gray-100 text-gray-800', 'folder',
 '日常的基礎推廣和促銷活動')

ON CONFLICT (type_code) DO UPDATE SET
    display_name_zh = EXCLUDED.display_name_zh,
    display_name_en = EXCLUDED.display_name_en,
    attribution_layer = EXCLUDED.attribution_layer,
    default_weight = EXCLUDED.default_weight,
    default_priority = EXCLUDED.default_priority,
    color_class = EXCLUDED.color_class,
    icon_name = EXCLUDED.icon_name,
    description = EXCLUDED.description,
    updated_at = NOW();
```

### 資料驗證查詢
```sql
-- 驗證所有預設資料是否正確插入
SELECT 
    attribution_layer,
    COUNT(*) as type_count,
    AVG(default_weight) as avg_weight,
    STRING_AGG(type_code, ', ' ORDER BY default_priority DESC) as type_codes
FROM campaign_type_config
WHERE is_active = TRUE
GROUP BY attribution_layer
ORDER BY 
    CASE attribution_layer
        WHEN 'site-wide' THEN 1
        WHEN 'target-oriented' THEN 2  
        WHEN 'category-specific' THEN 3
        WHEN 'general' THEN 4
    END;
```

## 效能優化與監控

### 查詢效能優化

#### 關鍵查詢與索引配對
```sql
-- 常見查詢 1: 按層級取得啟用的活動類型
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM campaign_type_config 
WHERE attribution_layer = 'site-wide' AND is_active = TRUE
ORDER BY default_priority DESC;
-- 使用索引: idx_campaign_type_config_layer_active

-- 常見查詢 2: 權重排序的活動類型
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM campaign_type_config 
WHERE is_active = TRUE
ORDER BY default_weight DESC, default_priority DESC;
-- 使用索引: idx_campaign_type_config_weight

-- 常見查詢 3: 全文搜尋活動類型
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM campaign_type_config
WHERE to_tsvector('chinese', display_name_zh || ' ' || COALESCE(description, ''))
      @@ plainto_tsquery('chinese', '限時 促銷');
-- 使用索引: idx_campaign_type_config_search
```

#### 分析與統計更新
```sql
-- 更新表統計資訊以優化查詢計劃
ANALYZE campaign_type_config;

-- 檢查索引使用率
SELECT 
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE relname = 'campaign_type_config'
ORDER BY idx_scan DESC;

-- 檢查表大小和索引大小
SELECT 
    pg_size_pretty(pg_total_relation_size('campaign_type_config')) as total_size,
    pg_size_pretty(pg_relation_size('campaign_type_config')) as table_size,
    pg_size_pretty(pg_total_relation_size('campaign_type_config') - pg_relation_size('campaign_type_config')) as index_size;
```

### 監控查詢

#### 系統健康度監控
```sql
-- 建立監控視圖
CREATE VIEW campaign_type_system_health AS
SELECT 
    NOW() as check_time,
    COUNT(*) as total_types,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_types,
    COUNT(DISTINCT attribution_layer) as layer_coverage,
    AVG(default_weight) as avg_weight,
    AVG(default_priority) as avg_priority,
    COUNT(*) FILTER (WHERE default_weight > 3.0) as high_weight_types,
    COUNT(*) FILTER (WHERE default_priority > 80) as high_priority_types,
    -- 計算使用率：被 campaigns 表引用的類型數
    (SELECT COUNT(DISTINCT campaign_type) 
     FROM campaigns 
     WHERE campaign_type IS NOT NULL) as used_types_count
FROM campaign_type_config;

-- 每日健康度檢查
SELECT 
    *,
    CASE 
        WHEN active_types >= 8 AND layer_coverage = 4 THEN 'HEALTHY'
        WHEN active_types >= 5 AND layer_coverage >= 3 THEN 'GOOD'  
        WHEN active_types >= 3 AND layer_coverage >= 2 THEN 'FAIR'
        ELSE 'POOR'
    END as health_status
FROM campaign_type_system_health;
```

## 備份與復原策略

### 資料備份
```sql
-- 匯出配置資料 (僅資料)
COPY campaign_type_config TO '/backup/campaign_type_config_data.csv' WITH CSV HEADER;

-- 完整備份 (包含結構)
pg_dump -U postgres -h localhost -t campaign_type_config ecommerce_db > campaign_type_config_backup.sql

-- 備份相關 ENUM 和函數
pg_dump -U postgres -h localhost -T '*' -t attribution_layer_enum -R -f attribution_layer_backup.sql ecommerce_db
```

### 資料復原
```sql
-- 復原資料表
psql -U postgres -h localhost -d ecommerce_db -f campaign_type_config_backup.sql

-- 復原配置資料
COPY campaign_type_config FROM '/backup/campaign_type_config_data.csv' WITH CSV HEADER;

-- 驗證復原完整性
SELECT validate_campaign_system();
```

## 故障排除指南

### 常見問題診斷

#### 1. 外鍵約束失敗
```sql
-- 問題：campaigns 表插入時外鍵約束失敗
-- 診斷查詢
SELECT 
    c.campaign_type,
    COUNT(*) as usage_count,
    ctc.type_code IS NOT NULL as config_exists,
    ctc.is_active
FROM campaigns c
LEFT JOIN campaign_type_config ctc ON c.campaign_type = ctc.type_code
WHERE c.campaign_type IS NOT NULL
GROUP BY c.campaign_type, ctc.type_code, ctc.is_active
HAVING ctc.type_code IS NULL OR ctc.is_active = FALSE;

-- 解決方案：補齊缺失的配置或修正資料
INSERT INTO campaign_type_config (type_code, display_name_zh, attribution_layer)
VALUES ('missing_type', '缺失類型', 'general')
ON CONFLICT (type_code) DO UPDATE SET is_active = TRUE;
```

#### 2. ENUM 值新增問題  
```sql
-- 問題：嘗試使用不存在的 attribution_layer 值
-- 診斷查詢
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'attribution_layer'::regtype;

-- 解決方案：正確新增 ENUM 值
ALTER TYPE attribution_layer ADD VALUE 'new_layer' AFTER 'general';
-- 注意：ENUM 值新增後無法輕易移除，需要謹慎評估
```

#### 3. 效能問題診斷
```sql
-- 診斷慢查詢
SELECT 
    query,
    mean_time,
    calls,
    total_time
FROM pg_stat_statements
WHERE query LIKE '%campaign_type_config%'
ORDER BY mean_time DESC;

-- 檢查缺失的索引
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'campaign_type_config'
  AND n_distinct > 10;  -- 高基數列可能需要索引
```

### 資料一致性修復

#### 修復權重範圍異常
```sql
-- 檢查權重範圍異常
SELECT 
    type_code,
    attribution_layer,
    default_weight,
    CASE attribution_layer
        WHEN 'site-wide' THEN default_weight BETWEEN 2.0 AND 5.0
        WHEN 'target-oriented' THEN default_weight BETWEEN 1.5 AND 3.0
        WHEN 'category-specific' THEN default_weight BETWEEN 1.0 AND 2.5
        WHEN 'general' THEN default_weight BETWEEN 0.5 AND 2.0
    END as weight_in_range
FROM campaign_type_config
WHERE is_active = TRUE;

-- 自動修正異常權重
UPDATE campaign_type_config 
SET default_weight = CASE attribution_layer
    WHEN 'site-wide' THEN GREATEST(2.0, LEAST(5.0, default_weight))
    WHEN 'target-oriented' THEN GREATEST(1.5, LEAST(3.0, default_weight))  
    WHEN 'category-specific' THEN GREATEST(1.0, LEAST(2.5, default_weight))
    WHEN 'general' THEN GREATEST(0.5, LEAST(2.0, default_weight))
END,
updated_at = NOW()
WHERE is_active = TRUE;
```

## 安全性考量

### Row Level Security (RLS)
```sql
-- 啟用 RLS
ALTER TABLE campaign_type_config ENABLE ROW LEVEL SECURITY;

-- 管理員完全存取權限
CREATE POLICY campaign_type_admin_all
ON campaign_type_config
FOR ALL
TO admin_role
USING (true)
WITH CHECK (true);

-- 一般用戶只能讀取啟用的類型
CREATE POLICY campaign_type_user_read  
ON campaign_type_config
FOR SELECT
TO authenticated_user
USING (is_active = TRUE);

-- 服務帳號可以讀取所有類型（包含停用）
CREATE POLICY campaign_type_service_read
ON campaign_type_config  
FOR SELECT
TO service_role
USING (true);
```

### 資料遮罩與敏感資訊保護
```sql
-- 建立非敏感資訊視圖供前端使用
CREATE VIEW campaign_type_public AS
SELECT 
    type_code,
    display_name_zh,
    display_name_en,
    attribution_layer,
    color_class,
    icon_name,
    is_active
FROM campaign_type_config
WHERE is_active = TRUE;

-- 授權給應用程式角色
GRANT SELECT ON campaign_type_public TO app_user;
```

## 版本升級與遷移

### Migration 腳本版本控制
```sql
-- 記錄 Migration 版本
CREATE TABLE IF NOT EXISTS campaign_type_migrations (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

-- 記錄當前版本
INSERT INTO campaign_type_migrations (version, description) 
VALUES ('20250827000000', '初始活動類型配置系統建立');
```

### 向下相容性保證
```sql
-- 保持向下相容的資料遷移
-- 例：從硬編碼類型遷移到配置表
UPDATE campaigns 
SET campaign_type = CASE campaign_type
    WHEN 'flash-sale' THEN 'flash_sale'  -- 轉換連字符為底線
    WHEN 'member-only' THEN 'membership' -- 舊類型映射到新類型
    ELSE campaign_type
END
WHERE campaign_type IS NOT NULL;
```

---

## 相關文檔

- [活動類型管理系統架構](../architecture/campaign-type-management-system.md)
- [活動類型 API 文檔](../api/campaign-type-api.md)  
- [開發指南](../../04-guides/dev-notes/CAMPAIGN_TYPE_CONFIG_DEVELOPMENT_GUIDE.md)
- [活動系統整體概覽](./CAMPAIGN_SYSTEM_OVERVIEW.md)

## 標籤

`#資料庫設計` `#PostgreSQL` `#ENUM類型` `#外鍵約束` `#RPC函數` `#效能優化`

---

*最後更新：2025-08-27*  
*文檔版本：v1.0.0*
*資料庫版本：PostgreSQL 14+*