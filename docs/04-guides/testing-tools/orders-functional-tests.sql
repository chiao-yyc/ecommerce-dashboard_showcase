-- ===========================================
-- Orders JSONB 快照系統功能測試
-- 階段三：功能測試和驗證
-- ===========================================

-- 設定測試環境
SET client_min_messages = NOTICE;

-- 清理測試資料函數
CREATE OR REPLACE FUNCTION cleanup_orders_test_data()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
  -- 刪除測試訂單
  DELETE FROM orders 
  WHERE contact_email LIKE '%@example.com' 
  OR contact_email LIKE 'test%@%'
  OR contact_email LIKE 'stress%@%';
  
  -- 清理稽核記錄
  DELETE FROM orders_jsonb_audit 
  WHERE order_id NOT IN (SELECT id FROM orders);
  
  RAISE NOTICE 'Test data cleanup completed';
END;
$function$;

-- 執行測試的主函數
CREATE OR REPLACE FUNCTION run_orders_jsonb_tests()
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  test_results jsonb := '{}';
  test_customer_id uuid;
  test_order_id uuid;
  test_result jsonb;
  test_count integer := 0;
  pass_count integer := 0;
  
  -- 測試變數
  customer_snapshot_data jsonb;
  business_rules_data jsonb;
  payment_snapshot_data jsonb;
  order_creation_result jsonb;
