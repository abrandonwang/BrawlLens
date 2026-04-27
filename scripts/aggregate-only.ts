import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

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
    HAVING COUNT(*) >= 5
    ORDER BY picks DESC
  `);

  console.log(`  Brawler stat rows from local DB: ${brawlerRes.rows.length}`);

  if (brawlerRes.rows.length > 0) {
    const brawlerRows = brawlerRes.rows.map(r => ({
      map: r.map, mode: r.mode,
      brawler_id: Number(r.brawler_id), brawler_name: r.brawler_name,
      picks: Number(r.picks), wins: Number(r.wins), win_rate: Number(r.win_rate),
    }));

    let upsertFailed = false;
    for (let i = 0; i < brawlerRows.length; i += 500) {
      const { error } = await supabase.from("map_brawler_stats").upsert(brawlerRows.slice(i, i + 500), { onConflict: "map,mode,brawler_id" });
      if (error) {
        console.error(`  map_brawler_stats upsert error (chunk ${i}–${i+500}): ${error.message}`);
        upsertFailed = true;
      }
    }

    if (upsertFailed) {
      console.error("\n  Upsert had errors — skipping TRUNCATE to preserve raw data.");
      await localPg.end();
      return;
    }

    console.log(`  Pushed ${brawlerRows.length} brawler stat rows to Supabase.`);
  }

  await localPg.query("TRUNCATE battles, battle_players");
  console.log("  Local raw tables truncated.");

  await localPg.end();
  console.log("\nDone.");
}

main().catch(console.error);
