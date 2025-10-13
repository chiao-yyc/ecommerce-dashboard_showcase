# 業務健康度規則對照表

## 文件資訊

- **建立日期**: 2025-10-01
- **最後更新**: 2025-10-01
- **文件版本**: v1.0
- **適用系統**: Business Health Analytics v1.0

---

## 文件目的

本文件提供業務健康度洞察系統的完整規則對照表，包含：

1. **業務洞察生成規則** - 所有洞察觸發條件與輸出格式
2. **警示生成規則** - 指標閾值與警報觸發邏輯
3. **戰略建議規則** - 基於警示的建議對應關係
4. **健康度評分標準** - 各維度計算公式與評級標準

---

## 一、業務洞察生成規則

### 1.1 洞察類型總覽

| 洞察ID | 洞察標題 | 觸發條件 | 類型 | 影響 | 信心度 | 分類 |
|-------|---------|---------|------|------|--------|------|
| INS-001 | 業務表現優異 | `overallScore >= 90` | opportunity | low | 0.95 | 業務分析 |
| INS-002 | 業務健康度需改善 | `overallScore <= 60` | warning | high | 0.90 | 風險管理 |
| INS-003 | 系統穩定度警告 | `metrics.system < 7.0` | warning | high | 0.85 | 技術監控 |
| INS-004 | 業務指標下滑趨勢 | `trends.direction='下降' AND change > 5` | warning | high | 0.88 | 趨勢分析 |
| INS-005 | 業務成長動能強勁 | `trends.direction='上升' AND change > 10` | opportunity | medium | 0.90 | 成長機會 |
| INS-006 | 客服效能待改善 | `metrics.support < 5.0` | info | medium | 0.80 | 客戶服務 |
| INS-007 | 營收表現需關注 | `metrics.revenue < 6.0` | warning | high | 0.87 | 財務分析 |

### 1.2 詳細規則說明

#### INS-001: 業務表現優異

**觸發條件**
```typescript
overallScore >= 90
```

**判斷邏輯**
- 綜合評分達到 90 分以上
- 表示業務各方面運行良好

**輸出格式**
```json
{
  "title": "業務表現優異",
  "description": "整體健康度達到 {overallScore} 分，系統運行狀況良好",
  "type": "opportunity",
  "impact": "low",
  "confidence": 0.95,
  "category": "業務分析",
  "actions": [
    "持續監控關鍵指標",
    "擴大成功策略應用"
  ]
}
```

**業務意義**
- 正面回饋，鼓勵團隊保持現狀
- 可考慮擴大業務規模
- 建立最佳實踐案例

**適用場景**
- 季度業務回顧
- 投資者簡報
- 績效考核

---

#### INS-002: 業務健康度需改善

**觸發條件**
```typescript
overallScore <= 60
```

**判斷邏輯**
- 綜合評分低於 60 分
- 表示業務存在明顯問題

**輸出格式**
```json
{
  "title": "業務健康度需改善",
  "description": "整體健康度僅 {overallScore} 分，建議優先改善關鍵指標",
  "type": "warning",
  "impact": "high",
  "confidence": 0.90,
  "category": "風險管理",
  "actions": [
    "檢視營運流程",
    "改善客戶體驗",
    "優化支援效率"
  ]
}
```

**業務意義**
- 需要立即關注並採取行動
- 建議召開緊急會議
- 制定改善計劃

**適用場景**
- 業務危機管理
- 營運優化專案
- 組織結構調整

**關聯指標**
- 客戶品質 < 60
- 營運效率 < 60
- 客服效能 < 60

---

#### INS-003: 系統穩定度警告

**觸發條件**
```typescript
metrics.system < 7.0
```

**判斷邏輯**
- 系統穩定度評分低於 7.0 分
- 基於 Realtime 警報狀態計算
- 可能影響業務運行

**輸出格式**
```json
{
  "title": "系統穩定度警告",
  "description": "系統穩定度 {system.toFixed(1)} 分低於標準，可能影響業務運行",
  "type": "warning",
  "impact": "high",
  "confidence": 0.85,
  "category": "技術監控",
  "actions": [
    "檢查系統模組狀態",
    "執行故障排除",
    "強化監控機制"
  ]
}
```

