"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { useSearchParams } from "next/navigation"
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import BrawlerCatalog from "@/components/BrawlerCatalog"
import { BrawlImage } from "@/components/BrawlImage"
import { EmptyState, SkeletonBlock, StateButton } from "@/components/PolishStates"
import { HYPERCHARGES } from "@/data/hypercharges"
import type { Brawler } from "./page"

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

function cleanDesc(text: string) {
  return text.replace(/<![\w.]+>/g, "X")
}

function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

function winRateColor(wr: number) {
  if (wr >= 55) return "#49D47E"
  if (wr >= 50) return "#FACC15"
  if (wr >= 45) return "var(--ink-3)"
  return "#F87171"
}

interface BrawlerStats {
  totalPicks: number
  avgWinRate: number | null
  maps: { map: string; mode: string; picks: number; winRate: number }[]
  modes: { mode: string; picks: number; winRate: number }[]
}

type Tab = "overview" | "maps" | "abilities"

export default function BrawlerPageClient({ brawlers }: { brawlers: Brawler[] }) {
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Brawler | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [stats, setStats] = useState<BrawlerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId) {
      const match = brawlers.find(b => String(b.id) === openId)
      if (match) setSelected(match)
    }
  }, [searchParams, brawlers])

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setSelected(null)
    setStats(null)
    setTab("overview")
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
  }, [brawlers, updateScrollState])

  function scrollFilters(dir: "left" | "right") {
    filtersRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

  const searchMatches = search.trim()
    ? brawlers.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brawlers

  function selectFromSearch(brawler: Brawler) {
    setSearch(brawler.name)
    setSelected(brawler)
    setTab("overview")
    setSearchOpen(false)
  }

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

  useEffect(() => {
    if (!selected) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, close])
  useEffect(() => {
    if (!selected) return
    setStats(null)
    setStatsError(false)
    setStatsLoading(true)
    fetch(`/api/brawler-stats?id=${selected.id}`)
      .then(r => {
        if (!r.ok) throw new Error("stats fetch failed")
        return r.json()
      })
      .then(d => { setStats(d); setStatsLoading(false) })
      .catch(() => { setStatsError(true); setStatsLoading(false) })
  }, [selected])

  const rarities = RARITY_ORDER
    .map(name => ({ name, color: sanitizeColor(brawlers.find(b => b.rarity.name === name)?.rarity.color ?? "#888") }))
    .filter(r => brawlers.some(b => b.rarity.name === r.name))
  const activeRarityCount = activeRarity ? brawlers.filter(b => b.rarity.name === activeRarity).length : brawlers.length

  const rarityOptions = useMemo(() => [null, ...rarities.map(r => r.name)] as (string | null)[], [rarities])
  function goRarity(dir: 1 | -1) {
    const idx = rarityOptions.indexOf(activeRarity)
    const next = (idx + dir + rarityOptions.length) % rarityOptions.length
    setActiveRarity(rarityOptions[next])
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1180px] px-[clamp(16px,3vw,32px)] pt-9 pb-20 max-md:px-4 max-md:pt-6 max-md:pb-[60px] max-[360px]:px-3 max-[360px]:pt-5 max-[360px]:pb-12">
        <div className="mb-[18px] flex items-end justify-between gap-[18px] max-md:flex-col max-md:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(28px,4vw,40px)] leading-none font-extrabold tracking-normal text-[var(--ink)]">Brawlers</h1>
            <p className="mt-2 mb-0 max-w-[560px] text-[13px] leading-normal text-[var(--ink-3)]">Browse every brawler, filter by rarity, and open quick ability and meta details.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
            <span className="inline-flex min-h-[30px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] px-3 text-[11.5px] font-semibold text-[var(--ink-2)]">{brawlers.length} total</span>
            <span className="inline-flex min-h-[30px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] px-3 text-[11.5px] font-semibold text-[var(--ink-2)]">{activeRarity ? `${activeRarityCount} ${activeRarity}` : "All rarities"}</span>
          </div>
        </div>

        <div className="mb-8 flex w-full items-center gap-2.5 rounded-[12px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] p-2.5 shadow-[0_18px_36px_-34px_rgba(0,0,0,0.7)] backdrop-blur-2xl max-md:flex-col max-md:items-stretch max-md:gap-2">
          <div className="relative w-[200px] shrink-0 max-md:w-full">
            <div className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-3.5 text-[var(--ink)] transition-colors focus-within:border-[var(--line-2)]">
              <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search brawlers"
                className="w-full border-0 bg-transparent font-inherit text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
              />
            </div>

            {searchOpen && searchMatches.length > 0 && (
              <div
                ref={searchDropdownRef}
                className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 max-h-[280px] overflow-y-auto rounded-xl border border-[var(--line-2)] bg-[var(--panel)] p-1 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)]"
              >
                {searchMatches.slice(0, 12).map(b => (
                  <button
                    key={b.id}
                    onMouseDown={() => selectFromSearch(b)}
                    className="row-hover flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-2.5 py-2 text-left font-inherit"
                  >
                    <BrawlImage
                      src={b.imageUrl2}
                      alt={b.name}
                      width={26}
                      height={26}
                      className="size-[26px] shrink-0 object-contain"
                      sizes="26px"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{b.name}</div>
                      <div className="text-[10.5px] leading-snug tracking-[0.01em]" style={{ color: sanitizeColor(b.rarity.color) }}>{b.rarity.name}</div>
                    </div>
                  </button>
                ))}
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
                  onClick={() => setActiveRarity(null)}
                  className={`relative shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 px-[13px] py-[5px] text-[11.5px] font-medium transition-all ${!activeRarity ? "bg-[var(--panel-2)] text-[var(--ink)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
                >
                  All
                </button>
                {rarities.map(r => (
                  <button
                    key={r.name}
                    onClick={() => setActiveRarity(activeRarity === r.name ? null : r.name)}
                    className={`relative shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 px-[13px] py-[5px] text-[11.5px] font-medium transition-all ${activeRarity === r.name ? "bg-[var(--panel-2)] text-[var(--ink)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
                  >
                    {r.name}
                  </button>
                ))}
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
              onClick={() => goRarity(-1)}
              disabled={rarityOptions.length <= 1}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-25"
              aria-label="Previous rarity"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="flex-1 truncate px-2 text-center text-[12.5px] font-semibold text-[var(--ink)]">
              {activeRarity ?? "All Rarities"}
            </span>
            <span className="shrink-0 pr-1 font-mono text-[10px] text-[var(--ink-4)]">
              {rarityOptions.indexOf(activeRarity) + 1}/{rarityOptions.length}
            </span>
            <button
              onClick={() => goRarity(1)}
              disabled={rarityOptions.length <= 1}
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[var(--ink-3)] transition-colors hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)] disabled:cursor-default disabled:opacity-25"
              aria-label="Next rarity"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <BrawlerCatalog
          key={`${activeRarity ?? "all"}-${search.trim().toLowerCase()}`}
          brawlers={brawlers}
          activeRarity={activeRarity}
          search={search}
          onSelect={b => { setSelected(b); setTab("overview") }}
        />
      </div>
      {selected && typeof document !== "undefined" && (() => {
        const color = sanitizeColor(selected.rarity.color)
        const hc = HYPERCHARGES[selected.id]

        return createPortal((
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
            onClick={close}
          >
            <div
              className="bl-modal-sheet bl-modal-sheet-brawler"
              style={{
                width: "100%",
                maxWidth: 540,
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
              <div className="bl-modal-header bl-modal-header-brawler">
                <button onClick={close} className="bl-modal-close" aria-label="Close brawler details">
                  <X size={12} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingRight: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--panel-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden" }}>
                    <BrawlImage src={selected.imageUrl2} alt={selected.name} width={50} height={50} style={{ width: 50, height: 50, objectFit: "contain" }} sizes="50px" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 4 }}>{selected.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", color: "var(--ink-4)" }}>
                        {selected.rarity.name.toLowerCase()}{selected.class.name !== "Unknown" ? ` · ${selected.class.name.toLowerCase()}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", borderBottom: "1px solid var(--line)", gap: 0 }}>
                  {(["overview", "maps", "abilities"] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, color: tab === t ? "var(--ink)" : "var(--ink-4)", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${color}` : "2px solid transparent", cursor: "pointer", textTransform: "capitalize", letterSpacing: "0.01em", transition: "color 0.12s", marginBottom: -1 }}
                    >
                      {t === "overview" ? "Overview" : t === "maps" ? "Best Maps" : "Abilities"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bl-modal-body" style={{ padding: "20px" }}>
                {tab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {statsError ? (
                      <EmptyState
                        title="Stats did not load"
                        description="The brawler detail data request failed. Try fetching it again."
                        action={<StateButton onClick={() => selected && fetch(`/api/brawler-stats?id=${selected.id}`).then(r => r.json()).then(d => { setStats(d); setStatsError(false) })}>Retry</StateButton>}
                      />
                    ) : (
                    <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        {
                          label: "Total Picks",
                          value: statsLoading ? "—" : stats?.totalPicks
                            ? stats.totalPicks >= 1000 ? `${(stats.totalPicks / 1000).toFixed(1)}k` : String(stats.totalPicks)
                            : "—",
                        },
                        {
                          label: "Avg Win Rate",
                          value: statsLoading ? "—" : stats?.avgWinRate != null ? `${stats.avgWinRate.toFixed(1)}%` : "—",
                          color: stats?.avgWinRate != null ? winRateColor(stats.avgWinRate) : undefined,
                        },
                        {
                          label: "Maps Tracked",
                          value: statsLoading ? "—" : stats ? String(stats.maps.length) : "—",
                        },
                      ].map(s => (
                        <div key={s.label} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: s.color ?? "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {!statsLoading && stats && stats.modes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>By Mode</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
                          {stats.modes.slice(0, 6).map((m, i) => (
                            <div key={m.mode} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: i % 2 === 0 ? "var(--panel)" : "var(--panel-2)", gap: 12 }}>
                              <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500 }}>{m.mode}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{m.picks >= 1000 ? `${(m.picks / 1000).toFixed(1)}k` : m.picks} picks</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: winRateColor(m.winRate), minWidth: 44, textAlign: "right" }}>{m.winRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selected.description && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Description</div>
                        <p style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.65, margin: 0 }}>{cleanDesc(selected.description)}</p>
                      </div>
                    )}

                    {statsLoading && (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center justify-between rounded-[10px] border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2.5">
                            <SkeletonBlock className="h-3.5 w-24" />
                            <SkeletonBlock className="h-3.5 w-20" />
                          </div>
                        ))}
                      </div>
                    )}

                    {!statsLoading && stats && stats.totalPicks === 0 && (
                      <EmptyState
                        title="No match data yet"
                        description="This brawler has not appeared enough in the tracked battles to calculate stable stats."
                        action={<StateButton onClick={() => setTab("abilities")}>View abilities</StateButton>}
                      />
                    )}
                    </>
                    )}
                  </div>
                )}
                {tab === "maps" && (
                  <div>
                    {statsError && (
                      <EmptyState
                        title="Map stats did not load"
                        description="The brawler map data request failed."
                        action={<StateButton onClick={() => setTab("overview")}>Back to overview</StateButton>}
                      />
                    )}

                    {statsLoading && (
                      <div className="space-y-2">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div key={i} className="grid grid-cols-[1fr_72px_56px] items-center gap-3 border-b border-[var(--line)] px-2 py-2.5">
                            <SkeletonBlock className="h-3.5 w-32" />
                            <SkeletonBlock className="h-3 w-16" />
                            <SkeletonBlock className="h-3.5 w-12" />
                          </div>
                        ))}
                      </div>
                    )}

                    {!statsLoading && stats && stats.maps.length === 0 && (
                      <EmptyState
                        title="No map stats yet"
                        description="This brawler does not have enough tracked picks on any individual map."
                        action={<StateButton onClick={() => setTab("overview")}>Back to overview</StateButton>}
                      />
                    )}

                    {!statsLoading && stats && stats.maps.length > 0 && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 64px 64px", gap: 8, padding: "0 10px 8px", borderBottom: "1px solid var(--line)" }}>
                          {["Map", "Mode", "Picks", "Win %"].map(h => (
                            <span key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", textAlign: h === "Win %" || h === "Picks" ? "right" : "left" }}>{h}</span>
                          ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {stats.maps.map((m, i) => (
                            <div
                              key={`${m.map}-${m.mode}-${i}`}
                              style={{ display: "grid", gridTemplateColumns: "1fr 90px 64px 64px", gap: 8, padding: "9px 10px", borderBottom: i < stats.maps.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}
                            >
                              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.map}</span>
                              <span style={{ fontSize: 11, color: "var(--ink-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.mode}</span>
                              <span style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>{m.picks >= 1000 ? `${(m.picks / 1000).toFixed(1)}k` : m.picks}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: winRateColor(m.winRate), textAlign: "right" }}>{m.winRate.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {tab === "abilities" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {selected.gadgets.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Gadgets</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {selected.gadgets.map(g => (
                            <div key={g.id} style={{ display: "flex", gap: 12, padding: "11px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <BrawlImage src={g.imageUrl} alt={g.name} width={24} height={24} style={{ width: 24, height: 24, objectFit: "contain" }} sizes="24px" />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{g.name}</div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{cleanDesc(g.description)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.starPowers.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Star Powers</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {selected.starPowers.map(sp => (
                            <div key={sp.id} style={{ display: "flex", gap: 12, padding: "11px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <BrawlImage src={sp.imageUrl} alt={sp.name} width={24} height={24} style={{ width: 24, height: 24, objectFit: "contain" }} sizes="24px" />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{sp.name}</div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{cleanDesc(sp.description)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hc && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Hypercharge</div>
                        <div style={{ padding: "12px 14px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.15)" }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{hc.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 10 }}>{hc.description}</div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.12)" }}>+{hc.damageBoost}% DMG</span>
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(59,130,246,0.06)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.12)" }}>+{hc.shieldBoost}% Shield</span>
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(34,197,94,0.06)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.12)" }}>+{hc.speedBoost}% Speed</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selected.gadgets.length === 0 && selected.starPowers.length === 0 && !hc && (
                      <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No abilities data available.</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        ), document.body)
      })()}
    </>
  )
}
