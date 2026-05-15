"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { formatBrawlerName, formatTrophies } from "@/lib/format"
import {
  clubBadgeUrl,
  firstGlyph,
  formatLeaderboardRank,
  formatPlainNumber,
  leaderboardTagKey,
  playerProfileHref,
  profileIconUrl,
} from "@/lib/leaderboardUtils"
import {
  EmptyLeaderboardState,
  FeatureCardRail,
  LeaderboardBoard,
  LeaderboardHero,
  LeaderboardPageShell,
  LeaderboardPanel,
  LeaderboardToolbar,
  Pager,
  RankCell,
  RegionPills,
  SearchBox,
  TableHead,
  TableHeadHelp,
  professionalTeamCards,
  regionCode,
} from "./LeaderboardDpmShell"

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  updated_at: string
}

interface RegionData {
  code: string
  label: string
  players: Player[]
}

interface TopPlayerEnrichment {
  iconId: number | null
  totalTrophies?: number | null
  highestTrophies?: number | null
  totalPrestigeLevel?: number | null
  recentGames?: number | null
  recentWinRate?: number | null
  threeVsThreeWins?: number | null
  soloWins?: number | null
  duoWins?: number | null
  clubTag?: string | null
  clubBadgeId?: number | null
  topBrawlers: BrawlerSummary[]
  peakBrawler?: BrawlerSummary | null
  selectedBrawlerId?: number | null
  selectedBrawler?: BrawlerSummary | null
}

const PAGE_SIZE = 50
const playerTableGrid = "grid grid-cols-[34px_minmax(156px,1fr)_78px_minmax(150px,1fr)_66px_140px_86px_54px_42px] items-center gap-1"

interface BrawlerSummary {
  id: number
  name: string
  trophies: number
  highestTrophies: number | null
  rank: number | null
  power: number | null
  prestigeLevel: number | null
}

