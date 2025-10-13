# E-commerce Admin Platform API 服務架構文檔

---
**文檔資訊**
- 最後更新：2025-07-22
- 版本：1.0.0
- 同步狀態：✅ 已與代碼同步
- 自動更新：✅ 啟用
---

> 本文檔詳細說明 admin-platform-vue 專案的 API 服務層架構設計，包含 12 個專業化服務類、工廠模式實現、基礎抽象類設計及最佳實踐指南。

## 1. API 服務架構概覽

### 1.1 服務層設計原則
- **面向對象設計**：每個業務域有專門的服務類
- **統一基礎類**：所有服務繼承 BaseApiService
- **工廠模式**：統一的服務實例管理
- **類型安全**：完整的 TypeScript 支持
- **錯誤處理**：統一的錯誤處理機制
- **可測試性**：支持依賴注入和模擬測試

### 1.2 架構層次圖
```
                    Service Factory (工廠層)
                           ↓
     ┌─────────────────────────────────────────────────────┐
     │              Specific Services (服務層)              │
     ├─────────────────────────────────────────────────────┤
     │  UserApiService │ ProductApiService │ OrderApiService │
     │ CustomerApiService │ NotificationApiService │ ...     │
     └─────────────────────────────────────────────────────┘
                           ↓
     ┌─────────────────────────────────────────────────────┐
     │              Base API Service (基礎層)               │
     ├─────────────────────────────────────────────────────┤
     │  BaseApiService + QueryOptions + PaginationInfo    │
     └─────────────────────────────────────────────────────┘
                           ↓
     ┌─────────────────────────────────────────────────────┐
     │               Supabase Client (數據層)              │
     └─────────────────────────────────────────────────────┘
```

### 1.3 服務統計概覽
| 服務分類 | 服務數量 | 主要功能 | 複雜度等級 |
|----------|----------|----------|------------|
| **用戶管理** | 3個 | 用戶、角色、權限 | ⭐⭐⭐ |
| **業務核心** | 4個 | 客戶、產品、訂單、庫存 | ⭐⭐⭐⭐ |
| **客服系統** | 2個 | 對話、客服代理 | ⭐⭐⭐⭐ |
| **通知系統** | 3個 | 通知、群組通知、監控 | ⭐⭐⭐⭐⭐ |
| **分析系統** | 4個 | 訂單、客戶、支援、活動分析 | ⭐⭐⭐⭐ |
| **AI 增強** | 2個 | Prompt模板、AI警示增強 | ⭐⭐⭐⭐⭐ |
| **總計** | **18個** | **完整企業級服務** | **⭐⭐⭐⭐⭐** |

## 2. 基礎架構設計

### 2.1 BaseApiService 抽象類
```typescript
// src/api/services/base/BaseApiService.ts
export abstract class BaseApiService<T extends BaseEntity> {
  protected supabase: SupabaseClient
  protected tableName: string
  
  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase
    this.tableName = tableName
  }

  // CRUD 基礎操作
  async findAll(options?: QueryOptions<T>): Promise<T[]>
  async findById(id: string): Promise<T | null>
  async create(data: Partial<T>): Promise<T>
  async update(id: string, data: Partial<T>): Promise<T>
  async delete(id: string): Promise<void>
  
  // 分頁查詢
  async findWithPagination(options: QueryOptions<T>): Promise<{
    data: T[]
    pagination: PaginationInfo
  }>
  
  // 查詢構建器
  protected buildQuery(options?: QueryOptions<T>): QueryBuilder<T>
  
  // 錯誤處理
  protected handleError(error: unknown): never
}
```

### 2.2 核心類型定義
```typescript
// src/api/services/base/types.ts

// 基礎實體接口
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// 查詢選項
export interface QueryOptions<T> {
  select?: string[]
  where?: Partial<T>
  orderBy?: { field: keyof T; direction: 'asc' | 'desc' }[]
  limit?: number
  offset?: number
  include?: string[]
}

// 分頁信息
export interface PaginationInfo {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 查詢構建器
export interface QueryBuilder<T> {
  select(columns?: string[]): QueryBuilder<T>
  eq(column: keyof T, value: any): QueryBuilder<T>
  in(column: keyof T, values: any[]): QueryBuilder<T>
  like(column: keyof T, pattern: string): QueryBuilder<T>
  order(column: keyof T, ascending?: boolean): QueryBuilder<T>
  limit(count: number): QueryBuilder<T>
  range(from: number, to: number): QueryBuilder<T>
}
```

