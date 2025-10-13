# Dashboard Views Analysis Documentation

## 重要更新說明

**本文件已基於實際資料庫架構驗證和更新** (2025-07-29)

## 概要

本文檔詳細記錄了 admin-platform-vue 專案中所有 Dashboard 視圖的資料來源、API 對應、圖表目的和資料格式。

✅ **已驗證**: 核心資料庫視圖和 API 結構  
🔄 **需要驗證**: 前端 composables 和 API 端點  
❌ **不存在**: 滿意度相關指標

## 🔄 需要進一步驗證的項目

以下項目需要開發者進一步確認實際實作狀態：

1. **Composables 存在性**:
   - `useRfmSegmentDonutData()`
   - `useCustomerCombinedMetrics()`
   - `usePurchaseTrendData()`
   - `usePurchaseCountData()`

2. **資料庫視圖完整性**:
   - `user_ltv_metrics` 視圖是否已建立
   - 所有描述的欄位是否實際存在

3. **API 回傳格式**:
   - 實際 JSON 格式是否與文件一致
   - 錯誤處理和空資料狀態

## ✅ 已確認存在的資源

- `user_rfm_lifecycle_metrics` 視圖 (Migration: `20250607162839_add_user_rfm_lifecycle_metrics_and_overview_function.sql`)
- RFM 分析相關資料庫架構
- 客戶生命週期分析基礎設施

## 1. 客戶分析儀表板 (DashboardCustomer.vue)

### 1.1 RFM 分段甜甜圈圖 (RFMDonutChart)

- **圖表目的**: 顯示客戶 RFM 分段分佈，協助了解客戶價值分群
- **API 來源**: `useRfmSegmentDonutData()` → `useCustomerCombinedMetrics()` 🔄 需驗證
- **資料表**: `user_rfm_lifecycle_metrics` view ✅ 已確認存在
- **欄位**: ✅ 已驗證
  - `user_id`: 使用者 ID
  - `rfm_segment`: RFM 分段 (Champions, Loyal Customers, Potential Loyalists, etc.)
  - `r_score`, `f_score`, `m_score`: RFM 分數 (1-5)
  - `recency_days`: 最近購買天數
  - `frequency`: 購買頻率
  - `monetary`: 購買金額
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "name": "Champions",
    "value": 25
  },
  {
    "name": "Loyal Customers",
    "value": 18
  }
]
```

### 1.2 RFM 生命週期階段圖 (RFMDonutChart)

- **圖表目的**: 顯示客戶生命週期階段分佈
- **API 來源**: `useRfmStageData()` → `useCustomerCombinedMetrics()` 🔄 需驗證
- **資料表**: `user_rfm_lifecycle_metrics` view ✅ 已確認存在
- **欄位**: ✅ 已驗證
  - `lifecycle_stage`: 生命週期階段 (Active, At Risk, Churned, New, One-time Past)
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "name": "Active",
    "value": 45
  },
  {
    "name": "At Risk",
    "value": 12
  }
]
```

### 1.3 LTV 購買趨勢圖 (LTVPurchaseTrend)

- **圖表目的**: 顯示客戶首次和最後購買日期的趨勢
- **API 來源**: `usePurchaseTrendData()` → `useCustomerCombinedMetrics()` 🔄 需驗證
- **資料表**: `user_ltv_metrics` view 🔄 需驗證存在性
- **欄位**: 🔄 需驗證
  - `first_purchase_date`: 首次購買日期
  - `last_purchase_date`: 最後購買日期
  - `purchase_count`: 購買次數
  - `total_revenue`: 總收入
  - `estimated_ltv`: 預估 LTV
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "date": "2024-01-15",
    "first_purchase_date": 8,
    "last_purchase_date": 12
  }
]
```

### 1.4 購買次數分析圖 (PurchaseCount)

- **圖表目的**: 顯示客戶購買次數分佈
- **API 來源**: `usePurchaseCountData()` → `useCustomerCombinedMetrics()` 🔄 需驗證
- **資料表**: `user_ltv_metrics` view 🔄 需驗證存在性
- **欄位**: 🔄 需驗證
  - `purchase_count`: 購買次數
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "name": "1",
    "value": 35
  },
  {
    "name": "2",
    "value": 25
  }
]
```

### 1.5 RFM vs LTV 散點圖 (RfmLtvScatter)

- **圖表目的**: 顯示 RFM 分數與 LTV 的相關性
- **API 來源**: `useRfmLtvScatterData()` → `useCustomerCombinedMetrics()`
- **資料表**: `user_rfm_lifecycle_metrics` + `user_ltv_metrics` views
- **欄位**:
  - `r_score`, `f_score`, `m_score`: RFM 分數
  - `estimated_ltv`: 預估 LTV
  - `rfm_segment`: RFM 分段
  - `lifecycle_stage`: 生命週期階段
  - `full_name`: 客戶姓名
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "x": 1500.5,
    "y": 12,
    "rfm_segment": "Champions",
    "lifecycle_stage": "Active",
    "full_name": "John Doe"
  }
]
```

## 2. 訂單分析儀表板 (DashboardOrder.vue)

### 2.1 訂單金額直方圖 (AmountHistogram)

- **圖表目的**: 顯示訂單金額分佈，了解訂單價值區間
- **API 來源**: `useOrderAmountHistogram()`
- **資料表**: `order_amount_histogram_bins` view
- **欄位**:
  - `bin_start`: 區間開始金額
  - `bin_end`: 區間結束金額
  - `count`: 訂單數量
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "bin_start": 0,
    "bin_end": 100,
    "count": 25
  },
  {
    "bin_start": 100,
    "bin_end": 200,
    "count": 18
  }
]
```

