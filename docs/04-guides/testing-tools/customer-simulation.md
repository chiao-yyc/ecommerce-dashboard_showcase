# 客戶行為模擬文檔

## 概述

客戶行為模擬是 `front-stage-vue` 測試系統的核心功能之一，旨在創建真實的客戶互動場景，幫助驗證後台管理系統的各項功能和業務邏輯。

## 模擬場景設計

### 客戶生命週期模擬

#### 1. 新客戶註冊場景
```typescript
interface NewCustomerScenario {
  registrationMethod: 'email' | 'phone' | 'social'
  onboardingPath: 'guided' | 'self-exploration'
  firstPurchaseTimeframe: 'immediate' | 'within-7-days' | 'within-30-days' | 'no-purchase'
}

class NewCustomerSimulator {
  static async simulateRegistration(): Promise<Customer> {
    const customer = generateCustomer()
    
    // 模擬註冊流程
    console.log(`🆕 新客戶註冊: ${customer.name}`)
    
    // 1. 註冊
    await CustomerApiService.register(customer)
    
    // 2. 電子郵件驗證 (模擬)
    await this.simulateEmailVerification(customer.id)
    
    // 3. 新手導覽 (30% 機率完成)
    if (faker.datatype.boolean(0.3)) {
      await this.simulateOnboarding(customer.id)
    }
    
    // 4. 首次瀏覽行為
    await this.simulateFirstVisitBehavior(customer.id)
    
    return customer
  }
  
  private static async simulateOnboarding(customerId: string) {
    const onboardingSteps = [
      'profile-completion',
      'preference-setting', 
      'newsletter-subscription',
      'first-product-view'
    ]
    
    for (const step of onboardingSteps) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模擬用戶思考時間
      console.log(`📝 完成新手導覽步驟: ${step}`)
    }
  }
}
```

#### 2. 回頭客行為模擬
```typescript
class ReturningCustomerSimulator {
  static async simulateReturnVisit(customerId: string) {
    const customer = await CustomerApiService.getById(customerId)
    const visitType = faker.helpers.weightedArrayElement([
      { weight: 40, value: 'browse' },           // 純瀏覽
      { weight: 35, value: 'specific-purchase' }, // 目標性購買
      { weight: 15, value: 'comparison' },       // 比較商品
      { weight: 10, value: 'customer-service' }  // 客服諮詢
    ])
    
    console.log(`🔄 回頭客訪問: ${customer.name}, 類型: ${visitType}`)
    
    switch (visitType) {
      case 'browse':
        await this.simulateBrowsingBehavior(customerId)
        break
      case 'specific-purchase':
        await this.simulateTargetedPurchase(customerId)
        break
      case 'comparison':
        await this.simulateComparisonShopping(customerId)
        break
      case 'customer-service':
        await this.simulateCustomerService(customerId)
        break
    }
  }
  
  private static async simulateBrowsingBehavior(customerId: string) {
    const browsingSession = {
      duration: faker.number.int({ min: 300, max: 1800 }), // 5-30分鐘
      pagesViewed: faker.number.int({ min: 3, max: 15 }),
      productsViewed: faker.number.int({ min: 2, max: 10 }),
      addToCart: faker.datatype.boolean(0.15), // 15% 機率加入購物車
      purchase: faker.datatype.boolean(0.05)   // 5% 機率購買
    }
    
    // 模擬頁面瀏覽
    for (let i = 0; i < browsingSession.pagesViewed; i++) {
      const pageType = faker.helpers.arrayElement([
        'product-list', 'product-detail', 'category', 'search-results'
      ])
      await this.simulatePageView(customerId, pageType)
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模擬停留時間
    }
    
    if (browsingSession.addToCart) {
      await this.simulateAddToCart(customerId)
    }
  }
}
```

### 購物行為模擬

