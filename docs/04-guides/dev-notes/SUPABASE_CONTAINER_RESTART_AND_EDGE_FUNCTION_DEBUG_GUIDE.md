# Supabase 容器重啟與 Edge Function 除錯指南

## 概述

本指南記錄完整的 Supabase 本地開發環境重啟流程，以及 Edge Function 500 錯誤的完整除錯過程。適用於容器健康檢查失敗、Edge Function 錯誤、或需要完全重建本地環境的情況。

## 適用場景

- Supabase 容器啟動失敗或健康檢查失敗
- Edge Function 返回 500 Internal Server Error
- 需要完全重建本地開發環境
- Migration 執行失敗需要重新初始化

## 完整除錯流程

### Phase 1: 完全清理容器環境

#### 1.1 停止所有 Supabase 服務
```bash
# 停止 Supabase 服務
supabase stop

# 如果有背景 Edge Functions 服務，也需要停止
# 檢查背景服務
ps aux | grep "supabase functions serve"
# 停止對應的 PID
kill <PID>
```

#### 1.2 檢查並移除所有相關容器
```bash
# 查看所有相關容器
docker ps -a --filter "label=com.supabase.cli.project=ecommerce-dashboard"

# 移除所有容器（替換為實際的容器名稱）
docker rm supabase_studio_ecommerce-dashboard \
  supabase_pg_meta_ecommerce-dashboard \
  supabase_edge_runtime_ecommerce-dashboard \
  supabase_storage_ecommerce-dashboard \
  supabase_rest_ecommerce-dashboard \
  supabase_realtime_ecommerce-dashboard \
  supabase_inbucket_ecommerce-dashboard \
  supabase_auth_ecommerce-dashboard \
  supabase_kong_ecommerce-dashboard \
  supabase_vector_ecommerce-dashboard \
  supabase_analytics_ecommerce-dashboard \
  supabase_db_ecommerce-dashboard
```

#### 1.3 清理網路和卷
```bash
# 檢查相關網路
docker network ls --filter "label=com.supabase.cli.project=ecommerce-dashboard"

# 移除網路
docker network rm supabase_network_ecommerce-dashboard

# 檢查相關卷
docker volume ls --filter "label=com.supabase.cli.project=ecommerce-dashboard"

# 移除所有卷（這會清除所有本地資料）
docker volume rm supabase_config_ecommerce-dashboard \
  supabase_db_ecommerce-dashboard \
  supabase_edge_runtime_ecommerce-dashboard \
  supabase_storage_ecommerce-dashboard

# 清理 Docker 系統空間
docker system prune -f
```

### Phase 2: 配置調整與問題預防

#### 2.1 停用有問題的服務（Analytics）
```bash
# 編輯 supabase/config.toml
# 將 Analytics 服務停用以避免啟動問題
```

在 `supabase/config.toml` 中修改：
```toml
[analytics]
enabled = false  # 從 true 改為 false
port = 54327
backend = "postgres"
```

#### 2.2 暫時停用種子資料（如有問題）
```bash
# 如果 seed 檔案有問題，暫時停用
```

在 `supabase/config.toml` 中修改：
```toml
[db.seed]
enabled = false  # 從 true 改為 false
```

#### 2.3 處理有問題的 Migration 檔案
```bash
# 如果某些 migration 檔案在初始化時有問題，暫時停用
mv supabase/migrations/20250820180000_restore_auth_functions.sql \
   supabase/migrations/20250820180000_restore_auth_functions.sql.disabled
```

### Phase 3: 重新啟動 Supabase

#### 3.1 啟動 Supabase
```bash
# 啟動 Supabase（增加 timeout）
timeout 300 supabase start

# 如果需要 debug 資訊
supabase start --debug
```

#### 3.2 檢查啟動狀態
```bash
# 檢查服務狀態
supabase status

# 應該看到類似輸出：
# supabase local development setup is running.
```

### Phase 4: 資料庫驗證與修復

#### 4.1 驗證基礎表結構
```bash
# 檢查關鍵表是否正確創建
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\d customers"
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\d users"
```

#### 4.2 檢查缺失的函數
```bash
# 檢查 resolve_user_identity 函數是否存在
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT resolve_user_identity('550e8400-e29b-41d4-a716-446655440000'::uuid);"

# 如果返回 "function does not exist"，需要手動恢復
```

#### 4.3 手動恢復認證函數（如需要）
```bash
# 執行被停用的認證函數恢復檔案
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20250820180000_restore_auth_functions.sql.disabled

# 驗證函數恢復成功
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT resolve_user_identity('550e8400-e29b-41d4-a716-446655440000'::uuid);"

# 應該返回：
# {"id": null, "type": "not_found", "auth_user_id": "550e8400-e29b-41d4-a716-446655440000"}
```

### Phase 5: Edge Function 驗證

#### 5.1 測試 Edge Function 基本功能
```bash
# 測試 sync-user-record Edge Function
curl -X POST "http://127.0.0.1:54321/functions/v1/sync-user-record" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"test": true}'

# 預期結果：401 Unauthorized（而非 500 Internal Server Error）
# 回應：{"msg":"Invalid JWT"}
```

#### 5.2 Edge Function 完整測試
```bash
# 測試其他關鍵 Edge Functions
curl -X POST "http://127.0.0.1:54321/functions/v1/sync-customer-record" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"test": true}'

# 所有函數都應該返回 401 而不是 500
```

