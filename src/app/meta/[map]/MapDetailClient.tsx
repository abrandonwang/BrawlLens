"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { PulsingBorder } from "@paper-design/shaders-react"
import { ChevronDown, Flame, Search } from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import HelpTooltip from "@/components/HelpTooltip"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"
import { LeaderboardPanel, RankCell, TableHead } from "@/app/leaderboards/LeaderboardDpmShell"
import { formatBrawlerName, formatNum } from "@/lib/format"
import { formatRotationTimeRemaining } from "@/lib/rotation"
import { getTierInfo, winRateColor } from "@/lib/tiers"
import { useClickOutside } from "@/lib/useClickOutside"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "picks" | "share"

const performanceGrid = "grid grid-cols-[44px_minmax(190px,1.2fr)_96px_92px_82px_60px] items-center gap-1"
const compactSignalGrid = "grid grid-cols-[34px_minmax(0,1fr)_72px] items-center gap-1"
const mapDetailFrameClass =
  "mx-auto w-[min(1180px,calc(100vw-28px))] pb-4 pt-3 max-[560px]:w-[calc(100vw-12px)]"
const mapDetailAnalyticsClass =
  "mx-auto w-[min(1180px,calc(100vw-28px))] pb-8 max-[560px]:w-[calc(100vw-12px)]"
const MAP_DETAIL_BORDER_COLORS = ["#FF6B6B", "#5aeed0", "#ff6099", "#f5d75e", "#FF6B6B"]
const MAP_DETAIL_BORDER_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  zIndex: 3,
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  borderRadius: "inherit",
  pointerEvents: "none",
  opacity: 0.88,
}

