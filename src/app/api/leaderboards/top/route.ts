import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const REGIONS = [
  { code: "global", label: "Global" },
  { code: "US", label: "US" },
  { code: "KR", label: "KR" },
  { code: "BR", label: "BR" },
  { code: "DE", label: "DE" },
  { code: "JP", label: "JP" },
]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 5, 1), 20)

  const results = await Promise.all(
    REGIONS.map(async region => {
      const { data, error } = await supabase
        .from("leaderboards")
        .select("rank, player_tag, player_name, trophies, club_name")
        .eq("region", region.code)
        .order("rank", { ascending: true })
        .limit(limit)
      if (error) return { ...region, players: [] }
      return { ...region, players: data ?? [] }
    })
  )

  const res = NextResponse.json({ regions: results })
  res.headers.set("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
  return res
}
