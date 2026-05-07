import type { Metadata } from "next"
import type { CSSProperties } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import {
  ArrowLeft,
  BarChart3,
  Bot,
  ChevronDown,
  Filter,
  List,
  Medal,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { formatBrawlerName, formatNum, formatTrophies } from "@/lib/format"
import { fetchPlayerBattleLogResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"
import type { Gear, Player, PlayerBrawler } from "@/types/brawler"
import PlayerInsightButton from "./PlayerInsightButton"

export const revalidate = 60

type PlayerWithMeta = Player & {
  icon?: { id?: number }
  club?: { name?: string; tag?: string }
}

interface LeaderboardRecord {
  rank: number
  region: string
  trophies: number
}

interface BattleBrawler {
  id?: number
  name?: string
  power?: number
  trophies?: number
}

interface BattleParticipant {
  tag?: string
  name?: string
  brawler?: BattleBrawler
}

interface BattleLogItem {
  battleTime?: string
  event?: { mode?: string; map?: string }
  battle?: {
    mode?: string
    type?: string
    result?: string
    rank?: number
    trophyChange?: number
    duration?: number
    teams?: BattleParticipant[][]
    players?: BattleParticipant[]
    starPlayer?: BattleParticipant
  }
}

type LoadoutKind = "gadget" | "starPower" | "gear" | "hyperCharge"

interface LoadoutItem {
  id: number
  name: string
  kind: LoadoutKind
}

const stateActionClass = "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-4 text-[13px] font-bold text-[var(--lb-text)] no-underline transition-colors hover:border-[var(--lb-line-2)] hover:bg-[var(--lb-panel-3)]"

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) return { title: "Player | BrawlLens" }

  try {
    const res = await fetchPlayerResponse(tag, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error()
    const data = (await res.json()) as Player
    const name = data?.name ?? `#${tag}`
    const trophies = data?.trophies ?? 0
    const description = `${name} (#${tag}) - ${trophies.toLocaleString()} trophies on BrawlLens.`
    return {
      title: `${name} | BrawlLens`,
      description,
      openGraph: { title: `${name} (#${tag})`, description, type: "profile" },
    }
  } catch {
    return {
      title: `Player #${tag} | BrawlLens`,
      description: `BrawlLens profile lookup for player #${tag}.`,
    }
  }
}

function cleanEnv(value: string | undefined) {
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, "")
  return cleaned || null
}

async function fetchLeaderboardRecord(tag: string): Promise<{ record: LeaderboardRecord | null; globalCount: number | null }> {
  const url = cleanEnv(process.env.SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_KEY)
  if (!url || !key) return { record: null, globalCount: null }

  try {
    const supabase = createClient(url, key)
    const variants = [`#${tag}`, tag]
    const [rankRes, countRes] = await Promise.all([
      supabase
        .from("leaderboards")
        .select("rank, region, trophies")
        .in("player_tag", variants)
        .order("rank", { ascending: true }),
      supabase
        .from("leaderboards")
        .select("player_tag", { count: "exact", head: true })
        .eq("region", "global"),
    ])

    const records = (rankRes.data ?? []) as LeaderboardRecord[]
    return {
      record: records.find(record => record.region === "global") ?? records[0] ?? null,
      globalCount: countRes.count ?? null,
    }
  } catch {
    return { record: null, globalCount: null }
  }
}

async function fetchRecentBattles(tag: string): Promise<BattleLogItem[]> {
  try {
    const response = await fetchPlayerBattleLogResponse(tag, { next: { revalidate: 120 } })
    if (!response.ok) return []
    const data = (await response.json()) as { items?: BattleLogItem[] }
    return (data.items ?? []).slice(0, 25)
  } catch {
    return []
  }
}

function lookupErrorCopy(status?: number) {
  if (status === 403) {
    return "The upstream player API rejected this server. Production needs PLAYER_API_URL configured to a stable lookup proxy, or an API key valid for the deployed server."
  }
  return "The player API did not respond. Try again in a moment, or search for a different tag."
}

