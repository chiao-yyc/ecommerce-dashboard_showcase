# 前端專案 - Vue 3 Admin Platform

> 基於 Vue 3 + TypeScript + Vite 建構的現代化電商後台前端系統

此為主專案 [E-commerce Admin Platform](../README.md) 的前端子專案。

---

## 🛠️ 技術棧

- **框架**: Vue 3.5 (Composition API + `<script setup>`)
- **語言**: TypeScript 5.x (嚴格模式)
- **建置工具**: Vite 6.0
- **狀態管理**: Pinia + Vue Query
- **UI 組件**: Radix Vue (Headless UI) + Tailwind CSS 3.x
- **圖表**: Unovis (響應式資料視覺化)
- **測試**: Vitest + Vue Test Utils (471 測試全部通過)

---

## 📦 開發指令

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 生產建置
npm run build

# 運行測試
npm run test

# 測試監視模式
npm run test:watch

# 程式碼檢查
npm run lint

# 類型檢查
npm run typecheck
```

---

## 📁 專案結構

```
src/
├── api/                  # API 服務層（ServiceFactory）
│   └── services/         # 8 個業務服務類
├── components/           # 組件庫
│   ├── data-table-*/     # 資料表格系統（3 層架構）
│   ├── charts/           # Unovis 圖表組件
│   ├── notify/           # 通知系統組件
│   └── ui/               # Radix Vue 基礎組件
├── composables/          # 組合式函數（業務邏輯抽象）
│   ├── data-table-actions/  # 表格操作邏輯
│   ├── queries/          # Vue Query 查詢
│   └── analytics/        # 分析功能
├── views/                # 頁面組件（核心業務場景）
├── store/                # Pinia 狀態管理
├── router/               # Vue Router 設定
├── utils/                # 工具函數
└── types/                # TypeScript 類型定義
```

---

## 🎯 核心架構特色

### 1. ServiceFactory 依賴注入模式
```typescript
// 使用 ServiceFactory
import { defaultServiceFactory } from '@/api/services'

const orderService = defaultServiceFactory.getOrderService()
const result = await orderService.getAll({ status: 'pending' })
```

### 2. 資料表格系統（三層架構）
- `data-table` - 基礎表格
- `data-table-async` - 非同步載入表格
- `data-table-editable` - 可編輯表格

### 3. Vue Query 階層式快取
統一的資料查詢和快取管理，支援樂觀更新和自動重新驗證。

---

## 🧪 測試

### 測試覆蓋率要求
- **View 層**: 85%+
- **Business 層**: 90%+
- **Composable 層**: 95%+

### 當前測試狀態
- **總測試數**: 471 測試
- **通過率**: 100% (471/471)
- **執行時間**: ~20-41 秒

---

## 📚 完整文件

- [根目錄 README](../README.md) - 完整系統架構與技術展示
- [Supabase 後端](../supabase/README.md) - 後端開發快速開始
- [技術文件中心](../docs/index.md) - VitePress 完整文件

---

## 🔗 相關資源

- [Vue 3 官方文檔](https://vuejs.org/)
- [Vite 官方文檔](https://vitejs.dev/)
- [TypeScript 官方文檔](https://www.typescriptlang.org/)
- [Vitest 測試框架](https://vitest.dev/)
- [Radix Vue 組件庫](https://www.radix-vue.com/)
