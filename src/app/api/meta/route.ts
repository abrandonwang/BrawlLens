import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const map = searchParams.get("map");

  if (map) {
    const { data, error } = await supabase
      .from("map_brawler_stats")
      .select("brawler_id, brawler_name, picks, wins, win_rate")
      .eq("map", map)
      .order("picks", { ascending: false });

    if (error) {
      console.error("map_brawler_stats error:", error.message);
      return NextResponse.json({ map, totalBattles: 0, brawlers: [] });
    }

    const rows = data || [];
    const totalBattles = rows.reduce((sum, r) => sum + Number(r.picks), 0) / 6;

    const brawlers = rows.map((row: any) => ({
      brawlerId: row.brawler_id,
      name: row.brawler_name,
      picks: Number(row.picks),
      wins: Number(row.wins),
      winRate: Number(row.win_rate),
    }));

    const res = NextResponse.json({ map, totalBattles: Math.round(totalBattles), brawlers });
    res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res;
  }

  const { data, error } = await supabase
    .from("map_stats")
    .select("map, mode, battle_count")
    .order("battle_count", { ascending: false });

  if (error) {
    console.error("map_stats error:", error.message);
    return NextResponse.json({ modes: [] });
  }

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

  const res = NextResponse.json({ modes });
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res;
}