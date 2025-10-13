# AI增強漸進式警示系統完整規劃文件

## 專案概覽

### 背景與需求
電商管理平台的 `DashboardExecutiveHealth.vue` 目前使用假資料顯示業務建議和關鍵警示。為提供真實且智能化的管理決策支援，需要建立一套**AI增強的漸進式警示系統**。

### 核心設計原則
1. **職責分離**：警示系統獨立於現有通知系統，避免功能混淆
2. **漸進式增強**：基礎功能可獨立運作，AI功能作為可選增強
3. **可配置性**：AI模組完全可開關，支援多提供商串接
4. **安全考量**：API Key加密存儲，錯誤降級處理

## 系統架構設計

### 職責邊界定義

```
通知系統 (Notifications) - 現有系統           警示系統 (Alerts) - 新建系統
├── 個人化推送                              ├── 儀表板展示
├── 角色群組路由                            ├── 業務指標監控  
├── 模板管理 (notification_templates)       ├── 閾值突破警示
├── 讀取狀態追蹤                            ├── 趨勢分析洞察
├── 個人偏好設定                            ├── AI決策建議
└── 即時事件提醒                            └── 管理層決策支援

使用場景：                                  使用場景：
"訂單A需要小莎處理" → 推送通知              "客服回應時間超標15%" → 儀表板警示
"庫存不足" → 推送給採購人員                  "高價值客戶流失趨勢" → 管理洞察
```

### 三階段漸進式架構

```
階段1: 基礎警示系統 (獨立運作)
閾值配置 → 數據監控 → 觸發警示 → 儀表板顯示
特點：完全不依賴AI，提供基礎業務監控

階段2: AI增強模組 (可選配置)  
基礎警示 + AI配置 → 外部AI分析 → 智能建議 → 增強顯示
特點：AI模組可開關，支援多提供商

階段3: 情境感知分析 (高級功能)
業務情境 → AI模式識別 → 動態建議 → 成效追蹤 → 學習優化
特點：基於歷史數據的智能化建議
```

## 前端三區塊整合分析

### 目前狀況分析 (Phase 1 實施後)

基於 2025-08-06 的系統分析，前端 `DashboardExecutiveHealth.vue` 頁面的三個主要區塊資料來源和邏輯如下：

#### 🚨 **「風險預警中心」** 
```typescript
// 資料來源
const criticalAlerts = computed(() => {
  const alerts = dashboardAlertsQuery.data.value || []
  // 轉換新警示系統格式到現有 UI 格式
  return alerts.map(alert => ({ ... }))
})
```

**技術細節**：
- **主要資料表**: `dashboard_alerts` ✅ 已實現
- **查詢函數**: `useDashboardAlerts()` → `get_active_dashboard_alerts()`
- **篩選條件**: `alert_type = 'threshold_breach'` AND `is_active = true` AND `is_resolved = false`
- **判斷欄位**: `severity` ('critical', 'warning', 'info')
- **資料流向**: 新警示系統 → 前端轉換 → UI 顯示

#### **「關鍵業務洞察」**
```typescript
// 資料來源  
const keyInsights = computed(() => {
  const insights = businessHealthQuery.data.value?.insights || []
  return insights.slice(0, 3)
})
```

**技術細節**：
- **主要資料表**: `business_health_metrics` ❗ 舊系統
- **查詢函數**: `useBusinessHealthOverview()` → 內部 `generateHealthInsights()`
- **篩選條件**: 基於歷史趨勢分析，非即時警示
- **判斷欄位**: 趨勢計算邏輯，如 `customerQualityChange > 5`
- **資料流向**: 舊健康度系統 → 趨勢分析 → 洞察生成

#### **「戰略行動建議」**
```typescript  
// 資料來源
const businessRecommendations = computed(() => {
  const alerts = dashboardAlertsQuery.data.value || []
  // 根據活躍警示生成對應建議
  alerts.forEach(alert => {
    const recommendation = generateRecommendationFromAlert(alert)
    recommendations.push({ ... })
  })
})
```

**技術細節**：
- **主要資料表**: `dashboard_alerts` (間接) ✅ 已實現
- **查詢函數**: `useDashboardAlerts()` → 前端建議生成邏輯
- **篩選條件**: 基於 `dashboard_alerts` 的活躍警示
- **判斷欄位**: `metric_name` 映射到建議類別
- **資料流向**: 新警示系統 → 前端轉換 → 建議生成

### 系統差異分析

| 區塊 | 資料來源 | 更新頻率 | 邏輯複雜度 | 整合狀況 |
|------|----------|----------|------------|----------|
| **風險預警中心** | `dashboard_alerts` | 即時 | 低 | ✅ 已完全整合 |  
| **關鍵業務洞察** | `business_health_metrics` | 定期 | 高 | ❗ 雙軌制運作 |
| **戰略行動建議** | `dashboard_alerts` (衍生) | 即時 | 中 | ⚠️ 前端邏輯重複 |

### 重疊與問題點

#### **資料重疊**：
- 「風險預警中心」和「戰略行動建議」都依賴 `dashboard_alerts`
- 造成重複查詢和前端邏輯複雜化

#### **資料孤島**：
- 「關鍵業務洞察」完全獨立運作，未整合新警示系統
- 可能出現資訊不一致的問題

#### **計算重複**：
- 前端多處進行相似的資料轉換和建議生成
- 效能和維護成本較高

## Phase 1.5 整合改進方案

### 建議的系統統一架構

```
統一的 dashboard_alerts 系統
├── alert_type = 'threshold_breach'    → 「風險預警中心」(即時閾值警示)
├── alert_type = 'trend_analysis'      → 「關鍵業務洞察」(趨勢分析洞察) 
└── alert_type = 'anomaly_detection'   → 未來擴展 (異常檢測)

統一建議生成引擎 (後端)
└── 基於所有 alert_type 統一生成 → 「戰略行動建議」
```

### 實施優先級與取捨

#### **🟢 立即實施 (投資報酬率高)**
1. **新增 trend_analysis 類型**
   - 擴展 `calculate_business_metrics()` 函數
   - 新增趨勢分析邏輯到 `check_and_generate_alerts()`
   - 遷移「關鍵業務洞察」到新系統

2. **統一建議生成邏輯**
   - 後端統一建議生成，避免前端重複計算
   - 基於不同 alert_type 提供對應建議
   - 簡化前端邏輯

#### **🟡 短期考慮 (Phase 2 實施)**
3. **anomaly_detection 類型**
   - 需要統計學習算法，複雜度高
   - 建議配合 AI 整合一起實施

#### **🔴 暫不建議 (投資報酬率低)**  
4. **完全重構現有系統**
   - 風險高，可能破壞現有穩定功能
   - 採用漸進式改進策略

### 預期效益

#### **系統層面**
- ✅ 統一資料模型，降低維護成本
- ✅ 消除重複計算，提升系統效能
- ✅ 資料一致性保證
- ✅ 為 AI 整合準備基礎

#### **開發效率**
- ✅ 減少前端複雜邏輯  
- ✅ 統一的開發和測試模式
- ✅ 更清晰的職責分離

## 資料庫結構設計

### Phase 1: 基礎資料表

#### 1. 指標閾值配置表
```sql
CREATE TABLE metric_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL UNIQUE, 
    display_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'customer', 'operational', 'financial', 'service'
    
    -- 閾值設定 (支援多層級警戒)
    green_min DECIMAL(10,4), -- 健康範圍最小值
    green_max DECIMAL(10,4), -- 健康範圍最大值  
    yellow_min DECIMAL(10,4), -- 警告範圍最小值
    yellow_max DECIMAL(10,4), -- 警告範圍最大值
    red_threshold DECIMAL(10,4), -- 緊急閾值
    
    -- 配置參數
    unit VARCHAR(20) DEFAULT 'number', -- '%', 'minutes', 'count', 'currency'
    is_higher_better BOOLEAN DEFAULT TRUE, -- TRUE: 越高越好, FALSE: 越低越好
    calculation_period VARCHAR(20) DEFAULT 'daily', -- 'realtime', 'daily', 'weekly'
    
    -- 管理資訊
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 檢查約束
    CONSTRAINT valid_thresholds CHECK (
        (is_higher_better = TRUE AND red_threshold <= yellow_min) OR
        (is_higher_better = FALSE AND red_threshold >= yellow_max)
    )
);

-- 插入預設閾值
INSERT INTO metric_thresholds (
    metric_name, display_name, category, yellow_max, red_threshold, 
    unit, is_higher_better
) VALUES 
('avg_response_time', '平均客服回應時間', 'service', 60, 120, 'minutes', FALSE),
('customer_churn_rate', '客戶流失率', 'customer', 10, 20, '%', FALSE),
('order_completion_rate', '訂單完成率', 'operational', 85, 75, '%', TRUE),
('inventory_stock_out_count', '缺貨商品數量', 'inventory', 5, 10, 'count', FALSE);
```

