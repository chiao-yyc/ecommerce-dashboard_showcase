CREATE OR REPLACE FUNCTION get_order_trend_analysis(start_date DATE, end_date DATE)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    WITH
    -- 1. 篩選指定期間內的有效訂單
    orders_in_range AS (
      SELECT *
      FROM orders
      WHERE status IN ('paid', 'fulfilled')
        AND created_at::date BETWEEN start_date AND end_date
    ),

    -- 2. 訂單總覽統計
    order_summary AS (
      SELECT
        COUNT(*) AS total_orders,
        SUM(total_amount) AS gross_sales
      FROM orders_in_range
    ),

    -- 3. 每日銷售趨勢
    daily_order_trend AS (
      SELECT
        created_at::date AS day,
        COUNT(*) AS order_count,
        SUM(total_amount) AS sales_amount
      FROM orders_in_range
      GROUP BY created_at::date
      ORDER BY created_at::date
    ),

    -- 4. 銷售最高商品
    top_products_by_sales AS (
      SELECT
        oi.product_id,
        p.name AS product_name,
        SUM(oi.quantity) AS quantity_sold,
        SUM(oi.quantity * oi.unit_price) AS sales_amount
      FROM orders_in_range o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      GROUP BY oi.product_id, p.name
      ORDER BY sales_amount DESC
      LIMIT 10
    ),

    -- 5. 消費金額最高顧客
    top_customers_by_sales AS (
      SELECT
        o.user_id,
        u.full_name AS customer_name,
        COUNT(*) AS order_count,
        SUM(o.total_amount) AS sales_amount
      FROM orders_in_range o
      JOIN users u ON u.id = o.user_id
      GROUP BY o.user_id, u.full_name
      ORDER BY sales_amount DESC
      LIMIT 10
    )

    -- 6. 將結果組合成 JSONB
    SELECT jsonb_build_object(
      'period', jsonb_build_object('start', start_date, 'end', end_date),
      'order_summary', (SELECT to_jsonb(summary) FROM order_summary summary),
      'daily_order_trend', (SELECT jsonb_agg(daily_order_trend) FROM daily_order_trend),
      'top_products_by_sales', (SELECT jsonb_agg(top_products_by_sales) FROM top_products_by_sales),
      'top_customers_by_sales', (SELECT jsonb_agg(top_customers_by_sales) FROM top_customers_by_sales)
    )
  );
END;
$$ LANGUAGE plpgsql;






-- 刪除舊函式（避免參數衝突）
DROP FUNCTION IF EXISTS get_product_sales_analysis(date, date);

-- 建立優化後的新函式
CREATE FUNCTION get_product_sales_analysis(start_date DATE, end_date DATE)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    WITH sales AS (
      SELECT
        oi.*,
        o.created_at::date AS order_date
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('paid', 'fulfilled')
        AND o.created_at::date BETWEEN start_date AND end_date
    ),
    sales_summary AS (
      SELECT
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(quantity) AS total_quantity,
        SUM(quantity * unit_price) AS total_sales_amount
      FROM sales
    ),
    daily_sales_trend AS (
      SELECT
        order_date AS day,
        SUM(quantity * unit_price) AS sales_amount
      FROM sales
      GROUP BY order_date
      ORDER BY order_date
    ),
    category_stats AS (
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        COUNT(DISTINCT p.id) AS product_count,
        SUM(s.quantity * s.unit_price) AS sales_amount
      FROM sales s
      JOIN products p ON p.id = s.product_id
      JOIN categories c ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY sales_amount DESC
    ),
    top_products AS (
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(s.quantity) AS quantity_sold,
        SUM(s.quantity * s.unit_price) AS sales_amount
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.id, p.name
      ORDER BY sales_amount DESC
      LIMIT 10
    )
    SELECT jsonb_build_object(
      'period', jsonb_build_object('start', start_date, 'end', end_date),
      'sales_summary', (SELECT to_jsonb(ss) FROM sales_summary ss),
      'daily_sales_trend', (SELECT jsonb_agg(dst) FROM daily_sales_trend dst),
      'category_stats', (SELECT jsonb_agg(cs) FROM category_stats cs),
      'top_selling_products', (SELECT jsonb_agg(tp) FROM top_products tp)
    )
  );
