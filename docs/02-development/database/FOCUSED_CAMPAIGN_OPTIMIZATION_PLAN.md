# 聚焦優化計畫：campaigns、dim_date、holidays 三表關係

## 問題分析總結

### 🔍 **核心問題識別**

#### 1. **活動重疊處理缺陷** (高優先級)
- **現況**: 觸發器只能在 `dim_date.campaign_name` 存放一個活動名稱
- **問題**: 重疊活動會互相覆蓋，後者覆蓋前者
- **影響**: 活動歸因錯誤，營收分析失準

#### 2. **歸因邏輯重複計算** (高優先級)  
- **現況**: `revenue_by_campaign` 在訂單落在多活動期間時產生重複記錄
- **問題**: 同一筆訂單被多個活動重複計算營收
- **影響**: 活動ROI分析嚴重失真

#### 3. **假期同步機制缺失** (中優先級)
- **現況**: `holidays` 表與 `dim_date.is_holiday` 需手動同步
- **問題**: 容易產生資料不一致
- **影響**: 假期影響分析不準確

### **實際數據驗證**

從 seed 資料發現的重疊案例：
```
春季新品上市 (2025-03-01 ~ 2025-03-15)
  └─ 重疊：婦女節感恩回饋 (2025-03-06 ~ 2025-03-10) → 5天重疊
  └─ 重疊：會員專屬VIP日 (2025-02-28 ~ 2025-03-02) → 2天重疊

母親節溫馨獻禮 (2025-05-05 ~ 2025-05-15) 
  └─ 重疊：夏季清涼節 (2025-05-20 ~ 2025-05-30) → 無重疊
  └─ 但與居家生活節 (2025-05-01 ~ 2025-05-07) → 3天重疊
```

## 優化方案設計

### **階段一：解決活動重疊歸因問題** (高優先級)

#### 方案選擇：多活動歸因策略

**選項 A: 主活動優先策略** 
- 按活動重要性排序，重疊期間歸因給主活動
- 簡單但可能低估次要活動效果

**選項 B: 營收分攤策略**
- 重疊期間的營收按比例分攤給各活動  
- 複雜但更公平

**選項 C: 分層歸因策略** ⭐ **推薦**
- 建立活動層級概念，允許同時存在不同層級活動
- 例如：全站活動 + 品類活動 + 會員活動可同時進行

#### 實作方向：
1. 擴展 `dim_date` 支援多活動歸因
2. 重構 `revenue_by_campaign` 避免重複計算
3. 建立活動衝突檢測和解決機制

### **階段二：優化假期同步機制** (中優先級)

#### 建立自動同步機制：
1. 建立觸發器自動同步 `holidays` → `dim_date.is_holiday`
2. 提供批次同步函數處理歷史資料
3. 建立假期影響分析視圖

### **階段三：建立核心分析視圖** (中優先級)

#### 關鍵分析需求：
1. **活動效果分析**: 正確的營收歸因，避免重複計算
2. **假期影響分析**: 量化假期對消費行為的影響
3. **活動衝突分析**: 識別和管理活動重疊情況

## 實作規劃

### **第一步：資料模型調整**

```sql
-- 1. 擴展 dim_date 支援多活動
ALTER TABLE dim_date ADD COLUMN primary_campaign_id UUID;
ALTER TABLE dim_date ADD COLUMN secondary_campaign_ids UUID[];
ALTER TABLE dim_date ADD COLUMN campaign_hierarchy JSONB;

-- 2. 建立活動層級定義
ALTER TABLE campaigns ADD COLUMN campaign_level TEXT DEFAULT 'primary';
ALTER TABLE campaigns ADD COLUMN priority_score INTEGER DEFAULT 1;
```

### **第二步：改良歸因邏輯**

```sql
-- 重構 revenue_by_campaign 視圖
-- 實作防重複計算的歸因邏輯
CREATE OR REPLACE VIEW revenue_by_campaign_v2 AS 
WITH campaign_attribution AS (
  -- 實作智慧歸因邏輯
  -- 處理重疊活動的營收分配
)
SELECT campaign_id, campaign_name, 
       attributed_revenue, -- 分配後的營收
       exclusive_revenue,  -- 獨占期間營收  
       shared_revenue      -- 重疊期間分配營收
FROM campaign_attribution;
```

### **第三步：建立管理工具**

```sql
-- 活動衝突檢測函數
CREATE FUNCTION detect_campaign_conflicts(...)
RETURNS TABLE(conflict_info);

-- 活動效果比較函數
CREATE FUNCTION compare_campaign_performance(...)
RETURNS TABLE(performance_metrics);

-- 假期影響評估函數  
CREATE FUNCTION analyze_holiday_impact(...)
RETURNS TABLE(impact_analysis);
```

## 成功指標

### **技術指標**
- ✅ 消除營收重複計算問題
- ✅ 活動重疊檢測準確率 100%
- ✅ 假期資料同步一致性 100%
- ✅ 查詢效能提升 > 50%

### **業務指標**  
- ✅ 活動ROI分析準確性
- ✅ 假期影響量化分析
- ✅ 活動規劃決策支援
- ✅ 營收歸因透明度

## 實作時程

### **Week 1: 問題修復**
- 修復活動重疊覆蓋問題
- 建立假期自動同步機制
- 修正 revenue_by_campaign 重複計算

### **Week 2: 功能增強**
- 實作多活動歸因邏輯
- 建立活動衝突檢測
- 建立核心分析視圖

### **Week 3: 驗證優化**
- 資料完整性驗證
- 效能測試與調校
- 使用文件編寫

## 風險評估

### **低風險**
- 假期同步機制：簡單且安全
- 查詢效能優化：只涉及索引和視圖

### **中風險**  
- 多活動歸因邏輯：需要仔細設計避免複雜度過高
- 資料遷移：需要處理現有不一致資料

### **高風險**
- 商業邏輯變更：需要與業務團隊確認歸因策略

## 下一步行動

1. **確認歸因策略**: 與業務團隊討論多活動重疊的處理邏輯
2. **建立測試環境**: 準備資料驗證環境  
3. **逐步實作**: 按階段推進，每階段都要驗證效果
4. **文件化**: 記錄所有變更和使用方式

---

*此計畫專注於解決 campaigns、dim_date、holidays 三表的核心關係問題，events 表的優化將作為獨立項目處理。*