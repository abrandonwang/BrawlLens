"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { PulsingBorder } from "@paper-design/shaders-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import HelpTooltip from "@/components/HelpTooltip"
import { HYPERCHARGES } from "@/data/hypercharges"
import { formatBrawlerName, formatNum } from "@/lib/format"
import { getTierInfo, winRateColor } from "@/lib/tiers"

interface BrawlerPower {
  id: number
  name: string
  description?: string
  imageUrl?: string
}

interface Brawler {
  id: number
  name: string
  description?: string
  imageUrl?: string
  class?: { name?: string }
  rarity?: { name?: string; color?: string }
  gadgets?: BrawlerPower[]
  starPowers?: BrawlerPower[]
  hypercharge?: BrawlerPower | null
  hyperCharge?: BrawlerPower | null
}

interface BrawlerStats {
  totalPicks: number
  avgWinRate: number | null
  maps: { map: string; mode: string; picks: number; wins: number; winRate: number }[]
  modes: { mode: string; picks: number; winRate: number }[]
  histogram?: number[]
  history?: BrawlerHistoryPoint[]
  historySource?: string
}

interface BrawlerHistoryPoint {
  date: string
  picks: number
  wins: number
  winRate: number
  mapCount: number
}

interface CatalogStat {
  id: number
  name: string
  picks: number
  wins: number
  mapCount: number
  bestMap: { name: string; mode: string; winRate: number; picks: number } | null
  histogram: number[]
  winRate: number | null
}

type AbilityItem = {
  key: string
  name: string
  description: string
  label: string
  iconUrl?: string
  tone: "gadget" | "star" | "hyper"
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

const pageShellClass =
  "min-h-screen bg-[var(--bg)] text-[#f5f4f1] [font-family:var(--font-ui)]"

const pageFrameClass =
  "mx-auto w-[min(1180px,calc(100vw-28px))] pb-10 pt-3 max-[560px]:w-[calc(100vw-20px)]"

const panelClass =
  "min-w-0 rounded-[9px] border border-[rgba(245,244,241,0.075)] bg-[#15151b] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"

const panelHeaderClass =
  "mb-2.5 flex min-w-0 items-start justify-between gap-2 max-[560px]:flex-col max-[560px]:gap-1"

const panelTitleClass =
  "inline-flex min-w-0 items-center gap-1.5 text-[12.5px] font-[880] leading-none text-[#f5f4f1]"

const panelMetaClass =
  "text-[10.5px] font-[760] leading-none text-[rgba(245,244,241,0.74)]"

const rowSurfaceClass =
  "rounded-[7px] border border-[rgba(245,244,241,0.065)] bg-[#0d0d11]"

const DETAIL_INTRO_BORDER_COLORS = ["#7c5cff", "#5aeed0", "#ff6099", "#f5d75e", "#7c5cff"]
const DETAIL_INTRO_BORDER_STYLE: CSSProperties = {
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

const BRAWLER_CLASS_OVERRIDES_BY_ID: Record<number, string> = {
  16000089: "Controller",
  16000090: "Tank",
  16000092: "Controller",
  16000093: "Support",
  16000094: "Assassin",
  16000095: "Assassin",
  16000096: "Tank",
  16000097: "Damage Dealer",
  16000098: "Controller",
  16000099: "Marksman",
  16000100: "Assassin",
  16000101: "Support",
  16000102: "Controller",
  16000103: "Damage Dealer",
  16000104: "Tank",
  16000105: "Assassin",
  16000106: "Tank",
}

const BRAWLER_CLASS_OVERRIDES_BY_NAME: Record<string, string> = {
  MEEPLE: "Controller",
  OLLIE: "Tank",
  FINX: "Controller",
  "JAE-YONG": "Support",
  KAZE: "Assassin",
  ALLI: "Assassin",
  TRUNK: "Tank",
  MINA: "Damage Dealer",
  ZIGGY: "Controller",
  PIERCE: "Marksman",
  GIGI: "Assassin",
  GLOWY: "Support",
  GLOWLY: "Support",
  SIRIUS: "Controller",
  NAJIA: "Damage Dealer",
  DAMIAN: "Tank",
  "STARR NOVA": "Assassin",
  BOLT: "Tank",
  "BUZZ LIGHTYEAR": "Damage Dealer",
}

function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(digits)}%`
}

function formatRank(rank: number | null, total: number) {
  if (!rank || !total) return "-"
  return `${rank}/${total}`
}

function compactNumber(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-"
  return formatNum(Math.round(value))
}

function rankSuffix(rank: number | null) {
  if (!rank) return "No rank yet"
  const last = rank % 10
  const teen = rank % 100
  if (last === 1 && teen !== 11) return `${rank}st by win rate`
  if (last === 2 && teen !== 12) return `${rank}nd by win rate`
  if (last === 3 && teen !== 13) return `${rank}rd by win rate`
  return `${rank}th by win rate`
}

function getBrawlerClassName(brawler: Brawler) {
  if (brawler.class?.name && brawler.class.name !== "Unknown") return brawler.class.name
  return BRAWLER_CLASS_OVERRIDES_BY_ID[brawler.id]
    ?? BRAWLER_CLASS_OVERRIDES_BY_NAME[brawler.name.toUpperCase()]
    ?? "Unclassified"
}

function browserSupportsWebGL() {
  try {
    const canvas = document.createElement("canvas")
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
  } catch {
    return false
  }
}

function clampedBarPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return 0
  return Math.max(4, Math.min(100, value))
}

function MiniBar({ value }: { value: number | null | undefined }) {
  const color = value != null ? winRateColor(value) : "rgba(245,244,241,0.52)"
  return (
    <span className="block h-[3px] overflow-hidden rounded-full bg-[rgba(245,244,241,0.07)]">
      <span
        className="block h-full rounded-full"
        style={{ width: `${clampedBarPercent(value)}%`, background: color }}
      />
    </span>
  )
}

function shortDateLabel(value: string) {
  const [, month, day] = value.split("-")
  if (!month || !day) return value
  return `${Number(month)}/${Number(day)}`
}

function signedValue(value: number | null | undefined, suffix = "") {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}${suffix}`
}

