# 資料流說明（Vue 版本）

> 本文件說明 Vue 版本下的資料流設計，對應原專案需求。

## 1. 下單 → 庫存扣減
1. 前端 `POST /orders`（透過 API 方法）
2. Supabase `orders` INSERT trigger → `inventory_logs` + `inventories.stock - qty`
3. Realtime 對 `orders`、`inventory_logs` 推播（可用 Vue composable 處理）
4. 前端 Dashboard KPI 即時更新（Pinia 狀態管理）

## 2. 訂單取消
1. `PATCH /orders/{id}/cancel`（API）
2. 更新 `orders.status = 'cancelled'`
3. Trigger 回補 `inventories.stock + qty`
4. Insert `inventory_logs` type=`cancel`

## 3. 客服訊息
1. WebSocket 連線 `/messages/stream`（可用 composable 實作）
2. 使用者發送 `POST /messages`
3. Realtime 推播至對方 client
4. Chat UI 更新 & 未讀計數 +1（Pinia 狀態）

## 4. RFM View 刷新 (每日 Cron)
1. Edge Function (schedule 00:30 UTC)
2. 聚合 `orders` → 更新 `user_rfm_view`
3. 前端再取新資料呈現

---

（可補充 Vue 資料流示意圖、Pinia 實作細節）
