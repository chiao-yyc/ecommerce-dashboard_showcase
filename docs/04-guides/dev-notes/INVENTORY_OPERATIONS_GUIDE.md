# 庫存操作開發指南

## 概述

此開發指南提供庫存管理系統的完整技術實現細節，包括 Edge Functions、前端組件、資料庫設計和最佳實踐。適用於開發團隊進行系統維護、擴展和故障排除。

## 系統架構

### 核心組件架構
```
Edge Functions (Supabase)
├── stock-in/           # 庫存入庫 API
├── stock-adjust/       # 庫存調整 API
└── _shared/cors.ts     # CORS 設定

Frontend (Vue 3 + TypeScript)
├── views/
│   └── InventoriesView.vue        # 庫存管理主頁面
├── components/
│   ├── product/ProductStockList.vue    # 產品庫存列表
│   ├── inventory/
│   │   ├── StockInFormSheet.vue         # 商品入庫表單
│   │   ├── InventoryAdjustmentDialog.vue # 庫存調整對話框
│   │   └── InventoryAdjustmentForm.vue   # 調整表單組件
│   └── data-table-async/                # 資料表格系統
└── composables/
    ├── useProduct.ts              # 產品庫存操作
    └── useInventoryRealtime.ts    # 庫存即時更新

Database (PostgreSQL)
├── tables/
│   ├── inventories              # 庫存記錄表
│   ├── inventory_logs           # 庫存變動日誌
│   └── products                 # 產品資料表
└── functions/
    ├── allocate_stock_fifo()    # FIFO 庫存分配
    └── adjust_inventory_stock() # 庫存調整
```

### 資料流架構
```
User Action → Frontend Component → Composable → Edge Function → Database Function → Database Tables
     ↓              ↓                 ↓             ↓              ↓                    ↓
   點擊操作 → 表單驗證 → API 呼叫 → 業務邏輯 → 資料庫操作 → 觸發器 → Realtime 更新
```

## Edge Functions 開發

### stock-in 入庫函數

#### 核心邏輯
```typescript
// 認證檢查 → 用戶解析 → 參數驗證 → 產品驗證 → 創建庫存記錄 → 更新日誌 → 計算總庫存
```

#### 關鍵特性
1. **雙身份認證**：支援 `users`（管理員）和 `customers`（客戶）兩種用戶類型
2. **自動日誌**：利用資料庫觸發器自動創建 `inventory_logs` 記錄
3. **手動補充**：事後更新日誌的創建者和來源資訊
4. **即時統計**：返回當前總庫存數量

#### 請求驗證邏輯
```typescript
// 必要欄位檢查
if (!product_id || !quantity || quantity <= 0) {
  return 400 // Bad Request
}

// 產品存在性檢查
const product = await supabaseClient
  .from("products")
  .select("id, name")
  .eq("id", product_id)
  .is("deleted_at", null)
  .single()
```

### stock-adjust 調整函數

#### 雙模式設計
1. **產品級別調整**（推薦）
   - 使用 `product_id` 參數
   - 自動處理最新庫存記錄
   - 智能創建新記錄（僅限正數調整）

2. **記錄級別調整**（專業模式）
   - 使用 `inventory_id` 參數
   - 精確控制特定庫存批次
   - 適合高級用戶和批量操作

#### 智能處理邏輯
```typescript
// 產品級調整的智能邏輯
if (latestInventory) {
  targetInventoryId = latestInventory.id;
} else {
  if (adjust_quantity <= 0) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Cannot reduce stock for product with no inventory records" 
    }), { status: 400 });
  }
  // 自動創建新庫存記錄用於正數調整
  const newInventory = await createInventoryRecord({
    product_id,
    quantity: adjust_quantity,
    note: `Initial stock adjustment: ${reason}`,
    received_at: new Date().toISOString()
  });
  targetInventoryId = newInventory.id;
}
```

## 前端組件開發

### shadcn-vue 設計系統

#### 使用的組件庫
```typescript
// 對話框系統
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// 表單系統  
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem } from '@/components/ui/select'

// 資料展示
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
```

### StockInFormSheet 入庫表單

#### 關鍵實現細節
```vue
<script setup lang="ts">
// 表單驗證邏輯
const isFormValid = computed(() => {
  const hasProduct = !!selectedProduct.value
  const hasValidQuantity = form.value.quantity > 0
  return hasProduct && hasValidQuantity
})

// 產品搜尋邏輯
const handleProductSearch = async () => {
  if (productSearchTerm.value.length < 2) {
    searchResults.value = []
    return
  }
  
  const result = await fetchProductsByKeyword(productSearchTerm.value)
  if (result.success && result.data) {
    searchResults.value = result.data
  }
}
</script>
```

