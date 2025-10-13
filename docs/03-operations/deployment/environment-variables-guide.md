# 環境變數完整配置指南

## 概述

本指南詳細說明專案中所有環境變數檔案的用途、配置方式以及最佳實踐。

## 環境變數檔案清單

### 活躍使用的檔案 ✅

#### 1. `supabase/config.toml`
- **用途**: Supabase CLI 本地開發配置
- **環境**: 本地開發環境
- **關鍵設定**:
  ```toml
  [db]
  port = 54322

  [api]
  port = 54321

  [studio]
  port = 54323

  [db.seed]
  enabled = true
  sql_paths = ["./seed-core.sql"]
  ```
- **啟動方式**: `supabase start`
- **注意**: JWT keys 由 CLI 自動生成，不需手動配置

#### 2. `admin-platform-vue/.env.local`
- **用途**: Vue 前端管理平台開發配置
- **環境**: 開發環境
- **關鍵設定**:
  ```bash
  # Supabase CLI 連線
  VITE_SUPABASE_URL=http://localhost:54321
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9...

  # 應用配置
  VITE_SUPABASE_BUCKET_NAME=ecommerce-dashboard
  VITE_BASE_URL=http://localhost:5173
  NODE_ENV=development
  ```
- **啟動方式**: `npm run dev` (port 5173)
- **注意**: ANON_KEY 由 `supabase status` 取得

#### 3. `front-stage-vue/.env.local`
- **用途**: Vue 前台開發配置
- **環境**: 開發環境
- **關鍵設定**:
  ```bash
  # Supabase CLI 連線
  VITE_SUPABASE_URL=http://localhost:54321
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9...

  # 應用配置
  VITE_BASE_URL=http://localhost:5176
  ```
- **啟動方式**: `npm run dev` (port 5176)
- **最近更新**: 2025-10-04 - 改用 Supabase CLI (port 54321) 進行本地開發

#### 5. `.env.production`
- **用途**: 前端生產環境配置
- **環境**: 生產環境
- **關鍵設定**:
  ```bash
  VITE_SUPABASE_URL=http://localhost:8000
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_BASE_URL=http://localhost:8080
  SITE_URL=http://localhost:8080
  ```
- **部署方式**: `docker compose -f docker-compose.prod.yml up -d`

#### 6. `.env.example`
- **用途**: 專案環境變數範本
- **使用方式**: 複製為 `.env.production` 或其他環境檔案

### 已刪除/過時的檔案 ❌

#### ~~`supabase/.env`~~
- **狀態**: 已於 2025-10-04 刪除
- **原因**: Docker Compose Self-Host 配置，本地開發改用 Supabase CLI
- **替代方案**:
  - 本地開發: 使用 `supabase/config.toml`（Supabase CLI）
  - 生產部署: 在雲端伺服器上使用官方 Docker Compose 配置

#### ~~`supabase/.env.example`~~
- **狀態**: 已於 2025-10-04 刪除
- **原因**: Docker Compose 配置模板，不再用於本地開發
- **替代方案**: 生產環境在伺服器上使用官方範本

#### ~~`supabase/docker-compose.yml`~~
- **狀態**: 已於 2025-10-04 刪除
- **原因**: 本地開發不使用 Docker Compose，改用 Supabase CLI
- **替代方案**: 生產環境在伺服器上 clone 官方配置

#### ~~`docker-compose.prod.yml`~~
- **狀態**: 已於 2025-10-04 刪除
- **原因**: 混合部署方案已廢棄，簡化架構
- **替代方案**: 本地使用 CLI，生產環境獨立部署

#### ~~`.env.supabase`~~
- **狀態**: 已於 2025-10-03 刪除
- **原因**: 自訂配置檔，與官方 `supabase/.env` 重複
- **替代方案**: 已整合到 Docker Compose 配置（現已全部移除）

#### ~~`.env.supabase.example`~~
- **狀態**: 已於 2025-10-03 刪除
- **原因**: 與官方 `supabase/.env.example` 重複
- **替代方案**: 已整合到 Docker Compose 配置（現已全部移除）

