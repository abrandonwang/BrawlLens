"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BarChart3, Flame, MapPinned, Search, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"
import TierlistSubNav from "@/components/TierlistSubNav"
import { formatBrawlerName, formatNum } from "@/lib/format"
import { getBarWidth, getTierInfo, winRateColor } from "@/lib/tiers"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"

interface Props {
  mapName: string
  imageUrl: string | null
  modeName: string | null
  totalBattles: number
  brawlers: BrawlerStat[]
  isLive: boolean
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(digits)}%`
}

function brawlerHref(id: number) {
  return `/brawlers/${id}`
}

function StatMetric({ value, label, detail, color }: { value: string; label: string; detail?: string; color?: string }) {
  return (
    <div className="bl-bd-stat">
      <strong style={color ? { color } : undefined}>{value}</strong>
      <span>{label}</span>
      {detail && <em>{detail}</em>}
    </div>
  )
}

function Distribution({ brawlers }: { brawlers: BrawlerStat[] }) {
  const buckets = useMemo(() => {
    return brawlers.reduce<number[]>((acc, brawler) => {
      const index = Math.max(0, Math.min(4, Math.floor(brawler.winRate / 20)))
      acc[index] += 1
      return acc
    }, [0, 0, 0, 0, 0])
  }, [brawlers])
  const labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
  const max = Math.max(...buckets, 1)

  return (
    <div className="bl-md-dist">
      {labels.map((label, index) => (
        <div key={label} className="bl-md-dist-bar">
          <i style={{ height: `${Math.max(8, ((buckets[index] ?? 0) / max) * 104)}px` }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

function TierBreakdown({ brawlers }: { brawlers: BrawlerStat[] }) {
  const tiers = useMemo(() => {
    const counts = new Map<string, { count: number; color: string }>()
    for (const brawler of brawlers) {
      const tier = getTierInfo(brawler.winRate)
      const current = counts.get(tier.label) ?? { count: 0, color: tier.color }
      current.count += 1
      counts.set(tier.label, current)
    }
    return ["S", "A", "B", "C", "D"].map(label => ({ label, count: counts.get(label)?.count ?? 0, color: counts.get(label)?.color ?? "var(--lb-text-3)" }))
  }, [brawlers])

  return (
    <div className="bl-md-tier-grid">
      {tiers.map(tier => (
        <div key={tier.label}>
          <b style={{ color: tier.color }}>{tier.label}</b>
          <span>{tier.count}</span>
        </div>
      ))}
    </div>
  )
}

export default function MapDetailClient({ mapName, imageUrl, modeName, totalBattles, brawlers, isLive }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [minPicks, setMinPicks] = useState(10)
  const [sortBy, setSortBy] = useState<SortKey>("picks")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    document.body.classList.add("landing-bg")
    return () => document.body.classList.remove("landing-bg")
  }, [])

  const filtered = useMemo(() => {
    return brawlers
      .filter(brawler => {
        if (brawler.picks < minPicks) return false
        if (searchQuery && !formatBrawlerName(brawler.name).toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => sortDir === "desc" ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy])
  }, [brawlers, searchQuery, minPicks, sortBy, sortDir])

  const bestWinRate = useMemo(() => [...brawlers].filter(b => b.picks >= minPicks).sort((a, b) => b.winRate - a.winRate)[0] ?? null, [brawlers, minPicks])
  const mostPicked = useMemo(() => [...brawlers].sort((a, b) => b.picks - a.picks)[0] ?? null, [brawlers])
  const totalPicks = brawlers.reduce((sum, brawler) => sum + brawler.picks, 0)
  const totalWins = brawlers.reduce((sum, brawler) => sum + brawler.wins, 0)
  const avgWinRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : null
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "picks", label: "Picks" },
    { key: "winRate", label: "Win Rate" },
    { key: "wins", label: "Wins" },
  ]

  function setHeaderSort(key: SortKey) {
    setSortBy(current => {
      if (current === key) {
        setSortDir(direction => direction === "desc" ? "asc" : "desc")
        return current
      }
      setSortDir("desc")
      return key
    })
  }

  return (
    <main className="bl-bd-shell bl-md-shell">
      <TierlistSubNav active="maps" />

      <section className="bl-bd-hero">
        <div className="bl-bd-hero-inner">
          <Link href="/meta" className="bl-bd-back">
            <ArrowLeft size={13} />
            Maps
          </Link>

          <div className="bl-bd-identity bl-md-identity">
            <div className="bl-md-map-thumb">
              {imageUrl ? (
                <BrawlImage src={imageUrl} alt={mapName} width={96} height={72} className="size-full object-cover" priority sizes="96px" />
              ) : (
                <Flame size={28} />
              )}
            </div>

            <div className="bl-bd-title-block">
              <h1><span>{mapName}</span> Map, Stats, Season 50</h1>
              <div className="bl-md-tags">
                {isLive && <span className="bl-md-live">Live</span>}
                {modeName && <span>{modeName}</span>}
                <span>{formatNum(totalBattles)} battles analyzed</span>
                {mostPicked && <span>Most picked: {formatBrawlerName(mostPicked.name)}</span>}
              </div>
            </div>

            <p className="bl-bd-summary">
              Brawler performance, pick volume, win rates, and tier spread for {mapName}{modeName ? ` in ${modeName}` : ""}.
            </p>
          </div>
        </div>
      </section>

      <div className="bl-lb-frame bl-bd-frame">
        <section className="bl-lb-board bl-bd-board">
          <div className="bl-bd-toolbar" aria-label="Map stat selectors">
            <button type="button" className="bl-bd-selector bl-bd-selector-active">Ranked</button>
            <button type="button" className="bl-bd-selector">All Brawlers</button>
            <button type="button" className="bl-bd-selector">Season 50</button>
            <button type="button" className="bl-bd-selector">{minPicks}+ Pick Sample</button>
          </div>

          <div className="bl-bd-divider" />

          <section className="bl-bd-stat-strip" aria-label={`${mapName} stat summary`}>
            <StatMetric value={formatNum(totalBattles)} label="battles analyzed" detail={`${formatNum(totalPicks)} brawler picks`} />
            <StatMetric value={formatPercent(avgWinRate)} label="avg winrate" color={avgWinRate != null ? winRateColor(avgWinRate) : undefined} />
            <StatMetric value={bestWinRate ? formatPercent(bestWinRate.winRate) : "-"} label="best brawler" detail={bestWinRate ? formatBrawlerName(bestWinRate.name) : "No sample"} color={bestWinRate ? winRateColor(bestWinRate.winRate) : undefined} />
            <StatMetric value={mostPicked ? formatNum(mostPicked.picks) : "-"} label="most picked" detail={mostPicked ? formatBrawlerName(mostPicked.name) : "No sample"} />
            <StatMetric value={formatNum(brawlers.length)} label="brawlers tracked" detail={`${filtered.length} visible`} />
          </section>

          <section className="bl-md-layout">
            <div className="bl-bd-panel bl-md-table-panel">
              <div className="bl-md-table-head">
                <span><Users size={16} /> Brawler Performance</span>
                <em>{filtered.length} shown · {brawlers.length} tracked</em>
              </div>

              <div className="bl-md-filters">
                <div className="bl-md-search">
                  <Search size={13} />
                  <input placeholder="Search brawler..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
                </div>

                <div className="bl-md-sort">
                  {sortOptions.map(option => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setHeaderSort(option.key)}
                      className={sortBy === option.key ? "bl-md-sort-active" : ""}
                    >
                      {option.label}{sortBy === option.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                    </button>
                  ))}
                </div>

                <label className="bl-md-min">
                  Min picks
                  <select value={minPicks} onChange={event => setMinPicks(Number(event.target.value))}>
                    <option value={5}>5+</option>
                    <option value={10}>10+</option>
                    <option value={25}>25+</option>
                    <option value={50}>50+</option>
                    <option value={100}>100+</option>
                  </select>
                </label>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  title="No brawlers match"
                  description="Your search or minimum pick filter removed every brawler from this map."
                  action={<StateButton onClick={() => { setSearchQuery(""); setMinPicks(5) }}>Clear filters</StateButton>}
                  secondary={<StateLink href="/meta">All maps</StateLink>}
                />
              ) : (
                <div className="bl-md-table">
                  <div className="bl-md-table-row bl-md-table-labels">
                    <span />
                    <span>Brawler</span>
                    <span>Win rate</span>
                    <span>Wins</span>
                    <span>Picks</span>
                    <span>Tier</span>
                  </div>

                  {filtered.map(brawler => {
                    const tier = getTierInfo(brawler.winRate)
                    return (
                      <Link key={brawler.brawlerId} href={brawlerHref(brawler.brawlerId)} className="bl-md-table-row">
                        <div className="bl-md-brawler-icon">
                          <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={36} height={36} className="size-full object-contain" loading="lazy" sizes="36px" />
                        </div>
                        <b>{formatBrawlerName(brawler.name)}</b>
                        <div className="bl-md-wr">
                          <strong style={{ color: winRateColor(brawler.winRate) }}>{formatPercent(brawler.winRate)}</strong>
                          <i><span style={{ width: `${getBarWidth(brawler.winRate)}%`, background: winRateColor(brawler.winRate) }} /></i>
                        </div>
                        <em>{formatNum(brawler.wins)}</em>
                        <em>{formatNum(brawler.picks)}</em>
                        <small style={{ color: tier.color, borderColor: tier.border, background: tier.bg }}>{tier.label}</small>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            <aside className="bl-md-aside">
              <section className="bl-bd-panel">
                <div className="bl-bd-panel-head">
                  <span><BarChart3 size={16} /> Win-Rate Distribution</span>
                </div>
                <Distribution brawlers={brawlers} />
              </section>

              <section className="bl-bd-panel">
                <div className="bl-bd-panel-head">
                  <span><Trophy size={16} /> Tier Counts</span>
                </div>
                <TierBreakdown brawlers={brawlers} />
              </section>

              <section className="bl-bd-panel">
                <div className="bl-bd-panel-head">
                  <span><MapPinned size={16} /> Top Signals</span>
                </div>
                <div className="bl-md-signals">
                  {[bestWinRate, mostPicked].filter(Boolean).map((brawler, index) => brawler && (
                    <Link key={`${brawler.brawlerId}-${index}`} href={brawlerHref(brawler.brawlerId)}>
                      <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={34} height={34} className="size-[34px] object-contain" sizes="34px" />
                      <span>
                        <b>{formatBrawlerName(brawler.name)}</b>
                        <em>{index === 0 ? "Best win rate" : "Highest pick volume"}</em>
                      </span>
                      <strong style={{ color: index === 0 ? winRateColor(brawler.winRate) : "var(--lb-text)" }}>
                        {index === 0 ? formatPercent(brawler.winRate) : formatNum(brawler.picks)}
                      </strong>
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </section>
      </div>
    </main>
  )
}
