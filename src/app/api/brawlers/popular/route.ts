import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const MIN_TOTAL_PICKS = 200

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 12, 1), 50)

  const { data, error } = await supabase
    .from("map_brawler_stats")
    .select("brawler_id, brawler_name, picks, wins")

  if (error || !data) return NextResponse.json({ brawlers: [] })

  const agg = new Map<number, { id: number; name: string; picks: number; wins: number }>()
  for (const r of data) {
    const id = r.brawler_id
    const cur = agg.get(id)
    const picks = Number(r.picks)
    const wins = Number(r.wins)
    if (cur) {
      cur.picks += picks
      cur.wins += wins
    } else {
      agg.set(id, { id, name: r.brawler_name, picks, wins })
    }
  }

  const totalPicks = Array.from(agg.values()).reduce((sum, b) => sum + b.picks, 0)

  const brawlers = Array.from(agg.values())
    .filter(b => b.picks >= MIN_TOTAL_PICKS)
    .map(b => ({
      id: b.id,
      name: b.name,
      picks: b.picks,
      wins: b.wins,
      winRate: b.picks > 0 ? (b.wins / b.picks) * 100 : 0,
      pickRate: totalPicks > 0 ? (b.picks / totalPicks) * 100 : 0,
    }))
    .sort((a, b) => b.picks - a.picks)
    .slice(0, limit)

  const res = NextResponse.json({ brawlers, totalPicks })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
