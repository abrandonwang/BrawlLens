"use client"

import { useState, useEffect } from "react"
import { Search, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface Club {
  rank: number
  club_tag: string
  club_name: string
  trophies: number
  member_count: number | null
  updated_at: string
}

interface RegionData {
  code: string
  label: string
  clubs: Club[]
}

const PAGE_SIZE = 20

const CATEGORIES = [
  { label: "Players",  href: "/leaderboards/players" },
  { label: "Clubs",    href: "/leaderboards/clubs" },
  { label: "Brawlers", href: "/leaderboards/brawlers" },
]

function getPageItems(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = []
  for (let i = 0; i < total; i++) {
    if (i === 0 || i === total - 1 || Math.abs(i - current) <= 1) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...")
    }
  }
  return pages
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export default function ClubsClient({ allData }: { allData: RegionData[] }) {
  const pathname = usePathname()
  const [activeRegion, setActiveRegion] = useState<string>("global")
  const [search, setSearch] = useState("")
  const [pageByRegion, setPageByRegion] = useState<Record<string, number>>({})

  useEffect(() => { setPageByRegion({}) }, [search, activeRegion])

  const regionData = allData.find(r => r.code === activeRegion)
  const clubs = (regionData?.clubs ?? []).filter(
    c =>
      c.club_name.toLowerCase().includes(search.toLowerCase()) ||
      c.club_tag.toLowerCase().includes(search.toLowerCase())
  )

  const page = pageByRegion[activeRegion] ?? 0
  const totalPages = Math.ceil(clubs.length / PAGE_SIZE)
  const paginated = clubs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function setPage(p: number) {
    setPageByRegion(prev => ({ ...prev, [activeRegion]: p }))
  }

  return (
    <div className="lb-page">
      <div className="page-head">
        <div className="page-head-main">
          <h1 className="page-title">Leaderboards</h1>
          <p className="page-subtitle">Compare top clubs by region with member counts and trophy totals in one compact view.</p>
        </div>
        <div className="page-head-stats">
          <span className="page-head-chip">{regionData?.label ?? activeRegion}</span>
          <span className="page-head-chip">{clubs.length.toLocaleString()} clubs</span>
        </div>
      </div>

      <div className="app-toolbar lb-top-controls">
        <div className="bl-seg lb-cat-seg">
          {CATEGORIES.map(c => (
            <Link
              key={c.href}
              href={c.href}
              className={pathname === c.href ? "bl-rainbow-border" : ""}
              style={{
                padding: "5px 14px", fontSize: 11.5, fontWeight: 500, borderRadius: 999, textDecoration: "none", transition: "all 0.15s ease",
                color: pathname === c.href ? "var(--ink)" : "var(--ink-3)",
                background: pathname === c.href ? "var(--elev)" : "transparent",
              }}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="lb-top-right">
          <div className="bl-input lb-search-input">
            <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs…" />
          </div>
          <div className="bl-seg lb-region-seg" style={{ flexShrink: 0 }}>
            {allData.map(r => (
              <button key={r.code} onClick={() => setActiveRegion(r.code)} className={activeRegion === r.code ? "on" : ""}>
                {r.code === "global" ? "Global" : r.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {clubs.length === 0 ? (
        <p className="bl-caption" style={{ padding: "48px 0", textAlign: "center" }}>No data yet.</p>
      ) : (
        <>
          <div className="lb-board-intro">
            <div>
              <p className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                {regionData?.label ?? activeRegion} Clubs
              </p>
              <h2>{clubs.length.toLocaleString()} ranked clubs</h2>
            </div>
            <div className="lb-metrics">
              <div>
                <span className="bl-caption">Leader</span>
                <strong>{clubs[0]?.club_name ?? "—"}</strong>
              </div>
              <div>
                <span className="bl-caption">Top trophies</span>
                <strong>{clubs[0] ? formatNum(clubs[0].trophies) : "—"}</strong>
              </div>
              <div>
                <span className="bl-caption">Page</span>
                <strong>{page + 1}/{Math.max(totalPages, 1)}</strong>
              </div>
            </div>
          </div>

          <div className="lb-spotlight">
            {clubs.slice(0, 3).map(club => (
              <div key={club.club_tag} className="lb-spot-card">
                <span className="lb-rank-badge">#{club.rank}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="lb-spot-name">{club.club_name}</div>
                  <div className="bl-mono bl-caption">{club.club_tag}</div>
                </div>
                <div className="lb-spot-score">
                  <Trophy size={12} />
                  {formatNum(club.trophies)}
                </div>
              </div>
            ))}
          </div>

          <div className="bl-card lb-table-card">
            <div className="lb-clubs-header">
              <span className="bl-caption">#</span>
              <span className="bl-caption">Club</span>
              <span className="bl-caption lb-col-club">Members</span>
              <span className="bl-caption lb-col-trophies">Trophies</span>
            </div>

            {paginated.map((club, i) => (
              <div
                key={club.club_tag}
                className="lb-clubs-row lb-rank-row"
                style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <span className="bl-num" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-3)" }}>
                  {String(club.rank).padStart(2, "0")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.club_name}</div>
                  <div className="bl-mono bl-caption" style={{ color: "var(--ink-4)" }}>{club.club_tag}</div>
                </div>
                <div className="lb-col-club lb-flex-cell" style={{ alignItems: "center", gap: 5 }}>
                  <Users size={11} style={{ color: "var(--ink-4)" }} />
                  <span className="bl-num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{club.member_count ?? "—"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  <Trophy size={11} style={{ color: "var(--accent)", opacity: 0.7 }} />
                  <span className="bl-num" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{formatNum(club.trophies)}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 20 }}>
              <button onClick={() => setPage(page - 1)} disabled={page === 0}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.3 : 1, color: "var(--ink-3)" }}>
                <ChevronLeft size={13} />
              </button>
              {getPageItems(page, totalPages).map((idx, i) => idx === "..." ? (
                <span key={`ellipsis-${i}`} style={{ width: 30, height: 30, display: "grid", placeItems: "center", fontSize: 12, color: "var(--ink-4)" }}>…</span>
              ) : (
                <button key={idx} onClick={() => setPage(idx)}
                  style={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, borderRadius: 8, border: idx === page ? "none" : "1px solid var(--line)", background: idx === page ? "var(--accent)" : "transparent", color: idx === page ? "#0A0A0B" : "var(--ink-3)", cursor: "pointer", fontFamily: "inherit" }}>
                  {idx + 1}
                </button>
              ))}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages - 1}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === totalPages - 1 ? "default" : "pointer", opacity: page === totalPages - 1 ? 0.3 : 1, color: "var(--ink-3)" }}>
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
