import BrawlerCatalog from "@/components/BrawlerCatalog"

interface Brawler {
    id: number
    name: string
    imageUrl2: string
    rarity: { id: number; name: string; color: string }
}

export default async function Brawlers() {
    const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
    const data = await res.json()
    const brawlers: Brawler[] = data.list ?? []
    const newest = [...brawlers].sort((a, b) => b.id - a.id)[0]

    return (
        <div className="bg-black min-h-screen -mt-[80px] pt-[80px]">
            <main className="pt-32 pb-16">
                <div className="max-w-[1200px] mx-auto px-10">

                    <section className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
                            All {brawlers.length} Brawl Stars Characters
                        </h1>
                        <p className="text-white/40 text-sm leading-relaxed">
                            Browse every brawler in Brawl Stars. Click on a character to see detailed stats, star powers, gadgets, gears, buffs, and skins. The newest brawler is {newest?.name}.
                        </p>
                    </section>

                    <BrawlerCatalog brawlers={brawlers} />

                </div>
            </main>
        </div>
    )
}
