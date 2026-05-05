import { createClient } from "@supabase/supabase-js"
import {
  normalizeSubscriptionStatus,
  normalizeSubscriptionTier,
  type PremiumUser,
} from "@/lib/premium"

type Metadata = Record<string, unknown>

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization")
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
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

export async function getRequestUser(request: Request): Promise<PremiumUser | null> {
  const token = bearerToken(request)
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

  const role = metadataString(metadata, ["role", "account_role"])
  return {
    id: data.user.id,
    email: data.user.email,
    role,
    subscriptionTier: normalizeSubscriptionTier(metadataString(metadata, ["subscription_tier", "plan", "tier"])),
    subscriptionStatus: normalizeSubscriptionStatus(metadataString(metadata, ["subscription_status", "plan_status"])),
    entitlements: metadataEntitlements(metadata),
  }
}
