import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { ConversationApiService } from '@/api/services/ConversationApiService'
import { fetchUserPermissionViews } from '@/composables/usePermission'
import type {
  Conversation,
  DbConversation,
  ConversationDetail,
  DbConversationDetail,
  ConversationState,
  MessageChannel,
  DbMessage,
  Message,
  ApiResponse,
  ApiPaginationResponse,
} from '@/types'
import { ConversationStatus, TopicAnalysisStatus, SenderType } from '@/types'
import { useAuthStore } from '@/store/auth'
import { getGlobalMessagesRealtime } from './useMessagesRealtime'
import { createModuleLogger } from '@/utils/logger'

const log = createModuleLogger('Composable', 'Conversation')

// Shared state for conversation instances
const conversationCache = new Map<string, ConversationState>()

// 提前宣告供 default parameter 用
export async function getMessages(
  conversationId: string,
  sort_by: string = 'created_at',
  sort: 'asc' | 'desc' = 'asc',
): Promise<Message[] | null> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  const result = await conversationApiService.getMessages(
    conversationId,
    sort_by,
    sort,
  )
  if (!result.success) return null
  return result.data || null
}

/**
 * 發送訊息
 * @param param0 訊息內容
 * @returns ApiResponse 發送結果
 */
async function sendMessage({
  conversationId,
  message,
  senderId,
  senderType,
}: Message): Promise<ApiResponse> {
  log.debug('Sending message', {
    conversationId,
    message,
    senderId,
    senderType,
  })
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  return await conversationApiService.sendMessage({
    conversationId,
    message,
    senderId,
    senderType,
  })
}

async function getConversationById(
  conversationId: string,
): Promise<DbConversation | null> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  const result = await conversationApiService.findById(conversationId)
  if (!result.success) return null
  // 需要轉換回資料庫格式以保持向後相容
  const conversation = result.data
  if (!conversation) return null
  return {
    id: conversation.id,
    user_id: conversation.userId,
    status: conversation.status,
    title: conversation.title,
    assigned_to: conversation.assignedTo ?? undefined,
    priority: conversation.priority,
    tags: conversation.tags,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
    last_reply_at: conversation.lastReplyAt,
    first_response_time: conversation.firstResponseTime,
    analysis_status: conversation.analysisStatus,
    analyzed_at: conversation.analyzedAt,
  }
}

export async function fetchConversationsDetailWithPagination(options: {
  page: number
  perPage: number
  status?: ConversationStatus[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiPaginationResponse<ConversationDetail>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  return (await conversationApiService.fetchConversationsDetailWithPagination(
    options,
  )) as ApiPaginationResponse<ConversationDetail>
}

export async function getConversations(options: {
  userId?: string
  status?: ConversationStatus
}): Promise<ApiResponse<Conversation[]>> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  return await conversationApiService.getConversations(options)
}

export async function getConversationsWithDetail(options: {
  userId?: string
  conversationId?: string
  status?: ConversationStatus
  assignedTo?: string | null
  // TODO: 支援多欄位排序
  orderBy?: string
  order?: 'asc' | 'desc'
}): Promise<ApiResponse<ConversationDetail[]>> {
  log.debug('Assigned to', { assignedTo: options.assignedTo })
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  const result =
    await conversationApiService.getConversationsWithDetail(options)
  log.debug('getConversationsWithDetail', { data: result.data })
  return result
}

/**
 * 設定對話狀態
 * @param conversationId 對話ID
 * @param status 新的狀態
 * @returns ApiResponse 設定結果
 */
async function setConversationStatus(
  conversationId: string,
  status: ConversationStatus,
): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  return await conversationApiService.updateConversationStatus(
    conversationId,
    status,
  )
}

// 設定對話分析狀態
async function setConversationAnalysisStatus(
  conversationId: string,
  analysisStatus: TopicAnalysisStatus,
): Promise<ApiResponse> {
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabase)
  return await conversationApiService.updateConversationAnalysisStatus(
    conversationId,
    analysisStatus,
  )
}