### 2.3 錯誤處理系統
```typescript
// 統一錯誤處理
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 基礎類中的錯誤處理
protected handleError(error: unknown): never {
  if (error instanceof PostgrestError) {
    throw new ApiError(
      error.message,
      400,
      error.code || 'DATABASE_ERROR',
      error.details
    )
  }
  throw new ApiError('Unknown error occurred', 500, 'UNKNOWN_ERROR')
}
```

## 3. 服務層實現詳解

### 3.1 用戶管理服務群 (3個服務)

#### UserApiService (用戶基礎服務)
```typescript
// src/api/services/UserApiService.ts
export class UserApiService extends BaseApiService<User> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'users')
  }

  // 用戶專用方法
  async findByEmail(email: string): Promise<User | null>
  async updateProfile(id: string, profile: UserProfile): Promise<User>
  async changePassword(id: string, newPassword: string): Promise<void>
  async getUserRoles(userId: string): Promise<Role[]>
  async assignRole(userId: string, roleId: string): Promise<void>
  async revokeRole(userId: string, roleId: string): Promise<void>
  
  // 用戶狀態管理
  async activateUser(id: string): Promise<void>
  async deactivateUser(id: string): Promise<void>
  async getUserActivity(userId: string): Promise<UserActivity[]>
}
```

#### RoleApiService (角色管理服務)
```typescript
// src/api/services/RoleApiService.ts
export class RoleApiService extends BaseApiService<Role> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'roles')
  }

  // 角色權限管理
  async getRolePermissions(roleId: string): Promise<Permission[]>
  async assignPermission(roleId: string, permissionId: string): Promise<void>
  async revokePermission(roleId: string, permissionId: string): Promise<void>
  
  // 角色用戶管理
  async getRoleUsers(roleId: string): Promise<User[]>
  async getUsersWithRole(roleName: string): Promise<User[]>
  
  // 權限檢查
  async hasPermission(userId: string, permission: string): Promise<boolean>
  async getUserPermissions(userId: string): Promise<Permission[]>
}
```

### 3.2 業務核心服務群 (4個服務)

#### CustomerApiService (客戶管理服務)
```typescript
// src/api/services/CustomerApiService.ts
export class CustomerApiService extends BaseApiService<Customer> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'customers')
  }

  // 客戶分析功能
  async getCustomerAnalytics(customerId: string): Promise<CustomerAnalytics>
  async getRFMAnalysis(customerId: string): Promise<RFMScore>
  async getCustomerLifecycle(customerId: string): Promise<LifecycleStage>
  
  // 客戶訂單關聯
  async getCustomerOrders(
    customerId: string, 
    options?: QueryOptions<Order>
  ): Promise<Order[]>
  
  // 客戶價值分析
  async getCustomerLTV(customerId: string): Promise<number>
  async getCustomerSegment(customerId: string): Promise<string>
  
  // 批量操作
  async bulkUpdateSegment(customerIds: string[], segment: string): Promise<void>
  async exportCustomerData(options?: ExportOptions): Promise<ExportResult>
}
```

#### ProductApiService (產品管理服務)
```typescript
// src/api/services/ProductApiService.ts
export class ProductApiService extends BaseApiService<Product> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'products')
  }

  // 產品庫存管理
  async getProductStock(productId: string): Promise<InventoryStatus>
  async updateStock(productId: string, quantity: number): Promise<void>
  async reserveStock(productId: string, quantity: number): Promise<boolean>
  async releaseStock(productId: string, quantity: number): Promise<void>
  
  // 產品分類管理
  async getProductsByCategory(categoryId: string): Promise<Product[]>
  async updateProductCategory(productId: string, categoryId: string): Promise<void>
  
  // 產品性能分析
  async getProductPerformance(productId: string): Promise<ProductPerformance>
  async getTopSellingProducts(limit?: number): Promise<Product[]>
  async getLowStockProducts(threshold?: number): Promise<Product[]>
  
  // 批量操作
  async bulkUpdatePrices(updates: PriceUpdate[]): Promise<void>
  async bulkImportProducts(products: ProductImport[]): Promise<ImportResult>
}
```

