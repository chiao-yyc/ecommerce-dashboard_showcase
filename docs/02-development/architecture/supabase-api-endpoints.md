# Supabase API 端點規格

## Edge Functions (外部 API 端點)

### 1. 庫存分配 - `/functions/v1/allocate-inventory`
**方法**: POST  
**認證**: 需要 Bearer Token  

**功能**: 使用 FIFO 方式分配庫存，通常用於訂單建立時的庫存扣除。

**請求參數**:
```json
{
  "product_id": "string",     // 產品 ID
  "quantity": "number",       // 分配數量
  "source": "string",         // 分配來源 (如 "order", "adjustment")
  "ref_id": "string"          // 參考 ID (如訂單 ID)
}
```

**回應**:
```json
{
  "success": true,
  "product_id": "string",
  "current_stock": "number"   // 分配後的當前庫存
}
```

### 2. 模擬付款 - `/functions/v1/mock-payment`
**方法**: POST  
**認證**: 需要 Bearer Token  

**功能**: 模擬付款處理，更新付款狀態並同步訂單狀態。

**請求參數**:
```json
{
  "order_id": "string",       // 訂單 ID
  "method": "string",         // 付款方式 (如 "credit_card", "bank_transfer")
  "amount": "number",         // 付款金額
  "status": "string"          // 付款狀態 ("completed", "failed", "refunded")
}
```

**回應**:
```json
{
  "success": true
}
```

### 3. 建立訂單 - `/functions/v1/order-create`
**方法**: POST  
**認證**: 需要 Bearer Token  

**功能**: 建立訂單並自動處理庫存分配。

**請求參數**:
```json
{
  "order_data": {
    "customer_email": "string",
    "total_amount": "number",
    "status": "string",
    // 其他訂單欄位...
  },
  "items": [
    {
      "product_id": "string",
      "quantity": "number",
      "unit_price": "number"
    }
  ]
}
```

**回應**:
```json
{
  "success": true,
  "order_id": "string"
}
```

### 4. 訂單摘要 - `/functions/v1/order-summary`
**方法**: GET  
**認證**: 不需要 (匿名訪問)  

**功能**: 取得訂單統計摘要，支援多種時間範圍查詢。

**查詢參數**:
- `period_label`: 時間範圍，可多選 (today, last_7_days, last_30_days, last_60_days, last_6_months, last_1_year)

**回應**:
```json
{
  "success": true,
  "data": {
    "today": {
      "data": [...],
      "total_amount": "number",
      "total_orders": "number",
      "paid_rate": "number",
      "cancel_rate": "number"
    }
  }
}
```

### 5. 同步使用者記錄 - `/functions/v1/sync-user-record`
**方法**: POST  
**認證**: 需要 Bearer Token  

**功能**: 同步 Auth 使用者到 public.users 表，處理使用者登入後的資料同步。

**請求參數**: 無 (從 JWT Token 取得使用者資訊)

**回應**:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "full_name": "string",
    "avatar_url": "string"
  }
}
```

### 6. 話題分析 - `/functions/v1/topic-analysis`
**方法**: POST  
**認證**: 需要 Service Role Key  

**功能**: 分析客服對話的主題，自動分類支援請求。

**請求參數**:
```json
{
  "conversation_id": "string",
  "message": "string"
}
```

**回應**:
```json
{
  "success": true,
  "topic": "string",           // 分析出的主題
  "message": "string"          // 處理結果訊息
}
```

## 資料庫 RPC Functions (內部 API)

### 訂單管理
- `create_order_with_items(order_data, items, created_by)` - 建立訂單含商品
- `calculate_order_total(order_id)` - 計算訂單總額
- `validate_order_status_transition(order_id, new_status)` - 驗證訂單狀態轉換

### 庫存管理
- `allocate_stock_fifo(product_id, quantity, source, ref_id, created_by)` - FIFO 庫存分配
- `get_product_current_stock(product_id)` - 取得商品當前庫存
- `get_inventory_overview()` - 庫存總覽
- `get_product_overview()` - 商品總覽

### 分析功能
- `get_customer_analysis()` - 客戶分析
- `get_order_trend_analysis()` - 訂單趨勢分析
- `get_product_sales_analysis()` - 商品銷售分析
- `get_user_rfm_overview()` - RFM 客戶分群總覽

### 客服系統
- `assign_next_conversation(agent_id)` - 分配下一個對話
- `update_agent_current_load(agent_id)` - 更新客服工作負載
- `update_conversation_last_reply(conversation_id)` - 更新對話最後回覆時間

## 重要資料庫檢視 (Views)

### 使用者相關
- `user_with_roles` - 使用者含角色資訊
- `user_permission_map` - 使用者權限對應
- `agent_users` - 具備客服權限的使用者

### 商品庫存
- `product_with_current_stock` - 商品含當前庫存
- `inventory_with_stock_detail` - 庫存明細
- `product_inventory_status` - 商品庫存狀態

### 客服系統
- `conversation_details` - 對話詳細資訊
- `agent_workload_summary` - 客服工作負載摘要

### 分析報表
- `user_rfm_lifecycle_metrics` - 使用者 RFM 生命週期指標
- `user_ltv_metrics` - 使用者終身價值指標
- `daily_order_summary` - 每日訂單摘要
- `order_analysis` - 訂單分析檢視

## 認證說明

### Edge Functions 認證
- 大部分 Edge Functions 需要 Bearer Token 認證
- Token 從前端 `Authorization` header 傳遞
- 系統會自動驗證並取得對應的 local user ID

### RPC Functions 認證
- 透過 Supabase Client 的 RLS 機制控制
- 需要正確的資料庫角色和權限設定

## 錯誤處理

所有 API 端點都實作統一的錯誤處理格式：
```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

常見 HTTP 狀態碼：
- `200` - 成功
- `400` - 參數錯誤
- `401` - 未授權
- `500` - 伺服器錯誤