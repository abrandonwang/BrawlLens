import BrawlerDetailClient from "./BrawlerDetailClient"
import type { Metadata } from "next"

type PageProps = { params: Promise<{ id: string }> }

async function getBrawler(id: string): Promise<Parameters<typeof BrawlerDetailClient>[0]["brawler"] | null> {
    const isNumeric = /^\d+$/.test(id)

    let brawler: unknown

    if (isNumeric) {
        const res = await fetch(`https://api.brawlify.com/v1/brawlers/${id}`, { cache: "no-store" })
        if (!res.ok) return null
        const text = await res.text()
        if (!text) return null
        brawler = JSON.parse(text)
    } else {
        const res = await fetch("https://api.brawlify.com/v1/brawlers", { cache: "no-store" })
        if (!res.ok) return null
        const data = await res.json()
        const slug = id.toLowerCase().replace(/-/g, " ")
        brawler = (data.list ?? []).find(
            (b: { name: string }) => b.name.toLowerCase() === slug
        )
        if (!brawler) return null
    }

    return brawler as Parameters<typeof BrawlerDetailClient>[0]["brawler"]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const brawler = await getBrawler(id)
    if (!brawler) return { title: "Brawler - BrawlLens" }
    return {
        title: `${brawler.name} - BrawlLens`,
        description: `${brawler.name} stats, best maps, win rates, gadgets, star powers, and hypercharge data.`,
        openGraph: {
            title: `${brawler.name} - BrawlLens`,
            description: `Brawl Stars brawler stats and kit details for ${brawler.name}.`,
            type: "website",
        },
    }
}

export default async function BrawlerPage({ params }: PageProps) {
    const { id } = await params
    const brawler = await getBrawler(id)
    if (!brawler) return <div className="p-8 text-center text-zinc-500">Brawler not found.</div>

    return (
        <div className="flex flex-col">
            <BrawlerDetailClient brawler={brawler} />
        </div>
    )
}