function TrendCard({
  title,
  caption,
  points,
  metric,
  color,
  formatValue,
}: {
  title: string
  caption: string
  points: BrawlerHistoryPoint[]
  metric: "winRate" | "picks" | "mapCount"
  color: string
  formatValue: (value: number) => string
}) {
  const width = 360
  const height = 158
  const padX = 28
  const padY = 20
  const values = points.map(point => Number(point[metric])).filter(Number.isFinite)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const baseline = height - padY
  const coords = values.map((value, index) => {
    const x = values.length === 1
      ? width / 2
      : padX + (index / (values.length - 1)) * (width - padX * 2)
    const y = padY + ((max - value) / range) * (height - padY * 2)
    return [x, y] as const
  })
  const linePath = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1][0].toFixed(1)} ${baseline} L ${coords[0][0].toFixed(1)} ${baseline} Z`
    : ""
  const latest = values[values.length - 1] ?? 0
  const first = values[0] ?? latest
  const delta = latest - first
  const startLabel = points[0] ? shortDateLabel(points[0].date) : "-"
  const endLabel = points[points.length - 1] ? shortDateLabel(points[points.length - 1].date) : "-"

  return (
    <div className={`${panelClass} min-h-[238px]`}>
      <div className={panelHeaderClass}>
        <span className={panelTitleClass}>{title}</span>
        <small className={panelMetaClass}>{caption}</small>
      </div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <strong className="text-[22px] font-[900] leading-none text-[#f5f4f1] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]">
          {formatValue(latest)}
        </strong>
        <span className="rounded-[6px] border border-[rgba(245,244,241,0.07)] bg-[#0d0d11] px-2 py-1 text-[10.5px] font-[820] leading-none" style={{ color: delta >= 0 ? "#8ff0b4" : "#ff8585" }}>
          {signedValue(delta, metric === "winRate" ? "%" : "")}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[150px] w-full overflow-visible" role="img" aria-label={`${title} chart`}>
        {[0, 0.5, 1].map(step => (
          <line
            key={step}
            x1={padX}
            x2={width - padX}
            y1={padY + step * (height - padY * 2)}
            y2={padY + step * (height - padY * 2)}
            stroke="rgba(245,244,241,0.07)"
            strokeDasharray="4 6"
            strokeWidth="1"
          />
        ))}
        {areaPath && <path d={areaPath} fill={color} opacity="0.16" />}
        {linePath && <path d={linePath} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />}
        {coords.map(([x, y], index) => (
          <circle key={`${x}-${index}`} cx={x} cy={y} r={index === coords.length - 1 ? 3.5 : 2} fill={color} opacity={index === coords.length - 1 ? 1 : 0.54} />
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10.5px] font-bold leading-none text-[rgba(245,244,241,0.74)]">
        <span>{startLabel}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  )
}

function DataRow({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" | "accent" }) {
  const color = tone === "good"
    ? "#8ff0b4"
    : tone === "bad"
      ? "#ff8585"
      : tone === "accent"
        ? "#a78bff"
        : "#f5f4f1"

  return (
    <div className="flex min-h-[28px] items-center justify-between gap-3 border-b border-[rgba(245,244,241,0.06)] py-1.5 last:border-b-0">
      <span className="min-w-0 text-[11.5px] font-[760] leading-none text-[rgba(245,244,241,0.78)]">{label}</span>
      <strong className="text-right text-[13px] font-[880] leading-none [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]" style={{ color }}>
        {value}
      </strong>
    </div>
  )
}

function HistogramPanel({ histogram }: { histogram: number[] }) {
  const buckets = ["0-20", "20-40", "40-60", "60-80", "80+"]
  const max = Math.max(1, ...histogram)

  return (
    <div className={panelClass}>
      <div className={panelHeaderClass}>
        <span className={panelTitleClass}>Map Distribution</span>
        <small className={panelMetaClass}>win-rate buckets</small>
      </div>
      <div className="grid gap-2">
        {buckets.map((bucket, index) => (
          <div key={bucket} className="grid grid-cols-[42px_minmax(0,1fr)_30px] items-center gap-2">
            <span className="text-[10.5px] font-[780] leading-none text-[rgba(245,244,241,0.78)]">{bucket}</span>
            <span className="h-2 overflow-hidden rounded-full bg-[rgba(245,244,241,0.07)]">
              <span
                className="block h-full rounded-full bg-[#a78bff]"
                style={{ width: `${Math.max(4, (histogram[index] ?? 0) / max * 100)}%`, opacity: 0.42 + index * 0.1 }}
              />
            </span>
            <strong className="text-right text-[11px] font-[840] leading-none text-[#f5f4f1]">{histogram[index] ?? 0}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function cleanAbilityDescription(value: string | undefined, fallback: string) {
  const cleaned = (value ?? fallback)
    .replace(/<!card\.accessory\.skill\.maxAmmo>/gi, "multiple")
    .replace(/<![^>]+>/g, "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim()

  return cleaned || fallback
}

function abilityItemsFor(brawler: Brawler): AbilityItem[] {
  const gadgets = (brawler.gadgets ?? []).map((gadget, index) => ({
    key: `gadget-${gadget.id ?? index}`,
    name: gadget.name,
    description: cleanAbilityDescription(gadget.description, "Gadget details from Brawlify."),
    label: "G",
    iconUrl: gadget.imageUrl,
    tone: "gadget" as const,
  }))

  const starPowers = (brawler.starPowers ?? []).map((starPower, index) => ({
    key: `star-${starPower.id ?? index}`,
    name: starPower.name,
    description: cleanAbilityDescription(starPower.description, "Star Power details from Brawlify."),
    label: "S",
    iconUrl: starPower.imageUrl,
    tone: "star" as const,
  }))

  const hypercharge = HYPERCHARGES[brawler.id]
  const liveHyper = brawler.hypercharge ?? brawler.hyperCharge ?? null
  const hyper = hypercharge ? [{
    key: `hyper-${brawler.id}`,
    name: hypercharge.name,
    description: `${hypercharge.description} +${hypercharge.speedBoost}% speed, +${hypercharge.damageBoost}% damage, +${hypercharge.shieldBoost}% shield while active.`,
    label: "H",
    iconUrl: liveHyper?.imageUrl ?? `https://cdn.brawlify.com/brawlers/emoji/${brawler.id}.png`,
    tone: "hyper" as const,
  }] : []

  return [...gadgets, ...starPowers, ...hyper]
}

