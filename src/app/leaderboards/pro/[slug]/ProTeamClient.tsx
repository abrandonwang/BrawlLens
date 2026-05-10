"use client"

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import Link from "next/link"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { profileIconUrl } from "@/lib/leaderboardUtils"
import {
  type LeaderboardKind,
  LeaderboardBoard,
  LeaderboardPageShell,
  LeaderboardPanel,
  RankCell,
  TableHead,
} from "@/app/leaderboards/LeaderboardDpmShell"
import {
  getTeamAverages,
  getWinRate,
  type ProMatch,
  type ProPlayer,
  type ProPlayerGroup,
  type ProTeam,
} from "@/data/proTeams"

type ViewMode = "overview" | "log"
type GroupFilter = "All" | ProPlayerGroup
type LogFilter = "All" | "Wins" | "Losses" | "Draws"

const overviewGrid = "grid grid-cols-[34px_minmax(160px,1.1fr)_84px_92px_86px_56px_minmax(130px,0.8fr)_78px] items-center gap-1"
const logGrid = "grid grid-cols-[92px_minmax(150px,0.95fr)_76px_86px_minmax(132px,0.8fr)_minmax(150px,0.9fr)_82px_34px] items-center gap-1"
const logFilters: LogFilter[] = ["All", "Wins", "Losses", "Draws"]

export default function ProTeamClient({
  team,
  active = "players",
}: {
  team: ProTeam
  active?: LeaderboardKind
}) {
  const [view, setView] = useState<ViewMode>("overview")
  const [group, setGroup] = useState<GroupFilter>("All")
  const [logFilter, setLogFilter] = useState<LogFilter>("All")
  const averages = useMemo(() => getTeamAverages(team), [team])
  const groupFilters = useMemo<GroupFilter[]>(
    () => ["All", ...Array.from(new Set(team.players.map(player => player.group)))],
    [team.players],
  )
  const filteredPlayers = useMemo(
    () => group === "All" ? team.players.filter(player => player.group !== "Staff") : team.players.filter(player => player.group === group),
    [group, team.players],
  )
  const filteredLog = useMemo(
    () => logFilter === "All"
      ? team.recentLog
      : team.recentLog.filter(match => `${match.result}s`.toLowerCase() === logFilter.toLowerCase()),
    [logFilter, team.recentLog],
  )

  return (
    <LeaderboardPageShell active={active}>
      <section
        className="bl-pro-hero"
        data-team={team.slug}
        style={{
          "--pro-accent": team.accent,
          "--pro-logo-filter": team.logoFilter ?? "none",
          "--pro-logo-bg-filter": team.logoBgFilter ?? team.logoFilter ?? "none",
        } as CSSProperties}
      >
        {team.logoUrl && (
          <img
            src={team.logoUrl}
            alt=""
            className="bl-pro-hero-logo"
            decoding="async"
            onError={event => { event.currentTarget.style.display = "none" }}
          />
        )}
        <div className="bl-pro-hero-copy">
          <div className="bl-pro-title-line">
            <h1>{team.name}</h1>
            {team.flagCode && <span className={`bl-lb-team-flag bl-lb-team-flag-${team.flagCode}`} aria-label={team.flagLabel} />}
          </div>
          <p>{team.description}</p>
        </div>
      </section>

      {team.recentLog.length > 0 && (
        <div className="bl-pro-view-tabs" aria-label={`${team.name} sections`}>
          <button
            type="button"
            className={`bl-pro-view-tab ${view === "overview" ? "bl-pro-view-tab-active" : ""}`}
            onClick={() => setView("overview")}
            aria-pressed={view === "overview"}
          >
            Overview
          </button>
          <button
            type="button"
            className={`bl-pro-view-tab ${view === "log" ? "bl-pro-view-tab-active" : ""}`}
            onClick={() => setView("log")}
            aria-pressed={view === "log"}
          >
            Recent Log
          </button>
        </div>
      )}

      <LeaderboardBoard>
        {view === "overview" || team.recentLog.length === 0 ? (
          <OverviewBoard
            team={team}
            players={filteredPlayers}
            groupFilters={groupFilters}
            group={group}
            setGroup={setGroup}
            averages={averages}
          />
        ) : (
          <RecentLogBoard
            matches={filteredLog}
            players={team.players}
            active={logFilter}
            setActive={setLogFilter}
          />
        )}
      </LeaderboardBoard>
    </LeaderboardPageShell>
  )
}

