# 業務模組架構設計

## 架構概覽

本專案採用 **領域驅動設計 (DDD)** 原則，將複雜的電商管理系統劃分為 9 個核心業務域，每個業務域都有完整的組件、API 服務、狀態管理和路由結構。

---
**文檔資訊**
- 最後更新：2025-07-27
- 版本：1.1.0
- 狀態：✅ 與代碼同步
- 業務域數量：9個核心域
- 洞察分析：4個專業儀表板
---

## **業務域架構總覽**

### 1.1 業務域劃分

```
電商管理平台業務架構
├── 🛒 Order Management (訂單管理)
│   ├── 訂單生命週期管理
│   ├── 訂單項目管理
│   ├── 支付流程整合
│   └── 訂單分析報表
├── 👥 Customer Management (客戶管理)  
│   ├── 客戶資料管理
│   ├── 客戶行為分析
│   ├── 客戶生命週期追蹤
│   └── RFM 分析系統
├── 📦 Product Management (產品管理)
│   ├── 產品資訊管理
│   ├── 產品分類系統
│   ├── 庫存管理整合
│   └── 產品績效分析
├── 📋 Inventory Management (庫存管理)
│   ├── 庫存追蹤系統
│   ├── 補貨提醒機制
│   ├── 庫存預測分析
│   └── 供應鏈整合
├── 🎯 Campaign Management (活動管理)
│   ├── 行銷活動規劃
│   ├── 活動歸因分析
│   ├── 活動成效追蹤
│   └── 活動狀態管理
├── 🎧 Support System (客服支援)
│   ├── 對話管理系統
│   ├── 工單處理流程
│   ├── 客服績效分析
│   └── 知識庫管理
├── 🔐 Permission System (權限管理)
│   ├── 角色權限控制 (RBAC)
│   ├── 用戶管理系統
│   ├── 權限矩陣配置
│   └── 安全稽核追蹤
├── 🔔 Notification System (通知系統)
│   ├── 即時通知推送
│   ├── 通知模板管理
│   ├── 群組通知功能
│   └── 通知統計分析
└── 📊 Analytics System (分析系統)
    ├── 4個專業儀表板
    ├── 商業智能分析
    ├── 實時數據監控
    └── 自定義報表生成
```

### 1.2 業務域依賴關係

```
依賴關係圖
Permission System (核心)
    ↓ 提供身份驗證與授權
├── Customer Management
├── Product Management  
├── Order Management
├── Inventory Management
├── Support System
├── Notification System
└── Analytics System
    ↑ 所有業務數據流向分析系統
```

## 🛒 **Order Management (訂單管理域)**

### 2.1 業務功能範圍

#### **核心業務流程**
```
訂單生命週期
創建訂單 → 支付處理 → 庫存分配 → 訂單履行 → 完成/退款
    ↓         ↓         ↓         ↓         ↓
狀態追蹤   支付整合   庫存更新   物流追蹤   客戶通知
```

#### **組件架構**
```typescript
// src/components/order/
├── OrderList.vue              // 訂單列表視圖
├── OrderItemForm.vue          // 訂單項目表單
├── ItemList.vue               // 訂單項目列表
├── RecentOrdersRealtime.vue   // 即時訂單更新
├── charts/                    // 訂單分析圖表
│   ├── AmountHistogram.vue    // 訂單金額分佈
│   ├── OrderStatusDistribution.vue // 訂單狀態分佈
│   ├── TopProductTrend.vue    // 熱銷產品趨勢
│   └── RevenueHourScatter.vue // 收入時間散點圖
└── order-list/               // 表格組件
    ├── DataTableHeaderActions.vue
    ├── DataTableRowActions.vue
    └── columns.ts            // 表格欄位定義
```

