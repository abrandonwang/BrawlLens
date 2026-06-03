import { NextResponse } from "next/server";
import { fetchPlayerResponse } from "@/lib/playerLookup";
import { sanitizePlayerTag } from "@/lib/validation";

const PLAYER_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";

function playerLookupMessage(status: number) {
    if (status === 403) {
        return "Player lookup is blocked by the upstream API. Configure PLAYER_API_URL for production or use an API key valid for the deployed server."
    }
    if (status === 404) return "Player not found"
    return "Player lookup failed"
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const rawTag = searchParams.get('tag')
    const tag = rawTag ? sanitizePlayerTag(rawTag) : null

    if (!tag) {
        return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }

    try {
        const response = await fetchPlayerResponse(tag, { next: { revalidate: 60 } })
        if (!response.ok) {
            return NextResponse.json({ error: playerLookupMessage(response.status) }, { status: response.status });
        }
        const data = await response.json()
        const res = NextResponse.json(data)
        res.headers.set("Cache-Control", PLAYER_CACHE_CONTROL)
        return res
    } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reach player API"
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
