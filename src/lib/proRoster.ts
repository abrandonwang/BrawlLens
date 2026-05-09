import type { ProBrawlerPick, ProPlayer } from "@/data/proTeams"
import { fetchPlayerBattleLogResponse, fetchPlayerResponse } from "@/lib/playerLookup"

interface PlayerProfile {
  icon?: { id?: number }
  name?: string
  trophies?: number
  "3vs3Victories"?: number
  soloVictories?: number
  duoVictories?: number
  totalPrestigeLevel?: number
  club?: { name?: string; tag?: string }
  brawlers?: PlayerProfileBrawler[]
}

interface PlayerProfileBrawler {
  id: number
  name: string
  trophies: number
}

interface BattleLog {
  items?: BattleLogItem[]
}

interface BattleLogItem {
  battle?: {
    result?: string
  }
}

export async function enrichRosterPlayers(players: ProPlayer[], limit = 6): Promise<ProPlayer[]> {
  return mapWithConcurrency(players, limit, enrichRosterPlayer)
}

async function enrichRosterPlayer(player: ProPlayer): Promise<ProPlayer> {
  if (!player.tag) return player

  try {
    const response = await fetchPlayerResponse(player.tag, { next: { revalidate: 300 } })
    if (!response.ok) return player

    const [profile, recentWinRate] = await Promise.all([
      response.json() as Promise<PlayerProfile>,
      fetchRecentWinRate(player.tag),
    ])
    const topBrawlers = [...(profile.brawlers ?? [])]
      .sort((a, b) => b.trophies - a.trophies)
      .slice(0, 4)
      .map(toBrawlerPick)

    return {
      ...player,
      name: displayName(profile.name ?? player.name),
      iconId: profile.icon?.id ?? player.iconId ?? null,
      trophies: profile.trophies ?? player.trophies,
      wins: getTotalWins(profile) ?? player.wins,
      prestige: profile.totalPrestigeLevel ?? player.prestige,
      recentWinRate,
      clubName: profile.club?.name ?? player.clubName,
      clubTag: profile.club?.tag?.replace(/^#/, "") ?? player.clubTag,
      bestBrawlers: topBrawlers.length ? topBrawlers : player.bestBrawlers,
    }
  } catch {
    return player
  }
}

async function fetchRecentWinRate(tag: string) {
  try {
    const response = await fetchPlayerBattleLogResponse(tag, { next: { revalidate: 300 } })
    if (!response.ok) return null

    const log = (await response.json()) as BattleLog
    const decided = (log.items ?? []).filter(item => item.battle?.result === "victory" || item.battle?.result === "defeat")
    if (!decided.length) return null

    const wins = decided.filter(item => item.battle?.result === "victory").length
    return Math.round((wins / decided.length) * 100)
  } catch {
    return null
  }
}

function getTotalWins(profile: PlayerProfile) {
  const values: Array<number | undefined> = [profile["3vs3Victories"], profile.soloVictories, profile.duoVictories]
  if (values.every(value => typeof value !== "number")) return null
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
}

function toBrawlerPick(brawler: PlayerProfileBrawler): ProBrawlerPick {
  return {
    id: brawler.id,
    name: displayName(brawler.name),
  }
}

export function displayRosterName(value: string) {
  return displayName(value)
}

function displayName(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}| ._'?-]+/gu, "")
    .trim() || value
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length)
  let cursor = 0

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(items[index])
    }
  }))

  return results
}
