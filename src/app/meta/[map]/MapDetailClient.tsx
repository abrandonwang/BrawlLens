"use client"

import { useState, useMemo } from "react"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"

interface BrawlerStat {
  brawlerId: number
  name: string
  picks: number
  wins: number
  winRate: number
}

type SortKey = "winRate" | "wins" | "picks"

function getTierInfo(winRate: number) {
  if (winRate >= 58) return { label: "S" }
  if (winRate >= 54) return { label: "A" }
  if (winRate >= 50) return { label: "B" }
  if (winRate >= 46) return { label: "C" }
  return { label: "D" }
}

function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}

function formatBrawlerName(name: string): string {
  return name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
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
      .filter(b => {
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

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 40px 80px" }}>

      <Link href="/meta" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-4)", textDecoration: "none", marginBottom: 28, transition: "color 0.14s" }}>
        <ArrowLeft size={12} />
        Maps
      </Link>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isLive && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--win-soft)", border: "1px solid var(--win-line)", borderRadius: 99, padding: "3px 10px", marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--win)", flexShrink: 0, boxShadow: "0 0 6px var(--win)" }} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--win)", letterSpacing: "0.1em" }}>LIVE</span>
            </div>
          )}
          <h1 className="bl-h-display">{mapName}</h1>
          <span className="bl-caption" style={{ marginTop: 4, display: "block" }}>{totalBattles.toLocaleString()} battles</span>
        </div>

        {imageUrl && (
          <div style={{ flexShrink: 0, height: 160, display: "flex", alignItems: "center" }}>
            <BrawlImage
              src={imageUrl}
              alt={mapName}
              width={260}
              height={160}
              style={{ height: "100%", width: "auto", maxWidth: 260, borderRadius: 12, display: "block", objectFit: "contain" }}
              sizes="260px"
            />
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="flex min-h-11 w-[220px] items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-4 text-[var(--ink)] transition-[border-color,box-shadow] focus-within:border-[var(--line-2)] focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.1)] max-[520px]:w-full">
          <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
          <input className="w-full border-0 bg-transparent text-[16px] font-[inherit] text-inherit outline-none placeholder:text-[var(--ink-4)]" placeholder="Search brawler…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>

        <div className="inline-flex max-w-full gap-0.5 overflow-x-auto rounded-lg border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sortOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`relative cursor-pointer rounded-md border-0 px-[15px] py-[7px] text-[14px] font-normal transition-all ${sortBy === opt.key ? "bg-[var(--ink)] text-[#fcfbf8] shadow-[var(--shadow-lift)]" : "bg-transparent text-[var(--ink-3)] hover:bg-[color-mix(in_srgb,var(--panel-2)_70%,transparent)] hover:text-[var(--ink)]"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="bl-caption">Min picks</span>
          <select value={minPicks} onChange={e => setMinPicks(Number(e.target.value))} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 8px", fontSize: 12, color: "var(--ink)", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
            <option value={5}>5+</option>
            <option value={10}>10+</option>
            <option value={25}>25+</option>
            <option value={50}>50+</option>
            <option value={100}>100+</option>
          </select>
        </div>

        <span className="bl-caption ml-auto">{filtered.length} brawlers</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No brawlers match"
          description="Your search or minimum pick filter removed every brawler from this map."
          action={<StateButton onClick={() => { setSearchQuery(""); setMinPicks(5) }}>Clear filters</StateButton>}
          secondary={<StateLink href="/meta">All maps</StateLink>}
        />
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] transition-[border-color] duration-200 hover:border-[var(--line-2)] max-[600px]:border-0 max-[600px]:bg-transparent">
          <div className="hidden grid-cols-[44px_minmax(0,1.25fr)_minmax(116px,0.9fr)_72px_72px_48px] items-center gap-4 border-b border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 min-[760px]:grid">
            <span />
            <span className="text-[12px] font-normal text-[var(--ink-4)]">Brawler</span>
            <span className="text-[12px] font-normal text-[var(--ink-4)]">Win rate</span>
            <span className="text-right text-[12px] font-normal text-[var(--ink-4)]">Wins</span>
            <span className="text-right text-[12px] font-normal text-[var(--ink-4)]">Picks</span>
            <span className="text-center text-[12px] font-normal text-[var(--ink-4)]">Tier</span>
          </div>

          <div className="hidden min-[760px]:block">
            {filtered.map((brawler) => {
              const tier = getTierInfo(brawler.winRate)
              return (
                <div
                  key={brawler.brawlerId}
                  className="grid min-h-[64px] grid-cols-[44px_minmax(0,1.25fr)_minmax(116px,0.9fr)_72px_72px_48px] items-center gap-4 border-b border-[var(--line)] bg-[var(--panel)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--hover-bg)]"
                >
                  <div className="grid size-10 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-2)]">
                    <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={34} height={34} className="size-[34px] object-contain" loading="lazy" sizes="34px" />
                  </div>

                  <span className="min-w-0 truncate text-[14px] font-semibold text-[var(--ink)]">
                    {formatBrawlerName(brawler.name)}
                  </span>

                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bl-num w-[48px] shrink-0 text-[13px] font-semibold text-[var(--ink)]">{brawler.winRate.toFixed(1)}%</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_16%,transparent)]">
                      <div className="h-full rounded-full bg-[var(--ink)] opacity-75 transition-[width]" style={{ width: `${getBarWidth(brawler.winRate)}%` }} />
                    </div>
                  </div>

                  <span className="bl-num text-right text-[13px] font-normal text-[var(--ink-3)]">{formatNum(brawler.wins)}</span>
                  <span className="bl-num text-right text-[13px] font-normal text-[var(--ink-3)]">{formatNum(brawler.picks)}</span>

                  <div className="flex justify-center">
                    <span className="inline-flex size-7 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel-2)] text-[11px] font-semibold text-[var(--ink-3)]">
                      {tier.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-2 min-[760px]:hidden">
            {filtered.map((brawler) => {
              const tier = getTierInfo(brawler.winRate)
              return (
                <div key={brawler.brawlerId} className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 shadow-[var(--shadow-lift)]">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel-2)]">
                      <BrawlImage src={brawlerIconUrl(brawler.brawlerId)} alt={brawler.name} width={34} height={34} className="size-[34px] object-contain" loading="lazy" sizes="34px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-[var(--ink)]">{formatBrawlerName(brawler.name)}</div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--ink-4)]">
                        <span>{formatNum(brawler.picks)} picks</span>
                        <span className="size-1 rounded-full bg-[var(--ink-5)]" />
                        <span>{formatNum(brawler.wins)} wins</span>
                      </div>
                    </div>
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--panel-2)] text-[11px] font-semibold text-[var(--ink-3)]">
                      {tier.label}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="bl-num w-[52px] shrink-0 text-[13px] font-semibold text-[var(--ink)]">{brawler.winRate.toFixed(1)}%</span>
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--ink)_16%,transparent)]">
                      <div className="h-full rounded-full bg-[var(--ink)] opacity-75 transition-[width]" style={{ width: `${getBarWidth(brawler.winRate)}%` }} />
                    </div>
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
