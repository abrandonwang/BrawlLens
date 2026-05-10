import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getModeName } from "@/lib/modes"
import { fetchAllPaged } from "@/lib/supabaseFetch"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
)

const MIN_BEST_MAP_PICKS = 20

type Row = {
  brawler_id: number
  brawler_name: string
  map: string
  mode: string
  picks: number | string
  wins: number | string
  win_rate: number | string
}

export async function GET() {
  const { data, error } = await fetchAllPaged<Row>(() =>
    supabase
      .from("map_brawler_stats")
      .select("brawler_id, brawler_name, map, mode, picks, wins, win_rate")
      .order("brawler_id", { ascending: true })
      .order("map", { ascending: true })
      .order("mode", { ascending: true })
  )

  if (error || data.length === 0) {
    return NextResponse.json({ stats: {} }, { status: error ? 502 : 200 })
  }

  const stats = new Map<number, {
    id: number
    name: string
    picks: number
    wins: number
    mapCount: number
    bestMap: { name: string; mode: string; winRate: number; picks: number } | null
    histogram: number[]
  }>()

  for (const row of data) {
    const id = Number(row.brawler_id)
    const picks = Number(row.picks)
    const wins = Number(row.wins)
    const winRate = Number(row.win_rate)
    const current = stats.get(id) ?? {
      id,
      name: row.brawler_name,
      picks: 0,
      wins: 0,
      mapCount: 0,
      bestMap: null,
      histogram: [0, 0, 0, 0, 0],
    }

    current.picks += picks
    current.wins += wins
    current.mapCount += 1

    const bucket = Math.max(0, Math.min(4, Math.floor(winRate / 20)))
    current.histogram[bucket] += 1

    if (picks >= MIN_BEST_MAP_PICKS && (!current.bestMap || winRate > current.bestMap.winRate)) {
      current.bestMap = {
        name: row.map,
        mode: getModeName(row.mode),
        winRate,
        picks,
      }
    }

    stats.set(id, current)
  }

  const payload = Object.fromEntries(
    Array.from(stats.values()).map(brawler => [
      brawler.id,
      {
        ...brawler,
        winRate: brawler.picks > 0 ? (brawler.wins / brawler.picks) * 100 : null,
      },
    ]),
  )

  const res = NextResponse.json({ stats: payload })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
