"use client"
import { useState } from "react"
import { Search } from "lucide-react"

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

export default function BrawlerCatalog({ brawlers }: { brawlers: Brawler[] }) {
    const [activeRarity, setActiveRarity] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    const rarities = RARITY_ORDER
        .map(name => ({ name, color: brawlers.find(b => b.rarity.name === name)?.rarity.color ?? "#fff" }))
        .filter(r => brawlers.some(b => b.rarity.name === r.name))

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
        <div>
            {/* FILTER BAR */}
            <div className="flex items-center gap-3 w-full mb-10 overflow-x-auto pb-1">
                <div className="flex items-center gap-2.5 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 shrink-0">
                    <Search size={13} className="text-white/30" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search brawlers..."
                        className="bg-transparent text-sm text-white/80 outline-none placeholder:text-white/25 w-36"
                    />
                </div>

                <div className="w-px h-5 bg-white/10 shrink-0" />

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setActiveRarity(null)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                            !activeRarity
                                ? "bg-white text-black"
                                : "bg-zinc-900 border border-white/10 text-white/40 hover:text-white/70"
                        }`}
                    >
                        All
                    </button>
                    {rarities.map(({ name, color }) => {
                        const isActive = activeRarity === name
                        return (
                            <button
                                key={name}
                                onClick={() => setActiveRarity(isActive ? null : name)}
                                className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all border"
                                style={{
                                    color: isActive ? color : "rgba(255,255,255,0.4)",
                                    borderColor: isActive ? color : "rgba(255,255,255,0.1)",
                                    backgroundColor: isActive ? `${color}15` : "transparent",
                                }}
                            >
                                {name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* GROUPED GRID */}
            <div className="space-y-10">
                {RARITY_ORDER.map(rarity => {
                    const group = grouped[rarity]
                    if (!group?.length) return null
                    const color = group[0]?.rarity.color ?? "#fff"

                    return (
                        <section key={rarity}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                                <h2 className="text-sm font-semibold" style={{ color }}>{rarity}</h2>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                                {group.map(brawler => (
                                    <div key={brawler.id} className="group cursor-pointer bg-zinc-900 border border-white/5 rounded-xl overflow-hidden hover:border-white/20 transition-all duration-300">
                                        <div className="aspect-square p-1.5">
                                            <img
                                                src={brawler.imageUrl2}
                                                alt={brawler.name}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="px-2 pb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <p className="text-[10px] font-medium text-white/70 truncate">{brawler.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
