# 🛠️ 代碼品質檢查工具指南

**版本**: v1.0  
**更新日期**: 2025-09-08  
**適用範圍**: Vue 3 + TypeScript 專案

---

## 工具概述

本專案提供兩個強大的自動化檢查工具，用於維護代碼品質和一致性：

### **check-theme-compliance.js** - 主題相容性檢查工具
檢查專案中的主題系統使用情況，識別硬編碼顏色和不符合主題規範的樣式。

### **check-component-usage.js** - 組件使用一致性檢查工具  
分析 Vue 組件的使用模式，檢測組件選擇不一致和硬編碼樣式問題。

---

## 主題相容性檢查工具

### 功能特色
- ✅ 檢測硬編碼顏色（Tailwind固定顏色、Hex、RGB、HSL等）
- ✅ 識別不推薦的背景、文字、邊框樣式
- ✅ 分析主題變數使用率
- ✅ 提供具體的替換建議
- ✅ 按嚴重程度分類問題並生成報告

### 使用方法

#### 基本執行
```bash
# 執行主題相容性檢查
node scripts/check-theme-compliance.js

# 或使用 npm script（需要先添加到 package.json）
npm run check:theme
```

#### 檢查範圍
- **Vue檔案**: 掃描 `src/**/*.vue` 中的模板和樣式
- **樣式檔案**: 掃描 `src/**/*.scss` 和 `src/**/*.css`
- **總檔案數**: 約 450+ 個檔案

### 報告解讀

#### 問題嚴重程度
- 🔴 **高嚴重性**: 硬編碼顏色，會導致主題切換失效
- 🟡 **中等嚴重性**: 不推薦的樣式模式，影響一致性
- 🟢 **低嚴重性**: 較小的樣式問題

#### 主要問題類型
1. **hardcodedColors**: 應該使用 CSS 變數或主題 tokens
2. **problematicTextColors**: 應該使用 `text-foreground`、`text-muted-foreground` 等
3. **problematicBackgrounds**: 應該使用 `bg-background`、`bg-card` 等
4. **problematicBorders**: 應該使用 `border-border`、`border-input` 等

#### 替換建議範例
```css
/* ❌ 硬編碼 */
bg-white → bg-background
text-gray-900 → text-foreground  
text-gray-600 → text-muted-foreground
border-gray-200 → border-border

/* ✅ 主題變數 */
bg-background
text-foreground
text-muted-foreground
border-border
```

### 生成的報告文件
```
reports/
├── theme-compliance-detail-YYYY-MM-DDTHH-MM-SS-sssZ.json  # 詳細JSON報告
└── theme-compliance-summary-YYYY-MM-DDTHH-MM-SS-sssZ.md   # 摘要Markdown報告
```

---

## 組件使用一致性檢查工具

### 功能特色
- ✅ 掃描所有 Vue 檔案，分析組件使用模式
- ✅ 檢測組件混用問題（同一檔案使用多種相同功能組件）
- ✅ 統計最常用組件和分類使用情況
- ✅ 識別硬編碼樣式問題
- ✅ 生成詳細的使用統計報告

### 使用方法

#### 基本執行
```bash
# 執行組件使用檢查
node scripts/check-component-usage.js

# 或使用 npm script（需要先添加到 package.json）
npm run check:components
```

#### 檢查範圍
- **檔案數**: 掃描 `src/**/*.vue` 約 440+ 個檔案
- **組件分析**: PascalCase 組件使用模式
- **Import 分析**: 組件導入語句檢查

### 報告解讀

#### 組件分類
- **ui-basic**: Button、Input、Label 等基礎UI組件
- **ui-layout**: Card、CardHeader 等布局組件  
- **ui-data**: Table、Badge 等數據展示組件
- **data-table**: DataTable 系列組件
- **business**: 業務邏輯組件

#### 潛在問題類型
1. **hardcoded-styles**: 硬編碼樣式問題
2. **component-mixing**: 組件混用問題（如同時使用多種表格組件）

