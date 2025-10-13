-- =================================================================
-- 驗證 auth_user_id 重複防護機制測試腳本
-- 執行前請確保已套用 migration: 20250801100000_add_auth_user_id_unique_constraints.sql
-- =================================================================

-- 檢查 UNIQUE 約束是否已建立
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname IN (
    'customers_auth_user_id_unique', 
    'users_auth_user_id_unique'
);

-- =================================================================
-- 測試1：檢查現有重複資料
-- =================================================================

-- 檢查重複資料
SELECT '=== 檢查現有重複資料 ===' as test_section;
SELECT check_auth_user_id_duplicates();

-- =================================================================
-- 測試2：測試單表內重複防護（customers）
-- =================================================================

SELECT '=== 測試 customers 表內重複防護 ===' as test_section;

-- 建立測試用的 auth_user_id
DO $$
DECLARE
    test_auth_id uuid := gen_random_uuid();
BEGIN
    RAISE NOTICE '測試 auth_user_id: %', test_auth_id;
    
    -- 第一次插入應該成功
    BEGIN
        INSERT INTO customers (email, auth_user_id, full_name) 
        VALUES ('test1@example.com', test_auth_id, 'Test User 1');
        RAISE NOTICE '✅ 第一次插入成功';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 第一次插入失敗: %', SQLERRM;
    END;
    
    -- 第二次插入相同 auth_user_id 應該失敗
    BEGIN
        INSERT INTO customers (email, auth_user_id, full_name) 
        VALUES ('test2@example.com', test_auth_id, 'Test User 2');
        RAISE NOTICE '❌ 第二次插入意外成功（應該失敗）';
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE '✅ 第二次插入正確失敗（UNIQUE 約束生效）';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 第二次插入失敗，但原因不是 UNIQUE 約束: %', SQLERRM;
    END;
    
    -- 清理測試資料
    DELETE FROM customers WHERE auth_user_id = test_auth_id;
    RAISE NOTICE '🧹 清理測試資料完成';
END $$;

-- =================================================================
-- 測試3：測試單表內重複防護（users）
-- =================================================================

SELECT '=== 測試 users 表內重複防護 ===' as test_section;

-- 建立測試用的 auth_user_id
DO $$
DECLARE
    test_auth_id uuid := gen_random_uuid();
BEGIN
    RAISE NOTICE '測試 auth_user_id: %', test_auth_id;
    
    -- 第一次插入應該成功
    BEGIN
        INSERT INTO users (email, auth_user_id, full_name) 
        VALUES ('admin1@example.com', test_auth_id, 'Admin User 1');
        RAISE NOTICE '✅ 第一次插入成功';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 第一次插入失敗: %', SQLERRM;
    END;
    
    -- 第二次插入相同 auth_user_id 應該失敗
    BEGIN
        INSERT INTO users (email, auth_user_id, full_name) 
        VALUES ('admin2@example.com', test_auth_id, 'Admin User 2');
        RAISE NOTICE '❌ 第二次插入意外成功（應該失敗）';
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE '✅ 第二次插入正確失敗（UNIQUE 約束生效）';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ 第二次插入失敗，但原因不是 UNIQUE 約束: %', SQLERRM;
    END;
    
    -- 清理測試資料
    DELETE FROM users WHERE auth_user_id = test_auth_id;
    RAISE NOTICE '🧹 清理測試資料完成';
END $$;

-- =================================================================
-- 測試4：測試跨表重複防護
-- =================================================================

SELECT '=== 測試跨表重複防護 ===' as test_section;

-- 建立測試用的 auth_user_id
DO $$
DECLARE
    test_auth_id uuid := gen_random_uuid();
BEGIN
    RAISE NOTICE '測試 auth_user_id: %', test_auth_id;
    
    -- 先在 customers 表插入
    BEGIN
        INSERT INTO customers (email, auth_user_id, full_name) 
        VALUES ('customer@example.com', test_auth_id, 'Customer User');
        RAISE NOTICE '✅ customers 表插入成功';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ customers 表插入失敗: %', SQLERRM;
    END;
    
    -- 嘗試在 users 表插入相同 auth_user_id（應該失敗）
    BEGIN
        INSERT INTO users (email, auth_user_id, full_name) 
        VALUES ('admin@example.com', test_auth_id, 'Admin User');
        RAISE NOTICE '❌ users 表插入意外成功（應該失敗）';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '✅ users 表插入正確失敗（跨表重複檢查生效）: %', SQLERRM;
    END;
    
    -- 清理測試資料
    DELETE FROM customers WHERE auth_user_id = test_auth_id;
    DELETE FROM users WHERE auth_user_id = test_auth_id;
    RAISE NOTICE '🧹 清理測試資料完成';
END $$;

-- =================================================================
-- 測試5：測試反向跨表重複防護
-- =================================================================

SELECT '=== 測試反向跨表重複防護 ===' as test_section;

-- 建立測試用的 auth_user_id
DO $$
DECLARE
    test_auth_id uuid := gen_random_uuid();
BEGIN
    RAISE NOTICE '測試 auth_user_id: %', test_auth_id;
    
    -- 先在 users 表插入
    BEGIN
        INSERT INTO users (email, auth_user_id, full_name) 
        VALUES ('admin@example.com', test_auth_id, 'Admin User');
        RAISE NOTICE '✅ users 表插入成功';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '❌ users 表插入失敗: %', SQLERRM;
    END;
    
    -- 嘗試在 customers 表插入相同 auth_user_id（應該失敗）
    BEGIN
        INSERT INTO customers (email, auth_user_id, full_name) 
        VALUES ('customer@example.com', test_auth_id, 'Customer User');
        RAISE NOTICE '❌ customers 表插入意外成功（應該失敗）';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '✅ customers 表插入正確失敗（跨表重複檢查生效）: %', SQLERRM;
    END;
    
    -- 清理測試資料
    DELETE FROM users WHERE auth_user_id = test_auth_id;
    DELETE FROM customers WHERE auth_user_id = test_auth_id;
    RAISE NOTICE '🧹 清理測試資料完成';
