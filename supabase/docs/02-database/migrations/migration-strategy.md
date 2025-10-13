# Migration 管理策略

## 概述

本文檔記錄基於 **195 個 Migrations** 的管理經驗，提供 Supabase 資料庫演進的最佳實踐。

📖 **相關文檔**：
- [Seed 資料管理](./seed-data-management.md) - 種子資料策略
- [本地開發指南](../../01-getting-started/local-development.md) - 開發工作流程

## 🎯 Migration 策略原則

### 1. 原子性 (Atomic)
每個 migration 應該是獨立且可逆的單位：

```sql
-- ✅ 好的範例：單一明確的變更
-- 20250101000000_add_user_email_column.sql
ALTER TABLE users ADD COLUMN email TEXT;

-- ❌ 壞的範例：混雜多個不相關變更
-- 20250101000000_misc_updates.sql
ALTER TABLE users ADD COLUMN email TEXT;
ALTER TABLE products ADD COLUMN sku TEXT;
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### 2. 向前相容 (Forward Compatible)
新的 migration 應該考慮舊版程式碼的相容性：

```sql
-- ✅ 好的範例：先添加欄位（nullable），再逐步遷移資料
ALTER TABLE users ADD COLUMN phone_number TEXT; -- nullable

-- 逐步遷移資料後，再添加約束
-- 下一個 migration:
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;

-- ❌ 壞的範例：直接添加 NOT NULL 欄位
ALTER TABLE users ADD COLUMN phone_number TEXT NOT NULL;
```

### 3. 可回滾 (Reversible)
關鍵變更應該提供回滾方案：

```sql
-- 20250101000000_add_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL
);

-- 回滾腳本（如需要）
-- DROP TABLE users;
```

## 📋 Migration 命名規範

### 時間戳格式
Supabase CLI 自動生成：`YYYYMMDDHHmmss_description.sql`

### 描述性命名最佳實踐

| 類型 | 命名模式 | 範例 |
|------|---------|------|
| **新增表** | `create_[table_name]_table` | `create_notifications_table.sql` |
| **新增欄位** | `add_[column]_to_[table]` | `add_suggested_at_to_notifications.sql` |
| **修改欄位** | `alter_[column]_in_[table]` | `alter_status_in_orders.sql` |
| **新增索引** | `add_index_on_[table]_[column]` | `add_index_on_orders_user_id.sql` |
| **新增觸發器** | `add_[trigger_name]_trigger` | `add_notify_order_events_trigger.sql` |
| **新增 RLS 政策** | `add_rls_to_[table]` | `add_rls_to_notifications.sql` |
| **資料遷移** | `migrate_[description]` | `migrate_old_campaign_data.sql` |
| **重大功能** | `implement_[feature_name]` | `implement_layered_attribution.sql` |

### 實際範例

```bash
# 專案中的優秀命名範例
20250723200000_layered_attribution_implementation.sql  # 分層歸因實作
20250731170000_fix_notification_triggers_for_real_tables.sql  # 修復通知觸發器
20251002300000_add_rls_to_analytics_tables.sql  # 添加 RLS 政策
```

## 🔄 Migration 開發工作流程

### 1. 本地開發
```bash
# 創建新的 migration
supabase migration new add_user_preferences_table

# 編輯 SQL 檔案
vim supabase/migrations/20250101120000_add_user_preferences_table.sql

# 應用 migration 到本地資料庫
supabase db reset
```

### 2. 測試與驗證
```bash
# 檢查 migration 是否成功應用
supabase status

# 查看資料庫結構變更
supabase db diff

# 執行整合測試
npm run test:integration
```

### 3. 提交與部署
```bash
# 提交 migration 到版本控制
git add supabase/migrations/20250101120000_add_user_preferences_table.sql
git commit -m "feat(db): add user preferences table"

# 部署到生產環境
supabase db push --db-url="postgresql://..."
```

## 🎯 Migration 分類與策略

### Schema 變更 (Schema Migrations)
最常見的 migration 類型，負責資料庫結構演進。

#### 新增表
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
```

#### 修改表結構
```sql
-- 添加新欄位（向前相容）
ALTER TABLE notifications ADD COLUMN suggested_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN suggestion_reason TEXT;

-- 添加約束
ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check
  CHECK (priority IN ('urgent', 'high', 'medium', 'low'));
```

### 資料遷移 (Data Migrations)
處理現有資料的轉換和遷移。

#### 資料轉換範例
```sql
-- 遷移舊格式到新格式
UPDATE campaigns
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{migrated_at}',
  to_jsonb(NOW())
)
WHERE metadata IS NULL OR NOT metadata ? 'migrated_at';
```

#### 批量資料更新
```sql
-- 分批更新，避免鎖表
DO $$
DECLARE
  batch_size INT := 1000;
  updated_count INT := 0;
BEGIN
  LOOP
    UPDATE orders
    SET status = 'completed'
    WHERE id IN (
      SELECT id FROM orders
      WHERE status = 'delivered' AND delivered_at < NOW() - INTERVAL '7 days'
      LIMIT batch_size
    );

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    EXIT WHEN updated_count = 0;

    RAISE NOTICE 'Updated % rows', updated_count;
    PERFORM pg_sleep(0.1); -- 避免持續佔用資源
  END LOOP;
END $$;
```

