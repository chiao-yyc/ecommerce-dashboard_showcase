// 測試用 Mock 型別定義
import type { MockedFunction } from 'vitest'
import { vi } from 'vitest'
import type { User, DbUser, Session, ApiResponse } from '@/types'
import { ConversationStatus } from '@/types'

// Mock Supabase Auth 介面
export interface MockSupabaseAuth {
  getUser: MockedFunction<any>
  onAuthStateChange: MockedFunction<any>
  signInWithPassword: MockedFunction<any>
  signOut: MockedFunction<any>
  signUp: MockedFunction<any>
  signInWithOAuth: MockedFunction<any>
  getSession: MockedFunction<any>
}

// Mock Supabase Functions 介面
export interface MockSupabaseFunctions {
  invoke: MockedFunction<any>
}

// Mock Supabase 查詢建構器
export interface MockSupabaseQueryBuilder {
  select?: MockedFunction<any>
  insert?: MockedFunction<any>
  update?: MockedFunction<any>
  delete?: MockedFunction<any>
  eq?: MockedFunction<any>
  neq?: MockedFunction<any>
  like?: MockedFunction<any>
  ilike?: MockedFunction<any>
  or?: MockedFunction<any>
  and?: MockedFunction<any>
  in?: MockedFunction<any>
  contains?: MockedFunction<any>
  order?: MockedFunction<any>
  range?: MockedFunction<any>
  limit?: MockedFunction<any>
  single?: MockedFunction<any>
  match?: MockedFunction<any>
  upsert?: MockedFunction<any>
}

// Mock Supabase Channel 介面
export interface MockSupabaseChannel {
  on: MockedFunction<any>
  subscribe: MockedFunction<any>
  unsubscribe?: MockedFunction<any>
}

// Mock Supabase Client 主介面
export interface MockSupabaseClient {
  auth: MockSupabaseAuth
  functions: MockSupabaseFunctions
  from: MockedFunction<(table: string) => MockSupabaseQueryBuilder>
  channel?: MockedFunction<(name: string) => MockSupabaseChannel>
  removeChannel?: MockedFunction<any>
  rpc?: MockedFunction<any>
}

// Mock User 相關函數型別
export interface MockGetUser {
  (userId: string, supabaseImpl?: any): Promise<ApiResponse<User | null>>
}

export interface MockUpdateUser {
  (
    userId: string,
    updates: Partial<DbUser>,
    supabaseImpl?: any,
  ): Promise<ApiResponse<User>>
}

export interface MockDeleteUser {
  (userId: string): Promise<ApiResponse<User | null>>
}

// Mock User Composable 回傳型別
export interface MockUserComposable {
  user: { value: User | null }
  loading: { value: boolean }
  error: { value: string | null }
  loadUser: MockedFunction<any>
  updateUser: MockedFunction<any>
  deleteUser: MockedFunction<any>
}

// Mock Auth 回應型別
export interface MockAuthResponse {
  data: {
    user: User | null
    session: Session | null
  }
  error: any
}

// Mock 錯誤型別
export interface MockSupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// Mock Agent 相關型別
export interface MockAgentDetail {
  user_id: string
  full_name: string
  display_name: string
  email: string
  avatar_url: string
  current_load: number
  is_online: boolean
  is_idle: boolean
  last_assigned_at: string
  status: string
}

// Mock Conversation 型別
export interface MockConversationDetail {
  id: string
  userId: string
  conversationId: string
  assignedTo?: string | null
  status: ConversationStatus
  createdAt: string
}

// 取代測試中的 TestDbMessage
export interface TestDbMessage {
  id: string
  conversation_id: string
  sender_id?: string
  message: string
  sender_type: 'customer' | 'agent' | 'system' | 'bot'
  created_at: string
}

// 取代測試中的 TestDbProduct
export interface TestDbProduct {
  id: string
  name: string
  price: number
  category_id: number | null
  image_url: string | null
  description: string | null
  translations: any
  created_at: string
  updated_at: string
  deleted_at?: string
  categories?: { name: string | null }
  total_stock?: number
  stock_warning_threshold?: number
  needs_restock?: boolean
}

// 取代測試中的 TestDbOrder 相關型別
export interface TestDbOrder {
  id: string
  user_id: string | null
  total_amount: number
  status: string
  created_at: string
  customer_id: string
  items?: TestDbOrderItem[]
}

export interface TestDbOrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price?: number
}

// Mock Permission 相關型別 (用於 usePermission.test.ts)
export interface MockDbPermissionGroup {
  id: number
  name: string
  description?: string
  sort_order: number
  created_at: string
}

export interface MockPermissionGroup {
  id: number
  name: string
  description?: string
  sortOrder: number
  createdAt: string
}

