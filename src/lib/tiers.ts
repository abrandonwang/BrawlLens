export interface TierInfo {
  label: string
  color: string
  bg: string
  border: string
}

export function getTierInfo(winRate: number): TierInfo {
  if (winRate >= 58) return { label: "S", color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" }
  if (winRate >= 54) return { label: "A", color: "#FB923C", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" }
  if (winRate >= 50) return { label: "B", color: "#FACC15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" }
  if (winRate >= 46) return { label: "C", color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" }
  return { label: "D", color: "var(--ink-4)", bg: "var(--panel-2)", border: "var(--line)" }
}

export function winRateColor(wr: number): string {
  if (wr >= 55) return "#49D47E"
  if (wr >= 50) return "#FACC15"
  if (wr >= 45) return "var(--ink-3)"
  return "#F87171"
}

export function getBarWidth(winRate: number): number {
  return Math.max(0, Math.min(100, ((winRate - 30) / 40) * 100))
}
