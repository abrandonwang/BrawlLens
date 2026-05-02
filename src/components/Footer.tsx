"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <footer className="w-full bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-6 backdrop-blur-[18px] max-md:px-4 max-[360px]:px-3">
      <div className="mx-auto flex min-h-16 w-full max-w-[1200px] flex-nowrap items-center justify-between gap-4 py-4">
        <div className="flex min-w-0 flex-nowrap items-center gap-3">
          <p className="m-0 shrink-0 text-[14px] leading-tight font-semibold tracking-normal text-[var(--ink)]">BrawlLens</p>
          <p className="m-0 min-w-0 truncate text-[12px] leading-[1.45] tracking-[-0.01em] text-[var(--ink-3)]">
            Battle data, leaderboards, and brawler insight.
          </p>
        </div>

        <nav className="flex shrink-0 flex-nowrap items-center justify-end gap-2 text-[12px] leading-none tracking-normal">
          <Link
            href="/about"
            className="inline-flex min-h-8 items-center rounded-md px-2.5 font-normal text-[var(--ink-3)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
          >
            About
          </Link>
          <span className="px-1 text-[var(--ink-4)]">© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
