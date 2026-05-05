"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, ChevronDown, Info, Maximize2, Minimize2, Search } from "lucide-react"
import MetaDashboard from "@/components/MetaDashboard"
import Modal, { ModalCloseButton, ModalIconButton } from "@/components/Modal"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, SkeletonBlock, StateButton } from "@/components/PolishStates"
import { formatNum, formatBrawlerName, normalizeMapName } from "@/lib/format"
import { MODE_CONFIG, getModeName } from "@/lib/modes"
import { getTierInfo, getBarWidth } from "@/lib/tiers"
import { useClickOutside } from "@/lib/useClickOutside"

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

interface SelectedMapInfo {
  name: string
  imageUrl?: string
  mode: string | null
  isLive: boolean
}

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"
const MIN_PICK_OPTIONS = [5, 10, 25, 50, 100] as const

export default function MapsPageClient() {
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [mapSearch, setMapSearch] = useState("")
  const searchParams = useSearchParams()
  const [selectedMap, setSelectedMap] = useState<SelectedMapInfo | null>(null)
  const [mapBrawlers, setMapBrawlers] = useState<BrawlerStat[]>([])
  const [mapTotalBattles, setMapTotalBattles] = useState(0)
  const [mapDataLoading, setMapDataLoading] = useState(false)
  const [brawlerSearch, setBrawlerSearch] = useState("")
  const [minPicks, setMinPicks] = useState(10)
  const [sortBy, setSortBy] = useState<SortKey>("winRate")
  const [spotlightTopBrawler, setSpotlightTopBrawler] = useState<{ id: number; name: string; picks: number; winRate: number } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [minPicksOpen, setMinPicksOpen] = useState(false)
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)
  const minPicksRef = useRef<HTMLDivElement>(null)
  const [mapExpanded, setMapExpanded] = useState(false)

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
  useClickOutside(minPicksRef, () => setMinPicksOpen(false), minPicksOpen)

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

  const handleSelectMap = useCallback((map: SelectedMapInfo) => {
    setSelectedMap(map)
    setMapDataLoading(true)
    setBrawlerSearch("")
    setMinPicks(10)
    setSortBy("picks")
    fetch(`/api/meta?map=${encodeURIComponent(map.name)}`)
      .then(r => r.json())
      .then(d => {
        setMapBrawlers(d.brawlers || [])
        setMapTotalBattles(d.totalBattles || 0)
        setMapDataLoading(false)
      })
      .catch(() => setMapDataLoading(false))
  }, [])

  const [autoOpenHandled, setAutoOpenHandled] = useState(false)
  useEffect(() => {
    const openName = searchParams.get("open")
    if (!openName || loading || autoOpenHandled) return
    setAutoOpenHandled(true)
    let mode: string | null = null
    for (const m of modes) {
      if (m.maps.some(mp => mp.name === openName)) { mode = m.mode; break }
    }
    fetch("https://api.brawlify.com/v1/maps")
      .then(r => r.json())
      .then(d => {
        const normalizedOpenName = normalizeMapName(openName)
        const found = (d.list || []).find((m: { name: string; imageUrl: string }) => (
          m.name === openName || normalizeMapName(m.name) === normalizedOpenName
        ))
        handleSelectMap({ name: openName, imageUrl: found?.imageUrl, mode, isLive: false })
      })
      .catch(() => handleSelectMap({ name: openName, mode, isLive: false }))
  }, [loading, modes, searchParams, autoOpenHandled, handleSelectMap])

  const closeModal = useCallback(() => {
    setSelectedMap(null)
    setMapBrawlers([])
    setBrawlerSearch("")
    setMinPicks(10)
    setSortBy("picks")
    setMapExpanded(false)
  }, [])

  const filteredBrawlers = useMemo(() => {
    return mapBrawlers
      .filter(b => {
        if (b.picks < minPicks) return false
        if (brawlerSearch && !formatBrawlerName(b.name).toLowerCase().includes(brawlerSearch.toLowerCase())) return false
        return true
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [mapBrawlers, brawlerSearch, minPicks, sortBy])
  const modalBestWinRate = useMemo(() => {
    return [...mapBrawlers].filter(b => b.picks >= minPicks).sort((a, b) => b.winRate - a.winRate)[0] ?? null
  }, [mapBrawlers, minPicks])
  const modalMostPicked = useMemo(() => {
    return [...mapBrawlers].sort((a, b) => b.picks - a.picks)[0] ?? null
  }, [mapBrawlers])
  const selectedModeLabel = selectedMap?.mode ? (MODE_CONFIG[selectedMap.mode]?.label ?? selectedMap.mode) : "Unknown mode"

  const totalMaps = useMemo(() => {
    const names = new Set<string>()
    modes.forEach(mode => mode.maps.forEach(map => names.add(map.name)))
    return names.size
  }, [modes])
  const spotlightMap = useMemo(() => {
    let best: { name: string; mode: string; battles: number } | null = null
    for (const m of modes) {
      for (const map of m.maps) {
        if (!best || map.battles > best.battles) best = { name: map.name, mode: m.mode, battles: map.battles }
      }
    }
    return best
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

  const selectFromSearch = useCallback((name: string, mode: string) => {
    const imageUrl = mapImageLookup.get(name) ?? mapImageLookup.get(normalizeMapName(name))
    handleSelectMap({ name, imageUrl, mode, isLive: false })
    setMapSearch("")
    setSearchOpen(false)
  }, [mapImageLookup, handleSelectMap])

  useEffect(() => {
    if (!spotlightMap) return
    setSpotlightTopBrawler(null)
    fetch(`/api/meta?map=${encodeURIComponent(spotlightMap.name)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const eligible = (d?.brawlers || []).filter((b: BrawlerStat) => b.picks >= 10)
        const source = eligible.length ? eligible : (d?.brawlers || [])
        const top = [...source].sort((a: BrawlerStat, b: BrawlerStat) => b.winRate - a.winRate)[0]
        if (top) setSpotlightTopBrawler({ id: top.brawlerId, name: top.name, picks: top.picks, winRate: top.winRate })
      })
      .catch(() => {})
  }, [spotlightMap])

  return (
    <>
      <div className="mx-auto w-full max-w-[1080px] px-6 pt-12 pb-24 max-md:px-4 max-md:pt-8 max-md:pb-[64px] max-[480px]:pt-6 max-[480px]:pb-12">
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-8 max-md:grid-cols-1 max-md:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(28px,4.1vw,46px)] leading-[1.07] font-semibold tracking-[-0.01em] text-[var(--ink)]">Maps</h1>
            <p className="mt-3 mb-0 max-w-none whitespace-nowrap text-[17px] leading-[1.47] tracking-[-0.022em] text-[var(--ink-3)] max-xl:whitespace-normal">Scan live maps and open matchup data for the brawlers performing best on each layout.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
            <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{loading ? "Loading maps" : `${totalMaps} maps`}</span>
            <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{selectedMode ? getModeName(selectedMode) : "All modes"}</span>
          </div>
        </div>

        <div className="page-summary mb-6 flex items-center justify-between gap-6 p-8 max-md:flex-col max-md:items-stretch max-sm:p-6" style={{ "--summary-gradient": "linear-gradient(135deg, #3B82F6 0%, #7C3AED 52%, #F97316 100%)" } as CSSProperties}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-[12px] leading-none tracking-[0.08em] text-white/70 uppercase">Most Popular Map</p>
              <h2 className="m-0 truncate text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] text-white">{spotlightMap ? spotlightMap.name : "Loading..."}</h2>
              <Link href="/calculations" className="mt-2 mb-0 flex items-start gap-1.5 text-[14px] leading-[1.43] tracking-[-0.016em] text-white/75 hover:underline underline-offset-4">
                <Info size={12} className="mt-[4px] shrink-0" />
                <span>Why: most battles played on this map layout.</span>
              </Link>
            </div>
          </div>
          <div className="grid min-w-[min(420px,48%)] grid-cols-3 gap-2 max-md:min-w-0">
            <div className="page-summary-stat">
              <span>Battles</span>
              <strong>{spotlightMap ? formatNum(spotlightMap.battles) : "-"}</strong>
            </div>
            <div className="page-summary-stat">
              <span>Mode</span>
              <strong>{spotlightMap ? getModeName(spotlightMap.mode) : "-"}</strong>
            </div>
            <div className="page-summary-stat">
              <span>Best brawler</span>
              <strong>{spotlightTopBrawler ? `${formatBrawlerName(spotlightTopBrawler.name)} - ${spotlightTopBrawler.winRate.toFixed(1)}%` : "-"}</strong>
            </div>
          </div>
        </div>

        <div className="relative z-30 mb-8 grid grid-cols-[minmax(240px,320px)_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-[18px] border border-[var(--line)] bg-[var(--panel)] p-4 max-md:grid-cols-1">
          <div className="relative max-md:w-full">
            <div className="flex h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[var(--ink)] transition-colors focus-within:border-[var(--accent)]">
              <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
              <input
                ref={searchInputRef}
                value={mapSearch}
                onChange={e => { setMapSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search maps"
                className="w-full border-0 bg-transparent font-inherit text-[17px] tracking-[-0.022em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
              />
            </div>

            {searchOpen && searchMatches.length > 0 && (
              <div
                ref={searchDropdownRef}
                className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-[280px] overflow-y-auto rounded-[18px] border border-[var(--line-2)] bg-[var(--panel)] p-1"
              >
                {searchMatches.slice(0, 12).map(m => {
                  const imageUrl = mapImageLookup.get(m.name) ?? mapImageLookup.get(normalizeMapName(m.name))
                  return (
                    <button
                      key={m.name}
                      onMouseDown={() => selectFromSearch(m.name, m.mode)}
                      className="row-hover flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-2.5 py-2 text-left font-inherit"
                    >
                      <div className="grid size-[26px] shrink-0 place-items-center overflow-hidden rounded-[5px] border border-[var(--line)] bg-[var(--panel-2)]">
                        {imageUrl && (
                          <BrawlImage src={imageUrl} alt={m.name} width={26} height={26} sizes="26px" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{m.name}</div>
                        <div className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-4)]">{getModeName(m.mode)}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="col-span-2 row-start-2 space-y-2 max-md:col-span-1 max-md:row-auto">
            <div className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-1">
              <span className="text-[12px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Mode</span>
              <div className="flex min-w-0 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedMode(null)}
                  className={`rounded-full border px-3 py-1.5 text-[14px] font-normal tracking-[-0.016em] transition ${selectedMode === null ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                >
                  All
                </button>
                {modes.map(mode => (
                  <button
                    type="button"
                    key={mode.mode}
                    onClick={() => setSelectedMode(current => current === mode.mode ? null : mode.mode)}
                    className={`rounded-full border px-3 py-1.5 text-[14px] font-normal tracking-[-0.016em] transition ${selectedMode === mode.mode ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                  >
                    {getModeName(mode.mode)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <MetaDashboard
          modes={modes}
          loading={loading}
          selectedMode={selectedMode}
          mapSearch={mapSearch}
          onSelect={handleSelectMap}
          onClearFilters={() => { setMapSearch(""); setSelectedMode(null) }}
        />
      </div>
      <Modal open={!!selectedMap} onClose={closeModal} size={mapExpanded ? "xl" : "lg"} labelledBy="map-modal-title">
        {selectedMap && (
          <div className={`flex min-h-0 flex-1 overflow-hidden rounded-[inherit] ${mapExpanded ? "flex-col md:flex-row" : "flex-col"}`}>
            {mapExpanded && selectedMap.imageUrl && (
              <aside className="flex h-[260px] shrink-0 flex-col overflow-hidden border-b border-[var(--line)] bg-[var(--panel-2)] max-[380px]:h-[230px] min-[520px]:h-[300px] md:h-auto md:w-[360px] md:border-r md:border-b-0 lg:w-[420px]">
                <div className="flex min-h-0 flex-1 items-center justify-center p-3 md:p-5">
                  <BrawlImage
                    src={selectedMap.imageUrl}
                    alt={selectedMap.name}
                    width={360}
                    height={448}
                    sizes="(max-width: 640px) 88vw, 360px"
                    className="block h-full max-h-full w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
                <div className="hidden items-center justify-between gap-3 border-t border-[var(--line)] px-5 py-3 md:flex">
                  <span className="truncate text-[13px] font-semibold text-[var(--ink)]">{selectedMap.name}</span>
                  <span className="shrink-0 text-[11px] text-[var(--ink-4)]">{selectedModeLabel}</span>
                </div>
              </aside>
            )}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="sticky top-0 z-10 shrink-0 bg-[var(--panel)] px-6 pt-5 shadow-[0_1px_0_var(--line)] max-[600px]:px-4 max-[600px]:pt-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                {selectedMap.imageUrl && (
                  <ModalIconButton
                    onClick={() => setMapExpanded(e => !e)}
                    label={mapExpanded ? "Collapse map image" : "Expand map image"}
                    icon={mapExpanded ? Minimize2 : Maximize2}
                    pressed={mapExpanded}
                    iconClassName={mapExpanded ? "group-hover:-rotate-6" : "group-hover:rotate-6"}
                  />
                )}
                <ModalCloseButton onClick={closeModal} label="Close map details" />
              </div>

              <div className="mb-4">
                <div className="flex items-start gap-4 max-[520px]:gap-3">
                  {selectedMap.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setMapExpanded(e => !e)}
                      className={`group relative flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--line-2)] ${mapExpanded ? "md:hidden" : ""}`}
                      aria-label={mapExpanded ? "Collapse map image" : "Expand map image"}
                    >
                      <BrawlImage src={selectedMap.imageUrl} alt={selectedMap.name} width={64} height={64} style={{ width: "100%", height: "100%", objectFit: "cover" }} sizes="64px" />
                      <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 id="map-modal-title" className="m-0 flex max-w-full flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-[31px] leading-[1.08] font-semibold break-words text-[var(--ink)] max-[600px]:text-[25px]">
                      <span>{selectedMap.name}</span>
                      <span aria-hidden="true" className="font-normal text-[var(--ink-5)]">|</span>
                      <span className="font-normal text-[var(--ink-2)]">{selectedModeLabel}</span>
                    </h2>
                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-[var(--ink-4)]">
                      <span className="whitespace-nowrap">
                        <strong className="font-semibold text-[var(--ink)]">{mapTotalBattles.toLocaleString()}</strong> battles
                      </span>
                      <span className="hidden size-1 rounded-full bg-[var(--ink-5)] min-[420px]:block" />
                      <span className="min-w-0 truncate">
                        Best: <strong className="font-semibold text-[var(--ink)]">{modalBestWinRate ? `${formatBrawlerName(modalBestWinRate.name)} ${modalBestWinRate.winRate.toFixed(1)}%` : "-"}</strong>
                      </span>
                      <span className="hidden size-1 rounded-full bg-[var(--ink-5)] min-[520px]:block" />
                      <span className="min-w-0 truncate">
                        Picked: <strong className="font-semibold text-[var(--ink)]">{modalMostPicked ? `${formatBrawlerName(modalMostPicked.name)} ${formatNum(modalMostPicked.picks)}` : "-"}</strong>
                      </span>
                      </div>
                  </div>
                </div>
              </div>
              <div className={`mb-4 flex gap-2.5 ${mapExpanded ? "flex-col items-stretch" : "items-center max-[720px]:flex-col max-[720px]:items-stretch"}`}>
                <div className="flex min-h-11 min-w-0 flex-[1_1_260px] items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-4 text-[var(--ink)] transition-[border-color,box-shadow] focus-within:border-[var(--line-2)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.1)] max-[720px]:basis-auto">
                  <Search size={12} className="shrink-0 text-[var(--ink-4)]" />
                  <input className="w-full border-0 bg-transparent text-[16px] font-[inherit] text-inherit outline-none placeholder:text-[var(--ink-4)]" placeholder="Search brawler…" value={brawlerSearch} onChange={e => setBrawlerSearch(e.target.value)} />
                </div>
                <div className={`flex min-w-0 items-center gap-2 ${mapExpanded ? "w-full" : "flex-none max-[720px]:w-full"} max-[420px]:flex-wrap`}>
                  <div className="inline-flex w-fit max-w-full flex-none gap-0.5 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {([["picks", "Picks"], ["winRate", "Win Rate"], ["wins", "Wins"]] as [SortKey, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        className={`relative shrink-0 cursor-pointer rounded-md border-0 px-[15px] py-[7px] text-[14px] font-normal transition-all ${sortBy === key ? "bg-[var(--ink)] text-[#fcfbf8] shadow-[var(--shadow-lift)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div ref={minPicksRef} className="relative shrink-0">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={minPicksOpen}
                      aria-label="Minimum picks"
                      onClick={() => setMinPicksOpen(open => !open)}
                      onKeyDown={e => {
                        if (e.key === "Escape") setMinPicksOpen(false)
                        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setMinPicksOpen(true)
                        }
                      }}
                      className={`group inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-[var(--ink)] transition-[border-color,box-shadow,background-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--line-2)] ${minPicksOpen ? "border-[var(--line-2)] bg-[color-mix(in_srgb,var(--panel-2)_62%,var(--panel))] shadow-[0_4px_12px_rgba(0,0,0,0.08)]" : "border-[var(--line)] bg-[var(--panel)] hover:border-[var(--line-2)] hover:bg-[color-mix(in_srgb,var(--panel-2)_55%,var(--panel))]"}`}
                    >
                      <span className="text-[11px] font-normal text-[var(--ink-4)]">Min</span>
                      <span className="min-w-[30px] text-left text-[14px] font-semibold text-[var(--ink)]">{minPicks}+</span>
                      <ChevronDown size={13} strokeWidth={2.25} className={`text-[var(--ink-4)] transition-transform duration-200 ${minPicksOpen ? "rotate-180" : ""}`} />
                    </button>

                    <div
                      className={`absolute right-0 top-[calc(100%+8px)] z-30 w-[124px] origin-top-right overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] p-1 shadow-[0_18px_42px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-150 ${minPicksOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"}`}
                      role="listbox"
                      aria-label="Minimum picks"
                      aria-hidden={!minPicksOpen}
                    >
                      {MIN_PICK_OPTIONS.map(option => {
                        const active = minPicks === option
                        return (
                          <button
                            key={option}
                            type="button"
                            role="option"
                            tabIndex={minPicksOpen ? 0 : -1}
                            aria-selected={active}
                            onClick={() => {
                              setMinPicks(option)
                              setMinPicksOpen(false)
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] leading-5 transition-colors ${active ? "bg-[var(--ink)] font-semibold text-[#fcfbf8]" : "text-[var(--ink-2)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"}`}
                          >
                            <span>{option}+ picks</span>
                            <Check size={12} strokeWidth={2.5} className={active ? "opacity-100" : "opacity-0"} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--line)" }} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--panel)]">
              {mapDataLoading ? (
                <div className="space-y-2 p-5 max-[600px]:p-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[40px_1fr_90px] items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
                      <SkeletonBlock className="size-8" />
                      <div className="space-y-2">
                        <SkeletonBlock className="h-3.5 w-28" />
                        <SkeletonBlock className="h-2.5 w-16" />
                      </div>
                      <SkeletonBlock className="ml-auto h-3.5 w-14" />
                    </div>
                  ))}
                </div>
              ) : filteredBrawlers.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No brawlers match"
                    description="The search text or minimum pick filter removed every brawler for this map."
                    action={<StateButton onClick={() => { setBrawlerSearch(""); setMinPicks(5) }}>Clear filters</StateButton>}
                  />
                </div>
              ) : (
                <>
                  <div className="px-5 pt-4 pb-5 max-[600px]:px-3 max-[600px]:pt-3">
                    <div className={`overflow-hidden rounded-xl border border-[var(--line)] ${mapExpanded ? "hidden min-[1050px]:block" : "hidden min-[760px]:block"}`}>
                      <div
                        className="grid items-center gap-4 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_94%,var(--panel-2))] px-4 py-3"
                        style={{ gridTemplateColumns: "44px minmax(0,1.25fr) minmax(116px,0.9fr) 72px 72px 48px" }}
                      >
                        <span />
                        <span className="text-[12px] font-normal text-[var(--ink-4)]">Brawler</span>
                        <span className="text-[12px] font-normal text-[var(--ink-4)]">Win rate</span>
                        <span className="text-right text-[12px] font-normal text-[var(--ink-4)]">Wins</span>
                        <span className="text-right text-[12px] font-normal text-[var(--ink-4)]">Picks</span>
                        <span className="text-center text-[12px] font-normal text-[var(--ink-4)]">Tier</span>
                      </div>

                      {filteredBrawlers.map(b => {
                        const tier = getTierInfo(b.winRate)
                        return (
                          <div
                            key={b.brawlerId}
                            className="grid min-h-[64px] items-center gap-4 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--hover-bg)]"
                            style={{ gridTemplateColumns: "44px minmax(0,1.25fr) minmax(116px,0.9fr) 72px 72px 48px" }}
                          >
                            <div className="grid size-10 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-2)]">
                              <BrawlImage src={brawlerIconUrl(b.brawlerId)} alt={b.name} width={34} height={34} style={{ width: 34, height: 34, objectFit: "contain" }} loading="lazy" sizes="34px" />
                            </div>

                            <span className="min-w-0 truncate text-[14px] font-semibold text-[var(--ink)]">
                              {formatBrawlerName(b.name)}
                            </span>

                            <div className="flex min-w-0 items-center gap-3">
                              <span className="bl-num w-[48px] shrink-0 text-[13px] font-semibold text-[var(--ink)]">{b.winRate.toFixed(1)}%</span>
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_16%,transparent)]">
                                <div className="h-full rounded-full bg-[var(--ink)] opacity-75" style={{ width: `${getBarWidth(b.winRate)}%` }} />
                              </div>
                            </div>

                            <span className="bl-num text-right text-[13px] font-normal text-[var(--ink-3)]">
                              {formatNum(b.wins)}
                            </span>
                            <span className="bl-num text-right text-[13px] font-normal text-[var(--ink-3)]">
                              {formatNum(b.picks)}
                            </span>

                            <div className="flex justify-center">
                              <span className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel-2)] text-[11px] font-semibold text-[var(--ink-3)]">
                                {tier.label}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className={`grid gap-2 ${mapExpanded ? "min-[1050px]:hidden" : "min-[760px]:hidden"}`}>
                      {filteredBrawlers.map(b => {
                        const tier = getTierInfo(b.winRate)
                        return (
                          <div key={b.brawlerId} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3">
                            <div className="flex items-center gap-3">
                              <div className="grid size-10 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-2)]">
                                <BrawlImage src={brawlerIconUrl(b.brawlerId)} alt={b.name} width={34} height={34} style={{ width: 34, height: 34, objectFit: "contain" }} loading="lazy" sizes="34px" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[14px] font-semibold text-[var(--ink)]">{formatBrawlerName(b.name)}</div>
                                <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--ink-4)]">
                                  <span>{formatNum(b.picks)} picks</span>
                                  <span className="size-1 rounded-full bg-[var(--ink-5)]" />
                                  <span>{formatNum(b.wins)} wins</span>
                                </div>
                              </div>
                              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel-2)] text-[11px] font-semibold text-[var(--ink-3)]">
                                {tier.label}
                              </span>
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                              <span className="bl-num w-[52px] shrink-0 text-[13px] font-semibold text-[var(--ink)]">{b.winRate.toFixed(1)}%</span>
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_16%,transparent)]">
                                <div className="h-full rounded-full bg-[var(--ink)] opacity-75" style={{ width: `${getBarWidth(b.winRate)}%` }} />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
            </div>{/* map modal main */}
          </div>
        )}
      </Modal>
    </>
  )
}
