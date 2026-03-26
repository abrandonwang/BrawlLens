"use client"

import { Search } from "lucide-react"

interface Props {
    rarities: { name: string; color: string }[]
    activeRarity: string | null
    setActiveRarity: (r: string | null) => void
    search: string
    setSearch: (s: string) => void
}

const linkBase = "font-mono text-xs font-bold tracking-tight transition-all duration-200 px-3 py-1.5 rounded-sm text-left"
const linkInactive = `${linkBase} text-white/70 hover:text-white hover:bg-white/5`
const linkActive = `${linkBase} bg-[#FFD400] text-black`

export default function BrawlersSidebar({ rarities, activeRarity, setActiveRarity, search, setSearch }: Props) {
    return (
        <aside className="w-64 shrink-0 sticky top-0 h-screen border-r border-white/10 py-10 px-5 flex flex-col gap-1.5 overflow-y-auto">
            {/* Search */}
            <div className="flex items-center gap-2.5 bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 mb-4">
                <Search size={13} className="text-white/60 shrink-0" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search brawlers"
                    className="bg-transparent text-xs text-white outline-none placeholder:text-white/40 w-full"
                />
            </div>

            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-1">Rarity</p>

            {/* All button */}
            <button
                onClick={() => setActiveRarity(null)}
                className={activeRarity === null ? linkActive : linkInactive}
            >
                [ All ]
            </button>

            {/* Rarity buttons */}
            {rarities.map(({ name, color }) => {
                const isActive = activeRarity === name
                return (
                    <button
                        key={name}
                        onClick={() => setActiveRarity(isActive ? null : name)}
                        className={isActive ? linkBase : linkInactive}
                        style={isActive ? { backgroundColor: `${color}20`, color } : undefined}
                    >
                        [ {name} ]
                    </button>
                )
            })}
        </aside>
    )
}
