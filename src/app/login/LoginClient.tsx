"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { storeAuthSession } from "@/lib/clientAuth"
import { isEmailFormatValid, useEmailCheck } from "@/lib/useEmailCheck"

type LoginState = "idle" | "sending" | "sent" | "error"
type AuthMode = "signup" | "login"

function passwordRules(password: string) {
  return [
    { label: "8+ characters", passed: password.length >= 8 },
    { label: "Contains a number", passed: /\d/.test(password) },
  ]
}

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<AuthMode>(searchParams.get("mode") === "login" ? "login" : "signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<LoginState>("idle")
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailCheck = useEmailCheck(email, mode === "signup")
  const emailFormatValid = isEmailFormatValid(email)
  const emailReady = mode === "signup" ? emailCheck.isValid : emailFormatValid
  const emailStatus = mode === "signup"
    ? emailCheck.status
    : email.trim().length === 0
      ? "idle"
      : emailFormatValid
        ? "valid"
        : "format"
  const emailMessage = mode === "signup"
    ? emailCheck.message
    : email.trim().length === 0
      ? "Enter your account email."
      : emailFormatValid
        ? "Ready to log in."
        : "Enter a valid email format."
  const rules = passwordRules(password)
  const passwordValid = rules.every(rule => rule.passed)
  const canSubmit = emailReady && passwordValid && state !== "sending"

  async function sendAuthRequest(options?: { resend?: boolean }) {
    if (!emailReady) {
      setState("error")
      setError(mode === "signup" ? emailCheck.message : "Enter a valid email address.")
      return
    }
    if (!passwordValid) {
      setState("error")
      setError("Password needs at least 8 characters and one number.")
      return
    }

    if (options?.resend) {
      setResending(true)
    } else {
      setState("sending")
    }
    setError(null)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode }),
    }).catch(() => null)

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null) as { error?: string } | null
      setState("error")
      setError(payload?.error === "weak_password"
        ? "Password needs at least 8 characters and one number."
        : payload?.error === "disposable_domain"
          ? "Use a permanent email address."
        : payload?.error === "invalid_email"
          ? "Enter a valid email address."
        : payload?.error === "email_unreachable"
          ? "Use a real email address with an active mail server."
        : payload?.error === "custom_email_not_configured"
          ? "BrawlLens email is not configured yet."
        : payload?.error === "setup_link_generation_failed"
          ? "Supabase could not generate the setup link."
        : payload?.error === "magic_link_email_failed"
          ? "Resend could not send from that email address."
        : payload?.error === "invalid_credentials"
          ? "Email or password did not match."
        : payload?.error === "auth_not_configured"
          ? "BrawlLens auth is not configured yet."
        : "Account setup is not available right now.")
      setResending(false)
      return
    }

    const payload = await response.json().catch(() => null) as {
      session?: { accessToken?: string; refreshToken?: string; expiresAt?: number }
    } | null

    if (mode === "login") {
      if (!payload?.session?.accessToken) {
        setState("error")
        setError("BrawlLens could not start your session.")
        setResending(false)
        return
      }
      storeAuthSession({
        accessToken: payload.session.accessToken,
        refreshToken: payload.session.refreshToken,
        expiresAt: payload.session.expiresAt,
      })
      router.replace(searchParams.get("next") || "/")
      return
    }

    setState("sent")
    setResending(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendAuthRequest()
  }

  function chooseMode(nextMode: AuthMode) {
    setMode(nextMode)
    setState("idle")
    setError(null)
    setResending(false)
  }

  return (
    <main className="mx-auto flex w-full max-w-[500px] flex-1 flex-col justify-center px-4 py-14">
      <div className="rounded-[18px] border border-[#8bd7ff]/15 bg-[#0d1016] p-6 shadow-[0_26px_90px_-46px_rgba(139,215,255,0.55),0_1px_0_rgba(255,255,255,0.06)_inset]">
        <div className="mb-5">
          <h1 className="m-0 text-[28px] font-extrabold leading-[1.05] tracking-0 text-[var(--ink)]">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 mb-0 text-[14px] leading-relaxed text-[var(--ink-3)]">
            {mode === "signup" ? "Save your Lensboard profile and keep your workspace synced." : "Log in to return to your Lensboard workspace."}
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-[10px] border border-white/[0.09] bg-[#151923] p-1">
          {[
            { id: "signup" as const, label: "Create" },
            { id: "login" as const, label: "Log in" },
          ].map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => chooseMode(item.id)}
              className={`h-9 cursor-pointer rounded-md border-0 text-[13px] font-bold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#8bd7ff]/25 ${mode === item.id ? "bg-[#8bd7ff] text-[#061018]" : "bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {state === "sent" && mode === "signup" ? (
          <div className="mt-6">
            <div className="rounded-[12px] border border-[#8bd7ff]/14 bg-[#151923] px-4 py-4">
              <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Check your inbox</p>
              <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">
                We sent a setup link to <strong className="font-semibold text-[var(--ink)]">{email}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void sendAuthRequest({ resend: true })}
              disabled={resending}
              className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-[var(--line)] bg-transparent px-4 text-[14px] font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--hover-bg)] disabled:cursor-wait disabled:opacity-60"
            >
              {resending ? "Sending again..." : "Didn't receive an email? Resend"}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-[var(--ink-4)]">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={event => {
                  setEmail(event.target.value)
                  if (state !== "sending") {
                    setState("idle")
                    setError(null)
                  }
                }}
                className="h-11 w-full rounded-lg border border-white/[0.10] bg-[#11151d] px-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[#8bd7ff]/45"
                placeholder="you@example.com"
              />
              {mode === "signup" && (
                <div className={`mt-2 flex items-center gap-2 text-[11px] leading-none ${emailStatus === "valid" ? "text-[var(--ink)]" : emailStatus === "idle" || emailStatus === "checking" ? "text-[var(--ink-4)]" : "text-[var(--ink-2)]"}`}>
                  <span className={`grid size-3.5 place-items-center rounded-full border text-[9px] ${emailStatus === "valid" ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-on)]" : emailStatus === "checking" ? "animate-pulse border-[var(--line-2)] bg-[var(--line)] text-transparent" : emailStatus === "idle" ? "border-[var(--line-2)] text-transparent" : "border-[var(--ink-2)] text-[var(--ink-2)]"}`}>
                    {emailStatus === "valid" ? "✓" : emailStatus === "invalid" || emailStatus === "format" ? "!" : ""}
                  </span>
                  {emailMessage}
                </div>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] text-[var(--ink-4)]">Password</span>
              <input
                type="password"
                required
                minLength={8}
                pattern="(?=.*[0-9]).{8,}"
                value={password}
                onChange={event => {
                  setPassword(event.target.value)
                  if (state !== "sending") {
                    setState("idle")
                    setError(null)
                  }
                }}
                className="h-11 w-full rounded-lg border border-white/[0.10] bg-[#11151d] px-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[#8bd7ff]/45"
                placeholder="8+ characters, include a number"
              />
              {mode === "signup" && (
                <div className="mt-2 grid gap-1">
                  {rules.map(rule => (
                    <div key={rule.label} className={`flex items-center gap-2 text-[11px] leading-none ${rule.passed ? "text-[var(--ink)]" : "text-[var(--ink-4)]"}`}>
                      <span className={`grid size-3.5 place-items-center rounded-full border text-[9px] ${rule.passed ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-on)]" : "border-[var(--line-2)] text-transparent"}`}>✓</span>
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </label>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border-0 bg-[#8bd7ff] px-4 text-[14px] font-extrabold text-[#061018] shadow-[0_14px_32px_-22px_rgba(139,215,255,0.9)] transition-[filter,opacity] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "sending" ? (mode === "login" ? "Logging in..." : "Sending...") : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        )}

        {state === "error" && (
          <p className="mt-4 mb-0 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[13px] text-[var(--ink-2)]">
            {error}
          </p>
        )}

        <Link href="/" className="mt-5 inline-flex text-[13px] text-[var(--ink-3)] no-underline hover:text-[var(--ink)]">
          Back to Lensboard
        </Link>
      </div>
    </main>
  )
}
