# Super Admin 保護系統使用指南

## 系統概述

Super Admin 保護系統確保電商平台的核心管理角色無法被意外刪除或修改，提供完整的權限管理和安全保護機制。

## 保護機制

### 角色保護層級
1. **Super Admin (super_admin)**
   - ✅ 系統角色 (`is_system_role = true`)
   - ✅ 受保護角色 (`is_protected = true`)  
   - ✅ 不可刪除 (`can_be_deleted = false`)
   - ✅ 擁有所有 35 個系統權限
   - ✅ 至少保證有一個用戶分配此角色

2. **系統管理員 (admin)**
   - ✅ 系統角色 (`is_system_role = true`)
   - ✅ 受保護角色 (`is_protected = true`)
   - ✅ 不可刪除 (`can_be_deleted = false`)
   - ✅ 擁有 33 個管理權限 (除敏感權限外)

3. **客戶支援 (support)**
   - ✅ 系統角色 (`is_system_role = true`)
   - ❌ 非保護角色 (`is_protected = false`)
   - ❌ 不可刪除 (`can_be_deleted = false`)
   - ✅ 擁有 10 個客戶服務相關權限

4. **一般員工 (staff)**
   - ❌ 非系統角色 (`is_system_role = false`)
   - ❌ 非保護角色 (`is_protected = false`)
   - ✅ 可刪除 (`can_be_deleted = true`)
   - ✅ 擁有 6 個基本操作權限

5. **內容編輯 (editor)**
   - ❌ 非系統角色 (`is_system_role = false`)
   - ❌ 非保護角色 (`is_protected = false`)
   - ✅ 可刪除 (`can_be_deleted = true`)
   - ✅ 擁有 8 個內容管理權限

## 👤 預設系統帳戶

### Super Admin 用戶
- **Email**: `admin@system.local`
- **全名**: `System Administrator`
- **角色**: `super_admin`
- **建立時間**: 系統部署時自動建立
- **狀態**: 自動分配 Super Admin 角色

⚠️ **重要安全提醒**:
1. 請立即為此帳戶設定強密碼
2. 建議啟用雙因素認證
3. 定期檢查權限使用情況
4. 避免在日常操作中使用此帳戶

## 🛡️ 保護功能

### 1. 角色刪除保護
```sql
-- 以下操作將被阻止並拋出異常：
DELETE FROM roles WHERE name = 'super_admin';  -- ❌ 受保護角色無法刪除
DELETE FROM roles WHERE name = 'admin';        -- ❌ 受保護角色無法刪除
DELETE FROM roles WHERE is_system_role = true; -- ❌ 系統角色無法刪除
```

### 2. 角色修改保護
```sql
-- 以下操作將被阻止並拋出異常：
UPDATE roles SET name = 'new_name' WHERE name = 'super_admin';           -- ❌ 系統角色名稱無法修改
UPDATE roles SET is_protected = false WHERE name = 'super_admin';        -- ❌ 保護狀態無法取消
UPDATE roles SET can_be_deleted = true WHERE name = 'super_admin';       -- ❌ 無法變為可刪除
```

### 3. Super Admin 用戶保護
- 系統確保至少有一個用戶擁有 Super Admin 角色
- 如果嘗試刪除最後一個 Super Admin 用戶，系統將阻止操作
- 自動建立預設 Super Admin 帳戶 (`admin@system.local`)

## 管理和監控

### 系統狀態檢查
```sql
-- 檢查所有系統角色的狀態
SELECT * FROM get_system_roles_status();
```

**輸出範例**:
```
role_name  | is_system_role | is_protected | can_be_deleted | user_count | permission_count | status
-----------+----------------+--------------+----------------+------------+------------------+--------
super_admin| t              | t            | f              | 1          | 35               | ACTIVE
admin      | t              | t            | f              | 0          | 33               | WARNING - No users assigned
support    | t              | f            | f              | 0          | 10               | WARNING - No users assigned
```

### 權限配置檢查
```sql
-- 檢查各角色的權限分配情況
SELECT * FROM get_role_permissions_summary();
```

### 確保 Super Admin 存在
```sql
-- 檢查並確保 Super Admin 用戶存在
SELECT ensure_super_admin_user();
```

## 🔍 稽核和日誌

### 稽核日誌表
系統自動記錄所有角色相關的敏感操作：

```sql
-- 查看角色操作記錄
SELECT * FROM role_audit_log ORDER BY performed_at DESC LIMIT 10;
```

**記錄內容**:
- 操作類型 (INSERT/UPDATE/DELETE)
- 角色 ID 和名稱
- 操作詳情 (JSON 格式)
- 執行時間
- 執行者 (如果可識別)

