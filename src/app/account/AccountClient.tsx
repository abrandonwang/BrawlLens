"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  Bell,
  Check,
  CreditCard,
  Crown,
  Download,
  KeyRound,
  LogOut,
  RefreshCcw,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react"
import { authHeaders, clearAuthSession, clearServerSession } from "@/lib/clientAuth"
import type { PremiumUser } from "@/lib/premium"

type LoadState = "loading" | "ready" | "signed-out" | "error"

const premiumFeatures = [
  "Premium AI answers",
  "Advanced map filters",
  "Deep player insights",
  "CSV exports",
]

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function userInitial(user: PremiumUser) {
  const value = user.displayName ?? user.email ?? "B"
  return value.trim().charAt(0).toUpperCase() || "B"
}

function SettingsCard({
  icon,
  title,
  description,
  children,
  action,
  className = "",
}: {
  icon: ReactNode
  title: string
  description?: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)] ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-3)]">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-[18px] leading-tight font-semibold text-[var(--ink)]">{title}</h2>
            {description && <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </section>
  )
}

function SettingRow({
  label,
  value,
  tone = "normal",
}: {
  label: string
  value: ReactNode
  tone?: "normal" | "muted"
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-[13px] text-[var(--ink-3)]">{label}</span>
      <span className={`min-w-0 text-right text-[13px] font-semibold ${tone === "muted" ? "text-[var(--ink-4)]" : "text-[var(--ink)]"}`}>
        {value}
      </span>
    </div>
  )
}

function DisabledAction({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      disabled
      className={`inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border px-4 text-[13px] font-semibold opacity-55 ${
        danger
          ? "border-[color-mix(in_srgb,#ef4444_28%,var(--line))] bg-transparent text-[#b91c1c]"
          : "border-[var(--line)] bg-[var(--panel-2)] text-[var(--ink-3)]"
      }`}
    >
      {children}
    </button>
  )
}

function LoadingState() {
  return (
    <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-14">
      <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lift)]">
        <p className="m-0 text-[14px] text-[var(--ink-3)]">Loading account...</p>
      </div>
    </main>
  )
}

