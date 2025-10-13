# 完整資料庫重置指南

## 概述

此指南協助你安全地重置 Supabase 資料庫，包含完整的 Super Admin 自動重建機制和所有必要的初始資料。

## 🔄 DB Reset 流程說明

### 當執行 `supabase db reset` 時會發生什麼：

1. **清除所有資料**: 刪除現有的所有表和資料
2. **執行 Migrations**: 按順序執行 `migrations/` 資料夾中的所有 SQL 檔案
3. **執行 Seed 資料**: 自動執行 `seed.sql` 檔案

### 執行順序

```
1. 清除資料庫
2. 執行所有 migration 檔案 (按檔名順序)
3. 執行 seed.sql (自動初始化)
```

---

## 🔑 Super Admin 自動重建機制

### ✅ 已實現功能

在每次 DB reset 後，`seed.sql` 會自動：

1. **執行系統初始化**: 呼叫 `initialize_super_admin_system()`
2. **建立 Super Admin 角色**: 確保 `super_admin` 角色存在且受保護
3. **建立認證帳戶**: 在 `auth.users` 中建立完整認證
4. **建立用戶記錄**: 在 `users` 表中建立並連結
5. **分配角色**: 自動分配 Super Admin 角色
6. **分配權限**: 為所有角色分配適當權限

### 🔑 預設 Super Admin 登入資訊

**每次 DB reset 後都會重建**：

- **Email**: `admin@system.local`
- **密碼**: `SuperAdmin`

⚠️ **重要**: 這是固定的預設密碼，任何人都能看到此文檔，所以：

- DB reset 後請**立即**登入並更改密碼
- 生產環境應修改或移除此機制

---

## 執行 DB Reset

### 完整重建

```bash
# 在 supabase 目錄下執行
supabase db reset

# 您會看到 Super Admin 初始化訊息：
# ================================================
# ✅ Super Admin 系統已自動初始化
# ================================================
#
# 🔑 Super Admin 登入資訊：
# - Email: admin@system.local
# - 密碼: SuperAdmin
```

### 僅執行 Migrations

```bash
# 如果只想執行 migrations 而不執行 seed.sql
supabase db reset --linked
```

---

## 📁 重要檔案說明

### 1. `export_initial_data.sql`

**用途**：匯出當前資料庫中的初始資料  
**執行時機**：重置前執行，用於備份現有資料

**使用方式**：

1. 打開 http://localhost:54323 (Supabase Studio)
2. 進入 SQL Editor
3. 複製並執行 `export_initial_data.sql` 中的查詢
4. 將結果複製保存到文字檔

### 2. `seed.sql`

**用途**：包含所有必要初始資料的種子檔案  
**內容包括**：

- ✅ System settings (系統設定)
- ✅ System user (系統用戶: `00000000-0000-0000-0000-000000000000`)
- ✅ RFM segment mapping (RFM 分群對應)
- ✅ Super Admin 自動初始化
- ✅ 角色權限完整配置
- ✅ 商品分類資料
- ✅ 行銷活動資料

### 3. `verify_seed_data.sql`

**用途**：驗證資料庫重置後的資料完整性  
**執行時機**：重置後執行，確認資料正確載入

---

## 安全注意事項

### DB Reset 後必須執行

1. **立即更改密碼**: 使用預設密碼登入後立即更改
2. **檢查系統狀態**: 確認所有保護機制正常
3. **啟用 2FA**: 為 Super Admin 帳戶啟用雙因素認證

### 檢查系統健康

```sql
-- 檢查 Super Admin 系統狀態
SELECT * FROM check_super_admin_system_health();

-- 查看所有系統角色
SELECT * FROM get_system_roles_status();

-- 緊急密碼重設
SELECT reset_super_admin_password('YourNewSecurePassword2025#');
```

---

## 重置前準備工作

### 重要：重置前的資料備份

**在重置前，建議先匯出當前的關鍵資料：**

1. **使用 Supabase Studio**：打開 http://localhost:54323，在 SQL Editor 中執行 `export_initial_data.sql` 查詢
2. **檢查關鍵資料**：

```sql
-- 檢查系統設定
SELECT * FROM system_settings;

-- 檢查系統用戶
SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000000';

-- 檢查角色
SELECT * FROM roles;

-- 檢查權限
SELECT * FROM permissions LIMIT 10;
```

