export type SubscriptionTier = "free" | "pro" | "premium" | "admin"
export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled"

export type PremiumFeature =
  | "ai:premium-chat"
  | "meta:advanced-filters"
  | "player:deep-insights"
  | "exports:csv"

export interface PremiumUser {
  id: string
  email?: string | null
  displayName?: string | null
  accountSetup?: {
    playerTag?: string
    playerName?: string | null
    region?: string
    goals?: string[]
    completedAt?: string
  } | null
  dashboardWidgets?: string[]
  role?: string | null
  subscriptionTier: SubscriptionTier
  subscriptionStatus: SubscriptionStatus
  subscriptionProvider?: string | null
  currentPeriodEnd?: string | null
  entitlements?: string[]
}

const FEATURE_TIERS: Record<PremiumFeature, SubscriptionTier[]> = {
  "ai:premium-chat": ["pro", "premium", "admin"],
  "meta:advanced-filters": ["pro", "premium", "admin"],
  "player:deep-insights": ["premium", "admin"],
  "exports:csv": ["pro", "premium", "admin"],
}

export function normalizeSubscriptionTier(raw: unknown): SubscriptionTier {
  if (raw === "admin" || raw === "premium" || raw === "pro") return raw
  return "free"
}

export function normalizeSubscriptionStatus(raw: unknown): SubscriptionStatus {
  if (raw === "trialing" || raw === "active" || raw === "past_due" || raw === "canceled") return raw
  return "inactive"
}

export function hasActiveSubscription(user: PremiumUser | null | undefined): boolean {
  if (!user) return false
  if (user.role === "admin" || user.subscriptionTier === "admin") return true
  return user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing"
}

export function canUsePremium(user: PremiumUser | null | undefined, feature: PremiumFeature): boolean {
  if (!user) return false
  if (user.role === "admin" || user.subscriptionTier === "admin") return true
  if (user.entitlements?.includes(feature)) return true
  if (!hasActiveSubscription(user)) return false
  return FEATURE_TIERS[feature].includes(user.subscriptionTier)
}

export function premiumGate(user: PremiumUser | null | undefined, feature: PremiumFeature) {
  if (canUsePremium(user, feature)) return { allowed: true as const }
  return {
    allowed: false as const,
    reason: user ? "upgrade_required" : "auth_required",
  }
}