#### **API 服務**
```typescript
// src/api/services/OrderApiService.ts
export class OrderApiService extends BaseApiService {
  // CRUD 操作
  async getAll(filters?: OrderFilters): Promise<Order[]>
  async getById(id: string): Promise<Order>
  async create(orderData: CreateOrderRequest): Promise<Order>
  async update(id: string, updates: UpdateOrderRequest): Promise<Order>
  async delete(id: string): Promise<void>
  
  // 業務特定操作
  async updateStatus(id: string, status: OrderStatus): Promise<Order>
  async processPayment(id: string, paymentData: PaymentRequest): Promise<PaymentResult>
  async calculateTotal(items: OrderItem[]): Promise<OrderTotal>
  async getOrderHistory(customerId: string): Promise<Order[]>
  
  // 分析功能
  async getOrderStats(timeRange: TimeRange): Promise<OrderStatistics>
  async getRevenueAnalysis(filters: RevenueFilters): Promise<RevenueData[]>
}
```

#### **狀態管理整合**
```typescript
// composables/useOrder.ts
export const useOrder = () => {
  const orderApi = ServiceFactory.createOrderService()
  
  // 基礎狀態
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 業務邏輯
  const createOrderWithItems = async (orderData: CreateOrderRequest) => {
    loading.value = true
    try {
      // 1. 檢查庫存
      await validateInventory(orderData.items)
      
      // 2. 創建訂單
      const order = await orderApi.create(orderData)
      
      // 3. 分配庫存
      await allocateInventory(order.id, orderData.items)
      
      // 4. 發送通知
      await notifyOrderCreated(order)
      
      orders.value.push(order)
      return order
    } catch (err) {
      error.value = '訂單創建失敗'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    orders, currentOrder, loading, error,
    createOrderWithItems,
    // ... 其他方法
  }
}
```

### 2.2 路由結構

```typescript
// 訂單域路由
{
  path: '/orders',
  meta: { 
    breadcrumb: 'Orders 訂單', 
    permission: ViewPermission.ORDER._
  },
  children: [
    {
      path: '',
      name: 'orders',
      component: () => import('@/views/OrdersView.vue')
    },
    {
      path: ':id',
      name: 'order-detail',
      component: () => import('@/views/OrderDetailView.vue'),
      meta: { breadcrumb: 'Order Detail 訂單細節' }
    }
  ]
}
```

### 2.3 業務指標與KPI

| 指標類型 | 關鍵指標 | 計算方式 | 用途 |
|----------|----------|----------|------|
| **效率指標** | 平均訂單處理時間 | (完成時間 - 創建時間) 平均值 | 流程優化 |
| **收益指標** | 平均訂單價值 (AOV) | 總收入 / 訂單數量 | 營收分析 |
| **品質指標** | 訂單錯誤率 | 錯誤訂單數 / 總訂單數 | 品質控制 |
| **客戶指標** | 訂單完成率 | 完成訂單數 / 總訂單數 | 客戶滿意度 |

## 👥 **Customer Management (客戶管理域)**

### 3.1 業務功能範圍

#### **客戶生命週期管理**
```
客戶旅程
潛在客戶 → 新客戶 → 活躍客戶 → 忠誠客戶 → 流失客戶
    ↓        ↓        ↓         ↓         ↓
   引導      轉換      留存       提升      挽回
```

#### **RFM 分析系統**
```typescript
// 客戶價值分析模型
interface RFMAnalysis {
  recency: number    // 最近購買距離 (天)
  frequency: number  // 購買頻率 (次數/期間)  
  monetary: number   // 購買金額 (總金額)
  
  // 計算得出的客戶分類
  customerSegment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' 
                 | 'New Customers' | 'Promising' | 'Need Attention'
                 | 'About to Sleep' | 'At Risk' | 'Cannot Lose Them' | 'Hibernating'
}
```