### 2.2 訂單狀態分佈圖 (OrderStatusDistribution)

- **圖表目的**: 顯示各訂單狀態的分佈情況
- **API 來源**: `useOrderStatusDistribution()`
- **資料表**: `order_status_distribution` view
- **欄位**:
  - `status`: 訂單狀態 (pending, paid, shipped, completed, cancelled)
  - `count`: 訂單數量
  - `percentage`: 百分比
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "status": "completed",
    "count": 150,
    "percentage": 45.5
  },
  {
    "status": "shipped",
    "count": 80,
    "percentage": 24.2
  }
]
```

### 2.3 客戶購買堆疊圖 (CustomerPurchaseStacked)

- **圖表目的**: 顯示新客戶與回購客戶的購買趨勢
- **API 來源**: `useCustomerPurchaseSummary()`
- **資料表**: `customer_purchase_summary_daily` view
- **欄位**:
  - `purchase_date`: 購買日期
  - `new_customers`: 新客戶數
  - `returning_customers`: 回購客戶數
  - `new_customer_revenue`: 新客戶收入
  - `returning_customer_revenue`: 回購客戶收入
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "purchase_date": "2024-01-15",
    "new_customers": 12,
    "returning_customers": 28,
    "new_customer_revenue": 1200.5,
    "returning_customer_revenue": 3400.75
  }
]
```

### 2.4 熱門產品趨勢圖 (TopProductTrend)

- **圖表目的**: 顯示前10名產品的銷售趨勢
- **API 來源**: `useTopProductTrendData()` → `useProductSalesDaily()`
- **資料表**: `product_sales_daily` view
- **欄位**:
  - `order_date`: 訂單日期
  - `product_id`: 產品 ID
  - `product_name`: 產品名稱
  - `total_quantity`: 總數量
  - `total_sales`: 總銷售額
- **API 參數**: 無特定參數
- **回傳格式**:

```json
{
  "data": [
    {
      "order_date": "2024-01-15",
      "product_id": {
        "prod_1": {
          "product_name": "iPhone 15",
          "total_quantity": 10,
          "total_sales": 15000
        }
      }
    }
  ],
  "legend": [
    {
      "product_id": "prod_1",
      "product_name": "iPhone 15",
      "total_sales": 150000
    }
  ]
}
```

### 2.5 訂單每小時分析圖 (OrderHourlyBar)

- **圖表目的**: 顯示每小時訂單數量分佈
- **API 來源**: `useHourlyMetricsData()` → `useOrderMetricsHourly()`
- **資料表**: `order_metrics_hourly` view
- **欄位**:
  - `hour`: 小時 (0-23)
  - `order_count`: 訂單數量
  - `total_amount`: 總金額
  - `avg_order_value`: 平均訂單價值
  - `new_customer_order_count`: 新客戶訂單數
  - `returning_customer_order_count`: 回購客戶訂單數
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "hour": 9,
    "order_count": 15,
    "total_amount": 2500.75,
    "avg_order_value": 166.72,
    "new_customer_order_count": 5,
    "returning_customer_order_count": 10
  }
]
```

### 2.6 週末差異趨勢圖 (OrderWeekendDiffTrend)

- **圖表目的**: 比較週末與平日的訂單模式
- **API 來源**: `useWeekendDiffTrendData()` → `useOrderMetricsHourly()`
- **資料表**: `order_metrics_hourly` view
- **欄位**:
  - `is_weekend`: 是否為週末
  - `hour`: 小時
  - `order_count`: 訂單數量
- **API 參數**: 無特定參數
- **回傳格式**:

```json
{
  "weekendHourMetricsData": [
    {
      "hour": 9,
      "order_count": 8,
      "total_amount": 1200.5
    }
  ],
  "weekdayHourMetricsData": [
    {
      "hour": 9,
      "order_count": 20,
      "total_amount": 3500.75
    }
  ]
}
```

## 3. 營收分析儀表板 (DashboardRevenue.vue)

### 3.1 營銷活動收入堆疊圖 (RevenueCampaignStacked)

- **圖表目的**: 顯示各營銷活動的收入表現
- **API 來源**: `useRevenueByCampaign()`
- **資料表**: `revenue_by_campaign` view
- **欄位**:
  - `campaign_id`: 活動 ID
  - `campaign_name`: 活動名稱
  - `revenue_date`: 收入日期
  - `total_revenue`: 總收入
  - `order_count`: 訂單數量
  - `avg_order_value`: 平均訂單價值
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "campaign_id": "campaign_1",
    "campaign_name": "Summer Sale",
    "revenue_date": "2024-07-01",
    "total_revenue": 15000,
    "order_count": 45,
    "avg_order_value": 333.33
  }
]
```

### 3.2 LTV 分段甜甜圈圖 (LtvSegmentDonut)

