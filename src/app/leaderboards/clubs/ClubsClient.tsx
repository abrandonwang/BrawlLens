"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BrawlImage } from "@/components/BrawlImage"
import { formatRelativeTime, formatTrophies } from "@/lib/format"
import {
  clubBadgeUrl,
  clubDetailHref,
  firstGlyph,
  formatLeaderboardRank,
  formatPlainNumber,
  leaderboardTagKey,
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
  leaderboardRankStackClass,
  leaderboardRowAvatarClass,
  leaderboardRowClass,
  leaderboardRowMainClass,
  leaderboardRowMonoClass,
  leaderboardRowMutedClass,
  leaderboardRowNameClass,
  leaderboardRowStatClass,
  leaderboardRowSublineClass,
  leaderboardSublineClass,
  leaderboardTableListClass,
  leaderboardToolbarActionsClass,
  professionalTeamCards,
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
const clubTableGrid = "grid grid-cols-[34px_minmax(150px,190px)_82px_56px_74px_minmax(116px,1fr)_70px_54px_42px_64px] items-center gap-1"

interface ClubMemberSummary {
  tag: string | null
  name: string
  trophies: number | null
  role: string | null
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
      <FeatureCardRail cards={professionalTeamCards} />

      <LeaderboardHero
        title="Clubs Leaderboard"
        description={`Top clubs in ${regionData?.label ?? "Global"} ranked by total trophies — ${(regionData?.clubs?.length ?? 0).toLocaleString()} clubs tracked.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search club or tag" name="club-leaderboard-search" />
          <div className={leaderboardToolbarActionsClass}>
            <RegionPills regions={allData} activeRegion={activeRegion} onChange={setActiveRegion} />
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
              <TableHead className={`${clubTableGrid} min-w-[820px] [&>span:first-child]:text-center [&>span:nth-child(6)]:pl-2 [&>span:nth-child(6)]:text-left`}>
                <span>Rank</span>
                <span>Club</span>
                <TableHeadHelp label="Trophies" help="Club trophy total from the selected leaderboard snapshot." />
                <TableHeadHelp label="Members" help="Visible member count for the club." />
                <TableHeadHelp label="Avg" help="Club trophies divided by visible member count." />
                <TableHeadHelp label="Top member" help="Highest trophy member returned by club enrichment." />
                <TableHeadHelp label="Prestige" help="Summed member prestige from enrichment when available." />
                <TableHeadHelp label="Leader %" help="Top member trophies as a share of the club trophy total." />
                <TableHeadHelp label="World" help="The club's global rank when BrawlLens can match it to the global leaderboard." />
                <TableHeadHelp label="Updated" help="How recently BrawlLens last updated this leaderboard row." />
              </TableHead>

              <div className={leaderboardTableListClass}>
                {paginated.map(club => (
                  <ClubRankRow
                    key={`${activeRegion}-${club.club_tag}`}
                    club={club}
                    worldRank={globalRankByTag.get(leaderboardTagKey(club.club_tag)) ?? (activeRegion === "global" ? club.rank : null)}
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
  worldRank,
  enrichment,
}: {
  club: Club
  worldRank: number | null
  enrichment?: ClubEnrichment
}) {
  const avg = averageTrophies(club)

  return (
    <div className={`${leaderboardRowClass} min-w-[820px] ${clubTableGrid}`}>
      <div className={leaderboardRankStackClass}>
        <RankCell rank={club.rank} />
        <span>{formatWorldRank(worldRank)}</span>
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
      <span className={leaderboardRowMonoClass}>{club.member_count ?? "-"}</span>
      <span className={leaderboardRowMonoClass}>{formatTrophies(avg)}</span>
      <TopMemberCell member={enrichment?.topMember ?? null} />
      <PrestigeCell value={enrichment?.totalPrestige} coverage={enrichment?.prestigeCoverage} members={club.member_count} />
      <span className={leaderboardRowMonoClass}>{formatLeaderShare(club, enrichment?.topMember)}</span>
      <span className={leaderboardRowMonoClass}>{formatWorldRank(worldRank)}</span>
      <span suppressHydrationWarning className={leaderboardRowMutedClass}>{formatRelativeTime(club.updated_at) || "Live"}</span>
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
          <strong suppressHydrationWarning>{formatRelativeTime(club.updated_at) || "Live"}</strong>
          <span>updated</span>
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

function PrestigeCell({
  value,
  coverage,
  members,
}: {
  value: number | null | undefined
  coverage: number | undefined
  members: number | null
}) {
  if (typeof value !== "number") return <span className={leaderboardRowMonoClass}>--</span>
  const complete = typeof members === "number" && typeof coverage === "number" && coverage >= members

  return (
    <span
      className={leaderboardRowMonoClass}
      title={complete ? "Total club prestige" : `Prestige loaded for ${coverage ?? 0}/${members ?? "?"} members`}
    >
      {formatPlainStat(value)}
    </span>
  )
}

function TopMemberCell({ member }: { member: ClubMemberSummary | null }) {
  if (!member) return <span className="pl-2 text-[11px] font-extrabold text-[var(--lb-text-4)] [font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)] max-[560px]:text-[9px]">--</span>

  return (
    <span className="flex min-w-0 items-center gap-1.5 overflow-hidden pl-2 text-[var(--lb-text-2)] [&_strong]:block [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[11px] [&_strong]:font-[780] [&_strong]:leading-none [&_strong]:text-[var(--lb-text)] [&_small]:mt-[3px] [&_small]:block [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[9px] [&_small]:font-[760] [&_small]:leading-none [&_small]:text-[var(--lb-text-3)] [&_small]:[font-family:var(--font-geist-mono,var(--font-jetbrains-mono),ui-monospace,monospace)]">
      <strong>{member.name}</strong>
      <small>{typeof member.trophies === "number" ? formatFullNumber(member.trophies) : member.role ?? "--"}</small>
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

function formatLeaderShare(club: Club, topMember: ClubMemberSummary | null | undefined) {
  if (typeof topMember?.trophies !== "number" || !club.trophies) return "--"
  return `${Math.round((topMember.trophies / club.trophies) * 100)}%`
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
