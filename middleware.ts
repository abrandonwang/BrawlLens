import { NextResponse, type NextRequest } from "next/server"
import { AUTH_ACCESS_COOKIE } from "@/lib/authCookies"

export function middleware(request: NextRequest) {
  if (request.cookies.has(AUTH_ACCESS_COOKIE)) return NextResponse.next()

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/account/:path*"],
}