**系統穩定度計算公式**
```typescript
// 多模組權重計算
const notificationWeight = 1.5  // 通知系統權重
const orderWeight = 2.0         // 訂單系統權重（最重要）
const inventoryWeight = 1.2     // 庫存系統權重

const totalWeight = notificationWeight + orderWeight + inventoryWeight

const weightedScore = (
  (notificationStability * notificationWeight) +
  (orderStability * orderWeight) +
  (inventoryStability * inventoryWeight)
) / totalWeight

// 系統效能因子調整
const systemPerformanceFactor = 0.95
const finalStability = Math.min(weightedScore * systemPerformanceFactor, 10)
```

**業務意義**
- 技術問題可能影響客戶體驗
- 需要技術團隊立即介入
- 可能需要臨時停機維護

**適用場景**
- 技術故障應對
- 系統升級決策
- DevOps 流程改進

---

#### INS-004: 業務指標下滑趨勢

**觸發條件**
```typescript
trends.direction === '下降' AND trends.change > 5
```

**判斷邏輯**
- 週對週比較呈現下降趨勢
- 下降幅度超過 5%
- 需要立即關注

**輸出格式**
```json
{
  "title": "業務指標下滑趨勢",
  "description": "檢測到業務指標下降 {change.toFixed(1)}%，需要立即關注",
  "type": "warning",
  "impact": "high",
  "confidence": 0.88,
  "category": "趨勢分析",
  "actions": [
    "分析下降原因",
    "制定改善計劃",
    "加強監控頻率"
  ]
}
```

**趨勢計算邏輯**
```typescript
// 計算客戶品質變化
const customerChange = (current.customerQuality - previous.customerQuality) * 100

// 計算營運效率變化
const operationalChange = (current.operationalEfficiency - previous.operationalEfficiency) * 100

// 平均變化幅度
const avgChange = (customerChange + operationalChange) / 2

// 趨勢判定
if (avgChange < -2) {
  direction = '下降'
  change = Math.abs(avgChange)
}
```

**業務意義**
- 業務衰退的早期訊號
- 需要找出根本原因
- 可能需要策略調整

**適用場景**
- 業績下滑應對
- 市場競爭分析
- 產品策略調整

**常見原因分析**
1. 客戶流失率上升
2. 訂單轉換率下降
3. 競爭對手促銷
4. 產品品質問題
5. 客服回應變慢

---

#### INS-005: 業務成長動能強勁

**觸發條件**
```typescript
trends.direction === '上升' AND trends.change > 10
```

**判斷邏輯**
- 週對週比較呈現上升趨勢
- 上升幅度超過 10%
- 表現優於預期

**輸出格式**
```json
{
  "title": "業務成長動能強勁",
  "description": "業務指標上升 {change.toFixed(1)}%，表現優於預期",
  "type": "opportunity",
  "impact": "medium",
  "confidence": 0.90,
  "category": "成長機會",
  "actions": [
    "分析成功因素",
    "擴大優勢策略",
    "設定更高目標"
  ]
}
```

**業務意義**
- 業務成長的正面訊號
- 適合擴大投資規模
- 可複製成功經驗

**適用場景**
- 成長策略制定
- 資源分配決策
- 團隊激勵

**成功因素檢查清單**
- [ ] 新的行銷活動是否奏效？
- [ ] 產品改進是否受歡迎？
- [ ] 客戶滿意度是否提升？
- [ ] 轉換率是否優化？
- [ ] 團隊效率是否提高？

---

#### INS-006: 客服效能待改善

**觸發條件**
```typescript
metrics.support < 5.0
```

**判斷邏輯**
- 客服健康度評分低於 5.0 分
- 可能影響客戶滿意度

**輸出格式**
```json
{
  "title": "客服效能待改善",
  "description": "客服健康度 {support.toFixed(1)} 分，可能影響客戶滿意度",
  "type": "info",
  "impact": "medium",
  "confidence": 0.80,
  "category": "客戶服務",
  "actions": [
    "優化回應時間",
    "培訓客服人員",
    "改善服務流程"
  ]
}
```

