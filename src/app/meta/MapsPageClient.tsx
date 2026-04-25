"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
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

  useEffect(() => {
    fetch("/api/meta")
      .then(r => r.json())
      .then(data => { setModes(data.modes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page-layout">

<div className="bl-input" style={{ width: 280, marginBottom: 12 }}>
        <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
        <input value={mapSearch} onChange={e => setMapSearch(e.target.value)} placeholder="Search maps" />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 36, flexWrap: "wrap" }}>
        <button
          onClick={() => setSelectedMode(null)}
          className="bl-btn bl-btn-sm"
          style={!selectedMode ? { background: "var(--elev)", borderColor: "var(--line-2)" } : {}}
        >
          All Modes
        </button>
        {modes.map(m => {
          const color = MODE_CONFIG[m.mode]?.color
          return (
            <button
              key={m.mode}
              onClick={() => setSelectedMode(selectedMode === m.mode ? null : m.mode)}
              className="bl-btn bl-btn-sm"
              style={selectedMode === m.mode ? { background: "var(--elev)", borderColor: "var(--line-2)" } : {}}
            >
              {color && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />}
              {getModeName(m.mode)}
            </button>
          )
        })}
      </div>

      <MetaDashboard modes={modes} loading={loading} selectedMode={selectedMode} mapSearch={mapSearch} />
    </div>
  )
}
