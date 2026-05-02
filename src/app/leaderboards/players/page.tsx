export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import LeaderboardsClient from "../LeaderboardsClient"

export const metadata: Metadata = {
  title: "Player Leaderboards | BrawlLens",
  description: "Top Brawl Stars players ranked by trophies across global and regional leaderboards. Open any profile for detailed stats.",
  openGraph: {
    title: "Player Leaderboards | BrawlLens",
    description: "Top players ranked by trophies. Global and regional.",
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

export default async function PlayersLeaderboardPage() {
  const allData = await Promise.all(
    REGIONS.map(async (r) => ({ ...r, players: await fetchLeaderboard(r.code) }))
  )
  return <LeaderboardsClient allData={allData} />
}
