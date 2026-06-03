"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ArrowUp, ArrowRight, History, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import ChatLimitDialog from "@/components/ChatLimitDialog"
import { lockBodyScroll } from "@/lib/bodyScrollLock"
import { authHeaders } from "@/lib/clientAuth"
import { chatLimitFromResponse, type ChatLimitPayload } from "@/lib/aiLimits"
import { clubBadgeUrl, clubDetailHref, playerProfileHref } from "@/lib/leaderboardUtils"
import { sanitizePlayerTag } from "@/lib/validation"

/* ── AI markdown ── */
const mdComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-[720] text-[rgba(245,244,241,0.88)]">{children}</strong>,
  em: ({ children }) => <em className="italic text-[rgba(245,244,241,0.74)]">{children}</em>,
  h2: ({ children }) => <h2 className="mb-[5px] mt-3.5 text-[13px] font-[720] text-[rgba(245,244,241,0.84)] first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1 mt-2.5 text-[12.5px] font-[680] text-[rgba(245,244,241,0.76)] first:mt-0">{children}</h3>,
  ul: ({ children }) => <ul className="mb-2 flex flex-col gap-[3px]">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 flex flex-col gap-[3px]">{children}</ol>,
  li: ({ children }) => <li className="ml-4 list-item text-[13px]">{children}</li>,
  a: ({ href, children }) => <Link href={href ?? "/"} className="font-[650] text-[var(--bt-blue-hot)] underline underline-offset-2 hover:opacity-75">{children}</Link>,
  code: ({ children, className }) => {
    if (className?.includes("language-")) return <pre className="my-2 overflow-x-auto rounded-[8px] border border-[rgba(245,244,241,0.08)] bg-[rgba(245,244,241,0.035)] px-3 py-2.5 font-mono text-[11.5px] text-[rgba(245,244,241,0.74)]"><code>{children}</code></pre>
    return <code className="rounded border border-[rgba(245,244,241,0.08)] bg-[rgba(245,244,241,0.04)] px-[5px] py-px font-mono text-[11.5px] text-[rgba(245,244,241,0.72)]">{children}</code>
  },
  hr: () => <hr className="my-2.5 border-0 border-t border-[rgba(245,244,241,0.08)]" />,
}

/* ── Search types ── */
type SearchItemKind = "player" | "club" | "brawler" | "team" | "page" | "ai"

type SearchItem = {
  title: string
  subtitle: string
  href: string
  kind: SearchItemKind
  imageId?: number
  iconId?: number | null
  clubBadgeId?: number | null
  playerTag?: string
  logoUrl?: string
  logoClassName?: string
  badge?: string
  lastUsedAt?: string
}

type RemotePlayer = {
  rank?: number
  player_tag?: string
  player_name?: string
  trophies?: number
  club_name?: string | null
  tag?: string
  name?: string
  iconId?: number | null
  clubName?: string | null
}

type RemoteClub = {
  rank?: number
  club_tag?: string
  club_name?: string
  trophies?: number
  member_count?: number | null
  tag?: string
  name?: string
  badgeId?: number | null
  memberCount?: number | null
}

type RemoteSearchPayload = {
  query?: string
  tag?: string | null
  tagMatches?: {
    player?: RemotePlayer | null
    club?: RemoteClub | null
  }
  players?: RemotePlayer[]
  clubs?: RemoteClub[]
}

type RemoteSearchState = "idle" | "loading" | "ready" | "error"

interface AiMessage {
  role: "user" | "assistant"
  content: string
}

/* ── Page context for AI ── */
function compactText(value: string, maxLength = 220) {
  const text = value.replace(/\s+/g, " ").trim()
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text
}

function uniqueCompact(values: string[], limit: number) {
  const seen = new Set<string>()
  const next: string[] = []
  for (const value of values) {
    const compact = compactText(value)
    if (!compact || seen.has(compact)) continue
    seen.add(compact)
    next.push(compact)
    if (next.length >= limit) break
  }
  return next
}

function isElementVisible(element: Element) {
  if (!(element instanceof HTMLElement)) return true
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden"
}

function textFromElement(element: Element, maxLength = 220) {
  return compactText(element.textContent ?? "", maxLength)
}

