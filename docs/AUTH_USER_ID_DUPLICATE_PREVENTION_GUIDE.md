# auth_user_id 重複防護機制完整指南

## 概述

本指南詳細說明電商系統中 `customers` 和 `users` 表的 `auth_user_id` 重複防護機制，確保認證系統的資料完整性和一致性。

## 防護目標

### 1. 防止單表內重複

- 確保 `customers.auth_user_id` 在表內唯一
- 確保 `users.auth_user_id` 在表內唯一

### 2. 防止跨表重複

- 確保同一個 `auth.users` 記錄不會同時對應 `customers` 和 `users` 記錄
- 建立明確的用戶身份歸屬：客戶 XOR 管理員

### 3. 統一身份管理

- 提供統一的用戶身份解析機制
- 簡化應用層的身份檢查邏輯

## 架構設計

### 資料庫層防護

#### 1. UNIQUE 約束

```sql
-- customers 表
ALTER TABLE customers
ADD CONSTRAINT customers_auth_user_id_unique
UNIQUE (auth_user_id);

-- users 表
ALTER TABLE users
ADD CONSTRAINT users_auth_user_id_unique
UNIQUE (auth_user_id);
```

#### 2. 跨表重複檢查觸發器

```sql
-- 觸發器函數
CREATE FUNCTION check_auth_user_id_uniqueness() RETURNS TRIGGER;

-- customers 表觸發器
CREATE TRIGGER trigger_customers_auth_user_id_uniqueness
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION check_auth_user_id_uniqueness();

-- users 表觸發器
CREATE TRIGGER trigger_users_auth_user_id_uniqueness
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION check_auth_user_id_uniqueness();
```

#### 3. 統一身份解析函數

```sql
-- 使用方式
SELECT resolve_user_identity('auth_user_id_here');

-- 回傳格式
{
  "type": "customer|admin|not_found",
  "id": "user_record_id",
  "auth_user_id": "auth_user_id"
}
```

### 應用層整合

#### 1. Edge Functions 更新

**sync-customer-record**

- 使用 `resolve_user_identity()` 檢查身份衝突
- 拒絕已註冊為管理員的用戶註冊為客戶

**sync-user-record**

- 使用 `resolve_user_identity()` 檢查身份衝突
- 拒絕已註冊為客戶的用戶註冊為管理員

**order-create**

- 使用統一身份解析函數簡化用戶身份檢查

## ⚡ 使用方式

### 檢查重複資料

```sql
-- 掃描所有重複資料
SELECT check_auth_user_id_duplicates();
```

### 解析用戶身份

```sql
-- 解析單一用戶身份
SELECT resolve_user_identity('550e8400-e29b-41d4-a716-446655440000');
```

### 手動清理重複資料

```sql
-- 如果發現重複資料，需要手動決定保留哪筆記錄
-- 範例：保留最新的記錄，刪除較舊的
DELETE FROM customers
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY auth_user_id
            ORDER BY created_at DESC
        ) as rn
        FROM customers
        WHERE auth_user_id IS NOT NULL
    ) ranked
    WHERE rn > 1
);
```

## 🛡️ 防護機制詳解

### Level 1: 資料庫約束層

- **UNIQUE 約束**: 防止單表內重複
- **觸發器**: 防止跨表重複
- **外鍵約束**: 確保 `auth_user_id` 對應有效的 `auth.users` 記錄（**重要**: 測試時需使用真實的 auth.users 記錄）

### Level 2: 應用邏輯層

- **Edge Functions**: 註冊前檢查身份衝突
- **統一解析**: 標準化的身份識別流程
- **錯誤處理**: 清楚的錯誤訊息和狀態碼

### Level 3: 監控與維護層

- **重複檢查函數**: 定期掃描資料完整性
- **清理機制**: 發現問題時的修復工具
- **測試腳本**: 驗證防護機制正常運作

## 故障排除

