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
      className={`bl-footer w-full px-[30px] text-[#5f5f5d] max-lg:px-5 max-sm:px-4 ${isLandingPage ? "border-t-0 bg-transparent" : "border-t-0 bg-[#f7f4ed]"}`}
    >
      <div className="flex min-h-[50px] w-full items-center gap-8 max-lg:min-h-[86px] max-lg:flex-wrap max-lg:items-start max-lg:gap-x-5 max-lg:gap-y-3 max-lg:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 max-lg:min-w-full">
          <p className="m-0 max-w-[760px] text-[11.5px] font-medium leading-[1.4] tracking-[-0.005em] text-[#5f5f5d]">
            &copy; BrawlLens 2026
          </p>
        </div>

        <nav className="flex shrink-0 items-center gap-[22px] text-[11.5px] font-semibold leading-none text-[#1c1c1c] max-md:flex-wrap max-md:gap-x-4 max-md:gap-y-2" aria-label="Footer links">
          {footerLinks.map(link => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="whitespace-nowrap text-[#1c1c1c] no-underline transition-colors duration-150 hover:text-[#1f4f9a]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

      </div>
    </footer>
  )
}
