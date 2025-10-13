# ConversationApiService API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐⭐ (客服系統核心)

---
## 概覽

### 業務用途
ConversationApiService 是客服對話系統的核心 API 服務，負責處理客戶與客服人員之間的對話管理，包含對話 CRUD 操作、訊息收發、狀態流轉、指派管理和分析狀態追蹤。它是整個客服工單系統的基礎，支援即時客服、工單追蹤和客服績效分析。

### 核心功能
- **對話 CRUD 操作** - 完整的對話生命週期管理
- **分頁查詢與篩選** - 支援狀態、優先級、指派、搜尋篩選
- **訊息管理** - 訊息發送、查詢、排序
- **狀態流轉** - pending → open → resolved → closed
- **客服指派** - 對話指派給特定客服人員
- **分析狀態追蹤** - 主題分析狀態管理
- **自動對話建立** - 客戶首次聯繫時自動建立對話

### 技術架構
- **繼承**: `BaseApiService<Conversation, DbConversation>`
- **資料表**:
  - `conversations` (主表) - 對話基本資訊
  - `conversation_details` (視圖) - 對話詳細資訊含用戶和客服資料
  - `messages` (關聯表) - 對話訊息
  - `users` (關聯) - 用戶資訊
- **資料映射**: `Conversation` ↔ `DbConversation`, `ConversationDetail`
- **依賴服務**: 無直接依賴
- **前端使用**:
  - `ConversationsView.vue` - 對話列表頁面
  - `ConversationDetailView.vue` - 對話詳情與訊息頁面
  - `SupportDashboard.vue` - 客服工作台

