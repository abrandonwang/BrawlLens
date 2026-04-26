"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

// Brawlify API has a typo in Legendary's color (#fff11ev). Strip non-hex chars.
function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

export default function BrawlerPageClient({ brawlers, newest }: { brawlers: Brawler[]; newest?: string }) {
  const [activeRarity, setActiveRarity] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Brawler | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setSelected(null), [])

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

  const rarities = RARITY_ORDER
    .map(name => ({ name, color: sanitizeColor(brawlers.find(b => b.rarity.name === name)?.rarity.color ?? "#888") }))
    .filter(r => brawlers.some(b => b.rarity.name === r.name))

  return (
    <>
      <div className="roster-page">

        <div className="roster-controls">
          <div className="bl-input roster-search">
            <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brawlers" />
          </div>

          <div className="roster-filters-wrap">
            {canScrollLeft && (
              <button onClick={() => scrollFilters("left")} style={{ position: "absolute", left: 0, top: 0, bottom: 0, zIndex: 1, display: "flex", alignItems: "center", background: "linear-gradient(to right, var(--bg) 50%, transparent)", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: "0 14px 0 2px" }}>
                <ChevronLeft size={14} />
              </button>
            )}
            <div className="roster-filters" ref={filtersRef}>
              <div className="bl-seg" style={{ flexShrink: 0 }}>
                <button onClick={() => setActiveRarity(null)} className={!activeRarity ? "on" : ""}>
                  All
                </button>
                {rarities.map(r => (
                  <button
                    key={r.name}
                    onClick={() => setActiveRarity(activeRarity === r.name ? null : r.name)}
                    className={activeRarity === r.name ? "on" : ""}
                    style={{ display: "flex", alignItems: "center", gap: 5 }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 2, background: r.color, flexShrink: 0, display: "inline-block" }} />
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

        <BrawlerCatalog brawlers={brawlers} activeRarity={activeRarity} search={search} onSelect={setSelected} />
      </div>

      {/* Modal */}
      {selected && (() => {
        const color = sanitizeColor(selected.rarity.color)
        const hc = HYPERCHARGES[selected.id]
        return (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
            onClick={close}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 480, maxHeight: "88vh", overflowY: "auto", background: "var(--panel)", border: "1px solid var(--line-2)", borderRadius: 24, boxShadow: "0 48px 96px -24px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset" }}
            >
              {/* Hero */}
              <div style={{ position: "relative", borderRadius: "24px 24px 0 0", overflow: "hidden", background: `radial-gradient(ellipse at 60% 0%, ${color}22 0%, transparent 70%), var(--panel-2)`, padding: "28px 24px 20px" }}>
                <button onClick={close} style={{ position: "absolute", top: 16, right: 16, width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 8, background: "var(--panel)", cursor: "pointer", color: "var(--ink-4)" }}>
                  <X size={12} />
                </button>

                <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 88, height: 88, borderRadius: 18, background: `${color}14`, border: `1.5px solid ${color}30`, display: "grid", placeItems: "center", overflow: "hidden" }}>
                      <img src={selected.imageUrl2} alt={selected.name} style={{ width: 80, height: 80, objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0, paddingBottom: 4 }}>
                    <span style={{ display: "inline-block", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 8px", borderRadius: 4, color, background: `${color}18`, border: `1px solid ${color}30`, marginBottom: 6, textTransform: "uppercase" }}>
                      {selected.rarity.name}
                    </span>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>{selected.name}</div>
                    {selected.class.name !== "Unknown" && (
                      <div style={{ fontSize: 12, color: "var(--ink-4)", marginTop: 4 }}>{selected.class.name}</div>
                    )}
                  </div>
                </div>

                {selected.description && (
                  <p style={{ fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.65, margin: "16px 0 0", borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                    {cleanDesc(selected.description)}
                  </p>
                )}
              </div>

              {/* Abilities */}
              <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

                {selected.gadgets.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 3, height: 14, borderRadius: 99, background: "#3b82f6", flexShrink: 0, display: "block" }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>Gadgets</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selected.gadgets.map(g => (
                        <div key={g.id} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--panel-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <img src={g.imageUrl} alt={g.name} style={{ width: 28, height: 28, objectFit: "contain" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{g.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{cleanDesc(g.description)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.starPowers.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 3, height: 14, borderRadius: 99, background: "#f59e0b", flexShrink: 0, display: "block" }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>Star Powers</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selected.starPowers.map(sp => (
                        <div key={sp.id} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--panel-2)", borderRadius: 12, border: "1px solid var(--line)" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                            <img src={sp.imageUrl} alt={sp.name} style={{ width: 28, height: 28, objectFit: "contain" }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{sp.name}</div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{cleanDesc(sp.description)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hc && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ width: 3, height: 14, borderRadius: 99, background: "#a855f7", flexShrink: 0, display: "block" }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)" }}>Hypercharge</span>
                    </div>
                    <div style={{ padding: "14px 16px", background: "var(--panel-2)", borderRadius: 12, border: "1px solid rgba(168,85,247,0.2)" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{hc.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.55, marginBottom: 12 }}>{hc.description}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>+{hc.damageBoost}% DMG</span>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "rgba(59,130,246,0.08)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.15)" }}>+{hc.shieldBoost}% Shield</span>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 9px", borderRadius: 6, background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>+{hc.speedBoost}% Speed</span>
                      </div>
                    </div>
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
