# 業務健康度洞察系統架構文件

## 文件資訊

- **建立日期**: 2025-10-01
- **最後更新**: 2025-10-01
- **系統版本**: Phase 2 (Edge Function) + Phase 1.5 (Database Functions)
- **負責模組**: 經營健康度總覽、風險預警中心、戰略決策支援

---

## 系統概述

業務健康度洞察系統是電商管理平台的核心決策支援系統，提供三大核心功能：

1. **關鍵業務洞察** (Business Insights) - 基於多維度健康度指標的智能洞察生成
2. **風險預警中心** (Risk Alerts) - 實時業務風險監控與預警機制
3. **戰略行動建議** (Strategic Recommendations) - 基於警示的可執行行動建議

### 系統特色

- 🔐 **雙層架構設計**: Edge Function (商業邏輯保護) + Database Functions (規則引擎)
- 📊 **多維度分析**: 7 大業務健康度維度 (營收、客戶、訂單、客服、產品、行銷、系統)
- 🎯 **智能判斷**: 自動閾值比對、趨勢分析、優先級排序
- 🔄 **即時更新**: 整合 Realtime 警報系統，支援即時監控
- 🤖 **AI 增強**: 支援 AI 警報分析與建議優化

---

## 系統架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 Vue 組件層                            │
│  DashboardExecutiveHealth.vue                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │關鍵業務洞察  │  │風險預警中心  │  │戰略行動建議  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────┐
│                    API 服務層                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │BusinessHealthAnalytics│ │DashboardApiService   │          │
│  │Service                │ │                      │          │
│  │(Phase 2 封裝)         │ │(Phase 1.5 封裝)      │          │
│  └──────────┬───────────┘  └──────────┬───────────┘          │
└─────────────┼──────────────────────────┼──────────────────────┘
              │                          │
              │                          │
┌─────────────▼──────────────┐  ┌────────▼──────────────────────┐
│   Phase 2: Edge Function   │  │ Phase 1.5: Database Functions │
│                             │  │                               │
│  business-health-analytics  │  │  - get_unified_dashboard_     │
│                             │  │    content()                  │
│  ┌────────────────────┐    │  │  - generate_dashboard_alerts()│
│  │generateBusiness    │    │  │  - generate_strategic_        │
│  │Insights()          │    │  │    recommendations()          │
│  │                    │    │  │  - generate_business_insights()│
│  │- 健康度評分        │    │  │                               │
│  │- 趨勢分析          │    │  │  依賴資料表:                  │
│  │- 智能洞察生成      │    │  │  - dashboard_alerts           │
│  └────────────────────┘    │  │  - metric_thresholds          │
│                             │  │  - conversation_summary_daily │
│  受保護的商業邏輯 🔐        │  │  - order_items                │
└─────────────────────────────┘  │  - inventories                │
                                 └───────────────────────────────┘
```

### 資料流向

```
使用者請求
    ↓
前端組件並行查詢
    ├──→ Phase 2 Edge Function (業務洞察)
    │      ↓
    │   計算 7 維度健康度指標
    │      ↓
    │   趨勢分析 (可選)
    │      ↓
    │   生成智能洞察 (最多5個)
    │      ↓
    │   返回 insights[]
    │
    └──→ Phase 1.5 Database Functions (警示+建議)
           ↓
        檢查指標閾值
           ↓
        生成警示記錄
           ↓
        基於警示生成建議
           ↓
        返回 { alerts[], recommendations[] }
    ↓
前端資料組合
    ├──→ 關鍵業務洞察區塊
    ├──→ 風險預警中心區塊 (含 AI 增強)
    └──→ 戰略行動建議區塊
    ↓
