"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { playerProfileHref } from "@/lib/leaderboardUtils"

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
  if (rank === 1) return "border-l-2 border-l-[var(--line-2)]"
  if (rank === 2) return "border-l-2 border-l-[var(--line-2)]"
  if (rank === 3) return "border-l-2 border-l-[var(--line-2)]"
  return "bg-[var(--panel)] border-l-2 border-l-transparent"
}

function rankColor(rank: number) {
  if (rank <= 3) return "text-[var(--ink)]"
  return "text-[var(--ink-3)]"
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
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">{brawlerName}</h1>
      <p className="text-sm text-zinc-500 dark:text-white/40 mb-10">Top 200 global players ranked for {brawlerName}.</p>

      <div className="space-y-1">
        <div className="grid grid-cols-[52px_1fr_auto_auto_24px] gap-4 px-5 py-2 text-[10px] font-semibold tracking-[0.08em] text-zinc-400 uppercase dark:text-white/50 max-md:hidden">
          <span>#</span>
          <span>Player</span>
          <span className="hidden sm:block">Club</span>
          <span>Score</span>
          <span />
        </div>

        {paginated.map((player) => (
          <Link
            key={player.player_tag}
            href={playerProfileHref(player.player_tag)}
            className={`interactive-row group grid min-h-[58px] grid-cols-[52px_1fr_auto_auto_24px] items-center gap-4 rounded-xl bg-[var(--panel)] px-5 py-4 text-inherit no-underline transition-colors hover:bg-[var(--hover-bg)] max-md:grid-cols-[40px_minmax(0,1fr)_90px] max-md:gap-2.5 max-md:border max-md:border-[var(--line)] max-md:p-3 max-md:shadow-[var(--shadow-lift)] ${rankBg(player.rank)}`}
          >
            <span className={`text-base font-semibold tabular-nums max-md:grid max-md:h-[34px] max-md:min-w-[34px] max-md:place-items-center max-md:rounded-lg max-md:border max-md:border-[var(--line)] max-md:bg-[var(--panel-2)] max-md:text-[12px] ${rankColor(player.rank)}`}>
              {player.rank}
            </span>

            <div className="min-w-0">
              <p className="text-base font-semibold text-zinc-900 truncate dark:text-white">{player.player_name}</p>
              <p className="text-xs text-zinc-400 tabular-nums dark:text-white/45">{player.player_tag}</p>
            </div>

            <span className="hidden max-w-[160px] truncate text-sm text-zinc-400 sm:block dark:text-white/50 max-md:hidden">
              {player.club_name ?? "-"}
            </span>

            <div className="flex items-center justify-end max-md:whitespace-nowrap">
              <span className="text-base font-bold tabular-nums text-[var(--ink)]">
                {player.trophies.toLocaleString()}
              </span>
            </div>

            <ArrowRight size={14} className="text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600 dark:text-white/50 max-md:hidden" />
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
                  ? "bg-red-500 text-white dark:bg-[var(--accent)] dark:text-black"
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
          Brawler rankings show the top 200 global players for {brawlerName}. Rankings are updated every 30 minutes using real-time data. Click any player to view their full profile.
        </p>
      </div>
    </main>
  )
}
