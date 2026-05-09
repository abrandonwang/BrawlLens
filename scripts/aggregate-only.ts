import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import { aggregateAndFlushStats } from "./stats-aggregation";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const localPg = new Pool({
  connectionString: process.env.LOCAL_PG_URL || "postgresql://brawlens:brawlens2026@localhost:5432/brawlens",
});

async function main() {
  await localPg.query("SELECT 1").catch(e => {
    console.error("FATAL: Cannot connect to local Postgres:", e.message);
    process.exit(1);
  });

  const { rows: bpCount } = await localPg.query("SELECT COUNT(*) FROM battle_players");
  const { rows: bCount } = await localPg.query("SELECT COUNT(*) FROM battles");
  console.log(`battles: ${bCount[0].count}, battle_players: ${bpCount[0].count}`);

  if (Number(bpCount[0].count) === 0) {
    console.log("No raw data in local DB — nothing to aggregate.");
    await localPg.end();
    return;
  }

  console.log("\nAggregating map stats...");
  const result = await aggregateAndFlushStats(localPg, supabase);
  if (result.skippedDuplicate) {
    console.log(`  Duplicate raw batch ${result.battleCount} battles / ${result.playerCount} player rows already aggregated.`);
    console.log("  Local raw tables truncated.");
  } else if (result.aggregated) {
    console.log(`  Added ${result.mapRows} map stat increments to Supabase.`);
    console.log(`  Added ${result.brawlerRows} brawler stat increments to Supabase.`);
    console.log(`  Aggregated ${result.battleCount} battles / ${result.playerCount} player rows.`);
    console.log("  Local raw tables truncated.");
  }

  await localPg.end();
  console.log("\nDone.");
}

main().catch(console.error);