#### ~~`supabase/.env.local`~~
- **狀態**: 已於 2025-10-03 刪除
- **原因**: OAuth 憑證已整合到主要 `supabase/.env`
- **替代方案**: 現已全部改用 Supabase CLI，不需要手動配置 OAuth

#### ~~`admin-platform-react/.env.local`~~
- **狀態**: 已於 2025-10-03 刪除
- **原因**: React 專案為 skeleton project，未實際使用
- **替代方案**: 如需開發 React 版本，可參考 Vue 配置重新創建

## 配置方式

### 本地開發環境設定

#### 步驟 1: 啟動 Supabase CLI
```bash
# 1. 啟動 Supabase（所有服務自動配置）
cd supabase
supabase start

# 2. 初始化資料庫（執行 migrations + seeds）
supabase db reset

# 3. 查看連線資訊
supabase status
# 會顯示:
# - API URL: http://127.0.0.1:54321
# - anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Studio URL: http://127.0.0.1:54323
```

#### 步驟 2: 前端配置
```bash
# 1. 確認 .env.local 連線設定
# admin-platform-vue/.env.local:
# VITE_SUPABASE_URL=http://localhost:54321
# VITE_SUPABASE_ANON_KEY=[從 supabase status 取得]

# 2. 啟動開發伺服器
cd admin-platform-vue
npm run dev
```

**注意**:
- Supabase CLI 會自動生成 JWT keys，不需手動配置
- ANON_KEY 可從 `supabase status` 取得
- 所有 migrations 和 seeds 會自動執行

### 生產環境設定

#### 步驟 1: Supabase 配置
```bash
# 1. 複製並編輯 supabase/.env
cd supabase
cp .env.example .env

# 2. **重要**: 修改所有安全性相關設定
# ⚠️ 必須更改的設定：
# - POSTGRES_PASSWORD (使用強密碼，至少 32 字元)
# - JWT_SECRET (使用隨機生成的 64+ 字元)
# - DASHBOARD_PASSWORD (Supabase Studio 密碼)
# - VAULT_ENC_KEY (加密金鑰，至少 32 字元)
# - ENABLE_EMAIL_AUTOCONFIRM=false (生產環境應禁用)

# 3. 設定正確的 URL
# - API_EXTERNAL_URL (對外的 API URL)
# - SITE_URL (前端應用 URL)

# 4. 配置 SMTP (如需 Email 驗證)
# - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
```

#### 步驟 2: 前端配置
```bash
# 1. 複製並編輯 .env.production
cp .env.example .env.production

# 2. 設定生產環境 URL
# VITE_SUPABASE_URL (Supabase API URL)
# VITE_SUPABASE_ANON_KEY (從 supabase/.env 複製 ANON_KEY)
# VITE_BASE_URL (前端應用 URL)
```

#### 步驟 3: 部署
```bash
# 使用 prod.sh 腳本自動化部署
./scripts/prod.sh up
```

## 🔐 安全性注意事項

### 必須更改的預設值

生產環境部署前，**必須**更改以下預設值：

```bash
# supabase/.env
POSTGRES_PASSWORD=your-strong-password-at-least-32-characters
JWT_SECRET=your-random-jwt-secret-at-least-64-characters
DASHBOARD_PASSWORD=your-dashboard-password
VAULT_ENC_KEY=your-encryption-key-32-chars-min
SECRET_KEY_BASE=your-secret-key-base

# OAuth 憑證 (如使用)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-actual-client-id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your-actual-client-secret
```

### 金鑰生成建議

```bash
# 生成隨機密碼 (64 字元)
openssl rand -base64 48

# 生成 JWT Secret (建議使用 HS256)
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### .gitignore 配置

確保以下檔案已加入 `.gitignore`：

```gitignore
# 根目錄
.env.local
.env.production
.env.development

# Supabase
supabase/.env
supabase/.env.local
supabase/volumes/

