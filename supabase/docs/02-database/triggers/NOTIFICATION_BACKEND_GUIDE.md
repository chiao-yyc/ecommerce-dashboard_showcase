# 通知系統後端開發指南

## 概述

本指南詳細說明通知系統的後端實作，包含資料庫結構設計、PostgreSQL 觸發器函數、智能建議系統、RLS 政策和效能優化策略。

📖 **相關文檔**：
- [通知系統概述](../../../../../docs/04-guides/dev-notes/NOTIFICATION_SYSTEM_OVERVIEW.md) - 系統整體架構
- [通知前端指南](../../../../../admin-platform-vue/docs/04-guides/dev-notes/NOTIFICATION_FRONTEND_GUIDE.md) - Vue 組件與 API

## 資料庫結構

### 核心表結構

#### notifications 表

```sql
CREATE TABLE notifications (
  -- 主鍵與外鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 通知基本資訊
  type TEXT NOT NULL,                        -- 通知類型（對應 template type）
  title TEXT NOT NULL,                       -- 通知標題
  message TEXT NOT NULL,                     -- 通知訊息
  priority TEXT NOT NULL DEFAULT 'medium',   -- 優先級：urgent, high, medium, low
  status TEXT NOT NULL DEFAULT 'unread',     -- 狀態：unread, read, completed, archived, dismissed

  -- 分類與完成策略
  category TEXT NOT NULL DEFAULT 'informational', -- 分類：informational, actionable
  completion_strategy TEXT NOT NULL DEFAULT 'auto', -- 完成策略：auto, suggested, manual

  -- 智能建議相關
  suggested_complete BOOLEAN DEFAULT FALSE,  -- 是否建議完成
  suggested_at TIMESTAMP WITH TIME ZONE,     -- 建議時間
  suggestion_reason TEXT,                    -- 建議原因

  -- 實體關聯
  entity_type TEXT,                          -- 相關實體類型：order, product, customer, conversation
  entity_id UUID,                            -- 相關實體 ID
  action_url TEXT,                           -- 操作連結

  -- 元資料
  metadata JSONB DEFAULT '{}',               -- 額外資料（模板參數等）

  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,

  -- 索引
  CONSTRAINT notifications_priority_check CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  CONSTRAINT notifications_status_check CHECK (status IN ('unread', 'read', 'completed', 'archived', 'dismissed')),
  CONSTRAINT notifications_category_check CHECK (category IN ('informational', 'actionable')),
  CONSTRAINT notifications_completion_strategy_check CHECK (completion_strategy IN ('auto', 'suggested', 'manual'))
);

-- 效能索引
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_suggested ON notifications(suggested_complete) WHERE suggested_complete = TRUE;
```

#### notification_templates 表

```sql
CREATE TABLE notification_templates (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 模板基本資訊
  type TEXT UNIQUE NOT NULL,                 -- 通知類型（唯一識別碼）
  title_template TEXT NOT NULL,              -- 標題模板（支援變數替換）
  message_template TEXT NOT NULL,            -- 訊息模板（支援變數替換）

  -- 預設設定
  default_priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT NOT NULL DEFAULT 'informational',
  completion_strategy TEXT NOT NULL DEFAULT 'auto',

  -- 路由與完成說明
  action_url_template TEXT,                  -- 操作連結模板
  completion_notes TEXT,                     -- 完成說明

  -- 模板狀態
  is_active BOOLEAN DEFAULT TRUE,            -- 是否啟用
  is_frequently_used BOOLEAN DEFAULT FALSE,  -- 是否為常用模板

  -- 實體類型
  required_entity_type TEXT,                 -- 必要的實體類型

  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT notification_templates_priority_check CHECK (default_priority IN ('urgent', 'high', 'medium', 'low')),
  CONSTRAINT notification_templates_category_check CHECK (category IN ('informational', 'actionable')),
  CONSTRAINT notification_templates_completion_strategy_check CHECK (completion_strategy IN ('auto', 'suggested', 'manual'))
);

-- 效能索引
CREATE INDEX idx_notification_templates_type ON notification_templates(type);
CREATE INDEX idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = TRUE;
```