#### **組件架構**
```typescript
// src/components/customer/
├── CustomersList.vue           // 客戶列表主視圖
├── UserOrderList.vue          // 客戶訂單歷史
├── charts/                    // 客戶分析圖表
│   ├── LTVPurchaseTrend.vue   // 客戶價值趨勢
│   ├── RFMDonutChart.vue      // RFM 分佈圓餅圖
│   ├── PurchaseCount.vue      // 購買次數分析
│   └── RfmLtvScatter.vue      // RFM vs LTV 散點圖
├── customer-list/             // 列表組件
│   ├── DataTableHeaderActions.vue
│   ├── DataTableRowActions.vue
│   └── columns.ts
└── user-order-list/          // 訂單列表組件
    ├── DataTableRowActions.vue
    └── columns.ts
```

### 3.2 客戶分析算法

#### **LTV (客戶終身價值) 計算**
```typescript
// utils/customerAnalytics.ts
export class CustomerAnalytics {
  /**
   * 計算客戶終身價值
   * LTV = (AOV × 購買頻率 × 客戶生命週期) - 客戶獲取成本
   */
  static calculateLTV(customer: Customer): number {
    const aov = customer.totalSpent / customer.orderCount // 平均訂單價值
    const avgDaysBetweenOrders = customer.avgDaysBetweenOrders || 90
    const frequency = 365 / avgDaysBetweenOrders // 年購買頻率
    const customerLifespanYears = 2.5 // 預期客戶生命週期
    
    return aov * frequency * customerLifespanYears
  }
  
  /**
   * RFM 分析
   */
  static calculateRFM(customer: Customer, baseDate = new Date()): RFMAnalysis {
    const recency = Math.floor(
      (baseDate.getTime() - new Date(customer.lastOrderDate || 0).getTime()) 
      / (1000 * 60 * 60 * 24)
    )
    
    const frequency = customer.orderCount
    const monetary = customer.totalSpent
    
    return {
      recency,
      frequency, 
      monetary,
      customerSegment: this.segmentCustomer(recency, frequency, monetary)
    }
  }
  
  /**
   * 客戶分群邏輯
   */
  private static segmentCustomer(r: number, f: number, m: number): string {
    // RFM 評分 (1-5 分，5分最好)
    const rScore = r <= 30 ? 5 : r <= 90 ? 4 : r <= 180 ? 3 : r <= 365 ? 2 : 1
    const fScore = f >= 10 ? 5 : f >= 5 ? 4 : f >= 3 ? 3 : f >= 2 ? 2 : 1
    const mScore = m >= 5000 ? 5 : m >= 2000 ? 4 : m >= 1000 ? 3 : m >= 500 ? 2 : 1
    
    // 分群邏輯
    if (rScore >= 4 && fScore >= 4 && mScore >= 4) return 'Champions'
    if (rScore >= 3 && fScore >= 3 && mScore >= 3) return 'Loyal Customers'
    if (rScore >= 4 && fScore <= 2) return 'New Customers'
    if (rScore <= 2 && fScore >= 3 && mScore >= 3) return 'At Risk'
    if (rScore <= 2 && fScore <= 2 && mScore >= 3) return 'Cannot Lose Them'
    
    return 'Need Attention' // 默認分群
  }
}
```

## **Campaign Management (活動管理域)**

### 3.5 業務功能範圍

#### **活動生命週期管理**
```
活動管理流程
活動規劃 → 活動創建 → 活動執行 → 效果追蹤 → 歸因分析
    ↓        ↓        ↓         ↓         ↓
   策略制定   資源配置   即時監控   成效評估   優化建議
```

#### **活動歸因分析系統**
```typescript
// 活動歸因模型
interface CampaignAttribution {
  id: string
  campaignName: string
  attributionLayer: string    // 歸因層級：first-touch, last-touch, multi-touch
  priorityScore: number       // 優先級分數 (1-10)
  attributionWeight: number   // 歸因權重 (0-1)
  
  // 成效指標
  performance: {
    impressions: number       // 曝光量
    clicks: number           // 點擊量
    conversions: number      // 轉換數
    revenue: number          // 歸因收入
    roas: number            // 廣告投資報酬率
  }
  
  // 時間範圍
  dateRange: {
    startDate: string
    endDate: string
    status: 'upcoming' | 'active' | 'ended'
  }
}
```

