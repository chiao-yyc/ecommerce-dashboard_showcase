#!/bin/bash

# =========================================
# 電商管理平台 - 生產環境啟動腳本
# =========================================
# 用途: 管理前端應用和文件服務的部署
# 注意: Supabase 應在雲端伺服器上獨立部署
#
# 使用方式: ./scripts/prod.sh [up|down|restart|logs|build|health]

set -e  # 遇到錯誤立即退出

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 專案根目錄
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# =========================================
# 檢查必要檔案
# =========================================
check_requirements() {
    echo -e "${YELLOW}🔍 檢查必要檔案...${NC}"

    # 檢查 docker-compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ 錯誤: docker-compose 未安裝${NC}"
        exit 1
    fi

    # 檢查環境變數檔案
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ 錯誤: .env.production 不存在${NC}"
        echo -e "${YELLOW}請從 .env.example 複製並填入生產環境變數${NC}"
        echo -e "${YELLOW}重要: 需設定 VITE_SUPABASE_URL 指向雲端 Supabase API${NC}"
        exit 1
    fi

    # 檢查 Supabase URL 是否已配置
    if ! grep -q "VITE_SUPABASE_URL=" .env.production || grep -q "VITE_SUPABASE_URL=$" .env.production; then
        echo -e "${YELLOW}⚠️  警告: .env.production 中的 VITE_SUPABASE_URL 未設定${NC}"
        echo -e "${YELLOW}請設定為雲端 Supabase API URL (例如: https://api.your-domain.com)${NC}"
        read -p "是否繼續？ (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    echo -e "${GREEN}✅ 檢查完成${NC}"
}

# =========================================
# 啟動服務（前端應用 + 文件服務）
# =========================================
start_services() {
    echo -e "${GREEN}🚀 啟動生產環境...${NC}"
    check_requirements

    echo -e "${YELLOW}🌐 啟動前端應用和文件服務...${NC}"
    docker-compose -f docker-compose.prod.yml up -d

    echo -e "${GREEN}✅ 生產環境已啟動${NC}"
    echo -e "${YELLOW}📋 服務列表:${NC}"
    echo -e "  - 前端應用: http://localhost:8080"
    echo -e "  - 文件服務: http://localhost:8081"
    echo -e "  - 健康檢查: http://localhost:8080/health"
    echo ""
    echo -e "${YELLOW}💡 提醒: Supabase 需在雲端伺服器上獨立部署${NC}"
    echo -e "${YELLOW}💡 查看日誌: ./scripts/prod.sh logs${NC}"
    echo -e "${YELLOW}💡 健康檢查: ./scripts/prod.sh health${NC}"
}

# =========================================
# 停止服務（前端應用 + 文件服務）
# =========================================
stop_services() {
    echo -e "${YELLOW}🛑 停止生產環境...${NC}"
    docker-compose -f docker-compose.prod.yml down
    echo -e "${GREEN}✅ 前端應用和文件服務已停止${NC}"
}

# =========================================
# 重啟服務
# =========================================
restart_services() {
    echo -e "${YELLOW}🔄 重啟生產環境...${NC}"
    stop_services
    start_services
}

# =========================================
# 查看日誌
# =========================================
view_logs() {
    docker-compose -f docker-compose.prod.yml logs -f
}

# =========================================
# 重新建置映像
# =========================================
rebuild() {
    echo -e "${YELLOW}🔨 重新建置 Docker 映像...${NC}"
    docker-compose -f docker-compose.prod.yml build --no-cache
    echo -e "${GREEN}✅ 建置完成${NC}"
}

# =========================================
# 健康檢查
# =========================================
health_check() {
    echo -e "${YELLOW}🏥 執行健康檢查...${NC}"

    # 檢查前端應用
    if curl -f -s http://localhost:8080/health > /dev/null; then
        echo -e "${GREEN}✅ 前端應用: 健康${NC}"
    else
        echo -e "${RED}❌ 前端應用: 不健康${NC}"
    fi

    # 檢查容器狀態
    echo -e "\n${YELLOW}📦 容器狀態:${NC}"
    docker-compose -f docker-compose.prod.yml ps
}

# =========================================
# 主要邏輯
# =========================================
case "${1:-up}" in
    up|start)
        start_services
        ;;
    down|stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs
        ;;
    build)
        rebuild
        ;;
    health)
        health_check
        ;;
    supabase-up|supabase-down)
        echo -e "${RED}❌ 錯誤: Supabase 相關指令已移除${NC}"
        echo -e "${YELLOW}💡 Supabase 應在雲端伺服器上獨立部署${NC}"
        echo -e "${YELLOW}💡 請參考: CLOUD_DEPLOYMENT_CHECKLIST.md${NC}"
        exit 1
        ;;
    *)
        echo "使用方式: $0 [up|down|restart|logs|build|health]"
        echo ""
        echo "指令說明:"
        echo "  up, start   - 啟動生產環境（前端應用 + 文件服務）（預設）"
        echo "  down, stop  - 停止生產環境"
        echo "  restart     - 重啟生產環境"
        echo "  logs        - 查看服務日誌"
        echo "  build       - 重新建置 Docker 映像"
        echo "  health      - 執行健康檢查"
        echo ""
        echo "注意: Supabase 需在雲端伺服器上獨立部署"
        echo "參考: CLOUD_DEPLOYMENT_CHECKLIST.md"
        exit 1
        ;;
esac
