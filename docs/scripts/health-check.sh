#!/bin/bash
# 文檔健檢工具 v1.0
# 用途: 自動化檢查文檔與代碼的一致性
# 執行: ./docs/scripts/health-check.sh

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         📋 文檔健檢工具 v1.0                        ║${NC}"
echo -e "${BLUE}║         Document Health Check Utility               ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# 檢查是否在專案根目錄
if [ ! -d "docs" ] || [ ! -d "admin-platform-vue" ]; then
  echo -e "${RED}❌ 錯誤: 請在專案根目錄執行此腳本${NC}"
  exit 1
fi

# ==========================================
# 1. 文檔統計
# ==========================================
echo -e "${GREEN}📊 文檔統計分析${NC}"
echo "----------------------------------------"

total_docs=$(find docs -name '*.md' -type f | wc -l | xargs)
dev_notes=$(find docs/04-guides/dev-notes -name '*.md' -type f 2>/dev/null | wc -l | xargs)
planning=$(find docs/01-planning -name '*.md' -type f 2>/dev/null | wc -l | xargs)
development=$(find docs/02-development -name '*.md' -type f 2>/dev/null | wc -l | xargs)
operations=$(find docs/03-operations -name '*.md' -type f 2>/dev/null | wc -l | xargs)
guides=$(find docs/04-guides -name '*.md' -type f 2>/dev/null | wc -l | xargs)
reference=$(find docs/05-reference -name '*.md' -type f 2>/dev/null | wc -l | xargs)

echo -e "總文檔數: ${YELLOW}$total_docs${NC} 個"
echo -e "  ├─ 01-planning:    ${YELLOW}$planning${NC} 個"
echo -e "  ├─ 02-development: ${YELLOW}$development${NC} 個"
echo -e "  ├─ 03-operations:  ${YELLOW}$operations${NC} 個"
echo -e "  ├─ 04-guides:      ${YELLOW}$guides${NC} 個"
echo -e "  │   └─ dev-notes:  ${YELLOW}$dev_notes${NC} 個"
echo -e "  └─ 05-reference:   ${YELLOW}$reference${NC} 個"
echo ""

# ==========================================
# 2. 組件數量一致性檢查
# ==========================================
echo -e "${GREEN}🔍 組件地圖一致性檢查${NC}"
echo "----------------------------------------"

actual_components=$(find admin-platform-vue/src/components -name "*.vue" -type f 2>/dev/null | wc -l | xargs)
echo -e "實際組件數: ${YELLOW}$actual_components${NC} 個"

component_map_file="docs/02-development/architecture/component-map.md"
if [ -f "$component_map_file" ]; then
  documented_components=$(grep -o "[0-9]\+ 個組件\|[0-9]\+ components" "$component_map_file" 2>/dev/null | head -1 | grep -o "[0-9]\+")
  if [ -n "$documented_components" ]; then
    echo -e "文檔記錄數: ${YELLOW}$documented_components${NC} 個"
    if [ "$actual_components" != "$documented_components" ]; then
      echo -e "${RED}⚠️  警告: 組件數量不一致！${NC}"
      echo -e "   請更新: ${BLUE}$component_map_file${NC}"
    else
      echo -e "${GREEN}✅ 組件地圖已同步${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  無法從文檔中提取組件數量，請手動核對${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  找不到組件地圖文檔${NC}"
fi
echo ""

# ==========================================
# 3. 最近未更新的文檔
# ==========================================
echo -e "${GREEN}⏰ 長期未更新的文檔 (90天+)${NC}"
echo "----------------------------------------"

old_docs=$(find docs/02-development/architecture docs/02-development/api docs/03-operations/deployment \
  -name "*.md" -type f -mtime +90 2>/dev/null)

if [ -z "$old_docs" ]; then
  echo -e "${GREEN}✅ 所有核心文檔都在 90 天內更新過${NC}"
else
  echo -e "${YELLOW}以下文檔超過 90 天未更新:${NC}"
  echo "$old_docs" | while read -r file; do
    last_modified=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1)
    echo -e "  - ${BLUE}$file${NC} (${last_modified})"
  done
