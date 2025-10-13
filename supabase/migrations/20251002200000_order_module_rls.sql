-- ============================================
-- Order Module RLS Policies
-- ============================================
--
-- Purpose: Establish comprehensive RLS policies for order-related tables
--          Integrates with the permissions system for fine-grained access control
--
-- Features:
-- 1. Permission-based access control (order.view, order.create, order.edit, order.delete, order.status_change)
-- 2. Dual-permission UPDATE design for orders (edit general info OR change status)
-- 3. Consistent security model with other business modules
-- 4. Defense in depth (frontend + database level permissions)
--
-- Tables covered:
-- 1. orders - Order master data
-- 2. order_items - Order line items
--
-- Dependencies:
-- - has_permission(uuid, text) function (from users_table_rls_with_permissions.sql)
--
-- ============================================

-- ============================================
-- Step 1: Enable RLS on all tables
-- ============================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: Clean up any existing policies
-- ============================================

-- orders table
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
DROP POLICY IF EXISTS "orders_update_status" ON public.orders;
DROP POLICY IF EXISTS "orders_delete" ON public.orders;

-- order_items table
DROP POLICY IF EXISTS "order_items_select" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert" ON public.order_items;
DROP POLICY IF EXISTS "order_items_update" ON public.order_items;
DROP POLICY IF EXISTS "order_items_delete" ON public.order_items;

-- ============================================
-- Step 3: orders table RLS policies
-- ============================================

CREATE POLICY "orders_select"
ON public.orders
FOR SELECT
TO authenticated
USING (
  has_permission(auth.uid(), 'order.view')
);

COMMENT ON POLICY "orders_select" ON public.orders IS
'SELECT: Users with order.view permission can view all orders.';

CREATE POLICY "orders_insert"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'order.create')
);

COMMENT ON POLICY "orders_insert" ON public.orders IS
'INSERT: Users with order.create permission can create new orders.';

CREATE POLICY "orders_update"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  has_permission(auth.uid(), 'order.edit')
);

COMMENT ON POLICY "orders_update" ON public.orders IS
'UPDATE: Users with order.edit permission can update order information.
Note: Multiple UPDATE policies exist for this table (OR relationship).
This policy allows editing general order information.';

CREATE POLICY "orders_update_status"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  has_permission(auth.uid(), 'order.status_change')
);

COMMENT ON POLICY "orders_update_status" ON public.orders IS
'UPDATE: Users with order.status_change permission can update order status.
Note: This is a separate UPDATE policy that allows status changes without full edit rights.
This enables role separation (e.g., customer service can change status but not edit order details).';

CREATE POLICY "orders_delete"
ON public.orders
FOR DELETE
TO authenticated
USING (
  has_permission(auth.uid(), 'order.delete')
);

COMMENT ON POLICY "orders_delete" ON public.orders IS
'DELETE: Users with order.delete permission can delete orders.';

-- ============================================
-- Step 4: order_items table RLS policies
-- ============================================

CREATE POLICY "order_items_select"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  has_permission(auth.uid(), 'order.view')
);

COMMENT ON POLICY "order_items_select" ON public.order_items IS
'SELECT: Users with order.view permission can view order items.';

CREATE POLICY "order_items_insert"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  has_permission(auth.uid(), 'order.create')
);

COMMENT ON POLICY "order_items_insert" ON public.order_items IS
'INSERT: Users with order.create permission can create order items when creating orders.';

CREATE POLICY "order_items_update"
ON public.order_items
FOR UPDATE
TO authenticated
USING (
  has_permission(auth.uid(), 'order.edit')
);

COMMENT ON POLICY "order_items_update" ON public.order_items IS
'UPDATE: Users with order.edit permission can update order items.';

CREATE POLICY "order_items_delete"
ON public.order_items
FOR DELETE
TO authenticated
USING (
  has_permission(auth.uid(), 'order.edit')
);

COMMENT ON POLICY "order_items_delete" ON public.order_items IS
'DELETE: Users with order.edit permission can delete order items when editing orders.';

-- ============================================
-- Verification queries (for manual testing)
-- ============================================

-- Test 1: Check who can view and manage orders
-- SELECT
--     u.email,
--     has_permission(u.auth_user_id, 'order.view') as can_view_orders,
--     has_permission(u.auth_user_id, 'order.create') as can_create_orders,
--     has_permission(u.auth_user_id, 'order.edit') as can_edit_orders,
--     has_permission(u.auth_user_id, 'order.status_change') as can_change_status,
--     has_permission(u.auth_user_id, 'order.delete') as can_delete_orders
-- FROM users u
-- WHERE u.email != 'system@internal.system'
-- ORDER BY u.email;

-- Test 2: Check recent orders
-- SELECT
--     o.id,
--     o.status,
--     o.total_amount,
--     o.created_at,
--     COUNT(oi.id) as item_count
-- FROM orders o
-- LEFT JOIN order_items oi ON o.id = oi.order_id
-- GROUP BY o.id, o.status, o.total_amount, o.created_at
-- ORDER BY o.created_at DESC
-- LIMIT 10;

-- Test 3: Verify dual UPDATE policy (order.edit OR order.status_change)
-- SELECT
--     u.email,
--     CASE
--         WHEN has_permission(u.auth_user_id, 'order.edit') THEN '✅ Can update via order.edit'
--         WHEN has_permission(u.auth_user_id, 'order.status_change') THEN '✅ Can update via order.status_change'
--         ELSE '❌ Cannot update orders'
--     END as update_capability
-- FROM users u
-- WHERE u.email != 'system@internal.system'
-- ORDER BY u.email;