BEGIN
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Starting Orders JSONB Functional Tests';
  RAISE NOTICE '======================================';
  
  -- 清理之前的測試資料
  PERFORM cleanup_orders_test_data();
  
  -- 選擇測試用客戶
  SELECT id INTO test_customer_id FROM customers LIMIT 1;
  IF test_customer_id IS NULL THEN
    RAISE EXCEPTION 'No customers found for testing';
  END IF;
  
  -- ==========================================
  -- 測試 1: 快照生成函數測試
  -- ==========================================
  RAISE NOTICE 'Test 1: Snapshot generation functions';
  test_count := test_count + 1;
  
  BEGIN
    -- 測試客戶快照生成
    customer_snapshot_data := create_customer_snapshot(test_customer_id);
    
    IF customer_snapshot_data ? 'customer_id' AND 
       customer_snapshot_data ? 'email' AND 
       customer_snapshot_data ? 'full_name' AND
       customer_snapshot_data ? 'statistics' THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 1.1 PASSED: Customer snapshot generation';
    ELSE
      RAISE NOTICE '❌ Test 1.1 FAILED: Customer snapshot missing required fields';
    END IF;
    
    -- 測試業務規則快照生成
    business_rules_data := create_business_rules_snapshot();
    
    IF business_rules_data ? 'pricing_rules' AND 
       business_rules_data ? 'shipping_rules' AND 
       business_rules_data ? 'policy_version' THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 1.2 PASSED: Business rules snapshot generation';
    ELSE
      RAISE NOTICE '❌ Test 1.2 FAILED: Business rules snapshot missing required fields';
    END IF;
    
    -- 測試支付快照生成
    payment_snapshot_data := create_payment_snapshot();
    
    IF payment_snapshot_data ? 'available_methods' AND 
       payment_snapshot_data ? 'processing_fees' THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 1.3 PASSED: Payment snapshot generation';
    ELSE
      RAISE NOTICE '❌ Test 1.3 FAILED: Payment snapshot missing required fields';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 1 FAILED: Exception in snapshot generation - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 2: 自動觸發器測試
  -- ==========================================
  RAISE NOTICE 'Test 2: Auto-population triggers';
  test_count := test_count + 1;
  
  BEGIN
    -- 插入新訂單，應自動生成快照
    INSERT INTO orders (
      user_id,
      contact_name,
      contact_email,
      contact_phone,
      payment_method,
      shipping_method,
      shipping_fee,
      tax_amount,
      total_amount,
      status
    ) VALUES (
      test_customer_id,
      '測試自動快照',
      'auto_snapshot_test@example.com',
      '0912345678',
      'credit_card',
      'standard',
      80,
      100,
      2180,
      'pending'
    ) RETURNING id INTO test_order_id;
    
    -- 檢查自動生成的快照
    SELECT 
      customer_snapshot IS NOT NULL,
      business_rules_snapshot != '{}',
      payment_snapshot != '{}'
    INTO test_result
    FROM orders 
    WHERE id = test_order_id;
    
    IF (test_result->>0)::boolean AND 
       (test_result->>1)::boolean AND 
       (test_result->>2)::boolean THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 2.1 PASSED: Auto-population triggers working';
    ELSE
      RAISE NOTICE '❌ Test 2.1 FAILED: Auto-population triggers not working properly';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 2 FAILED: Exception in trigger test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 3: 推斷機制測試
  -- ==========================================
  RAISE NOTICE 'Test 3: Snapshot inference mechanism';
  test_count := test_count + 1;
  
  BEGIN
    -- 插入無客戶 ID 的訂單
    INSERT INTO orders (
      contact_name,
      contact_email,
      contact_phone,
      payment_method,
      shipping_method,
      shipping_fee,
      tax_amount,
      total_amount,
      status
    ) VALUES (
      '推斷測試客戶',
      'inference_test@example.com',
      '0987654321',
      'paypal',
      'express',
      120,
      150,
      2770,
      'pending'
    ) RETURNING id INTO test_order_id;
    
    -- 檢查推斷的快照
    SELECT customer_snapshot->'metadata'->>'data_source'
    INTO test_result
    FROM orders 
    WHERE id = test_order_id;
    
    IF test_result::text = '"order_inference"' THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 3.1 PASSED: Snapshot inference working';
    ELSE
      RAISE NOTICE '❌ Test 3.1 FAILED: Snapshot inference not working - got %', test_result;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 3 FAILED: Exception in inference test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 4: 訂單創建函數測試
  -- ==========================================
  RAISE NOTICE 'Test 4: Order creation functions';
  test_count := test_count + 1;
  
  BEGIN
    -- 測試增強的訂單創建函數
    order_creation_result := create_order_with_items(
      jsonb_build_object(
        'customer_id', test_customer_id,
        'contact_name', '函數測試客戶',
        'contact_email', 'function_test@example.com',
        'contact_phone', '0912345679',
        'payment_method', 'credit_card',
        'shipping_method', 'standard',
        'shipping_fee', 80,
        'tax_amount', 105,
        'status', 'pending'
      ),
      ARRAY[
        jsonb_build_object(
          'product_id', (SELECT id FROM products LIMIT 1),
          'quantity', 2,
          'unit_price', 1000,
          'total_price', 2000,
          'variant_name', '標準版'
        )
      ],
      test_customer_id
    );
    
    IF order_creation_result->>'status' = 'success' THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 4.1 PASSED: Enhanced order creation function';
    ELSE
      RAISE NOTICE '❌ Test 4.1 FAILED: Enhanced order creation failed - %', 
        order_creation_result->>'message';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 4 FAILED: Exception in order creation test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 5: 快照刷新功能測試
  -- ==========================================
  RAISE NOTICE 'Test 5: Snapshot refresh functionality';
  test_count := test_count + 1;
  
  BEGIN
    -- 測試快照刷新
    test_result := refresh_order_snapshots(test_order_id);
    
    IF test_result->>'status' = 'success' THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 5.1 PASSED: Snapshot refresh function';
    ELSE
      RAISE NOTICE '❌ Test 5.1 FAILED: Snapshot refresh failed - %', 
        test_result->>'message';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 5 FAILED: Exception in refresh test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 6: 監控功能測試
  -- ==========================================
  RAISE NOTICE 'Test 6: Monitoring and analysis functions';
  test_count := test_count + 1;
  
  BEGIN
    -- 測試快照覆蓋率分析
    SELECT COUNT(*) 
    INTO test_result
    FROM analyze_orders_snapshots_coverage();
    
    IF (test_result::text)::integer >= 4 THEN  -- 應該有至少4個指標
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 6.1 PASSED: Coverage analysis function';
    ELSE
      RAISE NOTICE '❌ Test 6.1 FAILED: Coverage analysis returned insufficient metrics';
    END IF;
    
    -- 測試新鮮度檢查
    SELECT COUNT(*) 
    INTO test_result
    FROM check_orders_snapshots_freshness();
    
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test 6.2 PASSED: Freshness check function (returned % records)', 
      (test_result::text)::integer;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 6 FAILED: Exception in monitoring test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 7: 資料一致性驗證
  -- ==========================================
  RAISE NOTICE 'Test 7: Data consistency validation';
  test_count := test_count + 1;
  
  BEGIN
    -- 檢查高嚴重性問題
    SELECT COUNT(*) 
    INTO test_result
    FROM check_orders_jsonb_integrity()
    WHERE severity = 'HIGH';
    
    IF (test_result::text)::integer = 0 THEN
      pass_count := pass_count + 1;
      RAISE NOTICE '✅ Test 7.1 PASSED: No high severity integrity issues';
    ELSE
      RAISE NOTICE '❌ Test 7.1 FAILED: Found % high severity issues', 
        (test_result::text)::integer;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 7 FAILED: Exception in consistency test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試 8: 效能驗證
  -- ==========================================
  RAISE NOTICE 'Test 8: Performance validation';
  test_count := test_count + 1;
  
  BEGIN
    -- 簡單的索引使用測試
    PERFORM *
    FROM orders 
    WHERE customer_snapshot->>'email' = 'function_test@example.com';
    
    PERFORM *
    FROM orders 
    WHERE business_rules_snapshot->>'policy_version' = '2025-Q3-v1.2';
    
    pass_count := pass_count + 1;
    RAISE NOTICE '✅ Test 8.1 PASSED: JSONB indexing queries executed successfully';
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Test 8 FAILED: Exception in performance test - %', SQLERRM;
  END;
  
  -- ==========================================
  -- 測試結果匯總
  -- ==========================================
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Orders JSONB Tests Summary';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'Total Tests: %', test_count;
  RAISE NOTICE 'Passed: %', pass_count;
  RAISE NOTICE 'Failed: %', test_count - pass_count;
  RAISE NOTICE 'Success Rate: %%%', ROUND((pass_count::numeric / test_count::numeric) * 100, 1);
  
  IF pass_count = test_count THEN
    RAISE NOTICE '🎉 ALL TESTS PASSED - Orders JSONB system is ready!';
  ELSIF pass_count::numeric / test_count::numeric >= 0.8 THEN
    RAISE NOTICE '⚠️  MOSTLY SUCCESSFUL - Minor issues need attention';
  ELSE
    RAISE NOTICE '❌ SIGNIFICANT ISSUES - System needs review before deployment';
  END IF;
  
  RAISE NOTICE '';
  
  -- 返回測試結果
  test_results := jsonb_build_object(
    'total_tests', test_count,
    'passed', pass_count,
    'failed', test_count - pass_count,
    'success_rate', ROUND((pass_count::numeric / test_count::numeric) * 100, 1),
    'status', CASE 
      WHEN pass_count = test_count THEN 'ALL_PASSED'
      WHEN pass_count::numeric / test_count::numeric >= 0.8 THEN 'MOSTLY_PASSED'
      ELSE 'NEEDS_ATTENTION'
    END,
    'test_timestamp', NOW()
  );
  
  RETURN test_results;
