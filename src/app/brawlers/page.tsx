import BrawlerPageClient from "./BrawlerPageClient"

interface Brawler { id: number; name: string; imageUrl2: string; rarity: { id: number; name: string; color: string } }

export default async function Brawlers() {
    const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
    const data = await res.json()
    const brawlers: Brawler[] = data.list ?? []
    const newest = [...brawlers].sort((a, b) => b.id - a.id)[0]
    return (
        <div className="bg-black h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden">
            <BrawlerPageClient brawlers={brawlers} newest={newest?.name ?? ""} />
        </div>
    )
}