UI 渲染展示
```

---

## 功能一：關鍵業務洞察 (Business Insights)

### 實現位置

- **Edge Function**: `/supabase/functions/business-health-analytics/index.ts` (line 435-536)
- **函數名稱**: `generateBusinessInsights()`
- **前端組件**: `DashboardExecutiveHealth.vue` (line 701-815)

### 演算法邏輯

#### 輸入參數

```typescript
interface InputParams {
  metrics: BusinessHealthMetrics        // 7 維度健康度指標
  scoreDetails: HealthScoreDetails      // 綜合評分細節
  trends: TrendAnalysis | null          // 趨勢分析資料（可選）
}
```

#### 判斷規則矩陣

| 條件類型 | 判斷邏輯 | 洞察類型 | 影響程度 | 信心度 |
|---------|---------|---------|---------|--------|
| 整體健康度優異 | `overallScore >= 90` | opportunity | low | 0.95 |
| 整體健康度待改善 | `overallScore <= 60` | warning | high | 0.90 |
| 系統穩定度警告 | `metrics.system < 7.0` | warning | high | 0.85 |
| 業務指標下滑 | `trends.direction='下降' AND change > 5` | warning | high | 0.88 |
| 業務成長強勁 | `trends.direction='上升' AND change > 10` | opportunity | medium | 0.90 |
| 客服效能不佳 | `metrics.support < 5.0` | info | medium | 0.80 |
| 營收表現不佳 | `metrics.revenue < 6.0` | warning | high | 0.87 |

#### 洞察生成流程

```javascript
function generateBusinessInsights(metrics, scoreDetails, trends) {
  const insights = []

  // 1. 整體健康度洞察
  if (scoreDetails.overallScore >= 90) {
    insights.push({
      title: '業務表現優異',
      description: `整體健康度達到 ${scoreDetails.overallScore} 分，系統運行狀況良好`,
      type: 'opportunity',
      impact: 'low',
      confidence: 0.95,
      category: '業務分析',
      actions: ['持續監控關鍵指標', '擴大成功策略應用']
    })
  } else if (scoreDetails.overallScore <= 60) {
    insights.push({
      title: '業務健康度需改善',
      description: `整體健康度僅 ${scoreDetails.overallScore} 分，建議優先改善關鍵指標`,
      type: 'warning',
      impact: 'high',
      confidence: 0.9,
      category: '風險管理',
      actions: ['檢視營運流程', '改善客戶體驗', '優化支援效率']
    })
  }

  // 2. 系統穩定度洞察
  if (metrics.system < 7.0) {
    insights.push({
      title: '系統穩定度警告',
      description: `系統穩定度 ${metrics.system.toFixed(1)} 分低於標準，可能影響業務運行`,
      type: 'warning',
      impact: 'high',
      confidence: 0.85,
      category: '技術監控',
      actions: ['檢查系統模組狀態', '執行故障排除', '強化監控機制']
    })
  }

  // 3. 趨勢分析洞察
  if (trends && trends.direction === '下降' && trends.change > 5) {
    insights.push({
      title: '業務指標下滑趨勢',
      description: `檢測到業務指標下降 ${trends.change.toFixed(1)}%，需要立即關注`,
      type: 'warning',
      impact: 'high',
      confidence: 0.88,
      category: '趨勢分析',
      actions: ['分析下降原因', '制定改善計劃', '加強監控頻率']
    })
  } else if (trends && trends.direction === '上升' && trends.change > 10) {
    insights.push({
      title: '業務成長動能強勁',
      description: `業務指標上升 ${trends.change.toFixed(1)}%，表現優於預期`,
      type: 'opportunity',
      impact: 'medium',
      confidence: 0.9,
      category: '成長機會',
      actions: ['分析成功因素', '擴大優勢策略', '設定更高目標']
    })
  }

  // 4. 模組效能洞察
  if (metrics.support < 5.0) {
    insights.push({
      title: '客服效能待改善',
      description: `客服健康度 ${metrics.support.toFixed(1)} 分，可能影響客戶滿意度`,
      type: 'info',
      impact: 'medium',
      confidence: 0.8,
      category: '客戶服務',
      actions: ['優化回應時間', '培訓客服人員', '改善服務流程']
    })
  }

  if (metrics.revenue < 6.0) {
    insights.push({
      title: '營收表現需關注',
      description: `營收健康度 ${metrics.revenue.toFixed(1)} 分，建議檢視訂單流程`,
      type: 'warning',
      impact: 'high',
      confidence: 0.87,
      category: '財務分析',
      actions: ['分析訂單轉換率', '優化付款流程', '提升產品競爭力']
    })
  }

  // 限制最多返回 5 個洞察
  return insights.slice(0, 5)
}
```

#### 輸出格式

```typescript
interface BusinessInsight {
  title: string              // 洞察標題 (簡潔描述)
  description: string        // 詳細說明 (包含具體數值)
  type: 'warning' | 'info' | 'opportunity'  // 洞察類型
  impact: 'high' | 'medium' | 'low'         // 影響程度
  confidence: number         // 信心度 (0.00-1.00)
  category: string           // 分類標籤
  actions: string[]          // 建議行動清單 (2-3 項)
}
```

### 健康度計算依據

#### 7 維度健康度指標

```typescript
interface BusinessHealthMetrics {
  revenue: number       // 營收成長 (0-10) - 基於 order_summary 營收趨勢
  satisfaction: number  // 客戶滿意 (0-10) - 基於 conversation_summary 解決率
  fulfillment: number   // 訂單履行 (0-10) - 基於 order_summary 完成率
  support: number       // 客服效率 (0-10) - 基於 tickets 回應時間
  products: number      // 產品管理 (0-10) - 基於 inventories 庫存健康度
  marketing: number     // 行銷效果 (0-10) - 預留欄位
  system: number        // 系統穩定度 (0-10) - 基於 Realtime 警報狀態
}
```

#### 綜合評分計算

```typescript
interface HealthScoreDetails {
  customerQuality: number        // 客戶品質 (0-100) = RFM 平均分數 × 10
  operationalEfficiency: number  // 營運效率 (0-100) = 訂單完成率 × 100
  supportEffectiveness: number   // 客服效能 (0-100) = (解決率×0.7 + 回應時間分數×0.3) × 100
  overallScore: number           // 總分 (0-100) = (三項加總) / 3
  rating: string                 // 評級: 優秀/良好/普通/需改善/待加強
}
```

#### 評級判定邏輯

```typescript
function getRatingFromScore(score: number): string {
  if (score >= 90) return '優秀'
  if (score >= 75) return '良好'
  if (score >= 60) return '普通'
  if (score >= 40) return '需改善'
  return '待加強'
}
```

### 趨勢分析邏輯

```typescript
interface TrendAnalysis {
  direction: '上升' | '下降' | '持平'  // 趨勢方向
  change: number                      // 變化幅度 (百分比)
  description: string                 // 趨勢描述
  customerChange: number              // 客戶品質變化
  operationalChange: number           // 營運效率變化
}

