# Supabase Realtime "Connection Closed Unexpectedly" 修復總結

## 問題現象

```
❌ Notifications Realtime 錯誤 (connection): Connection closed unexpectedly
❌ Notifications Realtime 錯誤 (channel): Channel error
```

這些錯誤在用戶登入後持續出現，影響通知實時推送功能。

---

## 根本原因

**Supabase Realtime 與 RLS (Row Level Security) 配合時，需要明確的 `filter` 參數。**

### 為什麼需要 filter？

1. **RLS 在數據庫層過濾行**：RLS policies 確保用戶只能訪問自己的數據
2. **Realtime 需要預先知道監聽範圍**：在 RLS 過濾之前，Realtime 需要知道要監聽哪些行
3. **沒有 filter 會導致權限衝突**：
   - Realtime 嘗試監聽 **所有行**
   - RLS policies 拒絕訪問其他用戶的行
   - 結果：連接被關閉，報錯 "Connection closed unexpectedly"

### 技術細節

```javascript
// ❌ 錯誤：沒有 filter
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'notifications'
})

// ✅ 正確：添加 filter
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'notifications',
  filter: `user_id=eq.${currentUserId}`  // 明確告訴 Realtime 只監聽當前用戶的數據
})
```

---

## 解決方案

### 1. 前端代碼修改

**文件：** `admin-platform-vue/src/composables/useNotification.ts`

**修改位置：** 第 939-982 行的 `subscribeToNotifications()` 函數

**變更：**

```diff
  const subscribeToNotifications = () => {
-   if (!userId?.value) return
+   const currentUserId = unref(userId)
+   if (!currentUserId) return

-   // 主通知訂閱
+   // 主通知訂閱 - 使用 filter 指定只監聽當前用戶的通知
+   // Supabase Realtime 需要明確的 filter 來配合 RLS 政策
    channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
-       { event: '*', schema: 'public', table: 'notifications' },
+       {
+         event: '*',
+         schema: 'public',
+         table: 'notifications',
+         filter: `user_id=eq.${currentUserId}`,
+       },
        async (payload: any) => {
          await handleNotificationChange(payload)
        },
      )
      ...
  }
```

### 2. 數據庫 Migration 分析

#### ✅ 保留的 Migration

**文件：** `20251015150000_grant_notifications_table_permissions.sql`

**作用：** 補充原始 migration 遺漏的 GRANT 權限和 RLS policies

```sql
-- 確保 authenticated role 有 SELECT 權限（Realtime 必需）
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- 確保 RLS policies 正確設置
CREATE POLICY "notifications_select"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  has_permission(auth.uid(), 'notification.view')
);
```

**為什麼有用：**

- 原始 migration `20250723164231_sync_notification_system.sql` 創建了 `notifications` 表但**沒有 GRANT 權限**
- Realtime 需要 SELECT 權限才能訂閱表變更
- RLS policies 確保用戶只能看到自己的通知

#### ❌ 移除的 Migration

1. **`20251015160000_enable_realtime_for_notifications.sql`**

   - **原因：** `notifications` 表已經在 `supabase_realtime` publication 中
   - **驗證：** `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'` 顯示 `notifications` 已存在

2. **`20251015170000_add_welcome_notification_trigger.sql`**
   - **原因：** 所有用戶已經有通知數據，空表問題不存在
   - **驗證：** 本地和雲端用戶都有通知記錄

---

## 為什麼之前的修復無效

### 嘗試 1：添加 GRANT 權限 ✅ 必要但不充分

- **結果：** 解決了部分權限問題，但錯誤仍然存在
- **原因：** GRANT 權限只解決了表級訪問，沒有解決 RLS + Realtime 的配合問題

### 嘗試 2：添加到 Realtime Publication ❌ 無效

- **結果：** 表已經在 publication 中，重複添加
- **原因：** Publication 配置本來就正確

### 嘗試 3：創建歡迎通知 ❌ 無關

- **結果：** 用戶已有通知數據，空表不是問題
- **原因：** 真正的問題是 filter 缺失，不是數據缺失

---

## 根本問題：缺少 Filter 參數 🎯

**所有之前的修復都忽略了一個關鍵點：**

> Supabase Realtime 在訂閱帶有 RLS 的表時，**必須**使用 `filter` 參數來明確指定要監聽的行範圍。

這在 Supabase 官方文件中有說明：

- [Realtime with RLS](https://supabase.com/docs/guides/realtime/postgres-changes#realtime-rls)
- [GitHub Issue #608](https://github.com/supabase/realtime/issues/608)

---

## 測試方法

1. 清除瀏覽器快取和 LocalStorage
2. 重新登入應用
3. 觀察 Console：
   - ✅ 正確：沒有 "Connection closed unexpectedly" 錯誤
   - ✅ 正確：看到 "SUBSCRIBED" 狀態
   - ✅ 正確：新通知可以實時推送

---

## 總結

| 組件                 | 狀態          | 說明                                                       |
| -------------------- | ------------- | ---------------------------------------------------------- |
| GRANT 權限           | ✅ 已修復     | `20251015150000_grant_notifications_table_permissions.sql` |
| RLS Policies         | ✅ 已修復     | `20251015150000_grant_notifications_table_permissions.sql` |
| Realtime Publication | ✅ 原本正確   | 無需修改                                                   |
| **Filter 參數**      | ✅ **已修復** | **`useNotification.ts:953` 添加 `filter`**                 |

### 關鍵修復

**前端添加 filter 參數是解決問題的關鍵。**

```javascript
filter: `user_id=eq.${currentUserId}`;
```

這告訴 Realtime：

1. 只監聽 `user_id = currentUserId` 的行
2. 避免嘗試訪問其他用戶的數據
3. 與 RLS policy 完美配合

---

## 部署步驟

### 1. 前端代碼已修改

✅ 已完成：`admin-platform-vue/src/composables/useNotification.ts` 添加 `filter` 參數

### 2. 數據庫 Migration

✅ 已完成：`20251015150000_grant_notifications_table_permissions.sql` 已部署

### 3. 清理無效 Migration

✅ 已完成：刪除了兩個無效的 migration 並修復 history

```bash
# 已執行的清理命令
rm supabase/migrations/20251015160000_enable_realtime_for_notifications.sql
rm supabase/migrations/20251015170000_add_welcome_notification_trigger.sql
supabase migration repair --status reverted 20251015160000 20251015170000
```

### 4. 前端部署

需要部署前端代碼更新：

```bash
cd admin-platform-vue
npm run build
# 部署到生產環境
```

---

## 相關文件

- **前端修改：** `admin-platform-vue/src/composables/useNotification.ts`
- **數據庫修復：** `supabase/migrations/20251015150000_grant_notifications_table_permissions.sql`
- **本文件：** `REALTIME_FIX_SUMMARY.md`

---

## 參考資料

- [Supabase Realtime with RLS](https://supabase.com/docs/guides/realtime/postgres-changes#realtime-rls)
- [Supabase Realtime Filters](https://supabase.com/docs/guides/realtime/postgres-changes#available-filters)
- [GitHub Issue: Realtime + RLS](https://github.com/supabase/realtime/issues/608)
