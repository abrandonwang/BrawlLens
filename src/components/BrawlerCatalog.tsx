import type { Brawler } from "@/app/brawlers/page"

function sanitizeColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{3,6}/)
  return match ? match[0] : "#888"
}

const RARITY_ORDER = [
  "Starting Brawler", "Common", "Rare", "Super Rare",
  "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

interface Props {
  brawlers: Brawler[]
  activeRarity: string | null
  search: string
  onSelect: (b: Brawler) => void
}

export default function BrawlerCatalog({ brawlers, activeRarity, search, onSelect }: Props) {
  const filtered = brawlers.filter(b => {
    const matchesRarity = !activeRarity || b.rarity.name === activeRarity
    const matchesSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
    return matchesRarity && matchesSearch
  })

  const grouped = RARITY_ORDER.reduce((acc, rarity) => {
    acc[rarity] = filtered.filter(b => b.rarity.name === rarity)
    return acc
  }, {} as Record<string, Brawler[]>)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {RARITY_ORDER.map(rarity => {
        const group = grouped[rarity]
        if (!group.length) return null
        const color = sanitizeColor(group[0]?.rarity.color ?? "#888")

        return (
          <section key={rarity}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, display: "block" }} />
              <span className="bl-h3" style={{ fontSize: 13 }}>{rarity}</span>
              <span className="bl-caption">{group.length} brawlers</span>
              <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
            </div>

            <div className="brawler-grid">
              {group.map(brawler => (
                <button
                  key={brawler.id}
                  onClick={() => onSelect(brawler)}
                  className="bl-card"
                  style={{ textDecoration: "none", padding: 0, cursor: "pointer", width: "100%", textAlign: "left" }}
                >
                  <div style={{
                    aspectRatio: "1",
                    position: "relative",
                    background: `radial-gradient(circle at 50% 65%, color-mix(in srgb, ${color} 22%, transparent), transparent 70%)`,
                    borderRadius: "var(--r-lg) var(--r-lg) 0 0",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}>
                    <img
                      src={brawler.imageUrl2}
                      alt={brawler.name}
                      style={{ width: "85%", height: "85%", objectFit: "contain", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}
                    />
                  </div>
                  <div style={{ padding: "7px 8px 8px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em", display: "block" }}>
                      {brawler.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