interface Props {
  mapName: string
  imageUrl: string | null
  modeName: string | null
  totalBattles: number
  brawlers: BrawlerStat[]
  isLive: boolean
  rotationEndTime: string | null
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(digits)}%`
}

function brawlerHref(id: number) {
  return `/brawlers/${id}`
}

function formatFullNumber(value: number) {
  return value.toLocaleString("en-US")
}

function formatShare(value: number) {
  if (!Number.isFinite(value)) return "-"
  if (value >= 10) return `${value.toFixed(1)}%`
  if (value >= 1) return `${value.toFixed(2)}%`
  return `${value.toFixed(3)}%`
}

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
  } catch {
    return false
  }
}

function MapBrawlerRow({ brawler, rank, share }: { brawler: BrawlerStat; rank: number; share: number }) {
  const tier = getTierInfo(brawler.winRate)

  return (
    <div className={`bl-lb-row bl-md-performance-row ${performanceGrid}`}>
      <RankCell rank={rank} />
      <Link href={brawlerHref(brawler.brawlerId)} className="bl-lb-identity bl-md-brawler-link">
        <span className="bl-lb-avatar bl-md-brawler-avatar">
          <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={34} height={34} className="size-full object-contain" loading="lazy" sizes="34px" />
        </span>
        <div className="bl-lb-row-main">
          <div className="bl-lb-name">{formatBrawlerName(brawler.name)}</div>
          <div className="bl-lb-subline">{formatFullNumber(brawler.picks)} games</div>
        </div>
      </Link>
      <span className="bl-lb-row-stat" style={{ color: winRateColor(brawler.winRate) }}>{formatPercent(brawler.winRate)}</span>
      <span className="bl-lb-row-mono">{formatNum(brawler.picks)}</span>
      <span className="bl-lb-row-mono">{formatShare(share)}</span>
      <span className="bl-tier-tier justify-self-center" style={{ color: tier.color }}>{tier.label}</span>
    </div>
  )
}

function CompactSignalRow({ brawler, rank }: { brawler: BrawlerStat; rank: number }) {
  return (
    <div className={`bl-lb-row bl-md-compact-row ${compactSignalGrid}`}>
      <RankCell rank={rank} />
      <Link href={brawlerHref(brawler.brawlerId)} className="bl-lb-identity bl-md-brawler-link">
        <span className="bl-lb-avatar bl-md-brawler-avatar">
          <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={30} height={30} className="size-full object-contain" loading="lazy" sizes="30px" />
        </span>
        <div className="bl-lb-row-main">
          <div className="bl-lb-name">{formatBrawlerName(brawler.name)}</div>
          <div className="bl-lb-subline">{formatNum(brawler.picks)} games</div>
        </div>
      </Link>
      <span className="bl-lb-row-stat" style={{ color: winRateColor(brawler.winRate) }}>{formatPercent(brawler.winRate)}</span>
    </div>
  )
}

export default function MapDetailClient({ mapName, imageUrl, modeName, totalBattles, brawlers, isLive, rotationEndTime }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [minShare, setMinShare] = useState(0.1)
  const [sortBy, setSortBy] = useState<SortKey>("picks")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [now, setNow] = useState(() => Date.now())
  const [introBorderReady, setIntroBorderReady] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const shareDropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.add("landing-bg")
    return () => document.body.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    setIntroBorderReady(browserSupportsWebGL())
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(interval)
  }, [])

  useClickOutside(sortDropdownRef, () => setSortOpen(false), sortOpen)
  useClickOutside(shareDropdownRef, () => setShareOpen(false), shareOpen)
  useClickOutside([searchDropdownRef, searchInputRef], () => setSearchOpen(false), searchOpen)

  const totalPicks = brawlers.reduce((sum, brawler) => sum + brawler.picks, 0)
  const totalWins = brawlers.reduce((sum, brawler) => sum + brawler.wins, 0)
  const avgWinRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : null

  const brawlerShare = useCallback((brawler: BrawlerStat) => {
    return totalPicks > 0 ? (brawler.picks / totalPicks) * 100 : 0
  }, [totalPicks])

  const sortValue = useCallback((brawler: BrawlerStat, key: SortKey) => {
    if (key === "share") return brawlerShare(brawler)
    return brawler[key]
  }, [brawlerShare])

  const filtered = useMemo(() => {
    return brawlers
      .filter(brawler => {
        if (brawlerShare(brawler) < minShare) return false
        if (searchQuery && !formatBrawlerName(brawler.name).toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => sortDir === "desc" ? sortValue(b, sortBy) - sortValue(a, sortBy) : sortValue(a, sortBy) - sortValue(b, sortBy))
  }, [brawlers, searchQuery, minShare, sortBy, sortDir, brawlerShare, sortValue])

  const bestWinRate = useMemo(() => [...brawlers].filter(b => brawlerShare(b) >= minShare).sort((a, b) => b.winRate - a.winRate)[0] ?? null, [brawlers, minShare, brawlerShare])
  const reliablePicks = useMemo(() => {
    return [...brawlers]
      .filter(brawler => brawlerShare(brawler) >= minShare)
      .sort((a, b) => (b.winRate * 0.7 + Math.log10(b.picks + 1) * 8) - (a.winRate * 0.7 + Math.log10(a.picks + 1) * 8))
      .slice(0, 8)
  }, [brawlers, minShare, brawlerShare])
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "picks", label: "Games" },
    { key: "winRate", label: "Win Rate" },
    { key: "share", label: "Pick Share" },
  ]
  const shareOptions = [
    { value: 0, label: "All" },
    { value: 0.05, label: "0.05%+" },
    { value: 0.1, label: "0.1%+" },
    { value: 0.5, label: "0.5%+" },
    { value: 1, label: "1%+" },
  ]
  const activeShareOption = shareOptions.find(option => option.value === minShare) ?? shareOptions[2]
  const activeSortOption = sortOptions.find(option => option.key === sortBy) ?? sortOptions[0]
  const rotationLabel = isLive ? formatRotationTimeRemaining(rotationEndTime, now) : null
  const searchMatches = searchQuery.trim()
    ? brawlers.filter(brawler => formatBrawlerName(brawler.name).toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 12)
    : []
  const topMetrics = [
    { label: "Mode", value: modeName ?? "-", detail: rotationLabel ?? undefined },
    { label: "Battles", value: formatNum(totalBattles), detail: "tracked" },
    { label: "Avg WR", value: formatPercent(avgWinRate), color: avgWinRate != null ? winRateColor(avgWinRate) : undefined },
    { label: "Best", value: bestWinRate ? formatBrawlerName(bestWinRate.name) : "-", detail: bestWinRate ? `${formatPercent(bestWinRate.winRate)} WR` : undefined },
    { label: "Brawlers", value: formatNum(brawlers.length) },
  ]

  return (
    <main className="bl-bd-shell bl-md-shell">
      <div className={mapDetailFrameClass}>
        <section className="relative isolate mb-4 overflow-visible rounded-[10px] max-[560px]:mb-3" aria-labelledby="map-title">
          {introBorderReady && (
            <PulsingBorder
              aria-hidden="true"
              className="bl-tier-hero-border-shader"
              style={MAP_DETAIL_BORDER_STYLE}
              colors={MAP_DETAIL_BORDER_COLORS}
              colorBack="#00000000"
              roundness={0.08}
              thickness={0.08}
              softness={0.72}
              intensity={0.22}
              bloom={0.22}
              spots={5}
              spotSize={0.48}
              pulse={0.22}
              smoke={0.28}
              smokeSize={0.64}
              speed={0.82}
              scale={1}
            />
          )}

          <div className="relative z-[2] min-h-[132px] rounded-[10px] border-[2.5px] border-[#FF6B6B] bg-[#101015] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-[760px]:px-4 max-[760px]:py-4">
            <div className="grid min-h-[92px] grid-cols-[minmax(0,1fr)_minmax(520px,0.9fr)] items-center gap-5 max-[980px]:grid-cols-1 max-[980px]:gap-4">
              <div className="flex min-w-0 items-center gap-3.5 max-[560px]:items-start">
                <div className="grid h-[100px] w-[66px] shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[rgba(245,244,241,0.09)] bg-[#15151b] max-[560px]:h-[82px] max-[560px]:w-[54px]">
                  {imageUrl ? (
                    <BrawlImage
                      src={imageUrl}
                      alt={mapName}
                      width={132}
                      height={200}
                      className="h-full w-full object-cover"
                      priority
                      sizes="(max-width: 560px) 54px, 66px"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Flame size={24} />
                  )}
                </div>

                <div className="min-w-0">
                  <h1 id="map-title" className="m-0 flex min-w-0 flex-wrap items-center gap-2 text-[clamp(24px,3vw,34px)] font-[900] leading-[0.98] tracking-[0] text-[#f5f4f1] [font-family:var(--font-heading)]">
                    {mapName}
                    {modeName && (
                      <HelpTooltip label={`${mapName} mode`} align="left">
                        {mapName} is grouped under {modeName}.{rotationLabel ? ` ${rotationLabel}.` : ""}
                      </HelpTooltip>
                    )}
                    {rotationLabel && <span className="rounded-[6px] border border-[rgba(255, 148, 148,0.26)] bg-[rgba(255, 107, 107,0.12)] px-2 py-1 text-[9px] font-black uppercase leading-none text-[#c4b5fd] [font-family:var(--font-label)]">{rotationLabel}</span>}
                  </h1>
                  <p className="m-0 mt-1.5 max-w-[560px] text-[12px] font-[620] leading-[1.42] text-[rgba(245,244,241,0.82)]">
                    Compare brawler performance, pick volume, and win rates for this map from tracked battle data.
                  </p>
                </div>
              </div>

              <div className="min-w-0 overflow-x-auto border-x border-y border-[rgba(245,244,241,0.075)] px-3 [scrollbar-width:thin] max-[640px]:hidden" aria-label={`${mapName} core metrics`}>
                <table className="w-full min-w-[520px] table-fixed border-collapse">
                  <thead>
                    <tr>
                      {topMetrics.map(metric => (
                        <th key={metric.label} scope="col" className="border-b border-[rgba(245,244,241,0.06)] px-2 py-2 text-left text-[10px] font-[860] uppercase leading-none text-[rgba(245,244,241,0.74)] first:pl-0 last:pr-0">
                          {metric.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {topMetrics.map(metric => (
                        <td key={metric.label} className="px-2 py-2.5 align-top first:pl-0 last:pr-0">
                          <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-[900] leading-none text-[#f5f4f1] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]" style={metric.color ? { color: metric.color } : undefined}>
                            {metric.value}
                          </strong>
                          {metric.detail && <small className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-[760] leading-none text-[rgba(245,244,241,0.74)]">{metric.detail}</small>}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="hidden border-x border-y border-[rgba(245,244,241,0.075)] px-3 max-[640px]:grid" aria-label={`${mapName} core metrics`}>
                {topMetrics.map(metric => (
                  <div key={metric.label} className="grid min-h-[34px] grid-cols-[92px_minmax(0,1fr)] items-center gap-3 border-b border-[rgba(245,244,241,0.06)] py-2 last:border-b-0">
                    <span className="text-[10px] font-[860] uppercase leading-none text-[rgba(245,244,241,0.74)]">{metric.label}</span>
                    <span className="min-w-0 text-right">
                      <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[17px] font-[900] leading-none text-[#f5f4f1] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]" style={metric.color ? { color: metric.color } : undefined}>
                        {metric.value}
                      </strong>
                      {metric.detail && <small className="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-[760] leading-none text-[rgba(245,244,241,0.74)]">{metric.detail}</small>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={mapDetailAnalyticsClass}>
        <section className="rounded-[12px] border border-[rgba(245,244,241,0.08)] bg-[#101015] p-3 shadow-none">
          <section className="bl-md-performance">
            <div className="bl-md-table-panel min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3 max-[720px]:flex-col max-[720px]:items-stretch">
                <div>
                  <h2 className="m-0 text-[15px] font-[860] leading-none text-[#f5f4f1] [font-family:var(--font-heading)]">Brawler Performance</h2>
                </div>
              </div>

              <div className="bl-tier-toolbar bl-meta-toolbar mb-4">
                <div className="bl-tier-selector-group">
                  <div className="bl-tier-selector-anchor">
                    <div
                      ref={sortDropdownRef}
                      className="bl-tier-selector-wrap"
                      onPointerEnter={event => {
                        if (event.pointerType !== "mouse") return
                        setSortOpen(true)
                        setShareOpen(false)
                        setSearchOpen(false)
                      }}
                      onPointerLeave={event => {
                        if (event.pointerType === "mouse") setSortOpen(false)
                      }}
                      onFocus={() => {
                        setSortOpen(true)
                        setShareOpen(false)
                        setSearchOpen(false)
                      }}
                      onBlur={event => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSortOpen(false)
                      }}
                    >
                      <button
                        type="button"
                        className="bl-tier-selector"
                        aria-haspopup="listbox"
                        aria-expanded={sortOpen}
                        onClick={() => {
                          setSortOpen(open => !open)
                          setShareOpen(false)
                          setSearchOpen(false)
                        }}
                      >
                        <span>{activeSortOption.label}</span>
                        <span aria-hidden="true">{sortDir === "desc" ? "↓" : "↑"}</span>
                        <ChevronDown size={14} className={sortOpen ? "rotate-180" : ""} />
                      </button>
                      <div className={`bl-tier-menu bl-tier-menu-list ${sortOpen ? "is-open" : ""}`} role="listbox">
                        {sortOptions.map(option => {
                          const active = sortBy === option.key
                          return (
                            <button
                              key={option.key}
                              type="button"
                              role="option"
                              aria-selected={active}
                              className={`bl-tier-menu-row ${active ? "is-active" : ""}`}
                              onClick={() => {
                                if (sortBy === option.key) {
                                  setSortDir(current => current === "desc" ? "asc" : "desc")
                                } else {
                                  setSortBy(option.key)
                                  setSortDir("desc")
                                }
                                setSortOpen(false)
                              }}
                            >
                              <strong>{option.label}</strong>
                              {active && <span>{sortDir === "desc" ? "↓" : "↑"}</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bl-tier-selector-anchor">
                    <div
                      ref={shareDropdownRef}
                      className="bl-tier-selector-wrap"
                      onPointerEnter={event => {
                        if (event.pointerType !== "mouse") return
                        setShareOpen(true)
                        setSortOpen(false)
                        setSearchOpen(false)
                      }}
                      onPointerLeave={event => {
                        if (event.pointerType === "mouse") setShareOpen(false)
                      }}
                      onFocus={() => {
                        setShareOpen(true)
                        setSortOpen(false)
                        setSearchOpen(false)
                      }}
                      onBlur={event => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setShareOpen(false)
                      }}
                    >
                      <button
                        type="button"
                        className="bl-tier-selector"
                        aria-haspopup="listbox"
                        aria-expanded={shareOpen}
                        onClick={() => {
                          setShareOpen(open => !open)
                          setSortOpen(false)
                          setSearchOpen(false)
                        }}
                      >
                        <span>{activeShareOption.label}</span>
                        <ChevronDown size={14} className={shareOpen ? "rotate-180" : ""} />
                      </button>
                      <div className={`bl-tier-menu bl-tier-menu-list ${shareOpen ? "is-open" : ""}`} role="listbox">
                        {shareOptions.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={minShare === option.value}
                            className={`bl-tier-menu-card ${minShare === option.value ? "is-active" : ""}`}
                            onClick={() => {
                              setMinShare(option.value)
                              setShareOpen(false)
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bl-tier-search-anchor">
                  <div className="bl-tier-search">
                    <div className="bl-tier-search-bar">
                      <Search size={15} />
                      <input
                        ref={searchInputRef}
                        placeholder="Search brawler..."
                        value={searchQuery}
                        onChange={event => {
                          const value = event.target.value
                          setSearchQuery(value)
                          setSearchOpen(value.trim().length > 0)
                          setSortOpen(false)
                          setShareOpen(false)
                        }}
                        onFocus={() => {
                          setSearchOpen(searchQuery.trim().length > 0)
                          setSortOpen(false)
                          setShareOpen(false)
                        }}
                      />
                    </div>

                    {searchOpen && searchMatches.length > 0 && (
                      <div ref={searchDropdownRef} className="bl-tier-search-menu">
                        {searchMatches.map(brawler => (
                          <button
                            key={brawler.brawlerId}
                            type="button"
                            className="flex w-full cursor-pointer items-center gap-2 rounded-[8px] border-0 bg-transparent p-2 text-left text-[rgba(245,244,241,0.78)] transition-colors hover:text-[#FF9494]"
                            onClick={() => {
                              setSearchQuery(formatBrawlerName(brawler.name))
                              setSearchOpen(false)
                            }}
                          >
                            <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={28} height={28} className="size-7 object-contain" sizes="28px" />
                            <span>
                              <strong className="block text-[12px] font-[820]">{formatBrawlerName(brawler.name)}</strong>
                              <small className="block text-[10px] text-[rgba(245,244,241,0.58)]">{formatShare(brawlerShare(brawler))} share</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  title="No brawlers match"
                  description="Your search or pick-share filter removed every brawler from this map."
                  action={<StateButton onClick={() => { setSearchQuery(""); setMinShare(0.1) }}>Clear filters</StateButton>}
                  secondary={<StateLink href="/meta">All maps</StateLink>}
                />
              ) : (
                <LeaderboardPanel>
                  <TableHead className={`${performanceGrid} bl-md-performance-head`}>
                    <span>Rank</span>
                    <span>Brawler</span>
                    <span>Win rate</span>
                    <span>Games</span>
                    <span>Share</span>
                    <span className="justify-self-center">Tier</span>
                  </TableHead>
                  <div className="bl-lb-table-list">
                    {filtered.map((brawler, index) => <MapBrawlerRow key={brawler.brawlerId} brawler={brawler} rank={index + 1} share={brawlerShare(brawler)} />)}
                  </div>
                </LeaderboardPanel>
              )}
            </div>

            <div className="sticky top-[86px] min-w-0 self-start border-l border-[rgba(245,244,241,0.08)] pl-3 max-[900px]:static max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:pl-0 max-[900px]:pt-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] font-[860] leading-none text-[#f5f4f1] [font-family:var(--font-heading)]">Top Signals</span>
              </div>
              <div className="bl-lb-table-list bl-md-compact-list">
                {reliablePicks.length ? reliablePicks.map((brawler, index) => (
                  <CompactSignalRow key={brawler.brawlerId} brawler={brawler} rank={index + 1} />
                )) : (
                  <div className="bl-bd-empty">No reliable picks at this threshold.</div>
                )}
                </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}
