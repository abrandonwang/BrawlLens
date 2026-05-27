"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { formatTrophies } from "@/lib/format"
import {
  clubBadgeUrl,
  firstGlyph,
  leaderboardTagKey,
  playerProfileHref,
  profileIconUrl,
} from "@/lib/leaderboardUtils"
import {
  CellSkeleton,
  EmptyLeaderboardState,
  LeaderboardBoard,
  LeaderboardHero,
  LeaderboardPageShell,
  LeaderboardPanel,
  LeaderboardToolbar,
  Pager,
  RankCell,
  RegionDropdown,
  SearchBox,
  leaderboardUnifiedGrid,
  TableHead,
  TableHeadHelp,
  leaderboardAvatarClass,
  leaderboardActionClass,
  leaderboardBrawlerIconsClass,
  leaderboardBrawlerIconsEmptyClass,
  leaderboardBrawlerIconsRowClass,
  leaderboardClubCellClass,
  leaderboardMiniStatClass,
  leaderboardMiniStatRightClass,
  leaderboardNameClass,
  leaderboardPodiumCardClass,
  leaderboardPodiumFootClass,
  leaderboardPodiumGridClass,
  leaderboardPodiumIdentityClass,
  leaderboardPodiumRankClass,
  leaderboardPodiumRateClass,
  leaderboardPodiumScoreClass,
  leaderboardPodiumTopClass,
  leaderboardRowAvatarClass,
  leaderboardRowClass,
  leaderboardRowMainClass,
  leaderboardRowNameClass,
  leaderboardRowPlayerLinkClass,
  leaderboardRowStatClass,
  leaderboardRowSublineClass,
  leaderboardSublineClass,
  leaderboardTableListClass,
  leaderboardToolbarActionsClass,
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
      <LeaderboardHero
        title="Players Leaderboard"
        description={`The highest trophy Brawl Stars players in ${regionData?.label ?? "Global"} right now.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search player, tag, or club" />
          <div className={leaderboardToolbarActionsClass}>
            <RegionDropdown regions={allData} activeRegion={activeRegion} onChange={setActiveRegion} />
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
            <section aria-label="Top players" className={leaderboardPodiumGridClass}>
              {filtered.slice(0, 3).map(player => (
                <PlayerPodiumCard
                  key={player.player_tag}
                  player={player}
                  enrichment={enrichments[leaderboardTagKey(player.player_tag)]}
                />
              ))}
            </section>

            <LeaderboardPanel>
              <TableHead className={`${leaderboardUnifiedGrid} [&>span:first-child]:text-center`}>
                <span>Rank</span>
                <span>Player</span>
                <TableHeadHelp label="Trophies" help="Current trophy count from the leaderboard snapshot for the selected region." />
                <span>Club</span>
                <TableHeadHelp label="Best brawlers" help="The player's highest trophy brawlers from their public profile." />
              </TableHead>

              <div className={leaderboardTableListClass}>
                {paginated.map(player => (
                  <PlayerRankRow
                    key={`${activeRegion}-${player.player_tag}`}
                    player={player}
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
  enrichment,
}: {
  player: Player
  enrichment?: TopPlayerEnrichment
}) {
  const playerHref = playerProfileHref(player.player_tag)

  const enrichmentReady = enrichment !== undefined
  return (
    <div className={`${leaderboardRowClass} ${leaderboardUnifiedGrid}`}>
      <div className="grid place-items-center">
        <RankCell rank={player.rank} />
      </div>
      <Link href={playerHref} className={leaderboardRowPlayerLinkClass}>
        <PlayerAvatar name={player.player_name} rank={player.rank} iconId={enrichment?.iconId ?? null} compact />
        <div className={leaderboardRowMainClass}>
          <div className={leaderboardRowNameClass}>{player.player_name}</div>
          <div className={leaderboardRowSublineClass}>{player.player_tag}</div>
        </div>
      </Link>
      <span className={leaderboardRowStatClass}>
        {formatTrophies(player.trophies)}
      </span>
      <ClubCell name={player.club_name} badgeId={enrichment?.clubBadgeId ?? null} ready={enrichmentReady} />
      <TopBrawlerIcons brawlers={enrichment?.topBrawlers ?? []} ready={enrichmentReady} compact />
    </div>
  )
}

function PlayerPodiumCard({
  player,
  enrichment,
}: {
  player: Player
  enrichment?: TopPlayerEnrichment
}) {
  const totalWins = getTotalWins(enrichment)
  const playerHref = playerProfileHref(player.player_tag)

  return (
    <div className={leaderboardPodiumCardClass}>
      <div className={leaderboardPodiumTopClass}>
        <span className={leaderboardPodiumRankClass(player.rank)}>{player.rank}</span>
        <Link href={playerHref} className={leaderboardPodiumIdentityClass}>
          <PlayerAvatar name={player.player_name} rank={player.rank} iconId={enrichment?.iconId ?? null} />
          <div className={leaderboardRowMainClass}>
            <div className={leaderboardNameClass}>{player.player_name}</div>
            <div className={leaderboardSublineClass}>{player.club_name ?? "No club"}</div>
          </div>
        </Link>
        <div className={leaderboardPodiumRateClass}>
          <strong>{enrichment?.recentWinRate == null ? "-" : `${enrichment.recentWinRate}%`}</strong>
          <span>recent wr</span>
        </div>
      </div>
      <div className={leaderboardPodiumScoreClass}>{formatTrophies(player.trophies)}</div>
      <div className={leaderboardPodiumFootClass}>
        <div className={leaderboardMiniStatClass}>
          <strong>{formatStat(totalWins)}</strong>
          <span>wins</span>
        </div>
        <TopBrawlerIcons brawlers={enrichment?.topBrawlers ?? []} ready={enrichment !== undefined} />
        <div className={leaderboardMiniStatRightClass}>
          <strong>{enrichment?.totalPrestigeLevel ?? "-"}</strong>
          <span>prestige</span>
        </div>
      </div>
    </div>
  )
}

function PlayerAvatar({ name, rank, iconId, compact = false }: { name: string; rank: number; iconId?: number | null; compact?: boolean }) {
  const color = rank === 1 ? "#f2cf63" : rank === 2 ? "#d6dbe4" : rank === 3 ? "#c88b5a" : "#7d86ff"
  return (
    <span className={compact ? leaderboardRowAvatarClass : leaderboardAvatarClass} style={{ color }}>
      {iconId ? (
        <BrawlImage src={profileIconUrl(iconId)} alt="" width={44} height={44} sizes="44px" />
      ) : firstGlyph(name)}
    </span>
  )
}

function ClubCell({
  name,
  badgeId,
  ready = true,
}: {
  name: string | null
  badgeId?: number | null
  ready?: boolean
}) {
  // Player's club_name comes from the leaderboard payload (always populated as
  // either a string or null), so it's safe to render even before enrichments
  // resolve. The badge comes from enrichment, fall back to a neutral square
  // while it loads.
  return (
    <span className={leaderboardClubCellClass}>
      {badgeId ? (
        <BrawlImage src={clubBadgeUrl(badgeId)} alt="" width={24} height={24} sizes="24px" />
      ) : ready ? (
        <span className="inline-block size-[22px] shrink-0 rounded-[5px] border border-[rgba(245,244,241,0.07)] bg-[rgba(245,244,241,0.04)]" aria-hidden="true" />
      ) : (
        <CellSkeleton width={22} height={22} />
      )}
      <span>{name ?? "No club"}</span>
    </span>
  )
}

function TopBrawlerIcons({
  brawlers,
  ready = true,
  compact = false,
}: {
  brawlers: { id: number; name: string }[]
  ready?: boolean
  compact?: boolean
}) {
  if (!ready) {
    return (
      <div className={`${leaderboardBrawlerIconsClass} ${compact ? leaderboardBrawlerIconsRowClass : ""}`} aria-label="Loading top brawlers">
        {[0, 1, 2].map(i => (
          <CellSkeleton key={i} width={compact ? 22 : 28} height={compact ? 22 : 28} />
        ))}
      </div>
    )
  }
  if (!brawlers.length) {
    return (
      <div className={`${leaderboardBrawlerIconsClass} ${compact ? leaderboardBrawlerIconsRowClass : ""}`} aria-label="No top brawlers">
        <span className={leaderboardBrawlerIconsEmptyClass}>-</span>
      </div>
    )
  }
  return (
    <div className={`${leaderboardBrawlerIconsClass} ${compact ? leaderboardBrawlerIconsRowClass : ""}`} aria-label="Highest brawlers">
      {brawlers.slice(0, 3).map(brawler => (
        <BrawlImage
          key={brawler.id}
          src={brawlerIconUrl(brawler.id)}
          alt={brawler.name}
          width={30}
          height={30}
          sizes="30px"
        />
      ))}
    </div>
  )
}

function formatStat(value: number | null | undefined) {
  return typeof value === "number" ? formatTrophies(value) : "--"
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
      className={leaderboardActionClass}
    >
      {children}
    </button>
  )
}
