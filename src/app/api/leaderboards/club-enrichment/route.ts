import { NextResponse } from "next/server"
import { fetchClubResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const dynamic = "force-dynamic"

interface ClubProfile {
  badgeId?: number
}

interface ClubEnrichment {
  badgeId: number | null
}

const EMPTY_CLUB: ClubEnrichment = {
  badgeId: null,
}

function cleanTag(raw: unknown) {
  return typeof raw === "string" ? sanitizePlayerTag(raw) : null
}

async function fetchClubEnrichment(tag: string): Promise<ClubEnrichment> {
  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 900 } })
    if (!response.ok) return EMPTY_CLUB

    const club = (await response.json()) as ClubProfile
    return {
      badgeId: club.badgeId ?? null,
    }
  } catch (error) {
    console.error(`Leaderboard club enrichment failed [${tag}]:`, error)
    return EMPTY_CLUB
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { tags?: unknown[] } | null
  const tags = Array.from(new Set((body?.tags ?? []).map(cleanTag).filter(Boolean))).slice(0, 60) as string[]

  if (!tags.length) {
    return NextResponse.json({ clubs: {} })
  }

  const entries = await Promise.all(tags.map(async tag => [tag, await fetchClubEnrichment(tag)] as const))
  const response = NextResponse.json({ clubs: Object.fromEntries(entries) })
  response.headers.set("Cache-Control", "private, max-age=60")
  return response
}