**客服健康度計算**
```typescript
// 基於 tickets 和 conversation_summary 計算
const avgResponseTime = query('SELECT AVG(first_response_minutes) FROM conversation_summary')
const resolutionRate = query('SELECT AVG(resolution_rate) FROM tickets')

// 回應時間評分 (越低越好)
const responseScore = Math.max(0, 10 - (avgResponseTime / 60))

// 解決率評分
const resolutionScore = resolutionRate * 10

// 綜合評分
const supportHealth = (responseScore * 0.3 + resolutionScore * 0.7)
```

**業務意義**
- 客戶體驗可能受影響
- 需要客服團隊改進
- 可能導致負面評價

**適用場景**
- 客服團隊培訓
- 服務流程優化
- 客戶滿意度提升

---

#### INS-007: 營收表現需關注

**觸發條件**
```typescript
metrics.revenue < 6.0
```

**判斷邏輯**
- 營收健康度評分低於 6.0 分
- 建議檢視訂單流程

**輸出格式**
```json
{
  "title": "營收表現需關注",
  "description": "營收健康度 {revenue.toFixed(1)} 分，建議檢視訂單流程",
  "type": "warning",
  "impact": "high",
  "confidence": 0.87,
  "category": "財務分析",
  "actions": [
    "分析訂單轉換率",
    "優化付款流程",
    "提升產品競爭力"
  ]
}
```

**營收健康度計算**
```typescript
// 基於 order_summary 計算
const currentMonthRevenue = query('SELECT SUM(total_amount) FROM orders WHERE ...')
const previousMonthRevenue = query('SELECT SUM(total_amount) FROM orders WHERE ...')
const revenueGrowth = (currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue

// 目標達成率
const revenueTarget = getMonthlyTarget()
const achievementRate = currentMonthRevenue / revenueTarget

// 綜合評分
const revenueHealth = (revenueGrowth * 5 + achievementRate * 10) / 2
```

**業務意義**
- 營收目標可能無法達成
- 需要檢視銷售策略
- 可能影響公司財務

**適用場景**
- 營收策略調整
- 銷售團隊動員
- 產品定價優化

---

## 🚨 二、警示生成規則 (Phase 1.5)

### 2.1 指標閾值總表

| metric_name | 顯示名稱 | 分類 | 閾值 | 比較 | 嚴重度 | 警報訊息範本 |
|------------|---------|------|------|------|--------|-------------|
| customer_churn_rate | 客戶流失率 | 客戶健康 | 15.0 | > | critical | 客戶流失率達到 {value}%，超過警戒值 {threshold}% |
| high_value_customer_count | 高價值客戶數 | 客戶價值 | 50 | < | warning | 高價值客戶僅剩 {value} 位，低於目標 {threshold} 位 |
| avg_response_time | 平均回應時間 | 客服效率 | 120.0 | > | warning | 平均回應時間 {value} 分鐘，超過標準 {threshold} 分鐘 |
| order_completion_rate | 訂單完成率 | 營運效率 | 85.0 | < | warning | 訂單完成率 {value}%，低於標準 {threshold}% |
| inventory_stockout_count | 缺貨商品數量 | 庫存管理 | 3.0 | > | warning | 缺貨商品數量 {value} 件，超過警戒值 {threshold} 件 |
| business_momentum_trend | 業務動能趨勢 | 業務動能 | -5.0 | < | critical | 業務動能下降 {value}%，需要立即關注 |
| customer_growth_trend | 客戶成長趨勢 | 成長指標 | 0.0 | <= | warning | 客戶成長率 {value}%，低於預期 |

### 2.2 警報生成邏輯

#### SQL 函數: `generate_dashboard_alerts()`