#### 2. 儀表板警示表
```sql  
CREATE TABLE dashboard_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 警示基本資訊
    alert_type VARCHAR(50) NOT NULL, -- 'threshold_breach', 'trend_analysis', 'anomaly_detection'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    metric_name VARCHAR(100) REFERENCES metric_thresholds(metric_name),
    
    -- 警示內容
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    current_value DECIMAL(10,4),
    threshold_value DECIMAL(10,4),
    
    -- 業務情境 (JSON格式儲存相關指標)
    business_context JSONB DEFAULT '{}'::jsonb,
    
    -- 時間資訊
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- 狀態管理
    is_active BOOLEAN DEFAULT TRUE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT,
    
    -- AI相關欄位 (Phase 2 才會使用)
    ai_suggestion TEXT,
    ai_confidence DECIMAL(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    ai_generated_at TIMESTAMPTZ,
    ai_provider VARCHAR(50)
);

-- 建立索引
CREATE INDEX idx_dashboard_alerts_active ON dashboard_alerts(is_active, severity, detected_at DESC);
CREATE INDEX idx_dashboard_alerts_metric ON dashboard_alerts(metric_name, is_active);
CREATE INDEX idx_dashboard_alerts_expires ON dashboard_alerts(expires_at) WHERE is_active = TRUE;
```

#### 3. AI配置表 (支援Phase 2擴展)
```sql
CREATE TABLE ai_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 基本配置
    ai_enabled BOOLEAN DEFAULT FALSE,
    ai_provider VARCHAR(50), -- 'openai', 'claude', 'ollama', 'gemini'  
    
    -- API配置
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT, -- 使用 pgcrypto 加密
    model_name VARCHAR(100),
    
    -- 提示詞模板
    prompt_template TEXT DEFAULT '你是電商業務分析專家。基於以下業務指標異常情況，請提供具體、可行的改善建議：\n\n指標名稱：{{metric_name}}\n當前數值：{{current_value}}\n警戒閾值：{{threshold_value}}\n業務背景：{{business_context}}\n\n請提供：\n1. 問題分析\n2. 具體改善行動\n3. 預期成效\n4. 實施時程',
    
    -- 配置參數
    max_tokens INTEGER DEFAULT 200,
    temperature DECIMAL(3,2) DEFAULT 0.3,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- 管理資訊
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 確保只有一個活躍配置
    CONSTRAINT single_active_config UNIQUE (ai_enabled) DEFERRABLE INITIALLY DEFERRED
);

-- 插入預設配置
INSERT INTO ai_config (ai_enabled) VALUES (FALSE);
```

### Phase 3: 進階分析表 (可選)

#### 業務情境快照表
```sql
CREATE TABLE business_context_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- 分類業務指標快照
    customer_metrics JSONB DEFAULT '{}'::jsonb, -- 客戶指標
    operational_metrics JSONB DEFAULT '{}'::jsonb, -- 營運指標  
    financial_metrics JSONB DEFAULT '{}'::jsonb, -- 財務指標
    service_metrics JSONB DEFAULT '{}'::jsonb, -- 服務指標
    inventory_metrics JSONB DEFAULT '{}'::jsonb, -- 庫存指標
    
    -- 觸發資訊
    triggered_by VARCHAR(100) DEFAULT 'scheduled',
    trigger_details JSONB DEFAULT '{}'::jsonb,
    
    CONSTRAINT valid_metrics_json CHECK (
        jsonb_typeof(customer_metrics) = 'object' AND
        jsonb_typeof(operational_metrics) = 'object' AND
        jsonb_typeof(service_metrics) = 'object'
    )
);
```

#### 建議成效追蹤表
```sql  
CREATE TABLE recommendation_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES dashboard_alerts(id),
    
    -- 實施資訊
    implemented_at TIMESTAMPTZ,
    implemented_by UUID REFERENCES auth.users(id),
    implementation_notes TEXT,
    
    -- 成效評估
    success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5),
    actual_improvement DECIMAL(10,4), -- 實際改善幅度
    measurement_period_days INTEGER DEFAULT 7,
    
    -- 學習反饋
    lessons_learned TEXT,
    would_recommend_again BOOLEAN,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 核心功能函數

### 基礎警示監控函數

```sql
-- 核心監控函數：檢測閾值突破並生成警示
CREATE OR REPLACE FUNCTION detect_threshold_breaches()
RETURNS INTEGER AS $$
DECLARE
    threshold_rec RECORD;
    current_val DECIMAL(10,4);
    alert_severity VARCHAR(20);
    alert_count INTEGER DEFAULT 0;
BEGIN
    -- 遍歷所有活躍的閾值配置
    FOR threshold_rec IN 
        SELECT * FROM metric_thresholds WHERE is_active = TRUE
    LOOP
        -- 根據不同指標計算當前值
        current_val := CASE threshold_rec.metric_name
            WHEN 'avg_response_time' THEN (
                SELECT AVG(avg_first_response_minutes)
                FROM conversation_summary_daily 
                WHERE conversation_date >= CURRENT_DATE - INTERVAL '7 days'
            )
            WHEN 'customer_churn_rate' THEN (
                SELECT COUNT(*)::DECIMAL / NULLIF(COUNT(*) OVER(), 0) * 100
                FROM customers 
                WHERE NOT EXISTS (
                    SELECT 1 FROM orders 
                    WHERE orders.user_id = customers.id 
                    AND orders.created_at >= NOW() - INTERVAL '60 days'
                )
            )
            WHEN 'order_completion_rate' THEN (
                SELECT AVG(CASE WHEN status IN ('completed', 'delivered') THEN 1.0 ELSE 0.0 END) * 100
                FROM orders 
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            )
            WHEN 'inventory_stock_out_count' THEN (
                SELECT COUNT(*)
                FROM inventories 
                WHERE stock <= 0
            )
            ELSE 0
        END;
        
        -- 跳過無效數值
        CONTINUE WHEN current_val IS NULL;
        
        -- 判斷警示級別
        alert_severity := CASE
            WHEN (threshold_rec.is_higher_better = FALSE AND current_val >= threshold_rec.red_threshold) OR
                 (threshold_rec.is_higher_better = TRUE AND current_val <= threshold_rec.red_threshold) THEN
                'critical'
            WHEN (threshold_rec.is_higher_better = FALSE AND current_val >= threshold_rec.yellow_max) OR
                 (threshold_rec.is_higher_better = TRUE AND current_val <= threshold_rec.yellow_min) THEN  
                'warning'
            ELSE 
                NULL -- 在正常範圍內
        END;
        
        -- 生成警示 (如果超出閾值且24小時內沒有相同警示)
        IF alert_severity IS NOT NULL THEN
            INSERT INTO dashboard_alerts (
                alert_type, severity, metric_name, title, message, 
                current_value, threshold_value, business_context
            )
            SELECT 
                'threshold_breach', 
                alert_severity,
                threshold_rec.metric_name,
                format('%s異常：%s', threshold_rec.display_name, 
                    CASE alert_severity WHEN 'critical' THEN '緊急處理' ELSE '需要關注' END),
                format('%s當前值為 %s %s，已%s閾值 %s %s', 
                    threshold_rec.display_name, 
                    current_val, 
                    threshold_rec.unit,
                    CASE alert_severity WHEN 'critical' THEN '超出緊急' ELSE '觸及警告' END,
                    COALESCE(threshold_rec.red_threshold, threshold_rec.yellow_max), 
                    threshold_rec.unit),
                current_val,
                COALESCE(threshold_rec.red_threshold, threshold_rec.yellow_max),
                jsonb_build_object(
                    'category', threshold_rec.category,
                    'calculation_period', threshold_rec.calculation_period,
                    'detection_timestamp', NOW()
                )
            WHERE NOT EXISTS (
                -- 避免24小時內重複警示
                SELECT 1 FROM dashboard_alerts
                WHERE metric_name = threshold_rec.metric_name
                  AND is_active = TRUE
                  AND created_at >= NOW() - INTERVAL '24 hours'
            );
            
            -- 計數器增加
            IF FOUND THEN
                alert_count := alert_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- 清理過期警示
    UPDATE dashboard_alerts 
    SET is_active = FALSE
    WHERE expires_at < NOW() AND is_active = TRUE;
    
    RETURN alert_count;
