"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map:    { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
}

function formatTrophies(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toString()
}

const MODE_LABELS: Record<string, string> = {
  brawlBall: "Brawl Ball", gemGrab: "Gem Grab", knockout: "Knockout",
  bounty: "Bounty", heist: "Heist", hotZone: "Hot Zone", wipeout: "Wipeout",
  duels: "Duels", siege: "Siege", soloShowdown: "Showdown", duoShowdown: "Duo SD",
  trioShowdown: "Trio SD", payload: "Payload", basketBrawl: "Basket Brawl",
  volleyBrawl: "Volley Brawl", botDrop: "Bot Drop", hunters: "Hunters",
  trophyEscape: "Trophy Escape", paintBrawl: "Paint Brawl", wipeout5V5: "5v5 Wipeout",
}

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const [data, setData] = useState<LandingData | null>(null)
  useEffect(() => {
    fetch("/api/landing")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
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
      sub: data?.map ? `${data.map.name} · ${MODE_LABELS[data.map.mode] ?? data.map.mode}` : null,
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
                  placeholder="Ask anything, or paste a #PlayerTag"
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
                      {row.sub ? (
                        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.sub}</div>
                      ) : (
                        <div style={{ height: 13, width: 120, borderRadius: 4, background: "var(--line-2)", marginTop: 2 }} />
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