```sql
CREATE OR REPLACE FUNCTION generate_dashboard_alerts()
RETURNS TABLE (
    id UUID,
    alert_type VARCHAR(50),
    title VARCHAR(200),
    message TEXT,
    severity VARCHAR(20),
    metric_name VARCHAR(100),
    current_value DECIMAL,
    threshold_value DECIMAL,
    confidence_score DECIMAL(3,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 遍歷所有活躍閾值
    FOR metric IN SELECT * FROM metric_thresholds WHERE is_active = TRUE
    LOOP
        -- 查詢當前指標值
        EXECUTE format('SELECT %s FROM %s WHERE %s',
                       metric.metric_column,
                       metric.source_table,
                       metric.filter_condition)
        INTO current_value;

        -- 判斷是否超過閾值
        IF evaluate_threshold(current_value, metric.threshold_value, metric.comparison_operator) THEN
            -- 生成警報
            RETURN QUERY
            INSERT INTO dashboard_alerts (...)
            VALUES (...)
            RETURNING *;
        END IF;
    END LOOP;
END;
$$;
```

### 2.3 前端警報組合邏輯

#### 警報來源整合

```typescript
// DashboardApiService.ts - getSystemAlerts()
const alerts: SystemAlert[] = []

// 1. Realtime 警報 (系統穩定度)
const realtimeAlerts = getGlobalRealtimeAlerts().getRealtimeAlerts()
alerts.push(...realtimeAlerts)

// 2. 庫存警報
const inventoryAlerts = await this.getInventoryAlerts()
// - 缺貨警報: out_of_stock_count > 0 → error
// - 庫存不足: low_stock_count > 0 → warning
// - 庫存充足: healthy_stock_count > 0 AND alerts.length === 0 → success

// 3. 客服警報
const supportAlerts = await this.getSupportAlerts()
// - 回應時間過長: avg_response > 120min → warning
// - 回應時間良好: avg_response <= 60min → success
// - 工作量提醒: total_conversations > 0 → info

// 4. 訂單警報
const orderAlerts = await this.getOrderAlerts()
// - 待處理訂單: pending > 2hrs → warning
// - 今日訂單活動: completed_today > 0 → info
```

#### 優先級排序

```typescript
// 按優先級排序: error > warning > info > success
const priorityOrder = { error: 1, warning: 2, info: 3, success: 4 }
alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])

// 限制顯示數量 (最多 8 個)
return alerts.slice(0, 8)
```

---

## 三、戰略建議規則 (Phase 1.5)

### 3.1 建議類型總表

| recommendation_type | 對應 metric_name | 分類 | 標題 | 影響 | 工作量 | 優先級 | 時間軸 |
|--------------------|-----------------|------|------|------|--------|--------|--------|
| customer_retention | customer_churn_rate | 客戶價值 | 啟動客戶流失預防計劃 | high | high | 95 | 緊急（2-4週） |
| customer_acquisition | high_value_customer_count | 業務成長 | 重建高價值客戶群 | high | high | 90 | 中期（2-3個月） |
| business_turnaround | business_momentum_trend | 營運策略 | 業務動能復甦行動 | high | high | 100 | 立即執行（1-2個月） |
| growth_recovery | customer_growth_trend | 成長策略 | 客戶成長策略調整 | high | medium | 85 | 短中期（6-12週） |
| operational_improvement | avg_response_time | 客服優化 | 改善客服回應效率 | high | medium | 85 | 2-4週 |
| process_optimization | order_completion_rate | 營運效率 | 訂單處理流程優化 | medium | medium | 75 | 3-6週 |
| inventory_management | inventory_stockout_count | 庫存管理 | 庫存補貨策略優化 | medium | medium | 70 | 2-4週 |
| general_improvement | (其他) | 系統優化 | 系統監控優化 | medium | low | 60 | 短期（2-4週） |

### 3.2 建議生成邏輯

#### SQL 函數: `generate_strategic_recommendations()`

