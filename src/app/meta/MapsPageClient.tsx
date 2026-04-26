"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import MetaDashboard from "@/components/MetaDashboard"

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

const MODE_CONFIG: Record<string, { label: string; color: string }> = {
  brawlBall:    { label: "Brawl Ball",    color: "#8CA0EB" },
  gemGrab:      { label: "Gem Grab",      color: "#9B59B6" },
  knockout:     { label: "Knockout",      color: "#F9C74F" },
  bounty:       { label: "Bounty",        color: "#2ECC71" },
  heist:        { label: "Heist",         color: "#E74C3C" },
  hotZone:      { label: "Hot Zone",      color: "#E67E22" },
  wipeout:      { label: "Wipeout",       color: "#1ABC9C" },
  duels:        { label: "Duels",         color: "#E84393" },
  siege:        { label: "Siege",         color: "#636E72" },
  soloShowdown: { label: "Showdown",      color: "#2ECC71" },
  duoShowdown:  { label: "Duo SD",        color: "#00B894" },
  trioShowdown: { label: "Trio SD",       color: "#55E6C1" },
  payload:      { label: "Payload",       color: "#6C5CE7" },
  basketBrawl:  { label: "Basket Brawl", color: "#E17055" },
  volleyBrawl:  { label: "Volley Brawl", color: "#FDCB6E" },
  botDrop:      { label: "Bot Drop",      color: "#636E72" },
  hunters:      { label: "Hunters",       color: "#D63031" },
  trophyEscape: { label: "Trophy Escape", color: "#00CEC9" },
  paintBrawl:   { label: "Paint Brawl",   color: "#A29BFE" },
  wipeout5V5:   { label: "5v5 Wipeout",   color: "#1ABC9C" },
}

function getModeName(mode: string): string {
  return MODE_CONFIG[mode]?.label || mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, " $1")
}

export default function MapsPageClient() {
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [mapSearch, setMapSearch] = useState("")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  const updateScrollState = useCallback(() => {
    const el = filtersRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = filtersRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState)
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [modes, updateScrollState])

  function scrollFilters(dir: "left" | "right") {
    filtersRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

  useEffect(() => {
    fetch("/api/meta")
      .then(r => r.json())
      .then(data => { setModes(data.modes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page-layout">

      <div className="roster-controls">
        <div className="bl-input roster-search">
          <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
          <input value={mapSearch} onChange={e => setMapSearch(e.target.value)} placeholder="Search maps" />
        </div>

        <div className="roster-filters-wrap">
          {canScrollLeft && (
            <button onClick={() => scrollFilters("left")} style={{ position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1, display: "flex", alignItems: "center", background: "linear-gradient(to right, var(--bg) 50%, transparent)", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: "0 14px 0 2px" }}>
              <ChevronLeft size={14} />
            </button>
          )}
          <div className="roster-filters" ref={filtersRef}>
            <div className="bl-seg" style={{ flexShrink: 0 }}>
              <button onClick={() => setSelectedMode(null)} className={!selectedMode ? "on" : ""}>
                All Modes
              </button>
              {modes.map(m => {
                const color = MODE_CONFIG[m.mode]?.color
                return (
                  <button
                    key={m.mode}
                    onClick={() => setSelectedMode(selectedMode === m.mode ? null : m.mode)}
                    className={selectedMode === m.mode ? "on" : ""}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    {color && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />}
                    {getModeName(m.mode)}
                  </button>
                )
              })}
            </div>
          </div>
          {canScrollRight && (
            <button onClick={() => scrollFilters("right")} style={{ position: "absolute", right: 0, top: 0, bottom: 0, zIndex: 1, display: "flex", alignItems: "center", background: "linear-gradient(to left, var(--bg) 50%, transparent)", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: "0 2px 0 14px" }}>
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      <MetaDashboard modes={modes} loading={loading} selectedMode={selectedMode} mapSearch={mapSearch} />
    </div>
  )
}
