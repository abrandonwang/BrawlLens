import { NextResponse } from "next/server";

export async function GET() {
    const response = await fetch('https://api.brawlstars.com/v1/brawlers', {
        headers: {
            "Authorization": `Bearer ${process.env.BRAWL_API_KEY}`
        }
    })

    const data = await response.json();

    return NextResponse.json(data);
}