// 計算邏輯
function calculateTrendAnalysis(current, previous) {
  const customerChange = (current.customerQuality - previous.customerQuality) * 100
  const operationalChange = (current.operationalEfficiency - previous.operationalEfficiency) * 100
  const avgChange = (customerChange + operationalChange) / 2

  return {
    direction: avgChange > 2 ? '上升' : avgChange < -2 ? '下降' : '持平',
    change: Math.abs(avgChange),
    description: avgChange > 2 ? '業務表現持續改善'
                 : avgChange < -2 ? '需要關注業務指標下滑'
                 : '業務表現穩定',
    customerChange,
    operationalChange
  }
}
```

---

## 🚨 功能二：風險預警中心 (Risk Alerts)

### 雙層實現架構

#### Phase 1.5: 資料庫層 (指標警報)

**Migration 檔案**:
- `20250806104000_unify_alert_and_recommendation_logic.sql`
- `20250806103000_extend_alert_types.sql`
- `20250826150000_fix_unified_dashboard_alerts.sql`

**核心函數**: `generate_dashboard_alerts()`

**資料表結構**:

```sql
CREATE TABLE dashboard_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
    metric_name VARCHAR(100),
    current_value DECIMAL,
    threshold_value DECIMAL,
    business_context JSONB,
    detected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_resolved BOOLEAN DEFAULT FALSE,
    ai_suggestion TEXT,
    ai_confidence DECIMAL(3,2),
    confidence_score DECIMAL(3,2),
    trend_direction VARCHAR(20),
    trend_period VARCHAR(50)
);

CREATE TABLE metric_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    threshold_value DECIMAL NOT NULL,
    comparison_operator VARCHAR(10) CHECK (operator IN ('>', '<', '>=', '<=', '=')),
    severity VARCHAR(20) CHECK (severity IN ('info', 'warning', 'critical')),
    is_higher_better BOOLEAN DEFAULT TRUE,
    alert_message_template TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**警報生成邏輯**:

```sql
-- 基於指標閾值自動生成警報
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
        INSERT INTO dashboard_alerts (
            alert_type, title, message, severity,
            metric_name, current_value, threshold_value,
            business_context, confidence_score
        ) VALUES (
            metric.alert_type,
            format(metric.alert_title_template, current_value),
            format(metric.alert_message_template, current_value, metric.threshold_value),
            metric.severity,
            metric.metric_name,
            current_value,
            metric.threshold_value,
            jsonb_build_object('category', metric.category),
            metric.default_confidence
        )
        ON CONFLICT (metric_name, detected_at::DATE) DO UPDATE
        SET current_value = EXCLUDED.current_value,
            updated_at = NOW();
    END IF;
END LOOP;
```

#### Phase 1.5+: 前端組合層 (多來源整合)

**實現位置**: `DashboardApiService.ts` (line 668-909)

**資料來源組合**:

```typescript
async getSystemAlerts(): Promise<ApiResponse<SystemAlert[]>> {
  const alerts: SystemAlert[] = []

  // 1. Realtime 警報 (系統穩定度)
  const realtimeAlerts = getGlobalRealtimeAlerts().getRealtimeAlerts()
  alerts.push(...realtimeAlerts)

  // 2. 庫存警報
  const inventoryAlerts = await this.getInventoryAlerts(timestamp)
  alerts.push(...inventoryAlerts)

  // 3. 客服警報
  const supportAlerts = await this.getSupportAlerts(timestamp)
  alerts.push(...supportAlerts)

  // 4. 訂單警報
  const orderAlerts = await this.getOrderAlerts(timestamp)
  alerts.push(...orderAlerts)

  // 優先級排序: error > warning > info > success
  alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])

  // 限制顯示數量 (最多 8 個)
  return alerts.slice(0, 8)
}
```

**各類警報判斷邏輯**:

##### 庫存警報

```typescript
private async getInventoryAlerts(timestamp: string): Promise<SystemAlert[]> {
  const alerts: SystemAlert[] = []
  const { data } = await this.supabase.rpc('get_inventory_overview')

  // 缺貨警報 (最高優先級)
  if (data?.out_of_stock_count > 0) {
    alerts.push({
      id: 'out-of-stock-alert',
      type: 'error',
      message: `緊急：${data.out_of_stock_count} 項商品缺貨`,
      priority: 'high',
      timestamp
    })
  }

  // 庫存不足警報
  if (data?.low_stock_count > 0) {
    alerts.push({
      id: 'low-stock-alert',
      type: 'warning',
      message: `注意：${data.low_stock_count} 項商品庫存偏低`,
      priority: 'medium',
      timestamp
    })
  }

  // 庫存健康狀況 (正面回饋)
  if (data?.healthy_stock_count > 0 && alerts.length === 0) {
    alerts.push({
      id: 'healthy-stock-info',
      type: 'success',
      message: `正常：${data.healthy_stock_count} 項商品庫存充足`,
      priority: 'low',
      timestamp
    })
  }

  return alerts
}
```

##### 客服警報

```typescript
private async getSupportAlerts(timestamp: string): Promise<SystemAlert[]> {
  const alerts: SystemAlert[] = []

  // 查詢最近 7 天客服數據
  const { data } = await this.supabase
    .from('conversation_summary_daily')
    .select('conversation_date, total_conversations, avg_first_response_minutes')
    .gte('conversation_date', sevenDaysAgo)
    .order('conversation_date', { ascending: false })

  if (data && data.length > 0) {
    const totalConversations = data.reduce((sum, day) => sum + day.total_conversations, 0)
    const avgResponseMinutes = data.reduce((sum, day) =>
      sum + day.avg_first_response_minutes, 0) / data.length

    // 回應時間警報
    if (avgResponseMinutes > 120) {  // 超過 2 小時
      alerts.push({
        id: 'slow-response-alert',
        type: 'warning',
        message: `客服回應：平均 ${avgResponseMinutes.toFixed(0)} 分鐘`,
        priority: 'medium',
        timestamp
      })
    } else if (avgResponseMinutes > 0 && avgResponseMinutes <= 60) {
      alerts.push({
        id: 'good-response-info',
        type: 'success',
        message: `客服回應：平均 ${avgResponseMinutes.toFixed(0)} 分鐘`,
        priority: 'low',
        timestamp
      })
    }

    // 客服工作量提醒
    if (totalConversations > 0) {
      alerts.push({
        id: 'support-activity-info',
        type: 'info',
        message: `本週處理 ${totalConversations} 個客服對話`,
        priority: 'low',
        timestamp
      })
    }
  }

  return alerts
}
```

