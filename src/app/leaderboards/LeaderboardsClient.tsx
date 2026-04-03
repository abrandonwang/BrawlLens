"use client"

import { useState, useEffect } from "react"
import { Search, Trophy, ChevronLeft, ChevronRight } from "lucide-react"

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

export default function LeaderboardsClient({ allData, updatedAt }: { allData: RegionData[]; updatedAt: string | null }) {
  const [activeRegion, setActiveRegion] = useState<string | null>("global")
  const [search, setSearch] = useState("")
  const [pageByRegion, setPageByRegion] = useState<Record<string, number>>({})

  // Reset pages when filters change
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
      <main className="flex-1 min-w-0 pt-6 pb-6 px-8 overflow-y-auto">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">Leaderboards</h1>
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
              value={activeRegion ?? "global"}
              onChange={e => setActiveRegion(e.target.value)}
              className="bg-black/10 border border-black/20 rounded px-3 py-2.5 text-xs text-zinc-900 outline-none dark:bg-white/10 dark:border-white/20 dark:text-white"
            >
              {allData.map((r) => (
                <option key={r.code} value={r.code}>{r.label}</option>
              ))}
            </select>

            {updatedAt && (
              <p className="text-[10px] text-zinc-400 dark:text-white/20 ml-auto hidden md:block">Updated {updatedAt}</p>
            )}
          </div>
        </section>

        <div className="space-y-12">
          {filtered.map((region) => {
            const page = getPage(region.code)
            const totalPages = Math.ceil(region.players.length / PAGE_SIZE)
            const paginated = region.players.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

            return (
              <section key={region.code}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest dark:text-white/70">{region.label}</h2>
                  <div className="flex-1 h-px bg-black/8 dark:bg-white/8" />
                </div>

                {region.players.length === 0 ? (
                  <p className="text-zinc-400 text-sm py-8 dark:text-white/25">No data yet.</p>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="grid grid-cols-[32px_1fr_auto_auto] gap-4 px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">
                        <span>#</span>
                        <span>Player</span>
                        <span className="hidden sm:block">Club</span>
                        <span className="text-right">Trophies</span>
                      </div>

                      {paginated.map((player, i) => (
                        <div
                          key={player.player_tag}
                          className="grid grid-cols-[32px_1fr_auto_auto] gap-4 items-center px-3 py-2.5 bg-black/[0.02] hover:bg-black/[0.04] transition-colors dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                        >
                          <span className={`text-xs font-black tabular-nums ${
                            player.rank === 1 ? "text-red-500 dark:text-[#FFD400]" : player.rank === 2 ? "text-zinc-500 dark:text-white/60" : player.rank === 3 ? "text-orange-400/70" : "text-zinc-400 dark:text-white/25"
                          }`}>
                            {player.rank}
                          </span>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 truncate dark:text-white">{player.player_name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono dark:text-white/25">{player.player_tag}</p>
                          </div>

                          <span className="hidden sm:block text-xs text-zinc-400 truncate max-w-[140px] dark:text-white/30">
                            {player.club_name ?? "—"}
                          </span>

                          <div className="flex items-center gap-1.5 justify-end">
                            <Trophy size={11} className="text-red-500/50 dark:text-[#FFD400]/50 shrink-0" />
                            <span className="text-sm font-bold text-red-500/80 dark:text-[#FFD400]/80 tabular-nums">
                              {player.trophies.toLocaleString()}
                            </span>
                          </div>
                        </div>
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
      </main>
    </div>
  )
}
