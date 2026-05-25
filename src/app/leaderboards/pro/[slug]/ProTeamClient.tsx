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
  leaderboardRowClass,
  leaderboardRowMonoClass,
  leaderboardRowStatClass,
  leaderboardTableListClass,
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

const proHeroClass =
  "relative my-2.5 min-h-[104px] isolate overflow-hidden rounded-[8px] border border-[rgba(245,244,241,0.07)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--pro-accent)_12%,transparent),transparent_54%),#15171d] px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_18px_40px_-34px_rgba(0,0,0,0.72)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--pro-accent)_50%,transparent),transparent)] after:opacity-65 max-[860px]:min-h-[126px] max-[860px]:p-[18px]"

const proHeroCopyClass =
  "relative z-[2] max-w-[690px] max-[860px]:max-w-full"

const proTitleLineClass =
  "flex min-w-0 items-center gap-2.5"

const proTitleClass =
  "m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[30px] font-black leading-none tracking-[0] text-[#f5f4f1] [font-family:var(--font-label)] max-[560px]:text-[22px]"

const proDescriptionClass =
  "m-0 mt-2.5 max-w-[640px] text-[13px] font-medium leading-[1.38] text-[rgba(245,244,241,0.74)] [font-family:var(--font-ui-light)] max-[560px]:text-[12px]"

const proViewTabsClass =
  "my-2.5 mt-3 flex justify-center gap-2 max-[560px]:justify-start max-[560px]:overflow-x-auto max-[560px]:pb-0.5"

const proViewTabClass =
  "inline-flex h-9 min-w-[116px] cursor-pointer items-center justify-center rounded-[7px] border border-[rgba(245,244,241,0.11)] bg-[var(--panel)] text-[13px] font-[780] leading-none text-[rgba(245,244,241,0.68)] outline-none transition-colors [font-family:var(--font-label)] hover:bg-[var(--panel)] hover:text-[#f5f4f1] focus-visible:shadow-[0_0_0_2px_rgba(216,220,255,0.34)] max-[560px]:min-w-[108px]"

const proViewTabActiveClass =
  "!border-[rgba(245,244,241,0.32)] !bg-[#d8dcff] !text-[#08090c]"

const proBoardTopClass =
  "mb-2.5 flex items-center justify-between gap-2.5 max-[860px]:flex-col max-[860px]:items-start"

const proSummaryStripClass =
  "flex min-w-0 items-center justify-end gap-1.5 text-[11px] font-bold leading-none text-[rgba(245,244,241,0.54)] [font-family:var(--font-label)] max-[860px]:flex-wrap max-[860px]:justify-start [&_span]:inline-flex [&_span]:h-6 [&_span]:items-center [&_span]:whitespace-nowrap [&_span]:rounded [&_span]:border [&_span]:border-[rgba(245,244,241,0.065)] [&_span]:bg-[var(--panel)] [&_span]:px-2 [&_strong]:mr-1 [&_strong]:text-[12px] [&_strong]:font-[850] [&_strong]:text-[#f5f4f1] [&_strong]:[font-family:var(--font-number)]"

const proSegmentsClass =
  "inline-flex h-[34px] min-w-0 overflow-hidden rounded-[5px] border border-[rgba(245,244,241,0.07)] bg-[var(--panel)] p-[3px] max-[560px]:w-full"

const proSegmentClass =
  "inline-flex min-w-[54px] cursor-pointer items-center justify-center rounded border border-transparent bg-transparent text-[11px] font-[850] leading-none text-[rgba(245,244,241,0.52)] outline-none [font-family:var(--font-label)] hover:border-[rgba(245,244,241,0.12)] hover:bg-[var(--panel)] hover:text-[#f5f4f1] focus-visible:shadow-[0_0_0_2px_rgba(245,244,241,0.22)] max-[560px]:min-w-0 max-[560px]:flex-1"

const proSegmentActiveClass =
  "!border-[rgba(245,244,241,0.12)] !bg-[var(--panel)] !text-[#f5f4f1]"

const proPlayerCellClass =
  "flex min-w-0 items-center gap-2 text-inherit no-underline transition-opacity hover:opacity-80 focus-visible:rounded-[7px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(142,213,255,0.42)] [&_img]:size-[34px] [&_img]:shrink-0 [&_img]:rounded-md [&_img]:object-cover [&_span]:block [&_span]:min-w-0 [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-[850] [&_strong]:leading-none [&_strong]:text-[#f5f4f1] [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10.5px] [&_small]:font-[760] [&_small]:leading-none [&_small]:text-[rgba(245,244,241,0.5)]"

