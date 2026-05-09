export type ProTeamSlug = "crazy-raccoons" | "hmble" | "zeta" | "sk-gaming"
export type ProPlayerGroup = "Main" | "Academy" | "Creator" | "Staff" | "Club"
export type ProMatchResult = "win" | "loss" | "draw"

export type ProBrawlerPick = {
  id: number
  name: string
}

export type ProPlayer = {
  id: string
  name: string
  handle: string
  realName?: string
  country?: string
  joinDate?: string
  group: ProPlayerGroup
  role: string
  tag?: string
  iconId?: number | null
  clubName?: string
  clubTag?: string
  status: "In game" | "Online" | "Reviewing" | "Offline"
  trophies: number
  wins: number
  losses: number
  prestige: number
  recentWinRate?: number | null
  bestBrawlers: ProBrawlerPick[]
}

export type ProMatch = {
  id: string
  playerId: string
  time: string
  age: string
  mode: string
  map: string
  result: ProMatchResult
  trophyDelta: number
  brawler: ProBrawlerPick
  score: number
  rankLabel: string
  teamBrawlers: ProBrawlerPick[]
  opponentBrawlers: ProBrawlerPick[]
  note: string
}

export type ProTeam = {
  slug: string
  name: string
  flagCode?: "jp" | "it" | "de"
  flagLabel?: string
  accent: string
  logoUrl?: string
  logoFilter?: string
  logoBgFilter?: string
  sourceClubTag?: string
  description: string
  players: ProPlayer[]
  recentLog: ProMatch[]
}

const BRAWLERS = {
  shelly: { id: 16000000, name: "Shelly" },
  colt: { id: 16000001, name: "Colt" },
  brock: { id: 16000003, name: "Brock" },
  bull: { id: 16000002, name: "Bull" },
  rico: { id: 16000004, name: "Rico" },
  spike: { id: 16000005, name: "Spike" },
  jessie: { id: 16000007, name: "Jessie" },
  nita: { id: 16000008, name: "Nita" },
  dynamike: { id: 16000009, name: "Dynamike" },
  mortis: { id: 16000011, name: "Mortis" },
  crow: { id: 16000012, name: "Crow" },
  piper: { id: 16000015, name: "Piper" },
  tara: { id: 16000017, name: "Tara" },
  darryl: { id: 16000018, name: "Darryl" },
  gene: { id: 16000021, name: "Gene" },
  leon: { id: 16000023, name: "Leon" },
  carl: { id: 16000025, name: "Carl" },
  bibi: { id: 16000026, name: "Bibi" },
  sandy: { id: 16000028, name: "Sandy" },
  bea: { id: 16000029, name: "Bea" },
  emz: { id: 16000030, name: "Emz" },
  max: { id: 16000032, name: "Max" },
  sprout: { id: 16000037, name: "Sprout" },
  surge: { id: 16000038, name: "Surge" },
  amber: { id: 16000040, name: "Amber" },
  byron: { id: 16000042, name: "Byron" },
  ruffs: { id: 16000044, name: "Ruffs" },
  stu: { id: 16000045, name: "Stu" },
  belle: { id: 16000046, name: "Belle" },
  squeak: { id: 16000047, name: "Squeak" },
  buzz: { id: 16000049, name: "Buzz" },
  griff: { id: 16000050, name: "Griff" },
  ash: { id: 16000051, name: "Ash" },
  meg: { id: 16000052, name: "Meg" },
  fang: { id: 16000054, name: "Fang" },
  eve: { id: 16000056, name: "Eve" },
  janet: { id: 16000057, name: "Janet" },
  gus: { id: 16000061, name: "Gus" },
  chester: { id: 16000063, name: "Chester" },
  rt: { id: 16000066, name: "R-T" },
  mandy: { id: 16000065, name: "Mandy" },
  maisie: { id: 16000068, name: "Maisie" },
  cordelius: { id: 16000070, name: "Cordelius" },
  chuck: { id: 16000073, name: "Chuck" },
  charlie: { id: 16000074, name: "Charlie" },
  melodie: { id: 16000078, name: "Melodie" },
  moe: { id: 16000084, name: "Moe" },
  shade: { id: 16000086, name: "Shade" },
  kaze: { id: 16000094, name: "Kaze" },
  mina: { id: 16000097, name: "Mina" },
  pierce: { id: 16000099, name: "Pierce" },
  sirius: { id: 16000102, name: "Sirius" },
  najia: { id: 16000103, name: "Najia" },
} satisfies Record<string, ProBrawlerPick>

