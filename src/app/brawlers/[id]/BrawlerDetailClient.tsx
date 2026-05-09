"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BarChart3, Bolt, MapPinned, Shield, Sparkles, Swords } from "lucide-react"
import Link from "next/link"
import { BrawlImage } from "@/components/BrawlImage"
import { EmptyState, SkeletonBlock, StateButton } from "@/components/PolishStates"
import TierlistSubNav from "@/components/TierlistSubNav"
import { BUFFIES } from "@/data/buffies"
import { HYPERCHARGES } from "@/data/hypercharges"
import { getBarWidth, winRateColor } from "@/lib/tiers"

interface StarPower {
  id: number
  name: string
  description: string
  imageUrl: string
}

interface Gadget {
  id: number
  name: string
  description: string
  imageUrl: string
}

interface Brawler {
  id: number
  name: string
  description: string
  imageUrl2: string
  rarity: { id: number; name: string; color: string }
  class: { id: number; name: string }
  starPowers: StarPower[]
  gadgets: Gadget[]
}

interface BrawlerStats {
  totalPicks: number
  avgWinRate: number | null
  maps: { map: string; mode: string; picks: number; wins: number; winRate: number }[]
  modes: { mode: string; picks: number; winRate: number }[]
  histogram: number[]
  trend7: { label: string; winRate: number; picks: number }[]
  trend30: { label: string; winRate: number; picks: number }[]
}

type MapSort = "winRate" | "wins" | "picks" | "map" | "mode"

function cleanDesc(text: string) {
  return text.replace(/<![\w.]+>/g, "X")
}

function formatCompact(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-"
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return Math.round(value).toLocaleString()
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(digits)}%`
}

function tierFor(winRate: number | null | undefined, picks: number) {
  if (winRate == null || picks < 10) return { label: "-", color: "var(--lb-text-4)" }
  if (winRate >= 58) return { label: "S+", color: "#ffe16d" }
  if (winRate >= 54) return { label: "S", color: "#b9a7ff" }
  if (winRate >= 51) return { label: "A", color: "#74ddff" }
  if (winRate >= 48) return { label: "B", color: "#f5f7fb" }
  if (winRate >= 45) return { label: "C", color: "#ffb35f" }
  return { label: "D", color: "#ff6b6b" }
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`
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

function WinRateSparkline({ values }: { values: { label?: string; winRate: number; picks?: number }[] }) {
  if (values.length < 2) {
    return <div className="grid h-[118px] place-items-center rounded-[6px] border border-[var(--line)] bg-[#101113] text-[11px] text-[var(--lb-text-3)]">Need more qualifying maps</div>
  }
  const min = Math.min(...values.map(point => point.winRate))
  const max = Math.max(...values.map(point => point.winRate))
  const range = Math.max(max - min, 4)
  const points = values.map((point, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 260
    const normalized = (point.winRate - min) / range
    const y = 82 - normalized * 64
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const areaPoints = `0,92 ${points} 260,92`
  return (
    <div className="rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-4 py-3">
      <svg viewBox="0 0 260 96" className="h-[118px] w-full text-[var(--dpm-warm)]">
        <polyline points={areaPoints} fill="currentColor" opacity="0.12" stroke="none" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--lb-text-3)]">
        <span>{values[0]?.label ?? "Start"} · {formatPercent(values[0]?.winRate)}</span>
        <span>{values.at(-1)?.label ?? "Current"} · {formatPercent(values.at(-1)?.winRate)}</span>
      </div>
    </div>
  )
}

function Histogram({ buckets }: { buckets: number[] }) {
  const labels = ["0-20", "20-40", "40-60", "60-80", "80-100"]
  const max = Math.max(...buckets, 1)
  return (
    <div className="grid h-[157px] grid-cols-5 items-end gap-2 rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-4 py-3">
      {labels.map((label, index) => (
        <div key={label} className="flex h-full min-w-0 flex-col justify-end gap-2">
          <div
            className="min-h-1 rounded-t bg-[var(--accent)] opacity-90"
            style={{ height: `${Math.max(8, ((buckets[index] ?? 0) / max) * 104)}px` }}
            title={`${label}%: ${buckets[index] ?? 0} maps`}
          />
          <span className="truncate text-center text-[9px] font-semibold text-[var(--lb-text-3)]">{label}</span>
        </div>
      ))}
    </div>
  )
}

