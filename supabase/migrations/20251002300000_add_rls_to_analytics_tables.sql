-- ============================================
-- Analytics Tables RLS Policies
-- ============================================
--
-- Purpose: Enable RLS on analytics and reference tables to maintain
--          consistent security architecture across the database
--
-- Tables covered:
-- - payments: Financial transaction data
-- - events: User behavior tracking
-- - funnel_events: Conversion funnel analytics
-- - system_settings: System configuration (read-only for most users)
-- - dim_date: Date dimension table (reference data)
--
-- Security Design:
-- - All authenticated users can SELECT from these tables
-- - These are primarily read-only analytics tables
-- - Future: Can add more granular policies if needed
--
-- ============================================

-- ============================================
-- 1. Payments Table
-- ============================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_all"
ON public.payments
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "payments_select_all" ON public.payments IS
'SELECT: All authenticated users can view payment records for analytics purposes.
Future: May add permission-based filtering if payment data needs to be restricted.';

-- ============================================
-- 2. Events Table (User Behavior Tracking)
-- ============================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_all"
ON public.events
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "events_select_all" ON public.events IS
'SELECT: All authenticated users can view user behavior event data.
Used for analytics dashboards and user journey analysis.';

-- ============================================
-- 3. Funnel Events Table (Conversion Analytics)
-- ============================================

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnel_events_select_all"
ON public.funnel_events
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "funnel_events_select_all" ON public.funnel_events IS
'SELECT: All authenticated users can view conversion funnel data.
Used for conversion rate analysis and funnel optimization.';

-- ============================================
-- 4. System Settings Table
-- ============================================

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_select_all"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "system_settings_select_all" ON public.system_settings IS
'SELECT: All authenticated users can read system settings.
These settings control system behavior and thresholds.
Future: Add UPDATE/DELETE policies with admin-only permissions.';

-- ============================================
-- 5. Dim Date Table (Date Dimension)
-- ============================================

ALTER TABLE public.dim_date ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dim_date_select_all"
ON public.dim_date
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "dim_date_select_all" ON public.dim_date IS
'SELECT: All authenticated users can access date dimension data.
This is a reference table used for date-based analytics queries.';

-- ============================================
-- Verification queries (for manual testing)
-- ============================================

-- Test 1: Verify RLS is enabled on all analytics tables
-- SELECT
--     schemaname,
--     tablename,
--     rowsecurity as rls_enabled,
--     (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
-- FROM pg_tables t
-- WHERE schemaname = 'public'
-- AND tablename IN ('payments', 'events', 'funnel_events', 'system_settings', 'dim_date')
-- ORDER BY tablename;

-- Test 2: Verify authenticated users can query these tables
-- SET ROLE authenticated;
-- SELECT COUNT(*) FROM payments;
-- SELECT COUNT(*) FROM events;
-- SELECT COUNT(*) FROM funnel_events;
-- SELECT COUNT(*) FROM system_settings;
-- SELECT COUNT(*) FROM dim_date;
-- RESET ROLE;
