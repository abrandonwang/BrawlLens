import { NextResponse } from "next/server"
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
}

const EMPTY_CLUB: ClubEnrichment = {
  badgeId: null,
  topMember: null,
  totalPrestige: null,
  prestigeCoverage: 0,
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
}

interface PlayerProfile {
  totalPrestigeLevel?: number
}

function cleanTag(raw: unknown) {
  return typeof raw === "string" ? sanitizePlayerTag(raw) : null
}

async function fetchClubEnrichment(tag: string): Promise<ClubEnrichment> {
  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 900 } })
    if (!response.ok) return EMPTY_CLUB

    const club = (await response.json()) as ClubProfile
    const members = [...(club.members ?? [])].sort((a, b) => (b.trophies ?? 0) - (a.trophies ?? 0))
    const topMember = members[0]
    const memberPrestiges = await mapWithConcurrency(members, 5, fetchMemberPrestige)
    const prestigeValues = memberPrestiges.filter((value): value is number => typeof value === "number")

    return {
      badgeId: club.badgeId ?? null,
      topMember: topMember ? {
        tag: topMember.tag ? topMember.tag.replace(/^#/, "") : null,
        name: topMember.name ?? "Unknown",
        trophies: topMember.trophies ?? null,
        role: topMember.role ?? null,
      } : null,
      totalPrestige: prestigeValues.length ? prestigeValues.reduce((sum, value) => sum + value, 0) : null,
      prestigeCoverage: prestigeValues.length,
    }
  } catch (error) {
    console.error(`Leaderboard club enrichment failed [${tag}]:`, error)
    return EMPTY_CLUB
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

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { tags?: unknown[] } | null
  const tags = Array.from(new Set((body?.tags ?? []).map(cleanTag).filter(Boolean))).slice(0, 60) as string[]

  if (!tags.length) {
    return NextResponse.json({ clubs: {} })
  }

  const entries = await mapWithConcurrency(tags, 4, async tag => [tag, await fetchClubEnrichment(tag)] as const)
  const response = NextResponse.json({ clubs: Object.fromEntries(entries) })
  response.headers.set("Cache-Control", "private, max-age=60")
  return response
}
