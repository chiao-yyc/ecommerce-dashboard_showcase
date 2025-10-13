# 假期同步機制使用指南

## 概述

本機制解決了 `holidays` 表與 `dim_date.is_holiday` 之間的資料一致性問題，建立了完全自動化的同步機制和豐富的管理工具。

## 解決的問題

1. **自動同步**: `holidays` 表的任何變更自動反映到 `dim_date.is_holiday`
2. **資料一致性**: 確保兩個表之間的假期資料完全同步  
3. **歷史資料處理**: 提供批次同步工具處理現有資料
4. **完整性檢查**: 自動檢測和修復資料不一致問題
5. **影響分析**: 量化假期對業務指標的影響

## 核心功能

### 1. **自動觸發器同步**

每當 `holidays` 表發生變更時，系統會自動：
- **新增假期**: 在 `dim_date` 中標記對應日期為假期
- **更新假期**: 保持假期標記的一致性
- **刪除假期**: 移除 `dim_date` 中的假期標記

```sql
-- 範例：新增假期會自動同步
INSERT INTO holidays (date, name) VALUES ('2025-12-25', '聖誕節');
-- ↓ 自動觸發
-- UPDATE dim_date SET is_holiday = TRUE WHERE date = '2025-12-25';
```

### 2. **批次同步功能**

用於處理歷史資料或修復不一致問題：

```sql
-- 同步所有現有假期
SELECT * FROM sync_all_existing_holidays();

-- 輸出範例：
-- operation_type | date_processed |  status  |           message
-- SYNC          | 2025-01-01     | SUCCESS  | 已新增 2025-01-01 到 dim_date，假期狀態：TRUE
-- CLEANUP       | 2025-02-15     | SUCCESS  | 已移除錯誤的假期標記: 2025-02-15
-- SUMMARY       | (null)         | INFO     | 同步完成: 12 筆成功, 0 筆錯誤
```

### 3. **資料完整性檢查**

檢測各種資料不一致問題：

```sql
-- 檢查資料完整性
SELECT * FROM check_holiday_data_integrity();

-- 輸出範例：
-- check_type            | issue_count |                description               |    sample_dates
-- MISSING_HOLIDAY_FLAG  |          3  | holidays 表中的假期在 dim_date 中未標記   | {2025-01-01,2025-05-01}
-- ORPHANED_HOLIDAY_FLAG |          1  | dim_date 中標記為假期但不在 holidays 表中 | {2025-02-30}
-- DUPLICATE_HOLIDAYS    |          0  | holidays 表中有重複的日期                 | {}
```

### 4. **假期管理函數**

提供便利的假期管理工具：

```sql
-- 新增假期（自動同步到 dim_date）
SELECT add_holiday('2025-12-25', '聖誕節');
-- 回傳：已新增假期 2025-12-25: 聖誕節

-- 移除假期（自動從 dim_date 移除標記）
SELECT remove_holiday('2025-12-25');
-- 回傳：已移除假期 2025-12-25: 聖誕節

-- 更新假期名稱
SELECT add_holiday('2025-12-25', '聖誕佳節');  -- 會更新現有假期名稱
-- 回傳：已更新假期 2025-12-25: 聖誕佳節
```

## 假期影響分析

### **holiday_impact_summary 視圖**

提供假期對業務指標影響的深度分析：

```sql
-- 查看假期影響分析
SELECT * FROM holiday_impact_summary ORDER BY holiday_date DESC LIMIT 5;
```

**輸出欄位說明**：
- `holiday_orders`: 假期當日訂單數
- `holiday_revenue`: 假期當日營收
- `holiday_customers`: 假期當日客戶數
- `orders_multiplier`: 訂單數相對於平日的倍數
- `revenue_multiplier`: 營收相對於平日的倍數  
- `customers_multiplier`: 客戶數相對於平日的倍數
- `holiday_type`: 假期類型（週末假期/平日假期）

### **分析範例**

```sql
-- 分析哪些假期帶來最高的業績提升
SELECT 
    holiday_name,
    holiday_date,
    revenue_multiplier,
    orders_multiplier,
    holiday_type
FROM holiday_impact_summary 
WHERE revenue_multiplier > 1.5  -- 營收超過平日1.5倍
ORDER BY revenue_multiplier DESC;

-- 比較週末假期 vs 平日假期的影響
SELECT 
    holiday_type,
    COUNT(*) as holiday_count,
    AVG(revenue_multiplier) as avg_revenue_impact,
    AVG(orders_multiplier) as avg_orders_impact
FROM holiday_impact_summary
GROUP BY holiday_type;
```

