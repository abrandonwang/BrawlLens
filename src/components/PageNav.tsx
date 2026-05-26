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
  return "Previous"
}

type BackTarget = { href: string; label: string; history: boolean }

export default function PageNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [back, setBack] = useState<BackTarget>({ href: "/", label: "Home", history: false })

  useEffect(() => {
    try {
      if (!document.referrer) return
      const referrer = new URL(document.referrer)
      if (referrer.origin !== window.location.origin) return
      if (referrer.pathname === pathname) return
      setBack({
        href: `${referrer.pathname}${referrer.search}${referrer.hash}`,
        label: readableLabel(referrer.pathname),
        history: true,
      })
    } catch {
      // ignore
    }
  }, [pathname])

  if (HIDDEN_PATHS.has(pathname)) return null

  const ringIdx = ringIndexForPath(pathname)
  // For unknown paths, recommend the Map Tierlist as a sensible default.
  const nextEntry = ringIdx >= 0
    ? ROUTE_RING[(ringIdx + 1) % ROUTE_RING.length]
    : ROUTE_RING[1]

  // Tierlist & subpages get a wider rail to match their wider hero card.
  const isTierlist =
    pathname === "/meta" ||
    pathname.startsWith("/meta/") ||
    pathname === "/brawlers" ||
    pathname.startsWith("/brawlers/")
  const scopeClass = isTierlist ? "bl-page-nav--tier" : "bl-page-nav--lb"

  return (
    <nav className={`bl-page-nav ${scopeClass}`} aria-label="Page navigation">
      <button
        type="button"
        className="bl-page-nav-link bl-page-nav-back"
        onClick={() => {
          if (back.history && window.history.length > 1) {
            router.back()
            return
          }
          router.push(back.href)
        }}
      >
        <ArrowLeft size={13} strokeWidth={2.2} aria-hidden="true" />
        <span>{back.label}</span>
      </button>

      <Link
        href={nextEntry.path}
        className="bl-page-nav-link bl-page-nav-next"
        data-no-transition={pathname === nextEntry.path ? "" : undefined}
      >
        <span>{nextEntry.label}</span>
        <ArrowRight size={13} strokeWidth={2.2} aria-hidden="true" />
      </Link>
    </nav>
  )
}