function collectPageContext() {
  if (typeof window === "undefined" || typeof document === "undefined") return null
  const root = document.querySelector("main") ?? document.body
  if (!root) return null
  const textClone = root.cloneNode(true) as Element
  textClone.querySelectorAll("script, style, noscript, nav, [role='dialog'], input, textarea").forEach(node => node.remove())
  const headings = uniqueCompact(Array.from(root.querySelectorAll("h1, h2, h3")).filter(isElementVisible).map(h => textFromElement(h, 140)), 12)
  const stats = uniqueCompact(Array.from(root.querySelectorAll("[data-ai-context], .bl-bd-stat, .bl-md-kpi, .bl-map-hero-pill, .bl-lb-podium-card, .bl-profile-stat, .bl-card-stat, .bl-tier-card-stat")).filter(isElementVisible).map(n => textFromElement(n, 180)), 24)
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(isElementVisible).map(l => ({ text: textFromElement(l, 90), href: l.href })).filter(l => l.text).slice(0, 28)
  const tables = Array.from(root.querySelectorAll("table")).filter(isElementVisible).slice(0, 4).map(t => {
    const headers = uniqueCompact(Array.from(t.querySelectorAll("thead th, thead td")).map(c => textFromElement(c, 90)), 10)
    const rows = Array.from(t.querySelectorAll("tbody tr, tr")).filter(isElementVisible).slice(0, 12).map(r => Array.from(r.querySelectorAll("th, td")).map(c => textFromElement(c, 90)).filter(Boolean)).filter(r => r.length > 0)
    return { caption: t.querySelector("caption") ? textFromElement(t.querySelector("caption")!, 140) : undefined, headers, rows }
  }).filter(t => t.headers.length > 0 || t.rows.length > 0)
  return { url: window.location.href, path: `${window.location.pathname}${window.location.search}`, title: document.title, headings, stats, tables, links, visibleText: compactText(textClone.textContent ?? "", 4200) }
}

/* ── Static data ── */
const RECENT_SEARCH_KEY = "brawllens:recent-searches:v1"

const searchGroups: { label: string; items: SearchItem[] }[] = [
  {
    label: "Players",
    items: [
      { title: "Tensai", subtitle: "Pro player", href: "/player/9ULYPV8", kind: "player", playerTag: "9ULYPV8", badge: "Player" },
      { title: "Moya", subtitle: "Pro player", href: "/player/UR2UL8YR", kind: "player", playerTag: "UR2UL8YR", badge: "Player" },
      { title: "Yoshi", subtitle: "Pro player", href: "/player/CJV2PJ0R", kind: "player", playerTag: "CJV2PJ0R", badge: "Player" },
    ],
  },
  {
    label: "Brawlers",
    items: [
      { title: "Ash", subtitle: "Builds, stats & counters", href: "/brawlers/16000051", kind: "brawler", imageId: 16000051, badge: "Brawler" },
      { title: "Kenji", subtitle: "Builds, stats & counters", href: "/brawlers/16000085", kind: "brawler", imageId: 16000085, badge: "Brawler" },
      { title: "Moe", subtitle: "Builds, stats & counters", href: "/brawlers/16000084", kind: "brawler", imageId: 16000084, badge: "Brawler" },
      { title: "Draco", subtitle: "Builds, stats & counters", href: "/brawlers/16000080", kind: "brawler", imageId: 16000080, badge: "Brawler" },
      { title: "Cordelius", subtitle: "Builds, stats & counters", href: "/brawlers/16000070", kind: "brawler", imageId: 16000070, badge: "Brawler" },
      { title: "Spike", subtitle: "Builds, stats & counters", href: "/brawlers/16000005", kind: "brawler", imageId: 16000005, badge: "Brawler" },
      { title: "Shelly", subtitle: "Builds, stats & counters", href: "/brawlers/16000000", kind: "brawler", imageId: 16000000, badge: "Brawler" },
    ],
  },
  {
    label: "Teams",
    items: [
      { title: "ZETA DIVISION", subtitle: "Pro team stats", href: "/leaderboards/pro/zeta", kind: "team", logoUrl: "/team-logos/zeta-transparent.png", badge: "Team" },
      { title: "Crazy Raccoons", subtitle: "Pro team stats", href: "/leaderboards/pro/crazy-raccoons", kind: "team", logoUrl: "/team-logos/crazy-raccoons-transparent.png", badge: "Team" },
      { title: "HMBLE", subtitle: "Pro team stats", href: "/leaderboards/pro/hmble", kind: "team", logoUrl: "https://hmble.it/images/logo/hmble-logo.png", logoClassName: "bl-search-result-logo-invert", badge: "Team" },
    ],
  },
]

