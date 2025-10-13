-- =================================================================
-- FIFO 功能驗證測試腳本
-- =================================================================
-- 
-- 此腳本用於驗證 FIFO 庫存扣除功能是否正確運作
-- 使用方法：
-- 1. 先執行設置測試資料的部分
-- 2. 執行庫存扣除測試
-- 3. 檢查結果是否符合 FIFO 順序
-- =================================================================

-- Step 1: 尋找測試用的產品 ID
SELECT 
  p.id,
  p.name,
  p.sku,
  COUNT(i.id) as inventory_count,
  SUM(i.quantity) as total_initial_stock,
  SUM(COALESCE(
    i.quantity - (
      SELECT COALESCE(SUM(l.quantity), 0)
      FROM inventory_logs l
      WHERE l.inventory_id = i.id AND l.type = 'out'
    ), 0
  )) as total_available_stock
FROM products p
LEFT JOIN inventories i ON p.id = i.product_id AND i.deleted_at IS NULL
GROUP BY p.id, p.name, p.sku
HAVING COUNT(i.id) > 1  -- 只顯示有多個庫存記錄的產品
ORDER BY inventory_count DESC
LIMIT 5;

-- Step 2: 檢查特定產品的庫存記錄排序
-- 請將下面的 'YOUR_PRODUCT_ID' 替換為從 Step 1 取得的產品 ID
WITH product_inventories AS (
  SELECT 
    i.id as inventory_id,
    i.quantity as initial_quantity,
    i.received_at,
    i.created_at,
    COALESCE(
      i.quantity - (
        SELECT COALESCE(SUM(l.quantity), 0)
        FROM inventory_logs l
        WHERE l.inventory_id = i.id AND l.type = 'out'
      ), 0
    ) AS current_stock,
    -- 模擬 FIFO 函數的排序邏輯
    ROW_NUMBER() OVER (ORDER BY i.received_at ASC NULLS LAST) as fifo_order
  FROM inventories i
  WHERE i.product_id = '77fd820c-3cb1-4313-a0c3-0c007d21c23b'  -- 替換產品 ID
    AND i.deleted_at IS NULL
    AND i.quantity > 0
)
SELECT 
  inventory_id,
  initial_quantity,
  current_stock,
  received_at,
  created_at,
  fifo_order,
  CASE 
    WHEN received_at IS NULL THEN '⚠️ NULL received_at - 可能影響 FIFO'
    WHEN current_stock > 0 THEN '✅ 有庫存'
    ELSE '❌ 已扣完'
  END as status
FROM product_inventories
ORDER BY fifo_order;

-- Step 3: 檢查最近的庫存扣除記錄是否遵循 FIFO
WITH recent_allocations AS (
  SELECT 
    il.id,
    il.inventory_id,
    il.quantity as allocated_qty,
    il.created_at as allocation_time,
    il.ref_id as order_id,
    i.received_at as inventory_received_at,
    i.created_at as inventory_created_at,
    ROW_NUMBER() OVER (
      PARTITION BY il.ref_id 
      ORDER BY il.created_at ASC
    ) as allocation_sequence
  FROM inventory_logs il
  JOIN inventories i ON il.inventory_id = i.id
  WHERE il.type = 'out' 
    AND il.source = 'order'
    AND i.product_id = '77fd820c-3cb1-4313-a0c3-0c007d21c23b'  -- 替換產品 ID
    AND il.created_at >= NOW() - INTERVAL '1 hour'  -- 最近一小時的分配
)
SELECT 
  order_id,
  allocation_sequence,
  inventory_id,
  allocated_qty,
  inventory_received_at,
  inventory_created_at,
  allocation_time,
  -- 檢查是否按照 FIFO 順序分配
  CASE 
    WHEN LAG(inventory_received_at) OVER (
      PARTITION BY order_id 
      ORDER BY allocation_sequence
    ) IS NULL THEN '🟢 第一筆分配'
    WHEN LAG(inventory_received_at) OVER (
      PARTITION BY order_id 
      ORDER BY allocation_sequence
    ) <= inventory_received_at THEN '🟢 FIFO 正確'
    ELSE '🔴 FIFO 錯誤！'
  END as fifo_check
