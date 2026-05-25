"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BarChart3, Bolt, Crosshair, MapPinned, Shield, Sparkles, Target, Trophy } from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
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
  "mx-auto w-[min(1120px,calc(100vw-28px))] pb-12 pt-4 max-[560px]:w-[calc(100vw-20px)]"

const panelClass =
  "min-w-0 rounded-[10px] border border-[rgba(245,244,241,0.075)] bg-[#15151b] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"

const panelHeaderClass =
  "mb-3 flex min-w-0 items-start justify-between gap-3 max-[560px]:flex-col max-[560px]:gap-1"

const panelTitleClass =
  "inline-flex min-w-0 items-center gap-2 text-[13px] font-[850] leading-none text-[#f5f4f1]"

const panelMetaClass =
  "text-[10.5px] font-[760] leading-none text-[rgba(245,244,241,0.34)]"

const rowSurfaceClass =
  "rounded-[8px] border border-[rgba(245,244,241,0.065)] bg-[#0d0d11]"

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

function StatMetric({ value, label, detail, color }: { value: string; label: string; detail?: string; color?: string }) {
  return (
    <div className="grid min-h-[72px] content-center gap-1 rounded-[10px] border border-[rgba(245,244,241,0.075)] bg-[#15151b] px-3 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] max-[560px]:min-h-[62px]">
      <span className="text-[10.5px] font-[820] leading-none text-[rgba(245,244,241,0.42)]">{label}</span>
      <strong
        className="[font-family:var(--font-number,var(--font-geist-mono),ui-monospace,monospace)] text-[clamp(20px,2.2vw,28px)] font-[840] leading-none text-[#f5f4f1]"
        style={color ? { color } : undefined}
      >
        {value}
      </strong>
      {detail && <em className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] not-italic font-bold leading-none text-[rgba(245,244,241,0.30)]">{detail}</em>}
    </div>
  )
}

