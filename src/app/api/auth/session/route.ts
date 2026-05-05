import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/lib/authCookies"

export const runtime = "edge"

interface SessionPayload {
  accessToken?: unknown
  refreshToken?: unknown
  expiresAt?: unknown
}

export async function POST(request: Request) {
  let payload: SessionPayload
  try {
    payload = await request.json() as SessionPayload
  } catch {
    return NextResponse.json({ error: "Invalid session payload." }, { status: 400 })
  }

  if (typeof payload.accessToken !== "string" || !payload.accessToken) {
    return NextResponse.json({ error: "Missing access token." }, { status: 400 })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "Auth is not configured." }, { status: 500 })
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(payload.accessToken)
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  const maxAge = typeof payload.expiresAt === "number"
    ? Math.max(0, payload.expiresAt - Math.floor(Date.now() / 1000))
    : 60 * 60 * 24 * 7

  response.cookies.set(AUTH_ACCESS_COOKIE, payload.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  })

  if (typeof payload.refreshToken === "string" && payload.refreshToken) {
    response.cookies.set(AUTH_REFRESH_COOKIE, payload.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  return response
}
