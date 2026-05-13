import { createClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { fetchAllPaged } from "@/lib/supabaseFetch"

type StatRow = {
  brawler_id: number
  brawler_name: string
  map: string
  mode: string
  picks: number | string
  wins: number | string
  win_rate: number | string
}

type MapRow = {
  map: string
  mode: string
  battle_count: number | string
}

type BrawlifyBrawler = {
  id: number
  name: string
  imageUrl2: string
  rarity?: { name?: string; color?: string }
  class?: { name?: string }
}

export type GuideBrawler = {
  id: number
  name: string
  imageUrl: string
  rarity: string
  rarityColor: string
  role: string
  picks: number
  wins: number
  winRate: number
  score: number
  consistency: number
  mapCoverage: number
  bestMap: {
    name: string
    mode: string
    winRate: number
    picks: number
  } | null
}

export type GuideMap = {
  name: string
  mode: string
  battles: number
}

export type GuideDataset = {
  brawlers: GuideBrawler[]
  maps: GuideMap[]
  totalPicks: number
  totalBattles: number
}

const MIN_TOTAL_PICKS = 500
const MIN_MAP_PICKS = 100

function supabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
}

function modeLabel(mode: string) {
  return mode
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase())
}

function volumeScore(picks: number, maxPicks: number) {
  if (maxPicks <= 0) return 0
  return (Math.log1p(picks) / Math.log1p(maxPicks)) * 100
}

async function fetchBrawlerCatalog() {
  try {
    const response = await fetch("https://api.brawlify.com/v1/brawlers", { next: { revalidate: 3600 } })
    if (!response.ok) return new Map<number, BrawlifyBrawler>()
    const data = await response.json() as { list?: BrawlifyBrawler[] }
    return new Map((data.list ?? []).map(brawler => [brawler.id, brawler]))
  } catch (error) {
    console.error("Guide brawler catalog fetch failed:", error)
    return new Map<number, BrawlifyBrawler>()
  }
}

async function loadGuideDataset(): Promise<GuideDataset> {
  const db = supabase()
  const [statsResult, mapsResult, catalog] = await Promise.all([
    fetchAllPaged<StatRow>(() =>
      db
        .from("map_brawler_stats")
        .select("brawler_id, brawler_name, map, mode, picks, wins, win_rate")
        .order("brawler_id", { ascending: true })
        .order("map", { ascending: true })
    ),
    db
      .from("map_stats")
      .select("map, mode, battle_count")
      .order("battle_count", { ascending: false })
      .limit(120),
    fetchBrawlerCatalog(),
  ])

  if (statsResult.error) {
    console.error("Guide stats fetch failed:", statsResult.error.message)
  }

  const aggregate = new Map<number, {
    id: number
    name: string
    picks: number
    wins: number
    strongMapPicks: number
    qualifyingMapPicks: number
    qualifyingMaps: number
    bestMap: GuideBrawler["bestMap"]
  }>()

  for (const row of statsResult.data) {
    const picks = Number(row.picks)
    const wins = Number(row.wins)
    const winRate = Number(row.win_rate)
    if (!Number.isFinite(picks) || !Number.isFinite(wins) || picks <= 0) continue

    const current = aggregate.get(row.brawler_id) ?? {
      id: row.brawler_id,
      name: row.brawler_name,
      picks: 0,
      wins: 0,
      strongMapPicks: 0,
      qualifyingMapPicks: 0,
      qualifyingMaps: 0,
      bestMap: null,
    }

    current.picks += picks
    current.wins += wins

    if (picks >= MIN_MAP_PICKS) {
      current.qualifyingMaps += 1
      current.qualifyingMapPicks += picks
      if (winRate >= 50) current.strongMapPicks += picks
      if (!current.bestMap || winRate > current.bestMap.winRate) {
        current.bestMap = {
          name: row.map,
          mode: modeLabel(row.mode),
          winRate,
          picks,
        }
      }
    }

    aggregate.set(row.brawler_id, current)
  }

  const maxPicks = Math.max(...Array.from(aggregate.values()).map(brawler => brawler.picks), 0)
  const brawlers = Array.from(aggregate.values())
    .filter(brawler => brawler.picks >= MIN_TOTAL_PICKS)
    .map(brawler => {
      const catalogEntry = catalog.get(brawler.id)
      const winRate = brawler.picks > 0 ? (brawler.wins / brawler.picks) * 100 : 0
      const consistency = brawler.qualifyingMapPicks > 0
        ? (brawler.strongMapPicks / brawler.qualifyingMapPicks) * 100
        : winRate
      const score = winRate * 0.66 + volumeScore(brawler.picks, maxPicks) * 0.2 + consistency * 0.14

      return {
        id: brawler.id,
        name: brawler.name,
        imageUrl: catalogEntry?.imageUrl2 ?? `https://cdn.brawlify.com/brawlers/borderless/${brawler.id}.png`,
        rarity: catalogEntry?.rarity?.name ?? "Unknown",
        rarityColor: catalogEntry?.rarity?.color ?? "#8bd7ff",
        role: catalogEntry?.class?.name && catalogEntry.class.name !== "Unknown" ? catalogEntry.class.name : "Flexible",
        picks: brawler.picks,
        wins: brawler.wins,
        winRate,
        score,
        consistency,
        mapCoverage: brawler.qualifyingMaps,
        bestMap: brawler.bestMap,
      } satisfies GuideBrawler
    })
    .sort((a, b) => b.score - a.score)

  const maps = ((mapsResult.data ?? []) as MapRow[])
    .map(row => ({
      name: row.map,
      mode: modeLabel(row.mode),
      battles: Number(row.battle_count),
    }))
    .filter(map => map.name && map.name.toLowerCase() !== "unknown" && Number.isFinite(map.battles))

  return {
    brawlers,
    maps,
    totalPicks: brawlers.reduce((total, brawler) => total + brawler.picks, 0),
    totalBattles: maps.reduce((total, map) => total + map.battles, 0),
  }
}

export const fetchGuideDataset = unstable_cache(loadGuideDataset, ["brawllens-guide-dataset"], {
  revalidate: 300,
})
