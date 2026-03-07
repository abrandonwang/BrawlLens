import { Brawler } from "@/types/brawler";
import BrawlerCard from "@/components/BrawlerCard"; 

export default function Home() {
  const brawlers: Brawler[] = [
    { name: "Shelly", rarity: "Common", power: 11, trophy: 1000, gadget: ["Gadget 1"], starPower: ["Star Power 1"], hyperCharge: true, gears: ["Gear 1"] },
    { name: "Colt", rarity: "Rare", power: 9, trophy: 800, gadget: ["Gadget 2"], starPower: ["Star Power 2"], hyperCharge: false, gears: ["Gear 2", "Gear 4"] },
    { name: "Bull", rarity: "Super Rare", power: 10, trophy: 1200, gadget: ["Gadget 3"], starPower: ["Star Power 3"], hyperCharge: true, gears: ["Gear 3"] },
  ]

  return (
    <>
      <h1>Brawl Tracker</h1>
      <p>Welcome to Brawl Tracker!</p>

      {brawlers.map(brawler => <BrawlerCard key = {brawler.name} {...brawler} />)}
    </>
  );
}
