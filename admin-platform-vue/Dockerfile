# =========================================
# 電商管理平台 - 生產環境 Dockerfile
# =========================================
# 多階段建置：Build Stage + Nginx Runtime Stage
# 支援 Vue Router history mode

# =========================================
# [[ BUILD STAGE ]]
# =========================================
FROM node:20-alpine AS build

# 設定工作目錄
WORKDIR /app

# 複製 package 檔案（優化 Docker 快取層）
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production=false

# 設置環境變數為 production（Vite 需要此環境變數才會讀取 .env.production）
ENV NODE_ENV=production

# 複製專案檔案（包含 .env.production）
COPY . .

# 診斷：輸出環境變數和檔案內容（除錯用）
RUN echo "=== Docker Build Diagnostics ===" && \
    echo "1. Current NODE_ENV: $NODE_ENV" && \
    echo "2. Environment Variables (VITE_*):" && \
    env | grep VITE || echo "   No VITE_ environment variables found in ENV" && \
    echo "3. .env.production file content:" && \
    cat .env.production 2>/dev/null || echo "   .env.production not found!" && \
    echo "4. All .env files in directory:" && \
    ls -la | grep "\.env" || echo "   No .env files found" && \
    echo "==================================="

# 建置生產版本（Vite 會讀取 .env.production，因為 NODE_ENV=production）
RUN npm run build && \
    echo "Build completed. Checking if env vars were embedded..." && \
    grep -r "orqawopqwqmxyxlixqfv" dist/assets/*.js | head -1 && echo "✅ Supabase URL found in built files" || echo "❌ Supabase URL NOT found in built files"

# =========================================
# [[ RUNTIME STAGE ]]
# =========================================
FROM nginx:alpine

# 複製建置產物到 nginx 目錄
COPY --from=build /app/dist /usr/share/nginx/html

# 複製 Nginx 配置模板（使用 envsubst 替換變數）
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# 複製啟動腳本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 開放端口（Cloud Run 會通過 PORT 環境變數動態分配）
EXPOSE 8080

# 使用啟動腳本（Cloud Run 會自動處理健康檢查）
ENTRYPOINT ["/docker-entrypoint.sh"]