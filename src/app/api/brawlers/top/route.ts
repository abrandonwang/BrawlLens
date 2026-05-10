import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getModeName } from "@/lib/modes"
import { fetchAllPaged } from "@/lib/supabaseFetch"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type Row = {
  brawler_id: number
  brawler_name: string
  map: string
  mode: string
  picks: number | string
  wins: number | string
  win_rate: number | string
}

const MIN_TOTAL_PICKS = 500
const MIN_MAP_PICKS = 20

function getVolumeScore(picks: number, maxPicks: number) {
  if (maxPicks <= 0) return 0
  return (Math.log1p(picks) / Math.log1p(maxPicks)) * 100
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

  if (error || data.length === 0) return NextResponse.json({ brawler: null })

  const agg = new Map<number, {
    id: number
    name: string
    picks: number
    wins: number
    qualifyingMapPicks: number
    strongMapPicks: number
  }>()
  for (const r of data) {
    const id = r.brawler_id
    const picks = Number(r.picks)
    const wins = Number(r.wins)
    const winRate = Number(r.win_rate)
    const cur = agg.get(id)
    const qualifyingMapPicks = picks >= MIN_MAP_PICKS ? picks : 0
    const strongMapPicks = picks >= MIN_MAP_PICKS && winRate >= 50 ? picks : 0
    if (cur) {
      cur.picks += picks
      cur.wins += wins
      cur.qualifyingMapPicks += qualifyingMapPicks
      cur.strongMapPicks += strongMapPicks
    } else {
      agg.set(id, { id, name: r.brawler_name, picks, wins, qualifyingMapPicks, strongMapPicks })
    }
  }

  const maxPicks = Math.max(...Array.from(agg.values()).map(b => b.picks), 0)
  let top: {
    id: number
    name: string
    picks: number
    wins: number
    winRate: number
    score: number
    consistency: number
  } | null = null
  for (const b of agg.values()) {
    if (b.picks < MIN_TOTAL_PICKS) continue
    const winRate = (b.wins / b.picks) * 100
    const volumeScore = getVolumeScore(b.picks, maxPicks)
    const consistency = b.qualifyingMapPicks > 0 ? (b.strongMapPicks / b.qualifyingMapPicks) * 100 : winRate
    const score = winRate * 0.68 + volumeScore * 0.18 + consistency * 0.14
    if (!top || score > top.score) top = { ...b, winRate, score, consistency }
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
      score: top.score,
      consistency: top.consistency,
      bestMap: bestMap
        ? { name: bestMap.map, mode: getModeName(bestMap.mode), winRate: bestMap.winRate }
        : null,
    },
  })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
