"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { SkeletonBlock, StateButton } from "@/components/PolishStates"
import { formatTrophies } from "@/lib/format"
import { getModeName } from "@/lib/modes"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map:    { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
}

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const [compactPlaceholder, setCompactPlaceholder] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
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
    router.push(`/chat?q=${encodeURIComponent(q)}`)
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
      label: "LEADERBOARD",
      sub: "Global top 200 players",
      href: "/leaderboards/players",
    },
  ]

  return (
    <main className="home-hero">
      <div className="hero-bg hero-bg-b" />
      <div className="home-hero-inner">
        <div className="home-center home-card-enter">
          <div className="home-card-wrap">
            <div className="home-card-shell">
              <div className="home-ask-box">
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
                  <span>↵</span>
                </button>
              </div>

              <div className="home-shortcuts">
                <Link href="/brawlers">Brawlers</Link>
                <Link href="/meta">Maps</Link>
                <Link href="/leaderboards">Leaderboards</Link>
              </div>

              {dataError && (
                <div className="mb-2 flex items-center justify-between gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2">
                  <span className="text-[12px] font-medium text-[var(--ink-3)]">Live landing stats could not load.</span>
                  <StateButton onClick={loadLandingData}>Retry</StateButton>
                </div>
              )}

              <div className="home-jump-grid">
                {jumps.map((row, index) => (
                  <Link
                    key={row.label}
                    href={row.href}
                    className="home-jump-card"
                  >
                    <span className="home-jump-mark">{String(index + 1).padStart(2, "0")}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="bl-caption" style={{ letterSpacing: "0.1em", marginBottom: 2 }}>{row.label}</div>
                      {dataLoading ? (
                        <SkeletonBlock className="mt-1 h-[13px] w-[min(150px,75%)]" />
                      ) : dataError && index < 3 ? (
                        <div className="truncate text-[12px] font-medium text-[var(--ink-4)]">Open section</div>
                      ) : row.sub ? (
                        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.sub}</div>
                      ) : (
                        <div className="text-[12px] font-medium text-[var(--ink-4)]">Open section</div>
                      )}
                    </div>
                    <ArrowRight size={14} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

    </main>
  )
}