#### OrderApiService (訂單管理服務)
```typescript
// src/api/services/OrderApiService.ts
export class OrderApiService extends BaseApiService<Order> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'orders')
  }

  // 訂單狀態管理
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>
  async cancelOrder(orderId: string, reason: string): Promise<void>
  async refundOrder(orderId: string, amount?: number): Promise<Refund>
  
  // 訂單項目管理
  async getOrderItems(orderId: string): Promise<OrderItem[]>
  async addOrderItem(orderId: string, item: OrderItemCreate): Promise<OrderItem>
  async updateOrderItem(itemId: string, updates: Partial<OrderItem>): Promise<OrderItem>
  async removeOrderItem(itemId: string): Promise<void>
  
  // 訂單分析
  async getOrderAnalytics(dateRange?: DateRange): Promise<OrderAnalytics>
  async getRevenueAnalytics(dateRange?: DateRange): Promise<RevenueAnalytics>
  async getOrderTrends(period: 'daily' | 'weekly' | 'monthly'): Promise<TrendData[]>
  
  // 實時訂單
  async getRecentOrders(limit?: number): Promise<Order[]>
  async subscribeToOrderUpdates(callback: (order: Order) => void): Promise<() => void>
}
```

### 3.3 客服系統服務群 (2個服務)

#### ConversationApiService (對話管理服務)
```typescript
// src/api/services/ConversationApiService.ts
export class ConversationApiService extends BaseApiService<Conversation> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'conversations')
  }

  // 對話消息管理
  async getMessages(conversationId: string): Promise<Message[]>
  async sendMessage(conversationId: string, message: MessageCreate): Promise<Message>
  async markMessageAsRead(messageId: string): Promise<void>
  async markConversationAsRead(conversationId: string): Promise<void>
  
  // 對話狀態管理
  async assignAgent(conversationId: string, agentId: string): Promise<void>
  async closeConversation(conversationId: string): Promise<void>
  async reopenConversation(conversationId: string): Promise<void>
  
  // 對話分析
  async getConversationAnalytics(dateRange?: DateRange): Promise<ConversationAnalytics>
  async getResponseTimeMetrics(): Promise<ResponseTimeMetrics>
  async getAgentPerformance(agentId: string): Promise<AgentPerformance>
  
  // 實時功能
  async subscribeToConversation(
    conversationId: string, 
    callback: (message: Message) => void
  ): Promise<() => void>
}
```

#### AgentApiService (客服代理服務)
```typescript
// src/api/services/AgentApiService.ts
export class AgentApiService extends BaseApiService<Agent> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'agents')
  }

  // 代理狀態管理
  async setAgentStatus(agentId: string, status: AgentStatus): Promise<void>
  async getAgentWorkload(agentId: string): Promise<AgentWorkload>
  async assignConversation(agentId: string, conversationId: string): Promise<void>
  
  // 代理性能
  async getAgentMetrics(agentId: string, dateRange?: DateRange): Promise<AgentMetrics>
  async getAgentActivity(agentId: string): Promise<AgentActivity[]>
  async updateAgentCapacity(agentId: string, capacity: number): Promise<void>
  
  // 代理排班
  async getAgentSchedule(agentId: string): Promise<AgentSchedule[]>
  async updateAgentSchedule(agentId: string, schedule: ScheduleUpdate[]): Promise<void>
  
  // 團隊管理
  async getAvailableAgents(): Promise<Agent[]>
  async getAgentTeam(teamId: string): Promise<Agent[]>
}
```

### 3.4 通知系統服務群 (3個服務) - 最複雜

#### NotificationApiService (核心通知服務)
```typescript
// src/api/services/NotificationApiService.ts
export class NotificationApiService extends BaseApiService<Notification> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'notifications')
  }

  // 通知發送
  async sendNotification(notification: NotificationCreate): Promise<Notification>
  async sendBulkNotification(notifications: NotificationCreate[]): Promise<Notification[]>
  async sendToUser(userId: string, notification: NotificationCreate): Promise<Notification>
  async sendToRole(roleId: string, notification: NotificationCreate): Promise<Notification[]>
  
  // 通知狀態管理
  async markAsRead(notificationId: string): Promise<void>
  async markAllAsRead(userId: string): Promise<void>
  async dismissNotification(notificationId: string): Promise<void>
  
  // 通知查詢
  async getUserNotifications(userId: string, options?: QueryOptions<Notification>): Promise<Notification[]>
  async getUnreadCount(userId: string): Promise<number>
  async getNotificationsByType(type: NotificationType): Promise<Notification[]>
  
  // 通知設置
  async getUserPreferences(userId: string): Promise<NotificationPreference>
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreference>): Promise<void>
  
  // 實時通知
  async subscribeToUserNotifications(
    userId: string, 
    callback: (notification: Notification) => void
  ): Promise<() => void>
}
```