#### 3. 購買決策流程
```typescript
class PurchaseDecisionSimulator {
  static async simulatePurchaseJourney(customerId: string) {
    const journey = {
      trigger: faker.helpers.arrayElement([
        'need-based',      // 需求驅動
        'impulse',         // 衝動購買
        'promotion',       // 促銷活動
        'recommendation'   // 推薦商品
      ]),
      researchIntensity: faker.helpers.arrayElement(['low', 'medium', 'high']),
      decisionTime: faker.number.int({ min: 1, max: 2880 }) // 1分鐘到2天
    }
    
    console.log(`🛒 購買決策開始: 觸發因素=${journey.trigger}, 研究強度=${journey.researchIntensity}`)
    
    // 1. 商品發現階段
    await this.simulateProductDiscovery(customerId, journey.trigger)
    
    // 2. 研究比較階段
    if (journey.researchIntensity !== 'low') {
      await this.simulateResearchPhase(customerId, journey.researchIntensity)
    }
    
    // 3. 決策階段
    const purchaseDecision = await this.simulatePurchaseDecision(customerId, journey)
    
    if (purchaseDecision.willPurchase) {
      await this.simulateCheckoutProcess(customerId, purchaseDecision.items)
    }
    
    return journey
  }
  
  private static async simulateProductDiscovery(customerId: string, trigger: string) {
    const discoveryMethods = {
      'need-based': ['search', 'category-browse'],
      'impulse': ['homepage-banner', 'product-recommendation'],
      'promotion': ['email-campaign', 'promotion-page'],
      'recommendation': ['related-products', 'ai-recommendation']
    }
    
    const method = faker.helpers.arrayElement(discoveryMethods[trigger])
    console.log(`🔍 商品發現: ${method}`)
    
    // 模擬不同發現方式的行為
    switch (method) {
      case 'search':
        await this.simulateSearchBehavior(customerId)
        break
      case 'category-browse':
        await this.simulateCategoryBrowsing(customerId)
        break
      // ... 其他方法
    }
  }
  
  private static async simulateCheckoutProcess(customerId: string, items: CartItem[]) {
    const checkoutFlow = {
      steps: [
        'cart-review',
        'shipping-info',
        'payment-method',
        'order-confirmation'
      ],
      abandonmentPoints: ['shipping-cost', 'payment-form', 'account-creation']
    }
    
    let currentStep = 0
    
    for (const step of checkoutFlow.steps) {
      console.log(`📋 結帳步驟: ${step}`)
      
      // 模擬每個步驟的放棄率
      const abandonmentRate = this.getAbandonmentRate(step)
      if (faker.datatype.boolean(abandonmentRate)) {
        console.log(`❌ 在 ${step} 步驟放棄結帳`)
        await this.trackAbandonmentEvent(customerId, step)
        return null
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)) // 模擬填寫時間
      currentStep++
    }
    
    // 完成購買
    const order = await this.completePurchase(customerId, items)
    console.log(`✅ 購買完成: 訂單 ${order.orderNumber}`)
    return order
  }
}
```

### 客戶服務互動模擬

