"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

export default function Footer() {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <footer className="w-full border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_86%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 w-full max-w-[1180px] items-center justify-between gap-6 px-[clamp(16px,3vw,32px)] py-4 max-sm:flex-col max-sm:items-start max-sm:gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[13px] font-semibold text-[var(--ink)]">BrawlLens</p>
          <p className="mt-1 mb-0 text-[11.5px] leading-snug text-[var(--ink-3)]">
            Battle data, leaderboards, and brawler insight.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5">
          {[
            ["About", "/about"],
            ["Privacy", "/about?section=privacy-policy"],
            ["Contact", "/about?section=contact"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-[var(--ink-3)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
            >
              {label}
            </Link>
          ))}
          <span className="px-1 text-[11px] text-[var(--ink-4)]">© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
