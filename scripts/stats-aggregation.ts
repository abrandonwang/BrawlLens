import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pool } from "pg";

const PAGE_SIZE = 1000;

interface MapStatRow {
  map: string;
  mode: string;
  battle_count: number;
}

interface BrawlerStatRow {
  map: string;
  mode: string;
  brawler_id: number;
  brawler_name: string;
  picks: number;
  wins: number;
  win_rate: number;
}

interface AggregateResult {
  aggregated: boolean;
  battleCount: number;
  playerCount: number;
  mapRows: number;
  brawlerRows: number;
  skippedDuplicate: boolean;
}

function chunk<T>(rows: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

function mapKey(row: Pick<MapStatRow, "map" | "mode">) {
  return `${row.map}\u0000${row.mode}`;
}

function brawlerKey(row: Pick<BrawlerStatRow, "map" | "mode" | "brawler_id">) {
  return `${row.map}\u0000${row.mode}\u0000${row.brawler_id}`;
}

async function fetchAllRows<T>(supabase: SupabaseClient, table: string, select: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`${table} select failed: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function upsertChunks<T extends object>(
  supabase: SupabaseClient,
  table: string,
  rows: T[],
  onConflict: string,
) {
  for (const group of chunk(rows, 500)) {
    const { error } = await supabase.from(table).upsert(group, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  }
}

async function mergeMapStats(supabase: SupabaseClient, increments: MapStatRow[]) {
  if (increments.length === 0) return 0;

  const existing = await fetchAllRows<MapStatRow>(
    supabase,
    "map_stats",
    "map, mode, battle_count",
  );
  const merged = new Map<string, MapStatRow>();

  for (const row of existing) {
    merged.set(mapKey(row), {
      map: row.map,
      mode: row.mode,
      battle_count: Number(row.battle_count) || 0,
    });
  }

  for (const row of increments) {
    const key = mapKey(row);
    const current = merged.get(key);
    if (current) current.battle_count += row.battle_count;
    else merged.set(key, { ...row });
  }

  const rows = Array.from(merged.values());
  await upsertChunks(supabase, "map_stats", rows, "map,mode");
  return increments.length;
}

async function mergeBrawlerStats(supabase: SupabaseClient, increments: BrawlerStatRow[]) {
  if (increments.length === 0) return 0;

  const existing = await fetchAllRows<BrawlerStatRow>(
    supabase,
    "map_brawler_stats",
    "map, mode, brawler_id, brawler_name, picks, wins, win_rate",
  );
  const merged = new Map<string, BrawlerStatRow>();

  for (const row of existing) {
    merged.set(brawlerKey(row), {
      map: row.map,
      mode: row.mode,
      brawler_id: Number(row.brawler_id),
      brawler_name: row.brawler_name,
      picks: Number(row.picks) || 0,
      wins: Number(row.wins) || 0,
      win_rate: Number(row.win_rate) || 0,
    });
  }

  for (const row of increments) {
    const key = brawlerKey(row);
    const current = merged.get(key);
    if (current) {
      current.brawler_name = row.brawler_name;
      current.picks += row.picks;
      current.wins += row.wins;
      current.win_rate = current.picks > 0 ? Number(((current.wins / current.picks) * 100).toFixed(2)) : 0;
    } else {
      merged.set(key, {
        ...row,
        win_rate: row.picks > 0 ? Number(((row.wins / row.picks) * 100).toFixed(2)) : 0,
      });
    }
  }

  const rows = Array.from(merged.values());
  await upsertChunks(supabase, "map_brawler_stats", rows, "map,mode,brawler_id");
  return increments.length;
}

async function ensureFlushLedger(localPg: Pool) {
  await localPg.query(`
    CREATE TABLE IF NOT EXISTS aggregation_flushes (
      batch_id TEXT PRIMARY KEY,
      battle_count INTEGER NOT NULL,
      player_count INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getRawBatch(localPg: Pool) {
  const { rows: battles } = await localPg.query<{ id: string }>("SELECT id FROM battles ORDER BY id");
  const { rows: playerCountRows } = await localPg.query<{ count: string }>("SELECT COUNT(*) FROM battle_players");
  const ids = battles.map(row => row.id);
  const hash = createHash("sha256");
  for (const id of ids) hash.update(id).update("\n");
  return {
    batchId: hash.digest("hex"),
    battleCount: ids.length,
    playerCount: Number(playerCountRows[0]?.count ?? 0),
  };
}

export async function aggregateAndFlushStats(
  localPg: Pool,
  supabase: SupabaseClient,
): Promise<AggregateResult> {
  await ensureFlushLedger(localPg);
  const batch = await getRawBatch(localPg);

  if (batch.battleCount === 0 || batch.playerCount === 0) {
    return {
      aggregated: false,
      battleCount: batch.battleCount,
      playerCount: batch.playerCount,
      mapRows: 0,
      brawlerRows: 0,
      skippedDuplicate: false,
    };
  }

  const { rows: existingFlush } = await localPg.query(
    "SELECT batch_id FROM aggregation_flushes WHERE batch_id = $1",
    [batch.batchId],
  );
  if (existingFlush.length > 0) {
    await localPg.query("TRUNCATE battles, battle_players");
    return {
      aggregated: false,
      battleCount: batch.battleCount,
      playerCount: batch.playerCount,
      mapRows: 0,
      brawlerRows: 0,
      skippedDuplicate: true,
    };
  }

  const mapRes = await localPg.query(`
    SELECT map, mode, COUNT(DISTINCT id) AS battle_count
    FROM battles
    GROUP BY map, mode
  `);
  const mapRows: MapStatRow[] = mapRes.rows.map(row => ({
    map: row.map,
    mode: row.mode,
    battle_count: Number(row.battle_count),
  }));

  const brawlerRes = await localPg.query(`
    SELECT
      b.map, b.mode,
      bp.brawler_id, bp.brawler_name,
      COUNT(*) AS picks,
      SUM(CASE WHEN bp.won THEN 1 ELSE 0 END) AS wins
    FROM battles b
    JOIN battle_players bp ON bp.battle_id = b.id
    WHERE b.mode NOT IN ('soloShowdown', 'duoShowdown')
    GROUP BY b.map, b.mode, bp.brawler_id, bp.brawler_name
    ORDER BY picks DESC
  `);
  const brawlerRows: BrawlerStatRow[] = brawlerRes.rows.map(row => {
    const picks = Number(row.picks);
    const wins = Number(row.wins);
    return {
      map: row.map,
      mode: row.mode,
      brawler_id: Number(row.brawler_id),
      brawler_name: row.brawler_name,
      picks,
      wins,
      win_rate: picks > 0 ? Number(((wins / picks) * 100).toFixed(2)) : 0,
    };
  });

  const pushedMapRows = await mergeMapStats(supabase, mapRows);
  const pushedBrawlerRows = await mergeBrawlerStats(supabase, brawlerRows);

  await localPg.query(
    "INSERT INTO aggregation_flushes (batch_id, battle_count, player_count) VALUES ($1, $2, $3)",
    [batch.batchId, batch.battleCount, batch.playerCount],
  );
  await localPg.query("TRUNCATE battles, battle_players");

  return {
    aggregated: true,
    battleCount: batch.battleCount,
    playerCount: batch.playerCount,
    mapRows: pushedMapRows,
    brawlerRows: pushedBrawlerRows,
    skippedDuplicate: false,
  };
}
