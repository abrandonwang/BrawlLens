"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface LandingData {
  player: { name: string; tag: string; trophies: number } | null
  map:    { name: string; mode: string } | null
  brawler: { name: string; id: number; winRate: number } | null
}

function formatTrophies(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toString()
}

function brawlerSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-")
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
      href: data?.brawler ? `/brawlers/${brawlerSlug(data.brawler.name)}` : "/brawlers",
    },
    {
      label: "TOP MAP",
      sub: data?.map ? `${data.map.name} · ${data.map.mode}` : null,
      href: data?.map ? `/meta/${encodeURIComponent(data.map.name)}` : "/meta",
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

      {/* Card */}
      <div className="home-hero-inner">
        <div className="home-center home-card-enter">

          <div className="home-card-wrap">
            <div className="home-card-shell" style={{ background: "var(--panel)", border: "1px solid var(--line-2)", borderRadius: 20, padding: 6, boxShadow: "0 40px 80px -40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset", position: "relative" }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 12px" }}>
                <span style={{ width: 10, height: 10, borderRadius: 4, background: "color-mix(in srgb, var(--line) 55%, transparent)", border: "1px solid var(--line)", display: "block" }} />
                <span className="bl-mono bl-caption">brawllens / ask</span>
              </div>

              <div style={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
                <svg style={{ width: 15, height: 15, color: "var(--ink-3)", flexShrink: 0, marginTop: 1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={userInput}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything, or paste a #PlayerTag"
                  style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", flex: 1, fontSize: 14, fontFamily: "inherit", resize: "none", overflow: "hidden", lineHeight: 1.5 }}
                />
                <span className="bl-mono" style={{ fontSize: 10.5, color: "var(--ink-4)", border: "1px solid var(--line)", padding: "2px 6px", borderRadius: 4, flexShrink: 0, cursor: "pointer" }} onClick={handleSubmit}>⏎</span>
              </div>

              <div style={{ padding: 4 }}>
                {jumps.map((row, i) => (
                  <a
                    key={i}
                    href={row.href}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", textDecoration: "none", transition: "background 0.13s" }}
                    className="row-hover"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="bl-caption" style={{ letterSpacing: "0.1em", marginBottom: 2 }}>{row.label}</div>
                      {row.sub ? (
                        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.sub}</div>
                      ) : (
                        <div style={{ height: 13, width: 120, borderRadius: 4, background: "var(--line-2)", marginTop: 2 }} />
                      )}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </a>
                ))}
              </div>

              <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  <span className="bl-mono bl-caption">Live data</span>
                </div>
                <span className="bl-caption bl-mono" style={{ whiteSpace: "nowrap" }}>⌘K to focus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}
