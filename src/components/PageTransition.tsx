"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

const ENTER_DURATION = 280
const HOLD_MIN = 140
const EXIT_DURATION = 360

type Phase = "idle" | "entering" | "exiting"

export default function PageTransition() {
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>("idle")
  const phaseRef = useRef<Phase>("idle")
  const enterStartRef = useRef(0)
  const exitTimerRef = useRef<number | null>(null)
  const idleTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const setPhaseSafe = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  // When pathname changes after an enter animation, schedule the exit.
  useEffect(() => {
    if (phaseRef.current !== "entering") return
    const elapsed = window.performance.now() - enterStartRef.current
    const wait = Math.max(0, ENTER_DURATION + HOLD_MIN - elapsed)

    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current)
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null
      setPhaseSafe("exiting")
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = null
        setPhaseSafe("idle")
      }, EXIT_DURATION)
    }, wait)
  }, [pathname, setPhaseSafe])

  // Click + popstate intercept fires the enter animation.
  useEffect(() => {
    function triggerEnter() {
      enterStartRef.current = window.performance.now()
      clearTimers()
      setPhaseSafe("entering")
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as Element | null
      const link = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!link) return
      if (link.target && link.target !== "_self") return
      if (link.hasAttribute("download")) return
      if (link.dataset.noTransition !== undefined) return
      let url: URL
      try {
        url = new URL(link.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      triggerEnter()
    }

    function onPopState() {
      triggerEnter()
    }

    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      clearTimers()
    }
  }, [clearTimers, setPhaseSafe])

  // Toggle global blur on <html> while the transition is visible.
  useEffect(() => {
    const html = document.documentElement
    if (phase === "idle") {
      html.classList.remove("bl-page-transition-open")
    } else {
      html.classList.add("bl-page-transition-open")
    }
    return () => {
      html.classList.remove("bl-page-transition-open")
    }
  }, [phase])

  if (phase === "idle") return null

  return (
    <div className={`bl-page-transition is-${phase}`} aria-hidden="true">
      <div className="bl-page-transition-veil" />
      <div className="bl-page-transition-loader" role="status" aria-label="Loading">
        <span className="bl-page-transition-dot" />
        <span className="bl-page-transition-dot" />
        <span className="bl-page-transition-dot" />
      </div>
    </div>
  )
}
