"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <footer className="w-full px-6 pb-8 max-md:px-4 max-[360px]:px-3">
      <div className="mx-auto flex min-h-28 w-full max-w-[1200px] items-center justify-between gap-8 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-6 py-8 max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="m-0 text-[14px] leading-tight font-semibold tracking-normal text-[var(--ink)]">BrawlLens</p>
          <p className="m-0 max-w-[420px] text-[12px] leading-[1.45] tracking-[-0.01em] text-[var(--ink-3)]">
            Battle data, leaderboards, and brawler insight.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-2 text-[12px] leading-none tracking-normal max-sm:justify-start">
          <Link
            href="/about"
            className="rounded-md border border-[var(--line-2)] px-3 py-2 font-normal text-[var(--ink)] no-underline transition-colors hover:bg-[var(--hover-bg)]"
          >
            About
          </Link>
          <span className="px-1 text-[var(--ink-4)]">© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