#### 初始化修復
```typescript
// 修復按鈕一直停用的問題
const form = ref<StockInFormData>({
  quantity: 1,  // 關鍵：設為 1 而非 0
  source: 'manual_stock_in',
  note: '',
})

// 重置時也要保持有效狀態
const resetForm = () => {
  form.value = {
    quantity: 1,  // 重置時也設為 1
    source: 'manual_stock_in',
    note: '',
  }
}
```

### InventoryAdjustmentDialog 調整對話框

#### 產品級調整實現
```typescript
// Props 介面更新：支援 productId 而非 inventoryId
interface Props {
  open: boolean
  productId: string  // 改為使用 productId
  productName: string
  currentStock: number
  operatorName: string
}

// Emits 介面更新
interface Emits {
  'update:open': [value: boolean]
  success: [data: {
    productId: string    // 改為返回 productId
    adjustmentQuantity: number
    newStock: number
  }]
  error: [message: string]
}
```

### DataTableRowActions 操作按鈕

#### 關鍵修復
```vue
<script setup lang="ts">
// 修復前：錯誤使用 id 欄位
// @click="() => $emit('quickSetStock', props.row.original.id)"

// 修復後：正確使用 productId 欄位  
@click="() => $emit('quickSetStock', props.row.original.productId)"

// 類型定義更新
interface Props {
  row: {
    original: ProductWithStock  // 改為正確的類型
  }
}
</script>
```

## 資料庫設計

### FIFO 排序最佳化

#### 索引策略
```sql
-- FIFO 查詢最佳化索引
CREATE INDEX idx_inventories_fifo 
ON inventories(received_at ASC NULLS LAST, created_at ASC);

-- 庫存日誌查詢最佳化
CREATE INDEX idx_inventory_logs_allocation 
ON inventory_logs(inventory_id, type, created_at);
```

#### 查詢模式
```sql
-- FIFO 分配查詢
SELECT id, quantity, 
       (quantity - COALESCE(SUM(il.quantity), 0)) as available_stock
FROM inventories i
LEFT JOIN inventory_logs il ON i.id = il.inventory_id AND il.type = 'out'
WHERE i.product_id = $1 
  AND i.deleted_at IS NULL
  AND (quantity - COALESCE(SUM(il.quantity), 0)) > 0
GROUP BY i.id, i.quantity, i.received_at, i.created_at
ORDER BY i.received_at ASC NULLS LAST, i.created_at ASC;
```

### 觸發器設計

#### 自動日誌觸發器
```sql
-- 庫存記錄創建時自動建立入庫日誌
CREATE OR REPLACE FUNCTION create_inventory_log_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO inventory_logs (
    inventory_id,
    type,
    quantity,
    source,
    note,
    created_at
  ) VALUES (
    NEW.id,
    'in',
    NEW.quantity,
    'system',  -- 預設值，後續由應用層更新
    CONCAT('Stock in: ', NEW.quantity, ' units'),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inventory_log_on_insert
  AFTER INSERT ON inventories
  FOR EACH ROW
  EXECUTE FUNCTION create_inventory_log_on_insert();
```

## 🔄 Composable 設計

### useProduct.ts 庫存操作

#### 關鍵函數實現
```typescript
// 庫存調整函數：支援 productId 模式
export async function adjustInventory(
  productId: string,  // 改為接受 productId
  adjustData: {
    adjust_quantity: number
    reason: string
    source?: string
  }
) {
  try {
    const { data, error } = await supabase.functions.invoke('stock-adjust', {
      body: {
        product_id: productId,  // 使用 product_id 參數
        adjust_quantity: adjustData.adjust_quantity,
        reason: adjustData.reason,
        source: adjustData.source || 'manual_adjustment'
      }
    })

    if (error) throw error

    console.log(`🔧 產品 ${productId} 庫存調整完成:`, data)  // 修復變數引用
    return { success: true, data, error: null }
  } catch (error) {
    console.error('庫存調整失敗:', error)
    return { 
      success: false, 
      data: null, 
      error: error.message || '庫存調整失敗' 
    }
  }
}
```

### useInventoryRealtime.ts 即時更新

