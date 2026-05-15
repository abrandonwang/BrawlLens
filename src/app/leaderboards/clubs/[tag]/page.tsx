import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import type { ProPlayer, ProTeam } from "@/data/proTeams"
import { cleanEnv } from "@/lib/env"
import { fetchClubResponse } from "@/lib/playerLookup"
import { displayRosterName, enrichRosterPlayers } from "@/lib/proRoster"
import { sanitizePlayerTag } from "@/lib/validation"
import ProTeamClient from "../../pro/[slug]/ProTeamClient"

export const dynamic = "force-dynamic"
export const revalidate = 300

interface ClubProfile {
  tag?: string
  name?: string
  trophies?: number
  requiredTrophies?: number
  members?: ClubMember[]
}

interface ClubLeaderboardRow {
  club_tag: string
  club_name: string
  trophies: number
  member_count: number | null
}

interface ClubMember {
  tag?: string
  name?: string
  trophies?: number
  role?: string
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const tag = sanitizePlayerTag((await params).tag)

  if (!tag) {
    return {
      title: "Club - BrawlLens",
    }
  }

  const club = await fetchClub(tag)
  const name = club?.name ?? `#${tag}`

  return {
    title: `${name} - BrawlLens`,
    description: `Roster and members for ${name}.`,
    openGraph: {
      title: `${name} - BrawlLens`,
      description: `Brawl Stars club roster for ${name}.`,
      type: "website",
    },
  }
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const tag = sanitizePlayerTag((await params).tag)
  if (!tag) notFound()

  const club = await fetchClub(tag)
  if (!club) notFound()

  const players = await enrichRosterPlayers((club.members ?? []).map(memberToPlayer), 6)
  const team: ProTeam = {
    slug: `club-${tag.toLowerCase()}`,
    name: club.name ?? `#${tag}`,
    accent: "#8bd7ff",
    sourceClubTag: tag,
    description: `${club.name ?? "Club"} member board from club #${tag}.`,
    players,
    recentLog: [],
  }

  return <ProTeamClient team={team} active="clubs" />
}

async function fetchClub(tag: string) {
  try {
    const response = await fetchClubResponse(tag, { next: { revalidate: 300 } })
    if (response.ok) return (await response.json()) as ClubProfile
  } catch {
    // Fall through to the leaderboard snapshot so ranked club links still resolve.
  }

  return fetchLeaderboardClubFallback(tag)
}

async function fetchLeaderboardClubFallback(tag: string): Promise<ClubProfile | null> {
  const url = cleanEnv(process.env.SUPABASE_URL)
  const key = cleanEnv(process.env.SUPABASE_SERVICE_KEY)
  if (!url || !key) return null

  try {
    const supabase = createClient(url, key)
    const variants = [`#${tag}`, tag]
    const { data, error } = await supabase
      .from("club_leaderboards")
      .select("club_tag, club_name, trophies, member_count")
      .in("club_tag", variants)
      .order("rank", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data) return null
    const row = data as ClubLeaderboardRow
    return {
      tag: row.club_tag,
      name: row.club_name,
      trophies: row.trophies,
      members: [],
    }
  } catch {
    return null
  }
}

function memberToPlayer(member: ClubMember, index: number): ProPlayer {
  const tag = member.tag ? sanitizePlayerTag(member.tag) ?? undefined : undefined

  return {
    id: tag ? `club-member-${tag}` : `club-member-${index}`,
    name: displayRosterName(member.name ?? "Unknown"),
    handle: displayRosterName(member.name ?? "Unknown"),
    group: "Club",
    role: roleLabel(member.role),
    tag,
    status: "Offline",
    trophies: member.trophies ?? 0,
    wins: 0,
    losses: 0,
    prestige: 0,
    bestBrawlers: [],
  }
}

function roleLabel(role: string | undefined) {
  if (role === "president") return "President"
  if (role === "vicePresident") return "Vice President"
  if (role === "senior") return "Senior"
  if (role === "member") return "Member"
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member"
}
