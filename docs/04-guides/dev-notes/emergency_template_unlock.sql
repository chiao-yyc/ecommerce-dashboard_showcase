-- ================================================================================
-- 緊急系統模板解除保護腳本
-- ================================================================================
-- 
-- ⚠️  警告：僅限緊急情況使用
-- ⚠️  執行前請確保完全了解業務影響
-- ⚠️  建議在測試環境先驗證
--
-- 適用場景：
-- 1. 系統升級需要修改核心模板
-- 2. 業務流程重大變更
-- 3. 緊急修復需要暫時停用某些通知
--
-- 創建日期：2025-07-31
-- 最後更新：2025-07-31
-- ================================================================================

-- ================================================================================
-- Step 1: 系統狀態檢查
-- ================================================================================

-- 檢查當前受保護的模板
SELECT 
  type, 
  is_system_required, 
  is_active,
  usage_count,
  last_used_at,
  CASE WHEN is_system_required THEN '🔒 Protected' ELSE '✅ Normal' END as protection_status
FROM notification_templates 
WHERE is_system_required = TRUE
ORDER BY type;

-- 檢查建議通知依賴關係
SELECT 
  'suggest_completion dependencies:' as dependency_type,
  COUNT(*) as affected_functions
FROM information_schema.routines 
WHERE routine_name IN ('suggest_completion', 'suggest_inventory_completion');

-- 檢查當前通知統計
SELECT 
  type,
  COUNT(*) as notification_count,
  MAX(created_at) as latest_notification
FROM notifications 
WHERE type IN (
  'order_new', 'order_high_value', 'order_paid',
  'product_deactivated', 'product_price_major_change',
  'customer_new_registration',
  'inventory_low_stock', 'inventory_out_of_stock', 'inventory_overstock'
)
GROUP BY type
ORDER BY type;

-- ================================================================================
-- Step 2: 啟用超級管理員模式
-- ================================================================================

-- 設定特殊權限標記（允許修改系統模板）
SET app.allow_system_template_modification = 'true';

-- 確認設定生效
SELECT current_setting('app.allow_system_template_modification') as admin_mode_status;

-- ================================================================================
-- Step 3: 緊急解除保護操作
-- ================================================================================

-- ⚠️  以下範例請根據實際需求修改 ⚠️

-- 範例 1: 移除特定模板的系統保護（允許刪除）
-- UPDATE notification_templates 
-- SET is_system_required = FALSE 
-- WHERE type = 'order_new';

-- 範例 2: 批量移除多個模板的保護
-- UPDATE notification_templates 
-- SET is_system_required = FALSE 
-- WHERE type IN ('product_deactivated', 'customer_new_registration');

-- 範例 3: 暫時停用特定系統模板（不建議）
-- UPDATE notification_templates 
-- SET is_active = FALSE 
-- WHERE type = 'inventory_overstock';

-- 範例 4: 修改系統模板內容
-- UPDATE notification_templates 
-- SET title_template = '新的標題模板',
--     message_template = '新的訊息模板',
--     updated_at = NOW()
-- WHERE type = 'order_high_value';

-- ================================================================================
-- Step 4: 驗證變更結果
-- ================================================================================

-- 檢查變更後狀態
SELECT 
  type, 
  is_system_required, 
  is_active,
  title_template,
  updated_at,
  CASE WHEN is_system_required THEN '🔒 Protected' ELSE '✅ Normal' END as new_status
FROM notification_templates 
WHERE type IN (
  -- 請根據實際修改的模板調整此清單
  'order_new', 'product_deactivated', 'customer_new_registration'
)
ORDER BY type;

-- 檢查保護統計變化
SELECT 
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_system_required = TRUE) as protected_templates,
  COUNT(*) FILTER (WHERE is_system_required = FALSE) as manageable_templates,
  COUNT(*) FILTER (WHERE is_active = FALSE) as inactive_templates
FROM notification_templates;

-- ================================================================================
-- Step 5: 恢復保護模式
-- ================================================================================

-- 關閉超級管理員模式
SET app.allow_system_template_modification = 'false';

-- 確認保護模式已恢復
SELECT current_setting('app.allow_system_template_modification') as admin_mode_status;

-- 測試保護機制是否重新生效（應該失敗）
-- DELETE FROM notification_templates WHERE type = 'order_new';

-- ================================================================================
-- Step 6: 影響評估與回滾準備
-- ================================================================================

-- 檢查可能受影響的業務功能
SELECT 
  'Potentially affected functions:' as impact_assessment,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_definition LIKE '%suggest_completion%'
   OR routine_definition LIKE '%order_new%'
   OR routine_definition LIKE '%product_deactivated%'
   OR routine_definition LIKE '%customer_new_registration%';

-- 緊急回滾腳本（如需要）
/*
-- 如果變更造成問題，使用以下腳本緊急回滾

-- 重新啟用超級管理員模式
SET app.allow_system_template_modification = 'true';

-- 恢復系統模板保護
UPDATE notification_templates 
SET is_system_required = TRUE 
WHERE type IN (
  'order_new', 'order_high_value', 'order_paid',
  'product_deactivated', 'product_price_major_change',
  'customer_new_registration',
  'inventory_low_stock', 'inventory_out_of_stock', 'inventory_overstock'
);

-- 確保所有系統模板都是啟用狀態
UPDATE notification_templates 
SET is_active = TRUE 
WHERE is_system_required = TRUE;

-- 關閉超級管理員模式
SET app.allow_system_template_modification = 'false';

-- 驗證回滾結果
SELECT type, is_system_required, is_active 
FROM notification_templates 
WHERE is_system_required = TRUE;
*/

-- ================================================================================
-- 使用說明與注意事項
-- ================================================================================

/*
🚨 重要提醒：

1. 執行前準備：
   - 在測試環境先完整驗證
   - 備份 notification_templates 表
   - 通知相關開發團隊
   - 準備回滾計劃

2. 業務風險評估：
   - order_new: 影響訂單完成建議
   - order_high_value: 影響高價值訂單建議
   - product_deactivated: 影響產品重新上架建議
   - customer_new_registration: 影響客戶資訊更新建議
   - inventory_*: 影響庫存相關建議

3. 執行時機：
   - 避免業務高峰期
   - 確保有足夠時間測試和回滾
   - 建議在維護時段執行

4. 監控要點：
   - 通知創建是否正常
   - 建議通知功能是否運作
   - 前端是否有錯誤日誌
   - 用戶是否報告異常

5. 完成後檢查：
   - 系統保護機制是否恢復正常
   - 建議通知是否正常觸發
   - 相關業務流程是否正常

聯絡資訊：
- 如遇問題請立即聯絡系統管理員
- 緊急情況可使用回滾腳本
- 詳細文件請參考 NOTIFICATION_SYSTEM_TRIGGERS_FIX.md
*/