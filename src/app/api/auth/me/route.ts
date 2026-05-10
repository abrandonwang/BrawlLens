import { NextResponse } from "next/server"
import { getRequestUser } from "@/lib/auth"

export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({ user })
}
