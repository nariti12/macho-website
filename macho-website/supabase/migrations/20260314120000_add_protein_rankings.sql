create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'rakuten',
  source_external_id text not null,
  ec_provider text not null default 'rakuten',
  title text not null,
  description text,
  image_url text,
  price_yen integer not null,
  review_average numeric(3,2),
  review_count integer not null default 0,
  item_url text,
  affiliate_url text,
  shop_name text,
  matched_queries text[] not null default '{}',
  discovery_score numeric(6,5) not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_external_id)
);

create table if not exists public.product_metrics (
  product_id uuid primary key references public.products(id) on delete cascade,
  content_weight_g numeric(10,2),
  serving_size_g numeric(10,2),
  protein_per_serving_g numeric(10,2),
  protein_per_100g_g numeric(10,2),
  protein_ratio numeric(7,5),
  protein_type text not null default 'other',
  women_keyword_matches text[] not null default '{}',
  beauty_keyword_matches text[] not null default '{}',
  diet_keyword_matches text[] not null default '{}',
  price_per_protein_gram numeric(10,4),
  excluded boolean not null default false,
  exclusion_reason text,
  extract_version text not null default 'v1',
  raw_extraction jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  ranking_key text not null check (ranking_key in ('cost-performance', 'composition', 'women')),
  product_id uuid not null references public.products(id) on delete cascade,
  rank_position integer not null check (rank_position between 1 and 5),
  score numeric(7,5) not null,
  comment text,
  score_breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ranking_key, rank_position),
  unique (ranking_key, product_id)
);

create table if not exists public.expert_signals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  signal_key text not null,
  bonus numeric(6,4) not null default 0,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, signal_key)
);

create index if not exists products_source_external_id_idx on public.products(source, source_external_id);
create index if not exists rankings_ranking_key_rank_position_idx on public.rankings(ranking_key, rank_position);

alter table public.products enable row level security;
alter table public.product_metrics enable row level security;
alter table public.rankings enable row level security;
alter table public.expert_signals enable row level security;

drop policy if exists "public read products" on public.products;
create policy "public read products"
  on public.products
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public read product_metrics" on public.product_metrics;
create policy "public read product_metrics"
  on public.product_metrics
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public read rankings" on public.rankings;
create policy "public read rankings"
  on public.rankings
  for select
  to anon, authenticated
  using (true);
