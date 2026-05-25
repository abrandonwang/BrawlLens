"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const footerLinks: { label: string; href: string }[] = [
  { label: "Help", href: "/guides" },
]

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith("/account")) return null
  if (pathname === "/") return null
  const isLandingPage = false

  return (
    <footer
      data-landing={isLandingPage ? "true" : undefined}
      className={`app-footer w-full px-[30px] text-[var(--bt-muted)] max-lg:px-5 max-sm:px-4 ${isLandingPage ? "border-t-0 bg-transparent" : "border-t border-[var(--bt-line)] bg-[#090c14]"}`}
    >
      <div className="flex min-h-[64px] w-full items-center justify-between gap-4">
        {isLandingPage ? <span aria-hidden="true" /> : (
          <p className="m-0 truncate text-[11.5px] font-medium leading-none tracking-[-0.005em] text-[var(--lovable-muted)]">
            &copy; BrawlLens 2026
          </p>
        )}

        <nav className="flex shrink-0 items-center gap-5 text-[11.5px] font-semibold leading-none text-[#f5f4f1]" aria-label="Footer links">
          {footerLinks.map(link => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="inline-flex whitespace-nowrap rounded-none border-0 bg-transparent p-0 text-[var(--bt-text-2)] no-underline shadow-none transition-colors duration-150 hover:text-[var(--bt-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