##### 訂單警報

```typescript
private async getOrderAlerts(timestamp: string): Promise<SystemAlert[]> {
  const alerts: SystemAlert[] = []

  // 檢查待處理訂單 (超過 2 小時未處理)
  const { count: pendingCount } = await this.supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'confirmed'])
    .lte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())

  if (pendingCount && pendingCount > 0) {
    alerts.push({
      id: 'pending-orders-alert',
      type: 'warning',
      message: `待處理：${pendingCount} 個訂單超過 2 小時`,
      priority: 'high',
      timestamp
    })
  }

  // 今日訂單活動
  const { data: todayOrders } = await this.supabase
    .from('orders')
    .select('status')
    .gte('created_at', new Date().toISOString().split('T')[0])

  if (todayOrders) {
    const completedToday = todayOrders.filter(o =>
      ['completed', 'delivered'].includes(o.status)).length

    if (completedToday > 0) {
      alerts.push({
        id: 'daily-orders-info',
        type: 'info',
        message: `今日完成 ${completedToday} 個訂單`,
        priority: 'low',
        timestamp
      })
    }
  }

  return alerts
}
```

### 警報輸出格式

```typescript
interface SystemAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: string
}

interface DashboardAlert extends SystemAlert {
  alert_type: string
  title: string
  description?: string
  severity: 'info' | 'warning' | 'critical'
  metric_name?: string
  current_value?: number
  threshold_value?: number
  business_context?: Record<string, any>
  detected_at?: string
  ai_suggestion?: string
  ai_confidence?: number
  confidence_score?: number
  trend_direction?: string
  trend_period?: string
}
```

### 前端顯示邏輯

```typescript
// 組件: DashboardExecutiveHealth.vue (line 269-293)
const criticalAlerts = computed(() => {
  const unifiedData = unifiedContentQuery.data.value
  const fullAlertsData = dashboardAlertsQuery.data.value || []

  if (!unifiedData?.alerts) return []

  // 將統合 API 的格式化資料映射到完整警示
  return unifiedData.alerts.map(alert => {
    const fullAlert = fullAlertsData.find(fa => fa.id === alert.id)

    return {
      type: alert.type || (alert.severity === 'critical' ? 'warning' :
        alert.severity === 'warning' ? 'info' : 'success'),
      title: alert.title,
      message: alert.message,
      priority: alert.priority || (alert.severity === 'critical' ? 'high' :
        alert.severity === 'warning' ? 'medium' : 'low'),
      action: alert.action || `檢視詳情`,
      _original: fullAlert || alert  // 完整資料供 AI 分析使用
    }
  })
})
```

---

## 功能三：戰略行動建議 (Strategic Recommendations)

### 實現位置

- **Migration**: `20250806105000_fix_concise_recommendations.sql`
- **函數**: `generate_strategic_recommendations()`
- **前端組件**: `DashboardExecutiveHealth.vue` (line 875-940)

### 建議生成邏輯

#### 輸入資料來源

```sql
-- 基於現有警示生成建議
SELECT da.*, mt.category, mt.display_name, mt.is_higher_better
FROM dashboard_alerts da
LEFT JOIN metric_thresholds mt ON da.metric_name = mt.metric_name
WHERE da.is_active = TRUE
  AND da.is_resolved = FALSE
  AND da.severity IN ('critical', 'warning')
ORDER BY da.severity DESC, da.detected_at DESC
LIMIT 5
```

#### 建議規則對照表

| metric_name | 建議類型 | 建議標題 | 影響程度 | 工作量 | 優先級 | 時間軸 |
|------------|---------|---------|---------|--------|--------|--------|
| customer_churn_rate | customer_retention | 啟動客戶流失預防計劃 | high | high | 95 | 緊急（2-4週） |
| high_value_customer_count | customer_acquisition | 重建高價值客戶群 | high | high | 90 | 中期（2-3個月） |
| business_momentum_trend | business_turnaround | 業務動能復甦行動 | high | high | 100 | 立即執行（1-2個月） |
| customer_growth_trend | growth_recovery | 客戶成長策略調整 | high | medium | 85 | 短中期（6-12週） |
| avg_response_time | operational_improvement | 改善客服回應效率 | high | medium | 85 | 2-4週 |
| order_completion_rate | process_optimization | 訂單處理流程優化 | medium | medium | 75 | 3-6週 |
| inventory_stockout_count | inventory_management | 庫存補貨策略優化 | medium | medium | 70 | 2-4週 |
| (其他) | general_improvement | 系統監控優化 | medium | low | 60 | 短期（2-4週） |

#### 建議生成範例

