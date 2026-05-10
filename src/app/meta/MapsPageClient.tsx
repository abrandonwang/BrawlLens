"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, Search } from "lucide-react"
import HelpTooltip from "@/components/HelpTooltip"
import MetaDashboard from "@/components/MetaDashboard"
import { BrawlImage } from "@/components/BrawlImage"
import TierlistSubNav from "@/components/TierlistSubNav"
import { formatBrawlerName, normalizeMapName } from "@/lib/format"
import { getModeName } from "@/lib/modes"
import { useClickOutside } from "@/lib/useClickOutside"

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

interface CatalogBrawlerStat {
  id: number
  name: string
  picks: number
  wins: number
  winRate: number | null
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`
}

function formatFullNumber(value: number) {
  return value.toLocaleString("en-US")
}

export default function MapsPageClient() {
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [mapSearch, setMapSearch] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [spotlightTopBrawler, setSpotlightTopBrawler] = useState<{ id: number; name: string; picks: number; winRate: number } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    fetch("https://api.brawlify.com/v1/maps")
      .then(r => r.ok ? r.json() : { list: [] })
      .then(data => {
        const lookup = new Map<string, string>()
        for (const m of data.list || []) {
          lookup.set(m.name, m.imageUrl)
          lookup.set(normalizeMapName(m.name), m.imageUrl)
        }
        setMapImageLookup(lookup)
      })
      .catch(() => {})
  }, [])

  useClickOutside([searchDropdownRef, searchInputRef], () => setSearchOpen(false), searchOpen)
  useClickOutside(modeDropdownRef, () => setModeOpen(false), modeOpen)

  useEffect(() => {
    fetch("/api/meta")
      .then(r => r.json())
      .then(data => {
        const raw: ModeInfo[] = data.modes || []
        const cleaned = raw
          .filter(m => m.mode.toLowerCase() !== "unknown")
          .map(m => ({ ...m, maps: m.maps.filter(map => map.name.toLowerCase() !== "unknown") }))
          .filter(m => m.maps.length > 0)
        setModes(cleaned)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const [autoOpenHandled, setAutoOpenHandled] = useState(false)
  useEffect(() => {
    const openName = searchParams.get("open")
    if (!openName || loading || autoOpenHandled) return
    setAutoOpenHandled(true)
    router.replace(mapHref(openName))
  }, [loading, searchParams, autoOpenHandled, router])

  const spotlightMap = useMemo(() => {
    let best: { name: string; mode: string; battles: number } | null = null
    for (const m of modes) {
      for (const map of m.maps) {
        if (!best || map.battles > best.battles) best = { name: map.name, mode: m.mode, battles: map.battles }
      }
    }
    return best
  }, [modes])

  const totalBattlesAnalyzed = useMemo(() => {
    return modes.reduce((total, mode) => total + mode.totalBattles, 0)
  }, [modes])

  const allMapsList = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string; mode: string }[] = []
    for (const m of modes) {
      for (const map of m.maps) {
        if (!seen.has(map.name)) {
          seen.add(map.name)
          list.push({ name: map.name, mode: m.mode })
        }
      }
    }
    return list
  }, [modes])

  const searchMatches = useMemo(() => {
    const q = mapSearch.trim().toLowerCase()
    if (!q) return allMapsList
    return allMapsList.filter(m => m.name.toLowerCase().includes(q))
  }, [allMapsList, mapSearch])

  useEffect(() => {
    setSpotlightTopBrawler(null)
    fetch("/api/brawlers/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const stats = Object.values(d?.stats ?? {}) as CatalogBrawlerStat[]
        const top = stats
          .filter(brawler => brawler.winRate != null && brawler.picks > 0)
          .sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1))[0]
        if (top && top.winRate != null) setSpotlightTopBrawler({ id: top.id, name: top.name, picks: top.picks, winRate: top.winRate })
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <main className="bl-tier-shell">
        <TierlistSubNav active="maps" />
        <div className="dpm-page-shell">
        <section className="bl-tier-intro-card" aria-labelledby="maps-title">
          <h1 id="maps-title">Maps & Meta</h1>
          <div className="bl-tier-analyzed">
            <span>BATTLES ANALYZED</span>
            <strong>{totalBattlesAnalyzed > 0 ? formatFullNumber(totalBattlesAnalyzed) : "-"}</strong>
            <HelpTooltip label="How map stats are summarized">
              Battle counts come from the current tracked map dataset. The most popular map is the map with the
              highest tracked battle volume, while best brawler uses the current brawler win-rate dataset.
            </HelpTooltip>
          </div>
          <p>
            Scan live maps and open matchup data for the brawlers performing best on each layout.
            <span className="mt-2 block text-[var(--lb-text-2)]">
              Most popular map: <strong className="font-semibold text-[var(--lb-text)]">{spotlightMap ? `${spotlightMap.name} (${getModeName(spotlightMap.mode)}, ${formatFullNumber(spotlightMap.battles)} battles)` : "Loading..."}</strong>
              <span aria-hidden="true"> · </span>
              Best brawler: <strong className="font-semibold text-[var(--lb-text)]">{spotlightTopBrawler ? `${formatBrawlerName(spotlightTopBrawler.name)} ${spotlightTopBrawler.winRate.toFixed(1)}%` : "-"}</strong>
            </span>
          </p>
        </section>

        <MetaDashboard
          modes={modes}
          loading={loading}
          selectedMode={selectedMode}
          mapSearch={mapSearch}
          onClearFilters={() => { setMapSearch(""); setSelectedMode(null) }}
          toolbar={(
            <div className="grid grid-cols-[minmax(240px,320px)_auto] items-center gap-3 max-md:grid-cols-1">
              <div className="relative max-md:w-full">
                <div className="flex h-[34px] items-center gap-2 rounded-[4px] border border-[rgba(247,244,237,0.075)] bg-[#101113] px-3 text-[var(--ink)] transition-colors focus-within:border-[rgba(247,244,237,0.16)] focus-within:bg-[#1b1d22]">
                  <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
                  <input
                    ref={searchInputRef}
                    value={mapSearch}
                    onChange={e => { setMapSearch(e.target.value); setSearchOpen(true) }}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search maps"
                    className="w-full border-0 bg-transparent font-inherit text-[12px] font-semibold tracking-normal text-[var(--ink)] outline-none placeholder:text-[rgba(247,244,237,0.42)]"
                  />
                </div>

                {searchOpen && searchMatches.length > 0 && (
                  <div
                    ref={searchDropdownRef}
                    className="absolute top-[calc(100%+8px)] right-0 left-0 z-50 max-h-[280px] overflow-y-auto rounded-[6px] border border-[rgba(247,244,237,0.09)] bg-[#101113] p-1 shadow-[0_18px_42px_rgba(0,0,0,0.46)]"
                  >
                    {searchMatches.slice(0, 12).map(m => {
                      const imageUrl = mapImageLookup.get(m.name) ?? mapImageLookup.get(normalizeMapName(m.name))
                      return (
                        <Link
                          key={m.name}
                          href={mapHref(m.name)}
                          onClick={() => {
                            setMapSearch("")
                            setSearchOpen(false)
                          }}
                          className="row-hover flex w-full cursor-pointer items-center gap-2.5 rounded-[5px] border-0 bg-transparent px-2.5 py-2 text-left font-inherit"
                        >
                          <div className="grid size-[26px] shrink-0 place-items-center overflow-hidden rounded-[5px] border border-[var(--line)] bg-[var(--panel-2)]">
                            {imageUrl && (
                              <BrawlImage src={imageUrl} alt={m.name} width={26} height={26} sizes="26px" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-semibold text-[var(--ink)]">{m.name}</div>
                            <div className="text-[10px] leading-snug tracking-normal text-[var(--ink-4)]">{getModeName(m.mode)}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>

              <div ref={modeDropdownRef} className="bl-tier-selector-wrap w-fit max-md:w-full">
                <button
                  type="button"
                  className="bl-tier-selector max-md:w-full"
                  aria-haspopup="listbox"
                  aria-expanded={modeOpen}
                  onClick={() => {
                    setModeOpen(open => !open)
                    setSearchOpen(false)
                  }}
                >
                  <span>{selectedMode ? getModeName(selectedMode) : "All modes"}</span>
                  <ChevronDown size={14} className={modeOpen ? "rotate-180" : ""} />
                </button>
                <div className={`bl-tier-menu bl-tier-menu-list ${modeOpen ? "is-open" : ""}`} role="listbox">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedMode === null}
                    className={`bl-tier-menu-card bl-tier-menu-card-all ${selectedMode === null ? "is-active" : ""}`}
                    onClick={() => {
                      setSelectedMode(null)
                      setModeOpen(false)
                    }}
                  >
                    All modes
                  </button>
                  {modes.map(mode => {
                    const active = selectedMode === mode.mode
                    return (
                      <button
                        type="button"
                        key={mode.mode}
                        role="option"
                        aria-selected={active}
                        className={`bl-tier-menu-card ${active ? "is-active" : ""}`}
                        onClick={() => {
                          setSelectedMode(mode.mode)
                          setModeOpen(false)
                        }}
                      >
                        {getModeName(mode.mode)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        />
      </div>
      </main>
    </>
  )
}