function pick(...keys: (keyof typeof BRAWLERS)[]) {
  return keys.map(key => BRAWLERS[key])
}

function player(
  id: string,
  name: string,
  group: ProPlayerGroup,
  trophies: number,
  wins: number,
  losses: number,
  prestige: number,
  bestBrawlers: ProBrawlerPick[],
  role = "Flex",
  status: ProPlayer["status"] = "Online",
  meta: Partial<Pick<ProPlayer, "realName" | "country" | "joinDate" | "tag" | "clubName" | "clubTag">> = {},
): ProPlayer {
  return {
    id,
    name,
    handle: name,
    ...meta,
    group,
    role,
    status,
    trophies,
    wins,
    losses,
    prestige,
    bestBrawlers,
  }
}

function staff(
  id: string,
  name: string,
  role: string,
  meta: Partial<Pick<ProPlayer, "realName" | "country" | "joinDate">> = {},
): ProPlayer {
  return player(id, name, "Staff", 0, 0, 0, 0, [], role, "Offline", meta)
}

function clubMember(id: string, name: string, tag: string, trophies: number, role: string): ProPlayer {
  return player(id, name, "Club", trophies, 0, 0, 0, [], role, "Offline", {
    tag,
    clubName: "Team HMBLE",
    clubTag: "2UQQL0CLY",
  })
}

function match(
  id: string,
  playerId: string,
  time: string,
  age: string,
  mode: string,
  map: string,
  result: ProMatchResult,
  trophyDelta: number,
  brawler: ProBrawlerPick,
  score: number,
  rankLabel: string,
  teamBrawlers: ProBrawlerPick[],
  opponentBrawlers: ProBrawlerPick[],
  note: string,
): ProMatch {
  return {
    id,
    playerId,
    time,
    age,
    mode,
    map,
    result,
    trophyDelta,
    brawler,
    score,
    rankLabel,
    teamBrawlers,
    opponentBrawlers,
    note,
  }
}