```sql
CREATE OR REPLACE FUNCTION generate_strategic_recommendations()
RETURNS TABLE (
    recommendation_type VARCHAR(50),
    category VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    impact_level VARCHAR(20),
    effort_level VARCHAR(20),
    priority_score INTEGER,
    confidence_score DECIMAL(3,2),
    business_context JSONB,
    estimated_timeline VARCHAR(50)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 基於現有警示生成建議
    FOR current_alerts IN
        SELECT * FROM dashboard_alerts
        WHERE is_active = TRUE AND is_resolved = FALSE
        AND severity IN ('critical', 'warning')
        ORDER BY severity DESC, detected_at DESC
        LIMIT 5
    LOOP
        -- 根據 metric_name 匹配規則
        CASE current_alerts.metric_name
            WHEN 'customer_churn_rate' THEN
                RETURN QUERY SELECT
                    'customer_retention'::VARCHAR(50),
                    '客戶價值'::VARCHAR(50),
                    '啟動客戶流失預防計劃'::VARCHAR(200),
                    format('當前客戶流失率%s，建議立即檢討客戶滿意度並啟動挽回計劃。',
                           format_metric_value(current_alerts.current_value, 'percentage'))::TEXT,
                    'high'::VARCHAR(20),
                    'high'::VARCHAR(20),
                    95::INTEGER,
                    0.90::DECIMAL(3,2),
                    jsonb_build_object(
                        'source_alert_id', current_alerts.id,
                        'current_value', current_alerts.current_value,
                        'impact', '營收保護'
                    )::JSONB,
                    '緊急（2-4週）'::VARCHAR(50);
            -- ... 其他規則
        END CASE;
    END LOOP;

    -- 無警示時返回預防性建議
    IF recommendation_count = 0 THEN
        RETURN QUERY SELECT
            'preventive_excellence'::VARCHAR(50),
            '營運卓越'::VARCHAR(50),
            '建立預防性監控體系'::VARCHAR(200),
            '業務指標運行正常，建議建立更完善的預防性監控機制以保持穩定發展。'::TEXT,
            'medium'::VARCHAR(20),
            'low'::VARCHAR(20),
            70::INTEGER,
            0.75::DECIMAL(3,2),
            jsonb_build_object('focus', '持續改善')::JSONB,
            '持續執行'::VARCHAR(50);
    END IF;
END;
$$;
```

### 3.3 詳細建議規則

#### REC-001: 客戶流失預防計劃

**觸發條件**: `metric_name = 'customer_churn_rate'`

**建議內容**
- **類型**: customer_retention
- **分類**: 客戶價值
- **標題**: 啟動客戶流失預防計劃
- **說明**: 當前客戶流失率{value}%，建議立即檢討客戶滿意度並啟動挽回計劃
- **影響程度**: high (可能流失大量營收)
- **工作量**: high (需要跨部門協作)
- **優先級**: 95/100
- **信心度**: 0.90
- **時間軸**: 緊急（2-4週）

**建議行動**
1. 立即進行客戶滿意度調查
2. 分析流失客戶特徵
3. 制定挽回計劃並執行
4. 建立預防性監控機制

**業務脈絡**
```json
{
  "source_alert_id": "uuid",
  "current_value": 18.5,
  "impact": "營收保護",
  "estimated_revenue_loss": "NT$200,000/月",
  "target_churn_rate": "< 10%"
}
```

---

#### REC-002: 重建高價值客戶群

**觸發條件**: `metric_name = 'high_value_customer_count'`

**建議內容**
- **類型**: customer_acquisition
- **分類**: 業務成長
- **標題**: 重建高價值客戶群
- **說明**: 高價值客戶僅剩{value}位，建議調整產品定位並加強VIP客戶服務
- **影響程度**: high
- **工作量**: high
- **優先級**: 90/100
- **信心度**: 0.85
- **時間軸**: 中期（2-3個月）

**建議行動**
1. 分析高價值客戶流失原因
2. 重新檢視產品定位和價值主張
3. 建立VIP客戶專屬服務
4. 開展高端客戶獲取活動

**業務脈絡**
```json
{
  "source_alert_id": "uuid",
  "current_value": 32,
  "target_customers": 50,
  "expected_roi": "200-300%",
  "avg_customer_value": "NT$50,000"
}
```

---

#### REC-003: 業務動能復甦行動

