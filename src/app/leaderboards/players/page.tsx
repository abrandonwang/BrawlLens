export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import LeaderboardsClient from "../LeaderboardsClient"
import { fetchPlayerBattleLogResponse, fetchPlayerResponse } from "@/lib/playerLookup"

export const metadata: Metadata = {
  title: "Player Leaderboards | BrawlLens",
  description: "Top Brawl Stars players across global and regional leaderboards. Open any profile for detailed stats.",
  openGraph: {
    title: "Player Leaderboards | BrawlLens",
    description: "Top players across global and regional leaderboards.",
    type: "website",
  },
}

const REGIONS = [
  { code: "global", label: "Global" },
  { code: "US", label: "United States" },
  { code: "KR", label: "Korea" },
  { code: "BR", label: "Brazil" },
  { code: "DE", label: "Germany" },
  { code: "JP", label: "Japan" },
]

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  updated_at: string
}

interface PlayerProfile {
  icon?: { id?: number }
  "3vs3Victories"?: number
  soloVictories?: number
  club?: { tag?: string; name?: string }
  brawlers?: { id: number; name: string; trophies: number }[]
}

interface BattleLog {
  items?: { battle?: { result?: string } }[]
}

export interface TopPlayerEnrichment {
  iconId: number | null
  recentGames: number | null
  recentWinRate: number | null
  threeVsThreeWins: number | null
  soloWins: number | null
  clubTag: string | null
  clubBadgeId: number | null
  topBrawlers: { id: number; name: string }[]
}

async function fetchLeaderboard(region: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { data, error } = await supabase
    .from("leaderboards")
    .select("rank, player_tag, player_name, trophies, club_name, updated_at")
    .eq("region", region)
    .order("rank", { ascending: true })
    .limit(200)

  if (error) {
    console.error(`Leaderboard fetch error [${region}]:`, error.message)
    return []
  }
  return data || []
}

function cleanTag(tag: string) {
  return tag.replace(/^#/, "")
}

async function fetchTopPlayerEnrichment(player: Player): Promise<TopPlayerEnrichment> {
  const tag = cleanTag(player.player_tag)
  const fallback: TopPlayerEnrichment = {
    iconId: null,
    recentGames: null,
    recentWinRate: null,
    threeVsThreeWins: null,
    soloWins: null,
    clubTag: null,
    clubBadgeId: null,
    topBrawlers: [],
  }

  try {
    const [profileResponse, battleLogResponse] = await Promise.allSettled([
      fetchPlayerResponse(tag, { next: { revalidate: 300 } }),
      fetchPlayerBattleLogResponse(tag, { next: { revalidate: 120 } }),
    ])

    let profile: PlayerProfile | null = null
    if (profileResponse.status === "fulfilled" && profileResponse.value.ok) {
      profile = await profileResponse.value.json()
    }

    let battleLog: BattleLog | null = null
    if (battleLogResponse.status === "fulfilled" && battleLogResponse.value.ok) {
      battleLog = await battleLogResponse.value.json()
    }

    const battles = battleLog?.items ?? []
    const decided = battles.filter(item => {
      const result = item.battle?.result
      return result === "victory" || result === "defeat" || result === "draw"
    })
    const wins = decided.filter(item => item.battle?.result === "victory").length
    const recentWinRate = decided.length ? Math.round((wins / decided.length) * 100) : null

    return {
      iconId: profile?.icon?.id ?? null,
      recentGames: battles.length || null,
      recentWinRate,
      threeVsThreeWins: profile?.["3vs3Victories"] ?? null,
      soloWins: profile?.soloVictories ?? null,
      clubTag: profile?.club?.tag ? profile.club.tag.replace(/^#/, "") : null,
      clubBadgeId: null,
      topBrawlers: [...(profile?.brawlers ?? [])]
        .sort((a, b) => b.trophies - a.trophies)
        .slice(0, 4)
        .map(brawler => ({ id: brawler.id, name: brawler.name })),
    }
  } catch (error) {
    console.error(`Top player enrichment failed [${player.player_tag}]:`, error)
    return fallback
  }
}

export default async function PlayersLeaderboardPage() {
  const allData = await Promise.all(
    REGIONS.map(async (r) => ({ ...r, players: await fetchLeaderboard(r.code) }))
  )
  const topPlayers = allData.flatMap(region =>
    region.players.slice(0, 3).map(player => ({ region: region.code, player }))
  )
  const enrichedPairs = await Promise.all(topPlayers.map(async ({ region, player }) => ({
    region,
    tag: cleanTag(player.player_tag),
    data: await fetchTopPlayerEnrichment(player),
  })))
  const topPlayerEnrichment = enrichedPairs.reduce<Record<string, Record<string, TopPlayerEnrichment>>>((acc, item) => {
    acc[item.region] ??= {}
    acc[item.region][item.tag] = item.data
    return acc
  }, {})

  return <LeaderboardsClient allData={allData} topPlayerEnrichment={topPlayerEnrichment} />
}
