export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import BrawlerLeaderboardClient from "./BrawlerLeaderboardClient"

export const metadata: Metadata = {
  title: "Brawler Trophy Leaderboards - BrawlLens",
  description: "Top trophy holders for every Brawl Stars brawler. Pick a brawler to see who is leading the global trophy race.",
  openGraph: {
    title: "Brawler Leaderboards - BrawlLens",
    description: "Top trophy holders for every brawler.",
    type: "website",
  },
}

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { name: string; color: string }
}

const SHELLY_ID = 16000000
const FALLBACK_RARITY = { name: "Starting Brawler", color: "#9ee5ff" }

interface BrawlerLeaderboardRow {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  brawler_name: string
  world_rank: number | null
  total_trophies: number | null
}

interface TrophyLeaderboardRow {
  rank: number
  player_tag: string
  trophies: number
}

async function fetchBrawlers(): Promise<Brawler[]> {
  try {
    const response = await fetch("https://api.brawlify.com/v1/brawlers", { next: { revalidate: 3600 } })
    if (!response.ok) return []
    const data = await response.json() as { list?: Brawler[] }
    return data.list ?? []
  } catch (error) {
    console.error("Brawler list fetch failed:", error)
    return []
  }
}

function playerKey(tag: string) {
  return tag.replace(/^#/, "").toUpperCase()
}

export default async function BrawlerLeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ b?: string }>
}) {
  const { b } = await searchParams
  const brawlerId = parseInt(b ?? String(SHELLY_ID)) || SHELLY_ID

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const [brawlers, leaderboardRes] = await Promise.all([
    fetchBrawlers(),
    supabase
      .from("brawler_leaderboards")
      .select("rank, player_tag, player_name, trophies, club_name, brawler_name")
      .eq("brawler_id", brawlerId)
      .order("rank", { ascending: true })
      .limit(200),
  ])

  const leaderboardRows = leaderboardRes.data ?? []
  const tags = leaderboardRows.map(row => row.player_tag).filter(Boolean)
  const trophyRankRes = tags.length
    ? await supabase
        .from("leaderboards")
        .select("rank, player_tag, trophies")
        .eq("region", "global")
        .in("player_tag", tags)
    : { data: [] as TrophyLeaderboardRow[] | null }
  const trophyRanks = new Map((trophyRankRes.data ?? []).map(row => [
    playerKey(row.player_tag),
    { rank: row.rank, trophies: row.trophies },
  ]))
  const data = leaderboardRows.map(row => {
    const trophyRank = trophyRanks.get(playerKey(row.player_tag))
    return {
      ...row,
      world_rank: trophyRank?.rank ?? null,
      total_trophies: trophyRank?.trophies ?? null,
    } as BrawlerLeaderboardRow
  })
  const fallbackName = data[0]?.brawler_name ?? "Shelly"
  const activeBrawler = brawlers.find(b => b.id === brawlerId) ?? {
    id: brawlerId,
    name: fallbackName,
    imageUrl2: "",
    rarity: FALLBACK_RARITY,
  }

  return (
    <BrawlerLeaderboardClient
      brawlers={brawlers}
      data={data}
      activeBrawler={activeBrawler}
    />
  )
}
