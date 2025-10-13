# 客戶分析業務規則文檔

## 文檔概覽

本文檔詳細記錄客戶分析系統中所有的判斷邏輯、評分規則和分群標準，確保業務邏輯的一致性和可維護性。

**適用範圍**: `CustomerAnalyticsZeroExpansionService` 和相關的客戶分析模組
**更新日期**: 2025-08-28
**維護責任**: 分析系統開發團隊

---

## RFM 分析規則

### RFM 評分系統

| 指標 | 英文名稱 | 中文名稱 | 評分範圍 | 說明 |
|------|---------|---------|----------|------|
| **R** | Recency | 最近購買 | 1-5分 | 5分=最近，1分=很久前 |
| **F** | Frequency | 購買頻率 | 1-5分 | 5分=高頻，1分=低頻 |
| **M** | Monetary | 購買金額 | 1-5分 | 5分=高額，1分=低額 |

### RFM 分群對應規則

#### 數字格式 RFM 分群轉換
```typescript
// 數字格式 (如 515, 512) 轉換為語意化分群名稱
function convertRFMScoreToSegmentName(rfmScore: string): string {
  const rScore = parseInt(rfmScore[0]) // 第一位 = Recency
  const fScore = parseInt(rfmScore[1]) // 第二位 = Frequency  
  const mScore = parseInt(rfmScore[2]) // 第三位 = Monetary
  
  // 基於經典 RFM 分群規則
  if (rScore >= 4 && fScore >= 4 && mScore >= 4) return 'Champions'
  if (rScore >= 3 && fScore >= 3 && mScore >= 3) return 'Loyal Customers'
  if (rScore >= 4 && fScore >= 2) return 'Potential Loyalists'
  if (rScore >= 4 && fScore <= 2) return 'New Customers'
  if (rScore >= 3 && fScore >= 2) return 'Promising'
  if (rScore >= 2 && fScore >= 2) return 'Need Attention'
  if (rScore >= 2 && fScore <= 2) return 'About to Sleep'
  if (rScore <= 2 && fScore >= 2) return 'At Risk'
  if (rScore <= 2 && fScore <= 1) return 'Cannot Lose Them'
  if (rScore <= 1) return 'Lost'
  
  return `RFM_${rfmScore}` // 預設分群
}
```

#### 標準 RFM 分群定義

| 分群名稱 | RFM 條件 | 商業特徵 | 建議策略 |
|----------|----------|----------|----------|
| **Champions** | R≥4, F≥4, M≥4 | 高價值忠實客戶 | VIP 服務、獨家優惠 |
| **Loyal Customers** | R≥3, F≥3, M≥3 | 忠實老客戶 | 會員福利、升級計劃 |
| **Potential Loyalists** | R≥4, F≥2 | 有潜力成為忠實客戶 | 個性化推薦、培育計劃 |
| **New Customers** | R≥4, F≤2 | 新客戶 | 歡迎流程、產品教育 |
| **Promising** | R≥3, F≥2 | 有前景的客戶 | 促銷活動、交叉銷售 |
| **Need Attention** | R≥2, F≥2 | 需要關注 | 重新激活活動 |
| **About to Sleep** | R≥2, F≤2 | 即將流失 | 挽回優惠、問卷調查 |
| **At Risk** | R≤2, F≥2 | 高風險客戶 | 緊急挽回計劃 |
| **Cannot Lose Them** | R≤2, F≤1 | 不能失去的客戶 | 高階主管介入 |
| **Lost** | R≤1 | 已流失客戶 | 重新獲得活動 |

---

## 流失風險分析規則

### 多因子風險評分算法

**總風險分數 = Σ(各因子風險分數 × 權重)**

#### 權重分配
- **最近購買時間**: 30%
- **購買頻率**: 25% 
- **RFM分群**: 25%
- **生命週期階段**: 20%

### 因子1: 最近購買時間風險評估

