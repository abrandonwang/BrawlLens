export const LENSBOARD_COLUMNS = 10
export const LENSBOARD_ROWS = 10

export const LENSBOARD_WIDGET_IDS = [
  "tracked-battles",
  "maps-indexed",
  "top-mode",
  "top-player",
  "top-club",
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

export interface LensboardPanel {
  uid: string
  type: LensboardWidgetId
  x: number
  y: number
  w: number
  h: number
}

export type LensboardSizeOption = { label: string; w: number; h: number }

export const LENSBOARD_PRESET_VARIANTS: Record<LensboardWidgetId, LensboardSizeOption[]> = {
  "tracked-battles": [
    { label: "Compact", w: 1, h: 1 },
    { label: "Wide", w: 2, h: 1 },
    { label: "Card", w: 2, h: 2 },
  ],
  "maps-indexed": [
    { label: "Compact", w: 1, h: 1 },
    { label: "Wide", w: 2, h: 1 },
    { label: "Card", w: 2, h: 2 },
  ],
  "top-mode": [
    { label: "Compact", w: 1, h: 1 },
    { label: "Wide", w: 2, h: 1 },
    { label: "Card", w: 2, h: 2 },
  ],
  "top-player": [
    { label: "Wide", w: 2, h: 1 },
    { label: "Card", w: 2, h: 2 },
  ],
  "top-club": [
    { label: "Wide", w: 2, h: 1 },
    { label: "Card", w: 2, h: 2 },
  ],
  "player-search": [
    { label: "Card", w: 2, h: 2 },
    { label: "Wide", w: 3, h: 2 },
    { label: "Full", w: 3, h: 3 },
  ],
  "meta-tape": [
    { label: "Card", w: 2, h: 2 },
    { label: "Wide", w: 3, h: 2 },
    { label: "Full", w: 3, h: 3 },
  ],
  "live-maps": [
    { label: "Card", w: 2, h: 2 },
    { label: "Wide", w: 3, h: 2 },
    { label: "Full", w: 3, h: 3 },
  ],
  "mode-volume": [
    { label: "Card", w: 2, h: 2 },
    { label: "Wide", w: 3, h: 2 },
    { label: "Full", w: 3, h: 3 },
  ],
  "brawler-signal": [
    { label: "Wide", w: 2, h: 1 },
    { label: "Card", w: 2, h: 2 },
    { label: "Feature", w: 3, h: 2 },
  ],
  "recent-profiles": [
    { label: "Card", w: 2, h: 2 },
    { label: "Tall", w: 2, h: 3 },
  ],
  "ai-reads": [
    { label: "Card", w: 2, h: 2 },
    { label: "Wide", w: 3, h: 2 },
    { label: "Tall", w: 2, h: 3 },
  ],
  signals: [
    { label: "Card", w: 2, h: 2 },
    { label: "Wide", w: 3, h: 2 },
  ],
}

const allowedWidgetIds = new Set<string>(LENSBOARD_WIDGET_IDS)

function isWidgetId(value: unknown): value is LensboardWidgetId {
  return typeof value === "string" && allowedWidgetIds.has(value)
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(number)))
}

function normalizedPresetSize(type: LensboardWidgetId, w: number, h: number) {
  const variants = LENSBOARD_PRESET_VARIANTS[type]
  const exact = variants.find(variant => variant.w === w && variant.h === h)
  if (exact) return exact

  return [...variants].sort((a, b) => {
    const aDistance = Math.abs(a.w - w) + Math.abs(a.h - h) + Math.abs((a.w * a.h) - (w * h)) / 10
    const bDistance = Math.abs(b.w - w) + Math.abs(b.h - h) + Math.abs((b.w * b.h) - (w * h)) / 10
    return aDistance - bDistance
  })[0] ?? { label: "Card", w: 2, h: 2 }
}

function overlaps(a: Pick<LensboardPanel, "x" | "y" | "w" | "h">, b: Pick<LensboardPanel, "x" | "y" | "w" | "h">) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function canPlaceLensboardPanel(
  layout: LensboardPanel[],
  panel: Pick<LensboardPanel, "x" | "y" | "w" | "h">,
  ignoreUid?: string,
) {
  if (panel.x < 0 || panel.y < 0) return false
  if (panel.x + panel.w > LENSBOARD_COLUMNS || panel.y + panel.h > LENSBOARD_ROWS) return false
  return !layout.some(item => item.uid !== ignoreUid && overlaps(item, panel))
}

