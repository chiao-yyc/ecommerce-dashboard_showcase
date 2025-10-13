# 活動系統維護指南

## 系統維護概述

本指南提供 `campaigns`、`dim_date`、`holidays` 三表關係系統的日常維護操作，包括監控、故障排除、效能優化和資料管理。

## 日常監控檢查

### **1. 系統健康檢查**

```sql
-- 執行完整系統健康檢查
SELECT * FROM check_campaign_system_health();
```

**預期結果**：
```
check_name             | status | details
-----------------------|--------|----------------------------------
Campaign ID Integrity | PASS   | 0 筆 dim_date 記錄有無效的 campaign_id
Holiday Sync Status    | PASS   | 0 筆假期記錄尚未同步到 dim_date
Campaign Overlaps      | INFO   | 5 對活動期間有重疊
```

**異常處理**：
- 若 `Campaign ID Integrity` 為 `FAIL`：執行 `清理孤立記錄` 程序
- 若 `Holiday Sync Status` 為 `WARNING`：執行 `假期同步修復` 程序

### **2. 歸因品質檢查**

```sql
-- 檢查歸因計算品質
SELECT * FROM check_attribution_quality();
```

**預期結果**：
```
check_name          | status  | value    | description
--------------------|---------|----------|---------------------------
Revenue Balance     | PASS    | 0.000000 | 原始營收: 157361.13, 歸因營收: 157361.13
Weight Distribution | INFO    | 0.6250   | 平均歸因權重: 0.6250
```

**異常指標**：
- `Revenue Balance` 差異 > 0.01：表示歸因計算有誤
- `Weight Distribution` 異常低/高：檢查活動權重設定

### **3. 假期資料完整性檢查**

```sql
-- 檢查假期資料一致性
SELECT * FROM check_holiday_data_integrity();
```

**預期結果**：
```
check_type             | issue_count | description                    | sample_dates
-----------------------|-------------|--------------------------------|-------------
MISSING_HOLIDAY_FLAG   | 0           | holidays 表中的假期在 dim_date 中未標記 | {}
ORPHANED_HOLIDAY_FLAG  | 0           | dim_date 中標記為假期但不在 holidays 表中 | {}
DUPLICATE_HOLIDAYS     | 0           | holidays 表中有重複的日期        | {}
```

## 定期維護任務

### **每日維護 (自動化)**

```bash
#!/bin/bash
# daily_maintenance.sh

# 1. 系統健康檢查
psql $DATABASE_URL -c "SELECT * FROM check_campaign_system_health();" >> /var/log/campaign_health.log

# 2. 歸因品質檢查
psql $DATABASE_URL -c "SELECT * FROM check_attribution_quality();" >> /var/log/attribution_quality.log

# 3. 假期完整性檢查
psql $DATABASE_URL -c "SELECT * FROM check_holiday_data_integrity();" >> /var/log/holiday_integrity.log

# 4. 效能指標收集
psql $DATABASE_URL -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_live_tup,
    n_dead_tup
FROM pg_stat_user_tables 
WHERE tablename IN ('campaigns', 'dim_date', 'holidays');" >> /var/log/table_stats.log
```

### **每週維護**

```sql
-- 1. 清理過期的備份記錄
DELETE FROM dim_date_backup 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 2. 重建統計資訊
ANALYZE campaigns;
ANALYZE dim_date;
ANALYZE holidays;

-- 3. 檢查索引使用率
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('campaigns', 'dim_date', 'holidays')
ORDER BY idx_scan DESC;
```

### **每月維護**

```sql
-- 1. 重建索引 (僅在必要時)
REINDEX INDEX idx_campaigns_date_range;
REINDEX INDEX idx_dim_date_campaign_id;

-- 2. 清理孤立記錄
SELECT cleanup_legacy_campaign_names();

-- 3. 歸因效果比較分析
SELECT * FROM compare_attribution_methods(
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE
);
```

## 🚨 故障排除指南

### **常見問題 1: 歸因計算錯誤**

**症狀**：
- `check_attribution_quality()` 顯示 `Revenue Balance` 為 `FAIL`
- 營收總額不匹配

**診斷步驟**：
```sql
-- 1. 檢查訂單資料完整性
SELECT 
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    COUNT(CASE WHEN total_amount IS NULL THEN 1 END) as null_amount_orders
FROM orders 
WHERE status IN ('paid', 'processing', 'shipped', 'delivered', 'completed');

-- 2. 檢查歸因函數輸出
SELECT jsonb_pretty(calculate_campaign_attributions(CURRENT_DATE));

-- 3. 檢查視圖資料
SELECT SUM(total_attributed_revenue) FROM revenue_attribution_analysis;
```