#### GroupNotificationApiService (群組通知服務)
```typescript
// src/api/services/GroupNotificationApiService.ts
export class GroupNotificationApiService extends BaseApiService<GroupNotification> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'group_notifications')
  }

  // 群組通知發送
  async sendToGroup(groupId: string, notification: NotificationCreate): Promise<GroupNotification>
  async sendToMultipleGroups(groupIds: string[], notification: NotificationCreate): Promise<GroupNotification[]>
  async sendToDepartment(department: string, notification: NotificationCreate): Promise<GroupNotification>
  
  // 群組管理
  async createNotificationGroup(group: NotificationGroupCreate): Promise<NotificationGroup>
  async addUserToGroup(groupId: string, userId: string): Promise<void>
  async removeUserFromGroup(groupId: string, userId: string): Promise<void>
  async getGroupMembers(groupId: string): Promise<User[]>
  
  // 群組通知統計
  async getGroupNotificationStats(groupId: string): Promise<GroupNotificationStats>
  async getDeliveryReport(notificationId: string): Promise<DeliveryReport>
  
  // 批量操作
  async bulkUpdateGroupMembership(updates: GroupMembershipUpdate[]): Promise<void>
}
```

#### MonitoredNotificationService (通知監控服務)
```typescript
// src/api/services/MonitoredNotificationService.ts
export class MonitoredNotificationService {
  constructor(private supabase: SupabaseClient) {}

  // 通知監控
  async getDeliveryMetrics(dateRange?: DateRange): Promise<DeliveryMetrics>
  async getFailureReport(): Promise<NotificationFailure[]>
  async getPerformanceMetrics(): Promise<NotificationPerformance>
  
  // 通知健康檢查
  async healthCheck(): Promise<HealthCheckResult>
  async validateNotificationRules(): Promise<ValidationResult[]>
  async getSystemStatus(): Promise<NotificationSystemStatus>
  
  // 通知分析
  async getEngagementAnalytics(): Promise<EngagementAnalytics>
  async getNotificationTrends(): Promise<NotificationTrend[]>
  async getUserEngagementScore(userId: string): Promise<number>
  
  // 自動化規則
  async createAutomationRule(rule: AutomationRuleCreate): Promise<AutomationRule>
  async updateAutomationRule(ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule>
  async executeRule(ruleId: string, context: any): Promise<RuleExecutionResult>
}
```

## 4. 服務工廠模式實現

### 4.1 ServiceFactory 設計
```typescript
// src/api/services/ServiceFactory.ts
export class ServiceFactory {
  private services: Map<string, any> = new Map()
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // 泛型服務獲取方法
  private getService<T>(key: string, ServiceClass: new (supabase: SupabaseClient) => T): T {
    if (!this.services.has(key)) {
      this.services.set(key, new ServiceClass(this.supabase))
    }
    return this.services.get(key) as T
  }

  // 具體服務獲取方法
  getUserService(): UserApiService {
    return this.getService('user', UserApiService)
  }

  getProductService(): ProductApiService {
    return this.getService('product', ProductApiService)
  }

  getOrderService(): OrderApiService {
    return this.getService('order', OrderApiService)
  }

  getCustomerService(): CustomerApiService {
    return this.getService('customer', CustomerApiService)
  }

  getNotificationService(): NotificationApiService {
    return this.getService('notification', NotificationApiService)
  }

  getCampaignAnalyticsService(): CampaignAnalyticsApiService {
    return this.getService('campaignAnalytics', CampaignAnalyticsApiService)
  }

  getAIPromptTemplateService(): AIPromptTemplateService {
    return this.getService('aiPromptTemplate', AIPromptTemplateService)
  }

  getAIEnhancedAlertService(): AIEnhancedAlertService {
    return this.getService('aiEnhancedAlert', AIEnhancedAlertService)
  }

  // ... 其他服務獲取方法

  // 批量初始化
  initializeAllServices(): void {
    this.getUserService()
    this.getProductService()
    this.getOrderService()
    // ... 初始化所有服務
  }

  // 清理資源
  dispose(): void {
    this.services.clear()
  }
}
```

