# Supabase 本地開發完整指南

## 概述

本指南提供 Supabase 本地開發的完整工作流程，基於 Supabase CLI 進行本地開發和測試。

📖 **相關文檔**：
- [Supabase 整合](./supabase-integration.md) - 系統整合說明
- [Migration 策略](../02-database/migrations/migration-strategy.md) - 資料庫變更管理
- [Edge Functions 概述](../03-edge-functions/overview.md) - 無伺服器函數開發

## 🚀 快速開始

### 前置條件

#### 安裝 Supabase CLI
```bash
# macOS (推薦使用 Homebrew)
brew install supabase/tap/supabase

# Windows (Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux (使用 npm)
npm install -g supabase

# 驗證安裝
supabase --version
```

#### 系統需求
- **Docker Desktop**: Supabase CLI 使用 Docker 容器運行服務
- **Node.js**: 18+ (用於前端開發和測試)
- **PostgreSQL Client** (選用): 用於資料庫管理和調試

### 初次設置

#### 1. 啟動 Supabase 服務
```bash
# 進入專案目錄
cd /path/to/ecommerce-dashboard/supabase

# 啟動所有 Supabase 服務（PostgreSQL、Auth、Storage、Realtime等）
supabase start

# 輸出範例：
# Started supabase local development setup.
#
#          API URL: http://localhost:54321
#      GraphQL URL: http://localhost:54321/graphql/v1
#           DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#       Studio URL: http://localhost:54323
#     Inbucket URL: http://localhost:54324
#       JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
#         anon key: eyJhbGci...
# service_role key: eyJhbGci...
```

#### 2. 初始化資料庫
```bash
# 執行所有 migrations 和 seeds
supabase db reset

# 輸出範例：
# Applying migration 20240101000000_create_users_table.sql...
# Applying migration 20240102000000_create_orders_table.sql...
# ...
# Seeding database from seed-core.sql...
# Database reset complete!
```

#### 3. 啟動前端開發伺服器
```bash
# 切換到前端目錄
cd ../admin-platform-vue

# 安裝依賴（首次）
npm install

# 啟動開發伺服器
npm run dev

# 輸出範例：
#   VITE v5.0.0  ready in 500 ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: http://192.168.1.100:5173/
```

#### 4. 訪問管理介面
```bash
# Supabase Studio（資料庫管理）
open http://localhost:54323

# 前端應用
open http://localhost:5173

# 郵件測試（Inbucket）
open http://localhost:54324
```

## 📁 專案結構說明

```
supabase/
├── config.toml              # Supabase CLI 配置檔
├── migrations/              # 資料庫 schema 變更記錄（195 個檔案）
│   ├── 20240101000000_create_users_table.sql
│   ├── 20240102000000_create_orders_table.sql
│   └── ...
├── seed-core.sql            # 核心種子資料（角色、權限、測試用戶）
├── seed-test.sql            # 測試用大量資料（231KB）
├── functions/               # Edge Functions（15 個）
│   ├── _shared/            # 共用模組
│   ├── business-health-analytics/
│   ├── campaign-scoring/
│   └── ...
├── storage/                 # Storage 配置
└── docs/                    # Supabase 技術文檔 ⭐ 新增
```

## 🔧 常用開發指令

### 服務管理
```bash
# 查看服務狀態
supabase status

# 停止所有服務
supabase stop

# 完全停止並清理（不保留資料）
supabase stop --no-backup

# 重新啟動服務
supabase stop && supabase start
```

### 資料庫操作
```bash
# 重置資料庫（清空所有資料，重新執行 migrations + seeds）
supabase db reset

# 查看資料庫結構變更
supabase db diff

# 連接到資料庫（使用 psql）
psql 'postgresql://postgres:postgres@localhost:54322/postgres'

# 執行 SQL 檔案
psql 'postgresql://postgres:postgres@localhost:54322/postgres' -f my-script.sql
```

