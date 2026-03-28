import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

config({ path: ".env.local" });

const BRAWL_API_KEY = process.env.BRAWL_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BASE_URL = "https://api.brawlstars.com/v1";

// ─── Tuning ─────────────────────────────────────────────────────
const CONCURRENCY = 8; // Parallel API requests
const DB_BATCH_SIZE = 50; // Write to DB every N tags
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

  const starTag = battle.starPlayer?.tag || null;
  const playerRows: any[] = [];

  for (let t = 0; t < 2; t++) {
    const won = isDraw ? false : t === fetchedTeam ? fetchedWon : !fetchedWon;
    for (const p of battle.teams[t]) {
      playerRows.push({
        battle_id: battleId,
        player_tag: p.tag,
        brawler_id: p.brawler.id,
        brawler_name: p.brawler.name,
        brawler_power: p.brawler.power,
        brawler_trophies: p.brawler.trophies,
        team_num: t,
        won,
        is_star_player: p.tag === starTag,
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

// ─── Batch DB Write ─────────────────────────────────────────────
async function flushToDB(battles: any[], players: any[], processedTags: string[]) {
  // Deduplicate battles by id
  const uniqueBattles = new Map<string, any>();
  for (const b of battles) uniqueBattles.set(b.id, b);
  const dedupedBattles = Array.from(uniqueBattles.values());

  // Deduplicate players by battle_id + player_tag
  const uniquePlayers = new Map<string, any>();
  for (const p of players) {
    uniquePlayers.set(`${p.battle_id}:${p.player_tag}`, p);
  }
  const dedupedPlayers = Array.from(uniquePlayers.values());

  // Write battles in chunks of 500
  for (let i = 0; i < dedupedBattles.length; i += 500) {
    const chunk = dedupedBattles.slice(i, i + 500);
    const { error } = await supabase
      .from("battles")
      .upsert(chunk, { onConflict: "id", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate")) {
      console.error(`  DB error (battles): ${error.message}`);
    }
  }

  // Write players in chunks of 500
  for (let i = 0; i < dedupedPlayers.length; i += 500) {
    const chunk = dedupedPlayers.slice(i, i + 500);
    const { error } = await supabase
      .from("battle_players")
      .upsert(chunk, { onConflict: "battle_id,player_tag", ignoreDuplicates: true });
    if (error && !error.message.includes("duplicate") && !error.message.includes("unique")) {
      console.error(`  DB error (players): ${error.message}`);
    }
  }

  // Mark tags as processed
  for (let i = 0; i < processedTags.length; i += 500) {
    const chunk = processedTags.slice(i, i + 500);
    await supabase
      .from("harvested_tags")
      .update({ processed_at: new Date().toISOString() })
      .in("player_tag", chunk);
  }

  totalBattlesSaved += dedupedBattles.length;
  totalPlayersSaved += dedupedPlayers.length;
}

// ─── Get Unprocessed Tags ───────────────────────────────────────
async function getUnprocessedTags(limit: number): Promise<string[]> {
  const { data, error } = await supabase
    .from("harvested_tags")
    .select("player_tag")
    .is("processed_at", null)
    .limit(limit);

  if (error) {
    console.error(`Error fetching tags: ${error.message}`);
    return [];
  }
  return (data || []).map((r: any) => r.player_tag);
}

// ─── Print Stats ────────────────────────────────────────────────
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

// ─── Leaderboards ───────────────────────────────────────────────
const LEADERBOARD_REGIONS = ["global", "US", "KR", "BR", "DE", "JP"];

async function fetchAndSaveLeaderboards() {
  console.log("  Updating leaderboards...");
  for (const region of LEADERBOARD_REGIONS) {
    const data = await apiFetch(`/rankings/${region}/players`);
    if (!data?.items?.length) {
      console.log(`    [${region}] no data`);
      continue;
    }
    const rows = data.items.map((p: any, i: number) => ({
      region,
      rank: i + 1,
      player_tag: p.tag,
      player_name: p.name,
      trophies: p.trophies,
      club_name: p.club?.name ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("leaderboards")
      .upsert(rows, { onConflict: "region,rank" });
    if (error) console.error(`    [${region}] DB error: ${error.message}`);
    else console.log(`    [${region}] saved ${rows.length} players`);
  }
}

// ─── Reset all tags for next cycle ──────────────────────────────
async function resetAllTags() {
  console.log("\n  Resetting all tags for next cycle...");
  const { error } = await supabase
    .from("harvested_tags")
    .update({ processed_at: null })
    .not("player_tag", "is", null);
  if (error) console.error(`  Reset error: ${error.message}`);
  else console.log("  Tags reset. Starting new cycle.\n");
}

// ─── Run one full pass ───────────────────────────────────────────
async function runCycle(cycle: number) {
  const { count: totalCount } = await supabase
    .from("harvested_tags")
    .select("*", { count: "exact", head: true });

  const total = totalCount || 0;
  let processed = 0;

  console.log(`\n=== Cycle ${cycle} | ${total} tags | ${new Date().toISOString()} ===\n`);

  startTime = Date.now();
  totalBattlesSaved = 0;
  totalPlayersSaved = 0;
  totalRequests = 0;
  total429s = 0;
  totalSkipped = 0;

  while (true) {
    const tags = await getUnprocessedTags(1000);
    if (tags.length === 0) break;

    let accBattles: any[] = [];
    let accPlayers: any[] = [];
    let accTags: string[] = [];

    for (let i = 0; i < tags.length; i += CONCURRENCY) {
      const group = tags.slice(i, i + CONCURRENCY);
      const results = await Promise.all(group.map((tag) => processTag(tag)));

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
async function main() {
  console.log("=== BrawlLens Battle Collector — Continuous Mode ===");
  console.log(`Concurrency: ${CONCURRENCY} | Flush every: ${DB_BATCH_SIZE} tags\n`);

  let cycle = 1;
  while (true) {
    await fetchAndSaveLeaderboards();
    await runCycle(cycle);
    await resetAllTags();
    cycle++;
  }
}

main().catch(console.error);