fi
echo ""

# ==========================================
# 4. React 相關內容檢查
# ==========================================
echo -e "${GREEN}🔖 React 相關文檔檢查${NC}"
echo "----------------------------------------"

react_docs=$(grep -rl "React\|react" docs/ --include="*.md" 2>/dev/null | wc -l | xargs)
echo -e "包含 React 的文檔: ${YELLOW}$react_docs${NC} 個"

if [ "$react_docs" -gt 0 ]; then
  echo -e "${YELLOW}建議檢查這些文檔是否需要標記為「歷史參考」:${NC}"
  grep -rl "React" docs/ --include="*.md" 2>/dev/null | head -5 | while read -r file; do
    echo -e "  - ${BLUE}$file${NC}"
  done
  if [ "$react_docs" -gt 5 ]; then
    echo -e "  ... 還有 $((react_docs - 5)) 個文檔"
  fi
fi
echo ""

# ==========================================
# 5. 重複部署文檔檢查
# ==========================================
echo -e "${GREEN}📂 重複部署文檔檢查${NC}"
echo "----------------------------------------"

if [ -d "docs/deployment" ]; then
  deployment_root=$(find docs/deployment -name "*.md" -type f 2>/dev/null | wc -l | xargs)
  deployment_ops=$(find docs/03-operations/deployment -name "*.md" -type f 2>/dev/null | wc -l | xargs)
  echo -e "${YELLOW}⚠️  發現潛在重複:${NC}"
  echo -e "  - docs/deployment/: ${YELLOW}$deployment_root${NC} 個"
  echo -e "  - docs/03-operations/deployment/: ${YELLOW}$deployment_ops${NC} 個"
  echo -e "${YELLOW}  建議檢查並合併重複內容${NC}"
else
  echo -e "${GREEN}✅ 無重複部署文檔目錄${NC}"
fi
echo ""

# ==========================================
# 6. VitePress 失效連結檢查
# ==========================================
echo -e "${GREEN}🔗 VitePress 失效連結檢查${NC}"
echo "----------------------------------------"
echo "執行 VitePress build 檢查..."

build_output=$(npm run docs:build 2>&1)
dead_links=$(echo "$build_output" | grep -E "dead link|Found dead" || echo "")

if [ -z "$dead_links" ]; then
  echo -e "${GREEN}✅ 無失效連結${NC}"
else
  echo -e "${RED}❌ 發現失效連結:${NC}"
  echo "$dead_links" | sed 's/^/  /'
fi
echo ""

# ==========================================
# 7. 最近新增的 dev-notes
# ==========================================
echo -e "${GREEN}📝 最近 30 天新增的 dev-notes${NC}"
echo "----------------------------------------"

recent_notes=$(find docs/04-guides/dev-notes -name "*.md" -type f -mtime -30 2>/dev/null)

if [ -z "$recent_notes" ]; then
  echo -e "${YELLOW}⚠️  最近 30 天無新增 dev-notes${NC}"
else
  echo "$recent_notes" | while read -r file; do
    created=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1)
    echo -e "  - ${BLUE}$(basename "$file")${NC} (${created})"
  done
fi
echo ""

# ==========================================
# 8. 健檢總結
# ==========================================
echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  📋 健檢總結                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "總文檔數: ${YELLOW}$total_docs${NC} 個"
echo -e "dev-notes: ${YELLOW}$dev_notes${NC} 個"
echo ""
echo -e "${GREEN}建議後續動作:${NC}"
echo "  1. 檢查並更新長期未修改的核心文檔"
echo "  2. 核對組件地圖與實際組件數"
echo "  3. 標記 React 相關文檔為「歷史參考」"
echo "  4. 處理 VitePress 失效連結"
echo ""
echo -e "${BLUE}詳細修復計畫請參考: docs/DOCUMENTATION_HEALTH_CHECK.md${NC}"
echo ""
echo -e "${GREEN}✅ 健檢完成！${NC}"
