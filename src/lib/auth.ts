import { createClient } from "@supabase/supabase-js"
import type { NextResponse } from "next/server"
import {
  normalizeSubscriptionStatus,
  normalizeSubscriptionTier,
  type SubscriptionStatus,
  type SubscriptionTier,
  type PremiumUser,
} from "@/lib/premium"
import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from "@/lib/authCookies"

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

export interface AuthSessionTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
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

export function requestRefreshToken(request: Request): string | null {
  return cookieValue(request, AUTH_REFRESH_COOKIE)
}

function requestAuthTokens(request: Request): string[] {
  return [bearerToken(request), cookieValue(request, AUTH_ACCESS_COOKIE)]
    .filter((token): token is string => Boolean(token))
    .filter((token, index, tokens) => tokens.indexOf(token) === index)
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

function metadataArray(metadata: Metadata, keys: string[]): unknown[] | undefined {
  for (const key of keys) {
    const value = metadata[key]
    if (Array.isArray(value)) return value
  }
  return undefined
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

function supabaseAuthConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return { url, key }
}

async function premiumUserFromAccessToken(token: string): Promise<PremiumUser | null> {
  const config = supabaseAuthConfig()
  if (!config) return null

  const supabase = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  const appMetadata: Metadata = data.user.app_metadata as Metadata | undefined ?? {}
  const userMetadata: Metadata = data.user.user_metadata as Metadata | undefined ?? {}
  const metadata: Metadata = {
    ...appMetadata,
    ...userMetadata,
  }

  let role = metadataString(appMetadata, ["role", "account_role"])
  const accountSetup = metadataSetup(metadata)
  let displayName =
    metadataString(userMetadata, ["name", "full_name", "display_name"])
    ?? metadataString(appMetadata, ["name", "full_name", "display_name"])
    ?? accountSetup?.playerName
    ?? null
  let subscriptionTier: SubscriptionTier = normalizeSubscriptionTier(metadataString(appMetadata, ["subscription_tier", "plan", "tier"]))
  let subscriptionStatus: SubscriptionStatus = normalizeSubscriptionStatus(metadataString(appMetadata, ["subscription_status", "plan_status"]))
  let subscriptionProvider: string | null = null
  let currentPeriodEnd: string | null = null

  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (serviceKey) {
    const admin = createClient(config.url, serviceKey, {
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
    dashboardWidgets: metadataArray(metadata, ["lensboard_layout", "lensboard_widgets"]),
    role,
    subscriptionTier,
    subscriptionStatus,
    subscriptionProvider,
    currentPeriodEnd,
    entitlements: metadataEntitlements(appMetadata),
  }
}

export async function refreshRequestSession(request: Request): Promise<AuthSessionTokens | null> {
  const refreshToken = requestRefreshToken(request)
  if (!refreshToken) return null

  const config = supabaseAuthConfig()
  if (!config) return null

  const supabase = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
  if (error || !data.session) return null

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token ?? refreshToken,
    expiresAt: data.session.expires_at,
  }
}

export async function getRequestUser(request: Request): Promise<PremiumUser | null> {
  for (const token of requestAuthTokens(request)) {
    const user = await premiumUserFromAccessToken(token)
    if (user) return user
  }

  const refreshed = await refreshRequestSession(request)
  return refreshed ? premiumUserFromAccessToken(refreshed.accessToken) : null
}

export async function getRequestUserWithRefresh(request: Request): Promise<{ user: PremiumUser | null; session: AuthSessionTokens | null }> {
  for (const token of requestAuthTokens(request)) {
    const user = await premiumUserFromAccessToken(token)
    if (user) return { user, session: null }
  }

  const session = await refreshRequestSession(request)
  if (!session) return { user: null, session: null }

  const user = await premiumUserFromAccessToken(session.accessToken)
  return { user, session: user ? session : null }
}

export function setAuthSessionCookies(response: NextResponse, session: AuthSessionTokens) {
  const accessMaxAge = session.expiresAt
    ? Math.max(0, session.expiresAt - Math.floor(Date.now() / 1000))
    : 60 * 60

  response.cookies.set(AUTH_ACCESS_COOKIE, session.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: accessMaxAge,
  })

  if (session.refreshToken) {
    response.cookies.set(AUTH_REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }
}

export function authRedirectUrl(request: Request, path = "/auth/callback") {
  const publicBaseUrl = publicAppUrl()
  if (publicBaseUrl) return `${publicBaseUrl}${path}`

  const url = new URL(request.url)
  return `${url.origin}${path}`
}

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    return new URL(candidate).origin
  } catch {
    return null
  }
}

function publicAppUrl() {
  return (
    normalizeBaseUrl(process.env.AUTH_REDIRECT_BASE_URL)
    ?? normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL)
    ?? normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL)
    ?? normalizeBaseUrl(process.env.PUBLIC_APP_URL)
    ?? normalizeBaseUrl(process.env.APP_URL)
    ?? normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    ?? normalizeBaseUrl(process.env.VERCEL_URL)
    ?? normalizeBaseUrl("https://brawllens.com")
  )
}