function get3v3Wins(player: PlayerWithMeta) {
  return player["3vs3Victories"] ?? player.threesVictories ?? player.threesvictories ?? 0
}

function leagueName(trophies: number) {
  if (trophies >= 100_000) return "Ultimate"
  if (trophies >= 80_000) return "Masters"
  if (trophies >= 60_000) return "Legendary"
  if (trophies >= 40_000) return "Mythic"
  if (trophies >= 25_000) return "Diamond"
  return "Trophy"
}

function ordinal(value: number) {
  const rem100 = value % 100
  if (rem100 >= 11 && rem100 <= 13) return `${value}th`
  switch (value % 10) {
    case 1: return `${value}st`
    case 2: return `${value}nd`
    case 3: return `${value}rd`
    default: return `${value}th`
  }
}

function percentRank(rank: number | null | undefined, total: number | null | undefined) {
  if (!rank || !total) return null
  return `${((rank / total) * 100).toFixed(2)}%`
}

function profileIconUrl(id: number) {
  return `https://cdn.brawlify.com/profile-icons/regular/${id}.png`
}

function firstGlyph(value: string | undefined) {
  return Array.from((value ?? "").trim())[0]?.toUpperCase() || "?"
}

function rankColor(rank: number) {
  if (rank >= 35) return "#8bd7ff"
  if (rank >= 30) return "#f0d373"
  if (rank >= 25) return "#ff9f6e"
  if (rank >= 20) return "#c7b7ff"
  return "#aeb2bb"
}

function rankLabel(rank: number) {
  if (rank >= 35) return "Elite"
  if (rank >= 30) return "Rank 30+"
  if (rank >= 25) return "Rank 25+"
  if (rank >= 20) return "Rank 20+"
  return "Building"
}

function winRate(wins: number, total: number) {
  return total > 0 ? Math.round((wins / total) * 100) : 0
}

