"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

export default function TopLoader() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const startedRef = useRef(false)
  const startTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)

  const clearStartTimer = () => {
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current)
      startTimerRef.current = null
    }
  }

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const start = useCallback(() => {
    clearStartTimer()
    clearHideTimer()
    startedRef.current = true
    setVisible(true)
  }, [])

  const queueStart = useCallback(() => {
    if (startTimerRef.current !== null || startedRef.current) return
    startTimerRef.current = window.setTimeout(() => {
      startTimerRef.current = null
      start()
    }, 120)
  }, [start])

  const done = useCallback(() => {
    clearStartTimer()
    if (!startedRef.current) return
    clearHideTimer()
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      startedRef.current = false
      hideTimerRef.current = null
    }, 220)
  }, [])

  useEffect(() => {
    done()
  }, [pathname, done])

  useEffect(() => {
    const sameOrigin = window.location.origin

    function shouldStart(url: string) {
      try {
        const next = new URL(url, sameOrigin)
        const current = new URL(window.location.href)
        return next.origin === sameOrigin && next.pathname !== current.pathname
      } catch {
        return false
      }
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as Element | null
      const link = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!link || link.target || link.hasAttribute("download")) return
      if (shouldStart(link.href)) queueStart()
    }

    function onPopState() {
      done()
    }

    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      clearStartTimer()
      clearHideTimer()
    }
  }, [queueStart, done])

  return (
    <div className={`site-loader ${visible ? "is-visible" : ""}`} aria-hidden="true" />
  )
}
