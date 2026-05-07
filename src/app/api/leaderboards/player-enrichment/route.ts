import { NextResponse } from "next/server"
import { fetchClubResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const dynamic = "force-dynamic"

interface PlayerProfile {
  icon?: { id?: number }
  trophies?: number
  "3vs3Victories"?: number
  soloVictories?: number
  club?: { tag?: string; name?: string }
  brawlers?: { id: number; name: string; trophies: number }[]
}

interface ClubProfile {
  badgeId?: number
}

interface PlayerEnrichment {
  iconId: number | null
  totalTrophies: number | null
  threeVsThreeWins: number | null
  soloWins: number | null
  clubTag: string | null
  clubBadgeId: number | null
  topBrawlers: { id: number; name: string }[]
}

const EMPTY_PLAYER: PlayerEnrichment = {
  iconId: null,
  totalTrophies: null,
  threeVsThreeWins: null,
  soloWins: null,
  clubTag: null,
  clubBadgeId: null,
  topBrawlers: [],
}

function cleanTag(raw: unknown) {
  return typeof raw === "string" ? sanitizePlayerTag(raw) : null
}

async function fetchPlayerEnrichment(tag: string): Promise<PlayerEnrichment> {
  try {
    const response = await fetchPlayerResponse(tag, { next: { revalidate: 300 } })
    if (!response.ok) return EMPTY_PLAYER

    const profile = (await response.json()) as PlayerProfile
    return {
      iconId: profile.icon?.id ?? null,
      totalTrophies: profile.trophies ?? null,
      threeVsThreeWins: profile["3vs3Victories"] ?? null,
      soloWins: profile.soloVictories ?? null,
      clubTag: profile.club?.tag ? profile.club.tag.replace(/^#/, "") : null,
      clubBadgeId: null,
      topBrawlers: [...(profile.brawlers ?? [])]
        .sort((a, b) => b.trophies - a.trophies)
        .slice(0, 4)
        .map(brawler => ({ id: brawler.id, name: brawler.name })),
    }
  } catch (error) {
    console.error(`Leaderboard player enrichment failed [${tag}]:`, error)
    return EMPTY_PLAYER
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { tags?: unknown[] } | null
  const tags = Array.from(new Set((body?.tags ?? []).map(cleanTag).filter(Boolean))).slice(0, 60) as string[]

  if (!tags.length) {
    return NextResponse.json({ players: {} })
  }

  const entries = await Promise.all(tags.map(async tag => [tag, await fetchPlayerEnrichment(tag)] as const))
  const clubTags = Array.from(new Set(entries.map(([, data]) => data.clubTag).filter(Boolean))) as string[]
  const clubEntries = await Promise.all(clubTags.map(async tag => [tag, await fetchClubBadgeId(tag)] as const))
  const clubBadges = Object.fromEntries(clubEntries)

  const players = Object.fromEntries(entries.map(([tag, data]) => [
    tag,
    {
      ...data,
      clubBadgeId: data.clubTag ? clubBadges[data.clubTag] ?? null : null,
    },
  ]))

  const response = NextResponse.json({ players })
  response.headers.set("Cache-Control", "private, max-age=60")
  return response
}
