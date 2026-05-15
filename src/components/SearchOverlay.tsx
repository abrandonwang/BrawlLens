"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import { clubBadgeUrl, clubDetailHref, playerProfileHref } from "@/lib/leaderboardUtils"
import { sanitizePlayerTag } from "@/lib/validation"

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

  return {
    title: name,
    subtitle,
    href: playerProfileHref(tag),
    kind: "player",
    playerTag: tag,
    iconId: player.iconId ?? null,
    badge: typeof player.rank === "number" ? `#${player.rank}` : "Player",
  }
}

function clubItemFromRemote(club: RemoteClub, fallbackTag?: string): SearchItem | null {
  const tag = cleanTag(club.tag ?? club.club_tag ?? fallbackTag)
  if (!tag) return null
  const name = club.name ?? club.club_name ?? `#${tag}`
  const trophies = formatNumber(club.trophies)
  const members = club.memberCount ?? club.member_count
  const subtitle = [
    `#${tag}`,
    trophies ? `${trophies} trophies` : null,
    typeof members === "number" ? `${members} members` : null,
  ].filter(Boolean).join(" · ")

  return {
    title: name,
    subtitle,
    href: clubDetailHref(tag),
    kind: "club",
    clubBadgeId: club.badgeId ?? null,
    badge: typeof club.rank === "number" ? `#${club.rank}` : "Club",
  }
}

function fallbackPlayerItem(query: string): SearchItem | null {
  const trimmed = query.trim()
  if (!trimmed) return null
  const tag = sanitizePlayerTag(trimmed)
  if (tag) {
    return {
      title: `#${tag}`,
      subtitle: "Open player profile",
      href: playerProfileHref(tag),
      kind: "player",
      playerTag: tag,
      badge: "Player",
    }
  }
  return {
    title: trimmed,
    subtitle: "Search player leaderboard",
    href: `/leaderboards/players?search=${encodeURIComponent(trimmed)}`,
    kind: "player",
    badge: "Players",
  }
}

function loadRecentSearches(): SearchItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]") as SearchItem[]
    return parsed
      .filter(item => item?.href && item?.title && (item.kind === "player" || item.kind === "club"))
      .slice(0, 5)
  } catch {
    return []
  }
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
    } catch {
      // Keep the keystroke path fast even if live search cannot resolve the tag.
    }
    return playerProfileHref(playerTag)
  }

  const normalized = trimmed.toLowerCase()
  if (normalized.includes("club")) return "/leaderboards/clubs"
  if (normalized.includes("brawler") || normalized.includes("tier") || normalized.includes("build")) return "/brawlers"
  if (normalized.includes("map") || normalized.includes("meta") || normalized.includes("mode")) return "/meta"
  return `/leaderboards/players?search=${encodeURIComponent(trimmed)}`
}