/* ── Helpers ── */
function formatNumber(value: number | null | undefined) {
  return typeof value === "number" ? value.toLocaleString("en-US") : null
}

function cleanTag(value: string | null | undefined) {
  return sanitizePlayerTag((value ?? "").replace(/^#/, ""))
}

function itemMatches(item: SearchItem, normalized: string) {
  return `${item.title} ${item.subtitle} ${item.playerTag ?? ""}`.toLowerCase().includes(normalized)
}

function uniqueItems(items: SearchItem[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = `${item.kind}:${item.href}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function playerItemFromRemote(player: RemotePlayer, fallbackTag?: string): SearchItem | null {
  const tag = cleanTag(player.tag ?? player.player_tag ?? fallbackTag)
  if (!tag) return null
  const name = player.name ?? player.player_name ?? `#${tag}`
  const trophies = formatNumber(player.trophies)
  const clubName = player.clubName ?? player.club_name
  const subtitle = [
    `#${tag}`,
    trophies ? `${trophies} trophies` : null,
    clubName ?? null,
  ].filter(Boolean).join(" · ")
  return { title: name, subtitle, href: playerProfileHref(tag), kind: "player", playerTag: tag, iconId: player.iconId ?? null, badge: typeof player.rank === "number" ? `#${player.rank}` : "Player" }
}

function clubItemFromRemote(club: RemoteClub, fallbackTag?: string): SearchItem | null {
  const tag = cleanTag(club.tag ?? club.club_tag ?? fallbackTag)
  if (!tag) return null
  const name = club.name ?? club.club_name ?? `#${tag}`
  const trophies = formatNumber(club.trophies)
  const members = club.memberCount ?? club.member_count
  const subtitle = [`#${tag}`, trophies ? `${trophies} trophies` : null, typeof members === "number" ? `${members} members` : null].filter(Boolean).join(" · ")
  return { title: name, subtitle, href: clubDetailHref(tag), kind: "club", clubBadgeId: club.badgeId ?? null, badge: typeof club.rank === "number" ? `#${club.rank}` : "Club" }
}

function fallbackPlayerItem(query: string): SearchItem | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  const tag = sanitizePlayerTag(trimmed)
  if (tag) return { title: `#${tag}`, subtitle: "Open player profile", href: playerProfileHref(tag), kind: "player", playerTag: tag, badge: "Player" }
  return null
}

function askItem(query: string): SearchItem | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  return {
    title: trimmed,
    subtitle: "Ask BrawlLens AI",
    href: `/ask?q=${encodeURIComponent(trimmed)}`,
    kind: "ai",
    badge: "AI",
  }
}

function loadRecentSearches(): SearchItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]") as SearchItem[]
    return parsed
      .filter(item => item?.href && item?.title && (item.kind === "player" || item.kind === "club"))
      .map(item => ({ ...item, lastUsedAt: item.lastUsedAt ?? new Date().toISOString() }))
      .slice(0, 5)
  } catch { return [] }
}

function formatRecentDate(value: string | undefined) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

