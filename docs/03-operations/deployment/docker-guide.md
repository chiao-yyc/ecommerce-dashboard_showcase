# Docker Guide 🐳

> 📝 **最後更新**: 2025-10-07 (文檔健檢修復 - 對齊實際配置)
>
> 多階段建置，統一本地／雲端環境

## 目錄

1. 映像說明
2. Multi‑Stage Dockerfile (實際配置)
3. docker‑compose (本地)
4. 常用指令

---

## 1. 映像說明

| 服務          | 目的                 | 映像來源                         | 實際位置 |
|---------------|----------------------|----------------------------------|----------|
| `admin-vue`   | Vue 3 SPA + Nginx    | `node:20-alpine` → `nginx:alpine`| `admin-platform-vue/Dockerfile` |
| `docs`        | VitePress 文檔站     | `node:20-alpine` → `nginx:alpine`| `Dockerfile.docs.prod` |
| `postgres`    | 本地資料庫 (Supabase)| `supabase/postgres:15`           | Docker Compose |

---

## 2. Multi‑Stage Dockerfile（admin-vue 前端）

**檔案位置**: `admin-platform-vue/Dockerfile`

```dockerfile
# =========================================
# [[ BUILD STAGE ]]
# =========================================
FROM node:20-alpine AS build

WORKDIR /app

# 複製 package 檔案（優化 Docker 快取層）
COPY package*.json ./

# 安裝依賴（使用 npm ci）
RUN npm ci --only=production=false

# 設置環境變數為 production
ENV NODE_ENV=production

# 複製專案檔案（包含 .env.production）
COPY . .

# 建置生產版本（Vite 會讀取 .env.production）
RUN npm run build

# =========================================
# [[ RUNTIME STAGE ]]
# =========================================
FROM nginx:alpine

# 複製建置產物到 nginx 目錄
COPY --from=build /app/dist /usr/share/nginx/html

# 複製 Nginx 配置模板
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# 複製啟動腳本（支援動態 PORT）
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 開放端口（Cloud Run 動態分配）
EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]
```

**關鍵特性**:
- ✅ 使用 `npm` (非 pnpm)
- ✅ 支援 `.env.production` 自動讀取
- ✅ 動態 PORT 支援 (Cloud Run)
- ✅ Vue Router history mode 支援

---

## 3. docker‑compose.yml（dev 用）

**檔案位置**: `docker-compose.prod.yml`

```yaml
version: "3.9"
services:
  admin-vue:
    build:
      context: ./admin-platform-vue
      dockerfile: Dockerfile
    ports: ["8080:8080"]
    environment:
      PORT: 8080
      NODE_ENV: production

  docs:
    build:
      context: .
      dockerfile: Dockerfile.docs.prod
    ports: ["8081:8080"]
    environment:
      PORT: 8080
```

---

## 4. 常用指令

```bash
# 建置與執行
docker compose up --build -d

# 查看 log
docker compose logs -f frontend

# 刪除所有容器
docker compose down -v
```
