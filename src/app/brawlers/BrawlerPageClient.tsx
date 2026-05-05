"use client"

import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { BarChart3, Info, Search, X } from "lucide-react"
import BrawlerCatalog, { type CatalogBrawlerStats } from "@/components/BrawlerCatalog"
import Modal, { ModalCloseButton } from "@/components/Modal"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, SkeletonBlock, StateButton } from "@/components/PolishStates"
import type { HyperchargeData } from "@/data/hypercharges"
import { BUFFIES } from "@/data/buffies"
import { winRateColor } from "@/lib/tiers"
import { useClickOutside } from "@/lib/useClickOutside"
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

interface BrawlerStats {
  totalPicks: number
  avgWinRate: number | null
  maps: { map: string; mode: string; picks: number; winRate: number }[]
  modes: { mode: string; picks: number; winRate: number }[]
  histogram: number[]
  trend7: { label: string; winRate: number; picks: number }[]
  trend30: { label: string; winRate: number; picks: number }[]
}

type Tab = "overview" | "maps" | "abilities"
type CatalogSort = "name" | "winRate" | "picks" | "recentBuffs"
type MapSort = "winRate" | "picks" | "map" | "mode"

function formatPicks(picks: number | null | undefined) {
  if (!picks) return "-"
  return picks >= 1000 ? `${(picks / 1000).toFixed(1)}k` : String(picks)
}

function hasRecentBuffs(brawler: Brawler) {
  const buffy = BUFFIES[brawler.id]
  return Boolean(buffy?.hypercharge || Object.keys(buffy?.gadgets ?? {}).length || Object.keys(buffy?.starPowers ?? {}).length)
}

function formatFilterLabel(name: string) {
  return name.replace(/-/g, " ")
}

