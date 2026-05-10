-- BrawlLens stats aggregation: atomic increment functions + missing constraints.
-- Run this in the Supabase SQL editor.
--
-- Three jobs:
--   1. Dedupe any duplicate (map, mode, brawler_id) and (map, mode) rows that
--      may exist, since the ON CONFLICT upsert pattern requires uniqueness and
--      logs show the constraint is currently missing on map_brawler_stats.
--   2. Create UNIQUE INDEXes (idempotent — IF NOT EXISTS) so future ON CONFLICT
--      writes can resolve the target.
--   3. Create the merge RPC functions used by scripts/stats-aggregation.ts.
--      Atomic increment, race-safe, no read step required.

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

-- ---------- 4. RPC functions ----------
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

revoke all on function public.merge_map_stats(jsonb) from public, anon, authenticated;
revoke all on function public.merge_brawler_stats(jsonb) from public, anon, authenticated;
grant execute on function public.merge_map_stats(jsonb) to service_role;
grant execute on function public.merge_brawler_stats(jsonb) to service_role;
