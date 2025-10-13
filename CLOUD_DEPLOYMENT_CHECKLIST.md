# ☁️ 雲端部署快速檢查清單

## 📋 部署架構說明

**本地開發**: 使用 Supabase CLI (`supabase start`)
**生產環境**: 在雲端伺服器上使用 Docker Compose Self-Host

---

## 🚀 雲端部署步驟

### Step 1: 準備雲端伺服器

- [ ] 購買/準備雲端 VM (建議: 4 CPU, 8GB RAM+)
- [ ] 配置域名 DNS 記錄 (`A Record`: your-domain.com, api.your-domain.com → VM IP)
- [ ] 安裝 Docker 和 Docker Compose (`curl -fsSL https://get.docker.com | sh`)
- [ ] 開放防火牆端口: 80, 443

### Step 2: 下載 Supabase Docker Compose 配置

```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
```

### Step 3: 配置環境變數

```bash
cp .env.example .env
nano .env  # 編輯配置
```

**必須修改的配置** ⚠️：

```bash
# 密碼與金鑰（使用強隨機值）
POSTGRES_PASSWORD=<至少 32 字元的強密碼>
JWT_SECRET=<使用 openssl rand -base64 32 生成>
DASHBOARD_PASSWORD=<Supabase Studio 密碼>
VAULT_ENC_KEY=<至少 32 字元的加密金鑰>

# URL 配置（使用實際域名）
SUPABASE_PUBLIC_URL=https://api.your-domain.com
SITE_URL=https://your-domain.com
API_EXTERNAL_URL=https://api.your-domain.com

# Email 配置（如需 Email 驗證功能）
ENABLE_EMAIL_AUTOCONFIRM=false  # 生產環境應禁用
SMTP_HOST=<您的 SMTP 伺服器>
SMTP_PORT=587
SMTP_USER=<SMTP 使用者名稱>
SMTP_PASS=<SMTP 密碼>
SMTP_ADMIN_EMAIL=<管理員 Email>

# OAuth 配置（如使用）
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<Google OAuth Client ID>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<Google OAuth Secret>
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true
```

### Step 4: 生成 JWT Keys

使用新的 JWT_SECRET 重新生成 ANON_KEY 和 SERVICE_ROLE_KEY：

```bash
node <<'EOF'
const crypto = require('crypto');
const secret = 'YOUR_NEW_JWT_SECRET_HERE';  // 替換為您的 JWT_SECRET

function base64url(source) {
  let encodedSource = Buffer.from(source).toString('base64');
  encodedSource = encodedSource.replace(/=+$/, '');
  encodedSource = encodedSource.replace(/\+/g, '-');
  encodedSource = encodedSource.replace(/\//g, '_');
  return encodedSource;
}

function generateJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64');
  const encodedSignature = base64url(Buffer.from(signature, 'base64'));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

const anonPayload = { role: 'anon', iss: 'supabase', iat: Math.floor(Date.now()/1000), exp: 1900000000 };
const servicePayload = { role: 'service_role', iss: 'supabase', iat: Math.floor(Date.now()/1000), exp: 1900000000 };

console.log('ANON_KEY:', generateJWT(anonPayload));
console.log('SERVICE_ROLE_KEY:', generateJWT(servicePayload));
EOF
```

將生成的 keys 更新到 `.env` 檔案中。

### Step 5: 啟動 Supabase 服務

```bash
docker compose up -d      # 啟動所有服務
docker compose ps         # 檢查狀態
docker compose logs -f    # 查看日誌（如有問題）
```

### Step 6: 配置 SSL（使用 Let's Encrypt）

```bash
apt-get update && apt-get install -y certbot
docker compose stop kong
certbot certonly --standalone -d api.your-domain.com
docker compose start kong
# 配置 Kong 使用 SSL（需修改 kong.yml，詳見 Supabase 官方文檔）
```

### Step 7: 應用專案 Migrations

```bash
git clone https://github.com/your-org/ecommerce-dashboard.git
cd ecommerce-dashboard
npm install -g supabase  # 如未安裝

# 應用 migrations（使用內部容器名稱 'db' 或 localhost:5432）
supabase db push --db-url="postgresql://postgres:PASSWORD@db:5432/postgres"
```

