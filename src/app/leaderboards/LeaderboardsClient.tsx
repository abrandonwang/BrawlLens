"use client"

import { useState } from "react"
import { Search, Trophy } from "lucide-react"

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


export default function LeaderboardsClient({ allData, updatedAt }: { allData: RegionData[]; updatedAt: string | null }) {
  const [activeRegion, setActiveRegion] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const filtered = allData
    .filter((r) => activeRegion === null || r.code === activeRegion)
    .map((r) => ({
      ...r,
      players: r.players.filter(
        (p) =>
          p.player_name.toLowerCase().includes(search.toLowerCase()) ||
          p.player_tag.toLowerCase().includes(search.toLowerCase())
      ),
    }))

  return (
    <div className="flex flex-col">
      {/* Main */}
      <main className="flex-1 min-w-0 pt-6 pb-6 px-8 overflow-y-auto">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">Leaderboards</h1>
          <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40 mb-8">Top 200 players by region, ranked by trophies.</p>

          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
            {/* Search */}
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
              value={activeRegion ?? ""}
              onChange={e => setActiveRegion(e.target.value || null)}
              className="bg-black/10 border border-black/20 rounded px-3 py-2.5 text-xs text-zinc-900 outline-none dark:bg-white/10 dark:border-white/20 dark:text-white"
            >
              <option value="">All Regions</option>
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
          {filtered.map((region) => (
            <section key={region.code}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest dark:text-white/70">{region.label}</h2>
                <div className="flex-1 h-px bg-black/8 dark:bg-white/8" />
              </div>

              {region.players.length === 0 ? (
                <p className="text-zinc-400 text-sm py-8 dark:text-white/25">No data yet.</p>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-[32px_1fr_auto_auto] gap-4 px-3 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest dark:text-white/30">
                    <span>#</span>
                    <span>Player</span>
                    <span className="hidden sm:block">Club</span>
                    <span className="text-right">Trophies</span>
                  </div>

                  {region.players.map((player, i) => (
                    <div
                      key={player.player_tag}
                      className="grid grid-cols-[32px_1fr_auto_auto] gap-4 items-center px-3 py-2.5 bg-black/[0.02] hover:bg-black/[0.04] transition-colors dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                    >
                      <span className={`text-xs font-black tabular-nums ${
                        i === 0 ? "text-red-500 dark:text-[#FFD400]" : i === 1 ? "text-zinc-500 dark:text-white/60" : i === 2 ? "text-orange-400/70" : "text-zinc-400 dark:text-white/25"
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
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