END;
$$ LANGUAGE plpgsql;
```

### 業務情境快照函數

```sql
-- 生成完整業務情境快照
CREATE OR REPLACE FUNCTION create_business_snapshot(
    p_trigger_reason VARCHAR DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
    snapshot_id UUID;
BEGIN
    INSERT INTO business_context_snapshots (
        customer_metrics,
        operational_metrics, 
        service_metrics,
        inventory_metrics,
        triggered_by
    )
    SELECT 
        -- 客戶指標
        jsonb_build_object(
            'total_customers', (SELECT COUNT(*) FROM customers),
            'active_customers_30d', (
                SELECT COUNT(DISTINCT user_id) 
                FROM orders 
                WHERE created_at >= NOW() - INTERVAL '30 days'
            ),
            'at_risk_customers', (
                SELECT COUNT(*) FROM customers c
                WHERE NOT EXISTS (
                    SELECT 1 FROM orders o 
                    WHERE o.user_id = c.id 
                    AND o.created_at >= NOW() - INTERVAL '60 days'
                )
            )
        ),
        -- 營運指標
        jsonb_build_object(
            'total_orders_7d', (
                SELECT COUNT(*) FROM orders 
                WHERE created_at >= NOW() - INTERVAL '7 days'
            ),
            'pending_orders', (
                SELECT COUNT(*) FROM orders 
                WHERE status IN ('pending', 'confirmed')
            ),
            'completion_rate', (
                SELECT AVG(CASE WHEN status IN ('completed', 'delivered') THEN 1.0 ELSE 0.0 END)
                FROM orders 
                WHERE created_at >= NOW() - INTERVAL '7 days'
            )
        ),
        -- 服務指標
        jsonb_build_object(
            'avg_response_time_7d', (
                SELECT AVG(avg_first_response_minutes)
                FROM conversation_summary_daily 
                WHERE conversation_date >= CURRENT_DATE - INTERVAL '7 days'
            ),
            'total_conversations_7d', (
                SELECT SUM(total_conversations)
                FROM conversation_summary_daily 
                WHERE conversation_date >= CURRENT_DATE - INTERVAL '7 days'
            )
        ),
        -- 庫存指標
        jsonb_build_object(
            'total_products', (SELECT COUNT(*) FROM products WHERE status = 'active'),
            'out_of_stock_count', (SELECT COUNT(*) FROM inventories WHERE stock <= 0),
            'low_stock_count', (SELECT COUNT(*) FROM inventories WHERE stock > 0 AND stock <= 10)
        ),
        p_trigger_reason
    RETURNING id INTO snapshot_id;
    
    RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql;
```

## 前端整合方案

### 查詢Composable設計

```typescript
// composables/queries/useDashboardAlerts.ts
import { useQuery, useMutation } from '@tanstack/vue-query'
import { supabase } from '@/lib/supabase'

export interface DashboardAlert {
  id: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical'
  metric_name: string
  title: string
  message: string
  current_value: number
  threshold_value: number
  business_context: Record<string, any>
  detected_at: string
  is_active: boolean
  is_resolved: boolean
  ai_suggestion?: string
  ai_confidence?: number
}

/**
 * 獲取活躍的儀表板警示
 */
export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async (): Promise<DashboardAlert[]> => {
      const { data, error } = await supabase
        .from('dashboard_alerts')
        .select('*')
        .eq('is_active', true)
        .order('severity', { ascending: false }) // critical -> warning -> info
        .order('detected_at', { ascending: false })
        
      if (error) {
        console.warn('警示查詢失敗:', error.message)
        return []
      }
      
      return data || []
    },
    staleTime: 2 * 60 * 1000, // 2分鐘
    refetchInterval: 5 * 60 * 1000, // 5分鐘自動重整
  })
}

/**
 * 按嚴重程度分組的警示
 */
export function useCategorizedAlerts() {
  const alertsQuery = useDashboardAlerts()
  
  return computed(() => {
    const alerts = alertsQuery.data.value || []
    
    return {
      criticalAlerts: alerts.filter(a => a.severity === 'critical'),
      warningAlerts: alerts.filter(a => a.severity === 'warning'),
      infoAlerts: alerts.filter(a => a.severity === 'info'),
      
      // AI增強的警示 (有AI建議的)
      aiEnhancedAlerts: alerts.filter(a => a.ai_suggestion),
      
      // 基礎警示 (沒有AI建議的)
      basicAlerts: alerts.filter(a => !a.ai_suggestion),
      
      totalAlerts: alerts.length,
    }
  })
}

/**
 * AI配置查詢
 */
export function useAIConfig() {
  return useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_config')
        .select('ai_enabled, ai_provider, model_name')
        .single()
        
      if (error) {
        console.warn('AI配置查詢失敗:', error.message)
        return { ai_enabled: false }
      }
      
      return data
    },
    staleTime: 10 * 60 * 1000, // 10分鐘
  })
}

/**
 * 觸發閾值檢測
 */
export function useTriggerThresholdDetection() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('detect_threshold_breaches')
      
      if (error) throw error
      return data
    },
    onSuccess: (alertCount) => {
      console.log(`檢測完成，生成了 ${alertCount} 個新警示`)
    }
  })
}

/**
 * 解決警示
 */
export function useResolveAlert() {
  return useMutation({
    mutationFn: async ({ 
      alertId, 
      notes 
    }: { 
      alertId: string
      notes?: string 
    }) => {
      const { data, error } = await supabase
        .from('dashboard_alerts')
        .update({ 
          is_resolved: true, 
          resolved_at: new Date().toISOString(),
          resolution_notes: notes 
        })
        .eq('id', alertId)
        .select()
        .single()
        
      if (error) throw error
      return data
    },
  })
}
```

### DashboardExecutiveHealth.vue 整合

```vue
<script setup lang="ts">
// 原有的 imports...
import { useCategorizedAlerts, useAIConfig } from '@/composables/queries/useDashboardAlerts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Bot, AlertTriangle, Info, CheckCircle } from 'lucide-vue-next'

// 原有的查詢...
const businessHealthQuery = useBusinessHealthOverview()
const revenueKPIsQuery = useRevenueKPIs()

// 新增：警示系統整合
const categorizedAlerts = useCategorizedAlerts()
const aiConfig = useAIConfig()

// AI是否啟用
const aiEnabled = computed(() => aiConfig.data.value?.ai_enabled || false)

// 替代原本的假資料
const criticalAlerts = computed(() => categorizedAlerts.value.criticalAlerts)
const businessRecommendations = computed(() => categorizedAlerts.value.aiEnhancedAlerts)

// 獲取警示圖示
const getAlertIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return AlertTriangle
    case 'warning': return AlertTriangle  
    case 'info': return Info
    default: return CheckCircle
  }
}

