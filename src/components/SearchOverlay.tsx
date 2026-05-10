"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import { sanitizePlayerTag } from "@/lib/validation"

type SearchItem = {
  title: string
  subtitle: string
  href: string
  imageId?: number
  playerTag?: string
  logoUrl?: string
  logoClassName?: string
}

const searchGroups: { label: string; items: SearchItem[] }[] = [
  {
    label: "Brawlers",
    items: [
      { title: "Ash", subtitle: "Builds, stats & counters", href: "/brawlers/16000051", imageId: 16000051 },
      { title: "Kenji", subtitle: "Builds, stats & counters", href: "/brawlers/16000085", imageId: 16000085 },
      { title: "Moe", subtitle: "Builds, stats & counters", href: "/brawlers/16000084", imageId: 16000084 },
      { title: "Draco", subtitle: "Builds, stats & counters", href: "/brawlers/16000080", imageId: 16000080 },
      { title: "Cordelius", subtitle: "Builds, stats & counters", href: "/brawlers/16000070", imageId: 16000070 },
      { title: "Spike", subtitle: "Builds, stats & counters", href: "/brawlers/16000005", imageId: 16000005 },
      { title: "Shelly", subtitle: "Builds, stats & counters", href: "/brawlers/16000000", imageId: 16000000 },
    ],
  },
  {
    label: "Teams",
    items: [
      { title: "ZETA DIVISION", subtitle: "Pro team stats", href: "/leaderboards/pro/zeta", logoUrl: "/team-logos/zeta-transparent.png" },
      { title: "Crazy Raccoons", subtitle: "Pro team stats", href: "/leaderboards/pro/crazy-raccoons", logoUrl: "/team-logos/crazy-raccoons-transparent.png" },
      { title: "HMBLE", subtitle: "Pro team stats", href: "/leaderboards/pro/hmble", logoUrl: "https://hmble.it/images/logo/hmble-logo.png", logoClassName: "bl-search-result-logo-invert" },
    ],
  },
  {
    label: "Players",
    items: [
      { title: "Tensai", subtitle: "Pro player", href: "/player/9ULYPV8", playerTag: "9ULYPV8" },
      { title: "Moya", subtitle: "Pro player", href: "/player/UR2UL8YR", playerTag: "UR2UL8YR" },
      { title: "Yoshi", subtitle: "Pro player", href: "/player/CJV2PJ0R", playerTag: "CJV2PJ0R" },
    ],
  },
]

type PlayerProfile = {
  icon?: { id?: number }
}

function resolveSearchDestination(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return null

  const playerTag = sanitizePlayerTag(trimmed)
  if (playerTag) return `/player/${encodeURIComponent(playerTag)}`

  const normalized = trimmed.toLowerCase()
  if (normalized.includes("leader") || normalized.includes("rank") || normalized.includes("player")) return "/leaderboards/players"
  if (normalized.includes("club")) return "/leaderboards/clubs"
  if (normalized.includes("brawler") || normalized.includes("tier") || normalized.includes("build")) return "/brawlers"
  if (normalized.includes("map") || normalized.includes("meta") || normalized.includes("mode")) return "/meta"
  return `/brawlers?search=${encodeURIComponent(trimmed)}`
}

export default function SearchOverlay() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [playerIcons, setPlayerIcons] = useState<Record<string, number>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  const visible = open || closing

  const close = useCallback(() => {
    if (!open || closing) return
    setClosing(true)
    setOpen(false)
    closeTimerRef.current = window.setTimeout(() => {
      setClosing(false)
      closeTimerRef.current = null
    }, 180)
  }, [closing, open])

  const visibleSearchGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const groups = searchGroups.map(group => ({
      ...group,
      items: normalized
        ? group.items.filter(item => `${item.title} ${item.subtitle}`.toLowerCase().includes(normalized))
        : group.items,
    })).filter(group => group.items.length > 0)

    const tag = sanitizePlayerTag(query)
    if (tag) {
      return [
        {
          label: "Players",
          items: [{ title: `#${tag}`, subtitle: "Open player profile", href: `/player/${encodeURIComponent(tag)}`, playerTag: tag }],
        },
        ...groups.filter(group => group.label !== "Players"),
      ]
    }

    if (normalized && !groups.some(group => group.label === "Players")) {
      return [
        ...groups,
        {
          label: "Players",
          items: [{ title: query.trim(), subtitle: "Search player name or tag", href: `/leaderboards/players?search=${encodeURIComponent(query.trim())}` }],
        },
      ]
    }

    return groups
  }, [query])

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
    if (!open) return
    const tags = searchGroups
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
          const profile = await response.json() as PlayerProfile
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
  }, [open, playerIcons])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const destination = resolveSearchDestination(query)
    if (!destination) return
    close()
    router.push(destination)
  }

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
            placeholder="Search Brawler, Club, Pro..."
            autoCapitalize="characters"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search Brawler, Club, Pro, or player tag"
          />
          <button type="submit" aria-label="Search">
            <Search size={17} strokeWidth={2.4} />
          </button>
        </form>
        <div className="bl-search-modal-help">Write a brawler, pro player, or a player tag like #YP90U0YL</div>
        <div className="bl-search-modal-results">
          {visibleSearchGroups.map(group => (
            <section key={group.label} className="bl-search-result-group">
              <h3>{group.label}</h3>
              {group.items.map(item => {
                const iconId = item.playerTag ? playerIcons[item.playerTag] : null
                return (
                  <Link key={`${group.label}-${item.title}`} href={item.href} className="bl-search-result-row" onClick={close}>
                    <span className="bl-search-result-icon">
                      {item.imageId ? (
                        <BrawlImage src={brawlerIconUrl(item.imageId)} alt="" width={34} height={34} sizes="34px" />
                      ) : iconId ? (
                        <BrawlImage src={profileIconUrl(iconId)} alt="" width={34} height={34} sizes="34px" />
                      ) : item.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.logoUrl} alt="" className={item.logoClassName} />
                      ) : (
                        <span>{item.title.slice(0, 1)}</span>
                      )}
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
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
