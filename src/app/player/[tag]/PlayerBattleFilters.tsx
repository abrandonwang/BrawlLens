"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Check, ChevronDown, Filter } from "lucide-react"

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

  const allModes = [{ label: "All modes", value: "all" }, ...modes]
  const activeMode = allModes.find(option => option.value === mode) ?? allModes[0]

  return (
    <div ref={rootRef} className="bl-profile-battle-shell">
      <section className="bl-pf-filterbar" aria-label="Battle filters">
        <div className="bl-pf-tabs" role="group" aria-label="Battle result filter">
          {outcomeOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setOutcome(option.value)}
              className={`bl-pf-tab ${outcome === option.value ? "is-active" : ""}`}
              aria-pressed={outcome === option.value}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div ref={dropdownRef} className="bl-pf-dd">
          <button
            type="button"
            className="bl-pf-dd-trigger"
            onClick={() => setIsOpen(open => !open)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <Filter size={13} aria-hidden="true" className="bl-pf-dd-icon" />
            <span className="bl-pf-dd-label">{activeMode.label}</span>
            <ChevronDown size={14} aria-hidden="true" className="bl-pf-dd-chev" />
          </button>
          <div
            className={`bl-pf-dd-menu ${isOpen ? "is-open" : ""}`}
            role="listbox"
            aria-hidden={!isOpen}
          >
            {allModes.map(option => {
              const active = mode === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`bl-pf-dd-item ${active ? "is-active" : ""}`}
                  onClick={() => {
                    setMode(option.value)
                    setIsOpen(false)
                  }}
                >
                  <span>{option.label}</span>
                  {active && <Check size={13} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="bl-profile-match-list" id="battles">
        {children}
      </div>
    </div>
  )
}
