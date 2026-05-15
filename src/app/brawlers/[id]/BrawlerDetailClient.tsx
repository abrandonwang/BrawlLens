"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bolt } from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import TierlistSubNav from "@/components/TierlistSubNav"
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
    <div className="bl-bd-stat">
      <strong style={color ? { color } : undefined}>{value}</strong>
      <span>{label}</span>
      {detail && <em>{detail}</em>}
    </div>
  )
}

function AbilityBadge({ ability }: { ability: AbilityItem }) {
  return (
    <div className={`bl-bd-ability bl-bd-ability-${ability.tone}`}>
      <div className="bl-bd-ability-icon" aria-label={ability.name}>
        {ability.iconUrl ? (
          <BrawlImage src={ability.iconUrl} alt={ability.name} width={34} height={34} className="size-full object-cover" sizes="34px" />
        ) : (
          <Bolt size={18} strokeWidth={2.5} />
        )}
        <span>{ability.label}</span>
      </div>
      <div className="bl-bd-ability-tip" role="tooltip">
        <h3>{ability.name}</h3>
        <p>{ability.description}</p>
      </div>
    </div>
  )
}

function BuildCell({ title, items, note }: { title: string; items: AbilityItem[]; note: string }) {
  return (
    <div className="bl-bd-build">
      <div className="bl-bd-build-head">
        <b>{title}</b>
        <span>{note}</span>
      </div>
      <div className="bl-bd-build-icons">
        {items.length ? items.map(item => (
          <div key={`${title}-${item.key}`} className="bl-bd-mini-icon" title={item.name}>
            {item.iconUrl ? (
              <BrawlImage src={item.iconUrl} alt={item.name} width={34} height={34} className="size-full object-cover" sizes="34px" />
            ) : (
              <Bolt size={18} />
            )}
          </div>
        )) : <span className="bl-bd-muted">No kit data</span>}
      </div>
    </div>
  )
}

function MapRow({ map }: { map: BrawlerStats["maps"][number] }) {
  return (
    <Link href={`/meta/${encodeURIComponent(map.map)}`} className="bl-bd-map-row">
      <span>
        <b>{map.map}</b>
        <em>{map.mode}</em>
      </span>
      <strong style={{ color: winRateColor(map.winRate) }}>{formatPercent(map.winRate)}</strong>
      <small>{compactNumber(map.picks)} picks</small>
    </Link>
  )
}

