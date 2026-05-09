"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Star } from "lucide-react"
import AssistantPopup from "@/components/AssistantPopup"

export type TierlistSection = "brawlers" | "maps"

const tabs = [
  { key: "brawlers", label: "Brawlers", href: "/brawlers" },
  { key: "maps", label: "Maps", href: "/meta" },
  { key: "guide", label: "Guide" },
] as const

export default function TierlistSubNav({ active }: { active: TierlistSection }) {
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [isStuck, setIsStuck] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let frame = 0

    const updateStuckState = () => {
      frame = 0
      const slotTop = slotRef.current?.getBoundingClientRect().top ?? 1
      setIsStuck(current => {
        const next = slotTop <= 0
        return current === next ? current : next
      })
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateStuckState)
    }

    updateStuckState()
    window.addEventListener("scroll", requestUpdate, { passive: true })
    window.addEventListener("resize", requestUpdate)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", requestUpdate)
      window.removeEventListener("resize", requestUpdate)
    }
  }, [])

  return (
    <>
      <div ref={slotRef} className={`bl-lb-subnav-slot ${isStuck ? "bl-lb-subnav-slot-stuck" : ""}`}>
        <div className="bl-lb-subnav-wrap">
          <nav aria-label="Tierlist sections" className="bl-lb-subnav">
            {tabs.map(tab => {
              if (tab.key === "guide") {
                return (
                  <span key={tab.key} className="bl-lb-tab bl-lb-tab-disabled" aria-disabled="true">
                    <span>{tab.label}</span>
                  </span>
                )
              }

              const isActive = tab.key === active
              return (
                <Link key={tab.key} href={tab.href} className={`bl-lb-tab ${isActive ? "bl-lb-tab-active" : ""}`}>
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
      {mounted && createPortal(
        <button
          type="button"
          className="bl-ai-float"
          aria-label="Ask AI"
          aria-haspopup="dialog"
          aria-expanded={assistantOpen}
          title="Ask AI"
          onClick={() => setAssistantOpen(true)}
        >
          <Star size={18} strokeWidth={2.4} fill="currentColor" />
        </button>,
        document.body,
      )}
      <AssistantPopup open={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </>
  )
}
