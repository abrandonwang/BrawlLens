import Link from "next/link"

interface Brawler {
    id: number
    name: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
}

interface Props {
    brawlers: Brawler[]
    activeRarity: string | null
    search: string
}

const RARITY_ORDER = [
    "Starting Brawler", "Common", "Rare", "Super Rare",
    "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

export default function BrawlerCatalog({ brawlers, activeRarity, search }: Props) {
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
                const color = group[0]?.rarity.color ?? "#fff"

                return (
                    <section key={rarity}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, display: "block" }} />
                            <span className="bl-h3" style={{ fontSize: 13 }}>{rarity}</span>
                            <span className="bl-caption">{group.length} brawlers</span>
                            <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                            {group.map(brawler => (
                                <Link
                                    key={brawler.id}
                                    href={`/brawlers/${brawler.id}`}
                                    className="bl-card bl-hc-hover"
                                    style={{ textDecoration: "none", padding: 0, cursor: "pointer" }}
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

                                    <div style={{ padding: "7px 8px 8px", borderTop: "1px solid var(--line)" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <span style={{ width: 4, height: 4, borderRadius: "50%", background: color, flexShrink: 0, display: "block" }} />
                                            <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
                                                {brawler.name}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
