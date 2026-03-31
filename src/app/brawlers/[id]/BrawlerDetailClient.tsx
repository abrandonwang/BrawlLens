"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import BrawlerDetail from "@/components/BrawlerDetail"

interface StarPower {
    id: number
    name: string
    description: string
    imageUrl: string
}

interface Gadget {
    id: number
    name: string
    description: string
    imageUrl: string
}

interface Brawler {
    id: number
    name: string
    description: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
    class: { id: number; name: string }
    starPowers: StarPower[]
    gadgets: Gadget[]
}

const linkBase = "text-xs font-semibold tracking-tight transition-all duration-200 px-3 py-1.5 rounded text-left whitespace-nowrap"
const linkInactive = `${linkBase} text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5`
const linkActive = `${linkBase} bg-red-500 text-white dark:bg-[#FFD400] dark:text-black`

export default function BrawlerDetailClient({ brawler }: { brawler: Brawler }) {
    const [activeTab, setActiveTab] = useState<"starPowers" | "gadgets">("starPowers")

    return (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <aside className="w-full lg:w-64 shrink-0 h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-black/10 py-5 lg:py-10 px-5 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto dark:border-white/10">
                <Link
                    href="/brawlers"
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors px-3 py-1.5 mb-2 shrink-0 dark:text-white/40 dark:hover:text-white"
                >
                    <ArrowLeft size={13} />
                    Back
                </Link>

                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 mb-1 hidden lg:block dark:text-white/30">View</p>

                <button
                    onClick={() => setActiveTab("starPowers")}
                    className={activeTab === "starPowers" ? linkActive : linkInactive}
                >
                    Star Powers
                </button>
                <button
                    onClick={() => setActiveTab("gadgets")}
                    className={activeTab === "gadgets" ? linkActive : linkInactive}
                >
                    Gadgets
                </button>
            </aside>

            <main className="flex-1 min-w-0 pt-6 pb-6 px-8 overflow-y-auto">
                <BrawlerDetail brawler={brawler} activeTab={activeTab} />
            </main>
        </div>
    )
}
