create extension if not exists pgcrypto;

create table if not exists public.macho_clicker_scores (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(nickname) between 1 and 12),
  score bigint not null check (score > 0),
  created_at timestamptz not null default now()
);

create index if not exists macho_clicker_scores_score_idx
  on public.macho_clicker_scores (score desc, created_at asc);

alter table public.macho_clicker_scores enable row level security;

drop policy if exists "public read macho clicker scores" on public.macho_clicker_scores;
create policy "public read macho clicker scores"
  on public.macho_clicker_scores
  for select
  to anon, authenticated
  using (true);
