"use client"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navLinks: { label: string; href: string }[] = [
  { label: "Lensboard", href: "/" },
  { label: "Brawlers", href: "/brawlers" },
  { label: "Maps", href: "/meta" },
  { label: "Leaderboards", href: "/leaderboards/players" },
  { label: "About", href: "/about" },
]

export default function Footer() {
  const pathname = usePathname()
  if (pathname === "/" || pathname.startsWith("/account")) return null

  return (
    <footer className="w-full border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--bg)_92%,transparent)] px-6 backdrop-blur-[18px] max-md:px-4 max-[360px]:px-3">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <p className="m-0 shrink-0 text-[13px] font-semibold leading-none tracking-[-0.005em] text-[var(--ink)]">BrawlLens</p>
          <span aria-hidden className="text-[var(--ink-4)]">·</span>
          <p className="m-0 min-w-0 truncate text-[11.5px] leading-none text-[var(--ink-3)] max-sm:hidden">
            Battle data, leaderboards, and brawler insight.
          </p>
        </div>

        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-x-1 gap-y-1 text-[12px] leading-none">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-8 items-center rounded-md px-2.5 text-[var(--ink-3)] no-underline transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
          <span aria-hidden className="mx-1 hidden h-3 w-px bg-[var(--line-2)]/40 sm:block" />
          <span className="px-1 font-mono text-[11px] tabular-nums text-[var(--ink-4)]">© 2026</span>
        </nav>
      </div>
    </footer>
  )
}
