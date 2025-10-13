# Supabase 資料庫集成說明

## 概述

本專案使用 Supabase 作為後端資料庫服務，提供完整的 PostgreSQL 資料庫功能、即時訂閱、認證服務和 API 自動生成。本文檔說明 Supabase 在專案中的角色、重要功能實現以及相關工具的使用方式。

---
**文檔資訊**
- 最後更新：2025-07-22
- 版本：1.0.0
- 相關專案：admin-platform-vue
- Supabase 版本：最新穩定版
---

## **Supabase 在專案中的角色**

### 核心功能
1. **PostgreSQL 資料庫**：完整的電商資料模型
2. **即時功能**：訂單狀態、通知系統的即時更新
3. **認證系統**：用戶登入、權限管理
4. **API 層**：自動生成的 RESTful API 和 GraphQL
5. **Row Level Security**：細緻的資料安全控制

### 專案特色實現
- **🔐 Super Admin 保護系統**：防止核心管理角色被意外刪除
- **📊 JSONB 快照系統**：訂單和訂單項目的歷史資料快照
- **👥 RBAC 權限控制**：完整的角色基礎存取控制
- **📈 RFM 客戶分析**：客戶價值自動分群系統

## 📁 **Supabase 相關文件結構**

```
supabase/
├── migrations/                 # 資料庫遷移文件
├── seed.sql                   # 種子資料 (系統初始化)
├── export_initial_data.sql    # 資料備份匯出腳本  
├── verify_seed_data.sql       # 資料驗證腳本
└── docs/                      # Supabase 專屬文檔 (詳細操作指南)
    ├── README.md             # 文檔索引
    ├── guides/               # 操作指南
    │   ├── database-reset.md        # 資料庫重置完整指南
    │   ├── super-admin-guide.md     # Super Admin 系統使用指南
    │   ├── jsonb-system.md         # JSONB 快照系統完整指南
    │   └── jsonb-testing.md        # JSONB 系統測試指南
    ├── reference/            # 技術參考
    │   ├── jsonb-snapshots.md      # JSONB 快照技術規格
    │   └── super-admin-deployment.md # 部署狀態總結
    ├── scripts/              # 輔助腳本
    │   └── create-demo-data.sql    # 測試資料生成
    └── backups/              # 歷史備份
        └── pre-jsonb-migration.sql # JSONB 遷移前備份
```

## **重要 SQL 腳本說明**

### 核心腳本功能

#### 1. `seed.sql` - 系統初始化 
**用途**：資料庫重置後自動執行，建立系統必需的初始資料
**包含內容**：
- 系統設定參數
- 預設角色和權限結構
- RFM 分群對應表
- Super Admin 自動初始化
- 系統用戶建立

**執行時機**：
- `supabase db reset` 後自動執行
- 新環境初始化時執行

#### 2. `export_initial_data.sql` - 資料備份
**用途**：匯出當前系統的關鍵配置資料，用於備份或環境複製
**匯出內容**：
- 系統設定
- 角色權限配置  
- 分類和基礎資料
- 系統用戶資訊

**使用方式**：
```bash
# 在 Supabase CLI 中執行
supabase db reset
psql -f supabase/export_initial_data.sql
```

#### 3. `verify_seed_data.sql` - 資料驗證
**用途**：驗證資料庫重置後所有初始資料是否正確載入
**檢查項目**：
- 系統設定完整性
- 角色權限配置正確性
- RFM 分群資料完整性
- 表格結構驗證
- 函數和視圖檢查

**使用方式**：
```bash
# 資料庫重置後執行驗證
psql -f supabase/verify_seed_data.sql
```

## **與前端應用的集成**

### API 服務整合
```typescript
// src/api/services/ 中的 Supabase 服務
├── CustomerApiService.ts    # 客戶管理 API
├── OrderApiService.ts       # 訂單管理 API  
├── ProductApiService.ts     # 產品管理 API
├── PermissionApiService.ts  # 權限管理 API
└── NotificationApiService.ts # 通知系統 API
```

### 即時功能
```typescript
// composables/useRealtimeNotifications.ts
// 使用 Supabase Realtime 實現即時通知
const channel = supabase
  .channel(`notifications:user:${user.id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, handleNotification)
```

### 狀態管理整合
```typescript
// stores/auth.ts - 使用 Supabase Auth
const { data: { user } } = await supabase.auth.getUser()

// stores/permission.ts - 整合 RBAC 系統
const permissions = await supabase
  .rpc('get_user_permissions', { user_id })
```

## **開發工作流程**

### 日常開發
1. **資料模型變更**：
   - 建立新的 migration 文件
   - 在本地測試遷移
   - 更新 TypeScript 類型定義

2. **功能測試**：
   - 使用 `supabase db reset` 重置環境
   - 執行 seed.sql 初始化資料
   - 使用 verify_seed_data.sql 驗證

3. **部署流程**：
   - 推送 migrations 到 Supabase 雲端
   - 執行線上資料庫遷移
   - 驗證部署結果

### 故障排除
如遇到資料庫相關問題，請參考：
- **資料庫重置**：[supabase/docs/guides/database-reset.md](../../../supabase/docs/guides/database-reset.md)
- **權限問題**：[supabase/docs/guides/super-admin-guide.md](../../../supabase/docs/guides/super-admin-guide.md)
- **JSONB 系統**：[supabase/docs/guides/jsonb-system.md](../../../supabase/docs/guides/jsonb-system.md)

## **監控和維護**

### 系統健康檢查
```sql
-- 檢查 Super Admin 系統狀態
SELECT * FROM check_super_admin_system_health();

-- 檢查 JSONB 快照覆蓋率
SELECT * FROM check_jsonb_snapshot_coverage();

-- 檢查權限完整性
SELECT role_name, permission_count 
FROM roles_permission_summary;
```

### 效能監控
- **查詢效能**：監控 JSONB 索引使用情況
- **連線狀況**：追蹤資料庫連線池狀態
- **即時功能**：監控 Realtime 訂閱效能

## 🔐 **安全考量**

### Row Level Security (RLS)
- 所有敏感資料表都啟用 RLS
- 基於用戶角色的資料存取控制
- 詳細政策請參考：[rls-policy.md](./rls-policy.md)

### Super Admin 保護
- 防止核心角色被意外刪除
- 自動權限分配和恢復機制
- 緊急存取恢復功能

## **相關文檔**

### 專案主文檔
- [資料庫架構設計](./schema.sql)
- [API 服務架構](../architecture/api-services.md)
- [權限管理系統](../architecture/business-modules.md#權限管理域)

### Supabase 專屬文檔
- [📖 Supabase 文檔總覽](../../../supabase/docs/README.md)
- [🔄 資料庫重置指南](../../../supabase/docs/guides/database-reset.md)
- [🔐 Super Admin 完整指南](../../../supabase/docs/guides/super-admin-guide.md)
- [📊 JSONB 系統指南](../../../supabase/docs/guides/jsonb-system.md)

---

**注意事項**
- Supabase 相關的詳細操作指南都位於 `supabase/docs/` 目錄中
- 本文檔提供概述和索引，具體操作請參考專屬文檔
- 如有 Supabase 特定問題，請優先查閱 `supabase/docs/` 中的相關指南

**維護責任**
- 本文檔：隨專案架構變更更新
- supabase/docs/：隨 Supabase 功能實現更新
- 兩者保持概念層面的一致性，避免內容重複