## 權限配置詳情

### Super Admin (35 權限)
- **用戶管理**: view, create, edit, delete
- **角色管理**: view, create, edit, delete, assign
- **產品管理**: view, create, edit, delete
- **庫存管理**: view, update
- **分類管理**: view, create, edit, delete
- **訂單管理**: view, create, edit, cancel, process
- **客戶管理**: view, create, edit, delete
- **客戶支援**: view, respond, assign
- **系統設置**: view, edit
- **權限管理**: view, assign

### Admin (33 權限)
Super Admin 權限減去敏感權限：
- ❌ `role.delete` - 無法刪除角色
- ❌ `permission.assign` - 無法分配權限

### Support (10 權限)
客戶服務相關權限：
- 客戶管理: view, edit
- 客戶支援: view, respond, assign
- 訂單管理: view, edit, process  
- 產品查看: view
- 庫存查看: view

### Staff (6 權限)
基本操作權限：
- 客戶管理: view, edit
- 訂單管理: view, edit
- 產品查看: view
- 庫存查看: view

### Editor (8 權限)
內容管理權限：
- 產品管理: view, create, edit
- 分類管理: view, create, edit
- 庫存管理: view, update

## 🚨 故障排除

### 常見問題

#### 1. 無法刪除角色
**錯誤**: `角色 "xxx" 受到保護，無法刪除`
**解決**: 檢查角色是否為系統角色或受保護角色，這些角色設計為不可刪除

#### 2. 無法修改系統角色
**錯誤**: `系統角色的名稱不能被修改`
**解決**: 系統角色的核心屬性受到保護，避免意外修改

#### 3. 沒有 Super Admin 用戶
**解決**: 執行 `SELECT ensure_super_admin_user();` 自動建立

#### 4. 權限配置問題
**檢查**: 使用 `SELECT * FROM get_role_permissions_summary();` 檢查配置

### 緊急情況處理

#### 恢復 Super Admin 用戶
```sql
-- 如果 Super Admin 用戶意外丟失，可以重新建立
SELECT ensure_super_admin_user();
```

#### 檢查系統完整性
```sql
-- 檢查是否有 Super Admin 用戶
SELECT check_super_admin_exists();

-- 檢查所有系統角色狀態
SELECT * FROM get_system_roles_status() WHERE status LIKE '%CRITICAL%';
```

## 部署檢查清單

### 部署後必須執行
- [ ] 檢查 Super Admin 角色是否存在且受保護
- [ ] 確認 `admin@system.local` 用戶已建立
- [ ] 為 `admin@system.local` 設定強密碼
- [ ] 測試角色刪除保護機制
- [ ] 測試角色修改保護機制
- [ ] 檢查權限分配是否正確

### 建議定期檢查
- [ ] 檢查系統角色狀態 (`get_system_roles_status()`)
- [ ] 檢查 Super Admin 用戶是否存在
- [ ] 檢查稽核日誌是否有異常操作
- [ ] 檢查權限配置是否正確

## 🔄 維護操作

### 新增用戶並分配角色
```sql
-- 1. 新增用戶 (需要通過應用程式或 Supabase Auth)
-- 2. 分配角色
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES (
    '用戶UUID',
    (SELECT id FROM roles WHERE name = '角色名稱'),
    NOW()
);
```

### 修改非系統角色
```sql
-- 可以安全修改非系統角色
UPDATE roles 
SET description = '新描述', sort_order = 50
WHERE name = 'staff' AND is_system_role = false;
```

### 新增自訂角色
```sql
-- 新增自訂角色
INSERT INTO roles (name, description, sort_order, is_system_role, is_protected, can_be_deleted)
VALUES ('custom_role', '自訂角色描述', 100, false, false, true);

-- 為自訂角色分配權限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE name = 'custom_role'),
    id
FROM permissions 
WHERE code IN ('product.view', 'order.view');
```

---

## 📞 技術支援

### 重要函數快速參考
- `get_system_roles_status()` - 檢查系統角色狀態
- `get_role_permissions_summary()` - 檢查權限配置
- `ensure_super_admin_user()` - 確保 Super Admin 用戶存在
- `check_super_admin_exists()` - 檢查是否有 Super Admin 用戶

### 安全最佳實踐
1. **定期審計**: 每月檢查系統角色和權限配置
2. **最小權限原則**: 只分配必要的權限
3. **雙因素認證**: 為 Super Admin 帳戶啟用 2FA
4. **密碼策略**: 使用強密碼並定期更換
5. **操作記錄**: 定期檢查稽核日誌

**🎉 Super Admin 保護系統已成功部署並準備投入使用！**

*建立日期: 2025-07-13*  
*版本: 1.0*