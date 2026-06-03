export type GearKey =
  | "damage"
  | "speed"
  | "shield"
  | "health"
  | "vision"
  | "reload"
  | "supercharge"
  | "petpower"
  | "gadgetcharge"

export interface GearInfo {
  name: string
  rarity: "Super Rare" | "Epic"
  wikiFile: string
}

export const GEARS: Record<GearKey, GearInfo> = {
  damage: { name: "Damage Gear", rarity: "Super Rare", wikiFile: "DamageGear.png" },
  speed: { name: "Speed Gear", rarity: "Super Rare", wikiFile: "SpeedGear.png" },
  shield: { name: "Shield Gear", rarity: "Super Rare", wikiFile: "ShieldGear.png" },
  health: { name: "Health Gear", rarity: "Super Rare", wikiFile: "HealthGear.png" },
  vision: { name: "Vision Gear", rarity: "Super Rare", wikiFile: "VisionGear.png" },
  gadgetcharge: { name: "Gadget Cooldown Gear", rarity: "Super Rare", wikiFile: "GadgetGear.png" },
  reload: { name: "Reload Speed Gear", rarity: "Epic", wikiFile: "ReloadGear.png" },
  supercharge: { name: "Super Charge Gear", rarity: "Epic", wikiFile: "SuperChargeGear.png" },
  petpower: { name: "Pet Power Gear", rarity: "Epic", wikiFile: "PetPowerGear.png" },
}

export interface BrawlerBuild {
  gearKeys: [GearKey, GearKey]
  gadgetIndex?: 0 | 1 | 2
  starIndex?: 0 | 1
  note?: string
}

const DEFAULT_GEARS_BY_CLASS: Record<string, [GearKey, GearKey]> = {
  Tank: ["damage", "shield"],
  Assassin: ["speed", "damage"],
  "Damage Dealer": ["damage", "shield"],
  Marksman: ["damage", "vision"],
  Controller: ["damage", "vision"],
  Artillery: ["damage", "vision"],
  Support: ["health", "speed"],
  Unclassified: ["damage", "shield"],
}

export function defaultGearsForClass(className: string | undefined): [GearKey, GearKey] {
  return DEFAULT_GEARS_BY_CLASS[className ?? ""] ?? DEFAULT_GEARS_BY_CLASS.Unclassified
}

