# 活動分析系統使用者手冊

## 使用者手冊概述

本手冊為電商平台的業務人員、行銷人員和分析師提供活動分析系統的完整操作指南，包括活動管理、假期設定、效果分析和報表查詢。

## 系統功能概覽

### **核心功能**
- ✅ **活動效果分析**: 精確追蹤每個活動的真實貢獻
- ✅ **多活動歸因**: 解決重疊活動的營收歸因問題  
- ✅ **假期影響分析**: 量化假期對業績的影響倍數
- ✅ **協作效果分析**: 分析活動組合的協同效應
- ✅ **即時數據同步**: 活動和假期變更立即生效

### **使用角色**
- **行銷經理**: 活動規劃、效果評估、預算分配
- **資料分析師**: 深度分析、趨勢預測、報表製作
- **營運人員**: 日常維護、假期管理、資料品質監控

## 快速入門指南

### **第一次使用**

1. **查看現有活動**
```sql
SELECT 
    campaign_name as "活動名稱",
    campaign_type as "活動類型", 
    start_date as "開始日期",
    end_date as "結束日期",
    attribution_layer as "歸因層級"
FROM campaigns 
WHERE end_date >= CURRENT_DATE
ORDER BY start_date;
```

2. **檢查系統狀態**
```sql
SELECT * FROM check_campaign_system_health();
```

3. **查看今日活動歸因**
```sql
SELECT jsonb_pretty(calculate_campaign_attributions(CURRENT_DATE));
```

## 活動效果分析

### **1. 基礎活動效果報告**

```sql
-- 查看所有活動的基本效果指標
SELECT 
    campaign_name as "活動名稱",
    attribution_layer as "歸因層級",
    influenced_orders as "影響訂單數",
    ROUND(total_attributed_revenue::numeric, 2) as "歸因營收",
    ROUND(avg_attribution_weight::numeric, 4) as "平均歸因權重",
    exclusive_orders as "獨占訂單",
    collaborative_orders as "協作訂單"
FROM revenue_attribution_analysis
WHERE campaign_name IS NOT NULL
ORDER BY total_attributed_revenue DESC;
```

**報告解讀**：
- **歸因營收**: 活動的真實營收貢獻（避免重複計算）
- **平均歸因權重**: 活動在重疊期間的平均影響力
- **獨占訂單**: 僅受該活動影響的訂單
- **協作訂單**: 受多個活動共同影響的訂單

### **2. 活動層級效果分析**

```sql
-- 按歸因層級分析活動效果
SELECT 
    attribution_layer as "歸因層級",
    COUNT(*) as "活動數量",
    SUM(influenced_orders) as "總影響訂單數",
    ROUND(SUM(total_attributed_revenue)::numeric, 2) as "層級總營收",
    ROUND(AVG(avg_attribution_weight)::numeric, 4) as "層級平均權重"
FROM revenue_attribution_analysis
WHERE campaign_name IS NOT NULL
GROUP BY attribution_layer
ORDER BY SUM(total_attributed_revenue) DESC;
```

**層級說明**：
- **site-wide**: 全站影響（季節性、假期活動）
- **target-oriented**: 目標導向（會員、人群活動）
- **category-specific**: 品類專屬（商品、品類活動）

### **3. 活動協作效果分析**

```sql
-- 分析活動組合的協同效應
SELECT 
    concurrent_campaigns as "並發活動數",
    campaign_combination as "活動組合", 
    occurrence_count as "發生次數",
    ROUND(combination_revenue::numeric, 2) as "組合營收",
    ROUND(revenue_share_pct::numeric, 2) as "營收占比%",
    collaboration_type as "協作類型"
FROM campaign_collaboration_analysis
WHERE concurrent_campaigns > 1
ORDER BY combination_revenue DESC
LIMIT 10;
```

**協作分析洞察**：
- **dual_collaboration**: 雙活動協作效果
- **multi_collaboration**: 多活動協作效果
- 高營收占比的組合值得重複執行

## 🏖️ 假期管理操作

### **1. 假期設定**

```sql
-- 新增假期
SELECT add_holiday('2025-12-25', '聖誕節');
SELECT add_holiday('2025-01-01', '元旦');
SELECT add_holiday('2025-02-10', '農曆新年');

-- 移除假期
SELECT remove_holiday('2025-12-25');
```

### **2. 假期影響分析**

```sql
-- 查看假期對業績的影響
SELECT 
    holiday_date as "假期日期",
    holiday_name as "假期名稱",
    ROUND(revenue_multiplier::numeric, 2) as "營收倍數",
    ROUND(orders_multiplier::numeric, 2) as "訂單倍數", 
    holiday_type as "假期類型"
FROM holiday_impact_summary
ORDER BY revenue_multiplier DESC;
```