**解決方案**：
```sql
-- 重新建立歸因計算函數
\i /path/to/20250723200000_layered_attribution_implementation.sql

-- 重新整理分析視圖
REFRESH MATERIALIZED VIEW IF EXISTS revenue_attribution_analysis_materialized;
```

### **常見問題 2: 假期同步失敗**

**症狀**：
- `check_holiday_data_integrity()` 顯示 `MISSING_HOLIDAY_FLAG` > 0
- 新增假期後 `dim_date` 未更新

**診斷步驟**：
```sql
-- 1. 檢查觸發器狀態
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_sync_holidays';

-- 2. 檢查函數定義
\df sync_holiday_to_dim_date

-- 3. 手動測試同步
SELECT add_holiday('2025-12-25', '測試假期');
SELECT date, is_holiday FROM dim_date WHERE date = '2025-12-25';
```

**解決方案**：
```sql
-- 重新建立觸發器
DROP TRIGGER IF EXISTS trigger_sync_holidays ON holidays;
CREATE TRIGGER trigger_sync_holidays
    AFTER INSERT OR UPDATE OR DELETE ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION sync_holiday_to_dim_date();

-- 修復現有資料
SELECT sync_all_existing_holidays();
```

### **常見問題 3: 效能問題**

**症狀**：
- 歸因查詢執行時間過長
- 分析視圖查詢逾時

**診斷步驟**：
```sql
-- 1. 檢查查詢執行計畫
EXPLAIN ANALYZE SELECT * FROM revenue_attribution_analysis LIMIT 10;

-- 2. 檢查索引使用
SELECT 
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes 
WHERE tablename IN ('campaigns', 'dim_date', 'orders')
ORDER BY idx_scan DESC;

-- 3. 檢查表大小
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size,
    n_live_tup
FROM pg_stat_user_tables 
WHERE tablename IN ('campaigns', 'dim_date', 'holidays', 'orders');
```

**效能優化**：
```sql
-- 1. 更新統計資訊
ANALYZE campaigns;
ANALYZE dim_date;
ANALYZE orders;

-- 2. 考慮建立物化視圖
CREATE MATERIALIZED VIEW revenue_attribution_analysis_materialized AS
SELECT * FROM revenue_attribution_analysis;

-- 建立自動更新機制
CREATE OR REPLACE FUNCTION refresh_attribution_analysis()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW revenue_attribution_analysis_materialized;
END;
$$ LANGUAGE plpgsql;

-- 每小時更新一次
SELECT cron.schedule('refresh-attribution', '0 * * * *', 'SELECT refresh_attribution_analysis();');
```

## 📈 效能監控

### **關鍵效能指標 (KPI)**

```sql
-- 1. 系統回應時間監控
CREATE OR REPLACE FUNCTION monitor_system_performance()
RETURNS TABLE(
    metric_name TEXT,
    execution_time_ms NUMERIC,
    status TEXT
) AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    -- 測試歸因計算效能
    start_time := clock_timestamp();
    PERFORM calculate_campaign_attributions(CURRENT_DATE);
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Attribution Calculation'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 1000 
             THEN 'GOOD' ELSE 'SLOW' END;
    
    -- 測試分析視圖查詢效能
    start_time := clock_timestamp();
    PERFORM COUNT(*) FROM revenue_attribution_analysis;
    end_time := clock_timestamp();
    
    RETURN QUERY SELECT 
        'Analysis View Query'::TEXT,
        EXTRACT(MILLISECONDS FROM (end_time - start_time)),
        CASE WHEN EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 5000 
             THEN 'GOOD' ELSE 'SLOW' END;
END;
$$ LANGUAGE plpgsql;
```

### **監控儀表板查詢**

```sql
-- 即時系統狀態儀表板
WITH system_metrics AS (
    SELECT * FROM monitor_system_performance()
),
data_metrics AS (
    SELECT 
        (SELECT COUNT(*) FROM campaigns) as total_campaigns,
        (SELECT COUNT(*) FROM dim_date) as total_dates,  
        (SELECT COUNT(*) FROM holidays) as total_holidays,
        (SELECT COUNT(*) FROM revenue_attribution_analysis) as attribution_records
),
health_metrics AS (
    SELECT 
        COUNT(CASE WHEN status = 'PASS' THEN 1 END) as healthy_checks,
        COUNT(CASE WHEN status != 'PASS' THEN 1 END) as failed_checks
    FROM check_campaign_system_health()
)
SELECT 
    'System Performance' as category,
    json_build_object(
        'attribution_time_ms', (SELECT execution_time_ms FROM system_metrics WHERE metric_name = 'Attribution Calculation'),
        'view_query_time_ms', (SELECT execution_time_ms FROM system_metrics WHERE metric_name = 'Analysis View Query'),
        'total_campaigns', dm.total_campaigns,
        'total_dates', dm.total_dates,
        'total_holidays', dm.total_holidays,
        'attribution_records', dm.attribution_records,
        'healthy_checks', hm.healthy_checks,
        'failed_checks', hm.failed_checks
    ) as metrics
FROM data_metrics dm, health_metrics hm;
```

