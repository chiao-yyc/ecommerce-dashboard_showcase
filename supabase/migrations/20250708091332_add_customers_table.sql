revoke delete on table "public"."trigger_test_log" from "anon";

revoke insert on table "public"."trigger_test_log" from "anon";

revoke references on table "public"."trigger_test_log" from "anon";

revoke select on table "public"."trigger_test_log" from "anon";

revoke trigger on table "public"."trigger_test_log" from "anon";

revoke truncate on table "public"."trigger_test_log" from "anon";

revoke update on table "public"."trigger_test_log" from "anon";

revoke delete on table "public"."trigger_test_log" from "authenticated";

revoke insert on table "public"."trigger_test_log" from "authenticated";

revoke references on table "public"."trigger_test_log" from "authenticated";

revoke select on table "public"."trigger_test_log" from "authenticated";

revoke trigger on table "public"."trigger_test_log" from "authenticated";

revoke truncate on table "public"."trigger_test_log" from "authenticated";

revoke update on table "public"."trigger_test_log" from "authenticated";

revoke delete on table "public"."trigger_test_log" from "service_role";

revoke insert on table "public"."trigger_test_log" from "service_role";

revoke references on table "public"."trigger_test_log" from "service_role";

revoke select on table "public"."trigger_test_log" from "service_role";

revoke trigger on table "public"."trigger_test_log" from "service_role";

revoke truncate on table "public"."trigger_test_log" from "service_role";

revoke update on table "public"."trigger_test_log" from "service_role";

alter table "public"."conversations" drop constraint "conversations_analysis_status_check";

alter table "public"."order_items" drop constraint "order_items_status_check";

alter table "public"."orders" drop constraint "orders_user_id_fkey";

drop function if exists "public"."get_user_rfm_overview"(role text);

drop view if exists "public"."user_rfm_lifecycle_metrics";

drop view if exists "public"."order_amount_histogram_bins";

drop view if exists "public"."revenue_ltv_distribution";

drop view if exists "public"."user_ltv_metrics";

alter table "public"."trigger_test_log" drop constraint "trigger_test_log_pkey";

drop index if exists "public"."trigger_test_log_pkey";

drop table "public"."trigger_test_log";

create table "public"."customers" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "auth_user_id" uuid,
    "created_at" timestamp with time zone default now(),
    "phone" text,
    "deleted_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


alter table "public"."rfm_segment_mapping" alter column "rfm_pattern" set not null;

drop sequence if exists "public"."trigger_test_log_id_seq";

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE INDEX idx_customers_auth_user_id ON public.customers USING btree (auth_user_id);

CREATE INDEX idx_customers_email ON public.customers USING btree (email);

CREATE INDEX idx_rfm_segment_mapping_pattern ON public.rfm_segment_mapping USING btree (rfm_pattern);

CREATE INDEX idx_rfm_segment_mapping_segment_name ON public.rfm_segment_mapping USING btree (segment_name);

