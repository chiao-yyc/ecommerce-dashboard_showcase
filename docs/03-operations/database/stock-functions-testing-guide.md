# Stock Functions 測試指南

## 概述

本指南提供了 `stock-in` 和 `stock-adjust` Edge Functions 的完整測試流程，包括資料庫測試、API 測試和前端整合測試。

## 🧪 測試架構

### 測試層級
1. **資料庫層測試** - 驗證 SQL 函數和觸發器
2. **Edge Functions API 測試** - 驗證 HTTP 端點
3. **前端整合測試** - 驗證 UI 組件和 Realtime 更新
4. **端到端測試** - 完整流程驗證

## 準備工作

### 環境設定
```bash
# 1. 確保 Supabase 本地環境運行
supabase start

# 2. 部署 Edge Functions
supabase functions deploy stock-in
supabase functions deploy stock-adjust

# 3. 執行資料庫遷移
supabase db reset
```

### 測試資料準備
```bash
# 執行資料庫測試腳本
psql -h localhost -p 54322 -d postgres -U postgres -f supabase/docs/scripts/edge-functions-test.sql
```

## 資料庫層測試

### 執行測試
```bash
# 完整的資料庫功能測試
psql -h localhost -p 54322 -d postgres -U postgres -f supabase/docs/scripts/edge-functions-test.sql

# FIFO 完整流程測試
psql -h localhost -p 54322 -d postgres -U postgres -f supabase/docs/scripts/fifo-complete-flow-test.sql
```

### 測試覆蓋範圍

#### ✅ 入庫觸發器測試
- 自動建立 `inventory_logs` 'in' 記錄
- 正確的時間戳和創建者資訊
- 資料完整性約束

#### ✅ 庫存調整函數測試
- 正數增加庫存
- 負數減少庫存
- 邊界條件保護（不能超過現有庫存）
- 零調整保護

#### ✅ FIFO 排序完整性測試
- 按 `received_at ASC NULLS LAST` 排序
- 調整後 FIFO 持續性
- 併發操作安全性

### 預期結果
```
📊 ===============================
📊 Edge Functions 測試總結
📊 ===============================
✅ adjust_inventory_stock 函數基礎功能
✅ 入庫觸發器自動建立日誌
✅ FIFO 排序與新功能整合
✅ 邊界條件保護機制
✅ 資料完整性約束有效

🎯 建議下一步：
   1. 測試 Edge Functions HTTP API
   2. 驗證前端整合
   3. 建立 UI 組件
📊 ===============================
```

## API 層測試

### 配置環境變數
```bash
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_ANON_KEY="your_anon_key"
export AUTH_TOKEN="your_jwt_token"
```

### 執行 API 測試
```bash
# 執行完整 API 測試套件
./supabase/docs/scripts/edge-functions-api-test.sh
```

### 手動 API 測試

#### Stock-In API 測試
```bash
# 基本入庫測試
curl -X POST http://localhost:54321/functions/v1/stock-in \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{
    "product_id": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    "quantity": 100,
    "source": "api_test",
    "note": "API 測試入庫",
    "received_at": "2025-07-31T10:00:00Z"
  }'
```

#### Stock-Adjust API 測試
```bash
# 庫存調整測試
curl -X POST http://localhost:54321/functions/v1/stock-adjust \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -d '{
    "inventory_id": "test-inventory-id",
    "adjust_quantity": 25,
    "reason": "API 測試調整",
    "source": "api_test"
  }'
```

### API 測試檢查點

#### ✅ 成功回應格式
```json
{
  "success": true,
  "inventory_id": "uuid",
  "product_id": "uuid", 
  "quantity": 100,
  "current_stock": 150,
  "message": "Successfully added 100 units..."
}
```

#### ✅ 錯誤處理
- 401: 未授權
- 400: 無效參數
- 404: 產品不存在
- 500: 伺服器錯誤

## 前端整合測試

### 開發者工具測試
在瀏覽器控制台中：
```javascript
// 載入測試工具
import('/src/utils/edge-functions-integration-test.ts')

// 執行完整測試
await window.edgeFunctionsTest.runTests()

// 單項測試
await window.edgeFunctionsTest.testStockIn()
await window.edgeFunctionsTest.testStockAdjust()
```

### UI 組件測試

#### 庫存調整表單測試
1. 開啟庫存管理頁面 `/inventory-management`
2. 點擊庫存項目的「調整庫存」按鈕
3. 測試表單驗證：
   - 調整類型選擇
   - 數量輸入驗證
   - 原因選擇必填
   - 減少數量不能超過現有庫存

#### 入庫表單測試
1. 點擊「商品入庫」按鈕
2. 測試產品搜尋功能
3. 驗證表單完整性：
   - 產品選擇必填
   - 數量必須為正數
   - 收貨時間自動填入
   - 來源類型選擇

### Realtime 更新測試
1. 開啟兩個瀏覽器分頁
2. 在一個分頁執行庫存操作
3. 驗證另一個分頁是否即時更新：
   - 庫存數量變化
   - 庫存狀態更新
   - 統計卡片更新

