# Seed 檔案相容性問題與修復建議

**檢查時間：** 2025-08-17  
**目的：** 列出所有不相容問題並提供修復選項供確認

---

## 🔴 關鍵問題 #1：缺失的必要表

### 問題：seed-core.sql 嘗試插入的表在 final_consolidated_migration.sql 中不存在

#### 1.1 `system_settings` 表

**seed-core.sql 第 7 行：**

```sql
INSERT INTO system_settings (key, value, description) VALUES
  ('fast_response_threshold_minutes', '15', '快速回應時間閾值（分鐘）'),
  ('medium_response_threshold_minutes', '30', '中等回應時間閾值（分鐘）'),
  -- ... 共 7 個系統設定
```

**問題：** final_consolidated_migration.sql 中沒有定義 `system_settings` 表

**修復選項：**

- [v] **選項 A**：在 final_consolidated_migration.sql 中新增 system_settings 表，因為在 db function 中會用到這張表，檢查 Migrations sql 有沒有相關腳本做比對

* 必須新增 system_settings

- [ ] **選項 B**：修改 seed-core.sql，將這些設定整合到其他表或移除

**如果選擇選項 A，需要新增：**

```sql
CREATE TABLE public.system_settings (
    id serial PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

#### 1.2 `default_avatars` 表

**seed-core.sql 第 125 行：**

```sql
INSERT INTO default_avatars (id, file_path) VALUES
  (1, 'default_avatar/avatar01.jpg'),
  -- ... 共 15 個頭像
```

**修復選項：**

- [v] **選項 A**：在 final_consolidated_migration.sql 中新增 default_avatars 表
- [ ] **選項 B**：修改 seed-core.sql，移除頭像資料或整合到其他方式

#### 1.3 `permissions` 表

**seed-core.sql 第 180 行：**

```sql
INSERT INTO permissions (group_id, code, name, description, sort_order) VALUES
  -- ... 共 53 個權限定義
