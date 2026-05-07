"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react"
import { ArrowUpRight, ChevronDown, RotateCcw } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { SkeletonBlock } from "@/components/PolishStates"
import { authHeaders } from "@/lib/clientAuth"
import { formatBrawlerName, formatNum, formatTrophies } from "@/lib/format"
import {
  canPlaceLensboardPanel,
  createLensboardPanel,
  DEFAULT_LENSBOARD_LAYOUT,
  LENSBOARD_COLUMNS,
  LENSBOARD_PRESET_VARIANTS,
  LENSBOARD_ROWS,
  LENSBOARD_WIDGET_IDS,
  normalizeLensboardLayout,
  type LensboardPanel,
  type LensboardWidgetId,
} from "@/lib/lensboard"
import { getModeName } from "@/lib/modes"
import { sanitizePlayerTag } from "@/lib/validation"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map: { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
  club: { name: string; tag: string; trophies: number } | null
}

interface ModeInfo {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

interface TopBrawler {
  id: number
  name: string
  winRate: number
  picks: number
  score: number
  consistency: number
  bestMap: { name: string; mode: string; winRate: number } | null
}

interface RecentPlayer {
  tag: string
  viewedAt: number
}

type PresetCategory = "Stats" | "Meta" | "Players" | "AI"
type DashboardClientProps = {
  setupMode?: boolean
  editable?: boolean
  showIntro?: boolean
}

type DragState = {
  uid: string
  origin: { x: number; y: number }
  candidate: { x: number; y: number }
  overBoard: boolean
  valid: boolean
}

const RECENTS_KEY = "brawllens_recent_players"

const widgetInfo: Record<LensboardWidgetId, { title: string; description: string; category: PresetCategory }> = {
  "tracked-battles": { title: "Tracked battles", description: "Total battle volume", category: "Stats" },
  "maps-indexed": { title: "Maps indexed", description: "Unique layouts tracked", category: "Stats" },
  "top-mode": { title: "Top mode", description: "Highest-volume mode", category: "Stats" },
  "top-player": { title: "Top player", description: "Current global leader", category: "Stats" },
  "top-club": { title: "Top club", description: "Current club leader", category: "Stats" },
  "player-search": { title: "Profile search", description: "Open player tags", category: "Players" },
  "meta-tape": { title: "Meta tape", description: "Popular map list", category: "Meta" },
  "live-maps": { title: "Live maps", description: "Current map cards", category: "Meta" },
  "mode-volume": { title: "Mode volume", description: "Battle share bars", category: "Meta" },
  "brawler-signal": { title: "Brawler signal", description: "Best brawler read", category: "Meta" },
  "recent-profiles": { title: "Recent profiles", description: "Local lookup history", category: "Players" },
  "ai-reads": { title: "AI reads", description: "Prompt shortcuts", category: "AI" },
  signals: { title: "Signals", description: "Fast meta notes", category: "Meta" },
}

const presetGroups: PresetCategory[] = ["Stats", "Meta", "Players", "AI"]
const metricPanelIds = new Set<LensboardWidgetId>(["tracked-battles", "maps-indexed", "top-mode", "top-player", "top-club"])

function openAssistant(query: string) {
  window.dispatchEvent(new CustomEvent("brawllens:open-assistant", { detail: { query } }))
}

function openLoginModal() {
  window.dispatchEvent(new CustomEvent("brawllens:open-login", { detail: { mode: "login" } }))
}

function pct(part: number, total: number) {
  if (total <= 0) return "0%"
  return `${Math.round((part / total) * 100)}%`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) return fallback
    return await response.json() as T
  } catch {
    return fallback
  }
}

function WidgetFrame({
  panel,
  children,
  editable,
  preview = false,
  dragging = false,
  dragInvalid = false,
  dragDeleting = false,
  onDragStart,
}: {
  panel: LensboardPanel
  children: ReactNode
  editable: boolean
  preview?: boolean
  dragging?: boolean
  dragInvalid?: boolean
  dragDeleting?: boolean
  onDragStart?: (panel: LensboardPanel, event: ReactPointerEvent<HTMLElement>) => void
}) {
  const info = widgetInfo[panel.type]
  const short = panel.h === 1
  const tiny = panel.w === 1 || short
  const hideContentOnSmallBoard = editable && !preview && !metricPanelIds.has(panel.type)
  const panelStyle = {
    "--panel-grid-column": `${panel.x + 1} / span ${panel.w}`,
    "--panel-grid-row": `${panel.y + 1} / span ${panel.h}`,
  } as CSSProperties

  return (
    <article
      onPointerDown={editable ? event => onDragStart?.(panel, event) : undefined}
      className={`group relative min-w-0 overflow-hidden rounded-[10px] border border-[var(--line)] bg-[var(--panel)] [grid-column:var(--panel-grid-column)] [grid-row:var(--panel-grid-row)] transition-[border-color,background-color,box-shadow,opacity] hover:border-[var(--line-2)] max-md:rounded-md ${preview ? "bg-[color-mix(in_srgb,var(--panel)_88%,var(--panel-2))]" : ""} ${editable ? "cursor-grab touch-none select-none active:cursor-grabbing" : ""} ${dragging ? "z-30 cursor-grabbing border-[var(--line-2)] bg-[var(--panel)] shadow-[0_18px_44px_-32px_rgba(0,0,0,0.75)]" : ""} ${dragInvalid ? "border-[var(--loss-line)] bg-[color-mix(in_srgb,var(--loss)_8%,var(--panel))]" : ""} ${dragDeleting ? "opacity-70 ring-1 ring-[rgba(185,28,28,0.28)]" : ""} ${!editable ? "max-md:[grid-column:auto] max-md:[grid-row:auto]" : ""}`}
      style={panelStyle}
    >
      <div className={`flex h-full min-h-0 flex-col ${preview ? "p-3 max-md:p-1.5" : short ? "p-3" : tiny ? "p-3.5" : "p-4"}`}>
        <div className={`${short ? "mb-1.5" : tiny ? "mb-2" : "mb-4"} min-w-0 max-md:mb-1`}>
          <h2 className={`m-0 truncate font-semibold tracking-[-0.018em] text-[var(--ink)] ${preview ? "text-[12px] max-md:text-[9px] max-md:leading-none" : short ? "text-[12.5px]" : tiny ? "text-[13px]" : "text-[17px]"}`}>{info.title}</h2>
          {!tiny && <p className={`mt-0.5 mb-0 truncate text-[12px] text-[var(--ink-4)] ${preview ? "max-md:hidden" : ""}`}>{info.description}</p>}
        </div>
        <div className={`min-h-0 flex-1 ${preview ? "overflow-hidden" : "overflow-visible"} ${hideContentOnSmallBoard ? "max-md:hidden" : ""}`}>
          {children}
        </div>
      </div>
    </article>
  )
}

