export function stripTagPrefix(tag: string): string {
  return tag.replace(/^#/, "")
}

export function leaderboardTagKey(tag: string): string {
  return stripTagPrefix(tag).toUpperCase()
}

export function playerProfileHref(tag: string): string {
  return `/player/${encodeURIComponent(stripTagPrefix(tag))}`
}

export function clubDetailHref(tag: string): string {
  return `/leaderboards/clubs/${encodeURIComponent(leaderboardTagKey(tag))}`
}

export function profileIconUrl(id: number): string {
  return `https://cdn.brawlify.com/profile-icons/regular/${id}.png`
}

export function clubBadgeUrl(id: number): string {
  return `https://cdn.brawlify.com/club-badges/regular/${id}.png`
}

export function firstGlyph(value: string): string {
  return Array.from(value.trim())[0]?.toUpperCase() || "?"
}

export function formatPlainNumber(value: number | null | undefined): string {
  return typeof value === "number" ? value.toLocaleString("en-US") : "--"
}

export function formatLeaderboardRank(value: number | null | undefined): string {
  return typeof value === "number" ? `#${value}` : "--"
}
