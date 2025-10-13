# 庫存操作 API 文檔

> **最後更新**: 2025-10-07
> **業務重要性**: ⭐⭐⭐ (庫存管理)

---
## 概覽

庫存操作 API 提供完整的庫存管理功能，包括入庫、出庫和調整操作。所有操作都通過 Edge Functions 實現，確保資料一致性和業務邏輯的正確性。

### 核心特性
- **FIFO 庫存分配**：自動按先進先出原則分配庫存
- **雙模式調整**：支援產品級別和記錄級別的庫存調整
- **完整審計**：所有操作都有完整的記錄和追蹤
- **實時同步**：支援 Realtime 即時庫存狀態更新

## API 端點

### 1. 庫存入庫 - `stock-in`

#### **基本資訊**
- **端點**：`POST /functions/v1/stock-in`
- **認證**：Bearer Token（支援管理員和客戶雙身份）
- **功能**：新增庫存記錄，自動建立入庫歷史

#### **請求格式**
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "source": "manual_stock_in",
  "note": "供應商A進貨",
  "received_at": "2025-07-30T10:00:00.000Z"
}
```

#### **參數說明**
| 參數 | 類型 | 必須 | 說明 |
|------|------|------|------|
| `product_id` | string | ✅ | 產品UUID |
| `quantity` | number | ✅ | 入庫數量（正整數） |
| `source` | string | ❌ | 入庫來源（預設：`manual_stock_in`） |
| `note` | string | ❌ | 備註說明 |
| `received_at` | string | ❌ | 收貨時間（ISO格式，預設：當前時間） |

#### **來源類型 (source)**
| 值 | 說明 |
|--------|----------|
| `manual_stock_in` | 手動入庫 |
| `purchase_order` | 採購入庫 |
| `return_goods` | 退貨入庫 |
| `transfer_in` | 調撥入庫 |
| `production_complete` | 生產完成 |
| `supplier_direct` | 供應商直送 |
| `other` | 其他來源 |

#### **成功響應**
```json
{
  "success": true,
  "inventory_id": "660e8400-e29b-41d4-a716-446655440001",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "quantity": 100,
  "current_stock": 150,
  "message": "庫存入庫成功"
}
```

#### **錯誤響應**
```json
{
  "success": false,
  "error": "產品不存在或已刪除"
}
```

### 2. 庫存調整 - `stock-adjust`

#### **基本資訊**
- **端點**：`POST /functions/v1/stock-adjust`
- **認證**：Bearer Token（支援管理員和客戶雙身份）
- **功能**：調整現有庫存數量，支援增加和減少

#### **產品級別調整**（推薦）
```json
{
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "adjust_quantity": 15,
  "reason": "inventory_audit_increase",
  "source": "manual_adjustment"
}
```

#### **記錄級別調整**（專業模式）
```json
{
  "inventory_id": "660e8400-e29b-41d4-a716-446655440001",
  "adjust_quantity": -5,
  "reason": "damage_writeoff",
  "source": "inventory_audit"
}
```

#### **參數說明**
| 參數 | 類型 | 必須 | 說明 |
|------|------|------|------|
| `product_id` | string | ✅* | 產品UUID（與inventory_id二選一） |
| `inventory_id` | string | ✅* | 庫存記錄UUID（與product_id二選一） |
| `adjust_quantity` | number | ✅ | 調整數量（正數增加，負數減少） |
| `reason` | string | ✅ | 調整原因代碼 |
| `source` | string | ❌ | 調整來源（預設：`manual_adjustment`） |

#### **調整原因代碼 (reason)**

##### **增加庫存原因**
| 代碼 | 說明 | 使用場景 |
|------|------|----------|
| `inventory_audit_increase` | 盤點發現額外庫存 | 定期盤點發現實際庫存多於系統記錄 |
| `return_goods` | 退貨入庫 | 客戶退貨或供應商退換貨 |
| `supplier_compensation` | 供應商補償 | 供應商因品質問題等原因的補償 |
| `miscount_correction` | 計數錯誤修正 | 先前記錄錯誤的修正 |

##### **減少庫存原因**
| 代碼 | 說明 | 使用場景 |
|------|------|----------|
| `inventory_audit_decrease` | 盤點發現庫存短缺 | 定期盤點發現實際庫存少於系統記錄 |
| `damage_writeoff` | 損壞報廢 | 商品損壞無法銷售 |
| `expired_removal` | 過期移除 | 過期商品的清理 |
| `loss_theft` | 丟失或失竊 | 庫存遺失或被盜 |
| `quality_issue` | 品質問題 | 品質不合格的商品移除 |

##### **通用原因**
| 代碼 | 說明 | 使用場景 |
|------|------|----------|
| `other` | 其他原因 | 需要填寫自定義原因說明 |

#### **成功響應**
```json
{
  "success": true,
  "inventory_id": "660e8400-e29b-41d4-a716-446655440001",
  "adjustment_quantity": 15,
  "adjustment_type": "increase",
  "previous_available_stock": 50,
  "new_available_stock": 65,
  "reason": "inventory_audit_increase",
  "message": "庫存調整成功"
}
```

#### **錯誤響應**
```json
{
  "success": false,
  "error": "無法減少不存在的庫存記錄"
}
```

## ⚙️ 調整規則

### **產品級別調整規則**
1. **最新記錄優先**：總是針對 `created_at` 最新的庫存記錄
2. **智能處理**：
   - **增加庫存 + 無記錄**：自動創建新庫存記錄
   - **減少庫存 + 無記錄**：拒絕操作，返回錯誤
3. **自動創建記錄格式**：
   ```json
   {
     "product_id": "產品ID",
     "quantity": "調整數量",
     "note": "Initial stock adjustment: 調整原因",
     "received_at": "當前時間"
   }
   ```

### **業務限制**
1. **數量限制**：
   - 調整數量不能為0
   - 減少庫存不能超過當前可用庫存
2. **權限控制**：
   - 支援管理員用戶（users表）
   - 支援客戶用戶（customers表）
   - 自動記錄操作者資訊

## 🚨 錯誤處理

### 常見錯誤碼
| HTTP狀態碼 | 錯誤類型 | 說明 |
|-----------|----------|------|
| 400 | 參數錯誤 | 缺少必要參數或參數格式錯誤 |
| 401 | 認證失敗 | 缺少或無效的Authorization header |
| 404 | 資源不存在 | 產品或庫存記錄不存在 |
| 500 | 伺服器錯誤 | 資料庫操作失敗或其他內部錯誤 |

### 錯誤響應格式
```json
{
  "success": false,
  "error": "具體錯誤訊息"
}
```

## 🔍 使用範例

### JavaScript/TypeScript
```typescript
// 庫存入庫
const stockInResponse = await fetch('/functions/v1/stock-in', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'product-uuid',
    quantity: 50,
    source: 'purchase_order',
    note: '供應商A進貨',
    received_at: '2025-07-30T10:00:00.000Z'
  })
})

// 產品級別庫存調整
const adjustResponse = await fetch('/functions/v1/stock-adjust', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    product_id: 'product-uuid',
    adjust_quantity: -10,
    reason: 'damage_writeoff',
    source: 'inventory_audit'
  })
})
```

### cURL
```bash
# 庫存入庫
curl -X POST 'http://localhost:54321/functions/v1/stock-in' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 100,
    "source": "manual_stock_in",
    "note": "手動入庫測試"
  }'

# 庫存調整
curl -X POST 'http://localhost:54321/functions/v1/stock-adjust' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "adjust_quantity": 25,
    "reason": "inventory_audit_increase",
    "source": "manual_adjustment"
  }'
```

## 相關文檔
- [庫存管理系統](../database/inventory-system.md) - 系統架構和資料表設計
- [用戶操作指南](../../04-guides/user-guide/inventory-management.md) - 用戶介面操作說明
- [開發指南](../../04-guides/dev-notes/INVENTORY_OPERATIONS_GUIDE.md) - 開發實現細節