| recency_days | 風險分數 | 風險描述 |
|-------------|----------|----------|
| ≤30天 | 0分 | 低風險 |
| 31-60天 | 20分 | 輕微風險 |
| 61-90天 | 40分 | 中等風險 |
| 91-180天 | 70分 | 高風險 |
| >180天 | 100分 | 極高風險 |

### 因子2: 購買頻率風險評估

| frequency | 風險分數 | 風險描述 |
|-----------|----------|----------|
| ≥4次 | 0分 | 低風險 |
| 2-3次 | 20分 | 輕微風險 |
| 1次 | 50分 | 高風險 |
| <1次 | 80分 | 極高風險 |

### 因子3: RFM分群風險評估

| RFM分群 | 風險分數 | 說明 |
|---------|----------|------|
| Champions, Loyal Customers | 0分 | 低風險 |
| Potential Loyalists, New Customers | 10分 | 輕微風險 |
| Promising, Need Attention | 40分 | 中等風險 |
| About to Sleep | 60分 | 高風險 |
| At Risk, Cannot Lose Them | 80分 | 極高風險 |
| Lost, Churned | 100分 | 已流失 |

#### 數字格式 RFM 風險評估
```typescript
// 處理數字格式的 RFM 分群風險計算
if (/^\d{3}$/.test(segment)) {
  const rScore = parseInt(segment[0])
  const fScore = parseInt(segment[1]) 
  const mScore = parseInt(segment[2])
  
  // R分數主導風險評估
  if (rScore <= 2) segmentRisk = 80      // 很久沒購買 = 高風險
  else if (rScore <= 3) segmentRisk = 50 // 較久沒購買 = 中風險
  else if (rScore >= 4) segmentRisk = 10 // 最近有購買 = 低風險
  
  // F和M分數調整
  if (fScore <= 2 && mScore <= 2) segmentRisk += 20 // 低頻低額 = 額外風險
}
```

### 因子4: 生命週期階段風險評估

| lifecycle_stage | 風險分數 | 說明 |
|----------------|----------|------|
| Active, New | 0分 | 健康狀態 |
| Inactive | 50分 | 需要激活 |
| At Risk | 70分 | 高風險狀態 |
| Churned | 100分 | 已流失 |

### 風險等級分類

| 總分範圍 | 風險等級 | priority | 建議行動 |
|----------|----------|----------|----------|
| 0-39分 | low | medium | 定期關懷 |
| 40-59分 | medium | medium | 重新激活 |
| 60-79分 | high | high | 挽回計劃 |
| 80-100分 | critical | critical | 緊急處理 |

---

## 💰 價值成長分析規則

### 成長潛力評分邏輯

**基準分數**: 50分

#### 加分條件
- **新客戶 (purchase_count < 5)**: +20分
- **高價值訂單 (AOV > $1000)**: +15分  
- **高頻率 (frequency > 1)**: +10分
- **近期活躍 (r_score ≥ 4)**: +5分

**最高分數**: 100分 (Math.min(100, 總分))

### LTV 成長率估算

| 客戶特徵 | 成長率 | 說明 |
|----------|--------|------|
| 高頻高價值 (freq>2, AOV>1000) | 15% | 高成長客戶 |
| 中等表現 (freq>1, AOV>500) | 8% | 穩健成長 |
| 一般活躍 (freq>0.5) | 3% | 緩慢成長 |
| 低活躍度 (freq≤0.5) | -5% | 下降趨勢 |

### 成長趨勢分類

| ltvGrowthRate | 趨勢分類 | 說明 |
|--------------|----------|------|
| >10% | accelerating | 加速成長 |
| 5-10% | growing | 穩定成長 |
| 0-5% | stable | 維持現狀 |
| <0% | declining | 下降趨勢 |

### 潛在分群升級路徑

```typescript
// 成長客戶的分群升級預測
let potentialSegment = currentSegment
if (ltvTrend === 'accelerating' || ltvTrend === 'growing') {
  if (currentSegment === 'New Customers') 
    potentialSegment = 'Potential Loyalists'
  else if (currentSegment === 'Potential Loyalists') 
    potentialSegment = 'Loyal Customers'  
  else if (currentSegment === 'Loyal Customers') 
    potentialSegment = 'Champions'
}
```

