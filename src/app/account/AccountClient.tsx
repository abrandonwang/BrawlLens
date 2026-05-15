"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { authHeaders, clearAuthSession, clearServerSession, storeAuthSession } from "@/lib/clientAuth"
import type { PremiumUser } from "@/lib/premium"
import { sanitizePlayerTag } from "@/lib/validation"

type LoadState = "loading" | "ready" | "signed-out" | "error"
type AccountTab = "profile" | "settings" | "appearance"
type AuthMePayload = {
  user?: PremiumUser | null
  session?: { accessToken?: string; refreshToken?: string; expiresAt?: number } | null
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ")
}

function ValueBox({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <div className={`bl-account-value ${muted ? "is-muted" : ""}`}>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="bl-account-section">
      <div className="bl-account-section-head">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div>{children}</div>
    </section>
  )
}

function SettingsRow({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="bl-account-row">
      <div className="min-w-0">
        <p className="bl-account-row-title">{title}</p>
        {description && <p className="bl-account-row-description">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function ActionButton({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled
      className={`bl-account-action ${danger ? "is-danger" : ""}`}
    >
      {children}
    </button>
  )
}

function RadioLine({ checked, title, description }: { checked?: boolean; title: string; description?: string }) {
  return (
    <div className="bl-account-radio">
      <span className={`bl-account-radio-mark ${checked ? "is-checked" : ""}`}>
        {checked && <span />}
      </span>
      <span className="min-w-0">
        <span className="bl-account-radio-title">{title}</span>
        {description && <span className="bl-account-radio-description">{description}</span>}
      </span>
    </div>
  )
}

function LoadingState() {
  return (
    <main className="bl-account-shell">
      <div className="bl-account-frame">
        <div className="bl-account-section p-4">
          <p className="m-0 text-[13px] font-semibold text-[var(--ink-3)]">Loading account...</p>
        </div>
      </div>
    </main>
  )
}

function SignedOutState() {
  return (
    <main className="bl-account-shell">
      <div className="bl-account-frame">
        <div className="bl-account-hero">
          <div className="min-w-0">
            <p className="bl-account-kicker">BrawlLens account</p>
            <h1>Sign in required</h1>
            <p>Sign in to manage account, premium, billing, and data settings.</p>
          </div>
        </div>
        <Link href="/?auth=login&next=/account" className="bl-account-primary-link">
          Sign in
        </Link>
      </div>
    </main>
  )
}

export default function AccountClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<LoadState>("loading")
  const [user, setUser] = useState<PremiumUser | null>(null)
  const [playerTagInput, setPlayerTagInput] = useState("")
  const [playerTagSaveState, setPlayerTagSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [playerTagMessage, setPlayerTagMessage] = useState("")

  useEffect(() => {
    let active = true

    async function load() {
      const response = await fetch("/api/auth/me", {
        headers: authHeaders(),
        cache: "no-store",
      })

      if (!active) return
      if (response.status === 401) {
        clearAuthSession()
        setState("signed-out")
        return
      }
      if (!response.ok) {
        setState("error")
        return
      }

      const payload = await response.json() as AuthMePayload
      if (payload.session?.accessToken) {
        storeAuthSession({
          accessToken: payload.session.accessToken,
          refreshToken: payload.session.refreshToken,
          expiresAt: payload.session.expiresAt,
        })
      }
      setUser(payload.user ?? null)
      setState(payload.user ? "ready" : "signed-out")
    }

    load().catch(() => {
      if (active) setState("error")
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const tag = user?.accountSetup?.playerTag
    setPlayerTagInput(tag ? `#${tag}` : "")
  }, [user?.accountSetup?.playerTag])

  useEffect(() => {
    setPlayerTagSaveState("idle")
    setPlayerTagMessage("")
  }, [user?.id])

  const cleanPlayerTag = useMemo(() => sanitizePlayerTag(playerTagInput), [playerTagInput])
  const savedPlayerTag = user?.accountSetup?.playerTag ?? ""
  const playerTagDirty = Boolean(cleanPlayerTag && cleanPlayerTag !== savedPlayerTag)
  const canSavePlayerTag = Boolean(cleanPlayerTag && playerTagDirty && playerTagSaveState !== "saving")
  const playerTagHint =
    playerTagMessage ||
    (playerTagInput.trim() && !cleanPlayerTag ? "Use a valid tag like #YP90U0YL." : "Tags work with or without #.")
  const playerTagHintClass =
    playerTagSaveState === "error"
      ? "text-[#a43c33]"
      : playerTagSaveState === "saved"
        ? "text-[var(--ink-2)]"
        : "text-[var(--ink-3)]"

  async function savePlayerTag() {
    if (!user) return
    if (!cleanPlayerTag) {
      setPlayerTagSaveState("error")
      setPlayerTagMessage("Use a valid tag like #YP90U0YL.")
      return
    }
    if (!playerTagDirty) {
      setPlayerTagSaveState("saved")
      setPlayerTagMessage("Saved")
      return
    }

    setPlayerTagSaveState("saving")
    setPlayerTagMessage("")

    const response = await fetch("/api/account/setup", {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerTag: cleanPlayerTag,
        playerName: user.accountSetup?.playerName ?? user.displayName ?? null,
        region: user.accountSetup?.region ?? "Global",
        goals: user.accountSetup?.goals ?? [],
      }),
    }).catch(() => null)

    if (!response) {
      setPlayerTagSaveState("error")
      setPlayerTagMessage("Could not save right now.")
      return
    }

    if (response.status === 401) {
      clearAuthSession()
      setState("signed-out")
      return
    }

    const payload = await response.json().catch(() => null) as {
      setup?: PremiumUser["accountSetup"]
      displayName?: string | null
      error?: string
    } | null

    if (!response.ok) {
      setPlayerTagSaveState("error")
      setPlayerTagMessage(payload?.error === "invalid_player_tag" ? "Use a valid tag like #YP90U0YL." : "Could not save right now.")
      return
    }

    const nextTag = payload?.setup?.playerTag ?? cleanPlayerTag
    setUser(current => {
      if (!current) return current
      return {
        ...current,
        displayName: payload?.displayName ?? current.displayName,
        accountSetup: payload?.setup ?? {
          ...(current.accountSetup ?? {}),
          playerTag: nextTag,
          region: current.accountSetup?.region ?? "Global",
          goals: current.accountSetup?.goals ?? [],
        },
      }
    })
    setPlayerTagInput(`#${nextTag}`)
    setPlayerTagSaveState("saved")
    setPlayerTagMessage("Saved")
  }

  function signOut() {
    clearAuthSession()
    clearServerSession().finally(() => router.replace("/?auth=login"))
  }

  const planDetails = useMemo(() => {
    if (!user) return null
    const isAdmin = user.role === "admin" || user.subscriptionTier === "admin"
    const isPaid = isAdmin || user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing"
    const periodEnd = formatDate(user.currentPeriodEnd)
    const planName = isAdmin ? "Admin" : user.subscriptionTier === "free" ? "Free" : user.subscriptionTier
    const cancellation =
      user.subscriptionStatus === "canceled"
        ? periodEnd
          ? `Canceled. Access remains until ${periodEnd}.`
          : "Canceled. No future renewal is scheduled."
        : isPaid
          ? periodEnd
            ? `Cancel any time. Premium remains active until ${periodEnd}.`
            : "Cancel any time. Premium remains active through the paid period."
          : "No active subscription to cancel."

    return { isAdmin, isPaid, periodEnd, planName, cancellation }
  }, [user])

  if (state === "loading") return <LoadingState />
  if (state === "signed-out") return <SignedOutState />

  if (state === "error" || !user || !planDetails) {
    return (
      <main className="bl-account-shell">
        <div className="bl-account-frame">
          <div className="bl-account-section p-4">
            <p className="m-0 text-[14px] font-semibold text-[var(--ink)]">Account did not load</p>
            <p className="mt-1 mb-0 text-[13px] text-[var(--ink-3)]">Try signing in again.</p>
          </div>
        </div>
      </main>
    )
  }

  const rawTab = searchParams.get("tab")
  const activeTab: AccountTab = rawTab === "settings" || rawTab === "appearance" ? rawTab : "profile"
  const playerName = user.accountSetup?.playerName ?? user.displayName ?? ""
  const accountTitle = playerName || user.email || "Account settings"
  const tabs: { id: AccountTab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "settings", label: "Settings" },
    { id: "appearance", label: "Appearance" },
  ]

  return (
    <main className="bl-account-shell">
      <div className="bl-account-frame">
        <Link href="/" className="bl-account-back">
          <ChevronLeft size={16} strokeWidth={1.8} />
          Go back
        </Link>

        <section className="bl-account-hero">
          <div className="min-w-0">
            <p className="bl-account-kicker">BrawlLens account</p>
            <h1>Account settings</h1>
            <p>{accountTitle}</p>
            <div className="bl-account-pills" aria-label="Account summary">
              <span>{planDetails.planName}</span>
              <span>{formatStatus(user.subscriptionStatus)}</span>
              <span>{user.accountSetup?.playerTag ? `#${user.accountSetup.playerTag}` : "No player tag"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="bl-account-signout"
          >
            Sign out
          </button>
        </section>

        <div className="bl-account-toolbar">
          <nav className="bl-account-tabs" aria-label="Account settings">
            {tabs.map(item => {
              const active = item.id === activeTab
              return (
                <Link
                  key={item.id}
                  href={`/account?tab=${item.id}`}
                  className={`bl-account-tab ${active ? "is-active" : ""}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="bl-account-content">
            {activeTab === "profile" && (
              <>
                <SettingsSection title="Profile" description="Change how your account appears in BrawlLens.">
                  <SettingsRow title="Username" description="Shown in the account menu and profile surfaces.">
                    <div className="flex gap-2">
                      <ValueBox muted={!accountTitle}>{accountTitle || "Not set"}</ValueBox>
                      <ActionButton>Update</ActionButton>
                    </div>
                  </SettingsRow>
                  <SettingsRow title="Email" description="Email address associated with this account.">
                    <ValueBox>{user.email ?? "Unknown"}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Player tag" description="Primary Brawl Stars account for account context.">
                    <div className="grid gap-2">
                      <div className="flex gap-2 max-sm:flex-col">
                        <input
                          value={playerTagInput}
                          onChange={event => {
                            setPlayerTagInput(event.target.value.toUpperCase())
                            setPlayerTagSaveState("idle")
                            setPlayerTagMessage("")
                          }}
                          onKeyDown={event => {
                            if (event.key === "Enter" && canSavePlayerTag) {
                              event.preventDefault()
                              void savePlayerTag()
                            }
                          }}
                          placeholder="#YP90U0YL"
                          autoCapitalize="characters"
                          spellCheck={false}
                          className="bl-account-input"
                        />
                        <button
                          type="button"
                          onClick={() => void savePlayerTag()}
                          disabled={!canSavePlayerTag}
                          className={`bl-account-save ${canSavePlayerTag ? "" : "is-disabled"}`}
                        >
                          {playerTagSaveState === "saving" ? "Saving..." : "Save"}
                        </button>
                      </div>
                      <p className={`m-0 min-h-4 text-[12px] leading-snug ${playerTagHintClass}`}>{playerTagHint}</p>
                    </div>
                  </SettingsRow>
                  <SettingsRow title="Region" description="Used for account defaults and future filters.">
                    <ValueBox>{user.accountSetup?.region ?? "Global"}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Profile visibility" description="Control who can see your public profile.">
                    <div>
                      <RadioLine checked title="Public" description="Your profile is visible to everyone." />
                      <RadioLine title="Private" description="Your profile is hidden from public view." />
                    </div>
                  </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Security">
                  <SettingsRow title="Sign-in method" description="How BrawlLens authenticates this account.">
                    <ValueBox>Email + password</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Email sender" description="Setup links are sent from the branded sender.">
                    <ValueBox>BrawlLens email</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Account ID" description="Internal account reference.">
                    <ValueBox><span className="font-mono text-[12px]">{user.id}</span></ValueBox>
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <SettingsSection title="Plan and billing" description="Manage your subscription, receipts, and cancellation.">
                  <SettingsRow title="Plan" description="Current BrawlLens subscription tier.">
                    <ValueBox>{planDetails.planName}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Subscription status" description="Current billing state.">
                    <ValueBox>{formatStatus(user.subscriptionStatus)}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Cancellation" description={planDetails.cancellation}>
                    <ActionButton danger>{planDetails.isPaid ? "Cancel renewal" : "Nothing to cancel"}</ActionButton>
                  </SettingsRow>
                  <SettingsRow title="Billing portal" description="Receipts and payment methods will live here.">
                    <ActionButton>Manage billing</ActionButton>
                  </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Premium access">
                  <SettingsRow title="Brawl AI" description="Premium answer quality and longer context.">
                    <ValueBox muted={!planDetails.isPaid}>{planDetails.isPaid ? "Unlocked" : "Upgrade required"}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Advanced map filters" description="Deeper filtering for maps and brawlers.">
                    <ValueBox muted={!planDetails.isPaid}>{planDetails.isPaid ? "Unlocked" : "Upgrade required"}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="CSV exports" description="Download selected account and meta data.">
                    <ValueBox muted={!planDetails.isPaid}>{planDetails.isPaid ? "Unlocked" : "Upgrade required"}</ValueBox>
                  </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Email preferences">
                  <SettingsRow title="Product updates" description="Important BrawlLens release notes.">
                    <ValueBox>Important only</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Meta reports" description="Scheduled summaries for tracked surfaces.">
                    <ValueBox muted>Off until premium launch</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Billing notices" description="Receipts, renewals, and cancellation emails.">
                    <ValueBox>Always on</ValueBox>
                  </SettingsRow>
                </SettingsSection>
              </>
            )}

            {activeTab === "appearance" && (
              <>
                <SettingsSection title="Appearance" description="Interface defaults for this account.">
                  <SettingsRow title="Theme" description="Current visual theme.">
                    <ValueBox>DPM dark</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Density" description="Spacing for repeated data surfaces.">
                    <ValueBox>Comfortable</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Motion" description="Animations and interaction transitions.">
                    <ValueBox>Enabled</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Modal background" description="How overlays treat the page behind them.">
                    <ValueBox>Dim only</ValueBox>
                  </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Lensboard">
                  <SettingsRow title="Saved panels" description="Number of panels saved to this account.">
                    <ValueBox>{user.dashboardWidgets?.length ? `${user.dashboardWidgets.length} panels` : "Local defaults"}</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Layout" description="Workspace arrangement mode.">
                    <ValueBox>Editable grid</ValueBox>
                  </SettingsRow>
                  <SettingsRow title="Reset Lensboard" description="Restore the default panel set.">
                    <ActionButton>Reset</ActionButton>
                  </SettingsRow>
                </SettingsSection>

                <SettingsSection title="Privacy and data">
                  <SettingsRow title="Export data" description="Download account preferences and saved settings.">
                    <ActionButton>Export</ActionButton>
                  </SettingsRow>
                  <SettingsRow title="Delete account" description="Permanent account deletion requires confirmation.">
                    <ActionButton danger>Delete</ActionButton>
                  </SettingsRow>
                </SettingsSection>
              </>
            )}
        </div>
      </div>
    </main>
  )
}
