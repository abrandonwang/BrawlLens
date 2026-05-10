export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import ClubsClient from "./ClubsClient"
import { FALLBACK_LEADERBOARD_REGIONS, leaderboardRegionsFromCodes } from "@/lib/leaderboardRegions"

export const metadata: Metadata = {
  title: "Club Leaderboards - BrawlLens",
  description: "Top Brawl Stars clubs ranked by trophy total with member counts across global and regional leaderboards.",
  openGraph: {
    title: "Club Leaderboards - BrawlLens",
    description: "Top clubs ranked by trophies and members.",
    type: "website",
  },
}

async function fetchClubLeaderboard(region: string) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { data, error } = await supabase
    .from("club_leaderboards")
    .select("rank, club_tag, club_name, trophies, member_count, updated_at")
    .eq("region", region)
    .order("rank", { ascending: true })
    .limit(200)

  if (error) {
    console.error(`Club leaderboard fetch error [${region}]:`, error.message)
    return []
  }
  return data || []
}

async function fetchClubLeaderboardRegions() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
  const { data, error } = await supabase
    .from("club_leaderboards")
    .select("region")
    .eq("rank", 1)
    .limit(300)

  if (error) {
    console.error("Club leaderboard region fetch error:", error.message)
    return FALLBACK_LEADERBOARD_REGIONS
  }

  return leaderboardRegionsFromCodes((data ?? []).map(row => String(row.region)))
}

export default async function ClubsLeaderboardPage() {
  const regions = await fetchClubLeaderboardRegions()
  const allData = await Promise.all(
    regions.map(async (r) => ({ ...r, clubs: await fetchClubLeaderboard(r.code) }))
  )
  return <ClubsClient allData={allData} />
}
