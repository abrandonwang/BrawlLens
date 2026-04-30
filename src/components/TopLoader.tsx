"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

export default function TopLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const startedRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const queuedStartRef = useRef<number | null>(null)
  const routeKeyRef = useRef("")

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
    if (queuedStartRef.current !== null) {
      window.clearTimeout(queuedStartRef.current)
      queuedStartRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    clearTimers()
    startedRef.current = true
    setVisible(true)
    timersRef.current.push(window.setTimeout(() => {
      if (startedRef.current) {
        setVisible(false)
        startedRef.current = false
      }
    }, 4000))
  }, [clearTimers])

  const queueStart = useCallback(() => {
    if (queuedStartRef.current !== null || startedRef.current) return
    queuedStartRef.current = window.setTimeout(() => {
      queuedStartRef.current = null
      start()
    }, 0)
  }, [start])

  const done = useCallback(() => {
    if (!startedRef.current) return
    clearTimers()
    timersRef.current.push(window.setTimeout(() => {
      setVisible(false)
      startedRef.current = false
    }, 260))
  }, [clearTimers])

  useEffect(() => {
    const sameOrigin = window.location.origin
    routeKeyRef.current = `${window.location.pathname}${window.location.search}`

    function shouldStart(url: string) {
      try {
        const next = new URL(url, sameOrigin)
        const current = new URL(window.location.href)
        return next.origin === sameOrigin && (next.pathname !== current.pathname || next.search !== current.search)
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

    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState

    window.history.pushState = function patchedPushState(data, unused, url) {
      if (typeof url === "string" && shouldStart(url)) queueStart()
      return originalPushState.call(this, data, unused, url)
    }

    window.history.replaceState = function patchedReplaceState(data, unused, url) {
      if (typeof url === "string" && shouldStart(url)) queueStart()
      return originalReplaceState.call(this, data, unused, url)
    }

    function onPopState() {
      const nextKey = `${window.location.pathname}${window.location.search}`
      if (nextKey !== routeKeyRef.current) {
        queueStart()
      } else {
        done()
      }
    }

    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPopState)
    window.addEventListener("hashchange", done)

    return () => {
      clearTimers()
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPopState)
      window.removeEventListener("hashchange", done)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [clearTimers, done, queueStart])

  useEffect(() => {
    if (typeof window !== "undefined") {
      routeKeyRef.current = `${window.location.pathname}${window.location.search}`
    }
    done()
  }, [pathname, searchParams, done])

  return (
    <div className={`site-loader ${visible ? "is-visible" : ""}`} aria-hidden="true">
      <div className="site-loader-mark" />
      <div className="site-loader-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
