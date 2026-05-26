drop table if exists public.expert_signals;

delete from public.rankings
where ranking_key <> 'male';

alter table public.rankings drop constraint if exists rankings_ranking_key_check;
alter table public.rankings
  add constraint rankings_ranking_key_check
  check (ranking_key = 'male');
