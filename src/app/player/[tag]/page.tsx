import { notFound } from "next/navigation"
import { Player, PlayerBrawler } from "@/types/brawler"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"

const PLAYER_API_URL = process.env.PLAYER_API_URL || "http://165.227.206.51:3000"

function rankColor(rank: number) {
  if (rank >= 30) return "#FFD400"
  if (rank >= 25) return "#FB923C"
  if (rank >= 20) return "#A855F7"
  if (rank >= 15) return "#22D3EE"
  if (rank >= 10) return "#EAB308"
  if (rank >= 5)  return "#94A3B8"
  return "#92400E"
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toLocaleString()
}

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params

  let player: Player
  try {
    const res = await fetch(`${PLAYER_API_URL}/player/${tag}`, { cache: "no-store" })
    if (res.status === 404) notFound()
    if (!res.ok) throw new Error()
    player = await res.json()
  } catch {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px" }}>
        <p className="bl-caption" style={{ color: "var(--ink-4)" }}>Could not load player. Try again later.</p>
      </main>
    )
  }

  const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
  const top = sorted.slice(0, 8)
  const club = player.club as { name?: string }
  const totalBrawlers = sorted.length

  const stats = [
    { label: "Trophies",  value: fmt(player.trophies ?? 0),          sub: `Best ${fmt(player.highestTrophies ?? 0)}` },
    { label: "3v3 Wins",  value: (player.threesvictories ?? 0).toLocaleString() },
    { label: "Solo Wins", value: (player.soloVictories ?? 0).toLocaleString() },
    { label: "Duo Wins",  value: (player.duoVictories ?? 0).toLocaleString() },
  ]

  return (
    <main className="player-page">

      <Link href="/leaderboards/players" className="player-back">
        <ArrowLeft size={11} />
        Leaderboard
      </Link>
      <div style={{ marginBottom: 28 }}>
        <div className="bl-mono bl-caption" style={{ marginBottom: 6, color: "var(--ink-4)" }}>#{tag}</div>
        <div style={{ fontSize: 28, fontWeight: 650, letterSpacing: "-0.03em", color: "var(--ink)", lineHeight: 1.1, marginBottom: 6 }}>
          {player.name}
        </div>
        {club?.name && (
          <div style={{ fontSize: 12, color: "var(--ink-4)", fontWeight: 500 }}>{club.name}</div>
        )}
      </div>
      <div className="player-stats">
        {stats.map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="bl-caption" style={{ letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-0.03em", color: "var(--ink)" }}>{s.value}</div>
            {s.sub && <div className="bl-caption" style={{ color: "var(--ink-4)" }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--line)", margin: "24px 0" }} />
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="bl-caption" style={{ letterSpacing: "0.08em" }}>TOP BRAWLERS</span>
        <span className="bl-caption" style={{ color: "var(--ink-4)" }}>{totalBrawlers} total</span>
      </div>

      <div className="bl-card" style={{ padding: 0, overflow: "hidden" }}>
        {top.map((b: PlayerBrawler, i) => (
          <div
            key={b.id}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderBottom: i < top.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <img
              src={`https://cdn.brawlify.com/brawlers/borderless/${b.id}.png`}
              alt={b.name}
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.name}
                </span>
                {b.hyperCharges.length > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--hc-purple)", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>HC</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="bl-mono" style={{ fontSize: 10, color: rankColor(b.rank), fontWeight: 700 }}>R{b.rank}</span>
                <span className="bl-mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>PWR {b.power}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <Trophy size={10} style={{ color: "var(--accent)", opacity: 0.7 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                {b.trophies.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

    </main>
  )
}
