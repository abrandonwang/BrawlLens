import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getRequestUser } from "@/lib/auth"
import { fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const runtime = "nodejs"

type SetupPayload = {
  playerTag?: unknown
  playerName?: unknown
  region?: unknown
  goals?: unknown
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8)
}

type PlayerProfileEnrichment = {
  playerName: string | null
  club: { tag: string; name: string } | null
  trophies: number | null
  highestTrophies: number | null
  expLevel: number | null
}

async function enrichFromBrawlApi(playerTag: string): Promise<PlayerProfileEnrichment> {
  const fallback: PlayerProfileEnrichment = {
    playerName: null,
    club: null,
    trophies: null,
    highestTrophies: null,
    expLevel: null,
  }
  try {
    const response = await fetchPlayerResponse(playerTag, { cache: "no-store" })
    if (!response.ok) return fallback
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
    if (!data) return fallback

    const name = typeof data.name === "string" ? data.name.trim().slice(0, 80) : null
    const trophies = typeof data.trophies === "number" ? data.trophies : null
    const highestTrophies = typeof data.highestTrophies === "number" ? data.highestTrophies : null
    const expLevel = typeof data.expLevel === "number" ? data.expLevel : null

    let club: { tag: string; name: string } | null = null
    const clubRaw = data.club as Record<string, unknown> | null | undefined
    if (clubRaw && typeof clubRaw.tag === "string" && clubRaw.tag) {
      club = {
        tag: clubRaw.tag.replace(/^#/, ""),
        name: typeof clubRaw.name === "string" ? clubRaw.name.slice(0, 80) : "",
      }
    }

    return { playerName: name, club, trophies, highestTrophies, expLevel }
  } catch {
    return fallback
  }
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as SetupPayload | null
  const playerTag = sanitizePlayerTag(typeof body?.playerTag === "string" ? body.playerTag : "")
  if (!playerTag) {
    return NextResponse.json({ error: "invalid_player_tag" }, { status: 400 })
  }

  const enrichment = await enrichFromBrawlApi(playerTag)

  const fallbackName = typeof body?.playerName === "string" && body.playerName.trim()
    ? body.playerName.trim().slice(0, 80)
    : null
  const playerName = enrichment.playerName ?? fallbackName
  const displayName = playerName ?? `#${playerTag}`

  const setup = {
    playerTag,
    playerName,
    club: enrichment.club,
    trophies: enrichment.trophies,
    highestTrophies: enrichment.highestTrophies,
    expLevel: enrichment.expLevel,
    region: typeof body?.region === "string" && body.region.trim() ? body.region.trim().slice(0, 32) : "Global",
    goals: stringArray(body?.goals),
    completedAt: new Date().toISOString(),
  }

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "account_storage_not_configured" }, { status: 503 })
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      display_name: displayName,
      brawllens_setup: setup,
    },
  })
  if (error) {
    return NextResponse.json({ error: "setup_save_failed" }, { status: 502 })
  }

  await admin
    .from("user_profiles")
    .upsert({ id: user.id, email: user.email ?? null, display_name: displayName }, { onConflict: "id" })

  return NextResponse.json({ ok: true, setup, displayName })
}
