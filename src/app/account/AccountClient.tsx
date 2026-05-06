"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, LogOut } from "lucide-react"
import { authHeaders, clearAuthSession, clearServerSession } from "@/lib/clientAuth"
import type { PremiumUser } from "@/lib/premium"
import { sanitizePlayerTag } from "@/lib/validation"

type LoadState = "loading" | "ready" | "signed-out" | "error"
type AccountTab = "profile" | "settings" | "appearance"

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
    <div className={`flex min-h-10 w-full items-center rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 text-[13px] ${muted ? "text-[var(--ink-4)]" : "text-[var(--ink)]"}`}>
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
    <section className="rounded-[16px] border border-[var(--line)] bg-[var(--panel)]">
      <div className="border-b border-[var(--line)] px-6 py-5 max-sm:px-4">
        <h2 className="m-0 text-[20px] leading-tight font-semibold tracking-[-0.01em] text-[var(--ink)]">{title}</h2>
        {description && <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">{description}</p>}
      </div>
      <div className="divide-y divide-[var(--line)]">{children}</div>
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
    <div className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.9fr)] md:items-center max-sm:px-4">
      <div className="min-w-0">
        <p className="m-0 text-[14px] font-semibold leading-tight text-[var(--ink)]">{title}</p>
        {description && <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">{description}</p>}
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
      className={`inline-flex h-10 min-w-[92px] cursor-not-allowed items-center justify-center rounded-md border px-3 text-[13px] font-medium opacity-55 ${
        danger
          ? "border-[color-mix(in_srgb,#ef4444_28%,var(--line))] bg-transparent text-[#b91c1c]"
          : "border-[var(--line)] bg-[var(--bg)] text-[var(--ink-2)]"
      }`}
    >
      {children}
    </button>
  )
}

function RadioLine({ checked, title, description }: { checked?: boolean; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${checked ? "border-[var(--ink)]" : "border-[var(--line-2)]"}`}>
        {checked && <span className="size-2 rounded-full bg-[var(--ink)]" />}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight text-[var(--ink)]">{title}</span>
        {description && <span className="mt-0.5 block text-[12px] leading-snug text-[var(--ink-3)]">{description}</span>}
      </span>
    </div>
  )
}

function LoadingState() {
  return (
    <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-14">
      <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-6">
        <p className="m-0 text-[14px] text-[var(--ink-3)]">Loading account...</p>
      </div>
    </main>
  )
}

function SignedOutState() {
  return (
    <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-14">
      <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-6">
        <h1 className="m-0 mb-2 text-[32px] leading-none font-semibold text-[var(--ink)]">Sign in required</h1>
        <p className="m-0 text-[14px] text-[var(--ink-3)]">Sign in to manage account, premium, billing, and data settings.</p>
        <Link href="/login?mode=login" className="mt-5 inline-flex h-10 items-center rounded-md bg-[var(--ink)] px-4 text-[14px] text-[#fcfbf8] no-underline">
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

      const payload = await response.json() as { user: PremiumUser | null }
      setUser(payload.user)
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
    clearServerSession().finally(() => router.replace("/login"))
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
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-14">
        <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-6">
          <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Account did not load</p>
          <p className="mt-2 mb-0 text-[13px] text-[var(--ink-3)]">Try signing in again.</p>
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
    <main className="grid min-h-[calc(100dvh-64px)] bg-[var(--bg)] lg:h-[calc(100dvh-64px)] lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="border-r border-[var(--line)] px-4 py-5 max-lg:border-r-0 max-lg:border-b lg:h-full lg:overflow-y-auto">
        <Link href="/" className="inline-flex h-9 items-center gap-2 rounded-md px-2 text-[14px] font-medium text-[var(--ink-2)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]">
          <ChevronLeft size={16} strokeWidth={1.8} />
          Go back
        </Link>

        <div className="mt-7">
          <p className="mb-2 px-2 text-[12px] font-semibold text-[var(--ink-4)]">Workspace</p>
          <Link href="/" className="flex min-h-10 items-center rounded-md px-2 text-[14px] text-[var(--ink-2)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]">
            Lensboard
          </Link>
        </div>

        <div className="mt-7">
          <p className="mb-2 px-2 text-[12px] font-semibold text-[var(--ink-4)]">Account</p>
          <nav className="grid gap-1" aria-label="Account settings">
            {tabs.map(item => {
              const active = item.id === activeTab
              return (
                <Link
                  key={item.id}
                  href={`/account?tab=${item.id}`}
                  className={`flex min-h-10 items-center rounded-md px-2 text-[14px] no-underline transition-colors ${active ? "bg-[var(--hover-bg)] font-semibold text-[var(--ink)]" : "text-[var(--ink-2)] hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <section className="min-w-0 px-8 py-8 max-lg:px-5 max-sm:px-4 lg:h-full lg:overflow-y-auto">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="m-0 text-[28px] font-semibold leading-tight tracking-[-0.012em] text-[var(--ink)]">Account settings</h1>
              <p className="mt-1 mb-0 text-[14px] leading-relaxed text-[var(--ink-3)]">Manage profile, billing, and interface preferences.</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
            >
              <LogOut size={15} strokeWidth={1.8} />
              Sign out
            </button>
          </div>

          <div className="grid gap-5">
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
                          className="h-10 min-w-0 flex-1 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 text-[13px] font-medium text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[var(--line-2)]"
                        />
                        <button
                          type="button"
                          onClick={() => void savePlayerTag()}
                          disabled={!canSavePlayerTag}
                          className={`inline-flex h-10 min-w-[82px] items-center justify-center rounded-md px-3 text-[13px] font-medium transition-colors ${
                            canSavePlayerTag
                              ? "cursor-pointer border border-[var(--ink)] bg-[var(--ink)] text-[#fcfbf8] hover:bg-[var(--ink-2)]"
                              : "cursor-not-allowed border border-[var(--line)] bg-[var(--bg)] text-[var(--ink-4)]"
                          }`}
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
                    <ValueBox>Light</ValueBox>
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
      </section>
    </main>
  )
}
