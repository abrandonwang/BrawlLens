export interface TierInfo {
  label: string
  color: string
  bg: string
  border: string
}

export function getTierInfo(winRate: number): TierInfo {
  if (winRate >= 58) return { label: "S", color: "#DC2626", bg: "rgba(220,38,38,0.10)", border: "rgba(220,38,38,0.26)" }
  if (winRate >= 54) return { label: "A", color: "#C2410C", bg: "rgba(194,65,12,0.10)", border: "rgba(194,65,12,0.24)" }
  if (winRate >= 50) return { label: "B", color: "#A16207", bg: "rgba(161,98,7,0.10)", border: "rgba(161,98,7,0.24)" }
  if (winRate >= 46) return { label: "C", color: "#2563EB", bg: "rgba(37,99,235,0.10)", border: "rgba(37,99,235,0.24)" }
  return { label: "D", color: "var(--ink-4)", bg: "var(--panel-2)", border: "var(--line)" }
}

export function winRateColor(wr: number): string {
  if (wr >= 55) return "#15803D"
  if (wr >= 50) return "#A16207"
  if (wr >= 45) return "var(--ink-3)"
  return "#DC2626"
}

export function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}
