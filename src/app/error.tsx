"use client"

import { useEffect } from "react"
import Link from "next/link"

const stateActionClass = "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-transparent bg-[var(--ink)] px-4 text-[14px] font-normal text-[#fcfbf8] no-underline shadow-[var(--shadow-lift)] active:scale-95 hover:bg-[var(--accent-focus)]"

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
      <div className="mb-3 font-mono text-[14px] leading-normal tracking-normal text-[var(--ink-4)]">ERROR</div>
      <h1 className="m-0 text-[28px] font-bold tracking-tight text-[var(--ink)]">Something went wrong</h1>
      <p className="mt-3 max-w-[440px] text-[14px] leading-relaxed text-[var(--ink-3)]">
        An unexpected error occurred while loading this page. Try again, or go back to the home page.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-[var(--ink-4)]">ref: {error.digest}</p>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <button type="button" onClick={reset} className={stateActionClass}>Try again</button>
        <Link href="/" className={stateActionClass}>Home</Link>
      </div>
    </main>
  )
}