### Migrations 管理
```bash
# 創建新的 migration
supabase migration new add_notification_preferences_table

# 從資料庫變更自動生成 migration
supabase db diff --use-migra > migrations/new_migration.sql

# 應用 migrations 到遠端資料庫
supabase db push --db-url="postgresql://user:password@host:5432/postgres"
```

### Edge Functions 開發
```bash
# 啟動單個 function 本地伺服器
supabase functions serve business-health-analytics --env-file .env.local

# 啟動所有 functions
supabase functions serve --env-file .env.local

# 創建新的 function
supabase functions new my-function

# 部署 function
supabase functions deploy my-function

# 查看 function 日誌
supabase functions logs my-function --tail
```

## 🧪 開發工作流程

### 標準開發循環

#### 1. Feature 開發流程
```bash
# 1. 創建新的 feature 分支
git checkout -b feature/add-notification-system

# 2. 啟動本地 Supabase
supabase start

# 3. 創建資料庫 migration
supabase migration new create_notifications_table

# 4. 編輯 migration 檔案
vim migrations/20250101120000_create_notifications_table.sql

# 5. 應用 migration
supabase db reset

# 6. 開發前端功能
cd ../admin-platform-vue
npm run dev

# 7. 測試功能
npm run test

# 8. 提交變更
git add .
git commit -m "feat(notification): add notification system"
git push origin feature/add-notification-system
```

#### 2. Bug 修復流程
```bash
# 1. 重現問題
supabase start
cd ../admin-platform-vue && npm run dev

# 2. 查看資料庫狀態
supabase status
psql 'postgresql://postgres:postgres@localhost:54322/postgres'

# 3. 修復問題（可能需要新的 migration）
supabase migration new fix_notification_trigger

# 4. 測試修復
supabase db reset
npm run test

# 5. 提交修復
git commit -m "fix(notification): fix trigger not firing issue"
```

### 資料庫開發最佳實踐

#### 使用 Migration 而非手動變更
```bash
# ❌ 不推薦：直接在資料庫中手動變更
psql 'postgresql://postgres:postgres@localhost:54322/postgres'
# ALTER TABLE users ADD COLUMN phone TEXT;

# ✅ 推薦：創建 migration
supabase migration new add_phone_to_users
# 編輯 migration 檔案後
supabase db reset
```

#### 測試 Migration 的向後相容性
```bash
# 1. 應用新的 migration
supabase db reset

# 2. 測試現有功能是否正常
npm run test

# 3. 確認資料遷移正確
psql 'postgresql://postgres:postgres@localhost:54322/postgres'
SELECT * FROM users LIMIT 10;
```

#### 使用 Seed 資料進行一致性測試
```bash
# 每次重置資料庫都會載入相同的測試資料
supabase db reset

# 確保測試環境一致性
npm run test:integration
```

## 🔗 與前端整合

### 環境變數配置

#### admin-platform-vue/.env.local
```bash
# Supabase 本地開發配置
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<從 supabase status 輸出複製>

# 其他環境變數
VITE_APP_NAME=電商管理平台
VITE_API_BASE_URL=http://localhost:54321
```

### 即時更新測試
```bash
# 1. 啟動 Supabase（含 Realtime）
supabase start

# 2. 啟動前端
cd ../admin-platform-vue && npm run dev

# 3. 在另一個終端中測試資料庫變更
psql 'postgresql://postgres:postgres@localhost:54322/postgres'
# INSERT INTO notifications (...) VALUES (...);

# 4. 觀察前端是否即時更新（透過 Realtime 訂閱）
```

### Edge Functions 本地測試
```bash
# 1. 啟動 Edge Function 本地伺服器
supabase functions serve business-health-analytics --env-file .env.local

# 2. 使用 curl 測試
curl -i --location --request POST 'http://localhost:54321/functions/v1/business-health-analytics' \
  --header 'Authorization: Bearer <ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{"dateRange": {"start": "2024-01-01", "end": "2024-12-31"}}'

# 3. 在前端中調用
# fetch('http://localhost:54321/functions/v1/business-health-analytics', ...)
```

## 🆘 故障排除

### 常見問題與解決方案

