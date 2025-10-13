# Seed 檔案與 Final Migration 相容性分析報告

**分析時間：** 2025-08-17  
**檢查範圍：** seed-core.sql, seed-test.sql vs final_consolidated_migration.sql  
**結論：** ⚠️ **存在重大不相容問題，無法直接執行**

---

## 🔴 關鍵不相容問題摘要

### 1. **缺失的必要表結構**
seed 檔案嘗試插入資料到以下表，但 final_consolidated_migration.sql 中未定義：

| 表名 | 出現在 | 影響程度 | 狀態 |
|------|--------|----------|------|
| `system_settings` | seed-core.sql | 🔴 高 | 完全缺失 |
| `default_avatars` | seed-core.sql | 🟡 中 | 完全缺失 |
| `permissions` | seed-core.sql | 🔴 高 | 完全缺失 |
| `role_permissions` | seed-core.sql | 🔴 高 | 完全缺失 |
| `notifications` | seed-test.sql | 🟡 中 | 完全缺失 |

### 2. **欄位名稱不匹配**
| 表名 | seed 檔案使用 | migration 定義 | 影響 |
|------|---------------|----------------|------|
| `campaigns` | `campaign_name` | `name` | 🔴 致命 |
| `customers` | `name` | `full_name` | 🔴 致命 |
| `customers` | `address` | 無此欄位 | 🔴 致命 |
| `customers` | `registration_date` | `created_at` | 🟡 可修復 |
| `inventories` | `quantity_available` | `stock` | 🔴 致命 |
| `inventories` | `quantity_reserved` | `reserved_stock` | 🔴 致命 |
| `inventories` | `reorder_point` | 無此欄位 | 🟡 可修復 |
| `inventories` | `unit_cost` | `cost_per_unit` | 🟡 可修復 |

### 3. **表結構不匹配**
| 表名 | 問題描述 | 嚴重程度 |
|------|----------|----------|
| `orders` | seed 使用簡化結構，migration 使用 JSONB 快照 | 🔴 結構性差異 |
| `order_items` | seed 缺少 JSONB 快照欄位 | 🟡 可容忍 |
| `notification_templates` | 欄位結構完全不同 | 🔴 致命 |

---

## 詳細相容性分析

### ✅ 完全相容的表

#### seed-core.sql:
- `users` - ✅ 完全匹配
- `roles` - ✅ 完全匹配  
- `user_roles` - ✅ 完全匹配
- `permission_groups` - ✅ 完全匹配
- `categories` - ✅ 完全匹配
- `holidays` - ✅ 完全匹配
- `rfm_segment_mapping` - ✅ 完全匹配

#### seed-test.sql:
- `products` - ✅ 完全匹配
- `conversations` - ✅ 完全匹配
- `messages` - ✅ 完全匹配
- `funnel_events` - ✅ 完全匹配

### 部分相容的表

#### `campaigns` 表
**問題：** 欄位名稱不匹配
```sql
-- seed-test.sql 使用：
INSERT INTO campaigns (campaign_name, start_date, end_date, campaign_type, description)

-- final_consolidated_migration.sql 定義：
CREATE TABLE public.campaigns (
    name text NOT NULL,  -- 不是 campaign_name
    ...
)
```

**修復：** 需要修改 seed-test.sql 將 `campaign_name` 改為 `name`

#### `customers` 表  
**問題：** 多個欄位不匹配
```sql
-- seed-test.sql 使用：
INSERT INTO customers (name, email, phone, address, registration_date, is_active)

-- final_consolidated_migration.sql 定義：
CREATE TABLE public.customers (
    full_name text,     -- 不是 name
    email text,         -- ✅ 匹配
    phone text,         -- ✅ 匹配  
    -- 無 address 欄位
    created_at timestamptz,  -- 不是 registration_date
    status text,        -- 不是 is_active
    ...
)
```

**修復：** 需要大幅修改 seed-test.sql 的客戶資料插入語句

#### `inventories` 表
**問題：** 欄位名稱系統性不匹配
```sql
-- seed-test.sql 使用：
INSERT INTO inventories (product_id, sku, quantity_available, quantity_reserved, reorder_point, unit_cost)

-- final_consolidated_migration.sql 定義：
CREATE TABLE public.inventories (
    product_id uuid,           -- ✅ 匹配
    sku text,                  -- ✅ 匹配
    stock int,                 -- 不是 quantity_available
    reserved_stock int,        -- 不是 quantity_reserved
    low_stock_threshold int,   -- 不是 reorder_point
    cost_per_unit numeric,     -- 不是 unit_cost
    ...
)
```

### 🔴 完全不相容的表

#### `system_settings` (seed-core.sql)
**問題：** 表完全不存在於 final_consolidated_migration.sql
```sql
INSERT INTO system_settings (key, value, description) VALUES ...
```
**影響：** 7 個系統設定無法插入

#### `default_avatars` (seed-core.sql)
**問題：** 表完全不存在
```sql
INSERT INTO default_avatars (id, file_path) VALUES ...
```
**影響：** 15 個預設頭像資料無法插入

#### `permissions` (seed-core.sql)
**問題：** 表完全不存在
```sql
INSERT INTO permissions (group_id, code, name, description, sort_order) VALUES ...
```
**影響：** 53 個權限定義無法插入，權限系統完全無法運作

