import BrawlerDetailClient from "./BrawlerDetailClient"

export default async function BrawlerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const res = await fetch(`https://api.brawlify.com/v1/brawlers/${id}`, { cache: "no-store" })
    const brawler = await res.json()

    return (
        <div className="bg-black h-[calc(100dvh-52px)] flex flex-col lg:flex-row overflow-hidden">
            <BrawlerDetailClient brawler={brawler} />
        </div>
    )
}
