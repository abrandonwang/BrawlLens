import Link from "next/link"

interface Brawler {
    id: number
    name: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
}

interface Props {
    brawlers: Brawler[]
    activeRarity: string | null
    search: string
}

const RARITY_ORDER = [
    "Starting Brawler", "Common", "Rare", "Super Rare",
    "Epic", "Mythic", "Legendary", "Ultra Legendary",
]

export default function BrawlerCatalog({ brawlers, activeRarity, search }: Props) {
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
            <div className="space-y-10">
                {RARITY_ORDER.map(rarity => {
                    const group = grouped[rarity]
                    if (!group.length) return null

                    const color = group?.[0]?.rarity.color ?? "#fff"

                    return (
                        <section key={rarity}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                                <h2 className="text-sm font-semibold" style={{ color }}>{rarity}</h2>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                                {group?.map(brawler => (
                                    <Link href={`/brawlers/${brawler.id}`} key={brawler.id} className="group cursor-pointer bg-zinc-100 border border-black/5 rounded-md overflow-hidden hover:border-black/20 transition-all duration-100 dark:bg-zinc-900 dark:border-white/5 dark:hover:border-white/20">
                                        <div className="aspect-square p-1.5">
                                            <img
                                                src={brawler.imageUrl2}
                                                alt={brawler.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div className="px-2 pb-2 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                            <p className="text-[10px] font-medium text-zinc-600 truncate dark:text-white/70">{brawler.name}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