function BuildCell({ title, items, note }: { title: string; items: AbilityItem[]; note: string }) {
  return (
    <div className={`${rowSurfaceClass} grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 max-[560px]:grid-cols-1`}>
      <div className="grid min-w-0 gap-0.5">
        <b className="text-[12px] font-[840] leading-tight text-[#f5f4f1]">{title}</b>
        <span className="text-[10px] font-[780] leading-none text-[rgba(245,244,241,0.76)]">{note}</span>
      </div>
      <div className="flex flex-wrap justify-end gap-1.5 max-[560px]:justify-start">
        {items.length ? items.map(item => (
          <span
            key={`${title}-${item.key}`}
            className="group relative grid size-8 place-items-center overflow-visible rounded-[7px] border border-[#26262d] bg-[#15151b] text-[rgba(245,244,241,0.78)] outline-none focus-visible:border-[rgba(124,92,255,0.58)]"
            tabIndex={0}
            aria-label={item.name}
          >
            <span className="grid size-full place-items-center overflow-hidden rounded-[6px]">
              {item.iconUrl ? (
                <BrawlImage src={item.iconUrl} alt={item.name} width={32} height={32} className="size-full object-cover" sizes="32px" />
              ) : (
                <span className="text-[12px] font-black leading-none">{item.label}</span>
              )}
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-40 max-w-[220px] -translate-x-1/2 translate-y-1 rounded-[7px] border border-[rgba(245,244,241,0.12)] bg-[#0d0d11] px-2 py-1.5 text-center text-[11px] font-[780] leading-tight text-[#f5f4f1] opacity-0 shadow-[0_14px_34px_rgba(0,0,0,0.38)] transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
            >
              {item.name}
            </span>
          </span>
        )) : <span className="text-[12px] font-bold text-[rgba(245,244,241,0.74)]">No kit data</span>}
      </div>
    </div>
  )
}

function MapRow({ map }: { map: BrawlerStats["maps"][number] }) {
  return (
    <Link
      href={`/meta/${encodeURIComponent(map.map)}`}
      className={`${rowSurfaceClass} grid min-h-[48px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 px-3 py-2 text-inherit no-underline transition-colors hover:border-[rgba(124,92,255,0.28)] hover:bg-[rgba(124,92,255,0.08)]`}
    >
      <span className="grid min-w-0 gap-0.5">
        <b className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-[820] leading-tight text-[#f5f4f1]">{map.map}</b>
        <em className="text-[10.5px] not-italic font-bold leading-none text-[rgba(245,244,241,0.74)]">{map.mode}</em>
      </span>
      <span className="grid justify-items-end gap-0.5">
        <strong className="text-[13px] font-[880] leading-none" style={{ color: winRateColor(map.winRate) }}>{formatPercent(map.winRate)}</strong>
        <small className="text-[10.5px] font-bold leading-none text-[rgba(245,244,241,0.74)]">{compactNumber(map.picks)} picks</small>
      </span>
      <span className="col-span-2">
        <MiniBar value={map.winRate} />
      </span>
    </Link>
  )
}

function MatchupCard({ stat, delta, type }: { stat: CatalogStat; delta: number; type: "good" | "bad" }) {
  return (
    <Link
      href={`/brawlers/${stat.id}`}
      className={cx(
        "group grid w-[clamp(104px,10vw,116px)] shrink-0 overflow-hidden rounded-[8px] border bg-[#0d0d11] text-inherit no-underline transition-colors hover:bg-[rgba(245,244,241,0.045)]",
        type === "good" ? "border-[rgba(74,222,128,0.16)]" : "border-[rgba(248,113,113,0.16)]",
      )}
    >
      <BrawlImage src={brawlerIconUrl(stat.id)} alt={stat.name} width={116} height={128} className="h-[clamp(92px,8.6vw,100px)] w-full object-cover object-top" sizes="116px" />
      <div className="grid min-h-[68px] content-center justify-items-center gap-1 px-2 py-2 text-center transition-opacity group-hover:opacity-75">
        <b className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-[850] leading-tight text-[#f5f4f1]">{formatBrawlerName(stat.name)}</b>
        <strong className={cx("text-[17px] font-black leading-none", type === "good" ? "text-[#4ade80]" : "text-[#ff6262]")}>
          {type === "good" ? "+" : "-"}{Math.abs(delta).toFixed(1)}%
        </strong>
        <span className="text-[11px] font-bold leading-none text-[rgba(245,244,241,0.74)]">{compactNumber(stat.picks)} games</span>
      </div>
    </Link>
  )
}

export default function BrawlerDetailClient({ brawler }: { brawler: Brawler }) {
  const [stats, setStats] = useState<BrawlerStats | null>(null)
  const [catalogStats, setCatalogStats] = useState<Record<string, CatalogStat>>({})
  const [loading, setLoading] = useState(true)
  const [introBorderReady, setIntroBorderReady] = useState(false)
  const [showAllMatchups, setShowAllMatchups] = useState(false)

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    setIntroBorderReady(browserSupportsWebGL())
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      fetch(`/api/brawler-stats?id=${brawler.id}`).then(res => res.ok ? res.json() : null),
      fetch("/api/brawlers/stats").then(res => res.ok ? res.json() : null),
    ])
      .then(([detail, catalog]) => {
        if (cancelled) return
        setStats(detail)
        setCatalogStats(catalog?.stats ?? {})
      })
      .catch(() => {
        if (cancelled) return
        setStats(null)
        setCatalogStats({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [brawler.id])

  const abilities = useMemo(() => abilityItemsFor(brawler), [brawler])
  const selectedCatalog = catalogStats[String(brawler.id)]
  const catalogValues = useMemo(
    () => Object.values(catalogStats).filter(stat => stat.winRate != null && stat.picks > 0),
    [catalogStats],
  )
  const totalCatalogPicks = catalogValues.reduce((sum, stat) => sum + stat.picks, 0)
  const selectedWinRate = stats?.avgWinRate ?? selectedCatalog?.winRate ?? null
  const selectedPicks = stats?.totalPicks ?? selectedCatalog?.picks ?? 0
  const rankable = catalogValues.filter(stat => stat.picks >= 50).sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
  const rank = rankable.findIndex(stat => stat.id === brawler.id)
  const displayRank = rank >= 0 ? rank + 1 : null
  const pickRate = totalCatalogPicks > 0 && selectedCatalog ? (selectedCatalog.picks / totalCatalogPicks) * 100 : null
  const tier = selectedWinRate != null ? getTierInfo(selectedWinRate) : null
  const topMaps = stats?.maps?.slice(0, 5) ?? []
  const topModes = stats?.modes?.slice(0, 5) ?? []
  const history = (stats?.history ?? []).filter(point =>
    point.date
    && Number.isFinite(point.picks)
    && Number.isFinite(point.winRate)
    && Number.isFinite(point.mapCount)
  )
  const hasDailyHistory = history.length >= 2
  const latestHistory = history[history.length - 1] ?? null
  const previousHistory = history.length >= 2 ? history[history.length - 2] : null
  const dailyWinDelta = latestHistory && previousHistory ? latestHistory.winRate - previousHistory.winRate : null
  const historyWindowLabel = hasDailyHistory
    ? `${history.length} daily snapshots`
    : history.length === 1
      ? "1 daily snapshot"
      : "daily snapshots pending"
  const mapHistogram = stats?.histogram?.length ? stats.histogram : selectedCatalog?.histogram ?? [0, 0, 0, 0, 0]
  const bestMapName = topMaps[0]?.map ?? selectedCatalog?.bestMap?.name ?? null
  const bestMode = topModes[0] ?? null
  const hyper = HYPERCHARGES[brawler.id]

  const builds = useMemo(() => {
    const gadgets = abilities.filter(item => item.tone === "gadget")
    const stars = abilities.filter(item => item.tone === "star")
    const hypers = abilities.filter(item => item.tone === "hyper")
    return [
      { title: "Primary build", items: [gadgets[0], stars[0], hypers[0]].filter(Boolean) as AbilityItem[], note: "Default ladder" },
      { title: "Pressure build", items: [gadgets[1] ?? gadgets[0], stars[1] ?? stars[0], hypers[0]].filter(Boolean) as AbilityItem[], note: "High-tempo maps" },
      { title: "Control build", items: [gadgets[0], stars[1] ?? stars[0], hypers[0]].filter(Boolean) as AbilityItem[], note: "Safer lanes" },
    ]
  }, [abilities])

  const matchups = useMemo(() => {
    if (selectedWinRate == null) {
      return {
        good: [] as { stat: CatalogStat; delta: number }[],
        bad: [] as { stat: CatalogStat; delta: number }[],
        all: [] as { stat: CatalogStat; delta: number }[],
      }
    }
    const pool = catalogValues
      .filter(stat => stat.id !== brawler.id && stat.picks >= 50 && stat.winRate != null)
      .map(stat => ({ stat, delta: selectedWinRate - (stat.winRate ?? selectedWinRate) }))
      .sort((a, b) => b.delta - a.delta)

    return {
      good: pool.filter(item => item.delta > 0),
      bad: pool.filter(item => item.delta < 0).sort((a, b) => a.delta - b.delta),
      all: pool,
    }
  }, [brawler.id, catalogValues, selectedWinRate])
  const visibleMatchups = showAllMatchups
    ? matchups.all
    : [...matchups.good.slice(0, 5), ...matchups.bad.slice(0, 5)]
  const previewGoodMatchups = matchups.good.slice(0, 5)
  const previewBadMatchups = matchups.bad.slice(0, 5)
  const matchupEmptyText = selectedPicks < 50
    ? "Need more sample."
    : "No comparison sample yet."

  const rarityColor = brawler.rarity?.color ?? "#a78bff"
  const classLabel = getBrawlerClassName(brawler)
  const rarityLabel = brawler.rarity?.name ?? "Unknown rarity"
  const bestModeLabel = bestMode?.mode ?? "No mode sample"
  const coverageLabel = selectedCatalog?.mapCount ? `${selectedCatalog.mapCount} maps` : stats?.maps?.length ? `${stats.maps.length} maps` : "Map sample pending"
  const confidenceLabel = selectedPicks >= 500 ? "High sample" : selectedPicks >= 100 ? "Medium sample" : selectedPicks > 0 ? "Low sample" : "No sample"

  const summary = selectedWinRate == null
    ? `${formatBrawlerName(brawler.name)} does not have enough tracked map data yet.`
    : `${formatBrawlerName(brawler.name)} is ${rankSuffix(displayRank)} with ${formatPercent(selectedWinRate)} across ${compactNumber(selectedPicks)} analyzed games${bestMapName ? `, peaking on ${bestMapName}` : ""}.`
  const topMetrics = [
    { label: "Tier", value: tier?.label ?? "-", color: tier?.color },
    { label: "Win rate", value: formatPercent(selectedWinRate), color: selectedWinRate != null ? winRateColor(selectedWinRate) : undefined },
    { label: "Rank", value: formatRank(displayRank, rankable.length) },
    { label: "Pick rate", value: formatPercent(pickRate) },
    { label: "Games", value: compactNumber(selectedPicks), detail: confidenceLabel },
  ]

  return (
    <main className={pageShellClass}>
      <div className={pageFrameClass}>
        <section className="relative isolate mb-4 overflow-visible rounded-[10px] max-[560px]:mb-3" aria-labelledby="brawler-title">
          {introBorderReady && (
            <PulsingBorder
              aria-hidden="true"
              className="bl-tier-hero-border-shader"
              style={DETAIL_INTRO_BORDER_STYLE}
              colors={DETAIL_INTRO_BORDER_COLORS}
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
          <div className="relative z-[2] min-h-[132px] rounded-[10px] border border-[rgba(245,244,241,0.105)] bg-[#101015] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] max-[760px]:px-4 max-[760px]:py-4">
            <div className="grid min-h-[92px] grid-cols-[minmax(0,1fr)_minmax(520px,0.9fr)] items-center gap-5 max-[980px]:grid-cols-1 max-[980px]:gap-4">
              <div className="flex min-w-0 items-center gap-3.5 max-[560px]:items-start">
                <div className="grid size-[64px] shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[rgba(245,244,241,0.09)] bg-[#15151b] max-[560px]:size-14">
                  <BrawlImage
                    src={brawler.imageUrl || brawlerIconUrl(brawler.id)}
                    alt={brawler.name}
                    width={72}
                    height={72}
                    className="size-full object-cover"
                    priority
                    sizes="72px"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <h1 id="brawler-title" className="m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(24px,3vw,34px)] font-[900] leading-[0.98] tracking-[0] text-[#f5f4f1] [font-family:var(--font-heading)]">
                      {formatBrawlerName(brawler.name)}
                    </h1>
                    <HelpTooltip label={`${formatBrawlerName(brawler.name)} traits`} align="left">
                      <span className="grid gap-1 text-left">
                        <span><b>Class</b> {classLabel}</span>
                        <span><b>Rarity</b> <span style={{ color: rarityColor }}>{rarityLabel}</span></span>
                      </span>
                    </HelpTooltip>
                  </div>
                  <p className="m-0 mt-1.5 max-w-[560px] text-[12px] font-[620] leading-[1.42] text-[rgba(245,244,241,0.82)]">
                    {summary}
                  </p>
                </div>
              </div>

              <div className="min-w-0 overflow-x-auto border-x border-y border-[rgba(245,244,241,0.075)] px-3 [scrollbar-width:thin] max-[640px]:hidden" aria-label={`${brawler.name} core metrics`}>
                <table className="w-full min-w-[520px] table-fixed border-collapse">
                  <thead>
                    <tr>
                      {topMetrics.map(metric => (
                        <th
                          key={metric.label}
                          scope="col"
                          className="border-b border-[rgba(245,244,241,0.06)] px-2 py-2 text-left text-[10px] font-[860] uppercase leading-none text-[rgba(245,244,241,0.74)] first:pl-0 last:pr-0"
                        >
                          {metric.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {topMetrics.map(metric => (
                        <td
                          key={metric.label}
                          className="px-2 py-2.5 align-top first:pl-0 last:pr-0"
                        >
                          <strong
                            className="block text-[18px] font-[900] leading-none text-[#f5f4f1] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]"
                            style={metric.color ? { color: metric.color } : undefined}
                          >
                            {metric.value}
                          </strong>
                          {metric.detail && <small className="mt-1 block text-[10px] font-[760] leading-none text-[rgba(245,244,241,0.74)]">{metric.detail}</small>}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="hidden border-x border-y border-[rgba(245,244,241,0.075)] px-3 max-[640px]:grid" aria-label={`${brawler.name} core metrics`}>
                {topMetrics.map(metric => (
                  <div key={metric.label} className="grid min-h-[34px] grid-cols-[92px_minmax(0,1fr)] items-center gap-3 border-b border-[rgba(245,244,241,0.06)] py-2 last:border-b-0">
                    <span className="text-[10px] font-[860] uppercase leading-none text-[rgba(245,244,241,0.74)]">{metric.label}</span>
                    <span className="min-w-0 text-right">
                      <strong
                        className="block overflow-hidden text-ellipsis whitespace-nowrap text-[17px] font-[900] leading-none text-[#f5f4f1] [font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)]"
                        style={metric.color ? { color: metric.color } : undefined}
                      >
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

        {loading ? (
          <div className="mt-4 grid min-h-[260px] place-items-center rounded-[10px] border border-[rgba(245,244,241,0.075)] bg-[#15151b] text-[13px] font-bold text-[rgba(245,244,241,0.76)]">
            Loading {formatBrawlerName(brawler.name)} stats...
          </div>
        ) : (
          <>
            <section className="mt-3 grid grid-cols-3 gap-3 max-[980px]:grid-cols-1" aria-label={`${brawler.name} daily trend charts`}>
              {hasDailyHistory ? (
                <>
                  <TrendCard
                    title="Win Rate Over Time"
                    caption={historyWindowLabel}
                    points={history}
                    metric="winRate"
                    color="#f2de8a"
                    formatValue={value => formatPercent(value)}
                  />
                  <TrendCard
                    title="Pick Volume"
                    caption={latestHistory ? `${compactNumber(latestHistory.picks)} latest picks` : historyWindowLabel}
                    points={history}
                    metric="picks"
                    color="#a78bff"
                    formatValue={value => compactNumber(value)}
                  />
                  <TrendCard
                    title="Map Coverage"
                    caption={latestHistory ? `${latestHistory.mapCount} maps latest` : historyWindowLabel}
                    points={history}
                    metric="mapCount"
                    color="#5aeed0"
                    formatValue={value => `${Math.round(value)}`}
                  />
                </>
              ) : (
                <>
                  <div className={`${panelClass} min-h-[186px] max-[980px]:min-h-0`}>
                    <div className={panelHeaderClass}>
                      <span className={panelTitleClass}>Daily Tracking</span>
                      <small className={panelMetaClass}>{historyWindowLabel}</small>
                    </div>
                    <div className="grid gap-1.5">
                      <DataRow label="Snapshots" value={`${history.length}/2`} tone={history.length ? "accent" : undefined} />
                      <DataRow label="Latest date" value={latestHistory ? shortDateLabel(latestHistory.date) : "-"} />
                      <DataRow label="Latest win rate" value={latestHistory ? formatPercent(latestHistory.winRate) : formatPercent(selectedWinRate)} tone={selectedWinRate != null ? "accent" : undefined} />
                      <p className="m-0 mt-2 text-[12px] font-[650] leading-[1.45] text-[rgba(245,244,241,0.78)]">
                        Trend charts appear after two daily snapshots. Current tables below use the live aggregated map sample.
                      </p>
                    </div>
                  </div>
                  <div className={`${panelClass} min-h-[186px]`}>
                    <div className={panelHeaderClass}>
                      <span className={panelTitleClass}>Current Movement</span>
                      <small className={panelMetaClass}>latest snapshot</small>
                    </div>
                    <div className="grid gap-1.5">
                      <DataRow label="Day change" value={signedValue(dailyWinDelta, "%")} tone={dailyWinDelta == null ? undefined : dailyWinDelta >= 0 ? "good" : "bad"} />
                      <DataRow label="Best map" value={bestMapName ?? "-"} />
                      <DataRow label="Primary mode" value={bestModeLabel} />
                      <DataRow label="Coverage" value={coverageLabel} />
                    </div>
                  </div>
                  <HistogramPanel histogram={mapHistogram} />
                </>
              )}
            </section>

            <section className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] gap-3 max-[980px]:grid-cols-1">
              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}>Best Modes</span>
                  <small className={panelMetaClass}>{bestModeLabel}</small>
                </div>
                <div className="grid gap-1.5">
                  {topModes.length ? topModes.map(mode => (
                    <Link key={mode.mode} href={`/meta?mode=${encodeURIComponent(mode.mode)}`} className={`${rowSurfaceClass} grid min-h-[46px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 px-3 py-2 text-inherit no-underline transition-colors hover:border-[rgba(124,92,255,0.28)] hover:bg-[rgba(124,92,255,0.08)]`}>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-[840] text-[#f5f4f1]">{mode.mode}</span>
                      <span className="grid justify-items-end gap-0.5">
                        <strong className="text-[13px] font-black leading-none" style={{ color: winRateColor(mode.winRate) }}>{formatPercent(mode.winRate)}</strong>
                        <em className="text-[10.5px] not-italic font-bold leading-none text-[rgba(245,244,241,0.74)]">{compactNumber(mode.picks)} picks</em>
                      </span>
                      <span className="col-span-2">
                        <MiniBar value={mode.winRate} />
                      </span>
                    </Link>
                  )) : <div className="text-[12px] font-bold text-[rgba(245,244,241,0.74)]">No mode sample yet.</div>}
                </div>
              </div>

              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}>Recommended Builds</span>
                  <small className={panelMetaClass}>kit data</small>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {builds.map(build => <BuildCell key={build.title} {...build} />)}
                </div>
                {hyper && (
                  <div className="mt-3 rounded-[8px] border border-[rgba(90,238,208,0.16)] bg-[rgba(90,238,208,0.055)] px-3 py-2 text-[12px] font-semibold leading-[1.45] text-[rgba(245,244,241,0.78)]">
                    <span><b className="text-[#f5f4f1]">{hyper.name}</b> adds {hyper.speedBoost}% speed, {hyper.damageBoost}% damage, and {hyper.shieldBoost}% shield during Hypercharge.</span>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] gap-3 max-[980px]:grid-cols-1">
              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}>Best Maps</span>
                  <small className={panelMetaClass}>{bestMode ? bestMode.mode : classLabel}</small>
                </div>
                <div className="grid gap-1.5">
                  {topMaps.length ? topMaps.map(map => <MapRow key={`${map.map}-${map.mode}`} map={map} />) : (
                    <div className="text-[12px] font-bold text-[rgba(245,244,241,0.74)]">No map sample yet.</div>
                  )}
                </div>
              </div>

              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}>Readout</span>
                  <small className={panelMetaClass}>{compactNumber(selectedPicks)} games</small>
                </div>
                <div className="grid gap-1.5">
                  <div className={`${rowSurfaceClass} px-3 py-2`}>
                    <DataRow label="Win rate" value={formatPercent(selectedWinRate)} tone={selectedWinRate != null ? "accent" : undefined} />
                    <DataRow label="Day change" value={signedValue(dailyWinDelta, "%")} tone={dailyWinDelta == null ? undefined : dailyWinDelta >= 0 ? "good" : "bad"} />
                    <DataRow label="Rank" value={formatRank(displayRank, rankable.length)} />
                    <DataRow label="Pick rate" value={formatPercent(pickRate)} />
                    <DataRow label="Best map" value={bestMapName ?? "-"} />
                    <DataRow label="Primary mode" value={bestModeLabel} />
                    <DataRow label="Coverage" value={coverageLabel} />
                  </div>
                  <Link href="/brawlers" className="inline-flex h-8 items-center justify-center rounded-[7px] border border-[rgba(124,92,255,0.28)] bg-[rgba(124,92,255,0.12)] px-3 text-[11.5px] font-black uppercase leading-none text-[#a78bff] no-underline transition-colors hover:bg-[rgba(124,92,255,0.18)]">
                    Compare tierlist
                  </Link>
                </div>
              </div>
            </section>

            <section className={`${panelClass} mt-3`}>
              <div className={panelHeaderClass}>
                <span className={panelTitleClass}>Meta Matchups as {formatBrawlerName(brawler.name)}</span>
              </div>
              <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
                <b className="text-[12px] font-black uppercase tracking-[0] text-[#4ade80]">Best</b>
                <b className="text-[12px] font-black uppercase tracking-[0] text-[#f87171]">Worst</b>
              </div>
              <div className="min-w-0 overflow-x-auto pb-2 [scrollbar-color:rgba(245,244,241,0.32)_rgba(245,244,241,0.07)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[rgba(245,244,241,0.07)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(245,244,241,0.3)]">
                <div className="flex min-w-max snap-x gap-2">
                  {showAllMatchups ? (
                    visibleMatchups.length ? visibleMatchups.map(item => {
                      const type = item.delta >= 0 ? "good" : "bad"
                      return <MatchupCard key={item.stat.id} type={type} stat={item.stat} delta={Math.abs(item.delta)} />
                    }) : <div className={`${rowSurfaceClass} grid min-h-[104px] w-full min-w-[260px] place-items-center px-3 text-center text-[12px] font-bold text-[rgba(245,244,241,0.74)]`}>{matchupEmptyText}</div>
                  ) : (
                    <>
                      {previewGoodMatchups.map(item => <MatchupCard key={item.stat.id} type="good" stat={item.stat} delta={Math.abs(item.delta)} />)}
                      <button
                        type="button"
                        className={`${rowSurfaceClass} grid w-[clamp(104px,10vw,116px)] shrink-0 place-items-center content-center gap-1 px-2 text-center text-[12px] font-[850] text-[#f5f4f1] transition-colors hover:border-[rgba(124,92,255,0.28)] hover:bg-[rgba(124,92,255,0.08)]`}
                        aria-label="Show full matchup list"
                        onClick={() => setShowAllMatchups(true)}
                      >
                        <span className="text-[28px] font-semibold leading-none text-[#a78bff]">+</span>
                        <span>Full List</span>
                      </button>
                      {previewBadMatchups.map(item => <MatchupCard key={item.stat.id} type="bad" stat={item.stat} delta={Math.abs(item.delta)} />)}
                      {!previewGoodMatchups.length && !previewBadMatchups.length && (
                        <div className={`${rowSurfaceClass} grid min-h-[104px] w-full min-w-[260px] place-items-center px-3 text-center text-[12px] font-bold text-[rgba(245,244,241,0.74)]`}>{matchupEmptyText}</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
