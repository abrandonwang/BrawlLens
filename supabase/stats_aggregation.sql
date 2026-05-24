-- BrawlLens stats aggregation: atomic increment functions + missing constraints.
-- Run this in the Supabase SQL editor.
--
-- Five jobs:
--   1. Dedupe any duplicate (map, mode, brawler_id) and (map, mode) rows that
--      may exist, since the ON CONFLICT upsert pattern requires uniqueness and
--      logs show the constraint is currently missing on map_brawler_stats.
--   2. Create UNIQUE INDEXes (idempotent - IF NOT EXISTS) so future ON CONFLICT
--      writes can resolve the target.
--   3. Create the merge RPC functions used by scripts/stats-aggregation.ts.
--      Atomic increment, race-safe, no read step required.
--   4. Create daily brawler snapshots used by real day-over-day win-rate deltas.
--   5. Create read RPCs used by server routes.

-- ---------- 1. Dedupe map_brawler_stats ----------
-- Sum picks/wins by key, then replace the table contents with the deduped totals.
-- Keep ANY brawler_name (they should be identical for a given brawler_id).
create temp table _mbs_dedupe on commit drop as
select
  map,
  mode,
  brawler_id,
  max(brawler_name) as brawler_name,
  sum(picks)::integer as picks,
  sum(wins)::integer as wins
from public.map_brawler_stats
group by map, mode, brawler_id;

truncate public.map_brawler_stats;

insert into public.map_brawler_stats (map, mode, brawler_id, brawler_name, picks, wins, win_rate)
select
  map, mode, brawler_id, brawler_name, picks, wins,
  case when picks > 0
       then round((wins::numeric / picks::numeric) * 100, 2)
       else 0
  end
from _mbs_dedupe;

-- ---------- 2. Dedupe map_stats ----------
create temp table _ms_dedupe on commit drop as
select map, mode, sum(battle_count)::integer as battle_count
from public.map_stats
group by map, mode;

truncate public.map_stats;

insert into public.map_stats (map, mode, battle_count)
select map, mode, battle_count from _ms_dedupe;

-- ---------- 3. Add missing unique indexes ----------
create unique index if not exists map_brawler_stats_unique_key
  on public.map_brawler_stats (map, mode, brawler_id);

create unique index if not exists map_stats_unique_key
  on public.map_stats (map, mode);

-- ---------- 4. Daily brawler snapshots ----------
-- One row per brawler per day. This keeps trend storage tiny while preserving
-- enough history for day-over-day movement in the tierlist.
create table if not exists public.brawler_stats_daily (
  stat_date date not null,
  brawler_id integer not null,
  brawler_name text not null,
  picks integer not null,
  wins integer not null,
  win_rate numeric not null,
  map_count integer not null,
  created_at timestamptz not null default now(),
  primary key (stat_date, brawler_id)
);

alter table public.brawler_stats_daily enable row level security;

create index if not exists brawler_stats_daily_date_idx
  on public.brawler_stats_daily (stat_date desc);

create index if not exists brawler_stats_daily_brawler_idx
  on public.brawler_stats_daily (brawler_id, stat_date desc);

revoke all on public.brawler_stats_daily from public, anon, authenticated;
grant select, insert, update, delete on public.brawler_stats_daily to service_role;

-- ---------- 5. RPC functions ----------
create or replace function public.merge_map_stats(rows jsonb)
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  insert into public.map_stats (map, mode, battle_count)
  select
    (r->>'map')::text,
    (r->>'mode')::text,
    (r->>'battle_count')::integer
  from jsonb_array_elements(rows) as r
  on conflict (map, mode) do update
    set battle_count = public.map_stats.battle_count + excluded.battle_count;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.merge_brawler_stats(rows jsonb)
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  insert into public.map_brawler_stats (map, mode, brawler_id, brawler_name, picks, wins, win_rate)
  select
    (r->>'map')::text,
    (r->>'mode')::text,
    (r->>'brawler_id')::integer,
    (r->>'brawler_name')::text,
    (r->>'picks')::integer,
    (r->>'wins')::integer,
    case when (r->>'picks')::integer > 0
         then round(((r->>'wins')::numeric / (r->>'picks')::numeric) * 100, 2)
         else 0
    end
  from jsonb_array_elements(rows) as r
  on conflict (map, mode, brawler_id) do update
    set
      brawler_name = excluded.brawler_name,
      picks = public.map_brawler_stats.picks + excluded.picks,
      wins = public.map_brawler_stats.wins + excluded.wins,
      win_rate = case
        when (public.map_brawler_stats.picks + excluded.picks) > 0
        then round(
          ((public.map_brawler_stats.wins + excluded.wins)::numeric
           / (public.map_brawler_stats.picks + excluded.picks)::numeric) * 100,
          2
        )
        else 0
      end;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.snapshot_brawler_stats_daily(snapshot_date date default current_date)
returns integer
language plpgsql
as $$
declare
  affected integer;
begin
  delete from public.brawler_stats_daily
  where stat_date = snapshot_date;

  insert into public.brawler_stats_daily (
    stat_date, brawler_id, brawler_name, picks, wins, win_rate, map_count
  )
  select
    snapshot_date,
    brawler_id,
    max(brawler_name) as brawler_name,
    sum(picks)::integer as picks,
    sum(wins)::integer as wins,
    case
      when sum(picks) > 0
      then round((sum(wins)::numeric / sum(picks)::numeric) * 100, 2)
      else 0
    end as win_rate,
    count(*)::integer as map_count
  from public.map_brawler_stats
  group by brawler_id;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.get_brawler_winrate_deltas()
returns table (
  brawler_id integer,
  current_win_rate numeric,
  previous_win_rate numeric,
  win_rate_delta_day numeric
)
language sql
stable
as $$
  with dates as (
    select max(stat_date) as latest_date
    from public.brawler_stats_daily
  ),
  previous_date as (
    select max(stat_date) as previous_date
    from public.brawler_stats_daily, dates
    where stat_date < dates.latest_date
  ),
  current_stats as (
    select
      d.brawler_id,
      d.win_rate
    from public.brawler_stats_daily d
    join dates on d.stat_date = dates.latest_date
  ),
  previous_stats as (
    select
      d.brawler_id,
      d.win_rate
    from public.brawler_stats_daily d
    join previous_date on d.stat_date = previous_date.previous_date
  )
  select
    current_stats.brawler_id,
    current_stats.win_rate as current_win_rate,
    previous_stats.win_rate as previous_win_rate,
    current_stats.win_rate - previous_stats.win_rate as win_rate_delta_day
  from current_stats
  join previous_stats using (brawler_id)
  where previous_stats.win_rate is not null;
$$;

revoke all on function public.merge_map_stats(jsonb) from public, anon, authenticated;
revoke all on function public.merge_brawler_stats(jsonb) from public, anon, authenticated;
revoke all on function public.snapshot_brawler_stats_daily(date) from public, anon, authenticated;
revoke all on function public.get_brawler_winrate_deltas() from public, anon, authenticated;
grant execute on function public.merge_map_stats(jsonb) to service_role;
grant execute on function public.merge_brawler_stats(jsonb) to service_role;
grant execute on function public.snapshot_brawler_stats_daily(date) to service_role;
grant execute on function public.get_brawler_winrate_deltas() to service_role;