export const proTeams: ProTeam[] = [
  {
    slug: "crazy-raccoons",
    name: "Crazy Raccoons",
    flagCode: "jp",
    flagLabel: "Japan",
    accent: "#e43747",
    logoUrl: "/team-logos/crazy-raccoons.webp",
    logoBgFilter: "contrast(2.15) brightness(1.12) saturate(1.25)",
    sourceClubTag: "2VUVJUY0U",
    description: "Moya, Tensai, and Milkreo tracked from the public Crazy Raccoons roster, with the in-game club #2VUVJUY0U surfaced for Tensai.",
    players: [
      player("cr-tensai", "Tensai", "Main", 111426, 65238, 0, 104, pick("kaze", "pierce", "mina", "emz"), "IGL", "Online", {
        country: "Japan",
        joinDate: "2023-02-23",
        tag: "9ULYPV8",
        clubName: "Crazy Raccoon",
        clubTag: "2VUVJUY0U",
      }),
      player("cr-moya", "Moya", "Main", 100704, 87214, 0, 82, pick("mina", "pierce", "bull", "nita"), "Flex", "Online", {
        country: "Japan",
        joinDate: "2023-02-23",
        tag: "UR2UL8YR",
      }),
      player("cr-milkreo", "Milkreo", "Main", 73034, 66187, 0, 41, pick("colt", "brock", "bibi", "stu"), "Flex", "Online", {
        country: "Japan",
        joinDate: "2025-02-13",
        tag: "20C0LL00",
        clubName: "進撃のクレオ隊",
        clubTag: "80Y9YYU28",
      }),
    ],
    recentLog: [
      match("cr-1", "cr-moya", "23:11", "7m ago", "Bounty", "Canal Grande", "win", 9, BRAWLERS.max, 96, "MVP", pick("max", "byron", "gene"), pick("fang", "belle", "crow"), "Clean control lane"),
      match("cr-2", "cr-tensai", "25:06", "12m ago", "Knockout", "Goldarm Gulch", "loss", -8, BRAWLERS.fang, 61, "3rd", pick("fang", "belle", "gus"), pick("max", "piper", "sandy"), "Lost final set"),
      match("cr-3", "cr-milkreo", "31:38", "18m ago", "Gem Grab", "Hard Rock Mine", "win", 8, BRAWLERS.sandy, 91, "2nd", pick("sandy", "gene", "amber"), pick("crow", "max", "bea"), "Late countdown hold"),
      match("cr-4", "cr-moya", "23:52", "24m ago", "Heist", "Safe Zone", "draw", 0, BRAWLERS.belle, 73, "4th", pick("belle", "colt", "jessie"), pick("brock", "bea", "griff"), "Even damage split"),
      match("cr-5", "cr-tensai", "27:06", "31m ago", "Hot Zone", "Ring of Fire", "win", 10, BRAWLERS.ash, 88, "2nd", pick("ash", "byron", "squeak"), pick("surge", "gene", "meg"), "Zone pressure"),
      match("cr-6", "cr-milkreo", "30:58", "42m ago", "Brawl Ball", "Pinhole Punt", "win", 7, BRAWLERS.sprout, 84, "ACE", pick("sprout", "fang", "max"), pick("bibi", "crow", "amber"), "Opened both goals"),
    ],
  },
  {
    slug: "hmble",
    name: "HMBLE",
    flagCode: "it",
    flagLabel: "Italy",
    accent: "#8ad7ff",
    logoUrl: "https://hmble.it/images/logo/hmble-logo.png",
    logoFilter: "brightness(0) invert(1)",
    sourceClubTag: "2UQQL0CLY",
    description: "Lukii, BosS, and Symantec tracked from the HMBLE roster with Team HMBLE club #2UQQL0CLY and organization staff listed separately.",
    players: [
      player("hm-lukii", "Lukii", "Main", 113963, 81947, 0, 106, pick("bibi", "najia", "rico", "sirius"), "Player", "Online", {
        realName: "Luke Pies",
        country: "Germany",
        joinDate: "2023-06-09",
        tag: "8V92UYCJ",
      }),
      player("hm-boss", "BosS", "Main", 103640, 68654, 0, 95, pick("crow", "bull", "carl", "mortis"), "Player", "Online", {
        realName: "Bartomeu Vadell Planisi",
        country: "Spain",
        joinDate: "2024-03-08",
        tag: "V89Y2GP0",
        clubName: "CODE SYMANTEC",
        clubTag: "2VRG2G2UY",
      }),
      player("hm-symantec", "Symantec", "Main", 27500, 50586, 0, 27, pick("bull", "shelly", "colt", "brock"), "Player", "Online", {
        realName: "Bekri Tahiri",
        country: "Germany",
        joinDate: "2024-03-08",
        tag: "YQUCCJ2",
        clubName: "CODE SYMANTEC",
        clubTag: "2VRG2G2UY",
      }),
      staff("hm-ema", "Ema", "Co-Founder", { realName: "Emanuele Daneo", country: "Italy" }),
      staff("hm-vid", "Vid", "Analyst", { realName: "David Miguez", country: "Spain", joinDate: "2023-06-09" }),
      staff("hm-canaan", "Canaan", "Coach", { realName: "Canaan", country: "United Kingdom", joinDate: "2024-03-08" }),
      staff("hm-laura", "Laura", "Content Creator", { country: "Italy", joinDate: "2025-06-16" }),
      staff("hm-role", "Role", "Content Creator", { realName: "Chaiba Abdal-Lah Baar", country: "Spain", joinDate: "2026-02-06" }),
      clubMember("hm-club-gianchi", "HMB|Gianchi", "9V2VCP0Q2", 135645, "Member"),
      clubMember("hm-club-gnappy", "HMB | Gnappy", "Q0P2LRVJ", 125007, "Member"),
      clubMember("hm-club-speedy07", "Speedy07", "80U82PYRV", 121238, "Member"),
      clubMember("hm-club-cui", "HMB|cui", "2PLGPVY8Q", 120897, "Member"),
      clubMember("hm-club-michel", "HMB|Michel", "9C0RJQQCR", 120507, "Senior"),
      clubMember("hm-club-drax", "Drax", "PQQ2RV9VQ", 120112, "Member"),
      clubMember("hm-club-cobra", "HMB | Cobra", "8P9Q8VJP", 119538, "Member"),
      clubMember("hm-club-mollywater", "HMB|Mollywater", "2L2P9U98R", 116621, "Member"),
      clubMember("hm-club-nitrija", "HMB|Nitrija", "P8PRUCPQQ", 116089, "Member"),
      clubMember("hm-club-kriminal", "HMB|kRiMiNaL", "222C9QJ99J", 115539, "Senior"),
      clubMember("hm-club-brocc", "HMB|Brocc", "8GVG8GGVC", 114506, "Senior"),
      clubMember("hm-club-kazoom", "HMB|Kazoom", "PRG2L98JL", 114463, "Senior"),
      clubMember("hm-club-michix", "HMB|Michix", "9VRL00JLJ", 114135, "Senior"),
      clubMember("hm-club-lukas", "DG|LUKAS", "2YCP29JQ8", 114070, "Member"),
      clubMember("hm-club-ale", "HMB|Ale", "GG9YRPJ8", 114047, "Member"),
      clubMember("hm-club-dani", "Dani", "C8LJVGVY", 113781, "Member"),
      clubMember("hm-club-jdbelligol", "SOLO|JDBELLIGOL", "Y9Q8PVPG2", 113419, "Member"),
      clubMember("hm-club-edo", "HMB|Edo", "9UVPVY22C", 113296, "Member"),
      clubMember("hm-club-svegou", "Svegou?", "2L98RUJV0", 113232, "Senior"),
      clubMember("hm-club-mavok", "HMB|Mavok", "PU82Q2RJJ", 112741, "Member"),
      clubMember("hm-club-theoly", "HMB|ThEoLy", "889PJQG0Y", 112431, "Member"),
      clubMember("hm-club-cocco", "HMB|cocco", "LCRRGG2GY", 112096, "Member"),
      clubMember("hm-club-icericcio", "HMB|IceRiccio", "8LGLYR2PP", 110233, "Member"),
      clubMember("hm-club-amaterasu", "HMB | Amaterasu", "20899PCQJ", 109000, "Member"),
      clubMember("hm-club-highrenzo", "HMB|Highrenzo", "Q809U2G8", 108288, "President"),
      clubMember("hm-club-ema", "HMB|Ema", "2C2G0L2", 107034, "Vice President"),
      clubMember("hm-club-scarret13", "HMB|Scarret13", "2VYQJJPPV", 106751, "Member"),
      clubMember("hm-club-razer", "Razer", "G90LP9", 102323, "Senior"),
      clubMember("hm-club-chryy", "Chryy", "8V9GVRGLG", 101646, "Member"),
      clubMember("hm-club-dicos", "HMB|Dicos", "G2LUP2C", 101508, "Vice President"),
    ],
    recentLog: [
      match("hm-1", "hm-symantec", "18:42", "5m ago", "Knockout", "Out in the Open", "win", 10, BRAWLERS.belle, 98, "MVP", pick("belle", "gene", "fang"), pick("max", "piper", "byron"), "Perfect open-map picks"),
      match("hm-2", "hm-lukii", "20:15", "11m ago", "Gem Grab", "Double Swoosh", "win", 7, BRAWLERS.max, 87, "2nd", pick("max", "sandy", "amber"), pick("crow", "gus", "fang"), "Fast gem rotations"),
      match("hm-3", "hm-boss", "17:58", "19m ago", "Brawl Ball", "Super Beach", "loss", -9, BRAWLERS.buzz, 58, "6th", pick("buzz", "byron", "squeak"), pick("bibi", "tara", "max"), "Overextended lane"),
      match("hm-4", "hm-lukii", "16:34", "27m ago", "Hot Zone", "Dueling Beetles", "win", 8, BRAWLERS.bibi, 82, "3rd", pick("bibi", "gene", "ash"), pick("surge", "max", "belle"), "Held right zone"),
      match("hm-5", "hm-boss", "21:01", "36m ago", "Heist", "Bridge Too Far", "draw", 0, BRAWLERS.crow, 70, "4th", pick("crow", "colt", "jessie"), pick("brock", "bea", "belle"), "Mirrored damage"),
      match("hm-6", "hm-symantec", "22:18", "44m ago", "Wipeout", "Shooting Star", "loss", -7, BRAWLERS.bull, 53, "7th", pick("bull", "gus", "crow"), pick("piper", "belle", "max"), "Could not find flank"),
    ],
  },
  {
    slug: "zeta",
    name: "ZETA",
    flagCode: "jp",
    flagLabel: "Japan",
    accent: "#d8d1ff",
    logoUrl: "/team-logos/zeta-transparent.png",
    sourceClubTag: "80LV0JCRR",
    description: "Sitetampo, Sizuku, and Battoman/Batman tracked from ZETA DIVISION, including the public ZETA club #80LV0JCRR.",
    players: [
      player("zt-sitetampo", "Sitetampo", "Main", 112041, 86649, 0, 98, pick("bibi", "chester", "charlie", "najia"), "Player", "Online", {
        country: "Japan",
        joinDate: "2025-02-07",
        tag: "8Y98Q8U",
        clubName: "ZETA DIVISION",
        clubTag: "80LV0JCRR",
      }),
      player("zt-sizuku", "Sizuku", "Main", 101736, 83717, 0, 85, pick("kaze", "shade", "shelly", "melodie"), "Player", "Online", {
        country: "Japan",
        joinDate: "2025-02-07",
        tag: "P90RJQ8C",
      }),
      player("zt-batman", "Battoman", "Main", 94366, 61878, 0, 75, pick("najia", "tara", "sirius", "rico"), "Player", "Online", {
        country: "Japan",
        joinDate: "2026-02-06",
        tag: "P0Y8JGL0U",
      }),
      staff("zt-yapimaru", "YAPIMARU", "Content Creator", { country: "Japan", joinDate: "2025-02-07" }),
      staff("zt-mameshi", "Mameshi", "Coach", { country: "Japan", joinDate: "2026-02-06" }),
    ],
    recentLog: [
      match("zt-1", "zt-sitetampo", "24:16", "6m ago", "Gem Grab", "Crystal Arcade", "win", 11, BRAWLERS.gene, 100, "MVP", pick("gene", "max", "amber"), pick("fang", "crow", "gus"), "Pulls decided mid"),
      match("zt-2", "zt-sizuku", "24:16", "9m ago", "Knockout", "New Perspective", "win", 8, BRAWLERS.piper, 94, "2nd", pick("piper", "belle", "gus"), pick("sandy", "max", "bea"), "Long-range sweep"),
      match("zt-3", "zt-batman", "15:37", "17m ago", "Brawl Ball", "Center Stage", "loss", -9, BRAWLERS.fang, 49, "7th", pick("fang", "byron", "squeak"), pick("bibi", "tara", "max"), "Lost overtime"),
      match("zt-4", "zt-sitetampo", "19:07", "23m ago", "Hot Zone", "Ring of Fire", "win", 9, BRAWLERS.bibi, 88, "3rd", pick("bibi", "ash", "gene"), pick("surge", "meg", "belle"), "Clean zone reset"),
      match("zt-5", "zt-sizuku", "20:47", "37m ago", "Heist", "Safe Zone", "draw", 0, BRAWLERS.squeak, 76, "4th", pick("squeak", "colt", "jessie"), pick("brock", "bea", "griff"), "Even safe damage"),
      match("zt-6", "zt-batman", "34:28", "46m ago", "Wipeout", "Layer Bake", "win", 8, BRAWLERS.bibi, 82, "3rd", pick("bibi", "gus", "crow"), pick("max", "belle", "byron"), "Frontline opened map"),
    ],
  },
  {
    slug: "sk-gaming",
    name: "SK Gaming",
    flagCode: "de",
    flagLabel: "Germany",
    accent: "#ff9f6e",
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cc/SK_Gaming_Logo_2022.svg",
    logoFilter: "brightness(0) invert(1)",
    description: "Yoshi, OPE, and Nowy297 tracked as the public SK Gaming Brawl Stars roster.",
    players: [
      player("sk-yoshi", "Yoshi", "Main", 125455, 100914, 0, 102, pick("ruffs", "crow", "pierce", "rt"), "Player", "Online", {
        realName: "David Cayetano Gómez",
        country: "Spain",
        joinDate: "2023-01-31",
        tag: "CJV2PJ0R",
        clubName: "<c2> SOV</c>",
        clubTag: "2VVL8UP9J",
      }),
      player("sk-ope", "Ope", "Main", 107766, 86713, 0, 87, pick("colt", "rico", "bull", "crow"), "Player", "Online", {
        realName: "Alexis Mangelle",
        country: "France",
        joinDate: "2025-01-17",
        tag: "9LVUC2PY",
        clubName: "Talents",
        clubTag: "2GP8899V8",
      }),
      player("sk-nowy", "Nowy297", "Main", 98538, 83904, 0, 65, pick("sirius", "moe", "chester", "shelly"), "Player", "Online", {
        realName: "Damian Nowakowski",
        country: "Poland",
        joinDate: "2026-01-23",
        tag: "22CL00PG0",
        clubName: "A Few Good Boys",
        clubTag: "2LY29YLJ9",
      }),
    ],
    recentLog: [
      match("sk-1", "sk-yoshi", "23:57", "4m ago", "Knockout", "Out in the Open", "win", 10, BRAWLERS.mandy, 97, "MVP", pick("mandy", "gene", "fang"), pick("max", "piper", "byron"), "First-pick range paid"),
      match("sk-2", "sk-ope", "33:15", "13m ago", "Gem Grab", "Double Swoosh", "win", 7, BRAWLERS.max, 89, "2nd", pick("max", "sandy", "amber"), pick("crow", "gus", "fang"), "Fast mid rotation"),
      match("sk-3", "sk-nowy", "19:24", "18m ago", "Brawl Ball", "Super Beach", "loss", -8, BRAWLERS.surge, 57, "6th", pick("surge", "byron", "squeak"), pick("bibi", "tara", "max"), "Late goal conceded"),
      match("sk-4", "sk-yoshi", "28:04", "25m ago", "Hot Zone", "Dueling Beetles", "win", 8, BRAWLERS.crow, 81, "3rd", pick("crow", "gene", "ash"), pick("surge", "max", "belle"), "Poison kept trades low"),
      match("sk-5", "sk-ope", "31:20", "34m ago", "Heist", "Bridge Too Far", "draw", 0, BRAWLERS.griff, 71, "4th", pick("griff", "colt", "jessie"), pick("brock", "bea", "belle"), "Damage race tied"),
      match("sk-6", "sk-nowy", "21:48", "49m ago", "Wipeout", "Shooting Star", "loss", -7, BRAWLERS.mortis, 52, "7th", pick("mortis", "gus", "crow"), pick("piper", "belle", "max"), "Low conversion flanks"),
    ],
  },
]

export function getProTeam(slug: string) {
  return proTeams.find(team => team.slug === slug)
}

export function getWinRate(player: ProPlayer) {
  if (typeof player.recentWinRate === "number") return player.recentWinRate
  const total = player.wins + player.losses
  return player.losses > 0 && total ? Math.round((player.wins / total) * 100) : null
}

export function getTeamAverages(team: ProTeam) {
  const players = team.players.filter(player => player.trophies > 0 || player.wins > 0 || player.losses > 0)
  const totalTrophies = players.reduce((sum, player) => sum + player.trophies, 0)
  const totalWins = players.reduce((sum, player) => sum + player.wins, 0)
  const totalPrestige = players.reduce((sum, player) => sum + player.prestige, 0)
  return {
    averageTrophies: Math.round(totalTrophies / Math.max(1, players.length)),
    totalWins,
    totalPrestige,
    creators: players.filter(player => player.group === "Creator").length,
    academy: players.filter(player => player.group === "Academy").length,
  }
}
