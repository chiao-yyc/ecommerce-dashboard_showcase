# 📋 文檔健檢與維護計畫

> **最後更新**: 2025-10-07
> **文檔版本**: v1.0
> **健檢範圍**: docs/ 目錄全部 219 個 Markdown 檔案

---

## 一、文檔現況統計

### 1.1 整體規模
- **總檔案數**: 219 個 Markdown 檔案
- **目錄總數**: 100 個目錄
- **文檔架構**: 5 層標準化架構 (01-planning ~ 05-reference)

### 1.2 分層架構分布

| 層級 | 目錄名稱 | 檔案數 | 主要內容 | 更新頻率 |
|------|----------|--------|----------|----------|
| **第一層** | 01-planning | 11 | 產品需求、專案規劃、技術對比 | 低 (規劃階段完成後較少更新) |
| **第二層** | 02-development | 75 | 架構設計、API 文檔、組件說明 | 中 (功能變更時需更新) |
| **第三層** | 03-operations | 20 | 部署指南、運維流程、監控設定 | 低 (基礎設施穩定後較少變更) |
| **第四層** | 04-guides | 85 | 開發筆記、使用指南、測試工具 | 高 (持續累積開發經驗) |
| **第五層** | 05-reference | 17 | 標準規範、AI 協作、最佳實踐 | 低 (標準建立後相對穩定) |

### 1.3 特殊目錄

| 目錄 | 檔案數 | 用途 | 維護狀態 |
|------|--------|------|----------|
| `04-guides/dev-notes/` | 62 | 開發歷程記錄、問題修復、優化報告 | ✅ 活躍 |
| `future-features/` | 7 | 未來功能備份 (毛利分析、需求預測等) | 🔒 封存 |
| `deployment/` (根目錄) | 未統計 | 遺留部署文檔 | ⚠️ 需檢查是否與 03-operations 重複 |

---

## 📂 二、文檔分類與定位

### 2.1 分類標準

根據文檔用途和時效性，分為三大類型：

#### 🔵 Type A: 現況說明文檔 (Living Documentation)
**定義**: 描述系統當前狀態、架構設計、使用方式的文檔
**特徵**:
- 需與代碼保持同步
- 過時會直接影響開發工作
- 有明確的更新責任

**範例**:
- API 文檔 (`02-development/api/`)
- 架構設計 (`02-development/architecture/`)
- 資料庫 Schema (`02-development/database/`)
- 使用指南 (`04-guides/user-guide/`)
- 部署文檔 (`03-operations/deployment/`)

#### 🟡 Type B: 歷程記錄文檔 (Historical Documentation)
**定義**: 記錄開發過程、問題解決、優化歷程的文檔
**特徵**:
- 一次性記錄，不需持續更新
- 保留開發思路和決策過程
- 作為未來問題的參考

**範例**:
- 修復報告 (`DATA_TABLE_ACTIONS_FINAL_FIX.md`)
- 優化報告 (`ROUTER_SESSION_OPTIMIZATION_REPORT.md`)
- 問題解決記錄 (`HOLIDAY_EDITING_FIX.md`)
- 架構健檢 (`PROJECT_ARCHITECTURE_HEALTH_CHECK_REPORT.md`)

#### 🟢 Type C: 面試展示文檔 (Portfolio Documentation)
**定義**: 凸顯技術能力、思維方法、系統設計的精選文檔
**特徵**:
- 展現開發者的技術深度
- 系統性思考和方法論
- 量化成果和商業價值

**範例**:
- 方法論文檔 (`DOCUMENTATION_RESTRUCTURING_METHODOLOGY.md`)
- 架構設計 (`SERVICE_FACTORY_ARCHITECTURE.md`)
- 系統開發指南 (`MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md`)
- 效能優化 (`DASHBOARD_PERFORMANCE_OPTIMIZATION.md`)
- AI 系統架構 (`AI_PROVIDER_SYSTEM_ARCHITECTURE.md`)

### 2.2 完整分類清單

#### Type A - 現況說明文檔 (共 78 個)

