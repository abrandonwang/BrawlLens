import { Brawler } from "@/types/brawler";

function BrawlerCard ({ name, rarity, power, trophy, gadget, starPower, hyperCharge, gears }: Brawler) {
    return (
        <div className = 'p-4 border rounded-lg shadow-md'>
            <h2>{name}</h2>
            <p>Rarity: {rarity}</p>
            <p>Power: {power}</p>
            <p>Trophy: {trophy}</p>
            <p>Gadgets: {gadget.join(", ")}</p>
            <p>Star Powers: {starPower.join(", ")}</p>
            <p>Hyper Charge: {hyperCharge ? "Yes" : "No"}</p>
            <p>Gears: {gears.join(", ")}</p>
        </div>
    )
}

export default BrawlerCard;