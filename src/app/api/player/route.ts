import { NextResponse } from "next/server";
import { fetchPlayerResponse } from "@/lib/playerLookup";
import { sanitizePlayerTag } from "@/lib/validation";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const rawTag = searchParams.get('tag')
    const tag = rawTag ? sanitizePlayerTag(rawTag) : null

    if (!tag) {
        return NextResponse.json({ error: "Invalid tag" }, { status: 400 });
    }

    try {
        const response = await fetchPlayerResponse(tag)
        if (!response.ok) {
            return NextResponse.json({ error: "Player not found" }, { status: response.status });
        }
        const data = await response.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: "Failed to reach player API" }, { status: 502 });
    }
}