**🎯 01-planning/ (5個)**
- `prd/*.md` (產品需求、用戶流程、成功指標)
- ⚠️ 排除: `react-appendix.md` (屬於 Type B 歷程記錄)

**🔧 02-development/ (45個)**
- `architecture/*.md` (系統架構、業務模組、路由設計)
- `api/*.md` (API 規格、通知系統)
- `database/*.md` (Schema、RLS、Supabase 集成)
- `components/*.md` (組件地圖、設計規範)
- `analytics/*.md` (分析系統架構)

**🚀 03-operations/ (15個)**
- `deployment/*.md` (部署指南、Docker、CI/CD)
- `database/*.md` (備份策略、維護指南)
- `monitoring/*.md` (監控設定、日誌管理)

**📖 04-guides/ (8個)**
- `user-guide/*.md` (用戶操作手冊)
- `testing-tools/*.md` (測試環境設定)
- `demo-tools/*.md` (Demo 工具使用)

**📋 05-reference/ (5個)**
- `standards/*.md` (編碼規範、錯誤處理標準)
- `ai-collaboration/*.md` (AI 協作指引)

#### Type B - 歷程記錄文檔 (共 62 個)

**主要位於 `04-guides/dev-notes/`**

**修復類 (FIX) - 14個**:
- `DATA_TABLE_ACTIONS_FINAL_FIX.md`
- `HOLIDAY_EDITING_FIX.md`
- `INVENTORY_LOGGING_SYSTEM_FIX.md`
- `NOTIFICATION_SYSTEM_TRIGGERS_FIX.md`
- `ORDER_NUMBER_DISPLAY_FIX.md`
- `insight-charts-fix.md`
- 等...

**優化報告類 (OPTIMIZATION/REPORT) - 12個**:
- `ROUTER_SESSION_OPTIMIZATION_REPORT.md`
- `DASHBOARD_PERFORMANCE_OPTIMIZATION.md`
- `SYNC_OPTIMIZATION.md`
- `THEME_PERFORMANCE_OPTIMIZATION_METHODOLOGY.md`
- `CSS_VARIABLES_CONVERSION_REPORT.md`
- 等...

**開發指南類 (GUIDE) - 18個**:
- `CAMPAIGN_ANALYTICS_DEVELOPMENT_GUIDE.md`
- `CUSTOMER_ANALYTICS_DEVELOPMENT_GUIDE.md`
- `SUPPORT_ANALYTICS_DEVELOPMENT_GUIDE.md`
- `MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md`
- `NOTIFICATION_SYSTEM_COMPLETE_GUIDE.md`
- 等...

**架構類 (ARCHITECTURE) - 10個**:
- `SERVICE_FACTORY_ARCHITECTURE.md`
- `AI_PROVIDER_SYSTEM_ARCHITECTURE.md`
- `AUTHENTICATION_INITIALIZATION_ARCHITECTURE.md`
- `TESTING_ARCHITECTURE.md`
- 等...

**其他歷程記錄 - 8個**:
- `COMPATIBILITY_ISSUES_AND_FIXES.md`
- `INFORMATION_ARCHITECTURE_AUDIT.md`
- `MOCK_SYSTEM_UNIFICATION_RESULTS.md`
- 等...

#### Type C - 面試展示文檔 (精選 15 個)

**🏆 技術架構設計**:
1. `SERVICE_FACTORY_ARCHITECTURE.md` - 展現設計模式和依賴注入理解
2. `AI_PROVIDER_SYSTEM_ARCHITECTURE.md` - 多供應商整合架構
3. `campaign-system.md` - 完整的業務系統設計
4. `AUTHENTICATION_INITIALIZATION_ARCHITECTURE.md` - 認證流程設計

**📊 效能優化成果**:
5. `ROUTER_SESSION_OPTIMIZATION_REPORT.md` - 3秒→500ms，83%提升
6. `DASHBOARD_PERFORMANCE_OPTIMIZATION.md` - 量化效能優化
7. `THEME_PERFORMANCE_OPTIMIZATION_METHODOLOGY.md` - 系統化優化方法論

**🛠️ 開發方法論**:
8. `DOCUMENTATION_RESTRUCTURING_METHODOLOGY.md` - 文檔重構方法論
9. `MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md` - 6階段標準開發流程
10. `TESTING_ARCHITECTURE.md` - 完整測試策略