### 4.2 服務實例管理
```typescript
// src/api/services/index.ts

// 預設服務工廠實例
import { supabase } from '@/lib/supabase'
import { ServiceFactory } from './ServiceFactory'

export const defaultServiceFactory = new ServiceFactory(supabase)

// 快捷方法取得服務實例
export const getUserService = () => defaultServiceFactory.getUserService()
export const getProductService = () => defaultServiceFactory.getProductService()
export const getOrderService = () => defaultServiceFactory.getOrderService()
export const getCustomerService = () => defaultServiceFactory.getCustomerService()

// 通知服務快捷方法
export const getNotificationService = () => new NotificationService(supabase)
export const getNotificationApiService = () => new NotificationApiService(supabase)
export const getGroupNotificationApiService = () => new GroupNotificationApiService(supabase)
export const getMonitoredNotificationService = () => new MonitoredNotificationService(supabase)

// 客服服務快捷方法
export const getConversationService = () => defaultServiceFactory.getConversationService()
export const getAgentService = () => defaultServiceFactory.getAgentService()

// 角色權限服務快捷方法
export const getRoleService = () => defaultServiceFactory.getRoleService()

// Campaign 和 AI 服務快捷方法
export const getCampaignAnalyticsService = () => defaultServiceFactory.getCampaignAnalyticsService()
export const getAIPromptTemplateService = () => defaultServiceFactory.getAIPromptTemplateService()
export const getAIEnhancedAlertService = () => defaultServiceFactory.getAIEnhancedAlertService()
```

## 5. 服務使用模式

### 5.1 在 Composables 中使用
```typescript
// src/composables/useCustomer.ts
export function useCustomer() {
  const customerService = getCustomerService()
  
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCustomers = async (options?: QueryOptions<Customer>) => {
    loading.value = true
    error.value = null
    
    try {
      customers.value = await customerService.findAll(options)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  const createCustomer = async (customerData: Partial<Customer>) => {
    try {
      const newCustomer = await customerService.create(customerData)
      customers.value.push(newCustomer)
      return newCustomer
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Create failed'
      throw err
    }
  }

  return {
    customers: readonly(customers),
    loading: readonly(loading),
    error: readonly(error),
    fetchCustomers,
    createCustomer
  }
}
```

### 5.2 在組件中使用
```vue
<template>
  <div>
    <CustomerList 
      :customers="customers"
      :loading="loading"
      @create="handleCreate"
      @update="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { useCustomer } from '@/composables/useCustomer'

const {
  customers,
  loading,
  error,
  fetchCustomers,
  createCustomer
} = useCustomer()

onMounted(() => {
  fetchCustomers()
})

const handleCreate = async (customerData: Partial<Customer>) => {
  await createCustomer(customerData)
}

const handleUpdate = async (id: string, updates: Partial<Customer>) => {
  // 使用服務進行更新操作
}
</script>
```

### 5.3 與 Vue Query 整合
```typescript
// src/composables/queries/useCustomerQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { getCustomerService } from '@/api/services'

export function useCustomerQueries() {
  const customerService = getCustomerService()
  const queryClient = useQueryClient()

  // 查詢所有客戶
  const useCustomersQuery = (options?: QueryOptions<Customer>) => {
    return useQuery({
      queryKey: ['customers', options],
      queryFn: () => customerService.findAll(options),
      staleTime: 5 * 60 * 1000, // 5分鐘
    })
  }

  // 創建客戶 Mutation
  const useCreateCustomerMutation = () => {
    return useMutation({
      mutationFn: (data: Partial<Customer>) => customerService.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] })
      },
    })
  }

  // 更新客戶 Mutation
  const useUpdateCustomerMutation = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
        customerService.update(id, data),
      onSuccess: (updatedCustomer) => {
        queryClient.setQueryData(['customer', updatedCustomer.id], updatedCustomer)
        queryClient.invalidateQueries({ queryKey: ['customers'] })
      },
    })
  }

  return {
    useCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
  }
}
```

