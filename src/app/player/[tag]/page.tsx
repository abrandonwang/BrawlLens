import { PlayerBrawler } from "@/types/brawler";
import BrawlerCard from "@/components/BrawlerCard";

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params;
    const response = await fetch(`https://api.brawlstars.com/v1/players/%23${tag}`, {
        headers: { "Authorization": `Bearer ${process.env.BRAWL_API_KEY}` }
    });
    const playerData = await response.json();
    return (
        <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="mb-8">
                <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-1">Player Profile</p>
                <h1 className="text-3xl font-extrabold text-gray-900">{playerData.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                    <span className="font-bold text-yellow-500">{playerData.trophies}</span> trophies &middot; #{tag}
                </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {playerData.brawlers?.map((brawler: PlayerBrawler) => (
                    <BrawlerCard key={brawler.id} {...brawler} />
                ))}
            </div>
        </div>
    )
}