**💡 技術決策與商業思維**:
11. `MOCK_ROI_ANALYSIS_METHODOLOGY.md` - ROI 量化分析能力
12. `ORDER_ANALYTICS_DEVELOPMENT_PHASES.md` - 階段性技術演進策略
13. `ZERO_EXPANSION_SERVICE_DESIGN_PHILOSOPHY.md` - 零擴展設計哲學

**🔧 問題解決能力**:
14. `DATA_TABLE_ACTIONS_FINAL_FIX.md` - 深度問題分析與修復
15. `NOTIFICATION_SYSTEM_TRIGGERS_FIX.md` - 完整系統修復過程

---

## 三、過時文檔識別

### 3.1 明確過時文檔 (需處理)

#### 🔴 高優先級 - 直接影響開發工作

| 檔案 | 過時原因 | 影響範圍 | 建議處理 |
|------|----------|----------|----------|
| `01-planning/react-appendix.md` | 專案已改用 Vue，React 僅作參考 | 新進開發者可能誤解技術棧 | 🏷️ 標記為「歷史參考」並移至附錄 |
| `02-development/components/*.md` (部分) | 組件地圖可能未更新 | API 參考可能錯誤 | ✅ 需與 src/components 核對 |
| `deployment/` (根目錄) | 與 03-operations/deployment 可能重複 | 部署流程不一致 | 🔍 檢查並合併或刪除 |

#### 🟡 中優先級 - 可能過時但不急迫

| 檔案 | 潛在問題 | 檢查方法 |
|------|----------|----------|
| `02-development/architecture/component-map.md` | 組件數量可能已變化 | 對比 git log 與實際組件數 |
| `03-operations/deployment/*.md` | Docker 配置可能已更新 | 對比 Dockerfile 實際內容 |
| `04-guides/testing-tools/*.md` | 測試工具可能有新版本 | 檢查 package.json 依賴版本 |

#### 🟢 低優先級 - 僅需標記

| 類型 | 範例 | 處理方式 |
|------|------|----------|
| 已移除功能的文檔 | `future-features/` 目錄 | ✅ 已正確封存 |
| 舊版 PR模擬D 文檔 | 產品需求可能與實際實現有差異 | 📝 加註「實際實現可能有差異，以代碼為準」 |

### 3.2 潛在風險點

#### 📸 截圖與圖片引用
**問題**: 2 個檔案引用不存在的截圖
```
docs/04-guides/demo-tools/usage-guide.md:19
docs/04-guides/project-info/README.md:5
```
**狀態**: ✅ 已用 `<!-- -->` 註解，無需處理

#### 失效連結
**問題**: 13 個失效連結（SQL 檔案、Vue 組件等）
**狀態**: ✅ 已在 VitePress `ignoreDeadLinks` 配置中處理

#### 🔄 React 相關內容
**問題**: 18 個檔案提及 React
**狀態**: ⚠️ 需檢查是否為「技術對比」或「歷史遺留」

---

## ✅ 四、修復優先級排序

### 4.1 優先級矩陣

| 優先級 | 影響範圍 | 緊急程度 | 處理時限 | 預估工時 | 完成狀態 |
|--------|----------|----------|----------|----------|----------|
| **P0 - 緊急** | 阻礙開發工作 | 立即 | 1 天內 | 0.5-1 天 | ✅ 0/0 (無緊急項目) |
| **P1 - 高** | 可能誤導開發 | 本週內 | 1 週內 | 1-2 天 | ✅ 3/3 已完成 |
| **P2 - 中** | 影響文檔品質 | 本月內 | 1 個月內 | 2-4 小時 | 🔄 4/5 (API文檔 Phase 1/4) |
| **P3 - 低** | 僅需標記 | 季度內 | 3 個月內 | 1-2 小時 | ✅ 2/2 已完成 |

### 4.2 具體修復計畫

#### ✅ P0 - 緊急 (0 項)
目前無阻礙開發的緊急問題 ✅

