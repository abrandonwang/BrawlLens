import { notFound } from "next/navigation"
import { Player, PlayerBrawler } from "@/types/brawler"
import BrawlerCard from "@/components/BrawlerCard"

const PLAYER_API_URL = process.env.PLAYER_API_URL || "http://165.227.206.51:3000";

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params

    let player: Player
    try {
        const response = await fetch(`${PLAYER_API_URL}/player/${tag}`, { cache: "no-store" })
        if (response.status === 404) notFound()
        if (!response.ok) throw new Error(`Status ${response.status}`)
        player = await response.json()
    } catch {
        return (
            <div className="bg-white flex-1 flex items-center justify-center min-h-screen dark:bg-black">
                <div className="text-center">
                    <p className="text-zinc-500 text-lg font-bold dark:text-white/40">Could not load player</p>
                    <p className="text-zinc-400 text-sm mt-2 dark:text-white/20">The player API is unavailable. Try again later.</p>
                </div>
            </div>
        )
    }

    const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
    const club = player.club as { name?: string }

    return (
        <div className="bg-white flex-1 dark:bg-black">
            <main className="pt-32 pb-32">
                <div className="max-w-[1200px] mx-auto px-10">

                    {/* HERO */}
                    <section className="mb-20">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4 dark:text-white/20">#{tag}</p>
                        <h1 className="text-6xl md:text-[100px] font-black tracking-[-0.06em] leading-[0.85] text-zinc-900 mb-6 dark:text-white">
                            {player.name}
                        </h1>
                        {club?.name && (
                            <p className="text-sm font-bold text-zinc-400 mt-4 dark:text-white/30">{club.name}</p>
                        )}
                    </section>

                    {/* STATS */}
                    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-28">
                        <StatCard label="Trophies" value={(player.trophies ?? 0).toLocaleString()} sub={`Best: ${(player.highestTrophies ?? 0).toLocaleString()}`} />
                        <StatCard label="3v3 Wins" value={(player.threesvictories ?? 0).toLocaleString()} />
                        <StatCard label="Solo Wins" value={(player.soloVictories ?? 0).toLocaleString()} />
                        <StatCard label="Duo Wins" value={(player.duoVictories ?? 0).toLocaleString()} />
                    </section>

                    {/* BRAWLERS */}
                    <section>
                        <div className="flex items-end justify-between mb-10">
                            <h2 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{sorted.length} Brawlers</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/20">Sorted by trophies</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {sorted.map((brawler: PlayerBrawler) => (
                                <BrawlerCard key={brawler.id} {...brawler} />
                            ))}
                        </div>
                    </section>

                </div>
            </main>
        </div>
    )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="bg-zinc-100 border border-black/5 rounded-[28px] p-8 dark:bg-zinc-900 dark:border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 dark:text-white/30">{label}</p>
            <p className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">{value}</p>
            {sub && <p className="text-xs font-bold text-zinc-400 mt-1 dark:text-white/20">{sub}</p>}
        </div>
    )
}
