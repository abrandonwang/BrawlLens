"use client"

import { Search } from "lucide-react"

// ─── Mode display config ────────────────────────────────────────
const MODE_CONFIG: Record<string, { label: string; color: string }> = {
  brawlBall: { label: "Brawl Ball", color: "#8CA0EB" },
  gemGrab: { label: "Gem Grab", color: "#9B59B6" },
  knockout: { label: "Knockout", color: "#F9C74F" },
  bounty: { label: "Bounty", color: "#2ECC71" },
  heist: { label: "Heist", color: "#E74C3C" },
  hotZone: { label: "Hot Zone", color: "#E67E22" },
  wipeout: { label: "Wipeout", color: "#1ABC9C" },
  duels: { label: "Duels", color: "#E84393" },
  siege: { label: "Siege", color: "#636E72" },
  soloShowdown: { label: "Showdown", color: "#2ECC71" },
  duoShowdown: { label: "Duo SD", color: "#00B894" },
  trioShowdown: { label: "Trio SD", color: "#55E6C1" },
  payload: { label: "Payload", color: "#6C5CE7" },
  basketBrawl: { label: "Basket Brawl", color: "#E17055" },
  volleyBrawl: { label: "Volley Brawl", color: "#FDCB6E" },
  botDrop: { label: "Bot Drop", color: "#636E72" },
  hunters: { label: "Hunters", color: "#D63031" },
  trophyEscape: { label: "Trophy Escape", color: "#00CEC9" },
  paintBrawl: { label: "Paint Brawl", color: "#A29BFE" },
  wipeout5V5: { label: "5v5 Wipeout", color: "#1ABC9C" },
}

function getModeName(mode: string): string {
  return MODE_CONFIG[mode]?.label || mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, " $1")
}

function getModeColor(mode: string): string {
  return MODE_CONFIG[mode]?.color || "#ffffff"
}

// ─── Types ──────────────────────────────────────────────────────
interface ModeInfo {
  mode: string
  totalBattles: number
}

interface Props {
  modes: ModeInfo[]
  selectedMode: string | null
  setSelectedMode: (mode: string | null) => void
  mapSearch: string
  setMapSearch: (s: string) => void
}

const linkBase = "font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm text-left"
const linkInactive = `${linkBase} text-white/70 hover:text-white hover:bg-white/5`
const linkActive = `${linkBase} bg-[#FFD400] text-black`

export default function MapsSidebar({ modes, selectedMode, setSelectedMode, mapSearch, setMapSearch }: Props) {
  return (
    <aside className="w-64 shrink-0 sticky top-0 h-screen border-r border-white/10 py-10 px-5 flex flex-col gap-1.5 overflow-y-auto">
      {/* Search */}
      <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 mb-4">
        <Search size={13} className="text-white/60 shrink-0" />
        <input
          value={mapSearch}
          onChange={e => setMapSearch(e.target.value)}
          placeholder="Search maps"
          className="bg-transparent text-xs text-white outline-none placeholder:text-white/40 w-full"
        />
      </div>

      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1">Mode</p>

      {/* All button */}
      <button
        onClick={() => setSelectedMode(null)}
        className={selectedMode === null ? linkActive : linkInactive}
      >
        [ All ]
      </button>

      {/* Mode buttons */}
      {modes.map((m) => {
        const isActive = selectedMode === m.mode
        const color = getModeColor(m.mode)
        return (
          <button
            key={m.mode}
            onClick={() => setSelectedMode(isActive ? null : m.mode)}
            className={isActive ? linkBase : linkInactive}
            style={isActive ? { backgroundColor: `${color}20`, color } : undefined}
          >
            [ {getModeName(m.mode)} ]
          </button>
        )
      })}
    </aside>
  )
}