```sql
-- 範例：客戶流失率警示 → 生成建議
IF current_alerts.metric_name = 'customer_churn_rate' THEN
    RETURN QUERY SELECT
        'customer_retention'::VARCHAR(50) as recommendation_type,
        '客戶價值'::VARCHAR(50) as category,
        '啟動客戶流失預防計劃'::VARCHAR(200) as title,
        format('當前客戶流失率%s，建議立即檢討客戶滿意度並啟動挽回計劃。',
               format_metric_value(current_alerts.current_value, 'percentage'))::TEXT as description,
        'high'::VARCHAR(20) as impact_level,
        'high'::VARCHAR(20) as effort_level,
        95::INTEGER as priority_score,
        0.90::DECIMAL(3,2) as confidence_score,
        jsonb_build_object(
            'source_alert_id', current_alerts.id,
            'current_value', current_alerts.current_value,
            'impact', '營收保護'
        )::JSONB as business_context,
        '緊急（2-4週）'::VARCHAR(50) as estimated_timeline;
END IF;

-- 範例：業務動能趨勢警示 → 生成建議
ELSIF current_alerts.metric_name = 'business_momentum_trend' THEN
    RETURN QUERY SELECT
        'business_turnaround'::VARCHAR(50),
        '營運策略'::VARCHAR(50),
        '業務動能復甦行動'::VARCHAR(200),
        format('業務動能%s%s，建議成立專案小組進行市場分析並制定改善計劃。',
               COALESCE(current_alerts.trend_direction, '變化'),
               format_metric_value(ABS(current_alerts.current_value), 'percentage'))::TEXT,
        'high'::VARCHAR(20),
        'high'::VARCHAR(20),
        100::INTEGER,
        0.88::DECIMAL(3,2),
        jsonb_build_object(
            'source_alert_id', current_alerts.id,
            'priority', 'CEO直接監督'
        )::JSONB,
        '立即執行（1-2個月）'::VARCHAR(50);
END IF;
```

### 輸出格式

```typescript
interface StrategicRecommendation {
  recommendation_type: string      // 建議類型 (customer_retention, business_turnaround 等)
  category: string                 // 分類標籤 (客戶價值、營運策略等)
  title: string                    // 建議標題 (簡潔)
  description: string              // 詳細說明 (含當前值)
  impact_level: 'high' | 'medium' | 'low'    // 影響程度
  effort_level: 'high' | 'medium' | 'low'    // 所需工作量
  priority_score: number           // 優先級分數 (0-100)
  confidence_score: number         // 信心度 (0.00-1.00)
  business_context: {              // 業務脈絡
    source_alert_id: string        // 來源警示 ID
    current_value?: number         // 當前指標值
    target_value?: number          // 目標值
    expected_roi?: string          // 預期投資回報率
    priority?: string              // 特殊優先級標記
  }
  estimated_timeline: string       // 預計時間軸 (緊急/短期/中期/長期)
}
```

### 前端顯示邏輯

```typescript
// 組件: DashboardExecutiveHealth.vue (line 296-310)
const businessRecommendations = computed(() => {
  const unifiedData = unifiedContentQuery.data.value
  if (!unifiedData?.recommendations) {
    return []
  }

  return unifiedData.recommendations.map(rec => ({
    category: rec.category,
    title: rec.title,
    description: rec.description,
    impact: rec.impact_level,
    effort: rec.effort_level,
    priority: rec.priority_score,
    timeline: rec.estimated_timeline,
    context: rec.business_context
  }))
})
```

---

## 🔄 資料流與 API 整合

### API 呼叫流程

#### 前端組件初始化

```typescript
// DashboardExecutiveHealth.vue
// Phase 2: 受保護的業務健康度分析 Edge Function
const protectedHealthQuery = useCompleteDashboardHealth('30d')

// Phase 1.5: 統合的儀表板內容（警示和建議）
const unifiedContentQuery = useUnifiedDashboardContent()

// 完整的警示數據供 AI 分析使用
const dashboardAlertsQuery = useDashboardAlerts()
```

#### Composable 層

```typescript
// useBusinessHealthAnalyticsQueries.ts
export function useCompleteDashboardHealth(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: ['business-health-analytics', period],
    queryFn: async () => {
      const service = defaultServiceFactory.getBusinessHealthAnalyticsService()
      return await service.getBusinessHealthAnalysis({
        period,
        includeSystemHealth: true,
        includeTrends: true,
        includeInsights: true
      })
    },
    staleTime: 5 * 60 * 1000,  // 5 分鐘
    gcTime: 10 * 60 * 1000     // 10 分鐘
  })
}

// useBusinessHealthQueries.ts
export function useUnifiedDashboardContent() {
  return useQuery({
    queryKey: ['unified-dashboard-content'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unified_dashboard_content')
      if (error) throw error
      return data
    },
    staleTime: 2 * 60 * 1000,  // 2 分鐘
    gcTime: 5 * 60 * 1000      // 5 分鐘
  })
}
```

#### API Service 層

```typescript
// BusinessHealthAnalyticsService.ts
export class BusinessHealthAnalyticsService extends BaseApiService {
  async getBusinessHealthAnalysis(
    request: BusinessHealthRequest = {}
  ): Promise<BusinessHealthResponse> {
    const params = {
      period: request.period || '30d',
      includeSystemHealth: request.includeSystemHealth ?? true,
      includeTrends: request.includeTrends ?? true,
      includeInsights: request.includeInsights ?? true,
      ...request
    }

    // 調用受保護的商業邏輯 Edge Function
    const { data, error } = await this.supabase.functions.invoke(
      'business-health-analytics',
      {
        body: params,
        headers: { 'Content-Type': 'application/json' }
      }
    )

    if (error) throw new Error(`Edge Function error: ${error.message}`)
    if (!data?.success) throw new Error(data?.error || '業務健康度分析失敗')

    return data
  }
}
```

