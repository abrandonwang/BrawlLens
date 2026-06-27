import { NextResponse } from "next/server"
import { memoCache } from "@/lib/memoCache"
import { fetchClubResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const dynamic = "force-dynamic"

interface ClubProfile {
  badgeId?: number
  members?: ClubMember[]
}

interface ClubEnrichment {
  badgeId: number | null
  topMember: ClubMemberSummary | null
  totalPrestige: number | null
  prestigeCoverage: number
  prestigeLoaded: boolean
}

const EMPTY_CLUB: ClubEnrichment = {
  badgeId: null,
  topMember: null,
  totalPrestige: null,
  prestigeCoverage: 0,
  prestigeLoaded: false,
}

interface ClubMember {
  tag?: string
  name?: string
  trophies?: number
  role?: string
}

interface ClubMemberSummary {
  tag: string | null
  name: string
  trophies: number | null
  role: string | null
  iconId: number | null
}

interface PlayerProfile {
  totalPrestigeLevel?: number
  icon?: { id?: number }
}

function cleanTag(raw: unknown) {
  return typeof raw === "string" ? sanitizePlayerTag(raw) : null
}

async function fetchClubEnrichment(tag: string, includePrestige: boolean): Promise<ClubEnrichment> {
  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 900 } })
    if (!response.ok) return { ...EMPTY_CLUB, prestigeLoaded: includePrestige }

    const club = (await response.json()) as ClubProfile
    const members = [...(club.members ?? [])].sort((a, b) => (b.trophies ?? 0) - (a.trophies ?? 0))
    const topMember = members[0]
    const memberPrestiges = includePrestige ? await mapWithConcurrency(members, 5, fetchMemberPrestige) : []
    const prestigeValues = memberPrestiges.filter((value): value is number => typeof value === "number")

    const topMemberTag = topMember?.tag ? topMember.tag.replace(/^#/, "") : null
    const topMemberIconId = topMemberTag ? await fetchMemberIconId(topMemberTag) : null

    return {
      badgeId: club.badgeId ?? null,
      topMember: topMember ? {
        tag: topMemberTag,
        name: topMember.name ?? "Unknown",
        trophies: topMember.trophies ?? null,
        role: topMember.role ?? null,
        iconId: topMemberIconId,
      } : null,
      totalPrestige: prestigeValues.length ? prestigeValues.reduce((sum, value) => sum + value, 0) : null,
      prestigeCoverage: prestigeValues.length,
      prestigeLoaded: includePrestige,
    }
  } catch (error) {
    console.error(`Leaderboard club enrichment failed [${tag}]:`, error)
    return { ...EMPTY_CLUB, prestigeLoaded: includePrestige }
  }
}

async function fetchMemberPrestige(member: ClubMember): Promise<number | null> {
  const tag = typeof member.tag === "string" ? sanitizePlayerTag(member.tag) : null
  if (!tag) return null

  try {
    const response = await fetchPlayerResponse(tag, { next: { revalidate: 900 } })
    if (!response.ok) return null
    const profile = (await response.json()) as PlayerProfile
    return typeof profile.totalPrestigeLevel === "number" ? profile.totalPrestigeLevel : null
  } catch {
    return null
  }
}

async function fetchMemberIconId(tag: string): Promise<number | null> {
  const clean = sanitizePlayerTag(tag)
  if (!clean) return null
  try {
    const response = await fetchPlayerResponse(clean, { next: { revalidate: 900 } })
    if (!response.ok) return null
    const profile = (await response.json()) as PlayerProfile
    return typeof profile.icon?.id === "number" ? profile.icon.id : null
  } catch {
    return null
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(items[index])
    }
  }))

  return results
}

const fetchCachedClubSummaryEnrichment = memoCache(
  (tag: string) => fetchClubEnrichment(tag, false),
  ["leaderboard-club-summary-enrichment-v1"],
  { revalidate: 900, maxEntries: 5000 },
)

const fetchCachedClubPrestigeEnrichment = memoCache(
  (tag: string) => fetchClubEnrichment(tag, true),
  ["leaderboard-club-prestige-enrichment-v1"],
  { revalidate: 300, maxEntries: 5000 },
)

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { tags?: unknown[]; includePrestige?: unknown } | null
  const tags = Array.from(new Set((body?.tags ?? []).map(cleanTag).filter(Boolean))).slice(0, 60) as string[]
  const includePrestige = body?.includePrestige === true

  if (!tags.length) {
    return NextResponse.json({ clubs: {} })
  }

  const fetchEnrichment = includePrestige ? fetchCachedClubPrestigeEnrichment : fetchCachedClubSummaryEnrichment
  const entries = await mapWithConcurrency(tags, includePrestige ? 2 : 8, async tag => [tag, await fetchEnrichment(tag)] as const)
  const response = NextResponse.json({ clubs: Object.fromEntries(entries) })
  response.headers.set("Cache-Control", includePrestige ? "private, max-age=60" : "private, max-age=300, stale-while-revalidate=900")
  return response
}
