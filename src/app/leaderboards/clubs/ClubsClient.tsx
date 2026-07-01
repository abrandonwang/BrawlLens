"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BrawlImage, profileIconUrl } from "@/components/BrawlImage"
import { formatTrophies } from "@/lib/format"
import {
  clubBadgeUrl,
  clubDetailHref,
  firstGlyph,
  formatLeaderboardRank,
  formatPlainNumber,
  leaderboardTagKey,
  playerProfileHref,
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
  TableHead,
  TableHeadHelp,
  leaderboardAvatarClass,
  leaderboardActionClass,
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
  leaderboardRowAvatarClass,
  leaderboardRowClass,
  leaderboardRowMainClass,
  leaderboardRowNameClass,
  leaderboardRowStatClass,
  leaderboardRowSublineClass,
  leaderboardSublineClass,
  leaderboardTableListClass,
  leaderboardToolbarActionsClass,
  leaderboardUnifiedGrid,
} from "../LeaderboardDpmShell"

interface Club {
  rank: number
  club_tag: string
  club_name: string
  trophies: number
  member_count: number | null
  updated_at: string
}

interface RegionData {
  code: string
  label: string
  clubs: Club[]
}

interface ClubEnrichment {
  badgeId: number | null
  topMember?: ClubMemberSummary | null
  totalPrestige?: number | null
  prestigeCoverage?: number
  prestigeLoaded?: boolean
}

const PAGE_SIZE = 50

interface ClubMemberSummary {
  tag: string | null
  name: string
  trophies: number | null
  role: string | null
  iconId: number | null
}