#### notification_preferences 表

```sql
CREATE TABLE notification_preferences (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 偏好設定
  notification_type TEXT NOT NULL,           -- 通知類型
  channels JSONB DEFAULT '{"in_app": true, "email": false, "sms": false}', -- 通知頻道
  is_enabled BOOLEAN DEFAULT TRUE,           -- 是否啟用

  -- 時間戳記
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 唯一約束
  UNIQUE(user_id, notification_type)
);

-- 效能索引
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
```

## PostgreSQL 觸發器函數

### 智能建議觸發器

#### 1. notify_inventory_events() - 庫存事件通知

監控 products 表的庫存欄位變更，觸發庫存相關通知的智能建議。

```sql
CREATE OR REPLACE FUNCTION notify_inventory_events()
RETURNS TRIGGER AS $$
BEGIN
  -- 庫存補充觸發智能建議
  IF NEW.stock_quantity >= NEW.reorder_point AND OLD.stock_quantity < OLD.reorder_point THEN
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '庫存已補充至安全水位'
    WHERE
      type IN ('inventory_low_stock', 'inventory_out_of_stock')
      AND entity_type = 'product'
      AND entity_id = NEW.id
      AND completion_strategy = 'suggested'
      AND status NOT IN ('completed', 'archived', 'dismissed');
  END IF;

  -- 庫存調整觸發過多警告建議完成
  IF NEW.stock_quantity <= NEW.max_stock AND OLD.stock_quantity > OLD.max_stock THEN
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '庫存已調整至合理範圍'
    WHERE
      type = 'inventory_overstock'
      AND entity_type = 'product'
      AND entity_id = NEW.id
      AND completion_strategy = 'suggested'
      AND status NOT IN ('completed', 'archived', 'dismissed');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器到 products 表
CREATE TRIGGER trigger_notify_inventory_events
AFTER UPDATE ON products
FOR EACH ROW
WHEN (OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity)
EXECUTE FUNCTION notify_inventory_events();
```

#### 2. notify_order_events() - 訂單事件通知

監控 orders 表的狀態欄位變更，觸發訂單相關通知的智能建議。

```sql
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS TRIGGER AS $$
BEGIN
  -- 訂單狀態變更觸發新訂單通知完成建議
  IF NEW.status IN ('processing', 'shipped', 'delivered')
     AND OLD.status = 'pending' THEN
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '訂單已進入處理流程'
    WHERE
      type = 'order_new'
      AND entity_type = 'order'
      AND entity_id = NEW.id
      AND completion_strategy = 'suggested'
      AND status NOT IN ('completed', 'archived', 'dismissed');
  END IF;

  -- 訂單支付成功觸發支付失敗通知完成
  IF NEW.payment_status = 'paid' AND OLD.payment_status IN ('pending', 'failed') THEN
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '訂單已成功支付'
    WHERE
      type = 'order_payment_failed'
      AND entity_type = 'order'
      AND entity_id = NEW.id
      AND status NOT IN ('completed', 'archived', 'dismissed');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器到 orders 表
CREATE TRIGGER trigger_notify_order_events
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
EXECUTE FUNCTION notify_order_events();
```

#### 3. notify_customer_service_events() - 客服事件通知

監控 conversations 表的回覆時間和狀態，觸發客服相關通知的智能建議。

```sql
CREATE OR REPLACE FUNCTION notify_customer_service_events()
RETURNS TRIGGER AS $$
BEGIN
  -- 客服首次回覆觸發新請求通知完成建議
  IF NEW.last_reply_at IS NOT NULL AND OLD.last_reply_at IS NULL THEN
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '客服已回覆客戶請求'
    WHERE
      type = 'customer_service_new_request'
      AND entity_type = 'conversation'
      AND entity_id = NEW.id
      AND completion_strategy = 'suggested'
      AND status NOT IN ('completed', 'archived', 'dismissed');
  END IF;

  -- 案件狀態變更為已解決觸發逾期通知完成
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '客服案件已解決'
    WHERE
      type IN ('customer_service_new_request', 'customer_service_overdue')
      AND entity_type = 'conversation'
      AND entity_id = NEW.id
      AND status NOT IN ('completed', 'archived', 'dismissed');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器到 conversations 表
CREATE TRIGGER trigger_notify_customer_service_events
AFTER UPDATE ON conversations
FOR EACH ROW
WHEN (OLD.last_reply_at IS DISTINCT FROM NEW.last_reply_at OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_customer_service_events();
```

