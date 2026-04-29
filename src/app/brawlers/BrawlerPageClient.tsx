"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react"
import BrawlerCatalog from "@/components/BrawlerCatalog"
import { HYPERCHARGES } from "@/data/hypercharges"
import type { Brawler } from "./page"

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

function cleanDesc(text: string) {
  return text.replace(/<![\w.]+>/g, "X")
}

function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

function winRateColor(wr: number) {
  if (wr >= 55) return "#49D47E"
  if (wr >= 50) return "#FACC15"
  if (wr >= 45) return "var(--ink-3)"
  return "#F87171"
}

interface BrawlerStats {
  totalPicks: number
  avgWinRate: number | null
  maps: { map: string; mode: string; picks: number; winRate: number }[]
  modes: { mode: string; picks: number; winRate: number }[]
}

type Tab = "overview" | "maps" | "abilities"

export default function BrawlerPageClient({ brawlers }: { brawlers: Brawler[] }) {
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Brawler | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [stats, setStats] = useState<BrawlerStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId) {
      const match = brawlers.find(b => String(b.id) === openId)
      if (match) setSelected(match)
    }
  }, [searchParams, brawlers])

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setSelected(null)
    setStats(null)
    setTab("overview")
  }, [])

  const updateScrollState = useCallback(() => {
    const el = filtersRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = filtersRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState)
    window.addEventListener("resize", updateScrollState)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [brawlers, updateScrollState])

  function scrollFilters(dir: "left" | "right") {
    filtersRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" })
  }

  useEffect(() => {
    if (!selected) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") close() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected, close])
  useEffect(() => {
    if (!selected) return
    setStats(null)
    setStatsLoading(true)
    fetch(`/api/brawler-stats?id=${selected.id}`)
      .then(r => r.json())
      .then(d => { setStats(d); setStatsLoading(false) })
      .catch(() => setStatsLoading(false))
  }, [selected])

  const rarities = RARITY_ORDER
    .map(name => ({ name, color: sanitizeColor(brawlers.find(b => b.rarity.name === name)?.rarity.color ?? "#888") }))
    .filter(r => brawlers.some(b => b.rarity.name === r.name))

  return (
    <>
      <div className="roster-page">

        <div className="roster-controls">
          <div className="roster-search" style={{ display: "flex", alignItems: "center", gap: 8, height: 40, padding: "0 14px", background: "var(--panel)", borderRadius: 10 }}>
            <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brawlers" style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", fontSize: 13, fontFamily: "inherit", width: "100%" }} />
          </div>

          <div className="roster-filters-wrap">
            {canScrollLeft && (
              <button onClick={() => scrollFilters("left")} style={{ position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1, display: "flex", alignItems: "center", background: "linear-gradient(to right, var(--bg) 50%, transparent)", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: "0 14px 0 2px" }}>
                <ChevronLeft size={14} />
              </button>
            )}
            <div className="roster-filters" ref={filtersRef}>
              <div className="bl-seg" style={{ flexShrink: 0 }}>
                <button onClick={() => setActiveRarity(null)} className={!activeRarity ? "on" : ""}>All</button>
                {rarities.map(r => (
                  <button
                    key={r.name}
                    onClick={() => setActiveRarity(activeRarity === r.name ? null : r.name)}
                    className={activeRarity === r.name ? "on" : ""}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
            {canScrollRight && (
              <button onClick={() => scrollFilters("right")} style={{ position: "absolute", right: 0, top: 0, bottom: 0, zIndex: 1, display: "flex", alignItems: "center", background: "linear-gradient(to left, var(--bg) 50%, transparent)", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: "0 2px 0 14px" }}>
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        <BrawlerCatalog brawlers={brawlers} activeRarity={activeRarity} search={search} onSelect={b => { setSelected(b); setTab("overview") }} />
      </div>
      {selected && (() => {
        const color = sanitizeColor(selected.rarity.color)
        const hc = HYPERCHARGES[selected.id]

        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={close}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 520, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--line-2)", borderRadius: 20, boxShadow: "0 32px 80px -20px rgba(0,0,0,0.5)" }}
            >
              <div style={{ padding: "20px 20px 0", flexShrink: 0, position: "relative" }}>
                <button onClick={close} style={{ position: "absolute", top: 20, right: 20, width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 8, background: "none", cursor: "pointer", color: "var(--ink-4)", flexShrink: 0 }}>
                  <X size={12} />
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingRight: 40 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--panel-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden" }}>
                    <img src={selected.imageUrl2} alt={selected.name} style={{ width: 50, height: 50, objectFit: "contain" }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 4 }}>{selected.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 2, background: color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", color: "var(--ink-4)" }}>
                        {selected.rarity.name.toLowerCase()}{selected.class.name !== "Unknown" ? ` · ${selected.class.name.toLowerCase()}` : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", borderBottom: "1px solid var(--line)", gap: 0 }}>
                  {(["overview", "maps", "abilities"] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{ padding: "8px 14px", fontSize: 12, fontWeight: 600, color: tab === t ? "var(--ink)" : "var(--ink-4)", background: "none", border: "none", borderBottom: tab === t ? `2px solid ${color}` : "2px solid transparent", cursor: "pointer", textTransform: "capitalize", letterSpacing: "0.01em", transition: "color 0.12s", marginBottom: -1 }}
                    >
                      {t === "overview" ? "Overview" : t === "maps" ? "Best Maps" : "Abilities"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
                {tab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        {
                          label: "Total Picks",
                          value: statsLoading ? "—" : stats?.totalPicks
                            ? stats.totalPicks >= 1000 ? `${(stats.totalPicks / 1000).toFixed(1)}k` : String(stats.totalPicks)
                            : "—",
                        },
                        {
                          label: "Avg Win Rate",
                          value: statsLoading ? "—" : stats?.avgWinRate != null ? `${stats.avgWinRate.toFixed(1)}%` : "—",
                          color: stats?.avgWinRate != null ? winRateColor(stats.avgWinRate) : undefined,
                        },
                        {
                          label: "Maps Tracked",
                          value: statsLoading ? "—" : stats ? String(stats.maps.length) : "—",
                        },
                      ].map(s => (
                        <div key={s.label} style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 5 }}>{s.label}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: s.color ?? "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                    {!statsLoading && stats && stats.modes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>By Mode</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
                          {stats.modes.slice(0, 6).map((m, i) => (
                            <div key={m.mode} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: i % 2 === 0 ? "var(--panel)" : "var(--panel-2)", gap: 12 }}>
                              <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500 }}>{m.mode}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontSize: 11, color: "var(--ink-4)" }}>{m.picks >= 1000 ? `${(m.picks / 1000).toFixed(1)}k` : m.picks} picks</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: winRateColor(m.winRate), minWidth: 44, textAlign: "right" }}>{m.winRate.toFixed(1)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selected.description && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Description</div>
                        <p style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.65, margin: 0 }}>{cleanDesc(selected.description)}</p>
                      </div>
                    )}

                    {statsLoading && (
                      <div style={{ padding: "20px 0", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Loading stats…</span>
                      </div>
                    )}

                    {!statsLoading && stats && stats.totalPicks === 0 && (
                      <div style={{ padding: "16px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No match data collected yet for this brawler.</span>
                      </div>
                    )}
                  </div>
                )}
                {tab === "maps" && (
                  <div>
                    {statsLoading && (
                      <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Loading…</span>
                      </div>
                    )}

                    {!statsLoading && stats && stats.maps.length === 0 && (
                      <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>Not enough data yet (min 20 picks per map).</span>
                      </div>
                    )}

                    {!statsLoading && stats && stats.maps.length > 0 && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 64px 64px", gap: 8, padding: "0 10px 8px", borderBottom: "1px solid var(--line)" }}>
                          {["Map", "Mode", "Picks", "Win %"].map(h => (
                            <span key={h} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", textAlign: h === "Win %" || h === "Picks" ? "right" : "left" }}>{h}</span>
                          ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {stats.maps.map((m, i) => (
                            <div
                              key={m.map}
                              style={{ display: "grid", gridTemplateColumns: "1fr 90px 64px 64px", gap: 8, padding: "9px 10px", borderBottom: i < stats.maps.length - 1 ? "1px solid var(--line)" : "none", alignItems: "center" }}
                            >
                              <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.map}</span>
                              <span style={{ fontSize: 11, color: "var(--ink-4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.mode}</span>
                              <span style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "right" }}>{m.picks >= 1000 ? `${(m.picks / 1000).toFixed(1)}k` : m.picks}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: winRateColor(m.winRate), textAlign: "right" }}>{m.winRate.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {tab === "abilities" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {selected.gadgets.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Gadgets</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {selected.gadgets.map(g => (
                            <div key={g.id} style={{ display: "flex", gap: 12, padding: "11px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <img src={g.imageUrl} alt={g.name} style={{ width: 24, height: 24, objectFit: "contain" }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{g.name}</div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{cleanDesc(g.description)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selected.starPowers.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Star Powers</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {selected.starPowers.map(sp => (
                            <div key={sp.id} style={{ display: "flex", gap: 12, padding: "11px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                                <img src={sp.imageUrl} alt={sp.name} style={{ width: 24, height: 24, objectFit: "contain" }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{sp.name}</div>
                                <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{cleanDesc(sp.description)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hc && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--ink-4)", textTransform: "uppercase", marginBottom: 8 }}>Hypercharge</div>
                        <div style={{ padding: "12px 14px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.15)" }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{hc.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 10 }}>{hc.description}</div>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(239,68,68,0.06)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.12)" }}>+{hc.damageBoost}% DMG</span>
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(59,130,246,0.06)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.12)" }}>+{hc.shieldBoost}% Shield</span>
                            <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: "rgba(34,197,94,0.06)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.12)" }}>+{hc.speedBoost}% Speed</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selected.gadgets.length === 0 && selected.starPowers.length === 0 && !hc && (
                      <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <span style={{ fontSize: 12, color: "var(--ink-4)" }}>No abilities data available.</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
