import { createClient } from "@supabase/supabase-js"
import {
  normalizeSubscriptionStatus,
  normalizeSubscriptionTier,
  type SubscriptionStatus,
  type SubscriptionTier,
  type PremiumUser,
} from "@/lib/premium"
import { AUTH_ACCESS_COOKIE } from "@/lib/authCookies"

type Metadata = Record<string, unknown>

interface AccountProfileRow {
  role: string | null
  display_name: string | null
}

interface AccountSubscriptionRow {
  tier: string | null
  status: string | null
  provider: string | null
  current_period_end: string | null
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}

export function requestAuthToken(request: Request): string | null {
  return bearerToken(request) ?? cookieValue(request, AUTH_ACCESS_COOKIE)
}

function cookieValue(request: Request, name: string): string | null {
  const cookie = request.headers.get("cookie")
  if (!cookie) return null
  for (const entry of cookie.split(";")) {
    const [rawName, ...rawValue] = entry.trim().split("=")
    if (rawName === name) return decodeURIComponent(rawValue.join("="))
  }
  return null
}

function metadataString(metadata: Metadata, keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === "string" && value.trim()) return value
  }
  return null
}

function metadataEntitlements(metadata: Metadata): string[] {
  const value = metadata.entitlements
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string")
}

function metadataStringArray(metadata: Metadata, key: string): string[] | undefined {
  const value = metadata[key]
  if (!Array.isArray(value)) return undefined
  return value.filter((entry): entry is string => typeof entry === "string")
}

function metadataSetup(metadata: Metadata): PremiumUser["accountSetup"] {
  const value = metadata.brawllens_setup
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null
  const setup = value as Metadata
  return {
    playerTag: typeof setup.playerTag === "string" ? setup.playerTag : undefined,
    playerName: typeof setup.playerName === "string" ? setup.playerName : null,
    region: typeof setup.region === "string" ? setup.region : undefined,
    goals: Array.isArray(setup.goals) ? setup.goals.filter((entry): entry is string => typeof entry === "string") : undefined,
    completedAt: typeof setup.completedAt === "string" ? setup.completedAt : undefined,
  }
}

export async function getRequestUser(request: Request): Promise<PremiumUser | null> {
  const token = requestAuthToken(request)
  if (!token) return null

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  const metadata: Metadata = {
    ...(data.user.app_metadata as Metadata | undefined),
    ...(data.user.user_metadata as Metadata | undefined),
  }

  let role = metadataString(metadata, ["role", "account_role"])
  const accountSetup = metadataSetup(metadata)
  let displayName = metadataString(metadata, ["name", "full_name", "display_name"]) ?? accountSetup?.playerName ?? null
  let subscriptionTier: SubscriptionTier = normalizeSubscriptionTier(metadataString(metadata, ["subscription_tier", "plan", "tier"]))
  let subscriptionStatus: SubscriptionStatus = normalizeSubscriptionStatus(metadataString(metadata, ["subscription_status", "plan_status"]))
  let subscriptionProvider: string | null = null
  let currentPeriodEnd: string | null = null

  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (url && serviceKey) {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      admin
        .from("user_profiles")
        .select("role, display_name")
        .eq("id", data.user.id)
        .maybeSingle<AccountProfileRow>(),
      admin
        .from("user_subscriptions")
        .select("tier, status, provider, current_period_end")
        .eq("user_id", data.user.id)
        .maybeSingle<AccountSubscriptionRow>(),
    ])

    role = profile?.role ?? role
    displayName = profile?.display_name ?? displayName
    subscriptionTier = normalizeSubscriptionTier(subscription?.tier ?? subscriptionTier)
    subscriptionStatus = normalizeSubscriptionStatus(subscription?.status ?? subscriptionStatus)
    subscriptionProvider = subscription?.provider ?? null
    currentPeriodEnd = subscription?.current_period_end ?? null
  }

  return {
    id: data.user.id,
    email: data.user.email,
    displayName,
    accountSetup,
    dashboardWidgets: metadataStringArray(metadata, "lensboard_widgets"),
    role,
    subscriptionTier,
    subscriptionStatus,
    subscriptionProvider,
    currentPeriodEnd,
    entitlements: metadataEntitlements(metadata),
  }
}

export function authRedirectUrl(request: Request, path = "/auth/callback") {
  const url = new URL(request.url)
  return `${url.origin}${path}`
}
