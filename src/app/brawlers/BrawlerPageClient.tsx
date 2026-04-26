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
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={close}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", background: "var(--panel)", border: "1px solid var(--line-2)", borderRadius: 20, boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 20px 16px", borderBottom: "1px solid var(--line)", position: "sticky", top: 0, background: "var(--panel)", zIndex: 1, borderRadius: "20px 20px 0 0" }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, border: `1.5px solid ${selected.rarity.color}40`, background: `${selected.rarity.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={selected.imageUrl2} alt={selected.name} style={{ width: 44, height: 44, objectFit: "contain" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 16, fontWeight: 650, color: "var(--ink)", letterSpacing: "-0.02em" }}>{selected.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 4, color: selected.rarity.color, background: `${selected.rarity.color}15`, border: `1px solid ${selected.rarity.color}35` }}>
                    {selected.rarity.name.toUpperCase()}
                  </span>
                </div>
                {selected.class.name !== "Unknown" && (
                  <span className="bl-caption">{selected.class.name}</span>
                )}
              </div>
              <button onClick={close} style={{ width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid var(--line)", borderRadius: 8, background: "transparent", cursor: "pointer", color: "var(--ink-4)", flexShrink: 0 }}>
                <X size={13} />
              </button>
            </div>

            <div style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Description */}
              {selected.description && (
                <p style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.6, margin: 0 }}>
                  {cleanDesc(selected.description)}
                </p>
              )}

              {/* Gadgets */}
              {selected.gadgets.length > 0 && (
                <div>
                  <div className="bl-caption" style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Gadgets</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selected.gadgets.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                        <img src={g.imageUrl} alt={g.name} style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{g.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{cleanDesc(g.description)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Star Powers */}
              {selected.starPowers.length > 0 && (
                <div>
                  <div className="bl-caption" style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Star Powers</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {selected.starPowers.map(sp => (
                      <div key={sp.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid var(--line)" }}>
                        <img src={sp.imageUrl} alt={sp.name} style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{sp.name}</div>
                          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{cleanDesc(sp.description)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hypercharge */}
              {HYPERCHARGES[selected.id] && (() => {
                const hc = HYPERCHARGES[selected.id]
                return (
                  <div>
                    <div className="bl-caption" style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Hypercharge</div>
                    <div style={{ padding: "10px 12px", background: "var(--panel-2)", borderRadius: 10, border: "1px solid rgba(168,85,247,0.2)" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{hc.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5, marginBottom: 10 }}>{hc.description}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>+{hc.damageBoost}% Damage</span>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>+{hc.shieldBoost}% Shield</span>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>+{hc.speedBoost}% Speed</span>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
