import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Pool } from "pg";

const RPC_CHUNK_SIZE = 500;

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

async function rpcMerge<T extends object>(
  supabase: SupabaseClient,
  fn: "merge_map_stats" | "merge_brawler_stats",
  rows: T[],
) {
  if (rows.length === 0) return 0;
  for (const group of chunk(rows, RPC_CHUNK_SIZE)) {
    const { error } = await supabase.rpc(fn, { rows: group });
    if (error) throw new Error(`${fn} rpc failed: ${error.message}`);
  }
  return rows.length;
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
  const brawlerRows: BrawlerStatRow[] = brawlerRes.rows.map(row => ({
    map: row.map,
    mode: row.mode,
    brawler_id: Number(row.brawler_id),
    brawler_name: row.brawler_name,
    picks: Number(row.picks),
    wins: Number(row.wins),
  }));

  const pushedMapRows = await rpcMerge(supabase, "merge_map_stats", mapRows);
  const pushedBrawlerRows = await rpcMerge(supabase, "merge_brawler_stats", brawlerRows);

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
