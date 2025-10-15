# Supabase 本地開發

> **📌 說明**：此為展示專案的 Supabase 後端子專案，以下內容展示完整系統的後端開發工具與工作流程。

本專案使用 **Supabase CLI** 進行本地開發。

## 🚀 快速開始

### 前置條件

確保已安裝 Supabase CLI：
```bash
# 使用 Homebrew (macOS)
brew install supabase/tap/supabase

# 或使用 npm
npm install -g supabase

# 驗證安裝
supabase --version
```

### 啟動本地環境

```bash
# 1. 啟動 Supabase（包含 PostgreSQL、Auth、Storage 等所有服務）
supabase start

# 2. 初始化資料庫（執行 migrations + seeds）
supabase db reset

# 3. 啟動前端開發
cd ../admin-platform-vue
npm run dev
```

### 常用指令

```bash
# 查看本地 Supabase 狀態
supabase status

# 停止本地 Supabase
supabase stop

# 重置資料庫（清除所有資料並重新執行 migrations + seeds）
supabase db reset

# 查看資料庫變更
supabase db diff

# 創建新的 migration
supabase migration new <migration_name>

# 應用 migrations 到遠端資料庫
supabase db push --db-url="postgresql://..."
```

## 📁 專案結構

```
supabase/
├── config.toml           # Supabase CLI 配置
├── migrations/           # 資料庫 schema 變更記錄
├── seed-core.sql         # 初始種子資料
├── functions/            # Edge Functions
└── .env.example          # 環境變數範本（僅作文檔用）
```

## 🔧 配置說明

### config.toml

主要配置項：
- `[db]` - 資料庫設定（port 54322）
- `[api]` - API 設定（port 54321）
- `[studio]` - Studio 管理介面（port 54323）
- `[db.seed]` - 種子資料檔案配置

### 環境變數

本地開發時，Supabase CLI 會自動產生 JWT keys 和其他必要設定。

如需自訂環境變數，可修改 `config.toml` 中的 `env()` 引用。

## 🧪 測試

### 單元測試
```bash
npm run test
```

### E2E 測試
需要先啟動 Supabase 本地環境：
```bash
supabase start
# cd admin-platform
npm run test:e2e
```

## 📚 Migrations 管理

### 創建新的 Migration

```bash
# 1. 手動創建
supabase migration new add_users_table

# 2. 從資料庫變更自動生成
supabase db diff --use-migra > migrations/new_migration.sql
```

### Migration 最佳實踐

1. **命名規範**：使用描述性的名稱，例如 `add_users_table`、`update_orders_status`
2. **原子性**：每個 migration 應該是獨立且可逆的
3. **測試**：先在本地測試，確認無誤後再部署到生產環境

## 🚀 Migration 部署參考

Supabase CLI 可用於將 migrations 應用到遠端資料庫：

```bash
# 應用 migrations 到遠端資料庫
supabase db push --db-url="postgresql://user:password@host:5432/postgres"
```

> **注意**：此為技術參考，實際生產部署方式依專案需求而定。

## 🔗 相關資源

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase CLI 參考](https://supabase.com/docs/reference/cli)
- [本地開發指南](https://supabase.com/docs/guides/local-development)
- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)

## 🆘 常見問題

### Q: 本地服務無法啟動？
```bash
# 檢查是否有其他服務佔用端口
lsof -i :54321
lsof -i :54322

# 完全停止並清理
supabase stop --no-backup
supabase start
```

### Q: 如何重置資料庫？
```bash
supabase db reset
```
這會刪除所有資料，重新執行所有 migrations 和 seeds。

### Q: 如何查看 Supabase Studio？
```bash
# 啟動後訪問
open http://localhost:54323
```

預設登入資訊會顯示在終端輸出中。

### Q: 如何使用 inbucket 測試？
```bash
# 啟動後訪問
open http://localhost:54324
```

### Q: 本地開發和生產環境的區別？

| 項目 | 本地開發 | 生產環境 |
|------|----------|----------|
| **運行方式** | Supabase CLI | Docker Compose Self-Host |
| **配置檔** | config.toml | docker-compose.yml + .env |
| **API Port** | 54321 | 8000 |
| **DB Port** | 54322 | 5432 (內部) |
| **Migrations** | 自動應用 | 使用 `supabase db push` 手動應用 |
