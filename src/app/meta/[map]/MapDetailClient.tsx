"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"

function getTierInfo(winRate: number) {
  if (winRate >= 58) return { label: "S", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }
  if (winRate >= 54) return { label: "A", color: "#FB923C", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" }
  if (winRate >= 50) return { label: "B", color: "#FACC15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" }
  if (winRate >= 46) return { label: "C", color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" }
  return { label: "D", color: "var(--ink-4)", bg: "var(--panel-2)", border: "var(--line)" }
}

function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}

function getBrawlerImage(brawlerId: number): string {
  return `https://cdn.brawlify.com/brawlers/borderless/${brawlerId}.png`
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

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <h1 className="bl-h-display" style={isLive ? { color: "#49D47E" } : {}}>{mapName}</h1>
          </div>
          <span className="bl-caption">{totalBattles.toLocaleString()} battles</span>
        </div>

        {imageUrl && (
          <div className="bl-card" style={{ flexShrink: 0, width: 120, padding: 0, overflow: "hidden" }}>
            <img src={imageUrl} alt={mapName} style={{ width: "100%", height: "auto", display: "block" }} />
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
        <div style={{ textAlign: "center", padding: "60px 0", border: "1px dashed var(--line-2)", borderRadius: 14 }}>
          <p className="bl-body" style={{ color: "var(--ink-4)" }}>No brawlers match your filters.</p>
        </div>
      ) : (
        <div className="bl-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 120px 70px 70px 40px", gap: 16, padding: "10px 20px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
            <span />
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Brawler</span>
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Win Rate</span>
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Wins</span>
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Picks</span>
            <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>Tier</span>
          </div>

          {filtered.map((brawler, i) => {
            const tier = getTierInfo(brawler.winRate)
            return (
              <div
                key={brawler.brawlerId}
                className="row-hover"
                style={{ display: "grid", gridTemplateColumns: "44px 1fr 120px 70px 70px 40px", gap: 16, alignItems: "center", padding: "12px 20px", borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--panel-2)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  <img
                    src={getBrawlerImage(brawler.brawlerId)}
                    alt={brawler.name}
                    style={{ width: 32, height: 32, objectFit: "contain" }}
                    loading="lazy"
                  />
                </div>

                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {formatBrawlerName(brawler.name)}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="bl-num" style={{ fontSize: 13.5, fontWeight: 600, color: tier.color, flexShrink: 0 }}>
                    {brawler.winRate.toFixed(1)}%
                  </span>
                  <div style={{ flex: 1, height: 3, background: "var(--line-2)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${getBarWidth(brawler.winRate)}%`, background: tier.color, opacity: 0.7, borderRadius: 99, transition: "width 0.4s ease" }} />
                  </div>
                </div>

                <span className="bl-num" style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "right" }}>
                  {brawler.wins >= 1000 ? `${(brawler.wins / 1000).toFixed(1)}k` : brawler.wins}
                </span>

                <span className="bl-num" style={{ fontSize: 13, color: "var(--ink-3)", textAlign: "right" }}>
                  {brawler.picks >= 1000 ? `${(brawler.picks / 1000).toFixed(1)}k` : brawler.picks}
                </span>

                <div style={{ display: "flex", justifyContent: "center" }}>
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
