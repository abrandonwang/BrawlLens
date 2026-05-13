"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react"
import { ChevronDown, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { formatBrawlerName } from "@/lib/format"
import {
  clubBadgeUrl,
  firstGlyph,
  formatPlainNumber,
  leaderboardTagKey,
  playerProfileHref,
  profileIconUrl,
} from "@/lib/leaderboardUtils"
import { useClickOutside } from "@/lib/useClickOutside"
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
  SearchBox,
  TableHead,
  TableHeadHelp,
  professionalTeamCards,
} from "../LeaderboardDpmShell"

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { name: string; color: string }
}

interface Player {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  brawler_name: string
  world_rank: number | null
  total_trophies: number | null
}

interface PlayerEnrichment {
  iconId: number | null
  totalTrophies?: number | null
  clubBadgeId?: number | null
  selectedBrawlerId?: number | null
  selectedBrawler?: BrawlerSummary | null
  totalPrestigeLevel?: number | null
  globalRankEstimate?: number | null
  globalPercentile?: string | null
}

const PAGE_SIZE = 50
const brawlerTableGrid = "grid grid-cols-[34px_minmax(136px,160px)_72px_72px_46px_54px_72px_minmax(112px,1fr)_66px] items-center gap-1"

interface BrawlerSummary {
  id: number
  name: string
  trophies: number
  highestTrophies: number | null
  rank: number | null
  power: number | null
  prestigeLevel: number | null
}