export default function SearchOverlay() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [playerIcons, setPlayerIcons] = useState<Record<string, number>>({})
  const [remoteSearch, setRemoteSearch] = useState<RemoteSearchPayload | null>(null)
  const [remoteState, setRemoteState] = useState<RemoteSearchState>("idle")
  const [recentItems, setRecentItems] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  const visible = open || closing
  const trimmedQuery = query.trim()

  const close = useCallback(() => {
    if (!open || closing) return
    setClosing(true)
    setOpen(false)
    closeTimerRef.current = window.setTimeout(() => {
      setClosing(false)
      closeTimerRef.current = null
    }, 180)
  }, [closing, open])

  useEffect(() => {
    setRecentItems(loadRecentSearches())
  }, [])

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

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!visible) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [close, visible])

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) {
      setRemoteSearch(null)
      setRemoteState("idle")
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setRemoteState("loading")
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (!response.ok) {
          setRemoteSearch(null)
          setRemoteState("error")
          return
        }
        const payload = await response.json() as RemoteSearchPayload
        setRemoteSearch(payload)
        setRemoteState("ready")
      } catch (error) {
        if (!controller.signal.aborted) {
          setRemoteSearch(null)
          setRemoteState("error")
        }
      }
    }, 180)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [open, trimmedQuery])

  const visibleSearchGroups = useMemo(() => {
    const normalized = trimmedQuery.toLowerCase()
    const tag = sanitizePlayerTag(trimmedQuery)

    if (!normalized) {
      return [
        ...(recentItems.length ? [{ label: "Recent", items: recentItems }] : []),
        ...searchGroups,
      ]
    }

    const staticPlayerItems = searchGroups
      .find(group => group.label === "Players")
      ?.items.filter(item => itemMatches(item, normalized)) ?? []
    const staticGroups = searchGroups
      .filter(group => group.label !== "Players")
      .map(group => ({
        ...group,
        items: group.items.filter(item => itemMatches(item, normalized)),
      }))
      .filter(group => group.items.length > 0)

    const remotePlayerItems = uniqueItems([
      remoteSearch?.tagMatches?.player ? playerItemFromRemote(remoteSearch.tagMatches.player, tag ?? undefined) : null,
      ...(remoteSearch?.players ?? []).map(player => playerItemFromRemote(player)),
      ...staticPlayerItems,
      fallbackPlayerItem(trimmedQuery),
    ].filter((item): item is SearchItem => Boolean(item)))

    const remoteClubItems = uniqueItems([
      remoteSearch?.tagMatches?.club ? clubItemFromRemote(remoteSearch.tagMatches.club, tag ?? undefined) : null,
      ...(remoteSearch?.clubs ?? []).map(club => clubItemFromRemote(club)),
      tag && remoteState === "ready" && !remoteSearch?.tagMatches?.club
        ? {
            title: `#${tag}`,
            subtitle: "Search club leaderboard",
            href: `/leaderboards/clubs?search=${encodeURIComponent(tag)}`,
            kind: "club" as const,
            badge: "Club",
          }
        : null,
    ].filter((item): item is SearchItem => Boolean(item)))

    return [
      { label: "Players", items: remotePlayerItems },
      ...(remoteClubItems.length ? [{ label: "Clubs", items: remoteClubItems }] : []),
      ...staticGroups,
    ].filter(group => group.items.length > 0)
  }, [recentItems, remoteSearch, remoteState, trimmedQuery])

  const primaryResult = useMemo(
    () => visibleSearchGroups.flatMap(group => group.items)[0] ?? null,
    [visibleSearchGroups],
  )

  useEffect(() => {
    if (!open) return
    const tags = visibleSearchGroups
      .flatMap(group => group.items)
      .map(item => item.playerTag)
      .filter((tag): tag is string => Boolean(tag && !playerIcons[tag]))

    if (!tags.length) return
    let cancelled = false

    async function loadIcons() {
      const entries = await Promise.all(tags.map(async tag => {
        try {
          const response = await fetch(`/api/player?tag=${encodeURIComponent(tag)}`)
          if (!response.ok) return null
          const profile = await response.json() as { icon?: { id?: number } }
          return profile.icon?.id ? [tag, profile.icon.id] as const : null
        } catch {
          return null
        }
      }))

      if (cancelled) return
      setPlayerIcons(current => ({
        ...current,
        ...Object.fromEntries(entries.filter((entry): entry is readonly [string, number] => Boolean(entry))),
      }))
    }

    loadIcons()
    return () => {
      cancelled = true
    }
  }, [open, playerIcons, visibleSearchGroups])

  function rememberSearchItem(item: SearchItem) {
    if (item.kind !== "player" && item.kind !== "club") return
    const stored: SearchItem = {
      title: item.title,
      subtitle: item.subtitle,
      href: item.href,
      kind: item.kind,
      playerTag: item.playerTag,
      iconId: item.iconId ?? null,
      clubBadgeId: item.clubBadgeId ?? null,
      badge: item.badge,
    }
    const next = uniqueItems([stored, ...recentItems]).slice(0, 5)
    setRecentItems(next)
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const destination = primaryResult?.href ?? await resolveSearchDestination(query)
    if (!destination) return
    if (primaryResult) rememberSearchItem(primaryResult)
    close()
    router.push(destination)
  }

  const statusText = useMemo(() => {
    if (!trimmedQuery) return recentItems.length ? "Recent profiles and quick jumps" : "Players, brawlers, clubs, teams"
    if (remoteState === "loading") return sanitizePlayerTag(trimmedQuery) ? `Resolving #${sanitizePlayerTag(trimmedQuery)}` : "Searching players"
    if (remoteState === "error") return "Live search is unavailable; local shortcuts remain ready"
    if (!primaryResult) return "No matching result"
    return primaryResult.kind === "player" ? "Player match ready" : `${primaryResult.badge ?? "Result"} match ready`
  }, [primaryResult, recentItems.length, remoteState, trimmedQuery])

  if (!visible) return null

  return (
    <div className={`bl-search-modal-layer ${closing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Search BrawlLens">
      <button className="bl-search-modal-backdrop" type="button" aria-label="Close search" onClick={close} />
      <div className="bl-search-modal">
        <form onSubmit={submit} className="bl-search-modal-form">
          <input
            ref={inputRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search player name, tag, club, brawler..."
            autoCapitalize="characters"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search player name, tag, club, brawler, or pro team"
          />
          <button type="submit" aria-label="Search">
            <Search size={17} strokeWidth={2.4} />
          </button>
        </form>
        <div className="bl-search-modal-help" data-state={remoteState}>{statusText}</div>
        <div className="bl-search-modal-results">
          {visibleSearchGroups.map(group => (
            <section key={group.label} className="bl-search-result-group">
              <h3>{group.label}</h3>
              {group.items.map(item => {
                const iconId = item.iconId ?? (item.playerTag ? playerIcons[item.playerTag] : null)
                return (
                  <Link
                    key={`${group.label}-${item.kind}-${item.href}-${item.title}`}
                    href={item.href}
                    className="bl-search-result-row"
                    onClick={() => {
                      rememberSearchItem(item)
                      close()
                    }}
                  >
                    <span className={`bl-search-result-icon bl-search-result-icon-${item.kind}`}>
                      {item.imageId ? (
                        <BrawlImage src={brawlerIconUrl(item.imageId)} alt="" width={36} height={36} sizes="36px" />
                      ) : iconId ? (
                        <BrawlImage src={profileIconUrl(iconId)} alt="" width={36} height={36} sizes="36px" />
                      ) : item.clubBadgeId ? (
                        <BrawlImage src={clubBadgeUrl(item.clubBadgeId)} alt="" width={36} height={36} sizes="36px" />
                      ) : item.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.logoUrl} alt="" className={item.logoClassName} />
                      ) : (
                        <span>{item.title.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="bl-search-result-copy">
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    {item.badge && <em className="bl-search-result-badge">{item.badge}</em>}
                  </Link>
                )
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
