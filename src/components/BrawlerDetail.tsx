"use client"

import { useState } from "react"
import { HYPERCHARGES } from "@/data/hypercharges"
import { BUFFIES } from "@/data/buffies"

function cleanDesc(text: string) {
  return text.replace(/<![\w.]+>/g, "X")
}

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

function GlowCard({
    children,
    variant,
    className = "",
}: {
    children: React.ReactNode
    variant: "gadget" | "starpower" | "hypercharge" | "buffied"
    className?: string
}) {
    const glowClass = {
        gadget: "glow-gadget",
        starpower: "glow-starpower",
        hypercharge: "glow-hypercharge",
        buffied: "glow-buffied",
    }[variant]

    return (
        <div className={`p-[1.5px] rounded-xl ${glowClass} ${className}`}>
            <div className="bg-white dark:bg-[#111] rounded-[10.5px] h-full overflow-hidden">
                {children}
            </div>
        </div>
    )
}

function ItemGrid({
    items,
    buffyMap,
    buffied,
    variant,
}: {
    items: (StarPower | Gadget)[]
    buffyMap?: Record<string, string>
    buffied: boolean
    variant: "gadget" | "starpower"
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map(item => {
                const buffy = buffyMap?.[item.name]
                const isBuffied = buffied && !!buffy
                const desc = isBuffied ? buffy! : cleanDesc(item.description)
                const cardVariant = isBuffied ? "buffied" : variant
                return (
                    <GlowCard key={item.id} variant={cardVariant}>
                        <div className="flex items-start gap-4 p-4">
                            <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-contain shrink-0" />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{item.name}</h3>
                                    {isBuffied && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm btn-buffied text-white shrink-0">
                                            Buffied
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed dark:text-white/75">{desc}</p>
                            </div>
                        </div>
                    </GlowCard>
                )
            })}
        </div>
    )
}

export default function BrawlerDetail({ brawler }: { brawler: Brawler }) {
    const [buffied, setBuffied] = useState(false)
    const rarityColor = brawler.rarity.color
    const hypercharge = HYPERCHARGES[brawler.id]
    const buffies = BUFFIES[brawler.id]

    const hcDesc = buffied && buffies?.hypercharge
        ? buffies.hypercharge
        : hypercharge?.description

    const hcVariant = buffied && buffies?.hypercharge ? "buffied" : "hypercharge"

    return (
        <div>
            <div className="flex flex-col md:flex-row items-start gap-10 mb-10">
                <div
                    className="w-48 h-48 rounded-lg border-2 p-4 shrink-0 flex items-center justify-center"
                    style={{ borderColor: rarityColor, backgroundColor: `${rarityColor}10` }}
                >
                    <img src={brawler.imageUrl2} alt={brawler.name} className="w-full h-full object-contain" />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{brawler.name}</h1>
                        <span
                            className="px-3 py-1 rounded-lg text-xs font-semibold"
                            style={{ color: rarityColor, backgroundColor: `${rarityColor}15`, border: `1px solid ${rarityColor}40` }}
                        >
                            {brawler.rarity.name}
                        </span>
                    </div>
                    {brawler.class.name !== "Unknown" && (
                        <p className="text-zinc-500 text-sm mb-4 dark:text-white/65">{brawler.class.name}</p>
                    )}
                    <p className="text-zinc-600 text-sm leading-relaxed max-w-xl dark:text-white/80">
                        {brawler.description}
                    </p>
                </div>
            </div>

            {buffies && (
                <div className="mb-8">
                    <div className={`inline-flex p-[1.5px] rounded-lg glow-buffied transition-opacity ${buffied ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
                        <button
                            onClick={() => setBuffied(b => !b)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-[6.5px] bg-white dark:bg-[#111] text-xs font-bold text-zinc-900 dark:text-white"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                            {buffied ? "Buffies On" : "Apply Buffies"}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-10">
                {brawler.gadgets.length > 0 && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/50 mb-3">Gadgets</h2>
                        <ItemGrid items={brawler.gadgets} buffyMap={buffies?.gadgets} buffied={buffied} variant="gadget" />
                    </div>
                )}

                {brawler.starPowers.length > 0 && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/50 mb-3">Star Powers</h2>
                        <ItemGrid items={brawler.starPowers} buffyMap={buffies?.starPowers} buffied={buffied} variant="starpower" />
                    </div>
                )}

                {hypercharge && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-white/50 mb-3">Hypercharge</h2>
                        <GlowCard variant={hcVariant}>
                            <div className="p-3">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-7 h-7 rounded-md bg-[#a855f7]/15 border border-[#a855f7]/30 flex items-center justify-center shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">{hypercharge.name}</h3>
                                            {buffied && buffies?.hypercharge && (
                                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm btn-buffied text-white shrink-0">
                                                    Buffied
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed dark:text-white/75">{hcDesc}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#a855f7]/15">
                                    <span className="text-[10px] font-semibold px-2 py-1 rounded bg-red-500/10 text-red-500 dark:bg-red-500/15">
                                        +{hypercharge.damageBoost}% Damage
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-500 dark:bg-blue-500/15">
                                        +{hypercharge.shieldBoost}% Shield
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-1 rounded bg-green-500/10 text-green-500 dark:bg-green-500/15">
                                        +{hypercharge.speedBoost}% Speed
                                    </span>
                                </div>
                            </div>
                        </GlowCard>
                    </div>
                )}
            </div>
        </div>
    )
}