END $$;

-- =================================================================
-- 測試6：測試統一身份解析函數
-- =================================================================

SELECT '=== 測試統一身份解析函數 ===' as test_section;

-- 建立測試資料
DO $$
DECLARE
    customer_auth_id uuid := gen_random_uuid();
    admin_auth_id uuid := gen_random_uuid();
    nonexistent_auth_id uuid := gen_random_uuid();
    customer_result jsonb;
    admin_result jsonb;
    nonexistent_result jsonb;
BEGIN
    -- 建立測試客戶
    INSERT INTO customers (email, auth_user_id, full_name) 
    VALUES ('test_customer@example.com', customer_auth_id, 'Test Customer');
    
    -- 建立測試管理員
    INSERT INTO users (email, auth_user_id, full_name) 
    VALUES ('test_admin@example.com', admin_auth_id, 'Test Admin');
    
    -- 測試客戶身份解析
    SELECT resolve_user_identity(customer_auth_id) INTO customer_result;
    RAISE NOTICE '客戶身份解析結果: %', customer_result;
    
    IF customer_result->>'type' = 'customer' THEN
        RAISE NOTICE '✅ 客戶身份解析正確';
    ELSE
        RAISE NOTICE '❌ 客戶身份解析錯誤';
    END IF;
    
    -- 測試管理員身份解析
    SELECT resolve_user_identity(admin_auth_id) INTO admin_result;
    RAISE NOTICE '管理員身份解析結果: %', admin_result;
    
    IF admin_result->>'type' = 'admin' THEN
        RAISE NOTICE '✅ 管理員身份解析正確';
    ELSE
        RAISE NOTICE '❌ 管理員身份解析錯誤';
    END IF;
    
    -- 測試不存在用戶的身份解析
    SELECT resolve_user_identity(nonexistent_auth_id) INTO nonexistent_result;
    RAISE NOTICE '不存在用戶身份解析結果: %', nonexistent_result;
    
    IF nonexistent_result->>'type' = 'not_found' THEN
        RAISE NOTICE '✅ 不存在用戶身份解析正確';
    ELSE
        RAISE NOTICE '❌ 不存在用戶身份解析錯誤';
    END IF;
    
    -- 清理測試資料
    DELETE FROM customers WHERE auth_user_id = customer_auth_id;
    DELETE FROM users WHERE auth_user_id = admin_auth_id;
    RAISE NOTICE '🧹 清理測試資料完成';
END $$;

-- =================================================================
-- 測試7：測試更新操作的重複防護
-- =================================================================

SELECT '=== 測試更新操作的重複防護 ===' as test_section;

-- 建立測試用的 auth_user_id
DO $$
DECLARE
    test_auth_id1 uuid := gen_random_uuid();
    test_auth_id2 uuid := gen_random_uuid();
    customer_id uuid;
    user_id uuid;
BEGIN
    RAISE NOTICE '測試 auth_user_id1: %', test_auth_id1;
    RAISE NOTICE '測試 auth_user_id2: %', test_auth_id2;
    
    -- 建立兩個獨立的記錄
    INSERT INTO customers (email, auth_user_id, full_name) 
    VALUES ('customer1@example.com', test_auth_id1, 'Customer 1')
    RETURNING id INTO customer_id;
    
    INSERT INTO users (email, auth_user_id, full_name) 
    VALUES ('admin1@example.com', test_auth_id2, 'Admin 1')
    RETURNING id INTO user_id;
    
    RAISE NOTICE '✅ 初始資料建立完成';
    
    -- 嘗試將 customers 的 auth_user_id 更新為 users 已使用的值（應該失敗）
    BEGIN
        UPDATE customers 
        SET auth_user_id = test_auth_id2 
        WHERE id = customer_id;
        RAISE NOTICE '❌ customers 更新意外成功（應該失敗）';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '✅ customers 更新正確失敗（跨表重複檢查生效）: %', SQLERRM;
    END;
    
    -- 嘗試將 users 的 auth_user_id 更新為 customers 已使用的值（應該失敗）
    BEGIN
        UPDATE users 
        SET auth_user_id = test_auth_id1 
        WHERE id = user_id;
        RAISE NOTICE '❌ users 更新意外成功（應該失敗）';
    EXCEPTION 
        WHEN OTHERS THEN
            RAISE NOTICE '✅ users 更新正確失敗（跨表重複檢查生效）: %', SQLERRM;
    END;
    
    -- 清理測試資料
    DELETE FROM customers WHERE id = customer_id;
    DELETE FROM users WHERE id = user_id;
    RAISE NOTICE '🧹 清理測試資料完成';
END $$;

-- =================================================================
-- 最終檢查
-- =================================================================

SELECT '=== 最終檢查 ===' as test_section;

-- 確認沒有遺留的測試資料
SELECT 
    'customers' as table_name,
    COUNT(*) as test_records_count
FROM customers 
WHERE email LIKE '%@example.com'

UNION ALL

SELECT 
    'users' as table_name,
    COUNT(*) as test_records_count
FROM users 
WHERE email LIKE '%@example.com';

-- 最終重複資料檢查
SELECT '=== 最終重複資料檢查 ===' as final_check;
SELECT check_auth_user_id_duplicates();

-- 顯示約束資訊
SELECT '=== 約束資訊 ===' as constraint_info;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('customers', 'users') 
AND indexname LIKE '%auth_user_id%';

SELECT '=== 測試完成 ===' as test_complete;