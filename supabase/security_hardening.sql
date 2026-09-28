create table if not exists public."RateLimitBucket" (
  "key" text primary key,
  "windowStartedAt" timestamptz not null,
  attempts integer not null,
  "expiresAt" timestamptz not null
);

create index if not exists "RateLimitBucket_expiresAt_idx"
  on public."RateLimitBucket" ("expiresAt");

alter table public."RateLimitBucket" enable row level security;

drop policy if exists "No direct client access to rate limit buckets" on public."RateLimitBucket";
create policy "No direct client access to rate limit buckets"
  on public."RateLimitBucket"
  for all to anon, authenticated
  using (false)
  with check (false);

revoke all on table public."RateLimitBucket" from public, anon, authenticated;

create or replace function public.consume_rate_limit(payload jsonb)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_key text := payload->>'key';
  v_max_attempts integer := (payload->>'maxAttempts')::integer;
  v_window_seconds integer := (payload->>'windowSeconds')::integer;
  v_now timestamptz := clock_timestamp();
  v_window_started timestamptz;
  v_attempts integer;
  v_retry_after integer;
begin
  if v_key is null or v_key !~ '^[a-f0-9]{64}$'
    or v_max_attempts < 1 or v_max_attempts > 1000
    or v_window_seconds < 1 or v_window_seconds > 86400 then
    raise exception 'INVALID_RATE_LIMIT_REQUEST';
  end if;

  insert into public."RateLimitBucket" as bucket ("key", "windowStartedAt", attempts, "expiresAt")
  values (v_key, v_now, 1, v_now + make_interval(secs => v_window_seconds))
  on conflict ("key") do update set
    "windowStartedAt" = case
      when bucket."windowStartedAt" <= v_now - make_interval(secs => v_window_seconds) then v_now
      else bucket."windowStartedAt"
    end,
    attempts = case
      when bucket."windowStartedAt" <= v_now - make_interval(secs => v_window_seconds) then 1
      else bucket.attempts + 1
    end,
    "expiresAt" = case
      when bucket."windowStartedAt" <= v_now - make_interval(secs => v_window_seconds) then v_now + make_interval(secs => v_window_seconds)
      else bucket."expiresAt"
    end
  returning "windowStartedAt", attempts into v_window_started, v_attempts;

  delete from public."RateLimitBucket" where "expiresAt" < v_now;

  v_retry_after := greatest(1, ceil(extract(epoch from (v_window_started + make_interval(secs => v_window_seconds) - v_now)))::integer);
  return jsonb_build_object('allowed', v_attempts <= v_max_attempts, 'retryAfter', v_retry_after);
end;
$$;

revoke all on function public.consume_rate_limit(jsonb) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(jsonb) to service_role;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

revoke all on function public.update_order_status(jsonb) from public, anon, authenticated;
grant execute on function public.update_order_status(jsonb) to service_role;