#### **組件架構**
```typescript
// src/components/campaign/
├── CampaignList.vue            // 活動列表主視圖
├── CampaignView.vue           // 活動詳細頁面
├── campaign-list/             // 列表組件
│   ├── DataTableHeaderActions.vue
│   ├── DataTableRowActions.vue
│   ├── columns.ts            // 表格欄位定義
│   └── field-config.ts       // 欄位配置與樣式
└── charts/                   // 活動分析圖表 (未來擴展)
    ├── CampaignROIChart.vue  // ROI 分析圖表
    ├── AttributionFlow.vue   // 歸因流程圖
    └── CampaignComparison.vue // 活動效果對比
```

#### **API 服務**
```typescript
// src/api/services/CampaignApiService.ts
export class CampaignApiService extends BaseApiService {
  // CRUD 操作
  async fetchCampaignsWithPagination(options: PaginationOptions): Promise<ApiPaginationResponse>
  async getCampaignById(id: string): Promise<ApiResponse<Campaign>>
  async createCampaign(campaignData: CreateCampaignRequest): Promise<ApiResponse<Campaign>>
  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<ApiResponse<Campaign>>
  async deleteCampaign(id: string): Promise<ApiResponse>
  
  // 業務特定操作
  async fetchCampaignsByKeyword(keyword: string): Promise<ApiResponse<Campaign[]>>
  async deleteCampaigns(ids: string[]): Promise<ApiResponse> // 批量刪除
  
  // 歸因分析功能 (未來擴展)
  async getCampaignAttribution(id: string): Promise<ApiResponse<CampaignAttribution>>
  async getAttributionReport(filters: AttributionFilters): Promise<ApiResponse<AttributionReport>>
}
```

#### **狀態管理整合**
```typescript
// composables/useCampaign.ts
export const useCampaign = () => {
  const campaignApi = ServiceFactory.createCampaignService()
  
  // 基礎狀態
  const campaigns = ref<Campaign[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // 業務邏輯
  const createCampaignWithValidation = async (campaignData: CreateCampaignRequest) => {
    loading.value = true
    try {
      // 1. 驗證活動時間衝突
      await validateCampaignDateRange(campaignData.startDate, campaignData.endDate)
      
      // 2. 創建活動
      const campaign = await campaignApi.createCampaign(campaignData)
      
      // 3. 初始化歸因設定
      await setupCampaignAttribution(campaign.id)
      
      // 4. 發送通知
      await notifyCampaignCreated(campaign)
      
      return campaign
    } catch (err) {
      error.value = '活動創建失敗'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  return {
    campaigns, loading, error,
    createCampaignWithValidation,
    // ... 其他方法
  }
}
```

### 3.6 活動狀態配置系統

#### **狀態判斷邏輯**
```typescript
// src/components/campaign/campaign-list/field-config.ts
export function getCampaignStatus(startDate: string, endDate: string): CampaignStatusInfo {
  const today = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // 智能時間比較
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  
  if (today < start) {
    return {
      key: 'upcoming',
      label: '尚未開始',
      variant: 'secondary',
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      icon: Clock,
      description: '活動尚未開始'
    }
  } else if (today >= start && today <= end) {
    return {
      key: 'active',
      label: '進行中',
      variant: 'default',
      class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      icon: Play,
      description: '活動正在進行中'
    }
  } else {
    return {
      key: 'ended',
      label: '已結束',
      variant: 'outline',
      class: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      icon: StopCircle,
      description: '活動已結束'
    }
  }
}
```

### 3.7 路由結構

```typescript
// 活動域路由
{
  path: '/campaign',
  meta: { 
    breadcrumb: 'Campaign 活動', 
    permission: ViewPermission.CAMPAIGN._
  },
  children: [
    {
      path: '',
      name: 'campaign',
      component: () => import('@/views/CampaignView.vue')
    },
    {
      path: ':id',
      name: 'campaign-detail',
      component: () => import('@/views/CampaignDetailView.vue'),
      meta: { breadcrumb: 'Campaign Detail 活動詳情' }
    }
  ]
}
```

