import { NextResponse } from "next/server"
import { getRequestUserWithRefresh, setAuthSessionCookies } from "@/lib/auth"

export async function GET(request: Request) {
  const { user, session } = await getRequestUserWithRefresh(request)
  if (!user) {
    return NextResponse.json({ user: null })
  }

  const response = NextResponse.json({
    user,
    session: session
      ? {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
        }
      : null,
  })
  if (session) setAuthSessionCookies(response, session)
  return response
}
