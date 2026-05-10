const REGION_LABEL_OVERRIDES: Record<string, string> = {
  global: "Global",
  US: "United States",
  JP: "Japan",
  KR: "Korea",
  BR: "Brazil",
  DE: "Germany",
}

const REGION_SHORT_OVERRIDES: Record<string, string> = {
  global: "ALL",
  US: "NA",
  JP: "JP",
  KR: "KR",
  BR: "BR",
  DE: "DE",
}

export type LeaderboardRegion = {
  code: string
  label: string
}

export const FALLBACK_LEADERBOARD_REGIONS: LeaderboardRegion[] = [
  { code: "global", label: "Global" },
  { code: "US", label: "United States" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "Korea" },
  { code: "BR", label: "Brazil" },
  { code: "DE", label: "Germany" },
]

const displayNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null

export function leaderboardRegionLabel(code: string) {
  const normalized = code === "global" ? "global" : code.toUpperCase()
  return REGION_LABEL_OVERRIDES[normalized] ?? displayNames?.of(normalized) ?? normalized
}

export function leaderboardRegionShort(code: string) {
  const normalized = code === "global" ? "global" : code.toUpperCase()
  return REGION_SHORT_OVERRIDES[normalized] ?? normalized.slice(0, 2).toUpperCase()
}

export function sortLeaderboardRegions<T extends { code: string }>(regions: T[]) {
  const priority = new Map([
    ["global", 0],
    ["US", 1],
    ["JP", 2],
    ["KR", 3],
  ])

  return [...regions].sort((a, b) => {
    const aKey = a.code === "global" ? "global" : a.code.toUpperCase()
    const bKey = b.code === "global" ? "global" : b.code.toUpperCase()
    const aPriority = priority.get(aKey) ?? 20
    const bPriority = priority.get(bKey) ?? 20
    if (aPriority !== bPriority) return aPriority - bPriority
    return leaderboardRegionLabel(aKey).localeCompare(leaderboardRegionLabel(bKey))
  })
}

export function leaderboardRegionsFromCodes(codes: Iterable<string>): LeaderboardRegion[] {
  const uniqueCodes = Array.from(new Set(Array.from(codes).map(code => String(code)).filter(Boolean)))
  if (!uniqueCodes.length) return FALLBACK_LEADERBOARD_REGIONS
  return sortLeaderboardRegions(uniqueCodes.map(code => ({ code, label: leaderboardRegionLabel(code) })))
}
