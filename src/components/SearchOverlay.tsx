"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ChangeEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ArrowUp, ArrowRight, History, Square } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import { lockBodyScroll } from "@/lib/bodyScrollLock"
import { clubBadgeUrl, clubDetailHref, playerProfileHref } from "@/lib/leaderboardUtils"
import { sanitizePlayerTag } from "@/lib/validation"

/* ── AI markdown ── */
const mdComponents: Components = {
  p: ({ children }) => <p className="bl-cmd-p">{children}</p>,
  strong: ({ children }) => <strong className="bl-cmd-strong">{children}</strong>,
  em: ({ children }) => <em className="bl-cmd-em">{children}</em>,
  h2: ({ children }) => <h2 className="bl-cmd-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="bl-cmd-h3">{children}</h3>,
  ul: ({ children }) => <ul className="bl-cmd-ul">{children}</ul>,
  ol: ({ children }) => <ol className="bl-cmd-ol">{children}</ol>,
  li: ({ children }) => <li className="bl-cmd-li">{children}</li>,
  a: ({ href, children }) => <Link href={href ?? "/"} className="bl-cmd-link">{children}</Link>,
  code: ({ children, className }) => {
    if (className?.includes("language-")) return <pre className="bl-cmd-pre"><code>{children}</code></pre>
    return <code className="bl-cmd-code">{children}</code>
  },
  hr: () => <hr className="bl-cmd-hr" />,
}

/* ── Search types ── */
type SearchItemKind = "player" | "club" | "brawler" | "team" | "page"

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
  return { title: trimmed, subtitle: "Search player leaderboard", href: `/leaderboards/players?search=${encodeURIComponent(trimmed)}`, kind: "player", badge: "Players" }
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
      const response = await fetch(`/api/search?q=${encodeURIComponent(playerTag)}`, { cache: "no-store" })
      if (response.ok) {
        const payload = await response.json() as RemoteSearchPayload
        if (payload.tagMatches?.player) return playerProfileHref(playerTag)
        if (payload.tagMatches?.club) return clubDetailHref(playerTag)
      }
    } catch { /* fast path */ }
    return playerProfileHref(playerTag)
  }
  const normalized = trimmed.toLowerCase()
  if (normalized.includes("club")) return "/leaderboards/clubs"
  if (normalized.includes("brawler") || normalized.includes("tier") || normalized.includes("build")) return "/brawlers"
  if (normalized.includes("map") || normalized.includes("meta") || normalized.includes("mode")) return "/meta"
  return `/leaderboards/players?search=${encodeURIComponent(trimmed)}`
}

const AI_TRIGGERS = /^(what|why|how|who|which|where|when|is|are|should|can|does|will|compare|summarize|explain|tell|give|best|worst|top|rank|recommend)\b/i

function isAiQuery(q: string) {
  return AI_TRIGGERS.test(q.trim()) || q.trim().endsWith("?")
}

