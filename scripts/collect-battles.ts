import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

config({ path: ".env.local" });

const BRAWL_API_KEY = process.env.BRAWL_API_KEY!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BASE_URL = "https://api.brawlstars.com/v1";

// ─── Rate Limiting Config ───────────────────────────────────────
const TARGET_RPS = 10; // 10 requests per second
const MIN_DELAY_MS = 1000 / TARGET_RPS; // 100ms between requests
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 2000; // Base for exponential backoff on 429

// ─── Stats Tracking ─────────────────────────────────────────────
let totalRequests = 0;
let totalRetries = 0;
let total429s = 0;
let totalBattlesSaved = 0;
let totalPlayersSaved = 0;
let totalSkipped = 0;
let startTime = Date.now();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── API Fetch with Retry + Backoff ─────────────────────────────
async function apiFetch(endpoint: string): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    totalRequests++;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${BRAWL_API_KEY}` },
    });

    if (res.ok) {
      return res.json();
    }

    if (res.status === 429) {
      total429s++;
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter
        ? parseInt(retryAfter) * 1000
        : BACKOFF_BASE_MS * Math.pow(2, attempt);
      console.log(
        `    429 rate limited. Waiting ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
      );
      totalRetries++;
      await sleep(waitMs);
      continue;
    }

    if (res.status === 404) {
      // Player not found / account deleted
      return null;
    }

    if (res.status === 503) {
      // Maintenance
      const waitMs = BACKOFF_BASE_MS * Math.pow(2, attempt);
      console.log(
        `    503 maintenance. Waiting ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
      );
      totalRetries++;
      await sleep(waitMs);
      continue;
    }

    // Other error — don't retry
    return null;
  }

  return null; // All retries exhausted
}

// ─── Generate Unique Battle ID ──────────────────────────────────
function generateBattleId(battleTime: string, players: string[]): string {
  const sorted = [...players].sort().join(",");
  const raw = `${battleTime}:${sorted}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

// ─── Process One Battle ─────────────────────────────────────────
function parseBattle(
  entry: any,
  fetchedPlayerTag: string
): {
  battle: any;
  players: any[];
} | null {
  const { battleTime, event, battle } = entry;

  // Skip if no teams (Showdown, special modes)
  if (!battle?.teams || battle.teams.length !== 2) return null;

  // Skip friendly/challenge matches — only want ranked/trophy matches
  if (!battle.result) return null;

  // Collect all player tags
  const allPlayerTags: string[] = [];
  for (const team of battle.teams) {
    for (const player of team) {
      allPlayerTags.push(player.tag);
    }
  }

  const battleId = generateBattleId(battleTime, allPlayerTags);

  // Figure out which team the fetched player is on
  let fetchedTeamIndex = -1;
  for (let t = 0; t < battle.teams.length; t++) {
    for (const player of battle.teams[t]) {
      if (player.tag === fetchedPlayerTag) {
        fetchedTeamIndex = t;
        break;
      }
    }
    if (fetchedTeamIndex !== -1) break;
  }

  if (fetchedTeamIndex === -1) return null;

  // Determine win/loss per team
  const fetchedTeamWon = battle.result === "victory";
  const isDraw = battle.result === "draw";

  // Parse battleTime: "20260324T234248.000Z" → ISO date
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

  const starPlayerTag = battle.starPlayer?.tag || null;

  const playerRows: any[] = [];
  for (let t = 0; t < battle.teams.length; t++) {
    const teamWon = isDraw ? false : t === fetchedTeamIndex ? fetchedTeamWon : !fetchedTeamWon;

    for (const player of battle.teams[t]) {
      playerRows.push({
        battle_id: battleId,
        player_tag: player.tag,
        brawler_id: player.brawler.id,
        brawler_name: player.brawler.name,
        brawler_power: player.brawler.power,
        brawler_trophies: player.brawler.trophies,
        team_num: t,
        won: teamWon,
        is_star_player: player.tag === starPlayerTag,
      });
    }
  }

  return { battle: battleRow, players: playerRows };
}

// ─── Save Batch to Supabase ─────────────────────────────────────
async function saveBattles(
  battles: any[],
  players: any[]
): Promise<{ battlesSaved: number; playersSaved: number }> {
  let battlesSaved = 0;
  let playersSaved = 0;

  if (battles.length > 0) {
    // Upsert battles (ignore duplicates)
    const { error: bErr, count } = await supabase
      .from("battles")
      .upsert(battles, { onConflict: "id", ignoreDuplicates: true })
      .select("id");

    if (bErr) {
      console.error(`    Error saving battles: ${bErr.message}`);
    }
  }

  if (players.length > 0) {
    // For players, we need to avoid duplicates.
    // Delete-then-insert approach: first check which battle_ids are new
    // Actually, simplest: just insert and catch errors, or use a unique constraint.
    // For now, insert all — duplicates will be rare because we check battle existence.
    const { error: pErr } = await supabase
      .from("battle_players")
      .upsert(players, { onConflict: "battle_id,player_tag", ignoreDuplicates: true });

    if (pErr) {
      // If it's a unique constraint error, that's fine — means we already have these
      if (!pErr.message.includes("duplicate") && !pErr.message.includes("unique")) {
        console.error(`    Error saving players: ${pErr.message}`);
      }
    }
  }

  return { battlesSaved: battles.length, playersSaved: players.length };
}

// ─── Mark Tag as Processed ──────────────────────────────────────
async function markProcessed(tag: string) {
  await supabase
    .from("harvested_tags")
    .update({ processed_at: new Date().toISOString() })
    .eq("player_tag", tag);
}

// ─── Get Unprocessed Tags ───────────────────────────────────────
async function getUnprocessedTags(
  limit: number = 1000,
  offset: number = 0
): Promise<string[]> {
  const { data, error } = await supabase
    .from("harvested_tags")
    .select("player_tag")
    .is("processed_at", null)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error(`Error fetching tags: ${error.message}`);
    return [];
  }

  return (data || []).map((row: any) => row.player_tag);
}

// ─── Get Total Counts ───────────────────────────────────────────
async function getCounts(): Promise<{ total: number; processed: number }> {
  const { count: total } = await supabase
    .from("harvested_tags")
    .select("*", { count: "exact", head: true });

  const { count: processed } = await supabase
    .from("harvested_tags")
    .select("*", { count: "exact", head: true })
    .not("processed_at", "is", null);

  return { total: total || 0, processed: processed || 0 };
}

// ─── Print Stats ────────────────────────────────────────────────
function printStats(currentIndex: number, totalTags: number) {
  const elapsed = (Date.now() - startTime) / 1000;
  const rps = totalRequests / elapsed;
  const remaining = totalTags - currentIndex;
  const etaSeconds = remaining / rps;
  const etaMinutes = Math.floor(etaSeconds / 60);
  const etaHours = Math.floor(etaMinutes / 60);

  console.log(
    `\n  [STATS] ${currentIndex}/${totalTags} tags | ` +
      `${totalBattlesSaved} battles | ${totalPlayersSaved} player records | ` +
      `${total429s} rate limits | ${(rps).toFixed(1)} req/s | ` +
      `ETA: ${etaHours}h ${etaMinutes % 60}m\n`
  );
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log("=== BrawlLens Battle Collector ===\n");

  // Check if processed_at column exists, add it if not
  const { error: alterErr } = await supabase.rpc("exec_sql", {
    sql: "ALTER TABLE harvested_tags ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;",
  });

  // If RPC doesn't exist, tell user to add column manually
  if (alterErr) {
    console.log(
      "Note: Run this in Supabase SQL Editor if you haven't already:"
    );
    console.log(
      "  ALTER TABLE harvested_tags ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;\n"
    );
  }

  const counts = await getCounts();
  console.log(
    `Total tags: ${counts.total} | Already processed: ${counts.processed} | Remaining: ${counts.total - counts.processed}\n`
  );

  startTime = Date.now();
  let globalIndex = counts.processed;

  // Process in chunks of 1000 tags
  while (true) {
    const tags = await getUnprocessedTags(1000);
    if (tags.length === 0) {
      console.log("All tags processed!");
      break;
    }

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const encodedTag = encodeURIComponent(tag);
      globalIndex++;

      // Fetch battle log
      const data = await apiFetch(`/players/${encodedTag}/battlelog`);
      await sleep(MIN_DELAY_MS);

      if (!data?.items) {
        totalSkipped++;
        await markProcessed(tag);
        continue;
      }

      // Parse all battles
      const batchBattles: any[] = [];
      const batchPlayers: any[] = [];

      for (const entry of data.items) {
        const parsed = parseBattle(entry, tag);
        if (!parsed) continue;
        batchBattles.push(parsed.battle);
        batchPlayers.push(...parsed.players);
      }

      // Save batch
      if (batchBattles.length > 0) {
        const saved = await saveBattles(batchBattles, batchPlayers);
        totalBattlesSaved += saved.battlesSaved;
        totalPlayersSaved += saved.playersSaved;
      }

      // Mark as done
      await markProcessed(tag);

      // Print progress every 100 tags
      if (globalIndex % 100 === 0) {
        printStats(globalIndex, counts.total);
      }

      // Print dot every 10 tags for visual progress
      if (globalIndex % 10 === 0 && globalIndex % 100 !== 0) {
        process.stdout.write(".");
      }
    }
  }

  // Final stats
  const elapsed = (Date.now() - startTime) / 1000;
  console.log("\n\n=== DONE ===");
  console.log(`Total time: ${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`);
  console.log(`Total API requests: ${totalRequests}`);
  console.log(`Total 429 rate limits: ${total429s}`);
  console.log(`Total retries: ${totalRetries}`);
  console.log(`Battles saved: ${totalBattlesSaved}`);
  console.log(`Player records saved: ${totalPlayersSaved}`);
  console.log(`Tags skipped (no data): ${totalSkipped}`);
}

main().catch(console.error);