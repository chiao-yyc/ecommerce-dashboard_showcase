# Supabase Realtime 功能部署前檢查清單

## 概覽

本檢查清單確保所有必要的 Supabase Realtime 功能在部署前正確配置，並提供監控機制來追蹤 Realtime 連線狀態和輪詢備援機制。

## 🟢 已實現 Realtime 功能的資料表

### 1. notifications
- **用途**: 主要通知系統即時更新
- **事件類型**: INSERT, UPDATE, DELETE
- **訂閱位置**: `src/composables/useNotification.ts:844`
- **通道名稱**: `notifications-changes`
- **RLS 需求**: ✅ 用戶只能訂閱自己的通知
- **部署檢查**:
  - [ ] Supabase Dashboard → Database → Replication → 勾選 `notifications` 表
  - [ ] 確認 RLS 政策：用戶只能查看 `user_id = auth.uid()` 的記錄
  - [ ] 測試事件：INSERT, UPDATE, DELETE 都能正確觸發

### 2. suggested_notifications
- **用途**: 建議通知系統即時更新  
- **事件類型**: INSERT, UPDATE, DELETE
- **訂閱位置**: `src/composables/useNotification.ts:866`
- **通道名稱**: `suggested-notifications-changes`
- **RLS 需求**: ✅ 基於用戶角色權限控制
- **部署檢查**:
  - [ ] Supabase Dashboard → Database → Replication → 勾選 `suggested_notifications` 表
  - [ ] 確認 RLS 政策：根據用戶角色限制訪問權限
  - [ ] 測試建議通知的即時推送功能

### 3. orders
- **用途**: 訂單狀態即時更新
- **事件類型**: INSERT, UPDATE, DELETE
- **訂閱位置**: `src/composables/useOrder.ts:221`
- **通道名稱**: `orders-changes`
- **RLS 需求**: ✅ 基於訂單權限控制
- **部署檢查**:
  - [ ] Supabase Dashboard → Database → Replication → 勾選 `orders` 表
  - [ ] 確認 RLS 政策：管理員可見所有訂單，客戶只能看自己的訂單
  - [ ] 測試訂單狀態變更的即時通知

### 4. conversations
- **用途**: 客服對話狀態更新
- **事件類型**: INSERT, UPDATE
- **訂閱位置**: `src/views/SupportTicketsView.vue:113`
- **通道名稱**: `conversations`
- **RLS 需求**: ✅ 客服權限控制
- **部署檢查**:
  - [ ] Supabase Dashboard → Database → Replication → 勾選 `conversations` 表
  - [ ] 確認 RLS 政策：客服人員和相關用戶可訪問
  - [ ] 測試對話狀態變更通知

### 5. messages
- **用途**: 客服訊息即時傳送
- **事件類型**: INSERT
- **訂閱位置**: `src/composables/useConversation.ts:380`
- **通道名稱**: `conversation-{conversationId}` (動態通道)
- **過濾條件**: `conversation_id=eq.{conversationId}`
- **RLS 需求**: ✅ 對話參與者權限
- **部署檢查**:
  - [ ] Supabase Dashboard → Database → Replication → 勾選 `messages` 表
  - [ ] 確認 RLS 政策：只有對話參與者可以訪問訊息
  - [ ] 測試即時訊息傳送功能
  - [ ] 測試過濾條件正確工作

## 🟡 待實現 Realtime 功能的資料表

### 1. products
- **用途**: 產品資訊即時更新
- **當前狀態**: 標記為 FIXME，待實現
- **標記位置**: 
  - `src/composables/useProduct.ts:705`
  - `src/components/product/ProductsList.vue:145`
  - `src/components/product/ProductStockList.vue:105`
- **建議實現**:
  - 事件類型: UPDATE (價格、狀態變更)
  - 業務需求: 產品狀態變更時即時通知管理員
  - RLS 需求: 管理員權限控制

### 2. inventories
- **用途**: 庫存數量即時更新
- **當前狀態**: 未實現，但有業務需求
- **業務需求**: 庫存低於閾值時即時警報
- **建議實現**:
  - 事件類型: UPDATE (庫存數量變更)
  - 關聯表: `product_inventory_status` 視圖
  - RLS 需求: 庫存管理員權限控制

