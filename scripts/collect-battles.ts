import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { Pool } from "pg";

config({ path: ".env.local" });

const BRAWL_API_KEY = process.env.BRAWL_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Local Postgres — raw battle data (unlimited storage)
const localPg = new Pool({
  connectionString: process.env.LOCAL_PG_URL || "postgresql://brawlens:brawlens2026@localhost:5432/brawlens",
});

// Supabase — summary tables only (leaderboards, map stats, rotation)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BASE_URL = "https://api.brawlstars.com/v1";

// ─── Tuning ─────────────────────────────────────────────────────
const CONCURRENCY = 4;
const DB_BATCH_SIZE = 200;
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 2000;

// ─── Stats ──────────────────────────────────────────────────────
let totalRequests = 0;
let total429s = 0;
let totalBattlesSaved = 0;
let totalPlayersSaved = 0;
let totalSkipped = 0;
let startTime = Date.now();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Rate Limiter (token bucket) ────────────────────────────────
class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / 1000;
    this.lastRefill = Date.now();
  }

  async acquire() {
    while (true) {
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
      this.lastRefill = now;

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      const waitMs = Math.ceil((1 - this.tokens) / this.refillRate);
      await sleep(waitMs);
    }
  }
}

const rateLimiter = new RateLimiter(10);