### 完整請求/響應範例

#### Phase 2 Edge Function 請求

```http
POST /functions/v1/business-health-analytics
Content-Type: application/json

{
  "period": "30d",
  "includeSystemHealth": true,
  "includeTrends": true,
  "includeInsights": true
}
```

#### Phase 2 Edge Function 響應

```json
{
  "success": true,
  "data": {
    "metrics": {
      "revenue": 7.5,
      "satisfaction": 8.2,
      "fulfillment": 9.1,
      "support": 6.8,
      "products": 7.0,
      "marketing": 0,
      "system": 8.5
    },
    "scoreDetails": {
      "customerQuality": 75.5,
      "operationalEfficiency": 85.2,
      "supportEffectiveness": 72.3,
      "overallScore": 77.7,
      "rating": "良好"
    },
    "trends": {
      "direction": "上升",
      "change": 5.2,
      "description": "業務表現持續改善",
      "customerChange": 3.5,
      "operationalChange": 6.8
    },
    "insights": [
      {
        "title": "業務成長動能強勁",
        "description": "業務指標上升 5.2%，表現優於預期",
        "type": "opportunity",
        "impact": "medium",
        "confidence": 0.9,
        "category": "成長機會",
        "actions": [
          "分析成功因素",
          "擴大優勢策略",
          "設定更高目標"
        ]
      },
      {
        "title": "客服效能待改善",
        "description": "客服健康度 6.8 分，可能影響客戶滿意度",
        "type": "info",
        "impact": "medium",
        "confidence": 0.8,
        "category": "客戶服務",
        "actions": [
          "優化回應時間",
          "培訓客服人員",
          "改善服務流程"
        ]
      }
    ],
    "timestamp": "2025-10-01T06:00:00.000Z"
  }
}
```

#### Phase 1.5 Database Function 請求

```sql
SELECT * FROM get_unified_dashboard_content();
```

#### Phase 1.5 Database Function 響應

```json
{
  "alerts": [
    {
      "id": "uuid-1",
      "alert_type": "inventory_alert",
      "title": "庫存不足警示",
      "message": "注意：5 項商品庫存偏低",
      "severity": "warning",
      "metric_name": "low_stock_count",
      "current_value": 5,
      "threshold_value": 3,
      "detected_at": "2025-10-01T05:30:00.000Z",
      "confidence_score": 0.85
    }
  ],
  "recommendations": [
    {
      "recommendation_type": "inventory_management",
      "category": "庫存管理",
      "title": "庫存補貨策略優化",
      "description": "缺貨商品5件，建議立即檢討安全庫存設定並優化供應商交期管理。",
      "impact_level": "medium",
      "effort_level": "medium",
      "priority_score": 70,
      "confidence_score": 0.80,
      "business_context": {
        "source_alert_id": "uuid-1",
        "current_value": 5,
        "efficiency_improvement": "15-20%"
      },
      "estimated_timeline": "2-4週"
    }
  ],
  "insights": [
    {
      "insight_type": "stability_insight",
      "category": "系統穩定",
      "title": "業務指標運行穩定",
      "description": "各項關鍵業務指標均在正常範圍內運行，建議保持現有策略並持續監控市場變化。",
      "impact_level": "low",
      "confidence_score": 0.85,
      "business_context": { "status": "healthy" },
      "action_items": [
        "維持成功策略",
        "定期檢視指標",
        "準備應對變化",
        "持續優化體驗"
      ]
    }
  ]
}
```

---

## 系統配置與閾值設定

### 指標閾值配置 (metric_thresholds)

```sql
-- 客戶流失率閾值
INSERT INTO metric_thresholds (
    metric_name, display_name, category,
    threshold_value, comparison_operator, severity,
    is_higher_better, alert_message_template
) VALUES (
    'customer_churn_rate',
    '客戶流失率',
    '客戶健康',
    15.0,              -- 超過 15% 觸發警報
    '>',
    'critical',
    FALSE,
    '客戶流失率達到 %s%%，超過警戒值 %s%%'
);

-- 平均回應時間閾值
INSERT INTO metric_thresholds (
    metric_name, display_name, category,
    threshold_value, comparison_operator, severity,
    is_higher_better, alert_message_template
) VALUES (
    'avg_response_time',
    '平均回應時間',
    '客服效率',
    120.0,             -- 超過 120 分鐘觸發警報
    '>',
    'warning',
    FALSE,
    '平均回應時間 %s 分鐘，超過標準 %s 分鐘'
);

-- 訂單完成率閾值
INSERT INTO metric_thresholds (
    metric_name, display_name, category,
    threshold_value, comparison_operator, severity,
    is_higher_better, alert_message_template
) VALUES (
    'order_completion_rate',
    '訂單完成率',
    '營運效率',
    85.0,              -- 低於 85% 觸發警報
    '<',
    'warning',
    TRUE,
    '訂單完成率 %s%%，低於標準 %s%%'
);

-- 庫存缺貨數量閾值
INSERT INTO metric_thresholds (
    metric_name, display_name, category,
    threshold_value, comparison_operator, severity,
    is_higher_better, alert_message_template
) VALUES (
    'inventory_stockout_count',
    '缺貨商品數量',
    '庫存管理',
    3.0,               -- 超過 3 件觸發警報
    '>',
    'warning',
    FALSE,
    '缺貨商品數量 %s 件，超過警戒值 %s 件'
);
```