#### 4. 客服對話場景
```typescript
class CustomerServiceSimulator {
  static async simulateCustomerServiceInteraction(customerId: string) {
    const inquiryTypes = [
      'product-question',    // 商品問題
      'order-status',        // 訂單狀態
      'return-request',      // 退貨申請
      'technical-issue',     // 技術問題
      'billing-inquiry',     // 帳單問題
      'general-feedback'     // 一般回饋
    ]
    
    const inquiryType = faker.helpers.arrayElement(inquiryTypes)
    const urgency = faker.helpers.weightedArrayElement([
      { weight: 60, value: 'low' },
      { weight: 30, value: 'medium' },
      { weight: 8, value: 'high' },
      { weight: 2, value: 'urgent' }
    ])
    
    console.log(`💬 客服諮詢: ${inquiryType}, 緊急度: ${urgency}`)
    
    // 創建對話
    const conversation = await ConversationApiService.create({
      customerId,
      subject: this.getSubjectByType(inquiryType),
      priority: urgency,
      channel: faker.helpers.arrayElement(['chat', 'email', 'phone'])
    })
    
    // 模擬對話流程
    await this.simulateConversationFlow(conversation.id, inquiryType)
    
    return conversation
  }
  
  private static async simulateConversationFlow(conversationId: string, inquiryType: string) {
    const flowTemplates = {
      'product-question': [
        { sender: 'customer', template: 'product-inquiry' },
        { sender: 'agent', template: 'product-information' },
        { sender: 'customer', template: 'follow-up-question' },
        { sender: 'agent', template: 'detailed-explanation' },
        { sender: 'customer', template: 'satisfaction-confirmation' }
      ],
      'return-request': [
        { sender: 'customer', template: 'return-request' },
        { sender: 'agent', template: 'return-policy-explanation' },
        { sender: 'customer', template: 'reason-explanation' },
        { sender: 'agent', template: 'return-approval' },
        { sender: 'customer', template: 'gratitude' }
      ]
      // ... 其他對話流程
    }
    
    const flow = flowTemplates[inquiryType] || flowTemplates['product-question']
    
    for (let i = 0; i < flow.length; i++) {
      const messageData = flow[i]
      const content = this.generateMessageByTemplate(messageData.template)
      
      await ConversationApiService.addMessage(conversationId, {
        sender: messageData.sender,
        content,
        timestamp: new Date()
      })
      
      // 模擬回應時間
      const responseTime = messageData.sender === 'agent' ? 
        faker.number.int({ min: 30, max: 300 }) :    // 客服 30秒-5分鐘
        faker.number.int({ min: 60, max: 1800 })     // 客戶 1分鐘-30分鐘
      
      await new Promise(resolve => setTimeout(resolve, responseTime * 1000))
    }
    
    // 結束對話
    await ConversationApiService.updateStatus(conversationId, 'resolved')
  }
}
```

## 行為分析模擬

### 客戶細分模擬
```typescript
class CustomerSegmentationSimulator {
  static generateCustomerPersonas() {
    return [
      {
        name: 'VIP大客戶',
        characteristics: {
          monthlySpending: { min: 10000, max: 50000 },
          purchaseFrequency: { min: 8, max: 15 },
          productCategories: ['3C電子', '精品配件'],
          loyaltyScore: { min: 80, max: 100 },
          serviceExpectation: 'premium'
        },
        behaviors: {
          browsingPattern: 'goal-oriented',
          decisionSpeed: 'fast',
          pricesensitivity: 'low',
          channelPreference: ['website', 'phone']
        }
      },
      {
        name: '價格敏感型客戶',
        characteristics: {
          monthlySpending: { min: 500, max: 2000 },
          purchaseFrequency: { min: 1, max: 3 },
          productCategories: ['家居用品', '食品飲料'],
          loyaltyScore: { min: 30, max: 60 },
          serviceExpectation: 'standard'
        },
        behaviors: {
          browsingPattern: 'comparison-heavy',
          decisionSpeed: 'slow',
          pricesensitivity: 'high',
          channelPreference: ['website', 'mobile-app']
        }
      }
      // ... 更多客戶人設
    ]
  }
  
  static async simulatePersonaBehavior(persona: CustomerPersona, customerId: string) {
    const customer = await CustomerApiService.getById(customerId)
    
    // 根據人設調整行為模式
    const behaviorModifiers = {
      browsingDuration: persona.behaviors.browsingPattern === 'comparison-heavy' ? 2.5 : 1.0,
      purchaseProbability: persona.characteristics.loyaltyScore / 100,
      averageOrderValue: (persona.characteristics.monthlySpending.min + persona.characteristics.monthlySpending.max) / 2 / persona.characteristics.purchaseFrequency.max
    }
    
    // 執行符合人設的行為模擬
    if (persona.behaviors.decisionSpeed === 'fast') {
      await this.simulateQuickPurchaseDecision(customerId, behaviorModifiers)
    } else {
      await this.simulateDeliberatedPurchaseDecision(customerId, behaviorModifiers)
    }
  }
}
```

