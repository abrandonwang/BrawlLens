"use client"

import { useState, useMemo } from "react"
import BrawlerCatalog from "@/components/BrawlerCatalog"
import BrawlersSidebar from "@/components/BrawlersSidebar"

interface Brawler {
    id: number
    name: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
}

interface Props {
    brawlers: Brawler[]
    newest: string
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
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <BrawlersSidebar
                rarities={rarities}
                activeRarity={activeRarity}
                setActiveRarity={setActiveRarity}
                search={search}
                setSearch={setSearch}
            />
            <main className="flex-1 min-w-0 pt-6 pb-6 px-8 overflow-y-auto">
                <section className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
                        All {brawlers.length - 1} Brawlers (Mar 2026)
                    </h1>
                    <p className="text-white/40 text-sm leading-relaxed">
                        Browse every brawler in Brawl Stars. Click on a character to see detailed stats, star powers, gadgets, gears, buffs, and skins. The newest brawler is {newest}.
                    </p>
                </section>
                <BrawlerCatalog brawlers={brawlers} activeRarity={activeRarity} search={search} />
            </main>
        </div>
    )
}
