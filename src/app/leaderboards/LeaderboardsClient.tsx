"use client"

import { useState, useEffect } from "react"
import { Search, Trophy, ArrowRight, ChevronLeft, ChevronRight, Crown } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  updated_at: string
}

interface RegionData {
  code: string
  label: string
  players: Player[]
}

const PAGE_SIZE = 20

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

const CATEGORIES = [
  { label: "Players", href: "/leaderboards/players" },
  { label: "Clubs",   href: "/leaderboards/clubs" },
  { label: "Brawlers", href: "/leaderboards/brawlers" },
]

export default function LeaderboardsClient({ allData }: { allData: RegionData[]; updatedAt?: string | null }) {
  const pathname = usePathname()
  const [activeRegion, setActiveRegion] = useState<string>("global")
  const [search, setSearch] = useState("")
  const [pageByRegion, setPageByRegion] = useState<Record<string, number>>({})

  useEffect(() => { setPageByRegion({}) }, [search, activeRegion])

  const regionData = allData.find(r => r.code === activeRegion)
  const players = (regionData?.players ?? []).filter(
    p =>
      p.player_name.toLowerCase().includes(search.toLowerCase()) ||
      p.player_tag.toLowerCase().includes(search.toLowerCase())
  )

  const page = pageByRegion[activeRegion] ?? 0
  const totalPages = Math.ceil(players.length / PAGE_SIZE)
  const paginated = players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const podium = players.slice(0, 3)
  const tableRows = paginated.filter(p => p.rank > 3)

  function setPage(p: number) {
    setPageByRegion(prev => ({ ...prev, [activeRegion]: p }))
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 80px" }}>

      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {CATEGORIES.map(c => (
          <Link
            key={c.href}
            href={c.href}
            className="bl-btn bl-btn-sm"
            style={pathname === c.href ? { background: "var(--elev)", borderColor: "var(--line-2)", color: "var(--ink)" } : {}}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <h1 className="bl-h-display">Players</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="bl-input" style={{ width: 220 }}>
            <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search players…" />
          </div>
          <div className="bl-seg">
            {allData.map((r) => (
              <button key={r.code} onClick={() => setActiveRegion(r.code)} className={activeRegion === r.code ? "on" : ""}>
                {r.code === "global" ? "Global" : r.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--line)", marginBottom: 32 }} />

      {players.length === 0 ? (
        <p className="bl-caption" style={{ padding: "48px 0", textAlign: "center" }}>No data yet.</p>
      ) : (
        <>
          {!search && page === 0 && podium.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12, marginBottom: 32 }} className="max-sm:grid-cols-1">
              {podium.map((p, i) => {
                const isFirst = i === 0
                return (
                  <Link
                    key={p.player_tag}
                    href={`/player/${p.player_tag.replace("#", "")}`}
                    className={`bl-card ${isFirst ? "bl-hc-hover" : ""}`}
                    style={{
                      padding: 24,
                      textDecoration: "none",
                      borderColor: isFirst ? "rgba(255,212,0,0.25)" : undefined,
                      background: isFirst
                        ? "linear-gradient(180deg, color-mix(in srgb, var(--accent) 7%, var(--panel)) 0%, var(--panel) 70%)"
                        : undefined,
                    }}
                  >
                    {isFirst && (
                      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 300px 150px at 80% -20%, rgba(255,212,0,0.18), transparent 60%)", pointerEvents: "none", borderRadius: "inherit" }} />
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <span className={`bl-num ${isFirst ? "gold-text" : ""}`} style={{ fontSize: 42, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1, color: isFirst ? undefined : "var(--ink-3)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {isFirst && <Crown size={20} style={{ color: "var(--accent)", filter: "drop-shadow(0 0 6px var(--accent))" }} />}
                        </div>
                        <div className="bl-h2" style={{ marginBottom: 2 }}>{p.player_name}</div>
                        <div className="bl-mono bl-caption">{p.player_tag}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Trophy size={13} style={{ color: "var(--accent)" }} />
                          <span className={`bl-num ${isFirst ? "gold-text" : ""}`} style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
                            {formatNum(p.trophies)}
                          </span>
                        </div>
                        <span className="bl-caption">trophies</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="bl-body" style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.club_name ?? "—"}</span>
                      <span className="bl-tag">{regionData?.code?.toUpperCase()}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          <div className="bl-card" style={{ borderRadius: 14, overflow: "hidden", padding: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "52px 1fr auto auto 24px", gap: 16, padding: "11px 20px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>#</span>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Player</span>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }} >Club</span>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Trophies</span>
              <span />
            </div>

            {tableRows.map((p, i) => (
              <Link
                key={p.player_tag}
                href={`/player/${p.player_tag.replace("#", "")}`}
                style={{ display: "grid", gridTemplateColumns: "52px 1fr auto auto 24px", gap: 16, alignItems: "center", padding: "13px 20px", borderBottom: i < tableRows.length - 1 ? "1px solid var(--line)" : "none", textDecoration: "none", transition: "background 0.13s" }}
                className="row-hover"
              >
                <span className="bl-num" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-3)" }}>
                  {String(p.rank).padStart(2, "0")}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.player_name}</div>
                  <div className="bl-mono bl-caption" style={{ color: "var(--ink-4)" }}>{p.player_tag}</div>
                </div>

                <span className="bl-body" style={{ fontSize: 12.5, color: "var(--ink-3)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.club_name ?? "—"}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  <Trophy size={12} style={{ color: "var(--accent)", opacity: 0.7 }} />
                  <span className="bl-num" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>
                    {formatNum(p.trophies)}
                  </span>
                </div>

                <ArrowRight size={13} style={{ color: "var(--ink-4)" }} />
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 20 }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.3 : 1, color: "var(--ink-3)", transition: "all 0.14s" }}
              >
                <ChevronLeft size={13} />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  style={{
                    width: 30,
                    height: 30,
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: idx === page ? "none" : "1px solid var(--line)",
                    background: idx === page ? "var(--accent)" : "transparent",
                    color: idx === page ? "#0A0A0B" : "var(--ink-3)",
                    cursor: "pointer",
                    transition: "all 0.14s",
                    fontFamily: "inherit",
                  }}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages - 1}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.3 : 1, color: "var(--ink-3)", transition: "all 0.14s" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}

          <div style={{ marginTop: 56, border: "1px solid var(--line)", borderRadius: 14, background: "var(--panel-2)", padding: 32, maxWidth: 600, margin: "56px auto 0", textAlign: "center" }}>
            <p className="bl-eyebrow" style={{ marginBottom: 14 }}>About Player Rankings</p>
            <p className="bl-body" style={{ color: "var(--ink-3)", lineHeight: 1.65 }}>
              Player rankings reflect the top 200 trophy earners across six regions: Global, United States, Korea, Brazil, Germany, and Japan. Rankings update every 30 minutes using real-time data. Trophies shown represent a player&apos;s current season total.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
