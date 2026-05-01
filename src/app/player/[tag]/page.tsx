import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Player, PlayerBrawler } from "@/types/brawler"
import Link from "next/link"
import { Activity, ArrowLeft, BrainCircuit, Crown, Gauge, Medal, ShieldCheck, Sparkles, Target, Trophy, Zap } from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"
import PlayerInsightButton from "./PlayerInsightButton"

export const revalidate = 60

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) return { title: "Player - BrawlLens" }

  try {
    const res = await fetchPlayerResponse(tag, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error()
    const data = (await res.json()) as Player
    const name = data?.name ?? `#${tag}`
    const trophies = data?.trophies ?? 0
    const description = `${name} (#${tag}) - ${trophies.toLocaleString()} trophies on BrawlLens.`
    return {
      title: `${name} - BrawlLens`,
      description,
      openGraph: { title: `${name} (#${tag})`, description, type: "profile" },
    }
  } catch {
    return {
      title: `Player #${tag} - BrawlLens`,
      description: `BrawlLens profile lookup for player #${tag}.`,
    }
  }
}

function rankColor(rank: number) {
  if (rank >= 35) return "#14B8D6"
  if (rank >= 30) return "#22D3EE"
  if (rank >= 25) return "#FB923C"
  if (rank >= 20) return "#A855F7"
  if (rank >= 15) return "#0EA5B8"
  return "#94A3B8"
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
  return n.toLocaleString()
}

function pct(n: number) {
  return `${Math.round(n)}%`
}

function get3v3Wins(player: Player) {
  return player["3vs3Victories"] ?? player.threesVictories ?? player.threesvictories ?? 0
}

function lookupErrorCopy(status?: number) {
  if (status === 403) {
    return "The upstream player API rejected this server. Production needs PLAYER_API_URL configured to a stable lookup proxy, or an API key valid for the deployed server."
  }
  return "The player API did not respond. Try again in a moment, or search for a different tag."
}

function getBrawlerGap(brawler: PlayerBrawler) {
  return Math.max(0, (brawler.highestTrophies ?? 0) - (brawler.trophies ?? 0))
}

function rankLabel(rank: number) {
  if (rank >= 35) return "Elite"
  if (rank >= 30) return "Rank 30+"
  if (rank >= 25) return "Rank 25+"
  if (rank >= 20) return "Rank 20+"
  return "Building"
}

function buildInsights(player: Player, sorted: PlayerBrawler[]) {
  const totalBrawlers = sorted.length
  const top = sorted[0]
  const highPower = sorted.filter(b => b.power >= 11).length
  const hyperCount = sorted.filter(b => (b.hyperCharges ?? []).length > 0).length
  const eliteCount = sorted.filter(b => b.rank >= 30).length
  const recovery = [...sorted].sort((a, b) => getBrawlerGap(b) - getBrawlerGap(a))[0]
  const underpowered = sorted.find(b => b.trophies >= 700 && b.power < 11)
  const topShare = top && player.trophies ? (top.trophies / player.trophies) * 100 : 0

  return [
    {
      icon: Crown,
      label: "Carry profile",
      title: top ? `${top.name} anchors the account.` : "No carry brawler detected.",
      body: top ? `${fmt(top.trophies)} trophies, ${rankLabel(top.rank)}, Power ${top.power}. This is ${pct(topShare)} of current account trophies.` : "The account has no visible brawler roster data.",
    },
    {
      icon: Target,
      label: "Push target",
      title: recovery && getBrawlerGap(recovery) > 0 ? `${recovery.name} has the cleanest recovery lane.` : "No obvious trophy recovery target.",
      body: recovery && getBrawlerGap(recovery) > 0 ? `${fmt(getBrawlerGap(recovery))} trophies below peak, with a best of ${fmt(recovery.highestTrophies)}.` : "Current trophies are close to peak across the visible roster.",
    },
    {
      icon: Zap,
      label: "Upgrade signal",
      title: underpowered ? `${underpowered.name} is carrying value below max power.` : "Power curve is healthy at the top.",
      body: underpowered ? `${fmt(underpowered.trophies)} trophies at Power ${underpowered.power}. This is a strong upgrade candidate before deeper ladder pushes.` : `${highPower}/${totalBrawlers} brawlers are Power 11, with ${hyperCount} hypercharges available.`,
    },
    {
      icon: BrainCircuit,
      label: "Model read",
      title: eliteCount > 0 ? `${eliteCount} brawlers are already in elite ladder range.` : "The account is still building elite depth.",
      body: "BrawlLens weights trophy peaks, power readiness, rank depth, and recovery gaps to surface practical next moves.",
    },
  ]
}

