import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getModeName } from "@/lib/modes"
import { parseBrawlerId } from "@/lib/validation"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

type DailyHistoryRow = {
  stat_date: string
  picks: number | string
  wins: number | string
  win_rate: number | string
  map_count: number | string
}

async function fetchDailyHistory(id: number) {
  const { data, error } = await supabase
    .from("brawler_stats_daily")
    .select("stat_date, picks, wins, win_rate, map_count")
    .eq("brawler_id", id)
    .order("stat_date", { ascending: false })
    .limit(30)

  if (error || !data) return []

  return (data as DailyHistoryRow[])
    .slice()
    .reverse()
    .map(row => ({
      date: row.stat_date,
      picks: Number(row.picks),
      wins: Number(row.wins),
      winRate: Number(row.win_rate),
      mapCount: Number(row.map_count),
    }))
    .filter(row =>
      row.date
      && Number.isFinite(row.picks)
      && Number.isFinite(row.wins)
      && Number.isFinite(row.winRate)
      && Number.isFinite(row.mapCount)
    )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = parseBrawlerId(searchParams.get("id"))
  if (id === null) return NextResponse.json({ error: "invalid id" }, { status: 400 })

  const [mapResult, history] = await Promise.all([
    supabase
      .from("map_brawler_stats")
      .select("map, mode, picks, wins, win_rate")
      .eq("brawler_id", id)
      .order("picks", { ascending: false }),
    fetchDailyHistory(id),
  ])
  const { data, error } = mapResult

  if (error || !data) {
    return NextResponse.json({
      maps: [],
      modes: [],
      totalPicks: 0,
      avgWinRate: null,
      histogram: [],
      history,
      historySource: "daily_snapshots",
    })
  }

  const totalPicks = data.reduce((s, r) => s + Number(r.picks), 0)
  const totalWins = data.reduce((s, r) => s + Number(r.wins), 0)
  const avgWinRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : null
  const minMapPicks = Math.max(20, Math.ceil(totalPicks * 0.03))
  const allMaps = data
    .filter(r => Number(r.picks) >= minMapPicks)
    .sort((a, b) => Number(b.win_rate) - Number(a.win_rate))
    .map(r => ({
      map: r.map,
      mode: getModeName(r.mode),
      picks: Number(r.picks),
      wins: Number(r.wins),
      winRate: Number(r.win_rate),
    }))
  const maps = allMaps.slice(0, 15)
  let cumulativePicks = 0
  let cumulativeWins = 0
  const trend7 = [...allMaps]
    .sort((a, b) => b.picks - a.picks)
    .slice(0, 12)
    .map((map, index, source) => {
      cumulativePicks += map.picks
      cumulativeWins += map.wins
      return {
        label: index === 0 ? "Top map" : index === source.length - 1 ? `${index + 1} maps` : `${index + 1}`,
        winRate: cumulativePicks > 0 ? (cumulativeWins / cumulativePicks) * 100 : 0,
        picks: cumulativePicks,
      }
    })
  const histogram = allMaps.reduce<number[]>((buckets, map) => {
    const index = Math.max(0, Math.min(4, Math.floor(map.winRate / 20)))
    buckets[index] += 1
    return buckets
  }, [0, 0, 0, 0, 0])
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
      mode: getModeName(mode),
      picks: s.picks,
      winRate: s.picks > 0 ? (s.wins / s.picks) * 100 : 0,
    }))
    .filter(m => m.picks >= 10)
    .sort((a, b) => b.winRate - a.winRate)
  const trend30 = history.map(point => ({
    label: point.date.slice(5),
    winRate: point.winRate,
    picks: point.picks,
  }))

  const res = NextResponse.json({
    totalPicks,
    avgWinRate,
    maps,
    modes,
    histogram,
    trend7,
    trend30,
    history,
    historySource: "daily_snapshots",
  })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
