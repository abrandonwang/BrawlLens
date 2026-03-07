import { PlayerBrawler } from "@/types/brawler";

function BrawlerCard ({ name, power, rank, trophies, prestigeLevel, gadgets, starPowers, hyperCharges, gears, buffies }: PlayerBrawler) {
    return (
        <div className = 'p-4 border rounded-lg shadow-md'>
            <h2>{name}</h2>
            <p>Power: {power}</p>
            <p>rank: {rank}</p>
            <p>Trophy: {trophies}</p>
            <p>Prestige Level: {prestigeLevel}</p>
            <p>Gadgets: {gadgets.map(g => g.name).join(', ')}</p>
            <p>Star Powers: {starPowers.map(s => s.name).join(', ')}</p>
            <p>Hyper Charge: {hyperCharges.map(h => h.name).join(", ") || "None"}</p>
            <p>Gears: {gears.map(g => g.name).join(', ')}</p>
            <p>Buffies: Gadget - {buffies.gadget ? "Yes" : "No"}, Star Power - {buffies.starPower ? "Yes" : "No"}, HyperCharge - {buffies.hyperCharge ? "Yes" : "No"}</p>
        </div>
    )
}

export default BrawlerCard;