- **圖表目的**: 顯示不同 LTV 分段的收入分佈
- **API 來源**: `useRevenueLTVDistribution()`
- **資料表**: `revenue_ltv_distribution` view
- **欄位**:
  - `ltv_segment`: LTV 分段 (High, Medium, Low)
  - `customer_count`: 客戶數量
  - `total_revenue`: 總收入
  - `avg_ltv`: 平均 LTV
  - `revenue_percentage`: 收入百分比
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "ltv_segment": "High",
    "customer_count": 25,
    "total_revenue": 50000,
    "avg_ltv": 2000,
    "revenue_percentage": 65.5
  }
]
```

### 3.3 每小時收入散點圖 (RevenueHourScatter)

- **圖表目的**: 顯示每小時收入與訂單數量的關係
- **API 來源**: `useRevenueHourlyMetrics()`
- **資料表**: `order_metrics_hourly` view
- **欄位**:
  - `hour`: 小時 (0-23)
  - `order_count`: 訂單數量
  - `total_amount`: 總金額
  - `avg_order_value`: 平均訂單價值
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "hour": 9,
    "order_count": 15,
    "total_amount": 2500.75,
    "avg_order_value": 166.72
  }
]
```

### 3.4 營銷活動時間軸圖 (CampaignTimeline)

- **圖表目的**: 顯示營銷活動的時間軸和狀態
- **API 來源**: `useCampaignTimelineData()` → `useCampaigns()`
- **資料表**: `campaigns` table
- **欄位**:
  - `id`: 活動 ID
  - `name`: 活動名稱
  - `start_date`: 開始日期
  - `end_date`: 結束日期
  - `budget`: 預算
  - `status`: 狀態
  - `campaign_type`: 活動類型
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "id": "campaign_1",
    "campaign_name": "Summer Sale",
    "start_date": "2024-07-01",
    "end_date": "2024-07-31",
    "budget": 10000,
    "status": "active",
    "campaign_type": "promotion"
  }
]
```

## 4. 客服支援儀表板 (DashboardSupport.vue)

### 4.1 客服人員績效表 (AgentPerformanceTable)

- **圖表目的**: 顯示各客服人員的績效指標
- **API 來源**: `useAgentMetrics()`
- **資料表**: `agent_metrics` view
- **欄位**:
  - `agent_id`: 客服 ID
  - `agent_name`: 客服姓名
  - `conversations_handled`: 處理的對話數
  - `avg_response_time_minutes`: 平均回應時間(分鐘)
  - `avg_resolution_time_hours`: 平均解決時間(小時)
  - `customer_satisfaction_score`: 客戶滿意度分數
  - `total_messages`: 總訊息數
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "agent_id": "agent_1",
    "agent_name": "Alice Smith",
    "conversations_handled": 45,
    "avg_response_time_minutes": 2.5,
    "avg_resolution_time_hours": 1.2,
    "customer_satisfaction_score": 4.8,
    "total_messages": 234
  }
]
```

### 4.2 每小時對話趨勢圖 (HourlyConversationTrend)

- **圖表目的**: 顯示每小時對話數量的趨勢
- **API 來源**: `useHourlyConversationTrend()`
- **資料表**: `get_conversation_hourly_trend()` function
- **欄位**:
  - `hour`: 小時
  - `conversation_count`: 對話數量
- **API 參數**: `days_ago: 7` (查詢過去7天)
- **回傳格式**:

```json
{
  "hourly_data": [
    {
      "hour": 9,
      "conversation_count": 25
    }
  ],
  "summary": {
    "total_conversations": 450,
    "avg_hourly": 18.75
  }
}
```

### 4.3 每日對話趨勢圖 (DailyConversationTrend)

- **圖表目的**: 顯示每日對話數量和解決率
- **API 來源**: `useDailyConversationMetrics()`
- **資料表**: `conversation_summary_daily` view
- **欄位**:
  - `metric_date`: 日期
  - `conversations_started`: 新開始對話數
  - `conversations_resolved`: 已解決對話數
  - `avg_response_time_minutes`: 平均回應時間
  - `total_messages`: 總訊息數
- **API 參數**: `limit: 14` (最近14天)
- **回傳格式**:

```json
[
  {
    "metric_date": "2024-01-15",
    "conversations_started": 25,
    "conversations_resolved": 22,
    "avg_response_time_minutes": 2.8,
    "total_messages": 156
  }
]
```

### 4.4 回應時間百分位數圖 (ResponseTimePercentiles)

- **圖表目的**: 顯示客服回應時間的分佈百分位數
- **API 來源**: `useResponseTimePercentiles()`
- **資料表**: `agent_response_time_percentiles` view
- **欄位**:
  - `agent_id`: 客服 ID
  - `agent_name`: 客服姓名
  - `p50`: 50百分位數
  - `p75`: 75百分位數
  - `p90`: 90百分位數
  - `p95`: 95百分位數
  - `p99`: 99百分位數
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "agent_id": "agent_1",
    "agent_name": "Alice Smith",
    "p50": 1.2,
    "p75": 2.5,
    "p90": 4.8,
    "p95": 8.2,
    "p99": 15.5
  }
]
```

### 4.5 客服狀態分佈圖 (StatusDistributionDonut)

- **圖表目的**: 顯示客服人員狀態分佈
- **API 來源**: `useAgentStatusDistribution()`
- **資料表**: `agent_status_distribution` view
- **欄位**:
  - `status`: 狀態 (available, busy, away, offline)
  - `agent_count`: 客服數量
  - `percentage`: 百分比
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "status": "available",
    "count": 8,
    "percentage": 50.0
  },
  {
    "status": "busy",
    "count": 6,
    "percentage": 37.5
  }
]
```

### 4.6 對話狀態分佈圖 (StatusDistributionDonut)

