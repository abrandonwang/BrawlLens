import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch('https://api.brawlify.com/v1/brawlers', {
            next: { revalidate: 3600 }
        })
        if (!response.ok) {
            return NextResponse.json({ list: [] }, { status: 502 });
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ list: [] }, { status: 502 });
    }
}