create extension if not exists pgcrypto;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question text not null
    check (char_length(btrim(question)) between 1 and 1000),
  answer text,
  status text not null default 'pending'
    check (status in ('pending', 'published', 'rejected', 'archived')),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint published_question_requires_answer
    check (
      status <> 'published'
      or (
        answer is not null
        and char_length(btrim(answer)) between 1 and 10000
        and answered_at is not null
        and published_at is not null
      )
    )
);

create index if not exists questions_public_feed_idx
  on public.questions (published_at desc)
  where status = 'published';

create table if not exists public.question_rate_limit_buckets (
  scope text not null,
  identifier_hash text not null
    check (char_length(identifier_hash) between 1 and 128),
  bucket_start timestamptz not null,
  request_count integer not null default 1
    check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (scope, identifier_hash, bucket_start)
);

create index if not exists question_rate_limit_buckets_cleanup_idx
  on public.question_rate_limit_buckets (bucket_start);

alter table public.questions enable row level security;
alter table public.question_rate_limit_buckets enable row level security;

revoke all on table public.questions from anon, authenticated;
revoke all on table public.question_rate_limit_buckets from anon, authenticated;

grant select, insert, update, delete on table public.questions to service_role;
grant select, insert, update, delete on table public.question_rate_limit_buckets to service_role;

create or replace function public.set_question_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();

  if new.status = 'published' and old.status <> 'published' then
    new.answered_at := coalesce(new.answered_at, now());
    new.published_at := coalesce(new.published_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists set_question_timestamps_trigger on public.questions;
create trigger set_question_timestamps_trigger
  before update on public.questions
  for each row
  execute function public.set_question_timestamps();

revoke all on function public.set_question_timestamps() from public, anon, authenticated;

create or replace function public.consume_question_rate_limit(
  p_identifier_hash text,
  p_stage text
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_minute_start timestamptz := date_trunc('minute', v_now);
  v_hour_start timestamptz := date_trunc('hour', v_now);
  v_day_start timestamptz := date_trunc('day', v_now);
  v_global_count integer;
  v_ip_minute_count integer;
  v_ip_hour_count integer;
  v_ip_day_count integer;
begin
  if p_identifier_hash is null
    or char_length(p_identifier_hash) < 16
    or char_length(p_identifier_hash) > 128 then
    return query select false, 60, 'invalid_identifier';
    return;
  end if;

  if p_stage not in ('attempt', 'submission') then
    return query select false, 60, 'invalid_stage';
    return;
  end if;

  delete from public.question_rate_limit_buckets
  where bucket_start < v_now - interval '2 days';

  insert into public.question_rate_limit_buckets (
    scope,
    identifier_hash,
    bucket_start,
    request_count,
    updated_at
  )
  values (
    p_stage || '_global_minute',
    'global',
    v_minute_start,
    1,
    v_now
  )
  on conflict (scope, identifier_hash, bucket_start)
  do update set
    request_count = public.question_rate_limit_buckets.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_global_count;

  insert into public.question_rate_limit_buckets (
    scope,
    identifier_hash,
    bucket_start,
    request_count,
    updated_at
  )
  values (
    p_stage || '_ip_minute',
    p_identifier_hash,
    v_minute_start,
    1,
    v_now
  )
  on conflict (scope, identifier_hash, bucket_start)
  do update set
    request_count = public.question_rate_limit_buckets.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_ip_minute_count;

  if p_stage = 'attempt' then
    if v_global_count > 240 then
      return query
      select
        false,
        greatest(1, ceil(extract(epoch from (v_minute_start + interval '1 minute' - v_now)))::integer),
        'global_attempt_limit';
      return;
    end if;

    if v_ip_minute_count > 12 then
      return query
      select
        false,
        greatest(1, ceil(extract(epoch from (v_minute_start + interval '1 minute' - v_now)))::integer),
        'ip_attempt_limit';
      return;
    end if;

    return query select true, 0, 'ok';
    return;
  end if;

  insert into public.question_rate_limit_buckets (
    scope,
    identifier_hash,
    bucket_start,
    request_count,
    updated_at
  )
  values (
    'submission_ip_hour',
    p_identifier_hash,
    v_hour_start,
    1,
    v_now
  )
  on conflict (scope, identifier_hash, bucket_start)
  do update set
    request_count = public.question_rate_limit_buckets.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_ip_hour_count;

  insert into public.question_rate_limit_buckets (
    scope,
    identifier_hash,
    bucket_start,
    request_count,
    updated_at
  )
  values (
    'submission_ip_day',
    p_identifier_hash,
    v_day_start,
    1,
    v_now
  )
  on conflict (scope, identifier_hash, bucket_start)
  do update set
    request_count = public.question_rate_limit_buckets.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_ip_day_count;

  if v_global_count > 30 then
    return query
    select
      false,
      greatest(1, ceil(extract(epoch from (v_minute_start + interval '1 minute' - v_now)))::integer),
      'global_submission_limit';
    return;
  end if;

  if v_ip_minute_count > 1 then
    return query
    select
      false,
      greatest(1, ceil(extract(epoch from (v_minute_start + interval '1 minute' - v_now)))::integer),
      'ip_minute_limit';
    return;
  end if;

  if v_ip_hour_count > 5 then
    return query
    select
      false,
      greatest(1, ceil(extract(epoch from (v_hour_start + interval '1 hour' - v_now)))::integer),
      'ip_hour_limit';
    return;
  end if;

  if v_ip_day_count > 15 then
    return query
    select
      false,
      greatest(1, ceil(extract(epoch from (v_day_start + interval '1 day' - v_now)))::integer),
      'ip_day_limit';
    return;
  end if;

  return query select true, 0, 'ok';
end;
$$;

revoke all on function public.consume_question_rate_limit(text, text) from public, anon, authenticated;
grant execute on function public.consume_question_rate_limit(text, text) to service_role;