function AbilityCard({ item, variant, buffy }: { item: StarPower | Gadget; variant: "gadget" | "starpower"; buffy?: string }) {
  const isBuffied = Boolean(buffy)
  const accent = isBuffied ? "#38bdf8" : variant === "gadget" ? "#4ade80" : "#22d3ee"
  return (
    <div className="rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#15171d] p-4">
      <div className="flex gap-3">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[6px] border bg-[#101113]" style={{ borderColor: `${accent}55` }}>
          <BrawlImage src={item.imageUrl} alt={item.name} width={34} height={34} className="size-[34px] object-contain" sizes="34px" />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="m-0 text-[14px] font-bold text-[var(--lb-text)]">{item.name}</h3>
            {isBuffied && <span className="rounded-[4px] bg-sky-400/16 px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.08em] text-sky-200 uppercase">Buffied</span>}
          </div>
          <p className="mt-1 mb-0 text-[12px] leading-[1.55] text-[var(--lb-text-2)]">{cleanDesc(buffy ?? item.description)}</p>
        </div>
      </div>
    </div>
  )
}

export default function BrawlerDetailClient({ brawler }: { brawler: Brawler }) {
  const [stats, setStats] = useState<BrawlerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState(false)
  const [mapSort, setMapSort] = useState<{ key: MapSort; dir: "asc" | "desc" }>({ key: "winRate", dir: "desc" })
  const [buffied, setBuffied] = useState(false)
  const hypercharge = HYPERCHARGES[brawler.id]
  const buffies = BUFFIES[brawler.id]

  useEffect(() => {
    let alive = true
    setStatsLoading(true)
    setStatsError(false)
    fetch(`/api/brawler-stats?id=${brawler.id}`, { cache: "no-store" })
      .then(r => {
        if (!r.ok) throw new Error("stats fetch failed")
        return r.json()
      })
      .then((data: BrawlerStats) => {
        if (!alive) return
        setStats(data)
        setStatsLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setStatsError(true)
        setStatsLoading(false)
      })
    return () => { alive = false }
  }, [brawler.id])

  const sortedMaps = useMemo(() => {
    const maps = stats?.maps ?? []
    return [...maps].sort((a, b) => {
      const dir = mapSort.dir === "asc" ? 1 : -1
      if (mapSort.key === "map") return a.map.localeCompare(b.map) * dir
      if (mapSort.key === "mode") return a.mode.localeCompare(b.mode) * dir
      if (mapSort.key === "wins") return (a.wins - b.wins) * dir
      if (mapSort.key === "picks") return (a.picks - b.picks) * dir
      return (a.winRate - b.winRate) * dir
    })
  }, [stats?.maps, mapSort])

  const tier = tierFor(stats?.avgWinRate, stats?.totalPicks ?? 0)
  const bestMap = sortedMaps[0]
  const topMode = stats?.modes[0]
  const abilityCount = brawler.gadgets.length + brawler.starPowers.length + (hypercharge ? 1 : 0)
  const rarityColor = brawler.rarity.color.match(/#[0-9a-fA-F]{3,6}/)?.[0] ?? "#858dff"

  const setMapHeaderSort = (key: MapSort) => {
    setMapSort(current => current.key === key
      ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "map" || key === "mode" ? "asc" : "desc" })
  }

  return (
    <main className="bl-tier-shell">
      <TierlistSubNav active="brawlers" />
      <div className="mx-auto w-[min(1180px,calc(100vw_-_20px))] px-0 pt-5 pb-14">
        <Link href="/brawlers" className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--lb-text-3)] no-underline transition-colors hover:text-[var(--lb-text)]">
          <ArrowLeft size={13} />
          Brawlers
        </Link>

        <section className="mb-3 overflow-hidden rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] shadow-[rgba(255,255,255,0.04)_0_1px_0_0_inset]">
          <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-0 max-md:grid-cols-1">
            <div className="grid min-h-[230px] place-items-center border-r border-[rgba(247,244,237,0.065)] bg-[#101113] p-6 max-md:min-h-[190px] max-md:border-r-0 max-md:border-b">
              <div className="grid size-[164px] place-items-center rounded-[8px] border-2 bg-black/18 p-4" style={{ borderColor: rarityColor }}>
                <BrawlImage src={brawler.imageUrl2} alt={brawler.name} width={140} height={140} className="size-full object-contain" priority sizes="140px" />
              </div>
            </div>
            <div className="p-6 max-sm:p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-[5px] border px-2.5 py-1 text-[11px] font-extrabold" style={{ color: rarityColor, borderColor: `${rarityColor}66`, background: `${rarityColor}1c` }}>{brawler.rarity.name}</span>
                {brawler.class.name !== "Unknown" && <span className="rounded-[5px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-2.5 py-1 text-[11px] font-bold text-[var(--lb-text-2)]">{brawler.class.name}</span>}
              </div>
              <h1 className="m-0 text-[clamp(34px,6vw,72px)] leading-[0.95] font-black tracking-normal text-[var(--lb-text)]">{brawler.name}</h1>
              <p className="mt-4 mb-0 max-w-[720px] text-[14px] leading-[1.6] text-[var(--lb-text-2)]">{cleanDesc(brawler.description)}</p>

              <div className="mt-6 grid grid-cols-4 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
                <StatCard label="Tier" value={tier.label} detail="Dataset rank signal" color={tier.color} />
                <StatCard label="Win rate" value={statsLoading ? "-" : formatPercent(stats?.avgWinRate)} detail={`${formatCompact(stats?.totalPicks)} tracked picks`} color={stats?.avgWinRate != null ? winRateColor(stats.avgWinRate) : undefined} />
                <StatCard label="Best map" value={bestMap ? formatPercent(bestMap.winRate) : "-"} detail={bestMap?.map ?? "No map sample"} color={bestMap ? winRateColor(bestMap.winRate) : undefined} />
                <StatCard label="Kit data" value={String(abilityCount)} detail="Gadgets, powers, hypercharge" />
              </div>
            </div>
          </div>
        </section>

        {statsError ? (
          <EmptyState
            title="Stats did not load"
            description="The brawler detail request failed. The kit data below is still available."
            action={<StateButton onClick={() => window.location.reload()}>Retry</StateButton>}
          />
        ) : (
          <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)] gap-3 max-lg:grid-cols-1">
            <div className="space-y-3">
              <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                  <BarChart3 size={16} />
                  Performance Shape
                </div>
                {statsLoading ? (
                  <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    <SkeletonBlock className="h-[178px] rounded-[6px]" />
                    <SkeletonBlock className="h-[178px] rounded-[6px]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                    <WinRateSparkline values={stats?.trend7 ?? []} />
                    <Histogram buckets={stats?.histogram ?? []} />
                  </div>
                )}
              </section>

              <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                  <MapPinned size={16} />
                  Best Maps
                </div>
                {statsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 8 }).map((_, index) => <SkeletonBlock key={index} className="h-12 rounded-[5px]" />)}</div>
                ) : sortedMaps.length === 0 ? (
                  <EmptyState title="No map stats yet" description="This brawler does not have enough tracked picks on individual maps." />
                ) : (
                  <div className="overflow-hidden rounded-[6px] border border-[rgba(247,244,237,0.08)]">
                    <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(120px,1fr)_72px_72px] gap-3 border-b border-[rgba(247,244,237,0.08)] bg-[#101113] px-4 py-3 text-[11px] font-bold text-[var(--lb-text-3)] max-md:hidden">
                      {([
                        ["Map", "map", "left"],
                        ["Mode", "mode", "left"],
                        ["Win rate", "winRate", "left"],
                        ["Wins", "wins", "right"],
                        ["Picks", "picks", "right"],
                      ] as [string, MapSort, "left" | "right"][]).map(([label, key, align]) => (
                        <button
                          key={`${label}-${key}`}
                          type="button"
                          onClick={() => setMapHeaderSort(key)}
                          className={`cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold text-inherit ${align === "right" ? "text-right" : "text-left"}`}
                        >
                          {label}{mapSort.key === key ? (mapSort.dir === "asc" ? " ↑" : " ↓") : ""}
                        </button>
                      ))}
                    </div>
                    {sortedMaps.map((map, index) => (
                      <Link
                        key={`${map.map}-${map.mode}-${index}`}
                        href={mapHref(map.map)}
                        className="grid min-h-[58px] grid-cols-[minmax(0,1.25fr)_minmax(0,0.8fr)_minmax(120px,1fr)_72px_72px] items-center gap-3 border-b border-[rgba(247,244,237,0.065)] bg-[#15171d] px-4 py-3 text-[13px] no-underline transition-colors last:border-b-0 hover:bg-[#202329] max-md:grid-cols-[minmax(0,1fr)_72px] max-md:gap-y-1"
                      >
                        <span className="min-w-0 truncate font-bold text-[var(--lb-text)]">{map.map}</span>
                        <span className="min-w-0 truncate text-[var(--lb-text-3)] max-md:hidden">{map.mode}</span>
                        <div className="flex min-w-0 items-center gap-3 max-md:col-span-2">
                          <span className="bl-num w-[52px] shrink-0 font-extrabold" style={{ color: winRateColor(map.winRate) }}>{formatPercent(map.winRate)}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full" style={{ width: `${getBarWidth(map.winRate)}%`, background: winRateColor(map.winRate) }} />
                          </div>
                        </div>
                        <span className="bl-num text-right text-[var(--lb-text-2)] max-md:hidden">{formatCompact(map.wins)}</span>
                        <span className="bl-num text-right text-[var(--lb-text-2)]">{formatCompact(map.picks)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-3">
              <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                  <Swords size={16} />
                  Mode Profile
                </div>
                {statsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-11 rounded-[5px]" />)}</div>
                ) : stats?.modes.length ? (
                  <div className="space-y-2">
                    {stats.modes.map(mode => (
                      <div key={mode.mode} className="rounded-[6px] border border-[rgba(247,244,237,0.08)] bg-[#101113] px-3 py-2.5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="truncate text-[13px] font-bold text-[var(--lb-text)]">{mode.mode}</span>
                          <span className="bl-num font-extrabold" style={{ color: winRateColor(mode.winRate) }}>{formatPercent(mode.winRate)}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full" style={{ width: `${getBarWidth(mode.winRate)}%`, background: winRateColor(mode.winRate) }} />
                        </div>
                        <div className="mt-1.5 text-[10px] font-semibold text-[var(--lb-text-3)]">{formatCompact(mode.picks)} picks</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-[12px] text-[var(--lb-text-3)]">No mode sample yet.</p>
                )}
                {topMode && <p className="mt-3 mb-0 text-[11px] font-semibold text-[var(--lb-text-3)]">Strongest tracked mode: <span className="text-[var(--lb-text)]">{topMode.mode}</span></p>}
              </section>

              <section className="rounded-[8px] border border-[rgba(247,244,237,0.065)] bg-[#15171d] p-4">
                <div className="mb-3 flex items-center gap-2 text-[14px] font-extrabold text-[var(--lb-text)]">
                  <Sparkles size={16} />
                  Abilities
                </div>
                <div className="space-y-2">
                  {brawler.gadgets.map(gadget => (
                    <AbilityCard key={gadget.id} item={gadget} variant="gadget" buffy={buffied ? buffies?.gadgets?.[gadget.name] : undefined} />
                  ))}
                  {brawler.starPowers.map(starPower => (
                    <AbilityCard key={starPower.id} item={starPower} variant="starpower" buffy={buffied ? buffies?.starPowers?.[starPower.name] : undefined} />
                  ))}
                  {hypercharge && (
                    <div className="rounded-[6px] border border-purple-300/20 bg-[#101113] p-4">
                      <div className="mb-2 flex items-center gap-2 text-[14px] font-bold text-[var(--lb-text)]">
                        <Bolt size={15} className="text-purple-300" />
                        {hypercharge.name}
                        {buffied && buffies?.hypercharge && <span className="rounded-[4px] bg-sky-400/16 px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.08em] text-sky-200 uppercase">Buffied</span>}
                      </div>
                      <p className="m-0 text-[12px] leading-[1.55] text-[var(--lb-text-2)]">{buffied && buffies?.hypercharge ? buffies.hypercharge : hypercharge.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-[5px] bg-red-400/12 px-2 py-1 text-[10px] font-bold text-red-300">+{hypercharge.damageBoost}% damage</span>
                        <span className="rounded-[5px] bg-blue-400/12 px-2 py-1 text-[10px] font-bold text-blue-300">+{hypercharge.shieldBoost}% shield</span>
                        <span className="rounded-[5px] bg-emerald-400/12 px-2 py-1 text-[10px] font-bold text-emerald-300">+{hypercharge.speedBoost}% speed</span>
                      </div>
                    </div>
                  )}
                  {!brawler.gadgets.length && !brawler.starPowers.length && !hypercharge && (
                    <p className="m-0 text-[12px] text-[var(--lb-text-3)]">No ability data available.</p>
                  )}
                </div>
                {buffies && (
                  <button
                    type="button"
                    onClick={() => setBuffied(value => !value)}
                    className="mt-3 inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-[5px] border border-sky-300/24 bg-sky-400/10 px-3 text-[12px] font-extrabold text-sky-100"
                  >
                    <Shield size={13} />
                    {buffied ? "Buffies on" : "Apply buffies"}
                  </button>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
