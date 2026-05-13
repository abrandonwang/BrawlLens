"use client"

import { useEffect, useMemo, useState } from "react"
import { Flame, Search } from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import HelpTooltip from "@/components/HelpTooltip"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"
import TierlistSubNav from "@/components/TierlistSubNav"
import { LeaderboardPanel, RankCell, TableHead } from "@/app/leaderboards/LeaderboardDpmShell"
import { formatBrawlerName, formatNum } from "@/lib/format"
import { getTierInfo, winRateColor } from "@/lib/tiers"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"

const performanceGrid = "grid grid-cols-[44px_minmax(190px,1.2fr)_96px_82px_82px_60px] items-center gap-1"
const compactSignalGrid = "grid grid-cols-[34px_minmax(0,1fr)_72px] items-center gap-1"

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

function formatFullNumber(value: number) {
  return value.toLocaleString("en-US")
}

function StatMetric({ value, label, detail, color, help }: { value: string; label: string; detail?: string; color?: string; help?: string }) {
  return (
    <div className="bl-bd-stat">
      <strong style={color ? { color } : undefined}>{value}</strong>
      <span className="bl-help-label bl-help-label-center">
        <span>{label}</span>
        {help && (
          <HelpTooltip label={`${label} explained`}>
            {help}
          </HelpTooltip>
        )}
      </span>
      {detail && <em>{detail}</em>}
    </div>
  )
}

function NamedStatMetric({ label, brawler, detail, help }: { label: string; brawler: BrawlerStat | null; detail?: string; help?: string }) {
  return (
    <div className="bl-bd-stat bl-bd-stat-named">
      <span className="bl-help-label bl-help-label-center">
        <span>{label}:</span>
        {help && (
          <HelpTooltip label={`${label} explained`}>
            {help}
          </HelpTooltip>
        )}
      </span>
      <strong>{brawler ? formatBrawlerName(brawler.name) : "-"}</strong>
      {detail && <em>{detail}</em>}
    </div>
  )
}

function HeaderHelp({ label, help }: { label: string; help: string }) {
  return (
    <span className="bl-help-label">
      <span>{label}</span>
      <HelpTooltip label={`${label} explained`}>
        {help}
      </HelpTooltip>
    </span>
  )
}

function SnapshotBrawler({ label, brawler }: { label: string; brawler: BrawlerStat | null }) {
  if (!brawler) {
    return (
      <div className="bl-md-snapshot-empty">
        <span>{label}</span>
        <b>No sample</b>
      </div>
    )
  }

  const tier = getTierInfo(brawler.winRate)

  return (
    <Link href={brawlerHref(brawler.brawlerId)} className="bl-md-snapshot-brawler">
      <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={54} height={54} className="size-[54px] object-contain" sizes="54px" />
      <span>
        <em>{label}</em>
        <b>{formatBrawlerName(brawler.name)}</b>
      </span>
      <strong style={{ color: winRateColor(brawler.winRate) }}>{formatPercent(brawler.winRate)}</strong>
      <span className="bl-tier-tier bl-md-snapshot-tier" style={{ color: tier.color }}>{tier.label}</span>
    </Link>
  )
}