CREATE INDEX idx_users_auth_user_id ON public.users USING btree (auth_user_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."customers" add constraint "customers_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."customers" validate constraint "customers_auth_user_id_fkey";

alter table "public"."customers" add constraint "customers_email_key" UNIQUE using index "customers_email_key";

alter table "public"."conversations" add constraint "conversations_analysis_status_check" CHECK (((analysis_status)::text = ANY ((ARRAY['pending_analysis'::character varying, 'analyzed'::character varying, 'failed_analysis'::character varying])::text[]))) not valid;

alter table "public"."conversations" validate constraint "conversations_analysis_status_check";

alter table "public"."order_items" add constraint "order_items_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'cancelled'::character varying, 'returned'::character varying])::text[]))) not valid;

alter table "public"."order_items" validate constraint "order_items_status_check";

alter table "public"."orders" add constraint "orders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES customers(id) not valid;

alter table "public"."orders" validate constraint "orders_user_id_fkey";

set check_function_bodies = off;

create or replace view "public"."customer_details" as  SELECT c.id,
    c.email,
    c.full_name,
    c.avatar_url,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    c.phone,
    get_user_providers(c.auth_user_id) AS providers
   FROM customers c
  GROUP BY c.id, c.email, c.full_name, c.avatar_url, c.created_at, c.updated_at, c.deleted_at, c.phone, c.auth_user_id;


create or replace view "public"."customer_ltv_metrics" as  SELECT o.user_id,
    min(o.created_at) AS first_purchase_date,
    max(o.created_at) AS last_purchase_date,
    count(*) AS purchase_count,
    sum(o.total_amount) AS total_revenue,
    round((sum(o.total_amount) / (NULLIF(count(*), 0))::numeric), 2) AS aov,
    round(GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric), 2) AS lifespan_months,
    round(((count(*))::numeric / NULLIF(GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric), (1)::numeric)), 2) AS purchase_frequency_per_month,
    round((((sum(o.total_amount) / (NULLIF(count(*), 0))::numeric) * ((count(*))::numeric / NULLIF(GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric), (1)::numeric))) * GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric)), 2) AS estimated_ltv,
        CASE
            WHEN ((((sum(o.total_amount) / (NULLIF(count(*), 0))::numeric) * ((count(*))::numeric / NULLIF(GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric), (1)::numeric))) * GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric)) >= (5000)::numeric) THEN 'High'::text
            WHEN ((((sum(o.total_amount) / (NULLIF(count(*), 0))::numeric) * ((count(*))::numeric / NULLIF(GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric), (1)::numeric))) * GREATEST((EXTRACT(epoch FROM (max(o.created_at) - min(o.created_at))) / ((((60 * 60) * 24) * 30))::numeric), (1)::numeric)) >= (2000)::numeric) THEN 'Medium'::text
            ELSE 'Low'::text
        END AS ltv_segment
   FROM orders o
  WHERE (o.status = ANY (ARRAY['paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'completed'::text]))
  GROUP BY o.user_id;


create or replace view "public"."customer_rfm_lifecycle_metrics" as  WITH user_purchase_data AS (
         SELECT o.user_id,
            min(o.created_at) AS first_purchase_date,
            max(o.created_at) AS last_purchase_date,
            count(DISTINCT o.id) AS frequency,
            sum(o.total_amount) AS monetary
           FROM orders o
          WHERE (o.status = ANY (ARRAY['paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'completed'::text]))
          GROUP BY o.user_id
        ), recency_calc AS (
         SELECT upd.user_id,
            upd.first_purchase_date,
            upd.last_purchase_date,
            upd.frequency,
            upd.monetary,
            EXTRACT(day FROM (CURRENT_TIMESTAMP - upd.last_purchase_date)) AS recency_days
           FROM user_purchase_data upd
        ), rfm_scores AS (
         SELECT rc.user_id,
            rc.first_purchase_date,
            rc.last_purchase_date,
            rc.frequency,
            rc.monetary,
            rc.recency_days,
                CASE
                    WHEN (rc.recency_days <= (7)::numeric) THEN 5
                    WHEN (rc.recency_days <= (14)::numeric) THEN 4
                    WHEN (rc.recency_days <= (30)::numeric) THEN 3
                    WHEN (rc.recency_days <= (60)::numeric) THEN 2
                    ELSE 1
                END AS r_score,
                CASE
                    WHEN (rc.frequency >= 10) THEN 5
                    WHEN (rc.frequency >= 5) THEN 4
                    WHEN (rc.frequency >= 3) THEN 3
                    WHEN (rc.frequency >= 2) THEN 2
                    ELSE 1
                END AS f_score,
                CASE
                    WHEN (rc.monetary >= (5000)::numeric) THEN 5
                    WHEN (rc.monetary >= (3000)::numeric) THEN 4
                    WHEN (rc.monetary >= (1000)::numeric) THEN 3
                    WHEN (rc.monetary >= (500)::numeric) THEN 2
                    ELSE 1
                END AS m_score
           FROM recency_calc rc
        ), rfm_segment AS (
         SELECT r.user_id,
            r.first_purchase_date,
            r.last_purchase_date,
            r.frequency,
            r.monetary,
            r.recency_days,
            r.r_score,
            r.f_score,
            r.m_score,
            (((r.r_score)::text || (r.f_score)::text) || (r.m_score)::text) AS rfm_segment,
                CASE
                    WHEN ((r.recency_days <= (30)::numeric) AND (r.frequency >= 2)) THEN 'Active'::text
                    WHEN ((r.recency_days >= (31)::numeric) AND (r.recency_days <= (90)::numeric) AND (r.frequency >= 2)) THEN 'At Risk'::text
                    WHEN ((r.recency_days > (90)::numeric) AND (r.frequency >= 2)) THEN 'Churned'::text
                    WHEN ((r.frequency = 1) AND (r.recency_days <= (90)::numeric)) THEN 'New'::text
                    WHEN ((r.frequency = 1) AND (r.recency_days > (90)::numeric)) THEN 'One-time Past'::text
                    ELSE 'Other'::text
                END AS lifecycle_stage
           FROM rfm_scores r
        )
 SELECT rfm.user_id,
    c.full_name,
    c.email,
    rfm.recency_days,
    rfm.frequency,
    rfm.monetary,
    rfm.r_score,
    rfm.f_score,
    rfm.m_score,
    rfm.rfm_segment,
    rfm.first_purchase_date,
    rfm.last_purchase_date,
    rfm.lifecycle_stage
   FROM (rfm_segment rfm
     JOIN customers c ON ((rfm.user_id = c.id)));


CREATE OR REPLACE FUNCTION public.get_customer_rfm_overview(role text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$DECLARE
    result jsonb;
    active_users_count integer;
    -- vip_users_count integer;
    avg_monetary numeric;
    at_risk_users_count integer;
    user_ids uuid[];
BEGIN
    -- 如果指定了角色，先獲取符合該角色的用戶ID
    -- IF role IS NOT NULL THEN
    --     SELECT array_agg(u.id)
    --     INTO user_ids
    --     FROM users u
    --     JOIN user_roles ur ON u.id = ur.user_id
    --     JOIN roles r ON ur.role_id = r.id
    --     WHERE r.name = role;
    -- END IF;
    
    -- 活躍用戶數 (lifecycle_stage = 'Active')
    SELECT COUNT(*)
    INTO active_users_count
    FROM public.customer_rfm_lifecycle_metrics rfm
    WHERE lifecycle_stage = 'Active'
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- VIP客戶數 (使用 segment_name = 'VIP' 識別，只要符合就計算)
    -- SELECT COUNT(DISTINCT rfm.user_id)
    -- INTO vip_users_count
    -- FROM public.customer_rfm_lifecycle_metrics rfm
    -- JOIN public.rfm_segment_mapping map ON 
    --     rfm.rfm_segment SIMILAR TO REPLACE(REPLACE(map.rfm_pattern, 'X', '_'), '_', '[1-5]')
    -- WHERE map.segment_name = 'VIP'
    -- AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- 平均 monetary
    SELECT COALESCE(ROUND(AVG(monetary), 2), 0)
    INTO avg_monetary
    FROM public.customer_rfm_lifecycle_metrics rfm
    WHERE monetary > 0
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- At Risk 客戶數 (lifecycle_stage = 'At Risk')
    SELECT COUNT(*)
    INTO at_risk_users_count
    FROM public.customer_rfm_lifecycle_metrics rfm
    WHERE lifecycle_stage = 'At Risk'
    AND (role IS NULL OR rfm.user_id = ANY(user_ids));

    -- 組裝結果
    SELECT jsonb_build_object(
        'active_users_count', active_users_count,
        -- 'vip_users_count', vip_users_count,
        'average_monetary', avg_monetary,
        'at_risk_users_count', at_risk_users_count
    ) INTO result;

    RETURN result;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_customer_analysis(period_start date DEFAULT NULL::date, period_end date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$DECLARE
  s date := COALESCE(period_start, CURRENT_DATE - INTERVAL '30 days');
  e date := COALESCE(period_end,   CURRENT_DATE);
  result jsonb;
BEGIN
  WITH orders_in_range AS (
    SELECT *
    FROM   orders
    WHERE  status IN ('paid', 'fulfilled')
      AND  created_at::date BETWEEN s AND e
  ),
  customers_in_range AS (
    SELECT DISTINCT user_id
    FROM   orders_in_range
  ),

  customer_summary AS (
    SELECT
      COUNT(*)                             AS total_customers,
      COUNT(DISTINCT CASE WHEN first_order_date BETWEEN s AND e THEN user_id END) AS new_customers,
      COUNT(DISTINCT CASE WHEN order_count > 1 THEN user_id END) AS returning_customers
    FROM (
      SELECT
        c.id                    AS user_id,
        MIN(o.created_at::date) AS first_order_date,
        COUNT(o.*)              AS order_count
      FROM customers_in_range cir
      JOIN customers c         ON c.id = cir.user_id
      JOIN orders_in_range o ON o.user_id = c.id
      GROUP BY c.id
    ) t
  ),

  weekly_lifecycle AS (
    SELECT
      DATE_TRUNC('week', last_purchase_date)::date AS week_start,
      lifecycle_stage,
      COUNT(*) AS user_count
    FROM   customer_rfm_lifecycle_metrics
    WHERE  user_id IN (SELECT user_id FROM customers_in_range)
      AND  last_purchase_date BETWEEN s AND e
    GROUP  BY 1, 2
    ORDER  BY 1, 2
  ),

  segment_dist AS (
    SELECT
      map.segment_name,
      COUNT(*) AS user_count
    FROM   customer_rfm_lifecycle_metrics ulm
    JOIN   rfm_segment_mapping map
           ON ulm.rfm_segment SIMILAR TO REPLACE(REPLACE(map.rfm_pattern,'X','_'),'_','[1-5]')
    WHERE  ulm.user_id IN (SELECT user_id FROM customers_in_range)
    GROUP  BY map.segment_name
  ),

  freq_dist AS (
    SELECT
      CASE
        WHEN frequency = 1                 THEN '1次'
        WHEN frequency = 2                 THEN '2次'
        WHEN frequency BETWEEN 3 AND 5     THEN '3-5次'
        WHEN frequency BETWEEN 6 AND 10    THEN '6-10次'
        ELSE '10次以上'
      END AS frequency_band,
      COUNT(*) AS user_count
    FROM   customer_rfm_lifecycle_metrics
    WHERE  user_id IN (SELECT user_id FROM customers_in_range)
    GROUP  BY 1
  ),

  top_customers AS (
    SELECT
      o.user_id,
      c.full_name              AS customer_name,
      COUNT(*)                 AS order_count,
      SUM(o.total_amount)      AS sales_amount
    FROM   orders_in_range o
    JOIN   customers c ON c.id = o.user_id
    GROUP  BY o.user_id, c.full_name
    ORDER  BY sales_amount DESC
    LIMIT  10
  )

  SELECT jsonb_build_object(
           'period',               jsonb_build_object('start', s, 'end', e),
           'customer_summary',     (SELECT to_jsonb(cs) FROM customer_summary cs),
           'lifecycle_trend',      (SELECT jsonb_agg(wl) FROM weekly_lifecycle wl),
           'segment_distribution', (SELECT jsonb_agg(sd) FROM segment_dist sd),
           'frequency_distribution',(SELECT jsonb_agg(fd) FROM freq_dist fd),
           'top_customers',        (SELECT jsonb_agg(tc) FROM top_customers tc)
         )
  INTO result;

  RETURN result;
END$function$
;

create or replace view "public"."order_amount_histogram_bins" as  WITH enriched_orders AS (
         SELECT o.id,
            o.total_amount,
            u.user_id,
            u.first_purchase_date,
            o.created_at,
            ((floor((o.total_amount / (1000)::numeric)))::integer * 1000) AS bucket_start
           FROM (orders o
             LEFT JOIN customer_ltv_metrics u ON ((u.user_id = o.user_id)))
          WHERE (o.total_amount IS NOT NULL)
        )
 SELECT enriched_orders.bucket_start,
    (enriched_orders.bucket_start + 999) AS bucket_end,
    count(*) AS order_count,
    round(avg(enriched_orders.total_amount), 2) AS avg_order_value_in_bucket,
    sum(enriched_orders.total_amount) AS total_revenue_in_bucket,
    count(*) FILTER (WHERE ((enriched_orders.first_purchase_date)::date = (enriched_orders.created_at)::date)) AS new_customer_orders,
    count(*) FILTER (WHERE ((enriched_orders.first_purchase_date)::date < (enriched_orders.created_at)::date)) AS returning_customer_orders,
    count(*) FILTER (WHERE ((enriched_orders.first_purchase_date IS NULL) OR ((enriched_orders.first_purchase_date)::date > (enriched_orders.created_at)::date))) AS unknown_customer_orders,
    sum(enriched_orders.total_amount) FILTER (WHERE ((enriched_orders.first_purchase_date)::date = (enriched_orders.created_at)::date)) AS new_customer_revenue,
    sum(enriched_orders.total_amount) FILTER (WHERE ((enriched_orders.first_purchase_date)::date < (enriched_orders.created_at)::date)) AS returning_customer_revenue,
    sum(enriched_orders.total_amount) FILTER (WHERE ((enriched_orders.first_purchase_date IS NULL) OR ((enriched_orders.first_purchase_date)::date > (enriched_orders.created_at)::date))) AS unknown_customer_revenue,
    round((((count(*))::numeric * 100.0) / sum(count(*)) OVER ()), 2) AS order_percentage_of_total
   FROM enriched_orders
  GROUP BY enriched_orders.bucket_start
  ORDER BY enriched_orders.bucket_start;


create or replace view "public"."revenue_ltv_distribution" as  WITH enriched_orders AS (
         SELECT o.id,
            o.user_id,
            o.total_amount,
            u.ltv_segment,
            (o.created_at)::date AS order_date,
            o.status
           FROM (orders o
             LEFT JOIN customer_ltv_metrics u ON ((o.user_id = u.user_id)))
          WHERE ((o.status = ANY (ARRAY['paid'::text, 'processing'::text, 'shipped'::text, 'delivered'::text, 'completed'::text])) AND (o.total_amount IS NOT NULL))
        )
 SELECT enriched_orders.ltv_segment,
    count(*) AS order_count,
    sum(enriched_orders.total_amount) AS total_revenue,
    round(avg(enriched_orders.total_amount), 2) AS avg_order_amount,
    count(DISTINCT enriched_orders.user_id) AS distinct_customers
   FROM enriched_orders
  GROUP BY enriched_orders.ltv_segment
  ORDER BY (sum(enriched_orders.total_amount)) DESC;


grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


