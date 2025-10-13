# Docker 部署指南

## 目錄

- [部署架構概述](#部署架構概述)
- [環境準備](#環境準備)
- [開發環境部署](#開發環境部署)
- [生產環境部署](#生產環境部署)
- [常見問題排除](#常見問題排除)
- [維護指南](#維護指南)

---

## 部署架構概述

### 架構決策

本專案採用以下部署策略：
- **開發環境**：使用 **Supabase CLI** (`supabase start`)
- **生產環境**：使用 **Supabase Self-Host** (完全自架)

### 整體架構

```
開發環境（Supabase CLI）：
┌─────────────────────────────────────────────┐
│  Docker Compose (開發)                      │
├─────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Admin Vue   │  │ VitePress Docs       │ │
│  │ (Vite Dev)  │  │ (Port 8081)          │ │
│  │ Port 5173   │  └──────────────────────┘ │
│  └─────────────┘                            │
│         ↓ (via supabase_network_*)          │
│  ┌─────────────────────────────────────┐   │
│  │ Supabase CLI (supabase start)       │   │
│  │ - PostgreSQL (54322)                │   │
│  │ - Kong API (54321)                  │   │
│  │ - Studio (54323)                    │   │
│  │ - Realtime, Auth, Storage...        │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘

生產環境（Supabase Self-Host）：
┌─────────────────────────────────────────────┐
│  Docker Compose Supabase Stack              │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐   │
│  │ Supabase Self-Host Services         │   │
│  │ ┌──────┐ ┌──────┐ ┌──────┐         │   │
│  │ │ Kong │ │ Auth │ │ REST │ ...     │   │
│  │ └──────┘ └──────┘ └──────┘         │   │
│  │ ┌──────────────────────────────┐   │   │
│  │ │ PostgreSQL (Port 5432)       │   │   │
│  │ └──────────────────────────────┘   │   │
│  │ Network: supabase_selfhost_network │   │
│  └─────────────────────────────────────┘   │
│         ↑                                    │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │ Admin Vue   │  │ VitePress Docs       │ │
│  │ (Nginx)     │  │ (Port 8081)          │ │
│  │ Port 8080   │  └──────────────────────┘ │
│  └─────────────┘                            │
└─────────────────────────────────────────────┘
```

### 核心組件

#### 1. 前端應用 (Admin Vue)
- **開發環境**: Vite Dev Server (Port 5173)
  - 支援 Hot Module Replacement (HMR)
  - Volume mount 即時重載
- **生產環境**: Nginx (Port 8080)
  - 多階段 Docker 建置
  - Gzip 壓縮和靜態資源快取
  - 支援 Vue Router history mode

#### 2. 文件服務 (VitePress)
- Port 8081
- 提供專案技術文件
- 開發和生產環境共用配置

#### 3. 後端服務 (Supabase)
- **開發環境**: Supabase CLI (本地 Docker 容器，自動管理)
  - 使用 `supabase start` 啟動
  - 網路：`supabase_network_<project_id>`
  - 端口：54321 (API), 54322 (DB), 54323 (Studio)
- **生產環境**: Supabase Self-Host (完全自架)
  - 使用 `docker-compose.supabase.yml`
  - 包含所有 Supabase 服務（Kong, Auth, REST, Realtime, Storage, PostgreSQL 等）
  - 網路：`supabase_selfhost_network`
  - 端口：8000 (Kong API), 5432 (PostgreSQL), 3000 (Studio)

---

## 環境準備

### 必要工具

1. **Docker & Docker Compose**
   ```bash
   # 檢查 Docker 版本
   docker --version  # 建議 20.10+
   docker-compose --version  # 建議 2.0+
   ```

2. **Supabase CLI** (開發環境)
   ```bash
   # 安裝 Supabase CLI
   npm install -g supabase

   # 檢查版本
   supabase --version
   ```

3. **Node.js** (可選，用於本地開發)
   ```bash
   # 建議 Node.js 20+
   node --version
   ```

### 環境變數配置

#### 1. 複製環境變數範本

```bash
# 開發環境（如果尚未建立 .env.local）
cd admin-platform-vue
cp .env.example .env.local

# 生產環境
cd ..
cp .env.example .env.production
```

#### 2. 配置環境變數

**開發環境 (`admin-platform-vue/.env.local`)**:
```bash
# Supabase 連線配置
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<本地 Supabase anon key>
VITE_SUPABASE_BUCKET_NAME=ecommerce-dashboard

# 應用程式基礎 URL
VITE_BASE_URL=http://localhost:5173
SITE_URL=http://localhost:5173
```

**生產環境 (`.env.production`)**:
```bash
# Supabase 連線配置（替換為實際值）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<生產環境 anon key>
VITE_SUPABASE_BUCKET_NAME=ecommerce-dashboard

# 應用程式基礎 URL（替換為實際域名）
VITE_BASE_URL=https://your-domain.com
SITE_URL=https://your-domain.com

# Docker 配置
FRONTEND_COMMAND=npm run preview
FRONTEND_PORT=8080
NODE_ENV=production
```

---

## 開發環境部署

### 方法 1: 使用啟動腳本（推薦）

```bash
# 啟動開發環境
./scripts/dev.sh up

# 查看服務日誌
./scripts/dev.sh logs

# 停止開發環境
./scripts/dev.sh down

# 重啟開發環境
./scripts/dev.sh restart

# 重新建置 Docker 映像
./scripts/dev.sh build
```

### 方法 2: 使用 Docker Compose

```bash
# 啟動 Supabase（必須）
supabase start

# 啟動開發環境
docker-compose -f docker-compose.dev.yml up -d

# 查看服務狀態
docker-compose -f docker-compose.dev.yml ps

# 查看日誌
docker-compose -f docker-compose.dev.yml logs -f

# 停止服務
docker-compose -f docker-compose.dev.yml down
```

### 服務存取

| 服務 | URL | 說明 |
|------|-----|------|
| 前端應用 | http://localhost:5173 | Vue 3 管理介面 |
| VitePress 文件 | http://localhost:8081 | 專案技術文件 |
| Supabase API | http://localhost:54321 | Supabase RESTful API |
| Supabase Studio | http://localhost:54323 | Supabase 管理介面 |
| Inbucket (Email) | http://localhost:54324 | 郵件測試工具 |

### 健康檢查

```bash
# 執行健康檢查
./scripts/health-check.sh dev
```

---

## 🏭 生產環境部署

### 方法 1: 使用啟動腳本（推薦）

```bash
# 啟動生產環境（包含 Supabase Self-Host）
./scripts/prod.sh up

# 只啟動 Supabase Self-Host
./scripts/prod.sh supabase-up

# 查看服務日誌
./scripts/prod.sh logs

# 健康檢查
./scripts/prod.sh health

# 停止生產環境
./scripts/prod.sh down

# 只停止 Supabase Self-Host
./scripts/prod.sh supabase-down

# 重新建置 Docker 映像
./scripts/prod.sh build
```

### 方法 2: 使用 Docker Compose

```bash
# 1. 先啟動 Supabase Self-Host
docker-compose -f docker-compose.supabase.yml up -d

# 2. 等待 Supabase 服務啟動完成（約 30 秒）
docker-compose -f docker-compose.supabase.yml ps

# 3. 啟動前端應用
docker-compose -f docker-compose.prod.yml up -d

# 查看服務狀態
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.supabase.yml ps

# 健康檢查
curl http://localhost:8080/health
curl http://localhost:8000/health

# 停止服務
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.supabase.yml down
```

### 服務存取

| 服務 | URL | 說明 |
|------|-----|------|
| 前端應用 | http://localhost:8080 | Nginx 靜態伺服 |
| 健康檢查 | http://localhost:8080/health | 健康檢查端點 |
| VitePress 文件 | http://localhost:8081 | 專案技術文件 |
| **Supabase Kong API** | http://localhost:8000 | Supabase API Gateway |
| **Supabase Studio** | http://localhost:3000 | Supabase 管理介面 |
| **PostgreSQL** | localhost:5432 | 資料庫（內部存取） |

### Supabase Self-Host 配置

#### 1. 環境變數配置

複製並配置 Supabase 環境變數：

```bash
# 複製 Supabase 環境變數範本
cp .env.supabase.example .env.supabase

# 編輯配置（必須修改以下關鍵設定）
nano .env.supabase
```

**⚠️ 必須修改的關鍵設定**：

```bash
# PostgreSQL 密碼（至少 32 字元）
POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password

# JWT Secret（至少 32 字元）
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# SMTP 設定（如需郵件功能）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SENDER_NAME=Your App Name

# 網站 URL（替換為實際域名）
SITE_URL=http://localhost:8080
ADDITIONAL_REDIRECT_URLS=http://localhost:8080
```

#### 2. 生成 API Keys

使用 Supabase 提供的工具生成正確的 JWT keys：

```bash
# 安裝 JWT 產生工具
npm install -g @supabase/jwt-cli

# 產生 anon key（公開，客戶端使用）
jwt generate --secret="your-super-secret-jwt-token" \
  --payload '{"role":"anon","iss":"supabase","iat":1700000000,"exp":1900000000}'

# 產生 service_role key（私密，伺服器端使用）
jwt generate --secret="your-super-secret-jwt-token" \
  --payload '{"role":"service_role","iss":"supabase","iat":1700000000,"exp":1900000000}'
```

將生成的 keys 更新到 `.env.supabase`：

```bash
ANON_KEY=<generated-anon-key>
SERVICE_ROLE_KEY=<generated-service-role-key>
```

#### 3. 更新前端環境變數

修改 `.env.production` 使用 Self-Host API：

```bash
# 使用 Self-Host API
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_SUPABASE_BUCKET_NAME=ecommerce-dashboard
VITE_BASE_URL=http://localhost:8080
SITE_URL=http://localhost:8080
```

#### 4. 資料庫初始化

第一次啟動後，執行資料庫遷移：

```bash
# 連接到 PostgreSQL
docker exec -it supabase-db psql -U postgres -d postgres

# 或使用 Supabase CLI 連接
psql "postgresql://postgres:your-password@localhost:5432/postgres"

# 執行專案的 SQL migrations
# （從 supabase/migrations/ 目錄）
\i /path/to/supabase/migrations/your-migration.sql
```

或使用 Supabase Studio (http://localhost:3000) 的 SQL Editor 執行遷移。

### 生產環境最佳實踐

#### 1. 使用反向代理

建議在生產環境中使用 Nginx 或 Caddy 作為反向代理：

```nginx
# Nginx 反向代理範例
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 2. 啟用 HTTPS

```bash
# 使用 Let's Encrypt
certbot --nginx -d your-domain.com
```

#### 3. 設定環境變數安全性

```bash
# 確保 .env.production 權限正確
chmod 600 .env.production

# 不要提交到版本控制（已在 .gitignore 中保護）
```

#### 4. 定期備份

```bash
# 備份環境變數
cp .env.production .env.production.backup

# 備份 Docker volumes（如果使用）
docker run --rm -v docs_node_modules:/data -v $(pwd):/backup \
  alpine tar czf /backup/docs_node_modules.tar.gz /data
```

---

## ❓ 常見問題排除

### 問題 1: 容器無法啟動

**症狀**: `docker-compose up` 失敗

**解決方法**:
```bash
# 檢查日誌
docker-compose -f docker-compose.dev.yml logs

# 檢查埠號佔用
lsof -i :5173  # 開發環境
lsof -i :8080  # 生產環境

# 清理並重新啟動
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### 問題 2: Supabase 網路連線錯誤（開發環境）

**症狀**: `network supabase_network_ecommerce-dashboard not found`

**解決方法**:
```bash
# 啟動 Supabase CLI
supabase start

# 檢查網路
docker network ls | grep supabase

# 如果網路名稱不同，更新 docker-compose.dev.yml 中的網路名稱
# 位置: networks.supabase_network.name
```

### 問題 2-1: Supabase Self-Host 無法啟動（生產環境）

**症狀**: `docker-compose.supabase.yml` 啟動失敗或服務不健康

**解決方法**:
```bash
# 檢查 .env.supabase 是否存在
ls -la .env.supabase

# 檢查必要環境變數
grep "POSTGRES_PASSWORD\|JWT_SECRET\|ANON_KEY" .env.supabase

# 查看服務日誌
docker-compose -f docker-compose.supabase.yml logs kong
docker-compose -f docker-compose.supabase.yml logs auth
docker-compose -f docker-compose.supabase.yml logs db

# 重新啟動 Supabase
docker-compose -f docker-compose.supabase.yml down
docker-compose -f docker-compose.supabase.yml up -d

# 等待所有服務啟動（約 30-60 秒）
watch -n 2 'docker-compose -f docker-compose.supabase.yml ps'
```

### 問題 3: 環境變數未生效

**症狀**: 應用程式無法連接到 Supabase

**解決方法**:
```bash
# 檢查環境變數檔案
cat admin-platform-vue/.env.local  # 開發環境
cat .env.production  # 生產環境

# 重新建置容器
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d --build
```

### 問題 4: 前端應用 404 錯誤（生產環境）

**症狀**: Vue Router 路由顯示 404

**解決方法**:
```bash
# 確認 nginx.conf 正確配置
cat admin-platform-vue/nginx.conf

# 檢查 try_files 設定
# 應包含: try_files $uri $uri/ /index.html;

# 重新建置
./scripts/prod.sh build
./scripts/prod.sh up
```

### 問題 5: Hot-reload 不工作（開發環境）

**症狀**: 修改程式碼後瀏覽器未自動重載

**解決方法**:
```bash
# 檢查 volume mount
docker-compose -f docker-compose.dev.yml config

# 確認 Vite 配置包含 --host
# package.json 中應有: "dev": "vite --host"

# 重啟容器
./scripts/dev.sh restart
```

### 問題 6: Supabase Self-Host JWT 認證錯誤

**症狀**: API 請求返回 401 Unauthorized 或 "Invalid JWT"

**解決方法**:
```bash
# 1. 驗證 JWT Secret 一致性
# .env.supabase 中的 JWT_SECRET 必須與生成 keys 時使用的 secret 一致

# 2. 重新生成正確的 API keys
npm install -g @supabase/jwt-cli

jwt generate --secret="$(grep JWT_SECRET .env.supabase | cut -d'=' -f2)" \
  --payload '{"role":"anon","iss":"supabase","iat":1700000000,"exp":1900000000}'

# 3. 更新 .env.supabase 中的 ANON_KEY 和 SERVICE_ROLE_KEY

# 4. 更新 .env.production 中的 VITE_SUPABASE_ANON_KEY

# 5. 重新啟動所有服務
./scripts/prod.sh down
./scripts/prod.sh up
```

### 問題 7: Supabase Self-Host 資料庫連線錯誤

**症狀**: 無法連接到 PostgreSQL 或 migrations 失敗

**解決方法**:
```bash
# 檢查 PostgreSQL 容器狀態
docker ps | grep supabase-db

# 檢查資料庫日誌
docker logs supabase-db

# 測試資料庫連線
docker exec -it supabase-db psql -U postgres -c "SELECT version();"

# 如果密碼錯誤，確認 .env.supabase 中的 POSTGRES_PASSWORD
grep POSTGRES_PASSWORD .env.supabase

# 重建資料庫（⚠️ 會刪除所有資料）
docker-compose -f docker-compose.supabase.yml down -v
docker-compose -f docker-compose.supabase.yml up -d
```

---

## 維護指南

### 定期維護任務

#### 1. 清理未使用的 Docker 資源

```bash
# 清理停止的容器
docker container prune

# 清理未使用的映像
docker image prune -a

# 清理未使用的 volumes
docker volume prune

# 一次性清理所有未使用資源
docker system prune -a --volumes
```

#### 2. 更新 Docker 映像

```bash
# 重新建置映像
./scripts/dev.sh build  # 開發環境
./scripts/prod.sh build  # 生產環境
```

#### 3. 監控容器狀態

```bash
# 查看容器資源使用
docker stats

# 查看容器日誌
docker-compose -f docker-compose.prod.yml logs --tail=100

# 執行健康檢查
./scripts/health-check.sh prod
```

### 升級指南

#### 更新專案依賴

```bash
# 進入容器
docker-compose -f docker-compose.dev.yml exec admin-vue sh

# 更新依賴
npm update

# 退出容器並重新建置
exit
./scripts/dev.sh build
```

#### 更新 Supabase

```bash
# 停止 Supabase
supabase stop

# 更新 Supabase CLI
npm install -g supabase@latest

# 重新啟動
supabase start
```

### 日誌管理

#### 查看日誌

```bash
# 即時查看所有服務日誌
./scripts/dev.sh logs

# 查看特定服務日誌
docker-compose -f docker-compose.dev.yml logs admin-vue

# 查看最近 100 行日誌
docker-compose -f docker-compose.dev.yml logs --tail=100
```

#### 日誌輪轉配置

在 `docker-compose.yml` 中添加日誌配置：

```yaml
services:
  admin-vue:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 相關文件

- [環境變數配置範例](../../../.env.example)
- [Nginx 配置](../../../admin-platform-vue/nginx.conf)
- [Dockerfile 說明](../../../admin-platform-vue/Dockerfile)
- [Supabase 配置](../../../supabase/config.toml)

---

## 變更記錄

| 日期 | 版本 | 說明 |
|------|------|------|
| 2025-10-03 | 2.0.0 | 整合 Supabase Self-Host 生產環境架構 |
| 2025-10-03 | 1.1.0 | 新增 Supabase Self-Host 配置、JWT 生成指南、故障排除 |
| 2025-10-03 | 1.0.0 | 初始版本，完整 Docker 部署架構 |

### 版本 2.0.0 重大變更

#### 新增功能
- ✅ 完整 Supabase Self-Host 生產環境支援
- ✅ 14 個 Supabase 微服務整合（Kong, Auth, REST, Realtime, Storage, PostgreSQL 等）
- ✅ 雙環境網路架構（開發使用 CLI，生產使用 Self-Host）
- ✅ 自動化腳本支援 Supabase Self-Host 生命週期管理
- ✅ JWT Key 生成工具和配置指南
- ✅ Self-Host 特定故障排除章節

#### 架構變更
- **開發環境**: 繼續使用 Supabase CLI (`supabase start`)
  - 網路: `supabase_network_ecommerce-dashboard`
  - 服務: PostgreSQL (54322), Kong (54321), Studio (54323)

- **生產環境**: 改用 Supabase Self-Host
  - 網路: `supabase_selfhost_network`
  - 服務: Kong (8000), PostgreSQL (5432), Studio (3000)
  - 新增: `docker-compose.supabase.yml`, `.env.supabase.example`

#### 配置檔案
- 新增 `docker-compose.supabase.yml` - 完整 Supabase 服務編排
- 新增 `.env.supabase.example` - Supabase 環境變數範本
- 更新 `docker-compose.prod.yml` - 連接 Self-Host 網路
- 更新 `scripts/prod.sh` - Supabase 生命週期管理
- 更新 `scripts/health-check.sh` - 支援 Self-Host 健康檢查

---

**維護者**: 電商管理平台開發團隊
**最後更新**: 2025-10-03
