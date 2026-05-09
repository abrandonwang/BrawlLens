"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, BarChart3, Flame, Search, Trophy, Users } from "lucide-react"
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

function StatCard({ label, value, detail, color }: { label: string; value: string; detail?: string; color?: string }) {
  return (
    <div className="rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#15171d] p-4 shadow-[rgba(255,255,255,0.035)_0_1px_0_0_inset]">
      <div className="text-[10px] font-bold tracking-[0.08em] text-[var(--lb-text-3)] uppercase">{label}</div>
      <div className="mt-2 text-[28px] leading-none font-extrabold tracking-normal text-[var(--lb-text)]" style={{ color }}>{value}</div>
      {detail && <div className="mt-2 truncate text-[11px] font-semibold text-[var(--lb-text-3)]">{detail}</div>}
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
    <div className="grid h-[146px] grid-cols-5 items-end gap-2 rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-4 py-3">
      {labels.map((label, index) => (
        <div key={label} className="flex h-full min-w-0 flex-col justify-end gap-2">
          <div
            className="min-h-1 rounded-t bg-[var(--accent)] opacity-90"
            style={{ height: `${Math.max(8, ((buckets[index] ?? 0) / max) * 96)}px` }}
          />
          <span className="truncate text-center text-[9px] font-semibold text-[var(--lb-text-3)]">{label}</span>
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
    <div className="grid grid-cols-5 gap-2">
      {tiers.map(tier => (
        <div key={tier.label} className="rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113] p-3 text-center">
          <div className="text-[22px] leading-none font-black" style={{ color: tier.color }}>{tier.label}</div>
          <div className="mt-1 text-[11px] font-semibold text-[var(--lb-text-3)]">{tier.count}</div>
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
    <main className="bl-tier-shell">
      <TierlistSubNav active="maps" />
      <div className="mx-auto w-[min(1180px,calc(100vw_-_20px))] px-0 pt-5 pb-14">
        <Link href="/meta" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--lb-text-3)] no-underline transition-colors hover:text-[var(--lb-text)]">
          <ArrowLeft size={13} />
          Maps
        </Link>

        <section className="mb-3 overflow-hidden rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] shadow-[rgba(255,255,255,0.04)_0_1px_0_0_inset]">
          <div className="grid grid-cols-[minmax(0,1fr)_380px] max-lg:grid-cols-1">
            <div className="p-6 max-sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[var(--win-line)] bg-[var(--win-soft)] px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] text-[var(--win)] uppercase">
                    <span className="size-1.5 rounded-full bg-[var(--win)] shadow-[0_0_10px_var(--win)]" />
                    Live
                  </span>
                )}
                {modeName && <span className="rounded-[5px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-2.5 py-1 text-[11px] font-bold text-[var(--lb-text-2)]">{modeName}</span>}
              </div>
              <h1 className="m-0 text-[clamp(34px,6vw,72px)] leading-[0.95] font-black tracking-normal text-[var(--lb-text)]">{mapName}</h1>
              <p className="mt-4 mb-0 max-w-[720px] text-[14px] leading-[1.6] text-[var(--lb-text-2)]">
                Brawler performance, pick volume, win rates, and tier distribution from tracked battles on this map.
              </p>

              <div className="mt-6 grid grid-cols-4 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
                <StatCard label="Battles" value={formatNum(totalBattles)} detail={`${formatNum(totalPicks)} brawler picks`} />
                <StatCard label="Avg win rate" value={formatPercent(avgWinRate)} detail="All tracked brawler picks" color={avgWinRate != null ? winRateColor(avgWinRate) : undefined} />
                <StatCard label="Best brawler" value={bestWinRate ? formatPercent(bestWinRate.winRate) : "-"} detail={bestWinRate ? formatBrawlerName(bestWinRate.name) : "No sample"} color={bestWinRate ? winRateColor(bestWinRate.winRate) : undefined} />
                <StatCard label="Most picked" value={mostPicked ? formatNum(mostPicked.picks) : "-"} detail={mostPicked ? formatBrawlerName(mostPicked.name) : "No sample"} />
              </div>
            </div>

            <div className="grid min-h-[270px] place-items-center border-l border-[rgba(247,244,237,0.065)] bg-[#101113] p-5 max-lg:border-l-0 max-lg:border-t">
              {imageUrl ? (
                <BrawlImage
                  src={imageUrl}
                  alt={mapName}
                  width={360}
                  height={260}
                  className="max-h-[260px] w-auto max-w-full rounded-[6px] object-contain"
                  priority
                  sizes="(max-width: 1024px) 86vw, 360px"
                />
              ) : (
                <div className="grid size-32 place-items-center rounded-[8px] border border-[rgba(247,244,237,0.08)] bg-[#15171d] text-[var(--lb-text-3)]">
                  <Flame size={42} />
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)_330px] gap-3 max-lg:grid-cols-1">
          <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                <Users size={16} />
                Brawler Matchups
              </div>
              <span className="text-[11px] font-semibold text-[var(--lb-text-3)]">{filtered.length} shown · {brawlers.length} tracked</span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className="flex min-h-9 w-[240px] items-center gap-2 rounded-[5px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-3 text-[var(--lb-text)] max-[520px]:w-full">
                <Search size={13} className="shrink-0 text-[var(--lb-text-3)]" />
                <input className="w-full border-0 bg-transparent text-[13px] font-semibold text-inherit outline-none placeholder:text-[var(--lb-text-4)]" placeholder="Search brawler..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
              </div>

              <div className="inline-flex gap-0.5 overflow-x-auto rounded-[5px] border border-[rgba(247,244,237,0.08)] bg-[#101113] p-[3px]">
                {sortOptions.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setHeaderSort(option.key)}
                    className={`cursor-pointer rounded-[4px] border-0 px-3 py-1.5 text-[12px] font-bold transition-colors ${sortBy === option.key ? "bg-[var(--lb-text)] text-black" : "bg-transparent text-[var(--lb-text-3)] hover:bg-white/6 hover:text-[var(--lb-text)]"}`}
                  >
                    {option.label}{sortBy === option.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                ))}
              </div>

              <label className="ml-auto flex items-center gap-2 text-[11px] font-semibold text-[var(--lb-text-3)] max-md:ml-0">
                Min picks
                <select value={minPicks} onChange={event => setMinPicks(Number(event.target.value))} className="rounded-[5px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-2 py-1.5 text-[12px] font-bold text-[var(--lb-text)] outline-none">
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
              <div className="overflow-hidden rounded-[6px] border border-[rgba(247,244,237,0.08)]">
                <div className="grid grid-cols-[48px_minmax(0,1.25fr)_minmax(120px,1fr)_72px_72px_52px] items-center gap-3 border-b border-[rgba(247,244,237,0.08)] bg-[#101113] px-4 py-3 text-[11px] font-bold text-[var(--lb-text-3)] max-md:hidden">
                  <span />
                  <span>Brawler</span>
                  <span>Win rate</span>
                  <span className="text-right">Wins</span>
                  <span className="text-right">Picks</span>
                  <span className="text-center">Tier</span>
                </div>

                {filtered.map(brawler => {
                  const tier = getTierInfo(brawler.winRate)
                  return (
                    <Link
                      key={brawler.brawlerId}
                      href={brawlerHref(brawler.brawlerId)}
                      className="grid min-h-[64px] grid-cols-[48px_minmax(0,1.25fr)_minmax(120px,1fr)_72px_72px_52px] items-center gap-3 border-b border-[rgba(247,244,237,0.065)] bg-[#15171d] px-4 py-3 text-[13px] no-underline transition-colors last:border-b-0 hover:bg-[#202329] max-md:grid-cols-[44px_minmax(0,1fr)_58px] max-md:gap-y-1"
                    >
                      <div className="grid size-10 place-items-center overflow-hidden rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113]">
                        <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={34} height={34} className="size-[34px] object-contain" loading="lazy" sizes="34px" />
                      </div>

                      <span className="min-w-0 truncate font-extrabold text-[var(--lb-text)]">{formatBrawlerName(brawler.name)}</span>

                      <div className="flex min-w-0 items-center gap-3 max-md:col-span-3">
                        <span className="bl-num w-[52px] shrink-0 font-extrabold" style={{ color: winRateColor(brawler.winRate) }}>{formatPercent(brawler.winRate)}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full transition-[width]" style={{ width: `${getBarWidth(brawler.winRate)}%`, background: winRateColor(brawler.winRate) }} />
                        </div>
                      </div>

                      <span className="bl-num text-right text-[var(--lb-text-2)] max-md:hidden">{formatNum(brawler.wins)}</span>
                      <span className="bl-num text-right text-[var(--lb-text-2)] max-md:hidden">{formatNum(brawler.picks)}</span>

                      <div className="flex justify-center max-md:row-start-1 max-md:col-start-3">
                        <span className="inline-flex size-7 items-center justify-center rounded-[5px] border text-[11px] font-extrabold" style={{ color: tier.color, borderColor: tier.border, background: tier.bg }}>
                          {tier.label}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <aside className="space-y-3">
            <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
              <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                <BarChart3 size={16} />
                Win-Rate Distribution
              </div>
              <Distribution brawlers={brawlers} />
            </section>

            <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
              <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                <Trophy size={16} />
                Tier Counts
              </div>
              <TierBreakdown brawlers={brawlers} />
            </section>

            <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
              <div className="mb-3 text-[14px] font-extrabold text-[var(--lb-text)]">Top Signals</div>
              <div className="space-y-2">
                {[bestWinRate, mostPicked].filter(Boolean).map((brawler, index) => brawler && (
                  <Link key={`${brawler.brawlerId}-${index}`} href={brawlerHref(brawler.brawlerId)} className="flex items-center gap-3 rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113] p-3 no-underline transition-colors hover:bg-[#202329]">
                    <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={34} height={34} className="size-[34px] object-contain" sizes="34px" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-extrabold text-[var(--lb-text)]">{formatBrawlerName(brawler.name)}</div>
                      <div className="text-[11px] font-semibold text-[var(--lb-text-3)]">{index === 0 ? "Best win rate" : "Highest pick volume"}</div>
                    </div>
                    <div className="bl-num text-right text-[13px] font-extrabold" style={{ color: index === 0 ? winRateColor(brawler.winRate) : "var(--lb-text)" }}>
                      {index === 0 ? formatPercent(brawler.winRate) : formatNum(brawler.picks)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