function proHeroLogoClass(slug: string) {
  if (slug === "crazy-raccoons") {
    return "pointer-events-none absolute right-[-18px] top-1/2 z-[1] w-[min(720px,52vw)] max-h-[250px] -translate-y-1/2 object-contain opacity-[0.18] [filter:var(--pro-logo-bg-filter)] mix-blend-multiply max-[860px]:right-[18px] max-[860px]:size-[68px] max-[860px]:max-h-[68px]"
  }
  if (slug === "zeta") {
    return "pointer-events-none absolute right-[72px] top-1/2 z-[1] w-[min(170px,18vw)] max-h-[132px] -translate-y-1/2 object-contain opacity-90 [filter:none] max-[860px]:right-[18px] max-[860px]:w-[68px] max-[860px]:opacity-40"
  }
  return "pointer-events-none absolute right-[22px] top-1/2 z-[1] w-[min(340px,32vw)] max-h-[164px] -translate-y-1/2 object-contain opacity-[0.74] [filter:var(--pro-logo-bg-filter)] max-[860px]:right-[18px] max-[860px]:w-[68px] max-[860px]:opacity-40"
}

function proGroupClass(group: ProPlayerGroup) {
  const tone = group === "Main"
    ? "bg-[rgba(240,211,115,0.14)] text-[#f0d373]"
    : group === "Academy"
      ? "bg-[rgba(139,215,255,0.13)] text-[#9bdcff]"
      : group === "Creator"
        ? "bg-[rgba(216,220,255,0.13)] text-[#d8dcff]"
        : group === "Staff"
          ? "bg-[rgba(245,244,241,0.1)] text-[rgba(245,244,241,0.72)]"
          : "bg-[rgba(139,215,255,0.1)] text-[#9bdcff]"
  return `inline-flex w-fit max-w-full items-center justify-center whitespace-nowrap rounded px-[7px] py-[5px] text-[9.5px] font-[880] leading-none [font-family:var(--font-label)] ${tone}`
}

function proWinRateClass(winRate: number | null) {
  const tone = typeof winRate === "number" && winRate >= 58
    ? "text-[#bff0b8]"
    : typeof winRate === "number" && winRate < 51
      ? "text-[#ff9f6e]"
      : "text-[#f5f4f1]"
  return `${tone} whitespace-nowrap text-[14px] font-[850] leading-none [font-family:var(--font-number)]`
}

function proResultClass(result: ProMatch["result"]) {
  return result === "win" ? "text-[#9fe6b6]" : result === "loss" ? "text-[#ff8f86]" : "text-[#d8dcff]"
}

