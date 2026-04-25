"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

const word = "BRAWL · STARS · "
const reps = Array.from({ length: 16 })

const TICKER = [
  "▲ Shelly win rate +2.4%",
  "● Hard Rock Mine entered rotation",
  "★ Ryukobu takes #1 with 94,218 trophies",
  "▲ Leon +0.8% on Knockout",
  "◆ New hypercharge: Bibi",
  "● Season 42 kicks off",
  "▼ Mortis −0.3% on Brawl Ball",
  "★ THE RACER jumps to #2 in club standings",
]

const STATS = [
  { l: "BATTLES / 24H", v: "482K" },
  { l: "BRAWLERS", v: "88" },
  { l: "MAPS LIVE", v: "24" },
  { l: "TOP TROPHIES", v: "94.2K", gold: true },
]

const JUMPS = [
  { label: "PLAYER",      sub: "#GRG0L2G · Ryukobu · 94,218 🏆", gold: true,  href: "/leaderboards/players" },
  { label: "BRAWLER",     sub: "Shelly meta breakdown",             gold: false, href: "/brawlers" },
  { label: "MAP",         sub: "Hard Rock Mine · Gem Grab",         gold: false, href: "/meta" },
  { label: "LEADERBOARD", sub: "Top 200 Japan",                     gold: false, href: "/leaderboards/players" },
]

export default function Home() {
  const [userInput, setUserInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

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

  return (
    <main className="home-hero">

      <div className="hero-bg hero-bg-b" />

      <div className="home-hero-inner">

        <div className="home-center">
          <div className="home-header">
            <div className="home-header-brand">BrawlLens</div>
          </div>

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
                {JUMPS.map((row, i) => (
                  <a
                    key={i}
                    href={row.href}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer", textDecoration: "none", transition: "background 0.13s" }}
                    className="row-hover"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="bl-caption" style={{ letterSpacing: "0.1em", marginBottom: 2 }}>{row.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.sub}</div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </a>
                ))}
              </div>

              <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  <span className="bl-mono bl-caption">Updated 2m ago</span>
                </div>
                <span className="bl-caption bl-mono" style={{ whiteSpace: "nowrap" }}>⌘K to focus</span>
              </div>
            </div>

            <div style={{ position: "absolute", top: -10, right: -10, zIndex: 5, fontFamily: "Nougat, sans-serif", fontSize: 14, letterSpacing: "0.05em", color: "var(--accent)", background: "var(--bg)", padding: "4px 10px", borderRadius: 6, border: "1px solid var(--accent-line)", boxShadow: "0 8px 24px -8px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
              NEW
            </div>
          </div>
        </div>

      </div>

    </main>
  )
}
