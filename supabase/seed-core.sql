-- ============================================
-- Supabase 核心種子資料 (Public Demo 展示版本)
-- ⚠️ 注意：本檔案為公開展示用途，已移除所有敏感資料
-- ⚠️ Super Admin 密碼已移除，實際使用請參考完整版本
-- ============================================

-- 前置檢查：確保必要的表已經創建
DO $$
BEGIN
    -- 檢查 permission_groups 表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permission_groups') THEN
        RAISE EXCEPTION 'Required table permission_groups does not exist. Please ensure all migrations are applied first.';
    END IF;
    
    -- 檢查 permissions 表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') THEN
        RAISE EXCEPTION 'Required table permissions does not exist. Please ensure all migrations are applied first.';
    END IF;
    
    -- 檢查 system_settings 表是否存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        RAISE EXCEPTION 'Required table system_settings does not exist. Please ensure all migrations are applied first.';
    END IF;
    
    RAISE NOTICE '✅ 前置檢查通過：所有必要的表都已存在';
END $$;

-- 1. 系統設定資料
INSERT INTO system_settings (key, value, description) VALUES 
  ('fast_response_threshold_minutes', '15', '快速回應時間閾值（分鐘）'),
  ('medium_response_threshold_minutes', '30', '中等回應時間閾值（分鐘）'),
  ('slow_response_threshold_minutes', '60', '慢速回應時間閾值（分鐘）'),
  ('agent_busy_threshold', '5', '客服忙碌狀態閾值'),
  ('default_notification_priority', 'medium', '預設通知優先級'),
  ('max_notification_retention_days', '90', '通知保留天數'),
  ('system_timezone', 'Asia/Taipei', '系統時區設定')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = COALESCE(EXCLUDED.description, system_settings.description);

-- -- 2. 系統用戶 (用於系統執行權限)
-- INSERT INTO users (
--   id, 
--   email, 
--   full_name, 
--   avatar_url, 
--   auth_user_id, 
--   created_at, 
--   updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'system@internal.system',
--   'System Bot',
--   NULL,
--   NULL,
--   NOW(),
--   NOW()
-- ) ON CONFLICT (id) DO UPDATE SET 
--   email = EXCLUDED.email,
--   full_name = EXCLUDED.full_name,
--   updated_at = NOW();

-- -- 為 public.users 設定 RLS 策略以保護系統使用者紀錄
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- -- 建立策略，防止外部服務讀取到系統使用者紀錄
-- -- 這會影響所有對 public.users 的讀取，請確保這是您期望的行為
-- CREATE POLICY "Block external SELECT on system user record"
-- ON public.users
-- FOR SELECT
-- TO authenticated
-- USING (email <> 'system@internal.system');

-- -- (可選，但建議) 建立策略，防止外部服務意外修改或刪除此紀錄
-- CREATE POLICY "Block external UPDATE on system user record"
-- ON public.users
-- FOR UPDATE
-- TO authenticated
-- USING (email <> 'system@internal.system');

-- CREATE POLICY "Block external DELETE on system user record"
-- ON public.users
-- FOR DELETE
-- TO authenticated
-- USING (email <> 'system@internal.system');

-- DO $$
-- BEGIN
--     RAISE NOTICE '✅ RLS 策略已設定，保護 public.users 中的 system@internal.system 紀錄';
-- END $$;

-- 3. 基本角色資料（移到前面，讓 Super Admin 建立時可以引用）
INSERT INTO roles (name, description) VALUES 
  ('super_admin', '超級管理員')
  -- ('admin', '系統管理員'),
  -- ('manager', '部門主管'),
  -- ('staff', '一般員工'),
  -- ('support', '客服人員'),
  -- ('viewer', '唯讀用戶')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- 4. Super Admin 用戶建立 (完整的 auth.users + public.users)
-- ============================================
-- 職責說明：
-- - 本區塊負責建立系統初始 Super Admin 用戶
-- - 包含完整的 auth.users 和 public.users 建立
-- - 使用備用檢查機制，避免重複建立
--
-- 相關工具函數：
-- - migrations/20250713210000_fix_super_admin_auth.sql
--   提供 ensure_super_admin_user_with_auth() 和 test_super_admin_auth()
-- ============================================
-- ⚠️ 展示版本：Super Admin 用戶創建邏輯已移除
-- ⚠️ 原因：包含加密密碼等敏感資料，不適合公開展示
-- ⚠️ 實際使用請參考完整版 seed-core.sql
--
-- 原始邏輯概要：
-- 1. 檢查 auth.users 中是否已存在 admin@system.local
-- 2. 如不存在，創建完整的 auth.users 記錄（含加密密碼）
-- 3. 創建對應的 public.users 業務用戶記錄
-- 4. 分配 super_admin 角色給用戶
--
-- 完整版本包含的敏感欄位：
-- - encrypted_password (bcrypt 加密)
-- - recovery_token
-- - email_change_token
-- - reauthentication_token
--
-- 建議：生產環境請透過 Supabase Auth UI 或管理 API 創建管理員