export default function DashboardClient({ setupMode = false, editable = false, showIntro = true }: DashboardClientProps) {
  const router = useRouter()
  const boardGridRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const [lookup, setLookup] = useState("")
  const [landing, setLanding] = useState<LandingData | null>(null)
  const [modes, setModes] = useState<ModeInfo[]>([])
  const [topBrawler, setTopBrawler] = useState<TopBrawler | null>(null)
  const [recentPlayers, setRecentPlayers] = useState<RecentPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState<LensboardPanel[]>(DEFAULT_LENSBOARD_LAYOUT)
  const [placementNotice, setPlacementNotice] = useState("")
  const [activePresetGroup, setActivePresetGroup] = useState<PresetCategory>("Stats")
  const [openPreset, setOpenPreset] = useState<LensboardWidgetId | null>("tracked-battles")
  const [savingBoard, setSavingBoard] = useState(false)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const playerTag = sanitizePlayerTag(lookup)
  const invalidLookup = lookup.trim().length > 0 && !playerTag

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]") as RecentPlayer[]
      setRecentPlayers(parsed.filter(item => sanitizePlayerTag(item.tag)).slice(0, 5))
    } catch {
      setRecentPlayers([])
    }
  }, [])

  useEffect(() => {
    let active = true

    fetch("/api/account/lensboard", {
      headers: authHeaders(),
      cache: "no-store",
    })
      .then(response => response.ok ? response.json() : null)
      .then(payload => {
        if (active && payload?.layout) {
          setLayout(normalizeLensboardLayout(payload.layout))
        }
      })
      .catch(() => null)
      .finally(() => {
        if (active) {
          setLayout(current => normalizeLensboardLayout(current))
        }
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    Promise.all([
      fetchJson<LandingData | null>("/api/landing", null),
      fetchJson<{ modes?: ModeInfo[] }>("/api/meta", { modes: [] }),
      fetchJson<{ brawler?: TopBrawler | null }>("/api/brawlers/top", { brawler: null }),
    ])
      .then(([landingData, metaData, topData]) => {
        if (!active) return
        setLanding(landingData)
        setModes((metaData?.modes ?? []).filter((m: ModeInfo) => m.mode.toLowerCase() !== "unknown"))
        setTopBrawler(topData?.brawler ?? null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const totalBattles = useMemo(() => modes.reduce((sum, mode) => sum + mode.totalBattles, 0), [modes])
  const totalMaps = useMemo(() => {
    const names = new Set<string>()
    modes.forEach(mode => mode.maps.forEach(map => names.add(map.name)))
    return names.size
  }, [modes])
  const topMode = modes[0] ?? null

  const topMaps = useMemo(() => {
    return modes
      .flatMap(mode => mode.maps.map(map => ({ ...map, mode: mode.mode })))
      .sort((a, b) => b.battles - a.battles)
      .slice(0, 8)
  }, [modes])

  const liveMaps = useMemo(() => topMaps.slice(0, 6), [topMaps])

  const metaSignals = useMemo(() => {
    const signals: { label: string; value: string; href: string }[] = []
    if (topMode) {
      signals.push({
        label: "Highest volume mode",
        value: `${getModeName(topMode.mode)} owns ${pct(topMode.totalBattles, totalBattles)}`,
        href: "/meta",
      })
    }
    if (topMaps[0]) {
      signals.push({
        label: "Most active map",
        value: `${topMaps[0].name} leads with ${formatNum(topMaps[0].battles)}`,
        href: `/meta?open=${encodeURIComponent(topMaps[0].name)}`,
      })
    }
    if (topBrawler) {
      signals.push({
        label: "Brawler signal",
        value: `${formatBrawlerName(topBrawler.name)} scores ${topBrawler.score.toFixed(1)}`,
        href: `/brawlers?open=${topBrawler.id}`,
      })
    }
    return signals
  }, [topMode, topMaps, totalBattles, topBrawler])

  const topPlayerHref = landing?.player ? `/player/${encodeURIComponent(landing.player.tag.replace(/^#/, ""))}` : "/leaderboards/players"
  const brawlerForCard = topBrawler
    ? { id: topBrawler.id, name: topBrawler.name, winRate: topBrawler.winRate, picks: topBrawler.picks, score: topBrawler.score, bestMap: topBrawler.bestMap }
    : landing?.brawler
      ? { id: landing.brawler.id, name: landing.brawler.name, winRate: landing.brawler.winRate, picks: null, score: null, bestMap: null }
      : null

  const metricValues: Record<LensboardWidgetId, { value: string | null; detail: string; href?: string }> = {
    "tracked-battles": { value: loading ? null : formatNum(totalBattles), detail: "tracked battles", href: "/meta" },
    "maps-indexed": { value: loading ? null : String(totalMaps), detail: "maps indexed", href: "/meta" },
    "top-mode": { value: loading ? null : topMode ? getModeName(topMode.mode) : "-", detail: "highest volume", href: "/meta" },
    "top-player": { value: loading ? null : landing?.player ? landing.player.name : "-", detail: landing?.player ? `${formatTrophies(landing.player.trophies)} trophies` : "global leader", href: topPlayerHref },
    "top-club": { value: loading ? null : landing?.club ? landing.club.name : "-", detail: landing?.club ? `${formatTrophies(landing.club.trophies)} trophies` : "club leader", href: "/leaderboards/clubs" },
    "player-search": { value: "-", detail: "" },
    "meta-tape": { value: "-", detail: "" },
    "live-maps": { value: "-", detail: "" },
    "mode-volume": { value: "-", detail: "" },
    "brawler-signal": { value: "-", detail: "" },
    "recent-profiles": { value: "-", detail: "" },
    "ai-reads": { value: "-", detail: "" },
    signals: { value: "-", detail: "" },
  }

  function submitLookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!playerTag) return
    const nextRecent = [
      { tag: playerTag, viewedAt: Date.now() },
      ...recentPlayers.filter(item => item.tag !== playerTag),
    ].slice(0, 6)
    try {
      localStorage.setItem(RECENTS_KEY, JSON.stringify(nextRecent))
    } catch {
      // Recents are a convenience; navigation should never depend on storage.
    }
    router.push(`/player/${encodeURIComponent(playerTag)}`)
  }

  function addPanel(type: LensboardWidgetId, size: { w: number; h: number; label: string }) {
    const panel = createLensboardPanel(layout, type, size)
    if (!panel) {
      setPlacementNotice(`No open ${size.label} space left.`)
      return
    }

    setLayout(current => [...current, panel])
    setPlacementNotice(`${widgetInfo[type].title} added as ${size.label.toLowerCase()}.`)
  }

  function resetBoard() {
    setLayout(DEFAULT_LENSBOARD_LAYOUT)
    setPlacementNotice("Lensboard reset.")
  }

  function updateDragState(next: DragState | null) {
    dragStateRef.current = next
    setDragState(next)
  }

  function getDragTarget(
    panel: LensboardPanel,
    layoutSnapshot: LensboardPanel[],
    offset: { x: number; y: number },
    pointer: { x: number; y: number },
  ): DragState {
    const board = boardGridRef.current
    if (!board) {
      return {
        uid: panel.uid,
        origin: { x: panel.x, y: panel.y },
        candidate: { x: panel.x, y: panel.y },
        overBoard: true,
        valid: true,
      }
    }

    const rect = board.getBoundingClientRect()
    const styles = window.getComputedStyle(board)
    const columnGap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0
    const rowGap = Number.parseFloat(styles.rowGap || styles.gap || "0") || 0
    const cellWidth = (rect.width - columnGap * (LENSBOARD_COLUMNS - 1)) / LENSBOARD_COLUMNS
    const cellHeight = (rect.height - rowGap * (LENSBOARD_ROWS - 1)) / LENSBOARD_ROWS
    const stepX = cellWidth + columnGap
    const stepY = cellHeight + rowGap
    const overBoard = pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom
    const rawX = Math.round((pointer.x - offset.x - rect.left) / stepX)
    const rawY = Math.round((pointer.y - offset.y - rect.top) / stepY)
    const x = clamp(rawX, 0, LENSBOARD_COLUMNS - panel.w)
    const y = clamp(rawY, 0, LENSBOARD_ROWS - panel.h)
    const candidate = { ...panel, x, y }

    return {
      uid: panel.uid,
      origin: { x: panel.x, y: panel.y },
      candidate: { x, y },
      overBoard,
      valid: overBoard && canPlaceLensboardPanel(layoutSnapshot, candidate, panel.uid),
    }
  }

  function startPanelDrag(panel: LensboardPanel, event: ReactPointerEvent<HTMLElement>) {
    if (!editable || event.button !== 0) return

    event.preventDefault()
    const panelRect = event.currentTarget.getBoundingClientRect()
    const offset = {
      x: event.clientX - panelRect.left,
      y: event.clientY - panelRect.top,
    }
    const layoutSnapshot = layout
    const initialDrag: DragState = {
      uid: panel.uid,
      origin: { x: panel.x, y: panel.y },
      candidate: { x: panel.x, y: panel.y },
      overBoard: true,
      valid: true,
    }

    updateDragState(initialDrag)
    setPlacementNotice("Drop outside the board to remove.")

    function onPointerMove(moveEvent: PointerEvent) {
      moveEvent.preventDefault()
      updateDragState(getDragTarget(panel, layoutSnapshot, offset, { x: moveEvent.clientX, y: moveEvent.clientY }))
    }

    function finishDrag() {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)

      const finalDrag = dragStateRef.current
      updateDragState(null)
      if (!finalDrag) return

      if (!finalDrag.overBoard) {
        setLayout(current => current.filter(item => item.uid !== finalDrag.uid))
        setPlacementNotice(`${widgetInfo[panel.type].title} removed.`)
        return
      }

      if (!finalDrag.valid) {
        setPlacementNotice("That space is occupied.")
        return
      }

      setLayout(current => {
        const currentPanel = current.find(item => item.uid === finalDrag.uid)
        if (!currentPanel) return current
        const candidate = { ...currentPanel, x: finalDrag.candidate.x, y: finalDrag.candidate.y }
        if (!canPlaceLensboardPanel(current, candidate, finalDrag.uid)) return current
        return current.map(item => item.uid === finalDrag.uid ? candidate : item)
      })
      setPlacementNotice("")
    }

    function onPointerUp(upEvent: PointerEvent) {
      upEvent.preventDefault()
      finishDrag()
    }

    function onPointerCancel() {
      updateDragState(null)
      setPlacementNotice("")
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)
    }

    window.addEventListener("pointermove", onPointerMove, { passive: false })
    window.addEventListener("pointerup", onPointerUp, { passive: false })
    window.addEventListener("pointercancel", onPointerCancel)
  }

  async function saveBoardAndExit() {
    setSavingBoard(true)
    setPlacementNotice("")

    try {
      const sessionResponse = await fetch("/api/auth/me", {
        headers: authHeaders(),
        cache: "no-store",
      })
      const sessionPayload = await sessionResponse.json().catch(() => null) as { user?: unknown } | null
      if (!sessionResponse.ok || !sessionPayload?.user) {
        openLoginModal()
        setPlacementNotice("Log in to save this Lensboard.")
        return
      }

      const headers = new Headers(authHeaders())
      headers.set("Content-Type", "application/json")
      const response = await fetch("/api/account/lensboard", {
        method: "POST",
        headers,
        body: JSON.stringify({ layout }),
      })
      if (response.status === 401) {
        openLoginModal()
        setPlacementNotice("Log in to save this Lensboard.")
        return
      }
      if (!response.ok) {
        setPlacementNotice("Could not save. Try again.")
        return
      }

      router.push("/")
    } catch {
      setPlacementNotice("Could not save. Try again.")
    } finally {
      setSavingBoard(false)
    }
  }

  function renderMetricPanel(panel: LensboardPanel) {
    const metric = metricValues[panel.type]
    const compact = panel.w === 1 || panel.h === 1
    const short = panel.h === 1
    const content = (
      <div className={`group/metric relative flex h-full min-h-0 ${short ? "items-end justify-between gap-2" : "flex-col justify-end"}`}>
        {metric.value === null ? (
          <SkeletonBlock className={`${short ? "h-6" : "h-8"} w-full`} />
        ) : (
          <>
            <div className="min-w-0">
              <div className={`truncate font-semibold tracking-[-0.03em] text-[var(--ink)] ${short ? "text-[clamp(18px,2vw,24px)] leading-none" : compact ? "text-[22px] leading-tight" : "text-[clamp(24px,4vw,34px)] leading-none"}`}>{metric.value}</div>
              {!short && <div className="mt-1 truncate text-[12px] text-[var(--ink-4)] max-md:hidden">{metric.detail}</div>}
            </div>
            {metric.href && (
              <ArrowUpRight
                size={short ? 14 : 16}
                strokeWidth={1.8}
                className={`shrink-0 text-[var(--ink-4)] transition-all duration-200 group-hover/metric:text-[var(--ink)] group-hover/metric:-translate-y-[1px] group-hover/metric:translate-x-[1px] ${short ? "self-end" : "absolute right-0 top-0"}`}
              />
            )}
          </>
        )}
      </div>
    )

    if (!metric.href) return content
    return <Link href={metric.href} className="block h-full min-h-0 text-inherit no-underline">{content}</Link>
  }

  function renderPanelContent(panel: LensboardPanel) {
    const compact = panel.w === 1 || panel.h === 1

    if (metricPanelIds.has(panel.type)) return renderMetricPanel(panel)

    if (panel.type === "player-search") {
      return (
        <div className="flex h-full min-h-0 flex-col justify-between gap-3">
          <div className="min-w-0">
            {!compact && (
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--ink-2)]">
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
                Profile lookup
              </div>
            )}
            {!compact && <h3 className="m-0 text-[clamp(22px,4vw,30px)] font-semibold leading-[1.02] tracking-[-0.028em] text-[var(--ink)]">Open a player profile.</h3>}
            {!compact && <p className="mt-2 mb-4 line-clamp-2 text-[13px] leading-[1.45] text-[var(--ink-3)]">Pull trophy context, brawler depth, readiness signals, and AI notes from a player tag.</p>}
            <form onSubmit={submitLookup} className={`flex ${compact ? "h-10" : "h-12"} items-center gap-2 rounded-lg border bg-[var(--bg)] px-3 transition-colors ${invalidLookup ? "border-[var(--loss-line)]" : "border-[var(--line)] focus-within:border-[var(--line-2)] focus-within:shadow-[var(--shadow-lift)]"}`}>
              <span aria-hidden className="font-mono text-[12px] font-medium text-[var(--ink-4)]">#</span>
              <input
                value={lookup}
                onChange={e => setLookup(e.target.value)}
                placeholder={compact ? "YP90U0YL" : "Player tag"}
                className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[15px] font-medium tracking-[0] text-[var(--ink)] outline-none placeholder:font-sans placeholder:font-medium placeholder:tracking-[-0.015em] placeholder:text-[var(--ink-4)]"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" disabled={!playerTag} className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border-0 bg-[var(--ink)] text-[var(--bg)] shadow-[var(--shadow-lift)] transition-all hover:opacity-90 active:scale-95 disabled:cursor-default disabled:opacity-35" aria-label="Open player">
                <span className="text-[12px] font-semibold">{">"}</span>
              </button>
            </form>
            {!compact && (
              <div className={`mt-2 min-h-5 text-[12px] ${invalidLookup ? "text-[var(--loss)]" : "text-[var(--ink-4)]"}`}>
                {invalidLookup ? "That does not look like a valid player tag." : "Tags work with or without #."}
              </div>
            )}
          </div>

          {!compact && panel.h >= 3 && (
            <div className="grid grid-cols-2 gap-2">
              <Link href={topPlayerHref} className="group/leader min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)]">
                <div className="mb-2 truncate text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-4)]">Global leader</div>
                {loading ? <SkeletonBlock className="h-[38px] w-full" /> : (
                  <>
                    <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">{landing?.player?.name ?? "Open rankings"}</div>
                    <div className="mt-1 font-mono text-[11.5px] tabular-nums text-[var(--ink-3)]">{landing?.player ? `${formatTrophies(landing.player.trophies)} trophies` : "Top players"}</div>
                  </>
                )}
              </Link>
              <Link href="/leaderboards/clubs" className="group/leader min-w-0 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)]">
                <div className="mb-2 truncate text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-4)]">Top club</div>
                {loading ? <SkeletonBlock className="h-[38px] w-full" /> : (
                  <>
                    <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]">{landing?.club?.name ?? "Open clubs"}</div>
                    <div className="mt-1 font-mono text-[11.5px] tabular-nums text-[var(--ink-3)]">{landing?.club ? `${formatTrophies(landing.club.trophies)} trophies` : "Club rankings"}</div>
                  </>
                )}
              </Link>
            </div>
          )}
        </div>
      )
    }

    if (panel.type === "meta-tape") {
      const limit = panel.h === 1 ? 2 : panel.h === 2 ? 4 : 6
      const visible = topMaps.slice(0, limit)
      const peakBattles = visible[0]?.battles ?? 0
      return (
        <div className="grid h-full min-h-0 content-start gap-1.5 overflow-hidden">
          {loading ? (
            Array.from({ length: limit }).map((_, index) => <SkeletonBlock key={index} className="h-[40px] w-full" />)
          ) : visible.length > 0 ? (
            visible.map((map, index) => {
              const share = peakBattles > 0 ? (map.battles / peakBattles) * 100 : 0
              return (
                <Link key={`${map.mode}-${map.name}`} href={`/meta?open=${encodeURIComponent(map.name)}`} className="group/row relative grid min-h-[40px] grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2.5 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1.5 text-inherit no-underline transition-colors hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)]">
                  <span aria-hidden className="absolute inset-y-0 left-0 origin-left bg-[var(--accent-soft)] transition-[width] duration-300" style={{ width: `${share}%` }} />
                  <span className="relative font-mono text-[10.5px] tabular-nums text-[var(--ink-4)]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="relative min-w-0">
                    <span className="block truncate text-[12.5px] font-semibold tracking-[-0.005em] text-[var(--ink)]">{map.name}</span>
                    <span className="mt-0.5 block truncate text-[10.5px] font-medium uppercase tracking-[0.04em] text-[var(--ink-4)]">{getModeName(map.mode)}</span>
                  </span>
                  <span className="relative font-mono text-[11.5px] tabular-nums font-medium text-[var(--ink-2)]">{formatNum(map.battles)}</span>
                </Link>
              )
            })
          ) : (
            <p className="m-0 rounded-md border border-dashed border-[var(--line)] p-4 text-center text-[13px] text-[var(--ink-4)]">No map data.</p>
          )}
        </div>
      )
    }

    if (panel.type === "live-maps") {
      const count = panel.h === 1 ? 2 : panel.h === 2 ? 4 : 6
      return (
        <div className={`grid h-full min-h-0 gap-2 overflow-hidden ${panel.w >= 3 ? "grid-cols-2" : "grid-cols-1"}`}>
          {loading ? (
            Array.from({ length: count }).map((_, index) => <SkeletonBlock key={index} className="h-full min-h-[48px] w-full" />)
          ) : liveMaps.length > 0 ? liveMaps.slice(0, count).map((map, index) => (
            <Link
              key={`${map.mode}-${map.name}-${index}`}
              href={`/meta?open=${encodeURIComponent(map.name)}`}
              className="group/cell flex min-h-0 flex-col justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-2.5 text-inherit no-underline transition-colors hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)]"
            >
              <div className="flex items-center gap-1.5">
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--ink-3)] transition-colors group-hover/cell:bg-[var(--ink)]" />
                <span className="truncate text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--ink-4)]">{getModeName(map.mode)}</span>
              </div>
              <div className="line-clamp-2 text-[12.5px] font-semibold leading-[1.2] tracking-[-0.005em] text-[var(--ink)]">{map.name}</div>
            </Link>
          )) : (
            <div className="col-span-full rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[12.5px] leading-[1.45] text-[var(--ink-4)]">No live map data.</div>
          )}
        </div>
      )
    }

    if (panel.type === "mode-volume") {
      const count = panel.h === 1 ? 2 : panel.h === 2 ? 4 : 5
      return (
        <div className="grid h-full min-h-0 content-start gap-3 overflow-hidden">
          {loading ? (
            Array.from({ length: count }).map((_, index) => <SkeletonBlock key={index} className="h-[30px] w-full" />)
          ) : modes.length > 0 ? modes.slice(0, count).map((mode, index) => {
            const share = totalBattles > 0 ? (mode.totalBattles / totalBattles) * 100 : 0
            const isLeader = index === 0
            return (
              <div key={mode.mode}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className={`truncate text-[12.5px] font-semibold tracking-[-0.005em] ${isLeader ? "text-[var(--ink)]" : "text-[var(--ink-2)]"}`}>{getModeName(mode.mode)}</span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums font-medium text-[var(--ink-3)]">{pct(mode.totalBattles, totalBattles)}</span>
                </div>
                <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${isLeader ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent-line)]" : "bg-[var(--ink-2)]/45"}`}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            )
          }) : (
            <div className="rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[12.5px] leading-[1.45] text-[var(--ink-4)]">No mode data.</div>
          )}
        </div>
      )
    }

    if (panel.type === "brawler-signal") {
      return (
        <div className="h-full min-h-0">
          {loading ? <SkeletonBlock className="h-full w-full" /> : brawlerForCard ? (
            <Link href={`/brawlers?open=${brawlerForCard.id}`} className="flex h-full min-h-0 flex-col justify-between text-inherit no-underline">
              <div className={`flex min-w-0 items-center gap-3 ${compact ? "items-end" : ""}`}>
                {!compact && <BrawlImage src={brawlerIconUrl(brawlerForCard.id)} alt={brawlerForCard.name} width={64} height={64} className="size-16 shrink-0 object-contain" sizes="64px" />}
                <div className="min-w-0">
                  <div className="truncate text-[clamp(18px,3vw,24px)] font-semibold tracking-[-0.024em] text-[var(--ink)]">{formatBrawlerName(brawlerForCard.name)}</div>
                  <div className="mt-1 text-[12px] text-[var(--ink-3)]">{brawlerForCard.winRate.toFixed(1)}% win rate</div>
                </div>
              </div>
              {!compact && panel.h >= 2 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3">
                    <div className="text-[11px] text-[var(--ink-4)]">Score</div>
                    <div className="mt-1 text-[17px] font-semibold text-[var(--ink)]">{brawlerForCard.score ? brawlerForCard.score.toFixed(1) : "-"}</div>
                  </div>
                  <div className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3">
                    <div className="text-[11px] text-[var(--ink-4)]">Picks</div>
                    <div className="mt-1 text-[17px] font-semibold text-[var(--ink)]">{brawlerForCard.picks ? formatNum(brawlerForCard.picks) : "-"}</div>
                  </div>
                </div>
              )}
            </Link>
          ) : <p className="m-0 text-[13px] text-[var(--ink-4)]">No brawler highlight.</p>}
        </div>
      )
    }

    if (panel.type === "recent-profiles") {
      const limit = panel.h === 1 ? 2 : panel.h === 2 ? 4 : 5
      return recentPlayers.length > 0 ? (
        <div className="grid h-full min-h-0 content-start gap-1.5 overflow-hidden">
          {recentPlayers.slice(0, limit).map(player => (
            <Link
              key={player.tag}
              href={`/player/${encodeURIComponent(player.tag)}`}
              className="group/profile flex min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-2 text-inherit no-underline transition-colors hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)]"
            >
              <span className="min-w-0 truncate font-mono text-[12px] font-semibold tracking-[-0.005em] text-[var(--ink)]">#{player.tag}</span>
              <ArrowUpRight size={12} strokeWidth={1.8} className="shrink-0 text-[var(--ink-4)] transition-all duration-200 group-hover/profile:text-[var(--ink)] group-hover/profile:-translate-y-[1px] group-hover/profile:translate-x-[1px]" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex h-full min-h-0 items-center justify-center rounded-md border border-dashed border-[var(--line)] px-4 py-6 text-center text-[12.5px] leading-[1.45] text-[var(--ink-4)]">Opened profiles appear here.</div>
      )
    }

    if (panel.type === "ai-reads") {
      const prompts = [
        "What changed in the meta today?",
        "Which maps should I focus on?",
        "Summarize strongest brawler signals.",
        "What should I track next?",
      ]
      const limit = panel.h === 1 ? 1 : panel.h === 2 ? 3 : 4
      return (
        <div className="grid h-full min-h-0 content-start gap-2 overflow-hidden">
          {prompts.slice(0, limit).map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => openAssistant(prompt)}
              title={compact ? "Ask AI" : prompt}
              className="group/ai flex min-h-9 w-full min-w-0 cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 text-left text-[12px] leading-none text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)]"
            >
              <span className="block min-w-0 flex-1 truncate">{compact ? "Ask AI" : prompt}</span>
              <span aria-hidden className="font-mono text-[11px] tabular-nums text-[var(--ink-4)] transition-transform duration-200 group-hover/ai:translate-x-[2px] group-hover/ai:text-[var(--ink)]">{">"}</span>
            </button>
          ))}
        </div>
      )
    }

    const limit = panel.h === 1 ? 1 : panel.h === 2 ? 2 : 3
    return (
      <div className="grid h-full min-h-0 content-start gap-2 overflow-hidden">
        {loading ? (
          Array.from({ length: limit }).map((_, index) => <SkeletonBlock key={index} className="h-[54px] w-full" />)
        ) : metaSignals.length > 0 ? metaSignals.slice(0, limit).map(signal => (
          <Link key={signal.label} href={signal.href} className="group/signal relative min-w-0 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-inherit no-underline transition-colors hover:border-[var(--line-2)] hover:bg-[var(--hover-bg)]">
            <span aria-hidden className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-[var(--accent)] opacity-70 transition-opacity group-hover/signal:opacity-100" />
            <div className="mb-1 truncate pl-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--ink-4)]">{signal.label}</div>
            <div className="line-clamp-2 pl-2 text-[13px] font-semibold leading-[1.35] tracking-[-0.005em] text-[var(--ink)]">{signal.value}</div>
          </Link>
        )) : (
          <p className="m-0 rounded-md border border-dashed border-[var(--line)] p-5 text-center text-[13px] text-[var(--ink-4)]">No signals yet.</p>
        )}
      </div>
    )
  }

  function renderEditPanelPreview(panel: LensboardPanel) {
    const info = widgetInfo[panel.type]
    if (panel.h === 1) return null

    return (
      <div className="flex h-full min-h-0 flex-col justify-end gap-2">
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 text-[11px] font-medium text-[var(--ink-3)] max-md:px-1.5 max-md:py-0.5 max-md:text-[8px]">
            {panel.w}x{panel.h}
          </span>
          <span className="truncate text-[11px] text-[var(--ink-4)] max-md:hidden">{info.category}</span>
        </div>
      </div>
    )
  }

  return (
    <main className={`relative min-h-[calc(100dvh-64px)] overflow-x-hidden ${setupMode ? "pointer-events-none select-none" : ""}`}>
      {editable && dragState && !dragState.overBoard && (
        <div className="pointer-events-none fixed inset-0 z-[80] bg-[rgba(185,28,28,0.1)] shadow-[inset_0_0_0_2px_rgba(185,28,28,0.2),inset_0_0_90px_rgba(185,28,28,0.2)]" />
      )}
      <div className={`relative z-[1] mx-auto w-full max-w-[1460px] px-6 pb-20 max-md:px-4 max-sm:px-3.5 max-sm:pb-14 ${showIntro ? "pt-10 max-md:pt-7" : "pt-4 max-md:pt-4"}`}>
        {showIntro && (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 max-sm:gap-y-3">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-3)]">
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                Live · {loading ? "syncing" : `${formatNum(totalBattles)} battles`}
              </div>
              <h1 className="m-0 text-[clamp(32px,5vw,46px)] font-semibold leading-[0.95] tracking-[-0.038em] text-[var(--ink)]">Lensboard</h1>
              <p className="mt-2 mb-0 max-w-[520px] text-[13.5px] leading-[1.5] text-[var(--ink-3)] max-sm:text-[12.5px]">A live read on the Brawl Stars meta. Player tags, top maps, brawler signal, and AI shortcuts &mdash; arranged the way you want them.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 max-sm:w-full">
              <button type="button" onClick={() => openAssistant("Give me the most important BrawlLens meta signals right now.")} className="group/ask inline-flex min-h-10 whitespace-nowrap items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-4 text-[13px] font-medium text-[var(--ink-2)] shadow-[var(--shadow-lift)] transition-all hover:border-[var(--accent-line)] hover:bg-[var(--panel-2)] hover:text-[var(--ink)] max-sm:flex-1 max-sm:px-3">
                <Image src="/ai-sparkle-512.png" alt="" width={16} height={16} className="size-4 shrink-0 transition-transform duration-300 group-hover/ask:rotate-12" />
                Ask AI
              </button>
              <Link href="/edit" className="inline-flex min-h-10 whitespace-nowrap items-center justify-center gap-1.5 rounded-md bg-[var(--ink)] px-4 text-[13px] font-semibold text-[var(--ink-on)] no-underline shadow-[var(--shadow-lift)] transition-opacity hover:opacity-90 max-sm:flex-1 max-sm:px-3">
                Edit board
              </Link>
            </div>
          </div>
        )}

        <div className={`grid gap-4 ${editable ? "lg:grid-cols-[288px_minmax(0,1fr)]" : ""}`}>
          {editable && (
            <aside className="min-w-0 max-lg:order-2 lg:sticky lg:top-[80px] lg:max-h-[calc(100dvh-96px)] lg:self-start lg:overflow-y-auto">
              <div className="border-y border-[var(--line)] bg-transparent lg:rounded-xl lg:border">
                <div className="border-b border-[var(--line)] p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="m-0 text-[18px] font-semibold tracking-[-0.018em] text-[var(--ink)]">Presets</h2>
                    <button type="button" onClick={saveBoardAndExit} disabled={savingBoard} className="inline-flex min-h-9 min-w-[76px] cursor-pointer items-center justify-center rounded-md border-0 bg-[var(--ink)] px-3 text-[13px] font-medium text-[var(--ink-on)] shadow-[var(--shadow-lift)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-55">
                      {savingBoard ? "Saving..." : "Save"}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1">
                    {presetGroups.map(group => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => {
                          setActivePresetGroup(group)
                          const first = LENSBOARD_WIDGET_IDS.find(id => widgetInfo[id].category === group) ?? null
                          setOpenPreset(first)
                        }}
                        className={`h-8 cursor-pointer rounded-md border text-[11px] font-medium transition-colors ${activePresetGroup === group ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--ink-on)] shadow-[var(--shadow-lift)]" : "border-[var(--line)] bg-transparent text-[var(--ink-3)] hover:border-[var(--line-2)] hover:text-[var(--ink)]"}`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-[var(--line)]">
                  {LENSBOARD_WIDGET_IDS.filter(id => widgetInfo[id].category === activePresetGroup).map(id => {
                    const open = openPreset === id
                    return (
                      <div key={id}>
                        <button
                          type="button"
                          onClick={() => setOpenPreset(current => current === id ? null : id)}
                          className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-3.5 py-2.5 text-left font-[inherit] text-[var(--ink)] transition-colors hover:bg-[var(--hover-bg)]"
                          aria-expanded={open}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold tracking-[-0.01em] text-[var(--ink)]">{widgetInfo[id].title}</span>
                            <span className="mt-0.5 block truncate text-[12px] text-[var(--ink-4)]">{widgetInfo[id].description}</span>
                          </span>
                          <ChevronDown size={15} strokeWidth={1.8} className={`shrink-0 text-[var(--ink-4)] transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>

                        {open && (
                          <div className="grid gap-1.5 px-3.5 pb-3">
                            {LENSBOARD_PRESET_VARIANTS[id].map(size => (
                              <button key={size.label} type="button" onClick={() => addPanel(id, size)} className="flex h-8 cursor-pointer items-center justify-between rounded-md border border-[var(--line)] bg-[var(--panel)] px-2.5 text-[11px] font-medium text-[var(--ink-3)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]">
                                <span>{size.label}</span>
                                <span className="text-[10px] text-[var(--ink-4)]">{size.w}x{size.h}</span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    )
                  })}
                </div>

                <div className="border-t border-[var(--line)] p-3.5">
                  <button type="button" onClick={resetBoard} className="inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--line-2)] hover:text-[var(--ink)]">
                    <RotateCcw size={14} strokeWidth={1.8} />
                    Reset board
                  </button>
                  <div className="mt-2 min-h-5 text-center text-[12px] text-[var(--ink-4)]">{placementNotice}</div>
                </div>
              </div>
            </aside>
          )}

          <section className="min-w-0 max-lg:order-1">
            {editable ? (
              <div className={`rounded-[14px] border border-[var(--line)] bg-[color-mix(in_srgb,var(--panel)_72%,transparent)] p-2.5 max-md:p-2 ${dragState ? "relative z-[90]" : ""} ${dragState && !dragState.overBoard ? "ring-1 ring-[rgba(185,28,28,0.24)]" : ""}`}>
                <div
                  className="relative mx-auto grid aspect-square w-full max-w-[780px] gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--panel-2)_56%,transparent)] p-2 max-md:gap-1 max-md:p-1"
                  style={{
                    gridTemplateColumns: `repeat(${LENSBOARD_COLUMNS}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${LENSBOARD_ROWS}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: LENSBOARD_COLUMNS * LENSBOARD_ROWS }).map((_, index) => (
                    <div key={index} className="rounded-[7px] border border-[color-mix(in_srgb,var(--line)_54%,transparent)] bg-[color-mix(in_srgb,var(--panel)_46%,transparent)]" />
                  ))}

                  <div
                    className="pointer-events-none absolute inset-2 grid gap-2 max-md:inset-1 max-md:gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${LENSBOARD_COLUMNS}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${LENSBOARD_ROWS}, minmax(0, 1fr))`,
                    }}
                  >
                    {layout.length === 0 && (
                      <div className="col-span-10 row-span-10 grid place-items-center rounded-lg border border-dashed border-[var(--line-2)] bg-[color-mix(in_srgb,var(--panel)_74%,transparent)] text-center">
                        <div>
                          <p className="m-0 text-[18px] font-semibold text-[var(--ink)]">Your Lensboard is empty.</p>
                          <p className="mt-1 mb-0 text-[13px] text-[var(--ink-3)]">Add a preset from the left rail.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    ref={boardGridRef}
                    className="absolute inset-2 grid gap-2 max-md:inset-1 max-md:gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${LENSBOARD_COLUMNS}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${LENSBOARD_ROWS}, minmax(0, 1fr))`,
                    }}
                  >
                    {layout.map(panel => {
                      const panelDragState = dragState?.uid === panel.uid ? dragState : null
                      const displayPanel = panelDragState
                        ? { ...panel, x: panelDragState.candidate.x, y: panelDragState.candidate.y }
                        : panel

                      return (
                        <WidgetFrame
                          key={panel.uid}
                          panel={displayPanel}
                          editable={editable}
                          preview
                          dragging={Boolean(panelDragState)}
                          dragInvalid={Boolean(panelDragState?.overBoard && !panelDragState.valid)}
                          dragDeleting={Boolean(panelDragState && !panelDragState.overBoard)}
                          onDragStart={startPanelDrag}
                        >
                          {renderEditPanelPreview(panel)}
                        </WidgetFrame>
                      )
                    })}
                  </div>
                </div>
                <p className="m-0 mt-3 text-[12px] leading-snug text-[var(--ink-4)]">
                  Mobile Lensboard stacks panels differently; this editor reflects the desktop grid layout.
                </p>
              </div>
            ) : (
              <div
                className="grid gap-3 [grid-template-columns:repeat(10,minmax(0,1fr))] max-md:grid-cols-1 max-md:gap-3"
                style={{
                  gridAutoRows: "minmax(104px, auto)",
                }}
              >
                {layout.length === 0 && (
                  <div className="col-span-10 rounded-lg border border-dashed border-[var(--line-2)] bg-[color-mix(in_srgb,var(--panel)_74%,transparent)] p-8 text-center">
                    <p className="m-0 text-[18px] font-semibold text-[var(--ink)]">Your Lensboard is empty.</p>
                    <p className="mt-1 mb-0 text-[13px] text-[var(--ink-3)]">Open Edit to add panels.</p>
                  </div>
                )}
                {layout.map(panel => (
                  <WidgetFrame key={panel.uid} panel={panel} editable={false}>
                    {renderPanelContent(panel)}
                  </WidgetFrame>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
