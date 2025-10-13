# Migration 管理標準規範

## 概述

本文檔制定電商管理平台的資料庫 Migration 管理標準，確保資料庫變更的一致性、可維護性和安全性。

## 基本原則

### 1. 單一真實來源 (Single Source of Truth)
- **基線管理**: `20250820000000_baseline_migration.sql` 為系統架構基線
- **增量變更**: 所有後續修改通過新的 migration 檔案進行
- **版本控制**: Git 作為 migration 變更的權威版本控制系統

### 2. 向前相容性 (Forward Compatibility)  
- **非破壞性變更**: 優先使用 ADD COLUMN, CREATE INDEX 等安全操作
- **優雅降級**: 提供舊版本代碼的相容性支持
- **段階部署**: 支援藍綠部署和滾動更新

### 3. 可回復性 (Reversibility)
- **雙向 Migration**: 提供 UP 和 DOWN 操作
- **資料安全**: 確保回復過程不會造成資料遺失  
- **測試驗證**: 回復操作必須經過完整測試

## 檔案組織架構

### 目錄結構
```
supabase/
├── migrations/                           # 活躍 migration 檔案
│   ├── 20250820000000_baseline_migration.sql
│   ├── 20250821000000_feature_name.sql
│   └── 20250822000000_another_feature.sql
├── migrations_archive_YYYYMMDD/          # 歷史歸檔
│   ├── README_ARCHIVE.md
│   └── [歷史檔案...]
├── seed-*.sql                           # 種子資料檔案
├── database_backup_*.sql                # 資料庫備份
└── MIGRATION_*.md                       # 相關文檔
```

### 命名規範

#### Migration 檔案命名
```
格式: YYYYMMDDHHMMSS_descriptive_name.sql
範例: 20250821120000_add_product_categories.sql

組成說明:
- YYYYMMDDHHMMSS: 時間戳 (精確到秒)
- descriptive_name: 描述性名稱 (英文, 底線分隔)
- .sql: 檔案副檔名
```

#### 描述性名稱指引
| 操作類型 | 命名模式 | 範例 |
|----------|----------|------|
| 新增表 | `add_table_name` | `add_user_preferences` |
| 修改表 | `modify_table_name` | `modify_users_add_status` |
| 新增欄位 | `add_column_to_table` | `add_email_to_customers` |
| 新增索引 | `add_index_table_column` | `add_index_orders_status` |
| 新增功能 | `add_feature_name` | `add_notification_system` |
| 修復問題 | `fix_specific_issue` | `fix_permission_constraints` |
| 效能優化 | `optimize_table_or_query` | `optimize_order_queries` |

## Migration 開發流程

### Phase 1: 需求分析與設計
```bash
# 1. 分析業務需求
# - 明確功能範圍和資料需求
# - 識別受影響的表和關聯
# - 評估效能和安全影響

# 2. 設計 Migration 策略
# - 選擇適當的變更操作
# - 規劃資料遷移步驟 
# - 設計回復程序
```

### Phase 2: 開發與測試
```bash
# 1. 建立 Migration 檔案
supabase migration new descriptive_feature_name

# 2. 編寫 Migration 內容
vim supabase/migrations/$(ls -1 supabase/migrations/ | tail -1)

# 3. 本地開發環境測試
supabase db reset        # 完整重建測試
supabase migration up    # 增量測試

# 4. 驗證資料庫狀態
supabase db diff         # 檢查實際變更
```

### Phase 3: 品質驗證
```bash
# 1. 語法檢查
# 使用 PostgreSQL 語法驗證工具

# 2. 效能測試  
# 分析查詢計劃和執行時間

# 3. 相容性測試
# 確認與現有代碼和 API 的相容性

# 4. 回復測試
# 驗證 DOWN migration 或手動回復程序
```

### Phase 4: 部署準備
```bash
# 1. 文檔更新
# - 更新相關技術文檔
# - 記錄重要變更說明
# - 準備部署指引

# 2. 備份策略
# - 建立部署前完整備份
# - 準備快速回復方案

# 3. 監控準備
# - 設定部署後監控指標
# - 準備異常處理程序
```

## Migration 撰寫標準

### 基本結構範本
```sql
-- =====================================================
-- [功能名稱] Migration
-- 日期: YYYY-MM-DD
-- 目的: [詳細說明此 Migration 的業務目的]
-- 影響: [說明對現有系統的影響]
-- =====================================================

-- =====================================================
-- 1. [主要變更分組 1]
-- =====================================================

-- 具體 SQL 操作
-- 包含詳細註釋說明

-- =====================================================
-- 2. [主要變更分組 2] 
-- =====================================================

-- 繼續其他變更...

-- =====================================================
-- 3. 索引和約束
-- =====================================================

-- 效能相關的索引建立
-- 資料完整性約束

-- =====================================================
-- 4. 權限設定
-- =====================================================

-- RLS 政策
-- 角色權限授予

-- =====================================================
-- 5. 驗證與測試
-- =====================================================

-- 自動驗證邏輯 (可選)
DO $$
BEGIN
    -- 驗證變更結果
    -- 報告執行狀態
END $$;
```

### 安全操作指引