#### 問題 1: 端口被占用
```bash
# 症狀
Error: Port 54321 is already in use

# 解決方案 1: 查找並終止佔用進程
lsof -ti :54321 | xargs kill -9
lsof -ti :54322 | xargs kill -9

# 解決方案 2: 修改配置使用不同端口
# 編輯 config.toml
[api]
port = 54421

[db]
port = 54422
```

#### 問題 2: Migration 失敗
```bash
# 症狀
Error: Migration 20250101120000 failed

# 調試步驟
# 1. 查看詳細錯誤
supabase db reset --debug

# 2. 手動測試 SQL
psql 'postgresql://postgres:postgres@localhost:54322/postgres' \
  -f migrations/20250101120000_problematic_migration.sql

# 3. 修復 migration 檔案後重試
vim migrations/20250101120000_problematic_migration.sql
supabase db reset
```

#### 問題 3: 資料庫連線失敗
```bash
# 症狀
Error: Cannot connect to database

# 檢查步驟
# 1. 確認服務運行
supabase status

# 2. 檢查 Docker 容器
docker ps | grep supabase

# 3. 完全重新啟動
supabase stop --no-backup
supabase start
```

#### 問題 4: Edge Function 無法啟動
```bash
# 症狀
Error: Function failed to start

# 調試步驟
# 1. 檢查 function 語法
deno check functions/my-function/index.ts

# 2. 查看詳細日誌
supabase functions serve my-function --debug

# 3. 確認環境變數
cat .env.local
```

#### 問題 5: Seed 資料載入失敗
```bash
# 症狀
Error: Seed script failed

# 解決方案
# 1. 檢查 SQL 語法
psql 'postgresql://postgres:postgres@localhost:54322/postgres' -f seed-core.sql

# 2. 分段執行 seed 檔案
# 將大型 seed-test.sql 拆分成小段測試

# 3. 跳過 seed 只執行 migrations
supabase db reset --skip-seed
```

## 🔐 安全注意事項

### 本地開發環境
```bash
# ✅ 安全實踐
# 1. 使用 .env.local（已加入 .gitignore）
echo "SUPABASE_SERVICE_ROLE_KEY=xxx" >> .env.local

# 2. 不要將本地憑證提交到版本控制
# .gitignore 應包含：
# .env.local
# .env

# 3. 定期更新 Supabase CLI
brew upgrade supabase
```

### 生產環境差異
| 項目 | 本地開發 | 生產環境 |
|------|----------|----------|
| **運行方式** | Supabase CLI | Docker Compose Self-Host |
| **配置檔** | config.toml | docker-compose.yml + .env |
| **API Port** | 54321 | 8000 |
| **DB Port** | 54322 | 5432 (內部) |
| **Migrations** | 自動應用 (`db reset`) | 手動應用 (`db push`) |
| **JWT Secret** | CLI 自動生成 | 手動配置 |
| **Anon Key** | CLI 自動生成 | 手動配置 |

## 📊 效能優化建議

### Docker 資源配置
```bash
# 增加 Docker Desktop 記憶體限制
# Docker Desktop -> Preferences -> Resources -> Memory: 8GB
```

### 資料庫效能調校
```sql
-- 分析查詢效能
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 'xxx';

-- 建立適當索引
CREATE INDEX CONCURRENTLY idx_orders_user_created
ON orders(user_id, created_at DESC);

-- 定期執行 VACUUM
VACUUM ANALYZE orders;
```

### Edge Functions 優化
```typescript
// 減少 import，提升冷啟動速度
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 使用 Deno 原生 API 而非 npm 套件
const data = await Deno.readTextFile("./file.txt")
```

## 📚 相關資源

- [Supabase CLI 官方文檔](https://supabase.com/docs/reference/cli)
- [本地開發最佳實踐](https://supabase.com/docs/guides/local-development)
- [Migration 策略](../02-database/migrations/migration-strategy.md)
- [Edge Functions 開發](../03-edge-functions/overview.md)
- [Supabase 整合指南](./supabase-integration.md)
