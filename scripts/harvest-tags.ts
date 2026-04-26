import { config } from "dotenv";
import { Pool } from "pg";

// Load .env.local
config({ path: ".env.local" });

const BRAWL_API_KEY = process.env.BRAWL_API_KEY!;

const localPg = new Pool({
  connectionString: process.env.LOCAL_PG_URL || "postgresql://brawlens:brawlens2026@localhost:5432/brawlens",
});

const BASE_URL = "https://api.brawlstars.com/v1";

// Regions to scrape
const REGIONS = ["global", "US", "BR", "DE", "KR", "JP"];

// Delay between API calls (ms) to avoid rate limits
const DELAY_MS = 100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch(endpoint: string): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${BRAWL_API_KEY}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  API error ${res.status} for ${endpoint}: ${text}`);
    return null;
  }

  return res.json();
}

// ─── Stage 1: Player Rankings ───────────────────────────────────
async function harvestPlayerRankings(
  region: string
): Promise<Map<string, string>> {
  const tags = new Map<string, string>();
  const source = `${region}/players`;

  console.log(`  Fetching player rankings for ${region}...`);
  const data = await apiFetch(`/rankings/${region}/players`);
  if (!data?.items) return tags;

  for (const player of data.items) {
    tags.set(player.tag, source);
  }
  console.log(`    Found ${data.items.length} players`);
  return tags;
}

// ─── Stage 2: Brawler Rankings ──────────────────────────────────
async function getBrawlerIds(): Promise<number[]> {
  console.log("Fetching brawler list...");
  const data = await apiFetch("/brawlers");
  if (!data?.items) {
    console.error("Failed to fetch brawlers!");
    return [];
  }
  const ids = data.items.map((b: any) => b.id);
  console.log(`Found ${ids.length} brawlers`);
  return ids;
}

async function harvestBrawlerRankings(
  region: string,
  brawlerIds: number[]
): Promise<Map<string, string>> {
  const tags = new Map<string, string>();

  console.log(
    `  Fetching brawler rankings for ${region} (${brawlerIds.length} brawlers)...`
  );

  for (let i = 0; i < brawlerIds.length; i++) {
    const brawlerId = brawlerIds[i];
    const source = `${region}/brawlers/${brawlerId}`;

    const data = await apiFetch(`/rankings/${region}/brawlers/${brawlerId}`);
    if (data?.items) {
      for (const player of data.items) {
        tags.set(player.tag, source);
      }
    }

    // Progress every 10 brawlers
    if ((i + 1) % 10 === 0) {
      console.log(`    ${i + 1}/${brawlerIds.length} brawlers done`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`    Total unique tags from brawler rankings: ${tags.size}`);
  return tags;
}

// ─── Stage 3: Club Rankings → Member Tags ───────────────────────
async function harvestClubMembers(
  region: string
): Promise<Map<string, string>> {
  const tags = new Map<string, string>();
  const source = `${region}/clubs`;

  console.log(`  Fetching club rankings for ${region}...`);
  const data = await apiFetch(`/rankings/${region}/clubs`);
  if (!data?.items) return tags;

  console.log(`    Found ${data.items.length} clubs, fetching members...`);

  for (let i = 0; i < data.items.length; i++) {
    const club = data.items[i];
    const clubTag = encodeURIComponent(club.tag);
    const clubData = await apiFetch(`/clubs/${clubTag}`);

    if (clubData?.members) {
      for (const member of clubData.members) {
        tags.set(member.tag, source);
      }
    }

    // Progress every 25 clubs
    if ((i + 1) % 25 === 0) {
      console.log(`    ${i + 1}/${data.items.length} clubs done`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`    Total unique tags from clubs: ${tags.size}`);
  return tags;
}

// ─── Save to local Postgres ─────────────────────────────────────
async function saveTags(tags: Map<string, string>) {
  console.log(`\nSaving ${tags.size} tags to local database...`);

  const playerTags = Array.from(tags.keys());
  const BATCH_SIZE = 500;
  let saved = 0;

  for (let i = 0; i < playerTags.length; i += BATCH_SIZE) {
    const batch = playerTags.slice(i, i + BATCH_SIZE);
    const values = batch.map((_, j) => `($${j + 1})`).join(",");
    await localPg.query(
      `INSERT INTO harvested_tags (player_tag) VALUES ${values} ON CONFLICT DO NOTHING`,
      batch
    ).catch(e => console.error(`  Error saving batch at ${i}: ${e.message}`));
    saved += batch.length;
    console.log(`  Saved ${saved}/${playerTags.length}`);
  }

  console.log(`Done! ${saved} tags in database.`);
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log("=== BrawlLens Tag Harvester ===\n");

  // Collect all tags in one big map (auto-deduplicates)
  const allTags = new Map<string, string>();

  // Get brawler IDs first
  const brawlerIds = await getBrawlerIds();
  if (brawlerIds.length === 0) {
    console.error("No brawlers found. Check your API key.");
    return;
  }
  await sleep(DELAY_MS);

  for (const region of REGIONS) {
    console.log(`\n--- Region: ${region} ---`);

    // Player rankings
    const playerTags = await harvestPlayerRankings(region);
    for (const [tag, source] of playerTags) allTags.set(tag, source);
    await sleep(DELAY_MS);

    // Brawler rankings
    const brawlerTags = await harvestBrawlerRankings(region, brawlerIds);
    for (const [tag, source] of brawlerTags) allTags.set(tag, source);
    await sleep(DELAY_MS);

    // Club members
    const clubTags = await harvestClubMembers(region);
    for (const [tag, source] of clubTags) allTags.set(tag, source);
    await sleep(DELAY_MS);

    console.log(`  Running total: ${allTags.size} unique tags`);
  }

  // Save everything
  await saveTags(allTags);
}

main().catch(console.error);