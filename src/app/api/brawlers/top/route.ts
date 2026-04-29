import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const MODE_LABELS: Record<string, string> = {
  brawlBall: "Brawl Ball", gemGrab: "Gem Grab", knockout: "Knockout",
  bounty: "Bounty", heist: "Heist", hotZone: "Hot Zone", wipeout: "Wipeout",
  duels: "Duels", siege: "Siege", soloShowdown: "Showdown", duoShowdown: "Duo SD",
  trioShowdown: "Trio SD", payload: "Payload", basketBrawl: "Basket Brawl",
  volleyBrawl: "Volley Brawl", botDrop: "Bot Drop", hunters: "Hunters",
  trophyEscape: "Trophy Escape", paintBrawl: "Paint Brawl", wipeout5V5: "5v5 Wipeout",
}

const MIN_TOTAL_PICKS = 500
const MIN_MAP_PICKS = 20

export async function GET() {
  const { data, error } = await supabase
    .from("map_brawler_stats")
    .select("brawler_id, brawler_name, map, mode, picks, wins, win_rate")

  if (error || !data) return NextResponse.json({ brawler: null })

  const agg = new Map<number, { id: number; name: string; picks: number; wins: number }>()
  for (const r of data) {
    const id = r.brawler_id
    const picks = Number(r.picks)
    const wins = Number(r.wins)
    const cur = agg.get(id)
    if (cur) { cur.picks += picks; cur.wins += wins }
    else agg.set(id, { id, name: r.brawler_name, picks, wins })
  }

  let top: { id: number; name: string; picks: number; wins: number; winRate: number } | null = null
  for (const b of agg.values()) {
    if (b.picks < MIN_TOTAL_PICKS) continue
    const wr = (b.wins / b.picks) * 100
    if (!top || wr > top.winRate) top = { ...b, winRate: wr }
  }

  if (!top) {
    const res = NextResponse.json({ brawler: null })
    res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
    return res
  }

  const topId = top.id
  const bestMap = data
    .filter(r => r.brawler_id === topId && Number(r.picks) >= MIN_MAP_PICKS)
    .map(r => ({ map: r.map, mode: r.mode, winRate: Number(r.win_rate), picks: Number(r.picks) }))
    .sort((a, b) => b.winRate - a.winRate)[0]

  const res = NextResponse.json({
    brawler: {
      id: top.id,
      name: top.name,
      winRate: top.winRate,
      picks: top.picks,
      bestMap: bestMap
        ? { name: bestMap.map, mode: MODE_LABELS[bestMap.mode] ?? bestMap.mode, winRate: bestMap.winRate }
        : null,
    },
  })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
