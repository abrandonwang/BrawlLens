import { Player, PlayerBrawler } from "@/types/brawler"
import BrawlerCard from "@/components/BrawlerCard"

export default async function PlayerProfile({ params }: { params: Promise<{ tag: string }> }) {
    const { tag } = await params
    const response = await fetch(`http://165.227.206.51:3000/player/${tag}`, { cache: "no-store" })
    const player: Player = await response.json()

    const sorted = [...(player.brawlers ?? [])].sort((a, b) => b.trophies - a.trophies)
    const club = player.club as { name?: string }

    return (
        <div className="bg-black flex-1">
            <main className="pt-32 pb-32">
                <div className="max-w-[1200px] mx-auto px-10">

                    {/* HERO */}
                    <section className="mb-20">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-4">#{tag}</p>
                        <h1 className="text-6xl md:text-[100px] font-black tracking-[-0.06em] leading-[0.85] text-white mb-6">
                            {player.name}
                        </h1>
                        {club?.name && (
                            <p className="text-sm font-bold text-white/30 mt-4">{club.name}</p>
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
                            <h2 className="text-4xl font-black tracking-tight text-white">{sorted.length} Brawlers</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Sorted by trophies</p>
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
        <div className="bg-zinc-900 border border-white/5 rounded-[28px] p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">{label}</p>
            <p className="text-3xl font-black tracking-tight text-white">{value}</p>
            {sub && <p className="text-xs font-bold text-white/20 mt-1">{sub}</p>}
        </div>
    )
}