END;
$$ LANGUAGE plpgsql;






DROP FUNCTION IF EXISTS get_inventory_analysis(date, date);

CREATE FUNCTION get_inventory_analysis(start_date DATE, end_date DATE)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    WITH
    stock_now AS (
      SELECT
        COUNT(*) AS total_products,
        SUM(free_stock) AS total_stock_qty,
        AVG(free_stock) AS avg_stock_per_product
      FROM product_inventory_status
    ),

    low_stock AS (
      SELECT
        product_id,
        name,
        free_stock,
        stock_threshold
      FROM product_inventory_status
      WHERE free_stock <= stock_threshold
      ORDER BY free_stock
      LIMIT 20
    ),

    movements AS (
      SELECT
        il.type AS movement_type,
        SUM(il.quantity) AS total_qty
      FROM inventory_logs il
      JOIN inventories i ON il.inventory_id = i.id
      WHERE il.created_at::date BETWEEN start_date AND end_date
      GROUP BY il.type
    ),

    top_received AS (
      SELECT
        i.product_id,
        p.name AS product_name,
        SUM(il.quantity) AS received_qty
      FROM inventory_logs il
      JOIN inventories i ON il.inventory_id = i.id
      JOIN products p ON p.id = i.product_id
      WHERE il.type = 'in' AND il.created_at::date BETWEEN start_date AND end_date
      GROUP BY i.product_id, p.name
      ORDER BY received_qty DESC
      LIMIT 10
    )

    SELECT jsonb_build_object(
      'period', jsonb_build_object('start', start_date, 'end', end_date),
      'current_stock_summary', (SELECT to_jsonb(sn) FROM stock_now sn),
      'low_stock_alerts', (SELECT jsonb_agg(ls) FROM low_stock ls),
      'inventory_movements', (SELECT jsonb_agg(mv) FROM movements mv),
      'top_received_products', (SELECT jsonb_agg(tr) FROM top_received tr)
    )
  );
END;
$$ LANGUAGE plpgsql;










DROP FUNCTION IF EXISTS get_customer_analysis(date, date);

CREATE OR REPLACE FUNCTION public.get_customer_analysis(
  period_start date DEFAULT NULL,
  period_end   date DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
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
        u.id                    AS user_id,
        MIN(o.created_at::date) AS first_order_date,
        COUNT(o.*)              AS order_count
      FROM customers_in_range cir
      JOIN users u         ON u.id = cir.user_id
      JOIN orders_in_range o ON o.user_id = u.id
      GROUP BY u.id
    ) t
  ),

  weekly_lifecycle AS (
    SELECT
      DATE_TRUNC('week', last_purchase_date)::date AS week_start,
      lifecycle_stage,
      COUNT(*) AS user_count
    FROM   user_rfm_lifecycle_metrics
    WHERE  user_id IN (SELECT user_id FROM customers_in_range)
      AND  last_purchase_date BETWEEN s AND e
    GROUP  BY 1, 2
    ORDER  BY 1, 2
  ),

  segment_dist AS (
    SELECT
      map.segment_name,
      COUNT(*) AS user_count
    FROM   user_rfm_lifecycle_metrics ulm
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
    FROM   user_rfm_lifecycle_metrics
    WHERE  user_id IN (SELECT user_id FROM customers_in_range)
    GROUP  BY 1
  ),

  top_customers AS (
    SELECT
      o.user_id,
      u.full_name              AS customer_name,
      COUNT(*)                 AS order_count,
      SUM(o.total_amount)      AS sales_amount
    FROM   orders_in_range o
    JOIN   users u ON u.id = o.user_id
    GROUP  BY o.user_id, u.full_name
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
END
$$;









-- 測試：過去 30 天訂單趨勢
SELECT get_order_trend_analysis();

-- 測試：指定區間
SELECT get_order_trend_analysis('2025-05-01', '2025-05-31');
SELECT get_product_sales_analysis('2025-05-01', '2025-05-31');
SELECT get_inventory_analysis('2025-05-01', '2025-05-31');
SELECT get_customer_analysis('2024-05-01', '2025-05-31');