#### 🔥 P1 - 高優先級 (3 項，預估 4-6 小時)

**任務 1**: 檢查並更新組件地圖
- **檔案**: `02-development/architecture/component-map.md`
- **檢查方式**:
  ```bash
  # 統計實際組件數
  find admin-platform-vue/src/components -name "*.vue" | wc -l

  # 對比文檔記錄的組件數
  grep "組件總數\|component count" component-map.md
  ```
- **狀態**: ✅ **已完成** (2025-10-07) - 組件地圖已更新，反映 406 個組件
- **預估時間**: 2 小時

**任務 2**: 整合根目錄 deployment/ 與 03-operations/deployment/
- **檔案**:
  - `deployment/*` (根目錄)
  - `03-operations/deployment/*`
- **檢查方式**: 比對兩處文檔內容差異
- **狀態**: ✅ **已確認** (2025-10-07) - 根目錄無 deployment/ 目錄，無需整合
- **預估時間**: 2 小時

**任務 3**: React 相關文檔標記
- **檔案**: 18 個提及 React 的文檔
- **處理方式**:
  - `react-appendix.md`: 移至 `05-reference/historical/react-comparison.md`
  - 其他文檔: 加註「🔖 歷史參考」標記
- **狀態**: ✅ **已完成** (已移至 `05-reference/historical/react-appendix.md`)
- **預估時間**: 1 小時

#### 🟡 P2 - 中優先級 (5 項，預估 8-12 小時)

**任務 4**: 驗證部署文檔與實際配置一致性
- **檔案**: `03-operations/deployment/*.md`
- **檢查**: 對比 Dockerfile、docker-compose.yml、GitHub Actions
- **狀態**: ✅ **已完成** (2025-10-07) - docker-guide.md 已對齊 Vue+npm 實際配置
- **預估時間**: 3 小時

**任務 5**: 更新 API 文檔 🔴 **升級為 P0 高優先級技術債務** ✅ **已完成**
- **檔案**: `02-development/api/*.md`
- **檢查**: 對比 `admin-platform-vue/src/api/services/`
- **狀態**: ✅ **Phase 4 已完成** - 86% 覆蓋率 (19/22 服務)
  - ✅ Phase 1: 核心 5 個 P0 API 手動深度文檔 (Customer, Order, Product, Dashboard, Campaign)
  - ✅ 所有 Phase 1 API 文檔已加入 Supabase Dashboard 交叉引用指引
  - ✅ Phase 2: P1 級別服務 (4/4 已完成，手動深度文檔)
    - ✅ CampaignAnalyticsApiService (~900 行，6 大分析模組)
    - ✅ UserApiService (~750 行，RBAC 核心)
    - ✅ RoleApiService (~650 行，角色管理與安全檢查)
    - ✅ ConversationApiService (~850 行，客服對話系統)
  - ✅ Phase 3: P2 分析服務 (5/5 已完成，TypeDoc 自動化)
    - ✅ OrderAnalyticsService (TypeDoc 自動生成)
    - ✅ ProductAnalyticsService (TypeDoc 自動生成)
    - ✅ CustomerAnalyticsZeroExpansionService (TypeDoc 自動生成)
    - ✅ CustomerSegmentationService (TypeDoc 自動生成)
    - ✅ SupportAnalyticsApiService (TypeDoc 自動生成)
    - ✅ 創建整合文檔 `analytics-services-overview.md` (~500 行，業務邏輯 + 使用場景)
  - ✅ Phase 4: P3 輔助服務 (5/5 已完成，TypeDoc 自動化)
    - ✅ AgentApiService (TypeDoc 自動生成，Agent 管理)
    - ✅ CampaignScoringApiService (TypeDoc 自動生成，活動評分)
    - ✅ GroupNotificationApiService (TypeDoc 自動生成，群組通知)
    - ✅ HolidayApiService (TypeDoc 自動生成，假日管理)
    - ✅ NotificationApiService (TypeDoc 自動生成，通知 API 含 3 個子服務)
- **已有獨立文檔的服務** (3個):
  - ✅ CampaignTypeApiService - `campaign-type-api.md`
  - ✅ BusinessHealthAnalyticsService - `business-health-analytics-api.md`
  - ✅ NotificationService - `notification-system.md`
