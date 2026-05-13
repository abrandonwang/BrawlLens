"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import BrandMark from "@/components/BrandMark"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import { formatTrophies } from "@/lib/format"
import { leaderboardRegionShort } from "@/lib/leaderboardRegions"
import { getModeName } from "@/lib/modes"

type LandingPlayer = {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  iconId?: number | null
}

type LandingRegion = {
  code: string
  label: string
  players: LandingPlayer[]
}

type BrawlerStats = {
  id: number
  name: string
  picks: number
  wins: number
  winRate: number | null
}

type TierPreviewRow = {
  id: number
  name: string
  tier: { label: string; color: string }
  winRate: number | null
  pickRate: number
}

type ModeInfo = {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

type MapBrawlerPreview = {
  brawlerId: number
  name: string
  picks: number
  winRate: number
}

type MapPreviewRow = {
  name: string
  mode: string
  battles: number
  best: MapBrawlerPreview | null
}

function getPreviewTier(winRate: number | null | undefined, picks: number) {
  if (winRate == null || Number.isNaN(winRate) || picks < 10) return { label: "-", color: "rgba(247, 244, 237, 0.46)" }
  if (winRate >= 58) return { label: "S+", color: "#f0d373" }
  if (winRate >= 54) return { label: "S", color: "#b99cff" }
  if (winRate >= 51) return { label: "A", color: "#8bd7ff" }
  if (winRate >= 48) return { label: "B", color: "#cbd0dc" }
  if (winRate >= 45) return { label: "C", color: "#ff9f6e" }
  return { label: "D", color: "#ef6a6a" }
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(1)}%`
}

function cleanTag(tag: string) {
  return tag.replace(/^#/, "")
}

function playerHref(tag: string) {
  return `/player/${encodeURIComponent(cleanTag(tag))}`
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "?").toUpperCase()
}

export default function LandingClient() {
  const [leaderRegions, setLeaderRegions] = useState<LandingRegion[]>([])
  const [activeLeaderboardRegion, setActiveLeaderboardRegion] = useState("")
  const [tierPreview, setTierPreview] = useState<TierPreviewRow[]>([])
  const [mapPreview, setMapPreview] = useState<MapPreviewRow[]>([])
  const [landingQuery, setLandingQuery] = useState("")
  const activeRegion = leaderRegions.find(region => region.code === activeLeaderboardRegion) ?? leaderRegions[0]

  useEffect(() => {
    document.documentElement.classList.add("landing-bg", "home-landing-bg")
    return () => document.documentElement.classList.remove("landing-bg", "home-landing-bg")
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadLeaderboards() {
      try {
        const response = await fetch("/api/leaderboards/top?limit=5&regions=US,JP,KR&icons=1")
        if (!response.ok) return
        const payload = await response.json() as { regions?: LandingRegion[] }
        const regions = payload.regions ?? []
        const preferred = ["US", "JP", "KR"]
        const selected: LandingRegion[] = []

        for (const code of preferred) {
          const match = regions.find(region => region.code.toUpperCase() === code)
          if (match?.players.length) selected.push(match)
        }

        for (const region of regions) {
          if (selected.length >= 3) break
          if (region.code === "global" || !region.players.length || selected.some(item => item.code === region.code)) continue
          selected.push(region)
        }

        if (selected.length < 3) {
          for (const region of regions) {
            if (selected.length >= 3) break
            if (!region.players.length || selected.some(item => item.code === region.code)) continue
            selected.push(region)
          }
        }

        if (cancelled) return
        setLeaderRegions(selected.slice(0, 3))
        setActiveLeaderboardRegion(current =>
          current && selected.some(region => region.code === current)
            ? current
            : selected[0]?.code ?? "",
        )
      } catch {
        if (!cancelled) setLeaderRegions([])
      }
    }

    loadLeaderboards()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTierPreview() {
      try {
        const response = await fetch("/api/brawlers/stats")
        if (!response.ok) return
        const payload = await response.json() as { stats?: Record<string, BrawlerStats> }
        const stats = Object.values(payload.stats ?? {})
        const totalPicks = stats.reduce((sum, stat) => sum + (Number(stat.picks) || 0), 0)
        const rows = stats
          .map(stat => {
            const picks = Number(stat.picks) || 0
            const winRate = stat.winRate == null ? null : Number(stat.winRate)
            const pickRate = totalPicks > 0 ? (picks / totalPicks) * 100 : 0
            return {
              id: Number(stat.id),
              name: stat.name,
              tier: getPreviewTier(winRate, picks),
              winRate,
              pickRate,
            }
          })
          .filter(row => row.winRate != null && row.pickRate >= 1)
          .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
          .slice(0, 5)

        if (!cancelled) setTierPreview(rows)
      } catch {
        if (!cancelled) setTierPreview([])
      }
    }

    loadTierPreview()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMapPreview() {
      try {
        const response = await fetch("/api/meta")
        if (!response.ok) return
        const payload = await response.json() as { modes?: ModeInfo[] }
        const maps = (payload.modes ?? [])
          .filter(mode => mode.mode.toLowerCase() !== "unknown")
          .flatMap(mode => mode.maps
            .filter(map => map.name.toLowerCase() !== "unknown")
            .map(map => ({ name: map.name, mode: mode.mode, battles: Number(map.battles) || 0 })),
          )
          .sort((a, b) => b.battles - a.battles)
          .slice(0, 5)

        const rows = await Promise.all(maps.map(async map => {
          try {
            const mapResponse = await fetch(`/api/meta?map=${encodeURIComponent(map.name)}`)
            if (!mapResponse.ok) return { ...map, best: null }
            const mapPayload = await mapResponse.json() as { brawlers?: MapBrawlerPreview[] }
            const best = (mapPayload.brawlers ?? [])
              .filter(brawler => brawler.picks >= 20 && Number.isFinite(brawler.winRate))
              .sort((a, b) => b.winRate - a.winRate)[0] ?? null
            return { ...map, best }
          } catch {
            return { ...map, best: null }
          }
        }))

        if (!cancelled) setMapPreview(rows)
      } catch {
        if (!cancelled) setMapPreview([])
      }
    }

    loadMapPreview()
    return () => {
      cancelled = true
    }
  }, [])

  function openSearch(query = "") {
    window.dispatchEvent(new CustomEvent("brawllens:open-search", { detail: { query } }))
  }

  function submitLandingSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    openSearch(landingQuery)
  }

  return (
    <main className="bl-landing-shell">
      <section className="bl-landing-stage" aria-label="BrawlLens search">
        <div className="bl-landing-brand-wrap">
          <BrandMark size="md" className="bl-landing-wordmark" />
        </div>

        <div className="bl-landing-track">
          <p className="bl-landing-line">Real ladder data for players, brawlers, maps, and upgrade decisions.</p>
          <form className={`bl-landing-search-form${landingQuery ? " has-value" : ""}`} onSubmit={submitLandingSearch}>
            <input
              value={landingQuery}
              onChange={event => setLandingQuery(event.target.value)}
              aria-label="Search BrawlLens"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="bl-landing-search-placeholder" aria-hidden="true">
              Type a player tag, brawler, map, or club...
            </span>
            <button type="submit" aria-label="Search">
              <ArrowRight size={21} strokeWidth={2.8} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <section className="bl-landing-showcase" aria-label="BrawlLens previews">
        <div className="bl-landing-preview-card bl-landing-leader-card">
          <div className="bl-preview-tabs" aria-label="Leaderboard regions">
            {leaderRegions.map(region => (
              <button
                key={region.code}
                type="button"
                className={region.code === activeRegion?.code ? "is-active" : ""}
                onClick={() => setActiveLeaderboardRegion(region.code)}
              >
                {leaderboardRegionShort(region.code)}
              </button>
            ))}
          </div>

          <div className="bl-preview-head bl-preview-head-leaders">
            <span>Player</span>
            <span>Trophies</span>
            <span>Rank</span>
          </div>

          <div className="bl-preview-rows">
            {(activeRegion?.players ?? []).map(row => (
              <Link key={row.player_tag} href={playerHref(row.player_tag)} className="bl-preview-row bl-preview-leader-row bl-preview-player-link">
                <span className="bl-preview-avatar">
                  {row.iconId ? (
                    <BrawlImage src={profileIconUrl(row.iconId)} alt="" width={30} height={30} sizes="30px" />
                  ) : initials(row.player_name)}
                </span>
                <span className="bl-preview-player">
                  <strong>{row.player_name}</strong>
                  <small>{row.club_name || `#${cleanTag(row.player_tag)}`}</small>
                </span>
                <strong className="bl-preview-trophies">{formatTrophies(Number(row.trophies) || 0)}</strong>
                <strong className="bl-preview-region-rank">#{row.rank}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="bl-landing-preview-card bl-landing-tier-card">
          <Link href="/brawlers" className="bl-preview-title">Season 50 Tierlist &amp; Builds <ArrowRight size={17} strokeWidth={2.7} /></Link>
          <div className="bl-preview-head bl-preview-head-tier">
            <span>Brawler</span>
            <span>Tier</span>
            <span>Winrate</span>
            <span>Pickrate</span>
          </div>

          <div className="bl-preview-rows">
            {tierPreview.map(row => (
              <div key={row.id} className="bl-preview-row bl-preview-tier-row">
                <Link href={`/brawlers/${row.id}`} className="bl-preview-brawler bl-preview-brawler-link">
                  <BrawlImage src={brawlerIconUrl(row.id)} alt="" width={44} height={44} sizes="44px" />
                  <strong>{row.name}</strong>
                </Link>
                <strong className="bl-preview-tier" style={{ color: row.tier.color }}>{row.tier.label}</strong>
                <span className="bl-preview-rate">
                  <strong>{formatPercent(row.winRate)}</strong>
                </span>
                <strong className="bl-preview-pick">{formatPercent(row.pickRate)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="bl-landing-preview-card bl-landing-map-card">
          <Link href="/meta" className="bl-preview-title">Map Meta Snapshot <ArrowRight size={17} strokeWidth={2.7} /></Link>
          <div className="bl-preview-head bl-preview-head-map">
            <span>Map</span>
            <span>Mode</span>
            <span>Best</span>
            <span>WR</span>
          </div>

          <div className="bl-preview-rows">
            {mapPreview.map(row => (
              <Link key={`${row.mode}-${row.name}`} href={mapHref(row.name)} className="bl-preview-row bl-preview-map-row">
                <span className="bl-preview-map-name">
                  <strong>{row.name}</strong>
                  <small>{row.battles.toLocaleString()} battles</small>
                </span>
                <span className="bl-preview-mode">{getModeName(row.mode)}</span>
                <span className="bl-preview-map-brawler">
                  {row.best ? (
                    <>
                      <BrawlImage src={brawlerIconUrl(row.best.brawlerId)} alt="" width={30} height={30} sizes="30px" />
                      <strong>{row.best.name}</strong>
                    </>
                  ) : "-"}
                </span>
                <strong className="bl-preview-map-win">{row.best ? `${row.best.winRate.toFixed(1)}%` : "-"}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
