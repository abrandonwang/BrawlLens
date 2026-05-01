"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { SkeletonBlock } from "@/components/PolishStates"
import { formatTrophies } from "@/lib/format"
import { getModeName } from "@/lib/modes"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map:    { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
  club:   { name: string; tag: string; trophies: number } | null
}

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const [compactPlaceholder, setCompactPlaceholder] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [data, setData] = useState<LandingData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(false)

  function loadLandingData() {
    setDataLoading(true)
    setDataError(false)
    fetch("/api/landing")
      .then(r => {
        if (!r.ok) throw new Error("landing fetch failed")
        return r.json()
      })
      .then(setData)
      .catch(() => setDataError(true))
      .finally(() => setDataLoading(false))
  }

  useEffect(() => {
    loadLandingData()
  }, [])

  useEffect(() => {
    document.documentElement.classList.add("landing-bg")
    return () => document.documentElement.classList.remove("landing-bg")
  }, [])

  useEffect(() => {
    const query = window.matchMedia("(max-width: 460px)")
    const update = () => setCompactPlaceholder(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setUserInput(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit() {
    const q = userInput.trim()
    if (!q) return
    setUserInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    window.dispatchEvent(new CustomEvent("brawllens:open-assistant", { detail: { query: q } }))
  }

  const jumps = [
    {
      label: "TOP PLAYER",
      sub: data?.player
        ? `${data.player.name} · ${formatTrophies(data.player.trophies)} trophies`
        : null,
      href: data?.player ? `/player/${data.player.tag.replace(/^#/, "")}` : "/leaderboards/players",
    },
    {
      label: "TOP BRAWLER",
      sub: data?.brawler
        ? `${data.brawler.name} · ${data.brawler.winRate.toFixed(1)}% win rate`
        : null,
      href: data?.brawler ? `/brawlers?open=${data.brawler.id}` : "/brawlers",
    },
    {
      label: "TOP MAP",
      sub: data?.map ? `${data.map.name} · ${getModeName(data.map.mode)}` : null,
      href: data?.map ? `/meta?open=${encodeURIComponent(data.map.name)}` : "/meta",
    },
    {
      label: "TOP CLUB",
      sub: data?.club
        ? `${data.club.name} · ${formatTrophies(data.club.trophies)} trophies`
        : null,
      href: "/leaderboards/clubs",
    },
  ]

  return (
    <main className="overview-landing">
      <div className="hero-bg hero-bg-b" />
      <section className="overview-landing-inner home-card-enter">
        <div className="overview-command-panel">
          <div className="overview-ask-box">
            <Search size={16} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
            <textarea
              ref={textareaRef}
              rows={1}
              value={userInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={compactPlaceholder ? "Ask anything..." : "Ask anything, or paste a #PlayerTag"}
              className="home-ask-input"
            />
            <button className="home-send-btn" onClick={handleSubmit} aria-label="Ask">
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="overview-shortcuts">
            <Link href="/brawlers">Brawlers</Link>
            <Link href="/meta">Maps</Link>
            <Link href="/leaderboards">Leaderboards</Link>
          </div>

          <div className="overview-jump-grid">
            {jumps.map((row, index) => {
              const showRetry = !dataLoading && dataError && !row.sub
              return (
                <Link key={row.label} href={row.href} className="overview-jump-card">
                  <span className="home-jump-mark">{String(index + 1).padStart(2, "0")}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="bl-caption" style={{ marginBottom: 4 }}>{row.label}</div>
                    {dataLoading ? (
                      <SkeletonBlock className="mt-1 h-[13px] w-[min(150px,75%)]" />
                    ) : showRetry ? (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); loadLandingData() }}
                        className="cursor-pointer border-0 bg-transparent p-0 text-left text-[12px] font-medium text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                      >
                        Could not load — retry
                      </button>
                    ) : row.sub ? (
                      <div className="overview-jump-value">{row.sub}</div>
                    ) : (
                      <div className="text-[12px] font-medium text-[var(--ink-4)]">Open section</div>
                    )}
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