## 使用場景

### **1. 日常假期管理**

```sql
-- 新增國定假日
SELECT add_holiday('2025-10-10', '國慶日');
SELECT add_holiday('2025-02-10', '農曆新年');

-- 新增公司特殊假日
SELECT add_holiday('2025-06-15', '公司創立日');

-- 移除不再適用的假期
SELECT remove_holiday('2025-06-15');
```

### **2. 資料維護**

```sql
-- 定期檢查資料完整性（建議每月執行）
SELECT * FROM check_holiday_data_integrity();

-- 發現問題時重新同步
SELECT * FROM sync_all_existing_holidays();
```

### **3. 業務分析**

```sql
-- 分析最近一年的假期影響
SELECT 
    holiday_name,
    holiday_date,
    holiday_revenue,
    revenue_multiplier,
    CASE 
        WHEN revenue_multiplier >= 2.0 THEN '高影響'
        WHEN revenue_multiplier >= 1.5 THEN '中影響'  
        WHEN revenue_multiplier >= 1.0 THEN '低影響'
        ELSE '負影響'
    END as impact_level
FROM holiday_impact_summary
WHERE holiday_date >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY revenue_multiplier DESC;

-- 分析假期期間的活動效果
SELECT 
    h.holiday_name,
    h.holiday_date,
    c.campaign_name,
    h.revenue_multiplier as holiday_impact
FROM holiday_impact_summary h
JOIN dim_date d ON h.holiday_date = d.date
LEFT JOIN campaigns c ON (
    h.holiday_date BETWEEN c.start_date AND c.end_date
)
WHERE c.campaign_name IS NOT NULL
ORDER BY h.revenue_multiplier DESC;
```

## ⚙️ 技術細節

### **觸發器邏輯**

1. **INSERT/UPDATE**: 自動標記 `dim_date.is_holiday = TRUE`
2. **DELETE**: 自動標記 `dim_date.is_holiday = FALSE`
3. **自動建立**: 如果 `dim_date` 中不存在該日期，會自動建立記錄

### **資料完整性保證**

- **雙向檢查**: 檢查 holidays→dim_date 和 dim_date→holidays 的一致性
- **重複檢測**: 檢查 holidays 表中是否有重複日期
- **自動修復**: 提供自動修復不一致資料的工具

### **效能考量**

- **索引優化**: 基於現有的 `dim_date(date)` 主鍵索引
- **批次處理**: 大量資料同步採用批次處理避免鎖定
- **日誌記錄**: 適度的日誌記錄，避免影響效能

## 🔍 故障排除

### **常見問題**

**Q: 新增假期後 dim_date 沒有更新？**
A: 檢查觸發器是否正常運作：
```sql
-- 檢查觸發器狀態
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'trigger_holiday_sync';

-- 手動同步
SELECT sync_holiday_to_dim_date('2025-12-25', TRUE);
```

**Q: 資料不一致如何修復？**
A: 使用完整性檢查和批次同步：
```sql
-- 1. 檢查問題
SELECT * FROM check_holiday_data_integrity();

-- 2. 批次修復
SELECT * FROM sync_all_existing_holidays();
```

**Q: 如何批量新增假期？**
A: 使用標準 INSERT 語句，觸發器會自動處理：
```sql
INSERT INTO holidays (date, name) VALUES 
    ('2025-12-25', '聖誕節'),
    ('2025-12-31', '跨年夜'),
    ('2026-01-01', '元旦');
-- 觸發器會自動同步所有假期到 dim_date
```

## 📈 監控建議

### **定期檢查項目**
1. 每月執行完整性檢查
2. 每季檢查假期影響分析的準確性
3. 重大假期前確認資料同步狀態

### **異常監控**
- 監控觸發器執行是否正常
- 檢查是否有大量資料不一致問題
- 關注假期影響分析的異常值

---

**文件版本**: 1.0  
**建立日期**: 2025-07-23  
**下次更新**: 預計與分層歸因策略一起更新