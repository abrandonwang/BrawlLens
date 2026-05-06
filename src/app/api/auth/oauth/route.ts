import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "oauth_disabled" }, { status: 410 })
}
