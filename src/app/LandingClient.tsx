"use client"

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, BarChart3, CircleDot, Search, Sparkle, Trophy } from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { SkeletonBlock } from "@/components/PolishStates"
import { formatBrawlerName, formatNum, formatTrophies } from "@/lib/format"
import { sanitizePlayerTag } from "@/lib/validation"

interface PopularBrawler {
  id: number
  name: string
  picks: number
  wins: number
  winRate: number
  pickRate: number
}

interface LeaderboardPlayer {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
}

interface RegionData {
  code: string
  label: string
  players: LeaderboardPlayer[]
}

const FALLBACK_BRAWLERS = [
  { id: 16000005, name: "Spike", picks: 4800, wins: 2928, winRate: 61, pickRate: 14.8 },
  { id: 16000023, name: "Leon", picks: 4200, wins: 2478, winRate: 59, pickRate: 12.9 },
  { id: 16000027, name: "8-Bit", picks: 3600, wins: 2052, winRate: 57, pickRate: 11.1 },
] satisfies PopularBrawler[]

const LINKS = [
  { href: "/leaderboards/players", label: "Leaderboards", description: "Players, clubs, and brawler ladders.", icon: Trophy },
  { href: "/meta", label: "Meta", description: "Maps, picks, wins, and current pressure.", icon: BarChart3 },
  { href: "/edit", label: "Lensboard", description: "Build a compact board for your read.", icon: CircleDot },
] as const

function fetchJson<T>(url: string, fallback: T): Promise<T> {
  return fetch(url, { cache: "no-store" })
    .then(response => response.ok ? response.json() : fallback)
    .catch(() => fallback)
}

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[10px] border border-white/[0.075] bg-[#101113] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${className}`}>
      {children}
    </div>
  )
}

function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-[#f1d36a] px-5 text-[13px] font-black text-[#0d0d0e] no-underline transition-colors hover:bg-[#ffe486]"
    >
      {children}
      <ArrowUpRight size={15} strokeWidth={2.4} />
    </Link>
  )
}

function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-[9px] border border-white/[0.095] bg-[#151619] px-5 text-[13px] font-bold text-[#f3f0ea] no-underline transition-colors hover:border-white/[0.18] hover:bg-[#1a1b1f]"
    >
      {children}
    </Link>
  )
}

function ProductLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string
  label: string
  description: string
  icon: typeof Trophy
}) {
  return (
    <Link href={href} className="group block text-inherit no-underline">
      <Surface className="h-full p-4 transition-colors group-hover:border-white/[0.15] group-hover:bg-[#141518]">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-9 place-items-center rounded-[8px] border border-white/[0.08] bg-[#17181b] text-[#f1d36a]">
            <Icon size={18} strokeWidth={2.1} />
          </span>
          <ArrowUpRight size={15} strokeWidth={2.3} className="mt-1 text-[#777b84] transition-colors group-hover:text-[#f3f0ea]" />
        </div>
        <h2 className="mt-5 mb-0 text-[17px] font-black tracking-[-0.02em] text-[#f7f4ef]">{label}</h2>
        <p className="mt-1.5 mb-0 text-[13px] font-medium leading-[1.45] text-[#a7a39c]">{description}</p>
      </Surface>
    </Link>
  )
}

function PlayerSearch() {
  const router = useRouter()
  const [lookup, setLookup] = useState("")
  const playerTag = sanitizePlayerTag(lookup)
  const invalid = lookup.trim().length > 0 && !playerTag

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!playerTag) return
    router.push(`/player/${encodeURIComponent(playerTag)}`)
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-[620px]">
      <div className={`flex h-[52px] items-center gap-3 rounded-[10px] border bg-[#111214] px-4 transition-colors ${invalid ? "border-[#e46d6d]" : "border-white/[0.095] focus-within:border-white/[0.22]"}`}>
        <Search size={18} strokeWidth={2.2} className="shrink-0 text-[#868a91]" />
        <input
          value={lookup}
          onChange={event => setLookup(event.target.value.toUpperCase())}
          placeholder="Search player tag"
          autoCapitalize="characters"
          spellCheck={false}
          autoComplete="off"
          aria-label="Search player tag"
          className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-bold text-[#f7f4ef] outline-none placeholder:text-[#696d74]"
        />
        <button
          type="submit"
          className="h-8 cursor-pointer rounded-[7px] border border-white/[0.08] bg-[#1a1b1f] px-3 text-[12px] font-black text-[#d9d4c9] transition-colors hover:border-white/[0.16] hover:bg-[#202126]"
        >
          Open
        </button>
      </div>
      <p className={`mt-2 mb-0 text-[12px] font-medium ${invalid ? "text-[#ffaaa5]" : "text-[#777b84]"}`}>
        {invalid ? "Use a valid Brawl Stars tag, like YP90U0YL." : "Paste a tag to jump straight into a profile."}
      </p>
    </form>
  )
}

