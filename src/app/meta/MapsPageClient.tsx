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

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 rounded text-left whitespace-nowrap"
const linkInactive = `${linkBase} text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5`
const linkActive = `${linkBase} bg-red-500 text-white dark:bg-[#FFD400] dark:text-black`

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
    <div className="flex-1 flex flex-col">
      <main className="flex-1 min-w-0 pt-6 pb-10 px-8">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white mb-3">Maps</h1>
          <p className="text-zinc-500 dark:text-white/40 text-sm leading-relaxed mb-8">Win rates per brawler across every map, powered by battle data from top-ranked players across 6 regions.</p>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
            {/* Search */}
            <div className="flex items-center gap-2.5 bg-black/10 border border-black/20 rounded px-4 py-2.5 dark:bg-white/10 dark:border-white/20 w-full md:w-64">
              <Search size={13} className="text-zinc-500 shrink-0 dark:text-white/60" />
              <input
                value={mapSearch}
                onChange={e => setMapSearch(e.target.value)}
                placeholder="Search maps"
                className="bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 w-full dark:text-white dark:placeholder:text-white/40"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-row gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
              <button
                onClick={() => setSelectedMode(null)}
                className={selectedMode === null ? linkActive : linkInactive}
              >
                All
              </button>

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
                    {getModeName(m.mode)}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
        <MetaDashboard modes={modes} loading={loading} selectedMode={selectedMode} mapSearch={mapSearch} />
      </main>
    </div>
  )
}