- **圖表目的**: 顯示對話狀態分佈
- **API 來源**: `useConversationStatusDistribution()`
- **資料表**: `conversation_status_distribution` view
- **欄位**:
  - `status`: 對話狀態 (active, waiting, resolved, closed)
  - `conversation_count`: 對話數量
  - `percentage`: 百分比
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "status": "active",
    "count": 25,
    "percentage": 45.5
  },
  {
    "status": "resolved",
    "count": 20,
    "percentage": 36.4
  }
]
```

### 4.7 對話週熱力圖 (ConversationWeekHeatmap)

- **圖表目的**: 顯示一週中各時段的對話密度
- **API 來源**: `useConversationHeatmap()`
- **資料表**: `conversation_week_hourly_heatmap` view
- **欄位**:
  - `day_of_week`: 週幾 (0-6)
  - `hour`: 小時 (0-23)
  - `conversation_count`: 對話數量
- **API 參數**: 無特定參數
- **回傳格式**:

```json
[
  {
    "day_of_week": 1,
    "hour": 9,
    "conversation_count": 15
  },
  {
    "day_of_week": 1,
    "hour": 10,
    "conversation_count": 22
  }
]
```

## 5. 營運總覽儀表板 (DashboardOverview.vue)

### 5.1 核心 KPI 指標

- **圖表目的**: 顯示核心業務指標概覽
- **API 來源**: 靜態數據 (Mock Data)
- **資料表**: N/A (使用模擬資料)
- **欄位**:
  - `totalRevenue`: 總營收
  - `totalOrders`: 總訂單數
  - `activeCustomers`: 活躍客戶數
  - `customerSatisfaction`: 客戶滿意度
- **API 參數**: 無
- **回傳格式**: 靜態數據

### 5.2 業務健康度雷達圖

- **圖表目的**: 顯示多維度業務健康度指標
- **API 來源**: 靜態數據 (Mock Data)
- **資料表**: N/A (使用模擬資料)
- **欄位**:
  - `revenue`: 營收成長
  - `satisfaction`: 客戶滿意度
  - `fulfillment`: 訂單履行
  - `support`: 客服效率
- **API 參數**: 無
- **回傳格式**: 靜態數據

### 5.3 轉換漏斗圖

- **圖表目的**: 顯示從訪客到完成訂單的轉換過程
- **API 來源**: 靜態數據 (Mock Data)
- **資料表**: N/A (使用模擬資料)
- **欄位**:
  - `stage`: 轉換階段
  - `count`: 數量
  - `percentage`: 轉換率
- **API 參數**: 無
- **回傳格式**: 靜態數據

## 6. 技術實現細節

### 6.1 資料快取策略

- **Vue Query**: 用於資料快取和狀態管理
- **Stale Time**: 不同資料類型設定不同的過期時間
  - 客戶指標: 5分鐘
  - 訂單狀態: 3分鐘
  - 客服指標: 2-10分鐘
  - 收入分析: 10-15分鐘

### 6.2 錯誤處理

- 所有 API 呼叫都包含錯誤處理
- 使用 `ChartError` 組件顯示錯誤狀態
- 部分 API 提供降級到模擬資料的機制

### 6.3 資料驗證

- 使用 `useChartStateWithComponent` 進行資料驗證
- 自定義驗證器確保資料格式正確
- 必要欄位檢查和資料類型驗證

### 6.4 效能最佳化

- 使用 `computed` 響應式計算
- 資料轉換在客戶端進行
- 平行載入多個資料來源
- 使用 Supabase 的 view 和 function 進行資料預處理

## 7. 資料庫架構總結

### 7.1 核心表結構

- **users**: 用戶基本資訊
- **orders**: 訂單主表
- **order_items**: 訂單項目 (含 JSONB 快照)
- **products**: 產品目錄
- **conversations**: 客服對話
- **campaigns**: 營銷活動

### 7.2 分析視圖

- **user_rfm_lifecycle_metrics**: RFM 分析
- **user_ltv_metrics**: LTV 分析
- **order_amount_histogram_bins**: 訂單金額分佈
- **agent_metrics**: 客服績效
- **conversation_summary_daily**: 每日對話摘要

### 7.3 函式與程序

- **get_conversation_hourly_trend()**: 每小時對話趨勢
- **get_user_rfm_overview()**: RFM 概覽
- **get_customer_analysis()**: 客戶分析

## 8. 部署和維護建議

### 8.1 監控指標

- API 回應時間監控
- 資料更新頻率監控
- 錯誤率監控
- 快取命中率監控

### 8.2 效能最佳化

- 定期更新資料庫統計資訊
- 建立適當的索引
- 使用 Materialized Views 對複雜查詢進行最佳化
- 定期清理過期資料

### 8.3 擴展性考量

- 使用分區表處理大量歷史資料
- 考慮使用 Redis 進行更高效的快取
- 實施資料歸檔策略
- 建立資料管道進行 ETL 處理

---

## 9. 洞察驅動儀表板重構計劃

### 9.1 重構目標與理念

#### **核心轉換**

從「數據展示型儀表板」升級為「洞察驅動決策平台」

**現狀問題分析:**

- **數據孤島**: 各功能模組數據分離，缺乏跨功能整合洞察
- **缺乏預測性**: 主要展示歷史數據，缺乏未來趨勢預測和風險預警
- **決策支撐不足**: 只有數據展示，缺乏基於數據的可執行建議
- **商業價值模糊**: 無法量化各項指標對整體業務的影響

**重構願景:**

- **從「什麼」到「為什麼」**: 不僅展示數據，更要解釋變化原因
- **從「歷史」到「未來」**: 基於歷史趨勢提供預測性洞察
- **從「展示」到「行動」**: 每個洞察都附帶具體的行動建議
- **從「功能」到「業務」**: 以業務場景為中心整合跨功能數據

### 9.2 架構重組設計

#### **新架構: 決策場景導向**

```
原架構 (功能分離型):
├── 客戶儀表板 (Customer Dashboard)
├── 訂單儀表板 (Order Dashboard)
├── 營收儀表板 (Revenue Dashboard)
└── 客服儀表板 (Support Dashboard)