## 6. 錯誤處理與調試

### 6.1 統一錯誤處理
```typescript
// src/utils/error-handler.ts
export class ApiErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error
    }
    
    if (error instanceof PostgrestError) {
      return new ApiError(
        error.message,
        400,
        error.code || 'DATABASE_ERROR',
        error.details
      )
    }
    
    if (error instanceof AuthError) {
      return new ApiError(
        'Authentication failed',
        401,
        'AUTH_ERROR',
        error.message
      )
    }
    
    // 未知錯誤
    return new ApiError(
      'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      error
    )
  }

  static async logError(error: ApiError, context: string): Promise<void> {
    console.error(`[${context}] ${error.code}: ${error.message}`, error.details)
    
    // 可以在這裡添加錯誤報告服務
    // await sendErrorReport(error, context)
  }
}
```

### 6.2 調試和監控
```typescript
// src/utils/api-logger.ts
export class ApiLogger {
  static logRequest(service: string, method: string, params?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${service}.${method}`, params)
    }
  }

  static logResponse(service: string, method: string, response: any, duration: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${service}.${method} completed in ${duration}ms`, response)
    }
  }

  static logError(service: string, method: string, error: Error): void {
    console.error(`[API] ${service}.${method} failed:`, error)
  }
}

// 在 BaseApiService 中使用
protected async executeWithLogging<T>(
  method: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  ApiLogger.logRequest(this.constructor.name, method)
  
  try {
    const result = await operation()
    ApiLogger.logResponse(this.constructor.name, method, result, Date.now() - start)
    return result
  } catch (error) {
    ApiLogger.logError(this.constructor.name, method, error as Error)
    throw this.handleError(error)
  }
}
```

## 7. 性能優化策略

### 7.1 查詢優化
```typescript
// 查詢優化示例
export class OptimizedCustomerService extends CustomerApiService {
  // 使用索引優化的查詢
  async findByEmailOptimized(email: string): Promise<Customer | null> {
    return this.executeWithLogging('findByEmailOptimized', async () => {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    })
  }

  // 批量查詢優化
  async findByIdsOptimized(ids: string[]): Promise<Customer[]> {
    if (ids.length === 0) return []
    
    return this.executeWithLogging('findByIdsOptimized', async () => {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .in('id', ids)
      
      if (error) throw error
      return data || []
    })
  }

  // 分頁查詢優化
  async findWithOptimizedPagination(
    options: QueryOptions<Customer> & { pageSize: number; page: number }
  ): Promise<{ data: Customer[]; pagination: PaginationInfo }> {
    const { pageSize, page } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    return this.executeWithLogging('findWithOptimizedPagination', async () => {
      // 並行執行數據查詢和計數查詢
      const [dataResult, countResult] = await Promise.all([
        this.supabase
          .from(this.tableName)
          .select('*')
          .range(from, to),
        this.supabase
          .from(this.tableName)
          .select('*', { count: 'exact', head: true })
      ])

      if (dataResult.error) throw dataResult.error
      if (countResult.error) throw countResult.error

      const total = countResult.count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: dataResult.data || [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      }
    })
  }
}
```

### 7.2 緩存策略
```typescript
// src/utils/api-cache.ts
export class ApiCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5分鐘

  set(key: string, data: any, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, { data, expiry })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  clear(): void {
    this.cache.clear()
  }

  generateKey(service: string, method: string, params?: any): string {
    return `${service}:${method}:${JSON.stringify(params || {})}`
  }
}

// 在服務中使用緩存
export class CachedCustomerService extends CustomerApiService {
  private cache = new ApiCache()

  async findAllCached(options?: QueryOptions<Customer>): Promise<Customer[]> {
    const cacheKey = this.cache.generateKey('CustomerService', 'findAll', options)
    const cached = this.cache.get<Customer[]>(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const result = await this.findAll(options)
    this.cache.set(cacheKey, result, 2 * 60 * 1000) // 2分鐘緩存
    return result
  }
}
```

## 8. 測試策略

### 8.1 單元測試
```typescript
// src/api/services/__tests__/CustomerApiService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomerApiService } from '../CustomerApiService'
import { mockSupabaseClient } from '../__tests__/test-mocks'

describe('CustomerApiService', () => {
  let service: CustomerApiService
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = mockSupabaseClient()
    service = new CustomerApiService(mockSupabase)
  })

  describe('findAll', () => {
    it('should return all customers', async () => {
      const mockCustomers = [
        { id: '1', name: 'Customer 1', email: 'test1@example.com' },
        { id: '2', name: 'Customer 2', email: 'test2@example.com' }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: mockCustomers,
          error: null
        })
      })

      const result = await service.findAll()

      expect(result).toEqual(mockCustomers)
      expect(mockSupabase.from).toHaveBeenCalledWith('customers')
    })

    it('should handle errors properly', async () => {
      const mockError = new Error('Database error')
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: null,
          error: mockError
        })
      })

      await expect(service.findAll()).rejects.toThrow('Database error')
    })
  })

  describe('create', () => {
    it('should create a new customer', async () => {
      const newCustomer = { name: 'New Customer', email: 'new@example.com' }
      const createdCustomer = { id: '3', ...newCustomer }

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: createdCustomer,
              error: null
            })
          })
        })
      })

      const result = await service.create(newCustomer)

      expect(result).toEqual(createdCustomer)
    })
  })
})
```

### 8.2 整合測試
```typescript
// src/api/services/__tests__/integration/CustomerService.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { CustomerApiService } from '../../CustomerApiService'

describe('CustomerApiService Integration Tests', () => {
  let service: CustomerApiService
  let testCustomerId: string

  beforeAll(async () => {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )
    service = new CustomerApiService(supabase)
  })

  afterAll(async () => {
    // 清理測試數據
    if (testCustomerId) {
      await service.delete(testCustomerId)
    }
  })

  it('should perform CRUD operations successfully', async () => {
    // Create
    const newCustomer = {
      name: 'Test Customer',
      email: 'test@integration.com',
      phone: '1234567890'
    }

    const created = await service.create(newCustomer)
    testCustomerId = created.id

    expect(created).toMatchObject(newCustomer)
    expect(created.id).toBeDefined()

    // Read
    const found = await service.findById(created.id)
    expect(found).toMatchObject(newCustomer)

    // Update
    const updates = { name: 'Updated Customer' }
    const updated = await service.update(created.id, updates)
    expect(updated.name).toBe('Updated Customer')

    // Delete
    await service.delete(created.id)
    const deleted = await service.findById(created.id)
    expect(deleted).toBeNull()
  })
})
```

## 9. 部署與監控

### 9.1 環境配置
```typescript
// src/config/api.ts
export const apiConfig = {
  development: {
    logLevel: 'debug',
    enableCache: false,
    requestTimeout: 10000,
    retryAttempts: 3,
  },
  staging: {
    logLevel: 'info',
    enableCache: true,
    requestTimeout: 8000,
    retryAttempts: 2,
  },
  production: {
    logLevel: 'error',
    enableCache: true,
    requestTimeout: 5000,
    retryAttempts: 1,
  }
}

export const getCurrentConfig = () => {
  return apiConfig[process.env.NODE_ENV as keyof typeof apiConfig] || apiConfig.development
}
```

### 9.2 性能監控
```typescript
// src/utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()

  recordApiCall(service: string, method: string, duration: number): void {
    const key = `${service}.${method}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(duration)
  }

  getMetrics(service?: string): Record<string, {
    count: number
    avgDuration: number
    minDuration: number
    maxDuration: number
  }> {
    const result: Record<string, any> = {}

    for (const [key, durations] of this.metrics.entries()) {
      if (service && !key.startsWith(service)) continue

      result[key] = {
        count: durations.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
      }
    }

    return result
  }

  reset(): void {
    this.metrics.clear()
  }
}
```

## 10. 最佳實踐與規範

### 10.1 代碼規範
```typescript
// ✅ 良好的服務方法設計
export class ProductApiService extends BaseApiService<Product> {
  // 1. 方法命名清晰明確
  async findProductsByCategoryId(categoryId: string): Promise<Product[]> {
    // 2. 參數驗證
    if (!categoryId) {
      throw new ApiError('Category ID is required', 400, 'INVALID_PARAMS')
    }

    // 3. 使用統一的錯誤處理
    return this.executeWithLogging('findProductsByCategoryId', async () => {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('category_id', categoryId)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    })
  }