**觸發條件**: `metric_name = 'business_momentum_trend'`

**建議內容**
- **類型**: business_turnaround
- **分類**: 營運策略
- **標題**: 業務動能復甦行動
- **說明**: 業務動能{direction}{value}%，建議成立專案小組進行市場分析並制定改善計劃
- **影響程度**: high
- **工作量**: high
- **優先級**: 100/100 (最高優先級)
- **信心度**: 0.88
- **時間軸**: 立即執行（1-2個月）

**建議行動**
1. 召開緊急高階會議
2. 成立業務復甦專案小組
3. 進行全面市場和競爭分析
4. 制定並執行短期改善計劃

**業務脈絡**
```json
{
  "source_alert_id": "uuid",
  "trend_direction": "下降",
  "change_percentage": -8.5,
  "priority": "CEO直接監督",
  "board_notification": true
}
```

---

## 📈 四、健康度評分標準

### 4.1 綜合評分計算

#### 評分維度與權重

```typescript
interface ScoreWeights {
  customerQuality: 0.40        // 40% 權重
  operationalEfficiency: 0.35  // 35% 權重
  supportEffectiveness: 0.25   // 25% 權重
}

overallScore = (
  customerQuality * 0.40 +
  operationalEfficiency * 0.35 +
  supportEffectiveness * 0.25
)
```

#### 評級標準

| 分數 | 評級 | 顏色 | 圖示 | 業務狀態 | 建議行動 |
|------|------|------|------|---------|---------|
| 90-100 | 優秀 | 綠色 | ✅ | 卓越表現 | 保持現狀，擴大規模 |
| 75-89 | 良好 | 藍色 | 👍 | 運行順暢 | 持續優化，關注弱項 |
| 60-74 | 普通 | 黃色 | ⚠️ | 基本穩定 | 制定改善計劃 |
| 40-59 | 需改善 | 橘色 | ⚡ | 存在問題 | 立即採取行動 |
| 0-39 | 待加強 | 紅色 | 🚨 | 嚴重問題 | 緊急應對措施 |

### 4.2 客戶品質評分

#### 計算公式

```typescript
// 基於 RFM 分析
const rfmData = query('SELECT r_score, f_score, m_score FROM user_rfm_lifecycle_metrics')

// 計算平均 RFM 分數 (1-5 scale)
const avgRScore = average(rfmData.map(d => d.r_score))
const avgFScore = average(rfmData.map(d => d.f_score))
const avgMScore = average(rfmData.map(d => d.m_score))

const avgRfmScore = (avgRScore + avgFScore + avgMScore) / 3

// 轉換為 0-100 分數
customerQuality = (avgRfmScore / 5) * 100
```

#### 評分標準

| 分數 | RFM 平均 | 客戶品質 | 說明 |
|------|---------|---------|------|
| 90-100 | 4.5-5.0 | 優秀 | 大量高價值客戶 |
| 80-89 | 4.0-4.4 | 良好 | 客戶忠誠度高 |
| 70-79 | 3.5-3.9 | 中上 | 客戶品質穩定 |
| 60-69 | 3.0-3.4 | 中等 | 有改善空間 |
| < 60 | < 3.0 | 待加強 | 需要客戶策略調整 |

### 4.3 營運效率評分

#### 計算公式

```typescript
// 基於訂單完成率
const orderSummary = query('SELECT * FROM order_summary WHERE ...')

const totalOrders = orderSummary.total_orders
const completedOrders = orderSummary.completed_orders
const cancelledOrders = orderSummary.cancelled_orders

// 訂單完成率
const completionRate = completedOrders / totalOrders

// 轉換為 0-100 分數
operationalEfficiency = completionRate * 100
```

#### 評分標準

| 分數 | 完成率 | 營運效率 | 說明 |
|------|--------|---------|------|
| 95-100 | 95-100% | 卓越 | 營運流程完善 |
| 85-94 | 85-94% | 良好 | 營運穩定 |
| 75-84 | 75-84% | 中等 | 有優化空間 |
| 60-74 | 60-74% | 待改善 | 需要流程改進 |
| < 60 | < 60% | 嚴重問題 | 營運流程需重建 |

