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
        <div className="flex flex-col px-8 pt-6 pb-10">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/brawlers"
                    className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors dark:text-white/40 dark:hover:text-white"
                >
                    <ArrowLeft size={13} />
                    Back
                </Link>
                <div className="flex gap-1.5">
                    <button onClick={() => setActiveTab("starPowers")} className={activeTab === "starPowers" ? linkActive : linkInactive}>
                        Star Powers
                    </button>
                    <button onClick={() => setActiveTab("gadgets")} className={activeTab === "gadgets" ? linkActive : linkInactive}>
                        Gadgets
                    </button>
                </div>
            </div>
            <BrawlerDetail brawler={brawler} activeTab={activeTab} />
        </div>
    )
}