function RosterCurve({ brawlers }: { brawlers: PlayerBrawler[] }) {
  const sample = brawlers.slice(0, 16)
  if (sample.length === 0) return <div className="grid min-h-[180px] place-items-center text-[13px] text-[var(--ink-4)]">No roster data.</div>

  const width = 620
  const height = 190
  const padX = 24
  const topY = 18
  const bottomY = 154
  const max = Math.max(...sample.map(b => b.trophies), 1)
  const min = Math.min(...sample.map(b => b.trophies), max)
  const span = Math.max(1, max - min)
  const points = sample.map((b, i) => {
    const x = sample.length === 1 ? width / 2 : padX + (i / (sample.length - 1)) * (width - padX * 2)
    const y = bottomY - ((b.trophies - min) / span) * (bottomY - topY)
    return { x, y, b }
  })
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ")
  const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${bottomY} L ${points[0].x.toFixed(2)} ${bottomY} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full overflow-visible">
      <defs>
        <linearGradient id="playerCurveFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#EC4899" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#14B8D6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={padX} x2={width - padX} y1={topY + i * 45} y2={topY + i * 45} stroke="var(--line)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#playerCurveFill)" />
      <path d={line} fill="none" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.b.id}>
          <circle cx={p.x} cy={p.y} r={i === 0 ? 5 : 3.5} fill={i === 0 ? "#EC4899" : "var(--panel)"} stroke="#EC4899" strokeWidth="2" />
          {i < 6 && (
            <text x={p.x} y={height - 12} textAnchor="middle" className="fill-[var(--ink-4)] text-[10px]">
              {p.b.name.slice(0, 4)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

function RankDistribution({ brawlers }: { brawlers: PlayerBrawler[] }) {
  const groups = [
    { label: "35+", count: brawlers.filter(b => b.rank >= 35).length, color: "#14B8D6" },
    { label: "30-34", count: brawlers.filter(b => b.rank >= 30 && b.rank < 35).length, color: "#22D3EE" },
    { label: "25-29", count: brawlers.filter(b => b.rank >= 25 && b.rank < 30).length, color: "#FB923C" },
    { label: "20-24", count: brawlers.filter(b => b.rank >= 20 && b.rank < 25).length, color: "#A855F7" },
    { label: "<20", count: brawlers.filter(b => b.rank < 20).length, color: "#94A3B8" },
  ]
  const max = Math.max(...groups.map(g => g.count), 1)

  return (
    <div className="grid gap-3">
      {groups.map(group => (
        <div key={group.label} className="grid grid-cols-[52px_1fr_28px] items-center gap-3">
          <span className="text-[11px] font-medium text-[var(--ink-3)]">{group.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--panel-2)]">
            <div className="h-full rounded-full" style={{ width: `${(group.count / max) * 100}%`, background: group.color }} />
          </div>
          <span className="text-right text-[11px] font-semibold tabular-nums text-[var(--ink)]">{group.count}</span>
        </div>
      ))}
    </div>
  )
}

function PowerReadiness({ brawlers }: { brawlers: PlayerBrawler[] }) {
  const total = Math.max(1, brawlers.length)
  const rows = [
    { label: "Power 11", value: brawlers.filter(b => b.power >= 11).length, color: "#14B8D6" },
    { label: "Power 10", value: brawlers.filter(b => b.power === 10).length, color: "#EC4899" },
    { label: "Under 10", value: brawlers.filter(b => b.power < 10).length, color: "#94A3B8" },
  ]
  return (
    <div className="space-y-4">
      {rows.map(row => (
        <div key={row.label}>
          <div className="mb-1.5 flex items-center justify-between text-[12px]">
            <span className="font-medium text-[var(--ink-2)]">{row.label}</span>
            <span className="tabular-nums text-[var(--ink-4)]">{pct((row.value / total) * 100)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--panel-2)]">
            <div className="h-full rounded-full" style={{ width: `${(row.value / total) * 100}%`, background: row.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) notFound()

  let player: Player
  let lookupStatus: number | undefined
  try {
    const res = await fetchPlayerResponse(tag, { next: { revalidate: 60 } })
    lookupStatus = res.status
    if (res.status === 404) notFound()
    if (!res.ok) throw new Error()
    player = await res.json()
  } catch {
    return (
      <main className="mx-auto flex w-full max-w-[560px] flex-col items-center px-6 py-20 text-center">
        <div className="mb-3 text-[12px] font-medium tracking-normal text-[var(--ink-4)]">Connection error</div>
        <h1 className="m-0 text-[24px] font-semibold tracking-tight text-[var(--ink)]">Could not load player</h1>
        <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-[var(--ink-3)]">
          {lookupErrorCopy(lookupStatus)}
        </p>
        <p className="mt-3 text-[12px] tabular-nums text-[var(--ink-4)]">#{tag}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href={`/player/${encodeURIComponent(tag)}`} className="bl-state-action" prefetch={false}>
            Try again
          </Link>
          <Link href="/leaderboards/players" className="bl-state-action">Browse leaderboard</Link>
        </div>
      </main>
    )
  }

  const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
  const top = sorted[0]
  const topEight = sorted.slice(0, 8)
  const rosterPreview = sorted.slice(0, 18)
  const club = player.club as { name?: string }
  const totalBrawlers = sorted.length
  const threeVThreeWins = get3v3Wins(player)
  const totalWins = threeVThreeWins + (player.soloVictories ?? 0) + (player.duoVictories ?? 0)
  const peakGap = Math.max(0, (player.highestTrophies ?? 0) - (player.trophies ?? 0))
  const power11 = sorted.filter(b => b.power >= 11).length
  const hyperCount = sorted.filter(b => (b.hyperCharges ?? []).length > 0).length
  const rank30 = sorted.filter(b => b.rank >= 30).length
  const avgTopTrophies = topEight.length ? topEight.reduce((sum, b) => sum + b.trophies, 0) / topEight.length : 0
  const insights = buildInsights(player, sorted)

  const stats = [
    { label: "Current", value: fmt(player.trophies ?? 0), sub: `${fmt(peakGap)} off peak`, icon: Trophy },
    { label: "Best", value: fmt(player.highestTrophies ?? 0), sub: "personal record", icon: Medal },
    { label: "Wins", value: fmt(totalWins), sub: `${fmt(threeVThreeWins)} in 3v3`, icon: ShieldCheck },
    { label: "Roster", value: totalBrawlers.toLocaleString(), sub: `${power11} max power`, icon: Gauge },
  ]

  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 pb-24 pt-10 max-md:px-4">
      <Link href="/leaderboards/players" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink-3)] no-underline transition-colors hover:text-[var(--ink)]">
        <ArrowLeft size={13} />
        Leaderboard
      </Link>

      <section className="relative mb-5 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6 shadow-[var(--shadow-lift)] max-md:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#EC4899,#14B8D6,#FB923C)]" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 text-[12px] font-medium tabular-nums text-[var(--ink-3)]">#{tag}</span>
              {club?.name && (
                <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 text-[12px] font-medium text-[var(--ink-3)]">{club.name}</span>
              )}
              {top && (
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 text-[12px] font-medium text-[var(--accent)]">
                  <Crown size={12} />
                  {top.name} main
                </span>
              )}
            </div>
            <h1 className="m-0 truncate text-[clamp(42px,7vw,78px)] font-semibold leading-[0.98] tracking-[-0.025em] text-[var(--ink)]">
              {player.name}
            </h1>
            <p className="mt-4 max-w-[660px] text-[16px] leading-[1.55] text-[var(--ink-3)]">
              A live profile view built from public player data, roster depth, trophy peaks, power readiness, and BrawlLens insight signals.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <PlayerInsightButton playerName={player.name} tag={tag} />
              <Link href="/brawlers" className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3.5 text-[13px] font-medium text-[var(--ink-2)] no-underline transition-colors hover:text-[var(--ink)]">
                Browse brawlers
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {stats.map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-4">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-[var(--ink-3)]">{stat.label}</span>
                    <Icon size={15} className="text-[var(--ink-4)]" />
                  </div>
                  <strong className="block text-[26px] font-semibold leading-none tracking-[-0.01em] text-[var(--ink)]">{stat.value}</strong>
                  <span className="mt-1.5 block text-[11px] text-[var(--ink-4)]">{stat.sub}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Roster curve</h2>
              <p className="m-0 mt-1 text-[12px] text-[var(--ink-4)]">Top brawlers by current trophies.</p>
            </div>
            <span className="rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[11px] font-medium text-[var(--ink-3)]">
              Avg top 8: {fmt(Math.round(avgTopTrophies))}
            </span>
          </div>
          <RosterCurve brawlers={sorted} />
        </div>

        <div className="grid gap-5">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)]">
            <div className="mb-5 flex items-center gap-2">
              <Activity size={15} className="text-[var(--accent)]" />
              <h2 className="m-0 text-[16px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Rank depth</h2>
            </div>
            <RankDistribution brawlers={sorted} />
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)]">
            <div className="mb-5 flex items-center gap-2">
              <Zap size={15} className="text-[var(--accent)]" />
              <h2 className="m-0 text-[16px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Power readiness</h2>
            </div>
            <PowerReadiness brawlers={sorted} />
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[12px] font-medium text-[var(--ink-3)]">
              <Sparkles size={13} className="text-[var(--accent)]" />
              Insight engine
            </div>
            <h2 className="m-0 text-[22px] font-semibold tracking-[-0.016em] text-[var(--ink)]">Actionable player read</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]">
            <span className="rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[var(--ink-3)]">{rank30} rank 30+</span>
            <span className="rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-3 py-1 text-[var(--ink-3)]">{hyperCount} hypercharges</span>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map(insight => {
            const Icon = insight.icon
            return (
              <div key={insight.label} className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-4">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-[var(--ink-4)]">
                  <Icon size={14} className="text-[var(--accent)]" />
                  {insight.label}
                </div>
                <h3 className="m-0 text-[15px] font-semibold leading-[1.25] text-[var(--ink)]">{insight.title}</h3>
                <p className="m-0 mt-2 text-[12.5px] leading-[1.5] text-[var(--ink-3)]">{insight.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Best brawlers</h2>
            <span className="text-[12px] text-[var(--ink-4)]">Top 8</span>
          </div>
          <div className="divide-y divide-[var(--line)] overflow-hidden rounded-lg border border-[var(--line)]">
            {topEight.map((brawler, index) => (
              <div key={brawler.id} className="grid grid-cols-[30px_38px_minmax(0,1fr)_auto] items-center gap-3 bg-[var(--panel-2)] px-3 py-3">
                <span className="text-[11px] font-semibold tabular-nums text-[var(--ink-4)]">{String(index + 1).padStart(2, "0")}</span>
                <BrawlImage src={brawlerIconUrl(brawler.id)} alt={brawler.name} width={38} height={38} className="size-[38px] object-contain" sizes="38px" />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{brawler.name}</div>
                  <div className="mt-0.5 flex flex-wrap gap-1.5 text-[10.5px] text-[var(--ink-4)]">
                    <span style={{ color: rankColor(brawler.rank) }}>R{brawler.rank}</span>
                    <span>Power {brawler.power}</span>
                    {(brawler.hyperCharges ?? []).length > 0 && <span className="text-[var(--hc-purple)]">HC</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-semibold tabular-nums text-[var(--ink)]">{fmt(brawler.trophies)}</div>
                  <div className="text-[10.5px] tabular-nums text-[var(--ink-4)]">best {fmt(brawler.highestTrophies)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel)] p-5 shadow-[var(--shadow-lift)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="m-0 text-[18px] font-semibold tracking-[-0.012em] text-[var(--ink)]">Roster snapshot</h2>
            <span className="text-[12px] text-[var(--ink-4)]">{totalBrawlers} total</span>
          </div>
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-2">
            {rosterPreview.map(brawler => (
              <div key={brawler.id} className="group min-w-0 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-3 transition-colors hover:border-[var(--line-2)]">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <BrawlImage src={brawlerIconUrl(brawler.id)} alt={brawler.name} width={42} height={42} className="size-[42px] object-contain drop-shadow-sm" sizes="42px" />
                  <span className="rounded-md border border-[var(--line)] bg-[var(--panel)] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums" style={{ color: rankColor(brawler.rank) }}>R{brawler.rank}</span>
                </div>
                <div className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{brawler.name}</div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[10.5px] text-[var(--ink-4)]">
                  <span className="tabular-nums">{fmt(brawler.trophies)}</span>
                  <span>Power {brawler.power}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