- **總覆蓋**: 19/22 服務 (86%)，剩餘 3 個已有獨立文檔
- **評估報告**: 📋 [API Documentation Gap Analysis](./05-reference/API_DOCUMENTATION_GAP_ANALYSIS.md)
- **採用方案**: ✅ **混合方案** - Supabase Dashboard (資料庫層) + 手動文檔 (業務邏輯層) + TypeDoc (技術參考自動生成)
- **實際時間投入**:
  - Phase 1: ✅ 完成 (10-12 小時，P0 核心服務)
  - Phase 2: ✅ 完成 (8-10 小時，P1 重要服務)
  - Phase 3: ✅ 完成 (4-5 小時，P2 分析服務 + TypeDoc 設置)
  - Phase 4: ✅ 完成 (1 小時，P3 輔助服務 TypeDoc 擴展)
  - **總計**: 23-28 小時

**任務 6**: 測試工具文檔更新
- **檔案**: `04-guides/testing-tools/*.md`
- **檢查**: package.json 依賴版本
- **狀態**: ✅ **已確認** (2025-10-07) - 無硬編碼版本號，符合最佳實踐
- **預估時間**: 2 小時

**任務 7**: 資料庫 Schema 文檔核對
- **檔案**: `02-development/database/schema.sql`
- **檢查**: 對比 Supabase 實際 Schema
- **狀態**: ✅ **已標記** (2025-10-07) - 添加元數據標頭，完整核對需 Supabase 連線
- **預估時間**: 2 小時

**任務 8**: 通知系統文檔核對
- **檔案**: `02-development/modules/notification/*.md`
- **檢查**: 對比實際觸發器和函數
- **狀態**: ✅ **已確認** (2025-10-07) - 文檔完全反映 2025-07-31 修復成果
- **預估時間**: 2 小時

#### 🟢 P3 - 低優先級 (2 項，預估 2-3 小時)

**任務 9**: PRD 實際實現差異標註
- **檔案**: `01-planning/prd/*.md`
- **處理**: 加註「實際實現以代碼為準」
- **狀態**: ✅ **已完成** (2025-10-07) - 5 個 PRD 檔案已加註規劃階段說明
- **預估時間**: 1 小時

**任務 10**: future-features 目錄整理
- **檔案**: `future-features/*`
- **處理**: 確認所有未來功能已正確標記
- **狀態**: ✅ **已完成** (2025-10-07) - 3 個檔案已強化封存狀態標記
- **預估時間**: 1 小時

---

## 🔄 五、定期檢查流程

### 5.1 季度性文檔審查 (每 3 個月)

#### 檢查清單

**步驟 1: 自動化統計**
```bash
# 執行文檔健檢腳本
./docs/scripts/health-check.sh

# 檢查項目:
# - 文檔總數變化
# - 各層級檔案分布
# - 最近 3 個月未更新的 Type A 文檔
```

**步驟 2: Type A 文檔核對**
- [ ] API 文檔與實際 API 服務一致性
- [ ] 架構圖與當前系統架構一致性
- [ ] 部署文檔與實際部署配置一致性
- [ ] 資料庫 Schema 與 Supabase 一致性

**步驟 3: 新增文檔分類**
- [ ] 檢查 dev-notes/ 新增的文檔
- [ ] 標記文檔類型 (Type A/B/C)
- [ ] 更新 documentation-index.md

**步驟 4: 過時文檔清理**
- [ ] 識別超過 6 個月未更新的 Type A 文檔
- [ ] 驗證或更新過時內容
- [ ] 移除或歸檔不再需要的文檔

### 5.2 重大功能更新時的文檔同步檢查點

#### 觸發時機
- 新增核心業務模組
- 架構重大重構
- API 介面變更
- 部署方式變更

#### ✅ 同步檢查清單
- [ ] 更新相關架構圖
- [ ] 更新 API 文檔
- [ ] 更新組件地圖
- [ ] 建立 dev-notes 記錄開發過程
- [ ] 更新 documentation-index.md

### 5.3 自動化檢查腳本

