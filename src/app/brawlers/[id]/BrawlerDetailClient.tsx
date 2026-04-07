"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import BrawlerDetail from "@/components/BrawlerDetail"

interface Brawler {
    id: number
    name: string
    description: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
    class: { id: number; name: string }
    starPowers: { id: number; name: string; description: string; imageUrl: string }[]
    gadgets: { id: number; name: string; description: string; imageUrl: string }[]
}

export default function BrawlerDetailClient({ brawler }: { brawler: Brawler }) {
    return (
        <div className="flex flex-col px-8 pt-6 pb-10">
            <Link
                href="/brawlers"
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors dark:text-white/40 dark:hover:text-white mb-6 w-fit"
            >
                <ArrowLeft size={13} />
                Back
            </Link>
            <BrawlerDetail brawler={brawler} />
        </div>
    )
}
