import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { authRedirectUrl } from "@/lib/auth"

const providers = new Set(["google", "github", "apple"])
type OAuthProvider = "google" | "github" | "apple"

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  const provider = body && typeof body === "object" ? (body as Record<string, unknown>).provider : null

  if (typeof provider !== "string" || !providers.has(provider)) {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 })
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 })
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: {
      redirectTo: authRedirectUrl(request),
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: "oauth_failed" }, { status: 502 })
  }

  return NextResponse.json({ url: data.url })
}