#### 📜 腳本 1: 文檔-代碼一致性檢查

```bash
#!/bin/bash
# 檔案: docs/scripts/health-check.sh

echo "=== 文檔健檢工具 v1.0 ==="
echo ""

# 1. 統計文檔數量
echo "📊 文檔統計:"
echo "總文檔數: $(find docs -name '*.md' | wc -l)"
echo "dev-notes: $(ls docs/04-guides/dev-notes/*.md 2>/dev/null | wc -l)"
echo ""

# 2. 檢查組件數量一致性
echo "🔍 檢查組件地圖..."
actual_components=$(find admin-platform-vue/src/components -name "*.vue" | wc -l)
echo "實際組件數: $actual_components"
echo "請核對 docs/02-development/architecture/component-map.md"
echo ""

# 3. 檢查最近未更新的文檔
echo "⏰ 90 天以上未更新的 Type A 文檔:"
find docs/02-development/architecture docs/02-development/api docs/03-operations/deployment \
  -name "*.md" -mtime +90 -exec ls -lh {} \; | awk '{print $9, "(" $6, $7, $8 ")"}'
echo ""

# 4. 檢查 React 相關內容
echo "🔖 包含 React 的文檔:"
grep -l "React\|react" docs/**/*.md 2>/dev/null | wc -l
echo ""

# 5. 檢查失效連結 (執行 VitePress build)
echo "🔗 檢查失效連結 (執行 VitePress build)..."
npm run docs:build 2>&1 | grep -E "dead link|Found dead" || echo "✅ 無失效連結"
echo ""

echo "=== 健檢完成 ==="
```

#### 📜 腳本 2: Git Hook - Pre-commit 文檔檢查

```bash
#!/bin/bash
# 檔案: .git/hooks/pre-commit

# 檢查是否有 src/ 變更
src_changed=$(git diff --cached --name-only | grep "^admin-platform-vue/src/")

if [ -n "$src_changed" ]; then
  echo "⚠️  偵測到 src/ 代碼變更"
  echo "📝 請確認是否需要更新以下文檔:"
  echo "   - docs/02-development/architecture/component-map.md"
  echo "   - docs/02-development/api/*.md"
  echo "   - docs/02-development/modules/*.md"
  echo ""
  read -p "是否已更新相關文檔? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Commit 已取消，請先更新相關文檔"
    exit 1
  fi
fi
```

---

## 六、面試用文檔精選指引

### 6.1 面試簡報準備建議

#### 技術深度展示 (5-7 分鐘)
**推薦文檔**:
1. `SERVICE_FACTORY_ARCHITECTURE.md` - 展現設計模式理解
2. `AI_PROVIDER_SYSTEM_ARCHITECTURE.md` - 展現系統整合能力
3. `ROUTER_SESSION_OPTIMIZATION_REPORT.md` - 展現效能優化成果 (83% 提升)

**簡報重點**:
- 問題背景與挑戰
- 技術決策與權衡
- 量化成果與商業價值

#### 問題解決能力展示 (3-5 分鐘)
**推薦文檔**:
1. `DATA_TABLE_ACTIONS_FINAL_FIX.md` - 展現深度問題分析
2. `NOTIFICATION_SYSTEM_TRIGGERS_FIX.md` - 展現系統性修復過程

**簡報重點**:
- 問題診斷流程
- 根因分析方法
- 解決方案選擇理由

#### 商業思維與架構設計 (5-7 分鐘)
**推薦文檔**:
1. `MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md` - 展現方法論
2. `ORDER_ANALYTICS_DEVELOPMENT_PHASES.md` - 展現階段性技術演進
3. `MOCK_ROI_ANALYSIS_METHODOLOGY.md` - 展現 ROI 量化能力

**簡報重點**:
- 商業價值評估
- 技術風險控制
- 可複製的開發流程

### 6.2 不同職位的文檔選擇策略

#### 👨‍💻 全端工程師職位
**核心展示**: 前後端整合能力 + 系統設計
- `campaign-system.md` (完整業務系統)
- `SERVICE_FACTORY_ARCHITECTURE.md` (後端架構)
- `THEME_SYSTEM_DEVELOPMENT_GUIDE.md` (前端系統)