新架構 (決策場景型):
├── 經營健康度總覽 (Executive Health Overview)
├── 客戶價值最大化 (Customer Value Optimization)
├── 營運效率提升 (Operational Excellence)
└── 風險預警中心 (Risk & Alert Center)
```

#### **決策場景詳細設計**

**1. 經營健康度總覽儀表板**

```
目標: 為高層提供業務全貌和戰略決策支撐

數據整合:
- 客戶健康度: RFM分佈 + LTV趨勢 + 新客vs回購比例
- 營運健康度: 訂單完成率 + 處理效率 + 客服滿意度
- 財務健康度: 營收趨勢 + 利潤率 + 成本效率

商業洞察:
- 業務動能診斷 (成長 vs 衰退信號)
- 運營瓶頸識別 (影響整體效率的關鍵因素)
- 投資效果評估 (各項投入的回報分析)

決策支撐:
- 資源配置優化建議
- 業務策略調整方向
- 風險防範措施建議
```

**2. 客戶價值最大化儀表板**

```
目標: 精準客戶經營，最大化客戶生命週期價值

數據重組:
- 客戶價值分層: RFM + LTV + 購買行為模式
- 客戶旅程分析: 獲客成本 + 轉換路徑 + 流失原因
- 價值提升機會: 交叉銷售機會 + 升級潛力分析

商業洞察:
- 高價值客戶識別與專屬策略
- 流失風險客戶的挽回行動
- 新客戶培養的投資優先級

決策支撐:
- 個人化營銷策略推薦
- 客戶服務等級差異化建議
- 客戶獲取與留存投資分配
```

**3. 營運效率提升儀表板**

```
目標: 優化營運流程，提升整體運營效率

跨功能整合:
- 訂單履行效率: 處理時間 + 狀態轉換 + 異常處理
- 客服資源配置: 人力負載 + 響應時間 + 滿意度影響
- 庫存周轉優化: 銷售預測 + 庫存水位 + 資金效率

營運洞察:
- 最佳人力配置時段識別
- 促銷活動最佳時機推薦
- 流程瓶頸和改善機會分析

決策支撐:
- 人力排班優化建議
- 庫存補貨策略調整
- 流程自動化優先級排序
```

**4. 風險預警中心**

```
目標: 提前識別業務風險，快速響應異常狀況

風險監控維度:
- 客戶風險: 流失趨勢 + 滿意度下降 + 投訴增加
- 營運風險: 庫存短缺 + 處理異常 + 系統故障
- 財務風險: 現金流問題 + 利潤率下降 + 成本異常

預警機制:
- 實時異常檢測和自動標記
- 趨勢惡化提前通知和分析
- 風險等級評估和應對建議

決策支撐:
- 風險應對策略推薦
- 預防措施優先級排序
- 應急資源配置建議
```

### 9.3 基於現有數據的實施方案

#### **第一階段: 數據整合與洞察生成 (1-2週)**

**A. 業務健康度評分系統**

```sql
-- 基於現有數據創建業務動能分析
CREATE OR REPLACE VIEW business_health_metrics AS
WITH customer_health AS (
  SELECT
    date_trunc('week', o.created_at) as week,
    COUNT(DISTINCT o.user_id) as active_customers,
    COUNT(DISTINCT CASE WHEN (r.r_score >= 4 AND r.f_score >= 4 AND r.m_score >= 4) OR r.lifecycle_stage = 'Active' THEN o.user_id END) as high_value_customers
  FROM orders o
  LEFT JOIN customer_rfm_lifecycle_metrics r ON o.user_id = r.user_id
  GROUP BY date_trunc('week', o.created_at)
),
operational_health AS (
  SELECT
    date_trunc('week', created_at) as week,
    COUNT(*) as total_orders,
    AVG(EXTRACT(epoch FROM (updated_at - created_at))/3600) as avg_fulfillment_hours,
    COUNT(*) FILTER (WHERE status = 'completed') / COUNT(*)::float as completion_rate
  FROM orders
  GROUP BY date_trunc('week', created_at)
),
support_health AS (
  SELECT
    date_trunc('week', conversation_date) as week,
    AVG(COALESCE(avg_first_response_minutes, 0)) as avg_response_time,
    SUM(COALESCE(closed_conversations, 0)) / NULLIF(SUM(COALESCE(total_conversations, 0)), 0)::float as resolution_rate
  FROM conversation_summary_daily
  GROUP BY date_trunc('week', conversation_date)
)
SELECT
  c.week,
  c.active_customers,
  c.high_value_customers,
  CASE
    WHEN c.active_customers > 0 THEN c.high_value_customers::float / c.active_customers
    ELSE 0
  END as customer_quality_ratio,
  COALESCE(o.completion_rate, 0) as completion_rate,
  COALESCE(o.avg_fulfillment_hours, 0) as avg_fulfillment_hours,
  COALESCE(s.avg_response_time, 0) as avg_response_time,
  COALESCE(s.resolution_rate, 0) as resolution_rate,
  -- 健康度評分算法
  CASE
    WHEN (c.high_value_customers::float / NULLIF(c.active_customers, 0) > 0.3
         AND COALESCE(o.completion_rate, 0) > 0.8
         AND COALESCE(s.avg_response_time, 999) < 5) THEN '優秀'
    WHEN (c.high_value_customers::float / NULLIF(c.active_customers, 0) > 0.2
         AND COALESCE(o.completion_rate, 0) > 0.7
         AND COALESCE(s.avg_response_time, 999) < 10) THEN '良好'
    ELSE '需改善'
  END as overall_health_rating
