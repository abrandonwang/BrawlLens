"use client"

import { useState, useEffect } from "react"
import { Search, Trophy, ArrowRight, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import Link from "next/link"

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

function rankBg(rank: number) {
  if (rank === 1) return "bg-[#FFD400]/10 dark:bg-[#FFD400]/[0.07] border-l-2 border-l-[#FFD400]/50 hover:bg-[#FFD400]/20 dark:hover:bg-[#FFD400]/[0.12]"
  if (rank === 2) return "bg-zinc-100 dark:bg-white/[0.04] border-l-2 border-l-zinc-400/30 hover:bg-zinc-200 dark:hover:bg-white/[0.07]"
  if (rank === 3) return "bg-orange-50 dark:bg-orange-900/10 border-l-2 border-l-orange-400/40 hover:bg-orange-100 dark:hover:bg-orange-900/20"
  return "bg-black/[0.02] dark:bg-white/[0.02] border-l-2 border-l-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
}

function formatNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

function rankColor(rank: number) {
  if (rank === 1) return "text-[#FFD400]"
  if (rank === 2) return "text-zinc-400"
  if (rank === 3) return "text-orange-400"
  return "text-zinc-400 dark:text-white/45"
}

export default function LeaderboardsClient({ allData }: { allData: RegionData[]; updatedAt?: string | null }) {
  const [activeRegion, setActiveRegion] = useState<string>("global")
  const [search, setSearch] = useState("")
  const [pageByRegion, setPageByRegion] = useState<Record<string, number>>({})

  useEffect(() => { setPageByRegion({}) }, [search, activeRegion])

  const filtered = allData
    .filter((r) => r.code === activeRegion)
    .map((r) => ({
      ...r,
      players: r.players.filter(
        (p) =>
          p.player_name.toLowerCase().includes(search.toLowerCase()) ||
          p.player_tag.toLowerCase().includes(search.toLowerCase())
      ),
    }))

  function getPage(code: string) { return pageByRegion[code] ?? 0 }
  function setPage(code: string, page: number) { setPageByRegion(prev => ({ ...prev, [code]: page })) }

  return (
    <div className="flex flex-col">
      <main className="flex-1 min-w-0 pt-6 pb-16 px-8 overflow-y-auto">
        <section className="mb-8">
          <Link href="/leaderboards" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-white/50 hover:text-zinc-700 dark:hover:text-white/60 transition-colors mb-6">
            <ArrowLeft size={12} /> Leaderboards
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">Players</h1>
          <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40 mb-8">Top 200 players by region, ranked by trophies.</p>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
            <div className="flex items-center gap-2.5 bg-black/10 border border-black/20 rounded px-4 py-2.5 dark:bg-white/10 dark:border-white/20 w-full md:w-64">
              <Search size={13} className="text-zinc-500 shrink-0 dark:text-white/60" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search players"
                className="bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 w-full dark:text-white dark:placeholder:text-white/40"
              />
            </div>

            <select
              value={activeRegion}
              onChange={e => setActiveRegion(e.target.value)}
              className="bg-black/10 border border-black/20 rounded px-3 py-2.5 text-xs text-zinc-900 outline-none dark:bg-white/10 dark:border-white/20 dark:text-white"
            >
              {allData.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="space-y-12">
          {filtered.map((region) => {
            const page = getPage(region.code)
            const totalPages = Math.ceil(region.players.length / PAGE_SIZE)
            const paginated = region.players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

            return (
              <section key={region.code}>
                {region.players.length === 0 ? (
                  <p className="text-zinc-400 text-sm py-8 dark:text-white/45">No data yet.</p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="grid grid-cols-[52px_1fr_auto_auto_24px] gap-4 px-5 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/50">
                        <span>#</span>
                        <span>Player</span>
                        <span className="hidden sm:block">Club</span>
                        <span>Trophies</span>
                        <span />
                      </div>

                      {paginated.map((player) => (
                        <Link
                          key={player.player_tag}
                          href={`/player/${player.player_tag.replace("#", "")}`}
                          className={`grid grid-cols-[52px_1fr_auto_auto_24px] gap-4 items-center px-5 py-4 transition-colors ${rankBg(player.rank)}`}
                        >
                          <span className={`text-base font-black tabular-nums ${rankColor(player.rank)}`}>
                            {player.rank}
                          </span>

                          <div className="min-w-0">
                            <p className="text-base font-semibold text-zinc-900 truncate dark:text-white">{player.player_name}</p>
                            <p className="text-xs text-zinc-400 font-mono dark:text-white/45">{player.player_tag}</p>
                          </div>

                          <span className="hidden sm:block text-sm text-zinc-400 truncate max-w-[160px] dark:text-white/50">
                            {player.club_name ?? "—"}
                          </span>

                          <div className="flex items-center gap-1.5 justify-end">
                            <Trophy size={12} className="text-red-500/50 dark:text-[#FFD400]/50 shrink-0" />
                            <span className="text-base font-bold text-red-500/80 dark:text-[#FFD400]/80 tabular-nums">
                              {formatNum(player.trophies)}
                            </span>
                          </div>

                          <ArrowRight size={14} className="text-zinc-400 dark:text-white/50" />
                        </Link>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1 mt-4">
                        <button
                          onClick={() => setPage(region.code, page - 1)}
                          disabled={page === 0}
                          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        {Array.from({ length: totalPages }, (_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setPage(region.code, idx)}
                            className={`w-7 h-7 text-xs font-semibold rounded transition-colors ${
                              idx === page
                                ? "bg-red-500 text-white dark:bg-[#FFD400] dark:text-black"
                                : "text-zinc-400 hover:text-zinc-900 hover:bg-black/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}

                        <button
                          onClick={() => setPage(region.code, page + 1)}
                          disabled={page === totalPages - 1}
                          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )
          })}
        </div>

        <div className="mt-16 border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-8 max-w-2xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/50 mb-4">About Player Rankings</p>
          <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed">
            Player rankings reflect the top 200 trophy earners across six regions: Global, United States, Korea, Brazil, Germany, and Japan. Rankings update automatically every 30 minutes using real-time data. Trophies shown represent a player's current season total. Click any player to view their full profile.
          </p>
        </div>
      </main>
    </div>
  )
}
