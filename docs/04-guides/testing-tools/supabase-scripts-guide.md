# 測試腳本使用指南

本目錄包含庫存系統相關的測試和驗證腳本。

## 📋 腳本列表

### FIFO 庫存測試腳本

#### `fifo-quick-test.sql` ⭐⭐⭐⭐⭐
**用途**：生產環境健康檢查、部署後驗證
**特色**：
- 全自動化驗證，不需要手動設定
- 檢查資料品質（received_at 欄位）
- 驗證 NOT NULL 約束設定
- 檢查 FIFO 函數修復狀態
- 測試實際 FIFO 排序邏輯
- 提供總結報告

**使用方法**：
```sql
-- 在 psql 或 Supabase SQL Editor 中執行
\i supabase/docs/scripts/fifo-quick-test.sql
```

**預期結果**：
- ✅ 資料品質：所有記錄都有 received_at 值
- ✅ 欄位約束：received_at NOT NULL 約束已設定  
- ✅ FIFO 排序：allocate_stock_fifo 函數已修復
- 🎉 所有修復項目都已完成！

#### `fifo-verification-test.sql` ⭐⭐⭐⭐
**用途**：開發階段詳細測試、特定產品 FIFO 驗證
**特色**：
- 深度功能測試
- 模擬分配測試（5個單位分配計劃）
- 針對特定產品的詳細檢查
- 資料品質統計分析

**使用方法**：
1. 執行 Step 1 找到測試產品 ID
2. 將產品 ID 替換到後續查詢中
3. 逐步執行各個測試步驟

```sql
-- 1. 先找到有多個庫存記錄的產品
SELECT p.id, p.name, COUNT(i.id) as inventory_count
FROM products p
LEFT JOIN inventories i ON p.id = i.product_id 
GROUP BY p.id, p.name
HAVING COUNT(i.id) > 1
ORDER BY inventory_count DESC
LIMIT 5;

-- 2. 將產品 ID 替換到腳本中的 '77fd820c-3cb1-4313-a0c3-0c007d21c23b'
-- 3. 執行完整腳本
```

## 🛠️ 故障排除

### 常見問題

#### 1. "找不到適合的測試產品"
**原因**：資料庫中沒有產品有多筆庫存記錄
**解決**：
- 先新增一些測試庫存記錄
- 或使用單一庫存記錄的產品進行基本測試

#### 2. "FIFO 排序未修復"
**原因**：allocate_stock_fifo 函數未包含 NULLS LAST
**解決**：
- 檢查是否執行了修復 migration：`20250730231000_cleanup_and_fix_fifo.sql`
- 重新執行 `supabase db push`

#### 3. "仍有 NULL 記錄"
**原因**：received_at 資料品質修復未完成
**解決**：
- 檢查是否執行了資料修復 migration：`20250730232000_fix_received_at_data_quality.sql`
- 手動修復：`UPDATE inventories SET received_at = created_at WHERE received_at IS NULL`

## 📊 測試最佳實踐

### 測試頻率建議
- **部署後必測**：`fifo-quick-test.sql`
- **每週健康檢查**：`fifo-quick-test.sql`
- **開發新功能時**：`fifo-verification-test.sql`
- **問題排查時**：`fifo-verification-test.sql`

### 測試環境要求
- 資料庫中有產品和庫存記錄
- 執行權限：需要能讀取 inventories, inventory_logs, products 表
- 建議在測試環境先執行，確認無誤後再用於生產環境

## 📞 技術支援

如遇到問題，請參考：
- 部署指南：`../guides/inventory-fix-deployment.md`
- 主要文檔：`../../docs/02-development/database/inventory-system.md`
- 開發筆記：`../../docs/04-guides/dev-notes/INVENTORY_LOGGING_SYSTEM_FIX.md`