export default function LeaderboardsClient({
  allData,
  topPlayerEnrichment = {},
}: {
  allData: RegionData[]
  updatedAt?: string | null
  topPlayerEnrichment?: Record<string, Record<string, TopPlayerEnrichment>>
}) {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") ?? ""
  const [activeRegion, setActiveRegion] = useState<string>("global")
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(0)
  const [apiEnrichments, setApiEnrichments] = useState<Record<string, TopPlayerEnrichment>>({})

  useEffect(() => { setPage(0) }, [search, activeRegion])

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "")
  }, [searchParams])

  const regionData = useMemo(() => allData.find(r => r.code === activeRegion) ?? allData[0], [allData, activeRegion])
  const globalRankByTag = useMemo(() => {
    const globalPlayers = allData.find(r => r.code === "global")?.players ?? []
    return new Map(globalPlayers.map(player => [leaderboardTagKey(player.player_tag), player.rank]))
  }, [allData])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const players = regionData?.players ?? []
    if (!q) return players
    return players.filter(p =>
      p.player_name.toLowerCase().includes(q) ||
      p.player_tag.toLowerCase().includes(q) ||
      (p.club_name ?? "").toLowerCase().includes(q)
    )
  }, [regionData, search])

  const tablePlayers = filtered.slice(3)
  const tablePages = Math.max(1, Math.ceil(tablePlayers.length / PAGE_SIZE))
  const paginated = tablePlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const visiblePlayers = useMemo(() => [...filtered.slice(0, 3), ...paginated], [filtered, paginated])
  const visibleTags = useMemo(() => visiblePlayers.map(player => leaderboardTagKey(player.player_tag)), [visiblePlayers])
  const visibleTagKey = visibleTags.join(",")
  const serverEnrichments = useMemo(
    () => topPlayerEnrichment[activeRegion] ?? {},
    [topPlayerEnrichment, activeRegion]
  )
  const enrichments = useMemo(() => {
    const merged = { ...apiEnrichments }
    for (const [rawKey, serverData] of Object.entries(serverEnrichments)) {
      const key = leaderboardTagKey(rawKey)
      const apiData = apiEnrichments[key]
      merged[key] = {
        ...serverData,
        ...apiData,
        recentGames: apiData?.recentGames ?? serverData.recentGames ?? null,
        recentWinRate: apiData?.recentWinRate ?? serverData.recentWinRate ?? null,
      }
    }
    return merged
  }, [serverEnrichments, apiEnrichments])

  useEffect(() => {
    const tags = visibleTags.filter(tag => !apiEnrichments[tag])
    if (!tags.length) return

    const controller = new AbortController()
    async function loadEnrichments() {
      try {
        const response = await fetch("/api/leaderboards/player-enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags }),
          signal: controller.signal,
        })
        if (!response.ok) return

        const data = await response.json() as { players?: Record<string, TopPlayerEnrichment> }
        if (data.players) {
          setApiEnrichments(prev => ({ ...prev, ...data.players }))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Leaderboard enrichment request failed:", error)
        }
      }
    }

    void loadEnrichments()
    return () => controller.abort()
  }, [visibleTagKey, visibleTags, apiEnrichments])

  return (
    <LeaderboardPageShell active="players">
      <FeatureCardRail cards={professionalTeamCards} />

      <LeaderboardHero
        title="Players Leaderboard"
        description={`Track the highest-ranked accounts across ${regionData?.label ?? "Global"} with recent battle context, profile icons, and the brawlers carrying each top player's push. Rankings stay ordered by BrawlLens snapshots while the featured cards pull fresh profile and battle-log details from the Brawl Stars API.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search player, tag, or club" />
          <div className="bl-lb-toolbar-actions">
            <RegionPills regions={allData} activeRegion={activeRegion} onChange={setActiveRegion} />
          </div>
        </LeaderboardToolbar>

        {filtered.length === 0 ? (
          <EmptyLeaderboardState
            title={search ? "No players match" : "No leaderboard data"}
            description={search ? "Your search filtered out every player in this region." : `No player rankings are available for ${regionData?.label ?? activeRegion} right now.`}
            action={search ? <DpmButton onClick={() => setSearch("")}>Clear search</DpmButton> : <DpmButton onClick={() => setActiveRegion("global")}>Switch to global</DpmButton>}
          />
        ) : (
          <>
            <section aria-label="Top players" className="bl-lb-podium-grid">
              {filtered.slice(0, 3).map(player => (
                <PlayerPodiumCard
                  key={player.player_tag}
                  player={player}
                  region={activeRegion}
                  enrichment={enrichments[leaderboardTagKey(player.player_tag)]}
                />
              ))}
            </section>

            <LeaderboardPanel>
              <TableHead className={`${playerTableGrid} bl-lb-player-table-head`}>
                <span>Rank</span>
                <span>Player</span>
                <TableHeadHelp label="Trophies" help="Current trophy count from the leaderboard snapshot for the selected region." />
                <span>Club</span>
                <TableHeadHelp label="Wins" help="Total public win categories from the enriched player profile when available." />
                <TableHeadHelp label="Best brawlers" help="The player's highest trophy brawlers from their public profile." />
                <TableHeadHelp label="Peak" help="The highest trophy brawler found in the player's profile snapshot." />
                <TableHeadHelp label="Prestige" help="Total prestige level from the public profile when the API returns it." />
                <TableHeadHelp label="World" help="The player's global trophy rank when BrawlLens can match the selected row to the global leaderboard." />
              </TableHead>

              <div className="bl-lb-table-list">
                {paginated.map(player => (
                  <PlayerRankRow
                    key={`${activeRegion}-${player.player_tag}`}
                    player={player}
                    worldRank={globalRankByTag.get(leaderboardTagKey(player.player_tag)) ?? (activeRegion === "global" ? player.rank : null)}
                    enrichment={enrichments[leaderboardTagKey(player.player_tag)]}
                  />
                ))}
              </div>
            </LeaderboardPanel>

            <Pager page={page} totalPages={tablePages} onChange={setPage} />
          </>
        )}
      </LeaderboardBoard>
    </LeaderboardPageShell>
  )
}

function PlayerRankRow({
  player,
  worldRank,
  enrichment,
}: {
  player: Player
  worldRank: number | null
  enrichment?: TopPlayerEnrichment
}) {
  const playerHref = playerProfileHref(player.player_tag)

  return (
    <div className={`bl-lb-row bl-lb-player-row ${playerTableGrid}`}>
      <div className="bl-lb-rank-stack">
        <RankCell rank={player.rank} />
        <span>{formatWorldRank(worldRank)}</span>
      </div>
      <Link href={playerHref} className="bl-lb-identity bl-lb-player-link">
        <PlayerAvatar name={player.player_name} rank={player.rank} iconId={enrichment?.iconId ?? null} />
        <div className="bl-lb-row-main">
          <div className="bl-lb-name">{player.player_name}</div>
          <div className="bl-lb-subline">{player.player_tag}</div>
        </div>
      </Link>
      <span className="bl-lb-row-stat">
        {formatTrophies(player.trophies)}
      </span>
      <ClubCell name={player.club_name} badgeId={enrichment?.clubBadgeId ?? null} />
      <span className="bl-lb-row-mono">{formatStat(getTotalWins(enrichment))}</span>
      <TopBrawlerIcons brawlers={enrichment?.topBrawlers ?? []} compact />
      <BrawlerMetric brawler={enrichment?.peakBrawler ?? enrichment?.topBrawlers?.[0] ?? null} valueKey="highestTrophies" compact />
      <span className="bl-lb-row-mono">{formatPlainStat(enrichment?.totalPrestigeLevel)}</span>
      <span className="bl-lb-row-mono">{formatWorldRank(worldRank)}</span>
    </div>
  )
}

function PlayerPodiumCard({
  player,
  region,
  enrichment,
}: {
  player: Player
  region: string
  enrichment?: TopPlayerEnrichment
}) {
  const totalWins = getTotalWins(enrichment)
  const playerHref = playerProfileHref(player.player_tag)

  return (
    <div className="bl-lb-podium-card">
      <div className="bl-lb-podium-top">
        <span className="bl-lb-podium-rank">{player.rank}</span>
        <Link href={playerHref} className="bl-lb-identity bl-lb-podium-identity bl-lb-player-link">
          <PlayerAvatar name={player.player_name} rank={player.rank} iconId={enrichment?.iconId ?? null} />
          <div className="bl-lb-row-main">
            <div className="bl-lb-name">{player.player_name}</div>
            <div className="bl-lb-subline">{player.club_name ?? "No club"}</div>
          </div>
        </Link>
        <div className="bl-lb-podium-rate">
          <strong>{enrichment?.recentWinRate === null || enrichment?.recentWinRate === undefined ? "--" : `${enrichment.recentWinRate}%`}</strong>
          <span>recent wr</span>
        </div>
      </div>
      <div className="bl-lb-podium-score">{formatTrophies(player.trophies)}</div>
      <div className="bl-lb-podium-foot">
        <div className="bl-lb-mini-stat">
          <strong>{formatStat(totalWins)}</strong>
          <span>wins</span>
        </div>
        <TopBrawlerIcons brawlers={enrichment?.topBrawlers ?? []} />
        <div className="bl-lb-mini-stat bl-lb-mini-stat-right">
          <strong>{regionCode(region)}</strong>
          <span>region</span>
        </div>
      </div>
    </div>
  )
}

function PlayerAvatar({ name, rank, iconId }: { name: string; rank: number; iconId?: number | null }) {
  const color = rank === 1 ? "#f2cf63" : rank === 2 ? "#d6dbe4" : rank === 3 ? "#c88b5a" : "#7d86ff"
  return (
    <span className="bl-lb-avatar" style={{ color }}>
      {iconId ? (
        <BrawlImage src={profileIconUrl(iconId)} alt="" width={44} height={44} sizes="44px" />
      ) : firstGlyph(name)}
    </span>
  )
}

function ClubCell({ name, badgeId }: { name: string | null; badgeId?: number | null }) {
  return (
    <span className="bl-lb-club-cell">
      {badgeId && (
        <BrawlImage src={clubBadgeUrl(badgeId)} alt="" width={24} height={24} sizes="24px" />
      )}
      <span>{name ?? "No club"}</span>
    </span>
  )
}

function TopBrawlerIcons({
  brawlers,
  compact = false,
}: {
  brawlers: { id: number; name: string }[]
  compact?: boolean
}) {
  return (
    <div className={`bl-lb-brawler-icons ${compact ? "bl-lb-brawler-icons-row" : ""}`} aria-label="Highest brawlers">
      {brawlers.length ? brawlers.map(brawler => (
        <BrawlImage
          key={brawler.id}
          src={brawlerIconUrl(brawler.id)}
          alt={brawler.name}
          width={30}
          height={30}
          sizes="30px"
        />
      )) : (
        <span className="bl-lb-brawler-icons-empty">--</span>
      )}
    </div>
  )
}

function BrawlerMetric({
  brawler,
  valueKey,
  compact = false,
}: {
  brawler: BrawlerSummary | null
  valueKey: "trophies" | "highestTrophies"
  compact?: boolean
}) {
  if (!brawler) return <span className="bl-lb-brawler-metric bl-lb-brawler-metric-empty">--</span>
  const value = valueKey === "trophies" ? brawler.trophies : brawler.highestTrophies ?? brawler.trophies

  return (
    <span className={`bl-lb-brawler-metric ${compact ? "bl-lb-brawler-metric-compact" : ""}`}>
      <BrawlImage src={brawlerIconUrl(brawler.id)} alt={brawler.name} width={24} height={24} sizes="24px" />
      <span>
        {!compact && <strong>{formatBrawlerLabel(brawler.name)}</strong>}
        <small>{formatFullNumber(value)}</small>
      </span>
    </span>
  )
}

function formatStat(value: number | null | undefined) {
  return typeof value === "number" ? formatTrophies(value) : "--"
}

function formatPlainStat(value: number | null | undefined) {
  return formatPlainNumber(value)
}

function formatFullNumber(value: number | null | undefined) {
  return formatPlainNumber(value)
}

function formatBrawlerLabel(name: string) {
  return formatBrawlerName(name)
}

function formatWorldRank(value: number | null | undefined) {
  return formatLeaderboardRank(value)
}

function getTotalWins(enrichment: TopPlayerEnrichment | undefined) {
  const threeVsThreeWins = enrichment?.threeVsThreeWins
  const soloWins = enrichment?.soloWins
  const duoWins = enrichment?.duoWins
  if (typeof threeVsThreeWins !== "number" && typeof soloWins !== "number" && typeof duoWins !== "number") return null
  return (threeVsThreeWins ?? 0) + (soloWins ?? 0) + (duoWins ?? 0)
}

function DpmButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bl-lb-action"
    >
      {children}
    </button>
  )
}