function MatchupCard({ stat, delta, type }: { stat: CatalogStat; delta: number; type: "good" | "bad" }) {
  return (
    <Link href={`/brawlers/${stat.id}`} className={`bl-bd-match-card bl-bd-match-card-${type}`}>
      <BrawlImage src={brawlerIconUrl(stat.id)} alt={stat.name} width={116} height={128} className="bl-bd-match-img" sizes="116px" />
      <div className="bl-bd-match-copy">
        <b>{formatBrawlerName(stat.name)}</b>
        <strong>{type === "good" ? "+" : "-"}{Math.abs(delta).toFixed(1)}%</strong>
        <span>{compactNumber(stat.picks)} games</span>
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
  const topMaps = stats?.maps?.slice(0, 2) ?? []
  const topModes = stats?.modes?.slice(0, 2) ?? []
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

  const summary = selectedWinRate == null
    ? `${formatBrawlerName(brawler.name)} does not have enough tracked map data yet.`
    : `${formatBrawlerName(brawler.name)} is ${rankSuffix(displayRank)} with ${formatPercent(selectedWinRate)} across ${compactNumber(selectedPicks)} analyzed games${bestMapName ? `, peaking on ${bestMapName}` : ""}.`

  return (
    <main className="bl-bd-shell">
      <TierlistSubNav active="brawlers" />

      <section className="bl-bd-hero">
        <div className="bl-bd-hero-inner">
          <div className="bl-bd-identity">
            <div className="bl-bd-avatar">
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

            <div className="bl-bd-title-block">
              <h1><span>{formatBrawlerName(brawler.name)}</span> Build, Stats, Season 50</h1>
              <div className="bl-bd-abilities" aria-label={`${brawler.name} abilities`}>
                {abilities.length ? abilities.map(ability => <AbilityBadge key={ability.key} ability={ability} />) : (
                  <span className="bl-bd-muted">Ability data unavailable</span>
                )}
              </div>
            </div>

            <p className="bl-bd-summary">{summary}</p>
          </div>
        </div>
      </section>

      <div className="bl-lb-frame bl-bd-frame">
        <section className="bl-lb-board bl-bd-board">
          {loading ? (
            <div className="bl-bd-loading">Loading {formatBrawlerName(brawler.name)} stats...</div>
          ) : (
            <>
              <section className="bl-bd-stat-strip" aria-label={`${brawler.name} stat summary`}>
                <StatMetric value={tier?.label ?? "-"} label="tier" color={tier?.color} />
                <StatMetric value={formatRank(displayRank, rankable.length)} label="rank" />
                <StatMetric value={formatPercent(selectedWinRate)} label="winrate" color={selectedWinRate != null ? winRateColor(selectedWinRate) : undefined} />
                <StatMetric value={formatPercent(pickRate)} label="pickrate" />
                <StatMetric value={compactNumber(selectedPicks)} label="games analyzed" />
              </section>

              <section className="bl-bd-main-grid">
                <div className="bl-bd-panel bl-bd-build-panel">
                  <div className="bl-bd-panel-head">
                    <span>Recommended Builds</span>
                    <small>from available kit data</small>
                  </div>
                  <div className="bl-bd-build-grid">
                    {builds.map(build => <BuildCell key={build.title} {...build} />)}
                  </div>
                  {hyper && (
                    <div className="bl-bd-hyper-note">
                      <Bolt size={14} />
                      <span><b>{hyper.name}</b> adds {hyper.speedBoost}% speed, {hyper.damageBoost}% damage, and {hyper.shieldBoost}% shield during Hypercharge.</span>
                    </div>
                  )}
                </div>

                <div className="bl-bd-panel">
                  <div className="bl-bd-panel-head">
                    <span>Best Maps</span>
                    <small>{bestMode ? bestMode.mode : brawler.class?.name ?? "tracked modes"}</small>
                  </div>
                  <div className="bl-bd-map-list">
                    {topMaps.length ? topMaps.map(map => <MapRow key={`${map.map}-${map.mode}`} map={map} />) : (
                      <div className="bl-bd-empty">No map sample yet.</div>
                    )}
                  </div>
                </div>

                <div className="bl-bd-panel">
                  <div className="bl-bd-panel-head">
                    <span>Mode Profile</span>
                    <small>{compactNumber(selectedPicks)} games</small>
                  </div>
                  <div className="bl-bd-mode-list">
                    {topModes.length ? topModes.map(mode => (
                      <div key={mode.mode} className="bl-bd-mode-row">
                        <span>{mode.mode}</span>
                        <strong style={{ color: winRateColor(mode.winRate) }}>{formatPercent(mode.winRate)}</strong>
                        <em>{compactNumber(mode.picks)}</em>
                      </div>
                    )) : <div className="bl-bd-empty">No mode sample yet.</div>}
                  </div>
                </div>
              </section>

              <section className="bl-bd-matchups">
                <div className="bl-bd-match-head">
                  <span>Meta Matchups as {formatBrawlerName(brawler.name)}</span>
                  <div className="bl-bd-match-tools">
                    <button type="button" className="bl-bd-match-tab bl-bd-match-tab-active">Matchups</button>
                  </div>
                </div>
                <div className="bl-bd-match-labels">
                  <b>Good Against</b>
                  <span>Compared against brawlers at 50+ tracked games</span>
                  <b>Bad Against</b>
                </div>
                <div className="bl-bd-match-strip">
                  <div className="bl-bd-match-side">
                    {matchups.good.length ? matchups.good.map(item => <MatchupCard key={item.stat.id} type="good" {...item} />) : <div className="bl-bd-empty">{matchupEmptyText}</div>}
                  </div>
                  <Link href="/brawlers" className="bl-bd-full-list">
                    <span>+</span>
                    Full List
                  </Link>
                  <div className="bl-bd-match-side">
                    {matchups.bad.length ? matchups.bad.map(item => <MatchupCard key={item.stat.id} type="bad" {...item} delta={Math.abs(item.delta)} />) : <div className="bl-bd-empty">{badMatchupEmptyText}</div>}
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
