# 訂單狀態與付款系統機制文檔

## 系統概述

本電商系統採用嚴格的訂單狀態管理機制，透過資料庫觸發器確保狀態轉換的一致性和業務邏輯的正確性。系統支援多種付款方式，並具備自動狀態同步和手動管理功能。

## 1. 訂單狀態流程

### 1.1 完整狀態轉換圖

```
訂單建立 → pending
         ↓
      confirmed (管理員確認/自動確認)
         ↓
       paid (付款完成時自動轉換)
         ↓
    processing (手動：開始處理)
         ↓
     shipped (手動：已出貨，需要物流單號)
         ↓
    delivered (手動：已送達)
         ↓
   completed (手動：訂單完成)

可隨時取消：
   Any Status → cancelled → refunded (退款完成)
```

### 1.2 允許的狀態轉換

```sql
-- 由 validate_order_status_transition() 函數控制
('pending', 'confirmed'),      -- 待處理 → 已確認
('pending', 'cancelled'),      -- 待處理 → 已取消
('confirmed', 'paid'),         -- 已確認 → 已付款
('confirmed', 'cancelled'),    -- 已確認 → 已取消
('paid', 'processing'),        -- 已付款 → 處理中
('paid', 'cancelled'),         -- 已付款 → 已取消
('processing', 'shipped'),     -- 處理中 → 已出貨
('processing', 'cancelled'),   -- 處理中 → 已取消
('shipped', 'delivered'),      -- 已出貨 → 已送達
('delivered', 'completed'),    -- 已送達 → 已完成
('cancelled', 'refunded')      -- 已取消 → 已退款
```

## 2. 付款系統機制

### 2.1 支援的付款方式

```sql
-- 資料庫約束定義
CHECK ((method = ANY (ARRAY[
  'credit_card'::text,      -- 信用卡
  'paypal'::text,           -- PayPal
  'bank_transfer'::text,    -- 銀行轉帳
  'cash_on_delivery'::text  -- 貨到付款
])))
```

### 2.2 付款狀態

```sql
-- 付款狀態約束
CHECK ((status = ANY (ARRAY[
  'pending'::text,    -- 待處理
  'completed'::text,  -- 已完成
  'failed'::text,     -- 失敗
  'refunded'::text    -- 已退款
])))
```

### 2.3 付款方式差異處理

#### 信用卡/PayPal/銀行轉帳
- **標準流程**：`pending` → `completed`
- **特點**：需要實際付款確認才轉為完成狀態
- **訂單影響**：付款完成時自動將訂單狀態設為 `paid`

#### 貨到付款 (Cash on Delivery)
- **特殊處理**：創建時直接設為 `completed`
- **業務邏輯**：送貨時收款，視為預先完成的付款
- **避免衝突**：防止觸發器將已確認訂單回退到 `pending`

## 3. 自動狀態轉換機制

### 3.1 付款觸發的訂單狀態同步

```sql
-- sync_order_status_with_payment() 觸發器邏輯
IF NEW.status = 'pending' THEN
    UPDATE orders SET status = 'pending', updated_at = NOW() WHERE id = NEW.order_id;
ELSIF NEW.status = 'completed' THEN
    UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = NEW.order_id;
ELSIF NEW.status = 'failed' THEN
    UPDATE orders SET status = 'pending', updated_at = NOW() WHERE id = NEW.order_id;
ELSIF NEW.status = 'refunded' THEN
    UPDATE orders SET status = 'refunded', updated_at = NOW() WHERE id = NEW.order_id;
```

### 3.2 觸發時機

1. **INSERT 觸發器**：新增付款記錄時自動同步
2. **UPDATE 觸發器**：付款狀態變更時自動同步
3. **條件觸發**：只有在狀態實際改變時才執行

### 3.3 業務規則驗證

```sql
-- check_order_business_rules() 確保：
-- 1. 確認訂單必須有商品項目
-- 2. 付款狀態需要有完成的付款記錄
-- 3. 出貨狀態需要物流單號
```

## 4. 手動管理場景

### 4.1 後台管理員操作

#### 場景一：手動標記為已付款
```typescript
// 使用 updateOrderToPaid() 處理
// 步驟：
// 1. 檢查訂單狀態，如果是 pending → 先設為 confirmed
// 2. 創建管理員付款記錄（標記為 ADMIN_MANUAL_）
// 3. 觸發器自動將訂單狀態設為 paid
```

#### 場景二：批量狀態更新
```typescript
// 批量處理不同狀態的訂單
// 確保每個狀態轉換都符合業務規則
```

#### 場景三：緊急訂單處理
```typescript
// 跳過某些驗證步驟，直接進入處理流程
// 但仍需遵循基本的狀態轉換規則
```

### 4.2 客戶操作

#### 場景一：前台付款
```typescript
// 透過 mock-payment Edge Function
// 1. 檢查訂單狀態
// 2. 如需要，先將 pending → confirmed
// 3. 創建付款記錄
// 4. 觸發器自動同步訂單狀態
```

#### 場景二：訂單取消
```typescript
// 客戶可在特定狀態下取消訂單
// 通常限制在 pending/confirmed 狀態
```