---

## ✅ 驗證檢查點

重置後請確認以下項目：

### 系統設定

- [ ] `fast_response_threshold_minutes = 15`
- [ ] `medium_response_threshold_minutes = 30`
- [ ] `slow_response_threshold_minutes = 60`
- [ ] `agent_busy_threshold = 5`

### 👤 系統用戶

- [ ] 系統用戶 ID: `00000000-0000-0000-0000-000000000000` 存在
- [ ] Email: `system@internal.system`

### 🔑 Super Admin 系統

- [ ] Super Admin 角色存在且受保護
- [ ] Super Admin 認證帳戶可正常登入
- [ ] 擁有所有系統權限
- [ ] 稽核日誌正常記錄

### 角色與權限

- [ ] 角色表 (roles) 資料正確載入
- [ ] 權限表 (permissions) 資料正確載入
- [ ] 權限群組 (permission_groups) 資料正確載入
- [ ] 角色權限關聯 (role_permissions) 正確設定

### RFM 分群

- [ ] 至少 50 個 RFM 模式
- [ ] 6 個分群類型：VIP, Loyal, Potential, New, At Risk, Lost

---

## 📞 故障排除

### 常見問題

#### 1. Super Admin 登入失敗

```sql
-- 檢查認證帳戶是否存在
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'admin@system.local';

-- 如果不存在，強制重建
SELECT ensure_super_admin_user_with_auth(true);
```

#### 2. 權限不足

```sql
-- 檢查角色分配
SELECT u.email, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@system.local';

-- 檢查權限分配
SELECT COUNT(*) as permission_count
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
WHERE r.name = 'super_admin';
```

#### 3. 系統狀態異常

```sql
-- 完整系統健康檢查
SELECT * FROM check_super_admin_system_health();

-- 如果有問題，重新初始化
SELECT initialize_super_admin_system();
```

### 緊急恢復

```sql
-- 完全重建 Super Admin 系統
SELECT ensure_super_admin_user_with_auth(true);

-- 重設為新密碼
SELECT reset_super_admin_password('EmergencyPassword2025!');

-- 檢查恢復結果
SELECT * FROM check_super_admin_system_health();
```

---

## 不同環境的建議

### 開發環境

- ✅ 保持現有的自動初始化機制
- ✅ 使用預設密碼方便測試
- ✅ 每次 reset 後自動重建

### 測試環境

- ⚠️ 考慮使用隨機密碼
- ⚠️ 建立自動化測試腳本
- ⚠️ 定期檢查安全配置

### 生產環境

- ❌ **移除預設密碼機制**
- ❌ **手動建立 Super Admin**
- ❌ **使用環境變數管理密碼**
- ❌ **啟用所有安全機制**

### 生產環境修改建議

```sql
-- 在生產環境的 seed.sql 中，修改為：
-- SELECT initialize_super_admin_system(); -- 註解掉自動初始化

-- 改為手動指令：
-- 1. 手動執行初始化
-- 2. 立即更改密碼
-- 3. 啟用 2FA
-- 4. 限制訪問權限
```

---

## ✅ 檢查清單

### DB Reset 後必做事項

- [ ] 確認 Super Admin 初始化訊息出現
- [ ] 使用預設密碼登入成功
- [ ] 立即更改為強密碼
- [ ] 檢查系統健康狀況
- [ ] 啟用雙因素認證 (建議)
- [ ] 檢查所有角色權限正確
- [ ] 驗證所有核心功能正常

### 定期維護

- [ ] 每月檢查系統健康狀況
- [ ] 定期更新 Super Admin 密碼
- [ ] 檢查稽核日誌異常
- [ ] 確認保護機制運作正常

---

## 安全提醒

- ⚠️ 重置會刪除所有現有資料
- ⚠️ 請確保在開發環境中進行測試
- ⚠️ 生產環境重置前務必完整備份
- ⚠️ 確認所有團隊成員了解重置影響
- ⚠️ 預設密碼必須在首次登入後立即更改

---

**🎉 現在您可以安心進行 DB reset，Super Admin 帳戶會自動重建！**

_更新日期: 2025-07-14_  
_文檔版本: 2.0_