function OverviewBoard({
  team,
  players,
  groupFilters,
  group,
  setGroup,
  averages,
}: {
  team: ProTeam
  players: ProPlayer[]
  groupFilters: GroupFilter[]
  group: GroupFilter
  setGroup: (group: GroupFilter) => void
  averages: ReturnType<typeof getTeamAverages>
}) {
  return (
    <>
      <div className="bl-pro-board-top">
        <SegmentedControl items={groupFilters} active={group} onChange={setGroup} />
        <div className="bl-pro-summary-strip" aria-label={`${team.name} roster totals`}>
          <span><strong>{formatFull(averages.averageTrophies)}</strong> avg trophies</span>
          <span><strong>{formatCompact(averages.totalWins)}</strong> wins</span>
          <span><strong>{formatFull(averages.totalPrestige)}</strong> prestige</span>
        </div>
      </div>

      <LeaderboardPanel>
        <TableHead className={`${overviewGrid} bl-pro-overview-head`}>
          <span>Rank</span>
          <span>Player</span>
          <span>Group</span>
          <span>Trophies</span>
          <span>Wins</span>
          <span>WR</span>
          <span>Best brawlers</span>
          <span>Role</span>
        </TableHead>

        <div className="bl-lb-table-list">
          {players.map((player, index) => (
            <OverviewRow key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      </LeaderboardPanel>
    </>
  )
}

function OverviewRow({ player, rank }: { player: ProPlayer; rank: number }) {
  const winRate = getWinRate(player)
  const hasStats = player.trophies > 0 || player.wins > 0 || player.losses > 0

  return (
    <div className={`bl-lb-row bl-pro-overview-row ${overviewGrid}`}>
      <RankCell rank={rank} />
      <PlayerCell player={player}>
        <span>
          <strong>{player.name}</strong>
        </span>
      </PlayerCell>
      <span className={`bl-pro-group-pill bl-pro-group-${player.group.toLowerCase()}`}>{player.group}</span>
      <span className="bl-lb-row-stat">{hasStats ? formatFull(player.trophies) : "--"}</span>
      <span className="bl-lb-row-mono">{player.wins > 0 ? formatCompact(player.wins) : "--"}</span>
      <span className={`bl-pro-wr ${typeof winRate === "number" && winRate >= 58 ? "bl-pro-wr-good" : typeof winRate === "number" && winRate < 51 ? "bl-pro-wr-low" : ""}`}>{typeof winRate === "number" ? `${winRate}%` : "--"}</span>
      <BrawlerStrip brawlers={player.bestBrawlers} />
      <span className="bl-pro-status">{player.role}</span>
    </div>
  )
}

function PlayerCell({
  player,
  fallbackBrawlerId,
  children,
}: {
  player: ProPlayer
  fallbackBrawlerId?: number
  children: ReactNode
}) {
  const content = (
    <>
      <PlayerAvatar player={player} fallbackBrawlerId={fallbackBrawlerId} />
      {children}
    </>
  )

  if (!player.tag) {
    return <div className="bl-pro-player-cell">{content}</div>
  }

  return (
    <Link href={`/player/${encodeURIComponent(player.tag)}`} className="bl-pro-player-cell bl-pro-player-link">
      {content}
    </Link>
  )
}

function RecentLogBoard({
  matches,
  players,
  active,
  setActive,
}: {
  matches: ProMatch[]
  players: ProPlayer[]
  active: LogFilter
  setActive: (filter: LogFilter) => void
}) {
  const playersById = useMemo(() => new Map(players.map(player => [player.id, player])), [players])
  const totals = matches.reduce(
    (acc, match) => {
      if (match.result === "win") acc.wins += 1
      if (match.result === "loss") acc.losses += 1
      if (match.result === "draw") acc.draws += 1
      acc.score += match.score
      return acc
    },
    { wins: 0, losses: 0, draws: 0, score: 0 },
  )
  const averageScore = matches.length ? Math.round(totals.score / matches.length) : 0

  return (
    <section className="bl-pro-log-board">
      <h2>Last games</h2>
      <div className="bl-pro-log-toolbar">
        <SegmentedControl items={logFilters} active={active} onChange={setActive} />
        <div className="bl-pro-log-stats">
          <span>{totals.wins} wins</span>
          <span>{totals.losses} losses</span>
          <span>{totals.draws} draws</span>
          <strong>{averageScore} score</strong>
        </div>
      </div>

      <LeaderboardPanel>
        <TableHead className={`${logGrid} bl-pro-log-head`}>
          <span>Match</span>
          <span>Player</span>
          <span>Brawler</span>
          <span>Result</span>
          <span>Team</span>
          <span>Opponents</span>
          <span>Score</span>
          <span />
        </TableHead>
        <div className="bl-lb-table-list">
          {matches.map(match => (
            <RecentLogRow key={match.id} match={match} player={playersById.get(match.playerId)} />
          ))}
        </div>
      </LeaderboardPanel>
    </section>
  )
}

function RecentLogRow({ match, player }: { match: ProMatch; player?: ProPlayer }) {
  return (
    <div className={`bl-pro-log-row bl-pro-log-row-${match.result} ${logGrid}`}>
      <div className="bl-pro-match-meta">
        <strong>{match.time}</strong>
        <span>{match.age}</span>
        <small>{match.mode}</small>
      </div>
      {player ? (
        <PlayerCell player={player} fallbackBrawlerId={match.brawler.id}>
          <span>
            <strong>{player.name}</strong>
          </span>
        </PlayerCell>
      ) : (
        <div className="bl-pro-player-cell">
          <BrawlImage src={brawlerIconUrl(match.brawler.id)} alt="" width={34} height={34} sizes="34px" />
          <span>
            <strong>Unknown</strong>
          </span>
        </div>
      )}
      <div className="bl-pro-single-brawler">
        <BrawlImage src={brawlerIconUrl(match.brawler.id)} alt={match.brawler.name} width={34} height={34} sizes="34px" />
      </div>
      <div className="bl-pro-result-cell">
        <strong className={`bl-pro-result-${match.result}`}>{match.result}</strong>
        <span>{match.trophyDelta > 0 ? "+" : ""}{match.trophyDelta}</span>
      </div>
      <BrawlerStrip brawlers={match.teamBrawlers} />
      <div className="bl-pro-versus">
        <BrawlerStrip brawlers={match.opponentBrawlers} />
        <span>VS</span>
      </div>
      <div className="bl-pro-score">
        <strong>{match.score}</strong>
        <span>{match.rankLabel}</span>
      </div>
      <button type="button" className="bl-pro-row-expander" aria-label={`Show ${player?.name ?? "player"} match detail`}>
        <span />
      </button>
    </div>
  )
}

function SegmentedControl<T extends string>({
  items,
  active,
  onChange,
}: {
  items: readonly T[]
  active: T
  onChange: (item: T) => void
}) {
  return (
    <div className="bl-pro-segments">
      {items.map(item => (
        <button
          key={item}
          type="button"
          className={`bl-pro-segment ${active === item ? "bl-pro-segment-active" : ""}`}
          onClick={() => onChange(item)}
          aria-pressed={active === item}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function PlayerAvatar({ player, fallbackBrawlerId }: { player: ProPlayer; fallbackBrawlerId?: number }) {
  if (player.iconId) {
    return (
      <BrawlImage
        src={profileIconUrl(player.iconId)}
        alt=""
        width={34}
        height={34}
        sizes="34px"
      />
    )
  }

  if (fallbackBrawlerId) {
    return <BrawlImage src={brawlerIconUrl(fallbackBrawlerId)} alt="" width={34} height={34} sizes="34px" />
  }

  return <span className="bl-pro-staff-avatar">{initials(player.name)}</span>
}

function BrawlerStrip({ brawlers }: { brawlers: { id: number; name: string }[] }) {
  if (!brawlers.length) return <span className="bl-pro-brawler-strip bl-pro-brawler-strip-empty">--</span>

  return (
    <div className="bl-pro-brawler-strip">
      {brawlers.slice(0, 4).map(brawler => (
        <BrawlImage key={brawler.id} src={brawlerIconUrl(brawler.id)} alt={brawler.name} width={28} height={28} sizes="28px" />
      ))}
    </div>
  )
}

function formatFull(value: number) {
  return value.toLocaleString("en-US")
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`
  return formatFull(value)
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?"
}
