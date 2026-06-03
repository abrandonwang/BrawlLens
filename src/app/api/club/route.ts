import { NextResponse } from "next/server"
import { fetchClubResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

const CLUB_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=900"

function clubLookupMessage(status: number) {
  if (status === 403) {
    return "Club lookup is blocked by the upstream API. Configure a Brawl Stars API key valid for this server."
  }
  if (status === 404) return "Club not found"
  return "Club lookup failed"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawTag = searchParams.get("tag")
  const tag = rawTag ? sanitizePlayerTag(rawTag) : null

  if (!tag) {
    return NextResponse.json({ error: "Invalid tag" }, { status: 400 })
  }

  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 300 } })
    if (!response.ok) {
      return NextResponse.json({ error: clubLookupMessage(response.status) }, { status: response.status })
    }

    const data = await response.json()
    const res = NextResponse.json(data)
    res.headers.set("Cache-Control", CLUB_CACHE_CONTROL)
    return res
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach club API"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
