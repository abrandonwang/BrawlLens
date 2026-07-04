"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Ensures the landing-page-only body background classes/inline styles are
 * stripped on every non-landing route. LandingClient adds `landing-bg`,
 * `home-landing-bg`, and inline body styles for its fullscreen hero — if the
 * user navigates away via SPA transitions, those can linger and block the
 * global ambient gradient defined in globals.css.
 */
export default function SiteBackdrop() {
  const pathname = usePathname()

  useEffect(() => {
    const isLanding = pathname === "/"
    if (isLanding) return

    const html = document.documentElement
    const body = document.body
    const mainShell = document.querySelector<HTMLElement>(".app-main-shell")

    html.classList.remove("landing-bg", "home-landing-bg")

    ;(["height", "min-height", "overflow", "overflow-y", "overscroll-behavior"] as const).forEach(property => {
      html.style.removeProperty(property)
      body.style.removeProperty(property)
    })

    // Force a flat black page background inline so it wins over any stale/cached
    // global gradient (Turbopack CSS caching) and lingering landing styles.
    html.style.setProperty("background", "#0a0a0d", "important")
    body.style.setProperty("background", "#0a0a0d", "important")
    body.style.setProperty("background-attachment", "fixed", "important")

    if (mainShell) {
      ;(["height", "min-height", "overflow"] as const).forEach(property => {
        mainShell.style.removeProperty(property)
      })
    }
  }, [pathname])

  return null
}
