# 庫存管理系統

## 系統概述

庫存管理系統是電商平台的核心模組之一，負責產品庫存的追蹤、分配和管理。系統採用 FIFO（先進先出）原則進行庫存分配，確保庫存週轉的合理性。

### 核心功能

#### 📥 **庫存入庫**
- **新建記錄**：每次入庫創建新的 `inventories` 記錄
- **FIFO 支援**：記錄收貨時間以支援先進先出分配
- **來源追蹤**：支援多種入庫來源（供應商進貨、退貨入庫等）
- **Edge Function**：使用 `stock-in` Edge Function 處理入庫操作

#### 📤 **庫存出庫**
- **FIFO 分配**：按 `received_at` 時間順序自動分配庫存
- **原子性操作**：確保庫存分配的原子性和一致性
- **完整日誌**：所有出庫操作記錄在 `inventory_logs` 表

#### **庫存調整**
- **產品級調整**：基於產品ID進行庫存調整，自動處理底層庫存記錄
- **最新記錄優先**：調整時針對最新的庫存記錄（按 `created_at` 排序）
- **智能處理**：無庫存記錄時自動創建新記錄（僅限增加庫存）
- **雙模式支援**：支援 `inventory_id`（專業）和 `product_id`（簡化）兩種調整模式
- **Edge Function**：使用 `stock-adjust` Edge Function 處理調整操作

#### **庫存追蹤**
- **完整記錄**：所有庫存變動都有完整的歷史記錄
- **實時同步**：支援 Realtime 即時庫存狀態更新
- **多維度統計**：總庫存、可用庫存、保留庫存等多維度統計

## 架構設計

### 資料表結構

#### `inventories` 表（主庫存記錄）
```sql
- id: UUID (主鍵)
- product_id: UUID (產品 ID，外鍵)
- quantity: INTEGER (初始數量)
- received_at: TIMESTAMP NOT NULL (收貨時間，FIFO 排序依據)
- note: TEXT (備註)
- created_at/updated_at: TIMESTAMP (系統時間)
- deleted_at: TIMESTAMP (軟刪除標記)
```

#### `inventory_logs` 表（庫存變動記錄）
```sql
- id: UUID (主鍵)
- inventory_id: UUID (庫存記錄 ID，外鍵)
- type: TEXT ('in'|'out') (變動類型)
- quantity: INTEGER (變動數量)
- source: TEXT (變動來源：manual_stock_in、order 等)
- ref_id: UUID (關聯記錄 ID，如 order_id)
- note: TEXT (操作備註)
- created_by_user: UUID (管理員創建者)
- created_by_customer: UUID (客戶創建者)
- created_at: TIMESTAMP (操作時間)
```

### 核心邏輯

#### FIFO 分配算法
```sql
ORDER BY received_at ASC NULLS LAST, created_at ASC
```

**排序邏輯**：
1. 優先按 `received_at`（收貨時間）升序排列
2. `NULL` 值排在最後（確保資料品質）
3. 相同收貨時間時按 `created_at` 排列

#### 當前庫存計算
```sql
current_stock = initial_quantity - SUM(out_quantity)
```

**計算公式**：
- 初始數量減去所有出庫數量的總和
- 即時計算，確保資料一致性

## 資料結構

### 庫存入庫流程
```typescript
interface StockInRequest {
  product_id: string
  quantity: number
  source?: string
  note?: string
  received_at?: string // ISO 時間字串
}
```

### 庫存分配流程
```typescript
interface StockAllocation {
  product_id: string
  required_quantity: number
  source: 'order' | 'adjustment'
  ref_id: string
  creator_user_id?: string
  creator_customer_id?: string
}
```

## 📏 **庫存調整規則**

### **調整策略**

#### **產品級別調整**（推薦）
- **基於產品ID**：使用 `product_id` 進行調整，系統自動處理底層庫存記錄
- **最新記錄優先**：總是針對最新的庫存記錄（按 `created_at` DESC 排序）
- **智能創建**：
  - **增加庫存且無記錄**：自動創建新的庫存記錄
  - **減少庫存且無記錄**：拒絕操作，防止負庫存