export interface MockDbPermission {
  id: number
  group_id: number
  code: string
  name: string
  description?: string
  sort_order: number
  created_at: string
}

export interface MockPermission {
  id: number
  groupId: number
  code: string
  name: string
  description?: string
  sortOrder: number
  createdAt: string
}

export interface MockDbRolePermission {
  role_id: number
  permission_id: number
  created_at: string
}

export interface MockRolePermission {
  roleId: number
  permissionId: number
  createdAt: string
}

export interface MockUserPermissionView {
  permissionId: number
  permissionCode: string
  permissionName: string
  groupId: number | null
  groupName: string | null
  fromRoles: string[]
}

// Mock Role 相關型別 (用於 useRole.test.ts)
export interface MockDbRole {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface MockRole {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Mock Category 相關型別 (用於 useProduct.test.ts)
export interface MockDbCategory {
  id: number
  name: string
  description?: string
  translations?: Record<string, any> | null
}

export interface MockCategory {
  id: number
  name: string
  description?: string
  translations?: Record<string, any> | null
}

// Mock Inventory 相關型別
export interface MockDbInventory {
  inventory_id: string
  product_id: string
  inventory_created_at: string
  received_at: string
  initial_quantity: number
  current_stock: number
  total_out: number
}

export interface MockInventory {
  inventoryId: string
  productId: string
  inventoryCreatedAt: string
  inventoryReceivedAt: string
  initialQuantity: number
  currentStock: number
  totalOut: number
}

// Mock Customer 相關型別 (用於 useCustomer.test.ts)
export interface MockCustomer {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  createdAt: string
  updatedAt?: string
  deletedAt?: string
  roles: string[]
}

// 共用 Mock 工具函數型別
export interface CreateMockSupabaseClientOptions {
  authResponse?: Partial<MockAuthResponse>
  queryResponse?: { data: any; error: any; count?: number }
  rpcResponse?: { data: any; error: any }
  functionsResponse?: { data: any; error: any }
}

// Mock 查詢回應型別
export interface MockQueryResponse<T = any> {
  data: T | null
  error: MockSupabaseError | null
  count?: number
}

// Mock RPC 回應型別
export interface MockRpcResponse<T = any> {
  data: T | null
  error: MockSupabaseError | null
}

// Mock Functions 回應型別
export interface MockFunctionsResponse<T = any> {
  data: T | null
  error: MockSupabaseError | null
}

// 共用 Mock 工具函數
export function createMockSupabaseClient(
  options: CreateMockSupabaseClientOptions = {},
): MockSupabaseClient {
  const {
    authResponse = { data: { user: null, session: null }, error: null },
    queryResponse = { data: null, error: null },
    rpcResponse = { data: null, error: null },
    functionsResponse = { data: null, error: null },
  } = options

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue(authResponse),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn().mockResolvedValue(authResponse),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue(authResponse),
      signInWithOAuth: vi.fn().mockResolvedValue(authResponse),
      getSession: vi.fn().mockResolvedValue(authResponse),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue(functionsResponse),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      and: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(queryResponse),
      match: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
      unsubscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue(rpcResponse),
  }
}

// 創建 Mock 產品資料
export function createMockProduct(
  overrides: Partial<TestDbProduct> = {},
): TestDbProduct {
  return {
    id: 'product-123',
    name: '測試產品',
    price: 149.99,
    category_id: 1,
    image_url: 'https://example.com/image.jpg',
    description: '測試產品描述',
    translations: { en: { name: 'Test Product' } },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    categories: { name: '測試分類' },
    total_stock: 10,
    stock_warning_threshold: 5,
    needs_restock: false,
    ...overrides,
  }
}

// 創建 Mock 訂單資料
export function createMockOrder(
  overrides: Partial<TestDbOrder> = {},
): TestDbOrder {
  return {
    id: 'order-123',
    total_amount: 299.99,
    status: 'pending',
    created_at: '2025-01-01T00:00:00Z',
    customer_id: 'customer-123',
    ...overrides,
  }
}

// 創建 Mock 使用者資料
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '',
    deletedAt: '',
    roles: ['user'],
    ...overrides,
  }
}

// 創建 Mock Permission Group 資料
export function createMockPermissionGroup(
  overrides: Partial<MockPermissionGroup> = {},
): MockPermissionGroup {
  return {
    id: 1,
    name: 'User Management',
    description: 'User-related permissions',
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

// 創建 Mock Permission 資料
export function createMockPermission(
  overrides: Partial<MockPermission> = {},
): MockPermission {
  return {
    id: 1,
    groupId: 1,
    code: 'user.read',
    name: 'Read Users',
    description: 'View user information',
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}
