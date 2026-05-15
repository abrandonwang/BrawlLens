import { NextResponse } from "next/server"
import {
  battleLogProxyUrl,
  clubProxyUrl,
  fetchClubResponse,
  fetchPlayerBattleLogResponse,
  fetchPlayerResponse,
  playerProxyUrl,
} from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const dynamic = "force-dynamic"

const DEFAULT_TAG = "Q0YPLVUQ"

async function probe(label: string, fn: () => Promise<Response>) {
  const started = Date.now()
  try {
    const response = await fn()
    let snippet: string | null = null
    try {
      const text = await response.clone().text()
      snippet = text.slice(0, 200)
    } catch {
      snippet = null
    }
    return {
      label,
      ok: response.ok,
      status: response.status,
      ms: Date.now() - started,
      snippet,
    }
  } catch (error) {
    return {
      label,
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawTag = url.searchParams.get("tag") ?? DEFAULT_TAG
  const tag = sanitizePlayerTag(rawTag) ?? DEFAULT_TAG

  const env = {
    PLAYER_API_URL: Boolean(playerProxyUrl()),
    PLAYER_BATTLELOG_API_URL: Boolean(battleLogProxyUrl()),
    CLUB_API_URL: Boolean(clubProxyUrl()),
  }

  const [player, battlelog, club] = await Promise.all([
    probe("player", () => fetchPlayerResponse(tag, { cache: "no-store" })),
    probe("battlelog", () => fetchPlayerBattleLogResponse(tag, { cache: "no-store" })),
    probe("club", async () => {
      const playerResponse = await fetchPlayerResponse(tag, { cache: "no-store" })
      if (!playerResponse.ok) {
        return new Response(JSON.stringify({ error: "player lookup failed" }), { status: playerResponse.status })
      }
      const player = (await playerResponse.json()) as { club?: { tag?: string } }
      const clubTag = player.club?.tag ? sanitizePlayerTag(player.club.tag) : null
      if (!clubTag) {
        return new Response(JSON.stringify({ note: "player has no club" }), { status: 204 })
      }
      return fetchClubResponse(clubTag, { cache: "no-store" })
    }),
  ])

  return NextResponse.json({ tag, env, player, battlelog, club })
}
