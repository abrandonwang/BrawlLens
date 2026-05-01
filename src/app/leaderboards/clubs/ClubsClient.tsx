"use client"

import { useState, useEffect } from "react"
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"
import { formatNum, formatRelativeTime, getPageItems } from "@/lib/format"

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
  const lastUpdated = (regionData?.clubs ?? []).reduce<string | null>((latest, c) => {
    if (!c.updated_at) return latest
    if (!latest || c.updated_at > latest) return c.updated_at
    return latest
  }, null)

  const page = pageByRegion[activeRegion] ?? 0
  const totalPages = Math.ceil(clubs.length / PAGE_SIZE)
  const paginated = clubs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function setPage(p: number) {
    setPageByRegion(prev => ({ ...prev, [activeRegion]: p }))
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pt-12 pb-24 max-md:px-4 max-md:pt-8 max-md:pb-[64px] max-[480px]:pt-6 max-[480px]:pb-12">
      <div className="mb-8 flex items-end justify-between gap-8 max-md:flex-col max-md:items-start">
        <div className="min-w-0">
          <h1 className="m-0 text-[clamp(34px,5vw,56px)] leading-[1.07] font-semibold tracking-[-0.01em] text-[var(--ink)]">Club Leaderboards</h1>
          <p className="mt-3 mb-0 max-w-[640px] text-[17px] leading-[1.47] tracking-[-0.022em] text-[var(--ink-3)]">Compare top clubs by region with member counts and trophy totals in one compact view.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
          <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{regionData?.label ?? activeRegion}</span>
          <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{clubs.length.toLocaleString()} clubs</span>
          {lastUpdated && (
            <span
              title={new Date(lastUpdated).toLocaleString()}
              className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-3)]"
            >
              <span className="size-1.5 rounded-full bg-[var(--win)]" />
              Updated {formatRelativeTime(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--panel)] p-4 max-md:flex-col max-md:items-stretch">
        <div className="inline-flex gap-0.5 overflow-x-auto rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] max-md:w-full [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(c => (
            <Link
              key={c.href}
              href={c.href}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-normal tracking-[-0.016em] no-underline transition-all max-md:flex-1 max-md:text-center ${pathname === c.href ? "bg-[var(--accent)] text-white" : "text-[var(--ink-3)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch">
          <div className="flex h-11 w-[240px] items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[var(--ink)] transition-colors focus-within:border-[var(--accent)] max-md:w-full">
            <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
            <input className="w-full border-0 bg-transparent text-[17px] tracking-[-0.022em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs…" />
          </div>
          <div className="inline-flex shrink-0 gap-0.5 overflow-x-auto rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] max-md:w-full [&::-webkit-scrollbar]:hidden">
            {allData.map(r => (
              <button key={r.code} onClick={() => setActiveRegion(r.code)} className={`shrink-0 cursor-pointer rounded-full border-0 px-4 py-2 text-[14px] font-normal tracking-[-0.016em] transition-all max-md:flex-1 ${activeRegion === r.code ? "bg-[var(--accent)] text-white" : "bg-transparent text-[var(--ink-3)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"}`}>
                {r.code === "global" ? "Global" : r.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {clubs.length === 0 ? (
        <EmptyState
          title={search ? "No clubs match" : "No club data"}
          description={search ? "Your search filtered out every club in this region." : `No club rankings are available for ${regionData?.label ?? activeRegion} right now.`}
          action={search ? <StateButton onClick={() => setSearch("")}>Clear search</StateButton> : activeRegion !== "global" ? <StateButton onClick={() => setActiveRegion("global")}>Switch to global</StateButton> : <StateLink href="/leaderboards/players">View players</StateLink>}
        />
      ) : (
        <>
          <div className="leaderboard-summary relative mb-6 flex items-stretch justify-between gap-6 overflow-hidden border border-[var(--line)] p-8 max-md:flex-col max-sm:p-6" style={{ background: "linear-gradient(135deg, #EC4899 0%, #14B8A6 100%)" }}>
            <div className="relative z-10 min-w-0">
              <p className="mb-1 text-[12px] leading-none tracking-[0.08em] text-white/70 uppercase">
                {regionData?.label ?? activeRegion} Clubs
              </p>
              <h2 className="m-0 truncate text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] text-white">{clubs.length.toLocaleString()} ranked clubs</h2>
            </div>
            <div className="relative z-10 grid min-w-[min(420px,48%)] grid-cols-3 gap-2 max-md:min-w-0">
              <div className="min-w-0 rounded-[10px] border border-white/20 bg-black/30 px-3 py-2.5 backdrop-blur-xl">
                <span className="text-[10.5px] text-white/70">Leader</span>
                <strong className="mt-0.5 block truncate text-[13px] font-bold text-white">{clubs[0]?.club_name ?? "—"}</strong>
              </div>
              <div className="min-w-0 rounded-[10px] border border-white/20 bg-black/30 px-3 py-2.5 backdrop-blur-xl">
                <span className="text-[10.5px] text-white/70">Top trophies</span>
                <strong className="mt-0.5 block truncate text-[13px] font-bold text-white">{clubs[0] ? formatNum(clubs[0].trophies) : "—"}</strong>
              </div>
              <div className="min-w-0 rounded-[10px] border border-white/20 bg-black/30 px-3 py-2.5 backdrop-blur-xl">
                <span className="text-[10.5px] text-white/70">Page</span>
                <strong className="mt-0.5 block truncate text-[13px] font-bold text-white">{page + 1}/{Math.max(totalPages, 1)}</strong>
              </div>
            </div>
          </div>

          <div className="mb-3.5 grid grid-cols-3 gap-2.5 max-md:grid-cols-1">
            {clubs.slice(0, 3).map((club, index) => (
              <div key={club.club_tag} className={`interactive-card top-rank-card top-rank-card-rank-${index + 1} grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border bg-[var(--panel)] p-3`}>
                <span className="grid h-7 min-w-[34px] place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-xs font-extrabold tabular-nums text-[var(--ink)]">#{club.rank}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-[var(--ink)]">{club.club_name}</div>
                  <div className="text-[10.5px] leading-snug tracking-[0.01em] tabular-nums text-[var(--ink-3)]">{club.club_tag}</div>
                </div>
                <div className="flex items-center justify-end whitespace-nowrap text-xs font-bold tabular-nums text-[var(--ink)]">
                  {formatNum(club.trophies)}
                </div>
              </div>
            ))}
          </div>

          <div className="leaderboard-table overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--panel)]">
            <div className="leaderboard-header grid grid-cols-[48px_1fr_100px_100px] gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-5 py-2.5 max-md:grid-cols-[40px_1fr_80px] max-md:px-3.5">
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">#</span>
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">Club</span>
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)] max-md:hidden">Members</span>
              <span className="text-right text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">Trophies</span>
            </div>

            {paginated.map((club, i) => (
              <div
                key={club.club_tag}
                className={`interactive-row leaderboard-row grid grid-cols-[48px_1fr_100px_100px] items-center gap-3 px-5 py-3 max-md:grid-cols-[40px_1fr_80px] max-md:px-3.5 ${club.rank <= 3 ? `leaderboard-rank-row-${club.rank} border-l-2` : ""}`}
                style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <span className="leaderboard-rank text-[13px] font-medium tabular-nums text-[var(--ink-3)]">
                  {String(club.rank).padStart(2, "0")}
                </span>
                <div className="leaderboard-main min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--ink)]">{club.club_name}</div>
                  <div className="text-[10.5px] leading-snug tabular-nums text-[var(--ink-4)]">{club.club_tag}</div>
                </div>
                <div className="leaderboard-secondary flex items-center gap-1.5 max-md:hidden">
                  <Users size={11} className="text-[var(--ink-4)]" />
                  <span className="text-[13px] tabular-nums text-[var(--ink-3)]">{club.member_count ?? "—"}</span>
                </div>
                <div className="leaderboard-metric flex items-center justify-end">
                  <span className="text-[13px] font-medium tabular-nums text-[var(--ink)]">{formatNum(club.trophies)}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1">
              <button onClick={() => setPage(page - 1)} disabled={page === 0}
                className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--line)] bg-transparent text-[var(--ink-3)] disabled:cursor-default disabled:opacity-30">
                <ChevronLeft size={13} />
              </button>
              {getPageItems(page, totalPages).map((idx, i) => idx === "..." ? (
                <span key={`ellipsis-${i}`} className="grid size-[30px] place-items-center text-xs text-[var(--ink-4)]">…</span>
              ) : (
                <button key={idx} onClick={() => setPage(idx)}
                  className={`grid size-[30px] cursor-pointer place-items-center rounded-lg text-xs font-semibold ${idx === page ? "border border-transparent bg-[var(--accent)] text-[#fcfbf8]" : "border border-[var(--line)] bg-transparent text-[var(--ink-3)]"}`}>
                  {idx + 1}
                </button>
              ))}
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages - 1}
                className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--line)] bg-transparent text-[var(--ink-3)] disabled:cursor-default disabled:opacity-30">
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