## 5. 錯誤處理與衝突避免

### 5.1 狀態轉換衝突

**問題**：`Invalid status transition from confirmed to pending`
**原因**：貨到付款創建 pending 付款記錄，觸發器嘗試將 confirmed 訂單回退到 pending
**解決**：
```typescript
// 在 mock-payment 函數中特殊處理
if (method === 'cash_on_delivery' && status === 'pending' && order.status !== 'pending') {
    finalPaymentStatus = 'completed';
}
```

### 5.2 併發處理

**問題**：多個操作同時修改訂單狀態
**解決**：
- 使用資料庫事務確保原子性
- 觸發器提供最終一致性保證
- 前端樂觀鎖定處理併發更新

### 5.3 資料一致性

**問題**：付款記錄與訂單狀態不一致
**解決**：
- 觸發器自動同步機制
- 定期資料完整性檢查
- 管理後台提供手動修復工具

## 6. 監控與日誌

### 6.1 狀態變更追蹤

```sql
-- 透過 updated_at 欄位追蹤變更時間
-- 透過 order_status_logs 表記錄詳細變更歷史（建議實作）
```

### 6.2 付款記錄追蹤

```sql
-- 每筆付款記錄包含：
-- - transaction_id: 外部交易識別碼
-- - method: 付款方式
-- - status: 付款狀態
-- - paid_at: 付款完成時間
-- - created_at/updated_at: 記錄時間戳
```

## 7. 系統配置

### 7.1 Edge Functions

- **mock-payment**: 模擬付款處理，處理狀態轉換邏輯
- **order-create**: 建立訂單並扣減庫存
- **order-summary**: 訂單統計分析

### 7.2 資料庫觸發器

- **validate_order_status_transition**: 狀態轉換驗證
- **sync_order_status_with_payment**: 付款狀態同步
- **check_order_business_rules**: 業務規則檢查
- **calculate_order_total**: 訂單金額計算
- **generate_order_number**: 訂單編號生成

### 7.3 前端狀態管理

#### 狀態機思維架構
採用輕量級狀態機思維，提供嚴謹的狀態轉換管理：

**核心組件**：
- **狀態轉換配置** (`ORDER_TRANSITIONS`): 定義允許的狀態轉換規則
- **轉換驗證函數** (`validateTransition`, `canTransitionTo`): 前端驗證邏輯
- **智能狀態選擇**: 只顯示有效的下個狀態選項
- **確認對話框**: 詳細的轉換預覽和業務說明

**UI 增強功能**：
- **單一訂單操作**: 智能狀態選擇和轉換確認
- **批量操作**: 預先驗證並分析批量轉換結果
- **錯誤處理**: 友善的錯誤訊息和操作指引
- **視覺化指示**: 狀態流程圖和轉換預覽

**關鍵文件**：
- `types/order.ts`: 狀態定義和轉換規則
- `composables/useOrder.ts`: 狀態轉換邏輯
- `components/order/OrderStatusTransitionDialog.vue`: 單一訂單轉換
- `components/order/BatchStatusTransitionDialog.vue`: 批量操作
- `docs/dev-notes/ORDER_STATE_MACHINE_APPROACH.md`: 完整設計文檔

### 7.4 技術整合

- **Vue.js Composables**: useOrder, usePayment
- **TypeScript 型別定義**: 確保型別安全和狀態轉換邏輯
- **即時訂閱**: 訂單狀態變更的即時通知
- **狀態驗證**: 前後端一致的業務規則驗證

## 8. 最佳實務

### 8.1 開發建議

1. **狀態轉換前先檢查**：確認當前狀態允許目標轉換
2. **使用事務處理**：多步驟操作包裝在事務中
3. **錯誤處理完整**：為每種異常情況提供處理邏輯
4. **日誌記錄詳細**：記錄關鍵操作和錯誤資訊

### 8.2 測試策略

1. **單元測試**：測試各個狀態轉換函數
2. **整合測試**：測試完整的訂單生命週期
3. **壓力測試**：測試併發訂單處理能力
4. **邊界測試**：測試異常狀態和錯誤情況

### 8.3 維護注意事項

1. **資料庫觸發器變更**：需要完整測試，避免破壞既有邏輯
2. **狀態定義修改**：需要同時更新前後端程式碼
3. **付款方式新增**：需要評估對現有邏輯的影響
4. **效能監控**：觀察觸發器對資料庫效能的影響

## 9. 故障排除

### 9.1 常見問題

1. **狀態轉換被拒絕**
   - 檢查 `validate_order_status_transition` 邏輯
   - 確認業務規則是否滿足

2. **付款狀態同步失敗**
   - 檢查觸發器是否正常執行
   - 查看錯誤日誌確認具體原因

3. **前端狀態顯示不一致**
   - 確認即時訂閱是否正常工作
   - 檢查前端快取機制

### 9.2 除錯工具

1. **資料庫查詢**：直接查看訂單和付款記錄狀態
2. **日誌分析**：透過應用程式日誌追蹤操作流程
3. **管理後台**：提供訂單狀態修復工具

---

本文檔會隨系統演進持續更新，確保與實際實作保持一致。