---

## 優先級分配邏輯

### Phase 1: 流失風險客戶 (Retention)

```typescript
// 風險等級直接對應優先級
priority = customer.riskLevel === 'critical' ? 'critical' : 'high'
category = 'retention'
```

### Phase 2: 價值成長客戶 (VIP Care / Upsell)

#### VIP Care 條件 (high priority)
- **白金VIP**: Champions + LTV>$25,000 + 成長潛力>85
- **金級VIP**: Loyal Customers + LTV>$25,000

#### 一般升級條件 (medium/high priority)
```typescript
// 高價值成長客戶提升條件
const isHighValueGrowth = customer.currentLTV > 15000 || customer.ltvGrowthRate > 15

if (customer.ltvGrowthRate > 10) {
  priority = isHighValueGrowth ? 'high' : 'medium'
} else {
  priority = isHighValueGrowth ? 'high' : 'medium'  
}
```

#### At Risk 客戶排除邏輯
```typescript
// 嚴格排除 At Risk 客戶的 VIP 建議
const isAtRiskSegment = customer.currentSegment.includes('At Risk') || 
                       customer.currentSegment.includes('Cannot Lose') ||
                       customer.currentSegment.includes('About to Sleep')

if (isAtRiskSegment) {
  return // 跳過，不給 VIP 建議
}
```

### Phase 3: 行為優化客戶 (Nurture)

```typescript
// 高價值行為客戶提升優先級
const isHighValueBehavior = hasGoodFrequency && customer.avgOrderValue > 5000

if (hasGoodFrequency) {
  priority = isHighValueBehavior ? 'high' : 'medium'
} else if (customer.orderValueTrend === 'increasing') {
  priority = customer.avgOrderValue > 8000 ? 'high' : 'medium'
} else {
  priority = 'medium'
}
```

---

## 緊急行動客戶篩選邏輯

### 智能補充算法

```typescript
const urgentActionCustomers = computed(() => {
  // 1. 優先取得高優先級建議
  const highPriorityRecs = actionRecommendations.value
    .filter((rec) => rec.priority === 'critical' || rec.priority === 'high')

  // 2. 如果高優先級建議不足3個，補充中等優先級
  let finalRecommendations = [...highPriorityRecs]
  
  if (finalRecommendations.length < 3) {
    const mediumPriorityRecs = actionRecommendations.value
      .filter((rec) => rec.priority === 'medium')
      .slice(0, 3 - finalRecommendations.length)
    
    finalRecommendations = [...finalRecommendations, ...mediumPriorityRecs]
  }

  return finalRecommendations.slice(0, 10)
})
```

### 空狀態處理

- **顯示邏輯**: 區塊永遠顯示，不隱藏
- **空狀態訊息**: "目前沒有需要緊急處理的客戶"
- **正面回饋**: "這表示您的客戶關係維護良好 👍"

---

## 行為分析規則

### 購買一致性評分

```typescript
// 基於訂單間隔的變異系數計算
const intervals = [] // 計算各訂單間隔天數
const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
const variance = intervals.reduce((sum, interval) => 
  sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
const stdDev = Math.sqrt(variance)
const coefficientOfVariation = avgInterval > 0 ? stdDev / avgInterval : 1
const consistencyScore = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100))
```

| 一致性分數 | 描述 | 建議策略 |
|------------|------|----------|
| 80-100分 | 極高一致性 | 維持現狀 |
| 60-79分 | 高一致性 | 優化體驗 |
| 40-59分 | 中等一致性 | 行為分析 |
| 20-39分 | 低一致性 | 提醒系統 |
| 0-19分 | 極不規律 | 深度調查 |

### 訂單價值趨勢分析

