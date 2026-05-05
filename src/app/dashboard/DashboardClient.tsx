"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { SkeletonBlock } from "@/components/PolishStates"
import { formatBrawlerName, formatNum, formatTrophies } from "@/lib/format"
import { getModeName } from "@/lib/modes"
import { sanitizePlayerTag } from "@/lib/validation"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map: { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
  club: { name: string; tag: string; trophies: number } | null
}

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

interface TopBrawler {
  id: number
  name: string
  winRate: number
  picks: number
  score: number
  consistency: number
  bestMap: { name: string; mode: string; winRate: number } | null
}

interface RecentPlayer {
  tag: string
  viewedAt: number
}

const RECENTS_KEY = "brawllens_recent_players"

function openAssistant(query: string) {
  window.dispatchEvent(new CustomEvent("brawllens:open-assistant", { detail: { query } }))
}

function pct(part: number, total: number) {
  if (total <= 0) return "0%"
  return `${Math.round((part / total) * 100)}%`
}

export default function DashboardClient() {
  const router = useRouter()
  const [lookup, setLookup] = useState("")
  const [landing, setLanding] = useState<LandingData | null>(null)
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [topBrawler, setTopBrawler] = useState<TopBrawler | null>(null)
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const playerTag = sanitizePlayerTag(lookup)
  const invalidLookup = lookup.trim().length > 0 && !playerTag

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]") as RecentPlayer[]
      setRecentPlayers(parsed.filter(item => sanitizePlayerTag(item.tag)).slice(0, 5))
    } catch {
      setRecentPlayers([])
    }
  }, [])

  useEffect(() => {
    Promise.all([
      fetch("/api/landing").then(r => r.ok ? r.json() : null),
      fetch("/api/meta").then(r => r.ok ? r.json() : { modes: [] }),
      fetch("/api/brawlers/top").then(r => r.ok ? r.json() : { brawler: null }),
    ])
      .then(([landingData, metaData, topData]) => {
        setLanding(landingData)
        setModes((metaData?.modes ?? []).filter((m: ModeInfo) => m.mode.toLowerCase() !== "unknown"))
        setTopBrawler(topData?.brawler ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalBattles = useMemo(() => modes.reduce((sum, mode) => sum + mode.totalBattles, 0), [modes])
  const totalMaps = useMemo(() => {
    const names = new Set<string>()
    modes.forEach(mode => mode.maps.forEach(map => names.add(map.name)))
    return names.size
  }, [modes])
  const topMode = modes[0] ?? null

  const topMaps = useMemo(() => {
    return modes
      .flatMap(mode => mode.maps.map(map => ({ ...map, mode: mode.mode })))
      .sort((a, b) => b.battles - a.battles)
      .slice(0, 8)
  }, [modes])

  const liveMaps = useMemo(() => topMaps.slice(0, 6), [topMaps])

  const metaSignals = useMemo(() => {
    const signals: { label: string; value: string; href: string }[] = []
    if (topMode) {
      signals.push({
        label: "Highest volume mode",
        value: `${getModeName(topMode.mode)} owns ${pct(topMode.totalBattles, totalBattles)} of tracked battles`,
        href: "/meta",
      })
    }
    if (topMaps[0]) {
      signals.push({
        label: "Most active map",
        value: `${topMaps[0].name} leads with ${formatNum(topMaps[0].battles)} battles`,
        href: `/meta?open=${encodeURIComponent(topMaps[0].name)}`,
      })
    }
    if (topBrawler) {
      signals.push({
        label: "Brawler signal",
        value: `${formatBrawlerName(topBrawler.name)} is scoring ${topBrawler.score.toFixed(1)} across the meta`,
        href: `/brawlers?open=${topBrawler.id}`,
      })
    }
    return signals
  }, [topMode, topMaps, totalBattles, topBrawler])

  function submitLookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!playerTag) return
    const nextRecent = [
      { tag: playerTag, viewedAt: Date.now() },
      ...recentPlayers.filter(item => item.tag !== playerTag),
    ].slice(0, 6)
    localStorage.setItem(RECENTS_KEY, JSON.stringify(nextRecent))
    router.push(`/player/${encodeURIComponent(playerTag)}`)
  }

  const topPlayerHref = landing?.player ? `/player/${encodeURIComponent(landing.player.tag.replace(/^#/, ""))}` : "/leaderboards/players"
  const brawlerForCard = topBrawler
    ? { id: topBrawler.id, name: topBrawler.name, winRate: topBrawler.winRate, picks: topBrawler.picks, score: topBrawler.score, bestMap: topBrawler.bestMap }
    : landing?.brawler
      ? { id: landing.brawler.id, name: landing.brawler.name, winRate: landing.brawler.winRate, picks: null, score: null, bestMap: null }
      : null

  return (
    <main className="relative min-h-[calc(100dvh-64px)] overflow-x-hidden">
      <div className="hero-bg hero-bg-b" />
      <div className="relative z-[1] mx-auto w-full max-w-[1220px] px-6 pb-20 pt-10 max-md:px-4 max-md:pt-7 max-sm:px-3.5 max-sm:pb-14">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5 max-md:grid-cols-1 max-md:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-[clamp(28px,7vw,46px)] font-semibold leading-none tracking-[-0.024em] text-[var(--ink)]">
              Dashboard
            </h1>
            <p className="m-0 mt-3 max-w-none whitespace-nowrap text-[15px] leading-[1.55] text-[var(--ink-3)] max-xl:whitespace-normal">
              A live command center for players, maps, brawlers, leaderboards, and AI-assisted reads.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openAssistant("Give me the most important BrawlLens meta signals right now.")}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3.5 text-[13px] font-medium text-[var(--ink-2)] shadow-[var(--shadow-lift)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)] max-sm:w-full"
          >
            <Image src="/ai-sparkle-512.png" alt="" width={18} height={18} className="size-[18px] shrink-0" />
            Ask AI
          </button>
        </div>

        <section className="mb-3.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5 max-[420px]:grid-cols-1">
          {[
            { label: "Tracked battles", value: loading ? null : formatNum(totalBattles) },
            { label: "Maps indexed", value: loading ? null : String(totalMaps) },
            { label: "Top mode", value: loading ? null : topMode ? getModeName(topMode.mode) : "-" },
            { label: "Top player", value: loading ? null : landing?.player ? landing.player.name : "-" },
            { label: "Top club", value: loading ? null : landing?.club ? landing.club.name : "-" },
          ].map(item => (
              <article key={item.label} className="min-h-[78px] rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] p-3.5 backdrop-blur-xl">
                <div className="mb-3 text-[12px] text-[var(--ink-4)]">{item.label}</div>
                {item.value === null ? (
                  <SkeletonBlock className="h-5 w-24" />
                ) : (
                  <div className="truncate text-[18px] font-semibold leading-tight tracking-[-0.018em] text-[var(--ink)]">{item.value}</div>
                )}
              </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-2.5 sm:grid-cols-6 sm:gap-3.5 lg:grid-cols-12">
          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 lg:col-span-5">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="min-w-0">
                <h2 className="m-0 text-[clamp(23px,7vw,28px)] font-semibold leading-[1.08] tracking-[-0.02em] text-[var(--ink)]">
                  Open a player profile.
                </h2>
                <p className="mt-2 mb-5 max-w-[460px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
                  Pull trophy history context, brawler depth, readiness signals, and AI notes from a player tag.
                </p>
                <form onSubmit={submitLookup} className={`flex h-[54px] items-center gap-2 rounded-lg border bg-[var(--bg)] px-3 transition-colors ${invalidLookup ? "border-[var(--loss-line)]" : "border-[var(--line)] focus-within:border-[var(--line-2)]"}`}>
                  <input
                    value={lookup}
                    onChange={e => setLookup(e.target.value)}
                    placeholder="Player tag"
                    className="min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium tracking-[-0.015em] text-[var(--ink)] outline-none placeholder:text-[var(--ink-4)]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="submit"
                    disabled={!playerTag}
                    className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-[var(--ink)] text-[var(--bg)] shadow-[var(--shadow-lift)] transition-colors hover:bg-[var(--accent-focus)] disabled:cursor-default disabled:opacity-35"
                    aria-label="Open player"
                  >
                    <span className="text-[12px] font-semibold">`{'>'}`</span>
                  </button>
                </form>
                <div className={`mt-2 min-h-5 text-[12px] ${invalidLookup ? "text-[var(--loss)]" : "text-[var(--ink-4)]"}`}>
                  {invalidLookup ? "That does not look like a valid player tag." : "Tags work with or without #."}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-[560px]:grid-cols-1">
                <Link href={topPlayerHref} className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)]">
                  <div className="mb-2 text-[12px] text-[var(--ink-3)]">Global leader</div>
                  {loading ? (
                    <SkeletonBlock className="h-[42px] w-full" />
                  ) : (
                    <>
                      <div className="truncate text-[16px] font-semibold text-[var(--ink)]">{landing?.player?.name ?? "Open rankings"}</div>
                      <div className="mt-1 text-[12px] text-[var(--ink-4)]">
                        {landing?.player ? `${formatTrophies(landing.player.trophies)} trophies` : "Browse top players"}
                      </div>
                    </>
                  )}
                </Link>
                <Link href="/leaderboards/clubs" className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)]">
                  <div className="mb-2 text-[12px] text-[var(--ink-3)]">Top club</div>
                  {loading ? (
                    <SkeletonBlock className="h-[42px] w-full" />
                  ) : (
                    <>
                      <div className="truncate text-[16px] font-semibold text-[var(--ink)]">{landing?.club?.name ?? "Open clubs"}</div>
                      <div className="mt-1 text-[12px] text-[var(--ink-4)]">
                        {landing?.club ? `${formatTrophies(landing.club.trophies)} trophies` : "Browse club rankings"}
                      </div>
                    </>
                  )}
                </Link>
              </div>
            </div>
          </article>

          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_92%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 lg:col-span-7">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Meta tape</h2>
            </div>
            <div className="grid gap-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-[44px] w-full" />)
              ) : topMaps.length > 0 ? (
                topMaps.slice(0, 6).map((map, index) => (
                  <Link
                    key={`${map.mode}-${map.name}`}
                    href={`/meta?open=${encodeURIComponent(map.name)}`}
                    className="grid min-h-[44px] grid-cols-[28px_minmax(0,1.5fr)_minmax(0,1fr)_80px] items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)] max-sm:grid-cols-[22px_minmax(0,1fr)_64px] max-sm:gap-2.5"
                  >
                    <span className="text-[12px] text-[var(--ink-4)]">{index + 1}</span>
                    <span className="truncate text-[13px] font-semibold text-[var(--ink)]">{map.name}</span>
                    <span className="truncate text-[12px] text-[var(--ink-3)] max-sm:hidden">{getModeName(map.mode)}</span>
                    <span className="text-right text-[12px] font-medium text-[var(--ink-3)]">{formatNum(map.battles)}</span>
                  </Link>
                ))
              ) : (
                <p className="m-0 rounded-md border border-dashed border-[var(--line)] p-5 text-center text-[13px] text-[var(--ink-4)]">No map data available.</p>
              )}
            </div>
          </article>

          <Link href="/meta" className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 text-inherit no-underline backdrop-blur-xl transition-colors hover:border-[var(--line-2)] sm:col-span-6 sm:p-5 md:col-span-3 lg:col-span-4">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Live maps</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 max-[440px]:grid-cols-1">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="min-h-[78px] rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-2.5">
                    <SkeletonBlock className="h-full w-full" />
                  </div>
                ))
              ) : liveMaps.map((map, index) => (
                <div key={`${map.mode}-${map.name}-${index}`} className="min-h-[78px] rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-2.5">
                  <div className="mb-4 text-[10.5px] font-medium text-[var(--ink-4)]">{getModeName(map.mode)}</div>
                  <div className="line-clamp-2 text-[12.5px] font-semibold leading-[1.15] text-[var(--ink)]">{map.name}</div>
                </div>
              ))}
            </div>
          </Link>

          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 md:col-span-3 lg:col-span-4">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Mode volume</h2>
            </div>
            <div className="grid gap-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => <SkeletonBlock key={index} className="h-[36px] w-full" />)
              ) : modes.slice(0, 5).map(mode => {
                const share = totalBattles > 0 ? (mode.totalBattles / totalBattles) * 100 : 0
                return (
                  <div key={mode.mode}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <span className="truncate text-[12.5px] font-medium text-[var(--ink)]">{getModeName(mode.mode)}</span>
                      <span className="shrink-0 text-[11.5px] text-[var(--ink-4)]">{pct(mode.totalBattles, totalBattles)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                      <div className="h-full rounded-full bg-[var(--ink)]" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 lg:col-span-4">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Brawler signal</h2>
            </div>
            {loading ? (
              <SkeletonBlock className="h-[142px] w-full" />
            ) : brawlerForCard ? (
              <Link href={`/brawlers?open=${brawlerForCard.id}`} className="block text-inherit no-underline">
                <div className="flex items-center gap-4 max-[420px]:items-start">
                  <BrawlImage src={brawlerIconUrl(brawlerForCard.id)} alt={brawlerForCard.name} width={72} height={72} className="size-[72px] shrink-0 object-contain max-[420px]:size-[58px]" sizes="72px" />
                  <div className="min-w-0">
                    <div className="truncate text-[clamp(20px,6vw,24px)] font-semibold tracking-[-0.02em] text-[var(--ink)]">{formatBrawlerName(brawlerForCard.name)}</div>
                    <div className="mt-1 text-[13px] text-[var(--ink-3)]">{brawlerForCard.winRate.toFixed(1)}% win rate</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 max-[360px]:grid-cols-1">
                  <div className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3">
                    <div className="text-[11px] text-[var(--ink-4)]">Score</div>
                    <div className="mt-1 text-[17px] font-semibold text-[var(--ink)]">{brawlerForCard.score ? brawlerForCard.score.toFixed(1) : "-"}</div>
                  </div>
                  <div className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3">
                    <div className="text-[11px] text-[var(--ink-4)]">Picks</div>
                    <div className="mt-1 text-[17px] font-semibold text-[var(--ink)]">{brawlerForCard.picks ? formatNum(brawlerForCard.picks) : "-"}</div>
                  </div>
                </div>
                {brawlerForCard.bestMap && (
                  <div className="mt-3 line-clamp-2 text-[12px] leading-[1.45] text-[var(--ink-3)]">
                    Best map: {brawlerForCard.bestMap.name} at {brawlerForCard.bestMap.winRate.toFixed(1)}%.
                  </div>
                )}
              </Link>
            ) : (
              <p className="m-0 text-[13px] text-[var(--ink-4)]">No brawler highlight available.</p>
            )}
          </article>

          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 md:col-span-3 lg:col-span-4">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Recent profiles</h2>
            </div>
            {recentPlayers.length > 0 ? (
              <div className="divide-y divide-[var(--line)]">
                {recentPlayers.slice(0, 5).map(player => (
                  <Link key={player.tag} href={`/player/${encodeURIComponent(player.tag)}`} className="flex min-w-0 items-center justify-between gap-3 py-2.5 text-inherit no-underline">
                    <span className="min-w-0 truncate text-[13px] font-medium text-[var(--ink)]">#{player.tag}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[12.5px] leading-[1.45] text-[var(--ink-4)]">
                Profiles you open from this device will appear here.
              </div>
            )}
          </article>

          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 md:col-span-3 lg:col-span-4">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">AI reads</h2>
            </div>
            <div className="grid gap-2">
              {[
                "What changed in the meta today?",
                "Which maps should I focus on right now?",
                "Summarize the strongest brawler signals.",
                "What should I track next?",
              ].map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => openAssistant(prompt)}
                  className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 text-left text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]"
                >
                  <span className="min-w-0 leading-[1.3]">{prompt}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="min-w-0 rounded-lg border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_90%,transparent)] p-4 backdrop-blur-xl sm:col-span-6 sm:p-5 lg:col-span-4">
            <div className="mb-4">
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Signals</h2>
            </div>
            <div className="grid gap-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <SkeletonBlock key={index} className="h-[54px] w-full" />)
              ) : metaSignals.length > 0 ? metaSignals.map(signal => (
                <Link key={signal.label} href={signal.href} className="min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)]">
                  <div className="mb-1 text-[11.5px] text-[var(--ink-4)]">{signal.label}</div>
                  <div className="line-clamp-2 text-[13px] font-medium leading-[1.35] text-[var(--ink)]">{signal.value}</div>
                </Link>
              )) : (
                <p className="m-0 rounded-md border border-dashed border-[var(--line)] p-5 text-center text-[13px] text-[var(--ink-4)]">No signals available yet.</p>
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