### Phase 6: 系統完整性驗證

#### 6.1 檢查所有服務端點
```bash
# API 端點
curl -s http://127.0.0.1:54321/rest/v1/ | head -5

# Studio 端點（瀏覽器）
open http://127.0.0.1:54323

# 資料庫連接
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT version();"
```

#### 6.2 重新啟用被停用的功能（可選）
```bash
# 如果系統穩定，可以重新啟用之前停用的功能

# 1. 重新啟用 Analytics（在 config.toml 中）
[analytics]
enabled = true

# 2. 重新啟用種子資料（在 config.toml 中）
[db.seed]
enabled = true

# 3. 重新命名 migration 檔案
mv supabase/migrations/20250820180000_restore_auth_functions.sql.disabled \
   supabase/migrations/20250820180000_restore_auth_functions.sql

# 4. 重新啟動測試
supabase stop
supabase start
```

## 🚨 常見問題與解決方案

### 問題 1: Analytics 容器 unhealthy
**症狀**: `supabase_analytics_ecommerce-dashboard container is not ready: unhealthy`

**解決方案**:
```bash
# 在 config.toml 中停用 Analytics
[analytics]
enabled = false
```

### 問題 2: Edge Function 返回 500 錯誤
**症狀**: Edge Function 返回 "Internal Server Error" 而非預期的認證錯誤

**根本原因**: 缺失 `resolve_user_identity` RPC 函數

**解決方案**:
```bash
# 手動執行認證函數恢復檔案
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -f supabase/migrations/20250820180000_restore_auth_functions.sql.disabled
```

### 問題 3: Migration 執行時表不存在
**症狀**: `ERROR: relation "customers" does not exist`

**根本原因**: Migration 檔案執行順序問題或條件檢查不足

**解決方案**:
```bash
# 暫時停用有問題的 migration 檔案
mv supabase/migrations/problematic_file.sql \
   supabase/migrations/problematic_file.sql.disabled

# 先啟動系統，再手動執行
```

### 問題 4: 種子資料表不存在
**症狀**: `ERROR: relation "holidays" does not exist` 在 seeding 階段

**解決方案**:
```bash
# 暫時停用種子資料
[db.seed]
enabled = false

# 等系統啟動後手動執行種子資料
```

## 驗證檢查清單

### ✅ 系統啟動檢查
- [ ] `supabase status` 顯示所有服務正常運行
- [ ] API URL 可訪問: http://127.0.0.1:54321
- [ ] Studio 可訪問: http://127.0.0.1:54323
- [ ] 資料庫連接正常

### ✅ 資料庫完整性檢查
- [ ] 關鍵表存在且結構正確 (`customers`, `users`)
- [ ] 認證函數存在且正常工作 (`resolve_user_identity`)
- [ ] 外鍵約束正確設置
- [ ] 觸發器正常運作

### ✅ Edge Function 檢查
- [ ] `sync-user-record` 返回 401 而非 500
- [ ] `sync-customer-record` 返回 401 而非 500
- [ ] 其他關鍵 Edge Functions 正常回應

### ✅ 功能完整性檢查
- [ ] 認證流程可正常執行
- [ ] RPC 函數回應正確
- [ ] 即時訂閱功能正常（Realtime）

## 🔄 自動化腳本（可選）

可以將常用的清理和重啟流程寫成腳本：

```bash
#!/bin/bash
# supabase-full-restart.sh

echo "🔄 開始 Supabase 完全重啟流程..."

# 停止服務
echo "停止 Supabase 服務..."
supabase stop

# 清理容器
echo "清理 Docker 容器..."
docker ps -a --filter "label=com.supabase.cli.project=ecommerce-dashboard" -q | xargs -r docker rm

# 清理網路
echo "清理 Docker 網路..."
docker network ls --filter "label=com.supabase.cli.project=ecommerce-dashboard" -q | xargs -r docker network rm

# 清理卷
echo "清理 Docker 卷..."
docker volume ls --filter "label=com.supabase.cli.project=ecommerce-dashboard" -q | xargs -r docker volume rm

# 重新啟動
echo "重新啟動 Supabase..."
supabase start

echo "✅ Supabase 重啟完成！"
echo "檢查狀態: supabase status"
```

## 注意事項

1. **資料備份**: 清理 Docker 卷會清除所有本地資料，請確保重要資料已備份
2. **配置保留**: `supabase/config.toml` 的修改會影響後續啟動，記得根據需要調整
3. **Migration 順序**: 手動執行 migration 時要注意依賴關係
4. **環境變數**: 確保必要的環境變數已正確設置
5. **網路連接**: 某些步驟需要網路連接下載 Docker 映像

## 成功指標

當看到以下輸出時，表示系統已完全恢復：

```bash
$ supabase status
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: [key]
service_role key: [key]
supabase local development setup is running.
```

```bash
$ curl -X POST "http://127.0.0.1:54321/functions/v1/sync-user-record" \
  -H "Authorization: Bearer invalid-token" -d '{}'
{"msg":"Invalid JWT"}  # 401 錯誤，不是 500
```

---

**本指南基於實際除錯經驗整理，適用於 Supabase CLI 2.34.3+ 版本。**