### 索引優化 (Index Migrations)
新增或調整索引以提升查詢效能。

```sql
-- 新增複合索引優化常見查詢
CREATE INDEX idx_notifications_user_status_created
ON notifications(user_id, status, created_at DESC);

-- 新增部分索引（只索引特定條件的資料）
CREATE INDEX idx_notifications_suggested
ON notifications(suggested_complete)
WHERE suggested_complete = TRUE;

-- 並行建立索引（不鎖表）
CREATE INDEX CONCURRENTLY idx_orders_user_created
ON orders(user_id, created_at DESC);
```

### RLS 政策 (RLS Policy Migrations)
配置行級安全性政策。

```sql
-- 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 使用者只能查看自己的通知
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- 管理員可以查看所有通知
CREATE POLICY "Admins can view all notifications"
ON notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_name = 'admin'
  )
);
```

### 觸發器與函數 (Trigger Migrations)
自動化業務邏輯。

```sql
-- 創建觸發器函數
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('processing', 'shipped', 'delivered')
     AND OLD.status = 'pending' THEN
    UPDATE notifications
    SET suggested_complete = TRUE,
        suggested_at = NOW(),
        suggestion_reason = '訂單已進入處理流程'
    WHERE type = 'order_new'
      AND entity_type = 'order'
      AND entity_id = NEW.id
      AND completion_strategy = 'suggested';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器
CREATE TRIGGER trigger_notify_order_events
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_order_events();
```

## ⚠️ Migration 常見陷阱

### 1. 長時間鎖表
```sql
-- ❌ 壞的範例：會鎖表
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ✅ 好的範例：並行建立索引
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at);
```

### 2. NOT NULL 約束問題
```sql
-- ❌ 壞的範例：直接添加 NOT NULL
ALTER TABLE users ADD COLUMN phone TEXT NOT NULL;

-- ✅ 好的範例：分階段進行
-- Step 1: 添加 nullable 欄位
ALTER TABLE users ADD COLUMN phone TEXT;

-- Step 2: 填充資料
UPDATE users SET phone = 'default' WHERE phone IS NULL;

-- Step 3: 添加約束
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

### 3. 外鍵約束衝突
```sql
-- ❌ 壞的範例：直接添加外鍵
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);

-- ✅ 好的範例：先檢查資料完整性
-- Step 1: 檢查孤兒資料
SELECT COUNT(*) FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Step 2: 清理孤兒資料（如需要）
DELETE FROM orders WHERE user_id NOT IN (SELECT id FROM users);

-- Step 3: 添加外鍵
ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
```

## 📊 Migration 統計與管理

### 當前專案統計
```bash
# 查看 migrations 數量
ls -1 supabase/migrations/ | wc -l
# 結果：195

# 查看最近的 migrations
ls -lt supabase/migrations/ | head -10
```

### Migration 歷史追蹤
```sql
-- 查看已應用的 migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 10;

-- 查看特定表的變更歷史
SELECT
  version,
  name,
  statements
FROM supabase_migrations.schema_migrations
WHERE statements LIKE '%notifications%'
ORDER BY version DESC;
```

## 🛠️ 故障排除

### Migration 失敗
```bash
# 查看詳細錯誤訊息
supabase db reset --debug

# 檢查 migration 檔案語法
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/XXXXXX.sql
```

### 回滾 Migration
```bash
# Supabase CLI 不支援自動回滾，需要手動處理
# 1. 創建回滾 migration
supabase migration new rollback_add_user_preferences

# 2. 編寫回滾 SQL
vim supabase/migrations/XXXXXX_rollback_add_user_preferences.sql

# 內容：
# DROP TABLE user_preferences;

# 3. 應用回滾
supabase db reset
```

## 🎯 最佳實踐總結

### ✅ DO（推薦）
- 使用描述性的 migration 名稱
- 每個 migration 只做一件事
- 使用事務包裝關鍵變更
- 新增 NOT NULL 約束前先填充資料
- 使用 `CREATE INDEX CONCURRENTLY` 避免鎖表
- 在 migration 中添加註釋說明
- 本地測試 migration 再提交

### ❌ DON'T（避免）
- 不要在一個 migration 中混雜多個不相關變更
- 不要直接在生產環境測試 migration
- 不要忽略外鍵約束的資料完整性檢查
- 不要在高峰時段執行大型 migration
- 不要刪除舊的 migration 檔案
- 不要手動修改已應用的 migration

## 📚 相關資源

- [Supabase Migrations 官方文檔](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL ALTER TABLE 文檔](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL 索引最佳實踐](https://www.postgresql.org/docs/current/indexes.html)
- [專案 Seed 資料管理](./seed-data-management.md)
