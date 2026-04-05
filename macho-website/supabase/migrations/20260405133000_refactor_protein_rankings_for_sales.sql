alter table public.product_metrics
  add column if not exists canonical_brand text,
  add column if not exists rakuten_rank integer;

delete from public.rankings;

alter table public.rankings drop constraint if exists rankings_ranking_key_check;
alter table public.rankings
  add constraint rankings_ranking_key_check
  check (ranking_key in ('male', 'female'));
