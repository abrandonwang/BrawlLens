"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"

type NavLink = { href: string; label: string }

const guideLinks: NavLink[] = [
  { href: "/guides", label: "Overview" },
  { href: "/guides/progression", label: "Progression" },
  { href: "/guides/brawlers", label: "Brawlers" },
  { href: "/guides/maps", label: "Maps" },
]

const toolLinks: NavLink[] = [
  { href: "/brawlers", label: "Brawler tierlist" },
  { href: "/meta", label: "Map tierlist" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/ask", label: "Ask AI" },
]

const accountLinks: NavLink[] = [
  { href: "/account", label: "Profile" },
  { href: "/help", label: "Help" },
]

function isActive(pathname: string, href: string) {
  if (href === "/guides") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavGroup({
  id,
  label,
  links,
  pathname,
  initialOpen = true,
}: {
  id: string
  label: string
  links: NavLink[]
  pathname: string
  initialOpen?: boolean
}) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <div className="bl-doc-nav-group">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="bl-doc-nav-header"
        aria-expanded={open}
        aria-controls={`bl-doc-nav-${id}`}
      >
        <span>{label}</span>
        <ChevronDown size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <div className="bl-doc-nav-list" data-open={open} id={`bl-doc-nav-${id}`}>
        <div>
          <nav aria-label={label}>
            {links.map(link => {
              const active = isActive(pathname, link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "is-active" : undefined}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default function GuideNav() {
  const pathname = usePathname()

  return (
    <aside className="bl-doc-nav" aria-label="Guide navigation">
      <NavGroup id="guides" label="Guides" links={guideLinks} pathname={pathname} />
      <NavGroup id="tools" label="Tools" links={toolLinks} pathname={pathname} />
      <NavGroup id="account" label="Account" links={accountLinks} pathname={pathname} />
    </aside>
  )
}
