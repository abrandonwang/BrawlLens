"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.scrollingElement?.scrollTo?.(0, 0)
      document.body.scrollTo?.(0, 0)
      document.documentElement.scrollTo?.(0, 0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return null
}
