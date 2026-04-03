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
    newest: string
}

const RARITY_ORDER = [
    "Starting Brawler", "Common", "Rare", "Super Rare",
    "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 rounded text-left whitespace-nowrap"
const linkInactive = `${linkBase} text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5`
const linkActive = `${linkBase} bg-red-500 text-white dark:bg-[#FFD400] dark:text-black`

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
        <div className="flex-1 flex flex-col">
            <main className="flex-1 min-w-0 pt-6 pb-6 px-8 overflow-y-auto">
                <section className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-3 dark:text-white">
                        All {brawlers.length - 1} Brawlers (Mar 2026)
                    </h1>
                    <p className="text-zinc-500 text-sm leading-relaxed dark:text-white/40 mb-8">
                        Browse every brawler in Brawl Stars. Click on a character to see detailed stats, star powers, gadgets, gears, buffs, and skins. The newest brawler is {newest}.
                    </p>

                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-10">
                        {/* Search */}
                        <div className="flex items-center gap-2.5 bg-black/10 border border-black/20 rounded px-4 py-2.5 dark:bg-white/10 dark:border-white/20 w-full md:w-64">
                            <Search size={13} className="text-zinc-500 shrink-0 dark:text-white/60" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search brawlers"
                                className="bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 w-full dark:text-white dark:placeholder:text-white/40"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-row gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
                            <button
                                onClick={() => setActiveRarity(null)}
                                className={activeRarity === null ? linkActive : linkInactive}
                            >
                                All
                            </button>

                            {rarities.map(({ name, color }) => {
                                const isActive = activeRarity === name
                                return (
                                    <button
                                        key={name}
                                        onClick={() => setActiveRarity(isActive ? null : name)}
                                        className={isActive ? linkBase : linkInactive}
                                        style={isActive ? { backgroundColor: `${color}20`, color } : undefined}
                                    >
                                        {name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </section>
                <BrawlerCatalog brawlers={brawlers} activeRarity={activeRarity} search={search} />
            </main>
        </div>
    )
}
