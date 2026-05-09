"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown, Filter } from "lucide-react"

type OutcomeFilter = "all" | "win" | "loss" | "neutral"

type ModeOption = {
  label: string
  value: string
}

const outcomeOptions: { label: string; value: OutcomeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Wins", value: "win" },
  { label: "Losses", value: "loss" },
  { label: "Draws", value: "neutral" },
]

export default function PlayerBattleFilters({
  modes,
  children,
}: {
  modes: ModeOption[]
  children: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [outcome, setOutcome] = useState<OutcomeFilter>("all")
  const [mode, setMode] = useState("all")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-battle-row]"))
    for (const row of rows) {
      const outcomeMatches = outcome === "all" || row.dataset.outcome === outcome
      const modeMatches = mode === "all" || row.dataset.mode === mode
      row.hidden = !(outcomeMatches && modeMatches)
    }

    const groups = Array.from(root.querySelectorAll<HTMLElement>(".bl-profile-day-group"))
    for (const group of groups) {
      const visibleRows = Array.from(group.querySelectorAll<HTMLElement>("[data-battle-row]")).some(row => !row.hidden)
      group.hidden = !visibleRows
    }
  }, [mode, outcome])

  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(event: PointerEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }

    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen])

  const activeMode = modes.find(option => option.value === mode)

  return (
    <div ref={rootRef} className="bl-profile-battle-shell">
      <section className="bl-lb-toolbar bl-profile-filter-row">
        <div className="bl-lb-region-pills bl-profile-segment" role="group" aria-label="Battle result filter">
          {outcomeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setOutcome(option.value)}
              className={outcome === option.value ? "is-active" : ""}
              aria-pressed={outcome === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div ref={dropdownRef} className="bl-profile-filter-menu">
          <button
            type="button"
            className="bl-profile-filter-button"
            onClick={() => setIsOpen(open => !open)}
            aria-expanded={isOpen}
          >
            <Filter size={16} />
            {activeMode?.label ?? "All modes"}
            <ChevronDown size={16} />
          </button>
          {isOpen && (
            <div className="bl-profile-filter-dropdown" role="menu">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={mode === "all"}
                className={mode === "all" ? "is-active" : ""}
                onClick={() => {
                  setMode("all")
                  setIsOpen(false)
                }}
              >
                All modes
              </button>
              {modes.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={mode === option.value}
                  className={mode === option.value ? "is-active" : ""}
                  onClick={() => {
                    setMode(option.value)
                    setIsOpen(false)
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="bl-profile-match-list" id="battles">
        {children}
      </div>
    </div>
  )
}
