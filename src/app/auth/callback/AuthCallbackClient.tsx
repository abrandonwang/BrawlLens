"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { storeAuthSessionFromHash, syncServerSession } from "@/lib/clientAuth"

export default function AuthCallbackClient() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""))
    const authError = params.get("error_description") ?? params.get("error")
    if (authError) {
      setError(authError)
      return
    }

    const session = storeAuthSessionFromHash(window.location.hash)
    if (!session) {
      setError("The sign-in link did not include a usable session.")
      return
    }

    syncServerSession(session)
      .then(() => router.replace("/account"))
      .catch(() => setError("Your session was valid, but the account cookie could not be created."))
  }, [router])

  return (
    <main className="mx-auto grid min-h-[50vh] w-full max-w-[520px] place-items-center px-4 py-14">
      <div className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 text-center shadow-[var(--shadow-lift)]">
        <p className="m-0 text-[15px] font-semibold text-[var(--ink)]">
          {error ? "Sign-in link failed" : "Signing you in..."}
        </p>
        {error && (
          <>
            <p className="mx-auto mt-2 mb-0 max-w-[360px] text-[13px] leading-relaxed text-[var(--ink-3)]">{error}</p>
            <Link href="/login" className="mt-5 inline-flex h-10 items-center rounded-lg bg-[var(--ink)] px-4 text-[14px] text-[#fcfbf8] no-underline">
              Try again
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
