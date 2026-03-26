import BrawlerDetail from "@/components/BrawlerDetail"
import PageSidebar from "@/components/PageSidebar"

export default async function BrawlerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const res = await fetch(`https://api.brawlify.com/v1/brawlers/${id}`, { cache: "no-store" })
    const brawler = await res.json()

    return (
        <div className="bg-black flex-1 flex">
            <PageSidebar />
            <main className="flex-1 min-w-0 pt-10 pb-16 px-8">
                <BrawlerDetail brawler={brawler} />
            </main>
        </div>
    )
}