  // 4. 複雜操作拆分為多個小方法
  async createProductWithInventory(
    productData: Partial<Product>,
    initialStock: number
  ): Promise<{ product: Product; inventory: Inventory }> {
    // 使用數據庫事務
    const { data, error } = await this.supabase.rpc('create_product_with_inventory', {
      product_data: productData,
      initial_stock: initialStock
    })

    if (error) throw this.handleError(error)
    return data
  }
}
```

### 10.2 性能最佳實踐
```typescript
// ✅ 性能優化技巧
export class OptimizedOrderService extends OrderApiService {
  // 1. 使用適當的查詢選擇
  async getOrderSummary(orderId: string): Promise<OrderSummary> {
    return this.executeWithLogging('getOrderSummary', async () => {
      // 只選擇需要的欄位
      const { data, error } = await this.supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          customer:customers(name, email),
          items:order_items(quantity, price, product:products(name))
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      return this.transformToOrderSummary(data)
    })
  }

  // 2. 批量操作優化
  async bulkUpdateOrderStatus(
    orderIds: string[],
    status: OrderStatus
  ): Promise<void> {
    if (orderIds.length === 0) return

    return this.executeWithLogging('bulkUpdateOrderStatus', async () => {
      const { error } = await this.supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', orderIds)

      if (error) throw error
    })
  }