DO $$
DECLARE
    super_admin_auth_id uuid;
    super_admin_public_id uuid;
    super_admin_role_id integer;
BEGIN
    -- 取得 super_admin 角色 ID
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';

    -- 生成示範用 UUIDs（實際環境會由系統生成）
    super_admin_auth_id := '00000000-0000-0000-0000-000000000001'::uuid;
    super_admin_public_id := '00000000-0000-0000-0000-000000000002'::uuid;
    
    -- 建立對應的 public.users 業務用戶
    INSERT INTO users (
        id,
        email,
        full_name,
        avatar_url,
        auth_user_id,
        created_at,
        updated_at
    ) VALUES (
        super_admin_public_id,
        'admin@system.local',
        'Super Administrator',
        'default_avatar/avatar01.jpg',
        super_admin_auth_id,
        NOW(),
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        auth_user_id = super_admin_auth_id,
        updated_at = NOW();

    -- 重新取得 public user ID (如果上面是更新的話)
    SELECT id INTO super_admin_public_id FROM users WHERE email = 'admin@system.local';
    
    -- 分配 super_admin 角色給用戶
    IF super_admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        VALUES (super_admin_public_id, super_admin_role_id, NOW())
        ON CONFLICT (user_id, role_id) DO UPDATE SET
            assigned_at = NOW();
            
        RAISE NOTICE '';
        RAISE NOTICE '📝 Super Admin 用戶結構展示（展示版本）';
        RAISE NOTICE 'Public ID: %', super_admin_public_id;
        RAISE NOTICE 'Role ID: %', super_admin_role_id;
        RAISE NOTICE 'Email: admin@system.local';
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  注意：Auth 認證資料已移除（含加密密碼）';
        RAISE NOTICE '⚠️  實際使用請參考完整版 seed-core.sql';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '❌ Super Admin 角色不存在，無法分配角色';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Super Admin 用戶建立失敗: %', SQLERRM;
    RAISE NOTICE '⚠️  請檢查系統設定';
END $$;

-- 5. RFM 客戶分群對應資料
-- 註：此區塊已由 calculate_rfm_segment() 演算法取代，提供 100% 模式覆蓋率

-- 6. 預設頭像資料
INSERT INTO default_avatars (id, file_path) VALUES
  (1, 'default_avatar/avatar01.jpg'),
  (2, 'default_avatar/avatar02.jpg'),
  (3, 'default_avatar/avatar03.jpg'),
  (4, 'default_avatar/avatar04.jpg'),
  (5, 'default_avatar/avatar05.jpg'),
  (6, 'default_avatar/avatar06.jpg'),
  (7, 'default_avatar/avatar07.jpg'),
  (8, 'default_avatar/avatar08.jpg'),
  (9, 'default_avatar/avatar09.jpg'),
  (10, 'default_avatar/avatar10.jpg'),
  (11, 'default_avatar/avatar11.jpg'),
  (12, 'default_avatar/avatar12.jpg'),
  (13, 'default_avatar/avatar13.jpg'),
  (14, 'default_avatar/avatar14.jpg'),
  (15, 'default_avatar/avatar15.jpg')
ON CONFLICT (id) DO UPDATE SET file_path = EXCLUDED.file_path;

-- 7. 權限群組資料 (完整版 - 2025-08-17 更新)
INSERT INTO permission_groups (name, description) VALUES 
  -- 核心業務權限群組
  ('order', '訂單管理權限'),
  ('customer', '客戶管理權限'),
  ('product', '產品管理權限'),
  ('inventory', '庫存管理權限'),
  
  -- 系統管理權限群組
  ('support', '支援系統權限'),
  ('notification', '通知管理權限'),
  ('role', '角色權限管理'),
  
  -- 分析與儀表板權限群組
  ('dashboard', '儀表板權限'),
  ('analytics', '分析系統權限'),
  
  -- 進階功能權限群組
  ('campaign', '活動管理權限'),
  ('ai_provider', 'AI 提供商管理權限')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description;

-- 8. 完整權限資料 (2025-08-17 更新 - 11個群組, 53個權限)
INSERT INTO permissions (group_id, code, name, description, sort_order) VALUES 
  -- 第一階段：核心業務權限群組
  
  -- 訂單管理權限 (6個)
  ((SELECT id FROM permission_groups WHERE name = 'order'), 'order.view', '查看訂單', '查看訂單列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'order'), 'order.create', '建立訂單', '建立新訂單', 20),
  ((SELECT id FROM permission_groups WHERE name = 'order'), 'order.edit', '編輯訂單', '修改訂單資訊', 30),
  ((SELECT id FROM permission_groups WHERE name = 'order'), 'order.delete', '刪除訂單', '刪除訂單', 40),
  ((SELECT id FROM permission_groups WHERE name = 'order'), 'order.status_change', '變更訂單狀態', '修改訂單處理狀態', 50),
  ((SELECT id FROM permission_groups WHERE name = 'order'), 'order.analytics', '訂單分析', '查看訂單分析報表', 60),
  
  -- 客戶管理權限 (5個)
  ((SELECT id FROM permission_groups WHERE name = 'customer'), 'customer.view', '查看客戶', '查看客戶列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'customer'), 'customer.create', '建立客戶', '建立新客戶資料', 20),
  ((SELECT id FROM permission_groups WHERE name = 'customer'), 'customer.edit', '編輯客戶', '修改客戶資訊', 30),
  ((SELECT id FROM permission_groups WHERE name = 'customer'), 'customer.delete', '刪除客戶', '刪除客戶資料', 40),
  ((SELECT id FROM permission_groups WHERE name = 'customer'), 'customer.analytics', '客戶分析', '查看客戶分析報表', 50),
  
  -- 產品管理權限 (5個)
  ((SELECT id FROM permission_groups WHERE name = 'product'), 'product.view', '查看產品', '查看產品列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'product'), 'product.create', '建立產品', '建立新產品', 20),
  ((SELECT id FROM permission_groups WHERE name = 'product'), 'product.edit', '編輯產品', '修改產品資訊', 30),
  ((SELECT id FROM permission_groups WHERE name = 'product'), 'product.delete', '刪除產品', '刪除產品', 40),
  ((SELECT id FROM permission_groups WHERE name = 'product'), 'product.analytics', '產品分析', '查看產品分析報表', 50),
  
  -- 庫存管理權限 (4個)
  ((SELECT id FROM permission_groups WHERE name = 'inventory'), 'inventory.view', '查看庫存', '查看庫存列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'inventory'), 'inventory.adjust', '調整庫存', '手動調整庫存數量', 20),
  ((SELECT id FROM permission_groups WHERE name = 'inventory'), 'inventory.stock_in', '入庫管理', '處理商品入庫作業', 30),
  ((SELECT id FROM permission_groups WHERE name = 'inventory'), 'inventory.allocate', '庫存分配', '進行庫存分配作業', 40),
  
  -- 第二階段：系統管理權限群組
  
  -- 支援系統權限 (3個)
  ((SELECT id FROM permission_groups WHERE name = 'support'), 'support.tickets.view', '查看工單', '查看支援工單列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'support'), 'support.tickets.manage', '管理工單', '處理和回覆支援工單', 20),
  ((SELECT id FROM permission_groups WHERE name = 'support'), 'support.analytics', '支援分析', '查看支援分析報表', 30),
  
  -- 通知管理權限 (4個)
  ((SELECT id FROM permission_groups WHERE name = 'notification'), 'notification.view', '查看通知', '查看通知列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'notification'), 'notification.manage', '管理通知', '建立、編輯、刪除通知', 20),
  ((SELECT id FROM permission_groups WHERE name = 'notification'), 'notification.template.manage', '管理通知模板', '管理和編輯通知模板', 30),
  ((SELECT id FROM permission_groups WHERE name = 'notification'), 'notification.group.manage', '管理群組通知', '管理群組通知和路由規則', 40),
  
  -- 角色權限管理 (6個)
  ((SELECT id FROM permission_groups WHERE name = 'role'), 'role.view', '查看角色', '查看角色列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'role'), 'role.create', '建立角色', '建立新的系統角色', 20),
  ((SELECT id FROM permission_groups WHERE name = 'role'), 'role.edit', '編輯角色', '修改角色資訊', 30),
  ((SELECT id FROM permission_groups WHERE name = 'role'), 'role.delete', '刪除角色', '刪除系統角色', 40),
  ((SELECT id FROM permission_groups WHERE name = 'role'), 'role.permission.manage', '管理角色權限', '分配和管理角色權限', 50),
  ((SELECT id FROM permission_groups WHERE name = 'role'), 'role.user.manage', '管理角色用戶', '分配用戶到角色', 60),
  
  -- 第三階段：分析與儀表板權限群組
  
  -- 儀表板權限 (7個)
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.overview', '總覽儀表板', '查看系統總覽儀表板', 10),
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.executive', '高階主管儀表板', '查看高階主管健康度儀表板', 20),
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.operations', '營運儀表板', '查看營運效率儀表板', 30),
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.risk', '風險中心', '查看風險監控儀表板', 40),
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.revenue', '營收儀表板', '查看營收分析儀表板', 50),
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.customer_value', '客戶價值儀表板', '查看客戶價值分析儀表板', 60),
  ((SELECT id FROM permission_groups WHERE name = 'dashboard'), 'dashboard.support', '支援儀表板', '查看支援系統儀表板', 70),
  
  -- 分析系統權限 (3個)
  ((SELECT id FROM permission_groups WHERE name = 'analytics'), 'analytics.export', '分析數據匯出', '匯出分析報表和數據', 10),
  ((SELECT id FROM permission_groups WHERE name = 'analytics'), 'analytics.advanced', '進階分析', '使用進階分析功能', 20),
  ((SELECT id FROM permission_groups WHERE name = 'analytics'), 'analytics.realtime', '即時分析', '查看即時分析數據', 30),
  
  -- 進階功能權限群組
  
  -- 活動管理權限 (5個)
  ((SELECT id FROM permission_groups WHERE name = 'campaign'), 'campaign.view', '查看活動', '查看活動列表和詳情', 10),
  ((SELECT id FROM permission_groups WHERE name = 'campaign'), 'campaign.create', '建立活動', '建立新活動', 20),
  ((SELECT id FROM permission_groups WHERE name = 'campaign'), 'campaign.edit', '編輯活動', '修改活動資訊', 30),
  ((SELECT id FROM permission_groups WHERE name = 'campaign'), 'campaign.delete', '刪除活動', '刪除活動', 40),
  ((SELECT id FROM permission_groups WHERE name = 'campaign'), 'campaign.analytics', '活動分析', '查看活動分析報表', 50),
  
  -- AI 提供商管理權限 (5個)
  ((SELECT id FROM permission_groups WHERE name = 'ai_provider'), 'ai_provider.view', '查看 AI 提供商', '查看 AI 提供商配置', 10),
  ((SELECT id FROM permission_groups WHERE name = 'ai_provider'), 'ai_provider.create', '建立 AI 配置', '建立新 AI 提供商配置', 20),
  ((SELECT id FROM permission_groups WHERE name = 'ai_provider'), 'ai_provider.edit', '編輯 AI 配置', '修改 AI 提供商配置', 30),
  ((SELECT id FROM permission_groups WHERE name = 'ai_provider'), 'ai_provider.delete', '刪除 AI 配置', '刪除 AI 提供商配置', 40),
  ((SELECT id FROM permission_groups WHERE name = 'ai_provider'), 'ai_provider.test', '測試 AI 連線', '測試 AI 提供商連線', 50)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 9. 系統預設產品分類
INSERT INTO categories (name, description, translations) VALUES 
  ('預設分類', '系統預設分類，可由管理員依業務需求自訂', '{"en": "Default Category", "zh": "預設分類"}')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  translations = EXCLUDED.translations;

-- 10. 通知系統核心模板 (符合 TypeScript 定義)
INSERT INTO notification_templates (
  type,
  title_template,
  message_template,
  default_priority,
  default_channels,
  required_entity_type,
  category,
  completion_strategy,
  is_active,
  is_system_required,
  metadata_schema
) VALUES 
  -- 訂單通知模板
  ('order_new', '新訂單通知', '收到新訂單 #{{order_number}}，金額：${{total_amount}}', 'high', ARRAY['in_app'], 'order', 'actionable', 'suggested', true, true, '{"order_number": "string", "total_amount": "number"}'),
  ('order_high_value', '高價值訂單警示', '收到高價值訂單 #{{order_number}}，金額：${{total_amount}}', 'urgent', ARRAY['in_app'], 'order', 'actionable', 'manual', true, true, '{"order_number": "string", "total_amount": "number"}'),
  ('order_paid', '訂單付款完成', '訂單 #{{order_number}} 付款完成，金額：${{total_amount}}', 'medium', ARRAY['in_app'], 'order', 'actionable', 'suggested', true, true, '{"order_number": "string", "total_amount": "number"}'),
  
  -- 庫存警示模板
  ('inventory_low_stock', '庫存不足警告', '產品 "{{product_name}}" 庫存不足，當前庫存：{{current_stock}}', 'high', ARRAY['in_app'], 'product', 'actionable', 'manual', true, true, '{"product_name": "string", "current_stock": "number"}'),
  ('inventory_out_of_stock', '庫存缺貨警告', '產品 "{{product_name}}" 已缺貨，請盡快補貨', 'urgent', ARRAY['in_app'], 'product', 'actionable', 'manual', true, true, '{"product_name": "string"}'),
  ('inventory_overstock', '庫存過量警告', '產品 "{{product_name}}" 庫存過量，當前庫存：{{current_stock}}', 'medium', ARRAY['in_app'], 'product', 'informational', 'auto', true, true, '{"product_name": "string", "current_stock": "number"}'),
  
  -- 客戶相關模板
  ('customer_new_registration', '新客戶註冊', '新客戶 {{customer_name}} 已註冊', 'medium', ARRAY['in_app'], 'customer', 'informational', 'auto', true, true, '{"customer_name": "string"}'),
  ('product_deactivated', '產品下架通知', '產品 "{{product_name}}" 已下架', 'medium', ARRAY['in_app'], 'product', 'informational', 'auto', true, true, '{"product_name": "string"}'),
  ('product_price_major_change', '產品重大價格變動', '產品 "{{product_name}}" 價格有重大變動', 'medium', ARRAY['in_app'], 'product', 'informational', 'auto', true, true, '{"product_name": "string", "old_price": "number", "new_price": "number"}')
ON CONFLICT (type) DO UPDATE SET
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  default_priority = EXCLUDED.default_priority,
  default_channels = EXCLUDED.default_channels,
  category = EXCLUDED.category,
  completion_strategy = EXCLUDED.completion_strategy,
  is_system_required = EXCLUDED.is_system_required,
  metadata_schema = EXCLUDED.metadata_schema;

-- 11. 系統分析基礎資料 - 台灣國定假日 (2024-2025)
INSERT INTO holidays (date, name) VALUES 
  -- 2024年假日
  ('2024-01-01', '元旦'),
  ('2024-02-08', '除夕'),
  ('2024-02-09', '春節'),
  ('2024-02-10', '春節'),
  ('2024-02-11', '春節'),
  ('2024-02-12', '春節'),
  ('2024-02-28', '和平紀念日'),
  ('2024-04-04', '兒童節'),
  ('2024-04-05', '清明節'),
  ('2024-05-01', '勞動節'),
  ('2024-06-10', '端午節'),
  ('2024-09-17', '中秋節'),
  ('2024-10-10', '國慶日'),
  
  -- 2025年假日
  ('2025-01-01', '元旦'),
  ('2025-01-28', '除夕'),
  ('2025-01-29', '春節'),
  ('2025-01-30', '春節'),
  ('2025-01-31', '春節'),
  ('2025-02-01', '春節'),
  ('2025-02-02', '春節'),
  ('2025-02-28', '和平紀念日'),
  ('2025-04-04', '兒童節'),
  ('2025-04-05', '清明節'),
  ('2025-05-01', '勞動節'),
  ('2025-05-31', '端午節'),
  ('2025-10-06', '中秋節'),
  ('2025-10-10', '國慶日')
ON CONFLICT DO NOTHING;

-- ============================================
-- Super Admin 權限分配系統
-- 在權限資料插入後執行，確保 Super Admin 擁有所有權限
-- ============================================

-- 注意：assign_super_admin_permissions 函數已在 migration 檔案中定義
-- 此處直接使用該函數，避免重複定義

-- 執行 Super Admin 權限分配
DO $$
DECLARE
    permission_result jsonb;
BEGIN
    SELECT assign_super_admin_permissions() INTO permission_result;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Super Admin 權限分配完成';
    RAISE NOTICE '狀態: %', permission_result->>'status';
    RAISE NOTICE '訊息: %', permission_result->>'message';
    
    IF permission_result->>'status' = 'error' THEN
        RAISE NOTICE '❌ 權限分配失敗，請檢查系統狀態';
    ELSE
        RAISE NOTICE '✅ 權限分配成功';
    END IF;
    RAISE NOTICE '';
END $$;

-- 初始化 Super Admin 保護系統（忽略錯誤，因為函數可能執行失敗）
DO $$
BEGIN
    BEGIN
        PERFORM initialize_super_admin_system();
        RAISE NOTICE 'Super Admin 系統初始化成功';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Super Admin 系統初始化跳過: %', SQLERRM;
    END;
END $$;

-- 11.5. Super Admin 通知偏好設定
-- 為 Super Admin 設定最佳化的通知接收偏好
INSERT INTO notification_preferences (
  user_id,
  notification_type,
  is_enabled,
  channels,
  quiet_hours_start,
  quiet_hours_end,
  frequency_limit,
  created_at,
  updated_at
)
SELECT
  u.id,
  pref.notification_type,
  pref.is_enabled,
  pref.channels,
  pref.quiet_hours_start,
  pref.quiet_hours_end,
  pref.frequency_limit,
  NOW(),
  NOW()
FROM users u
CROSS JOIN (VALUES
  -- 🚨 CRITICAL - 系統安全和效能問題（即時 + 全通道）
  ('system_security_alert', true, ARRAY['in_app', 'email', 'sms']::text[], '23:00'::time, '06:00'::time, 1),
  ('system_performance_issue', true, ARRAY['in_app', 'email', 'sms']::text[], '23:00'::time, '06:00'::time, 1),

  -- ⚠️ HIGH - 業務關鍵事件（即時 + App/Email）
  ('order_high_value', true, ARRAY['in_app', 'email']::text[], '22:00'::time, '07:00'::time, 3),
  ('customer_service_urgent', true, ARRAY['in_app', 'email']::text[], '22:00'::time, '07:00'::time, 2),

  -- 📊 NORMAL - 營運監控（適度頻率）
  ('inventory_out_of_stock', true, ARRAY['in_app', 'email']::text[], '23:00'::time, '07:00'::time, 5),
  ('system_maintenance', true, ARRAY['in_app', 'email']::text[], '23:00'::time, '06:00'::time, 1),
  ('system_alert', true, ARRAY['in_app', 'email']::text[], '23:00'::time, '07:00'::time, 10),
  ('product_price_major_change', true, ARRAY['in_app', 'email']::text[], '22:00'::time, '08:00'::time, 5)
) AS pref(notification_type, is_enabled, channels, quiet_hours_start, quiet_hours_end, frequency_limit)
WHERE u.email = 'admin@system.local'
ON CONFLICT (user_id, notification_type) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  channels = EXCLUDED.channels,
  quiet_hours_start = EXCLUDED.quiet_hours_start,
  quiet_hours_end = EXCLUDED.quiet_hours_end,
  frequency_limit = EXCLUDED.frequency_limit,
  updated_at = NOW();

-- 12. AI 系統核心資料 (生產環境必需)
-- AI Providers: 只建立系統必需的基本 Provider  
INSERT INTO ai_providers (name, display_name, provider_type, description, base_url, max_tokens, cost_per_1k_input_tokens, cost_per_1k_output_tokens, is_active, default_model) VALUES 
  ('openai', 'OpenAI', 'cloud', 'OpenAI API 服務', 'https://api.openai.com/v1', 4096, 0.00150, 0.00600, false, 'gpt-4o-mini'),
  ('claude', 'Claude by Anthropic', 'cloud', 'Anthropic Claude API 服務', 'https://api.anthropic.com/v1', 8192, 0.00300, 0.01500, false, 'claude-3-5-sonnet-20241022'),
  ('ollama', 'Ollama 本機服務', 'local', 'Ollama 本機 AI 服務', 'http://localhost:11434', 4096, 0.0, 0.0, true, 'gemma3:1b')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  provider_type = EXCLUDED.provider_type,
  description = EXCLUDED.description,
  base_url = EXCLUDED.base_url,
  max_tokens = EXCLUDED.max_tokens,
  cost_per_1k_input_tokens = EXCLUDED.cost_per_1k_input_tokens,
  cost_per_1k_output_tokens = EXCLUDED.cost_per_1k_output_tokens,
  is_active = EXCLUDED.is_active,
  default_model = EXCLUDED.default_model;

-- AI Prompt Templates: 系統必需的核心模板
-- 這些模板是前端邏輯必需的，系統無法沒有它們正常運作
INSERT INTO ai_prompt_templates (
  template_key, 
  template_name, 
  category, 
  description, 
  prompt_template, 
  required_variables, 
  optional_variables, 
  max_tokens, 
  temperature, 
  version, 
  is_active,
  created_at,
  updated_at
) VALUES 
  -- 基礎警示增強模板 (系統預設)
  ('alert_enhancement', '警示增強分析', 'alert_analysis', 
   'AI系統的基礎警示分析模板，用於處理一般性業務警示',
   '請分析以下業務警示並提供具體建議：

警示詳情：{{alert_details}}
當前數值：{{current_value}}  
警告閾值：{{threshold_value}}
業務背景：{{business_context}}

請提供：
1. 警示嚴重程度評估
2. 可能原因分析 
3. 建議處理措施
4. 預防建議',
   '["alert_details", "current_value", "threshold_value", "business_context"]'::jsonb,
   '["historical_data", "trend_analysis"]'::jsonb,
   400, 0.3, '1.0', true, NOW(), NOW()),

  -- 深度洞察分析模板 (商業背景分析專用)
  ('insight_deepening', '深度洞察分析', 'business_insight',
   '專門用於有豐富商業背景時的深度分析模板',
   '基於以下商業背景和數據，提供深度洞察分析：

業務背景：{{business_context}}
關鍵指標：{{insights}}
警示詳情：{{alert_details}}
統一內容：{{unified_content}}

請提供深度分析：
1. 業務影響評估
2. 根因分析與洞察
3. 戰略建議
4. 行動優先級
5. 風險評估和機會識別',
   '["business_context", "insights", "alert_details"]'::jsonb,
   '["unified_content", "historical_trends", "market_context"]'::jsonb,
   500, 0.25, '1.0', true, NOW(), NOW())

ON CONFLICT (template_key) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  description = EXCLUDED.description,
  prompt_template = EXCLUDED.prompt_template,
  required_variables = EXCLUDED.required_variables,
  optional_variables = EXCLUDED.optional_variables,
  max_tokens = EXCLUDED.max_tokens,
  temperature = EXCLUDED.temperature,
  version = EXCLUDED.version,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- AI Prompt Provider Configs: 為系統必需模板建立基本配置
-- 確保每個系統必需模板都有對應的 Provider 配置
DO $$
DECLARE
    ollama_provider_id UUID;
    claude_provider_id UUID;
    openai_provider_id UUID;
    alert_enhancement_template_id UUID;
    insight_deepening_template_id UUID;
BEGIN
    -- 取得 Provider IDs
    SELECT id INTO ollama_provider_id FROM ai_providers WHERE name = 'ollama';
    SELECT id INTO claude_provider_id FROM ai_providers WHERE name = 'claude';  
    SELECT id INTO openai_provider_id FROM ai_providers WHERE name = 'openai';
    
    -- 取得 Template IDs
    SELECT id INTO alert_enhancement_template_id FROM ai_prompt_templates WHERE template_key = 'alert_enhancement';
    SELECT id INTO insight_deepening_template_id FROM ai_prompt_templates WHERE template_key = 'insight_deepening';

    -- 如果 Provider 和 Template 都存在，建立配置
    IF ollama_provider_id IS NOT NULL AND alert_enhancement_template_id IS NOT NULL THEN
        INSERT INTO ai_prompt_provider_configs (
            template_id, 
            provider_id, 
            provider_specific_params, 
            priority, 
            performance_score, 
            cost_efficiency_score, 
            quality_score, 
            is_active, 
            created_at, 
            updated_at
        ) VALUES 
            (alert_enhancement_template_id, ollama_provider_id, 
             '{"model": "gemma3:1b", "temperature": 0.3, "max_tokens": 400, "ollama_specific": {"num_ctx": 4096}}'::jsonb,
             10, 0.80, 1.00, 0.75, true, NOW(), NOW()),
            (insight_deepening_template_id, ollama_provider_id,
             '{"model": "gemma3:1b", "temperature": 0.25, "max_tokens": 500, "ollama_specific": {"num_ctx": 4096}}'::jsonb,
             10, 0.85, 1.00, 0.80, true, NOW(), NOW())
        ON CONFLICT (template_id, provider_id) DO UPDATE SET
            provider_specific_params = EXCLUDED.provider_specific_params,
            priority = EXCLUDED.priority,
            performance_score = EXCLUDED.performance_score,
            cost_efficiency_score = EXCLUDED.cost_efficiency_score,
            quality_score = EXCLUDED.quality_score,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
    END IF;
    
    -- 如果有 Claude Provider，也建立配置 (但設為非活躍)
    IF claude_provider_id IS NOT NULL AND alert_enhancement_template_id IS NOT NULL THEN
        INSERT INTO ai_prompt_provider_configs (
            template_id, 
            provider_id, 
            provider_specific_params, 
            priority, 
            performance_score, 
            cost_efficiency_score, 
            quality_score, 
            is_active, 
            created_at, 
            updated_at
        ) VALUES 
            (alert_enhancement_template_id, claude_provider_id,
             '{"model": "claude-3-5-sonnet-20241022", "temperature": 0.3, "max_tokens": 400}'::jsonb,
             20, 0.95, 0.60, 0.90, false, NOW(), NOW()),
            (insight_deepening_template_id, claude_provider_id,
             '{"model": "claude-3-5-sonnet-20241022", "temperature": 0.25, "max_tokens": 500}'::jsonb,
             20, 0.95, 0.60, 0.95, false, NOW(), NOW())
        ON CONFLICT (template_id, provider_id) DO UPDATE SET
            provider_specific_params = EXCLUDED.provider_specific_params,
            priority = EXCLUDED.priority,
            performance_score = EXCLUDED.performance_score,
            cost_efficiency_score = EXCLUDED.cost_efficiency_score,
            quality_score = EXCLUDED.quality_score,
            is_active = EXCLUDED.is_active,
            updated_at = NOW();
    END IF;
    
    RAISE NOTICE '✅ 系統必需 AI 模板配置完成';
    RAISE NOTICE '- alert_enhancement: 基礎警示分析模板';  
    RAISE NOTICE '- insight_deepening: 深度洞察分析模板';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️ AI 模板配置部分跳過: %', SQLERRM;
END $$;

-- AI System Config: 基礎配置 (如果表存在的話)
-- 注意: ai_system_config 表結構在不同環境可能不同，這裡使用簡化版本
DO $$
BEGIN
    -- 檢查表是否存在再插入
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_system_config') THEN
        -- 先嘗試插入，如果出錯就跳過
        BEGIN
            INSERT INTO ai_system_config (config_name, ai_enabled) VALUES ('production', true)
            ON CONFLICT (config_name) DO UPDATE SET ai_enabled = EXCLUDED.ai_enabled;
            RAISE NOTICE '✅ AI System Config 設定完成';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️ AI System Config 設定跳過: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ ai_system_config 表不存在，跳過設定';
    END IF;
END $$;

-- 顯示初始化結果
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ 電商管理平台核心資料初始化完成';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 已初始化的核心資料：';
    RAISE NOTICE '- 系統設定和參數';
    RAISE NOTICE '- 系統用戶和預設頭像';
    RAISE NOTICE '- RFM 客戶分群規則';
    RAISE NOTICE '- 完整權限管理體系 (11個群組, 53個權限)';
    RAISE NOTICE '- 系統預設產品分類';
    RAISE NOTICE '- 通知系統核心模板';
    RAISE NOTICE '- 台灣國定假日 (2024-2025)';
    RAISE NOTICE '- AI 系統核心配置 (3個 Providers, 2個系統必需模板)';
    RAISE NOTICE '- Super Admin 保護機制';
    RAISE NOTICE '- Super Admin 通知偏好設定 (8種通知類型)';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Super Admin 登入資訊（展示版本）：';
    RAISE NOTICE '- Email: admin@system.local';
    RAISE NOTICE '- 密碼: [已移除 - 請參考完整版]';
    RAISE NOTICE '';
    RAISE NOTICE '🔔 通知偏好設定：';
    RAISE NOTICE '- CRITICAL: system_security_alert, system_performance_issue (全通道)';
    RAISE NOTICE '- HIGH: order_high_value, customer_service_urgent (App+Email)';
    RAISE NOTICE '- NORMAL: inventory, maintenance, alerts, pricing (適度頻率)';
    RAISE NOTICE '';
    RAISE NOTICE '🤖 AI 系統狀態：';
    RAISE NOTICE '- 預設 Provider: Ollama (本機)';
    RAISE NOTICE '- 系統必需模板: alert_enhancement, insight_deepening';
    RAISE NOTICE '- 系統配置: production (已啟用)';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  展示版本安全提醒：';
    RAISE NOTICE '1. ❌ Super Admin 認證資料已移除，無法直接登入';
    RAISE NOTICE '2. ⚠️  本檔案僅用於資料結構展示，不可直接用於生產環境';
    RAISE NOTICE '3. ✅ 生產環境請使用完整版 seed-core.sql';
    RAISE NOTICE '4. ✅ 或透過 Supabase Auth UI 創建管理員帳號';
    RAISE NOTICE '5. ℹ️  AI Provider 需要對應的 API 金鑰配置';
    RAISE NOTICE '';
    RAISE NOTICE '📚 完整版本包含：';
    RAISE NOTICE '- Super Admin auth.users 完整記錄（含加密密碼）';
    RAISE NOTICE '- 完整的認證 token 設定';
    RAISE NOTICE '- 生產環境安全配置';
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
END $$;