### Step 8: 部署前端應用和文件服務

```bash
# 1. Clone 專案並配置環境變數
git clone https://github.com/your-org/ecommerce-dashboard
cd ecommerce-dashboard
cp .env.example .env.production
nano .env.production  # 填入 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 等

# 2. 啟動服務（admin-vue:8080, docs:8081）
chmod +x scripts/prod.sh
./scripts/prod.sh up
```

**重要**: 前端通過 VITE_SUPABASE_URL 連接 Supabase（HTTP），與 Supabase 獨立部署

### Step 9: 驗證部署

```bash
curl https://api.your-domain.com/rest/v1/ -H "apikey: YOUR_ANON_KEY"  # API 連線
curl https://your-domain.com                                           # 前端訪問
docker compose exec db psql -U postgres -c "SELECT version();"         # 資料庫
```

---

## 🔒 安全性檢查清單

部署到雲端前，請確保：

- [ ] 所有測試密碼已更換為強隨機密碼
- [ ] JWT_SECRET 使用 `openssl rand -base64 32` 生成
- [ ] ANON_KEY 和 SERVICE_ROLE_KEY 使用新的 JWT_SECRET 重新生成
- [ ] 防火牆已配置，只開放必要端口 (80, 443)
- [ ] 資料庫端口 (5432) 不對外開放
- [ ] HTTPS/SSL 證書已正確配置
- [ ] 定期備份策略已建立 (volumes/db/data/)
- [ ] 日誌監控已設定
- [ ] `.env` 檔案權限設為 600 (僅 owner 可讀寫)
- [ ] ENABLE_EMAIL_AUTOCONFIRM 在生產環境設為 `false`

---

## 📊 資源需求建議

### 最小配置（測試/小型專案）
- CPU: 2 vCPU
- RAM: 4 GB
- Storage: 20 GB SSD
- 適合: < 1000 用戶, < 10 GB 資料

### 推薦配置（中型專案）
- CPU: 4 vCPU
- RAM: 8 GB
- Storage: 50 GB SSD
- 適合: < 10000 用戶, < 50 GB 資料

### 高負載配置（大型專案）
- CPU: 8+ vCPU
- RAM: 16+ GB
- Storage: 100+ GB SSD
- 適合: 10000+ 用戶, 50+ GB 資料
- 建議: 資料庫獨立伺服器

---

## 🛠️ 快速命令參考

```bash
docker compose ps                           # 查看服務狀態
docker compose logs -f [service_name]      # 查看日誌
docker compose restart [service_name]      # 重啟服務
docker compose down                        # 停止所有服務
docker compose exec db pg_dump -U postgres postgres > backup.sql  # 備份
cat backup.sql | docker compose exec -T db psql -U postgres       # 恢復
docker stats                               # 資源使用
```

---

## 🆘 常見問題

### Q: 服務啟動失敗？
查看日誌：`docker compose logs [failed_service]`
常見原因：環境變數錯誤、端口佔用、磁碟不足、資料庫初始化失敗

### Q: 如何更新 Supabase？
```bash
docker compose exec db pg_dump -U postgres postgres > backup.sql
docker compose down && git pull && docker compose pull && docker compose up -d
```

### Q: 如何更新 Migrations？
```bash
cd ecommerce-dashboard && git pull
supabase db push --db-url="postgresql://postgres:PASSWORD@localhost:5432/postgres"
```

### Q: 如何水平擴展？
使用 Kubernetes 或 Docker Swarm，參考：https://supabase.com/docs/guides/self-hosting/docker#scaling

---

## 📚 參考資源

- [Supabase Self-Hosting 官方文檔](https://supabase.com/docs/guides/self-hosting/docker)
- [Docker Compose 生產環境最佳實踐](https://docs.docker.com/compose/production/)
- [專案 Supabase 本地開發指南](./supabase/README.md)

---

## 📝 部署時間估計

**總計: 約 110 分鐘** (伺服器準備 30min + Docker 配置 20min + SSL 15min + Migrations 10min + 前端 20min + 驗證 15min)
