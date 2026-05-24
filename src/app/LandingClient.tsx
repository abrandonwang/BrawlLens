"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowRight, ArrowUp, X } from "lucide-react"
import { PulsingBorder } from "@paper-design/shaders-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import { BrawlImage, brawlerIconUrl, profileIconUrl } from "@/components/BrawlImage"
import { formatTrophies } from "@/lib/format"
import { leaderboardRegionShort } from "@/lib/leaderboardRegions"
import { getModeName } from "@/lib/modes"

const DATA_TOPICS = ["players", "brawlers", "maps", "upgrades"]
const LANDING_PROMPT_BORDER_COLORS = ["#0dc1fd", "#d915ef", "#ff3f2ecc"]
const LANDING_PROMPT_LAYER_STYLE: CSSProperties = { zIndex: 2 }
const LANDING_CHAT_BODY_LAYER_STYLE: CSSProperties = { position: "relative", zIndex: 2 }

const landingMarkdownComponents: Components = {
  p: ({ children }) => <p className="bl-landing-chat-p">{children}</p>,
  strong: ({ children }) => <strong className="bl-landing-chat-strong">{children}</strong>,
  em: ({ children }) => <em className="bl-landing-chat-em">{children}</em>,
  ul: ({ children }) => <ul className="bl-landing-chat-list">{children}</ul>,
  ol: ({ children }) => <ol className="bl-landing-chat-list">{children}</ol>,
  li: ({ children }) => <li className="bl-landing-chat-li">{children}</li>,
  a: ({ href, children }) => <Link href={href ?? "/"} className="bl-landing-chat-link">{children}</Link>,
  code: ({ children }) => <code className="bl-landing-chat-code">{children}</code>,
}

type LandingPlayer = {
  rank: number
  player_tag: string
  player_name: string
  trophies: number
  club_name: string | null
  iconId?: number | null
}

type LandingRegion = {
  code: string
  label: string
  players: LandingPlayer[]
}

type BrawlerStats = {
  id: number
  name: string
  picks: number
  wins: number
  winRate: number | null
}

type TierPreviewRow = {
  id: number
  name: string
  tier: { label: string; color: string }
  winRate: number | null
  pickRate: number
}

type ModeInfo = {
  mode: string
  totalBattles: number
  maps: { name: string; battles: number }[]
}

type MapBrawlerPreview = {
  brawlerId: number
  name: string
  picks: number
  winRate: number
}

type MapPreviewRow = {
  name: string
  mode: string
  battles: number
  best: MapBrawlerPreview | null
}

type LandingChatMessage = {
  role: "user" | "assistant"
  content: string
}

function getPreviewTier(winRate: number | null | undefined, picks: number) {
  if (winRate == null || Number.isNaN(winRate) || picks < 10) return { label: "-", color: "#69758d" }
  if (winRate >= 58) return { label: "S+", color: "#f5d75e" }
  if (winRate >= 54) return { label: "S", color: "#a78bff" }
  if (winRate >= 51) return { label: "A", color: "#7dd3fc" }
  if (winRate >= 48) return { label: "B", color: "#e2e6ee" }
  if (winRate >= 45) return { label: "C", color: "#ffb38a" }
  return { label: "D", color: "#ff7878" }
}

function getPreviewWinRateColor(winRate: number | null | undefined) {
  if (winRate == null || Number.isNaN(winRate)) return "rgba(245, 244, 241, 0.72)"
  if (winRate >= 60) return "#f5d75e"
  if (winRate >= 50) return "#a78bff"
  if (winRate >= 45) return "#7dd3fc"
  return "#ff7878"
}

function previewWinRateStyle(winRate: number | null | undefined): CSSProperties {
  return { "--preview-win-color": getPreviewWinRateColor(winRate) } as CSSProperties
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "-"
  return `${value.toFixed(1)}%`
}

function cleanTag(tag: string) {
  return tag.replace(/^#/, "")
}

function playerHref(tag: string) {
  return `/player/${encodeURIComponent(cleanTag(tag))}`
}

function mapHref(name: string) {
  return `/meta/${encodeURIComponent(name)}`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? "?").toUpperCase()
}

