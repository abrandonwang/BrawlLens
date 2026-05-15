import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { setAuthSessionCookies } from "@/lib/auth"

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
  setAuthSessionCookies(response, {
    accessToken: payload.accessToken,
    refreshToken: typeof payload.refreshToken === "string" ? payload.refreshToken : undefined,
    expiresAt: typeof payload.expiresAt === "number" ? payload.expiresAt : undefined,
  })

  return response
}