export default function BrawlerLeaderboardClient({
  brawlers,
  data,
  activeBrawler,
}: {
  brawlers: Brawler[]
  data: Player[]
  activeBrawler: Brawler | null
}) {
  const router = useRouter()
  const [brawlerSearch, setBrawlerSearch] = useState("")
  const [playerSearch, setPlayerSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [apiEnrichments, setApiEnrichments] = useState<Record<string, PlayerEnrichment>>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickOutside([triggerRef, dropdownRef], () => setOpen(false), open)
  useEffect(() => { setPage(0) }, [activeBrawler?.id, playerSearch])

  const filteredBrawlers = useMemo(() => {
    const q = brawlerSearch.trim().toLowerCase()
    if (!q) return brawlers
    return brawlers.filter(b => b.name.toLowerCase().includes(q))
  }, [brawlers, brawlerSearch])

  const filteredPlayers = useMemo(() => {
    const q = playerSearch.trim().toLowerCase()
    if (!q) return data
    return data.filter(player =>
      player.player_name.toLowerCase().includes(q) ||
      player.player_tag.toLowerCase().includes(q) ||
      (player.club_name ?? "").toLowerCase().includes(q)
    )
  }, [data, playerSearch])

  const tablePlayers = filteredPlayers.slice(3)
  const totalPages = Math.max(1, Math.ceil(tablePlayers.length / PAGE_SIZE))
  const paginated = tablePlayers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const visiblePlayers = useMemo(() => [...filteredPlayers.slice(0, 3), ...paginated], [filteredPlayers, paginated])
  const visibleTags = useMemo(() => visiblePlayers.map(player => leaderboardTagKey(player.player_tag)), [visiblePlayers])
  const visibleTagKey = visibleTags.join(",")
  const selectedName = activeBrawler ? formatBrawlerName(activeBrawler.name) : "Brawler"
  const rankedTotal = data.length

  useEffect(() => {
    const activeBrawlerId = activeBrawler?.id ?? null
    const tags = visibleTags.filter(tag => {
      const enrichment = apiEnrichments[tag]
      if (!enrichment) return true
      return activeBrawlerId !== null && enrichment.selectedBrawlerId !== activeBrawlerId
    })
    if (!tags.length) return

    const controller = new AbortController()
    async function loadEnrichments() {
      try {
        const response = await fetch("/api/leaderboards/player-enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags, brawlerId: activeBrawlerId }),
          signal: controller.signal,
        })
        if (!response.ok) return

        const data = await response.json() as { players?: Record<string, PlayerEnrichment> }
        if (data.players) {
          setApiEnrichments(prev => ({ ...prev, ...data.players }))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Brawler leaderboard enrichment request failed:", error)
        }
      }
    }

    void loadEnrichments()
    return () => controller.abort()
  }, [activeBrawler?.id, visibleTagKey, visibleTags, apiEnrichments])

  function select(brawler: Brawler) {
    setOpen(false)
    setBrawlerSearch("")
    setPage(0)
    router.push(`/leaderboards/brawlers?b=${brawler.id}`)
  }

  return (
    <LeaderboardPageShell active="brawlers">
      <FeatureCardRail cards={professionalTeamCards} />

      <LeaderboardHero
        title={`${selectedName} Leaderboard`}
        description={`Open a brawler-specific ladder for ${selectedName} and scan the leading accounts without leaving the compact leaderboard flow. The primary rank is for this brawler, while the smaller rank tracks each player's overall trophy position.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={playerSearch} onChange={setPlayerSearch} placeholder="Search player, tag, or club" name="brawler-leaderboard-player-search" />
          <div className="bl-lb-toolbar-actions">
            <BrawlerSelector
              activeBrawler={activeBrawler}
              brawlers={filteredBrawlers}
              search={brawlerSearch}
              setSearch={setBrawlerSearch}
              open={open}
              setOpen={setOpen}
              select={select}
              triggerRef={triggerRef}
              dropdownRef={dropdownRef}
            />
          </div>
        </LeaderboardToolbar>

        {!activeBrawler ? (
          <EmptyLeaderboardState
            title="Pick a brawler"
            description="Choose a brawler to see the top tracked players for it."
          />
        ) : filteredPlayers.length === 0 ? (
          <EmptyLeaderboardState
            title={playerSearch ? "No players match" : "No leaderboard data"}
            description={playerSearch ? "Your search filtered out every player for this brawler." : `No top players are tracked for ${selectedName} right now.`}
            action={playerSearch ? <button type="button" onClick={() => setPlayerSearch("")} className="bl-lb-action">Clear search</button> : <DpmLink href="/leaderboards/players">Open player leaderboard</DpmLink>}
          />
        ) : (
          <>
            <section aria-label="Top brawler players" className="bl-lb-podium-grid">
              {filteredPlayers.slice(0, 3).map(player => (
                <BrawlerPodiumCard
                  key={player.player_tag}
                  player={player}
                  enrichment={apiEnrichments[leaderboardTagKey(player.player_tag)]}
                  rankedTotal={rankedTotal}
                />
              ))}
            </section>

            <LeaderboardPanel>
              <TableHead className={`${brawlerTableGrid} bl-lb-brawler-table-head`}>
                <span>Rank</span>
                <span>Player</span>
                <TableHeadHelp label="Brawler" help="Current selected-brawler trophies for this player." />
                <TableHeadHelp label="Peak" help="Highest trophy value found for the selected brawler." />
                <TableHeadHelp label="Power" help="Selected brawler power level from profile enrichment when available." />
                <TableHeadHelp label="Prestige" help="Selected brawler prestige level when the public profile returns it." />
                <TableHeadHelp label="Total" help="The player's total account trophies from leaderboard or profile enrichment." />
                <span>Club</span>
                <TableHeadHelp label="World" help="The player's global trophy rank or estimated global rank context." />
              </TableHead>

              <div className="bl-lb-table-list">
                {paginated.map(player => (
                  <BrawlerRankRow
                    key={`${activeBrawler.id}-${player.player_tag}`}
                    player={player}
                    enrichment={apiEnrichments[leaderboardTagKey(player.player_tag)]}
                    rankedTotal={rankedTotal}
                  />
                ))}
              </div>
            </LeaderboardPanel>

            <Pager page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </LeaderboardBoard>
    </LeaderboardPageShell>
  )
}

function BrawlerSelector({
  activeBrawler,
  brawlers,
  search,
  setSearch,
  open,
  setOpen,
  select,
  triggerRef,
  dropdownRef,
}: {
  activeBrawler: Brawler | null
  brawlers: Brawler[]
  search: string
  setSearch: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  select: (brawler: Brawler) => void
  triggerRef: RefObject<HTMLButtonElement | null>
  dropdownRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="bl-lb-selector">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="bl-lb-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {activeBrawler ? (
          <>
            <BrawlImage src={brawlerIconUrl(activeBrawler.id)} alt={activeBrawler.name} width={28} height={28} className="bl-lb-selector-icon" sizes="28px" />
            <span>{formatBrawlerName(activeBrawler.name)}</span>
          </>
        ) : (
          <>
            <Search size={15} strokeWidth={2.2} />
            <span>Brawler</span>
          </>
        )}
        <ChevronDown size={14} strokeWidth={2.4} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={dropdownRef} className="bl-lb-dropdown" role="listbox">
          <div className="bl-lb-dropdown-search">
            <Search size={15} strokeWidth={2} />
            <input
              name="brawler-selector-search"
              autoFocus
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search brawler..."
            />
          </div>
          <div className="bl-lb-dropdown-scroll">
            {brawlers.length === 0 ? (
              <div className="bl-lb-dropdown-empty">No brawler matches.</div>
            ) : (
              brawlers.map(brawler => (
                <button
                  key={brawler.id}
                  type="button"
                  onClick={() => select(brawler)}
                  className={`bl-lb-dropdown-item ${activeBrawler?.id === brawler.id ? "bl-lb-dropdown-item-active" : ""}`}
                >
                  <BrawlImage src={brawlerIconUrl(brawler.id)} alt={brawler.name} width={30} height={30} className="bl-lb-selector-icon" sizes="30px" />
                  <span>{formatBrawlerName(brawler.name)}</span>
                  <strong style={{ color: brawler.rarity.color }}>{brawler.rarity.name}</strong>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BrawlerRankRow({
  player,
  enrichment,
  rankedTotal,
}: {
  player: Player
  enrichment?: PlayerEnrichment
  rankedTotal: number
}) {
  const playerHref = playerProfileHref(player.player_tag)
  const totalTrophies = getTotalTrophies(player, enrichment)
  const selectedBrawler = enrichment?.selectedBrawler
  const worldPlacement = formatWorldPlacement(player.world_rank, enrichment, player.rank, rankedTotal)
  const worldPlacementShort = formatWorldPlacementShort(player.world_rank, enrichment, player.rank, rankedTotal)

  return (
    <div className={`bl-lb-row bl-lb-brawler-row ${brawlerTableGrid}`}>
      <div className="bl-lb-rank-stack">
        <RankCell rank={player.rank} />
        <span>{worldPlacementShort}</span>
      </div>
      <Link href={playerHref} className="bl-lb-identity bl-lb-player-link">
        <PlayerAvatar name={player.player_name} rank={player.rank} iconId={enrichment?.iconId ?? null} />
        <div className="bl-lb-row-main">
          <div className="bl-lb-name">{player.player_name}</div>
          <div className="bl-lb-subline">{player.player_tag}</div>
        </div>
      </Link>
      <span className="bl-lb-row-stat">
        {formatExactTrophies(player.trophies)}
      </span>
      <span className="bl-lb-row-mono">{formatExactTrophies(selectedBrawler?.highestTrophies ?? player.trophies)}</span>
      <span className="bl-lb-row-mono">{formatPlainStat(selectedBrawler?.power)}</span>
      <span className="bl-lb-row-mono">{formatPlainStat(selectedBrawler?.prestigeLevel)}</span>
      <span className="bl-lb-row-mono">{formatNullableTrophies(totalTrophies)}</span>
      <ClubCell name={player.club_name} badgeId={enrichment?.clubBadgeId ?? null} />
      <span className="bl-lb-row-mono">{worldPlacement}</span>
    </div>
  )
}

function BrawlerPodiumCard({
  player,
  enrichment,
  rankedTotal,
}: {
  player: Player
  enrichment?: PlayerEnrichment
  rankedTotal: number
}) {
  const playerHref = playerProfileHref(player.player_tag)
  const totalTrophies = getTotalTrophies(player, enrichment)
  const worldPlacement = formatWorldPlacement(player.world_rank, enrichment, player.rank, rankedTotal)

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
          <strong>{formatNullableTrophies(totalTrophies)}</strong>
          <span>total trophies</span>
        </div>
      </div>
      <div className="bl-lb-podium-score">{formatExactTrophies(player.trophies)}</div>
      <div className="bl-lb-podium-foot">
        <div className="bl-lb-mini-stat">
          <strong>{worldPlacement}</strong>
          <span>world / top %</span>
        </div>
        <div className="bl-lb-mini-stat bl-lb-mini-stat-center">
          <strong>{formatExactTrophies(player.trophies)}</strong>
          <span>brawler trophies</span>
        </div>
        <div className="bl-lb-mini-stat bl-lb-mini-stat-right">
          <strong>{player.club_name ?? "No club"}</strong>
          <span>club</span>
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

function formatWorldPlacement(
  value: number | null | undefined,
  enrichment: PlayerEnrichment | undefined,
  brawlerRank: number,
  rankedTotal: number
) {
  if (typeof value === "number") return `#${value}`
  if (enrichment?.globalPercentile) return `Top ${enrichment.globalPercentile}`
  const brawlerPercentile = formatBrawlerPercentile(brawlerRank, rankedTotal)
  return brawlerPercentile ? `Top ${brawlerPercentile}` : "--"
}

function formatWorldPlacementShort(
  value: number | null | undefined,
  enrichment: PlayerEnrichment | undefined,
  brawlerRank: number,
  rankedTotal: number
) {
  if (typeof value === "number") return `#${value}`
  if (enrichment?.globalPercentile) return enrichment.globalPercentile
  return formatBrawlerPercentile(brawlerRank, rankedTotal) ?? "--"
}

function formatBrawlerPercentile(rank: number | null | undefined, total: number | null | undefined) {
  if (!rank || !total) return null
  const percentile = (rank / total) * 100
  if (percentile < 0.01) return "<0.01%"
  if (percentile < 10) return `${percentile.toFixed(1)}%`
  if (percentile < 100) return `${Math.round(percentile)}%`
  return "100%"
}

function formatNullableTrophies(value: number | null | undefined) {
  return formatPlainNumber(value)
}

function formatExactTrophies(value: number | null | undefined) {
  return formatPlainNumber(value)
}

function formatPlainStat(value: number | null | undefined) {
  return formatPlainNumber(value)
}

function getTotalTrophies(player: Player, enrichment: PlayerEnrichment | undefined) {
  return enrichment?.totalTrophies ?? player.total_trophies
}

function DpmLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="bl-lb-action"
    >
      {children}
    </Link>
  )
}
