import BrawlerDetail from "@/components/BrawlerDetail"

export default async function BrawlerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const res = await fetch(`https://api.brawlify.com/v1/brawlers/${id}`, { cache: "no-store" })
    const brawler = await res.json()

    return (
        <div className="bg-black flex-1">
            <main className="pt-32 pb-16">
                <div className="max-w-[1200px] mx-auto px-10">
                    <BrawlerDetail brawler={brawler} />
                </div>
            </main>
        </div>
    )
}