// 獲取嚴重程度樣式
const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical': return 'border-red-500 bg-red-50'
    case 'warning': return 'border-yellow-500 bg-yellow-50'
    case 'info': return 'border-blue-500 bg-blue-50'
    default: return 'border-gray-300 bg-gray-50'
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- 原有的其他組件... -->
    
    <!-- 風險預警與建議行動 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      
      <!-- 關鍵風險警示 - 使用真實警示數據 -->
      <ChartCard title="風險預警中心">
        <div class="space-y-4">
          <!-- 載入狀態 -->
          <div v-if="categorizedAlerts.isLoading" class="flex h-48 items-center justify-center">
            <div class="text-gray-500">載入警示中...</div>
          </div>
          
          <!-- 無警示狀態 -->
          <div v-else-if="criticalAlerts.length === 0" class="flex h-48 items-center justify-center">
            <div class="text-center">
              <CheckCircle class="mx-auto h-12 w-12 text-green-500 mb-2" />
              <div class="text-gray-500">目前沒有緊急警示</div>
            </div>
          </div>
          
          <!-- 警示列表 -->
          <Alert 
            v-else
            v-for="alert in criticalAlerts" 
            :key="alert.id" 
            :class="getSeverityClass(alert.severity)"
          >
            <component :is="getAlertIcon(alert.severity)" class="h-4 w-4" />
            <AlertTitle>{{ alert.title }}</AlertTitle>
            <AlertDescription class="mt-2">
              <div>{{ alert.message }}</div>
              
              <!-- 數值顯示 -->
              <div class="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>當前值: <strong>{{ alert.current_value }}</strong></span>
                <span>閾值: <strong>{{ alert.threshold_value }}</strong></span>
              </div>
              
              <!-- AI建議 (僅在啟用且有建議時顯示) -->
              <div v-if="aiEnabled && alert.ai_suggestion" class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-start gap-2">
                  <Bot class="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-blue-800">AI建議</div>
                    <div class="text-sm text-blue-700 mt-1">{{ alert.ai_suggestion }}</div>
                    <div class="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" class="text-xs">
                        信心度: {{ (alert.ai_confidence * 100).toFixed(0) }}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </ChartCard>

      <!-- 戰略建議 - 基於AI增強的警示 -->
      <ChartCard title="智能行動建議">
        <div class="space-y-3">
          <!-- 載入狀態 -->
          <div v-if="categorizedAlerts.isLoading" class="flex h-48 items-center justify-center">
            <div class="text-gray-500">載入建議中...</div>
          </div>
          
          <!-- AI未啟用狀態 -->
          <div v-else-if="!aiEnabled" class="flex h-48 items-center justify-center">
            <div class="text-center">
              <Bot class="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <div class="text-gray-500">AI建議模組未啟用</div>
              <div class="text-sm text-gray-400 mt-1">請聯繫管理員啟用AI功能</div>
            </div>
          </div>
          
          <!-- 無AI建議狀態 -->
          <div v-else-if="businessRecommendations.length === 0" class="flex h-48 items-center justify-center">
            <div class="text-center">
              <CheckCircle class="mx-auto h-12 w-12 text-green-500 mb-2" />
              <div class="text-gray-500">暫無需要特別關注的業務建議</div>
            </div>
          </div>
          
          <!-- AI建議列表 -->
          <Alert v-else v-for="recommendation in businessRecommendations" :key="recommendation.id">
            <Bot class="h-4 w-4 text-blue-600" />
            <AlertTitle class="text-blue-800">{{ recommendation.title }}</AlertTitle>
            <AlertDescription class="mt-2">
              <div class="text-gray-700">{{ recommendation.message }}</div>
              
              <!-- AI建議內容 -->
              <div class="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div class="text-sm font-medium text-blue-800 mb-2">AI分析建議</div>
                <div class="text-sm text-blue-700 leading-relaxed">
                  {{ recommendation.ai_suggestion }}
                </div>
                
                <div class="flex items-center justify-between mt-3">
                  <Badge variant="outline" class="text-xs">
                    {{ aiConfig.data.value?.ai_provider || 'AI' }} · {{ aiConfig.data.value?.model_name }}
                  </Badge>
                  <Badge 
                    variant="secondary" 
                    :class="{
                      'bg-green-100 text-green-800': recommendation.ai_confidence >= 0.8,
                      'bg-yellow-100 text-yellow-800': recommendation.ai_confidence >= 0.6,
                      'bg-red-100 text-red-800': recommendation.ai_confidence < 0.6
                    }"
                  >
                    信心度: {{ (recommendation.ai_confidence * 100).toFixed(0) }}%
                  </Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </ChartCard>
    </div>
  </div>
</template>
```

## AI Provider 系統設計

### 統一介面定義

```typescript
// types/ai.ts
export interface AIProvider {
  name: string
  validateConfig(config: AIConfig): Promise<boolean>
  generateRecommendation(context: AlertContext): Promise<AIRecommendationResult>
  estimateCost?(context: AlertContext): number
}

export interface AIConfig {
  ai_provider: string
  api_endpoint?: string
  api_key: string
  model_name: string
  max_tokens?: number
  temperature?: number
  timeout_seconds?: number
}

export interface AlertContext {
  metric_name: string
  display_name: string
  current_value: number
  threshold_value: number
  severity: string
  business_context: Record<string, any>
  historical_data?: any[]
}

export interface AIRecommendationResult {
  suggestion: string
  confidence: number
  reasoning?: string
  estimated_cost?: number
  provider: string
  model: string
  generated_at: Date
}
```

### OpenAI Provider 實現

```typescript
// ai/providers/OpenAIProvider.ts
import type { AIProvider, AIConfig, AlertContext, AIRecommendationResult } from '@/types/ai'

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  
  constructor(private config: AIConfig) {}
  
  async validateConfig(config: AIConfig): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'Content-Type': 'application/json'
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async generateRecommendation(context: AlertContext): Promise<AIRecommendationResult> {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildPrompt(context)
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.api_key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model_name || 'gpt-4o',
          messages: [{
            role: 'system',
            content: '你是專業的電商業務分析師，請基於提供的業務數據異常情況，給出具體、可執行的改善建議。'
          }, {
            role: 'user', 
            content: prompt
          }],
          max_tokens: this.config.max_tokens || 200,
          temperature: this.config.temperature || 0.3
        }),
        signal: AbortSignal.timeout((this.config.timeout_seconds || 30) * 1000)
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API Error: ${response.status}`)
      }
      
      const result = await response.json()
      const suggestion = result.choices[0]?.message?.content || '無法生成建議'
      
      // 估算信心度（基於回應長度和完整性）
      const confidence = this.estimateConfidence(suggestion, context)
      
      return {
        suggestion: suggestion.trim(),
        confidence,
        reasoning: `基於 ${this.config.model_name} 模型分析`,
        estimated_cost: this.calculateCost(result.usage),
        provider: 'OpenAI',
        model: this.config.model_name || 'gpt-4o',
        generated_at: new Date()
      }
      
    } catch (error) {
      console.error('OpenAI建議生成失敗:', error)
      throw new Error('AI建議生成失敗，請稍後重試')
    }
  }
  
  private buildPrompt(context: AlertContext): string {
    return `
業務指標異常分析：

【基本資訊】
- 指標名稱：${context.display_name}
- 當前數值：${context.current_value}
- 警戒閾值：${context.threshold_value}
- 嚴重程度：${context.severity}

【業務背景】
${JSON.stringify(context.business_context, null, 2)}

請提供：
1. 問題根因分析
2. 具體改善行動建議（可在24-48小時內執行）
3. 預期改善效果
4. 執行優先級

回覆請簡潔明瞭，重點突出可執行性。
`.trim()
  }
  
  private estimateConfidence(suggestion: string, context: AlertContext): number {
    let confidence = 0.7 // 基礎信心度
    
    // 根據回應長度調整
    if (suggestion.length > 100) confidence += 0.1
    if (suggestion.length > 200) confidence += 0.1
    
    // 根據關鍵詞調整
    const keywords = ['建議', '行動', '改善', '預期', '執行']
    const keywordCount = keywords.filter(kw => suggestion.includes(kw)).length
    confidence += keywordCount * 0.02
    
    // 根據業務情境復雜度調整
    const contextComplexity = Object.keys(context.business_context).length
    if (contextComplexity > 3) confidence += 0.05
    
    return Math.min(confidence, 0.95) // 最高95%信心度
  }
  
  private calculateCost(usage: any): number {
    if (!usage) return 0
    
    // GPT-4o 定價 (2024年概估)
    const inputCost = (usage.prompt_tokens || 0) * 0.00001 // $0.01/1K tokens
    const outputCost = (usage.completion_tokens || 0) * 0.00003 // $0.03/1K tokens
    
    return Math.round((inputCost + outputCost) * 100) / 100 // 保留2位小數
  }
}
```

### Claude Provider 實現

```typescript
// ai/providers/ClaudeProvider.ts
export class ClaudeProvider implements AIProvider {
  name = 'Claude'
  
  constructor(private config: AIConfig) {}
  
  async validateConfig(config: AIConfig): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.api_key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: config.model_name || 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      return response.ok || response.status === 400 // 400表示請求格式正確但內容問題
    } catch {
      return false
    }
  }
  
  async generateRecommendation(context: AlertContext): Promise<AIRecommendationResult> {
    try {
      const prompt = this.buildPrompt(context)
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.api_key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model_name || 'claude-3-sonnet-20240229',
          max_tokens: this.config.max_tokens || 200,
          messages: [{ 
            role: 'user', 
            content: prompt 
          }]
        }),
        signal: AbortSignal.timeout((this.config.timeout_seconds || 30) * 1000)
      })
      
      if (!response.ok) {
        throw new Error(`Claude API Error: ${response.status}`)
      }
      
      const result = await response.json()
      const suggestion = result.content[0]?.text || '無法生成建議'
      
      return {
        suggestion: suggestion.trim(),
        confidence: this.estimateConfidence(suggestion, context),
        reasoning: `基於 Claude 3 語言模型分析`,
        provider: 'Claude',
        model: this.config.model_name || 'claude-3-sonnet-20240229',
        generated_at: new Date()
      }
      
    } catch (error) {
      console.error('Claude建議生成失敗:', error)
      throw new Error('AI建議生成失敗，請稍後重試')
    }
  }
  
  private buildPrompt(context: AlertContext): string {
    return `你是電商業務分析專家，請分析以下業務指標異常情況：