function BrawlerStrip({ brawlers, loading }: { brawlers: PopularBrawler[]; loading: boolean }) {
  const rows = loading ? Array.from({ length: 3 }).map(() => null) : brawlers.slice(0, 3)

  return (
    <Surface className="p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#777b84]">Current signal</p>
          <h2 className="mt-1 mb-0 text-[18px] font-black tracking-[-0.02em] text-[#f7f4ef]">Popular brawlers</h2>
        </div>
        <Link href="/brawlers" className="text-[12px] font-bold text-[#d9d4c9] no-underline hover:text-white">View all</Link>
      </div>
      <div className="grid gap-2">
        {rows.map((brawler, index) => brawler ? (
          <Link
            key={brawler.id}
            href={`/brawlers?open=${brawler.id}`}
            className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 rounded-[8px] px-2 py-2 text-inherit no-underline transition-colors hover:bg-white/[0.04]"
          >
            <BrawlImage src={brawlerIconUrl(brawler.id)} alt="" width={34} height={34} className="size-[34px] rounded-[8px] object-cover" sizes="34px" />
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-black text-[#f7f4ef]">{formatBrawlerName(brawler.name)}</span>
              <span className="mt-0.5 block truncate text-[12px] font-medium text-[#8c9097]">{formatNum(brawler.picks)} picks</span>
            </span>
            <span className="font-mono text-[13px] font-black tabular-nums text-[#f1d36a]">{brawler.winRate.toFixed(1)}%</span>
          </Link>
        ) : (
          <div key={`brawler-${index}`} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2">
            <SkeletonBlock className="size-[34px]" />
            <span className="min-w-0">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="mt-2 h-2.5 w-16" />
            </span>
            <SkeletonBlock className="h-3.5 w-12" />
          </div>
        ))}
      </div>
    </Surface>
  )
}

function LeaderboardStrip({ players, loading }: { players: LeaderboardPlayer[]; loading: boolean }) {
  const rows = loading ? Array.from({ length: 5 }).map(() => null) : players.slice(0, 5)

  return (
    <Surface className="p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#777b84]">Global ladder</p>
          <h2 className="mt-1 mb-0 text-[18px] font-black tracking-[-0.02em] text-[#f7f4ef]">Top players</h2>
        </div>
        <Link href="/leaderboards/players" className="text-[12px] font-bold text-[#d9d4c9] no-underline hover:text-white">Open</Link>
      </div>
      <div className="grid gap-1">
        {rows.map((player, index) => player ? (
          <Link
            key={player.player_tag}
            href={`/player/${encodeURIComponent(player.player_tag.replace(/^#/, ""))}`}
            className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-3 rounded-[8px] px-2 py-2 text-inherit no-underline transition-colors hover:bg-white/[0.04]"
          >
            <span className="font-mono text-[13px] font-black text-[#aeb2bb]">{player.rank}</span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-black text-[#f7f4ef]">{player.player_name}</span>
              <span className="mt-0.5 block truncate text-[12px] font-medium text-[#8c9097]">{player.club_name ?? player.player_tag}</span>
            </span>
            <span className="font-mono text-[13px] font-black tabular-nums text-[#f7f4ef]">{formatTrophies(player.trophies)}</span>
          </Link>
        ) : (
          <div key={`player-${index}`} className="grid grid-cols-[26px_minmax(0,1fr)_auto] items-center gap-3 px-2 py-2">
            <SkeletonBlock className="h-3.5 w-4" />
            <span className="min-w-0">
              <SkeletonBlock className="h-3.5 w-28" />
              <SkeletonBlock className="mt-2 h-2.5 w-20" />
            </span>
            <SkeletonBlock className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </Surface>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#777b84]">{label}</p>
      <div className="mt-2 font-mono text-[22px] font-black tabular-nums tracking-[-0.03em] text-[#f7f4ef]">{value}</div>
    </div>
  )
}

export default function LandingClient() {
  const [popular, setPopular] = useState<PopularBrawler[]>([])
  const [regions, setRegions] = useState<RegionData[]>([])
  const [loadingPopular, setLoadingPopular] = useState(true)
  const [loadingRegions, setLoadingRegions] = useState(true)

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    let active = true
    fetchJson<{ brawlers?: PopularBrawler[] }>("/api/brawlers/popular?limit=8", { brawlers: [] }).then(data => {
      if (!active) return
      setPopular(data.brawlers ?? [])
      setLoadingPopular(false)
    })
    fetchJson<{ regions?: RegionData[] }>("/api/leaderboards/top?limit=5", { regions: [] }).then(data => {
      if (!active) return
      setRegions(data.regions ?? [])
      setLoadingRegions(false)
    })
    return () => {
      active = false
    }
  }, [])

  const brawlers = useMemo(() => popular.length ? popular : FALLBACK_BRAWLERS, [popular])
  const globalPlayers = regions.find(region => region.code === "global")?.players ?? []
  const totalPicks = brawlers.reduce((sum, brawler) => sum + brawler.picks, 0)
  const topWinRate = brawlers[0]?.winRate ?? null

  return (
    <main className="min-h-[calc(100dvh-60px)] bg-[#070708] text-[#f7f4ef]">
      <section className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 pt-20 pb-16 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:pt-24">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#111214] px-3 py-1.5 text-[12px] font-bold text-[#c8c3ba]">
            <Sparkle size={14} strokeWidth={2.2} className="text-[#f1d36a]" />
            Brawl Stars analytics
          </div>

          <h1 className="mt-7 mb-0 max-w-[780px] text-[clamp(46px,7.2vw,88px)] font-black leading-[0.92] tracking-[-0.065em] text-[#f7f4ef]">
            Clean reads for noisy matches.
          </h1>
          <p className="mt-6 mb-0 max-w-[620px] text-[17px] font-medium leading-[1.6] text-[#aaa59c]">
            BrawlLens keeps leaderboards, brawler performance, map trends, and player lookups in one quiet workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryLink href="/leaderboards/players">Open leaderboards</PrimaryLink>
            <SecondaryLink href="/meta">View meta</SecondaryLink>
          </div>

          <PlayerSearch />
        </div>

        <Surface className="p-5">
          <p className="m-0 text-[11px] font-black uppercase tracking-[0.12em] text-[#777b84]">Snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-5">
            <Stat label="Tracked picks" value={loadingPopular ? <SkeletonBlock className="h-7 w-20" /> : formatNum(totalPicks)} />
            <Stat label="Top winrate" value={loadingPopular || topWinRate === null ? <SkeletonBlock className="h-7 w-16" /> : `${topWinRate.toFixed(1)}%`} />
            <Stat label="Brawlers" value={loadingPopular ? <SkeletonBlock className="h-7 w-12" /> : brawlers.length} />
            <Stat label="Regions" value={loadingRegions ? <SkeletonBlock className="h-7 w-12" /> : regions.length} />
          </div>
          <div className="mt-6 rounded-[9px] border border-white/[0.07] bg-[#0c0d0f] p-4">
            <p className="m-0 text-[13px] font-medium leading-[1.55] text-[#aaa59c]">
              Built for fast scans: fewer panels, tighter copy, and only the data you need to decide what to open next.
            </p>
          </div>
        </Surface>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-5 pb-16">
        <div className="grid gap-3 md:grid-cols-3">
          {LINKS.map(item => <ProductLink key={item.href} {...item} />)}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-4 px-5 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
        <BrawlerStrip brawlers={brawlers} loading={loadingPopular} />
        <LeaderboardStrip players={globalPlayers} loading={loadingRegions} />
      </section>
    </main>
  )
}
