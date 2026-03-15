import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')

    const ipRes = await fetch("https://api.ipify.org?format=json")
    const { ip: serverIp } = await ipRes.json()
    console.log("Outbound IP:", serverIp)

    const response = await fetch(`https://api.brawlstars.com/v1/players/%23${tag}`, {
        headers: {
            "Authorization": `Bearer ${process.env.BRAWL_API_KEY}`
        }
    })
    const data = await response.json()
    return NextResponse.json(data)
}