指標：${context.display_name}
當前值：${context.current_value}
警戒線：${context.threshold_value}  
嚴重程度：${context.severity}

業務背景：${JSON.stringify(context.business_context)}

請提供：
1. 問題分析（50字內）
2. 改善建議（100字內，需具體可執行）
3. 預期成效（30字內）

請用繁體中文回覆，內容簡潔專業。`
  }
  
  private estimateConfidence(suggestion: string, context: AlertContext): number {
    // Claude 通常回覆品質較穩定，基礎信心度較高
    let confidence = 0.8
    
    if (suggestion.includes('建議') && suggestion.includes('預期')) confidence += 0.1
    if (suggestion.length > 150) confidence += 0.05
    
    return Math.min(confidence, 0.95)
  }
}
```

### Ollama (本地AI) Provider

```typescript
// ai/providers/OllamaProvider.ts
export class OllamaProvider implements AIProvider {
  name = 'Ollama'
  
  constructor(private config: AIConfig) {
    // 預設本地端點
    this.config.api_endpoint = config.api_endpoint || 'http://localhost:11434'
  }
  
  async validateConfig(config: AIConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.api_endpoint}/api/tags`)
      if (!response.ok) return false
      
      const models = await response.json()
      return models.models?.some((m: any) => m.name === config.model_name)
    } catch {
      return false
    }
  }
  
  async generateRecommendation(context: AlertContext): Promise<AIRecommendationResult> {
    try {
      const prompt = this.buildPrompt(context)
      
      const response = await fetch(`${this.config.api_endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model_name || 'llama3.1',
          prompt,
          stream: false,
          options: {
            temperature: this.config.temperature || 0.3,
            num_predict: this.config.max_tokens || 200
          }
        }),
        signal: AbortSignal.timeout((this.config.timeout_seconds || 60) * 1000) // 本地AI可能較慢
      })
      
      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.status}`)
      }
      
      const result = await response.json()
      const suggestion = result.response || '無法生成建議'
      
      return {
        suggestion: suggestion.trim(),
        confidence: this.estimateConfidence(suggestion),
        reasoning: `基於本地 ${this.config.model_name} 模型`,
        estimated_cost: 0, // 本地AI無額外成本
        provider: 'Ollama',
        model: this.config.model_name || 'llama3.1',
        generated_at: new Date()
      }
      
    } catch (error) {
      console.error('Ollama建議生成失敗:', error)
      throw new Error('本地AI建議生成失敗，請檢查Ollama服務狀態')
    }
  }
  
  private buildPrompt(context: AlertContext): string {
    return `你是電商業務分析師。請分析業務指標異常：

指標: ${context.display_name}
當前值: ${context.current_value}
閾值: ${context.threshold_value}

請提供簡潔建議(100字內)：
1. 問題原因
2. 改善行動  
3. 預期效果

用繁體中文回答。`
  }
  
  private estimateConfidence(suggestion: string): number {
    // 本地模型信心度相對保守
    let confidence = 0.6
    
    if (suggestion.includes('建議')) confidence += 0.1
    if (suggestion.length > 80) confidence += 0.1
    if (suggestion.includes('改善') || suggestion.includes('優化')) confidence += 0.1
    
    return Math.min(confidence, 0.85) // 本地模型最高85%
  }
}
```

### AI Service 整合層

```typescript
// composables/useAIService.ts
import type { AIProvider, AIConfig, AlertContext } from '@/types/ai'
import { OpenAIProvider } from '@/ai/providers/OpenAIProvider'
import { ClaudeProvider } from '@/ai/providers/ClaudeProvider'
import { OllamaProvider } from '@/ai/providers/OllamaProvider'

