"use client"

import { useState, useEffect } from "react"
import MetaDashboard from "@/components/MetaDashboard"
import MapsSidebar from "@/components/MapsSidebar"

interface ModeInfo {
  mode: string
  totalBattles: number
}

export default function MapsPageClient() {
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [mapSearch, setMapSearch] = useState("")

  useEffect(() => {
    fetch("/api/meta")
      .then(r => r.json())
      .then(data => setModes(data.modes || []))
      .catch(() => {})
  }, [])

  return (
    <>
      <MapsSidebar
        modes={modes}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        mapSearch={mapSearch}
        setMapSearch={setMapSearch}
      />
      <main className="flex-1 min-w-0 pt-10 pb-16 px-8">
        <section className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">Brawl Stars Maps | Current Rotations</h1>
          <p className="text-white/60 text-sm leading-relaxed">Browse all active maps across game modes with best brawlers and win rates for each map. Powered by <span className="text-white/80 font-semibold">battle data from top-ranked players</span> across 6 regions.</p>
        </section>
        <MetaDashboard selectedMode={selectedMode} mapSearch={mapSearch} />
      </main>
    </>
  )
}
