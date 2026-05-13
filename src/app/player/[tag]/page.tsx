import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { cleanEnv } from "@/lib/env"
import { formatBrawlerName } from "@/lib/format"
import { fetchClubResponse, fetchPlayerBattleLogResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"
import type { Player, PlayerBrawler } from "@/types/brawler"
import PlayerBattleFilters from "./PlayerBattleFilters"
import PlayerProfileHero from "./PlayerProfileHero"

export const revalidate = 60

type PlayerWithMeta = Player & {
  icon?: { id?: number }
  club?: { name?: string; tag?: string }
}

interface ClubProfile {
  badgeId?: number
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

interface BrawlerPerformanceStat {
  key: string
  brawler: BattleBrawler | PlayerBrawler
  games: number
  wins: number
  swing: number
  averageSwing: number
  winRate: number
}

interface ModePerformanceStat {
  key: string
  label: string
  games: number
  wins: number
  swing: number
  winRate: number
}

const stateActionClass = "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-4 text-[13px] font-bold text-[var(--lb-text)] no-underline transition-colors hover:border-[var(--lb-line-2)] hover:bg-[var(--lb-panel-3)]"

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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
    const description = `${name} (#${tag}) with ${trophies.toLocaleString()} trophies on BrawlLens.`
    return {
      title: `${name} - BrawlLens`,
      description,
      openGraph: { title: `${name} - BrawlLens`, description, type: "profile" },
    }
  } catch {
    return {
      title: `#${tag} - BrawlLens`,
      description: `BrawlLens profile lookup for player #${tag}.`,
    }
  }
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
    const response = await fetchPlayerBattleLogResponse(tag, { cache: "no-store" })
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

function formatFullNumber(value: number) {
  return value.toLocaleString("en-US")
}

function formatTrophyCount(value: number) {
  return formatFullNumber(value)
}

function formatSigned(value: number, digits = 0) {
  const formatted = digits > 0 ? value.toFixed(digits) : Math.round(value).toLocaleString("en-US")
  return value > 0 ? `+${formatted}` : formatted
}

function formatAverage(value: number | null, digits = 0) {
  if (value === null) return "--"
  return digits > 0 ? value.toFixed(digits) : Math.round(value).toLocaleString("en-US")
}

function formatPowerAverage(value: number | null) {
  return value === null ? "--" : `P${formatAverage(value, 1)}`
}

function formatBattleDuration(seconds: number | undefined) {
  if (!seconds) return "--"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes ? `${minutes}:${String(remainingSeconds).padStart(2, "0")}` : `${remainingSeconds}s`
}

function ladderTier(trophies: number) {
  if (trophies >= 100_000) return { key: "ultimate", label: "Ultimate", short: "" }
  if (trophies >= 80_000) return { key: "masters", label: "Masters", short: "M" }
  if (trophies >= 60_000) return { key: "legendary", label: "Legendary", short: "L" }
  if (trophies >= 40_000) return { key: "mythic", label: "Mythic", short: "M" }
  if (trophies >= 25_000) return { key: "diamond", label: "Diamond", short: "D" }
  return { key: "trophy", label: "Trophy", short: "T" }
}

function ladderRankValue(record: LeaderboardRecord | null, total: number | null) {
  if (!record) return "--"
  if (record.rank <= 200) return ordinal(record.rank)
  const percentile = percentRank(record.rank, total)
  return percentile ? `Top ${percentile}` : `#${record.rank.toLocaleString("en-US")}`
}

function firstGlyph(value: string | undefined) {
  return Array.from((value ?? "").trim())[0]?.toUpperCase() || "?"
}

function winRate(wins: number, total: number) {
  return total > 0 ? Math.round((wins / total) * 100) : 0
}

function brawlerTrophies(brawler: BattleBrawler | PlayerBrawler) {
  return typeof brawler.trophies === "number" ? brawler.trophies : null
}

function brawlerPower(brawler: BattleBrawler | PlayerBrawler) {
  return typeof brawler.power === "number" ? brawler.power : null
}

function brawlerRowMeta(brawler: BattleBrawler | PlayerBrawler) {
  const power = brawlerPower(brawler)
  return power ? `P${power}` : "Roster"
}

function cleanBattleTag(value?: string) {
  return sanitizePlayerTag((value ?? "").replace(/^#/, ""))
}

function cleanClubTag(value?: string) {
  return sanitizePlayerTag((value ?? "").replace(/^#/, ""))
}

function clubBadgeUrl(id: number) {
  return `https://cdn.brawlify.com/club-badges/regular/${id}.png`
}

async function fetchClubBadgeId(tag: string | null): Promise<number | null> {
  if (!tag) return null

  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 900 } })
    if (!response.ok) return null
    const club = (await response.json()) as ClubProfile
    return club.badgeId ?? null
  } catch {
    return null
  }
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

function findTeamContext(item: BattleLogItem, player: PlayerWithMeta, tag: string) {
  const expected = cleanBattleTag(tag)
  const teams = item.battle?.teams
  if (!teams?.length) return { teammates: [] as BattleParticipant[], opponents: findOpponents(item, player, tag) }

  const ownIndex = teams.findIndex(team => team.some(participant => cleanBattleTag(participant.tag) === expected || participant.name === player.name))
  if (ownIndex < 0) return { teammates: [] as BattleParticipant[], opponents: teams.flat().slice(0, 3) }

  return {
    teammates: teams[ownIndex].filter(participant => cleanBattleTag(participant.tag) !== expected && participant.name !== player.name).slice(0, 2),
    opponents: teams.filter((_, index) => index !== ownIndex).flat().slice(0, 3),
  }
}

function averageBattleValue(participants: BattleParticipant[], field: "power" | "trophies") {
  const values = participants
    .map(participant => participant.brawler?.[field])
    .filter((value): value is number => typeof value === "number")
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function isParticipantOnTeam(team: BattleParticipant[], tag?: string) {
  const expected = cleanBattleTag(tag)
  if (!expected) return false
  return team.some(participant => cleanBattleTag(participant.tag) === expected)
}

function teamQuality(item: BattleLogItem, player: PlayerWithMeta, tag: string) {
  const expected = cleanBattleTag(tag)
  const teams = item.battle?.teams
  if (!teams?.length) return null

  const ownIndex = teams.findIndex(team => team.some(participant => cleanBattleTag(participant.tag) === expected || participant.name === player.name))
  if (ownIndex < 0) return null

  const ownTeam = teams[ownIndex]
  const enemyTeam = teams.filter((_, index) => index !== ownIndex).flat()
  if (!enemyTeam.length) return null

  let score = 0
  let evidence = 0
  const ownPower = averageBattleValue(ownTeam, "power")
  const enemyPower = averageBattleValue(enemyTeam, "power")
  const ownTrophies = averageBattleValue(ownTeam, "trophies")
  const enemyTrophies = averageBattleValue(enemyTeam, "trophies")

  if (ownPower !== null && enemyPower !== null) {
    score += Math.max(-20, Math.min(20, (ownPower - enemyPower) * 7))
    evidence += 1
  }

  if (ownTrophies !== null && enemyTrophies !== null) {
    score += Math.max(-22, Math.min(22, (ownTrophies - enemyTrophies) / 35))
    evidence += 1
  }

  if (item.battle?.starPlayer?.tag) {
    if (isParticipantOnTeam(ownTeam, item.battle.starPlayer.tag)) score += 8
    if (isParticipantOnTeam(enemyTeam, item.battle.starPlayer.tag)) score -= 8
    evidence += 1
  }

  if (!evidence) return null
  if (score >= 10) return { label: "Strong team", tone: "strong" }
  if (score <= -10) return { label: "Weak team", tone: "weak" }
  return { label: "Even team", tone: "even" }
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
  let score = 50
  score += Math.max(-24, Math.min(24, trophyChange * 2.4))
  if (typeof rank === "number") score += Math.max(-18, Math.min(18, (5 - rank) * 4))
  if (outcome === "win") score += 8
  if (outcome === "loss") score -= 8
  return Math.max(22, Math.min(100, Math.round(score)))
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

function compactMode(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase())
}

function slugifyFilter(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "unknown"
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

function winRateTone(value: number) {
  if (value >= 60) return "is-good"
  if (value >= 50) return "is-even"
  if (value >= 40) return "is-warn"
  return "is-low"
}

function buildBrawlerPerformanceStats(items: BattleLogItem[], player: PlayerWithMeta, tag: string, roster: PlayerBrawler[]) {
  const stats = new Map<string, BrawlerPerformanceStat>()

  for (const item of items) {
    const participant = findPlayerParticipant(item, player, tag)
    const battleBrawler = participant?.brawler ?? null
    const rosterBrawler = findRosterBrawler(roster, battleBrawler)
    const brawler = rosterBrawler ?? battleBrawler
    if (!brawler?.id && !brawler?.name) continue

    const key = String(brawler.id ?? brawler.name)
    const existing = stats.get(key) ?? {
      key,
      brawler,
      games: 0,
      wins: 0,
      swing: 0,
      averageSwing: 0,
      winRate: 0,
    }
    existing.games += 1
    existing.wins += battleOutcome(item) === "win" ? 1 : 0
    existing.swing += item.battle?.trophyChange ?? 0
    existing.averageSwing = existing.games ? existing.swing / existing.games : 0
    existing.winRate = winRate(existing.wins, existing.games)
    stats.set(key, existing)
  }

  const rows = [...stats.values()]
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate || b.swing - a.swing)
    .slice(0, 6)

  const seen = new Set(rows.map(row => row.key))
  for (const brawler of roster) {
    if (rows.length >= 6) break
    const key = String(brawler.id)
    if (seen.has(key)) continue
    rows.push({
      key,
      brawler,
      games: 0,
      wins: 0,
      swing: 0,
      averageSwing: 0,
      winRate: 0,
    })
    seen.add(key)
  }

  if (rows.length) return rows

  return roster.slice(0, 6).map(brawler => ({
    key: String(brawler.id),
    brawler,
    games: 0,
    wins: 0,
    swing: 0,
    averageSwing: 0,
    winRate: 0,
  }))
}

function buildModePerformanceStats(items: BattleLogItem[]) {
  const stats = new Map<string, ModePerformanceStat>()

  for (const item of items) {
    const label = compactMode(modeLabel(item))
    const key = label.toLowerCase()
    const existing = stats.get(key) ?? {
      key,
      label,
      games: 0,
      wins: 0,
      swing: 0,
      winRate: 0,
    }
    existing.games += 1
    existing.wins += battleOutcome(item) === "win" ? 1 : 0
    existing.swing += item.battle?.trophyChange ?? 0
    existing.winRate = winRate(existing.wins, existing.games)
    stats.set(key, existing)
  }

  return [...stats.values()]
    .sort((a, b) => b.games - a.games || b.winRate - a.winRate || b.swing - a.swing)
    .slice(0, 5)
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

function BrawlerStack({ entries }: { entries: (BattleBrawler | PlayerBrawler | null | undefined)[] }) {
  return (
    <div className="bl-profile-party-stack">
      {entries.slice(0, 3).map((brawler, index) => (
        brawler ? (
          <span key={`${brawler?.id ?? brawler?.name ?? "fallback"}-${index}`}>
            <BrawlerThumb brawler={brawler} size={24} />
          </span>
        ) : null
      ))}
    </div>
  )
}

function TeamPreview({
  playerBrawler,
  teammates,
  opponents,
  fallback,
}: {
  playerBrawler: BattleBrawler | PlayerBrawler | null | undefined
  teammates: BattleParticipant[]
  opponents: BattleParticipant[]
  fallback: PlayerBrawler[]
}) {
  const teammateBrawlers = [playerBrawler, ...teammates.map(participant => participant.brawler ?? null)].filter(Boolean)
  const opponentBrawlers = opponents.length ? opponents.map(participant => participant.brawler ?? null) : fallback.slice(0, 3)

  return (
    <div className="bl-profile-versus">
      <BrawlerStack entries={teammateBrawlers} />
      <b>VS</b>
      <BrawlerStack entries={opponentBrawlers} />
    </div>
  )
}

function BrawlerPerformanceRow({ stat }: { stat: BrawlerPerformanceStat }) {
  const trophies = brawlerTrophies(stat.brawler)
  const winRateText = stat.games ? `${stat.winRate}%` : "--"

  return (
    <div className="bl-profile-brawler-perf-row">
      <div className="bl-profile-brawler-cell">
        <BrawlerThumb brawler={stat.brawler} size={34} />
        <span>
          <strong>{formatBrawlerName(stat.brawler.name ?? "Brawler")}</strong>
          <small>{brawlerRowMeta(stat.brawler)}</small>
        </span>
      </div>
      <strong className="bl-profile-brawler-trophies">{trophies ? formatTrophyCount(trophies) : "--"}</strong>
      <span className="bl-profile-brawler-games">{stat.games}</span>
      <em className={stat.games ? winRateTone(stat.winRate) : ""}>{winRateText}</em>
    </div>
  )
}

function ModePerformanceRow({ stat }: { stat: ModePerformanceStat }) {
  return (
    <div className="bl-profile-mode-row">
      <strong>
        {stat.label}
        <small>{formatSigned(stat.swing)} trophies</small>
      </strong>
      <b>{stat.games}</b>
      <span>{stat.games ? formatSigned(stat.swing / stat.games, 1) : "--"}</span>
      <em className={winRateTone(stat.winRate)}>{stat.winRate}%</em>
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
  const trophyChange = item.battle?.trophyChange ?? 0
  const outcome = battleOutcome(item)
  const mode = compactMode(modeLabel(item))
  const teamContext = findTeamContext(item, player, tag)
  const quality = teamQuality(item, player, tag)
  const ownTeamMembers = [participant, ...teamContext.teammates].filter((member): member is BattleParticipant => Boolean(member))
  const ownPower = averageBattleValue(ownTeamMembers, "power")
  const enemyPower = averageBattleValue(teamContext.opponents, "power")
  const ownTrophies = averageBattleValue(ownTeamMembers, "trophies")
  const enemyTrophies = averageBattleValue(teamContext.opponents, "trophies")
  const starPlayer = item.battle?.starPlayer
  const starPlayerBrawler = starPlayer?.brawler?.name ? formatBrawlerName(starPlayer.brawler.name) : "--"

  return (
    <details
      className={`bl-profile-match-shell ${resultTone(item)}`}
      data-battle-row
      data-outcome={outcome}
      data-mode={slugifyFilter(mode)}
    >
      <summary className="bl-profile-match-row">
        <div className="bl-profile-match-meta">
          <strong>{formatClock(time)}</strong>
          <span>{formatAge(time)}</span>
          <b>{mode}</b>
          <em className={trophyChange < 0 ? "is-loss" : ""}>{battleResultLine(item)} trophies</em>
        </div>

        <div className="bl-profile-match-brawler">
          <BrawlerThumb brawler={battleBrawler ?? fallback} size={48} />
          <span>{battleBrawler?.power ?? rosterBrawler?.power ? `P${battleBrawler?.power ?? rosterBrawler?.power}` : ""}</span>
        </div>

        <div className="bl-profile-match-scoreline">
          <strong>{outcome === "win" ? "Win" : outcome === "loss" ? "Loss" : "Draw"}</strong>
          {quality && <span className={`is-${quality.tone}`}>{quality.label}</span>}
        </div>

        <div className="bl-profile-match-details">
          <strong>{battleBrawlerName(battleBrawler, fallback)}</strong>
          <span>{item.event?.map ?? "Unknown map"}</span>
          <em>{rosterBrawler ? formatTrophyCount(rosterBrawler.trophies) : "Battle log"}</em>
        </div>

        <TeamPreview playerBrawler={battleBrawler ?? fallback} teammates={teamContext.teammates} opponents={teamContext.opponents} fallback={fallbackBrawlers} />
        <span className="bl-profile-row-arrow" aria-hidden="true" />
      </summary>

      <div className="bl-profile-match-extra">
        <div>
          <span>Map</span>
          <strong>{item.event?.map ?? "Unknown map"}</strong>
          <small>{mode}</small>
        </div>
        <div>
          <span>Battle</span>
          <strong>{compactMode(item.battle?.type ?? "Battle log")}</strong>
          <small>{formatBattleDuration(item.battle?.duration)}</small>
        </div>
        <div>
          <span>Your team</span>
          <strong>{formatPowerAverage(ownPower)}</strong>
          <small>{formatAverage(ownTrophies)} avg trophies</small>
        </div>
        <div>
          <span>Enemy team</span>
          <strong>{formatPowerAverage(enemyPower)}</strong>
          <small>{formatAverage(enemyTrophies)} avg trophies</small>
        </div>
        <div>
          <span>Team read</span>
          <strong>{quality?.label ?? "No signal"}</strong>
          <small>Power, trophies, star player</small>
        </div>
        <div>
          <span>Star player</span>
          <strong>{starPlayer?.name ?? "--"}</strong>
          <small>{starPlayerBrawler}</small>
        </div>
      </div>
    </details>
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

  const playerClubTag = cleanClubTag(player.club?.tag)
  const [{ record: leaderboardRecord, globalCount }, recentBattles, clubBadgeId] = await Promise.all([
    fetchLeaderboardRecord(tag),
    fetchRecentBattles(tag),
    fetchClubBadgeId(playerClubTag),
  ])

  const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
  const topBrawlers = sorted.slice(0, 8)
  const club = player.club
  const regionLabel = leaderboardRecord?.region === "global" ? "ALL" : leaderboardRecord?.region ?? "ALL"
  const recentWins = recentBattles.filter(item => battleOutcome(item) === "win").length
  const recentLosses = recentBattles.filter(item => battleOutcome(item) === "loss").length
  const recentTotal = recentWins + recentLosses
  const recentTrophySwing = recentBattles.reduce((sum, item) => sum + (item.battle?.trophyChange ?? 0), 0)
  const averageRankValues = recentBattles.map(item => item.battle?.rank).filter((value): value is number => typeof value === "number")
  const averageRank = averageRankValues.length ? (averageRankValues.reduce((sum, value) => sum + value, 0) / averageRankValues.length).toFixed(1) : "--"
  const averageBattleScore = recentBattles.length ? (recentBattles.reduce((sum, item) => sum + battleScore(item), 0) / recentBattles.length).toFixed(1) : "--"
  const battleGroups = groupBattles(recentBattles)
  const recentWinRate = winRate(recentWins, Math.max(1, recentTotal))
  const tier = ladderTier(player.trophies)
  const brawlerPerformance = buildBrawlerPerformanceStats(recentBattles, player, tag, sorted)
  const modePerformance = buildModePerformanceStats(recentBattles)
  const clubHref = playerClubTag ? `/leaderboards/clubs?search=${encodeURIComponent(playerClubTag)}` : "/leaderboards/clubs"
  const recentAverageSwing = recentBattles.length ? recentTrophySwing / recentBattles.length : 0
  const mostPlayed = brawlerPerformance.find(stat => stat.games > 0) ?? brawlerPerformance[0] ?? null
  const bestRoster = topBrawlers[0] ?? null
  const bestMode = modePerformance[0] ?? null
  const battleModeOptions = Array.from(
    new Map(recentBattles.map(item => {
      const label = compactMode(modeLabel(item))
      return [slugifyFilter(label), { label, value: slugifyFilter(label) }]
    })).values()
  )

  return (
    <main className="bl-lb-shell bl-profile-shell">
      <PlayerProfileHero
        name={player.name}
        tag={tag}
        prestigeLevel={player.totalPrestigeLevel ?? 0}
        regionLabel={regionLabel}
        iconId={player.icon?.id}
        activeTab="overview"
      />

      <div className="bl-lb-frame bl-profile-frame">
        <section className="bl-lb-board bl-profile-board">
          <div className="bl-profile-dashboard">
        <aside className="bl-profile-left-rail" id="overview">
          <section className="bl-profile-ranked-card">
            <div className="bl-profile-card-title">
              <span>Ladder</span>
            </div>
            <div className="bl-profile-rank-main">
              <span className={`bl-profile-tier-mark bl-profile-tier-${tier.key}`} title={tier.label}>
                <strong>{tier.short}</strong>
              </span>
              <div className="bl-profile-ladder-stack">
                <div className="bl-profile-ladder-line">
                  <strong>{formatFullNumber(player.trophies)}</strong>
                </div>
                <div className="bl-profile-ladder-line">
                  <strong>{recentWinRate}% recent winrate</strong>
                </div>
              </div>
            </div>
            <div className="bl-profile-ladder-rank">
              <span>LADDER RANK</span>
              <strong>{ladderRankValue(leaderboardRecord, globalCount)}</strong>
            </div>
            <div className="bl-profile-ladder-meta">
              <span>Peak <b>{formatFullNumber(player.highestTrophies ?? player.trophies)}</b></span>
              <span className={`bl-profile-ladder-tier-label bl-profile-ladder-tier-${tier.key}`}>{tier.label}</span>
            </div>
          </section>

          <section className="bl-profile-panel" id="brawlers">
            <div className="bl-profile-card-title">
              <span>Brawler performance</span>
            </div>
            <div className="bl-profile-brawler-head">
              <span>Brawler</span>
              <span>Trophies</span>
              <span>Games</span>
              <span>WR</span>
            </div>
            <div className="bl-profile-brawler-table">
              {brawlerPerformance.map(stat => (
                <BrawlerPerformanceRow key={stat.key} stat={stat} />
              ))}
            </div>
            <Link href="#brawlers" className="bl-profile-card-action">All</Link>
          </section>

          <section className="bl-profile-panel">
            <div className="bl-profile-card-title">
              <span>Mode performance</span>
            </div>
            <div className="bl-profile-mode-head">
              <span>Mode</span>
              <span>Games</span>
              <span>Avg</span>
              <span>WR</span>
            </div>
            <div className="bl-profile-mode-table">
              {modePerformance.length ? modePerformance.map(stat => (
                <ModePerformanceRow key={stat.key} stat={stat} />
              )) : (
                <div className="bl-profile-mode-empty">No recent mode breakdown</div>
              )}
            </div>
          </section>

          <section className="bl-profile-panel" id="club">
            <div className="bl-profile-card-title">
              <span>Club</span>
            </div>
            <Link href={clubHref} className="bl-profile-played-with">
              <span className="bl-profile-club-mark">
                {clubBadgeId ? (
                  <BrawlImage src={clubBadgeUrl(clubBadgeId)} alt="" width={42} height={42} sizes="42px" />
                ) : (
                  club?.name ? club.name.slice(0, 2).toUpperCase() : "--"
                )}
              </span>
              <div>
                <strong>{club?.name ?? "No club"}</strong>
                <p>{club?.tag ?? "No visible club tag"}</p>
              </div>
            </Link>
          </section>
        </aside>

        <section className="bl-profile-main-lane">
          <section className="bl-profile-summary-card" id="lens">
            <div className="bl-profile-summary-title">
              <span>Last 30 games performances</span>
              <em>Brawl score: {averageBattleScore}</em>
            </div>
            <div className="bl-profile-summary-metrics">
              <div className="bl-profile-summary-metric">
                <span>Recent WR</span>
                <strong>{recentWinRate}%</strong>
                <small>{recentWins}W - {recentLosses}L</small>
              </div>
              <div className="bl-profile-summary-metric">
                <span>Trophy swing</span>
                <strong>{formatSigned(recentTrophySwing)}</strong>
                <small>{recentBattles.length ? `${formatSigned(recentAverageSwing, 1)} avg / battle` : "-- avg / battle"}</small>
              </div>
              <div className="bl-profile-summary-metric">
                <span>Average rank</span>
                <strong>{averageRank}</strong>
                <small>{averageRank === "--" ? "No placement data" : "Recent placement"}</small>
              </div>
              <div className="bl-profile-summary-metric">
                <span>Most played</span>
                <strong>{mostPlayed ? formatBrawlerName(mostPlayed.brawler.name ?? "Brawler") : "--"}</strong>
                <small>{mostPlayed?.games ? `${mostPlayed.games} games · ${mostPlayed.winRate}% WR` : "No recent brawler"}</small>
              </div>
              <div className="bl-profile-summary-metric">
                <span>Best brawler</span>
                <strong>{bestRoster ? formatBrawlerName(bestRoster.name) : "--"}</strong>
                <small>{bestRoster ? `${formatTrophyCount(bestRoster.trophies)} · P${bestRoster.power}` : "No roster data"}</small>
              </div>
              <div className="bl-profile-summary-metric">
                <span>Best mode</span>
                <strong>{bestMode?.label ?? "--"}</strong>
                <small>{bestMode ? `${bestMode.games} games · ${bestMode.winRate}% WR` : "No mode data"}</small>
              </div>
            </div>
          </section>

          <PlayerBattleFilters modes={battleModeOptions}>
            {battleGroups.length ? battleGroups.map(group => {
              const wins = group.items.filter(item => battleOutcome(item) === "win").length
              const losses = group.items.filter(item => battleOutcome(item) === "loss").length
              const groupScore = group.items.length ? (group.items.reduce((sum, item) => sum + battleScore(item), 0) / group.items.length).toFixed(1) : "--"
              return (
                <section key={group.day} className="bl-profile-day-group">
                  <div className="bl-profile-day-head">
                    <h2>{group.day}</h2>
                    <div>
                      <span>Brawl score: {groupScore}</span>
                      <b>{wins} wins</b>
                      <em>{losses} losses</em>
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
          </PlayerBattleFilters>
        </section>
          </div>
        </section>
      </div>
    </main>
  )
}