#### ✅ 推薦操作 (低風險)
```sql
-- 新增表
CREATE TABLE IF NOT EXISTS new_table (...);

-- 新增欄位 (允許 NULL)
ALTER TABLE existing_table ADD COLUMN new_column TYPE DEFAULT NULL;

-- 新增索引 (非阻塞)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table(column);

-- 新增約束 (非阻塞驗證)
ALTER TABLE table ADD CONSTRAINT constraint_name CHECK (...) NOT VALID;
VALIDATE CONSTRAINT constraint_name;
```

#### 謹慎操作 (中風險)
```sql
-- 修改欄位類型 (需評估資料相容性)
ALTER TABLE table ALTER COLUMN col TYPE new_type USING col::new_type;

-- 新增 NOT NULL 約束 (需確保資料完整性)
ALTER TABLE table ALTER COLUMN col SET NOT NULL;

-- 重命名欄位 (需確保應用程式相容性)
ALTER TABLE table RENAME COLUMN old_name TO new_name;
```

#### 🚫 危險操作 (高風險，需特別審批)
```sql
-- 刪除表 (不可回復)
DROP TABLE table_name;

-- 刪除欄位 (資料遺失)  
ALTER TABLE table DROP COLUMN column_name;

-- 修改主鍵 (影響所有外鍵關聯)
ALTER TABLE table DROP CONSTRAINT pk, ADD PRIMARY KEY (...);
```

## 品質控制檢查表

### Pre-commit 檢查
- [ ] **語法正確**: Migration 可在本地環境正常執行
- [ ] **冪等性**: 重複執行不會產生錯誤或副作用
- [ ] **原子性**: 所有操作在單一交易中完成
- [ ] **命名規範**: 檔案名稱符合標準格式
- [ ] **註釋完整**: 包含清楚的變更說明和業務目的
- [ ] **索引優化**: 新表包含必要的索引
- [ ] **權限設定**: RLS 政策和角色權限正確設置

### Pre-deployment 檢查  
- [ ] **備份準備**: 完整資料庫備份已建立
- [ ] **回復計劃**: DOWN migration 或手動回復程序已準備
- [ ] **效能評估**: 大型資料集上的執行時間在可接受範圍
- [ ] **相容性測試**: 與現有應用程式代碼相容
- [ ] **監控設置**: 部署後監控和警報機制已就緒
- [ ] **文檔更新**: 相關技術文檔已同步更新
- [ ] **團隊通知**: 相關開發團隊已收到變更通知

### Post-deployment 驗證
- [ ] **執行成功**: Migration 正常完成，無錯誤訊息
- [ ] **資料完整性**: 資料遷移正確，無遺失或損壞
- [ ] **功能正常**: 相關應用程式功能運作正常
- [ ] **效能正常**: 系統效能未受到負面影響
- [ ] **監控正常**: 所有監控指標處於正常範圍

## 🚨 異常處理程序

### Migration 失敗處理
```bash
# 1. 立即停止相關服務
systemctl stop application_service

# 2. 檢查錯誤日誌
tail -f /var/log/postgresql/postgresql.log

# 3. 評估影響範圍
# - 資料完整性檢查
# - 系統功能驗證

# 4. 執行回復程序
# Option A: 使用備份回復
psql < database_backup_before_migration.sql

# Option B: 執行 DOWN migration (如果有)
supabase migration down

# 5. 重新啟動服務並驗證
systemctl start application_service
```

### 緊急回復 SOP
1. **評估**: 確認問題嚴重程度和影響範圍
2. **通知**: 立即通知相關團隊和利害關係人
3. **隔離**: 停止相關服務，防止問題擴散
4. **回復**: 使用預備的回復程序恢復系統
5. **驗證**: 確認系統功能和資料完整性
6. **監控**: 密切監控系統狀態，確保穩定
7. **檢討**: 分析根本原因，改善流程

## 最佳實踐建議

### 開發階段
1. **小步快跑**: 將大型變更拆分為多個小型 migration
2. **測試驅動**: 先在開發環境充分測試再推送
3. **文檔同步**: Migration 和文檔同步更新
4. **代碼審查**: 重要 migration 必須經過 peer review

### 部署階段  
1. **非尖峰時段**: 選擇低流量時段進行部署
2. **漸進部署**: 優先在測試環境驗證
3. **監控就緒**: 確保監控和警報系統正常運作
4. **快速回復**: 準備好快速回復方案

### 維護階段
1. **定期檢查**: 定期檢查 migration 執行狀態
2. **效能監控**: 持續監控資料庫效能指標
3. **文檔維護**: 保持 migration 相關文檔的時效性
4. **團隊培訓**: 定期培訓團隊成員相關最佳實踐

## 工具與資源

### 推薦工具
- **Supabase CLI**: 官方 migration 管理工具
- **pgAdmin**: PostgreSQL 管理和監控
- **pg_dump/pg_restore**: 備份和回復工具
- **EXPLAIN ANALYZE**: 查詢效能分析

### 學習資源
- [PostgreSQL 官方文檔](https://www.postgresql.org/docs/)
- [Supabase Migration 指南](https://supabase.com/docs/guides/cli/managing-environments)
- 專案內 migration 歷史範例 (`migrations_archive_*/`)

---

**版本**: 1.0  
**生效日期**: 2025-08-20  
**維護責任**: 開發團隊  
**審核週期**: 每季檢討

*本規範旨在確保資料庫變更的品質和安全性，所有團隊成員均應遵循此標準。*