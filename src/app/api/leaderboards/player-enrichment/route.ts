import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { fetchClubResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const dynamic = "force-dynamic"

interface PlayerProfile {
  icon?: { id?: number }
  trophies?: number
  highestTrophies?: number
  totalPrestigeLevel?: number
  "3vs3Victories"?: number
  soloVictories?: number
  duoVictories?: number
  club?: { tag?: string; name?: string }
  brawlers?: PlayerBrawler[]
}

interface ClubProfile {
  badgeId?: number
}

interface PlayerEnrichment {
  iconId: number | null
  totalTrophies: number | null
  highestTrophies: number | null
  totalPrestigeLevel: number | null
  threeVsThreeWins: number | null
  soloWins: number | null
  duoWins: number | null
  clubTag: string | null
  clubBadgeId: number | null
  topBrawlers: BrawlerSummary[]
  peakBrawler: BrawlerSummary | null
  selectedBrawlerId: number | null
  selectedBrawler: BrawlerSummary | null
  globalRankEstimate: number | null
  globalPercentile: string | null
}

const EMPTY_PLAYER: PlayerEnrichment = {
  iconId: null,
  totalTrophies: null,
  highestTrophies: null,
  totalPrestigeLevel: null,
  threeVsThreeWins: null,
  soloWins: null,
  duoWins: null,
  clubTag: null,
  clubBadgeId: null,
  topBrawlers: [],
  peakBrawler: null,
  selectedBrawlerId: null,
  selectedBrawler: null,
  globalRankEstimate: null,
  globalPercentile: null,
}

interface PlayerBrawler {
  id: number
  name: string
  trophies: number
  highestTrophies?: number
  rank?: number
  power?: number
  prestigeLevel?: number
}

interface BrawlerSummary {
  id: number
  name: string
  trophies: number
  highestTrophies: number | null
  rank: number | null
  power: number | null
  prestigeLevel: number | null
}

function cleanTag(raw: unknown) {
  return typeof raw === "string" ? sanitizePlayerTag(raw) : null
}

function cleanEnv(value: string | undefined) {
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, "")
  return cleaned || null
}

async function fetchPlayerEnrichment(tag: string, selectedBrawlerId?: number | null): Promise<PlayerEnrichment> {
  try {
    const response = await fetchPlayerResponse(tag, { next: { revalidate: 300 } })
    if (!response.ok) return emptyPlayer(selectedBrawlerId)

    const profile = (await response.json()) as PlayerProfile
    const brawlers = profile.brawlers ?? []
    const topBrawlers = [...brawlers]
      .sort((a, b) => b.trophies - a.trophies)
      .slice(0, 4)
      .map(toBrawlerSummary)
    const peakBrawler = [...brawlers]
      .sort((a, b) => (b.highestTrophies ?? b.trophies) - (a.highestTrophies ?? a.trophies))[0]
    const selectedBrawler = selectedBrawlerId
      ? brawlers.find(brawler => brawler.id === selectedBrawlerId)
      : null

    return {
      iconId: profile.icon?.id ?? null,
      totalTrophies: profile.trophies ?? null,
      highestTrophies: profile.highestTrophies ?? null,
      totalPrestigeLevel: profile.totalPrestigeLevel ?? null,
      threeVsThreeWins: profile["3vs3Victories"] ?? null,
      soloWins: profile.soloVictories ?? null,
      duoWins: profile.duoVictories ?? null,
      clubTag: profile.club?.tag ? profile.club.tag.replace(/^#/, "") : null,
      clubBadgeId: null,
      topBrawlers,
      peakBrawler: peakBrawler ? toBrawlerSummary(peakBrawler) : null,
      selectedBrawlerId: selectedBrawlerId ?? null,
      selectedBrawler: selectedBrawler ? toBrawlerSummary(selectedBrawler) : null,
      globalRankEstimate: null,
      globalPercentile: null,
    }
  } catch (error) {
    console.error(`Leaderboard player enrichment failed [${tag}]:`, error)
    return emptyPlayer(selectedBrawlerId)
  }
}

function emptyPlayer(selectedBrawlerId?: number | null): PlayerEnrichment {
  return {
    ...EMPTY_PLAYER,
    selectedBrawlerId: selectedBrawlerId ?? null,
  }
}

function toBrawlerSummary(brawler: PlayerBrawler): BrawlerSummary {
  return {
    id: brawler.id,
    name: brawler.name,
    trophies: brawler.trophies,
    highestTrophies: brawler.highestTrophies ?? null,
    rank: brawler.rank ?? null,
    power: brawler.power ?? null,
    prestigeLevel: brawler.prestigeLevel ?? null,
  }
}

async function fetchClubBadgeId(tag: string): Promise<number | null> {
  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 900 } })
    if (!response.ok) return null
    const club = (await response.json()) as ClubProfile
    return club.badgeId ?? null
  } catch (error) {
    console.error(`Leaderboard club badge enrichment failed [${tag}]:`, error)
    return null
  }
}

