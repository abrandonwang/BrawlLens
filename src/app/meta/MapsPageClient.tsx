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
        const found = (d.list || []).find((m: { name: string; imageUrl: string }) => m.name === openName)
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

  return (
    <>
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
                  <div className="map-brawler-row" style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 60px 60px 36px", gap: 12, padding: "10px 20px", background: "var(--panel-2)", borderBottom: "1px solid var(--line)" }}>
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
