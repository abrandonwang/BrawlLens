"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import BrawlerCatalog from "@/components/BrawlerCatalog"

interface Brawler {
    id: number
    name: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
}

interface Props {
    brawlers: Brawler[]
    newest?: string
}

const RARITY_ORDER = [
    "Starting Brawler", "Common", "Rare", "Super Rare",
    "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

export default function BrawlerPageClient({ brawlers, newest }: Props) {
    const [activeRarity, setActiveRarity] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    const rarities = useMemo(() =>
        RARITY_ORDER.map(name => ({
            name,
            color: brawlers.find(b => b.rarity.name === name)?.rarity.color ?? "#fff"
        })).filter(r => brawlers.some(b => b.rarity.name === r.name)),
        [brawlers]
    )

    return (
        <div className="roster-page">

            <h1 className="bl-h-display roster-title">The Roster</h1>

            <div className="bl-input roster-search">
                <Search size={13} style={{ color: "var(--ink-4)", flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brawlers" />
            </div>

            <div className="roster-filters">
                <button
                    onClick={() => setActiveRarity(null)}
                    className="bl-btn bl-btn-sm"
                    style={!activeRarity ? { background: "var(--elev)", borderColor: "var(--line-2)" } : {}}
                >
                    All
                </button>
                {rarities.map(r => (
                    <button
                        key={r.name}
                        onClick={() => setActiveRarity(activeRarity === r.name ? null : r.name)}
                        className="bl-btn bl-btn-sm"
                        style={activeRarity === r.name ? { background: "var(--elev)", borderColor: "var(--line-2)" } : {}}
                    >
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: r.color, flexShrink: 0, display: "inline-block" }} />
                        {r.name}
                    </button>
                ))}
            </div>

            <BrawlerCatalog brawlers={brawlers} activeRarity={activeRarity} search={search} />
        </div>
    )
}