async function resolveSearchDestination(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return null
  const playerTag = sanitizePlayerTag(trimmed)
  if (playerTag) {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(playerTag)}`)
      if (response.ok) {
        const payload = await response.json() as RemoteSearchPayload
        if (payload.tagMatches?.player) return playerProfileHref(playerTag)
        if (payload.tagMatches?.club) return clubDetailHref(playerTag)
      }
    } catch { /* fast path */ }
    return playerProfileHref(playerTag)
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
    if (response.ok) {
      const payload = await response.json() as RemoteSearchPayload
      const player = payload.players?.flatMap(p => {
        const item = playerItemFromRemote(p)
        return item ? [item] : []
      })[0]
      if (player) return player.href
      const club = payload.clubs?.flatMap(c => {
        const item = clubItemFromRemote(c)
        return item ? [item] : []
      })[0]
      if (club) return club.href
    }
  } catch { /* fall through to page or AI routing */ }

  const normalized = trimmed.toLowerCase()
  if (normalized.includes("club")) return "/leaderboards/clubs"
  if (normalized.includes("brawler") || normalized.includes("tier") || normalized.includes("build")) return "/brawlers"
  if (normalized.includes("map") || normalized.includes("meta") || normalized.includes("mode")) return "/meta"
  return `/ask?q=${encodeURIComponent(trimmed)}`
}

const AI_TRIGGERS = /^(what|why|how|who|which|where|when|is|are|should|can|does|will|compare|summarize|explain|tell|give|best|worst|top|rank|recommend)\b/i

function isAiQuery(q: string) {
  return AI_TRIGGERS.test(q.trim()) || q.trim().endsWith("?")
}

/* ── Component ── */
type Mode = "search" | "ai"
const SEARCH_OVERLAY_EXIT_MS = 180
const cmdLayerClass = (closing: boolean) =>
  `fixed inset-0 z-[300] flex items-start justify-center px-[18px] pb-[18px] pt-[clamp(118px,20vh,260px)] max-[560px]:p-2.5 max-[560px]:pt-[70px] ${closing ? "animate-[cmdLayerOut_180ms_ease_both]" : "animate-[cmdLayerIn_180ms_ease_both]"}`

const cmdBackdropClass =
  "bl-cmd-backdrop absolute inset-0 cursor-default overflow-hidden border-0 bg-[rgba(8,8,12,0.24)] backdrop-blur-[64px] [transform:translateZ(0)]"

const cmdPanelClass = (closing: boolean) =>
  `relative z-[1] flex w-[min(620px,calc(100vw-36px))] max-h-[min(540px,calc(100dvh-120px))] flex-col overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.10)] bg-[rgba(34,34,42,0.94)] shadow-[rgba(255,255,255,0.05)_0_0.5px_0_0_inset,0_24px_64px_-20px_rgba(0,0,0,0.55)] backdrop-blur-[12px] max-[560px]:w-[calc(100vw-20px)] max-[560px]:max-h-[calc(100dvh-92px)] max-[560px]:rounded-2xl ${closing ? "animate-[cmdPanelOut_180ms_ease_both]" : "animate-[cmdPanelIn_200ms_cubic-bezier(0.16,1,0.3,1)_both]"}`

const cmdTabClass = (active: boolean) =>
  `relative inline-flex h-[30px] min-w-[72px] cursor-pointer items-center justify-center rounded-full border-0 px-3.5 text-[12px] font-[720] tracking-normal outline-none transition-[background-color,color,box-shadow] duration-150 max-[560px]:min-w-[66px] ${active ? "bg-[#7c5cff] text-white shadow-none hover:bg-[#5b3fcc] focus-visible:bg-[#5b3fcc]" : "bg-transparent text-[rgba(245,244,241,0.74)] hover:text-[rgba(245,244,241,0.92)]"}`

const cmdFormClass =
  "grid h-12 min-h-12 grid-cols-[auto_minmax(0,1fr)_auto] items-center border-0 bg-transparent shadow-none transition-none focus-within:bg-[rgba(255,255,255,0.055)] focus-within:shadow-none focus-within:outline-none max-[560px]:mx-2.5 max-[560px]:mb-1 max-[560px]:mt-2 max-[560px]:h-[42px] max-[560px]:min-h-[42px]"

const cmdInputClass =
  "min-w-0 border-0 bg-transparent px-3 py-0 text-[15px] font-medium tracking-normal text-[#f5f4f1] shadow-none outline-none placeholder:text-[rgba(245,244,241,0.68)] placeholder:font-medium focus:border-0 focus:bg-transparent focus:shadow-none focus:outline-none max-[560px]:text-[13px] [font-family:var(--font-ui)]"

const cmdSubmitClass =
  "mr-3 grid size-8 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent text-[rgba(245,244,241,0.7)] outline-none transition-colors duration-150 hover:bg-[rgba(245,244,241,0.06)] hover:text-[#f5f4f1]"

const cmdResultsClass =
  "flex-1 overflow-y-auto border-t border-[rgba(255,255,255,0.06)] p-0 [scrollbar-width:none] empty:hidden [&::-webkit-scrollbar]:hidden max-[560px]:px-2 max-[560px]:pb-3"

const cmdRowClass = (recent: boolean) =>
  `grid items-center gap-3 border-0 bg-transparent text-[var(--bt-text-2)] no-underline shadow-none transition-colors duration-150 hover:border-0 hover:bg-[rgba(245,244,241,0.04)] hover:text-[#f5f4f1] hover:shadow-none hover:[transform:none] max-[560px]:grid-cols-[36px_minmax(0,1fr)] max-[560px]:px-2 max-[560px]:py-1.5 max-[560px]:min-h-[50px] ${recent ? "min-h-[54px] grid-cols-[22px_minmax(0,1fr)_auto] px-3.5 py-2" : "min-h-9 grid-cols-[22px_minmax(0,1fr)] px-3.5 py-1.5"}`

const cmdIconClass =
  "grid size-5 place-items-center overflow-hidden rounded bg-[rgba(245,244,241,0.06)] text-[11px] font-semibold text-[rgba(245,244,241,0.72)] shadow-none max-[560px]:size-8"

const cmdIconImageClass = "size-5 object-cover max-[560px]:size-8"
const cmdTeamLogoClass = "size-5 object-contain p-1 max-[560px]:size-8"
const cmdCopyTitleClass = "block overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-medium leading-[1.2] tracking-normal text-[rgba(245,244,241,0.94)]"
const cmdAiMessageClass = (role: AiMessage["role"]) =>
  `mb-3.5 bg-[var(--bt-shell)] text-[var(--bt-text-2)] shadow-none ${role === "user" ? "text-[13.5px] font-[650] leading-[1.55]" : "text-[13px] font-[540] leading-[1.6]"}`
const cmdAiSendClass =
  "grid size-[26px] shrink-0 cursor-pointer place-items-center rounded-[8px] border-0 bg-[#7c5cff] text-white outline-none transition-colors duration-100 hover:bg-[#5b3fcc] focus-visible:bg-[#5b3fcc] disabled:cursor-default disabled:opacity-25"

export default function SearchOverlay() {
  const router = useRouter()

  /* Search state */
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [playerIcons, setPlayerIcons] = useState<Record<string, number>>({})
  const [remoteSearch, setRemoteSearch] = useState<RemoteSearchPayload | null>(null)
  const [remoteState, setRemoteState] = useState<RemoteSearchState>("idle")
  const [recentItems, setRecentItems] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  /* AI state */
  const [mode, setMode] = useState<Mode>("search")
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [aiInput, setAiInput] = useState("")
  const [aiStreaming, setAiStreaming] = useState(false)
  const [limitGate, setLimitGate] = useState<ChatLimitPayload | null>(null)
  const aiInputRef = useRef<HTMLTextAreaElement>(null)
  const aiBottomRef = useRef<HTMLDivElement>(null)
  const aiAbortRef = useRef<AbortController | null>(null)

  const visible = open || closing
  const trimmedQuery = query.trim()

  useEffect(() => {
    document.documentElement.classList.toggle("bl-cmd-open", open)
    return () => document.documentElement.classList.remove("bl-cmd-open")
  }, [open])

  useEffect(() => {
    if (!visible) return
    return lockBodyScroll()
  }, [visible])

  const close = useCallback(() => {
    if (!open || closing) return
    setClosing(true)
    setOpen(false)
    closeTimerRef.current = window.setTimeout(() => {
      setClosing(false)
      closeTimerRef.current = null
    }, SEARCH_OVERLAY_EXIT_MS)
  }, [closing, open])

  /* Reset mode on open */
  useEffect(() => {
    if (open) {
      setMode("search")
      setQuery("")
    }
  }, [open])

  useEffect(() => { setRecentItems(loadRecentSearches()) }, [])

  useEffect(() => {
    function onOpenSearch(event: Event) {
      const detail = (event as CustomEvent<{ query?: string }>).detail
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setQuery(detail?.query ?? "")
      setClosing(false)
      setOpen(true)
    }
    window.addEventListener("brawllens:open-search", onOpenSearch)
    return () => window.removeEventListener("brawllens:open-search", onOpenSearch)
  }, [])

  /* Also listen for open-assistant events */
  useEffect(() => {
    function onOpenAssistant(event: Event) {
      const detail = (event as CustomEvent<{ query?: string }>).detail
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setClosing(false)
      setOpen(true)
      setMode("ai")
      setQuery("")
      if (detail?.query) {
        setAiInput(detail.query)
      }
    }
    window.addEventListener("brawllens:open-assistant", onOpenAssistant)
    return () => window.removeEventListener("brawllens:open-assistant", onOpenAssistant)
  }, [])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => {
      if (mode === "ai") aiInputRef.current?.focus()
      else inputRef.current?.focus()
    }, 80)
    return () => window.clearTimeout(id)
  }, [open, mode])

  useEffect(() => {
    if (!visible) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [close, visible])

  /* Remote search */
  useEffect(() => {
    if (!open || mode !== "search" || trimmedQuery.length < 2) {
      setRemoteSearch(null)
      setRemoteState("idle")
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setRemoteState("loading")
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: controller.signal })
        if (!response.ok) { setRemoteSearch(null); setRemoteState("error"); return }
        const payload = await response.json() as RemoteSearchPayload
        setRemoteSearch(payload)
        setRemoteState("ready")
      } catch { if (!controller.signal.aborted) { setRemoteSearch(null); setRemoteState("error") } }
    }, 180)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [open, mode, trimmedQuery])

  /* Search groups */
  const visibleSearchGroups = useMemo(() => {
    const normalized = trimmedQuery.toLowerCase()
    const tag = sanitizePlayerTag(trimmedQuery)
    if (!normalized) return recentItems.length ? [{ label: "Recent", items: recentItems }] : []
    const staticPlayerItems = searchGroups.find(g => g.label === "Players")?.items.filter(i => itemMatches(i, normalized)) ?? []
    const staticGroups = searchGroups.filter(g => g.label !== "Players").map(g => ({ ...g, items: g.items.filter(i => itemMatches(i, normalized)) })).filter(g => g.items.length > 0)
    const remotePlayerItems = uniqueItems([
      remoteSearch?.tagMatches?.player ? playerItemFromRemote(remoteSearch.tagMatches.player, tag ?? undefined) : null,
      ...(remoteSearch?.players ?? []).map(p => playerItemFromRemote(p)),
      ...staticPlayerItems,
      fallbackPlayerItem(trimmedQuery),
    ].filter((i): i is SearchItem => Boolean(i)))
    const remoteClubItems = uniqueItems([
      remoteSearch?.tagMatches?.club ? clubItemFromRemote(remoteSearch.tagMatches.club, tag ?? undefined) : null,
      ...(remoteSearch?.clubs ?? []).map(c => clubItemFromRemote(c)),
      tag && remoteState === "ready" && !remoteSearch?.tagMatches?.club ? { title: `#${tag}`, subtitle: "Search club leaderboard", href: `/leaderboards/clubs?search=${encodeURIComponent(tag)}`, kind: "club" as const, badge: "Club" } : null,
    ].filter((i): i is SearchItem => Boolean(i)))
    const groups = [{ label: "Players", items: remotePlayerItems }, ...(remoteClubItems.length ? [{ label: "Clubs", items: remoteClubItems }] : []), ...staticGroups].filter(g => g.items.length > 0)
    const hasConcreteResult = groups.some(group => group.items.some(item => item.kind !== "ai"))
    const ask = trimmedQuery.length >= 2 && !tag && !hasConcreteResult && remoteState !== "loading" ? askItem(trimmedQuery) : null
    return ask ? [...groups, { label: "Ask", items: [ask] }] : groups
  }, [recentItems, remoteSearch, remoteState, trimmedQuery])

  const primaryResult = useMemo(() => visibleSearchGroups.flatMap(g => g.items)[0] ?? null, [visibleSearchGroups])

  /* Player icon loading */
  useEffect(() => {
    if (!open || mode !== "search") return
    const tags = visibleSearchGroups.flatMap(g => g.items).map(i => i.playerTag).filter((t): t is string => Boolean(t && !playerIcons[t]))
    if (!tags.length) return
    let cancelled = false
    async function loadIcons() {
      const entries = await Promise.all(tags.map(async tag => {
        try {
          const r = await fetch(`/api/player?tag=${encodeURIComponent(tag)}`)
          if (!r.ok) return null
          const p = await r.json() as { icon?: { id?: number } }
          return p.icon?.id ? [tag, p.icon.id] as const : null
        } catch { return null }
      }))
      if (cancelled) return
      setPlayerIcons(c => ({ ...c, ...Object.fromEntries(entries.filter((e): e is readonly [string, number] => Boolean(e))) }))
    }
    loadIcons()
    return () => { cancelled = true }
  }, [open, mode, playerIcons, visibleSearchGroups])

  function rememberSearchItem(item: SearchItem) {
    if (item.kind !== "player" && item.kind !== "club") return
    const stored: SearchItem = { title: item.title, subtitle: item.subtitle, href: item.href, kind: item.kind, playerTag: item.playerTag, iconId: item.iconId ?? null, clubBadgeId: item.clubBadgeId ?? null, badge: item.badge, lastUsedAt: new Date().toISOString() }
    const next = uniqueItems([stored, ...recentItems]).slice(0, 5)
    setRecentItems(next)
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next))
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === "search" && trimmedQuery && (primaryResult?.kind === "ai" || isAiQuery(trimmedQuery))) {
      close()
      router.push(`/ask?q=${encodeURIComponent(trimmedQuery)}`)
      return
    }
    const destination = primaryResult?.href ?? await resolveSearchDestination(query)
    if (!destination) return
    if (primaryResult) rememberSearchItem(primaryResult)
    close()
    router.push(destination)
  }

  /* ── AI logic ── */
  const sendAiMessage = useCallback(async (content: string) => {
    const userMsg: AiMessage = { role: "user", content }
    const history = [...aiMessages, userMsg]
    setAiMessages(history)
    setAiStreaming(true)
    setAiMessages([...history, { role: "assistant", content: "" }])
    const controller = new AbortController()
    aiAbortRef.current = controller
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pageContext: collectPageContext() }),
        signal: controller.signal,
      })
      const gate = await chatLimitFromResponse(res)
      if (gate) {
        setAiMessages(history)
        setLimitGate(gate)
        setAiStreaming(false)
        return
      }
      if (!res.ok) { setAiMessages([...history, { role: "assistant", content: "Something went wrong." }]); setAiStreaming(false); return }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setAiMessages([...history, { role: "assistant", content: fullText }])
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setAiMessages([...history, { role: "assistant", content: "Stream interrupted." }])
    }
    setAiStreaming(false)
    aiAbortRef.current = null
  }, [aiMessages])

  function handleAiSubmit() {
    const q = aiInput.trim()
    if (!q || aiStreaming) return
    setAiInput("")
    if (aiInputRef.current) aiInputRef.current.style.height = "auto"
    sendAiMessage(q)
  }

  function handleAiKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSubmit() }
  }

  function handleAiInput(e: ChangeEvent<HTMLTextAreaElement>) {
    setAiInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  useEffect(() => {
    if (aiMessages.length) aiBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [aiMessages])

  if (!visible) return null

  return (
    <div className={cmdLayerClass(closing)} role="dialog" aria-modal="true" aria-label="Search & AI">
      <button className={cmdBackdropClass} type="button" aria-label="Close" onClick={close} />
      <div className={cmdPanelClass(closing)}>
        {/* Mode toggle */}
        <div className="hidden">
          <button type="button" className={cmdTabClass(mode === "search")} onClick={() => setMode("search")}>Search</button>
          <button type="button" className={cmdTabClass(mode === "ai")} onClick={() => { setMode("ai"); setTimeout(() => aiInputRef.current?.focus(), 60) }}>Brawl AI</button>
        </div>

        {mode === "search" ? (
          /* ── Search mode ── */
          <>
            <form onSubmit={submitSearch} className={cmdFormClass}>
              <Search size={15} strokeWidth={2.2} className="ml-3.5 shrink-0 text-[rgba(245,244,241,0.72)]" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by tags, name or descriptions"
                autoCapitalize="characters"
                spellCheck={false}
                autoComplete="off"
                className={cmdInputClass}
              />
              <button type="submit" aria-label="Submit search" className={cmdSubmitClass}>
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </form>
            <div className={cmdResultsClass}>
              {visibleSearchGroups.map(group => (
                <section key={group.label} className="grid gap-0 py-1.5 first:mt-0">
                  <h3 className="hidden">{group.label}</h3>
                  {group.items.map(item => {
                    const isRecent = group.label === "Recent"
                    const iconId = item.iconId ?? (item.playerTag ? playerIcons[item.playerTag] : null)
                    return (
                      <Link
                        key={`${group.label}-${item.kind}-${item.href}-${item.title}`}
                        href={item.href}
                        className={cmdRowClass(isRecent)}
                        onClick={() => { rememberSearchItem(item); close() }}
                      >
                        <span className={cmdIconClass}>
                          {isRecent ? <History size={15} strokeWidth={2.2} aria-hidden="true" />
                            : item.imageId ? <BrawlImage className={cmdIconImageClass} src={brawlerIconUrl(item.imageId)} alt="" width={32} height={32} sizes="32px" />
                            : iconId ? <BrawlImage className={cmdIconImageClass} src={profileIconUrl(iconId)} alt="" width={32} height={32} sizes="32px" />
                            : item.clubBadgeId ? <BrawlImage className={cmdIconImageClass} src={clubBadgeUrl(item.clubBadgeId)} alt="" width={32} height={32} sizes="32px" />
                            // External team logo URLs can be outside the configured Next image domains.
                            // eslint-disable-next-line @next/next/no-img-element
                            : item.logoUrl ? <img src={item.logoUrl} alt="" className={`${cmdTeamLogoClass} ${item.logoClassName ?? ""}`} />
                            : item.kind === "ai" ? <Search size={15} strokeWidth={2.2} aria-hidden="true" />
                            : <span>{item.title.slice(0, 1)}</span>}
                        </span>
                        <span className="min-w-0">
                          {item.kind === "ai" ? (
                            <strong className={cmdCopyTitleClass}>
                              <span className="text-[rgba(245,244,241,0.94)]">{item.title}</span>
                              <span className="ml-1.5 font-medium text-[rgba(245,244,241,0.5)]">— Ask BrawlLens AI</span>
                            </strong>
                          ) : (
                            <strong className={cmdCopyTitleClass}>{item.title}</strong>
                          )}
                          <small className="hidden">{item.subtitle}</small>
                        </span>
                        {isRecent && <time className="whitespace-nowrap text-[13px] font-medium leading-none text-[rgba(245,244,241,0.72)]" dateTime={item.lastUsedAt}>{formatRecentDate(item.lastUsedAt)}</time>}
                        {item.badge && <em className="hidden">{item.badge}</em>}
                      </Link>
                    )
                  })}
                </section>
              ))}
            </div>
          </>
        ) : (
          /* ── AI mode ── */
          <>
            <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-2.5 pt-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[560px]:px-3.5 max-[560px]:pb-1.5 max-[560px]:pt-3.5">
              {aiMessages.length === 0 && (
                <div className="flex flex-1 items-center justify-center text-center text-[13px] font-[550] text-[rgba(245,244,241,0.72)]">Ask anything about the meta, brawlers, or maps.</div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={cmdAiMessageClass(msg.role)}>
                  {msg.role === "assistant" ? (
                    aiStreaming && i === aiMessages.length - 1 && msg.content === "" ? (
                      <span className="inline-flex gap-1 py-1.5">
                        <span className="block size-1 animate-[cmdDotPulse_1s_ease_infinite] rounded-full bg-[rgba(91,63,204,0.42)]" />
                        <span className="block size-1 animate-[cmdDotPulse_1s_ease_infinite] rounded-full bg-[rgba(91,63,204,0.42)] [animation-delay:0.12s]" />
                        <span className="block size-1 animate-[cmdDotPulse_1s_ease_infinite] rounded-full bg-[rgba(91,63,204,0.42)] [animation-delay:0.24s]" />
                      </span>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
                    )
                  ) : msg.content}
                  <div ref={i === aiMessages.length - 1 ? aiBottomRef : undefined} />
                </div>
              ))}
            </div>
            <div className="mx-3.5 mb-3.5 flex items-center gap-2 rounded-full border border-[#26262d] bg-[rgba(0,0,0,0.18)] py-2 pl-4 pr-2.5 shadow-none focus-within:border-[var(--bt-line-2)] focus-within:bg-[rgba(255,255,255,0.055)] focus-within:shadow-none focus-within:outline-none max-[560px]:mx-2.5 max-[560px]:mb-2.5 max-[560px]:py-[9px] max-[560px]:pl-3 max-[560px]:pr-2.5">
              <textarea
                ref={aiInputRef}
                rows={1}
                value={aiInput}
                onChange={handleAiInput}
                onKeyDown={handleAiKeyDown}
                placeholder="Ask anything..."
                className="min-h-5 max-h-[120px] flex-1 resize-none border-0 bg-transparent text-[13px] font-[560] leading-normal text-[rgba(245,244,241,0.88)] outline-0 placeholder:text-[rgba(245,244,241,0.68)] focus:shadow-none focus:outline-none [font-family:var(--font-ui)]"
              />
              {aiStreaming ? (
                <button type="button" onClick={() => aiAbortRef.current?.abort()} className={cmdAiSendClass} aria-label="Stop">
                  <Square size={10} strokeWidth={0} fill="currentColor" />
                </button>
              ) : (
                <button type="button" onClick={handleAiSubmit} disabled={!aiInput.trim()} className={cmdAiSendClass} aria-label="Send">
                  <ArrowUp size={13} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <ChatLimitDialog gate={limitGate} onClose={() => setLimitGate(null)} />
    </div>
  )
}
