"use client"

import { useState, useEffect } from "react"
import { Search, Trophy, Users, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"

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
    <div className="mx-auto w-full max-w-[1080px] px-6 pt-9 pb-20 max-md:px-4 max-md:pt-6 max-md:pb-[60px] max-[480px]:pt-5 max-[480px]:pb-12">
      <div className="mb-[18px] flex items-end justify-between gap-[18px] max-md:flex-col max-md:items-start">
        <div className="min-w-0">
          <h1 className="m-0 text-[clamp(28px,4vw,40px)] leading-none font-extrabold tracking-normal text-[var(--ink)]">Club Leaderboards</h1>
          <p className="mt-2 mb-0 max-w-[560px] text-[13px] leading-normal text-[var(--ink-3)]">Compare top clubs by region with member counts and trophy totals in one compact view.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
          <span className="inline-flex min-h-[30px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] px-3 text-[11.5px] font-semibold text-[var(--ink-2)]">{regionData?.label ?? activeRegion}</span>
          <span className="inline-flex min-h-[30px] items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_84%,transparent)] px-3 text-[11.5px] font-semibold text-[var(--ink-2)]">{clubs.length.toLocaleString()} clubs</span>
        </div>
      </div>

      <div className="mb-7 flex items-center justify-between gap-3 rounded-[12px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_78%,transparent)] p-2.5 shadow-[0_18px_36px_-34px_rgba(0,0,0,0.7)] backdrop-blur-2xl max-md:flex-col max-md:items-stretch">
        <div className="inline-flex gap-0.5 overflow-x-auto rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] max-md:w-full [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(c => (
            <Link
              key={c.href}
              href={c.href}
              className={`shrink-0 rounded-full px-3.5 py-[5px] text-[11.5px] font-medium no-underline transition-all max-md:flex-1 max-md:text-center ${pathname === c.href ? "bl-rainbow-border bg-[var(--panel-2)] text-[var(--ink)]" : "text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch">
          <div className="flex h-10 w-[220px] items-center gap-2.5 rounded-[10px] border border-[var(--line)] bg-[var(--panel)] px-3.5 text-[var(--ink)] transition-colors focus-within:border-[var(--line-2)] max-md:w-full">
            <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
            <input className="w-full border-0 bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clubs…" />
          </div>
          <div className="inline-flex shrink-0 gap-0.5 overflow-x-auto rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] max-md:w-full [&::-webkit-scrollbar]:hidden">
            {allData.map(r => (
              <button key={r.code} onClick={() => setActiveRegion(r.code)} className={`shrink-0 cursor-pointer rounded-full border-0 px-3 py-[5px] text-[11.5px] font-medium transition-all max-md:flex-1 ${activeRegion === r.code ? "bg-[var(--panel-2)] text-[var(--ink)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}>
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
          <div className="leaderboard-summary relative mb-3.5 flex items-stretch justify-between gap-3.5 overflow-hidden border border-[var(--line)] p-[18px] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ink)_7%,transparent),0_20px_42px_-34px_rgba(0,0,0,0.55)] max-md:flex-col" style={{ background: "linear-gradient(135deg, #EC4899 0%, #14B8A6 100%)" }}>
            <div className="relative z-10 min-w-0">
              <p className="mb-1 text-[10.5px] leading-snug tracking-[0.12em] text-white/70 uppercase">
                {regionData?.label ?? activeRegion} Clubs
              </p>
              <h2 className="m-0 truncate text-[22px] leading-tight font-bold text-white">{clubs.length.toLocaleString()} ranked clubs</h2>
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
              <div key={club.club_tag} className={`top-rank-card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border border-[var(--line)] bg-[var(--panel)] p-3 transition hover:-translate-y-0.5 hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)] ${index === 0 ? "top-rank-card-first" : ""}`}>
                <span className="grid h-7 min-w-[34px] place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] font-mono text-xs font-extrabold text-[var(--ink)]">#{club.rank}</span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-[var(--ink)]">{club.club_name}</div>
                  <div className="font-mono text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">{club.club_tag}</div>
                </div>
                <div className="flex items-center justify-end gap-1.5 whitespace-nowrap font-mono text-xs font-bold text-[var(--ink)]">
                  <Trophy size={12} className="text-[var(--accent)]" />
                  {formatNum(club.trophies)}
                </div>
              </div>
            ))}
          </div>

          <div className="leaderboard-table overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-lift)]">
            <div className="leaderboard-header grid grid-cols-[48px_1fr_100px_100px] gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-5 py-2.5 max-md:grid-cols-[40px_1fr_80px] max-md:px-3.5">
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">#</span>
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">Club</span>
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)] max-md:hidden">Members</span>
              <span className="text-right text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">Trophies</span>
            </div>

            {paginated.map((club, i) => (
              <div
                key={club.club_tag}
                className="leaderboard-row grid grid-cols-[48px_1fr_100px_100px] items-center gap-3 px-5 py-3 transition hover:bg-[var(--hover-bg)] max-md:grid-cols-[40px_1fr_80px] max-md:px-3.5"
                style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <span className="leaderboard-rank font-mono text-[13px] font-medium text-[var(--ink-3)]">
                  {String(club.rank).padStart(2, "0")}
                </span>
                <div className="leaderboard-main min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--ink)]">{club.club_name}</div>
                  <div className="font-mono text-[10.5px] leading-snug text-[var(--ink-4)]">{club.club_tag}</div>
                </div>
                <div className="leaderboard-secondary flex items-center gap-1.5 max-md:hidden">
                  <Users size={11} className="text-[var(--ink-4)]" />
                  <span className="font-mono text-[13px] text-[var(--ink-3)]">{club.member_count ?? "—"}</span>
                </div>
                <div className="leaderboard-metric flex items-center justify-end gap-1.5">
                  <Trophy size={11} className="text-[var(--accent)] opacity-70" />
                  <span className="font-mono text-[13px] font-medium text-[var(--ink)]">{formatNum(club.trophies)}</span>
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
                  className={`grid size-[30px] cursor-pointer place-items-center rounded-lg text-xs font-semibold ${idx === page ? "border border-transparent bg-[var(--accent)] text-[#0A0A0B]" : "border border-[var(--line)] bg-transparent text-[var(--ink-3)]"}`}>
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