### 3.8 業務指標與KPI

| 指標類型 | 關鍵指標 | 計算方式 | 用途 |
|----------|----------|----------|------|
| **效果指標** | 活動轉換率 | 轉換數 / 曝光數 × 100% | 活動效果評估 |
| **收益指標** | 投資報酬率 (ROI) | (收入 - 成本) / 成本 × 100% | 營收分析 |
| **歸因指標** | 歸因準確度 | 歸因收入 / 實際收入 | 歸因模型優化 |
| **時效指標** | 活動響應時間 | 活動啟動到首次轉換的時間 | 執行效率 |

## **Analytics System (分析系統域)**

### 4.1 四大專業儀表板

#### **Executive Health Dashboard (經營健康度)**
```typescript
// src/views/DashboardExecutiveHealth.vue
/**
 * 高層管理視角的關鍵指標
 * - 整體收入趨勢
 * - 客戶增長率
 * - 訂單轉換率
 * - 庫存週轉率
 * - 客服滿意度
 */

interface HealthMetrics {
  revenue: {
    current: number
    growth: number      // 成長率 %
    target: number      // 目標值
    forecast: number[]  // 預測值
  }
  
  customers: {
    total: number
    newThisMonth: number
    churnRate: number   // 流失率 %
    ltv: number        // 平均客戶價值
  }
  
  operations: {
    orderFulfillmentRate: number  // 訂單履行率
    inventoryTurnover: number     // 庫存週轉率
    supportResponseTime: number   // 客服回應時間
    systemUptime: number          // 系統正常運行時間
  }
  
  riskIndicators: {
    cashFlow: 'healthy' | 'warning' | 'critical'
    inventoryLevels: 'optimal' | 'overstocked' | 'understocked'
    customerSatisfaction: number // 1-10 分
  }
}
```

#### **Customer Value Dashboard (客戶價值最大化)**
```typescript
// src/views/DashboardCustomerValue.vue
/**
 * 客戶價值分析與優化
 * - RFM 客戶分群
 * - 客戶生命週期價值
 * - 交叉銷售機會
 * - 客戶留存分析
 */

interface CustomerValueMetrics {
  segmentation: {
    champions: number
    loyalCustomers: number
    potentialLoyalists: number
    newCustomers: number
    atRisk: number
    // ... 其他分群
  }
  
  valueDrivers: {
    avgOrderValue: number
    purchaseFrequency: number
    customerLifespan: number
    retentionRate: number
  }
  
  opportunities: {
    crossSellPotential: Array<{
      customerId: string
      suggestedProducts: Product[]
      expectedValue: number
    }>
    
    winBackCampaigns: Array<{
      segment: string
      customerCount: number
      expectedRevenue: number
    }>
  }
}
```

#### **Operational Excellence Dashboard (營運效率提升)**
```typescript
// src/views/DashboardOperationalExcellence.vue
/**
 * 營運效率監控與優化
 * - 訂單處理效率
 * - 庫存管理效率
 * - 客服績效分析
 * - 系統性能監控
 */

interface OperationalMetrics {
  orderProcessing: {
    avgProcessingTime: number     // 平均處理時間
    automationRate: number        // 自動化比例
    errorRate: number            // 錯誤率
    throughput: number           // 處理量/小時
  }
  
  inventory: {
    stockoutRate: number         // 缺貨率
    overstockValue: number       // 超庫存價值
    turnoverRate: number         // 週轉率
    forecastAccuracy: number     // 預測準確度
  }
  
  customerService: {
    avgResponseTime: number      // 平均回應時間
    firstContactResolution: number // 首次解決率
    customerSatisfaction: number  // 客戶滿意度
    agentProductivity: number    // 客服生產力
  }
}
```