function proLogRowClass(result: ProMatch["result"]) {
  const tone = result === "win"
    ? "bg-[linear-gradient(90deg,rgba(34,57,112,0.58),#1b1d24_42%,rgba(34,57,112,0.42))]"
    : result === "loss"
      ? "bg-[linear-gradient(90deg,rgba(92,43,39,0.62),#1d1c20_42%,rgba(92,43,39,0.48))]"
      : "bg-[linear-gradient(90deg,rgba(66,67,76,0.56),#1b1d22_42%,rgba(66,67,76,0.36))]"
  return `min-h-[52px] rounded border border-[rgba(245,244,241,0.06)] px-2.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.026)] ${tone}`
}

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
        className={proHeroClass}
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
            className={proHeroLogoClass(team.slug)}
            decoding="async"
            onError={event => { event.currentTarget.style.display = "none" }}
          />
        )}
        <div className={proHeroCopyClass}>
          <div className={proTitleLineClass}>
            <h1 className={proTitleClass}>{team.name}</h1>
            {team.flagCode && <span className={`bl-lb-team-flag bl-lb-team-flag-${team.flagCode}`} aria-label={team.flagLabel} />}
          </div>
          <p className={proDescriptionClass}>{team.description}</p>
        </div>
      </section>

      {team.recentLog.length > 0 && (
        <div className={proViewTabsClass} aria-label={`${team.name} sections`}>
          <button
            type="button"
            className={`${proViewTabClass} ${view === "overview" ? proViewTabActiveClass : ""}`}
            onClick={() => setView("overview")}
            aria-pressed={view === "overview"}
          >
            Overview
          </button>
          <button
            type="button"
            className={`${proViewTabClass} ${view === "log" ? proViewTabActiveClass : ""}`}
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
      <div className={proBoardTopClass}>
        <SegmentedControl items={groupFilters} active={group} onChange={setGroup} />
        <div className={proSummaryStripClass} aria-label={`${team.name} roster totals`}>
          <span><strong>{formatFull(averages.averageTrophies)}</strong> avg trophies</span>
          <span><strong>{formatCompact(averages.totalWins)}</strong> wins</span>
          <span><strong>{formatFull(averages.totalPrestige)}</strong> prestige</span>
        </div>
      </div>

      <LeaderboardPanel>
        <TableHead className={`${overviewGrid} min-w-[880px]`}>
          <span>Rank</span>
          <span>Player</span>
          <span>Group</span>
          <span>Trophies</span>
          <span>Wins</span>
          <span>WR</span>
          <span>Best brawlers</span>
          <span>Role</span>
        </TableHead>

        <div className={leaderboardTableListClass}>
          {team.rosterUnavailable ? (
            <div className="flex flex-col gap-1 border-t border-[rgba(245,244,241,0.04)] bg-[rgba(245,244,241,0.02)] px-5 py-6 text-[12px] tracking-[0.02em] text-[var(--ink-3,#a3a7b7)] [font-family:var(--font-mono)] [&_strong]:text-[13px] [&_strong]:font-bold [&_strong]:uppercase [&_strong]:tracking-[0.04em] [&_strong]:text-[var(--ink,#0d0d11)] [&_strong]:[font-family:var(--font-body)]">
              <strong>Live roster unavailable</strong>
              <span>{team.rosterUnavailableReason ?? "Brawl Stars club proxy is unreachable right now. Try again shortly."}</span>
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col gap-1 border-t border-[rgba(245,244,241,0.04)] bg-[rgba(245,244,241,0.02)] px-5 py-6 text-[12px] tracking-[0.02em] text-[var(--ink-3,#a3a7b7)] [font-family:var(--font-mono)] [&_strong]:text-[13px] [&_strong]:font-bold [&_strong]:uppercase [&_strong]:tracking-[0.04em] [&_strong]:text-[var(--ink,#0d0d11)] [&_strong]:[font-family:var(--font-body)]">
              <strong>No members</strong>
              <span>This club has no listed members.</span>
            </div>
          ) : (
            players.map((player, index) => (
              <OverviewRow key={player.id} player={player} rank={index + 1} />
            ))
          )}
        </div>
      </LeaderboardPanel>
    </>
  )
}

function OverviewRow({ player, rank }: { player: ProPlayer; rank: number }) {
  const winRate = getWinRate(player)
  const hasStats = player.trophies > 0 || player.wins > 0 || player.losses > 0

  return (
    <div className={`${leaderboardRowClass} min-w-[880px] ${overviewGrid}`}>
      <RankCell rank={rank} />
      <PlayerCell player={player}>
        <span>
          <strong>{player.name}</strong>
        </span>
      </PlayerCell>
      <span className={proGroupClass(player.group)}>{player.group}</span>
      <span className={leaderboardRowStatClass}>{hasStats ? formatFull(player.trophies) : "--"}</span>
      <span className={leaderboardRowMonoClass}>{player.wins > 0 ? formatCompact(player.wins) : "--"}</span>
      <span className={proWinRateClass(winRate)}>{typeof winRate === "number" ? `${winRate}%` : "--"}</span>
      <BrawlerStrip brawlers={player.bestBrawlers} />
      <span className="inline-flex w-fit max-w-full items-center justify-center whitespace-nowrap rounded bg-[rgba(245,244,241,0.06)] px-[7px] py-[5px] text-[9.5px] font-[880] leading-none text-[rgba(245,244,241,0.64)] [font-family:var(--font-label)]">{player.role}</span>
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
    return <div className={proPlayerCellClass}>{content}</div>
  }

  return (
    <Link href={`/player/${encodeURIComponent(player.tag)}`} className={proPlayerCellClass}>
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
    <section>
      <h2 className="m-0 mb-3 text-center text-[22px] font-[850] leading-none tracking-[0] text-[#f5f4f1] [font-family:var(--font-heading)]">Last games</h2>
      <div className={proBoardTopClass}>
        <SegmentedControl items={logFilters} active={active} onChange={setActive} />
        <div className={`${proSummaryStripClass} [&_strong]:mr-0 [&_strong]:text-[#d8dcff]`}>
          <span>{totals.wins} wins</span>
          <span>{totals.losses} losses</span>
          <span>{totals.draws} draws</span>
          <strong>{averageScore} score</strong>
        </div>
      </div>

      <LeaderboardPanel>
        <TableHead className={`${logGrid} min-w-[980px]`}>
          <span>Match</span>
          <span>Player</span>
          <span>Brawler</span>
          <span>Result</span>
          <span>Team</span>
          <span>Opponents</span>
          <span>Score</span>
          <span />
        </TableHead>
        <div className={leaderboardTableListClass}>
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
    <div className={`${proLogRowClass(match.result)} min-w-[980px] ${logGrid}`}>
      <div className="grid min-w-0 gap-0.5 text-[rgba(245,244,241,0.56)] [font-family:var(--font-label)] [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[10px] [&_small]:font-[760] [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-[10px] [&_span]:font-[760] [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[11px] [&_strong]:font-[850] [&_strong]:text-[rgba(245,244,241,0.82)]">
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
        <div className={proPlayerCellClass}>
          <BrawlImage src={brawlerIconUrl(match.brawler.id)} alt="" width={34} height={34} sizes="34px" />
          <span>
            <strong>Unknown</strong>
          </span>
        </div>
      )}
      <div className="flex items-center [&_img]:size-7 [&_img]:shrink-0 [&_img]:rounded-[5px] [&_img]:object-cover">
        <BrawlImage src={brawlerIconUrl(match.brawler.id)} alt={match.brawler.name} width={34} height={34} sizes="34px" />
      </div>
      <div className="grid gap-[3px] leading-none [font-family:var(--font-number)]">
        <strong className={`${proResultClass(match.result)} text-[12px] font-[880] capitalize`}>{match.result}</strong>
        <span className="text-[11px] font-[850] text-[rgba(245,244,241,0.62)]">{match.trophyDelta > 0 ? "+" : ""}{match.trophyDelta}</span>
      </div>
      <BrawlerStrip brawlers={match.teamBrawlers} />
      <div className="flex min-w-0 items-center gap-[7px]">
        <BrawlerStrip brawlers={match.opponentBrawlers} />
        <span className="inline-flex h-[22px] shrink-0 items-center justify-center rounded bg-[rgba(0,0,0,0.32)] px-1.5 text-[10px] font-black leading-none text-[rgba(245,244,241,0.76)]">VS</span>
      </div>
      <div className="grid w-fit min-w-[54px] justify-items-center rounded-full bg-[rgba(0,0,0,0.22)] px-2 py-1.5 leading-none text-[#d8dcff] [font-family:var(--font-number)]">
        <strong className="text-[18px] font-black">{match.score}</strong>
        <span className="mt-0.5 text-[9px] font-[850] text-[rgba(245,244,241,0.72)]">{match.rankLabel}</span>
      </div>
      <button type="button" className="grid size-[26px] cursor-pointer place-items-center rounded border-0 bg-transparent [&_span]:size-2 [&_span]:translate-y-[-2px] [&_span]:rotate-45 [&_span]:border-b-2 [&_span]:border-r-2 [&_span]:border-[rgba(245,244,241,0.4)] hover:[&_span]:border-[rgba(245,244,241,0.82)]" aria-label={`Show ${player?.name ?? "player"} match detail`}>
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
    <div className={proSegmentsClass}>
      {items.map(item => (
        <button
          key={item}
          type="button"
          className={`${proSegmentClass} ${active === item ? proSegmentActiveClass : ""}`}
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

  return <span className="grid size-[34px] shrink-0 place-items-center rounded-md bg-[rgba(245,244,241,0.08)] text-[10px] font-black leading-none text-[rgba(245,244,241,0.78)] [font-family:var(--font-label)]">{initials(player.name)}</span>
}

function BrawlerStrip({ brawlers }: { brawlers: { id: number; name: string }[] }) {
  if (!brawlers.length) return <span className="text-[13px] font-[780] text-[rgba(245,244,241,0.42)] [font-family:var(--font-number)]">--</span>

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden [&_img]:size-7 [&_img]:shrink-0 [&_img]:rounded-[5px] [&_img]:object-cover">
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
