import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { formatBrawlerName } from "@/lib/format"
import { fetchPlayerBattleLogResponse, fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"
import type { Player, PlayerBrawler } from "@/types/brawler"
import PlayerProfileHero from "../PlayerProfileHero"

export const revalidate = 60

type PlayerWithMeta = Player & {
  icon?: { id?: number }
}

type BattleOutcome = "win" | "loss" | "neutral"
type BrawlerFilter = "all" | "p11" | "hyper" | "rank7" | "prestige"
type ModeFilter = "all" | "solo" | "duo" | "team"

interface LeaderboardRecord {
  rank: number
  region: string
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
    teams?: BattleParticipant[][]
    players?: BattleParticipant[]
    starPlayer?: BattleParticipant
  }
}

interface BrawlerTableRow {
  key: string
  brawler: PlayerBrawler
  games: number
  wins: number
  losses: number
  draws: number
  swing: number
  winRate: number
  outcomes: BattleOutcome[]
}

const brawlerFilters: { label: string; value: BrawlerFilter }[] = [
  { label: "All", value: "all" },
  { label: "P11", value: "p11" },
  { label: "Hyper", value: "hyper" },
  { label: "Rank 7", value: "rank7" },
  { label: "Prestige", value: "prestige" },
]

const modeFilters: { label: string; value: ModeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Solo", value: "solo" },
  { label: "Duo", value: "duo" },
  { label: "3v3", value: "team" },
]

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  return {
    title: tag ? `Brawlers #${tag} - BrawlLens` : "Player brawlers - BrawlLens",
  }
}