FROM customer_health c
LEFT JOIN operational_health o ON c.week = o.week
LEFT JOIN support_health s ON c.week = s.week
ORDER BY c.week DESC;
```

**B. 客戶價值行動建議引擎**

```sql
-- 基於RFM的具體行動建議
CREATE OR REPLACE VIEW customer_action_recommendations AS
SELECT
  user_id,
  full_name,
  rfm_segment,
  lifecycle_stage,
  monetary as estimated_ltv, -- 使用 monetary 作為 LTV 的代理指標
  recency_days,
  frequency,
  monetary,
  CASE
    -- 基於RFM分數組合和生命週期階段的建議
    WHEN (r_score >= 4 AND f_score >= 4 AND m_score >= 4) OR lifecycle_stage = 'Active' THEN '提供VIP專屬服務，增加品牌忠誠度'
    WHEN (r_score >= 3 AND f_score >= 3) OR lifecycle_stage = 'Active' THEN '推薦相關產品，提升購買頻次'
    WHEN lifecycle_stage = 'At Risk' THEN '立即啟動挽回營銷，了解流失原因'
    WHEN lifecycle_stage = 'Churned' THEN '專人服務，重新激活購買意願'
    WHEN lifecycle_stage = 'New' THEN '新客培養計劃，建立購買習慣'
    ELSE '維持現狀，定期關懷'
  END as recommended_action,
  CASE
    WHEN monetary > 2000 OR (r_score >= 4 AND f_score >= 4 AND m_score >= 4) THEN '高'
    WHEN monetary > 500 OR lifecycle_stage IN ('At Risk', 'New') THEN '中'
    ELSE '低'
  END as action_priority,
  CASE
    WHEN recency_days > 90 THEN '流失風險'
    WHEN recency_days > 60 THEN '關注警示'
    WHEN recency_days > 30 THEN '正常監控'
    ELSE '活躍狀態'
  END as engagement_status
FROM customer_rfm_lifecycle_metrics
WHERE user_id IS NOT NULL;
```

**C. 營運效率優化分析**

```sql
-- 跨功能效率分析
CREATE OR REPLACE VIEW operational_efficiency_analysis AS
WITH hourly_efficiency AS (
  SELECT
    hour,
    AVG(order_count) as avg_orders_per_hour,
    AVG(total_amount) as avg_revenue_per_hour,
    AVG(avg_order_value) as avg_order_value,
    RANK() OVER (ORDER BY AVG(order_count) DESC) as order_volume_rank,
    RANK() OVER (ORDER BY AVG(total_amount) DESC) as revenue_rank
  FROM order_metrics_hourly
  GROUP BY hour
)
SELECT
  h.hour,
  h.avg_orders_per_hour,
  h.avg_revenue_per_hour,
  h.order_volume_rank,
  h.revenue_rank,
  0 as avg_response_time, -- 簡化版本，暫時設為0
  CASE
    WHEN h.order_volume_rank <= 8 AND h.revenue_rank <= 8 THEN '黃金時段'
    WHEN h.order_volume_rank <= 12 OR h.revenue_rank <= 12 THEN '重要時段'
    ELSE '一般時段'
  END as time_priority,
  CASE
    WHEN h.order_volume_rank <= 6 THEN '建議增加客服人力'
    WHEN h.order_volume_rank > 18 THEN '可考慮減少人力配置'
    ELSE '維持現有配置'
  END as staffing_recommendation