### 季節性行為模擬
```typescript
class SeasonalBehaviorSimulator {
  static getSeasonalModifiers(date: Date) {
    const month = date.getMonth() + 1
    
    // 定義季節性修正係數
    const seasonalModifiers = {
      // 春節期間 (1-2月)
      chinese_new_year: {
        months: [1, 2],
        modifiers: {
          purchaseVolume: 1.8,
          giftPurchases: 3.0,
          categories: {
            '服飾配件': 2.0,
            '食品飲料': 2.5,
            '精品配件': 1.5
          }
        }
      },
      
      // 夏季促銷 (6-8月)
      summer_sale: {
        months: [6, 7, 8],
        modifiers: {
          purchaseVolume: 1.3,
          discountSensitivity: 1.5,
          categories: {
            '服飾配件': 1.8,
            '運動健身': 1.4
          }
        }
      },
      
      // 雙11購物節 (11月)
      double_eleven: {
        months: [11],
        modifiers: {
          purchaseVolume: 2.5,
          cartSize: 2.0,
          comparisonBehavior: 1.8
        }
      },
      
      // 聖誕節 (12月)
      christmas: {
        months: [12],
        modifiers: {
          purchaseVolume: 1.6,
          giftPurchases: 2.2,
          premiumProducts: 1.3
        }
      }
    }
    
    // 找到適用的季節性修正
    for (const [season, config] of Object.entries(seasonalModifiers)) {
      if (config.months.includes(month)) {
        return { season, ...config.modifiers }
      }
    }
    
    return { season: 'normal', purchaseVolume: 1.0 }
  }
  
  static async simulateSeasonalCustomerBehavior(customerId: string, date: Date) {
    const modifiers = this.getSeasonalModifiers(date)
    console.log(`🌱 季節性行為模擬: ${modifiers.season}`)
    
    // 根據季節調整購買行為
    if (modifiers.giftPurchases && modifiers.giftPurchases > 1) {
      await this.simulateGiftPurchaseBehavior(customerId, modifiers.giftPurchases)
    }
    
    if (modifiers.discountSensitivity && modifiers.discountSensitivity > 1) {
      await this.simulatePromotionHuntingBehavior(customerId, modifiers.discountSensitivity)
    }
  }
}
```

## 🔄 自動化測試腳本

### 持續行為模擬
```typescript
class ContinuousSimulationEngine {
  private simulationConfig = {
    customerCount: 100,
    dailyActiveUsers: 30,
    sessionDuration: { min: 300, max: 3600 }, // 5分鐘到1小時
    simulationInterval: 60000 // 每分鐘執行一次
  }
  
  private isRunning = false
  
  async startSimulation() {
    if (this.isRunning) {
      console.log('⚠️ 模擬已在運行中')
      return
    }
    
    this.isRunning = true
    console.log('🚀 啟動持續客戶行為模擬')
    
    // 生成基礎客戶群
    const customers = await this.initializeCustomerBase()
    
    // 開始模擬循環
    while (this.isRunning) {
      await this.simulateDailyActivity(customers)
      await new Promise(resolve => setTimeout(resolve, this.simulationConfig.simulationInterval))
    }
  }
  
  private async simulateDailyActivity(customers: Customer[]) {
    const activeCustomers = faker.helpers.arrayElements(
      customers, 
      this.simulationConfig.dailyActiveUsers
    )
    
    const activities = activeCustomers.map(async (customer) => {
      const activityType = faker.helpers.weightedArrayElement([
        { weight: 50, value: 'browse' },
        { weight: 25, value: 'purchase' },
        { weight: 15, value: 'customer-service' },
        { weight: 10, value: 'account-management' }
      ])
      
      try {
        switch (activityType) {
          case 'browse':
            await ReturningCustomerSimulator.simulateBrowsingBehavior(customer.id)
            break
          case 'purchase':
            await PurchaseDecisionSimulator.simulatePurchaseJourney(customer.id)
            break
          case 'customer-service':
            await CustomerServiceSimulator.simulateCustomerServiceInteraction(customer.id)
            break
          case 'account-management':
            await this.simulateAccountActivity(customer.id)
            break
        }
        
        console.log(`✅ 完成 ${customer.name} 的 ${activityType} 活動模擬`)
      } catch (error) {
        console.error(`❌ 客戶 ${customer.name} 活動模擬失敗:`, error)
      }
    })
    
    await Promise.all(activities)
  }
  
  stopSimulation() {
    this.isRunning = false
    console.log('⏹️ 停止客戶行為模擬')
  }
}

// 使用範例
const simulationEngine = new ContinuousSimulationEngine()

// 啟動模擬
simulationEngine.startSimulation()

// 在需要時停止
// simulationEngine.stopSimulation()
```

