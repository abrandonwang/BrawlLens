import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const map = searchParams.get("map");

  // ── Brawler win rates for a specific map ────────────────
  if (map) {
    const { data, error } = await supabase.rpc("get_map_meta", {
      map_name: map,
    });

    if (error) {
      console.error("get_map_meta error:", error.message);
      return NextResponse.json({ map, totalBattles: 0, brawlers: [] });
    }

    // Get total battles for this map
    const { count } = await supabase
      .from("battles")
      .select("*", { count: "exact", head: true })
      .eq("map", map);

    const brawlers = (data || []).map((row: any) => ({
      brawlerId: row.brawler_id,
      name: row.brawler_name,
      picks: Number(row.picks),
      wins: Number(row.wins),
      winRate: Number(row.win_rate),
    }));

    return NextResponse.json({
      map,
      totalBattles: count || 0,
      brawlers,
    });
  }

  // ── All modes and maps with battle counts ───────────────
  const { data, error } = await supabase.rpc("get_modes_and_maps");

  if (error) {
    console.error("get_modes_and_maps error:", error.message);
    return NextResponse.json({ modes: [] });
  }

  // Group by mode
  const modeMap = new Map<
    string,
    { totalBattles: number; maps: { name: string; battles: number }[] }
  >();

  for (const row of data || []) {
    if (!modeMap.has(row.mode)) {
      modeMap.set(row.mode, { totalBattles: 0, maps: [] });
    }
    const entry = modeMap.get(row.mode)!;
    const count = Number(row.battle_count);
    entry.totalBattles += count;
    entry.maps.push({ name: row.map, battles: count });
  }

  const modes = Array.from(modeMap.entries())
    .map(([mode, info]) => ({
      mode,
      totalBattles: info.totalBattles,
      maps: info.maps.sort((a, b) => b.battles - a.battles),
    }))
    .sort((a, b) => b.totalBattles - a.totalBattles);

  return NextResponse.json({ modes });
}