export default function LandingClient() {
  const [leaderRegions, setLeaderRegions] = useState<LandingRegion[]>([])
  const [activeLeaderboardRegion, setActiveLeaderboardRegion] = useState("")
  const [tierPreview, setTierPreview] = useState<TierPreviewRow[]>([])
  const [mapPreview, setMapPreview] = useState<MapPreviewRow[]>([])
  const [landingQuery, setLandingQuery] = useState("")
  const [typedTopic, setTypedTopic] = useState("")
  const [typedTopicIndex, setTypedTopicIndex] = useState(0)
  const [typewriterPhase, setTypewriterPhase] = useState<"typing" | "hold" | "deleting">("typing")
  const [landingChatMessages, setLandingChatMessages] = useState<LandingChatMessage[]>([])
  const [landingChatExpanded, setLandingChatExpanded] = useState(false)
  const [landingChatStreaming, setLandingChatStreaming] = useState(false)
  const landingChatAbortRef = useRef<AbortController | null>(null)
  const landingChatBottomRef = useRef<HTMLDivElement>(null)
  const landingPromptResetRef = useRef<number | null>(null)
  const activeRegion = leaderRegions.find(region => region.code === activeLeaderboardRegion) ?? leaderRegions[0]
  const landingPromptHasValue = landingQuery.trim().length > 0
  const landingPromptBorderStyle = useMemo<CSSProperties>(() => ({
    position: "absolute",
    inset: 0,
    zIndex: 1,
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
    borderRadius: "inherit",
    pointerEvents: "none",
    opacity: landingChatExpanded ? 0.8 : 1,
    transition: "opacity 260ms ease",
  }), [landingChatExpanded])

  useEffect(() => {
    document.documentElement.classList.add("landing-bg", "home-landing-bg")
    return () => document.documentElement.classList.remove("landing-bg", "home-landing-bg")
  }, [])

  useEffect(() => {
    return () => {
      landingChatAbortRef.current?.abort()
      if (landingPromptResetRef.current) window.clearTimeout(landingPromptResetRef.current)
    }
  }, [])

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTypedTopic(DATA_TOPICS[0])
      return
    }

    const topic = DATA_TOPICS[typedTopicIndex]
    let timeout = 82

    if (typewriterPhase === "typing") {
      if (typedTopic.length < topic.length) {
        timeout = 76
      } else {
        timeout = 980
      }
    } else if (typewriterPhase === "hold") {
      timeout = 820
    } else {
      timeout = 38
    }

    const timer = window.setTimeout(() => {
      if (typewriterPhase === "typing") {
        if (typedTopic.length < topic.length) {
          setTypedTopic(topic.slice(0, typedTopic.length + 1))
        } else {
          setTypewriterPhase("hold")
        }
        return
      }

      if (typewriterPhase === "hold") {
        setTypewriterPhase("deleting")
        return
      }

      if (typedTopic.length > 0) {
        setTypedTopic(topic.slice(0, typedTopic.length - 1))
      } else {
        setTypedTopicIndex(index => (index + 1) % DATA_TOPICS.length)
        setTypewriterPhase("typing")
      }
    }, timeout)

    return () => window.clearTimeout(timer)
  }, [typedTopic, typedTopicIndex, typewriterPhase])

  useEffect(() => {
    let cancelled = false

    async function loadLeaderboards() {
      try {
        const response = await fetch("/api/leaderboards/top?limit=5&regions=US,JP,KR&icons=1")
        if (!response.ok) return
        const payload = await response.json() as { regions?: LandingRegion[] }
        const regions = payload.regions ?? []
        const preferred = ["US", "JP", "KR"]
        const selected: LandingRegion[] = []

        for (const code of preferred) {
          const match = regions.find(region => region.code.toUpperCase() === code)
          if (match?.players.length) selected.push(match)
        }

        for (const region of regions) {
          if (selected.length >= 3) break
          if (region.code === "global" || !region.players.length || selected.some(item => item.code === region.code)) continue
          selected.push(region)
        }

        if (selected.length < 3) {
          for (const region of regions) {
            if (selected.length >= 3) break
            if (!region.players.length || selected.some(item => item.code === region.code)) continue
            selected.push(region)
          }
        }

        if (cancelled) return
        setLeaderRegions(selected.slice(0, 3))
        setActiveLeaderboardRegion(current =>
          current && selected.some(region => region.code === current)
            ? current
            : selected[0]?.code ?? "",
        )
      } catch {
        if (!cancelled) setLeaderRegions([])
      }
    }

    loadLeaderboards()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTierPreview() {
      try {
        const response = await fetch("/api/brawlers/stats")
        if (!response.ok) return
        const payload = await response.json() as { stats?: Record<string, BrawlerStats> }
        const stats = Object.values(payload.stats ?? {})
        const totalPicks = stats.reduce((sum, stat) => sum + (Number(stat.picks) || 0), 0)
        const rows = stats
          .map(stat => {
            const picks = Number(stat.picks) || 0
            const winRate = stat.winRate == null ? null : Number(stat.winRate)
            const pickRate = totalPicks > 0 ? (picks / totalPicks) * 100 : 0
            return {
              id: Number(stat.id),
              name: stat.name,
              tier: getPreviewTier(winRate, picks),
              winRate,
              pickRate,
            }
          })
          .filter(row => row.winRate != null && row.pickRate >= 1)
          .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
          .slice(0, 5)

        if (!cancelled) setTierPreview(rows)
      } catch {
        if (!cancelled) setTierPreview([])
      }
    }

    loadTierPreview()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMapPreview() {
      try {
        const response = await fetch("/api/meta")
        if (!response.ok) return
        const payload = await response.json() as { modes?: ModeInfo[] }
        const maps = (payload.modes ?? [])
          .filter(mode => mode.mode.toLowerCase() !== "unknown")
          .flatMap(mode => mode.maps
            .filter(map => map.name.toLowerCase() !== "unknown")
            .map(map => ({ name: map.name, mode: mode.mode, battles: Number(map.battles) || 0 })),
          )
          .sort((a, b) => b.battles - a.battles)
          .slice(0, 5)

        const rows = await Promise.all(maps.map(async map => {
          try {
            const mapResponse = await fetch(`/api/meta?map=${encodeURIComponent(map.name)}`)
            if (!mapResponse.ok) return { ...map, best: null }
            const mapPayload = await mapResponse.json() as { brawlers?: MapBrawlerPreview[] }
            const best = (mapPayload.brawlers ?? [])
              .filter(brawler => brawler.picks >= 20 && Number.isFinite(brawler.winRate))
              .sort((a, b) => b.winRate - a.winRate)[0] ?? null
            return { ...map, best }
          } catch {
            return { ...map, best: null }
          }
        }))

        if (!cancelled) setMapPreview(rows)
      } catch {
        if (!cancelled) setMapPreview([])
      }
    }

    loadMapPreview()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (landingChatExpanded) {
      landingChatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [landingChatExpanded, landingChatMessages])

  const sendLandingMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed || landingChatStreaming) return

    if (landingPromptResetRef.current) {
      window.clearTimeout(landingPromptResetRef.current)
      landingPromptResetRef.current = null
    }

    const userMessage: LandingChatMessage = { role: "user", content: trimmed }
    const history = [...landingChatMessages, userMessage]
    setLandingChatExpanded(true)
    setLandingQuery("")
    setLandingChatMessages([...history, { role: "assistant", content: "" }])
    setLandingChatStreaming(true)

    const controller = new AbortController()
    landingChatAbortRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          pageContext: {
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            headings: ["BrawlLens"],
            visibleText: "BrawlLens landing page with leaderboard, tier list, and map meta previews.",
          },
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        setLandingChatMessages([...history, { role: "assistant", content: "Sorry, I’m having trouble connecting right now. Please try again in a moment." }])
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value, { stream: true })
        setLandingChatMessages([...history, { role: "assistant", content: fullText }])
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setLandingChatMessages([...history, { role: "assistant", content: "Sorry, I’m having trouble connecting right now. Please try again in a moment." }])
      }
    } finally {
      setLandingChatStreaming(false)
      landingChatAbortRef.current = null
    }
  }, [landingChatMessages, landingChatStreaming])

  function submitLandingSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendLandingMessage(landingQuery)
  }

  function handleLandingPromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      void sendLandingMessage(landingQuery)
    }
  }

  function handleLandingPromptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setLandingQuery(event.target.value)
  }

  function closeLandingChat() {
    landingChatAbortRef.current?.abort()
    setLandingChatStreaming(false)
    setLandingChatExpanded(false)
    setLandingQuery("")
    landingPromptResetRef.current = window.setTimeout(() => {
      setLandingChatMessages([])
      landingPromptResetRef.current = null
    }, 320)
  }

  return (
    <main className="bl-landing-shell">
      <section className="bl-landing-stage" aria-label="BrawlLens search">
        <div className="bl-landing-brand-wrap">
          <h1 className="bl-landing-text-logo" data-text="BrawlLens">BrawlLens</h1>
        </div>

        <div className="bl-landing-track">
          <p className="bl-landing-line" aria-live="polite">
            Data for <span className="bl-landing-typeword">{typedTopic || "\u00a0"}</span>
          </p>
          <form
            className={`bl-landing-prompt-form${landingPromptHasValue ? " has-value" : ""}${landingChatExpanded ? " is-expanded" : ""}${landingChatStreaming ? " is-streaming" : ""}`}
            onSubmit={submitLandingSearch}
          >
            <PulsingBorder
              aria-hidden="true"
              className="bl-landing-prompt-border-shader"
              style={landingPromptBorderStyle}
              colors={LANDING_PROMPT_BORDER_COLORS}
              colorBack="#00000000"
              roundness={landingChatExpanded ? 0.1 : 0.32}
              thickness={0.1}
              softness={0.75}
              intensity={0.2}
              bloom={0.25}
              spots={4}
              spotSize={0.5}
              pulse={0.25}
              smoke={0.3}
              smokeSize={0.6}
              speed={1}
              scale={1}
            />
            {landingChatExpanded && (
              <>
                <button type="button" className="bl-landing-chat-close" aria-label="Close chat" onClick={closeLandingChat}>
                  <X size={18} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <div className="bl-landing-chat-body" style={LANDING_CHAT_BODY_LAYER_STYLE} aria-live="polite">
                  {landingChatMessages.map((message, index) => (
                    <div key={index} className={`bl-landing-chat-message is-${message.role}`}>
                      <div className="bl-landing-chat-bubble">
                        {message.role === "assistant" ? (
                          landingChatStreaming && index === landingChatMessages.length - 1 && message.content === "" ? (
                            <span className="bl-landing-chat-dots" aria-label="Thinking"><span /><span /><span /></span>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={landingMarkdownComponents}>{message.content}</ReactMarkdown>
                          )
                        ) : message.content}
                      </div>
                    </div>
                  ))}
                  <div ref={landingChatBottomRef} />
                </div>
              </>
            )}
            <div className="bl-landing-prompt-inputbar" style={LANDING_PROMPT_LAYER_STYLE}>
              <textarea
                value={landingQuery}
                onChange={handleLandingPromptChange}
                onKeyDown={handleLandingPromptKeyDown}
                aria-label="Landing prompt"
                autoComplete="off"
                placeholder="Tell us what you're looking for..."
                rows={landingChatExpanded ? 1 : 3}
                spellCheck={false}
              />
              <button type="submit" aria-label="Send message" disabled={!landingQuery.trim() || landingChatStreaming}>
                {landingChatStreaming ? (
                  <span className="bl-landing-send-pulse" aria-hidden="true" />
                ) : (
                  <ArrowUp size={18} strokeWidth={2.7} aria-hidden="true" />
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="bl-landing-showcase" aria-label="BrawlLens previews">
        <div className="bl-landing-preview-card bl-landing-leader-card">
          <div className="bl-preview-tabs" aria-label="Leaderboard regions">
            {leaderRegions.map(region => (
              <button
                key={region.code}
                type="button"
                className={region.code === activeRegion?.code ? "is-active" : ""}
                onClick={() => setActiveLeaderboardRegion(region.code)}
              >
                {leaderboardRegionShort(region.code)}
              </button>
            ))}
          </div>

          <div className="bl-preview-head bl-preview-head-leaders">
            <span>Player</span>
            <span>Trophies</span>
            <span>Rank</span>
          </div>

          <div className="bl-preview-rows">
            {(activeRegion?.players ?? []).map(row => (
              <Link key={row.player_tag} href={playerHref(row.player_tag)} className="bl-preview-row bl-preview-leader-row bl-preview-player-link">
                <span className="bl-preview-avatar">
                  {row.iconId ? (
                    <BrawlImage src={profileIconUrl(row.iconId)} alt="" width={30} height={30} sizes="30px" />
                  ) : initials(row.player_name)}
                </span>
                <span className="bl-preview-player">
                  <strong>{row.player_name}</strong>
                  <small>{row.club_name || `#${cleanTag(row.player_tag)}`}</small>
                </span>
                <strong className="bl-preview-trophies">{formatTrophies(Number(row.trophies) || 0)}</strong>
                <strong className="bl-preview-region-rank">#{row.rank}</strong>
              </Link>
            ))}
          </div>
        </div>

        <div className="bl-landing-preview-card bl-landing-tier-card">
          <Link href="/brawlers" className="bl-preview-title">Season 50 Tierlist &amp; Builds <ArrowRight size={17} strokeWidth={2.7} /></Link>
          <div className="bl-preview-head bl-preview-head-tier">
            <span>Brawler</span>
            <span>Tier</span>
            <span>Winrate</span>
            <span>Pickrate</span>
          </div>

          <div className="bl-preview-rows">
            {tierPreview.map(row => (
              <div key={row.id} className="bl-preview-row bl-preview-tier-row">
                <Link href={`/brawlers/${row.id}`} className="bl-preview-brawler bl-preview-brawler-link">
                  <BrawlImage src={brawlerIconUrl(row.id)} alt="" width={44} height={44} sizes="44px" />
                  <strong>{row.name}</strong>
                </Link>
                <strong className="bl-preview-tier" style={{ color: row.tier.color }}>{row.tier.label}</strong>
                <span className="bl-preview-rate">
                  <strong style={previewWinRateStyle(row.winRate)}>{formatPercent(row.winRate)}</strong>
                </span>
                <strong className="bl-preview-pick">{formatPercent(row.pickRate)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="bl-landing-preview-card bl-landing-map-card">
          <Link href="/meta" className="bl-preview-title">Map Meta Snapshot <ArrowRight size={17} strokeWidth={2.7} /></Link>
          <div className="bl-preview-head bl-preview-head-map">
            <span>Map</span>
            <span>Mode</span>
            <span>Best</span>
            <span>WR</span>
          </div>

          <div className="bl-preview-rows">
            {mapPreview.map(row => (
              <Link key={`${row.mode}-${row.name}`} href={mapHref(row.name)} className="bl-preview-row bl-preview-map-row">
                <span className="bl-preview-map-name">
                  <strong>{row.name}</strong>
                  <small>{row.battles.toLocaleString()} battles</small>
                </span>
                <span className="bl-preview-mode">{getModeName(row.mode)}</span>
                <span className="bl-preview-map-brawler">
                  {row.best ? (
                    <>
                      <BrawlImage src={brawlerIconUrl(row.best.brawlerId)} alt="" width={30} height={30} sizes="30px" />
                      <strong>{row.best.name}</strong>
                    </>
                  ) : "-"}
                </span>
                <strong className="bl-preview-map-win" style={previewWinRateStyle(row.best?.winRate)}>{row.best ? `${row.best.winRate.toFixed(1)}%` : "-"}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