```typescript
// 比較最近3筆 vs 最早3筆訂單的平均金額
const recentAvg = recentOrders.reduce((sum, o) => sum + o.total_amount, 0) / recentOrders.length
const earlierAvg = earlierOrders.reduce((sum, o) => sum + o.total_amount, 0) / earlierOrders.length

let orderValueTrend: 'increasing' | 'stable' | 'decreasing'
if (recentAvg > earlierAvg * 1.1) orderValueTrend = 'increasing'       // 增長>10%
else if (recentAvg < earlierAvg * 0.9) orderValueTrend = 'decreasing'  // 下降>10%
else orderValueTrend = 'stable'                                         // 變化<10%
```

### 渠道偏好推導

```typescript
// 基於付款方式推導購買渠道
function deriveChannelFromPaymentMethods(paymentMethods: string[]): string {
  switch (mostUsedMethod) {
    case 'cash_on_delivery': return 'mobile'
    case 'bank_transfer': return 'web'  
    case 'line_pay', 'apple_pay', 'google_pay': return 'mobile'
    case 'credit_card': 
      return paymentMethods.includes('apple_pay') || paymentMethods.includes('google_pay') 
        ? 'mobile' : 'web'
    default: return 'online'
  }
}
```

---

## ROI 計算規則

### 挽回 ROI 計算

```typescript
// 流失風險客戶的 ROI 計算
estimatedROI = customer.currentLTV * customer.estimatedRetentionProbability - estimatedCost

// 挽回成功機率估算
let retentionProbability = 0
if (riskLevel === 'low') retentionProbability = 0.9      // 90%
else if (riskLevel === 'medium') retentionProbability = 0.7  // 70%
else if (riskLevel === 'high') retentionProbability = 0.4    // 40% 
else retentionProbability = 0.2                             // 20%
```

### 成長 ROI 計算

```typescript
// 價值成長客戶的 ROI 計算  
const potentialROI = (customer.estimatedFutureLTV - customer.currentLTV) * 0.7 - estimatedCost

// 只保留正 ROI 建議
.filter(r => r.estimatedROI > 0)
```

### 行為優化 ROI 計算

```typescript
// 行為優化客戶的 ROI 計算
const estimatedROI = customer.avgOrderValue * customer.purchaseFrequency * 0.4 * 12 - estimatedCost
```

---

## 維護指南

### 規則更新流程

1. **業務需求變更** → 更新本文檔規則定義
2. **代碼實現** → 在 `CustomerAnalyticsZeroExpansionService.ts` 中實現
3. **測試驗證** → 使用測試資料驗證新規則
4. **文檔同步** → 確保代碼與文檔一致

### 測試資料要求

為確保所有規則都能正確測試，測試資料應包含：

- **高風險客戶**: R_Score ≤ 2, recency_days > 60
- **中等風險客戶**: R_Score = 3, recency_days = 30-60  
- **低風險客戶**: R_Score ≥ 4, recency_days ≤ 30
- **各種生命週期階段**: Active, At Risk, Churned 等
- **不同 LTV 水平**: <$10K, $10-25K, >$25K
- **各種購買模式**: 高頻低額、低頻高額、穩定購買等

### 常見問題排查

| 問題現象 | 可能原因 | 排查方法 |
|----------|----------|----------|
| 緊急客戶區塊為空 | 測試資料風險等級過低 | 檢查 RFM 評分分布 |
| 優先級分配錯誤 | At Risk 客戶被分配 VIP | 檢查排除邏輯 |
| ROI 計算異常 | 成本估算公式錯誤 | 驗證計算邏輯 |
| 分群轉換失敗 | 數字格式 RFM 處理錯誤 | 檢查格式判斷 |

---

## 變更日誌

### 2025-08-28 - v1.0.0
- 建立完整的客戶分析業務規則文檔
- 涵蓋 RFM 分析、風險評估、價值成長、優先級分配等所有核心規則
- 建立維護流程和測試指南

---

**維護團隊**: 分析系統開發組  
**審核週期**: 每季度檢查一次  
**聯繫方式**: 通過專案 Issue 系統提出規則變更建議