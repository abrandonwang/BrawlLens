"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"

function getTierInfo(winRate: number) {
  if (winRate >= 58) return { label: "S", color: "#DC2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.26)" }
  if (winRate >= 54) return { label: "A", color: "#C2410C", bg: "rgba(194,65,12,0.10)", border: "rgba(194,65,12,0.24)" }
  if (winRate >= 50) return { label: "B", color: "#A16207", bg: "rgba(161,98,7,0.10)", border: "rgba(161,98,7,0.24)" }
  if (winRate >= 46) return { label: "C", color: "#2563EB", bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.24)" }
  return { label: "D", color: "var(--ink-4)", bg: "var(--panel-2)", border: "var(--line)" }
}

function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}

function formatBrawlerName(name: string): string {
  return name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
}

interface Props {
  mapName: string
  imageUrl: string | null
  totalBattles: number
  brawlers: BrawlerStat[]
  isLive: boolean
}

export default function MapDetailClient({ mapName, imageUrl, totalBattles, brawlers, isLive }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [minPicks, setMinPicks] = useState(10)
  const [sortBy, setSortBy] = useState<SortKey>("picks")

  const filtered = useMemo(() => {
    return brawlers
      .filter(b => {
        if (b.picks < minPicks) return false
        if (searchQuery && !formatBrawlerName(b.name).toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [brawlers, searchQuery, minPicks, sortBy])

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "picks", label: "Picks" },
    { key: "winRate", label: "Win Rate" },
    { key: "wins", label: "Wins" },
  ]

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 40px 80px" }}>

      <Link href="/meta" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-4)", textDecoration: "none", marginBottom: 28, transition: "color 0.14s" }}>
        <ArrowLeft size={12} />
        Maps
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLive && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--win-soft)", border: "1px solid var(--win-line)", borderRadius: 99, padding: "3px 10px", marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--win)", flexShrink: 0, boxShadow: "0 0 6px var(--win)" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--win)", letterSpacing: "0.1em" }}>LIVE</span>
            </div>
          )}
          <h1 className="bl-h-display">{mapName}</h1>
          <span className="bl-caption" style={{ marginTop: 4, display: "block" }}>{totalBattles.toLocaleString()} battles</span>
        </div>

        {imageUrl && (
          <div style={{ flexShrink: 0, height: 160, display: "flex", alignItems: "center" }}>
            <BrawlImage
              src={imageUrl}
              alt={mapName}
              width={260}
              height={160}
              style={{ height: "100%", width: "auto", maxWidth: 260, borderRadius: 12, display: "block", objectFit: "contain" }}
              sizes="260px"
            />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div className="bl-input" style={{ width: 220 }}>
          <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
          <input placeholder="Search brawler…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="bl-seg">
          {sortOptions.map(opt => (
            <button key={opt.key} onClick={() => setSortBy(opt.key)} className={sortBy === opt.key ? "on" : ""}>{opt.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="bl-caption">Min picks</span>
          <select value={minPicks} onChange={e => setMinPicks(Number(e.target.value))} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 8px", fontSize: 12, color: "var(--ink)", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
            <option value={5}>5+</option>
            <option value={10}>10+</option>
            <option value={25}>25+</option>
            <option value={50}>50+</option>
            <option value={100}>100+</option>
          </select>
        </div>

        <span className="bl-caption" style={{ marginLeft: "auto" }}>{filtered.length} brawlers</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No brawlers match"
          description="Your search or minimum pick filter removed every brawler from this map."
          action={<StateButton onClick={() => { setSearchQuery(""); setMinPicks(5) }}>Clear filters</StateButton>}
          secondary={<StateLink href="/meta">All maps</StateLink>}
        />
      ) : (
        <div className="bl-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="map-brawler-row map-brawler-header" style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 60px 60px 36px", gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
            <span />
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Brawler</span>
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Win Rate</span>
            <span className="bl-caption map-brawler-hide" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Wins</span>
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Picks</span>
            <span className="bl-caption map-brawler-hide" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>Tier</span>
          </div>

          {filtered.map((brawler, i) => {
            const tier = getTierInfo(brawler.winRate)
            return (
              <div
                key={brawler.brawlerId}
                className="map-brawler-row row-hover"
                style={{ display: "grid", gridTemplateColumns: "36px 1fr 120px 60px 60px 36px", gap: 12, padding: "12px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <div className="map-brawler-avatar" style={{ width: 36, height: 36, borderRadius: 8, background: "var(--panel-2)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  <BrawlImage
                    src={brawlerIconUrl(brawler.brawlerId)}
                    alt={brawler.name}
                    width={32}
                    height={32}
                    style={{ width: 32, height: 32, objectFit: "contain" }}
                    loading="lazy"
                    sizes="32px"
                  />
                </div>

                <span className="map-brawler-name" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {formatBrawlerName(brawler.name)}
                </span>

                <div className="map-brawler-winrate" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="bl-num" style={{ fontSize: 13.5, fontWeight: 600, color: tier.color, flexShrink: 0 }}>
                    {brawler.winRate.toFixed(1)}%
                  </span>
                  <div style={{ flex: 1, height: 3, background: "var(--line-2)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${getBarWidth(brawler.winRate)}%`, background: tier.color, opacity: 0.7, borderRadius: 99, transition: "width 0.4s ease" }} />
                  </div>
                </div>

                <span className="bl-num map-brawler-hide" style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "right" }}>
                  {brawler.wins >= 1000 ? `${(brawler.wins / 1000).toFixed(1)}k` : brawler.wins}
                </span>

                <span className="bl-num map-brawler-picks" style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "right" }}>
                  {brawler.picks >= 1000 ? `${(brawler.picks / 1000).toFixed(1)}k` : brawler.picks}
                </span>

                <div className="map-brawler-hide" style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, fontSize: 10, fontWeight: 800, borderRadius: 6, color: tier.color, background: tier.bg, border: `1px solid ${tier.border}` }}>
                    {tier.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
