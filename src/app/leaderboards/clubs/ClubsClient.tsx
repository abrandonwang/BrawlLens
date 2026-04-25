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
        <h1 className="bl-h-display">Clubs</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="bl-input" style={{ width: 220 }}>
            <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs…" />
          </div>
          <div className="bl-seg">
            {allData.map(r => (
              <button key={r.code} onClick={() => setActiveRegion(r.code)} className={activeRegion === r.code ? "on" : ""}>
                {r.code === "global" ? "Global" : r.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--line)", marginBottom: 32 }} />

      {clubs.length === 0 ? (
        <p className="bl-caption" style={{ padding: "48px 0", textAlign: "center" }}>No data yet.</p>
      ) : (
        <>
          <div className="bl-card" style={{ borderRadius: 14, overflow: "hidden", padding: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "52px 1fr auto auto", gap: 16, padding: "11px 20px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)" }}>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>#</span>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Club</span>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Members</span>
              <span className="bl-caption" style={{ letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "right" }}>Trophies</span>
            </div>

            {paginated.map((club, i) => (
              <div
                key={club.club_tag}
                className="row-hover"
                style={{ display: "grid", gridTemplateColumns: "52px 1fr auto auto", gap: 16, alignItems: "center", padding: "13px 20px", borderBottom: i < paginated.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <span className="bl-num" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink-3)" }}>
                  {String(club.rank).padStart(2, "0")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{club.club_name}</div>
                  <div className="bl-mono bl-caption" style={{ color: "var(--ink-4)" }}>{club.club_tag}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Users size={12} style={{ color: "var(--ink-4)" }} />
                  <span className="bl-num" style={{ fontSize: 13, color: "var(--ink-3)" }}>{club.member_count ?? "—"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                  <Trophy size={12} style={{ color: "var(--accent)", opacity: 0.7 }} />
                  <span className="bl-num" style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{formatNum(club.trophies)}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 20 }}>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
                style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: "1px solid var(--line)", background: "transparent", cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.3 : 1, color: "var(--ink-3)" }}
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  style={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, borderRadius: 8, border: idx === page ? "none" : "1px solid var(--line)", background: idx === page ? "var(--accent)" : "transparent", color: idx === page ? "#0A0A0B" : "var(--ink-3)", cursor: "pointer", fontFamily: "inherit" }}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
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