FROM recent_allocations
ORDER BY order_id, allocation_sequence;

-- Step 4: 模擬 FIFO 分配測試
-- 此查詢模擬如果要分配 5 個單位，應該從哪些庫存記錄扣除
WITH fifo_simulation AS (
  SELECT 
    i.id as inventory_id,
    i.quantity as initial_quantity,
    i.received_at,
    COALESCE(
      i.quantity - (
        SELECT COALESCE(SUM(l.quantity), 0)
        FROM inventory_logs l
        WHERE l.inventory_id = i.id AND l.type = 'out'
      ), 0
    ) AS current_stock,
    ROW_NUMBER() OVER (ORDER BY i.received_at ASC NULLS LAST) as fifo_order
  FROM inventories i
  WHERE i.product_id = '77fd820c-3cb1-4313-a0c3-0c007d21c23b'  -- 替換產品 ID
    AND i.deleted_at IS NULL
    AND i.quantity > 0
),
allocation_plan AS (
  SELECT 
    inventory_id,
    current_stock,
    received_at,
    fifo_order,
    -- 模擬累計分配 5 個單位
    SUM(current_stock) OVER (
      ORDER BY fifo_order 
      ROWS UNBOUNDED PRECEDING
    ) as cumulative_stock,
    CASE 
      WHEN SUM(current_stock) OVER (
        ORDER BY fifo_order 
        ROWS UNBOUNDED PRECEDING
      ) <= 5 THEN current_stock
      WHEN LAG(SUM(current_stock)) OVER (
        ORDER BY fifo_order
      ) < 5 THEN 5 - COALESCE(LAG(SUM(current_stock)) OVER (ORDER BY fifo_order), 0)
      ELSE 0
    END as should_allocate
  FROM fifo_simulation
  WHERE current_stock > 0
)
SELECT 
  inventory_id,
  current_stock,
  received_at,
  fifo_order,
  should_allocate,
  CASE 
    WHEN should_allocate > 0 THEN '✅ 應該從此庫存扣除 ' || should_allocate || ' 個單位'
    ELSE '⭕ 不需要從此庫存扣除'
  END as allocation_plan
FROM allocation_plan
ORDER BY fifo_order;

-- Step 5: 檢查 received_at 欄位的資料品質
SELECT 
  'received_at 欄位統計' as check_type,
  COUNT(*) as total_records,
  COUNT(received_at) as has_received_at,
  COUNT(*) - COUNT(received_at) as null_received_at,
  ROUND(
    (COUNT(received_at)::numeric / COUNT(*)::numeric) * 100, 2
  ) as percentage_with_received_at
FROM inventories i
WHERE i.product_id = '77fd820c-3cb1-4313-a0c3-0c007d21c23b'  -- 替換產品 ID
  AND i.deleted_at IS NULL

UNION ALL

SELECT 
  'received_at vs created_at 差異' as check_type,
  COUNT(*) as total_records,
  COUNT(CASE 
    WHEN received_at IS NOT NULL AND received_at != created_at 
    THEN 1 
  END) as different_timestamps,
  COUNT(CASE 
    WHEN received_at IS NULL 
    THEN 1 
  END) as null_received_at,
  ROUND(
    (COUNT(CASE WHEN received_at IS NOT NULL AND received_at != created_at THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2
  ) as percentage_different
FROM inventories i
WHERE i.product_id = '77fd820c-3cb1-4313-a0c3-0c007d21c23b'  -- 替換產品 ID
  AND i.deleted_at IS NULL;

-- =================================================================
-- 使用說明
-- =================================================================
/*
1. 執行 Step 1 找到有多個庫存記錄的產品
2. 將產品 ID 替換到後續查詢中的 '77fd820c-3cb1-4313-a0c3-0c007d21c23b'
3. 執行 Step 2-5 檢查 FIFO 是否運作正常
4. 如果發現問題，執行對應的修復 migration
5. 重複測試確認修復效果

期望結果：
- Step 2: 庫存記錄應該按 received_at 時間順序排列
- Step 3: 最近的分配記錄應該顯示 "🟢 FIFO 正確"
- Step 4: 分配計劃應該從最早的庫存開始
- Step 5: received_at 欄位應該有適當的資料品質
*/