# 前端專案
admin-platform-vue/.env.local
front-stage-vue/.env.local
```

## 🔄 部署方式對照

| 部署方式 | 配置檔 | Port | 用途 |
|---------|--------|------|------|
| **Supabase CLI** | `supabase/config.toml` | 54321 (API), 54322 (DB) | 本地開發（推薦） |
| **Docker Compose Self-Host** | 官方 `docker-compose.yml` + `.env` | 8000 (API), 5432 (DB) | 生產環境（雲端伺服器） |

### Supabase CLI vs Docker Compose

#### Supabase CLI (`supabase start`) - 本地開發
- **配置**: `supabase/config.toml`
- **優點**:
  - 一鍵啟動，自動配置所有服務
  - 內建 migrations 和 seeds 自動執行
  - JWT keys 自動生成
  - 開發體驗最佳
- **缺點**:
  - 僅適合本地開發
  - 無法用於生產環境
- **Database Port**: 54322
- **API Port**: 54321
- **Studio Port**: 54323

#### Docker Compose Self-Host - 生產部署
- **配置**: 官方 `docker-compose.yml` + `.env`（在雲端伺服器上）
- **優點**:
  - 完全控制所有配置
  - 生產環境就緒
  - 可自訂所有環境變數
  - 適合雲端部署
- **缺點**:
  - 需要手動配置環境變數
  - Migrations 需使用 `supabase db push` 手動執行
- **Database Port**: 5432 (內部，不對外開放)
- **API Port**: 8000 (對外，通過 Kong)
- **部署位置**: 雲端伺服器，不在專案 repo 中

## 環境變數對照表

### Supabase 相關

| 變數名稱 | 本地開發（CLI） | 生產環境（Docker Compose） | 前端 .env.local | 說明 |
|---------|---------------|------------------------|----------------|------|
| `POSTGRES_PASSWORD` | 自動生成 | ✅ 手動配置 | - | PostgreSQL 資料庫密碼 |
| `JWT_SECRET` | 自動生成 | ✅ 手動配置 | - | JWT 簽名金鑰 |
| `ANON_KEY` | 自動生成 | ✅ 手動配置 | 對應 `VITE_SUPABASE_ANON_KEY` | 匿名訪問金鑰 |
| `SERVICE_ROLE_KEY` | 自動生成 | ✅ 手動配置 | - | 服務角色金鑰 (伺服器端) |
| `API URL` | http://localhost:54321 | 雲端伺服器 URL | 對應 `VITE_SUPABASE_URL` | Supabase API URL |
| `SITE_URL` | http://localhost:5173 | 雲端前端 URL | 對應 `VITE_BASE_URL` | 前端應用 URL |

**說明**:
- **本地開發**: 使用 `supabase start`，所有配置自動生成
- **生產環境**: 在雲端伺服器上手動配置 Docker Compose 的 `.env` 檔案

### 認證相關

| 變數名稱 | 用途 | 開發環境 | 生產環境 |
|---------|------|----------|----------|
| `ENABLE_EMAIL_AUTOCONFIRM` | Email 自動確認 | `true` | `false` |
| `ENABLE_EMAIL_SIGNUP` | 啟用 Email 註冊 | `true` | `true` |
| `DISABLE_SIGNUP` | 禁用新用戶註冊 | `false` | 視需求 |
| `JWT_EXPIRY` | JWT Token 有效期 (秒) | 3600 | 視需求 |

### OAuth 提供商

| 變數名稱 | 用途 | 設定位置 |
|---------|------|----------|
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `supabase/.env` |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Google OAuth Secret | `supabase/.env` |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED` | 啟用 Google OAuth | `supabase/.env` |

## 快速參考

### 本地開發啟動

```bash
# 1. 啟動 Supabase CLI
cd supabase
supabase start

# 2. 初始化資料庫（執行所有 migrations + seeds）
supabase db reset

# 3. 啟動前端
cd ../admin-platform-vue
npm run dev
```

**簡化說明**:
- 不需要手動執行 migrations，`supabase db reset` 自動處理
- 不需要手動配置環境變數，CLI 自動生成
- 一切都是自動化的

### 生產環境部署