#### 最常用組件統計
根據最近的檢查結果：
1. **Button** (76 次) - 最常用基礎組件
2. **XYContainer** (39 次) - 圖表容器組件
3. **Badge** (33 次) - 徽章組件
4. **Card** (32 次) - 卡片布局組件
5. **DropdownMenuTrigger** (30 次) - 下拉選單觸發器

### 生成的報告文件
```
reports/
├── component-usage-detail-YYYY-MM-DDTHH-MM-SS-sssZ.json  # 詳細JSON報告
└── component-usage-summary-YYYY-MM-DDTHH-MM-SS-sssZ.md   # 摘要Markdown報告
```

---

## 🔄 開發工作流程整合

### 建議執行時機

#### 主題相容性檢查
- **新功能開發後**: 確保新增的樣式符合主題規範
- **主題系統更新後**: 驗證現有組件的相容性
- **定期檢查**: 每週執行一次，維護代碼品質
- **Code Review 前**: 提交 PR 前執行檢查

#### 組件使用檢查
- **新組件添加後**: 確保組件使用一致性
- **重構期間**: 識別可以統一的組件使用模式
- **月度檢查**: 每月執行一次，分析組件使用趨勢
- **架構優化時**: 作為組件庫優化的參考依據

### CI/CD 整合建議

#### GitHub Actions 範例
```yaml
name: Code Quality Checks
on: [push, pull_request]
jobs:
  theme-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Check theme compliance
        run: node scripts/check-theme-compliance.js
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: theme-compliance-report
          path: reports/
```

### 修復優先級建議

#### 高優先級（🔴 立即修復）
1. **硬編碼顏色**: 影響主題切換功能
2. **問題數量>50的檔案**: 集中修復效益高

#### 中優先級（🟡 計劃修復）  
1. **不推薦的樣式模式**: 影響一致性
2. **組件混用**: 影響維護性

#### 低優先級（🟢 有時間時修復）
1. **邊框樣式**: 視覺影響較小
2. **個別檔案的少量問題**: 可以漸進式修復

---

## 報告解讀最佳實踐

### 主題相容性報告
```markdown
## 總覽
- 檔案數量: 454
- 有問題檔案: 115 (25.3%)  ← 25%以下算良好
- 總問題數: 2026
- 主題變數使用率: 100.0%    ← 100%表示所有變數都被使用
```

### 組件使用報告
```markdown
## 掃描結果摘要
- 檔案數量: 444
- 組件類型: 436            ← 組件多樣性指標
- 潛在問題: 283            ← 需要關注的問題數量
```

### 修復效果追蹤
- **StatusBadge 修復案例**: 從硬編碼顏色改為主題變數後，該組件不再出現在問題清單中
- **建議追蹤方式**: 定期執行並比較報告，量化改進成果

---

## 進階使用技巧

### 自定義檢查規則
可以修改腳本中的 `THEME_ISSUES` 和 `COMPONENT_CATEGORIES` 配置來適應特定需求。

### 報告數據分析
- 利用 JSON 報告進行深度數據分析
- 使用 jq 等工具處理報告數據
- 建立趨勢追蹤圖表

### 團隊協作
- 將報告分享給團隊成員
- 建立修復任務分配機制
- 定期 review 改進成果

---

## ❓ 常見問題 FAQ

### Q: 為什麼主題變數使用率是 100% 但還有硬編碼問題？
**A**: 100% 表示所有定義的主題變數都被使用過，但不代表沒有硬編碼。重點是要將硬編碼替換為主題變數。

### Q: 組件混用問題如何處理？
**A**: 檢查同一檔案中是否使用了功能重複的組件，選擇其中一種並統一使用。

### Q: 檢查工具會影響開發伺服器嗎？
**A**: 不會，這些是獨立的分析工具，不會影響正常的開發和建置流程。

### Q: 可以忽略某些檔案或目錄嗎？
**A**: 是的，可以修改腳本中的 `excludePatterns` 配置來排除特定檔案。

---

**🎯 目標**: 透過定期使用這些工具，維護高品質的代碼標準，確保主題系統的一致性和組件使用的規範性。