### 常見錯誤

#### 1. UNIQUE 約束違反

```
ERROR: duplicate key value violates unique constraint "customers_auth_user_id_unique"
```

**解決方案**: 檢查是否有重複資料，手動清理後重試

#### 2. 跨表重複錯誤

```
ERROR: 跨表重複錯誤：auth_user_id "xxx" 已存在於 users 表中，不能同時存在於 customers 表
```

**解決方案**: 確認用戶應該註冊為客戶還是管理員，清理衝突資料

#### 3. 身份解析失敗

```
ERROR: Identity resolution failed
```

**解決方案**: 檢查資料庫連線和函數是否正確部署

### 診斷工具

#### 1. 檢查約束是否存在

```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname LIKE '%auth_user_id%';
```

#### 2. 檢查觸發器是否啟用

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%auth_user_id%';
```

#### 3. 測試身份解析函數

```sql
-- 使用真實的 auth_user_id 進行測試
SELECT resolve_user_identity('existing_auth_user_id');

-- ⚠️ 注意：測試時遇到外鍵約束錯誤是正常的，因為 auth_user_id 必須存在於 auth.users 表中
-- 如需完整測試，請使用現有的有效 auth_user_id
```

## 效能考量

### 索引策略

- `auth_user_id` 欄位已建立索引，確保查詢效能
- UNIQUE 約束自動建立唯一索引

### 觸發器效能

- 觸發器僅在 INSERT/UPDATE 時執行
- 使用高效的 COUNT 查詢檢查跨表重複
- 對正常操作影響微乎其微

### 快取建議

- 應用層可快取身份解析結果（短期）
- 注意快取失效機制以確保資料一致性

## 🔮 未來擴展

### 可能的增強功能

1. **身份轉換機制**: 允許客戶升級為管理員（保留歷史資料）
2. **軟刪除支援**: 處理已刪除用戶的身份識別
3. **多租戶支援**: 在多租戶環境中的身份隔離
4. **審計日誌**: 記錄身份變更歷史

### 監控指標

- 重複資料檢測頻率
- 身份衝突發生次數
- 註冊失敗率（因身份衝突）
- 身份解析函數效能

## 檢查清單

### 部署前檢查

- [ ] 備份現有資料
- [ ] 檢查是否有現有重複資料
- [ ] 測試 migration 在開發環境
- [ ] 確認應用程式相容性

### 部署後驗證

- [ ] 執行測試腳本
- [ ] 確認約束已建立
- [ ] 確認觸發器已啟用
- [ ] 測試身份解析函數
- [ ] 驗證 Edge Functions 正常運作

### 定期維護

- [ ] 每月執行重複資料掃描
- [ ] 監控身份衝突錯誤
- [ ] 檢查觸發器效能
- [ ] 更新文件和測試案例

## 📞 支援資源

### 相關檔案

- Migration: `20250801100000_add_auth_user_id_unique_constraints.sql`
- 測試腳本: `auth_user_id_duplicate_prevention_verification.sql`
- Edge Functions: `sync-customer-record/`, `sync-user-record/`, `order-create/`

### 參考函數

- `check_auth_user_id_duplicates()`: 重複資料檢查
- `resolve_user_identity()`: 統一身份解析
- `check_auth_user_id_uniqueness()`: 觸發器函數

---

## 總結

這套完整的重複防護機制確保了電商系統中用戶身份的唯一性和一致性。通過多層防護（資料庫約束、觸發器、應用邏輯），系統能夠：

1. ✅ 防止 `auth_user_id` 在單一表內重複
2. ✅ 防止 `auth_user_id` 跨表重複
3. ✅ 提供統一的身份解析機制
4. ✅ 在應用層提供清楚的錯誤處理
5. ✅ 支援資料診斷和清理工具

這樣的設計確保了認證系統的穩定性，同時為未來的功能擴展奠定了堅實的基礎。