**影響倍數解讀**：
- **營收倍數 > 1.5**: 顯著促進業績的重要假期
- **營收倍數 0.8-1.2**: 對業績影響中性的假期
- **營收倍數 < 0.8**: 可能對業績有負面影響的假期

### **3. 假期活動組合分析**

```sql
-- 分析假期期間的活動效果
SELECT 
    d.date as "日期",
    h.name as "假期名稱",
    STRING_AGG(c.campaign_name, ' + ') as "當日活動",
    COUNT(c.id) as "活動數量"
FROM dim_date d
LEFT JOIN holidays h ON d.date = h.date  
LEFT JOIN campaigns c ON d.date BETWEEN c.start_date AND c.end_date
WHERE d.is_holiday = TRUE
GROUP BY d.date, h.name
ORDER BY d.date DESC;
```

## 📈 營運分析報表

### **1. 每日活動重疊報告**

```sql
-- 查看活動重疊的複雜度
SELECT 
    date as "日期",
    concurrent_campaigns as "並發活動數",
    campaigns_list as "活動清單",
    complexity_level as "複雜度等級",
    CASE 
        WHEN is_holiday THEN '假期'
        WHEN is_weekend THEN '週末' 
        ELSE '平日'
    END as "日期類型"
FROM campaign_overlap_calendar
WHERE date BETWEEN '2025-03-01' AND '2025-03-31'
ORDER BY date DESC;
```

**複雜度等級**：
- **simple**: 單一活動或無活動
- **moderate**: 2個活動並行
- **complex**: 3個以上活動並行（需特別關注）

### **2. 活動效果趨勢分析**

```sql
-- 按時間分析活動效果趨勢
WITH daily_metrics AS (
    SELECT 
        DATE_TRUNC('week', order_date) as week,
        SUM(total_attributed_revenue) as weekly_revenue,
        COUNT(DISTINCT campaign_id) as active_campaigns,
        AVG(avg_concurrent_campaigns) as avg_concurrency
    FROM revenue_attribution_analysis ra
    JOIN (
        SELECT DISTINCT 
            order_id,
            order_date,
            campaign_id
        FROM (
            SELECT 
                o.id as order_id,
                o.created_at::date as order_date,
                (attribution->>'campaign_id')::UUID as campaign_id
            FROM orders o,
            LATERAL jsonb_array_elements(
                calculate_campaign_attributions(o.created_at::date)->'attributions'
            ) as attribution
            WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
        ) expanded_orders
    ) orders_expanded ON ra.campaign_id = orders_expanded.campaign_id
    GROUP BY DATE_TRUNC('week', order_date)
)
SELECT 
    week as "週",
    ROUND(weekly_revenue::numeric, 2) as "週營收",
    active_campaigns as "活躍活動數",
    ROUND(avg_concurrency::numeric, 2) as "平均並發度"
FROM daily_metrics
ORDER BY week DESC
LIMIT 8;
```

### **3. ROI 績效報告**

```sql
-- 計算活動投資報酬率 (需要活動成本資料)
SELECT 
    campaign_name as "活動名稱",
    attribution_layer as "層級",
    influenced_orders as "影響訂單",
    ROUND(total_attributed_revenue::numeric, 2) as "歸因營收",
    -- 假設有活動成本欄位
    -- ROUND((total_attributed_revenue / campaign_cost - 1) * 100, 2) as "ROI%",
    ROUND(total_attributed_revenue / influenced_orders::numeric, 2) as "平均訂單價值"
FROM revenue_attribution_analysis
WHERE campaign_name IS NOT NULL
AND influenced_orders > 0
ORDER BY total_attributed_revenue DESC;
```

## 🔍 進階分析技巧

### **1. 活動歸因深度分析**

```sql
-- 分析特定日期的歸因細節
WITH attribution_detail AS (
    SELECT jsonb_pretty(calculate_campaign_attributions('2025-03-08')) as attribution_json
)
SELECT attribution_json as "2025-03-08 歸因分析"
FROM attribution_detail;
```

### **2. 活動效果預測分析**

```sql
-- 基於歷史資料預測活動效果
WITH campaign_patterns AS (
    SELECT 
        campaign_type,
        attribution_layer,
        AVG(total_attributed_revenue) as avg_revenue,
        AVG(influenced_orders) as avg_orders,
        AVG(avg_attribution_weight) as avg_weight
    FROM revenue_attribution_analysis
    WHERE campaign_name IS NOT NULL
    GROUP BY campaign_type, attribution_layer
)
SELECT 
    campaign_type as "活動類型",
    attribution_layer as "歸因層級",
    ROUND(avg_revenue::numeric, 2) as "預期平均營收",
    ROUND(avg_orders::numeric, 0) as "預期影響訂單",
    ROUND(avg_weight::numeric, 4) as "預期歸因權重"
FROM campaign_patterns
ORDER BY avg_revenue DESC;
```