  // 3. 分頁查詢優化
  async getOrdersWithOptimizedPagination(options: {
    page: number
    pageSize: number
    status?: OrderStatus
    customerId?: string
  }): Promise<{ orders: Order[]; pagination: PaginationInfo }> {
    const { page, pageSize, status, customerId } = options
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = this.supabase.from('orders').select('*', { count: 'exact' })
    
    if (status) query = query.eq('status', status)
    if (customerId) query = query.eq('customer_id', customerId)

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      orders: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNext: page * pageSize < (count || 0),
        hasPrev: page > 1,
      },
    }
  }
}
```

### 10.3 安全性最佳實踐
```typescript
// ✅ 安全性考慮
export class SecureUserService extends UserApiService {
  // 1. 輸入驗證和清理
  async createUser(userData: Partial<User>): Promise<User> {
    // 驗證必要欄位
    this.validateUserData(userData)
    
    // 清理和格式化數據
    const sanitizedData = this.sanitizeUserData(userData)
    
    return super.create(sanitizedData)
  }

  private validateUserData(userData: Partial<User>): void {
    if (!userData.email || !this.isValidEmail(userData.email)) {
      throw new ApiError('Valid email is required', 400, 'INVALID_EMAIL')
    }
    
    if (userData.phone && !this.isValidPhone(userData.phone)) {
      throw new ApiError('Valid phone number is required', 400, 'INVALID_PHONE')
    }
  }

  private sanitizeUserData(userData: Partial<User>): Partial<User> {
    return {
      ...userData,
      email: userData.email?.toLowerCase().trim(),
      name: userData.name?.trim(),
      // 移除不安全的 HTML
      bio: userData.bio ? this.stripHtml(userData.bio) : undefined,
    }
  }

  // 2. 敏感操作需要額外驗證
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    // 檢查權限
    if (userId === currentUserId) {
      throw new ApiError('Cannot delete your own account', 403, 'SELF_DELETE_FORBIDDEN')
    }

    // 檢查用戶是否存在
    const user = await this.findById(userId)
    if (!user) {
      throw new ApiError('User not found', 404, 'USER_NOT_FOUND')
    }

    // 軟刪除而不是硬刪除
    await this.update(userId, {
      deleted_at: new Date().toISOString(),
      email: `deleted_${Date.now()}_${user.email}`, // 釋放 email 唯一約束
    })
  }
}
```

---

**相關文檔**
- [架構設計文檔](./architecture.md)
- [組件架構文檔](./component-map.md)
- [圖表系統架構](./CHART_ARCHITECTURE.md)
- [錯誤處理指南](../../05-reference/standards/error-handling-guide.md)
- [技術堆疊詳情](../../04-guides/project-info/vue-tech-stack.md)

**版本歷史**
- v1.0.0 (2025-07-22): 初始版本，完整的 API 服務架構文檔