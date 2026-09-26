create extension if not exists pgcrypto;

create table if not exists public.macho_clicker_tap_scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null unique,
  nickname text not null check (char_length(nickname) between 1 and 12),
  taps bigint not null check (taps > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists macho_clicker_tap_scores_rank_idx
  on public.macho_clicker_tap_scores (taps desc, updated_at asc);

alter table public.macho_clicker_tap_scores enable row level security;

drop policy if exists "public read macho clicker tap scores" on public.macho_clicker_tap_scores;
create policy "public read macho clicker tap scores"
  on public.macho_clicker_tap_scores
  for select
  to anon, authenticated
  using (true);