export function useAIService() {
  const aiConfigQuery = useAIConfig()
  
  const createProvider = (config: AIConfig): AIProvider => {
    switch (config.ai_provider) {
      case 'openai':
        return new OpenAIProvider(config)
      case 'claude':
        return new ClaudeProvider(config)
      case 'ollama':
        return new OllamaProvider(config)
      default:
        throw new Error(`不支援的AI提供商: ${config.ai_provider}`)
    }
  }
  
  const generateRecommendation = async (context: AlertContext) => {
    const config = aiConfigQuery.data.value
    if (!config?.ai_enabled) {
      return null
    }
    
    try {
      const provider = createProvider(config)
      const result = await provider.generateRecommendation(context)
      
      // 記錄AI使用統計
      console.log(`AI建議生成成功 - Provider: ${result.provider}, 信心度: ${result.confidence}`)
      
      return result
    } catch (error) {
      console.error('AI建議生成失敗:', error)
      
      // 降級處理：返回基礎建議
      return {
        suggestion: '請聯繫相關負責人員處理此指標異常。',
        confidence: 0.3,
        provider: 'fallback',
        model: 'rule_based',
        generated_at: new Date()
      }
    }
  }
  
  return {
    generateRecommendation,
    isEnabled: computed(() => aiConfigQuery.data.value?.ai_enabled || false),
    currentProvider: computed(() => aiConfigQuery.data.value?.ai_provider),
  }
}
```

## 🛡️ 安全與配置管理

### API Key 加密存儲

```sql
-- 啟用 pgcrypto 擴展  
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- API Key 加密函數
CREATE OR REPLACE FUNCTION encrypt_api_key(api_key TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 使用系統密鑰加密（實際部署時應使用環境變數）
  RETURN encode(
    encrypt(
      api_key::bytea, 
      current_setting('app.encryption_key', true)::bytea, 
      'aes'
    ), 
    'base64'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- API Key 解密函數 (僅供應用程式使用)
CREATE OR REPLACE FUNCTION decrypt_api_key(encrypted_key TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN convert_from(
    decrypt(
      decode(encrypted_key, 'base64'),
      current_setting('app.encryption_key', true)::bytea,
      'aes'
    ),
    'UTF8'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新AI配置表的觸發器
CREATE OR REPLACE FUNCTION encrypt_ai_config_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.api_key_encrypted IS NOT NULL AND NEW.api_key_encrypted != '' THEN
    -- 如果看起來是明文API Key，則加密它
    IF NOT (NEW.api_key_encrypted LIKE 'base64:%' OR length(NEW.api_key_encrypted) > 200) THEN
      NEW.api_key_encrypted := encrypt_api_key(NEW.api_key_encrypted);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_encrypt_ai_config
  BEFORE INSERT OR UPDATE ON ai_config
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_ai_config_trigger();
```

### 配置管理界面

```vue
<!-- components/admin/AIConfigManagement.vue -->
<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Bot class="w-5 h-5" />
        AI建議模組配置
      </CardTitle>
      <CardDescription>
        管理AI建議功能的提供商和參數設定
      </CardDescription>
    </CardHeader>
    
    <CardContent class="space-y-6">
      <!-- 基本開關 -->
      <div class="flex items-center justify-between">
        <div>
          <Label class="text-base font-medium">啟用AI建議功能</Label>
          <p class="text-sm text-gray-600">為業務警示提供智能化建議</p>
        </div>
        <Switch 
          v-model="form.ai_enabled"
          @update:model-value="handleToggleAI"
        />
      </div>
      
      <!-- AI配置 (僅在啟用時顯示) -->
      <div v-if="form.ai_enabled" class="space-y-4 pt-4 border-t">
        
        <!-- 提供商選擇 -->
        <div class="space-y-2">
          <Label>AI提供商</Label>
          <Select v-model="form.ai_provider" @update:model-value="handleProviderChange">
            <SelectTrigger>
              <SelectValue placeholder="選擇AI提供商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                  OpenAI GPT-4o
                </div>
              </SelectItem>
              <SelectItem value="claude">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
                  Claude 3 Sonnet
                </div>
              </SelectItem>
              <SelectItem value="ollama">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
                  Ollama (本地AI)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- API設定 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <!-- API Key -->
          <div class="space-y-2" v-if="form.ai_provider !== 'ollama'">
            <Label>API Key</Label>
            <div class="relative">
              <Input 
                v-model="form.api_key"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="請輸入API Key"
                class="pr-10"
              />
              <Button 
                variant="ghost" 
                size="sm"
                class="absolute right-0 top-0 h-full px-3"
                @click="showApiKey = !showApiKey"
              >
                <Eye v-if="!showApiKey" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <!-- 端點地址 (Ollama) -->
          <div class="space-y-2" v-if="form.ai_provider === 'ollama'">
            <Label>API端點</Label>
            <Input 
              v-model="form.api_endpoint"
              placeholder="http://localhost:11434"
            />
          </div>
          
          <!-- 模型名稱 -->
          <div class="space-y-2">
            <Label>模型名稱</Label>
            <Select v-model="form.model_name">
              <SelectTrigger>
                <SelectValue :placeholder="getModelPlaceholder()" />
              </SelectTrigger>
              <SelectContent>
                <template v-if="form.ai_provider === 'openai'">
                  <SelectItem value="gpt-4o">GPT-4o (推薦)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </template>
                <template v-else-if="form.ai_provider === 'claude'">
                  <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet (推薦)</SelectItem>
                  <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                </template>
                <template v-else-if="form.ai_provider === 'ollama'">
                  <SelectItem value="llama3.1">Llama 3.1 (推薦)</SelectItem>
                  <SelectItem value="gemma2">Gemma 2</SelectItem>
                  <SelectItem value="qwen2">Qwen 2</SelectItem>
                </template>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <!-- 高級參數 -->
        <Collapsible>
          <CollapsibleTrigger class="flex items-center gap-2 text-sm font-medium">
            <ChevronRight class="w-4 h-4" />
            高級參數設定
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-4 space-y-4">
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- 最大Token數 -->
              <div class="space-y-2">
                <Label class="text-sm">最大Token數</Label>
                <Input 
                  v-model.number="form.max_tokens"
                  type="number"
                  min="50"
                  max="1000"
                  placeholder="200"
                />
              </div>
              
              <!-- 溫度參數 -->
              <div class="space-y-2">
                <Label class="text-sm">創意度 (Temperature)</Label>
                <Input 
                  v-model.number="form.temperature"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  placeholder="0.3"
                />
              </div>
              
              <!-- 超時時間 -->
              <div class="space-y-2">
                <Label class="text-sm">超時時間 (秒)</Label>
                <Input 
                  v-model.number="form.timeout_seconds"
                  type="number"
                  min="10"
                  max="120"
                  placeholder="30"
                />
              </div>
            </div>
            
            <!-- 提示詞模板 -->
            <div class="space-y-2">
              <Label class="text-sm">提示詞模板</Label>
              <Textarea 
                v-model="form.prompt_template"
                placeholder="自定義AI提示詞模板..."
                rows="4"
                class="text-sm"
              />
              <p class="text-xs text-gray-500">
                可使用變數：{{metric_name}}, {{current_value}}, {{threshold_value}}, {{business_context}}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      <!-- 連接測試 -->
      <div v-if="form.ai_enabled" class="pt-4 border-t">
        <div class="flex items-center justify-between">
          <div>
            <Label class="text-sm font-medium">連接測試</Label>
            <p class="text-xs text-gray-600">測試AI提供商連接狀態</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            @click="testConnection"
            :disabled="testConnectionMutation.isPending.value"
          >
            <Loader2 
              v-if="testConnectionMutation.isPending.value" 
              class="w-4 h-4 mr-2 animate-spin" 
            />
            {{ testConnectionMutation.isPending.value ? '測試中...' : '測試連接' }}
          </Button>
        </div>
        
        <!-- 測試結果 -->
        <div v-if="testResult" class="mt-2">
          <Alert :class="{
            'border-green-500 bg-green-50': testResult.success,
            'border-red-500 bg-red-50': !testResult.success
          }">
            <CheckCircle v-if="testResult.success" class="w-4 h-4 text-green-600" />
            <AlertTriangle v-else class="w-4 h-4 text-red-600" />
            <AlertDescription class="text-sm">
              {{ testResult.message }}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </CardContent>
    
    <!-- 動作按鈕 -->
    <CardFooter class="flex justify-between">
      <Button variant="outline" @click="resetForm">
        重設
      </Button>
      <Button 
        @click="saveConfig"
        :disabled="saveConfigMutation.isPending.value"
      >
        <Loader2 
          v-if="saveConfigMutation.isPending.value" 
          class="w-4 h-4 mr-2 animate-spin" 
        />
        {{ saveConfigMutation.isPending.value ? '儲存中...' : '儲存設定' }}
      </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAIConfig } from '@/composables/queries/useDashboardAlerts'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast/use-toast'

// UI組件 imports...
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Bot, Eye, EyeOff, ChevronRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-vue-next'

const { toast } = useToast()
const queryClient = useQueryClient()
const aiConfig = useAIConfig()

// 表單狀態
const form = reactive({
  ai_enabled: false,
  ai_provider: 'openai',
  api_endpoint: 'http://localhost:11434',
  api_key: '',
  model_name: 'gpt-4o',
  max_tokens: 200,
  temperature: 0.3,
  timeout_seconds: 30,
  prompt_template: ''
})

// UI狀態
const showApiKey = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

// 監聽配置加載
watchEffect(() => {
  if (aiConfig.data.value) {
    Object.assign(form, aiConfig.data.value)
  }
})

// 獲取模型預設值
const getModelPlaceholder = () => {
  const placeholders = {
    openai: 'gpt-4o',
    claude: 'claude-3-sonnet-20240229',
    ollama: 'llama3.1'
  }
  return placeholders[form.ai_provider] || '請選擇模型'
}

// 處理AI開關
const handleToggleAI = (enabled: boolean) => {
  if (!enabled) {
    // 關閉AI時清除測試結果
    testResult.value = null
  }
}

// 處理提供商變更
const handleProviderChange = (provider: string) => {
  // 重設相關欄位
  form.model_name = getModelPlaceholder()
  testResult.value = null
  
  if (provider === 'ollama') {
    form.timeout_seconds = 60 // 本地AI可能較慢
  } else {
    form.timeout_seconds = 30
  }
}

// 測試連接
const testConnectionMutation = useMutation({
  mutationFn: async () => {
    const response = await fetch('/api/ai/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ai_provider: form.ai_provider,
        api_endpoint: form.api_endpoint,
        api_key: form.api_key,
        model_name: form.model_name
      })
    })
    
    if (!response.ok) {
      throw new Error('網路請求失敗')
    }
    
    return await response.json()
  },
  onSuccess: (result) => {
    testResult.value = result
    if (result.success) {
      toast({
        title: "連接成功",
        description: "AI提供商連接正常",
      })
    } else {
      toast({
        title: "連接失敗",
        description: result.message,
        variant: "destructive",
      })
    }
  },
  onError: (error) => {
    testResult.value = {
      success: false,
      message: error.message || '連接測試失敗'
    }
  }
})

const testConnection = () => {
  testConnectionMutation.mutate()
}

// 儲存配置
const saveConfigMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await supabase
      .from('ai_config')
      .upsert(form)
      .select()
      .single()
      
    if (error) throw error
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ai-config'] })
    toast({
      title: "設定已儲存",
      description: "AI配置更新成功",
    })
  },
  onError: (error) => {
    toast({
      title: "儲存失敗", 
      description: error.message,
      variant: "destructive",
    })
  }
})

const saveConfig = () => {
  saveConfigMutation.mutate()
}

