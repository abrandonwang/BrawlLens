import { PlayerBrawler } from "@/types/brawler";

function BrawlerCard ({ name, power, rank, trophies, prestigeLevel, gadgets, starPowers, hyperCharges, gears }: PlayerBrawler) {
    return (
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-sm text-gray-900 truncate">{name}</h2>
                <span className="text-xs font-bold text-yellow-500">{trophies}</span>
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Pwr {power}</span>
                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">Rank {rank}</span>
                {prestigeLevel > 0 && <span className="text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">P{prestigeLevel}</span>}
            </div>
            <div className="space-y-1 text-xs text-gray-500">
                {gadgets.length > 0 && <p>Gadgets: {gadgets.map(g => g.name).join(', ')}</p>}
                {starPowers.length > 0 && <p>Star Powers: {starPowers.map(s => s.name).join(', ')}</p>}
                {hyperCharges.length > 0 && <p>Hyper: {hyperCharges.map(h => h.name).join(', ')}</p>}
                {gears.length > 0 && <p>Gears: {gears.map(g => g.name).join(', ')}</p>}
            </div>
        </div>
    )
}

export default BrawlerCard;