## 🔄 資料管理操作

### **資料清理**

```sql
-- 1. 清理過期的測試資料
DELETE FROM campaigns 
WHERE campaign_name LIKE '測試%' 
AND created_at < NOW() - INTERVAL '7 days';

-- 2. 清理孤立的 dim_date 記錄
DELETE FROM dim_date 
WHERE campaign_id IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM campaigns c WHERE c.id = dim_date.campaign_id
);

-- 3. 清理重複的假期記錄
WITH duplicate_holidays AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY date ORDER BY created_at) as rn
    FROM holidays
)
DELETE FROM holidays 
WHERE id IN (
    SELECT id FROM duplicate_holidays WHERE rn > 1
);
```

### **資料備份**

```bash
#!/bin/bash
# backup_campaign_data.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/campaign_system"

# 1. 完整表備份
pg_dump $DATABASE_URL -t campaigns -t dim_date -t holidays --data-only > \
    "$BACKUP_DIR/campaign_data_$DATE.sql"

# 2. 結構備份
pg_dump $DATABASE_URL -t campaigns -t dim_date -t holidays --schema-only > \
    "$BACKUP_DIR/campaign_schema_$DATE.sql"

# 3. 函數和視圖備份
pg_dump $DATABASE_URL --schema-only | grep -A 50 -B 5 "calculate_campaign_attributions\|revenue_attribution_analysis" > \
    "$BACKUP_DIR/campaign_objects_$DATE.sql"

# 4. 壓縮舊備份
find $BACKUP_DIR -name "*.sql" -mtime +30 -exec gzip {} \;
```

### **資料還原**

```bash
#!/bin/bash
# restore_campaign_data.sh

BACKUP_FILE=$1
if [ -z "$1" ]; then
    echo "使用方式: $0 <backup_file>"
    exit 1
fi

# 1. 建立還原點
pg_dump $DATABASE_URL -t campaigns -t dim_date -t holidays > \
    "/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. 停用觸發器
psql $DATABASE_URL -c "ALTER TABLE campaigns DISABLE TRIGGER update_campaign_in_dim_date_v2_trigger;"
psql $DATABASE_URL -c "ALTER TABLE holidays DISABLE TRIGGER trigger_sync_holidays;"

# 3. 還原資料
psql $DATABASE_URL < $BACKUP_FILE

# 4. 重新啟用觸發器
psql $DATABASE_URL -c "ALTER TABLE campaigns ENABLE TRIGGER update_campaign_in_dim_date_v2_trigger;"
psql $DATABASE_URL -c "ALTER TABLE holidays ENABLE TRIGGER trigger_sync_holidays;"

# 5. 驗證資料完整性
psql $DATABASE_URL -c "SELECT * FROM check_campaign_system_health();"
```

## 維護檢查清單

### **每日檢查清單**
- [ ] 執行系統健康檢查
- [ ] 檢查歸因品質報告
- [ ] 監控系統效能指標
- [ ] 檢查錯誤日誌

### **每週檢查清單**
- [ ] 更新資料庫統計資訊
- [ ] 檢查索引使用率
- [ ] 清理過期備份資料
- [ ] 執行完整性檢查

### **每月檢查清單**
- [ ] 效能調優分析
- [ ] 索引重建評估
- [ ] 容量規劃檢討
- [ ] 災難恢復測試

## 🚨 緊急聯絡程序

### **系統停機程序**
1. **即時通知**: 通知所有相關團隊
2. **問題評估**: 判斷影響範圍和嚴重程度
3. **備份現狀**: 建立問題發生時的資料快照
4. **修復執行**: 按照故障排除指南執行修復
5. **驗證測試**: 確認系統恢復正常
6. **後續檢討**: 分析問題原因並改進預防措施

### **聯絡資訊**
- **主要維護工程師**: [待填入]
- **資料庫管理員**: [待填入]
- **系統架構師**: [待填入]
- **緊急聯絡電話**: [待填入]

---

**文件版本**: v1.0  
**最後更新**: 2025-07-24  
**維護團隊**: 資料工程團隊