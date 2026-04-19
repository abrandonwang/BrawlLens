import BrawlerDetailClient from "./BrawlerDetailClient"

export default async function BrawlerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // If numeric ID, fetch directly. If name slug, find from full list.
    const isNumeric = /^\d+$/.test(id)

    let brawler: unknown

    if (isNumeric) {
        const res = await fetch(`https://api.brawlify.com/v1/brawlers/${id}`, { cache: "no-store" })
        if (!res.ok) return <div className="p-8 text-center text-zinc-500">Brawler not found.</div>
        const text = await res.text()
        if (!text) return <div className="p-8 text-center text-zinc-500">Brawler not found.</div>
        brawler = JSON.parse(text)
    } else {
        const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
        if (!res.ok) return <div className="p-8 text-center text-zinc-500">Brawler not found.</div>
        const data = await res.json()
        const slug = id.toLowerCase().replace(/-/g, " ")
        brawler = (data.list ?? []).find(
            (b: { name: string }) => b.name.toLowerCase() === slug
        )
        if (!brawler) return <div className="p-8 text-center text-zinc-500">Brawler not found.</div>
    }

    return (
        <div className="flex flex-col">
            <BrawlerDetailClient brawler={brawler as Parameters<typeof BrawlerDetailClient>[0]["brawler"]} />
        </div>
    )
}
