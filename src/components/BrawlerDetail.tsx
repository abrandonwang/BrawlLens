"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

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

export default function BrawlerDetail({ brawler }: { brawler: Brawler }) {
    const [activeTab, setActiveTab] = useState<"starPowers" | "gadgets"> ("starPowers");
    const items = activeTab === "starPowers" ? brawler.starPowers : brawler.gadgets;

    const rarityColor = brawler.rarity.color

    return (
        <div>
            <Link
                href="/brawlers"
                className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
            >
                <ArrowLeft size={14} />
                Back to all brawlers
            </Link>

            <div className="flex flex-col md:flex-row items-start gap-10 mb-14">
                <div
                    className="w-48 h-48 rounded-2xl border-2 p-4 shrink-0 flex items-center justify-center"
                    style={{ borderColor: rarityColor, backgroundColor: `${rarityColor}10` }}
                >
                    <img
                        src={brawler.imageUrl2}
                        alt={brawler.name}
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-3xl font-bold text-white">{brawler.name}</h1>
                        <span
                            className="px-3 py-1 rounded-lg text-xs font-semibold"
                            style={{ color: rarityColor, backgroundColor: `${rarityColor}15`, border: `1px solid ${rarityColor}40` }}
                        >
                            {brawler.rarity.name}
                        </span>
                    </div>
                    {brawler.class.name !== "Unknown" && (
                        <p className="text-white/50 text-sm mb-4">{brawler.class.name}</p>
                    )}
                    <p className="text-white/70 text-sm leading-relaxed max-w-xl">
                        {brawler.description}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6">
                <button
                    onClick = {() => setActiveTab("starPowers")}
                    className = {`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeTab === "starPowers" ? "bg-white text-black" : "bg-zinc-900 border border-white/10 text-white/40 hover:text-white/70"}`}
                >Star Powers</button>
                <button
                    onClick = {() => setActiveTab("gadgets")}
                    className = {`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${activeTab === "gadgets" ? "bg-white text-black" : "bg-zinc-900 border border-white/10 text-white/40 hover:text-white/70"}`}
                >Gadgets</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-start gap-4 bg-zinc-900 border border-white/5 rounded-xl p-4 hover:border-white/15 transition-colors">
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-contain shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-1">{item.name}</h3>
                            <p className="text-xs text-white/60 leading-relaxed">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}