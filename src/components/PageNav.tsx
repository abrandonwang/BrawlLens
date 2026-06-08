"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

// Ordered ring of primary destinations — used to compute the "Next" recommendation.
const ROUTE_RING = [
  { path: "/", label: "Home" },
  { path: "/meta", label: "Map Tierlist" },
  { path: "/brawlers", label: "Brawler Tierlist" },
  { path: "/leaderboards/players", label: "Player Rankings" },
  { path: "/leaderboards/clubs", label: "Club Rankings" },
  { path: "/leaderboards/brawlers", label: "Brawler Rankings" },
  { path: "/leaderboards/pro", label: "Pro Teams" },
] as const

const HIDDEN_PATHS = new Set([
  "/",
  "/login",
  "/auth",
  "/auth/setup",
  "/auth/callback",
  "/ask",
])

function ringIndexForPath(pathname: string): number {
  const exact = ROUTE_RING.findIndex(r => r.path === pathname)
  if (exact !== -1) return exact
  let best = -1
  let bestLen = -1
  ROUTE_RING.forEach((r, i) => {
    if (r.path !== "/" && pathname.startsWith(r.path + "/") && r.path.length > bestLen) {
      best = i
      bestLen = r.path.length
    }
  })
  return best
}

function readableLabel(pathname: string) {
  if (pathname === "/") return "Home"
  if (pathname === "/meta") return "Map Tierlist"
  if (pathname.startsWith("/meta/")) return "Map"
  if (pathname === "/brawlers") return "Brawler Tierlist"
  if (pathname.startsWith("/brawlers/")) return "Brawler"
  if (pathname === "/leaderboards/players") return "Player Rankings"
  if (pathname === "/leaderboards/clubs") return "Club Rankings"
  if (pathname === "/leaderboards/brawlers") return "Brawler Rankings"
  if (pathname === "/leaderboards/pro") return "Pro Teams"
  if (pathname.startsWith("/leaderboards/pro/")) return "Pro Team"
  if (pathname.startsWith("/leaderboards")) return "Leaderboards"
  if (pathname.startsWith("/player/")) return "Player"
  if (pathname.startsWith("/guides")) return "Guides"
  if (pathname === "/about") return "About"
  if (pathname === "/contact") return "Contact"
  if (pathname === "/dashboard") return "Dashboard"
  return "Back"
}

// Sensible parent route per known section — used when no in-app history exists.
function parentFor(pathname: string): { href: string; label: string } {
  if (pathname.startsWith("/player/") && pathname.endsWith("/brawlers")) {
    const base = pathname.replace(/\/brawlers$/, "")
    return { href: base, label: "Player" }
  }
  if (pathname.startsWith("/player/")) return { href: "/leaderboards/players", label: "Player Rankings" }
  if (pathname.startsWith("/meta/")) return { href: "/meta", label: "Map Tierlist" }
  if (pathname.startsWith("/brawlers/")) return { href: "/brawlers", label: "Brawler Tierlist" }
  if (pathname.startsWith("/leaderboards/pro/")) return { href: "/leaderboards/pro", label: "Pro Teams" }
  if (pathname.startsWith("/leaderboards/clubs/")) return { href: "/leaderboards/clubs", label: "Club Rankings" }
  if (pathname.startsWith("/leaderboards/brawlers/")) return { href: "/leaderboards/brawlers", label: "Brawler Rankings" }
  if (pathname.startsWith("/guides/")) return { href: "/guides", label: "Guides" }
  return { href: "/", label: "Home" }
}

type BackTarget = { href: string; label: string; useHistory: boolean }

export default function PageNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [back, setBack] = useState<BackTarget>(() => {
    const parent = parentFor(pathname)
    return { ...parent, useHistory: false }
  })

  useEffect(() => {
    // Re-derive parent on path change as the initial fallback.
    const parent = parentFor(pathname)
    let next: BackTarget = { ...parent, useHistory: false }

    try {
      if (document.referrer) {
        const referrer = new URL(document.referrer)
        if (referrer.origin === window.location.origin && referrer.pathname !== pathname) {
          next = {
            href: `${referrer.pathname}${referrer.search}${referrer.hash}`,
            label: readableLabel(referrer.pathname),
            useHistory: true,
          }
        }
      }
    } catch {
      // ignore — keep parent fallback
    }

    setBack(next)
  }, [pathname])

  if (HIDDEN_PATHS.has(pathname) || pathname.startsWith("/account") || pathname.startsWith("/guides")) return null

  const ringIdx = ringIndexForPath(pathname)
  const nextEntry = ringIdx >= 0
    ? ROUTE_RING[(ringIdx + 1) % ROUTE_RING.length]
    : ROUTE_RING[1]

  const isTierlist =
    pathname === "/meta" ||
    pathname.startsWith("/meta/") ||
    pathname === "/brawlers" ||
    pathname.startsWith("/brawlers/")
  const scopeClass = isTierlist ? "bl-page-nav--tier" : "bl-page-nav--lb"

  const handleBack = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow modifier keys / middle-click to open in new tab via the default Link behavior.
    if (event.defaultPrevented) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return

    if (back.useHistory && typeof window !== "undefined" && window.history.length > 1) {
      event.preventDefault()
      router.back()
    }
    // else: let the <Link> navigate normally to back.href
  }

  return (
    <nav className={`bl-page-nav ${scopeClass}`} aria-label="Page navigation">
      <Link
        href={back.href}
        className="bl-page-nav-link bl-page-nav-back"
        prefetch={false}
        onClick={handleBack}
      >
        <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
        <span>{back.label}</span>
      </Link>

      <Link
        href={nextEntry.path}
        className="bl-page-nav-link bl-page-nav-next"
        prefetch={false}
        data-no-transition={pathname === nextEntry.path ? "" : undefined}
      >
        <span>{nextEntry.label}</span>
        <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </nav>
  )
}