// ─── API Fetch with Retry ───────────────────────────────────────
async function apiFetch(endpoint: string): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await rateLimiter.acquire();
    totalRequests++;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BRAWL_API_KEY}` },
    });

    if (res.ok) return res.json();

    if (res.status === 429) {
      total429s++;
      const waitMs = BACKOFF_BASE_MS * Math.pow(2, attempt);
      console.log(`    429 hit. Backing off ${waitMs}ms...`);
      await sleep(waitMs);
      continue;
    }

    if (res.status === 404) return null;

    console.log(`    API error ${res.status} for ${endpoint}`);

    if (res.status === 503) {
      await sleep(BACKOFF_BASE_MS * Math.pow(2, attempt));
      continue;
    }

    return null;
  }
  return null;
}

// ─── Battle Parsing ─────────────────────────────────────────────
function generateBattleId(battleTime: string, players: string[]): string {
  const sorted = [...players].sort().join(",");
  return createHash("sha256").update(`${battleTime}:${sorted}`).digest("hex").slice(0, 32);
}

function parseBattle(entry: any, fetchedTag: string): { battle: any; players: any[] } | null {
  const { battleTime, event, battle } = entry;
  if (!battle?.teams || battle.teams.length !== 2) return null;
  if (!battle.result) return null;

  const allTags: string[] = [];
  for (const team of battle.teams) {
    for (const p of team) allTags.push(p.tag);
  }

  const battleId = generateBattleId(battleTime, allTags);

  let fetchedTeam = -1;
  for (let t = 0; t < 2; t++) {
    if (battle.teams[t].some((p: any) => p.tag === fetchedTag)) {
      fetchedTeam = t;
      break;
    }
  }
  if (fetchedTeam === -1) return null;

  const fetchedWon = battle.result === "victory";
  const isDraw = battle.result === "draw";

  const bt = battleTime.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z$/,
    "$1-$2-$3T$4:$5:$6.$7Z"
  );

  const battleRow = {
    id: battleId,
    battle_time: bt,
    event_id: event?.id || null,
    mode: battle.mode || event?.mode || "unknown",
    map: event?.map || "unknown",
    match_type: battle.type || null,
    duration: battle.duration || null,
  };

  const playerRows: any[] = [];

  for (let t = 0; t < 2; t++) {
    const won = isDraw ? false : t === fetchedTeam ? fetchedWon : !fetchedWon;
    for (const p of battle.teams[t]) {
      playerRows.push({
        battle_id: battleId,
        player_tag: p.tag,
        brawler_id: p.brawler.id,
        brawler_name: p.brawler.name,
        team_num: t,
        won,
      });
    }
  }

  return { battle: battleRow, players: playerRows };
}

// ─── Fetch + Parse One Tag ──────────────────────────────────────
async function processTag(tag: string): Promise<{ battles: any[]; players: any[] }> {
  const encoded = encodeURIComponent(tag);
  const data = await apiFetch(`/players/${encoded}/battlelog`);

  if (!data?.items) {
    totalSkipped++;
    return { battles: [], players: [] };
  }

  const battles: any[] = [];
  const players: any[] = [];

  for (const entry of data.items) {
    const parsed = parseBattle(entry, tag);
    if (!parsed) continue;
    battles.push(parsed.battle);
    players.push(...parsed.players);
  }

  return { battles, players };
}

// ─── Batch DB Write (local Postgres) ────────────────────────────
async function flushToDB(battles: any[], players: any[], processedTags: string[]) {
  const uniqueBattles = new Map<string, any>();
  for (const b of battles) uniqueBattles.set(b.id, b);
  const dedupedBattles = Array.from(uniqueBattles.values());

  const uniquePlayers = new Map<string, any>();
  for (const p of players) uniquePlayers.set(`${p.battle_id}:${p.player_tag}`, p);
  const dedupedPlayers = Array.from(uniquePlayers.values());

  // Insert battles in chunks
  for (let i = 0; i < dedupedBattles.length; i += 500) {
    const chunk = dedupedBattles.slice(i, i + 500);
    const values = chunk.map((_, j) =>
      `($${j * 7 + 1}, $${j * 7 + 2}, $${j * 7 + 3}, $${j * 7 + 4}, $${j * 7 + 5}, $${j * 7 + 6}, $${j * 7 + 7})`
    ).join(",");
    const params = chunk.flatMap(b => [b.id, b.battle_time, b.event_id, b.mode, b.map, b.match_type, b.duration]);
    await localPg.query(
      `INSERT INTO battles (id, battle_time, event_id, mode, map, match_type, duration) VALUES ${values} ON CONFLICT DO NOTHING`,
      params
    ).catch(e => console.error(`  DB error (battles): ${e.message}`));
  }

  // Insert battle_players in chunks
  for (let i = 0; i < dedupedPlayers.length; i += 500) {
    const chunk = dedupedPlayers.slice(i, i + 500);
    const values = chunk.map((_, j) =>
      `($${j * 6 + 1}, $${j * 6 + 2}, $${j * 6 + 3}, $${j * 6 + 4}, $${j * 6 + 5}, $${j * 6 + 6})`
    ).join(",");
    const params = chunk.flatMap(p => [p.battle_id, p.player_tag, p.brawler_id, p.brawler_name, p.team_num, p.won]);
    await localPg.query(
      `INSERT INTO battle_players (battle_id, player_tag, brawler_id, brawler_name, team_num, won) VALUES ${values} ON CONFLICT DO NOTHING`,
      params
    ).catch(e => console.error(`  DB error (battle_players): ${e.message}`));
  }

  // Mark tags as processed
  if (processedTags.length > 0) {
    await localPg.query(
      `UPDATE harvested_tags SET processed_at = $1 WHERE player_tag = ANY($2)`,
      [new Date().toISOString(), processedTags]
    ).catch(e => console.error(`  DB error (harvested_tags): ${e.message}`));
  }

  totalBattlesSaved += dedupedBattles.length;
  totalPlayersSaved += dedupedPlayers.length;
}

async function getUnprocessedTags(limit: number): Promise<string[]> {
  const { rows } = await localPg.query(
    `SELECT player_tag FROM harvested_tags WHERE processed_at IS NULL LIMIT $1`,
    [limit]
  );
  return rows.map((r: any) => r.player_tag);
}

function printStats(processed: number, total: number) {
  const elapsed = (Date.now() - startTime) / 1000;
  const tagsPerSec = processed / elapsed;
  const remaining = total - processed;
  const etaSec = tagsPerSec > 0 ? remaining / tagsPerSec : 0;
  const etaH = Math.floor(etaSec / 3600);
  const etaM = Math.floor((etaSec % 3600) / 60);

  console.log(
    `  [${processed}/${total}] ` +
      `${totalBattlesSaved} battles | ${totalPlayersSaved} player rows | ` +
      `${total429s} 429s | ${tagsPerSec.toFixed(1)} tags/s | ${(totalRequests / elapsed).toFixed(1)} req/s | ` +
      `ETA: ${etaH}h ${etaM}m`
  );
}

async function fetchAndSaveRotation() {
  const raw = await apiFetch("/events/rotation");
  const data = raw?.items ?? raw;
  if (!data?.length) {
    console.log("  [rotation] no data");
    return;
  }
  const { error } = await supabase
    .from("rotation")
    .upsert({ id: 1, data, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) console.error(`  [rotation] DB error: ${error.message}`);
  else console.log(`  [rotation] saved ${data.length} events`);
}

const LEADERBOARD_REGIONS = ["global", "US", "KR", "BR", "DE", "JP"];

async function fetchAndSaveLeaderboards() {
  console.log("  Updating player leaderboards...");
  for (const region of LEADERBOARD_REGIONS) {
    const data = await apiFetch(`/rankings/${region}/players`);
    if (!data?.items?.length) { console.log(`    [${region}] no data`); continue; }
    const rows = data.items.map((p: any, i: number) => ({
      region, rank: i + 1, player_tag: p.tag, player_name: p.name,
      trophies: p.trophies, club_name: p.club?.name ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("leaderboards").upsert(rows, { onConflict: "region,rank" });
    if (error) console.error(`    [${region}] DB error: ${error.message}`);
    else console.log(`    [${region}] saved ${rows.length} players`);
  }
}

async function fetchAndSaveClubLeaderboards() {
  console.log("  Updating club leaderboards...");
  for (const region of LEADERBOARD_REGIONS) {
    const data = await apiFetch(`/rankings/${region}/clubs`);
    if (!data?.items?.length) { console.log(`    [clubs/${region}] no data`); continue; }
    const rows = data.items.map((c: any, i: number) => ({
      region, rank: i + 1, club_tag: c.tag, club_name: c.name,
      trophies: c.trophies, member_count: c.memberCount ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("club_leaderboards").upsert(rows, { onConflict: "region,rank" });
    if (error) console.error(`    [clubs/${region}] DB error: ${error.message}`);
    else console.log(`    [clubs/${region}] saved ${rows.length} clubs`);
  }
}

async function fetchAndSaveBrawlerLeaderboards() {
  console.log("  Updating brawler leaderboards (global)...");
  const brawlerData = await apiFetch("/brawlers");
  if (!brawlerData?.items?.length) { console.log("    [brawlers] could not fetch brawler list"); return; }
  for (const brawler of brawlerData.items) {
    const data = await apiFetch(`/rankings/global/brawlers/${brawler.id}`);
    if (!data?.items?.length) continue;
    const rows = data.items.map((p: any, i: number) => ({
      brawler_id: brawler.id, brawler_name: brawler.name, rank: i + 1,
      player_tag: p.tag, player_name: p.name, trophies: p.trophies,
      club_name: p.club?.name ?? null, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("brawler_leaderboards").upsert(rows, { onConflict: "brawler_id,rank" });
    if (error) console.error(`    [brawler/${brawler.name}] DB error: ${error.message}`);
  }
  console.log(`    [brawlers] done (${brawlerData.items.length} brawlers)`);
}

// ─── Aggregate local Postgres → push to Supabase ────────────────
async function aggregateStats() {
  console.log("\n  Aggregating map stats from local DB...");

  // Map-level stats
  const mapRes = await localPg.query(`
    SELECT map, mode, COUNT(DISTINCT id) AS battle_count
    FROM battles
    GROUP BY map, mode
  `);

  if (mapRes.rows.length > 0) {
    const mapRows = mapRes.rows.map(r => ({ map: r.map, mode: r.mode, battle_count: Number(r.battle_count) }));
    for (let i = 0; i < mapRows.length; i += 500) {
      const { error } = await supabase.from("map_stats").upsert(mapRows.slice(i, i + 500), { onConflict: "map,mode" });
      if (error) console.error(`  map_stats upsert error: ${error.message}`);
    }
    console.log(`  Pushed ${mapRows.length} map stat rows to Supabase.`);
  }

  // Brawler win rates per map
  const brawlerRes = await localPg.query(`
    SELECT
      b.map, b.mode,
      bp.brawler_id, bp.brawler_name,
      COUNT(*) AS picks,
      SUM(CASE WHEN bp.won THEN 1 ELSE 0 END) AS wins,
      ROUND(100.0 * SUM(CASE WHEN bp.won THEN 1 ELSE 0 END) / COUNT(*), 2) AS win_rate
    FROM battles b
    JOIN battle_players bp ON bp.battle_id = b.id
    WHERE b.mode NOT IN ('soloShowdown', 'duoShowdown')
    GROUP BY b.map, b.mode, bp.brawler_id, bp.brawler_name
    HAVING COUNT(*) >= 20
    ORDER BY picks DESC
  `);

  if (brawlerRes.rows.length > 0) {
    const brawlerRows = brawlerRes.rows.map(r => ({
      map: r.map, mode: r.mode,
      brawler_id: Number(r.brawler_id), brawler_name: r.brawler_name,
      picks: Number(r.picks), wins: Number(r.wins), win_rate: Number(r.win_rate),
    }));
    for (let i = 0; i < brawlerRows.length; i += 500) {
      const { error } = await supabase.from("map_brawler_stats").upsert(brawlerRows.slice(i, i + 500), { onConflict: "map,brawler_id" });
      if (error) console.error(`  map_brawler_stats upsert error: ${error.message}`);
    }
    console.log(`  Pushed ${brawlerRows.length} brawler stat rows to Supabase.`);
  }

  // Truncate local raw tables — no dead-tuple bloat since TRUNCATE is instant
  await localPg.query("TRUNCATE battles, battle_players");
  console.log("  Local raw tables truncated.");
}

// ─── Reset all tags for next cycle ──────────────────────────────
async function resetAllTags() {
  console.log("\n  Resetting all tags for next cycle...");
  await localPg.query("UPDATE harvested_tags SET processed_at = NULL");
  console.log("  Tags reset. Starting new cycle.\n");
}

// ─── Run one full pass ───────────────────────────────────────────
async function runCycle(cycle: number) {
  // Safety valve: if local battle_players is huge, aggregate first
  const { rows: countRows } = await localPg.query("SELECT COUNT(*) FROM battle_players");
  const bpCount = Number(countRows[0].count);
  if (bpCount > 1_000_000) {
    console.log(`  [safety] battle_players has ${bpCount} rows — running aggregateStats() before collecting.`);
    await aggregateStats();
  }

  const { rows: totalRows } = await localPg.query("SELECT COUNT(*) FROM harvested_tags");
  const total = Number(totalRows[0].count);
  let processed = 0;

  console.log(`\n=== Cycle ${cycle} | ${total} tags | ${new Date().toISOString()} ===\n`);

  startTime = Date.now();
  totalBattlesSaved = 0;
  totalPlayersSaved = 0;
  totalRequests = 0;
  total429s = 0;
  totalSkipped = 0;

  const MID_CYCLE_CLEANUP_INTERVAL = 10_000;
  let lastCleanup = 0;

  while (true) {
    const tags = await getUnprocessedTags(1000);
    if (tags.length === 0) break;

    let accBattles: any[] = [];
    let accPlayers: any[] = [];
    let accTags: string[] = [];

    for (let i = 0; i < tags.length; i += CONCURRENCY) {
      const group = tags.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        group.map((tag) =>
          processTag(tag).catch((err) => {
            console.error(`  Error processing tag ${tag}:`, err);
            return { battles: [], players: [] };
          })
        )
      );

      for (let k = 0; k < results.length; k++) {
        accBattles.push(...results[k].battles);
        accPlayers.push(...results[k].players);
        accTags.push(group[k]);
      }

      if (accTags.length >= DB_BATCH_SIZE) {
        await flushToDB(accBattles, accPlayers, accTags);
        processed += accTags.length;
        printStats(processed, total);
        accBattles = [];
        accPlayers = [];
        accTags = [];

        if (processed - lastCleanup >= MID_CYCLE_CLEANUP_INTERVAL) {
          console.log(`\n  Mid-cycle cleanup at ${processed} tags...`);
          try { await aggregateStats(); } catch (err) {
            console.error("  Mid-cycle cleanup failed (continuing):", err);
          }
          lastCleanup = processed;
        }
      }
    }

    if (accTags.length > 0) {
      await flushToDB(accBattles, accPlayers, accTags);
      processed += accTags.length;
      printStats(processed, total);
    }
  }

  const elapsed = (Date.now() - startTime) / 1000;
  console.log(`\n=== Cycle ${cycle} complete | ${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m ===`);
  console.log(`Battles: ${totalBattlesSaved} | Players: ${totalPlayersSaved} | 429s: ${total429s} | Skipped: ${totalSkipped}`);
}

// ─── Main (runs forever) ─────────────────────────────────────────
async function leaderboardLoop() {
  while (true) {
    await fetchAndSaveLeaderboards();
    await fetchAndSaveClubLeaderboards();
    await fetchAndSaveBrawlerLeaderboards();
    await fetchAndSaveRotation();
    await sleep(30 * 60 * 1000);
  }
}

async function main() {
  console.log("=== BrawlLens Battle Collector — Continuous Mode ===");
  console.log(`Concurrency: ${CONCURRENCY} | Flush every: ${DB_BATCH_SIZE} tags\n`);

  // Verify local PG connection
  await localPg.query("SELECT 1").catch(e => {
    console.error("FATAL: Cannot connect to local Postgres:", e.message);
    process.exit(1);
  });
  console.log("Local Postgres connected.\n");

  leaderboardLoop();

  let cycle = 1;
  while (true) {
    try {
      await runCycle(cycle);
    } catch (err) {
      console.error(`  [cycle ${cycle}] runCycle threw — proceeding to cleanup:`, err);
    }
    await aggregateStats();
    await resetAllTags();
    cycle++;
    console.log("  Sleeping 4h before next cycle...");
    await sleep(4 * 60 * 60 * 1000);
  }
}

main().catch(console.error);
