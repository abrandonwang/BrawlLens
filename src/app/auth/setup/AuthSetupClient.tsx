"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { readAuthSession, storeAuthSessionFromHash, syncServerSession } from "@/lib/clientAuth"
import { sanitizePlayerTag } from "@/lib/validation"

type SetupState = "syncing" | "ready" | "error"

const regions = ["Global", "NA", "EU", "ASIA", "KR", "BR", "DE"]
const goals = ["Track my account", "Study map meta", "Use Brawl AI", "Follow leaderboards"]

export default function AuthSetupClient() {
  const router = useRouter()
  const [state, setState] = useState<SetupState>("syncing")
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [playerTag, setPlayerTag] = useState("")
  const [region, setRegion] = useState("Global")
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["Track my account"])

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

  function finishSetup() {
    const setup = {
      playerTag: cleanTag,
      region,
      goals: selectedGoals,
      completedAt: new Date().toISOString(),
    }
    window.localStorage.setItem("brawllens_setup", JSON.stringify(setup))
    router.replace(cleanTag ? `/player/${encodeURIComponent(cleanTag)}` : "/account")
  }

  if (state === "syncing") {
    return (
      <main className="mx-auto grid min-h-[55vh] w-full max-w-[520px] place-items-center px-4 py-14">
        <div className="w-full rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-6 text-center shadow-[var(--shadow-lift)]">
          <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Confirming your account...</p>
        </div>
      </main>
    )
  }

  if (state === "error") {
    return (
      <main className="mx-auto grid min-h-[55vh] w-full max-w-[520px] place-items-center px-4 py-14">
        <div className="w-full rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-6 text-center shadow-[var(--shadow-lift)]">
          <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Setup link failed</p>
          <p className="mx-auto mt-2 mb-0 max-w-[360px] text-[13px] leading-relaxed text-[var(--ink-3)]">{error}</p>
          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-5 inline-flex h-10 cursor-pointer items-center rounded-lg border-0 bg-[var(--ink)] px-4 text-[14px] text-[#fcfbf8]"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[var(--bg)] px-4 py-10">
      <div className="mx-auto max-w-[760px] rounded-[18px] border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_32px_90px_-56px_rgba(28,28,28,0.5)]">
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-2)] px-5 py-4">
          <p className="m-0 text-[12px] font-semibold uppercase text-[var(--ink-4)]">Setup</p>
          <h1 className="mt-1 mb-0 text-[30px] leading-tight font-semibold text-[var(--ink)]">Finish BrawlLens setup</h1>
        </div>

        <section role="dialog" aria-modal="true" aria-labelledby="setup-title" className="px-2 py-5">
          <div className="mb-5 flex items-center gap-2">
            {[0, 1, 2].map(index => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[var(--ink)]" : "bg-[var(--line)]"}`} />
            ))}
          </div>

          {step === 0 && (
            <div>
              <h2 id="setup-title" className="m-0 text-[22px] leading-tight font-semibold text-[var(--ink)]">Connect your Brawl Stars account</h2>
              <p className="mt-2 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">Add your player tag so BrawlLens can open directly into your account context.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                <label className="block">
                  <span className="mb-1.5 block text-[12px] text-[var(--ink-4)]">Player tag</span>
                  <input
                    value={playerTag}
                    onChange={event => setPlayerTag(event.target.value)}
                    placeholder="#2PP or 2PP"
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
              <h2 id="setup-title" className="m-0 text-[22px] leading-tight font-semibold text-[var(--ink)]">Choose what matters</h2>
              <p className="mt-2 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">We will use this to shape defaults as premium surfaces come online.</p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {goals.map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleGoal(goal)}
                    className={`min-h-11 cursor-pointer rounded-lg border px-3 text-left text-[14px] font-semibold transition-colors ${
                      selectedGoals.includes(goal)
                        ? "border-[var(--ink)] bg-[var(--ink)] text-[#fcfbf8]"
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
              <h2 id="setup-title" className="m-0 text-[22px] leading-tight font-semibold text-[var(--ink)]">Quick walkthrough</h2>
              <div className="mt-5 grid gap-3">
                {[
                  ["Maps", "Open a map to compare picks, wins, and win rate."],
                  ["Brawlers", "Use cards and modals for abilities and performance."],
                  ["Brawl AI", "Ask questions when you want a fast read."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] p-4">
                    <p className="m-0 text-[14px] font-semibold text-[var(--ink)]">{title}</p>
                    <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(current => Math.max(0, current - 1))}
              disabled={step === 0}
              className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[var(--line)] bg-transparent px-4 text-[13px] font-semibold text-[var(--ink-3)] disabled:cursor-default disabled:opacity-35"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => step === 2 ? finishSetup() : setStep(current => current + 1)}
              disabled={!canContinue}
              className="inline-flex h-10 cursor-pointer items-center rounded-lg border-0 bg-[var(--ink)] px-4 text-[13px] font-semibold text-[#fcfbf8] shadow-[var(--shadow-lift)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === 2 ? "Enter BrawlLens" : "Continue"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