async function handleTopicAnalysis(conversationId: string, message: string) {
  log.debug('開始執行handleTopicAnalysis')
  try {
    const { data, error } = await setConversationAnalysisStatus(
      conversationId,
      TopicAnalysisStatus.PENDING_ANALYSIS,
    )
    if (error) {
      log.warn('設定 pending_analysis 失敗')
      return { success: false, error: error }
    }
    // sync 呼叫 edge function，不影響後續對話
    log.debug('呼叫 EDGE FUNCTION')
    supabase.functions.invoke('topic-analysis', {
      body: {
        conversation_id: conversationId,
        message,
      },
    })

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// DI for testability
// Track active channels to prevent duplicate subscriptions
const activeChannels = new Map<string, MessageChannel>()

export function useConversation(
  devModeCustomerId = '',
  supabaseImpl = supabase,
  getConversationByIdImpl = getConversationById,
  getMessagesImpl = getMessages,
  sendMessageImpl = sendMessage,
  setConversationStatusImpl = setConversationStatus,
) {
  // 狀態
  const self = reactive({
    id: '', // 當前登入者 id
    inputText: '', // 輸入框
    isAgent: false, // 是否為客服
  })

  // We'll use this local reference but populate it from the cache
  const conversation = reactive({
    id: '',
    userId: '',
    messages: [] as Message[],
    status: ConversationStatus.PENDING,
  } as ConversationState)

  const messageChannel = ref<MessageChannel | null>(null)

  log.debug('devModeCustomerId', { devModeCustomerId })
  if (devModeCustomerId) {
    self.id = devModeCustomerId
    self.isAgent = false
  } else {
    const auth = useAuthStore()
    // 設置當前使用者
    self.id = auth.user?.id || ''

    // 初始化為非管理員，透過異步函數檢查權限
    self.isAgent = false

    // 異步檢查權限
    if (auth.user?.id) {
      fetchUserPermissionViews(auth.user.id)
        .then(permissionResponse => {
          if (permissionResponse.success) {
            // 檢查是否有管理員或客服相關權限
            self.isAgent = permissionResponse.data.some(
              (perm) => perm.permissionCode === 'support_agent' ||
                        perm.permissionCode === 'support_manage' ||
                        perm.permissionCode === 'admin_all' ||
                        perm.permissionCode === 'conversation_manage'
            )
          } else {
            log.warn('無法取得使用者權限，維持非管理員狀態')
          }
        })
        .catch(error => {
          log.error('權限檢查異常', error)
        })
    }
  }

  function isSenderSelf(senderId: string, senderType?: SenderType) {
    // New logic: Use senderType if available for better categorization
    if (senderType) {
      // If current user is agent, show agent messages on right, customer on left
      // If current user is customer, show customer messages on right, agent on left
      if (self.isAgent) {
        return senderType === SenderType.AGENT
      } else {
        return senderType === SenderType.CUSTOMER
      }
    }
    
    // Fallback to legacy logic for backward compatibility
    return senderId === self.id
  }

  /**
   * 初始化對話和訊息
   * @param id 對話ID
   * @param userId 用戶ID
   * @returns ApiResponse 初始化結果
   */
  async function initConversation(id: string): Promise<ApiResponse> {
    try {
      // Check if we already have this conversation in our cache
      let existingConversation = conversationCache.get(id)

      // If not in cache or if we need to reload, fetch it
      if (!existingConversation) {
        const conversationInfo = await getConversationByIdImpl(id)
        if (!conversationInfo)
          return { success: false, error: 'Conversation not found' }

        // Create a new conversation object that will be shared
        existingConversation = reactive({
          id,
          userId: conversationInfo.user_id,
          status: conversationInfo.status,
          messages: [] as Message[],
        })

        // Add to our cache
        conversationCache.set(id, existingConversation)

        // Fetch messages
        const msgs = await getMessagesImpl(id)
        if (msgs) existingConversation.messages = msgs

        // Set up subscription if not already active
        if (
          existingConversation.status !== ConversationStatus.CLOSED &&
          !activeChannels.has(id)
        ) {
          subscribeToMessages(id, (newMessage: any) => {
            if (existingConversation) {
              // Push to the shared conversation object so all components see it
              existingConversation.messages.push(
                mapDbMessageToMessage(newMessage),
              )
            } else {
              log.warn(
                `Received message for conversation ${id} but no active conversation found`,
              )
            }
          })
        }
      } else {
        log.debug('Using cached conversation data', { id })
      }

      // Update the local conversation reference to point to the shared one
      Object.assign(conversation, existingConversation)

      return { success: true, data: conversation.id }
    } catch (error) {
      log.error('Error in initConversation', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async function handleSendMessage(message: string): Promise<ApiResponse> {
    if (!conversation.id || conversation.status === ConversationStatus.CLOSED) {
      return {
        success: false,
        error: 'Conversation is not open or does not exist',
      }
    }

    // TODO: 判斷如果是 user 的第一則訊息，則呼叫 edge function 執行 nlp 分析
    // 1. 更新 conversation.analysis_status: 'pending_analysis'
    // 2. 呼叫 edge function 執行 nlp 分析
    // 3. 更新 conversation.analysis_status: 'analyzed' / 'failed_analysis'

    try {
      const result = await sendMessageImpl({
        conversationId: conversation.id,
        message,
        senderId: self.id,
        senderType: self.isAgent ? SenderType.AGENT : SenderType.CUSTOMER, // Primary parameter
      })

      if (!result.success) {
        log.error('Failed to send message', result.error)
      }

      // TODO: 判斷如果是 user 的第一則訊息，則呼叫函式 handleTopicAnalysis (該函式先設定analysis_status，並呼叫 edge function 執行 nlp 分析)
      log.debug('準備判斷是否為第一則訊息')
      if (!self.isAgent && !conversation.messages.length) {
        log.debug('成功', { isAgent: !self.isAgent, hasMessages: !conversation.messages.length })
        await handleTopicAnalysis(conversation.id, message)
      }
      log.debug('跑完了')

      return result
    } catch (error) {
      log.error('Failed to send message', error)
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async function markAsRead() {
    if (!conversation.id || conversation.status !== ConversationStatus.OPEN)
      return
    const { error } = await supabaseImpl.rpc('mark_messages_as_read', {
      p_conversation_id: conversation.id,
      p_sender_type: self.isAgent ? SenderType.AGENT : SenderType.CUSTOMER,
    })
    if (error) {
      log.error('Failed to mark as read', error)
    }
  }

  // 訂閱特定 conversation messages
  function subscribeToMessages(
    conversationId: string,
    callback: (_newMessage: any) => void,
  ) {
    log.debug(
      `Attempting to subscribe to channel: conversation-${conversationId}`,
    )

    if (messageChannel.value) messageChannel.value.unsubscribe()

    // 使用全域錯誤監控的訊息 Realtime 管理器
    const messagesRealtime = getGlobalMessagesRealtime()

    // 使用新的錯誤監控訂閱方法
    messagesRealtime
      .subscribeToConversation(conversationId, (event) => {
        if (event.eventType === 'INSERT') {
          callback(event.data)
        }
      })
      .then((success) => {
        if (success) {
          log.debug(
            `✅ 對話 ${conversationId} 訂閱成功 (with error tracking)`,
          )
        } else {
          log.error(
            `❌ 對話 ${conversationId} 訂閱失敗 (with error tracking)`,
          )

          // 備援：使用原始訂閱方法
          log.debug('🔄 使用備援訂閱方法...')
          messageChannel.value = supabaseImpl
            .channel(`conversation-${conversationId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`,
              },
              (payload) => {
                callback(payload.new)
              },
            )
            .subscribe()

          // 將此頻道標記為活動狀態
          activeChannels.set(conversationId, messageChannel.value)
        }
      })
      .catch((error) => {
        log.error(`❌ 對話 ${conversationId} 錯誤監控訂閱失敗`, error)

        // 備援：使用原始訂閱方法
        log.debug('🔄 使用備援訂閱方法...')
        messageChannel.value = supabaseImpl
          .channel(`conversation-${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              callback(payload.new)
            },
          )
          .subscribe()

        // 將此頻道標記為活動狀態
        activeChannels.set(conversationId, messageChannel.value)
      })
  }

  // 取消訂閱 conversation messages
  function unsubscribeFromMessages() {
    if (
      messageChannel.value &&
      conversation.status !== ConversationStatus.CLOSED
    ) {
      messageChannel.value.unsubscribe()
      messageChannel.value = null
    }

    // 同時取消錯誤監控訂閱
    if (conversation.id) {
      const messagesRealtime = getGlobalMessagesRealtime()
      messagesRealtime.unsubscribeFromConversation(conversation.id)
    }
  }

  // 清空對話
  function clearConversation() {
    unsubscribeFromMessages()

    Object.assign(conversation, {
      id: '',
      userId: '',
      messages: [],
    })
    self.inputText = ''
  }

  /**
   * 設定對話狀態
   * @param status 新的狀態
   * @returns ApiResponse 設定結果
   */
  async function handleSetConversationStatus(
    status: ConversationStatus,
  ): Promise<ApiResponse> {
    log.debug('設定狀態', { conversationId: conversation.id, status })
    return setConversationStatusImpl(conversation.id, status)
  }

  // 生命週期管理（可選）
  onMounted(() => {
    // 可以根據需要自動訂閱 conversations 或初始化
  })

  onUnmounted(() => {
    clearConversation()
  })

  return {
    conversation,
    self,
    isSenderSelf,
    loading: ref(false),
    error: ref(null),
    initConversation,
    sendMessage: handleSendMessage,
    markAsRead,
    clearConversation,
    setConversationStatus: handleSetConversationStatus,
  }
}
/**
 * 取得或建立一個客戶端的對話
 * @param userId 用戶ID
 * @returns ApiResponse 對話資料
 */
export async function getOrCreateClientConversation(
  userId: string,
  supabaseImpl = supabase,
): Promise<ApiResponse> {
  log.debug('Getting or creating client conversation for user', { userId })
  // 使用 API 服務但保持完全相同的邏輯和回傳格式
  const conversationApiService = new ConversationApiService(supabaseImpl)
  const result =
    await conversationApiService.getOrCreateClientConversation(userId)
  log.debug('Client conversation data', { data: result.data })
  return result
}

export function mapDbMessageToMessage(dbMsg: DbMessage): Message {
  return {
    id: dbMsg.id,
    conversationId: dbMsg.conversation_id,
    senderId: dbMsg.sender_id,
    message: dbMsg.message,
    senderType: dbMsg.sender_type, // Primary field for sender categorization
    // TODO: 轉換時間格式
    createdAt: dbMsg.created_at,
  }
}

export function mapDbConversationToConversation(
  dbConv: DbConversation,
): Conversation {
  return {
    id: dbConv.id,
    userId: dbConv.user_id,
    status: dbConv.status,
    title: dbConv?.title,
    assignedTo: dbConv?.assigned_to,
    priority: dbConv?.priority,
    tags: dbConv?.tags,
    createdAt: dbConv?.created_at,
    updatedAt: dbConv?.updated_at,
    closedAt: dbConv?.closed_at,
    lastReplyAt: dbConv?.last_reply_at,
    firstResponseTime: dbConv?.first_response_time,
    analysisStatus: dbConv?.analysis_status,
    analyzedAt: dbConv?.analyzed_at,
  }
}

export function mapDbConversationDetailToConversationDetail(
  dbConv: DbConversationDetail,
): ConversationDetail {
  return {
    conversationId: dbConv.id,
    createdAt: dbConv.created_at,
    id: dbConv.id,
    userId: dbConv.user_id,
    status: dbConv.status,
    title: dbConv?.title,
    assignedTo: dbConv?.assigned_to,
    priority: dbConv?.priority,
    tags: dbConv?.tags,
    latestMessage: dbConv?.latest_message,
    firstMessage: dbConv?.first_message,
    firstMessageTime: dbConv?.first_message_time,
    lastReplyAt: dbConv?.last_reply_at,
    firstResponseTime: dbConv?.first_response_time,
    userEmail: dbConv?.user_email,
    userFullName: dbConv?.user_full_name,
    userAvatarUrl: dbConv?.user_avatar_url,
    conversationCreatedAt: dbConv?.conversation_created_at,
    conversationUpdatedAt: dbConv?.conversation_updated_at,
    agentUnreadCount: dbConv?.agent_unread_count,
    userUnreadCount: dbConv?.user_unread_count,
    messageCount: dbConv?.message_count,
    analysisStatus: dbConv?.analysis_status,
    analyzedAt: dbConv?.analyzed_at,
    agentName: dbConv?.agent_name,
    agentEmail: dbConv?.agent_email,
    agentAvatarUrl: dbConv?.agent_avatar_url,
  }
}

/**
 * 更新對話狀態
 * @param conversationId 對話 ID
 * @param status 新狀態
 * @returns ApiResponse 更新結果
 */
export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<ApiResponse> {
  try {
    const conversationApiService = new ConversationApiService(supabase)
    return await conversationApiService.updateConversationStatus(conversationId, status)
  } catch (error) {
    log.error('更新對話狀態失敗', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新對話狀態失敗'
    }
  }
}