#### `role_permissions` (seed-core.sql)
**問題：** 表完全不存在
```sql
INSERT INTO role_permissions (role_id, permission_id) ...
```
**影響：** Super Admin 權限分配無法執行

#### `notifications` (seed-test.sql)
**問題：** 表結構與 migration 中的 `notification_distributions` 不同
```sql
INSERT INTO notifications (user_id, type, title, message, priority, channels, ...)
```
**影響：** 測試通知資料無法插入

---

## 修復建議方案

### 方案 A：修復 final_consolidated_migration.sql（推薦）

#### 1. 新增缺失的表結構
```sql
-- 新增到 final_consolidated_migration.sql

-- 系統設定表
CREATE TABLE public.system_settings (
    id serial PRIMARY KEY,
    key text UNIQUE NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 預設頭像表
CREATE TABLE public.default_avatars (
    id integer PRIMARY KEY,
    file_path text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 權限表
CREATE TABLE public.permissions (
    id serial PRIMARY KEY,
    group_id uuid REFERENCES public.permission_groups(id),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 角色權限關聯表
CREATE TABLE public.role_permissions (
    role_id integer REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id integer REFERENCES public.permissions(id) ON DELETE CASCADE,
    assigned_at timestamptz DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);
```

#### 2. 修改現有表結構以匹配 seed 檔案
```sql
-- 修改 campaigns 表，新增 campaign_name 別名
ALTER TABLE public.campaigns RENAME COLUMN name TO campaign_name;

-- 修改 customers 表
ALTER TABLE public.customers 
    RENAME COLUMN full_name TO name,
    ADD COLUMN address text,
    RENAME COLUMN created_at TO registration_date,
    RENAME COLUMN status TO is_active;

-- 修改 inventories 表
ALTER TABLE public.inventories 
    RENAME COLUMN stock TO quantity_available,
    RENAME COLUMN reserved_stock TO quantity_reserved,
    RENAME COLUMN low_stock_threshold TO reorder_point,
    RENAME COLUMN cost_per_unit TO unit_cost;
```

### 方案 B：修復 seed 檔案（建議的替代方案）

#### 1. 修復 seed-core.sql
```sql
-- 移除不存在的表的 INSERT 語句，或創建替代方案
-- 將 system_settings 資料整合到其他配置表
-- 將 default_avatars 資料整合到系統配置
-- 重寫權限相關的插入語句匹配新架構
```

#### 2. 修復 seed-test.sql  
```sql
-- 修改 campaigns 插入語句
INSERT INTO campaigns (name, start_date, end_date, campaign_type, description) VALUES ...

-- 修改 customers 插入語句
INSERT INTO customers (full_name, email, phone, created_at, status) VALUES ...

-- 修改 inventories 插入語句  
INSERT INTO inventories (product_id, sku, stock, reserved_stock, low_stock_threshold, cost_per_unit) VALUES ...

-- 修改 notifications 為 notification_distributions
-- 重寫通知插入邏輯匹配新的四層通知架構
```

---

## 建議的執行順序

### 階段一：緊急修復（立即執行）
1. **修復 final_consolidated_migration.sql**
   - 新增缺失的核心表（system_settings, permissions, role_permissions, default_avatars）
   - 這些表對系統基本運作至關重要

2. **測試 Migration 執行**
   ```bash
   # 在測試環境執行
   psql -d test_database -f final_consolidated_migration.sql
   ```

### 階段二：Seed 檔案適配（1-2天內）
1. **修復 seed-core.sql**
   - 確保所有核心資料能正確插入
   - 特別關注權限系統的完整性

2. **修復 seed-test.sql**  
   - 修改表欄位名稱匹配
   - 調整資料格式符合新架構

### 階段三：驗證與測試（完成修復後）
1. **完整性測試**
   ```sql
   -- 執行順序驗證
   psql -d test_database -f final_consolidated_migration.sql
   psql -d test_database -f seed-core.sql  
   psql -d test_database -f seed-test.sql
   ```

2. **功能驗證**
   - 權限系統運作正常
   - 通知系統正常
   - 所有測試資料載入成功

---

## 風險警告

### 高風險項目
1. **權限系統失效**：如果不修復 permissions 和 role_permissions 表，整個權限系統將無法運作
2. **Super Admin 無法登入**：權限分配失敗將導致管理員無法存取系統
3. **通知系統故障**：通知相關表不匹配將影響業務流程通知

### 中等風險項目  
1. **客戶資料不完整**：address 欄位缺失可能影響訂單處理
2. **庫存管理受限**：欄位名稱不匹配影響庫存操作
3. **系統設定遺失**：基礎配置參數無法設定

---

## 檢查清單

執行前必須確認：

- [ ] 已備份現有資料庫
- [ ] 在測試環境完整驗證修復方案
- [ ] 確認所有必要表都已正確定義
- [ ] 驗證 seed 檔案的欄位名稱匹配
- [ ] 測試權限系統完整運作
- [ ] 確認通知系統正常功能
- [ ] 驗證客戶和訂單資料完整性

**結論：目前的 seed 檔案無法直接與 final_consolidated_migration.sql 一起執行。建議優先執行方案 A，完善 migration 檔案後再執行 seed 資料。**