### 4.4 客服效能評分

#### 計算公式

```typescript
// 基於解決率和回應時間
const ticketData = query('SELECT resolution_rate FROM tickets WHERE ...')
const conversationData = query('SELECT avg_first_response_minutes FROM conversation_summary WHERE ...')

// 解決率評分 (0-100)
const resolutionRate = average(ticketData.map(d => d.resolution_rate))
const resolutionScore = resolutionRate * 100

// 回應時間評分 (越低越好)
const avgResponseMinutes = average(conversationData.map(d => d.avg_first_response_minutes))
const responseScore = Math.max(0, 100 - (avgResponseMinutes / 120 * 100))  // 120min 為基準

// 綜合評分 (解決率 70%, 回應時間 30%)
supportEffectiveness = resolutionScore * 0.7 + responseScore * 0.3
```

#### 評分標準

| 分數 | 解決率 | 回應時間 | 客服效能 |
|------|--------|---------|---------|
| 90-100 | > 90% | < 30min | 卓越 |
| 80-89 | 80-90% | 30-60min | 優秀 |
| 70-79 | 70-80% | 60-90min | 良好 |
| 60-69 | 60-70% | 90-120min | 中等 |
| < 60 | < 60% | > 120min | 待改善 |

---

## 五、閾值調整指南

### 5.1 何時需要調整閾值

**業務環境變化**
- 市場競爭加劇
- 季節性業務波動
- 公司策略調整
- 行業標準更新

**資料量變化**
- 業務規模擴大 (訂單量增加)
- 客戶基數成長
- 產品種類增加

**誤報率過高**
- 警報頻繁但非真實問題
- 團隊疲於應對假警報
- 重要警報被淹沒

### 5.2 閾值調整建議

#### 客戶流失率 (customer_churn_rate)

| 業務階段 | 建議閾值 | 警報級別 | 理由 |
|---------|---------|---------|------|
| 初創期 | 20% | warning | 客戶基數小，波動大 |
| 成長期 | 15% | critical | 標準值，需要控制 |
| 成熟期 | 10% | critical | 客戶穩定，應更嚴格 |

#### 平均回應時間 (avg_response_time)

| 客服團隊規模 | 建議閾值 | 警報級別 | 理由 |
|------------|---------|---------|------|
| 小型 (1-3人) | 180min | warning | 人力有限 |
| 中型 (4-10人) | 120min | warning | 標準配置 |
| 大型 (10+人) | 60min | warning | 高標準服務 |

#### 訂單完成率 (order_completion_rate)

| 產品類型 | 建議閾值 | 警報級別 | 理由 |
|---------|---------|---------|------|
| 實體商品 | 85% | warning | 考慮物流因素 |
| 數位商品 | 95% | warning | 應該更高 |
| 客製化商品 | 75% | warning | 製作時間長 |

### 5.3 閾值調整流程

1. **資料收集**: 收集最近 30-90 天的歷史資料
2. **統計分析**: 計算平均值、標準差、百分位數
3. **業務討論**: 與業務團隊確認合理範圍
4. **試運行**: 在測試環境驗證新閾值
5. **正式部署**: 更新生產環境設定
6. **持續監控**: 觀察調整後的警報頻率

### 5.4 閾值更新 SQL

```sql
-- 更新指標閾值
UPDATE metric_thresholds
SET threshold_value = 12.0,
    updated_at = NOW()
WHERE metric_name = 'customer_churn_rate';

-- 更新警報嚴重度
UPDATE metric_thresholds
SET severity = 'warning'
WHERE metric_name = 'avg_response_time'
  AND threshold_value = 120.0;

-- 新增自定義閾值
INSERT INTO metric_thresholds (
    metric_name,
    display_name,
    category,
    threshold_value,
    comparison_operator,
    severity,
    is_higher_better,
    alert_message_template
) VALUES (
    'custom_metric_abc',
    '自定義指標 ABC',
    '業務分析',
    50.0,
    '>',
    'warning',
    TRUE,
    '{display_name}達到 {value}，超過目標 {threshold}'
);
```

