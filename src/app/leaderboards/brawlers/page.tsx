import Link from "next/link"

interface Brawler {
  id: number
  name: string
  imageUrl2: string
  rarity: { id: number; name: string; color: string }
}

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

const CATEGORIES = [
  { label: "Players",  href: "/leaderboards/players" },
  { label: "Clubs",    href: "/leaderboards/clubs" },
  { label: "Brawlers", href: "/leaderboards/brawlers" },
]

export default async function BrawlerLeaderboardsPage() {
  const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
  const data = await res.json()
  const brawlers: Brawler[] = data.list ?? []

  const grouped = RARITY_ORDER.reduce((acc, rarity) => {
    acc[rarity] = brawlers.filter(b => b.rarity.name === rarity)
    return acc
  }, {} as Record<string, Brawler[]>)

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 32px 80px" }}>

      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {CATEGORIES.map(c => (
          <Link
            key={c.href}
            href={c.href}
            className="bl-btn bl-btn-sm"
            style={c.href === "/leaderboards/brawlers" ? { background: "var(--elev)", borderColor: "var(--line-2)", color: "var(--ink)" } : {}}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <h1 className="bl-h-display">Brawlers</h1>
      </div>

      <div style={{ height: 1, background: "var(--line)", marginBottom: 32 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {RARITY_ORDER.map(rarity => {
          const group = grouped[rarity]
          if (!group?.length) return null
          const color = group[0].rarity.color

          return (
            <section key={rarity}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "block", flexShrink: 0 }} />
                <span className="bl-caption" style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}>{rarity}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 8 }}>
                {group.map(brawler => (
                  <Link
                    key={brawler.id}
                    href={`/leaderboards/brawlers/${brawler.id}`}
                    className="bl-card"
                    style={{ textDecoration: "none", padding: 0, overflow: "hidden", transition: "border-color 0.14s" }}
                  >
                    <div style={{ aspectRatio: "1", padding: 8, background: `radial-gradient(ellipse at 50% 30%, ${color}18, transparent 70%)` }}>
                      <img src={brawler.imageUrl2} alt={brawler.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ padding: "4px 8px 8px", borderTop: "1px solid var(--line)" }}>
                      <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink-2)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brawler.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