### **3. 季節性趨勢分析**

```sql
-- 分析不同月份的活動效果模式
SELECT 
    EXTRACT(MONTH FROM order_date) as "月份",
    COUNT(DISTINCT campaign_id) as "活動數量",
    SUM(total_attributed_revenue) as "月度總營收",
    AVG(avg_concurrent_campaigns) as "平均並發度"
FROM revenue_attribution_analysis
WHERE order_date IS NOT NULL
GROUP BY EXTRACT(MONTH FROM order_date)
ORDER BY "月份";
```

## 常見使用問題

### **問題 1: 為什麼營收數字和傳統報表不同？**

**答案**: 新系統使用分層歸因機制，解決了重疊活動的重複計算問題。傳統方法可能將同一筆訂單計算給多個活動，而新系統按權重分配，確保總營收的準確性。

**驗證方法**:
```sql
-- 比較歸因方法的差異
SELECT * FROM compare_attribution_methods(
    '2025-03-01'::DATE, 
    '2025-03-31'::DATE
);
```

### **問題 2: 如何理解歸因權重？**

**答案**: 歸因權重表示活動在重疊期間的影響力佔比：
- **1.0**: 該活動在其層級中完全主導
- **0.5**: 該活動與同層級其他活動平分影響力
- **0.3**: 該活動是次要影響因素

### **問題 3: 為什麼有些活動沒有歸因營收？**

**可能原因**:
1. 活動期間沒有符合條件的訂單
2. 活動權重設定為 0
3. 活動日期設定錯誤

**檢查方法**:
```sql
-- 檢查活動設定
SELECT 
    campaign_name,
    start_date,
    end_date,
    attribution_weight,
    attribution_layer
FROM campaigns 
WHERE campaign_name = '您的活動名稱';

-- 檢查活動期間的訂單
SELECT COUNT(*) as order_count, SUM(total_amount) as total_revenue
FROM orders 
WHERE created_at::date BETWEEN '活動開始日期' AND '活動結束日期'
AND status IN ('paid', 'processing', 'shipped', 'delivered', 'completed');
```

## 日常操作檢查清單

### **行銷人員日常檢查**
- [ ] 檢查進行中活動的即時效果
- [ ] 監控活動重疊情況
- [ ] 分析昨日營收歸因
- [ ] 檢查假期設定是否完整

### **分析師日常檢查**  
- [ ] 驗證數據品質
- [ ] 製作週度效果報告
- [ ] 分析活動協作模式
- [ ] 預測未來活動效果

### **營運人員日常檢查**
- [ ] 執行系統健康檢查
- [ ] 確認假期同步狀態
- [ ] 監控查詢效能
- [ ] 處理異常數據

## 📞 支援和協助

### **技術支援**
- 如遇到查詢錯誤或系統異常，請聯絡資料工程團隊
- 提供具體的錯誤訊息和執行的 SQL 語句

### **業務諮詢**
- 關於歸因邏輯或分析方法的疑問，請參考技術文件
- 新需求或功能改進建議，請提交需求單

### **學習資源**
- [技術架構文件](./CAMPAIGN_DIMENSION_ARCHITECTURE.md)
- [系統維護指南](./CAMPAIGN_MAINTENANCE_GUIDE.md)
- [API 參考文件](./CAMPAIGN_API_REFERENCE.md)

---

## 🎓 最佳實踐建議

### **活動規劃建議**
1. **避免過度重疊**: 同層級活動重疊可能稀釋個別效果
2. **平衡活動組合**: 搭配不同層級活動以最大化協作效應
3. **考慮假期因素**: 假期期間調整活動策略和預期

### **分析習慣建議**
1. **定期檢查**: 每週檢查歸因品質和數據一致性
2. **趨勢對比**: 比較同期活動效果，識別改進機會
3. **假設驗證**: 使用 A/B 測試驗證歸因分析的洞察

### **報表製作建議**
1. **視覺化呈現**: 將複雜的歸因資料製作成圖表
2. **重點突出**: 聚焦於高影響力的活動和關鍵洞察
3. **actionable**: 提供具體的行動建議和改進方向

---

**文件版本**: v1.0  
**最後更新**: 2025-07-24  
**適用對象**: 業務人員、行銷人員、分析師