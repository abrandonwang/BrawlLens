import { PlayerBrawler } from "@/types/brawler"

function rankColor(rank: number) {
    if (rank >= 30) return "text-yellow-400 bg-yellow-400/10"
    if (rank >= 25) return "text-orange-400 bg-orange-400/10"
    if (rank >= 20) return "text-purple-400 bg-purple-400/10"
    if (rank >= 15) return "text-cyan-400 bg-cyan-400/10"
    if (rank >= 10) return "text-yellow-500 bg-yellow-500/10"
    if (rank >= 5)  return "text-zinc-400 bg-white/5"
    return "text-amber-600 bg-amber-500/10"
}

export default function BrawlerCard({ id, name, power, rank, trophies, highestTrophies, gadgets, starPowers, hyperCharges, gears, prestigeLevel }: PlayerBrawler) {
    return (
        <div className="bg-zinc-100 border border-black/5 rounded-3xl overflow-hidden hover:-translate-y-1 hover:border-black/10 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 dark:bg-zinc-900 dark:border-white/5 dark:hover:border-white/10 dark:hover:shadow-black/40">

            {/* Image area */}
            <div className="relative bg-zinc-200/50 h-36 flex items-end justify-center overflow-hidden dark:bg-zinc-800/50">
                <img
                    src={`https://cdn.brawlify.com/brawlers/borderless/${id}.png`}
                    alt={name}
                    className="h-32 w-32 object-contain drop-shadow-lg"
                />
                <span className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full ${rankColor(rank)}`}>
                    R{rank}
                </span>
                {prestigeLevel > 0 && (
                    <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full text-purple-400 bg-purple-400/10">
                        P{prestigeLevel}
                    </span>
                )}
            </div>

            {/* Info area */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-black text-sm tracking-tight truncate text-zinc-900 dark:text-white">{name}</h3>
                    <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-black text-zinc-900 dark:text-white">{trophies.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-400 font-bold dark:text-white/40">/ {highestTrophies.toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full dark:bg-white dark:text-black">
                        PWR {power}
                    </span>
                    {gadgets.length > 0 && (
                        <span className="text-[10px] font-bold text-zinc-500 bg-black/5 px-2 py-0.5 rounded-full border border-black/5 dark:text-white/40 dark:bg-white/5 dark:border-white/5">
                            {gadgets.length}G
                        </span>
                    )}
                    {starPowers.length > 0 && (
                        <span className="text-[10px] font-bold text-zinc-500 bg-black/5 px-2 py-0.5 rounded-full border border-black/5 dark:text-white/40 dark:bg-white/5 dark:border-white/5">
                            {starPowers.length}SP
                        </span>
                    )}
                    {hyperCharges.length > 0 && (
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/10">
                            HC
                        </span>
                    )}
                    {gears.length > 0 && (
                        <span className="text-[10px] font-bold text-zinc-500 bg-black/5 px-2 py-0.5 rounded-full border border-black/5 dark:text-white/40 dark:bg-white/5 dark:border-white/5">
                            {gears.length}GR
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