#### **Risk Center Dashboard (風險預警中心)**
```typescript
// src/views/DashboardRiskCenter.vue
/**
 * 業務風險識別與預警
 * - 財務風險監控
 * - 客戶流失預警
 * - 庫存風險管理
 * - 系統安全監控
 */

interface RiskMetrics {
  financial: {
    cashFlowRisk: RiskLevel
    badDebtRisk: number          // 壞帳風險
    concentrationRisk: number    // 客戶集中風險
  }
  
  customer: {
    churnRisk: Array<{
      customerId: string
      riskScore: number         // 0-100
      riskFactors: string[]
    }>
    
    satisfactionTrend: number[]  // 滿意度趨勢
  }
  
  operational: {
    systemDowntime: number       // 系統故障時間
    dataQualityScore: number     // 資料品質分數
    complianceStatus: 'compliant' | 'warning' | 'violation'
  }
}
```

### 4.2 圖表組件架構

#### **分析圖表分層設計**
```typescript
// src/components/insights/
├── customer/                   // 客戶分析圖表
│   ├── ActionPriorityChart.vue // 客戶行動優先級
│   ├── LTVTrendChart.vue      // 客戶價值趨勢
│   └── RFMDistributionChart.vue // RFM分佈圖
├── health/                    // 健康度圖表
│   ├── HealthComparisonChart.vue // 健康指標對比
│   ├── HealthTrendChart.vue    // 健康度趨勢
│   └── RiskDistributionChart.vue // 風險分佈
├── operational/               // 營運效率圖表
│   ├── BottleneckChart.vue    // 瓶頸分析
│   ├── EfficiencyTrendChart.vue // 效率趨勢
│   └── HourlyEfficiencyChart.vue // 小時效率
└── risk/                     // 風險分析圖表
    ├── RiskComparisonChart.vue // 風險對比
    ├── RiskLevelChart.vue     // 風險等級
    └── RiskTrendChart.vue     // 風險趨勢
```

## **Notification System (通知系統域)**

### 5.1 企業級通知架構

#### **通知類型分層**
```typescript
// src/types/notification.ts
export interface NotificationConfig {
  // 基礎通知
  system: {
    maintenance: boolean    // 系統維護通知
    updates: boolean       // 系統更新通知
    alerts: boolean        // 系統警告
  }
  
  // 業務通知
  business: {
    newOrders: boolean     // 新訂單通知
    lowStock: boolean      // 低庫存警告
    customerMessages: boolean // 客戶訊息
    paymentIssues: boolean // 支付問題
  }
  
  // 個人通知
  personal: {
    taskReminders: boolean // 任務提醒
    deadlines: boolean     // 截止日期
    approvals: boolean     // 審批請求
  }
  
  // 通知渠道
  channels: {
    inApp: boolean         // 應用內通知
    email: boolean         // 電子郵件
    sms: boolean          // 簡訊通知
    push: boolean         // 推送通知
  }
}
```

#### **群組通知功能**
```typescript
// src/components/notify/GroupNotificationCard.vue
/**
 * 支援批量通知功能
 * - 角色群組通知
 * - 部門通知
 * - 緊急廣播
 * - 定時通知
 */

interface GroupNotification {
  id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  targeting: {
    roles: string[]        // 目標角色
    departments: string[]  // 目標部門
    users: string[]       // 特定用戶
  }
  
  scheduling: {
    sendAt?: Date         // 定時發送
    recurring?: {         // 重複發送
      frequency: 'daily' | 'weekly' | 'monthly'
      endDate?: Date
    }
  }
  
  delivery: {
    channels: ('inApp' | 'email' | 'sms')[]
    requireAcknowledgment: boolean // 需要確認回覆
  }
}
```

### 5.2 即時通知系統

