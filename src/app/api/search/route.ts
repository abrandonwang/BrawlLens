import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cleanEnv } from "@/lib/env"
import { stripTagPrefix } from "@/lib/leaderboardUtils"
import { fetchClubResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const dynamic = "force-dynamic"

interface PlayerProfile {
  name?: string
  tag?: string
  trophies?: number
  icon?: { id?: number }
  club?: { name?: string; tag?: string }
}

interface ClubProfile {
  name?: string
  tag?: string
  trophies?: number
  badgeId?: number
  members?: unknown[]
}

interface PlayerSearchRow {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
}

interface ClubSearchRow {
  rank: number
  club_tag: string
  club_name: string
  trophies: number
  member_count: number | null
}

function cleanQuery(value: string | null) {
  return (value ?? "").trim().slice(0, 80)
}

function safeLikeTerm(value: string) {
  return value
    .replace(/[%,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48)
}

function displayTag(value: string | undefined, fallback: string) {
  return stripTagPrefix(value ?? fallback).toUpperCase()
}

async function resolvePlayerTag(tag: string) {
  try {
    const response = await fetchPlayerResponse(tag, { next: { revalidate: 120 } })
    if (!response.ok) return null
    const profile = (await response.json()) as PlayerProfile
    return {
      tag: displayTag(profile.tag, tag),
      name: profile.name ?? `#${tag}`,
      trophies: typeof profile.trophies === "number" ? profile.trophies : null,
      iconId: profile.icon?.id ?? null,
      clubName: profile.club?.name ?? null,
    }
  } catch {
    return null
  }
}

async function resolveClubTag(tag: string) {
  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 180 } })
    if (!response.ok) return null
    const club = (await response.json()) as ClubProfile
    return {
      tag: displayTag(club.tag, tag),
      name: club.name ?? `#${tag}`,
      trophies: typeof club.trophies === "number" ? club.trophies : null,
      badgeId: club.badgeId ?? null,
      memberCount: Array.isArray(club.members) ? club.members.length : null,
    }
  } catch {
    return null
  }
}

function supabaseClient() {
  const url = cleanEnv(process.env.SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_KEY)
  if (!url || !key) return null
  return createClient(url, key)
}

async function searchLeaderboardPlayers(query: string) {
  const supabase = supabaseClient()
  const term = safeLikeTerm(query)
  if (!supabase || term.length < 2) return []

  const pattern = `%${term}%`
  const { data, error } = await supabase
    .from("leaderboards")
    .select("rank, player_tag, player_name, trophies, club_name")
    .eq("region", "global")
    .or(`player_name.ilike.${pattern},player_tag.ilike.${pattern},club_name.ilike.${pattern}`)
    .order("rank", { ascending: true })
    .limit(7)

  if (error) return []

  const seen = new Set<string>()
  return ((data ?? []) as PlayerSearchRow[]).filter(row => {
    const key = displayTag(row.player_tag, row.player_tag)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 5)
}

async function searchLeaderboardClubs(query: string) {
  const supabase = supabaseClient()
  const term = safeLikeTerm(query)
  if (!supabase || term.length < 2) return []

  const pattern = `%${term}%`
  const { data, error } = await supabase
    .from("club_leaderboards")
    .select("rank, club_tag, club_name, trophies, member_count")
    .eq("region", "global")
    .or(`club_name.ilike.${pattern},club_tag.ilike.${pattern}`)
    .order("rank", { ascending: true })
    .limit(5)

  if (error) return []
  return (data ?? []) as ClubSearchRow[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = cleanQuery(searchParams.get("q"))
  if (!query) {
    return NextResponse.json({ query: "", tag: null, tagMatches: { player: null, club: null }, players: [], clubs: [] })
  }

  const tag = sanitizePlayerTag(query)
  const [tagPlayer, tagClub, players, clubs] = await Promise.all([
    tag ? resolvePlayerTag(tag) : Promise.resolve(null),
    tag ? resolveClubTag(tag) : Promise.resolve(null),
    searchLeaderboardPlayers(query),
    searchLeaderboardClubs(query),
  ])

  return NextResponse.json({
    query,
    tag,
    tagMatches: {
      player: tagPlayer,
      club: tagClub,
    },
    players,
    clubs,
  })
}