## 智能建議系統

### 工作原理

智能建議系統透過以下四個步驟運作：

#### 1. 自動偵測機制
- 系統持續監控相關實體的變更事件（庫存變更、訂單狀態、客服回覆等）
- 使用 PostgreSQL 觸發器即時捕獲資料變更
- 根據預定義規則判斷是否符合建議觸發條件

#### 2. 條件判斷邏輯

```sql
-- 範例：庫存補充觸發智能建議
UPDATE notifications
SET
  suggested_complete = TRUE,
  suggested_at = NOW(),
  suggestion_reason = '庫存已補充至安全水位'
WHERE
  type IN ('inventory_low_stock', 'inventory_overstock')
  AND completion_strategy = 'suggested'
  AND status NOT IN ('completed', 'archived', 'dismissed');
```

#### 3. 建議生成流程
- 觸發條件滿足時，設定 `suggested_complete = TRUE`
- 記錄建議時間 `suggested_at` 和建議原因 `suggestion_reason`
- 透過 Realtime 推送即時通知給使用者
- 在前端 UI 中顯示建議完成的視覺提示

#### 4. 用戶確認機制
- 使用者可以選擇「接受建議」或「保持未完成」
- 接受建議時自動標記通知為完成狀態
- 拒絕建議時重置 `suggested_complete = FALSE`

### 配置智能建議模板

#### 建立新的智能建議模板

```sql
INSERT INTO notification_templates (
  type, title_template, message_template,
  category, completion_strategy, completion_notes
) VALUES (
  'custom_smart_notification',
  '智能通知標題：{{title}}',
  '智能通知內容：{{message}}',
  'actionable',
  'suggested',
  '特定條件滿足時自動建議完成'
);
```

#### 建立對應的觸發器函數

```sql
CREATE OR REPLACE FUNCTION notify_custom_events()
RETURNS TRIGGER AS $$
BEGIN
  -- 判斷觸發條件
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- 更新相關通知為建議完成
    UPDATE notifications
    SET
      suggested_complete = TRUE,
      suggested_at = NOW(),
      suggestion_reason = '相關任務已完成'
    WHERE
      type = 'custom_smart_notification'
      AND completion_strategy = 'suggested'
      AND status NOT IN ('completed', 'archived');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 綁定觸發器
CREATE TRIGGER trigger_notify_custom_events
AFTER UPDATE ON custom_table
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION notify_custom_events();
```

### 監控建議準確度

```sql
-- 查詢智能建議的接受率
SELECT
  type,
  COUNT(*) as total_suggestions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as accepted_suggestions,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*),
    2
  ) as acceptance_rate
FROM notifications
WHERE suggested_complete = TRUE
  AND suggested_at >= NOW() - INTERVAL '30 days'
GROUP BY type
ORDER BY acceptance_rate DESC;
```

## RLS (Row Level Security) 政策

### notifications 表 RLS 政策

```sql
-- 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 使用者只能查看自己的通知
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- 使用者只能更新自己的通知
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 使用者只能刪除自己的通知
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- 系統可以創建任何通知（用於觸發器）
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

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

### notification_templates 表 RLS 政策

```sql
-- 啟用 RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- 所有人可以讀取啟用的模板
CREATE POLICY "Everyone can view active templates"
ON notification_templates FOR SELECT
USING (is_active = TRUE);

-- 只有管理員可以管理模板
CREATE POLICY "Admins can manage templates"
ON notification_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role_name = 'admin'
  )
);
```

## 效能最佳化

### 索引策略

```sql
-- 使用者通知查詢優化
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- 實體關聯查詢優化
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

-- 類型查詢優化
CREATE INDEX idx_notifications_type ON notifications(type);