function cleanEnv(value: string | undefined) {
  const cleaned = value?.trim().replace(/^['"]|['"]$/g, "")
  return cleaned || null
}

function cleanBattleTag(value?: string) {
  return sanitizePlayerTag((value ?? "").replace(/^#/, ""))
}

async function fetchLeaderboardRecord(tag: string): Promise<LeaderboardRecord | null> {
  const url = cleanEnv(process.env.SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_KEY)
  if (!url || !key) return null

  try {
    const supabase = createClient(url, key)
    const { data } = await supabase
      .from("leaderboards")
      .select("rank, region")
      .in("player_tag", [`#${tag}`, tag])
      .order("rank", { ascending: true })

    const records = (data ?? []) as LeaderboardRecord[]
    return records.find(record => record.region === "global") ?? records[0] ?? null
  } catch {
    return null
  }
}

async function fetchRecentBattles(tag: string): Promise<BattleLogItem[]> {
  try {
    const response = await fetchPlayerBattleLogResponse(tag, { next: { revalidate: 120 } })
    if (!response.ok) return []
    const data = (await response.json()) as { items?: BattleLogItem[] }
    return data.items ?? []
  } catch {
    return []
  }
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
    null
  )
}

function findRosterBrawler(roster: PlayerBrawler[], battleBrawler: BattleBrawler | null | undefined) {
  if (!battleBrawler) return null
  return roster.find(brawler => brawler.id === battleBrawler.id) ??
    roster.find(brawler => brawler.name.toLowerCase() === battleBrawler.name?.toLowerCase()) ??
    null
}

function battleOutcome(item: BattleLogItem): BattleOutcome {
  if (item.battle?.result === "victory") return "win"
  if (item.battle?.result === "defeat") return "loss"
  if (typeof item.battle?.rank === "number") return item.battle.rank <= 4 ? "win" : "loss"
  return "neutral"
}

function modeBucket(item: BattleLogItem): ModeFilter {
  const text = `${item.battle?.mode ?? ""} ${item.event?.mode ?? ""} ${item.battle?.type ?? ""}`.toLowerCase()
  if (text.includes("solo")) return "solo"
  if (text.includes("duo")) return "duo"
  return "team"
}

function winRate(wins: number, total: number) {
  return total > 0 ? Math.round((wins / total) * 100) : 0
}

function winRateTone(value: number) {
  if (value >= 60) return "is-good"
  if (value >= 50) return "is-even"
  if (value >= 40) return "is-warn"
  return "is-low"
}

function formatSigned(value: number, digits = 0) {
  const formatted = digits > 0 ? value.toFixed(digits) : Math.round(value).toLocaleString("en-US")
  return value > 0 ? `+${formatted}` : formatted
}

function formatTrophyCount(value: number) {
  return value.toLocaleString("en-US")
}

function brawlerScore(row: BrawlerTableRow) {
  if (!row.games) return null
  const averageSwing = row.swing / row.games
  const score = 50 + (row.winRate - 50) * 0.55 + averageSwing * 4 + Math.min(row.games, 12)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function scoreTone(score: number | null) {
  if (score === null) return ""
  if (score >= 80) return "is-good"
  if (score >= 65) return "is-even"
  if (score >= 45) return "is-warn"
  return "is-low"
}

function matchesBrawlerFilter(brawler: PlayerBrawler, filter: BrawlerFilter) {
  if (filter === "p11") return brawler.power >= 11
  if (filter === "hyper") return (brawler.hyperCharges ?? []).length > 0
  if (filter === "rank7") return brawler.rank >= 7
  if (filter === "prestige") return brawler.prestigeLevel > 0
  return true
}

function buildRows(roster: PlayerBrawler[], battles: BattleLogItem[], player: PlayerWithMeta, tag: string) {
  const rows = new Map<number, BrawlerTableRow>()

  for (const brawler of roster) {
    rows.set(brawler.id, {
      key: String(brawler.id),
      brawler,
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      swing: 0,
      winRate: 0,
      outcomes: [],
    })
  }

  for (const item of battles) {
    const participant = findPlayerParticipant(item, player, tag)
    const rosterBrawler = findRosterBrawler(roster, participant?.brawler)
    if (!rosterBrawler) continue

    const row = rows.get(rosterBrawler.id)
    if (!row) continue

    const outcome = battleOutcome(item)
    row.games += 1
    row.wins += outcome === "win" ? 1 : 0
    row.losses += outcome === "loss" ? 1 : 0
    row.draws += outcome === "neutral" ? 1 : 0
    row.swing += item.battle?.trophyChange ?? 0
    row.winRate = winRate(row.wins, row.games)
    row.outcomes.push(outcome)
  }

  return [...rows.values()].sort((a, b) => {
    if (b.games !== a.games) return b.games - a.games
    if (b.winRate !== a.winRate) return b.winRate - a.winRate
    return b.brawler.trophies - a.brawler.trophies
  })
}

function filterHref(tag: string, filter: BrawlerFilter, mode: ModeFilter) {
  const params = new URLSearchParams()
  if (filter !== "all") params.set("filter", filter)
  if (mode !== "all") params.set("mode", mode)
  const query = params.toString()
  return `/player/${encodeURIComponent(tag)}/brawlers${query ? `?${query}` : ""}`
}

function normalizeFilter(value: string | string[] | undefined): BrawlerFilter {
  const current = Array.isArray(value) ? value[0] : value
  return brawlerFilters.some(option => option.value === current) ? current as BrawlerFilter : "all"
}

function normalizeMode(value: string | string[] | undefined): ModeFilter {
  const current = Array.isArray(value) ? value[0] : value
  return modeFilters.some(option => option.value === current) ? current as ModeFilter : "all"
}

function OutcomeChips({ outcomes }: { outcomes: BattleOutcome[] }) {
  const lastFive = outcomes.slice(0, 5)
  return (
    <span className="bl-profile-brawlers-last-five" aria-label="Last five outcomes">
      {Array.from({ length: 5 }).map((_, index) => {
        const outcome = lastFive[index]
        return (
          <span key={`${outcome ?? "empty"}-${index}`} className={`bl-profile-outcome-chip ${outcome ? `is-${outcome}` : "is-empty"}`}>
            {outcome === "win" ? "W" : outcome === "loss" ? "L" : outcome === "neutral" ? "D" : ""}
          </span>
        )
      })}
    </span>
  )
}

function BrawlerRow({ row, index }: { row: BrawlerTableRow; index: number }) {
  const score = brawlerScore(row)
  return (
    <details className="bl-profile-brawlers-row-shell">
      <summary className="bl-profile-brawlers-row">
        <span className="bl-profile-brawlers-rank">{index + 1}</span>
        <span className="bl-profile-brawlers-name">
          <BrawlImage src={brawlerIconUrl(row.brawler.id)} alt="" width={34} height={34} sizes="34px" />
          <span>
            <strong>{formatBrawlerName(row.brawler.name)}</strong>
            <small>P{row.brawler.power} · Rank {row.brawler.rank}</small>
          </span>
        </span>
        <strong>{row.games}</strong>
        <span className={`bl-profile-brawlers-wr ${row.games ? winRateTone(row.winRate) : ""}`}>
          <b>{row.games ? `${row.winRate}%` : "--"}</b>
          <small>{row.wins}W - {row.losses}L</small>
        </span>
        <strong>{formatTrophyCount(row.brawler.trophies)}</strong>
        <strong>{formatTrophyCount(row.brawler.highestTrophies)}</strong>
        <strong>P{row.brawler.power}</strong>
        <strong>{row.brawler.rank}</strong>
        <span className={`bl-profile-brawlers-score ${scoreTone(score)}`}>{score ?? "--"}</span>
        <OutcomeChips outcomes={row.outcomes} />
        <span className="bl-profile-row-arrow" aria-hidden="true" />
      </summary>
      <div className="bl-profile-brawlers-extra">
        <span>Prestige <b>{row.brawler.prestigeLevel}</b></span>
        <span>Current streak <b>{row.brawler.currentWinStreak}</b></span>
        <span>Max streak <b>{row.brawler.maxWinStreak}</b></span>
        <span>Recent swing <b>{formatSigned(row.swing)}</b></span>
        <span>Gadgets <b>{row.brawler.gadgets?.length ?? 0}</b></span>
        <span>Star powers <b>{row.brawler.starPowers?.length ?? 0}</b></span>
        <span>Gears <b>{row.brawler.gears?.length ?? 0}</b></span>
        <span>Hypercharges <b>{row.brawler.hyperCharges?.length ?? 0}</b></span>
      </div>
    </details>
  )
}

export default async function PlayerBrawlersPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>
  searchParams: Promise<{ filter?: string | string[]; mode?: string | string[] }>
}) {
  const { tag: rawTag } = await params
  const query = await searchParams
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) notFound()

  let player: PlayerWithMeta
  try {
    const response = await fetchPlayerResponse(tag, { next: { revalidate: 60 } })
    if (response.status === 404) notFound()
    if (!response.ok) throw new Error()
    player = await response.json()
  } catch {
    return (
      <main className="bl-lb-shell bl-profile-shell">
        <section className="bl-profile-error">
          <div>Connection error</div>
          <h1>Could not load brawlers</h1>
          <p>The player API did not respond. Try again in a moment, or search for a different tag.</p>
          <span>#{tag}</span>
        </section>
      </main>
    )
  }

  const filter = normalizeFilter(query.filter)
  const mode = normalizeMode(query.mode)
  const [leaderboardRecord, recentBattles] = await Promise.all([
    fetchLeaderboardRecord(tag),
    fetchRecentBattles(tag),
  ])

  const roster = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
  const scopedBattles = mode === "all" ? recentBattles : recentBattles.filter(item => modeBucket(item) === mode)
  const rows = buildRows(roster, scopedBattles, player, tag).filter(row => matchesBrawlerFilter(row.brawler, filter))
  const recentWins = scopedBattles.filter(item => battleOutcome(item) === "win").length
  const recentLosses = scopedBattles.filter(item => battleOutcome(item) === "loss").length
  const recentTotal = recentWins + recentLosses
  const recentSwing = scopedBattles.reduce((sum, item) => sum + (item.battle?.trophyChange ?? 0), 0)
  const power11Count = roster.filter(brawler => brawler.power >= 11).length
  const rank7Count = roster.filter(brawler => brawler.rank >= 7).length
  const allOutcomes = scopedBattles.map(battleOutcome).slice(0, 5)
  const allScore = recentTotal ? Math.max(0, Math.min(100, Math.round(50 + (winRate(recentWins, recentTotal) - 50) * 0.55 + (recentSwing / Math.max(1, scopedBattles.length)) * 4 + Math.min(scopedBattles.length, 12)))) : null
  const regionLabel = leaderboardRecord?.region === "global" ? "ALL" : leaderboardRecord?.region ?? "ALL"

  return (
    <main className="bl-lb-shell bl-profile-shell">
      <PlayerProfileHero
        name={player.name}
        tag={tag}
        prestigeLevel={player.totalPrestigeLevel ?? 0}
        regionLabel={regionLabel}
        iconId={player.icon?.id}
        activeTab="brawlers"
      />

      <div className="bl-lb-frame bl-profile-frame">
        <section className="bl-lb-board bl-profile-board bl-profile-brawlers-board" id="brawlers">
          <div className="bl-profile-brawlers-toolbar">
            <div className="bl-profile-brawlers-filterset" aria-label="Brawler filter">
              {brawlerFilters.map(option => (
                <Link
                  key={option.value}
                  href={filterHref(tag, option.value, mode)}
                  className={filter === option.value ? "is-active" : ""}
                  prefetch={false}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <h2>Season stats</h2>
            <div className="bl-profile-brawlers-filterset bl-profile-brawlers-modes" aria-label="Mode filter">
              {modeFilters.map(option => (
                <Link
                  key={option.value}
                  href={filterHref(tag, filter, option.value)}
                  className={mode === option.value ? "is-active" : ""}
                  prefetch={false}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bl-profile-brawlers-table">
            <div className="bl-profile-brawlers-head">
              <span />
              <span>Brawler</span>
              <span>Games</span>
              <span>WR</span>
              <span>Trophies</span>
              <span>Peak</span>
              <span>Power</span>
              <span>Rank</span>
              <span>Score</span>
              <span>Last 5</span>
              <span />
            </div>

            <div className="bl-profile-brawlers-row-shell bl-profile-brawlers-row-all">
              <div className="bl-profile-brawlers-row">
                <span className="bl-profile-brawlers-rank">*</span>
                <span className="bl-profile-brawlers-name">
                  <span className="bl-profile-brawlers-all-mark">*</span>
                  <span>
                    <strong>All Brawlers</strong>
                    <small>{roster.length} unlocked · {power11Count} P11</small>
                  </span>
                </span>
                <strong>{scopedBattles.length}</strong>
                <span className={`bl-profile-brawlers-wr ${recentTotal ? winRateTone(winRate(recentWins, recentTotal)) : ""}`}>
                  <b>{recentTotal ? `${winRate(recentWins, recentTotal)}%` : "--"}</b>
                  <small>{recentWins}W - {recentLosses}L</small>
                </span>
                <strong>{formatTrophyCount(player.trophies)}</strong>
                <strong>{formatTrophyCount(player.highestTrophies)}</strong>
                <strong>{power11Count}</strong>
                <strong>{rank7Count}</strong>
                <span className={`bl-profile-brawlers-score ${scoreTone(allScore)}`}>{allScore ?? "--"}</span>
                <OutcomeChips outcomes={allOutcomes} />
                <span />
              </div>
            </div>

            {rows.map((row, index) => (
              <BrawlerRow key={row.key} row={row} index={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