export const BRAWLER_BUILDS: Record<number, BrawlerBuild> = {
  16000000: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Fast Forward + Band-Aid for aggressive shotgun pressure" },
  16000001: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Speedloader + Magnum Special for sustained DPS" },
  16000002: { gearKeys: ["damage", "shield"], gadgetIndex: 1, starIndex: 1, note: "Stomper + Tough Guy for tank survivability" },
  16000003: { gearKeys: ["damage", "vision"], gadgetIndex: 1, starIndex: 1, note: "Rocket Fuel + Rocket No. 4 for long-range threat" },
  16000004: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Suplex Supplement + El Fuego brawl" },
  16000005: { gearKeys: ["damage", "vision"], gadgetIndex: 1, starIndex: 1, note: "Sticky Syrup + Extra Sticky for area denial" },
  16000006: { gearKeys: ["damage", "speed"], gadgetIndex: 0, starIndex: 0, note: "Tunabot + Da Capo control" },
  16000007: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Spring Ejector + Energize turret control" },
  16000008: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Satchel Charge + Fidget Spinner burst" },
  16000009: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Magic Hand for grabs" },
  16000010: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 0, note: "Combat Stretcher + Coiled Snake mobility" },
  16000011: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Combo Spinner + Coiled Snake assassin kit" },
  16000012: { gearKeys: ["damage", "vision"], gadgetIndex: 1, starIndex: 1, note: "Slowing Toxin + Carrion Crow poison stack" },
  16000013: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Suppressive Fire + Magnum Special long range" },
  16000014: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Pulse Modulator + Plug In sustain" },
  16000015: { gearKeys: ["damage", "vision"], gadgetIndex: 1, starIndex: 1, note: "Snappy Sniping + Ambush ranged kills" },
  16000016: { gearKeys: ["damage", "health"], gadgetIndex: 0, starIndex: 0, note: "Mama's Hug + Mama's Squeeze healing" },
  16000017: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Visor + Boosted Booster shutdown" },
  16000018: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Recoiling Rotator + Steel Hoops tank" },
  16000019: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Heavy Coffer + Trick Shot bounce wall pressure" },
  16000020: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Active Noise Canceling + Sponge tanky control" },
  16000021: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Lamp Blowout + Magic Puffs support" },
  16000022: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Phase Shifter + Black Box damage stacking" },
  16000023: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Smoke Trails + Lollipop Drop ambush" },
  16000024: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Sticky Spores + Photosynthesis bush control" },
  16000025: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Power Throw + Counter Crush bruiser" },
  16000026: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Echolocation + Reserve Ball poke" },
  16000027: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Boost + Plugged In sustain" },
  16000028: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Sleep Stimulator + Rude Sands invisibility" },
  16000029: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Tactical Retreat + Friends mobility" },
  16000030: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 0, note: "Acid Spray + Bad Karma poke" },
  16000031: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Service Bell + Revolving Door spawn pressure" },
  16000032: { gearKeys: ["speed", "damage"], gadgetIndex: 1, starIndex: 1, note: "Phase Shifter + Run n Gun mobility" },
  16000034: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Heavy Metal + Mama's Hug tank carry" },
  16000035: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Pheonix + Sand Storm utility" },
  16000036: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Cute Explosives + Suction Cup wall pressure" },
  16000037: { gearKeys: ["damage", "vision"], gadgetIndex: 1, starIndex: 0, note: "Garden Mulcher + Photosynthesis lane control" },
  16000038: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Cheat Cartridge + Boosted Booster long range" },
  16000039: { gearKeys: ["damage", "shield"], gadgetIndex: 1, starIndex: 1, note: "Gotcha + Push It dash spec" },
  16000040: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Fire Starters + Wild Flames burn stack" },
  16000041: { gearKeys: ["damage", "shield"], gadgetIndex: 1, starIndex: 1, note: "Aurora Borealis + Cryo Syrup freeze lock" },
  16000042: { gearKeys: ["damage", "health"], gadgetIndex: 0, starIndex: 1, note: "Booster Shots + Malaise support" },
  16000043: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Vault Buster + Hard Hat tank" },
  16000044: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Heavy Metal + Last Blast carry" },
  16000045: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Power Surge + To the Max speed boost" },
  16000046: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Power Shield + Power Surge brawler" },
  16000047: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 0, note: "Time's Up + Chain Reaction explosions" },
  16000049: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 0, note: "Reserve Buzz + Tougher Tazer mobility" },
  16000050: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Cashback + Coin Fall coin pressure" },
  16000051: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Rotten Banana + Mad as Heck rage" },
  16000052: { gearKeys: ["damage", "shield"], gadgetIndex: 1, starIndex: 1, note: "Boosted Boosters + Plug In mech" },
  16000053: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Tornado + Misdirection support" },
  16000054: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Rolling Roundhouse + Divine Soles assassin" },
  16000056: { gearKeys: ["damage", "vision"], gadgetIndex: 1, starIndex: 1, note: "Hoppity Hop + Hardy Hopper bug stack" },
  16000057: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Backstage Pass + Spotlight long range" },
  16000058: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Sugar Rush + Black Powder dive" },
  16000059: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Pre-shot + Mecha Frenzy sentries" },
  16000060: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 0, note: "Trash Magnet + Slick Boots EMP" },
  16000061: { gearKeys: ["damage", "health"], gadgetIndex: 0, starIndex: 0, note: "Embrace the Shadows + Spirit Animal support" },
  16000062: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Reverse + Blockbuster shield bro" },
  16000063: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Salami Picnic + Single-Taker random burst" },
  16000064: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Slap Mark + Dance of Death scale" },
  16000065: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Pinhole Puncture + Calculated Sweetness assassin" },
  16000066: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Hacking + Power Surge ranged" },
  16000067: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Domesticator + Pets Pets Pets control" },
  16000068: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Finish Them + Panic Button burst" },
  16000069: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Vacuum Bubble + Welcome Swing control" },
  16000070: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Cuckoo + Friends in Low Places annoy" },
  16000071: { gearKeys: ["damage", "health"], gadgetIndex: 0, starIndex: 1, note: "Drive Thru + Hot Sauce healer" },
  16000072: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Slap Around + Heat Vision close range" },
  16000073: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Pit Stop + Choo Choo control" },
  16000074: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Last Hurrah + Spider Snack rat strats" },
  16000075: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Special Delivery + Monkey Business assassin" },
  16000076: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Kitty Hands + Power Paws healer support" },
  16000077: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Take a Hit Larry! + Pair Provider pressure" },
  16000078: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Soundbar + High Note crowd damage" },
  16000079: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Plus One + Headshot assassin" },
  16000080: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Spike Ball + Dragon Energy bruiser" },
  16000081: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 1, note: "Repotted + Spider Lily reset" },
  16000082: { gearKeys: ["damage", "health"], gadgetIndex: 0, starIndex: 0, note: "Floor is Jelly + Healing Syrup splash heal" },
  16000083: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "All Hands on Deck + Field Promotion sustained" },
  16000084: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Speed Up + Slo-Mo Replay drill" },
  16000085: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 0, note: "Cat Slice + Sushi Spree dash" },
  16000087: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Gris-Gris Pop + Voodoo Witch control" },
  16000089: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Element Master controller" },
  16000090: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Cannonball tank" },
  16000093: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 1, note: "Support builds" },
  16000095: { gearKeys: ["speed", "damage"], gadgetIndex: 0, starIndex: 0, note: "Assassin pressure" },
  16000096: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 0, note: "Ant trail control" },
  16000097: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 0, note: "Long range vortex" },
  16000098: { gearKeys: ["damage", "vision"], gadgetIndex: 0, starIndex: 1, note: "Hurricane control" },
  16000099: { gearKeys: ["damage", "shield"], gadgetIndex: 0, starIndex: 0, note: "Marksman setup" },
  16000101: { gearKeys: ["damage", "health"], gadgetIndex: 0, starIndex: 0, note: "Glow fear support" },
}

export function buildForBrawler(id: number, className: string | undefined): BrawlerBuild {
  const override = BRAWLER_BUILDS[id]
  if (override) return override
  return { gearKeys: defaultGearsForClass(className) }
}

export function gearWikiFile(key: GearKey) {
  return GEARS[key].wikiFile
}