#### 架構師職位
**核心展示**: 系統設計 + 技術決策 + 效能優化
- `AI_PROVIDER_SYSTEM_ARCHITECTURE.md` (多供應商整合)
- `DASHBOARD_PERFORMANCE_OPTIMIZATION.md` (效能優化)
- `DOCUMENTATION_RESTRUCTURING_METHODOLOGY.md` (系統化方法論)

#### 技術主管職位
**核心展示**: 團隊協作 + 流程建立 + 商業思維
- `MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md` (標準化開發流程)
- `TESTING_ARCHITECTURE.md` (測試策略)
- `MOCK_ROI_ANALYSIS_METHODOLOGY.md` (ROI 分析)

### 6.3 面試常見問題對應文檔

| 面試問題 | 推薦文檔 | 重點說明 |
|---------|---------|---------|
| "描述一次效能優化經驗" | `ROUTER_SESSION_OPTIMIZATION_REPORT.md` | 3秒→500ms，83%提升 |
| "如何處理複雜的系統整合" | `AI_PROVIDER_SYSTEM_ARCHITECTURE.md` | 多供應商適配器模式 |
| "團隊協作與流程建立" | `MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md` | 6階段標準流程 |
| "技術債務如何管理" | `DOCUMENTATION_RESTRUCTURING_METHODOLOGY.md` | 系統化重構方法 |
| "如何做技術決策" | `ORDER_ANALYTICS_DEVELOPMENT_PHASES.md` | 階段性演進策略 |

---

## 📌 七、快速參考

### 7.1 重要文檔快速索引

**🔥 最常用的 10 個文檔**:
1. `documentation-index.md` - 文檔導航入口
2. `02-development/architecture/campaign-system.md` - 核心業務系統
3. `03-operations/deployment/DEPLOYMENT.md` - 部署指南
4. `04-guides/dev-notes/SERVICE_FACTORY_ARCHITECTURE.md` - 架構設計
5. `04-guides/dev-notes/MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md` - 開發流程
6. `02-development/database/supabase-integration.md` - 資料庫集成
7. `04-guides/testing-tools/front-stage-setup.md` - 測試環境
8. `02-development/api/notification-system.md` - 通知系統 API
9. `04-guides/dev-notes/ROUTER_SESSION_OPTIMIZATION_REPORT.md` - 效能優化
10. `04-guides/dev-notes/AI_PROVIDER_SYSTEM_ARCHITECTURE.md` - AI 系統

### 7.2 文檔維護責任分工建議

| 文檔類型 | 更新觸發時機 | 負責角色 | 審查週期 |
|---------|-------------|---------|---------|
| **API 文檔** | API 變更時 | 後端開發者 | 每次 PR |
| **架構文檔** | 重大重構時 | 架構師/Tech Lead | 每季 |
| **部署文檔** | 部署方式變更時 | DevOps | 每月 |
| **dev-notes** | 問題解決後 | 經手開發者 | 不需定期審查 |
| **使用指南** | 功能變更時 | 產品經理/前端 | 每次發布 |

### 7.3 常用命令速查

```bash
# 統計文檔數量
find docs -name "*.md" | wc -l

# 檢查最近更新的文檔
find docs -name "*.md" -mtime -7

# 搜尋特定關鍵字
grep -r "keyword" docs/

# 執行 VitePress 本地預覽
npm run docs:dev

# 建置 VitePress 檢查失效連結
npm run docs:build

# 執行健檢腳本
./docs/scripts/health-check.sh
```

---

## 🔖 八、版本歷史

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|---------|------|
| v1.0 | 2025-10-07 | 初始版本，完整健檢 219 個文檔 | 系統 |

---

## 📞 九、聯絡與回饋

如發現文檔過時或有改進建議，請:
1. 在 GitHub 提出 Issue
2. 直接修改文檔並提交 PR
3. 更新本健檢報告的對應章節

---

**📌 提醒**:
- 本健檢報告建議每季更新一次
- 重大功能更新時應立即更新相關章節
- 保持文檔與代碼同步是團隊共同責任
