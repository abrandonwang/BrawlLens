"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trophy, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  brawler_name: string
}

const PAGE_SIZE = 20

function rankBg(rank: number) {
  if (rank === 1) return "bg-[#FFD400]/10 dark:bg-[#FFD400]/[0.07] border-l-2 border-l-[#FFD400]/50 hover:bg-[#FFD400]/20 dark:hover:bg-[#FFD400]/[0.12]"
  if (rank === 2) return "bg-zinc-100 dark:bg-white/[0.04] border-l-2 border-l-zinc-400/30 hover:bg-zinc-200 dark:hover:bg-white/[0.07]"
  if (rank === 3) return "bg-orange-50 dark:bg-orange-900/10 border-l-2 border-l-orange-400/40 hover:bg-orange-100 dark:hover:bg-orange-900/20"
  return "bg-black/[0.02] dark:bg-white/[0.02] border-l-2 border-l-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
}

function rankColor(rank: number) {
  if (rank === 1) return "text-[#FFD400]"
  if (rank === 2) return "text-zinc-400"
  if (rank === 3) return "text-orange-400"
  return "text-zinc-400 dark:text-white/45"
}

export default function BrawlerRankingClient({ data, brawlerName }: { data: Player[]; brawlerName: string }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paginated = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <main className="flex-1 px-8 pt-6 pb-16 lg:px-12">
      <Link href="/leaderboards/brawlers" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-white/50 hover:text-zinc-700 dark:hover:text-white/60 transition-colors mb-6">
        <ArrowLeft size={12} /> Brawler Rankings
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">{brawlerName}</h1>
      <p className="text-sm text-zinc-500 dark:text-white/40 mb-10">Top 200 global players ranked by {brawlerName} trophies.</p>

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
                {player.trophies.toLocaleString()}
              </span>
            </div>

            <ArrowRight size={14} className="text-zinc-400 dark:text-white/50" />
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx)}
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
            onClick={() => setPage(p => p + 1)}
            disabled={page === totalPages - 1}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="mt-16 border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-8 max-w-2xl mx-auto text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-white/50 mb-4">About Brawler Rankings</p>
        <p className="text-sm text-zinc-500 dark:text-white/40 leading-relaxed">
          Brawler rankings show the top 200 global players for {brawlerName}, ranked by trophies earned with that brawler. Rankings are updated every 30 minutes using real-time data. Click any player to view their full profile.
        </p>
      </div>
    </main>
  )
}
