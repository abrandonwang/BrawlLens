export const LENSBOARD_WIDGET_IDS = [
  "player-search",
  "meta-tape",
  "live-maps",
  "mode-volume",
  "brawler-signal",
  "recent-profiles",
  "ai-reads",
  "signals",
] as const

export type LensboardWidgetId = typeof LENSBOARD_WIDGET_IDS[number]

export const DEFAULT_LENSBOARD_WIDGETS: LensboardWidgetId[] = [
  "player-search",
  "meta-tape",
  "live-maps",
  "mode-volume",
  "brawler-signal",
  "ai-reads",
]

export function normalizeLensboardWidgets(value: unknown): LensboardWidgetId[] {
  if (!Array.isArray(value)) return DEFAULT_LENSBOARD_WIDGETS

  const allowed = new Set<string>(LENSBOARD_WIDGET_IDS)
  const seen = new Set<string>()
  const widgets = value.filter((item): item is LensboardWidgetId => {
    if (typeof item !== "string" || !allowed.has(item) || seen.has(item)) return false
    seen.add(item)
    return true
  })

  return widgets.length > 0 ? widgets : DEFAULT_LENSBOARD_WIDGETS
}
