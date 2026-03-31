"use client"

import { useState, useEffect } from "react"
import MetaDashboard from "@/components/MetaDashboard"
import MapsSidebar from "@/components/MapsSidebar"

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
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
    <>
      <MapsSidebar
        modes={modes}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        mapSearch={mapSearch}
        setMapSearch={setMapSearch}
      />
      <main className="flex-1 min-w-0 pt-6 pb-6 px-8 overflow-y-auto">
        <section className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white mb-3">Maps</h1>
          <p className="text-zinc-500 dark:text-white/40 text-sm leading-relaxed">Win rates per brawler across every map, powered by battle data from top-ranked players across 6 regions.</p>
        </section>
        <MetaDashboard modes={modes} loading={loading} selectedMode={selectedMode} mapSearch={mapSearch} />
      </main>
    </>
  )
}