export function findOpenLensboardSlot(layout: LensboardPanel[], w: number, h: number, ignoreUid?: string) {
  const width = clampInt(w, 1, 3, 2)
  const height = clampInt(h, 1, 3, 2)

  for (let y = 0; y <= LENSBOARD_ROWS - height; y += 1) {
    for (let x = 0; x <= LENSBOARD_COLUMNS - width; x += 1) {
      const candidate = { x, y, w: width, h: height }
      if (canPlaceLensboardPanel(layout, candidate, ignoreUid)) return { x, y }
    }
  }

  return null
}

function buildLayoutFromSeeds(seeds: Array<{ type: LensboardWidgetId; w: number; h: number }>) {
  const layout: LensboardPanel[] = []

  seeds.forEach((seed, index) => {
    const w = clampInt(seed.w, 1, 3, 2)
    const h = clampInt(seed.h, 1, 3, 2)
    const slot = findOpenLensboardSlot(layout, w, h)
    if (!slot) return
    layout.push({
      uid: `${seed.type}-${index + 1}`,
      type: seed.type,
      x: slot.x,
      y: slot.y,
      w,
      h,
    })
  })

  return layout
}

export const DEFAULT_LENSBOARD_LAYOUT: LensboardPanel[] = [
  { uid: "starter-tracked-battles", type: "tracked-battles", x: 0, y: 0, w: 2, h: 1 },
  { uid: "starter-maps-indexed", type: "maps-indexed", x: 2, y: 0, w: 2, h: 1 },
  { uid: "starter-top-mode", type: "top-mode", x: 4, y: 0, w: 2, h: 1 },
  { uid: "starter-top-player", type: "top-player", x: 6, y: 0, w: 2, h: 1 },
  { uid: "starter-top-club", type: "top-club", x: 8, y: 0, w: 2, h: 1 },
  { uid: "starter-player-search", type: "player-search", x: 0, y: 1, w: 3, h: 3 },
  { uid: "starter-meta-tape", type: "meta-tape", x: 3, y: 1, w: 3, h: 3 },
  { uid: "starter-recent-profiles", type: "recent-profiles", x: 6, y: 1, w: 2, h: 3 },
  { uid: "starter-ai-reads", type: "ai-reads", x: 8, y: 1, w: 2, h: 3 },
  { uid: "starter-live-maps", type: "live-maps", x: 0, y: 4, w: 2, h: 2 },
  { uid: "starter-mode-volume", type: "mode-volume", x: 2, y: 4, w: 3, h: 2 },
  { uid: "starter-brawler-signal", type: "brawler-signal", x: 5, y: 4, w: 3, h: 2 },
  { uid: "starter-signals", type: "signals", x: 8, y: 4, w: 2, h: 2 },
]

export const DEFAULT_LENSBOARD_WIDGETS: LensboardWidgetId[] = DEFAULT_LENSBOARD_LAYOUT.map(panel => panel.type)

export function createLensboardPanel(
  layout: LensboardPanel[],
  type: LensboardWidgetId,
  size: { w: number; h: number },
): LensboardPanel | null {
  const normalized = normalizedPresetSize(type, clampInt(size.w, 1, 3, 2), clampInt(size.h, 1, 3, 2))
  const w = normalized.w
  const h = normalized.h
  const slot = findOpenLensboardSlot(layout, w, h)
  if (!slot) return null

  return {
    uid: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x: slot.x,
    y: slot.y,
    w,
    h,
  }
}

export function normalizeLensboardLayout(value: unknown): LensboardPanel[] {
  if (!Array.isArray(value)) return DEFAULT_LENSBOARD_LAYOUT

  if (value.every(isWidgetId)) {
    return buildLayoutFromSeeds(value.map(type => ({ type, w: 2, h: 2 })))
  }

  const layout: LensboardPanel[] = []

  value.forEach((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return
    const raw = item as Record<string, unknown>
    if (!isWidgetId(raw.type)) return

    const normalized = normalizedPresetSize(raw.type, clampInt(raw.w, 1, 3, 2), clampInt(raw.h, 1, 3, 2))
    const w = normalized.w
    const h = normalized.h
    const x = clampInt(raw.x, 0, LENSBOARD_COLUMNS - w, 0)
    const y = clampInt(raw.y, 0, LENSBOARD_ROWS - h, 0)
    const uid = typeof raw.uid === "string" && raw.uid.trim() ? raw.uid : `${raw.type}-${index + 1}`
    const candidate = { uid, type: raw.type, x, y, w, h }
    const slot = canPlaceLensboardPanel(layout, candidate, uid) ? { x, y } : findOpenLensboardSlot(layout, w, h)
    if (!slot) return
    layout.push({ ...candidate, x: slot.x, y: slot.y })
  })

  return layout.length > 0 ? layout : DEFAULT_LENSBOARD_LAYOUT
}

export function normalizeLensboardWidgets(value: unknown): LensboardWidgetId[] {
  return normalizeLensboardLayout(value).map(panel => panel.type)
}
