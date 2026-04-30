import { NextResponse } from "next/server"
import { parsePositiveInt } from "@/lib/validation"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = parsePositiveInt(searchParams.get("id"), { max: 99_999_999 })
    if (id === null) return new NextResponse(null, { status: 400 })

    const res = await fetch(`https://cdn.brawlify.com/profile-icons/regular/${id}.png`)
    if (!res.ok) return new NextResponse(null, { status: 404 })

    const buffer = await res.arrayBuffer()
    return new NextResponse(buffer, {
        headers: {
            "Content-Type": res.headers.get("Content-Type") || "image/png",
            "Cache-Control": "public, max-age=86400",
        },
    })
}
