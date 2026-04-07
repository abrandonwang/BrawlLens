"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"

function getTierInfo(winRate: number) {
  if (winRate >= 58) return { label: "S", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }
  if (winRate >= 54) return { label: "A", color: "#FB923C", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" }
  if (winRate >= 50) return { label: "B", color: "#FACC15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" }
  if (winRate >= 46) return { label: "C", color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" }
  return { label: "D", color: "#71717A", bg: "rgba(113,113,122,0.08)", border: "rgba(113,113,122,0.2)" }
}

function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}

function getBrawlerImage(brawlerId: number): string {
  return `https://cdn.brawlify.com/brawlers/borderless/${brawlerId}.png`
}

function formatBrawlerName(name: string): string {
  return name.split(" ").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
}

interface Props {
  mapName: string
  imageUrl: string | null
  totalBattles: number
  brawlers: BrawlerStat[]
  isLive: boolean
}

export default function MapDetailClient({ mapName, imageUrl, totalBattles, brawlers, isLive }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [minPicks, setMinPicks] = useState(10)
  const [sortBy, setSortBy] = useState<SortKey>("picks")

  const filtered = useMemo(() => {
    return brawlers
      .filter((b) => {
        if (b.picks < minPicks) return false
        if (searchQuery && !formatBrawlerName(b.name).toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [brawlers, searchQuery, minPicks, sortBy])

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "picks", label: "Picks" },
    { key: "winRate", label: "Win Rate" },
    { key: "wins", label: "Wins" },
  ]

  // Shared grid configuration for header and rows
  const gridLayout = "grid-cols-[40px_1fr_75px_55px_36px] sm:grid-cols-[44px_1fr_110px_70px_70px_36px]"

  return (
    <main className="flex-1 px-4 sm:px-8 pt-6 pb-16 max-w-7xl mx-auto w-full">
      <Link href="/meta" className="inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-white/30 hover:text-zinc-700 dark:hover:text-white/60 transition-colors mb-6">
        <ArrowLeft size={12} /> Maps
      </Link>

      {/* Header: text left, image right */}
      <div className="flex flex-row items-center justify-between gap-4 mb-8 sm:mb-10">
        <div className="flex flex-col justify-center min-w-0">
          {isLive && (
            <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">Live in rotation</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1 sm:mb-2 truncate">
            {mapName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 dark:text-white/30">{totalBattles.toLocaleString()} battles</p>
        </div>

        {imageUrl && (
          <div className="shrink-0 w-24 sm:w-32 md:w-44 border-2 border-black/20 dark:border-white/20 overflow-hidden bg-black/[0.02] dark:bg-white/[0.02]">
            <img src={imageUrl} alt={mapName} className="w-full h-auto object-contain" />
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="relative w-full lg:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/20" />
          <input
            type="text"
            placeholder="Search brawler..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/[0.04] border border-black/[0.08] dark:bg-white/[0.04] dark:border-white/[0.08] pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/20 focus:outline-none focus:border-black/20 dark:focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort toggle */}
          <div className="flex flex-1 sm:flex-none items-center border border-black/10 dark:border-white/10 overflow-hidden">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`flex-1 sm:flex-none px-3 py-2.5 text-[10px] sm:text-xs font-semibold transition-colors whitespace-nowrap ${
                  sortBy === opt.key
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-black"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-white/40 dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-white/50 bg-black/[0.02] dark:bg-white/[0.02] px-2 border border-black/10 dark:border-white/10 sm:border-none sm:bg-transparent">
            <span className="whitespace-nowrap font-medium">Min picks:</span>
            <select
              value={minPicks}
              onChange={(e) => setMinPicks(Number(e.target.value))}
              className="bg-transparent py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none font-bold"
            >
              <option value={5}>5+</option>
              <option value={10}>10+</option>
              <option value={25}>25+</option>
              <option value={50}>50+</option>
              <option value={100}>100+</option>
            </select>
          </div>
        </div>
      </div>

      <p className="text-zinc-400 dark:text-white/30 text-[10px] uppercase tracking-widest mb-4">{filtered.length} brawlers</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-black/10 dark:border-white/10">
          <p className="text-zinc-400 dark:text-white/30 text-sm">No brawlers match your filters.</p>
        </div>
      ) : (
        <div className="min-w-full">
          {/* Table Header */}
          <div className={`grid ${gridLayout} gap-2 sm:gap-4 px-3 py-2 text-[9px] sm:text-[10px] font-bold text-zinc-400 dark:text-white/30 uppercase tracking-widest border-b border-black/5 dark:border-white/5`}>
            <span />
            <span>Brawler</span>
            <span>Win Rate</span>
            <span className="text-right hidden sm:block">Wins</span>
            <span className="text-right">Picks</span>
            <span className="text-center">Tier</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-black/[0.03] dark:divide-white/[0.03]">
            {filtered.map((brawler) => {
              const tier = getTierInfo(brawler.winRate)
              return (
                <div
                  key={brawler.brawlerId}
                  className={`grid ${gridLayout} gap-2 sm:gap-4 items-center px-3 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/[0.04] dark:bg-white/[0.04] flex items-center justify-center rounded-sm">
                    <img 
                      src={getBrawlerImage(brawler.brawlerId)} 
                      alt={brawler.name} 
                      className="w-7 h-7 sm:w-8 sm:h-8 object-contain" 
                      loading="lazy" 
                    />
                  </div>
                  
                  <span className="text-zinc-900 dark:text-white font-bold text-xs sm:text-sm truncate pr-2">
                    {formatBrawlerName(brawler.name)}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold tabular-nums shrink-0" style={{ color: tier.color }}>
                      {brawler.winRate.toFixed(1)}%
                    </span>
                    <div className="flex-1 h-1 bg-black/[0.04] dark:bg-white/[0.04] overflow-hidden hidden md:block">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ width: `${getBarWidth(brawler.winRate)}%`, backgroundColor: tier.color, opacity: 0.6 }} 
                      />
                    </div>
                  </div>

                  <span className="text-right text-zinc-400 dark:text-white/40 text-xs sm:text-sm tabular-nums hidden sm:block">
                    {brawler.wins >= 1000 ? `${(brawler.wins / 1000).toFixed(1)}k` : brawler.wins}
                  </span>

                  <span className="text-right text-zinc-400 dark:text-white/40 text-xs sm:text-sm tabular-nums">
                    {brawler.picks >= 1000 ? `${(brawler.picks / 1000).toFixed(1)}k` : brawler.picks}
                  </span>

                  <div className="flex justify-center">
                    <span 
                      className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 text-[9px] sm:text-[10px] font-black rounded-sm" 
                      style={{ 
                        color: tier.color, 
                        backgroundColor: tier.bg, 
                        border: `1px solid ${tier.border}` 
                      }}
                    >
                      {tier.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}