function WinRateSparkline({ values }: { values: { winRate: number }[] }) {
  if (values.length < 2) {
    return <div className="grid h-[74px] place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-[11px] text-[var(--ink-4)]">Trend data pending</div>
  }
  const points = values.map((point, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 220
    const y = 60 - (Math.max(0, Math.min(100, point.winRate)) / 100) * 52
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  return (
    <svg viewBox="0 0 220 66" className="h-[74px] w-full rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-2 text-[var(--accent)]">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WinRateHistogram({ buckets }: { buckets: number[] }) {
  const labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
  const max = Math.max(...buckets, 1)
  return (
    <div className="grid h-[112px] grid-cols-5 items-end gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2">
      {labels.map((label, index) => (
        <div key={label} className="flex h-full min-w-0 flex-col justify-end gap-1">
          <div
            className="min-h-1 rounded-t bg-[var(--accent)] opacity-80"
            style={{ height: `${Math.max(6, ((buckets[index] ?? 0) / max) * 74)}px` }}
            title={`${label}%: ${buckets[index] ?? 0} maps`}
          />
          <span className="truncate text-center text-[9px] text-[var(--ink-4)]">{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function BrawlerPageClient({ brawlers }: { brawlers: Brawler[] }) {
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [activeClass, setActiveClass] = useState<string | null>(null)
  const [catalogSort, setCatalogSort] = useState<CatalogSort>("name")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Brawler | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([])
  const [tab, setTab] = useState<Tab>("overview")
  const [stats, setStats] = useState<BrawlerStats | null>(null)
  const [catalogStats, setCatalogStats] = useState<Record<number, CatalogBrawlerStats>>({})
  const [hypercharges, setHypercharges] = useState<Record<number, HyperchargeData>>({})
  const [mapSort, setMapSort] = useState<{ key: MapSort; dir: "asc" | "desc" }>({ key: "winRate", dir: "desc" })
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [topBrawler, setTopBrawler] = useState<{
    id: number
    name: string
    winRate: number
    picks: number
    score: number
    consistency: number
    bestMap: { name: string; mode: string; winRate: number } | null
  } | null>(null)
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/brawlers/top")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.brawler) setTopBrawler(d.brawler) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/brawlers/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.stats) setCatalogStats(d.stats) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/brawlers/hypercharges")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.hypercharges) setHypercharges(d.hypercharges) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId) {
      const match = brawlers.find(b => String(b.id) === openId)
      if (match) setSelected(match)
    }
  }, [searchParams, brawlers])

  const close = useCallback(() => {
    setSelected(null)
    setStats(null)
    setTab("overview")
  }, [])

  const searchTerm = search.trim().toLowerCase()
  const searchMatches = searchTerm
    ? brawlers.filter(b => b.name.toLowerCase().includes(searchTerm))
    : brawlers
  const classes = Array.from(new Set(brawlers.map(b => b.class.name).filter(name => name && name !== "Unknown"))).sort()
  const filteredBrawlers = brawlers
    .filter(b => {
      const matchesRarity = !activeRarity || b.rarity.name === activeRarity
      const matchesClass = !activeClass || b.class.name === activeClass
      const matchesSearch = !searchTerm || b.name.toLowerCase().includes(searchTerm)
      return matchesRarity && matchesClass && matchesSearch
    })
    .sort((a, b) => {
      if (catalogSort === "winRate") {
        return (catalogStats[b.id]?.winRate ?? -1) - (catalogStats[a.id]?.winRate ?? -1) || a.name.localeCompare(b.name)
      }
      if (catalogSort === "picks") {
        return (catalogStats[b.id]?.picks ?? 0) - (catalogStats[a.id]?.picks ?? 0) || a.name.localeCompare(b.name)
      }
      if (catalogSort === "recentBuffs") {
        return Number(hasRecentBuffs(b)) - Number(hasRecentBuffs(a)) || a.name.localeCompare(b.name)
      }
      return a.name.localeCompare(b.name)
    })
  const comparisonBrawlers = selectedForCompare
    .map(id => brawlers.find(b => b.id === id))
    .filter((b): b is Brawler => Boolean(b))

  function selectFromSearch(brawler: Brawler) {
    setSearch(brawler.name)
    setSelected(brawler)
    setTab("overview")
    setSearchOpen(false)
  }

  function toggleCompare(brawler: Brawler) {
    setSelectedForCompare(current => {
      if (current.includes(brawler.id)) return current.filter(id => id !== brawler.id)
      return [...current, brawler.id].slice(-3)
    })
  }

  useClickOutside([searchDropdownRef, searchInputRef], () => setSearchOpen(false), searchOpen)

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
  const filteredCount = filteredBrawlers.length

  return (
    <>
      <div className="mx-auto w-full max-w-[1080px] px-6 pt-12 pb-24 max-md:px-4 max-md:pt-8 max-md:pb-[64px] max-[360px]:px-3 max-[360px]:pt-6 max-[360px]:pb-12">
        <div className="mb-8 flex items-end justify-between gap-8 max-md:flex-col max-md:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(28px,4.1vw,46px)] leading-[1.07] font-semibold tracking-[-0.01em] text-[var(--ink)]">Brawlers</h1>
            <p className="mt-3 mb-0 max-w-[640px] text-[17px] leading-[1.47] tracking-[-0.022em] text-[var(--ink-3)]">Browse every brawler, filter by rarity, and open quick ability and meta details.</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
            <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{brawlers.length} total</span>
            <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{filteredCount} shown</span>
          </div>
        </div>

        <div className="page-summary mb-6 flex items-center justify-between gap-6 p-8 max-md:flex-col max-md:items-stretch max-sm:p-6" style={{ "--summary-gradient": "linear-gradient(135deg, #7C3AED 0%, #EC4899 46%, #14B8D6 100%)" } as CSSProperties}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/20 bg-white/10">
              {topBrawler && (
                <BrawlImage src={brawlerIconUrl(topBrawler.id)} alt={topBrawler.name} width={56} height={56} sizes="56px" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[12px] leading-none tracking-[0.08em] text-white/70 uppercase">Best Overall Brawler</p>
              <h2 className="m-0 truncate text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] text-white">
                {topBrawler ? (brawlers.find(b => b.id === topBrawler.id)?.name ?? topBrawler.name) : "Loading..."}
              </h2>
              {topBrawler && (
                <Link href="/calculations" className="mt-2 mb-0 flex items-start gap-1.5 text-[14px] leading-[1.43] tracking-[-0.016em] text-white/75 hover:underline underline-offset-4">
                  <Info size={12} className="mt-[4px] shrink-0" />
                  <span>Why: score blends win rate, volume, map stability.</span>
                </Link>
              )}
            </div>
          </div>
          <div className="grid min-w-[min(420px,48%)] grid-cols-3 gap-2 max-md:min-w-0">
            <div className="page-summary-stat">
              <span>Overall score</span>
              <strong>{topBrawler ? topBrawler.score.toFixed(1) : "-"}</strong>
            </div>
            <div className="page-summary-stat">
              <span>Win rate</span>
              <strong>{topBrawler ? `${topBrawler.winRate.toFixed(1)}%` : "-"}</strong>
            </div>
            <div className="page-summary-stat">
              <span>Stability</span>
              <strong>{topBrawler ? `${topBrawler.consistency.toFixed(0)}%` : "-"}</strong>
            </div>
          </div>
        </div>

        <div className="relative z-30 mb-8 grid grid-cols-[minmax(240px,320px)_minmax(0,1fr)_minmax(150px,190px)] gap-x-4 gap-y-3 rounded-[18px] border border-[var(--line)] bg-[var(--panel)] p-4 max-lg:grid-cols-[minmax(220px,280px)_minmax(150px,190px)] max-md:grid-cols-1">
          <div className="relative max-md:w-full">
            <div className="flex h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[var(--ink)] transition-colors focus-within:border-[var(--accent)]">
              <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setSearchOpen(true) }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search brawlers"
                className="w-full border-0 bg-transparent font-inherit text-[17px] tracking-[-0.022em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
              />
            </div>

            {searchOpen && searchMatches.length > 0 && (
              <div
                ref={searchDropdownRef}
                className="absolute top-[calc(100%+6px)] right-0 left-0 z-50 max-h-[280px] overflow-y-auto rounded-[18px] border border-[var(--line-2)] bg-[var(--panel)] p-1"
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

          <div className="col-span-3 row-start-2 space-y-2 max-lg:col-span-2 max-lg:row-start-2 max-md:col-span-1 max-md:row-auto">
            <div className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-1">
              <span className="text-[12px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Rarity</span>
              <div className="flex min-w-0 flex-wrap gap-1">
                <button
                  onClick={() => setActiveRarity(null)}
                  className={`rounded-full border px-3 py-1.5 text-[14px] font-normal tracking-[-0.016em] transition ${activeRarity === null ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                >
                  All
                </button>
                {rarities.map(rarity => (
                  <button
                    key={rarity.name}
                    onClick={() => setActiveRarity(current => current === rarity.name ? null : rarity.name)}
                    className={`rounded-full border px-3 py-1.5 text-[14px] font-normal tracking-[-0.016em] transition ${activeRarity === rarity.name ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                  >
                    {rarity.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-2 max-sm:grid-cols-1">
              <span className="text-[12px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Class</span>
              <div className="flex min-w-0 flex-wrap gap-1">
                <button
                  onClick={() => setActiveClass(null)}
                  className={`rounded-full border px-3 py-1.5 text-[14px] font-normal tracking-[-0.016em] transition ${activeClass === null ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                >
                  All
                </button>
                {classes.map(name => (
                  <button
                    key={name}
                    onClick={() => setActiveClass(current => current === name ? null : name)}
                    className={`rounded-full border px-3 py-1.5 text-[14px] font-normal tracking-[-0.016em] capitalize transition ${activeClass === name ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"}`}
                  >
                    {formatFilterLabel(name)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-start-3 row-start-1 flex h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 max-lg:col-start-2 max-lg:row-start-1 max-md:col-start-auto max-md:row-auto max-md:w-full">
            <span className="text-[12px] font-normal tracking-[-0.01em] text-[var(--ink-4)]">Sort</span>
            <select
              value={catalogSort}
              onChange={event => setCatalogSort(event.target.value as CatalogSort)}
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] font-normal tracking-[-0.016em] text-[var(--ink)] outline-none"
            >
              <option value="name">Name</option>
              <option value="winRate">Win rate</option>
              <option value="picks">Picks</option>
              <option value="recentBuffs">Recent buffs</option>
            </select>
          </div>
        </div>

        {comparisonBrawlers.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--panel)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-[var(--ink)]">Compare brawlers</span>
              </div>
              <button onClick={() => setSelectedForCompare([])} className="grid size-7 place-items-center rounded-md border border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:text-[var(--ink)]" aria-label="Clear comparison">
                <X size={13} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-0 max-md:grid-cols-1">
              {comparisonBrawlers.map(brawler => {
                const stat = catalogStats[brawler.id]
                const color = sanitizeColor(brawler.rarity.color)
                return (
                  <div key={brawler.id} className="border-r border-[var(--line)] p-4 last:border-r-0 max-md:border-r-0 max-md:border-b max-md:last:border-b-0">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="grid size-12 shrink-0 place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)]">
                        <BrawlImage src={brawler.imageUrl2} alt={brawler.name} width={42} height={42} className="size-[42px] object-contain" sizes="42px" />
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-[14px] text-[var(--ink)]">{brawler.name}</strong>
                        <span className="text-[11px] font-medium" style={{ color }}>{brawler.rarity.name}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2 py-2">
                        <span className="block text-[9.5px] uppercase text-[var(--ink-4)]">Win</span>
                        <strong className="text-[12px]" style={{ color: stat?.winRate != null ? winRateColor(stat.winRate) : "var(--ink-4)" }}>{stat?.winRate != null ? `${stat.winRate.toFixed(1)}%` : "-"}</strong>
                      </div>
                      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2 py-2">
                        <span className="block text-[9.5px] uppercase text-[var(--ink-4)]">Picks</span>
                        <strong className="text-[12px] text-[var(--ink)]">{formatPicks(stat?.picks)}</strong>
                      </div>
                      <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-2 py-2">
                        <span className="block text-[9.5px] uppercase text-[var(--ink-4)]">Maps</span>
                        <strong className="text-[12px] text-[var(--ink)]">{stat?.mapCount ?? "-"}</strong>
                      </div>
                    </div>
                    <div className="mt-3 min-h-8 text-[11.5px] leading-snug text-[var(--ink-3)]">
                      {stat?.bestMap ? `${stat.bestMap.name} is the best tracked map at ${stat.bestMap.winRate.toFixed(1)}%.` : "No qualifying map data yet."}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <BrawlerCatalog
          key={`${activeRarity ?? "all"}-${activeClass ?? "all"}-${searchTerm}-${catalogSort}`}
          brawlers={filteredBrawlers}
          stats={catalogStats}
          selectedForCompare={selectedForCompare}
          onToggleCompare={toggleCompare}
          onSelect={b => { setSelected(b); setTab("overview") }}
        />
      </div>
      <Modal open={!!selected} onClose={close} size="md" labelledBy="brawler-modal-title">
        {selected && (() => {
          const color = sanitizeColor(selected.rarity.color)
          const hc = hypercharges[selected.id]
          const sortedMaps = stats?.maps
            ? [...stats.maps].sort((a, b) => {
                const dir = mapSort.dir === "asc" ? 1 : -1
                if (mapSort.key === "map") return a.map.localeCompare(b.map) * dir
                if (mapSort.key === "mode") return a.mode.localeCompare(b.mode) * dir
                if (mapSort.key === "picks") return (a.picks - b.picks) * dir
                return (a.winRate - b.winRate) * dir
              })
            : []
          const setMapHeaderSort = (key: MapSort) => {
            setMapSort(current => current.key === key
              ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
              : { key, dir: key === "map" || key === "mode" ? "asc" : "desc" })
          }
          return (
            <>
              <div className="bl-modal-header bl-modal-header-brawler">
                <ModalCloseButton onClick={close} label="Close brawler details" />

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingRight: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--panel-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden" }}>
                    <BrawlImage src={selected.imageUrl2} alt={selected.name} width={50} height={50} style={{ width: 50, height: 50, objectFit: "contain" }} sizes="50px" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div id="brawler-modal-title" style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 4 }}>{selected.name}</div>
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
                          value: statsLoading ? "-" : stats?.totalPicks
                            ? stats.totalPicks >= 1000 ? `${(stats.totalPicks / 1000).toFixed(1)}k` : String(stats.totalPicks)
                            : "-",
                        },
                        {
                          label: "Avg Win Rate",
                          value: statsLoading ? "-" : stats?.avgWinRate != null ? `${stats.avgWinRate.toFixed(1)}%` : "-",
                          color: stats?.avgWinRate != null ? winRateColor(stats.avgWinRate) : undefined,
                        },
                        {
                          label: "Maps Tracked",
                          value: statsLoading ? "-" : stats ? String(stats.maps.length) : "-",
                        },
                      ].map(s => (
                        <div key={s.label} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: s.color ?? "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {!statsLoading && stats && (
                      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-normal text-[var(--ink-4)]">
                            <BarChart3 size={12} />
                            7d win-rate sparkline
                          </div>
                          <WinRateSparkline values={stats.trend7 ?? []} />
                        </div>
                        <div>
                          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-normal text-[var(--ink-4)]">
                            <BarChart3 size={12} />
                            Map win-rate histogram
                          </div>
                          <WinRateHistogram buckets={stats.histogram ?? []} />
                        </div>
                      </div>
                    )}
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
                          {[
                            ["Map", "map"],
                            ["Mode", "mode"],
                            ["Picks", "picks"],
                            ["Win %", "winRate"],
                          ].map(([label, key]) => (
                            <button
                              key={key}
                              onClick={() => setMapHeaderSort(key as MapSort)}
                              style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: mapSort.key === key ? "var(--ink)" : "var(--ink-4)", textTransform: "uppercase", textAlign: label === "Win %" || label === "Picks" ? "right" : "left" }}
                            >
                              {label}{mapSort.key === key ? (mapSort.dir === "asc" ? " ↑" : " ↓") : ""}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {sortedMaps.map((m, i) => (
                            <div
                              key={`${m.map}-${m.mode}-${i}`}
                              style={{ display: "grid", gridTemplateColumns: "1fr 90px 64px 64px", gap: 8, padding: "9px 10px", borderBottom: i < sortedMaps.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}
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
            </>
          )
        })()}
      </Modal>
    </>
  )
}
