"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Trophy, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { name: string; color: string }
}

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  brawler_name: string
}

const PAGE_SIZE = 20

const CATEGORIES = [
  { label: "Players",  href: "/leaderboards/players" },
  { label: "Clubs",    href: "/leaderboards/clubs" },
  { label: "Brawlers", href: "/leaderboards/brawlers" },
]

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export default function BrawlerLeaderboardClient({
  brawlers,
  data,
  activeBrawler,
}: {
  brawlers: Brawler[]
  data: Player[]
  activeBrawler: Brawler | null
}) {
  const router = useRouter()
  const [search, setSearch] = useState(activeBrawler?.name ?? "")
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? brawlers.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brawlers

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paginated = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function select(b: Brawler) {
    setSearch(b.name)
    setOpen(false)
    setPage(0)
    router.push(`/leaderboards/brawlers?b=${b.id}`)
  }

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  return (
    <div className="lb-page">

      {/* Top controls row: cats left, brawler search right */}
      <div className="lb-top-controls">
        {/* Category tabs */}
        <div className="bl-seg lb-cat-seg">
          {CATEGORIES.map(c => (
            <Link
              key={c.href}
              href={c.href}
              style={{
                padding: "5px 14px", fontSize: 11.5, fontWeight: 500, borderRadius: 999,
                textDecoration: "none", transition: "all 0.15s ease",
                color: c.href === "/leaderboards/brawlers" ? "var(--ink)" : "var(--ink-3)",
                background: c.href === "/leaderboards/brawlers" ? "var(--elev)" : "transparent",
                boxShadow: c.href === "/leaderboards/brawlers" ? "0 0 0 1px var(--line-2)" : "none",
              }}
            >
              {c.label}
            </Link>
          ))}
        </div>

        {/* Brawler search with autocomplete */}
        <div className="lb-top-right">
        <div style={{ position: "relative", width: 200, flexShrink: 0 }}>
          <div className="bl-input" style={{ width: "100%" }}>
            <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Search brawler…"
            />
            {activeBrawler && (
              <img
                src={`https://cdn.brawlify.com/brawlers/borderless/${activeBrawler.id}.png`}
                alt=""
                style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }}
              />
            )}
          </div>

          {open && filtered.length > 0 && (
            <div
              ref={dropdownRef}
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "var(--panel)",
                border: "1px solid var(--line-2)",
                borderRadius: 12,
                overflow: "hidden",
                zIndex: 50,
                maxHeight: 240,
                overflowY: "auto",
                boxShadow: "0 8px 24px -8px rgba(0,0,0,0.3)",
              }}
            >
              {filtered.map(b => (
                <button
                  key={b.id}
                  onMouseDown={() => select(b)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 12px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    borderBottom: "1px solid var(--line)",
                  }}
                  className="row-hover"
                >
                  <img
                    src={`https://cdn.brawlify.com/brawlers/borderless/${b.id}.png`}
                    alt={b.name}
                    style={{ width: 24, height: 24, objectFit: "contain", flexShrink: 0 }}
                  />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>{b.name}</div>
                    <div className="bl-caption" style={{ color: b.rarity.color }}>{b.rarity.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--line)", marginBottom: 28 }} />

      {data.length === 0 ? (
        <p className="bl-caption" style={{ padding: "48px 0", textAlign: "center" }}>No data available.</p>
      ) : (
        <>
          {activeBrawler && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <img
                src={`https://cdn.brawlify.com/brawlers/borderless/${activeBrawler.id}.png`}
                alt={activeBrawler.name}
                style={{ width: 32, height: 32, objectFit: "contain" }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 650, color: "var(--ink)", letterSpacing: "-0.02em" }}>{activeBrawler.name}</div>
                <div className="bl-caption" style={{ color: "var(--ink-4)" }}>Top {data.length} global players</div>
              </div>
            </div>
          )}

          <div className="bl-card" style={{ borderRadius: 14, overflow: "hidden", padding: 0 }}>
            <div className="lb-table-header">
              <span className="bl-caption lb-col-rank">#</span>
              <span className="bl-caption">Player</span>
              <span className="bl-caption lb-col-club">Club</span>
              <span className="bl-caption lb-col-trophies">Trophies</span>
              <span />
            </div>

            {paginated.map((p, i) => (
              <Link
                key={p.player_tag}
                href={`/player/${p.player_tag.replace("#", "")}`}
                className="lb-table-row row-hover"
                style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--line)" : "none", textDecoration: "none" }}
              >
                <span className={p.rank <= 3 ? "bl-num lb-col-rank bl-rainbow-text" : "bl-num lb-col-rank"} style={{ fontSize: 13, fontWeight: 700, color: p.rank <= 3 ? undefined : "var(--ink-3)" }}>
                  {String(p.rank).padStart(2, "0")}
                </span>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.player_name}</div>
                  <div className="bl-mono bl-caption" style={{ color: "var(--ink-4)" }}>{p.player_tag}</div>
                </div>

                <span className="bl-body lb-col-club" style={{ fontSize: 12, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.club_name ?? "—"}
                </span>

                <div className="lb-col-trophies" style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  <Trophy size={11} style={{ color: "var(--accent)", opacity: 0.7 }} />
                  <span className="bl-num" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
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
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.3 : 1, color: "var(--ink-3)" }}
              >
                <ChevronLeft size={13} />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  style={{
                    width: 30, height: 30, fontSize: 12, fontWeight: 600, borderRadius: 8,
                    border: idx === page ? "none" : "1px solid var(--line)",
                    background: idx === page ? "var(--accent)" : "transparent",
                    color: idx === page ? "#0A0A0B" : "var(--ink-3)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages - 1}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.3 : 1, color: "var(--ink-3)" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