#### 步驟 1: 在雲端伺服器部署 Supabase

```bash
# 1. 下載官方 Supabase Docker 配置
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# 2. 配置環境變數
cp .env.example .env
nano .env  # 編輯所有必要配置

# 3. 啟動 Supabase 服務
docker compose up -d

# 4. 應用專案 migrations
cd /path/to/ecommerce-dashboard
supabase db push --db-url="postgresql://postgres:PASSWORD@SERVER_IP:5432/postgres"
```

#### 步驟 2: 部署前端應用和文件服務

```bash
# 1. Clone 專案 repository
git clone https://github.com/your-org/ecommerce-dashboard
cd ecommerce-dashboard

# 2. 配置前端環境變數
cp .env.example .env.production
nano .env.production
# 設定:
# - VITE_SUPABASE_URL=https://api.your-domain.com（或 http://SERVER_IP:8000）
# - VITE_SUPABASE_ANON_KEY=從雲端 Supabase 取得
# - VITE_BASE_URL=https://your-domain.com
# - SITE_URL=https://your-domain.com

# 3. 啟動前端和文件服務
docker compose -f docker-compose.prod.yml up -d
# 或使用腳本
./scripts/prod.sh up
```

**注意**:
- Supabase 和前端應用分別部署
- 前端通過 VITE_SUPABASE_URL 環境變數連接 Supabase（HTTP 連線）
- 不需要 Docker 網路連接

詳細生產部署步驟請參考：[雲端部署檢查清單](../../../CLOUD_DEPLOYMENT_CHECKLIST.md)

### 環境變數檢查清單

#### 本地開發

- [ ] 已安裝 Supabase CLI
- [ ] `admin-platform-vue/.env.local` 配置正確（port 54321）
- [ ] `front-stage-vue/.env.local` 配置正確（port 54321）
- [ ] ANON_KEY 從 `supabase status` 正確取得

#### 生產部署

- [ ] 雲端伺服器上已安裝 Docker 和 Docker Compose
- [ ] 官方 Supabase 配置已下載到伺服器
- [ ] `supabase/.env` 已配置所有必要變數
- [ ] 所有密碼和金鑰已更新為強隨機值
- [ ] `ENABLE_EMAIL_AUTOCONFIRM` 設為 `false`
- [ ] `SITE_URL` 和 `API_EXTERNAL_URL` 設定為正確的生產 URL
- [ ] OAuth 憑證已設定 (如需使用)
- [ ] SMTP 配置已設定 (如需 Email 驗證)
- [ ] 防火牆已配置（開放 80, 443）
- [ ] SSL 證書已配置
- [ ] 專案 migrations 已使用 `supabase db push` 執行

## 相關文檔

- [Docker 部署指南](./docker-deployment.md)
- [雲端部署檢查清單](../../../CLOUD_DEPLOYMENT_CHECKLIST.md)
- [Supabase 官方 Self-Hosting 文檔](https://supabase.com/docs/guides/self-hosting/docker)

## 🔄 更新歷史

- **2025-10-04**:
  - 🚀 **重大架構簡化**: 本地開發完全改用 Supabase CLI
  - 刪除所有本地 Docker Compose 相關配置（`supabase/.env`, `docker-compose.yml`, `docker-compose.prod.yml`, `scripts/prod.sh`）
  - 更新 `admin-platform-vue/.env.local` 和 `front-stage-vue/.env.local` 為 CLI 配置（port 54321）
  - 明確分離：本地開發使用 CLI，生產環境使用雲端伺服器上的 Docker Compose
  - 大幅簡化開發流程：`supabase start` → `supabase db reset` → `npm run dev`
  - 更新所有文檔反映新架構

- **2025-10-03**:
  - 刪除重複的 `.env.supabase` 和 `.env.supabase.example`
  - 整合 `supabase/.env.local` 的 OAuth 憑證到主配置檔
  - 刪除 `admin-platform-react/.env.local` (skeleton project)
  - 更新 `front-stage-vue/.env.local` 為 Self-Host 配置
  - 創建本環境變數完整指南
