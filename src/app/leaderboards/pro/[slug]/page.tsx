import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProTeam, proTeams, type ProTeam } from "@/data/proTeams"
import { enrichRosterPlayers } from "@/lib/proRoster"
import ProTeamClient from "./ProTeamClient"

export const dynamic = "force-dynamic"
export const revalidate = 300

export function generateStaticParams() {
  return proTeams.map(team => ({ slug: team.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const team = getProTeam(slug)

  if (!team) {
    return {
      title: "Pro Team - BrawlLens",
    }
  }

  return {
    title: `${team.name} - BrawlLens`,
    description: `Roster and recent matches for ${team.name}.`,
    openGraph: {
      title: `${team.name} - BrawlLens`,
      description: team.description,
      type: "website",
    },
  }
}

export default async function ProTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const team = getProTeam(slug)

  if (!team) notFound()

  const enrichedTeam = await enrichProTeam(team)

  return <ProTeamClient team={enrichedTeam} />
}

async function enrichProTeam(team: ProTeam): Promise<ProTeam> {
  return {
    ...team,
    players: await enrichRosterPlayers(team.players),
  }
}
