# 毛利分析功能備份

## 📊 功能概述

毛利分析功能提供完整的產品獲利能力分析，包括毛利率計算、產品排名、類別比較等功能。此功能因資料庫缺乏成本資料而暫時移除，待條件具備時可重新啟用。

## 🔧 技術實現

### 檔案結構
```
profitability-analysis/
├── composables/
│   └── useProfitabilityAnalysis.ts  # 毛利分析核心邏輯
├── components/
│   └── ProfitabilityDashboard.vue   # 毛利分析儀表板組件
└── README.md                        # 本說明檔案
```

### 核心功能
1. **毛利率計算**：`grossMargin = (grossProfit / totalRevenue) × 100%`
2. **產品獲利排名**：按毛利、營收、毛利率等維度排序
3. **類別毛利比較**：比較不同產品類別的獲利表現
4. **毛利趨勢分析**：追蹤毛利變化趨勢

### 分析指標
- **總毛利** (Total Gross Profit)
- **毛利率** (Gross Margin)
- **單位毛利** (Profit per Unit)
- **貢獻毛利** (Contribution Margin)

## 🗄️ 資料庫前置需求

### 1. 擴展 products 表
```sql
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN cost_updated_at TIMESTAMPTZ DEFAULT NOW();
```

### 2. 建立採購訂單表
```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  supplier_id UUID,
  unit_cost DECIMAL(10,2),
  quantity INTEGER,
  total_cost DECIMAL(10,2),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. 建立成本歷史表
```sql
CREATE TABLE cost_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  old_cost DECIMAL(10,2),
  new_cost DECIMAL(10,2),
  change_reason TEXT,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. 建立供應商表 (可選)
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info JSONB,
  rating DECIMAL(3,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 重新啟用步驟

### 1. 資料庫設定
1. 執行上述 SQL 腳本建立必要資料表
2. 匯入產品成本資料（可透過 CSV 或 API）
3. 驗證成本資料的完整性和準確性

### 2. 代碼恢復
1. 將 `useProfitabilityAnalysis.ts` 複製回 `src/composables/analytics/`
2. 將 `ProfitabilityDashboard.vue` 複製回 `src/components/analytics/`
3. 修改毛利分析邏輯使用真實成本資料而非模擬資料

### 3. 功能整合
1. 在 `ProductAnalyticsView.vue` 中恢復毛利分析標籤
2. 重新引入相關 composables 和組件
3. 更新 `analyticsTabs` 陣列加入毛利分析

### 4. 測試驗證
1. 驗證成本資料讀取正確
2. 確認毛利計算公式準確
3. 測試各種排序和篩選功能

## 📈 商業價值

### 直接效益
- **成本控制**：識別高成本產品，優化採購策略
- **定價策略**：基於成本結構制定合理定價
- **產品組合優化**：聚焦高毛利產品，淘汰低毛利商品

### 間接效益
- **供應商管理**：評估供應商成本競爭力
- **庫存優化**：減少低毛利產品庫存
- **經營決策**：提供數據驅動的商業洞察

## ⚠️ 注意事項

1. **成本資料品質**：確保成本資料的準確性和及時性
2. **隱私保護**：成本資料屬於商業機密，需要適當的權限控制
3. **算法調整**：可能需要根據實際業務情況調整毛利計算邏輯
4. **效能考量**：大量產品的毛利計算可能需要快取機制

## 📅 建議實施時程

1. **Week 1**: 資料庫設計和成本資料收集
2. **Week 2**: 後端 API 和成本管理功能開發
3. **Week 3**: 前端毛利分析功能恢復和測試
4. **Week 4**: 整合測試和使用者培訓

---

**備份日期**: 2025-07-25  
**備份版本**: v1.0  
**下次檢視**: Phase 2 實施時