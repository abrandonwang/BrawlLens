import { NextResponse } from "next/server"
import { fetchClubResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

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
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach club API"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
