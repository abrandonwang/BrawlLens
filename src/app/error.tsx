"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center px-6 py-24 text-center">
      <div className="bl-mono bl-caption mb-3 text-[var(--ink-4)]">ERROR</div>
      <h1 className="m-0 text-[28px] font-bold tracking-tight text-[var(--ink)]">Something went wrong</h1>
      <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-[var(--ink-3)]">
        An unexpected error occurred while loading this page. Try again, or go back to the home page.
      </p>
      {error.digest && (
        <p className="bl-mono mt-2 text-[11px] text-[var(--ink-4)]">ref: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={reset} className="bl-state-action">Try again</button>
        <Link href="/" className="bl-state-action">Home</Link>
      </div>
    </main>
  )
}