---

## 六、案例研究

### 案例一：客戶流失率飆升應對

**情境**
- 客戶流失率從 8% 突然上升至 22%
- 觸發 INS-002 (業務健康度需改善) 和 REC-001 (客戶流失預防計劃)

**分析步驟**
1. 查看 RFM 分析，發現高價值客戶流失嚴重
2. 檢視客服記錄，發現最近產品品質投訴增加
3. 分析訂單資料，發現退貨率上升

**採取行動**
1. 立即暫停有問題的產品批次
2. 主動聯繫近期流失的高價值客戶
3. 提供補償方案和專屬優惠
4. 加強品質管控流程

**成果**
- 2 週內流失率降至 12%
- 成功挽回 60% 的流失客戶
- 建立預警機制防止再次發生

---

### 案例二：營收目標達成挑戰

**情境**
- 營收健康度降至 5.2 分
- 觸發 INS-007 (營收表現需關注)
- 月營收僅達成目標的 75%

**分析步驟**
1. 分析訂單轉換率，發現購物車放棄率高達 68%
2. 檢視付款流程，發現第三方支付整合問題
3. 查看客戶回饋，發現運費政策不清晰

**採取行動**
1. 緊急修復支付流程技術問題
2. 優化運費顯示，提前告知總費用
3. 推出限時免運費活動刺激購買
4. 發送購物車放棄提醒郵件

**成果**
- 購物車放棄率降至 52%
- 訂單轉換率提升 25%
- 當月營收達成目標的 95%

---

## 🔄 七、規則維護與更新

### 7.1 定期審查週期

| 審查類型 | 頻率 | 負責團隊 | 審查內容 |
|---------|------|---------|---------|
| 閾值校準 | 每季 | 資料分析團隊 | 檢視警報頻率和準確度 |
| 規則優化 | 每半年 | 產品團隊 | 新增/調整業務規則 |
| 系統驗證 | 每月 | 技術團隊 | 確認計算邏輯正確性 |
| 文件更新 | 隨時 | 全體 | 記錄變更和經驗 |

### 7.2 規則版本控制

**版本命名規則**: v{major}.{minor}.{patch}

- **major**: 重大規則變更 (新增維度、演算法重構)
- **minor**: 次要功能更新 (新增洞察類型、調整閾值)
- **patch**: 錯誤修復和文字優化

**變更記錄範例**

```markdown
## v1.1.0 (2025-11-01)

### Added
- 新增 INS-008: 產品健康度洞察
- 新增 REC-009: 產品組合優化建議

### Changed
- 調整客戶流失率閾值: 15% → 12%
- 優化營收健康度計算公式

### Fixed
- 修復系統穩定度計算錯誤
- 修正趨勢分析邊界條件問題
```

### 7.3 A/B 測試策略

**測試新規則**

1. 建立平行運行環境
2. 50% 流量使用新規則
3. 50% 流量使用舊規則
4. 比較警報準確度和業務改善效果
5. 勝出規則全面推廣

**評估指標**

- 警報準確率 (真陽性 / 總警報數)
- 行動轉換率 (採取行動 / 收到建議數)
- 業務指標改善幅度
- 團隊滿意度評分

---

## 📞 支援與回饋

### 回報問題

如發現規則問題或有改進建議，請透過以下管道聯繫：

- **GitHub Issues**: https://github.com/your-org/ecommerce-dashboard/issues
- **Email**: analytics-team@your-company.com
- **內部 Slack**: #business-health-alerts

### 規則貢獻

歡迎團隊成員貢獻新的業務規則！請遵循以下步驟：

1. Fork 專案並建立新分支
2. 在測試環境驗證新規則
3. 撰寫規則文件和案例
4. 提交 Pull Request
5. 團隊審查和討論
6. 合併並部署

---

**文件維護者**: 資料分析團隊 + 產品團隊
**最後審閱**: 2025-10-01
**下次審閱**: 2025-11-01