## ⚙️ Supabase Dashboard 設定檢查流程

### 步驟 1: 啟用 Realtime 功能
1. 登入 Supabase Dashboard
2. 選擇專案
3. 導航至 **Database** → **Replication**
4. 在 **Publications** 區段，確認 `supabase_realtime` publication 存在
5. 對於每個需要 Realtime 的表，勾選對應的核取方塊

### 步驟 2: 驗證 Row Level Security (RLS) 政策
對每個啟用 Realtime 的表執行以下檢查：

#### notifications 表
```sql
-- 檢查現有政策
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications';

-- 期望的政策：用戶只能訪問自己的通知
-- Policy: Users can only see their own notifications
-- SELECT: user_id = auth.uid()
```

#### orders 表
```sql
-- 檢查現有政策
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'orders';

-- 期望的政策：基於用戶角色的訂單訪問控制
```

### 步驟 3: 測試 Realtime 連線
在瀏覽器控制台執行以下測試：

```javascript
// 測試通知 Realtime 連線
const testChannel = supabase
  .channel('test-notifications')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'notifications' },
    (payload) => console.log('Realtime event received:', payload)
  )
  .subscribe()

// 等待 2-3 秒後檢查連線狀態
setTimeout(() => {
  console.log('Channel status:', testChannel.state)
}, 3000)
```

## 🔍 故障排除指南

### 常見問題 1: Realtime 連線失敗
**症狀**: 前端顯示 `🔴 [表名] - Connection Failed`
**可能原因**:
- Realtime 功能未在 Supabase Dashboard 啟用
- RLS 政策過於嚴格，阻止 Realtime 事件
- 網路連線問題

**解決步驟**:
1. 確認 Supabase Dashboard 中該表的 Realtime 功能已啟用
2. 檢查 RLS 政策是否允許當前用戶訪問
3. 檢查瀏覽器網路連線和防火牆設定

### 常見問題 2: 輪詢備援機制啟用
**症狀**: 前端顯示 `🟡 [表名] - Polling Backup Active`
**說明**: 這是正常的備援機制，當 Realtime 連線失敗時自動切換到輪詢模式
**監控**: 確保輪詢頻率合理，避免過度消耗 API 配額

### 常見問題 3: 事件過濾器不工作
**症狀**: 收到不相關的 Realtime 事件
**解決方法**:
1. 檢查 `filter` 參數語法是否正確
2. 確認過濾欄位在表中存在且有正確索引
3. 測試過濾條件的 SQL 查詢

## 監控指標

### Realtime 連線健康狀態
- **連線成功率**: 目標 > 95%
- **事件延遲**: 目標 < 500ms
- **輪詢備援啟用次數**: 監控異常頻率

### 效能指標
- **Realtime 事件處理時間**: 平均 < 100ms
- **輪詢 API 呼叫頻率**: 避免超過配額限制
- **記憶體使用**: 監控 WebSocket 連線數量

## 部署前總檢查清單

### 必須完成項目 ✅
- [ ] 5 個已實現 Realtime 表的功能全部啟用並測試通過
- [ ] 所有 RLS 政策正確配置並測試通過
- [ ] Realtime 監控機制部署並正常工作
- [ ] 輪詢備援機制測試通過
- [ ] 開發模式 console 報告功能正常

### 建議完成項目 📋
- [ ] 產品相關 Realtime 功能實現 (FIXME 項目)
- [ ] 庫存即時警報系統實現
- [ ] 生產環境監控面板整合
- [ ] 自動重連機制完善

### 文件更新 📚
- [ ] 本檢查清單根據實際部署結果更新
- [ ] API 文件更新 Realtime 端點說明
- [ ] 運維手冊包含 Realtime 故障排除步驟

---

**最後更新**: 2025-07-30  
**負責人**: 開發團隊  
**審核人**: 系統管理員  

> 💡 **提示**: 這份檢查清單應該在每次部署前執行，並根據實際情況進行更新。所有檢查項目都應該有相應的測試腳本或驗證步驟。