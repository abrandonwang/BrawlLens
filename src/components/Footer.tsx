"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
  const pathname = usePathname()
  if (pathname === "/" || pathname.startsWith("/chat")) return null

  return (
    <footer className="w-full border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-[1080px] items-center justify-between gap-6 px-6 py-4 max-md:px-4 max-sm:flex-col max-sm:items-start max-sm:gap-3 max-[360px]:px-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="m-0 text-[13px] font-semibold text-[var(--ink)]">BrawlLens</p>
          <p className="m-0 text-[11.5px] leading-snug text-[var(--ink-3)]">
            Battle data, leaderboards, and brawler insight.
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-end gap-1.5 max-sm:justify-start">
          <Link
            href="/about"
            className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-[var(--ink-3)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
          >
            About
          </Link>
          <span className="px-1 text-[11px] text-[var(--ink-4)]">© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
