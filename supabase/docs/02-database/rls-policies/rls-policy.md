# Row‑Level Security Policy

> 所有表皆 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`

| 資料表 | Policy 名稱 | 動作 | 條件 (`USING`) |
|--------|-------------|------|----------------|
| `orders` | `user_can_view_own_orders` | SELECT | `user_id = auth.uid()` |
| `order_items` | `user_items_by_parent` | SELECT | `order_id in (select id from orders where user_id = auth.uid())` |
| `inventories` | `admin_only_inventory` | ALL | `exists (select 1 from user_roles ur join roles r on ur.role_id=r.id where ur.user_id = auth.uid() and r.name = 'admin')` |
| `inventory_logs` | 同上 | ALL | 同上 |
| `conversations` | `conversation_owner_or_admin` | SELECT | `user_id = auth.uid() or (select r.name from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=auth.uid()) = 'admin'` |
| `messages` | `conversation_member` | SELECT | `conversation_id in (select id from conversations where user_id = auth.uid())` |
| `tickets` | `owner_or_admin` | SELECT | `user_id = auth.uid() or is_admin()` |

### Helper Function

```sql
create function public.is_admin()
returns boolean
language sql stable as $$
  select exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.name = 'admin'
  );
$$;
```

**說明**  
- 一般使用者僅能檢視／操作自己的訂單、對話與工單  
- `admin` 角色（透過 `user_roles` 綁定）可讀寫所有庫存與日誌  
- Realtime 訂閱同樣受 RLS 約束，前端直連安全無虞

---

> 以上 schema 已可直接匯入 Supabase SQL Editor；RLS policy 請依實際角色名稱再調整。  
> 如需額外索引、觸發器（庫存扣減/回補）或 Materialized View schedule，可在實作階段持續追加。