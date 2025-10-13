# 開發筆記索引

本目錄包含電商管理平台開發過程中的技術筆記、實作細節、優化報告和方法論文檔。所有筆記按功能領域分類，便於快速查找和參考。

## 📁 分類目錄結構

### 🧠 [ai-system/](./ai-system/) - AI 系統開發 (8 個文檔)
AI 增強警示系統、多 AI 提供商架構、Phase 2/3 實現與運維指南

**核心文檔**:
- AI_ENHANCED_ALERT_SYSTEM_SPECIFICATION.md - 三階段漸進式 AI 警示系統架構
- AI_ENHANCED_SYSTEM_ARCHITECTURE.md - 完整 AI 系統架構設計 (2,695 行)
- AI_PROVIDER_SYSTEM_ARCHITECTURE.md - 多 AI 提供商支援架構
- AI_SYSTEM_OPERATIONS_MANUAL.md - 日常維護和故障排除

### 📈 分析系統開發指南 - 已移至 `02-development/modules/analytics/guides/`
Campaign、Customer、Order、Support 四大分析系統的完整開發指南已重組至開發文件區

**新位置**: [02-development/modules/analytics/guides/](../../02-development/modules/analytics/guides/)

### ⚡ [performance-optimization/](./performance-optimization/) - 效能優化方法論 (11 個文檔)
系統效能優化策略、方法論與最佳實踐

**核心方法論**:
- DASHBOARD_PERFORMANCE_OPTIMIZATION.md - 儀表板效能優化
- THEME_PERFORMANCE_OPTIMIZATION_METHODOLOGY.md - 主題效能優化方法論
- REALTIME_ERROR_REPORTING_OPTIMIZATION.md - Realtime 錯誤回報優化
- SYNC_OPTIMIZATION.md - 同步優化

**注意**: 歷史修復記錄已精簡，保留方法論與優化策略文件

### 📊 稽核與驗證報告 - 已移除
內部稽核報告已精簡移除，專注於對外展示的核心技術文件

### 🔧 [development-workflow/](./development-workflow/) - 開發流程指南 (2 個文檔)
開發流程標準化、配置管理最佳實踐

- documentation-maintenance-guide.md - 文檔運營維護指南 (1,110 行)
- gitignore-management-guide.md - .gitignore 管理指南

### 📖 [documentation/](./documentation/) - 文檔維護記錄 (3 個文檔)
文檔健檢、重構與優化記錄

- health-check-report.md - 文檔健檢報告
- emoji-cleanup-report.md - Emoji 清理報告
- restructure-report.md - 文檔重構報告

### 🚀 系統增強計劃 - 已移至 `future-features/enhancement-plans/`
未來功能擴展與系統優化規劃已統一移至 future-features 目錄

**新位置**: [future-features/enhancement-plans/](../../future-features/enhancement-plans/)

---

## 📋 根目錄核心文檔 (25 個)

### 系統架構與方法論
- **SERVICE_FACTORY_ARCHITECTURE.md** - ServiceFactory 依賴注入架構設計
- **MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE.md** - 模組優化開發指南 (751 行)
- **DOCUMENTATION_RESTRUCTURING_METHODOLOGY.md** - 文檔重構方法論
- **TESTING_ARCHITECTURE.md** - 測試架構設計
- **COMPONENT_INTEGRATION_TESTS_PLAN.md** - 元件整合測試計劃
- **DEV_NOTE_TEMPLATES.md** - 開發筆記模板 (786 行)
- **INFORMATION_ARCHITECTURE_AUDIT.md** - 資訊架構稽核 (576 行)

### 通知與圖表系統
- **NOTIFICATION_SYSTEM_COMPLETE_GUIDE.md** - 通知系統完整指南 (649 行)
- **NOTIFICATION_LIB_USAGE_GUIDE.md** - 通知函式庫使用指南 (524 行)
- **CHART_COMPOSABLE.md** - 圖表組合函數設計
- **CHART_EXPORT_SYSTEM_DEVELOPMENT.md** - 圖表導出系統開發
- **THEME_SYSTEM_DEVELOPMENT_GUIDE.md** - 主題系統開發指南
- **CALENDAR_KEY_MECHANISM_GUIDE.md** - 日曆鍵機制指南

### 業務功能開發
- **INVENTORY_OPERATIONS_GUIDE.md** - 庫存操作完整指南 (708 行)
- **ORDER_STATE_MACHINE_APPROACH.md** - 訂單狀態機設計方法
- **ROLE_USERS_VIEW_FUNCTIONALITY.md** - 使用者角色管理功能

### 系統安全與認證
- **AUTH_USER_ID_DUPLICATE_PREVENTION_GUIDE.md** - 使用者 ID 重複防護
- **AUTHENTICATION_INITIALIZATION_ARCHITECTURE.md** - 認證初始化架構

### 技術遷移與分析
- **EDGE_FUNCTION_MIGRATION_ASSESSMENT.md** - Edge Function 遷移評估
- **XLSX_EXPORT_EDGE_FUNCTION_MIGRATION_ANALYSIS.md** - XLSX 導出遷移分析
- **MOCK_ROI_ANALYSIS_METHODOLOGY.md** - Mock ROI 分析方法論
- **I18N_PDF_EXPORT_VERIFICATION.md** - 國際化 PDF 導出驗證
- **PDF_EXPORT_FINAL_SOLUTION.md** - PDF 導出最終方案

### Supabase 開發
- **SUPABASE_CONTAINER_RESTART_AND_EDGE_FUNCTION_DEBUG_GUIDE.md** - Supabase 容器重啟與 Edge Function 除錯

---

## 🔍 快速查找

### 按主題查找
- **AI 系統**: → [ai-system/](./ai-system/)
- **分析系統**: → [02-development/modules/analytics/guides/](../../02-development/modules/analytics/guides/) (已移動)
- **效能優化**: → [performance-optimization/](./performance-optimization/)
- **開發流程**: → [development-workflow/](./development-workflow/)
- **未來功能**: → [future-features/](../../future-features/) (包含 enhancement-plans)

### 按文檔類型查找
- **架構設計**: SERVICE_FACTORY_ARCHITECTURE, TESTING_ARCHITECTURE
- **開發指南**: MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE, [02-development/modules/analytics/guides/](../../02-development/modules/analytics/guides/)
- **優化方法論**: performance-optimization/

### 按字數規模查找
- **超大型文檔 (>2000 行)**: AI_ENHANCED_SYSTEM_ARCHITECTURE (2,695 行)
- **大型文檔 (1000-2000 行)**: documentation-maintenance-guide (1,110 行)
- **中型文檔 (500-1000 行)**: MODULE_OPTIMIZATION_DEVELOPMENT_GUIDE (751 行), INVENTORY_OPERATIONS_GUIDE (708 行)

**注意**: Analytics 開發指南（CUSTOMER_ANALYTICS、CAMPAIGN_ANALYTICS 等大型文檔）已移至 [02-development/modules/analytics/guides/](../../02-development/modules/analytics/guides/)

---

**目錄統計**: 5 個子目錄 + 25 個根文檔 = 共 ~60 個開發筆記
**最後更新**: 2025-10-13
**維護原則**: 大型主題建立子目錄，核心架構保留根目錄，持續精簡不廢話
**精簡成果**: 已移除歷史修復記錄、內部稽核報告，重組分析系統開發指南至正確位置
