"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import MetaDashboard from "@/components/MetaDashboard"

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

function getBrawlerImage(id: number) {
  return `https://cdn.brawlify.com/brawlers/borderless/${id}.png`
}

function formatBrawlerName(name: string) {
  return name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
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
      .then(data => { setModes(data.modes || []); setLoading(false) })
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

  const modeColor = selectedMap?.mode ? MODE_CONFIG[selectedMap.mode]?.color : undefined
  const totalMaps = useMemo(() => {
    const names = new Set<string>()
    modes.forEach(mode => mode.maps.forEach(map => names.add(map.name)))
    return names.size
  }, [modes])

  return (
    <>
      <div className="mx-auto w-full max-w-[1440px] px-[clamp(16px,3vw,40px)] pt-10 pb-20 max-md:px-4 max-md:pt-6 max-md:pb-[60px] max-[480px]:pt-5 max-[480px]:pb-12">
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

        <div className="mb-8 flex w-full items-center justify-start gap-2.5 max-md:flex-col max-md:items-stretch max-md:gap-2">
          <div className="flex h-10 w-[200px] shrink-0 items-center gap-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-3.5 text-[var(--ink)] transition-colors focus-within:border-[var(--line-2)] max-md:w-full">
            <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
            <input
              value={mapSearch}
              onChange={e => setMapSearch(e.target.value)}
              placeholder="Search maps"
              className="w-full border-0 bg-transparent font-inherit text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
            />
          </div>

          <div className="relative ml-auto flex min-w-0 flex-1 justify-end max-w-[calc(100%-220px)] max-md:ml-0 max-md:w-full max-md:max-w-none max-md:justify-start max-md:self-stretch">
            {canScrollLeft && (
              <button onClick={() => scrollFilters("left")} className="absolute top-0 bottom-0 left-0 z-10 flex cursor-pointer items-center border-0 bg-[linear-gradient(to_right,var(--bg)_50%,transparent)] py-0 pr-3.5 pl-0.5 text-[var(--ink-3)]">
                <ChevronLeft size={14} />
              </button>
            )}
            <div className="flex w-full max-w-full flex-nowrap justify-start overflow-x-auto md:w-auto md:justify-end [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={filtersRef}>
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
              <button onClick={() => scrollFilters("right")} className="absolute top-0 right-0 bottom-0 z-10 flex cursor-pointer items-center border-0 bg-[linear-gradient(to_left,var(--bg)_50%,transparent)] py-0 pr-0.5 pl-3.5 text-[var(--ink-3)]">
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        <MetaDashboard modes={modes} loading={loading} selectedMode={selectedMode} mapSearch={mapSearch} onSelect={handleSelectMap} />
      </div>
      {selectedMap && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 560, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--line-2)", borderRadius: 20, boxShadow: "0 32px 80px -20px rgba(0,0,0,0.5)" }}
          >
            <div style={{ padding: "20px 20px 0", flexShrink: 0, position: "relative" }}>
              <button onClick={closeModal} style={{ position: "absolute", top: 20, right: 20, width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 8, background: "none", cursor: "pointer", color: "var(--ink-4)" }}>
                <X size={12} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingRight: 40 }}>
                {selectedMap.imageUrl && (
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: "var(--panel-2)", border: "1px solid var(--line)", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={selectedMap.imageUrl} alt={selectedMap.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
            <div style={{ overflowY: "auto", flex: 1 }}>
              {mapDataLoading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                  <div style={{ width: 18, height: 18, border: "2px solid var(--line-2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : filteredBrawlers.length === 0 ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No brawlers match your filters.</span>
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
                        <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--panel-2)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                          <img src={getBrawlerImage(b.brawlerId)} alt={b.name} style={{ width: 26, height: 26, objectFit: "contain" }} loading="lazy" />
                        </div>

                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatBrawlerName(b.name)}
                        </span>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="bl-num" style={{ fontSize: 13, fontWeight: 600, color: tier.color, flexShrink: 0 }}>{b.winRate.toFixed(1)}%</span>
                          <div style={{ flex: 1, height: 3, background: "var(--line-2)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${getBarWidth(b.winRate)}%`, background: tier.color, opacity: 0.7, borderRadius: 99 }} />
                          </div>
                        </div>

                        <span className="bl-num map-brawler-hide" style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>
                          {b.wins >= 1000 ? `${(b.wins / 1000).toFixed(1)}k` : b.wins}
                        </span>
                        <span className="bl-num" style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>
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
      )}
    </>
  )
}