#### **WebSocket 整合**
```typescript
// composables/useRealtimeNotifications.ts
export const useRealtimeNotifications = () => {
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()
  
  // Supabase Realtime 整合
  const channel = supabase
    .channel(`notifications:user:${user.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      const notification = payload.new as Notification
      
      // 添加到本地狀態
      addNotification(notification)
      
      // 顯示即時通知
      showToast(notification)
      
      // 播放提示音 (如果開啟)
      if (user.preferences.soundEnabled) {
        playNotificationSound()
      }
    })
    .subscribe()
  
  // 清理函數
  onUnmounted(() => {
    channel.unsubscribe()
  })
}
```

## 🔐 **Permission System (權限管理域)**

### 6.1 RBAC 權限控制

#### **權限矩陣設計**
```typescript
// src/types/permission.ts
export interface PermissionMatrix {
  groups: Array<{
    id: string
    name: string
    description: string
    permissions: Array<{
      code: string           // 權限代碼
      name: string          // 權限名稱
      resource: string      // 資源對象
      action: string        // 動作類型
      conditions?: string[] // 條件限制
    }>
  }>
}

// 權限檢查範例
export enum ViewPermission {
  // 業務域權限
  ORDER = {
    _: 'view:order',
    CREATE: 'create:order',
    EDIT: 'edit:order', 
    DELETE: 'delete:order',
    APPROVE: 'approve:order'
  },
  
  CUSTOMER = {
    _: 'view:customer',
    CREATE: 'create:customer',
    EDIT: 'edit:customer',
    DELETE: 'delete:customer',
    EXPORT: 'export:customer'
  },
  
  CAMPAIGN = {
    _: 'campaign.view',
    CREATE: 'campaign.create',
    EDIT: 'campaign.edit',
    DELETE: 'campaign.delete',
    ANALYTICS: 'campaign.analytics'
  },
  
  // 系統管理權限
  SETTING = {
    _: 'view:setting',
    ROLES: 'manage:roles',
    PERMISSIONS: 'manage:permissions',
    USERS: 'manage:users',
    AI_PROVIDER: 'ai_provider.view'
  }
}
```

#### **動態權限控制**
```vue
<!-- 組件級權限控制 -->
<template>
  <div>
    <!-- 條件顯示 -->
    <EditButton 
      v-if="hasPermission('edit:customer')"
      @click="editCustomer" 
    />
    
    <!-- 功能限制 -->
    <DataTable
      :data="customers"
      :actions="availableActions"
    />
  </div>
</template>

<script setup>
const { hasPermission } = usePermissionStore()

// 動態計算可用操作
const availableActions = computed(() => {
  const actions = []
  
  if (hasPermission('edit:customer')) actions.push('edit')
  if (hasPermission('delete:customer')) actions.push('delete')  
  if (hasPermission('export:customer')) actions.push('export')
  
  return actions
})
</script>
```

## 📈 **業務域整合模式**

### 7.1 跨域數據流

#### **事件驅動架構**
```typescript
// utils/domainEvents.ts
export class DomainEventBus {
  private static events = new Map<string, Function[]>()
  
  static emit(eventName: string, payload: any) {
    const handlers = this.events.get(eventName) || []
    handlers.forEach(handler => handler(payload))
  }
  
  static on(eventName: string, handler: Function) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, [])
    }
    this.events.get(eventName)!.push(handler)
  }
}

// 使用範例：訂單創建後觸發多域響應
// Order 域
const createOrder = async (orderData: CreateOrderRequest) => {
  const order = await orderApi.create(orderData)
  
  // 發佈領域事件
  DomainEventBus.emit('order:created', {
    orderId: order.id,
    customerId: order.customerId,
    items: order.items,
    total: order.total
  })
  
  return order
}

// Inventory 域監聽
DomainEventBus.on('order:created', async (event) => {
  await allocateInventory(event.orderId, event.items)
})

// Notification 域監聽  
DomainEventBus.on('order:created', async (event) => {
  await sendOrderConfirmation(event.customerId, event.orderId)
})

