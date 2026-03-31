"use client"

import { Search } from "lucide-react"

interface Props {
    rarities: { name: string; color: string }[]
    activeRarity: string | null
    setActiveRarity: (r: string | null) => void
    search: string
    setSearch: (s: string) => void
}

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 rounded text-left whitespace-nowrap"
const linkInactive = `${linkBase} text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5`
const linkActive = `${linkBase} bg-[#FFD400] text-black`

export default function BrawlersSidebar({ rarities, activeRarity, setActiveRarity, search, setSearch }: Props) {
    return (
        <aside className="w-full lg:w-64 shrink-0 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-black/10 flex flex-col lg:overflow-y-auto dark:border-white/10">

            {/* Search */}
            <div className="px-4 pt-4 pb-3 lg:px-5 lg:pt-10 lg:pb-4">
                <div className="flex items-center gap-2.5 bg-black/10 border border-black/20 rounded px-4 py-2.5 dark:bg-white/10 dark:border-white/20">
                    <Search size={13} className="text-zinc-500 shrink-0 dark:text-white/60" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search brawlers"
                        className="bg-transparent text-xs text-zinc-900 outline-none placeholder:text-zinc-400 w-full dark:text-white dark:placeholder:text-white/40"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="lg:px-5 lg:pb-10 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible px-4 pb-3 lg:pb-0 scrollbar-none">
                <p className="hidden lg:block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-1 dark:text-white/30">Rarity</p>

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
        </aside>
    )
}