function formatPercentile(rank: number | null, total: number | null) {
  if (!rank || !total || rank > total) return null
  const percentile = (rank / total) * 100
  if (percentile < 0.01) return "<0.01%"
  if (percentile < 10) return `${percentile.toFixed(2)}%`
  if (percentile < 100) return `${percentile.toFixed(1)}%`
  return "100%"
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = []
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index])
    }
  })
  await Promise.all(workers)
  return results
}

async function fetchGlobalPlacements(trophyValues: number[]) {
  const url = cleanEnv(process.env.SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_KEY)
  const values = Array.from(new Set(trophyValues.filter(value => Number.isFinite(value))))
  const placements = new Map<number, { rank: number | null; percentile: string | null }>()
  if (!url || !key || !values.length) return placements

  try {
    const supabase = createClient(url, key)
    const { count: globalCount, error: countError } = await supabase
      .from("leaderboards")
      .select("player_tag", { count: "exact", head: true })
      .eq("region", "global")

    if (countError || !globalCount) return placements

    const entries = await mapWithConcurrency(values, 8, async trophies => {
      const { count, error } = await supabase
        .from("leaderboards")
        .select("player_tag", { count: "exact", head: true })
        .eq("region", "global")
        .gt("trophies", trophies)

      if (error) {
        return [trophies, { rank: null, percentile: null }] as const
      }

      const rank = (count ?? 0) + 1
      return [trophies, { rank, percentile: formatPercentile(rank, globalCount) }] as const
    })

    for (const [trophies, placement] of entries) {
      placements.set(trophies, placement)
    }
  } catch (error) {
    console.error("Leaderboard global placement estimate failed:", error)
  }

  return placements
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { tags?: unknown[]; brawlerId?: unknown } | null
  const tags = Array.from(new Set((body?.tags ?? []).map(cleanTag).filter(Boolean))).slice(0, 60) as string[]
  const brawlerId = typeof body?.brawlerId === "number" && Number.isFinite(body.brawlerId) ? body.brawlerId : null

  if (!tags.length) {
    return NextResponse.json({ players: {} })
  }

  const entries = await Promise.all(tags.map(async tag => [tag, await fetchPlayerEnrichment(tag, brawlerId)] as const))
  const globalPlacements = await fetchGlobalPlacements(
    entries
      .map(([, data]) => data.totalTrophies)
      .filter((value): value is number => typeof value === "number")
  )
  const clubTags = Array.from(new Set(entries.map(([, data]) => data.clubTag).filter(Boolean))) as string[]
  const clubEntries = await Promise.all(clubTags.map(async tag => [tag, await fetchClubBadgeId(tag)] as const))
  const clubBadges = Object.fromEntries(clubEntries)

  const players = Object.fromEntries(entries.map(([tag, data]) => [
    tag,
    {
      ...data,
      clubBadgeId: data.clubTag ? clubBadges[data.clubTag] ?? null : null,
      globalRankEstimate: typeof data.totalTrophies === "number"
        ? globalPlacements.get(data.totalTrophies)?.rank ?? null
        : null,
      globalPercentile: typeof data.totalTrophies === "number"
        ? globalPlacements.get(data.totalTrophies)?.percentile ?? null
        : null,
    },
  ]))

  const response = NextResponse.json({ players })
  response.headers.set("Cache-Control", "private, max-age=60")
  return response
}
