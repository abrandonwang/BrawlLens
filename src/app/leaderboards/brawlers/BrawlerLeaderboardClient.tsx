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
  leaderboardAvatarClass,
  leaderboardActionClass,
  leaderboardClubCellClass,
  leaderboardMiniStatCenterClass,
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
  leaderboardRankStackClass,
  leaderboardRowAvatarClass,
  leaderboardRowClass,
  leaderboardRowMainClass,
  leaderboardRowMonoClass,
  leaderboardRowNameClass,
  leaderboardRowPlayerLinkClass,
  leaderboardRowStatClass,
  leaderboardRowSublineClass,
  leaderboardSublineClass,
  leaderboardTableListClass,
  leaderboardToolbarActionsClass,
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
      <LeaderboardHero
        title={`${selectedName} Leaderboard`}
        description={`Open a brawler-specific ladder for ${selectedName} and scan the leading accounts without leaving the compact leaderboard flow. The primary rank is for this brawler, while the smaller rank tracks each player's overall trophy position.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={playerSearch} onChange={setPlayerSearch} placeholder="Search player, tag, or club" name="brawler-leaderboard-player-search" />
          <div className={leaderboardToolbarActionsClass}>
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
            action={playerSearch ? <button type="button" onClick={() => setPlayerSearch("")} className={leaderboardActionClass}>Clear search</button> : <DpmLink href="/leaderboards/players">Open player leaderboard</DpmLink>}
          />
        ) : (
          <>
            <section aria-label="Top brawler players" className={leaderboardPodiumGridClass}>
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
              <TableHead className={`${brawlerTableGrid} [&>span:first-child]:text-center [&>span:nth-child(8)]:pl-2 [&>span:nth-child(8)]:text-left`}>
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

              <div className={leaderboardTableListClass}>
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
    <div className="relative w-[204px] shrink-0 max-[560px]:w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[38px] w-full cursor-pointer items-center gap-[9px] rounded-[7px] border border-[var(--lb-line)] bg-[var(--lb-panel-2)] px-2.5 text-left text-[var(--lb-text)] outline-0 hover:border-[var(--lb-line-2)] focus-visible:border-[var(--lb-line-2)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {activeBrawler ? (
          <>
            <BrawlImage src={brawlerIconUrl(activeBrawler.id)} alt={activeBrawler.name} width={28} height={28} className="size-7 shrink-0 rounded-md object-cover" sizes="28px" />
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold text-[var(--lb-text-2)]">{formatBrawlerName(activeBrawler.name)}</span>
          </>
        ) : (
          <>
            <Search size={15} strokeWidth={2.2} />
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold text-[var(--lb-text-2)]">Brawler</span>
          </>
        )}
        <ChevronDown size={14} strokeWidth={2.4} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div ref={dropdownRef} className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[306px] overflow-hidden rounded-[9px] border border-[var(--lb-line-2)] bg-[var(--panel)] shadow-[0_22px_56px_-32px_rgba(0,0,0,0.23)] max-[560px]:left-0 max-[560px]:right-auto max-[560px]:w-full" role="listbox">
          <div className="flex h-[42px] items-center gap-2 border-b border-[var(--lb-line)] px-[11px] text-[var(--lb-text-3)]">
            <Search size={15} strokeWidth={2} />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] font-semibold text-[var(--lb-text)] outline-0"
              name="brawler-selector-search"
              autoFocus
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search brawler..."
            />
          </div>
          <div className="max-h-[318px] overflow-y-auto p-1">
            {brawlers.length === 0 ? (
              <div className="px-4 py-4 text-center text-[12px] font-semibold text-[var(--lb-text-3)]">No brawler matches.</div>
            ) : (
              brawlers.map(brawler => (
                <button
                  key={brawler.id}
                  type="button"
                  onClick={() => select(brawler)}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[7px] border-0 px-2 py-2 text-left ${activeBrawler?.id === brawler.id ? "bg-[#7c5cff] text-[#171007] hover:bg-[#b9e8ff]" : "bg-transparent hover:bg-[rgba(245,244,241,0.07)]"}`}
                >
                  <BrawlImage src={brawlerIconUrl(brawler.id)} alt={brawler.name} width={30} height={30} className="size-7 shrink-0 rounded-md object-cover" sizes="30px" />
                  <span className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-bold ${activeBrawler?.id === brawler.id ? "text-[#171007]" : "text-[var(--lb-text)]"}`}>{formatBrawlerName(brawler.name)}</span>
                  <strong className="shrink-0 text-[10px] font-[850] uppercase" style={{ color: activeBrawler?.id === brawler.id ? "#171007" : brawler.rarity.color }}>{brawler.rarity.name}</strong>
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
    <div className={`${leaderboardRowClass} ${brawlerTableGrid}`}>
      <div className={leaderboardRankStackClass}>
        <RankCell rank={player.rank} />
        <span>{worldPlacementShort}</span>
      </div>
      <Link href={playerHref} className={leaderboardRowPlayerLinkClass}>
        <PlayerAvatar name={player.player_name} rank={player.rank} iconId={enrichment?.iconId ?? null} compact />
        <div className={leaderboardRowMainClass}>
          <div className={leaderboardRowNameClass}>{player.player_name}</div>
          <div className={leaderboardRowSublineClass}>{player.player_tag}</div>
        </div>
      </Link>
      <span className={leaderboardRowStatClass}>
        {formatExactTrophies(player.trophies)}
      </span>
      <span className={leaderboardRowMonoClass}>{formatExactTrophies(selectedBrawler?.highestTrophies ?? player.trophies)}</span>
      <span className={leaderboardRowMonoClass}>{formatPlainStat(selectedBrawler?.power)}</span>
      <span className={leaderboardRowMonoClass}>{formatPlainStat(selectedBrawler?.prestigeLevel)}</span>
      <span className={leaderboardRowMonoClass}>{formatNullableTrophies(totalTrophies)}</span>
      <ClubCell name={player.club_name} badgeId={enrichment?.clubBadgeId ?? null} />
      <span className={leaderboardRowMonoClass}>{worldPlacement}</span>
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
          <strong>{formatNullableTrophies(totalTrophies)}</strong>
          <span>total trophies</span>
        </div>
      </div>
      <div className={leaderboardPodiumScoreClass}>{formatExactTrophies(player.trophies)}</div>
      <div className={leaderboardPodiumFootClass}>
        <div className={leaderboardMiniStatClass}>
          <strong>{worldPlacement}</strong>
          <span>world / top %</span>
        </div>
        <div className={leaderboardMiniStatCenterClass}>
          <strong>{formatExactTrophies(player.trophies)}</strong>
          <span>brawler trophies</span>
        </div>
        <div className={leaderboardMiniStatRightClass}>
          <strong>{player.club_name ?? "No club"}</strong>
          <span>club</span>
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

function ClubCell({ name, badgeId }: { name: string | null; badgeId?: number | null }) {
  return (
    <span className={leaderboardClubCellClass}>
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
      className={leaderboardActionClass}
    >
      {children}
    </Link>
  )
}
