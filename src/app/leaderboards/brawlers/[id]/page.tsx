export const dynamic = "force-dynamic"

import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import BrawlerRankingClient from "./BrawlerRankingClient"

export default async function BrawlerRankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const brawlerId = parseInt(id)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const { data, error } = await supabase
    .from("brawler_leaderboards")
    .select("rank, player_tag, player_name, trophies, club_name, brawler_name")
    .eq("brawler_id", brawlerId)
    .order("rank", { ascending: true })
    .limit(200)

  if (error || !data?.length) notFound()

  return <BrawlerRankingClient data={data} brawlerName={data[0].brawler_name} />
}