// 重設表單
const resetForm = () => {
  if (aiConfig.data.value) {
    Object.assign(form, aiConfig.data.value)
  }
  testResult.value = null
  showApiKey.value = false
}
</script>
```

## 實施時程規劃

### Phase 1: 基礎系統建立 (4-6天)

**Day 1-2: 資料庫設計與建立**
- [ ] 建立基礎資料表 (metric_thresholds, dashboard_alerts, ai_config)
- [ ] 建立索引和約束
- [ ] 插入預設閾值配置
- [ ] 建立基礎監控函數

**Day 3-4: 後端API開發**
- [ ] 建立警示查詢API
- [ ] 實現閾值檢測邏輯
- [ ] 建立AI配置管理API
- [ ] 單元測試和整合測試

**Day 5-6: 前端基礎整合**
- [ ] 修改 DashboardExecutiveHealth.vue
- [ ] 建立警示查詢Composables
- [ ] 基礎警示顯示功能
- [ ] 測試基礎警示系統

### Phase 2: AI配置框架 (3-5天)

**Day 1-2: AI Provider系統**
- [ ] 設計AI Provider介面
- [ ] 實現OpenAI Provider
- [ ] 實現Claude Provider
- [ ] 實現Ollama Provider

**Day 3-4: AI配置管理**
- [ ] 建立AI配置管理界面
- [ ] 實現API Key加密存儲
- [ ] 建立連接測試功能
- [ ] AI服務整合層開發

**Day 5: 整合測試**
- [ ] AI配置完整測試
- [ ] 錯誤處理和降級機制
- [ ] 效能和安全測試

### Phase 3: 智能建議整合 (3-4天)

**Day 1-2: AI建議生成**
- [ ] 實現AI建議生成邏輯
- [ ] 建立業務情境快照
- [ ] 實現建議信心度評估
- [ ] 成本估算和監控

**Day 3-4: 前端AI增強**
- [ ] 前端AI建議顯示
- [ ] 條件性渲染邏輯
- [ ] AI狀態指示器
- [ ] 建議品質反饋機制

### Phase 4: 測試與優化 (2-3天)

**Day 1: 系統整合測試**
- [ ] 完整功能測試
- [ ] 效能壓力測試
- [ ] 安全漏洞檢查
- [ ] 多場景測試

**Day 2: 文件與部署**
- [ ] 技術文件撰寫
- [ ] 使用者手冊編寫  
- [ ] 部署腳本準備
- [ ] 監控告警設定

**Day 3: 上線與監控**
- [ ] 生產環境部署
- [ ] 監控數據收集
- [ ] 使用者反饋收集
- [ ] 系統效能調優

## Phase 1.5: 三區塊整合分析與實施方案

### 實施完成狀態 (✅ 已完成)

#### 完成日期：2025-08-06

#### 最終實施結果

**前端整合 (DashboardExecutiveHealth.vue)**
- ✅ 新增 `useUnifiedDashboardContent()` 和 `useRefreshAllAlerts()` composables
- ✅ 統一三個區塊的資料來源：風險預警、業務洞察、戰略建議
- ✅ 移除前端 hardcoded 邏輯，改用後端統合API
- ✅ 統一loading和error狀態處理
- ✅ 保持向下相容性，舊系統作為備用

**後端統合系統 (SQL Functions)**
- ✅ `generate_business_insights()` - 豐富的業務洞察生成，包含詳細描述和行動建議
- ✅ `generate_strategic_recommendations()` - 智能戰略建議，基於實際警示狀況生成具體可行的建議
- ✅ `get_unified_dashboard_content()` - 統合三區塊內容，一次API調用獲取所有資料
- ✅ `refresh_all_alerts_and_insights()` - 全面刷新機制，包含警示檢查和內容更新

**資料品質改善**
- ✅ 修復業務洞察內容過少問題，現在包含詳細分析和具體行動項目
- ✅ 修復戰略建議過於簡單問題，現在提供完整的執行計劃和時間軸
- ✅ 基於實際警示數據生成情境化建議，不再是通用模板
- ✅ 加入信心度評估和業務影響分析

**內容格式優化 (2025-08-06 修復完成)**
- ✅ 修復建議內容冗長問題，移除1/2/3/4列點格式
- ✅ 採用簡潔描述格式，與風險預警中心保持一致
- ✅ 優化內容可讀性，提升用戶體驗
- ✅ 應用 `20250806105000_fix_concise_recommendations.sql` 遷移

**技術實現亮點**
- 🎯 **智能內容生成**：根據實際業務狀況動態生成洞察和建議
- 🔄 **統一資料流**：三區塊統一從 `get_unified_dashboard_content()` 獲取資料
- 📊 **豐富資訊**：每個洞察包含影響等級、信心度、行動項目
- ⚡ **效能優化**：單一API調用代替多次查詢
- 🛡️ **向下相容**：保留舊系統作為fallback機制
- 📝 **簡潔格式**：內容格式統一，易於閱讀

**當前系統輸出範例**

*業務洞察示例：*
- 標題：「發現多項關鍵業務風險」
- 描述：「系統檢測到4項嚴重警示，需要立即制定應對策略以避免業務影響。」
- 行動項目：[「召開緊急會議」, 「制定應對計劃」, 「分析根本原因」, ...]
- 信心度：90%

*戰略建議示例：*
- 標題：「啟動客戶流失預防計劃」  
- 描述：「當前客戶流失率81.25%，建議立即檢討客戶滿意度並啟動挽回計劃。」
- 時間軸：「緊急（2-4週）」
- 優先級：95（營收保護）

*格式對比：*
- **修復前**：「建議：1)增加客服人力 2)優化工作流程 3)建立常見問題模板」
- **修復後**：「當前平均回應時間超標，建議增加客服人力並優化工作流程。」

### 技術調整記錄

#### 資料庫函數調整

**1. 內容格式優化修復 (2025-08-06)**
```sql
-- Migration: 20250806105000_fix_concise_recommendations.sql
-- 問題：用戶反饋建議內容格式冗長，使用列點1/2/3/4格式不易閱讀
-- 解決：修改建議和洞察生成函數，採用簡潔描述格式

-- 修復項目：
- generate_strategic_recommendations() 函數：移除列點格式，使用簡潔描述
- generate_business_insights() 函數：移除冗長列表，採用整句描述
- 格式統一：與風險預警中心的簡潔格式保持一致
- 用戶體驗：提升內容可讀性和專業感

-- 格式範例：
-- 修復前："建議：1)增加客服人力 2)優化工作流程 3)建立常見問題模板"
-- 修復後："當前平均回應時間超標，建議增加客服人力並優化工作流程。"
```

**2. 修復 `generate_business_insights()` 函數**
```sql
-- 問題：原函數只返回簡單的測試資料
-- 解決：重寫函數邏輯，基於實際警示狀況生成豐富洞察

-- 新增功能：
- 根據critical警示數量生成風險洞察
- 分析業務動能和客戶成長趨勢
- 提供詳細描述和具體行動項目
- 加入信心度評估 (0.70-0.90)
- 支援多種洞察類型：risk_insight, trend_insight, customer_insight
```

**2. 修復 `generate_strategic_recommendations()` 函數**
```sql
-- 問題：返回類型不匹配和內容過於簡化
-- 解決：重寫函數結構，提供完整的戰略建議

-- 新增功能：
- 基於具體警示類型生成對應建議
- 包含詳細執行計劃和時間軸
- 優先級評分系統 (60-100)
- 影響等級和執行難度評估
- business_context 包含具體業務數據
```

**3. 更新 `get_unified_dashboard_content()` 函數**
```sql
-- 調整：使用修復後的生成函數
-- 優化：排序邏輯和資料限制
- alerts: 按嚴重程度和時間排序，限制10筆
- insights: 按影響等級和信心度排序，限制5筆  
- recommendations: 按優先級排序，限制5筆
```

#### 前端整合調整

**1. useBusinessHealthQueries.ts 更新**
```typescript
// 新增函數：
- useUnifiedDashboardContent() - 統合三區塊資料
- useRefreshAllAlerts() - 全面刷新機制

// Query Keys 新增：
- unifiedContent() - 統合內容查詢鍵
- refreshAlerts() - 刷新警示查詢鍵
```

**2. DashboardExecutiveHealth.vue 重構**
```vue
<!-- 主要變更： -->
- 三個區塊統一使用 unifiedContentQuery
- 移除舊的 helper functions (getMetricCategory, generateRecommendationFromAlert)
- 統一loading和error狀態檢查
- 保留向下相容性，舊資料作為fallback