#### **記錄級別調整**（專業模式）
- **基於庫存ID**：使用 `inventory_id` 直接調整特定庫存記錄
- **精確控制**：適合需要精確控制特定批次庫存的場景

### 🏷️ **調整原因分類**

#### **增加庫存原因**
| 代碼 | 中文說明 | 使用場景 |
|------|----------|----------|
| `inventory_audit_increase` | 盤點發現額外庫存 | 定期盤點發現實際庫存多於系統記錄 |
| `return_goods` | 退貨入庫 | 客戶退貨或供應商退換貨 |
| `supplier_compensation` | 供應商補償 | 供應商因品質問題等原因的補償 |
| `miscount_correction` | 計數錯誤修正 | 先前記錄錯誤的修正 |

#### **減少庫存原因** 
| 代碼 | 中文說明 | 使用場景 |
|------|----------|----------|
| `inventory_audit_decrease` | 盤點發現庫存短缺 | 定期盤點發現實際庫存少於系統記錄 |
| `damage_writeoff` | 損壞報廢 | 商品損壞無法銷售 |
| `expired_removal` | 過期移除 | 過期商品的清理 |
| `loss_theft` | 丟失或失竊 | 庫存遺失或被盜 |
| `quality_issue` | 品質問題 | 品質不合格的商品移除 |

#### **通用原因**
| 代碼 | 中文說明 | 使用場景 |
|------|----------|----------|
| `other` | 其他原因 | 需要填寫自定義原因說明 |

### **調整限制**

#### **數量限制**
- **增加庫存**：無上限限制
- **減少庫存**：不得超過當前可用庫存數量
- **調整數量**：必須為正整數（方向由調整類型決定）

#### **權限控制**
- **庫存管理員**：完整的調整權限
- **店鋪管理員**：限制調整金額或數量
- **操作記錄**：所有調整操作都有完整的審計記錄

## API 端點

### Edge Functions

#### `stock-in` - 庫存入庫
**端點**：`/functions/v1/stock-in`
**方法**：POST
**功能**：新增庫存記錄並自動建立入庫日誌

**請求格式**：
```json
{
  "product_id": "uuid",
  "quantity": 100,
  "source": "manual_stock_in",
  "note": "進貨入庫",
  "received_at": "2025-07-30T10:00:00Z"
}
```

#### `stock-adjust` - 庫存調整  
**端點**：`/functions/v1/stock-adjust`  
**方法**：POST  
**功能**：調整現有庫存數量（增加或減少），支援產品級別和記錄級別調整

**產品級別調整**（推薦）：
```json
{
  "product_id": "uuid",
  "adjust_quantity": 15,
  "reason": "inventory_audit_increase",
  "source": "manual_adjustment"
}
```

**記錄級別調整**（專業模式）：
```json
{
  "inventory_id": "uuid", 
  "adjust_quantity": -5,
  "reason": "damage_writeoff",
  "source": "inventory_audit"
}
```

**參數說明**：
- `product_id` 或 `inventory_id`：二選一（product_id 為產品級調整，inventory_id 為記錄級調整）
- `adjust_quantity`：調整數量（正數增加，負數減少）
- `reason`：調整原因代碼（參考調整原因分類表）
- `source`：調整來源（預設為 `manual_adjustment`）

### 資料庫函數

#### `allocate_stock_fifo()` - FIFO 庫存分配
**功能**：按 FIFO 原則自動分配庫存，支援雙創建者系統

**參數**：
- `in_product_id`: 產品 ID
- `in_quantity`: 需要分配的數量
- `in_source`: 分配來源
- `in_ref_id`: 關聯記錄 ID
- `in_creator_user_id`: 管理員創建者 ID
- `in_creator_customer_id`: 客戶創建者 ID

#### `adjust_inventory_stock()` - 庫存調整
**功能**：調整指定庫存記錄的數量

**參數**：
- `in_inventory_id`: 庫存記錄 ID
- `in_adjust_quantity`: 調整數量（正數增加，負數減少）
- `in_reason`: 調整原因
- `in_source`: 調整來源
- `in_creator_user_id`: 管理員創建者 ID
- `in_creator_customer_id`: 客戶創建者 ID