// Analytics 域監聽
DomainEventBus.on('order:created', async (event) => {
  await updateRevenueMetrics(event.total)
  await updateCustomerAnalytics(event.customerId)
})
```

### 7.2 共享組件策略

#### **跨域組件復用**
```typescript
// src/components/common/business/
├── EntityCard.vue          // 通用實體卡片
├── StatusBadge.vue         // 狀態標誌
├── ActionButton.vue        // 操作按鈕
├── DateRangePicker.vue     // 日期選擇器
└── AnalyticsChart.vue      // 分析圖表基礎組件

// 使用範例
// 在 Customer 域中使用
<EntityCard 
  :data="customer"
  :fields="customerFields"
  :actions="customerActions"
/>

// 在 Order 域中使用
<EntityCard 
  :data="order" 
  :fields="orderFields"
  :actions="orderActions"
/>
```

## **性能優化策略**

### 8.1 業務域級別優化

#### **數據預加載策略**
```typescript
// composables/useDomainPreloader.ts
export const useDomainPreloader = (domain: string) => {
  const preloadStrategies = {
    'customer': async () => {
      // 預加載客戶相關的關鍵數據
      await Promise.allSettled([
        customerApi.getFrequentlyAccessed(),
        customerApi.getSegmentSummary(),
        customerApi.getRecentActivity()
      ])
    },
    
    'order': async () => {
      // 預加載訂單相關數據
      await Promise.allSettled([
        orderApi.getRecentOrders(),
        orderApi.getOrderStats(),
        productApi.getPopularProducts()
      ])
    }
  }
  
  const preload = () => {
    const strategy = preloadStrategies[domain]
    if (strategy) strategy()
  }
  
  return { preload }
}
```

#### **智能快取策略**
```typescript
// utils/domainCache.ts
export class DomainCache {
  private static caches = new Map<string, Map<string, any>>()
  
  static set(domain: string, key: string, data: any, ttl = 300000) {
    if (!this.caches.has(domain)) {
      this.caches.set(domain, new Map())
    }
    
    const domainCache = this.caches.get(domain)!
    domainCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  static get<T>(domain: string, key: string): T | null {
    const domainCache = this.caches.get(domain)
    if (!domainCache) return null
    
    const cached = domainCache.get(key)
    if (!cached) return null
    
    // 檢查是否過期
    if (Date.now() - cached.timestamp > cached.ttl) {
      domainCache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  // 域級別緩存清理
  static clearDomain(domain: string) {
    this.caches.delete(domain)
  }
}
```

## **業務指標監控**

### 9.1 領域關鍵指標

| 業務域 | 關鍵指標 | 計算公式 | 目標值 |
|--------|----------|----------|--------|
| **Order** | 訂單轉換率 | 完成訂單 / 創建訂單 | >95% |
| **Customer** | 客戶留存率 | 回購客戶 / 總客戶 | >60% |
| **Product** | 庫存週轉率 | 銷售成本 / 平均庫存 | >12次/年 |
| **Campaign** | 活動轉換率 | 轉換數 / 曝光數 | >3% |
| **Support** | 首次解決率 | 首次解決問題 / 總問題 | >80% |
| **Permission** | 權限違規率 | 違規操作 / 總操作 | <0.1% |
| **Notification** | 通知到達率 | 成功發送 / 總發送 | >99% |
| **Analytics** | 數據時效性 | 實時數據 / 總數據 | >90% |

### 9.2 跨域協作指標

- **數據一致性**：跨域數據同步準確率 >99.9%
- **響應性能**：跨域操作完成時間 <2秒
- **錯誤處理**：跨域錯誤自動恢復率 >95%

---

## **相關文檔**

- [路由架構設計](./routing-architecture.md) - 業務域路由實現
- [狀態管理架構](./state-management.md) - 業務域狀態管理
- [API 服務架構](./api-services.md) - 業務域 API 設計
- [組件架構地圖](./component-map.md) - 業務域組件組織

---

**更新紀錄**
- v1.0.0 (2025-07-22): 初始版本，完整業務模組架構設計
- 下次更新：當業務域結構發生重大變更時

**文檔狀態**：✅ 已與實際代碼業務域結構完全同步