import { createClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import MapDetailClient from "./MapDetailClient"

export const dynamic = "force-dynamic"

async function getMapImage(mapName: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.brawlify.com/v1/maps", { next: { revalidate: 3600 } })
    const data = await res.json()
    const found = (data.list || []).find((m: { name: string; imageUrl: string }) => m.name === mapName)
    return found?.imageUrl ?? null
  } catch {
    return null
  }
}

async function getRotationMapNames(): Promise<Set<string>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/rotation`, { next: { revalidate: 300 } })
    const data = await res.json()
    const names = new Set<string>()
    for (const slot of data || []) {
      if (slot.event?.map) names.add(slot.event.map)
    }
    return names
  } catch {
    return new Set()
  }
}

export default async function MapDetailPage({ params }: { params: Promise<{ map: string }> }) {
  const { map: encodedMap } = await params
  const mapName = decodeURIComponent(encodedMap)

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const [{ data, error }, imageUrl, rotationNames] = await Promise.all([
    supabase
      .from("map_brawler_stats")
      .select("brawler_id, brawler_name, picks, wins, win_rate")
      .eq("map", mapName)
      .order("picks", { ascending: false }),
    getMapImage(mapName),
    getRotationMapNames(),
  ])

  if (error || !data?.length) notFound()

  const rows = data
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
      totalBattles={totalBattles}
      brawlers={brawlers}
      isLive={rotationNames.has(mapName)}
    />
  )
}