function SignedOutState() {
  return (
    <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-14">
      <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lift)]">
        <h1 className="m-0 mb-2 text-[32px] leading-none font-semibold text-[var(--ink)]">Sign in required</h1>
        <p className="m-0 text-[14px] text-[var(--ink-3)]">Sign in to manage account, premium, billing, and data settings.</p>
        <Link href="/login" className="mt-5 inline-flex h-10 items-center rounded-lg bg-[var(--ink)] px-4 text-[14px] text-[#fcfbf8] no-underline">
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
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lift)]">
          <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Account did not load</p>
          <p className="mt-2 mb-0 text-[13px] text-[var(--ink-3)]">Try signing in again.</p>
        </div>
      </main>
    )
  }

  const tab = searchParams.get("tab")
  const activeTab = tab === "settings" || tab === "appearance" ? tab : "profile"
  const accountTitle = user.displayName ?? user.accountSetup?.playerName ?? user.email ?? "Account"
  const tabs = [
    { id: "profile", label: "Profile", description: "Identity and player" },
    { id: "settings", label: "Settings", description: "Plan and account" },
    { id: "appearance", label: "Appearance", description: "Interface defaults" },
  ] as const

  return (
    <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-10">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-[14px] bg-[var(--ink)] text-[22px] font-semibold text-[#fcfbf8] shadow-[var(--shadow-lift)]">
            {userInitial(user)}
          </div>
          <div className="min-w-0">
            <h1 className="m-0 mb-1 text-[38px] leading-none font-semibold tracking-[-0.02em] text-[var(--ink)] max-[560px]:text-[31px]">
              {accountTitle}
            </h1>
            <p className="m-0 truncate text-[14px] text-[var(--ink-3)]">{user.email ?? "Signed in"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 text-[13px] font-semibold text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
        >
          <LogOut size={15} strokeWidth={1.9} />
          Sign out
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-2 shadow-[var(--shadow-lift)] lg:sticky lg:top-24">
          {tabs.map(item => {
            const active = item.id === activeTab
            return (
              <Link
                key={item.id}
                href={`/account?tab=${item.id}`}
                className={`block rounded-[10px] px-3 py-2.5 text-inherit no-underline transition-colors ${active ? "bg-[var(--ink)] text-[#fcfbf8]" : "hover:bg-[var(--hover-bg)]"}`}
              >
                <span className={`block text-[13px] font-semibold ${active ? "text-[#fcfbf8]" : "text-[var(--ink)]"}`}>{item.label}</span>
                <span className={`mt-0.5 block text-[12px] leading-snug ${active ? "text-[#fcfbf8]/70" : "text-[var(--ink-3)]"}`}>{item.description}</span>
              </Link>
            )
          })}
        </aside>

        <div className="grid gap-5 content-start">
          {activeTab === "profile" && (
            <>
              <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
                <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow-lift)]">
                  <span className="text-[12px] text-[var(--ink-4)]">Player</span>
                  <strong className="mt-1 block truncate text-[24px] text-[var(--ink)]">{user.accountSetup?.playerName ?? user.accountSetup?.playerTag ?? "Not set"}</strong>
                </div>
                <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow-lift)]">
                  <span className="text-[12px] text-[var(--ink-4)]">Plan</span>
                  <strong className="mt-1 block text-[24px] capitalize text-[var(--ink)]">{planDetails.planName}</strong>
                </div>
                <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[var(--shadow-lift)]">
                  <span className="text-[12px] text-[var(--ink-4)]">Sign-in</span>
                  <strong className="mt-1 block text-[24px] text-[var(--ink)]">Password</strong>
                </div>
              </div>

              <SettingsCard icon={<UserRound size={16} strokeWidth={1.9} />} title="Profile" description="Account identity and Brawl Stars context.">
                <SettingRow label="Email" value={user.email ?? "Unknown"} />
                <SettingRow label="Display name" value={user.displayName ?? "Not set"} tone={user.displayName ? "normal" : "muted"} />
                <SettingRow label="Player tag" value={user.accountSetup?.playerTag ? `#${user.accountSetup.playerTag}` : "Not set"} tone={user.accountSetup?.playerTag ? "normal" : "muted"} />
                <SettingRow label="Region" value={user.accountSetup?.region ?? "Global"} />
                <SettingRow label="Goals" value={user.accountSetup?.goals?.join(", ") || "Not set"} tone={user.accountSetup?.goals?.length ? "normal" : "muted"} />
                <SettingRow label="Role" value={user.role ?? "user"} />
                <SettingRow label="Account ID" value={<span className="font-mono text-[11px]">{user.id.slice(0, 8)}...</span>} />
              </SettingsCard>

              <SettingsCard icon={<KeyRound size={16} strokeWidth={1.9} />} title="Security" description="BrawlLens sends setup mail from the configured branded sender.">
                <SettingRow label="Method" value="Email + password" />
                <SettingRow label="Sender" value="BrawlLens email" />
                <SettingRow label="Session core" value="Supabase Auth" />
              </SettingsCard>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <SettingsCard icon={<Crown size={16} strokeWidth={1.9} />} title="Upgrade" description="Premium is staged for launch behind account gates." action={<DisabledAction>{planDetails.isPaid ? "Current plan" : "Upgrade soon"}</DisabledAction>}>
                <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="m-0 text-[12px] font-semibold uppercase text-[var(--ink-4)]">BrawlLens Pro</p>
                      <h3 className="mt-1 mb-0 text-[24px] leading-tight font-semibold text-[var(--ink)]">Launch pricing soon</h3>
                    </div>
                    <span className="rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 text-[12px] text-[var(--ink-3)]">Premium beta</span>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {premiumFeatures.map(feature => (
                      <div key={feature} className="flex items-center gap-2 text-[13px] text-[var(--ink-2)]">
                        <Check size={14} strokeWidth={2.2} className="text-[var(--ink)]" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </SettingsCard>

              <SettingsCard icon={<CreditCard size={16} strokeWidth={1.9} />} title="Billing and cancellation" description="Manage renewal, receipts, and plan changes from one place.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DisabledAction>Manage billing</DisabledAction>
                  <DisabledAction danger>{planDetails.isPaid ? "Cancel renewal" : "Nothing to cancel"}</DisabledAction>
                </div>
                <div className="mt-5 rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] p-4">
                  <p className="m-0 text-[13px] font-semibold text-[var(--ink)]">Cancellation details</p>
                  <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">{planDetails.cancellation}</p>
                  <p className="mt-3 mb-0 text-[12px] leading-relaxed text-[var(--ink-4)]">Cancellation will stop renewal without deleting your account, saved Lensboard, or free access.</p>
                </div>
              </SettingsCard>

              <SettingsCard icon={<Sparkles size={16} strokeWidth={1.9} />} title="Premium status" description="Feature access for gated surfaces.">
                <SettingRow label="AI premium chat" value={planDetails.isPaid ? "Unlocked" : "Upgrade required"} tone={planDetails.isPaid ? "normal" : "muted"} />
                <SettingRow label="Advanced filters" value={planDetails.isPaid ? "Unlocked" : "Upgrade required"} tone={planDetails.isPaid ? "normal" : "muted"} />
                <SettingRow label="Exports" value={planDetails.isPaid ? "Unlocked" : "Upgrade required"} tone={planDetails.isPaid ? "normal" : "muted"} />
              </SettingsCard>

              <SettingsCard icon={<Bell size={16} strokeWidth={1.9} />} title="Email preferences" description="Choose what should reach your inbox.">
                <SettingRow label="Product updates" value="Important only" />
                <SettingRow label="Meta reports" value="Off until premium launch" tone="muted" />
                <SettingRow label="Billing notices" value="Always on" />
              </SettingsCard>
            </>
          )}

          {activeTab === "appearance" && (
            <>
              <SettingsCard icon={<Sparkles size={16} strokeWidth={1.9} />} title="Appearance" description="Visual defaults for the BrawlLens interface.">
                <SettingRow label="Theme" value="Light" />
                <SettingRow label="Density" value="Comfortable" />
                <SettingRow label="Motion" value="Enabled" />
                <SettingRow label="Modal background" value="Dim only" />
              </SettingsCard>

              <SettingsCard icon={<RefreshCcw size={16} strokeWidth={1.9} />} title="Lensboard defaults" description="Saved panel layout and workspace behavior.">
                <SettingRow label="Saved panels" value={user.dashboardWidgets?.length ? `${user.dashboardWidgets.length} panels` : "Local defaults"} />
                <SettingRow label="Layout" value="Editable grid" />
                <SettingRow label="Persistence" value="Account metadata" />
                <div className="mt-5">
                  <DisabledAction>
                    <span className="inline-flex items-center gap-2"><RefreshCcw size={14} /> Reset Lensboard</span>
                  </DisabledAction>
                </div>
              </SettingsCard>

              <SettingsCard icon={<Shield size={16} strokeWidth={1.9} />} title="Privacy and data" description="Control account data when tools are wired.">
                <div className="grid gap-2">
                  <DisabledAction>
                    <span className="inline-flex items-center gap-2"><Download size={14} /> Export data</span>
                  </DisabledAction>
                  <Link href="/contact" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-transparent px-4 text-[13px] font-semibold text-[var(--ink-2)] no-underline transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]">
                    <AlertCircle size={14} />
                    Request help
                  </Link>
                </div>
              </SettingsCard>

              <SettingsCard icon={<Trash2 size={16} strokeWidth={1.9} />} title="Danger zone" description="Permanent account actions require confirmation.">
                <div className="flex flex-wrap items-center gap-3">
                  <DisabledAction danger>
                    <span className="inline-flex items-center gap-2"><XCircle size={14} /> Delete account</span>
                  </DisabledAction>
                  <span className="text-[12px] text-[var(--ink-4)]">Manual review until deletion API is live.</span>
                </div>
              </SettingsCard>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
