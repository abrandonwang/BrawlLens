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

  useEffect(() => {
    const tags = visibleTags.filter(tag => !apiEnrichments[tag])
    if (!tags.length) return

    const controller = new AbortController()
    async function loadEnrichments() {
      try {
        const response = await fetch("/api/leaderboards/club-enrichment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags }),
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

  return (
    <LeaderboardPageShell active="clubs">
      <FeatureCardRail cards={professionalTeamCards} />

      <LeaderboardHero
        title="Clubs Leaderboard"
        description={`Compare the highest-ranked clubs in ${regionData?.label ?? "Global"} with member counts, average pressure, and recent BrawlLens update timing packed into a compact ladder view. The podium highlights the top three once, while the table continues from the next ranked club.`}
      />

      <LeaderboardBoard>
        <LeaderboardToolbar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search club or tag" name="club-leaderboard-search" />
          <div className="bl-lb-toolbar-actions">
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
            <section aria-label="Top clubs" className="bl-lb-podium-grid">
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
              <TableHead className={`${clubTableGrid} bl-lb-club-table-head`}>
                <span>Rank</span>
                <span>Club</span>
                <span>Trophies</span>
                <span>Members</span>
                <span>Avg</span>
                <span>Top member</span>
                <span>Prestige</span>
                <span>Leader %</span>
                <span>World</span>
                <span>Updated</span>
              </TableHead>

              <div className="bl-lb-table-list">
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
    <div className={`bl-lb-row bl-lb-club-row ${clubTableGrid}`}>
      <div className="bl-lb-rank-stack">
        <RankCell rank={club.rank} />
        <span>{formatWorldRank(worldRank)}</span>
      </div>
      <Link href={clubDetailHref(club.club_tag)} className="bl-lb-identity bl-lb-identity-link">
        <ClubAvatar name={club.club_name} rank={club.rank} badgeId={enrichment?.badgeId ?? null} />
        <div className="bl-lb-row-main">
          <div className="bl-lb-name">{club.club_name}</div>
          <div className="bl-lb-subline">{club.club_tag}</div>
        </div>
      </Link>
      <span className="bl-lb-row-stat">
        {formatTrophies(club.trophies)}
      </span>
      <span className="bl-lb-row-mono">{club.member_count ?? "-"}</span>
      <span className="bl-lb-row-mono">{formatTrophies(avg)}</span>
      <TopMemberCell member={enrichment?.topMember ?? null} />
      <PrestigeCell value={enrichment?.totalPrestige} coverage={enrichment?.prestigeCoverage} members={club.member_count} />
      <span className="bl-lb-row-mono">{formatLeaderShare(club, enrichment?.topMember)}</span>
      <span className="bl-lb-row-mono">{formatWorldRank(worldRank)}</span>
      <span suppressHydrationWarning className="bl-lb-row-muted">{formatRelativeTime(club.updated_at) || "Live"}</span>
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
    <div className="bl-lb-podium-card">
      <div className="bl-lb-podium-top">
        <span className="bl-lb-podium-rank">{club.rank}</span>
        <Link href={clubDetailHref(club.club_tag)} className="bl-lb-identity bl-lb-identity-link bl-lb-podium-identity">
          <ClubAvatar name={club.club_name} rank={club.rank} badgeId={enrichment?.badgeId ?? null} />
          <div className="bl-lb-row-main">
            <div className="bl-lb-name">{club.club_name}</div>
            <div className="bl-lb-subline">{club.club_tag}</div>
          </div>
        </Link>
        <div className="bl-lb-podium-rate">
          <strong suppressHydrationWarning>{formatRelativeTime(club.updated_at) || "Live"}</strong>
          <span>updated</span>
        </div>
      </div>
      <div className="bl-lb-podium-score">{formatTrophies(club.trophies)}</div>
      <div className="bl-lb-podium-foot">
        <div className="bl-lb-mini-stat">
          <strong>{club.member_count ?? "-"}</strong>
          <span>members</span>
        </div>
        <div className="bl-lb-mini-stat bl-lb-mini-stat-center">
          <strong>{formatPlainStat(enrichment?.totalPrestige)}</strong>
          <span>total prestige</span>
        </div>
        <div className="bl-lb-mini-stat bl-lb-mini-stat-right">
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
  if (typeof value !== "number") return <span className="bl-lb-row-mono">--</span>
  const complete = typeof members === "number" && typeof coverage === "number" && coverage >= members

  return (
    <span
      className="bl-lb-row-mono"
      title={complete ? "Total club prestige" : `Prestige loaded for ${coverage ?? 0}/${members ?? "?"} members`}
    >
      {formatPlainStat(value)}
    </span>
  )
}

function TopMemberCell({ member }: { member: ClubMemberSummary | null }) {
  if (!member) return <span className="bl-lb-member-cell bl-lb-member-cell-empty">--</span>

  return (
    <span className="bl-lb-member-cell">
      <strong>{member.name}</strong>
      <small>{typeof member.trophies === "number" ? formatFullNumber(member.trophies) : member.role ?? "--"}</small>
    </span>
  )
}

function ClubAvatar({ name, rank, badgeId }: { name: string; rank: number; badgeId?: number | null }) {
  const color = rank === 1 ? "#f2cf63" : rank === 2 ? "#d6dbe4" : rank === 3 ? "#c88b5a" : "#7d86ff"
  return (
    <span className="bl-lb-avatar" style={{ color }}>
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
      className="bl-lb-action"
    >
      {children}
    </button>
  )
}
