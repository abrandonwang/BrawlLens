// Buffy data keyed by brawler ID.
// For gadgets/starPowers: key is the exact ability name from Brawlify.
// Value is the full description when the buffy is applied.
// For hypercharge: the enhanced description when buffy is applied.

export interface BrawlerBuffies {
  gadgets?: Record<string, string>
  starPowers?: Record<string, string>
  hypercharge?: string
}

export const BUFFIES: Record<number, BrawlerBuffies> = {

  16000000: {
    gadgets: {
      "Fast Forward": "Shelly dashes forward and becomes invulnerable for 0.5 seconds. The dash direction can be aimed.",
    },
    starPowers: {
      "Shell Shock": "Shelly's Super slows enemies. With this buffy, consecutive hits increase the slow duration.",
    },
    hypercharge: "Super projectiles travel significantly faster and cover more distance.",
  },

  16000001: {
    gadgets: {
      "Speedloader": "Fires two quick shots that slow enemies. Each hit also steals one ammo from the target.",
      "Silver Bullet": "Fires a single enlarged bullet that deals significantly increased damage.",
    },
    starPowers: {
      "Slick Boots": "Colt gains a burst of movement speed whenever he deals damage to an enemy.",
    },
    hypercharge: "Fires the same number of bullets in a much shorter timeframe, releasing the Super faster.",
  },

  16000002: {
    gadgets: {
      "T-Bone Missile": "Marks the target for 5 seconds. Bull gains 50% lifesteal against marked targets.",
      "Stomper": "Stunning an enemy grants Bull 30% movement speed for 3 seconds.",
    },
    starPowers: {
      "Berserker": "Defeating a brawler while the Berserker effect is active instantly charges Bull's Super.",
      "Tough Guy": "Defeating a brawler makes Bull immune to all damage for 0.5 seconds.",
    },
    hypercharge: "Main attack pierces all enemies hit, but deals slightly less damage at long range.",
  },

  16000008: {
    gadgets: {
      "Bear Paws": "Bruce's next attack deals 50% bonus damage after using this gadget.",
      "Faux Fur": "Both Nita and Bruce become invulnerable to all damage for 0.5 seconds.",
    },
    starPowers: {
      "Bear With Me": "Heals can overheal Nita or Bruce for up to 2000 extra health.",
      "Hyper Bear": "Summoning Bruce grants Nita 25% increased reload speed for 3 seconds.",
    },
    hypercharge: "Main attacks gain increased speed, width, and range during Hypercharge.",
  },

  16000011: {
    gadgets: {
      "Combo Spinner": "The spin is now aimable in any direction and deals bonus damage to low-health enemies.",
      "Survival Shovel": "Mortis dashes to the target location, damages enemies he passes through, and heals based on damage dealt. He takes no damage while dashing.",
    },
    starPowers: {
      "Creepy Harvest": "Defeating a brawler permanently increases Mortis's max health. Stacks until Mortis is defeated.",
    },
    hypercharge: "A phantom strike hits the same area a short delay after the initial attack.",
  },

  16000012: {
    gadgets: {
      "Instapoison": "Refreshes the poison duration on all currently poisoned enemies and grants Crow a shield.",
      "Slowing Toxin": "The poisoned kunai bounces to nearby targets, applying the same slow and poison effect.",
    },
    starPowers: {
      "Extra Toxic": "Crow deals 5% more damage for each enemy that is currently poisoned.",
      "Carrion Crow": "Poison duration is increased by an additional 1 second.",
    },
    hypercharge: "Hypercharged main attacks pierce through enemies and return to Crow after reaching max distance.",
  },

  16000014: {
    gadgets: {
      "Super Totem": "The totem's effect radius is significantly increased.",
      "Tripwire": "Detonated mines have a much larger blast radius.",
    },
    starPowers: {
      "Circling Eagle": "Bo is no longer revealed when attacking from inside bushes.",
      "Snare A Bear": "Trap placement speed is significantly increased.",
    },
    hypercharge: "Shoots a 4th arrow with each shot, and every arrow has an increased area damage radius.",
  },

  16000026: {
    gadgets: {
      "Vitamin Booster": "Instantly charges Bibi's Home Run bar. The next attack after activation restores 60% of damage dealt as health.",
      "Extra Sticky": "Throws sticky gum at an area that slows enemies. The buffy significantly increases the slow effect.",
    },
    starPowers: {
      "Home Run": "Home Run attacks deal 20% increased damage.",
      "Batting Stance": "Bibi gains a shield for 5 seconds whenever her Super hits an enemy.",
    },
    hypercharge: "Super has a shorter wind-up time before releasing.",
  },

  16000030: {
    gadgets: {
      "Friendzoner": "Enemies pushed into walls by Friendzoner are stunned on impact.",
      "Acid Spray": "The spray can now be aimed in any direction and passes through walls. Enemies hit are slowed.",
    },
    starPowers: {
      "Bad Karma": "Enemies hit by Emz's spray deal reduced damage for a short time afterward.",
    },
    hypercharge: "The spray poisons enemies, dealing damage over time and creating a lingering poison cloud for area control.",
  },

  16000023: {
    gadgets: {
      "Clone Projector": "Can be reactivated while the clone is active to swap positions with the clone.",
      "Lollipop Drop": "Leon and nearby allies gain 15% movement speed while inside the hiding area.",
    },
    starPowers: {
      "Smoke Trails": "The first attack after becoming visible deals 15% increased damage.",
      "Invisiheal": "Super invisibility duration is increased by 1 second.",
    },
    hypercharge: "Main attacks deal at least 75% of their normal damage regardless of distance.",
  },

  16000005: {
    gadgets: {
      "Popping Pincushion": "Enemies hit by all three needles from the gadget become rooted in place.",
      "Life Plant": "Spike can throw his potted cactus. It explodes when destroyed, knocking back nearby enemies.",
    },
    starPowers: {
      "Fertilize": "Heals Spike based on damage dealt by his Super. Also significantly increases projectile speed.",
    },
    hypercharge: "Basic attack grenades detonate twice, each time dealing full damage and covering a larger area.",
  },

  16000020: {
    gadgets: {
      "Active Noise Canceling": "The soundwave can now be aimed. Frank becomes immune to crowd control and destroys incoming projectiles during the effect.",
      "Irresistible Attraction": "The pull has increased range and slows enemies hit.",
    },
    starPowers: {
      "Power Grab": "Frank deals increased damage and heals when defeating an enemy.",
      "Sponge": "Frank gains resistance to knockback effects.",
    },
    hypercharge: "Frank attacks at maximum speed during Hypercharge, and main attacks apply a stun effect.",
  },
}