FROM hourly_efficiency h
ORDER BY h.hour;
```

#### **第二階段: 風險預警系統 (1週)**

**D. 自動風險檢測機制**

```sql
-- 風險預警系統（簡化版）
CREATE OR REPLACE VIEW business_risk_alerts AS
WITH customer_risks AS (
  SELECT
    'customer_churn' as risk_type,
    '客戶流失風險增加' as risk_title,
    COUNT(*) as affected_count,
    CASE
      WHEN COUNT(*) > 50 THEN '高'
      WHEN COUNT(*) > 20 THEN '中'
      ELSE '低'
    END as risk_level,
    '建議啟動客戶挽回計劃，提供個人化優惠' as recommended_action
  FROM customer_rfm_lifecycle_metrics
  WHERE lifecycle_stage = 'At Risk' AND recency_days > 60
),
operational_risks AS (
  SELECT
    'order_processing_delay' as risk_type,
    '訂單處理延遲風險' as risk_title,
    COUNT(*) as affected_count,
    CASE
      WHEN COUNT(*) > 100 THEN '高'
      WHEN COUNT(*) > 50 THEN '中'
      ELSE '低'
    END as risk_level,
    '建議優化處理流程，增加人力配置' as recommended_action
  FROM orders
  WHERE status = 'pending'
    AND EXTRACT(epoch FROM (NOW() - created_at))/3600 > 24
),
all_risks AS (
  SELECT * FROM customer_risks
  WHERE affected_count > 0
  UNION ALL
  SELECT * FROM operational_risks
  WHERE affected_count > 0
)
SELECT * FROM all_risks;
```

#### **第三階段: 洞察自動生成 (1週)**

**E. 智能洞察生成函數**

```sql
-- 自動洞察生成函數
CREATE OR REPLACE FUNCTION generate_business_insights()
RETURNS TABLE (
  insight_type VARCHAR,
  title VARCHAR,
  description TEXT,
  impact_level VARCHAR,
  recommended_actions TEXT[],
  confidence_score DECIMAL
) AS $$
BEGIN
  -- 客戶洞察
  RETURN QUERY
  WITH customer_insights AS (
    SELECT
      'customer_opportunity' as insight_type,
      '高價值客戶群體擴大機會' as title,
      '分析顯示 Champions 客戶群體較上月增長 ' ||
      ROUND((COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', CURRENT_DATE))) * 100.0 / LAG(COUNT(*)) OVER (ORDER BY date_trunc('month', CURRENT_DATE)), 1) || '%' as description,
      'high' as impact_level,
      ARRAY['加大對 Potential Loyalists 的培養投入', '設計 VIP 專屬服務計劃', '優化新客戶轉化流程'] as recommended_actions,
      0.85 as confidence_score
    FROM user_rfm_lifecycle_metrics
    WHERE rfm_segment = 'Champions'
  ),
  operational_insights AS (
    SELECT
      'operational_efficiency' as insight_type,
      '營運效率提升機會' as title,
      '週二至週四 14:00-16:00 為訂單高峰，但客服回應時間超過目標 20%' as description,
      'medium' as impact_level,
      ARRAY['調整客服排班計劃', '增加高峰時段人力配置', '優化自動化客服流程'] as recommended_actions,
      0.78 as confidence_score
  )
  SELECT * FROM customer_insights
  UNION ALL
  SELECT * FROM operational_insights;
END;
$$ LANGUAGE plpgsql;
```

### 9.4 前端實現架構

#### **A. 新的 Query Hook 架構**

```typescript
// 整合業務健康度查詢
export function useBusinessHealthOverview() {
  return useQuery({
    queryKey: ['business_health_overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_health_metrics')
        .select('*')
        .order('week', { ascending: false })
        .limit(12)

      if (error) throw error

      // 添加洞察生成
      const insights = await generateHealthInsights(data)

      return {
        metrics: data,
        insights: insights,
        healthScore: calculateOverallHealthScore(data[0]),
        trends: analyzeTrends(data),
      }
    },
    staleTime: 10 * 60 * 1000,
  })
}

// 客戶價值行動建議查詢
export function useCustomerActionRecommendations() {
  return useQuery({
    queryKey: ['customer_action_recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_action_recommendations')
        .select('*')
        .order('action_priority', { ascending: false })

      if (error) throw error

      return {
        highPriorityActions: data.filter(
          (item) => item.action_priority === '高',
        ),
        mediumPriorityActions: data.filter(
          (item) => item.action_priority === '中',
        ),
        riskCustomers: data.filter(
          (item) => item.engagement_status === '流失風險',
        ),
        totalActionableCustomers: data.length,
      }
    },
    staleTime: 15 * 60 * 1000,
  })
}
```

#### **B. 洞察生成邏輯**

```typescript
// 智能洞察生成
export function generateHealthInsights(healthData: BusinessHealthMetric[]) {
  const insights: BusinessInsight[] = []
  const latest = healthData[0]
  const previous = healthData[1]

  // 趨勢分析
  if (latest && previous) {
    const customerGrowth =
      (latest.active_customers - previous.active_customers) /
      previous.active_customers

    if (customerGrowth > 0.1) {
      insights.push({
        type: 'opportunity',
        title: '客戶基數強勁增長',
        description: `活躍客戶數較上週增長 ${(customerGrowth * 100).toFixed(1)}%，顯示業務擴張良好`,
        impact: 'high',
        actions: [
          '加大營銷投入擴大優勢',
          '優化新客戶轉化流程',
          '提升客戶服務質量',
        ],
        confidence: 0.9,
      })
    }

    if (latest.avg_response_time > 10) {
      insights.push({
        type: 'warning',
        title: '客服響應時間超標',
        description: `平均響應時間 ${latest.avg_response_time.toFixed(1)} 分鐘，超過目標值 100%`,
        impact: 'medium',
        actions: ['增加客服人力配置', '優化客服工作流程', '引入自動化解決方案'],
        confidence: 0.85,
      })
    }
  }

  return insights
}
```

### 9.5 移除與修改內容

#### **需要移除的低價值展示**

- ❌ **純數據羅列圖表**:
  - 單純的 RFM 分佈圓餅圖 → 改為客戶價值行動建議面板
  - 單純的訂單狀態分佈 → 改為訂單流程效率分析
  - 單純的時間趨勢線圖 → 改為趨勢變化洞察與預測

- ❌ **靜態 Mock 數據展示**:
  - 營運總覽中的固定數值 → 改為基於真實數據的動態計算
  - 健康度雷達圖靜態值 → 改為基於業務指標的動態評分

#### **需要修改為洞察導向**

- ✅ **從展示「什麼」改為解釋「為什麼」**:

  ```
  原本: 每小時訂單數量柱狀圖
  修改: 最佳銷售時段分析 + 人力配置建議 + 促銷投放建議

  原本: RFM 客戶分群分佈
  修改: 客戶價值提升機會分析 + 具體行動計劃

  原本: 客服回應時間統計
  修改: 服務效率對客戶滿意度影響分析 + 優化建議
  ```

- ✅ **從歷史數據改為趨勢洞察**:

  ```
  原本: 過去30天營收趨勢
  修改: 營收增長動能分析 + 風險預警 + 增長機會識別

  原本: 客戶購買頻次分佈
  修改: 客戶生命週期價值趨勢 + 提升策略建議
  ```

### 9.6 新增的高價值洞察功能

#### **A. 自動異常檢測**

```typescript
export function useAnomalyDetection() {
  return useQuery({
    queryKey: ['anomaly_detection'],
    queryFn: async () => {
      const { data } = await supabase.rpc('detect_business_anomalies')
      return data.map((anomaly) => ({
        ...anomaly,
        severity: calculateAnomalySeverity(anomaly),
        suggestedActions: getAnomalyActions(anomaly.type),
      }))
    },
    refetchInterval: 5 * 60 * 1000, // 每5分鐘檢查一次
  })
}
```

#### **B. 預測性建議引擎**

```typescript
export function usePredictiveRecommendations() {
  return useQuery({
    queryKey: ['predictive_recommendations'],
    queryFn: async () => {
      const [customerTrends, salesForecasts, riskPredictions] =
        await Promise.all([
          supabase.rpc('predict_customer_trends'),
          supabase.rpc('forecast_sales_demand'),
          supabase.rpc('predict_business_risks'),
        ])

      return {
        customerRecommendations: generateCustomerActions(customerTrends.data),
        inventoryRecommendations: generateInventoryActions(salesForecasts.data),
        riskMitigations: generateRiskActions(riskPredictions.data),
      }
    },
    staleTime: 30 * 60 * 1000, // 30分鐘更新一次預測
  })
}
```

#### **C. 個人化洞察推送**

```typescript
export function usePersonalizedInsights(userRole: string) {
  return useQuery({
    queryKey: ['personalized_insights', userRole],
    queryFn: async () => {
      const insights = await supabase.rpc('get_role_specific_insights', {
        role: userRole,
      })

      return insights.data
        .filter((insight) => insight.relevance_score > 0.7)
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, 5) // 只顯示前5個最重要的洞察
    },
    staleTime: 15 * 60 * 1000,
  })
}
```

### 9.7 技術實現優化

#### **A. 查詢整合優化**

```typescript
// 單一查詢獲取多維度洞察
export function useExecutiveDashboard() {
  return useQuery({
    queryKey: ['executive_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_executive_dashboard_data')

      if (error) throw error

      return {
        healthScore: data.business_health,
        keyMetrics: data.kpi_summary,
        criticalAlerts: data.risk_alerts.filter(
          (alert) => alert.priority === 'high',
        ),
        actionableInsights: data.insights.filter(
          (insight) => insight.actionable === true,
        ),
        trendAnalysis: data.trend_analysis,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

#### **B. 洞察快取策略**

```typescript
// 分層快取策略
const CACHE_STRATEGIES = {
  realtime: 1 * 60 * 1000, // 1分鐘 - 風險預警
  frequent: 5 * 60 * 1000, // 5分鐘 - 營運指標
  regular: 15 * 60 * 1000, // 15分鐘 - 客戶分析
  strategic: 60 * 60 * 1000, // 1小時 - 戰略洞察
}
```

### 9.8 未來進階發展方向

#### **第二階段: 機器學習預測 (3-6個月)**

- **客戶行為預測模型**: 基於購買歷史預測客戶未來行為
- **需求預測引擎**: 結合季節性、促銷活動預測產品需求
- **動態定價算法**: 基於市場情況和庫存狀況的智能定價
- **個人化推薦系統**: 基於協同過濾的產品推薦引擎

#### **第三階段: AI驅動洞察 (6-12個月)**

- **自然語言查詢**: "為什麼這個月的營收下降了？"
- **自動解釋型AI**: 為每個異常數據提供可能原因分析
- **對話式商業智能**: 與AI助手對話獲取業務洞察
- **自動化決策建議**: 基於歷史效果的智能決策推薦

#### **第四階段: 全平台智能化 (12個月+)**

- **跨平台數據整合**: 整合CRM、ERP、社群媒體數據
- **實時決策支援**: 毫秒級的業務決策推薦
- **自動化營運優化**: 基於AI的自動化業務流程優化
- **預測性維護**: 提前預測系統和業務風險

### 9.9 實施時程與里程碑

#### **第一週: 數據整合與基礎洞察**

- 建立業務健康度評分系統
- 創建客戶行動建議引擎
- 實現基礎異常檢測功能

#### **第二週: 風險預警與營運優化**

- 部署風險預警系統
- 建立營運效率分析儀表
- 實現跨功能數據整合

#### **第三週: 前端重構與用戶體驗**

- 重構儀表板為決策導向介面
- 實現洞察自動生成與推送
- 優化數據視覺化為行動導向

#### **第四週: 測試與優化**

- 進行全面功能測試
- 優化效能與用戶體驗
- 準備上線部署

---

_本文檔最後更新: 2025年1月_  
_版本: 2.0 - 洞察驅動重構版_