function MapBrawlerRow({ brawler, rank }: { brawler: BrawlerStat; rank: number }) {
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
      <span className="bl-lb-row-mono">{formatNum(brawler.wins)}</span>
      <span className="bl-lb-row-mono">{formatNum(brawler.picks)}</span>
      <span className="bl-tier-tier" style={{ color: tier.color }}>{tier.label}</span>
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

export default function MapDetailClient({ mapName, imageUrl, modeName, totalBattles, brawlers, isLive }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [minPicks, setMinPicks] = useState(10_000)
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
  const reliablePicks = useMemo(() => {
    return [...brawlers]
      .filter(brawler => brawler.picks >= minPicks)
      .sort((a, b) => (b.winRate * 0.7 + Math.log10(b.picks + 1) * 8) - (a.winRate * 0.7 + Math.log10(a.picks + 1) * 8))
      .slice(0, 8)
  }, [brawlers, minPicks])
  const topContenders = useMemo(() => [...brawlers].filter(b => b.picks >= minPicks).sort((a, b) => b.winRate - a.winRate).slice(0, 3), [brawlers, minPicks])
  const totalPicks = brawlers.reduce((sum, brawler) => sum + brawler.picks, 0)
  const totalWins = brawlers.reduce((sum, brawler) => sum + brawler.wins, 0)
  const avgWinRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : null
  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "picks", label: "Games" },
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
          <div className="bl-bd-identity bl-md-identity">
            <div className="bl-md-map-thumb">
              {imageUrl ? (
                <BrawlImage
                  src={imageUrl}
                  alt={mapName}
                  width={144}
                  height={108}
                  className="size-full object-contain"
                  priority
                  sizes="144px"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <Flame size={28} />
              )}
            </div>

            <div className="bl-bd-title-block">
              <h1><span>{mapName}</span> Map, Stats, Season 50</h1>
              <div className="bl-md-tags">
                {isLive && <span className="bl-md-live">Live</span>}
                {modeName && <span>{modeName}</span>}
                <span>{formatFullNumber(totalBattles)} battles analyzed</span>
                {mostPicked && <span>Most picked: {formatBrawlerName(mostPicked.name)}</span>}
              </div>
            </div>

            <p className="bl-bd-summary">
              Brawler performance, pick volume, and win rates for {mapName}{modeName ? ` in ${modeName}` : ""}.
            </p>
          </div>
        </div>
      </section>

      <div className="bl-lb-frame bl-bd-frame">
        <section className="bl-lb-board bl-bd-board">
          <section className="bl-bd-stat-strip" aria-label={`${mapName} stat summary`}>
            <StatMetric value={formatFullNumber(totalBattles)} label="battles analyzed" help="Total battles is derived from tracked brawler pick rows for this map." />
            <StatMetric value={formatPercent(avgWinRate)} label="avg winrate" color={avgWinRate != null ? winRateColor(avgWinRate) : undefined} help="Average win rate is calculated from total wins divided by total picks across tracked brawlers." />
            <NamedStatMetric label="Best brawler" brawler={bestWinRate} detail={bestWinRate ? `${formatPercent(bestWinRate.winRate)} win rate` : "No sample"} help="Best brawler is the highest win-rate brawler after the current minimum games filter is applied." />
            <NamedStatMetric label="Most picked" brawler={mostPicked} detail={mostPicked ? `${formatFullNumber(mostPicked.picks)} games` : "No sample"} help="Most picked is the brawler with the highest tracked pick count on this map, regardless of win rate." />
            <StatMetric value={formatNum(brawlers.length)} label="brawlers tracked" help="This is the number of brawlers with tracked rows for this map before search and minimum-game filters." />
          </section>

          <section className="bl-md-snapshot-grid">
            <div className="bl-bd-panel bl-md-snapshot-card">
              <div className="bl-bd-panel-head">
                <span>Map Read</span>
                <small>{modeName ?? "All modes"}</small>
              </div>
              <div className="bl-md-map-read">
                <div>
                  <b>{isLive ? "Active rotation" : "Archive sample"}</b>
                  <span>{isLive ? "This map is currently live, so matchup freshness is stronger." : "This map is analyzed from tracked ladder battle samples."}</span>
                </div>
                <div>
                  <b>{formatFullNumber(minPicks)}+ game filter</b>
                  <span>{filtered.length} brawlers clear the current sample threshold.</span>
                </div>
              </div>
            </div>

            <div className="bl-bd-panel bl-md-snapshot-card">
              <div className="bl-bd-panel-head">
                <span>Signal Picks</span>
                <small>sample adjusted</small>
              </div>
              <div className="bl-md-snapshot-stack">
                <SnapshotBrawler label="Best win rate" brawler={bestWinRate} />
                <SnapshotBrawler label="Most picked" brawler={mostPicked} />
              </div>
            </div>

            <div className="bl-bd-panel bl-md-snapshot-card">
              <div className="bl-bd-panel-head">
                <span>Top Contenders</span>
                <small>{formatFullNumber(minPicks)}+ games</small>
              </div>
              <div className="bl-lb-table-list bl-md-compact-list">
                {topContenders.length ? topContenders.map((brawler, index) => (
                  <CompactSignalRow key={brawler.brawlerId} brawler={brawler} rank={index + 1} />
                )) : (
                  <div className="bl-bd-empty">No contenders clear the sample threshold.</div>
                )}
              </div>
            </div>
          </section>

          <section className="bl-md-performance">
            <div className="bl-bd-panel bl-md-table-panel">
              <div className="bl-md-table-head">
                <span>Brawler Performance</span>
                <em>{formatFullNumber(minPicks)}+ game minimum</em>
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
                  Min games
                  <select value={minPicks} onChange={event => setMinPicks(Number(event.target.value))}>
                    <option value={10000}>10K+</option>
                    <option value={25000}>25K+</option>
                    <option value={50000}>50K+</option>
                    <option value={100000}>100K+</option>
                  </select>
                </label>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  title="No brawlers match"
                  description="Your search or minimum game filter removed every brawler from this map."
                  action={<StateButton onClick={() => { setSearchQuery(""); setMinPicks(10_000) }}>Clear filters</StateButton>}
                  secondary={<StateLink href="/meta">All maps</StateLink>}
                />
              ) : (
                <LeaderboardPanel>
                  <TableHead className={`${performanceGrid} bl-md-performance-head`}>
                    <span>Rank</span>
                    <span>Brawler</span>
                    <HeaderHelp label="Win rate" help="Wins divided by games for this brawler on this map." />
                    <HeaderHelp label="Wins" help="Tracked wins for this brawler on this map." />
                    <HeaderHelp label="Games" help="Tracked picks for this brawler on this map. Higher samples are usually more reliable." />
                    <HeaderHelp label="Tier" help="A compact tier derived from win rate, using the same tier color language as the brawler tierlist." />
                  </TableHead>
                  <div className="bl-lb-table-list">
                    {filtered.map((brawler, index) => <MapBrawlerRow key={brawler.brawlerId} brawler={brawler} rank={index + 1} />)}
                  </div>
                </LeaderboardPanel>
              )}
            </div>

            <div className="bl-bd-panel bl-md-reliable-panel">
              <div className="bl-bd-panel-head">
                <span>Reliable Picks</span>
                <small>{formatFullNumber(minPicks)}+ games</small>
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
