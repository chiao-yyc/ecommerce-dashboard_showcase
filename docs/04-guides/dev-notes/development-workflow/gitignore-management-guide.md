# .gitignore 管理指南

## 分層忽略策略

### 設計原則
採用 **分層 .gitignore 策略**，實現集中管理與專案特定需求的平衡。

### 📂 策略結構

```
ecommerce-dashboard/
├── .gitignore (根目錄 - 統一管理 80% 共通規則)
├── admin-platform-vue/.gitignore (Vue 專案特定)
├── front-stage-vue/.gitignore (前台特定)
├── admin-platform-react/.gitignore (React 專案特定)
└── supabase/.gitignore (資料庫特定 - 保持獨立)
```

## 根目錄 .gitignore 管理

### 涵蓋範圍
- ✅ Node.js 基礎 (node_modules, logs, 運行時數據)
- ✅ 構建輸出 (dist, build, .vite, .turbo)
- ✅ TypeScript/JavaScript (*.tsbuildinfo, source maps)
- ✅ 測試相關 (coverage, test-results, playwright-report)
- ✅ 環境變數 (.env*, dotenvx)
- ✅ IDE 設定 (VSCode, JetBrains, Sublime, Vim)
- ✅ 系統文件 (macOS, Windows, Linux)
- ✅ 開發工具 (VitePress, Storybook, Webpack)
- ✅ 資料庫文件 (SQLite, Redis dumps)
- ✅ 安全文件 (SSL 證書, SSH 密鑰)
- ✅ 部署相關 (.vercel, .netlify, Docker)
- ✅ 專案特定 (文檔同步日誌, 備份文件)

## 📁 子專案 .gitignore 管理

### Admin Platform Vue
```gitignore
# Vue 開發工具
.vite

# E2E 測試特定
*.png
*.zip

# HTML 測試報告
html
```

### Front Stage Vue
```gitignore
# 前台特定的臨時文件（目前無特殊需求）
# 保留此文件以便未來添加專案特定規則
```

### Admin Platform React
```gitignore
# React 特定開發工具
.vite

# React 特定的開發文件（目前無其他特殊需求）
# 保留此文件以便未來添加專案特定規則
```

### Supabase (保持獨立)
```gitignore
# Supabase
.branches
.temp

# dotenvx
.env.keys
.env.local
.env.*.local
```

## 🔄 維護流程

### 週期性檢查 (每月)
1. **檢查新的忽略需求**
   ```bash
   git status --ignored
   find . -name "*.log" -o -name "*.tmp" | head -20
   ```

2. **驗證忽略規則有效性**
   ```bash
   git check-ignore -v suspicious-file.log
   ```

3. **檢查子專案是否有重複規則**
   ```bash
   grep -r "node_modules" */gitignore
   ```

### 新增忽略規則原則

#### 加入根目錄 .gitignore 的情況：
- ✅ 多個子專案都需要的規則
- ✅ 標準開發工具產生的文件
- ✅ 系統級別的臨時文件
- ✅ 安全敏感文件

#### 加入子專案 .gitignore 的情況：
- ✅ 專案特定的構建工具配置
- ✅ 專案特有的測試輸出格式
- ✅ 專案獨有的開發工具文件

## 🚨 注意事項

### 規則衝突處理
- **子專案規則優先於根目錄規則**
- **使用 `!` 前綴來覆蓋父級忽略規則**
- **避免在多個層級重複相同規則**

### 性能考量
- **避免過於複雜的 glob 模式**
- **將最常匹配的規則放在前面**
- **定期清理不再需要的規則**

## 實用命令

### 檢查忽略狀態
```bash
# 檢查文件是否被忽略
git check-ignore -v file.log

# 查看所有被忽略的文件
git status --ignored

# 強制添加被忽略的文件
git add -f important-but-ignored.log
```

### 測試忽略規則
```bash
# 乾燥運行 - 不實際添加，只顯示哪些文件會被處理
git add -n .

# 顯示會被忽略的文件
git clean -ndX
```

## 相關文檔
- [文檔同步配置](./.doc-sync.yml)
- [Git Hooks 設置](../deployment/git-hooks-setup.md)
- [開發環境設置](../../04-guides/dev-guide/environment-setup.md)

---
**更新日誌**
- v1.0.0 (2025-07-22): 初始版本，建立分層 .gitignore 管理策略