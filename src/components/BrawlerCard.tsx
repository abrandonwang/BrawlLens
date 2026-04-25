import { PlayerBrawler } from "@/types/brawler"

function rankColor(rank: number): string {
  if (rank >= 30) return "#FFD400"
  if (rank >= 25) return "#FB923C"
  if (rank >= 20) return "#A855F7"
  if (rank >= 15) return "#22D3EE"
  if (rank >= 10) return "#EAB308"
  if (rank >= 5)  return "#94A3B8"
  return "#92400E"
}

export default function BrawlerCard({ id, name, power, rank, trophies, highestTrophies, gadgets, starPowers, hyperCharges, gears, prestigeLevel }: PlayerBrawler) {
  const hasHC = hyperCharges.length > 0
  const accent = hasHC ? "var(--hc-purple)" : "var(--ink-5)"

  return (
    <div
      className={`bl-card bl-hc-hover`}
      style={{ cursor: "pointer" }}
    >
      <div style={{
        position: "relative",
        background: `radial-gradient(ellipse at 50% 70%, color-mix(in srgb, ${hasHC ? "var(--hc-purple)" : "var(--ink-4)"} 18%, transparent), var(--panel-2) 65%)`,
        height: 136,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <img
          src={`https://cdn.brawlify.com/brawlers/borderless/${id}.png`}
          alt={name}
          style={{ height: 120, width: 120, objectFit: "contain", filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.45))", position: "relative", zIndex: 1 }}
        />

        <div style={{
          position: "absolute",
          top: 10,
          right: 10,
          padding: "2px 7px",
          borderRadius: 5,
          background: "var(--bg)",
          border: `1px solid ${rankColor(rank)}40`,
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.04em",
          color: rankColor(rank),
          fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
          zIndex: 2,
        }}>
          R{rank}
        </div>

        {prestigeLevel > 0 && (
          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "2px 7px",
            borderRadius: 5,
            background: "var(--bg)",
            border: "1px solid rgba(168,85,247,0.3)",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "var(--hc-purple)",
            fontFamily: "var(--font-geist-mono, ui-monospace, monospace)",
            zIndex: 2,
          }}>
            P{prestigeLevel}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span className="bl-num" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {trophies.toLocaleString()}
            </span>
            <span className="bl-num" style={{ fontSize: 10.5, color: "var(--ink-4)" }}>
              / {highestTrophies.toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.03em",
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "2px 7px",
            borderRadius: 5,
          }}>
            PWR {power}
          </span>

          {gadgets.length > 0 && (
            <span style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--ink-3)",
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              padding: "2px 6px",
              borderRadius: 5,
            }}>
              {gadgets.length}G
            </span>
          )}

          {starPowers.length > 0 && (
            <span style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--ink-3)",
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              padding: "2px 6px",
              borderRadius: 5,
            }}>
              {starPowers.length}SP
            </span>
          )}

          {hasHC && (
            <span style={{
              fontSize: 9.5,
              fontWeight: 700,
              color: "var(--hc-purple)",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.25)",
              padding: "2px 6px",
              borderRadius: 5,
            }}>
              HC
            </span>
          )}

          {gears.length > 0 && (
            <span style={{
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--ink-3)",
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              padding: "2px 6px",
              borderRadius: 5,
            }}>
              {gears.length}GR
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
