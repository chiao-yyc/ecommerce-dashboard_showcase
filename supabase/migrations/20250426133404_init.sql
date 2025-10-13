--------------------------------------------------------------------------------
-- 使用者與角色
--------------------------------------------------------------------------------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  auth_user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.roles (
  id serial primary key,
  name text unique not null,
  description text
);

create table public.user_roles (
  user_id uuid references public.users(id) on delete cascade,
  role_id int  references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

--------------------------------------------------------------------------------
-- 顧客
--------------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  registered_at timestamptz default now(),
  status text default 'active'
);

--------------------------------------------------------------------------------
-- 分類 & 商品
--------------------------------------------------------------------------------
create table public.categories (
  id serial primary key,
  name text,
  description text,
  translations jsonb
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text,
  price numeric(10,2),
  stock int default 0,
  stock_warning_threshold int default 10,
  category_id int references public.categories(id),
  image_url text,
  translations jsonb,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 庫存
--------------------------------------------------------------------------------
create table public.inventories (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  sku text,
  stock int default 0,
  updated_at timestamptz default now()
);

create table public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventories(id),
  change int,
  type text,
  reference text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create table public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventories(id),
  adjust_type text,
  quantity_before int,
  quantity_after int,
  reason text,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 訂單
--------------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  user_id uuid references public.users(id),
  status text check (status in ('pending','paid','shipped','cancelled','completed')),
  total_amount numeric(10,2),
  created_at timestamptz default now()
);

create table public.order_items (
  id serial primary key,
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity int,
  unit_price numeric(10,2)
);

--------------------------------------------------------------------------------
-- RFM 與顧客分析
--------------------------------------------------------------------------------
create table public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id),
  order_date timestamptz,
  amount numeric(10,2),
  status text default 'completed'
);

create table public.rfm_segments (
  id serial primary key,
  rfm_pattern varchar(10),
  label text,
  description text,
  priority int default 1
);

create table public.rfm_scores (
  id serial primary key,
  customer_id uuid references public.customers(id),
  recency_days int,
  frequency int,
  monetary numeric(10,2),
  r_score int check (r_score between 1 and 5),
  f_score int check (f_score between 1 and 5),
  m_score int check (m_score between 1 and 5),
  rfm_segment varchar(10),
  rfm_label text,
  calculated_at timestamptz default now()
);

create materialized view public.user_rfm_view as
select
  customer_id,
  max(order_date)                         as last_order_at,
  count(*)                                as frequency,
  sum(amount)                             as total_spent
from public.customer_orders
where status = 'completed'
group by customer_id;

--------------------------------------------------------------------------------
-- 客服
--------------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  status text default 'open',
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.users(id),
  message text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  status text,
  priority text,
  subject text,
  description text,
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 行為追蹤
--------------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  type text,
  user_id uuid references public.users(id),
  payload jsonb,
  created_at timestamptz default now()
);

create table public.funnel_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  step text,
  event_at timestamptz,
  product_id uuid,
  session_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  login_at timestamptz,
  logout_at timestamptz,
  ip_address text,
  device text,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- 工具 / 測試
--------------------------------------------------------------------------------
create table public.test_data_log (
  id uuid primary key default gen_random_uuid(),
  description text,
  created_at timestamptz default now()
);
