"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"

type LoginState = "idle" | "sending" | "sent" | "error"

function validPassword(password: string) {
  return password.length >= 8 && /\d/.test(password)
}

export default function LoginClient() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<LoginState>("idle")
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendSetupLink(options?: { resend?: boolean }) {
    if (!validPassword(password)) {
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
      body: JSON.stringify({ email, password }),
    }).catch(() => null)

    if (!response?.ok) {
      const payload = await response?.json().catch(() => null) as { error?: string } | null
      setState("error")
      setError(payload?.error === "weak_password"
        ? "Password needs at least 8 characters and one number."
        : "Account setup is not available right now.")
      setResending(false)
      return
    }

    setState("sent")
    setResending(false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendSetupLink()
  }

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col justify-center px-4 py-14">
      <div className="rounded-[16px] border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lift)]">
        <p className="m-0 text-[12px] font-semibold uppercase text-[var(--ink-4)]">Account</p>
        <h1 className="mt-2 mb-2 text-[32px] leading-none font-semibold text-[var(--ink)]">Create account</h1>
        <p className="m-0 text-[14px] leading-relaxed text-[var(--ink-3)]">
          Set a password, then confirm your email to finish BrawlLens setup.
        </p>

        {state === "sent" ? (
          <div className="mt-6">
            <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)] px-4 py-4">
              <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">Check your inbox</p>
              <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--ink-3)]">
                We sent a setup link to <strong className="font-semibold text-[var(--ink)]">{email}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void sendSetupLink({ resend: true })}
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
                className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[var(--line-2)]"
                placeholder="you@example.com"
              />
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
                className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 text-[15px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-4)] focus:border-[var(--line-2)]"
                placeholder="8+ characters, include a number"
              />
              <span className="mt-1.5 block text-[11px] leading-relaxed text-[var(--ink-4)]">At least 8 characters and one number.</span>
            </label>
            <button
              type="submit"
              disabled={state === "sending"}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border-0 bg-[var(--ink)] px-4 text-[14px] font-semibold text-[#fcfbf8] shadow-[var(--shadow-lift)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "sending" ? "Sending..." : "Create account"}
            </button>
          </form>
        )}

        {state === "error" && (
          <p className="mt-4 mb-0 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-[13px] text-[var(--ink-2)]">
            {error}
          </p>
        )}

        <Link href="/" className="mt-5 inline-flex text-[13px] text-[var(--ink-3)] no-underline hover:text-[var(--ink)]">
          Back to dashboard
        </Link>
      </div>
    </main>
  )
}