### Vue 元件整合
```vue
<template>
  <div class="customer-simulation-panel">
    <h3>客戶行為模擬控制台</h3>
    
    <div class="simulation-status">
      <div class="status-indicator" :class="{ active: isSimulating }">
        {{ isSimulating ? '模擬運行中' : '模擬已停止' }}
      </div>
      <div class="metrics">
        <span>活躍客戶: {{ activeCustomers }}</span>
        <span>今日訂單: {{ todayOrders }}</span>
        <span>客服對話: {{ conversations }}</span>
      </div>
    </div>
    
    <div class="control-buttons">
      <button 
        @click="toggleSimulation" 
        :class="{ 'stop': isSimulating, 'start': !isSimulating }"
      >
        {{ isSimulating ? '停止模擬' : '開始模擬' }}
      </button>
      
      <button @click="runSingleSimulation" :disabled="isSimulating">
        單次模擬
      </button>
      
      <button @click="generateTestScenario">
        生成測試場景
      </button>
    </div>
    
    <div class="recent-activities" v-if="recentActivities.length">
      <h4>最近活動</h4>
      <ul>
        <li 
          v-for="activity in recentActivities" 
          :key="activity.id"
          :class="activity.type"
        >
          {{ activity.timestamp }} - {{ activity.customer }} - {{ activity.description }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isSimulating = ref(false)
const activeCustomers = ref(0)
const todayOrders = ref(0)
const conversations = ref(0)
const recentActivities = ref([])

const simulationEngine = new ContinuousSimulationEngine()

const toggleSimulation = async () => {
  if (isSimulating.value) {
    simulationEngine.stopSimulation()
    isSimulating.value = false
  } else {
    await simulationEngine.startSimulation()
    isSimulating.value = true
  }
}

const runSingleSimulation = async () => {
  const customer = await generateCustomer()
  await ReturningCustomerSimulator.simulateReturnVisit(customer.id)
}
</script>
```

## 📈 效果監控

### 模擬品質指標
```typescript
interface SimulationMetrics {
  customerEngagement: {
    averageSessionDuration: number
    pageViewsPerSession: number
    bounceRate: number
  }
  
  conversionMetrics: {
    visitToPurchaseRate: number
    cartAbandonmentRate: number
    averageOrderValue: number
  }
  
  customerService: {
    inquiryVolume: number
    resolutionRate: number
    averageResponseTime: number
  }
  
  dataQuality: {
    consistencyScore: number
    completenessRate: number
    realismIndex: number
  }
}

class SimulationAnalytics {
  static async generateMetricsReport(): Promise<SimulationMetrics> {
    // 收集和分析模擬數據
    const metrics = await this.collectSimulationMetrics()
    
    // 評估數據品質
    const qualityScore = await this.assessDataQuality()
    
    return {
      ...metrics,
      dataQuality: qualityScore
    }
  }
}
```

## 相關文檔

- [前台測試環境設置](./front-stage-setup.md)
- [測試數據生成指南](./test-data-generation.md)
- [整合測試流程](./integration-testing.md)
- [後台客戶管理功能](../../02-development/architecture/component-map.md)

---

*最後更新: $(date "+%Y-%m-%d")*
*適用版本: front-stage-vue v1.0.0*