#### 庫存專用 Realtime
```typescript
// 專注庫存更新的 Realtime 系統
export function useInventoryRealtime() {
  const subscribeToInventory = (productId: string, callback: Function) => {
    const channel = supabase
      .channel(`inventory-${productId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'inventories',
        filter: `product_id=eq.${productId}`
      }, (payload) => {
        callback({
          eventType: 'stock_update',
          data: payload.new || payload.old
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  return { subscribeToInventory }
}
```

## 🧪 測試策略

### Edge Function 測試

#### 本地測試腳本
```bash
#!/bin/bash
# 庫存入庫測試
curl -X POST 'http://localhost:54321/functions/v1/stock-in' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "product_id": "550e8400-e29b-41d4-a716-446655440000",
    "quantity": 100,
    "source": "manual_stock_in",
    "note": "測試入庫"
  }'

# 庫存調整測試
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

### 前端組件測試

#### Vue Test Utils 測試範例
```typescript
import { mount } from '@vue/test-utils'
import StockInFormSheet from '@/components/inventory/StockInFormSheet.vue'

describe('StockInFormSheet', () => {
  it('should enable submit button when form is valid', async () => {
    const wrapper = mount(StockInFormSheet, {
      props: { open: true }
    })
    
    // 選擇產品
    await wrapper.setData({ 
      selectedProduct: { id: '123', name: 'Test Product' }
    })
    
    // 設定數量（預設為 1，應該已經有效）
    const submitButton = wrapper.find('[data-testid="submit-button"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })
})
```

## 🚨 錯誤處理與除錯

### 常見問題與解決方案

#### 1. 庫存調整對話框不顯示
**問題**：點擊調整按鈕沒有反應

**原因**：DataTableRowActions 中使用錯誤的欄位名稱

**解決方案**：
```typescript
// 錯誤用法
props.row.original.id

// 正確用法
props.row.original.productId
```

#### 2. 入庫按鈕一直停用
**問題**：即使填寫正確資料，按鈕仍然無法點擊

**原因**：初始 quantity 設為 0，導致表單驗證失敗

**解決方案**：
```typescript
// 設定初始值為 1
const form = ref({
  quantity: 1,  // 改為 1
  source: 'manual_stock_in',
  note: '',
})
```

#### 3. inventoryId is not defined 錯誤
**問題**：Console 出現變數未定義錯誤

**原因**：useProduct.ts 中仍使用舊的 inventoryId 變數

**解決方案**：
```typescript
// 修正 console.log 中的變數引用
console.log(`🔧 產品 ${productId} 庫存調整完成:`, data)
```

### 除錯工具

#### 前端除錯
```typescript
// 在 composable 中添加詳細日誌
export async function adjustInventory(productId: string, adjustData: any) {
  console.log('🔧 開始庫存調整:', { productId, adjustData })
  
  try {
    const response = await supabase.functions.invoke('stock-adjust', {
      body: { product_id: productId, ...adjustData }
    })
    
    console.log('✅ 調整成功:', response)
    return response
  } catch (error) {
    console.error('❌ 調整失敗:', error)
    throw error
  }
}
```

#### 資料庫除錯
```sql
-- 檢查庫存記錄
SELECT i.*, p.name as product_name,
       (i.quantity - COALESCE(SUM(il.quantity), 0)) as available_stock
FROM inventories i
JOIN products p ON i.product_id = p.id
LEFT JOIN inventory_logs il ON i.id = il.inventory_id AND il.type = 'out'
WHERE i.product_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY i.id, p.name
ORDER BY i.received_at ASC NULLS LAST, i.created_at ASC;

-- 檢查日誌記錄
SELECT il.*, i.product_id, p.name as product_name
FROM inventory_logs il
JOIN inventories i ON il.inventory_id = i.id
JOIN products p ON i.product_id = p.id
WHERE i.product_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY il.created_at DESC;
```

## 📈 效能優化

### 前端優化

#### 1. 虛擬化長列表
```vue
<!-- 對於大量庫存記錄，使用虛擬滾動 -->
<template>
  <VirtualList
    :items="inventoryItems"
    :item-height="60"
    :visible-count="20"
  >
    <template #item="{ item }">
      <InventoryItem :inventory="item" />
    </template>
  </VirtualList>
</template>
```

#### 2. 防抖搜尋
```typescript
// 產品搜尋防抖處理
import { debounce } from 'lodash-es'

const handleProductSearch = debounce(async () => {
  if (productSearchTerm.value.length < 2) return
  
  const result = await fetchProductsByKeyword(productSearchTerm.value)
  searchResults.value = result.data || []
}, 300)
```

### 資料庫優化

#### 1. 查詢優化
```sql
-- 使用部分索引提升效能
CREATE INDEX idx_inventories_active 
ON inventories(product_id, received_at) 
WHERE deleted_at IS NULL;

-- 庫存統計視圖優化
CREATE MATERIALIZED VIEW inventory_summary AS
SELECT 
  product_id,
  SUM(quantity) as total_stock,
  SUM(quantity - COALESCE(out_quantity, 0)) as available_stock,
  COUNT(*) as batch_count
FROM inventories i
LEFT JOIN (
  SELECT inventory_id, SUM(quantity) as out_quantity
  FROM inventory_logs
  WHERE type = 'out'
  GROUP BY inventory_id
) il ON i.id = il.inventory_id
WHERE i.deleted_at IS NULL
GROUP BY product_id;
```

#### 2. 連接池配置
```typescript
// Supabase 客戶端優化配置
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10  // 限制即時事件頻率
    }
  }
})
```

## 安全性考量

### 資料驗證

#### Edge Function 安全
```typescript
// 輸入驗證和清理
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"'%;()&+]/g, '').slice(0, 500)
}

// 數量範圍驗證
const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && 
         quantity > 0 && 
         quantity <= 1000000  // 設定合理上限
}
```

#### 權限檢查
```typescript
// 檢查用戶是否有庫存管理權限
async function hasInventoryPermission(userId: string): Promise<boolean> {
  const { data } = await supabaseClient
    .from('user_permissions')
    .select('permissions')
    .eq('user_id', userId)
    .single()
    
  return data?.permissions?.includes('inventory_management') || false
}
```

### 資料完整性

#### 樂觀鎖定
```sql
-- 使用版本號防止併發衝突
ALTER TABLE inventories ADD COLUMN version INTEGER DEFAULT 1;

-- 更新時檢查版本號
UPDATE inventories 
SET quantity = $1, version = version + 1
WHERE id = $2 AND version = $3;
```

## 🔮 未來擴展

### 計劃功能

#### 1. 批量操作
```typescript
// 批量庫存調整介面
interface BatchAdjustment {
  adjustments: Array<{
    productId: string
    quantity: number
    reason: string
  }>
  operator: string
  notes?: string
}
```

#### 2. 庫存預警
```typescript
// 庫存警報系統
interface StockAlert {
  productId: string
  alertType: 'low_stock' | 'out_of_stock' | 'overstock'
  threshold: number
  currentStock: number
  severity: 'info' | 'warning' | 'critical'
}
```

#### 3. 庫存分析
```typescript
// 庫存分析介面
interface InventoryAnalytics {
  turnoverRate: number
  avgDaysToSell: number
  slowMovingItems: string[]
  fastMovingItems: string[]
  abcAnalysis: {
    A: string[]  // 高價值產品
    B: string[]  // 中價值產品
    C: string[]  // 低價值產品
  }
}
```

## 開發檢查清單

### 新功能開發
- [ ] **需求分析**：明確功能需求和業務規則
- [ ] **API 設計**：設計 RESTful API 介面
- [ ] **資料庫設計**：設計資料表結構和索引
- [ ] **Edge Function**：實現後端業務邏輯
- [ ] **前端組件**：開發 Vue 組件和 Composable
- [ ] **測試覆蓋**：撰寫單元測試和整合測試
- [ ] **文檔更新**：更新 API 文檔和使用指南
- [ ] **效能測試**：進行載入測試和效能優化
- [ ] **安全檢查**：進行安全性審查和滲透測試
- [ ] **部署驗證**：在測試環境驗證完整功能

### 問題修復
- [ ] **問題重現**：在本地環境重現問題
- [ ] **根因分析**：分析問題的根本原因
- [ ] **解決方案**：設計並實現修復方案
- [ ] **測試驗證**：確認問題已完全解決
- [ ] **回歸測試**：確保修復不影響其他功能
- [ ] **文檔更新**：更新相關文檔和故障排除指南
- [ ] **部署上線**：部署到生產環境並監控

## 相關資源

### 技術文檔
- [庫存管理系統架構](../../02-development/database/inventory-system.md)
- [API 端點規格](../../02-development/api/inventory-operations.md)
- [用戶操作指南](../user-guide/inventory-management.md)

### 外部資源
- [Supabase Edge Functions 文檔](https://supabase.com/docs/guides/functions)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [shadcn-vue 組件庫](https://www.shadcn-vue.com/)
- [PostgreSQL 效能調校](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

*此開發指南會隨系統更新持續維護*