## 用戶介面

### 前端組件

#### `ProductsList.vue` - 產品庫存列表
- 顯示產品的總庫存和可用庫存
- 支援快速入庫操作
- 庫存警報提醒

#### `ProductStockList.vue` - 詳細庫存記錄
- 顯示產品的所有庫存批次
- FIFO 順序排列
- 批次級別的庫存資訊

#### `InventoryLogsList.vue` - 庫存變動歷史
- 完整的庫存操作記錄
- 支援按時間、類型、操作者篩選
- 操作追溯和審計功能

### 前端 API 介面

#### `useProduct.ts` - 產品庫存操作
```typescript
// 新增庫存
addInventory(productId: string, updates: StockInRequest)

// 調整庫存
adjustInventory(inventoryId: string, quantity: number, reason: string)

// 查詢庫存
getProductInventories(productId: string)
```

## 🔄 業務流程

### 庫存入庫流程
1. **接收進貨**：記錄商品和數量
2. **建立庫存記錄**：在 `inventories` 表新增記錄
3. **自動記錄日誌**：觸發器自動建立 `inventory_logs` 入庫記錄
4. **更新創建者資訊**：應用層補充創建者資訊

### 訂單庫存分配流程
1. **檢查庫存**：驗證產品是否有足夠庫存
2. **FIFO 分配**：按收貨時間順序分配庫存
3. **建立出庫記錄**：在 `inventory_logs` 記錄出庫資訊
4. **更新訂單狀態**：確認庫存分配成功

### 庫存盤點流程
1. **實地盤點**：清點實際庫存數量
2. **計算差異**：比較系統庫存與實際庫存
3. **調整庫存**：使用 `stock-adjust` 功能調整差異
4. **記錄原因**：詳細記錄盤點結果和調整原因

## 效能考量

### 索引策略
```sql
-- FIFO 查詢優化
CREATE INDEX idx_inventories_fifo 
ON inventories(received_at ASC NULLS LAST, created_at ASC);

-- 庫存日誌查詢優化
CREATE INDEX idx_inventory_logs_allocation 
ON inventory_logs(inventory_id, type, created_at);

-- 創建者查詢優化
CREATE INDEX idx_inventory_logs_creator 
ON inventory_logs(created_by_user, created_by_customer);
```

### 查詢優化
- **即時庫存計算**：使用子查詢而非 JOIN，避免重複計算
- **FIFO 排序**：確保 `received_at NOT NULL`，避免 NULL 值影響排序
- **分頁查詢**：大量庫存記錄時使用分頁減少記憶體消耗

## 🧪 測試策略

### 自動化測試腳本
- **快速驗證**：`supabase/docs/scripts/fifo-quick-test.sql`
- **深度測試**：`supabase/docs/scripts/fifo-verification-test.sql`

### 測試覆蓋範圍
- FIFO 排序邏輯正確性
- 資料完整性約束
- 併發操作安全性
- 效能負載測試

## 🔮 系統限制與注意事項

### 已知限制
1. **併發分配**：高併發環境下可能需要行級鎖定
2. **歷史資料**：大量歷史記錄可能影響查詢效能
3. **分散式**：目前為單一資料庫設計，不支援跨資料庫庫存

### 最佳實踐
1. **定期清理**：歸檔過期的庫存日誌記錄
2. **監控警報**：設定庫存不足和異常變動警報
3. **備份策略**：重要庫存變動前進行資料備份
4. **權限控制**：嚴格控制庫存調整權限

## 相關文檔

### 技術實現
- [部署指南](../../../supabase/docs/guides/inventory-fix-deployment.md) - 完整的部署和修復指南
- [測試腳本](../../../supabase/docs/scripts/README.md) - 驗證和測試工具

### 開發記錄
- [開發筆記](../../04-guides/dev-notes/INVENTORY_LOGGING_SYSTEM_FIX.md) - 詳細的修復記錄
- [API 服務](../api/api-services.md) - ServiceFactory 架構設計

### 系統架構
- [資料流設計](../architecture/data-flow.md) - 整體資料流架構
- [業務模組](../architecture/business-modules.md) - 業務模組關係圖