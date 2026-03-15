import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    const response = await fetch(`https://api.brawlstars.com/v1/players/%23${tag}`, {
        headers: {
            "Authorization": `Bearer ${process.env.BRAWL_API_KEY}`
        }
    })
    const data = await response.json()
    console.log("Status:", response.status, "Data:", JSON.stringify(data))
    return NextResponse.json(data)
}