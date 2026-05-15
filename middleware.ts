import { NextResponse, type NextRequest } from "next/server"
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/lib/authCookies"

export function middleware(request: NextRequest) {
  if (request.cookies.has(AUTH_ACCESS_COOKIE) || request.cookies.has(AUTH_REFRESH_COOKIE)) return NextResponse.next()

  const loginUrl = new URL("/", request.url)
  loginUrl.searchParams.set("auth", "login")
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/account/:path*"],
}
