"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { EmptyState, StateButton, StateLink } from "@/components/PolishStates"

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { name: string; color: string }
}

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  brawler_name: string
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

export default function BrawlerLeaderboardClient({
  brawlers,
  data,
  activeBrawler,
}: {
  brawlers: Brawler[]
  data: Player[]
  activeBrawler: Brawler | null
}) {
  const router = useRouter()
  const [search, setSearch] = useState(activeBrawler?.name ?? "")
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = search.trim()
    ? brawlers.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : brawlers

  const totalPages = Math.ceil(data.length / PAGE_SIZE)
  const paginated = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function select(b: Brawler) {
    setSearch(b.name)
    setOpen(false)
    setPage(0)
    router.push(`/leaderboards/brawlers?b=${b.id}`)
  }
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 pt-12 pb-24 max-md:px-4 max-md:pt-8 max-md:pb-[64px] max-[480px]:pt-6 max-[480px]:pb-12">
      <div className="mb-8 flex items-end justify-between gap-8 max-md:flex-col max-md:items-start">
        <div className="min-w-0">
          <h1 className="m-0 text-[clamp(34px,5vw,56px)] leading-[1.07] font-semibold tracking-[-0.01em] text-[var(--ink)]">Brawler Leaderboards</h1>
          <p className="mt-3 mb-0 max-w-[640px] text-[17px] leading-[1.47] tracking-[-0.022em] text-[var(--ink-3)]">Pick a brawler to see the highest-ranked players using that brawler worldwide.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 max-md:justify-start">
          <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{activeBrawler?.name ?? "Select brawler"}</span>
          <span className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[14px] font-normal tracking-[-0.016em] text-[var(--ink-2)]">{data.length.toLocaleString()} players</span>
        </div>
      </div>

      <div className="relative z-30 mb-8 flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--panel)] p-4 max-md:flex-col max-md:items-stretch">
        <div className="inline-flex gap-0.5 overflow-x-auto rounded-full border border-[var(--line)] bg-[var(--panel)] p-[3px] [scrollbar-width:none] max-md:w-full [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map(c => (
            <Link
              key={c.href}
              href={c.href}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-normal tracking-[-0.016em] no-underline transition-all max-md:flex-1 max-md:text-center ${c.href === "/leaderboards/brawlers" ? "bg-[var(--accent)] text-white" : "text-[var(--ink-3)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"}`}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 max-md:w-full max-md:flex-col max-md:items-stretch">
          <div className="relative w-60 shrink-0 max-md:w-full">
            <div className="flex h-11 w-full items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 text-[var(--ink)] transition-colors focus-within:border-[var(--accent)]">
              <Search size={13} className="shrink-0 text-[var(--ink-4)]" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                placeholder="Search brawler…"
                className="w-full border-0 bg-transparent text-[17px] tracking-[-0.022em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
              />
              {activeBrawler && (
                <BrawlImage
                  src={brawlerIconUrl(activeBrawler.id)}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 object-contain"
                  sizes="20px"
                />
              )}
            </div>

            {open && filtered.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute top-[calc(100%+6px)] right-0 left-0 z-[80] max-h-[280px] overflow-y-auto rounded-[18px] border border-[var(--line-2)] bg-[var(--panel)]"
              >
                {filtered.map(b => (
                  <button
                    key={b.id}
                    onMouseDown={() => select(b)}
                    className="row-hover flex w-full cursor-pointer items-center gap-2.5 border-0 border-b border-[var(--line)] bg-transparent px-3 py-[9px] text-left"
                  >
                    <BrawlImage
                      src={brawlerIconUrl(b.id)}
                      alt={b.name}
                      width={26}
                      height={26}
                      className="size-[26px] shrink-0 object-contain"
                      sizes="26px"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{b.name}</div>
                      <div className="text-[10.5px] leading-snug tracking-[0.01em]" style={{ color: b.rarity.color }}>{b.rarity.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title={activeBrawler ? "No rankings for this brawler" : "Choose a brawler"}
          description={activeBrawler ? `${activeBrawler.name} does not have tracked leaderboard rows yet.` : "Search for a brawler to load their top global players."}
          action={activeBrawler ? <StateButton onClick={() => { setSearch(""); router.push("/leaderboards/brawlers") }}>Pick another brawler</StateButton> : <StateLink href="/brawlers">Browse brawlers</StateLink>}
        />
      ) : (
        <>
          <div className="leaderboard-summary relative mb-6 flex items-stretch justify-between gap-6 overflow-hidden border border-[var(--line)] p-8 max-md:flex-col max-sm:p-6" style={{ background: "linear-gradient(135deg, #EC4899 0%, #14B8A6 100%)" }}>
            <div className="relative z-10 flex min-w-0 items-center gap-3">
              {activeBrawler && (
                <BrawlImage
                  src={brawlerIconUrl(activeBrawler.id)}
                  alt=""
                  width={42}
                  height={42}
                  className="size-[42px] shrink-0 object-contain"
                  sizes="42px"
                />
              )}
              <div className="min-w-0">
                <p className="mb-1 text-[12px] leading-none tracking-[0.08em] text-white/70 uppercase">
                  Brawler Rankings
                </p>
                <h2 className="m-0 truncate text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] text-white">{activeBrawler?.name ?? "Select a brawler"}</h2>
              </div>
            </div>
            <div className="relative z-10 grid min-w-[min(420px,48%)] grid-cols-3 gap-2 max-md:min-w-0">
              <div className="min-w-0 rounded-[10px] border border-white/20 bg-black/30 px-3 py-2.5 backdrop-blur-xl">
                <span className="text-[10.5px] text-white/70">Players</span>
                <strong className="mt-0.5 block truncate text-[13px] font-bold text-white">{data.length.toLocaleString()}</strong>
              </div>
              <div className="min-w-0 rounded-[10px] border border-white/20 bg-black/30 px-3 py-2.5 backdrop-blur-xl">
                <span className="text-[10.5px] text-white/70">Leader</span>
                <strong className="mt-0.5 block truncate text-[13px] font-bold text-white">{data[0]?.player_name ?? "—"}</strong>
              </div>
              <div className="min-w-0 rounded-[10px] border border-white/20 bg-black/30 px-3 py-2.5 backdrop-blur-xl">
                <span className="text-[10.5px] text-white/70">Page</span>
                <strong className="mt-0.5 block truncate text-[13px] font-bold text-white">{page + 1}/{Math.max(totalPages, 1)}</strong>
              </div>
            </div>
          </div>

          {activeBrawler && (
            <div className="mb-3.5 grid grid-cols-3 gap-2.5 max-md:grid-cols-1">
              {data.slice(0, 3).map((player, index) => (
                <Link key={player.player_tag} href={`/player/${player.player_tag.replace("#", "")}`} className={`interactive-card top-rank-card top-rank-card-rank-${index + 1} grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border bg-[var(--panel)] p-3 text-inherit no-underline`}>
                  <span className="grid h-7 min-w-[34px] place-items-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-xs font-extrabold tabular-nums text-[var(--ink)]">#{player.rank}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-[var(--ink)]">{player.player_name}</div>
                    <div className="text-[10.5px] leading-snug tracking-[0.01em] tabular-nums text-[var(--ink-3)]">{player.player_tag}</div>
                  </div>
                  <div className="flex items-center justify-end whitespace-nowrap text-xs font-bold tabular-nums text-[var(--ink)]">
                    {formatNum(player.trophies)}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="leaderboard-table overflow-hidden rounded-[18px] border border-[var(--line)] bg-[var(--panel)]">
            <div className="leaderboard-header grid grid-cols-[48px_1fr_180px_100px_24px] gap-3 border-b border-[var(--line)] bg-[var(--panel-2)] px-5 py-2.5 max-md:grid-cols-[40px_1fr_90px_20px] max-md:px-3.5">
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">#</span>
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">Player</span>
              <span className="text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)] max-md:hidden">Club</span>
              <span className="text-right text-[10.5px] leading-snug tracking-[0.01em] text-[var(--ink-3)]">Trophies</span>
              <span />
            </div>

            {paginated.map((p, i) => (
              <Link
                key={p.player_tag}
                href={`/player/${p.player_tag.replace("#", "")}`}
                className={`interactive-row leaderboard-row grid grid-cols-[48px_1fr_180px_100px_24px] items-center gap-3 px-5 py-3 text-inherit no-underline max-md:grid-cols-[40px_1fr_90px_20px] max-md:px-3.5 ${p.rank <= 3 ? `leaderboard-rank-row-${p.rank} border-l-2` : ""}`}
                style={{ borderBottom: i < paginated.length - 1 ? "1px solid var(--line)" : "none" }}
              >
                <span className="leaderboard-rank text-[13px] font-medium tabular-nums text-[var(--ink-3)]">
                  {String(p.rank).padStart(2, "0")}
                </span>

                <div className="leaderboard-main min-w-0">
                  <div className="truncate text-[13px] font-medium text-[var(--ink)]">{p.player_name}</div>
                  <div className="text-[10.5px] leading-snug tabular-nums text-[var(--ink-4)]">{p.player_tag}</div>
                </div>

                <span className="leaderboard-secondary truncate text-xs text-[var(--ink-3)] max-md:hidden">
                  {p.club_name ?? "—"}
                </span>

                <div className="leaderboard-metric flex items-center justify-end">
                  <span className="text-[13px] font-medium tabular-nums text-[var(--ink)]">
                    {formatNum(p.trophies)}
                  </span>
                </div>

                <ArrowRight size={13} className="leaderboard-arrow text-[var(--ink-4)]" />
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-1">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
                className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--line)] bg-transparent text-[var(--ink-3)] disabled:cursor-default disabled:opacity-30"
              >
                <ChevronLeft size={13} />
              </button>

              {getPageItems(page, totalPages).map((idx, i) => idx === "..." ? (
                <span key={`ellipsis-${i}`} className="grid size-[30px] place-items-center text-xs text-[var(--ink-4)]">…</span>
              ) : (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`grid size-[30px] cursor-pointer place-items-center rounded-lg text-xs font-semibold ${idx === page ? "border border-transparent bg-[var(--accent)] text-[#fcfbf8]" : "border border-[var(--line)] bg-transparent text-[var(--ink-3)]"}`}
                >
                  {idx + 1}
                </button>
              ))}

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages - 1}
                className="grid size-[30px] cursor-pointer place-items-center rounded-lg border border-[var(--line)] bg-transparent text-[var(--ink-3)] disabled:cursor-default disabled:opacity-30"
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
