import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { leaderboardRegionLabel, leaderboardRegionsFromCodes } from "@/lib/leaderboardRegions"
import { stripTagPrefix } from "@/lib/leaderboardUtils"
import { fetchPlayerResponse } from "@/lib/playerLookup"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 5, 1), 20)
  const withIcons = url.searchParams.get("icons") === "1"
  const requestedRegions = url.searchParams.get("regions")
    ?.split(",")
    .map(region => region.trim())
    .filter(Boolean)

  const { data: regionRows } = await supabase
    .from("leaderboards")
    .select("region")
    .eq("rank", 1)
    .limit(300)

  const discoveredRegions = leaderboardRegionsFromCodes((regionRows ?? []).map(row => String(row.region)))
  const regions = requestedRegions?.length
    ? requestedRegions.map(code => ({ code, label: leaderboardRegionLabel(code) }))
    : discoveredRegions

  const results = await Promise.all(
    regions.map(async region => {
      const { data, error } = await supabase
        .from("leaderboards")
        .select("rank, player_tag, player_name, trophies, club_name")
        .eq("region", region.code)
        .order("rank", { ascending: true })
        .limit(limit)
      if (error) return { ...region, players: [] }
      const players = withIcons ? await enrichPlayerIcons(data ?? []) : data ?? []
      return { ...region, players }
    })
  )

  const res = NextResponse.json({ regions: results })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}

type LeaderboardPlayerRow = {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
}

type PlayerProfile = {
  icon?: { id?: number }
}

async function enrichPlayerIcons(players: LeaderboardPlayerRow[]) {
  return Promise.all(players.map(async player => {
    try {
      const tag = stripTagPrefix(player.player_tag)
      const response = await fetchPlayerResponse(tag, { next: { revalidate: 300 } })
      if (!response.ok) return { ...player, iconId: null }
      const profile = await response.json() as PlayerProfile
      return { ...player, iconId: profile.icon?.id ?? null }
    } catch {
      return { ...player, iconId: null }
    }
  }))
}
