export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import BrawlerLeaderboardClient from "./BrawlerLeaderboardClient"

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { name: string; color: string }
}

const SHELLY_ID = 16000000

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

  const [brawlerRes, leaderboardRes] = await Promise.all([
    fetch("https://api.brawlify.com/v1/brawlers", { next: { revalidate: 3600 } }),
    supabase
      .from("brawler_leaderboards")
      .select("rank, player_tag, player_name, trophies, club_name, brawler_name")
      .eq("brawler_id", brawlerId)
      .order("rank", { ascending: true })
      .limit(200),
  ])

  const brawlerData = await brawlerRes.json()
  const brawlers: Brawler[] = brawlerData.list ?? []
  const activeBrawler = brawlers.find(b => b.id === brawlerId) ?? null

  return (
    <BrawlerLeaderboardClient
      brawlers={brawlers}
      data={leaderboardRes.data ?? []}
      activeBrawler={activeBrawler}
    />
  )
}
