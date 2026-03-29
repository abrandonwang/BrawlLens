import { NextResponse } from "next/server";

const PLAYER_API_URL = process.env.PLAYER_API_URL || "http://165.227.206.51:3000";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    if (!tag) {
        return NextResponse.json({ error: "Missing tag" }, { status: 400 });
    }

    try {
        const response = await fetch(`${PLAYER_API_URL}/player/${tag}`)
        if (!response.ok) {
            return NextResponse.json({ error: "Player not found" }, { status: response.status });
        }
        const data = await response.json()
        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: "Failed to reach player API" }, { status: 502 });
    }
}