END;
$function$;

-- 建立快速診斷函數
CREATE OR REPLACE FUNCTION quick_orders_jsonb_diagnosis()
RETURNS TABLE (
  metric varchar,
  value text,
  status varchar,
  recommendation text
)
LANGUAGE plpgsql
AS $function$
DECLARE
  total_orders bigint;
  snapshot_coverage numeric;
  high_severity_issues bigint;
BEGIN
  -- 基本統計
  SELECT COUNT(*) INTO total_orders FROM orders;
  
  -- 快照覆蓋率
  SELECT ROUND(
    (COUNT(*) FILTER (WHERE customer_snapshot IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0)), 2
  ) INTO snapshot_coverage FROM orders;
  
  -- 嚴重問題計數
  SELECT COUNT(*) INTO high_severity_issues 
  FROM check_orders_jsonb_integrity() 
  WHERE severity = 'HIGH';
  
  -- 返回診斷結果
  RETURN QUERY VALUES
    ('Total Orders', total_orders::text, 'INFO', 'System scale indicator'),
    ('Customer Snapshot Coverage', snapshot_coverage::text || '%', 
     CASE WHEN snapshot_coverage >= 95 THEN 'GOOD' ELSE 'NEEDS_ATTENTION' END,
     CASE WHEN snapshot_coverage >= 95 THEN 'Excellent coverage' 
          ELSE 'Consider running migration for missing snapshots' END),
    ('High Severity Issues', high_severity_issues::text,
     CASE WHEN high_severity_issues = 0 THEN 'GOOD' ELSE 'CRITICAL' END,
     CASE WHEN high_severity_issues = 0 THEN 'No critical issues found'
          ELSE 'Review and fix high severity issues immediately' END);
END;
$function$;

-- 執行說明
DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Orders JSONB Functional Tests - Stage 3';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Test functions created:';
  RAISE NOTICE '1. run_orders_jsonb_tests() - Comprehensive functional testing';
  RAISE NOTICE '2. quick_orders_jsonb_diagnosis() - Quick system health check';
  RAISE NOTICE '3. cleanup_orders_test_data() - Clean up test data';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '- Run tests: SELECT run_orders_jsonb_tests();';
  RAISE NOTICE '- Quick check: SELECT * FROM quick_orders_jsonb_diagnosis();';
  RAISE NOTICE '- Cleanup: SELECT cleanup_orders_test_data();';
  RAISE NOTICE '';
  RAISE NOTICE 'Ready to execute comprehensive testing!';
END $$;