## 端到端測試

### 完整入庫流程測試
1. **入庫操作**：
   - 選擇產品 → 輸入數量 → 提交
   - 檢查成功提示
   - 驗證庫存列表更新

2. **資料驗證**：
   ```sql
   -- 檢查 inventories 表
   SELECT * FROM inventories WHERE note LIKE '%測試入庫%';
   
   -- 檢查 inventory_logs 表
   SELECT * FROM inventory_logs WHERE type = 'in' 
     AND inventory_id IN (SELECT id FROM inventories WHERE note LIKE '%測試入庫%');
   ```

3. **Realtime 驗證**：
   - 即時庫存更新
   - 跨頁面同步

### 完整調整流程測試
1. **調整操作**：
   - 選擇調整類型 → 輸入數量和原因 → 提交
   - 檢查成功提示
   - 驗證預覽計算正確

2. **資料驗證**：
   ```sql
   -- 檢查調整記錄
   SELECT * FROM inventory_logs WHERE type = 'adjust' 
     AND reason LIKE '%測試調整%';
   
   -- 驗證庫存計算
   SELECT i.id, i.quantity as initial,
          COALESCE(SUM(CASE WHEN il.type = 'adjust' THEN il.quantity ELSE 0 END), 0) as adjustments,
          COALESCE(SUM(CASE WHEN il.type = 'out' THEN il.quantity ELSE 0 END), 0) as out_total
   FROM inventories i
   LEFT JOIN inventory_logs il ON i.id = il.inventory_id
   WHERE i.note LIKE '%測試%'
   GROUP BY i.id, i.quantity;
   ```

## 🚨 故障排除

### 常見問題

#### 1. Edge Functions 部署失敗
```bash
# 檢查函數狀態
supabase functions list

# 重新部署
supabase functions deploy stock-in --no-verify-jwt
supabase functions deploy stock-adjust --no-verify-jwt
```

#### 2. 身份驗證失敗
```bash
# 檢查 JWT token
echo $AUTH_TOKEN | jwt decode -

# 重新生成 token
supabase auth login
```

#### 3. 資料庫連線問題
```bash
# 檢查 Supabase 狀態
supabase status

# 重新啟動
supabase stop
supabase start
```

### 除錯技巧

#### 檢查 Edge Function 日誌
```bash
# 即時查看日誌
supabase functions logs stock-in
supabase functions logs stock-adjust
```

#### 資料庫查詢除錯
```sql
-- 檢查庫存記錄
SELECT p.name, i.quantity, i.received_at, i.created_at
FROM inventories i
JOIN products p ON i.product_id = p.id
WHERE i.created_at > NOW() - INTERVAL '1 hour'
ORDER BY i.created_at DESC;

-- 檢查庫存日誌
SELECT il.type, il.quantity, il.source, il.reason, il.created_at
FROM inventory_logs il
WHERE il.created_at > NOW() - INTERVAL '1 hour'
ORDER BY il.created_at DESC;
```

## ✅ 測試檢查清單

### 資料庫測試 ✅
- [ ] 入庫觸發器正常工作
- [ ] 庫存調整函數正確處理正負數
- [ ] FIFO 排序邏輯正確
- [ ] 邊界條件保護有效
- [ ] 資料完整性約束正常

### API 測試 ✅  
- [ ] stock-in API 回應正確
- [ ] stock-adjust API 回應正確
- [ ] 錯誤處理符合預期
- [ ] CORS 設定正確
- [ ] 身份驗證正常

### 前端測試 ✅
- [ ] 入庫表單驗證正確
- [ ] 調整表單驗證正確
- [ ] 產品搜尋功能正常
- [ ] 提交成功後 UI 更新
- [ ] 錯誤訊息正確顯示

### Realtime 測試 ✅
- [ ] 庫存操作後即時更新
- [ ] 跨頁面狀態同步
- [ ] 統計資料即時計算
- [ ] 庫存狀態正確更新

### 整合測試 ✅
- [ ] 完整入庫流程正常
- [ ] 完整調整流程正常
- [ ] 併發操作處理正確
- [ ] 效能符合預期

## 📈 效能基準

### 回應時間目標
- **API 回應**: < 500ms
- **資料庫查詢**: < 100ms
- **前端更新**: < 200ms
- **Realtime 延遲**: < 1s

### 併發測試
- **同時入庫**: 10 個請求/秒
- **同時調整**: 5 個請求/秒
- **資料一致性**: 100% 保證

## 測試報告模板

```markdown
## 測試執行報告

**測試日期**: 2025-07-31
**測試環境**: 本地開發環境
**測試人員**: [姓名]

### 測試結果統計
- 總測試項目: XX
- 通過項目: XX  
- 失敗項目: XX
- 通過率: XX%

### 關鍵發現
- [記錄重要發現]

### 建議行動
- [列出需要修復的問題]
- [優化建議]
```

---

**完整測試預估時間**: 2-3 小時  
**建議測試頻率**: 每次功能更新後執行  
**維護者**: 開發團隊