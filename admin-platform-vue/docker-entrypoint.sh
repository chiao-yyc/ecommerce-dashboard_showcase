#!/bin/sh
# =========================================
# Docker Entrypoint Script
# =========================================
# 使用 envsubst 動態配置 Nginx 端口以支援 Cloud Run
# Cloud Run 通過 PORT 環境變數提供端口（默認 8080）

set -e

# 取得 PORT 環境變數，如果未設置則使用 8080
export PORT=${PORT:-8080}

echo "========================================="
echo "Starting Nginx configuration with envsubst..."
echo "Target PORT: $PORT"
echo "========================================="

# 使用 envsubst 替換模板中的 ${PORT} 變數
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# 顯示生成的配置（僅顯示 listen 行）
echo "Generated Nginx configuration:"
grep "listen" /etc/nginx/conf.d/default.conf || true

# 測試 Nginx 配置
echo "Testing Nginx configuration..."
nginx -t

echo "Starting Nginx on port $PORT..."
echo "========================================="

# 啟動 Nginx
exec nginx -g 'daemon off;'