### 健康度評分配置

```typescript
// Edge Function 內部配置
const HEALTH_SCORE_WEIGHTS = {
  customerQuality: 0.4,        // 客戶品質權重 40%
  operationalEfficiency: 0.35, // 營運效率權重 35%
  supportEffectiveness: 0.25   // 客服效能權重 25%
}

const SYSTEM_STABILITY_WEIGHTS = {
  notificationModule: 1.5,     // 通知系統權重 (最重要)
  orderModule: 2.0,            // 訂單系統權重 (核心業務)
  inventoryModule: 1.2         // 庫存系統權重 (支援功能)
}

const RATING_THRESHOLDS = {
  excellent: 90,   // 優秀
  good: 75,        // 良好
  normal: 60,      // 普通
  needImprove: 40  // 需改善
  // < 40 = 待加強
}
```

### 洞察生成參數

```typescript
const INSIGHT_GENERATION_CONFIG = {
  maxInsights: 5,                    // 最多返回洞察數
  overallScoreExcellent: 90,         // 優異門檻
  overallScorePoor: 60,              // 待改善門檻
  systemStabilityWarning: 7.0,       // 系統穩定度警告門檻
  trendChangeSignificant: 5,         // 顯著趨勢變化門檻 (%)
  trendChangeStrong: 10,             // 強勁趨勢變化門檻 (%)
  supportHealthWarning: 5.0,         // 客服健康度警告門檻
  revenueHealthWarning: 6.0,         // 營收健康度警告門檻
  confidenceThresholds: {
    high: 0.85,
    medium: 0.75,
    low: 0.65
  }
}
```

---

## 📈 效能與優化

### 快取策略

#### Query 層快取

```typescript
// Phase 2 Edge Function (業務洞察)
staleTime: 5 * 60 * 1000   // 5 分鐘內不重新請求
gcTime: 10 * 60 * 1000     // 10 分鐘後清除快取

// Phase 1.5 Database Functions (警示+建議)
staleTime: 2 * 60 * 1000   // 2 分鐘內不重新請求
gcTime: 5 * 60 * 1000      // 5 分鐘後清除快取
```

#### Edge Function 內部優化

```typescript
// 並行計算多個指標
const [metrics, scoreDetails, trends] = await Promise.all([
  calculateBusinessHealthMetrics(supabase, period),
  calculateDetailedHealthScores(supabase, period),
  includeTrends ? calculateTrendAnalysis(supabase, period) : null
])
```

### 資料庫查詢優化

#### 使用預先計算的視圖

```sql
-- 已優化的視圖
- user_rfm_lifecycle_metrics       (RFM 分析)
- conversation_summary_daily       (客服摘要)
- order_basic_summary              (訂單摘要)
- inventory_health_summary         (庫存健康度)

-- 索引優化
CREATE INDEX idx_dashboard_alerts_active
ON dashboard_alerts (is_active, is_resolved, severity, detected_at DESC)
WHERE is_active = TRUE;

CREATE INDEX idx_metric_thresholds_lookup
ON metric_thresholds (metric_name, is_active)
WHERE is_active = TRUE;
```

### 前端渲染優化

#### 懶載入圖表組件

```typescript
// 懶載入分析圖表以提升首屏載入效能
const HealthTrendChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/HealthTrendChart.vue')
)
const HealthComparisonChart = defineAsyncComponent(() =>
  import('@/components/insights/health/HealthComparisonChart.vue')
)
const RiskDistributionChart = defineAsyncComponent(() =>
  import('@/components/charts/pure/RiskDistributionChart.vue')
)
```

#### 條件渲染與虛擬滾動

```vue
<!-- 僅在有數據時渲染 -->
<div v-if="!protectedHealthQuery.isLoading.value && insights.length > 0">
  <!-- 洞察卡片列表 -->
</div>

<!-- 空狀態處理 -->
<div v-else-if="!protectedHealthQuery.isLoading.value && insights.length === 0">
  <Alert>系統運行正常，暫無特別洞察</Alert>
</div>
```

---

## 🧪 測試與驗證

### Edge Function 測試

#### 單元測試範例

```typescript
// business-health-analytics.test.ts
describe('generateBusinessInsights', () => {
  it('should generate excellence insight when score >= 90', () => {
    const metrics = createMockMetrics({ revenue: 9.5, support: 9.0 })
    const scoreDetails = { overallScore: 92, rating: '優秀' }

    const insights = generateBusinessInsights(metrics, scoreDetails, null)

    expect(insights).toHaveLength(1)
    expect(insights[0].title).toBe('業務表現優異')
    expect(insights[0].type).toBe('opportunity')
    expect(insights[0].confidence).toBe(0.95)
  })

  it('should generate warning insight when score <= 60', () => {
    const metrics = createMockMetrics({ revenue: 4.5, support: 5.5 })
    const scoreDetails = { overallScore: 55, rating: '需改善' }

    const insights = generateBusinessInsights(metrics, scoreDetails, null)

    expect(insights[0].title).toBe('業務健康度需改善')
    expect(insights[0].type).toBe('warning')
    expect(insights[0].impact).toBe('high')
  })

  it('should limit insights to maximum 5', () => {
    const metrics = createMockMetrics({
      revenue: 5.0, support: 4.5, system: 6.5
    })
    const scoreDetails = { overallScore: 55, rating: '需改善' }
    const trends = { direction: '下降', change: 8.0 }

    const insights = generateBusinessInsights(metrics, scoreDetails, trends)

    expect(insights.length).toBeLessThanOrEqual(5)
  })
})
```

