import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  const [playerRes, mapRes] = await Promise.all([
    supabase
      .from("leaderboards")
      .select("player_tag, player_name, trophies")
      .eq("region", "global")
      .eq("rank", 1)
      .single(),
    supabase
      .from("map_stats")
      .select("map, mode, battle_count")
      .order("battle_count", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const player = playerRes.data ?? null;
  const topMap = mapRes.data ?? null;

  let topBrawler: { brawler_name: string; brawler_id: number; win_rate: number } | null = null;
  if (topMap) {
    const { data } = await supabase
      .from("map_brawler_stats")
      .select("brawler_name, brawler_id, win_rate")
      .eq("map", topMap.map)
      .order("win_rate", { ascending: false })
      .limit(1)
      .single();
    topBrawler = data ?? null;
  }

  const res = NextResponse.json({
    player: player
      ? { name: player.player_name, tag: player.player_tag, trophies: player.trophies }
      : null,
    map: topMap ? { name: topMap.map, mode: topMap.mode } : null,
    brawler: topBrawler
      ? { name: topBrawler.brawler_name, id: topBrawler.brawler_id, winRate: Number(topBrawler.win_rate) }
      : null,
  });

  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  return res;
}
