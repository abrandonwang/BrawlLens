"use client"

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from "react"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import MetaDashboard from "@/components/MetaDashboard"
import Modal, { ModalCloseButton } from "@/components/Modal"
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

  useClickOutside([searchDropdownRef, searchInputRef], () => setSearchOpen(false), searchOpen)

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
          <div className="min-w-0">
            <p className="mb-1 text-[12px] leading-none tracking-[0.08em] text-white/70 uppercase">Most Popular Map</p>
            <h2 className="m-0 truncate text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] text-white">{spotlightMap ? spotlightMap.name : "Loading..."}</h2>
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
      <Modal open={!!selectedMap} onClose={closeModal} size="lg" className="bl-modal-sheet-map" labelledBy="map-modal-title">
        {selectedMap && (
          <>
            <div className="bl-modal-header">
              <ModalCloseButton onClick={closeModal} label="Close map details" />

              <div className="bl-map-modal-hero">
                {selectedMap.imageUrl && (
                  <div className="bl-map-modal-thumb">
                    <BrawlImage src={selectedMap.imageUrl} alt={selectedMap.name} width={56} height={56} style={{ width: "100%", height: "100%", objectFit: "cover" }} sizes="56px" />
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 id="map-modal-title" className={`bl-map-modal-title ${selectedMap.isLive ? "is-live" : ""}`}>{selectedMap.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {modeColor && <span style={{ width: 6, height: 6, borderRadius: 2, background: modeColor, display: "inline-block", flexShrink: 0 }} />}
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", color: "var(--ink-4)" }}>
                      {selectedMap.mode ? (MODE_CONFIG[selectedMap.mode]?.label ?? selectedMap.mode).toLowerCase() : "unknown mode"}
                      {" · "}{mapTotalBattles.toLocaleString()} battles
                    </span>
                  </div>
                </div>
              </div>
              <div className="bl-map-modal-controls">
                <div className="bl-input">
                  <Search size={12} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                  <input placeholder="Search brawler…" value={brawlerSearch} onChange={e => setBrawlerSearch(e.target.value)} />
                </div>
                <div className="bl-map-modal-filters">
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
          </>
        )}
      </Modal>
    </>
  )
}
