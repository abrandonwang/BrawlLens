export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import BrawlerRankingClient from "./BrawlerRankingClient"

type PageProps = { params: Promise<{ id: string }> }

function createSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

async function fetchBrawlerName(brawlerId: number) {
  const { data } = await createSupabaseClient()
    .from("brawler_leaderboards")
    .select("brawler_name")
    .eq("brawler_id", brawlerId)
    .limit(1)
    .maybeSingle()

  return data?.brawler_name ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const brawlerId = parseInt(id)

  if (!Number.isFinite(brawlerId)) {
    return { title: "Brawler Leaderboard - BrawlLens" }
  }

  const brawlerName = await fetchBrawlerName(brawlerId)
  return {
    title: brawlerName ? `${brawlerName} Leaderboard - BrawlLens` : "Brawler Leaderboard - BrawlLens",
    description: brawlerName ? `Top ${brawlerName} players on BrawlLens.` : "Top brawler players on BrawlLens.",
  }
}

export default async function BrawlerRankingPage({ params }: PageProps) {
  const { id } = await params
  const brawlerId = parseInt(id)

  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from("brawler_leaderboards")
    .select("rank, player_tag, player_name, trophies, club_name, brawler_name")
    .eq("brawler_id", brawlerId)
    .order("rank", { ascending: true })
    .limit(200)

  if (error || !data?.length) notFound()

  return <BrawlerRankingClient data={data} brawlerName={data[0].brawler_name} />
}
