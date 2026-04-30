"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import MetaDashboard from "@/components/MetaDashboard"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, SkeletonBlock, StateButton } from "@/components/PolishStates"

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

function getTierInfo(winRate: number) {
  if (winRate >= 58) return { label: "S", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }
  if (winRate >= 54) return { label: "A", color: "#FB923C", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" }
  if (winRate >= 50) return { label: "B", color: "#FACC15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" }
  if (winRate >= 46) return { label: "C", color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" }
  return { label: "D", color: "var(--ink-4)", bg: "var(--panel-2)", border: "var(--line)" }
}

function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}

function formatBrawlerName(name: string) {
  return name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

function normalizeMapName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
}

type SortKey = "winRate" | "wins" | "picks"

export default function MapsPageClient() {
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [mapSearch, setMapSearch] = useState("")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const [selectedMap, setSelectedMap] = useState<SelectedMapInfo | null>(null)
  const [mapBrawlers, setMapBrawlers] = useState<BrawlerStat[]>([])
  const [mapTotalBattles, setMapTotalBattles] = useState(0)
  const [mapDataLoading, setMapDataLoading] = useState(false)
  const [brawlerSearch, setBrawlerSearch] = useState("")
  const [minPicks, setMinPicks] = useState(10)
  const [sortBy, setSortBy] = useState<SortKey>("picks")
  const [spotlightTopBrawler, setSpotlightTopBrawler] = useState<{ id: number; name: string; picks: number; winRate: number } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mapImageLookup, setMapImageLookup] = useState<Map<string, string>>(new Map())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const updateScrollState = useCallback((resetStart = false) => {
    const el = filtersRef.current
    if (!el) return
    if (resetStart) {
      el.scrollLeft = 0
    }
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = filtersRef.current
    if (!el) return
    let frame = 0
    const refresh = (resetStart = false) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => updateScrollState(resetStart))
    }
    const refreshFromStart = () => refresh(true)
    const onScroll = () => updateScrollState()
    const observer = new ResizeObserver(refreshFromStart)

    refreshFromStart()
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    el.addEventListener("scroll", onScroll)
    window.addEventListener("resize", refreshFromStart)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      el.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", refreshFromStart)
    }
  }, [modes, updateScrollState])

  function scrollFilters(dir: "left" | "right") {
    filtersRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

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
  }, [])

  useEffect(() => {
    if (!selectedMap) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") closeModal() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedMap, closeModal])

  const filteredBrawlers = useMemo(() => {
    return mapBrawlers
      .filter(b => {
        if (b.picks < minPicks) return false
        if (brawlerSearch && !formatBrawlerName(b.name).toLowerCase().includes(brawlerSearch.toLowerCase())) return false
        return true
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [mapBrawlers, brawlerSearch, minPicks, sortBy])

  const modeOptions = useMemo(() => [null, ...modes.map(m => m.mode)] as (string | null)[], [modes])
  function goMode(dir: 1 | -1) {
    const idx = modeOptions.indexOf(selectedMode)
    const next = (idx + dir + modeOptions.length) % modeOptions.length
    setSelectedMode(modeOptions[next])
  }

  const modeColor = selectedMap?.mode ? MODE_CONFIG[selectedMap.mode]?.color : undefined
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
      <div className="mx-auto w-full max-w-[1080px] px-6 pt-10 pb-20 max-md:px-4 max-md:pt-6 max-md:pb-[60px] max-[480px]:pt-5 max-[480px]:pb-12">
        <div className="mb-[18px] flex items-end justify-between gap-[18px] max-md:flex-col max-md:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(28px,4vw,40px)] leading-none font-extrabold tracking-normal text-[var(--ink)]">Maps</h1>
            <p className="mt-2 mb-0 max-w-[560px] text-[13px] leading-normal text-[var(--ink-3)]">Scan live maps and open matchup data for the brawlers performing best on each layout.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
            <span className="inline-flex min-h-[30px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] px-3 text-[11.5px] font-semibold text-[var(--ink-2)]">{loading ? "Loading maps" : `${totalMaps} maps`}</span>
            <span className="inline-flex min-h-[30px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] px-3 text-[11.5px] font-semibold text-[var(--ink-2)]">{selectedMode ? getModeName(selectedMode) : "All modes"}</span>
          </div>
        </div>

        <div className="page-summary mb-3.5 flex items-center justify-between gap-3.5 p-[18px] max-md:flex-col max-md:items-stretch" style={{ "--summary-gradient": "linear-gradient(135deg, #3B82F6 0%, #7C3AED 52%, #F97316 100%)" } as CSSProperties}>
          <div className="min-w-0">
            <p className="mb-1 text-[10.5px] leading-snug tracking-[0.12em] text-white/70 uppercase">Most Popular Map</p>
            <h2 className="m-0 truncate text-[22px] leading-tight font-bold text-white">{spotlightMap ? spotlightMap.name : "Loading..."}</h2>
          </div>
          <div className="grid min-w-[min(420px,48%)] grid-cols-3 gap-2 max-md:min-w-0">
            <div className="page-summary-stat">
              <span>Battles</span>
              <strong>{spotlightMap ? formatNum(spotlightMap.battles) : "—"}</strong>
            </div>
            <div className="page-summary-stat">
              <span>Mode</span>
              <strong>{spotlightMap ? getModeName(spotlightMap.mode) : "—"}</strong>
            </div>
            <div className="page-summary-stat">
              <span>Best brawler</span>
              <strong>{spotlightTopBrawler ? `${formatBrawlerName(spotlightTopBrawler.name)} - ${spotlightTopBrawler.winRate.toFixed(1)}%` : "—"}</strong>
            </div>
          </div>
        </div>

        <div className="relative z-30 mb-8 flex w-full items-center gap-2.5 rounded-[12px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] p-2.5 shadow-[0_18px_36px_-34px_rgba(0,0,0,0.7)] backdrop-blur-2xl max-md:flex-col max-md:items-stretch max-md:gap-2">
          <div className="relative w-[200px] shrink-0 max-md:w-full">
            <div className="flex h-10 items-center gap-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-3.5 text-[var(--ink)] transition-colors focus-within:border-[var(--line-2)]">
              <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
              <input
                ref={searchInputRef}
                value={mapSearch}
                onChange={e => { setMapSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search maps"
                className="w-full border-0 bg-transparent font-inherit text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
              />
            </div>

            {searchOpen && searchMatches.length > 0 && (
              <div
                ref={searchDropdownRef}
                className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-[280px] overflow-y-auto rounded-xl border border-[var(--line-2)] bg-[var(--panel)] p-1 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)]"
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

          <div className="relative ml-auto flex min-w-0 flex-1 justify-end max-w-[calc(100%-220px)] max-md:hidden">
            {canScrollLeft && (
              <button onClick={() => scrollFilters("left")} className="absolute top-0 bottom-0 left-0 z-10 flex cursor-pointer items-center border-0 bg-[linear-gradient(to_right,var(--panel)_50%,transparent)] py-0 pr-3.5 pl-0.5 text-[var(--ink-3)]">
                <ChevronLeft size={14} />
              </button>
            )}
            <div className="flex w-auto max-w-full flex-nowrap justify-end overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={filtersRef}>
              <div className="inline-flex shrink-0 gap-0.5 rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px]">
                <button
                  onClick={() => setSelectedMode(null)}
                  className={`relative shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 px-[13px] py-[5px] text-[11.5px] font-medium transition-all ${!selectedMode ? "bg-[var(--panel-2)] text-[var(--ink)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
                >
                  All Modes
                </button>
                {modes.map(m => {
                  return (
                    <button
                      key={m.mode}
                      onClick={() => setSelectedMode(selectedMode === m.mode ? null : m.mode)}
                      className={`relative shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 px-[13px] py-[5px] text-[11.5px] font-medium transition-all ${selectedMode === m.mode ? "bg-[var(--panel-2)] text-[var(--ink)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
                    >
                      {getModeName(m.mode)}
                    </button>
                  )
                })}
              </div>
            </div>
            {canScrollRight && (
              <button onClick={() => scrollFilters("right")} className="absolute top-0 right-0 bottom-0 z-10 flex cursor-pointer items-center border-0 bg-[linear-gradient(to_left,var(--panel)_50%,transparent)] py-0 pr-0.5 pl-3.5 text-[var(--ink-3)]">
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div className="hidden w-full items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--panel)] p-1 max-md:flex">
            <button
              onClick={() => goMode(-1)}
              disabled={modeOptions.length <= 1}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-25"
              aria-label="Previous mode"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="flex-1 truncate px-2 text-center text-[12.5px] font-semibold text-[var(--ink)]">
              {selectedMode ? getModeName(selectedMode) : "All Modes"}
            </span>
            <span className="shrink-0 pr-1 font-mono text-[10px] text-[var(--ink-4)]">
              {modeOptions.indexOf(selectedMode) + 1}/{modeOptions.length}
            </span>
            <button
              onClick={() => goMode(1)}
              disabled={modeOptions.length <= 1}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-25"
              aria-label="Next mode"
            >
              <ChevronRight size={15} />
            </button>
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
      {selectedMap && typeof document !== "undefined" && createPortal((
        <div
          className="bl-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background: "rgba(0,0,0,0.58)",
            backdropFilter: "blur(10px) saturate(120%)",
            WebkitBackdropFilter: "blur(10px) saturate(120%)",
            animation: "modalOverlayIn 0.18s ease both",
          }}
          onClick={closeModal}
        >
          <div
            className="bl-modal-sheet bl-modal-sheet-map"
            style={{
              width: "100%",
              maxWidth: 560,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--panel)",
              border: "1px solid var(--line-2)",
              borderRadius: 16,
              boxShadow: "0 36px 90px -28px rgba(0,0,0,0.72)",
              animation: "modalSheetIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="bl-modal-header">
              <button onClick={closeModal} className="bl-modal-close" aria-label="Close map details">
                <X size={12} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingRight: 40 }}>
                {selectedMap.imageUrl && (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--panel-2)", border: "1px solid var(--line)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BrawlImage src={selectedMap.imageUrl} alt={selectedMap.name} width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "cover" }} sizes="56px" />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {selectedMap.name}
                    </span>
                    {selectedMap.isLive && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(73,212,126,0.12)", border: "1px solid rgba(73,212,126,0.3)", borderRadius: 99, padding: "2px 8px", flexShrink: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#49D47E", boxShadow: "0 0 5px #49D47E" }} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: "#49D47E", letterSpacing: "0.08em" }}>LIVE</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {modeColor && <span style={{ width: 6, height: 6, borderRadius: 2, background: modeColor, display: "inline-block", flexShrink: 0 }} />}
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", color: "var(--ink-4)" }}>
                      {selectedMap.mode ? (MODE_CONFIG[selectedMap.mode]?.label ?? selectedMap.mode).toLowerCase() : "unknown mode"}
                      {" · "}{mapTotalBattles.toLocaleString()} battles
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <div className="bl-input">
                  <Search size={12} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                  <input placeholder="Search brawler…" value={brawlerSearch} onChange={e => setBrawlerSearch(e.target.value)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="bl-seg">
                    {([["picks", "Picks"], ["winRate", "Win Rate"], ["wins", "Wins"]] as [SortKey, string][]).map(([key, label]) => (
                      <button key={key} onClick={() => setSortBy(key)} className={sortBy === key ? "on" : ""}>{label}</button>
                    ))}
                  </div>
                  <select value={minPicks} onChange={e => setMinPicks(Number(e.target.value))} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 8px", fontSize: 12, color: "var(--ink)", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                    <option value={5}>5+</option>
                    <option value={10}>10+</option>
                    <option value={25}>25+</option>
                    <option value={50}>50+</option>
                    <option value={100}>100+</option>
                  </select>
                </div>
              </div>

              <div style={{ borderBottom: "1px solid var(--line)" }} />
            </div>
            <div className="bl-modal-body">
              {mapDataLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-[36px_1fr_90px] items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3">
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
                  <div className="map-brawler-row map-brawler-header" style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 60px 60px 36px", gap: 12, padding: "10px 20px", background: "var(--panel-2)", borderBottom: "1px solid var(--line)" }}>
                    <span />
                    <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Brawler</span>
                    <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Win Rate</span>
                    <span className="bl-caption map-brawler-hide" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Wins</span>
                    <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Picks</span>
                    <span className="bl-caption map-brawler-hide" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>Tier</span>
                  </div>

                  {filteredBrawlers.map((b, i) => {
                    const tier = getTierInfo(b.winRate)
                    return (
                      <div
                        key={b.brawlerId}
                        className="map-brawler-row row-hover"
                        style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 60px 60px 36px", gap: 12, padding: "10px 20px", borderBottom: i < filteredBrawlers.length - 1 ? "1px solid var(--line)" : "none" }}
                      >
                        <div className="map-brawler-avatar" style={{ width: 30, height: 30, borderRadius: 7, background: "var(--panel-2)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                          <BrawlImage src={brawlerIconUrl(b.brawlerId)} alt={b.name} width={26} height={26} style={{ width: 26, height: 26, objectFit: "contain" }} loading="lazy" sizes="26px" />
                        </div>

                        <span className="map-brawler-name" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatBrawlerName(b.name)}
                        </span>

                        <div className="map-brawler-winrate" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="bl-num" style={{ fontSize: 13, fontWeight: 600, color: tier.color, flexShrink: 0 }}>{b.winRate.toFixed(1)}%</span>
                          <div style={{ flex: 1, height: 3, background: "var(--line-2)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${getBarWidth(b.winRate)}%`, background: tier.color, opacity: 0.7, borderRadius: 99 }} />
                          </div>
                        </div>

                        <span className="bl-num map-brawler-hide" style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>
                          {b.wins >= 1000 ? `${(b.wins / 1000).toFixed(1)}k` : b.wins}
                        </span>
                        <span className="bl-num map-brawler-picks" style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>
                          {b.picks >= 1000 ? `${(b.picks / 1000).toFixed(1)}k` : b.picks}
                        </span>

                        <div className="map-brawler-hide" style={{ display: "flex", justifyContent: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, fontSize: 9.5, fontWeight: 800, borderRadius: 5, color: tier.color, background: tier.bg, border: `1px solid ${tier.border}` }}>
                            {tier.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  )
}
