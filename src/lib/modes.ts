export interface ModeMeta {
  label: string
  color: string
}

export const MODE_CONFIG: Record<string, ModeMeta> = {
  brawlBall:    { label: "Brawl Ball",    color: "#8CA0EB" },
  gemGrab:      { label: "Gem Grab",      color: "#9B59B6" },
  knockout:     { label: "Knockout",      color: "#F9C74F" },
  bounty:       { label: "Bounty",        color: "#2ECC71" },
  heist:        { label: "Heist",         color: "#E74C3C" },
  hotZone:      { label: "Hot Zone",      color: "#E67E22" },
  wipeout:      { label: "Wipeout",       color: "#1ABC9C" },
  duels:        { label: "Duels",         color: "#E84393" },
  siege:        { label: "Siege",         color: "#636E72" },
  soloShowdown: { label: "Showdown",      color: "#2ECC71" },
  duoShowdown:  { label: "Duo SD",        color: "#00B894" },
  trioShowdown: { label: "Trio SD",       color: "#55E6C1" },
  payload:      { label: "Payload",       color: "#6C5CE7" },
  basketBrawl:  { label: "Basket Brawl",  color: "#E17055" },
  volleyBrawl:  { label: "Volley Brawl",  color: "#FDCB6E" },
  botDrop:      { label: "Bot Drop",      color: "#636E72" },
  hunters:      { label: "Hunters",       color: "#D63031" },
  trophyEscape: { label: "Trophy Escape", color: "#00CEC9" },
  paintBrawl:   { label: "Paint Brawl",   color: "#A29BFE" },
  wipeout5V5:   { label: "5v5 Wipeout",   color: "#1ABC9C" },
}

export function getModeName(mode: string): string {
  return (
    MODE_CONFIG[mode]?.label ||
    mode.charAt(0).toUpperCase() + mode.slice(1).replace(/([A-Z])/g, " $1")
  )
}

export function getModeColor(mode: string | null | undefined): string | undefined {
  if (!mode) return undefined
  return MODE_CONFIG[mode]?.color
}