function cleanBattleTag(value?: string) {
  return sanitizePlayerTag((value ?? "").replace(/^#/, ""))
}

function parseBattleTime(value?: string) {
  if (!value) return null
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (!match) return null
  const [, year, month, day, hour, minute, second] = match
  const time = Date.parse(`${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`)
  return Number.isNaN(time) ? null : time
}

function formatClock(time: number | null) {
  if (!time) return "--:--"
  const date = new Date(time)
  const hour = String(date.getUTCHours()).padStart(2, "0")
  const minute = String(date.getUTCMinutes()).padStart(2, "0")
  return `${hour}:${minute}`
}

function formatAge(time: number | null) {
  if (!time) return "recent"
  const diff = Math.max(0, Date.now() - time)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDay(time: number | null) {
  if (!time) return "Recent"
  const date = new Date(time)
  return `${String(date.getUTCDate()).padStart(2, "0")} ${monthNames[date.getUTCMonth()]}`
}

function modeLabel(item: BattleLogItem) {
  return item.battle?.mode ?? item.event?.mode ?? "Battle"
}

function flattenParticipants(item: BattleLogItem) {
  const teams = item.battle?.teams
  if (teams?.length) return teams.flat()
  return item.battle?.players ?? []
}

function findPlayerParticipant(item: BattleLogItem, player: PlayerWithMeta, tag: string) {
  const expected = cleanBattleTag(tag)
  const participants = flattenParticipants(item)
  return (
    participants.find(participant => cleanBattleTag(participant.tag) === expected) ??
    participants.find(participant => participant.name === player.name) ??
    (cleanBattleTag(item.battle?.starPlayer?.tag) === expected ? item.battle?.starPlayer : undefined) ??
    participants[0] ??
    null
  )
}

function findOpponents(item: BattleLogItem, player: PlayerWithMeta, tag: string) {
  const expected = cleanBattleTag(tag)
  const teams = item.battle?.teams
  if (teams?.length) {
    const ownIndex = teams.findIndex(team => team.some(participant => cleanBattleTag(participant.tag) === expected || participant.name === player.name))
    if (ownIndex >= 0) return teams.filter((_, index) => index !== ownIndex).flat().slice(0, 3)
  }
  return flattenParticipants(item)
    .filter(participant => cleanBattleTag(participant.tag) !== expected && participant.name !== player.name)
    .slice(0, 3)
}

function battleOutcome(item: BattleLogItem) {
  if (item.battle?.result === "victory") return "win"
  if (item.battle?.result === "defeat") return "loss"
  if (typeof item.battle?.rank === "number") return item.battle.rank <= 4 ? "win" : "loss"
  return "neutral"
}

function battleScore(item: BattleLogItem) {
  const outcome = battleOutcome(item)
  const trophyChange = item.battle?.trophyChange ?? 0
  const rank = item.battle?.rank
  let score = outcome === "win" ? 78 : outcome === "loss" ? 46 : 62
  score += Math.max(-18, Math.min(18, trophyChange * 2))
  if (typeof rank === "number") score += Math.max(-18, 12 - rank * 2)
  return Math.max(22, Math.min(100, Math.round(score)))
}

function gradeLabel(score: number) {
  if (score >= 96) return "MVP"
  if (score >= 86) return "ACE"
  if (score >= 72) return "Good"
  if (score >= 55) return "Avg"
  return "Low"
}

function teamRead(item: BattleLogItem) {
  const outcome = battleOutcome(item)
  if (outcome === "win") return "Good team"
  if (outcome === "loss") return "Bad team"
  return "Avg team"
}

function battleResultLine(item: BattleLogItem) {
  const change = item.battle?.trophyChange
  if (typeof change === "number") return `${change > 0 ? "+" : ""}${change}`
  if (typeof item.battle?.rank === "number") return `#${item.battle.rank}`
  return "--"
}

function resultTone(item: BattleLogItem) {
  const outcome = battleOutcome(item)
  if (outcome === "win") return "bl-profile-match-win"
  if (outcome === "loss") return "bl-profile-match-loss"
  return "bl-profile-match-neutral"
}

function findRosterBrawler(roster: PlayerBrawler[], battleBrawler: BattleBrawler | null | undefined) {
  if (!battleBrawler) return null
  return roster.find(brawler => brawler.id === battleBrawler.id) ??
    roster.find(brawler => brawler.name.toLowerCase() === battleBrawler.name?.toLowerCase()) ??
    null
}

function battleBrawlerName(brawler: BattleBrawler | null | undefined, fallback?: PlayerBrawler) {
  return formatBrawlerName(brawler?.name ?? fallback?.name ?? "Brawler")
}

function accessoryIconUrl(item: LoadoutItem) {
  if (item.kind === "gadget") return `https://cdn.brawlify.com/gadgets/regular/${item.id}.png`
  if (item.kind === "starPower") return `https://cdn.brawlify.com/star-powers/regular/${item.id}.png`
  if (item.kind === "gear") return `https://cdn.brawlify.com/gears/regular/${item.id}.png`
  return `https://cdn.brawlify.com/hypercharges/regular/${item.id}.png`
}

function buildLoadout(brawler: PlayerBrawler | null) {
  if (!brawler) return []
  const gearItems: LoadoutItem[] = (brawler.gears ?? []).slice(0, 2).map((gear: Gear) => ({ id: gear.id, name: gear.name, kind: "gear" }))
  const gadgetItems: LoadoutItem[] = (brawler.gadgets ?? []).slice(0, 2).map(item => ({ id: item.id, name: item.name, kind: "gadget" }))
  const starPowerItems: LoadoutItem[] = (brawler.starPowers ?? []).slice(0, 2).map(item => ({ id: item.id, name: item.name, kind: "starPower" }))
  const hyperItems: LoadoutItem[] = (brawler.hyperCharges ?? []).slice(0, 1).map(item => ({ id: item.id, name: item.name, kind: "hyperCharge" }))
  return [...gadgetItems, ...starPowerItems, ...gearItems, ...hyperItems].slice(0, 6)
}

function sparkPoints(values: number[]) {
  const sample = values.length ? values : [0]
  const min = Math.min(...sample)
  const max = Math.max(...sample)
  const range = Math.max(1, max - min)
  return sample.map((value, index) => {
    const x = sample.length === 1 ? 0 : (index / (sample.length - 1)) * 100
    const y = 88 - ((value - min) / range) * 72
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(" ")
}

function compactMode(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function groupBattles(items: BattleLogItem[]) {
  const groups: { day: string; items: BattleLogItem[] }[] = []
  for (const item of items) {
    const day = formatDay(parseBattleTime(item.battleTime))
    const existing = groups.find(group => group.day === day)
    if (existing) {
      existing.items.push(item)
    } else {
      groups.push({ day, items: [item] })
    }
  }
  return groups
}

function ModeRow({ icon, label, value, percent }: { icon: React.ReactNode; label: string; value: string; percent: number }) {
  return (
    <div className="bl-profile-mode-row">
      <span>{icon}</span>
      <strong>{label}</strong>
      <b>{value}</b>
      <em>{percent}%</em>
    </div>
  )
}

function LoadoutGrid({ brawler }: { brawler: PlayerBrawler | null }) {
  const loadout = buildLoadout(brawler)
  return (
    <div className="bl-profile-loadout" aria-label="Brawler loadout">
      {Array.from({ length: 6 }).map((_, index) => {
        const item = loadout[index]
        return item ? (
          <BrawlImage
            key={`${item.kind}-${item.id}`}
            src={accessoryIconUrl(item)}
            alt={item.name}
            width={24}
            height={24}
            sizes="24px"
          />
        ) : (
          <span key={`empty-${index}`} aria-hidden="true" />
        )
      })}
    </div>
  )
}

function BrawlerThumb({ brawler, size = 38 }: { brawler?: BattleBrawler | PlayerBrawler | null; size?: number }) {
  if (brawler?.id) {
    return (
      <BrawlImage
        src={brawlerIconUrl(brawler.id)}
        alt={brawler.name ?? ""}
        width={size}
        height={size}
        sizes={`${size}px`}
      />
    )
  }
  return <span>{firstGlyph(brawler?.name)}</span>
}

function OpponentStack({ opponents, fallback }: { opponents: BattleParticipant[]; fallback: PlayerBrawler[] }) {
  const entries = opponents.length ? opponents.map(participant => participant.brawler ?? null) : fallback.slice(0, 2)
  return (
    <div className="bl-profile-versus">
      <div className="bl-profile-opponents">
        {entries.slice(0, 2).map((brawler, index) => (
          <span key={`${brawler?.id ?? brawler?.name ?? "fallback"}-${index}`}>
            <BrawlerThumb brawler={brawler} size={34} />
          </span>
        ))}
      </div>
      <b>VS</b>
    </div>
  )
}

function BrawlerPerformanceRow({ brawler }: { brawler: PlayerBrawler }) {
  return (
    <div className="bl-profile-brawler-perf-row">
      <BrawlImage src={brawlerIconUrl(brawler.id)} alt="" width={34} height={34} sizes="34px" />
      <strong>{formatBrawlerName(brawler.name)}</strong>
      <span>{formatTrophies(brawler.trophies)}</span>
      <span>{formatTrophies(brawler.highestTrophies)}</span>
      <span style={{ color: rankColor(brawler.rank) }}>R{brawler.rank}</span>
      <em>P{brawler.power}</em>
    </div>
  )
}

function BattleRow({
  item,
  player,
  tag,
  roster,
  fallbackBrawlers,
}: {
  item: BattleLogItem
  player: PlayerWithMeta
  tag: string
  roster: PlayerBrawler[]
  fallbackBrawlers: PlayerBrawler[]
}) {
  const time = parseBattleTime(item.battleTime)
  const participant = findPlayerParticipant(item, player, tag)
  const battleBrawler = participant?.brawler
  const rosterBrawler = findRosterBrawler(roster, battleBrawler)
  const fallback = rosterBrawler ?? fallbackBrawlers[0]
  const score = battleScore(item)
  const trophyChange = item.battle?.trophyChange ?? 0
  const scoreColor = score >= 90 ? "#fff1a6" : score >= 74 ? "#d8c8ff" : score >= 55 ? "#8bd7ff" : "#ff6b62"

  return (
    <article className={`bl-profile-match-row ${resultTone(item)}`}>
      <div className="bl-profile-match-meta">
        <strong>{formatClock(time)}</strong>
        <span>{formatAge(time)}</span>
        <b>{compactMode(modeLabel(item))}</b>
        <em className={trophyChange < 0 ? "is-loss" : ""}>{battleResultLine(item)} trophies</em>
      </div>

      <div className="bl-profile-match-brawler">
        <BrawlerThumb brawler={battleBrawler ?? fallback} size={48} />
        <span>{battleBrawler?.power ?? rosterBrawler?.power ? `P${battleBrawler?.power ?? rosterBrawler?.power}` : ""}</span>
      </div>

      <div className="bl-profile-match-scoreline">
        <strong>{battleOutcome(item) === "win" ? "Win" : battleOutcome(item) === "loss" ? "Loss" : "Draw"}</strong>
        <span>{teamRead(item)}</span>
      </div>

      <div className="bl-profile-match-details">
        <strong>{battleBrawlerName(battleBrawler, fallback)}</strong>
        <span>{item.event?.map ?? "Unknown map"}</span>
        <em>{rosterBrawler ? `${rankLabel(rosterBrawler.rank)} · ${formatTrophies(rosterBrawler.trophies)}` : "Battle log"}</em>
      </div>

      <LoadoutGrid brawler={rosterBrawler} />
      <OpponentStack opponents={findOpponents(item, player, tag)} fallback={fallbackBrawlers} />

      <div
        className="bl-profile-match-grade"
        style={{
          "--score": `${score}%`,
          "--score-color": scoreColor,
        } as CSSProperties}
      >
        <strong>{score}</strong>
        <span>{gradeLabel(score)}</span>
      </div>

      <button type="button" aria-label="Open battle details">
        <ChevronDown size={18} />
      </button>
    </article>
  )
}

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) notFound()

  let player: PlayerWithMeta
  let lookupStatus: number | undefined
  try {
    const response = await fetchPlayerResponse(tag, { next: { revalidate: 60 } })
    lookupStatus = response.status
    if (response.status === 404) notFound()
    if (!response.ok) throw new Error()
    player = await response.json()
  } catch {
    return (
      <main className="bl-profile-shell">
        <section className="bl-profile-error">
          <div>Connection error</div>
          <h1>Could not load player</h1>
          <p>{lookupErrorCopy(lookupStatus)}</p>
          <span>#{tag}</span>
          <div>
            <Link href={`/player/${encodeURIComponent(tag)}`} className={stateActionClass} prefetch={false}>Try again</Link>
            <Link href="/leaderboards/players" className={stateActionClass}>Browse leaderboard</Link>
          </div>
        </section>
      </main>
    )
  }

  const [{ record: leaderboardRecord, globalCount }, recentBattles] = await Promise.all([
    fetchLeaderboardRecord(tag),
    fetchRecentBattles(tag),
  ])

  const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
  const topBrawlers = sorted.slice(0, 8)
  const top = sorted[0]
  const club = player.club
  const threeVsThreeWins = get3v3Wins(player)
  const soloWins = player.soloVictories ?? 0
  const duoWins = player.duoVictories ?? 0
  const totalWins = threeVsThreeWins + soloWins + duoWins
  const power11 = sorted.filter(brawler => brawler.power >= 11).length
  const hyperCount = sorted.filter(brawler => (brawler.hyperCharges ?? []).length > 0).length
  const rank30 = sorted.filter(brawler => brawler.rank >= 30).length
  const topEightAverage = topBrawlers.length ? Math.round(topBrawlers.reduce((sum, brawler) => sum + brawler.trophies, 0) / topBrawlers.length) : 0
  const ladderPercent = percentRank(leaderboardRecord?.rank, globalCount)
  const regionLabel = leaderboardRecord?.region === "global" ? "ALL" : leaderboardRecord?.region ?? "ALL"
  const recentWins = recentBattles.filter(item => battleOutcome(item) === "win").length
  const recentLosses = recentBattles.filter(item => battleOutcome(item) === "loss").length
  const recentTotal = recentWins + recentLosses
  const recentTrophySwing = recentBattles.reduce((sum, item) => sum + (item.battle?.trophyChange ?? 0), 0)
  const averageRankValues = recentBattles.map(item => item.battle?.rank).filter((value): value is number => typeof value === "number")
  const averageRank = averageRankValues.length ? (averageRankValues.reduce((sum, value) => sum + value, 0) / averageRankValues.length).toFixed(1) : "--"
  const averageBattleScore = recentBattles.length ? (recentBattles.reduce((sum, item) => sum + battleScore(item), 0) / recentBattles.length).toFixed(1) : "--"
  const battleGroups = groupBattles(recentBattles)
  const sparkValues = [...topBrawlers].reverse().map(brawler => brawler.highestTrophies || brawler.trophies)
  const modeTotal = Math.max(1, totalWins)

  return (
    <main className="bl-profile-shell">
      <section className="bl-profile-hero">
        <div className="bl-profile-hero-inner">
          <Link href="/leaderboards/players" className="bl-profile-back">
            <ArrowLeft size={13} />
            Leaderboards
          </Link>

          <div className="bl-profile-identity">
            <div className="bl-profile-avatar-wrap">
              <span className="bl-profile-avatar">
                {player.icon?.id ? (
                  <BrawlImage src={profileIconUrl(player.icon.id)} alt="" width={88} height={88} sizes="88px" />
                ) : firstGlyph(player.name)}
              </span>
              <span className="bl-profile-level">{player.expLevel}</span>
            </div>

            <div className="bl-profile-title">
              <h1>
                {player.name}
                <span>#{tag}</span>
              </h1>
              <div className="bl-profile-tags">
                <span>{regionLabel}</span>
                {club?.name && <span>{club.name}</span>}
                {top && <b>{formatBrawlerName(top.name)}.</b>}
              </div>
              <div className="bl-profile-actions">
                <Link href={`/player/${encodeURIComponent(tag)}`} className="bl-profile-refresh" prefetch={false}>
                  <span />
                  Update now
                </Link>
                <button type="button" className="bl-profile-icon-button" aria-label="Refresh player">
                  <RefreshCw size={15} />
                </button>
                <PlayerInsightButton playerName={player.name} tag={tag} />
              </div>
            </div>
          </div>

          <nav className="bl-profile-tabs" aria-label="Player profile sections">
            <a href="#overview">
              <List size={17} />
              Overview
            </a>
            <a href="#lens">
              <Bot size={17} />
              BrawlLens
            </a>
            <a href="#brawlers">
              <Shield size={17} />
              Brawlers
            </a>
            <a href="#battles">
              <Swords size={17} />
              Battles
            </a>
            <a href="#club">
              <Users size={17} />
              Club
            </a>
          </nav>
        </div>
      </section>

      <div className="bl-profile-dashboard">
        <aside className="bl-profile-left-rail" id="overview">
          <section className="bl-profile-ranked-card">
            <div className="bl-profile-card-title">
              <Medal size={17} />
              <span>Trophy ladder</span>
            </div>
            <div className="bl-profile-rank-main">
              <span className="bl-profile-rank-badge">
                {top ? <BrawlImage src={brawlerIconUrl(top.id)} alt="" width={64} height={64} sizes="64px" /> : <Trophy size={34} />}
              </span>
              <div>
                <strong>{leagueName(player.trophies)} {formatTrophies(player.trophies)}</strong>
                <p>{formatNum(totalWins)}W across visible modes</p>
              </div>
            </div>
            <div className="bl-profile-ladder-rank">
              <span>Ladder rank</span>
              <strong>{leaderboardRecord ? ordinal(leaderboardRecord.rank) : "--"}</strong>
              <em>{ladderPercent ? `Top ${ladderPercent}` : "Tracked players"}</em>
            </div>
            <div className="bl-profile-window-stats">
              <span>Last 30d <b>{formatTrophies(topEightAverage)} avg</b></span>
              <span>Best <b>{formatTrophies(player.highestTrophies ?? 0)}</b></span>
            </div>
            <svg className="bl-profile-sparkline" viewBox="0 0 100 96" role="img" aria-label="Brawler trophy depth chart">
              <path d="M0 20 H100 M0 38 H100 M0 56 H100 M0 74 H100" />
              <polyline points={sparkPoints(sparkValues)} />
            </svg>
            <div className="bl-profile-chart-foot">
              <span>Peak <b>{formatTrophies(player.highestTrophies ?? player.trophies)}</b></span>
              <span>Current <b>{formatTrophies(player.trophies)}</b></span>
            </div>
          </section>

          <div className="bl-profile-left-tabs">
            <span>All</span>
            <span>3v3</span>
            <span>Solo</span>
            <span>Duo</span>
          </div>

          <section className="bl-profile-panel" id="brawlers">
            <div className="bl-profile-card-title">
              <Sparkles size={17} />
              <span>Brawler Performance</span>
            </div>
            <div className="bl-profile-brawler-head">
              <span />
              <span>Brawler</span>
              <span>Trophies</span>
              <span>Peak</span>
              <span>Rank</span>
              <span>Power</span>
            </div>
            <div className="bl-profile-brawler-table">
              {topBrawlers.slice(0, 7).map(brawler => (
                <BrawlerPerformanceRow key={brawler.id} brawler={brawler} />
              ))}
            </div>
          </section>

          <section className="bl-profile-panel">
            <div className="bl-profile-card-title">
              <Swords size={17} />
              <span>Mode Performance</span>
            </div>
            <div className="bl-profile-mode-table">
              <ModeRow icon={<Swords size={16} />} label="3v3" value={formatNum(threeVsThreeWins)} percent={winRate(threeVsThreeWins, modeTotal)} />
              <ModeRow icon={<Trophy size={16} />} label="Solo" value={formatNum(soloWins)} percent={winRate(soloWins, modeTotal)} />
              <ModeRow icon={<Users size={16} />} label="Duo" value={formatNum(duoWins)} percent={winRate(duoWins, modeTotal)} />
              <ModeRow icon={<Medal size={16} />} label="Rank 30+" value={String(rank30)} percent={winRate(rank30, Math.max(1, sorted.length))} />
            </div>
          </section>

          <section className="bl-profile-panel" id="club">
            <div className="bl-profile-card-title">
              <Users size={17} />
              <span>Club</span>
            </div>
            <div className="bl-profile-played-with">
              <span className="bl-profile-club-mark">{club?.name ? club.name.slice(0, 2).toUpperCase() : "--"}</span>
              <div>
                <strong>{club?.name ?? "No club"}</strong>
                <p>{club?.tag ?? "No visible club tag"}</p>
              </div>
            </div>
          </section>

          <section className="bl-profile-panel">
            <div className="bl-profile-card-title">
              <Zap size={17} />
              <span>Account Signals</span>
            </div>
            <div className="bl-profile-signal-grid">
              <div><Trophy size={24} /><strong>{formatTrophies(player.trophies)}</strong><span>Current</span></div>
              <div><Medal size={24} /><strong>{formatTrophies(player.highestTrophies ?? 0)}</strong><span>Best</span></div>
              <div><Swords size={24} /><strong>{formatNum(totalWins)}</strong><span>Wins</span></div>
              <div><Shield size={24} /><strong>{power11}</strong><span>Power 11</span></div>
              <div><Sparkles size={24} /><strong>{hyperCount}</strong><span>Hyper</span></div>
              <div><BarChart3 size={24} /><strong>{rank30}</strong><span>R30+</span></div>
            </div>
          </section>
        </aside>

        <section className="bl-profile-main-lane">
          <section className="bl-profile-summary-card" id="lens">
            <div className="bl-profile-summary-title">
              <BarChart3 size={18} />
              <span>Last 30 games performances</span>
              <em>Brawl Score : {averageBattleScore}</em>
            </div>
            <div className="bl-profile-summary-grid">
              <div className="bl-profile-win-arc" style={{ "--score": `${winRate(recentWins, Math.max(1, recentTotal))}%` } as CSSProperties}>
                <strong>{winRate(recentWins, Math.max(1, recentTotal))}%</strong>
                <span>Winrate</span>
                <em>{recentWins}W - {recentLosses}L</em>
              </div>

              <div className="bl-profile-summary-brawlers">
                {topBrawlers.slice(0, 3).map((brawler, index) => (
                  <div key={brawler.id}>
                    <BrawlImage src={brawlerIconUrl(brawler.id)} alt="" width={38} height={38} sizes="38px" />
                    <strong style={{ color: index === 0 ? "#f0d373" : index === 1 ? "#ff9f6e" : "#8bd7ff" }}>
                      {index === 0 ? "Top" : rankLabel(brawler.rank)}
                    </strong>
                    <span>{formatTrophies(brawler.trophies)}</span>
                  </div>
                ))}
              </div>

              <div className="bl-profile-summary-kda">
                <span>Trophy swing</span>
                <strong>{recentTrophySwing > 0 ? "+" : ""}{recentTrophySwing}</strong>
                <em>{recentBattles.length ? `${(recentTrophySwing / recentBattles.length).toFixed(1)} avg` : "-- avg"}</em>
              </div>

              <div className="bl-profile-summary-rank">
                <span>Average rank</span>
                <strong>{averageRank}<small>/10</small></strong>
                <div>
                  <b>MVP</b>
                  <b>ACE</b>
                </div>
              </div>
            </div>
          </section>

          <div className="bl-profile-filter-row">
            <div className="bl-profile-icon-filter">
              <span className="is-active"><Sparkles size={18} /></span>
              <span><Shield size={18} /></span>
              <span><Swords size={18} /></span>
              <span><Users size={18} /></span>
            </div>
            <div className="bl-profile-segment">
              <span className="is-active">Day</span>
              <span>Session</span>
              <span>None</span>
            </div>
            <button type="button" className="bl-profile-filter-button">
              <Filter size={16} />
              Filters
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="bl-profile-match-list" id="battles">
            {battleGroups.length ? battleGroups.map(group => {
              const wins = group.items.filter(item => battleOutcome(item) === "win").length
              const losses = group.items.filter(item => battleOutcome(item) === "loss").length
              const swing = group.items.reduce((sum, item) => sum + (item.battle?.trophyChange ?? 0), 0)
              const groupScore = group.items.length ? (group.items.reduce((sum, item) => sum + battleScore(item), 0) / group.items.length).toFixed(1) : "--"
              return (
                <section key={group.day} className="bl-profile-day-group">
                  <div className="bl-profile-day-head">
                    <h2>{group.day}</h2>
                    <div>
                      <span>Brawl Score : {groupScore}</span>
                      <b>{wins} wins</b>
                      <em>{losses} losses</em>
                      <strong>{swing > 0 ? "+" : ""}{swing} trophies</strong>
                    </div>
                  </div>
                  {group.items.map((item, index) => (
                    <BattleRow
                      key={`${item.battleTime ?? group.day}-${index}`}
                      item={item}
                      player={player}
                      tag={tag}
                      roster={sorted}
                      fallbackBrawlers={topBrawlers}
                    />
                  ))}
                </section>
              )
            }) : (
              <section className="bl-profile-empty-battles">
                <strong>No recent battle log available.</strong>
                <span>The Brawl Stars battle log endpoint did not return matches for this tag.</span>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