export default function ClubsClient({ allData }: { allData: RegionData[] }) {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") ?? ""
  const [activeRegion, setActiveRegion] = useState<string>("global")
  const [search, setSearch] = useState(initialSearch)
  const [page, setPage] = useState(0)
  const [apiEnrichments, setApiEnrichments] = useState<Record<string, ClubEnrichment>>({})

  useEffect(() => { setPage(0) }, [search, activeRegion])

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "")
  }, [searchParams])

  const regionData = useMemo(() => allData.find(r => r.code === activeRegion) ?? allData[0], [allData, activeRegion])
  const globalRankByTag = useMemo(() => {
    const globalClubs = allData.find(r => r.code === "global")?.clubs ?? []
    return new Map(globalClubs.map(club => [leaderboardTagKey(club.club_tag), club.rank]))
  }, [allData])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const clubs = regionData?.clubs ?? []
    if (!q) return clubs
    return clubs.filter(club =>
      club.club_name.toLowerCase().includes(q) ||
      club.club_tag.toLowerCase().includes(q)
    )
  }, [regionData, search])

  const tableClubs = filtered.slice(3)
  const totalPages = Math.max(1, Math.ceil(tableClubs.length / PAGE_SIZE))
  const paginated = tableClubs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const visibleClubs = useMemo(() => [...filtered.slice(0, 3), ...paginated], [filtered, paginated])
  const visibleTags = useMemo(() => visibleClubs.map(club => leaderboardTagKey(club.club_tag)), [visibleClubs])
  const visibleTagKey = visibleTags.join(",")
  const podiumTags = useMemo(() => filtered.slice(0, 3).map(club => leaderboardTagKey(club.club_tag)), [filtered])
  const podiumTagKey = podiumTags.join(",")

  useEffect(() => {
    const tags = visibleTags.filter(tag => !apiEnrichments[tag])
    if (!tags.length) return

    const controller = new AbortController()
    async function loadEnrichments() {
      try {
        const response = await fetch("/api/leaderboards/club-enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags, includePrestige: false }),
          signal: controller.signal,
        })
        if (!response.ok) return

        const data = await response.json() as { clubs?: Record<string, ClubEnrichment> }
        if (data.clubs) {
          setApiEnrichments(prev => ({ ...prev, ...data.clubs }))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Club leaderboard enrichment request failed:", error)
        }
      }
    }

    void loadEnrichments()
    return () => controller.abort()
  }, [visibleTagKey, visibleTags, apiEnrichments])

  useEffect(() => {
    const tags = podiumTags.filter(tag => {
      const enrichment = apiEnrichments[tag]
      return enrichment && !enrichment.prestigeLoaded
    })
    if (!tags.length) return

    const controller = new AbortController()
    async function loadPodiumPrestige() {
      try {
        const response = await fetch("/api/leaderboards/club-enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags, includePrestige: true }),
          signal: controller.signal,
        })
        if (!response.ok) return

        const data = await response.json() as { clubs?: Record<string, ClubEnrichment> }
        if (data.clubs) {
          setApiEnrichments(prev => ({ ...prev, ...data.clubs }))
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Club leaderboard prestige request failed:", error)
        }
      }
    }

    void loadPodiumPrestige()
    return () => controller.abort()
  }, [podiumTagKey, podiumTags, apiEnrichments])

  return (
    <LeaderboardPageShell active="clubs">
      <LeaderboardHero
        title="Clubs Leaderboard"
        description={`The strongest clubs in ${regionData?.label ?? "Global"} ranked by combined member trophies.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search club or tag" name="club-leaderboard-search" />
          <div className={leaderboardToolbarActionsClass}>
            <RegionDropdown regions={allData} activeRegion={activeRegion} onChange={setActiveRegion} />
          </div>
        </LeaderboardToolbar>

        {filtered.length === 0 ? (
          <EmptyLeaderboardState
            title={search ? "No clubs match" : "No leaderboard data"}
            description={search ? "Your search filtered out every club in this region." : `No club rankings are available for ${regionData?.label ?? activeRegion} right now.`}
            action={search ? <DpmButton onClick={() => setSearch("")}>Clear search</DpmButton> : activeRegion !== "global" ? <DpmButton onClick={() => setActiveRegion("global")}>Switch to global</DpmButton> : undefined}
          />
        ) : (
          <>
            <section aria-label="Top clubs" className={leaderboardPodiumGridClass}>
              {filtered.slice(0, 3).map(club => (
                <ClubPodiumCard
                  key={club.club_tag}
                  club={club}
                  worldRank={globalRankByTag.get(leaderboardTagKey(club.club_tag)) ?? (activeRegion === "global" ? club.rank : null)}
                  enrichment={apiEnrichments[leaderboardTagKey(club.club_tag)]}
                />
              ))}
            </section>

            <LeaderboardPanel>
              <TableHead className={`${leaderboardUnifiedGrid} [&>span:first-child]:text-center`}>
                <span>Rank</span>
                <span>Club</span>
                <TableHeadHelp label="Trophies" help="Club trophy total from the selected leaderboard snapshot." />
                <TableHeadHelp label="Members" help="Visible member count plus the average trophies per member." />
                <TableHeadHelp label="Top member" help="Highest trophy member returned by club enrichment." />
              </TableHead>

              <div className={leaderboardTableListClass}>
                {paginated.map(club => (
                  <ClubRankRow
                    key={`${activeRegion}-${club.club_tag}`}
                    club={club}
                    enrichment={apiEnrichments[leaderboardTagKey(club.club_tag)]}
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

function ClubRankRow({
  club,
  enrichment,
}: {
  club: Club
  enrichment?: ClubEnrichment
}) {
  const avg = averageTrophies(club)
  const enrichmentReady = enrichment !== undefined

  return (
    <div className={`${leaderboardRowClass} ${leaderboardUnifiedGrid}`}>
      <div className="grid place-items-center">
        <RankCell rank={club.rank} />
      </div>
      <Link href={clubDetailHref(club.club_tag)} className="flex min-w-0 items-center gap-2 rounded-[7px] text-inherit no-underline transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(142,213,255,0.42)]">
        <ClubAvatar name={club.club_name} rank={club.rank} badgeId={enrichment?.badgeId ?? null} compact />
        <div className={leaderboardRowMainClass}>
          <div className={leaderboardRowNameClass}>{club.club_name}</div>
          <div className={leaderboardRowSublineClass}>{club.club_tag}</div>
        </div>
      </Link>
      <span className={leaderboardRowStatClass}>
        {formatTrophies(club.trophies)}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <strong className="text-[13px] font-[850] leading-none text-[var(--lb-text)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)]">
          {club.member_count ?? "-"}
        </strong>
        <span className="text-[10.5px] font-[620] leading-none text-[var(--lb-text-3)]">
          avg {formatTrophies(avg)}
        </span>
      </div>
      <TopMemberCell member={enrichment?.topMember ?? null} ready={enrichmentReady} />
    </div>
  )
}

function ClubPodiumCard({
  club,
  worldRank,
  enrichment,
}: {
  club: Club
  worldRank: number | null
  enrichment?: ClubEnrichment
}) {
  return (
    <div className={leaderboardPodiumCardClass}>
      <div className={leaderboardPodiumTopClass}>
        <span className={leaderboardPodiumRankClass(club.rank)}>{club.rank}</span>
        <Link href={clubDetailHref(club.club_tag)} className={leaderboardPodiumIdentityClass}>
          <ClubAvatar name={club.club_name} rank={club.rank} badgeId={enrichment?.badgeId ?? null} />
          <div className={leaderboardRowMainClass}>
            <div className={leaderboardNameClass}>{club.club_name}</div>
            <div className={leaderboardSublineClass}>{club.club_tag}</div>
          </div>
        </Link>
        <div className={leaderboardPodiumRateClass}>
          <strong>{formatTrophies(averageTrophies(club))}</strong>
          <span>avg / member</span>
        </div>
      </div>
      <div className={leaderboardPodiumScoreClass}>{formatTrophies(club.trophies)}</div>
      <div className={leaderboardPodiumFootClass}>
        <div className={leaderboardMiniStatClass}>
          <strong>{club.member_count ?? "-"}</strong>
          <span>members</span>
        </div>
        <div className={leaderboardMiniStatCenterClass}>
          <strong>{formatPlainStat(enrichment?.totalPrestige)}</strong>
          <span>total prestige</span>
        </div>
        <div className={leaderboardMiniStatRightClass}>
          <strong>{formatWorldRank(worldRank)}</strong>
          <span>world</span>
        </div>
      </div>
    </div>
  )
}

function TopMemberCell({ member, ready = true }: { member: ClubMemberSummary | null; ready?: boolean }) {
  if (!ready) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <CellSkeleton width={22} height={22} />
        <span className="flex min-w-0 flex-col gap-1">
          <CellSkeleton width={84} height={9} />
          <CellSkeleton width={44} height={8} />
        </span>
      </span>
    )
  }
  if (!member) {
    return <span className="text-[11px] font-[680] text-[var(--lb-text-3)]">No data yet</span>
  }

  const trophyLine = typeof member.trophies === "number" ? formatFullNumber(member.trophies) : member.role ?? "-"
  const avatar = (
    <span
      aria-hidden="true"
      className="grid size-[22px] shrink-0 place-items-center overflow-hidden rounded-full border border-[rgba(245,244,241,0.08)] bg-[rgba(255, 107, 107,0.16)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] text-[10px] font-black leading-none text-[#FF9494]"
    >
      {member.iconId ? (
        <BrawlImage src={profileIconUrl(member.iconId)} alt="" width={22} height={22} sizes="22px" />
      ) : (
        member.name.charAt(0).toUpperCase()
      )}
    </span>
  )

  const inner = (
    <>
      {avatar}
      <span className="min-w-0">
        <strong className="block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] font-[780] leading-none text-[var(--lb-text)]">
          {member.name}
        </strong>
        <small className="mt-[3px] block min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-[760] leading-none text-[var(--lb-text-3)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)]">
          {trophyLine}
        </small>
      </span>
    </>
  )

  if (member.tag) {
    return (
      <Link
        href={playerProfileHref(member.tag)}
        className="flex min-w-0 items-center gap-1.5 overflow-hidden rounded-[7px] text-inherit no-underline transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(142,213,255,0.42)]"
      >
        {inner}
      </Link>
    )
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
      {inner}
    </span>
  )
}

function ClubAvatar({ name, rank, badgeId, compact = false }: { name: string; rank: number; badgeId?: number | null; compact?: boolean }) {
  const color = rank === 1 ? "#f2cf63" : rank === 2 ? "#d6dbe4" : rank === 3 ? "#c88b5a" : "#7d86ff"
  return (
    <span className={compact ? leaderboardRowAvatarClass : leaderboardAvatarClass} style={{ color }}>
      {badgeId ? (
        <BrawlImage src={clubBadgeUrl(badgeId)} alt="" width={44} height={44} sizes="44px" />
      ) : firstGlyph(name)}
    </span>
  )
}

function averageTrophies(club: Club) {
  return club.member_count ? Math.round(club.trophies / Math.max(1, club.member_count)) : club.trophies
}

function formatWorldRank(value: number | null | undefined) {
  return formatLeaderboardRank(value)
}

function formatFullNumber(value: number | null | undefined) {
  return formatPlainNumber(value)
}

function formatPlainStat(value: number | null | undefined) {
  return formatPlainNumber(value)
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