<!-- 計算屬性調整： -->
- criticalAlerts: 直接使用統合API資料
- keyInsights: 支援新的洞察格式，包含actions陣列
- businessRecommendations: 使用統合API建議，包含timeline資訊
```

#### 資料品質問題修復

**修復前的問題：**
- 業務洞察只有標題，無詳細描述
- 戰略建議內容過於簡單，缺乏可執行性  
- 沒有基於實際業務狀況的情境化內容

**修復後的改善：**
- 洞察包含完整分析和4-6個具體行動項目
- 建議包含詳細執行計劃和預期時間軸
- 基於實際警示數據動態生成內容
- 加入信心度、影響評估、優先級評分

#### API調用優化

**調用次數優化：**
- 修復前：3次獨立API調用 (alerts, insights, recommendations)
- 修復後：1次統合API調用 (get_unified_dashboard_content)
- 效能提升：減少67%的資料庫查詢次數

**資料一致性：**
- 統一時間戳：所有資料使用同一個 last_updated 時間
- 關聯性保證：建議和洞察都基於相同的警示快照生成
- 快取策略：統一的2分鐘快取時間

## Phase 1.5: 三區塊整合分析與實施方案（歷史記錄）

### 現狀分析

經過深入分析 DashboardExecutiveHealth.vue 中的三個關鍵區塊，發現以下實施狀態：

#### 1. 風險預警中心 (criticalAlerts)
- **狀態**: ✅ 已完成 Phase 1 整合
- **實作**: 使用新的 dashboard_alerts 系統，基於 threshold_breach 類型
- **資料來源**: `useDashboardAlerts()` composable
- **警示類型**: 支援 critical、warning、info 等級
- **內容生成**: SQL 函數自動生成標題和訊息

#### 2. 關鍵業務洞察 (keyInsights)
- **狀態**: ❌ 仍使用舊系統
- **實作**: 依賴 `businessHealthQuery.data.value?.insights` 
- **資料來源**: 舊的 `business_health_metrics` 表
- **問題**: 與新警示系統分離，缺乏統一的業務邏輯

#### 3. 戰略行動建議 (businessRecommendations)
- **狀態**: ⚠️ 部分整合
- **實作**: 基於 dashboard_alerts 動態生成建議
- **邏輯**: 前端根據警示類型生成對應建議
- **問題**: 建議邏輯hardcode在前端，缺乏靈活性

### 整合改進方案

#### 方案A: 漸進式整合 (推薦)
**時間**: 2-3天  
**風險**: 低  
**影響**: 中等

1. **保留現有架構**，逐步擴展 dashboard_alerts 支援更多警示類型
2. **新增警示類型**:
   - `trend_analysis`: 趋势分析洞察
   - `anomaly_detection`: 異常檢測洞察  
   - `business_insight`: 業務洞察
   - `strategic_recommendation`: 戰略建議

3. **統一內容生成**:
   - 擴展 `generate_alert_content()` 函數
   - 支援不同類型的內容模板
   - 後端統一生成所有警示和建議內容

#### 方案B: 完全重構 (高風險)
**時間**: 5-7天  
**風險**: 高  
**影響**: 大

完全移除舊的 business_health_metrics 系統，統一到新的警示框架。

### 實施計劃 (方案A)

#### Step 1: 擴展警示類型支援 (1天)
```sql
-- 新增警示類型到 metric_thresholds
INSERT INTO metric_thresholds (metric_name, display_name, alert_type, ...) VALUES
('business_trend_momentum', '業務動能趨勢', 'trend_analysis', ...),
('customer_satisfaction_trend', '客戶滿意度趨勢', 'trend_analysis', ...),
('revenue_anomaly', '營收異常檢測', 'anomaly_detection', ...);

-- 擴展警示內容生成函數
CREATE OR REPLACE FUNCTION generate_insight_content(
    insight_type VARCHAR(50),
    data_context JSONB
) RETURNS TABLE (title VARCHAR(200), message TEXT);
```

#### Step 2: 前端整合優化 (1天)
```vue
// 統一三個區塊的資料來源
const unifiedAlerts = computed(() => {
  const alerts = dashboardAlertsQuery.data.value || []
  return {
    risks: alerts.filter(a => a.alert_type === 'threshold_breach'),
    insights: alerts.filter(a => a.alert_type === 'trend_analysis'),
    recommendations: alerts.filter(a => a.alert_type === 'strategic_recommendation')
  }
})
```

#### Step 3: 內容邏輯後端化 (1天)
- 將前端 hardcode 的建議邏輯移至後端
- 建立統一的內容模板系統
- 支援情境感知的動態內容生成

### 技術細節

#### 資料庫更新
```sql
-- 擴展 dashboard_alerts 表支援新類型
ALTER TABLE dashboard_alerts ADD COLUMN IF NOT EXISTS insight_category VARCHAR(50);
ALTER TABLE dashboard_alerts ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE dashboard_alerts ADD COLUMN IF NOT EXISTS trend_direction VARCHAR(20);

-- 新增內容模板表
CREATE TABLE alert_content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 前端組件優化
```vue
<!-- 統一警示組件 -->
<UnifiedAlertCard 
  :alerts="unifiedAlerts.risks" 
  type="risk"
  title="風險預警中心" />
  
<UnifiedAlertCard 
  :alerts="unifiedAlerts.insights" 
  type="insight"
  title="關鍵業務洞察" />
  
<UnifiedAlertCard 
  :alerts="unifiedAlerts.recommendations" 
  type="recommendation"
  title="戰略行動建議" />
```

### 預期效益

1. **統一性**: 三個區塊使用相同的資料結構和API
2. **可維護性**: 內容邏輯集中在後端，易於修改和測試
3. **擴展性**: 新增警示類型無需修改前端代碼
4. **一致性**: 所有警示和建議的格式和品質保持一致
5. **AI就緒**: 為Phase 2的AI增強奠定基礎

### 風險評估

- **低風險**: 不破壞現有功能
- **向下兼容**: 舊的查詢邏輯繼續有效
- **漸進遷移**: 可以逐步替換舊邏輯
- **回退機制**: 任何問題都可以快速回退

## 預期成果與效益

### 技術效益
1. **系統化警示**：從假資料到真實業務監控
2. **智能化建議**：AI驅動的決策支援
3. **可擴展架構**：支援未來更多AI功能
4. **安全性提升**：API Key加密和權限控制

### 業務效益  
1. **提升決策效率**：管理層快速掌握業務異常
2. **降低風險損失**：及早發現並處理業務問題
3. **優化運營流程**：基於數據的流程改善建議
4. **成本控制**：AI使用成本監控和優化

### 用戶體驗提升
1. **直觀的警示展示**：清晰的嚴重程度標示
2. **智能建議**：具體可執行的改善方案
3. **配置彈性**：管理員可自由選擇AI提供商
4. **降級保護**：AI失效時系統正常運作

## 🔍 監控與維護

### 系統監控指標
```sql
-- 監控查詢：警示生成統計
SELECT 
  severity,
  COUNT(*) as alert_count,
  COUNT(*) FILTER (WHERE ai_suggestion IS NOT NULL) as ai_enhanced_count,
  AVG(ai_confidence) as avg_confidence
FROM dashboard_alerts 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY severity;

-- 監控查詢：AI使用成本
SELECT 
  ai_provider,
  COUNT(*) as usage_count,
  AVG(ai_confidence) as avg_confidence,
  DATE(created_at) as usage_date
FROM dashboard_alerts 
WHERE ai_suggestion IS NOT NULL 
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ai_provider, DATE(created_at)
ORDER BY usage_date DESC;
```

### 定期維護任務
1. **每日**：清理過期警示、檢查AI服務狀態
2. **每週**：分析警示模式、調整閾值參數
3. **每月**：評估AI建議品質、成本分析報告
4. **每季**：系統效能評估、用戶滿意度調查

---

## 結語

本規劃文件提供了完整的AI增強漸進式警示系統技術規格，確保系統能夠：

1. **獨立運作**：基礎警示功能不依賴AI
2. **彈性配置**：支援多種AI提供商和參數調整
3. **安全可靠**：API Key加密、錯誤降級處理
4. **可維護性**：清晰的架構設計和監控機制

透過階段性實施，系統將從基礎警示逐步升級為智能化決策支援平台，為電商業務提供更精準、可行的管理洞察。

---

## 實施進度更新記錄

### 2025-08-07 Phase 2 完成
- ✅ **AI Provider 系統**: 多提供商支援架構全面完成
- ✅ **資料庫重構**: 成功解決 migration 順序和相容性衝突問題  
- ✅ **服務層實現**: AIProviderService 提供完整 CRUD 和智能選擇功能
- ✅ **核心函數**: select_optimal_ai_provider, check_ai_provider_health 等函數正常運作
- ✅ **測試驗證**: 自動化測試覆蓋率達 73%，核心功能穩定可靠
- ✅ **相容性保證**: 透過 ai_config 視圖確保 Phase 1 警示系統完全不受影響
- 🚀 **Phase 3 準備**: 外部 AI 服務串接的技術基礎已經就緒

### 技術債務解決
1. **Migration 順序問題**: 修復資料庫狀態與 migration 檔案不一致的問題
2. **函數定義錯誤**: 解決參數名稱衝突和類型不匹配問題  
3. **TypeScript 類型安全**: 完整的類型定義和編譯時檢查
4. **測試框架**: 建立全面的自動化測試套件

### 2025-08-06 Phase 1 初始實施
- ✅ **基礎警示系統**: 閾值監控和自動觸發機制建立
- ✅ **前端整合**: DashboardExecutiveHealth.vue 三區塊統一顯示
- ✅ **資料庫架構**: metric_thresholds、dashboard_alerts 基礎結構

**專案狀態**: Phase 2 圓滿完成，Phase 3 外部 AI 服務整合準備中
**技術文件**: 詳細實施報告請參考 `AI_PROVIDER_PHASE2_IMPLEMENTATION_SUMMARY.md`