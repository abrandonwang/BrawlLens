export interface Accessory {
    name: string;
    id: number;
}

export interface Gear {
    name: string;
    id: number;
    level: number;
}

export interface Skin {
    name: string;
    id: number;
}

export interface Buffies {
    gadget: boolean;
    starPower: boolean;
    hyperCharge: boolean;
}

export interface PlayerBrawler {
    id: number;
    name: string;
    power: number;
    rank: number;
    trophies: number;
    highestTrophies: number;
    prestigeLevel: number;
    currentWinStreak: number;
    maxWinStreak: number;
    skin: Skin;
    gears: Gear[];
    gadgets: Accessory[];
    starPowers: Accessory[];
    hyperCharges: Accessory[];
    buffies: Buffies;
}

export interface Player {
    tag: string;
    name: string;
    trophies: number;
    highestTrophies: number;
    expLevel: number;
    threesvictories: number;
    soloVictories: number;
    duoVictories: number;
    brawlers: PlayerBrawler[];
    club: object;
    totalPrestigeLevel: number;
}