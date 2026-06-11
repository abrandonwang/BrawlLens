import { createClient } from "@supabase/supabase-js"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import MapDetailClient from "./MapDetailClient"
import { getModeName } from "@/lib/modes"
import type { RotationEvent } from "@/lib/rotation"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ map: string }> }

async function getMapImage(mapName: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.brawlapi.com/v1/maps", { next: { revalidate: 3600 } })
    const data = await res.json()
    const found = (data.list || []).find((m: { name: string; imageUrl: string }) => m.name === mapName)
    return found?.imageUrl ?? null
  } catch {
    return null
  }
}

async function getRotationInfoForMap(mapName: string): Promise<{ isLive: boolean; endTime: string | null }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/rotation`, { next: { revalidate: 300 } })
    const data = await res.json() as RotationEvent[]
    for (const slot of data || []) {
      if (slot.event?.map === mapName) {
        return { isLive: true, endTime: slot.endTime ?? null }
      }
    }
    return { isLive: false, endTime: null }
  } catch {
    return { isLive: false, endTime: null }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { map: encodedMap } = await params
  const mapName = decodeURIComponent(encodedMap)
  return {
    title: `${mapName} - BrawlLens`,
    description: `Brawler win rates, picks, and matchup stats for ${mapName}.`,
    openGraph: {
      title: `${mapName} - BrawlLens`,
      description: `Brawl Stars map meta and brawler performance for ${mapName}.`,
      type: "website",
    },
  }
}

export default async function MapDetailPage({ params }: PageProps) {
  const { map: encodedMap } = await params
  const mapName = decodeURIComponent(encodedMap)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const [{ data, error }, { data: mapMeta }, imageUrl, rotationInfo] = await Promise.all([
    supabase
      .from("map_brawler_stats")
      .select("brawler_id, brawler_name, picks, wins, win_rate")
      .eq("map", mapName)
      .order("picks", { ascending: false }),
    supabase
      .from("map_stats")
      .select("mode, battle_count")
      .eq("map", mapName)
      .order("battle_count", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getMapImage(mapName),
    getRotationInfoForMap(mapName),
  ])

  if (error) notFound()

  const rows = data ?? []
  const totalBattles = Math.round(rows.reduce((sum, r) => sum + Number(r.picks), 0) / 6)

  const brawlers = rows.map((row) => ({
    brawlerId: row.brawler_id,
    name: row.brawler_name,
    picks: Number(row.picks),
    wins: Number(row.wins),
    winRate: Number(row.win_rate),
  }))

  return (
    <MapDetailClient
      mapName={mapName}
      imageUrl={imageUrl}
      modeName={mapMeta?.mode ? getModeName(mapMeta.mode) : null}
      totalBattles={totalBattles}
      brawlers={brawlers}
      isLive={rotationInfo.isLive}
      rotationEndTime={rotationInfo.endTime}
    />
  )
}