-- 智能建議查詢優化（部分索引）
CREATE INDEX idx_notifications_suggested ON notifications(suggested_complete)
WHERE suggested_complete = TRUE;

-- 複合索引優化常見查詢
CREATE INDEX idx_notifications_user_status_created
ON notifications(user_id, status, created_at DESC);
```

### 批量操作

```sql
-- 批量標記為已讀
CREATE OR REPLACE FUNCTION bulk_mark_as_read(notification_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET status = 'read', read_at = NOW()
  WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    AND status = 'unread';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 批量歸檔
CREATE OR REPLACE FUNCTION bulk_archive(notification_ids UUID[])
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET status = 'archived', archived_at = NOW()
  WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    AND status != 'archived';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 分區策略（選用）

對於大量通知的系統，可以考慮按時間分區：

```sql
-- 按月分區通知表
CREATE TABLE notifications (
  -- ... 欄位定義
) PARTITION BY RANGE (created_at);

-- 創建月份分區
CREATE TABLE notifications_2024_01 PARTITION OF notifications
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE notifications_2024_02 PARTITION OF notifications
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 自動化分區管理（使用 pg_partman 擴展）
```

## 資料清理與維護

### 自動清理舊通知

```sql
-- 創建清理函數
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- 刪除 90 天前已歸檔的通知
  DELETE FROM notifications
  WHERE status = 'archived'
    AND archived_at < NOW() - INTERVAL '90 days';

  -- 刪除 180 天前已完成的通知
  DELETE FROM notifications
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- 設定定期執行（使用 pg_cron）
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 2 * * *',  -- 每天凌晨 2 點執行
  'SELECT cleanup_old_notifications();'
);
```

## 監控與日誌

### 通知統計視圖

```sql
CREATE OR REPLACE VIEW notification_stats AS
SELECT
  user_id,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'unread' THEN 1 END) as unread_count,
  COUNT(CASE WHEN category = 'actionable' AND status NOT IN ('completed', 'archived') THEN 1 END) as actionable_count,
  COUNT(CASE WHEN suggested_complete = TRUE AND status NOT IN ('completed', 'archived') THEN 1 END) as suggested_count,
  MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;
```

### 效能監控查詢

```sql
-- 查看最慢的查詢
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%notifications%'
ORDER BY mean_time DESC
LIMIT 10;

-- 查看表大小
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'notification%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 測試指南

### 測試智能建議功能

```sql
-- 測試庫存補充觸發智能建議
BEGIN;

-- 1. 創建低庫存通知
INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id, completion_strategy)
VALUES (
  'test-user-id',
  'inventory_low_stock',
  '庫存不足警告',
  '測試商品庫存不足',
  'product',
  'test-product-id',
  'suggested'
);

-- 2. 模擬庫存補充
UPDATE products
SET stock_quantity = 100
WHERE id = 'test-product-id';

-- 3. 檢查是否產生智能建議
SELECT
  id,
  type,
  suggested_complete,
  suggestion_reason
FROM notifications
WHERE entity_id = 'test-product-id'
  AND type = 'inventory_low_stock';

ROLLBACK; -- 測試完成後回滾
```

## 故障排除

### 常見問題診斷

#### 觸發器未執行

```sql
-- 檢查觸發器是否存在
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%notify%';

-- 檢查觸發器是否啟用
SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
```

#### RLS 政策問題

```sql
-- 檢查 RLS 是否啟用
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename LIKE 'notification%';

-- 檢查 RLS 政策
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename LIKE 'notification%';
```

#### 效能問題診斷

```sql
-- 檢查缺少的索引
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename = 'notifications'
  AND n_distinct > 100
  AND correlation < 0.1;

-- 分析表統計資訊
ANALYZE notifications;
ANALYZE notification_templates;
```

---

## 相關資源

- [PostgreSQL 官方文檔](https://www.postgresql.org/docs/)
- [Supabase 資料庫指南](https://supabase.com/docs/guides/database)
- [PostgreSQL 觸發器](https://www.postgresql.org/docs/current/triggers.html)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