/* ── Component ── */
type Mode = "search" | "ai"

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
  const aiInputRef = useRef<HTMLTextAreaElement>(null)
  const aiBottomRef = useRef<HTMLDivElement>(null)
  const aiAbortRef = useRef<AbortController | null>(null)

  const visible = open || closing
  const trimmedQuery = query.trim()

  useEffect(() => {
    document.documentElement.classList.toggle("bl-cmd-open", visible)
    return () => document.documentElement.classList.remove("bl-cmd-open")
  }, [visible])

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
    }, 180)
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
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { cache: "no-store", signal: controller.signal })
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
    return [{ label: "Players", items: remotePlayerItems }, ...(remoteClubItems.length ? [{ label: "Clubs", items: remoteClubItems }] : []), ...staticGroups].filter(g => g.items.length > 0)
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
    if (mode === "search" && isAiQuery(trimmedQuery)) {
      setMode("ai")
      setAiInput("")
      sendAiMessage(trimmedQuery)
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pageContext: collectPageContext() }),
        signal: controller.signal,
      })
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
    <div className={`bl-cmd-layer ${closing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Search & AI">
      <button className="bl-cmd-backdrop backdrop-blur-[64px]" type="button" aria-label="Close" onClick={close} />
      <div className="bl-cmd-panel">
        {/* Mode toggle */}
        <div className="bl-cmd-tabs">
          <button type="button" className={`bl-cmd-tab ${mode === "search" ? "bl-cmd-tab-active" : ""}`} onClick={() => setMode("search")}>Search</button>
          <button type="button" className={`bl-cmd-tab ${mode === "ai" ? "bl-cmd-tab-active" : ""}`} onClick={() => { setMode("ai"); setTimeout(() => aiInputRef.current?.focus(), 60) }}>Brawl AI</button>
        </div>

        {mode === "search" ? (
          /* ── Search mode ── */
          <>
            <form onSubmit={submitSearch} className="bl-cmd-form">
              <Search size={15} strokeWidth={2.2} className="bl-cmd-search-icon" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by tags, name or descriptions"
                autoCapitalize="characters"
                spellCheck={false}
                autoComplete="off"
              />
              <button type="submit" aria-label="Submit search">
                <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </form>
            <div className="bl-cmd-results">
              {visibleSearchGroups.map(group => (
                <section key={group.label} className="bl-cmd-group">
                  <h3>{group.label}</h3>
                  {group.items.map(item => {
                    const isRecent = group.label === "Recent"
                    const iconId = item.iconId ?? (item.playerTag ? playerIcons[item.playerTag] : null)
                    return (
                      <Link
                        key={`${group.label}-${item.kind}-${item.href}-${item.title}`}
                        href={item.href}
                        className={`bl-cmd-row ${isRecent ? "bl-cmd-row-recent" : ""}`}
                        onClick={() => { rememberSearchItem(item); close() }}
                      >
                        <span className={`bl-cmd-icon bl-cmd-icon-${item.kind}`}>
                          {isRecent ? <History size={15} strokeWidth={2.2} aria-hidden="true" />
                            : item.imageId ? <BrawlImage src={brawlerIconUrl(item.imageId)} alt="" width={32} height={32} sizes="32px" />
                            : iconId ? <BrawlImage src={profileIconUrl(iconId)} alt="" width={32} height={32} sizes="32px" />
                            : item.clubBadgeId ? <BrawlImage src={clubBadgeUrl(item.clubBadgeId)} alt="" width={32} height={32} sizes="32px" />
                            // External team logo URLs can be outside the configured Next image domains.
                            // eslint-disable-next-line @next/next/no-img-element
                            : item.logoUrl ? <img src={item.logoUrl} alt="" className={item.logoClassName} />
                            : <span>{item.title.slice(0, 1)}</span>}
                        </span>
                        <span className="bl-cmd-copy">
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                        </span>
                        {isRecent && <time className="bl-cmd-recent-date" dateTime={item.lastUsedAt}>{formatRecentDate(item.lastUsedAt)}</time>}
                        {item.badge && <em className="bl-cmd-badge">{item.badge}</em>}
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
            <div className="bl-cmd-ai-body">
              {aiMessages.length === 0 && (
                <div className="bl-cmd-ai-empty">Ask anything about the meta, brawlers, or maps.</div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`bl-cmd-ai-msg ${msg.role === "user" ? "bl-cmd-ai-user" : "bl-cmd-ai-bot"}`}>
                  {msg.role === "assistant" ? (
                    aiStreaming && i === aiMessages.length - 1 && msg.content === "" ? (
                      <span className="bl-cmd-ai-dots"><span /><span /><span /></span>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{msg.content}</ReactMarkdown>
                    )
                  ) : msg.content}
                  <div ref={i === aiMessages.length - 1 ? aiBottomRef : undefined} />
                </div>
              ))}
            </div>
            <div className="bl-cmd-ai-input">
              <textarea
                ref={aiInputRef}
                rows={1}
                value={aiInput}
                onChange={handleAiInput}
                onKeyDown={handleAiKeyDown}
                placeholder="Ask anything..."
                className="bl-cmd-ai-textarea"
              />
              {aiStreaming ? (
                <button type="button" onClick={() => aiAbortRef.current?.abort()} className="bl-cmd-ai-send" aria-label="Stop">
                  <Square size={10} strokeWidth={0} fill="currentColor" />
                </button>
              ) : (
                <button type="button" onClick={handleAiSubmit} disabled={!aiInput.trim()} className="bl-cmd-ai-send" aria-label="Send">
                  <ArrowUp size={13} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
