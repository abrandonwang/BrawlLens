
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

interface Props {
    brawler: Brawler
    activeTab: "starPowers" | "gadgets"
    setActiveTab: (tab: "starPowers" | "gadgets") => void
}

export default function BrawlerDetail({ brawler, activeTab, setActiveTab }: Props) {
    const items = activeTab === "starPowers" ? brawler.starPowers : brawler.gadgets
    const rarityColor = brawler.rarity.color

    return (
        <div>
            <div className="flex flex-col md:flex-row items-start gap-10 mb-14">
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
                        <p className="text-zinc-500 text-sm mb-4 dark:text-white/50">{brawler.class.name}</p>
                    )}
                    <p className="text-zinc-600 text-sm leading-relaxed max-w-xl dark:text-white/70">
                        {brawler.description}
                    </p>
                </div>
            </div>

            <div className="flex gap-1.5 mb-4">
                <button
                    onClick={() => setActiveTab("starPowers")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded transition-all duration-200 ${activeTab === "starPowers" ? "bg-red-500 text-white dark:bg-[#FFD400] dark:text-black" : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5"}`}
                >
                    Star Powers
                </button>
                <button
                    onClick={() => setActiveTab("gadgets")}
                    className={`text-xs font-semibold px-3 py-1.5 rounded transition-all duration-200 ${activeTab === "gadgets" ? "bg-red-500 text-white dark:bg-[#FFD400] dark:text-black" : "text-zinc-500 hover:text-zinc-900 hover:bg-black/5 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/5"}`}
                >
                    Gadgets
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-start gap-4 bg-zinc-100 border border-black/5 rounded-md p-4 hover:border-black/15 transition-colors dark:bg-zinc-900 dark:border-white/5 dark:hover:border-white/15">
                        <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-contain shrink-0" />
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 mb-1 dark:text-white">{item.name}</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed dark:text-white/60">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