function AbilityBadge({ ability }: { ability: AbilityItem }) {
  const toneClass = ability.tone === "hyper"
    ? "border-[rgba(90,238,208,0.35)] text-[#5aeed0]"
    : ability.tone === "star"
      ? "border-[rgba(240,211,115,0.34)] text-[#f0d373]"
      : "border-[rgba(167,139,255,0.35)] text-[#a78bff]"

  return (
    <div className="group relative z-[2]">
      <div
        className={cx(
          "relative grid size-[34px] place-items-center overflow-visible rounded-[8px] border bg-[#15151b] shadow-[0_1px_3px_rgba(0,0,0,0.18)]",
          toneClass,
        )}
        aria-label={ability.name}
      >
        {ability.iconUrl ? (
          <BrawlImage src={ability.iconUrl} alt={ability.name} width={34} height={34} className="size-full object-cover" sizes="34px" />
        ) : (
          <Bolt size={18} strokeWidth={2.5} />
        )}
        <span className="absolute -bottom-1 -right-1 grid h-4 min-w-4 place-items-center rounded-[4px] border border-[rgba(0,0,0,0.52)] bg-[#0d0d11] px-1 text-[9px] font-black leading-none text-[#f5f4f1]">
          {ability.label}
        </span>
      </div>
      <div
        className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-[120] w-[min(420px,calc(100vw-44px))] -translate-y-1 rounded-[10px] border border-[#26262d] bg-[#15151b] p-4 opacity-0 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.86)] transition-[opacity,transform] duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100 max-[560px]:fixed max-[560px]:left-4 max-[560px]:right-4 max-[560px]:top-[90px] max-[560px]:w-auto"
        role="tooltip"
      >
        <h3 className="m-0 mb-2.5 text-[17px] font-[850] leading-tight text-[#f5f4f1]">{ability.name}</h3>
        <p className="m-0 text-[14px] font-medium leading-[1.5] text-[rgba(245,244,241,0.72)]">{ability.description}</p>
      </div>
    </div>
  )
}

function BuildCell({ title, items, note }: { title: string; items: AbilityItem[]; note: string }) {
  return (
    <div className={`${rowSurfaceClass} min-w-0 p-3`}>
      <div className="grid min-w-0 gap-1">
        <b className="text-[12px] font-[840] leading-tight text-[#f5f4f1]">{title}</b>
        <span className="text-[10px] font-[780] leading-none text-[rgba(245,244,241,0.46)]">{note}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {items.length ? items.map(item => (
          <div
            key={`${title}-${item.key}`}
            className="grid size-[34px] place-items-center overflow-hidden rounded-[8px] border border-[#26262d] bg-[#15151b] text-[rgba(245,244,241,0.5)]"
            title={item.name}
          >
            {item.iconUrl ? (
              <BrawlImage src={item.iconUrl} alt={item.name} width={34} height={34} className="size-full object-cover" sizes="34px" />
            ) : (
              <Bolt size={18} />
            )}
          </div>
        )) : <span className="text-[12px] font-bold text-[rgba(245,244,241,0.34)]">No kit data</span>}
      </div>
    </div>
  )
}

function MapRow({ map }: { map: BrawlerStats["maps"][number] }) {
  return (
    <Link
      href={`/meta/${encodeURIComponent(map.map)}`}
      className={`${rowSurfaceClass} grid min-h-[42px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 px-3 py-2 text-inherit no-underline transition-colors hover:border-[rgba(124,92,255,0.28)] hover:bg-[rgba(124,92,255,0.08)]`}
    >
      <span className="grid min-w-0 gap-0.5">
        <b className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-[820] leading-tight text-[#f5f4f1]">{map.map}</b>
        <em className="text-[10.5px] not-italic font-bold leading-none text-[rgba(245,244,241,0.34)]">{map.mode}</em>
      </span>
      <strong className="text-[13px] font-[860] leading-none" style={{ color: winRateColor(map.winRate) }}>{formatPercent(map.winRate)}</strong>
      <small className="text-[10.5px] font-bold leading-none text-[rgba(245,244,241,0.34)]">{compactNumber(map.picks)} picks</small>
    </Link>
  )
}

function MatchupCard({ stat, delta, type }: { stat: CatalogStat; delta: number; type: "good" | "bad" }) {
  return (
    <Link
      href={`/brawlers/${stat.id}`}
      className={cx(
        "group grid min-w-0 overflow-hidden rounded-[8px] border bg-[#0d0d11] text-inherit no-underline transition-colors hover:bg-[rgba(245,244,241,0.045)]",
        type === "good" ? "border-[rgba(74,222,128,0.16)]" : "border-[rgba(248,113,113,0.16)]",
      )}
    >
      <BrawlImage src={brawlerIconUrl(stat.id)} alt={stat.name} width={116} height={128} className="h-[100px] w-full object-cover object-top" sizes="116px" />
      <div className="grid min-h-[68px] content-center justify-items-center gap-1 px-2 py-2 text-center transition-opacity group-hover:opacity-75">
        <b className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-[850] leading-tight text-[#f5f4f1]">{formatBrawlerName(stat.name)}</b>
        <strong className={cx("text-[17px] font-black leading-none", type === "good" ? "text-[#4ade80]" : "text-[#ff6262]")}>
          {type === "good" ? "+" : "-"}{Math.abs(delta).toFixed(1)}%
        </strong>
        <span className="text-[11px] font-bold leading-none text-[rgba(245,244,241,0.34)]">{compactNumber(stat.picks)} games</span>
      </div>
    </Link>
  )
}

export default function BrawlerDetailClient({ brawler }: { brawler: Brawler }) {
  const [stats, setStats] = useState<BrawlerStats | null>(null)
  const [catalogStats, setCatalogStats] = useState<Record<string, CatalogStat>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add("landing-bg")
    return () => document.body.classList.remove("landing-bg")
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
    if (selectedWinRate == null) return { good: [] as { stat: CatalogStat; delta: number }[], bad: [] as { stat: CatalogStat; delta: number }[] }
    const pool = catalogValues
      .filter(stat => stat.id !== brawler.id && stat.picks >= 50 && stat.winRate != null)
      .map(stat => ({ stat, delta: selectedWinRate - (stat.winRate ?? selectedWinRate) }))

    return {
      good: [...pool].filter(item => item.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5),
      bad: [...pool].sort((a, b) => a.delta - b.delta).slice(0, 5),
    }
  }, [brawler.id, catalogValues, selectedWinRate])
  const matchupEmptyText = selectedPicks < 50
    ? "Need more sample."
    : "No matchup edge found."
  const badMatchupEmptyText = selectedPicks < 50
    ? "Need more sample."
    : "No comparison sample yet."

  const rarityColor = brawler.rarity?.color ?? "#a78bff"
  const classLabel = brawler.class?.name ?? "Unclassified"
  const rarityLabel = brawler.rarity?.name ?? "Unknown rarity"
  const bestModeLabel = bestMode?.mode ?? "No mode sample"
  const coverageLabel = selectedCatalog?.mapCount ? `${selectedCatalog.mapCount} maps` : stats?.maps?.length ? `${stats.maps.length} maps` : "Map sample pending"
  const confidenceLabel = selectedPicks >= 500 ? "High sample" : selectedPicks >= 100 ? "Medium sample" : selectedPicks > 0 ? "Low sample" : "No sample"

  const summary = selectedWinRate == null
    ? `${formatBrawlerName(brawler.name)} does not have enough tracked map data yet.`
    : `${formatBrawlerName(brawler.name)} is ${rankSuffix(displayRank)} with ${formatPercent(selectedWinRate)} across ${compactNumber(selectedPicks)} analyzed games${bestMapName ? `, peaking on ${bestMapName}` : ""}.`

  return (
    <main className={pageShellClass}>
      <div className={pageFrameClass}>
        <section className="relative overflow-hidden rounded-[12px] border border-[rgba(245,244,241,0.075)] bg-[#0d0d11] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-80"
            style={{ background: `linear-gradient(90deg, transparent, ${rarityColor}, transparent)` }}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(290px,0.42fr)] gap-6 max-[860px]:grid-cols-1">
            <div className="flex min-w-0 items-center gap-4 max-[560px]:items-start">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[14px] border border-[rgba(245,244,241,0.09)] bg-[#15151b] max-[560px]:size-16">
                <BrawlImage
                  src={brawler.imageUrl || brawlerIconUrl(brawler.id)}
                  alt={brawler.name}
                  width={80}
                  height={80}
                  className="size-full object-cover"
                  priority
                  sizes="80px"
                />
              </div>

              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(124,92,255,0.24)] bg-[rgba(124,92,255,0.12)] px-2.5 py-1 text-[10px] font-black uppercase leading-none text-[#a78bff]">
                    {classLabel}
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-black uppercase leading-none"
                    style={{ borderColor: `${rarityColor}55`, color: rarityColor, backgroundColor: `${rarityColor}18` }}
                  >
                    {rarityLabel}
                  </span>
                </div>
                <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-[900] leading-[0.98] tracking-[0] text-[#f5f4f1] [font-family:var(--font-heading)]">
                  {formatBrawlerName(brawler.name)}
                </h1>
                <p className="m-0 mt-3 max-w-[720px] text-[14px] font-medium leading-[1.5] text-[rgba(245,244,241,0.62)]">
                  {summary}
                </p>
              </div>
            </div>

            <aside className="grid content-start gap-2">
              <div className={`${rowSurfaceClass} grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5`}>
                <Trophy size={16} className="text-[#7c5cff]" />
                <span className="min-w-0 text-[11px] font-extrabold uppercase leading-none text-[rgba(245,244,241,0.42)]">Meta tier</span>
                <strong className="text-[18px] font-black leading-none" style={tier?.color ? { color: tier.color } : undefined}>{tier?.label ?? "-"}</strong>
              </div>
              <div className={`${rowSurfaceClass} grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5`}>
                <BarChart3 size={16} className="text-[#7c5cff]" />
                <span className="min-w-0 text-[11px] font-extrabold uppercase leading-none text-[rgba(245,244,241,0.42)]">Confidence</span>
                <strong className="text-[12px] font-black leading-none text-[#f5f4f1]">{confidenceLabel}</strong>
              </div>
              <div className={`${rowSurfaceClass} grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5`}>
                <MapPinned size={16} className="text-[#7c5cff]" />
                <span className="min-w-0 text-[11px] font-extrabold uppercase leading-none text-[rgba(245,244,241,0.42)]">Coverage</span>
                <strong className="text-[12px] font-black leading-none text-[#f5f4f1]">{coverageLabel}</strong>
              </div>
            </aside>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[rgba(245,244,241,0.065)] pt-4" aria-label={`${brawler.name} abilities`}>
            {abilities.length ? abilities.map(ability => <AbilityBadge key={ability.key} ability={ability} />) : (
              <span className="text-[12px] font-bold text-[rgba(245,244,241,0.34)]">Ability data unavailable</span>
            )}
          </div>
        </section>

        {loading ? (
          <div className="mt-4 grid min-h-[260px] place-items-center rounded-[10px] border border-[rgba(245,244,241,0.075)] bg-[#15151b] text-[13px] font-bold text-[rgba(245,244,241,0.42)]">
            Loading {formatBrawlerName(brawler.name)} stats...
          </div>
        ) : (
          <>
            <section className="mt-3 grid grid-cols-5 gap-2 max-[900px]:grid-cols-3 max-[560px]:grid-cols-2" aria-label={`${brawler.name} stat summary`}>
              <StatMetric value={tier?.label ?? "-"} label="tier" color={tier?.color} />
              <StatMetric value={formatRank(displayRank, rankable.length)} label="rank" />
              <StatMetric value={formatPercent(selectedWinRate)} label="win rate" color={selectedWinRate != null ? winRateColor(selectedWinRate) : undefined} />
              <StatMetric value={formatPercent(pickRate)} label="pick rate" />
              <StatMetric value={compactNumber(selectedPicks)} label="games" detail={confidenceLabel} />
            </section>

            <section className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] gap-3 max-[980px]:grid-cols-1">
              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}><Target size={15} /> Performance Profile</span>
                  <small className={panelMetaClass}>{bestModeLabel}</small>
                </div>
                <div className="grid gap-2">
                  {topModes.length ? topModes.map(mode => (
                    <div key={mode.mode} className={`${rowSurfaceClass} grid min-h-[42px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 px-3 py-2`}>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-[820] text-[#f5f4f1]">{mode.mode}</span>
                      <strong className="text-[13px] font-black" style={{ color: winRateColor(mode.winRate) }}>{formatPercent(mode.winRate)}</strong>
                      <em className="text-[10.5px] not-italic font-bold text-[rgba(245,244,241,0.34)]">{compactNumber(mode.picks)}</em>
                    </div>
                  )) : <div className="text-[12px] font-bold text-[rgba(245,244,241,0.34)]">No mode sample yet.</div>}
                </div>
              </div>

              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}><Sparkles size={15} /> Recommended Builds</span>
                  <small className={panelMetaClass}>kit data</small>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {builds.map(build => <BuildCell key={build.title} {...build} />)}
                </div>
                {hyper && (
                  <div className="mt-3 flex gap-2 rounded-[8px] border border-[rgba(90,238,208,0.16)] bg-[rgba(90,238,208,0.055)] px-3 py-2 text-[12px] font-semibold leading-[1.45] text-[rgba(245,244,241,0.72)]">
                    <Bolt size={14} className="mt-0.5 shrink-0 text-[#5aeed0]" />
                    <span><b className="text-[#f5f4f1]">{hyper.name}</b> adds {hyper.speedBoost}% speed, {hyper.damageBoost}% damage, and {hyper.shieldBoost}% shield during Hypercharge.</span>
                  </div>
                )}
              </div>
            </section>

            <section className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] gap-3 max-[980px]:grid-cols-1">
              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}><MapPinned size={15} /> Best Maps</span>
                  <small className={panelMetaClass}>{bestMode ? bestMode.mode : classLabel}</small>
                </div>
                <div className="grid gap-1.5">
                  {topMaps.length ? topMaps.map(map => <MapRow key={`${map.map}-${map.mode}`} map={map} />) : (
                    <div className="text-[12px] font-bold text-[rgba(245,244,241,0.34)]">No map sample yet.</div>
                  )}
                </div>
              </div>

              <div className={panelClass}>
                <div className={panelHeaderClass}>
                  <span className={panelTitleClass}><Shield size={15} /> Readout</span>
                  <small className={panelMetaClass}>{compactNumber(selectedPicks)} games</small>
                </div>
                <div className="grid gap-2">
                  <div className={`${rowSurfaceClass} px-3 py-3`}>
                    <span className="block text-[10px] font-black uppercase leading-none text-[rgba(245,244,241,0.34)]">Best map</span>
                    <strong className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[850] leading-tight text-[#f5f4f1]">{bestMapName ?? "-"}</strong>
                  </div>
                  <div className={`${rowSurfaceClass} px-3 py-3`}>
                    <span className="block text-[10px] font-black uppercase leading-none text-[rgba(245,244,241,0.34)]">Primary mode</span>
                    <strong className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-[850] leading-tight text-[#f5f4f1]">{bestModeLabel}</strong>
                  </div>
                  <Link href="/brawlers" className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[rgba(124,92,255,0.28)] bg-[rgba(124,92,255,0.12)] px-3 text-[12px] font-black uppercase leading-none text-[#a78bff] no-underline transition-colors hover:bg-[rgba(124,92,255,0.18)]">
                    Compare tierlist
                  </Link>
                </div>
              </div>
            </section>

            <section className={`${panelClass} mt-3`}>
              <div className={panelHeaderClass}>
                <span className={panelTitleClass}><Crosshair size={15} /> Meta Matchups as {formatBrawlerName(brawler.name)}</span>
                <small className={panelMetaClass}>50+ tracked games</small>
              </div>
              <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 max-[760px]:grid-cols-1 max-[760px]:gap-1">
                <b className="text-center text-[12px] font-black uppercase tracking-[0] text-[#4ade80] max-[760px]:text-left">Good Against</b>
                <span className="text-[11px] font-bold text-[rgba(245,244,241,0.34)] max-[760px]:order-3">Compared against nearby meta samples</span>
                <b className="text-center text-[12px] font-black uppercase tracking-[0] text-[#f87171] max-[760px]:text-left">Bad Against</b>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_86px_minmax(0,1fr)] items-stretch gap-3 max-[760px]:grid-cols-1">
                <div className="flex min-w-0 snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {matchups.good.length ? matchups.good.map(item => <MatchupCard key={item.stat.id} type="good" {...item} />) : <div className={`${rowSurfaceClass} grid min-h-[104px] flex-1 place-items-center px-3 text-center text-[12px] font-bold text-[rgba(245,244,241,0.34)]`}>{matchupEmptyText}</div>}
                </div>
                <Link href="/brawlers" className={`${rowSurfaceClass} grid place-items-center content-center gap-1 text-[13px] font-[850] text-[#f5f4f1] no-underline hover:border-[rgba(124,92,255,0.28)] max-[760px]:min-h-[54px]`}>
                  <span className="text-[30px] font-semibold leading-none">+</span>
                  Full List
                </Link>
                <div className="flex min-w-0 snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                  {matchups.bad.length ? matchups.bad.map(item => <MatchupCard key={item.stat.id} type="bad" {...item} delta={Math.abs(item.delta)} />) : <div className={`${rowSurfaceClass} grid min-h-[104px] flex-1 place-items-center px-3 text-center text-[12px] font-bold text-[rgba(245,244,241,0.34)]`}>{badMatchupEmptyText}</div>}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
