import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS = 30 // 30 requests per minute for general API
const MAX_CHAT_REQUESTS = 10 // 10 chat requests per minute (more expensive)

export function middleware(request: NextRequest) {
  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "anonymous"
  const now = Date.now()

  // Stricter limit for chat endpoint (expensive AI calls)
  const isChatEndpoint = request.nextUrl.pathname === "/api/chat"
  const maxRequests = isChatEndpoint ? MAX_CHAT_REQUESTS : MAX_REQUESTS

  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
  } else if (record.count >= maxRequests) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  } else {
    record.count++
  }

  // Add security headers to API responses
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")

  return response
}

export const config = {
  matcher: "/api/:path*"
}
