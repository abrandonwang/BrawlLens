import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Player, PlayerBrawler } from "@/types/brawler"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import { BrawlImage, brawlerIconUrl } from "@/components/BrawlImage"
import { fetchPlayerResponse } from "@/lib/playerLookup"
import { sanitizePlayerTag } from "@/lib/validation"

export const revalidate = 60

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> },
): Promise<Metadata> {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) return { title: "Player — BrawlLens" }

  try {
    const res = await fetchPlayerResponse(tag, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error()
    const data = (await res.json()) as Player
    const name = data?.name ?? `#${tag}`
    const trophies = data?.trophies ?? 0
    const description = `${name} (#${tag}) — ${trophies.toLocaleString()} trophies on BrawlLens.`
    return {
      title: `${name} — BrawlLens`,
      description,
      openGraph: { title: `${name} (#${tag})`, description, type: "profile" },
    }
  } catch {
    return {
      title: `Player #${tag} — BrawlLens`,
      description: `BrawlLens profile lookup for player #${tag}.`,
    }
  }
}

function rankColor(rank: number) {
  if (rank >= 30) return "#14B8D6"
  if (rank >= 25) return "#FB923C"
  if (rank >= 20) return "#A855F7"
  if (rank >= 15) return "#22D3EE"
  if (rank >= 10) return "#0EA5B8"
  if (rank >= 5)  return "#94A3B8"
  return "#92400E"
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K"
  return n.toLocaleString()
}

function get3v3Wins(player: Player) {
  return player["3vs3Victories"] ?? player.threesVictories ?? player.threesvictories ?? 0
}

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
  const { tag: rawTag } = await params
  const tag = sanitizePlayerTag(decodeURIComponent(rawTag))
  if (!tag) notFound()

  let player: Player
  try {
    const res = await fetchPlayerResponse(tag, { next: { revalidate: 60 } })
    if (res.status === 404) notFound()
    if (!res.ok) throw new Error()
    player = await res.json()
  } catch {
    return (
      <main className="mx-auto flex w-full max-w-[520px] flex-col items-center px-6 py-20 text-center">
        <div className="bl-mono bl-caption mb-3 text-[var(--ink-4)]">CONNECTION ERROR</div>
        <h1 className="m-0 text-[22px] font-semibold tracking-tight text-[var(--ink)]">Could not load player</h1>
        <p className="mt-2 max-w-[400px] text-[13px] leading-relaxed text-[var(--ink-3)]">
          The player API did not respond. Try again in a moment, or search for a different tag.
        </p>
        <p className="bl-mono mt-3 text-[11px] text-[var(--ink-4)]">#{tag}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link href={`/player/${tag}`} className="bl-state-action" prefetch={false}>
            Try again
          </Link>
          <Link href="/leaderboards/players" className="bl-state-action">Browse leaderboard</Link>
        </div>
      </main>
    )
  }

  const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
  const top = sorted.slice(0, 8)
  const club = player.club as { name?: string }
  const totalBrawlers = sorted.length

  const stats = [
    { label: "Trophies",  value: fmt(player.trophies ?? 0),          sub: `Best ${fmt(player.highestTrophies ?? 0)}` },
    { label: "3v3 Wins",  value: get3v3Wins(player).toLocaleString() },
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
        <div className="bl-mono bl-caption" style={{ marginBottom: 8, color: "var(--ink-4)" }}>#{tag}</div>
        <div style={{ fontSize: "clamp(40px, 7vw, 56px)", fontWeight: 600, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.07, marginBottom: 8 }}>
          {player.name}
        </div>
        {club?.name && (
          <div style={{ fontSize: 17, lineHeight: 1.47, color: "var(--ink-3)", fontWeight: 400 }}>{club.name}</div>
        )}
      </div>
      <div className="player-stats">
        {stats.map(s => (
          <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div className="bl-caption" style={{ letterSpacing: "0.08em" }}>{s.label}</div>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "0.011em", color: "var(--ink)" }}>{s.value}</div>
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
            <BrawlImage
              src={brawlerIconUrl(b.id)}
              alt={b.name}
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: "contain" }}
              sizes="28px"
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
