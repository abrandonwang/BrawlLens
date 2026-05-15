"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { readAuthSession, storeAuthSessionFromHash, syncServerSession } from "@/lib/clientAuth"
import { sanitizePlayerTag } from "@/lib/validation"

type SetupState = "syncing" | "ready" | "saving" | "error"

const regions = ["Global", "NA", "EU", "ASIA", "KR", "BR", "DE"]
const goals = ["Track profile", "Build Lensboard", "Study map meta", "Use Brawl AI"]

export default function AuthSetupClient() {
  const router = useRouter()
  const [state, setState] = useState<SetupState>("syncing")
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [playerTag, setPlayerTag] = useState("")
  const [region, setRegion] = useState("Global")
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Track profile", "Build Lensboard"])

  const cleanTag = useMemo(() => sanitizePlayerTag(playerTag), [playerTag])
  const canContinue = step !== 0 || Boolean(cleanTag)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const authError = params.get("error_description") ?? params.get("error")
    if (authError) {
      setError(authError)
      setState("error")
      return
    }

    const session = storeAuthSessionFromHash(window.location.hash) ?? readAuthSession()
    if (!session) {
      setError("The setup link did not include a usable session.")
      setState("error")
      return
    }

    syncServerSession(session)
      .then(() => {
        window.history.replaceState(null, "", "/auth/setup")
        setState("ready")
      })
      .catch(() => {
        setError("Your email was confirmed, but the account cookie could not be created.")
        setState("error")
      })
  }, [])

  function toggleGoal(goal: string) {
    setSelectedGoals(current =>
      current.includes(goal)
        ? current.filter(item => item !== goal)
        : [...current, goal],
    )
  }

  async function finishSetup() {
    if (!cleanTag) return

    setState("saving")
    let playerName: string | null = null
    try {
      const response = await fetch(`/api/player?tag=${encodeURIComponent(cleanTag)}`, { cache: "no-store" })
      const player = await response.json().catch(() => null) as { name?: string } | null
      playerName = response.ok && typeof player?.name === "string" ? player.name : null
    } catch {
      playerName = null
    }

    const setup = {
      playerTag: cleanTag,
      playerName,
      region,
      goals: selectedGoals,
      completedAt: new Date().toISOString(),
    }

    await fetch("/api/account/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setup),
    }).catch(() => null)

    router.replace("/")
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/55 px-4 py-6 animate-[modalOverlayIn_0.18s_ease-out_both]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
        className="w-full max-w-[500px] rounded-[16px] border border-white/[0.10] bg-[#101419] p-5 text-[var(--ink)] shadow-[0_34px_92px_-44px_rgba(0,0,0,0.95),rgba(255,255,255,0.08)_0_0.5px_0_0_inset] animate-[modalSheetIn_0.24s_cubic-bezier(0.16,1,0.3,1)_both] max-[460px]:p-4"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 id="setup-title" className="m-0 text-[28px] leading-[1.04] font-semibold tracking-[-0.024em] text-[var(--ink)]">
              Personalize BrawlLens.
            </h1>
          </div>
          <div className="grid min-w-[70px] grid-cols-3 gap-1 pt-1.5" aria-hidden="true">
            {[0, 1, 2].map(index => (
              <span key={index} className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`} />
            ))}
          </div>
        </div>

        {state === "syncing" && (
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] p-4">
            <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Confirming your account...</p>
            <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">The Lensboard is loading behind this setup step.</p>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] p-4">
            <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Setup link failed</p>
            <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/?auth=signup")}
              className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-lg border-0 bg-[var(--ink)] px-4 text-[13px] font-semibold text-[var(--ink-on)]"
            >
              Try again
            </button>
          </div>
        )}

        {(state === "ready" || state === "saving") && (
          <>
            {step === 0 && (
              <div>
                <h2 className="m-0 text-[18px] leading-tight font-semibold text-[var(--ink)]">Connect your player</h2>
                <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">This is what the account button will use after setup.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-[var(--ink-4)]">Player tag</span>
                    <input
                      value={playerTag}
                      onChange={event => setPlayerTag(event.target.value)}
                      placeholder="#YP90U0YL or YP90U0YL"
                      className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)] focus:border-[var(--line-2)]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[12px] text-[var(--ink-4)]">Region</span>
                    <select
                      value={region}
                      onChange={event => setRegion(event.target.value)}
                      className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--line-2)]"
                    >
                      {regions.map(item => <option key={item}>{item}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="m-0 text-[18px] leading-tight font-semibold text-[var(--ink)]">Choose defaults</h2>
                <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">These seed the first Lensboard panels.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {goals.map(goal => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`min-h-10 cursor-pointer rounded-lg border px-3 text-left text-[13px] font-semibold transition-colors ${
                        selectedGoals.includes(goal)
                          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-on)]"
                          : "border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] hover:bg-[var(--hover-bg)]"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="m-0 text-[18px] leading-tight font-semibold text-[var(--ink)]">Your Lensboard is ready!</h2>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(current => Math.max(0, current - 1))}
                disabled={step === 0 || state === "saving"}
                className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--line)] bg-transparent px-4 text-[13px] font-semibold text-[var(--ink-3)] disabled:cursor-default disabled:opacity-35"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => step === 2 ? void finishSetup() : setStep(current => current + 1)}
                disabled={!canContinue || state === "saving"}
                className="inline-flex h-10 cursor-pointer items-center rounded-lg border-0 bg-[var(--ink)] px-4 text-[13px] font-semibold text-[var(--ink-on)] shadow-[var(--shadow-lift)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "saving" ? "Saving..." : step === 2 ? "Open Lensboard" : "Continue"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
