"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const footerLinks: { label: string; href: string }[] = [
  { label: "Players", href: "/leaderboards/players" },
  { label: "Clubs", href: "/leaderboards/clubs" },
  { label: "Brawlers", href: "/brawlers" },
  { label: "Maps", href: "/meta" },
  { label: "Guides", href: "/guides" },
]

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith("/account")) return null

  return (
    <footer className="w-full border-t border-white/[0.04] bg-[#0a0d11] px-[30px] text-[#a3a6ad] max-lg:px-5 max-sm:px-4">
      <div className="flex min-h-[50px] w-full items-center gap-8 max-lg:min-h-[86px] max-lg:flex-wrap max-lg:items-start max-lg:gap-x-5 max-lg:gap-y-3 max-lg:py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 max-lg:min-w-full">
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap text-[11.5px] font-semibold leading-none text-[#6f737a] no-underline transition-colors duration-150 hover:text-[#e7e9ee]"
            aria-label="BrawlLens home"
          >
            BrawlLens
          </Link>
          <span aria-hidden className="hidden h-3 w-px bg-white/[0.08] sm:block" />
          <p className="m-0 max-w-[760px] text-[11.5px] font-medium leading-[1.4] tracking-[-0.005em] text-[#7d8392]">
            Not endorsed by Supercell.
          </p>
        </div>

        <nav className="flex shrink-0 items-center gap-[22px] text-[11.5px] font-semibold leading-none text-[#6f737a] max-md:flex-wrap max-md:gap-x-4 max-md:gap-y-2" aria-label="Footer links">
          {footerLinks.map(link => (
            <Link
              key={`${link.label}-${link.href}`}
              href={link.href}
              className="whitespace-nowrap text-[#6f737a] no-underline transition-colors duration-150 hover:text-[#e7e9ee]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

      </div>
    </footer>
  )
}
