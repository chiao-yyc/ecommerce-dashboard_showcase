# Constants 目錄

## 📋 目錄用途

此目錄存放跨模組共用的業務配置和通用預設值，用於消除專案中的 magic numbers 和硬編碼數值。

## 📁 檔案說明

### `campaignLayers.ts`
- **用途**: 活動歸因層級權重定義
- **包含**: 層級權重配置、顯示名稱映射、工具函數
- **使用場景**: Campaign Analytics、歸因分析相關功能

### `export.ts`
- **用途**: 匯出功能相關配置
- **包含**: 匯出成功後的延遲清除設定
- **使用場景**: 資料匯出功能

### `defaults.ts` ✨ 新增
- **用途**: 通用預設值和硬編碼數值消除
- **包含**:
  - `ANALYTICS_DEFAULTS` - 分析系統相關預設值
  - `API_DEFAULTS` - API 服務相關預設值
  - `UI_DEFAULTS` - UI 介面相關預設值
  - `BUSINESS_DEFAULTS` - 業務邏輯相關預設值
  - `PERFORMANCE_DEFAULTS` - 系統效能相關預設值
  - `DEV_DEFAULTS` - 開發環境相關預設值

### `index.ts` ✨ 新增
- **用途**: 統一匯出接口
- **包含**: 所有常數的統一匯出

## 🔧 使用規範

### ✅ 推薦用法
```typescript
// 使用統一匯出 (推薦)
import { ANALYTICS_DEFAULTS, EXPORT_CONFIG, LAYER_WEIGHTS } from '@/constants'

// 使用分析預設值
const customerLimit = ANALYTICS_DEFAULTS.CUSTOMER_LIMIT
const chartWidth = ANALYTICS_DEFAULTS.DEFAULT_CHART_WIDTH

// 使用 API 預設值
const timeout = API_DEFAULTS.DEFAULT_TIMEOUT
const aiTimeout = API_DEFAULTS.AI_SERVICE_TIMEOUT

// 使用 UI 預設值
const formWidth = UI_DEFAULTS.MAX_FORM_WIDTH
const sidebarWidth = UI_DEFAULTS.SIDEBAR_WIDTH
```

### ❌ 避免的用法
```typescript
// ❌ 直接引用單個檔案
import { ANALYTICS_DEFAULTS } from '@/constants/defaults'

// ❌ 硬編碼數值
const limit = 1000 // 應該使用 ANALYTICS_DEFAULTS.CUSTOMER_LIMIT
const timeout = 30000 // 應該使用 API_DEFAULTS.DEFAULT_TIMEOUT
```

## 📊 常數分類標準

### 應該放在 `constants/` 的內容
- 跨模組共用的配置值
- 業務邏輯相關的常數
- 系統層級的預設值
- 需要統一管理的硬編碼數值

### 不應該放在 `constants/` 的內容
- 與特定類型緊密相關的常數 (應放在 `types/`)
- 工具函數相關的配置 (應放在 `utils/`)
- 組合式函數的預設選項 (應放在 `composables/`)
- UI 元件內部的私有配置 (應留在 `components/`)

## 🚀 優化效果

### 消除的硬編碼數值
- ✅ 客戶分析限制: `1000` → `ANALYTICS_DEFAULTS.CUSTOMER_LIMIT`
- ✅ 圖表尺寸: `800x400` → `ANALYTICS_DEFAULTS.DEFAULT_CHART_WIDTH/HEIGHT`
- ✅ API 超時: `30000` → `API_DEFAULTS.DEFAULT_TIMEOUT`
- ✅ AI 服務超時: `120000` → `API_DEFAULTS.AI_SERVICE_TIMEOUT`
- ✅ 平均訂單間隔: `45` → `ANALYTICS_DEFAULTS.AVG_ORDER_INTERVAL`

### 提升的開發體驗
- **統一管理**: 所有配置值集中在一處，便於調整
- **類型安全**: 完整的 TypeScript 類型定義
- **語意清晰**: 替代 magic numbers，提升代碼可讀性
- **易於維護**: 修改配置無需搜尋整個專案

## 📈 持續改進

### 定期檢查項目
- [ ] 新增的硬編碼數值是否已添加到 constants
- [ ] 常數命名是否遵循 `UPPER_CASE` 規範
- [ ] 是否有重複的配置值需要整合
- [ ] 文檔是否與實際使用保持同步

### 擴展指引
1. **新增常數時**: 確定所屬分類，添加到相應的 `*_DEFAULTS` 物件
2. **修改常數時**: 檢查影響範圍，確保向後兼容
3. **刪除常數時**: 確認沒有引用，避免破壞性變更

---

*最後更新: 2025-09-16*