```

**⚠️ 這是權限系統的核心！**

**修復選項：**

- [v] **選項 A**：在 final_consolidated_migration.sql 中新增 permissions 表
- [ ] **選項 B**：重新設計權限系統架構

**如果選擇選項 A，需要新增：**

```sql
CREATE TABLE public.permissions (
    id serial PRIMARY KEY,
    group_id uuid REFERENCES public.permission_groups(id),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
```

#### 1.4 `role_permissions` 表

**seed-core.sql 第 376 行：**

```sql
INSERT INTO role_permissions (role_id, permission_id)
-- Super Admin 權限分配邏輯
```

**修復選項：**

- [v] **選項 A**：在 final_consolidated_migration.sql 中新增 role_permissions 表
- [ ] **選項 B**：重新設計角色權限關聯方式

---

## 🟡 問題 #2：欄位名稱不匹配

### 2.1 `campaigns` 表

**seed-test.sql 第 20 行：**

```sql
INSERT INTO campaigns (campaign_name, start_date, end_date, campaign_type, description)
```

**final_consolidated_migration.sql 定義：**

```sql
CREATE TABLE public.campaigns (
    name text NOT NULL,  -- 不是 campaign_name
    ...
)
```

**修復選項：**

- [ ] **選項 A**：修改 seed-test.sql，將 `campaign_name` 改為 `name`
- [v] **選項 B**：修改 final_consolidated_migration.sql，將 `name` 改為 `campaign_name`
- [ ] **選項 C**：在 campaigns 表中同時保留兩個欄位

### 2.2 `customers` 表

**seed-test.sql 第 210 行：**

```sql
INSERT INTO customers (name, email, phone, address, registration_date, is_active)
```

**final_consolidated_migration.sql 定義：**

```sql
CREATE TABLE public.customers (
    full_name text,        -- seed 使用 name
    email text,           -- ✅ 匹配
    phone text,           -- ✅ 匹配
    -- 沒有 address 欄位
    created_at timestamptz,  -- seed 使用 registration_date
    status text,          -- seed 使用 is_active
    ...
)
```

**修復選項：**

- [v] **選項 A**：修改 seed-test.sql 匹配 migration 的欄位名稱
- [ ] **選項 B**：修改 final_consolidated_migration.sql 新增 address 欄位，調整欄位名稱
- [ ] **選項 C**：在 customers 表中新增別名欄位

### 2.3 `inventories` 表

**seed-test.sql 第 94 行：**

```sql
INSERT INTO inventories (product_id, sku, quantity_available, quantity_reserved, reorder_point, unit_cost)
```

**final_consolidated_migration.sql 定義：**

```sql
CREATE TABLE public.inventories (
    product_id uuid,           -- ✅ 匹配
    sku text,                  -- ✅ 匹配
    stock int,                 -- seed 使用 quantity_available
    reserved_stock int,        -- seed 使用 quantity_reserved
    low_stock_threshold int,   -- seed 使用 reorder_point
    cost_per_unit numeric,     -- seed 使用 unit_cost
    ...
)
```

**修復選項：**

- [v] **選項 A**：修改 seed-test.sql 使用 migration 的欄位名稱
- [ ] **選項 B**：修改 final_consolidated_migration.sql 使用 seed 的欄位名稱
- [ ] **選項 C**：在表中同時保留兩套欄位名稱

---

## 🟡 問題 #3：表結構差異

### 3.1 `notification_templates` 表

**seed-core.sql 第 276 行：**

```sql
INSERT INTO notification_templates (
  type,
  title_template,
  message_template,
  default_priority,
  default_channels,
  is_active,
  required_entity_type,
  category,
  completion_strategy,
  is_system_required
)
```

**final_consolidated_migration.sql 定義：**

```sql
CREATE TABLE public.notification_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    template_content text NOT NULL,
    variables jsonb DEFAULT '{}',
    required_entity_type text,
    category text DEFAULT 'general',
    is_active boolean DEFAULT true,
    is_system_required boolean DEFAULT false,
    ...
)
```

**問題：** 欄位結構完全不同

- seed 使用：`type`, `title_template`, `message_template`
- migration 使用：`name`, `display_name`, `template_content`

**修復選項：**

- [v] **選項 A**：修改 seed-core.sql 匹配新的通知模板架構

* 對照 admin-platform-vue/src/types/notification.ts 的型態定義，這裡的才是最新狀況

- [ ] **選項 B**：修改 final_consolidated_migration.sql 使用舊的欄位結構
- [ ] **選項 C**：重新設計通知模板資料結構

### 3.2 `notifications` vs `notification_distributions`

**seed-test.sql 第 409 行：**

```sql
INSERT INTO notifications (
  user_id, type, title, message, priority, channels, entity_type, entity_id, link_url, metadata, is_read, created_at
)
```

**問題：** final_consolidated_migration.sql 使用四層通知架構，沒有 `notifications` 表，而是使用 `notification_distributions`

**修復選項：**

- [v] **選項 A**：修改 seed-test.sql 使用新的四層通知架構

* 這裡要特別注意，最終做法是需要 notification_distributions 做群組通知分發

- [ ] **選項 B**：在 final_consolidated_migration.sql 中新增簡化的 notifications 表
- [ ] **選項 C**：移除 seed-test.sql 中的通知測試資料

---

## 🟢 問題 #4：缺失但非關鍵的欄位

### 4.1 customers 表缺少 `address` 欄位

**影響：** seed-test.sql 中的客戶地址資料無法插入

**修復選項：**

- [ ] **選項 A**：在 final_consolidated_migration.sql 的 customers 表中新增 address 欄位
- [v] **選項 B**：修改 seed-test.sql，移除地址資料或整合到其他欄位

### 4.2 inventories 表缺少一些便利欄位

**seed 嘗試使用但 migration 沒有的欄位：**

- `reorder_point` (seed) vs `low_stock_threshold` (migration)
- `unit_cost` (seed) vs `cost_per_unit` (migration)
  [v] 以 migration 為主

---

## 建議的決策流程

### 第一優先：權限系統（關鍵）

**問題：** permissions 和 role_permissions 表完全缺失
**建議：** 選擇選項 A - 在 final_consolidated_migration.sql 中新增這些表
**原因：** 權限系統是核心功能，seed-core.sql 中有 53 個詳細的權限定義

### 第二優先：通知系統架構

**問題：** notification_templates 結構不匹配
**建議：** 選擇選項 A - 修改 seed-core.sql 匹配新架構
**原因：** 新的四層通知架構更完整，應該保持

### 第三優先：欄位名稱統一

**建議順序：**

1. **campaigns**: 建議修改 seed-test.sql，使用 `name` 而非 `campaign_name`
2. **customers**: 建議修改 seed-test.sql，匹配 migration 的欄位名稱
3. **inventories**: 建議修改 seed-test.sql，使用 migration 的欄位名稱

### 第四優先：系統設定表

**建議：** 選擇選項 A - 新增 system_settings 表
**原因：** 這些設定對系統運作有幫助

### 第五優先：頭像表

**建議：** 選擇選項 B - 修改 seed-core.sql，簡化或移除
**原因：** 不是核心功能

---

## 您需要確認的決策

請針對每個問題選擇修復方案：

### 關鍵決策（必須決定）：

1. **權限系統表** - 選項 A 或 B？ => A
2. **通知模板架構** - 選項 A 或 B？ => A
3. **campaigns 欄位名稱** - 選項 A 或 B？ => B
4. **customers 表結構** - 選項 A 或 B？ => A
5. **inventories 欄位名稱** - 選項 A 或 B？ => A

### 次要決策：

6. **system_settings 表** - 選項 A 或 B？ => A
7. **default_avatars 表** - 選項 A 或 B？ => A
8. **notifications 測試資料** - 選項 A、B 或 C？ => A

請告訴我您的決策，我會根據您的選擇提供具體的修復代碼。
