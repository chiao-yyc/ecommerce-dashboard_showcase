# 📄 PDF 匯出中文字體最終解決方案

## 問題背景

在實現 PDF 匯出功能時，遇到中文字元在 PDF 中顯示為亂碼或方塊的問題。經過多次嘗試和調試，最終找到了有效的解決方案。

## ✅ 最終解決方案：svg2pdf.js + 官方字體轉換

### 核心架構

```
用戶觸發匯出 → 智能字體註冊 → SVG 準備 → svg2pdf.js 轉換 → PDF 輸出
                      ↓
              NotoSansTC-VariableFont_wght
              (預先轉換的 JS 檔案)
```

### 技術棧組合

1. **jsPDF v3.0.1** - PDF 建立和基本操作
2. **svg2pdf.js v2.5.0** - SVG 向量圖轉 PDF（關鍵組件）
3. **官方 fontconverter 工具** - 字體檔案轉換
4. **Noto Sans TC** - Google 的開源中文字體

## 實現細節

### 1. 字體檔案準備

使用 jsPDF 官方 fontconverter 工具將 TTF 字體轉換為 JS 檔案：

```bash
# 使用官方工具轉換
fontconverter NotoSansTC-VariableFont_wght.ttf
# 產生 NotoSansTC-VariableFont_wght-normal.js (15.2MB)
```

**放置位置**：
```
src/assets/NotoSansTC-VariableFont_wght-normal.js
```

### 2. 智能字體註冊系統

**核心檔案**：`src/utils/fontRegistration.ts`

```typescript
export const setBestAvailableFont = async (
  pdf: jsPDF, 
  preferChinese: boolean = true
): Promise<{
  fontSet: string
  isChinese: boolean
  registrationResult: any
}>
```

**工作流程**：
1. 動態載入字體 JS 檔案
2. 檢查自動註冊是否成功
3. 如失敗則觸發手動註冊事件
4. 回傳字體註冊結果

### 3. PDF 匯出主要函數

**核心檔案**：`src/utils/export.ts`

```typescript
export async function exportSVGToPDF(
  svgElement: SVGElement,
  options: PDFExportOptions
): Promise<void>
```

**關鍵步驟**：
1. 智能檢測文字內容需求
2. 使用 `setBestAvailableFont()` 設定字體
3. 準備 SVG 元素（清理樣式、設定字體）
4. **使用 svg2pdf.js 進行轉換**：
   ```typescript
   await pdf.svg(preparedSVG, {
     x: finalX,
     y: finalY,
     width: dimensions.targetWidth,
     height: dimensions.targetHeight,
     loadExternalStyleSheets: false
   })
   ```

### 4. 組件整合

**範例**：`BusinessHealthRadarChart.vue`

```typescript
import { exportSVGToPDFWithFonts } from '@/utils/export'

const handleExportToPDF = async () => {
  const exportOptions: PDFExportOptions = {
    filename: 'business_health_radar',
    title: t('export.pdf.businessHealthRadarTitle'),
    description: t('export.pdf.overallHealthScore', { score: totalScore.toFixed(1) }),
    locale: locale.value // 重要：傳入語言環境
  }
  
  await exportSVGToPDFWithFonts(svgRef.value, exportOptions)
}
```

## 🚫 放棄的方案

### 1. Google Fonts API 動態載入
**問題**：瀏覽器限制、CORS 問題、載入時機難控制

### 2. Canvas 模式轉換
**問題**：解析度限制、複雜度高、字體渲染不穩定

### 3. html2canvas + jsPDF
**問題**：字體支援差、圖片化失去向量特性

### 4. 複雜的 FontFace API 整合
**問題**：過度工程化、瀏覽器相容性問題

## ⚡ 關鍵發現

### jsPDF v3.0.1 API 重要注意事項
- ❌ **沒有 `addSvg` 方法**（文檔誤導）
- ❌ **`addSvgAsImage` 需要 canvg 依賴**
- ✅ **svg2pdf.js 是正確選擇**

### 字體名稱的關鍵細節
- 轉換後的字體名稱：`NotoSansTC-VariableFont_wght`
- 配置中必須使用完整名稱，不能簡化為 `NotoSansTC`

### 成功要素
1. **正確的技術組合**：jsPDF + svg2pdf.js
2. **官方工具轉換**：避免自製轉換方案
3. **智能字體檢測**：自動/手動註冊機制
4. **統一架構**：所有圖表使用相同匯出邏輯

## 效果驗證

### 功能測試
- ✅ 中文字元正確顯示
- ✅ 英文內容保持清晰
- ✅ 向量圖品質保持
- ✅ 複雜圖表（雷達圖）完整支援
- ✅ 多語言環境適應

### 效能表現
- 字體檔案載入：一次性 15.2MB
- PDF 產生速度：< 2 秒
- 記憶體使用：合理範圍
- 向量品質：完全保持

## 開發指南

### 新增支援 PDF 匯出的圖表

1. **標記 SVG 元素**：
   ```vue
   <svg data-chart-svg="chart-name" ref="svgRef">
   ```

2. **實現匯出功能**：
   ```typescript
   const handleExportToPDF = async () => {
     await exportSVGToPDFWithFonts(svgRef.value, {
       filename: 'chart-name',
       title: t('chart.title'),
       locale: locale.value
     })
   }
   ```

3. **確保文字元素字體設定**：
   ```vue
   <text font-family="Arial, sans-serif">文字內容</text>
   ```

### 除錯工具

**測試頁面**：`/official-font-test`
- 字體載入狀況檢查
- 註冊機制測試
- PDF 匯出功能驗證

## 📁 相關檔案清單

### 核心實現
- `src/utils/export.ts` - 主要匯出邏輯
- `src/utils/fontRegistration.ts` - 字體註冊系統
- `src/utils/fonts.ts` - 字體配置管理
- `src/assets/NotoSansTC-VariableFont_wght-normal.js` - 字體檔案

### 組件整合
- `src/components/charts/pure/BusinessHealthRadarChart.vue` - 雷達圖範例
- `src/views/OfficialFontTestView.vue` - 測試頁面

### 依賴套件
- `jspdf: ^3.0.1`
- `svg2pdf.js: ^2.5.0`

## 總結

最終解決方案的成功要素：
1. **技術選型正確**：svg2pdf.js 是處理 SVG 轉 PDF 的最佳工具
2. **字體處理官方化**：使用 jsPDF 官方 fontconverter 工具
3. **架構簡潔有效**：避免過度複雜的解決方案
4. **系統性整合**：統一的匯出介面和字體管理

此方案已經過完整測試，能穩定處理中文字元的 PDF 匯出需求，同時保持良好的效能和向量圖品質。

---
*文檔更新時間：2025-08-03*  
*解決方案狀態：✅ 完成並驗證*  
*技術負責：Vue 3 + TypeScript + jsPDF + svg2pdf.js*