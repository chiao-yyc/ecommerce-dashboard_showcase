-- =================================================================
-- FIFO 修復效果快速驗證腳本
-- =================================================================
-- 
-- 此腳本用於快速驗證 FIFO 庫存扣除是否正常運作
-- 執行前請先部署所有相關 migrations
-- =================================================================

-- Step 1: 檢查資料品質修復效果
-- =================================================================

SELECT 
  '=== 資料品質檢查 ===' as check_title,
  COUNT(*) as total_inventories,
  COUNT(received_at) as has_received_at,
  COUNT(*) - COUNT(received_at) as null_received_at,
  CASE 
    WHEN COUNT(*) - COUNT(received_at) = 0 THEN '✅ 所有記錄都有 received_at'
    ELSE '❌ 仍有 ' || (COUNT(*) - COUNT(received_at)) || ' 筆 NULL 記錄'
  END as status
FROM inventories 
WHERE deleted_at IS NULL;

-- Step 2: 檢查 NOT NULL 約束是否設定成功
-- =================================================================

SELECT 
  '=== 約束檢查 ===' as check_title,
  column_name,
  is_nullable,
  column_default,
  CASE 
    WHEN is_nullable = 'NO' THEN '✅ NOT NULL 約束已設定'
    ELSE '❌ 約束未設定'
  END as constraint_status
FROM information_schema.columns 
WHERE table_name = 'inventories' 
  AND column_name = 'received_at';

-- Step 3: 檢查 FIFO 函數是否包含修復
-- =================================================================

SELECT 
  '=== FIFO 函數檢查 ===' as check_title,
  p.proname as function_name,
  CASE 
    WHEN pg_get_functiondef(p.oid) LIKE '%NULLS LAST%' THEN '✅ FIFO 排序已修復'
    ELSE '❌ FIFO 排序未修復'
  END as fifo_status
FROM pg_proc p
WHERE p.proname = 'allocate_stock_fifo';

-- Step 4: 找一個有多筆庫存的產品進行 FIFO 測試
-- =================================================================

WITH product_with_multiple_inventories AS (
  SELECT 
    i.product_id,
    p.name as product_name,
    COUNT(i.id) as inventory_count,
    SUM(COALESCE(
      i.quantity - (
        SELECT COALESCE(SUM(l.quantity), 0)
        FROM inventory_logs l
        WHERE l.inventory_id = i.id AND l.type = 'out'
      ), 0
    )) as total_available_stock
  FROM inventories i
  JOIN products p ON i.product_id = p.id
  WHERE i.deleted_at IS NULL
    AND i.quantity > 0
  GROUP BY i.product_id, p.name
  HAVING COUNT(i.id) > 1 
    AND SUM(COALESCE(
      i.quantity - (
        SELECT COALESCE(SUM(l.quantity), 0)
        FROM inventory_logs l
        WHERE l.inventory_id = i.id AND l.type = 'out'
      ), 0
    )) > 0
  ORDER BY inventory_count DESC
  LIMIT 1
),
fifo_order_test AS (
  SELECT 
    p.product_id,
    p.product_name,
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
    ROW_NUMBER() OVER (ORDER BY i.received_at ASC NULLS LAST, i.created_at ASC) as fifo_order
  FROM product_with_multiple_inventories p
  JOIN inventories i ON i.product_id = p.product_id
  WHERE i.deleted_at IS NULL
    AND i.quantity > 0
)
SELECT 
  '=== FIFO 順序測試 ===' as check_title,
  product_name,
  fifo_order,
  inventory_id,
  initial_quantity,
  current_stock,
  received_at,
  created_at,
  CASE 
    WHEN fifo_order = 1 THEN '🥇 最優先扣除 (最舊)'
    WHEN fifo_order = 2 THEN '🥈 次優先扣除'
    WHEN fifo_order = 3 THEN '🥉 第三優先扣除'
    ELSE '📦 第 ' || fifo_order || ' 優先扣除'
  END as priority_status
FROM fifo_order_test
ORDER BY fifo_order
LIMIT 5;

-- Step 5: 檢查最近訂單的庫存扣除是否遵循 FIFO
-- =================================================================

WITH recent_order_allocations AS (
  SELECT 
    il.ref_id as order_id,
    il.inventory_id,
    il.quantity as allocated_qty,
    il.created_at as allocation_time,
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
    AND il.created_at >= NOW() - INTERVAL '1 hour'  -- 最近一小時
  ORDER BY il.ref_id, allocation_sequence
  LIMIT 10
)
SELECT 
  '=== 最近訂單 FIFO 檢查 ===' as check_title,
  order_id,
  allocation_sequence,
  inventory_id,
  allocated_qty,
  inventory_received_at,
  allocation_time,
  CASE 
    WHEN LAG(inventory_received_at) OVER (
      PARTITION BY order_id 
      ORDER BY allocation_sequence
    ) IS NULL THEN '🟢 第一筆分配'
    WHEN LAG(inventory_received_at) OVER (
      PARTITION BY order_id 
      ORDER BY allocation_sequence
    ) <= inventory_received_at THEN '🟢 FIFO 正確'
    ELSE '🔴 FIFO 錯誤！較新庫存先被分配'
  END as fifo_check
FROM recent_order_allocations
ORDER BY order_id, allocation_sequence;

-- Step 6: 總結檢查結果
-- =================================================================

DO $$
DECLARE
    null_count INTEGER;
    constraint_ok BOOLEAN;
    fifo_fixed BOOLEAN;
BEGIN
    -- 檢查 NULL 值
    SELECT COUNT(*) INTO null_count 
    FROM inventories 
    WHERE received_at IS NULL AND deleted_at IS NULL;
    
    -- 檢查約束
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventories' 
            AND column_name = 'received_at' 
            AND is_nullable = 'NO'
    ) INTO constraint_ok;
    
    -- 檢查 FIFO 修復
    SELECT EXISTS(
        SELECT 1 FROM pg_proc p
        WHERE p.proname = 'allocate_stock_fifo'
          AND pg_get_functiondef(p.oid) LIKE '%NULLS LAST%'
    ) INTO fifo_fixed;
    
    RAISE NOTICE '=== 修復總結 ===';
    
    IF null_count = 0 THEN
        RAISE NOTICE '✅ 資料品質：所有記錄都有 received_at 值';
    ELSE
        RAISE NOTICE '❌ 資料品質：仍有 % 筆記錄缺少 received_at 值', null_count;
    END IF;
    
    IF constraint_ok THEN
        RAISE NOTICE '✅ 欄位約束：received_at NOT NULL 約束已設定';
    ELSE
        RAISE NOTICE '❌ 欄位約束：received_at NOT NULL 約束未設定';
    END IF;
    
    IF fifo_fixed THEN
        RAISE NOTICE '✅ FIFO 排序：allocate_stock_fifo 函數已修復';
    ELSE
        RAISE NOTICE '❌ FIFO 排序：allocate_stock_fifo 函數未修復';
    END IF;
    
    IF null_count = 0 AND constraint_ok AND fifo_fixed THEN
        RAISE NOTICE '🎉 所有修復項目都已完成！FIFO 庫存扣除應該正常運作';
    ELSE
        RAISE NOTICE '⚠️  部分修復項目未完成，請檢查並重新執行相關 migrations';
    END IF;
END $$;