### 資料庫層 API 參考
> **Supabase 自動生成文件**
>
> 如需查詢 `conversations` 資料表的基礎 Schema 和 PostgREST API：
> 1. 前往 [Supabase Dashboard](https://supabase.com/dashboard/project/_) → API 頁面
> 2. 選擇 **Tables and Views** → `conversations` / `conversation_details` / `messages`
> 3. 查看自動生成的 CRUD 操作和 cURL/JavaScript 範例
>
> **何時使用 Supabase 文件**：
> - ✅ 查詢對話資料表結構和訊息關聯
> - ✅ 了解對話狀態的資料庫約束
> - ✅ 檢視 conversation_details 視圖定義
>
> **何時使用本文件**：
> - ✅ 使用 `ConversationApiService` 的對話管理功能
> - ✅ 了解訊息發送和對話狀態流轉邏輯
> - ✅ 學習客服指派和分析狀態管理
> - ✅ 查看與客服系統的整合方式

---

## API 方法詳細說明

### 1. 對話查詢方法

#### `fetchConversationsDetailWithPagination()` - 對話詳情分頁查詢 ⭐ 推薦

**用途**: 取得對話詳情列表（含用戶和客服資訊），支援分頁、狀態篩選、優先級篩選、搜尋和排序

**方法簽名**:
```typescript
async fetchConversationsDetailWithPagination(options: {
  page: number
  perPage: number
  status?: ConversationStatus[]
  priority?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  searchTerm?: string
}): Promise<ApiPaginationResponse>
```

**參數**:
```typescript
interface Options {
  page: number                           // 頁碼（必填）
  perPage: number                        // 每頁筆數（必填）
  status?: ConversationStatus[]          // 狀態篩選 ['pending', 'open', 'resolved', 'closed']
  priority?: string[]                    // 優先級篩選 ['low', 'medium', 'high', 'urgent']
  sortBy?: string                        // 排序欄位（預設: 'created_at'）
  sortOrder?: 'asc' | 'desc'             // 排序方向（預設: 'desc'）
  searchTerm?: string                    // 搜尋關鍵字
}

type ConversationStatus = 'pending' | 'open' | 'resolved' | 'closed'
```

**回傳值**:
```typescript
interface ApiPaginationResponse {
  success: boolean
  data?: ConversationDetail[]          // 對話詳情陣列
  count?: number                       // 總筆數
  page?: number                        // 當前頁碼
  perPage?: number                     // 每頁筆數
  totalPages?: number                  // 總頁數
  error?: string
}

interface ConversationDetail {
  conversationId: string                 // 對話 ID
  userId: string                         // 用戶 ID
  status: ConversationStatus            // 對話狀態
  title?: string                        // 對話標題
  ticketNumber?: string                 // 工單編號
  assignedTo?: string                   // 指派客服 ID
  priority?: string                     // 優先級
  tags?: string[]                       // 標籤
  createdAt: string                     // 建立時間
  updatedAt: string                     // 更新時間
  closedAt?: string                     // 關閉時間
  latestMessage?: string                // 最新訊息
  firstMessage?: string                 // 首次訊息
  firstMessageTime?: string             // 首次訊息時間
  lastReplyAt?: string                  // 最後回覆時間
  firstResponseTime?: number            // 首次回應時間（秒）
  userEmail: string                     // 用戶 Email
  userFullName: string                  // 用戶全名
  userAvatarUrl?: string                // 用戶頭像
  agentName?: string                    // 客服姓名
  agentEmail?: string                   // 客服 Email
  agentAvatarUrl?: string               // 客服頭像
  agentUnreadCount?: number             // 客服未讀數
  userUnreadCount?: number              // 用戶未讀數
  messageCount?: number                 // 訊息總數
  analysisStatus?: TopicAnalysisStatus  // 分析狀態
  analyzedAt?: string                   // 分析時間
}
```

**資料來源**: `conversation_details` 視圖

**搜尋邏輯**:
```typescript
// 同時搜尋以下欄位（OR 邏輯）
- topic            // 對話主題
- first_message    // 首次訊息內容
- user_full_name   // 用戶姓名
- user_email       // 用戶 Email
```

**使用範例**:
```typescript
import { defaultServiceFactory } from '@/api/services'

const conversationService = defaultServiceFactory.getConversationService()

// 基本分頁查詢
const result = await conversationService.fetchConversationsDetailWithPagination({
  page: 1,
  perPage: 20,
  sortBy: 'created_at',
  sortOrder: 'desc'
})

// 篩選待處理的高優先級對話
const urgentPending = await conversationService.fetchConversationsDetailWithPagination({
  page: 1,
  perPage: 50,
  status: ['pending', 'open'],
  priority: ['high', 'urgent'],
  sortBy: 'created_at',
  sortOrder: 'asc'  // 最早的優先
})

// 搜尋特定客戶的對話
const customerConversations = await conversationService.fetchConversationsDetailWithPagination({
  page: 1,
  perPage: 10,
  searchTerm: 'john@example.com'
})

if (result.success) {
  console.log(`找到 ${result.count} 個對話，共 ${result.totalPages} 頁`)
  result.data.forEach(conv => {
    console.log(`${conv.ticketNumber}: ${conv.userFullName} - ${conv.latestMessage}`)
  })
}
```

---

#### `getConversationsWithDetail()` - 對話詳情進階查詢

**用途**: 靈活的對話詳情查詢，支援多條件篩選但不分頁

**方法簽名**:
```typescript
async getConversationsWithDetail(options: {
  userId?: string
  conversationId?: string
  status?: ConversationStatus
  assignedTo?: string | null
  orderBy?: string
  order?: 'asc' | 'desc'
}): Promise<ApiResponse<ConversationDetail[]>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ❌ | 篩選特定用戶的對話 |
| `conversationId` | `string` | ❌ | 查詢特定對話 |
| `status` | `ConversationStatus` | ❌ | 篩選單一狀態 |
| `assignedTo` | `string \| null` | ❌ | 篩選指派給特定客服的對話 |
| `orderBy` | `string` | ❌ | 排序欄位 |
| `order` | `'asc' \| 'desc'` | ❌ | 排序方向 |

**使用範例**:
```typescript
// 取得特定用戶的所有對話
const userConvs = await conversationService.getConversationsWithDetail({
  userId: 'user-uuid-123',
  orderBy: 'created_at',
  order: 'desc'
})

// 取得指派給特定客服的開放對話
const agentOpenConvs = await conversationService.getConversationsWithDetail({
  assignedTo: 'agent-uuid-456',
  status: 'open',
  orderBy: 'last_reply_at',
  order: 'asc'  // 最久未回覆的優先
})

// 查詢未指派的待處理對話
const unassigned = await conversationService.getConversationsWithDetail({
  assignedTo: null,
  status: 'pending'
})
```

---

#### `getConversations()` - 基礎對話查詢

**用途**: 輕量級對話查詢，僅返回基本欄位，不含用戶和客服詳情

**方法簽名**:
```typescript
async getConversations(options: {
  userId?: string
  status?: ConversationStatus
}): Promise<ApiResponse<Conversation[]>>
```

**回傳值**: 簡化的 `Conversation` 物件陣列（不含 user/agent 關聯資料）

**使用範例**:
```typescript
// 快速查詢用戶的開放對話
const openConvs = await conversationService.getConversations({
  userId: 'user-uuid-123',
  status: 'open'
})
```

**與 getConversationsWithDetail 的差異**:
- `getConversations`: 返回基本 `Conversation` 物件
- `getConversationsWithDetail`: 返回完整 `ConversationDetail` 物件（含用戶/客服資訊）

---

### 2. 對話狀態管理

#### `updateConversationStatus()` - 更新對話狀態

**用途**: 變更對話狀態，自動處理 `closed_at` 時間戳

**方法簽名**:
```typescript
async updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<ApiResponse>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `conversationId` | `string` | ✅ | 對話 UUID |
| `status` | `ConversationStatus` | ✅ | 新狀態 |

**對話狀態流程**:
```
pending (待處理)
   ↓
open (處理中)
   ↓
resolved (已解決)
   ↓
closed (已關閉)
```

**自動行為**:
- 設定為 `closed` 時，自動設定 `closed_at` 為當前時間

**使用範例**:
```typescript
// 客服接手對話
await conversationService.updateConversationStatus(
  'conversation-uuid-123',
  'open'
)

// 標記為已解決
await conversationService.updateConversationStatus(
  'conversation-uuid-123',
  'resolved'
)

// 關閉對話（自動設定 closed_at）
const result = await conversationService.updateConversationStatus(
  'conversation-uuid-123',
  'closed'
)

if (result.success) {
  console.log('對話已關閉，closed_at 已自動設定')
}
```

**狀態流轉建議**:
```typescript
// ✅ 推薦流程
pending → open → resolved → closed

// ⚠️ 可直接跳過的流程
pending → closed  // 無效或垃圾訊息
open → closed     // 快速解決

// ❌ 避免的流程
closed → open     // 已關閉不應重開，建議建立新對話
```

---

#### `updateConversationAnalysisStatus()` - 更新分析狀態

**用途**: 更新對話的主題分析狀態，用於 AI 分析流程追蹤

**方法簽名**:
```typescript
async updateConversationAnalysisStatus(
  conversationId: string,
  analysisStatus: TopicAnalysisStatus
): Promise<ApiResponse>
```

**參數**:
```typescript
type TopicAnalysisStatus =
  | 'pending'       // 待分析
  | 'analyzing'     // 分析中
  | 'completed'     // 已完成
  | 'failed'        // 分析失敗
```

**使用範例**:
```typescript
// 開始 AI 主題分析
await conversationService.updateConversationAnalysisStatus(
  'conversation-uuid-123',
  'analyzing'
)

// 分析完成
await conversationService.updateConversationAnalysisStatus(
  'conversation-uuid-123',
  'completed'
)

// 分析失敗
await conversationService.updateConversationAnalysisStatus(
  'conversation-uuid-123',
  'failed'
)
```

---

### 3. 訊息管理

#### `getMessages()` - 取得對話訊息

**用途**: 查詢特定對話的所有訊息，支援排序

**方法簽名**:
```typescript
async getMessages(
  conversationId: string,
  sortBy?: string = 'created_at',
  sortOrder?: 'asc' | 'desc' = 'asc'
): Promise<ApiResponse<Message[]>>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `conversationId` | `string` | ✅ | 對話 UUID |
| `sortBy` | `string` | ❌ | 排序欄位（預設: 'created_at'） |
| `sortOrder` | `'asc' \| 'desc'` | ❌ | 排序方向（預設: 'asc'） |

**回傳值**:
```typescript
interface Message {
  id: string                          // 訊息 ID
  conversationId: string              // 對話 ID
  senderId: string                    // 發送者 ID
  message: string                     // 訊息內容
  senderType: SenderType              // 發送者類型
  createdAt: string                   // 建立時間
}

type SenderType = 'user' | 'agent' | 'system'
```

**使用範例**:
```typescript
// 取得對話的所有訊息（時間升序）
const result = await conversationService.getMessages('conversation-uuid-123')

if (result.success) {
  result.data.forEach(msg => {
    const prefix = msg.senderType === 'user' ? '客戶' : '客服'
    console.log(`[${msg.createdAt}] ${prefix}: ${msg.message}`)
  })
}

// 取得最新訊息在前（時間降序）
const latestFirst = await conversationService.getMessages(
  'conversation-uuid-123',
  'created_at',
  'desc'
)
```

---

#### `sendMessage()` - 發送訊息

**用途**: 在對話中發送新訊息

**方法簽名**:
```typescript
async sendMessage(messageData: {
  conversationId: string
  message: string
  senderId: string
  senderType: SenderType
}): Promise<ApiResponse>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `conversationId` | `string` | ✅ | 對話 UUID |
| `message` | `string` | ✅ | 訊息內容（自動 trim） |
| `senderId` | `string` | ✅ | 發送者 ID（user_id 或 agent_id） |
| `senderType` | `SenderType` | ✅ | 發送者類型 ('user', 'agent', 'system') |

**驗證規則**:
- `conversationId` 不可為空
- `message` 不可為空白（會自動 trim）
- `senderId` 不可為空
- `senderType` 必須提供

**使用範例**:
```typescript
// 客戶發送訊息
const result = await conversationService.sendMessage({
  conversationId: 'conversation-uuid-123',
  message: '請問我的訂單什麼時候會到？',
  senderId: 'user-uuid-456',
  senderType: 'user'
})

// 客服回覆訊息
const agentReply = await conversationService.sendMessage({
  conversationId: 'conversation-uuid-123',
  message: '您的訂單預計明天送達，追蹤編號為 XXX',
  senderId: 'agent-uuid-789',
  senderType: 'agent'
})

// 系統自動訊息
const systemMsg = await conversationService.sendMessage({
  conversationId: 'conversation-uuid-123',
  message: '對話已自動指派給客服 John',
  senderId: 'system',
  senderType: 'system'
})

if (result.success) {
  console.log('訊息已發送:', result.data)
} else {
  console.error('發送失敗:', result.error)
}
```

**錯誤處理**:
```typescript
// 參數驗證錯誤
{
  success: false,
  error: 'Invalid parameters'
}

// senderType 缺失
{
  success: false,
  error: 'senderType must be provided'
}
```

---

### 4. 對話建立與管理

#### `getOrCreateClientConversation()` - 取得或建立客戶對話

**用途**: 智能對話建立，若客戶有開放對話則返回，否則建立新對話

**方法簽名**:
```typescript
async getOrCreateClientConversation(
  userId: string
): Promise<ApiResponse>
```

**參數**:
| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `userId` | `string` | ✅ | 用戶 UUID |

**回傳值**:
```typescript
{
  success: true,
  data: { id: 'conversation-uuid-123' }
}
```

**邏輯流程**:
```typescript
1. 查詢該用戶是否有非 closed 狀態的對話
2. 如果有 → 返回現有對話 ID
3. 如果沒有 → 建立新對話（status: 'pending'）並返回 ID
```

**使用範例**:
```typescript
// 客戶發起客服對話
const handleCustomerContact = async (userId: string, firstMessage: string) => {
  // 1. 取得或建立對話
  const convResult = await conversationService.getOrCreateClientConversation(userId)

  if (!convResult.success) {
    toast.error('無法建立對話')
    return
  }

  const conversationId = convResult.data.id

  // 2. 發送首次訊息
  await conversationService.sendMessage({
    conversationId,
    message: firstMessage,
    senderId: userId,
    senderType: 'user'
  })

  // 3. 導向對話頁面
  router.push(`/conversations/${conversationId}`)
}
```

**適用場景**:
- ✅ 客戶從前台發起客服諮詢
- ✅ 避免同一客戶建立多個重複對話
- ✅ 確保對話連續性

---

## 資料映射與轉換

### 資料庫欄位映射

#### DbConversation → Conversation
```typescript
{
  id: dbConversation.id,
  userId: dbConversation.user_id,                         // snake_case → camelCase
  status: dbConversation.status,
  title: dbConversation.title,
  assignedTo: dbConversation.assigned_to,                 // snake_case → camelCase
  priority: dbConversation.priority,
  tags: dbConversation.tags,
  createdAt: dbConversation.created_at,                   // snake_case → camelCase
  updatedAt: dbConversation.updated_at,                   // snake_case → camelCase
  closedAt: dbConversation.closed_at,                     // snake_case → camelCase
  lastReplyAt: dbConversation.last_reply_at,              // snake_case → camelCase
  firstResponseTime: dbConversation.first_response_time,  // snake_case → camelCase
  analysisStatus: dbConversation.analysis_status,         // snake_case → camelCase
  analyzedAt: dbConversation.analyzed_at                  // snake_case → camelCase
}
```

#### DbMessage → Message
```typescript
{
  id: dbMsg.id,
  conversationId: dbMsg.conversation_id,
  senderId: dbMsg.sender_id,
  message: dbMsg.message,
  senderType: dbMsg.sender_type,
  createdAt: dbMsg.created_at
}
```

---

## 錯誤處理

### 常見錯誤場景

#### 1. 訊息參數驗證失敗
```typescript
{
  success: false,
  error: 'Invalid parameters'
}
// 原因: conversationId, message 或 senderId 為空
```

#### 2. 對話不存在
```typescript
{
  success: false,
  error: 'No rows returned'
}
// 原因: 查詢的 conversationId 不存在
```

#### 3. 建立對話失敗
```typescript
{
  success: false,
  error: 'Failed to create conversation'
}
// 原因: 資料庫插入失敗或未返回 ID
```

---

## ⚡ 效能考量

### 查詢優化

1. **使用 conversation_details 視圖**
   - ✅ 預先 JOIN user 和 agent 資料
   - ✅ 包含訊息統計（message_count, unread_count）
   - ✅ 一次查詢取得完整對話資訊

2. **索引欄位**
   - `created_at`: 時間範圍查詢優化
   - `status`: 狀態篩選優化
   - `assigned_to`: 客服工作台查詢優化
   - `user_id`: 用戶對話歷史查詢優化

3. **分頁查詢**
   - 使用 `fetchConversationsDetailWithPagination` 而非 `getConversationsWithDetail`
   - 預設每頁 20 筆，避免一次載入過多資料

### 最佳實踐

```typescript
// ✅ 推薦: 使用分頁查詢
const result = await conversationService.fetchConversationsDetailWithPagination({
  page: 1,
  perPage: 20,
  status: ['open'],
  assignedTo: agentId
})

// ✅ 推薦: 查詢訊息使用升序（時間軸順序）
const messages = await conversationService.getMessages(convId, 'created_at', 'asc')

// ❌ 避免: 不使用分頁查詢所有對話
const allConvs = await conversationService.getConversationsWithDetail({})
```

---

## 使用場景範例

### 場景 1: 客服工作台 - 待處理對話列表

```typescript
// ConversationsView.vue
const loadPendingConversations = async () => {
  loading.value = true

  const result = await conversationService.fetchConversationsDetailWithPagination({
    page: currentPage.value,
    perPage: 20,
    status: ['pending', 'open'],
    sortBy: 'created_at',
    sortOrder: 'asc'  // 最早的優先
  })

  if (result.success) {
    conversations.value = result.data || []
    totalPages.value = result.totalPages || 0
  }

  loading.value = false
}
```

### 場景 2: 對話詳情頁面 - 訊息列表

```typescript
// ConversationDetailView.vue
const loadConversationMessages = async (conversationId: string) => {
  // 載入對話詳情
  const convResult = await conversationService.getConversationsWithDetail({
    conversationId
  })

  if (convResult.success && convResult.data[0]) {
    conversation.value = convResult.data[0]
  }

  // 載入訊息
  const msgResult = await conversationService.getMessages(conversationId)

  if (msgResult.success) {
    messages.value = msgResult.data
  }
}

// 發送回覆
const sendReply = async () => {
  if (!replyMessage.value.trim()) return

  const result = await conversationService.sendMessage({
    conversationId: conversation.value.conversationId,
    message: replyMessage.value,
    senderId: currentUser.value.id,
    senderType: 'agent'
  })

  if (result.success) {
    replyMessage.value = ''
    await loadConversationMessages(conversation.value.conversationId)
  }
}
```

### 場景 3: 客服接手對話

```typescript
const handleTakeConversation = async (conversationId: string, agentId: string) => {
  // 1. 更新狀態為 open
  await conversationService.updateConversationStatus(conversationId, 'open')

  // 2. 指派給當前客服
  await conversationService.update(conversationId, {
    assignedTo: agentId
  })

  // 3. 發送系統訊息
  await conversationService.sendMessage({
    conversationId,
    message: `客服 ${currentAgent.value.name} 已接手此對話`,
    senderId: 'system',
    senderType: 'system'
  })

  toast.success('對話已接手')
}
```

### 場景 4: 客戶發起客服諮詢

```typescript
// CustomerSupportWidget.vue
const startConversation = async (firstMessage: string) => {
  // 1. 取得或建立對話
  const convResult = await conversationService.getOrCreateClientConversation(
    currentUser.value.id
  )

  if (!convResult.success) {
    toast.error('無法建立對話')
    return
  }

  // 2. 發送首次訊息
  await conversationService.sendMessage({
    conversationId: convResult.data.id,
    message: firstMessage,
    senderId: currentUser.value.id,
    senderType: 'user'
  })

  // 3. 開啟對話視窗
  showChatWidget.value = true
  activeConversationId.value = convResult.data.id
}
```

---

## 相關文檔

- [客服系統架構設計](../architecture/support-system.md) - 完整系統設計
- [對話資料表 Schema](../database/tables.md#conversations) - 資料庫結構
- [訊息即時通訊](../guides/realtime-messaging.md) - WebSocket 整合
- [客服績效分析](./support-analytics-api.md) - 客服分析服務

---

**📌 重要提醒**:
- 使用 `conversation_details` 視圖可一次取得完整對話資訊，避免多次查詢
- `getOrCreateClientConversation` 確保客戶不會建立重複對話
- 訊息發送需明確指定 `senderType`，影響前端顯示邏輯
- 關閉對話 (status: 'closed') 會自動設定 `closed_at` 時間戳
- 搜尋功能同時查詢主題、訊息內容、用戶姓名和 Email
