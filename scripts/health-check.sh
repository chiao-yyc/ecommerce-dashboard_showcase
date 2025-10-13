#!/bin/bash

# =========================================
# 電商管理平台 - 健康檢查工具
# =========================================
# 使用方式: ./scripts/health-check.sh [dev|prod]

set -e  # 遇到錯誤立即退出

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 環境參數
ENV="${1:-dev}"

# =========================================
# 配置
# =========================================
if [ "$ENV" == "prod" ]; then
    FRONTEND_URL="http://localhost:8080"
    HEALTH_ENDPOINT="$FRONTEND_URL/health"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    FRONTEND_URL="http://localhost:5173"
    HEALTH_ENDPOINT="$FRONTEND_URL"
    COMPOSE_FILE="docker-compose.dev.yml"
fi

DOCS_URL="http://localhost:8081"
SUPABASE_API_URL="http://localhost:54321"
SUPABASE_STUDIO_URL="http://localhost:54323"

# =========================================
# 檢查工具
# =========================================
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  電商管理平台 - 健康檢查工具 (${ENV})${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# =========================================
# 1. Docker 容器狀態
# =========================================
echo -e "${YELLOW}📦 檢查 Docker 容器狀態...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose -f "$COMPOSE_FILE" ps
    echo ""
else
    echo -e "${RED}❌ docker-compose 未安裝${NC}"
fi

# =========================================
# 2. 前端應用健康檢查
# =========================================
echo -e "${YELLOW}🌐 檢查前端應用...${NC}"
if [ "$ENV" == "prod" ]; then
    # 生產環境檢查 /health 端點
    if curl -f -s "$HEALTH_ENDPOINT" > /dev/null; then
        echo -e "${GREEN}✅ 前端應用 ($FRONTEND_URL): 健康${NC}"
        echo -e "   Health endpoint: $HEALTH_ENDPOINT"
    else
        echo -e "${RED}❌ 前端應用 ($FRONTEND_URL): 不健康${NC}"
    fi
else
    # 開發環境檢查首頁
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        echo -e "${GREEN}✅ 前端應用 ($FRONTEND_URL): 運行中${NC}"
    else
        echo -e "${RED}❌ 前端應用 ($FRONTEND_URL): 無法連線${NC}"
    fi
fi
echo ""

# =========================================
# 3. 文件服務檢查
# =========================================
echo -e "${YELLOW}📚 檢查文件服務...${NC}"
if curl -f -s "$DOCS_URL" > /dev/null; then
    echo -e "${GREEN}✅ 文件服務 ($DOCS_URL): 運行中${NC}"
else
    echo -e "${RED}❌ 文件服務 ($DOCS_URL): 無法連線${NC}"
fi
echo ""

# =========================================
# 4. Supabase 服務檢查
# =========================================
echo -e "${YELLOW}🗄️  檢查 Supabase 服務...${NC}"

if [ "$ENV" == "dev" ]; then
    # 開發環境：檢查 Supabase CLI
    # API Gateway
    if curl -f -s "$SUPABASE_API_URL" > /dev/null; then
        echo -e "${GREEN}✅ Supabase API ($SUPABASE_API_URL): 運行中${NC}"
    else
        echo -e "${RED}❌ Supabase API ($SUPABASE_API_URL): 無法連線${NC}"
        echo -e "${YELLOW}   請執行: supabase start${NC}"
    fi

    # Studio
    if curl -f -s "$SUPABASE_STUDIO_URL" > /dev/null; then
        echo -e "${GREEN}✅ Supabase Studio ($SUPABASE_STUDIO_URL): 運行中${NC}"
    else
        echo -e "${RED}❌ Supabase Studio ($SUPABASE_STUDIO_URL): 無法連線${NC}"
    fi
else
    # 生產環境：檢查 Supabase Self-Host
    # Kong API Gateway
    if curl -f -s "http://localhost:8000" > /dev/null; then
        echo -e "${GREEN}✅ Supabase Kong (http://localhost:8000): 運行中${NC}"
    else
        echo -e "${RED}❌ Supabase Kong (http://localhost:8000): 無法連線${NC}"
        echo -e "${YELLOW}   請執行: ./scripts/prod.sh supabase-up${NC}"
    fi

    # Studio
    if curl -f -s "http://localhost:3000" > /dev/null; then
        echo -e "${GREEN}✅ Supabase Studio (http://localhost:3000): 運行中${NC}"
    else
        echo -e "${RED}❌ Supabase Studio (http://localhost:3000): 無法連線${NC}"
    fi

    # PostgreSQL
    if docker ps | grep -q "supabase-db"; then
        echo -e "${GREEN}✅ PostgreSQL: 容器運行中${NC}"
    else
        echo -e "${RED}❌ PostgreSQL: 容器未運行${NC}"
    fi
fi
echo ""

# =========================================
# 5. Docker 網路檢查（開發環境）
# =========================================
if [ "$ENV" == "dev" ]; then
    echo -e "${YELLOW}🔗 檢查 Docker 網路...${NC}"
    if docker network ls | grep -q "supabase_network_ecommerce-dashboard"; then
        echo -e "${GREEN}✅ Supabase Docker 網路: 存在${NC}"
    else
        echo -e "${RED}❌ Supabase Docker 網路: 不存在${NC}"
        echo -e "${YELLOW}   請執行: supabase start${NC}"
    fi
    echo ""
fi

# =========================================
# 總結
# =========================================
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  健康檢查完成${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "${YELLOW}💡 提示:${NC}"
if [ "$ENV" == "dev" ]; then
    echo -e "  - 啟動開發環境: ./scripts/dev.sh up"
    echo -e "  - 查看日誌: ./scripts/dev.sh logs"
    echo -e "  - 停止服務: ./scripts/dev.sh down"
else
    echo -e "  - 啟動生產環境: ./scripts/prod.sh up"
    echo -e "  - 查看日誌: ./scripts/prod.sh logs"
    echo -e "  - 停止服務: ./scripts/prod.sh down"
fi
