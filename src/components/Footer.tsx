"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const footerLinks: { label: string; href: string }[] = [
  { label: "Help", href: "/guides" },
]

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith("/account")) return null
  const isLandingPage = pathname === "/"

  return (
    <footer
      data-landing={isLandingPage ? "true" : undefined}
      className={`bl-footer w-full px-[30px] text-[#5f5f5d] max-lg:px-5 max-sm:px-4 ${isLandingPage ? "border-t-0 bg-transparent" : "border-t-0 bg-[#0d0d11]"}`}
    >
      <div className="flex h-[44px] w-full items-center justify-between gap-4">
        {isLandingPage ? <span aria-hidden="true" /> : (
          <p className="m-0 truncate text-[11.5px] font-medium leading-none tracking-[-0.005em] text-[#5f5f5d]">
            &copy; BrawlLens 2026
          </p>
        )}

        <nav className="flex shrink-0 items-center gap-5 text-[11.5px] font-semibold leading-none text-[#f5f4f1]" aria-label="Footer links">
          {footerLinks.map(link => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="whitespace-nowrap text-[#f5f4f1] no-underline transition-colors duration-150 hover:text-[#1e73d8]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
