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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 })

  const { data, error } = await supabase
    .from("map_brawler_stats")
    .select("map, mode, picks, wins, win_rate")
    .eq("brawler_id", id)
    .order("picks", { ascending: false })

  if (error || !data) return NextResponse.json({ maps: [], modes: [], totalPicks: 0, avgWinRate: null })

  const totalPicks = data.reduce((s, r) => s + Number(r.picks), 0)
  const totalWins = data.reduce((s, r) => s + Number(r.wins), 0)
  const avgWinRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : null
  const maps = data
    .filter(r => Number(r.picks) >= 20)
    .sort((a, b) => Number(b.win_rate) - Number(a.win_rate))
    .slice(0, 15)
    .map(r => ({
      map: r.map,
      mode: MODE_LABELS[r.mode] ?? r.mode,
      picks: Number(r.picks),
      wins: Number(r.wins),
      winRate: Number(r.win_rate),
    }))
  const modeMap = new Map<string, { picks: number; wins: number }>()
  for (const r of data) {
    const key = r.mode
    const cur = modeMap.get(key) ?? { picks: 0, wins: 0 }
    cur.picks += Number(r.picks)
    cur.wins += Number(r.wins)
    modeMap.set(key, cur)
  }
  const modes = Array.from(modeMap.entries())
    .map(([mode, s]) => ({
      mode: MODE_LABELS[mode] ?? mode,
      picks: s.picks,
      winRate: s.picks > 0 ? (s.wins / s.picks) * 100 : 0,
    }))
    .filter(m => m.picks >= 10)
    .sort((a, b) => b.winRate - a.winRate)

  const res = NextResponse.json({ totalPicks, avgWinRate, maps, modes })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