### 資料庫函數測試

#### SQL 測試腳本

```sql
-- 測試警報生成函數
BEGIN;
  -- 插入測試閾值
  INSERT INTO metric_thresholds (metric_name, threshold_value, comparison_operator, severity)
  VALUES ('test_metric', 100, '>', 'warning');

  -- 執行警報生成
  SELECT * FROM generate_dashboard_alerts();

  -- 驗證結果
  SELECT COUNT(*) as alert_count FROM dashboard_alerts WHERE metric_name = 'test_metric';

  -- 預期: alert_count > 0 (如果有超過閾值的數據)
ROLLBACK;

-- 測試建議生成函數
BEGIN;
  -- 插入測試警報
  INSERT INTO dashboard_alerts (
    metric_name, severity, current_value, is_active, is_resolved
  ) VALUES ('customer_churn_rate', 'critical', 18.5, TRUE, FALSE);

  -- 執行建議生成
  SELECT * FROM generate_strategic_recommendations();

  -- 驗證結果
  SELECT recommendation_type, priority_score, impact_level
  FROM generate_strategic_recommendations()
  WHERE recommendation_type = 'customer_retention';

  -- 預期: priority_score = 95, impact_level = 'high'
ROLLBACK;
```

### 整合測試

#### E2E 測試場景

```typescript
// e2e/dashboard-executive-health.spec.ts
describe('Dashboard Executive Health', () => {
  it('should display business insights when data is available', async () => {
    await page.goto('/dashboard/executive-health')

    // 等待 Edge Function 回應
    await page.waitForSelector('[data-testid="business-insights"]')

    // 驗證洞察卡片顯示
    const insightCards = await page.$$('[data-testid="insight-card"]')
    expect(insightCards.length).toBeGreaterThan(0)

    // 驗證洞察內容
    const firstInsight = await page.$eval(
      '[data-testid="insight-card"]:first-child h4',
      el => el.textContent
    )
    expect(firstInsight).toBeTruthy()
  })

  it('should display risk alerts with correct priority sorting', async () => {
    await page.goto('/dashboard/executive-health')

    await page.waitForSelector('[data-testid="risk-alerts"]')

    const alertTypes = await page.$$eval(
      '[data-testid="alert-item"] [data-alert-type]',
      els => els.map(el => el.getAttribute('data-alert-type'))
    )

    // 驗證排序: error > warning > info > success
    const priorityOrder = ['error', 'warning', 'info', 'success']
    let lastPriority = -1

    alertTypes.forEach(type => {
      const currentPriority = priorityOrder.indexOf(type)
      expect(currentPriority).toBeGreaterThanOrEqual(lastPriority)
      lastPriority = currentPriority
    })
  })

  it('should display strategic recommendations based on alerts', async () => {
    await page.goto('/dashboard/executive-health')

    await page.waitForSelector('[data-testid="recommendations"]')

    const recommendations = await page.$$('[data-testid="recommendation-item"]')
    expect(recommendations.length).toBeGreaterThan(0)

    // 驗證建議包含時間軸
    const timeline = await page.$eval(
      '[data-testid="recommendation-item"]:first-child [data-testid="timeline"]',
      el => el.textContent
    )
    expect(timeline).toMatch(/週|個月/)
  })
})
```

---

## 🔮 未來擴展規劃

### Phase 3: 進階功能

1. **預測性警報**
   - 基於歷史趨勢預測未來風險
   - 機器學習模型整合
   - 異常檢測演算法

2. **自定義閾值**
   - 使用者可調整警報閾值
   - 行業基準比對
   - A/B 測試閾值優化

3. **警報智能分群**
   - 相關警報自動分組
   - 根因分析
   - 連鎖影響預測

4. **建議優先級動態調整**
   - 基於資源可用性調整建議
   - ROI 自動計算
   - 成本效益分析整合

### 技術債務清理

1. **文件補強**
   - API 端點完整規格文件
   - 業務規則對照表
   - 案例研究與最佳實踐

2. **測試覆蓋提升**
   - Edge Function 單元測試 (目標 90%+)
   - 資料庫函數集成測試
   - E2E 測試場景擴展

3. **效能監控**
   - Edge Function 執行時間追蹤
   - 資料庫查詢效能分析
   - 前端渲染效能優化

---

## 相關文件連結

- [Dashboard 分析文件](./dashboard-analysis-documentation.md)
- [Edge Function 遷移評估](../../04-guides/dev-notes/EDGE_FUNCTION_MIGRATION_ASSESSMENT.md)
- [AI 增強警報系統](../../04-guides/dev-notes/AI_ENHANCED_ALERT_SYSTEM_SPECIFICATION.md)
- [Realtime 錯誤回報優化](../../04-guides/dev-notes/REALTIME_ERROR_REPORTING_OPTIMIZATION.md)
- [業務模組文件](./business-modules.md)

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|---------|------|
| 2025-10-01 | 1.0.0 | 初始版本建立 | Claude Code |

---

## 貢獻指南

如需更新此文件，請遵循以下原則：

1. 保持演算法描述的準確性，與實際程式碼一致
2. 更新範例時使用真實的業務場景
3. 新增配置參數時說明調整理由
4. 效能優化需提供前後對比數據
5. 所有變更需更新「變更歷史」區塊

---

**文件維護者**: 開發團隊
**最後審閱**: 2025-10-01
**下次審閱**: 2025-11-01 (或重大功能變更時)