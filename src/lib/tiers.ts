export interface TierInfo {
  label: string
  color: string
  bg: string
  border: string
}

export function getTierInfo(winRate: number): TierInfo {
  if (winRate >= 58) return { label: "S", color: "#ff6b6b", bg: "rgba(255,107,107,0.16)", border: "rgba(255,107,107,0.38)" }
  if (winRate >= 54) return { label: "A", color: "#fbbf24", bg: "rgba(251,191,36,0.16)", border: "rgba(251,191,36,0.34)" }
  if (winRate >= 50) return { label: "B", color: "#4ade80", bg: "rgba(74,222,128,0.15)", border: "rgba(74,222,128,0.34)" }
  if (winRate >= 46) return { label: "C", color: "#38bdf8", bg: "rgba(56,189,248,0.14)", border: "rgba(56,189,248,0.30)" }
  return { label: "D", color: "var(--ink-4)", bg: "var(--panel-2)", border: "var(--line)" }
}

export function winRateColor(wr: number): string {
  if (wr >= 55) return "#4ade80"
  if (wr >= 50) return "#facc15"
  if (wr >= 45) return "var(--ink-3)"
  return "#ff6b6b"
}

export function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}
